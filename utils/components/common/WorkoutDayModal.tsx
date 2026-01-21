
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Member, DailySchedule, WorkoutExercise } from '../../../types';
import { INITIAL_WORKOUT_TEMPLATES } from '../../../constants';
import ExerciseDemoModal, { getMediaForExercise } from './ExerciseDemoModal';
import { VideoCameraIcon } from '../icons/VideoCameraIcon';

interface WorkoutDayModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    member: Member;
    schedule: DailySchedule | null;
    onSave: (date: Date, schedule: DailySchedule) => void;
}

const WorkoutDayModal: React.FC<WorkoutDayModalProps> = ({ isOpen, onClose, date, member, schedule, onSave }) => {
    const [templateId, setTemplateId] = useState<number | ''>(schedule?.templateId || '');
    const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
    const [isRestDay, setIsRestDay] = useState(schedule?.isRestDay || false);
    const [demoModalExercise, setDemoModalExercise] = useState<string | null>(null);

    const getExercisesFromTemplate = (tid: number): WorkoutExercise[] => {
        const t = INITIAL_WORKOUT_TEMPLATES.find(temp => temp.id === tid);
        if (!t) return [];
        // If template has explicit exercises list
        if (t.exercises) return [...t.exercises];
        // If template has sections, flatten them
        if (t.sections) return t.sections.flatMap(s => s.exercises);
        return [];
    };

    useEffect(() => {
        setTemplateId(schedule?.templateId || '');
        setIsRestDay(schedule?.isRestDay || false);
        
        if (schedule?.exercises && schedule.exercises.length > 0) {
             setExercises(schedule.exercises);
        } else if (schedule?.templateId) {
             setExercises(getExercisesFromTemplate(schedule.templateId));
        } else {
             setExercises([]);
        }
    }, [schedule, isOpen]);

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTemplateId = e.target.value ? parseInt(e.target.value, 10) : '';
        setTemplateId(newTemplateId);
        setIsRestDay(false);
        if (newTemplateId) {
            setExercises(getExercisesFromTemplate(newTemplateId));
        } else {
            setExercises([]);
        }
    };
    
    const handleExerciseChange = (index: number, field: keyof WorkoutExercise, value: string) => {
        const newExercises = [...exercises];
        newExercises[index] = { ...newExercises[index], [field]: value };
        setExercises(newExercises);
        setTemplateId(''); // Customizing exercises detaches from template
    };
    
    const addExercise = () => {
        setExercises([...exercises, { name: '', sets: '', reps: '' }]);
        setTemplateId('');
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
        setTemplateId('');
    };

    const handleMarkAsRestDay = () => {
        onSave(date, { isRestDay: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(date, {
            templateId: templateId || undefined,
            exercises: templateId ? undefined : exercises, // Only save custom exercises if not using template
            isRestDay: false,
        });
    };
    
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Plan for ${member.name}`}>
            <h4 className="text-lg font-semibold text-amber-400 mb-4">{formattedDate}</h4>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Apply a Template</label>
                    <select
                        value={templateId}
                        onChange={handleTemplateChange}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-amber-500"
                    >
                        <option value="">-- Custom Workout --</option>
                        {INITIAL_WORKOUT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                
                <h5 className="font-semibold text-gray-300 pt-2 border-t border-gray-700">Exercises</h5>
                {isRestDay ? (
                    <p className="text-center text-gray-400 py-4">This is a rest day.</p>
                ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {exercises.map((ex, index) => (
                            <div key={index} className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
                                <div 
                                    className="w-12 h-12 bg-black rounded flex-shrink-0 overflow-hidden border border-gray-600 group relative cursor-pointer"
                                    onClick={() => setDemoModalExercise(ex.name)}
                                    title="View Form Demo"
                                >
                                    <img 
                                        src={getMediaForExercise(ex.name)} 
                                        alt="demo" 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" 
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <VideoCameraIcon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-12 gap-2 flex-grow">
                                    <input type="text" value={ex.name} onChange={e => handleExerciseChange(index, 'name', e.target.value)} placeholder="Exercise Name" className="col-span-5 bg-gray-700 border border-gray-600 p-1.5 rounded text-sm text-white focus:border-amber-500 outline-none"/>
                                    <input type="text" value={ex.sets} onChange={e => handleExerciseChange(index, 'sets', e.target.value)} placeholder="Sets" className="col-span-2 bg-gray-700 border border-gray-600 p-1.5 rounded text-sm text-white focus:border-amber-500 outline-none"/>
                                    <input type="text" value={ex.reps} onChange={e => handleExerciseChange(index, 'reps', e.target.value)} placeholder="Reps" className="col-span-2 bg-gray-700 border border-gray-600 p-1.5 rounded text-sm text-white focus:border-amber-500 outline-none"/>
                                    <button type="button" onClick={() => removeExercise(index)} className="col-span-3 text-red-400 hover:text-red-300 text-xs font-bold uppercase border border-red-900/30 bg-red-900/10 rounded">Remove</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={addExercise} className="w-full py-2 border border-dashed border-gray-600 text-gray-400 hover:text-white hover:border-amber-500 rounded text-sm transition-colors">
                            + Add Exercise
                        </button>
                    </div>
                )}


                <div className="flex justify-between pt-4 mt-4 border-t border-gray-700">
                    <button type="button" onClick={handleMarkAsRestDay} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                        Mark as Rest Day
                    </button>
                    <div>
                         <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 mr-2 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors shadow-lg">
                            Save Plan
                        </button>
                    </div>
                </div>
            </form>
            <ExerciseDemoModal 
                isOpen={!!demoModalExercise} 
                onClose={() => setDemoModalExercise(null)} 
                exerciseName={demoModalExercise || ''} 
            />
        </Modal>
    );
};

export default WorkoutDayModal;
