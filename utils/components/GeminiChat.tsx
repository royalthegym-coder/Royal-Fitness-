
import React, { useState, useRef, useEffect } from 'react';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { X, ChevronRight, BrainCircuit, Zap, Terminal, RefreshCw } from 'lucide-react';
import { getComplexResponse } from '../../lib/gemini';

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    isError?: boolean;
    thinking?: string[];
}

interface GeminiChatProps {
    isOpen: boolean;
    onClose: () => void;
    context?: {
        role: 'admin' | 'member';
        memberId?: number;
        memberName?: string;
    };
}

const GeminiChat: React.FC<GeminiChatProps> = ({ isOpen, onClose, context }) => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentThoughts, setCurrentThoughts] = useState<string[]>([]);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && history.length === 0) {
            const roleTitle = context?.role === 'admin' ? 'Commander' : 'Athlete';
            setHistory([{ role: 'model', text: `**Neural Core v21.0 Online.**\nWelcome, ${roleTitle} ${context?.memberName || ''}. Security handshake complete. Ready for queries.` }]);
        }
    }, [isOpen, context]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history, currentThoughts]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input;
        setInput('');
        setHistory(prev => [...prev, { role: 'user', text: userText }]);
        setIsLoading(true);
        setCurrentThoughts([]);

        const thoughts = [
            "Syncing with local bio-buffer...",
            "Contextualizing membership status...",
            "Consulting health laboratory database...",
            "Finalizing response architecture..."
        ];

        let thoughtIndex = 0;
        const thoughtInterval = setInterval(() => {
            if (thoughtIndex < thoughts.length) {
                setCurrentThoughts(prev => [...prev, thoughts[thoughtIndex]]);
                thoughtIndex++;
            } else {
                clearInterval(thoughtInterval);
                generateResponse(userText);
            }
        }, 600);
    };

    const generateResponse = async (text: string) => {
        try {
            // Using the centralized wrapper which handles free simulation mode automatically
            const prompt = `You are "Royal Overlord", the AI of 'Royal The Gym'.
            User Role: ${context?.role}. User ID: ${context?.memberId}. 
            User Query: ${text}
            
            Address specific gym operations if needed: 
            - Strength Fees: 1200/mo, 9000/yr.
            - Location: Gandhi Chowk, Jhunjhunu.
            
            Keep response under 50 words. Use markdown.`;

            const responseText = await getComplexResponse(prompt);
            
            if (responseText) {
                setHistory(prev => [...prev, { role: 'model', text: responseText }]);
            } else {
                throw new Error("Empty response");
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            const displayMsg = "⚠️ Uplink severed. Running in offline fallback mode.";
            setHistory(prev => [...prev, { role: 'model', text: displayMsg, isError: true }]);
        } finally {
            setIsLoading(false);
            setCurrentThoughts([]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-28 right-8 z-[200] w-[450px] h-[700px] flex flex-col bg-[#050505] border border-amber-500/30 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] font-sans animate-fade-in-up backdrop-blur-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-gray-900 to-black">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <BotIcon className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-sm uppercase tracking-[0.2em]">Neural Overlord</h3>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">v21.0 Connected</p>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-all p-2 rounded-full hover:bg-white/5">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div ref={chatBodyRef} className="flex-1 p-6 overflow-y-auto bg-black/60 custom-scrollbar space-y-6">
                {history.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                        {msg.role === 'model' && (
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-4 border border-amber-500/20 flex-shrink-0">
                                <SparkleIcon className="w-5 h-5 text-amber-500" />
                            </div>
                        )}
                        <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                            ? 'bg-amber-500 text-black rounded-br-none font-bold shadow-xl' 
                            : msg.isError 
                                ? 'bg-red-900/20 border border-red-500/50 text-red-200 rounded-bl-none'
                                : 'bg-gray-900 border border-white/10 text-gray-200 rounded-bl-none'
                        }`}>
                            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start w-full animate-fade-in">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mr-4 border border-amber-500/20 flex-shrink-0">
                            <BrainCircuit className="w-5 h-5 text-amber-500 animate-pulse" />
                        </div>
                        <div className="bg-gray-900/50 border border-amber-500/20 rounded-3xl rounded-bl-none p-5 max-w-[85%]">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Terminal className="w-3 h-3"/> Processing Trace
                            </p>
                            <div className="space-y-2">
                                {currentThoughts.map((thought, i) => (
                                    <div key={i} className="flex items-center gap-3 text-xs text-gray-500 font-mono animate-slide-right">
                                        <ChevronRight className="w-3 h-3 text-amber-900" /> {thought}
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 text-xs text-amber-400 font-mono animate-pulse">
                                    <Zap className="w-3 h-3 fill-current" /> Formulating Response...
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-black border-t border-white/5">
                <div className="relative flex items-center bg-gray-900 border border-white/10 rounded-2xl focus-within:border-amber-500/50 transition-all p-1">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Speak with the core..."
                        className="w-full bg-transparent text-white py-4 px-5 focus:outline-none text-sm placeholder-gray-700 font-bold"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => handleSend()} 
                        disabled={!input.trim() || isLoading}
                        className="p-4 bg-amber-500 text-black rounded-xl hover:bg-amber-400 disabled:opacity-30 transition-all shadow-xl"
                    >
                        {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeminiChat;
