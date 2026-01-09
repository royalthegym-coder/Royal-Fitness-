
import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";
import { Member, MemberFitnessData, Package, WorkoutLog, HealthData, WorkoutExercise, Challenge } from "../types";
import { GYM_INFO, INITIAL_PACKAGES } from "../constants";

// Types
export interface ReadinessOutput {
    score: number;
    strategy: string;
    reasoning: string;
    modifications: string[];
}

export async function getGeminiChatResponse(
    history: { role: 'user' | 'model'; text: string }[], 
    newMessage: string,
    systemInstruction?: string
): Promise<string> {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const chat = ai.chats.create({ 
        model: 'gemini-3-flash-preview',
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        })),
        config: {
            systemInstruction: systemInstruction || `You are an expert AI Assistant for "Royal The Gym". 
            You help with gym management, fitness advice, and navigating the app.
            
            Context:
            Gym Name: ${GYM_INFO.name}
            Contact: ${GYM_INFO.contact}
            Packages: ${INITIAL_PACKAGES.map(p => p.name).join(', ')}
            `,
        }
    });
    const result: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
    return result.text || "Sorry, I could not generate a response.";
  } catch (error) {
    console.error("Error getting chat response:", error);
    throw error;
  }
}

export async function generateTextToSpeech(text: string): Promise<string | null> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return audioData || null;
    } catch (error) {
        console.error("TTS generation failed:", error);
        throw error;
    }
}

interface WorkoutGenerationOptions {
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    goal: 'Muscle Gain' | 'Fat Loss' | 'Strength' | 'General Fitness';
    structure: 'Full Body' | 'Push/Pull/Legs' | 'Upper/Lower Split';
    daysPerWeek: number;
    notes: string;
}

export async function generateAIWorkoutTemplate(options: WorkoutGenerationOptions): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        Act as a certified Master Strength and Conditioning Coach.
        Create a full workout plan in Markdown format.
        
        **Requirements:**
        - Name: ${options.name}
        - Level: ${options.level}
        - Goal: ${options.goal}
        - Structure: ${options.structure}
        - Frequency: ${options.daysPerWeek} days/week
        - Notes: ${options.notes}

        **Output Format:**
        Provide a clean list of exercises for each day.
        For each exercise, specify Sets and Reps.
        Include brief form tips.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
    });

    return response.text || "Failed to generate workout.";
}

export async function analyzeExerciseForm(imageBase64: string): Promise<{feedback: string; status: 'Good' | 'Correction Needed'}> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
                    { text: "Analyze the exercise form in this image. Is the person's posture correct? If not, provide one short, direct correction command (max 10 words) like 'Keep your back straight' or 'Lower your hips'. Also return a status: 'Good' or 'Correction Needed'. Return JSON: { \"feedback\": \"string\", \"status\": \"Good\" | \"Correction Needed\" }" }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        
        return JSON.parse(response.text || "{}");
    } catch (e) {
        console.error(e);
        return { feedback: "Cannot analyze", status: "Good" };
    }
}

export async function getNutritionAnalysisFromImage(base64ImageData: string, mimeType: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

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
                Return a JSON object with:
                {
                    "foodName": "string",
                    "calories": number,
                    "macros": { "protein": "string", "carbs": "string", "fats": "string" },
                    "healthScore": number (1-10),
                    "analysis": "A short, friendly paragraph about this meal."
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

// --- NEW FUNCTIONS ---

export async function getComplexResponse(prompt: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Use Pro for complex reasoning
        contents: prompt,
    });
    return response.text || "";
}

export async function getGoogleSearchResponse(query: string): Promise<{text: string, sources: any[]}> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Search tool available on pro
        contents: query,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text || "", sources };
}

export async function getGoogleMapsResponse(query: string, lat?: number, lng?: number): Promise<{ text: string; places: any[] }> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const config: any = {
        tools: [{ googleMaps: {} }]
    };
    
    if (lat && lng) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: { latitude: lat, longitude: lng }
            }
        }
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', // Maps usually supported on 2.5
        contents: query,
        config: config
    });

    const places = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text || "", places };
}

export async function getPostWorkoutAnalysis(member: Member, log: WorkoutLog, history: MemberFitnessData[number]): Promise<string> {
    return getComplexResponse(`
        Analyze this workout log for ${member.name}:
        Workout: ${log.templateName}
        Performance: ${JSON.stringify(log.performance)}
        History: ${JSON.stringify(history.logs.slice(-3))}
        Provide a brief, encouraging, and technical analysis of their performance. Suggest 1 actionable tip for next time.
    `);
}

export async function modifyExerciseWithAI(originalName: string, type: 'easier' | 'harder' | 'swap'): Promise<WorkoutExercise> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `Suggest a variant for the exercise "${originalName}". Modification type: "${type}". Return JSON: { "name": "string", "sets": "string", "reps": "string" }`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    try {
        return JSON.parse(response.text || "{}");
    } catch {
        return { name: originalName, sets: "3", reps: "10" };
    }
}

export async function getRealTimeSetAdjustment(exercise: string, lastSet: {weight: number, reps: number}, feedback: string): Promise<{ adjustment: string, recommendedWeight: number, recommendedReps: number }> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        Exercise: ${exercise}
        Last Set: ${lastSet.weight}kg x ${lastSet.reps} reps
        User Feedback: ${feedback}
        
        Suggest weight/rep adjustment for next set.
        Return JSON: { "adjustment": "string (short reasoning)", "recommendedWeight": number, "recommendedReps": number }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    try {
        return JSON.parse(response.text || "{}");
    } catch {
        return { adjustment: "Maintain", recommendedWeight: lastSet.weight, recommendedReps: lastSet.reps };
    }
}

export async function analyzeReadinessAndModify(data: {mood: string, sleepHours: number, sleepQuality: string, soreness: string, restingHeartRate?: number, plannedWorkoutName: string}): Promise<ReadinessOutput> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        Analyze Daily Readiness.
        Data: ${JSON.stringify(data)}
        
        Output JSON: { "score": number (0-100), "strategy": "Push Hard" | "Train Normal" | "Active Recovery" | "Rest", "reasoning": "string", "modifications": ["string"] }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    try {
        return JSON.parse(response.text || "{}");
    } catch {
        return { score: 50, strategy: "Train Normal", reasoning: "Analysis failed", modifications: [] };
    }
}

export async function getSmartWarmup(workoutName: string): Promise<string> {
    return getComplexResponse(`Generate a quick 5-minute smart warmup routine specifically for a workout named: "${workoutName}". Format as a checklist.`);
}

export async function getAICoachSuggestion(metrics: any): Promise<string> {
    return getComplexResponse(`Based on these body metrics: ${JSON.stringify(metrics)}, suggest a focus for the next month.`);
}

export async function generateNextWorkoutChallenge(data: {logs: WorkoutLog[]}): Promise<{challengeName: string, description: string, difficulty: string, optimizationTips: string[]}> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        Based on these past logs: ${JSON.stringify(data.logs.slice(-3))}, generate a fun fitness challenge for tomorrow.
        Return JSON: { "challengeName": "string", "description": "string", "difficulty": "Easy"|"Medium"|"Hard"|"Extreme", "optimizationTips": ["string"] }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    try {
        return JSON.parse(response.text || "{}");
    } catch {
        return { challengeName: "Generic Challenge", description: "Do 50 pushups", difficulty: "Medium", optimizationTips: ["Keep form tight"] };
    }
}

export async function generateGamifiedChallenge(history: WorkoutLog[]): Promise<Challenge> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        Act as a gamified fitness coach.
        Based on these recent workout logs: ${JSON.stringify(history.slice(-3))}, create a fun, micro-challenge for today to push them slightly.
        It should be achievable but challenging.
        
        Return strictly JSON:
        {
            "title": "string (Fun name like 'Bicep Blaster')",
            "description": "string (Specific task e.g., 'Do 20 unbroken pushups')",
            "xpReward": number (between 50 and 200),
            "difficulty": "Easy" | "Medium" | "Hard"
        }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    try {
        const result = JSON.parse(response.text || "{}");
        return {
            id: Date.now().toString(),
            title: result.title || "Daily Grind",
            description: result.description || "Log a workout today.",
            xpReward: result.xpReward || 50,
            difficulty: result.difficulty || "Easy",
            isCompleted: false
        };
    } catch {
        return {
            id: Date.now().toString(),
            title: "Consistency is Key",
            description: "Complete any 30-minute workout today.",
            xpReward: 100,
            difficulty: "Medium",
            isCompleted: false
        };
    }
}

export async function generateNextSessionPlan(data: {logs: WorkoutLog[]}): Promise<string> {
    return getComplexResponse(`
        Analyze previous logs: ${JSON.stringify(data.logs.slice(-3))}.
        Design the NEXT workout session applying progressive overload. Format as Markdown.
    `);
}

export async function getHealthEngineAnalysis(member: Member, data: any): Promise<string> {
    return getComplexResponse(`
        Act as an elite sports scientist. Analyze this member data:
        Member: ${member.name}
        Data: ${JSON.stringify(data)}
        Provide a comprehensive performance review, risk analysis, and future plan.
    `);
}

export async function getGeniusModeAnalysis(member: Member, data: any): Promise<string> {
    return getComplexResponse(`
        Deep dive analysis for Genius Mode.
        Member: ${member.name}
        Data: ${JSON.stringify(data)}
        Identify strengths, weaknesses, and key opportunities for growth.
    `);
}

export async function getGeniusModePlan(analysis: string, member: Member): Promise<string> {
    return getComplexResponse(`
        Based on this analysis: "${analysis}", create a 4-week plan for ${member.name}.
        Include:
        ### 4-Week Workout Plan ###
        [Details]
        ### Nutrition Plan ###
        [Details]
    `);
}

export async function getRecoveryBasedWorkout(mood: string, energy: number, sleep: number): Promise<string> {
    return getComplexResponse(`
        Generate a workout adjustment based on: Mood=${mood}, Energy=${energy}%, Sleep=${sleep}hrs.
        Should be "Active Recovery", "Light Session", or "Full Send"? Provide the routine.
    `);
}

export async function getAIChefRecipe(ingredients: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        Create a healthy recipe using: ${ingredients}.
        Return JSON: { "title": "string", "macros": "string (e.g. 30g Protein, 400kcal)", "instructions": ["string"], "shoppingList": ["string (missing items)"] }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });

    return response.text || JSON.stringify({ 
        title: "Simple Meal", 
        macros: "N/A", 
        instructions: ["Cook ingredients."], 
        shoppingList: [] 
    });
}

export async function generateFutureSelfImage(current: string, goal: string): Promise<string | null> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const prompt = `A realistic fitness transformation comparison. Person current state: ${current}. Person goal state: ${goal}. High quality, gym lighting.`;
        // Using image generation model as per guidelines
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] }
        });
        
        // Extract image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Image generation failed", e);
        return null;
    }
}

export async function analyzeMedicalRecord(base64Image: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
            parts: [
                { inlineData: { mimeType: 'image/png', data: base64Image } },
                { text: "Analyze this medical document/lab report. Extract key biomarkers relevant to fitness (e.g. Testosterone, Vitamin D, Iron, Lipid Panel). Explain implications for training and diet." }
            ]
        }
    });
    return response.text || "";
}

export async function getHealthAssistantResponse(history: { role: 'user' | 'model'; text: string }[], message: string, context: any): Promise<string> {
    const systemPrompt = `You are a Health Assistant. Context: ${JSON.stringify(context)}. Answer health questions.`;
    return getGeminiChatResponse(history, message, systemPrompt);
}

export async function generateBodyTransformationAnalysis(current: any, target: any, focus: string): Promise<string> {
    return getComplexResponse(`
        Analyze body transformation:
        Current: ${JSON.stringify(current)}
        Target: ${JSON.stringify(target)}
        Focus: ${focus}
        
        Provide a timeline estimate, difficulty rating, and key physiological changes required.
    `);
}
