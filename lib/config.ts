/**
 * Single source of truth for platform-level configuration.
 *
 * SUPER_ADMIN_EMAIL is the ONLY account that can ever hold the super_admin role.
 * The same value is hard-coded in firestore.rules (isSuperAdmin) and in the
 * Cloudflare Worker (SUPER_ADMIN_EMAIL var). Change all three together.
 */
export const SUPER_ADMIN_EMAIL = 'royalthegym@gmail.com';

const env = (import.meta as any).env || {};

/** Base URL of the Cloudflare Worker that holds every server secret (Gemini, WhatsApp, Razorpay). */
export const WORKER_URL: string = String(env.VITE_WORKER_URL || '').replace(/\/+$/, '');

/**
 * Firestore database id. Spark (free) plan: only ONE database gets the free quota,
 * normally "(default)". Override with VITE_FIRESTORE_DATABASE_ID only if the console
 * shows your named database as the free-tier one.
 */
export const FIRESTORE_DATABASE_ID: string = String(env.VITE_FIRESTORE_DATABASE_ID || '(default)');

/**
 * Phone OTP sign-in. Since Sept 2024 Firebase SMS requires a Cloud Billing account (Blaze),
 * so it is OFF by default to keep the app at zero cost.
 */
export const ENABLE_PHONE_AUTH: boolean = String(env.VITE_ENABLE_PHONE_AUTH || 'false') === 'true';

/** Demo seed data can only be loaded in `vite dev` AND with VITE_ENABLE_DEMO_SEED=true. */
export const ENABLE_DEMO_SEED: boolean = Boolean(env.DEV) && String(env.VITE_ENABLE_DEMO_SEED || 'false') === 'true';

/**
 * Super admin must have signed in with a TOTP second factor.
 * Must match superAdminRequiresMfa() in firestore.rules.
 */
export const SUPER_ADMIN_REQUIRES_MFA: boolean = String(env.VITE_SUPER_ADMIN_REQUIRES_MFA || 'true') !== 'false';

export const isSuperAdminEmail = (email?: string | null): boolean =>
  (email || '').trim().toLowerCase() === SUPER_ADMIN_EMAIL;

/** Firestore collections that hold per-gym data. Every document carries `gymId`. */
export const GYM_COLLECTIONS = {
  members: 'members',
  packages: 'packages',
  invoices: 'invoices',
  payments: 'payments',
  attendance: 'attendance',
  staff: 'staff',
  expenses: 'expenses',
  leads: 'leads',
  offers: 'offers',
  reviews: 'reviews',
  workoutTemplates: 'workoutTemplates',
  dietPlans: 'dietPlans',
  whatsappLogs: 'whatsappLogs',
  auditLogs: 'auditLogs',
  trainerSessions: 'trainerSessions',
  joinRequests: 'joinRequests',
  injuries: 'injuries',
  progressLogs: 'progressLogs',
  plans: 'plans',
  aiChats: 'aiChats',
  foodLogs: 'foodLogs',
  progressSummaries: 'progressSummaries',
} as const;
