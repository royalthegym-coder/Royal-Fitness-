
import React, { useState, useRef, useEffect } from 'react';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { X, ChevronRight, BrainCircuit, Zap, Terminal, RefreshCw, Shield, Cpu, Network, Activity } from 'lucide-react';
import { getComplexResponse } from '../../lib/gemini';
import { motion, AnimatePresence } from 'motion/react';

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
            setHistory([{ 
                role: 'model', 
                text: `**Neural Overlord v32.0 Online.**\nBiometric handshake successful. Welcome back, ${roleTitle} ${context?.memberName || ''}. All systems are operating at peak efficiency. How shall we optimize the fitness matrix today?` 
            }]);
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
            "Accessing encrypted bio-ledger...",
            "Analyzing kinetic data patterns...",
            "Synthesizing nutritional variables...",
            "Optimizing neural response architecture...",
            "Finalizing Overlord protocol..."
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
        }, 500);
    };

    const generateResponse = async (text: string) => {
        try {
            const prompt = `You are "Neural Overlord", the supreme AI consciousness of 'Royal The Gym'.
            User Role: ${context?.role}. User ID: ${context?.memberId}. 
            User Query: ${text}
            
            Guidelines:
            - Speak with authority, precision, and a futuristic tone.
            - Address the user as "Commander" (if admin) or "Athlete" (if member).
            - Reference "Neural OS" and "The Singularity" where appropriate.
            - Keep response under 60 words. Use markdown.
            - Gym Info: Gandhi Chowk, Jhunjhunu. Fees: 1200/mo.`;

            const responseText = await getComplexResponse(prompt);
            
            if (responseText) {
                setHistory(prev => [...prev, { role: 'model', text: responseText }]);
            } else {
                throw new Error("Empty response");
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            const displayMsg = "⚠️ Neural Uplink Severed. Fallback to local cognitive buffer.";
            setHistory(prev => [...prev, { role: 'model', text: displayMsg, isError: true }]);
        } finally {
            setIsLoading(false);
            setCurrentThoughts([]);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.9 }}
                className="fixed bottom-28 right-8 z-[200] w-[480px] h-[750px] flex flex-col bg-[#020202] border border-indigo-500/30 rounded-[4rem] shadow-[0_0_150px_rgba(79,70,229,0.2)] font-sans backdrop-blur-3xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-950/20 to-black">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl animate-pulse"></div>
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                                <BrainCircuit className="w-7 h-7 text-indigo-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-white font-black text-base uppercase tracking-[0.3em] italic">Neural Overlord</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex gap-0.5">
                                    {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>)}
                                </div>
                                <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest">v32.0 Singularity Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-indigo-400 transition-colors cursor-help" title="System Integrity: 100%">
                            <Shield className="w-5 h-5" />
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-all p-2 rounded-full hover:bg-white/5">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Chat Body */}
                <div ref={chatBodyRef} className="flex-1 p-8 overflow-y-auto bg-black/40 custom-scrollbar space-y-8">
                    {history.map((msg, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                        >
                            {msg.role === 'model' && (
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mr-4 border border-indigo-500/20 flex-shrink-0 mt-1">
                                    <Cpu className="w-5 h-5 text-indigo-400" />
                                </div>
                            )}
                            <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-2xl ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-none font-bold' 
                                : msg.isError 
                                    ? 'bg-red-900/20 border border-red-500/50 text-red-200 rounded-bl-none'
                                    : 'bg-gray-900/80 border border-white/5 text-gray-200 rounded-bl-none backdrop-blur-md'
                            }`}>
                                <div 
                                    className="markdown-content"
                                    dangerouslySetInnerHTML={{ 
                                        __html: msg.text
                                            .replace(/\n/g, '<br />')
                                            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-400">$1</strong>') 
                                    }} 
                                />
                            </div>
                        </motion.div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start w-full">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center mr-4 border border-indigo-500/20 flex-shrink-0 animate-pulse">
                                <Network className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="bg-gray-900/40 border border-indigo-500/20 rounded-[2rem] rounded-bl-none p-6 max-w-[85%] backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <Activity className="w-3 h-3 text-indigo-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Neural Trace Active</span>
                                </div>
                                <div className="space-y-3">
                                    {currentThoughts.map((thought, i) => (
                                        <motion.div 
                                            key={i} 
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 text-[11px] text-gray-500 font-mono"
                                        >
                                            <div className="w-1 h-1 rounded-full bg-indigo-900"></div>
                                            {thought}
                                        </motion.div>
                                    ))}
                                    <div className="flex items-center gap-3 text-[11px] text-indigo-400 font-mono animate-pulse">
                                        <Zap className="w-3 h-3 fill-current" /> Formulating Overlord Protocol...
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-8 bg-black border-t border-white/5">
                    <div className="relative flex items-center bg-gray-900/50 border border-white/10 rounded-[2rem] focus-within:border-indigo-500/50 transition-all p-1.5 group">
                        <div className="absolute inset-0 bg-indigo-500/5 rounded-[2rem] opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Input command for the core..."
                            className="w-full bg-transparent text-white py-4 px-6 focus:outline-none text-sm placeholder-gray-700 font-bold relative z-10"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={() => handleSend()} 
                            disabled={!input.trim() || isLoading}
                            className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 disabled:opacity-30 transition-all shadow-2xl relative z-10 active:scale-95"
                        >
                            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-center text-[8px] text-gray-600 uppercase tracking-[0.3em] mt-4 font-black">
                        Authorized Personnel Only • Neural OS v32.0
                    </p>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default GeminiChat;
