import { sendWhatsAppMessage } from './whatsapp';

/**
 * Sends a VIP marketing invite via the secure server-side WhatsApp proxy.
 * No access tokens are exposed in the client bundle.
 */
export async function sendMarketingBlast(phoneNumber: string, userName: string) {
    try {
        const success = await sendWhatsAppMessage({
            mobileNumber: phoneNumber,
            templateName: "fitness_future_3d_invite",
            languageCode: "en",
            parameters: [
                { type: "text", text: userName }
            ]
        });

        if (success) {
            console.log(`✅ VIP Invite sent to ${userName}`);
        } else {
            console.warn(`⚠️ VIP Invite deferred for ${userName}`);
        }
        return success;
    } catch (error: any) {
        console.error(`❌ Failed to send marketing message to ${userName}:`, error?.message);
        return false;
    }
}
