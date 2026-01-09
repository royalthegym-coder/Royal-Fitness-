
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { INITIAL_MEMBER_SCHEDULES, INITIAL_WORKOUT_TEMPLATES, INITIAL_MEMBERS } from '../../constants';
import { WorkoutLog, WorkoutPerformance, WorkoutExercise, MemberFitnessData, WorkoutSection } from '../../types';
import { BotIcon } from '../icons/BotIcon';
import { MemberView } from '../MemberPortal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { getPostWorkoutAnalysis, generateAIWorkoutTemplate, modifyExerciseWithAI, getRealTimeSetAdjustment, ReadinessOutput, getSmartWarmup } from '../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import Modal from '../common/Modal';
import SmartReadinessModal from './SmartReadinessModal';
import { CameraIcon } from '../icons/CameraIcon';

// --- ICONS ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const SwapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const AdjustIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface TodaysWorkoutProps {
    memberId: number;
    onWorkoutComplete: (log: WorkoutLog) => void;
    setActiveView: (view: MemberView) => void;
    fitnessData: MemberFitnessData;
}

type PerformanceLog = Record<string, { reps: string; weight: string; completed: boolean }[]>;

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ memberId, onWorkoutComplete, setActiveView, fitnessData }) => {
    // --- STATE ---
    const [performanceLog, setPerformanceLog] = useState<PerformanceLog>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    
    // AI & Modals
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState<any | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [workoutFocus, setWorkoutFocus] = useState('Full Body');
    const [showGeneratorModal, setShowGeneratorModal] = useState(false);
    const [modifiedExercises, setModifiedExercises] = useState<Record<string, WorkoutExercise>>({});
    
    // Smart Action State
    const [activeSmartMenu, setActiveSmartMenu] = useState<string | null>(null); // Exercise Name
    const [adjustingExercise, setAdjustingExercise] = useState<string | null>(null);
    const [smartSuggestion, setSmartSuggestion] = useState<{ adjustment: string, recommendedWeight: number, recommendedReps: number } | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);

    // Dynamic Readiness
    const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
    const [readinessData, setReadinessData] = useState<ReadinessOutput | null>(null);

    // Warmup State
    const [smartWarmup, setSmartWarmup] = useState<string | null>(null);
    const [isGeneratingWarmup, setIsGeneratingWarmup] = useState(false);

    // --- EFFECT: TIMER ---
    useEffect(() => {
        let interval: any;
        if (isTimerRunning) {
            interval = setInterval(() => setSessionDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // --- FORMAT TIME ---
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- DATA PREP ---
    const todaysWorkoutSchedule = useMemo(() => {
        if (generatedWorkout) return generatedWorkout;
        const todayString = new Date().toISOString().split('T')[0];
        const schedule = INITIAL_MEMBER_SCHEDULES[memberId]?.[todayString];
        if (schedule && !schedule.isRestDay) {
            if (schedule.templateId) {
                return INITIAL_WORKOUT_TEMPLATES.find(t => t.id === schedule.templateId);
            }
            if (schedule.exercises) {
                return { id: Date.now(), name: "Custom Workout", level: "Intermediate", exercises: schedule.exercises };
            }
        }
        return null;
    }, [memberId, generatedWorkout]);

    // Flatten exercises for logic, keep structured for display
    const workoutStructure: WorkoutSection[] = useMemo(() => {
        if (!todaysWorkoutSchedule) return [];
        let sections: WorkoutSection[] = [];
        
        // 1. Structure Definitions
        if ('sections' in todaysWorkoutSchedule && todaysWorkoutSchedule.sections) {
            sections = todaysWorkoutSchedule.sections.map(sec => ({
                ...sec,
                exercises: sec.exercises.map(ex => modifiedExercises[ex.name] || ex)
            }));
        } else if (todaysWorkoutSchedule.exercises) {
            sections = [{
                title: 'Main Workout',
                exercises: todaysWorkoutSchedule.exercises.map(ex => modifiedExercises[ex.name] || ex)
            }];
        }

        // 2. Intelligent Auto-Phasing (If flat list)
        // If data is just a list, we intelligently group it into phases for a better UI experience.
        if (sections.length === 1 && sections[0].title === 'Main Workout') {
            const all = sections[0].exercises;
            if (all.length >= 3) {
               // Heuristic: First 1/4 is Warmup, Last 1/4 is Cooldown
               const warmupCount = Math.ceil(all.length * 0.2); 
               const cooldownCount = Math.ceil(all.length * 0.2);
               const mainCount = all.length - warmupCount - cooldownCount;

               if (mainCount > 0) {
                   return [
                       { title: '🔥 Warm Up & Activation', exercises: all.slice(0, warmupCount) },
                       { title: '💪 Primary Power & Strength', exercises: all.slice(warmupCount, warmupCount + mainCount) },
                       { title: '🧘 Finisher & Core', exercises: all.slice(warmupCount + mainCount) }
                   ];
               }
            }
        }
        return sections;
    }, [todaysWorkoutSchedule, modifiedExercises]);

    // Initialize Log
    useEffect(() => {
        if (todaysWorkoutSchedule) {
            const initialLog: PerformanceLog = {};
            workoutStructure.forEach(sec => {
                sec.exercises.forEach(ex => {
                    if (!performanceLog[ex.name]) {
                        const setCount = parseInt(ex.sets.split('-')[0], 10) || 3;
                        initialLog[ex.name] = Array(setCount).fill({ reps: '', weight: '', completed: false });
                    }
                });
            });
            setPerformanceLog(prev => ({...prev, ...initialLog}));
        }
    }, [workoutStructure]); // Dependency changed to structure to catch updates

    // --- ACTIONS ---

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

    const handleSetChange = (exerciseName: string, setIndex: number, field: 'reps' | 'weight', value: string) => {
        setPerformanceLog(prev => {
            const newLog = { ...prev };
            const newSets = [...newLog[exerciseName]];
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };
            newLog[exerciseName] = newSets;
            return newLog;
        });
    };

    const toggleSetComplete = (exerciseName: string, setIndex: number) => {
        if (!isTimerRunning) setIsTimerRunning(true); // Auto start timer on interaction
        setPerformanceLog(prev => {
            const newLog = { ...prev };
            const newSets = [...newLog[exerciseName]];
            newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
            newLog[exerciseName] = newSets;
            return newLog;
        });
    };

    const handleAddSet = (exerciseName: string) => {
        setPerformanceLog(prev => ({
            ...prev,
            [exerciseName]: [...prev[exerciseName], { reps: '', weight: '', completed: false }]
        }));
    };

    const handleRemoveSet = (exerciseName: string, setIndex: number) => {
        setPerformanceLog(prev => ({
            ...prev,
            [exerciseName]: prev[exerciseName].filter((_, i) => i !== setIndex)
        }));
    };

    const handleFinishWorkout = async () => {
        setIsTimerRunning(false);
        if (!todaysWorkoutSchedule) return;

        // Flatten for Analysis
        const allExercises = workoutStructure.flatMap(s => s.exercises);
        
        const performance: WorkoutPerformance[] = Object.entries(performanceLog).map(([exerciseName, sets]) => ({
            exercise: exerciseName,
            sets: sets.map(set => ({
                reps: parseInt(set.reps) || 0,
                weight: parseFloat(set.weight) || 0
            })).filter(s => s.reps > 0 || s.weight > 0)
        }));
        
        const log: WorkoutLog = {
            date: new Date().toISOString().split('T')[0],
            templateName: todaysWorkoutSchedule.name,
            completedExercises: allExercises,
            performance,
        };
        onWorkoutComplete(log);
        setIsCompleted(true);

        const member = INITIAL_MEMBERS.find(m => m.id === memberId);
        const memberHistory = fitnessData[memberId] || { logs: [], metrics: [] };
        
        if (member) {
            setIsAnalyzing(true);
            try {
                const analysis = await getPostWorkoutAnalysis(member, log, memberHistory);
                setAiAnalysis(analysis);
            } catch (err) {
                console.error("AI Analysis Failed", err);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    // --- AI MODIFICATIONS ---

    const handleGenerateSmartWarmup = async () => {
        if (!todaysWorkoutSchedule) return;
        setIsGeneratingWarmup(true);
        try {
            const warmup = await getSmartWarmup(todaysWorkoutSchedule.name);
            setSmartWarmup(warmup);
        } catch(e) {
            console.error(e);
        } finally {
            setIsGeneratingWarmup(false);
        }
    }

    const handleAIModifyExercise = async (originalName: string, type: 'easier' | 'harder' | 'swap') => {
        setActiveSmartMenu(null); // Close menu
        // Optimistic update UI showing loading state could go here
        try {
            const newEx = await modifyExerciseWithAI(originalName, type);
            setModifiedExercises(prev => ({ ...prev, [originalName]: newEx }));
            // Re-init log for new exercise
            setPerformanceLog(prev => {
                const newLog = {...prev};
                const setCount = parseInt(newEx.sets, 10) || 3;
                newLog[newEx.name] = Array(setCount).fill({ reps: '', weight: '', completed: false });
                return newLog;
            });
        } catch (error) {
            console.error(error);
        }
    };

    const getSmartAdjustment = async (exerciseName: string, difficulty: 'Too Easy' | 'Perfect' | 'Too Hard') => {
        setActiveSmartMenu(null);
        setAdjustingExercise(exerciseName);
        setIsAdjusting(true);
        setSmartSuggestion(null);
        
        const sets = performanceLog[exerciseName] || [];
        const lastSet = [...sets].reverse().find(s => parseInt(s.weight) > 0) || { weight: 20, reps: 10 };

        try {
            const suggestion = await getRealTimeSetAdjustment(
                exerciseName, 
                { weight: parseFloat(lastSet.weight.toString()), reps: parseInt(lastSet.reps.toString()) },
                difficulty
            );
            setSmartSuggestion(suggestion);
        } catch (e) { console.error(e); } 
        finally { setIsAdjusting(false); }
    };

    const applySmartSuggestion = () => {
        if (!smartSuggestion || !adjustingExercise) return;
        setPerformanceLog(prev => {
            const newLog = { ...prev };
            const sets = [...newLog[adjustingExercise]];
            const emptyIndex = sets.findIndex(s => !s.weight && !s.reps);
            if (emptyIndex !== -1) {
                sets[emptyIndex] = { ...sets[emptyIndex], weight: smartSuggestion.recommendedWeight.toString(), reps: smartSuggestion.recommendedReps.toString() };
            } else {
                sets.push({ weight: smartSuggestion.recommendedWeight.toString(), reps: smartSuggestion.recommendedReps.toString(), completed: false });
            }
            newLog[adjustingExercise] = sets;
            return newLog;
        });
        setAdjustingExercise(null);
    };

    // --- RENDER HELPERS ---

    const calculateProgress = () => {
        const totalSets = Object.values(performanceLog).reduce((acc, sets) => acc + sets.length, 0);
        const completedSets = Object.values(performanceLog).reduce((acc, sets) => acc + sets.filter(s => s.completed).length, 0);
        return totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);
    };

    const handleGenerateDailyWorkout = async () => {
        setIsGenerating(true);
        const memberHistory = fitnessData[memberId] || { logs: [], metrics: [] };
        
        try {
            const promptOptions = {
                name: `AI Generated: ${workoutFocus}`,
                level: 'Intermediate' as any,
                goal: 'General Fitness' as any,
                structure: 'Full Body' as any,
                daysPerWeek: 3,
                notes: `Create a single session focusing on ${workoutFocus}. Return simple exercises.`,
                memberHistory // Pass history for personalization
            };
            
            const content = await generateAIWorkoutTemplate(promptOptions);
            
            // Basic parsing of the AI response to make it usable in the UI
            const lines = content.split('\n');
            const parsedExercises: WorkoutExercise[] = [];
            
            lines.forEach(line => {
                if (line.trim().startsWith('- **') || line.trim().startsWith('- ')) {
                    const cleanLine = line.replace(/[*_]/g, '').replace(/^- /, '');
                    const parts = cleanLine.split(':');
                    if (parts.length > 1) {
                        const name = parts[0].trim();
                        const setRepMatch = parts[1].match(/(\d+)\s+sets/i);
                        const sets = setRepMatch ? setRepMatch[1] : '3';
                        parsedExercises.push({ name, sets: sets, reps: '10-12' });
                    }
                }
            });

            if (parsedExercises.length > 0) {
                setGeneratedWorkout({
                    id: Date.now(),
                    name: `AI Smart Session: ${workoutFocus}`,
                    level: "Custom",
                    exercises: parsedExercises
                });
                setShowGeneratorModal(false);
            } else {
                alert("Could not parse AI workout. Please try again.");
            }

        } catch (e) {
            console.error(e);
            alert("Failed to generate workout.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- VIEWS ---

    if (isCompleted) {
        return (
            <div className="space-y-6">
                <Card className="bg-gradient-to-br from-green-900 to-gray-900 border-green-500">
                    <div className="text-center py-10">
                        <CheckCircleIcon className="w-20 h-20 text-green-400 mx-auto mb-4 animate-bounce" />
                        <h3 className="text-3xl font-bold text-white">Session Crushed!</h3>
                        <p className="text-green-200 mt-2">Workout logged successfully.</p>
                        <div className="flex justify-center gap-8 mt-6">
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase">Duration</p>
                                <p className="text-xl font-bold text-white">{formatTime(sessionDuration)}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400 uppercase">Volume</p>
                                <p className="text-xl font-bold text-white">
                                    {Object.values(performanceLog).reduce((acc, sets) => acc + sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0), 0).toLocaleString()} kg
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {(isAnalyzing || aiAnalysis) && (
                    <Card title="AI Performance Report" className="border-amber-500/50">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <SparkleIcon className="w-10 h-10 text-amber-400 animate-spin mb-4" />
                                <p className="text-gray-300 animate-pulse">Analyzing biomechanics & history...</p>
                            </div>
                        ) : (
                            <div className="prose dark:prose-invert prose-sm max-w-none animate-fade-in bg-gray-800/50 p-6 rounded-lg" dangerouslySetInnerHTML={{ __html: aiAnalysis?.replace(/\n/g, '<br />') || '' }} />
                        )}
                        <button onClick={() => setActiveView('tracker')} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500">
                            View Progress Tracker
                        </button>
                    </Card>
                )}
            </div>
        );
    }

    if (!todaysWorkoutSchedule) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
                <div className="bg-gray-800 p-8 rounded-full border-4 border-amber-500/20">
                    <BotIcon />
                </div>
                <h2 className="text-3xl font-bold text-white">No Workout Scheduled</h2>
                <p className="text-gray-400 max-w-md text-center">It's a rest day! Recovery is where growth happens. Want to train anyway?</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowGeneratorModal(true)} className="bg-amber-500 text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all flex items-center">
                        <SparkleIcon className="w-5 h-5 mr-2"/> Generate Smart Session
                    </button>
                </div>
                {/* Simplified Generator Modal for this view */}
                <Modal isOpen={showGeneratorModal} onClose={() => setShowGeneratorModal(false)} title="Generate Session">
                     <div className="space-y-4">
                        <label className="block text-gray-300 text-sm">Focus Area</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Full Body', 'Upper Body', 'Lower Body', 'Cardio'].map(f => (
                                <button key={f} onClick={() => setWorkoutFocus(f)} className={`p-2 rounded border ${workoutFocus === f ? 'bg-amber-500 text-black border-amber-500' : 'border-gray-600 text-gray-300'}`}>{f}</button>
                            ))}
                        </div>
                        <button onClick={handleGenerateDailyWorkout} disabled={isGenerating} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-4">
                            {isGenerating ? 'Building...' : 'Create Workout'}
                        </button>
                     </div>
                </Modal>
            </div>
        );
    }

    const progress = calculateProgress();

    return (
        <div className="pb-20">
            {/* --- TOP HEADER: LIVE SESSION COCKPIT --- */}
            <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur-md border-b border-gray-700 pb-4 pt-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 mb-6 shadow-xl transition-all duration-300">
                <div className="flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                            {todaysWorkoutSchedule.name}
                        </h1>
                        <p className="text-xs text-gray-400 font-mono flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                            {isTimerRunning ? 'SESSION ACTIVE' : 'READY TO START'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-mono text-xl font-bold text-white tracking-widest">{formatTime(sessionDuration)}</p>
                        </div>
                        <button 
                            onClick={toggleTimer} 
                            className={`p-3 rounded-full shadow-lg transition-transform hover:scale-105 ${isTimerRunning ? 'bg-amber-500/20 text-amber-400 border border-amber-500' : 'bg-green-500 text-white'}`}
                        >
                            {isTimerRunning ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 h-2 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
                
                <div className="flex justify-between mt-2">
                    <button onClick={() => setIsReadinessModalOpen(true)} className="text-xs text-amber-400 flex items-center hover:underline">
                        <SparkleIcon className="w-3 h-3 mr-1" />
                        {readinessData ? `Readiness: ${readinessData.score}%` : 'Check Readiness'}
                    </button>
                    <button onClick={handleGenerateSmartWarmup} disabled={isGeneratingWarmup} className="text-xs text-blue-400 flex items-center hover:underline disabled:opacity-50">
                        {isGeneratingWarmup ? 'Generating...' : 'Get Smart Warmup'}
                    </button>
                    <span className="text-xs text-gray-500">{progress}% Complete</span>
                </div>
            </div>

            {/* --- SMART WARMUP CARD --- */}
            {smartWarmup && (
                <div className="mb-6 bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg animate-fade-in">
                    <h4 className="font-bold text-blue-400 text-sm mb-2 flex items-center"><BotIcon /> Smart Warmup Routine</h4>
                    <div className="prose prose-invert prose-sm text-gray-300" dangerouslySetInnerHTML={{__html: smartWarmup.replace(/\n/g, '<br/>')}} />
                    <button onClick={() => setSmartWarmup(null)} className="text-xs text-gray-500 mt-2 hover:text-white">Dismiss</button>
                </div>
            )}

            {/* --- READINESS ALERT --- */}
            {readinessData && (
                <div className="mb-6 bg-gray-800 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start animate-fade-in">
                    <div className="mr-3 mt-1"><SparkleIcon className="w-5 h-5 text-amber-400" /></div>
                    <div>
                        <h4 className="font-bold text-white text-sm">AI Coach Adjustment</h4>
                        <p className="text-xs text-gray-300 mt-1">{readinessData.strategy}: {readinessData.reasoning}</p>
                        <div className="flex gap-2 mt-2">
                            {readinessData.modifications.map((m, i) => <span key={i} className="text-[10px] bg-gray-700 px-2 py-1 rounded text-gray-300">{m}</span>)}
                        </div>
                    </div>
                </div>
            )}

            {/* --- WORKOUT SECTIONS --- */}
            <div className="space-y-8">
                {workoutStructure.map((section, secIndex) => (
                    <div key={secIndex} className="relative">
                        <div className="flex items-center mb-4">
                            <div className={`w-1 h-6 mr-3 rounded-full ${
                                section.title.includes('Warm') ? 'bg-yellow-500' : 
                                section.title.includes('Cool') ? 'bg-blue-500' : 'bg-green-500'
                            }`}></div>
                            <h3 className="text-lg font-bold text-white uppercase tracking-wider">{section.title}</h3>
                        </div>

                        <div className="space-y-4">
                            {section.exercises.map((exercise, exIndex) => (
                                <div key={exIndex} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-md">
                                    {/* Exercise Header */}
                                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-bold text-white flex items-center">
                                                {exercise.name}
                                                <button className="ml-2 text-gray-500 hover:text-amber-400"><InfoIcon /></button>
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1">Target: <span className="text-amber-400 font-mono">{exercise.sets} x {exercise.reps}</span></p>
                                        </div>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setActiveSmartMenu(activeSmartMenu === exercise.name ? null : exercise.name)}
                                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 rounded-lg shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center gap-1"
                                            >
                                                <SparkleIcon className="w-4 h-4" /> <span className="text-xs font-bold">AI Spotter</span>
                                            </button>
                                            
                                            {/* Smart Action Menu */}
                                            {activeSmartMenu === exercise.name && (
                                                <div className="absolute right-0 top-12 w-56 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-10 overflow-hidden animate-fade-in">
                                                    <div className="p-2 border-b border-gray-600 bg-gray-900/50">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold text-center">Smart Modifications</p>
                                                    </div>
                                                    <button onClick={() => getSmartAdjustment(exercise.name, 'Too Easy')} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center border-b border-gray-700">
                                                        <AdjustIcon /> <span className="ml-2">Smart Adjust Load</span>
                                                    </button>
                                                    <button onClick={() => handleAIModifyExercise(exercise.name, 'swap')} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center border-b border-gray-700">
                                                        <SwapIcon /> <span className="ml-2">Swap Machine (Busy)</span>
                                                    </button>
                                                    <button onClick={() => alert("Opening AI Camera...")} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-gray-700 flex items-center">
                                                        <CameraIcon className="w-4 h-4" /> <span className="ml-2">AI Form Check</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Set Logger */}
                                    <div className="p-4 bg-gray-900/50">
                                        <div className="grid grid-cols-10 gap-2 mb-2 text-xs text-gray-500 font-bold uppercase text-center">
                                            <div className="col-span-1">Set</div>
                                            <div className="col-span-3">kg</div>
                                            <div className="col-span-3">Reps</div>
                                            <div className="col-span-2">Done</div>
                                            <div className="col-span-1"></div>
                                        </div>
                                        {Array.isArray(performanceLog[exercise.name]) && performanceLog[exercise.name].map((set, setIndex) => (
                                            <div key={setIndex} className={`grid grid-cols-10 gap-2 mb-2 items-center transition-all ${set.completed ? 'opacity-50' : 'opacity-100'}`}>
                                                <div className="col-span-1 flex justify-center">
                                                    <span className="w-6 h-6 flex items-center justify-center bg-gray-700 rounded-full text-xs font-bold text-gray-300">{setIndex + 1}</span>
                                                </div>
                                                <div className="col-span-3">
                                                    <input 
                                                        type="number" 
                                                        placeholder="0" 
                                                        value={set.weight}
                                                        onChange={(e) => handleSetChange(exercise.name, setIndex, 'weight', e.target.value)}
                                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-center text-white focus:border-amber-500 outline-none text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <input 
                                                        type="number" 
                                                        placeholder="0" 
                                                        value={set.reps}
                                                        onChange={(e) => handleSetChange(exercise.name, setIndex, 'reps', e.target.value)}
                                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-center text-white focus:border-amber-500 outline-none text-sm font-mono"
                                                    />
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <button 
                                                        onClick={() => toggleSetComplete(exercise.name, setIndex)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${set.completed ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-500 hover:bg-gray-600'}`}
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <button 
                                                        onClick={() => handleRemoveSet(exercise.name, setIndex)} 
                                                        className="text-gray-600 hover:text-red-500 transition-colors"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => handleAddSet(exercise.name)}
                                            className="w-full mt-2 py-2 border border-dashed border-gray-600 text-gray-400 text-xs rounded hover:border-amber-500 hover:text-amber-500 transition-colors"
                                        >
                                            + Add Set
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* --- FINISH BUTTON --- */}
            <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-10 pointer-events-none">
                <button 
                    onClick={handleFinishWorkout} 
                    className="pointer-events-auto bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-12 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center text-lg ring-4 ring-green-500/20"
                >
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    Finish Workout
                </button>
            </div>

            {/* --- MODALS --- */}
            <SmartReadinessModal
                isOpen={isReadinessModalOpen}
                onClose={() => setIsReadinessModalOpen(false)}
                plannedWorkoutName={todaysWorkoutSchedule.name}
                onAnalysisComplete={setReadinessData}
            />

            <Modal isOpen={!!adjustingExercise} onClose={() => setAdjustingExercise(null)} title="Smart Adjust">
                <div className="text-center p-4">
                    {!smartSuggestion ? (
                        <div className="flex flex-col items-center">
                            <SparkleIcon className="w-12 h-12 text-amber-400 animate-spin mb-4" />
                            <p className="text-gray-300">Analyzing your strength curve...</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-400 uppercase font-bold mb-2">AI Suggestion</p>
                            <div className="flex justify-center items-end gap-2 mb-4">
                                <span className="text-5xl font-bold text-white">{smartSuggestion.recommendedWeight}</span>
                                <span className="text-xl text-gray-400 mb-2">kg</span>
                            </div>
                            <p className="text-amber-400 mb-6 italic">"{smartSuggestion.adjustment}"</p>
                            <button onClick={applySmartSuggestion} className="w-full bg-green-500 py-3 rounded-lg font-bold text-white">Apply Change</button>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default TodaysWorkout;
