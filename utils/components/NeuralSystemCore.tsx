
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { 
    Activity, Zap, Database, Cpu, Terminal, 
    RefreshCw, Layers, ShieldCheck, Heart, 
    Wind, Eye, Lock, Server, Network, 
    Binary, Fingerprint, Waves, Sparkles,
    HardDrive, Wifi, Power, BrainCircuit, Settings,
    Globe, CheckCircle
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useData } from '../context/DataProvider';

interface SystemNode {
    id: string;
    name: string;
    type: 'Intelligence' | 'Database' | 'Security' | 'Hardware';
    status: 'Online' | 'Processing' | 'Optimizing' | 'Warning';
    latency: number; 
    load: number;
    icon: React.ReactNode;
    color: string;
    angle: number; // For orbital position
}

const NeuralSystemCore: React.FC = () => {
    const { addToast } = useToast();
    const { activeMemberCount, transactions } = useData();
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'reactor' | 'telemetry' | 'protocols'>('reactor');
    const [systemLoad, setSystemLoad] = useState(42);
    const [uptime, setUptime] = useState('00:00:00');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizingNode, setOptimizingNode] = useState<string | null>(null);
    
    // Live Chart Data
    const [performanceData, setPerformanceData] = useState<{time: string, cpu: number, memory: number, entropy: number}[]>([]);

    const [nodes, setNodes] = useState<SystemNode[]>([
        { id: 'ai_core', name: 'Gemini Neural Core', type: 'Intelligence', status: 'Online', latency: 12, load: 45, icon: <BrainCircuit className="w-5 h-5"/>, color: 'text-cyan-400', angle: 0 },
        { id: 'db_shard', name: 'Quantum Ledger', type: 'Database', status: 'Online', latency: 5, load: 23, icon: <Database className="w-5 h-5"/>, color: 'text-purple-400', angle: 90 },
        { id: 'sec_net', name: 'Sentinel Shield', type: 'Security', status: 'Online', latency: 2, load: 12, icon: <ShieldCheck className="w-5 h-5"/>, color: 'text-green-400', angle: 180 },
        { id: 'iot_hub', name: 'Synapse IoT', type: 'Hardware', status: 'Processing', latency: 45, load: 78, icon: <Wifi className="w-5 h-5"/>, color: 'text-amber-400', angle: 270 },
    ]);
    
    const [logs, setLogs] = useState<string[]>([]);
    const terminalRef = useRef<HTMLDivElement>(null);

    // --- UPTIME ENGINE ---
    useEffect(() => {
        const start = Date.now();
        const timer = setInterval(() => {
            const diff = Date.now() - start; 
            const totalSecs = Math.floor(diff / 1000) + 84600 * 42; // Mocking long uptime
            const d = Math.floor(totalSecs / 86400);
            const h = Math.floor((totalSecs % 86400) / 3600).toString().padStart(2, '0');
            const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
            const s = Math.floor(totalSecs % 60).toString().padStart(2, '0');
            setUptime(`${d}d ${h}:${m}:${s}`);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // --- LIVE KERNEL SIMULATION ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
            
            // 1. Simulate Load & Entropy
            const cpu = Math.floor(Math.random() * 30) + 20; 
            const mem = Math.floor(Math.random() * 20) + 40; 
            const entropy = Math.floor(Math.random() * 15);
            setSystemLoad(cpu);

            // 2. Update Chart
            setPerformanceData(prev => [...prev.slice(-30), { time: timeStr, cpu, memory: mem, entropy }]);

            // 3. Update Nodes (Orbit Animation & Status)
            setNodes(prev => prev.map(n => ({
                ...n,
                angle: (n.angle + 0.5) % 360, // Rotate
                load: Math.max(5, Math.min(100, n.load + (Math.random() * 10 - 5))),
                latency: Math.max(1, Math.min(200, n.latency + (Math.random() * 10 - 5))),
                status: n.id === optimizingNode ? 'Optimizing' : n.load > 90 ? 'Warning' : n.load > 60 ? 'Processing' : 'Online'
            })));

            // 4. Generate Log
            if (Math.random() > 0.6) {
                const actions = [
                    `[KERNEL] Processed Transaction Hash for Member #${Math.floor(Math.random()*100)}`,
                    `[AI] Optimizing Neural Pathways... Delta: ${Math.random().toFixed(3)}`,
                    "[SYS] Garbage Collection: 24mb freed.",
                    "[SEC] Sentinel Scan: No Threats Detected.",
                    `[IOT] Device Handshake: ${Math.floor(Math.random()*5)} devices synced.`,
                    "[DB] Revenue Oracle: Updating Projections..."
                ];
                setLogs(l => [`${timeStr} ${actions[Math.floor(Math.random() * actions.length)]}`, ...l].slice(0, 50));
            }

        }, 100); // Fast refresh for smooth animation
        return () => clearInterval(interval);
    }, [optimizingNode]);

    // Auto-scroll terminal (kept at top for latest)
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = 0;
        }
    }, [logs]);

    // --- ACTIONS ---

    const executeProtocol = (protocol: string) => {
        setIsOptimizing(true);
        
        let targetNode = 'ai_core';
        if (protocol.includes('Database')) targetNode = 'db_shard';
        if (protocol.includes('Cache')) targetNode = 'iot_hub';
        
        setOptimizingNode(targetNode);
        addToast(`System Pulse: Initiating ${protocol}...`, "info");
        
        // Inject Log
        setLogs(l => [`${new Date().toLocaleTimeString()} ADMIN_OVERRIDE: Executing ${protocol}...`, ...l]);

        setTimeout(() => {
            setIsOptimizing(false);
            setOptimizingNode(null);
            if (protocol === 'Flush Cache') {
                setPerformanceData(prev => prev.map(d => ({ ...d, memory: d.memory * 0.5 }))); // Visual drop
                addToast("Memory Buffer Cleared.", "success");
            } else if (protocol === 'Optimize Database') {
                setNodes(prev => prev.map(n => n.id === 'db_shard' ? { ...n, latency: 2 } : n));
                addToast("Database Indexes Re-aligned.", "success");
            } else {
                addToast("Deep Scan Complete. System Nominal.", "success");
            }
        }, 2500);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. KERNEL HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-cyan-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-cyan-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                            <Activity className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Server className="w-3 h-3"/> System Pulse
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">v31.0 APEX-CONTINUUM</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Core</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-4">
                         <div className="bg-gray-900/80 p-4 rounded-[2rem] border border-white/10 backdrop-blur-xl text-center min-w-[140px] shadow-2xl">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Uptime</p>
                             <p className="text-2xl font-mono text-white font-bold">{uptime}</p>
                         </div>
                         <div className="bg-gray-900/80 p-4 rounded-[2rem] border border-white/10 backdrop-blur-xl text-center min-w-[140px] shadow-2xl">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">Global Load</p>
                             <p className={`text-3xl font-black italic ${systemLoad > 80 ? 'text-red-500' : 'text-cyan-400'}`}>{systemLoad}%</p>
                         </div>
                    </div>
                </div>
            </div>

            {/* 2. TAB CONTROLS */}
            <div className="flex bg-gray-950 p-2 rounded-[2rem] border border-white/5 w-fit mx-auto backdrop-blur-xl shadow-xl">
                {[
                    { id: 'reactor', label: 'Neural Reactor', icon: <BrainCircuit className="w-4 h-4" /> },
                    { id: 'telemetry', label: 'Quantum Telemetry', icon: <Activity className="w-4 h-4" /> },
                    { id: 'protocols', label: 'Protocol Deck', icon: <Settings className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
                            activeTab === tab.id 
                            ? 'bg-cyan-600 text-white shadow-lg' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: VISUALIZATION */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* VISUAL 1: NEURAL REACTOR (ORBITAL MAP) */}
                    {activeTab === 'reactor' && (
                        <Card className="bg-[#050505] border-white/5 p-0 rounded-[3.5rem] h-[500px] shadow-2xl relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.05)_0%,_transparent_70%)]"></div>
                            
                            {/* Central Singularity */}
                            <div className="relative z-10 w-32 h-32 bg-black rounded-full border-4 border-cyan-500 shadow-[0_0_50px_cyan] flex items-center justify-center animate-pulse">
                                <Cpu className="w-16 h-16 text-cyan-400" />
                            </div>

                            {/* Orbiting Nodes */}
                            <div className="absolute inset-0 z-0">
                                {nodes.map((node) => {
                                    // Calculate position based on angle
                                    const radius = 180; // Distance from center
                                    const rad = (node.angle * Math.PI) / 180;
                                    const x = Math.cos(rad) * radius;
                                    const y = Math.sin(rad) * radius;

                                    return (
                                        <div 
                                            key={node.id}
                                            className="absolute top-1/2 left-1/2 w-fit h-fit transition-transform duration-75"
                                            style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                                        >
                                            <div className={`flex flex-col items-center gap-2 group cursor-pointer`}>
                                                <div className={`p-4 rounded-2xl border-2 bg-black transition-all duration-300 relative ${node.color.replace('text-', 'border-')} ${node.status === 'Optimizing' ? 'scale-125 shadow-[0_0_30px_white]' : 'shadow-xl'}`}>
                                                    {node.status === 'Optimizing' && <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping"></div>}
                                                    {node.icon}
                                                </div>
                                                <div className="bg-black/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md text-center">
                                                    <p className="text-[9px] font-black text-white uppercase">{node.name}</p>
                                                    <p className={`text-[8px] font-mono ${node.color}`}>{node.status} • {node.load}%</p>
                                                </div>
                                                {/* Connection Line to Center (Visual only, CSS trick) */}
                                                <div className={`absolute top-1/2 left-1/2 w-[180px] h-[1px] bg-gradient-to-l from-${node.color.split('-')[1]}-500 to-transparent opacity-20 -z-10 origin-left`} 
                                                     style={{ transform: `rotate(${node.angle + 180}deg)` }}>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Status Footer */}
                            <div className="absolute bottom-8 left-0 right-0 text-center">
                                <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em] animate-pulse">NEURAL NETWORK SYNCHRONIZED</p>
                            </div>
                        </Card>
                    )}

                    {/* VISUAL 2: TELEMETRY CHARTS */}
                    {activeTab === 'telemetry' && (
                        <Card title="Quantum Telemetry" className="bg-black border-white/5 p-8 rounded-[3rem] h-[500px] shadow-2xl">
                            <div className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={performanceData}>
                                        <defs>
                                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorEntropy" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="time" stroke="#444" fontSize={10} tick={false} axisLine={false} />
                                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                                        <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px' }} itemStyle={{ fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={3} fill="url(#colorCpu)" name="CPU Load" />
                                        <Area type="monotone" dataKey="entropy" stroke="#ef4444" strokeWidth={2} fill="url(#colorEntropy)" name="Sys Entropy" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}

                    {/* VISUAL 3: PROTOCOL DECK */}
                    {activeTab === 'protocols' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                                 { id: 'Flush Cache', desc: 'Clear temporary memory buffer.', icon: <RefreshCw/>, color: 'border-amber-500 text-amber-500' },
                                 { id: 'Optimize Database', desc: 'Re-index shards for faster query.', icon: <Database/>, color: 'border-purple-500 text-purple-500' },
                                 { id: 'Deep Scan', desc: 'Full system diagnostic run.', icon: <Eye/>, color: 'border-green-500 text-green-500' },
                                 { id: 'Reboot Core', desc: 'Restart Neural Engine (Downtime: 2s).', icon: <Power/>, color: 'border-red-500 text-red-500' }
                             ].map((action) => (
                                 <button
                                     key={action.id}
                                     onClick={() => executeProtocol(action.id)}
                                     disabled={isOptimizing}
                                     className={`w-full p-8 bg-black border rounded-[2.5rem] flex items-center justify-between group transition-all hover:scale-[1.02] active:scale-95 ${action.color.replace('text-', 'border-').replace('border-', 'hover:bg-').replace('500', '900/20')} border-white/10`}
                                 >
                                     <div className="flex items-center gap-6">
                                         <div className={`p-4 bg-gray-900 rounded-2xl ${action.color} border border-current shadow-lg`}>
                                             {isOptimizing ? <RefreshCw className="w-6 h-6 animate-spin"/> : React.cloneElement(action.icon as React.ReactElement<{ className: string }>, { className: "w-6 h-6" })}
                                         </div>
                                         <div className="text-left">
                                             <h4 className="text-lg font-black text-white italic uppercase">{action.id}</h4>
                                             <p className="text-xs text-gray-500">{action.desc}</p>
                                         </div>
                                     </div>
                                     <Layers className="w-6 h-6 text-gray-700 group-hover:text-white transition-colors" />
                                 </button>
                             ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: TERMINAL & STATS */}
                <div className="lg:col-span-4 space-y-6">
                     
                     {/* Data Shard */}
                     <Card className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl">
                         <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">Data Entanglement</h3>
                         <div className="space-y-4">
                             <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Members</span>
                                 <span className="text-xl font-black text-cyan-400">{activeMemberCount}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live TXNs</span>
                                 <span className="text-xl font-black text-green-400">{transactions.length}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Storage</span>
                                 <span className="text-xl font-black text-purple-400">42%</span>
                             </div>
                         </div>
                     </Card>

                     {/* Hyper-Terminal */}
                     <Card title="Cortex Terminal" className="bg-black border-white/10 p-0 overflow-hidden flex flex-col h-[500px] rounded-[3rem] shadow-2xl">
                        <div className="bg-gray-900/80 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2"><Terminal className="w-3 h-3"/> root@apex_v31</span>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                                <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                            </div>
                        </div>
                        
                        <div ref={terminalRef} className="flex-1 overflow-y-auto p-6 font-mono text-[10px] text-cyan-400/80 space-y-2 custom-scrollbar bg-[#020202]">
                            <div className="text-gray-600 italic mb-4">-- System Boot Sequence Complete --</div>
                            {logs.map((log, i) => (
                                <p key={i} className={`text-[9px] font-mono truncate border-l-2 pl-2 mb-1 ${
                                    log.includes('ADMIN') ? 'text-amber-400 border-amber-500' : 
                                    log.includes('SEC') ? 'text-red-400 border-red-500' :
                                    'text-cyan-500/70 border-cyan-500/20'
                                }`}>
                                    <span className="text-gray-600 mr-2">{'>'}</span>{log}
                                </p>
                            ))}
                            <div className="flex items-center gap-2 mt-4 animate-pulse">
                                 <span className="text-green-500">_</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NeuralSystemCore;
