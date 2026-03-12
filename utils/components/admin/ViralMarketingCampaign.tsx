import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Rocket, Globe, Share2, MessageSquare, Instagram, Facebook, 
    Smartphone, Zap, Target, Users, TrendingUp, Activity, 
    CheckCircle2, AlertTriangle, Play, Pause, RefreshCw, Sparkles, Calendar, Clock, Send
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const ViralMarketingCampaign: React.FC = () => {
    const { addToast } = useToast();
    const [campaignState, setCampaignState] = useState<'idle' | 'generating' | 'ready' | 'active'>('idle');
    const [reachData, setReachData] = useState<any[]>([]);
    const [totalReach, setTotalReach] = useState(0);
    const [activeChannels, setActiveChannels] = useState({
        whatsapp: true,
        instagram: true,
        facebook: true,
        googleAds: true,
        telegram: false
    });

    const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
    const [scheduleDate, setScheduleDate] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');

    const phases = [
        {
            id: 1,
            name: "Layer 1: The Teaser",
            timing: "7 Days Before Launch",
            content: "Mysterious video: 'AI Eye' (Titan Vision) glowing over Jhunjhunu landmarks.",
            hook: "झुंझुनूं, क्या आप भविष्य के लिए तैयार हैं? 7 दिन शेष।"
        },
        {
            id: 2,
            name: "Layer 2: The AI Reveal",
            timing: "3 Days Before Launch",
            content: "Demo video of 'Titan Vision' & 'Bio-Aether Oracle'.",
            hook: "अब जिम में केवल पसीना नहीं बहेगा, डेटा बोलेगा। मिलिए दुनिया के सबसे एडवांस एआई कोच से।"
        },
        {
            id: 3,
            name: "Layer 3: Grand Opening",
            timing: "Launch Day",
            content: "Direct Call-to-Action with Scarcity Marketing.",
            hook: "पहले 50 मेंबर्स के लिए 'The Aether-Pass' और एआई डॉक्टर कंसल्टेशन लाइफटाइम फ्री।"
        }
    ];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (campaignState === 'active') {
            interval = setInterval(() => {
                const newReach = Math.floor(Math.random() * 800) + 200;
                setTotalReach(prev => {
                    const nextTotal = prev + newReach;
                    if (nextTotal >= 100000) {
                        clearInterval(interval);
                        addToast("VIRAL TARGET REACHED: 1,00,000+ Impressions!", "success");
                        return 100000;
                    }
                    return nextTotal;
                });
                
                const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
                setReachData(prev => {
                    const newData = [...prev, { time, reach: newReach, total: totalReach + newReach }];
                    if (newData.length > 20) newData.shift();
                    return newData;
                });
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [campaignState, totalReach]);

    const handleGenerateAI = () => {
        setCampaignState('generating');
        addToast("AI Overmind is analyzing Jhunjhunu demographics...", "info");
        
        setTimeout(() => {
            setCampaignState('ready');
            addToast("3-Layer Viral Campaign Assets Generated Successfully.", "success");
        }, 3000);
    };

    const handleLaunch = () => {
        if (!scheduleDate || !scheduleTime) {
            addToast("Please select a launch date and time.", "error");
            return;
        }
        setCampaignState('active');
        addToast(`VIRAL PROTOCOL SCHEDULED FOR: ${scheduleDate} ${scheduleTime}. Broadcasting to Jhunjhunu network...`, "success");
        setReachData([]);
        setTotalReach(0);
    };

    const handleStop = () => {
        setCampaignState('ready');
        addToast("Campaign paused. Analyzing metrics.", "info");
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="bg-black border border-pink-500/30 rounded-[2rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.15)] shrink-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-pink-500/20 border border-pink-500/50 rounded-full flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${campaignState === 'active' ? 'bg-green-400 animate-pulse' : 'bg-pink-400'}`}></span>
                                <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">
                                    {campaignState === 'active' ? 'Campaign Live' : 'Marketing Nexus'}
                                </span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            Viral <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">Launchpad</span>
                        </h1>
                        <p className="text-sm text-zinc-400 font-mono mt-2 max-w-xl">
                            Phase 5: The Singularity. A 3-Layer Digital Blast targeting every smartphone within a 20km radius of Jhunjhunu.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Target Area</p>
                            <p className="text-xl font-black text-white">Jhunjhunu</p>
                            <p className="text-[9px] text-pink-400 uppercase tracking-widest mt-1">+20km Radius</p>
                        </div>
                        <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Reach</p>
                            <p className="text-3xl font-black text-emerald-400">{totalReach.toLocaleString()}</p>
                            <p className="text-[9px] text-emerald-500/70 uppercase tracking-widest mt-1">Target: 100k+</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* Left Column: Campaign Setup & Assets */}
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
                    
                    {/* Strategy Layers */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-pink-500/30 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400"><Sparkles className="w-6 h-6" /></div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">3-Layer Digital Blast</h3>
                                    <p className="text-[10px] font-mono text-pink-400/70 uppercase">Scarcity & Hyper-Local Targeting</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleGenerateAI}
                                disabled={campaignState === 'generating' || campaignState === 'active'}
                                className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {campaignState === 'generating' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                Generate Assets
                            </button>
                        </div>

                        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                            {phases.map(phase => (
                                <button
                                    key={phase.id}
                                    onClick={() => setActivePhase(phase.id as 1 | 2 | 3)}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activePhase === phase.id ? 'bg-pink-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                                >
                                    Layer {phase.id}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activePhase}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                    <div>
                                        <h4 className="text-sm font-black text-white">{phases[activePhase - 1].name}</h4>
                                        <p className="text-xs text-pink-400 font-mono mt-1">{phases[activePhase - 1].timing}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-[10px] font-bold uppercase">
                                        {campaignState === 'ready' || campaignState === 'active' ? 'Ready' : 'Pending'}
                                    </div>
                                </div>
                                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4">
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Content Strategy</label>
                                    <div className="text-sm text-zinc-300 leading-relaxed">{phases[activePhase - 1].content}</div>
                                </div>
                                <div className="bg-pink-900/20 border border-pink-500/30 rounded-xl p-4">
                                    <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-2">The Hook / Offer</label>
                                    <div className="text-sm font-bold text-pink-200">{phases[activePhase - 1].hook}</div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Channels (The Nexus Blast) */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Share2 className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">The Nexus Blast</h3>
                                <p className="text-[10px] font-mono text-blue-400/70 uppercase">Automated Omni-Channel Distribution</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <button 
                                onClick={() => setActiveChannels(p => ({...p, googleAds: !p.googleAds}))}
                                disabled={campaignState === 'active'}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${activeChannels.googleAds ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/20'}`}
                            >
                                <Globe className="w-8 h-8" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-center">Google Ads<br/><span className="text-[8px] opacity-70">#1 on Search</span></span>
                            </button>
                            <button 
                                onClick={() => setActiveChannels(p => ({...p, whatsapp: !p.whatsapp}))}
                                disabled={campaignState === 'active'}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${activeChannels.whatsapp ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/20'}`}
                            >
                                <MessageSquare className="w-8 h-8" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-center">WhatsApp<br/><span className="text-[8px] opacity-70">Interactive Msgs</span></span>
                            </button>
                            <button 
                                onClick={() => setActiveChannels(p => ({...p, instagram: !p.instagram}))}
                                disabled={campaignState === 'active'}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${activeChannels.instagram ? 'bg-pink-500/10 border-pink-500/50 text-pink-400' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/20'}`}
                            >
                                <Instagram className="w-8 h-8" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-center">Insta/FB<br/><span className="text-[8px] opacity-70">Auto-Reels</span></span>
                            </button>
                            <button 
                                onClick={() => setActiveChannels(p => ({...p, telegram: !p.telegram}))}
                                disabled={campaignState === 'active'}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${activeChannels.telegram ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/20'}`}
                            >
                                <Send className="w-8 h-8" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-center">Telegram<br/><span className="text-[8px] opacity-70">Local Groups</span></span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Launch & Analytics */}
                <div className="flex flex-col gap-6 min-h-0">
                    
                    {/* Launch Control */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 shrink-0 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Rocket className="w-32 h-32 text-orange-500" /></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4 text-zinc-400" /> Mission Control
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Launch Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input 
                                            type="date" 
                                            value={scheduleDate}
                                            onChange={(e) => setScheduleDate(e.target.value)}
                                            disabled={campaignState === 'active'}
                                            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Launch Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input 
                                            type="time" 
                                            value={scheduleTime}
                                            onChange={(e) => setScheduleTime(e.target.value)}
                                            disabled={campaignState === 'active'}
                                            className="w-full bg-zinc-900/80 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {campaignState !== 'active' ? (
                                <button 
                                    onClick={handleLaunch}
                                    disabled={campaignState === 'idle' || campaignState === 'generating'}
                                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-500 hover:to-pink-500 text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Rocket className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                                    Schedule Blast
                                </button>
                            ) : (
                                <button 
                                    onClick={handleStop}
                                    className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-400 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)] flex items-center justify-center gap-3"
                                >
                                    <Pause className="w-5 h-5" />
                                    Pause Campaign
                                </button>
                            )}

                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                                    <span className="text-xs font-mono text-zinc-400">Status</span>
                                    <span className={`text-xs font-bold uppercase ${campaignState === 'active' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`}>
                                        {campaignState === 'active' ? 'SCHEDULED / LIVE' : 'STANDBY'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center bg-zinc-900/50 p-3 rounded-lg border border-white/5">
                                    <span className="text-xs font-mono text-zinc-400">Est. Conversions</span>
                                    <span className="text-xs font-bold text-cyan-400">100+ (Day 1)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Live Analytics */}
                    <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-6 flex-1 flex flex-col relative overflow-hidden group hover:border-emerald-500/30 transition-colors min-h-[250px]">
                        <div className="flex items-center gap-3 mb-4 shrink-0 relative z-10">
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><TrendingUp className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Live Impact</h3>
                                <p className="text-[10px] font-mono text-emerald-400/70 uppercase">Real-time Reach Metrics</p>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative z-10 min-h-[150px]">
                            {reachData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={reachData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="time" stroke="#ffffff30" fontSize={10} tickMargin={10} />
                                        <YAxis stroke="#ffffff30" fontSize={10} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#000', borderColor: '#ffffff20', borderRadius: '8px', fontSize: '12px' }}
                                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                        />
                                        <Area type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorReach)" isAnimationActive={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                                    <Activity className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-xs font-mono uppercase tracking-widest">Awaiting Launch Sequence</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
