
import React, { useState, useMemo, useEffect } from 'react';
import { WorkoutTemplate, WorkoutExercise, Member, WorkoutSection } from '../../types';
import { INITIAL_WORKOUT_TEMPLATES } from '../../constants';
import Card from './common/Card';
import { DumbbellIcon } from './icons/DumbbellIcon';
import ExerciseDemoModal, { getExerciseByName } from './common/ExerciseDemoModal';
import SmartExerciseLibrary from './SmartExerciseLibrary';
import EnglishExerciseDictionary from './common/ExerciseDictionary';
import { useData } from '../context/DataProvider';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { Zap, ShieldCheck, Trophy, Layers, Video, ArrowRight, Activity, PlayCircle, Calendar, Clock, Users, Flame, Plus, Trash2, Edit3, Save, BarChart3, Radio, Grip, X, Database, FileText, Cpu, GitBranch, MessageCircle, Lock, BrainCircuit, AlertTriangle } from 'lucide-react';
import AIWorkoutGeneratorModal from './common/AIWorkoutGeneratorModal';
import SecurityLayer from './common/SecurityLayer';
import { SparkleIcon } from './icons/SparkleIcon';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useToast } from '../hooks/useToast';
import Modal from './common/Modal';
import LiveTrainingHUD from './member/LiveTrainingHUD';
import { jsPDF } from 'jspdf';
import { Download } from 'lucide-react';
import OpalsWorkoutArchitect from './OpalsWorkoutArchitect';
import WorkoutPlannerTracker from './WorkoutPlannerTracker';


// --- WEEKLY CLASS SCHEDULE DATA ---
const WEEKLY_CLASSES: Array<{ id: number; day: string; time: string; title: string; trainer: string; type: string; duration: string; capacity: number; booked: number }> = [];

// --- SUB-COMPONENTS ---

import VideoPlayerModal from './common/VideoPlayerModal';
import RestTimer from './common/RestTimer';

const WorkoutTemplateCard: React.FC<{ 
    template: WorkoutTemplate; 
    onAssign?: () => void;
    onEdit?: () => void;
    onAnalyze?: () => void;
    isAdmin?: boolean;
    onStartTimer?: (seconds: number) => void;
}> = ({ template, onAssign, onEdit, onAnalyze, isAdmin, onStartTimer }) => {
    const [demoModalExercise, setDemoModalExercise] = useState<string | null>(null);
    const [videoModalExercise, setVideoModalExercise] = useState<{name: string, url?: string} | null>(null);

    const getLevelConfig = (level: string) => {
        if (level === 'Beginner') return { color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', shadow: 'shadow-green-500/20' };
        if (level === 'Intermediate') return { color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', shadow: 'shadow-amber-500/20' };
        if (level === 'Advanced') return { color: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10', shadow: 'shadow-red-500/20' };
        return { color: 'text-purple-500', border: 'border-purple-500/30', bg: 'bg-purple-500/10', shadow: 'shadow-purple-500/20' }; // Pro Advance
    };

    const config = getLevelConfig(template.level);

    // Normalize exercises or sections for preview
    const sections = template.mainWorkout || (template.exercises ? [{ name: 'Main Routine', exercises: template.exercises }] : []);
    
    // Flatten for volume calculation
    const preExercises = template.preWorkout?.exercises || [];
    const mainExercises = sections.flatMap(s => s.exercises);
    const finisherExercises = template.finisher?.exercises || [];
    const allExercises = [...preExercises, ...mainExercises, ...finisherExercises];
    
    const estimatedLoad = allExercises.reduce((acc, ex) => acc + (parseInt(ex.sets) * parseInt(ex.reps.split('-')[0] || '10')), 0);

    const handleDownloadPDF = (e: React.MouseEvent) => {
        e.stopPropagation();
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Header
        pdf.setFillColor(20, 20, 20);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(22);
        pdf.setFont("helvetica", "bold");
        pdf.text("FITNESS FUTURE", pageWidth / 2, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.text("ADVANCED SCIENTIFIC WORKOUT PROTOCOL", pageWidth / 2, 30, { align: 'center' });

        // Title & Info
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(template.name, 20, 55);
        
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Level: ${template.level} | Category: ${template.category}`, 20, 65);
        
        pdf.setFontSize(11);
        pdf.setTextColor(50, 50, 50);
        const splitDesc = pdf.splitTextToSize(template.description, pageWidth - 40);
        pdf.text(splitDesc, 20, 75);

        let yPos = 75 + (splitDesc.length * 5) + 10;

        // Helper to render section
        const renderSection = (title: string, data?: WorkoutSection | WorkoutSection[]) => {
             if (!data) return;
             const sectionList = Array.isArray(data) ? data : [data];
             
             sectionList.forEach(sec => {
                if (yPos > 260) { pdf.addPage(); yPos = 20; }
                
                pdf.setFillColor(240, 240, 240);
                pdf.rect(20, yPos - 6, pageWidth - 40, 10, 'F');
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(12);
                pdf.setFont("helvetica", "bold");
                pdf.text(title + (sec.name ? `: ${sec.name}` : ''), 25, yPos);
                yPos += 12;

                pdf.setFontSize(10);
                pdf.setFont("helvetica", "normal");
                sec.exercises.forEach(ex => {
                    if (yPos > 280) { pdf.addPage(); yPos = 20; }
                    pdf.setTextColor(50, 50, 50);
                    pdf.text(`• ${ex.name}`, 25, yPos);
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFont("helvetica", "bold");
                    pdf.text(`${ex.sets} SETS x ${ex.reps}`, pageWidth - 25, yPos, { align: 'right' });
                    pdf.setFont("helvetica", "normal");
                    
                    // Draw a subtle line
                    pdf.setDrawColor(230, 230, 230);
                    pdf.line(25, yPos + 2, pageWidth - 25, yPos + 2);
                    
                    yPos += 8;
                });
                yPos += 5;
             });
        };

        renderSection("PRE-WORKOUT ACTIVATION", template.preWorkout);
        renderSection("MAIN WORKOUT", template.mainWorkout);
        renderSection("FINISHER / METABOLIC", template.finisher);

        // Footer
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text("Generated by Fitness Future - AI Training Engine", pageWidth / 2, 290, { align: 'center' });

        pdf.save(`Future_Workout_${template.name.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div className={`relative flex flex-col h-full bg-[#0c0c0c] border-2 rounded-[2rem] overflow-hidden group hover:-translate-y-1 transition-all duration-500 hover:shadow-2xl ${config.border} ${config.shadow}`}>
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
                        {template.priority && (
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mb-3 ml-2 ${
                                template.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                template.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                                'bg-cyan-500/10 text-cyan-500 border-cyan-500/30'
                            }`}>
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                {template.priority} Priority
                            </div>
                        )}
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">
                            {template.name}
                        </h3>
                    </div>
                    <div className="flex gap-2">
                        {onAnalyze && (
                            <button onClick={onAnalyze} className="p-2 bg-indigo-900/50 rounded-full hover:bg-indigo-800 text-indigo-400 hover:text-white transition-colors border border-indigo-500/30" title="Analyze Progressive Overload">
                                <BrainCircuit className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={handleDownloadPDF} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Download PDF Protocol">
                            <Download className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                            <button onClick={onEdit} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors" title="Edit Template">
                                <Edit3 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                
                <p className="text-xs text-gray-400 mb-6 leading-relaxed font-medium border-l-2 border-white/10 pl-3 line-clamp-2">
                    {template.description}
                </p>
                
                <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                    {/* Pre-Workout Section */}
                    {template.preWorkout && (
                        <div className="space-y-2">
                            <h5 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Pre-Workout
                            </h5>
                            {template.preWorkout.exercises.map((ex, idx) => (
                                <div key={`pre-${idx}`} className="flex justify-between items-center text-xs p-2 bg-cyan-900/10 rounded-lg border border-cyan-500/10">
                                    <span className="text-gray-300 font-bold">{ex.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-cyan-400">{ex.sets} x {ex.reps}</span>
                                        <button onClick={() => setVideoModalExercise({name: ex.name, url: ex.videoUrl})} className="text-cyan-500 hover:text-white transition-colors">
                                            <Video className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Main Workout Sections */}
                    {sections.map((section, sIdx) => (
                        <div key={sIdx} className="space-y-2">
                            <h5 className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">
                                {section.name || 'Main Routine'}
                            </h5>
                            {section.exercises.map((ex, idx) => (
                                <div key={idx} className="flex flex-col gap-2 text-xs p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-200 font-bold">{ex.name}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-3 text-[10px] font-mono text-gray-500">
                                                <span>{ex.sets} SETS</span>
                                                <span className={config.color}>{ex.reps}</span>
                                            </div>
                                            <button onClick={() => setVideoModalExercise({name: ex.name, url: ex.videoUrl})} className="p-1.5 bg-gray-800 rounded-lg hover:bg-cyan-600 hover:text-white text-gray-400 transition-all">
                                                <Video className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    {(ex.rest || ex.tempo || ex.rpe || ex.technique) && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {ex.rest && (
                                                <button 
                                                    onClick={() => {
                                                        const seconds = parseInt(ex.rest?.replace(/[^0-9]/g, '') || '60');
                                                        onStartTimer?.(seconds);
                                                    }}
                                                    className="text-[9px] font-mono bg-gray-900/50 hover:bg-cyan-900/30 text-gray-400 hover:text-cyan-400 px-2 py-0.5 rounded border border-white/5 hover:border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Clock className="w-2.5 h-2.5" /> Rest: {ex.rest}
                                                </button>
                                            )}
                                            {ex.tempo && <span className="text-[9px] font-mono bg-gray-900/50 text-gray-400 px-2 py-0.5 rounded border border-white/5">Tempo: {ex.tempo}</span>}
                                            {ex.rpe && <span className="text-[9px] font-mono bg-amber-900/20 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20">RPE: {ex.rpe}</span>}
                                            {ex.technique && <span className="text-[9px] font-mono bg-indigo-900/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">{ex.technique}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Finisher Section */}
                    {template.finisher && (
                        <div className="space-y-2">
                            <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest pl-1 flex items-center gap-1">
                                <Flame className="w-3 h-3" /> Finisher
                            </h5>
                            {template.finisher.exercises.map((ex, idx) => (
                                <div key={`fin-${idx}`} className="flex justify-between items-center text-xs p-2 bg-red-900/10 rounded-lg border border-red-500/10">
                                    <span className="text-gray-300 font-bold">{ex.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-red-400">{ex.sets} x {ex.reps}</span>
                                        <button onClick={() => setVideoModalExercise({name: ex.name, url: ex.videoUrl})} className="text-red-500 hover:text-white transition-colors">
                                            <Video className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="mt-6 flex items-center justify-between text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <span>Est. Vol: {estimatedLoad * 50} kg</span>
                    <span>CNS Impact: {estimatedLoad > 200 ? 'HIGH' : 'MOD'}</span>
                </div>
            </div>
            
            <div className="p-4 bg-black/40 border-t border-white/5 grid grid-cols-2 gap-3 relative z-10 backdrop-blur-md">
                <button 
                    onClick={() => setDemoModalExercise(allExercises[0]?.name || '')}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-gray-300 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest border border-gray-600/50 border-dashed transition-all group/btn shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                    <FileText className="w-4 h-4 group-hover/btn:text-cyan-400 transition-colors relative z-10" /> <span className="relative z-10">Details</span>
                </button>
                <button 
                    onClick={onAssign}
                    className={`flex items-center justify-center gap-2 font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 border border-dashed relative overflow-hidden group ${template.level === 'Beginner' ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-black border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : template.level === 'Intermediate' ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : template.level === 'Advanced' ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.3)]'}`}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                    <span className="relative z-10">{isAdmin ? 'Deploy' : 'Start'}</span> <ArrowRight className="w-3 h-3 relative z-10" />
                </button>
            </div>
            <ExerciseDemoModal isOpen={!!demoModalExercise} onClose={() => setDemoModalExercise(null)} exerciseName={demoModalExercise || ''} />
            <VideoPlayerModal 
                isOpen={!!videoModalExercise} 
                onClose={() => setVideoModalExercise(null)} 
                exerciseName={videoModalExercise?.name || ''} 
                youtubeId={videoModalExercise?.url}
            />
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
    const [priority, setPriority] = useState<WorkoutTemplate['priority']>(initialData?.priority || 'Medium');
    
    // Sections State
    const [preWorkout, setPreWorkout] = useState<WorkoutSection>(initialData?.preWorkout || { name: 'Warmup & Activation', exercises: [] });
    const [mainWorkout, setMainWorkout] = useState<WorkoutSection[]>(
        initialData?.mainWorkout || 
        (initialData?.exercises ? [{ name: 'Main Routine', exercises: initialData.exercises }] : [{ name: 'Main Routine', exercises: [] }])
    );
    const [finisher, setFinisher] = useState<WorkoutSection>(initialData?.finisher || { name: 'Metabolic Finisher', exercises: [] });

    // Active Tab for Editor
    const [activeSectionTab, setActiveSectionTab] = useState<'pre' | 'main' | 'finisher'>('main');
    
    // Flatten for stats
    const allExercises = [
        ...preWorkout.exercises,
        ...mainWorkout.flatMap(s => s.exercises),
        ...finisher.exercises
    ];
    const volumeLoad = allExercises.reduce((acc, ex) => acc + (parseInt(ex.sets || '0') * 10), 0); 
    
    const muscleDistribution = useMemo(() => {
        const dist: any = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0 };
        allExercises.forEach(ex => {
            const data = getExerciseByName(ex.name);
            if (dist[data.category] !== undefined) dist[data.category] += parseInt(ex.sets || '0');
        });
        return Object.keys(dist).map(key => ({ name: key, sets: dist[key] }));
    }, [allExercises]);

    // Handlers for Main Workout Sections
    const handleAddMainSection = () => {
        setMainWorkout([...mainWorkout, { name: 'New Section', exercises: [] }]);
    };

    const handleRemoveMainSection = (index: number) => {
        setMainWorkout(mainWorkout.filter((_, i) => i !== index));
    };

    const handleMainSectionNameChange = (index: number, newName: string) => {
        const updated = [...mainWorkout];
        updated[index].name = newName;
        setMainWorkout(updated);
    };

    // Generic Exercise Handlers
    const updateExercise = (
        sectionType: 'pre' | 'main' | 'finisher',
        sectionIndex: number, // Only for main
        exerciseIndex: number,
        field: keyof WorkoutExercise,
        value: string
    ) => {
        if (sectionType === 'pre') {
            const updated = { ...preWorkout };
            updated.exercises[exerciseIndex] = { ...updated.exercises[exerciseIndex], [field]: value };
            setPreWorkout(updated);
        } else if (sectionType === 'finisher') {
            const updated = { ...finisher };
            updated.exercises[exerciseIndex] = { ...updated.exercises[exerciseIndex], [field]: value };
            setFinisher(updated);
        } else {
            const updated = [...mainWorkout];
            updated[sectionIndex].exercises[exerciseIndex] = { 
                ...updated[sectionIndex].exercises[exerciseIndex], 
                [field]: value 
            };
            setMainWorkout(updated);
        }
    };

    const addExercise = (sectionType: 'pre' | 'main' | 'finisher', sectionIndex: number = 0) => {
        const newEx = { name: '', sets: '3', reps: '10-12' };
        if (sectionType === 'pre') {
            setPreWorkout({ ...preWorkout, exercises: [...preWorkout.exercises, newEx] });
        } else if (sectionType === 'finisher') {
            setFinisher({ ...finisher, exercises: [...finisher.exercises, newEx] });
        } else {
            const updated = [...mainWorkout];
            updated[sectionIndex].exercises.push(newEx);
            setMainWorkout(updated);
        }
    };

    const removeExercise = (sectionType: 'pre' | 'main' | 'finisher', sectionIndex: number, exerciseIndex: number) => {
        if (sectionType === 'pre') {
            setPreWorkout({ ...preWorkout, exercises: preWorkout.exercises.filter((_, i) => i !== exerciseIndex) });
        } else if (sectionType === 'finisher') {
            setFinisher({ ...finisher, exercises: finisher.exercises.filter((_, i) => i !== exerciseIndex) });
        } else {
            const updated = [...mainWorkout];
            updated[sectionIndex].exercises = updated[sectionIndex].exercises.filter((_, i) => i !== exerciseIndex);
            setMainWorkout(updated);
        }
    };

    const renderExerciseList = (exercises: WorkoutExercise[], sectionType: 'pre' | 'main' | 'finisher', sectionIndex: number = 0) => (
        <div className="space-y-2">
            {exercises.map((ex, exIdx) => (
                <div key={exIdx} className="flex gap-2 items-center bg-black/60 p-2 rounded-xl border border-white/5">
                    <span className="text-gray-600 font-mono w-6 text-center text-xs">{exIdx+1}</span>
                    <input 
                        type="text" 
                        value={ex.name} 
                        onChange={(e) => updateExercise(sectionType, sectionIndex, exIdx, 'name', e.target.value)}
                        placeholder="Exercise Name"
                        className="flex-1 bg-transparent text-sm text-white font-bold outline-none"
                    />
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={ex.sets} 
                            onChange={(e) => updateExercise(sectionType, sectionIndex, exIdx, 'sets', e.target.value)}
                            className="w-12 bg-gray-800 rounded p-1 text-center text-xs text-white outline-none focus:border-amber-500 border border-transparent"
                            placeholder="Sets"
                        />
                        <span className="text-gray-600 text-xs">x</span>
                        <input 
                            type="text" 
                            value={ex.reps} 
                            onChange={(e) => updateExercise(sectionType, sectionIndex, exIdx, 'reps', e.target.value)}
                            className="w-16 bg-gray-800 rounded p-1 text-center text-xs text-white outline-none focus:border-amber-500 border border-transparent"
                            placeholder="Reps"
                        />
                    </div>
                    <button 
                        onClick={() => removeExercise(sectionType, sectionIndex, exIdx)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                    >
                        <X className="w-3 h-3"/>
                    </button>
                </div>
            ))}
            <button 
                onClick={() => addExercise(sectionType, sectionIndex)}
                className="w-full py-2 border border-dashed border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300 rounded-lg text-[10px] uppercase font-bold transition-all"
            >
                + Add Movement
            </button>
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Protocol Definition" className="bg-gray-900 border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                                <option>Pro Advance</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Priority</label>
                            <select 
                                value={priority} 
                                onChange={(e) => setPriority(e.target.value as any)} 
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-bold outline-none focus:border-amber-500"
                            >
                                <option value="Low">Low Priority</option>
                                <option value="Medium">Medium Priority</option>
                                <option value="High">High Priority</option>
                            </select>
                        </div>
                         <div className="col-span-1 md:col-span-3">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</label>
                            <textarea 
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-amber-500 resize-none h-20"
                                placeholder="Brief overview of the routine goals..."
                            />
                        </div>
                    </div>

                    {/* Section Tabs */}
                    <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
                        <button 
                            onClick={() => setActiveSectionTab('pre')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeSectionTab === 'pre' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'text-gray-500 hover:text-white'}`}
                        >
                            Pre-Workout
                        </button>
                        <button 
                            onClick={() => setActiveSectionTab('main')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeSectionTab === 'main' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'text-gray-500 hover:text-white'}`}
                        >
                            Main Workout
                        </button>
                        <button 
                            onClick={() => setActiveSectionTab('finisher')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeSectionTab === 'finisher' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-gray-500 hover:text-white'}`}
                        >
                            Finisher
                        </button>
                    </div>

                    <div className="space-y-6 min-h-[300px]">
                        {activeSectionTab === 'pre' && (
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                <h4 className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-3">Warmup & Activation</h4>
                                {renderExerciseList(preWorkout.exercises, 'pre')}
                            </div>
                        )}

                        {activeSectionTab === 'main' && (
                            <div className="space-y-4">
                                {mainWorkout.map((section, sIdx) => (
                                    <div key={sIdx} className="bg-black/30 p-4 rounded-2xl border border-white/5 relative group/section">
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                <Grip className="w-4 h-4 text-gray-600 cursor-move" />
                                                <input 
                                                    type="text" 
                                                    value={section.name} 
                                                    onChange={(e) => handleMainSectionNameChange(sIdx, e.target.value)}
                                                    className="bg-transparent text-sm font-black uppercase tracking-widest text-amber-500 outline-none w-full"
                                                    placeholder="SECTION NAME"
                                                />
                                            </div>
                                            <button onClick={() => handleRemoveMainSection(sIdx)} className="text-red-500 hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {renderExerciseList(section.exercises, 'main', sIdx)}
                                    </div>
                                ))}
                                <button 
                                    onClick={handleAddMainSection}
                                    className="w-full mt-2 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Main Section
                                </button>
                            </div>
                        )}

                        {activeSectionTab === 'finisher' && (
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                <h4 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3">Metabolic Finisher</h4>
                                {renderExerciseList(finisher.exercises, 'finisher')}
                            </div>
                        )}
                    </div>
                </Card>
                
                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="px-6 py-3 text-gray-400 font-bold hover:text-white">Discard</button>
                    <button 
                        onClick={() => onSave({ 
                            id: initialData?.id || Date.now(), 
                            name, 
                            level, 
                            category: 'Strength', 
                            description, 
                            priority,
                            preWorkout: preWorkout.exercises.length > 0 ? preWorkout : undefined,
                            mainWorkout,
                            finisher: finisher.exercises.length > 0 ? finisher : undefined,
                            exercises: [] // Legacy support
                        } as any)}
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
    const { members, updateMember, addAuditLog, workoutTemplates, addWorkoutTemplate, updateWorkoutTemplate } = useData() as any;
    
    const [activeTab, setActiveTab] = useState<'workout_tracker' | 'schedule' | 'weekly_grid' | 'library' | 'editor' | 'opals_architect' | 'exercise_dictionary'>('workout_tracker');
    const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance'>('Beginner');
    const [selectedPriority, setSelectedPriority] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    
    // Live Mirror Testing
    const [liveModeExercise, setLiveModeExercise] = useState<WorkoutExercise | null>(null);

    // Removed local templates state
    const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | undefined>(undefined);
    
    // Assignment State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTemplate, setAssignTemplate] = useState<WorkoutTemplate | null>(null);

    // Analysis State
    const [analyzingTemplate, setAnalyzingTemplate] = useState<WorkoutTemplate | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    
    // Timer State
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(60);

    const handleStartTimer = (seconds: number) => {
        setTimerSeconds(seconds);
        setIsTimerOpen(true);
    };

    const handleAnalyze = async (template: WorkoutTemplate) => {
        setAnalyzingTemplate(template);
        setIsAnalyzing(true);
        setAnalysisResult(null);
        try {
            const { getComplexResponse } = await import('../../lib/core_ai');
            const prompt = `Analyze this workout template and suggest progressive overload strategies for the next 4 weeks. Include specific weight increases, rep changes, or tempo modifications.
            Template Name: ${template.name}
            Level: ${template.level}
            Priority: ${template.priority || 'Medium'}
            Goal: ${template.category}
            Description: ${template.description}
            
            Format the response in clean HTML with Tailwind classes for styling (use text-gray-300, text-cyan-400 for highlights, bg-white/5 for cards). Keep it concise and actionable. Do not include markdown code blocks like \`\`\`html.`;
            
            const response = await getComplexResponse(prompt);
            const cleanHtml = response.replace(/```html|```/g, '').trim();
            setAnalysisResult(cleanHtml);
        } catch (error) {
            console.error("Analysis failed", error);
            setAnalysisResult("<div class='text-red-400'>Failed to generate analysis. Please try again.</div>");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const filteredTemplates = useMemo(() => {
        return workoutTemplates.filter(t => 
            t.level === selectedLevel && 
            (selectedPriority === 'All' || t.priority === selectedPriority)
        );
    }, [selectedLevel, selectedPriority, workoutTemplates]);

    const handleSaveGeneratedPlan = (newPlan: { 
        name: string; 
        level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance'; 
        content?: string; 
        preWorkout?: WorkoutSection;
        mainWorkout?: WorkoutSection[];
        finisher?: WorkoutSection;
        exercises?: WorkoutExercise[];
    }, memberId?: number) => {
        const newTemplate: WorkoutTemplate = {
            id: Date.now(),
            name: newPlan.name,
            level: newPlan.level,
            priority: 'Medium',
            category: 'Custom AI',
            description: newPlan.content || "AI Generated Custom Protocol",
            preWorkout: newPlan.preWorkout,
            mainWorkout: newPlan.mainWorkout || (newPlan.exercises ? [{ name: 'Main Routine', exercises: newPlan.exercises }] : []),
            finisher: newPlan.finisher,
            exercises: newPlan.exercises || []
        };
        addWorkoutTemplate(newTemplate);
        setSelectedLevel(newPlan.level); 

        if (memberId) {
            const member = members.find(m => m.id === memberId);
            if (member) {
                updateMember({ 
                    ...member, 
                    activeWorkoutPlan: newTemplate 
                } as any);
                addToast(`Custom protocol generated and assigned to ${member.name}.`, "success");
            }
        } else {
            addToast("Custom protocol generated and saved to library.", "success");
        }
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
        <SecurityLayer className="space-y-10 animate-fade-in pb-20">
            {/* Contact Trainer Floating Button */}
            <a 
                href="https://wa.me/?text=Hi%20Trainer,%20I%20need%20help%20with%20my%20workout%20schedule."
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all hover:scale-110 flex items-center gap-2 group"
            >
                <MessageCircle className="w-6 h-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-bold">Contact Trainer</span>
            </a>

            {/* 1. FitnessFuture-CONTINUUM HEADER */}
            <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                            <Layers className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">SYSTEM: WORKOUT_CORE</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Schedule</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                         <button 
                            onClick={() => addToast('Triggering N8N AI Generator Workflow...', 'info')}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(234,88,12,0.3)] border border-orange-500/50 border-dashed transition-all relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <SparkleIcon className="w-4 h-4 text-white relative z-10" /> <span className="relative z-10">N8N AI Sync</span>
                        </button>
                        <button 
                            onClick={() => addToast('Syncing advanced protocols to GitHub...', 'success')}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-gray-600/50 border-dashed transition-all relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <Database className="w-4 h-4 text-white relative z-10" /> <span className="relative z-10">GitHub Backup</span>
                        </button>
                         <button 
                            onClick={() => setIsGeneratorOpen(true)}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-purple-500/50 border-dashed transition-all relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                            <SparkleIcon className="w-4 h-4 text-yellow-300 relative z-10" /> <span className="relative z-10">AI Generator</span>
                        </button>
                        <div className="flex flex-wrap bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <button 
                                onClick={() => setActiveTab('workout_tracker')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group cursor-pointer ${activeTab === 'workout_tracker' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/50 border-dashed' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                <Activity className="w-4 h-4 inline mr-2 relative z-10"/> <span className="relative z-10">Planner & Set/Rep Tracker</span>
                            </button>
                             <button 
                                onClick={() => setActiveTab('weekly_grid')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group cursor-pointer ${activeTab === 'weekly_grid' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50 border-dashed' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                {activeTab === 'weekly_grid' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                <Calendar className="w-4 h-4 inline mr-2 relative z-10"/> <span className="relative z-10">Weekly Grid</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('schedule')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group cursor-pointer ${activeTab === 'schedule' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50 border-dashed' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                {activeTab === 'schedule' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                <Layers className="w-4 h-4 inline mr-2 relative z-10"/> <span className="relative z-10">Templates</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('library')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group cursor-pointer ${activeTab === 'library' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50 border-dashed' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                {activeTab === 'library' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                <span className="relative z-10">Library</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('exercise_dictionary')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group cursor-pointer ${activeTab === 'exercise_dictionary' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50 border-dashed' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                {activeTab === 'exercise_dictionary' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                <span className="relative z-10">Exercise Dictionary</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('opals_architect')} 
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group cursor-pointer ${activeTab === 'opals_architect' ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-400/50 border-dashed' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                            >
                                {activeTab === 'opals_architect' && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>}
                                <BrainCircuit className="w-4 h-4 inline mr-2 relative z-10"/> <span className="relative z-10">Fitness Future-WORKOUT</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'workout_tracker' && <WorkoutPlannerTracker />}
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
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex bg-black rounded-xl p-1 border border-white/10">
                                {[
                                    { id: 'Beginner', icon: <ShieldCheck className="w-4 h-4"/> },
                                    { id: 'Intermediate', icon: <Zap className="w-4 h-4"/> },
                                    { id: 'Advanced', icon: <Trophy className="w-4 h-4"/> },
                                    { id: 'Pro Advance', icon: <Trophy className="w-4 h-4 text-purple-500"/> },
                                ].map((lvl) => (
                                    <button 
                                        key={lvl.id}
                                        onClick={() => setSelectedLevel(lvl.id as any)}
                                        className={`px-4 md:px-6 py-2 md:py-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                                            selectedLevel === lvl.id 
                                            ? 'bg-amber-500 text-black shadow-lg' 
                                            : 'text-gray-500 hover:text-white'
                                        }`}
                                    >
                                        {lvl.icon} <span className="hidden md:inline">{lvl.id}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex bg-black rounded-xl p-1 border border-white/10">
                                <select
                                    value={selectedPriority}
                                    onChange={(e) => setSelectedPriority(e.target.value as any)}
                                    className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 outline-none cursor-pointer"
                                >
                                    <option value="All">All Priorities</option>
                                    <option value="High">High Priority</option>
                                    <option value="Medium">Medium Priority</option>
                                    <option value="Low">Low Priority</option>
                                </select>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => { setEditingTemplate(undefined); setActiveTab('editor'); }}
                            className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 hover:bg-gray-200 transition-all shrink-0"
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
                                onAnalyze={() => handleAnalyze(template)}
                                onStartTimer={handleStartTimer}
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
            {activeTab === 'exercise_dictionary' && <EnglishExerciseDictionary />}
            {activeTab === 'opals_architect' && <OpalsWorkoutArchitect isAdminView={true} />}

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

            {/* Progressive Overload Analysis Modal */}
            <Modal isOpen={!!analyzingTemplate} onClose={() => setAnalyzingTemplate(null)} title="Progressive Overload Analysis">
                <div className="p-6">
                    {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <BrainCircuit className="w-12 h-12 text-indigo-500 animate-pulse" />
                            <p className="text-indigo-400 font-mono text-sm uppercase tracking-widest animate-pulse">Analyzing Template...</p>
                        </div>
                    ) : analysisResult ? (
                        <div className="space-y-6">
                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-4">
                                <BrainCircuit className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="text-indigo-400 font-black uppercase text-sm tracking-widest">AI Overload Strategy</h4>
                                    <p className="text-indigo-300/70 text-xs mt-1">Based on {analyzingTemplate?.name}</p>
                                </div>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: analysisResult }} />
                        </div>
                    ) : null}
                    
                    <div className="mt-8 flex justify-end">
                        <button onClick={() => setAnalyzingTemplate(null)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {isTimerOpen && (
                <RestTimer 
                    initialSeconds={timerSeconds} 
                    onClose={() => setIsTimerOpen(false)} 
                />
            )}
        </SecurityLayer>
    );
};

export default Workouts;
