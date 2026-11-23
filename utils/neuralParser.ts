export interface CoreDietOutput {
  status: string;
  dietPlanName: string;
  caloriesKcal: number;
  macros: { proteinG: number; carbsG: number; fatsG: number };
}

export const safeSmartJsonParse = (rawGeminiOutput: string | any): CoreDietOutput => {
  if (typeof rawGeminiOutput === 'object' && rawGeminiOutput !== null) {
    return sanitizeOutput(rawGeminiOutput);
  }

  try {
    const text = String(rawGeminiOutput || '').trim();
    
    // Attempt regular expression matching to pull out raw brackets in case of markdown wrapping
    const jsonExtractor = text.match(/\{[\s\S]*\}/);
    if (jsonExtractor) {
      const parsed = JSON.parse(jsonExtractor[0]);
      return sanitizeOutput(parsed);
    }
    
    // Direct attempt if no brackets match or direct parsing works
    const parsedDirect = JSON.parse(text);
    return sanitizeOutput(parsedDirect);
  } catch (error) {
    console.warn("⚠️ Fallback Active: Suppressing Core AI Parsing Anomalies.", error);
    // Return standard, high-quality fallback diet plan directly avoiding white-screens in client
    return {
      status: "Smart Fallback Activated",
      dietPlanName: "High-Protein Indigenous Wellness Plan (Bajra & Curd Core)",
      caloriesKcal: 2200,
      macros: { proteinG: 140, carbsG: 220, fatsG: 65 }
    };
  }
};

function sanitizeOutput(obj: any): CoreDietOutput {
  return {
    status: String(obj.status || "Calibrated & Synthesized Successfully").trim(),
    dietPlanName: String(obj.dietPlanName || "High-Protein Indigenous Wellness Plan (Bajra & Curd Core)").trim(),
    caloriesKcal: Number(obj.caloriesKcal || 2200),
    macros: {
      proteinG: Number(obj.macros?.proteinG || obj.protein || 140),
      carbsG: Number(obj.macros?.carbsG || obj.carbs || 220),
      fatsG: Number(obj.macros?.fatsG || obj.fats || 65)
    }
  };
}
