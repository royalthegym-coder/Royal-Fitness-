import { ai, cleanAndParseJSON } from "./core_ai";

export interface WorkoutModification {
    reasoning: string;
    modified_workout: {
        category: string;
        exercises: {
            name: string;
            sets: string;
            reps: string;
            notes: string;
        }[];
    }[];
}

export const suggestWorkoutModification = async (
    currentWorkout: any,
    pastLogs: any[],
    userFeedback: string,
    memberData: any,
    medicalReports?: any[]
): Promise<WorkoutModification> => {
    try {
        const prompt = `You are an elite AI Strength & Conditioning Coach (Future-Core).
        Your task is to modify the user's current workout plan based on their past performance and their current feedback.
        
        User Profile: ${JSON.stringify(memberData)}
        User Feedback / Current State: "${userFeedback}"
        Past Performance Logs (Recent): ${JSON.stringify(pastLogs.slice(0, 5))}
        Current Planned Workout: ${JSON.stringify(currentWorkout)}
        ${medicalReports && medicalReports.length > 0 ? `Medical AI Analysis: ${JSON.stringify(medicalReports.map(r => r.ocr_data))}` : ''}
        
        Analyze the feedback (e.g., pain, fatigue, feeling strong), past performance, and any medical analysis provided.
        Suggest a modified workout plan. If they have pain or medical conditions, swap exercises to be safe. If they are fatigued, reduce volume/intensity. If they are progressing well, apply progressive overload.
        
        Return a JSON object with the following structure:
        {
            "reasoning": "string (Explain why you made these changes based on feedback and past logs)",
            "modified_workout": [
                {
                    "category": "string (e.g., 'Warmup', 'Main Lifts', 'Accessories')",
                    "exercises": [
                        {
                            "name": "string",
                            "sets": "string (e.g., '3')",
                            "reps": "string (e.g., '10-12')",
                            "notes": "string (Specific instructions like 'Slow eccentric' or 'Avoid deep flexion')"
                        }
                    ]
                }
            ]
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const result = cleanAndParseJSON(response.text || "{}");
        
        return {
            reasoning: result.reasoning || "Workout adjusted based on general AI heuristics.",
            modified_workout: result.modified_workout || []
        };
    } catch (e) {
        console.error("Workout Modification Error:", e);
        return {
            reasoning: "Failed to generate modification. Please proceed with caution or rest.",
            modified_workout: []
        };
    }
};

export const analyzeAndAdjustFuturePlans = async (
    pastLogs: any[],
    memberData: any,
    medicalReports?: any[]
): Promise<WorkoutModification> => {
    try {
        const prompt = `You are an elite AI Strength & Conditioning Coach (Future-Core).
        Your task is to analyze the user's past performance logs and automatically adjust their future workout plan (intensity, volume, or exercise selection).
        
        User Profile: ${JSON.stringify(memberData)}
        Past Performance Logs: ${JSON.stringify(pastLogs.slice(0, 10))}
        ${medicalReports && medicalReports.length > 0 ? `Medical AI Analysis: ${JSON.stringify(medicalReports.map(r => r.ocr_data))}` : ''}
        
        Analyze the past performance (e.g., stalled progress, consistent gains, skipped exercises) and any medical analysis provided.
        Suggest a new, optimized workout plan. Apply progressive overload if they are progressing well. If they are stalling, adjust volume/intensity or swap exercises. Consider medical conditions when selecting exercises.
        
        Return a JSON object with the following structure:
        {
            "reasoning": "string (Explain why you made these changes based on past logs)",
            "modified_workout": [
                {
                    "category": "string (e.g., 'Warmup', 'Main Lifts', 'Accessories')",
                    "exercises": [
                        {
                            "name": "string",
                            "sets": "string (e.g., '3')",
                            "reps": "string (e.g., '10-12')",
                            "notes": "string (Specific instructions like 'Slow eccentric' or 'Avoid deep flexion')"
                        }
                    ]
                }
            ]
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const result = cleanAndParseJSON(response.text || "{}");
        
        return {
            reasoning: result.reasoning || "Workout adjusted based on general AI heuristics.",
            modified_workout: result.modified_workout || []
        };
    } catch (e) {
        console.error("Future Plan Adjustment Error:", e);
        return {
            reasoning: "Failed to generate future plan adjustment.",
            modified_workout: []
        };
    }
};
