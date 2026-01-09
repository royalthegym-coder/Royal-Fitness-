
import React, { useState } from 'react';
import Modal from './Modal';
import { generateAIWorkoutTemplate } from '../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import { WorkoutTemplate } from '../../types';

interface AIWorkoutGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; content: string }) => void;
}

const AIWorkoutGeneratorModal: React.FC<AIWorkoutGeneratorModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
    const [goal, setGoal] = useState<'Muscle Gain' | 'Fat Loss' | 'Strength' | 'General Fitness'>('General Fitness');
    const [structure, setStructure] = useState<'Full Body' | 'Push/Pull/Legs' | 'Upper/Lower Split'>('Push/Pull/Legs');
    const [daysPerWeek, setDaysPerWeek] = useState(3);
    const [notes, setNotes] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');

    const handleGenerate = async () => {
        if (!name) {
            alert("Please provide a name for the workout plan.");
            return;
        }
        setIsLoading(true);
        setGeneratedContent('');
        try {
            const content = await generateAIWorkoutTemplate({
                name, level, goal, structure, daysPerWeek, notes
            });
            setGeneratedContent(content);
        } catch (error) {
            console.error("Failed to generate workout plan:", error);
            setGeneratedContent("Sorry, an error occurred while generating the plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (!generatedContent || !name) return;
        onSave({ name, level, content: generatedContent });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Workout Template Generator">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                {!generatedContent ? (
                    <>
                        <p className="text-sm text-gray-400">Provide the details for the workout plan you want to create.</p>
                        {/* Form fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Plan Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2" placeholder="e.g., Hypertrophy Phase 1" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300">Fitness Level</label>
                                <select value={level} onChange={e => setLevel(e.target.value as any)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300">Primary Goal</label>
                                <select value={goal} onChange={e => setGoal(e.target.value as any)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                                    <option>General Fitness</option>
                                    <option>Muscle Gain</option>
                                    <option>Fat Loss</option>
                                    <option>Strength</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300">Workout Structure</label>
                                <select value={structure} onChange={e => setStructure(e.target.value as any)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2">
                                    <option>Push/Pull/Legs</option>
                                    <option>Full Body</option>
                                    <option>Upper/Lower Split</option>
                                </select>
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300">Days Per Week: {daysPerWeek}</label>
                                <input type="range" min="1" max="7" value={daysPerWeek} onChange={e => setDaysPerWeek(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                            </div>
                             <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300">Additional Notes</label>
                                <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2" placeholder="e.g., Focus on free weights, include core work..." />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-700">
                             <button onClick={handleGenerate} disabled={isLoading || !name.trim()} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 disabled:bg-gray-600 flex items-center justify-center">
                                <SparkleIcon className="w-5 h-5 mr-2" />
                                {isLoading ? 'Generating Plan...' : 'Generate with AI'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div>
                         <h4 className="font-semibold text-amber-400 mb-2">Generated Plan: {name}</h4>
                         <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                            <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br />') }} />
                         </div>
                         <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-700">
                            <button onClick={() => setGeneratedContent('')} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500">
                                &larr; Back to Form
                            </button>
                            <button onClick={handleSave} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400">
                                Save as Template
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AIWorkoutGeneratorModal;
    