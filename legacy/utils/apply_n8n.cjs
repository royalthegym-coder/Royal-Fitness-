const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newScript = `  // --- ASYNC EVENT-DRIVEN ARCHITECTURE (Zero-Server-Load n8n Router Simulation) ---
  // Background task handler mirroring n8n Switch behavior
  const handleN8NTimerQueue = async (task: any) => {
    try {
      const coreAI = getAI();
      if (task.type === 'text_voice_intent') {
         const prompt = \`You are the Asynchronous Response Core for Fitness Future. Your job is to process incoming user texts or voice transcripts and map them into actionable database intents.
Operational Constraints:
 * Never output conversational filler or prose.
 * Analyze the payload: \${JSON.stringify(task.payload)}
 * Instantly output a clean JSON with exact flags: { "action_required": "WHATSAPP_NUDGE" | "RENEWAL_ALERT" | "NONE", "payload": { "message_template_id": "string", "urgency": "LOW" | "HIGH" } }.
Optimize for speed and minimum output tokens to keep processing latency strictly below 200ms.\`;
         const response = await coreAI.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.1 }
         });
         
         const analysis = safeAIParse(response.text || '{}', {});
         console.log("[n8n Routing Queue] Processing Telephony/Chat Intent (Gemini 1.5 Flash): ", analysis);
         
      } else if (task.type === 'medical_vision') {
         const prompt = \`You are the Neuro-Intake Medical Auditor. You will receive blood report markers alongside a static JSON of localized Rajasthani ingredients.
Execution Logic:
 1. Scan the image/data for outlier biomarkers.
 2. Cross-reference with the localized ingredient database to create a macro-nutrient profile.
 3. Output a single compressed JSON response mapped to the database schema.
    Use cached system context instructions. Output raw JSON only.
Payload: \${JSON.stringify(task.payload)}\`;
         const response = await coreAI.models.generateContent({
             model: "gemini-1.5-pro",
             contents: prompt,
             config: { responseMimeType: "application/json" }
         });
         
         const analysis = safeAIParse(response.text || '{}', {});
         console.log("[n8n Routing Queue] Processing Medical Scan (Gemini 1.5 Pro via Context Caching Blueprint): ", analysis);
      }
    } catch (e) {
      console.error("[n8n Switch Router Queue Error]", e);
    }
  };`;

// Use simple string replacement by ripping everything out between n8n router simulation and app.post
const startTarget = '// --- ASYNC EVENT-DRIVEN ARCHITECTURE (Zero-Server-Load n8n Router Simulation) ---';
const endTarget = `  app.post('/api/webhooks/supabase/n8n-router'`;

if (code.includes(startTarget)) {
    const sIdx = code.indexOf(startTarget);
    const eIdx = code.indexOf(endTarget);
    code = code.substring(0, sIdx) + newScript + '\\n\\n' + code.substring(eIdx);
    fs.writeFileSync('server.ts', code, 'utf8');
}
