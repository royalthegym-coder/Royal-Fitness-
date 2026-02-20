
import { generateOpenAIContent, getOpenAIChatResponse } from './openai';

// --- CONFIGURATION ---
// Using Open Source Models via Hugging Face Inference API
const TEXT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3'; 
const VISION_MODEL = 'Salesforce/blip-image-captioning-large'; 
const TTS_MODEL = 'facebook/mms-tts-eng';

// --- COST CONTROL & SAFETY CORE ---
// 1. Get the API Key safely (Prefer HF_TOKEN, fallback to API_KEY)
const API_KEY = (typeof localStorage !== 'undefined' ? localStorage.getItem('HUGGINGFACE_API_KEY') : null) || process.env.HUGGINGFACE_API_KEY || process.env.API_KEY || "";

// 2. Check if the key is valid (not empty, not the placeholder)
const IS_REAL_KEY_PRESENT = API_KEY.length > 0 && !API_KEY.includes('YOUR_GEMINI_API_KEY_HERE') && !API_KEY.includes('YOUR_OPENAI_API_KEY_HERE');

// 3. User preference from settings
const USER_PREF_MODE = typeof localStorage !== 'undefined' ? localStorage.getItem('royal_ai_mode') : 'SIMULATION';
const USER_AI_PROVIDER = typeof localStorage !== 'undefined' ? localStorage.getItem('royal_ai_provider') : 'HUGGINGFACE';

// 4. MASTER SWITCH: Force Simulation if no real key is present.
const FORCE_SIMULATION = !IS_REAL_KEY_PRESENT || USER_PREF_MODE !== 'ONLINE';

const RESPONSE_CACHE = new Map<string, string>();

// Clean up cache if it gets too big to save memory
if (RESPONSE_CACHE.size > 500) RESPONSE_CACHE.clear();

// --- MOCK INTELLIGENCE (FREE TIER - LOCAL LOGIC) ---
const MOCK_RESPONSES: Record<string, any> = {
    "quote": [
        "Pain is temporary, Pride is forever.",
        "Your body is the only machine you need.",
        "Sweat is just fat crying.",
        "Focus. Lift. Repeat.",
        "Discipline eats motivation for breakfast."
    ],
    "analysis": [
        { feedback: "Excellent spinal alignment. Keep chest up.", status: "Good" },
        { feedback: "Knees caving slightly. Push knees out.", status: "Correction Needed" },
        { feedback: "Perfect depth. Explode up!", status: "Good" },
        { feedback: "Control the eccentric phase.", status: "Correction Needed" }
    ],
    "recipe": { 
        "title": "Anabolic Power Bowl", 
        "macros": "P:45g C:50g F:15g", 
        "instructions": ["1. Boil Quinoa", "2. Grill Chicken Breast", "3. Add Avocado & Spinach", "4. Drizzle Olive Oil"],
        "shoppingList": ["Quinoa", "Chicken", "Avocado", "Spinach"]
    },
    "diet_plan": {
        "goal": "Hypertrophy (Simulated)",
        "caloriesTarget": 2800,
        "macrosTarget": { "protein": 200, "carbs": 300, "fats": 80 },
        "scienceNote": "High protein intake to support muscle synthesis based on simulated biometrics.",
        "meals": [
            { "name": "Breakfast", "time": "08:00 AM", "totalCalories": 600, "macros": {"protein":40,"carbs":60,"fats":20}, "items": [{ "food": "Oats & Whey", "portion": "1 Bowl" }] },
            { "name": "Lunch", "time": "01:00 PM", "totalCalories": 800, "macros": {"protein":60,"carbs":80,"fats":25}, "items": [{ "food": "Chicken Rice", "portion": "1 Plate" }] },
            { "name": "Dinner", "time": "08:00 PM", "totalCalories": 600, "macros": {"protein":50,"carbs":40,"fats":20}, "items": [{ "food": "Fish & Veggies", "portion": "1 Plate" }] }
        ]
    }
};

// --- UTILITIES ---
const cleanBase64 = (b64: string) => b64.replace(/^data:image\/\w+;base64,/, "");

export const cleanAndParseJSON = (response: string): any => {
    try {
        if (typeof response !== 'string') return response;
        let clean = response.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            clean = clean.substring(firstBrace, lastBrace + 1);
        }
        return JSON.parse(clean);
    } catch (e) {
        console.warn("JSON Parse warning, returning raw or empty obj");
        return {};
    }
};

// --- HUGGING FACE API CLIENT ---
async function queryHuggingFace(model: string, inputs: any, parameters: any = {}) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs, parameters }),
    });
    
    if (!response.ok) {
        throw new Error(`HF API Error: ${response.statusText}`);
    }
    return await response.json();
}

async function queryHuggingFaceBinary(model: string, data: Blob) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        headers: {
            Authorization: `Bearer ${API_KEY}`,
        },
        method: "POST",
        body: data,
    });
    
    if (!response.ok) {
        throw new Error(`HF API Error: ${response.statusText}`);
    }
    return await response.arrayBuffer();
}

// --- CORE FUNCTIONS ---

export async function getComplexResponse(prompt: string): Promise<string> {
    // 1. CHECK CACHE (Free)
    const cacheKey = `text:${prompt}`;
    if (RESPONSE_CACHE.has(cacheKey)) {
        console.log("Serving from Cache (₹0)");
        return RESPONSE_CACHE.get(cacheKey) || "";
    }

    // 2. CHECK SIMULATION MODE (Free)
    if (FORCE_SIMULATION) {
        console.log("Serving from Simulation (₹0)");
        await new Promise(r => setTimeout(r, 800)); // Fake delay for realism
        if (prompt.includes("quote") || prompt.includes("Ticker")) return MOCK_RESPONSES.quote[Math.floor(Math.random() * MOCK_RESPONSES.quote.length)];
        
        // Generic Simulation Response
        return `[ROYAL AI SIMULATION]: I am operating in Free Mode. I understand you asked: "${prompt.substring(0, 30)}...". \n\nTo enable live reasoning, please add a valid Hugging Face Token in your environment settings and switch mode to ONLINE. \n\nFor now, I recommend focusing on progressive overload and consistency.`;
    }

    // 3. CALL OPENAI (If Selected)
    if (USER_AI_PROVIDER === 'OPENAI') {
        try {
            const text = await generateOpenAIContent(prompt);
            RESPONSE_CACHE.set(cacheKey, text);
            return text;
        } catch (e) {
            console.error("OpenAI Error, falling back to Hugging Face:", e);
        }
    }

    // 4. CALL HUGGING FACE (Default Open Source)
    try {
        // Mistral Instruct format
        const formattedPrompt = `<s>[INST] ${prompt} [/INST]`;
        
        const result = await queryHuggingFace(TEXT_MODEL, formattedPrompt, {
            max_new_tokens: 512,
            temperature: 0.7,
            return_full_text: false
        });

        // HF Inference API returns array of objects for text-generation
        let text = "";
        if (Array.isArray(result) && result[0]?.generated_text) {
            text = result[0].generated_text;
        } else if (typeof result === 'object' && result.generated_text) {
            text = result.generated_text;
        } else {
            text = JSON.stringify(result);
        }

        RESPONSE_CACHE.set(cacheKey, text);
        return text;
    } catch (e) {
        console.error("Hugging Face API Error:", e);
        return "Neural Uplink Offline. Using cached protocols.";
    }
}

export async function getHealthAssistantResponse(history: any[], message: string, context: any): Promise<string> {
    const cacheKey = `chat:${message}`;
    if (RESPONSE_CACHE.has(cacheKey)) return RESPONSE_CACHE.get(cacheKey) || "";

    if (FORCE_SIMULATION) return "I am running in Eco-Mode (Free). I can track your workouts locally, but for advanced medical queries or real-time AI generation, a valid API Key is required.";

    const systemPrompt = `You are Royal Health AI. Context: ${JSON.stringify(context)}. Keep answers under 50 words.`;

    if (USER_AI_PROVIDER === 'OPENAI' && !FORCE_SIMULATION) {
        try {
            const text = await getOpenAIChatResponse(history, message, systemPrompt);
            RESPONSE_CACHE.set(cacheKey, text);
            return text;
        } catch(e) { console.error("OpenAI Chat Error", e); }
    }

    try {
        // Construct prompt for Mistral
        let fullPrompt = `<s>[INST] ${systemPrompt} \n\n`;
        history.forEach(msg => {
            fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.text}\n`;
        });
        fullPrompt += `User: ${message} [/INST]`;

        const result = await queryHuggingFace(TEXT_MODEL, fullPrompt, {
            max_new_tokens: 256,
            temperature: 0.7,
            return_full_text: false
        });

        let text = "";
        if (Array.isArray(result) && result[0]?.generated_text) {
            text = result[0].generated_text;
        } else {
            text = "I couldn't process that.";
        }

        RESPONSE_CACHE.set(cacheKey, text);
        return text;
    } catch (e) {
        return "I am unable to process that request right now.";
    }
}

export async function analyzeExerciseForm(base64: string): Promise<any> {
    // Vision is expensive. Aggressively simulate.
    if (FORCE_SIMULATION) {
        await new Promise(r => setTimeout(r, 500));
        return MOCK_RESPONSES.analysis[Math.floor(Math.random() * MOCK_RESPONSES.analysis.length)];
    }

    try {
        // Convert Base64 to Blob for HF API
        const byteCharacters = atob(cleanBase64(base64));
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        // 1. Get Image Caption
        const captionResult = await queryHuggingFaceBinary(VISION_MODEL, blob);
        // Note: queryHuggingFaceBinary returns ArrayBuffer, but for image-to-text models we usually send raw bytes and get JSON
        // Let's use the JSON endpoint for this model
        const response = await fetch(`https://api-inference.huggingface.co/models/${VISION_MODEL}`, {
            headers: { Authorization: `Bearer ${API_KEY}` },
            method: "POST",
            body: blob,
        });
        const captionData = await response.json();
        const caption = captionData[0]?.generated_text || "Exercise movement";

        // 2. Analyze Caption with Text Model
        const prompt = `Analyze this exercise description: "${caption}". Brief feedback (max 10 words). Status: Good/Correction Needed. Return JSON: {feedback, status}`;
        const analysis = await getComplexResponse(prompt);
        
        return cleanAndParseJSON(analysis);
    } catch (e) {
        return { feedback: "Vision Sensor Offline", status: "Idle" };
    }
}

export async function generateTextToSpeech(text: string): Promise<string> {
    if (text.length > 200) text = text.substring(0, 200); 
    if (FORCE_SIMULATION) return ""; // No audio in sim mode

    const cacheKey = `tts:${text}`;
    if (RESPONSE_CACHE.has(cacheKey)) return RESPONSE_CACHE.get(cacheKey) || "";

    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${TTS_MODEL}`, {
            headers: { Authorization: `Bearer ${API_KEY}` },
            method: "POST",
            body: JSON.stringify({ inputs: text }),
        });
        
        if (!response.ok) throw new Error("TTS Failed");
        
        const arrayBuffer = await response.arrayBuffer();
        const base64 = btoa(
            new Uint8Array(arrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        
        if(base64) RESPONSE_CACHE.set(cacheKey, base64);
        return base64;
    } catch (e) { return ""; }
}

// --- OTHER FUNCTIONS (Wrapped) ---

export async function getAIChefRecipe(ingredients: string, goal: string) { 
    if (FORCE_SIMULATION) return JSON.stringify(MOCK_RESPONSES.recipe);
    return getComplexResponse(`Recipe using ${ingredients} for ${goal}. Return JSON.`); 
}

export async function generateFutureSelfImage(current: string, goal: string) { 
    return "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop"; 
}

export async function analyzeMedicalRecord(base64: string, type: string) { 
    if (FORCE_SIMULATION) return "Simulation: Blood markers look optimized. Testosterone levels adequate.";
    return getComplexResponse("Analyze this medical text for fitness insights."); 
}

export async function getGoogleSearchResponse(query: string) { 
    return { text: "Search simulation active. Access limited in Free Mode.", sources: [] }; 
}

export async function generateDeepDiveGenius(member: any, context: any) { 
    const mock = {
        thought_process: ["Analyzing biomechanics...", "Checking recovery..."],
        analysis_summary: "Based on local logs, user is progressing linearly.",
        identified_weakness: "General Fatigue",
        workout_plan_4weeks: "<h3>Standard Linear Progression</h3><p>Focus on compound lifts.</p>",
        nutrition_strategy_html: "Increase protein intake to 2g/kg.",
        whatsapp_message_text: "Plan updated."
    };
    if (FORCE_SIMULATION) return JSON.stringify(mock);

    const prompt = `Analyze member ${member.name}. Logs: ${JSON.stringify(context)}. Return JSON: {thought_process, analysis_summary, identified_weakness, workout_plan_4weeks, nutrition_strategy_html, whatsapp_message_text}`;
    return getComplexResponse(prompt);
}

export interface ReadinessOutput {
    readinessScore: number;
    feedback: string;
    modifiedWorkout: string;
}

export async function analyzeReadinessAndModify(data: any): Promise<ReadinessOutput> { 
    const sleepScore = Math.min(100, (data.sleepHours / 8) * 100);
    const moodScore = data.mood.length > 5 ? 80 : 50;
    const score = Math.round((sleepScore + moodScore) / 2);
    
    return { 
        readinessScore: score, 
        feedback: score > 70 ? "You are ready to train hard." : "Take it easy today.", 
        modifiedWorkout: score > 70 ? "Standard Protocol" : "Light Recovery Session" 
    }; 
}

export async function getRecoveryBasedWorkout(mood: string, energy: number, sleep: number) { 
    return "Light Cardio and Stretching (Local Recommendation)"; 
}

export async function generateBodyTransformationAnalysis(current: any, target: any, goal: string) { 
    return "<h3>Trajectory: Positive</h3><p>Consistent training will yield results in 12 weeks.</p>"; 
}

export async function findBestExerciseVideo(query: string, list: any[]) { 
    const match = list.find(l => l.name.toLowerCase().includes(query.toLowerCase()));
    return { 
        matchedName: match ? match.name : list[0]?.name, 
        analysis: "Local Search Match.", 
        proTips: ["Keep back straight", "Core tight"] 
    }; 
}

export async function getNutritionAnalysisFromImage(base64: string, mimeType: string, goal: string): Promise<string> {
     if (FORCE_SIMULATION) return JSON.stringify({ foodName: "Simulated Meal", macros: { protein: 25, carbs: 40, fats: 10 }, analysis: "Looks balanced." });
     return "{}"; 
}

export async function generateClinicalFitnessProtocol(base64: string, memberContext: any): Promise<string> {
     if (FORCE_SIMULATION) return JSON.stringify({
            diagnosis: { modern: "Healthy", ayurvedic: "Pitta", root_cause: "N/A" },
            diet_protocol: { type: "Balanced", foods_to_eat: ["Whole Foods"], foods_to_avoid: ["Sugar"], meal_plan_example: "Clean eating." },
            supplement_stack: [],
            workout_prescription: { focus: "Maintenance", schedule: "3x week", contraindications: "None" },
            lifestyle_hacks: ["Sleep 8 hours"]
     });
     
     const prompt = `Analyze clinical report for fitness for Member ID: ${memberContext?.id || 'Unknown'}. Context: ${JSON.stringify(memberContext)}. Return JSON matching ClinicalFitnessProtocol.`;
     return getComplexResponse(prompt);
}

export async function generateNeuroProtocol(userState: string): Promise<string> {
    return JSON.stringify({
        name: "Universal Calm",
        wave: "Alpha",
        freqLeft: 100,
        freqRight: 108,
        isoPulse: 8,
        colorFrom: "#0f172a",
        colorTo: "#3b82f6",
        description: "Standard stress-relief protocol.",
        mantra: "I am centered."
    });
}

export async function generateDhanvantariDiagnosis(input: any): Promise<string> {
     return JSON.stringify({
            diagnosis: { modern: "Analysis", ayurvedic: "Tridosha", root_cause: "Lifestyle" },
            diet_protocol: { type: "Sattvic", foods_to_eat: ["Ghee", "Milk"], foods_to_avoid: ["Spicy"], meal_plan_example: "Traditional Indian." },
            supplement_stack: [{name: "Ashwagandha", dosage: "500mg", reason: "Cortisol"}],
            workout_prescription: { focus: "Yoga", schedule: "Daily", contraindications: "None" },
            lifestyle_hacks: ["Meditation"]
     });
}

export async function generateHyperPersonalizedDiet(profile: any): Promise<string> {
    if (FORCE_SIMULATION) return JSON.stringify(MOCK_RESPONSES.diet_plan);
    const prompt = `Act as an elite sports nutritionist. Create a hyper-personalized diet plan JSON for: ${JSON.stringify(profile)}. Structure: { goal, caloriesTarget, macrosTarget, scienceNote, meals: [{name, time, totalCalories, macros, items: [{food, portion}]}] }`;
    return getComplexResponse(prompt);
}
