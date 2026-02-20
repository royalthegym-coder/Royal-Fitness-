
import React, { useState, useEffect, useCallback } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_PACKAGES, GYM_INFO, INITIAL_MEMBER_FITNESS_DATA, INITIAL_LEADS } from '../../constants';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { BotIcon } from './icons/BotIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { Search, Target, UserCheck, Activity, RefreshCw } from 'lucide-react';
import { useData } from '../context/DataProvider';

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
    isOnline: boolean;
    stats: { label: string; value: number };
    color: string;
}

const SmartAutomationCenter: React.FC = () => {
    const { leads, setLeads } = useData();
    const [agents, setAgents] = useState<AgentConfig[]>([
        {
            id: 'lead-qualifier',
            name: 'Lead Qualification Bot',
            icon: <Search className="w-6 h-6" />,
            description: 'Analyzes cold and warm lead data to calculate conversion probability and intent scores.',
            isActive: true,
            isOnline: true,
            stats: { label: 'Leads Scored', value: leads.length },
            color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
        },
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

    const handleRunAnalysis = async (agentId: string) => {
        setProcessingAgent(agentId);
        const agent = agents.find(a => a.id === agentId);
        if (!agent || !agent.isOnline) return;

        let prompt = "";
        if (agentId === 'lead-qualifier') {
            prompt = `Analyze this lead data for Royal Gym: ${JSON.stringify(leads)}. 
            For each lead name, return a numeric score (0-100) representing conversion probability. 
            Consider Instagram leads as high aesthetics-intent, Facebook as community-intent, and Walk-ins as price-intent. 
            Format strictly as a JSON array of objects: [{"name": "string", "score": number, "priority": "string"}].`;
        } else if (agentId === 'retention') {
            prompt = `Analyze this member list: ${JSON.stringify(INITIAL_MEMBERS.map(m => ({name: m.name, status: m.status})))}. Identify inactive members and suggest a specific 1-sentence WhatsApp message to win them back.`;
        } else if (agentId === 'revenue') {
            prompt = `Analyze these packages: ${JSON.stringify(INITIAL_PACKAGES.map(p => p.name))}. Suggest a "Flash Sale" strategy to boost revenue this weekend.`;
        } else {
            prompt = `Analyze fitness trends. What is the #1 scientific method to break a bench press plateau? Explain in 1 sentence.`;
        }

        try {
            const aiResponse = await getComplexResponse(prompt);
            
            if (agentId === 'lead-qualifier') {
                const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                const scores = JSON.parse(cleanJson);
                
                const updatedLeads = leads.map(lead => {
                    const found = scores.find((s: any) => s.name === lead.name);
                    return found ? { ...lead, aiScore: found.score } : lead;
                });
                
                setLeads(updatedLeads);
                
                setLogs(prev => [{
                    id: Date.now(),
                    agent: agent.name,
                    action: 'Batch Intelligence Sync',
                    details: `Successfully scored ${leads.length} lead vectors using Gemini 3 Pro. Kernel updated.`,
                    timestamp: new Date().toLocaleTimeString(),
                    status: 'Success'
                }, ...prev]);
            } else {
                const logEntry: AutomationLog = {
                    id: Date.now(),
                    agent: agent.name,
                    action: 'Neural Deep Scan',
                    details: aiResponse.slice(0, 150) + (aiResponse.length > 150 ? '...' : ''),
                    timestamp: new Date().toLocaleTimeString(),
                    status: 'Success'
                };
                setLogs(prev => [logEntry, ...prev]);
            }
        } catch (e) {
            console.error(e);
            setLogs(prev => [{
                id: Date.now(),
                agent: agent.name,
                action: 'Neural Fault',
                details: 'Uplink to Gemini Core severed. Retrying handshake...',
                timestamp: new Date().toLocaleTimeString(),
                status: 'Failed'
            }, ...prev]);
        } finally {
            setProcessingAgent(null);
        }
    };

    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive, isOnline: !a.isActive } : a));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <BotIcon />
                        <span className="ml-3 italic uppercase tracking-tighter">Gym Autopilot <span className="text-xs text-gray-500 font-mono tracking-widest">v23.0</span></span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Multi-Agent Neural Infrastructure running 24/7.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-full border border-gray-700 shadow-inner">
                    <div className={`w-2 h-2 rounded-full ${processingAgent ? 'bg-amber-400 animate-ping' : 'bg-green-500'}`}></div>
                    <span className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest">GATEWAY: {processingAgent ? 'EXECUTING' : 'LISTENING'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {agents.map(agent => (
                    <Card key={agent.id} className={`relative overflow-hidden transition-all duration-500 border-2 ${agent.isActive ? 'border-gray-700 hover:border-amber-500/50 shadow-2xl' : 'opacity-60 grayscale border-transparent bg-gray-900/50'}`}>
                        {agent.isActive && agent.isOnline && (
                            <div className="absolute top-4 right-4">
                                <span className="flex h-3 w-3">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${agent.id === 'retention' ? 'bg-blue-400' : agent.id === 'revenue' ? 'bg-green-400' : agent.id === 'lead-qualifier' ? 'bg-cyan-400' : 'bg-amber-400'}`}></span>
                                  <span className={`relative inline-flex rounded-full h-3 w-3 ${agent.id === 'retention' ? 'bg-blue-500' : agent.id === 'revenue' ? 'bg-green-500' : agent.id === 'lead-qualifier' ? 'bg-cyan-500' : 'bg-amber-500'}`}></span>
                                </span>
                            </div>
                        )}
                        
                        <div className="flex items-center mb-5">
                            <div className={`p-3.5 rounded-2xl mr-4 shadow-lg ${agent.color}`}>
                                {agent.icon}
                            </div>
                            <div>
                                <h3 className="font-black text-white uppercase italic tracking-tight leading-none mb-1.5">{agent.name}</h3>
                                <div className="flex items-center gap-2">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${agent.isActive ? 'text-green-500' : 'text-gray-500'}`}>
                                        {agent.isActive ? 'Sync Active' : 'Offline'}
                                    </p>
                                    {agent.isActive && !agent.isOnline && (
                                        <span className="text-[9px] bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded animate-pulse border border-red-500/20">RETRY_LINK</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-6 h-12 leading-relaxed italic">"{agent.description}"</p>
                        
                        <div className="flex items-center justify-between border-t border-white/5 pt-4">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{agent.stats.label}</p>
                                <p className="text-2xl font-black text-white italic">{agent.stats.value}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleRunAnalysis(agent.id)}
                                    disabled={processingAgent === agent.id || !agent.isActive || !agent.isOnline}
                                    className={`p-2.5 rounded-xl border transition-all ${processingAgent === agent.id ? 'bg-amber-500 text-black shadow-lg animate-spin' : 'bg-gray-800 text-gray-400 border-white/5 hover:border-amber-500 hover:text-white'} disabled:opacity-20`}
                                    title="Manual Analysis"
                                >
                                    {processingAgent === agent.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <SparkleIcon className="w-5 h-5" />}
                                </button>
                                <label className="inline-flex relative items-center cursor-pointer">
                                    <input type="checkbox" checked={agent.isActive} onChange={() => toggleAgent(agent.id)} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-gray-800 border border-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black"></div>
                                </label>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="bg-black/40 border-white/5 rounded-[2.5rem] p-0 overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-gray-900/40 flex justify-between items-center">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Activity className="w-4 h-4 text-cyan-400" /> Live Logic Trace
                    </h3>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 bg-red-500/50 rounded-full"></span>
                        <span className="w-2 h-2 bg-amber-500/50 rounded-full"></span>
                        <span className="w-2 h-2 bg-green-500/50 rounded-full"></span>
                    </div>
                </div>
                <div className="p-6 bg-[#020202]">
                    <div className="bg-black/60 rounded-3xl p-6 font-mono text-xs max-h-[350px] overflow-y-auto border border-white/5 space-y-3 custom-scrollbar shadow-inner">
                        {logs.length === 0 && <p className="text-gray-600 text-center py-10 italic uppercase tracking-[0.4em]">Awaiting Agent Telemetry...</p>}
                        {logs.map(log => (
                            <div key={log.id} className={`flex items-start gap-4 border-l-2 pl-4 py-2 hover:bg-white/5 transition-all rounded-r-xl animate-fade-in ${
                                log.status === 'Failed' ? 'border-red-500 bg-red-900/10' : 
                                log.status === 'Recovering' ? 'border-yellow-500 bg-yellow-900/10' : 
                                'border-gray-800'
                            }`}>
                                <span className="text-gray-600 font-bold whitespace-nowrap">[{log.timestamp}]</span>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`font-black uppercase tracking-tighter ${
                                            log.agent === 'Lead Qualification Bot' ? 'text-cyan-400' :
                                            log.agent === 'Retention Guard' ? 'text-blue-400' : 
                                            log.agent === 'Revenue Optimizer' ? 'text-green-400' : 'text-amber-400'
                                        }`}>{log.agent}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.status === 'Failed' ? 'text-red-400 border border-red-500/20' : 'text-gray-500 border border-white/5'}`}>{log.action}</span>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed italic">"{log.details}"</p>
                                </div>
                                {log.status === 'Success' && <CheckCircleIcon className="w-4 h-4 text-green-500 mt-1" />}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-8 py-4 bg-gray-900/40 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                        <AutoUpdateIcon className="w-3 h-3 animate-spin-slow" /> LOGS_LIVE_STREAMING_ACTIVE
                    </p>
                    <p className="text-[10px] text-cyan-500 font-mono font-bold">KRNL: v21.0.0-PRO</p>
                </div>
            </Card>
        </div>
    );
};

export default SmartAutomationCenter;
