export const safeAIParse = <T,>(rawResponse: string, fallbackData: T): T => {
    try {
        let clean = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstIndex = Math.min(
            clean.indexOf('{') !== -1 ? clean.indexOf('{') : Infinity,
            clean.indexOf('[') !== -1 ? clean.indexOf('[') : Infinity
        );
        const lastIndex = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
        
        if (firstIndex !== Infinity && lastIndex !== -1 && lastIndex > firstIndex) {
            clean = clean.substring(firstIndex, lastIndex + 1);
        }

        return JSON.parse(clean) as T;
    } catch (e) {
        console.error("AI Response Corrupted or Empty. Using Fallback Data.", e);
        return fallbackData; // Neural Fallback Mode
    }
};
