
import React, { useState, useMemo, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA, INITIAL_PACKAGES, GYM_INFO } from '../constants';
import { Member, MemberFitnessData } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getComplexResponse } from '../lib/gemini';
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

    const memberData: { logs: any[]; metrics: any[] } = useMemo(() => {
        if (!selectedMemberId) return { logs: [], metrics: [] };
        return INITIAL_MEMBER_FITNESS_DATA[Number(selectedMemberId)] || { logs: [], metrics: [] };
    }, [selectedMemberId]);

    const workoutConsistency = useMemo(() => {
        if (memberData.logs.length === 0) return { total: 0, weeklyAvg: 0 };
        const firstLogDate = new Date(memberData.logs[0].date);
        const lastLogDate = new Date(memberData.logs[memberData.logs.length - 1].date);
        const weeks = (lastLogDate.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24 * 7) || 1;
        return {
            total: memberData.logs.length,
            weeklyAvg: (memberData.logs.length / weeks).toFixed(1),
        };
    }, [memberData.logs]);

    const handleGeneratePlan = async () => {
        if (!member) return;
        setIsLoading(true);
        setAiPlan(null);
        setIsSaved(false);

        const packageInfo = INITIAL_PACKAGES.find(p => p.id === member.packageId);
        const goal = packageInfo?.category || 'General Fitness';

        const prompt = `
            Act as an expert AI Fitness and Nutrition coach for "${GYM_INFO.name}".

            You are analyzing the complete fitness journey of a gym member to provide a comprehensive performance review and create a highly personalized, forward-looking 4-week plan.

            **Member Data:**
            - Name: ${member.name}
            - Join Date: ${member.joinDate}
            - Current Goal (inferred from package): ${goal}
            - All Body Metrics (Weight & Body Fat %):
            ${JSON.stringify(memberData.metrics)}
            - Full Workout Log History:
            ${JSON.stringify(memberData.logs)}

            **Your Task:**
            Generate a detailed report with three distinct sections. YOU MUST use the exact headers provided below to separate the sections.

            ### Performance Summary ###
            - Analyze the member's progress based on their weight and body fat changes over time.
            - Comment on their workout consistency and frequency from the logs.
            - Identify strengths, weaknesses, and potential plateaus.
            - Provide motivational feedback on their journey so far.

            ### 4-Week Workout Plan ###
            - Create a detailed, week-by-week, day-by-day workout schedule for the next 4 weeks.
            - The plan should be a logical progression from their previous workouts.
            - For each workout day, specify the exercises, sets, reps, and rest periods.
            - Include a mix of strength training, cardio, and rest days.
            - Format this section clearly using markdown (e.g., **Week 1**, *Day 1: Push*, etc.).

            ### Nutrition Plan ###
            - Create a comprehensive diet plan that aligns with the new 4-week workout plan and the member's goal.
            - Provide a daily structure (e.g., Breakfast, Lunch, Dinner, Snacks).
            - Include both vegetarian and non-vegetarian options.
            - Estimate daily calorie and macronutrient targets (Protein, Carbs, Fat).
            - Offer 3-5 general nutrition tips for success.

            Your response must be structured with these exact three '###' headers to allow for automatic parsing.
        `;

        const result = await getComplexResponse(prompt);

        const summary = result.split('### Performance Summary ###')[1]?.split('### 4-Week Workout Plan ###')[0]?.trim() || 'Could not generate summary.';
        const workoutPlan = result.split('### 4-Week Workout Plan ###')[1]?.split('### Nutrition Plan ###')[0]?.trim() || 'Could not generate workout plan.';
        const nutritionPlan = result.split('### Nutrition Plan ###')[1]?.trim() || 'Could not generate nutrition plan.';
        
        setAiPlan({ summary, workoutPlan, nutritionPlan });
        setIsLoading(false);
    };

    const handleSavePlan = () => {
        setIsSaved(true);
        // Logic to actually save to backend would go here
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
                                setAiPlan(null); // Reset plan when member changes
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
                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <Card title="Workout Consistency">
                             <div className="text-center">
                                <p className="text-5xl font-bold text-amber-400">{workoutConsistency.total}</p>
                                <p className="text-gray-400">Total Workouts Logged</p>
                                <p className="mt-4 text-2xl font-bold">{workoutConsistency.weeklyAvg}</p>
                                <p className="text-gray-400 text-sm">Workouts / Week (Avg)</p>
                            </div>
                        </Card>
                         <Card title="Latest Metrics">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-gray-400 text-sm">Weight</p>
                                    <p className="text-3xl font-bold">{memberData.metrics[memberData.metrics.length - 1]?.weight || 'N/A'} kg</p>
                                </div>
                                 <div>
                                    <p className="text-gray-400 text-sm">Body Fat</p>
                                    <p className="text-3xl font-bold">{memberData.metrics[memberData.metrics.length - 1]?.bodyFat || 'N/A'} %</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <Card title="Weight Progress (kg)">
                             <div className="h-[250px] w-full min-w-0">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={memberData.metrics}>
                                        <XAxis dataKey="date" stroke="#A0AEC0" fontSize={12} />
                                        <YAxis stroke="#A0AEC0" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']}/>
                                        <Tooltip contentStyle={{ backgroundColor: '#1A202C' }} />
                                        <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                         <Card title="Body Fat Progress (%)">
                             <div className="h-[250px] w-full min-w-0">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={memberData.metrics}>
                                        <XAxis dataKey="date" stroke="#A0AEC0" fontSize={12}/>
                                        <YAxis stroke="#A0AEC0" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']}/>
                                        <Tooltip contentStyle={{ backgroundColor: '#1A202C' }} />
                                        <Line type="monotone" dataKey="bodyFat" stroke="#82ca9d" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGeneratePlan}
                            disabled={isLoading || isSyncing}
                            className="w-full bg-amber-500 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 flex items-center justify-center text-lg"
                        >
                            <SparkleIcon className="w-6 h-6 mr-2" />
                            {isLoading ? 'Analyzing Member Data...' : 'Generate AI Analysis & Future Plan'}
                        </button>
                    </div>

                    {aiPlan && (
                        <div className="mt-6">
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
