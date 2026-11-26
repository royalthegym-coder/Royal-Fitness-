import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, Unlock, BrainCircuit, Sparkles, Activity, Cpu, 
  Layers, Bot, Zap, Play, Send, Terminal, ArrowRight, ShieldCheck, TrendingUp
} from 'lucide-react';
import { useData } from '../../context/DataProvider';

interface GoogleAIStudioSuggestionsProps {
    currentUser?: {
        type: 'super_admin' | 'admin' | 'member';
        name: string;
        email?: string;
    } | null;
}

export const GoogleAIStudioSuggestions: React.FC<GoogleAIStudioSuggestionsProps> = ({ currentUser }) => {
    const isSuperAdmin = currentUser?.type === 'super_admin';
    const { members, leads } = useData();
    const [prompt, setPrompt] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simLogs, setSimLogs] = useState<string[]>([]);
    const [simAnswer, setSimAnswer] = useState<string | null>(null);

    // Dynamic advice templates
    const memberCount = members?.length || 0;
    const leadCount = leads?.length || 0;

    const runSimulation = (customPrompt?: string) => {
        const query = customPrompt || prompt || "Optimize Business Expansion Vectors";
        setIsSimulating(true);
        setSimAnswer(null);
        setSimLogs([]);

        const logs = [
            'Initializing Neural Core handshake...',
            'Acquiring temporal active statistics...',
            `Injecting data context: ${memberCount} active members, ${leadCount} active leads.`,
            'Calculating stochastic churn parameters...',
            'Synthesizing multi-modal growth projections...',
            'Assembling neural executive reports...'
        ];

        logs.forEach((log, index) => {
            setTimeout(() => {
                setSimLogs(prev => [...prev, `[CORE-${100 + index * 12}] ${log}`]);
            }, (index + 1) * 450);
        });

        setTimeout(() => {
            setIsSimulating(false);
            setSimAnswer(
                `Smart Neural has successfully resolved optimizations for "${query}":\n\n` +
                `1. 【TRAFFIC DENSITY DETECTED】 Peak hours are heavily utilizing gym floors. Recommendation is to activate dynamic scheduling with automated push rewards for off-peak sessions.\n` +
                `2. 【LEAD CONVERSION MODEL】 Speed-to-lead index is healthy but could trigger automatic autonomous SMS follow-up triggers for leads exceeding 15 minutes without agent touch base.\n` +
                `3. 【FINANCIAL PROJECTIONS】 Upselling high-performance supplements inside the Pro Shop could boost monthly recurring revenues by approximately 14.8%.`
            );
        }, logs.length * 480 + 300);
    };

    if (!isSuperAdmin) {
        // Locked View
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-8 text-center bg-black/45 border border-red-500/20 rounded-[3rem] backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-red-900/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="p-8 mb-6 rounded-[2.5rem] bg-red-950/30 border border-red-500/40 relative shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <div className="absolute inset-0 border border-red-400 rounded-[2.5rem] animate-ping opacity-20"></div>
                        <Lock className="w-16 h-16 text-red-500" />
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mb-4">
                        Smart Neural <span className="text-red-500">Locked</span>
                    </h2>
                    
                    <p className="text-gray-400 text-sm font-mono max-w-lg mb-8 leading-relaxed uppercase tracking-widest font-bold">
                        This advanced artificial intelligence neural engine is currently secured. Premium Super Admin operating license is required to unseal this master architecture.
                    </p>
                    
                    <div className="px-6 py-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/30 font-black uppercase tracking-[0.2em] text-[10px]">
                        Access Denied • Super Admin Console Authorized Only
                    </div>
                </div>
            </div>
        );
    }

    // Unlocked Super Admin View
    return (
        <div className="space-y-8 animate-fade-in p-2">
            {/* Header banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-8 rounded-[2.5rem] bg-gradient-to-r from-fuchsia-950/20 via-black/40 to-cyan-950/20 border border-fuchsia-500/20 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-fuchsia-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px]"></div>
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-5 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                        <BrainCircuit className="w-12 h-12 text-fuchsia-400 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest">Master Neural Panel</span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1">
                                <Unlock className="w-3 h-3" /> Unlocked
                            </span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter mt-2">
                            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">Neural</span> Core
                        </h2>
                        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-1">
                            Central nervous system orchestrating physical fitness analytics & business growth diagnostics
                        </p>
                    </div>
                </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Insights and advice column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Live intelligence matrix */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0c0c0c]/80 border border-white/5 backdrop-blur-md relative">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black italic uppercase tracking-wider text-white flex items-center gap-2">
                                <Cpu className="w-5 h-5 text-cyan-400" /> Active Business Projections
                            </h3>
                            <span className="text-[9px] font-mono text-gray-400 tracking-widest bg-white/5 px-2.5 py-1 rounded border border-white/5">DATA-DRIVEN</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-3xl bg-black border border-white/5 hover:border-cyan-500/25 transition-all">
                                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold mb-1">MEMBER ENGAGEMENT</span>
                                <div className="text-2xl font-black text-white italic">{memberCount} ACTIVE</div>
                                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                                    Attendance peaks at 7:30 PM. Optimize trainer distribution.
                                </p>
                            </div>
                            <div className="p-5 rounded-3xl bg-black border border-white/5 hover:border-fuchsia-500/25 transition-all">
                                <span className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-widest block font-bold mb-1">GROWTH FUNNEL</span>
                                <div className="text-2xl font-black text-white italic">{leadCount} UNRESOLVED</div>
                                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                                    High capture rate. Speed up callback intervals to improve conversion bounds.
                                </p>
                            </div>
                            <div className="p-5 rounded-3xl bg-black border border-white/5 hover:border-amber-500/25 transition-all">
                                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold mb-1">ESTIMATED GROWTH</span>
                                <div className="text-2xl font-black text-emerald-400 italic">+14.2% MRR</div>
                                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                                    Projected lift if digital coaching packages are upsold this month.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pre-packaged simulation prompt triggers */}
                    <div className="p-8 rounded-[2.5rem] bg-[#0c0c0c]/80 border border-white/5 backdrop-blur-md">
                        <h4 className="text-sm font-black uppercase tracking-widest text-cyan-400 mb-4 font-mono">
                            EXECUTE PRE-SET DYNAMIC SIMULATIONS
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { text: "Optimize Staff Allocation for Peak Slots", color: "from-cyan-500/10 to-transparent hover:border-cyan-500/30" },
                                { text: "Simulate Churn Prevention Matrix", color: "from-red-500/10 to-transparent hover:border-red-500/30" },
                                { text: "Synthesize Pro-Shop Margin Optimizations", color: "from-amber-500/10 to-transparent hover:border-amber-500/30" },
                                { text: "Trigger AI WhatsApp Follow-up Loops", color: "from-fuchsia-500/10 to-transparent hover:border-fuchsia-500/30" }
                            ].map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => runSimulation(preset.text)}
                                    className={`p-4 rounded-2xl bg-gradient-to-r text-left border border-white/5 text-xs text-white uppercase tracking-wider font-bold transition-all relative flex items-center justify-between group ${preset.color}`}
                                >
                                    <span>{preset.text}</span>
                                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-all group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Simulation interactive terminal console */}
                <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-[#0a0a0a] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col min-h-[480px]">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                            <span className="w-3.5 h-3.5 rounded-full bg-red-500"></span>
                            <span className="w-3.5 h-3.5 rounded-full bg-yellow-500"></span>
                            <span className="w-3.5 h-3.5 rounded-full bg-green-500"></span>
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest ml-auto font-black flex items-center gap-1.5 ">
                                <Terminal className="w-3.5 h-3.5" /> Core_Monitor.log
                            </span>
                        </div>

                        {/* Logs screen */}
                        <div className="flex-1 bg-black/60 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-gray-400 overflow-y-auto space-y-1 max-h-[220px] custom-scrollbar mb-4">
                            {simLogs.length === 0 && !isSimulating && (
                                <div className="text-center text-gray-600 uppercase tracking-widest py-10 font-bold block">
                                    System Standby. Submit query.
                                </div>
                            )}
                            
                            {simLogs.map((log, index) => (
                                <div key={index} className="text-cyan-400 select-all font-bold">
                                    {log}
                                </div>
                            ))}

                            {isSimulating && (
                                <div className="text-fuchsia-400 font-bold animate-pulse">
                                    [SYS-AI] Quantizing parameters... Please stand by...
                                </div>
                            )}
                        </div>

                        {/* Prompt input and submit button */}
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Simulate business directive..."
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    disabled={isSimulating}
                                    className="w-full bg-black border border-white/10 text-white text-xs rounded-2xl pl-4 pr-12 py-3.5 focus:outline-none focus:border-fuchsia-500/50 transition-all placeholder-gray-600 disabled:opacity-50"
                                />
                                <button
                                    onClick={() => runSimulation()}
                                    disabled={isSimulating || !prompt.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Answer Display Area */}
            <AnimatePresence>
                {simAnswer && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 30 }}
                        className="p-8 rounded-[2.5rem] bg-gradient-to-b from-[#0e0e0e] to-black border border-fuchsia-500/20 shadow-[0_0_60px_rgba(217,70,239,0.1)] relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4">
                            <Zap className="w-6 h-6 text-fuchsia-400 animate-bounce" />
                        </div>
                        <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-fuchsia-400 font-black mb-3">
                            Neural Simulation Result
                        </h4>
                        <div className="text-gray-300 font-mono text-xs whitespace-pre-wrap leading-relaxed bg-black/40 p-6 rounded-3xl border border-white/5">
                            {simAnswer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GoogleAIStudioSuggestions;
