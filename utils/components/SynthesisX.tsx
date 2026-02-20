
import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { useData } from '../context/DataProvider';
import { 
    FlaskConical, Dna, Zap, CheckCircle, 
    RefreshCw, Beaker, Cpu, Waves, Sparkles, 
    Wallet, Binary, ChevronRight, TrendingUp,
    Clock, Microscope, Heart, ShieldCheck,
    Plus, BrainCircuit, Activity, History,
    ShoppingCart, Archive, Pill, Infinity
} from 'lucide-react';
import { getComplexResponse } from '../../lib/gemini';
import { useToast } from '../hooks/useToast';

// --- ATOMIC SEQUENCER VISUALIZER (God Tier v31.0) ---
const AtomicSequencer: React.FC<{ active: boolean; color: string; intensity: number }> = ({ active, color, intensity }) => {
    return (
        <div className="relative w-full h-96 flex items-center justify-center overflow-hidden">
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent transition-opacity duration-1000 ${active ? 'opacity-100' : 'opacity-0'}`}></div>
            
            <div className="relative w-80 h-80">
                {/* Orbit Rings with Dynamic Scaling */}
                {[...Array(4)].map((_, i) => (
                    <div 
                        key={i}
                        className={`absolute inset-0 border-2 rounded-full opacity-20 border-dashed transition-all duration-[3000ms]`}
                        style={{ 
                            borderColor: color, 
                            animation: active ? `spin ${10 + i * 5}s linear infinite` : 'none',
                            transform: `rotateX(60deg) rotateY(${i * 45}deg) scale(${active ? 1.2 : 1})`,
                            boxShadow: active ? `0 0 40px ${color}30` : 'none'
                        }}
                    ></div>
                ))}

                {/* Pulsating Nucleus */}
                <div className={`absolute inset-0 m-auto w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-700 shadow-2xl z-20 ${active ? 'bg-indigo-600/30 border-indigo-400 scale-125 shadow-indigo-500/60' : 'bg-gray-900 border-gray-800 scale-100'}`}>
                    <Dna className={`w-16 h-16 ${active ? 'text-white animate-spin-slow' : 'text-gray-700'}`} />
                    {active && <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping"></div>}
                </div>

                {/* Particle Cloud */}
                {active && [...Array(12)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_15px_white] animate-[orbit_3s_linear_infinite]"
                        style={{
                            top: '50%',
                            left: '50%',
                            animationDelay: `${i * 0.3}s`,
                            '--radius': `${110 + Math.sin(i) * 30}px`
                        } as any}
                    ></div>
                ))}
            </div>
        </div>
    );
};

const SynthesisX: React.FC<{ memberId?: number }> = ({ memberId }) => {
    const { members, addRoutineLog, dailyRoutineLogs, transactions, liveHealthData } = useData();
    const { addToast } = useToast();
    
    // Core State
    const [selectedId, setSelectedId] = useState<number | ''>(memberId || '');
    const [activeTab, setActiveTab] = useState<'generator' | 'stack' | 'vault'>('generator');
    const [optimizationMode, setOptimizationMode] = useState<'Bio-Repair' | 'Neural-Peak' | 'Elite-Mass'>('Neural-Peak');
    const [processState, setProcessState] = useState<'Idle' | 'DNA-Handshake' | 'Atomic-Bonding' | 'Stabilizing' | 'Complete'>('Idle');
    const [formula, setFormula] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const member = members.find(m => m.id === Number(selectedId));
    
    const userBalance = useMemo(() => {
        return transactions.filter(t => t.memberName === member?.name)
                           .reduce((acc, t) => acc + (t.amount > 0 ? t.amount / 10 : 0), 1250);
    }, [transactions, member]);

    // Original Feature: Active Stack derived from Daily Logs
    const activeStack = useMemo(() => {
        if (!member) return [];
        return dailyRoutineLogs.filter(l => l.member_id === member.id && l.task_type === 'Supplement');
    }, [dailyRoutineLogs, member]);

    const addLocalLog = (msg: string) => {
        setLogs(prev => [`> ${msg}`, ...prev].slice(0, 5));
    };

    const handleSynthesize = async () => {
        if (!member) return addToast("Biological Signature Not Detected.", "error");
        if (userBalance < 200) return addToast("Insufficient RYL Credits for v31.0 Protocol.", "error");
        
        setProcessState('DNA-Handshake');
        setProgress(10);
        addLocalLog("UPLINK: Fetching Biometrics from Health-Core...");

        // Start sequencing phases
        const sequence = async () => {
            await new Promise(r => setTimeout(r, 1200));
            setProcessState('Atomic-Bonding');
            setProgress(40);
            addLocalLog(`ANALYSIS: HRV ${liveHealthData.heartRate.hrv}ms | Sleep ${liveHealthData.sleep.totalHours}h`);
            
            await new Promise(r => setTimeout(r, 1500));
            setProcessState('Stabilizing');
            setProgress(75);
            addLocalLog("CHEMISTRY: Aligning Amino Acid Strings...");

            const prompt = `
                ACT AS ROYAL SOVEREIGN BIO-CHEMIST v31.0 (APEX).
                MEMBER: ${member.name}
                VITALS: HRV ${liveHealthData.heartRate.hrv}ms, Sleep ${liveHealthData.sleep.totalHours}h, Stress Index: ${liveHealthData.heartRate.avg > 90 ? 'High' : 'Optimal'}.
                MODE: ${optimizationMode}
                
                SYNTHESIZE A STACK. OUTPUT STRICT JSON:
                {
                    "protocol_name": "Sovereign X-${Math.floor(Math.random()*99)}",
                    "efficiency": "${Math.floor(Math.random()*5+95)}%",
                    "ingredients": [
                        { "name": "string", "dosage": "string", "bio_availability": "0-100%", "timing": "Time" }
                    ],
                    "neural_benefit": "Short clinical summary",
                    "ryl_cost": 200
                }
            `;
            
            try {
                const res = await getComplexResponse(prompt);
                const cleanJson = res.replace(/```json|```/g, '').trim();
                const data = JSON.parse(cleanJson);
                
                await new Promise(r => setTimeout(r, 1000));
                setFormula(data);
                setProcessState('Complete');
                setProgress(100);
                addLocalLog("SUCCESS: Neural Protocol Compiled.");
                addToast("God Tier Protocol Ready.", "success");
            } catch (e) {
                setProcessState('Idle');
                addToast("Synthesis Interrupted.", "error");
            }
        };

        sequence();
    };

    const handleDeploy = () => {
        if (!formula || !member) return;
        formula.ingredients.forEach((ing: any, idx: number) => {
            addRoutineLog({
                log_id: `SYN_${Date.now()}_${idx}`,
                member_id: member.id,
                task_time: ing.timing || '08:00 AM',
                task_type: 'Supplement',
                task_desc: `[${formula.protocol_name}] ${ing.name} - ${ing.dosage}`,
                is_done: false
            });
        });
        addToast("Protocol Synced to Mission Control.", "success");
        setFormula(null);
        setProcessState('Idle');
        setActiveTab('stack'); // Switch to stack view
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header HUD */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-indigo-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(99,102,241,0.25)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-indigo-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(99,102,241,0.5)] border border-indigo-400 group-hover:rotate-12 transition-transform duration-700">
                             <Dna className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="px-5 py-2 bg-indigo-500 text-black rounded-full flex items-center gap-3 shadow-lg font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Infinity className="w-3 h-3 animate-spin-slow" /> Molecular God Tier v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">KERNEL: APEX_CONTINUUM</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Stacks</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => setActiveTab('generator')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'generator' ? 'bg-indigo-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <RefreshCw className="w-4 h-4" /> Quantum Reactor
                        </button>
                        <button onClick={() => setActiveTab('stack')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'stack' ? 'bg-indigo-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <Pill className="w-4 h-4" /> Active Stack
                        </button>
                        <button onClick={() => setActiveTab('vault')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'vault' ? 'bg-indigo-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <Archive className="w-4 h-4" /> Vault
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. SELECTION & BIOMETRICS */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="Source Selection" className="bg-gray-950 border-white/5 p-8 rounded-[3rem]">
                        {!memberId && (
                            <select 
                                value={selectedId} 
                                onChange={(e) => setSelectedId(Number(e.target.value))} 
                                className="w-full bg-black border border-white/10 rounded-2xl p-5 text-white font-black italic outline-none focus:border-indigo-500 appearance-none shadow-inner mb-6"
                            >
                                <option value="">-- LOCATE PROFILE --</option>
                                {members.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                            </select>
                        )}
                        
                        <div className="space-y-3">
                            {[
                                { id: 'Bio-Repair', label: 'Cellular Fix', icon: <Microscope/>, color: 'text-blue-400' },
                                { id: 'Neural-Peak', label: 'Cognitive Flow', icon: <Cpu/>, color: 'text-purple-400' },
                                { id: 'Elite-Mass', label: 'Force Output', icon: <Zap/>, color: 'text-amber-400' }
                            ].map(mode => (
                                <button 
                                    key={mode.id} 
                                    onClick={() => setOptimizationMode(mode.id as any)} 
                                    className={`w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${optimizationMode === mode.id ? `bg-white text-black shadow-2xl` : 'bg-black border-white/5 text-gray-500 hover:border-white/20'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`${optimizationMode === mode.id ? 'text-black' : mode.color}`}>{mode.icon}</span>
                                        <span className="text-xs font-black uppercase tracking-widest">{mode.id}</span>
                                    </div>
                                    {optimizationMode === mode.id && <div className="w-2 h-2 bg-black rounded-full animate-ping"></div>}
                                </button>
                            ))}
                        </div>

                        {/* Credits Display */}
                         <div className="mt-8 bg-gray-900/60 p-6 rounded-[2rem] border border-white/10 text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2 flex items-center justify-center gap-2"><Wallet className="w-3 h-3 text-amber-500"/> RYL Credits</p>
                            <div className="text-4xl font-black text-amber-400 font-mono italic">{userBalance.toFixed(0)}</div>
                        </div>
                    </Card>

                    <Card title="Live Bio-Feed" className="bg-black/60 border-white/5 p-8 rounded-[3rem]">
                        <div className="space-y-4 font-mono text-[10px] text-gray-400">
                            <div className="flex justify-between"><span>HRV_STABILITY</span><span className="text-green-400">{liveHealthData.heartRate.hrv}ms</span></div>
                            <div className="flex justify-between"><span>CNS_LOAD</span><span className="text-amber-400">MODERATE</span></div>
                            <div className="flex justify-between"><span>DNA_VIBRATION</span><span className="text-blue-400">SYNCED</span></div>
                            <div className="pt-4 border-t border-white/5">
                                {logs.map((log, i) => <div key={i} className="mb-1 text-indigo-400/70">{log}</div>)}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* 2. MAIN WORKSPACE */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    
                    {activeTab === 'generator' && (
                        <Card className="bg-black border-white/5 flex-grow relative overflow-hidden flex flex-col items-center justify-center p-0 min-h-[600px] rounded-[4rem] shadow-2xl">
                             <div className="absolute inset-0 z-0">
                                <AtomicSequencer 
                                    active={processState !== 'Idle' && processState !== 'Complete'} 
                                    color={optimizationMode === 'Bio-Repair' ? '#3b82f6' : optimizationMode === 'Neural-Peak' ? '#a855f7' : '#f59e0b'}
                                    intensity={progress}
                                />
                             </div>

                             {processState === 'Idle' && (
                                 <div className="relative z-10 text-center space-y-8 opacity-40 group">
                                     <Beaker className="w-48 h-48 mx-auto text-gray-700 transition-transform group-hover:scale-110" />
                                     <div>
                                         <h3 className="text-4xl font-black text-white uppercase tracking-[0.6em] italic">Reactor Standby</h3>
                                         <p className="text-gray-600 font-mono text-[10px] uppercase mt-2">Awaiting Neural Signature...</p>
                                     </div>
                                     <button 
                                        onClick={handleSynthesize} 
                                        disabled={!selectedId} 
                                        className="bg-white text-black font-black py-4 px-12 rounded-full uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 mx-auto"
                                    >
                                        <Plus className="w-5 h-5"/> Initialize Synthesis
                                    </button>
                                 </div>
                             )}

                             {(processState !== 'Idle' && processState !== 'Complete') && (
                                 <div className="relative z-10 text-center animate-fade-in w-full max-w-lg px-10">
                                     <h3 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-6 animate-pulse">
                                         {processState.replace('-', ' ')}
                                     </h3>
                                     <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-6 border border-white/5">
                                         <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                     </div>
                                     <p className="text-indigo-400 font-mono text-sm tracking-[0.5em] uppercase">Processing Molecular Strings...</p>
                                 </div>
                             )}

                             {processState === 'Complete' && formula && (
                                 <div className="w-full h-full p-12 relative z-10 animate-scale-in flex flex-col">
                                     <div className="flex justify-between items-end mb-12 border-b-4 border-white/5 pb-10">
                                         <div>
                                             <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-3">Composition v31.0 Certified</p>
                                             <h2 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">{formula.protocol_name}</h2>
                                         </div>
                                         <div className="text-right">
                                             <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Bio-Availability</p>
                                             <p className="text-5xl font-black text-green-400 italic leading-none">{formula.efficiency}</p>
                                         </div>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-16 flex-grow overflow-y-auto custom-scrollbar pr-4">
                                         <div className="space-y-8">
                                             <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                                 <Sparkles className="w-5 h-5 text-indigo-400" /> Molecular Components
                                             </h4>
                                             <div className="space-y-4">
                                                 {formula.ingredients.map((ing: any, i: number) => (
                                                     <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all">
                                                         <div>
                                                             <p className="font-bold text-white text-xl leading-none mb-2">{ing.name}</p>
                                                             <div className="flex gap-4">
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3"/> {ing.timing}</p>
                                                                <p className="text-[10px] text-green-500 uppercase tracking-widest flex items-center gap-1"><TrendingUp className="w-3 h-3"/> {ing.bio_availability} Bio-Sync</p>
                                                             </div>
                                                         </div>
                                                         <div className="text-right">
                                                             <p className="text-2xl font-black text-indigo-400 font-mono italic">{ing.dosage}</p>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>

                                         <div className="space-y-10">
                                             <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-5 flex items-center gap-3">
                                                    <BrainCircuit className="w-5 h-5 text-pink-400" /> Neural Impact Summary
                                                </h4>
                                                <div className="bg-indigo-900/10 border border-indigo-500/30 p-8 rounded-[3rem] text-indigo-100 italic leading-relaxed shadow-inner" dangerouslySetInnerHTML={{ __html: formula.neural_benefit }} />
                                             </div>

                                             <div className="flex flex-col gap-4">
                                                <div className="flex justify-between items-center px-4">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase">Treasury Deduct</span>
                                                    <span className="text-lg font-bold text-amber-500">{formula.ryl_cost} RYL Credits</span>
                                                </div>
                                                <button 
                                                    onClick={handleDeploy}
                                                    className="w-full bg-white text-black font-black py-6 rounded-3xl shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:bg-indigo-400 transition-all active:scale-95 uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3"
                                                >
                                                    <CheckCircle className="w-5 h-5" /> Confirm & Deploy to Active Stack
                                                </button>
                                             </div>
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </Card>
                    )}

                    {activeTab === 'stack' && (
                        <Card className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3rem] min-h-[600px] shadow-2xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-5"><Pill className="w-64 h-64 text-white" /></div>
                             <div className="relative z-10 space-y-8">
                                 <div className="flex justify-between items-center border-b border-white/10 pb-6">
                                     <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">My Active Stack</h3>
                                     <button className="bg-green-600 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                                         <ShoppingCart className="w-4 h-4" /> Auto-Refill
                                     </button>
                                 </div>
                                 
                                 {activeStack.length === 0 ? (
                                     <div className="text-center py-20 opacity-30">
                                         <Pill className="w-24 h-24 mx-auto mb-4 text-gray-600" />
                                         <p className="text-sm font-black uppercase tracking-[0.4em]">Stack Buffer Empty</p>
                                     </div>
                                 ) : (
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         {activeStack.map((item, idx) => (
                                             <div key={idx} className="bg-black/60 p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
                                                 <div className="w-16 h-16 bg-gray-900 rounded-3xl flex items-center justify-center text-indigo-400 font-bold border border-white/5 shadow-inner">
                                                     {idx + 1}
                                                 </div>
                                                 <div>
                                                     <h4 className="text-lg font-black text-white italic">{item.task_desc.split(']')[1] || item.task_desc}</h4>
                                                     <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-widest">
                                                         Timing: {item.task_time}
                                                     </p>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                        </Card>
                    )}

                    {activeTab === 'vault' && (
                        <Card className="bg-[#050505] border-white/5 p-10 rounded-[3rem] min-h-[600px] relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-10 opacity-5"><Archive className="w-64 h-64 text-amber-500" /></div>
                             <div className="relative z-10 space-y-8">
                                 <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter border-b border-white/10 pb-6">Protocol Vault</h3>
                                 <div className="space-y-4">
                                     <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 opacity-50 cursor-not-allowed">
                                         <div className="flex justify-between items-center">
                                             <div>
                                                 <h4 className="font-bold text-white">Sovereign X-01 (Beta)</h4>
                                                 <p className="text-xs text-gray-500">Archived: Jan 12, 2024</p>
                                             </div>
                                             <span className="text-[10px] font-black bg-gray-800 px-3 py-1 rounded text-gray-500">EXPIRED</span>
                                         </div>
                                     </div>
                                     <p className="text-center text-xs text-gray-600 font-mono mt-8 uppercase tracking-widest">No other historical shards found.</p>
                                 </div>
                             </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SynthesisX;
