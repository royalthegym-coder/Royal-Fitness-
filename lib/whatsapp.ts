
import { Member } from '../types';
import { GYM_INFO, INITIAL_MEMBERS, INITIAL_PACKAGES } from '../constants';

// Credentials from environment variables or fallbacks
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID || '123456789';
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN || 'mock_token';

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
    const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
    
    // Check if we are in a mock environment
    if (ACCESS_TOKEN === 'mock_token') {
        console.log(`[Mock WhatsApp API] Sending template "${templateName}" to ${mobileNumber}`);
        console.log(`[Mock WhatsApp API] Content Params:`, JSON.stringify(parameters));
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
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
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
        templateName: "royal_welcome_hindi", 
        languageCode: "hi", 
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: GYM_INFO.name },
            { type: "text", text: member.id.toString() }
        ]
    });
}

/**
 * Sends a Payment Receipt via WhatsApp.
 */
export async function sendPaymentReceipt(memberName: string, phone: string, amount: number, invoiceId: string): Promise<boolean> {
    const mobileNumber = `91${phone.replace(/\D/g, '')}`;
    const date = new Date().toLocaleDateString('en-IN');
    
    // Template: "नमस्ते {{1}}, आपका भुगतान ₹{{2}} (Invoice: {{3}}) सफल रहा। धन्यवाद! - Royal The Gym"
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "payment_receipt_royal", 
        languageCode: "hi", 
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
 * AUTOMATION: Checks for members expiring in the next 3 days (Inclusive).
 * Triggers Daily for 3 days before expiry.
 */
export async function checkMembershipExpiryAndNotify(): Promise<number> {
    console.log("[Automation] Running Daily Fee Reminder Check (3-Day Window)...");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let sentCount = 0;

    for (const member of INITIAL_MEMBERS) {
        if (member.status !== 'Active' || !member.whatsappConsent) continue;

        const expiryDate = calculateExpiryDate(member.joinDate, member.packageId);
        if (!expiryDate) continue;

        // Calculate days remaining
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Logic: Send reminder if expiry is in 3, 2, or 1 day(s), or today (0).
        if (daysRemaining >= 0 && daysRemaining <= 3) {
            const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
            const amount = pkg ? pkg.price : 0;
            const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
            
            // Generate Payment Link (Clickable QR)
            const payLink = `https://upilinks.in/payment-link?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${amount}`;
            
            console.log(`[Automation] Sending Reminder to ${member.name} (Expiring in ${daysRemaining} days).`);

            // Sending Template with Payment Link embedded
            await sendWhatsAppMessage({
                mobileNumber,
                templateName: "fee_reminder_with_link", // Custom template needed in Meta Manager
                languageCode: "hi",
                parameters: [
                    { type: "text", text: member.name }, // {{1}} Name
                    { type: "text", text: daysRemaining === 0 ? "आज" : `${daysRemaining} दिन में` }, // {{2}} Time left
                    { type: "text", text: amount.toString() }, // {{3}} Amount
                    { type: "text", text: payLink } // {{4}} Payment Link (Click to Pay)
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
    return `Automations Run: Sent ${fees} fee reminders.`;
}
