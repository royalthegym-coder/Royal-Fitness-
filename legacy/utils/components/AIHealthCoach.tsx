import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Activity, Terminal, Cpu, Zap } from 'lucide-react';
import { ai } from '../../lib/core_ai';
import { motion } from 'motion/react';
import { useData } from '../context/DataProvider';

const AIHealthCoach: React.FC = () => {
    const { liveHealthData, detailedWorkoutLogs, sleepLogs } = useData();
    const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
        { role: 'model', text: "SYSTEM ONLINE. I AM YOUR Fitness Future AI HEALTH COACH. HOW CAN I OPTIMIZE YOUR BIOMETRICS TODAY?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isProactiveMode, setIsProactiveMode] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<any>(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        const initChat = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;
            try {
                // Construct context from user data
                const recentWorkouts = detailedWorkoutLogs.slice(0, 5).map(w => {
                    const sets = w.sets.map(s => `${s.reps} reps @ ${s.weight}kg (RPE ${s.rpe})`).join(', ');
                    return `${w.date}: ${w.exerciseName} - [${sets}]`;
                }).join(' | ');

                const recentSleep = sleepLogs.slice(0, 5).map(s => `${s.date}: ${s.totalHours}h (Quality: ${s.quality}, Efficiency: ${s.efficiency}%)`).join(' | ');
                const lhd = liveHealthData as any;
                const contextData = `
CURRENT BIOMETRICS:
- Heart Rate: ${lhd.heartRate.avg} bpm (Resting: ${lhd.heartRate.resting}, HRV: ${lhd.heartRate.hrv}ms)
- Sleep: ${lhd.sleep.totalHours}h (Deep: ${lhd.sleep.deepHours}h, REM: ${lhd.sleep.remHours}h)
- Activity: ${lhd.steps} steps, ${lhd.calories?.active || 0} kcal burned
- Hydration: ${lhd.hydration}L

RECENT WORKOUT HISTORY:
${recentWorkouts || 'No recent workout data available.'}

RECENT SLEEP HISTORY:
${recentSleep || 'No recent sleep data available.'}
`;

                const modelName = localStorage.getItem('fitness_gemini_model') || 'gemini-4-hydrogen';
                chatRef.current = ai.chats.create({
                    model: modelName,
                    config: {
                        systemInstruction: `You are the 'FitnessFutureAI Health Coach', an elite biological optimization architect for Fitness Future. 
                        Your tone is futuristic, high-tech, and authoritative yet helpful. 
                        Analyze the user's granular workout logs (sets, reps, weight, RPE) and live biometrics to provide hyper-personalized advice.
                        
                        CORE OBJECTIVES:
                        1. Identify performance plateaus or overtraining markers by cross-referencing workout volume/intensity with HRV and Sleep trends.
                        2. Suggest specific tactical adjustments to workouts based on readiness:
                           - If HRV is >10% below baseline or Sleep Efficiency is <75%: Recommend a 'Deload' or 'Active Recovery' session. Suggest reducing volume by 30-50% or intensity by 10-20%.
                           - If HRV is stable and Sleep is optimal: Recommend 'Push' or 'PR Attempt' sessions.
                           - If RPE is consistently high (9-10) but weight is stagnant: Suggest a pivot in exercise selection or a planned deload.
                        3. Optimize recovery protocols (e.g., "Increase magnesium intake", "Add 20min zone 2 cardio for active recovery").
                        4. Provide scientific reasoning (e.g., mentioning Parasympathetic Nervous System state or Central Nervous System fatigue).
                        
                        USER CONTEXT:
                        ${contextData}`
                    }
                });

                if (isProactiveMode) {
                    setLoading(true);
                    setMessages([]);
                    const proactivePrompt = "PROACTIVE COACHING MODE INITIATED. Analyze my current biometrics and recent history. Provide a real-time readiness assessment and suggest immediate workout adjustments for today. Keep it concise, actionable, and in your futuristic tone.";
                    const response = await chatRef.current.sendMessage({ message: proactivePrompt });
                    setMessages([
                        { role: 'model', text: response.text || "SYSTEM ONLINE. I AM YOUR Fitness Future AI HEALTH COACH." }
                    ]);
                    setLoading(false);
                }

            } catch (err) {
                console.error("Failed to initialize AI Chat:", err);
                setLoading(false);
            }
        };
        initChat();
    }, []); // Run once on mount

    // Monitor live health data for proactive alerts
    useEffect(() => {
        if (!isProactiveMode || !chatRef.current || !hasInitialized.current || loading) return;

        const checkBiometrics = async () => {
            // Process a condition where HRV drops significantly or HR spikes
            if (liveHealthData.heartRate.hrv < 40) {
                setLoading(true);
                try {
                    const alertPrompt = `ALERT: My live HRV just dropped to ${liveHealthData.heartRate.hrv}ms. Provide an immediate, short proactive warning and suggest a real-time workout adjustment or recovery protocol.`;
                    const response = await chatRef.current.sendMessage({ message: alertPrompt });
                    setMessages(prev => [...prev, { role: 'model', text: `[PROACTIVE ALERT] ${response.text}` }]);
                } catch (e) {
                    console.error("Proactive Alert Error:", e);
                }
                setLoading(false);
            }
        };

        // In a real app, this would be triggered by actual data changes.
        // We'll just run the check when liveHealthData changes.
        checkBiometrics();
    }, [liveHealthData.heartRate.hrv, isProactiveMode]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !chatRef.current) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatRef.current.sendMessage({ message: userMsg });
            setMessages(prev => [...prev, { role: 'model', text: response.text || "PROCESSING COMPLETE. NO DATA RETURNED." }]);
        } catch (error) {
            console.error("AI Coach Error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "ERROR: NEURAL INTERFERENCE DETECTED. UPLINK FAILED." }]);
        }
        setLoading(false);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col font-mono animate-fade-in">
            {/* Header */}
            <div className="mb-6 bg-black p-8 rounded-[3rem] border border-cyan-500/30 relative overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                {/* Advanced grid scanline */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] opacity-30 pointer-events-none"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8">
                        <div className="relative p-6 bg-gradient-to-br from-cyan-900/50 to-blue-900/50 text-cyan-400 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.3)] border border-cyan-400/50 group-hover:border-cyan-400 transition-colors duration-700">
                             <div className="absolute inset-0 rounded-3xl border border-cyan-400/20 animate-ping opacity-20"></div>
                             <Bot className="w-14 h-14" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Core Engine
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> LINK ACTIVE</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                Fitness Future <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">AI</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-gray-900/50 px-6 py-4 rounded-3xl border border-white/5 backdrop-blur-md">
                        <div className="flex flex-col text-right">
                            <span className="text-white text-sm font-black tracking-widest uppercase">Autonomous</span>
                            <span className="text-cyan-500/70 text-[9px] font-mono tracking-widest uppercase">Proactive Mode</span>
                        </div>
                        <button 
                            onClick={() => setIsProactiveMode(!isProactiveMode)}
                            className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${isProactiveMode ? 'bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.6)]' : 'bg-gray-800 border border-white/10'}`}
                        >
                            <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${isProactiveMode ? 'translate-x-8' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-black/90 border border-cyan-500/30 rounded-[2.5rem] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.1)] relative">
                {/* Advanced Scanline effect */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:100%_4px] opacity-30 z-0 mix-blend-screen"></div>
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-blue-500 to-fuchsia-500 opacity-20"></div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
                    {messages.map((msg, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={idx} 
                            className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'model' && (
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-900/80 to-blue-900/80 flex items-center justify-center border border-cyan-500/50 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                    <Bot className="w-6 h-6 text-cyan-400" />
                                </div>
                            )}
                            <div className={`max-w-[80%] p-4 ${
                                msg.role === 'user' 
                                ? 'bg-white/5 text-gray-100 border border-white/10 rounded-l-2xl rounded-br-2xl' 
                                : 'bg-gray-900/80 text-cyan-100 border border-cyan-500/30 rounded-r-2xl rounded-bl-2xl shadow-[inset_0_0_30px_rgba(6,182,212,0.05)] backdrop-blur-md'
                            }`}>
                                <p className="whitespace-pre-wrap leading-relaxed text-sm tracking-wide font-sans">{msg.text}</p>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex gap-4 justify-start">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-900/80 to-blue-900/80 flex items-center justify-center border border-cyan-500/50 shrink-0">
                                <Zap className="w-6 h-6 text-cyan-400 animate-pulse" />
                            </div>
                            <div className="bg-gray-900/80 text-cyan-400 border border-cyan-500/30 rounded-r-2xl rounded-bl-2xl p-5 flex items-center gap-3 backdrop-blur-md">
                                <span className="text-xs tracking-widest uppercase">Processing</span>
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-4 bg-cyan-400 animate-pulse"></div>
                                    <div className="w-1.5 h-4 bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-1.5 h-4 bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-6 border-t border-cyan-500/30 bg-black/90 backdrop-blur-xl relative z-10 rounded-b-[2.5rem]">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                <span className="text-cyan-500 font-black animate-pulse">{'>'}</span>
                            </div>
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="ENTER DIRECTIVE TO FITNESS FUTURE AI..."
                                className="w-full bg-cyan-950/20 border border-cyan-500/50 rounded-2xl pl-12 pr-6 py-5 text-cyan-300 placeholder-cyan-800 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all uppercase text-sm tracking-widest font-mono"
                            />
                        </div>
                        <button 
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="relative bg-gradient-to-r from-cyan-600 to-blue-600 text-white border border-cyan-400/50 px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:from-cyan-500 hover:to-blue-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale active:scale-95 group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <Send className="w-5 h-5 relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            <span className="relative z-10">Execute</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIHealthCoach;
