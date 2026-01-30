
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { CloudArrowUpIcon } from './icons/CloudArrowUpIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { GitIcon } from './icons/GitIcon';
import { KubernetesIcon } from './icons/KubernetesIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';

// --- TYPES ---

interface PipelineStep {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    duration: string;
}

interface WorkflowRun {
    id: string;
    commitMessage: string;
    author: string;
    status: 'queued' | 'in_progress' | 'completed' | 'failed';
    steps: PipelineStep[];
}

interface Pod {
    id: string;
    version: 'v1.0' | 'v1.1' | 'v1.2';
    status: 'Running' | 'Terminating' | 'ContainerCreating' | 'Pending';
    health: 'healthy' | 'warning';
}

interface Dependency {
    name: string;
    currentVersion: string;
    newVersion: string;
    type: 'security' | 'feature' | 'patch';
    prStatus: 'open' | 'merged' | 'closed';
}

const AutoUpgrader: React.FC = () => {
    // --- STATE ---
    
    // GitHub Actions Simulation
    const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
    
    // ArgoCD Simulation
    const [syncStatus, setSyncStatus] = useState<'Synced' | 'OutOfSync' | 'Syncing'>('Synced');
    
    // Kubernetes Simulation
    const [pods, setPods] = useState<Pod[]>(
        Array(8).fill(null).map((_, i) => ({ id: `royal-pod-${i}`, version: 'v1.1', status: 'Running', health: 'healthy' }))
    );
    
    // Renovate Bot Simulation
    const [dependencies, setDependencies] = useState<Dependency[]>([
        { name: 'react', currentVersion: '18.2.0', newVersion: '18.3.0', type: 'feature', prStatus: 'open' },
        { name: 'axios', currentVersion: '1.4.0', newVersion: '1.6.0', type: 'security', prStatus: 'open' },
        { name: '@google/genai', currentVersion: '0.1.0', newVersion: '0.2.1', type: 'feature', prStatus: 'open' },
        { name: 'tailwindcss', currentVersion: '3.3.0', newVersion: '3.4.1', type: 'patch', prStatus: 'open' },
    ]);

    // --- HANDLERS ---

    const handleTriggerBuild = () => {
        const newWorkflow: WorkflowRun = {
            id: `run-${Math.floor(Math.random() * 10000)}`,
            commitMessage: 'fix: optimize payment gateway latency',
            author: 'DevOps Bot',
            status: 'in_progress',
            steps: [
                { id: 'build', name: 'Build & Lint', status: 'running', duration: '...' },
                { id: 'test', name: 'Unit Tests', status: 'pending', duration: '-' },
                { id: 'docker', name: 'Docker Build', status: 'pending', duration: '-' },
                { id: 'deploy', name: 'Update Manifests', status: 'pending', duration: '-' },
            ]
        };
        setWorkflow(newWorkflow);
        
        // Simulate Build Process Stages
        setTimeout(() => updateStep(0, 'success', '45s', 'running'), 2000);
        setTimeout(() => updateStep(1, 'success', '12s', 'running'), 4000);
        setTimeout(() => updateStep(2, 'success', '1m 20s', 'running'), 7000);
        setTimeout(() => {
            updateStep(3, 'success', '5s', 'success');
            setWorkflow(prev => prev ? { ...prev, status: 'completed' } : null);
            setSyncStatus('OutOfSync'); // Trigger ArgoCD OutOfSync
            handleArgoSync();
        }, 9000);
    };

    const updateStep = (stepIndex: number, status: any, duration: string, nextStatus: any) => {
        setWorkflow(prev => {
            if (!prev) return null;
            const newSteps = [...prev.steps];
            newSteps[stepIndex] = { ...newSteps[stepIndex], status, duration };
            if (stepIndex + 1 < newSteps.length) {
                newSteps[stepIndex + 1] = { ...newSteps[stepIndex + 1], status: nextStatus, duration: '...' };
            }
            return { ...prev, steps: newSteps };
        });
    };

    const handleArgoSync = () => {
        setTimeout(() => {
            setSyncStatus('Syncing');
            // Rolling Update Simulation
            let replaced = 0;
            const interval = setInterval(() => {
                setPods(prev => {
                    const newPods = [...prev];
                    if (replaced < newPods.length) {
                        newPods[replaced] = { ...newPods[replaced], status: 'Terminating' };
                        // Add new pod
                        setTimeout(() => {
                            setPods(curr => {
                                const p = [...curr];
                                p[replaced - 1] = { ...p[replaced - 1], id: `royal-pod-new-${replaced}`, version: 'v1.2', status: 'Running' };
                                return p;
                            });
                        }, 500);
                    }
                    return newPods;
                });
                replaced++;
                if (replaced > pods.length) {
                    clearInterval(interval);
                    setSyncStatus('Synced');
                }
            }, 800);
        }, 1000);
    };

    const handleMergeDep = (idx: number) => {
        setDependencies(prev => prev.map((d, i) => i === idx ? { ...d, prStatus: 'merged' } : d));
        // Trigger build automatically on merge
        setTimeout(() => handleTriggerBuild(), 1000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-xl">
                <div>
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center">
                        <CloudArrowUpIcon className="w-10 h-10 mr-3 text-cyan-400" />
                        Royal Auto-Upgrader
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">CI/CD Pipeline • Rolling Updates • Dependency AI</p>
                </div>
                <div className="flex items-center gap-4 mt-4 md:mt-0">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Current Release</span>
                        <span className="text-xl font-mono font-bold text-green-400">v1.2.4-stable</span>
                    </div>
                    <button 
                        onClick={handleTriggerBuild}
                        disabled={workflow?.status === 'in_progress'}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <AutoUpdateIcon className={`w-5 h-5 mr-2 ${workflow?.status === 'in_progress' ? 'animate-spin' : ''}`} />
                        {workflow?.status === 'in_progress' ? 'Deploying...' : 'Force Update'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* COLUMN 1: BUILD PIPELINE */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Live Build Pipeline (GitHub Actions)" className="border-t-4 border-gray-600">
                        <div className="flex items-center gap-3 mb-6 bg-gray-800 p-3 rounded-lg border border-gray-700">
                            <GitIcon className="w-6 h-6 text-white" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white">{workflow ? workflow.commitMessage : "No active builds"}</p>
                                <p className="text-xs text-gray-400">{workflow ? `Triggered by ${workflow.author}` : "System Idle"}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                                workflow?.status === 'in_progress' ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 
                                workflow?.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'
                            }`}>
                                {workflow?.status || 'IDLE'}
                            </span>
                        </div>

                        <div className="space-y-4 relative">
                            {/* Connector Line */}
                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-700"></div>

                            {(workflow ? workflow.steps : [
                                { name: 'Build & Lint', status: 'pending', duration: '-' },
                                { name: 'Unit Tests', status: 'pending', duration: '-' },
                                { name: 'Docker Build', status: 'pending', duration: '-' },
                                { name: 'Deploy to Cluster', status: 'pending', duration: '-' },
                            ]).map((step, idx) => (
                                <div key={idx} className="relative pl-14">
                                    <div className={`absolute left-4 top-1 w-5 h-5 rounded-full border-4 border-gray-900 z-10 ${
                                        step.status === 'success' ? 'bg-green-500' : 
                                        step.status === 'running' ? 'bg-amber-500 animate-ping' : 'bg-gray-600'
                                    }`}></div>
                                    <div className={`p-3 rounded-lg border flex justify-between items-center transition-all ${
                                        step.status === 'running' ? 'bg-gray-800 border-amber-500/50 shadow-lg' : 'bg-gray-900 border-gray-800'
                                    }`}>
                                        <span className="text-sm font-medium text-gray-200">{step.name}</span>
                                        <span className="text-xs font-mono text-gray-500">{step.duration}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card title="Cluster State (Kubernetes)" className="bg-black border-gray-800">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <KubernetesIcon className="w-5 h-5 text-blue-500" />
                                <span className="text-xs font-mono text-gray-400">Target: production-cluster-1</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                syncStatus === 'Synced' ? 'text-green-400 bg-green-900/20' : 
                                syncStatus === 'Syncing' ? 'text-blue-400 bg-blue-900/20 animate-pulse' : 'text-yellow-400 bg-yellow-900/20'
                            }`}>
                                ArgoCD: {syncStatus}
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                            {pods.map((pod) => (
                                <div key={pod.id} className={`p-2 rounded border transition-all duration-500 ${
                                    pod.status === 'Running' ? 'bg-green-900/20 border-green-500/30' : 
                                    pod.status === 'Terminating' ? 'bg-red-900/20 border-red-500/30 opacity-50 scale-95' :
                                    'bg-blue-900/20 border-blue-500/30 animate-pulse'
                                }`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className={`w-2 h-2 rounded-full ${pod.status === 'Running' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                        <span className="text-[9px] font-mono text-gray-500">{pod.version}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-300 truncate">{pod.id}</p>
                                    <p className="text-[9px] text-gray-500">{pod.status}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* COLUMN 2: DEPENDENCIES */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-full border-t-4 border-purple-500 bg-gray-800/50">
                        <div className="flex items-center gap-3 mb-6">
                            <BotIcon className="w-8 h-8 text-purple-400" />
                            <div>
                                <h3 className="font-bold text-white">Renovate Bot</h3>
                                <p className="text-xs text-gray-400">Auto-Dependency Management</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {dependencies.map((dep, idx) => (
                                <div key={idx} className="bg-gray-900 p-3 rounded-xl border border-gray-700 relative overflow-hidden">
                                    {dep.prStatus === 'merged' && (
                                        <div className="absolute inset-0 bg-green-900/80 flex items-center justify-center z-10 backdrop-blur-sm">
                                            <span className="text-green-400 font-bold text-xs flex items-center">
                                                <CheckCircleIcon className="w-4 h-4 mr-1" /> MERGED
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-sm text-white">{dep.name}</p>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase ${
                                            dep.type === 'security' ? 'border-red-500 text-red-400' : 'border-blue-500 text-blue-400'
                                        }`}>{dep.type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                                        <span className="font-mono bg-gray-800 px-1 rounded">{dep.currentVersion}</span>
                                        <span>→</span>
                                        <span className="font-mono text-green-400 bg-green-900/30 px-1 rounded">{dep.newVersion}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleMergeDep(idx)}
                                        className="w-full py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded transition-colors flex items-center justify-center border border-gray-600"
                                    >
                                        <GitIcon className="w-3 h-3 mr-1" /> Merge Pull Request
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 p-3 bg-purple-900/10 rounded-lg border border-purple-500/20">
                            <p className="text-xs text-purple-300 flex items-start">
                                <SparkleIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                                AI Analysis: "Upgrading `axios` fixes CVE-2024-XXXX. Recommended immediate merge."
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AutoUpgrader;
