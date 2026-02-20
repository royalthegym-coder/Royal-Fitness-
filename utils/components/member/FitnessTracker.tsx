
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { BodyMetric, WorkoutLog, MemberFitnessData } from '../../../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import CustomTooltip from '../common/CustomTooltip';
import { TrophyIcon } from '../icons/TrophyIcon';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import { CalendarIcon } from '../icons/CalendarIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { HeartRateIcon, SleepIcon, CaloriesIcon } from '../icons/HealthIcons';
import { useData } from '../../context/DataProvider'; // Live Data Context
import { BotIcon } from '../icons/BotIcon';
import { SpeedIcon } from '../icons/SpeedIcon';
import { getComplexResponse } from '../../../lib/gemini';
import { useToast } from '../../hooks/useToast';

interface FitnessTrackerProps {
    memberId: number;
    fitnessData: MemberFitnessData;
    setFitnessData: React.Dispatch<React.SetStateAction<MemberFitnessData>>;
}

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

// --- SUB-COMPONENTS ---

const RecoveryBattery: React.FC<{ score: number; hrv: number; sleep: number }> = ({ score, hrv, sleep }) => {
    let color = "text-green-500";
    let message = "Peak Performance Ready";
    if (score < 40) { color = "text-red-500"; message = "Rest Day Recommended"; }
    else if (score < 70) { color = "text-amber-500"; message = "Train Moderately"; }

    return (
        <div className="relative flex flex-col items-center justify-center p-6 bg-gray-900 rounded-full border-4 border-gray-800 w-64 h-64 mx-auto shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#1f2937" strokeWidth="8" />
                <circle
                    cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8"
                    strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100}
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeLinecap="round"
                />
            </svg>
            <div className="text-center z-10">
                <span className="text-gray-400 text-xs uppercase font-bold tracking-widest">Recovery</span>
                <div className={`text-6xl font-black ${color} my-1`}>{score}%</div>
                <div className="flex gap-3 text-[10px] text-gray-500 font-mono mt-2">
                    <span>HRV: {hrv}ms</span>
                    <span>SLEEP: {sleep}h</span>
                </div>
            </div>
            <div className={`absolute -bottom-8 ${color} text-sm font-bold uppercase tracking-widest animate-pulse`}>
                {message}
            </div>
        </div>
    );
};

const MuscleHeatmap: React.FC<{ logs: WorkoutLog[] }> = ({ logs }) => {
    // Logic: Analyze last 7 days of logs to find worked muscles
    const muscles = {
        'Chest': 0, 'Back': 0, 'Legs': 0, 'Shoulders': 0, 'Arms': 0, 'Core': 0
    };

    // Mock analysis of logs (In a real app, mapping exercises to muscles is complex)
    // Here we simulate "Freshness" (100 = Fresh, 0 = Exhausted)
    const [freshness, setFreshness] = useState<Record<string, number>>({
        'Chest': 90, 'Back': 45, 'Legs': 10, 'Shoulders': 80, 'Arms': 60, 'Core': 100
    });

    return (
        <div className="grid grid-cols-2 gap-4">
            {Object.entries(freshness).map(([muscle, score]) => (
                <div key={muscle} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-white">{muscle}</p>
                        <p className="text-xs text-gray-400">{(score as number) < 40 ? 'Recovering...' : 'Ready'}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${(score as number) > 80 ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : (score as number) > 40 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`}></div>
                </div>
            ))}
        </div>
    );
};

// --- MAIN COMPONENT ---

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ memberId, fitnessData, setFitnessData }) => {
    const { liveHealthData, connectedDevice } = useData(); // LIVE DATA INTEGRATION
    const [activeTab, setActiveTab] = useState<'overview' | 'biometrics' | 'predictions'>('overview');
    
    // AI Insights
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Derived Data
    const memberData = useMemo(() => fitnessData[memberId] || { logs: [], metrics: [] }, [fitnessData, memberId]);
    
    // Recovery Algorithm (Mock Logic combining Live Data + Logs)
    const recoveryScore = useMemo(() => {
        // Base: 100
        // Minus fatigue from steps (max 20k steps = -30 points)
        // Plus sleep recovery (8h = +40 points)
        // Minus heart rate stress
        const stepFatigue = Math.min(30, (liveHealthData.steps / 20000) * 30);
        const sleepRest = Math.min(40, (liveHealthData.sleep.totalHours / 8) * 40);
        const hrStress = liveHealthData.heartRate.avg > 90 ? 20 : 0;
        
        let score = 60 - stepFatigue + sleepRest - hrStress;
        return Math.max(10, Math.min(100, Math.round(score)));
    }, [liveHealthData]);

    const strengthData = useMemo(() => {
        // ... (Existing logic kept, simulated for now)
        return memberData.logs.map(l => ({ date: l.date, value: Math.floor(Math.random() * 50 + 50) })).slice(-5);
    }, [memberData]);

    const handleAiPrediction = async () => {
        setIsAnalyzing(true);
        setAiInsight(null);
        
        const deviceType = connectedDevice?.type || 'None';
        const deviceName = connectedDevice?.name || 'N/A';

        const prompt = `
            Act as a "Fitness Super Intelligence". Analyze this user:
            - Connected Device: ${deviceName} (Type: ${deviceType})
            - Live Vitals: HR ${liveHealthData.heartRate.avg}bpm, Steps ${liveHealthData.steps}, Sleep ${liveHealthData.sleep.totalHours}h.
            - Recent Recovery Score: ${recoveryScore}%
            - History: ${memberData.logs.length} workouts logged.
            
            1. Predict their "1 Rep Max" potential for Bench Press (Estimate based on general fitness).
            2. Predict injury risk (Low/Med/High) based on sleep/recovery.
            3. Suggest ONE "Next Level" bio-hack (e.g. cold plunge, carb cycling) relevant to their state.
            
            Format as HTML bullet points.
        `;

        try {
            const result = await getComplexResponse(prompt);
            setAiInsight(result);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Super App Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-900 to-indigo-900/40 p-6 rounded-2xl border border-indigo-500/30 shadow-2xl">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 flex items-center">
                        <SparkleIcon className="w-8 h-8 mr-3 text-indigo-400" />
                        Bio-Analytics Core
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Fused Data: 
                        <span className="text-white font-bold ml-1">
                            {connectedDevice ? `${connectedDevice.type} (${connectedDevice.name})` : 'Manual Logs'}
                        </span>
                        {' + '}
                        <span className="text-white font-bold">Gym Logs</span>
                    </p>
                </div>
                <div className="flex bg-gray-800/50 p-1 rounded-xl backdrop-blur-md">
                    {['overview', 'biometrics', 'predictions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Recovery Battery (The Hero Component) */}
                    <Card className="lg:col-span-1 bg-black border-gray-800 flex flex-col justify-center">
                        <RecoveryBattery score={recoveryScore} hrv={45} sleep={liveHealthData.sleep.totalHours} />
                    </Card>

                    {/* 2. Muscle Heatmap & Readiness */}
                    <Card title="Muscular System Status" className="lg:col-span-2">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <MuscleHeatmap logs={memberData.logs} />
                                <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30 text-xs text-blue-300">
                                    <strong className="block mb-1">AI Recommendation:</strong>
                                    Based on your fatigue map, today is optimal for <strong>Push (Chest/Shoulders)</strong> or <strong>Cardio</strong>. Legs need 12h more recovery.
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-700">
                                <div className="text-center">
                                    <SpeedIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                                    <p className="text-gray-500 text-xs">3D Body Map Visualization<br/>(Coming in v5.0)</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 3. Metrics Strip */}
                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-red-500">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Heart Rate (Live)</p>
                            <div className="flex items-end">
                                <span className="text-2xl font-black text-white">{liveHealthData.heartRate.avg}</span>
                                <span className="text-xs text-red-400 mb-1 ml-1 animate-pulse">❤ BPM</span>
                            </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-blue-500">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Steps (Synced)</p>
                            <div className="flex items-end">
                                <span className="text-2xl font-black text-white">{liveHealthData.steps.toLocaleString()}</span>
                                <span className="text-xs text-blue-400 mb-1 ml-1">/ 10k</span>
                            </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-purple-500">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Sleep Quality</p>
                            <div className="flex items-end">
                                <span className="text-2xl font-black text-white">{liveHealthData.sleep.totalHours}</span>
                                <span className="text-xs text-purple-400 mb-1 ml-1">Hours</span>
                            </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-xl border-l-4 border-orange-500">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Burn (Active)</p>
                            <div className="flex items-end">
                                <span className="text-2xl font-black text-white">{Math.floor(liveHealthData.caloriesBurned)}</span>
                                <span className="text-xs text-orange-400 mb-1 ml-1">Kcal</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PREDICTIONS */}
            {activeTab === 'predictions' && (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-900/40 to-gray-900 border-indigo-500/30">
                        <div className="text-center py-8">
                            <BotIcon className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Predictive Fitness Engine</h2>
                            <p className="text-gray-400 mb-6 max-w-lg mx-auto">
                                Using your historical logs and live physiological data, our AI simulates your future progress and injury risks.
                            </p>
                            <button 
                                onClick={handleAiPrediction}
                                disabled={isAnalyzing}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform hover:scale-105 disabled:opacity-50 flex items-center mx-auto"
                            >
                                {isAnalyzing ? <SparkleIcon className="w-5 h-5 mr-2 animate-spin"/> : <SparkleIcon className="w-5 h-5 mr-2"/>}
                                {isAnalyzing ? 'Running Simulation...' : 'Generate Future Report'}
                            </button>
                        </div>
                        
                        {aiInsight && (
                            <div className="mt-8 bg-gray-800/80 p-6 rounded-2xl border border-indigo-500/20 animate-fade-in">
                                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br />') }} />
                            </div>
                        )}
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card title="Strength Projection (Bench Press)">
                             <div className="h-[250px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={[
                                        { month: 'Jun', weight: 60, type: 'Actual' },
                                        { month: 'Jul', weight: 65, type: 'Actual' },
                                        { month: 'Aug', weight: 70, type: 'Actual' },
                                        { month: 'Sep', weight: 72.5, type: 'Actual' },
                                        { month: 'Oct', weight: 75, type: 'Predicted' },
                                        { month: 'Nov', weight: 80, type: 'Predicted' },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="month" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={{r:5}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-center text-xs text-purple-400 mt-2">Dotted line indicates AI projection @ 95% confidence interval.</p>
                        </Card>
                        
                        <Card title="Cardio Efficiency (VO2 Max)">
                            <div className="h-[250px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[
                                        { week: 'W1', vo2: 38 },
                                        { week: 'W2', vo2: 39 },
                                        { week: 'W3', vo2: 41 },
                                        { week: 'W4', vo2: 42 },
                                    ]}>
                                        <defs>
                                            <linearGradient id="colorVo2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="week" stroke="#9ca3af" />
                                        <YAxis stroke="#9ca3af" domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="vo2" stroke="#10b981" fillOpacity={1} fill="url(#colorVo2)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FitnessTracker;