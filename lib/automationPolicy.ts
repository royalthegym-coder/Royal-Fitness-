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

// Only the one currently wired, explicitly non-sensitive event may cross to n8n.
// Payment, attendance, health, and unverified event categories are not outbound.
export const WEBHOOK_EVENTS = ['member_created'] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

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
  if (!Number.isFinite(Date.parse(occurredAt))) return null;

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
