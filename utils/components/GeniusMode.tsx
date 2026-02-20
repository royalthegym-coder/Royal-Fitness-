
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { useData } from '../context/DataProvider';
import { generateDeepDiveGenius } from '../../lib/gemini';
import { sendGeniusProtocol } from '../../lib/whatsapp';
import { 
    BrainCircuit, Zap, RefreshCcw, Search, Cpu, 
    Share2, Sparkles, Dna, FileText, ShieldAlert, Terminal,
    ChevronRight, Activity, Layers, ArrowUpRight, Workflow,
    TrendingUp, AlertTriangle, CheckCircle, Infinity, User
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { BotIcon } from './icons/BotIcon';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CustomTooltip from './common/CustomTooltip';

interface GeniusResult {
    thought_process: string[];
    analysis_summary: string;
    identified_weakness: string;
    workout_plan_4weeks: string;
    nutrition_strategy_html: string;
    whatsapp_message_text: string;
}

const OracleAI: React.FC = () => {
    const { members, updateMember, detailedWorkoutLogs } = useData();
    const { addToast } = useToast();

    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(members[0]?.id || '');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<GeniusResult | null>(null);
    const [isDeploying, setIsDeploying] = useState(false);
    const [activeTab, setActiveTab] = useState<'logic' | 'analysis' | 'protocol' | 'prophecy'>('logic');
    
    // Neural Simulation States
    const [neuralLoad, setNeuralLoad] = useState(0);
    const [thoughtStep, setThoughtStep] = useState(0);
    
    // Prediction Data (Prophecy Engine)
    const [trajectoryData, setTrajectoryData] = useState<any[]>([]);

    const member = useMemo(() => members.find(m => m.id === Number(selectedMemberId)), [selectedMemberId, members]);

    useEffect(() => {
        let interval: any;
        if (isAnalyzing) {
            interval = setInterval(() => {
                setNeuralLoad(prev => Math.min(99, prev + Math.random() * 5));
                setThoughtStep(prev => (prev + 1) % 4);
            }, 500);
        } else {
            setNeuralLoad(0);
            setThoughtStep(0);
        }
        return () => clearInterval(interval);
    }, [isAnalyzing]);

    const handleRunAnalysis = async () => {
        if (!member) return;
        setIsAnalyzing(true);
        setResult(null);
        setTrajectoryData([]);
        addToast("Sovereign Node: Establishing Neural Bridge...", "info");

        try {
            const memberLogs = detailedWorkoutLogs.filter(l => l.memberId === member.id);
            const jsonStr = await generateDeepDiveGenius(member, { logs: memberLogs });
            const parsedResult: GeniusResult = JSON.parse(jsonStr);
            
            // Generate Predictive Data based on result (Mocking AI prediction for visual)
            const base = member.health_score || 50;
            const newData = Array.from({ length: 6 }, (_, i) => ({
                month: `Month ${i + 1}`,
                current: Math.min(100, base + (i * 2)), // Standard Linear Growth
                optimized: Math.min(100, base + (i * 8) + (i > 2 ? 5 : 0)) // Exponential AI Growth
            }));
            setTrajectoryData(newData);

            // Artificial delay to show "God-Tier" thinking animation
            setTimeout(() => {
                setResult(parsedResult);
                setIsAnalyzing(false);
                addToast("Oracle Sync Successful. Singularity Reached.", "success");
            }, 3000);
        } catch (e) {
            console.error(e);
            addToast("Neural Link Failure. Retrying sync...", "error");
            setIsAnalyzing(false);
        }
    };

    const handleDeploy = async () => {
        if (!member || !result) return;
        setIsDeploying(true);
        try {
            // Push to member portal as "Approved AI Plan"
            updateMember({ ...member, approvedAiPlan: result.workout_plan_4weeks });
            // Send via WhatsApp
            await sendGeniusProtocol(member, result.whatsapp_message_text);
            addToast(`God-Tier Protocol Injected to ${member.name}. Reality Updated.`, "success");
            setResult(null);
        } catch (e) {
            addToast("Deployment Handshake Failed.", "error");
        } finally {
            setIsDeploying(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* OLYMPUS HEADER HUD */}
            <div className="bg-[#050505] p-12 rounded-[4rem] border border-amber-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(245,158,11,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-amber-600/5 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="px-5 py-2 bg-amber-500 text-black border border-amber-400 rounded-full flex items-center gap-3 shadow-[0_0_30px_#f59e0b]">
                                <Infinity className="w-5 h-5 animate-spin-slow" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Singularity Core v31.0</span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase bg-white/5 px-4 py-2 rounded-full border border-white/5">MODE: GENIUS_GOD</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">
                            Divine <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-orange-500">Oracle</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed italic border-l-4 border-amber-500 pl-8">
                            "I see all timelines. I calculate all outcomes. I am the architect of your physical evolution."
                        </p>
                    </div>

                    <div className="flex gap-6">
                        <div className="bg-gray-900/60 p-8 rounded-[3rem] border border-white/10 backdrop-blur-2xl flex flex-col items-center min-w-[200px] shadow-2xl relative overflow-hidden">
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-3">Cognitive Load</p>
                            <div className="text-5xl font-black text-white font-mono italic">{Math.round(neuralLoad)}%</div>
                            <div className="absolute bottom-0 left-0 h-1.5 bg-amber-500 transition-all duration-300 shadow-[0_0_20px_#f59e0b]" style={{ width: `${neuralLoad}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* CONTROL PANEL */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="Target Subject" className="bg-black border-white/5 p-8 rounded-[3rem] shadow-2xl">
                        <div className="space-y-8">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-amber-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute left-6 top-1/2 -translate-y-1/2"><User className="w-5 h-5 text-amber-500"/></div>
                                <select 
                                    value={selectedMemberId} 
                                    onChange={(e) => setSelectedMemberId(Number(e.target.value))} 
                                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 pl-16 text-white font-black italic outline-none focus:border-amber-500 appearance-none shadow-inner relative z-10"
                                >
                                    <option value="">-- SELECT IDENTITY --</option>
                                    {members.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <button 
                                onClick={handleRunAnalysis} 
                                disabled={isAnalyzing || !selectedMemberId} 
                                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.3)] transition-all uppercase italic tracking-[0.2em] text-xs flex items-center justify-center gap-4 active:scale-95 disabled:opacity-20 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700"></div>
                                {isAnalyzing ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <BrainCircuit className="w-6 h-6" />}
                                {isAnalyzing ? 'ORACLE THINKING...' : 'INITIATE DEEP AUDIT'}
                            </button>
                        </div>
                    </Card>

                    <Card title="Neural Process Trace" className="bg-black border-white/5 h-96 flex flex-col p-0 overflow-hidden rounded-[3rem]">
                        <div className="bg-gray-900/50 px-8 py-4 border-b border-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2"><Terminal className="w-3 h-3"/> oracle_kernel@v31</span>
                            <div className="flex gap-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/><div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse delay-100"/><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200"/></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 font-mono text-[11px] text-amber-500/80 space-y-3 custom-scrollbar bg-[#020202]">
                            <div>[SYSTEM] Neural link stability: 99.8%</div>
                            <div>[INFO] Loading kinematic logs for ID #{selectedMemberId || 'NULL'}</div>
                            {isAnalyzing && (
                                <>
                                    <div className="text-cyan-400 animate-pulse">&gt;&gt; Step {thoughtStep + 1}: De-compiling muscle fiber recruitment patterns...</div>
                                    <div className="text-gray-600">&gt;&gt; Calculating ATP recycling efficiency...</div>
                                    <div className="text-purple-400">&gt;&gt; Simulating 12,000 future workout variations...</div>
                                    <div className="text-green-400">&gt;&gt; Cross-referencing DNA markers...</div>
                                </>
                            )}
                            {result && <div className="text-green-400 font-bold">&gt;&gt; COMPLETE: Singularity Solution Generated.</div>}
                            <div className="flex items-center gap-2"><span className="text-cyan-400">{'>'}</span><span className="w-2 h-5 bg-amber-500 animate-pulse"></span></div>
                        </div>
                    </Card>
                </div>

                {/* DISPLAY AREA */}
                <div className="lg:col-span-8 h-full">
                    {!result && !isAnalyzing ? (
                        <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-gray-900/20 rounded-[4rem] border-4 border-dashed border-white/5 opacity-40 group hover:opacity-100 transition-opacity">
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center mb-8 group-hover:animate-spin-slow">
                                <Cpu className="w-16 h-16 text-gray-600" />
                            </div>
                            <p className="font-black text-gray-500 uppercase tracking-[0.5em] italic">Awaiting Bio-Input</p>
                        </div>
                    ) : isAnalyzing ? (
                        <div className="h-full min-h-[600px] flex flex-col items-center justify-center space-y-12 bg-black/40 rounded-[4rem] border border-white/5">
                            <div className="relative">
                                <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-30 animate-pulse"></div>
                                <BotIcon className="w-32 h-32 text-amber-500 animate-bounce relative z-10" />
                            </div>
                            <div className="text-center space-y-4">
                                <h3 className="text-4xl font-black text-white uppercase italic tracking-widest animate-pulse">Recursive Reasoning</h3>
                                <p className="text-gray-500 font-mono text-sm max-w-sm">The Oracle is iterating through 12,000 physiological variables to solve your plateau.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-slide-up h-full flex flex-col">
                            {/* Tabs Navigation */}
                            <div className="flex bg-gray-900 p-2 rounded-2xl border border-white/10 w-fit backdrop-blur-xl flex-wrap shadow-xl">
                                {[
                                    { id: 'logic', label: 'Neural Logic', icon: <Workflow className="w-4 h-4"/> },
                                    { id: 'analysis', label: 'Physio Audit', icon: <Activity className="w-4 h-4"/> },
                                    { id: 'prophecy', label: 'Prophecy Engine', icon: <TrendingUp className="w-4 h-4"/> },
                                    { id: 'protocol', label: 'God-Tier Plan', icon: <Zap className="w-4 h-4"/> }
                                ].map((tab) => (
                                    <button 
                                        key={tab.id} 
                                        onClick={() => setActiveTab(tab.id as any)} 
                                        className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content Deck */}
                            <Card className="flex-1 bg-[#080808] border-amber-500/20 p-12 rounded-[4rem] relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                                
                                {/* Chain of Thought (Thinking Tab) */}
                                {activeTab === 'logic' && result && (
                                    <div className="space-y-10 animate-fade-in relative z-10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
                                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Recursive Chain of Thought</h3>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {result.thought_process.map((step, idx) => (
                                                <div key={idx} className="flex gap-6 group">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/50 flex items-center justify-center font-mono text-[10px] text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-[0_0_10px_cyan]">0{idx+1}</div>
                                                        {idx < result.thought_process.length - 1 && <div className="w-px h-full bg-white/5 my-2"></div>}
                                                    </div>
                                                    <div className="pb-8 w-full">
                                                        <p className="text-gray-300 text-sm italic font-medium leading-relaxed bg-white/5 p-6 rounded-[2rem] border border-white/5 group-hover:border-cyan-500/30 transition-all hover:bg-black/60 shadow-lg">{step}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-8 bg-red-500/5 border-l-8 border-red-600 rounded-r-[3rem] shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert className="w-24 h-24 text-red-500" /></div>
                                            <h4 className="text-[11px] font-black text-red-500 uppercase mb-3 flex items-center gap-2 tracking-[0.3em]"><ShieldAlert className="w-4 h-4" /> Root Physiological Anomaly</h4>
                                            <p className="text-2xl font-black text-white uppercase tracking-tight leading-tight">{result.identified_weakness}</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'analysis' && result && (
                                    <div className="space-y-10 animate-fade-in relative z-10 h-full flex flex-col">
                                        <div className="flex items-center gap-4 mb-4">
                                            <Layers className="w-8 h-8 text-purple-400 animate-pulse" />
                                            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Forensic Physiology Audit</h3>
                                        </div>
                                        <div className="flex-1 bg-gray-900/40 p-10 rounded-[3rem] border border-white/5 backdrop-blur-md overflow-y-auto custom-scrollbar shadow-inner">
                                            <p className="text-gray-300 text-xl leading-relaxed italic font-medium">
                                                {result.analysis_summary}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'prophecy' && (
                                    <div className="space-y-8 animate-fade-in relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <TrendingUp className="w-8 h-8 text-green-400 animate-pulse" />
                                                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Future Projection</h3>
                                                </div>
                                                <p className="text-xs text-gray-500 font-mono tracking-widest">PROJECTED_OUTCOME_CONFIDENCE: 94.2%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-amber-500 uppercase">Growth Factor</p>
                                                <p className="text-4xl font-black text-white italic">+240%</p>
                                            </div>
                                        </div>

                                        <div className="h-[300px] w-full bg-black/40 rounded-[3rem] border border-white/5 p-6 shadow-inner">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={trajectoryData}>
                                                    <defs>
                                                        <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                                        </linearGradient>
                                                        <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.4}/>
                                                            <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="month" stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                                                    <YAxis hide />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#f59e0b', strokeWidth: 1 }} />
                                                    <Area type="monotone" dataKey="optimized" stroke="#f59e0b" strokeWidth={4} fill="url(#colorOptimized)" name="With Oracle Plan" />
                                                    <Area type="monotone" dataKey="current" stroke="#64748b" strokeWidth={2} fill="url(#colorCurrent)" name="Current Trajectory" strokeDasharray="5 5" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-[2rem]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Injury Probability</p>
                                                </div>
                                                <p className="text-white text-sm font-medium">Without optimization: <span className="text-red-400 font-bold">High (68%)</span> due to volume fatigue.</p>
                                            </div>
                                            <div className="p-6 bg-green-900/10 border border-green-500/20 rounded-[2rem]">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Oracle Protection</p>
                                                </div>
                                                <p className="text-white text-sm font-medium">With optimization: <span className="text-green-400 font-bold">Minimal (12%)</span> via auto-regulation.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'protocol' && result && (
                                    <div className="animate-fade-in relative z-10 h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-amber-500/20 rounded-2xl border border-amber-500/50"><Zap className="w-8 h-8 text-amber-500 animate-pulse" /></div>
                                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">The God-Tier Protocol</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 font-black uppercase">Efficiency Projected</p>
                                                <p className="text-4xl font-black text-green-500 italic">+12.4%</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                                            <div className="prose prose-invert prose-lg max-w-none text-gray-300 bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-inner" dangerouslySetInnerHTML={{ __html: result.workout_plan_4weeks }} />
                                            <div className="mt-8 prose prose-invert prose-sm max-w-none text-gray-400 bg-black/40 p-10 rounded-[3rem] border border-white/5 border-dashed" dangerouslySetInnerHTML={{ __html: result.nutrition_strategy_html }} />
                                        </div>
                                    </div>
                                )}
                            </Card>

                            {/* DEPLOYMENT BAR */}
                            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900/60 p-10 rounded-[4rem] border border-white/10 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                     <div className="p-4 bg-green-500/20 rounded-3xl text-green-400 border border-green-500/40 shadow-[0_0_20px_rgba(34,197,94,0.2)]"><Share2 className="w-8 h-8" /></div>
                                     <div>
                                         <h4 className="text-white font-black text-2xl uppercase italic tracking-tight">Deploy Logic Package</h4>
                                         <p className="text-gray-500 text-xs uppercase tracking-widest font-bold flex items-center gap-2">
                                             <Activity className="w-3 h-3 text-cyan-400"/> Member Hub + WhatsApp Auto-Sync
                                         </p>
                                     </div>
                                </div>
                                <button 
                                    onClick={handleDeploy} 
                                    disabled={isDeploying} 
                                    className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white font-black px-16 py-6 rounded-[2.5rem] shadow-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 mt-6 md:mt-0"
                                >
                                    {isDeploying ? <RefreshCcw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                    {isDeploying ? 'INJECTING...' : 'FINALIZE PROTOCOL'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OracleAI;
