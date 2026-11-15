// Pure helpers for the push-dispatch Edge Function (no network). Tested in tests/push.test.mjs.

/** What to do with a subscription after the push service answered with this HTTP status (undefined = network error). */
export function classify(status) {
  if (status === 404 || status === 410) return 'gone'; // the phone removed it: forget this device
  if (status === undefined || status === null || status === 429 || status >= 500) return 'retry';
  if (status >= 200 && status < 300) return 'ok';
  return 'bad'; // 400/401/403 ...: our request was refused, retrying will not help
}

/** Only same-site paths may be opened when the notification is tapped. */
export function safePath(u) {
  const s = String(u || '/');
  return /^\/(?!\/)[\w\-./#?=&%]*$/.test(s) ? s : '/';
}

/** The JSON the service worker receives. Short, plain text only. */
export function cleanPayload(row) {
  const clip = (s, n) => String(s || '').replace(/[\u0000-\u001f]+/g, ' ').trim().slice(0, n);
  return JSON.stringify({ title: clip(row.title, 60) || 'Gym', body: clip(row.body, 200), url: safePath(row.url), kind: String(row.kind || '') });
}

/** Final state of one queued message after trying every device the person has. */
export function outcome(results, attempts, maxAttempts = 3) {
  if (!results.length) return { status: 'skipped', error: 'no device' };
  if (results.some((r) => r === 'ok')) return { status: 'sent', error: null };
  if (results.every((r) => r === 'gone')) return { status: 'skipped', error: 'devices removed' };
  if (results.some((r) => r === 'retry') && attempts < maxAttempts) return { status: 'queued', error: 'will retry' };
  return { status: 'failed', error: results.includes('retry') ? 'push service unavailable' : 'refused by push service' };
}
