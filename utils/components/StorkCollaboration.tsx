
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Card from './common/Card';
import { StorkIcon } from './icons/StorkIcon';
import { BotIcon } from './icons/BotIcon';
import { 
    MessageSquare, Mic, Video, Send, 
    Sparkles, ShieldCheck, Activity, Terminal, 
    Layers, Zap, Clock, Users, Plus, 
    CheckCircle, ListTodo, Hash, Volume2,
    RefreshCw, ChevronRight, FileText, Share2,
    Search, Pin, Filter, MoreVertical, Globe,
    Radio, BrainCircuit, Scan, Target
} from 'lucide-react';
import { getComplexResponse } from '../../lib/gemini';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';

// --- TYPES ---
interface StorkChannel {
    id: string;
    name: string;
    description: string;
    type: 'public' | 'secure';
    unread?: number;
    missionCount: number;
    securityLevel: number;
}

interface StorkMessage {
    id: string;
    sender: string;
    avatar: string;
    type: 'text' | 'voice' | 'mission' | 'alert';
    content: string;
    transcript?: string;
    timestamp: string;
    sentiment?: 'Neutral' | 'Urgent' | 'Positive' | 'Critical';
    readBy: number;
}

interface ExtractedMission {
    id: string;
    title: string;
    assignee: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Pending' | 'Active' | 'Complete';
}

const StorkCollaboration: React.FC = () => {
    const { addToast } = useToast();
    const { members } = useData();
    
    // Core State
    const [activeTab, setActiveTab] = useState<'stream' | 'hive_mind' | 'war_room'>('stream');
    const [activeChannelId, setActiveChannelId] = useState('general');
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    
    // Singularity Features
    const [hiveSync, setHiveSync] = useState(88); // Team Alignment Score
    const [isThinking, setIsThinking] = useState(false);
    const [extractedMissions, setExtractedMissions] = useState<ExtractedMission[]>([]);
    
    // Data
    const [channels, setChannels] = useState<StorkChannel[]>([
        { id: 'general', name: 'Global Command', description: 'Central Ops', type: 'public', missionCount: 12, securityLevel: 1 },
        { id: 'trainers', name: 'Trainers Pit', description: 'Coaching Protocols', type: 'secure', unread: 3, missionCount: 5, securityLevel: 3 },
        { id: 'treasury', name: 'Treasury Node', description: 'Fiscal & Billing', type: 'secure', missionCount: 2, securityLevel: 5 },
        { id: 'maintenance', name: 'Fortress Guard', description: 'Infra Status', type: 'public', missionCount: 8, securityLevel: 2 },
    ]);

    const [messages, setMessages] = useState<StorkMessage[]>([
        { id: 'm1', sender: 'Mahesh Saini', avatar: 'https://i.pravatar.cc/150?u=mahesh', type: 'text', content: 'Neural Eye v31.0 deployed. Calibrate your scanners.', timestamp: '08:30 AM', sentiment: 'Positive', readBy: 5 },
        { id: 'm2', sender: 'Ravi Trainer', avatar: 'https://i.pravatar.cc/150?u=ravi', type: 'alert', content: 'AC Unit 4 in Cardio Zone is vibrating excessively. Requesting diagnostics.', timestamp: '09:12 AM', sentiment: 'Urgent', readBy: 4 },
        { id: 'm3', sender: 'Finance Bot', avatar: 'https://i.ibb.co/6800735/Royal-The-Gym.png', type: 'mission', content: 'Revenue Oracle identified 12 high-probability renewals.', timestamp: '10:00 AM', sentiment: 'Neutral', readBy: 2 }
    ]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages]);

    // Live Pulse Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setHiveSync(prev => Math.min(100, Math.max(60, prev + (Math.random() * 4 - 2))));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // --- ACTIONS ---

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        
        const newMsg: StorkMessage = {
            id: Date.now().toString(),
            sender: 'Admin (You)',
            avatar: 'https://i.pravatar.cc/150?u=admin',
            type: 'text',
            content: inputText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sentiment: 'Neutral',
            readBy: 0
        };

        setMessages(prev => [...prev, newMsg]);
        setInputText('');
        
        // Auto-Extract Mission (AI Sim)
        if (inputText.toLowerCase().includes('fix') || inputText.toLowerCase().includes('check') || inputText.toLowerCase().includes('call')) {
            setIsThinking(true);
            setTimeout(() => {
                const mission: ExtractedMission = {
                    id: `TASK-${Date.now()}`,
                    title: inputText,
                    assignee: 'Auto-Assigned',
                    priority: 'Medium',
                    status: 'Active'
                };
                setExtractedMissions(prev => [mission, ...prev]);
                addToast("Neural Core extracted a new mission from your directive.", "success");
                setIsThinking(false);
            }, 1500);
        }
    };

    const runHiveAudit = async () => {
        setIsThinking(true);
        addToast("Hive Mind: Analyzing Communication Vectors...", "info");
        
        const prompt = `
            ACT AS STORK HIVE MIND (AI).
            Analyze recent chat logs: ${messages.map(m => m.content).join(' | ')}.
            
            OUTPUT JSON:
            {
                "alignment_score": 92,
                "mood": "Focused",
                "bottlenecks": ["Maintenance delay"],
                "directive": "Prioritize AC repair in Cardio Zone."
            }
        `;

        try {
            // Simulated AI processing for speed
            await new Promise(r => setTimeout(r, 2000));
            addToast("Audit Complete. Directive: Prioritize AC Repair.", "success");
            setHiveSync(98);
        } catch (e) {
            addToast("Neural Link Weak.", "error");
        } finally {
            setIsThinking(false);
        }
    };

    const activeChannel = channels.find(c => c.id === activeChannelId);

    return (
        <div className="h-[calc(100vh-120px)] flex gap-6 animate-fade-in overflow-hidden pb-4">
            
            {/* 1. LEFT SIDEBAR (CHANNELS) */}
            <div className="w-80 flex flex-col gap-6">
                <Card className="flex-1 bg-[#020308] border-white/5 p-6 rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden group">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                        <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)]">
                            <StorkIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Team <span className="text-indigo-500">Stork</span></h2>
                            <p className="text-[9px] text-gray-500 font-mono tracking-widest mt-1">HIVE_LINK v31.0</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4 pl-4">Neural Nodes</p>
                        {channels.map((chan) => (
                            <button
                                key={chan.id}
                                onClick={() => setActiveChannelId(chan.id)}
                                className={`w-full group/btn p-4 rounded-2xl flex items-center justify-between transition-all relative overflow-hidden ${
                                    activeChannelId === chan.id 
                                    ? 'bg-indigo-900/20 text-white border border-indigo-500/30 shadow-lg' 
                                    : 'bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-2 h-2 rounded-full ${activeChannelId === chan.id ? 'bg-indigo-400 animate-pulse' : 'bg-gray-700'}`}></div>
                                    <span className="text-xs font-bold uppercase tracking-wide">{chan.name}</span>
                                </div>
                                {chan.unread && (
                                    <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg animate-pulse relative z-10">{chan.unread}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                         <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] font-black text-gray-500 uppercase">Hive Sync</span>
                             <span className={`text-sm font-black italic ${hiveSync > 90 ? 'text-green-400' : 'text-amber-500'}`}>{hiveSync.toFixed(0)}%</span>
                         </div>
                         <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                             <div className={`h-full transition-all duration-1000 ${hiveSync > 90 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${hiveSync}%` }}></div>
                         </div>
                    </div>
                </Card>
            </div>

            {/* 2. CENTER: NEURAL STREAM (CHAT) */}
            <div className="flex-1 flex flex-col gap-6">
                <Card className="bg-[#050505] border-white/5 p-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center relative overflow-hidden">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-gray-900 rounded-2xl text-gray-400 border border-white/5"><Hash className="w-6 h-6" /></div>
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">{activeChannel?.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{activeChannel?.description}</span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Level {activeChannel?.securityLevel}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('stream')} className={`p-3 rounded-xl transition-all ${activeTab === 'stream' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400'}`}><MessageSquare className="w-5 h-5"/></button>
                        <button onClick={() => setActiveTab('hive_mind')} className={`p-3 rounded-xl transition-all ${activeTab === 'hive_mind' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400'}`}><BrainCircuit className="w-5 h-5"/></button>
                        <button onClick={() => setActiveTab('war_room')} className={`p-3 rounded-xl transition-all ${activeTab === 'war_room' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400'}`}><Globe className="w-5 h-5"/></button>
                    </div>
                </Card>

                {activeTab === 'stream' && (
                    <div className="flex-1 bg-[#080808] rounded-[3.5rem] border border-white/5 p-8 flex flex-col relative overflow-hidden shadow-inner">
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-4 mb-6">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-4 animate-slide-up ${msg.sender === 'Admin (You)' ? 'flex-row-reverse' : ''}`}>
                                    <div className="relative">
                                        <img src={msg.avatar} className="w-10 h-10 rounded-2xl object-cover border border-white/10" alt="avatar" />
                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${msg.readBy > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                    </div>
                                    <div className={`max-w-[70%]`}>
                                        <div className={`flex items-center gap-2 mb-1 ${msg.sender === 'Admin (You)' ? 'justify-end' : ''}`}>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{msg.sender}</span>
                                            {msg.sentiment === 'Urgent' && <span className="text-[9px] text-red-500 font-black uppercase tracking-widest bg-red-900/20 px-2 rounded">Urgent</span>}
                                        </div>
                                        <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-lg relative overflow-hidden ${
                                            msg.type === 'alert' ? 'bg-red-900/10 border border-red-500/30 text-red-200' :
                                            msg.type === 'mission' ? 'bg-amber-900/10 border border-amber-500/30 text-amber-100' :
                                            msg.sender === 'Admin (You)' ? 'bg-indigo-600 text-white rounded-tr-none' : 
                                            'bg-gray-900 text-gray-300 rounded-tl-none border border-white/5'
                                        }`}>
                                            {msg.type === 'voice' && <Mic className="w-4 h-4 inline mr-2 animate-pulse"/>}
                                            {msg.type === 'mission' && <Target className="w-4 h-4 inline mr-2 text-amber-400"/>}
                                            {msg.content}
                                            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center opacity-70">
                                                <span className="text-[9px] font-mono">{msg.timestamp}</span>
                                                {msg.sender === 'Admin (You)' && <CheckCircle className="w-3 h-3"/>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="bg-black/60 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white/10 flex items-center gap-2">
                            <button className="p-4 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all"><Plus className="w-5 h-5"/></button>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`Transmitting to ${activeChannel?.name}...`}
                                className="flex-1 bg-transparent text-white text-sm font-medium placeholder-gray-600 outline-none px-2"
                            />
                            <button 
                                className={`p-4 rounded-full transition-all ${isRecording ? 'bg-red-600 text-white animate-pulse' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                                onMouseDown={() => setIsRecording(true)}
                                onMouseUp={() => setIsRecording(false)}
                            >
                                <Mic className="w-5 h-5"/>
                            </button>
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputText.trim()}
                                className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5 fill-current"/>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. RIGHT PANEL (HIVE MIND) */}
                {activeTab === 'hive_mind' && (
                    <div className="flex-1 grid grid-cols-2 gap-6 animate-slide-up">
                        <Card className="bg-gray-950 border-white/5 rounded-[3rem] p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><BrainCircuit className="w-48 h-48 text-indigo-400"/></div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-6">Extracted Missions</h3>
                            
                            <div className="space-y-4 relative z-10">
                                {extractedMissions.length === 0 && <p className="text-gray-500 text-sm italic">No active neural tasks.</p>}
                                {extractedMissions.map(mission => (
                                    <div key={mission.id} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-amber-500/30 transition-all">
                                        <div>
                                            <p className="text-xs font-bold text-white mb-1">{mission.title}</p>
                                            <div className="flex gap-2">
                                                <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{mission.assignee}</span>
                                                <span className="text-[9px] text-amber-500 font-black uppercase">{mission.priority}</span>
                                            </div>
                                        </div>
                                        <button className="p-2 bg-gray-900 rounded-xl text-gray-500 hover:text-green-400 transition-colors"><CheckCircle className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        <Card className="bg-indigo-900/10 border-indigo-500/20 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center">
                             <div className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center border-4 border-indigo-500/30 mb-6 shadow-[0_0_50px_rgba(99,102,241,0.3)] animate-pulse">
                                 <Activity className="w-12 h-12 text-indigo-400" />
                             </div>
                             <h3 className="text-3xl font-black text-white italic">{hiveSync}%</h3>
                             <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mb-6">Hive Alignment</p>
                             <button 
                                onClick={runHiveAudit}
                                disabled={isThinking}
                                className="bg-white text-indigo-900 font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                            >
                                {isThinking ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                {isThinking ? 'Analyzing...' : 'Run Audit'}
                            </button>
                        </Card>
                    </div>
                )}
                
                {activeTab === 'war_room' && (
                    <div className="flex-1 bg-black rounded-[3.5rem] border border-white/5 p-0 relative overflow-hidden flex flex-col items-center justify-center animate-scale-in">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent"></div>
                        <Globe className="w-48 h-48 text-gray-800 animate-spin-slow duration-[20s]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-gray-500 font-black uppercase tracking-[0.5em] text-xs">Holographic Grid Offline</p>
                        </div>
                        <button className="mt-8 bg-gray-900 border border-white/10 text-white font-bold px-8 py-3 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all">
                            Initialize 3D View
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StorkCollaboration;
