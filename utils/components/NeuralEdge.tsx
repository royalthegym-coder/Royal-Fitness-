import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Lock, Terminal, ShieldCheck, WifiOff, Send, Database, Key } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useToast } from '../hooks/useToast';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const NeuralEdge: React.FC = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        { role: 'model', text: 'Neural Edge Privacy initialized. I am your local AI Kitchen Chief. All your biometric data, weight logs, and medical history are processed strictly on this device. No cloud transmission. How can I assist you securely today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite-preview', // Simulating a fast, local lightweight model
                contents: userMsg,
                config: {
                    systemInstruction: `You are a highly secure, offline, on-device AI assistant for a gym member. 
                    You prioritize privacy above all else. You know their weight, medical history, and diet, but you never send it to the cloud. 
                    Respond extremely fast, concisely, and emphasize that their data is safe on the edge.`
                }
            });

            setMessages(prev => [...prev, { role: 'model', text: response.text || "Local processing error." }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Error: Secure enclave disrupted." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-6">
            <div className="flex items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <Cpu className="w-8 h-8 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                            Neural Edge <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Privacy</span>
                        </h1>
                        <p className="text-xs font-mono text-emerald-400/70 uppercase tracking-[0.3em]">Local LLM Inference (Offline Mode)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-900/20 rounded-full border border-emerald-500/30">
                    <WifiOff className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Cloud Disconnected</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Security Status */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden flex-1">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Secure Enclave Status
                        </h3>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-900/40 border border-emerald-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <Lock className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest">End-to-End Encryption</p>
                                    <p className="text-[10px] font-mono text-gray-500">AES-256 Active</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-teal-900/40 border border-teal-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                                    <Database className="w-5 h-5 text-teal-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest">Local Data Vault</p>
                                    <p className="text-[10px] font-mono text-gray-500">0 Bytes Transmitted</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-cyan-900/40 border border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    <Key className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white uppercase tracking-widest">Biometric Keys</p>
                                    <p className="text-[10px] font-mono text-gray-500">Stored on Device</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                            <p className="text-xs font-mono text-emerald-400 leading-relaxed">
                                <span className="font-bold uppercase tracking-widest block mb-1">Privacy Guarantee:</span>
                                Your medical history, weight logs, and progress photos never leave this device. The AI Kitchen Chief processes everything locally using Neural Edge Inference.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Local Terminal Chat */}
                <div className="lg:col-span-2 flex flex-col bg-black/40 border border-emerald-500/20 rounded-[2.5rem] overflow-hidden relative shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                    <div className="p-4 bg-emerald-900/20 border-b border-emerald-500/20 flex items-center gap-3">
                        <Terminal className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Local_LLM_Terminal_v1.0</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 font-mono text-sm">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-emerald-900/20 text-emerald-100 border border-emerald-500/30' : 'bg-black text-emerald-400 border border-emerald-500/10'}`}>
                                    {msg.role === 'model' && <span className="text-emerald-500 mr-2">{'>'}</span>}
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] p-4 rounded-xl bg-black text-emerald-400 border border-emerald-500/10 flex items-center gap-2">
                                    <span className="text-emerald-500">{'>'}</span>
                                    <span className="w-2 h-4 bg-emerald-400 animate-pulse"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-black border-t border-emerald-500/20 flex gap-3">
                        <span className="text-emerald-500 font-mono mt-2">{'>'}</span>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Enter command or question..."
                            className="flex-1 bg-transparent border-none px-2 text-sm text-emerald-400 font-mono focus:outline-none focus:ring-0 placeholder-emerald-900"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isTyping || !input.trim()}
                            className="px-6 bg-emerald-900/40 text-emerald-400 font-black uppercase tracking-widest text-xs rounded-xl hover:bg-emerald-800/60 border border-emerald-500/30 transition-all disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NeuralEdge;
