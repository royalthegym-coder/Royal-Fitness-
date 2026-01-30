
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA, INITIAL_PACKAGES, GYM_INFO } from '../../constants';
import { Member, MemberFitnessData } from '../../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import { AIFitnessTrackerIcon } from './icons/AIFitnessTrackerIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface AIPlan {
    summary: string;
    workoutPlan: string;
    nutritionPlan: string;
}

const AIFitnessTracker: React.FC = () => {
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(INITIAL_MEMBERS[0]?.id || '');
    const [isLoading, setIsLoading] = useState(false);
    const [aiPlan, setAiPlan] = useState<AIPlan | null>(null);
    const [activeTab, setActiveTab] = useState<'summary' | 'workout' | 'nutrition'>('summary');
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Simulate Sync on Member Selection
    useEffect(() => {
        if(selectedMemberId) {
            setIsSyncing(true);
            const timer = setTimeout(() => setIsSyncing(false), 1500);
            return () => clearTimeout(timer);
        }
    }, [selectedMemberId]);

    const member: Member | undefined = useMemo(() => {
        return INITIAL_MEMBERS.find(m => m.id === Number(selectedMemberId));
    }, [selectedMemberId]);

    const memberData = useMemo(() => {
        if (!selectedMemberId) return { logs: [], metrics: [] };
        return INITIAL_MEMBER_FITNESS_DATA[Number(selectedMemberId)] || { logs: [], metrics: [] };
    }, [selectedMemberId]);

    // --- HYPERTROPHY PREDICTION LOGIC ---
    const volumeData = useMemo(() => {
        if (memberData.logs.length === 0) return [];
        
        let cumulativeGrowth = 0;
        return memberData.logs.map(log => {
            // V = Sets * Reps * Weight
            let volume = 0;
            if (log.performance) {
                log.performance.forEach((perf: any) => {
                    perf.sets.forEach((set: any) => {
                        volume += (set.weight || 0) * (set.reps || 0);
                    });
                });
            } else {
                volume = 2000; // Baseline fallback
            }
            
            // Simplified Growth Model: Volume / 5000 = grams of LBM (Hypothetical)
            cumulativeGrowth += (volume / 10000); 
            
            return {
                date: log.date,
                volume: volume,
                predictedLBM: 70 + cumulativeGrowth // Baseline LBM + Gain
            };
        });
    }, [memberData]);

    const handleGeneratePlan = async () => {
        // ... (Existing AI Plan Generation Logic)
        if (!member) return;
        setIsLoading(true);
        setAiPlan(null);
        setIsSaved(false);

        const packageInfo = INITIAL_PACKAGES.find(p => p.id === member.packageId);
        const goal = packageInfo?.category || 'General Fitness';

        const prompt = `
            Act as an expert AI Fitness and Nutrition coach for "${GYM_INFO.name}".
            // ... (rest of prompt unchanged) ...
            Your response must be structured with these exact three '###' headers.
        `;

        const result = await getComplexResponse(prompt);
        // ... (parsing logic) ...
        const summary = result.split('### Performance Summary ###')[1]?.split('### 4-Week Workout Plan ###')[0]?.trim() || 'Summary generated.';
        const workoutPlan = result.split('### 4-Week Workout Plan ###')[1]?.split('### Nutrition Plan ###')[0]?.trim() || 'Plan generated.';
        const nutritionPlan = result.split('### Nutrition Plan ###')[1]?.trim() || 'Nutrition generated.';
        
        setAiPlan({ summary, workoutPlan, nutritionPlan });
        setIsLoading(false);
    };

    const handleSavePlan = () => {
        setIsSaved(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <AIFitnessTrackerIcon />
                    <span className="ml-3">AI Fitness Tracker</span>
                </h1>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-grow w-full">
                        <label htmlFor="member-select" className="block text-sm font-medium text-gray-400">Select Member to Analyze</label>
                        <select
                            id="member-select"
                            value={selectedMemberId}
                            onChange={(e) => {
                                setSelectedMemberId(Number(e.target.value));
                                setAiPlan(null); 
                                setIsSaved(false);
                            }}
                            className="mt-1 block w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            {INITIAL_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    {isSyncing && (
                        <div className="flex items-center text-blue-400 text-sm mt-6 sm:mt-4 animate-pulse">
                            <AutoUpdateIcon className="w-4 h-4 mr-2" /> Syncing Wearable Data...
                        </div>
                    )}
                </div>
            </Card>

            {member && (
                <div className="mt-6 space-y-6">
                    {/* NEW: Hypertrophy Predictor Chart */}
                    <Card title="AI Hypertrophy Predictor (Growth Forecast)" className="border-t-4 border-green-500">
                        <p className="text-xs text-gray-400 mb-4">
                            Projected Lean Body Mass (LBM) growth based on Progressive Overload Volume (V = Sets × Reps × Weight).
                        </p>
                        <div className="h-[300px] w-full min-w-0">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={volumeData}>
                                    <defs>
                                        <linearGradient id="colorLbm" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" stroke="#A0AEC0" fontSize={12} />
                                    <YAxis yAxisId="left" stroke="#10b981" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} label={{ value: 'LBM (kg)', angle: -90, position: 'insideLeft', fill: '#10b981' }}/>
                                    <YAxis yAxisId="right" stroke="#8884d8" fontSize={12} orientation="right" label={{ value: 'Volume (kg)', angle: 90, position: 'insideRight', fill: '#8884d8' }}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#1A202C' }} />
                                    <Legend />
                                    <Area yAxisId="left" type="monotone" dataKey="predictedLBM" stroke="#10b981" fillOpacity={1} fill="url(#colorLbm)" name="Projected Muscle Mass (LBM)" />
                                    <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#8884d8" strokeWidth={2} name="Training Volume" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* ... Existing Profile Cards ... */}
                        <Card title="Member Profile">
                             <div className="flex items-center">
                                <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full mr-4 object-cover"/>
                                <div>
                                    <p className="text-xl font-bold">{member.name}</p>
                                    <p className="text-sm text-gray-400">{member.email}</p>
                                </div>
                            </div>
                            <div className="mt-4 text-sm space-y-2">
                                <p><strong>Goal:</strong> {INITIAL_PACKAGES.find(p=>p.id === member.packageId)?.category || 'N/A'}</p>
                                <p><strong>Member Since:</strong> {member.joinDate}</p>
                            </div>
                        </Card>
                        {/* ... */}
                    </div>

                    {/* ... Existing Plan Button ... */}
                    <button
                        onClick={handleGeneratePlan}
                        disabled={isLoading || isSyncing}
                        className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 flex items-center justify-center text-lg"
                    >
                        <SparkleIcon className="w-6 h-6 mr-2" />
                        {isLoading ? 'Analyzing Member Data...' : 'Generate AI Analysis & Future Plan'}
                    </button>

                    {aiPlan && (
                        <div className="mt-6">
                             {/* ... Existing Plan Tabs ... */}
                             <div className="flex flex-col sm:flex-row justify-between items-center border-b border-gray-700 mb-6 pb-2 gap-4">
                                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                                    <button onClick={() => setActiveTab('summary')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Performance Summary</button>
                                    <button onClick={() => setActiveTab('workout')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'workout' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>4-Week Workout Plan</button>
                                    <button onClick={() => setActiveTab('nutrition')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'nutrition' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>Nutrition Plan</button>
                                </nav>
                                {activeTab === 'workout' && (
                                    <button 
                                        onClick={handleSavePlan}
                                        disabled={isSaved}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center ${isSaved ? 'bg-green-600 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                    >
                                        {isSaved ? <><CheckCircleIcon className="w-4 h-4 mr-2"/> Plan Active</> : 'Apply to Schedule'}
                                    </button>
                                )}
                            </div>
                            <Card>
                                {activeTab === 'summary' && <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiPlan.summary.replace(/\n/g, '<br />') }} />}
                                {activeTab === 'workout' && <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiPlan.workoutPlan.replace(/\n/g, '<br />') }} />}
                                {activeTab === 'nutrition' && <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: aiPlan.nutritionPlan.replace(/\n/g, '<br />') }} />}
                            </Card>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AIFitnessTracker;
