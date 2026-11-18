// WhatsApp send gate (plain JS: runs in Deno and in Node tests).
// gymOpen mirrors private.gym_is_open, which is the database authority: a gym may send only when it is force-unlocked,
// or it is active and its subscription has not ended (IST date). Any other state is closed.

export const TEST_DAILY_CAP = 20; // admin test messages per gym per IST day; the test button is not a bulk sender

export function istToday(now = Date.now()) {
  return new Date(now + 19800000).toISOString().slice(0, 10);
}

export function gymOpen(g, today = istToday()) {
  if (!g) return false;
  if (g.lock_override === 'force_unlock') return true;
  return g.lock_override === 'none' && g.status === 'active' && (!g.subscription_ends_on || g.subscription_ends_on >= today);
}
