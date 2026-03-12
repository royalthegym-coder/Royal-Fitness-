import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    BookOpen, Eye, Utensils, ShieldAlert, Cpu, 
    CheckCircle2, ChevronRight, AlertTriangle, Users, 
    Activity, Lock
} from 'lucide-react';

export const StaffAITrainingManual: React.FC = () => {
    const [activeChapter, setActiveChapter] = useState<number>(0);
    const [completedChapters, setCompletedChapters] = useState<number[]>([]);

    const markCompleted = (index: number) => {
        if (!completedChapters.includes(index)) {
            setCompletedChapters([...completedChapters, index]);
        }
    };

    const chapters = [
        {
            title: "1. Introduction to 'The Singularity'",
            icon: <Cpu className="w-5 h-5 text-indigo-400" />,
            content: (
                <div className="space-y-4 text-sm text-zinc-300">
                    <p>Welcome to <strong>Royal The Gym: The Singularity</strong>. You are no longer just a gym trainer or staff member; you are an <em>AI-Assisted Human Optimizer</em>.</p>
                    <p>This facility is governed by <strong>The Royal Nexus</strong>, an advanced AI that handles 90% of administrative, dietary, and analytical tasks. Your primary job is to provide the <strong>human touch, motivation, and physical spotting</strong> that AI cannot provide.</p>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl mt-4">
                        <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Golden Rule</h4>
                        <p className="text-xs text-indigo-200/70">Never argue with the Bio-Oracle's data, but always use your human empathy to deliver its message to the member.</p>
                    </div>
                </div>
            )
        },
        {
            title: "2. Titan Vision: How to Work with AI Cameras",
            icon: <Eye className="w-5 h-5 text-cyan-400" />,
            content: (
                <div className="space-y-4 text-sm text-zinc-300">
                    <p>The gym is equipped with 3D Depth Cameras running <strong>Titan Vision AI</strong>. It tracks every rep, form, and velocity of the members.</p>
                    <ul className="list-disc pl-5 space-y-2 text-xs">
                        <li><strong>Red Laser Alert:</strong> If a member's form is dangerously wrong, Titan Vision will flash a red light on their station. You must immediately intervene.</li>
                        <li><strong>Do Not Block:</strong> Avoid standing directly between the main ceiling cameras and the member during heavy compound lifts (Squats, Deadlifts).</li>
                        <li><strong>Override:</strong> If the AI miscounts a rep due to an unusual variation, you can manually correct it in your Staff Tablet.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "3. AI Kitchen Chief & Nutrition",
            icon: <Utensils className="w-5 h-5 text-emerald-400" />,
            content: (
                <div className="space-y-4 text-sm text-zinc-300">
                    <p>The <strong>AI Kitchen Chief</strong> generates Nutrigenomic diets based on DNA and blood reports.</p>
                    <ul className="list-disc pl-5 space-y-2 text-xs">
                        <li>Do not prescribe manual diets. Always refer the member to their <em>Digital Bio-Health Pass</em> on the app.</li>
                        <li>If a member complains about a food allergy not caught by the AI, immediately log it in the <strong>Inquisitor Bot</strong> section on your tablet to update their genetic profile.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "4. Emergency Protocols & Protocol Zero",
            icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
            content: (
                <div className="space-y-4 text-sm text-zinc-300">
                    <p>Safety is our highest priority. The AI is smart, but human judgment is final.</p>
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mt-2">
                        <h4 className="font-bold text-red-400 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> The Inquisitor Bot</h4>
                        <p className="text-xs text-red-200/70 mb-2">If the AI suggests a workout that you, as a certified trainer, believe is dangerous for a specific member, press the <strong>"Inquisitor Flag"</strong> on your tablet. This halts the AI's instruction and alerts Mahesh Ji.</p>
                    </div>
                    <p className="text-xs mt-2"><strong>Protocol Zero:</strong> Only Mahesh Ji has the voice-print authority to completely shut down the AI. In case of a total system failure, revert to manual whiteboards and standard first-aid protocols.</p>
                </div>
            )
        },
        {
            title: "5. Member Interaction & Privacy",
            icon: <Users className="w-5 h-5 text-amber-400" />,
            content: (
                <div className="space-y-4 text-sm text-zinc-300">
                    <p>Members might feel overwhelmed by the technology. Your job is to make them feel safe.</p>
                    <ul className="list-disc pl-5 space-y-2 text-xs">
                        <li>Explain that their data (HRV, Sleep, Diet) is protected by <strong>Quantum-Resistant Encryption</strong>.</li>
                        <li>Remind them that the AI Doctor is a guide, but for serious medical emergencies, they must consult a physical hospital.</li>
                        <li>Always greet members by name—the AI will ping their name and current mood to your smartwatch as they enter.</li>
                    </ul>
                </div>
            )
        }
    ];

    const progressPercentage = (completedChapters.length / chapters.length) * 100;

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-900 to-black p-8 rounded-[2rem] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-5 h-5 text-blue-400" />
                            <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">Staff Education Portal</span>
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">AI Training Manual</h1>
                        <p className="text-zinc-400 mt-2 text-sm max-w-2xl">
                            Mandatory reading for all Royal The Gym trainers, nutritionists, and management staff. Learn how to operate alongside The Royal Nexus.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Your Progress</p>
                            <p className="text-2xl font-black text-white">{Math.round(progressPercentage)}%</p>
                        </div>
                        <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Table of Contents (Sidebar) */}
                <div className="space-y-2">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 px-2">Chapters</h3>
                    {chapters.map((chapter, idx) => {
                        const isCompleted = completedChapters.includes(idx);
                        const isActive = activeChapter === idx;
                        
                        return (
                            <button
                                key={idx}
                                onClick={() => setActiveChapter(idx)}
                                className={`w-full text-left p-4 rounded-xl flex items-center justify-between transition-all ${
                                    isActive 
                                    ? 'bg-blue-500/10 border border-blue-500/30 text-white' 
                                    : 'bg-zinc-900/30 border border-transparent text-zinc-400 hover:bg-zinc-900/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500/20' : 'bg-black'}`}>
                                        {chapter.icon}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wide truncate max-w-[150px]">
                                        {chapter.title.split('.')[1]}
                                    </span>
                                </div>
                                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </button>
                        );
                    })}
                    
                    <div className="mt-8 p-4 bg-zinc-900/50 border border-white/5 rounded-xl flex items-start gap-3">
                        <Lock className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                            This document is strictly confidential. Unauthorized sharing of Royal The Gym's AI protocols will result in immediate termination.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:col-span-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeChapter}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="bg-black border border-white/10 rounded-[2rem] p-8 min-h-[400px] flex flex-col"
                        >
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                                <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5">
                                    {chapters[activeChapter].icon}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white">{chapters[activeChapter].title}</h2>
                                    <p className="text-xs text-zinc-500 font-mono mt-1">Classified Training Material</p>
                                </div>
                            </div>

                            <div className="flex-1">
                                {chapters[activeChapter].content}
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                                {!completedChapters.includes(activeChapter) ? (
                                    <button 
                                        onClick={() => markCompleted(activeChapter)}
                                        className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Mark as Read
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-widest">
                                        <CheckCircle2 className="w-4 h-4" /> Completed
                                    </div>
                                )}

                                {activeChapter < chapters.length - 1 && (
                                    <button 
                                        onClick={() => {
                                            markCompleted(activeChapter);
                                            setActiveChapter(activeChapter + 1);
                                        }}
                                        className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        Next Chapter <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
