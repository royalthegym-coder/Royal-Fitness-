import { gymOpen, istToday, TEST_DAILY_CAP } from '../supabase/functions/wa-dispatch/lib.js';
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };

/* the WhatsApp gate mirrors private.gym_is_open: open only when force-unlocked, or active with the subscription running */
const T = '2026-11-18';
const g = (o) => ({ status: 'active', lock_override: 'none', subscription_ends_on: null, ...o });

ok(gymOpen(g({}), T) === true, 'an active gym with no end date may send');
ok(gymOpen(g({ subscription_ends_on: '2026-11-18' }), T) === true, 'the end date itself is still open');
ok(gymOpen(g({ subscription_ends_on: '2026-11-17' }), T) === false, 'an expired subscription is closed');
ok(gymOpen(g({ status: 'suspended' }), T) === false, 'a suspended gym is closed');
ok(gymOpen(g({ status: 'trial' }), T) === false, 'a gym that is not active is closed, as in the database');
ok(gymOpen(g({ lock_override: 'force_lock' }), T) === false, 'force_lock closes the gym');
ok(gymOpen(g({ lock_override: 'force_unlock', status: 'suspended', subscription_ends_on: '2020-01-01' }), T) === true, 'force_unlock opens it whatever the status or date');
ok(gymOpen(g({ lock_override: null }), T) === false, 'a null override is closed, as in the database');
ok(gymOpen(null, T) === false, 'a missing gym is closed');
ok(istToday(Date.UTC(2026, 10, 17, 19, 0)) === '2026-11-18', 'late UTC evening is already the next IST day');
ok(istToday(Date.UTC(2026, 10, 17, 18, 0)) === '2026-11-17', 'before IST midnight it is still the same IST day');
ok(Number.isInteger(TEST_DAILY_CAP) && TEST_DAILY_CAP > 0 && TEST_DAILY_CAP <= 50, 'the daily test cap is a small positive number');
console.log(`wagate: ${n} checks ok`);
