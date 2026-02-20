
import React, { useState, useRef, useEffect } from 'react';
import Card from './common/Card';
import { 
    BrainCircuit, Cpu, Zap, Image as ImageIcon, 
    Terminal, RefreshCw, ChevronDown, ChevronRight, 
    Send, ShieldCheck, Database, Activity, 
    Code, Fingerprint, Waves, Sparkles, Server, Eye
} from 'lucide-react';
import { getComplexResponse } from '../../lib/gemini';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';

type ModelType = 'reasoning' | 'general' | 'visual';

interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    thought?: string; 
    image?: string;   
    metadata?: {
        tokens: number;
        latency: string;
        model: string;
    };
}

const GeminiHub: React.FC = () => {
    const { addToast } = useToast();
    const { members, activeMemberCount, totalRevenue, invoices, systemHealth } = useData();
    const [aiProvider] = useState(localStorage.getItem('royal_ai_provider') || 'HUGGINGFACE');
    
    const [activeModel, setActiveModel] = useState<ModelType>('reasoning');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentThinkingStep, setCurrentThinkingStep] = useState('');
    const [isLocalCore, setIsLocalCore] = useState(false); // Track if local logic was used
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentThinkingStep]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMsg = input;
        const startTime = Date.now();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            setCurrentThinkingStep(`${aiProvider} Core: Processing...`);
            
            // Using the universal wrapper which handles provider switching and local logic
            const responseText = await getComplexResponse(userMsg);

            const latency = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
            
            // Heuristic check to see if local core was used based on speed or content
            const usedLocal = latency < "1.00s" || responseText.includes("Local Core");
            setIsLocalCore(usedLocal);

            setMessages(prev => [...prev, { 
                role: 'model', 
                content: responseText,
                thought: usedLocal ? "Processed via Local Neural Engine (Zero Cost)." : "Live Cloud Inference complete.",
                metadata: { tokens: responseText.length / 4, latency, model: usedLocal ? 'Royal-Local-v1' : `${aiProvider}-v30` }
            }]);

        } catch (error: any) {
            addToast("Neural Link Failure.", "error");
            setMessages(prev => [...prev, { role: 'model', content: `Error: ${error.message}` }]);
        } finally {
            setIsLoading(false);
            setCurrentThinkingStep('');
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-fade-in">
            {/* ROYAL COMMAND HEADER */}
            <div className="bg-[#020308] p-8 rounded-[3.5rem] border border-cyan-500/30 relative overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] flex-shrink-0 group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-40 -top-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-cyan-600 text-black rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.4)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                            <BrainCircuit className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Sovereign <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Hub</span>
                            </h1>
                            <div className="flex gap-4 mt-2">
                                <p className="text-gray-500 text-[10px] font-mono tracking-[0.5em] uppercase font-bold flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${aiProvider === 'SIMULATION' ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                                    Provider: {aiProvider}
                                </p>
                                <p className="text-cyan-400 text-[10px] font-mono tracking-[0.2em] uppercase font-bold flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Local Core: ONLINE
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHAT DECK */}
            <Card className="flex-1 bg-black/40 border-white/5 flex flex-col overflow-hidden relative rounded-[3.5rem] shadow-2xl">
                 <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-40">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse"></div>
                                <div className="w-32 h-32 rounded-full border-4 border-dashed border-cyan-500/30 flex items-center justify-center animate-spin-slow relative z-10">
                                    <Eye className="w-12 h-12 text-cyan-400" />
                                </div>
                            </div>
                            <div>
                                <p className="font-mono text-xs uppercase tracking-[0.5em] text-cyan-400">Sovereign Node: STANDBY</p>
                                <p className="text-[10px] text-gray-500 mt-2 uppercase font-black">
                                    Hybrid Engine: Local + {aiProvider}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[85%] p-7 rounded-[2.5rem] relative overflow-hidden ${
                                msg.role === 'user' 
                                ? 'bg-cyan-900/20 text-cyan-100 rounded-br-none border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)]' 
                                : 'bg-[#050505] text-gray-200 rounded-bl-none border border-white/10 shadow-2xl backdrop-blur-3xl'
                            }`}>
                                <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed font-medium" 
                                     dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} 
                                />
                                {msg.thought && (
                                    <div className="mt-4 pt-3 border-t border-white/5 text-[9px] text-gray-500 font-mono flex items-center gap-2">
                                        <Terminal className="w-3 h-3" /> {msg.thought}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-8 bg-[#020202] border-t border-white/5 relative">
                    <div className="relative flex items-center group">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Inject Instruction (e.g. 'Create chest workout' or 'Diet plan')..."
                            className="w-full bg-[#080808] border border-white/10 rounded-[2rem] py-6 pl-8 pr-20 focus:outline-none focus:border-cyan-500/50 text-white placeholder-gray-700 font-mono text-sm transition-all shadow-inner group-hover:border-white/20"
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-4 p-4 rounded-2xl bg-cyan-600 text-black hover:bg-cyan-500 transition-all shadow-2xl active:scale-95"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default GeminiHub;
