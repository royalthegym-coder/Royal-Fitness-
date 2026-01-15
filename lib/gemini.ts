
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
    try {
        // Using gemini-3-flash-preview for text to ensure high availability and speed
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        return response.text || "No response generated.";
    } catch (error) {
        console.error("Gemini Text Generation Error:", error);
        return "System is currently offline or experiencing high traffic. Please try again later.";
    }
}

export async function getGeminiChatResponse(history: any[], message: string): Promise<string> {
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: message, 
        });
        return response.text || "I'm sorry, I couldn't process that.";
    } catch (error) {
        console.error("Chat Error:", error);
        return "Connection error. Please check your network.";
    }
}

// --- NEW AUTONOMOUS BUSINESS FUNCTIONS ---

export async function generateAutonomousMarketingStrategy(
    reviews: any[], 
    posts: any[], 
    gymInfo: any
): Promise<string> {
    const prompt = `
        Act as a Google Business Profile expert and AI Marketing Manager for "${gymInfo.name}".
        
        Analyze the current state:
        - Recent Reviews (Sentiment): ${JSON.stringify(reviews.slice(0, 3))}
        - Recent Posts: ${JSON.stringify(posts.slice(0, 2))}
        
        Generate a "Flash Optimization Plan" in HTML format:
        1. **SEO Keyword Injection:** Suggest 5 high-impact keywords missing from the profile based on trends.
        2. **Next Viral Post Idea:** A specific post concept (Image idea + Caption) to boost engagement this week.
        3. **Reputation Move:** One specific action to improve the average rating.
        
        Keep it concise, data-driven, and ready to execute.
    `;
    return getComplexResponse(prompt);
}

export async function optimizeBusinessDescription(currentDesc: string, keywords: string[]): Promise<string> {
    const prompt = `
        Rewrite the following Gym Google Business description to be SEO-optimized.
        Integrate these high-value keywords naturally: ${keywords.join(', ')}.
        
        Current Description: "${currentDesc}"
        
        Return ONLY the new description text. Make it punchy and conversion-focused.
    `;
    return getComplexResponse(prompt);
}

export async function analyzeCompetitorGap(myLocation: string): Promise<string> {
    const prompt = `
        Simulate a market analysis for a gym located in "${myLocation}".
        Identify 3 common complaints people have about *other* gyms in this region (e.g., hygiene, overcrowding, hidden fees).
        Provide a strategy on how "Royal The Gym" can capitalize on these weaknesses in our Google Business Profile.
        Format as HTML bullet points.
    `;
    return getComplexResponse(prompt);
}

// --- EXISTING FUNCTIONS PRESERVED BELOW ---

export async function generateTextToSpeech(text: string): Promise<string> {
    const ai = getAI();
    try {
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
    } catch (error) {
        console.error("TTS Error:", error);
        return "";
    }
}

export async function generateMarketingImage(topic: string): Promise<string | null> {
    const ai = getAI();
    const prompt = `Create a high-quality, professional gym marketing image for an offer about: "${topic}". 
    The image should feature a modern gym environment, energetic atmosphere, and fit people exercising. 
    Style: Photorealistic, cinematic lighting, advertising photography. 
    Ensure it looks appealing and motivational for a fitness business.`;
    
    try {
        // Switched to gemini-2.5-flash-image (Gemini Banana) to resolve PERMISSION_DENIED errors
        // This model is generally available and efficient for this task.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: "4:3",
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
        // Fallback or just return null to handle gracefully in UI
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

    try {
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
    } catch (error) {
        console.error("Maps Error:", error);
        return { text: "Unable to fetch map data.", places: [] };
    }
}

export async function getGoogleSearchResponse(query: string): Promise<{ text: string; sources: any[] }> {
    const ai = getAI();
    try {
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
    } catch (error) {
        console.error("Search Error:", error);
        return { text: "Unable to perform search.", sources: [] };
    }
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
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch {
        return { name: exerciseName, sets: "3", reps: "10" };
    }
}

export async function getRealTimeSetAdjustment(exercise: string, lastSet: {weight: number, reps: number}, feedback: string): Promise<{ adjustment: string, recommendedWeight: number, recommendedReps: number }> {
    const prompt = `Adjust set for ${exercise}. Last: ${lastSet.weight}kg x ${lastSet.reps}. User says: ${feedback}. Return JSON: { "adjustment": "reason", "recommendedWeight": number, "recommendedReps": number }`;
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || "{}");
    } catch {
        return { adjustment: "Maintain current", recommendedWeight: lastSet.weight, recommendedReps: lastSet.reps };
    }
}

export async function analyzeReadinessAndModify(data: any): Promise<ReadinessOutput> {
    const prompt = `Analyze readiness. Data: ${JSON.stringify(data)}. Return JSON: { "score": number (0-100), "strategy": "string", "reasoning": "string", "modifications": ["string"] }`;
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || "{}");
    } catch {
        return { score: 80, strategy: "Standard", reasoning: "Default fallback", modifications: [] };
    }
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
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || "{}");
    } catch {
        return { challengeName: "50 Pushups", description: "Do 50 pushups", difficulty: "Medium", optimizationTips: [] };
    }
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
    try {
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
    } catch {
        return { feedback: "Analysis failed", status: "Idle" };
    }
}

export async function getRecoveryBasedWorkout(mood: string, energy: number, sleep: number): Promise<string> {
    return getComplexResponse(`Suggest workout. Mood: ${mood}, Energy: ${energy}%, Sleep: ${sleep}h.`);
}

export async function getAIChefRecipe(ingredients: string): Promise<string> {
    const prompt = `Create recipe with ${ingredients}. Return JSON: { "title": "string", "macros": "string", "instructions": ["string"], "shoppingList": ["string"] }`;
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return response.text || "{}";
    } catch {
        return "{}";
    }
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
    try {
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
    } catch {
        return "Could not analyze document.";
    }
}

export async function getHealthAssistantResponse(history: any[], message: string, context: any): Promise<string> {
    const ai = getAI();
    const systemPrompt = `You are a health assistant. Context: ${JSON.stringify(context)}.`;
    
    try {
        const chat = ai.chats.create({
            model: 'gemini-3-flash-preview',
            config: { systemInstruction: systemPrompt },
            history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
        });
        
        const response = await chat.sendMessage({ message });
        return response.text || "";
    } catch {
        return "I'm having trouble connecting right now.";
    }
}

export async function generateBodyTransformationAnalysis(current: any, target: any, focus: string): Promise<string> {
    return getComplexResponse(`Analyze body transformation. Current: ${JSON.stringify(current)}. Target: ${JSON.stringify(target)}. Focus: ${focus}. Return HTML report.`);
}

export async function generateGamifiedChallenge(logs: any[]): Promise<any> {
    const prompt = `Generate a gamified fitness challenge based on logs. Return JSON: { "id": "string", "title": "string", "description": "string", "xpReward": number, "difficulty": "Easy|Medium|Hard", "isCompleted": boolean }`;
    const ai = getAI();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        return JSON.parse(response.text || "{}");
    } catch {
        return {};
    }
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
