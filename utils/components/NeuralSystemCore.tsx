
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { scanGlobalTrends } from '../../lib/gemini';
import { GoogleIcon } from './icons/GoogleIcon';

interface NeuralNode {
    id: string;
    label: string;
    type: 'input' | 'core' | 'output';
    status: 'idle' | 'active' | 'learning' | 'processing';
    x: number;
    y: number;
}

const INITIAL_NODES: NeuralNode[] = [
    { id: 'input_text', label: 'Prompt Input', type: 'input', status: 'idle', x: 10, y: 20 },
    { id: 'input_voice', label: 'Voice Stream', type: 'input', status: 'idle', x: 10, y: 50 },
    { id: 'input_sensor', label: 'IoT Sensors', type: 'input', status: 'idle', x: 10, y: 80 },
    { id: 'gemini', label: 'Gemini Core', type: 'core', status: 'learning', x: 50, y: 50 },
    { id: 'out_api', label: 'API Gateway', type: 'output', status: 'idle', x: 90, y: 20 },
    { id: 'out_ui', label: 'UI Renderer', type: 'output', status: 'active', x: 90, y: 50 },
    { id: 'out_db', label: 'Vector DB', type: 'output', status: 'idle', x: 90, y: 80 },
];

const NeuralNodeVisual: React.FC<{ node: NeuralNode }> = ({ node }) => {
    return (
        <div 
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-gray-900 z-10 shadow-[0_0_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${
                node.status === 'processing' ? 'border-amber-400 shadow-amber-500/80 scale-125' :
                node.status === 'active' ? 'border-cyan-400 shadow-cyan-500/50' :
                node.status === 'learning' ? 'border-purple-500 shadow-purple-500/50 animate-pulse' :
                'border-gray-600'
            }`}>
                {node.type === 'input' && <div className={`w-3 h-3 rounded-full ${node.status === 'processing' ? 'bg-amber-400' : 'bg-blue-500'}`}></div>}
                {node.type === 'core' && <BrainCircuitIcon className={`w-6 h-6 ${node.status === 'processing' ? 'text-amber-400 animate-spin' : node.status === 'learning' ? 'text-purple-400' : 'text-gray-400'}`} />}
                {node.type === 'output' && <div className={`w-3 h-3 rounded-full ${node.status === 'processing' ? 'bg-amber-400' : 'bg-green-500'}`}></div>}
            </div>
            <span className={`mt-2 text-[10px] font-mono uppercase bg-gray-900/80 px-2 py-0.5 rounded border border-gray-700 transition-colors ${
                node.status === 'processing' ? 'text-amber-400 border-amber-500' :
                node.status === 'active' ? 'text-cyan-400' : 'text-gray-500'
            }`}>
                {node.label}
            </span>
        </div>
    );
};

const NeuralConnection: React.FC<{ start: NeuralNode; end: NeuralNode; active: boolean; processing: boolean }> = ({ start, end, active, processing }) => {
    return (
        <line 
            x1={`${start.x}%`} y1={`${start.y}%`} 
            x2={`${end.x}%`} y2={`${end.y}%`} 
            stroke={processing ? "#fbbf24" : active ? "#22d3ee" : "#374151"} 
            strokeWidth={processing ? 3 : active ? 2 : 1}
            strokeDasharray={active || processing ? "5,5" : "0"}
            className={active || processing ? "animate-pulse" : ""}
        />
    );
};

const NeuralSystemCore: React.FC = () => {
    const [nodes, setNodes] = useState(INITIAL_NODES);
    const [logs, setLogs] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('Latest Bio-hacking tools 2025');
    const [response, setResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Future Log Data
    const [futureLog, setFutureLog] = useState<{item: string, eta: string}[]>([
        { item: 'Wearable Sync (Apple/Garmin)', eta: 'Q4 2024' },
        { item: 'AR-Coaching Node (Smart Mirror)', eta: 'Q1 2025' },
        { item: 'Predictive Logistics Engine', eta: 'Q2 2025' },
    ]);

    useEffect(() => {
        if (isProcessing) return; 

        const interval = setInterval(() => {
            setNodes(prev => prev.map(n => {
                if (n.id === 'gemini') return n; 
                return {
                    ...n,
                    status: Math.random() > 0.8 ? 'active' : 'idle'
                };
            }));
        }, 1500);
        return () => clearInterval(interval);
    }, [isProcessing]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const handleRunRDScan = async () => {
        if (!prompt.trim()) return;
        setIsProcessing(true);
        setResponse('');
        addLog(`Initiating R&D Scan: "${prompt}"...`);
        
        // Visual effects
        setNodes(prev => prev.map(n => n.id === 'input_text' || n.id === 'gemini' ? { ...n, status: 'processing' } : n));
        
        try {
            const report = await scanGlobalTrends(prompt);
            setResponse(report);
            addLog("Trend Score Calculated. Dashboard Updated.");
        } catch (error: any) {
            addLog(`ERROR: ${error.message}`);
            setResponse(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
            setNodes(INITIAL_NODES.map(n => ({...n, status: n.id === 'gemini' ? 'learning' : 'idle'})));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center">
                        <BrainCircuitIcon className="w-8 h-8 mr-3 text-cyan-400" />
                        Neural Evolution Core
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${isProcessing ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></span>
                        STATUS: {isProcessing ? 'SCANNING GLOBAL NETWORK...' : 'LEVEL 5: SELF-AWARE'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* VISUALIZER */}
                    <Card className="relative h-[450px] bg-gray-900 border-2 border-cyan-900/50 overflow-hidden shadow-2xl p-0">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {nodes.filter(n => n.type === 'input').map(input => (
                                <NeuralConnection 
                                    key={`conn-${input.id}`} 
                                    start={input} 
                                    end={nodes.find(n => n.id === 'gemini')!} 
                                    active={input.status === 'active'}
                                    processing={isProcessing}
                                />
                            ))}
                            {nodes.filter(n => n.type === 'output').map(output => (
                                <NeuralConnection 
                                    key={`conn-${output.id}`} 
                                    start={nodes.find(n => n.id === 'gemini')!} 
                                    end={output} 
                                    active={output.status === 'active'}
                                    processing={isProcessing}
                                />
                            ))}
                        </svg>
                        {nodes.map(node => <NeuralNodeVisual key={node.id} node={node} />)}
                    </Card>

                    {/* LIVE LOGS */}
                    <Card title="Live Synapse Stream" className="bg-black border-gray-700 font-mono text-xs h-48 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar flex flex-col-reverse">
                            {logs.map((log, i) => (
                                <div key={i} className="text-gray-400 border-b border-gray-800/50 pb-0.5 animate-fade-in break-all">
                                    <span className="text-cyan-600 mr-2">➜</span>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* R&D SCANNER */}
                    <Card title="R&D Scanner (Google Grounding)">
                        <div className="space-y-3">
                            <div className="flex items-center text-xs text-gray-500 mb-2">
                                <GoogleIcon className="w-4 h-4 mr-2" />
                                <span>Search-Augmented Generation Active</span>
                            </div>
                            <input 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter trend query..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                            />
                            <button 
                                onClick={handleRunRDScan}
                                disabled={isProcessing || !prompt.trim()}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? <BotIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparkleIcon className="w-4 h-4 mr-2"/>}
                                {isProcessing ? 'Analysing Trends...' : 'Scan Future Trends'}
                            </button>
                        </div>
                        {response && (
                            <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700 max-h-60 overflow-y-auto custom-scrollbar">
                                <div className="text-xs text-gray-300 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: response }} />
                            </div>
                        )}
                    </Card>
                    
                    {/* AUTONOMOUS FUTURE LOG */}
                    <Card title="Evolution Roadmap">
                        <div className="space-y-3">
                            {futureLog.map((item, i) => (
                                <div key={i} className="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-700">
                                    <span className="text-xs text-gray-300">{item.item}</span>
                                    <span className="text-[10px] text-cyan-400 font-bold bg-cyan-900/20 px-2 py-0.5 rounded">{item.eta}</span>
                                </div>
                            ))}
                            <div className="mt-2 text-center">
                                <span className="text-[10px] text-gray-500 animate-pulse">Calculating Churn Probability (P > 0.7)...</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NeuralSystemCore;
