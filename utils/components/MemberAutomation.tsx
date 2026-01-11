
import React, { useState, useEffect, useCallback } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_PACKAGES, GYM_INFO, INITIAL_MEMBER_FITNESS_DATA } from '../../constants';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { BotIcon } from './icons/BotIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';

interface AutomationLog {
    id: number;
    agent: string;
    action: string;
    details: string;
    timestamp: string;
    status: 'Success' | 'Pending' | 'Failed' | 'Recovering';
}

interface AgentConfig {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
    isActive: boolean;
    isOnline: boolean; // New property for connection status
    stats: { label: string; value: number };
    color: string;
}

const SmartAutomationCenter: React.FC = () => {
    const [agents, setAgents] = useState<AgentConfig[]>([
        {
            id: 'retention',
            name: 'Retention Guard',
            icon: <UserGroupIcon className="w-6 h-6" />,
            description: 'Identifies members with low attendance (< 2/week) and sends re-engagement offers.',
            isActive: true,
            isOnline: true,
            stats: { label: 'At-Risk Saved', value: 12 },
            color: 'text-blue-400 bg-blue-400/10 border-blue-400/20'
        },
        {
            id: 'revenue',
            name: 'Revenue Optimizer',
            icon: <DollarSignIcon className="w-6 h-6" />,
            description: 'Predicts membership expiry and sends automated renewal incentives with dynamic pricing.',
            isActive: false,
            isOnline: false,
            stats: { label: 'Upsells Generated', value: 8 },
            color: 'text-green-400 bg-green-400/10 border-green-400/20'
        },
        {
            id: 'performance',
            name: 'Performance Tuner',
            icon: <TrendingUpIcon className="w-6 h-6" />,
            description: 'Analyzes workout logs. If progress stalls, auto-adjusts workout volume and intensity.',
            isActive: true,
            isOnline: true,
            stats: { label: 'Plans Optimized', value: 24 },
            color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
        }
    ]);

    const [logs, setLogs] = useState<AutomationLog[]>([]);
    const [processingAgent, setProcessingAgent] = useState<string | null>(null);

    // AI Simulation Logic
    const runSimulation = useCallback(async () => {
        const activeAgents = agents.filter(a => a.isActive && a.isOnline);
        if (activeAgents.length === 0) return;

        // Pick a random active agent to simulate work
        const randomAgent = activeAgents[Math.floor(Math.random() * activeAgents.length)];
        setProcessingAgent(randomAgent.id);

        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate "Thinking" time

        let logEntry: AutomationLog = {
            id: Date.now(),
            agent: randomAgent.name,
            action: '',
            details: '',
            timestamp: new Date().toLocaleTimeString(),
            status: 'Success'
        };

        const randomMember = INITIAL_MEMBERS[Math.floor(Math.random() * INITIAL_MEMBERS.length)];

        if (randomAgent.id === 'retention') {
            logEntry.action = 'Re-engagement Triggered';
            logEntry.details = `Detected low attendance for ${randomMember.name}. Scheduled "Miss You" WhatsApp sequence.`;
        } else if (randomAgent.id === 'revenue') {
            logEntry.action = 'Renewal Opportunity';
            logEntry.details = `Membership for ${randomMember.name} expires soon. Generated 15% discount offer code.`;
        } else if (randomAgent.id === 'performance') {
            logEntry.action = 'Workout Calibration';
            logEntry.details = `Detected plateau in Bench Press for ${randomMember.name}. Adjusted volume +5% for next session.`;
        }

        setLogs(prev => [logEntry, ...prev].slice(0, 10)); // Keep last 10 logs
        
        // Update stats
        setAgents(prev => prev.map(a => 
            a.id === randomAgent.id ? { ...a, stats: { ...a.stats, value: a.stats.value + 1 } } : a
        ));
        
        setProcessingAgent(null);
    }, [agents]);

    // Auto-Reconnect Service Logic (Simulating the provided Kotlin Service)
    useEffect(() => {
        const monitoringInterval = setInterval(() => {
            setAgents(currentAgents => {
                let hasUpdates = false;
                const updatedAgents = currentAgents.map(agent => {
                    // Randomly simulate a connection drop for active agents (rare event)
                    if (agent.isActive && agent.isOnline && Math.random() < 0.05) {
                        hasUpdates = true;
                        // Log the failure
                        setLogs(prev => [{
                            id: Date.now(),
                            agent: agent.name,
                            action: 'System Alert',
                            details: 'Connection lost. Device offline.',
                            timestamp: new Date().toLocaleTimeString(),
                            status: 'Failed'
                        }, ...prev]);
                        return { ...agent, isOnline: false };
                    }
                    
                    // Auto-Reconnect Logic: If active but offline, try to reconnect
                    if (agent.isActive && !agent.isOnline) {
                        hasUpdates = true;
                        // Log the recovery attempt
                        setLogs(prev => [{
                            id: Date.now(),
                            agent: agent.name,
                            action: 'Auto-Recovery',
                            details: 'Reconnecting service...',
                            timestamp: new Date().toLocaleTimeString(),
                            status: 'Recovering'
                        }, ...prev]);
                        
                        // Simulate successful reconnection
                        setTimeout(() => {
                             setLogs(prev => [{
                                id: Date.now(),
                                agent: agent.name,
                                action: 'System Restored',
                                details: 'Agent back online.',
                                timestamp: new Date().toLocaleTimeString(),
                                status: 'Success'
                            }, ...prev]);
                        }, 1500);

                        return { ...agent, isOnline: true };
                    }
                    return agent;
                });
                
                return hasUpdates ? updatedAgents : currentAgents;
            });
        }, 5000); // Check every 5 seconds

        return () => clearInterval(monitoringInterval);
    }, []);

    // Run simulation loop
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.6) { // 40% chance to run every 5 seconds
                runSimulation();
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [runSimulation]);

    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive, isOnline: !a.isActive } : a));
    };

    const handleRunAnalysis = async (agentId: string) => {
        setProcessingAgent(agentId);
        const agent = agents.find(a => a.id === agentId);
        if (!agent || !agent.isOnline) return;

        // Use Gemini for a "Real" analysis of the static data
        let prompt = "";
        if (agentId === 'retention') {
            prompt = `Analyze this member list: ${JSON.stringify(INITIAL_MEMBERS.map(m => ({name: m.name, status: m.status})))}. Identify inactive members and suggest a specific 1-sentence WhatsApp message to win them back.`;
        } else if (agentId === 'revenue') {
            prompt = `Analyze these packages: ${JSON.stringify(INITIAL_PACKAGES.map(p => p.name))}. Suggest a "Flash Sale" strategy to boost revenue this weekend.`;
        } else {
            prompt = `Analyze fitness trends. What is the #1 scientific method to break a bench press plateau? Explain in 1 sentence.`;
        }

        try {
            const aiResponse = await getComplexResponse(prompt);
            const logEntry: AutomationLog = {
                id: Date.now(),
                agent: agent.name,
                action: 'Manual Deep Scan',
                details: aiResponse.slice(0, 100) + '...', // Truncate for UI
                timestamp: new Date().toLocaleTimeString(),
                status: 'Success'
            };
            setLogs(prev => [logEntry, ...prev]);
        } catch (e) {
            console.error(e);
        } finally {
            setProcessingAgent(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <BotIcon />
                        <span className="ml-3">Gym Autopilot</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Intelligent automation suite running 24/7 optimization.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                    <div className={`w-2 h-2 rounded-full ${processingAgent ? 'bg-amber-400 animate-ping' : 'bg-green-500'}`}></div>
                    <span className="text-xs font-mono text-gray-300">SYSTEM {processingAgent ? 'PROCESSING...' : 'ONLINE'}</span>
                </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {agents.map(agent => (
                    <Card key={agent.id} className={`relative overflow-hidden transition-all duration-300 ${agent.isActive ? 'border-gray-600' : 'opacity-75 grayscale'}`}>
                        {agent.isActive && agent.isOnline && (
                            <div className="absolute top-0 right-0 p-2">
                                <span className="flex h-3 w-3">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${agent.id === 'retention' ? 'bg-blue-400' : agent.id === 'revenue' ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                                  <span className={`relative inline-flex rounded-full h-3 w-3 ${agent.id === 'retention' ? 'bg-blue-500' : agent.id === 'revenue' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                                </span>
                            </div>
                        )}
                        
                        <div className="flex items-center mb-4">
                            <div className={`p-3 rounded-lg mr-4 ${agent.color}`}>
                                {agent.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">{agent.name}</h3>
                                <div className="flex items-center gap-2">
                                    <p className={`text-xs font-bold ${agent.isActive ? 'text-green-400' : 'text-gray-500'}`}>
                                        {agent.isActive ? 'ACTIVE' : 'PAUSED'}
                                    </p>
                                    {agent.isActive && !agent.isOnline && (
                                        <span className="text-[10px] bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded animate-pulse">OFFLINE - RETRYING</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-6 h-10">{agent.description}</p>
                        
                        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase">{agent.stats.label}</p>
                                <p className="text-2xl font-bold text-white">{agent.stats.value}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleRunAnalysis(agent.id)}
                                    disabled={processingAgent === agent.id || !agent.isActive || !agent.isOnline}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white disabled:opacity-50"
                                    title="Run Once"
                                >
                                    <SparkleIcon className={`w-5 h-5 ${processingAgent === agent.id ? 'animate-spin' : ''}`} />
                                </button>
                                <label className="inline-flex relative items-center cursor-pointer">
                                    <input type="checkbox" checked={agent.isActive} onChange={() => toggleAgent(agent.id)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Live Operations Console */}
            <Card title="Live Operations Log">
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm max-h-[300px] overflow-y-auto border border-gray-700/50 space-y-2 custom-scrollbar">
                    {logs.length === 0 && <p className="text-gray-500 text-center py-4">Waiting for system events...</p>}
                    {logs.map(log => (
                        <div key={log.id} className={`flex items-start gap-3 border-l-2 pl-3 py-1 hover:bg-gray-800/30 transition-colors animate-fade-in ${
                            log.status === 'Failed' ? 'border-red-500 bg-red-900/10' : 
                            log.status === 'Recovering' ? 'border-yellow-500 bg-yellow-900/10' : 
                            'border-gray-700'
                        }`}>
                            <span className="text-gray-500 whitespace-nowrap text-xs mt-0.5">[{log.timestamp}]</span>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${
                                        log.agent === 'Retention Guard' ? 'text-blue-400' : 
                                        log.agent === 'Revenue Optimizer' ? 'text-green-400' : 'text-amber-400'
                                    }`}>{log.agent}</span>
                                    <span className={`text-xs ${log.status === 'Failed' ? 'text-red-400' : 'text-gray-400'}`}>:: {log.action}</span>
                                </div>
                                <p className="text-gray-300">{log.details}</p>
                            </div>
                            {log.status === 'Success' && <CheckCircleIcon className="w-4 h-4 text-green-500 mt-1" />}
                            {log.status === 'Failed' && <span className="text-xs text-red-500 font-bold">⚠</span>}
                            {log.status === 'Recovering' && <AutoUpdateIcon className="w-4 h-4 text-yellow-500 animate-spin" />}
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                    <span>Auto-scrolling enabled</span>
                    <span className="flex items-center"><AutoUpdateIcon className="w-3 h-3 mr-1" /> Auto-Reconnect Active</span>
                </div>
            </Card>
        </div>
    );
};

export default SmartAutomationCenter;
