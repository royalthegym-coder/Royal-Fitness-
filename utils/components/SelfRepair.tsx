
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { 
    ShieldCheck, ShieldAlert, Bug, Terminal, Cpu, 
    RefreshCw, Zap, Lock, Unlock, Activity, 
    GitMerge, FileCode, CheckCircle, AlertTriangle,
    Siren, Server, Globe, Infinity, Hexagon, Code
} from 'lucide-react';
import { getComplexResponse } from '../../lib/gemini';
import { useToast } from '../hooks/useToast';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BugReport {
    id: string;
    code: string;
    location: string;
    sector: 'AUTH' | 'DB' | 'API' | 'UI';
    description: string;
    severity: 'Low' | 'Medium' | 'Critical';
    status: 'Detected' | 'Analyzing' | 'Patching' | 'Resolved';
    aiAnalysis?: string;
}

const SECTORS = ['AUTH', 'DB', 'API', 'UI'];

const POTENTIAL_ISSUES: BugReport[] = [
    { id: '1', code: 'SQLI-MEMBERS', location: '/api/members', sector: 'DB', description: 'SQL Injection potential via unvalidated sort parameters.', severity: 'Critical', status: 'Detected' },
    { id: '2', code: 'SEC-HEADERS', location: 'Nginx Config', sector: 'API', description: 'Missing CSP headers. Risk: Clickjacking.', severity: 'Medium', status: 'Detected' },
    { id: '3', code: 'MEM-LEAK', location: 'Dashboard.tsx', sector: 'UI', description: 'Unbounded array growth in visualization loop.', severity: 'Critical', status: 'Detected' },
    { id: '4', code: 'AUTH-BYPASS', location: 'Middleware', sector: 'AUTH', description: 'JWT signature validation weakness.', severity: 'Critical', status: 'Detected' },
    { id: '5', code: 'XSS-DOM', location: 'SearchBar', sector: 'UI', description: 'Unsanitized input reflected in DOM.', severity: 'Medium', status: 'Detected' },
];

const SelfRepair: React.FC = () => {
    const { addToast } = useToast();
    
    // Core State
    const [bugs, setBugs] = useState<BugReport[]>([]);
    const [selectedBug, setSelectedBug] = useState<BugReport | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [autonomousMode, setAutonomousMode] = useState(false);
    const [systemHealth, setSystemHealth] = useState(98);
    const [patchesApplied, setPatchesApplied] = useState(142);
    const [activeSector, setActiveSector] = useState<string | null>(null);
    
    // Visuals
    const [terminalLogs, setTerminalLogs] = useState<string[]>(['Sentinel Core v31.0 initialized.', 'Defense Grid: ONLINE', 'Awaiting command.']);
    const [graphData, setGraphData] = useState<{time: string, threat: number, defense: number}[]>([]);
    const [typingCode, setTypingCode] = useState('');
    
    const terminalRef = useRef<HTMLDivElement>(null);

    // --- LIVE GRAPH SIMULATION ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setGraphData(prev => {
                const last = prev[prev.length - 1];
                // Simulate threat spikes
                const spike = Math.random() > 0.92 ? 60 : 0;
                const baseThreat = Math.random() * 15 + spike;
                
                // Defense reacts to threat
                const defense = autonomousMode ? Math.min(100, baseThreat + 20) : Math.max(20, baseThreat - 5);
                
                // Update Health based on unmitigated threat
                if (baseThreat > defense) {
                    setSystemHealth(h => Math.max(50, h - 0.5));
                    // Randomly highlight a sector under attack
                    if (Math.random() > 0.7) setActiveSector(SECTORS[Math.floor(Math.random() * SECTORS.length)]);
                } else {
                    setSystemHealth(h => Math.min(100, h + 0.2));
                    if (Math.random() > 0.9) setActiveSector(null);
                }

                return [...prev.slice(-40), { time: timeStr, threat: baseThreat, defense }];
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [autonomousMode]);

    // --- AUTONOMOUS SENTINEL LOOP ---
    useEffect(() => {
        if (!autonomousMode) return;
        
        const interval = setInterval(() => {
            // Find a bug to fix automatically
            const detectedBug = bugs.find(b => b.status === 'Detected');
            
            if (detectedBug) {
                addLog(`SENTINEL: Engaging threat ${detectedBug.code} in [${detectedBug.sector}]...`, 'warn');
                handleAnalyze(detectedBug, true);
            } else if (Math.random() > 0.85) {
                // Spawn a new random threat to keep things interesting
                const newBug = POTENTIAL_ISSUES[Math.floor(Math.random() * POTENTIAL_ISSUES.length)];
                const uniqueBug = { ...newBug, id: `auto-${Date.now()}`, status: 'Detected' as const };
                setBugs(prev => [uniqueBug, ...prev]);
                setActiveSector(uniqueBug.sector);
                addLog(`WARNING: Anomaly detected in ${uniqueBug.sector} sector.`, 'alert');
            }
        }, 3500);
        return () => clearInterval(interval);
    }, [autonomousMode, bugs]);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }, [terminalLogs, typingCode]);

    const addLog = (msg: string, type: 'info' | 'warn' | 'alert' | 'success' = 'info') => {
        const prefix = type === 'alert' ? '!!' : type === 'warn' ? '⚠' : type === 'success' ? '✓' : '>';
        setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${prefix} ${msg}`, ...prev].slice(0, 50));
    };

    const handleScan = () => {
        setIsScanning(true);
        setBugs([]);
        addLog("SYSTEM: Initiating Deep Kernel Scan (Level 5)...", 'info');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            if (progress % 20 === 0) {
                const sec = SECTORS[Math.floor(Math.random()*SECTORS.length)];
                setActiveSector(sec);
                addLog(`SCAN: Verifying ${sec} Integrity...`);
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setIsScanning(false);
                setBugs(POTENTIAL_ISSUES);
                setActiveSector(null);
                addLog("SCAN COMPLETE: 5 Critical Vulnerabilities Identified.", 'alert');
                addToast("Audit Complete. Perimeter Weakness Detected.", "error");
            }
        }, 300);
    };

    const typeCodeEffect = (codeSnippet: string) => {
        setTypingCode('');
        let i = 0;
        const interval = setInterval(() => {
            setTypingCode(prev => prev + codeSnippet.charAt(i));
            i++;
            if (i >= codeSnippet.length) clearInterval(interval);
        }, 30);
    };

    const handleAnalyze = async (bug: BugReport, auto = false) => {
        setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'Analyzing' } : b));
        if (!auto) setSelectedBug({ ...bug, status: 'Analyzing' });
        
        addLog(`NEURAL ENGINE: Decompiling ${bug.code}...`, 'info');

        try {
            const prompt = `
                Act as a Cyber Security AI (Sentinel).
                Threat: ${bug.code} in ${bug.location} (${bug.sector}).
                Context: ${bug.description}.
                
                Generate a simulated "Patch Protocol" output in HTML.
                Include: 
                1. <span class="text-blue-400 font-bold">Analysis:</span> Brief root cause.
                2. <span class="text-green-400 font-bold">Action:</span> Specific code fix strategy.
                
                Also provide a short code snippet to fix it (e.g. sanitizing input).
                Separator: |||
            `;
            
            const response = await getComplexResponse(prompt);
            const [analysisHtml, codeSnippet] = response.split('|||');
            
            // Simulate AI Thinking/Coding time
            setTimeout(() => {
                setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'Patching', aiAnalysis: analysisHtml } : b));
                if (!auto) setSelectedBug(prev => prev ? { ...prev, status: 'Patching', aiAnalysis: analysisHtml } : null);
                
                addLog(`PATCH: Solution Synthesized for ${bug.code}. Applying Hotfix...`, 'success');
                if (codeSnippet) typeCodeEffect(codeSnippet.trim() || "// Applying heuristic patch...");
                
                if (auto) {
                    setTimeout(() => resolveBug(bug.id, true), 2000);
                }
            }, 2000);

        } catch (e) {
            addLog("ERR: Neural Uplink Failed. Using heuristic patch.", 'warn');
            // Fallback for demo if API fails
            setTimeout(() => {
                 setBugs(prev => prev.map(b => b.id === bug.id ? { ...b, status: 'Patching', aiAnalysis: "<span class='text-green-400'>Heuristic Analysis:</span> Standard vulnerability pattern matched." } : b));
                 if(auto) setTimeout(() => resolveBug(bug.id, true), 1000);
            }, 1000);
        }
    };

    const resolveBug = (id: string, auto = false) => {
        setBugs(prev => prev.map(b => b.id === id ? { ...b, status: 'Resolved' } : b));
        if (!auto) setSelectedBug(null);
        setPatchesApplied(prev => prev + 1);
        setSystemHealth(prev => Math.min(100, prev + 5));
        setTypingCode(''); // Clear code screen
        addLog(`SUCCESS: Threat ${id} Neutralized. Integrity Restored.`, 'success');
        if (!auto) addToast("Patch Applied Successfully.", "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. APEX HEADER */}
            <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-red-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(239,68,68,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-red-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(220,38,38,0.5)] border border-red-400 group-hover:rotate-12 transition-transform duration-700">
                            <ShieldCheck className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-red-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Infinity className="w-3 h-3" /> Apex-Continuum v31.0
                                </div>
                                <span className={`text-[10px] font-mono tracking-[0.4em] uppercase font-bold ${autonomousMode ? 'text-green-500' : 'text-amber-500'}`}>
                                    {autonomousMode ? 'SENTINEL: AUTO_PILOT' : 'SENTINEL: MANUAL_OPS'}
                                </span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Auto <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-600">Immunity</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex gap-4">
                         <div className="bg-gray-900/80 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col items-center min-w-[160px]">
                            <Activity className={`w-6 h-6 mb-2 ${systemHealth > 90 ? 'text-green-500' : 'text-red-500'} animate-pulse`} />
                            <p className="text-3xl font-black text-white italic">{systemHealth.toFixed(1)}%</p>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Integrity</p>
                        </div>
                        <div className="bg-gray-900/80 p-6 rounded-[2.5rem] border border-white/10 backdrop-blur-2xl shadow-2xl flex flex-col items-center min-w-[160px]">
                            <GitMerge className="w-6 h-6 text-blue-400 mb-2" />
                            <p className="text-3xl font-black text-white italic">{patchesApplied}</p>
                            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Patches</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. THREAT MATRIX & HEX GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Hex Defense Grid */}
                <div className="lg:col-span-8">
                     <Card title="Defense Matrix (Hex-Grid)" className="bg-black border-white/5 p-0 overflow-hidden rounded-[3.5rem] shadow-2xl relative h-[500px]">
                         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(220,38,38,0.05)_0%,_transparent_70%)]"></div>
                         
                         {/* Hex Grid Visualization */}
                         <div className="absolute inset-0 flex items-center justify-center">
                             <div className="grid grid-cols-2 gap-8 relative z-10">
                                 {SECTORS.map((sector) => (
                                     <div key={sector} className={`relative group transition-all duration-500 ${activeSector === sector ? 'scale-110' : 'scale-100'}`}>
                                         {/* Hexagon Shape */}
                                         <div className={`w-32 h-36 flex flex-col items-center justify-center clip-hexagon backdrop-blur-md border-2 transition-colors ${
                                             activeSector === sector 
                                             ? 'bg-red-900/40 border-red-500 shadow-[0_0_30px_#ef4444]' 
                                             : 'bg-gray-900/40 border-white/10 hover:border-cyan-500/50'
                                         }`}>
                                             {activeSector === sector ? <AlertTriangle className="w-8 h-8 text-red-500 animate-bounce" /> : <ShieldCheck className="w-8 h-8 text-cyan-500" />}
                                             <span className="text-xs font-black text-white mt-2 tracking-widest">{sector}</span>
                                             <span className={`text-[8px] font-mono mt-1 ${activeSector === sector ? 'text-red-400' : 'text-green-400'}`}>
                                                 {activeSector === sector ? 'UNDER ATTACK' : 'SECURE'}
                                             </span>
                                         </div>
                                         {/* Connection Lines (Visual) */}
                                         <div className="absolute inset-0 border-2 border-transparent hover:border-cyan-500/20 clip-hexagon pointer-events-none"></div>
                                     </div>
                                 ))}
                             </div>
                             
                             {/* Central Core */}
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black rounded-full border-4 border-gray-800 flex items-center justify-center z-20 shadow-[0_0_50px_black]">
                                 <Server className={`w-8 h-8 ${systemHealth < 50 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
                             </div>
                         </div>
                         
                         {/* Live Threat Graph Overlay */}
                         <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={graphData}>
                                    <defs>
                                        <linearGradient id="colorThreat" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="threat" stroke="#ef4444" strokeWidth={2} fill="url(#colorThreat)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                         </div>
                     </Card>
                </div>

                {/* Right: Controls & Active Bug */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className={`p-8 rounded-[3rem] border transition-all duration-500 ${autonomousMode ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-gray-900 border-white/10'}`}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-black uppercase italic tracking-tight">Sentinel Pilot</h3>
                            <div 
                                onClick={() => setAutonomousMode(!autonomousMode)}
                                className={`w-16 h-8 rounded-full p-1 cursor-pointer transition-colors ${autonomousMode ? 'bg-green-500' : 'bg-gray-700'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${autonomousMode ? 'translate-x-8' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                            {autonomousMode 
                            ? "AI is actively hunting and neutralizing vulnerabilities in real-time. Code injection enabled." 
                            : "Manual control engaged. System awaits specific patch commands."}
                        </p>
                    </div>

                    <button 
                        onClick={handleScan}
                        disabled={isScanning || autonomousMode}
                        className={`w-full py-6 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                            autonomousMode 
                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5' 
                            : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                        }`}
                    >
                        {isScanning ? <RefreshCw className="animate-spin w-4 h-4"/> : <Siren className="w-4 h-4"/>}
                        {isScanning ? 'DEEP SCANNING...' : 'TRIGGER MANUAL AUDIT'}
                    </button>

                    {/* Active Bug Highlight */}
                    {selectedBug && (
                        <div className="p-6 bg-red-950/30 border border-red-500/30 rounded-[2.5rem] animate-slide-up">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Active Threat</span>
                                <Bug className="w-4 h-4 text-red-500" />
                            </div>
                            <h4 className="text-white font-bold text-sm mb-1">{selectedBug.code}</h4>
                            <p className="text-[10px] text-gray-400">{selectedBug.description}</p>
                            {selectedBug.status === 'Patching' && (
                                <div className="mt-3 flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase animate-pulse">
                                    <RefreshCw className="w-3 h-3 animate-spin"/> Applying Fix...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. TERMINAL & CODE FORGE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Vulnerability List */}
                <div className="lg:col-span-5">
                    <Card title="Active Vectors" className="bg-[#0c0c0c] border-white/10 h-[600px] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Bug className="w-32 h-32 text-red-500"/></div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 relative z-10">
                            {bugs.length === 0 && !isScanning && (
                                <div className="text-center py-20 opacity-30">
                                    <ShieldCheck className="w-20 h-20 mx-auto mb-4 text-green-500" />
                                    <p className="text-xs font-black uppercase tracking-widest">Perimeter Secure</p>
                                </div>
                            )}
                            {bugs.map(bug => (
                                <div 
                                    key={bug.id}
                                    onClick={() => bug.status !== 'Resolved' && !autonomousMode && handleAnalyze(bug)}
                                    className={`p-5 rounded-3xl border transition-all cursor-pointer group ${
                                        bug.status === 'Resolved' ? 'bg-green-900/10 border-green-500/20 opacity-50' :
                                        selectedBug?.id === bug.id ? 'bg-red-900/20 border-red-500 shadow-lg' :
                                        'bg-gray-900/50 border-white/5 hover:border-red-500/30'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className={`w-4 h-4 ${bug.severity === 'Critical' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest bg-black px-2 py-0.5 rounded">{bug.code}</span>
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase ${bug.status === 'Resolved' ? 'text-green-500' : 'text-gray-500'}`}>{bug.status}</span>
                                    </div>
                                    <p className="text-xs text-white font-bold truncate">{bug.location}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Remediation Forge (Terminal & Code View) */}
                <div className="lg:col-span-7">
                    <Card className="bg-black border-white/10 h-[600px] p-0 overflow-hidden rounded-[3rem] shadow-2xl flex flex-col font-mono text-xs">
                        <div className="bg-gray-900/80 px-6 py-4 border-b border-white/5 flex justify-between items-center backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-purple-500" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">REMEDIATION_FORGE</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col bg-[#050505]">
                            {/* Live Code Writing Area */}
                            {typingCode && (
                                <div className="p-6 border-b border-white/5 bg-gray-900/20 h-1/3 overflow-hidden relative">
                                    <div className="absolute top-2 right-2 text-[9px] text-gray-500 font-bold uppercase flex items-center gap-2">
                                        <Code className="w-3 h-3"/> Live Synthesis
                                    </div>
                                    <pre className="text-green-400 font-mono text-xs whitespace-pre-wrap">
                                        {typingCode}
                                        <span className="animate-pulse">_</span>
                                    </pre>
                                </div>
                            )}

                            {/* Logs Area */}
                            <div ref={terminalRef} className="flex-1 overflow-y-auto p-8 space-y-2 custom-scrollbar">
                                {terminalLogs.map((log, i) => (
                                    <div key={i} className={`break-words ${log.includes('!!') ? 'text-red-400' : log.includes('✓') ? 'text-green-400' : log.includes('⚠') ? 'text-amber-400' : 'text-gray-400'}`}>
                                        <span className="text-gray-700 mr-2">$</span>{log}
                                    </div>
                                ))}
                                
                                {selectedBug && selectedBug.aiAnalysis && (
                                    <div className="mt-6 border-t border-white/10 pt-6 animate-fade-in">
                                        <div className="bg-gray-900/50 p-6 rounded-2xl border border-blue-500/20 text-gray-300 leading-relaxed shadow-inner">
                                            <div dangerouslySetInnerHTML={{ __html: selectedBug.aiAnalysis }} />
                                        </div>
                                        {selectedBug.status === 'Patching' && (
                                            <button 
                                                onClick={() => resolveBug(selectedBug.id)}
                                                className="w-full mt-4 bg-green-600 hover:bg-green-500 text-black font-black py-4 rounded-xl uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <FileCode className="w-4 h-4" /> Commit Patch to Main
                                            </button>
                                        )}
                                    </div>
                                )}
                                <div className="animate-pulse text-green-500 mt-2">_</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            
            {/* Hexagon Clip Path SVG (Hidden) */}
            <svg width="0" height="0">
                <defs>
                    <clipPath id="hexagon-clip" clipPathUnits="objectBoundingBox">
                        <polygon points="0.5 0, 1 0.25, 1 0.75, 0.5 1, 0 0.75, 0 0.25" />
                    </clipPath>
                </defs>
            </svg>
            <style>{`
                .clip-hexagon {
                    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
                }
            `}</style>
        </div>
    );
};

export default SelfRepair;
