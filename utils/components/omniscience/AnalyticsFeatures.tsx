import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { 
    Bot, Activity, Cpu, Box, Share2, BrainCircuit, 
    Network, Glasses, RefreshCw, Zap, ShieldCheck, 
    MessageSquare, AlertTriangle, Fingerprint, Globe,
    ChevronRight, Play, Pause, Thermometer, Wind,
    Heart, Dna, Database, Terminal, CheckCircle
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';

// --- 1. INTAKE BOT ---
export const IntakeBot: React.FC = () => {
    const [messages, setMessages] = useState<{sender: 'bot'|'user', text: string}[]>([
        { sender: 'bot', text: 'INITIATING NEURAL INTAKE SEQUENCE...' },
        { sender: 'bot', text: 'Welcome to Fitness Future. State your primary objective.' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { sender: 'user', text: input }]);
        setInput('');
        setTimeout(() => {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Processing biometric signature... Objective logged. Optimizing protocol.' }]);
        }, 1000);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-black border-cyan-500/30 p-6 rounded-[2rem] h-[600px] flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="flex items-center gap-4 mb-6 relative z-10 border-b border-cyan-500/20 pb-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl"><Bot className="w-6 h-6 text-cyan-400" /></div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest">Intake Bot Fitness Future</h2>
                        <p className="text-xs text-cyan-500 font-mono">omniscience Core Active</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 relative z-10 no-scrollbar">
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 rounded-2xl font-mono text-sm ${
                                m.sender === 'user' 
                                ? 'bg-cyan-600 text-black rounded-tr-none' 
                                : 'bg-gray-900 border border-cyan-500/30 text-cyan-400 rounded-tl-none'
                            }`}>
                                {m.text}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2 relative z-10">
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Enter command..."
                        className="flex-1 bg-gray-900 border border-cyan-500/30 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                    <button onClick={handleSend} className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 rounded-xl font-black uppercase tracking-widest transition-colors">
                        Send
                    </button>
                </div>
            </Card>
        </div>
    );
};

// --- 2. INJURY AI ---
export const InjuryAI: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-gradient-to-br from-red-900/20 to-black border-red-500/30 p-8 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-64 h-64 text-red-500" /></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Injury AI</h2>
                        </div>
                        <p className="text-red-400 font-mono text-xs mb-8">PREDICTIVE TRAUMA ANALYSIS</p>
                        
                        <div className="space-y-4">
                            {[
                                { part: 'Left Knee', risk: '87%', status: 'Critical Tension' },
                                { part: 'Lower Back', risk: '42%', status: 'Moderate Stress' },
                                { part: 'Right Shoulder', risk: '12%', status: 'Optimal' }
                            ].map((item, i) => (
                                <div key={i} className="bg-black/50 border border-red-500/20 p-4 rounded-2xl flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-bold">{item.part}</h4>
                                        <p className="text-xs text-gray-500">{item.status}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xl font-black ${parseInt(item.risk) > 50 ? 'text-red-500' : 'text-green-500'}`}>{item.risk}</span>
                                        <p className="text-[10px] text-gray-500 uppercase">Risk</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="w-64 h-80 border-2 border-red-500/30 rounded-full relative flex items-center justify-center bg-red-500/5">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-20 rounded-full"></div>
                            <div className="w-full h-1 bg-red-500/50 absolute top-1/2 animate-scan"></div>
                            <Activity className="w-32 h-32 text-red-500/50" />
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// --- 3. SENSOR ---
export const SensorHub: React.FC = () => {
    const data = Array.from({length: 20}, (_, i) => ({ time: i, hr: 60 + Math.random() * 40, temp: 36 + Math.random() * 2 }));
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-black border-green-500/30 p-8 rounded-[3rem] relative overflow-hidden">
                <div className="flex items-center gap-3 mb-8">
                    <Cpu className="w-8 h-8 text-green-500" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">IoT Sensor Array</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Heart Rate', val: '142 BPM', icon: <Heart className="w-5 h-5 text-red-500"/> },
                        { label: 'Core Temp', val: '37.8°C', icon: <Thermometer className="w-5 h-5 text-orange-500"/> },
                        { label: 'O2 Saturation', val: '98%', icon: <Wind className="w-5 h-5 text-blue-500"/> },
                        { label: 'Muscle Tension', val: 'High', icon: <Zap className="w-5 h-5 text-yellow-500"/> }
                    ].map((s, i) => (
                        <div key={i} className="bg-gray-900 border border-green-500/20 p-4 rounded-2xl">
                            <div className="mb-2">{s.icon}</div>
                            <p className="text-2xl font-black text-white">{s.val}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{s.label}</p>
                        </div>
                    ))}
                </div>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <Line type="monotone" dataKey="hr" stroke="#22c55e" strokeWidth={3} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};

// --- 4. 3D TWIN ---
export const DigitalTwin3D: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-gradient-to-br from-blue-900/20 to-black border-blue-500/30 p-8 rounded-[3rem] relative overflow-hidden min-h-[500px] flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                <Box className="w-32 h-32 text-blue-500 animate-spin-slow mb-8 relative z-10" />
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter relative z-10">3D Digital Twin</h2>
                <p className="text-blue-400 font-mono text-sm mt-2 relative z-10">RENDERING HOLOGRAPHIC PROJECTION...</p>
                <div className="mt-8 flex gap-4 relative z-10">
                    <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-black text-blue-400 uppercase">Skeletal</span>
                    <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-black text-blue-400 uppercase">Muscular</span>
                    <span className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-black text-blue-400 uppercase">Nervous</span>
                </div>
            </Card>
        </div>
    );
};

// --- 5. AUTO MARKET ---
export const AutoMarket: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-black border-purple-500/30 p-8 rounded-[3rem] relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-8 h-8 text-purple-500" />
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Auto Market</h2>
                    </div>
                    <span className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-xs font-black uppercase border border-purple-500/50 flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping"></div> Live
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-900 border border-purple-500/20 p-6 rounded-3xl">
                        <h4 className="text-gray-500 text-xs uppercase font-black mb-2">Campaigns Active</h4>
                        <p className="text-4xl font-black text-white">12</p>
                    </div>
                    <div className="bg-gray-900 border border-purple-500/20 p-6 rounded-3xl">
                        <h4 className="text-gray-500 text-xs uppercase font-black mb-2">WhatsApp Sent</h4>
                        <p className="text-4xl font-black text-white">4,592</p>
                    </div>
                    <div className="bg-gray-900 border border-purple-500/20 p-6 rounded-3xl">
                        <h4 className="text-gray-500 text-xs uppercase font-black mb-2">Conversion Rate</h4>
                        <p className="text-4xl font-black text-green-400">18.4%</p>
                    </div>
                </div>
                <div className="mt-8 bg-purple-900/20 border border-purple-500/30 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                        <h4 className="text-white font-bold">VIP 3D Invite Blast</h4>
                        <p className="text-xs text-gray-400">Target: Local Radius 5km</p>
                    </div>
                    <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-black uppercase text-xs transition-colors">
                        Execute
                    </button>
                </div>
            </Card>
        </div>
    );
};

// --- 6. NEURAL ---
export const SmartLink: React.FC = () => {
    const data = Array.from({length: 50}, (_, i) => ({ time: i, alpha: Math.random() * 100, beta: Math.random() * 100 }));
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-gradient-to-b from-indigo-900/20 to-black border-indigo-500/30 p-8 rounded-[3rem]">
                <div className="flex items-center gap-3 mb-8">
                    <BrainCircuit className="w-8 h-8 text-indigo-500" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Smart Sync</h2>
                </div>
                <div className="h-64 w-full mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <Area type="monotone" dataKey="alpha" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} isAnimationActive={false} />
                            <Area type="monotone" dataKey="beta" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-8">
                    <div className="text-center">
                        <p className="text-indigo-400 text-2xl font-black">84%</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Focus State</p>
                    </div>
                    <div className="text-center">
                        <p className="text-purple-400 text-2xl font-black">12Hz</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Alpha Waves</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// --- 7. AGENTIC BOTS ---
export const AutomatedSwarm: React.FC = () => {
    const agents = [
        { name: 'Diet-Prime', role: 'Nutrition Optimization', status: 'Active', color: 'text-green-400' },
        { name: 'Form-Check-X', role: 'Biomechanics', status: 'Active', color: 'text-blue-400' },
        { name: 'Sales-Bot-9', role: 'Lead Conversion', status: 'Processing', color: 'text-yellow-400' },
        { name: 'Recovery-AI', role: 'Sleep Analysis', status: 'Standby', color: 'text-gray-400' }
    ];
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-black border-cyan-500/30 p-8 rounded-[3rem]">
                <div className="flex items-center gap-3 mb-8">
                    <Network className="w-8 h-8 text-cyan-500" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Automated Swarm</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {agents.map((a, i) => (
                        <div key={i} className="bg-gray-900 border border-white/10 p-6 rounded-3xl hover:border-cyan-500/50 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <Bot className={`w-8 h-8 ${a.color}`} />
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${a.status === 'Active' ? 'border-green-500/50 text-green-400' : 'border-gray-500/50 text-gray-400'}`}>
                                    {a.status}
                                </span>
                            </div>
                            <h4 className="text-xl font-bold text-white">{a.name}</h4>
                            <p className="text-xs text-gray-500 font-mono mt-1">{a.role}</p>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

// --- 8. METAVERSE ---
export const GymMetaverse: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-gradient-to-br from-fuchsia-900/40 to-black border-fuchsia-500/30 p-8 rounded-[3rem] relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center text-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <Glasses className="w-24 h-24 text-fuchsia-500 mb-6 relative z-10" />
                <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter relative z-10">Metaverse Gym</h2>
                <p className="text-fuchsia-400 font-mono text-sm mt-4 relative z-10 max-w-md">Enter the virtual training ground. Train with AI avatars and global members in real-time.</p>
                <button className="mt-8 bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 shadow-[0_0_30px_rgba(192,38,211,0.4)] relative z-10">
                    Initialize VR Link
                </button>
            </Card>
        </div>
    );
};

// --- 9. SYNG ---
export const SyngCore: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="bg-black border-emerald-500/30 p-8 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><RefreshCw className="w-64 h-64 text-emerald-500 animate-spin-slow" /></div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                    <RefreshCw className="w-8 h-8 text-emerald-500" />
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">SYNG Core</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {[
                        { name: 'Apple Health', status: 'Synced', time: 'Just now' },
                        { name: 'Oura Ring', status: 'Synced', time: '2m ago' },
                        { name: 'Whoop', status: 'Syncing...', time: '--' },
                        { name: 'MyFitnessPal', status: 'Synced', time: '1h ago' },
                        { name: 'Garmin', status: 'Disconnected', time: '--' },
                        { name: 'Smart Implant', status: 'Active', time: 'Live' }
                    ].map((item, i) => (
                        <div key={i} className="bg-gray-900 border border-emerald-500/20 p-4 rounded-2xl flex items-center justify-between">
                            <div>
                                <h4 className="text-white font-bold text-sm">{item.name}</h4>
                                <p className="text-[10px] text-gray-500">{item.time}</p>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${item.status === 'Synced' || item.status === 'Active' ? 'bg-emerald-500' : item.status === 'Syncing...' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
