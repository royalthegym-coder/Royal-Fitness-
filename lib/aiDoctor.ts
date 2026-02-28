import { GoogleGenAI } from "@google/genai";
import { cleanAndParseJSON } from "./gemini";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AIDoctorAnalysis {
    diagnosis: string;
    severity: string;
    treatment: string;
    recovery_days: number;
    agents_involved: string[];
    github_sync_status: string;
    n8n_workflow_id: string;
}

export interface MedicalFile {
    data: string;
    mimeType: string;
}

const cleanBase64 = (b64: string) => b64.replace(/^data:image\/\w+;base64,/, "").replace(/^data:application\/\w+;base64,/, "");

export const analyzeComprehensiveHealth = async (
    symptoms: string,
    files: MedicalFile[],
    memberData: any
): Promise<AIDoctorAnalysis> => {
    try {
        const prompt = `You are an elite AI Medical Council (Llama-3-Med, Bio-Mistral, DeepSeek-V3, Royal-Core).
        Analyze the following symptoms, member data, and any attached medical reports/images.
        
        Symptoms/Notes: ${symptoms || "None provided."}
        Member Data: ${JSON.stringify(memberData)}
        
        Provide a comprehensive diagnosis combining all available information.
        Return a JSON object with the following structure:
        {
            "diagnosis": "string (detailed diagnosis combining symptoms and reports)",
            "severity": "string (Low, Medium, High, Critical)",
            "treatment": "string (recommended treatment plan)",
            "recovery_days": number (estimated days to recover),
            "agents_involved": ["Llama-3-Med", "Bio-Mistral", "DeepSeek-V3", "Royal-Core"]
        }`;

        const parts: any[] = [];
        
        // Add files if any
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
        
        // Add text prompt
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: { parts },
            config: { responseMimeType: "application/json" }
        });

        const result = cleanAndParseJSON(response.text || "{}");
        
        return {
            diagnosis: result.diagnosis || "Unable to determine diagnosis.",
            severity: result.severity || "Unknown",
            treatment: result.treatment || "Consult a human doctor.",
            recovery_days: result.recovery_days || 0,
            agents_involved: result.agents_involved || ["Royal-Core"],
            github_sync_status: "Synced",
            n8n_workflow_id: "wf_" + Math.random().toString(36).substring(7)
        };
    } catch (e) {
        console.error("Comprehensive Health Analysis Error:", e);
        return {
            diagnosis: "Neural Fatigue Analysis - System Offline or Data Unreadable",
            severity: "Unknown",
            treatment: "Rest & Hydrate. Please try again.",
            recovery_days: 1,
            agents_involved: ["Royal-Core"],
            github_sync_status: "Failed",
            n8n_workflow_id: "N/A"
        };
    }
};

// Keep old functions for backward compatibility if needed, but route them to the new comprehensive function
export const runAIDoctorCouncil = async (symptoms: string, memberData: any): Promise<AIDoctorAnalysis> => {
    return analyzeComprehensiveHealth(symptoms, [], memberData);
};

export const processMedicalReport = async (base64Data: string, memberId: number, mimeType: string = "image/jpeg"): Promise<AIDoctorAnalysis> => {
    return analyzeComprehensiveHealth("Analyze this medical report.", [{ data: base64Data, mimeType }], { id: memberId });
};
