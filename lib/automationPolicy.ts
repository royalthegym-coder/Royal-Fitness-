/**
 * External automation actions are selected from the caller's event, never from
 * model-generated text. Until a user-reviewed approval flow exists, generated
 * WhatsApp and Google Business copy is discarded rather than dispatched.
 */
export const AUTOMATION_EVENTS = [
  'member_created',
  'payment_received',
  'review_posted',
  'attendance_alert',
  'system_sync',
] as const;

export type AutomationEvent = (typeof AUTOMATION_EVENTS)[number];

// Only event labels explicitly approved for the minimal n8n contract may cross.
// No caller payload or model-generated content is part of the webhook envelope.
export const WEBHOOK_EVENTS = ['member_created', 'payment_received'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const INVOICE_PAYMENT_STATUSES = [
  'Paid',
  'Pending',
  'Overdue',
  'Verification Pending',
  'Rejected',
] as const;
export type InvoicePaymentStatus = (typeof INVOICE_PAYMENT_STATUSES)[number];

export type PaymentConfirmationSource = 'admin_confirmation' | 'unverified';

/**
 * Emit only when an admin explicitly confirms a known invoice transition.
 * This records the app's attestation, not independent payment-processor proof.
 */
export function getPaymentStatusTransitionEvent(
  previousStatus: InvoicePaymentStatus | null | undefined,
  nextStatus: InvoicePaymentStatus,
  source: PaymentConfirmationSource = 'unverified',
): 'payment_received' | null {
  if (source !== 'admin_confirmation') return null;
  if (previousStatus == null || !INVOICE_PAYMENT_STATUSES.includes(previousStatus)) return null;
  if (!INVOICE_PAYMENT_STATUSES.includes(nextStatus) || previousStatus === 'Paid' || nextStatus !== 'Paid') return null;
  return 'payment_received';
}

/** Claim one payment signal per invoice for this browser session. */
export function claimPaymentStatusWebhookEvent(
  invoiceId: number,
  previousStatus: InvoicePaymentStatus | null | undefined,
  nextStatus: InvoicePaymentStatus,
  source: PaymentConfirmationSource,
  emittedInvoiceIds: Set<number>,
): 'payment_received' | null {
  if (!Number.isSafeInteger(invoiceId) || invoiceId <= 0 || emittedInvoiceIds.has(invoiceId)) return null;
  const event = getPaymentStatusTransitionEvent(previousStatus, nextStatus, source);
  if (event) emittedInvoiceIds.add(invoiceId);
  return event;
}

export interface SafeAutomationLogic {
  n8n_action: AutomationEvent | 'idle';
  whatsapp_payload: '';
  google_update: '';
}

export interface AutomationWebhookEnvelope {
  schema_version: 1;
  event: WebhookEvent;
  source: 'royal-fitness';
  occurred_at: string;
  status: 'occurred';
}

/** Build a privacy-safe webhook message: event metadata only, never caller data. */
export function createAutomationWebhookEnvelope(
  event: unknown,
  occurredAt: string,
  _payload?: unknown,
): AutomationWebhookEnvelope | null {
  if (typeof event !== 'string' || !WEBHOOK_EVENTS.includes(event as WebhookEvent)) return null;
  if (typeof occurredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(occurredAt)) return null;
  if (!Number.isFinite(Date.parse(occurredAt))) return null;
  if (new Date(occurredAt).toISOString() !== occurredAt) return null;

  return {
    schema_version: 1,
    event: event as WebhookEvent,
    source: 'royal-fitness',
    occurred_at: occurredAt,
    status: 'occurred',
  };
}

/**
 * Automation model output cannot choose actions, so the model needs no caller payload.
 * Return an empty context rather than attempting a fragile denylist over member records.
 */
export function sanitizeAutomationPayloadForModel(_payload: unknown): Record<string, never> {
  return {};
}

const EVENT_ACTIONS: Record<AutomationEvent, AutomationEvent> = {
  member_created: 'member_created',
  payment_received: 'payment_received',
  review_posted: 'review_posted',
  attendance_alert: 'attendance_alert',
  system_sync: 'system_sync',
};

/**
 * Treat model output as untrusted data. No model-provided field is permitted to
 * choose or describe an external action; the known app event is the only input
 * to the deterministic n8n routing label.
 */
export function applyAutomationPolicy(event: unknown, _candidate: unknown): SafeAutomationLogic {
  if (typeof event !== 'string' || !Object.hasOwn(EVENT_ACTIONS, event)) {
    return { n8n_action: 'idle', whatsapp_payload: '', google_update: '' };
  }

  const safeEvent = event as AutomationEvent;
  return {
    n8n_action: EVENT_ACTIONS[safeEvent],
    whatsapp_payload: '',
    google_update: '',
  };
}
