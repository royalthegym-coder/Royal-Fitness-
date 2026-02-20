
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { TerminalIcon } from './icons/TerminalIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { getComplexResponse } from '../../lib/gemini';
import { 
    Terminal, Cpu, Network, Lock, Zap, 
    AlertTriangle, RefreshCw, FileCode, Play, 
    Pause, Database, Server, Activity, ShieldCheck
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

interface SystemAnomaly {
    id: string;
    source: string;
    error: string;
    level: 'WARN' | 'CRIT';
    status: 'Detected' | 'Fixing' | 'Patched';
}

const DebugEngine: React.FC = () => {
    const { addToast } = useToast();
    const [anomalies, setAnomalies] = useState<SystemAnomaly[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [command, setCommand] = useState('');
    const [isRunningStream, setIsRunningStream] = useState(true);
    
    const terminalRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        const time = new Date().toISOString().split('T')[1].slice(0, 8);
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 100));
    };

    // Live Data Stream Simulation
    useEffect(() => {
        if (!isRunningStream) return;
        const interval = setInterval(() => {
            if (Math.random() > 0.6) {
                const hex = Math.random().toString(16).substr(2, 8).toUpperCase();
                const mem = Math.floor(Math.random() * 1024) + 2048;
                addLog(`MEM_ADDR: 0x${hex} | HEAP: ${mem}MB | THREAD_ACTIVE`);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [isRunningStream]);

    const handleDeepScan = async () => {
        setIsScanning(true);
        addLog("SYSTEM: Initializing Level 9 Kernel Deep Scan...");
        addLog("SYSTEM: Mounting root directory...");
        
        await new Promise(r => setTimeout(r, 2000));
        
        const findings: SystemAnomaly[] = [
            { id: '1', source: 'AuthModule.js', error: 'Token TTL drift detected in session layer.', level: 'WARN', status: 'Detected' },
            { id: '2', source: 'PaymentGateway.ts', error: 'Stale retry loop in sandbox environment.', level: 'CRIT', status: 'Detected' },
            { id: '3', source: 'RenderEngine', error: 'Frame drop > 16ms on canvas redraw.', level: 'WARN', status: 'Detected' },
        ];
        setAnomalies(findings);
        addLog(`SCAN COMPLETE: ${findings.length} anomalies detected.`);
        setIsScanning(false);
    };

    const handleApplyPatch = async (id: string) => {
        setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'Fixing' } : a));
        addLog(`AI: Requesting Neural Patch for anomaly ID: ${id}...`);
        
        try {
            const anomaly = anomalies.find(a => a.id === id);
            const prompt = `Solve this system error for a React gym app: "${anomaly?.error}". Provide 2 lines of pseudo-fix code.`;
            const res = await getComplexResponse(prompt);
            
            addLog(`AI_RESPONSE: Patch generated.`);
            addLog(`> ${res.split('\n')[0]}`); // Show first line of code

            setTimeout(() => {
                setAnomalies(prev => prev.map(a => a.id === id ? { ...a, status: 'Patched' } : a));
                addLog(`SUCCESS: Hotfix applied to production-v31.0`);
                addToast("Hotfix Deployed.", "success");
            }, 2000);
        } catch (e) {
            addLog("ERR: Patch generation failed.");
        }
    };

    const executeCommand = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && command) {
            addLog(`root@royal:~$ ${command}`);
            if (command === 'clear') setLogs([]);
            else if (command === 'scan') handleDeepScan();
            else if (command === 'help') addLog("Available commands: scan, clear, reboot, status");
            else addLog(`Unknown command: ${command}`);
            setCommand('');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex justify-between items-center bg-[#020308] p-8 rounded-[3rem] border border-green-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-6 bg-gray-900 rounded-[2.5rem] border border-green-500/30 text-green-500">
                        <Terminal className="w-12 h-12" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                            Cyber <span className="text-green-500">Deck</span>
                        </h1>
                        <p className="text-gray-500 text-[10px] font-mono tracking-[0.5em] mt-2 uppercase font-bold">Root Access Level 0</p>
                    </div>
                </div>
                <button 
                    onClick={handleDeepScan}
                    disabled={isScanning}
                    className="bg-green-600 hover:bg-green-500 text-black font-black py-5 px-10 rounded-[2.5rem] shadow-[0_0_40px_rgba(34,197,94,0.4)] transition-all flex items-center gap-3 uppercase tracking-widest text-xs active:scale-95"
                >
                    {isScanning ? <RefreshCw className="animate-spin w-4 h-4" /> : <Activity className="w-4 h-4" />}
                    {isScanning ? 'SCANNING...' : 'DEEP DIAGNOSTIC'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. VISUAL ANOMALY MATRIX */}
                <Card title="Detected Anomalies" className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem] h-[600px] flex flex-col shadow-xl">
                    <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                        {anomalies.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                <ShieldCheck className="w-20 h-20 text-green-500 mb-6" />
                                <p className="text-sm font-black uppercase tracking-[0.4em]">System Clean</p>
                                <p className="text-[10px] text-gray-500 mt-2 font-mono">No active threats detected.</p>
                            </div>
                        )}
                        {anomalies.map(a => (
                            <div key={a.id} className="bg-gray-900/50 p-6 rounded-[2rem] border border-white/5 flex flex-col gap-4 group hover:border-red-500/30 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${a.level === 'CRIT' ? 'bg-red-900/20 text-red-500' : 'bg-amber-900/20 text-amber-500'}`}>
                                            <AlertTriangle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wide ${a.level === 'CRIT' ? 'bg-red-500 text-black border-red-500' : 'bg-amber-500 text-black border-amber-500'}`}>{a.level}</span>
                                            <h4 className="text-white font-bold text-sm mt-1">{a.source}</h4>
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${a.status === 'Patched' ? 'text-green-500' : 'text-gray-500'}`}>{a.status}</span>
                                </div>
                                
                                <p className="text-xs text-gray-400 font-mono bg-black/40 p-3 rounded-xl border border-white/5">
                                    {a.error}
                                </p>

                                <button 
                                    onClick={() => handleApplyPatch(a.id)}
                                    disabled={a.status !== 'Detected'}
                                    className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        a.status === 'Patched' 
                                        ? 'bg-green-900/20 text-green-400 border border-green-500/30 cursor-default' 
                                        : 'bg-white text-black hover:bg-green-400 shadow-lg active:scale-95'
                                    }`}
                                >
                                    {a.status === 'Fixing' ? <RefreshCw className="w-3 h-3 animate-spin"/> : <FileCode className="w-3 h-3"/>}
                                    {a.status === 'Fixing' ? 'PATCHING...' : a.status === 'Patched' ? 'RESOLVED' : 'APPLY AI PATCH'}
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* 2. LIVE CONSOLE */}
                <Card title="Kernel Console" className="bg-black border-white/10 p-0 overflow-hidden flex flex-col h-[600px] rounded-[3rem] shadow-2xl font-mono text-xs">
                    <div className="bg-gray-900/80 px-8 py-5 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <Server className="w-4 h-4 text-green-500" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">royal_os:pts/0</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsRunningStream(!isRunningStream)} className="text-gray-500 hover:text-white transition-colors">
                                {isRunningStream ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                            </button>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div ref={terminalRef} className="flex-1 overflow-y-auto p-8 text-green-500/80 space-y-1 custom-scrollbar bg-[#050505] relative">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
                        
                        {logs.map((log, i) => (
                            <div key={i} className="animate-fade-in-right opacity-90 hover:opacity-100 hover:text-green-400 cursor-default transition-opacity break-words">
                                {log}
                            </div>
                        ))}
                        <div className="h-4"></div>
                    </div>
                    
                    <div className="p-6 bg-gray-900 border-t border-white/10 flex items-center gap-3">
                         <span className="text-cyan-400 font-bold">$</span>
                         <input 
                            type="text" 
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyPress={executeCommand}
                            className="bg-transparent border-none text-white focus:ring-0 w-full outline-none font-bold"
                            placeholder="Enter system command..."
                         />
                         <span className="w-2 h-4 bg-green-500 animate-pulse"></span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DebugEngine;
