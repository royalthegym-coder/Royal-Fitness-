import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, Terminal, Cpu, Activity, Zap, ShieldAlert } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export const SystemHelper: React.FC = () => {
    const { addToast } = useToast();
    const [messages, setMessages] = useState<{role: 'user' | 'assistant' | 'system', text: string}[]>([
        { role: 'system', text: 'Fitness Future OS ASSISTANT ONLINE.' },
        { role: 'assistant', text: 'Greetings, Administrator. I am the OS Intelligence. I can manage resource allocation, run diagnostics, and execute system operations via natural language. How may I assist you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsProcessing(true);

        try {
            // Check for specific system commands first
            const lowerMsg = userMsg.toLowerCase();
            let systemResponse = '';

            if (lowerMsg.includes('allocate') && lowerMsg.includes('qubits')) {
                systemResponse = '[SYSTEM ACTION]: Reallocating quantum resources... 512 Qubits assigned to AI modules.';
                addToast("Qubits Reallocated", "success");
            } else if (lowerMsg.includes('diagnostic') || lowerMsg.includes('health')) {
                systemResponse = '[SYSTEM ACTION]: Running full diagnostics... Core: Stable (99.9% Coherence). Network: Secured. AI: Optimal.';
            } else if (lowerMsg.includes('lockdown') || lowerMsg.includes('secure')) {
                systemResponse = '[SYSTEM ACTION]: Initiating FitnessFutureLockdown. All external ports closed. QKD encryption maxed.';
                addToast("System Lockdown Initiated", "error");
            }

            if (systemResponse) {
                setTimeout(() => {
                    setMessages(prev => [...prev, { role: 'system', text: systemResponse }]);
                    setIsProcessing(false);
                }, 1000);
                return;
            }

            // Call Server API for OS Assistant
            const res = await fetch('/api/os-assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg })
            });

            if (!res.ok) {
                throw new Error('Failed to get response from OS Assistant');
            }

            const data = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', text: data.response || 'Command acknowledged.' }]);

        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'system', text: '[ERROR]: Smart connection failed.' }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[80vh] bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl animate-fade-in">
            {/* Header */}
            <div className="bg-zinc-900/80 p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                        <Bot className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">OS Intelligence</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-[0.2em]">Natural Language Interface Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-black rounded-lg border border-white/5 flex items-center gap-2">
                        <Cpu className="w-3 h-3 text-fuchsia-400" />
                        <span className="text-[10px] text-gray-400 font-mono">Load: 12%</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#050505]">
                {messages.map((msg, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[80%] p-4 rounded-2xl ${
                            msg.role === 'user' 
                            ? 'bg-cyan-600 text-white rounded-tr-sm' 
                            : msg.role === 'system'
                            ? 'bg-zinc-900 border border-white/10 text-emerald-400 font-mono text-xs rounded-tl-sm'
                            : 'bg-zinc-800 text-gray-200 rounded-tl-sm'
                        }`}>
                            {msg.role === 'assistant' && (
                                <div className="flex items-center gap-2 mb-2">
                                    <Bot className="w-4 h-4 text-cyan-400" />
                                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">OS Assistant</span>
                                </div>
                            )}
                            <p className="leading-relaxed text-sm">{msg.text}</p>
                        </div>
                    </motion.div>
                ))}
                {isProcessing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-sm flex items-center gap-3">
                            <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
                            <span className="text-xs text-gray-400 font-mono">Processing command...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-zinc-900/80 border-t border-white/10 shrink-0">
                <form onSubmit={handleCommand} className="relative">
                    <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter natural language command (e.g., 'Allocate more qubits to AI', 'Run diagnostics')"
                        className="w-full bg-black border border-white/10 rounded-xl py-4 pl-12 pr-14 text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-zinc-600 text-sm"
                        disabled={isProcessing}
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isProcessing}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};
