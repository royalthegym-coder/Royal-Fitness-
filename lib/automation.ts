import {
    createAutomationWebhookEnvelope,
    isN8nLiveDeliveryEnabled,
    normalizeN8nWebhookUrl,
    type AutomationEvent,
    type AutomationWebhookEnvelope,
} from './automationPolicy.ts';

/** The only outbound data accepted by this service is the fixed event envelope. */
export interface AutomationTrigger {
    event: AutomationEvent;
}

export type WebhookDeliveryResult =
    | { success: true; status: number }
    | { success: false; reason: 'webhook_http_error'; status: number }
    | { success: false; reason: 'delivery_outcome_unknown' }
    | { success: false; reason: 'event_not_allowlisted' | 'live_delivery_disabled' | 'webhook_not_configured' | 'invalid_webhook_url' };

export interface AutomationDeliveryConfig {
    enabled: boolean;
    webhookUrl: string | null;
    fetchImpl?: typeof fetch;
    occurredAt?: string;
}

/** Post only the prebuilt envelope; this helper never retries or reads response bodies. */
export async function postAutomationEnvelope(
    webhookUrl: string,
    envelope: AutomationWebhookEnvelope,
    fetchImpl: typeof fetch = fetch,
): Promise<WebhookDeliveryResult> {
    const safeUrl = normalizeN8nWebhookUrl(webhookUrl);
    if (!safeUrl) return { success: false, reason: 'invalid_webhook_url' };

    try {
        const response = await fetchImpl(safeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'omit',
            redirect: 'error',
            body: JSON.stringify(envelope),
        });
        if (!response.ok) return { success: false, reason: 'webhook_http_error', status: response.status };
        return { success: true, status: response.status };
    } catch {
        // A network error can occur after the endpoint received the request.
        return { success: false, reason: 'delivery_outcome_unknown' };
    }
}

/** Testable dispatch boundary: disabled or incomplete configuration never calls the network. */
export async function deliverAutomationEvent(
    trigger: AutomationTrigger,
    config: AutomationDeliveryConfig,
): Promise<WebhookDeliveryResult> {
    const occurredAt = config.occurredAt ?? new Date().toISOString();
    const envelope = createAutomationWebhookEnvelope(trigger.event, occurredAt);
    if (!envelope) return { success: false, reason: 'event_not_allowlisted' };
    if (!config.enabled) return { success: false, reason: 'live_delivery_disabled' };
    if (!config.webhookUrl) return { success: false, reason: 'webhook_not_configured' };

    const safeUrl = normalizeN8nWebhookUrl(config.webhookUrl);
    if (!safeUrl) return { success: false, reason: 'invalid_webhook_url' };
    return postAutomationEnvelope(safeUrl, envelope, config.fetchImpl);
}

function getStoredWebhookUrl(key: string): string | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
    } catch {
        return null;
    }
}

function getWebhookUrl(event: AutomationEvent): string | null {
    const key = event === 'payment_received'
        ? 'n8n_payment_sync_url'
        : event === 'member_created'
            ? 'n8n_onboarding_url'
            : null;
    if (!key) return null;

    const stored = getStoredWebhookUrl(key);
    // An explicitly saved empty value disables this event even if a build URL exists.
    if (stored !== null) return normalizeN8nWebhookUrl(stored);

    const buildUrl = event === 'payment_received'
        ? import.meta.env?.VITE_N8N_PAYMENT_SYNC_URL
        : import.meta.env?.VITE_N8N_ONBOARDING_URL;
    return normalizeN8nWebhookUrl(buildUrl);
}

export const triggerAutomation = async (trigger: AutomationTrigger): Promise<WebhookDeliveryResult> => {
    const enabled = isN8nLiveDeliveryEnabled(import.meta.env?.VITE_N8N_LIVE_DELIVERY_ENABLED);
    const result = await deliverAutomationEvent(trigger, {
        enabled,
        // Do not read browser endpoint settings at all while live delivery is disabled.
        webhookUrl: enabled ? getWebhookUrl(trigger.event) : null,
    });

    if (result.success === false) {
        if (result.reason === 'webhook_http_error') {
            console.error(`[Automation] n8n returned HTTP ${result.status} for ${trigger.event}.`);
        } else if (result.reason === 'delivery_outcome_unknown') {
            // Do not log the URL or response body; either may contain sensitive data.
            console.error(`[Automation] n8n delivery outcome is unknown for ${trigger.event}; no retry was attempted.`);
        }
        return result;
    }

    console.info(`[Automation] n8n returned HTTP ${result.status} for ${trigger.event}; workflow completion was not checked.`);
    return result;
};
