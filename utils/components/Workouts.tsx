
import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutTemplate, WorkoutExercise, Member, WorkoutSection } from '../../types';
import { INITIAL_WORKOUT_TEMPLATES } from '../../constants';
import Card from './common/Card';
import { DumbbellIcon } from './icons/DumbbellIcon';
import ExerciseDemoModal, { getExerciseByName } from './common/ExerciseDemoModal';
import SmartExerciseLibrary from './SmartExerciseLibrary';
import { useData } from '../context/DataProvider';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { Zap, ShieldCheck, Trophy, Layers, Video, ArrowRight, Activity, PlayCircle, Calendar, Clock, Users, Flame, Plus, Trash2, Edit3, Save, BarChart3, Radio, Grip, X } from 'lucide-react';
import AIWorkoutGeneratorModal from './common/AIWorkoutGeneratorModal';
import { SparkleIcon } from './icons/SparkleIcon';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useToast } from '../hooks/useToast';
import Modal from './common/Modal';
import LiveTrainingHUD from './member/LiveTrainingHUD';

// --- WEEKLY CLASS SCHEDULE DATA ---
const WEEKLY_CLASSES = [
    { id: 1, day: 'Mon', time: '06:00 AM', title: 'Morning Blitz', trainer: 'Ravi Kumar', type: 'HIIT', duration: '45m', capacity: 20, booked: 18 },
    { id: 2, day: 'Mon', time: '06:00 PM', title: 'Strength 101', trainer: 'Mahesh Saini', type: 'Strength', duration: '60m', capacity: 25, booked: 25 },
    { id: 3, day: 'Tue', time: '07:00 AM', title: 'Yoga Flow', trainer: 'Priya', type: 'Flexibility', duration: '60m', capacity: 30, booked: 12 },
    { id: 4, day: 'Wed', time: '06:00 AM', title: 'Cardio Burn', trainer: 'Ravi Kumar', type: 'Cardio', duration: '45m', capacity: 20, booked: 15 },
    { id: 5, day: 'Wed', time: '07:00 PM', title: 'Powerlifting', trainer: 'Sangram Singh', type: 'Strength', duration: '90m', capacity: 15, booked: 10 },
    { id: 6, day: 'Fri', time: '06:00 PM', title: 'Zumba Party', trainer: 'Guest', type: 'Aerobics', duration: '60m', capacity: 40, booked: 35 },
    { id: 7, day: 'Sat', time: '08:00 AM', title: 'CrossFit Challenge', trainer: 'Mahesh Saini', type: 'HIIT', duration: '60m', capacity: 20, booked: 20 },
];

// --- SUB-COMPONENTS ---

const WorkoutTemplateCard: React.FC<{ 
    template: WorkoutTemplate; 
    onAssign?: () => void;
    onEdit?: () => void;
    isAdmin?: boolean;
}> = ({ template, onAssign, onEdit, isAdmin }) => {
    const [demoModalExercise, setDemoModalExercise] = useState<string | null>(null);

    const getLevelConfig = (level: string) => {
        if (level === 'Beginner') return { color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', shadow: 'shadow-green-500/20' };
        if (level === 'Intermediate') return { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', shadow: 'shadow-amber-500/20' };
        return { color: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10', shadow: 'shadow-red-500/20' };
    };

    const config = getLevelConfig(template.level);

    // Normalize exercises or sections for preview
    const sections = template.sections || (template.exercises ? [{ name: 'Main Routine', exercises: template.exercises }] : []);
    
    // Flatten for volume calculation
    const allExercises = sections.flatMap(s => s.exercises);
    const estimatedLoad = allExercises.reduce((acc, ex) => acc + (parseInt(ex.sets) * parseInt(ex.reps.split('-')[0] || '10')), 0);

    return (
        <div className={`relative flex flex-col h-full bg-[#0c0c0c] border-2 rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl ${config.border} ${config.shadow}`}>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            <div className={`absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-700 ${config.color}`}>
                <DumbbellIcon className="w-32 h-32" />
            </div>
            
            <div className="p-8 flex-grow relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mb-3 ${config.bg} ${config.color} ${config.border}`}>
                            <Activity className="w-3 h-3 mr-1.5" />
                            {template.level} Level
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                            {template.name}
                        </h3>
                    </div>
                    {isAdmin && (
                        <button onClick={onEdit} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}
                </div>
                
                <p className="text-xs text-gray-400 mb-6 leading-relaxed font-medium border-l-2 border-white/10 pl-3 line-clamp-2">
                    {template.description}
                </p>
                
                <div className="space-y-4 max-h-48 overflow-y-auto custom-scrollbar">
                    {sections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-2">
                            {section.name && (
                                <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                    {section.name}
                                </h5>
                            )}
                            {section.exercises.map((ex, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <span className="text-gray-200 font-bold">{ex.name}</span>
                                    <div className="flex gap-3 text-[10px] font-mono text-gray-500">
                                        <span>{ex.sets} SETS</span>
                                        <span className={config.color}>{ex.reps}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <span>Est. Vol: {estimatedLoad * 50} kg</span>
                    <span>CNS Impact: {estimatedLoad > 200 ? 'HIGH' : 'MOD'}</span>
                </div>
            </div>
            
            <div className="p-4 bg-black/40 border-t border-white/5 grid grid-cols-2 gap-3 relative z-10 backdrop-blur-md">
                <button 
                    onClick={() => setDemoModalExercise(allExercises[0]?.name || '')}
                    className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl text-[10px] uppercase tracking-widest border border-white/10 transition-all group/btn"
                >
                    <PlayCircle className="w-4 h-4 group-hover/btn:text-cyan-400 transition-colors" /> Preview
                </button>
                <button 
                    onClick={onAssign}
                    className={`flex items-center justify-center gap-2 text-black font-black py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 ${template.level === 'Beginner' ? 'bg-green-500 hover:bg-green-400' : template.level === 'Intermediate' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-red-600 hover:bg-red-500 text-white'}`}
                >
                    {isAdmin ? 'Deploy' : 'Start'} <ArrowRight className="w-3 h-3" />
                </button>
            </div>
            <ExerciseDemoModal isOpen={!!demoModalExercise} onClose={() => setDemoModalExercise(null)} exerciseName={demoModalExercise || ''} />
        </div>
    );
};

const WeeklyScheduleView = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'short' });
    const currentHour = new Date().getHours();
    
    return (
        <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {days.map(day => {
                    const isToday = day === currentDay;
                    return (
                        <div key={day} className={`space-y-3 ${isToday ? 'opacity-100' : 'opacity-70 hover:opacity-100 transition-opacity'}`}>
                            <div className={`p-3 text-center rounded-xl border ${isToday ? 'bg-amber-500 text-black border-amber-400' : 'bg-gray-900 border-white/5 text-gray-400'}`}>
                                <span className="font-black uppercase text-sm tracking-widest">{day}</span>
                            </div>
                            <div className="space-y-3 min-h-[200px]">
                                {WEEKLY_CLASSES.filter(c => c.day === day).map(cls => {
                                    const classHour = parseInt(cls.time.split(':')[0]) + (cls.time.includes('PM') && cls.time !== '12:00 PM' ? 12 : 0);
                                    const isLive = isToday && currentHour === classHour;
                                    const occupancy = (cls.booked / cls.capacity) * 100;
                                    
                                    return (
                                        <div key={cls.id} className={`bg-[#111] border p-3 rounded-2xl transition-all group cursor-pointer relative overflow-hidden ${isLive ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'border-white/5 hover:border-amber-500/30'}`}>
                                            {isLive && (
                                                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-green-500/20 px-2 py-0.5 rounded text-[8px] font-black text-green-400 uppercase tracking-wider animate-pulse">
                                                    <Radio className="w-3 h-3" /> Live
                                                </div>
                                            )}
                                            <div className={`absolute top-0 left-0 w-1 h-full ${cls.type === 'HIIT' ? 'bg-red-500' : cls.type === 'Strength' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                            <div className="pl-3">
                                                <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{cls.title}</p>
                                                <p className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {cls.time} ({cls.duration})
                                                </p>
                                                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                    <Users className="w-3 h-3" /> {cls.trainer}
                                                </p>
                                                
                                                <div className="mt-3">
                                                    <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase mb-1">
                                                        <span>Occupancy</span>
                                                        <span>{cls.booked}/{cls.capacity}</span>
                                                    </div>
                                                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${occupancy > 90 ? 'bg-red-500' : occupancy > 50 ? 'bg-amber-500' : 'bg-green-500'}`} 
                                                            style={{ width: `${occupancy}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {WEEKLY_CLASSES.filter(c => c.day === day).length === 0 && (
                                    <div className="p-4 border-2 border-dashed border-white/5 rounded-xl text-center h-24 flex items-center justify-center">
                                        <p className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">Rest Day</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <Card className="bg-gray-900 border-white/5">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> HIIT/Cardio</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Strength</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-sm"></span> Yoga/Flex</div>
                    <div className="ml-auto font-mono text-[10px] text-gray-600 uppercase">System Time: {new Date().toLocaleTimeString()}</div>
                </div>
            </Card>
        </div>
    );
};

const ProtocolEditor: React.FC<{ 
    initialData?: WorkoutTemplate; 
    onSave: (t: WorkoutTemplate) => void; 
    onCancel: () => void 
}> = ({ initialData, onSave, onCancel }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [level, setLevel] = useState<WorkoutTemplate['level']>(initialData?.level || 'Intermediate');
    const [description, setDescription] = useState(initialData?.description || '');
    
    // Initialize sections. Use initialData.sections if available, else convert exercises to one section
    const [sections, setSections] = useState<WorkoutSection[]>(
        initialData?.sections || 
        (initialData?.exercises && initialData.exercises.length > 0 
            ? [{ name: 'Main Routine', exercises: initialData.exercises }] 
            : [{ name: 'Warmup', exercises: [] }])
    );
    
    // Flatten for stats
    const allExercises = sections.flatMap(s => s.exercises);
    const volumeLoad = allExercises.reduce((acc, ex) => acc + (parseInt(ex.sets || '0') * 10), 0); 
    
    const muscleDistribution = useMemo(() => {
        const dist: any = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0 };
        allExercises.forEach(ex => {
            const data = getExerciseByName(ex.name);
            if (dist[data.category] !== undefined) dist[data.category] += parseInt(ex.sets || '0');
        });
        return Object.keys(dist).map(key => ({ name: key, sets: dist[key] }));
    }, [allExercises]);

    const handleAddSection = () => {
        setSections([...sections, { name: 'New Section', exercises: [] }]);
    };

    const handleRemoveSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const handleSectionNameChange = (index: number, newName: string) => {
        const updated = [...sections];
        updated[index].name = newName;
        setSections(updated);
    };

    const handleAddExerciseToSection = (sectionIndex: number) => {
        const updated = [...sections];
        updated[sectionIndex].exercises.push({ name: '', sets: '3', reps: '10-12' });
        setSections(updated);
    };

    const handleUpdateExercise = (sectionIndex: number, exerciseIndex: number, field: keyof WorkoutExercise, value: string) => {
        const updated = [...sections];
        updated[sectionIndex].exercises[exerciseIndex] = { 
            ...updated[sectionIndex].exercises[exerciseIndex], 
            [field]: value 
        };
        setSections(updated);
    };

    const handleRemoveExercise = (sectionIndex: number, exerciseIndex: number) => {
        const updated = [...sections];
        updated[sectionIndex].exercises = updated[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex);
        setSections(updated);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Protocol Blueprint" className="bg-gray-900 border-white/5">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Protocol Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-500"
                                placeholder="e.g. Hypertrophy Phase 1"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Difficulty</label>
                            <select 
                                value={level} 
                                onChange={(e) => setLevel(e.target.value as any)} 
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-500"
                            >
                                <option>Beginner</option>
                                <option>Intermediate</option>
                                <option>Advanced</option>
                                <option>Elite</option>
                            </select>
                        </div>
                         <div className="col-span-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 resize-none h-20"
                                placeholder="Brief overview of the routine goals..."
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {sections.map((section, sIdx) => (
                            <div key={sIdx} className="bg-black/30 p-4 rounded-2xl border border-white/5 relative group/section">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2 flex-1">
                                        <Grip className="w-4 h-4 text-gray-600 cursor-move" />
                                        <input 
                                            type="text" 
                                            value={section.name} 
                                            onChange={(e) => handleSectionNameChange(sIdx, e.target.value)}
                                            className="bg-transparent text-sm font-black uppercase tracking-widest text-amber-500 outline-none w-full"
                                            placeholder="SECTION NAME"
                                        />
                                    </div>
                                    <button onClick={() => handleRemoveSection(sIdx)} className="text-red-500 hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {section.exercises.map((ex, exIdx) => (
                                        <div key={exIdx} className="flex gap-2 items-center bg-black/60 p-2 rounded-xl border border-white/5">
                                            <span className="text-gray-600 font-mono w-6 text-center text-xs">{exIdx+1}</span>
                                            <input 
                                                type="text" 
                                                value={ex.name} 
                                                onChange={(e) => handleUpdateExercise(sIdx, exIdx, 'name', e.target.value)}
                                                placeholder="Exercise Name"
                                                className="flex-1 bg-transparent text-sm text-white font-bold outline-none"
                                            />
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    value={ex.sets} 
                                                    onChange={(e) => handleUpdateExercise(sIdx, exIdx, 'sets', e.target.value)}
                                                    className="w-12 bg-gray-800 rounded p-1 text-center text-xs text-white outline-none focus:border-amber-500 border border-transparent"
                                                    placeholder="Sets"
                                                />
                                                <span className="text-gray-600 text-xs">x</span>
                                                <input 
                                                    type="text" 
                                                    value={ex.reps} 
                                                    onChange={(e) => handleUpdateExercise(sIdx, exIdx, 'reps', e.target.value)}
                                                    className="w-16 bg-gray-800 rounded p-1 text-center text-xs text-white outline-none focus:border-amber-500 border border-transparent"
                                                    placeholder="Reps"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveExercise(sIdx, exIdx)}
                                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                                            >
                                                <X className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => handleAddExerciseToSection(sIdx)}
                                        className="w-full py-2 border border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 rounded-lg text-[10px] uppercase font-bold transition-all"
                                    >
                                        + Add Movement
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleAddSection}
                        className="w-full mt-6 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Section
                    </button>
                </Card>
                
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="px-6 py-3 text-gray-400 font-bold hover:text-white">Discard</button>
                    <button 
                        onClick={() => onSave({ id: initialData?.id || Date.now(), name, level, category: 'Strength', description, sections } as any)}
                        className="bg-green-600 text-white font-black px-8 py-3 rounded-xl shadow-lg hover:bg-green-500 transition-all flex items-center gap-2 uppercase tracking-widest text-xs"
                    >
                        <Save className="w-4 h-4" /> Save Protocol
                    </button>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card title="Scientific Audit" className="bg-black border-cyan-500/20">
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={muscleDistribution}>
                                <XAxis dataKey="name" fontSize={10} stroke="#666" />
                                <YAxis hide />
                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                <Bar dataKey="sets" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Total Exercises</span>
                            <span className="text-white font-mono">{allExercises.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Est. Volume Load</span>
                            <span className="text-white font-mono">{volumeLoad * 10} kg</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Est. Duration</span>
                            <span className="text-white font-mono">{allExercises.length * 4} mins</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Intensity (RPE)</span>
                            <span className="text-amber-400 font-mono">8-9 (High)</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- ASSIGNMENT MODAL ---
const AssignmentModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    template: WorkoutTemplate | null;
    members: Member[];
    onConfirm: (memberId: number) => void; 
}> = ({ isOpen, onClose, template, members, onConfirm }) => {
    const [selectedId, setSelectedId] = useState<number | ''>('');
    
    if (!isOpen || !template) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Deploy Protocol: ${template.name}`}>
            <div className="space-y-6">
                <div className="p-4 bg-gray-900 border border-white/5 rounded-2xl">
                    <p className="text-gray-400 text-xs mb-2">Target Protocol</p>
                    <p className="text-white font-black uppercase italic">{template.name}</p>
                    <p className="text-cyan-400 text-xs font-mono mt-1">{template.level} / {template.category}</p>
                </div>
                
                <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block ml-2">Select Athlete Node</label>
                    <select 
                        value={selectedId} 
                        onChange={(e) => setSelectedId(Number(e.target.value))}
                        className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500"
                    >
                        <option value="">-- Choose Member --</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button onClick={onClose} className="flex-1 py-3 text-xs font-black uppercase text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button 
                        onClick={() => { if(selectedId) onConfirm(Number(selectedId)); }}
                        disabled={!selectedId}
                        className="flex-[2] bg-cyan-600 text-white font-black py-3 rounded-2xl uppercase tracking-widest text-xs shadow-xl disabled:opacity-50"
                    >
                        Confirm Assignment
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const Workouts: React.FC = () => {
    const { addToast } = useToast();
    const { members, updateMember, addAuditLog, workoutTemplates, addWorkoutTemplate, updateWorkoutTemplate } = useData();
    
    const [activeTab, setActiveTab] = useState<'schedule' | 'weekly_grid' | 'library' | 'editor'>('weekly_grid');
    const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Elite'>('Beginner');
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    
    // Live Mirror Testing
    const [liveModeExercise, setLiveModeExercise] = useState<WorkoutExercise | null>(null);

    // Removed local templates state
    const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | undefined>(undefined);
    
    // Assignment State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTemplate, setAssignTemplate] = useState<WorkoutTemplate | null>(null);

    const filteredTemplates = useMemo(() => {
        return workoutTemplates.filter(t => t.level === selectedLevel);
    }, [selectedLevel, workoutTemplates]);

    const handleSaveGeneratedPlan = (newPlan: { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; content?: string; exercises?: WorkoutExercise[] }) => {
        const newTemplate: WorkoutTemplate = {
            id: Date.now(),
            name: newPlan.name,
            level: newPlan.level,
            category: 'Custom AI',
            description: newPlan.content || "AI Generated Custom Protocol",
            exercises: newPlan.exercises || []
        };
        addWorkoutTemplate(newTemplate);
        setSelectedLevel(newPlan.level); 
    };

    const handleEditSave = (t: WorkoutTemplate) => {
        if (editingTemplate) {
            updateWorkoutTemplate(t);
        } else {
            addWorkoutTemplate(t);
        }
        setActiveTab('schedule');
        setEditingTemplate(undefined);
    };

    // --- INTEGRATION: ASSIGN WORKOUT ---
    const handleAssign = (memberId: number) => {
        if (!assignTemplate) return;
        const member = members.find(m => m.id === memberId);
        if (member) {
            // Update the member with the new plan in Context
            updateMember({ 
                ...member, 
                approvedAiPlan: assignTemplate.name, // In a real app, this would be a full object reference
                // You might also want to set an active schedule or today's workout
            }); 

            // Log it
            addAuditLog({
                member_id: memberId,
                action: 'PLAN_ASSIGN',
                details: `Workout '${assignTemplate.name}' assigned by Admin.`
            });

            addToast(`Protocol "${assignTemplate.name}" deployed to ${member.name}.`, "success");
            setIsAssignModalOpen(false);
            setAssignTemplate(null);
        }
    };

    if (liveModeExercise) {
        return <LiveTrainingHUD exercise={liveModeExercise.name} sets={liveModeExercise.sets} onClose={() => setLiveModeExercise(null)} />;
    }

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="bg-[#050505] p-10 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-amber-500 to-red-600"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            <Layers className="w-12 h-12 text-cyan-500" /> 
                            Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Schedule</span>
                        </h1>
                        <p className="text-gray-500 font-mono text-xs tracking-[0.6em] mt-3 uppercase font-bold pl-1">Scientific Periodization & Class Management</p>
                    </div>
                    
                    <div className="flex gap-4">
                         <button 
                            onClick={() => setIsGeneratorOpen(true)}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"
                        >
                            <SparkleIcon className="w-4 h-4 text-yellow-300" /> AI Generator
                        </button>
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                             <button 
                                onClick={() => setActiveTab('weekly_grid')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'weekly_grid' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Calendar className="w-4 h-4 inline mr-2"/> Weekly Grid
                            </button>
                            <button 
                                onClick={() => setActiveTab('schedule')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'schedule' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <Layers className="w-4 h-4 inline mr-2"/> Templates
                            </button>
                            <button 
                                onClick={() => setActiveTab('library')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'library' ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                Library
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'weekly_grid' && <WeeklyScheduleView />}
            
            {activeTab === 'editor' && (
                <ProtocolEditor 
                    initialData={editingTemplate} 
                    onSave={handleEditSave} 
                    onCancel={() => { setActiveTab('schedule'); setEditingTemplate(undefined); }} 
                />
            )}

            {activeTab === 'schedule' && (
                <div className="animate-slide-up">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex bg-black rounded-xl p-1 border border-white/10">
                            {[
                                { id: 'Beginner', icon: <ShieldCheck className="w-4 h-4"/> },
                                { id: 'Intermediate', icon: <Zap className="w-4 h-4"/> },
                                { id: 'Advanced', icon: <Trophy className="w-4 h-4"/> },
                                { id: 'Elite', icon: <Trophy className="w-4 h-4 text-amber-500"/> },
                            ].map((lvl) => (
                                <button 
                                    key={lvl.id}
                                    onClick={() => setSelectedLevel(lvl.id as any)}
                                    className={`px-6 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                        selectedLevel === lvl.id 
                                        ? 'bg-amber-500 text-black shadow-lg' 
                                        : 'text-gray-500 hover:text-white'
                                    }`}
                                >
                                    {lvl.icon} {lvl.id}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => { setEditingTemplate(undefined); setActiveTab('editor'); }}
                            className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 hover:bg-gray-200 transition-all"
                        >
                            <Plus className="w-4 h-4"/> Create Manually
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredTemplates.map(template => (
                            <WorkoutTemplateCard 
                                key={template.id} 
                                template={template} 
                                isAdmin={true}
                                onEdit={() => { setEditingTemplate(template); setActiveTab('editor'); }}
                                onAssign={() => { setAssignTemplate(template); setIsAssignModalOpen(true); }} 
                            />
                        ))}
                        
                        {filteredTemplates.length === 0 && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/10 rounded-3xl">
                                <p className="text-gray-500 uppercase tracking-widest mb-4">No templates found for this level</p>
                                <button onClick={() => setIsGeneratorOpen(true)} className="text-cyan-400 font-bold hover:text-white transition-colors">
                                    + Generate New with AI
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'library' && <SmartExerciseLibrary />}

            <AIWorkoutGeneratorModal 
                isOpen={isGeneratorOpen} 
                onClose={() => setIsGeneratorOpen(false)} 
                onSave={handleSaveGeneratedPlan} 
            />

            <AssignmentModal 
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                template={assignTemplate}
                members={members}
                onConfirm={handleAssign}
            />
        </div>
    );
};

export default Workouts;
