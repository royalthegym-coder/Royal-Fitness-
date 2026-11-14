/* ---------- data layer: cached reads, derived values ---------- */
const CACHE = new Map();
const cached = (name, loader) => { if (!CACHE.has(name)) CACHE.set(name, loader().catch((e) => { CACHE.delete(name); throw e; })); return CACHE.get(name); };
const bust = (...names) => (names.length ? names.forEach((n) => CACHE.delete(n)) : CACHE.clear());
const sinceISO = (days) => new Date(Date.now() - days * 864e5).toISOString();
const Q = {
  members: () => cached('members', () => DB.select('members', { order: 'name.asc', limit: 5000 })),
  plans: () => cached('plans', () => DB.select('plans', { order: 'months.asc', limit: 500 })),
  invoices: () => cached('invoices', () => DB.select('invoices', { order: 'date.desc', limit: 5000 })),
  payments: () => cached('payments', () => DB.select('payments', { order: 'paid_on.desc,created_at.desc', limit: 5000 })),
  visits: () => cached('visits', () => DB.select('visits', { filters: { in_at: 'gte.' + sinceISO(90) }, order: 'in_at.desc', limit: 10000 })),
  ledger: () => cached('ledger', () => DB.select('payment_ledger', { order: 'seq.desc', limit: 5000 })),
  gyms: () => cached('gyms', () => DB.select('gyms', { order: 'created_at.asc' })),
  profiles: () => cached('profiles', () => DB.select('profiles', { order: 'created_at.asc', limit: 2000 })),
  audit: () => cached('audit', () => DB.select('audit_log', { filters: { action: 'not.like.act_*' }, order: 'at.desc', limit: 100 })),
  overview: () => cached('overview', () => DB.rpc('admin_gym_overview')),
};
const memberMap = (list) => new Map(list.map((m) => [m.id, m]));
const planMap = (list) => new Map(list.map((p) => [p.id, p]));
function paidByInvoice(payments) { const m = new Map(); payments.forEach((p) => m.set(p.invoice_id, round2((m.get(p.invoice_id) || 0) + Number(p.amount)))); return m; }
const balanceOf = (inv, paid) => (inv.cancelled ? 0 : Math.max(round2(Number(inv.total) - (paid.get(inv.id) || 0)), 0));
const invStatus = (inv, paid) => (inv.cancelled ? 'Cancelled' : balanceOf(inv, paid) <= 0.004 ? 'Paid' : (paid.get(inv.id) || 0) > 0 ? 'Partial' : 'Unpaid');
const isOverdue = (inv, paid) => ['Unpaid', 'Partial'].includes(invStatus(inv, paid)) && inv.due && inv.due < todayISO();
function duesByMember(invoices, paid) { const m = new Map(); invoices.forEach((i) => { const b = balanceOf(i, paid); if (b > 0.004) m.set(i.member_id, round2((m.get(i.member_id) || 0) + b)); }); return m; }
function lastVisitMap(visits) { const m = new Map(); visits.forEach((v) => { const d = istDate(v.in_at); if (!m.has(v.member_id) || m.get(v.member_id) < d) m.set(v.member_id, d); }); return m; }
function visitDaysMap(visits) { const m = new Map(); visits.forEach((v) => { if (!m.has(v.member_id)) m.set(v.member_id, new Set()); m.get(v.member_id).add(istDate(v.in_at)); }); return m; }
function memberState(m) {
  if (m.status === 'Frozen') return 'Frozen';
  if (m.status === 'Cancelled') return 'Cancelled';
  if (!m.end_date) return 'Active';
  const left = diffDays(todayISO(), m.end_date);
  return left < 0 ? 'Expired' : left <= 7 ? 'Expiring' : 'Active';
}
const daysLeft = (m) => (m.end_date ? diffDays(todayISO(), m.end_date) : null);
const STATE_FILTERS = ['Active', 'Expiring', 'Expired', 'Frozen', 'Cancelled'];

/* invoice maths: GST on the amount after discount; rounded to paise */
function computeInvoice(items, discount, gstPct) {
  const subtotal = round2(sum(items, (i) => i.amount));
  const disc = Math.min(Math.max(Number(discount || 0), 0), subtotal);
  const base = round2(subtotal - disc);
  const gst_amt = round2((base * Number(gstPct || 0)) / 100);
  return { subtotal, discount: disc, gst_pct: Number(gstPct || 0), gst_amt, total: round2(base + gst_amt) };
}
const gymId = () => CTX.profile.gym_id;
const roleName = (r) => ({ super_admin: L('Super admin', 'सुपर एडमिन'), gym_admin: L('Gym admin', 'जिम एडमिन'), trainer: L('Trainer', 'ट्रेनर'), member: L('Member', 'सदस्य') }[r] || r);

/* Write wrapper: surfaces a friendly toast, returns the result or null */
async function act(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r === undefined || r === null ? true : r; /* void RPCs return 204/null */ } catch (e) { if (e && e.status === 401) return null; toast(friendlyError(e), 'bad'); return null; }
}
