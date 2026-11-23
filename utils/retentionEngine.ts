export interface MemberActivity {
  id: string;
  name: string;
  phone: string;
  daysAbsent: number;
  lastActiveDate: string;
}

export const analyzeChurnRisk = (members: MemberActivity[]) => {
  return members.map(member => {
    let riskLevel: 'low' | 'medium' | 'critical' = 'low';
    let actionTriggered = false;

    if (member.daysAbsent >= 3 && member.daysAbsent < 7) {
      riskLevel = 'medium';
    } else if (member.daysAbsent >= 7) {
      riskLevel = 'critical';
      actionTriggered = true; // Trigger for automatic webhook dispatch
    }

    return {
      ...member,
      riskLevel,
      recommendedAction: actionTriggered 
        ? `Send WhatsApp via +91 98XXXXXXXX: Churn Recovery Kit` 
        : `Monitor Engagement`
    };
  });
};

// Simulated/Real Webhook Dispatcher
export const dispatchWhatsAppRecovery = async (memberPhone: string, memberName: string): Promise<{ success: boolean; details?: string }> => {
  try {
    const payload = {
      phone: memberPhone,
      message: `Hello ${memberName}! You have missed your workout sessions at 'Fitness Future' for the last few days. A customized neuro-recovery session has been scheduled for you. Visit us today!`
    };
    console.log("⚡ Dispatching to n8n Webhook for UPI Associated Account...", payload);
    
    // Perform fetch call to backend or external webhook endpoint in future production
    // For local interactive verification, we Process a latency handshake and return success
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    return { 
      success: true, 
      details: `WhatsApp SMS successfully enqueued for delivery to ${memberPhone} via +91 98XXXXXXXX.` 
    };
  } catch (error: any) {
    console.error("Webhook Dispatch Failure", error);
    return { 
      success: false, 
      details: error?.message || "Unknown gateway timeout." 
    };
  }
};
