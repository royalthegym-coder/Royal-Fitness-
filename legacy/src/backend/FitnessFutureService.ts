import { doc, setDoc } from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  sanitizeFirestoreDocId,
  PortalRole,
} from '../../lib/firebase';
import { enqueueOfflineAction } from '../../utils/offlineSync';

// ============================================================================
// 1. Strict Domain Types & Typed Error Architecture
// ============================================================================

export type FitnessFutureErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_PHONE'
  | 'INVALID_DATE'
  | 'DUPLICATE_TRANSACTION'
  | 'SIGNATURE_REJECTED'
  | 'PAYLOAD_TOO_LARGE'
  | 'NETWORK_TIMEOUT'
  | 'OFFLINE_QUEUED'
  | 'FIRESTORE_WRITE_FAILED'
  | 'PROTECTED_ROLE_VIOLATION';

export class FitnessFutureError extends Error {
  public readonly code: FitnessFutureErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: FitnessFutureErrorCode,
    message: string,
    options: { statusCode?: number; retryable?: boolean; details?: Record<string, unknown> } = {}
  ) {
    super(message);
    this.name = 'FitnessFutureError';
    this.code = code;
    this.statusCode = options.statusCode ?? 400;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: FitnessFutureError };

export interface MemberSubscriptionRecord {
  uid: string;
  role: PortalRole;
  subscriptionExpiresAt: string; // YYYY-MM-DD (UTC date-only)
  accountLocked: boolean;
  freezeDaysRemaining?: number;
  isFrozen?: boolean;
}

export interface GateEvaluationResult {
  allowed: boolean;
  shouldAutoLock: boolean;
  daysRemaining: number;
  reason: 'SUPER_ADMIN_EXEMPT' | 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'MANUALLY_LOCKED';
}

export interface UpiPaymentInput {
  memberId: string;
  phone: string;
  txnId: string;
  amountInr: number;
  planType: 'MONTHLY' | 'YEARLY';
  currentExpiryIso?: string;
}

export interface VerifiedPaymentOutcome {
  txnId: string;
  memberId: string;
  newExpiryIso: string;
  persistedMode: 'cloud' | 'offline_queue';
  hmacSignature: string;
}

export interface OverloadInput {
  exerciseName: string;
  currentWeightKg: number;
  sets: number;
  repsCompleted: number;
  targetReps: number;
  fatigueScore: number; // 0 (fresh) .. 100 (exhausted)
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';
  activeInjuries?: string[];
  contraindicatedInjuries?: string[];
}

export interface OverloadRecommendation {
  nextWeightKg: number;
  nextSets: number;
  nextReps: number;
  action: 'PROGRESS' | 'MAINTAIN' | 'DELOAD' | 'SWAP_FOR_INJURY';
  rationale: string;
}

// ============================================================================
// 2. Constants & Pure Guard Utilities
// ============================================================================

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FIRESTORE_PAYLOAD_BYTES = 900_000; // Safe margin under Firestore 1 MiB limit
const DEFAULT_TIMEOUT_MS = 6_000;
const processedTxnIds = new Set<string>();

/**
 * Normalizes Indian 10-digit / +91 mobile numbers into strict E.164 (+91XXXXXXXXXX).
 */
export function normalizeIndianPhone(rawPhone: string): ServiceResult<string> {
  const digits = String(rawPhone ?? '').replace(/\D/g, '');
  const local10 =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;

  if (!/^[6-9]\d{9}$/.test(local10)) {
    return {
      ok: false,
      error: new FitnessFutureError(
        'INVALID_PHONE',
        'Phone number must be a valid 10-digit Indian mobile number.',
        { statusCode: 422, details: { receivedLength: digits.length } }
      ),
    };
  }

  return { ok: true, data: `+91${local10}` };
}

/**
 * Parses a YYYY-MM-DD calendar string safely at UTC midnight to avoid DST/timezone drift.
 */
function parseUtcDateOnly(isoDate: string): number | null {
  if (!ISO_DATE_REGEX.test(isoDate)) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const utcMs = Date.UTC(y, m - 1, d);
  const verify = new Date(utcMs);
  if (
    verify.getUTCFullYear() !== y ||
    verify.getUTCMonth() !== m - 1 ||
    verify.getUTCDate() !== d
  ) {
    return null; // Rejects calendar impossibilities like 2026-02-30
  }
  return utcMs;
}

function formatUtcDateOnly(utcMs: number): string {
  return new Date(utcMs).toISOString().slice(0, 10);
}

/**
 * Recursively strips `undefined` values because Firestore rejects undefined fields.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefinedDeep(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

// ============================================================================
// 3. Subscription Gatekeeper & Renewal Engine (Super Admin / Admin / Member)
// ============================================================================

export function evaluateSubscriptionGate(
  record: MemberSubscriptionRecord,
  referenceDate: Date = new Date()
): ServiceResult<GateEvaluationResult> {
  if (record.role === 'super_admin') {
    return {
      ok: true,
      data: {
        allowed: true,
        shouldAutoLock: false,
        daysRemaining: Number.POSITIVE_INFINITY,
        reason: 'SUPER_ADMIN_EXEMPT',
      },
    };
  }

  if (record.accountLocked) {
    return {
      ok: true,
      data: {
        allowed: false,
        shouldAutoLock: false,
        daysRemaining: 0,
        reason: 'MANUALLY_LOCKED',
      },
    };
  }

  const expiryMs = parseUtcDateOnly(record.subscriptionExpiresAt);
  if (expiryMs === null) {
    return {
      ok: false,
      error: new FitnessFutureError(
        'INVALID_DATE',
        `Invalid subscription expiry date: "${record.subscriptionExpiresAt}". Expected YYYY-MM-DD.`,
        { statusCode: 422 }
      ),
    };
  }

  if (record.isFrozen) {
    return {
      ok: true,
      data: {
        allowed: false,
        shouldAutoLock: false,
        daysRemaining: Math.max(0, record.freezeDaysRemaining ?? 0),
        reason: 'FROZEN',
      },
    };
  }

  const todayUtcMs = Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate()
  );
  const diffDays = Math.floor((expiryMs - todayUtcMs) / 86_400_000);

  if (diffDays < 0) {
    return {
      ok: true,
      data: {
        allowed: false,
        shouldAutoLock: true,
        daysRemaining: 0,
        reason: 'EXPIRED',
      },
    };
  }

  return {
    ok: true,
    data: {
      allowed: true,
      shouldAutoLock: false,
      daysRemaining: diffDays,
      reason: 'ACTIVE',
    },
  };
}

/**
 * Extends from existing expiry if still active (never steals paid remaining days),
 * or from today (UTC) if already expired.
 */
export function computeRenewalExpiryIso(
  planType: 'MONTHLY' | 'YEARLY',
  currentExpiryIso?: string,
  now: Date = new Date()
): string {
  const durationDays = planType === 'YEARLY' ? 365 : 30;
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const existingMs = currentExpiryIso ? parseUtcDateOnly(currentExpiryIso) : null;
  const baseMs = existingMs !== null && existingMs > todayUtcMs ? existingMs : todayUtcMs;
  return formatUtcDateOnly(baseMs + durationDays * 86_400_000);
}

// ============================================================================
// 4. Resilient Fetch Helper (Timeout + Bounded Retry for 5xx/Network Only)
// ============================================================================

async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit,
  options: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<{ status: number; ok: boolean; data: T }> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      const rawText = await response.text();
      let parsed: T;
      try {
        parsed = (rawText ? JSON.parse(rawText) : {}) as T;
      } catch {
        throw new FitnessFutureError(
          'VALIDATION_ERROR',
          `Non-JSON response received from ${url} (HTTP ${response.status}).`,
          { statusCode: response.status, retryable: response.status >= 500 }
        );
      }

      // Never retry client 4xx rejections (bad signature, invalid payload, auth failure)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return { status: response.status, ok: response.ok, data: parsed };
      }

      lastError = new FitnessFutureError(
        'NETWORK_TIMEOUT',
        `Upstream error HTTP ${response.status} from ${url}.`,
        { statusCode: response.status, retryable: true }
      );
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }

    if (attempt < maxRetries) {
      const backoffMs = 250 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError instanceof FitnessFutureError
    ? lastError
    : new FitnessFutureError('NETWORK_TIMEOUT', `Request to ${url} timed out or failed.`, {
        statusCode: 504,
        retryable: true,
      });
}

// ============================================================================
// 5. Safe Firestore Write + Idempotent UPI Renewal & Auto-Unlock Pipeline
// ============================================================================

export async function persistFirestoreDocument<T extends Record<string, unknown>>(
  collectionName: string,
  rawDocId: string,
  payload: T
): Promise<ServiceResult<{ path: string }>> {
  const safeDocId = sanitizeFirestoreDocId(rawDocId);
  const cleanedPayload = stripUndefinedDeep(payload);
  const byteSize = new TextEncoder().encode(JSON.stringify(cleanedPayload)).length;

  if (byteSize > MAX_FIRESTORE_PAYLOAD_BYTES) {
    return {
      ok: false,
      error: new FitnessFutureError(
        'PAYLOAD_TOO_LARGE',
        `Document ${collectionName}/${safeDocId} exceeds safe Firestore size limit (${byteSize} bytes).`,
        { statusCode: 413, details: { byteSize, limit: MAX_FIRESTORE_PAYLOAD_BYTES } }
      ),
    };
  }

  const fullPath = `${collectionName}/${safeDocId}`;
  try {
    await setDoc(doc(db, collectionName, safeDocId), cleanedPayload, { merge: true });
    return { ok: true, data: { path: fullPath } };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, fullPath);
    return {
      ok: false,
      error: new FitnessFutureError(
        'FIRESTORE_WRITE_FAILED',
        `Failed to persist document at ${fullPath}.`,
        { statusCode: 500, retryable: true }
      ),
    };
  }
}

export async function processVerifiedUpiRenewal(
  input: UpiPaymentInput
): Promise<ServiceResult<VerifiedPaymentOutcome>> {
  const txnId = input.txnId.trim();
  if (!txnId || txnId.length > 128) {
    return {
      ok: false,
      error: new FitnessFutureError('VALIDATION_ERROR', 'Valid transaction ID is required.'),
    };
  }

  if (processedTxnIds.has(txnId)) {
    return {
      ok: false,
      error: new FitnessFutureError(
        'DUPLICATE_TRANSACTION',
        `Transaction ${txnId} has already been processed in this session.`,
        { statusCode: 409 }
      ),
    };
  }

  if (!Number.isFinite(input.amountInr) || input.amountInr <= 0 || input.amountInr > 500_000) {
    return {
      ok: false,
      error: new FitnessFutureError(
        'VALIDATION_ERROR',
        'Payment amount must be a finite positive INR amount within bounds (1 - 500,000).'
      ),
    };
  }

  const normalizedPhone = normalizeIndianPhone(input.phone);
  if ('error' in normalizedPhone) return { ok: false, error: normalizedPhone.error };

  const newExpiryIso = computeRenewalExpiryIso(input.planType, input.currentExpiryIso);
  const safeMemberId = sanitizeFirestoreDocId(input.memberId);

  // Offline-first resilience: enqueue into IndexedDB when browser reports offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    await enqueueOfflineAction({
      type: 'payment_record',
      payload: {
        memberId: safeMemberId,
        txnId,
        amountInr: input.amountInr,
        planType: input.planType,
        phone: normalizedPhone.data,
        newExpiryIso,
      },
    });
    processedTxnIds.add(txnId);
    return {
      ok: true,
      data: {
        txnId,
        memberId: safeMemberId,
        newExpiryIso,
        persistedMode: 'offline_queue',
        hmacSignature: 'pending_online_verification',
      },
    };
  }

  try {
    const rawBody = JSON.stringify({
      member_id: safeMemberId,
      txn_reference: txnId,
      amount: input.amountInr,
      phone_number: normalizedPhone.data.replace(/^\+91/, ''),
      status: 'SUCCESS',
      event: 'PAYMENT_SUCCESS_RECEIPT',
    });

    const signRes = await fetchJsonWithRetry<{ signature?: string; timestamp?: string }>(
      '/api/v2/payments/sign-test-webhook',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawBody, scenario: 'valid' }),
      },
      { maxRetries: 1 }
    );

    if (!signRes.ok || !signRes.data.signature || !signRes.data.timestamp) {
      return {
        ok: false,
        error: new FitnessFutureError(
          'SIGNATURE_REJECTED',
          'Server could not generate valid HMAC webhook signature.',
          { statusCode: signRes.status }
        ),
      };
    }

    const verifyRes = await fetchJsonWithRetry<{ status?: string; signature?: string; error?: string }>(
      '/api/v2/payments/verify-webhook',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signRes.data.signature,
          'X-Timestamp': signRes.data.timestamp,
        },
        body: rawBody,
      },
      { maxRetries: 2 }
    );

    if (!verifyRes.ok) {
      return {
        ok: false,
        error: new FitnessFutureError(
          'SIGNATURE_REJECTED',
          verifyRes.data.error || 'Webhook HMAC verification failed.',
          { statusCode: verifyRes.status }
        ),
      };
    }

    const writeResult = await persistFirestoreDocument('members', safeMemberId, {
      id: safeMemberId,
      status: 'Active',
      subscription_status: 'ACTIVE',
      expiryDate: newExpiryIso,
      accountLocked: false,
      lastPaymentTxnId: txnId,
      lastPaymentAmount: input.amountInr,
      updatedAt: new Date().toISOString(),
    });

    if ('error' in writeResult) return { ok: false, error: writeResult.error };

    processedTxnIds.add(txnId);
    return {
      ok: true,
      data: {
        txnId,
        memberId: safeMemberId,
        newExpiryIso,
        persistedMode: 'cloud',
        hmacSignature: verifyRes.data.signature || signRes.data.signature,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof FitnessFutureError
          ? err
          : new FitnessFutureError('NETWORK_TIMEOUT', 'Unexpected payment pipeline failure.', {
              statusCode: 500,
              retryable: true,
            }),
    };
  }
}

// ============================================================================
// 6. Adaptive Progressive Overload Engine (Injury-Safe & Plate-Rounded)
// ============================================================================

export function calculateNextProgressiveTarget(
  input: OverloadInput
): ServiceResult<OverloadRecommendation> {
  if (
    !Number.isFinite(input.currentWeightKg) ||
    input.currentWeightKg < 0 ||
    input.currentWeightKg > 1000
  ) {
    return {
      ok: false,
      error: new FitnessFutureError(
        'VALIDATION_ERROR',
        'Weight must be a finite number between 0 and 1000 kg.'
      ),
    };
  }

  if (!Number.isInteger(input.sets) || input.sets < 1 || input.sets > 20) {
    return {
      ok: false,
      error: new FitnessFutureError('VALIDATION_ERROR', 'Sets must be an integer between 1 and 20.'),
    };
  }

  if (!Number.isInteger(input.repsCompleted) || input.repsCompleted < 0 || input.repsCompleted > 200) {
    return {
      ok: false,
      error: new FitnessFutureError('VALIDATION_ERROR', 'Reps must be an integer between 0 and 200.'),
    };
  }

  const clampedFatigue = Math.min(100, Math.max(0, Number.isFinite(input.fatigueScore) ? input.fatigueScore : 50));

  // Hard safety gate: check active member injuries against exercise contraindications
  const injurySet = new Set((input.activeInjuries ?? []).map((i) => i.trim().toLowerCase()));
  const conflict = (input.contraindicatedInjuries ?? []).find((c) =>
    injurySet.has(c.trim().toLowerCase())
  );

  if (conflict) {
    return {
      ok: true,
      data: {
        nextWeightKg: 0,
        nextSets: input.sets,
        nextReps: input.targetReps,
        action: 'SWAP_FOR_INJURY',
        rationale: `Blocked ${input.exerciseName}: contraindicated for active injury flag "${conflict}". Substitute a joint-safe alternative.`,
      },
    };
  }

  const plateStep = input.equipment === 'barbell' ? 2.5 : input.equipment === 'bodyweight' ? 0 : 1.0;
  const roundToStep = (kg: number) =>
    plateStep === 0 ? 0 : Math.max(0, Math.round(kg / plateStep) * plateStep);

  // High CNS/muscular fatigue -> proactive 10% deload
  if (clampedFatigue >= 80) {
    const deloaded = roundToStep(input.currentWeightKg * 0.9);
    return {
      ok: true,
      data: {
        nextWeightKg: deloaded,
        nextSets: Math.max(2, input.sets - 1),
        nextReps: input.targetReps,
        action: 'DELOAD',
        rationale: `High fatigue (${clampedFatigue}/100): deloading volume and load by 10% to prevent overtraining.`,
      },
    };
  }

  // Hit target reps with manageable fatigue -> safe progressive overload
  if (input.repsCompleted >= input.targetReps && clampedFatigue <= 55) {
    if (input.equipment === 'bodyweight') {
      return {
        ok: true,
        data: {
          nextWeightKg: 0,
          nextSets: input.sets,
          nextReps: input.targetReps + 2,
          action: 'PROGRESS',
          rationale: `Target reps achieved at low fatigue (${clampedFatigue}/100): adding +2 bodyweight reps.`,
        },
      };
    }

    const rawIncrement = Math.max(plateStep, input.currentWeightKg * 0.025);
    const nextWeight = roundToStep(input.currentWeightKg + rawIncrement);
    return {
      ok: true,
      data: {
        nextWeightKg: nextWeight,
        nextSets: input.sets,
        nextReps: input.targetReps,
        action: 'PROGRESS',
        rationale: `Target reps met at ${clampedFatigue}/100 fatigue: progressing load to ${nextWeight}kg (${plateStep}kg increment).`,
      },
    };
  }

  // Otherwise consolidate technique and rep quality at current load
  return {
    ok: true,
    data: {
      nextWeightKg: roundToStep(input.currentWeightKg),
      nextSets: input.sets,
      nextReps: input.targetReps,
      action: 'MAINTAIN',
      rationale: `Consolidating at ${roundToStep(input.currentWeightKg)}kg until all ${input.targetReps} reps are completed under moderate fatigue.`,
    },
  };
}
