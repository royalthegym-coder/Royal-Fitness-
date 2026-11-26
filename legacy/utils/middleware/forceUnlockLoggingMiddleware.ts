import { auth, isVerifiedOwnerEmail, syncToFirebase } from '../../lib/firebase';
import { recordAdminActivity } from '../components/admin/AdminActivityLog';

export interface ForceUnlockActionContext {
  targetUserUid: string;
  targetUserName?: string;
  targetType?: 'member' | 'admin' | 'trainer' | 'user' | string;
  targetPhone?: string;
  targetEmail?: string;
  adminUid?: string;
  adminEmail?: string;
  adminName?: string;
  previousSubscriptionStatus?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ForceUnlockLogRecord {
  id: string;
  action: 'FORCE_UNLOCK';
  adminUid: string;
  adminEmail: string;
  adminName: string;
  targetUserUid: string;
  targetUserName: string;
  targetType: string;
  targetEmail?: string;
  targetPhone?: string;
  timestamp: string; // ISO 8601 UTC timestamp
  timestampMs: number;
  durationMs: number;
  status: 'SUCCESS' | 'FAILED';
  details: string;
  previousSubscriptionStatus?: string;
  newSubscriptionStatus: string;
  error?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export type ForceUnlockNextFunction<T = boolean> = (context: ForceUnlockActionContext) => Promise<T>;

/**
 * Logging Middleware for Force Unlock actions.
 * Intercepts every 'Force Unlock' operation performed by admins in SuperAdminDashboard.
 * Captures:
 *  - admin UID (from Firebase Auth / active admin session)
 *  - target user UID (the account being unlocked)
 *  - timestamp (ISO-8601 UTC string and epoch ms)
 * Persists audit logs to Firestore 'admin_activity_logs' and 'force_unlock_audit_logs'.
 */
export async function forceUnlockLoggingMiddleware<T = boolean>(
  context: ForceUnlockActionContext,
  next: ForceUnlockNextFunction<T>
): Promise<T> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // 1. Resolve Admin UID & Identity
  const currentAuth = auth.currentUser;
  const adminUid =
    context.adminUid ||
    currentAuth?.uid ||
    (currentAuth?.email ? `uid_${currentAuth.email.replace(/[@.]/g, '_')}` : 'owner_primary');

  const adminEmail =
    context.adminEmail ||
    currentAuth?.email ||
    'owner@fitnessfuture.in';

  const adminName =
    context.adminName ||
    currentAuth?.displayName ||
    (isVerifiedOwnerEmail(adminEmail) ? 'Fitness Future Owner' : 'Authorized Administrator');

  const targetUserUid = context.targetUserUid;
  const targetUserName = context.targetUserName || targetUserUid;
  const targetType = context.targetType || (targetUserUid.startsWith('admin_') ? 'admin' : 'member');
  const logId = `unlock_log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  console.log(`[ForceUnlockLoggingMiddleware] 🚀 Intercepting FORCE_UNLOCK action:`, {
    adminUid,
    targetUserUid,
    timestamp,
  });

  let executionResult: T;
  let status: 'SUCCESS' | 'FAILED' = 'SUCCESS';
  let executionError: string | undefined;

  try {
    // 2. Execute the underlying Force Unlock action
    executionResult = await next({
      ...context,
      adminUid,
      adminEmail,
      adminName,
    });
    status = 'SUCCESS';
  } catch (err: any) {
    status = 'FAILED';
    executionError = err instanceof Error ? err.message : String(err);
    console.error(`[ForceUnlockLoggingMiddleware] ❌ Unlock failed for target "${targetUserUid}":`, executionError);
    throw err;
  } finally {
    const durationMs = Date.now() - startTime;

    // 3. Assemble immutable Force Unlock Log Record
    const logRecord: ForceUnlockLogRecord = {
      id: logId,
      action: 'FORCE_UNLOCK',
      adminUid,
      adminEmail,
      adminName,
      targetUserUid,
      targetUserName,
      targetType,
      targetEmail: context.targetEmail,
      targetPhone: context.targetPhone,
      timestamp,
      timestampMs: startTime,
      durationMs,
      status,
      details: `Admin [UID: ${adminUid}] force-unlocked account [UID: ${targetUserUid}] (${targetUserName}). Subscription status set to 'ACTIVE'. Action status: ${status} (${durationMs}ms).`,
      previousSubscriptionStatus: context.previousSubscriptionStatus || 'LOCKED',
      newSubscriptionStatus: 'ACTIVE',
      error: executionError,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 80) : undefined,
      metadata: {
        ...(context.metadata || {}),
        reason: context.reason || 'Super Admin Force Unlock Command',
      },
    };

    // 4. Record to Firestore 'admin_activity_logs' collection
    try {
      await recordAdminActivity({
        actionType: 'ACCOUNT_UNLOCK',
        category: 'LOCK_UNLOCK',
        targetId: targetUserUid,
        targetName: targetUserName,
        targetRole: targetType === 'admin' ? 'admin' : 'member',
        details: logRecord.details,
        customAdminUserId: adminUid,
        customAdminEmail: adminEmail,
        previousState: {
          subscription_status: context.previousSubscriptionStatus || 'LOCKED',
          account_locked: true,
        },
        newState: {
          subscription_status: 'ACTIVE',
          account_locked: false,
          forceUnlocked: true,
          forceUnlockedAt: timestamp,
          unlockedByAdminUid: adminUid,
        },
      });
    } catch (e) {
      console.warn('[ForceUnlockLoggingMiddleware] Warning recording to AdminActivityLog:', e);
    }

    // 5. Record to Firestore 'force_unlock_logs' collection (and mirror to force_unlock_audit_logs)
    try {
      await syncToFirebase('force_unlock_logs', logId, logRecord);
      await syncToFirebase('force_unlock_audit_logs', logId, logRecord);
      console.log(`[ForceUnlockLoggingMiddleware] ✅ Force Unlock logged successfully in Firestore 'force_unlock_logs' [ID: ${logId}]:`, {
        adminUid,
        targetUserUid,
        timestamp,
      });
    } catch (e) {
      console.warn('[ForceUnlockLoggingMiddleware] Warning saving to force_unlock_logs:', e);
    }
  }

  return executionResult;
}

/**
 * Higher-order utility wrapping an unlock executor with the logging middleware.
 */
export function createLoggedUnlockExecutor(
  executor: (targetUserUid: string, targetType?: string) => Promise<boolean>,
  defaultAdminUid?: string
) {
  return async (
    targetUserUid: string,
    targetType?: string,
    extraContext?: Partial<ForceUnlockActionContext>
  ): Promise<boolean> => {
    return forceUnlockLoggingMiddleware<boolean>(
      {
        targetUserUid,
        targetType,
        adminUid: defaultAdminUid,
        ...extraContext,
      },
      async (ctx) => executor(ctx.targetUserUid, ctx.targetType)
    );
  };
}
