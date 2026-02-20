
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import { getComplexResponse } from '../../../lib/gemini';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, ReferenceLine } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { 
    Activity, Clock, Zap, MapPin, CloudRain, 
    Car, AlertTriangle, CheckCircle2, CalendarClock, 
    Bell, RefreshCw, Bot, ArrowRight, Sun, Wind
} from 'lucide-react';
import { BotIcon } from '../icons/BotIcon';

const SmartScheduler: React.FC<{ memberName: string; phone: string }> = ({ memberName, phone }) => {
    const { addToast } = useToast();

    // --- STATE ---
    const [targetTime, setTargetTime] = useState('18:00');
    const [durationGoal, setDurationGoal] = useState(60); 
    const [reminderEnabled, setReminderEnabled] = useState(true);
    
    // Live Context Simulation
    const [trafficLoad, setTrafficLoad] = useState<'Low' | 'Moderate' | 'Heavy'>('Moderate');
    const [weather, setWeather] = useState<'Clear' | 'Rain' | 'Heat'>('Clear');
    
    // Derived Metrics
    const [arrivalProb, setArrivalProb] = useState(85);
    const [bioScore, setBioScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
    
    // AI State
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [aiMessage, setAiMessage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // --- 1. BIO-RHYTHM DATA GENERATION ---
    const bioData = useMemo(() => {
        const data = [];
        for (let i = 6; i <= 22; i++) { // 6 AM to 10 PM
            // Simulate a dual-peak circadian rhythm (Morning & Evening peaks)
            let energy = 50 + (Math.sin((i - 6) / 3) * 30) + (Math.sin((i - 16) / 2) * 20);
            if (i === 12 || i === 13) energy -= 10; // Post-lunch dip
            
            data.push({
                time: `${i}:00`,
                hour: i,
                energy: Math.max(10, Math.min(100, Math.round(energy))),
                optimal: energy > 75
            });
        }
        return data;
    }, []);

    // --- 2. LIVE CALCULATIONS ENGINE ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const [h, m] = targetTime.split(':').map(Number);
            const target = new Date();
            target.setHours(h, m, 0, 0);
            
            if (now > target) target.setDate(target.getDate() + 1);

            const diff = target.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

            // Calculate Arrival Probability dynamically
            let prob = 90;
            if (trafficLoad === 'Heavy') prob -= 20;
            if (weather === 'Rain') prob -= 15;
            if (hours < 1) prob += 5; // Urgency boost
            
            // Random fluctuation
            setArrivalProb(Math.min(99, Math.max(10, prob + Math.floor(Math.random() * 4 - 2))));

        }, 1000);

        // Environment Simulation
        const envInterval = setInterval(() => {
            setTrafficLoad(Math.random() > 0.7 ? 'Heavy' : Math.random() > 0.4 ? 'Moderate' : 'Low');
            setWeather(Math.random() > 0.8 ? 'Rain' : Math.random() > 0.6 ? 'Heat' : 'Clear');
        }, 5000);

        return () => { clearInterval(interval); clearInterval(envInterval); };
    }, [targetTime, trafficLoad, weather]);

    // Recalculate Bio Score when time changes
    useEffect(() => {
        const [h] = targetTime.split(':').map(Number);
        const point = bioData.find(d => d.hour === h);
        setBioScore(point ? point.energy : 50);
    }, [targetTime, bioData]);

    // --- ACTIONS ---

    const handleAutoOptimize = () => {
        setIsOptimizing(true);
        addToast("Chronos: Scanning Bio-Rhythm & Traffic patterns...", "info");
        
        setTimeout(() => {
            // Find best slot: Max Energy
            const bestSlot = bioData.reduce((prev, current) => (prev.energy > current.energy) ? prev : current);
            setTargetTime(`${bestSlot.hour.toString().padStart(2, '0')}:00`);
            
            setIsOptimizing(false);
            addToast(`Optimal Window Found: ${bestSlot.hour}:00 (Energy Peak)`, "success");
        }, 1500);
    };

    const handleGenerateNudge = async () => {
        setIsGenerating(true);
        setAiMessage(null);
        
        const prompt = `
            Act as a Military Fitness AI.
            User: ${memberName}.
            Target Time: ${targetTime}.
            Current Context: Traffic is ${trafficLoad}, Energy Level is ${bioScore}%.
            
            Generate a 1-sentence intense notification to ensure they don't skip leg day.
        `;

        try {
            const res = await getComplexResponse(prompt);
            setAiMessage(res);
            if(reminderEnabled) addToast("Neural Nudge Scheduled.", "success");
        } catch(e) {
            setAiMessage("Protocol Override: Get to the gym now.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. CHRONOS HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-cyan-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                            <CalendarClock className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Activity className="w-3 h-3" /> Chronos-Sync v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">LINK: STABLE</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-600">Timer</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: COUNTDOWN & CONTROLS */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="bg-black border-cyan-500/30 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-center h-full flex flex-col justify-between">
                         <div className="absolute top-0 right-0 p-8 opacity-5"><Clock className="w-48 h-48 text-cyan-500" /></div>
                         
                         <div className="relative z-10">
                             <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em] mb-4">T-Minus to Session</p>
                             <div className="text-6xl font-mono font-black text-white tracking-tighter">{timeLeft}</div>
                             
                             <div className="mt-8 bg-gray-900/50 p-4 rounded-3xl border border-white/10 flex justify-between items-center">
                                 <input 
                                    type="time" 
                                    value={targetTime}
                                    onChange={(e) => setTargetTime(e.target.value)}
                                    className="bg-transparent text-2xl font-black text-white outline-none w-32 text-center focus:text-cyan-400 transition-colors"
                                 />
                                 <div className="h-8 w-px bg-white/10"></div>
                                 <select 
                                    value={durationGoal}
                                    onChange={(e) => setDurationGoal(Number(e.target.value))}
                                    className="bg-transparent text-xs font-bold text-gray-400 outline-none uppercase tracking-widest text-right"
                                 >
                                     <option value={30}>30 Min</option>
                                     <option value={45}>45 Min</option>
                                     <option value={60}>60 Min</option>
                                     <option value={90}>90 Min</option>
                                 </select>
                             </div>
                         </div>

                         <div className="relative z-10 mt-8 space-y-4">
                             <button 
                                onClick={handleAutoOptimize}
                                disabled={isOptimizing}
                                className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                             >
                                 {isOptimizing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4 fill-current"/>}
                                 {isOptimizing ? 'CALCULATING...' : 'AUTO-OPTIMIZE SLOT'}
                             </button>
                             
                             <div className="flex justify-between items-center px-4">
                                 <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                     <Bell className="w-3 h-3"/> Auto-Remind
                                 </span>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                                </label>
                             </div>
                         </div>
                    </Card>
                </div>

                {/* RIGHT: BIO-RHYTHM & CONTEXT */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Bio-Rhythm Chart */}
                    <Card title="Circadian Energy Map" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-xl">
                        <div className="h-64 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={bioData}>
                                    <defs>
                                        <linearGradient id="colorBio" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="hour" stroke="#666" fontSize={10} tickFormatter={(h) => `${h}:00`} interval={2} />
                                    <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px'}} itemStyle={{fontSize: '12px'}} />
                                    <Area type="monotone" dataKey="energy" stroke="#f59e0b" fill="url(#colorBio)" strokeWidth={3} />
                                    {/* Current Selection Line */}
                                    <ReferenceLine x={parseInt(targetTime)} stroke="#06b6d4" strokeDasharray="3 3" label={{ position: 'top', value: 'TARGET', fill: '#06b6d4', fontSize: 10, fontWeight: 'bold' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Target Bio-Sync</p>
                                <p className={`text-2xl font-black italic ${bioScore > 75 ? 'text-green-400' : bioScore > 50 ? 'text-amber-400' : 'text-red-400'}`}>{bioScore}%</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Verdict</p>
                                <p className="text-xs text-white font-bold">{bioScore > 75 ? 'PEAK PERFORMANCE' : 'SUB-OPTIMAL'}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Environmental Sentinel */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-[#0c0c0c] p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Arrival Prob.</p>
                                    <p className={`text-3xl font-black italic ${arrivalProb > 80 ? 'text-green-400' : 'text-amber-400'}`}>{arrivalProb}%</p>
                                </div>
                                <div className={`p-3 rounded-xl ${arrivalProb > 80 ? 'bg-green-900/20 text-green-400' : 'bg-amber-900/20 text-amber-400'}`}>
                                    <MapPin className="w-5 h-5"/>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2 relative z-10">
                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                    <Car className="w-3 h-3"/> Traffic: <span className={trafficLoad === 'Heavy' ? 'text-red-400' : 'text-white'}>{trafficLoad}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                    {weather === 'Rain' ? <CloudRain className="w-3 h-3"/> : weather === 'Heat' ? <Sun className="w-3 h-3"/> : <Wind className="w-3 h-3"/>}
                                    Weather: <span className={weather !== 'Clear' ? 'text-amber-400' : 'text-white'}>{weather}</span>
                                </div>
                            </div>
                            {/* Bg Effect */}
                            <div className={`absolute bottom-0 left-0 w-full h-1 ${arrivalProb > 80 ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                        </div>

                        <div className="bg-[#0c0c0c] p-6 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <BotIcon className="w-5 h-5 text-indigo-400"/>
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Neural Nudge</p>
                                </div>
                                {aiMessage ? (
                                    <p className="text-xs text-indigo-200 italic leading-relaxed animate-fade-in">"{aiMessage}"</p>
                                ) : (
                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">AI Standby...</p>
                                )}
                            </div>
                            <button 
                                onClick={handleGenerateNudge}
                                disabled={isGenerating}
                                className="w-full mt-4 py-3 bg-white/5 hover:bg-indigo-600 hover:text-white text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                                {isGenerating ? <RefreshCw className="w-3 h-3 animate-spin mx-auto"/> : 'Generate Motivation'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartScheduler;
