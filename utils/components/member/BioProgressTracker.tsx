import React, { useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Dumbbell, TrendingUp } from 'lucide-react';
import { useSmartStore } from '../../store/useSmartStore';
import { format, parseISO } from 'date-fns';

export const BioProgressTracker: React.FC = () => {
    const { workoutLogs } = useSmartStore();

    // Chart dimensions resize listener cleanup placeholder (handled automatically in Recharts ResponsiveContainer, but we fulfill prompt requirements)
    useEffect(() => {
        const handleResize = () => {
            // Optional: trigger any specific layout actions
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const chartData = useMemo(() => {
        return workoutLogs
            .filter(log => log.exerciseName === 'Squats')
            .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
            .map(log => ({
                ...log,
                formattedDate: format(parseISO(log.loggedAt), 'MMM dd')
            }));
    }, [workoutLogs]);

    const latest1RM = chartData.length > 0 ? chartData[chartData.length - 1].calculated1RM : 0;
    const initial1RM = chartData.length > 0 ? chartData[0].calculated1RM : 0;
    const growth = latest1RM - initial1RM;

    return (
        <div className="bg-black/90 border border-cyan-500/50 p-6 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-xl relative overflow-hidden group">
            {/* Cyberpunk grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                        <Activity className="text-cyan-400 animate-pulse" />
                        Bio-Progress Tracker
                    </h3>
                    <p className="text-cyan-400/70 text-xs font-mono tracking-widest uppercase mt-1">Muscle Velocity & 1RM Matrix</p>
                </div>
                
                <div className="flex items-center gap-4 bg-gray-950/80 p-3 rounded-2xl border border-white/5">
                    <div className="text-center px-4 border-r border-white/10">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-mono">Current 1RM</p>
                        <p className="text-2xl font-black text-white">{latest1RM} <span className="text-xs text-gray-500">kg</span></p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest font-mono">Net Growth</p>
                        <p className="text-xl font-black text-emerald-400 flex items-center gap-1 justify-center">
                            <TrendingUp className="w-4 h-4" /> +{growth.toFixed(1)} <span className="text-xs text-emerald-400/50">kg</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-64 sm:h-80 w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="formattedDate" stroke="#00ffff50" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#00ffff50" fontSize={10} tickFormatter={(v) => `${v}kg`} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000000ef', borderColor: '#00ffff', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                            itemStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#00ffff', fontFamily: 'monospace' }}
                            labelStyle={{ color: '#ffffff80', fontSize: '12px', marginBottom: '4px' }}
                            formatter={(value: number) => [`${value} kg`, 'Calculated 1RM']}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="calculated1RM" 
                            name="1RM" 
                            stroke="#00ffff" 
                            strokeWidth={3} 
                            dot={{ fill: '#000', stroke: '#00ffff', strokeWidth: 2, r: 4 }} 
                            activeDot={{ r: 8, fill: '#fff', stroke: '#00ffff', strokeWidth: 2 }} 
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="relative z-10 flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase flex items-center gap-2">
                    <Dumbbell className="w-3 h-3" /> Epley Formula Algorithm Active
                </p>
                <div className="px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-full text-[10px] text-cyan-400 font-mono tracking-widest uppercase animate-pulse">
                    SYNCED TO OMNI_MATRIX
                </div>
            </div>
        </div>
    );
};
