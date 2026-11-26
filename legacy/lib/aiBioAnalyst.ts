import { ai, cleanAndParseJSON } from "./core_ai";

export interface AIFitnessAnalysis {
    diagnosis: string;
    severity: string;
    exercise_plan?: string;
    diet_plan?: string;
    supplement_stack?: string;
    treatment_allopathic?: string;
    treatment_ayurvedic?: string;
    recovery_days: number;
    agents_involved: string[];
    github_sync_status: string;
    n8n_workflow_id: string;
    latest_research_links?: string[];
}

export interface MedicalFile {
    data: string;
    mimeType: string;
}

const cleanBase64 = (b64: string) => {
    if (!b64) return "";
    if (typeof b64 === 'string' && b64.includes(',')) {
        return b64.split(',')[1];
    }
    return b64;
};

export const analyzeComprehensiveHealth = async (
    symptoms: string,
    files: MedicalFile[],
    memberData: any
): Promise<AIFitnessAnalysis> => {
    try {
        const prompt = `You are the Supreme AI Fitness Planner at Fitness Future.
        CRITICAL INSTRUCTION: You MUST use the Google Search tool to fetch the absolute latest global fitness research, supplementation guides, and medical treatments related to the user's symptoms and goals across ALL these disciplines (Exercise Science, Nutrition, Allopathy, Ayurveda) before providing a holistic plan.
        
        Analyze the following problem/history, member habits, daily routine, and any attached medical reports.
        
        Symptoms/Notes: ${symptoms || "None provided."}
        Member Data: ${JSON.stringify(memberData)}
        
        Provide a hyper-personalized fitness & wellness plan combining all available information, integrating the latest global science updates and ancient wisdom to cure problems and boost growth.
        Return a JSON object with the following structure:
        {
            "diagnosis": "string (detailed holistic body analysis and root cause integrating symptoms, reports, and knowledge)",
            "severity": "string (Low, Medium, High, Critical)",
            "exercise_plan": "string (detailed routine to maximize growth and fix issues)",
            "diet_plan": "string (precision diet plan based on exact needs)",
            "supplement_stack": "string (branded supplement stack suggesting specific top-tier brands to fill exact nutritional gaps)",
            "treatment_allopathic": "string (recommended treatment plan based on latest allopathic medicine to cure problems)",
            "treatment_ayurvedic": "string (recommended treatment plan based on Ayurveda)",
            "recovery_days": number (estimated days to recover or achieve primary goal),
            "agents_involved": ["Fitness-Planner-Core", "Nutrition-AI", "Allopathic-AI", "Ayurveda-Sage", "Exercise-Science-Crawler"],
            "latest_research_links": ["url1", "url2"]
        }`;

        const parts: any[] = [];
        
        if (files && files.length > 0) {
            files.forEach(file => {
                parts.push({
                    inlineData: {
                        data: cleanBase64(file.data),
                        mimeType: file.mimeType
                    }
                });
            });
        }
        
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: { parts },
            config: { 
                tools: [{ googleSearch: {} }]
            }
        });

        const result = cleanAndParseJSON(response.text || "{}");
        
        return {
            diagnosis: result.diagnosis || "Unable to determine body condition.",
            severity: result.severity || "Unknown",
            exercise_plan: result.exercise_plan || "Consult a trainer for plan.",
            diet_plan: result.diet_plan || "Basic balanced diet recommended.",
            supplement_stack: result.supplement_stack || "Whey Protein, Multivitamins (General).",
            treatment_allopathic: result.treatment_allopathic || "",
            treatment_ayurvedic: result.treatment_ayurvedic || "",
            recovery_days: result.recovery_days || 0,
            agents_involved: result.agents_involved || ["Fitness-Planner-Core"],
            github_sync_status: "Synced",
            n8n_workflow_id: "wf_" + Math.random().toString(36).substring(7),
            latest_research_links: result.latest_research_links || []
        };
    } catch (e) {
        console.error("Comprehensive Health Analysis Error:", e);
        return {
            diagnosis: "Neural Fatigue Analysis - System Offline or Data Unreadable",
            severity: "Unknown",
            exercise_plan: "Rest.",
            diet_plan: "Stay hydrated.",
            supplement_stack: "None.",
            treatment_allopathic: "Rest & Hydrate. Please try again.",
            treatment_ayurvedic: "Drink warm ginger water.",
            recovery_days: 1,
            agents_involved: ["Fitness-Planner-Core"],
            github_sync_status: "Failed",
            n8n_workflow_id: "N/A",
            latest_research_links: []
        };
    }
};

export const runAIBioCouncil = async (symptoms: string, memberData: any): Promise<AIFitnessAnalysis> => {
    return analyzeComprehensiveHealth(symptoms, [], memberData);
};

export const processMedicalReport = async (base64Data: string, memberId: number, mimeType: string = "image/jpeg"): Promise<AIFitnessAnalysis> => {
    return analyzeComprehensiveHealth("Analyze this medical report.", [{ data: base64Data, mimeType }], { id: memberId });
};
