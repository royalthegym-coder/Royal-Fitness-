import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, MessageSquare, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getHealthAssistantResponse } from '../../../lib/core_ai';

export default function TrainerChat() {
    const [msgs, setMsgs] = useState([
        { id: 1, sender: 'trainer', text: 'Great form on those squats yesterday! How is the soreness?', time: '09:00 AM' },
        { id: 2, sender: 'user', text: 'Hey Arjun, thanks! Legs are pretty sore today. Should I still do light cardio?', time: '09:15 AM' },
        { id: 3, sender: 'trainer', text: 'Yes, 15 mins of light cycling will help flush out lactic acid. No heavy lifting today.', time: '09:20 AM' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [msgs]);

    const sendMsg = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;
        
        const userMsg = input;
        setMsgs(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        setInput('');
        setIsTyping(true);

        const history = msgs.map(m => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
        }));

        try {
            const reply = await getHealthAssistantResponse(history, userMsg, { trainerName: 'Arjun Singh', style: 'encouraging, expert, fitness-focused' });
            setMsgs(prev => [...prev, { id: Date.now() + 1, sender: 'trainer', text: reply, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        } catch (error) {
             setMsgs(prev => [...prev, { id: Date.now() + 1, sender: 'trainer', text: "I'm offline right now. Try again shortly.", time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] bg-black/40 border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden backdrop-blur-xl relative">
            <div className="bg-white/5 border-b border-white/10 p-6 flex justify-between items-center z-10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-900/50 rounded-full flex items-center justify-center border border-cyan-500/50 relative">
                        <UserIcon className="w-6 h-6 text-cyan-400" />
                        <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                    </div>
                    <div>
                        <h3 className="text-white font-black uppercase tracking-widest text-lg">Arjun Singh</h3>
                        <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">Head Personal Trainer</p>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 z-10 custom-scrollbar">
                <AnimatePresence>
                {msgs.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl p-4 ${m.sender === 'user' ? 'bg-cyan-600/20 text-white border border-cyan-500/30 rounded-br-sm' : 'bg-white/10 text-gray-200 border border-white/5 rounded-bl-sm'}`}>
                            <p className="text-sm font-medium">{m.text}</p>
                            <span className={`text-[9px] font-mono mt-2 block opacity-50 ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>{m.time}</span>
                        </div>
                    </motion.div>
                ))}
                {isTyping && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
                        <div className="bg-white/10 text-gray-200 border border-white/5 rounded-2xl rounded-bl-sm p-4 flex items-center gap-2">
                             <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                             <span className="text-xs font-mono text-cyan-400">Arjun is typing...</span>
                        </div>
                     </motion.div>
                )}
                </AnimatePresence>
            </div>

            <div className="p-4 bg-black/60 border-t border-white/10 z-10">
                <form onSubmit={sendMsg} className="flex gap-4">
                    <input 
                        type="text" 
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-colors placeholder-gray-600 text-sm"
                        placeholder="Message your trainer..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white p-4 rounded-2xl transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none z-0 mix-blend-screen"></div>
        </div>
    );
}
