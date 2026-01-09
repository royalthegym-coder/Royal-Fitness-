
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
        return new Promise(resolve => setTimeout(() => resolve(true), 2000));
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
 * Uses the 'gym_welcome_message' template.
 */
export async function sendWhatsAppWelcomeMessage(member: Member): Promise<boolean> {
    const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
    
    // Using the specific template 'gym_welcome_message' with the member's name as a parameter
    return sendWhatsAppMessage({
        mobileNumber,
        templateName: "gym_welcome_message", 
        languageCode: "en", 
        parameters: [
            { type: "text", text: member.name }
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
 * AUTOMATION: Checks for members expiring in 3 days and sends payment reminders.
 * Designed to run daily (e.g., at 5 AM).
 */
export async function checkMembershipExpiryAndNotify(): Promise<number> {
    console.log("[Daily Automation] Checking for memberships expiring in 3 days...");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 3);

    const expiringMembers = INITIAL_MEMBERS.filter(member => {
        // Only target active members who have consented to WhatsApp messages
        if (member.status !== 'Active' || !member.whatsappConsent) return false;
        
        const expiryDate = calculateExpiryDate(member.joinDate, member.packageId);
        if (!expiryDate) return false;
        
        // Reset time part for comparison
        const expiryCheck = new Date(expiryDate);
        expiryCheck.setHours(0, 0, 0, 0);
        
        return expiryCheck.getTime() === targetDate.getTime();
    });

    console.log(`[Daily Automation] Found ${expiringMembers.length} expiring members.`);

    let sentCount = 0;
    for (const member of expiringMembers) {
        const expiryDate = calculateExpiryDate(member.joinDate, member.packageId);
        const expiryDateStr = expiryDate ? expiryDate.toLocaleDateString() : 'soon';
        const mobileNumber = `91${member.phone.replace(/\D/g, '')}`;
        
        await sendWhatsAppMessage({
            mobileNumber,
            templateName: "payment_reminder",
            languageCode: "en",
            parameters: [
                { type: "text", text: member.name },
                { type: "text", text: expiryDateStr }
            ]
        });
        sentCount++;
    }
    
    return sentCount;
}
