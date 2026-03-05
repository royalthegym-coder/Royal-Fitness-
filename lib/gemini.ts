import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Member } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- CONFIGURATION ---
const TEXT_MODEL = 'gemini-3-flash-preview';
const VISION_MODEL = 'gemini-2.5-flash-image'; // For image analysis

// --- CACHE ---
const RESPONSE_CACHE = new Map<string, string>();
if (RESPONSE_CACHE.size > 500) RESPONSE_CACHE.clear();

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

// --- CORE FUNCTIONS ---

export async function getComplexResponse(prompt: string, systemInstruction?: string): Promise<string> {
    const cacheKey = `text:${prompt}:${systemInstruction}`;
    if (RESPONSE_CACHE.has(cacheKey)) return RESPONSE_CACHE.get(cacheKey) || "";

    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction || "You are an elite fitness and health AI assistant for Royal The Gym.",
            }
        });

        const text = response.text || "";
        RESPONSE_CACHE.set(cacheKey, text);
        return text;
    } catch (e) {
        console.error("Gemini API Error:", e);
        return "Neural Uplink Offline. Using cached protocols.";
    }
}

export async function getHealthAssistantResponse(history: any[], message: string, context: any): Promise<string> {
    try {
        const chat = ai.chats.create({
            model: TEXT_MODEL,
            config: {
                systemInstruction: `You are Royal Health AI. Context: ${JSON.stringify(context)}. Keep answers concise and professional.`,
            }
        });

        // Convert history to Gemini format if needed, but sendMessage handles simple strings
        const response = await chat.sendMessage({ message });
        return response.text || "I couldn't process that.";
    } catch (e) {
        console.error("Gemini Chat Error:", e);
        return "I am unable to process that request right now.";
    }
}

export async function analyzeExerciseForm(base64: string): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: "image/jpeg" } },
                    { text: "Analyze this exercise form. Provide brief feedback (max 10 words) and a status (Good/Correction Needed). Return JSON: {feedback, status}" }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Gemini Vision Error:", e);
        return { feedback: "Vision Sensor Offline", status: "Idle" };
    }
}

export async function analyzeMemberPhoto(base64: string): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: "image/jpeg" } },
                    { text: "Analyze this person's physical condition for gym admission. Estimate health_score (0-100), bio_age, and body_fat percentage. Identify primary body type (Ectomorph/Mesomorph/Endomorph). Return JSON: {health_score, bio_age, body_fat, body_type, analysis_summary}" }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Gemini Photo Analysis Error:", e);
        return { health_score: 75, bio_age: 25, body_fat: 20, body_type: 'Mesomorph', analysis_summary: 'Standard analysis fallback.' };
    }
}

export async function generateDeepDiveGenius(member: any, context: any) {
    const prompt = `Analyze member ${member.name}. Logs: ${JSON.stringify(context)}. Provide a deep dive analysis including thought process, summary, weaknesses, a 4-week workout plan (HTML), nutrition strategy (HTML), and a short WhatsApp message. Return JSON: {thought_process: string[], analysis_summary: string, identified_weakness: string, workout_plan_4weeks: string, nutrition_strategy_html: string, whatsapp_message_text: string}`;
    
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return response.text || "{}";
    } catch (e) {
        console.error("Genius Mode Error:", e);
        return JSON.stringify({
            thought_process: ["Error in AI uplink"],
            analysis_summary: "Unable to generate deep dive.",
            identified_weakness: "N/A",
            workout_plan_4weeks: "<p>Standard plan fallback.</p>",
            nutrition_strategy_html: "<p>Standard nutrition fallback.</p>",
            whatsapp_message_text: "AI analysis failed."
        });
    }
}

export async function generateHyperPersonalizedDiet(profile: any): Promise<string> {
    const prompt = `Act as an elite sports nutritionist and biochemist. Create a highly advanced, scientific, hyper-personalized diet plan designed to completely transform body structure for: ${JSON.stringify(profile)}. 
    The plan must be elite-level, utilizing nutrient timing and metabolic optimization.
    
    CRITICAL: The user has the following allergies/intolerances: ${JSON.stringify(profile.allergies || [])}. 
    DO NOT include any of these ingredients in the meal plan.
    
    Return a JSON object with this EXACT structure:
    {
        "name": "Plan Name",
        "level": "${profile.level || 'Advanced'}", 
        "goal": "${profile.goal}",
        "duration": "4 Weeks",
        "caloriesTarget": 2500,
        "macrosTarget": { "protein": 200, "carbs": 250, "fats": 80 },
        "scientificNote": "Detailed scientific explanation of the metabolic strategy...",
        "meals": [
            {
                "id": "unique_id",
                "name": "Meal Name (e.g., Pre-Workout Fuel)",
                "time": "08:00 AM",
                "calories": 500,
                "protein": 40,
                "carbs": 60,
                "fats": 10,
                "items": ["100g Oats", "1 Scoop Whey Isolate", "Berries"],
                "notes": "Eat 60 mins before training"
            }
        ]
    }`;
    
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        const dietText = response.text || "{}";
        const dietJson = JSON.parse(dietText);
        
        // Validate against allergies
        const allergies = profile.allergies || [];
        if (allergies.length > 0) {
            const { isValid, message } = validateDiet(dietJson, allergies);
            if (!isValid) {
                console.warn("AI generated an unsafe diet:", message);
                // In a real app, we might retry generation here. 
                // For now, we return a modified JSON with a warning.
                dietJson.scientificNote = `WARNING: ${message}. ` + dietJson.scientificNote;
                return JSON.stringify(dietJson);
            }
        }
        
        return dietText;
    } catch (e) {
        console.error("Diet Generation Error:", e);
        return "{}";
    }
}

/**
 * Validates an AI-generated diet plan against a list of known allergies.
 * @param dietJson The parsed JSON of the diet plan.
 * @param allergies An array of allergy strings (e.g., ["Peanuts", "Milk"]).
 * @returns An object containing a boolean isValid and a message.
 */
export function validateDiet(dietJson: any, allergies: string[]): { isValid: boolean, message: string } {
    if (!dietJson || !dietJson.meals || !Array.isArray(dietJson.meals)) {
        return { isValid: true, message: "No meals to validate." };
    }

    const lowerAllergies = allergies.map(a => a.toLowerCase());

    for (const meal of dietJson.meals) {
        if (meal.items && Array.isArray(meal.items)) {
            for (const item of meal.items) {
                const lowerItem = item.toLowerCase();
                for (const allergy of lowerAllergies) {
                    if (lowerItem.includes(allergy)) {
                        return { 
                            isValid: false, 
                            message: `Alert: AI suggested '${item}' in meal '${meal.name}' which contains an allergy ('${allergy}')!` 
                        };
                    }
                }
            }
        }
    }

    return { isValid: true, message: "Safe Diet" };
}

// --- FALLBACKS & SIMPLIFIED UTILS ---

export async function generateTextToSpeech(text: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: `Say clearly and professionally: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || "";
    } catch (e) {
        console.error("Gemini TTS Error:", e);
        return "";
    }
}

export async function getAIChefRecipe(ingredients: string, goal: string) { 
    return getComplexResponse(`Recipe using ${ingredients} for ${goal}. Return JSON: {title, macros, instructions: string[], shoppingList: string[]}`); 
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

/**
 * Edge Case: Safe Mode Workout Generation for Injured Members
 */
export async function generateSafeModeWorkout(memberContext: any, injuries: string): Promise<string> {
    const prompt = `Act as an elite physical therapist and rehabilitation specialist.
    The member has the following injuries/conditions: ${injuries}.
    Generate a 'Safe Mode' workout protocol that COMPLETELY AVOIDS stressing the injured areas while maintaining cardiovascular health and uninjured muscle mass.
    Context: ${JSON.stringify(memberContext)}.
    Return JSON: {
        "workoutName": "Safe Mode Recovery Protocol",
        "focus": "Rehabilitation & Maintenance",
        "contraindications": ["List of movements to absolutely avoid"],
        "exercises": [
            { "name": "Exercise Name", "sets": 3, "reps": "12-15", "notes": "Specific safety instructions" }
        ],
        "safetyWarning": "A brief medical disclaimer"
    }`;
    return getComplexResponse(prompt);
}

export async function generateClinicalFitnessProtocol(base64: string, memberContext: any): Promise<string> {
     const prompt = `Analyze clinical report for fitness for Member ID: ${memberContext?.id || 'Unknown'}. Context: ${JSON.stringify(memberContext)}. Return JSON: {diagnosis: {modern, ayurvedic, root_cause}, diet_protocol: {type, foods_to_eat: string[], foods_to_avoid: string[], meal_plan_example}, supplement_stack: {name, dosage, reason}[], workout_prescription: {focus, schedule, contraindications}, lifestyle_hacks: string[]}`;
     return getComplexResponse(prompt);
}

export async function generateDhanvantariDiagnosis(input: any): Promise<string> {
     const prompt = `Provide an Ayurvedic (Dhanvantari) fitness diagnosis for: ${JSON.stringify(input)}. Return JSON: {diagnosis: {modern, ayurvedic, root_cause}, diet_protocol: {type, foods_to_eat: string[], foods_to_avoid: string[], meal_plan_example}, supplement_stack: {name, dosage, reason}[], workout_prescription: {focus, schedule, contraindications}, lifestyle_hacks: string[]}`;
     return getComplexResponse(prompt);
}

export async function generateBodyTransformationAnalysis(member: any, ...args: any[]): Promise<any> {
    return getComplexResponse(`Analyze transformation for ${member.name}. Additional context: ${JSON.stringify(args)}. Provide JSON: {current_status, goal_status, time_estimate, key_milestones: string[]}`);
}

export async function generateFutureSelfImage(base64: string, targetGoal: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: "image/jpeg" } },
                    { text: `Generate a futuristic image of this person after achieving ${targetGoal}.` }
                ]
            }
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return base64; // Fallback
    } catch (e) {
        console.error("Image Generation Error:", e);
        return base64;
    }
}

export async function getNutritionAnalysisFromImage(base64: string, ...args: any[]): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: "image/jpeg" } },
                    { text: `Analyze this food image. Context: ${JSON.stringify(args)}. Estimate calories and macros. Return JSON: {food_name, calories, protein, carbs, fats, health_rating}` }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        return { food_name: "Unknown", calories: 0, protein: 0, carbs: 0, fats: 0, health_rating: 0 };
    }
}

export async function getRecoveryBasedWorkout(member: any, recoveryData: any, ...args: any[]): Promise<string> {
    return getComplexResponse(`Generate a workout for ${member.name} based on recovery: ${JSON.stringify(recoveryData)}. Extra: ${JSON.stringify(args)}`);
}

export async function analyzeMedicalRecord(base64: string, ...args: any[]): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: "image/jpeg" } },
                    { text: `Analyze this medical record. Context: ${JSON.stringify(args)}. Summarize key findings for a fitness trainer. Return JSON: {findings: string[], precautions: string[], recommended_exercises: string[]}` }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        return { findings: ["Analysis failed"], precautions: [], recommended_exercises: [] };
    }
}

export async function getGoogleSearchResponse(query: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: query,
            config: { tools: [{ googleSearch: {} }] }
        });
        return response.text || "No search results.";
    } catch (e) {
        return "Search unavailable.";
    }
}

export async function generatePersonalizedHealthVision(memberData: any): Promise<string> {
    const prompt = `Based on this member's data: ${JSON.stringify(memberData)}, generate a futuristic, inspiring "Personalized Health Vision" in 3-4 sentences. Focus on their potential transformation and how Royal The Gym's Neural OS will help them. Use a professional yet motivating tone.`;
    return getComplexResponse(prompt);
}

export async function generateNeuralAutomationLogic(event: string, context: any): Promise<any> {
    const prompt = `Act as the Neural OS Automation Engine. Event: ${event}. Context: ${JSON.stringify(context)}. 
    Determine the next logical automation steps for n8n, WhatsApp, and Google Business. 
    Return JSON: { n8n_action: string, whatsapp_payload: string, google_update: string, reasoning: string }`;
    
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        return { n8n_action: "idle", whatsapp_payload: "", google_update: "", reasoning: "AI Offline" };
    }
}

export async function generateNeuroProtocol(member: any, cognitiveData?: any): Promise<string> {
    return getComplexResponse(`Generate a neuro-recovery protocol for ${member?.name || 'Member'}. Data: ${JSON.stringify(cognitiveData || {})}`);
}

export async function findBestExerciseVideo(exerciseName: string, ...args: any[]): Promise<any> {
    const prompt = `Find best exercise video and analysis for ${exerciseName}. Context: ${JSON.stringify(args)}. Return JSON: {matchedName: string, analysis: string, proTips: string[], videoUrl: string}`;
    const response = await getComplexResponse(prompt);
    return cleanAndParseJSON(response);
}
