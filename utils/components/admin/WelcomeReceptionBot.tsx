import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    MessageCircle, Send, User, Bot, Activity, HeartPulse, 
    Brain, ShieldAlert, CheckCircle2, AlertTriangle, FileJson,
    Smartphone, Zap, Loader2
} from 'lucide-react';
import { ai } from '../../../lib/core_ai';

interface ChatMessage {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    options?: string[];
}

export const WelcomeReceptionBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [profileGenerated, setProfileGenerated] = useState(false);
    const [medicalProfile, setMedicalProfile] = useState<any>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [chatSession, setChatSession] = useState<any>(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                const chat = ai.chats.create({
                    model: 'gemini-4-hydrogen',
                    config: {
                        systemInstruction: `You are Bio-Cloud Oracle, Fitness Future's AI Medical Assistant. Your goal is to conduct a 'Biological Coding' intake via chat to generate a medical profile.
                        Ask questions one by one in English only and strictly do NOT use any Hindi words or characters.
                        Phase 1: Metabolic Baseline (Age, Weight, Height)
                        Phase 2: Lifestyle & Circadian Rhythm (Sleep quality, digestion)
                        Phase 3: Symptom Tracker (Joint pain, cramps)
                        Phase 4: Medical History (Chronic illness, supplements)
                        
                        Once you have gathered all information, output a final message starting with "PROFILE_COMPLETE:" followed by a JSON object representing the user's health profile.
                        The JSON should have this structure:
                        {
                          "member_id": "RTG_NEW",
                          "health_profile": {
                            "metabolic_score": number (0-100),
                            "circadian_alignment": string,
                            "potential_deficiencies": [{ "nutrient": string, "probability": string, "reason": string }],
                            "injury_risk_zones": [string],
                            "action": string
                          }
                        }
                        Do not output markdown formatting for the JSON, just the raw JSON string after "PROFILE_COMPLETE:".
                        Start by greeting the user and asking if they are ready to begin.`,
                    }
                });
                setChatSession(chat);
                
                setIsTyping(true);
                const response = await chat.sendMessage({ message: "Start the intake process." });
                setMessages([{ id: Date.now().toString(), sender: 'bot', text: response.text || "Hello! I am Bio-Cloud Oracle. Shall we begin?" }]);
                setIsTyping(false);
            } catch (error) {
                console.error("Error initializing chat:", error);
                setMessages([{ id: '1', sender: 'bot', text: 'Error connecting to AI.' }]);
                setIsTyping(false);
            }
        };

        initChat();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || !chatSession) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
        setIsTyping(true);

        try {
            const response = await chatSession.sendMessage({ message: userMsg });
            let botText = response.text || "";
            
            if (botText.includes("PROFILE_COMPLETE:")) {
                const parts = botText.split("PROFILE_COMPLETE:");
                const chatPart = parts[0].trim();
                const jsonPart = parts[1].trim();
                
                if (chatPart) {
                    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: chatPart }]);
                }
                
                try {
                    // Clean up potential markdown formatting
                    let cleanJson = jsonPart;
                    if (cleanJson.startsWith('```json')) {
                        cleanJson = cleanJson.substring(7);
                    }
                    if (cleanJson.startsWith('```')) {
                        cleanJson = cleanJson.substring(3);
                    }
                    if (cleanJson.endsWith('```')) {
                        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
                    }
                    
                    const profile = JSON.parse(cleanJson.trim());
                    setMedicalProfile(profile);
                    setProfileGenerated(true);
                    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: "Thank you! 🙏 I have analyzed your data and your medical profile is ready. 🧬" }]);
                } catch (e) {
                    console.error("Failed to parse profile JSON:", e, jsonPart);
                    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: "There was a technical issue while generating your profile." }]);
                }
            } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: botText }]);
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: "Sorry, I had trouble understanding. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="bg-black border border-emerald-500/30 rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)] shrink-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Bot Active</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            Member <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Intake</span>
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono mt-2 max-w-2xl">
                            Dynamic & Adaptive Medical Questionnaire. Generates real-time Bio-Cloud profiles and Deficiency Maps using Core AI AI.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                
                {/* Left Column: Chat Interface */}
                <div className="bg-[#0b141a] border border-white/10 rounded-[2rem] flex flex-col relative overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="bg-[#202c33] p-4 flex items-center gap-4 shrink-0 z-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                            <Bot className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Bio-Cloud Oracle</h3>
                            <p className="text-xs text-emerald-400">online</p>
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-cover bg-center bg-opacity-10 relative">
                        <div className="absolute inset-0 bg-[#0b141a]/90"></div>
                        
                        <div className="relative z-10 space-y-4">
                            <AnimatePresence>
                                {messages.map((msg) => (
                                    <motion.div 
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm ${
                                            msg.sender === 'user' 
                                                ? 'bg-[#005c4b] text-white rounded-tr-none' 
                                                : 'bg-[#202c33] text-zinc-200 rounded-tl-none'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {isTyping && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-start"
                                >
                                    <div className="bg-[#202c33] p-3 rounded-2xl rounded-tl-none flex gap-1">
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="bg-[#202c33] p-3 flex items-center gap-3 shrink-0 z-10">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Type a message..."
                            className="flex-1 bg-[#2a3942] rounded-full px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            disabled={isTyping}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isTyping || !input.trim()}
                            className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
                        >
                            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                        </button>
                    </div>
                </div>

                {/* Right Column: AI Analysis & Deficiency Map */}
                <div className="flex flex-col gap-6 min-h-0">
                    
                    {/* The Deficiency Map */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 flex-1 relative overflow-hidden group hover:border-cyan-500/30 transition-colors flex flex-col">
                        <div className="flex items-center gap-3 mb-6 shrink-0 z-10">
                            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><Activity className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">The Deficiency Map</h3>
                                <p className="text-[10px] font-mono text-cyan-400/70 uppercase">Real-time Bio-Cloud Analysis</p>
                            </div>
                        </div>

                        {!profileGenerated ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 relative z-10">
                                <Brain className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
                                <p className="text-xs font-mono uppercase tracking-widest text-center">Awaiting Intake Data...<br/>Analyzing responses in real-time.</p>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex flex-col relative z-10"
                            >
                                <div className="flex-1 flex items-center justify-center relative">
                                    {/* Abstract 3D Body Representation */}
                                    <div className="w-32 h-64 border-2 border-white/10 rounded-full relative flex flex-col items-center justify-between py-4">
                                        {/* Head */}
                                        <div className="w-12 h-16 border-2 border-emerald-500/50 rounded-full bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
                                        {/* Torso */}
                                        <div className="w-20 h-24 border-2 border-amber-500/50 rounded-[2rem] bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] relative">
                                            {medicalProfile?.health_profile?.circadian_alignment && (
                                                <div className="absolute -right-24 top-4 bg-amber-500/20 border border-amber-500/50 px-2 py-1 rounded text-[8px] font-bold text-amber-400 whitespace-nowrap">
                                                    {medicalProfile.health_profile.circadian_alignment}
                                                </div>
                                            )}
                                        </div>
                                        {/* Legs */}
                                        <div className="flex gap-2 h-20">
                                            <div className={`w-6 h-full border-2 rounded-full relative ${medicalProfile?.health_profile?.injury_risk_zones?.length > 0 ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-emerald-500/50 bg-emerald-500/10'}`}>
                                                {medicalProfile?.health_profile?.injury_risk_zones?.map((zone: string, idx: number) => (
                                                    <div key={idx} className="absolute -left-24 top-8 bg-red-500/20 border border-red-500/50 px-2 py-1 rounded text-[8px] font-bold text-red-400 whitespace-nowrap">
                                                        {zone} Risk
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="w-6 h-full border-2 border-amber-500/50 rounded-full bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] relative">
                                                {medicalProfile?.health_profile?.potential_deficiencies?.slice(0,1).map((def: any, idx: number) => (
                                                    <div key={idx} className="absolute -right-24 bottom-2 bg-amber-500/20 border border-amber-500/50 px-2 py-1 rounded text-[8px] font-bold text-amber-400 whitespace-nowrap">
                                                        {def.nutrient} Def.
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-4 shrink-0">
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 text-center">
                                        <span className="block w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></span>
                                        <span className="text-[8px] font-bold text-red-400 uppercase">Injury Risk</span>
                                    </div>
                                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center">
                                        <span className="block w-3 h-3 bg-amber-500 rounded-full mx-auto mb-1"></span>
                                        <span className="text-[8px] font-bold text-amber-400 uppercase">Deficiency</span>
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2 text-center">
                                        <span className="block w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-1"></span>
                                        <span className="text-[8px] font-bold text-emerald-400 uppercase">Optimized</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* JSON Profile Output */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 shrink-0 relative overflow-hidden group hover:border-fuchsia-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="p-3 bg-fuchsia-500/10 rounded-xl text-fuchsia-400"><FileJson className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Medical Profile</h3>
                                <p className="text-[10px] font-mono text-fuchsia-400/70 uppercase">Generated JSON Schema</p>
                            </div>
                        </div>

                        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 overflow-x-auto relative z-10 max-h-48">
                            {!profileGenerated ? (
                                <p className="text-xs font-mono text-zinc-600">Waiting for data...</p>
                            ) : (
                                <pre className="text-[10px] font-mono text-zinc-300">
                                    {JSON.stringify(medicalProfile, null, 2)}
                                </pre>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

