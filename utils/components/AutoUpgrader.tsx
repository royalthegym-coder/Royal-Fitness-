
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
    
    // GitHub Actions
    const [workflow, setWorkflow] = useState<WorkflowRun | null>(null);
    
    // ArgoCD
    const [syncStatus, setSyncStatus] = useState<'Synced' | 'OutOfSync' | 'Syncing'>('Synced');
    const [appHealth, setAppHealth] = useState<'Healthy' | 'Progressing' | 'Degraded'>('Healthy');
    
    // Kubernetes
    const [pods, setPods] = useState<Pod[]>(
        Array(12).fill(null).map((_, i) => ({ id: `royal-pod-${i}`, version: 'v1.1', status: 'Running', health: 'healthy' }))
    );
    
    // Renovate
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
        
        // Simulate Build Process
        setTimeout(() => updateStep(newWorkflow, 0, 'success', '45s', 'running'), 2000);
        setTimeout(() => updateStep(newWorkflow, 1, 'success', '12s', 'running'), 4000);
        setTimeout(() => updateStep(newWorkflow, 2, 'success', '1m 20s', 'running'), 7000);
        setTimeout(() => {
            updateStep(newWorkflow, 3, 'success', '5s', 'success');
            setWorkflow(prev => prev ? { ...prev, status: 'completed' } : null);
            setSyncStatus('OutOfSync'); // Trigger ArgoCD OutOfSync
        }, 9000);
    };

    const updateStep = (wf: WorkflowRun, stepIndex: number, status: any, duration: string, nextStatus: any) => {
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
        setSyncStatus('Syncing');
        setAppHealth('Progressing');
        
        // Trigger K8s Rolling Update
        performRollingUpdate();
        
        setTimeout(() => {
            setSyncStatus('Synced');
            setAppHealth('Healthy');
        }, 12000); // Sync complete after rolling update
    };

    const performRollingUpdate = () => {
        // Replace pods one by one
        let index = 0;
        const interval = setInterval(() => {
            if (index >= pods.length) {
                clearInterval(interval);
                return;
            }

            setPods(currentPods => {
                const newPods = [...currentPods];
                // Terminate old
                newPods[index] = { ...newPods[index], status: 'Terminating', health: 'warning' };
                return newPods;
            });

            setTimeout(() => {
                setPods(currentPods => {
                    const newPods = [...currentPods];
                    // Create new
                    newPods[index] = { ...newPods[index], version: 'v1.2', status: 'ContainerCreating', health: 'healthy' };
                    return newPods;
                });
                
                setTimeout(() => {
                    setPods(currentPods => {
                        const newPods = [...currentPods];
                        // Running
                        newPods[index] = { ...newPods[index], status: 'Running' };
                        return newPods;
                    });
                }, 800);
            }, 800);

            index++;
        }, 1000);
    };

    const handleMergeDependency = (depName: string) => {
        setDependencies(prev => prev.map(d => d.name === depName ? { ...d, prStatus: 'merged' } : d));
        // Auto trigger build when merging
        setTimeout(() => handleTriggerBuild(), 1000);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center">
                        <AutoUpdateIcon className="w-8 h-8 mr-3 text-blue-400" />
                        RoyalOps Command Center
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Automated Patching & Deployment Pipeline</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-gray-800 rounded border border-gray-700 text-xs text-gray-400 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                        System Healthy
                    </div>
                </div>
            </div>

            {/* TOP ROW: CI/CD & GITOPS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. GITHUB ACTIONS */}
                <Card className="relative overflow-hidden border-t-4 border-gray-600 bg-gray-900">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center">
                            <GitIcon className="w-6 h-6 mr-3 text-white" />
                            <div>
                                <h3 className="text-lg font-bold text-white">GitHub Actions</h3>
                                <p className="text-xs text-gray-400">Continuous Integration</p>
                            </div>
                        </div>
                        <button 
                            onClick={handleTriggerBuild}
                            disabled={workflow?.status === 'in_progress'}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md font-bold transition-colors disabled:opacity-50"
                        >
                            {workflow?.status === 'in_progress' ? 'Running...' : 'Trigger Build'}
                        </button>
                    </div>

                    {!workflow ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">
                            <p>No active workflows.</p>
                            <p className="text-xs mt-1">Last run: 2 hours ago (Success)</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-700 pb-2">
                                <span>{workflow.commitMessage}</span>
                                <span className="text-blue-400 font-mono">{workflow.id}</span>
                            </div>
                            <div className="space-y-2">
                                {workflow.steps.map((step, i) => (
                                    <div key={step.id} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-3 ${
                                                step.status === 'success' ? 'bg-green-500' : 
                                                step.status === 'running' ? 'bg-amber-500 animate-pulse' : 
                                                step.status === 'failed' ? 'bg-red-500' : 'bg-gray-600'
                                            }`}></div>
                                            <span className={`text-sm ${step.status === 'pending' ? 'text-gray-500' : 'text-gray-200'}`}>{step.name}</span>
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">{step.duration}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* 2. ARGOCD */}
                <Card className="relative overflow-hidden border-t-4 border-cyan-500 bg-gray-900">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center">
                            <div className="mr-3">
                                {/* Argo Squid Icon Simulation */}
                                <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/> 
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">ArgoCD</h3>
                                <p className="text-xs text-gray-400">GitOps Deployment</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                syncStatus === 'Synced' ? 'bg-green-900/20 text-green-400 border-green-500/50' : 
                                syncStatus === 'Syncing' ? 'bg-blue-900/20 text-blue-400 border-blue-500/50' : 
                                'bg-yellow-900/20 text-yellow-400 border-yellow-500/50'
                            }`}>
                                {syncStatus}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${appHealth === 'Healthy' ? 'bg-green-900/20 text-green-400 border-green-500/50' : 'bg-blue-900/20 text-blue-400 border-blue-500/50'}`}>
                                {appHealth}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-center">
                            <GitIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Repo State</p>
                            <p className="text-sm font-bold text-white">v1.2.0</p>
                        </div>
                        
                        <div className="flex-1 px-4 flex flex-col items-center">
                            <div className={`h-1 w-full rounded-full mb-2 ${syncStatus === 'Synced' ? 'bg-green-500' : 'bg-gray-600'}`}>
                                {syncStatus === 'Syncing' && <div className="h-full bg-blue-400 animate-progress"></div>}
                            </div>
                            <button 
                                onClick={handleArgoSync}
                                disabled={syncStatus === 'Syncing' || syncStatus === 'Synced'}
                                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/20"
                            >
                                {syncStatus === 'Syncing' ? <AutoUpdateIcon className="w-3 h-3 animate-spin"/> : 'SYNC NOW'}
                            </button>
                        </div>

                        <div className="text-center">
                            <KubernetesIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Live State</p>
                            <p className="text-sm font-bold text-white">{pods[0].version}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* BOTTOM ROW: K8S & RENOVATE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 3. KUBERNETES VISUALIZER */}
                <Card className="lg:col-span-2 border-t-4 border-blue-600 bg-gray-900">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <KubernetesIcon className="w-6 h-6 mr-3 text-blue-500" />
                            <div>
                                <h3 className="text-lg font-bold text-white">Live Cluster Map</h3>
                                <p className="text-xs text-gray-400">Zero-Downtime Rolling Update Visualization</p>
                            </div>
                        </div>
                        <div className="text-xs font-mono text-gray-500">
                            Replicas: <span className="text-white">12/12</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {pods.map((pod) => (
                            <div 
                                key={pod.id} 
                                className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                                    pod.status === 'Terminating' ? 'bg-red-900/20 border-red-500/50 scale-90 opacity-50' :
                                    pod.status === 'ContainerCreating' ? 'bg-blue-900/20 border-blue-500/50 animate-pulse' :
                                    pod.version === 'v1.2' ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                                    'bg-gray-800 border-gray-600'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full mb-1 ${pod.status === 'Running' ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                                <span className="text-[10px] font-mono text-gray-300">{pod.version}</span>
                                <span className="text-[8px] text-gray-500 uppercase">{pod.status === 'ContainerCreating' ? 'Init' : pod.status}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 4. RENOVATE BOT */}
                <Card className="border-t-4 border-indigo-500 bg-gray-900">
                    <div className="flex items-center mb-6">
                        <BotIcon className="w-6 h-6 mr-3 text-indigo-400" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Renovate Bot</h3>
                            <p className="text-xs text-gray-400">Dependency Intelligence</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {dependencies.map((dep, idx) => (
                            <div key={idx} className={`p-3 rounded-lg border flex justify-between items-center transition-all ${dep.prStatus === 'merged' ? 'opacity-50 grayscale bg-gray-800 border-gray-700' : 'bg-gray-800 border-gray-700 hover:border-indigo-500/50'}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-white">{dep.name}</p>
                                        {dep.type === 'security' && <span className="text-[8px] bg-red-900 text-red-200 px-1.5 py-0.5 rounded font-bold uppercase">Sec</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {dep.currentVersion} <span className="text-indigo-400">→ {dep.newVersion}</span>
                                    </p>
                                </div>
                                {dep.prStatus === 'open' ? (
                                    <button 
                                        onClick={() => handleMergeDependency(dep.name)}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded transition-colors"
                                    >
                                        Merge PR
                                    </button>
                                ) : (
                                    <span className="text-xs text-green-500 font-bold flex items-center">
                                        <CheckCircleIcon className="w-3 h-3 mr-1" /> Merged
                                    </span>
                                )}
                            </div>
                        ))}
                        {dependencies.every(d => d.prStatus === 'merged') && (
                            <div className="text-center py-4 text-green-400 text-sm animate-fade-in">
                                <SparkleIcon className="w-6 h-6 mx-auto mb-2" />
                                All dependencies up to date!
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AutoUpgrader;
