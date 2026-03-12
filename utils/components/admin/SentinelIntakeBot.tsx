import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    MessageCircle, Send, User, Bot, Activity, HeartPulse, 
    Brain, ShieldAlert, CheckCircle2, AlertTriangle, FileJson,
    Smartphone, Zap
} from 'lucide-react';

interface ChatMessage {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    options?: string[];
}

export const SentinelIntakeBot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [profileGenerated, setProfileGenerated] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const chatScript = [
        {
            bot: "नमस्ते! मैं Bio-Aether Oracle हूँ, Royal The Gym का AI Medical Assistant. 🤖\nक्या हम आपकी 'Biological Coding' शुरू करें?",
            options: ["हाँ, शुरू करें 🚀"]
        },
        {
            bot: "Phase 1: Metabolic Baseline 📊\nआपकी उम्र, वजन और ऊंचाई क्या है? (उदा: 28, 75kg, 5'10)",
            options: ["28, 78kg, 5'9\""]
        },
        {
            bot: "Phase 2: Lifestyle & Circadian Rhythm 🌙\nक्या आप सुबह उठने पर फ्रेश महसूस करते हैं, या थकान रहती है?",
            options: ["थकान रहती है, नींद पूरी नहीं लगती 😴"]
        },
        {
            bot: "क्या आपको खाने के बाद भारीपन या गैस महसूस होती है?",
            options: ["हाँ, कभी-कभी भारीपन लगता है 🍔"]
        },
        {
            bot: "Phase 3: Symptom Tracker 🦴\nक्या वर्कआउट के दौरान घुटनों या कंधों में 'चटकने' की आवाज आती है?",
            options: ["हाँ, दायें घुटने में चटकने की आवाज आती है 🦵"]
        },
        {
            bot: "क्या रात को सोते समय पैरों में खिंचाव (Cramps) महसूस होता है?",
            options: ["हाँ, पिंडलियों में खिंचाव होता है ⚡"]
        },
        {
            bot: "Phase 4: Medical History 🏥\nक्या आपको कोई पुरानी बीमारी, चोट या आप कोई सप्लीमेंट ले रहे हैं?",
            options: ["कोई बीमारी नहीं, बस व्हे प्रोटीन ले रहा हूँ 🥤"]
        },
        {
            bot: "धन्यवाद! 🙏 मैं आपके डेटा को एनालाइज कर रहा हूँ... 🧬",
            options: []
        }
    ];

    useEffect(() => {
        // Initial message
        if (messages.length === 0) {
            simulateBotTyping(chatScript[0].bot, chatScript[0].options);
        }
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const simulateBotTyping = (text: string, options?: string[]) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text, options }]);
            setIsTyping(false);
            
            if (currentStep === chatScript.length - 1) {
                setTimeout(() => {
                    setProfileGenerated(true);
                }, 2000);
            }
        }, 1500);
    };

    const handleUserReply = (text: string) => {
        // Remove options from previous bot message
        setMessages(prev => {
            const newMsgs = [...prev];
            if (newMsgs.length > 0) {
                newMsgs[newMsgs.length - 1].options = undefined;
            }
            return [...newMsgs, { id: Date.now().toString(), sender: 'user', text }];
        });

        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);

        if (nextStep < chatScript.length) {
            simulateBotTyping(chatScript[nextStep].bot, chatScript[nextStep].options);
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
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">WhatsApp Bot Active</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            The Sentinel <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Intake</span>
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono mt-2 max-w-2xl">
                            Dynamic & Adaptive Medical Questionnaire via WhatsApp. Generates real-time Bio-Aether profiles and Deficiency Maps without requiring app installation.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                
                {/* Left Column: WhatsApp Interface */}
                <div className="bg-[#0b141a] border border-white/10 rounded-[2rem] flex flex-col relative overflow-hidden shadow-2xl">
                    {/* WA Header */}
                    <div className="bg-[#202c33] p-4 flex items-center gap-4 shrink-0 z-10">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                            <Bot className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Royal The Gym AI</h3>
                            <p className="text-xs text-emerald-400">online</p>
                        </div>
                    </div>

                    {/* WA Chat Area */}
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
                                        
                                        {msg.options && msg.options.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {msg.options.map((opt, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => handleUserReply(opt)}
                                                        className="px-4 py-2 bg-[#202c33] border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-bold hover:bg-[#2a3942] transition-colors"
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
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

                    {/* WA Input Area */}
                    <div className="bg-[#202c33] p-3 flex items-center gap-3 shrink-0 z-10">
                        <div className="flex-1 bg-[#2a3942] rounded-full px-4 py-3 text-sm text-zinc-400">
                            Type a message...
                        </div>
                        <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white">
                            <Send className="w-5 h-5 ml-1" />
                        </div>
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
                                <p className="text-[10px] font-mono text-cyan-400/70 uppercase">Real-time Bio-Aether Analysis</p>
                            </div>
                        </div>

                        {!profileGenerated ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 relative z-10">
                                <Brain className="w-12 h-12 mb-4 opacity-20 animate-pulse" />
                                <p className="text-xs font-mono uppercase tracking-widest text-center">Awaiting Sentinel Intake Data...<br/>Analyzing responses in real-time.</p>
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
                                            <div className="absolute -right-16 top-4 bg-amber-500/20 border border-amber-500/50 px-2 py-1 rounded text-[8px] font-bold text-amber-400 whitespace-nowrap">
                                                Digestion / Gas
                                            </div>
                                        </div>
                                        {/* Legs */}
                                        <div className="flex gap-2 h-20">
                                            <div className="w-6 h-full border-2 border-red-500/50 rounded-full bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)] relative">
                                                <div className="absolute -left-20 top-8 bg-red-500/20 border border-red-500/50 px-2 py-1 rounded text-[8px] font-bold text-red-400 whitespace-nowrap">
                                                    Right Knee Click
                                                </div>
                                            </div>
                                            <div className="w-6 h-full border-2 border-amber-500/50 rounded-full bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)] relative">
                                                <div className="absolute -right-16 bottom-2 bg-amber-500/20 border border-amber-500/50 px-2 py-1 rounded text-[8px] font-bold text-amber-400 whitespace-nowrap">
                                                    Calf Cramps
                                                </div>
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

                        <div className="bg-[#0a0a0a] rounded-xl border border-white/5 p-4 overflow-x-auto relative z-10">
                            {!profileGenerated ? (
                                <p className="text-xs font-mono text-zinc-600">Waiting for data...</p>
                            ) : (
                                <pre className="text-[10px] font-mono text-zinc-300">
{`{
  "member_id": "RTG_786",
  "health_profile": {
    "metabolic_score": 72,
    "circadian_alignment": "Off-Sync (Fatigue)",
    "potential_deficiencies": [
      {
        "nutrient": "Vitamin D3", 
        "probability": "High", 
        "reason": "Fatigue + Joint clicking"
      },
      {
        "nutrient": "Magnesium", 
        "probability": "High", 
        "reason": "Calf cramps reported"
      }
    ],
    "injury_risk_zones": ["Right Knee"],
    "action": "Trigger AI Kitchen Chief to add D3 & Mg rich foods."
  }
}`}
                                </pre>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
