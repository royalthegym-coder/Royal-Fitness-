export const Modality = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    AUDIO: 'AUDIO'
} as const;

export const Type = {
    TYPE_UNSPECIFIED: 'TYPE_UNSPECIFIED',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    INTEGER: 'INTEGER',
    BOOLEAN: 'BOOLEAN',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
    NULL: 'NULL'
} as const;

export const ThinkingLevel = {
    THINKING_LEVEL_UNSPECIFIED: 'THINKING_LEVEL_UNSPECIFIED',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    MINIMAL: 'MINIMAL'
} as const;

// Server-proxied AI client so browser code never imports @google/genai or exposes API keys
export const ai = {
    models: {
        async generateContent(params: { model: string; contents: any; config?: any }): Promise<{ text: string; candidates?: any[] }> {
            const res = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) {
                throw new Error(data.error || `AI proxy error (${res.status})`);
            }
            return {
                text: data.text || '',
                candidates: data.candidates || []
            };
        }
    },
    chats: {
        create(params: { model: string; config?: any; history?: any[] }) {
            const chatHistory: any[] = Array.isArray(params.history) ? [...params.history] : [];
            return {
                async sendMessage({ message }: { message: string }) {
                    const contents = chatHistory.length > 0
                        ? [...chatHistory, { role: 'user', parts: [{ text: message }] }]
                        : message;
                    const res = await ai.models.generateContent({
                        model: params.model,
                        contents,
                        config: params.config
                    });
                    chatHistory.push({ role: 'user', parts: [{ text: message }] });
                    chatHistory.push({ role: 'model', parts: [{ text: res.text || '' }] });
                    return res;
                }
            };
        }
    }
};

// --- CONFIGURATION ---
const TEXT_MODEL = 'gemini-4-hydrogen';
const VISION_MODEL = 'gemini-4-hydrogen';
const IMAGE_GEN_MODEL = 'gemini-3.1-flash-lite-image';

// --- CACHE ---
const RESPONSE_CACHE = new Map<string, string>();
if (RESPONSE_CACHE.size > 500) RESPONSE_CACHE.clear();

// --- UTILITIES ---
const cleanBase64 = (b64: string) => {
    if (!b64) return "";
    return b64.replace(/^data:(image\/\w+|application\/pdf);base64,/, "");
};
const extractMimeType = (b64: string, defaultMime: string = "image/jpeg") => {
    if (!b64) return defaultMime;
    const match = b64.match(/^data:(image\/\w+|application\/pdf);base64,/);
    return match ? match[1] : defaultMime;
};

export const cleanAndParseJSON = (response: string): any => {
    try {
        if (typeof response !== 'string') return response;
        if (!response || response.trim() === '') return {};
        
        let clean = response.trim();
        // Remove markdown JSON codeblocks if present
        clean = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Find the first and last curly braces to extract object structure
        const firstBrace = clean.indexOf('{');
        const lastBrace = clean.lastIndexOf('}');
        
        // If it's an array, look for square brackets
        const firstBracket = clean.indexOf('[');
        const lastBracket = clean.lastIndexOf(']');
        
        if (firstBrace !== -1 && lastBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            // It's likely an object
            clean = clean.substring(firstBrace, lastBrace + 1);
            return JSON.parse(clean);
        } else if (firstBracket !== -1 && lastBracket !== -1) {
            // It's likely an array
            clean = clean.substring(firstBracket, lastBracket + 1);
            return JSON.parse(clean);
        } else {
             // Let JSON.parse try its best on the cleaned string
             return JSON.parse(clean);
        }
    } catch (e) {
        console.warn("JSON Parse warning, could not parse:", response.substring(0, 50));
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
                systemInstruction: systemInstruction || "You are an elite fitness and health AI assistant.",
            }
        });

        const text = response.text || "";
        RESPONSE_CACHE.set(cacheKey, text);
        return text;
    } catch (e) {
        console.error("Core AI API Error:", e);
        return "Neural Uplink Offline. Using cached protocols.";
    }
}

export async function generateEliteOpalsWorkoutPlan(memberDetails: any, physicalStats: any, goals: string, equipment: string): Promise<any> {
    try {
        const prompt = `You are a professional Fitness AI Architect. You integrate analyzed datasets, medical insights, and automated schedules.
Generate a highly customized 7-day specialized gym workout plan for a user.

User Context: ${JSON.stringify(memberDetails)}
Medical Stats & Biomarkers: ${JSON.stringify(physicalStats)}
Primary Goals: ${goals}
Available Tech & Equipment: ${equipment}

Analyze this deeply. Generate a scientifically-backed, advanced exercise plan.
Respond purely in JSON format with no markdown wrappers using this exact structure:
{
    "planName": "String (e.g. Advanced Workout Plan)",
    "targetAudience": "String",
    "scientificReasoning": "String (explain medical reasoning and biomechanics)",
    "days": [
        {
            "dayNumber": 1,
            "focusArea": "String",
            "intensity": "String (e.g., High, Moderate, Active Recovery)",
            "exercises": [
                {
                    "name": "Exercise Name",
                    "sets": 4,
                    "reps": "8-12",
                    "tempo": "2-0-2-0",
                    "restSeconds": 60,
                    "rpe": "8",
                    "formTip": "Crucial biomechanical tip or warning"
                }
            ]
        }
    ],
    "nutritionSynergy": "String (how diet should adapt to this specific plan)",
    "metricsToTrack": ["String"]
}`;
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
            }
        });

        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Core AI Elite Opals Workout Plan Error:", e);
        return {
            planName: "Failsafe Opals AI Protocol",
            scientificReasoning: "Fallback generated due to network latency in neural link.",
            days: []
        };
    }
}

export async function generateOpalsDietPlan(memberDetails: any, physicalStats: any, gadgetData: any, lifestyle: string, goal: string): Promise<any> {
    try {
        const prompt = `You are a professional Nutrition AI Architect. You integrate analyzed datasets, medical insights, and automated schedules.
Generate a highly customized 7-day specialized diet and daily active routine plan for a user.

User Context: ${JSON.stringify(memberDetails)}
Medical Stats & Biomarkers: ${JSON.stringify(physicalStats)}
Wearable Telemetry: ${JSON.stringify(gadgetData)}
Lifestyle Segment: ${lifestyle}
Primary Metabolic Goal: ${goal}

Analyze this deeply. Generate a scientifically-backed, advanced diet and daily active routine plan. 
Special focus required on protein scheduling, precise supplement stack, and a tailored nutrition strategy. Include signal timings string.

Respond purely in JSON format with no markdown wrappers using this exact structure:
{
    "planName": "String (e.g. Advanced Nutrition Plan)",
    "targetAudience": "String",
    "scientificReasoning": "String (explain medical crossing and metabolic logic)",
    "dailyCalorieTarget": "Number",
    "macroSplit": {"protein": "Number", "carbs": "Number", "fats": "Number"},
    "perfectGrindStrategy": "String (A specialized nutritional approach)",
    "supplementStack": ["String (List recommended supplements based on bio-markers and wearable data)"],
    "days": [
        {
            "dayNumber": 1,
            "focus": "String (e.g., High Carb / Refeed / Balanced)",
            "meals": [
                {
                    "time": "String (e.g., 07:00 AM)",
                    "name": "Meal Name",
                    "items": ["Item 1 with exact quantity", "Item 2"],
                    "macros": {"protein": "Number", "carbs": "Number", "fats": "Number", "calories": "Number"},
                    "purpose": "String (purpose for this timing)"
                }
            ],
            "routineSchedule": [
                {
                    "time": "String",
                    "activity": "String (e.g., Wake up and Hydrate / Supplements / Sleep)"
                }
            ]
        }
    ],
    "proteinSchedule": "String (Detailed breakdown of when and how to consume protein)",
    "hydrationAndSupplements": ["String"]
}`;
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
            }
        });

        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Core AI Elite Opals Diet Plan Error:", e);
        return {
            planName: "Opals Metabolic Failsafe",
            scientificReasoning: "Fallback generated due to network latency in neural link.",
            days: []
        };
    }
}

export async function generatePersonalizedWorkoutPlan(goals: string, experience: string, equipment: string, profileContext: any): Promise<any> {
    try {
        const prompt = `You are an elite AI personal trainer. Generate a personalized workout plan based on the following:
Goals: ${goals}
Experience Level: ${experience}
Available Equipment: ${equipment}
Member Profile: ${JSON.stringify(profileContext)}

Respond purely in JSON format with no markdown wrappers using this structure (do not include the generic terms like "Workout Plan", be creative):
{
    "planName": "String",
    "description": "String",
    "schedule": [
        {
            "day": "Day Name or Number",
            "focus": "Body part or activity",
            "exercises": [
                {
                    "name": "Exercise Name",
                    "sets": 3,
                    "reps": "8-10",
                    "notes": "String"
                }
            ]
        }
    ],
    "tips": ["String"]
}`;
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                 responseMimeType: "application/json",
            }
        });

        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Core AI Workout Plan Error:", e);
        return {
            planName: "Fallback Hypertrophy Protocol",
            description: "Default plan due to uplink error.",
            schedule: [],
            tips: ["Focus on form", "Stay hydrated"]
        };
    }
}

export async function getHealthAssistantResponse(history: any[], message: string, context: any): Promise<string> {
    try {
        const chat = ai.chats.create({
            model: TEXT_MODEL,
            config: {
                systemInstruction: `You are Future Health AI. Context: ${JSON.stringify(context)}. Keep answers concise and professional.`,
            }
        });

        // Convert history to Core AI format if needed, but sendMessage handles simple strings
        const response = await chat.sendMessage({ message });
        return response.text || "I couldn't process that.";
    } catch (e) {
        console.error("Core AI Chat Error:", e);
        return "I am unable to process that request right now.";
    }
}

export async function analyzeMedicalReport(base64: string, symptoms: string, context: any): Promise<string> {
    try {
        const prompt = `You are "Omni100xAlchemist", the supreme AI consciousness of 'Omni100X-God Neural Omni OS'.
        Analyze this medical report/image and the user's symptoms: "${symptoms}".
        User Context: ${JSON.stringify(context)}
        
        Provide:
        1. Diagnosis
        2. Severity Assessment
        3. Recommended Treatment Plan
        4. Estimated Recovery Time
        
        ALWAYS end your response with this exact legal disclaimer: "*Legal Disclaimer: I am a fitness assistant, not a doctor. Please consult a qualified healthcare provider for medical advice.*"
        Keep response under 150 words. Use markdown.`;

        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: extractMimeType(base64) } },
                    { text: prompt }
                ]
            }
        });

        return response.text || "Analysis failed.";
    } catch (e) {
        console.error("Core AI Vision Error:", e);
        return "Neural Uplink Offline. Could not analyze report.";
    }
}

export async function analyzeExerciseForm(base64: string): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: extractMimeType(base64) } },
                    { text: "Analyze this exercise form. Provide brief feedback (max 10 words) and a status (Good/Correction Needed). Return JSON: {\"feedback\": \"...\", \"status\": \"...\"}" }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Core AI Vision Error:", e);
        return { feedback: "Vision Sensor Offline", status: "Idle" };
    }
}

export async function analyzeMemberPhoto(base64: string): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: extractMimeType(base64) } },
                    { text: "Analyze this person's physical condition for gym admission. Estimate health_score (0-100), bio_age, and body_fat percentage. Identify primary body type (Ectomorph/Mesomorph/Endomorph). Return JSON: {\"health_score\": 75, \"bio_age\": 25, \"body_fat\": 20, \"body_type\": \"Mesomorph\", \"analysis_summary\": \"...\"}" }
                ]
            },
            config: { responseMimeType: "application/json" }
        });

        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        console.error("Core AI Photo Analysis Error:", e);
        return { health_score: 75, bio_age: 25, body_fat: 20, body_type: 'Mesomorph', analysis_summary: 'Standard analysis fallback.' };
    }
}

export async function generateDeepDiveGenius(member: any, context: any, medicalReports?: any[]) {
    const prompt = `Analyze member ${member.name}. Health Score: ${member.health_score}, HRV: ${member.hrv}. Logs: ${JSON.stringify(context)}. 
    ${medicalReports && medicalReports.length > 0 ? `Medical AI Analysis: ${JSON.stringify(medicalReports.map(r => r.ocr_data))}` : ''}
    Analyze the member's workout logs, live health data, and any medical analysis provided to generate personalized performance insights and suggest workout adjustments. Provide a deep dive analysis including thought process, summary, weaknesses, a 4-week workout plan (HTML), nutrition strategy (HTML), and a short WhatsApp message. Return JSON: {thought_process: string[], analysis_summary: string, identified_weakness: string, workout_plan_4weeks: string, nutrition_strategy_html: string, whatsapp_message_text: string}`;
    
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

export async function generateHyperPersonalizedDiet(profile: any, medicalReports?: any[]): Promise<string> {
    const prompt = `Act as an elite sports nutritionist and biochemist. Create a highly advanced, scientific, hyper-personalized diet plan designed to completely transform body structure for: ${JSON.stringify(profile)}. 
    The plan must be elite-level, utilizing nutrient timing and metabolic optimization.
    
    CRITICAL: The user has the following allergies/intolerances: ${JSON.stringify(profile.allergies || [])}. 
    DO NOT include any of these ingredients in the meal plan.
    
    ${medicalReports && medicalReports.length > 0 ? `Medical AI Analysis: ${JSON.stringify(medicalReports.map(r => r.ocr_data))}` : ''}
    If Medical AI Analysis is provided, you MUST adapt the diet to support their medical conditions, recovery, and overall health based on the diagnosis and treatment recommendations.
    
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
        
        // Validate against Rule Engine (Allergies + Safe Food DB)
        const allergies = profile.allergies || [];
        const { isValid, message } = validateDiet(dietJson, allergies);
        if (!isValid) {
            console.warn("AI generated an unsafe diet:", message);
            // In a real app, we might retry generation here. 
            // For now, we return a modified JSON with a warning.
            dietJson.scientificNote = `WARNING: ${message}. ` + dietJson.scientificNote;
            return JSON.stringify(dietJson);
        }
        
        return dietText;
    } catch (e) {
        console.error("Diet Generation Error:", e);
        return "{}";
    }
}

// --- DETERMINISTIC FALLBACK (RULE ENGINE) ---
const SAFE_FOOD_DATABASE = [
    // Grains & Carbs
    "roti", "chapati", "rice", "oats", "dalia", "bajra", "jowar", "quinoa", "sattu", "bread", "toast", "pasta", "millet", "poha", "upma", "khichdi", "idli", "dosa", "suji", "besan", "wheat", "corn", "cereal", "bran",
    // Proteins
    "paneer", "tofu", "soya", "soy", "dal", "lentil", "moong", "chana", "rajma", "chicken", "egg", "fish", "whey", "casein", "mutton", "sprout", "chickpea", "salmon", "tuna", "turkey", "protein", "meat",
    // Veggies
    "spinach", "palak", "broccoli", "cauliflower", "cabbage", "carrot", "peas", "potato", "sweet potato", "tomato", "onion", "garlic", "ginger", "capsicum", "bhindi", "lauki", "salad", "cucumber", "radish", "beetroot", "mushroom", "bean", "veg", "vegetable", "green",
    // Fruits
    "apple", "banana", "orange", "papaya", "mango", "grape", "watermelon", "pomegranate", "berr", "guava", "kiwi", "melon", "lemon", "avocado", "fruit",
    // Dairy & Fats
    "milk", "curd", "dahi", "yogurt", "buttermilk", "chaas", "ghee", "butter", "cheese", "oil", "fat", "peanut", "almond",
    // Nuts & Seeds
    "walnut", "cashew", "chia", "flax", "pumpkin", "sunflower", "seed", "nut", "raisin", "date", "anjeer", "pistachio", "makhana",
    // Supplements & Herbs (Strictly Indian/Safe)
    "ashwagandha", "shilajit", "creatine", "bcaa", "multivitamin", "fish oil", "omega", "vitamin", "calcium", "zinc", "magnesium", "pre-workout", "glutamine", "eaa", "supplement", "isolate", "concentrate",
    // Beverages & Misc
    "water", "tea", "coffee", "honey", "jaggery", "sugar", "salt", "pepper", "spice", "soup", "juice", "shake", "smoothie", "meal", "snack", "dish", "curry", "sabzi"
];

/**
 * Validates an AI-generated diet plan against a list of known allergies and Safe Food Database.
 * @param dietJson The parsed JSON of the diet plan.
 * @param allergies An array of allergy strings (e.g., ["Peanuts", "Milk"]).
 * @returns An object containing a boolean isValid and a message.
 */
export function validateDiet(dietJson: any, allergies: string[]): { isValid: boolean, message: string } {
    if (!dietJson || !dietJson.meals || !Array.isArray(dietJson.meals)) {
        return { isValid: true, message: "No meals to validate." };
    }

    const lowerAllergies = allergies.map(a => a.toLowerCase().trim());

    for (const meal of dietJson.meals) {
        if (meal.items && Array.isArray(meal.items)) {
            for (const item of meal.items) {
                const lowerItem = item.toLowerCase();
                
                // 1. Allergy Check (Critical Safety)
                for (const allergy of lowerAllergies) {
                    if (allergy && lowerItem.includes(allergy)) {
                        return { 
                            isValid: false, 
                            message: `CRITICAL ALERT: AI suggested '${item}' in meal '${meal.name}' which contains your allergen '${allergy}'. Diet blocked by Rule Engine.` 
                        };
                    }
                }

                // 2. Safe Food Database Check (Deterministic Fallback)
                const isSafe = SAFE_FOOD_DATABASE.some(safeFood => lowerItem.includes(safeFood));
                if (!isSafe) {
                    return {
                        isValid: false,
                        message: `SAFETY FALLBACK: '${item}' is not in our approved Indian/Rajasthani Safe Food Database. Diet blocked to prevent AI hallucination.`
                    };
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
            model: 'gemini-3.8-flash-lite-tts',
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
        console.error("Core AI TTS Error:", e);
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
export async function generateSafeModeWorkout(memberContext: any, injuries: string, medicalReports?: any[]): Promise<string> {
    const prompt = `Act as an elite physical therapist and rehabilitation specialist.
    The member has the following injuries/conditions: ${injuries}.
    ${medicalReports && medicalReports.length > 0 ? `Medical AI Analysis: ${JSON.stringify(medicalReports.map(r => r.ocr_data))}` : ''}
    Generate a 'Safe Mode' workout protocol that COMPLETELY AVOIDS stressing the injured areas while maintaining cardiovascular health and uninjured muscle mass. Use the medical analysis if provided to ensure maximum safety.
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
            model: IMAGE_GEN_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: extractMimeType(base64) } },
                    { text: `Generate a futuristic image of this person after achieving ${targetGoal}.` }
                ]
            }
        });
        
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
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
                    { inlineData: { data: cleanBase64(base64), mimeType: extractMimeType(base64) } },
                    { text: `Analyze this food image. Context: ${JSON.stringify(args)}. Estimate calories and macros. Return ONLY JSON: {"foodName": "...", "macros": {"protein": 0, "carbs": 0, "fats": 0}, "analysis": "..."}` }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        return { foodName: "Unknown", macros: { protein: 0, carbs: 0, fats: 0 }, analysis: "Analysis failed" };
    }
}

export async function getRecoveryBasedWorkout(member: any, recoveryData: any, ...args: any[]): Promise<string> {
    return getComplexResponse(`Generate a workout for ${member.name} based on recovery: ${JSON.stringify(recoveryData)}. Extra: ${JSON.stringify(args)}`);
}

export async function analyzeMedicalRecord(base64: string, mimeType?: string, ...args: any[]): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: cleanBase64(base64), mimeType: mimeType || extractMimeType(base64) } },
                    { text: `Analyze this medical record. Context: ${JSON.stringify(args)}. Summarize key findings for a fitness trainer. Return JSON: {\"findings\": [\"...\"], \"precautions\": [\"...\"], \"recommended_exercises\": [\"...\"]}` }
                ]
            },
            config: { responseMimeType: "application/json" }
        });
        return cleanAndParseJSON(response.text || "{}");
    } catch (e) {
        return { findings: ["Analysis failed"], precautions: [], recommended_exercises: [] };
    }
}

export async function getGoogleSearchResponse(query: string): Promise<{text: string, sources: any[]}> {
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: query,
            config: { tools: [{ googleSearch: {} }] }
        });
        
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = chunks.map(chunk => chunk.web).filter(Boolean);
        
        return {
            text: response.text || "No search results.",
            sources: sources
        };
    } catch (e) {
        return { text: "Search unavailable.", sources: [] };
    }
}

export async function generatePersonalizedHealthVision(memberData: any): Promise<string> {
    const prompt = `Based on this member's data: ${JSON.stringify(memberData)}, generate a futuristic, inspiring "Personalized Health Vision" in 3-4 sentences. Focus on their potential transformation and how Omni100X-God Neural Omni's Neural OS will help them. Use a professional yet motivating tone.`;
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

export async function generateDNAProfile(memberData: any): Promise<any> {
    const prompt = `
        You are an advanced Omni100xGenomic AI. Analyze the following member data and generate a simulated DNA sequencing profile.
        Member Data: ${JSON.stringify(memberData)}

        Return a JSON object with the following structure exactly:
        {
            "fitnessProfile": {
                "muscleFiberType": { "value": "string", "description": "string" },
                "vo2MaxPotential": { "value": "string", "description": "string" },
                "recoveryRate": { "value": "string", "description": "string" },
                "injuryRisk": { "value": "string", "description": "string" }
            },
            "nutrigenomics": [
                { "trait": "string", "gene": "string", "status": "string", "color": "green|amber|red" }
            ],
            "aiAdjustments": [
                { "category": "string", "recommendation": "string" }
            ]
        }
        Ensure the response is valid JSON and contains exactly 3 nutrigenomics items and exactly 3 aiAdjustments items.
    `;

    try {
        const responseText = await getComplexResponse(prompt);
        return cleanAndParseJSON(responseText);
    } catch (error) {
        console.error("Error generating DNA profile:", error);
        throw error;
    }
}

export async function generateBioHealthPass(memberData: any): Promise<any> {
    const prompt = `
        You are a Med-PaLM 3 Oracle. Analyze the following member data and generate a Digital Bio-Health Pass.
        Member Data: ${JSON.stringify(memberData)}

        Return a JSON object with the following structure exactly:
        {
            "biologicalAgeOffset": "number (e.g., -2.4)",
            "metabolicRate": "number (e.g., 2450)",
            "inflammationIndex": "string (e.g., Low, Medium, High)",
            "hormonalBalance": "string (e.g., Optimal, Sub-optimal)",
            "oracleSummary": "string (A 3-4 sentence medical summary of the patient's health, recovery, and potential issues.)"
        }
        Ensure the response is valid JSON.
    `;

    try {
        const responseText = await getComplexResponse(prompt);
        return cleanAndParseJSON(responseText);
    } catch (error) {
        console.error("Error generating Bio-Health Pass:", error);
        throw error;
    }
}

export async function generatePredictiveChurn(gymData: any): Promise<any> {
    const prompt = `Analyze this gym data and predict churn risk. Data: ${JSON.stringify(gymData)}. Return JSON: {"highRiskMembers": [], "churnProbability": 0, "retentionStrategies": []}`;
    const text = await getComplexResponse(prompt);
    return cleanAndParseJSON(text);
}

export async function generatePredictiveHealthRisk(member: any): Promise<any> {
    const prompt = `Analyze member health and predict risks. Data: ${JSON.stringify(member)}. Return JSON: {"riskLevel": "Low", "identifiedRisks": [], "preventativeActions": []}`;
    const text = await getComplexResponse(prompt);
    return cleanAndParseJSON(text);
}

export async function generateNeuralMarketingStrategy(businessContext: any): Promise<any> {
    const prompt = `Act as an elite neural marketing AI. Context: ${JSON.stringify(businessContext)}. Return JSON: {"campaigns": [], "targetMetrics": {}, "aiRecommendations": []}`;
    const text = await getComplexResponse(prompt);
    return cleanAndParseJSON(text);
}

export async function processSelfLearningEngine(systemLogs: any): Promise<any> {
    const prompt = `Analyze system logs for the self-learning engine. Logs: ${JSON.stringify(systemLogs)}. Return JSON: {"insights": [], "optimizationsApplied": 0, "systemHealth": 100}`;
    const text = await getComplexResponse(prompt);
    return cleanAndParseJSON(text);
}

export async function analyzeIDCard(base64: string, mimeType: string = 'image/jpeg'): Promise<any> {
    try {
        const result = await ai.models.generateContent({
            model: VISION_MODEL,
            contents: [
                { text: `Extract the following information from this ID card or document and format it as a JSON object: "name", "age" (calculate if dob is given, return as string), "gender" (Male/Female/Other), "address", "phone" (if available). If it is not an ID but a medical form or report, extract any relevant PII data matching the mentioned fields. Only return a raw JSON object without markdown.` },
                { inlineData: { data: cleanBase64(base64), mimeType } }
            ]
        });
        return cleanAndParseJSON(result.text);
    } catch (e) {
        console.error("ID Card analysis failed", e);
        throw e;
    }
}

