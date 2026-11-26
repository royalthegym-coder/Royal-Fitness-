/**
 * The ONE client for server-side actions. Every call goes to the Cloudflare Worker
 * (VITE_WORKER_URL) with the caller's Firebase ID token; the Worker verifies the token,
 * reads the role from Firestore and rate-limits per user before touching any secret.
 * No API keys or tokens ever live in the browser or localStorage.
 */
import { auth } from './firebase';
import { WORKER_URL } from './config';

export interface WorkerResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function workerFetch<T = any>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; timeoutMs?: number } = {}
): Promise<WorkerResult<T>> {
  if (!WORKER_URL) {
    return { ok: false, status: 503, error: 'Server functions are not configured (VITE_WORKER_URL is empty).' };
  }
  const user = auth.currentUser;
  if (!user) return { ok: false, status: 401, error: 'Please sign in first.' };

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), init.timeoutMs ?? 20000);
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${WORKER_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method: init.method || (init.body !== undefined ? 'POST' : 'GET'),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, data: json, error: json?.error || `Request failed (${res.status})` };
    }
    return { ok: true, status: res.status, data: json as T };
  } catch (err: any) {
    return { ok: false, status: 0, error: err?.name === 'AbortError' ? 'Request timed out.' : 'Unable to reach the server.' };
  } finally {
    window.clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ AI trainer (Phase 2)

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface TrainerChatResult {
  ok: boolean;
  text: string;
  remaining?: number;
  error?: string;
}

/**
 * POST /ai/trainer/chat with streaming (SSE). `onDelta` receives the text so far.
 * Members: the Worker uses their own record. Staff: pass memberId to give the AI that member's context.
 */
export async function aiTrainerChat(
  messages: ChatTurn[],
  opts: { memberId?: number | null; gymId?: string | null; clientContext?: string; onDelta?: (textSoFar: string) => void; signal?: AbortSignal } = {}
): Promise<TrainerChatResult> {
  if (!WORKER_URL) return { ok: false, text: '', error: 'AI is not set up yet (VITE_WORKER_URL is empty).' };
  const user = auth.currentUser;
  if (!user) return { ok: false, text: '', error: 'Please sign in first.' };
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${WORKER_URL}/ai/trainer/chat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages.slice(-12), memberId: opts.memberId ?? undefined, gymId: opts.gymId ?? undefined, clientContext: opts.clientContext?.slice(0, 1500) || undefined, stream: true }),
      signal: opts.signal,
    });
    const type = res.headers.get('Content-Type') || '';
    if (!res.ok || !type.includes('text/event-stream') || !res.body) {
      const j = await res.json().catch(() => ({}) as any);
      if (res.ok && typeof j?.text === 'string') return { ok: true, text: j.text, remaining: j.remaining };
      return { ok: false, text: '', error: j?.error || `AI request failed (${res.status}).` };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let text = '';
    let remaining: number | undefined;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split('\n\n');
      buf = events.pop() || '';
      for (const ev of events) {
        const line = ev.trim();
        if (!line.startsWith('data:')) continue;
        try {
          const j = JSON.parse(line.slice(5).trim());
          if (typeof j.t === 'string') {
            text += j.t;
            opts.onDelta?.(text);
          }
          if (j.done) remaining = j.remaining;
        } catch {
          /* ignore partial */
        }
      }
    }
    if (!text.trim()) return { ok: false, text: '', error: 'The AI did not answer. Please try again.' };
    return { ok: true, text, remaining };
  } catch (err: any) {
    if (err?.name === 'AbortError') return { ok: false, text: '', error: 'Stopped.' };
    return { ok: false, text: '', error: 'Unable to reach the server.' };
  }
}

export interface PlanExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}
export interface PlanDay {
  day: string;
  focus: string;
  warmup?: string;
  cooldown?: string;
  exercises: PlanExercise[];
}
export interface PlanMeal {
  name: string;
  time?: string;
  items: string[];
  calories: number;
  proteinG?: number;
}
export interface MemberPlanContent {
  title: string;
  summary: string;
  durationWeeks: number;
  workout: { daysPerWeek: number; progression?: string; days: PlanDay[] };
  diet: { dailyCalories: number; proteinG: number; carbsG: number; fatsG: number; hydration?: string; meals: PlanMeal[] };
  safetyNotes: string[];
}

export interface PlanRequest {
  memberId: number;
  gymId?: string | null;
  goal?: string;
  level?: string;
  daysPerWeek?: number;
  sessionMinutes?: number;
  dietType?: string;
  calories?: number;
  allergies?: string;
  equipment?: string;
  notes?: string;
  language?: string;
}

/** POST /ai/trainer/plan — returns a draft plan; nothing is saved until the trainer approves it. */
export function aiTrainerPlan(req: PlanRequest) {
  return workerFetch<{ success: boolean; plan: MemberPlanContent; remaining: number; model: string }>('/ai/trainer/plan', {
    body: req,
    timeoutMs: 90000,
  });
}
