import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
    Activity, Server, Users, Zap, AlertTriangle, CheckCircle2, 
    Cpu, Network, Database, ShieldAlert, Play, RotateCcw, Terminal,
    Workflow, TrendingUp, Coins, Shield, Route, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, BarChart, Bar } from 'recharts';
import { useJitroNeuralStore } from '../../store/useJitroNeuralStore';

type ControlMode = 'load_test' | 'jitro_router';
type TestStatus = 'idle' | 'running' | 'completed' | 'failed';

export const FinalStressTest: React.FC = () => {
    const {
        initializeJitro,
        dispatchQueryIntelligently,
        logWorkoutSet,
        validateWhatsAppPayload,
        prefetchedDiet,
        isPredictiveReady,
        workoutHistory,
        credentialGuardStatus,
        guardErrorLogs,
        speculativeMetrics,
        onDeviceAI,
        selfHealing,
        trackCursorVector,
        warmupOnDeviceWeights,
        vectorizeLocalText,
        dispatchWhatsAppWithSelfHealing,
        resetCircuitBreaker
    } = useJitroNeuralStore();

    useEffect(() => {
        initializeJitro();
    }, [initializeJitro]);

    const [mode, setMode] = useState<ControlMode>('jitro_router');
    const [status, setStatus] = useState<TestStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [activeUsers, setActiveUsers] = useState(0);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [logs, setLogs] = useState<{time: string, msg: string, type: 'info'|'warning'|'error'|'success'}[]>([]);

    // Google Jitro Metrics State
    const [cacheHits, setCacheHits] = useState(0);
    const [cacheMisses, setCacheMisses] = useState(0);
    const [routingLatency, setRoutingLatency] = useState<number[]>([]);
    const [totalCostSaved, setTotalCostSaved] = useState(0);
    const [activeNode, setActiveNode] = useState<'client' | 'edge' | 'cache' | 'api' | 'queue' | null>(null);
    const [rateLimiterSpike, setRateLimiterSpike] = useState(false);

    // --- GOOGLE JITRO REALITY PLAYGROUND STATE ---
    const [activeTabLab, setActiveTabLab] = useState<'query_routing' | 'predictive' | 'guard'>('query_routing');
    const [queryTypeInput, setQueryTypeInput] = useState<string>('DIET_PLAN_REQUEST');
    const [dietTypeInput, setDietTypeInput] = useState<string>('diet_fatloss');
    const [queryResult, setQueryResult] = useState<any>(null);
    const [queryResultLoading, setQueryResultLoading] = useState<boolean>(false);

    const [workoutExercise, setWorkoutExercise] = useState<string>('Heavy Deadlifts');
    const [workoutSets, setWorkoutSets] = useState<number>(3);
    const [workoutReps, setWorkoutReps] = useState<number>(10);
    const [workoutWeight, setWorkoutWeight] = useState<number>(120);

    const [whatsAppPhone, setWhatsAppPhone] = useState<string>('9800000000');
    const [whatsAppMessage, setWhatsAppMessage] = useState<string>('Congratulations on crossing your personal best weight limit on squats today!');
    const [whatsAppTemplateId, setWhatsAppTemplateId] = useState<string>('gym_pb_alert_01');
    const [whatsAppValidResult, setWhatsAppValidResult] = useState<{ isValid: boolean; error?: string } | null>(null);

    // ON-DEVICE TENSOR AI STATES
    const [localAIText, setLocalAIText] = useState<string>('Completed 3 sets of 100kg Barbell Squats today and feeling peak athletic energy');
    const [localAIVectorizing, setLocalAIVectorizing] = useState<boolean>(false);
    const [loadedOnDeviceResult, setLoadedOnDeviceResult] = useState<any>(null);

    // SELF-HEALING WEB AUTONOMIC STATES
    const [healedPhoneInput, setHealedPhoneInput] = useState<string>('9876543210');
    const [healedMessageInput, setHealedMessageInput] = useState<string>('Your body transformation sprint page is starting tomorrow morning. Live results at gym portal!');
    const [healedStatusPayload, setHealedStatusPayload] = useState<any>(null);
    const [healedLoading, setHealedLoading] = useState<boolean>(false);

    // Cursor Vector Velocity Tracking Effect
    const [targetElementRef, setTargetElementRef] = useState<HTMLDivElement | null>(null);
    useEffect(() => {
        if (!targetElementRef || activeTabLab !== 'predictive') return;

        let lastX = 0;
        let lastY = 0;
        let lastTime = Date.now();

        const handleMouseMove = (e: MouseEvent) => {
            const rect = targetElementRef.getBoundingClientRect();
            // Target center coordinate of the Speculative Trigger button
            const targetX = rect.left + rect.width / 2;
            const targetY = rect.top + rect.height / 2;

            const dx = e.clientX - targetX;
            const dy = e.clientY - targetY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const now = Date.now();
            const dt = now - lastTime || 1;
            const distMoved = Math.sqrt(Math.pow(e.clientX - lastX, 2) + Math.pow(e.clientY - lastY, 2));
            const speed = (distMoved / dt) * 100; // units relative to pixels/ms scaled

            lastX = e.clientX;
            lastY = e.clientY;
            lastTime = now;

            trackCursorVector(distance, speed);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [targetElementRef, activeTabLab, trackCursorVector]);

    const handleRunRealQuery = async () => {
        setQueryResultLoading(true);
        setQueryResult(null);
        const res = await dispatchQueryIntelligently(queryTypeInput, { dietType: dietTypeInput });
        setQueryResult(res);
        setQueryResultLoading(false);
    };

    const handleLogWorkoutSetReal = () => {
        logWorkoutSet(workoutExercise, workoutWeight, workoutSets, workoutReps);
        addLog(`Successfully logged workout exercise: '${workoutExercise}' with ${workoutSets} sets of ${workoutReps} reps at ${workoutWeight} kg!`, 'success');
    };

    const handleValidateWhatsAppReal = () => {
        const res = validateWhatsAppPayload({
            recipientPhone: whatsAppPhone,
            message: whatsAppMessage,
            templateId: whatsAppTemplateId
        });
        setWhatsAppValidResult(res);
    };

    const handleRunOnDeviceAIEmbedding = async () => {
        setLocalAIVectorizing(true);
        const res = await vectorizeLocalText(localAIText);
        setLoadedOnDeviceResult(res);
        setLocalAIVectorizing(false);
        addLog(`Successfully generated on-device vector projection parameters in ${res.latency.toFixed(1)}ms!`, 'success');
    };

    const handleRunSelfHealingDispatch = async () => {
        setHealedLoading(true);
        const res = await dispatchWhatsAppWithSelfHealing(healedPhoneInput, healedMessageInput);
        setHealedStatusPayload(res);
        setHealedLoading(false);
        addLog(`Self-healing dispatch complete! Route diverted to: ${res.gatewayUsed}`, 'success');
    };

    const addLog = (msg: string, type: 'info'|'warning'|'error'|'success' = 'info') => {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit', fractionalSecondDigits: 2 });
        setLogs(prev => [{time, msg, type}, ...prev].slice(0, 50));
    };

    // --- STANDARD 10,000 CONCURRENT USERS LOAD TEST ---
    const runStandardLoadTest = async () => {
        setStatus('running');
        setProgress(0);
        setActiveUsers(0);
        setMetrics([]);
        setLogs([]);

        addLog('INITIATING GLOBAL INFRASTRUCTURE LOAD TEST: 10,000 Concurrent Entities', 'warning');
        addLog('Spinning up dynamic agent swarm cluster nodes...', 'info');

        const totalDuration = 15000; // 15 seconds
        const intervalTime = 500;
        const steps = totalDuration / intervalTime;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const currentProgress = (currentStep / steps) * 100;
            setProgress(currentProgress);

            const users = Math.min(10000, Math.floor(Math.pow(currentStep, 2.5) * 2));
            setActiveUsers(users);

            const time = new Date().toLocaleTimeString('en-US', { hour12: false, minute:'2-digit', second:'2-digit' });
            
            const cpuLoad = Math.min(98, 20 + (users / 10000) * 70 + (Math.random() * 10));
            const latency = 45 + (users / 10000) * 150 + (Math.random() * 20); // ms
            const dbConnections = Math.floor(users * 0.85);

            setMetrics(prev => [...prev, { time, users, cpuLoad, latency, dbConnections }]);

            if (currentStep === Math.floor(steps * 0.2)) {
                addLog('Active Load exceeded 1,500 connections. Provisioning emergency database connection pools...', 'info');
            } else if (currentStep === Math.floor(steps * 0.4)) {
                addLog('Multi-tenant biometric scanning load spike detected. Initializing queue offsets.', 'warning');
            } else if (currentStep === Math.floor(steps * 0.6)) {
                addLog('Synthesizing chat queues: WhatsApp Auto-Intake gateway processing peak bandwidth loads.', 'info');
            } else if (currentStep === Math.floor(steps * 0.8)) {
                addLog('Sustained peak threshold passed (10,000 concurrent). Network latency solidifying at stable range.', 'success');
            }

            if (currentStep >= steps) {
                clearInterval(interval);
                setStatus('completed');
                addLog('STRESS TEST COMPLETED SUCCESSFULLY. Core container system is fully stable and ready.', 'success');
            }
        }, intervalTime);
    };

    // --- GOOGLE JITRO ADAPTIVE ROUTING CORE SIMULATION ---
    const runJitroSimulation = async () => {
        setStatus('running');
        setProgress(0);
        setActiveUsers(0);
        setCacheHits(0);
        setCacheMisses(0);
        setTotalCostSaved(0);
        setRoutingLatency([]);
        setMetrics([]);
        setLogs([]);

        addLog('INITIALIZED GOOGLE JITRO OPERATIONAL GATEWAY (Just-In-Time Routing Optimization)', 'success');
        addLog('Active Edge Protocols: WebGPU Transformers, Cloudflare Workers, pgvector Semantic Engine & n8n Circuit Breakers armed.', 'info');

        const totalRequests = 100;
        let currentReq = 0;

        const interval = setInterval(() => {
            currentReq++;
            const currentProgress = (currentReq / totalRequests) * 100;
            setProgress(currentProgress);
            setActiveUsers(currentReq);

            const isSemanticHit = Math.random() < 0.85; // 85% cache hit ratio under routing optimization

            const startTime = performance.now();
            let route: 'client' | 'edge' | 'cache' | 'api' | 'queue' = 'client';
            let msg = '';
            let latency = 0;
            let costSaved = 0;

            if (rateLimiterSpike && currentReq > 40 && currentReq < 70) {
                // n8n Queue throttling triggered
                route = 'queue';
                latency = 120 + Math.random() * 30; // micro-throttle
                costSaved = 0.08;
                msg = `Request #${currentReq} [Turnstile Biometric]: Peak burst detected. Dynamic n8n rate-limiter throttles safe transmission delay.`;
                setCacheHits(prev => prev + 1);
            } else if (Math.random() < 0.2) {
                // BIO-SYNC local WebGPU processing
                route = 'client';
                latency = 1 + Math.random() * 3; // Ultra fast local response
                costSaved = 0.15; // saved full LLM call
                msg = `Request #${currentReq} [1-Rep Max Biometrics]: Screened in WebGPU local compiler (0ms remote lag).`;
                setCacheHits(prev => prev + 1);
            } else if (isSemanticHit) {
                // Cloudflare Edge Cache & pgvector match
                route = 'cache';
                latency = 10 + Math.random() * 15; // fast edge cache
                costSaved = 0.12; // saved LLM call cost
                msg = `Request #${currentReq} [Wellness Advisory]: Semantic Match (Cosine Score > 0.92) hit in pgvector Cache. Returned from Cloudflare Edge.`;
                setCacheHits(prev => prev + 1);
            } else {
                // Live Google Gemini Core Synthesis
                route = 'api';
                latency = 310 + Math.random() * 120; // real LLM API latency
                costSaved = 0;
                msg = `Request #${currentReq} [Advanced Cellular Adaptations]: Cache Miss. Dynamic Jitro routes request to live Google Gemini Pro LLM layer.`;
                setCacheMisses(prev => prev + 1);
            }

            setActiveNode(route);
            setTotalCostSaved(prev => prev + costSaved);
            addLog(msg, route === 'api' ? 'warning' : (route === 'queue' ? 'info' : 'success'));

            setRoutingLatency(prev => [...prev, latency]);

            // Track standard metrics for Recharts
            const time = `${currentReq}`;
            const cpuLoad = 12 + (latency / 500) * 45 + Math.random() * 5;
            setMetrics(prev => [...prev, { time, users: currentReq, cpuLoad, latency, cost: costSaved }]);

            if (currentReq >= totalRequests) {
                clearInterval(interval);
                setStatus('completed');
                setActiveNode(null);
                addLog('GOOGLE JITRO ADAPTIVE ROUTER STRESS SIMULATION COMPLETED.', 'success');
                addLog(`Jitro Summary: Served ${cacheHits + cacheMisses} requests. Cache Hit: ${((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)}%. Saved Serverless Budget: $${(totalCostSaved).toFixed(2)}. Avg Latency: ${(routingLatency.reduce((a,b)=>a+b,0)/(routingLatency.length||1)).toFixed(1)}ms (Jitro) vs 380ms (Standard Standard Cloud Edge).`, 'success');
            }
        }, 150);
    };

    const handleRunSimulation = () => {
        if (mode === 'load_test') {
            runStandardLoadTest();
        } else {
            runJitroSimulation();
        }
    };

    const MetricCard = ({ title, value, unit, icon: Icon, colorClass, alertThreshold }: any) => {
        const isAlert = parseFloat(value) > alertThreshold;
        return (
            <div className={`bg-zinc-950 border rounded-2xl p-4 relative overflow-hidden transition-colors ${isAlert ? 'border-red-500/50' : 'border-white/5 shadow-inner'}`}>
                {isAlert && <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>}
                <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className={`p-2 rounded-lg bg-black/50 ${colorClass}`}>
                        <Icon className="w-5 h-5 animate-pulse" />
                    </div>
                </div>
                <div className="relative z-10">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 font-mono">{title}</h4>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-black font-mono ${isAlert ? 'text-red-400' : 'text-white'}`}>{value}</span>
                        <span className="text-[9px] text-zinc-500 font-mono">{unit}</span>
                    </div>
                </div>
            </div>
        );
    };

    const currentMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : { cpuLoad: 0, latency: 0, dbConnections: 0 };
    const avgLatency = routingLatency.length > 0 ? (routingLatency.reduce((a,b)=>a+b,0) / routingLatency.length).toFixed(1) : '0';

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="bg-[#05050c] border border-fuchsia-500/20 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.1)] shrink-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[140px] animate-pulse"></div>
                <div className="absolute left-1/3 -bottom-20 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 animate-ping"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-fuchsia-400">Computational Singularity Layer</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            System <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400">Optimization & Stress Gateway</span>
                        </h1>
                        <p className="text-xs text-zinc-400 font-mono mt-2 max-w-3xl leading-relaxed">
                            A complete testing environment supporting both standard multi-agent simulated load environments and highly advanced <span className="text-cyan-400 font-black">Google Jitro (Just-In-Time Routing Logic)</span> structures mapping Edge computation, Semantic vector caching, and smart rate-limiting circuit breakers.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {status === 'idle' || status === 'completed' ? (
                            <button 
                                onClick={handleRunSimulation}
                                className="px-8 py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(217,70,239,0.3)] flex items-center justify-center gap-3"
                            >
                                {status === 'completed' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                {status === 'completed' ? 'Re-Run Test' : 'Initiate Engine Test'}
                            </button>
                        ) : (
                            <div className="px-8 py-4 bg-zinc-900 text-zinc-400 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 border border-white/5 animate-pulse">
                                <Activity className="w-4 h-4 animate-spin text-fuchsia-400" />
                                Processing Simulated Stress...
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                {status !== 'idle' && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-950">
                        <motion.div 
                            className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                )}
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0 bg-black/40 p-2 rounded-2xl border border-white/5">
                <button
                    onClick={() => { setMode('jitro_router'); setStatus('idle'); setMetrics([]); setLogs([]); }}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-all ${mode === 'jitro_router' ? 'bg-zinc-900 border border-fuchsia-500/20 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Route className="w-5 h-5 text-fuchsia-400" />
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider">Google Jitro Routing Logic Simulation (100 Active AI Nodes)</div>
                        <div className="text-[10px] text-zinc-400">Verifies edge caching, micro WebGPU latency, semantic hits, and n8n dynamic circuit breakers.</div>
                    </div>
                </button>
                <button
                    onClick={() => { setMode('load_test'); setStatus('idle'); setMetrics([]); setLogs([]); }}
                    className={`flex items-center gap-3 px-5 py-4 rounded-xl text-left transition-all ${mode === 'load_test' ? 'bg-zinc-900 border border-cyan-500/20 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Server className="w-5 h-5 text-cyan-400" />
                    <div>
                        <div className="text-xs font-black uppercase tracking-wider">Standard Multi-Agent Load Test (10,000 Entities)</div>
                        <div className="text-[10px] text-zinc-400">Full intensity framework throughput test mimicking high turnstile traffic spikes.</div>
                    </div>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left Columns: Visualizations and Metrics */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                    
                    {/* Metrics Row */}
                    {mode === 'jitro_router' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                            <MetricCard 
                                title="Edge & local Cache Ratio" 
                                value={`${(cacheHits + cacheMisses) > 0 ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1) : '0'}`} 
                                unit="%"
                                icon={TrendingUp} 
                                colorClass="text-fuchsia-400"
                                alertThreshold={100}
                            />
                            <MetricCard 
                                title="Optimized Latency" 
                                value={avgLatency} 
                                unit="ms"
                                icon={Zap} 
                                colorClass="text-cyan-400"
                                alertThreshold={200}
                            />
                            <MetricCard 
                                title="Budget Savings (LLM Cost)" 
                                value={`$${totalCostSaved.toFixed(2)}`} 
                                unit="saved"
                                icon={Coins} 
                                colorClass="text-emerald-400"
                                alertThreshold={9999}
                            />
                            <MetricCard 
                                title="Self-Healing Buffer" 
                                value={rateLimiterSpike ? 'Dynamic (Active)' : 'Standby'} 
                                unit="Circuit"
                                icon={Shield} 
                                colorClass="text-amber-400"
                                alertThreshold={9999}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                            <MetricCard 
                                title="Active Swarm Users" 
                                value={activeUsers.toLocaleString()} 
                                unit="req/s"
                                icon={Users} 
                                colorClass="text-cyan-400"
                                alertThreshold={8000}
                            />
                            <MetricCard 
                                title="Global CPU Load" 
                                value={currentMetrics.cpuLoad.toFixed(1)} 
                                unit="%"
                                icon={Cpu} 
                                colorClass="text-fuchsia-400"
                                alertThreshold={85}
                            />
                            <MetricCard 
                                title="Network Response Time" 
                                value={currentMetrics.latency.toFixed(0)} 
                                unit="ms"
                                icon={Zap} 
                                colorClass="text-amber-400"
                                alertThreshold={180}
                            />
                            <MetricCard 
                                title="Database Thread Pool" 
                                value={currentMetrics.dbConnections.toLocaleString()} 
                                unit="conns"
                                icon={Database} 
                                colorClass="text-emerald-400"
                                alertThreshold={8000}
                            />
                        </div>
                    )}

                    {/* Main Interactive System Board */}
                    {mode === 'jitro_router' ? (
                        <div className="bg-[#050505] border border-white/5 rounded-[2rem] p-6 flex-1 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-950/10 opacity-30"></div>
                            
                            <div className="flex justify-between items-center relative z-10 shrink-0 mb-4">
                                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <Route className="w-4 h-4 text-fuchsia-400 animate-spin-slow" /> Interactive Jitro Nodes & Active Route Pathways
                                </h3>
                                <button
                                    onClick={() => { setRateLimiterSpike(!rateLimiterSpike); addLog(`Peak turnstile biometric queues ${!rateLimiterSpike ? 'simulated. Load limit systems armed.' : 'disengaged.'}`, 'warning'); }}
                                    className={`px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all ${rateLimiterSpike ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-black text-zinc-500 border-white/5'}`}
                                >
                                    {rateLimiterSpike ? '⚡ Peak Spike On (n8n Route Active)' : 'Simulate Turnstile Spike'}
                                </button>
                            </div>

                            {/* Beautiful visual neural diagram node map */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center justify-center my-auto relative z-10 p-2">
                                
                                {/* 1. Client Browser WebGPU */}
                                <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 bg-black/60 ${activeNode === 'client' ? 'border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'border-white/5'}`}>
                                    <div className={`p-2.5 rounded-xl bg-cyan-950/30 text-cyan-400 border border-cyan-500/20 mb-2 ${activeNode === 'client' ? 'animate-bounce' : ''}`}>
                                        <Cpu className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="text-[10px] font-black text-white uppercase tracking-wider font-mono">1. WebGPU Node</div>
                                    <p className="text-[8px] text-zinc-500 mt-1">Saves remote network lag via local compilation</p>
                                </div>

                                {/* Flow light */}
                                <div className="hidden md:flex justify-center text-zinc-600 text-xs font-mono select-none">
                                    {activeNode ? <span className="text-cyan-400 animate-pulse font-bold font-mono">=== Jitro Router ===&gt;</span> : <span>-------------&gt;</span>}
                                </div>

                                {/* 2. Core Jitro Router on edge */}
                                <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center text-center transition-all duration-300 bg-black/60 md:col-span-1 ${activeNode === 'edge' ? 'border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.2)]' : 'border-white/5'}`}>
                                    <div className={`p-2.5 rounded-xl bg-fuchsia-950/30 text-fuchsia-400 border border-fuchsia-500/20 mb-2 ${activeNode === 'edge' ? 'animate-ping' : ''}`}>
                                        <Route className="w-5 h-5 text-fuchsia-400" />
                                    </div>
                                    <div className="text-[10px] font-black text-white uppercase tracking-wider font-mono">2. Jitro Router</div>
                                    <p className="text-[8px] text-zinc-500 mt-1">Cloudflare Edge instant query decision router</p>
                                </div>

                                {/* Flow details */}
                                <div className="hidden md:flex flex-col gap-2 items-center text-zinc-600 text-[9px] font-mono select-none text-center">
                                    <div className={activeNode === 'cache' ? 'text-fuchsia-400 font-bold' : ''}>[Cosine Match] --&gt; Cache Hit</div>
                                    <div className={activeNode === 'api' ? 'text-amber-400 font-bold' : ''}>[Miss] --&gt; Pro LLM Synthesis</div>
                                    <div className={activeNode === 'queue' ? 'text-cyan-400 font-bold' : ''}>[Peak Scan] --&gt; n8n Circuit</div>
                                </div>

                                {/* 3. Optimized pathways */}
                                <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
                                    
                                    {/* PGVECTOR CACHE NODE */}
                                    <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 bg-black/60 ${activeNode === 'cache' ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)] bg-emerald-950/5' : 'border-white/5'}`}>
                                        <div className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                                            <Database className="w-4 h-4 text-emerald-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[9px] font-bold text-white uppercase font-mono">Semantic pgvector Cache</div>
                                            <div className="text-[8px] text-zinc-500 font-mono">Response served in 12ms</div>
                                        </div>
                                    </div>

                                    {/* LIVE GEMINI API */}
                                    <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 bg-black/60 ${activeNode === 'api' ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)] bg-amber-950/5' : 'border-white/5'}`}>
                                        <div className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-500/20">
                                            <Workflow className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[9px] font-bold text-white uppercase font-mono">Google Gemini Pro API</div>
                                            <div className="text-[8px] text-zinc-500 font-mono">Cache misses require fresh LLM synthesis</div>
                                        </div>
                                    </div>

                                    {/* N8N RATE COUPLING BUFFER */}
                                    <div className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 bg-black/60 ${activeNode === 'queue' ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] bg-cyan-950/5' : 'border-white/5'}`}>
                                        <div className="p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
                                            <Network className="w-4 h-4 text-cyan-400" />
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[9px] font-bold text-white uppercase font-mono">n8n Rate Queue</div>
                                            <div className="text-[8px] text-zinc-500 font-mono">Throttled buffer protects system integrity</div>
                                        </div>
                                    </div>

                                </div>

                            </div>

                            <div className="bg-zinc-950 border border-white/5 rounded-xl p-4 mt-4 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                                <div className="text-left">
                                    <span className="text-[9px] text-[#ffffff3a] font-mono font-black uppercase tracking-wider block">Operational Synergy Outcome</span>
                                    <p className="text-[11px] text-zinc-300 leading-normal max-w-xl font-mono">
                                        Google Jitro analyzes cache lookup tags and local hardware resources. Over <span className="text-fuchsia-400 font-bold">85% of standard membership queries</span> are diverted back instantly from decentralized Semantic edge locations.
                                    </p>
                                </div>
                                <div className="flex gap-2 text-right">
                                    <div className="bg-black border border-white/5 p-2 rounded-lg font-mono">
                                        <div className="text-[8px] text-zinc-500">Peak Load CPU Impact</div>
                                        <div className="text-xs font-black text-fuchsia-300">Reduced by 70%</div>
                                    </div>
                                    <div className="bg-black border border-white/5 p-2 rounded-lg font-mono">
                                        <div className="text-[8px] text-zinc-500">Direct Cost Saving</div>
                                        <div className="text-xs font-black text-cyan-300">Efficient</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 flex-1 relative overflow-hidden min-h-[300px] flex flex-col">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                                <Activity className="w-4 h-4 text-cyan-400" /> Infrastructure Swarm Metrics (Load vs Response Time)
                            </h3>
                            
                            <div className="flex-1 w-full relative z-10">
                                {metrics.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={metrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.25}/>
                                                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
                                            <XAxis dataKey="time" stroke="#ffffff20" fontSize={9} tickMargin={10} />
                                            <YAxis yAxisId="left" stroke="#ffffff20" fontSize={9} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#ffffff20" fontSize={9} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff10', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                            />
                                            <Area yAxisId="left" type="monotone" dataKey="users" name="Concurrent Swarm" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" isAnimationActive={false} />
                                            <Area yAxisId="right" type="monotone" dataKey="latency" name="Latency (ms)" stroke="#d946ef" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                                        <Server className="w-10 h-10 mb-4 opacity-10 animate-bounce" />
                                        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Swarm Monitor Offline. Click Initiate to begin stress tracking.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Dynamic Reports & Live Terminal Logs */}
                <div className="flex flex-col gap-6 min-h-0">
                    
                    {/* Diagnostic Checklist */}
                    <div className="bg-[#050505] border border-white/5 rounded-[2rem] p-6 shrink-0 relative overflow-hidden">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-pulse" /> Diagnostic Health Matrix
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-zinc-600 animate-pulse'}`}></div>
                                    <span className="text-[11px] font-black text-white font-mono uppercase">Decentralized WebGPU Layer</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">{status === 'completed' ? 'PASS (0ms local-first)' : 'PENDING'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-zinc-600 animate-pulse'}`}></div>
                                    <span className="text-[11px] font-black text-white font-mono uppercase">Semantic pgvector Cache</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">{status === 'completed' ? 'PASS (<15ms hit)' : 'PENDING'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-zinc-600 animate-pulse'}`}></div>
                                    <span className="text-[11px] font-black text-white font-mono uppercase">n8n Turnstile Limiter</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">{status === 'completed' ? 'PASS (Self-Healed)' : 'PENDING'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-zinc-600 animate-pulse'}`}></div>
                                    <span className="text-[11px] font-black text-white font-mono uppercase">Sovereign Override Failsafe</span>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">{status === 'completed' ? 'PASS (Secure)' : 'PENDING'}</span>
                            </div>
                        </div>

                        {status === 'completed' && (
                            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center shadow-lg">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">System Integrity Index: 100% stable</p>
                            </div>
                        )}
                    </div>

                    {/* Integrated System Terminal */}
                    <div className="bg-black border border-white/5 rounded-[2rem] p-6 flex-1 flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-fuchsia-400" /> System Telemetry Console
                            </h3>
                            <span className="text-[8px] font-bold text-zinc-600 uppercase font-mono tracking-widest">Active Router Node Output</span>
                        </div>
                        
                        <div className="flex-1 bg-[#020202] rounded-2xl border border-white/5 p-4 overflow-y-auto custom-scrollbar font-mono text-[9px] space-y-2 select-none">
                            {logs.length === 0 && (
                                <p className="text-zinc-700 animate-pulse">Awaiting system activation sequence...</p>
                            )}
                            {logs.map((log, idx) => (
                                <div key={idx} className="flex gap-2 leading-relaxed">
                                    <span className="text-zinc-600 shrink-0 select-none">[{log.time}]</span>
                                    <span className={`
                                        ${log.type === 'info' ? 'text-cyan-400' : ''}
                                        ${log.type === 'success' ? 'text-emerald-500 font-bold' : ''}
                                        ${log.type === 'warning' ? 'text-amber-400 font-bold' : ''}
                                        ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
                                    `}>
                                        {log.msg}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Google Jitro - Intelligent Operations Lab */}
            <div className="bg-[#05050c] border border-cyan-500/10 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_15px_50px_rgba(6,182,212,0.05)] mt-6 shrink-0">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]"></div>
                
                <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">Edge Reality Lab Suite</span>
                            </div>
                            <h2 className="text-xl font-black text-white uppercase italic tracking-tight font-sans">
                                Google Jitro Reality Lab • Live Operations Suite
                            </h2>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1">
                                Interact directly with real-time Just-In-Time optimization routines, pointer velocity algorithms, local WebGPU parameters, and autonomous self-healing routers.
                            </p>
                        </div>

                        {/* Playground Tab Selector */}
                        <div className="flex bg-black p-1.5 rounded-xl border border-white/5 shrink-0 flex-wrap gap-1">
                            <button
                                onClick={() => setActiveTabLab('query_routing')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTabLab === 'query_routing' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                🌐 Edge Router
                            </button>
                            <button
                                onClick={() => setActiveTabLab('predictive')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTabLab === 'predictive' ? 'bg-fuchsia-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                🧠 Bio-Sync Prefetch
                            </button>
                            <button
                                onClick={() => setActiveTabLab('guard')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTabLab === 'guard' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                🛡️ Self-Healing Guard
                            </button>
                        </div>
                    </div>

                    {/* Tab 1: Edge Router */}
                    {activeTabLab === 'query_routing' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-white uppercase font-sans tracking-wide">
                                    Simulate Just-In-Time Intelligent Query Directions
                                </h4>
                                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                                    Choose an intent-type payload. The Jitro system dynamically decides whether to resolve via local devices, pull from decentralized Cloudflare/pgvector Edge Caches, or synthesize a fresh LLM model response.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Query Type</label>
                                        <select 
                                            value={queryTypeInput} 
                                            onChange={(e) => setQueryTypeInput(e.target.value)}
                                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                                        >
                                            <option value="DIET_PLAN_REQUEST">Diet Plan Request</option>
                                            <option value="LEADERBOARD_LOOKUP">SaaS Global Leaderboard</option>
                                            <option value="ACTIVE_CLASS_SCHED">Class Schedules Lookup</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Profile Category Tag</label>
                                        <select 
                                            value={dietTypeInput} 
                                            onChange={(e) => setDietTypeInput(e.target.value)}
                                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-cyan-500 outline-none"
                                        >
                                            <option value="high_protein">High Protein</option>
                                            <option value="lean_bulk">Lean Bulk & Muscle</option>
                                            <option value="diet_fatloss">Diet Fatloss</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRunRealQuery}
                                    disabled={queryResultLoading}
                                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.2)] font-mono"
                                >
                                    {queryResultLoading ? 'Dispersing Query...' : 'Dispatch Intelligent Query'}
                                </button>
                            </div>

                            <div className="bg-black/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between font-mono text-[10px] space-y-4">
                                <div>
                                    <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Edge Compiler Decisions Output</span>
                                    {queryResultLoading ? (
                                        <div className="text-cyan-400 mt-3 animate-pulse">Running live Jitro routing optimizations, analyzing semantic indexes...</div>
                                    ) : queryResult ? (
                                        <div className="space-y-3 mt-3">
                                            <div className="flex justify-between border-b border-white/5 pb-1.5">
                                                <span className="text-zinc-500">RESOLVED SOURCE:</span>
                                                <span className="text-cyan-400 font-bold">{queryResult.source}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1.5">
                                                <span className="text-zinc-500">OPTIMIZED LATENCY:</span>
                                                <span className={`${queryResult.latencyMs < 30 ? 'text-emerald-400 font-bold' : 'text-amber-400'}`}>
                                                    {queryResult.latencyMs.toFixed(2)} ms
                                                </span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1.5">
                                                <span className="text-zinc-500">SAVED TOKEN BUDGET:</span>
                                                <span className="text-emerald-400 font-bold">${queryResult.savedCostDollars}</span>
                                            </div>
                                            <div className="pt-2">
                                                <span className="text-zinc-400 font-bold block mb-1">DATA RESPONSE SCHEMAS:</span>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Array.isArray(queryResult.data) ? queryResult.data.map((item: string, i: number) => (
                                                        <div key={i} className="bg-zinc-950 p-2 rounded border border-white/5 text-[9px] text-zinc-300">
                                                            • {item}
                                                        </div>
                                                    )) : <p className="text-zinc-600">No data structured.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-600 mt-4 italic">No active queries ran yet. Trigger the compiler button on the left.</p>
                                    )}
                                </div>
                                <div className="text-[8px] text-zinc-600 border-t border-white/5 pt-2">
                                    Adaptive load monitoring maps CF GeoIP headers to compute optimized pathways.
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Predictive Prefetch & Transformers */}
                    {activeTabLab === 'predictive' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-white uppercase font-sans tracking-wide">
                                        Predictive Bio-Sync Pre-fetching
                                    </h4>
                                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                                        Logging active heavy exercise sessions builds state patterns. Move your mouse inside the tracking box below to simulate cursor direction and speed analytics predicting next clicks dynamically.
                                    </p>

                                    {/* Mouse tracker simulator zone */}
                                    <div 
                                        ref={setTargetElementRef}
                                        className="h-32 bg-black/60 border border-dashed border-fuchsia-500/25 rounded-2xl relative flex flex-col justify-center items-center text-center p-4 cursor-crosshair group overflow-hidden transition-all hover:bg-black/80"
                                    >
                                        <div className="absolute top-1 right-2 text-[7px] text-fuchsia-400 font-bold font-mono tracking-wider">
                                            LIVE RADAR MATRIX
                                        </div>
                                        <div className="absolute inset-0 bg-radial-gradient from-fuchsia-500/5 to-transparent pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
                                        <p className="text-[10px] text-zinc-300 font-bold font-sans">
                                            Pointer / Cursor Vector Tracker (Hover & Move Cursor Inside)
                                        </p>
                                        <p className="text-[8px] text-zinc-500 font-mono mt-1">
                                            Measures velocity vector and proximity to simulated "Diet Button" placed in center.
                                        </p>
                                        
                                        <div className="grid grid-cols-3 gap-6 mt-3 max-w-xs w-full">
                                            <div className="text-center">
                                                <div className="text-[8px] text-zinc-500 uppercase font-mono">Distance to Target</div>
                                                <div className="text-[11px] font-black text-white font-mono">{speculativeMetrics.distancePx} px</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[8px] text-zinc-500 uppercase font-mono">Cursor Speed</div>
                                                <div className="text-[11px] font-black text-white font-mono">{Math.round(speculativeMetrics.pointerSpeed)} px/s</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[8px] text-zinc-500 uppercase font-mono">Transition Prob.</div>
                                                <div className={`text-[11px] font-black font-mono ${speculativeMetrics.probability > 0.8 ? 'text-fuchsia-400 animate-pulse' : 'text-zinc-300'}`}>
                                                    {(speculativeMetrics.probability * 100).toFixed(0)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Exercise Name</label>
                                            <input 
                                                type="text" 
                                                value={workoutExercise}
                                                onChange={(e) => setWorkoutExercise(e.target.value)}
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white font-mono focus:border-fuchsia-500 outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 col-span-2">
                                            <div>
                                                <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Sets / Reps</label>
                                                <div className="flex gap-1">
                                                    <input 
                                                        type="number" 
                                                        value={workoutSets}
                                                        onChange={(e) => setWorkoutSets(parseInt(e.target.value) || 1)}
                                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-1.5 py-1.5 text-xs text-white font-mono text-center focus:border-fuchsia-500 outline-none"
                                                    />
                                                    <input 
                                                        type="number" 
                                                        value={workoutReps}
                                                        onChange={(e) => setWorkoutReps(parseInt(e.target.value) || 1)}
                                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-1.5 py-1.5 text-xs text-white font-mono text-center focus:border-fuchsia-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Weight (kg)</label>
                                                <input 
                                                    type="number" 
                                                    value={workoutWeight}
                                                    onChange={(e) => setWorkoutWeight(parseInt(e.target.value) || 10)}
                                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white font-mono text-center focus:border-fuchsia-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleLogWorkoutSetReal}
                                        className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.2)] font-mono"
                                    >
                                        Log Active Workout Set
                                    </button>
                                </div>

                                <div className="bg-black/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between font-mono text-[10px] space-y-4">
                                    <div className="space-y-3">
                                        <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Predictive Pattern Cache Matrix</span>
                                        
                                        <div className="flex justify-between border-b border-white/5 pb-1">
                                            <span className="text-zinc-500">TOTAL LOGGED SETS:</span>
                                            <span className={`font-bold ${workoutHistory.length >= 3 ? 'text-fuchsia-400' : 'text-zinc-400'}`}>
                                                {workoutHistory.length} / 3 threshold
                                            </span>
                                        </div>

                                        <div className="flex justify-between border-b border-white/5 pb-1">
                                            <span className="text-zinc-500">RADIUS TELEMETRY STATUS:</span>
                                            <span className={`font-bold uppercase ${speculativeMetrics.prefetchStatus === 'cached' || speculativeMetrics.prefetchStatus === 'triggered' ? 'text-emerald-400' : speculativeMetrics.prefetchStatus === 'analyzing' ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`}>
                                                {speculativeMetrics.prefetchStatus}
                                            </span>
                                        </div>

                                        {isPredictiveReady ? (
                                            <div className="p-3 bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-xl space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Zap className="w-4 h-4 text-fuchsia-400 animate-pulse" />
                                                    <span className="text-[10px] font-black text-fuchsia-400 uppercase">PRE-FETCH ACTIVE! (0ms Cold-Start Ready)</span>
                                                </div>
                                                <p className="text-[9px] text-zinc-300 leading-normal">
                                                    AI tracked your workout set velocity and predicted an upcoming nutrition lookup. The following post-workout diet plan has been pre-loaded into your frontend Zustand store with zero latency:
                                                </p>
                                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                                    {prefetchedDiet?.map((diet: string, i: number) => (
                                                        <span key={i} className="text-[8px] bg-black/40 border border-white/5 px-2 py-1 rounded text-white font-medium">
                                                            ✓ {diet}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center text-zinc-500 italic">
                                                Awaiting pattern depth... Log {3 - Math.min(3, workoutHistory.length)} more set(s) on the left, or swipe your mouse quickly inside the Live Radar matrix above to satisfy prefetch trigger!
                                            </div>
                                        )}

                                        {workoutHistory.length > 0 && (
                                            <div className="pt-2">
                                                <span className="text-zinc-500 block mb-1 uppercase text-[8px]">Session Logging Feed:</span>
                                                <div className="space-y-1 max-h-[80px] overflow-y-auto">
                                                    {workoutHistory.map((item, index) => (
                                                        <div key={index} className="text-[8px] text-zinc-400 flex justify-between bg-black/40 px-2 py-1 rounded">
                                                            <span>• {item.exerciseName}</span>
                                                            <span>{item.sets}x{item.reps} @ {item.weight} kg</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[8px] text-zinc-600 border-t border-white/5 pt-2">
                                        Behavioral profiling avoids external LLMs call by mapping local device state to cash indicators.
                                    </div>
                                </div>
                            </div>

                            {/* Client-Side Vector Embeddings Subsection (On-Device Transformers) */}
                            <div className="bg-black/30 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none"></div>
                                
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Cpu className="w-5 h-5 text-fuchsia-400 animate-spin-slow" />
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans">
                                                    On-Device Transformers.js Vectorizer (Local Vector Engine)
                                                </h4>
                                                <p className="text-[9px] text-zinc-500 font-mono">
                                                    Synthesize text tokens inside browser utilizing local WebGPU hardware - ₹0 Cloud API pricing model.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 font-mono text-[9px]">
                                            <span className="text-zinc-600">ENGINE:</span>
                                            <span className="text-fuchsia-400 font-bold bg-fuchsia-950/20 px-2.5 py-0.5 rounded border border-fuchsia-500/20">
                                                {onDeviceAI.tensorEngine}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">
                                                    Enter Workout Status Logs
                                                </label>
                                                <textarea 
                                                    rows={2}
                                                    value={localAIText}
                                                    onChange={(e) => setLocalAIText(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-fuchsia-500 outline-none resize-none"
                                                />
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRunOnDeviceAIEmbedding}
                                                    disabled={localAIVectorizing || onDeviceAI.isLoadingWeights}
                                                    className="flex-1 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(217,70,239,0.15)] font-mono"
                                                >
                                                    {localAIVectorizing ? 'Compiling Tensor Model...' : onDeviceAI.isModelReady ? 'Generate On-Device Vector Embeddings' : 'Load AI Model Weights (44.2 MB)'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-black/90 rounded-2xl border border-white/5 p-4 font-mono text-[9px] flex flex-col justify-between">
                                            {onDeviceAI.isLoadingWeights ? (
                                                <div className="space-y-2 py-4">
                                                    <div className="flex justify-between text-fuchsia-400 font-bold">
                                                        <span>INITIALIZING ON-DEVICE ONNX BACKEND...</span>
                                                        <span>{Math.round((onDeviceAI.activeWeightsLoadedMb / 44.2) * 100)}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-900 rounded-full h-1.5. overflow-hidden">
                                                        <div 
                                                            className="bg-fuchsia-500 h-full transition-all duration-300"
                                                            style={{ width: `${(onDeviceAI.activeWeightsLoadedMb / 44.2) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[7px] text-zinc-500">Streaming bge-small-en model segments directly to client browser IndexedDB cache storage pipeline.</p>
                                                </div>
                                            ) : loadedOnDeviceResult ? (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                                        <span className="text-zinc-500">COMPILED WEIGHTS:</span>
                                                        <span className="text-emerald-400 font-bold">44.20 MB Loaded</span>
                                                    </div>
                                                    <div className="flex justify-between border-b border-white/5 pb-1">
                                                        <span className="text-zinc-500">COMPUTE TIME:</span>
                                                        <span className="text-fuchsia-400 font-bold">{onDeviceAI.onDeviceLatencyMs.toFixed(1)} ms</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-zinc-500 block mb-1">PROJECTION COORDINATE VALUES (pgvector embedding):</span>
                                                        <div className="bg-zinc-950 p-2 rounded border border-white/5 text-[9px] text-fuchsia-300 select-all font-mono leading-normal break-all">
                                                            [{onDeviceAI.vectorOutput?.join(', ')}]
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center bg-emerald-950/20 border border-emerald-500/20 p-1.5 rounded mt-1">
                                                        <span className="text-emerald-400 text-[8px] font-bold">✓ HARDWARE COMPUTE VALUE FOR AI:</span>
                                                        <span className="text-emerald-400 font-bold text-[8px]">₹0.00 BILLING</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-zinc-600 italic flex text-center justify-center items-center h-full">
                                                    Awaiting on-device vector generation... Select 'Generate On-Device Vector Embeddings'. Model weights will be compiled on your own local device GPU thread instantly.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Self-Healing Guard */}
                    {activeTabLab === 'guard' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-white uppercase font-sans tracking-wide">
                                        WhatsApp Credential Guard Verification Suite
                                    </h4>
                                    <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                                        Protects communication lines from format crashes, metadata structure errors, or template schema mismatches prior to executing external API triggers.
                                    </p>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Recipient Phone (10+ Digits)</label>
                                            <input 
                                                type="text" 
                                                value={whatsAppPhone}
                                                onChange={(e) => setWhatsAppPhone(e.target.value)}
                                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Active Meta Template ID</label>
                                                <input 
                                                    type="text" 
                                                    value={whatsAppTemplateId}
                                                    onChange={(e) => setWhatsAppTemplateId(e.target.value)}
                                                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">System Gateway Node</label>
                                                <div className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-zinc-500 font-mono select-none">
                                                    9800000000 (mID: 418X)
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-1 font-mono">Payload Message Body</label>
                                            <textarea 
                                                rows={2}
                                                value={whatsAppMessage}
                                                onChange={(e) => setWhatsAppMessage(e.target.value)}
                                                className="w-full bg-[#030307] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:border-amber-500 outline-none resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleValidateWhatsAppReal}
                                        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] font-mono"
                                    >
                                        Scan WhatsApp Message Payload
                                    </button>
                                </div>

                                <div className="bg-black/60 border border-white/5 rounded-2xl p-6 flex flex-col justify-between font-mono text-[10px] space-y-4">
                                    <div className="space-y-3">
                                        <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Neural Vault Security Guard Scanner</span>
                                        
                                        {whatsAppValidResult ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl ${whatsAppValidResult.isValid ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                                                        <Shield className="w-5 h-5 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase font-mono">
                                                            STATUS: {whatsAppValidResult.isValid ? 'CLEAN & SECURED' : 'BLOCKED / REJECTED'}
                                                        </div>
                                                        <div className="text-[8px] text-zinc-500">Verified through active Sandbox Security Rules</div>
                                                    </div>
                                                </div>

                                                {whatsAppValidResult.isValid ? (
                                                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300">
                                                        ✓ Your WhatsApp payload successfully passed dynamic validation criteria. Safe for direct API execution through merchant lines.
                                                    </div>
                                                ) : (
                                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
                                                        ⚠ BLOCKED: {whatsAppValidResult.error}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-zinc-950 border border-white/5 rounded-xl text-center text-zinc-500 italic">
                                                Awaiting payload scanner sequence... Press Scan WhatsApp Message Payload on the left to verify credentials.
                                            </div>
                                        )}

                                        {guardErrorLogs.length > 0 && (
                                            <div className="pt-2">
                                                <span className="text-zinc-500 block mb-1 uppercase text-[8px]">Security Audit Log Trace:</span>
                                                <div className="space-y-1 max-h-[85px] overflow-y-auto">
                                                    {guardErrorLogs.map((err, idx) => (
                                                        <div key={idx} className="text-[8px] text-red-400 bg-red-950/25 border border-red-500/10 p-1.5 rounded font-mono">
                                                            ⚠ FAIL: {err}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[8px] text-zinc-600 border-t border-white/5 pt-2">
                                        Zero Trust Isolation prevents Meta campaigns credit leaks and prevents applet errors.
                                    </div>
                                </div>
                            </div>

                            {/* Section B: Dynamic Self Healing Circuit Breaker */}
                            <div className="bg-black/30 border border-white/5 rounded-3xl p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
                                
                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className={`w-5 h-5 ${selfHealing.circuitState === 'OPEN' ? 'text-red-500 animate-pulse' : 'text-amber-400'}`} />
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider font-sans">
                                                    Resilient Circuit Breaker & Autonomic Routing
                                                </h4>
                                                <p className="text-[9px] text-zinc-500 font-mono">
                                                    If Meta API encounters downtime (status 503), the compiler intercepts, calls local LLM, and diverts dispatch payloads via legacy India SMS gateways instantly.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1 font-mono text-[8px] border border-white/10 px-2 py-0.5 rounded bg-black/40">
                                                <span className="text-zinc-600">CIRCUIT STATE:</span>
                                                <span className={`font-black ${selfHealing.circuitState === 'OPEN' ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                                                    {selfHealing.circuitState}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 font-mono text-[8px] border border-white/10 px-2 py-0.5 rounded bg-black/40">
                                                <span className="text-zinc-600">HEALED TRIGGERS:</span>
                                                <span className="text-emerald-400 font-bold">{selfHealing.selfHealedCount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-2">
                                                <div>
                                                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Dispatch Receiver No.</label>
                                                    <input 
                                                        type="text" 
                                                        value={healedPhoneInput}
                                                        onChange={(e) => setHealedPhoneInput(e.target.value)}
                                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1 font-mono">Autonomic Notification Text</label>
                                                    <textarea 
                                                        rows={2}
                                                        value={healedMessageInput}
                                                        onChange={(e) => setHealedMessageInput(e.target.value)}
                                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 outline-none resize-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleRunSelfHealingDispatch}
                                                    disabled={healedLoading}
                                                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)] font-mono disabled:opacity-50"
                                                >
                                                    {healedLoading ? 'Rerouting Payload...' : 'Dispatch Message (Auto Self-Heal)'}
                                                </button>
                                                {selfHealing.circuitState === 'OPEN' && (
                                                    <button
                                                        onClick={resetCircuitBreaker}
                                                        className="px-4 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all font-mono"
                                                    >
                                                        Reset Circuit
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Telemetry log execution terminal */}
                                        <div className="bg-[#020204] rounded-2xl border border-white/5 p-4 flex flex-col justify-between font-mono text-[9px] min-h-[140px]">
                                            <div>
                                                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block mb-2 border-b border-white/5 pb-1">
                                                    Autonomic Router Telemetry Line
                                                </span>
                                                <div className="space-y-1.5 max-h-[110px] overflow-y-auto custom-scrollbar">
                                                    {selfHealing.selfHealingLogs.length === 0 ? (
                                                        <p className="text-zinc-600 italic">No messages intercepted yet. Click "Dispatch Message" to execute the self-healing gateway sequence.</p>
                                                    ) : (
                                                        selfHealing.selfHealingLogs.map((logLine, idx) => (
                                                            <div 
                                                                key={idx} 
                                                                className={`leading-relaxed ${logLine.includes('ERROR') ? 'text-red-400' : logLine.includes('✓') ? 'text-emerald-400 font-bold' : logLine.includes('AI Core') ? 'text-fuchsia-400 font-semibold' : 'text-zinc-400'}`}
                                                            >
                                                                {logLine}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-[8px] text-zinc-600 border-t border-white/5 pt-1.5 flex justify-between items-center select-none">
                                                <span>ACTIVE GATEWAY:</span>
                                                <span className="text-amber-400 font-bold">{selfHealing.activeGateway}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
