import { workerFetch } from '../lib/apiClient';

export type GymAITask =
  | 'workout_plan'
  | 'diet_plan'
  | 'offer_description'
  | 'review_reply'
  | 'whatsapp_message'
  | 'lead_pitch'
  | 'dashboard_insights'
  | 'report_summary'
  | 'billing_audit';

export interface GymAIResponse<T = any> {
  success: boolean;
  text?: string;
  data?: T;
  error?: string;
}

/** Gemini runs only inside the Cloudflare Worker; the key never reaches the browser. */
export async function requestGymAI<T = any>(task: GymAITask, payload: Record<string, any>): Promise<GymAIResponse<T>> {
  const res = await workerFetch<{ success: boolean; text?: string; data?: T; error?: string }>('/ai/gym-assist', {
    body: { task, payload },
    timeoutMs: 30000,
  });
  if (!res.ok || !res.data?.success) {
    return {
      success: false,
      error:
        res.status === 429
          ? 'AI limit reached for now. Please try again later.'
          : res.error || res.data?.error || 'AI request failed.',
    };
  }
  return { success: true, text: res.data.text, data: res.data.data };
}
