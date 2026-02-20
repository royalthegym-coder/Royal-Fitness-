
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    TrendingUp, Activity, Cpu, 
    ChevronRight, Binary, Fingerprint, 
    Zap, Calendar, BarChart3, LineChart as LineIcon,
    Dumbbell, MessageSquare, History, User, Sparkles,
    Film, Award, BrainCircuit, ScanFace, Layers, RefreshCw,
    Dna, Globe, ShieldCheck, Gauge
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import BodySimulator from '../BodySimulator';
import { BotIcon } from '../icons/BotIcon';
import { getComplexResponse } from '../../../lib/gemini';
import { useToast } from '../../hooks/useToast';

// --- CUSTOM HUD TOOLTIP ---
const LabTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-black/90 border border-cyan-500/50 p-4 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-xl">
                <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white italic">{payload[0].value}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">UNITS</span>
                </div>
                <div className="h-1 w-full bg-gray-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-400 animate-pulse" style={{width: `${Math.min(100, payload[0].value)}%`}}></div>
                </div>
            </div>
        );
    }
    return null;
};

const WarriorPerformanceLab: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, detailedWorkoutLogs } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);
    
    // --- STATE MANAGEMENT ---
    const [activeSection, setActiveSection] = useState<'visual' | 'vitals' | 'memories' | 'oracle'>('visual');
    const [oracleInsight, setOracleInsight] = useState<string | null>(null);
    const [isOracleThinking, setIsOracleThinking] = useState(false);
    const [syncStatus, setSyncStatus] = useState(0);

    // Live Sync Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setSyncStatus(prev => (prev + 1) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // --- 1. ATTRIBUTE RADAR DATA (Dynamic) ---
    const radarData = useMemo(() => {
        const score = member?.health_score || 85;
        // Simulate attributes based on health score
        return [
            { subject: 'Power', A: Math.min(100, score - 5 + Math.random() * 5), fullMark: 100 },
            { subject: 'Endurance', A: Math.min(100, score - 15 + Math.random() * 5), fullMark: 100 },
            { subject: 'Stability', A: Math.min(100, score + 5), fullMark: 100 },
            { subject: 'Recovery', A: Math.min(100, score - 10), fullMark: 100 },
            { subject: 'Agility', A: Math.min(100, score - 8), fullMark: 100 },
            { subject: 'Focus', A: Math.min(100, score + 2), fullMark: 100 },
        ];
    }, [member]);

    // --- 2. PROGRESS TELEMETRY (Simulated Historical Data) ---
    const progressData = useMemo(() => [
        { week: 'W-4', volume: 4200, score: 60 },
        { week: 'W-3', volume: 4500, score: 68 },
        { week: 'W-2', volume: 4800, score: 75 },
        { week: 'W-1', volume: 5100, score: 82 },
        { week: 'Now', volume: 5500, score: member?.health_score || 88 }
    ], [member]);

    // --- 3. MEMORY SHARDS (Progress History) ---
    const memories = [
        { id: 1, date: '2024-01-10', title: 'Bio-Signature Acquired', type: 'System', desc: 'Biological signature registered in Apex Core. Baseline established.' },
        { id: 2, date: '2024-02-15', title: 'Strength Barrier Broken', type: 'Record', desc: 'Surpassed 100kg total volume threshold. Neural adaptations verified.' },
        { id: 3, date: '2024-03-20', title: 'Neural Sync Stabilized', type: 'Consistency', desc: 'Maintained 95% attendance for 30 days. Habits locked.' },
        { id: 4, date: 'Today', title: 'Evolution Phase 3', type: 'Milestone', desc: 'Health Score entering elite percentile. Morphing initiated.' },
    ];

    // --- 4. NEURAL ORACLE FUNCTION ---
    const handleConsultOracle = async () => {
        setIsOracleThinking(true);
        setOracleInsight(null);
        
        const prompt = `
            ACT AS 'EVOLUTION ORACLE' AI (THE SINGULARITY).
            User: ${member?.name}.
            Stats: Health Score ${member?.health_score}, XP ${member?.xp}, Level ${member?.level}.
            
            Goal: Predict the next 30 days of physical evolution based on current trajectory.
            
            Provide a "Prophecy" in HTML format with these sections:
            1. <h3 class="text-cyan-400 font-bold uppercase">Projected Form</h3> (Describe physical changes)
            2. <h3 class="text-red-400 font-bold uppercase mt-4">Neural Bottleneck</h3> (What is holding them back)
            3. <h3 class="text-green-400 font-bold uppercase mt-4">Divine Directive</h3> (One specific command to follow)
            
            Keep the tone epic, futuristic, and scientific.
        `;

        try {
            const response = await getComplexResponse(prompt);
            setOracleInsight(response);
            addToast("Oracle Prophecy Received.", "success");
        } catch (e) {
            addToast("Oracle Link Severed.", "error");
        } finally {
            setIsOracleThinking(false);
        }
    };

    if (!member) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            
            {/* SOVEREIGN PERFORMANCE HEADER */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                    <div>
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6">
                            <Fingerprint className="w-4 h-4 text-cyan-400" />
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">Evolution Lab v31.0</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                            Apex <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Form</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl border-l-4 border-cyan-500 pl-8 leading-relaxed italic">
                            Visualizing your biological transformation through <span className="text-white font-bold uppercase">Holographic Projection & Neural Data</span>.
                        </p>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-gray-900/60 p-8 rounded-[3rem] border border-white/10 backdrop-blur-2xl flex flex-col items-center min-w-[220px] shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 animate-scan"></div>
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-3">Genetic Potential</p>
                             <div className="text-6xl font-black text-cyan-400 font-mono italic">{(member.health_score || 92).toFixed(0)}%</div>
                             <p className="text-[9px] text-green-500 font-bold mt-2 uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Rising</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex flex-wrap justify-center bg-gray-900/80 p-2 rounded-[2.5rem] border border-white/10 w-fit mx-auto backdrop-blur-3xl shadow-2xl gap-2">
                 <button onClick={() => setActiveSection('visual')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSection === 'visual' ? 'bg-cyan-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                     <ScanFace className="w-4 h-4" /> Morph-Engine
                 </button>
                 <button onClick={() => setActiveSection('vitals')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSection === 'vitals' ? 'bg-cyan-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                     <Activity className="w-4 h-4" /> Bio-Telemetry
                 </button>
                 <button onClick={() => setActiveSection('memories')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSection === 'memories' ? 'bg-cyan-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                     <Film className="w-4 h-4" /> Chrono-Log
                 </button>
                 <button onClick={() => setActiveSection('oracle')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeSection === 'oracle' ? 'bg-purple-600 text-white shadow-xl' : 'text-gray-500 hover:text-white'}`}>
                     <BrainCircuit className="w-4 h-4" /> Neural Oracle
                 </button>
            </div>

            {/* CONTENT AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. MORPH ENGINE (3D BODY STASIS POD) */}
                {activeSection === 'visual' && (
                    <div className="lg:col-span-12">
                        <Card title="Structural Projection" className="bg-black border-white/5 h-[800px] p-0 overflow-hidden rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative flex flex-col">
                            {/* Stasis Field Overlay */}
                            <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                            <div className="absolute top-0 w-full h-2 bg-cyan-500/50 blur-md animate-scan z-10"></div>
                            
                            {/* Embedding the BodySimulator Component */}
                            <div className="flex-1 relative z-0">
                                <BodySimulator />
                            </div>
                            
                            {/* HUD Overlay */}
                            <div className="absolute top-8 right-8 z-20 pointer-events-none">
                                <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 w-48 text-right">
                                    <p className="text-[9px] text-cyan-400 font-black uppercase mb-1 flex items-center justify-end gap-2">
                                        Scan Integrity <Activity className="w-3 h-3 animate-pulse"/>
                                    </p>
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-cyan-500" style={{ width: '98%' }}></div>
                                    </div>
                                    <p className="text-white font-mono text-xs mt-1">100% Complete</p>
                                </div>
                            </div>

                            <div className="absolute bottom-10 left-10 z-20 space-y-4 pointer-events-none">
                                <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-cyan-500/30 w-56">
                                    <p className="text-[9px] text-cyan-400 font-black uppercase mb-1">Target Mass</p>
                                    <p className="text-3xl font-black text-white italic">{member.physical_metrics.target_weight} <span className="text-xs text-gray-500 not-italic">KG</span></p>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* 2. BIO-TELEMETRY (CHARTS) */}
                {activeSection === 'vitals' && (
                    <>
                        <div className="lg:col-span-5 space-y-6 animate-slide-up">
                            <Card title="Attribute Radar" className="bg-gray-950 border-white/5 p-8 rounded-[3.5rem] shadow-2xl h-full relative overflow-hidden">
                                {/* Holographic Glow */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
                                
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                            <defs>
                                                <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar 
                                                name="Warrior" 
                                                dataKey="A" 
                                                stroke="#22d3ee" 
                                                strokeWidth={3} 
                                                fill="#22d3ee" 
                                                fillOpacity={0.3} 
                                                filter="url(#radarGlow)"
                                            />
                                            <Tooltip content={<LabTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-8 p-6 bg-cyan-900/10 border border-cyan-500/20 rounded-3xl backdrop-blur-sm">
                                     <p className="text-xs text-gray-300 italic leading-relaxed font-medium">
                                         "Your <strong className="text-cyan-400">Stability</strong> node is at elite levels. Consider increasing weight for <strong className="text-cyan-400">Power</strong> breakthroughs."
                                     </p>
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-7 space-y-6 animate-slide-up">
                             <Card title="Volume Velocity (30 Days)" className="bg-gray-950 border-cyan-500/30 p-10 rounded-[4rem] h-[500px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5 animate-pulse"><TrendingUp className="w-48 h-48 text-cyan-500"/></div>
                                <div className="h-full w-full pb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={progressData}>
                                            <defs>
                                                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5}/>
                                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                                </linearGradient>
                                                <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                                    <feMerge>
                                                        <feMergeNode in="coloredBlur" />
                                                        <feMergeNode in="SourceGraphic" />
                                                    </feMerge>
                                                </filter>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                            <XAxis dataKey="week" stroke="#555" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontFamily: 'monospace'}} />
                                            <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontFamily: 'monospace'}} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="volume" 
                                                stroke="#22d3ee" 
                                                fillOpacity={1} 
                                                fill="url(#colorVol)" 
                                                strokeWidth={4} 
                                                filter="url(#lineGlow)"
                                                activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                                            />
                                            <Tooltip content={<LabTooltip />} cursor={{ stroke: '#22d3ee', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                             </Card>
                             
                             <div className="grid grid-cols-2 gap-4">
                                  <div className="p-6 bg-gray-900 rounded-[2.5rem] border border-white/5 text-center shadow-lg">
                                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Current Body Fat</p>
                                      <p className="text-3xl font-black text-white italic mt-2">{member.physical_metrics.body_fat}%</p>
                                  </div>
                                  <div className="p-6 bg-gray-900 rounded-[2.5rem] border border-white/5 text-center shadow-lg">
                                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Muscle Mass</p>
                                      <p className="text-3xl font-black text-white italic mt-2">{member.physical_metrics.muscle_mass}kg</p>
                                  </div>
                             </div>
                        </div>
                    </>
                )}

                {/* 3. CHRONO-LOG (TIMELINE) */}
                {activeSection === 'memories' && (
                    <div className="lg:col-span-12 space-y-8 animate-slide-up">
                        <div className="bg-gray-950 border border-white/5 p-10 rounded-[4rem] shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-5"><History className="w-64 h-64 text-white" /></div>
                             <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-8 z-10 relative">Evolution Timeline</h3>
                             
                             <div className="relative border-l-4 border-white/10 ml-6 space-y-10">
                                 {memories.map((mem, i) => (
                                     <div key={mem.id} className="relative pl-10 group">
                                         {/* Time Marker */}
                                         <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-gray-950 bg-cyan-500 shadow-[0_0_15px_cyan] z-10 group-hover:scale-125 transition-transform"></div>
                                         
                                         <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2rem] hover:border-cyan-500/30 transition-all shadow-xl group-hover:translate-x-2">
                                             <div className="flex justify-between items-start mb-3">
                                                 <div>
                                                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{mem.date}</p>
                                                     <h4 className="text-xl font-bold text-white">{mem.title}</h4>
                                                 </div>
                                                 <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${mem.type === 'Milestone' ? 'bg-amber-900/20 text-amber-400 border-amber-500/30' : mem.type === 'Record' ? 'bg-red-900/20 text-red-400 border-red-500/30' : 'bg-blue-900/20 text-blue-400 border-blue-500/30'}`}>
                                                     {mem.type}
                                                 </span>
                                             </div>
                                             <p className="text-sm text-gray-400 italic leading-relaxed">"{mem.desc}"</p>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}

                {/* 4. NEURAL ORACLE (AI INSIGHTS) */}
                {activeSection === 'oracle' && (
                    <div className="lg:col-span-12 animate-slide-up">
                        <Card className="bg-gradient-to-br from-purple-900/20 to-black border-purple-500/30 p-12 rounded-[4rem] text-center min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                             
                             {!oracleInsight ? (
                                 <div className="relative z-10 space-y-8">
                                     <div className="w-32 h-32 rounded-full border-4 border-dashed border-purple-500/40 flex items-center justify-center mx-auto animate-spin-slow">
                                         <BotIcon className="w-16 h-16 text-purple-400" />
                                     </div>
                                     <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">Consult the Oracle</h3>
                                     <p className="text-gray-400 max-w-lg mx-auto font-medium">
                                         "I have analyzed your kinetic history and genetic markers. Ask, and I shall reveal your trajectory."
                                     </p>
                                     <button 
                                        onClick={handleConsultOracle}
                                        disabled={isOracleThinking}
                                        className="bg-white text-black font-black px-12 py-5 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] hover:bg-purple-400 transition-all uppercase tracking-widest text-xs flex items-center gap-3 disabled:opacity-50"
                                     >
                                         {isOracleThinking ? <RefreshCw className="animate-spin w-5 h-5"/> : <Sparkles className="w-5 h-5"/>}
                                         {isOracleThinking ? 'DIVINING FUTURE...' : 'REVEAL PROPHECY'}
                                     </button>
                                 </div>
                             ) : (
                                 <div className="relative z-10 text-left w-full max-w-3xl space-y-8 animate-fade-in">
                                     <div className="flex items-center gap-4 mb-8 justify-center">
                                         <Sparkles className="w-8 h-8 text-purple-400" />
                                         <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">The Prophecy</h3>
                                     </div>
                                     <div className="bg-black/60 p-10 rounded-[3rem] border border-purple-500/30 shadow-2xl">
                                         <div className="prose prose-invert prose-lg text-gray-300 leading-relaxed font-serif" dangerouslySetInnerHTML={{ __html: oracleInsight }} />
                                     </div>
                                     <div className="text-center">
                                         <button onClick={() => setOracleInsight(null)} className="text-gray-500 hover:text-white font-bold uppercase text-xs tracking-widest underline decoration-dashed">
                                             Reset Oracle
                                         </button>
                                     </div>
                                 </div>
                             )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarriorPerformanceLab;
