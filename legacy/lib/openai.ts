import { getComplexResponse } from './gemini';

export const getCloudLogicClient = () => { return { isMockedWithGemini: true }; };

export async function getCloudLogicChatResponse(history: any[], message: string, systemInstruction?: string): Promise<string> {
    try {
        const response = await getComplexResponse('System: ' + (systemInstruction || '') + ' Message: ' + message);
        return response || 'Cloud Logic AI generated a blank response.';
    } catch (e: any) {
        console.error(e);
        return 'Please configure Core AI (Gemini) API Key in Settings to use this free feature.';
    }
}

export async function generateCloudLogicContent(prompt: string): Promise<string> {
    try {
        const response = await getComplexResponse(prompt);
        return response || '';
    } catch (e: any) {
        throw new Error('Core AI API Key missing. Configure in Settings.');
    }
}
