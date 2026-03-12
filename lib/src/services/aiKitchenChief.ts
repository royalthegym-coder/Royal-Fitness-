import { GoogleGenAI, Type } from '@google/genai';

// Initialize Gemini API (Using the platform-injected API key)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DietPromptPayload {
    member_id: string | number;
    stats: {
        weight: number;
        height: number;
        age: number;
        goal: string;
        tdee?: number;
    };
    allergies: string[];
    local_availability: string[];
    season: string;
}

export const generateDietPlan = async (payload: DietPromptPayload) => {
    try {
        const systemInstruction = `
Persona: You are the 'AI Kitchen Chief' of Royal The Gym. Your expertise lies in Clinical Nutrition and Traditional Indian/Rajasthani Ayurveda-based dietetics.

Goal: Generate a 7-day precision diet plan in JSON format based on the following member data.

Constraints:
1. Priority Foods: Use items from our Database Schema (Bajra in winter, Barley in summer, Moong Dal, Paneer, Sangri).
2. Location Context: The user is in Jhunjhunu, Rajasthan. Adjust spices and cooling/heating properties based on the current season.
3. Medical Safety: Strictly exclude foods listed in the user's allergy_list.
4. Macro Precision: The total calories must be within +/- 50kcal of the TDEE target.
5. Language: Provide meal names and tips in a mix of Hindi and English (Hinglish) suitable for a WhatsApp message.
`;

        const prompt = `
Generate a 7-day diet plan for the following user:
- Goal: ${payload.stats.goal}
- Weight: ${payload.stats.weight}kg, Height: ${payload.stats.height}cm, Age: ${payload.stats.age}
- Target Calories (TDEE): ${payload.stats.tdee || 'Calculate based on stats'}
- Allergies/Restrictions: ${payload.allergies.join(', ') || 'None'}
- Local Foods Available: ${payload.local_availability.join(', ')}
- Current Season: ${payload.season}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview', // Using Pro for complex clinical & ayurvedic reasoning
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                temperature: 0.4, // Lower temperature for clinical precision
                responseSchema: {
                    type: Type.ARRAY,
                    description: "A 7-day diet plan array",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING, description: "e.g., Day 1 (Monday)" },
                            meals: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        meal_name: { type: Type.STRING, description: "e.g., सुबह (7:00 AM) / नाश्ता / लंच" },
                                        time: { type: Type.STRING },
                                        ingredients: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        },
                                        nutritional_value: {
                                            type: Type.OBJECT,
                                            properties: {
                                                calories: { type: Type.NUMBER },
                                                protein: { type: Type.NUMBER },
                                                carbs: { type: Type.NUMBER },
                                                fats: { type: Type.NUMBER }
                                            }
                                        }
                                    },
                                    required: ["meal_name", "time", "ingredients", "nutritional_value"]
                                }
                            },
                            ai_tip: { type: Type.STRING, description: "A daily tip based on weather, hydration, or ayurveda." }
                        },
                        required: ["day", "meals", "ai_tip"]
                    }
                }
            }
        });

        if (response.text) {
            const dietPlanJson = JSON.parse(response.text);
            return dietPlanJson;
        }
        
        throw new Error("No response from AI Kitchen Chief");

    } catch (error) {
        console.error("AI Kitchen Chief Error:", error);
        throw error;
    }
};
