/** Shared types/helpers for the Worker (no secrets here). */

export interface Env {
  FIREBASE_PROJECT_ID: string;
  FIRESTORE_DATABASE_ID?: string; // default "(default)"
  SUPER_ADMIN_EMAIL: string; // royalthegym@gmail.com
  SUPER_ADMIN_REQUIRES_MFA?: string; // "true" (default) | "false"
  ALLOWED_ORIGINS: string; // comma separated, e.g. https://your-app.web.app,http://localhost:3000
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string; // default gemini-2.5-flash (e.g. gemini-2.5-flash-lite to save quota)
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_ALLOWED_GYMS?: string; // comma separated gymIds allowed to use the platform WhatsApp number
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  AI_DAILY_LIMIT_PER_USER?: string; // /ai/gym-assist, default 50
  AI_CHAT_DAILY_LIMIT_MEMBER?: string; // /ai/trainer/chat for members, default 30
  AI_CHAT_DAILY_LIMIT_STAFF?: string; // /ai/trainer/chat for trainers/admins, default 60
  AI_PLAN_DAILY_LIMIT?: string; // /ai/trainer/plan per trainer/admin, default 10
  RATE_KV?: KVNamespace; // optional: durable daily quotas (free tier = 1k writes/day)
}

export type Role = 'super_admin' | 'admin' | 'trainer' | 'member';

export interface Caller {
  uid: string;
  email: string | null;
  role: Role;
  gymId: string | null;
  memberId: number | null;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function requireRole(caller: Caller, roles: Role[]) {
  if (!roles.includes(caller.role)) throw new HttpError(403, 'Not allowed for your role.');
}

/** Strip control chars and clamp length. */
export const s = (v: unknown, max = 300) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').slice(0, max);
export const n = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

// ------------------------------------------------------------------ daily quota
const memQuota = new Map<string, number>();

/**
 * Per-user daily quota. Uses KV when bound (durable across isolates), otherwise an
 * in-memory counter per Worker isolate (best effort, zero cost). Returns remaining calls.
 */
export async function useDailyQuota(env: Env, key: string, max: number): Promise<number> {
  const day = new Date().toISOString().slice(0, 10);
  const k = `q:${day}:${key}`;
  if (env.RATE_KV) {
    const used = Number((await env.RATE_KV.get(k)) || '0');
    if (used >= max) throw new HttpError(429, 'Daily AI limit reached. Try again tomorrow.');
    await env.RATE_KV.put(k, String(used + 1), { expirationTtl: 60 * 60 * 26 });
    return max - used - 1;
  }
  const used = memQuota.get(k) || 0;
  if (used >= max) throw new HttpError(429, 'Daily AI limit reached. Try again tomorrow.');
  memQuota.set(k, used + 1);
  if (memQuota.size > 20000) {
    for (const key2 of memQuota.keys()) if (!key2.startsWith(`q:${day}:`)) memQuota.delete(key2);
  }
  return max - used - 1;
}

// ------------------------------------------------------------------ Firestore REST (caller's own token => rules apply)
function fsBase(env: Env) {
  const db = encodeURIComponent(env.FIRESTORE_DATABASE_ID || '(default)');
  return `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/${db}/documents`;
}

export function decodeValue(v: any): any {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  return null;
}
export function decodeFields(f: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(f || {})) out[k] = decodeValue(v);
  return out;
}

/** GET one document. 403/404 => null (caller cannot see it). */
export async function fsGet(env: Env, token: string, path: string): Promise<Record<string, any> | null> {
  const r = await fetch(`${fsBase(env)}/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const d = (await r.json()) as { fields?: Record<string, any> };
  return decodeFields(d.fields || {});
}

const enc = (v: string | number) =>
  typeof v === 'number' ? { integerValue: String(Math.trunc(v)) } : { stringValue: v };

/** Equality-filtered query, newest first by `orderField`. Failures => []. */
export async function fsQuery(
  env: Env,
  token: string,
  collectionId: string,
  equals: Record<string, string | number>,
  orderField: string,
  limit: number
): Promise<Record<string, any>[]> {
  const filters = Object.entries(equals).map(([field, value]) => ({
    fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: enc(value) },
  }));
  const body = {
    structuredQuery: {
      from: [{ collectionId }],
      where: filters.length === 1 ? filters[0] : { compositeFilter: { op: 'AND', filters } },
      orderBy: [{ field: { fieldPath: orderField }, direction: 'DESCENDING' }],
      limit,
    },
  };
  const r = await fetch(`${fsBase(env)}:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) return [];
  const rows = (await r.json()) as Array<{ document?: { fields?: Record<string, any> } }>;
  return rows.filter((x) => x.document).map((x) => decodeFields(x.document!.fields || {}));
}
