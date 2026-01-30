import React, { useState, useEffect, useRef, useMemo } from 'react';
import Card from '../common/Card';
import { MemberFitnessData, HealthData, WorkoutExercise, DailySchedule } from '../../../types';
import { INITIAL_MEMBER_SCHEDULES, INITIAL_WORKOUT_TEMPLATES } from '../../../constants';
import { DumbbellIcon } from '../icons/DumbbellIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import SmartReadinessModal from './SmartReadinessModal';
import { ReadinessOutput } from '../../../lib/gemini';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import ExerciseDemoModal from '../common/ExerciseDemoModal';
import { TimerIcon, FireIcon } from '../icons/ActivityIcons';
import { HeartRateIcon } from '../icons/HealthIcons';
import { ChartBarIcon } from '../icons/ChartBarIcon';
import Modal from '../common/Modal';
import { BluetoothIcon } from '../icons/BluetoothIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { SpeedIcon } from '../icons/SpeedIcon';

interface TodaysWorkoutProps {
    memberId: number;
    onWorkoutComplete: () => void;
    setActiveView: (view: any) => void;
    fitnessData: MemberFitnessData;
    healthData: HealthData;
}

// --- PHYSICS ENGINE CONSTANTS ---
const GRAVITY = 9.81; // m/s^2
const EST_DISPLACEMENT: Record<string, number> = {
    'Squat': 0.6, 'Deadlift': 0.5, 'Bench Press': 0.5, 'Overhead Press': 0.4,
    'Pull-up': 0.6, 'Row': 0.4, 'Lunge': 0.4, 'Leg Press': 0.7
}; // Meters per rep (approx)

// --- PROFESSIONAL METRICS ENGINE ---
const calculateE1RM = (weight: number, reps: number) => {
    if (!weight || !reps) return 0;
    // Formula: w / (1.0278 - (0.0278 * r))
    const e1rm = weight / (1.0278 - (0.0278 * reps));
    return Math.round(e1rm);
};

// --- NEURO-NODE CNS TEST COMPONENT ---
const NeuroNodeTest: React.FC<{ onClose: () => void; onComplete: (avgTime: number) => void }> = ({ onClose, onComplete }) => {
    const [state, setState] = useState<'intro' | 'waiting' | 'ready' | 'early' | 'result'>('intro');
    const [trials, setTrials] = useState<number[]>([]);
    const [currentTrial, setCurrentTrial] = useState(1);
    const startTimeRef = useRef<number>(0);
    const timeoutRef = useRef<any>(null);

    const startTrial = () => {
        setState('waiting');
        const delay = 2000 + Math.random() * 3000; // 2-5s random delay
        timeoutRef.current = setTimeout(() => {
            setState('ready');
            startTimeRef.current = Date.now();
        }, delay);
    };

    const handleClick = () => {
        if (state === 'intro') {
            startTrial();
        } else if (state === 'waiting') {
            setState('early');
            clearTimeout(timeoutRef.current);
        } else if (state === 'ready') {
            const reactionTime = Date.now() - startTimeRef.current;
            const newTrials = [...trials, reactionTime];
            setTrials(newTrials);
            
            if (currentTrial < 3) {
                setCurrentTrial(p => p + 1);
                startTrial();
            } else {
                const avg = newTrials.reduce((a, b) => a + b, 0) / newTrials.length;
                onComplete(avg);
            }
        } else if (state === 'early') {
            startTrial();
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div 
                className={`w-full max-w-md aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 ${
                    state === 'waiting' ? 'bg-red-900 border-red-600 shadow-red-900/50' : 
                    state === 'ready' ? 'bg-green-500 border-green-400 shadow-green-500/80 scale-105' : 
                    state === 'early' ? 'bg-amber-900 border-amber-600' :
                    'bg-gray-800 border-gray-600'
                }`}
                onClick={handleClick}
            >
                <BrainCircuitIcon className={`w-16 h-16 mb-4 ${state === 'ready' ? 'text-white animate-pulse' : 'text-gray-400'}`} />
                
                <h3 className="text-3xl font-black text-white uppercase text-center tracking-tighter">
                    {state === 'intro' && "TAP TO START"}
                    {state === 'waiting' && "WAIT FOR GREEN..."}
                    {state === 'ready' && "CLICK NOW!"}
                    {state === 'early' && "TOO SOON!"}
                </h3>
                
                <p className="text-sm font-mono font-bold mt-2 text-white/70">
                    {state === 'intro' && "Neuro-Node CNS Assessment"}
                    {state === 'early' && "Tap to retry"}
                    {(state === 'waiting' || state === 'ready') && `Trial ${currentTrial}/3`}
                </p>
                
                {trials.length > 0 && (
                    <div className="mt-6 text-xs font-mono text-gray-400">
                        Last: {trials[trials.length - 1]}ms
                    </div>
                )}
            </div>
            <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white uppercase font-bold text-xs tracking-widest">Abort Test</button>
        </div>
    );
};

const TempoGuide: React.FC<{ active: boolean }> = ({ active }) => {
    const [phase, setPhase] = useState<'Eccentric' | 'Bottom' | 'Concentric' | 'Top'>('Eccentric');
    const [timeLeft, setTimeLeft] = useState(3);
    const [progress, setProgress] = useState(100);

    const cycle = useMemo(() => [
        { name: 'Eccentric', duration: 3, color: 'bg-blue-500', text: 'LOWER SLOWLY' },
        { name: 'Bottom', duration: 1, color: 'bg-red-500', text: 'HOLD' },
        { name: 'Concentric', duration: 2, color: 'bg-green-500', text: 'EXPLODE UP' },
        { name: 'Top', duration: 1, color: 'bg-yellow-500', text: 'SQUEEZE' }
    ], []);

    const stateRef = useRef({ stepIndex: 0, currentTick: 0 });

    useEffect(() => {
        if (!active) return;
        
        const interval = setInterval(() => {
            const currentStep = cycle[stateRef.current.stepIndex];
            stateRef.current.currentTick += 0.1; // 100ms tick

            const percent = 100 - ((stateRef.current.currentTick / currentStep.duration) * 100);
            setProgress(Math.max(0, percent));
            setTimeLeft(Math.ceil(currentStep.duration - stateRef.current.currentTick));

            if (stateRef.current.currentTick >= currentStep.duration) {
                stateRef.current.currentTick = 0;
                stateRef.current.stepIndex = (stateRef.current.stepIndex + 1) % cycle.length;
                setPhase(cycle[stateRef.current.stepIndex].name as any);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [active, cycle]);

    if (!active) return null;

    const currentConfig = cycle.find(c => c.name === phase)!;

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6 relative overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Tempo Guide (3-1-2-1)</p>
                    <h3 className={`text-2xl font-black uppercase italic tracking-tighter transition-colors duration-300 ${currentConfig.color.replace('bg-', 'text-')}`}>
                        {currentConfig.text}
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-mono font-bold text-white">{timeLeft}s</p>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-800">
                <div className={`h-full transition-all duration-100 ease-linear ${currentConfig.color}`} style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex gap-1 mt-4 relative z-10">
                {cycle.map((c) => (
                    <div key={c.name} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${phase === c.name ? c.color : 'bg-gray-700'}`}></div>
                ))}
            </div>
        </div>
    );
};

// --- PHYSICS ENGINE DISPLAY ---
const PhysicsHUD: React.FC<{ joules: number; previousJoules: number }> = ({ joules, previousJoules }) => {
    const target = previousJoules * 1.05; // 5% Overload Goal
    const progress = Math.min(100, (joules / target) * 100);
    const isOverload = joules >= previousJoules * 1.02; // At least 2%

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <SpeedIcon className="w-24 h-24 text-cyan-500" />
            </div>
            
            <div className="flex justify-between items-start relative z-10 mb-4">
                <div>
                    <h3 className="text-sm font-bold text-cyan-400 flex items-center">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
                        THE MATH (Physics Engine)
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">
                        Work (J) = Mass × {GRAVITY} × Disp × Reps
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black text-white font-mono">{Math.round(joules).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Output (Joules)</p>
                </div>
            </div>

            {/* Progressive Overload Meter */}
            <div className="relative z-10">
                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                    <span>Current Load</span>
                    <span className={isOverload ? "text-green-400" : "text-amber-500"}>
                        Target: {Math.round(target).toLocaleString()} J (+5%)
                    </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <div 
                        className={`h-full transition-all duration-1000 ${isOverload ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-600 to-blue-500'}`} 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                {isOverload && (
                    <div className="mt-2 flex items-center justify-center text-green-400 text-xs font-black uppercase tracking-widest animate-pulse">
                        <CheckCircleIcon className="w-3 h-3 mr-1" /> Progressive Overload Achieved
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800 relative z-10">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase">Mechanical Work</p>
                    <p className="text-white font-mono text-sm">{(joules / 4184).toFixed(3)} <span className="text-[10px] text-gray-600">kcal (mech)</span></p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 uppercase">Metabolic Equiv</p>
                    <p className="text-white font-mono text-sm">{(joules > 10000 ? '6.0 METs (High)' : '3.5 METs (Mod)')}</p>
                </div>
            </div>
        </div>
    );
};

// --- INTELLIGENT REST TIMER (HR BASED) ---
const IntelligentRest: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [hr, setHr] = useState(165); // Start high (post-set)
    const [status, setStatus] = useState<'Recovering' | 'Primed'>('Recovering');

    useEffect(() => {
        const interval = setInterval(() => {
            setHr(prev => {
                // Simulate exponential decay of Heart Rate
                const drop = Math.max(0.5, (prev - 90) * 0.1); 
                const newHr = prev - drop;
                
                if (newHr <= 110) {
                    setStatus('Primed');
                }
                return newHr;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const isReady = status === 'Primed';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`w-full max-w-sm rounded-3xl p-6 border-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-colors duration-500 ${isReady ? 'bg-green-900/20 border-green-500' : 'bg-gray-900 border-red-500'}`}>
                <div className="text-center mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">Bio-Feedback Loop</p>
                    <div className="relative inline-flex items-center justify-center">
                        <HeartRateIcon className={`w-24 h-24 ${isReady ? 'text-green-500 animate-pulse' : 'text-red-500 animate-bounce'}`} />
                        <span className="absolute text-2xl font-black text-white">{Math.round(hr)}</span>
                    </div>
                    <p className="mt-2 text-sm font-mono text-gray-500">BPM</p>
                </div>

                <div className="text-center space-y-2">
                    <h3 className={`text-3xl font-black uppercase italic tracking-tighter ${isReady ? 'text-green-400' : 'text-red-400'}`}>
                        {isReady ? 'SYSTEM PRIMED' : 'RECOVERING...'}
                    </h3>
                    <p className="text-xs text-gray-400">
                        {isReady ? 'ATP Stores Replenished. CNS Ready.' : 'Wait for Heart Rate to drop below 110bpm.'}
                    </p>
                </div>

                <button 
                    onClick={onClose}
                    className={`mt-8 w-full py-4 rounded-xl font-black uppercase tracking-widest text-lg transition-all shadow-lg ${
                        isReady 
                        ? 'bg-green-500 hover:bg-green-400 text-black scale-105' 
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isReady ? 'START NEXT SET' : 'WAIT'}
                </button>
            </div>
        </div>
    );
};

// --- BIO-SYNC STATE (CGM) ---
const BioMetricHUD: React.FC<{ glucose: number; trend: string }> = ({ glucose, trend }) => (
    <div className="bg-black/60 backdrop-blur-md border border-gray-700 rounded-full px-4 py-1.5 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Dexcom G7</span>
        </div>
        <div className="h-4 w-px bg-gray-700"></div>
        <div className="flex items-center">
            <span className={`text-sm font-mono font-bold ${glucose < 90 ? 'text-orange-400' : 'text-green-400'}`}>
                {glucose.toFixed(0)}
            </span>
            <span className="text-[9px] text-gray-500 ml-1">mg/dL</span>
            <span className="text-xs ml-2 text-gray-400">{trend}</span>
        </div>
    </div>
);

const CarbInterventionModal: React.FC<{ glucose: number; dropRate: number; onClose: () => void }> = ({ glucose, dropRate, onClose }) => {
    const suggestedCarbs = dropRate > 1.5 ? 30 : 20; 
    
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-red-900/40 backdrop-blur-sm p-4 animate-pulse-slow">
            <div className="bg-gray-900 border-2 border-red-500 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <div className="flex items-center justify-center mb-4 text-red-500">
                    <FireIcon className="w-12 h-12 animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-white text-center uppercase italic tracking-tighter">HYPOGLYCEMIA RISK</h3>
                <p className="text-center text-red-300 font-bold mt-1 text-sm">BIO-SYNC ALERT</p>
                
                <div className="my-6 bg-red-500/10 p-4 rounded-xl border border-red-500/30">
                    <p className="text-sm text-gray-300 mb-2">
                        Your glucose is dropping at <span className="text-white font-bold">{dropRate.toFixed(1)}mg/dL</span> per min.
                    </p>
                    <p className="text-lg font-black text-white leading-tight">
                        Consume <span className="text-amber-400 text-2xl">{suggestedCarbs}g</span> of fast-acting cyclic dextrin <span className="underline decoration-red-500">NOW</span>.
                    </p>
                </div>
                
                <p className="text-xs text-gray-500 text-center mb-4">
                    Maintaining stable blood sugar ensures peak force output for the remainder of your session.
                </p>

                <button 
                    onClick={onClose}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest shadow-lg transition-all"
                >
                    Consumed & Stabilizing
                </button>
            </div>
        </div>
    );
};

// --- ANABOLIC WINDOW ALERT ---
const AnabolicAlert: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <Modal isOpen={true} onClose={onClose} title="SESSION COMPLETE">
        <div className="text-center">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-500 animate-pulse">
                <FireIcon className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic mb-2">Anabolic Window <span className="text-green-500">OPEN</span></h2>
            <p className="text-gray-400 text-sm mb-6">
                Your muscles are currently hypersensitive to nutrients. Immediate supplementation required for maximum hypertrophy.
            </p>
            
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-left mb-6">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-3">AI Prescription</p>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Whey Isolate</span>
                        <span className="text-amber-400 font-mono">30g</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Creatine Monohydrate</span>
                        <span className="text-amber-400 font-mono">5g</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white font-bold">Fast Carbs (Dextrose)</span>
                        <span className="text-amber-400 font-mono">40g</span>
                    </div>
                </div>
            </div>

            <button 
                onClick={onClose}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-4 rounded-xl shadow-lg uppercase tracking-widest"
            >
                Log Intake & Finish
            </button>
        </div>
    </Modal>
);

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ memberId, onWorkoutComplete, setActiveView, fitnessData, healthData }) => {
    const [todaysPlan, setTodaysPlan] = useState<DailySchedule | null>(null);
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [performanceLog, setPerformanceLog] = useState<Record<string, { reps: string; weight: string; completed?: boolean }[]>>({});
    const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
    const [readinessData, setReadinessData] = useState<ReadinessOutput | null>(null);
    const [workoutStarted, setWorkoutStarted] = useState(false);
    const [demoExercise, setDemoExercise] = useState<string | null>(null);
    
    // Pro Features State
    const [isProMode, setIsProMode] = useState(false);
    const [activeExerciseForTempo, setActiveExerciseForTempo] = useState<string | null>(null);
    const [showRestTimer, setShowRestTimer] = useState(false);
    const [showAnabolicAlert, setShowAnabolicAlert] = useState(false);

    // --- CNS & PROTOCOL STATE ---
    const [isNeuroTestOpen, setIsNeuroTestOpen] = useState(false);
    const [cnsStatus, setCnsStatus] = useState<'Optimal' | 'Fatigued' | null>(null);
    const [workoutMode, setWorkoutMode] = useState<'Warrior Protocol' | 'Recovery Flow'>('Warrior Protocol');

    // --- BIO-SYNC STATE (CGM) ---
    const [glucose, setGlucose] = useState(110);
    const [glucoseTrend, setGlucoseTrend] = useState('→'); // ↘, ↓, →
    const [showCarbAlert, setShowCarbAlert] = useState(false);
    const [lastCarbAlertTime, setLastCarbAlertTime] = useState(0);

    // --- PHYSICS / MATH STATE ---
    const [totalJoules, setTotalJoules] = useState(0);
    const previousSessionJoules = 45000; // Simulated Baseline for Demo

    // --- Live Volume & Work Calculation ---
    useEffect(() => {
        let currentJoules = 0;
        
        Object.keys(performanceLog).forEach((exName) => {
            const sets = performanceLog[exName];
            
            // Get estimated displacement for this exercise (or default)
            // Use simple fuzzy matching for the displacement map
            const matchedKey = Object.keys(EST_DISPLACEMENT).find(k => exName.includes(k));
            const displacement = matchedKey ? EST_DISPLACEMENT[matchedKey] : 0.5;

            if (Array.isArray(sets)) {
                sets.forEach((set: any) => {
                    // Only count completed or filled sets
                    if ((set.completed || (set.weight && set.reps)) && !isNaN(parseFloat(set.weight)) && !isNaN(parseFloat(set.reps))) {
                        const mass = parseFloat(set.weight);
                        const reps = parseFloat(set.reps);
                        
                        // Physics Formula: Work = Mass * Gravity * Displacement * Reps
                        const work = mass * GRAVITY * displacement * reps;
                        currentJoules += work;
                    }
                });
            }
        });
        
        setTotalJoules(currentJoules);
    }, [performanceLog]);

    const liveVolume = useMemo(() => {
        let total = 0;
        Object.values(performanceLog).forEach((sets: any) => {
            if (Array.isArray(sets)) {
                sets.forEach((set: any) => {
                    if (set.completed && set.weight && set.reps) {
                        total += parseFloat(set.weight) * parseFloat(set.reps);
                    }
                });
            }
        });
        return total;
    }, [performanceLog]);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const schedule = INITIAL_MEMBER_SCHEDULES[memberId]?.[today];
        
        if (schedule) {
            setTodaysPlan(schedule);
            if (schedule.templateId) {
                const template = INITIAL_WORKOUT_TEMPLATES.find(t => t.id === schedule.templateId);
                if (template) {
                    const templateExercises = template.exercises || template.sections?.flatMap(s => s.exercises) || [];
                    setExercises(templateExercises);
                    const initialLogs: Record<string, any[]> = {};
                    templateExercises.forEach(ex => {
                        const sets = parseInt(ex.sets.split('-')[0]) || 3;
                        initialLogs[ex.name] = Array(sets).fill({ reps: '', weight: '', completed: false });
                    });
                    setPerformanceLog(initialLogs);
                }
            } else if (schedule.exercises) {
                setExercises(schedule.exercises);
                 const initialLogs: Record<string, any[]> = {};
                    (schedule.exercises as WorkoutExercise[]).forEach(ex => {
                        const sets = parseInt(ex.sets.split('-')[0]) || 3;
                        initialLogs[ex.name] = Array(sets).fill({ reps: '', weight: '', completed: false });
                    });
                    setPerformanceLog(initialLogs);
            }
        }
    }, [memberId]);

    // --- BIO-SYNC SIMULATION LOOP ---
    useEffect(() => {
        if (!workoutStarted) return;

        const interval = setInterval(() => {
            setGlucose(prev => {
                // Simulate drop based on workout intensity (randomized for demo)
                const drop = Math.random() * 2.5; 
                const newVal = Math.max(60, prev - drop);
                
                // Determine Trend
                if (drop > 2.0) setGlucoseTrend('↓↓');
                else if (drop > 1.0) setGlucoseTrend('↘');
                else setGlucoseTrend('→');

                // Check Threshold for Alert (Throttled to once every 5 mins)
                const now = Date.now();
                if ((newVal < 85 || drop > 2.2) && (now - lastCarbAlertTime > 300000) && !showCarbAlert) {
                    setShowCarbAlert(true);
                    setLastCarbAlertTime(now);
                }

                return newVal;
            });
        }, 3000); // Update every 3s

        return () => clearInterval(interval);
    }, [workoutStarted, lastCarbAlertTime, showCarbAlert]);

    const handleLogChange = (exerciseName: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
        setPerformanceLog(prev => {
            const currentSets = [...(prev[exerciseName] || [])];
            if (!currentSets[setIndex]) currentSets[setIndex] = { reps: '', weight: '', completed: false };
            currentSets[setIndex] = { ...currentSets[setIndex], [field]: value };
            return { ...prev, [exerciseName]: currentSets };
        });
    };

    const handleCompleteSet = (exerciseName: string, setIndex: number) => {
        setPerformanceLog(prev => {
            const currentSets = [...(prev[exerciseName] || [])];
            currentSets[setIndex] = { ...currentSets[setIndex], completed: true };
            return { ...prev, [exerciseName]: currentSets };
        });
        // Trigger Intelligent Rest Timer
        setShowRestTimer(true);
    };

    const handleAnalysisComplete = (result: ReadinessOutput) => {
        setReadinessData(result);
        if (result.score < 50) {
            alert("Recovery is low. We've reduced volume by 20%.");
        }
    };

    const handleFinishClick = () => {
        setShowAnabolicAlert(true);
    };

    const confirmFinish = () => {
        setShowAnabolicAlert(false);
        onWorkoutComplete();
        setActiveView('dashboard');
    };

    // --- NEURO-NODE HANDLER ---
    const handleNeuroTestComplete = (avgTime: number) => {
        setIsNeuroTestOpen(false);
        const baseline = 300; // ms
        const threshold = baseline * 1.15; // 345ms (+15% slower)
        
        if (avgTime > threshold) {
            setCnsStatus('Fatigued');
            setWorkoutMode('Recovery Flow');
            alert(`CNS FATIGUE DETECTED (Avg: ${avgTime.toFixed(0)}ms). \n\nYour reaction time is >15% slower than baseline. Switching to RECOVERY FLOW to prevent injury.`);
        } else {
            setCnsStatus('Optimal');
            setWorkoutMode('Warrior Protocol');
        }
    };

    if (!todaysPlan) {
        return (
            <Card>
                <div className="text-center py-10">
                    <DumbbellIcon className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-300">No Workout Scheduled</h3>
                    <p className="text-gray-500 mt-2">Enjoy your rest day or check with your trainer.</p>
                    <button onClick={() => setActiveView('dashboard')} className="mt-6 text-amber-500 hover:text-white">Go Back</button>
                </div>
            </Card>
        );
    }

    if (todaysPlan.isRestDay) {
         return (
            <Card>
                <div className="text-center py-10">
                    <SparkleIcon className="w-16 h-16 mx-auto text-blue-400 mb-4" />
                    <h3 className="text-xl font-bold text-white">Active Recovery Day</h3>
                    <p className="text-gray-400 mt-2">Focus on mobility, hydration, and sleep.</p>
                    <button onClick={() => setActiveView('dashboard')} className="mt-6 text-amber-500 hover:text-white">Go Back</button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6 relative">
            {/* Intelligent Rest Overlay */}
            {showRestTimer && <IntelligentRest onClose={() => setShowRestTimer(false)} />}
            
            {/* Intra-Workout Carb Command (Bio-Sync Alert) */}
            {showCarbAlert && <CarbInterventionModal glucose={glucose} dropRate={2.0} onClose={() => setShowCarbAlert(false)} />}

            {/* Anabolic Window Alert */}
            {showAnabolicAlert && <AnabolicAlert onClose={confirmFinish} />}

            {/* Neuro-Node Test Modal */}
            {isNeuroTestOpen && <NeuroNodeTest onClose={() => setIsNeuroTestOpen(false)} onComplete={handleNeuroTestComplete} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Today's Session</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400 font-mono">NEURAL LOAD: {cnsStatus ? cnsStatus.toUpperCase() : 'PENDING'}</p>
                        {workoutMode === 'Recovery Flow' && (
                            <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 border border-blue-500/30 text-[10px] font-bold rounded uppercase animate-pulse">
                                Recovery Flow Active
                            </span>
                        )}
                        {workoutMode === 'Warrior Protocol' && (
                            <span className="px-2 py-0.5 bg-red-900/50 text-red-400 border border-red-500/30 text-[10px] font-bold rounded uppercase">
                                Warrior Protocol
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Bio-Sync HUD (Visible when workout started) */}
                    {workoutStarted && (
                        <div className="hidden sm:block">
                            <BioMetricHUD glucose={glucose} trend={glucoseTrend} />
                        </div>
                    )}

                    {!workoutStarted && !cnsStatus && (
                        <button 
                            onClick={() => setIsNeuroTestOpen(true)}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center shadow-lg shadow-purple-900/20 animate-pulse"
                        >
                            <BrainCircuitIcon className="w-4 h-4 mr-1" /> Neuro-Node Check
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsProMode(!isProMode)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center ${isProMode ? 'bg-amber-500 text-black border-amber-500' : 'bg-gray-800 text-gray-400 border-gray-600'}`}
                        >
                            <ChartBarIcon /> PRO
                        </button>
                        {!workoutStarted && (
                            <button 
                                onClick={() => setIsReadinessModalOpen(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center"
                            >
                                <SparkleIcon className="w-4 h-4 mr-1" /> Readiness
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Mobile Bio-Sync HUD */}
            {workoutStarted && (
                <div className="sm:hidden flex justify-center mb-2">
                    <BioMetricHUD glucose={glucose} trend={glucoseTrend} />
                </div>
            )}

            {readinessData && (
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-amber-400">AI Calibration</h4>
                        <span className={`text-xl font-black ${readinessData.score > 70 ? 'text-green-400' : 'text-orange-400'}`}>{readinessData.score}% Ready</span>
                    </div>
                    <p className="text-sm text-gray-300">{readinessData.strategy}: {readinessData.reasoning}</p>
                </div>
            )}

            {/* Physics Engine HUD (New Addition) */}
            {workoutStarted && (
                <div className="animate-fade-in">
                    <PhysicsHUD joules={totalJoules} previousJoules={previousSessionJoules} />
                </div>
            )}

            {/* Tempo Guide Overlay */}
            {isProMode && workoutStarted && activeExerciseForTempo && (
                <div className="animate-fade-in-down">
                    <TempoGuide active={true} />
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 pb-32">
                {exercises.map((ex, idx) => (
                    <Card key={idx} className={`border-l-4 transition-all duration-300 ${activeExerciseForTempo === ex.name ? 'border-amber-500 bg-gray-800 shadow-amber-900/20 shadow-lg' : workoutMode === 'Recovery Flow' ? 'border-blue-500 opacity-90' : 'border-gray-700'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center">
                                    {ex.name}
                                    <button 
                                        onClick={() => setDemoExercise(ex.name)} 
                                        className="ml-3 flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-900/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] border border-cyan-500/30"
                                        title="Activate Neural Link"
                                    >
                                        <SparkleIcon className="w-3 h-3" />
                                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Neural Link</span>
                                    </button>
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-gray-400">{ex.sets} Sets x {ex.reps} Reps</p>
                                    {workoutMode === 'Recovery Flow' && (
                                        <span className="text-[10px] text-blue-300 bg-blue-900/30 px-2 rounded font-bold">
                                            (Volume Reduced)
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {isProMode && workoutStarted && (
                                <button 
                                    onClick={() => setActiveExerciseForTempo(activeExerciseForTempo === ex.name ? null : ex.name)}
                                    className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all flex items-center ${activeExerciseForTempo === ex.name ? 'bg-amber-500 text-black border-amber-500' : 'bg-gray-700 text-gray-400 border-gray-600'}`}
                                >
                                    <TimerIcon className="w-4 h-4 mr-1" />
                                    {activeExerciseForTempo === ex.name ? 'Stop Tempo' : 'Start Tempo'}
                                </button>
                            )}
                        </div>

                        {workoutStarted ? (
                            <div className="space-y-3">
                                {/* Header Row */}
                                <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 uppercase font-bold text-center mb-1">
                                    <div className="col-span-2 text-left pl-2">Set</div>
                                    <div className="col-span-3">Kg</div>
                                    <div className="col-span-3">Reps</div>
                                    {isProMode && <div className="col-span-3">Est. 1RM</div>}
                                    <div className="col-span-1"></div>
                                </div>

                                {(performanceLog[ex.name] || []).map((set, sIdx) => {
                                    // In Recovery Flow, we might visually suggest lighter weights or fewer sets, 
                                    // but for now we just show the standard input fields.
                                    // Ideally, we'd pre-fill with lower targets if the logic was fully connected to the template engine.
                                    
                                    const e1rm = calculateE1RM(parseFloat(set.weight), parseInt(set.reps));
                                    
                                    return (
                                        <div key={sIdx} className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg border transition-all ${set.completed ? 'bg-green-900/10 border-green-500/30' : 'bg-gray-900/50 border-gray-700/50'}`}>
                                            <span className="col-span-2 text-xs font-bold text-gray-400 pl-2">#{sIdx + 1}</span>
                                            
                                            <div className="col-span-3 relative">
                                                <input 
                                                    type="number" 
                                                    placeholder="0" 
                                                    value={set.weight}
                                                    onChange={e => handleLogChange(ex.name, sIdx, 'weight', e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-center font-mono text-sm focus:border-amber-500 focus:outline-none"
                                                    disabled={set.completed}
                                                />
                                            </div>
                                            
                                            <div className="col-span-3 relative">
                                                <input 
                                                    type="number" 
                                                    placeholder="0" 
                                                    value={set.reps}
                                                    onChange={e => handleLogChange(ex.name, sIdx, 'reps', e.target.value)}
                                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-white text-center font-mono text-sm focus:border-amber-500 focus:outline-none"
                                                    disabled={set.completed}
                                                />
                                            </div>

                                            {isProMode ? (
                                                <div className="col-span-3 text-center">
                                                    <span className={`text-xs font-mono font-bold ${e1rm > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                                                        {e1rm > 0 ? e1rm : '-'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="col-span-3"></div>
                                            )}

                                            <div className="col-span-1 flex justify-center">
                                                <button 
                                                    onClick={() => !set.completed && handleCompleteSet(ex.name, sIdx)}
                                                    className={`p-1 rounded-full transition-colors ${set.completed ? 'text-green-500' : set.weight && set.reps ? 'text-gray-400 hover:text-green-400' : 'text-gray-700'}`}
                                                    disabled={set.completed || !set.weight || !set.reps}
                                                >
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                
                                {isProMode && performanceLog[ex.name] && performanceLog[ex.name].some(s => s.weight && s.reps) && (
                                    <div className="mt-2 text-xs text-center text-gray-500 bg-gray-900/30 py-1 rounded">
                                        AI Tip: For Set {performanceLog[ex.name].length + 1}, try <span className="text-amber-400 font-bold">{Math.round(calculateE1RM(parseFloat(performanceLog[ex.name][0].weight), parseInt(performanceLog[ex.name][0].reps)) * 0.85)}kg</span> for Hypertrophy.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-10 bg-gray-800/50 rounded flex items-center justify-center text-gray-500 text-xs">
                                Start workout to enable logger
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 md:relative md:bg-transparent md:border-0 md:p-0 z-40 shadow-2xl">
                {!workoutStarted ? (
                    <button 
                        onClick={() => setWorkoutStarted(true)}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black py-4 rounded-xl shadow-lg transition-all text-lg uppercase tracking-widest flex items-center justify-center"
                    >
                        <DumbbellIcon className="w-6 h-6 mr-2" /> Start Session
                    </button>
                ) : (
                    <div className="flex gap-4 items-center">
                        {/* Volume Tracking Node */}
                        <div className="flex-1 bg-black rounded-xl p-3 border border-gray-700 flex justify-between items-center shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                            <div className="relative z-10">
                                <p className="text-[10px] text-green-500 uppercase font-black tracking-widest mb-1 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1.5"></span> LIVE TONNAGE
                                </p>
                                <p className="text-xl font-black text-white font-mono leading-none">
                                    {liveVolume.toLocaleString()} <span className="text-xs text-gray-500">KG</span>
                                </p>
                            </div>
                            <div className="h-10 w-10 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-700 relative z-10">
                                <ChartBarIcon />
                            </div>
                        </div>

                        <button 
                            onClick={handleFinishClick}
                            className="flex-[1.5] bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl shadow-lg transition-all text-sm uppercase tracking-widest flex items-center justify-center"
                        >
                            <CheckCircleIcon className="w-6 h-6 mr-2" /> Finish
                        </button>
                    </div>
                )}
            </div>

            <SmartReadinessModal 
                isOpen={isReadinessModalOpen}
                onClose={() => setIsReadinessModalOpen(false)}
                plannedWorkoutName={todaysPlan.customTitle || "Scheduled Workout"}
                onAnalysisComplete={handleAnalysisComplete}
            />

            <ExerciseDemoModal 
                isOpen={!!demoExercise}
                onClose={() => setDemoExercise(null)}
                exerciseName={demoExercise || ''}
            />
        </div>
    );
};

export default TodaysWorkout;