import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { Activity, Target, Flame, ChevronRight, RefreshCcw, TrendingUp, Clock, ShieldCheck, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface LeanBulkCalculatorProps {
    memberId: number;
}

const LeanBulkCalculator: React.FC<LeanBulkCalculatorProps> = ({ memberId }) => {
    const { members, detailedWorkoutLogs, liveHealthData } = useData();
    const member = members.find(m => m.id === memberId);
    
    const [weight, setWeight] = useState(member?.physical_metrics?.weight || 70);
    const [sleepHours, setSleepHours] = useState(liveHealthData?.sleep?.totalHours || 7);
    const [recoveryScore, setRecoveryScore] = useState((liveHealthData as any)?.recoveryScore || 85);

    const calculatePlan = useMemo(() => {
        // 1. Maintenance Calories
        const maintenanceCalories = weight * 35;
        
        // 2. Lean Bulk Surplus (Adjusted by Recovery Score)
        // If recovery is low (< 70), reduce surplus to prevent fat gain from poor sleep
        const surplus = recoveryScore < 70 ? 150 : 300;
        const targetCalories = maintenanceCalories + surplus;
        
        // 3. Macro Calculation
        const proteinGrams = weight * 2.2; // High protein for hypertrophy
        const fatGrams = weight * 0.9;
        
        // Remaining calories for carbs
        const proteinCals = proteinGrams * 4;
        const fatCals = fatGrams * 9;
        const remainingCals = targetCalories - proteinCals - fatCals;
        const carbsGrams = remainingCals / 4;
        
        return {
            maintenance: maintenanceCalories,
            surplus,
            targetCalories: Math.round(targetCalories),
            macros: {
                protein: Math.round(proteinGrams),
                carbs: Math.round(carbsGrams),
                fat: Math.round(fatGrams)
            }
        };
    }, [weight, recoveryScore]);

    // Progressive Overload Logic
    const overloadSuggestions = useMemo(() => {
        const userLogs = detailedWorkoutLogs.filter(log => log.memberId === memberId);
        if (userLogs.length === 0) return [];

        // Get last 2 workouts
        const sortedLogs = [...userLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const recentLog = sortedLogs[0];

        const exercisesList = (recentLog as any).exercises || (recentLog as any).completedExercises || [];
        return exercisesList.map((ex: any) => {
            // Suggest 2.5kg increase for next session
            return {
                name: ex.name,
                currentWeight: ex.weight,
                suggestedWeight: ex.weight + 2.5,
                reps: ex.reps
            };
        }).slice(0, 3); // Show top 3
    }, [detailedWorkoutLogs, memberId]);

    const recoveryData = [
        { day: 'Mon', score: 80 },
        { day: 'Tue', score: 85 },
        { day: 'Wed', score: 70 },
        { day: 'Thu', score: 90 },
        { day: 'Fri', score: 95 },
        { day: 'Sat', score: recoveryScore },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-400" />
                        AI Bio-Analyst: Lean Bulk Calculator
                    </h2>
                    <p className="text-gray-400">Advanced Hypertrophy & Macro Programming</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Inputs & Macros */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-gray-900 border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-400" />
                                Scientific Macro Engine
                            </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <label className="block text-sm text-gray-400 mb-1">Current Weight (kg)</label>
                                <input 
                                    type="number" 
                                    value={weight}
                                    onChange={(e) => setWeight(Number(e.target.value))}
                                    className="w-full bg-transparent text-xl font-bold text-white border-none focus:ring-0 p-0"
                                />
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <label className="block text-sm text-gray-400 mb-1">Recovery Score</label>
                                <div className="text-xl font-bold text-green-400">{recoveryScore}%</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                                <label className="block text-sm text-gray-400 mb-1">Daily Target</label>
                                <div className="text-xl font-bold text-purple-400">{calculatePlan.targetCalories} kcal</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between text-sm text-gray-400">
                                <span>Maintenance: {calculatePlan.maintenance} kcal</span>
                                <span>Surplus: +{calculatePlan.surplus} kcal</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl text-center">
                                    <div className="text-sm text-blue-400 mb-1">Protein</div>
                                    <div className="text-2xl font-bold text-white">{calculatePlan.macros.protein}g</div>
                                    <div className="text-xs text-gray-500 mt-1">2.2g / kg</div>
                                </div>
                                <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl text-center">
                                    <div className="text-sm text-purple-400 mb-1">Carbs</div>
                                    <div className="text-2xl font-bold text-white">{calculatePlan.macros.carbs}g</div>
                                    <div className="text-xs text-gray-500 mt-1">Energy</div>
                                </div>
                                <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-xl text-center">
                                    <div className="text-sm text-orange-400 mb-1">Fats</div>
                                    <div className="text-2xl font-bold text-white">{calculatePlan.macros.fat}g</div>
                                    <div className="text-xs text-gray-500 mt-1">0.9g / kg</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Meal Timing */}
                    <Card className="bg-gray-900 border-gray-800">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-yellow-400" />
                            Optimized Meal Timing
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                    <span className="text-white">Pre-Workout (1-2 hrs prior)</span>
                                </div>
                                <span className="text-sm text-gray-400">High Carbs, Moderate Protein</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                    <span className="text-white">Post-Workout (Within 45 mins)</span>
                                </div>
                                <span className="text-sm text-gray-400">High Protein (Fast absorbing), Simple Carbs</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                    <span className="text-white">Before Bed</span>
                                </div>
                                <span className="text-sm text-gray-400">Casein Protein, Healthy Fats</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Overload & Recovery */}
                <div className="space-y-6">
                    <Card className="bg-gray-900 border-gray-800">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            Progressive Overload AI
                        </h3>
                        {overloadSuggestions.length > 0 ? (
                            <div className="space-y-3">
                                {overloadSuggestions.map((ex, idx) => (
                                    <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <div className="text-sm text-white font-medium mb-2">{ex.name}</div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">{ex.currentWeight}kg</span>
                                            <ChevronRight className="w-4 h-4 text-gray-600" />
                                            <span className="text-green-400 font-bold">{ex.suggestedWeight}kg</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 text-center py-4">
                                Log workouts to receive overload suggestions.
                            </div>
                        )}
                    </Card>

                    <Card className="bg-gray-900 border-gray-800">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                            <ShieldCheck className="w-5 h-5 text-blue-400" />
                            Recovery Trend
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={recoveryData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem', color: '#fff' }}
                                        itemStyle={{ color: '#60a5fa' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LeanBulkCalculator;
