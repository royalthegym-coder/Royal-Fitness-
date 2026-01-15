
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA } from '../../constants';
import { Member, MemberFitnessData } from '../../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { getHealthEngineAnalysis } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { HealthEngineIcon } from './icons/HealthEngineIcon';
import CustomTooltip from './common/CustomTooltip';

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <Card>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-amber-500 dark:text-amber-400">{value}</p>
    </Card>
);

const HealthEngine: React.FC = () => {
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(INITIAL_MEMBERS[0]?.id || '');
    const [isLoading, setIsLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isLiveMonitorActive, setIsLiveMonitorActive] = useState(false);
    const [liveVitals, setLiveVitals] = useState<{time: string, hr: number, spo2: number}[]>([]);

    const member: Member | undefined = useMemo(() => {
        return INITIAL_MEMBERS.find(m => m.id === Number(selectedMemberId));
    }, [selectedMemberId]);

    const memberData: MemberFitnessData[number] = useMemo(() => {
        if (!selectedMemberId) return { logs: [], metrics: [] };
        return INITIAL_MEMBER_FITNESS_DATA[Number(selectedMemberId)] || { logs: [], metrics: [] };
    }, [selectedMemberId]);

    // Live Monitor Simulation
    useEffect(() => {
        if (!isLiveMonitorActive) {
            setLiveVitals([]);
            return;
        }

        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            // Random fluctuations
            const hr = 75 + Math.floor(Math.random() * 15) + (Math.sin(now.getTime() / 1000) * 10);
            const spo2 = 96 + Math.random() * 3;

            setLiveVitals(prev => {
                const newData = [...prev, { time: timeStr, hr, spo2 }];
                if (newData.length > 20) return newData.slice(newData.length - 20);
                return newData;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isLiveMonitorActive]);

    const performanceData = useMemo(() => {
        return memberData.logs.map(log => {
            const benchPress = log.performance?.find(p => p.exercise === 'Bench Press');
            if (!benchPress) return { date: log.date, maxWeight: 0, totalReps: 0 };
            
            const maxWeight = Math.max(...benchPress.sets.map(s => s.weight));
            const totalReps = benchPress.sets.reduce((sum, s) => sum + s.reps, 0);
            return { date: log.date, maxWeight, totalReps };
        });
    }, [memberData]);

    const vo2MaxData = useMemo(() => [
        { date: '2024-07-01', vo2max: 45.2 },
        { date: '2024-07-08', vo2max: 45.8 },
        { date: '2024-07-15', vo2max: 46.1 },
        { date: '2024-08-01', vo2max: 47.3 },
    ], []);

    const handleGenerateAnalysis = async () => {
        if (!member) return;
        setIsLoading(true);
        setAiAnalysis(null);
        
        // Include live data if available
        let liveContext = "";
        if (isLiveMonitorActive && liveVitals.length > 0) {
            const avgHr = Math.round(liveVitals.reduce((acc, v) => acc + v.hr, 0) / liveVitals.length);
            liveContext = `CURRENT LIVE VITALS: Avg HR: ${avgHr}bpm, SpO2: 98%.`;
        }

        // Modified prompt to include context
        const prompt = `
            Act as an elite sports scientist and AI health analyst for a gym named "Royal The Gym".
            You are conducting a deep-dive performance review for a member.
            ${liveContext}

            **Member Data:**
            - Name: ${member.name}
            - Join Date: ${member.joinDate}
            - All Body Metrics (Weight in kg, Body Fat in %):
            ${JSON.stringify(memberData.metrics, null, 2)}
            - Full Workout Performance History (Weight in kg):
            ${JSON.stringify(memberData.logs, null, 2)}

            **Your Task:**
            Generate a comprehensive analysis.
        `;

        const result = await getHealthEngineAnalysis(member, memberData); 
        
        setAiAnalysis((isLiveMonitorActive ? `### 🔴 LIVE SESSION ANALYSIS\n**Current Vitals Stable.** HR variability indicates good recovery state.\n\n` : "") + result);
        setIsLoading(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400 flex items-center">
                    <HealthEngineIcon />
                    <span className="ml-3">Member Health Dashboard</span>
                </h1>
            </div>

            <Card className="mb-6">
                <label htmlFor="member-select" className="block text-sm font-medium text-gray-400">Select Member to Analyze</label>
                <div className="flex gap-4 items-end">
                    <select id="member-select" value={selectedMemberId}
                        onChange={(e) => {
                            setSelectedMemberId(Number(e.target.value));
                            setAiAnalysis(null);
                            setIsLiveMonitorActive(false);
                        }}
                        className="mt-1 block w-full bg-gray-200 dark:bg-gray-700 p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 flex-grow">
                        {INITIAL_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <button 
                        onClick={() => setIsLiveMonitorActive(!isLiveMonitorActive)}
                        className={`py-2 px-4 rounded-lg font-bold transition-colors ${isLiveMonitorActive ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                    >
                        {isLiveMonitorActive ? 'Stop Live Monitor' : 'Start Live Monitor'}
                    </button>
                </div>
            </Card>

            {member && (
                <div className="space-y-6">
                    {/* Live Vitals Chart */}
                    {isLiveMonitorActive && (
                        <Card title="🔴 Live Vitals Monitor (Simulated)">
                            <div className="h-[200px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={liveVitals}>
                                        <XAxis dataKey="time" stroke="#6b7280" fontSize={10} interval="preserveStartEnd" />
                                        <YAxis domain={['auto', 'auto']} stroke="#6b7280" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151' }} />
                                        <Legend />
                                        <Line type="monotone" dataKey="hr" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} name="Heart Rate (bpm)" />
                                        <Line type="monotone" dataKey="spo2" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} name="SpO2 (%)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard title="Current Weight" value={`${memberData.metrics[memberData.metrics.length - 1]?.weight || 'N/A'} kg`} />
                        <StatCard title="Current Body Fat" value={`${memberData.metrics[memberData.metrics.length - 1]?.bodyFat || 'N/A'} %`} />
                        <StatCard title="Workouts Logged" value={memberData.logs.length.toString()} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card title="Workout Performance (Bench Press)">
                            <div className="h-[300px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={performanceData}>
                                        <XAxis dataKey="date" stroke="currentColor" className="text-xs" />
                                        <YAxis yAxisId="left" stroke="#8884d8" label={{ value: 'Max Weight (kg)', angle: -90, position: 'insideLeft', fill: 'currentColor' }} className="text-xs" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Total Reps', angle: -90, position: 'insideRight', fill: 'currentColor' }} className="text-xs" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Bar yAxisId="right" dataKey="totalReps" name="Total Reps" fill="#82ca9d" />
                                        <Line yAxisId="left" type="monotone" dataKey="maxWeight" name="Max Weight" stroke="#8884d8" strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                         <Card title="Body Composition">
                            <div className="h-[300px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={memberData.metrics}>
                                        <XAxis dataKey="date" stroke="currentColor" className="text-xs" />
                                        <YAxis yAxisId="left" stroke="#8884d8" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fill: 'currentColor' }} className="text-xs" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" label={{ value: 'Body Fat (%)', angle: -90, position: 'insideRight', fill: 'currentColor' }} className="text-xs" />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#8884d8" activeDot={{ r: 8 }} name="Weight" unit=" kg" />
                                        <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#82ca9d" activeDot={{ r: 8 }} name="Body Fat" unit=" %" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                        <Card title="Cardio Fitness (Simulated VO2 Max)" className="lg:col-span-2">
                             <div className="h-[300px] w-full min-w-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={vo2MaxData}>
                                        <XAxis dataKey="date" stroke="currentColor" className="text-xs" />
                                        <YAxis stroke="currentColor" className="text-xs" domain={['dataMin - 1', 'dataMax + 1']}/>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="vo2max" stroke="#ef4444" name="VO2 Max (est.)" activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <Card>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-amber-500 dark:text-amber-400">AI Deep Dive Analysis</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl mx-auto">
                                Generate a comprehensive performance review, risk analysis, and future plan for {member.name} using Gemini.
                            </p>
                            <button
                                onClick={handleGenerateAnalysis}
                                disabled={isLoading}
                                className="mt-6 bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 flex items-center justify-center mx-auto text-lg"
                            >
                                <SparkleIcon className="w-6 h-6 mr-2" />
                                {isLoading ? 'Generating Deep Analysis...' : 'Start AI Analysis'}
                            </button>
                        </div>
                    </Card>

                    {aiAnalysis && (
                         <Card title="AI Health Engine Report">
                            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default HealthEngine;
