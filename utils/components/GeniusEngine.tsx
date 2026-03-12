import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Send, Bot, Sparkles, Database, Network, Cpu, Search, Activity, ShieldCheck, RefreshCw, X, FileText, Upload, User, Image as ImageIcon, Volume2, Zap, Fingerprint, Radio } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Modality } from '@google/genai';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const AGENTS = [
    { id: 'omni', name: 'Omni-Core', role: 'General Intelligence', icon: <BrainCircuit className="w-5 h-5" />, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
    { id: 'medical', name: 'Bio-Genius', role: 'Medical & Biomechanics', icon: <Activity className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    { id: 'fitness', name: 'Kinetics-Bot', role: 'Workout & Performance', icon: <Cpu className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    { id: 'data', name: 'Neuro-Analyst', role: 'Data & Analytics', icon: <Database className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    { id: 'vision', name: 'Vision-Crafter', role: 'Image Synthesis', icon: <ImageIcon className="w-5 h-5" />, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
];

const GeniusEngine: React.FC = () => {
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, agentId?: string, image?: string}[]>([
        { role: 'model', text: 'Neural Networks Genius Engine initialized. I am your open-source AI-powered core. I now have access to real-time biometrics, deep reasoning, image synthesis, and neural voice output. How can I assist you today?', agentId: 'omni' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [activeAgent, setActiveAgent] = useState('omni');
    const [attachedFiles, setAttachedFiles] = useState<{name: string, data: string, type: string}[]>([]);
    const [isDeepThinking, setIsDeepThinking] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useToast();
    const { liveHealthData } = useData();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const files = Array.from(target.files || []) as File[];
        if (files.length === 0) return;

        try {
            const newFiles: {name: string, data: string, type: string}[] = [];
            const MAX_SIZE = 10 * 1024 * 1024;
            
            for (const file of files) {
                if (file.size > MAX_SIZE) {
                    addToast(`Skipped ${file.name}: File too large (>10MB)`, "error");
                    continue;
                }

                let mimeType = file.type;
                if (!mimeType) {
                    if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
                    else if (file.name.endsWith('.csv')) mimeType = 'text/csv';
                    else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
                    else mimeType = 'application/octet-stream';
                }

                const reader = new FileReader();
                await new Promise<void>((resolve, reject) => {
                    reader.onload = () => {
                        const res = reader.result?.toString();
                        if (res) {
                            newFiles.push({ name: file.name, data: res, type: mimeType });
                        }
                        resolve();
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            }
            
            setAttachedFiles(prev => [...prev, ...newFiles]);
            addToast(`${newFiles.length} file(s) attached to neural link.`, "success");
            
            try { if (target) target.value = ''; } catch(e) {}
        } catch (error) {
            addToast("Failed to read files.", "error");
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const cleanBase64 = (b64: string) => {
        const match = b64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
        if (match) {
            return b64.replace(match[0], "");
        }
        return b64;
    };

    const handleSpeak = async (text: string, index: number) => {
        if (isSpeaking === index) return;
        setIsSpeaking(index);
        try {
            // Clean markdown for speech
            const cleanText = text.replace(/[*#_`]/g, '').substring(0, 800); 
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Say in a confident, futuristic AI voice: ${cleanText}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                    },
                },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
                audio.onended = () => setIsSpeaking(null);
                await audio.play();
            } else {
                setIsSpeaking(null);
            }
        } catch (e) {
            console.error(e);
            setIsSpeaking(null);
            addToast("Neural TTS failed.", "error");
        }
    };

    const handleSend = async () => {
        if (!input.trim() && attachedFiles.length === 0) return;

        const userMsg = input;
        const currentFiles = [...attachedFiles];
        
        setMessages(prev => [...prev, { role: 'user', text: userMsg + (currentFiles.length > 0 ? ` [Attached ${currentFiles.length} files]` : '') }]);
        setInput('');
        setAttachedFiles([]);
        setIsTyping(true);

        try {
            const agent = AGENTS.find(a => a.id === activeAgent) || AGENTS[0];
            
            // Handle Image Generation Agent
            if (agent.id === 'vision') {
                const response = await ai.models.generateContent({
                    model: 'gemini-3.1-flash-image-preview',
                    contents: { parts: [{ text: userMsg }] },
                    config: {
                        imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
                    }
                });
                
                let imageUrl = '';
                for (const part of response.candidates?.[0]?.content?.parts || []) {
                    if (part.inlineData) {
                        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                        break;
                    }
                }
                
                if (imageUrl) {
                    setMessages(prev => [...prev, { role: 'model', text: "Image synthesized successfully based on your parameters.", agentId: activeAgent, image: imageUrl }]);
                } else {
                    setMessages(prev => [...prev, { role: 'model', text: "Failed to synthesize image. Neural pathways disrupted.", agentId: activeAgent }]);
                }
                setIsTyping(false);
                return;
            }

            // Handle Text/Multimodal Agents
            let systemInstruction = `You are ${agent.name}, an advanced AI-powered Genius Engine module. Role: ${agent.role}. 
            You are part of the Latest Open-Source AI-POWERED Neural Networks Genius Engine. 
            Provide highly intelligent, analytical, and futuristic responses. Use markdown for formatting.
            
            CURRENT REAL-TIME BIOMETRIC CONTEXT OF USER:
            - Heart Rate: ${liveHealthData.heartRate.current} bpm
            - Hydration: ${liveHealthData.hydration}%
            - Energy Level: ${liveHealthData.energyLevel}%
            - Stress Level: ${liveHealthData.stressLevel}%
            
            Tailor your responses considering these real-time biometric markers if relevant to the query.`;

            const parts: any[] = [];
            if (currentFiles.length > 0) {
                currentFiles.forEach(file => {
                    parts.push({
                        inlineData: {
                            data: cleanBase64(file.data),
                            mimeType: file.type
                        }
                    });
                });
            }
            if (userMsg) {
                parts.push({ text: userMsg });
            }

            const config: any = {
                systemInstruction,
                tools: [{ googleSearch: {} }],
                thinkingConfig: isDeepThinking ? { thinkingLevel: ThinkingLevel.HIGH } : { thinkingLevel: ThinkingLevel.LOW }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: { parts },
                config
            });

            const responseText = response.text || "Neural connection interrupted. Please try again.";
            
            setMessages(prev => [...prev, { role: 'model', text: responseText, agentId: activeAgent }]);

        } catch (error) {
            console.error("Genius Engine Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "ERROR: Neural network overload. The Genius Engine encountered a fault.", agentId: activeAgent }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="h-full flex flex-col animate-fade-in relative z-10">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)] backdrop-blur-xl gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] relative group">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full group-hover:bg-indigo-400/40 transition-all"></div>
                        <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse relative z-10" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                            Genius <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Engine</span>
                        </h1>
                        <p className="text-xs font-mono text-indigo-400/70 uppercase tracking-[0.3em]">Advanced Neural Network v32.0</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Live Biometric Feed Indicator */}
                    <div className="flex items-center gap-3 px-4 py-2 bg-emerald-900/20 rounded-full border border-emerald-500/30">
                        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Bio-Sync Active</span>
                    </div>
                    
                    {/* Deep Reasoning Toggle */}
                    <button 
                        onClick={() => setIsDeepThinking(!isDeepThinking)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isDeepThinking ? 'bg-purple-900/40 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'bg-gray-900/40 border-gray-700 text-gray-500 hover:text-gray-300'}`}
                    >
                        <Zap className={`w-4 h-4 ${isDeepThinking ? 'text-purple-400 animate-pulse' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Quantum Reasoning</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                {/* Left Sidebar - Agent Selection */}
                <div className="w-full md:w-64 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 shrink-0">
                    <div className="bg-black/40 border border-white/5 rounded-3xl p-5">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Network className="w-3 h-3" /> Neural Bots
                        </h3>
                        <div className="space-y-3">
                            {AGENTS.map(agent => (
                                <button
                                    key={agent.id}
                                    onClick={() => setActiveAgent(agent.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${activeAgent === agent.id ? `${agent.bg} ${agent.border} shadow-[0_0_15px_rgba(255,255,255,0.05)]` : 'border-transparent hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                                >
                                    <div className={`p-2 rounded-xl ${agent.bg} ${agent.color}`}>
                                        {agent.icon}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-xs font-bold uppercase tracking-wider ${activeAgent === agent.id ? 'text-white' : 'text-gray-400'}`}>{agent.name}</p>
                                        <p className="text-[9px] text-gray-500 font-mono truncate">{agent.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-3xl p-5 mt-auto">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Active Capabilities
                        </h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-900/20 p-2 rounded-lg border border-cyan-500/20">
                                <Search className="w-3 h-3" /> Live Web Grounding
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-purple-400 bg-purple-900/20 p-2 rounded-lg border border-purple-500/20">
                                <Volume2 className="w-3 h-3" /> Neural TTS Voice
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-900/20 p-2 rounded-lg border border-emerald-500/20">
                                <Fingerprint className="w-3 h-3" /> Bio-Metric Context
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-pink-400 bg-pink-900/20 p-2 rounded-lg border border-pink-500/20">
                                <ImageIcon className="w-3 h-3" /> Image Synthesis
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-black/40 border border-white/5 rounded-[2.5rem] overflow-hidden relative shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
                    
                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 relative z-10">
                        {messages.map((msg, idx) => {
                            const agent = msg.agentId ? AGENTS.find(a => a.id === msg.agentId) : null;
                            return (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-white text-black' : agent ? `${agent.bg} ${agent.color} border ${agent.border}` : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                                            {msg.role === 'user' ? <User className="w-5 h-5" /> : (agent?.icon || <Bot className="w-5 h-5" />)}
                                        </div>
                                        <div className={`p-5 rounded-3xl relative group ${msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-none border border-white/10' : 'bg-gray-900/80 text-gray-200 border border-white/5 rounded-tl-none shadow-[0_10px_40px_rgba(0,0,0,0.5)]'}`}>
                                            {msg.role === 'model' && agent && (
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${agent.color}`}>{agent.name}</p>
                                                    <button 
                                                        onClick={() => handleSpeak(msg.text, idx)}
                                                        className={`p-1.5 rounded-lg transition-colors ${isSpeaking === idx ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                        title="Read Aloud"
                                                    >
                                                        <Volume2 className={`w-3 h-3 ${isSpeaking === idx ? 'animate-pulse' : ''}`} />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            {msg.image && (
                                                <div className="mb-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                                                    <img src={msg.image} alt="Synthesized Output" className="w-full h-auto object-cover" />
                                                </div>
                                            )}

                                            <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                                {msg.text}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                    </div>
                                    <div className="p-4 rounded-2xl bg-gray-900/80 border border-white/5 rounded-tl-none flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-gray-950 border-t border-white/5 relative z-10">
                        {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 px-2">
                                {attachedFiles.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-gray-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-300">
                                        <FileText className="w-3 h-3 text-indigo-400" />
                                        <span className="truncate max-w-[150px]">{file.name}</span>
                                        <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300 ml-1">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-3">
                            <label className="p-4 bg-gray-900 border border-white/10 rounded-2xl text-gray-400 hover:text-white hover:border-indigo-500/50 transition-all cursor-pointer flex items-center justify-center group">
                                <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="*/*" />
                            </label>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={activeAgent === 'vision' ? "Describe the image you want to synthesize..." : "Query the Genius Engine..."}
                                className="flex-1 bg-gray-900 border border-white/10 rounded-2xl px-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-gray-600"
                            />
                            <button
                                onClick={handleSend}
                                disabled={isTyping || (!input.trim() && attachedFiles.length === 0)}
                                className="px-8 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                            >
                                <Send className="w-4 h-4" /> Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeniusEngine;
