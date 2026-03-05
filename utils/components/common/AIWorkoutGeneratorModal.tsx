
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { getComplexResponse } from '../../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BotIcon } from '../icons/BotIcon';
import { getMediaForExercise } from './ExerciseDemoModal';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';
import { WorkoutExercise, WorkoutSection } from '../../../types';

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
    }) => void;
}

interface GeneratedPlan {
    name: string;
    description: string;
    preWorkout?: WorkoutSection;
    mainWorkout: WorkoutSection[];
    finisher?: WorkoutSection;
}

const AIWorkoutGeneratorModal: React.FC<AIWorkoutGeneratorModalProps> = ({ isOpen, onClose, onSave }) => {
    // Form State
    const [name, setName] = useState('');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance'>('Intermediate');
    const [goal, setGoal] = useState<'Muscle Gain' | 'Fat Loss' | 'Strength' | 'General Fitness' | 'Endurance' | 'Flexibility'>('General Fitness');
    const [structure, setStructure] = useState<'Full Body' | 'Push/Pull/Legs' | 'Upper/Lower Split' | 'Cardio Focus' | 'Core & Abs' | 'HIIT'>('Push/Pull/Legs');
    const [daysPerWeek, setDaysPerWeek] = useState(3);
    const [notes, setNotes] = useState('');

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
                Create a detailed, scientific gym workout plan.
                Name: ${name}
                Level: ${level}
                Goal: ${goal}
                Split: ${structure}
                Freq: ${daysPerWeek} days/week
                Notes: ${notes}

                Format strictly as JSON matching this schema:
                {
                    "name": "string",
                    "description": "string (Explain the science/periodization)",
                    "preWorkout": { "name": "Warmup", "exercises": [{ "name": "string", "sets": "string", "reps": "string" }] },
                    "mainWorkout": [
                        { "name": "Section Name (e.g. Compound Lifts)", "exercises": [{ "name": "string", "sets": "string", "reps": "string" }] }
                    ],
                    "finisher": { "name": "Finisher", "exercises": [{ "name": "string", "sets": "string", "reps": "string" }] }
                }
                
                Ensure exercises are standard gym movements.
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
        });
        onClose();
    };

    const renderExerciseSection = (title: string, exercises: WorkoutExercise[], colorClass: string) => (
        <div className="mb-4">
            <h5 className={`font-bold text-xs uppercase tracking-widest mb-2 ${colorClass}`}>{title}</h5>
            <div className="space-y-2">
                {exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-800/50 p-2 rounded-xl border border-gray-700">
                        <div className="flex-grow">
                            <h5 className="font-bold text-white text-xs">{ex.name}</h5>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 font-mono">{ex.sets} Sets</span>
                                <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 font-mono">{ex.reps} Reps</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

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
                        <p className="text-gray-400 text-sm">
                            Analyzing {goal} strategies for {level} level intensity. Calculating RPE & Volume.
                        </p>
                    </div>
                )}

                {status === 'review' && generatedPlan && (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="bg-gray-800 p-3 rounded-t-lg border-b border-gray-700 flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-bold text-white truncate pr-2 text-lg">{generatedPlan.name}</h4>
                                <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{structure}</span>
                            </div>
                            <p className="text-sm text-gray-400 italic">{generatedPlan.description}</p>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto bg-gray-900 p-4 border border-gray-700 border-t-0 custom-scrollbar">
                            {generatedPlan.preWorkout && renderExerciseSection(generatedPlan.preWorkout.name || 'Pre-Workout', generatedPlan.preWorkout.exercises, 'text-cyan-400')}
                            
                            {generatedPlan.mainWorkout.map((section, idx) => (
                                <div key={idx}>
                                    {renderExerciseSection(section.name || 'Main Routine', section.exercises, 'text-amber-400')}
                                </div>
                            ))}

                            {generatedPlan.finisher && renderExerciseSection(generatedPlan.finisher.name || 'Finisher', generatedPlan.finisher.exercises, 'text-red-400')}
                        </div>
                    </div>
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
