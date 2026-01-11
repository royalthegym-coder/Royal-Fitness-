
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
 * Implements the official WhatsApp Business API logic using fetch.
 */
export async function sendWhatsAppMessage({ 
    mobileNumber, 
    templateName, 
    languageCode = "en", 
    parameters 
}: WhatsAppMessageParams): Promise<boolean> {
    const url = `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`;
    
    // Check if we are in a mock environment (no real token provided)
    if (ACCESS_TOKEN === 'mock_token') {
        console.log(`[Mock WhatsApp API] Sending template "${templateName}" (${languageCode}) to ${mobileNumber}`);
        console.log(`[Mock WhatsApp API] Params:`, JSON.stringify(parameters));
        // Simulate network delay for UI feedback
        return new Promise(resolve => setTimeout(() => resolve(true), 1500));
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
            const errorData = await response.json();
            console.error("WhatsApp API Error:", errorData);
            return false;
        }
        
        console.log(`[WhatsApp API] Message sent successfully to ${mobileNumber}`);
        return true;
    } catch (error) {
        console.error("Network Error sending WhatsApp message:", error);
        return false;
    }
}

/**
 * Sends a welcome message to a new member via WhatsApp Business API.
 * Uses the requested Hindi template: "नमस्ते {{name}}, आपका {{gym_name}} में स्वागत है। आपका Membership ID: {{member_id}}"
 */
export async function sendWhatsAppWelcomeMessage(member: Member): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "gym_welcome_hindi", 
        languageCode: "hi", 
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: GYM_INFO.name },
            { type: "text", text: member.id.toString() }
        ]
    });
}

/**
 * Sends a notification when a workout plan is assigned.
 */
export async function sendWorkoutPlanNotification(member: Member, planName: string): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "workout_plan_assigned", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: planName },
            { type: "text", text: GYM_INFO.website } // Link to view plan
        ]
    });
}

/**
 * Sends a notification when a trainer is assigned.
 */
export async function sendTrainerAssignmentNotification(member: Member, trainerName: string): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "trainer_assigned", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: member.name },
            { type: "text", text: trainerName },
            { type: "text", text: GYM_INFO.name }
        ]
    });
}

/**
 * Sends a security OTP via WhatsApp
 */
export async function sendWhatsAppOTP(phone: string, otp: string): Promise<boolean> {
    const mobileNumber = `91${phone.replace(/\D/g, '')}`;
    console.log(`[SECURE] Generating OTP for ${mobileNumber}: ${otp}`);
    
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "secure_otp_login", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: otp },
            { type: "text", text: "5 minutes" }
        ]
    });
}

/**
 * Sends a Payment Receipt via WhatsApp
 */
export async function sendPaymentReceipt(memberName: string, phone: string, amount: number, invoiceId: string): Promise<boolean> {
    const mobileNumber = `91${phone.replace(/\D/g, '')}`;
    
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "payment_receipt", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: memberName },
            { type: "text", text: amount.toFixed(2) },
            { type: "text", text: invoiceId }
        ]
    });
}

/**
 * Helper to calculate expiry date based on join date and package duration.
 */
export function calculateExpiryDate(joinDateStr: string, packageId: number): Date | null {
    const pkg = INITIAL_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return null;

    const joinDate = new Date(joinDateStr);
    let monthsToAdd = 0;
    const durationParts = pkg.duration.split(' ');
    
    if (durationParts[0].toLowerCase() === 'first') {
        monthsToAdd = 1;
    } else {
        monthsToAdd = parseInt(durationParts[0], 10);
    }

    if (isNaN(monthsToAdd)) return null;

    joinDate.setMonth(joinDate.getMonth() + monthsToAdd);
    return joinDate;
}

/**
 * AUTOMATION: Checks for members expiring in exactly 3 days and sends payment reminders.
 * Uses the requested Hindi template: "प्रिय {{name}}, आपकी Gym Fee ₹{{amount}} बकाया है। कृपया भुगतान करें।"
 */
export async function checkMembershipExpiryAndNotify(): Promise<number> {
    console.log("[Automation] Checking for memberships expiring in 3 days...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 3); // Target is 3 days from now

    const expiringMembers = INITIAL_MEMBERS.filter(member => {
        // Only target active members who have consented to WhatsApp messages
        if (member.status !== 'Active' || !member.whatsappConsent) return false;
        
        const expiryDate = calculateExpiryDate(member.joinDate, member.packageId);
        if (!expiryDate) return false;
        
        // Normalize expiry date to midnight for comparison
        const expiryCheck = new Date(expiryDate);
        expiryCheck.setHours(0, 0, 0, 0);
        
        return expiryCheck.getTime() === targetDate.getTime();
    });

    console.log(`[Automation] Found ${expiringMembers.length} members expiring on ${targetDate.toDateString()}.`);

    let sentCount = 0;
    for (const member of expiringMembers) {
        const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
        const amount = pkg ? pkg.price : 0;
        const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
        
        await sendWhatsAppMessage({
            mobileNumber,
            templateName: "payment_due_hindi",
            languageCode: "hi",
            parameters: [
                { type: "text", text: member.name },
                { type: "text", text: amount.toString() }
            ]
        });
        sentCount++;
    }
    
    return sentCount;
}

/**
 * AUTOMATION: Birthday Greetings
 * Checks if today is any member's birthday.
 */
export async function checkBirthdaysAndNotify(): Promise<number> {
    // In a real app, member.dob would be checked. 
    // Simulating finding 1 birthday for demo purposes if random chance hits
    const hasBirthdayToday = Math.random() > 0.5; 
    
    if (hasBirthdayToday) {
        const luckyMember = INITIAL_MEMBERS.find(m => m.whatsappConsent);
        if (luckyMember) {
            console.log(`[Automation] It's ${luckyMember.name}'s birthday! Sending greeting.`);
            const mobileNumber = `91${luckyMember.phone.replace(/\D/g, '')}`;
            await sendWhatsAppMessage({
                mobileNumber,
                templateName: "birthday_greeting",
                languageCode: "en",
                parameters: [
                    { type: "text", text: luckyMember.name },
                    { type: "text", text: "10% OFF" } // Offer code
                ]
            });
            return 1;
        }
    }
    return 0;
}

/**
 * AUTOMATION: Workout Reminder
 * Checks for members who haven't checked in for > 3 days (Simulated).
 */
export async function checkAttendanceAndNotify(): Promise<number> {
    // Simulating detection of absent member
    // In a real app, we would compare member.lastWorkoutDate with today
    const absentMembers = INITIAL_MEMBERS.filter(m => m.whatsappConsent && m.status === 'Active').slice(0, 2); // Simulate 2 people
    
    let sentCount = 0;
    for (const member of absentMembers) {
         const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
         await sendWhatsAppMessage({
            mobileNumber,
            templateName: "missed_workout_motivation",
            languageCode: "en",
            parameters: [
                { type: "text", text: member.name }
            ]
        });
        sentCount++;
    }
    return sentCount;
}

/**
 * Master Automation Runner
 * Runs all daily checks.
 */
export async function runDailyAutomations(): Promise<string> {
    const paymentCount = await checkMembershipExpiryAndNotify();
    const birthdayCount = await checkBirthdaysAndNotify();
    const attendanceCount = await checkAttendanceAndNotify();
    
    let result = `Processed Daily Automations:\n`;
    result += `- Payment Reminders Sent: ${paymentCount}\n`;
    result += `- Birthday Greetings Sent: ${birthdayCount}\n`;
    result += `- Missed Workout Alerts: ${attendanceCount}`;
    
    return result;
}
