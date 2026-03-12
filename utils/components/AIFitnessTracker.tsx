import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS } from '../../constants';
import { getComplexResponse } from '../../lib/gemini';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { 
    TrendingUp, Activity, Dumbbell, Zap, Target, BrainCircuit, 
    RefreshCw, Share2, BarChart3, Database, Calendar, Settings, 
    ChevronRight, CheckCircle 
} from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import CustomTooltip from './common/CustomTooltip';

interface AIPlan {
    summary: string;
    workoutPlan: string;
    nutritionPlan: string;
    periodization: string;
}

const AIFitnessTracker: React.FC = () => {
    const { detailedWorkoutLogs = [], members = [], updateMember } = useData();
    const { addToast } = useToast();

    // Core State
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(members[0]?.id || '');
    const [isLoading, setIsLoading] = useState(false);
    const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'workout' | 'nutrition' | 'science'>('summary');
    const [isSaved, setIsSaved] = useState(false);
    
    // Generator Config State
    const [config, setConfig] = useState({
        goal: 'Hypertrophy',
        split: 'Push/Pull/Legs',
        daysPerWeek: 5,
        injuries: 'None',
        equipment: 'Full Gym'
    });
    const [showConfig, setShowConfig] = useState(true);

    const member = useMemo(() => members.find(m => m.id === Number(selectedMemberId)), [selectedMemberId, members]);

    const memberDetailedLogs = useMemo(() => {
        return detailedWorkoutLogs.filter(l => l.memberId === Number(selectedMemberId)).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [detailedWorkoutLogs, selectedMemberId]);

    // Graph Data Logic
    const availableExercises = useMemo(() => Array.from(new Set(memberDetailedLogs.map(l => l.exerciseName))), [memberDetailedLogs]);
    const [selectedExerciseGraph, setSelectedExerciseGraph] = useState<string | null>(null);
    useEffect(() => { if (availableExercises.length > 0 && !selectedExerciseGraph) setSelectedExerciseGraph(availableExercises[0]); }, [availableExercises]);
    
    const graphData = useMemo(() => {
        if (!selectedExerciseGraph) return [];
        return memberDetailedLogs.filter(l => l.exerciseName === selectedExerciseGraph).map(l => {
            let maxWeight = 0;
            let repsAtMax = 0;
            if (l.sets && l.sets.length > 0) {
                // Find the set with the highest weight
                const maxSet = l.sets.reduce((prev, curr) => (curr.weight >= prev.weight ? curr : prev), l.sets[0]);
                maxWeight = maxSet.weight;
                repsAtMax = maxSet.reps;
            }
            return {
                date: new Date(l.date).toLocaleDateString(undefined, {month: 'short', day:'numeric'}),
                weight: maxWeight,
                reps: repsAtMax,
                volume: l.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0)
            };
        });
    }, [memberDetailedLogs, selectedExerciseGraph]);

    const handleGeneratePlan = async () => {
        if (!member) return;
        setIsLoading(true);
        setAiPlan(null);
        setIsSaved(false);
        setShowConfig(false);

        const prompt = `
            ACT AS CHIEF SPORT SCIENTIST FOR ROYAL GYM.
            
            MEMBER PROFILE:
            - Name: ${member.name}
            - Experience: Level ${member.level}
            - Stats: ${member.physical_metrics.weight}kg, ${member.physical_metrics.body_fat}% BF
            - Health Score: ${member.health_score}
            - HRV: ${member.hrv}
            - Recent Logs: ${memberDetailedLogs.slice(-3).map(l => l.exerciseName).join(', ') || 'None'}
            
            CONFIGURATION:
            - Goal: ${config.goal}
            - Split: ${config.split}
            - Frequency: ${config.daysPerWeek} days/week
            - Constraints: ${config.injuries}
            
            TASK: Analyze the member's workout logs and live health data to generate personalized performance insights and suggest workout adjustments. Generate a v31.0 Evolution Protocol.
            
            OUTPUT FORMAT (Use these exact delimiters):
            ### PERIODIZATION ###
            [Explain the mesocycle structure (e.g., Linear, Undulating) in 2 sentences]
            ### SUMMARY ###
            [Scientific analysis of current state vs goal, including performance insights and workout adjustments based on health data]
            ### WORKOUT ###
            [HTML formatted weekly plan. Use <ul>, <li>, <strong> for clarity.]
            ### NUTRITION ###
            [HTML formatted macronutrient strategy & timing]
        `;

        try {
            const result = await getComplexResponse(prompt);
            const periodization = result.split('### PERIODIZATION ###')[1]?.split('### SUMMARY ###')[0]?.trim() || 'Adaptive Linear';
            const summary = result.split('### SUMMARY ###')[1]?.split('### WORKOUT ###')[0]?.trim() || 'Analysis pending.';
            const workoutPlan = result.split('### WORKOUT ###')[1]?.split('### NUTRITION ###')[0]?.trim() || 'Plan generation pending.';
            const nutritionPlan = result.split('### NUTRITION ###')[1]?.trim() || 'Nutrition plan pending.';
            
            setAiPlan({ periodization, summary, workoutPlan, nutritionPlan });
            addToast("Intelligence Sync Complete.", "success");
        } catch (e) {
            addToast("Uplink Failure. Try again.", "error");
            setShowConfig(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAutoRegulate = () => {
        if (!member || !aiPlan) return;
        updateMember({ ...member, approvedAiPlan: aiPlan.workoutPlan });
        setIsSaved(true);
        addToast(`Protocol Deployed to ${member.name}'s Neural Hub.`, "success");
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#050505] p-10 rounded-[4rem] border border-cyan-500/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="relative z-10 flex items-center gap-8">
                    <div className="p-8 bg-cyan-500 text-black rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.4)] group-hover:rotate-12 transition-transform">
                        <BrainCircuit className="w-16 h-16" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Neural Analytics v27.0
                            </div>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Progress <span className="text-cyan-400">Lab</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Member Selection */}
            <div className="bg-gray-950 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-4">
                <Target className="w-6 h-6 text-gray-500 ml-2" />
                <select
                    value={selectedMemberId}
                    onChange={(e) => { setSelectedMemberId(Number(e.target.value)); setAiPlan(null); setShowConfig(true); }}
                    className="w-full bg-transparent text-white font-black italic text-xl outline-none focus:text-cyan-400 transition-colors"
                >
                    {members.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                </select>
            </div>

            {member && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT: Generator / Plan */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* Config Panel */}
                        {showConfig && !isLoading && (
                            <Card title="Protocol Parameters" className="bg-black/40 border-cyan-500/30 p-8 rounded-[3rem]">
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Primary Goal</label>
                                        <select value={config.goal} onChange={e => setConfig({...config, goal: e.target.value})} className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white text-sm outline-none">
                                            <option>Hypertrophy</option><option>Strength</option><option>Fat Loss</option><option>Athletic Performance</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Split Style</label>
                                        <select value={config.split} onChange={e => setConfig({...config, split: e.target.value})} className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white text-sm outline-none">
                                            <option>Push/Pull/Legs</option><option>Upper/Lower</option><option>Full Body</option><option>Bro Split</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Frequency</label>
                                        <div className="flex items-center gap-4">
                                            <input type="range" min="2" max="6" value={config.daysPerWeek} onChange={e => setConfig({...config, daysPerWeek: Number(e.target.value)})} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
                                            <span className="text-xl font-black text-white">{config.daysPerWeek}d</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Injuries / Limits</label>
                                        <input value={config.injuries} onChange={e => setConfig({...config, injuries: e.target.value})} className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white text-sm outline-none" placeholder="e.g. Lower Back Pain" />
                                    </div>
                                </div>
                                <button onClick={handleGeneratePlan} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-4 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg">
                                    <BrainCircuit className="w-5 h-5" /> Execute Neural Synthesis
                                </button>
                            </Card>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="h-96 flex flex-col items-center justify-center bg-black/40 rounded-[3rem] border border-white/5">
                                <RefreshCw className="w-16 h-16 text-cyan-500 animate-spin mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase italic tracking-widest animate-pulse">Designing Protocol...</h3>
                                <p className="text-cyan-400 font-mono text-xs mt-2 uppercase tracking-widest">Running Biomechanical Simulation</p>
                            </div>
                        )}

                        {/* Plan Display */}
                        {aiPlan && !isLoading && (
                            <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden animate-slide-up">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><Zap className="w-40 h-40 text-cyan-400" /></div>
                                
                                <div className="flex gap-2 mb-8 relative z-10 overflow-x-auto no-scrollbar">
                                    {['summary', 'workout', 'nutrition', 'science'].map((tab) => (
                                        <button 
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)} 
                                            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400 border border-white/10'}`}
                                        >
                                            {tab}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-black/40 rounded-3xl p-8 border border-white/5 min-h-[300px] relative z-10 custom-scrollbar overflow-y-auto max-h-[500px]">
                                    {activeTab === 'summary' && <p className="text-gray-300 italic leading-relaxed text-sm">{aiPlan.summary}</p>}
                                    {activeTab === 'science' && (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Periodization Strategy</p>
                                            <p className="text-gray-300 text-sm leading-relaxed">{aiPlan.periodization}</p>
                                        </div>
                                    )}
                                    {activeTab === 'workout' && <div className="prose prose-invert prose-sm max-w-none text-cyan-100" dangerouslySetInnerHTML={{ __html: aiPlan.workoutPlan }} />}
                                    {activeTab === 'nutrition' && <div className="prose prose-invert prose-sm max-w-none text-green-100" dangerouslySetInnerHTML={{ __html: aiPlan.nutritionPlan }} />}
                                </div>

                                <div className="mt-8 flex justify-end gap-4 relative z-10">
                                    <button onClick={() => setShowConfig(true)} className="px-6 py-3 text-gray-500 font-bold text-xs uppercase hover:text-white transition-colors">Adjust Parameters</button>
                                    <button 
                                        onClick={handleAutoRegulate}
                                        disabled={isSaved}
                                        className={`bg-white text-black font-black px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 uppercase tracking-widest text-xs transition-all active:scale-95 ${isSaved ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-400'}`}
                                    >
                                        <Share2 className="w-4 h-4" /> {isSaved ? 'PROTOCOL DEPLOYED' : 'DEPLOY TO MEMBER'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Data Stream */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card title="Kinetic History" className="bg-[#050505] border-white/5 p-8 rounded-[3rem] h-fit">
                             <div className="mb-6 flex flex-wrap gap-2">
                                {availableExercises.slice(0,5).map(ex => (
                                    <button 
                                        key={ex}
                                        onClick={() => setSelectedExerciseGraph(ex)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${selectedExerciseGraph === ex ? 'bg-cyan-600 text-white' : 'bg-gray-900 text-gray-500 border border-white/10'}`}
                                    >
                                        {ex.substring(0, 15)}...
                                    </button>
                                ))}
                             </div>

                             <div className="h-64 w-full relative">
                                {graphData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={graphData}>
                                            <defs>
                                                <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                            <YAxis yAxisId="left" stroke="#06b6d4" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10 }} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={10} domain={[0, 'dataMax + 2']} label={{ value: 'Reps', angle: 90, position: 'insideRight', fill: '#10b981', fontSize: 10 }} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                            <Legend verticalAlign="top" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                                            <Area yAxisId="left" type="monotone" dataKey="weight" name="Max Weight" unit="kg" stroke="#06b6d4" strokeWidth={3} fill="url(#colorWeight)" />
                                            <Line yAxisId="right" type="monotone" dataKey="reps" name="Reps @ Max" unit=" reps" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-700 opacity-30">
                                        <BarChart3 className="w-10 h-10 mb-2" />
                                        <p className="font-black uppercase tracking-widest text-[10px] italic">No Data Stream</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                        
                        <div className="bg-gray-900 border border-white/5 p-8 rounded-[3rem]">
                            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Quick Stats</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-400">Total Volume</span>
                                    <span className="text-white font-mono font-bold">{(graphData.reduce((acc, curr) => acc + curr.volume, 0) / 1000).toFixed(1)}k kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-400">Sessions</span>
                                    <span className="text-white font-mono font-bold">{memberDetailedLogs.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-400">Peak Load</span>
                                    <span className="text-cyan-400 font-mono font-bold">{Math.max(...graphData.map(d => d.weight), 0)} kg</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIFitnessTracker;