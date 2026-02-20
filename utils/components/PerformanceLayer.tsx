
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { SpeedIcon } from './icons/SpeedIcon';
import { TraceIcon } from './icons/TraceIcon';
import { ServerIcon } from './icons/ServerIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';
import { Gauge, Activity, Cpu, Zap, Layers, RefreshCw, BarChart2, Radio } from 'lucide-react';

// --- DATA STRUCTURES ---
interface SystemMetric {
    time: string;
    cpu: number;
    memory: number; // MB
    eventLoopLag: number; // ms
    rps: number; // requests per second
    latency: number; // ms
}

interface TraceSpan {
    id: string;
    name: string;
    startTime: number;
    duration: number; // ms
    status: 'ok' | 'error';
    type: 'db' | 'http' | 'logic';
}

interface ApiTrace {
    id: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT';
    totalDuration: number;
    spans: TraceSpan[];
    timestamp: string;
}

const PerformanceLayer: React.FC = () => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'profiler' | 'tracing' | 'loadtest' | 'cache'>('profiler');
    
    // Profiler Data
    const [metrics, setMetrics] = useState<SystemMetric[]>([]);
    
    // Tracing Data
    const [traces, setTraces] = useState<ApiTrace[]>([]);
    const [selectedTrace, setSelectedTrace] = useState<ApiTrace | null>(null);

    // Load Test Data
    const [loadTestStatus, setLoadTestStatus] = useState<'idle' | 'running' | 'cooling'>('idle');
    const [users, setUsers] = useState(1000);
    const [spawnRate, setSpawnRate] = useState(50);
    
    // Cache Data
    const [cacheStats, setCacheStats] = useState({ hits: 14205, misses: 2304, memory: '1.2 GB', keys: 4521 });
    const [cacheLogs, setCacheLogs] = useState<string[]>([]);

    // AI SRE
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // --- SIMULATION EFFECTS ---

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setMetrics(prev => {
                const defaultMetric: SystemMetric = { 
                    time: timeStr, 
                    cpu: 20, 
                    memory: 400, 
                    eventLoopLag: 5, 
                    rps: 100, 
                    latency: 50 
                };
                const last = prev.length > 0 ? prev[prev.length - 1] : defaultMetric;
                
                let baseCpu = loadTestStatus === 'running' ? 85 : 25;
                let baseLatency = loadTestStatus === 'running' ? 450 : 45;
                let baseRps = loadTestStatus === 'running' ? 2500 : 150;

                const newMetric: SystemMetric = {
                    time: timeStr,
                    cpu: Math.min(100, Math.max(0, baseCpu + Math.random() * 10 - 5)),
                    memory: Math.min(2048, Math.max(200, (last.memory) + (Math.random() * 20 - 10))),
                    eventLoopLag: Math.max(0, (loadTestStatus === 'running' ? 50 : 5) + Math.random() * 10),
                    rps: Math.max(0, baseRps + Math.random() * 50),
                    latency: Math.max(10, baseLatency + Math.random() * 100),
                };
                return [...prev.slice(-30), newMetric]; // Keep last 30 seconds
            });

            // Simulate Traces
            if (Math.random() > 0.7) {
                const endpoints = ['/api/members', '/api/workouts', '/api/billing', '/api/auth/login'];
                const methods: ('GET' | 'POST' | 'PUT')[] = ['GET', 'POST', 'PUT'];
                const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
                const duration = Math.floor(Math.random() * 200 + 50);
                
                const newTrace: ApiTrace = {
                    id: Math.random().toString(36).substr(2, 9),
                    endpoint,
                    method: methods[Math.floor(Math.random() * methods.length)],
                    totalDuration: duration,
                    timestamp: timeStr,
                    spans: [
                        { id: 's1', name: 'Auth Middleware', startTime: 0, duration: 10, status: 'ok', type: 'logic' },
                        { id: 's2', name: 'DB Query', startTime: 12, duration: duration - 30, status: 'ok', type: 'db' },
                        { id: 's3', name: 'Response Format', startTime: duration - 15, duration: 15, status: 'ok', type: 'http' },
                    ]
                };
                setTraces(prev => [newTrace, ...prev].slice(0, 15));
            }

            // Simulate Cache Ops
            if (Math.random() > 0.5) {
                const ops = ['GET user:123', 'SET session:abc', 'GET config:global', 'DEL cache:temp'];
                const op = ops[Math.floor(Math.random() * ops.length)];
                setCacheLogs(prev => [`[${timeStr}] ${op}`, ...prev].slice(0, 8));
                setCacheStats(prev => ({
                    ...prev,
                    hits: prev.hits + (Math.random() > 0.3 ? 1 : 0),
                    misses: prev.misses + (Math.random() > 0.8 ? 1 : 0)
                }));
            }

        }, 1000);
        return () => clearInterval(interval);
    }, [loadTestStatus]);

    // --- HANDLERS ---

    const toggleLoadTest = () => {
        if (loadTestStatus === 'idle') {
            setLoadTestStatus('running');
        } else {
            setLoadTestStatus('cooling');
            setTimeout(() => setLoadTestStatus('idle'), 2000);
        }
    };

    const handleFlushCache = () => {
        setCacheStats(prev => ({ ...prev, keys: 0, memory: '0 MB' }));
        setCacheLogs(prev => [`[${new Date().toLocaleTimeString()}] FLUSHALL command sent.`, ...prev]);
    };

    const handleAiAnalyze = async () => {
        setIsAnalyzing(true);
        setAiInsight(null);
        
        const lastMetric = metrics[metrics.length - 1] || { cpu: 0, memory: 0, latency: 0 };
        const prompt = `
            Act as a Site Reliability Engineer (SRE). Analyze these system metrics:
            - CPU Usage: ${lastMetric.cpu.toFixed(1)}%
            - Memory Heap: ${lastMetric.memory.toFixed(0)} MB
            - API Latency: ${lastMetric.latency.toFixed(0)} ms
            - Redis Cache Hit Rate: ${((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)}%
            
            Identify 1 major bottleneck and suggest 2 specific technical optimizations for a Node.js/React/Redis stack.
            Keep it brief and technical. Format as HTML bullet points.
        `;

        try {
            const result = await getComplexResponse(prompt);
            setAiInsight(result);
        } catch (e) {
            console.error(e);
            setAiInsight("Unable to generate analysis. Check AI service connectivity.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- RENDERERS ---
    
    // Safely get latest metrics to prevent crash on initial render
    const currentCpu = metrics.length > 0 ? metrics[metrics.length-1].cpu.toFixed(1) : '0.0';
    const currentMemory = metrics.length > 0 ? metrics[metrics.length-1].memory.toFixed(0) : '0';
    const currentLag = metrics.length > 0 ? metrics[metrics.length-1].eventLoopLag.toFixed(2) : '0.00';

    const renderProfiler = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border border-indigo-500/30 bg-black/60 rounded-[3rem] p-8">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Cpu className="w-4 h-4 text-indigo-500"/> CPU Usage
                    </p>
                    <div className="h-[200px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                                <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-4xl font-black text-white mt-4 italic">{currentCpu}%</p>
                </Card>

                <Card className="border border-amber-500/30 bg-black/60 rounded-[3rem] p-8">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Layers className="w-4 h-4 text-amber-500"/> Memory Heap
                    </p>
                    <div className="h-[200px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics}>
                                <defs>
                                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                                <Area type="monotone" dataKey="memory" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorMem)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-4xl font-black text-white mt-4 italic">{currentMemory} MB</p>
                </Card>

                <Card className="border border-pink-500/30 bg-black/60 rounded-[3rem] p-8">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-pink-500"/> Event Loop Lag
                    </p>
                    <div className="h-[200px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics}>
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                                <Bar dataKey="eventLoopLag" fill="#ec4899" isAnimationActive={false} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-4xl font-black text-white mt-4 italic">{currentLag} ms</p>
                </Card>
            </div>
        </div>
    );

    const renderTracing = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] animate-slide-up">
            <div className="lg:col-span-1 bg-gray-900 border border-white/5 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-black/40">
                    <h3 className="font-black text-white uppercase italic tracking-widest text-sm">Trace Log</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {traces.map(trace => (
                        <div 
                            key={trace.id} 
                            onClick={() => setSelectedTrace(trace)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer group ${selectedTrace?.id === trace.id ? 'bg-indigo-900/20 border-indigo-500' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${trace.method === 'GET' ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'}`}>{trace.method}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{trace.totalDuration}ms</span>
                            </div>
                            <p className="text-xs font-bold text-white truncate mt-1">{trace.endpoint}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="lg:col-span-2">
                <Card className="h-full bg-black border-white/10 p-8 rounded-[3rem] shadow-2xl flex flex-col">
                    {selectedTrace ? (
                        <div className="h-full flex flex-col animate-fade-in">
                            <div className="mb-8 border-b border-white/10 pb-6">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedTrace.method} {selectedTrace.endpoint}</h3>
                                <div className="flex gap-6 mt-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">ID: {selectedTrace.id}</p>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Total Time: {selectedTrace.totalDuration}ms</p>
                                </div>
                            </div>
                            
                            <div className="space-y-6 flex-1">
                                {selectedTrace.spans.map((span, i) => (
                                    <div key={i} className="relative group">
                                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mb-1">
                                            <span>{span.name}</span>
                                            <span>{span.duration}ms</span>
                                        </div>
                                        <div className="h-10 bg-gray-900 rounded-xl w-full relative overflow-hidden border border-white/5">
                                            <div 
                                                className={`absolute top-0 bottom-0 rounded-xl transition-all ${
                                                    span.type === 'db' ? 'bg-amber-500' : 
                                                    span.type === 'http' ? 'bg-green-500' : 'bg-indigo-500'
                                                }`}
                                                style={{ 
                                                    left: `${(span.startTime / selectedTrace.totalDuration) * 100}%`,
                                                    width: `${Math.max(2, (span.duration / selectedTrace.totalDuration) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-white/10 flex gap-6 text-[10px] font-black uppercase text-gray-500">
                                <div className="flex items-center"><div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div> Logic Layer</div>
                                <div className="flex items-center"><div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div> Database</div>
                                <div className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div> Network</div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                            <Activity className="w-24 h-24 mb-6" />
                            <p className="text-sm font-black uppercase tracking-[0.4em]">Select Trace to Analyze</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );

    const renderLoadTest = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-1 space-y-6">
                <Card title="Locust Controller" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl">
                    <div className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Simulated Users</label>
                            <input type="number" value={users} onChange={e => setUsers(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-red-500" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Hatch Rate (Users/Sec)</label>
                            <input type="number" value={spawnRate} onChange={e => setSpawnRate(Number(e.target.value))} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-red-500" />
                        </div>
                        
                        <button 
                            onClick={toggleLoadTest}
                            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                                loadTestStatus === 'running' 
                                ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse' 
                                : 'bg-green-600 hover:bg-green-500 text-black'
                            }`}
                        >
                            {loadTestStatus === 'running' ? 'ABORT SWARM' : 'DEPLOY SWARM'}
                        </button>

                        <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                            <span className="text-xs font-bold text-gray-400 uppercase">Engine Status</span>
                            <span className={`text-xs font-black uppercase px-3 py-1 rounded border ${loadTestStatus === 'running' ? 'text-red-500 border-red-500/30 bg-red-900/10' : 'text-green-500 border-green-500/30 bg-green-900/10'}`}>
                                {loadTestStatus}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="lg:col-span-2">
                <Card title="Stress Test Telemetry" className="bg-black border-white/5 p-8 rounded-[3rem] shadow-2xl h-full">
                    <div className="h-[400px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="time" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#10b981" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px'}} itemStyle={{fontSize: '12px'}} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="rps" stroke="#10b981" dot={false} strokeWidth={3} name="Reqs/Sec" isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#f43f5e" dot={false} strokeWidth={3} name="Latency (ms)" isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderCache = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up">
            <Card title="Redis Cluster Node" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 text-center">
                        <p className="text-4xl font-black text-green-400 italic tracking-tighter">{(cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)}%</p>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2">Hit Ratio</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 text-center">
                        <p className="text-4xl font-black text-blue-400 italic tracking-tighter">{cacheStats.keys.toLocaleString()}</p>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2">Active Keys</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 text-center">
                        <p className="text-4xl font-black text-amber-400 italic tracking-tighter">{cacheStats.memory}</p>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2">Mem Usage</p>
                    </div>
                    <div className="bg-black/40 p-6 rounded-[2rem] border border-white/5 text-center">
                        <p className="text-4xl font-black text-white italic tracking-tighter">{(cacheStats.hits + cacheStats.misses).toLocaleString()}</p>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-2">Total Ops</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleFlushCache} className="flex-1 bg-red-900/20 text-red-500 border border-red-500/30 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-900/40 transition-all">Flush Database</button>
                    <button className="flex-1 bg-blue-900/20 text-blue-400 border border-blue-500/30 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-900/40 transition-all">Warm-Up Sequence</button>
                </div>
            </Card>
            
            <Card title="Live Command Stream" className="bg-black border-white/10 p-0 overflow-hidden flex flex-col h-[500px] rounded-[3rem] shadow-2xl">
                <div className="bg-gray-900/50 px-8 py-4 border-b border-white/5 flex items-center gap-3">
                    <ServerIcon className="w-4 h-4 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">redis-cli monitor</span>
                </div>
                <div className="flex-1 overflow-y-auto p-8 font-mono text-[10px] text-green-400 space-y-2 custom-scrollbar bg-[#020202]">
                    {cacheLogs.map((log, i) => (
                        <div key={i} className="border-b border-white/5 pb-1 opacity-80 hover:opacity-100">{log}</div>
                    ))}
                    {cacheLogs.length === 0 && <div className="text-gray-700 italic">// Waiting for commands...</div>}
                    <div className="animate-pulse text-green-500">_</div>
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* Header */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-indigo-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(99,102,241,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-indigo-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(99,102,241,0.5)] border border-indigo-400 group-hover:rotate-12 transition-transform duration-700">
                            <Gauge className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Telemetry v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">LINK: ULTRA_LOW_LATENCY</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Hyper <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-500">Telemetry</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        {[
                            { id: 'profiler', label: 'Profiler', icon: <SpeedIcon /> },
                            { id: 'tracing', label: 'Tracing', icon: <TraceIcon /> },
                            { id: 'loadtest', label: 'Load Test', icon: <UserGroupIcon /> },
                            { id: 'cache', label: 'Redis', icon: <ServerIcon /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-indigo-600 text-white shadow-2xl' 
                                    : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                <span className="text-lg">{tab.icon}</span> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* AI SRE Bar */}
            <div className="bg-gradient-to-r from-indigo-900/20 to-black border border-indigo-500/30 rounded-[2.5rem] p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-500/30">
                        <BotIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg italic uppercase tracking-tight">AI Site Reliability Engineer</h3>
                        <p className="text-xs text-gray-400 font-medium">Neural Analysis Engine Standing By.</p>
                    </div>
                </div>
                <button 
                    onClick={handleAiAnalyze} 
                    disabled={isAnalyzing}
                    className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-2xl transition-all active:scale-95 disabled:opacity-50 relative z-10"
                >
                    {isAnalyzing ? <SparkleIcon className="w-4 h-4 animate-spin"/> : <SparkleIcon className="w-4 h-4"/>}
                    {isAnalyzing ? 'Analyzing Stack...' : 'Optimize Performance'}
                </button>
            </div>

            {aiInsight && (
                <div className="animate-fade-in bg-indigo-900/10 border-l-4 border-indigo-500 p-8 rounded-r-[3rem] shadow-2xl">
                    <div className="prose prose-invert prose-sm max-w-none text-indigo-100 italic leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: aiInsight }} />
                </div>
            )}

            {/* Main Content */}
            <div className="min-h-[500px]">
                {activeTab === 'profiler' && renderProfiler()}
                {activeTab === 'tracing' && renderTracing()}
                {activeTab === 'loadtest' && renderLoadTest()}
                {activeTab === 'cache' && renderCache()}
            </div>
        </div>
    );
};

export default PerformanceLayer;
