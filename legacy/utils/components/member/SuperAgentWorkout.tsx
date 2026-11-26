import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Cpu, Database, Activity, RefreshCw, Layers, Dumbbell, Zap, Sparkles, CheckCircle2, ChevronRight, ActivitySquare, Save, Settings, PlayCircle } from 'lucide-react';
import { useSmartStore } from '../../store/useSmartStore';

interface SuperAgentWorkoutProps {
    memberId: number;
}

type WorkoutPhase = 'warmup' | 'primary' | 'core' | 'finishers';

export const SuperAgentWorkout: React.FC<SuperAgentWorkoutProps> = ({ memberId }) => {
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [agentLogs, setAgentLogs] = useState<string[]>([]);
    const [activePhase, setActivePhase] = useState<WorkoutPhase>('warmup');
    const [planGenerated, setPlanGenerated] = useState(false);
    
    // Loaded memory context
    const [memoryContext, setMemoryContext] = useState<string>("Analyzing previous week muscle stress patterns...");

    const simulateSwarm = () => {
        setIsGenerating(true);
        setPlanGenerated(false);
        setAgentLogs([]);
        
        const sequence = [
            "Initializing Neural Swarm Agents...",
            "Loading Member Biomechanics & Categories...",
            "Accessing Previous Workout Data Memory...",
            "Agent 1: Structuring Systematic Warm-up...",
            "Agent 2: Mapping Primary Category Schedule...",
            "Agent 3: Injecting Core & Abs Sequences...",
            "Agent 4: Aligning Wrist & Calf Finishers...",
            "Compiling Final Hyper-Optimized Engine..."
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < sequence.length) {
                setAgentLogs(prev => [...prev, sequence[i]]);
                i++;
            } else {
                clearInterval(interval);
                setIsGenerating(false);
                setPlanGenerated(true);
                setMemoryContext("Memory updated. Follow-up protocol primed for tomorrow.");
            }
        }, 600);
    };

    const warmupData = [
        { name: "Dynamic Arm Circles", time: "2 Mins", desc: "Forward and backward rotation bridging the shoulder joint socket." },
        { name: "Cat-Cow Stretch", time: "60 Secs", desc: "Spinal cord flex and extension for nerve preparation." },
        { name: "Jumping Jacks / Burpees", time: "2 Mins", desc: "Systematic cardiovascular spike to elevate core body heat." }
    ];

    const primaryData = [
        { name: "Barbell Bench Press", reps: "4 x 10-12", desc: "Compound chest overload targeting pectoralis major." },
        { name: "Incline Dumbbell Flyes", reps: "3 x 15", desc: "Upper chest stretch and contraction focus." },
        { name: "Cable Crossovers", reps: "3 x 15-20", desc: "Continuous tension targeting inner chest striations." },
        { name: "Overhead Tricep Extension", reps: "3 x 12", desc: "Long head tricep development." }
    ];

    const coreData = [
        { name: "Hanging Leg Raises", reps: "3 x 15", desc: "Lower abdominal compression." },
        { name: "Decline Weighted Crunches", reps: "3 x 20", desc: "Upper abdominal muscle hypertrophy." },
        { name: "Russian Twists", reps: "3 x 40 Secs", desc: "Oblique stabilization and rotary strength." }
    ];

    const finisherData = [
        { name: "Reverse Barbell Wrist Curls", reps: "3 x 20", desc: "Forearm extensor mass building." },
        { name: "Behind-the-Back Wrist Curls", reps: "3 x 20", desc: "Forearm flexor isolation." },
        { name: "Standing Calf Raises", reps: "4 x 25", desc: "Gastrocnemius volume pump." },
        { name: "Seated Calf Extensions", reps: "3 x 20", desc: "Soleus isolation to failure." }
    ];

    const renderData = () => {
        let title = '';
        let data: any[] = [];
        
        switch (activePhase) {
            case 'warmup': title = "Scientific Warm-up Matrix"; data = warmupData; break;
            case 'primary': title = "Category-Specific Primary Schedule"; data = primaryData; break;
            case 'core': title = "Daily Isometric Abs / Core Routine"; data = coreData; break;
            case 'finishers': title = "Wrist & Calves Absolute Finisher"; data = finisherData; break;
        }

        return (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={activePhase}
                className="mt-6"
            >
                <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-2">
                    <Zap className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-sm font-black uppercase text-white tracking-widest">{title}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.map((item, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{item.name}</h4>
                                <span className="bg-black/50 text-[10px] font-mono text-cyan-400 px-2 py-1 rounded-md">{item.time || item.reps}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-mono leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2 flex items-center gap-3">
                            <Brain className="w-8 h-8 text-cyan-500" />
                            Agentic Super Workout
                        </h1>
                        <p className="text-xs text-gray-400 max-w-xl">
                            The world's most advanced ensemble of AI Agents, Models, and Bots working in harmony to construct, schedule, and track a hyper-personalized daily scientific protocol.
                        </p>
                    </div>
                    <button 
                        onClick={simulateSwarm}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2"
                    >
                        {isGenerating ? <Activity className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                        {isGenerating ? "Executing Swarm..." : "Invoke Agent Swarm"}
                    </button>
                </div>
            </div>

            {/* AI Reasoning Logs */}
            <AnimatePresence>
                {isGenerating && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black/60 border border-cyan-500/20 rounded-2xl overflow-hidden"
                    >
                        <div className="p-4 bg-cyan-500/5 border-b border-cyan-500/10 flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> Cognitive Process Log
                            </h3>
                        </div>
                        <div className="p-4 font-mono text-[10px] space-y-2 max-h-48 overflow-y-auto">
                            {agentLogs.map((log, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={idx}
                                    className="flex items-center gap-2 text-cyan-300"
                                >
                                    <ChevronRight className="w-3 h-3 text-cyan-600" /> {log}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Generated Content */}
            {planGenerated && !isGenerating && (
                <div className="space-y-6">
                    {/* Memory Context & Follow-up Tracker */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/40 border border-fuchsia-500/20 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-cyan-500/5" />
                        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                            <div className="p-4 bg-fuchsia-500/10 rounded-full">
                                <Database className="w-8 h-8 text-fuchsia-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-black uppercase text-white tracking-widest mb-1 flex items-center gap-2">
                                    <ActivitySquare className="w-4 h-4 text-fuchsia-400" /> Active Memory & Follow-up
                                </h3>
                                <p className="text-[11px] text-gray-400">
                                    <span className="text-fuchsia-400 font-bold">Today's Directive:</span> All generated sets mapped to history. 
                                    Progress will be stored back to central agent memory post-workout for systemic evolution.
                                </p>
                            </div>
                            <button className="px-5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition-all flex items-center gap-2">
                                <Save className="w-3 h-3" /> Commit Session
                            </button>
                        </div>
                    </motion.div>

                    {/* Nav Tabs for the 4 Phases */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                            { id: 'warmup', icon: RefreshCw, label: 'Scientific Warm-up' },
                            { id: 'primary', icon: Dumbbell, label: 'Category Primary' },
                            { id: 'core', icon: Activity, label: 'Daily Abs Tracker' },
                            { id: 'finishers', icon: Layers, label: 'Wrist & Calf Finishers' }
                        ].map((tab) => {
                            const IconC = tab.icon;
                            const isActive = activePhase === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActivePhase(tab.id as WorkoutPhase)}
                                    className={`py-4 px-2 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                                        isActive 
                                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
                                            : 'bg-black/40 border-white/5 text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                                >
                                    <IconC className="w-5 h-5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-center">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {renderData()}
                </div>
            )}
        </div>
    );
};

export default SuperAgentWorkout;
