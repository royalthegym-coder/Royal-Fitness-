
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_MEMBER_SCHEDULES, INITIAL_WORKOUT_TEMPLATES, INITIAL_MEMBERS } from '../../../constants';
import { WorkoutLog, WorkoutPerformance, WorkoutExercise, WorkoutSection, MemberFitnessData, HealthData } from '../../../types';
import { BotIcon } from '../icons/BotIcon';
import { MemberView } from '../MemberPortal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { getPostWorkoutAnalysis, generateAIWorkoutTemplate, modifyExerciseWithAI, getRealTimeSetAdjustment, ReadinessOutput, getSmartWarmup } from '../../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import Modal from '../common/Modal';
import SmartReadinessModal from './SmartReadinessModal';
import { CameraIcon } from '../icons/CameraIcon';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { getMediaForExercise } from '../common/ExerciseDemoModal';
import ExerciseDemoModal from '../common/ExerciseDemoModal';

// --- ICONS ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
const SwapIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface TodaysWorkoutProps {
    memberId: number;
    onWorkoutComplete: (log: WorkoutLog) => void;
    setActiveView: (view: MemberView) => void;
    fitnessData: MemberFitnessData;
    healthData: HealthData;
}

type PerformanceLog = Record<string, { reps: string; weight: string; rpe: string; completed: boolean }[]>;

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const TodaysWorkout: React.FC<TodaysWorkoutProps> = ({ memberId, onWorkoutComplete, setActiveView, fitnessData, healthData }) => {
    // --- STATE ---
    const [performanceLog, setPerformanceLog] = useState<PerformanceLog>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    
    // Rest Timer
    const [restTimer, setRestTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);
    
    // AI & Modals
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [generatedWorkout, setGeneratedWorkout] = useState<any | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [workoutFocus, setWorkoutFocus] = useState('Full Body');
    const [showGeneratorModal, setShowGeneratorModal] = useState(false);
    
    // Smart Modification State
    const [modifiedExercises, setModifiedExercises] = useState<Record<string, WorkoutExercise>>({});
    const [isModifying, setIsModifying] = useState(false);
    
    // Smart Action Menu State
    const [activeSmartMenu, setActiveSmartMenu] = useState<string | null>(null); 
    const [adjustingExercise, setAdjustingExercise] = useState<string | null>(null);
    const [smartSuggestion, setSmartSuggestion] = useState<{ adjustment: string, recommendedWeight: number, recommendedReps: number } | null>(null);
    const [isAdjusting, setIsAdjusting] = useState(false);

    // Demo Modal State
    const [demoModalExercise, setDemoModalExercise] = useState<string | null>(null);

    // Dynamic Readiness
    const [isReadinessModalOpen, setIsReadinessModalOpen] = useState(false);
    const [readinessData, setReadinessData] = useState<ReadinessOutput | null>(null);

    // Warmup State
    const [smartWarmup, setSmartWarmup] = useState<string | null>(null);
    const [isGeneratingWarmup, setIsGeneratingWarmup] = useState(false);

    // PDF State
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

    // --- EFFECT: SESSION TIMER ---
    useEffect(() => {
        let interval: any;
        if (isTimerRunning) {
            interval = setInterval(() => setSessionDuration(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    // --- EFFECT: REST TIMER ---
    useEffect(() => {
        let interval: any;
        if (isResting && restTimer > 0) {
            interval = setInterval(() => setRestTimer(prev => prev - 1), 1000);
        } else if (restTimer === 0 && isResting) {
            setIsResting(false);
        }
        return () => clearInterval(interval);
    }, [isResting, restTimer]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getLastPerformance = (exerciseName: string) => {
        const memberLogs = fitnessData[memberId]?.logs || [];
        for (let i = memberLogs.length - 1; i >= 0; i--) {
            const log = memberLogs[i];
            const perf = log.performance?.find(p => p.exercise === exerciseName);
            if (perf && perf.sets.length > 0) {
                const maxSet = perf.sets.reduce((prev, current) => (prev.weight > current.weight) ? prev : current);
                return `${maxSet.weight}kg x ${maxSet.reps}`;
            }
        }
        return 'New';
    };

    const todaysWorkoutSchedule = useMemo(() => {
        if (generatedWorkout) return generatedWorkout;
        const today = new Date().getDay(); 
        if (today === 0) return null;
        const templateId = 100 + today;
        return INITIAL_WORKOUT_TEMPLATES.find(t => t.id === templateId) || null;
    }, [generatedWorkout]);

    const workoutStructure: WorkoutSection[] = useMemo(() => {
        if (!todaysWorkoutSchedule) return [];
        let sections: WorkoutSection[] = [];
        
        if ('sections' in todaysWorkoutSchedule && todaysWorkoutSchedule.sections) {
            sections = todaysWorkoutSchedule.sections.map((sec: any) => ({
                ...sec,
                exercises: sec.exercises.map((ex: any) => modifiedExercises[ex.name] || ex)
            }));
        } else if (todaysWorkoutSchedule.exercises) {
            sections = [{
                title: 'Main Workout',
                exercises: todaysWorkoutSchedule.exercises.map((ex: any) => modifiedExercises[ex.name] || ex)
            }];
        }
        return sections;
    }, [todaysWorkoutSchedule, modifiedExercises]);

    useEffect(() => {
        if (todaysWorkoutSchedule) {
            const initialLog: PerformanceLog = {};
            workoutStructure.forEach(sec => {
                sec.exercises.forEach(ex => {
                    if (!performanceLog[ex.name]) {
                        const setCount = typeof ex.sets === 'string' ? parseInt(ex.sets.split('-')[0], 10) || 3 : 3;
                        initialLog[ex.name] = Array(setCount).fill({ reps: '', weight: '', rpe: '', completed: false });
                    }
                });
            });
            setPerformanceLog(prev => ({...prev, ...initialLog}));
        }
    }, [workoutStructure]);

    const toggleTimer = () => setIsTimerRunning(!isTimerRunning);

    const handleSetChange = (exerciseName: string, setIndex: number, field: 'reps' | 'weight' | 'rpe', value: string) => {
        setPerformanceLog(prev => {
            const newLog = { ...prev };
            const newSets = [...newLog[exerciseName]];
            newSets[setIndex] = { ...newSets[setIndex], [field]: value };
            newLog[exerciseName] = newSets;
            return newLog;
        });
    };

    const toggleSetComplete = (exerciseName: string, setIndex: number) => {
        if (!isTimerRunning) setIsTimerRunning(true); 
        setPerformanceLog(prev => {
            const newLog = { ...prev };
            const newSets = [...newLog[exerciseName]];
            const isCompleting = !newSets[setIndex].completed;
            newSets[setIndex] = { ...newSets[setIndex], completed: isCompleting };
            newLog[exerciseName] = newSets;
            if (isCompleting) {
                setRestTimer(60); 
                setIsResting(true);
            }
            return newLog;
        });
    };

    const handleAddSet = (exerciseName: string) => {
        setPerformanceLog(prev => ({
            ...prev,
            [exerciseName]: [...prev[exerciseName], { reps: '', weight: '', rpe: '', completed: false }]
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

        const allExercises = workoutStructure.flatMap(s => s.exercises);
        
        const performance: WorkoutPerformance[] = Object.entries(performanceLog).map(([exerciseName, sets]) => ({
            exercise: exerciseName,
            sets: (sets as { reps: string; weight: string; completed: boolean }[]).map(set => ({
                reps: parseInt(set.reps) || 0,
                weight: parseFloat(set.weight) || 0
            })).filter(s => s.reps > 0 || s.weight > 0)
        }));
        
        const log: WorkoutLog = {
            date: getLocalToday(),
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
                const analysis = await getPostWorkoutAnalysis(member, log, memberHistory.logs);
                setAiAnalysis(analysis);
            } catch (err) {
                console.error("AI Analysis Failed", err);
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleGenerateSmartWarmup = async () => {
        if (!todaysWorkoutSchedule) return;
        setIsGeneratingWarmup(true);
        try {
            let context = "";
            if (readinessData) {
                context += `Readiness Score: ${readinessData.score}/100. Strategy: ${readinessData.strategy}. Reasoning: ${readinessData.reasoning}. `;
            }
            context += `Live Health Data: Heart Rate Avg ${healthData.heartRate.avg}bpm, Sleep ${healthData.sleep.totalHours}hrs, Steps ${healthData.steps}.`;
            const warmup = await getSmartWarmup(todaysWorkoutSchedule.name, context);
            setSmartWarmup(warmup);
        } catch(e) {
            console.error(e);
        } finally {
            setIsGeneratingWarmup(false);
        }
    }

    const handleApplyReadiness = () => {
        if (readinessData && readinessData.score < 60) {
            const newModified: Record<string, WorkoutExercise> = {};
            workoutStructure.forEach(sec => {
                sec.exercises.forEach(ex => {
                    const currentSets = parseInt(ex.sets.toString().split('-')[0]) || 3;
                    const newSets = Math.max(1, currentSets - 1);
                    newModified[ex.name] = { ...ex, sets: newSets.toString(), reps: "Low Intensity" };
                });
            });
            setModifiedExercises(prev => ({...prev, ...newModified}));
        }
        setHasStarted(true);
    };

    const handleAIModifyExercise = async (originalName: string, type: 'easier' | 'harder' | 'swap') => {
        setActiveSmartMenu(null);
        setIsModifying(true);
        try {
            const newEx = await modifyExerciseWithAI(originalName, type);
            setModifiedExercises(prev => ({ ...prev, [originalName]: newEx }));
            setPerformanceLog(prev => {
                const newLog = {...prev};
                const setCount = parseInt(newEx.sets, 10) || 3;
                newLog[newEx.name] = Array(setCount).fill({ reps: '', weight: '', rpe: '', completed: false });
                return newLog;
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsModifying(false);
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
                sets.push({ weight: smartSuggestion.recommendedWeight.toString(), reps: smartSuggestion.recommendedReps.toString(), rpe: '', completed: false });
            }
            newLog[adjustingExercise] = sets;
            return newLog;
        });
        setAdjustingExercise(null);
    };

    const calculateProgress = () => {
        const values = Object.values(performanceLog) as { completed: boolean }[][];
        const totalSets = values.reduce((acc, sets) => acc + sets.length, 0);
        const completedSets = values.reduce((acc, sets) => acc + sets.filter(s => s.completed).length, 0);
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
                memberHistory,
                currentHealth: healthData
            };
            
            const rawResponse = await generateAIWorkoutTemplate(promptOptions);
            const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
            const plan = JSON.parse(cleanJson);

            if (plan.exercises && plan.exercises.length > 0) {
                setGeneratedWorkout({
                    id: Date.now(),
                    name: plan.name || `AI Smart Session: ${workoutFocus}`,
                    level: "Custom",
                    exercises: plan.exercises
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

    const handleDownloadPDF = async () => {
        setIsDownloadingPdf(true);
        const element = document.getElementById('workout-content');
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#111827' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text("Generated by Royal The Gym", pdfWidth / 2, pdfHeight - 10, { align: 'center' });
            pdf.save(`${todaysWorkoutSchedule?.name || 'Workout'}_Plan.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Could not download PDF.');
        } finally {
            setIsDownloadingPdf(false);
        }
    };

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
                                    {(Object.values(performanceLog) as { reps: string; weight: string }[][]).reduce((acc, sets) => acc + sets.reduce((sAcc, s) => sAcc + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0), 0).toLocaleString()} kg
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
                    <BotIcon className="w-16 h-16 text-amber-400" />
                </div>
                <h2 className="text-3xl font-bold text-white">Sunday: Active Recovery</h2>
                <p className="text-gray-400 max-w-md text-center">Take a break or do some light stretching. Recovery is where growth happens. Want to train anyway?</p>
                <div className="flex gap-4">
                    <button onClick={() => setShowGeneratorModal(true)} className="bg-amber-500 text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all flex items-center">
                        <SparkleIcon className="w-5 h-5 mr-2"/> Generate Smart Session
                    </button>
                </div>
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

    if (!hasStarted) {
        if (readinessData) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
                    <Card className="max-w-xl w-full border-2 border-amber-500/50 bg-gradient-to-b from-gray-800 to-gray-900">
                        <div className="text-center mb-6">
                            <SparkleIcon className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-pulse" />
                            <h2 className="text-2xl font-bold text-white">Daily Readiness Report</h2>
                            <p className="text-gray-400">Analysis complete for {todaysWorkoutSchedule.name}</p>
                        </div>
                        <div className="flex justify-center mb-6">
                            <div className={`text-center p-4 rounded-xl border ${readinessData.score >= 80 ? 'bg-green-900/30 border-green-500' : readinessData.score >= 60 ? 'bg-yellow-900/30 border-yellow-500' : 'bg-red-900/30 border-red-500'}`}>
                                <p className="text-xs text-gray-400 uppercase font-bold">Readiness Score</p>
                                <p className="text-4xl font-black text-white">{readinessData.score}</p>
                            </div>
                        </div>
                        <div className="space-y-4 mb-8">
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <h4 className="font-bold text-amber-400 text-sm mb-2">Strategy: {readinessData.strategy}</h4>
                                <p className="text-sm text-gray-300 italic">"{readinessData.reasoning}"</p>
                            </div>
                            {readinessData.modifications.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Suggested Adjustments</p>
                                    <ul className="space-y-2">
                                        {readinessData.modifications.map((mod, i) => (
                                            <li key={i} className="text-sm text-white flex items-start">
                                                <span className="text-amber-500 mr-2">•</span> {mod}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleApplyReadiness} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center">
                                <SparkleIcon className="w-5 h-5 mr-2" />
                                {readinessData.score < 60 ? 'Apply Reductions & Start' : 'Apply & Start Workout'}
                            </button>
                            <button onClick={() => setHasStarted(true)} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-colors">
                                Ignore & Start Original Plan
                            </button>
                        </div>
                    </Card>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
                    <Card className="max-w-lg w-full text-center py-10 bg-gray-900 border border-gray-700">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-white mb-2">{todaysWorkoutSchedule.name}</h2>
                            <p className="text-gray-400">Ready to train? Let's check your recovery first.</p>
                        </div>
                        <div className="space-y-4">
                            <button onClick={() => setIsReadinessModalOpen(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg flex items-center justify-center text-lg">
                                <SparkleIcon className="w-6 h-6 mr-2" /> Check Readiness (AI)
                            </button>
                            <button onClick={() => setHasStarted(true)} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors border border-gray-600">
                                Skip & Start Immediately
                            </button>
                        </div>
                    </Card>
                    <SmartReadinessModal isOpen={isReadinessModalOpen} onClose={() => setIsReadinessModalOpen(false)} plannedWorkoutName={todaysWorkoutSchedule.name} onAnalysisComplete={setReadinessData} />
                </div>
            );
        }
    }

    const progress = calculateProgress();

    return (
        <div className="pb-20">
            <ExerciseDemoModal isOpen={!!demoModalExercise} onClose={() => setDemoModalExercise(null)} exerciseName={demoModalExercise || ''} />
            
            {/* TOP HEADER */}
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
                        <button onClick={handleDownloadPDF} disabled={isDownloadingPdf} className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center transition-colors text-xs font-bold disabled:opacity-50" title="Download PDF">
                            {isDownloadingPdf ? <SparkleIcon className="w-4 h-4 animate-spin"/> : <DownloadIcon />}
                            <span className="ml-1 hidden sm:inline">PDF</span>
                        </button>
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-mono text-xl font-bold text-white tracking-widest">{formatTime(sessionDuration)}</p>
                        </div>
                        <button onClick={toggleTimer} className={`p-3 rounded-full shadow-lg transition-transform hover:scale-105 ${isTimerRunning ? 'bg-amber-500/20 text-amber-400 border border-amber-500' : 'bg-green-500 text-white'}`}>
                            {isTimerRunning ? <PauseIcon /> : <PlayIcon />}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex-grow bg-gray-800 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-amber-400 w-10 text-right">{progress}%</span>
                </div>
                {isResting && (
                    <div className="absolute top-16 left-0 right-0 flex justify-center pointer-events-none animate-slide-down">
                        <div className="bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-full border border-green-500/50 shadow-2xl flex items-center gap-3">
                            <span className="text-xs text-green-400 font-bold uppercase tracking-wider animate-pulse">Resting</span>
                            <span className="text-xl font-mono font-bold">{restTimer}s</span>
                            <button onClick={() => { setIsResting(false); setRestTimer(0); }} className="pointer-events-auto bg-gray-700 hover:bg-gray-600 rounded-full p-1 ml-2 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* AI WARMUP */}
            {!smartWarmup ? (
                <div className="mb-6 flex justify-center">
                    <button onClick={handleGenerateSmartWarmup} disabled={isGeneratingWarmup} className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-400 text-xs font-bold py-2 px-6 rounded-full border border-amber-500/50 flex items-center transition-all shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                        <SparkleIcon className={`w-4 h-4 mr-2 ${isGeneratingWarmup ? 'animate-spin' : ''}`} />
                        {isGeneratingWarmup ? 'Designing Protocol...' : 'Generate Smart Warmup (AI)'}
                    </button>
                </div>
            ) : (
                <div className="mb-6 bg-gray-800/50 p-4 rounded-xl border border-amber-500/20 animate-fade-in">
                    <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center">
                        <SparkleIcon className="w-4 h-4 mr-2" /> AI Warmup Protocol
                    </h4>
                    <div className="prose dark:prose-invert prose-sm text-gray-300 text-xs" dangerouslySetInnerHTML={{ __html: smartWarmup.replace(/\n/g, '<br />') }} />
                </div>
            )}

            {/* WORKOUT LIST */}
            <div id="workout-content" className="space-y-8">
                {workoutStructure.map((section, sIndex) => (
                    <div key={sIndex} className="animate-fade-in-up" style={{ animationDelay: `${sIndex * 100}ms` }}>
                        {section.title && (
                            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest border-b border-gray-700 pb-2 mb-4 flex items-center">
                                {section.title}
                            </h3>
                        )}
                        <div className="space-y-6">
                            {section.exercises.map((exercise, eIndex) => {
                                const exerciseLog = performanceLog[exercise.name] || [];
                                const isModified = modifiedExercises[exercise.name];
                                const lastPerf = getLastPerformance(exercise.name);

                                return (
                                    <div key={eIndex} className={`bg-gray-800 rounded-xl border transition-all duration-300 hover:border-gray-600 ${isModified ? 'border-blue-500/50 bg-blue-900/10' : 'border-gray-700'}`}>
                                        
                                        {/* Exercise Header */}
                                        <div className="p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-xl flex items-start gap-4">
                                            <div 
                                                onClick={() => setDemoModalExercise(exercise.name)}
                                                className="w-24 h-24 bg-black rounded-lg cursor-pointer group relative flex-shrink-0 shadow-lg border border-gray-700 overflow-hidden"
                                                title="Tap to watch AI form guide"
                                            >
                                                <img src={getMediaForExercise(exercise.name)} alt="demo" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all">
                                                    <VideoCameraIcon className="w-8 h-8 text-cyan-400 group-hover:scale-110 transition-transform mb-1" />
                                                    <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-cyan-900/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-cyan-500/50">AI Coach</span>
                                                </div>
                                            </div>

                                            <div className="flex-grow flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-xl font-bold text-white">
                                                        {exercise.name}
                                                    </h4>
                                                    {isModified && <span className="mt-1 inline-block text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">AI Adjusted</span>}
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <p className="text-sm text-gray-400">Target: <span className="text-amber-400 font-mono">{exercise.sets}</span> sets x <span className="text-amber-400 font-mono">{exercise.reps}</span> reps</p>
                                                        <div className="flex items-center text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                                                            <HistoryIcon className="w-3 h-3 mr-1" /> Last: {lastPerf}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <button onClick={() => setActiveSmartMenu(activeSmartMenu === exercise.name ? null : exercise.name)} className={`p-2 rounded-lg transition-colors ${activeSmartMenu === exercise.name ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                                                        <BotIcon className="w-5 h-5" />
                                                    </button>
                                                    {activeSmartMenu === exercise.name && (
                                                        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl z-10 overflow-hidden animate-fade-in">
                                                            <div className="px-3 py-2 bg-gray-900 border-b border-gray-700 text-[10px] font-bold text-gray-400 uppercase">AI Modifications</div>
                                                            <button onClick={() => handleAIModifyExercise(exercise.name, 'easier')} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center">
                                                                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Make Easier
                                                            </button>
                                                            <button onClick={() => handleAIModifyExercise(exercise.name, 'harder')} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center">
                                                                <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> Make Harder
                                                            </button>
                                                            <button onClick={() => handleAIModifyExercise(exercise.name, 'swap')} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center border-t border-gray-700">
                                                                <SwapIcon /> <span className="ml-2">Swap Exercise</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sets Table */}
                                        <div className="p-4">
                                            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                                                <div className="col-span-1">Set</div>
                                                <div className="col-span-3">Kg</div>
                                                <div className="col-span-3">Reps</div>
                                                <div className="col-span-2">RPE</div>
                                                <div className="col-span-3">Status</div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {exerciseLog.map((set, setIndex) => (
                                                    <div key={setIndex} className={`grid grid-cols-12 gap-2 items-center text-sm p-2 rounded-lg transition-colors ${set.completed ? 'bg-green-900/10' : 'bg-gray-900/30'}`}>
                                                        <div className="col-span-1 text-center font-bold text-gray-400">{setIndex + 1}</div>
                                                        <div className="col-span-3">
                                                            <input type="number" placeholder="0" className={`w-full bg-gray-900 border ${set.completed ? 'border-green-500/30 text-green-400' : 'border-gray-700 text-white'} rounded p-2 text-center focus:ring-1 focus:ring-amber-500 outline-none`} value={set.weight} onChange={(e) => handleSetChange(exercise.name, setIndex, 'weight', e.target.value)} />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <input type="number" placeholder="0" className={`w-full bg-gray-900 border ${set.completed ? 'border-green-500/30 text-green-400' : 'border-gray-700 text-white'} rounded p-2 text-center focus:ring-1 focus:ring-amber-500 outline-none`} value={set.reps} onChange={(e) => handleSetChange(exercise.name, setIndex, 'reps', e.target.value)} />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input type="number" placeholder="-" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-center text-gray-400 focus:text-white outline-none" value={set.rpe} onChange={(e) => handleSetChange(exercise.name, setIndex, 'rpe', e.target.value)} />
                                                        </div>
                                                        <div className="col-span-3 flex justify-center gap-1">
                                                            <button onClick={() => toggleSetComplete(exercise.name, setIndex)} className={`p-2 rounded-lg transition-all w-full flex items-center justify-center ${set.completed ? 'bg-green-500 text-white shadow-lg shadow-green-900/50' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                                                                {set.completed ? <CheckCircleIcon className="w-4 h-4" /> : <span className="text-[10px] font-bold">LOG</span>}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <button onClick={() => handleAddSet(exercise.name)} className="mt-3 w-full py-2 border border-dashed border-gray-600 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:border-gray-500 transition-colors">
                                                + ADD SET
                                            </button>

                                            {/* AI Feedback Box */}
                                            {adjustingExercise === exercise.name && (
                                                <div className="mt-4 p-4 bg-black/40 border border-amber-500/30 rounded-lg animate-fade-in">
                                                    {isAdjusting ? (
                                                        <div className="flex items-center text-amber-400 text-xs">
                                                            <AutoUpdateIcon className="w-4 h-4 animate-spin mr-2"/>
                                                            Calculating optimal load...
                                                        </div>
                                                    ) : smartSuggestion ? (
                                                        <div>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-amber-400 text-xs font-bold uppercase">AI Recommendation</span>
                                                                <button onClick={() => setAdjustingExercise(null)} className="text-gray-500 hover:text-white">✕</button>
                                                            </div>
                                                            <p className="text-sm text-gray-300 mb-2">{smartSuggestion.adjustment}</p>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-center bg-gray-800 p-2 rounded">
                                                                    <p className="text-[10px] text-gray-500 uppercase">Weight</p>
                                                                    <p className="font-bold text-white">{smartSuggestion.recommendedWeight}kg</p>
                                                                </div>
                                                                <div className="text-center bg-gray-800 p-2 rounded">
                                                                    <p className="text-[10px] text-gray-500 uppercase">Reps</p>
                                                                    <p className="font-bold text-white">{smartSuggestion.recommendedReps}</p>
                                                                </div>
                                                                <button onClick={applySmartSuggestion} className="ml-auto bg-amber-500 text-black text-xs font-bold px-3 py-2 rounded hover:bg-amber-400">
                                                                    Apply
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}

                                            {/* Quick Rating Buttons */}
                                            <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-700/50">
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Rate Last Set</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => getSmartAdjustment(exercise.name, 'Too Easy')} className="px-2 py-1 rounded text-[10px] bg-gray-800 text-gray-400 hover:text-green-400 border border-gray-700 hover:border-green-500 transition-colors">Too Easy</button>
                                                    <button onClick={() => getSmartAdjustment(exercise.name, 'Perfect')} className="px-2 py-1 rounded text-[10px] bg-gray-800 text-gray-400 hover:text-blue-400 border border-gray-700 hover:border-blue-500 transition-colors">Perfect</button>
                                                    <button onClick={() => getSmartAdjustment(exercise.name, 'Too Hard')} className="px-2 py-1 rounded text-[10px] bg-gray-800 text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-500 transition-colors">Too Hard</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 z-10 md:pl-64">
                <div className="max-w-4xl mx-auto flex gap-4">
                    <button onClick={handleFinishWorkout} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-transform active:scale-95 flex items-center justify-center text-lg">
                        <CheckCircleIcon className="w-6 h-6 mr-2" />
                        Finish Workout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TodaysWorkout;
