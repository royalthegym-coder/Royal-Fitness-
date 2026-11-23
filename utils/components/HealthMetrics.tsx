import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Heart, Activity, Droplets, Flame, TrendingUp, Cpu, Zap, ActivitySquare, Radar } from 'lucide-react';
import { motion } from 'motion/react';
import ErrorBoundary from './common/ErrorBoundary';

const data = [
  { name: 'Mon', heartRate: 65, hrv: 45, sleep: 7.2 },
  { name: 'Tue', heartRate: 62, hrv: 52, sleep: 8.1 },
  { name: 'Wed', heartRate: 68, hrv: 40, sleep: 6.5 },
  { name: 'Thu', heartRate: 64, hrv: 48, sleep: 7.5 },
  { name: 'Fri', heartRate: 61, hrv: 55, sleep: 8.0 },
  { name: 'Sat', heartRate: 59, hrv: 60, sleep: 8.5 },
  { name: 'Sun', heartRate: 60, hrv: 58, sleep: 8.2 },
];

const HealthMetrics: React.FC = () => {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono animate-fade-in">
            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-4">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500 blur-md opacity-50 rounded-full animate-pulse"></div>
                        <div className="bg-black border border-cyan-500 p-3 rounded-full relative z-10">
                            <Radar className="w-8 h-8 text-cyan-400 animate-spin-slow" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                <Cpu className="w-3 h-3" /> Fitness Future
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-[0.2em] drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                            FitnessFutureMetrics
                        </h1>
                        <p className="text-cyan-500/70 text-sm tracking-widest mt-1 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                            BIOMETRIC TELEMETRY ACTIVE
                        </p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3 bg-cyan-950/30 border border-cyan-500/30 px-4 py-2 rounded-sm">
                    <ActivitySquare className="w-5 h-5 text-cyan-400" />
                    <span className="text-cyan-400 text-xs tracking-widest uppercase">System Nominal</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                {/* Scanline effect for the grid area */}
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 z-0"></div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-black/80 border border-red-500/30 p-6 rounded-sm relative overflow-hidden group hover:border-red-500/60 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full -z-10 group-hover:bg-red-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <Heart className="w-6 h-6 text-red-500 animate-pulse" />
                        <h3 className="text-sm font-bold text-red-400 tracking-widest uppercase">Resting HR</h3>
                    </div>
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">62 <span className="text-lg text-red-500/50 font-normal tracking-widest">BPM</span></div>
                    <div className="mt-4 pt-4 border-t border-red-500/20">
                        <p className="text-xs text-red-400 flex items-center gap-2 tracking-wider">
                            <TrendingUp className="w-4 h-4 rotate-180" />
                            OPTIMAL RANGE
                        </p>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-black/80 border border-purple-500/30 p-6 rounded-sm relative overflow-hidden group hover:border-purple-500/60 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full -z-10 group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="w-6 h-6 text-purple-500" />
                        <h3 className="text-sm font-bold text-purple-400 tracking-widest uppercase">Smart HRV</h3>
                    </div>
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">58 <span className="text-lg text-purple-500/50 font-normal tracking-widest">MS</span></div>
                    <div className="mt-4 pt-4 border-t border-purple-500/20">
                        <p className="text-xs text-purple-400 flex items-center gap-2 tracking-wider">
                            <TrendingUp className="w-4 h-4" />
                            ↑ 12% EFFICIENCY
                        </p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-black/80 border border-blue-500/30 p-6 rounded-sm relative overflow-hidden group hover:border-blue-500/60 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full -z-10 group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <Droplets className="w-6 h-6 text-blue-500" />
                        <h3 className="text-sm font-bold text-blue-400 tracking-widest uppercase">Hydration</h3>
                    </div>
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">2.8 <span className="text-lg text-blue-500/50 font-normal tracking-widest">L</span></div>
                    <div className="mt-4 pt-4 border-t border-blue-500/20">
                        <p className="text-xs text-blue-400 flex items-center gap-2 tracking-wider">
                            <Zap className="w-4 h-4" />
                            TARGET: 3.5 L
                        </p>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-black/80 border border-orange-500/30 p-6 rounded-sm relative overflow-hidden group hover:border-orange-500/60 transition-colors shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full -z-10 group-hover:bg-orange-500/10 transition-colors"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <Flame className="w-6 h-6 text-orange-500" />
                        <h3 className="text-sm font-bold text-orange-400 tracking-widest uppercase">Metabolic Output</h3>
                    </div>
                    <div className="text-4xl font-black text-white drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">850 <span className="text-lg text-orange-500/50 font-normal tracking-widest">KCAL</span></div>
                    <div className="mt-4 pt-4 border-t border-orange-500/20">
                        <p className="text-xs text-orange-400 flex items-center gap-2 tracking-wider">
                            <TrendingUp className="w-4 h-4" />
                            PEAK BURN RATE
                        </p>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-black/80 border border-purple-500/30 p-6 rounded-sm relative shadow-[inset_0_0_30px_rgba(168,85,247,0.05)]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-purple-400 tracking-widest uppercase flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            Smart HRV Matrix
                        </h3>
                        <span className="text-[10px] text-purple-500/50 tracking-widest border border-purple-500/30 px-2 py-1 rounded-sm">7-DAY ANALYSIS</span>
                    </div>
                    <div className="h-64 w-full">
                        <ErrorBoundary variant="compact" fallbackMessage="Failed to render Recovery Cycle Area Chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorHrv" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#a855f7" strokeOpacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" stroke="#a855f7" strokeOpacity={0.5} tick={{fill: '#a855f7', fontSize: 12}} tickLine={false} axisLine={{strokeOpacity: 0.2}} />
                                    <YAxis stroke="#a855f7" strokeOpacity={0.5} tick={{fill: '#a855f7', fontSize: 12}} tickLine={false} axisLine={{strokeOpacity: 0.2}} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: '#a855f7', borderRadius: '4px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                                        itemStyle={{ color: '#a855f7' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="hrv" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorHrv)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-black/80 border border-red-500/30 p-6 rounded-sm relative shadow-[inset_0_0_30px_rgba(239,68,68,0.05)]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-red-400 tracking-widest uppercase flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Cardiac Baseline
                        </h3>
                        <span className="text-[10px] text-red-500/50 tracking-widest border border-red-500/30 px-2 py-1 rounded-sm">LIVE SYNC</span>
                    </div>
                    <div className="h-64 w-full">
                        <ErrorBoundary variant="compact" fallbackMessage="Failed to render Cardiac Baseline Line Chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ef4444" strokeOpacity={0.1} vertical={false} />
                                    <XAxis dataKey="name" stroke="#ef4444" strokeOpacity={0.5} tick={{fill: '#ef4444', fontSize: 12}} tickLine={false} axisLine={{strokeOpacity: 0.2}} />
                                    <YAxis stroke="#ef4444" strokeOpacity={0.5} tick={{fill: '#ef4444', fontSize: 12}} domain={['dataMin - 5', 'dataMax + 5']} tickLine={false} axisLine={{strokeOpacity: 0.2}} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderColor: '#ef4444', borderRadius: '4px', fontFamily: 'monospace', textTransform: 'uppercase' }}
                                        itemStyle={{ color: '#ef4444' }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#000', stroke: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#ef4444' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ErrorBoundary>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default HealthMetrics;
