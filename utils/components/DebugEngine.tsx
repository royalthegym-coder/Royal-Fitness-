
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { TerminalIcon } from './icons/TerminalIcon';
import { BugFixIcon } from './icons/BugFixIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { BotIcon } from './icons/BotIcon';
import { getComplexResponse } from '../../lib/gemini';

interface LogEntry {
    id: number;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    message: string;
    source: string;
}

interface ActiveBug {
    logId: number;
    description: string;
    stackTrace: string;
    rootCause: string | null;
    patch: string | null;
    status: 'Detecting' | 'Analyzing' | 'Patching' | 'Fixed';
}

const DebugEngine: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isMonitoring, setIsMonitoring] = useState(true);
    const [activeBug, setActiveBug] = useState<ActiveBug | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Tech Stack Badge info
    const techStack = [
        { name: 'Python', color: 'bg-yellow-600' },
        { name: 'FastAPI', color: 'bg-teal-600' },
        { name: 'LangChain', color: 'bg-green-600' },
        { name: 'CrewAI', color: 'bg-red-600' },
    ];

    // Simulated Log Stream
    useEffect(() => {
        if (!isMonitoring) return;

        const interval = setInterval(() => {
            const now = new Date().toLocaleTimeString();
            const sources = ['AuthService', 'WorkoutCore', 'PaymentGateway', 'UserNode', 'CrewAI_Agent_1'];
            const randomSource = sources[Math.floor(Math.random() * sources.length)];
            
            const standardLogs = [
                { level: 'INFO', message: `Request processed in ${Math.floor(Math.random() * 50)}ms` },
                { level: 'DEBUG', message: `Payload payload_size=${Math.floor(Math.random() * 1024)} bytes` },
                { level: 'INFO', message: `Health check passed. CPU: ${Math.floor(Math.random() * 30 + 10)}%` },
                { level: 'WARN', message: `Deprecated API usage detected in module ${randomSource}` },
            ];

            const randomLog = standardLogs[Math.floor(Math.random() * standardLogs.length)];
            
            // Randomly inject an Error (Rarely)
            if (Math.random() > 0.95 && !activeBug) {
                const errorLog: LogEntry = {
                    id: Date.now(),
                    timestamp: now,
                    level: 'ERROR',
                    message: `Unhandled Exception: NullReference in ${randomSource}.Process()`,
                    source: randomSource
                };
                setLogs(prev => [...prev, errorLog].slice(-50));
            } else {
                setLogs(prev => [...prev, {
                    id: Date.now(),
                    timestamp: now,
                    level: randomLog.level as any,
                    message: randomLog.message,
                    source: randomSource
                }].slice(-50));
            }

        }, 1500);

        return () => clearInterval(interval);
    }, [isMonitoring, activeBug]);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleSimulateBug = () => {
        const errorLog: LogEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'ERROR',
            message: `CRITICAL: Memory Leak detected in WebSocket Handler. Heap usage > 90%.`,
            source: 'ConnectionManager'
        };
        setLogs(prev => [...prev, errorLog]);
    };

    const handleAnalyzeBug = async (log: LogEntry) => {
        setIsMonitoring(false); // Pause monitoring to focus
        setActiveBug({
            logId: log.id,
            description: log.message,
            stackTrace: `File "/app/core/connection_manager.py", line 42, in handle_connect\n    await self.manager.connect(websocket)\nAttributeError: 'NoneType' object has no attribute 'connect'`,
            rootCause: null,
            patch: null,
            status: 'Analyzing'
        });

        // Step 1: Root Cause Analysis (Gemini acting as DeepSeek Coder)
        try {
            const prompt = `
                Act as an advanced Debug Agent (similar to DeepSeek Coder).
                Analyze this Python/FastAPI error log: "${log.message}"
                Context: The application uses LangChain for AI agents.
                
                1. Identify the likely Root Cause (1 sentence).
                2. Suggest a technical fix strategy (1 sentence).
                
                Format: Root Cause: [Cause] | Fix: [Fix]
            `;
            const analysis = await getComplexResponse(prompt);
            
            setActiveBug(prev => prev ? { ...prev, rootCause: analysis, status: 'Patching' } : null);

            // Step 2: Generate Patch
            setTimeout(async () => {
                const patchPrompt = `
                    Write a Python code patch for the error: "${log.message}".
                    The stack trace indicates a NoneType error in connection_manager.py.
                    Provide the corrected function using Python type hinting.
                    Wrap code in markdown code blocks.
                `;
                const patchCode = await getComplexResponse(patchPrompt);
                setActiveBug(prev => prev ? { ...prev, patch: patchCode, status: 'Fixed' } : null);
            }, 2000);

        } catch (e) {
            console.error(e);
            setIsMonitoring(true);
        }
    };

    const handleApplyPatch = () => {
        alert("Patch Applied Successfully! Restarting Services...");
        setActiveBug(null);
        setIsMonitoring(true);
        setLogs(prev => [...prev, {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'INFO',
            message: 'System Self-Healed. Service Restarted.',
            source: 'SystemCore'
        }]);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 flex items-center">
                        <TerminalIcon className="w-8 h-8 mr-3 text-purple-400" />
                        Debug Engine
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 font-mono">Self-Healing Core • v3.0.1</p>
                </div>
                
                <div className="flex gap-2">
                    {techStack.map(tech => (
                        <span key={tech.name} className={`text-[10px] font-bold px-2 py-1 rounded text-white ${tech.color}`}>
                            {tech.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* LOG ANALYZER */}
                <Card className="lg:col-span-2 bg-black border-gray-800 p-0 flex flex-col h-full overflow-hidden">
                    <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-xs text-gray-500 font-mono ml-2">/var/log/royal_gym_core.log</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleSimulateBug}
                                className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded hover:bg-red-900/80 border border-red-500/30"
                            >
                                Trigger Bug
                            </button>
                            <button 
                                onClick={() => setIsMonitoring(!isMonitoring)}
                                className={`text-xs px-2 py-1 rounded border ${isMonitoring ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-gray-800 text-gray-400 border-gray-600'}`}
                            >
                                {isMonitoring ? 'Monitoring' : 'Paused'}
                            </button>
                        </div>
                    </div>
                    
                    <div ref={logContainerRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 custom-scrollbar">
                        {logs.map(log => (
                            <div key={log.id} className={`flex gap-3 hover:bg-gray-900 p-1 rounded cursor-default ${
                                log.level === 'ERROR' ? 'text-red-400 bg-red-900/10' : 
                                log.level === 'WARN' ? 'text-yellow-400' : 
                                log.level === 'DEBUG' ? 'text-gray-500' : 'text-green-400'
                            }`}>
                                <span className="opacity-50 w-20 flex-shrink-0">{log.timestamp}</span>
                                <span className={`font-bold w-12 flex-shrink-0 ${
                                    log.level === 'ERROR' ? 'bg-red-500 text-black px-1 rounded' : ''
                                }`}>{log.level}</span>
                                <span className="text-blue-400 w-24 flex-shrink-0 truncate">[{log.source}]</span>
                                <span className="flex-1 break-all">{log.message}</span>
                                {log.level === 'ERROR' && !activeBug && (
                                    <button 
                                        onClick={() => handleAnalyzeBug(log)}
                                        className="text-[10px] bg-red-600 text-white px-2 rounded hover:bg-red-500 animate-pulse"
                                    >
                                        FIX
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* DIAGNOSTIC & PATCH PANEL */}
                <div className="flex flex-col gap-6 h-full">
                    {/* ROOT CAUSE ENGINE */}
                    <Card className={`flex-1 border-t-4 transition-colors ${activeBug ? 'border-red-500 bg-gray-900' : 'border-gray-600 bg-gray-800/50'}`}>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center">
                            <BotIcon className="w-4 h-4 mr-2" /> Root Cause Engine
                        </h3>
                        
                        {!activeBug ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                <SparkleIcon className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-xs">System Healthy. No active incidents.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <p className="text-xs text-red-400 font-bold mb-1">INCIDENT DETECTED</p>
                                    <p className="text-xs text-white bg-red-900/20 p-2 rounded border border-red-500/30 font-mono">
                                        {activeBug.description}
                                    </p>
                                </div>
                                {activeBug.status !== 'Detecting' && (
                                    <div>
                                        <p className="text-xs text-blue-400 font-bold mb-1">AI DIAGNOSIS</p>
                                        {activeBug.rootCause ? (
                                            <p className="text-xs text-gray-300 leading-relaxed bg-blue-900/10 p-2 rounded border border-blue-500/30">
                                                {activeBug.rootCause}
                                            </p>
                                        ) : (
                                            <div className="flex items-center text-xs text-blue-300">
                                                <AutoUpdateIcon className="w-3 h-3 mr-2 animate-spin" /> Analyzing Trace...
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* PATCH GENERATOR */}
                    <Card className={`flex-[1.5] border-t-4 transition-colors ${activeBug?.patch ? 'border-green-500 bg-gray-900' : 'border-gray-600 bg-gray-800/50'}`}>
                        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-4 flex items-center">
                            <BugFixIcon className="w-4 h-4 mr-2" /> Patch Generator
                        </h3>

                        {!activeBug ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                <p className="text-xs">Waiting for diagnostics...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {activeBug.patch ? (
                                    <>
                                        <div className="flex-1 bg-black p-3 rounded border border-green-500/30 overflow-y-auto mb-4 custom-scrollbar">
                                            <pre className="text-[10px] text-green-300 font-mono whitespace-pre-wrap">
                                                {activeBug.patch.replace(/```python|```/g, '')}
                                            </pre>
                                        </div>
                                        <button 
                                            onClick={handleApplyPatch}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-all shadow-lg shadow-green-900/20"
                                        >
                                            <CheckCircleIcon className="w-4 h-4 mr-2" /> Apply Hotfix (v3.0.2)
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        {activeBug.status === 'Patching' && (
                                            <>
                                                <SparkleIcon className="w-8 h-8 mb-2 animate-spin text-purple-400" />
                                                <p className="text-xs">Generating Python Patch...</p>
                                            </>
                                        )}
                                        {activeBug.status === 'Analyzing' && <p className="text-xs">Waiting for diagnosis...</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DebugEngine;
