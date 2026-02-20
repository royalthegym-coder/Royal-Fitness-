
import React, { useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { getComplexResponse } from '../../../lib/gemini';
import { Clock, Activity, Zap, AlertTriangle, Sun, Moon, TrendingUp, ShieldAlert, CheckCircle, RefreshCw, Cpu, Infinity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { BotIcon } from '../icons/BotIcon';
import { useToast } from '../../hooks/useToast';
import { SmartWatchIcon } from '../icons/SmartWatchIcon';

const HormonalClock: React.FC = () => {
    const { members, liveHealthData, connectedDevice } = useData();
    const { addToast } = useToast();
    
    // User Inputs
    const [wakeTime, setWakeTime] = useState("07:00");
    const [stressLevel, setStressLevel] = useState<'Low' | 'Moderate' | 'High'>('Moderate');
    const [currentTimeStr, setCurrentTimeStr] = useState(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
    
    // AI State
    const [verdict, setVerdict] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Derived Data
    const [bestWindow, setBestWindow] = useState("");
    const [dangerZone, setDangerZone] = useState("");
    const [currentPhase, setCurrentPhase] = useState<{ status: string, color: string, advice: string }>({ status: 'Neutral', color: 'text-gray-400', advice: 'Maintaining homeostasis.' });

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTimeStr(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}));
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Generate 24h Data Points based on Wake Time
    const chartData = useMemo(() => {
        const data = [];
        const [wakeH] = wakeTime.split(':').map(Number);
        
        for (let i = 0; i < 24; i++) {
            const hour = (wakeH + i) % 24; // Cycle 24 hours starting from wake
            const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
            
            // BIOLOGICAL ALGORITHM SIMULATION (v31.0 Logic)
            let cortisol = 0;
            if (i === 0) cortisol = 40; // Waking
            else if (i === 1) cortisol = 90; // CAR (Cortisol Awakening Response)
            else if (i < 12) cortisol = 90 - (i * 5); // Gradual drop
            else cortisol = 20; // Low at night
            
            // Stress Modifier from Wearable (Live HR)
            if (connectedDevice && liveHealthData.heartRate.avg > 90) cortisol += 15;
            if (stressLevel === 'High') cortisol += 20;
            if (stressLevel === 'Moderate') cortisol += 10;

            let test = 0;
            if (i < 4) test = 85; 
            else if (i < 8) test = 60; 
            else if (i < 12) test = 75; 
            else test = 30; 

            const score = test - cortisol;

            data.push({
                time: timeLabel,
                testosterone: test,
                cortisol: cortisol,
                score: score,
                rawHour: hour,
                isNow: hour === new Date().getHours() 
            });
        }
        return data;
    }, [wakeTime, stressLevel, liveHealthData.heartRate.avg, connectedDevice]);

    // Calculate Zones & Current State
    useEffect(() => {
        const best = chartData.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        setBestWindow(`${best.time} - ${(best.rawHour + 2) % 24}:00`);

        const worst = chartData.reduce((prev, current) => (prev.score < current.score) ? prev : current);
        setDangerZone(`${worst.time} - ${(worst.rawHour + 1) % 24}:00`);

        const currentHourData = chartData.find(d => d.rawHour === new Date().getHours());
        if (currentHourData) {
            if (currentHourData.score > 20) {
                setCurrentPhase({ status: 'ANABOLIC (GROWTH)', color: 'text-green-500', advice: 'Optimal time for training or protein intake.' });
            } else if (currentHourData.score < -10) {
                setCurrentPhase({ status: 'CATABOLIC (STRESS)', color: 'text-red-500', advice: 'High Cortisol. Avoid intense stress. Hydrate.' });
            } else {
                setCurrentPhase({ status: 'HOMEOSTASIS (STABLE)', color: 'text-amber-500', advice: 'Balanced hormonal profile. Good for skill work.' });
            }
        }
    }, [chartData]);

    const handleSyncWithWearable = () => {
        if (!connectedDevice) {
            addToast("No Device Connected. Go to Wearables Hub.", "error");
            return;
        }
        
        addToast(`Syncing with ${connectedDevice.name} Sleep Data...`, "info");
        setTimeout(() => {
            // Mock: Woke up at 6:30 AM based on "Live Data"
            setWakeTime("06:30");
            addToast("Wake Time Updated from Device: 06:30 AM", "success");
        }, 1000);
    };

    const handleAiAnalyze = async () => {
        setIsAnalyzing(true);
        setVerdict(null);

        const prompt = `
            Act as a Chronobiology Sports Scientist for "Royal The Gym".
            User Data:
            - Connected Device: ${connectedDevice?.name || "Manual Input"}
            - Wake Time: ${wakeTime}
            - Live Stress (HR): ${liveHealthData.heartRate.avg} BPM
            - Calculated Best Window: ${bestWindow} (High Testosterone/Low Cortisol)
            - Current Time: ${currentTimeStr} (${currentPhase.status})

            Task:
            1. Analyze the user's CURRENT hormonal state.
            2. Explain WHY the Best Window is optimal scientifically.
            3. Give a specific pre-workout nutrition tip.
            
            Format as HTML bullet points. Keep it punchy and elite.
        `;

        try {
            const response = await getComplexResponse(prompt);
            setVerdict(response);
        } catch (e) {
            setVerdict("Neural Network Offline. Rely on the chart data.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#050505] p-10 rounded-[4rem] border border-amber-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(245,158,11,0.15)] group">
                <div className="absolute top-0 right-0 p-10 opacity-10 animate-spin-slow">
                    <Clock className="w-64 h-64 text-amber-500" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="px-5 py-2 bg-amber-500 text-black rounded-full flex items-center gap-3 shadow-lg font-black uppercase tracking-[0.2em] text-[10px]">
                                <Infinity className="w-3 h-3 animate-spin-slow" /> Bio-Rhythm v31.0
                            </div>
                             <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYNC: CHRONOS_MASTER</span>
                        </div>
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Hormonal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Clock</span>
                        </h1>
                        <p className="text-gray-400 text-[10px] font-mono tracking-[0.6em] mt-3 uppercase italic leading-none font-bold">
                            Endocrine Prediction Engine
                        </p>
                    </div>
                    
                    {/* Live Status HUD */}
                    <div className="bg-gray-900/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl min-w-[250px]">
                         <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">Live Endocrine Status</p>
                         <p className={`text-xl font-black italic ${currentPhase.color}`}>{currentPhase.status}</p>
                         <p className="text-[10px] text-gray-400 mt-1 leading-tight">{currentPhase.advice}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: CONTROLS & SUMMARY */}
                <div className="space-y-6">
                    <Card className="bg-gray-900 border-white/5 h-fit">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                            <BotIcon className="w-6 h-6 text-amber-500"/>
                            <h3 className="text-lg font-black text-white uppercase italic">Calibration</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sun className="w-4 h-4"/> Wake-Up Time
                                    </label>
                                    <button onClick={handleSyncWithWearable} className="text-[9px] text-cyan-400 uppercase font-black hover:text-white flex items-center gap-1 transition-colors">
                                        <SmartWatchIcon className="w-3 h-3" /> {connectedDevice ? 'Sync Device' : 'Connect'}
                                    </button>
                                </div>
                                <input 
                                    type="time" 
                                    value={wakeTime} 
                                    onChange={(e) => setWakeTime(e.target.value)}
                                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-amber-500 transition-all text-center text-xl"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                    <Activity className="w-4 h-4"/> Daily Stress Load
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Low', 'Moderate', 'High'].map(lvl => (
                                        <button 
                                            key={lvl}
                                            onClick={() => setStressLevel(lvl as any)}
                                            className={`py-3 rounded-lg text-[10px] font-black uppercase transition-all ${stressLevel === lvl ? 'bg-amber-600 text-black shadow-lg' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-900/20 to-black border-green-500/30">
                        <div className="text-center">
                            <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Anabolic Prime Time
                            </p>
                            <p className="text-4xl font-black text-white italic tracking-tighter">{bestWindow}</p>
                            <p className="text-xs text-gray-400 mt-2">Max Testosterone / Min Cortisol</p>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-900/20 to-black border-red-500/30">
                        <div className="text-center">
                            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Catabolic Danger Zone
                            </p>
                            <p className="text-4xl font-black text-white italic tracking-tighter">{dangerZone}</p>
                            <p className="text-xs text-gray-400 mt-2">High Cortisol Risk (Avoid Heavy Lifting)</p>
                        </div>
                    </Card>
                </div>

                {/* RIGHT: CHART & ANALYSIS */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="24H Hormonal Waveform" className="bg-black/40 border-white/5 h-[400px]">
                        <div className="h-full w-full pb-4 relative">
                            {/* Live Indicator on Chart */}
                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 z-10 backdrop-blur-md">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">{currentTimeStr}</span>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTest" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorCort" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="time" stroke="#666" fontSize={10} minTickGap={30} />
                                    <YAxis stroke="#666" fontSize={10} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="testosterone" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTest)" name="Testosterone (Growth)" />
                                    <Area type="monotone" dataKey="cortisol" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCort)" name="Cortisol (Stress)" />
                                    
                                    {/* Annotations */}
                                    <ReferenceLine x={bestWindow.split(' ')[0]} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'PRIME', fill: '#10b981', fontSize: 10 }} />
                                    
                                    {/* Current Time Indicator */}
                                    {chartData.find(d => d.isNow) && (
                                        <ReferenceLine x={chartData.find(d => d.isNow)?.time} stroke="#06b6d4" strokeWidth={2} label={{ position: 'insideTop', value: 'NOW', fill: '#06b6d4', fontSize: 10, fontWeight: 'bold' }} />
                                    )}
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="p-1 rounded-[2.5rem] bg-gradient-to-r from-amber-500 to-orange-600">
                        <div className="bg-[#0a0a0a] rounded-[2.4rem] p-8 relative overflow-hidden">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 hidden md:block">
                                    <Cpu className="w-10 h-10 text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-white italic uppercase mb-4">Neural Analysis</h3>
                                    
                                    {verdict ? (
                                        <div className="prose dark:prose-invert prose-sm text-gray-300 leading-relaxed max-w-none animate-fade-in" dangerouslySetInnerHTML={{ __html: verdict }} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                                            <p className="text-xs uppercase tracking-widest mb-4">Awaiting Signal...</p>
                                            <button 
                                                onClick={handleAiAnalyze}
                                                disabled={isAnalyzing}
                                                className="bg-white text-black font-black px-8 py-3 rounded-full uppercase text-xs tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
                                            >
                                                {isAnalyzing ? <span className="animate-spin">⚙</span> : <BotIcon className="w-4 h-4"/>}
                                                {isAnalyzing ? 'Processing Bio-Rhythm...' : 'Generate Verdict'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HormonalClock;
