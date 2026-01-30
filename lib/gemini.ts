
import { GoogleGenAI, Tool, Modality } from "@google/genai";
import { Member, WorkoutLog, MemberFitnessData, WorkoutExercise, BodyMetric } from "../types";

// Type definitions
export interface ReadinessOutput {
    score: number;
    strategy: string;
    reasoning: string;
    modifications: string[];
}

const getAI = () => {
    // Safe access to API Key from injected process.env
    const API_KEY = (window as any).process?.env?.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    return new GoogleGenAI({ apiKey: API_KEY });
};

// Use gemini-3-flash-preview for standard text generation tasks
const DEFAULT_MODEL = 'gemini-3-flash-preview';

export async function getComplexResponse(prompt: string): Promise<string> {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        return response.text || "No response generated.";
    } catch (error) {
        console.error("Gemini Text Generation Error:", error);
        return "System is currently offline or experiencing high traffic. Please try again later.";
    }
}

// --- NEW: SMART LINK AUTOMATED YOUTUBE ENGINE ---
export async function findBestExerciseMedia(exerciseName: string): Promise<{ youtubeId: string; imageUrl: string; tips: string[]; timestamp?: number }> {
    const ai = getAI();
    try {
        const prompt = `
            Act as "Smart Link", an automated YouTube engine for elite fitness training.
            Target Exercise: "${exerciseName}".
            
            **Protocol:**
            1. **Source Selection:** Search ONLY for videos from these scientifically accurate, certified channels:
               - Athlean-X (Jeff Cavaliere)
               - Renaissance Periodization (Dr. Mike Israetel)
               - Jeff Nippard
               - Squat University
               - Jeremy Ethier
            
            2. **Smart Cue Engine:**
               - Identify the EXACT timestamp (in seconds) where the actual exercise *execution* starts.
               - CRITICAL: Skip the intro, science theory, and "subscribe" requests. The video must start immediately at the first rep.
            
            3. **Extraction:**
               - Get the YouTube Video ID.
               - Get a high-quality thumbnail image.
               - Extract 3 distinct "Smart Cues" (short, actionable form tips).

            Return ONLY raw JSON (no markdown):
            {
                "youtubeId": "VIDEO_ID",
                "timestamp": 120, 
                "imageUrl": "IMAGE_URL",
                "tips": ["Cue 1", "Cue 2", "Cue 3"]
            }
        `;

        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { 
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "{}";
        const json = JSON.parse(text);
        
        return {
            youtubeId: json.youtubeId || "",
            timestamp: json.timestamp || 0,
            imageUrl: json.imageUrl || "",
            tips: json.tips || ["Focus on form", "Control the tempo", "Breathe consistently"]
        };
    } catch (e) {
        console.error("AI Media Search Error:", e);
        return {
            youtubeId: "",
            imageUrl: "",
            tips: ["Ensure neutral spine", "Full range of motion", "Engage core"]
        };
    }
}

export async function generateTextToSpeech(text: string): Promise<string> {
    // 401 FIX: Use browser-native SpeechSynthesis as primary and specifically correct model for AI fallback
    try {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => (v.name.includes('Google') || v.name.includes('Natural')) && v.lang.startsWith('en'));
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
            return ""; 
        }

        const ai = getAI();
        // Correct model for TTS is gemini-2.5-flash-preview-tts
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts', 
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
    } catch (error) {
        console.error("TTS Error:", error);
        return "";
    }
}

export async function analyzeExerciseForm(base64Image: string): Promise<{ feedback: string; status: 'Good' | 'Correction Needed' | 'Idle' }> {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: {
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: 'Analyze this gym form.' }
                ]
            },
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || '{}');
    } catch {
        return { feedback: "", status: "Idle" };
    }
}

export async function analyzeReadinessAndModify(data: any): Promise<ReadinessOutput> {
    const prompt = `Analyze readiness for exercise based on these factors: ${JSON.stringify(data)}. Return JSON structure: { "score": number, "strategy": "string", "reasoning": "string", "modifications": ["string"] }`;
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || "{}");
    } catch {
        return { score: 80, strategy: "Standard", reasoning: "Default fallback due to processing error", modifications: [] };
    }
}

export async function getGeminiChatResponse(h:any, m:any) { return ""; }
export async function scanGlobalTrends(q:any) { return ""; }
export async function generateViralContent(t:any, m:any) { return ""; }
export async function getContextualRetentionMessage(m:any, l:any) { return ""; }
export async function suggestMedicalTests(s:any) { return ""; }
export async function generateClinicalHypertrophyPlan(p:any, l:any, s:any) { return ""; }
export async function getTacticalMotivation(m:any, l:any, g:any) { return ""; }
export async function generateAutonomousMarketingStrategy(r:any, p:any, g:any) { return ""; }
export async function generateMarketingImage(t:any) { return ""; }
export async function getGoogleMapsResponse(q:any, l?:any, ln?:any) { return {text:"", places:[]}; }
export async function getGoogleSearchResponse(q:any) { 
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
           model: DEFAULT_MODEL,
           contents: [{ role: 'user', parts: [{ text: q }] }],
           config: {
             tools: [{googleSearch: {}}],
           },
        });
        return {
            text: response.text || "",
            sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };
    } catch (e) {
        console.error("Search API Error", e);
        return { text: "Search service temporarily unavailable.", sources: [] };
    }
}
export async function generateFutureSelfImage(c:any, g:any) { return ""; }
export async function analyzeMedicalRecord(b:any) {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: {
                role: 'user',
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: b } },
                    { text: 'Extract and analyze all health biomarkers from this lab report image. Categorize them and highlight anything out of range.' }
                ]
            }
        });
        return response.text || "Could not analyze the document.";
    } catch {
        return "Error analyzing document.";
    }
}
export async function getHealthAssistantResponse(h:any, m:any, c:any) {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: `${JSON.stringify(c)}\n\nUser Question: ${m}` }] }]
        });
        return response.text || "I'm listening.";
    } catch {
        return "Service error.";
    }
}
export async function getAIChefRecipe(i:any, r:any) { return ""; }
export async function generateAIWorkoutTemplate(o:any) {
    const ai = getAI();
    try {
        const prompt = `Create a detailed AI workout template for ${o.name} with goal ${o.goal} at level ${o.level}. Style: ${o.structure}. Duration: ${o.daysPerWeek} days/week. Return JSON: { "name": "string", "description": "string", "exercises": [{ "name": "string", "sets": "string", "reps": "string" }] }`;
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });
        return response.text || "";
    } catch {
        return "";
    }
}

export async function generateGamifiedChallenge(workoutLogs: any[]): Promise<any> {
    const ai = getAI();
    try {
        const prompt = `
            Analyze these recent workout logs and create a fun, gamified fitness challenge for the user.
            Logs: ${JSON.stringify(workoutLogs || [])}.
            
            Return JSON with:
            {
                "id": "string",
                "title": "string",
                "description": "string",
                "xpReward": number,
                "difficulty": "Easy" | "Medium" | "Hard",
                "isCompleted": boolean
            }
        `;
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error("Challenge Gen Error", e);
        return {
            id: `chall-${Date.now()}`,
            title: "Consistency Hero",
            description: "Log your workout tomorrow!",
            xpReward: 100,
            difficulty: "Easy",
            isCompleted: false
        };
    }
}

export async function getNutritionAnalysisFromImage(b:any, m:any, g:any) {
    const ai = getAI();
    try {
        const prompt = `Analyze this food image. Provide detailed nutrition data (calories, macros) and advice for the goal: ${g}. Return ONLY JSON: { "foodName": "string", "calories": number, "macros": { "protein": "string", "carbs": "string", "fats": "string" }, "micros": ["string"], "healthScore": number, "analysis": "string" }`;
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: {
                role: 'user',
                parts: [
                    { inlineData: { mimeType: m, data: b } },
                    { text: prompt }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return response.text || "{}";
    } catch {
        return "{}";
    }
}
export async function getRecoveryBasedWorkout(m:any, e:any, s:any) { return ""; }
export async function generateBodyTransformationAnalysis(c:any, t:any, f:any) { return ""; }
export async function getGeniusModeAnalysis(m:any, d:any) { return ""; }
export async function getGeniusModePlan(a:any, m:any) { return ""; }
export async function getHealthEngineAnalysis(m:any, d:any) { 
    const ai = getAI();
    try {
        const prompt = `Perform a performance analysis for ${m.name}. Data: ${JSON.stringify(d)}`;
        const response = await ai.models.generateContent({
            model: DEFAULT_MODEL,
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return response.text || "";
    } catch {
        return "";
    }
}
export async function calculateMacrosAI(p:any) { return ""; }
export async function generateAdvancedDietPlan(p:any, a:any, s:any) { return ""; }
export async function generateSupplementStack(p:any) { return ""; }
