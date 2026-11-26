import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection, deleteDoc, doc, getAggregateFromServer, getCountFromServer, limit, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, sum, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { ArrowLeft, Building2, History, Mail, Pause, Play, Plus, RefreshCw, ShieldCheck, Trash2, Users } from 'lucide-react';
import { db } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { GymConfig, useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { lazyWithRetry } from '../../lazyWithRetry';
import PortalShell, { PortalTab } from './PortalShell';
import { Badge, Button, Card, CardHeader, EmptyState, Field, IconButton, Input, Select, Sheet, Spinner, Stat, fmtDate, inr, localIsoDate } from '../ui';

const AdminPortal = lazyWithRetry(() => import('./AdminPortal'));

type Tab = 'gyms' | 'audit';
const TABS: PortalTab<Tab>[] = [
  { id: 'gyms', label: 'Gyms', icon: Building2 },
  { id: 'audit', label: 'Audit log', icon: History },
];

interface GymStats {
  members: number;
  active: number;
  revenueMonth: number;
}
interface AuditRow {
  id: string;
  gymId: string;
  action: string;
  details?: string;
  actor?: string;
  timestamp?: string;
  createdAtMs?: number;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'gym';
const shortId = () => Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 5);
const isEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

/** Live counts per gym via Firestore aggregation queries (≈1 read each, Spark-friendly). */
async function loadGymStats(gymId: string): Promise<GymStats> {
  const monthStart = `${localIsoDate().slice(0, 7)}-01`;
  const g = where('gymId', '==', gymId);
  const [all, active, rev] = await Promise.all([
    getCountFromServer(query(collection(db, 'members'), g)),
    getCountFromServer(query(collection(db, 'members'), g, where('status', '==', 'Active'))),
    getAggregateFromServer(query(collection(db, 'payments'), g, where('date', '>=', monthStart)), { total: sum('amount') }),
  ]);
  return { members: all.data().count, active: active.data().count, revenueMonth: Number(rev.data().total) || 0 };
}

/**
 * Platform owner portal (royalthegym@gmail.com + TOTP only; firestore.rules re-check both).
 * Gyms with live counts, create gym + invite owner, suspend/activate, open any gym, audit log.
 */
export const SuperAdminPortal: React.FC = () => {
  const activeGymId = useSessionStore((s) => s.activeGymId);
  const setSession = useSessionStore((s) => s.set);
  const email = useSessionStore((s) => s.user?.email || '');
  const uid = useSessionStore((s) => s.user?.uid || '');
  const { availableGyms, currentGym } = useGym();
  const { addToast } = useToast();

  const [tab, setTab] = useState<Tab>('gyms');
  const [stats, setStats] = useState<Record<string, GymStats | 'error'>>({});
  const [statsBusy, setStatsBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ gymName: '', city: '', ownerEmail: '' });
  const [busy, setBusy] = useState(false);
  const [inviteFor, setInviteFor] = useState<GymConfig | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [adminInvites, setAdminInvites] = useState<any[]>([]);
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [auditGym, setAuditGym] = useState('');

  const gyms = useMemo(() => [...availableGyms].sort((a, b) => (a.gymName || '').localeCompare(b.gymName || '')), [availableGyms]);

  useEffect(() => {
    if (activeGymId) return;
    return onSnapshot(query(collection(db, 'invites'), where('role', '==', 'admin')), (s) => setAdminInvites(s.docs.map((d) => d.data())), () => setAdminInvites([]));
  }, [activeGymId]);

  const refreshStats = useCallback(async () => {
    if (!gyms.length) return;
    setStatsBusy(true);
    const entries = await Promise.all(
      gyms.map(async (g) => {
        try {
          return [g.gymId, await loadGymStats(g.gymId)] as const;
        } catch (e: any) {
          console.warn('[SuperAdmin] stats', g.gymId, e?.code || e?.message);
          return [g.gymId, 'error'] as const;
        }
      })
    );
    setStats(Object.fromEntries(entries));
    setStatsBusy(false);
  }, [gyms]);

  const gymKey = gyms.map((g) => g.gymId).join(',');
  useEffect(() => {
    if (!activeGymId && tab === 'gyms') void refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymKey, activeGymId]);

  useEffect(() => {
    if (tab !== 'audit' || activeGymId) return;
    setAudit(null);
    const q = auditGym
      ? query(collection(db, 'auditLogs'), where('gymId', '==', auditGym), orderBy('createdAtMs', 'desc'), limit(100))
      : query(collection(db, 'auditLogs'), orderBy('createdAtMs', 'desc'), limit(100));
    return onSnapshot(q, (s) => setAudit(s.docs.map((d) => d.data() as AuditRow)), (e) => {
      console.warn('[SuperAdmin] audit', e.message);
      setAudit([]);
    });
  }, [tab, auditGym, activeGymId]);

  const writeAudit = (gymId: string, action: string, details: string) => {
    const id = `AUD-${Date.now()}-${shortId()}`;
    return setDoc(doc(db, 'auditLogs', `${gymId}_${id}`), {
      id, gymId, action, details: details.slice(0, 500), actor: email, actorUid: uid, timestamp: new Date().toISOString(), createdAtMs: Date.now(),
    }).catch((e) => console.warn('[SuperAdmin] audit write', e?.code));
  };

  if (activeGymId) {
    return (
      <Suspense fallback={<Spinner label="Loading gym…" />}>
        <AdminPortal
          topBar={
            <div className="bg-violet-500/15 border-b border-violet-500/30 px-4 py-2 text-xs text-violet-300 flex items-center gap-3 shrink-0">
              <ShieldCheck className="w-4 h-4" /> Super Admin viewing <b className="truncate">{currentGym?.gymName}</b>
              {currentGym?.status === 'suspended' && <Badge tone="danger">Suspended</Badge>}
              <button type="button" onClick={() => setSession({ activeGymId: null })} className="ml-auto inline-flex items-center gap-1 font-semibold hover:underline cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> All gyms
              </button>
            </div>
          }
        />
      </Suspense>
    );
  }

  const createGym = async () => {
    const ownerEmail = form.ownerEmail.trim().toLowerCase();
    if (form.gymName.trim().length < 2 || !isEmail(ownerEmail)) {
      addToast('Gym name and a valid owner email are required.', 'error');
      return;
    }
    setBusy(true);
    const gymId = `${slugify(form.gymName)}-${shortId()}`;
    const batch = writeBatch(db);
    batch.set(doc(db, 'gyms', gymId), {
      gymId, gymName: form.gymName.trim().slice(0, 120), address: form.city.trim().slice(0, 200), ownerEmail,
      email: ownerEmail, status: 'active', createdBy: email, createdAtMs: Date.now(),
      globalFees: { admissionFee: 0, receiptSignature: '' },
    });
    batch.set(doc(db, 'gymDirectory', gymId), { gymId, gymName: form.gymName.trim().slice(0, 120), city: form.city.trim().slice(0, 120) });
    batch.set(doc(db, 'invites', ownerEmail), { email: ownerEmail, role: 'admin', gymId, memberId: null, createdBy: email, createdAt: serverTimestamp() });
    try {
      await batch.commit();
      void writeAudit(gymId, 'GYM_CREATED', `Gym "${form.gymName.trim()}" created; owner invite for ${ownerEmail}.`);
      addToast(`Gym created. ${ownerEmail} becomes its admin on first sign-in.`, 'success');
      setForm({ gymName: '', city: '', ownerEmail: '' });
      setCreateOpen(false);
    } catch (e: any) {
      addToast(`Create failed: ${e.code || e.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendOwnerInvite = async () => {
    const em = inviteEmail.trim().toLowerCase();
    if (!inviteFor || !isEmail(em)) {
      addToast('Enter a valid email.', 'error');
      return;
    }
    setBusy(true);
    try {
      await setDoc(doc(db, 'invites', em), { email: em, role: 'admin', gymId: inviteFor.gymId, memberId: null, createdBy: email, createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'gyms', inviteFor.gymId), { ownerEmail: em });
      void writeAudit(inviteFor.gymId, 'OWNER_INVITED', `Owner invite for ${em}.`);
      addToast(`Invite saved. ${em} signs in with Google or a verified email to become admin.`, 'success');
      setInviteFor(null);
      setInviteEmail('');
    } catch (e: any) {
      addToast(`Invite failed: ${e.code || e.message}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleSuspend = async (g: GymConfig) => {
    const next = g.status === 'suspended' ? 'active' : 'suspended';
    if (next === 'suspended' && !window.confirm(`Suspend ${g.gymName}? Its owner, trainers and members will be locked out until you activate it again.`)) return;
    try {
      await updateDoc(doc(db, 'gyms', g.gymId), { status: next, statusChangedAtMs: Date.now() });
      void writeAudit(g.gymId, next === 'suspended' ? 'GYM_SUSPENDED' : 'GYM_ACTIVATED', `${g.gymName} ${next}.`);
      addToast(`${g.gymName} ${next === 'suspended' ? 'suspended' : 'activated'}.`, 'success');
    } catch (e: any) {
      addToast(`Update failed: ${e.code || e.message}`, 'error');
    }
  };

  const totals = Object.values(stats).reduce(
    (acc, s) => (s === 'error' ? acc : { members: acc.members + s.members, active: acc.active + s.active, revenue: acc.revenue + s.revenueMonth }),
    { members: 0, active: 0, revenue: 0 }
  );
  const statsLoaded = gyms.length > 0 && gyms.every((g) => stats[g.gymId]);
  const gymName = (id: string) => gyms.find((g) => g.gymId === id)?.gymName || id;

  return (
    <PortalShell
      title="Fitness Future"
      subtitle={`Super Admin · ${email}`}
      badge={<Badge tone="info"><ShieldCheck className="w-3 h-3" /> 2FA</Badge>}
      tabs={TABS}
      active={tab}
      onTab={setTab}
    >
      {tab === 'gyms' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gyms</h1>
              <p className="text-sm text-muted">Revenue = payments recorded this calendar month.</p>
            </div>
            <div className="flex gap-2">
              <IconButton label="Refresh counts" onClick={() => void refreshStats()}>
                <RefreshCw className={`w-4 h-4 ${statsBusy ? 'animate-spin' : ''}`} />
              </IconButton>
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>New gym</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Gyms" value={gyms.length} icon={<Building2 className="w-4 h-4" />} tone="brand" />
            <Stat label="Members" value={totals.members} loading={!statsLoaded && statsBusy} icon={<Users className="w-4 h-4" />} />
            <Stat label="Active members" value={totals.active} loading={!statsLoaded && statsBusy} tone="success" icon={<Users className="w-4 h-4" />} />
            <Stat label="Revenue this month" value={inr(totals.revenue)} loading={!statsLoaded && statsBusy} tone="info" icon={<History className="w-4 h-4" />} />
          </div>

          {gyms.length === 0 ? (
            <Card>
              <EmptyState icon={<Building2 className="w-5 h-5" />} title="No gyms yet" action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>Create the first gym</Button>}>
                Create a gym and invite its owner by email. They become the gym admin on first sign-in.
              </EmptyState>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {gyms.map((g) => {
                const st = stats[g.gymId];
                const suspended = g.status === 'suspended';
                return (
                  <Card key={g.gymId} className={suspended ? 'border-rose-500/40' : undefined}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold truncate">{g.gymName}</h3>
                        <p className="text-xs text-muted truncate">{g.address || 'No address'}</p>
                        <p className="text-[11px] text-subtle truncate mt-0.5">Owner: {g.ownerEmail || g.email || '—'}</p>
                      </div>
                      <Badge tone={suspended ? 'danger' : 'success'}>{suspended ? 'Suspended' : 'Active'}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      {[
                        ['Members', st && st !== 'error' ? st.members : null],
                        ['Active', st && st !== 'error' ? st.active : null],
                        ['This month', st && st !== 'error' ? inr(st.revenueMonth) : null],
                      ].map(([label, v]) => (
                        <div key={label as string} className="rounded-xl bg-surface2 py-2">
                          <div className="text-sm font-bold">{st === 'error' ? '—' : v == null ? <span className="inline-block w-8 h-4 rounded bg-fg/10 animate-pulse" /> : v}</div>
                          <div className="text-[10px] text-subtle">{label as string}</div>
                        </div>
                      ))}
                    </div>
                    {st === 'error' && <p className="text-[11px] text-rose-500 mt-1">Counts unavailable (deploy firestore.indexes.json).</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button size="sm" onClick={() => setSession({ activeGymId: g.gymId })}>Open</Button>
                      <Button size="sm" variant="secondary" icon={<Mail className="w-3.5 h-3.5" />} onClick={() => { setInviteFor(g); setInviteEmail(g.ownerEmail || ''); }}>Invite owner</Button>
                      <Button size="sm" variant={suspended ? 'success' : 'secondary'} icon={suspended ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />} onClick={() => void toggleSuspend(g)}>
                        {suspended ? 'Activate' : 'Suspend'}
                      </Button>
                    </div>
                    <p className="text-[10px] text-subtle font-mono mt-2 truncate">{g.gymId}{g.createdAtMs ? ` · since ${fmtDate(new Date(g.createdAtMs).toISOString())}` : ''}</p>
                  </Card>
                );
              })}
            </div>
          )}

          {adminInvites.length > 0 && (
            <Card padded={false}>
              <div className="px-4 pt-4 pb-1"><CardHeader title="Unclaimed owner invites" subtitle="Waiting for the owner’s first sign-in" icon={<Mail className="w-4 h-4" />} /></div>
              <ul className="divide-y divide-line">
                {adminInvites.map((i) => (
                  <li key={i.email} className="px-4 py-2.5 flex justify-between items-center gap-3 text-sm">
                    <span className="truncate">{i.email} <span className="text-subtle">→ {gymName(i.gymId)}</span></span>
                    <IconButton label={`Revoke invite for ${i.email}`} onClick={() => void deleteDoc(doc(db, 'invites', i.email))}>
                      <Trash2 className="w-4 h-4" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Audit log</h1>
            <Select value={auditGym} onChange={(e) => setAuditGym(e.target.value)} className="w-auto min-w-[200px]" aria-label="Filter by gym">
              <option value="">All gyms</option>
              {gyms.map((g) => <option key={g.gymId} value={g.gymId}>{g.gymName}</option>)}
            </Select>
          </div>
          <Card padded={false}>
            {audit === null ? (
              <Spinner />
            ) : audit.length === 0 ? (
              <EmptyState icon={<History className="w-5 h-5" />} title="No audit entries yet">Member changes, payments and gym changes are recorded here.</EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {audit.map((a) => (
                  <li key={`${a.gymId}-${a.id}`} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{a.action}</Badge>
                      {!auditGym && <span className="text-xs text-muted">{gymName(a.gymId)}</span>}
                      <span className="text-[11px] text-subtle ml-auto">{a.createdAtMs ? new Date(a.createdAtMs).toLocaleString('en-IN') : a.timestamp}</span>
                    </div>
                    {a.details && <p className="text-sm mt-1">{a.details}</p>}
                    {a.actor && <p className="text-[11px] text-subtle">by {a.actor}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <Sheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New gym"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button loading={busy} onClick={() => void createGym()}>Create gym</Button>
          </>
        }
      >
        <Field label="Gym name"><Input value={form.gymName} onChange={(e) => setForm({ ...form, gymName: e.target.value })} placeholder="e.g. Royal The Gym" /></Field>
        <Field label="City / address"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Jhunjhunu, Rajasthan" /></Field>
        <Field label="Owner email" hint="They sign in with Google or a verified email and become this gym’s admin.">
          <Input type="email" inputMode="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} placeholder="owner@example.com" />
        </Field>
      </Sheet>

      <Sheet
        open={!!inviteFor}
        onClose={() => setInviteFor(null)}
        title={`Invite owner · ${inviteFor?.gymName || ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteFor(null)}>Cancel</Button>
            <Button loading={busy} onClick={() => void sendOwnerInvite()}>Save invite</Button>
          </>
        }
      >
        <Field label="Owner email" hint="No email is sent automatically — tell the owner to open the app and sign in with this email.">
          <Input type="email" inputMode="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
        </Field>
      </Sheet>
    </PortalShell>
  );
};

export default SuperAdminPortal;
