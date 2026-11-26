import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { ArrowLeft, Bot, CalendarClock, ChevronRight, ClipboardList, Dumbbell, Home, Search, Trash2, User, Users } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { setPlanStatus, useMemberPlans } from '../../../lib/coachData';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { lazyWithRetry } from '../../lazyWithRetry';
import { Member } from '../../../types';
import PortalShell, { PortalTab } from './PortalShell';
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Select, Spinner, Stat, Tabs, Textarea, daysBetween, fmtDate, localIsoDate } from '../ui';

const ProgressPanel = lazyWithRetry(() => import('../coach/ProgressPanel'));
const AiChat = lazyWithRetry(() => import('../coach/AiChat'));
const PlanView = lazyWithRetry(() => import('../coach/PlanView'));
const PlanDraftEditor = lazyWithRetry(() => import('../coach/PlanDraftEditor'));

interface TrainerSession {
  id: string;
  gymId: string;
  trainerUid: string;
  memberId: number;
  memberName: string;
  date: string;
  durationMinutes: number;
  focus: string;
  rpe: number;
  notes: string;
  createdAtMs: number;
}

type Tab = 'today' | 'members' | 'coach';
const TABS: PortalTab<Tab>[] = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'coach', label: 'AI Coach', icon: Bot },
];
type Sub = 'overview' | 'plan' | 'progress' | 'sessions';

const expiryBadge = (m: Member, today: string) => {
  if (!m.expiryDate) return <Badge>{m.status}</Badge>;
  const d = daysBetween(today, m.expiryDate);
  if (d < 0) return <Badge tone="danger">Expired</Badge>;
  if (d <= 7) return <Badge tone="warning">{d}d left</Badge>;
  return <Badge tone="success">Active</Badge>;
};

/**
 * Trainer portal (real data only):
 *  - members whose assignedTrainerUid == this trainer (enforced by firestore.rules)
 *  - session logging, template assignment, progress, structured plans with AI drafts, AI chat
 */
export const TrainerPortal: React.FC = () => {
  const uid = useSessionStore((s) => s.user?.uid);
  const name = useSessionStore((s) => s.profile?.displayName || s.user?.displayName || s.user?.email || 'Trainer');
  const gymId = useSessionStore((s) => s.activeGymId);
  const { currentGym } = useGym();
  const { members, workoutTemplates, dietPlans, updateMember, isHydrating } = useData();
  const { addToast } = useToast();

  const [tab, setTab] = useState<Tab>('today');
  const [sub, setSub] = useState<Sub>('overview');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [coachMemberId, setCoachMemberId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sessions, setSessions] = useState<TrainerSession[]>([]);
  const [form, setForm] = useState({ date: localIsoDate(), durationMinutes: '60', focus: '', rpe: '7', notes: '' });
  const [notes, setNotes] = useState('');
  const today = localIsoDate();

  const selected = useMemo(() => members.find((m) => m.id === selectedId) || null, [members, selectedId]);
  const plans = useMemberPlans(gymId, selected?.id ?? null);
  const activePlan = plans.rows.find((p) => p.status === 'active') || null;

  useEffect(() => setNotes(selected?.trainerNotes || ''), [selected?.id, selected?.trainerNotes]);
  useEffect(() => {
    if (coachMemberId == null && members.length) setCoachMemberId(members[0].id);
  }, [members, coachMemberId]);

  useEffect(() => {
    if (!gymId || !uid) return;
    return onSnapshot(
      query(collection(db, 'trainerSessions'), where('gymId', '==', gymId), where('trainerUid', '==', uid)),
      (snap) => setSessions(snap.docs.map((d) => d.data() as TrainerSession).sort((a, b) => b.createdAtMs - a.createdAtMs)),
      (err) => console.warn('[TrainerPortal] sessions', err.message)
    );
  }, [gymId, uid]);

  const weekAgo = localIsoDate(new Date(Date.now() - 6 * 86400000));
  const todaySessions = sessions.filter((s) => s.date === today);
  const weekSessions = sessions.filter((s) => s.date >= weekAgo);
  const expiring = members.filter((m) => m.expiryDate && daysBetween(today, m.expiryDate) >= 0 && daysBetween(today, m.expiryDate) <= 7);
  const memberSessions = sessions.filter((s) => s.memberId === selectedId);
  const filtered = members.filter((m) => !search.trim() || `${m.name} ${m.phone}`.toLowerCase().includes(search.trim().toLowerCase()));

  const openMember = (id: number, s: Sub = 'overview') => {
    setSelectedId(id);
    setSub(s);
    setTab('members');
  };

  const logSession = async () => {
    if (!selected || !gymId || !uid) return;
    const id = `TS-${Date.now()}`;
    const session: TrainerSession = {
      id, gymId, trainerUid: uid, memberId: selected.id, memberName: selected.name, date: form.date,
      durationMinutes: Math.max(5, Math.min(300, Math.round(Number(form.durationMinutes) || 60))),
      focus: form.focus.trim().slice(0, 120), rpe: Math.max(1, Math.min(10, Math.round(Number(form.rpe) || 7))),
      notes: form.notes.trim().slice(0, 1000), createdAtMs: Date.now(),
    };
    try {
      await setDoc(doc(db, 'trainerSessions', `${gymId}_${id}`), session);
      addToast(`Session logged for ${selected.name}.`, 'success');
      setForm((f) => ({ ...f, focus: '', notes: '' }));
    } catch (e: any) {
      addToast(`Could not log session: ${e.code || e.message}`, 'error');
    }
  };

  const assignWorkout = (id: string) => {
    if (!selected) return;
    const w = workoutTemplates.find((x) => x.id === Number(id));
    updateMember({ ...selected, assignedWorkoutId: w ? w.id : null, approvedAiPlan: w ? w.name : undefined });
    addToast(w ? `Workout "${w.name}" assigned.` : 'Workout unassigned.', 'success');
  };
  const assignDiet = (id: string) => {
    if (!selected) return;
    const d = dietPlans.find((x) => x.id === Number(id));
    updateMember({ ...selected, assignedDietId: d ? d.id : null });
    addToast(d ? `Diet "${d.name}" assigned.` : 'Diet unassigned.', 'success');
  };
  const saveNotes = () => {
    if (!selected) return;
    updateMember({ ...selected, trainerNotes: notes.slice(0, 2000) });
    addToast('Notes saved.', 'success');
  };

  const memberRow = (m: Member, right?: React.ReactNode) => (
    <li key={m.id}>
      <button type="button" onClick={() => openMember(m.id)} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-fg/5 cursor-pointer">
        <div className="w-10 h-10 rounded-full bg-brand/15 text-brand font-bold text-sm flex items-center justify-center shrink-0">
          {(m.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{m.name}</div>
          <div className="text-[11px] text-subtle truncate">{m.fitnessGoal || 'No goal set'}{m.expiryDate ? ` · till ${fmtDate(m.expiryDate)}` : ''}</div>
        </div>
        {right ?? expiryBadge(m, today)}
        <ChevronRight className="w-4 h-4 text-subtle" />
      </button>
    </li>
  );

  const renderToday = () => (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hello, {String(name).split(/[ @]/)[0]}</h1>
        <p className="text-sm text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="My members" value={members.length} icon={<Users className="w-4 h-4" />} tone="brand" loading={isHydrating} onClick={() => setTab('members')} />
        <Stat label="Sessions today" value={todaySessions.length} icon={<Dumbbell className="w-4 h-4" />} tone="info" />
        <Stat label="Sessions (7 days)" value={weekSessions.length} icon={<CalendarClock className="w-4 h-4" />} />
        <Stat label="Expiring ≤ 7 days" value={expiring.length} icon={<CalendarClock className="w-4 h-4" />} tone={expiring.length ? 'warning' : 'neutral'} />
      </div>

      <Card padded={false}>
        <div className="px-4 pt-4 pb-1"><CardHeader title="Today’s sessions" icon={<Dumbbell className="w-4 h-4" />} /></div>
        {todaySessions.length === 0 ? (
          <EmptyState title="No sessions logged today">Open a member and use “Sessions” to log a workout.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {todaySessions.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <button type="button" className="text-left w-full cursor-pointer" onClick={() => openMember(s.memberId, 'sessions')}>
                  <div className="text-sm font-medium">{s.memberName} · {s.focus || 'Session'}</div>
                  <div className="text-[11px] text-subtle">{s.durationMinutes} min · RPE {s.rpe}</div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {expiring.length > 0 && (
        <Card padded={false}>
          <div className="px-4 pt-4 pb-1"><CardHeader title="Memberships ending soon" subtitle="Remind them to renew" icon={<CalendarClock className="w-4 h-4" />} /></div>
          <ul className="divide-y divide-line">{expiring.map((m) => memberRow(m))}</ul>
        </Card>
      )}
    </div>
  );

  const renderMemberList = () => (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search my members" className="pl-9" aria-label="Search members" />
      </div>
      <Card padded={false}>
        {isHydrating ? (
          <Spinner />
        ) : members.length === 0 ? (
          <EmptyState icon={<Users className="w-5 h-5" />} title="No members assigned yet">Ask the gym admin to assign members to you in “Team & Access”.</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState title="No match" />
        ) : (
          <ul className="divide-y divide-line">{filtered.map((m) => memberRow(m))}</ul>
        )}
      </Card>
    </div>
  );

  const renderMember = (m: Member) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => setSelectedId(null)}>Members</Button>
      </div>
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-brand/15 text-brand font-bold flex items-center justify-center shrink-0">
            {(m.name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{m.name}</h2>
            <p className="text-xs text-muted">{[m.gender, m.trainingExperience, m.phone].filter(Boolean).join(' · ') || '—'}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {expiryBadge(m, today)}
              {m.fitnessGoal && <Badge tone="brand">{m.fitnessGoal}</Badge>}
              {activePlan && <Badge tone="info">Plan: {activePlan.title}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      <Tabs<Sub>
        value={sub}
        onChange={setSub}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'plan', label: 'Plan' },
          { id: 'progress', label: 'Progress' },
          { id: 'sessions', label: 'Sessions', count: memberSessions.length },
        ]}
      />

      <Suspense fallback={<Spinner />}>
        {sub === 'overview' && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Gym templates" subtitle="Quick-assign a saved workout or diet template" icon={<ClipboardList className="w-4 h-4" />} />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Workout template">
                  <Select value={m.assignedWorkoutId ?? ''} onChange={(e) => assignWorkout(e.target.value)}>
                    <option value="">None</option>
                    {workoutTemplates.map((w) => <option key={w.id} value={w.id}>{w.name} ({w.level})</option>)}
                  </Select>
                </Field>
                <Field label="Diet template">
                  <Select value={m.assignedDietId ?? ''} onChange={(e) => assignDiet(e.target.value)}>
                    <option value="">None</option>
                    {dietPlans.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </Select>
                </Field>
              </div>
              {workoutTemplates.length === 0 && dietPlans.length === 0 && <p className="text-[11px] text-subtle mt-2">No templates yet — create a personal plan in the “Plan” tab instead.</p>}
            </Card>
            <Card>
              <CardHeader title="Trainer notes" subtitle="Injuries, preferences, form cues — the AI coach uses these" icon={<User className="w-4 h-4" />} />
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
              <Button size="sm" className="mt-2" onClick={saveNotes} disabled={notes === (m.trainerNotes || '')}>Save notes</Button>
            </Card>
            <Button variant="secondary" icon={<Bot className="w-4 h-4" />} onClick={() => { setCoachMemberId(m.id); setTab('coach'); }}>
              Ask AI Coach about {m.name.split(' ')[0]}
            </Button>
          </div>
        )}

        {sub === 'plan' && gymId && (
          <div className="space-y-4">
            {activePlan && (
              <>
                <PlanView plan={activePlan} meta={`Active · ${activePlan.source === 'ai' ? 'AI draft approved' : 'Written'} by ${activePlan.trainerName || 'trainer'} · ${fmtDate(new Date(activePlan.createdAtMs).toISOString())}`} />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void setPlanStatus(gymId, activePlan.id, 'archived').then(() => addToast('Plan archived.', 'success')).catch((e) => addToast(`Failed: ${e.code || e.message}`, 'error'))}
                >
                  Archive this plan
                </Button>
              </>
            )}
            <PlanDraftEditor gymId={gymId} member={m} existing={plans.rows} onSaved={() => undefined} />
            {plans.rows.filter((p) => p.status === 'archived').length > 0 && (
              <Card padded={false}>
                <div className="px-4 pt-4 pb-1"><CardHeader title="Previous plans" /></div>
                <ul className="divide-y divide-line">
                  {plans.rows.filter((p) => p.status === 'archived').map((p) => (
                    <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{p.title}</div>
                        <div className="text-[11px] text-subtle">{fmtDate(new Date(p.createdAtMs).toISOString())}</div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => void (activePlan ? setPlanStatus(gymId, activePlan.id, 'archived') : Promise.resolve()).then(() => setPlanStatus(gymId, p.id, 'active')).catch((e) => addToast(`Failed: ${e.code || e.message}`, 'error'))}>
                        Make active
                      </Button>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {sub === 'progress' && gymId && <ProgressPanel gymId={gymId} memberId={m.id} />}

        {sub === 'sessions' && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Log a session" icon={<Dumbbell className="w-4 h-4" />} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date"><Input type="date" value={form.date} max={today} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
                <Field label="Minutes"><Input inputMode="numeric" value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} /></Field>
                <Field label="Focus"><Input placeholder="e.g. Legs" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} /></Field>
                <Field label="Effort (RPE)">
                  <Select value={form.rpe} onChange={(e) => setForm({ ...form, rpe: e.target.value })}>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                  </Select>
                </Field>
                <Field label="Notes" className="col-span-2"><Textarea placeholder="Exercises, loads, form cues…" value={form.notes} maxLength={1000} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
              </div>
              <Button className="mt-3" onClick={() => void logSession()}>Save session</Button>
            </Card>
            <Card padded={false}>
              <div className="px-4 pt-4 pb-1"><CardHeader title="History" /></div>
              {memberSessions.length === 0 ? (
                <EmptyState title="No sessions logged yet" />
              ) : (
                <ul className="divide-y divide-line">
                  {memberSessions.map((s) => (
                    <li key={s.id} className="px-4 py-3 flex gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{fmtDate(s.date)} · {s.focus || 'Session'}</div>
                        <div className="text-[11px] text-subtle">{s.durationMinutes} min · RPE {s.rpe}</div>
                        {s.notes && <p className="text-xs text-muted mt-1 whitespace-pre-wrap">{s.notes}</p>}
                      </div>
                      <button
                        type="button"
                        aria-label="Delete session"
                        className="p-2 text-subtle hover:text-rose-500 cursor-pointer"
                        onClick={() => window.confirm('Delete this session?') && void deleteDoc(doc(db, 'trainerSessions', `${gymId}_${s.id}`)).catch((e) => addToast(`Failed: ${e.code}`, 'error'))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </Suspense>
    </div>
  );

  const coachMember = members.find((m) => m.id === coachMemberId) || null;
  const renderCoach = () => (
    <div className="space-y-3">
      {members.length === 0 ? (
        <Card><EmptyState icon={<Bot className="w-5 h-5" />} title="Assign members first">The AI coach answers about a specific member using their goal, progress and plan.</EmptyState></Card>
      ) : (
        <>
          <Field label="Member">
            <Select value={coachMemberId ?? ''} onChange={(e) => setCoachMemberId(Number(e.target.value))}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
          {coachMember && gymId && (
            <Suspense fallback={<Spinner />}>
              <AiChat key={coachMember.id} gymId={gymId} memberId={coachMember.id} memberFirstName={coachMember.name.split(' ')[0]} audience="staff" />
            </Suspense>
          )}
        </>
      )}
    </div>
  );

  return (
    <PortalShell
      title={currentGym?.gymName || 'Fitness Future'}
      subtitle={`Trainer · ${name}`}
      tabs={TABS}
      active={tab}
      onTab={(t) => {
        setTab(t);
        if (t === 'members') setSelectedId(null);
      }}
    >
      {tab === 'today' && renderToday()}
      {tab === 'members' && (selected ? renderMember(selected) : renderMemberList())}
      {tab === 'coach' && renderCoach()}
    </PortalShell>
  );
};

export default TrainerPortal;
