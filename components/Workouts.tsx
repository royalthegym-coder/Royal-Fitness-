
import React, { useState, useMemo } from 'react';
import { Member, MemberSchedules, DailySchedule, WorkoutTemplate } from '../types';
import { INITIAL_MEMBERS, INITIAL_MEMBER_SCHEDULES, INITIAL_WORKOUT_TEMPLATES } from '../constants';
import Card from './common/Card';
import WorkoutDayModal from './common/WorkoutDayModal';
import { DumbbellIcon } from './icons/DumbbellIcon';
import AIWorkoutGeneratorModal from './common/AIWorkoutGeneratorModal';
import { SparkleIcon } from './icons/SparkleIcon';

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

    const handleSaveSchedule = (date: Date, newSchedule: DailySchedule) => {
        const dateString = date.toISOString().split('T')[0];
        const updatedSchedules = { ...schedules };
        if (!updatedSchedules[selectedMemberId]) {
            updatedSchedules[selectedMemberId] = {};
        }
        updatedSchedules[selectedMemberId][dateString] = newSchedule;
        setSchedules(updatedSchedules);
        setModalState({ isOpen: false, date: null });
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

const WorkoutTemplateCard: React.FC<{ template: WorkoutTemplate }> = ({ template }) => (
    <Card className="flex flex-col h-full relative">
        {template.isNew && (
            <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-lg">
                <SparkleIcon className="w-3 h-3 mr-1" />
                AI Generated
            </div>
        )}
        <div className="flex-grow">
            <h3 className="text-lg font-bold text-amber-400">{template.name}</h3>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                template.level === 'Beginner' ? 'bg-green-700 text-green-200' :
                template.level === 'Intermediate' ? 'bg-yellow-700 text-yellow-200' :
                'bg-red-700 text-red-200'
            }`}>{template.level}</span>
            <div className="mt-4 space-y-2 text-sm text-gray-300">
                {template.content ? (
                    <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: template.content.replace(/\n/g, '<br />') }} />
                ) : (
                    <>
                        {template.exercises && template.exercises.map((ex, index) => (
                            <div key={`ex-${index}`} className="flex justify-between">
                                <span>{ex.name}</span>
                                <span className="font-mono text-gray-400">{ex.sets} x {ex.reps}</span>
                            </div>
                        ))}
                        {template.sections && template.sections.map((section, sIndex) => (
                            <div key={`sec-${sIndex}`} className="pt-2">
                                <p className="font-semibold text-amber-300">{section.title}</p>
                                <ul className="pl-4 space-y-1">
                                    {section.exercises.map((ex, exIndex) => (
                                        <li key={`sec-${sIndex}-ex-${exIndex}`} className="flex justify-between">
                                            <span>{ex.name}</span>
                                            <span className="font-mono text-gray-400">{ex.sets} x {ex.reps}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-700">
            <button className="text-sm w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition-colors">
                Edit Template
            </button>
        </div>
    </Card>
);

const WorkoutLibrary: React.FC<{ templates: WorkoutTemplate[] }> = ({ templates }) => {
    const beginnerPlans = templates.filter(t => t.level === 'Beginner');
    const intermediatePlans = templates.filter(t => t.level === 'Intermediate');
    const advancedPlans = templates.filter(t => t.level === 'Advanced');

    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-green-500">Beginner Workouts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {beginnerPlans.map(template => <WorkoutTemplateCard key={template.id} template={template} />)}
                </div>
            </section>
             <section>
                <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-yellow-500">Intermediate Workouts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {intermediatePlans.map(template => <WorkoutTemplateCard key={template.id} template={template} />)}
                </div>
            </section>
             <section>
                <h2 className="text-2xl font-semibold text-gray-200 mb-6 pb-2 border-b-2 border-red-500">Advanced Workouts</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {advancedPlans.map(template => <WorkoutTemplateCard key={template.id} template={template} />)}
                </div>
            </section>
        </div>
    );
};


const Workouts: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'library' | 'scheduler'>('library');
    const [templates, setTemplates] = useState<WorkoutTemplate[]>(INITIAL_WORKOUT_TEMPLATES);
    const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

    const handleSaveTemplate = (newTemplateData: { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced'; content: string }) => {
        const newTemplate: WorkoutTemplate = {
            id: templates.length + 100, // Use a high ID to avoid collision
            name: newTemplateData.name,
            level: newTemplateData.level,
            content: newTemplateData.content,
            exercises: [], // AI-generated content is not parsed into exercises
            isNew: true, // Mark as new
        };
        setTemplates(prev => [...prev, newTemplate]);
        setIsGeneratorModalOpen(false);
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
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center"
                    >
                        <SparkleIcon className="w-5 h-5 mr-2" />
                        Create New Template with AI
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
    