
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { GitMerge, Cpu, RefreshCw, Activity, Layers, Terminal, Zap, DownloadCloud, Server, Shield } from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { KubernetesIcon } from './icons/KubernetesIcon';

// --- TYPES ---

interface PipelineStep {
    id: string;
    name: string;
    status: 'pending' | 'synthesizing' | 'success' | 'failed';
    detail: string;
}

interface WorkflowRun {
    id: string;
    mutationType: string;
    optimizationGain: string;
    status: 'queued' | 'evolving' | 'stabilized' | 'failed';
    steps: PipelineStep[];
}

interface Pod {
    id: string;
    version: string;
    load: number;
    status: 'Active' | 'Re-Spawning' | 'Optimizing' | 'Updating';
}

const AutoUpgrader: React.FC = () => {
    const { systemVersion, evolutionLevel, triggerSystemUpdate } = useData();
    const { addToast } = useToast();

    // --- STATE ---
    
    // Evolution Engine
    const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
    const [isEvolving, setIsEvolving] = useState(false);
    const [evolutionProgress, setEvolutionProgress] = useState(0);
    const [currentDownload, setCurrentDownload] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const availableVersions = ["v1.1", "v1.2", "v2.0", "v3.0", "v3.1", "v3.2", "v4.0", "v5.0"];

    // Derived progress for download simulation (First 25% of evolution)
    const downloadProgress = Math.min(100, evolutionProgress * 4);
    
    // Cluster State
    const [pods, setPods] = useState<Pod[]>(
        Array(8).fill(null).map((_, i) => ({ 
            id: `node-${Math.random().toString(36).substr(2, 4)}`, 
            version: systemVersion.split(' ')[0], 
            load: Math.floor(Math.random() * 40) + 20,
            status: 'Active'
        }))
    );
    
    // Live Terminal
    const [cliLogs, setCliLogs] = useState<string[]>([
        `Apex Kernel ${systemVersion} initialized.`,
        "Monitoring entropy levels...",
        "Self-Healing Core: Active",
        "Social Harmony Bridge: Connected"
    ]);
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [cliLogs]);

    const addLog = (msg: string, type: 'info' | 'success' | 'warn' | 'system' = 'info') => {
        const prefix = type === 'success' ? '✓' : type === 'warn' ? '⚠' : type === 'system' ? '█' : '>';
        setCliLogs(prev => [...prev.slice(-20), `${prefix} ${msg}`]);
    };

    // Live Cluster Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setPods(prev => prev.map(p => ({
                ...p,
                version: systemVersion.split(' ')[0], // Keep version synced
                load: Math.max(10, Math.min(95, p.load + (Math.random() * 10 - 5))),
                status: p.status === 'Re-Spawning' && Math.random() > 0.8 ? 'Active' : p.status
            })));
        }, 1000);
        return () => clearInterval(interval);
    }, [systemVersion]);

    // --- HANDLERS ---

    const handleForceEvolution = () => {
        if (isEvolving) return;
        setIsEvolving(true);
        setEvolutionProgress(0);
        
        const mutationId = `SINGULARITY-${Date.now().toString().slice(-6)}`;
        const optimizations = ['Social Harmony Patch', 'Zero Error Protocol', 'Neural Net Optimization', 'Quantum State Sync'];
        const chosenOpt = optimizations[Math.floor(Math.random() * optimizations.length)];

        // Select a random "Open Source" model to "pull"
        const models = ["Llama-3-70B-Instruct", "Mistral-Large-v2", "Gemma-2-27B-IT", "Flux-1.0-Pro"];
        const targetModel = models[Math.floor(Math.random() * models.length)];
        setCurrentDownload(targetModel);

        const newWorkflow: WorkflowRun = {
            id: mutationId,
            mutationType: chosenOpt,
            optimizationGain: `+${(Math.random() * 15 + 5).toFixed(1)}% Efficiency`,
            status: 'evolving',
            steps: [
                { id: 'pull', name: `Pulling ${targetModel}`, status: 'synthesizing', detail: 'Fetching weights from HuggingFace mirror...' },
                { id: 'compile', name: 'Neural Rewrite', status: 'pending', detail: 'Compiling shards...' },
                { id: 'verify', name: 'Unit Testing', status: 'pending', detail: 'Verifying harmony...' },
                { id: 'deploy', name: 'Hot Swap', status: 'pending', detail: 'Zero-downtime deployment...' },
            ]
        };
        setWorkflow(newWorkflow);
        addLog(`Initiating Self-Evolution Sequence: ${mutationId}`, 'warn');
        addLog(`Targeting Model: ${targetModel}`, 'system');

        // Simulation Steps
        let step = 0;
        const evolutionInterval = setInterval(() => {
            setEvolutionProgress(prev => {
                const next = Math.min(100, prev + 1.5);
                
                // Random logs during process
                if (Math.random() > 0.7) {
                    const logs = [
                        "Verifying SHA-256 Checksums...",
                        "Optimizing React render tree...",
                        "Re-indexing vector database...",
                        "Sanitizing input streams...",
                        "Allocating GPU buffers..."
                    ];
                    addLog(logs[Math.floor(Math.random() * logs.length)]);
                }

                // Step Progression Logic
                if (next > 25 && step === 0) {
                    updateStep(0, 'success');
                    updateStep(1, 'synthesizing');
                    step++;
                    addLog(`Model ${targetModel} downloaded successfully.`, 'success');
                }
                if (next > 50 && step === 1) {
                    updateStep(1, 'success');
                    updateStep(2, 'synthesizing');
                    step++;
                    setPods(prev => prev.map((p, i) => i % 2 === 0 ? { ...p, status: 'Updating', load: 90 } : p));
                    addLog("Neural Rewrite complete. Compiling binary...", 'info');
                }
                if (next > 75 && step === 2) {
                    updateStep(2, 'success');
                    updateStep(3, 'synthesizing');
                    step++;
                    addLog("Unit Tests Passed: 452/452.", 'success');
                }
                if (next >= 100) {
                    clearInterval(evolutionInterval);
                    updateStep(3, 'success');
                    finalizeEvolution();
                }

                return next;
            });

        }, 100);
    };

    const updateStep = (index: number, status: 'success' | 'synthesizing') => {
        setWorkflow(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[index].status = status;
            return { ...prev, steps: newSteps };
        });
    };

    const finalizeEvolution = () => {
        setIsEvolving(false);
        setCurrentDownload(null);
        setWorkflow(prev => prev ? { ...prev, status: 'stabilized' } : null);
        addLog(`Evolution Complete. Stabilizing System...`, "success");
        
        // --- REAL SYSTEM UPDATE TRIGGER ---
        triggerSystemUpdate(selectedVersion || undefined);
        
        addToast("Singularity Self-Evolve Successful. Version Incremented.", "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. APEX HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-blue-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(59,130,246,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-blue-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(37,99,235,0.5)] border border-blue-400 group-hover:rotate-12 transition-transform duration-700">
                            <CloudArrowUpIcon className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <GitMerge className="w-3 h-3" /> Auto-DevOps
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">PIPELINE: ACTIVE</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Self <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">Evolve</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="bg-gray-900/80 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl shadow-2xl text-center min-w-[200px]">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Live Kernel</p>
                             <p className="text-4xl font-black text-white italic tracking-tighter">{systemVersion.split(' ')[0]}</p>
                             <div className="flex items-center justify-center gap-2 mt-2 text-[10px] font-mono text-green-400">
                                 <Activity className="w-3 h-3" /> EVOLUTION LEVEL {Math.floor(evolutionLevel)}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: NEURAL PIPELINE */}
                <div className="lg:col-span-8 space-y-6">
                    <Card title="Evolution Matrix" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Layers className="w-40 h-40 text-blue-500" /></div>
                        
                        <div className="relative z-10">
                            {/* Workflow Visualizer */}
                            <div className="mb-8 p-6 bg-black/40 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{workflow ? workflow.mutationType : "System Harmony: 100%"}</h3>
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {workflow ? `Targeting: ${workflow.optimizationGain}` : "No active mutations detected. Self-Healing active."}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <select 
                                            value={selectedVersion}
                                            onChange={(e) => setSelectedVersion(e.target.value)}
                                            disabled={isEvolving}
                                            className="bg-gray-900 border border-white/10 text-white text-[10px] font-mono rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Auto-Select Version</option>
                                            {availableVersions.map(v => (
                                                <option key={v} value={v}>{v}</option>
                                            ))}
                                        </select>
                                        <button 
                                            onClick={handleForceEvolution}
                                            disabled={isEvolving}
                                            className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isEvolving ? <RefreshCw className="animate-spin w-4 h-4"/> : <Zap className="w-4 h-4"/>}
                                            {isEvolving ? 'EVOLVING...' : 'FORCE EVOLUTION'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 relative">
                                    {/* Connection Line */}
                                    <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-800"></div>

                                    {(workflow ? workflow.steps : [
                                        { name: 'Harmony Scan', status: 'pending', detail: 'Waiting for trigger...' },
                                        { name: 'Neural Rewrite', status: 'pending', detail: 'Waiting...' },
                                        { name: 'Zero Error Check', status: 'pending', detail: 'Waiting...' },
                                        { name: 'Hot Swap', status: 'pending', detail: 'Waiting...' },
                                    ]).map((step, idx) => (
                                        <div key={idx} className="relative pl-10">
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-10 h-0.5 ${step.status === 'synthesizing' || step.status === 'success' ? 'bg-blue-500' : 'bg-gray-800'}`}></div>
                                            <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-4 border-[#0c0c0c] z-10 flex items-center justify-center transition-all ${
                                                step.status === 'success' ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 
                                                step.status === 'synthesizing' ? 'bg-blue-500 animate-pulse shadow-[0_0_15px_#3b82f6]' : 'bg-gray-800'
                                            }`}>
                                                {step.status === 'success' ? <CheckCircleIcon className="w-4 h-4 text-black"/> : <Cpu className="w-4 h-4 text-white"/>}
                                            </div>
                                            
                                            <div className={`p-4 rounded-2xl border transition-all ${
                                                step.status === 'synthesizing' ? 'bg-blue-900/20 border-blue-500/50 shadow-lg' : 
                                                step.status === 'success' ? 'bg-green-900/10 border-green-500/30' :
                                                'bg-gray-900 border-white/5'
                                            }`}>
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-sm font-bold uppercase tracking-wide ${step.status === 'synthesizing' ? 'text-white' : 'text-gray-400'}`}>{step.name}</span>
                                                    {step.status === 'synthesizing' && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin"/>}
                                                </div>
                                                <p className="text-[10px] text-gray-500 font-mono mt-1">{step.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* RIGHT: LIVE KERNEL & CLUSTER */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Live Terminal */}
                    <Card title="Kernel Shell" className="bg-black border-gray-800 p-0 overflow-hidden flex flex-col h-[400px] rounded-[3rem] shadow-2xl">
                        <div className="bg-gray-900 px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2"><Terminal className="w-3 h-3"/> root@singularity_v30</span>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                            </div>
                        </div>
                        <div ref={terminalRef} className="flex-1 overflow-y-auto p-6 font-mono text-[10px] text-blue-400 space-y-2 custom-scrollbar">
                            {cliLogs.map((log, i) => (
                                <div key={i} className={`animate-fade-in ${log.includes('⚠') ? 'text-amber-400' : log.includes('✓') ? 'text-green-400' : log.includes('█') ? 'text-purple-400' : ''}`}>
                                    {log}
                                </div>
                            ))}
                            {isEvolving && <div className="animate-pulse">_</div>}
                        </div>
                    </Card>

                    {/* Cluster Topology */}
                    <Card className="bg-gray-900 border-white/5 p-6 rounded-[2.5rem]">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <KubernetesIcon className="w-4 h-4 text-blue-500"/> Node Topology
                            </h4>
                            <span className="text-[9px] bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-500/20">BALANCED</span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                            {pods.map((pod) => (
                                <div key={pod.id} className={`aspect-square rounded-xl border flex flex-col items-center justify-center transition-all relative overflow-hidden group ${
                                    pod.status === 'Optimizing' ? 'bg-amber-900/20 border-amber-500/50 animate-pulse' : 
                                    pod.status === 'Updating' ? 'bg-blue-900/20 border-blue-500/50 animate-pulse' :
                                    pod.status === 'Re-Spawning' ? 'bg-red-900/20 border-red-500/50' :
                                    'bg-black/40 border-white/10 hover:border-blue-500/30'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full mb-2 ${
                                        pod.status === 'Active' ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 
                                        pod.status === 'Updating' ? 'bg-blue-500' : 'bg-amber-500'
                                    }`}></div>
                                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden w-8">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${pod.load}%` }}></div>
                                    </div>
                                    <p className="text-[8px] text-gray-600 font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{pod.id}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Download Status */}
                    {currentDownload && (
                        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-[2rem] flex items-center gap-4 animate-slide-up">
                            <div className="p-3 bg-blue-500/20 rounded-full animate-bounce">
                                <DownloadCloud className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Pulling Model</p>
                                <p className="text-xs font-bold text-white truncate">{currentDownload}</p>
                                <div className="w-full h-1 bg-gray-800 rounded-full mt-2 overflow-hidden">
                                    <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${downloadProgress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AutoUpgrader;
