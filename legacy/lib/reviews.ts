import axios from 'axios';

// function for sending WhatsApp message
async function sendWhatsAppMessage(phone: string, message: string) {
    console.log(`sending WhatsApp to ${phone}: ${message}`);
    // In a real app, this would call the WhatsApp API similar to sendMarketingBlast
}

// function for marking review request as sent
async function markReviewRequestSent(memberId: number) {
    console.log(`marking review request sent for member ${memberId}`);
    // In a real app, this would update the database
}

// This cron job runs every day at 2:00 PM
export async function triggerAutoReviewRequest(member: any) {
    // Check: Has the member been active for 7 days and is their payment complete?
    if (member.daysActive === 7 && member.status === 'Active_Premium') {
        
        const reviewLink = "https://g.page/r/YOUR_GOOGLE_BUSINESS_ID/review";
        const message = `Greetings from Fitness Future! 🏋️‍♂️\n\n${member.name}, how was your first week with Fitness Future? Did our coaching & nutrition system guide you well?\n\nIf you loved your experience, please support us with a 5-star rating on Google:\n👉 ${reviewLink}\n\nYour feedback means a lot to us!`;

        // Send message via WhatsApp API
        await sendWhatsAppMessage(member.phone || '0000000000', message);
        
        // Update in database to avoid duplicate dispatches
        await markReviewRequestSent(member.id);
        console.log(`⭐ Auto-Review request sent to ${member.name}`);
    }
}
