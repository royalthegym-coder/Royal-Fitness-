
import OpenAI from 'openai';

export const getOpenAIClient = () => {
    // Safe env access
    const key = localStorage.getItem('OPENAI_API_KEY') || (window as any).process?.env?.OPENAI_API_KEY;
    if (!key) return null;
    return new OpenAI({
        apiKey: key,
        dangerouslyAllowBrowser: true
    });
};

export async function getOpenAIChatResponse(
    history: { role: string; text: string }[], 
    message: string, 
    systemInstruction?: string
): Promise<string> {
    const client = getOpenAIClient();
    if (!client) return "OpenAI API Key is missing. Please configure it in Settings > Integrations.";

    try {
        const messages: any[] = [
            { role: 'system', content: systemInstruction || 'You are a helpful fitness assistant.' },
            ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text })),
            { role: 'user', content: message }
        ];

        const completion = await client.chat.completions.create({
            messages: messages,
            model: 'gpt-4o',
        });

        return completion.choices[0].message.content || "";
    } catch (error: any) {
        console.error("OpenAI Error:", error);
        return `OpenAI Error: ${error.message}`;
    }
}

export async function generateOpenAIContent(prompt: string): Promise<string> {
    const client = getOpenAIClient();
    if (!client) throw new Error("OpenAI API Key missing");

    const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-4o',
    });

    return completion.choices[0].message.content || "";
}
