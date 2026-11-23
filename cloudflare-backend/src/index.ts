/**
 * Fitness Future — secrets gateway (Cloudflare Workers, free tier).
 *
 * The ONLY place that holds server secrets: GEMINI_API_KEY, WHATSAPP_ACCESS_TOKEN,
 * RAZORPAY_KEY_SECRET. Every request must carry a Firebase ID token:
 *   1. token signature/issuer/audience/expiry verified against Google's JWKS (jose)
 *   2. role + gymId read from Firestore users/{uid} via REST *with the caller's own token*
 *      (so Firestore rules apply; no service account needed)
 *   3. per-user rate limit (in-memory per isolate) + optional daily quota in KV
 * Routes:
 *   GET  /health
 *   GET  /integrations/status          admin | super_admin
 *   POST /ai/gym-assist                admin | trainer | super_admin
 *   GET  /whatsapp/status              admin | super_admin
 *   POST /whatsapp/bulk                admin | super_admin  (gym must be in WHATSAPP_ALLOWED_GYMS)
 *   POST /payments/razorpay/order      admin | member | super_admin
 *   POST /payments/razorpay/verify     admin | member | super_admin
 */
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

export interface Env {
  FIREBASE_PROJECT_ID: string;
  FIRESTORE_DATABASE_ID?: string; // default "(default)"
  SUPER_ADMIN_EMAIL: string; // royalthegym@gmail.com
  SUPER_ADMIN_REQUIRES_MFA?: string; // "true" (default) | "false"
  ALLOWED_ORIGINS: string; // comma separated, e.g. https://your-app.web.app,http://localhost:3000
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string; // default gemini-2.5-flash
  WHATSAPP_PHONE_NUMBER_ID?: string;
  WHATSAPP_ACCESS_TOKEN?: string;
  WHATSAPP_ALLOWED_GYMS?: string; // comma separated gymIds allowed to use the platform WhatsApp number
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  AI_DAILY_LIMIT_PER_USER?: string; // default 50
  RATE_KV?: KVNamespace; // optional: durable daily quotas (free tier = 1k writes/day)
}

type Role = 'super_admin' | 'admin' | 'trainer' | 'member';
interface Caller {
  uid: string;
  email: string | null;
  role: Role;
  gymId: string | null;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

// ------------------------------------------------------------------ CORS
function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(req: Request, env: Env, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req, env) },
  });
}

// ------------------------------------------------------------------ AUTH
async function authenticate(req: Request, env: Env): Promise<{ caller: Caller; token: string }> {
  const header = req.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Missing Firebase ID token.');

  let payload: JWTPayload & Record<string, any>;
  try {
    const res = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
      algorithms: ['RS256'],
    });
    payload = res.payload as any;
  } catch {
    throw new HttpError(401, 'Invalid or expired ID token.');
  }
  const uid = String(payload.sub || '');
  if (!uid) throw new HttpError(401, 'Invalid token subject.');
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : null;

  // Super admin: token only (same checks as firestore.rules isSuperAdmin()).
  if (email && email === env.SUPER_ADMIN_EMAIL.toLowerCase() && payload.email_verified === true) {
    const needsMfa = (env.SUPER_ADMIN_REQUIRES_MFA || 'true') !== 'false';
    const factor = payload.firebase?.sign_in_second_factor;
    if (!needsMfa || factor === 'totp') {
      return { caller: { uid, email, role: 'super_admin', gymId: null }, token };
    }
    throw new HttpError(403, 'Super admin must sign in with 2-step verification.');
  }

  // Everyone else: Firestore users/{uid}, read with the caller's own token (rules apply).
  const db = encodeURIComponent(env.FIRESTORE_DATABASE_ID || '(default)');
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/${db}/documents/users/${uid}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 404) throw new HttpError(403, 'No profile for this account.');
  if (!r.ok) throw new HttpError(403, `Profile lookup failed (${r.status}).`);
  const doc = (await r.json()) as { fields?: Record<string, any> };
  const f = doc.fields || {};
  const role = f.role?.stringValue as Role | undefined;
  const status = f.status?.stringValue;
  const gymId = f.gymId?.stringValue || null;
  if (!role || !['admin', 'trainer', 'member'].includes(role)) throw new HttpError(403, 'Unknown role.');
  if (status !== 'active') throw new HttpError(403, 'Account is not active.');
  return { caller: { uid, email, role, gymId }, token };
}

function requireRole(caller: Caller, roles: Role[]) {
  if (!roles.includes(caller.role)) throw new HttpError(403, 'Not allowed for your role.');
}

// ------------------------------------------------------------------ RATE LIMITS
const buckets = new Map<string, number[]>();
/** Sliding-window limiter, per Worker isolate (best effort, zero cost). */
function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) throw new HttpError(429, 'Too many requests. Please slow down.');
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.some((t) => now - t < windowMs)) buckets.delete(k);
  }
}

/** Daily quota persisted in KV when bound (1 write per call — keep for paid actions only). */
async function dailyQuota(env: Env, key: string, max: number) {
  if (!env.RATE_KV) return;
  const day = new Date().toISOString().slice(0, 10);
  const k = `q:${day}:${key}`;
  const used = Number((await env.RATE_KV.get(k)) || '0');
  if (used >= max) throw new HttpError(429, 'Daily limit reached. Try again tomorrow.');
  await env.RATE_KV.put(k, String(used + 1), { expirationTtl: 60 * 60 * 26 });
}

// ------------------------------------------------------------------ AI
const s = (v: unknown, max = 300) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').slice(0, max);
const n = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

function aiPrompt(task: string, p: Record<string, any>): { system: string; user: string; json: boolean } | null {
  switch (task) {
    case 'workout_plan':
      return {
        system:
          'You are a certified strength and conditioning coach. Return strictly valid JSON with keys: name (string), category (string), level (string), frequency (string), duration (string), description (string), scientificNote (string), days (array of { name: string, duration: string, intensity: "Low"|"Medium"|"High", exercises: array of { name: string, sets: string, reps: string, rest: string, notes: string } }). Create 3 structured training days with 4-5 exercises each.',
        user: `Create a personalized gym workout plan for goal: "${s(p.goal, 80) || 'Fitness'}", level: "${s(p.level, 40) || 'Beginner'}", days per week: ${n(p.daysPerWeek, 4)}, notes: "${s(p.notes, 300) || 'Standard gym equipment'}".`,
        json: true,
      };
    case 'diet_plan':
      return {
        system:
          'You are a certified Indian sports nutritionist. Return strictly valid JSON with keys: name (string), goal (string), calories (number), macros ({ protein: number, carbs: number, fats: number }), description (string), scientificNote (string), disclaimer (string), meals (array of { name: string, time: string, totalCalories: number, macros: { protein: number, carbs: number, fats: number }, items: array of { food: string, portion: string, calories: number, protein: number, carbs: number, fats: number } }). Include 5 realistic Indian meals. Respect all stated allergies/restrictions strictly. Always set disclaimer to "Nutritional estimates only — not a substitute for professional medical or clinical dietary advice."',
        user: `Create a daily Indian diet plan for goal: "${s(p.goal, 80) || 'Weight Loss'}", preference: "${s(p.dietType, 40) || 'Vegetarian'}", target calories: ${n(p.calories, 1850)}, weight: ${n(p.weight, 72)}kg, allergies/restrictions: "${s(p.allergies, 200) || 'None'}".`,
        json: true,
      };
    case 'offer_description':
      return {
        system: 'You are a gym marketing copywriter. Write a crisp, persuasive 2-sentence promotional description for a gym membership offer. Plain text only, no markdown or hashtags.',
        user: `Offer title: "${s(p.title, 120)}", discount: "${s(p.discountText, 60)}", applicable plan: "${s(p.applicablePlan, 80)}", promo code: "${s(p.code, 30)}".`,
        json: false,
      };
    case 'review_reply':
      return {
        system: 'You are a professional gym manager responding to a member review. Write a warm, concise, 2-3 sentence reply tailored to the star rating. Plain text only.',
        user: `Gym name: "${s(p.gymName, 120)}". Member: "${s(p.memberName, 80)}". Rating: ${n(p.rating, 5)}/5. Category: "${s(p.category, 40)}". Review: "${s(p.comment, 1000)}".`,
        json: false,
      };
    case 'whatsapp_message':
      return {
        system: 'You are a gym customer success specialist. Write a clear, polite WhatsApp Business message (under 60 words) ready to send to members. Use {name} placeholder for member name. Plain text only.',
        user: `Gym name: "${s(p.gymName, 120)}". Purpose: "${s(p.purpose, 120)}". Details: "${s(p.details, 500)}".`,
        json: false,
      };
    case 'lead_pitch':
      return {
        system: 'You are a friendly gym membership advisor. Write a concise 2-3 sentence WhatsApp/call follow-up script for a prospective gym lead. Plain text only.',
        user: `Lead name: "${s(p.name, 80)}", goal: "${s(p.goal, 80)}", source: "${s(p.source, 40)}", current stage: "${s(p.status, 40)}".`,
        json: false,
      };
    case 'dashboard_insights':
      return {
        system:
          'You are a gym business operations advisor. Base insights STRICTLY on the numbers provided; never invent statistics. Return strictly valid JSON: { "insights": [ { "title": string, "detail": string, "priority": "high"|"medium"|"low", "actionLabel": string, "targetView": string } ] } with 4 actionable insights. Allowed targetView values: "billing", "members", "leads", "expenses", "attendance", "offers", "reviews".',
        user: `Gym metrics: Active Members=${n(p.activeMembers)}, Expired=${n(p.expiredMembers)}, Monthly Revenue=${n(p.revenue)}, Pending Dues=${n(p.pendingDues)}, Expenses=${n(p.expenses)}, Open Leads=${n(p.openLeads)}, Pending Reviews=${n(p.pendingReviews)}.`,
        json: true,
      };
    case 'report_summary':
      return {
        system:
          'You are a senior gym financial and operations analyst. Base your report STRICTLY on the exact figures provided; NEVER invent statistics. Return strictly valid JSON with keys: headline (string), executiveSummary (string), keyFindings (array of 3 strings citing exact numbers), recommendedActions (array of 3 strings).',
        user: `Gym: ${s(p.gymName, 120)}. Timeframe: ${s(p.timeframe, 30)}. Total Members: ${n(p.totalMembers)}, Active: ${n(p.activeMembers)}, Expired: ${n(p.expiredMembers)}. Collected Revenue: ${n(p.collectedRevenue ?? p.revenue)}, Expenses: ${n(p.totalExpenses ?? p.expenses)}, Net Profit: ${n(p.netProfit)} (${n(p.profitMarginPercent)}% margin), Outstanding: ${n(p.outstandingBalances ?? p.outstanding)}, Check-Ins: ${n(p.attendanceCheckIns ?? p.attendanceCount)}, Leads: ${n(p.leadsConverted)}/${n(p.leadsTotal)} converted, Staff: ${n(p.staffCount)}.`,
        json: true,
      };
    case 'billing_audit':
      return {
        system: 'You are a gym billing controller. Review the billing snapshot and output 2-3 concise action points on pending dues, partial payments, and collection priority. Never invent figures. Plain text only.',
        user: `Collected: ${n(p.collected)}, Pending/Partial Balance: ${n(p.outstanding)}, Overdue Invoices: ${n(p.overdueCount)}, Partial Invoices: ${n(p.partialCount)}, Refunded Total: ${n(p.refunded)}.`,
        json: false,
      };
    default:
      return null;
  }
}

async function handleAi(req: Request, env: Env, caller: Caller): Promise<Response> {
  requireRole(caller, ['admin', 'trainer', 'super_admin']);
  if (!env.GEMINI_API_KEY) throw new HttpError(503, 'AI is not configured on the server.');
  rateLimit(`ai:${caller.uid}`, 8, 60_000);
  const body = (await req.json().catch(() => ({}))) as { task?: string; payload?: Record<string, any> };
  const spec = aiPrompt(String(body.task || ''), body.payload || {});
  if (!spec) throw new HttpError(400, 'Unsupported AI task.');
  await dailyQuota(env, `ai:${caller.uid}`, Number(env.AI_DAILY_LIMIT_PER_USER || 50));

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: spec.system }] },
      contents: [{ role: 'user', parts: [{ text: spec.user }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.6, ...(spec.json ? { responseMimeType: 'application/json' } : {}) },
    }),
  });
  if (!r.ok) throw new HttpError(502, `AI provider error (${r.status}).`);
  const out = (await r.json()) as any;
  const text: string = (out?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join('').trim();
  if (spec.json) {
    try {
      const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      return json(req, env, { success: true, data: JSON.parse(cleaned) });
    } catch {
      throw new HttpError(502, 'AI returned malformed JSON. Please retry.');
    }
  }
  return json(req, env, { success: true, text });
}

// ------------------------------------------------------------------ WhatsApp
const waConfigured = (env: Env) => Boolean(env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
function gymAllowedForWhatsApp(env: Env, caller: Caller, gymId: string | null): boolean {
  if (caller.role === 'super_admin') return true;
  const allowed = (env.WHATSAPP_ALLOWED_GYMS || '').split(',').map((x) => x.trim()).filter(Boolean);
  return Boolean(gymId && allowed.includes(gymId));
}

async function handleWhatsAppBulk(req: Request, env: Env, caller: Caller): Promise<Response> {
  requireRole(caller, ['admin', 'super_admin']);
  const body = (await req.json().catch(() => ({}))) as any;
  const gymId = caller.role === 'super_admin' ? String(body.gymId || '') : caller.gymId;
  const recipients: Array<{ name?: string; phone?: string; whatsappConsent?: boolean }> = Array.isArray(body.recipients) ? body.recipients.slice(0, 50) : [];
  const templateName = s(body.templateName, 80) || 'gym_broadcast';
  const messageText = s(body.messageText, 1000);
  if (!recipients.length) throw new HttpError(400, 'At least one recipient is required.');

  const mkLog = (r: any, phone: string, status: string, error: string | null) => ({
    recipient_name: s(r.name, 80) || 'Member',
    recipient_phone: phone,
    template_name: templateName,
    message_preview: messageText.replace(/\{name\}/gi, s(r.name, 80) || 'Member').slice(0, 200),
    status,
    error_message: error,
  });

  if (!waConfigured(env) || !gymAllowedForWhatsApp(env, caller, gymId)) {
    const msg = !waConfigured(env)
      ? 'WhatsApp Business Cloud API is not connected on the server. Message was NOT sent.'
      : 'WhatsApp sending is not enabled for this gym. Ask the platform owner.';
    return json(req, env, { success: false, configured: false, sentCount: 0, failedCount: recipients.length, error: msg, logs: recipients.slice(0, 25).map((r) => mkLog(r, s(r.phone, 20), 'Failed - API Not Connected', msg)) }, 503);
  }

  rateLimit(`wa:${caller.uid}`, 3, 60_000);
  await dailyQuota(env, `wa:${gymId}`, 20); // 20 bulk sends (≤50 each) per gym per day

  let sentCount = 0;
  let failedCount = 0;
  const logs: any[] = [];
  for (const r of recipients) {
    const digits = String(r.phone || '').replace(/\D/g, '');
    const to = digits.length === 10 ? `91${digits}` : digits;
    if (r.whatsappConsent === false || to.length < 11) {
      failedCount += 1;
      logs.push(mkLog(r, to, r.whatsappConsent === false ? 'Failed - No Consent' : 'Failed - Invalid Number', null));
      continue;
    }
    const text = messageText.replace(/\{name\}/gi, s(r.name, 80) || 'Member');
    try {
      const res = await fetch(`https://graph.facebook.com/v22.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
      });
      if (res.ok) {
        sentCount += 1;
        logs.push(mkLog(r, to, 'Sent', null));
      } else {
        failedCount += 1;
        const err = (await res.json().catch(() => ({}))) as any;
        logs.push(mkLog(r, to, 'Failed - Gateway Error', err?.error?.message || `HTTP ${res.status}`));
      }
    } catch (e: any) {
      failedCount += 1;
      logs.push(mkLog(r, to, 'Failed - Gateway Error', e?.message || 'Network failure'));
    }
  }
  return json(req, env, { success: sentCount > 0, configured: true, sentCount, failedCount, logs });
}

// ------------------------------------------------------------------ Razorpay (not yet wired into UI)
async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function handleRazorpayOrder(req: Request, env: Env, caller: Caller): Promise<Response> {
  requireRole(caller, ['admin', 'member', 'super_admin']);
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw new HttpError(503, 'Payments are not configured.');
  rateLimit(`rzp:${caller.uid}`, 10, 60_000);
  const body = (await req.json().catch(() => ({}))) as any;
  const amountPaise = Math.round(n(body.amountRupees) * 100);
  if (amountPaise < 100 || amountPaise > 10_000_000) throw new HttpError(400, 'Amount must be between ₹1 and ₹1,00,000.');
  const r = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: s(body.receipt, 40) || `ff_${Date.now()}`,
      notes: { gymId: caller.gymId || '', uid: caller.uid, invoiceId: s(body.invoiceId, 40) },
    }),
  });
  const out = (await r.json().catch(() => ({}))) as any;
  if (!r.ok) throw new HttpError(502, out?.error?.description || 'Could not create order.');
  return json(req, env, { success: true, orderId: out.id, amount: out.amount, currency: out.currency, keyId: env.RAZORPAY_KEY_ID });
}

async function handleRazorpayVerify(req: Request, env: Env, caller: Caller): Promise<Response> {
  requireRole(caller, ['admin', 'member', 'super_admin']);
  if (!env.RAZORPAY_KEY_SECRET) throw new HttpError(503, 'Payments are not configured.');
  const body = (await req.json().catch(() => ({}))) as any;
  const expected = await hmacHex(env.RAZORPAY_KEY_SECRET, `${s(body.razorpay_order_id, 60)}|${s(body.razorpay_payment_id, 60)}`);
  const given = s(body.razorpay_signature, 128);
  let diff = expected.length ^ given.length;
  for (let i = 0; i < Math.min(expected.length, given.length); i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return json(req, env, { success: diff === 0, verified: diff === 0 });
}

// ------------------------------------------------------------------ router
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(req, env) });
    const path = new URL(req.url).pathname.replace(/\/+$/, '') || '/';
    try {
      if (path === '/health') return json(req, env, { ok: true });

      const { caller } = await authenticate(req, env);
      rateLimit(`all:${caller.uid}`, 60, 60_000);

      if (path === '/ai/gym-assist' && req.method === 'POST') return await handleAi(req, env, caller);
      if (path === '/whatsapp/bulk' && req.method === 'POST') return await handleWhatsAppBulk(req, env, caller);
      if (path === '/payments/razorpay/order' && req.method === 'POST') return await handleRazorpayOrder(req, env, caller);
      if (path === '/payments/razorpay/verify' && req.method === 'POST') return await handleRazorpayVerify(req, env, caller);
      if (path === '/whatsapp/status' && req.method === 'GET') {
        requireRole(caller, ['admin', 'super_admin']);
        const ok = waConfigured(env) && gymAllowedForWhatsApp(env, caller, caller.gymId);
        return json(req, env, {
          success: true,
          configured: ok,
          provider: 'Meta WhatsApp Business Cloud API v22.0',
          message: ok ? 'WhatsApp Business Cloud API is connected.' : 'WhatsApp sending is not enabled for this gym.',
        });
      }
      if (path === '/integrations/status' && req.method === 'GET') {
        requireRole(caller, ['admin', 'super_admin']);
        return json(req, env, {
          success: true,
          integrations: {
            geminiAI: { connected: Boolean(env.GEMINI_API_KEY), label: env.GEMINI_API_KEY ? 'Connected' : 'Not configured' },
            whatsappBusiness: { connected: waConfigured(env), label: waConfigured(env) ? 'Connected (Meta Cloud API)' : 'Not connected' },
            razorpay: { connected: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET), label: env.RAZORPAY_KEY_SECRET ? 'Connected' : 'Not configured' },
            googleBusinessProfile: { connected: false, label: 'Not connected — manual review management only' },
          },
        });
      }
      throw new HttpError(404, 'Not found.');
    } catch (e: any) {
      const status = e instanceof HttpError ? e.status : 500;
      return json(req, env, { success: false, error: e instanceof HttpError ? e.message : 'Internal error.' }, status);
    }
  },
};
