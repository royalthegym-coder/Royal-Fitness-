
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    Utensils, ChefHat, Sparkles, RefreshCw, Zap, Leaf,
    Activity, Clock, AlertTriangle, CheckCircle, Scale,
    Flame, Droplets, ShoppingCart, ArrowRight, BrainCircuit,
    Cpu, BarChart3, List, Share2, Download, Target
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { BotIcon } from '../icons/BotIcon';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']; // Protein, Carbs, Fats, Other

const NutritionAdvisor: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, liveHealthData } = useData();
    const member = members.find(m => m.id === memberId);
    
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'plan' | 'analytics' | 'shopping'>('plan');

    // --- LOGIC ---
    const activePlan = member?.approvedDietPlan;

    // Adjusted Macros based on Live Health Data (Metabolic Matrix)
    const adjustedMacros = useMemo(() => {
        if (!activePlan) return null;
        const activityMultiplier = (liveHealthData.steps > 10000 || liveHealthData.caloriesBurned > 600) ? 1.15 : 1.0;
        
        return {
            calories: Math.round(activePlan.caloriesTarget * activityMultiplier),
            protein: activePlan.macrosTarget.protein,
            carbs: Math.round(activePlan.macrosTarget.carbs * activityMultiplier),
            fat: activePlan.macrosTarget.fats
        };
    }, [activePlan, liveHealthData]);

    const macroData = useMemo(() => {
        if (!adjustedMacros) return [];
        return [
            { name: 'Protein', value: Number(adjustedMacros.protein) },
            { name: 'Carbs', value: Number(adjustedMacros.carbs) },
            { name: 'Fats', value: Number(adjustedMacros.fat) },
        ];
    }, [adjustedMacros]);
    
    const microData = useMemo(() => {
        // Mock data for display, in real app this would come from the plan
        return [
            { subject: 'Vit D', A: 80, fullMark: 100 },
            { subject: 'Iron', A: 60, fullMark: 100 },
            { subject: 'Magnesium', A: 90, fullMark: 100 },
            { subject: 'Zinc', A: 70, fullMark: 100 },
            { subject: 'B12', A: 50, fullMark: 100 },
        ];
    }, []);

    if (!member) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-emerald-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(16,185,129,0.15)] group">
                <div className="relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-emerald-600 text-white rounded-[2.5rem] shadow-[0_0_60px_rgba(16,185,129,0.5)] border border-emerald-400 group-hover:rotate-12 transition-transform duration-700">
                             <Leaf className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center gap-3 shadow-lg font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                                <Cpu className="w-3 h-3" /> Nutri-Genix Core v31.0
                            </div>
                            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Fuel Protocol
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex bg-gray-900 p-2 rounded-2xl border border-white/10 w-fit">
                <button onClick={() => setActiveTab('plan')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${activeTab === 'plan' ? 'bg-white text-black' : 'text-gray-500'}`}><List className="w-4 h-4"/> Plan</button>
                <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-white text-black' : 'text-gray-500'}`}><BarChart3 className="w-4 h-4"/> Analytics</button>
                <button onClick={() => setActiveTab('shopping')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 ${activeTab === 'shopping' ? 'bg-white text-black' : 'text-gray-500'}`}><ShoppingCart className="w-4 h-4"/> List</button>
            </div>

            {!activePlan ? (
                <Card className="text-center py-20">
                    <BotIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Protocol Found</h3>
                    <p className="text-gray-500 mt-2">Awaiting Admin to synthesize your neural diet plan.</p>
                </Card>
            ) : (
                <div className="animate-fade-in">
                    {activeTab === 'plan' && (
                        <div className="space-y-4">
                            {activePlan.meals.map((meal, idx) => (
                                <Card key={idx} className="bg-[#0c0c0c] border-white/5 p-6 rounded-[2.5rem]">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{meal.name} • {meal.time}</p>
                                            <h4 className="text-xl font-bold text-white">{meal.items.map(i => i.food).join(', ')}</h4>
                                        </div>
                                        <span className="text-xl font-black text-emerald-400 italic">{meal.totalCalories} kcal</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-mono border-t border-white/5 pt-3">
                                        <span className="bg-white/5 px-2 py-1 rounded">{`P:${meal.macros.protein} C:${meal.macros.carbs} F:${meal.macros.fats}`}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                    {activeTab === 'analytics' && (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card title="Macro Distribution" className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                     <PieChart>
                                        <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {macroData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card>
                             <Card title="Micro-Nutrient Shield" className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={microData}>
                                        <PolarGrid stroke="#333" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10 }} />
                                        <Radar name="Level" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Card>
                         </div>
                    )}
                     {activeTab === 'shopping' && (
                        <Card title="Auto-Procurement Manifest" className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {activePlan.meals.flatMap(m => m.items).map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-900 rounded-2xl border border-white/5">
                                        <div className="w-5 h-5 rounded-md border-2 border-gray-600"></div>
                                        <span className="text-sm font-bold text-gray-300">{item.food}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default NutritionAdvisor;
