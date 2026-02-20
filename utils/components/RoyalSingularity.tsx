
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { BrainCircuit, Cpu, Zap, Activity, Link, Lock, Unlock, Network, RefreshCw, Wifi, Server, Orbit, ShieldCheck, Users, Code, Crown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useData } from '../context/DataProvider';

type TrainingMode = 'Strength' | 'Hypertrophy' | 'Endurance';

const RoyalSingularity: React.FC = () => {
    const { liveHealthData } = useData();
    
    const [status, setStatus] = useState<'Offline' | 'Bridging' | 'Synchronized'>('Offline');
    const [mode, setMode] = useState<TrainingMode>('Hypertrophy');
    
    // Core Metrics
    const [neuralLoad, setNeuralLoad] = useState(20); // CNS Fatigue %
    const [machineWeight, setMachineWeight] = useState(100); // kg
    const [synapseEfficiency, setSynapseEfficiency] = useState(100);
    const [aiReasoning, setAiReasoning] = useState("System Idle.");
    const [logs, setLogs] = useState<string[]>([]);
    
    // v31.0 Features
    const [isAscended, setIsAscended] = useState(false);
    const [hiveMindCount, setHiveMindCount] = useState(0);
    const [codeMutations, setCodeMutations] = useState<string[]>([]);
    
    // Chart Data State
    const [dataHistory, setDataHistory] = useState<{time: number, neural: number, weight: number}[]>([]);
    const [entangledModules, setEntangledModules] = useState([
        { id: 'Health', status: 'Linked', color: 'text-green-500' },
        { id: 'Finance', status: 'Linked', color: 'text-amber-500' },
        { id: 'Social', status: 'Linked', color: 'text-pink-500' },
        { id: 'IoT', status: 'Scanning', color: 'text-cyan-500' }
    ]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString().split(' ')[0]}] ${msg}`, ...prev].slice(0, 8));
    };

    // --- MAIN ENGINE LOOP ---
    useEffect(() => {
        if (status === 'Offline') return;

        let tick = 0;
        const interval = setInterval(() => {
            tick++;
            
            // 1. NEURAL LOAD CALCULATION (Based on LIVE Heart Rate)
            const currentHR = liveHealthData.heartRate.avg || 70;
            const hrStressFactor = Math.max(0, (currentHR - 100) / 50); 
            
            setNeuralLoad(prev => {
                let change = 0.5 + (hrStressFactor * 2); 
                if (currentHR < 90) change = -1.5; // Recovery
                let next = prev + change;
                if (tick % 30 === 0) next += 10; // Simulate Set Spike
                return Math.max(10, Math.min(100, next));
            });

            // 2. AUTO-REGULATION (The Singularity Logic)
            setMachineWeight(prevWeight => {
                let targetWeight = prevWeight;
                let reason = "Maintaining Load.";

                if (mode === 'Strength') {
                    if (neuralLoad > 85) {
                        targetWeight *= 0.98; 
                        reason = "CNS Fatigued. Dropping load 2% to prevent failure.";
                    } else if (neuralLoad < 40) {
                        targetWeight = Math.min(200, prevWeight + 1);
                        reason = "Neural Drive High. Increasing load.";
                    }
                } else if (mode === 'Hypertrophy') {
                    if (neuralLoad > 75) {
                        targetWeight *= 0.99;
                        reason = "Optimizing for Volume. Micro-drop.";
                    }
                }

                setAiReasoning(reason);
                return parseFloat(targetWeight.toFixed(1));
            });

            // 3. SYNAPSE EFFICIENCY & ASCENSION CHECK
            const efficiency = Math.floor(100 - (neuralLoad / 3.5));
            setSynapseEfficiency(efficiency);
            
            if (efficiency >= 98 && !isAscended) {
                setIsAscended(true);
                addLog("CRITICAL: ASCENSION STATE REACHED. LIMITERS REMOVED.");
            } else if (efficiency < 90 && isAscended) {
                setIsAscended(false);
            }

            // 4. Update Visualization Data
            setDataHistory(prev => [...prev.slice(-50), { 
                time: Date.now(), 
                neural: neuralLoad, 
                weight: machineWeight
            }]);

            // 5. Hive Mind & Code Mutation Sim
            if (Math.random() > 0.8) {
                setHiveMindCount(prev => Math.min(500, prev + Math.floor(Math.random() * 5)));
                const mutations = [
                    "Re-compiling muscle memory buffer...",
                    "Optimizing mitochondrial efficiency...",
                    "Syncing circadian clock to solar apex...",
                    "Patching dopamine receptors...",
                    "Injecting adrenaline protocol v4.0..."
                ];
                setCodeMutations(prev => [`> ${mutations[Math.floor(Math.random() * mutations.length)]}`, ...prev].slice(0, 4));
            }

        }, 500); 

        return () => clearInterval(interval);
    }, [status, neuralLoad, liveHealthData, mode, isAscended]);

    // Triggers
    const handleConnect = () => {
        setStatus('Bridging');
        addLog("Initializing Neural Handshake...");
        setTimeout(() => {
            addLog("Bio-Signature Recognized: DNA-ID Verified.");
            setTimeout(() => {
                setStatus('Synchronized');
                setHiveMindCount(124);
                addLog("BRIDGE ESTABLISHED. MATTER-LIFE SYNC ACTIVE.");
                addLog(`Mode: ${mode.toUpperCase()} Protocol Loaded.`);
            }, 1500);
        }, 1500);
    };

    const handleDisconnect = () => {
        setStatus('Offline');
        setNeuralLoad(20);
        setMachineWeight(100);
        setDataHistory([]);
        setIsAscended(false);
        addLog("Bridge Severed. Manual Control Restored.");
    };

    return (
        <div className={`space-y-8 animate-fade-in pb-20 transition-colors duration-1000 ${isAscended ? 'bg-gradient-to-b from-amber-900/10 to-transparent' : ''}`}>
            {/* Singularity Header */}
            <div className={`p-10 rounded-[3.5rem] border relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group transition-all duration-1000 ${isAscended ? 'bg-amber-950/40 border-amber-500/50 shadow-amber-500/30' : 'bg-[#020308] border-cyan-500/20'}`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className={`absolute -right-40 -top-40 w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse ${isAscended ? 'bg-amber-500/20' : 'bg-cyan-600/10'}`}></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className={`p-8 text-black rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] border group-hover:rotate-12 transition-transform duration-700 ${isAscended ? 'bg-amber-500 border-amber-400' : 'bg-cyan-600 border-cyan-400'}`}>
                            {isAscended ? <Crown className="w-16 h-16 animate-pulse" /> : <Orbit className="w-16 h-16 animate-spin-slow" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`px-4 py-1.5 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 ${isAscended ? 'bg-amber-500' : 'bg-cyan-500'}`}>
                                    <Link className="w-3 h-3" /> Apex-Continuum v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">STATUS: {status.toUpperCase()}</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Royal <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isAscended ? 'from-amber-300 via-yellow-200 to-amber-500' : 'from-cyan-400 to-purple-600'}`}>Singularity</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                         <div className="px-10 py-5 text-center border-r border-white/5">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Neural Link</p>
                             <div className="flex items-center gap-2 justify-center">
                                 <Wifi className={`w-4 h-4 ${status === 'Synchronized' ? 'text-green-500' : 'text-gray-500'}`} />
                                 <p className={`text-4xl font-black italic ${status === 'Synchronized' ? 'text-green-400' : 'text-gray-600'}`}>{status === 'Synchronized' ? '1ms' : '--'}</p>
                             </div>
                         </div>
                         <div className="px-10 py-5 text-center">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Efficiency</p>
                             <p className={`text-4xl font-black italic ${isAscended ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`}>{synapseEfficiency}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN INTERFACE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-auto lg:h-[600px]">
                
                {/* 1. BIOLOGICAL NODE (User) */}
                <Card className={`flex flex-col justify-between transition-all duration-1000 rounded-[3rem] shadow-2xl ${isAscended ? 'bg-amber-950/30 border-amber-500/40' : status === 'Synchronized' ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-gray-950 border-white/5'}`}>
                    <div className="flex justify-between items-start p-2">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isAscended ? 'text-amber-400' : 'text-cyan-400'}`}>Biological Node</p>
                            <h3 className="text-2xl font-bold text-white">CNS Status</h3>
                        </div>
                        <BrainCircuit className={`w-8 h-8 ${isAscended ? 'text-amber-400 animate-spin-slow' : status === 'Synchronized' ? 'text-cyan-400 animate-pulse' : 'text-gray-600'}`} />
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center relative py-10 lg:py-0">
                        {/* Brain Visualization */}
                        <div className="relative w-48 h-48">
                            <div className={`absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-300 ${isAscended ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ transform: `scale(${neuralLoad / 50})` }}></div>
                            <svg viewBox="0 0 100 100" className={`w-full h-full fill-current opacity-80 ${isAscended ? 'text-amber-500 drop-shadow-[0_0_25px_#f59e0b]' : 'text-cyan-500 drop-shadow-[0_0_15px_cyan]'}`}>
                                <path d="M50 20 C30 20 15 35 15 55 C15 75 30 90 50 90 C70 90 85 75 85 55 C85 35 70 20 50 20 M50 30 C60 30 70 38 70 50 C70 62 60 70 50 70 C40 70 30 62 30 50 C30 38 40 30 50 30" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-black text-white">{Math.round(neuralLoad)}%</span>
                            </div>
                        </div>
                        <div className="mt-8 flex gap-4 text-xs font-mono text-cyan-300">
                             <span className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">HR: {liveHealthData.heartRate.avg} BPM</span>
                             <span className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">FATIGUE: {neuralLoad > 70 ? 'HIGH' : 'LOW'}</span>
                        </div>
                        
                        {/* HIVE MIND STATS */}
                        {status === 'Synchronized' && (
                            <div className="mt-6 flex items-center gap-2 p-3 bg-black/60 rounded-2xl border border-white/10">
                                <Users className="w-4 h-4 text-purple-400" />
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Hive Mind: {hiveMindCount} Connected</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* 2. THE BRIDGE (Control Center & Entanglement Visualization) */}
                <Card className="flex flex-col items-center justify-center bg-black border-2 border-white/10 relative overflow-hidden p-0 rounded-[3rem] shadow-2xl">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black"></div>
                    {status === 'Synchronized' && (
                        <div className={`absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,${isAscended ? '#f59e0b' : '#22d3ee'}_360deg)] opacity-10 animate-spin-slow`}></div>
                    )}
                    
                    <div className="relative z-10 w-full p-8 text-center space-y-8 flex flex-col h-full justify-between">
                        {/* Entanglement Map */}
                        {status === 'Synchronized' ? (
                            <div className="flex-1 flex flex-col items-center justify-center relative">
                                <div className={`absolute w-64 h-64 border rounded-full animate-pulse ${isAscended ? 'border-amber-500/40' : 'border-cyan-500/20'}`}></div>
                                <div className={`absolute w-48 h-48 border rounded-full animate-ping ${isAscended ? 'border-amber-500/30' : 'border-purple-500/20'}`}></div>
                                
                                <div className="grid grid-cols-2 gap-8 z-10 w-full max-w-xs">
                                    {entangledModules.map((mod, i) => (
                                        <div key={i} className={`p-3 bg-black/80 rounded-2xl border border-white/10 flex flex-col items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                                            <div className={`w-2 h-2 rounded-full mb-2 ${mod.color} bg-current shadow-[0_0_5px_current]`}></div>
                                            <span className="text-[10px] font-black text-gray-300 uppercase">{mod.id}</span>
                                            <span className={`text-[8px] ${mod.color}`}>{mod.status}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black rounded-full border-4 flex items-center justify-center z-20 ${isAscended ? 'border-amber-500 shadow-[0_0_50px_#f59e0b]' : 'border-cyan-500 shadow-[0_0_30px_cyan]'}`}>
                                    {isAscended ? <Crown className="w-8 h-8 text-amber-500 animate-bounce" /> : <Activity className="w-8 h-8 text-cyan-400 animate-bounce" />}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className={`w-40 h-40 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-500 border-gray-800 bg-gray-900`}>
                                    <Lock className="w-16 h-16 text-gray-600" />
                                </div>
                                <div className="mt-8">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Bridge Status</p>
                                    <p className={`text-3xl font-black uppercase italic text-gray-600`}>OFFLINE</p>
                                </div>
                            </div>
                        )}

                        {status === 'Offline' ? (
                            <button onClick={handleConnect} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs hover:bg-cyan-400 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2">
                                <Link className="w-4 h-4"/> Initialize Link
                            </button>
                        ) : (
                            <div className="space-y-3 w-full">
                                <div className="grid grid-cols-3 gap-2">
                                    {['Strength', 'Hypertrophy', 'Endurance'].map((m) => (
                                        <button 
                                            key={m}
                                            onClick={() => { setMode(m as any); addLog(`Switched to ${m} Mode`); }}
                                            className={`py-3 rounded-xl text-[9px] font-bold uppercase border transition-all ${mode === m ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg' : 'bg-transparent text-gray-500 border-gray-800 hover:text-white'}`}
                                        >
                                            {m.slice(0,3)}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={handleDisconnect} className="w-full bg-red-600/20 border border-red-500 text-red-500 font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)]">
                                    Emergency Sever
                                </button>
                            </div>
                        )}

                        {/* SELF-WRITING CODE TERMINAL */}
                        <div className="h-32 w-full bg-gray-900 rounded-2xl p-4 overflow-hidden border border-white/5 text-left flex flex-col shadow-inner">
                            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-1">
                                <Code className="w-3 h-3 text-green-500" />
                                <span className="text-[8px] font-mono text-gray-500">SELF_OPTIMIZING_KERNEL</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col-reverse">
                                {codeMutations.map((log, i) => (
                                    <p key={i} className="text-[8px] font-mono text-green-400/80 truncate pl-2 mb-0.5">
                                        {log}
                                    </p>
                                ))}
                                {logs.map((log, i) => (
                                    <p key={i + 100} className="text-[9px] font-mono text-cyan-500/70 truncate border-l-2 border-cyan-500/20 pl-2 mb-1">
                                        <span className="text-gray-600 mr-2">{'>'}</span>{log}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* 3. MECHANICAL NODE (Machine) */}
                <Card className={`flex flex-col justify-between transition-all duration-1000 rounded-[3rem] shadow-2xl ${isAscended ? 'bg-amber-950/30 border-amber-500/40' : status === 'Synchronized' ? 'bg-purple-950/20 border-purple-500/30' : 'bg-gray-950 border-white/5'}`}>
                    <div className="flex justify-between items-start p-2">
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isAscended ? 'text-amber-400' : 'text-purple-400'}`}>Mechanical Node</p>
                            <h3 className="text-2xl font-bold text-white">Resistance Matrix</h3>
                        </div>
                        <Cpu className={`w-8 h-8 ${isAscended ? 'text-amber-400 animate-bounce' : status === 'Synchronized' ? 'text-purple-400 animate-pulse' : 'text-gray-600'}`} />
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center">
                         <div className="relative w-48 h-48 flex items-center justify-center">
                            <div className={`absolute w-full h-full border-4 border-dashed rounded-full ${isAscended ? 'border-amber-500/60 animate-spin' : status === 'Synchronized' ? 'border-purple-500/50 animate-spin-reverse-slow' : 'border-gray-800'}`}></div>
                            <div className="text-center">
                                <span className={`text-6xl font-black italic tracking-tighter ${isAscended ? 'text-amber-500 drop-shadow-[0_0_15px_#f59e0b]' : 'text-white'}`}>{Math.floor(machineWeight)}</span>
                                <span className="text-sm font-bold text-gray-500 block uppercase">KG</span>
                            </div>
                        </div>
                        <div className="mt-8 space-y-4 text-center w-full">
                            <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Auto-Regulation Logic</p>
                                <p className={`text-xs font-mono font-bold leading-tight ${neuralLoad > 80 ? 'text-green-400' : isAscended ? 'text-amber-300' : 'text-purple-300'}`}>
                                    "{aiReasoning}"
                                </p>
                            </div>
                            
                            {status === 'Synchronized' && (
                                <div className="text-[9px] text-gray-500 flex items-center justify-center gap-2">
                                    <Server className="w-3 h-3"/> Latency: 1ms (Zero-Point)
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* LIVE DATA STREAM GRAPH */}
            <Card className="bg-[#0c0c0c] border-white/10 h-80 relative overflow-hidden rounded-[3rem] p-8 shadow-2xl">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <h3 className="text-xl font-black text-white italic uppercase">Singularity Stream</h3>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">CNS Fatigue %</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_purple]"></div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Machine Load (kg)</p>
                        </div>
                    </div>
                </div>

                <div className="absolute inset-0 mt-20">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dataHistory}>
                            <defs>
                                <linearGradient id="colorNeural" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <YAxis hide domain={[0, 200]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="neural" 
                                stroke="#06b6d4" 
                                strokeWidth={3} 
                                fill="url(#colorNeural)" 
                                isAnimationActive={false}
                                name="CNS Fatigue %"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="weight" 
                                stroke="#a855f7" 
                                strokeWidth={3} 
                                fill="url(#colorWeight)" 
                                isAnimationActive={false}
                                name="Weight (kg)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

export default RoyalSingularity;
