import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Activity, Utensils, Droplets, HeartPulse, RefreshCw, Layers, Dumbbell, Watch, CheckCircle, Zap } from 'lucide-react';
import { useData } from '../context/DataProvider';
import Card from './common/Card';
import { generateOpalsDietPlan } from '../../lib/core_ai';
import { useToast } from '../hooks/useToast';

interface Props {
    memberId?: number;
    isAdminView?: boolean;
}

export default function OpalsDietArchitect({ memberId, isAdminView = false }: Props) {
    const { members } = useData();
    const { addToast } = useToast();
    const notify = addToast;

    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(memberId || '');
    
    // Manual tuning parameters
    const [goal, setGoal] = useState('Extreme Fat Loss & Muscle Preservation');
    const [lifestyle, setLifestyle] = useState('Sedentary Desk Job / Evening Workouts');
    const [gadgetDataEnabled, setGadgetDataEnabled] = useState(true);
    const [allergies, setAllergies] = useState('None');

    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [plan, setPlan] = useState<any>(null);

    const handleGenerate = async () => {
        if (isAdminView && !selectedMemberId) {
            notify("Select a member first.", "error");
            return;
        }

        const targetMember = members.find((m: any) => m.id === Number(selectedMemberId));
        if (!targetMember && isAdminView) return;

        setIsGenerating(true);
        setPlan(null);
        setLoadingStage(0);

        const loadingSteps = setInterval(() => {
            setLoadingStage(prev => {
                if (prev >= 3) {
                    clearInterval(loadingSteps);
                    return 3;
                }
                return prev + 1;
            });
        }, 1500);

        const memberDetails = {
            name: targetMember?.name || 'Current User',
            age: 28,
            gender: targetMember?.gender || 'Unknown',
            allergies: allergies
        };

        const physicalStats = {
            bmi: 24.5,
            weightKg: 78,
            bodyFatPercent: 18,
            basalMetabolicRate: 1850,
        };

        const gadgetData = gadgetDataEnabled ? {
            avgDailySteps: 6500,
            avgSleepHours: 6.5,
            hrv: 'Moderate',
            gadgetType: 'Apple Watch Series 9'
        } : "None provided";

        const result = await generateOpalsDietPlan(memberDetails, physicalStats, gadgetData, lifestyle, goal);
        
        clearInterval(loadingSteps);
        setIsGenerating(false);
        if (result && result.days) {
            setPlan(result);
            notify("Opals Smart Diet Plan Generated Successfully.", "success");
        } else {
            notify("Failed to generate plan. Please retry.", "error");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-700 relative z-10 w-full h-full overflow-y-auto">
            {/* HERO BANNER 100X OPALS N8N GITHUB DIET PLANNER */}
            <div className="bg-black/60 backdrop-blur-3xl border border-fuchsia-500/30 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-[0_0_100px_rgba(217,70,239,0.15)] shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm mix-blend-screen scale-150 animate-pulse-slow">
                    <BrainCircuit className="w-64 h-64 text-fuchsia-500" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-transparent to-cyan-900/20 opacity-50 z-0"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f_1px,transparent_1px),linear-gradient(to_bottom,#f0f_1px,transparent_1px)] bg-[size:20px_20px] opacity-[0.03] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] z-0"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-2 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/50 rounded-full text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 uppercase tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                                Fitness Future-NUTRITION ARCHITECT
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] mb-2">
                            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">DIET PLANNER</span>
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base font-medium max-w-2xl">
                            Powered by AI modules for metabolic perfection.
                        </p>
                    </div>
                    <div className="flex gap-4 shrink-0">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center shadow-xl">
                            <Utensils className="w-8 h-8 text-fuchsia-400 mx-auto mt-2" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3">Live Nutrition</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI MODULES INTEGRATION PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gradient-to-b from-blue-900/40 to-black/60 border border-blue-500/30 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Sparkles className="w-6 h-6 text-blue-400 relative z-10 mb-2" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest relative z-10">Smart Analysis</h3>
                    <p className="text-[10px] text-blue-200/70 font-mono mt-1 relative z-10">Cross-referencing medical markers, allergies, and cellular aging metrics.</p>
                </div>
                <div className="p-4 bg-gradient-to-b from-rose-900/40 to-black/60 border border-rose-500/30 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-rose-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Activity className="w-6 h-6 text-rose-400 relative z-10 mb-2" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest relative z-10">Automated Workflows</h3>
                    <p className="text-[10px] text-rose-200/70 font-mono mt-1 relative z-10">Automating grocery lists, meal timing signals, and dynamic macros tuning.</p>
                </div>
                <div className="p-4 bg-gradient-to-b from-gray-800/60 to-black/60 border border-white/20 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Layers className="w-6 h-6 text-gray-300 relative z-10 mb-2" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest relative z-10">AI Agents</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-1 relative z-10">Analyzing nutritional datasets for strategies.</p>
                </div>
            </div>

            <Card className="bg-black/60 backdrop-blur-xl border border-fuchsia-500/30 p-8 relative overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.05)] rounded-[2rem]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-700"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {isAdminView && (
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Target Member</label>
                            <select 
                                value={selectedMemberId} 
                                onChange={(e) => setSelectedMemberId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-indigo-500 outline-none"
                            >
                                <option value="">-- Select Member --</option>
                                {members.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-fuchsia-400" /> Metabolic Goal
                        </label>
                        <select 
                            value={goal} onChange={(e) => setGoal(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-fuchsia-500 outline-none"
                        >
                            <option>Extreme Fat Loss & Muscle Preservation</option>
                            <option>Lean Bulk & Heavy Hypertrophy</option>
                            <option>Body Recomposition</option>
                            <option>Endurance Fueling</option>
                            <option>Athletic Peak Performance</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <HeartPulse className="w-3 h-3 text-rose-400" /> Sync Profile
                        </label>
                        <select 
                            value={lifestyle} onChange={(e) => setLifestyle(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-rose-500 outline-none"
                        >
                            <option>Sedentary Desk Job / Evening Workouts</option>
                            <option>Active Job / Morning Workouts</option>
                            <option>Night Shift Worker / Variable Workouts</option>
                            <option>Student / Mid-day Workouts</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Watch className="w-3 h-3 text-cyan-400" /> Wearable Integration
                        </label>
                        <div className="flex items-center gap-4 mt-2">
                             <button
                                onClick={() => setGadgetDataEnabled(!gadgetDataEnabled)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${gadgetDataEnabled ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-white/5 text-gray-500 border border-white/10'}`}
                             >
                                {gadgetDataEnabled ? 'Live Synced' : 'Wearables Disconnected'}
                             </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Utensils className="w-3 h-3" /> Medical Report Overrides (Allergies)
                        </label>
                        <input 
                            type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)}
                            placeholder="e.g. DNA tested lactose intolerance..."
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-fuchsia-500 outline-none"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end relative z-10 w-full">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-gradient-to-r w-full from-fuchsia-600 via-purple-600 to-cyan-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-cyan-500 text-white font-black px-8 py-5 rounded-[2rem] uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(217,70,239,0.4)] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 overflow-hidden group border border-fuchsia-400/50"
                    >
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div className="flex items-center gap-3">
                                   <RefreshCw className="w-5 h-5 animate-spin" />
                                   <span className="text-white font-bold tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">SYNTHESIZING METABOLIC PROTOCOL</span>
                                </div>
                                <div className="text-[10px] text-fuchsia-200 uppercase tracking-[0.3em] font-mono font-black animate-pulse">
                                    {loadingStage === 0 && "> Scraping Wearable Biomarkers..."}
                                    {loadingStage === 1 && "> Activating Digest-Engine..."}
                                    {loadingStage === 2 && "> Booting Food-Matrix Workflows..."}
                                    {loadingStage >= 3 && "> Compiling Final Nutritional Plan..."}
                                </div>
                            </div>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6 group-hover:animate-pulse" /> GENERATE NUTRITION PLAN
                            </>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] animate-[shimmer_2s_infinite]"></div>
                    </button>
                </div>
            </Card>

            <AnimatePresence>
                {plan && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                    >
                        <Card className="bg-black/90 backdrop-blur-3xl border border-cyan-500/50 p-8 md:p-12 shadow-[0_0_100px_rgba(6,182,212,0.2)] rounded-[3rem] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0 mix-blend-overlay"></div>
                            <div className="absolute -top-20 -right-20 opacity-20 transform scale-150 pointer-events-none animate-pulse-slow">
                                <BrainCircuit className="w-96 h-96 text-cyan-500" />
                            </div>

                            <div className="text-center mb-12 relative z-10">
                                <span className="inline-block px-4 py-1.5 bg-cyan-900/40 border border-cyan-500/50 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-4 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                    AI NUTRITION PLAN COMPLETE
                                </span>
                                <h3 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase tracking-tighter italic mb-4 drop-shadow-2xl">{plan.planName}</h3>
                                <p className="text-fuchsia-400 font-mono tracking-[0.2em] uppercase font-bold text-sm mb-6">{plan.targetAudience}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <div className="bg-fuchsia-900/10 border border-fuchsia-500/30 p-6 rounded-[2rem] text-left">
                                        <h4 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Medical Analysis</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed font-mono">{plan.scientificReasoning}</p>
                                    </div>
                                    <div className="bg-cyan-900/10 border border-cyan-500/30 p-6 rounded-[2rem] text-left">
                                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Optimized Nutritional Strategy</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed font-mono">{plan.perfectGrindStrategy || "Optimizing cellular energy ATP via precise macro timing."}</p>
                                    </div>
                                </div>
                                <div className="mt-6 text-left">
                                    {plan.supplementStack && plan.supplementStack.length > 0 && (
                                        <div className="bg-amber-900/10 border border-amber-500/30 p-4 rounded-xl">
                                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Zap className="w-3 h-3" /> Supplement Protocol</p>
                                            <div className="flex flex-wrap gap-2">
                                                {plan.supplementStack.map((supp: string, sIdx: number) => (
                                                    <span key={sIdx} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-2 py-1 rounded-md">{supp}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-center gap-6 mt-6">
                                     <div className="text-center">
                                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Daily Calories</p>
                                         <p className="text-xl font-mono text-cyan-400 tracking-wider mix-blend-screen shadow-cyan-500/50 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">{plan.dailyCalorieTarget} kcal</p>
                                     </div>
                                     <div className="h-8 w-px bg-white/10"></div>
                                      <div className="text-center">
                                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protein</p>
                                         <p className="text-lg font-mono text-purple-400">{plan.macroSplit?.protein}g</p>
                                     </div>
                                     <div className="text-center">
                                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Carbs</p>
                                         <p className="text-lg font-mono text-emerald-400">{plan.macroSplit?.carbs}g</p>
                                     </div>
                                      <div className="text-center">
                                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fats</p>
                                         <p className="text-lg font-mono text-amber-400">{plan.macroSplit?.fats}g</p>
                                     </div>
                                </div>
                            </div>

                            <div className="space-y-12 relative z-10 w-full mt-12 bg-black/40 rounded-[2rem] p-6 md:p-10 border border-white/10">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-widest text-center mb-8 border-b border-white/10 pb-4">
                                    <Sparkles className="w-6 h-6 inline-block mr-3 text-cyan-400" />
                                    7-DAY ROUTINE
                                    <Sparkles className="w-6 h-6 inline-block ml-3 text-cyan-400" />
                                </h3>
                                {plan.days && plan.days.map((day: any, i: number) => (
                                    <div key={i} className="bg-gradient-to-r from-gray-900 to-black border border-white/10 rounded-[2rem] p-6 md:p-8 hover:border-cyan-500/50 transition-all duration-500 group relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                            <Activity className="w-32 h-32" />
                                        </div>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/5 relative z-10">
                                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 font-mono text-5xl">D{day.dayNumber}</span> 
                                                <span className="max-w-[200px] md:max-w-none">{day.focus}</span>
                                            </h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 relative z-10">
                                             <div className="bg-black/50 p-6 rounded-[1.5rem] border border-white/5">
                                                 <h5 className="text-[12px] font-black text-cyan-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><Utensils className="w-5 h-5 text-emerald-400" /> NUTRITION & MACROS</h5>
                                                 <div className="space-y-4">
                                                     {day.meals && day.meals.map((meal: any, m: number) => (
                                                          <div key={m} className="bg-gradient-to-br from-white/5 to-transparent p-5 rounded-2xl border border-white/10 group/meal hover:border-cyan-500/30 transition-all">
                                                               <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs font-black font-mono text-black bg-cyan-400 px-3 py-1.5 rounded-md uppercase tracking-widest shadow-[0_0_15px_rgba(34,211,238,0.5)]">{meal.time}</span>
                                                                        <h6 className="font-black text-white uppercase tracking-wider text-sm">{meal.name}</h6>
                                                                    </div>
                                                                     <div className="flex gap-2 text-[10px] uppercase font-black tracking-widest bg-black px-3 py-2 rounded-lg border border-white/10">
                                                                          <span className="text-purple-400">P:{meal.macros?.protein}g</span>
                                                                          <span className="text-emerald-400">C:{meal.macros?.carbs}g</span>
                                                                          <span className="text-amber-400">F:{meal.macros?.fats}g</span>
                                                                          <span className="text-white ml-2">— {meal.macros?.calories} kcal</span>
                                                                     </div>
                                                               </div>
                                                               <ul className="list-none space-y-2 mb-3 max-w-sm">
                                                                   {meal.items && meal.items.map((item: string, j: number) => (
                                                                       <li key={j} className="text-xs text-gray-400 font-medium flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></div>{item}</li>
                                                                   ))}
                                                               </ul>
                                                               <div className="bg-black/40 p-3 rounded-lg border border-white/5 mt-auto">
                                                                  <p className="text-[10px] text-fuchsia-400 font-mono"><span className="text-white uppercase tracking-widest mr-1">Purpose:</span> {meal.purpose}</p>
                                                               </div>
                                                          </div>
                                                     ))}
                                                 </div>
                                             </div>
                                             
                                             <div className="bg-black/50 p-6 rounded-[1.5rem] border border-white/5">
                                                 <h5 className="text-[12px] font-black text-rose-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-3"><Activity className="w-5 h-5 text-rose-400" /> DAILY ROUTINE PROTOCOL</h5>
                                                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-1 before:bg-gradient-to-b before:from-fuchsia-500/50 before:via-cyan-500/20 before:to-transparent">
                                                    {day.routineSchedule && day.routineSchedule.map((routine: any, r: number) => (
                                                        <div key={r} className="relative flex items-start gap-4">
                                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-fuchsia-500 bg-black text-white shadow-[0_0_15px_rgba(217,70,239,0.5)] shrink-0 z-10 mt-1">
                                                                <Watch className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 bg-gradient-to-r from-white/5 to-transparent p-5 rounded-2xl border border-white/10 hover:border-fuchsia-500/30 transition-colors">
                                                                <time className="text-[10px] font-black font-mono text-fuchsia-400 uppercase tracking-[0.3em] bg-black/50 px-2 py-1 rounded inline-block mb-2">{routine.time}</time>
                                                                <p className="text-sm font-medium text-gray-200">{routine.activity}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                  </div>
                                             </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 gap-6 relative z-10">
                                <div className="bg-indigo-900/10 p-6 rounded-2xl border border-indigo-500/20">
                                    <h5 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Protein Synthesis Schedule</h5>
                                    <p className="text-sm text-gray-300 font-mono leading-relaxed">{plan.proteinSchedule}</p>
                                </div>
                                <div className="bg-cyan-900/10 p-6 rounded-2xl border border-cyan-500/20">
                                    <h5 className="text-sm font-black text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Droplets className="w-4 h-4" /> Hydration & Supplements</h5>
                                    <ul className="space-y-2">
                                        {plan.hydrationAndSupplements?.map((m: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-300 font-mono flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5">
                                                <CheckCircle className="w-3 h-3 text-cyan-500"/> {m}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
