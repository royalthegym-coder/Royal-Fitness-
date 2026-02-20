
import { Member } from '../types';
import { GYM_INFO, INITIAL_MEMBERS, INITIAL_PACKAGES } from '../constants';

// Credentials from environment variables or fallbacks
const ENV_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const ENV_ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;

// Helper to get credentials dynamically (from LocalStorage or Env)
const getWhatsAppCredentials = () => {
    // Check localStorage first (User configured in Settings)
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('whatsapp_access_token') : null;
    const storedPhoneId = typeof localStorage !== 'undefined' ? localStorage.getItem('whatsapp_phone_id') : null;

    if (storedToken && storedPhoneId) {
        return { token: storedToken, phoneId: storedPhoneId, isMock: false };
    }

    // Fallback to Env
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
    
    // Sanitize number
    const sanitizedNumber = mobileNumber.replace(/\D/g, '');
    const finalNumber = sanitizedNumber.length === 10 ? `91${sanitizedNumber}` : sanitizedNumber;

    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
    
    // Check if we are in a mock environment
    if (isMock) {
        console.log(`%c[WhatsApp Bot] 🚀 Sending to ${finalNumber} | Template: ${templateName}`, "color: #25D366; font-weight: bold;");
        console.log(`%c[Payload]`, "color: #aaa;", JSON.stringify(parameters));
        return new Promise(resolve => setTimeout(() => resolve(true), 800));
    }

    try {
        const payload = {
            messaging_product: "whatsapp",
            to: finalNumber,
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
 * 1. AUTO-WELCOME BOT
 * Sends a welcome message to a new member immediately upon admission.
 */
export async function sendWhatsAppWelcomeMessage(member: Member): Promise<boolean> {
    return sendWhatsAppMessage({
        mobileNumber: member.phone,
        templateName: "royal_welcome_v27", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: "Royal The Gym" },
            { type: "text", text: `ID: #${member.id}` }
        ]
    });
}

/**
 * 2. PAYMENT REQUEST BOT (With UPI Link)
 * Sends the Total Bill Amount + a Clickable Payment Link to the user.
 * Supports breakdown description.
 */
export async function sendPaymentRequest(member: Member, amount: number, breakdown: string): Promise<boolean> {
    // Generate UPI Link
    const upiLink = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${amount.toFixed(2)}&cu=INR&tn=Royal_Fee_${member.id}`;
    
    // In template, {{1}} is Name, {{2}} is Amount, {{3}} is Breakdown, {{4}} is Link
    return sendWhatsAppMessage({
        mobileNumber: member.phone,
        templateName: "royal_payment_request",
        languageCode: "en",
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: `₹${amount}` },
            { type: "text", text: breakdown || "Gym Services" }, // e.g., "Plan + Training + Gear"
            { type: "text", text: upiLink }
        ]
    });
}

/**
 * 3. AUTO-RECEIPT BOT
 * Sends a confirmation after successful payment verification.
 */
export async function sendPaymentReceipt(memberName: string, phone: string, amount: number, txnId: string, itemsDesc?: string): Promise<boolean> {
    return sendWhatsAppMessage({
        mobileNumber: phone,
        templateName: "royal_payment_receipt", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: memberName },
            { type: "text", text: `₹${amount}` },
            { type: "text", text: txnId },
            { type: "text", text: itemsDesc || "Gym Services" }
        ]
    });
}


/**
 * 4. FEE REMINDER BOT (NEW)
 * Sends a reminder that payment is due soon.
 */
export async function sendPaymentReminder(member: Member, amount: number, dueDate: string): Promise<boolean> {
    const upiLink = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${amount.toFixed(2)}&cu=INR&tn=Royal_Fee_${member.id}`;

    return sendWhatsAppMessage({
        mobileNumber: member.phone,
        templateName: "royal_fee_reminder_v3", // Assuming this new template exists
        languageCode: "en",
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: `₹${amount}` },
            { type: "text", text: dueDate },
            { type: "text", text: upiLink }
        ]
    });
}

/**
 * 5. THANK YOU BOT (NEW)
 * Sends a professional thank you message after payment.
 */
export async function sendThankYouForPayment(member: Member): Promise<boolean> {
    return sendWhatsAppMessage({
        mobileNumber: member.phone,
        templateName: "royal_payment_thankyou", // Assuming this new template exists
        languageCode: "en",
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: "all features are now unlocked" }
        ]
    });
}


/**
 * AUTOMATION: Checks for members expiring in the next 3 days (Inclusive) OR already expired.
 */
export async function checkMembershipExpiryAndNotify(): Promise<number> {
    console.log("[Automation] Running Daily Fee Reminder Check...");
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let sentCount = 0;

    for (const member of INITIAL_MEMBERS) {
        if (!member.whatsappConsent) continue;

        const expiryDate = calculateExpiryDate(member.joinDate, member.packageId);
        if (!expiryDate) continue;

        const diffTime = expiryDate.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const isApproachingExpiry = daysRemaining >= 0 && daysRemaining <= 3;
        
        if (isApproachingExpiry) {
            const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
            if (!pkg) continue;

            // Simplified: Find any pending invoice for this member matching the package price
            // A more robust system would link invoices to specific renewal periods.
            const dueInvoiceAmount = pkg.price;
            
            // This is a simulation. A real app would check a database for an actual pending invoice.
            if (member.status !== 'Active') { // Assume if not active, they have a due payment
                 await sendPaymentReminder(member, dueInvoiceAmount, expiryDate.toLocaleDateString());
                 sentCount++;
            }
        }
    }
    
    return sentCount;
}

/**
 * SEND GENIUS PROTOCOL (NEW)
 */
export async function sendGeniusProtocol(member: Member, reportText: string): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    const safeText = reportText.length > 1000 ? reportText.substring(0, 990) + "..." : reportText;

    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "genius_report_royal",
        languageCode: "en",
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: safeText }
        ]
    });
}

// Helpers
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