import React, { useMemo } from 'react';
import { AlertCircle, CalendarCheck, CalendarClock, IndianRupee, MessageCircle, Receipt, Target, UserPlus, Users, Wallet } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { Invoice, Member } from '../../../types';
import { Badge, Button, Card, CardHeader, EmptyState, PageTitle, Stat, daysBetween, fmtDate, inr, localIsoDate } from '../ui';

const OPEN = new Set(['Pending', 'Partial', 'Overdue', 'Verification Pending']);
const balanceOf = (i: Invoice) => (typeof i.balanceAmount === 'number' ? i.balanceAmount : Math.max(0, (i.amount || 0) - (i.paidAmount || 0)));

/** wa.me click-to-chat link (free; opens WhatsApp on the owner's phone — no API needed). */
const waLink = (m: Member, text: string) => {
  const d = String(m.phone || '').replace(/\D/g, '');
  const to = d.length === 10 ? `91${d}` : d;
  return to.length >= 11 ? `https://wa.me/${to}?text=${encodeURIComponent(text)}` : null;
};

/**
 * Gym owner dashboard. Every number is computed from the gym's own Firestore data
 * (members, payments, invoices, attendance, leads). Nothing is estimated or invented.
 */
export const AdminDashboard: React.FC<{ setCurrentView: (v: string) => void }> = ({ setCurrentView }) => {
  const { members, transactions, invoices, attendanceRecords, leads, isHydrating } = useData();
  const { currentGym } = useGym();
  const today = localIsoDate();
  const month = today.slice(0, 7);

  const k = useMemo(() => {
    const live = members.filter((m) => !m.archived);
    const active = live.filter((m) => m.status === 'Active' && (!m.expiryDate || m.expiryDate >= today));
    const expiring = active
      .filter((m) => m.expiryDate && daysBetween(today, m.expiryDate) <= 7)
      .sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''));
    const expired = live
      .filter((m) => m.expiryDate && m.expiryDate < today && daysBetween(m.expiryDate, today) <= 30)
      .sort((a, b) => (b.expiryDate || '').localeCompare(a.expiryDate || ''));
    const checkIns = attendanceRecords.filter((a) => a.date === today && a.status !== 'Denied');
    const monthPayments = transactions.filter((t) => (t.date || '').startsWith(month));
    const revenue = monthPayments.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const openInv = invoices.filter((i) => OPEN.has(i.status) && balanceOf(i) > 0).sort((a, b) => balanceOf(b) - balanceOf(a));
    const dues = openInv.reduce((s, i) => s + balanceOf(i), 0);
    const openLeads = leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost');
    const followUps = openLeads.filter((l) => l.followUpDate && l.followUpDate <= today);
    // last 6 months revenue from recorded payments
    const months: Array<{ key: string; label: string; total: number }> = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 5; i >= 0; i--) {
      const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: x.toLocaleDateString('en-IN', { month: 'short' }), total: 0 });
    }
    transactions.forEach((t) => {
      const row = months.find((m) => (t.date || '').startsWith(m.key));
      if (row) row.total += Number(t.amount) || 0;
    });
    return { live, active, expiring, expired, checkIns, revenue, monthPayments, openInv, dues, openLeads, followUps, months };
  }, [members, transactions, invoices, attendanceRecords, leads, today, month]);

  const maxMonth = Math.max(1, ...k.months.map((m) => m.total));
  const gymName = currentGym?.gymName || 'your gym';

  if (!isHydrating && members.length === 0) {
    return (
      <div className="space-y-4">
        <PageTitle title="Dashboard" subtitle={gymName} />
        <Card>
          <EmptyState
            icon={<Users className="w-5 h-5" />}
            title="Welcome! Let’s add your first member"
            action={
              <div className="flex flex-wrap gap-2 justify-center">
                <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setCurrentView('admission')}>Add member</Button>
                <Button variant="secondary" onClick={() => setCurrentView('packages')}>Set up plans & prices</Button>
                <Button variant="secondary" onClick={() => setCurrentView('access')}>Invite trainers</Button>
              </div>
            }
          >
            Your dashboard fills up automatically from real members, payments and check-ins.
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageTitle
        title="Dashboard"
        subtitle={`${gymName} · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" icon={<UserPlus className="w-4 h-4" />} onClick={() => setCurrentView('admission')}>Add member</Button>
            <Button size="sm" variant="secondary" icon={<Receipt className="w-4 h-4" />} onClick={() => setCurrentView('billing')}>Record payment</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Active members" value={k.active.length} hint={`${k.live.length} total`} icon={<Users className="w-4 h-4" />} tone="success" loading={isHydrating} onClick={() => setCurrentView('members')} />
        <Stat label="Expiring in 7 days" value={k.expiring.length} hint={k.expired.length ? `${k.expired.length} expired in last 30 days` : 'Renewals'} icon={<CalendarClock className="w-4 h-4" />} tone={k.expiring.length ? 'warning' : 'neutral'} loading={isHydrating} onClick={() => setCurrentView('billing')} />
        <Stat label="Today’s check-ins" value={k.checkIns.length} icon={<CalendarCheck className="w-4 h-4" />} tone="info" loading={isHydrating} onClick={() => setCurrentView('attendance')} />
        <Stat label="Revenue this month" value={inr(k.revenue)} hint={`${k.monthPayments.length} payments`} icon={<IndianRupee className="w-4 h-4" />} tone="brand" loading={isHydrating} onClick={() => setCurrentView('billing')} />
        <Stat label="Pending dues" value={inr(k.dues)} hint={`${k.openInv.length} open bills`} icon={<Wallet className="w-4 h-4" />} tone={k.dues > 0 ? 'danger' : 'success'} loading={isHydrating} onClick={() => setCurrentView('billing')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card padded={false}>
          <div className="px-4 pt-4"><CardHeader title="Renewals due" subtitle="Expiring in the next 7 days and recently expired" icon={<CalendarClock className="w-4 h-4" />} action={<Button size="sm" variant="ghost" onClick={() => setCurrentView('billing')}>Renew</Button>} /></div>
          {k.expiring.length + k.expired.length === 0 ? (
            <EmptyState title="No renewals due" />
          ) : (
            <ul className="divide-y divide-line">
              {[...k.expiring, ...k.expired].slice(0, 8).map((m) => {
                const days = daysBetween(today, m.expiryDate!);
                const link = waLink(m, `Hi ${m.name.split(' ')[0]}, your ${gymName} membership ${days < 0 ? 'has expired' : days === 0 ? 'expires today' : `expires on ${fmtDate(m.expiryDate)}`}. Renew to keep training without a break.`);
                return (
                  <li key={m.id} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-[11px] text-subtle">{fmtDate(m.expiryDate)} · {m.phone || 'no phone'}</div>
                    </div>
                    <Badge tone={days < 0 ? 'danger' : 'warning'}>{days < 0 ? `${-days}d ago` : days === 0 ? 'Today' : `${days}d`}</Badge>
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${m.name}`} className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-500 hover:bg-emerald-500/10">
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card padded={false}>
          <div className="px-4 pt-4"><CardHeader title="Pending dues" subtitle="Largest balances first" icon={<AlertCircle className="w-4 h-4" />} action={<Button size="sm" variant="ghost" onClick={() => setCurrentView('billing')}>Collect</Button>} /></div>
          {k.openInv.length === 0 ? (
            <EmptyState title="No pending dues" />
          ) : (
            <ul className="divide-y divide-line">
              {k.openInv.slice(0, 8).map((i) => (
                <li key={i.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.memberName}</div>
                    <div className="text-[11px] text-subtle truncate">{i.packageName} · {fmtDate(i.date)}</div>
                  </div>
                  <Badge tone={i.status === 'Overdue' ? 'danger' : 'warning'}>{i.status}</Badge>
                  <span className="text-sm font-semibold w-20 text-right">{inr(balanceOf(i))}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Revenue (last 6 months)" subtitle="Recorded payments" icon={<IndianRupee className="w-4 h-4" />} />
          {k.months.every((m) => m.total === 0) ? (
            <EmptyState title="No payments recorded yet" />
          ) : (
            <div className="flex items-end gap-2 h-40" role="img" aria-label="Monthly revenue bar chart">
              {k.months.map((m) => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-[10px] text-subtle truncate">{m.total ? inr(m.total) : ''}</span>
                  <div className={`w-full rounded-t-lg ${m.key === month ? 'bg-brand' : 'bg-brand/40'}`} style={{ height: `${Math.max(2, (m.total / maxMonth) * 100)}%` }} />
                  <span className="text-[11px] text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="px-4 pt-4"><CardHeader title="Today’s check-ins" subtitle={`${k.checkIns.length} so far`} icon={<CalendarCheck className="w-4 h-4" />} action={<Button size="sm" variant="ghost" onClick={() => setCurrentView('attendance')}>Mark</Button>} /></div>
          {k.checkIns.length === 0 ? (
            <EmptyState title="No check-ins yet today" />
          ) : (
            <ul className="divide-y divide-line max-h-72 overflow-y-auto custom-scrollbar">
              {k.checkIns.map((a) => (
                <li key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm truncate">{a.memberName || `#${a.memberId}`}</span>
                  <span className="text-[11px] text-subtle">{a.time}{a.checkOutTime ? ` – ${a.checkOutTime}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {k.openLeads.length > 0 && (
        <Card>
          <CardHeader title="Leads" subtitle={`${k.openLeads.length} open · ${k.followUps.length} follow-ups due`} icon={<Target className="w-4 h-4" />} action={<Button size="sm" variant="ghost" onClick={() => setCurrentView('leads')}>Open</Button>} />
          <div className="flex flex-wrap gap-2">
            {k.followUps.slice(0, 6).map((l) => <Badge key={l.id} tone="warning">{l.name} · {fmtDate(l.followUpDate)}</Badge>)}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;
