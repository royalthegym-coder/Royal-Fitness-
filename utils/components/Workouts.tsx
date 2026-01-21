
import React, { useState, useMemo } from 'react';
import { Member, MemberSchedules, DailySchedule, WorkoutTemplate, WorkoutExercise } from '../../types';
import { INITIAL_MEMBERS, INITIAL_MEMBER_SCHEDULES, INITIAL_WORKOUT_TEMPLATES } from '../../constants';
import Card from './common/Card';
import WorkoutDayModal from './common/WorkoutDayModal';
import { DumbbellIcon } from './icons/DumbbellIcon';
import AIWorkoutGeneratorModal from './common/AIWorkoutGeneratorModal';
import { SparkleIcon } from './icons/SparkleIcon';
import { sendWorkoutPlanNotification } from '../../lib/whatsapp';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import ExerciseDemoModal, { getMediaForExercise } from './common/ExerciseDemoModal';

// --- ICONS ---
const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const SortIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
    </svg>
);

const MemberScheduler: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMemberId, setSelectedMemberId] = useState<number>(INITIAL_MEMBERS[0].id);
    const [schedules, setSchedules] = useState<MemberSchedules>(INITIAL_MEMBER_SCHEDULES);
    const [modalState, setModalState] = useState<{ isOpen: boolean; date: Date | null }>({ isOpen: false, date: null });

    const member: Member | undefined = INITIAL_MEMBERS.find(m => m.id === selectedMemberId);

    const changeMonth = (offset: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const handleDayClick = (day: number) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setModalState({ isOpen: true, date });
    };

    const handleSaveSchedule = async (date: Date, newSchedule: DailySchedule) => {
        const dateString = date.toISOString().split('T')[0];
        const updatedSchedules = { ...schedules };
        if (!updatedSchedules[selectedMemberId]) {
            updatedSchedules[selectedMemberId] = {};
        }
        updatedSchedules[selectedMemberId][dateString] = newSchedule;
        setSchedules(updatedSchedules);
        setModalState({ isOpen: false, date: null });

        // Trigger WhatsApp Notification
        if (member && member.whatsappConsent && !newSchedule.isRestDay) {
            let planName = 'Custom Workout';
            if (newSchedule.templateId) {
                const template = INITIAL_WORKOUT_TEMPLATES.find(t => t.id === newSchedule.templateId);
                if (template) planName = template.name;
            } else if (newSchedule.customTitle) {
                planName = newSchedule.customTitle;
            }
            
            await sendWorkoutPlanNotification(member, planName);
            // Optional: alert or toast here
        }
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const memberSchedule = schedules[selectedMemberId] || {};

        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="border-r border-b border-gray-700"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = new Date(year, month, day).toISOString().split('T')[0];
            const schedule = memberSchedule[dateString];
            let title = '';
            if (schedule?.isRestDay) title = 'Rest Day';
            else if (schedule?.templateId) title = INITIAL_WORKOUT_TEMPLATES.find(t => t.id === schedule.templateId)?.name || '';
            else if (schedule?.customTitle) title = schedule.customTitle;
            else if (schedule?.exercises?.length) title = `${schedule.exercises.length} Exercises`;

            days.push(
                <button 
                    key={day} 
                    onClick={() => handleDayClick(day)}
                    className="p-2 border-r border-b border-gray-700 text-left hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[100px]"
                >
                    <div className="font-semibold">{day}</div>
                    {title && (
                         <div className={`mt-1 text-xs px-2 py-1 rounded-md ${schedule?.isRestDay ? 'bg-gray-600' : 'bg-amber-600'} text-white truncate`}>
                            {title}
                        </div>
                    )}
                </button>
            );
        }
        return days;
    }, [currentDate, selectedMemberId, schedules]);

    const currentSchedule = modalState.date ? (schedules[selectedMemberId]?.[modalState.date.toISOString().split('T')[0]] || null) : null;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <select
                    id="member-select"
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(parseInt(e.target.value, 10))}
                    className="bg-gray-700 text-white p-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                    {INITIAL_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
            </div>
            
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-700">&lt;</button>
                    <h2 className="text-xl font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-700">&gt;</button>
                </div>
                <div className="grid grid-cols-7 text-center font-bold text-gray-400 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 border-t border-l border-gray-700 bg-gray-800">
                    {calendarGrid}
                </div>
            </Card>

            {modalState.isOpen && modalState.date && member && (
                <WorkoutDayModal
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState({ isOpen: false, date: null })}
                    date={modalState.date}
                    member={member}
                    schedule={currentSchedule}
                    onSave={handleSaveSchedule}
                />
            )}
        </div>
    );
};

const WorkoutTemplateCard: React.FC<{ template: WorkoutTemplate }> = ({ template }) => {
    const [demoModalExercise, setDemoModalExercise] = useState<string | null>(null);

    const handleOpenDemoModal = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        setDemoModalExercise(name);
    };

    const getDifficultyVisuals = (level: string) => {
        switch(level) {
            case 'Beginner': return { label: 'Easy', color: 'bg-green-500', text: 'text-green-400', bars: 1 };
            case 'Intermediate': return { label: 'Medium', color: 'bg-yellow-500', text: 'text-yellow-400', bars: 2 };
            case 'Advanced': return { label: 'Hard', color: 'bg-red-500', text: 'text-red-400', bars: 3 };
            default: return { label: 'Unknown', color: 'bg-gray-500', text: 'text-gray-400', bars: 0 };
        }
    };

    const diff = getDifficultyVisuals(template.level);

    return (
        <Card className="flex flex-col h-full relative group hover:border-amber-500/50 transition-colors">
            {template.isNew && (
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg z-10">
                    <SparkleIcon className="w-3 h-3 mr-1" />
                    AI Generated
                </div>
            )}
            <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-amber-400 leading-tight pr-2">{template.name}</h3>
                    
                    {/* Difficulty Badge */}
                    <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 px-2 py-1 rounded-full shadow-sm flex-shrink-0">
                        <div className="flex gap-0.5 items-end h-3">
                            <div className={`w-1 rounded-[1px] ${diff.bars >= 1 ? diff.color : 'bg-gray-700'} h-1.5`}></div>
                            <div className={`w-1 rounded-[1px] ${diff.bars >= 2 ? diff.color : 'bg-gray-700'} h-2`}></div>
                            <div className={`w-1 rounded-[1px] ${diff.bars >= 3 ? diff.color : 'bg-gray-700'} h-2.5`}></div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${diff.text}`}>{diff.label}</span>
                    </div>
                </div>
                
                <div className="mt-4 space-y-2 text-sm text-gray-300">
                    {template.content ? (
                        <div className="prose prose-invert prose-sm max-w-none line-clamp-6" dangerouslySetInnerHTML={{ __html: template.content.replace(/\n/g, '<br />') }} />
                    ) : (
                        <>
                            {template.exercises && template.exercises.slice(0, 3).map((ex, index) => (
                                <div 
                                    key={`ex-${index}`} 
                                    onClick={(e) => handleOpenDemoModal(e, ex.name)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer border border-transparent hover:border-gray-600 transition-all"
                                >
                                    <div className="w-10 h-10 bg-black rounded-md flex-shrink-0 relative overflow-hidden">
                                        <img src={getMediaForExercise(ex.name)} alt="demo" className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-white text-xs truncate">{ex.name}</p>
                                        <p className="font-mono text-[10px] text-gray-400">{ex.sets} x {ex.reps}</p>
                                    </div>
                                </div>
                            ))}
                            {template.sections && template.sections.flatMap(s => s.exercises).slice(0, 3).map((ex, index) => (
                                <div 
                                    key={`sec-ex-${index}`} 
                                    onClick={(e) => handleOpenDemoModal(e, ex.name)}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer border border-transparent hover:border-gray-600 transition-all"
                                >
                                    <div className="w-10 h-10 bg-black rounded-md flex-shrink-0 relative overflow-hidden">
                                        <img src={getMediaForExercise(ex.name)} alt="demo" className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-semibold text-white text-xs truncate">{ex.name}</p>
                                        <p className="font-mono text-[10px] text-gray-400">{ex.sets} x {ex.reps}</p>
                                    </div>
                                </div>
                            ))}
                            {(template.exercises?.length || 0) + (template.sections?.flatMap(s => s.exercises).length || 0) > 3 && (
                                <p className="text-xs text-gray-500 text-center italic mt-1">+ more exercises</p>
                            )}
                        </>
                    )}
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
                <button className="text-sm w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors border border-gray-600 hover:border-gray-500">
                    View Details
                </button>
            </div>
            <ExerciseDemoModal isOpen={!!demoModalExercise} onClose={() => setDemoModalExercise(null)} exerciseName={demoModalExercise || ''} />
        </Card>
    );
};


const WorkoutLibrary: React.FC<{ templates: WorkoutTemplate[] }> = ({ templates }) => {
    const [filterDifficulty, setFilterDifficulty] = useState<string>('All');
    const [sortOption, setSortOption] = useState<string>('Default');

    const difficultyMap: Record<string, number> = {
        'Beginner': 1,
        'Intermediate': 2,
        'Advanced': 3
    };

    const filteredTemplates = useMemo(() => {
        let result = [...templates];

        // 1. Filter
        if (filterDifficulty !== 'All') {
            result = result.filter(t => t.level === filterDifficulty);
        }

        // 2. Sort
        if (sortOption === 'Difficulty (Easy → Hard)') {
            result.sort((a, b) => difficultyMap[a.level] - difficultyMap[b.level]);
        } else if (sortOption === 'Difficulty (Hard → Easy)') {
            result.sort((a, b) => difficultyMap[b.level] - difficultyMap[a.level]);
        } else if (sortOption === 'Name') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        }

        return result;
    }, [templates, filterDifficulty, sortOption]);

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <Card className="p-4 bg-gray-800 border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-600">
                            <div className="px-3 text-gray-400">
                                <FilterIcon />
                            </div>
                            <select 
                                value={filterDifficulty}
                                onChange={(e) => setFilterDifficulty(e.target.value)}
                                className="bg-transparent text-white text-sm font-medium py-2 pr-8 focus:outline-none cursor-pointer"
                            >
                                <option value="All">All Levels</option>
                                <option value="Beginner">Easy</option>
                                <option value="Intermediate">Medium</option>
                                <option value="Advanced">Hard</option>
                            </select>
                        </div>

                        <div className="flex items-center bg-gray-900 rounded-lg p-1 border border-gray-600">
                            <div className="px-3 text-gray-400">
                                <SortIcon />
                            </div>
                            <select 
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="bg-transparent text-white text-sm font-medium py-2 pr-8 focus:outline-none cursor-pointer"
                            >
                                <option value="Default">Newest First</option>
                                <option value="Name">Name (A-Z)</option>
                                <option value="Difficulty (Easy → Hard)">Difficulty (Low to High)</option>
                                <option value="Difficulty (Hard → Easy)">Difficulty (High to Low)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                        Showing <span className="text-white font-bold">{filteredTemplates.length}</span> templates
                    </div>
                </div>
            </Card>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredTemplates.map(template => (
                    <WorkoutTemplateCard key={template.id} template={template} />
                ))}
            </div>
            
            {filteredTemplates.length === 0 && (
                <div className="text-center py-20 bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-700">
                    <DumbbellIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No workouts found matching these filters.</p>
                    <button 
                        onClick={() => { setFilterDifficulty('All'); setSortOption('Default'); }}
                        className="mt-4 text-amber-500 hover:text-amber-400 text-sm font-bold underline"
                    >
                        Clear Filters
                    </button>
                </div>
            )}
        </div>
    );
};


const Workouts: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'library' | 'scheduler'>('library');
    const [templates, setTemplates] = useState<WorkoutTemplate[]>(INITIAL_WORKOUT_TEMPLATES);
    const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
    
    const handleSaveTemplate = (newTemplateData: { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; content?: string; exercises?: WorkoutExercise[] }) => {
        const newTemplate: WorkoutTemplate = {
            id: templates.length + 100, // Use a high ID to avoid collision
            name: newTemplateData.name,
            level: newTemplateData.level,
            content: newTemplateData.content,
            exercises: newTemplateData.exercises, // Save structured exercises if available
            isNew: true, // Mark as new
        };
        setTemplates(prev => [newTemplate, ...prev]); // Add to top
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center">
                    <DumbbellIcon className="w-8 h-8 mr-3 text-amber-400" />
                    <h1 className="text-3xl font-bold text-amber-400">Workouts</h1>
                </div>
                 {activeTab === 'library' && (
                    <button
                        onClick={() => setIsGeneratorModalOpen(true)}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center shadow-lg transform hover:scale-105"
                    >
                        <SparkleIcon className="w-5 h-5 mr-2" />
                        Generate AI Workout
                    </button>
                )}
            </div>
            
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('library')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'library' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Workout Library
                    </button>
                    <button onClick={() => setActiveTab('scheduler')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'scheduler' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Member Scheduler
                    </button>
                </nav>
            </div>
            
            {activeTab === 'library' ? <WorkoutLibrary templates={templates} /> : <MemberScheduler />}

            {isGeneratorModalOpen && (
                <AIWorkoutGeneratorModal
                    isOpen={isGeneratorModalOpen}
                    onClose={() => setIsGeneratorModalOpen(false)}
                    onSave={handleSaveTemplate}
                />
            )}
        </div>
    );
};

export default Workouts;
