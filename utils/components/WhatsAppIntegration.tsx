
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS } from '../../constants'; 
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BotIcon } from './icons/BotIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { LockIcon } from './icons/LockIcon';
import { OpenSourceIcon } from './icons/OpenSourceIcon';
import { 
    Zap, Activity, Shield, Globe, Cpu, 
    MessageSquare, Power, Send,
    Radio, FileText, Users, Clock, Edit3, Trash2, Plus,
    BarChart3, RefreshCw, Network, BrainCircuit, Scan, Wifi, Server
} from 'lucide-react';
import { getComplexResponse } from '../../lib/gemini';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';
import Modal from './common/Modal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// --- TYPES ---
type Tab = 'live_console' | 'broadcast' | 'templates' | 'autonomous_agents' | 'neural_config' | 'local_host';
type AIModel = 'Health Assistant' | 'General Chat' | 'Social Trends' | 'Logic Bot' | 'Research Bot';
type HostingMode = 'Cloud API' | 'Private Server' | 'Secure Container';

interface AgentTask {
    id: string;
    agent: 'Task Runner' | 'Goal Seeker' | 'Retention Guard' | 'Revenue Bot';
    goal: string;
    status: 'Thinking' | 'Executing' | 'Completed' | 'Waiting';
    logs: string[];
    efficiency: number;
}

interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
}

interface BroadcastLog {
    id: number;
    message: string;
    audience: string;
    count: number;
    date: string;
}

// Mock Sentiment Data for Radar
const SENTIMENT_DATA = [
    { subject: 'Urgency', A: 80, fullMark: 100 },
    { subject: 'Positivity', A: 65, fullMark: 100 },
    { subject: 'Queries', A: 90, fullMark: 100 },
    { subject: 'Complaints', A: 20, fullMark: 100 },
    { subject: 'Sales', A: 70, fullMark: 100 },
];

const WhatsAppIntegration: React.FC = () => {
    const { addToast } = useToast();
    const { automationEvents } = useData(); // Hook into global events
    const [activeTab, setActiveTab] = useState<Tab>('live_console');
    const [selectedModel, setSelectedModel] = useState<AIModel>('Logic Bot');
    const [hostingMode, setHostingMode] = useState<HostingMode>('Cloud API');
    
    // Live Console State
    const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
    const [incomingMsg, setIncomingMsg] = useState<any>(null);
    const [isBotActive, setIsBotActive] = useState(true);
    const [manualInput, setManualInput] = useState('');
    const [isManualProcessing, setIsManualProcessing] = useState(false);
    
    // Broadcast State
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState<'All' | 'Active' | 'Expired'>('All');
    const [broadcastHistory, setBroadcastHistory] = useState<BroadcastLog[]>([]);
    const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

    // Template State
    const [templates, setTemplates] = useState<MessageTemplate[]>([
        { id: 't1', name: 'Welcome', content: "Welcome to Royal The Gym! Let's crush your goals.", category: 'Onboarding' },
        { id: 't2', name: 'Fee Reminder', content: "Gentle reminder: Your gym fee is due. Pay here: {{link}}", category: 'Payment' },
        { id: 't3', name: 'Offer', content: "Flash Sale! 20% off on annual plans today.", category: 'Marketing' }
    ]);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: '', content: '' });

    // Autonomous Agents State (Swarm)
    const [activeTasks, setActiveTasks] = useState<AgentTask[]>([
        { 
            id: 't1', 
            agent: 'Goal Seeker', 
            goal: 'Recover 5 expired memberships via discount negotiation', 
            status: 'Executing', 
            logs: ['Analyzed 5 profiles', 'Drafted personalized offers', 'Sent message to Rahul...'],
            efficiency: 92
        },
        { 
            id: 't2', 
            agent: 'Retention Guard', 
            goal: 'Monitor attendance drop-offs', 
            status: 'Thinking', 
            logs: ['Scanning gate logs...', 'Identified 3 at-risk members...'],
            efficiency: 88
        }
    ]);

    // Local Hosting Stats
    const [gpuLoad, setGpuLoad] = useState(0);
    const [memoryUsage, setMemoryUsage] = useState(0);
    
    // Live Traffic Graph Data
    const [trafficData, setTrafficData] = useState<{time: string, msg: number}[]>([]);

    const terminalRef = useRef<HTMLDivElement>(null);

    // --- REAL-TIME EVENT LISTENING ---
    // automationEvents is already destructured from useData() above

    // Sync global events to console logs
    useEffect(() => {
        if (automationEvents.length > 0) {
            const latestEvent = automationEvents[0];
            // Avoid duplicate logs if possible, or just prepend
            setConsoleLogs(prev => [latestEvent, ...prev].slice(0, 50));
        }
    }, [automationEvents]);

    // Local Resource Monitor (Real-ish)
    useEffect(() => {
        if (hostingMode !== 'Cloud API') {
            const interval = setInterval(() => {
                // Simulate some fluctuation based on "real" load (length of logs)
                const load = Math.min(100, 20 + (consoleLogs.length % 10) * 5);
                setGpuLoad(load); 
                setMemoryUsage(4096 + (consoleLogs.length * 10)); 
            }, 2000);
            return () => clearInterval(interval);
        } else {
            setGpuLoad(0);
            setMemoryUsage(0);
        }
    }, [hostingMode, consoleLogs]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [consoleLogs]);

    // --- LOGIC ---

    // This function calls the REAL AI - Used ONLY for manual interaction
    const executeRealBotResponse = async (user: string, text: string, model: AIModel) => {
        const time = new Date().toLocaleTimeString();
        
        setConsoleLogs(prev => [`[${time}] 📥 MANUAL INPUT (${user}): "${text}"`, ...prev].slice(0, 50));
        setIncomingMsg({ user, text, model, status: 'thinking' });

        let thoughtProcess = "";
        if (model === 'Logic Bot') thoughtProcess = "Logic Core: Analyzing intent... checking pricing DB...";
        else if (model === 'Social Trends') thoughtProcess = "Trend Scanner: Checking viral context...";
        else thoughtProcess = `${model}: Processing natural language vector...`;

        setConsoleLogs(prev => [`[${time}] 🧠 ${thoughtProcess}`, ...prev].slice(0, 50));
        setIncomingMsg(prev => ({ ...prev, status: 'typing' }));

        // Real API Call happens ONLY here
        let reply = "";
        try {
            const prompt = `
                Act as the official AI Support Agent for "Royal The Gym".
                User Name: ${user}
                User Query: "${text}"
                Current AI Model: ${model}
                
                Context:
                - Gym Name: Royal The Gym
                - Location: Jhunjhunu
                - Pricing: 1200/mo, 3000/qtr, 9000/yr.
                - Open: 5 AM - 10 PM.
                
                Task: Write a short, professional, and helpful response (max 20 words).
            `;
            reply = await getComplexResponse(prompt);
        } catch (e) {
            reply = "Neural Link Interrupted. Switching to manual support.";
        }

        setConsoleLogs(prev => [`[${time}] 📤 SENT: ${reply}`, ...prev].slice(0, 50));
        setIncomingMsg(null);
    };

    const handleManualMessage = async () => {
        if (!manualInput.trim()) return;
        setIsManualProcessing(true);
        const text = manualInput;
        setManualInput('');
        await executeRealBotResponse("Admin Override", text, selectedModel);
        setIsManualProcessing(false);
    };

    const handleBroadcastSend = () => {
        if (!broadcastMessage.trim()) {
            addToast("Message content is empty.", "error");
            return;
        }
        setIsSendingBroadcast(true);
        setTimeout(() => {
            const recipientCount = targetAudience === 'All' ? INITIAL_MEMBERS.length : Math.floor(INITIAL_MEMBERS.length / 2);
            setBroadcastHistory(prev => [{
                id: Date.now(),
                message: broadcastMessage,
                audience: targetAudience,
                count: recipientCount,
                date: new Date().toLocaleTimeString()
            }, ...prev]);
            
            setBroadcastMessage('');
            setIsSendingBroadcast(false);
            addToast(`Quantum Broadcast Sent to ${recipientCount} Nodes.`, "success");
        }, 2000);
    };

    const handleSaveTemplate = () => {
        if (newTemplate.name && newTemplate.content) {
            setTemplates(prev => [...prev, { id: `t${Date.now()}`, name: newTemplate.name, content: newTemplate.content, category: 'Custom' }]);
            setNewTemplate({ name: '', content: '' });
            setIsTemplateModalOpen(false);
            addToast("Template Encoded to Matrix.", "success");
        }
    };

    // --- RENDERERS ---

    const renderBroadcastTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Quantum Broadcast" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Radio className="w-40 h-40 text-green-500" /></div>
                    <div className="space-y-6 relative z-10">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Target Audience</label>
                            <div className="flex bg-black rounded-xl p-1 border border-white/10">
                                {['All', 'Active', 'Expired'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setTargetAudience(t as any)}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${targetAudience === t ? 'bg-green-600 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Transmission Content</label>
                            <textarea 
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-green-500 outline-none h-40 resize-none font-medium"
                                placeholder="Type your message here... Use {{name}} for dynamic insertion."
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-gray-600 uppercase font-black">Estimated Reach: {targetAudience === 'All' ? INITIAL_MEMBERS.length : Math.floor(INITIAL_MEMBERS.length/2)} Nodes</span>
                                <button onClick={() => setBroadcastMessage(prev => prev + " {{name}}")} className="text-[10px] bg-gray-800 px-2 py-1 rounded text-cyan-400 hover:text-white transition-colors">+ Add Name Variable</button>
                            </div>
                        </div>

                        <button 
                            onClick={handleBroadcastSend}
                            disabled={isSendingBroadcast}
                            className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isSendingBroadcast ? <RefreshCw className="animate-spin w-4 h-4"/> : <Send className="w-4 h-4" />}
                            {isSendingBroadcast ? 'Broadcasting...' : 'Initiate Quantum Broadcast'}
                        </button>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card title="Transmission Log" className="bg-[#0c0c0c] border-white/5 h-full flex flex-col p-6 rounded-[3rem]">
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        {broadcastHistory.length === 0 && <p className="text-gray-600 text-center py-10 italic text-xs">No recent transmissions.</p>}
                        {broadcastHistory.map(log => (
                            <div key={log.id} className="bg-gray-900/50 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-green-500 uppercase bg-green-900/20 px-2 py-0.5 rounded border border-green-500/20">Sent</span>
                                    <span className="text-[10px] text-gray-500 font-mono">{log.date}</span>
                                </div>
                                <p className="text-xs text-gray-300 line-clamp-2 italic">"{log.message}"</p>
                                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                                    <span>Target: {log.audience}</span>
                                    <span>Count: {log.count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );

    const renderTemplatesTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                    <div key={t.id} className="bg-gray-900 border border-white/5 p-6 rounded-[2.5rem] group hover:border-green-500/30 transition-all cursor-pointer" onClick={() => setBroadcastMessage(t.content)}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-black rounded-xl text-green-500 border border-white/5">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-colors"><Edit3 className="w-3 h-3"/></button>
                                <button className="p-2 hover:bg-red-900/20 rounded-full text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3"/></button>
                            </div>
                        </div>
                        <h4 className="text-lg font-black text-white uppercase italic tracking-tight">{t.name}</h4>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded mb-3 inline-block">{t.category}</span>
                        <p className="text-xs text-gray-400 line-clamp-3 font-mono leading-relaxed">"{t.content}"</p>
                    </div>
                ))}
                
                <button 
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="border-2 border-dashed border-gray-800 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-gray-600 hover:text-green-500 hover:border-green-500/50 hover:bg-green-900/5 transition-all group min-h-[200px]"
                >
                    <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Encode Template</span>
                </button>
            </div>
        </div>
    );

    const renderNeuralConfig = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
            <Card title="Select Intelligence Model (Brain)" className="border-t-4 border-indigo-500 bg-black/40">
                <div className="space-y-3">
                    {[
                        { id: 'Logic Bot', desc: 'Best for Pricing & Negotiation', icon: <BotIcon/>, color: 'text-purple-400' },
                        { id: 'Social Trends', desc: 'Best for Witty Engagement', icon: <SparkleIcon/>, color: 'text-white' },
                        { id: 'Research Bot', desc: 'Best for Fact-Checking', icon: <Globe/>, color: 'text-cyan-400' },
                        { id: 'General Chat', desc: 'Best for General Conversation', icon: <OpenSourceIcon/>, color: 'text-green-400' },
                        { id: 'Health Assistant', desc: 'Best for Image/Video Analysis', icon: <Zap/>, color: 'text-blue-400' },
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setSelectedModel(m.id as AIModel)}
                            className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${
                                selectedModel === m.id 
                                ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                                : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-black/50 ${m.color}`}>{m.icon}</div>
                                <div className="text-left">
                                    <p className={`font-bold ${selectedModel === m.id ? 'text-white' : 'text-gray-300'}`}>{m.id}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{m.desc}</p>
                                </div>
                            </div>
                            {selectedModel === m.id && <CheckCircleIcon className="w-5 h-5 text-indigo-400" />}
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="Hosting Infrastructure (Body)" className="border-t-4 border-green-500 bg-black/40">
                <div className="space-y-4">
                    <div 
                        onClick={() => setHostingMode('Cloud API')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${hostingMode === 'Cloud API' ? 'bg-blue-900/20 border-blue-500' : 'bg-gray-800 border-gray-700'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-400" />
                                <span className="font-bold text-white">Cloud API (Standard)</span>
                            </div>
                            {hostingMode === 'Cloud API' && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-gray-400">High speed. Requires internet. Data sent to provider.</p>
                    </div>

                    <div 
                        onClick={() => setHostingMode('Private Server')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${hostingMode === 'Private Server' ? 'bg-green-900/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-gray-800 border-gray-700'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <LockIcon className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-white">Private Server (Privacy Mode)</span>
                            </div>
                            {hostingMode === 'Private Server' && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-black">SECURE</span>}
                        </div>
                        <p className="text-xs text-gray-400">Runs offline on Gym PC. 100% Data Privacy. Zero Latency.</p>
                        
                        {hostingMode.includes('Private') && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="bg-black/50 p-2 rounded border border-green-500/30">
                                    <p className="text-[10px] text-green-500">GPU LOAD</p>
                                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-1">
                                        <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${gpuLoad}%` }}></div>
                                    </div>
                                </div>
                                <div className="bg-black/50 p-2 rounded border border-green-500/30">
                                    <p className="text-[10px] text-green-500">VRAM USAGE</p>
                                    <p className="text-xs font-mono text-white">{memoryUsage} MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderAutonomousAgents = () => (
        <div className="space-y-6 animate-slide-up">
            <div className="flex justify-between items-center bg-gray-900 p-6 rounded-[2rem] border border-pink-500/30">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <BotIcon className="w-6 h-6 text-pink-500" />
                        Autonomous Agent Swarm
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Independent AI units monitoring gym health 24/7.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTasks.map((task) => (
                    <div key={task.id} className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                        {task.status === 'Executing' && (
                            <div className="absolute top-0 left-0 w-1 h-full bg-pink-500 animate-pulse"></div>
                        )}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-black uppercase px-2 py-1 rounded ${task.agent === 'Goal Seeker' ? 'bg-purple-900/50 text-purple-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                        {task.agent}
                                    </span>
                                    <h4 className="font-bold text-white truncate max-w-[150px]">{task.goal}</h4>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 font-mono">ID: {task.id}</p>
                            </div>
                            <span className={`text-xs font-bold ${task.status === 'Executing' ? 'text-pink-400 animate-pulse' : 'text-green-400'}`}>
                                {task.status.toUpperCase()}
                            </span>
                        </div>
                        
                        <div className="bg-gray-900 p-3 rounded-lg border border-gray-800 font-mono text-xs text-gray-400 h-24 overflow-y-auto custom-scrollbar">
                            {task.logs.map((log, i) => (
                                <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0">
                                    <span className="text-pink-500 mr-2">{'>'}</span>{log}
                                </div>
                            ))}
                            {task.status === 'Executing' && <span className="animate-pulse">_</span>}
                        </div>
                        
                        <div className="mt-4 flex items-center gap-3">
                             <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-pink-500" style={{width: `${task.efficiency}%`}}></div>
                             </div>
                             <span className="text-[10px] font-black text-pink-400">{task.efficiency}% EFFICIENCY</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderLiveConsole = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[650px] animate-slide-up">
            <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Visualizer / Status */}
                <div className="bg-black rounded-[3rem] border border-white/10 p-8 flex items-center justify-between relative overflow-hidden h-40 shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    
                    <div className="relative z-10 flex items-center gap-6">
                        {incomingMsg ? (
                             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 animate-pulse">
                                 <WhatsAppIcon className="w-8 h-8 text-green-500" />
                             </div>
                        ) : (
                             <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center border border-white/10">
                                 <BotIcon className="w-8 h-8 text-gray-600" />
                             </div>
                        )}
                        <div>
                            <h3 className="text-white font-bold text-lg">{incomingMsg ? incomingMsg.user : "System Idle"}</h3>
                            <p className="text-gray-400 text-sm italic truncate max-w-xs">{incomingMsg ? `"${incomingMsg.text}"` : "Waiting for neural signals..."}</p>
                            {incomingMsg && (
                                <div className="mt-2 flex items-center gap-2">
                                    <SparkleIcon className="w-3 h-3 text-purple-400 animate-spin" />
                                    <span className="text-purple-400 text-[10px] font-mono uppercase tracking-widest">
                                        {selectedModel} Processing...
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="relative z-10 text-right">
                         <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Queue Load</p>
                         <p className="text-3xl font-black text-white italic">{incomingMsg ? '1' : '0'}</p>
                    </div>
                </div>

                {/* Console Log */}
                <Card title="Neural Communication Log" className="flex-1 bg-[#0c0c0c] border-gray-800 font-mono text-xs overflow-hidden flex flex-col rounded-[2.5rem]">
                    <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar bg-black/40 rounded-xl m-2">
                        {consoleLogs.map((log, i) => (
                            <div key={i} className="border-b border-gray-800 pb-1 break-all">
                                <span className={log.includes('INCOMING') ? 'text-blue-400' : log.includes('THINKING') ? 'text-purple-400' : log.includes('SENT') ? 'text-green-400' : 'text-gray-500'}>
                                    {log}
                                </span>
                            </div>
                        ))}
                    </div>
                    {/* Manual Input */}
                    <div className="mt-2 flex gap-2 border-t border-white/5 pt-4">
                         <input 
                            type="text" 
                            className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
                            placeholder="Simulate user message..."
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleManualMessage()}
                            disabled={isManualProcessing}
                        />
                        <button 
                            onClick={handleManualMessage}
                            disabled={isManualProcessing || !manualInput}
                            className="bg-green-600 text-black font-bold px-6 py-3 rounded-xl hover:bg-green-500 disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-4">
                {/* Sentiment Radar */}
                <Card title="Live Sentiment Pulse" className="bg-gray-950 border-white/5 rounded-[2.5rem] h-64">
                    <div className="h-full w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={SENTIMENT_DATA}>
                                <PolarGrid stroke="#333" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                <Radar name="Sentiment" dataKey="A" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.4} />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="bg-gradient-to-br from-green-900/20 to-black border-green-500/30 rounded-[2.5rem]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-full ${isBotActive ? 'bg-green-500' : 'bg-red-500'}`}>
                            <Power className="w-6 h-6 text-black" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">System Status</h3>
                            <p className="text-xs text-gray-400">{isBotActive ? 'ACTIVE' : 'SHUTDOWN'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsBotActive(!isBotActive)}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest ${isBotActive ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-green-600 text-white hover:bg-green-500'}`}
                    >
                        {isBotActive ? 'Terminate Uplink' : 'Initialize System'}
                    </button>
                </Card>
                
                {/* Live Traffic Mini Graph */}
                <div className="bg-black/60 border border-white/10 rounded-[2.5rem] p-4 h-32 flex flex-col justify-end overflow-hidden relative">
                    <p className="absolute top-4 left-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">Traffic Load</p>
                    <ResponsiveContainer width="100%" height="60%">
                        <AreaChart data={trafficData}>
                             <defs>
                                <linearGradient id="trafficColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="msg" stroke="#8b5cf6" fill="url(#trafficColor)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#020308] p-10 rounded-[3rem] border border-green-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(34,197,94,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-green-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(34,197,94,0.5)] border border-green-400 group-hover:rotate-12 transition-transform duration-700">
                             <WhatsAppIcon className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-green-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                    Echo Comms v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYSTEM: ONLINE</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Sync</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => setActiveTab('live_console')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'live_console' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <TerminalIcon className="w-4 h-4" /> Live Console
                        </button>
                        <button onClick={() => setActiveTab('broadcast')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'broadcast' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <Radio className="w-4 h-4" /> Quantum Broadcast
                        </button>
                        <button onClick={() => setActiveTab('templates')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'templates' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <FileText className="w-4 h-4" /> Template Matrix
                        </button>
                        <button onClick={() => setActiveTab('autonomous_agents')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'autonomous_agents' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <BotIcon className="w-4 h-4" /> Agent Swarm
                        </button>
                        <button onClick={() => setActiveTab('neural_config')} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'neural_config' ? 'bg-green-500 text-black shadow-2xl' : 'text-gray-500 hover:text-white'}`}>
                            <Cpu className="w-4 h-4" /> Neural Config
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[600px]">
                {activeTab === 'live_console' && renderLiveConsole()}
                {activeTab === 'broadcast' && renderBroadcastTab()}
                {activeTab === 'templates' && renderTemplatesTab()}
                {activeTab === 'neural_config' && renderNeuralConfig()}
                {activeTab === 'autonomous_agents' && renderAutonomousAgents()}
                {activeTab === 'local_host' && (
                    <div className="flex flex-col items-center justify-center h-[500px] bg-black/40 rounded-3xl border border-white/5">
                        <Server className="w-24 h-24 text-gray-700 mb-6" />
                        <h3 className="text-2xl font-black text-white uppercase italic">Local Host Diagnostics</h3>
                        <p className="text-gray-500 mt-2">API Endpoint: <span className="text-green-400 font-mono">http://localhost:1337/v1</span></p>
                        <p className="text-gray-500">Container Status: <span className="text-green-400 font-mono">Running (ID: 8f2a1...)</span></p>
                    </div>
                )}
            </div>
            
            {/* Template Modal */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Create Template">
                <div className="space-y-4">
                    <input type="text" placeholder="Template Name" className="w-full bg-gray-700 rounded p-2 text-white" value={newTemplate.name || ''} onChange={e => setNewTemplate({...newTemplate, name: e.target.value})} />
                    <textarea placeholder="Content (use {{variable}})" className="w-full bg-gray-700 rounded p-2 text-white h-24" value={newTemplate.content || ''} onChange={e => setNewTemplate({...newTemplate, content: e.target.value})} />
                    <button onClick={handleSaveTemplate} className="bg-amber-500 text-black font-bold py-2 px-4 rounded w-full">Save Template</button>
                </div>
            </Modal>
        </div>
    );
};

export default WhatsAppIntegration;
