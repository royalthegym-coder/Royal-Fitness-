
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Tool, FunctionDeclaration, Schema, Type } from '@google/genai';
import { ChatMessage } from '../../types';
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

interface GeminiChatProps {
    isOpen: boolean;
    onClose: () => void;
    context?: {
        role: 'admin' | 'member';
        memberId?: number;
        memberName?: string;
    };
}

// --- MOCK DATABASE FUNCTIONS FOR THE BOT ---

const getGymSchedule = (day: string) => {
    // Simulated schedule
    const schedule: any = {
        'Monday': ['07:00 AM - Yoga Flow', '06:00 PM - Zumba Blast', '07:30 PM - HIIT Intensity'],
        'Tuesday': ['07:00 AM - Crossfit', '06:00 PM - Pilates Core'],
        'Wednesday': ['07:00 AM - Power Yoga', '07:30 PM - Body Pump'],
        'Thursday': ['07:00 AM - Crossfit', '06:00 PM - Zumba Blast'],
        'Friday': ['07:00 AM - Yoga Flow', '07:30 PM - HIIT Intensity'],
        'Saturday': ['08:00 AM - Bollywood Dance', '05:00 PM - Mixed Cardio'],
        'Sunday': ['Closed for maintenance']
    };
    // Simple logic to find day
    const d = Object.keys(schedule).find(k => day.toLowerCase().includes(k.toLowerCase())) || 'Monday';
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
    // Find diet plan assigned to this member
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
    
    // Fallback if no specific schedule
    return { 
        type: 'General Recommendation', 
        message: "No specific workout scheduled for today. I recommend a standard Full Body split or checking the 'Workouts' tab to generate a new AI plan." 
    };
};

// --- TOOL DEFINITIONS (Function Declarations) ---

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
                name: 'get_workout_tip',
                description: 'Get a quick technical fitness tip based on a specific muscle group.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        muscleGroup: { type: Type.STRING, description: 'Target muscle (e.g., Abs, Chest, Legs)' }
                    },
                    required: ['muscleGroup']
                }
            }
        ]
    }
];

// --- ICONS ---
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const GeminiChat: React.FC<GeminiChatProps> = ({ isOpen, onClose, context }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const chatBodyRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initial Greeting
    useEffect(() => {
        if (isOpen && history.length === 0) {
            const greeting = context?.role === 'member' 
                ? `Hi ${context.memberName || 'there'}! 👋 I'm your Royal Gym Assistant. I can help with your **Workouts**, **Diet Plan**, **Schedules**, or **Membership**. What do you need?`
                : `Hello Admin! I'm ready to assist with gym management queries.`;
            
            setHistory([{ role: 'model', text: greeting }]);
        }
    }, [isOpen, context]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history, isLoading]);

    // --- LOGIC: HANDLE SEND ---
    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() || isLoading) return;

        // 1. Add User Message
        const userMessage: ChatMessage = { role: 'user', text: textToSend };
        setHistory(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            // 2. Prepare System Prompt with Context
            let systemInstruction = `You are "Royal Bot", a helpful and energetic AI agent for 'Royal The Gym'.
            Gym Info: ${JSON.stringify(GYM_INFO)}.
            Current Time: ${new Date().toLocaleString()}.
            
            Your goal is to assist members with their fitness journey. 
            You have access to TOOLS to look up their specific Diet Plans, Workout Routines, and Membership details.
            ALWAYS use the tools if the user asks about "my plan", "my diet", "schedule", etc.
            `;

            if (context?.role === 'member') {
                systemInstruction += ` You are speaking to a member named ${context.memberName || 'Member'} (ID: ${context.memberId}). Be encouraging and motivating.`;
            } else {
                systemInstruction += ` You are speaking to an Administrator. Be professional and concise.`;
            }

            // 3. Initialize Chat with Tools
            const chat = ai.chats.create({ 
                model: 'gemini-2.5-flash-latest', 
                config: {
                    systemInstruction: systemInstruction,
                    tools: gymTools
                },
                history: history.map(h => ({
                    role: h.role, 
                    parts: [{ text: h.text }]
                }))
            });

            // 4. Send Message (Multi-turn chat)
            const result = await chat.sendMessage({ message: textToSend });
            
            // 5. Handle Function Calls
            const functionCalls = result.functionCalls;
            
            if (functionCalls && functionCalls.length > 0) {
                // Determine function response
                const call = functionCalls[0];
                let functionResponseData = {};

                console.log("Tool Called:", call.name);

                if (call.name === 'get_gym_info') {
                    functionResponseData = GYM_INFO;
                } else if (call.name === 'get_class_schedule') {
                    const day = (call.args as any).day || 'Monday';
                    functionResponseData = { schedule: getGymSchedule(day) };
                } else if (call.name === 'book_class') {
                    const { className, time } = call.args as any;
                    functionResponseData = bookClass(className, time, context?.memberName || 'Member');
                } else if (call.name === 'get_my_status') {
                    functionResponseData = getMemberStatus(context?.memberId || 0);
                } else if (call.name === 'get_my_diet') {
                    functionResponseData = getMemberDiet(context?.memberId || 0);
                } else if (call.name === 'get_my_workout') {
                    functionResponseData = getMemberWorkout(context?.memberId || 0);
                } else if (call.name === 'get_workout_tip') {
                    functionResponseData = { tip_request_received: true, muscle: (call.args as any).muscleGroup };
                }

                // Send function result back to model
                const result2 = await chat.sendMessage({
                    message: [{
                        functionResponse: {
                            name: call.name,
                            response: functionResponseData
                        }
                    }]
                });
                
                const finalResponse = result2.text || "I'm sorry, I couldn't process that.";
                setHistory(prev => [...prev, { role: 'model', text: finalResponse }]);
                speakText(finalResponse);

            } else {
                // Simple text response
                const text = result.text || "I didn't quite get that.";
                setHistory(prev => [...prev, { role: 'model', text: text }]);
                speakText(text);
            }

        } catch (error) {
            console.error(error);
            setHistory(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the gym server. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- VOICE LOGIC (Web Speech API) ---
    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any current speech
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            // Try to find a good voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
            if (preferredVoice) utterance.voice = preferredVoice;
            utterance.rate = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            // Stop listening logic handled by onend
            return; 
        }

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
        recognition.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript); // Auto-send
        };

        recognition.start();
    };

    // --- QUICK ACTIONS ---
    const quickActions = [
        { label: '🥗 My Diet', text: 'What is my current diet plan?' },
        { label: '💪 Workout', text: 'What workout should I do today?' },
        { label: '📅 Schedule', text: 'What classes are on today?' },
        { label: '📋 My Plan', text: 'Check my membership status' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[600px] flex flex-col bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden font-sans animate-fade-in-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center">
                    <div className="bg-amber-500/20 p-2 rounded-full mr-3 border border-amber-500/50">
                        <BotIcon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-base">Royal Agent</h3>
                        <p className="text-xs text-green-400 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700">
                    <XIcon />
                </button>
            </div>

            {/* Chat Body */}
            <div ref={chatBodyRef} className="flex-1 p-4 overflow-y-auto bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 border border-gray-700 flex-shrink-0">
                                    <SparkleIcon className="w-4 h-4 text-amber-400" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-amber-500 text-gray-900 rounded-br-none font-medium' 
                                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                            }`}>
                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center ml-2 flex-shrink-0">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-2 border border-gray-700">
                                <BotIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="bg-gray-800 p-3 rounded-2xl rounded-bl-none border border-gray-700 flex items-center space-x-1 h-10">
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions (Voiceflow Style) */}
            <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
                {quickActions.map((action, idx) => (
                    <button 
                        key={idx}
                        onClick={() => handleSend(action.text)}
                        className="whitespace-nowrap px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-xs text-gray-300 transition-colors flex-shrink-0"
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isListening ? "Listening..." : "Ask Royal Agent..."}
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
                <div className="text-[10px] text-center text-gray-600 mt-2">
                    Powered by Royal AI • 24/7 Support
                </div>
            </div>
        </div>
    );
};

export default GeminiChat;
