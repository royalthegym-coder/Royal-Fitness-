import React, { useState, useMemo, useEffect } from 'react';
import {
    Dumbbell, Plus, Trash2, CheckCircle2, Flame, Trophy, History,
    TrendingUp, Calendar, Clock, Play, Save, User, Sparkles,
    ChevronDown, ChevronUp, RotateCcw, Award, Activity, Target, Check
} from 'lucide-react';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
    CartesianGrid, BarChart, Bar
} from 'recharts';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { syncToFirebase } from '../../lib/firebase';

const COMMON_EXERCISES = [
    { id: 'ex1', name: 'Barbell Bench Press', category: 'Chest' },
    { id: 'ex2', name: 'Incline Dumbbell Press', category: 'Chest' },
    { id: 'ex3', name: 'Cable Chest Fly', category: 'Chest' },
    { id: 'ex4', name: 'Conventional Deadlift', category: 'Back' },
    { id: 'ex5', name: 'Lat Pulldown (Wide Grip)', category: 'Back' },
    { id: 'ex6', name: 'Seated Cable Row', category: 'Back' },
    { id: 'ex7', name: 'Barbell Back Squat', category: 'Legs' },
    { id: 'ex8', name: 'Romanian Deadlift (RDL)', category: 'Legs' },
    { id: 'ex9', name: 'Leg Press Machine', category: 'Legs' },
    { id: 'ex10', name: 'Overhead Barbell Press', category: 'Shoulders' },
    { id: 'ex11', name: 'Lateral Raises', category: 'Shoulders' },
    { id: 'ex12', name: 'Barbell Bicep Curl', category: 'Arms' },
    { id: 'ex13', name: 'Cable Tricep Pushdowns', category: 'Arms' }
];

export interface LoggedSet {
    setNumber: number;
    reps: number;
    weightKg: number;
    rpe?: number;
    completed: boolean;
}

export interface LoggedExercise {
    id: string;
    name: string;
    muscleGroup: string;
    sets: LoggedSet[];
}

export interface CustomRoutine {
    id: string;
    name: string;
    focus: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    description: string;
    exercises: {
        name: string;
        muscleGroup: string;
        targetSets: number;
        targetReps: number;
        targetWeightKg: number;
    }[];
    createdAt: string;
}

export interface WorkoutSessionRecord {
    id: string;
    memberId: number;
    memberName: string;
    routineName: string;
    focus: string;
    date: string;
    durationMinutes: number;
    totalVolumeKg: number;
    totalSets: number;
    totalReps: number;
    maxWeightKg: number;
    notes?: string;
    exercises: LoggedExercise[];
}

const DEFAULT_CUSTOM_ROUTINES: CustomRoutine[] = [
    {
        id: 'routine-push-hypertrophy',
        name: 'Upper Push & Chest Hypertrophy',
        focus: 'Chest, Shoulders & Triceps',
        level: 'Intermediate',
        description: 'Progressive overload compound pressing paired with shoulder and tricep isolation.',
        createdAt: '2025-02-10',
        exercises: [
            { name: 'Barbell Bench Press', muscleGroup: 'Chest', targetSets: 4, targetReps: 8, targetWeightKg: 70 },
            { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', targetSets: 3, targetReps: 10, targetWeightKg: 26 },
            { name: 'Overhead Barbell Press', muscleGroup: 'Shoulders', targetSets: 3, targetReps: 8, targetWeightKg: 45 },
            { name: 'Lateral Raises', muscleGroup: 'Shoulders', targetSets: 3, targetReps: 15, targetWeightKg: 12 },
            { name: 'Cable Tricep Pushdowns', muscleGroup: 'Arms', targetSets: 3, targetReps: 12, targetWeightKg: 30 }
        ]
    },
    {
        id: 'routine-pull-strength',
        name: 'Back Thickness & Pull Power',
        focus: 'Back, Lats & Biceps',
        level: 'Intermediate',
        description: 'Heavy horizontal and vertical pulling movements for back density and arm strength.',
        createdAt: '2025-02-12',
        exercises: [
            { name: 'Conventional Deadlift', muscleGroup: 'Back', targetSets: 4, targetReps: 5, targetWeightKg: 110 },
            { name: 'Lat Pulldown (Wide Grip)', muscleGroup: 'Back', targetSets: 4, targetReps: 10, targetWeightKg: 60 },
            { name: 'Seated Cable Row', muscleGroup: 'Back', targetSets: 3, targetReps: 12, targetWeightKg: 55 },
            { name: 'Barbell Bicep Curl', muscleGroup: 'Arms', targetSets: 3, targetReps: 10, targetWeightKg: 30 }
        ]
    },
    {
        id: 'routine-legs-athletic',
        name: 'Lower Body Strength & Glutes',
        focus: 'Legs, Quads, Hamstrings & Core',
        level: 'Advanced',
        description: 'Lower-body strength foundation focusing on squat depth, posterior chain, and core stability.',
        createdAt: '2025-02-14',
        exercises: [
            { name: 'Barbell Back Squat', muscleGroup: 'Legs', targetSets: 4, targetReps: 8, targetWeightKg: 95 },
            { name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', targetSets: 3, targetReps: 10, targetWeightKg: 80 },
            { name: 'Leg Press Machine', muscleGroup: 'Legs', targetSets: 3, targetReps: 12, targetWeightKg: 160 },
            { name: 'Standing Calf Raises', muscleGroup: 'Legs', targetSets: 4, targetReps: 15, targetWeightKg: 60 }
        ]
    }
];

const INITIAL_WORKOUT_HISTORY: WorkoutSessionRecord[] = [];

export const WorkoutPlannerTracker: React.FC = () => {
    const { members, addWorkoutTemplate, addDetailedWorkoutLog } = useData();
    const { addToast } = useToast();

    const [subTab, setSubTab] = useState<'logger' | 'routines' | 'history'>('logger');

    // Persisted Custom Routines
    const [customRoutines, setCustomRoutines] = useState<CustomRoutine[]>(() => {
        try {
            const saved = localStorage.getItem('fitness_custom_routines_v1');
            return saved ? JSON.parse(saved) : DEFAULT_CUSTOM_ROUTINES;
        } catch {
            return DEFAULT_CUSTOM_ROUTINES;
        }
    });

    // Persisted Workout History
    const [workoutHistory, setWorkoutHistory] = useState<WorkoutSessionRecord[]>(() => {
        try {
            const saved = localStorage.getItem('fitness_workout_history_v1');
            return saved ? JSON.parse(saved) : INITIAL_WORKOUT_HISTORY;
        } catch {
            return INITIAL_WORKOUT_HISTORY;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('fitness_custom_routines_v1', JSON.stringify(customRoutines));
        } catch (err) {
            console.error('Failed to save custom routines:', err);
        }
    }, [customRoutines]);

    useEffect(() => {
        try {
            localStorage.setItem('fitness_workout_history_v1', JSON.stringify(workoutHistory));
        } catch (err) {
            console.error('Failed to save workout history:', err);
        }
    }, [workoutHistory]);

    // Active Workout Session Logger State
    const [selectedMemberId, setSelectedMemberId] = useState<number>(members[0]?.id || 1);
    const [sessionRoutineName, setSessionRoutineName] = useState<string>(DEFAULT_CUSTOM_ROUTINES[0].name);
    const [sessionFocus, setSessionFocus] = useState<string>(DEFAULT_CUSTOM_ROUTINES[0].focus);
    const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [sessionDuration, setSessionDuration] = useState<number>(55);
    const [sessionNotes, setSessionNotes] = useState<string>('');
    const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>(() =>
        DEFAULT_CUSTOM_ROUTINES[0].exercises.map((ex, idx) => ({
            id: `init-ex-${idx}`,
            name: ex.name,
            muscleGroup: ex.muscleGroup,
            sets: Array.from({ length: ex.targetSets }, (_, sIdx) => ({
                setNumber: sIdx + 1,
                reps: ex.targetReps,
                weightKg: ex.targetWeightKg,
                rpe: 8,
                completed: true
            }))
        }))
    );

    // Quick Add Exercise in Logger
    const [newExName, setNewExName] = useState('');
    const [newExMuscle, setNewExMuscle] = useState('Chest');
    const [newExSets, setNewExSets] = useState(3);
    const [newExReps, setNewExReps] = useState(10);
    const [newExWeight, setNewExWeight] = useState(40);

    // Custom Routine Builder Form State
    const [builderName, setBuilderName] = useState('');
    const [builderFocus, setBuilderFocus] = useState('Full Body Strength');
    const [builderLevel, setBuilderLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
    const [builderDesc, setBuilderDesc] = useState('');
    const [builderExercises, setBuilderExercises] = useState<CustomRoutine['exercises']>([
        { name: 'Barbell Bench Press', muscleGroup: 'Chest', targetSets: 4, targetReps: 8, targetWeightKg: 60 },
        { name: 'Barbell Back Squat', muscleGroup: 'Legs', targetSets: 4, targetReps: 8, targetWeightKg: 80 }
    ]);
    const [builderExInput, setBuilderExInput] = useState('');
    const [builderMuscleInput, setBuilderMuscleInput] = useState('Chest');
    const [builderSetsInput, setBuilderSetsInput] = useState(3);
    const [builderRepsInput, setBuilderRepsInput] = useState(10);
    const [builderWeightInput, setBuilderWeightInput] = useState(40);

    // History Filter State
    const [historyMemberFilter, setHistoryMemberFilter] = useState<string>('All');
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(workoutHistory[0]?.id || null);

    // Load a Routine into the Active Logger
    const handleLoadRoutineToLogger = (routine: CustomRoutine) => {
        setSessionRoutineName(routine.name);
        setSessionFocus(routine.focus);
        setLoggedExercises(
            routine.exercises.map((ex, idx) => ({
                id: `log-ex-${Date.now()}-${idx}`,
                name: ex.name,
                muscleGroup: ex.muscleGroup,
                sets: Array.from({ length: ex.targetSets }, (_, sIdx) => ({
                    setNumber: sIdx + 1,
                    reps: ex.targetReps,
                    weightKg: ex.targetWeightKg,
                    rpe: 8,
                    completed: true
                }))
            }))
        );
        setSubTab('logger');
        addToast(`Loaded "${routine.name}" into Workout Logger.`, 'info');
    };

    // Logger Handlers
    const handleUpdateSet = (exId: string, setIndex: number, field: keyof LoggedSet, value: number | boolean) => {
        setLoggedExercises(prev =>
            prev.map(ex => {
                if (ex.id !== exId) return ex;
                const updatedSets = ex.sets.map((s, idx) => (idx === setIndex ? { ...s, [field]: value } : s));
                return { ...ex, sets: updatedSets };
            })
        );
    };

    const handleAddSetToExercise = (exId: string) => {
        setLoggedExercises(prev =>
            prev.map(ex => {
                if (ex.id !== exId) return ex;
                const lastSet = ex.sets[ex.sets.length - 1] || { reps: 10, weightKg: 40, rpe: 8 };
                return {
                    ...ex,
                    sets: [
                        ...ex.sets,
                        {
                            setNumber: ex.sets.length + 1,
                            reps: lastSet.reps,
                            weightKg: lastSet.weightKg,
                            rpe: lastSet.rpe || 8,
                            completed: true
                        }
                    ]
                };
            })
        );
    };

    const handleRemoveSetFromExercise = (exId: string, setIndex: number) => {
        setLoggedExercises(prev =>
            prev.map(ex => {
                if (ex.id !== exId) return ex;
                const filtered = ex.sets
                    .filter((_, idx) => idx !== setIndex)
                    .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
                return { ...ex, sets: filtered };
            })
        );
    };

    const handleAddExerciseToLogger = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newExName.trim()) {
            addToast('Please enter or select an exercise name.', 'error');
            return;
        }
        const added: LoggedExercise = {
            id: `ex-${Date.now()}`,
            name: newExName.trim(),
            muscleGroup: newExMuscle,
            sets: Array.from({ length: Math.max(1, newExSets) }, (_, idx) => ({
                setNumber: idx + 1,
                reps: newExReps,
                weightKg: newExWeight,
                rpe: 8,
                completed: true
            }))
        };
        setLoggedExercises(prev => [...prev, added]);
        setNewExName('');
        addToast(`Added ${added.name} (${added.sets.length} sets) to session.`, 'success');
    };

    const handleRemoveExerciseFromLogger = (exId: string) => {
        setLoggedExercises(prev => prev.filter(ex => ex.id !== exId));
    };

    // Live Session Metrics
    const sessionMetrics = useMemo(() => {
        let totalVolumeKg = 0;
        let totalSets = 0;
        let totalReps = 0;
        let maxWeightKg = 0;

        loggedExercises.forEach(ex => {
            ex.sets.forEach(s => {
                if (s.completed) {
                    totalSets += 1;
                    totalReps += Number(s.reps) || 0;
                    totalVolumeKg += (Number(s.reps) || 0) * (Number(s.weightKg) || 0);
                    if ((Number(s.weightKg) || 0) > maxWeightKg) {
                        maxWeightKg = Number(s.weightKg) || 0;
                    }
                }
            });
        });

        return { totalVolumeKg: Math.round(totalVolumeKg), totalSets, totalReps, maxWeightKg };
    }, [loggedExercises]);

    const handleSaveWorkoutSession = () => {
        if (loggedExercises.length === 0 || sessionMetrics.totalSets === 0) {
            addToast('Please log at least one completed set before saving.', 'error');
            return;
        }

        const memberObj = members.find(m => m.id === Number(selectedMemberId)) || members[0];
        if (!memberObj) {
            addToast('Please register a member before saving workout logs.', 'error');
            return;
        }

        const newRecord: WorkoutSessionRecord = {
            id: `wk-hist-${Date.now()}`,
            memberId: memberObj.id,
            memberName: memberObj.name,
            routineName: sessionRoutineName.trim() || 'Custom Strength Session',
            focus: sessionFocus,
            date: sessionDate,
            durationMinutes: Number(sessionDuration) || 45,
            totalVolumeKg: sessionMetrics.totalVolumeKg,
            totalSets: sessionMetrics.totalSets,
            totalReps: sessionMetrics.totalReps,
            maxWeightKg: sessionMetrics.maxWeightKg,
            notes: sessionNotes.trim(),
            exercises: loggedExercises
        };

        setWorkoutHistory(prev => [newRecord, ...prev]);

        // Also sync to DataContext detailedWorkoutLogs
        newRecord.exercises.forEach((ex, idx) => {
            addDetailedWorkoutLog({
                sessionId: `${newRecord.id}-${idx}`,
                memberId: newRecord.memberId,
                date: newRecord.date,
                exerciseName: ex.name,
                notes: newRecord.notes,
                sets: ex.sets.map(s => ({
                    setNumber: s.setNumber,
                    reps: s.reps,
                    weight: s.weightKg,
                    rpe: s.rpe || 8,
                    completed: s.completed
                }))
            });
        });

        // Best-effort Firestore sync
        syncToFirebase('workout_logs', newRecord.id, newRecord).catch(() => {});

        addToast(
            `Workout logged! Total Volume: ${newRecord.totalVolumeKg.toLocaleString()} kg across ${newRecord.totalSets} sets.`,
            'success'
        );
        setExpandedHistoryId(newRecord.id);
        setSubTab('history');
    };

    // Custom Routine Builder Handlers
    const handleAddExerciseToBuilder = () => {
        if (!builderExInput.trim()) return;
        setBuilderExercises(prev => [
            ...prev,
            {
                name: builderExInput.trim(),
                muscleGroup: builderMuscleInput,
                targetSets: Number(builderSetsInput) || 3,
                targetReps: Number(builderRepsInput) || 10,
                targetWeightKg: Number(builderWeightInput) || 40
            }
        ]);
        setBuilderExInput('');
    };

    const handleSaveCustomRoutine = (e: React.FormEvent) => {
        e.preventDefault();
        if (!builderName.trim() || builderExercises.length === 0) {
            addToast('Provide a routine name and at least one exercise.', 'error');
            return;
        }

        const newRoutine: CustomRoutine = {
            id: `routine-${Date.now()}`,
            name: builderName.trim(),
            focus: builderFocus,
            level: builderLevel,
            description: builderDesc.trim() || `Custom ${builderFocus} routine with ${builderExercises.length} exercises.`,
            exercises: builderExercises,
            createdAt: new Date().toISOString().split('T')[0]
        };

        setCustomRoutines(prev => [newRoutine, ...prev]);

        // Also add to global WorkoutTemplates so it appears in Template Cards
        addWorkoutTemplate({
            id: Date.now(),
            name: newRoutine.name,
            level: newRoutine.level,
            category: newRoutine.focus,
            description: newRoutine.description,
            priority: 'High',
            exercises: newRoutine.exercises.map(ex => ({
                name: ex.name,
                sets: String(ex.targetSets),
                reps: `${ex.targetReps} reps @ ${ex.targetWeightKg}kg`
            })),
            mainWorkout: [
                {
                    name: newRoutine.focus,
                    exercises: newRoutine.exercises.map(ex => ({
                        name: ex.name,
                        sets: String(ex.targetSets),
                        reps: `${ex.targetReps} @ ${ex.targetWeightKg}kg`
                    }))
                }
            ]
        });

        addToast(`Saved custom routine "${newRoutine.name}"!`, 'success');
        setBuilderName('');
        setBuilderDesc('');
    };

    const handleDeleteRoutine = (id: string) => {
        setCustomRoutines(prev => prev.filter(r => r.id !== id));
        addToast('Custom routine removed.', 'info');
    };

    // Filtered History & Analytics
    const filteredHistory = useMemo(() => {
        if (historyMemberFilter === 'All') return workoutHistory;
        return workoutHistory.filter(h => String(h.memberId) === historyMemberFilter || h.memberName === historyMemberFilter);
    }, [workoutHistory, historyMemberFilter]);

    const progressionChartData = useMemo(() => {
        return [...filteredHistory]
            .reverse()
            .map(item => ({
                date: item.date.slice(5),
                routine: item.routineName,
                volumeKg: item.totalVolumeKg,
                maxWeightKg: item.maxWeightKg,
                sets: item.totalSets
            }));
    }, [filteredHistory]);

    const personalRecords = useMemo(() => {
        const prMap = new Map<string, { exercise: string; maxWeight: number; repsAtMax: number; est1RM: number; date: string }>();
        filteredHistory.forEach(session => {
            session.exercises.forEach(ex => {
                ex.sets.forEach(s => {
                    if (!s.completed) return;
                    const est1RM = Math.round(s.weightKg * (1 + s.reps / 30));
                    const existing = prMap.get(ex.name);
                    if (!existing || s.weightKg > existing.maxWeight || (s.weightKg === existing.maxWeight && est1RM > existing.est1RM)) {
                        prMap.set(ex.name, {
                            exercise: ex.name,
                            maxWeight: s.weightKg,
                            repsAtMax: s.reps,
                            est1RM,
                            date: session.date
                        });
                    }
                });
            });
        });
        return Array.from(prMap.values()).sort((a, b) => b.maxWeight - a.maxWeight);
    }, [filteredHistory]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Sub-Navigation Banner */}
            <div className="bg-gradient-to-r from-gray-900 via-[#0c0c0e] to-black border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-2xl">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest mb-2">
                        <Dumbbell className="w-3.5 h-3.5" /> Custom Workout Planner & Set/Rep/Weight Logger
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">
                        Routine Builder, Live Set Logger & Progress History
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Build custom routines, log sets, reps, and weights (kg) in real time, and track strength volume progression over time.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-black/70 p-1.5 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setSubTab('logger')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                            subTab === 'logger'
                                ? 'bg-amber-500 text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Play className="w-3.5 h-3.5" /> Log Workout (Sets / Reps / Kg)
                    </button>
                    <button
                        onClick={() => setSubTab('routines')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                            subTab === 'routines'
                                ? 'bg-cyan-500 text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <Target className="w-3.5 h-3.5" /> Custom Routines ({customRoutines.length})
                    </button>
                    <button
                        onClick={() => setSubTab('history')}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                            subTab === 'history'
                                ? 'bg-emerald-500 text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <History className="w-3.5 h-3.5" /> Workout History & PRs ({workoutHistory.length})
                    </button>
                </div>
            </div>

            {/* SUB-TAB 1: LIVE WORKOUT SET / REP / WEIGHT LOGGER */}
            {subTab === 'logger' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Active Session & Exercise Set Logger */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Session Header Configuration */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-amber-400" /> Active Workout Session Configuration
                                    </h4>
                                    <p className="text-[11px] text-gray-500">Select a member and load any custom routine or add exercises below.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Load Routine:</span>
                                    <select
                                        onChange={e => {
                                            const found = customRoutines.find(r => r.id === e.target.value);
                                            if (found) handleLoadRoutineToLogger(found);
                                        }}
                                        defaultValue=""
                                        className="bg-black border border-amber-500/40 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold outline-none cursor-pointer"
                                    >
                                        <option value="" disabled>Choose Custom Routine...</option>
                                        {customRoutines.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Member</label>
                                    <select
                                        value={selectedMemberId}
                                        onChange={e => setSelectedMemberId(Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                                    >
                                        {members.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Routine / Session Title</label>
                                    <input
                                        type="text"
                                        value={sessionRoutineName}
                                        onChange={e => setSessionRoutineName(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                                        placeholder="e.g. Upper Push Hypertrophy"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Workout Date</label>
                                    <input
                                        type="date"
                                        value={sessionDate}
                                        onChange={e => setSessionDate(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Duration (Mins)</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={240}
                                        value={sessionDuration}
                                        onChange={e => setSessionDuration(Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-400 font-mono font-bold outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quick Add Exercise Bar */}
                        <form onSubmit={handleAddExerciseToLogger} className="bg-[#0a0a0a] border border-cyan-500/20 rounded-3xl p-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3 flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Add Exercise to Current Workout
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 items-end">
                                <div className="sm:col-span-2">
                                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Exercise Name</label>
                                    <input
                                        type="text"
                                        list="exercise-library-suggestions"
                                        value={newExName}
                                        onChange={e => setNewExName(e.target.value)}
                                        placeholder="e.g. Incline Bench Press"
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                    />
                                    <datalist id="exercise-library-suggestions">
                                        {COMMON_EXERCISES.map(ex => (
                                            <option key={ex.id} value={ex.name}>{ex.category}</option>
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Muscle</label>
                                    <select
                                        value={newExMuscle}
                                        onChange={e => setNewExMuscle(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                    >
                                        <option>Chest</option>
                                        <option>Back</option>
                                        <option>Legs</option>
                                        <option>Shoulders</option>
                                        <option>Arms</option>
                                        <option>Core</option>
                                        <option>Cardio</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Sets</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={15}
                                        value={newExSets}
                                        onChange={e => setNewExSets(Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-mono text-center outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Target Weight (kg)</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={2.5}
                                        value={newExWeight}
                                        onChange={e => setNewExWeight(Number(e.target.value))}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-amber-400 font-mono text-center outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    + Add
                                </button>
                            </div>
                        </form>

                        {/* Exercises & Individual Sets Table */}
                        <div className="space-y-4">
                            {loggedExercises.map((ex, exIndex) => {
                                const exVolume = ex.sets
                                    .filter(s => s.completed)
                                    .reduce((sum, s) => sum + (Number(s.reps) || 0) * (Number(s.weightKg) || 0), 0);

                                return (
                                    <div key={ex.id} className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 space-y-4 shadow-lg">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-xs flex items-center justify-center">
                                                    {exIndex + 1}
                                                </span>
                                                <div>
                                                    <h5 className="text-sm font-black text-white uppercase tracking-tight">{ex.name}</h5>
                                                    <span className="text-[10px] font-mono text-cyan-400 uppercase">{ex.muscleGroup} • Volume: {exVolume.toLocaleString()} kg</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddSetToExercise(ex.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                                >
                                                    + Add Set
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExerciseFromLogger(ex.id)}
                                                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                                                    title="Remove Exercise"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="text-[9px] font-black uppercase tracking-widest text-gray-500 border-b border-white/5">
                                                        <th className="py-2 px-3">Set</th>
                                                        <th className="py-2 px-3">Weight (kg)</th>
                                                        <th className="py-2 px-3">Reps</th>
                                                        <th className="py-2 px-3">Est. 1RM</th>
                                                        <th className="py-2 px-3 text-center">Done</th>
                                                        <th className="py-2 px-3 text-right">Remove</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-xs">
                                                    {ex.sets.map((setItem, sIdx) => {
                                                        const est1RM = Math.round((Number(setItem.weightKg) || 0) * (1 + (Number(setItem.reps) || 0) / 30));
                                                        return (
                                                            <tr key={sIdx} className={setItem.completed ? 'bg-emerald-500/[0.03]' : 'opacity-60'}>
                                                                <td className="py-2.5 px-3 font-mono font-bold text-gray-400">#{setItem.setNumber}</td>
                                                                <td className="py-2.5 px-3">
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        step={0.5}
                                                                        value={setItem.weightKg}
                                                                        onChange={e => handleUpdateSet(ex.id, sIdx, 'weightKg', Number(e.target.value))}
                                                                        className="w-24 bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-amber-400 font-mono font-bold text-xs outline-none focus:border-amber-500"
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-3">
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        max={100}
                                                                        value={setItem.reps}
                                                                        onChange={e => handleUpdateSet(ex.id, sIdx, 'reps', Number(e.target.value))}
                                                                        className="w-20 bg-black border border-white/15 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-xs outline-none focus:border-amber-500"
                                                                    />
                                                                </td>
                                                                <td className="py-2.5 px-3 font-mono text-gray-400">
                                                                    {est1RM} kg
                                                                </td>
                                                                <td className="py-2.5 px-3 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUpdateSet(ex.id, sIdx, 'completed', !setItem.completed)}
                                                                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center border transition-all cursor-pointer ${
                                                                            setItem.completed
                                                                                ? 'bg-emerald-500 text-black border-emerald-400'
                                                                                : 'bg-black text-gray-600 border-white/15'
                                                                        }`}
                                                                    >
                                                                        <Check className="w-4 h-4 stroke-[3]" />
                                                                    </button>
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveSetFromExercise(ex.id, sIdx)}
                                                                        className="text-gray-600 hover:text-rose-400 p-1 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Live Session Summary & Complete Button */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-b from-gray-900 to-[#0a0a0a] border border-amber-500/30 rounded-3xl p-6 sticky top-24 space-y-6 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Live Telemetry</span>
                                    <h4 className="text-xl font-black text-white uppercase italic">Session Summary</h4>
                                </div>
                                <Trophy className="w-8 h-8 text-amber-400" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/60 border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Total Volume</p>
                                    <p className="text-2xl font-black text-amber-400 font-mono mt-1">
                                        {sessionMetrics.totalVolumeKg.toLocaleString()} <span className="text-xs">kg</span>
                                    </p>
                                </div>
                                <div className="bg-black/60 border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Completed Sets</p>
                                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                                        {sessionMetrics.totalSets}
                                    </p>
                                </div>
                                <div className="bg-black/60 border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Total Reps</p>
                                    <p className="text-2xl font-black text-white font-mono mt-1">
                                        {sessionMetrics.totalReps}
                                    </p>
                                </div>
                                <div className="bg-black/60 border border-white/10 p-4 rounded-2xl">
                                    <p className="text-[9px] text-gray-400 uppercase font-bold">Peak Load</p>
                                    <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
                                        {sessionMetrics.maxWeightKg} <span className="text-xs">kg</span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">Workout Notes / PR Highlights</label>
                                <textarea
                                    value={sessionNotes}
                                    onChange={e => setSessionNotes(e.target.value)}
                                    placeholder="Record how the session felt, form cues, or personal records..."
                                    className="w-full bg-black border border-white/10 rounded-2xl p-3 text-xs text-white outline-none focus:border-amber-500 h-24 resize-none"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSaveWorkoutSession}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all cursor-pointer"
                            >
                                <Save className="w-4 h-4" /> Complete & Save Workout Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUB-TAB 2: CUSTOM WORKOUT ROUTINE BUILDER */}
            {subTab === 'routines' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left Column: Create New Custom Routine Form */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-4 h-fit">
                        <div className="border-b border-white/10 pb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Routine Architect</span>
                            <h4 className="text-lg font-black text-white uppercase italic">Create Custom Routine</h4>
                        </div>

                        <form onSubmit={handleSaveCustomRoutine} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Routine Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={builderName}
                                    onChange={e => setBuilderName(e.target.value)}
                                    placeholder="e.g. Hypertrophy Upper Split"
                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Target Focus</label>
                                    <input
                                        type="text"
                                        value={builderFocus}
                                        onChange={e => setBuilderFocus(e.target.value)}
                                        placeholder="e.g. Chest & Back"
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Difficulty</label>
                                    <select
                                        value={builderLevel}
                                        onChange={e => setBuilderLevel(e.target.value as any)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Description</label>
                                <textarea
                                    value={builderDesc}
                                    onChange={e => setBuilderDesc(e.target.value)}
                                    placeholder="Describe progression goals and rest intervals..."
                                    className="w-full bg-black border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-500 h-16 resize-none"
                                />
                            </div>

                            {/* Add Exercise to Routine Builder */}
                            <div className="p-3.5 rounded-2xl bg-black/70 border border-white/10 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Add Exercise to Routine</p>
                                <input
                                    type="text"
                                    list="exercise-library-suggestions"
                                    value={builderExInput}
                                    onChange={e => setBuilderExInput(e.target.value)}
                                    placeholder="Exercise name (e.g. Romanian Deadlift)"
                                    className="w-full bg-gray-900 border border-white/10 rounded-xl p-2.5 text-xs text-white font-bold outline-none"
                                />
                                <div className="grid grid-cols-4 gap-2">
                                    <select
                                        value={builderMuscleInput}
                                        onChange={e => setBuilderMuscleInput(e.target.value)}
                                        className="bg-gray-900 border border-white/10 rounded-lg p-2 text-[11px] text-white font-bold outline-none"
                                    >
                                        <option>Chest</option>
                                        <option>Back</option>
                                        <option>Legs</option>
                                        <option>Shoulders</option>
                                        <option>Arms</option>
                                        <option>Core</option>
                                    </select>
                                    <input
                                        type="number"
                                        min={1}
                                        value={builderSetsInput}
                                        onChange={e => setBuilderSetsInput(Number(e.target.value))}
                                        placeholder="Sets"
                                        className="bg-gray-900 border border-white/10 rounded-lg p-2 text-[11px] text-white font-mono text-center outline-none"
                                        title="Target Sets"
                                    />
                                    <input
                                        type="number"
                                        min={1}
                                        value={builderRepsInput}
                                        onChange={e => setBuilderRepsInput(Number(e.target.value))}
                                        placeholder="Reps"
                                        className="bg-gray-900 border border-white/10 rounded-lg p-2 text-[11px] text-white font-mono text-center outline-none"
                                        title="Target Reps"
                                    />
                                    <input
                                        type="number"
                                        min={0}
                                        step={2.5}
                                        value={builderWeightInput}
                                        onChange={e => setBuilderWeightInput(Number(e.target.value))}
                                        placeholder="Kg"
                                        className="bg-gray-900 border border-white/10 rounded-lg p-2 text-[11px] text-amber-400 font-mono text-center outline-none"
                                        title="Target Weight (kg)"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddExerciseToBuilder}
                                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                                >
                                    + Add Exercise to Routine List
                                </button>
                            </div>

                            {/* Exercises in Builder */}
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {builderExercises.map((ex, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                                        <div>
                                            <p className="font-bold text-white">{idx + 1}. {ex.name}</p>
                                            <p className="text-[10px] font-mono text-gray-400">
                                                {ex.muscleGroup} • {ex.targetSets} sets × {ex.targetReps} reps @ {ex.targetWeightKg} kg
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setBuilderExercises(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-widest text-xs shadow-lg transition-all cursor-pointer"
                            >
                                Save Custom Workout Routine
                            </button>
                        </form>
                    </div>

                    {/* Right 2 Columns: Saved Custom Routines Grid */}
                    <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {customRoutines.map(routine => {
                            const estVolume = routine.exercises.reduce(
                                (sum, ex) => sum + ex.targetSets * ex.targetReps * ex.targetWeightKg,
                                0
                            );
                            return (
                                <div key={routine.id} className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-cyan-500/40 transition-all shadow-xl">
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-black uppercase">
                                                {routine.focus}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-gray-500 uppercase">{routine.level}</span>
                                                <button
                                                    onClick={() => handleDeleteRoutine(routine.id)}
                                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                                                    title="Delete Routine"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <h4 className="text-xl font-black text-white uppercase italic tracking-tight">{routine.name}</h4>
                                        <p className="text-xs text-gray-400 mt-1 mb-4">{routine.description}</p>

                                        <div className="space-y-2 border-t border-white/10 pt-3">
                                            {routine.exercises.map((ex, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs bg-black/50 px-3 py-2 rounded-xl border border-white/5">
                                                    <span className="font-bold text-gray-200">{ex.name}</span>
                                                    <span className="font-mono text-[11px] text-amber-400">
                                                        {ex.targetSets} × {ex.targetReps} @ {ex.targetWeightKg}kg
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase font-bold">Target Volume</p>
                                            <p className="text-sm font-black text-white font-mono">{estVolume.toLocaleString()} kg</p>
                                        </div>
                                        <button
                                            onClick={() => handleLoadRoutineToLogger(routine)}
                                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <Play className="w-3.5 h-3.5" /> Start & Log Routine
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SUB-TAB 3: WORKOUT HISTORY & PROGRESS ANALYTICS */}
            {subTab === 'history' && (
                <div className="space-y-6">
                    {/* Member Filter & Overview KPIs */}
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h4 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-emerald-400" /> Progressive Overload & Workout History
                            </h4>
                            <p className="text-xs text-gray-400">Track cumulative volume lifted, peak weights, and completed workout logs over time.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Filter by Member:</span>
                            <select
                                value={historyMemberFilter}
                                onChange={e => setHistoryMemberFilter(e.target.value)}
                                className="bg-black border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none focus:border-emerald-500"
                            >
                                <option value="All">All Members ({workoutHistory.length} Sessions)</option>
                                {members.map(m => (
                                    <option key={m.id} value={String(m.id)}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Volume & Max Load Progression Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Volume Progression</span>
                                    <h5 className="text-lg font-black text-white uppercase">Total Session Volume (kg) Over Time</h5>
                                </div>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={progressionChartData}>
                                        <defs>
                                            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                        <XAxis dataKey="date" stroke="#666" fontSize={11} />
                                        <YAxis stroke="#666" fontSize={11} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '12px' }}
                                        />
                                        <Area type="monotone" dataKey="volumeKg" name="Volume (kg)" stroke="#f59e0b" strokeWidth={3} fill="url(#volGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Personal Records Leaderboard */}
                        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Strength Milestones</span>
                                <h5 className="text-lg font-black text-white uppercase flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-400" /> Personal Records (PRs)
                                </h5>
                            </div>
                            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                {personalRecords.map((pr, i) => (
                                    <div key={i} className="p-3 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-white">{pr.exercise}</p>
                                            <p className="text-[10px] text-gray-500 font-mono">Est. 1RM: {pr.est1RM} kg • {pr.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-black text-xs">
                                                {pr.maxWeight} kg × {pr.repsAtMax}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chronological Workout Session Logs */}
                    <div className="space-y-4">
                        {filteredHistory.map(session => {
                            const isExpanded = expandedHistoryId === session.id;
                            return (
                                <div key={session.id} className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-lg">
                                    <div
                                        onClick={() => setExpandedHistoryId(isExpanded ? null : session.id)}
                                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                                                <Dumbbell className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h5 className="text-base font-black text-white uppercase">{session.routineName}</h5>
                                                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-black uppercase">
                                                        {session.memberName}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 font-mono mt-0.5">
                                                    {session.date} • {session.durationMinutes} mins • {session.exercises.length} Exercises
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Total Volume</p>
                                                <p className="text-lg font-black text-amber-400 font-mono">{session.totalVolumeKg.toLocaleString()} kg</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">Completed</p>
                                                <p className="text-lg font-black text-emerald-400 font-mono">{session.totalSets} Sets</p>
                                            </div>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-5 pt-0 border-t border-white/5 bg-black/40 space-y-4">
                                            {session.notes && (
                                                <p className="text-xs text-gray-300 italic bg-white/5 p-3 rounded-xl border border-white/5 mt-3">
                                                    "{session.notes}"
                                                </p>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                                {session.exercises.map(ex => (
                                                    <div key={ex.id} className="p-4 rounded-2xl bg-black border border-white/10 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-black text-white text-xs uppercase">{ex.name}</span>
                                                            <span className="text-[10px] font-mono text-cyan-400">{ex.muscleGroup}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {ex.sets.map((s, idx) => (
                                                                <div key={idx} className="flex items-center justify-between text-xs font-mono text-gray-300 bg-white/[0.02] px-2.5 py-1 rounded-lg">
                                                                    <span>Set #{s.setNumber}</span>
                                                                    <span className="text-amber-400 font-bold">{s.weightKg} kg × {s.reps} reps</span>
                                                                    <span className="text-emerald-400 text-[10px]">{s.completed ? '✓ Done' : 'Skipped'}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkoutPlannerTracker;
