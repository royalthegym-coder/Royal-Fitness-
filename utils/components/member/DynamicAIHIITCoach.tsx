import React, { useState, useEffect } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { DetailedWorkoutSession } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dumbbell, 
  Activity, 
  RefreshCw, 
  Zap, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Flame, 
  ChevronRight, 
  Calendar,
  Play,
  Pause,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

// Define typed HIIT Routine Interface
export interface HIITWorkoutRoutine {
  routineName: string;
  targetMuscleGroups: string[];
  restRestrictedMuscleGroups: string[];
  exercises: {
    exerciseName: string;
    durationSeconds: number;
    sets: number;
    restTimeSeconds: number;
    intensity: 'High' | 'Medium' | 'Low';
    formNotes: string;
  }[];
  coachingAdvice: string;
}

// Robust Safe AI JSON Parser Error-Boundary
export function safeAIParse(rawText: string | any): HIITWorkoutRoutine {
  // If server already parsed it to an object successfully
  if (typeof rawText === 'object' && rawText !== null) {
    return sanitizeRoutine(rawText);
  }

  try {
    const cleaned = String(rawText)
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    
    const parsed = JSON.parse(cleaned);
    return sanitizeRoutine(parsed);
  } catch (err) {
    console.warn("AI Output parsed encountered errors. Reverting to custom safe-boundary schema:", err);
    return getFallbackRoutine();
  }
}

function sanitizeRoutine(obj: any): HIITWorkoutRoutine {
  return {
    routineName: String(obj.routineName || "Synthesized Adaptive HIIT").trim(),
    targetMuscleGroups: Array.isArray(obj.targetMuscleGroups) 
      ? obj.targetMuscleGroups.map((x: any) => String(x))
      : ["Full Body Conditioning"],
    restRestrictedMuscleGroups: Array.isArray(obj.restRestrictedMuscleGroups)
      ? obj.restRestrictedMuscleGroups.map((x: any) => String(x))
      : ["Overtrained Chains"],
    exercises: Array.isArray(obj.exercises) 
      ? obj.exercises.map((ex: any) => ({
          exerciseName: String(ex.exerciseName || "Dynamic Plank Push"),
          durationSeconds: Number(ex.durationSeconds || 45),
          sets: Number(ex.sets || 3),
          restTimeSeconds: Number(ex.restTimeSeconds || 15),
          intensity: (ex.intensity === "High" || ex.intensity === "Medium" || ex.intensity === "Low") 
            ? ex.intensity  
            : "Medium",
          formNotes: String(ex.formNotes || "Exhale on force execution peak. Keep hips linear.")
        }))
      : [
          {
            exerciseName: "Dynamic Squat Thrusts",
            durationSeconds: 40,
            sets: 4,
            restTimeSeconds: 20,
            intensity: "High",
            formNotes: "Lock abdominal wall and avoid excessive lumbar hyper-extension."
          }
        ],
    coachingAdvice: String(obj.coachingAdvice || "Work at 85% Maximum Heart Rate threshold. Respect the intervals!")
  };
}

function getFallbackRoutine(): HIITWorkoutRoutine {
  return {
    routineName: "Adaptive Offline HIIT Protocol",
    targetMuscleGroups: ["Core Core Stability", "VO2 Max Endurance"],
    restRestrictedMuscleGroups: ["Hypertrophied Muscle Groups"],
    exercises: [
      {
        exerciseName: "Metabolic Squat Jumps",
        durationSeconds: 45,
        sets: 3,
        restTimeSeconds: 15,
        intensity: "High",
        formNotes: "Land in a soft athletic squat to absorb ground force and safeguard joints."
      },
      {
        exerciseName: "Cross-Body Climbers",
        durationSeconds: 40,
        sets: 4,
        restTimeSeconds: 20,
        intensity: "High",
        formNotes: "Drive knee up to opposite elbow using lower obliques."
      },
      {
        exerciseName: "Low Plank to High Plank",
        durationSeconds: 45,
        sets: 3,
        restTimeSeconds: 15,
        intensity: "Medium",
        formNotes: "Minimize hip sway while transferring support between elbows and palms."
      }
    ],
    coachingAdvice: "Calibrated default HIIT sequence designed to boost cardiovascular thresholds safely."
  };
}

export default function DynamicAIHIITCoach() {
  const { detailedWorkoutLogs, addDetailedWorkoutLog } = useDataStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [routine, setRoutine] = useState<HIITWorkoutRoutine | null>(null);
  const [errorBoundaryLog, setErrorBoundaryLog] = useState<string | null>(null);
  
  // Local interface to Process & log past workouts for extreme interactive testing
  const [newLogName, setNewLogName] = useState('Heavy Bench Press');
  const [newLogDate, setNewLogDate] = useState('2026-05-25');
  const [newLogNotes, setNewLogNotes] = useState('Focused entirely on Upper Body Chest & Triceps');

  // Timer States for generated HIIT exercises
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerMode, setTimerMode] = useState<'work' | 'rest'>('work');

  // Core automatic seeding of previous workout sessions so user always has data to train on
  useEffect(() => {
    if (detailedWorkoutLogs.length === 0) {
      // Seed past 3 days of heavy exercises to demonstrate smart muscle overtrain avoidance!
      const mockPastSessions: DetailedWorkoutSession[] = [
        {
          sessionId: 'mock-1',
          memberId: 999,
          date: '2026-05-23',
          exerciseName: 'Heavy Romanian Deadlifts',
          sets: [{ setNumber: 1, weight: 120, reps: 6, rpe: 9, completed: true }],
          notes: 'Lower back, hamstrings, and glutes completely destroyed.'
        },
        {
          sessionId: 'mock-2',
          memberId: 999,
          date: '2026-05-24',
          exerciseName: 'Heavy Bench Press & Incline Dumbbell Press',
          sets: [{ setNumber: 1, weight: 85, reps: 8, rpe: 8, completed: true }],
          notes: 'Heavy chest push load. Chest, anterior shoulders, and triceps sore.'
        },
        {
          sessionId: 'mock-3',
          memberId: 999,
          date: '2026-05-25',
          exerciseName: 'High-Rep Barbell Back Squats',
          sets: [{ setNumber: 1, weight: 100, reps: 12, rpe: 9, completed: true }],
          notes: 'Heavy quad & glute drive. Overtrained legs, high metabolic strain.'
        }
      ];
      mockPastSessions.forEach(session => addDetailedWorkoutLog(session));
    }
  }, []);

  // Filter last 3 days of detailed workout logs to display
  const past3DaysWorkouts = detailedWorkoutLogs
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Trigger Backend AI HIIT Engine call
  const generateRoutine = async () => {
    setIsGenerating(true);
    setRoutine(null);
    setErrorBoundaryLog(null);
    setActiveExerciseIndex(null);
    setIsTimerRunning(false);

    try {
      const response = await fetch('/api/ai-hiit-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          previousWorkouts: past3DaysWorkouts
        })
      });

      const resData = await response.json();
      if (resData.success && resData.workout) {
        // Run the robust safe parse error boundary logic
        const parsed = safeAIParse(resData.workout);
        setRoutine(parsed);
      } else {
        throw new Error(resData.error || 'Generative Engine timeout.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorBoundaryLog(err.message || 'Network anomaly. Fallback protocols initialized.');
      // Enforce the safe-boundary parser to output default medical recovery routine
      const fallback = safeAIParse(null);
      setRoutine(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  // Log simulation handler
  const handleAddNewLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: DetailedWorkoutSession = {
      sessionId: `custom-${Date.now()}`,
      memberId: 999,
      date: newLogDate,
      exerciseName: newLogName,
      sets: [{ setNumber: 1, weight: 70, reps: 10, rpe: 8, completed: true }],
      notes: newLogNotes
    };
    addDetailedWorkoutLog(newSession);
    setNewLogName('');
    setNewLogNotes('');
  };

  // Timer tick effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0 && activeExerciseIndex !== null && routine) {
      const currentEx = routine.exercises[activeExerciseIndex];
      // Switch work state
      if (timerMode === 'work') {
        if (currentSet < currentEx.sets) {
          // Move to rest between sets
          setTimerMode('rest');
          setTimeLeft(currentEx.restTimeSeconds);
        } else {
          // Finished all sets of this exercise, check if there is a next one
          if (activeExerciseIndex + 1 < routine.exercises.length) {
            setActiveExerciseIndex(activeExerciseIndex + 1);
            setCurrentSet(1);
            setTimerMode('work');
            setTimeLeft(routine.exercises[activeExerciseIndex + 1].durationSeconds);
          } else {
            // Completed all routine!
            setIsTimerRunning(false);
            setActiveExerciseIndex(null);
          }
        }
      } else {
        // Rest over, return to work
        setTimerMode('work');
        setCurrentSet(prev => prev + 1);
        setTimeLeft(currentEx.durationSeconds);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, activeExerciseIndex]);

  const startExerciseTimer = (index: number) => {
    if (!routine) return;
    setActiveExerciseIndex(index);
    setCurrentSet(1);
    setTimerMode('work');
    setTimeLeft(routine.exercises[index].durationSeconds);
    setIsTimerRunning(true);
  };

  return (
    <div id="ai_hiit_coach_view" className="min-h-screen bg-[#0A0D14] text-gray-100 p-4 sm:p-8 font-sans">
      {/* Upper Bio Metrics Header Banner */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1A2333] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-mono font-bold tracking-widest rounded-full uppercase">
                Hyper AI Agent Active
              </span>
              <span className="px-3 py-1 bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] text-xs font-mono font-bold tracking-widest rounded-full uppercase">
                Deep Muscle Check
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2 lowercase">
              Dynamic <span className="text-[#FF3B30] uppercase">AI HIIT</span> Coach
            </h1>
            <p id="sub_desc" className="text-gray-400 mt-2 text-sm max-w-xl">
              Calculates muscle fatigue vectors based on your past 3 days of exercise tracking inside the Zustand OS ledger, generating tailored 20-minute VO2 Max schedules to prevent overtraining.
            </p>
          </div>
          <div>
            <button
              id="generate_routine_btn"
              onClick={generateRoutine}
              disabled={isGenerating}
              className="w-full md:w-auto px-6 py-4 bg-gradient-to-r from-[#FF3B30] to-[#E60000] text-white hover:brightness-110 font-bold tracking-wide rounded-xl shadow-lg shadow-[#FF3B30]/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Analyzing Overtrain Vectors...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                  Synthesize Targeted HIIT Routine
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Ledger Logs & Modifiers (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Historical Logs List Card */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-[#222E45] pb-3">
              <Calendar className="h-5 w-5 text-[#30D158]" />
              Workout Tracker (Last 3 Days)
            </h2>
            <p className="text-xs text-gray-500 mb-4 font-mono leading-relaxed">
              These tracking logs will be analyzed by our generative model to avoid targeting sore muscle chains.
            </p>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              <AnimatePresence>
                {past3DaysWorkouts.map((log) => (
                  <motion.div
                    key={log.sessionId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 bg-[#182030] hover:bg-[#1E283C] border border-[#222E45] rounded-xl transition-all"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="font-mono text-xs text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                        {log.date}
                      </span>
                      <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                        <Dumbbell className="h-3 w-3" />
                        10 max Reps
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{log.exerciseName}</div>
                    {log.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic font-sans">
                        &quot;{log.notes}&quot;
                      </p>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Process Exercise Logger Form */}
          <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-5 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#FF375F]" />
              Inject Workout Simulator
            </h2>
            <p className="text-xs text-gray-400 mb-4">
              Manually add exercises to the database store to verify how Core AI dynamically alters today's exercises.
            </p>

            <form onSubmit={handleAddNewLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Exercise Name</label>
                <input
                  type="text"
                  required
                  value={newLogName}
                  onChange={(e) => setNewLogName(e.target.value)}
                  placeholder="e.g. Heavy Squats, Pull-Ups, Deadlifts"
                  className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF3B30] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Workout Date</label>
                  <input
                    type="date"
                    required
                    value={newLogDate}
                    onChange={(e) => setNewLogDate(e.target.value)}
                    className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF3B30] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">Intensity RPE</label>
                  <div className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-3 py-2.5 text-sm text-[#FFD60A] font-bold text-center">
                    9.5 Critical strain
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 pb-1.5">User Fatigue Notes</label>
                <textarea
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  placeholder="Describe sore muscle chains..."
                  className="w-full bg-[#182030] border border-[#222E45] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#FF3B30] transition-colors h-16 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1E283C] hover:bg-[#25324D] border border-[#2C3B59] rounded-xl font-bold text-xs tracking-wider uppercase text-[#00E5FF] transition-all flex items-center justify-center gap-2"
              >
                Log Into Store Ledger
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Output AI Card & Live Timer HUD (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Boundary Error Visual logs */}
          {errorBoundaryLog && (
            <div className="p-4 bg-orange-950/40 border border-orange-500/30 text-orange-200 rounded-xl flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs font-mono">
                <span className="font-bold tracking-wide uppercase block text-orange-400 mb-1">
                  Edge Protection Restored:
                </span>
                {errorBoundaryLog} - Output schema auto-synthesized to prevent system crash.
              </div>
            </div>
          )}

          {/* Render Main Output */}
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-[#111622] border border-[#1A2333] rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl min-h-[450px]"
              >
                <div className="relative mb-6">
                  <div className="h-16 w-16 rounded-full border-4 border-t-[#FF3B30] border-[#182030] animate-spin" />
                  <Flame className="h-7 w-7 text-[#FF3B30] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
                  Running Smart Analysis
                </h3>
                <p className="text-sm text-gray-400 max-w-sm">
                  Querying Core AI 3.5 AI flash with system bounds to parse optimal exercise selection and rest-restricted muscular chains...
                </p>
                <span className="text-xs font-mono text-gray-500 mt-4 bg-[#182030] px-3 py-1 rounded border border-[#222E45]">
                  Evaluating {past3DaysWorkouts.length} store tracks.
                </span>
              </motion.div>
            ) : routine ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Generated Card Header */}
                <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#FF3B30]/10 to-transparent rounded-bl-full pointer-events-none" />
                  
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-[#FF3B30] mb-2 uppercase">
                    <Flame className="h-4 w-4" />
                    Adaptive Routine Output
                  </div>
                  
                  <h2 className="text-2xl font-black text-white">{routine.routineName}</h2>
                  
                  {/* Rest Restrictions Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#1A2333]">
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-[#30D158] tracking-widest mb-1.5">
                        🎯 Target Chains (Avoiding Sore Muscles)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {routine.targetMuscleGroups.map((group, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs font-semibold bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20 rounded-lg">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono uppercase text-[#FF453A] tracking-widest mb-1.5">
                        🛡️ Rest-Restricted (Highly Sore / Overtrained)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {routine.restRestrictedMuscleGroups.map((group, idx) => (
                          <span key={idx} className="px-2.5 py-1 text-xs font-semibold bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20 rounded-lg">
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-[#182030] border border-[#222E45] rounded-xl flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-[#FFD60A] mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-300 leading-relaxed italic">
                      &quot;{routine.coachingAdvice}&quot;
                    </p>
                  </div>
                </div>

                {/* Exercises List / Live Timer Control */}
                <div className="bg-[#111622] border border-[#1A2333] rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#FFB800] mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Routine Map (20-MIN TOTAL VOLUME)
                  </h3>

                  {/* Visual Exercises Stack */}
                  <div className="space-y-3">
                    {routine.exercises.map((ex, idx) => {
                      const isActive = activeExerciseIndex === idx;
                      return (
                        <div 
                          key={idx}
                          className={`p-4 rounded-xl border ${
                            isActive 
                              ? 'bg-[#1D1719] border-[#FF3B30] shadow-md shadow-[#FF3B30]/10' 
                              : 'bg-[#182030]/60 border-[#222E45] hover:border-gray-700'
                          } transition-all`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-gray-500">
                                  #{idx + 1}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase tracking-wider ${
                                  ex.intensity === 'High' ? 'bg-[#FF3B30]/20 text-[#FF3B30]' : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                                }`}>
                                  {ex.intensity} Intensity
                                </span>
                              </div>
                              <h4 className="text-base font-bold text-white">{ex.exerciseName}</h4>
                              <p className="text-xs text-gray-400 mt-1">{ex.formNotes}</p>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-none border-[#222E45]">
                              <div className="text-right flex items-center gap-4">
                                <div className="text-center">
                                  <span className="block text-[9px] uppercase font-mono text-gray-500 tracking-widest">INTERVALS</span>
                                  <span className="text-sm font-bold text-white">{ex.sets}x</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-[9px] uppercase font-mono text-gray-500 tracking-widest">ACTIVE</span>
                                  <span className="text-sm font-bold text-[#30D158]">{ex.durationSeconds}s</span>
                                </div>
                                <div className="text-center">
                                  <span className="block text-[9px] uppercase font-mono text-gray-500 tracking-widest">REST</span>
                                  <span className="text-sm font-bold text-orange-400">{ex.restTimeSeconds}s</span>
                                </div>
                              </div>

                              <button
                                onClick={() => startExerciseTimer(idx)}
                                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                                  isActive 
                                    ? 'bg-[#FF3B30] text-white animate-pulse' 
                                    : 'bg-[#1E283C] hover:bg-[#FF3B30] text-gray-300 hover:text-white'
                                }`}
                              >
                                {isActive && isTimerRunning ? (
                                  <Pause className="h-4 w-4 fill-white" />
                                ) : (
                                  <Play className="h-4 w-4 fill-white translate-x-0.5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Exercise Timer HUD nested directly inside active target */}
                          {isActive && (
                            <div className="mt-4 pt-4 border-t border-[#FF3B30]/20 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#110A0B] p-3 rounded-lg border border-[#FF3B30]/30">
                              <div className="flex items-center gap-3">
                                <span className={`h-25 w-25 rounded-xl flex flex-col items-center justify-center ${
                                  timerMode === 'work' ? 'bg-[#FF3B30]/15 border border-[#FF3B30]/30' : 'bg-orange-500/15 border border-orange-500/30'
                                }`}>
                                  <span className="text-xs font-mono font-bold text-gray-400">Set</span>
                                  <span className="text-lg font-black text-white">{currentSet}/{ex.sets}</span>
                                </span>
                                <div>
                                  <div className="text-xs font-mono uppercase tracking-widest text-gray-400">
                                    {timerMode === 'work' ? '🛠️ ACTIVE BURST' : '🍊 HYDRATION REST'}
                                  </div>
                                  <div className="text-2xl font-black text-white">
                                    {timeLeft} <span className="text-xs font-sans text-gray-500">sec left</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                                  className="px-4 py-2 bg-[#FF3B30] text-white hover:brightness-110 font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1.5 transition-all"
                                >
                                  {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 translate-x-0.5" />}
                                  {isTimerRunning ? 'Pause' : 'Resume'}
                                </button>
                                <button
                                  onClick={() => setTimeLeft(timerMode === 'work' ? ex.durationSeconds : ex.restTimeSeconds)}
                                  className="p-2 bg-[#1E283C] hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-all"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#111622] border border-[#1A2333] border-dashed rounded-2xl p-12 text-center shadow-xl flex flex-col items-center justify-center h-[450px]">
                <div className="h-16 w-16 rounded-full bg-[#1A2333] border border-[#222E45] flex items-center justify-center text-gray-500 mb-4">
                  <Dumbbell className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1.5">No HIIT Routine Generated</h3>
                <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
                  Trigger the predictive matrix on previous workouts to synthesize a personalized 20-minute interval model avoiding taxed zones.
                </p>
                <button
                  onClick={generateRoutine}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#FF3B30] to-[#E60000] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  Compute Custom Protocol
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
