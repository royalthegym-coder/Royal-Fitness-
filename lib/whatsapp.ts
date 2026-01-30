
import { Member } from '../types';
import { GYM_INFO, INITIAL_MEMBERS, INITIAL_PACKAGES } from '../constants';

// Helper to get credentials dynamically (from LocalStorage or Env)
const getWhatsAppCredentials = () => {
    // Check localStorage first (User configured in Settings)
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('whatsapp_access_token') : null;
    const storedPhoneId = typeof localStorage !== 'undefined' ? localStorage.getItem('whatsapp_phone_id') : null;

    if (storedToken && storedPhoneId) {
        return { token: storedToken, phoneId: storedPhoneId, isMock: false };
    }

    // Fallback to Env safely using window.process
    const ENV_PHONE_NUMBER_ID = (window as any).process?.env?.WHATSAPP_PHONE_ID;
    const ENV_ACCESS_TOKEN = (window as any).process?.env?.WHATSAPP_TOKEN;

    if (ENV_ACCESS_TOKEN && ENV_PHONE_NUMBER_ID) {
        return { token: ENV_ACCESS_TOKEN, phoneId: ENV_PHONE_NUMBER_ID, isMock: false };
    }

    // Fallback to Mock
    return { token: 'mock_token', phoneId: '123456789', isMock: true };
};

interface WhatsAppMessageParams {
    mobileNumber: string;
    templateName: string;
    languageCode?: string;
    parameters: { type: string; text: string }[];
}

/**
 * Generic function to send a WhatsApp template message.
 */
export async function sendWhatsAppMessage({ 
    mobileNumber, 
    templateName, 
    languageCode = "en", 
    parameters 
}: WhatsAppMessageParams): Promise<boolean> {
    const { token, phoneId, isMock } = getWhatsAppCredentials();

    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
    
    // Check if we are in a mock environment
    if (isMock) {
        console.log(`[Neural Guardian] Sending template "${templateName}" to ${mobileNumber}`);
        console.log(`[Neural Guardian] Content Params:`, JSON.stringify(parameters));
        return new Promise(resolve => setTimeout(() => resolve(true), 1000));
    }

    try {
        const payload = {
            messaging_product: "whatsapp",
            to: mobileNumber,
            type: "template",
            template: {
                name: templateName,
                language: { code: languageCode },
                components: [
                    {
                        type: "body",
                        parameters: parameters
                    }
                ]
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("WhatsApp API Error:", await response.json());
            return false;
        }
        
        return true;
    } catch (error) {
        console.error("Network Error sending WhatsApp message:", error);
        return false;
    }
}

/**
 * Generates a UPI Payment Link for the message.
 * This acts as a clickable QR Code.
 */
const generateUPILink = (amount: number, memberName: string): string => {
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&tn=NOTE
    const upiId = GYM_INFO.upiIds.gpay1;
    const name = encodeURIComponent(GYM_INFO.name);
    const note = encodeURIComponent(`Fees for ${memberName}`);
    return `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
};

/**
 * Sends a welcome message to a new member.
 */
export async function sendWhatsAppWelcomeMessage(member: Member): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "royal_welcome_protocol", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: "Protocol v2.5" },
            { type: "text", text: member.id.toString() }
        ]
    });
}

/**
 * Sends a Payment Receipt via WhatsApp.
 */
export async function sendPaymentReceipt(memberName: string, phone: string, amount: number, invoiceId: string): Promise<boolean> {
    const mobileNumber = `91${phone.replace(/\D/g, '')}`;
    
    // Victory Gratitude Message
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "payment_victory_receipt", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: memberName },
            { type: "text", text: amount.toString() },
            { type: "text", text: invoiceId }
        ]
    });
}

/**
 * Helper to calculate expiry date.
 */
export function calculateExpiryDate(joinDateStr: string, packageId: number): Date | null {
    const pkg = INITIAL_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return null;

    const joinDate = new Date(joinDateStr);
    let monthsToAdd = 0;
    const durationParts = pkg.duration.split(' ');
    
    if (durationParts[0].toLowerCase() === 'first') monthsToAdd = 1;
    else monthsToAdd = parseInt(durationParts[0], 10);

    if (isNaN(monthsToAdd)) return null;

    joinDate.setMonth(joinDate.getMonth() + monthsToAdd);
    return joinDate;
}

/**
 * AUTOMATION: PERSISTENT FINANCIAL GUARDIAN
 * Checks for members expiring in the next 3 days OR already expired.
 * Uses an "Escalation Matrix" for message tone.
 */
export async function checkMembershipExpiryAndNotify(): Promise<number> {
    console.log("[Neural Guardian] Initiating Financial Scan...");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let sentCount = 0;

    for (const member of INITIAL_MEMBERS) {
        if (!member.whatsappConsent) continue;

        const expiryDate = calculateExpiryDate(member.joinDate, member.packageId);
        if (!expiryDate) continue;

        const diffTime = expiryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
        const amount = pkg ? pkg.price : 0;
        const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
        const payLink = generateUPILink(amount, member.name);

        let templateName = "";
        let headerText = "";
        let bodyText = "";

        // ESCALATION MATRIX
        if (daysRemaining === 3) {
            templateName = "fee_reminder_tactical";
            headerText = "TACTICAL ADVISORY";
            bodyText = `Agent ${member.name}, your resource allocation expires in 72 hours. Maintain your streak.`;
        } else if (daysRemaining === 1) {
            templateName = "fee_reminder_tactical";
            headerText = "URGENT DEPLOYMENT";
            bodyText = `CRITICAL: 24 hours remaining. Renew now to avoid account suspension.`;
        } else if (daysRemaining === 0) {
            templateName = "fee_reminder_critical";
            headerText = "FINAL NOTICE";
            bodyText = `Your access terminates at midnight. Immediate action required. Amount: ₹${amount}`;
        } else if (daysRemaining < 0 && member.status === 'Expired') {
            templateName = "fee_reminder_breach"; // A stricter template
            headerText = "PROTOCOL BREACH";
            bodyText = `Access Denied. Account Frozen. Settle ₹${amount} to reactivate your Neural Profile.`;
        }

        if (templateName) {
            console.log(`[Neural Guardian] Targeting ${member.name}. Threat Level: ${daysRemaining < 0 ? 'HIGH' : 'MODERATE'}`);
            
            await sendWhatsAppMessage({
                mobileNumber,
                templateName: templateName, 
                languageCode: "en",
                parameters: [
                    { type: "text", text: headerText }, 
                    { type: "text", text: bodyText }, 
                    { type: "text", text: payLink }      
                ]
            });
            sentCount++;
        }
    }
    
    return sentCount;
}

export async function sendWorkoutPlanNotification(member: Member, planName: string): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "workout_assigned", languageCode: "en", parameters: [{ type: "text", text: member.name }, { type: "text", text: planName }, { type: "text", text: GYM_INFO.website }]
    });
}

export async function sendTrainerAssignmentNotification(member: Member, trainerName: string): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "trainer_assigned", languageCode: "en", parameters: [{ type: "text", text: member.name }, { type: "text", text: trainerName }, { type: "text", text: GYM_INFO.name }]
    });
}

export async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
    const mobileNumber = `91${phone.replace(/\D/g, '')}`;
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "secure_otp", languageCode: "en", parameters: [{ type: "text", text: otp }, { type: "text", text: "5 minutes" }]
    });
}

export async function checkBirthdaysAndNotify(): Promise<number> { return 0; }
export async function checkAttendanceAndNotify(): Promise<number> { return 0; }
export async function runDailyAutomations(): Promise<string> {
    const fees = await checkMembershipExpiryAndNotify();
    return `Neural Guardian Report: ${fees} tactical reminders deployed.`;
}
