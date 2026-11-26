import React, { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send, Square } from 'lucide-react';
import { aiTrainerChat } from '../../../lib/apiClient';
import { clearChat, loadChat, ProgressLog, saveChat, StoredChatTurn } from '../../../lib/coachData';
import { driveFileName, FoodLog, useDriveConnected, usePersonalSettings } from '../../../lib/personalData';
import { cacheGet, connectDrive, hasDriveToken, readJson, writeJson } from '../../../lib/personalDrive';
import { useSessionStore } from '../../../lib/session';
import { WORKER_URL } from '../../../lib/config';
import { Button, Card, EmptyState, IconButton, Spinner, cx } from '../ui';

const MEMBER_SUGGESTIONS = ['Aaj ka workout kya karun?', 'Suggest a high-protein vegetarian breakfast', 'How do I fix my squat form?', 'Mera weight kam kyon nahi ho raha?'];
const STAFF_SUGGESTIONS = ['Suggest a progression for next 4 weeks', 'Which exercises should this member avoid?', 'Write a short motivation message for this member'];

/** Very small, safe formatter: **bold** and line breaks only (no HTML injection). */
const Rich: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {i > 0 && <br />}
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => (part.startsWith('**') && part.endsWith('**') ? <b key={j}>{part.slice(2, -2)}</b> : <React.Fragment key={j}>{part.replace(/^\s*[*-]\s+/, '• ')}</React.Fragment>))}
      </React.Fragment>
    ))}
  </>
);

/**
 * AI trainer chat (Gemini via the Worker, streamed). History is stored in Firestore aiChats,
 * one document per (member, signed-in user). Disabled in admin preview mode.
 */
export const AiChat: React.FC<{ gymId: string; memberId: number; memberFirstName?: string; audience: 'member' | 'staff'; preview?: boolean }> = ({
  gymId,
  memberId,
  memberFirstName,
  audience,
  preview,
}) => {
  const uid = useSessionStore((s) => s.user?.uid || '');
  const role = useSessionStore((s) => s.role || 'member');
  const [msgs, setMsgs] = useState<StoredChatTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const settings = usePersonalSettings();
  const driveConnected = useDriveConnected();
  // Members who chose Google Drive keep their chat history there (never in our database).
  const drive = audience === 'member' && !preview && settings.mode === 'drive';
  const chatFile = driveFileName(gymId, memberId, 'chat');
  const [unsaved, setUnsaved] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setMsgs([]);
    if (preview || !uid) {
      setLoading(false);
      return;
    }
    const load = async (): Promise<StoredChatTurn[]> => {
      if (!drive) return loadChat(gymId, memberId, uid);
      const cached = (await cacheGet<StoredChatTurn[]>(chatFile)) || [];
      if (live && cached.length) {
        setMsgs(cached);
        setLoading(false);
      }
      if (!hasDriveToken()) return cached;
      return (await readJson<StoredChatTurn[]>(chatFile).catch(() => null)) || cached;
    };
    void load().then((m) => {
      if (live) {
        setMsgs(m);
        setLoading(false);
      }
    });
    return () => {
      live = false;
      abortRef.current?.abort();
    };
  }, [gymId, memberId, uid, preview, drive, driveConnected, chatFile]);

  /** Recent member-reported data from their Drive, sent with the request (the Worker stays stateless). */
  const driveContext = async (): Promise<string | undefined> => {
    if (!drive) return undefined;
    const prog = (await cacheGet<ProgressLog[]>(driveFileName(gymId, memberId, 'progress'))) || [];
    const food = (await cacheGet<FoodLog[]>(driveFileName(gymId, memberId, 'food'))) || [];
    const lines: string[] = [];
    [...prog].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).forEach((p) =>
      lines.push(`progress ${p.date}: ${[p.weightKg != null ? `weight ${p.weightKg} kg` : '', p.waistCm != null ? `waist ${p.waistCm} cm` : '', p.bodyFatPct != null ? `body fat ${p.bodyFatPct}%` : ''].filter(Boolean).join(', ')}`)
    );
    [...food].sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 6).forEach((f) => lines.push(`food ${f.date} ${f.meal}: ${f.text.slice(0, 120)}${f.calories ? ` (${f.calories} kcal)` : ''}`));
    return lines.length ? lines.join('\n') : undefined;
  };

  const persist = async (done: StoredChatTurn[]) => {
    if (!drive) {
      saveChat(gymId, memberId, uid, role, done).catch((e) => console.warn('[AiChat] save failed', e?.code || e?.message));
      return;
    }
    try {
      if (!hasDriveToken()) throw new Error('no token');
      await writeJson(chatFile, done.slice(-60));
      setUnsaved(false);
    } catch {
      setUnsaved(true);
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs, streaming]);

  const send = async (textArg?: string) => {
    const text = (textArg ?? input).trim();
    if (!text || streaming !== null || preview) return;
    if (drive && !hasDriveToken()) {
      try {
        await connectDrive(); // tap = user gesture, so the Google popup is allowed
      } catch (e: any) {
        setError(e?.message || 'Connect Google Drive to keep your chat history.');
        return;
      }
    }
    setError(null);
    setInput('');
    const next: StoredChatTurn[] = [...msgs, { role: 'user', text: text.slice(0, 2000), ts: Date.now() }];
    setMsgs(next);
    setStreaming('');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const res = await aiTrainerChat(
      next.map(({ role: r, text: t }) => ({ role: r, text: t })),
      { memberId: audience === 'staff' ? memberId : undefined, gymId: role === 'super_admin' ? gymId : undefined, clientContext: await driveContext(), onDelta: (t) => setStreaming(t), signal: ctrl.signal }
    );
    setStreaming(null);
    abortRef.current = null;
    if (!res.ok) {
      setError(res.error || 'Something went wrong.');
      setMsgs(msgs); // roll back the unanswered question
      setInput(text);
      return;
    }
    const done: StoredChatTurn[] = [...next, { role: 'model', text: res.text.trim(), ts: Date.now() }];
    setMsgs(done);
    if (typeof res.remaining === 'number') setRemaining(res.remaining);
    void persist(done);
  };

  const reset = async () => {
    if (!window.confirm('Clear this chat history?')) return;
    setMsgs([]);
    if (drive) {
      if (!hasDriveToken()) await connectDrive().catch(() => undefined);
      await writeJson(chatFile, []).catch(() => undefined);
    } else {
      await clearChat(gymId, memberId, uid).catch(() => undefined);
    }
  };

  if (!WORKER_URL) {
    return (
      <Card>
        <EmptyState icon={<Bot className="w-5 h-5" />} title="AI coach is not set up yet">
          The gym owner needs to connect the AI server (see DEPLOY.md, step 4–5).
        </EmptyState>
      </Card>
    );
  }

  const suggestions = audience === 'member' ? MEMBER_SUGGESTIONS : STAFF_SUGGESTIONS;

  return (
    <Card padded={false} className="flex flex-col h-[calc(100dvh-13rem)] md:h-[calc(100dvh-9rem)] min-h-[420px]">
      <div className="px-4 py-3 border-b border-line flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand flex items-center justify-center"><Bot className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold">AI Coach{audience === 'staff' && memberFirstName ? ` · about ${memberFirstName}` : ''}</div>
          <div className="text-[11px] text-subtle truncate">
            General fitness guidance, not medical advice{drive ? ' · history in your Google Drive' : ''}{remaining != null ? ` · ${remaining} messages left today` : ''}
          </div>
        </div>
        {msgs.length > 0 && !preview && (
          <IconButton label="Clear chat" onClick={() => void reset()}>
            <RotateCcw className="w-4 h-4" />
          </IconButton>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 sm:px-4 py-4 space-y-3" aria-live="polite">
        {loading ? (
          <Spinner label="Loading chat…" />
        ) : msgs.length === 0 && streaming === null ? (
          <div className="space-y-4">
            <EmptyState icon={<Bot className="w-5 h-5" />} title={preview ? 'Chat is disabled in preview' : audience === 'member' ? `Hi${memberFirstName ? ` ${memberFirstName}` : ''}! Ask me anything about training or diet.` : 'Ask about this member’s training, diet or progress.'}>
              {preview ? 'Members chat with the AI coach from their own login.' : 'I know your goal, recent progress and the plan your trainer assigned. Write in Hindi, Hinglish or English.'}
            </EmptyState>
            {!preview && (
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => void send(s)} className="px-3 py-2 rounded-full border border-line text-xs text-muted hover:text-fg hover:border-brand/50 cursor-pointer">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {msgs.map((m, i) => (
              <div key={`${m.ts}-${i}`} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cx('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed', m.role === 'user' ? 'bg-brand text-brand-fg rounded-br-md' : 'bg-surface2 text-fg rounded-bl-md')}>
                  <Rich text={m.text} />
                </div>
              </div>
            ))}
            {streaming !== null && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed bg-surface2">
                  {streaming ? <Rich text={streaming} /> : <span className="inline-flex gap-1" aria-label="Coach is typing"><span className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce [animation-delay:120ms]" /><span className="w-1.5 h-1.5 rounded-full bg-subtle animate-bounce [animation-delay:240ms]" /></span>}
                </div>
              </div>
            )}
          </>
        )}
        {error && <p className="text-xs text-rose-500 text-center" role="alert">{error}</p>}
        {unsaved && (
          <p className="text-xs text-amber-500 text-center">
            Google Drive session expired — this chat isn’t saved yet.{' '}
            <button type="button" className="underline cursor-pointer" onClick={() => void connectDrive().then(() => persist(msgs)).catch((e) => setError(e.message))}>Reconnect & save</button>
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="p-3 border-t border-line flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          rows={1}
          maxLength={2000}
          disabled={preview}
          placeholder={preview ? 'Preview only' : 'Type your question…'}
          aria-label="Message"
          className="flex-1 resize-none max-h-32 min-h-[44px] rounded-xl bg-surface2 border border-line px-3 py-2.5 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand/60"
        />
        {streaming !== null ? (
          <Button variant="secondary" aria-label="Stop" onClick={() => abortRef.current?.abort()} icon={<Square className="w-4 h-4" />} />
        ) : (
          <Button type="submit" aria-label="Send" disabled={!input.trim() || preview} icon={<Send className="w-4 h-4" />} />
        )}
      </form>
    </Card>
  );
};

export default AiChat;
