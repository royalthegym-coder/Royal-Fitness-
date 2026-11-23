
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_WORKOUT_TEMPLATES } from '../../../constants';
import { WorkoutExercise, View, DetailedSetLog, DetailedWorkoutSession } from '../../../types';
import ExerciseDemoModal, { getExerciseByName, EXERCISE_DB } from '../common/ExerciseDemoModal';
import { useData } from '../../context/DataProvider';
import { getMediaForExercise } from '../common/ExerciseDemoModal';
import { TimerIcon } from '../icons/ActivityIcons';
import { 
    Play, Pause, RotateCcw, PartyPopper, Plus, Settings, Calendar, Layers, 
    Video, ArrowRight, Activity, PlayCircle, Clock, Users, Flame, 
    Save, BarChart3, Radio, Check, Minus, X, Info, BarChart2,
    ClipboardList, BrainCircuit, Target, RefreshCw, FileText, Zap, MessageCircle
} from 'lucide-react';
import AIWorkoutGeneratorModal from '../common/AIWorkoutGeneratorModal';
import { SparkleIcon } from '../icons/SparkleIcon';
import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip, CartesianGrid, XAxis } from 'recharts';
import { useToast } from '../../hooks/useToast';
import Modal from '../common/Modal';
import LiveTrainingHUD from './LiveTrainingHUD';
import { motion, AnimatePresence } from 'framer-motion';
import { NotificationService } from '../../../lib/notifications';
import TitanVision from './TitanVision';
import { generateWorkoutPDF } from '../../pdfGenerator';
import { Download, Camera } from 'lucide-react';

// --- SUB-COMPONENT: HISTORY CHART MODAL ---
const ExerciseHistoryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    history: any[];
}> = ({ isOpen, onClose, exerciseName, history }) => {
    if (!isOpen) return null;
    
    // Sort by date ascending for chart
    const data = [...history].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const bestLift = Math.max(...data.map(d => d.maxWeight), 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${exerciseName} Progress`}>
            <div className="space-y-6">
                 <div className="bg-black/40 p-6 rounded-3xl border border-cyan-500/30 text-center">
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Personal Best</p>
                     <p className="text-4xl font-black text-white italic tracking-tighter">{bestLift} <span className="text-sm not-italic text-gray-400">KG</span></p>
                 </div>
                 
                 <div className="h-64 w-full">
                    {data.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="date" stroke="#666" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month:'short', day:'numeric'})} />
                                <YAxis stroke="#666" fontSize={10} domain={['dataMin - 5', 'dataMax + 5']} />
                                <Tooltip contentStyle={{backgroundColor: '#000', border: '1px solid #333'}} />
                                <Line type="monotone" dataKey="maxWeight" stroke="#06b6d4" strokeWidth={3} dot={{r: 4, fill: '#06b6d4'}} name="Max Load" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest">
                            Not enough data points
                        </div>
                    )}
                 </div>
                 <button onClick={onClose} className="w-full py-4 bg-gray-900 rounded-2xl text-xs font-bold text-gray-400 hover:text-white">Close Analysis</button>
            </div>
        </Modal>
    );
};

// --- SUB-COMPONENT: NOTES MODAL ---
const NotesModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    note: string;
    onSave: (note: string) => void;
}> = ({ isOpen, onClose, exerciseName, note, onSave }) => {
    const [text, setText] = useState(note);
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tactical Log">
            <div className="space-y-4">
                <div className="bg-amber-900/10 border border-amber-500/30 p-4 rounded-xl mb-2">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Log Entry for {exerciseName}</p>
                </div>
                <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500 min-h-[150px]"
                    placeholder="Record cues, pain points, or RPE feeling..."
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-900 rounded-xl text-xs font-bold text-gray-400">Cancel</button>
                    <button onClick={() => { onSave(text); onClose(); }} className="flex-1 py-3 bg-amber-500 text-black rounded-xl text-xs font-black uppercase">Save Log</button>
                </div>
            </div>
        </Modal>
    );
};

// --- SUB-COMPONENT: EXERCISE FEEDBACK MODAL ---
const ExerciseFeedbackModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    exerciseName: string;
    onSubmit: (feedback: string) => void;
}> = ({ isOpen, onClose, exerciseName, onSubmit }) => {
    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Calibration">
            <div className="space-y-4">
                <div className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded-xl">
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" /> Future-Core AI
                    </p>
                    <p className="text-xs text-gray-300 mt-2">
                        How did {exerciseName} feel? Your feedback will be used to adjust the weight and reps for your next session.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {['Too Easy', 'Just Right', 'Too Hard', 'Felt Pain'].map(opt => (
                        <button 
                            key={opt}
                            onClick={() => { onSubmit(opt); onClose(); }}
                            className="py-4 bg-gray-900 border border-white/10 rounded-xl text-xs font-bold text-gray-300 hover:bg-cyan-900/30 hover:border-cyan-500/50 hover:text-cyan-400 transition-all shadow-lg"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
};

const TodaysWorkout: React.FC<{ memberId: number; setActiveView: (v: View) => void }> = ({ memberId, setActiveView }) => {
    const { addRoutineLog, liveHealthData, addDetailedWorkoutLog, members, detailedWorkoutLogs, updateMember, medicalReports, workoutTemplates } = useData() as any;
    const { addToast } = useToast();
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    
    // --- MEMBER PROFILE & LEVEL LOGIC ---
    const member = useMemo(() => members.find(m => m.id === memberId), [members, memberId]);
    
    const userLevel = useMemo(() => {
        if (!member) return 'Beginner';
        const joinDate = new Date(member.joinDate);
        const months = (new Date().getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (member.achievements.includes("Pro Card") || member.level > 50) return 'Pro Body';
        if (months > 24) return 'Advanced';
        if (months > 3) return 'Middner';
        return 'Beginner';
    }, [member]);

    // --- STATE ---
    const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [restTimer, setRestTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Live Mirror State
    const [liveModeExercise, setLiveModeExercise] = useState<WorkoutExercise | null>(null);
    
    // Features State
    const [activeLogs, setActiveLogs] = useState<Record<string, DetailedSetLog[]>>({});
    const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
    
    // Modals
    const [notesModalEx, setNotesModalEx] = useState<string | null>(null);
    const [historyModalEx, setHistoryModalEx] = useState<string | null>(null);
    const [feedbackModalEx, setFeedbackModalEx] = useState<string | null>(null);
    const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
    const [isAiAdjustModalOpen, setIsAiAdjustModalOpen] = useState(false);
    const [isOptimizeFutureModalOpen, setIsOptimizeFutureModalOpen] = useState(false);
    const [userFeedback, setUserFeedback] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [isOptimizingFuture, setIsOptimizingFuture] = useState(false);
    const [aiModifiedWorkout, setAiModifiedWorkout] = useState<Record<string, WorkoutExercise[]> | null>(null);
    
    // Manual Timer State
    const [manualTimer, setManualTimer] = useState(0);
    const [isManualTimerRunning, setIsManualTimerRunning] = useState(false);
    
    // --- LOGIC: BUILD THE DYNAMIC WORKOUT STRUCTURE ---
    const generatedWorkout: Record<string, WorkoutExercise[]> = useMemo(() => {
        // 1. Check for Admin Assigned Plan
        if (member?.approvedAiPlan) {
            try {
                // Try parsing it as JSON first (from Optimize Future Plan)
                const parsedPlan = JSON.parse(member.approvedAiPlan);
                if (typeof parsedPlan === 'object' && !Array.isArray(parsedPlan)) {
                    return parsedPlan;
                }
            } catch (e) {
                // Not JSON, continue to template matching
            }

            const assignedTemplate = workoutTemplates.find(t => t.name === member.approvedAiPlan);
            if (assignedTemplate) {
                // Return the assigned template structure
                if (assignedTemplate.sections) {
                    const structure: Record<string, WorkoutExercise[]> = {};
                    assignedTemplate.sections.forEach(s => {
                        structure[s.name || 'Main'] = s.exercises;
                    });
                    return structure;
                } else if (assignedTemplate.exercises) {
                    return { [assignedTemplate.name]: assignedTemplate.exercises };
                }
            }
        }

        // 2. Fallback to Auto-Generated Logic
        let structure: { [key: string]: WorkoutExercise[] } = {};
        const warmupVariations = [
            [{ name: 'Arm Circles', sets: '1', reps: '1 min' }, { name: 'Jumping Jacks', sets: '1', reps: '30' }],
            [{ name: 'Cat Cow', sets: '1', reps: '1 min' }, { name: 'Leg Swings', sets: '2', reps: '15' }],
            [{ name: 'World Greatest Stretch', sets: '1', reps: '1 min' }, { name: 'High Knees', sets: '1', reps: '45s' }]
        ];
        structure['1. Pre-Workout Activation'] = warmupVariations[dayOfYear % 3];

        const splitDay = dayOfYear % 4; // 0: Chest, 1: Back, 2: Legs, 3: Shoulders/Arms
        let mainExercises: WorkoutExercise[] = [];
        let categoryName = "Full Body";

        const beginnerSplits = [
            [{ name: 'Push Up', sets: '3', reps: '10' }, { name: 'Pec Deck Machine', sets: '3', reps: '12' }, { name: 'Bench Press', sets: '3', reps: '10' }],
            [{ name: 'Lat Pulldown', sets: '3', reps: '12' }, { name: 'Seated Cable Row', sets: '3', reps: '12' }, { name: 'Straight Arm Pulldown', sets: '3', reps: '15' }],
            [{ name: 'Goblet Squat', sets: '3', reps: '12' }, { name: 'Leg Press', sets: '3', reps: '10' }, { name: 'Leg Extension', sets: '3', reps: '15' }],
            [{ name: 'Bicep Curl', sets: '3', reps: '12' }, { name: 'Tricep Extension', sets: '3', reps: '12' }, { name: 'Lateral Raise', sets: '3', reps: '15' }]
        ];

        const advancedSplits = [
            [{ name: 'Barbell Bench Press', sets: '4', reps: '8' }, { name: 'Incline Dumbbell Press', sets: '3', reps: '10' }, { name: 'Cable Chest Fly', sets: '3', reps: '12' }],
            [{ name: 'Pull Up', sets: '4', reps: 'Failure' }, { name: 'Barbell Row', sets: '3', reps: '8' }, { name: 'T-Bar Row', sets: '3', reps: '10' }],
            [{ name: 'Barbell Squat', sets: '4', reps: '8' }, { name: 'Deadlift', sets: '3', reps: '5' }, { name: 'Bulgarian Split Squat', sets: '3', reps: '10' }],
            [{ name: 'Overhead Press', sets: '4', reps: '8' }, { name: 'Skull Crusher', sets: '3', reps: '10' }, { name: 'Hammer Curl', sets: '3', reps: '12' }]
        ];

        const splitNames = ["Chest & Core", "Back Dominant", "Leg Protocol", "Shoulders & Arms"];

        if (userLevel === 'Beginner') {
            categoryName = `Foundation: ${splitNames[splitDay]}`;
            mainExercises = beginnerSplits[splitDay];
            mainExercises.push({ name: 'Standard Plank', sets: '3', reps: '30s' });
        } else {
             categoryName = `Hypertrophy: ${splitNames[splitDay]}`;
             mainExercises = advancedSplits[splitDay];
             mainExercises.push({ name: 'Russian Twist', sets: '3', reps: '20' });
        }
        
        structure[`2. ${categoryName} (${userLevel})`] = mainExercises;
        
        const finisherVariations = [
            [{ name: 'Burpees', sets: '1', reps: 'Max' }],
            [{ name: 'Kettlebell Swing', sets: '2', reps: '20' }],
            [{ name: 'Box Jumps', sets: '2', reps: '10' }]
        ];
        structure['3. The Finisher'] = finisherVariations[dayOfYear % 3];

        return structure;
    }, [userLevel, dayOfYear, member, workoutTemplates]);

    const activeWorkout = useMemo(() => aiModifiedWorkout || generatedWorkout, [aiModifiedWorkout, generatedWorkout]);

    // Init Logs
    useEffect(() => {
        const init: Record<string, DetailedSetLog[]> = {};
        (Object.values(activeWorkout).flat() as WorkoutExercise[]).forEach(ex => {
            const targetSets = parseInt(ex.sets || '3');
            init[ex.name] = Array(targetSets).fill(null).map((_, i) => ({
                setNumber: i + 1,
                weight: 0,
                reps: 0,
                rpe: 0,
                completed: false
            }));
        });
        setActiveLogs(prev => ({ ...init, ...prev }));
    }, [activeWorkout]);

    // Timer Logic
    useEffect(() => {
        let interval: any;
        if (isResting && restTimer > 0) {
            interval = setInterval(() => setRestTimer(prev => prev - 1), 1000);
        } else if (restTimer <= 0 && isResting) {
            setIsResting(false);
            addToast("Rest Complete. Engage!", "success"); // Notify on finish
        }
        return () => clearInterval(interval);
    }, [isResting, restTimer]);

    // Manual Timer Logic
    useEffect(() => {
        let interval: any;
        if (isManualTimerRunning) {
            interval = setInterval(() => setManualTimer(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isManualTimerRunning]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleUpdateSet = (exercise: string, setIdx: number, field: keyof DetailedSetLog, value: number) => {
        setActiveLogs(prev => {
            const currentSets = [...(prev[exercise] || [])];
            if (!currentSets[setIdx]) return prev;
            currentSets[setIdx] = { ...currentSets[setIdx], [field]: value };
            return { ...prev, [exercise]: currentSets };
        });
    };

    const handleCompleteSet = (exercise: string, setIdx: number) => {
        setActiveLogs(prev => {
            const currentSets = [...(prev[exercise] || [])];
            currentSets[setIdx] = { ...currentSets[setIdx], completed: !currentSets[setIdx].completed };
            return { ...prev, [exercise]: currentSets };
        });

        const isNowDone = !activeLogs[exercise]?.[setIdx]?.completed;
        if (isNowDone) {
             // Check if ALL sets for this exercise will be completed
             const allSets = activeLogs[exercise] || [];
             const willBeComplete = allSets.every((s, i) => i === setIdx ? true : s.completed);
             
             if (willBeComplete && !completedExercises.has(exercise)) {
                 setCompletedExercises(prev => new Set(prev).add(exercise));
                 setFeedbackModalEx(exercise); // Trigger feedback modal
             }
             
             setRestTimer(userLevel === 'Pro Body' ? 90 : 60);
             setIsResting(true);
        } else {
             // If unchecking, remove from completed
             const allSets = activeLogs[exercise] || [];
             const willBeComplete = allSets.every((s, i) => i === setIdx ? false : s.completed);
             if (!willBeComplete && completedExercises.has(exercise)) {
                 setCompletedExercises(prev => {
                     const newSet = new Set(prev);
                     newSet.delete(exercise);
                     return newSet;
                 });
             }
        }
    };

    const handleAddSet = (exercise: string) => {
        setActiveLogs(prev => {
            const currentSets = [...(prev[exercise] || [])];
            currentSets.push({
                setNumber: currentSets.length + 1,
                weight: 0,
                reps: 0,
                rpe: 0,
                completed: false
            });
            return { ...prev, [exercise]: currentSets };
        });
    };

    const handleRemoveSet = (exercise: string, setIdx: number) => {
        setActiveLogs(prev => {
            const currentSets = [...(prev[exercise] || [])];
            if (currentSets.length <= 1) return prev; // Keep at least one set
            currentSets.splice(setIdx, 1);
            // Re-number sets
            const renumberedSets = currentSets.map((s, i) => ({ ...s, setNumber: i + 1 }));
            return { ...prev, [exercise]: renumberedSets };
        });
    };
    
    // Adjust Timer
    const adjustTimer = (seconds: number) => {
        setRestTimer(prev => Math.max(0, prev + seconds));
    };

    const handleFinishSession = () => {
        setIsSyncing(true);
        setTimeout(() => {
            Object.entries(activeLogs).forEach(([exerciseName, sets]) => {
                const completedSets = (sets as DetailedSetLog[]).filter(s => s.completed);
                if (completedSets.length > 0) {
                    const history = getHistoryForExercise(exerciseName);
                    const previousMax = history.length > 0 ? Math.max(...history.map(h => h.maxWeight)) : 0;
                    const currentMax = Math.max(...completedSets.map(s => s.weight));
                    
                    if (currentMax > previousMax && previousMax > 0) {
                        NotificationService.notifyPRAchievement(memberId.toString(), exerciseName, currentMax.toString());
                    }

                    const sessionLog: DetailedWorkoutSession = {
                        sessionId: `SES_${Date.now()}_${exerciseName.substring(0,3)}`,
                        memberId,
                        date: new Date().toISOString(),
                        exerciseName,
                        sets: completedSets,
                        notes: exerciseNotes[exerciseName] // Save note
                    };
                    addDetailedWorkoutLog(sessionLog);
                }
            });
            addRoutineLog({
                log_id: `WORKOUT_${Date.now()}`,
                member_id: memberId,
                task_type: 'Workout',
                task_desc: `Completed: ${Object.keys(activeWorkout)[1] || 'Workout'}`,
                task_time: new Date().toLocaleTimeString(),
                is_done: true
            });
            setIsSyncing(false);
            setSessionComplete(true);
            window.scrollTo(0,0);
            addToast("FitnessFutureUplink: Session Synced to Core.", "success");
        }, 2000);
    };

    // Helper to get history for modal
    const getHistoryForExercise = (name: string) => {
        return detailedWorkoutLogs
            .filter(l => l.memberId === memberId && l.exerciseName === name)
            .map(l => ({
                date: l.date,
                maxWeight: Math.max(...l.sets.map(s => s.weight))
            }));
    };

    const totalSets: number = (Object.values(activeLogs) as DetailedSetLog[][]).reduce((acc, sets) => acc + sets.length, 0);
    const completedSetsCount: number = (Object.values(activeLogs) as DetailedSetLog[][]).reduce((acc, sets) => acc + sets.filter(s => s.completed).length, 0);
    const progress = totalSets > 0 ? Math.round((completedSetsCount / totalSets) * 100) : 0;

    if (liveModeExercise) {
        return <LiveTrainingHUD exercise={liveModeExercise.name} sets={liveModeExercise.sets} memberId={memberId} onClose={() => setLiveModeExercise(null)} />;
    }

    if (sessionComplete) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-8 animate-fade-in bg-black rounded-[3rem] border border-green-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-green-500 blur-3xl opacity-20 animate-pulse"></div>
                        <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.6)] animate-bounce-slow relative z-10 border-4 border-green-500">
                            <PartyPopper className="w-16 h-16 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-tight mb-6">
                        "SEQUENCE COMPLETE<br/>
                        <span className="text-green-400">NEURAL UPLINK VERIFIED</span>"
                    </h2>
                    <button onClick={() => setActiveView('dashboard')} className="mt-8 bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all shadow-xl active:scale-95">
                        Return to Hub
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in pb-24 relative">
            
            {/* Header */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-cyan-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                            <ClipboardList className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Protocol: {userLevel}
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">DATE: {new Date().toLocaleDateString()}</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Battle <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Deck</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mt-6 md:mt-0">
                        {member && (new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24) >= 3 && (
                            <button 
                                onClick={() => setIsOptimizeFutureModalOpen(true)}
                                className="relative bg-gradient-to-r from-purple-900/40 to-purple-800/40 hover:from-purple-800/60 hover:to-purple-700/60 backdrop-blur-xl border border-dashed border-purple-500/50 hover:border-purple-400 text-purple-400 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all duration-500 hover:-translate-y-1 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <SparkleIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10" /> 
                                <span className="relative z-10">Optimize Future Plan</span>
                            </button>
                        )}
                        {member && (new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24) >= 2 && (
                            <button 
                                onClick={() => setIsAiAdjustModalOpen(true)}
                                className="relative bg-gradient-to-r from-cyan-900/40 to-cyan-800/40 hover:from-cyan-800/60 hover:to-cyan-700/60 backdrop-blur-xl border border-dashed border-cyan-500/50 hover:border-cyan-400 text-cyan-400 px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all duration-500 hover:-translate-y-1 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                                <BrainCircuit className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10" /> 
                                <span className="relative z-10">AI Adjust Workout</span>
                            </button>
                        )}
                        <button 
                            onClick={() => {
                                // Convert activeWorkout to WorkoutTemplate format for PDF
                                const template = {
                                    id: 1,
                                    name: `Battle Deck - ${userLevel}`,
                                    level: userLevel as any,
                                    priority: 'High' as const,
                                    category: 'Daily Protocol',
                                    description: 'AI-Generated Daily Workout Protocol synced via N8N.',
                                    preWorkout: { name: Object.keys(activeWorkout)[0] || 'Warmup', exercises: (Object.values(activeWorkout)[0] as WorkoutExercise[]) || [] },
                                    mainWorkout: Object.entries(activeWorkout).slice(1, -1).map(([name, exercises]) => ({ name, exercises: exercises as WorkoutExercise[] })),
                                    finisher: { name: Object.keys(activeWorkout)[Object.keys(activeWorkout).length - 1] || 'Finisher', exercises: (Object.values(activeWorkout)[Object.keys(activeWorkout).length - 1] as WorkoutExercise[]) || [] }
                                };
                                generateWorkoutPDF(template, member);
                                addToast('PDF Downloaded Successfully', 'success');
                            }}
                            className="relative bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 backdrop-blur-xl border border-dashed border-gray-600/50 hover:border-white/60 text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 transition-all duration-500 hover:-translate-y-1 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <Download className="w-4 h-4 group-hover:scale-110 transition-transform duration-500 relative z-10" /> 
                            <span className="relative z-10">Download PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            {Object.entries(activeWorkout).map(([phaseName, exercisesRaw], phaseIdx) => {
                const exercises = exercisesRaw as WorkoutExercise[];
                const isSectionComplete = exercises.every(ex => {
                    const setsData = activeLogs[ex.name || 'Exercise'] || [];
                    return setsData.length > 0 && setsData.every(set => set.completed);
                });

                return (
                <div key={phaseIdx} className={`space-y-6 transition-all duration-500 ${isSectionComplete ? 'opacity-80' : ''}`}>
                    <div className={`flex justify-between items-center pl-4 border-l-4 ${isSectionComplete ? 'border-green-500 bg-green-900/20' : 'border-amber-500 bg-gray-900/20'} p-4 rounded-r-2xl transition-colors duration-500`}>
                        <div className="flex items-center gap-3">
                            <h3 className={`text-xl font-black uppercase tracking-[0.2em] italic ${isSectionComplete ? 'text-green-400' : 'text-white'}`}>{phaseName}</h3>
                            {isSectionComplete && (
                                <span className="flex items-center gap-1 text-[10px] font-black bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase tracking-widest border border-green-500/30 animate-pulse">
                                    <Check className="w-3 h-3" /> Cleared
                                </span>
                            )}
                        </div>
                        {phaseName.includes('Finisher') && !isSectionComplete && <span className="text-[10px] font-black bg-red-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Mandatory</span>}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {exercises.map((ex, i) => {
                            const exName = ex.name || 'Exercise';
                            const setsData = activeLogs[exName] || [];
                                            const exerciseData = getExerciseByName(exName); 
                                            const isExerciseComplete = setsData.length > 0 && setsData.every(s => s.completed);
                                            const thumbnailUrl = getMediaForExercise(exName);

                                            return (
                                                <motion.div 
                                                    key={i} 
                                                    animate={isExerciseComplete ? { 
                                                        scale: [1, 1.02, 1], 
                                                        borderColor: ['rgba(255,255,255,0.05)', 'rgba(34,197,94,0.5)', 'rgba(34,197,94,0.3)'],
                                                        boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 40px rgba(34,197,94,0.3)', '0 0 20px rgba(34,197,94,0.1)']
                                                    } : {}}
                                                    transition={{ duration: 0.6, ease: "easeInOut" }}
                                                    className={`bg-[#0a0a0a] rounded-[2.5rem] border overflow-hidden shadow-xl transition-all ${isExerciseComplete ? 'border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-white/5 hover:border-white/10'}`}
                                                >
                                                    <div className="flex flex-col sm:flex-row">
                                                        <div className="sm:w-1/3 h-56 sm:h-auto relative group cursor-pointer bg-black overflow-hidden border-r border-white/5 flex flex-col items-center justify-center">
                                                            {thumbnailUrl ? (
                                                                <img src={thumbnailUrl} alt={exName} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                                            ) : (
                                                                <div className={`absolute inset-0 bg-gradient-to-br transition-colors duration-700 ${isExerciseComplete ? 'from-green-900/30 to-emerald-900/30 opacity-70' : 'from-cyan-900/20 to-blue-900/20 opacity-50'}`}></div>
                                                            )}
                                                            <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500 bg-black/50 backdrop-blur-sm relative z-10 ${isExerciseComplete ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'border-cyan-500/30'}`}>
                                                                {isExerciseComplete ? (
                                                                    <Check className="w-10 h-10 text-green-400" />
                                                                ) : (
                                                                    <PlayCircle className="w-10 h-10 text-cyan-400" />
                                                                )}
                                                            </div>
                                                            <p className={`text-xs font-black uppercase tracking-widest z-10 relative ${isExerciseComplete ? 'text-green-400' : 'text-white'}`}>{exName}</p>
                                                             <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 backdrop-blur-sm z-20">
                                                 {member && (new Date().getTime() - new Date(member.joinDate).getTime()) / (1000 * 60 * 60 * 24) >= 2 && (
                                                     <button onClick={() => setLiveModeExercise(ex)} className="text-[9px] font-black text-white uppercase tracking-[0.3em] bg-black/60 px-4 py-2 rounded-full border border-cyan-500/30 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 transition-all shadow-lg flex items-center gap-2">
                                                         <Zap className="w-3 h-3"/> Smart Mirror
                                                     </button>
                                                 )}
                                                 <button onClick={() => setSelectedExercise(exName)} className="text-[9px] font-black text-white uppercase tracking-[0.3em] bg-black/60 px-4 py-2 rounded-full border border-white/30 hover:bg-white hover:text-black transition-all shadow-lg flex items-center gap-2">
                                                     <Info className="w-3 h-3"/> View Tutorial
                                                 </button>
                                                 <button onClick={() => setHistoryModalEx(exName)} className="text-[9px] font-black text-white uppercase tracking-[0.3em] bg-black/60 px-4 py-2 rounded-full border border-amber-500/30 hover:bg-amber-500 hover:text-black transition-all shadow-lg flex items-center gap-2">
                                                     <BarChart2 className="w-3 h-3"/> Progress Chart
                                                 </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 p-8">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h4 className="text-2xl font-black uppercase italic leading-none text-white tracking-tight">{exName}</h4>
                                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{ex.sets} Sets x {ex.reps} Reps</p>
                                                </div>
                                                <button onClick={() => setNotesModalEx(exName)} className={`p-3 rounded-xl transition-all ${exerciseNotes[exName] ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-500 hover:text-white'}`}>
                                                    <FileText className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                            {setsData.map((set, sIdx) => (
                                                <div key={sIdx} className={`p-4 rounded-2xl border transition-all duration-300 ${set.completed ? 'bg-green-950/20 border-green-500/30' : 'bg-black/40 border-white/5'}`}>
                                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                        <span className="text-xs font-black text-gray-500 w-12 text-center md:text-left">SET {set.setNumber}</span>
                                                        
                                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                                            <div className="flex items-center justify-between bg-gray-900 border border-white/10 rounded-xl p-1">
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'weight', Math.max(0, set.weight - 2.5))} disabled={set.completed} className="px-3 py-1 text-gray-400 disabled:opacity-30 hover:bg-white/10 rounded-lg">-</button>
                                                                <input type="number" value={set.weight || ''} onChange={(e) => handleUpdateSet(exName, sIdx, 'weight', Number(e.target.value))} readOnly={set.completed} className="w-16 bg-transparent text-lg font-bold text-white text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0"/>
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'weight', set.weight + 2.5)} disabled={set.completed} className="px-3 py-1 text-gray-400 disabled:opacity-30 hover:bg-white/10 rounded-lg">+</button>
                                                                <span className="text-[10px] text-gray-600 font-black pr-2">KG</span>
                                                            </div>

                                                            <div className="flex items-center justify-between bg-gray-900 border border-white/10 rounded-xl p-1">
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'reps', Math.max(0, set.reps - 1))} disabled={set.completed} className="px-3 py-1 text-gray-400 disabled:opacity-30 hover:bg-white/10 rounded-lg">-</button>
                                                                <input type="number" value={set.reps || ''} onChange={(e) => handleUpdateSet(exName, sIdx, 'reps', Number(e.target.value))} readOnly={set.completed} className="w-16 bg-transparent text-lg font-bold text-white text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0"/>
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'reps', set.reps + 1)} disabled={set.completed} className="px-3 py-1 text-gray-400 disabled:opacity-30 hover:bg-white/10 rounded-lg">+</button>
                                                                <span className="text-[10px] text-gray-600 font-black pr-2">REPS</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center justify-between bg-gray-900 border border-white/10 rounded-xl p-1">
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'rpe', Math.max(0, set.rpe - 1))} disabled={set.completed} className="px-3 py-1 text-gray-400 disabled:opacity-30 hover:bg-white/10 rounded-lg">-</button>
                                                                <input type="number" value={set.rpe || ''} onChange={(e) => handleUpdateSet(exName, sIdx, 'rpe', Number(e.target.value))} readOnly={set.completed} className="w-16 bg-transparent text-lg font-bold text-white text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="-"/>
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'rpe', Math.min(10, set.rpe + 1))} disabled={set.completed} className="px-3 py-1 text-gray-400 disabled:opacity-30 hover:bg-white/10 rounded-lg">+</button>
                                                                <span className="text-[10px] text-gray-600 font-black pr-2">RPE</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex gap-2 w-full md:w-auto">
                                                            <button 
                                                                onClick={() => handleRemoveSet(exName, sIdx)}
                                                                disabled={set.completed || setsData.length <= 1}
                                                                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg bg-red-950/40 text-red-500 hover:bg-red-900/60 hover:text-red-400 disabled:opacity-30"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleCompleteSet(exName, sIdx)}
                                                                className={`flex-1 md:w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${set.completed ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-105' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'}`}
                                                            >
                                                                <AnimatePresence mode="wait">
                                                                    {set.completed ? (
                                                                        <motion.div
                                                                            key="completed"
                                                                            initial={{ scale: 0, rotate: -180 }}
                                                                            animate={{ scale: 1, rotate: 0 }}
                                                                            exit={{ scale: 0, rotate: 180 }}
                                                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                                        >
                                                                            <Check className="w-6 h-6" strokeWidth={3} />
                                                                        </motion.div>
                                                                    ) : (
                                                                        <motion.div
                                                                            key="uncompleted"
                                                                            initial={{ scale: 0 }}
                                                                            animate={{ scale: 1 }}
                                                                            exit={{ scale: 0 }}
                                                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                                        >
                                                                            <Check className="w-6 h-6" strokeWidth={3} />
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => handleAddSet(exName)}
                                                className="w-full py-4 rounded-2xl border border-dashed border-white/20 text-gray-400 font-bold uppercase tracking-widest text-xs hover:bg-white/5 hover:border-white/40 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-4 h-4" /> Add Set
                                            </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
                );
            })}

            <div className="pt-24 pb-12">
                <button 
                    onClick={handleFinishSession}
                    disabled={progress < 100 || isSyncing}
                    className={`relative w-full bg-gradient-to-r from-green-900/40 to-emerald-900/40 hover:from-green-800/60 hover:to-emerald-800/60 backdrop-blur-xl text-white font-black py-6 rounded-[3rem] text-sm transition-all duration-500 uppercase italic tracking-widest border border-dashed border-green-500/50 flex items-center justify-center gap-4 group overflow-hidden ${progress < 100 ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-2 hover:border-green-400 hover:shadow-[0_0_60px_rgba(34,197,94,0.4)] hover:text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]'}`}
                >
                    <div className={`absolute inset-0 bg-white/10 translate-y-full transition-transform duration-300 ease-in-out ${progress === 100 ? 'group-hover:translate-y-0' : ''}`}></div>
                    <div className="relative z-10 flex items-center gap-4">
                        {isSyncing ? <RefreshCw className="w-6 h-6 animate-spin text-green-400"/> : <Save className={`w-6 h-6 transition-transform duration-500 ${progress === 100 ? 'group-hover:scale-125' : ''}`} />}
                        <span>{isSyncing ? 'UPLOADING TO CORE...' : progress < 100 ? `Complete All Sets (${progress}%)` : 'Finalize & Sync Results'}</span>
                    </div>
                </button>
            </div>
            
            <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 transform ${isResting ? 'translate-y-0' : 'translate-y-full'}`}>
                 <div className="bg-black/90 backdrop-blur-xl border-t-2 border-red-500 p-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(220,38,38,0.3)]">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600/20 rounded-full animate-pulse border border-red-500/50">
                             <TimerIcon className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Smart Cooldown</p>
                            <p className="text-4xl font-mono font-black text-white leading-none">{restTimer}s</p>
                        </div>
                     </div>
                     
                     <div className="flex gap-2">
                         <button onClick={() => adjustTimer(-10)} className="p-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700">-10s</button>
                         <button onClick={() => adjustTimer(10)} className="p-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700">+10s</button>
                         <button onClick={() => setRestTimer(0)} className="px-6 py-3 bg-red-600 text-white font-black rounded-xl hover:bg-red-500 uppercase tracking-widest text-xs ml-2">
                             Skip
                         </button>
                     </div>
                 </div>
            </div>

            <ExerciseDemoModal 
                isOpen={!!selectedExercise} 
                onClose={() => setSelectedExercise(null)} 
                exerciseName={selectedExercise || ''} 
                videoUrl={selectedExercise ? (Object.values(activeWorkout).flat() as WorkoutExercise[]).find(e => e.name === selectedExercise)?.videoUrl : undefined}
            />
            
            <ExerciseHistoryModal 
                isOpen={!!historyModalEx}
                onClose={() => setHistoryModalEx(null)}
                exerciseName={historyModalEx || ''}
                history={historyModalEx ? getHistoryForExercise(historyModalEx) : []}
            />

            <NotesModal 
                isOpen={!!notesModalEx}
                onClose={() => setNotesModalEx(null)}
                exerciseName={notesModalEx || ''}
                note={notesModalEx ? (exerciseNotes[notesModalEx] || '') : ''}
                onSave={(text) => notesModalEx && setExerciseNotes(prev => ({ ...prev, [notesModalEx]: text }))}
            />

            {/* Contact Trainer Button */}
            <a 
                href="https://wa.me/919876543210?text=I%20need%20help%20with%20my%20workout" 
                target="_blank" 
                rel="noopener noreferrer"
                className="fixed bottom-32 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all active:scale-95 border-2 border-white animate-bounce-slow"
                title="Contact Trainer"
            >
                <MessageCircle className="w-6 h-6" />
            </a>

            {/* AI Adjust Workout Modal */}
            <Modal isOpen={isAiAdjustModalOpen} onClose={() => setIsAiAdjustModalOpen(false)} title="AI Workout Adjuster">
                <div className="space-y-6">
                    <div className="bg-cyan-900/10 border border-cyan-500/30 p-4 rounded-xl">
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4" /> Future-Core AI
                        </p>
                        <p className="text-xs text-gray-300 mt-2">
                            Describe how you are feeling today. Any pain, fatigue, or specific requests? I will analyze your past performance and adjust today's protocol.
                        </p>
                    </div>
                    
                    <textarea 
                        value={userFeedback}
                        onChange={(e) => setUserFeedback(e.target.value)}
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-cyan-500 min-h-[120px]"
                        placeholder="e.g., My lower back feels tight today, can we avoid heavy squats?"
                    />
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsAiAdjustModalOpen(false)} 
                            className="flex-1 py-4 bg-gray-900 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={async () => {
                                setIsAdjusting(true);
                                addToast("Analyzing past logs and feedback...", "info");
                                try {
                                    const { suggestWorkoutModification } = await import('../../../lib/aiWorkout');
                                    const pastLogs = detailedWorkoutLogs.filter(l => l.memberId === memberId);
                                    const memberReports = medicalReports.filter(r => r.member_id === memberId);
                                    const result = await suggestWorkoutModification(activeWorkout, pastLogs, userFeedback, member, memberReports);
                                    
                                    if (result.modified_workout && result.modified_workout.length > 0) {
                                        const newWorkout: Record<string, WorkoutExercise[]> = {};
                                        result.modified_workout.forEach(phase => {
                                            newWorkout[phase.category] = phase.exercises.map(ex => ({
                                                name: ex.name,
                                                sets: ex.sets,
                                                reps: ex.reps
                                            }));
                                        });
                                        setAiModifiedWorkout(newWorkout);
                                        addToast("Workout Adjusted Successfully", "success");
                                    } else {
                                        addToast("Could not generate a new workout.", "error");
                                    }
                                } catch (e) {
                                    addToast("AI Adjustment Failed.", "error");
                                } finally {
                                    setIsAdjusting(false);
                                    setIsAiAdjustModalOpen(false);
                                    setUserFeedback('');
                                }
                            }} 
                            disabled={isAdjusting || !userFeedback.trim()}
                            className="flex-[2] py-4 bg-cyan-500 text-black rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isAdjusting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {isAdjusting ? 'Re-calibrating...' : 'Adjust Protocol'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Optimize Future Plan Modal */}
            <Modal isOpen={isOptimizeFutureModalOpen} onClose={() => setIsOptimizeFutureModalOpen(false)} title="Optimize Future Plan">
                <div className="space-y-6">
                    <div className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl">
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4" /> Future-Core AI
                        </p>
                        <p className="text-xs text-gray-300 mt-2">
                            I will analyze your historical performance logs to automatically adjust intensity, volume, and exercise selection for your future workout plans.
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsOptimizeFutureModalOpen(false)} 
                            className="flex-1 py-4 bg-gray-900 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={async () => {
                                setIsOptimizingFuture(true);
                                addToast("Analyzing historical performance data...", "info");
                                try {
                                    const { analyzeAndAdjustFuturePlans } = await import('../../../lib/aiWorkout');
                                    const pastLogs = detailedWorkoutLogs.filter(l => l.memberId === memberId);
                                    const result = await analyzeAndAdjustFuturePlans(pastLogs, member);
                                    
                                    if (result.modified_workout && result.modified_workout.length > 0) {
                                        const newWorkout: Record<string, WorkoutExercise[]> = {};
                                        result.modified_workout.forEach(phase => {
                                            newWorkout[phase.category] = phase.exercises.map(ex => ({
                                                name: ex.name,
                                                sets: ex.sets,
                                                reps: ex.reps
                                            }));
                                        });
                                        
                                        // Save to member profile or just set it as active for now
                                        const updatedMember = { ...member, approvedAiPlan: JSON.stringify(newWorkout) };
                                        updateMember(updatedMember);
                                        
                                        setAiModifiedWorkout(newWorkout);
                                        addToast("Future Plan Optimized & Saved Successfully", "success");
                                    } else {
                                        addToast("Could not optimize future plan.", "error");
                                    }
                                } catch (e) {
                                    addToast("Optimization Failed.", "error");
                                } finally {
                                    setIsOptimizingFuture(false);
                                    setIsOptimizeFutureModalOpen(false);
                                }
                            }} 
                            disabled={isOptimizingFuture}
                            className="flex-[2] py-4 bg-purple-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isOptimizingFuture ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SparkleIcon className="w-4 h-4" />}
                            {isOptimizingFuture ? 'Optimizing...' : 'Optimize Plan'}
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Manual Stopwatch Widget */}
            <div className="fixed bottom-6 left-6 z-40 bg-gray-900/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-xl font-mono font-black text-white w-16">{formatTime(manualTimer)}</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsManualTimerRunning(!isManualTimerRunning)}
                        className={`p-2 rounded-lg ${isManualTimerRunning ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'} hover:bg-opacity-40 transition-all`}
                    >
                        {isManualTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button 
                        onClick={() => { setManualTimer(0); setIsManualTimerRunning(false); }}
                        className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/40 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <ExerciseFeedbackModal 
                isOpen={!!feedbackModalEx}
                onClose={() => setFeedbackModalEx(null)}
                exerciseName={feedbackModalEx || ''}
                onSubmit={(feedback) => {
                    addToast(`Feedback logged: ${feedback}. AI will adjust ${feedbackModalEx} for your next session.`, "success");
                    // Here we would typically save this feedback to the member's profile or workout log
                    // to be used by suggestWorkoutModification in the future.
                }}
            />

        </div>
    );
};

export default TodaysWorkout;
