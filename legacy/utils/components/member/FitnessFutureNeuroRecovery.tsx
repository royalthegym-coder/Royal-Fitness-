import React, { useState, useEffect } from 'react';
import { Brain, HeartPulse, Activity, Zap, Moon, Battery, RefreshCw, AlertTriangle, PlayCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const mockSleepData = [
  { time: '10 PM', hrv: 45, sleep: 80 },
  { time: '12 AM', hrv: 55, sleep: 85 },
  { time: '2 AM', hrv: 52, sleep: 90 },
  { time: '4 AM', hrv: 48, sleep: 75 },
  { time: '6 AM', hrv: 40, sleep: 65 },
];

    export default function FitnessFutureNeuroRecovery() {
    const [recoveryScore, setRecoveryScore] = useState(42);
    const [hrvStat, setHrvStat] = useState(38);
    const [sleepStat, setSleepStat] = useState(55);
    const [analyzing, setAnalyzing] = useState(true);

    const isCritical = hrvStat < 40 || sleepStat < 60;

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnalyzing(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="bg-black border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-3 relative z-10">
                    <Brain className="w-8 h-8 text-indigo-400" /> Neuro-Recovery & Sleep Intelligence
                </h1>
                <p className="text-gray-400 text-sm font-mono uppercase tracking-widest relative z-10">Smartwatch Synchronization Active</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 bg-black/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-center items-center text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                    <Battery className={`w-16 h-16 mb-4 ${analyzing ? 'text-gray-600 animate-pulse' : 'text-red-500'}`} />
                    <h3 className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-1">Central Nervous System</h3>
                    <div className="text-6xl font-black text-white italic tracking-tighter mb-2">
                        {analyzing ? '--' : recoveryScore}<span className="text-2xl text-gray-500 ml-1">%</span>
                    </div>
                    {analyzing ? (
                        <p className="text-indigo-400 text-xs font-bold animate-pulse flex items-center gap-2"><RefreshCw className="w-3 h-3 animate-spin"/> Syncing Wearable Data...</p>
                    ) : (
                        <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Critical Fatigue Detected
                        </span>
                    )}
                </div>

                <div className="col-span-1 lg:col-span-2 bg-black/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md">
                    <h3 className="text-white font-black uppercase text-lg flex items-center gap-2 mb-6">
                        <Moon className="w-5 h-5 text-indigo-400" /> Sleep Architecture & HRV
                    </h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={mockSleepData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="time" stroke="#ffffff50" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#ffffff50" fontSize={10} />
                                <Tooltip contentStyle={{ backgroundColor: '#000000cc', borderColor: '#ffffff20', borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="hrv" stroke="#818cf8" strokeWidth={3} fill="url(#colorHrv)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {!analyzing && isCritical && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-950/30 border border-red-500/30 rounded-[2.5rem] p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-2">
                                    <Zap className="text-yellow-400" /> NEURO_PROTECTION_ACTIVE
                                </h3>
                                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                                    The Central Nervous System is fatigued. Focus on light mobility and cardio today. (HRV: {hrvStat}, Sleep: {sleepStat}). Intensity cap locked at <strong>60%</strong>.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-black/50 p-3 rounded-xl border border-white/5">
                                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center line-through decoration-red-500 decoration-2">
                                            <Activity className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Heavy Squat 5x5</p>
                                            <p className="text-red-400 text-xs font-mono uppercase">Locked - High CNS Stress</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-center my-2">
                                        <RefreshCw className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="flex items-center gap-3 bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/30">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                                            <PlayCircle className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Light Mobility & Stretching</p>
                                            <p className="text-indigo-400 text-xs font-mono uppercase">Re-rendered for optimal recovery</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-auto">
                                <button className="w-full md:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]">
                                    Start Recovery Routine
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}