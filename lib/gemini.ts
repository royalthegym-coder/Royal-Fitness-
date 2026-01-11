
import { GoogleGenAI, Tool } from "@google/genai";
import { Member, WorkoutLog, MemberFitnessData, WorkoutExercise, BodyMetric } from "../types";

// Type definitions
export interface ReadinessOutput {
    score: number;
    strategy: string;
    reasoning: string;
    modifications: string[];
}

const getAI = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    return new GoogleGenAI({ apiKey: API_KEY });
};

export async function getComplexResponse(prompt: string): Promise<string> {
    const ai = getAI();
    // Using gemini-3-flash-preview for text to ensure high availability and speed
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
    });
    return response.text || "";
}

export async function getGeminiChatResponse(history: any[], message: string): Promise<string> {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message, 
    });
    return response.text || "";
}

export async function generateTextToSpeech(text: string): Promise<string> {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text }] },
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
            }
        }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
}

export async function generateMarketingImage(topic: string): Promise<string | null> {
    const ai = getAI();
    const prompt = `Create a high-quality, professional gym marketing image for an offer about: "${topic}". 
    The image should feature a modern gym environment, energetic atmosphere, and fit people exercising. 
    Style: Photorealistic, cinematic lighting, advertising photography. 
    Ensure it looks appealing and motivational for a fitness business.`;
    
    try {
        // Switched to gemini-2.5-flash-image (Gemini Banana) to resolve PERMISSION_DENIED errors
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: "4:3",
                    // imageSize removed as it is not strictly required for Flash and ensures compatibility
                }
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error("Image generation failed", e);
    }
    return null;
}

export async function getGoogleMapsResponse(query: string, lat?: number, lng?: number): Promise<{ text: string; places: any[] }> {
    const ai = getAI();
    const tools: Tool[] = [{ googleMaps: {} }];
    const toolConfig: any = {};
    if (lat && lng) {
        toolConfig.retrievalConfig = { latLng: { latitude: lat, longitude: lng } };
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: { tools, toolConfig: Object.keys(toolConfig).length ? toolConfig : undefined }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    // Filter map chunks
    const places = groundingChunks.filter((c: any) => c.maps);

    return {
        text: response.text || "",
        places: places
    };
}

export async function getGoogleSearchResponse(query: string): Promise<{ text: string; sources: any[] }> {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: { tools: [{ googleSearch: {} }] }
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.filter((c: any) => c.web);

    return {
        text: response.text || "",
        sources: sources
    };
}

export async function getPostWorkoutAnalysis(member: Member, log: WorkoutLog, history: any[]): Promise<string> {
    const prompt = `Analyze workout for ${member.name}. Log: ${JSON.stringify(log)}. History count: ${history.length}. Give short feedback.`;
    return getComplexResponse(prompt);
}

export async function generateAIWorkoutTemplate(options: any): Promise<string> {
    const prompt = `Create a workout template. Options: ${JSON.stringify(options)}. Return markdown.`;
    return getComplexResponse(prompt);
}

export async function modifyExerciseWithAI(exerciseName: string, type: 'easier' | 'harder' | 'swap'): Promise<WorkoutExercise> {
    const prompt = `Modify exercise '${exerciseName}' to be ${type}. Return JSON: { "name": "string", "sets": "string", "reps": "string" }`;
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    const text = response.text || "{}";
    try {
        return JSON.parse(text);
    } catch {
        return { name: exerciseName, sets: "3", reps: "10" };
    }
}

export async function getRealTimeSetAdjustment(exercise: string, lastSet: {weight: number, reps: number}, feedback: string): Promise<{ adjustment: string, recommendedWeight: number, recommendedReps: number }> {
    const prompt = `Adjust set for ${exercise}. Last: ${lastSet.weight}kg x ${lastSet.reps}. User says: ${feedback}. Return JSON: { "adjustment": "reason", "recommendedWeight": number, "recommendedReps": number }`;
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
}

export async function analyzeReadinessAndModify(data: any): Promise<ReadinessOutput> {
    const prompt = `Analyze readiness. Data: ${JSON.stringify(data)}. Return JSON: { "score": number (0-100), "strategy": "string", "reasoning": "string", "modifications": ["string"] }`;
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
}

export async function getSmartWarmup(workoutName: string): Promise<string> {
    return getComplexResponse(`Create a smart warmup for ${workoutName}. Keep it brief.`);
}

export async function getAICoachSuggestion(context: any): Promise<string> {
    return getComplexResponse(`Give a fitness coach suggestion based on: ${JSON.stringify(context)}.`);
}

export async function generateNextWorkoutChallenge(memberData: any): Promise<{challengeName: string, description: string, difficulty: string, optimizationTips: string[]}> {
    const prompt = `Generate a workout challenge. Data: ${JSON.stringify(memberData)}. Return JSON: { "challengeName": "string", "description": "string", "difficulty": "Easy|Medium|Hard|Extreme", "optimizationTips": ["string"] }`;
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
}

export async function generateNextSessionPlan(memberData: any): Promise<string> {
    return getComplexResponse(`Generate next workout session plan HTML based on: ${JSON.stringify(memberData)}.`);
}

export async function getHealthEngineAnalysis(member: Member, data: any): Promise<string> {
    return getComplexResponse(`Deep health analysis for ${member.name}. Data: ${JSON.stringify(data)}. Return HTML.`);
}

export async function getGeniusModeAnalysis(member: Member, data: any): Promise<string> {
    return getComplexResponse(`Genius mode analysis for ${member.name}. Data: ${JSON.stringify(data)}. Return HTML.`);
}

export async function getGeniusModePlan(analysis: string, member: Member): Promise<string> {
    return getComplexResponse(`Create plan from analysis: ${analysis} for ${member.name}. Include sections ### 4-Week Workout Plan ### and ### Nutrition Plan ###.`);
}

export async function analyzeExerciseForm(base64Image: string): Promise<{ feedback: string; status: 'Good' | 'Correction Needed' | 'Idle' }> {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                { text: 'Analyze exercise form. Return JSON: { "feedback": "string", "status": "Good" | "Correction Needed" | "Idle" }' }
            ]
        },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{"feedback": "Error", "status": "Idle"}');
}

export async function getRecoveryBasedWorkout(mood: string, energy: number, sleep: number): Promise<string> {
    return getComplexResponse(`Suggest workout. Mood: ${mood}, Energy: ${energy}%, Sleep: ${sleep}h.`);
}

export async function getAIChefRecipe(ingredients: string): Promise<string> {
    const prompt = `Create recipe with ${ingredients}. Return JSON: { "title": "string", "macros": "string", "instructions": ["string"], "shoppingList": ["string"] }`;
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return response.text || "{}";
}

export async function generateFutureSelfImage(current: string, goal: string): Promise<string | null> {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: `Photorealistic fitness transformation. Current: ${current}. Goal: ${goal}. Full body shot.` }]
            }
        });
        
        // Find image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

export async function analyzeMedicalRecord(base64Image: string): Promise<string> {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                { text: 'Analyze this medical record/lab report. Summarize key findings for a fitness context. Return HTML.' }
            ]
        }
    });
    return response.text || "";
}

export async function getHealthAssistantResponse(history: any[], message: string, context: any): Promise<string> {
    const ai = getAI();
    const systemPrompt = `You are a health assistant. Context: ${JSON.stringify(context)}.`;
    
    const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: { systemInstruction: systemPrompt },
        history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
    });
    
    const response = await chat.sendMessage({ message });
    return response.text || "";
}

export async function generateBodyTransformationAnalysis(current: any, target: any, focus: string): Promise<string> {
    return getComplexResponse(`Analyze body transformation. Current: ${JSON.stringify(current)}. Target: ${JSON.stringify(target)}. Focus: ${focus}. Return HTML report.`);
}

export async function generateGamifiedChallenge(logs: any[]): Promise<any> {
    const prompt = `Generate a gamified fitness challenge based on logs. Return JSON: { "id": "string", "title": "string", "description": "string", "xpReward": number, "difficulty": "Easy|Medium|Hard", "isCompleted": boolean }`;
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || "{}");
}

export async function getNutritionAnalysisFromImage(base64ImageData: string, mimeType: string, memberGoal?: string): Promise<string> {
    const ai = getAI();

    try {
        const imagePart = {
            inlineData: {
                data: base64ImageData,
                mimeType: mimeType,
            },
        };

        const textPart = {
            text: `
                You are an AI Nutritionist. Analyze this food image.
                ${memberGoal ? `The user's fitness goal is: "${memberGoal}".` : ''}
                Return a JSON object with:
                {
                    "foodName": "string",
                    "calories": number,
                    "macros": { "protein": "string", "carbs": "string", "fats": "string" },
                    "micros": ["string"] (list 3-4 key vitamins/minerals found),
                    "healthScore": number (1-10),
                    "analysis": "A short, friendly paragraph about this meal.",
                    "goalAdvice": "Specific advice on how this meal fits the user's goal. Mention if it's good or needs adjustment."
                }
            `,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { parts: [imagePart, textPart] },
            config: { responseMimeType: 'application/json' }
        });

        return response.text || "{}";
    } catch (error) {
        console.error("Image nutrition analysis failed:", error);
        throw error;
    }
}
