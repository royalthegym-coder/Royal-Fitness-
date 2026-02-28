
import React, { useState, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { 
    Globe, Activity, Users, ShieldCheck, Cpu, Database, 
    Zap, Brain, Network, Terminal, Radio, Orbit, 
    Fingerprint, Gauge, Server, ShieldAlert
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { motion, AnimatePresence } from 'motion/react';

const RoyalOvermind: React.FC = () => {
    const { activeMemberCount, systemHealth, auditLogs, evolutionLevel, systemVersion } = useData();
    const [networkLoad, setNetworkLoad] = useState(42);
    const [activeNodes, setActiveNodes] = useState(0);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setNetworkLoad(prev => Math.min(99.9, Math.max(10, prev + (Math.random() * 4 - 2))));
            setActiveNodes(Math.floor(Math.random() * 1000) + 5000);
        }, 2000);

        const terminalInterval = setInterval(() => {
            const logs = [
                "SYNCING BIO-BUFFER...",
                "NEURAL PATHWAY OPTIMIZED.",
                "THREAT LEVEL: NEGLIGIBLE.",
                "EVOLUTION ENGINE AT 100%.",
                "GLOBAL UPLINK STABLE.",
                "PROCESSING MEMBER DELTAS...",
                "ENCRYPTING LEDGER NODES...",
                "APEX CONTINUUM v32.0 DEPLOYED."
            ];
            setTerminalLines(prev => [logs[Math.floor(Math.random() * logs.length)], ...prev].slice(0, 8));
        }, 3000);

        return () => {
            clearInterval(interval);
            clearInterval(terminalInterval);
        };
    }, []);

    const systemMetrics = useMemo(() => [
        { label: 'Neural Load', value: `${networkLoad.toFixed(1)}%`, icon: <Activity className="w-5 h-5 text-cyan-400" />, color: 'cyan' },
        { label: 'Bio-Nodes', value: activeMemberCount, icon: <Users className="w-5 h-5 text-green-400" />, color: 'green' },
        { label: 'Integrity', value: `${systemHealth}%`, icon: <ShieldCheck className="w-5 h-5 text-amber-400" />, color: 'amber' },
        { label: 'Evolution', value: evolutionLevel.toFixed(1), icon: <Zap className="w-5 h-5 text-indigo-400" />, color: 'indigo' },
    ], [networkLoad, activeMemberCount, systemHealth, evolutionLevel]);

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
            {/* Hero Section: The Singularity Core */}
            <div className="relative p-12 rounded-[4rem] bg-black border border-indigo-500/20 shadow-[0_0_100px_rgba(79,70,229,0.1)] overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black"></div>
                
                {/* Animated Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-indigo-500/5 rounded-full animate-spin-slow"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/5 rounded-full animate-spin-reverse-slow"></div>

                <div className="relative z-10 flex flex-col items-center text-center">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="mb-8 relative"
                    >
                        <div className="absolute inset-0 bg-indigo-500/40 rounded-full blur-3xl animate-pulse"></div>
                        <Orbit className="w-32 h-32 text-white relative z-10 drop-shadow-[0_0_50px_rgba(99,102,241,0.8)]" />
                    </motion.div>
                    
                    <h1 className="text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-500">Overlord</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-4">
                        <span className="h-px w-12 bg-indigo-500/30"></span>
                        <p className="text-indigo-400 text-[10px] font-mono tracking-[1em] uppercase">{systemVersion}</p>
                        <span className="h-px w-12 bg-indigo-500/30"></span>
                    </div>
                    
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-4xl">
                        {systemMetrics.map((m, i) => (
                            <div key={i} className="flex flex-col items-center p-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                <div className="p-3 rounded-2xl bg-black/40 mb-3">
                                    {m.icon}
                                </div>
                                <span className="text-2xl font-black text-white italic">{m.value}</span>
                                <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">{m.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: System Status & Terminal */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="bg-black border-white/5 rounded-[3rem] p-8 overflow-hidden relative">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-white italic uppercase tracking-widest flex items-center gap-3">
                                <Cpu className="w-5 h-5 text-indigo-500" />
                                Processing Matrix
                            </h3>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Optimal</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="p-6 rounded-3xl bg-gray-900/50 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Global Uplink</span>
                                        <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                                    </div>
                                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '88%' }}
                                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-600">
                                        <span>88% STRENGTH</span>
                                        <span>Jhunjhunu, IN</span>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-gray-900/50 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Neural Synapse</span>
                                        <Brain className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '94%' }}
                                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-2 text-[9px] font-mono text-gray-600">
                                        <span>94% EFFICIENCY</span>
                                        <span>APEX CORE</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-950 rounded-3xl p-6 border border-white/5 font-mono text-[10px] text-indigo-400/80 space-y-2 h-full min-h-[200px] overflow-hidden">
                                <div className="flex items-center gap-2 text-gray-600 mb-4 border-b border-white/5 pb-2">
                                    <Terminal className="w-3 h-3" />
                                    <span>SYSTEM_TRACE_LOG</span>
                                </div>
                                <AnimatePresence mode="popLayout">
                                    {terminalLines.map((line, i) => (
                                        <motion.div 
                                            key={line + i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="flex gap-3"
                                        >
                                            <span className="text-gray-700">[{new Date().toLocaleTimeString()}]</span>
                                            <span className={i === 0 ? "text-white font-bold" : ""}>{line}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="bg-black border-white/5 rounded-[3rem] p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-amber-500/10">
                                    <Database className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black italic uppercase tracking-widest text-sm">Bio-Storage</h4>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase">Decentralized Ledger</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Total Capacity</span>
                                    <span className="text-white font-mono">1.2 PB</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Used Space</span>
                                    <span className="text-amber-500 font-mono">142.8 TB</span>
                                </div>
                                <div className="h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 w-[12%]"></div>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-black border-white/5 rounded-[3rem] p-8">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-2xl bg-cyan-500/10">
                                    <Network className="w-6 h-6 text-cyan-500" />
                                </div>
                                <div>
                                    <h4 className="text-white font-black italic uppercase tracking-widest text-sm">Network Mesh</h4>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase">Global Distribution</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1,2,3,4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center">
                                            <Globe className="w-4 h-4 text-cyan-500" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400 font-mono">+14 Nodes Online</span>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Live Thought Stream */}
                <div className="space-y-8">
                    <Card title="Neural Stream" className="bg-black border-white/10 h-[700px] flex flex-col p-0 overflow-hidden rounded-[4rem]">
                        <div className="bg-gray-900/50 px-8 py-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Fingerprint className="w-5 h-5 text-indigo-400 animate-pulse" />
                                <span className="text-xs font-black text-white italic uppercase tracking-widest">Live Consciousness</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono text-gray-500">REALTIME_SYNC</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 font-mono text-xs custom-scrollbar">
                            {auditLogs.map((log, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative pl-6 border-l border-indigo-500/20 py-2"
                                >
                                    <div className="absolute left-[-4px] top-4 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-indigo-500/60 font-bold">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase tracking-widest">{log.action}</span>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed">{log.details}</p>
                                </motion.div>
                            ))}
                        </div>
                        <div className="p-6 bg-gray-900/30 border-t border-white/5">
                            <button className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95">
                                Purge System Cache
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default RoyalOvermind;
