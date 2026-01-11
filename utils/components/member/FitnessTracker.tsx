
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { BodyMetric, WorkoutLog, MemberFitnessData, Member } from '../../../types';
import { INITIAL_MEMBERS } from '../../../constants';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import CustomTooltip from '../common/CustomTooltip';
import Modal from '../common/Modal';
import { getAICoachSuggestion, generateNextWorkoutChallenge, generateNextSessionPlan } from '../../../lib/gemini';
import { BotIcon } from '../icons/BotIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { FireIcon, RestingHeartIcon, StepIcon } from '../icons/ActivityIcons';
import { TrophyIcon } from '../icons/TrophyIcon';

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
                        <span className="text-xs font-mono">{log.date}</span>
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
                                        <span key={j} className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
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

const MuscleRecoveryCard: React.FC = () => {
    // Simulated recovery data based on "last workout" logic
    const muscleGroups = [
        { name: 'Chest', status: 30, color: 'bg-red-500' }, // Fatigued
        { name: 'Back', status: 90, color: 'bg-green-500' }, // Recovered
        { name: 'Legs', status: 60, color: 'bg-yellow-500' }, // Recovering
        { name: 'Shoulders', status: 40, color: 'bg-orange-500' }, // Tired
        { name: 'Arms', status: 80, color: 'bg-green-500' },
    ];

    return (
        <Card title="Muscle Recovery Matrix">
            <div className="space-y-4">
                {muscleGroups.map((group) => (
                    <div key={group.name}>
                        <div className="flex justify-between text-xs mb-1 text-gray-400">
                            <span>{group.name}</span>
                            <span>{group.status}% Recovered</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div className={`h-2 rounded-full ${group.color}`} style={{ width: `${group.status}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Based on your workout frequency & volume</p>
        </Card>
    );
};

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ memberId, fitnessData, setFitnessData }) => {
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [chest, setChest] = useState('');
    const [waist, setWaist] = useState('');
    const [arms, setArms] = useState('');
    
    // AI States
    const [nextSessionPlan, setNextSessionPlan] = useState<string | null>(null);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    
    // Challenge State
    const [nextChallenge, setNextChallenge] = useState<{name: string, desc: string, difficulty: string, tips: string[]} | null>(null);
    const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);

    // Live Activity Simulation State
    const [liveSteps, setLiveSteps] = useState(8450);
    const [liveCalories, setLiveCalories] = useState(320);
    const [liveHeartRate, setLiveHeartRate] = useState(58);

    useEffect(() => {
        // Simulate live data ticking up
        const interval = setInterval(() => {
            setLiveSteps(prev => prev + Math.floor(Math.random() * 3));
            setLiveHeartRate(58 + Math.floor(Math.random() * 5)); // Slightly variable resting HR
            setLiveCalories(prev => prev + 0.1);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const member = useMemo(() => {
        return INITIAL_MEMBERS.find(m => m.id === memberId);
    }, [memberId]);

    const memberData = useMemo(() => {
        return fitnessData[memberId] || { logs: [], metrics: [] };
    }, [fitnessData, memberId]);

    const handleAddMetric = (e: React.FormEvent) => {
        e.preventDefault();
        if (!weight && !bodyFat && !chest && !waist && !arms) return;

        const newMetric: BodyMetric = {
            date: new Date().toISOString().split('T')[0],
            weight: weight ? parseFloat(weight) : undefined,
            bodyFat: bodyFat ? parseFloat(bodyFat) : undefined,
            chest: chest ? parseFloat(chest) : undefined,
            waist: waist ? parseFloat(waist) : undefined,
            arms: arms ? parseFloat(arms) : undefined,
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
        setChest('');
        setWaist('');
        setArms('');
    };
    
    const personalRecords = useMemo(() => {
        const prs = { bench: 0, squat: 0, deadlift: 0 };
        memberData.logs.forEach(log => {
            log.performance?.forEach(perf => {
                const max = Math.max(...perf.sets.map(s => s.weight));
                const name = perf.exercise.toLowerCase();
                if (name.includes('bench press') && max > prs.bench) prs.bench = max;
                if (name.includes('squat') && max > prs.squat) prs.squat = max;
                if (name.includes('deadlift') && max > prs.deadlift) prs.deadlift = max;
            });
        });
        return prs;
    }, [memberData.logs]);

    const handleGenerateChallenge = async () => {
        setIsGeneratingChallenge(true);
        try {
            const result = await generateNextWorkoutChallenge(memberData);
            setNextChallenge({
                name: result.challengeName,
                desc: result.description,
                difficulty: result.difficulty,
                tips: result.optimizationTips
            });
        } catch(e) {
            console.error(e);
        } finally {
            setIsGeneratingChallenge(false);
        }
    };

    const handleGenerateNextSession = async () => {
        setIsGeneratingPlan(true);
        setNextSessionPlan(null);
        try {
            const plan = await generateNextSessionPlan(memberData);
            setNextSessionPlan(plan);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    return (
        <div className="space-y-6">
             {/* 1. Live Activity Cards */}
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="flex flex-col items-center justify-center p-4">
                    <StepIcon className="text-blue-500 mb-2 w-8 h-8" />
                    <p className="text-2xl font-bold">{liveSteps.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Steps Today</p>
                </Card>
                 <Card className="flex flex-col items-center justify-center p-4">
                    <FireIcon className="text-orange-500 mb-2 w-8 h-8" />
                    <p className="text-2xl font-bold">{Math.floor(liveCalories)}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Active Calories</p>
                </Card>
                 <Card className="flex flex-col items-center justify-center p-4">
                    <RestingHeartIcon className="text-red-500 mb-2 w-8 h-8" />
                    <p className="text-2xl font-bold">{liveHeartRate} <span className="text-sm font-normal text-gray-400">bpm</span></p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">Resting HR</p>
                </Card>
            </div>

            {/* 2. Personal Records Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-500/30 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-amber-400 text-xs font-bold uppercase mb-1">Bench Press PR</p>
                        <p className="text-3xl font-bold text-white">{personalRecords.bench} <span className="text-sm font-normal text-gray-400">kg</span></p>
                    </div>
                    <TrophyIcon className="w-10 h-10 text-amber-500" />
                </div>
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-700/10 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-blue-400 text-xs font-bold uppercase mb-1">Squat PR</p>
                        <p className="text-3xl font-bold text-white">{personalRecords.squat} <span className="text-sm font-normal text-gray-400">kg</span></p>
                    </div>
                    <TrophyIcon className="w-10 h-10 text-blue-500" />
                </div>
                <div className="bg-gradient-to-br from-red-500/20 to-red-700/10 border border-red-500/30 p-4 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-red-400 text-xs font-bold uppercase mb-1">Deadlift PR</p>
                        <p className="text-3xl font-bold text-white">{personalRecords.deadlift} <span className="text-sm font-normal text-gray-400">kg</span></p>
                    </div>
                    <TrophyIcon className="w-10 h-10 text-red-500" />
                </div>
            </div>

            {/* 3. NEW: AI Next Workout Architect */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-2 border-indigo-500/30 bg-gradient-to-br from-gray-800 to-indigo-900/20">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <BotIcon /> <span className="ml-2">AI Progression Architect</span>
                        </h2>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded mt-2 sm:mt-0 border border-indigo-500/50">Algorithm: Progressive Overload</span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6">
                        I analyze your previous logs to calculate exactly what weights you should lift next to ensure consistent strength gains. No more guessing.
                    </p>

                    {!nextSessionPlan ? (
                        <div className="text-center py-8">
                            <button 
                                onClick={handleGenerateNextSession} 
                                disabled={isGeneratingPlan}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all flex items-center mx-auto disabled:opacity-50"
                            >
                                <SparkleIcon className="w-5 h-5 mr-2" />
                                {isGeneratingPlan ? 'Crunching Numbers...' : 'Generate Next Session Plan'}
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in bg-gray-900/60 p-6 rounded-xl border border-gray-700">
                            <div className="prose dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: nextSessionPlan.replace(/\n/g, '<br />') }} />
                            <div className="flex justify-end mt-4">
                                <button onClick={() => setNextSessionPlan(null)} className="text-indigo-400 hover:text-white text-xs underline">Generate New</button>
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="h-full border-2 border-amber-500/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><BotIcon /></div>
                    
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                        <SparkleIcon className="w-5 h-5 mr-2 text-amber-400" />
                        Next Day Challenge
                    </h2>

                    {!nextChallenge ? (
                        <div className="flex flex-col items-center justify-center h-48">
                            <p className="text-gray-400 mb-6 text-center text-sm">Gamify your fitness. Get a custom challenge based on your stats.</p>
                            <button 
                                onClick={handleGenerateChallenge}
                                disabled={isGeneratingChallenge}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-lg flex items-center text-sm"
                            >
                                <SparkleIcon className="w-4 h-4 mr-2" />
                                {isGeneratingChallenge ? 'Scanning...' : 'Create Challenge'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <div>
                                <h3 className="text-lg font-bold text-amber-400">{nextChallenge.name}</h3>
                                <span className={`inline-block px-2 py-1 text-xs rounded mt-1 font-bold ${nextChallenge.difficulty === 'Extreme' ? 'bg-red-600 text-white' : nextChallenge.difficulty === 'Hard' ? 'bg-orange-600 text-white' : 'bg-yellow-600 text-black'}`}>
                                    {nextChallenge.difficulty}
                                </span>
                            </div>
                            <p className="text-gray-300 text-sm">{nextChallenge.desc}</p>
                            
                            <div className="bg-gray-700/50 p-3 rounded-lg mt-2">
                                <h4 className="font-bold text-green-400 mb-1 text-xs uppercase">Pro Tips</h4>
                                <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
                                    {nextChallenge.tips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                            <button onClick={() => setNextChallenge(null)} className="text-xs text-gray-500 hover:text-white mt-2">Reset</button>
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Body Composition Trends">
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={memberData.metrics}>
                                <XAxis dataKey="date" stroke="currentColor" className="text-xs" />
                                <YAxis yAxisId="left" stroke="#8884d8" className="text-xs" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" className="text-xs" />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#8884d8" activeDot={{ r: 8 }} name="Weight (kg)" strokeWidth={2} />
                                <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#82ca9d" name="Body Fat (%)" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <MuscleRecoveryCard />
            </div>

            {/* 4. Expanded Progress Tracking Form */}
            <Card title="Log Measurements & Metrics">
                <form onSubmit={handleAddMetric} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                    <div className="col-span-1">
                        <label className="text-xs text-gray-400">Weight (kg)</label>
                        <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded text-sm"/>
                    </div>
                     <div className="col-span-1">
                        <label className="text-xs text-gray-400">Body Fat (%)</label>
                        <input type="number" step="0.1" value={bodyFat} onChange={e => setBodyFat(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded text-sm"/>
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs text-gray-400">Chest (in)</label>
                        <input type="number" step="0.1" value={chest} onChange={e => setChest(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded text-sm"/>
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs text-gray-400">Waist (in)</label>
                        <input type="number" step="0.1" value={waist} onChange={e => setWaist(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded text-sm"/>
                    </div>
                    <div className="col-span-1">
                        <label className="text-xs text-gray-400">Arms (in)</label>
                        <input type="number" step="0.1" value={arms} onChange={e => setArms(e.target.value)} className="mt-1 w-full bg-gray-700 p-2 rounded text-sm"/>
                    </div>
                    <button type="submit" className="col-span-2 md:col-span-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded text-sm h-10">
                        Save Log
                    </button>
                </form>
            </Card>
            
            <Card title="Workout Logbook">
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {memberData.logs.length > 0 ? [...memberData.logs].reverse().map((log: WorkoutLog, index) => (
                        <WorkoutLogItem key={index} log={log} />
                    )) : <p className="text-gray-500 text-center py-8">No workouts logged yet. Go to "Today's Workout" to start tracking.</p>}
                </div>
            </Card>
        </div>
    );
};

export default FitnessTracker;
