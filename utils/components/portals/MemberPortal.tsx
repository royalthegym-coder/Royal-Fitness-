import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Bot, CalendarCheck, ClipboardList, Dumbbell, Home, LineChart, Receipt, Utensils } from 'lucide-react';
import { db, signOutFirebaseUser } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { useMemberPlans } from '../../../lib/coachData';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { lazyWithRetry } from '../../lazyWithRetry';
import { Invoice, Member } from '../../../types';
import PortalShell, { PortalTab } from './PortalShell';
import { Badge, Button, Card, CardHeader, EmptyState, Spinner, Stat, Tabs, daysBetween, fmtDate, inr, localIsoDate } from '../ui';

const ProgressPanel = lazyWithRetry(() => import('../coach/ProgressPanel'));
const AiChat = lazyWithRetry(() => import('../coach/AiChat'));
const PlanView = lazyWithRetry(() => import('../coach/PlanView'));
const ReceiptTemplate = lazyWithRetry(() => import('../common/ReceiptTemplate'));
const FoodLogPanel = lazyWithRetry(() => import('../coach/FoodLogPanel'));
const PhotosPanel = lazyWithRetry(() => import('../coach/PhotosPanel'));
const PersonalDataSettings = lazyWithRetry(() => import('../coach/PersonalDataSettings'));

type Tab = 'home' | 'plan' | 'progress' | 'coach' | 'visits';
const TABS: PortalTab<Tab>[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'plan', label: 'My plan', icon: ClipboardList },
  { id: 'progress', label: 'Progress', icon: LineChart },
  { id: 'coach', label: 'AI Coach', icon: Bot },
  { id: 'visits', label: 'Visits', icon: CalendarCheck },
];

const OPEN_INVOICE = new Set(['Pending', 'Partial', 'Overdue', 'Verification Pending']);
const balanceOf = (i: Invoice) => (typeof i.balanceAmount === 'number' ? i.balanceAmount : Math.max(0, (i.amount || 0) - (i.paidAmount || 0)));

interface SessionRow {
  id: string;
  date: string;
  focus: string;
  durationMinutes: number;
  rpe: number;
  notes: string;
  createdAtMs: number;
}

/** The member experience. `preview` = shown inside the admin portal (no shell, AI chat disabled). */
export const MemberApp: React.FC<{ member: Member; preview?: boolean }> = ({ member, preview }) => {
  const gymId = useSessionStore((s) => s.activeGymId) || member.gymId || '';
  const { packages, invoices, attendanceRecords, workoutTemplates, dietPlans } = useData();
  const { currentGym } = useGym();
  const [tab, setTab] = useState<Tab>('home');
  const [progressSub, setProgressSub] = useState<'body' | 'food' | 'photos'>('body');
  const targetWeightKg = Number(member.physical_metrics?.target_weight) || null;
  const [receipt, setReceipt] = useState<Invoice | null>(null);
  const plans = useMemberPlans(gymId, member.id);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    if (!gymId) return;
    return onSnapshot(
      query(collection(db, 'trainerSessions'), where('gymId', '==', gymId), where('memberId', '==', member.id)),
      (s) => setSessions(s.docs.map((d) => d.data() as SessionRow).sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 20)),
      () => setSessions([])
    );
  }, [gymId, member.id]);

  const today = localIsoDate();
  const pkg = packages.find((p) => p.id === member.packageId);
  const daysLeft = member.expiryDate ? daysBetween(today, member.expiryDate) : null;
  const myInvoices = useMemo(() => invoices.filter((i) => i.memberId === member.id).sort((a, b) => (b.date || '').localeCompare(a.date || '')), [invoices, member.id]);
  const dues = myInvoices.filter((i) => OPEN_INVOICE.has(i.status)).reduce((s, i) => s + balanceOf(i), 0);
  const visits = useMemo(
    () => attendanceRecords.filter((a) => a.memberId === member.id && a.status !== 'Denied').sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''))),
    [attendanceRecords, member.id]
  );
  const monthPrefix = today.slice(0, 7);
  const visitsThisMonth = visits.filter((v) => v.date.startsWith(monthPrefix)).length;
  const activePlan = plans.rows.find((p) => p.status === 'active') || null;
  const workout = workoutTemplates.find((w) => member.assignedWorkoutId != null && w.id === member.assignedWorkoutId);
  const diet = dietPlans.find((d) => member.assignedDietId != null && d.id === member.assignedDietId);
  const firstName = (member.name || '').split(' ')[0];

  const expiryTone = daysLeft == null ? 'neutral' : daysLeft < 0 ? 'danger' : daysLeft <= 7 ? 'warning' : 'success';

  const body = (
    <Suspense fallback={<Spinner />}>
      {tab === 'home' && (
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hi {firstName} 👋</h1>
            <p className="text-sm text-muted">{currentGym?.gymName || 'Your gym'}</p>
          </div>

          <Card className="overflow-hidden relative">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Membership</p>
                <p className="text-lg font-bold">{pkg?.name || 'No plan selected'}</p>
                <p className="text-xs text-muted mt-1">
                  {member.expiryDate ? `Valid till ${fmtDate(member.expiryDate)}` : 'Expiry date not set yet — ask the front desk.'}
                </p>
              </div>
              <Badge tone={expiryTone as any}>
                {daysLeft == null ? member.status : daysLeft < 0 ? `Expired ${-daysLeft}d ago` : daysLeft === 0 ? 'Expires today' : `${daysLeft} days left`}
              </Badge>
            </div>
            {daysLeft != null && daysLeft <= 7 && (
              <p className="mt-3 text-xs text-amber-500">Renew at the front desk to keep training without a break.</p>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Visits this month" value={visitsThisMonth} icon={<CalendarCheck className="w-4 h-4" />} tone="info" onClick={() => setTab('visits')} />
            <Stat label="Pending dues" value={inr(dues)} icon={<Receipt className="w-4 h-4" />} tone={dues > 0 ? 'danger' : 'success'} hint={dues > 0 ? 'Pay at the front desk' : 'All paid'} />
          </div>

          <Card>
            <CardHeader title="Today’s training" icon={<Dumbbell className="w-4 h-4" />} action={<Button size="sm" variant="secondary" onClick={() => setTab('plan')}>Open plan</Button>} />
            {activePlan ? (
              <p className="text-sm text-muted">{activePlan.title} · {activePlan.workout.days.length} days/week</p>
            ) : workout ? (
              <p className="text-sm text-muted">{workout.name}</p>
            ) : (
              <p className="text-sm text-muted">Your trainer hasn’t assigned a plan yet. Meanwhile, ask the AI Coach for a safe beginner routine.</p>
            )}
          </Card>

          <Card padded={false}>
            <div className="px-4 pt-4 pb-2"><CardHeader title="Bills & receipts" icon={<Receipt className="w-4 h-4" />} /></div>
            {myInvoices.length === 0 ? (
              <EmptyState title="No bills yet" />
            ) : (
              <ul className="divide-y divide-line">
                {myInvoices.slice(0, 8).map((i) => (
                  <li key={i.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{i.packageName}</div>
                      <div className="text-[11px] text-subtle">{fmtDate(i.date)} · {inr(i.amount)}</div>
                    </div>
                    <Badge tone={i.status === 'Paid' ? 'success' : OPEN_INVOICE.has(i.status) ? 'warning' : 'neutral'}>{i.status}</Badge>
                    {i.status === 'Paid' && (
                      <Button size="sm" variant="ghost" onClick={() => setReceipt(i)}>Receipt</Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {!preview && gymId && <PersonalDataSettings gymId={gymId} memberId={member.id} targetWeightKg={targetWeightKg} />}
        </div>
      )}

      {tab === 'plan' && (
        <div className="space-y-4">
          {plans.loading ? (
            <Spinner />
          ) : activePlan ? (
            <PlanView plan={activePlan} meta={`From ${activePlan.trainerName || 'your trainer'} · ${fmtDate(new Date(activePlan.createdAtMs).toISOString())}`} />
          ) : (
            <>
              {workout || diet ? (
                <Card>
                  <CardHeader title="Assigned by your trainer" icon={<ClipboardList className="w-4 h-4" />} />
                  {workout && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-brand" /> {workout.name}</p>
                      <p className="text-xs text-muted">{[workout.level, workout.frequency, workout.duration].filter(Boolean).join(' · ')}</p>
                      {workout.description && <p className="text-xs text-muted mt-1">{workout.description}</p>}
                      {(workout.mainWorkout || []).map((sec, i) => (
                        <div key={i} className="mt-2">
                          <p className="text-xs font-semibold">{sec.name}</p>
                          <ul className="text-xs text-muted list-disc pl-5">
                            {(sec.exercises || []).map((e, j) => <li key={j}>{e.name} — {e.sets} × {e.reps}{e.rest ? `, rest ${e.rest}` : ''}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                  {diet && (
                    <div>
                      <p className="text-sm font-semibold flex items-center gap-1.5"><Utensils className="w-4 h-4 text-brand" /> {diet.name}</p>
                      <p className="text-xs text-muted">{diet.calories} kcal · P {diet.macros?.protein} g · C {diet.macros?.carbs} g · F {diet.macros?.fats} g</p>
                      {(diet.meals || []).map((m, i) => (
                        <p key={i} className="text-xs text-muted mt-1"><b className="text-fg">{m.name}</b>{m.time ? ` (${m.time})` : ''}: {(m.items || []).map((x) => x.food).join(', ')}</p>
                      ))}
                    </div>
                  )}
                </Card>
              ) : (
                <Card>
                  <EmptyState icon={<ClipboardList className="w-5 h-5" />} title="No plan assigned yet">
                    Your trainer will add your workout and diet plan here. You can ask the AI Coach for general guidance meanwhile.
                  </EmptyState>
                </Card>
              )}
            </>
          )}
          <Card padded={false}>
            <div className="px-4 pt-4 pb-2"><CardHeader title="Sessions with your trainer" icon={<Dumbbell className="w-4 h-4" />} /></div>
            {sessions.length === 0 ? (
              <EmptyState title="No sessions logged yet" />
            ) : (
              <ul className="divide-y divide-line">
                {sessions.map((s) => (
                  <li key={s.id} className="px-4 py-3">
                    <div className="text-sm font-medium">{fmtDate(s.date)} · {s.focus || 'Session'}</div>
                    <div className="text-[11px] text-subtle">{s.durationMinutes} min · effort {s.rpe}/10</div>
                    {s.notes && <p className="text-xs text-muted mt-1 whitespace-pre-wrap">{s.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'progress' && gymId && (
        <div className="space-y-4">
          <Tabs
            value={progressSub}
            onChange={setProgressSub}
            items={[
              { id: 'body', label: 'Body' },
              { id: 'food', label: 'Food diary' },
              { id: 'photos', label: 'Photos' },
            ]}
          />
          {progressSub === 'body' && <ProgressPanel gymId={gymId} memberId={member.id} readOnly={preview} targetWeightKg={targetWeightKg} />}
          {progressSub === 'food' && <FoodLogPanel gymId={gymId} memberId={member.id} preview={preview} />}
          {progressSub === 'photos' && <PhotosPanel gymId={gymId} memberId={member.id} preview={preview} />}
        </div>
      )}

      {tab === 'coach' && gymId && <AiChat gymId={gymId} memberId={member.id} memberFirstName={firstName} audience="member" preview={preview} />}

      {tab === 'visits' && (
        <Card padded={false}>
          <div className="px-4 pt-4 pb-2">
            <CardHeader title="Attendance" subtitle={`${visitsThisMonth} visits this month · last 90 days shown`} icon={<CalendarCheck className="w-4 h-4" />} />
          </div>
          {visits.length === 0 ? (
            <EmptyState icon={<CalendarCheck className="w-5 h-5" />} title="No check-ins yet">Your gym check-ins will appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {visits.map((v) => (
                <li key={v.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{fmtDate(v.date)}</div>
                    <div className="text-[11px] text-subtle">
                      In {v.time || v.checkInTime || '—'}
                      {v.checkOutTime ? ` · out ${v.checkOutTime}` : ''}
                      {v.durationMinutes ? ` · ${v.durationMinutes} min` : ''}
                    </div>
                  </div>
                  <Badge tone="success">{v.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {receipt && (
        <ReceiptTemplate
          invoiceId={String(receipt.id)}
          memberName={receipt.memberName}
          memberId={receipt.memberId}
          memberPhone={member.phone}
          amount={receipt.amount}
          date={receipt.date}
          method={receipt.paymentMethod || 'UPI'}
          items={receipt.items || [{ description: receipt.packageName, amount: receipt.amount, type: 'Membership' }]}
          onClose={() => setReceipt(null)}
        />
      )}
    </Suspense>
  );

  if (preview) {
    return (
      <div className="space-y-4">
        <Tabs value={tab} onChange={setTab} items={TABS.map((t) => ({ id: t.id, label: t.label }))} />
        {body}
      </div>
    );
  }

  return (
    <PortalShell title={currentGym?.gymName || 'Fitness Future'} subtitle={member.name} tabs={TABS} active={tab} onTab={setTab}>
      {body}
    </PortalShell>
  );
};

/**
 * Member portal. Data is limited by firestore.rules to the member's own member record,
 * invoices, payments, attendance, progress, plans plus the gym's packages / templates.
 */
export const MemberPortal: React.FC = () => {
  const memberId = useSessionStore((s) => s.profile?.memberId ?? null);
  const { members, isHydrating } = useData();
  const me = members.find((m) => m.id === memberId);

  if (memberId == null || (!isHydrating && !me)) {
    return (
      <div className="min-h-[100dvh] w-full bg-canvas flex items-center justify-center p-4 text-fg">
        <Card className="max-w-sm text-center space-y-3">
          <p className="text-sm">Your login is active, but your gym hasn't linked it to a membership record yet.</p>
          <p className="text-xs text-muted">Ask the front desk to link your account in “Team & Access”.</p>
          <Button onClick={() => void signOutFirebaseUser()}>Sign out</Button>
        </Card>
      </div>
    );
  }
  if (!me) {
    return (
      <div className="min-h-[100dvh] w-full bg-canvas">
        <Spinner label="Loading your membership…" />
      </div>
    );
  }
  return <MemberApp member={me} />;
};

export default MemberPortal;
