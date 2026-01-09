
// FIX: Import Modality for use in speech generation config.
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { Member, MemberFitnessData, Package, WorkoutLog, HealthData, WorkoutExercise } from "../types";
import { GYM_INFO, INITIAL_PACKAGES } from "../constants";

// FIX: Update function to accept an optional systemInstruction for contextual chat responses.
export async function getGeminiChatResponse(history: { role: 'user' | 'model'; text: string }[], newMessage: string, systemInstruction?: string): Promise<string> {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  try {
    const chat = ai.chats.create({ 
        model: 'gemini-3-pro-preview',
        history: history.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        })),
        // Add system instruction to the config if provided
        config: systemInstruction ? { systemInstruction } : undefined,
    });
    const result: GenerateContentResponse = await chat.sendMessage({ message: newMessage });
    // FIX: Ensure a string is always returned, even if response.text is undefined.
    return result.text ?? "Sorry, I could not generate a response.";
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
                // FIX: Use Modality.AUDIO enum instead of a raw string for responseModalities.
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return audioData ?? null;
    } catch (error) {
        console.error("TTS generation failed:", error);
        throw error;
    }
}

export async function getFastResponse(prompt: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-lite-latest',
            contents: prompt,
        });
        return response.text ?? "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Fast response generation failed:", error);
        throw error;
    }
}

export async function getComplexResponse(prompt: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 }
            }
        });
        return response.text ?? "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Complex response generation failed:", error);
        throw error;
    }
}

export async function getGoogleSearchResponse(prompt: string): Promise<{ text: string; sources: any[] }> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });
        const text = response.text ?? "Sorry, I couldn't generate a response.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        return { text, sources };
    } catch (error) {
        console.error("Google Search grounded response failed:", error);
        throw error;
    }
}

export async function getGoogleMapsResponse(prompt: string, lat: number, lng: number): Promise<{ text: string; places: any[] }> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude: lat,
                            longitude: lng
                        }
                    }
                }
            },
        });

        const text = response.text ?? "Sorry, I couldn't find any places.";
        const places = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        return { text, places };
    } catch (error) {
        console.error("Google Maps grounded response failed:", error);
        throw error;
    }
}

export async function getNutritionAnalysisFromImage(base64ImageData: string, mimeType: string): Promise<string> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
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
                You are an expert AI Nutritionist using advanced computer vision to analyze food.
                Analyze the provided food image.
                
                Return the response strictly in valid JSON format with the following structure:
                {
                    "foodName": "string",
                    "calories": number,
                    "macros": {
                        "protein": "string (e.g. 20g)",
                        "carbs": "string (e.g. 45g)",
                        "fats": "string (e.g. 10g)"
                    },
                    "micros": ["string", "string"], // List of key vitamins/minerals
                    "healthScore": number, // 1 to 10 where 10 is healthiest
                    "analysis": "string" // A concise, friendly paragraph explaining the health benefits and potential drawbacks.
                }
                
                If the image is not food, return a JSON with "foodName": "Unknown" and "analysis": "This does not appear to be food.".
            `,
        };

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: 'application/json',
            }
        });

        return response.text ?? "{}";
    } catch (error) {
        console.error("Image nutrition analysis failed:", error);
        throw error;
    }
}

export async function getHealthEngineAnalysis(member: Member, fitnessData: MemberFitnessData[number]): Promise<string> {
    const prompt = `
        Act as an elite sports scientist and AI health analyst for a gym named "Royal The Gym".
        You are conducting a deep-dive performance review for a member. Your analysis must be thorough, data-driven, and encouraging.

        **Member Data:**
        - Name: ${member.name}
        - Join Date: ${member.joinDate}
        - All Body Metrics (Weight in kg, Body Fat in %):
        ${JSON.stringify(fitnessData.metrics, null, 2)}
        - Full Workout Performance History (Weight in kg):
        ${JSON.stringify(fitnessData.logs, null, 2)}

        **Your Task:**
        Generate a comprehensive, multi-section analysis in well-formatted markdown.

        **1. Overall Performance Analysis:**
           - Analyze their body composition trends (weight vs. body fat). Are they successfully recomposing, bulking, or cutting?
           - Analyze their strength progression based on the workout performance logs. Look at key lifts like 'Bench Press' or 'Squats' and comment on the increase in weight over time.
           - Summarize their achievements and areas of consistent improvement.

        **2. Potential Risk Factors & Plateaus:**
           - **(Important: Frame this as helpful advice, not a medical diagnosis)**.
           - Based on the data, identify any potential risks. For example, is weight increasing much faster than strength (potential fat gain)? Is strength stalling (plateau)?
           - Are there any signs of potential overtraining or undertraining based on workout frequency and performance?
           
        **3. Advanced Nutritional Strategy:**
           - Based on their progress and goals (inferred from data), provide advanced nutritional advice.
           - Suggest specific adjustments to macronutrients (protein, carbs, fat) to accelerate their progress.
           - Provide 2-3 sample meal ideas that would align with this strategy.

        **4. Future Recommendations & Outlook:**
           - What should be the primary focus for the next 4-6 weeks of training? (e.g., focus on volume, increase intensity, introduce new exercises).
           - Provide a concluding motivational statement to encourage the member.
    `;
    
    return getComplexResponse(prompt);
}


export async function getAICoachSuggestion(
    member: Member, 
    fitnessData: MemberFitnessData[number],
    trends?: { volumeTrend?: string; strengthTrend?: string; recentConsistency?: string }
): Promise<string> {
    const lastWorkout = fitnessData.logs[fitnessData.logs.length - 1];
    const lastMetrics = fitnessData.metrics[fitnessData.metrics.length - 1];

    const prompt = `
        Act as a world-class AI personal trainer and nutritionist for "Royal The Gym". You are providing hyper-personalized advice to a member based on their complete fitness history.

        **MEMBER PROFILE:**
        - **Name:** ${member.name}
        - **Member Since:** ${member.joinDate}
        - **Latest Recorded Weight:** ${lastMetrics?.weight ? `${lastMetrics.weight} kg` : 'N/A'}
        - **Latest Recorded Body Fat:** ${lastMetrics?.bodyFat ? `${lastMetrics.bodyFat}%` : 'N/A'}

        **FITNESS TRENDS (Calculated):**
        - **Volume Load Trend:** ${trends?.volumeTrend || 'N/A'}
        - **Strength Trend:** ${trends?.strengthTrend || 'N/A'}
        - **Recent Consistency:** ${trends?.recentConsistency || 'N/A'}

        **FITNESS HISTORY:**
        - **Body Metrics History:** ${JSON.stringify(fitnessData.metrics, null, 2)}
        - **Workout Log History:** ${JSON.stringify(fitnessData.logs, null, 2)}

        **YOUR TASK:**
        Based on a deep analysis of the provided data and trends, generate a concise, actionable, and motivational coaching session for ${member.name}. The response must be in well-formatted markdown and contain EXACTLY these two sections:

        ### Next Session Recommendation
        1.  **Progress Analysis:** Briefly analyze their ${trends?.strengthTrend === 'Improving' ? 'excellent' : 'current'} progress. Reference their volume or strength trends specifically.
        2.  **Suggested Workout Focus:** Recommend the *primary focus* for their very next workout (e.g., "Push for a PR on Bench Press", "Deload day", "Focus on technique").
        3.  **Key Exercises:** Suggest 2-3 specific exercises they should prioritize next time, including suggested sets/reps based on progressive overload principles.

        ### Personalized Nutrition Tip
        1.  **Metric-Based Advice:** Provide a nutrition tip based on their weight/body fat trend (e.g. if weight is up but strength is down, suggest checking surplus).
        2.  **Actionable Tip:** One concrete meal or habit to implement today.

        Be encouraging, professional, and data-driven.
    `;

    return getComplexResponse(prompt);
}

// NEW FUNCTION: Generate a "Next Day Challenge"
export async function generateNextWorkoutChallenge(fitnessHistory: MemberFitnessData[number]): Promise<{
    challengeName: string;
    description: string;
    targetMuscle: string;
    difficulty: 'Medium' | 'Hard' | 'Extreme';
    optimizationTips: string[];
}> {
    const lastLog = fitnessHistory.logs[fitnessHistory.logs.length - 1];
    
    const prompt = `
        Based on the user's last workout (${lastLog?.templateName || 'General Fitness'}), create a "Gamified Workout Challenge" for their NEXT session.
        
        Last Workout Summary: ${JSON.stringify(lastLog || {})}
        
        The goal is to provide a specific, intense challenge to push their performance.
        Return strictly valid JSON:
        {
            "challengeName": "Catchy Title (e.g. The 100-Rep Finisher)",
            "description": "Brief description of the challenge.",
            "targetMuscle": "Primary muscle group targeted",
            "difficulty": "Medium" | "Hard" | "Extreme",
            "optimizationTips": ["Tip 1 for performance", "Tip 2 for recovery", "Tip 3 for technique"]
        }
    `;

    const response = await getFastResponse(prompt);
    try {
        return JSON.parse(response.replace(/```json|```/g, '').trim());
    } catch(e) {
        return {
            challengeName: "The Consistency Challenge",
            description: "Simply show up and complete your planned workout with perfect form.",
            targetMuscle: "Full Body",
            difficulty: "Medium",
            optimizationTips: ["Hydrate well", "Sleep 8 hours", "Visualize your sets"]
        };
    }
}

// NEW: specific function for post-workout analysis
export async function getPostWorkoutAnalysis(
    member: Member,
    completedLog: WorkoutLog,
    fitnessHistory: MemberFitnessData[number]
): Promise<string> {
    const prompt = `
        Act as an enthusiastic and analytical AI Personal Trainer at "Royal The Gym".
        ${member.name} just finished a workout. Analyze it and plan the next steps.

        **JUST COMPLETED WORKOUT:**
        - Template: ${completedLog.templateName}
        - Performance: ${JSON.stringify(completedLog.performance)}

        **PAST HISTORY (Last 3 logs):**
        ${JSON.stringify(fitnessHistory.logs.slice(-3))}

        **YOUR TASK:**
        Provide a "Post-Workout Report Card" in Markdown.
        
        1. **🔥 Session Highlights:** 
           - Identify any Personal Records (PRs) in weight or reps compared to history.
           - If volume increased, mention it.
           - If they were consistent with the plan, praise that.
        
        2. **🔮 Next Session Blueprint:**
           - Based on TODAY'S performance, exactly what should they aim for next time they do this workout?
           - Be specific: "Next time, try 65kg for 3 sets on Bench Press" or "Keep weight same, improve form".
           
        Keep it brief, high-energy, and super specific to the numbers provided.
    `;
    return getComplexResponse(prompt);
}

// NEW FUNCTION: Generate Progressive Overload Plan
export async function generateNextSessionPlan(memberHistory: MemberFitnessData[number]): Promise<string> {
    const lastWorkout = memberHistory.logs[memberHistory.logs.length - 1];
    
    if (!lastWorkout) {
        return "No previous workout found. Please log your first session to get personalized progressions.";
    }

    const prompt = `
        Act as a "Progressive Overload Architect". Look at the user's LAST workout and design the IMMEDIATE NEXT session for maximum gains.

        **LAST WORKOUT:**
        - Name: ${lastWorkout.templateName}
        - Exercises Performed: 
        ${JSON.stringify(lastWorkout.performance)}

        **YOUR TASK:**
        Create the "Next Session Plan" in Markdown.
        For EACH exercise performed last time:
        1.  List the exercise name.
        2.  **Define the Target:** Specifically state the target weight and reps for the next session.
            - *Rule:* If they did high reps (12+), increase weight by approx 2.5kg - 5kg and drop reps slightly.
            - *Rule:* If they did low reps (<8), try to add 1-2 reps with same weight.
        3.  **Rationale:** briefly explain why (e.g. "Linear progression", "Volume accumulation").

        Output Format:
        ### Plan for [Next Date]: [Template Name]
        
        | Exercise | Last Session | **Target for Next** | Strategy |
        | :--- | :--- | :--- | :--- |
        | Bench Press | 60kg x 10 | **62.5kg x 8-10** | Increase load |
        
        ... and so on.
    `;

    return getComplexResponse(prompt);
}

export async function getSmartWarmup(workoutName: string, recentInjuries?: string): Promise<string> {
    const prompt = `
        Design a quick, effective 5-minute dynamic warmup for a workout titled: "${workoutName}".
        ${recentInjuries ? `Note: User has reported issues with: ${recentInjuries}. Adjust accordingly.` : ''}
        
        Return a concise bulleted list of 3-4 dynamic movements with rep counts.
    `;
    return getFastResponse(prompt);
}

interface WorkoutGenerationOptions {
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    goal: 'Muscle Gain' | 'Fat Loss' | 'Strength' | 'General Fitness';
    structure: 'Full Body' | 'Push/Pull/Legs' | 'Upper/Lower Split';
    daysPerWeek: number;
    notes: string;
    memberHistory?: MemberFitnessData[number]; // Add history for personalization
}

export async function generateAIWorkoutTemplate(options: WorkoutGenerationOptions): Promise<string> {
    const { name, level, goal, structure, daysPerWeek, notes, memberHistory } = options;

    let historyContext = "";
    if (memberHistory) {
        historyContext = `
        **MEMBER HISTORY CONTEXT (Use this to optimize load):**
        - Last 3 Workouts: ${JSON.stringify(memberHistory.logs.slice(-3))}
        - NOTE: If they lifted 60kg on Bench Press recently, suggest a progressive overload (e.g. 62.5kg) in the notes.
        `;
    }

    const prompt = `
        Act as a certified Master Strength and Conditioning Coach designing a workout plan for a client at "Royal The Gym".

        **Workout Plan Requirements:**
        - **Plan Name:** ${name}
        - **Fitness Level:** ${level}
        - **Primary Goal:** ${goal}
        - **Structure:** ${structure} split
        - **Frequency:** ${daysPerWeek} days per week.
        ${historyContext}

        **Instructions:**
        1. Create a detailed and logical workout plan based on the requirements.
        2. The plan should span one full week, showing which days are for workouts and which are for rest.
        3. For each workout day, list 5-7 exercises. For each exercise, specify the number of sets and the rep range (e.g., 3 sets of 8-12 reps).
        4. Include a brief (1-2 sentence) note on form, intensity, or purpose for at least two exercises per workout day.
        5. If any special notes are provided, incorporate them into the plan. Special Notes: "${notes || 'None'}".
        6. The entire response MUST be formatted using clean Markdown. Use headings for days (e.g., ### Day 1: Push) and bullet points for exercises.

        Example for one exercise:
        - **Bench Press:** 4 sets of 8-12 reps.
          *Note: Keep your shoulder blades retracted and focus on a controlled descent.*

        Generate the complete one-week plan now.
    `;

    return getComplexResponse(prompt);
}

export async function modifyExerciseWithAI(currentExercise: string, modificationType: 'easier' | 'harder' | 'swap'): Promise<{name: string, sets: string, reps: string}> {
    const prompt = `
        Exercise: "${currentExercise}"
        Action: "${modificationType}"
        
        If action is 'swap', replace the exercise with a different one that targets similar muscles.
        If action is 'harder', keep the exercise (or a slightly advanced variation) but increase difficulty (sets/reps or description).
        If action is 'easier', provide a regression or easier alternative.

        Return ONLY a JSON object: { "name": "Exercise Name", "sets": "3", "reps": "10" }.
    `;
    const response = await getFastResponse(prompt);
    try {
        const jsonStr = response.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch(e) {
        return { name: currentExercise, sets: '3', reps: '10' };
    }
}

// NEW FUNCTION: Smart Adjust during workout
export async function getRealTimeSetAdjustment(
    exerciseName: string, 
    lastSet: { weight: number, reps: number }, 
    difficulty: 'Too Easy' | 'Perfect' | 'Too Hard'
): Promise<{ adjustment: string, recommendedWeight: number, recommendedReps: number }> {
    const prompt = `
        Act as a realtime AI Spotter.
        Member just performed **${exerciseName}**.
        Performance: **${lastSet.weight}kg x ${lastSet.reps} reps**.
        Feedback: It felt "**${difficulty}**".

        Based on this, what should they do for the IMMEDIATE NEXT SET?
        
        Rules:
        - If Too Easy: Increase weight (approx 2.5kg - 5kg) or reps.
        - If Perfect: Maintain or micro-load.
        - If Too Hard: Decrease weight or reps.

        Return ONLY a JSON object: 
        { 
            "adjustment": "Short motivating text why (max 10 words)", 
            "recommendedWeight": number, 
            "recommendedReps": number 
        }
    `;
    
    try {
        const response = await getFastResponse(prompt);
        const jsonStr = response.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        return { adjustment: "Maintain effort", recommendedWeight: lastSet.weight, recommendedReps: lastSet.reps };
    }
}

export async function getGeniusModeAnalysis(member: Member, fitnessData: MemberFitnessData[number]): Promise<string> {
    const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
    
    const prompt = `
        Act as "Genius Mode," an elite AI sports scientist for "Royal The Gym".
        Your first task is to conduct a deep-dive performance analysis of a member. This analysis will serve as the foundational context for generating a new plan in a subsequent step.

        **Member Data:**
        - Name: ${member.name}
        - Join Date: ${member.joinDate}
        - Current Package/Goal: ${pkg?.name || 'N/A'} (${pkg?.category || 'N/A'})
        - Full Body Metrics History (Weight in kg, Body Fat in %):
        ${JSON.stringify(fitnessData.metrics, null, 2)}
        - Full Workout Performance History (Weight in kg):
        ${JSON.stringify(fitnessData.logs, null, 2)}

        **Your Task:**
        Generate a concise, data-driven analysis in well-formatted markdown. Focus on clear, quantifiable insights.

        **1. Performance Summary:**
           - Analyze body composition trends. Is weight increasing/decreasing appropriately relative to body fat?
           - Analyze strength progression on key lifts (e.g., 'Bench Press', 'Squats', 'Deadlifts'). Is there consistent progressive overload?
           - Comment on workout frequency and consistency based on the log dates.

        **2. Key Findings & Opportunities:**
           - Identify the member's biggest strength or area of most improvement.
           - Identify the most significant weakness or a clear performance plateau. Be specific (e.g., "Bench press has stalled at 80kg for the last 3 sessions.").
           - State a single, primary objective that the next training block should focus on to maximize progress. (e.g., "Primary Objective: Break the squat plateau and increase lower body volume.")

        This analysis should be direct and serve as a perfect handover to a coach who will write the next plan.
    `;
    
    return getComplexResponse(prompt);
}

export async function getGeniusModePlan(analysis: string, member: Member): Promise<string> {
    const prompt = `
        Act as "Genius Mode," an elite AI Fitness and Nutrition coach for "${GYM_INFO.name}".
        Your second task is to create a hyper-personalized 4-week workout and nutrition plan based on a prior performance analysis.

        **FOUNDATIONAL ANALYSIS (This is the most important context):**
        ---
        ${analysis}
        ---

        **Member Name:** ${member.name}

        **Your Task:**
        Generate a complete plan that directly addresses the findings in the analysis. The response MUST be structured with the exact headers below for automatic parsing.

        ### 4-Week Workout Plan ###
        - Create a detailed, week-by-week, day-by-day workout schedule for the next 4 weeks.
        - **Crucially, this plan must be specifically designed to tackle the "Primary Objective" identified in the analysis.** For example, if a plateau was identified, introduce new exercises, volume, or intensity techniques to break it.
        - Specify exercises, sets, reps, and rest periods.
        - Format clearly using markdown (e.g., **Week 1**, *Day 1: Push*, etc.).

        ### Nutrition Plan ###
        - Create a comprehensive diet plan that aligns with the new 4-week workout plan and the member's goal.
        - Provide a daily structure (e.g., Breakfast, Lunch, Dinner, Snacks).
        - Include both vegetarian and non-vegetarian options relevant to an Indian diet.
        - Estimate daily calorie and macronutrient targets (Protein, Carbs, Fat) that support the objective from the analysis.
        - Offer 3-5 general nutrition tips for success.

        Your response must be structured with these exact two '###' headers.
    `;
    return getComplexResponse(prompt);
}

// --- NEW FUTURISTIC AI FUNCTIONS ---

export async function analyzeExerciseForm(imageBase64: string): Promise<{feedback: string; status: 'Good' | 'Correction Needed'}> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY environment variable not set");
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

export async function getRecoveryBasedWorkout(mood: string, energy: number, sleep: number): Promise<string> {
    const prompt = `
        User Status:
        - Mood: ${mood}
        - Energy Level: ${energy}/100
        - Sleep: ${sleep} hours

        Based on this, generate a "Smart Recovery" workout plan for today. 
        If energy is low (<40) or sleep is low (<6), suggest Yoga, Stretching, or LISS Cardio.
        If energy is high, suggest a standard or intense workout.
        Format as a concise list of exercises.
    `;
    return getFastResponse(prompt);
}

export async function getAIChefRecipe(ingredients: string): Promise<string> {
    const prompt = `
        I have these ingredients in my fridge: ${ingredients}.
        Generate a healthy, high-protein recipe using these.
        Return in JSON format:
        {
            "title": "Recipe Name",
            "macros": "Protein: Xg, Carbs: Yg, Fat: Zg",
            "instructions": ["Step 1...", "Step 2..."],
            "shoppingList": ["Item 1", "Item 2"] (Items needed but missing, if any)
        }
    `;
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY environment variable not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    return response.text || "{}";
}

export async function generateFutureSelfImage(currentDesc: string, goalDesc: string): Promise<string | null> {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY environment variable not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Use gemini-3-pro-image-preview for high quality generation
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image', // Fallback to flash-image for reliability in this demo context or 'gemini-3-pro-image-preview' if permitted
            contents: {
                parts: [{ text: `A hyper-realistic fitness transformation photo of a person. Start: ${currentDesc}. Goal after 3 months: ${goalDesc}. Show them looking fit, confident, in a gym setting with cinematic lighting.` }]
            }
        });
        
        // Iterate to find image part
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("Image generation failed", e);
        return null;
    }
}

// --- NEW "Royal Health Intelligence" Functions (ChatGPT Health Equivalent) ---

export async function analyzeMedicalRecord(base64Image: string): Promise<string> {
    const prompt = `
        You are "Royal Health AI", a specialized medical assistant for a gym. 
        Analyze the provided image of a medical report (e.g., blood test, lab results).
        
        1. Identify key biomarkers (e.g., Vitamin D, Hemoglobin, Testosterone, Cholesterol).
        2. Compare them to standard reference ranges.
        3. Explain in simple, non-medical terms how these levels might affect their fitness and energy.
        4. Provide 3 nutritional or lifestyle suggestions based on these results.
        
        **DISCLAIMER:** Start your response with "This is an AI analysis and not a medical diagnosis. Please consult a doctor."
    `;
    
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API_KEY not set");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', 
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                    { text: prompt }
                ]
            }
        });
        return response.text ?? "Could not analyze the document.";
    } catch (e) {
        console.error("Medical analysis failed", e);
        throw e;
    }
}

export async function getHealthAssistantResponse(
    history: { role: 'user' | 'model'; text: string }[], 
    newMessage: string, 
    healthContext: { metrics: any[], vitals: HealthData, logs: any[] }
): Promise<string> {
    
    const systemInstruction = `
        You are "Royal Health Intelligence", a secure, private health assistant within the Royal The Gym app.
        
        **USER CONTEXT (Secure Sandbox Data):**
        - Recent Vitals: Heart Rate Avg ${healthContext.vitals.heartRate.avg} bpm, Sleep ${healthContext.vitals.sleep.totalHours} hrs.
        - Recent Body Metrics: ${JSON.stringify(healthContext.metrics.slice(-1))}
        - Recent Workouts: ${JSON.stringify(healthContext.logs.slice(-2))}
        
        **YOUR ROLE:**
        - Provide hyper-personalized health insights based on the data above.
        - Help interpret lab trends if asked (users may upload data in other steps).
        - Prepare summaries for doctor visits.
        - Answer questions about nutrition, sleep, and recovery tailored to their specific vitals.
        
        **SAFETY GUARDRAILS:**
        - You are NOT a doctor. Do not diagnose conditions or prescribe medication.
        - If a user reports severe symptoms (chest pain, shortness of breath), tell them to seek emergency care immediately.
        - Keep the tone professional, empathetic, and evidence-based.
    `;

    return getGeminiChatResponse(history, newMessage, systemInstruction);
}

export interface ReadinessInputs {
    mood: string;
    sleepHours: number;
    sleepQuality: 'Good' | 'Average' | 'Poor';
    soreness: 'Low' | 'Medium' | 'High';
    restingHeartRate?: number;
    plannedWorkoutName: string;
}

export interface ReadinessOutput {
    score: number;
    status: string; // e.g. "Optimal", "Good", "Caution", "Rest Advised"
    strategy: string; // e.g. "Push Hard", "Maintenance", "Active Recovery"
    modifications: string[]; // e.g. ["Reduce volume by 20%", "Swap heavy squats for leg press"]
    reasoning: string;
}

export async function analyzeReadinessAndModify(inputs: ReadinessInputs): Promise<ReadinessOutput> {
    const prompt = `
        Act as an elite sports scientist and psychologist. You are analyzing a gym member's "Daily Readiness" to modify their planned workout today.

        **INPUTS:**
        - **Planned Workout:** ${inputs.plannedWorkoutName}
        - **Mood/Sentiment (User Text):** "${inputs.mood}"
        - **Sleep:** ${inputs.sleepHours} hours (${inputs.sleepQuality} quality)
        - **Muscle Soreness:** ${inputs.soreness}
        - **Resting Heart Rate:** ${inputs.restingHeartRate ? `${inputs.restingHeartRate} bpm` : 'Not Measured'}

        **TASK:**
        1. Perform sentiment analysis on the mood text.
        2. Combine physical (sleep, soreness, HR) and psychological (mood) factors to calculate a readiness score (0-100).
        3. Suggest a workout strategy and specific modifications to the planned workout.

        **RETURN JSON ONLY:**
        {
            "score": number, // 0-100
            "status": "string", // One of: "Optimal", "Good", "Caution", "Rest Advised"
            "strategy": "string", // Short phrase, e.g. "Full Send", "Volume Reduction", "Technique Focus"
            "modifications": ["string", "string"], // List of specific changes e.g. "Drop sets on bench press", "Skip deadlifts"
            "reasoning": "string" // Brief explanation of why (max 20 words)
        }
    `;

    const response = await getFastResponse(prompt);
    try {
        const jsonStr = response.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error("Failed to parse readiness JSON", e);
        return {
            score: 50,
            status: "Error",
            strategy: "Standard",
            modifications: ["Proceed with caution"],
            reasoning: "Could not analyze data."
        };
    }
}
