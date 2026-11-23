import { createAutomationWebhookEnvelope, type AutomationEvent, type AutomationWebhookEnvelope } from './automationPolicy.ts';

/** The only outbound data accepted by this service is the fixed event envelope. */
export interface AutomationTrigger {
    event: AutomationEvent;
}

function getWebhookUrl(event: AutomationEvent): string | null {
    if (event === 'payment_received') {
        return import.meta.env.VITE_N8N_PAYMENT_SYNC_URL
            || localStorage.getItem('n8n_payment_sync_url')
            || 'https://royalthegym.app.n8n.cloud/webhook/payment-sync';
    }
    if (event === 'member_created') {
        return import.meta.env.VITE_N8N_ONBOARDING_URL
            || localStorage.getItem('n8n_onboarding_url')
            || 'https://royalthegym.app.n8n.cloud/webhook/onboarding';
    }
    return null;
}

export type WebhookDeliveryResult =
    | { success: true; status: number }
    | { success: false; reason: 'webhook_http_error'; status: number }
    | { success: false; reason: 'delivery_outcome_unknown' };

/** Post only the prebuilt envelope; this helper never retries or reads response bodies. */
export async function postAutomationEnvelope(
    webhookUrl: string,
    envelope: AutomationWebhookEnvelope,
    fetchImpl: typeof fetch = fetch,
): Promise<WebhookDeliveryResult> {
    try {
        const response = await fetchImpl(webhookUrl, {
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

export const triggerAutomation = async (trigger: AutomationTrigger) => {
    const envelope = createAutomationWebhookEnvelope(trigger.event, new Date().toISOString());
    const webhookUrl = getWebhookUrl(trigger.event);
    if (!envelope || !webhookUrl) {
        return { success: false, reason: 'event_not_allowlisted' as const };
    }

    const result = await postAutomationEnvelope(webhookUrl, envelope);
    if (result.success === false) {
        if (result.reason === 'webhook_http_error') {
            console.error(`[Automation] n8n returned HTTP ${result.status} for ${trigger.event}.`);
        } else {
            // Do not log the URL or response body; either may contain sensitive data.
            console.error(`[Automation] n8n delivery outcome is unknown for ${trigger.event}; no retry was attempted.`);
        }
        return result;
    }

    console.info(`[Automation] n8n accepted ${trigger.event} envelope.`);
    return result;
};
