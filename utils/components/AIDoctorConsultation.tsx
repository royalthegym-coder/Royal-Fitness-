import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { ShieldCheck, Activity, Brain, Mic, Send, Volume2, Stethoscope, HeartPulse, AlertCircle, Loader2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

interface Message {
    id: string;
    sender: 'ai' | 'user';
    text: string;
    timestamp: Date;
}

export const AIDoctorConsultation: React.FC = () => {
    const { members } = useData();
    const { addToast } = useToast();
    
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedMember = members.find(m => m.id === Number(selectedMemberId));

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Initialize Chat when member is selected
    useEffect(() => {
        if (selectedMember) {
            setMessages([
                {
                    id: '1',
                    sender: 'ai',
                    text: `नमस्ते ${selectedMember.name}, मैं Dr. Aether हूँ—आपका AI Medical Guardian. आपके 'Bio-Pass' के अनुसार आपके लीवर पर थोड़ा तनाव है (Inflammation 0.5 mg/L) और आपका HRV (Heart Rate Variability) सामान्य से कम है। क्या आपने कल रात नींद पूरी नहीं की?`,
                    timestamp: new Date()
                }
            ]);
        } else {
            setMessages([]);
        }
    }, [selectedMemberId]);

    const handleSend = async () => {
        if (!input.trim() || !selectedMember) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Initialize Gemini API
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
            
            const systemInstruction = `You are Dr. Aether, the world's most advanced AI Medical Super-Intelligence at Royal The Gym. 
            You are consulting with a gym member named ${selectedMember.name}. 
            Their current Bio-Pass data shows: 
            - Biological Age: ${selectedMember.bio_age || 25}
            - Recent Issue: Slight liver stress and low HRV (Heart Rate Variability).
            - Goal: Peak performance and longevity.
            
            Speak in a highly advanced, professional, yet empathetic medical tone. 
            Mix Hindi and English naturally (Hinglish). 
            Keep responses concise (2-3 sentences max). 
            Provide actionable, science-based advice (e.g., Nutrigenomics, specific supplements, sleep protocols).`;

            const chat = ai.chats.create({
                model: 'gemini-3.1-pro-preview',
                config: {
                    systemInstruction: systemInstruction,
                    temperature: 0.7,
                }
            });

            // Replay history for context
            for (const msg of messages) {
                if (msg.sender === 'user') {
                    await chat.sendMessage({ message: msg.text });
                }
            }

            const response = await chat.sendMessage({ message: userMsg.text });
            
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: response.text || "I am analyzing your bio-markers. Please give me a moment.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Gemini API Error:", error);
            addToast("Neural link disrupted. Please try again.", "error");
            
            // Fallback response if API fails
            const fallbackMsg: Message = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: "क्षमा करें, क्वांटम सर्वर से संपर्क टूट गया है। कृपया सुनिश्चित करें कि आपका Bio-Pass सिंक है।",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, fallbackMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            addToast("Voice input captured.", "success");
            // Simulate voice to text
            setTimeout(() => {
                setInput("हां डॉक्टर, कल रात मुझे ठीक से नींद नहीं आई और सुबह से थोड़ी थकान महसूस हो रही है।");
            }, 500);
        } else {
            setIsListening(true);
            addToast("Listening... Speak now.", "info");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in h-[calc(100vh-100px)] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-950 to-black p-6 rounded-3xl border border-indigo-500/20 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/50">
                            <Brain className="w-7 h-7 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Live Consultation</span>
                            </div>
                            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">The AI Doctor</h1>
                            <p className="text-indigo-200/60 text-xs">Bio-Aether Oracle Voice & Chat Interface</p>
                        </div>
                    </div>
                    
                    <select 
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                        className="bg-black border border-indigo-500/50 rounded-xl p-3 text-white font-bold outline-none focus:border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)] min-w-[200px]"
                    >
                        <option value="">Select Patient</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            {!selectedMemberId ? (
                <div className="flex-1 bg-zinc-900/50 border border-white/5 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                    <Stethoscope className="w-16 h-16 text-zinc-700 mb-4" />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Awaiting Patient</h3>
                    <p className="text-zinc-500 max-w-md">Select a member to initialize the Bio-Aether Oracle consultation and load their Digital Bio-Health Pass.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    {/* Left Panel: Bio-Pass Live Data */}
                    <div className="w-full lg:w-80 bg-black rounded-[2rem] border border-white/10 p-6 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Bio-Pass Snapshot
                        </h3>
                        
                        <div className="space-y-6">
                            {/* Vitals */}
                            <div className="space-y-3">
                                <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-zinc-400 uppercase tracking-widest">HRV Score</span>
                                    <span className="text-sm font-black text-amber-400">42 ms <span className="text-[10px] text-zinc-500">(Low)</span></span>
                                </div>
                                <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-zinc-400 uppercase tracking-widest">Inflammation</span>
                                    <span className="text-sm font-black text-amber-400">0.5 mg/L</span>
                                </div>
                                <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <span className="text-xs text-zinc-400 uppercase tracking-widest">Sleep Debt</span>
                                    <span className="text-sm font-black text-red-400">-2.5 hrs</span>
                                </div>
                            </div>

                            {/* AI Insights */}
                            <div>
                                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Oracle Insights</h4>
                                <div className="bg-indigo-950/30 border border-indigo-500/20 p-4 rounded-xl space-y-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-indigo-200/80 leading-relaxed">Elevated cortisol detected. Recommend switching today's Heavy Squats to Active Recovery.</p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <p className="text-xs text-indigo-200/80 leading-relaxed">Nutrigenomic profile suggests adding 500mg Ashwagandha tonight.</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3D Avatar Placeholder */}
                            <div className="flex-1 min-h-[150px] bg-zinc-900/30 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                                <div className="text-center relative z-10">
                                    <HeartPulse className="w-8 h-8 text-indigo-500/50 mx-auto mb-2 animate-pulse" />
                                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">3D Anatomy Syncing...</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Chat Interface */}
                    <div className="flex-1 bg-zinc-900/30 rounded-[2rem] border border-white/10 flex flex-col overflow-hidden relative">
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            <AnimatePresence initial={false}>
                                {messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                msg.sender === 'ai' ? 'bg-indigo-500/20 border border-indigo-500/50' : 'bg-zinc-800 border border-white/10'
                                            }`}>
                                                {msg.sender === 'ai' ? <Brain className="w-4 h-4 text-indigo-400" /> : <div className="w-4 h-4 rounded-full bg-zinc-600" />}
                                            </div>
                                            <div className={`p-4 rounded-2xl ${
                                                msg.sender === 'user' 
                                                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                                                : 'bg-black border border-white/10 text-zinc-300 rounded-tl-sm shadow-[0_5px_20px_rgba(0,0,0,0.3)]'
                                            }`}>
                                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                                <span className={`text-[9px] mt-2 block ${msg.sender === 'user' ? 'text-indigo-300' : 'text-zinc-600'}`}>
                                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            
                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shrink-0">
                                            <Brain className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div className="bg-black border border-white/10 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-black border-t border-white/10">
                            {isListening && (
                                <div className="flex items-center justify-center gap-1 mb-4 h-8">
                                    {[...Array(10)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ height: ['20%', '100%', '20%'] }}
                                            transition={{ duration: 0.5 + Math.random() * 0.5, repeat: Infinity, ease: "easeInOut" }}
                                            className="w-1 bg-indigo-500 rounded-full"
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={toggleListening}
                                    className={`p-4 rounded-xl transition-all ${
                                        isListening 
                                        ? 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse' 
                                        : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5'
                                    }`}
                                >
                                    {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                                </button>
                                
                                <div className="flex-1 relative">
                                    <input 
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask Dr. Aether about your Bio-Pass..."
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                                    />
                                </div>
                                
                                <button 
                                    onClick={handleSend}
                                    disabled={!input.trim() || isTyping}
                                    className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
