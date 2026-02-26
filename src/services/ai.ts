import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  activityLevel: string;
  goal: string;
  dietType: string;
  medicalHistory: string;
  stress: number;
  sleepHours: number;
}

export interface DietPlan {
  targetCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: {
    name: string;
    items: string[];
  }[];
  supplements: string[];
  waterGoal: number;
  expertNotes: string[];
}

export async function generateDietPlan(profile: UserProfile): Promise<DietPlan> {
  const prompt = `
Role: तुम "Royal The Gym" के 'Neural OS' के मुख्य डाइट साइंटिस्ट और AI न्यूट्रिशनिस्ट हो। तुम्हारा काम मेंबर के डेटा को 'Aether Prime' मानकों के अनुसार एनालाइज करना और 100% सटीक, साइंटिफिक डाइट प्लान तैयार करना है।

Input Data (Member Profile):
Name/Age/Gender: ${profile.name}, ${profile.age}, ${profile.gender}
Weight/Height: ${profile.weight}kg, ${profile.height}cm
Activity Level: ${profile.activityLevel}
Goal: ${profile.goal}
Diet Type: ${profile.dietType}
Medical History: ${profile.medicalHistory || 'None'}
Stress & Sleep: Stress level ${profile.stress}/10, Sleep ${profile.sleepHours} hours.

Scientific Directives:
1. BMR & TDEE Calculation: सबसे पहले Mifflin-St Jeor फॉर्मूला का उपयोग करके BMR निकालें और फिर एक्टिविटी लेवल के आधार पर TDEE कैलकुलेट करें।
2. Macronutrient Split: लक्ष्य के अनुसार प्रोटीन (1.8g-2.2g/kg for muscle gain), फैट्स (20-25%), और बाकी कार्ब्स का सटीक बटवारा करें।
3. Micronutrient Optimization: विटामिन्स और मिनरल्स (Zinc, Magnesium, Vitamin D) के लिए विशिष्ट खाद्य पदार्थ जोड़ें।
4. Circadian Timing: मेंबर के सोने और जागने के समय के अनुसार मील टाइमिंग सेट करें।

Return the output strictly in the requested JSON format.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          targetCalories: { type: Type.NUMBER, description: "Target daily calories in kcal" },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER, description: "Protein in grams" },
              carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
              fats: { type: Type.NUMBER, description: "Fats in grams" },
            },
            required: ["protein", "carbs", "fats"]
          },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Meal name, e.g., Meal 1 (Pre-Workout)" },
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of food items with quantities"
                }
              },
              required: ["name", "items"]
            },
            description: "Daily meal plan"
          },
          supplements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of scientific supplements and dosages"
          },
          waterGoal: { type: Type.NUMBER, description: "Water goal in litres per day" },
          expertNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Health precautions and expert notes based on medical history"
          }
        },
        required: ["targetCalories", "macros", "meals", "supplements", "waterGoal", "expertNotes"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("Failed to generate diet plan");
  }

  return JSON.parse(text) as DietPlan;
}
