
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Modal from './Modal';
import { getComplexResponse } from '../../../lib/core_ai';
import { SparkleIcon } from '../icons/SparkleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BotIcon } from '../icons/BotIcon';
import { getMediaForExercise } from './ExerciseDemoModal';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { WorkoutExercise, WorkoutSection, Member } from '../../../types';
import { useData } from '../../context/DataProvider';

const useCleanupMonitor = (componentName: string) => {
    useEffect(() => {
        const activeTimers: number[] = [];
        const activeListeners: { type: string, listener: EventListenerOrEventListenerObject }[] = [];
        
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        const originalAddEventListener = window.addEventListener;
        const originalRemoveEventListener = window.removeEventListener;

        window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
            const id = originalSetTimeout(handler, timeout, ...args);
            activeTimers.push(id as unknown as number);
            return id;
        }) as typeof window.setTimeout;

        window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: any[]) => {
            const id = originalSetInterval(handler, timeout, ...args);
            activeTimers.push(id as unknown as number);
            return id;
        }) as typeof window.setInterval;

        window.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
            activeListeners.push({ type, listener });
            originalAddEventListener(type, listener, options);
        };

        window.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
            const idx = activeListeners.findIndex(l => l.type === type && l.listener === listener);
            if (idx > -1) activeListeners.splice(idx, 1);
            originalRemoveEventListener(type, listener, options);
        };

        return () => {
             console.log(`[Cleanup Monitor] ${componentName} unmounted. Active timers/intervals: ${activeTimers.length}. Unclosed event listeners: ${activeListeners.length}.`);
             window.setTimeout = originalSetTimeout;
             window.setInterval = originalSetInterval;
             window.addEventListener = originalAddEventListener;
             window.removeEventListener = originalRemoveEventListener;
        };
    }, [componentName]);
};

// Component Hierarchy Logger & Memoized Content Wrapper
const ReviewScreenContent = React.memo(({ generatedPlan, structure, renderExerciseSection }: any) => {
    // 1. Component Hierarchy Logger setup
    useEffect(() => {
        console.log('[Hierarchy Logger] ReviewScreenContent Mounted');
        return () => {
            console.log('[Hierarchy Logger] ReviewScreenContent Unmounted prematurely or explicitly');
        };
    }, []);

    // Also track re-renders
    const renderCount = useRef(0);
    useEffect(() => {
        renderCount.current += 1;
        console.log(`[Hierarchy Logger] ReviewScreenContent Render Count: ${renderCount.current} (Check if re-rendering unnecessarily)`);
    });

    // 2. Add Cleanup Monitor utility 
    useCleanupMonitor('ReviewScreenContent');

    // 3. Replace inline object declarations with 'useMemo' hook
    const containerStyle = useMemo(() => ({ display: 'flex', flexDirection: 'column' as const, height: '100%', overflow: 'hidden' }), []);

    return (
        <div style={containerStyle}>
            <div className="bg-gray-800 p-3 rounded-t-lg border-b border-gray-700 flex flex-col">
                <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-white truncate pr-2 text-lg">{generatedPlan.name}</h4>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{structure}</span>
                </div>
                <p className="text-sm text-gray-400 italic">{generatedPlan.description}</p>
            </div>
            
            <div className="flex-grow overflow-y-auto bg-gray-900 p-4 border border-gray-700 border-t-0 custom-scrollbar">
                {generatedPlan.preWorkout && renderExerciseSection(generatedPlan.preWorkout.name || 'Pre-Workout', generatedPlan.preWorkout.exercises, 'text-cyan-400')}
                
                {generatedPlan.mainWorkout.map((section: any, idx: number) => (
                    <div key={idx}>
                        {renderExerciseSection(section.name || 'Main Routine', section.exercises, 'text-amber-400')}
                    </div>
                ))}

                {generatedPlan.finisher && renderExerciseSection(generatedPlan.finisher.name || 'Finisher', generatedPlan.finisher.exercises, 'text-red-400')}
            </div>
        </div>
    );
});

interface AIWorkoutGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: { 
        name: string; 
        level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance'; 
        content?: string; 
        preWorkout?: WorkoutSection;
        mainWorkout?: WorkoutSection[];
        finisher?: WorkoutSection;
    }, memberId?: number) => void;
}

interface GeneratedPlan {
    name: string;
    description: string;
    preWorkout?: WorkoutSection;
    mainWorkout: WorkoutSection[];
    finisher?: WorkoutSection;
}

const AIWorkoutGeneratorModal: React.FC<AIWorkoutGeneratorModalProps> = ({ isOpen, onClose, onSave }) => {
    const { members } = useData();
    
    // Form State
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [name, setName] = useState('');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance'>('Intermediate');
    const [goal, setGoal] = useState<'Muscle Gain' | 'Fat Loss' | 'Strength' | 'General Fitness' | 'Endurance' | 'Flexibility'>('General Fitness');
    const [structure, setStructure] = useState<'Full Body' | 'Push/Pull/Legs' | 'Upper/Lower Split' | 'Cardio Focus' | 'Core & Abs' | 'HIIT'>('Push/Pull/Legs');
    const [daysPerWeek, setDaysPerWeek] = useState(3);
    const [notes, setNotes] = useState('');

    // Update form when member is selected
    useEffect(() => {
        if (selectedMemberId) {
            const member = members.find(m => m.id === Number(selectedMemberId));
            if (member) {
                setName(`${member.name}'s Custom Protocol`);
                setLevel(member.level as any || 'Intermediate');
                setGoal(member.fitnessGoal as any || 'General Fitness');
                const metrics = member.physical_metrics;
                setNotes(`Member Profile: Age ${member.bio_age || 'N/A'}, Weight ${metrics?.weight || 'N/A'}kg, Height ${metrics?.height || 'N/A'}cm. ${member.medical_history?.conditions?.length ? 'Medical Conditions: ' + member.medical_history.conditions.join(', ') : ''}`);
            }
        } else {
            setName('');
            setNotes('');
        }
    }, [selectedMemberId, members]);

    // Processing State
    const [status, setStatus] = useState<'idle' | 'generating' | 'review' | 'refining' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Result State
    const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
    const [refinementPrompt, setRefinementPrompt] = useState('');

    // Progress Bar Simulation
    useEffect(() => {
        let interval: any;
        if (status === 'generating' || status === 'refining') {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return prev; // Hold at 90% until done
                    return prev + Math.random() * 10;
                });
            }, 500);
        } else {
            setProgress(100);
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleGenerate = async () => {
        if (!name) {
            setErrorMsg("Please provide a plan name.");
            return;
        }
        setErrorMsg('');
        setStatus('generating');
        
        try {
            const prompt = `
                ACT AS AN ELITE STRENGTH & CONDITIONING COACH AND SPORTS SCIENTIST.
                Create a highly detailed, scientific, and personalized gym workout plan based on the following parameters:
                
                - Client Profile/Plan Name: ${name}
                - Experience Level: ${level} (Adjust volume, intensity, and exercise complexity accordingly)
                - Primary Goal: ${goal} (Optimize rep ranges, rest periods, and exercise selection for this specific goal)
                - Preferred Split/Structure: ${structure}
                - Training Frequency: ${daysPerWeek} days/week
                - Additional Context/Limitations: ${notes || 'None provided'}

                The plan MUST incorporate principles of progressive overload, optimal biomechanics, and targeted energy system development.
                CRITICAL: For each exercise, provide specific variations (e.g., regressions for beginners, advanced variations for pros) and progression strategies based on historical performance improvements.
                
                Format the response STRICTLY as a valid JSON object matching this exact schema. Do not include markdown formatting like \`\`\`json.
                {
                    "name": "string (A compelling, professional name for the protocol)",
                    "description": "string (A concise 2-3 sentence explanation of the physiological mechanisms, periodization strategy, and expected adaptations of this specific routine)",
                    "preWorkout": { 
                        "name": "Dynamic Activation & Mobility", 
                        "exercises": [{ "name": "string (Specific mobility/activation drill)", "sets": "string", "reps": "string (e.g., '30 sec/side' or '10 reps')" }] 
                    },
                    "mainWorkout": [
                        { 
                            "name": "string (e.g., 'Primary Neuromuscular Activation', 'Hypertrophy Block A')", 
                            "exercises": [{ "name": "string (Specific exercise name)", "sets": "string (e.g., '3-4')", "reps": "string (e.g., '6-8', 'RIR 2')", "notes": "string (Include specific variations and progression strategies here)" }] 
                        }
                    ],
                    "finisher": { 
                        "name": "Metabolic Conditioning / Finisher", 
                        "exercises": [{ "name": "string", "sets": "string", "reps": "string" }] 
                    }
                }
                
                Ensure all exercises are standard, recognizable gym movements but selected optimally for the stated goal and level.
            `;
            
            const rawResponse = await getComplexResponse(prompt);
            
            try {
                // Ensure we parse strict JSON
                const cleanJson = rawResponse.replace(/```json|```/g, '').trim();
                const plan: GeneratedPlan = JSON.parse(cleanJson);
                setGeneratedPlan(plan);
                setStatus('review');
            } catch (jsonError) {
                console.error("JSON Parse Error:", jsonError);
                throw new Error("Failed to parse AI response. Please try again.");
            }
        } catch (error) {
            console.error(error);
            setErrorMsg("AI Service Unavailable. Please check your connection and try again.");
            setStatus('error');
        }
    };

    const handleSave = () => {
        if (!generatedPlan) return;
        onSave({ 
            name: generatedPlan.name || name, 
            level, 
            content: generatedPlan.description,
            preWorkout: generatedPlan.preWorkout,
            mainWorkout: generatedPlan.mainWorkout,
            finisher: generatedPlan.finisher
        }, selectedMemberId ? Number(selectedMemberId) : undefined);
        onClose();
    };

    const renderExerciseSection = useCallback((title: string, exercises: WorkoutExercise[], colorClass: string) => (
        <div className="mb-4">
            <h5 className={`font-bold text-xs uppercase tracking-widest mb-2 ${colorClass}`}>{title}</h5>
            <div className="space-y-2">
                {exercises.map((ex, idx) => (
                    <div key={idx} className="flex flex-col gap-1 bg-gray-800/50 p-2 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="flex-grow">
                                <h5 className="font-bold text-white text-xs">{ex.name}</h5>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 font-mono">{ex.sets} Sets</span>
                                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 font-mono">{ex.reps} Reps</span>
                                </div>
                            </div>
                        </div>
                        {ex.notes && (
                            <div className="mt-1 text-[10px] text-amber-200/70 italic border-t border-gray-700/50 pt-1">
                                {ex.notes}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    ), []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Workout Architect">
            <div className="flex flex-col h-[70vh]">
                
                {(status === 'generating' || status === 'refining') && (
                    <div className="w-full bg-gray-700 h-1.5 mb-4 rounded-full overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300 ease-out" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-4 text-center">
                        <p className="text-red-400 font-bold mb-2">Generation Failed</p>
                        <p className="text-sm text-gray-300">{errorMsg}</p>
                        <button 
                            onClick={() => setStatus('idle')}
                            className="mt-3 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {status === 'idle' && (
                    <div className="space-y-4 overflow-y-auto pr-2 flex-grow custom-scrollbar">
                        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg flex items-start gap-3">
                            <BotIcon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"/>
                            <p className="text-sm text-blue-200">
                                I design hyper-personalized workout routines based on biomechanics and goals. Fill out the details below to start a new workflow.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Select Member (Optional)</label>
                                <select 
                                    value={selectedMemberId} 
                                    onChange={e => setSelectedMemberId(e.target.value ? Number(e.target.value) : '')} 
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">-- Custom Template (No Member) --</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.loginId || m.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Plan Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white focus:ring-amber-500 focus:border-amber-500" placeholder="e.g., Summer Shred Phase 1" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Fitness Level</label>
                                <select value={level} onChange={e => setLevel(e.target.value as any)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white">
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                    <option>Pro Advance</option>
                                </select>
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Primary Goal</label>
                                <select value={goal} onChange={e => setGoal(e.target.value as any)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white">
                                    <option>General Fitness</option>
                                    <option>Muscle Gain</option>
                                    <option>Fat Loss</option>
                                    <option>Strength</option>
                                    <option>Endurance</option>
                                    <option>Flexibility</option>
                                </select>
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Focus Area</label>
                                <select value={structure} onChange={e => setStructure(e.target.value as any)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white">
                                    <option>Full Body</option>
                                    <option>Push/Pull/Legs</option>
                                    <option>Upper/Lower Split</option>
                                    <option>Cardio Focus</option>
                                    <option>Core & Abs</option>
                                    <option>HIIT</option>
                                </select>
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Frequency (Days/Week): <span className="text-amber-400 font-bold">{daysPerWeek}</span></label>
                                <input type="range" min="1" max="7" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-3" />
                            </div>
                            
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-1">Specific Constraints / Notes</label>
                                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-white" placeholder="e.g., Knee injury (low impact), Home workout (dumbbells only)..." />
                            </div>
                        </div>
                    </div>
                )}

                {(status === 'generating' || status === 'refining') && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                        <div className="relative mb-6">
                            <SparkleIcon className="w-16 h-16 text-amber-400 animate-spin-slow" />
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {status === 'generating' ? 'Designing Scientific Protocol...' : 'Refining Plan based on Feedback...'}
                        </h3>
                        <p className="text-gray-400 text-sm mb-8">
                            Analyzing {goal} strategies for {level} level intensity. Calculating RPE & Volume.
                        </p>
                        
                        {/* Skeleton Loader */}
                        <div className="w-full max-w-md space-y-4 animate-pulse">
                            <div className="h-6 bg-gray-700/50 rounded w-1/3 mx-auto"></div>
                            <div className="space-y-2">
                                <div className="h-12 bg-gray-800/50 rounded-xl w-full"></div>
                                <div className="h-12 bg-gray-800/50 rounded-xl w-full"></div>
                                <div className="h-12 bg-gray-800/50 rounded-xl w-full"></div>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'review' && generatedPlan && (
                    <ReviewScreenContent 
                        generatedPlan={generatedPlan} 
                        structure={structure} 
                        renderExerciseSection={renderExerciseSection} 
                    />
                )}

                <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-gray-700">
                    {status === 'idle' ? (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors">Cancel</button>
                            <button 
                                onClick={handleGenerate} 
                                disabled={!name}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <SparkleIcon className="w-5 h-5 mr-2" /> Generate Plan
                            </button>
                        </>
                    ) : status === 'review' ? (
                        <>
                            <button onClick={() => setStatus('idle')} className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors">Discard & Restart</button>
                            <button 
                                onClick={handleSave} 
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center transition-all"
                            >
                                <CheckCircleIcon className="w-5 h-5 mr-2" /> Save to Library
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </Modal>
    );
};

export default AIWorkoutGeneratorModal;
