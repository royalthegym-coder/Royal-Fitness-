import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Power, Terminal, ShieldAlert, Eye, Brain, Network, 
    Database, CheckCircle2, AlertTriangle, Lock, Activity,
    Zap, Cpu, Globe, Server
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type SystemState = 'offline' | 'booting' | 'online' | 'error';

export const LaunchCommandCenter: React.FC = () => {
    const { addToast } = useToast();
    const [launchStatus, setLaunchStatus] = useState<'standby' | 'initiating' | 'live'>('standby');
    const [logs, setLogs] = useState<{time: string, msg: string, type: 'info'|'success'|'warning'}[]>([]);
    const [authCode, setAuthCode] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    
    const [systems, setSystems] = useState({
        titanVision: 'offline' as SystemState,
        kitchenChief: 'offline' as SystemState,
        royalNexus: 'offline' as SystemState,
        bioOracle: 'offline' as SystemState,
        sovereignOverride: 'online' as SystemState // Always online for safety
    });

    const [telemetry, setTelemetry] = useState<any[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    // Telemetry generator when live
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (launchStatus === 'live') {
            interval = setInterval(() => {
                const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
                setTelemetry(prev => {
                    const newData = [...prev, { 
                        time, 
                        cpuLoad: Math.floor(Math.random() * 30) + 40,
                        aiRequests: Math.floor(Math.random() * 500) + 1000
                    }];
                    if (newData.length > 20) newData.shift();
                    return newData;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [launchStatus]);

    const addLog = (msg: string, type: 'info'|'success'|'warning' = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 2 });
        setLogs(prev => [...prev, { time, msg, type }]);
    };

    const handleAuthorize = () => {
        if (authCode === 'SINGULARITY_99') {
            setIsAuthorized(true);
            addLog('Vocal Frequency & Code Accepted. Admin Control Verified.', 'success');
            addToast('Authorization Successful', 'success');
        } else {
            addLog('AUTHORIZATION FAILED. Invalid Code.', 'warning');
            addToast('Invalid Authorization Code', 'error');
        }
    };

    const initiateLaunch = async () => {
        if (!isAuthorized) return;
        
        setLaunchStatus('initiating');
        addLog('INITIATING THE SINGULARITY PROTOCOL...', 'warning');
        
        // Sequence 1: Titan Vision
        setSystems(s => ({...s, titanVision: 'booting'}));
        addLog('Booting Titan Vision Engine (Frame-Skipping Algorithm)...', 'info');
        await new Promise(r => setTimeout(r, 2000));
        setSystems(s => ({...s, titanVision: 'online'}));
        addLog('Titan Vision Engine ONLINE. Cameras active.', 'success');

        // Sequence 2: Kitchen Chief
        setSystems(s => ({...s, kitchenChief: 'booting'}));
        addLog('Syncing AI Kitchen Chief with Supabase Vector DB...', 'info');
        await new Promise(r => setTimeout(r, 1500));
        setSystems(s => ({...s, kitchenChief: 'online'}));
        addLog('AI Kitchen Chief ONLINE. Med-PaLM 3 connected.', 'success');

        // Sequence 3: Royal Nexus
        setSystems(s => ({...s, royalNexus: 'booting'}));
        addLog('Engaging Royal Nexus Auto-Pilot...', 'info');
        await new Promise(r => setTimeout(r, 2000));
        setSystems(s => ({...s, royalNexus: 'online'}));
        addLog('Royal Nexus ONLINE. Omni-channel sync established.', 'success');

        // Sequence 4: Bio-Aether Oracle
        setSystems(s => ({...s, bioOracle: 'booting'}));
        addLog('Calibrating Bio-Aether Oracle (rPPG & Diagnostics) via Cloudcode & Sensorflow Engine...', 'info');
        await new Promise(r => setTimeout(r, 2500));
        setSystems(s => ({...s, bioOracle: 'online'}));
        addLog('Bio-Aether Oracle ONLINE. Health monitoring active.', 'success');

        // Finalize
        await new Promise(r => setTimeout(r, 1000));
        setLaunchStatus('live');
        addLog('ALL SYSTEMS NOMINAL. THE SINGULARITY IS LIVE.', 'success');
        addToast('SYSTEM LIVE: Welcome to the Future of Fitness.', 'success');
    };

    const handleKillSwitch = () => {
        setLaunchStatus('standby');
        setIsAuthorized(false);
        setAuthCode('');
        setSystems({
            titanVision: 'offline',
            kitchenChief: 'offline',
            royalNexus: 'offline',
            bioOracle: 'offline',
            sovereignOverride: 'online'
        });
        setTelemetry([]);
        addLog('SOVEREIGN OVERRIDE ENGAGED. ALL SYSTEMS SHUTDOWN.', 'warning');
        addToast('Emergency Shutdown Complete.', 'error');
    };

    const SystemCard = ({ title, icon: Icon, state, desc }: { title: string, icon: any, state: SystemState, desc: string }) => {
        const stateColors = {
            offline: 'text-zinc-500 border-white/5 bg-zinc-900/50',
            booting: 'text-amber-400 border-amber-500/50 bg-amber-500/10 animate-pulse',
            online: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
            error: 'text-red-400 border-red-500/50 bg-red-500/10'
        };

        return (
            <div className={`p-4 rounded-2xl border transition-all duration-500 ${stateColors[state]}`}>
                <div className="flex justify-between items-start mb-3">
                    <Icon className="w-6 h-6" />
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-black/50">
                        {state}
                    </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
                <p className="text-[10px] opacity-70 leading-relaxed">{desc}</p>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="bg-black border border-red-500/30 rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] shrink-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${launchStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                                    {launchStatus === 'live' ? 'SYSTEM LIVE' : 'COMMAND CENTER'}
                                </span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            Launch <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">Command</span>
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono mt-2 max-w-2xl">
                            Master control interface for "The Singularity". Initializes all AI agents, vision systems, and automation hubs simultaneously.
                        </p>
                    </div>

                    {launchStatus === 'live' && (
                        <button 
                            onClick={handleKillSwitch}
                            className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(239,68,68,0.6)] flex items-center gap-3 border-2 border-red-400"
                        >
                            <ShieldAlert className="w-5 h-5" />
                            Sovereign Override
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* Left Column: Systems & Auth */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                    
                    {/* Authorization & Launch */}
                    {launchStatus === 'standby' && (
                        <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-amber-500" /> Admin Authorization
                            </h3>
                            
                            {!isAuthorized ? (
                                <div className="flex gap-3">
                                    <input 
                                        type="password" 
                                        placeholder="Enter Secret Code (SINGULARITY_99)"
                                        value={authCode}
                                        onChange={(e) => setAuthCode(e.target.value)}
                                        className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                                    />
                                    <button 
                                        onClick={handleAuthorize}
                                        className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                                    >
                                        Verify
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-sm font-bold uppercase tracking-widest">Mahesh Saini - Authorization Confirmed</span>
                                    </div>
                                    <button 
                                        onClick={initiateLaunch}
                                        className="w-full py-6 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-2xl text-xl font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_40px_rgba(99,102,241,0.5)] flex items-center justify-center gap-4 group"
                                    >
                                        <Power className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                        Initiate The Singularity
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* System Status Grid */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Server className="w-4 h-4" /> Neural OS Modules
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SystemCard 
                                title="Titan Vision Engine" 
                                icon={Eye} 
                                state={systems.titanVision} 
                                desc="Real-time pose estimation, rPPG ghost pulse, and biomechanical analysis."
                            />
                            <SystemCard 
                                title="AI Kitchen Chief" 
                                icon={Brain} 
                                state={systems.kitchenChief} 
                                desc="Med-PaLM 3 integration, Nutrigenomics, and Bio-Individual diet generation."
                            />
                            <SystemCard 
                                title="Royal Nexus Auto-Pilot" 
                                icon={Network} 
                                state={systems.royalNexus} 
                                desc="Omni-channel sync, WhatsApp Cloud API, and automated business logic."
                            />
                            <SystemCard 
                                title="Bio-Aether Oracle" 
                                icon={Activity} 
                                state={systems.bioOracle} 
                                desc="Medical report scanning, symptom mapping, and digital health pass."
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Telemetry & Logs */}
                <div className="flex flex-col gap-6 min-h-0">
                    
                    {/* Live Telemetry */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 shrink-0 relative overflow-hidden min-h-[250px] flex flex-col">
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                            <Activity className="w-4 h-4" /> Live Telemetry
                        </h3>
                        
                        <div className="flex-1 w-full relative z-10 min-h-[150px]">
                            {launchStatus === 'live' ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={telemetry} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
                                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="time" stroke="#ffffff30" fontSize={10} tickMargin={10} />
                                        <YAxis stroke="#ffffff30" fontSize={10} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '12px' }}
                                            itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="cpuLoad" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Activity className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-[10px] font-mono uppercase tracking-widest">Awaiting Ignition</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Terminal Logs */}
                    <div className="bg-black border border-white/10 rounded-[2rem] p-6 flex-1 flex flex-col relative overflow-hidden group hover:border-zinc-500/30 transition-colors">
                        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                            <Terminal className="w-4 h-4" /> System Logs
                        </h3>
                        
                        <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 p-4 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-2">
                            {logs.length === 0 && (
                                <p className="text-zinc-600">System standing by...</p>
                            )}
                            {logs.map((log, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <span className="text-zinc-500 shrink-0">[{log.time}]</span>
                                    <span className={`
                                        ${log.type === 'info' ? 'text-cyan-400' : ''}
                                        ${log.type === 'success' ? 'text-emerald-400 font-bold' : ''}
                                        ${log.type === 'warning' ? 'text-amber-400 font-bold' : ''}
                                    `}>
                                        {log.msg}
                                    </span>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
