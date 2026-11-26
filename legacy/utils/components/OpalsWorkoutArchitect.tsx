import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Sparkles, Activity, FileText, ChevronDown, CheckCircle, RefreshCw, Layers, Target, ShieldAlert, Dumbbell } from 'lucide-react';
import { useData } from '../context/DataProvider';
import Card from './common/Card';
import { generateEliteOpalsWorkoutPlan } from '../../lib/core_ai';
import { useToast } from '../hooks/useToast';

interface Props {
    memberId?: number;
    isAdminView?: boolean;
}

export default function OpalsWorkoutArchitect({ memberId, isAdminView = false }: Props) {
    const { members, updateMember, addAuditLog, addWorkoutTemplate } = useData();
    const { addToast } = useToast();
    const notify = addToast;

    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(memberId || '');
    
    // Manual tuning parameters
    const [goals, setGoals] = useState('Ultimate Hypertrophy & Strength');
    const [equipment, setEquipment] = useState('Full Gym Access');
    const [focusAreas, setFocusAreas] = useState('Total Body Balanced');
    const [injuries, setInjuries] = useState('None');
    const [intensity, setIntensity] = useState('Moderate (Standard Steady Algorithmic)');
    const [fitnessLevel, setFitnessLevel] = useState('Intermediate');

    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStage, setLoadingStage] = useState(0);
    const [plan, setPlan] = useState<any>(null);

    // Auto-prefill statistics when target member changes
    React.useEffect(() => {
        const targetMember = members.find((m: any) => m.id === Number(selectedMemberId || memberId));
        if (targetMember) {
            if (targetMember.medical_history?.conditions && targetMember.medical_history.conditions.length > 0) {
                setInjuries(targetMember.medical_history.conditions.join(', '));
            }
            if (targetMember.fitnessGoal) {
                setGoals(targetMember.fitnessGoal);
            }
            if (targetMember.trainingStyle) {
                setEquipment(targetMember.trainingStyle);
            }
            if (targetMember.level) {
                const lvl = targetMember.level > 15 ? 'Advanced' : targetMember.level > 5 ? 'Intermediate' : 'Beginner';
                setFitnessLevel(lvl);
            }
        }
    }, [selectedMemberId, memberId, members]);

    const handleGenerate = async () => {
        const activeId = isAdminView ? selectedMemberId : memberId;
        if (!activeId) {
            notify("Select a member first.", "error");
            return;
        }

        const targetMember = members.find((m: any) => m.id === Number(activeId));
        if (!targetMember) return;

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
            injuries: injuries,
            focus: focusAreas
        };

        const weightVal = targetMember?.physical_metrics?.weight || 78;
        const heightVal = targetMember?.physical_metrics?.height || 175;
        const calculatedBmi = targetMember?.physical_metrics ? (weightVal / ((heightVal / 100) * (heightVal / 100))) : 24.5;
        const bodyFatPercent = targetMember?.physical_metrics?.body_fat || 15;

        const physicalStats = {
            bmi: Number(calculatedBmi.toFixed(1)),
            weightKg: weightVal,
            bodyFatPercent: bodyFatPercent,
            fitnessLevel: fitnessLevel
        };

        const synthesizedGoal = `${goals} at ${intensity} intensity level`;

        const result = await generateEliteOpalsWorkoutPlan(memberDetails, physicalStats, synthesizedGoal, equipment);
        
        clearInterval(loadingSteps);
        setIsGenerating(false);
        if (result && result.days) {
            setPlan(result);
            notify("Opals Smart AI Plan Generated Successfully.", "success");
        } else {
            notify("Failed to generate plan. Please retry.", "error");
        }
    };

    const handleSave = () => {
        if (!plan) return;
        const activeId = isAdminView ? selectedMemberId : memberId;
        const targetMember = members.find((m: any) => m.id === Number(activeId));
        if (!targetMember) {
            notify("No active member selected.", "error");
            return;
        }

        // Structure a custom template that matches the WorkoutTemplate interface
        const newTemplate = {
            id: Date.now(),
            name: plan.planName,
            level: (fitnessLevel === 'Pro Advance' ? 'Pro Advance' : fitnessLevel) as any,
            category: goals,
            description: plan.scientificReasoning,
            mainWorkout: plan.days.map((day: any) => ({
                name: `Day ${day.dayNumber}: ${day.focusArea}`,
                exercises: day.exercises.map((ex: any) => ({
                    name: ex.name,
                    sets: String(ex.sets),
                    reps: String(ex.reps),
                    tempo: ex.tempo,
                    rest: String(ex.restSeconds) + 's',
                    rpe: String(ex.rpe),
                    notes: ex.formTip
                })),
                intensity: day.intensity === 'High' ? 'High' : day.intensity === 'Moderate' ? 'Medium' : 'Low'
            })),
            aiGenerated: true
        };

        addWorkoutTemplate(newTemplate);

        // Convert the plan into Record<string, WorkoutExercise[]> for TodaysWorkout list mapping
        const workoutStructure: Record<string, any[]> = {};
        plan.days.forEach((day: any) => {
            const sectionName = `Day ${day.dayNumber}: ${day.focusArea}`;
            workoutStructure[sectionName] = day.exercises.map((ex: any) => ({
                name: ex.name,
                sets: String(ex.sets),
                reps: String(ex.reps),
                tempo: ex.tempo,
                rest: String(ex.restSeconds) + 's',
                rpe: String(ex.rpe),
                notes: ex.formTip
            }));
        });

        // Update member with plan in approvedAiPlan field
        updateMember({
            ...targetMember,
            approvedAiPlan: JSON.stringify(workoutStructure)
        });

        addAuditLog({
            member_id: targetMember.id,
            action: 'AI_PLAN_GENERATE_SAVE',
            details: `Personalized plan '${plan.planName}' created. Goal: ${goals}, Level: ${fitnessLevel}, Equipment: ${equipment}`
        });

        notify(`Success! ${plan.planName} saved and activated under today's workout.`, "success");
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-700 relative z-10 w-full h-full overflow-y-auto">
            {/* HERO BANNER 100X OPALS N8N GITHUB WORKOUT PLANNER */}
            <div className="bg-black/60 backdrop-blur-3xl border border-cyan-500/30 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10 blur-sm mix-blend-screen scale-150 animate-pulse-slow">
                    <Target className="w-64 h-64 text-cyan-500" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-transparent to-purple-900/20 opacity-50 z-0"></div>
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ff_1px,transparent_1px),linear-gradient(to_bottom,#0ff_1px,transparent_1px)] bg-[size:30px_30px] opacity-[0.02] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_10%,transparent_100%)] z-0"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-full text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                WORKOUT ARCHITECT
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] mb-2">
                            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400">PLANNER</span>
                        </h2>
                        <p className="text-gray-400 text-sm md:text-base font-medium max-w-2xl">
                            Powered by AI. Total synchronization with member reports, behaviors, and wearables.
                        </p>
                    </div>
                    <div className="flex gap-4 shrink-0">
                        <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center shadow-xl">
                            <BrainCircuit className="w-8 h-8 text-cyan-400 mx-auto mt-2" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3">Live Sync</p>
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
                    <p className="text-[10px] text-blue-200/70 font-mono mt-1 relative z-10">Cross-referencing injury history, medical limitations, and joint health.</p>
                </div>
                <div className="p-4 bg-gradient-to-b from-rose-900/40 to-black/60 border border-rose-500/30 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-rose-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Activity className="w-6 h-6 text-rose-400 relative z-10 mb-2" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest relative z-10">Automated Workflows</h3>
                    <p className="text-[10px] text-rose-200/70 font-mono mt-1 relative z-10">Pushing daily schedules, friend-like encouragement warnings, and rep alerts.</p>
                </div>
                <div className="p-4 bg-gradient-to-b from-gray-800/60 to-black/60 border border-white/20 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Layers className="w-6 h-6 text-gray-300 relative z-10 mb-2" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest relative z-10">AI Agents</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-1 relative z-10">Deep behavioral learning and volume optimization algorithms.</p>
                </div>
            </div>

            <Card className="bg-black/60 backdrop-blur-xl border border-cyan-500/30 p-8 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.05)] rounded-[2rem]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors duration-700"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    {isAdminView && (
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Target Member</label>
                            <select 
                                value={selectedMemberId} 
                                onChange={(e) => setSelectedMemberId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-fuchsia-500 outline-none"
                            >
                                <option value="">-- Select Member --</option>
                                {members.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.phone})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Target className="w-3 h-3 text-cyan-400" /> Workout Goal
                        </label>
                        <select 
                            value={goals} onChange={(e) => setGoals(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-cyan-500 outline-none cursor-pointer"
                        >
                            <option value="Ultimate Hypertrophy & Strength">Ultimate Hypertrophy & Strength</option>
                            <option value="Cellular Shredding & Lean Mass">Cellular Shredding & Lean Mass</option>
                            <option value="Cardiovascular Mastery">Cardiovascular Mastery</option>
                            <option value="Rehab, Mobility & Bio-Optimization">Rehab, Mobility & Bio-Optimization</option>
                            <option value="Elite Athletic Performance">Elite Athletic Performance</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-emerald-400" /> Fitness Level
                        </label>
                        <select 
                            value={fitnessLevel} onChange={(e) => setFitnessLevel(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-emerald-500 outline-none cursor-pointer"
                        >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Pro Advance">Pro Advance</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Dumbbell className="w-3 h-3 text-indigo-400" /> Equipment & Preferences
                        </label>
                        <select 
                            value={equipment} onChange={(e) => setEquipment(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-indigo-500 outline-none cursor-pointer"
                        >
                            <option value="Full Gym Access">Full Gym Access</option>
                            <option value="Dumbbells Only">Dumbbells Only</option>
                            <option value="Bodyweight & Calisthenics">Bodyweight & Calisthenics</option>
                            <option value="Home Gym with Resistance Bands">Home Gym with Resistance Bands</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Activity className="w-3 h-3 text-rose-400" /> Training Intensity
                        </label>
                        <select 
                            value={intensity} onChange={(e) => setIntensity(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-rose-500 outline-none cursor-pointer"
                        >
                            <option value="Low (Recovery Sync/Beginner Node)">Low</option>
                            <option value="Moderate (Standard Steady Algorithmic)">Moderate</option>
                            <option value="High (Elite Push, High AI Volume)">High</option>
                            <option value="Maximum (Failure Protocol Definition)">Maximum</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <Layers className="w-3 h-3 text-purple-400" /> Focus Area Matrix
                        </label>
                        <input 
                            type="text" value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)}
                            placeholder="e.g. Upper chest dominance, Core strength..."
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-purple-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                            <ShieldAlert className="w-3 h-3 text-fuchsia-400" /> Medical Overrides
                        </label>
                        <input 
                            type="text" value={injuries} onChange={(e) => setInjuries(e.target.value)}
                            placeholder="e.g. Back restriction, Knee pain, None..."
                            className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-white font-mono text-xs focus:border-fuchsia-500 outline-none"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end relative z-10 w-full">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-gradient-to-r w-full from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white font-black px-8 py-5 rounded-[2rem] uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 overflow-hidden group border border-cyan-400/50"
                    >
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div className="flex items-center gap-3">
                                   <RefreshCw className="w-5 h-5 animate-spin" />
                                   <span className="text-white font-bold tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">SYNTHESIZING PROTOCOL</span>
                                </div>
                                <div className="text-[10px] text-cyan-200 uppercase tracking-[0.3em] font-mono font-black animate-pulse">
                                    {loadingStage === 0 && "> Connecting to Medical Engine..."}
                                    {loadingStage === 1 && "> Syncing Biometrics..."}
                                    {loadingStage === 2 && "> Engaging AI Algorithmic Matrix..."}
                                    {loadingStage >= 3 && "> Finalizing Hypertrophy Architecture..."}
                                </div>
                            </div>
                        ) : (
                            <>
                                <Sparkles className="w-6 h-6 group-hover:animate-pulse" /> GENERATE WORKOUT PLAN
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
                        <Card className="bg-black/90 backdrop-blur-3xl border border-fuchsia-500/50 p-8 md:p-12 shadow-[0_0_100px_rgba(217,70,239,0.2)] rounded-[3rem] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0 mix-blend-overlay"></div>
                            <div className="absolute -top-20 -right-20 opacity-20 transform scale-150 pointer-events-none animate-pulse-slow">
                                <Target className="w-96 h-96 text-fuchsia-500" />
                            </div>

                            <div className="text-center mb-12 relative z-10">
                                <span className="inline-block px-4 py-1.5 bg-fuchsia-900/40 border border-fuchsia-500/50 text-fuchsia-400 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-4 shadow-[0_0_20px_rgba(217,70,239,0.5)]">
                                    AI GENERATED PLAN
                                </span>
                                <h3 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 uppercase tracking-tighter italic mb-4 drop-shadow-2xl">{plan.planName}</h3>
                                <p className="text-cyan-400 font-mono tracking-[0.2em] uppercase font-bold text-sm mb-6">{plan.targetAudience}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <div className="bg-cyan-900/10 border border-cyan-500/30 p-6 rounded-[2rem] text-left">
                                        <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Medical Analysis</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed font-mono">{plan.scientificReasoning}</p>
                                    </div>
                                    <div className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-[2rem] text-left">
                                        <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><Activity className="w-4 h-4"/> Routine Integration</h4>
                                        <p className="text-sm text-gray-300 leading-relaxed font-mono">Synchronized directly with current diet protocols and behavior schedules. Intelligent adjustments generated on sleep matrix metrics.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-12 relative z-10 w-full mt-12 bg-black/40 rounded-[2rem] p-6 md:p-10 border border-white/10">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-widest text-center mb-8 border-b border-white/10 pb-4">
                                    <Target className="w-6 h-6 inline-block mr-3 text-fuchsia-400" />
                                    7-DAY ARCHITECTURE
                                    <Target className="w-6 h-6 inline-block ml-3 text-fuchsia-400" />
                                </h3>
                                {plan.days && plan.days.map((day: any, i: number) => (
                                    <div key={i} className="bg-gradient-to-r from-gray-900 to-black border border-white/10 rounded-[2rem] p-6 md:p-8 hover:border-cyan-500/50 transition-all duration-500 group relative">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                            <BrainCircuit className="w-32 h-32" />
                                        </div>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-white/5 relative z-10">
                                            <h4 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-purple-600 font-mono text-5xl">D{day.dayNumber}</span> 
                                                <span className="max-w-[200px] md:max-w-none">{day.focusArea}</span>
                                            </h4>
                                            <span className="bg-cyan-900/40 text-cyan-400 px-4 py-2 mt-4 md:mt-0 rounded-full border border-cyan-500/50 text-[10px] font-mono font-black uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                                Intensity: {day.intensity}
                                            </span>
                                        </div>
                                        
                                        <div className="overflow-x-auto rounded-xl border border-white/10">
                                            <table className="w-full text-left border-collapse min-w-[700px] bg-black/50">
                                                <thead>
                                                    <tr className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] border-b border-white/10 bg-white/5">
                                                        <th className="py-4 pl-6">Exercise Block</th>
                                                        <th className="py-4 text-center">Protocol Structure</th>
                                                        <th className="py-4 text-center">Timing / RPE</th>
                                                        <th className="py-4 pr-6 text-right w-[250px]">Execution Tip</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {day.exercises && day.exercises.map((ex: any, j: number) => (
                                                        <tr key={j} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                            <td className="py-5 pl-6">
                                                                <p className="font-black text-[13px] text-white tracking-wide uppercase">{ex.name}</p>
                                                            </td>
                                                            <td className="py-5 text-center">
                                                                <span className="px-3 py-1.5 bg-fuchsia-500/10 text-fuchsia-400 rounded-md text-xs font-black font-mono border border-fuchsia-500/30">
                                                                    {ex.sets} SETS × {ex.reps} REPS
                                                                </span>
                                                            </td>
                                                            <td className="py-5 text-center">
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-900/30 px-2 py-1 rounded border border-cyan-500/20">{ex.tempo} TEMPO</span>
                                                                    <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-900/30 px-2 py-1 rounded border border-amber-500/20">REST: {ex.restSeconds}s | RPE: {ex.rpe}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 pr-6 text-right">
                                                                <p className="text-[11px] text-purple-300/80 italic font-medium leading-tight ml-auto border-l-2 border-purple-500/50 pl-3">
                                                                    "{ex.formTip}"
                                                                </p>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-12 pt-10 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                <div className="bg-black/50 border border-white/10 p-6 rounded-[2rem] hover:border-cyan-500/30 transition-colors">
                                    <h5 className="text-[11px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Target className="w-4 h-4"/> Dietary Core Synergy</h5>
                                    <p className="text-[13px] text-gray-300 font-mono leading-relaxed">{plan.nutritionSynergy}</p>
                                </div>
                                <div className="bg-black/50 border border-white/10 p-6 rounded-[2rem] hover:border-purple-500/30 transition-colors">
                                    <h5 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2"><Activity className="w-4 h-4"/> Metrics Tracking</h5>
                                    <ul className="space-y-3">
                                        {plan.metricsToTrack?.map((m: string, i: number) => (
                                            <li key={i} className="text-xs text-gray-300 font-mono font-medium flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.8)]"></div>
                                                {m}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            
                            <div className="mt-12 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                 <div className="bg-rose-900/20 border border-rose-500/30 p-6 rounded-[2rem]">
                                        <h5 className="text-[11px] font-black text-rose-400 uppercase tracking-[0.3em] mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Live Smart Alerts</h5>
                                        <p className="text-[12px] text-gray-300 font-mono">The AI will actively monitor heart rate and send friendly tips. <strong>"Let's swap this compound lift for machines today to recover."</strong></p>
                                 </div>
                                 <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-[2rem] flex flex-col justify-center items-center text-center">
                                      <p className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">Final Approval</p>
                                      <button 
                                          onClick={handleSave}
                                          className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-8 py-3 rounded-full font-black uppercase tracking-[0.3em] text-[10px] flex items-center gap-3 transition-all cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] active:scale-95"
                                      >
                                          <CheckCircle className="w-4 h-4" /> DISPATCH TO MEMBER DB
                                      </button>
                                 </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
