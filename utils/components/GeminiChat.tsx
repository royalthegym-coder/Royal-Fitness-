
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Tool, Type } from '@google/genai';
import { getOpenAIChatResponse } from '../../lib/openai';
import { SparkleIcon } from './icons/SparkleIcon';
import { 
    GYM_INFO, 
    INITIAL_MEMBERS, 
    INITIAL_PACKAGES, 
    INITIAL_WORKOUT_TEMPLATES,
    INITIAL_DIETS,
    INITIAL_MEMBER_SCHEDULES 
} from '../../constants';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { generateAIWorkoutTemplate } from '../../lib/gemini';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    isError?: boolean;
}

interface GeminiChatProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate?: (section: string) => void;
    context?: {
        role: 'admin' | 'member';
        memberId?: number;
        memberName?: string;
        avatar?: string;
    };
}

// --- MOCK DATABASE FUNCTIONS FOR THE BOT ---

const getGymSchedule = (day: string) => {
    const schedule: any = {
        'monday': ['07:00 AM - Yoga Flow', '06:00 PM - Zumba Blast', '07:30 PM - HIIT Intensity'],
        'tuesday': ['07:00 AM - Crossfit', '06:00 PM - Pilates Core'],
        'wednesday': ['07:00 AM - Power Yoga', '07:30 PM - Body Pump'],
        'thursday': ['07:00 AM - Crossfit', '06:00 PM - Zumba Blast'],
        'friday': ['07:00 AM - Yoga Flow', '07:30 PM - HIIT Intensity'],
        'saturday': ['08:00 AM - Bollywood Dance', '05:00 PM - Mixed Cardio'],
        'sunday': ['Closed for maintenance']
    };
    // Simple fuzzy match or default to Monday
    const d = Object.keys(schedule).find(k => day.toLowerCase().includes(k)) || 'monday';
    return schedule[d];
};

const bookClass = (className: string, time: string, memberName: string) => {
    return {
        status: "success",
        message: `Confirmed! ${className} at ${time} has been booked for ${memberName}. A calendar invite has been sent.`
    };
};

const getMemberStatus = (memberId: number) => {
    const member = INITIAL_MEMBERS.find(m => m.id === memberId);
    if (!member) return { status: "not_found" };
    
    const pkg = INITIAL_PACKAGES.find(p => p.id === member.packageId);
    return {
        name: member.name,
        status: member.status,
        plan: pkg?.name,
        joinDate: member.joinDate,
        expiryDate: "Calculated based on duration"
    };
};

const getMemberDiet = (memberId: number) => {
    const plan = INITIAL_DIETS.find(d => d.assignedTo.includes(memberId));
    if (!plan) return { status: "no_plan", message: "You don't have a specific diet plan assigned yet. Ask your trainer!" };
    
    return {
        planName: plan.name,
        goal: plan.category,
        calories: plan.calories,
        description: plan.description
    };
};

const getMemberWorkout = (memberId: number) => {
    const today = new Date().toISOString().split('T')[0];
    const schedule = INITIAL_MEMBER_SCHEDULES[memberId]?.[today];
    
    if (schedule) {
        if (schedule.isRestDay) return { type: 'Rest Day', message: "It's a rest day! Focus on recovery, stretching, or light walking." };
        if (schedule.templateId) {
            const template = INITIAL_WORKOUT_TEMPLATES.find(t => t.id === schedule.templateId);
            return { 
                type: 'Scheduled Workout', 
                name: template?.name, 
                level: template?.level,
                exercises: template?.exercises || template?.sections?.flatMap(s => s.exercises) || []
            };
        }
    }
    
    return { 
        type: 'General Recommendation', 
        message: "No specific workout scheduled for today. I recommend a standard Full Body split or checking the 'Workouts' tab to generate a new AI plan." 
    };
};

const sendWhatsAppMessageTool = (phoneNumber: string, message: string) => {
    console.log(`[RoyalOS] Sending WhatsApp to ${phoneNumber}: ${message}`);
    return { status: "sent", recipient: phoneNumber, content: message, timestamp: new Date().toISOString() };
};

// --- TOOL DEFINITIONS ---

const gymTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'get_gym_info',
                description: 'Get general information about the gym like address, contact, website, or opening hours.',
            },
            {
                name: 'get_class_schedule',
                description: 'Get the group class schedule for a specific day of the week.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING, description: 'The day of the week (e.g., Monday)' }
                    },
                    required: ['day']
                }
            },
            {
                name: 'book_class',
                description: 'Book a fitness class for the member.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        className: { type: Type.STRING, description: 'Name of the class (e.g., Yoga, Zumba)' },
                        time: { type: Type.STRING, description: 'Time of the class' }
                    },
                    required: ['className', 'time']
                }
            },
            {
                name: 'get_my_status',
                description: 'Get the current membership status, package details, and renewal info of the logged-in member.',
            },
            {
                name: 'get_my_diet',
                description: 'Fetch the specific diet plan assigned to the logged-in member, including calories and goal.',
            },
            {
                name: 'get_my_workout',
                description: 'Fetch the specific workout routine scheduled for the logged-in member for today.',
            },
            {
                name: 'generate_workout_routine',
                description: 'Generate a personalized workout routine for the user based on their goals and preferences.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        goal: { type: Type.STRING, description: 'Fitness goal (e.g., Muscle Gain, Fat Loss)' },
                        level: { type: Type.STRING, description: 'Fitness level (Beginner, Intermediate, Advanced)' },
                        focus: { type: Type.STRING, description: 'Target muscle group or focus (e.g., Full Body, Legs, Cardio)' },
                        days: { type: Type.NUMBER, description: 'Number of days per week (default 3)' }
                    },
                    required: ['goal', 'level']
                }
            },
            {
                name: 'get_workout_tip',
                description: 'Get a quick technical fitness tip based on a specific muscle group.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        muscleGroup: { type: Type.STRING, description: 'Target muscle (e.g., Abs, Chest, Legs)' }
                    },
                    required: ['muscleGroup']
                }
            },
            {
                name: 'send_whatsapp_message',
                description: 'Send a WhatsApp message to a specific number or member. Use this for notifications, reminders, or direct communication.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        phoneNumber: { type: Type.STRING, description: 'The recipient phone number.' },
                        message: { type: Type.STRING, description: 'The message content to send.' }
                    },
                    required: ['phoneNumber', 'message']
                }
            },
            {
                name: 'navigate_to',
                description: 'Navigate the user to a specific section of the application. Valid sections include: dashboard, packages, members, billing, workouts, diet, settings, health, etc.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        section: { type: Type.STRING, description: 'The section ID to navigate to.' }
                    },
                    required: ['section']
                }
            }
        ]
    }
];

// --- ICONS ---
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const GeminiChat: React.FC<GeminiChatProps> = ({ isOpen, onClose, onNavigate, context }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
    
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial Greeting
    useEffect(() => {
        if (isOpen && history.length === 0) {
            const greeting = context?.role === 'member' 
                ? `Hi ${context.memberName || 'there'}! 👋 I'm your Royal Gym Assistant. I can help with your **Workouts**, **Diet Plan**, **Schedules**, or answer general fitness questions. What do you need?`
                : `Hello Admin! I'm ready to assist with gym management queries. I can also send **WhatsApp** messages for you.`;
            
            setHistory([{ role: 'model', text: greeting }]);
        }
    }, [isOpen, context]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isLoading) return;

        // 1. Add User Message
        const userMessage: ChatMessage = { role: 'user', text: textToSend };
        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // 2. Add Placeholder for Streaming Response
        setHistory(prev => [...prev, { role: 'model', text: '' }]);

        try {
            const systemInstruction = `You are "RoyalOS", the central AI assistant for 'Royal The Gym'.
            You have access to real-time gym data.
            Always maintain a helpful, professional, and motivating tone.
            
            You can answer questions about the gym, member status, diet plans, and workouts.
            You can also generate full workout routines using the 'generate_workout_routine' tool.
            
            Gym Info: ${JSON.stringify(GYM_INFO)}.
            Current Time: ${new Date().toLocaleString()}.
            ${context?.role === 'member' ? `Member Context: ${context.memberName} (ID: ${context.memberId})` : 'User Context: Admin'}
            `;

            if (provider === 'openai') {
                const response = await getOpenAIChatResponse(
                    history.concat([userMessage]), 
                    textToSend, 
                    systemInstruction
                );
                
                setHistory(prev => {
                    const newHistory = [...prev];
                    const lastMsg = newHistory[newHistory.length - 1];
                    if (lastMsg.role === 'model') {
                        lastMsg.text = response;
                    }
                    return newHistory;
                });
                speakText(response);
            } else {
                // GEMINI Logic
                const apiKey = process.env.API_KEY;
                if (!apiKey) throw new Error("API Key missing");

                const ai = new GoogleGenAI({ apiKey });
                
                // Exclude the last placeholder message from the API history
                const apiHistory = history.map(h => ({
                    role: h.role, 
                    parts: [{ text: h.text }]
                }));

                const chat = ai.chats.create({ 
                    model: 'gemini-3-flash-preview', 
                    config: {
                        systemInstruction: systemInstruction,
                        tools: gymTools
                    },
                    history: apiHistory
                });

                const resultStream = await chat.sendMessageStream({ message: textToSend });
                let accumulatedText = '';
                const functionCalls: any[] = [];

                for await (const chunk of resultStream) {
                    const text = chunk.text;
                    if (text) {
                        accumulatedText += text;
                        setHistory(prev => {
                            const newHistory = [...prev];
                            const lastMsg = newHistory[newHistory.length - 1];
                            if (lastMsg.role === 'model') lastMsg.text = accumulatedText;
                            return newHistory;
                        });
                    }
                    if (chunk.functionCalls) {
                        functionCalls.push(...chunk.functionCalls);
                    }
                }
                
                if (functionCalls && functionCalls.length > 0) {
                    const call = functionCalls[0];
                    let functionResponseData = {};

                    // Map function calls
                    if (call.name === 'get_gym_info') functionResponseData = GYM_INFO;
                    else if (call.name === 'get_class_schedule') functionResponseData = { schedule: getGymSchedule((call.args as any).day || 'Monday') };
                    else if (call.name === 'book_class') functionResponseData = bookClass((call.args as any).className, (call.args as any).time, context?.memberName || 'Member');
                    else if (call.name === 'get_my_status') functionResponseData = getMemberStatus(context?.memberId || 0);
                    else if (call.name === 'get_my_diet') functionResponseData = getMemberDiet(context?.memberId || 0);
                    else if (call.name === 'get_my_workout') functionResponseData = getMemberWorkout(context?.memberId || 0);
                    else if (call.name === 'generate_workout_routine') {
                        const args = call.args as any;
                        const plan = await generateAIWorkoutTemplate({
                            name: `AI Plan for ${context?.memberName || 'Member'}`,
                            level: args.level,
                            goal: args.goal,
                            structure: args.focus || 'Full Body',
                            daysPerWeek: args.days || 3,
                            notes: "Generated via Chat"
                        });
                        functionResponseData = { result: plan };
                    }
                    else if (call.name === 'get_workout_tip') functionResponseData = { tip_request_received: true, muscle: (call.args as any).muscleGroup };
                    else if (call.name === 'send_whatsapp_message') functionResponseData = sendWhatsAppMessageTool((call.args as any).phoneNumber, (call.args as any).message);
                    else if (call.name === 'navigate_to') {
                        const section = (call.args as any).section;
                        if (onNavigate) {
                            onNavigate(section);
                            functionResponseData = { status: 'success', message: `Navigated to ${section}` };
                        } else functionResponseData = { status: 'error', message: 'Navigation unavailable' };
                    }

                    const result2Stream = await chat.sendMessageStream({
                        message: [{ functionResponse: { name: call.name, response: functionResponseData } }]
                    });
                    
                    let accumulatedText2 = '';
                    for await (const chunk of result2Stream) {
                        if (chunk.text) {
                            accumulatedText2 += chunk.text;
                            setHistory(prev => {
                                const newHistory = [...prev];
                                const lastMsg = newHistory[newHistory.length - 1];
                                lastMsg.text = accumulatedText2;
                                return newHistory;
                            });
                        }
                    }
                    speakText(accumulatedText2);
                } else {
                    speakText(accumulatedText);
                }
            }

        } catch (error) {
            console.error(error);
            setHistory(prev => {
                const newHistory = [...prev];
                const lastMsg = newHistory[newHistory.length - 1];
                if (lastMsg && lastMsg.role === 'model') {
                    lastMsg.text = "⚠️ I'm having trouble connecting to the neural core. Please check your internet or try again later.";
                    lastMsg.isError = true;
                }
                return newHistory;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const cleanText = text.replace(/[*#]/g, ''); 
            const utterance = new SpeechSynthesisUtterance(cleanText);
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleListening = () => {
        if (isListening) return; 
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice input is not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript);
        };
        recognition.start();
    };

    const quickActions = [
        { label: '🥗 My Diet', text: 'What is my current diet plan?' },
        { label: '💪 Workout', text: 'What workout should I do today?' },
        { label: '✨ Create Plan', text: 'Generate a 4-day muscle gain workout plan for me.' },
        { label: '📅 Schedule', text: 'What classes are on today?' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden font-sans animate-fade-in-up">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-800 to-gray-900">
                <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 border ${provider === 'openai' ? 'bg-green-500/20 border-green-500/50' : 'bg-amber-500/20 border-amber-500/50'}`}>
                        <BotIcon className={`w-6 h-6 ${provider === 'openai' ? 'text-green-400' : 'text-amber-400'}`} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base">Royal Assistant</h3>
                        <p className="text-xs text-gray-400 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full mr-1 animate-pulse bg-green-400"></span>
                            Online
                        </p>
                    </div>
                </div>
                
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700">
                    <XIcon />
                </button>
            </div>

            {/* Model Selector */}
            <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 uppercase font-bold">Model Provider</span>
                <div className="flex bg-gray-900 rounded p-0.5">
                    <button 
                        onClick={() => setProvider('gemini')}
                        className={`px-2 py-1 text-[10px] rounded font-bold transition-colors ${provider === 'gemini' ? 'bg-amber-500 text-gray-900' : 'text-gray-500 hover:text-white'}`}
                    >
                        Gemini (Tools)
                    </button>
                    <button 
                        onClick={() => setProvider('openai')}
                        className={`px-2 py-1 text-[10px] rounded font-bold transition-colors ${provider === 'openai' ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                        GPT-4o
                    </button>
                </div>
            </div>

            {/* Chat Body */}
            <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                                {msg.role === 'model' && (
                                    <div className={`w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 border border-gray-700 flex-shrink-0`}>
                                        <SparkleIcon className={`w-4 h-4 ${provider === 'openai' ? 'text-green-400' : 'text-amber-400'}`} />
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-amber-500 text-gray-900 rounded-br-none font-medium' 
                                    : msg.isError ? 'bg-red-900/50 text-red-200 border border-red-500/50' : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                                }`}>
                                    {msg.role === 'model' && !msg.text ? (
                                        <div className="flex space-x-1 h-5 items-center px-1" title="Thinking...">
                                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    ) : (
                                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ml-2 flex-shrink-0 overflow-hidden border border-amber-500/30">
                                        {context?.avatar ? (
                                            <img src={context.avatar} alt="Me" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-4 h-4 text-gray-400" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions (Only valid for Gemini currently due to Tools) */}
            {provider === 'gemini' && (
                <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
                    {quickActions.map((action, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleSend(action.text)}
                            disabled={isLoading}
                            className="whitespace-nowrap px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Type your message..."}
                        className={`w-full bg-gray-900 border ${isListening ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-600'} text-white rounded-full py-3 pl-4 pr-24 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all`}
                        disabled={isLoading}
                    />
                    
                    <div className="absolute right-2 flex items-center space-x-1">
                        <button 
                            onClick={toggleListening}
                            className={`p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                            title="Voice Input"
                        >
                            <MicIcon />
                        </button>
                        <button 
                            onClick={() => handleSend()} 
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-amber-500 text-gray-900 rounded-full hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <SendIcon />
                        </button>
                    </div>
                </div>
                <div className="text-[10px] text-center text-gray-600 mt-2 flex items-center justify-center gap-1">
                    Powered by <SparkleIcon className={`w-3 h-3 ${provider === 'openai' ? 'text-green-500' : 'text-amber-500'}`}/> {provider === 'openai' ? 'OpenAI GPT-4o' : 'Gemini 3.0 Flash'}
                </div>
            </div>
        </div>
    );
};

export default GeminiChat;
