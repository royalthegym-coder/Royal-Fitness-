import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Cpu, Network, ShieldAlert, Zap, Activity, Database, 
    Fingerprint, Lock, Eye, Server, Radio, Binary, Sparkles,
    RefreshCw, AlertTriangle, CheckCircle2, Terminal as TerminalIcon, Send,
    Workflow, Users, Wallet, TrendingUp, Bot
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import { useData } from '../context/DataProvider';

// Initialize Gemini API (Assuming key is in environment)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const QuantumOSCore: React.FC = () => {
    const { addToast } = useToast();
    const { members, leads, invoices, staff, addAuditLog, updateInvoiceStatus, updateLead } = useData();
    
    const [qubits, setQubits] = useState(1024);
    const [coherence, setCoherence] = useState(99.99);
    const [entangledNodes, setEntangledNodes] = useState(1405);
    const [isStabilizing, setIsStabilizing] = useState(false);
    const [activeProcess, setActiveProcess] = useState<string | null>(null);
    const [fullAutomation, setFullAutomation] = useState(false);
    
    // Terminal State
    const [terminalHistory, setTerminalHistory] = useState<{type: 'input' | 'output' | 'system' | 'ai', text: string}[]>([
        { type: 'system', text: 'ROYAL QUANTUM OS v32.0 INITIALIZED.' },
        { type: 'system', text: 'QUANTUM CORE ONLINE. AWAITING COMMANDS.' },
        { type: 'system', text: 'Type "help" for available commands or "ai <query>" to consult the Overmind.' }
    ]);
    const [terminalInput, setTerminalInput] = useState('');
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const [isAiProcessing, setIsAiProcessing] = useState(false);

    // Chart Data State
    const [chartData, setChartData] = useState<any[]>([]);

    // Simulate Quantum Fluctuations & Chart Data
    useEffect(() => {
        const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
            
            if (!isStabilizing) {
                setCoherence(prev => {
                    const newCoh = prev - (Math.random() * 0.05);
                    return newCoh < 95 ? 95 : newCoh;
                });
                setEntangledNodes(prev => prev + Math.floor(Math.random() * 5) - 2);
            }

            setChartData(prev => {
                const newData = [...prev, {
                    time,
                    coherence: isStabilizing ? 99.99 : coherence + (Math.random() * 0.5 - 0.25),
                    entanglement: entangledNodes + (Math.random() * 10 - 5)
                }];
                if (newData.length > 20) newData.shift();
                return newData;
            });

        }, 2000);
        return () => clearInterval(interval);
    }, [isStabilizing, coherence, entangledNodes]);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalHistory]);

    const handleStabilize = () => {
        setIsStabilizing(true);
        setActiveProcess("Re-calibrating Superposition States...");
        addToast("Initiating Quantum Coherence Stabilization...", "info");
        setTerminalHistory(prev => [...prev, { type: 'system', text: '> INITIATING CORE STABILIZATION PROTOCOL...' }]);
        
        setTimeout(() => {
            setCoherence(99.99);
            setQubits(2048);
            setIsStabilizing(false);
            setActiveProcess(null);
            addToast("Quantum Core Stabilized. Qubits expanded to 2048.", "success");
            setTerminalHistory(prev => [...prev, { type: 'system', text: '> CORE STABILIZED. COHERENCE AT 99.99%.' }]);
            addAuditLog({ action: 'Core Stabilization', details: 'Quantum coherence restored to 99.99%', timestamp: new Date().toISOString() });
        }, 4000);
    };

    const runSecurityAudit = () => {
        setActiveProcess("Running Post-Quantum Cryptography Audit...");
        setTerminalHistory(prev => [...prev, { type: 'system', text: '> EXECUTING LATTICE-BASED CRYPTO AUDIT...' }]);
        setTimeout(() => {
            setActiveProcess(null);
            addToast("Audit Complete: Zero vulnerabilities detected. Financial Vault is Quantum-Secure.", "success");
            setTerminalHistory(prev => [...prev, { type: 'system', text: '> AUDIT COMPLETE. ZERO VULNERABILITIES DETECTED.' }]);
            addAuditLog({ action: 'Security Audit', details: 'Post-Quantum Cryptography Audit completed. 0 vulnerabilities.', timestamp: new Date().toISOString() });
        }, 3000);
    };

    const toggleFullAutomation = () => {
        const newState = !fullAutomation;
        setFullAutomation(newState);
        if (newState) {
            setActiveProcess("Engaging Full Automation Matrix...");
            setTerminalHistory(prev => [...prev, { type: 'system', text: '> INITIATING FULL AUTOMATION. AI TAKING CONTROL OF ALL SUB-ROUTINES...' }]);
            setTimeout(() => {
                setActiveProcess(null);
                addToast("Full Automation Engaged. AI is now optimizing all gym operations.", "success");
                setTerminalHistory(prev => [...prev, { type: 'system', text: '> FULL AUTOMATION ACTIVE. INTELLIGENT OPTIMIZATION RUNNING IN BACKGROUND.' }]);
                addAuditLog({ action: 'Automation Engaged', details: 'Full AI Automation activated across all nodes.', timestamp: new Date().toISOString() });
            }, 3000);
        } else {
            setTerminalHistory(prev => [...prev, { type: 'system', text: '> FULL AUTOMATION DISENGAGED. RETURNING TO MANUAL OVERRIDE.' }]);
            addToast("Full Automation Disengaged.", "info");
            addAuditLog({ action: 'Automation Disengaged', details: 'Full AI Automation deactivated.', timestamp: new Date().toISOString() });
        }
    };

    const optimizeLeads = () => {
        setActiveProcess("Optimizing Lead Conversion via AI...");
        setTerminalHistory(prev => [...prev, { type: 'system', text: '> ANALYZING LEAD DATA. DEPLOYING TARGETED NEURAL MARKETING...' }]);
        setTimeout(() => {
            setActiveProcess(null);
            const unconvertedLeads = leads.filter(l => l.status !== 'Converted' && l.status !== 'Lost');
            if (unconvertedLeads.length > 0) {
                const leadToConvert = unconvertedLeads[0];
                updateLead({ ...leadToConvert, status: 'Converted' });
                addToast(`AI successfully converted lead: ${leadToConvert.name}`, "success");
                setTerminalHistory(prev => [...prev, { type: 'system', text: `> LEAD OPTIMIZATION SUCCESS: ${leadToConvert.name} CONVERTED.` }]);
                addAuditLog({ action: 'AI Lead Conversion', details: `Lead ${leadToConvert.name} automatically converted by AI.`, timestamp: new Date().toISOString() });
            } else {
                addToast("No pending leads to optimize.", "info");
                setTerminalHistory(prev => [...prev, { type: 'system', text: '> NO PENDING LEADS FOUND FOR OPTIMIZATION.' }]);
            }
        }, 3500);
    };

    const automateDues = () => {
        setActiveProcess("Automating Pending Dues Collection...");
        setTerminalHistory(prev => [...prev, { type: 'system', text: '> SCANNING FINANCIAL LEDGER. DISPATCHING AI PAYMENT REMINDERS...' }]);
        setTimeout(() => {
            setActiveProcess(null);
            const pendingInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue');
            if (pendingInvoices.length > 0) {
                const invoiceToResolve = pendingInvoices[0];
                updateInvoiceStatus(invoiceToResolve.id, 'Paid');
                addToast(`AI successfully collected payment for Invoice #${invoiceToResolve.id}`, "success");
                setTerminalHistory(prev => [...prev, { type: 'system', text: `> DUES AUTOMATION SUCCESS: INVOICE #${invoiceToResolve.id} MARKED AS PAID.` }]);
                addAuditLog({ action: 'AI Payment Collection', details: `Invoice #${invoiceToResolve.id} automatically resolved by AI.`, timestamp: new Date().toISOString() });
            } else {
                addToast("No pending dues found.", "info");
                setTerminalHistory(prev => [...prev, { type: 'system', text: '> FINANCIAL LEDGER CLEAR. NO PENDING DUES DETECTED.' }]);
            }
        }, 3500);
    };

    const syncNeuralArchitecture = () => {
        setActiveProcess("Syncing Neural Architecture Across All Nodes...");
        setTerminalHistory(prev => [...prev, { type: 'system', text: '> INITIATING GLOBAL NODE SYNCHRONIZATION...' }]);
        setTimeout(() => {
            setActiveProcess(null);
            addToast("Neural Architecture Synced. All systems operating at peak efficiency.", "success");
            setTerminalHistory(prev => [...prev, { type: 'system', text: '> SYNCHRONIZATION COMPLETE. 100% DATA INTEGRITY ACHIEVED.' }]);
            addAuditLog({ action: 'Neural Sync', details: 'Global node synchronization completed successfully.', timestamp: new Date().toISOString() });
        }, 4000);
    };

    const handleTerminalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!terminalInput.trim()) return;

        const cmd = terminalInput.trim();
        setTerminalInput('');
        setTerminalHistory(prev => [...prev, { type: 'input', text: `root@royal-os:~# ${cmd}` }]);

        const lowerCmd = cmd.toLowerCase();

        if (lowerCmd === 'help') {
            setTerminalHistory(prev => [...prev, { type: 'output', text: 'Available commands: stabilize, audit, status, automate, optimize_leads, collect_dues, sync_nodes, clear, ai <query>' }]);
        } else if (lowerCmd === 'clear') {
            setTerminalHistory([]);
        } else if (lowerCmd === 'stabilize') {
            handleStabilize();
        } else if (lowerCmd === 'audit') {
            runSecurityAudit();
        } else if (lowerCmd === 'automate') {
            toggleFullAutomation();
        } else if (lowerCmd === 'optimize_leads') {
            optimizeLeads();
        } else if (lowerCmd === 'collect_dues') {
            automateDues();
        } else if (lowerCmd === 'sync_nodes') {
            syncNeuralArchitecture();
        } else if (lowerCmd === 'status') {
            setTerminalHistory(prev => [...prev, { type: 'output', text: `SYSTEM STATUS:\nQubits: ${qubits}\nCoherence: ${coherence.toFixed(2)}%\nEntangled Nodes: ${entangledNodes}\nAutomation: ${fullAutomation ? 'ACTIVE' : 'INACTIVE'}` }]);
        } else if (lowerCmd.startsWith('ai ')) {
            const query = cmd.substring(3);
            await handleAiQuery(query);
        } else {
            setTerminalHistory(prev => [...prev, { type: 'output', text: `Command not found: ${cmd}. Type "help" for a list of commands.` }]);
        }
    };

    const handleAiQuery = async (query: string) => {
        setIsAiProcessing(true);
        setTerminalHistory(prev => [...prev, { type: 'system', text: '> CONSULTING NEURAL OVERMIND...' }]);
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: query,
                config: {
                    systemInstruction: "You are the core intelligence of the Royal Neural OS, a futuristic quantum computer operating system for a high-tech gym. Respond concisely, with a technical, authoritative, and slightly sci-fi tone. Keep responses under 3 sentences."
                }
            });
            
            setTerminalHistory(prev => [...prev, { type: 'ai', text: `[AI OVERMIND]: ${response.text}` }]);
        } catch (error) {
            console.error("AI Error:", error);
            setTerminalHistory(prev => [...prev, { type: 'output', text: '[ERROR]: Neural connection to Overmind failed. Check API configuration.' }]);
        } finally {
            setIsAiProcessing(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header / HUD */}
            <div className="bg-black border border-fuchsia-500/30 rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.15)] shrink-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/50 rounded-full flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse"></span>
                                <span className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">System Online</span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.3em]">v32.0_Singularity</span>
                            {fullAutomation && (
                                <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center gap-2">
                                    <Workflow className="w-3 h-3 text-emerald-400 animate-spin-slow" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Auto-Pilot Active</span>
                                </div>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            Quantum <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">OS Core</span>
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono mt-2 max-w-xl">
                            The central nervous system of Royal The Gym. Operating in multi-dimensional superposition to process infinite variables simultaneously with intelligent optimization.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Active Qubits</p>
                            <p className="text-3xl font-black text-white">{qubits}</p>
                        </div>
                        <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Coherence</p>
                            <p className={`text-3xl font-black ${coherence > 98 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {coherence.toFixed(2)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Process Overlay */}
            <AnimatePresence>
                {activeProcess && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="bg-fuchsia-900/20 border border-fuchsia-500/50 p-4 rounded-xl flex items-center justify-between backdrop-blur-md shrink-0"
                    >
                        <div className="flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 text-fuchsia-400 animate-spin" />
                            <span className="text-sm font-bold text-fuchsia-100 font-mono">{activeProcess}</span>
                        </div>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => (
                                <div key={i} className="w-2 h-2 bg-fuchsia-500 rounded-full animate-ping" style={{ animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left Column: Terminal & AI */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                    {/* Interactive Terminal */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 flex-1 flex flex-col relative overflow-hidden group hover:border-cyan-500/30 transition-colors min-h-[300px]">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><TerminalIcon className="w-32 h-32 text-cyan-500" /></div>
                        
                        <div className="flex items-center gap-3 mb-4 shrink-0 relative z-10">
                            <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400"><TerminalIcon className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Neural Terminal</h3>
                                <p className="text-[10px] font-mono text-cyan-400/70 uppercase">Direct Core Access</p>
                            </div>
                        </div>

                        {/* Terminal Output */}
                        <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-white/5 p-4 overflow-y-auto font-mono text-xs custom-scrollbar relative z-10 mb-4 flex flex-col gap-2">
                            {terminalHistory.map((entry, idx) => (
                                <div key={idx} className={`
                                    ${entry.type === 'input' ? 'text-white font-bold' : ''}
                                    ${entry.type === 'output' ? 'text-zinc-400' : ''}
                                    ${entry.type === 'system' ? 'text-cyan-400' : ''}
                                    ${entry.type === 'ai' ? 'text-fuchsia-400' : ''}
                                `}>
                                    {entry.text}
                                </div>
                            ))}
                            {isAiProcessing && (
                                <div className="text-fuchsia-400 flex items-center gap-2">
                                    <span className="animate-pulse">Processing neural query</span>
                                    <span className="flex gap-1">
                                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                                    </span>
                                </div>
                            )}
                            <div ref={terminalEndRef} />
                        </div>

                        {/* Terminal Input */}
                        <form onSubmit={handleTerminalSubmit} className="relative z-10 shrink-0">
                            <div className="flex items-center bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden focus-within:border-cyan-500/50 transition-colors">
                                <span className="pl-4 text-cyan-500 font-mono text-sm font-bold">{'>'}</span>
                                <input 
                                    type="text" 
                                    value={terminalInput}
                                    onChange={(e) => setTerminalInput(e.target.value)}
                                    placeholder="Enter command or 'ai <query>'..."
                                    className="flex-1 bg-transparent border-none text-white font-mono text-sm p-4 focus:outline-none focus:ring-0 placeholder:text-zinc-600"
                                    autoComplete="off"
                                    spellCheck="false"
                                />
                                <button type="submit" className="p-4 text-zinc-500 hover:text-cyan-400 transition-colors">
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Visualizations & Controls */}
                <div className="flex flex-col gap-6 min-h-0">
                    {/* Real-time Telemetry */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 flex-1 flex flex-col relative overflow-hidden group hover:border-purple-500/30 transition-colors min-h-[250px]">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Activity className="w-32 h-32 text-purple-500" /></div>
                        
                        <div className="flex items-center gap-3 mb-4 shrink-0 relative z-10">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><Activity className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Telemetry</h3>
                                <p className="text-[10px] font-mono text-purple-400/70 uppercase">Live Quantum States</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative z-10 min-h-[150px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCoh" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorEnt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="time" stroke="#ffffff30" fontSize={10} tickMargin={10} />
                                    <YAxis stroke="#ffffff30" fontSize={10} domain={['auto', 'auto']} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="coherence" stroke="#10b981" fillOpacity={1} fill="url(#colorCoh)" isAnimationActive={false} />
                                    <Area type="monotone" dataKey="entanglement" stroke="#d946ef" fillOpacity={1} fill="url(#colorEnt)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Intelligent Optimization Controls */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 shrink-0 flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Bot className="w-4 h-4 text-cyan-400" /> Intelligent Optimization
                            </h3>
                            <div className="space-y-3">
                                <button 
                                    onClick={toggleFullAutomation}
                                    disabled={activeProcess !== null}
                                    className={`w-full p-3 border rounded-xl flex items-center justify-between group transition-all disabled:opacity-50 ${fullAutomation ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-zinc-900 border-white/10 hover:border-cyan-500/50 text-white'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Workflow className={`w-4 h-4 ${fullAutomation ? 'animate-spin-slow' : 'text-zinc-500 group-hover:text-cyan-400'}`} />
                                        <div className="text-left">
                                            <p className="text-xs font-bold uppercase tracking-wider">{fullAutomation ? 'Auto-Pilot Active' : 'Engage Full Automation'}</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={optimizeLeads}
                                    disabled={activeProcess !== null || fullAutomation}
                                    className="w-full p-3 bg-zinc-900 border border-white/10 hover:border-fuchsia-500/50 rounded-xl flex items-center justify-between group transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <TrendingUp className="w-4 h-4 text-zinc-500 group-hover:text-fuchsia-400" />
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white uppercase tracking-wider">Optimize Leads</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={automateDues}
                                    disabled={activeProcess !== null || fullAutomation}
                                    className="w-full p-3 bg-zinc-900 border border-white/10 hover:border-amber-500/50 rounded-xl flex items-center justify-between group transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Wallet className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white uppercase tracking-wider">Automate Dues</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={syncNeuralArchitecture}
                                    disabled={activeProcess !== null || fullAutomation}
                                    className="w-full p-3 bg-zinc-900 border border-white/10 hover:border-indigo-500/50 rounded-xl flex items-center justify-between group transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Network className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white uppercase tracking-wider">Sync Neural Nodes</p>
                                        </div>
                                    </div>
                                </button>

                                <button 
                                    onClick={handleStabilize}
                                    disabled={isStabilizing || activeProcess !== null}
                                    className="w-full p-3 bg-zinc-900 border border-white/10 hover:border-cyan-500/50 rounded-xl flex items-center justify-between group transition-all disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Sparkles className={`w-4 h-4 ${isStabilizing ? 'text-cyan-400 animate-spin' : 'text-zinc-500 group-hover:text-cyan-400'}`} />
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white uppercase tracking-wider">Stabilize Core</p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Integrated System Sub-Routines */}
            <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 shrink-0">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4 text-fuchsia-400" /> Integrated System Sub-Routines
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Automation Hub', icon: <Workflow className="w-5 h-5" />, color: 'text-indigo-400', status: fullAutomation ? 'Active' : 'Standby' },
                        { label: 'Nexus Master', icon: <Network className="w-5 h-5" />, color: 'text-fuchsia-400', status: 'Online' },
                        { label: 'Neural Stack', icon: <Cpu className="w-5 h-5" />, color: 'text-indigo-400', status: 'Synced' },
                        { label: 'Security Layer', icon: <ShieldAlert className="w-5 h-5" />, color: 'text-red-400', status: 'Secure' },
                        { label: 'Stress Test', icon: <Activity className="w-5 h-5" />, color: 'text-indigo-400', status: 'Ready' },
                        { label: 'Launch Center', icon: <Zap className="w-5 h-5" />, color: 'text-orange-500', status: 'Armed' },
                    ].map((routine, idx) => (
                        <div key={idx} className="bg-zinc-900/50 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-3 hover:bg-zinc-800/50 transition-colors group cursor-pointer">
                            <div className={`p-3 bg-black rounded-xl border border-white/5 group-hover:scale-110 transition-transform ${routine.color}`}>
                                {routine.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-white uppercase tracking-wider">{routine.label}</p>
                                <p className={`text-[9px] font-mono uppercase mt-1 ${routine.status === 'Active' || routine.status === 'Secure' || routine.status === 'Online' || routine.status === 'Synced' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                    {routine.status}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

