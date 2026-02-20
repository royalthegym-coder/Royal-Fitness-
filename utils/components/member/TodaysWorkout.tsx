
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_WORKOUT_TEMPLATES } from '../../../constants';
import { WorkoutExercise, View, DetailedSetLog, DetailedWorkoutSession } from '../../../types';
import ExerciseDemoModal, { getExerciseByName, EXERCISE_DB } from '../common/ExerciseDemoModal';
import { useData } from '../../context/DataProvider';
import { TimerIcon } from '../icons/ActivityIcons';
import { 
    Play, RotateCcw, PartyPopper, Plus, Settings, Calendar, Layers, 
    Video, ArrowRight, Activity, PlayCircle, Clock, Users, Flame, 
    Save, BarChart3, Radio, Check, Minus, X, Info, BarChart2,
    ClipboardList, BrainCircuit, Target, RefreshCw, FileText, Zap
} from 'lucide-react';
import AIWorkoutGeneratorModal from '../common/AIWorkoutGeneratorModal';
import { SparkleIcon } from '../icons/SparkleIcon';
import { ResponsiveContainer, LineChart, Line, YAxis, Tooltip, CartesianGrid, XAxis } from 'recharts';
import { useToast } from '../../hooks/useToast';
import Modal from '../common/Modal';
import LiveTrainingHUD from './LiveTrainingHUD';

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

const TodaysWorkout: React.FC<{ memberId: number; setActiveView: (v: View) => void }> = ({ memberId, setActiveView }) => {
    const { addRoutineLog, liveHealthData, addDetailedWorkoutLog, members, detailedWorkoutLogs, workoutTemplates } = useData();
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
    
    // --- LOGIC: BUILD THE DYNAMIC WORKOUT STRUCTURE ---
    const generatedWorkout: Record<string, WorkoutExercise[]> = useMemo(() => {
        // 1. Check for Admin Assigned Plan
        if (member?.approvedAiPlan) {
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
            [{ name: 'World Greatest Stretch', sets: '1', reps: '1 min' }, { name: 'Plank', sets: '1', reps: '45s' }]
        ];
        structure['1. Pre-Workout Activation'] = warmupVariations[dayOfYear % 3];

        const splitDay = dayOfYear % 4; // 0: Chest, 1: Back, 2: Legs, 3: Shoulders/Arms
        let mainExercises: WorkoutExercise[] = [];
        let categoryName = "Full Body";

        // Simplified logic for brevity - using existing pattern
        if (userLevel === 'Beginner') {
            categoryName = "Foundation Protocol";
            mainExercises = [{ name: 'Goblet Squat', sets: '3', reps: '12' }, { name: 'Push Up', sets: '3', reps: '10' }, { name: 'Lat Pulldown', sets: '3', reps: '12' }, { name: 'Plank', sets: '3', reps: '30s' }];
        } else {
             // Advanced Logic Placeholder
             categoryName = "Hypertrophy A";
             mainExercises = [{ name: 'Bench Press', sets: '4', reps: '8' }, { name: 'Incline Dumbbell Press', sets: '3', reps: '10' }, { name: 'Cable Fly', sets: '3', reps: '12' }];
        }
        structure[`2. ${categoryName} (${userLevel})`] = mainExercises;
        structure['3. The Finisher'] = [{ name: 'Burpees', sets: '1', reps: 'Max' }];

        return structure;
    }, [userLevel, dayOfYear, member, workoutTemplates]);

    // Init Logs
    useEffect(() => {
        const init: Record<string, DetailedSetLog[]> = {};
        Object.values(generatedWorkout).flat().forEach(ex => {
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
    }, [generatedWorkout]);

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
             setRestTimer(userLevel === 'Pro Body' ? 90 : 60);
             setIsResting(true);
        }
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
                task_desc: `Completed: ${Object.keys(generatedWorkout)[1]}`,
                task_time: new Date().toLocaleTimeString(),
                is_done: true
            });
            setIsSyncing(false);
            setSessionComplete(true);
            window.scrollTo(0,0);
            addToast("Quantum Uplink: Session Synced to Core.", "success");
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
        return <LiveTrainingHUD exercise={liveModeExercise.name} sets={liveModeExercise.sets} onClose={() => setLiveModeExercise(null)} />;
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
                </div>
            </div>

            {Object.entries(generatedWorkout).map(([phaseName, exercises], phaseIdx) => (
                <div key={phaseIdx} className="space-y-6">
                    <div className="flex justify-between items-center pl-4 border-l-4 border-amber-500 bg-gray-900/20 p-4 rounded-r-2xl">
                        <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] italic">{phaseName}</h3>
                        {phaseName.includes('Finisher') && <span className="text-[10px] font-black bg-red-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">Mandatory</span>}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                        {exercises.map((ex, i) => {
                            const exName = ex.name || 'Exercise';
                            const setsData = activeLogs[exName] || [];
                            const exerciseData = getExerciseByName(exName); 

                            return (
                                <div key={i} className="bg-[#0a0a0a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-xl hover:border-white/10 transition-all">
                                    <div className="flex flex-col sm:flex-row">
                                        <div className="sm:w-1/3 h-56 sm:h-auto relative group cursor-pointer bg-black overflow-hidden">
                                            <img 
                                                src={exerciseData.thumbnailUrl} 
                                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-700"
                                                alt="thumb" 
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                                 <button onClick={() => setLiveModeExercise(ex)} className="text-[9px] font-black text-white uppercase tracking-[0.3em] bg-black/60 px-4 py-2 rounded-full border border-cyan-500/30 hover:bg-cyan-500 hover:text-black hover:border-cyan-400 transition-all shadow-lg flex items-center gap-2">
                                                     <Zap className="w-3 h-3"/> Neural Mirror
                                                 </button>
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
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black text-gray-500 w-12">SET {set.setNumber}</span>
                                                        
                                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mx-4">
                                                            <div className="flex items-center gap-1 bg-gray-900 border border-white/10 rounded-xl p-1">
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'weight', Math.max(0, set.weight - 2.5))} disabled={set.completed} className="px-2 text-gray-400 disabled:opacity-30">-</button>
                                                                <input type="number" value={set.weight || ''} onChange={(e) => handleUpdateSet(exName, sIdx, 'weight', Number(e.target.value))} readOnly={set.completed} className="w-full bg-transparent text-lg font-bold text-white text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0"/>
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'weight', set.weight + 2.5)} disabled={set.completed} className="px-2 text-gray-400 disabled:opacity-30">+</button>
                                                                <span className="text-[10px] text-gray-600 font-black pr-1">KG</span>
                                                            </div>

                                                            <div className="flex items-center gap-1 bg-gray-900 border border-white/10 rounded-xl p-1">
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'reps', Math.max(0, set.reps - 1))} disabled={set.completed} className="px-2 text-gray-400 disabled:opacity-30">-</button>
                                                                <input type="number" value={set.reps || ''} onChange={(e) => handleUpdateSet(exName, sIdx, 'reps', Number(e.target.value))} readOnly={set.completed} className="w-full bg-transparent text-lg font-bold text-white text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0"/>
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'reps', set.reps + 1)} disabled={set.completed} className="px-2 text-gray-400 disabled:opacity-30">+</button>
                                                                <span className="text-[10px] text-gray-600 font-black pr-1">REPS</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-1 bg-gray-900 border border-white/10 rounded-xl p-1">
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'rpe', Math.max(0, set.rpe - 1))} disabled={set.completed} className="px-2 text-gray-400 disabled:opacity-30">-</button>
                                                                <input type="number" value={set.rpe || ''} onChange={(e) => handleUpdateSet(exName, sIdx, 'rpe', Number(e.target.value))} readOnly={set.completed} className="w-full bg-transparent text-lg font-bold text-white text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="-"/>
                                                                <button type="button" onClick={() => handleUpdateSet(exName, sIdx, 'rpe', Math.min(10, set.rpe + 1))} disabled={set.completed} className="px-2 text-gray-400 disabled:opacity-30">+</button>
                                                                <span className="text-[10px] text-gray-600 font-black pr-1">RPE</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <button 
                                                            onClick={() => handleCompleteSet(exName, sIdx)}
                                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${set.completed ? 'bg-green-500 text-black shadow-green-500/20' : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-white'}`}
                                                        >
                                                            <Check className="w-6 h-6" strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div className="pt-24 pb-12">
                <button 
                    onClick={handleFinishSession}
                    disabled={progress < 100 || isSyncing}
                    className={`w-full bg-white text-black font-black py-6 rounded-[3rem] text-sm shadow-[0_0_60px_rgba(255,255,255,0.3)] transition-all hover:scale-[1.02] active:scale-95 uppercase italic tracking-widest border-4 border-white/50 backdrop-blur-xl flex items-center justify-center gap-4 ${progress < 100 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSyncing ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                    {isSyncing ? 'UPLOADING TO CORE...' : progress < 100 ? `Complete All Sets (${progress}%)` : 'Finalize & Sync Results'}
                </button>
            </div>
            
            <div className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-500 transform ${isResting ? 'translate-y-0' : 'translate-y-full'}`}>
                 <div className="bg-black/90 backdrop-blur-xl border-t-2 border-red-500 p-4 flex justify-between items-center shadow-[0_-10px_40px_rgba(220,38,38,0.3)]">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600/20 rounded-full animate-pulse border border-red-500/50">
                             <TimerIcon className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Neural Cooldown</p>
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
        </div>
    );
};

export default TodaysWorkout;
