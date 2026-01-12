
import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { BodyMetric, WorkoutLog, MemberFitnessData } from '../../../types';
import { INITIAL_MEMBERS } from '../../../constants';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';
import CustomTooltip from '../common/CustomTooltip';
import { TrophyIcon } from '../icons/TrophyIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { CalendarIcon } from '../icons/CalendarIcon';

interface FitnessTrackerProps {
    memberId: number;
    fitnessData: MemberFitnessData;
    setFitnessData: React.Dispatch<React.SetStateAction<MemberFitnessData>>;
}

const WorkoutLogItem: React.FC<{ log: WorkoutLog }> = ({ log }) => {
    return (
        <details className="bg-gray-800 border border-gray-700 rounded-lg group transition-all duration-300 open:bg-gray-800/80">
            <summary className="p-4 font-semibold cursor-pointer flex justify-between items-center text-gray-200 hover:text-amber-400 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-700 p-2 rounded-md group-open:bg-amber-500/20 group-open:text-amber-500">
                        <span className="text-xs font-mono text-gray-400 group-open:text-amber-500">{log.date}</span>
                    </div>
                    <span className="text-lg">{log.templateName}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-full">{log.completedExercises.length} Exercises</span>
                    <span className="transform transition-transform group-open:rotate-180">▼</span>
                </div>
            </summary>
            <div className="p-4 border-t border-gray-700 bg-gray-900/30">
                {log.performance && log.performance.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {log.performance.map((perf, i) => (
                            <div key={i} className="bg-gray-800 p-3 rounded border border-gray-700">
                                <p className="font-bold text-amber-500 text-sm mb-2">{perf.exercise}</p>
                                <div className="flex flex-wrap gap-2">
                                    {perf.sets.map((set, j) => (
                                        <span key={j} className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300 border border-gray-600">
                                            {set.weight}kg × {set.reps}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">No detailed performance data available.</p>
                )}
            </div>
        </details>
    );
};

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ memberId, fitnessData, setFitnessData }) => {
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    
    // --- Data Preparation for Charts ---

    const memberData = useMemo(() => {
        return fitnessData[memberId] || { logs: [], metrics: [] };
    }, [fitnessData, memberId]);

    // 1. Body Composition Data
    const bodyCompData = useMemo(() => {
        return [...memberData.metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [memberData.metrics]);

    // 2. Strength Progress Data (Extracting max weight for key lifts)
    const strengthData = useMemo(() => {
        const dataMap: Record<string, { date: string; Bench?: number; Squat?: number; Deadlift?: number }> = {};
        
        memberData.logs.forEach(log => {
            if (!log.performance) return;
            
            const date = log.date;
            if (!dataMap[date]) dataMap[date] = { date };

            log.performance.forEach(perf => {
                const name = perf.exercise.toLowerCase();
                const maxWeight = Math.max(...perf.sets.map(s => s.weight));
                
                if (name.includes('bench')) dataMap[date].Bench = maxWeight;
                else if (name.includes('squat')) dataMap[date].Squat = maxWeight;
                else if (name.includes('deadlift')) dataMap[date].Deadlift = maxWeight;
            });
        });

        return Object.values(dataMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [memberData.logs]);

    // 3. Workout Frequency Data (Group by Week)
    const frequencyData = useMemo(() => {
        const weeks: Record<string, number> = {};
        memberData.logs.forEach(log => {
            const date = new Date(log.date);
            const startOfWeek = new Date(date.setDate(date.getDate() - date.getDay()));
            const weekLabel = `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`;
            weeks[weekLabel] = (weeks[weekLabel] || 0) + 1;
        });
        
        // Ensure at least last 4 weeks are shown even if empty
        // (Simplified for demo: just taking existing data)
        return Object.entries(weeks).map(([name, count]) => ({ name, count }));
    }, [memberData.logs]);

    const handleAddMetric = (e: React.FormEvent) => {
        e.preventDefault();
        if (!weight && !bodyFat) return;

        const newMetric: BodyMetric = {
            date: new Date().toISOString().split('T')[0],
            weight: weight ? parseFloat(weight) : undefined,
            bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
        };

        setFitnessData(prevData => {
            const currentMemberData = prevData[memberId] || { logs: [], metrics: [] };
            return {
                ...prevData,
                [memberId]: {
                    ...currentMemberData,
                    metrics: [...currentMemberData.metrics, newMetric],
                },
            };
        });
        
        setWeight('');
        setBodyFat('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <ChartBarIcon />
                    <span className="ml-3">Fitness Analytics</span>
                </h1>
                <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                    Last Updated: Today
                </div>
            </div>

            {/* --- TOP STATS ROW --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-900/40 to-gray-800 border-blue-500/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-blue-400 font-bold uppercase mb-1">Total Workouts</p>
                            <p className="text-3xl font-bold text-white">{memberData.logs.length}</p>
                        </div>
                        <TrophyIcon className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-900/40 to-gray-800 border-green-500/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-green-400 font-bold uppercase mb-1">Current Weight</p>
                            <p className="text-3xl font-bold text-white">
                                {memberData.metrics.length > 0 ? memberData.metrics[memberData.metrics.length - 1].weight : '-'} <span className="text-sm font-normal text-gray-400">kg</span>
                            </p>
                        </div>
                        <div className="bg-green-500/20 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 8.586 15.586 4H12z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-amber-900/40 to-gray-800 border-amber-500/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs text-amber-400 font-bold uppercase mb-1">Consistency</p>
                            <p className="text-3xl font-bold text-white">
                                {frequencyData.length > 0 ? (frequencyData.reduce((acc, curr) => acc + curr.count, 0) / frequencyData.length).toFixed(1) : 0} <span className="text-sm font-normal text-gray-400">/week</span>
                            </p>
                        </div>
                        <CalendarIcon className="w-8 h-8 text-amber-500 opacity-50" />
                    </div>
                </Card>
            </div>

            {/* --- CHARTS ROW 1 --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Body Composition Chart */}
                <Card title="Body Composition Trends">
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={bodyCompData}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                                <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                                <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={12} domain={[0, 40]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorWeight)" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="bodyFat" name="Body Fat (%)" stroke="#10b981" strokeWidth={2} dot={{r:4}} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 2. Strength Progress Chart */}
                <Card title="Strength Progression (Max Lift)">
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={strengthData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line connectNulls type="monotone" dataKey="Bench" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 6 }} />
                                <Line connectNulls type="monotone" dataKey="Squat" stroke="#ec4899" strokeWidth={2} activeDot={{ r: 6 }} />
                                <Line connectNulls type="monotone" dataKey="Deadlift" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* --- CHARTS ROW 2 & INPUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 3. Consistency Chart */}
                <Card title="Weekly Workout Frequency" className="lg:col-span-2">
                    <div className="h-[250px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={frequencyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255, 255, 255, 0.05)'}} />
                                <Bar dataKey="count" name="Sessions" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* 4. Input Form */}
                <Card title="Log New Body Metrics">
                    <form onSubmit={handleAddMetric} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                            <input type="date" disabled value={new Date().toISOString().split('T')[0]} className="w-full bg-gray-700 text-gray-500 border border-gray-600 rounded p-2 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Weight (kg)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={weight} 
                                    onChange={e => setWeight(e.target.value)} 
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                                    placeholder="0.0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Body Fat (%)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={bodyFat} 
                                    onChange={e => setBodyFat(e.target.value)} 
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded p-2 focus:ring-2 focus:ring-green-500 outline-none" 
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors mt-2">
                            Save Metrics
                        </button>
                    </form>
                </Card>
            </div>

            {/* --- LOG HISTORY --- */}
            <Card title="Workout History">
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {memberData.logs.length > 0 ? [...memberData.logs].reverse().map((log: WorkoutLog, index) => (
                        <WorkoutLogItem key={index} log={log} />
                    )) : <p className="text-gray-500 text-center py-8">No workouts logged yet. Go to "Today's Workout" to start tracking.</p>}
                </div>
            </Card>
        </div>
    );
};

export default FitnessTracker;
