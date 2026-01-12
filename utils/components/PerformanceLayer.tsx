
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { SpeedIcon } from './icons/SpeedIcon';
import { TraceIcon } from './icons/TraceIcon';
import { ServerIcon } from './icons/ServerIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';

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
                const last = prev[prev.length - 1];
                let baseCpu = loadTestStatus === 'running' ? 85 : 25;
                let baseLatency = loadTestStatus === 'running' ? 450 : 45;
                let baseRps = loadTestStatus === 'running' ? 2500 : 150;

                const newMetric: SystemMetric = {
                    time: timeStr,
                    cpu: Math.min(100, Math.max(0, baseCpu + Math.random() * 10 - 5)),
                    memory: Math.min(2048, Math.max(200, (last?.memory || 400) + (Math.random() * 20 - 10))),
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

    const renderProfiler = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-t-4 border-indigo-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">CPU Usage</p>
                    <div className="h-[200px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none'}} itemStyle={{color: '#fff'}} />
                                <Area type="monotone" dataKey="cpu" stroke="#6366f1" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{metrics[metrics.length-1]?.cpu.toFixed(1)}%</p>
                </Card>
                <Card className="border-t-4 border-amber-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Memory Heap</p>
                    <div className="h-[200px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics}>
                                <defs>
                                    <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none'}} itemStyle={{color: '#fff'}} />
                                <Area type="monotone" dataKey="memory" stroke="#f59e0b" fillOpacity={1} fill="url(#colorMem)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{metrics[metrics.length-1]?.memory.toFixed(0)} MB</p>
                </Card>
                <Card className="border-t-4 border-pink-500">
                    <p className="text-gray-400 text-xs font-bold uppercase">Event Loop Lag</p>
                    <div className="h-[200px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics}>
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#1f2937', border: 'none'}} itemStyle={{color: '#fff'}} />
                                <Bar dataKey="eventLoopLag" fill="#ec4899" isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">{metrics[metrics.length-1]?.eventLoopLag.toFixed(2)} ms</p>
                </Card>
            </div>
        </div>
    );

    const renderTracing = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            <div className="lg:col-span-1 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-700 bg-gray-900">
                    <h3 className="font-bold text-white">Recent Transactions</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {traces.map(trace => (
                        <div 
                            key={trace.id} 
                            onClick={() => setSelectedTrace(trace)}
                            className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${selectedTrace?.id === trace.id ? 'bg-gray-700 border-l-4 border-l-indigo-500' : ''}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${trace.method === 'GET' ? 'bg-blue-900/50 text-blue-400' : 'bg-green-900/50 text-green-400'}`}>{trace.method}</span>
                                <span className="text-xs text-gray-500">{trace.totalDuration}ms</span>
                            </div>
                            <p className="text-sm text-gray-300 truncate">{trace.endpoint}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{trace.timestamp}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="lg:col-span-2">
                <Card className="h-full bg-gray-900 border-gray-700">
                    {selectedTrace ? (
                        <div className="h-full flex flex-col">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-white mb-1">{selectedTrace.method} {selectedTrace.endpoint}</h3>
                                <div className="flex gap-4 text-sm text-gray-400">
                                    <span>ID: {selectedTrace.id}</span>
                                    <span>Duration: {selectedTrace.totalDuration}ms</span>
                                </div>
                            </div>
                            <div className="space-y-4 flex-1">
                                {selectedTrace.spans.map((span, i) => (
                                    <div key={i} className="relative">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>{span.name}</span>
                                            <span>{span.duration}ms</span>
                                        </div>
                                        <div className="h-8 bg-gray-800 rounded w-full relative overflow-hidden">
                                            <div 
                                                className={`absolute top-0 bottom-0 rounded ${
                                                    span.type === 'db' ? 'bg-amber-500' : 
                                                    span.type === 'http' ? 'bg-green-500' : 'bg-indigo-500'
                                                }`}
                                                style={{ 
                                                    left: `${(span.startTime / selectedTrace.totalDuration) * 100}%`,
                                                    width: `${Math.max(1, (span.duration / selectedTrace.totalDuration) * 100)}%`
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-700 flex gap-4 text-xs">
                                <div className="flex items-center"><span className="w-3 h-3 bg-indigo-500 rounded mr-2"></span> Logic</div>
                                <div className="flex items-center"><span className="w-3 h-3 bg-amber-500 rounded mr-2"></span> Database</div>
                                <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded mr-2"></span> HTTP/Net</div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">Select a trace to view breakdown.</div>
                    )}
                </Card>
            </div>
        </div>
    );

    const renderLoadTest = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card title="Locust Controller">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Number of Users</label>
                            <input type="number" value={users} onChange={e => setUsers(Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white mt-1" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Spawn Rate (users/sec)</label>
                            <input type="number" value={spawnRate} onChange={e => setSpawnRate(Number(e.target.value))} className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white mt-1" />
                        </div>
                        <div className="pt-4">
                            <button 
                                onClick={toggleLoadTest}
                                className={`w-full py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
                                    loadTestStatus === 'running' 
                                    ? 'bg-red-600 hover:bg-red-500 animate-pulse' 
                                    : 'bg-green-600 hover:bg-green-500'
                                }`}
                            >
                                {loadTestStatus === 'running' ? 'STOP SWARM' : 'SPAWN SWARM'}
                            </button>
                        </div>
                        <div className="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
                            <span className="text-sm text-gray-400">Status</span>
                            <span className={`text-sm font-bold uppercase ${loadTestStatus === 'running' ? 'text-red-500' : 'text-green-500'}`}>
                                {loadTestStatus.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card title="Real-time Stress Metrics">
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metrics}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="time" stroke="#9ca3af" fontSize={10} />
                                <YAxis yAxisId="left" stroke="#10b981" fontSize={10} label={{ value: 'RPS', angle: -90, position: 'insideLeft', fill: '#10b981' }} />
                                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={10} label={{ value: 'Latency (ms)', angle: 90, position: 'insideRight', fill: '#f43f5e' }} />
                                <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none'}} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="rps" stroke="#10b981" dot={false} strokeWidth={2} name="Requests/Sec" isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="latency" stroke="#f43f5e" dot={false} strokeWidth={2} name="Response Time" isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderCache = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Redis Monitor">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-400">{(cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-500 uppercase">Hit Rate</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-400">{cacheStats.keys.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 uppercase">Keys</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-amber-400">{cacheStats.memory}</p>
                        <p className="text-xs text-gray-500 uppercase">Memory Used</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-white">{(cacheStats.hits + cacheStats.misses).toLocaleString()}</p>
                        <p className="text-xs text-gray-500 uppercase">Total Ops</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleFlushCache} className="flex-1 bg-red-900/30 text-red-400 border border-red-500/50 py-2 rounded hover:bg-red-900/50">Flush DB</button>
                    <button className="flex-1 bg-blue-900/30 text-blue-400 border border-blue-500/50 py-2 rounded hover:bg-blue-900/50">Warm Up Cache</button>
                </div>
            </Card>
            <Card title="Command Log" className="bg-black border-gray-700">
                <div className="font-mono text-xs text-green-400 h-64 overflow-y-auto custom-scrollbar flex flex-col space-y-2">
                    {cacheLogs.map((log, i) => (
                        <div key={i} className="border-b border-gray-800 pb-1">{log}</div>
                    ))}
                </div>
            </Card>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center">
                        <SpeedIcon className="w-8 h-8 mr-3 text-indigo-400" />
                        Performance Layer
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Real-time telemetry & optimization engine.</p>
                </div>
                <div className="flex bg-gray-800 rounded-lg p-1">
                    {[
                        { id: 'profiler', icon: <SpeedIcon />, label: 'Profiler' },
                        { id: 'tracing', icon: <TraceIcon />, label: 'Tracing' },
                        { id: 'loadtest', icon: <UserGroupIcon />, label: 'Load Test' },
                        { id: 'cache', icon: <ServerIcon />, label: 'Redis' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <span className="w-4 h-4 mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI SRE Bar */}
            <div className="bg-gradient-to-r from-gray-900 to-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center">
                    <div className="p-2 bg-indigo-500/20 rounded-full mr-3 text-indigo-400">
                        <BotIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">AI Site Reliability Engineer</h3>
                        <p className="text-xs text-gray-400">Analysis engine standing by.</p>
                    </div>
                </div>
                <button 
                    onClick={handleAiAnalyze} 
                    disabled={isAnalyzing}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center shadow-lg transition-all disabled:opacity-50"
                >
                    {isAnalyzing ? <SparkleIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparkleIcon className="w-4 h-4 mr-2"/>}
                    {isAnalyzing ? 'Analyzing Stack...' : 'Optimize Performance'}
                </button>
            </div>

            {aiInsight && (
                <div className="animate-fade-in bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded-r-xl">
                    <div className="prose dark:prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: aiInsight }} />
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
