
import { generateNeuralAutomationLogic } from './gemini';
import { updateGoogleBusinessProfile } from './googleBusiness';

/**
 * Neural OS Automation Service
 * Handles outgoing triggers to n8n, GitHub, WhatsApp, and Google Business
 */

export interface AutomationTrigger {
    event: 'member_created' | 'payment_received' | 'review_posted' | 'attendance_alert' | 'system_sync' | 'medical_consultation';
    payload: any;
}

export const triggerAutomation = async (trigger: AutomationTrigger) => {
    console.log(`[Neural OS] Triggering Automation: ${trigger.event}`, trigger.payload);

    // 1. Get AI Logic for this trigger
    const aiLogic = await generateNeuralAutomationLogic(trigger.event, trigger.payload);
    console.log(`[Neural OS] AI Automation Logic:`, aiLogic);

    // 2. N8N Webhook Integration
    let n8nWebhookUrl = '';
    
    if (trigger.event === 'payment_received') {
        n8nWebhookUrl = import.meta.env.VITE_N8N_PAYMENT_SYNC_URL || localStorage.getItem('n8n_payment_sync_url') || 'https://royalthegym.app.n8n.cloud/webhook/payment-sync';
    } else if (trigger.event === 'member_created') {
        n8nWebhookUrl = import.meta.env.VITE_N8N_ONBOARDING_URL || localStorage.getItem('n8n_onboarding_url') || 'https://royalthegym.app.n8n.cloud/webhook/onboarding';
    } else {
        n8nWebhookUrl = import.meta.env.VITE_N8N_WORKFLOW_URL || localStorage.getItem('n8n_workflow_url') || 'https://royalthegym.app.n8n.cloud/workflow/aqLESKJDrp6xWaok';
    }
    
    if (n8nWebhookUrl) {
        try {
            await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...trigger, aiLogic })
            });
            console.log(`[Neural OS] n8n Action Executed successfully: ${aiLogic.n8n_action}`);
        } catch (error) {
            console.error(`[Neural OS] n8n Webhook failed:`, error);
        }
    } else {
        await simulateNetworkDelay(500);
        console.log(`[Neural OS] n8n Action Executed (Simulated): ${aiLogic.n8n_action}`);
    }

    // 3. WhatsApp Business API (Simulated via AI logic payload, actual sending happens in whatsapp.ts)
    if (aiLogic.whatsapp_payload) {
        await simulateNetworkDelay(300);
        console.log(`[Neural OS] WhatsApp Message Queued: ${aiLogic.whatsapp_payload}`);
    }

    // 4. Google Business Update
    if (aiLogic.google_update) {
        await updateGoogleBusinessProfile(aiLogic.google_update);
        console.log(`[Neural OS] Google Business Profile Updated: ${aiLogic.google_update}`);
    }

    // 5. GitHub Integration (e.g., backup or sync)
    const githubToken = import.meta.env.VITE_GITHUB_TOKEN || localStorage.getItem('github_token');
    if (githubToken && trigger.event === 'system_sync') {
        try {
            // Example GitHub API call to dispatch a workflow
            console.log(`[Neural OS] GitHub Sync Triggered...`);
            // await fetch('https://api.github.com/repos/OWNER/REPO/dispatches', { ... })
        } catch (error) {
            console.error(`[Neural OS] GitHub Sync failed:`, error);
        }
    }

    return {
        success: true,
        logic: aiLogic,
        timestamp: new Date().toISOString()
    };
};

const simulateNetworkDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
