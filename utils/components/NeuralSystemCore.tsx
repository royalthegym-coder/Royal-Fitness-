
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { getComplexResponse } from '../../lib/gemini';

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
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(1024);
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Background idle animation
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

    const handleInjectPrompt = async () => {
        if (!prompt.trim()) return;
        setIsProcessing(true);
        setResponse('');
        addLog(`Injecting input payload: "${prompt.substring(0, 20)}..."`);
        
        // 1. Visualize Input Processing
        setNodes(prev => prev.map(n => n.id === 'input_text' ? { ...n, status: 'processing' } : n));
        await new Promise(r => setTimeout(r, 500));
        
        // 2. Visualize Core Processing
        setNodes(prev => prev.map(n => n.id === 'gemini' ? { ...n, status: 'processing' } : n));
        addLog(`Gemini Core engaged. Temp: ${temperature}, Tokens: ${maxTokens}`);

        try {
            // Use centralized function to ensure stability and auth
            const responseText = await getComplexResponse(prompt);
            setResponse(responseText);
            addLog(`Output received. Response length: ${responseText.length} chars.`);

            // 3. Visualize Output Distribution
            setNodes(prev => prev.map(n => (n.type === 'output' ? { ...n, status: 'processing' } : n)));
            await new Promise(r => setTimeout(r, 800));

        } catch (error: any) {
            console.error(error);
            addLog(`ERROR: ${error.message}`);
            setResponse(`Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
            setTimeout(() => {
                setNodes(INITIAL_NODES.map(n => ({...n, status: n.id === 'gemini' ? 'learning' : 'idle'})));
            }, 1000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center">
                        <BrainCircuitIcon className="w-8 h-8 mr-3 text-cyan-400" />
                        Neural System Core
                    </h1>
                    <p className="text-gray-400 text-sm mt-1 flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-2 ${isProcessing ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></span>
                        STATUS: {isProcessing ? 'PROCESSING REQUEST...' : 'ONLINE (IDLE)'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* VISUALIZER */}
                    <Card className="relative h-[450px] bg-gray-900 border-2 border-cyan-900/50 overflow-hidden shadow-2xl p-0">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            {/* Connections from Inputs to Core */}
                            {nodes.filter(n => n.type === 'input').map(input => (
                                <NeuralConnection 
                                    key={`conn-${input.id}`} 
                                    start={input} 
                                    end={nodes.find(n => n.id === 'gemini')!} 
                                    active={input.status === 'active'}
                                    processing={isProcessing && input.id === 'input_text'}
                                />
                            ))}
                            {/* Connections from Core to Outputs */}
                            {nodes.filter(n => n.type === 'output').map(output => (
                                <NeuralConnection 
                                    key={`conn-${output.id}`} 
                                    start={nodes.find(n => n.id === 'gemini')!} 
                                    end={output} 
                                    active={output.status === 'active'}
                                    processing={isProcessing && output.status === 'processing'}
                                />
                            ))}
                        </svg>
                        {nodes.map(node => <NeuralNodeVisual key={node.id} node={node} />)}
                        
                        <div className="absolute top-4 left-4 text-[10px] font-mono text-cyan-500/80">
                            <p>MODE: INTERACTIVE</p>
                            <p>LATENCY: {isProcessing ? Math.floor(Math.random() * 50 + 20) : 12}ms</p>
                        </div>
                        <div className="absolute bottom-4 right-4 text-[10px] font-mono text-purple-500/80 text-right">
                            <p>MODEL: GEMINI-3-FLASH</p>
                            <p>TEMP: {temperature}</p>
                        </div>
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
                    {/* CONTROLS */}
                    <Card title="Cognitive Parameters">
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                    <span>Creativity (Temperature)</span>
                                    <span className="text-cyan-400">{temperature}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="2" step="0.1" 
                                    value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                    <span>Logical</span>
                                    <span>Balanced</span>
                                    <span>Creative</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                    <span>Response Length (Max Tokens)</span>
                                    <span className="text-purple-400">{maxTokens}</span>
                                </div>
                                <input 
                                    type="range" min="100" max="8192" step="100" 
                                    value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* INTERACTION AREA */}
                    <Card title="Inject Neural Input">
                        <div className="space-y-3">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Enter system prompt or user query..."
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 h-24"
                            />
                            <button 
                                onClick={handleInjectPrompt}
                                disabled={isProcessing || !prompt.trim()}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg text-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? <BotIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparkleIcon className="w-4 h-4 mr-2"/>}
                                {isProcessing ? 'Processing...' : 'Process Request'}
                            </button>
                        </div>
                        {response && (
                            <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700 max-h-40 overflow-y-auto">
                                <p className="text-[10px] text-gray-500 uppercase mb-1">Output Layer</p>
                                <div className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{response}</div>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NeuralSystemCore;
