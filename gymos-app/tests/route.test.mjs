import { routeNetPaise, transferPayload, transferState, failureKind, isAccountId, MIN_TRANSFER_PAISE, ROUTE_STATES } from '../supabase/functions/razorpay/lib.js';
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };

// money the gym is owed: captured − Razorpay fee − GST on the fee, whole paise only
ok(routeNetPaise({ captured: 10000, fee: 200, tax: 36 }) === 9764, 'Rs 100 captured, fee 2, GST 0.36 -> 9764 paise to the gym');
ok(routeNetPaise({ captured: '118000', fee: '2360', tax: '425' }) === 115215, 'numeric strings from JSON are accepted');
ok(routeNetPaise({ captured: 10000, fee: 0, tax: 0 }) === 10000, 'zero fee is a real value');
ok(routeNetPaise({ captured: 10000 }) === null, 'a missing fee is never treated as zero (that would overpay)');
ok(routeNetPaise({ captured: 10000, fee: 200 }) === null, 'a missing tax is never treated as zero');
ok(routeNetPaise({ captured: 10000.5, fee: 0, tax: 0 }) === null, 'fractional paise refused');
ok(routeNetPaise({ captured: -5, fee: 0, tax: 0 }) === null && routeNetPaise({ captured: 0, fee: 0, tax: 0 }) === null, 'zero or negative capture refused');
ok(routeNetPaise({ captured: 100, fee: 200, tax: 36 }) < MIN_TRANSFER_PAISE, 'fees bigger than the payment leave nothing to send (negative)');
ok(routeNetPaise({ captured: 150, fee: 40, tax: 10 }) === 100 && MIN_TRANSFER_PAISE === 100, 'exactly Rs 1 left is sendable');

// the request body: refuses anything Razorpay would refuse, before any call
const b = transferPayload({ account: 'acc_ABC123xyz', netPaise: 9764, orderId: 'o-1' });
ok(b.transfers.length === 1 && b.transfers[0].account === 'acc_ABC123xyz' && b.transfers[0].amount === 9764 && b.transfers[0].currency === 'INR' && b.transfers[0].notes.order_id === 'o-1', 'one transfer in paise, INR, with the order in notes');
const thrown = (f) => { try { f(); return null; } catch (e) { return e.message; } };
ok(thrown(() => transferPayload({ account: 'rzp_x', netPaise: 9764, orderId: 'o' })) === 'bad_account', 'a non acc_ id is refused');
ok(thrown(() => transferPayload({ account: 'acc_ABC123xyz', netPaise: 99, orderId: 'o' })) === 'amount_too_small', 'under Rs 1 is refused');
ok(thrown(() => transferPayload({ account: 'acc_ABC123xyz', netPaise: 9.5, orderId: 'o' })) === 'amount_too_small', 'fractional paise is refused');
ok(thrown(() => transferPayload({ account: 'acc_ABC123xyz', netPaise: 100, orderId: 'o' })) === null, 'Rs 1 is accepted');

// account ids: public acc_ ids only
ok(isAccountId('acc_ABC123') && isAccountId('acc_' + 'a'.repeat(40)), 'acc_ ids of 6 to 40 characters');
ok(!isAccountId('acc_AB') && !isAccountId('acc_' + 'a'.repeat(41)) && !isAccountId('ACC_ABC123') && !isAccountId('acc_ABC!!!') && !isAccountId(undefined) && !isAccountId(12), 'everything else refused');

// Razorpay states and failure kinds
ok(transferState('processed') === 'processed' && transferState('partially_reversed') === 'partially_reversed', 'known states kept');
ok(transferState('something_new') === 'pending' && transferState(undefined) === 'pending', 'unknown state becomes pending');
ok(ROUTE_STATES.length === 6 && !ROUTE_STATES.includes('routing'), 'routing is ours, not Razorpay\'s');
ok(failureKind(400) === 'failed' && failureKind(401) === 'failed' && failureKind(429) === 'failed', 'a 4xx refusal sent nothing: retry is safe');
ok(failureKind(500) === 'routing' && failureKind(503) === 'routing' && failureKind(0) === 'routing', 'a 5xx, timeout or broken connection: outcome unknown');

console.log(n + ' checks passed');
