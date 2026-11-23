import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Cpu, MessageCircle, Star, ArrowRight, CheckCircle2, 
    Zap, Bot, Globe, Server, Activity, AlertCircle
} from 'lucide-react';
import { useGym } from '../context/GymProvider';

interface AutomationLog {
    id: string;
    timestamp: string;
    gymId: string;
    workflow: string;
    action: string;
    status: 'pending' | 'success' | 'failed';
    details?: any;
}

const OpalsAutomationHub: React.FC = () => {
    const { currentGym } = useGym();
    const [reviewLink, setReviewLink] = useState('');
    const [logs, setLogs] = useState<AutomationLog[]>([]);
    
    // Load config
    useEffect(() => {
        const link = localStorage.getItem(`opal_review_link_${currentGym.gymId}`) || '';
        setReviewLink(link);
    }, [currentGym.gymId]);

    // Poll for logs every 2 seconds
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('http://localhost:3000/api/opals/logs');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.logs) {
                        setLogs(data.logs.filter((l: any) => l.gymId === currentGym.gymId));
                    }
                }
            } catch (err) {
                console.error("Failed to fetch opal logs", err);
            }
        };
        fetchLogs();
        const interval = setInterval(fetchLogs, 2500);
        return () => clearInterval(interval);
    }, [currentGym.gymId]);

    const handleSaveConfig = () => {
        localStorage.setItem(`opal_review_link_${currentGym.gymId}`, reviewLink);
        // Dispatch test event
        fetch('http://localhost:3000/api/opals/trigger-gmb', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reviewText: "Great gym! Love the equipment.",
                rating: 5,
                gymName: currentGym.gymName,
                gymId: currentGym.gymId
            })
        });
    };

    const nodes = [
        {
            id: 1,
            title: "N8N Webhook Listener",
            subtitle: "In-App Event Trigger",
            icon: <Activity className="w-6 h-6 text-fuchsia-400" />,
            color: "border-fuchsia-500/50 bg-fuchsia-500/10",
            details: "Detects App Events via Webhook"
        },
        {
            id: 2,
            title: "Google Opals Agent",
            subtitle: "Cognitive Opals Processor",
            icon: <Cpu className="w-6 h-6 text-cyan-400" />,
            color: "border-cyan-500/50 bg-cyan-500/10",
            details: "Constructs Contextual Payload & Sentiment"
        },
        {
            id: 3,
            title: "GitHub Actions Layer",
            subtitle: "WhatsApp / GMB Cloud Sync",
            icon: <Globe className="w-6 h-6 text-green-400" />,
            color: "border-green-500/50 bg-green-500/10",
            details: "Dispatches payload securely"
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6 relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-fuchsia-500/20 rounded-xl flex items-center justify-center border border-fuchsia-500/30">
                            <Bot className="w-6 h-6 text-fuchsia-400" />
                        </div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 uppercase tracking-widest">
                            Native Opals AI Engine
                        </h1>
                    </div>
                    <p className="text-sm font-medium text-gray-400 ml-1">
                        Fully integrated background automation powered by Google Opals, N8N, and GitHub Actions for WhatsApp Auto-Replies.
                    </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Engine Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Visual Architecture */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-[#111] border border-white/5 p-6 md:p-10 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                        
                        <h2 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-10 text-center relative z-10 flex justify-center items-center gap-2">
                            <Server className="w-4 h-4 text-cyan-400" /> Native Workflow Architecture
                        </h2>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-4xl mx-auto w-full">
                            {nodes.map((node, i) => (
                                <React.Fragment key={node.id}>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.15 }}
                                        className={`flex flex-col items-center flex-1 max-w-[200px] w-full bg-black/60 backdrop-blur-md border ${node.color} p-4 rounded-2xl relative group`}
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center mb-3">
                                            {node.icon}
                                        </div>
                                        <h3 className="text-xs font-bold text-white text-center uppercase tracking-wider mb-1">
                                            {node.title}
                                        </h3>
                                        <p className="text-[9px] text-gray-400 text-center uppercase tracking-widest mb-3 h-6">
                                            {node.subtitle}
                                        </p>
                                    </motion.div>

                                    {i < nodes.length - 1 && (
                                        <div className="hidden md:flex flex-shrink-0 mx-2 text-white/20">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: 40 }}
                                                className="h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent relative overflow-hidden"
                                            >
                                                <motion.div 
                                                    animate={{ left: ['-100%', '100%'] }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                                    className="absolute top-0 bottom-0 w-10 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                                                />
                                            </motion.div>
                                            <ArrowRight className="w-4 h-4 ml-1 relative top-[-7px]" />
                                        </div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Automation Configuration */}
                    <div className="bg-[#111] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-fuchsia-500/5 pointer-events-none"></div>
                        <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Zap className="w-4 h-4 text-fuchsia-400" /> Automation Variables Setup
                        </h2>
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                value={reviewLink}
                                onChange={(e) => setReviewLink(e.target.value)}
                                placeholder="Public Google Review Link" 
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                            />
                            <button 
                                onClick={handleSaveConfig}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] whitespace-nowrap"
                            >
                                Save & Test
                            </button>
                        </div>
                    </div>
                </div>

                {/* Live Activity Terminal */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col overflow-hidden h-[600px]">
                    <div className="p-4 bg-[#111] border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-400" /> Live Terminal
                        </h2>
                        <span className="text-[10px] text-gray-500 uppercase">Real-time</span>
                    </div>
                    
                    <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] space-y-3">
                        <AnimatePresence>
                            {logs.length === 0 ? (
                                <div className="text-gray-500 text-center mt-10">Awaiting workflow execution...</div>
                            ) : (
                                logs.map((log) => (
                                    <motion.div 
                                        key={log.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="border-l-2 pl-3 py-1 border-white/10 bg-white/[0.02]"
                                        style={{ 
                                            borderColor: log.status === 'success' ? '#4ade80' : 
                                                         log.status === 'pending' ? '#eab308' : '#ef4444' 
                                        }}
                                    >
                                        <div className="flex justify-between items-start text-gray-400 mb-1">
                                            <span className="text-[9px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            <span className="text-[9px] uppercase tracking-wider text-cyan-400">{log.workflow}</span>
                                        </div>
                                        <div className="text-white break-words">
                                            {log.status === 'pending' && <span className="text-yellow-400 mr-2">[~]</span>}
                                            {log.status === 'success' && <span className="text-green-400 mr-2">[+]</span>}
                                            {log.status === 'failed' && <span className="text-red-400 mr-2">[-]</span>}
                                            {log.action}
                                        </div>
                                        {log.details && (
                                            <div className="mt-1 text-gray-500 break-words">
                                                {JSON.stringify(log.details)}
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OpalsAutomationHub;
