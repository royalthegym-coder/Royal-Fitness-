import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Brain,
    Code2,
    Globe,
    FileSpreadsheet,
    Bot,
    Sparkles,
    Workflow,
    Zap,
    Activity,
    Fingerprint,
    Terminal,
    Play,
    CheckCircle2,
    ShieldCheck,
    RefreshCw
} from 'lucide-react';
import { SmartTerminal } from './admin/SmartTerminal';

const AGENTS = [
    {
        id: 'antigravity',
        name: 'Google Antigravity Agent & CLI',
        type: 'Autonomous Developer & Root CLI Agent',
        description: 'Full-stack autonomous agent (antigravity-preview-09-2026) with LEVEL-5 root access to all 3 Portals, Firestore DB, and CI/CD.',
        icon: Code2,
        color: 'from-emerald-400 to-teal-500',
        status: 'active',
        capabilities: ['Full App Root Access', 'Antigravity CLI', 'Firestore Read/Write', '3-Tier Portal Control']
    },
    {
        id: 'gemini-pro',
        name: 'Gemini 3.8 Pro',
        type: 'Core Intelligence',
        description: 'Flagship model for complex reasoning and multi-step autonomous tasks.',
        icon: Brain,
        color: 'from-blue-500 to-indigo-600',
        status: 'active',
        capabilities: ['Deep Reasoning', 'Code Generation', 'Complex Logic']
    },
    {
        id: 'gemini-flash',
        name: 'Gemini 3.8 Flash & Lite',
        type: 'Core Engine',
        description: 'High-speed models for real-time automation and data reasoning.',
        icon: Zap,
        color: 'from-amber-400 to-orange-500',
        status: 'active',
        capabilities: ['Real-time Analysis', 'High-speed Automation', 'Low Latency']
    },
    {
        id: 'jules',
        name: 'Jules (AI Coding Agent)',
        type: 'Repository Assistant',
        description: 'Works directly in your project repository to find bugs, automate PRs, and refactor.',
        icon: Fingerprint,
        color: 'from-purple-500 to-pink-500',
        status: 'active',
        capabilities: ['Bug Tracking', 'PR Automation', 'Refactoring']
    },
    {
        id: 'workspace-studio',
        name: 'Workspace Studio',
        type: 'Enterprise Automation',
        description: 'No-code agent builder for Gmail, Docs, Sheets, and Drive automation.',
        icon: FileSpreadsheet,
        color: 'from-blue-400 to-cyan-500',
        status: 'syncing',
        capabilities: ['Gmail Sync', 'Sheets Automation', 'Drive Management']
    },
    {
        id: 'mariner',
        name: 'Project Mariner',
        type: 'Web Browsing Agent',
        description: 'Autonomous agent that browses the web to generate enterprise reports.',
        icon: Globe,
        color: 'from-rose-400 to-red-500',
        status: 'active',
        capabilities: ['Market Research', 'Data Scraping', 'Report Generation']
    },
    {
        id: 'notebooklm',
        name: 'NotebookLM',
        type: 'Research & Audio Agent',
        description: 'Instantly generates audio podcasts, notes, and summaries from PDFs and docs.',
        icon: Activity,
        color: 'from-violet-500 to-purple-600',
        status: 'active',
        capabilities: ['Podcast Generation', 'Doc Summarization', 'Knowledge Base']
    },
    {
        id: 'stitch',
        name: 'Google Stitch & AI Studio',
        type: 'UI/UX Generation',
        description: 'Converts text prompts directly into React/HTML UI components.',
        icon: Sparkles,
        color: 'from-green-400 to-emerald-600',
        status: 'active',
        capabilities: ['UI Generation', 'Design Systems', 'Rapid Prototyping']
    }
];

export const GoogleAgentsHub: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<string | null>('antigravity');
    const [showCliConsole, setShowCliConsole] = useState<boolean>(true);
    const [agentTaskInput, setAgentTaskInput] = useState<string>('');
    const [agentRunning, setAgentRunning] = useState<boolean>(false);
    const [agentOutput, setAgentOutput] = useState<string | null>(null);

    const handleDispatchAgentTask = async (taskPrompt?: string) => {
        const promptToRun = taskPrompt || agentTaskInput || 'Verify system health across Member Portal, Admin Portal, and Cloud Sync';
        setAgentRunning(true);
        try {
            const res = await fetch('/api/antigravity/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    command: 'agent',
                    args: [promptToRun]
                })
            });
            const data = await res.json();
            setAgentOutput(
                typeof data.output === 'string'
                    ? data.output
                    : JSON.stringify(data.output || data, null, 2)
            );
        } catch (err: any) {
            setAgentOutput(`Error: ${err?.message || 'Failed to dispatch task'}`);
        } finally {
            setAgentRunning(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <Bot className="w-8 h-8 text-blue-500" />
                        Fitness Future Operations & Command Hub
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                        Verified owner operations bridge connected directly to Fitness Future Cloud Sync and branch automation pipelines.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCliConsole(!showCliConsole)}
                        className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-widest cursor-pointer transition-all"
                    >
                        <Terminal className="w-4 h-4" />
                        {showCliConsole ? 'Hide Owner Console' : 'Open Owner Console'}
                    </button>
                    <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                        <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">A2A Protocol Active</span>
                    </div>
                </div>
            </div>

            {/* Antigravity Agent Direct Task Dispatcher */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/30 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40">
                            <Code2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-white uppercase tracking-wide">
                                    Antigravity Agent Live Task Runner
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                                    FULL ROOT ACCESS
                                </span>
                            </div>
                            <p className="text-xs text-slate-300">
                                Execute natural language or administrative directives across Member Portal, Admin Portal & Super Admin Panel
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span>DB: ai-studio-4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={agentTaskInput}
                        onChange={e => setAgentTaskInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !agentRunning) handleDispatchAgentTask();
                        }}
                        placeholder="Enter directive for Antigravity Agent (e.g., Check all 3 portals status and unlock any expired accounts)..."
                        className="flex-1 bg-slate-950 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-xs md:text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                    <button
                        onClick={() => handleDispatchAgentTask()}
                        disabled={agentRunning}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {agentRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        {agentRunning ? 'Running...' : 'Execute Directive'}
                    </button>
                </div>

                {agentOutput && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 font-mono text-xs text-emerald-300 whitespace-pre-wrap">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                            <CheckCircle2 className="w-4 h-4" /> Antigravity Agent Response:
                        </div>
                        {agentOutput}
                    </div>
                )}
            </div>

            {/* Embedded Interactive Antigravity CLI Root Console */}
            {showCliConsole && (
                <div className="pt-2">
                    <SmartTerminal />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                    {AGENTS.map((agent, idx) => (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group
                                ${selectedAgent === agent.id 
                                    ? 'bg-white/10 border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                                    : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${agent.color}`}></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${agent.color} bg-opacity-20 backdrop-blur-md`}>
                                    <agent.icon className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                                <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
                                    ${agent.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                                      agent.status === 'syncing' ? 'bg-blue-500/20 text-blue-400 animate-pulse' : 
                                      'bg-gray-500/20 text-gray-400'}`}>
                                    {agent.status}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
                            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">{agent.type}</p>
                            
                            <AnimatePresence>
                                {selectedAgent === agent.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-sm text-gray-300 mb-4">{agent.description}</p>
                                        <div className="space-y-2">
                                            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Capabilities</span>
                                            <div className="flex flex-wrap gap-2">
                                                {agent.capabilities.map((cap, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-gray-300">
                                                        {cap}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                setShowCliConsole(true);
                                                handleDispatchAgentTask(`Activate ${agent.name} and report readiness.`);
                                            }}
                                            className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <Workflow className="w-4 h-4" /> Launch in Antigravity CLI
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
