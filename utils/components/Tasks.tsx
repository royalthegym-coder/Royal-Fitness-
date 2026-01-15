
import React, { useState, useMemo } from 'react';
import { INITIAL_TASKS } from '../../constants';
import { Task } from '../../types';
import Card from './common/Card';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import TaskFormModal from './TaskFormModal';
import ConfirmationDialog from './common/ConfirmationDialog';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

type SortOption = 'priority' | 'dueDate';
type FilterPriority = 'All' | 'Low' | 'Medium' | 'High';
type ViewMode = 'list' | 'calendar';

const priorityMap: Record<Task['priority'], number> = { High: 3, Medium: 2, Low: 1 };

const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
        case 'High': return 'bg-red-500';
        case 'Medium': return 'bg-amber-500';
        case 'Low': return 'bg-green-500';
        default: return 'bg-gray-500';
    }
};

const getPriorityBadgeStyles = (priority: Task['priority']) => {
    switch (priority) {
        case 'High': return 'bg-red-900/30 text-red-400 border-red-500/30';
        case 'Medium': return 'bg-amber-900/30 text-amber-400 border-amber-500/30';
        case 'Low': return 'bg-green-900/30 text-green-400 border-green-500/30';
        default: return 'bg-gray-700 text-gray-300';
    }
};

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [sortOption, setSortOption] = useState<SortOption>('priority');
    const [filterPriority, setFilterPriority] = useState<FilterPriority>('All');
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

    const filteredAndSortedTasks = useMemo(() => {
        let filtered = [...tasks];

        if (filterPriority !== 'All') {
            filtered = filtered.filter(task => task.priority === filterPriority);
        }

        filtered.sort((a, b) => {
            if (sortOption === 'priority') {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                // High priority first
                const pDiff = priorityMap[b.priority] - priorityMap[a.priority];
                if (pDiff !== 0) return pDiff;
                // Then by date
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (sortOption === 'dueDate') {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                const dDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                if (dDiff !== 0) return dDiff;
                return priorityMap[b.priority] - priorityMap[a.priority];
            }
            return 0;
        });

        return filtered;
    }, [tasks, filterPriority, sortOption]);

    const handleAddTask = () => {
        setSelectedTask(null);
        setIsFormModalOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsFormModalOpen(true);
    };

    const handleDeleteTask = (task: Task) => {
        setTaskToDelete(task);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (taskToDelete) {
            setTasks(tasks.filter(t => t.id !== taskToDelete.id));
        }
        setIsConfirmModalOpen(false);
        setTaskToDelete(null);
    };
    
    const handleSaveTask = (taskData: Omit<Task, 'id' | 'completed'> & { id?: number }) => {
        if (taskData.id !== undefined) {
             setTasks(tasks.map(t => t.id === taskData.id ? { ...t, ...taskData } : t));
        } else {
            const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
            const newTask: Task = { ...taskData, id: newId, completed: false };
            setTasks([...tasks, newTask]);
        }
        setIsFormModalOpen(false);
    };
    
    const handleToggleComplete = (taskId: number) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
    };

    const today = getLocalToday();

    const getDueDateStatus = (dateStr: string, completed: boolean) => {
        if (completed) return { text: 'Completed', color: 'text-gray-500' };
        if (dateStr < today) return { text: 'Overdue', color: 'text-red-500 font-bold' };
        if (dateStr === today) return { text: 'Due Today', color: 'text-amber-500 font-bold' };
        return { text: dateStr, color: 'text-gray-400' };
    };

    // Calendar Helpers
    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-32 border border-gray-700 bg-gray-900/50"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            // Construct local date string carefully
            const dateObj = new Date(year, month, day);
            const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            
            // Use filtered tasks here to respect the filter controls
            const dayTasks = filteredAndSortedTasks.filter(t => t.dueDate === dateStr);

            days.push(
                <div key={day} className="h-32 border border-gray-700 p-2 relative bg-gray-800/20 hover:bg-gray-800 transition-colors group overflow-y-auto custom-scrollbar">
                    <span className={`text-sm font-bold ${dateStr === today ? 'bg-amber-500 text-gray-900 px-1.5 rounded-full' : 'text-gray-400'}`}>
                        {day}
                    </span>
                    <div className="mt-1 space-y-1">
                        {dayTasks.map(task => (
                            <div 
                                key={task.id}
                                onClick={() => handleEditTask(task)}
                                className={`text-[10px] p-1 rounded cursor-pointer truncate flex items-center border-l-2 ${task.completed ? 'opacity-50 line-through bg-gray-700 border-gray-500' : 'bg-gray-700 hover:bg-gray-600'} ${
                                    task.priority === 'High' ? 'border-red-500' : 
                                    task.priority === 'Medium' ? 'border-amber-500' : 'border-green-500'
                                }`}
                                title={task.title}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${getPriorityColor(task.priority)}`}></div>
                                {task.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center">
                    <ClipboardListIcon />
                    <div className="ml-3">
                        <h1 className="text-3xl font-bold text-amber-400">Tasks & Reminders</h1>
                        <p className="text-gray-400 text-sm">Manage daily operations and to-dos.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'list' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>
                        List View
                    </button>
                    <button onClick={() => setViewMode('calendar')} className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${viewMode === 'calendar' ? 'bg-amber-500 text-gray-900' : 'bg-gray-700 text-gray-300'}`}>
                        Calendar View
                    </button>
                    <button onClick={handleAddTask} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center ml-2">
                        + New Task
                    </button>
                </div>
            </div>

            <Card className="bg-gray-800 border-gray-700">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-bold">Filter Priority:</span>
                        <select 
                            value={filterPriority} 
                            onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-amber-500"
                        >
                            <option value="All">All</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-bold">Sort By:</span>
                        <select 
                            value={sortOption} 
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-amber-500"
                        >
                            <option value="priority">Priority</option>
                            <option value="dueDate">Due Date</option>
                        </select>
                    </div>
                    <div className="ml-auto flex items-center gap-4 text-xs text-gray-400">
                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> High</div>
                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span> Medium</div>
                        <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Low</div>
                    </div>
                </div>
            </Card>

            {viewMode === 'list' && (
                <div className="grid grid-cols-1 gap-4">
                    {filteredAndSortedTasks.length === 0 && <p className="text-center text-gray-500 py-8">No tasks found matching your filters.</p>}
                    {filteredAndSortedTasks.map(task => {
                        const status = getDueDateStatus(task.dueDate, task.completed);
                        return (
                            <div 
                                key={task.id} 
                                className={`p-4 rounded-xl border flex items-center gap-4 transition-all hover:bg-gray-800/80 group ${
                                    task.completed ? 'bg-gray-800/40 border-gray-700 opacity-60' : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                                }`}
                            >
                                <button 
                                    onClick={() => handleToggleComplete(task.id)}
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        task.completed ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-amber-500'
                                    }`}
                                >
                                    {task.completed && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                </button>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className={`font-bold text-lg ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase ${getPriorityBadgeStyles(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    {task.description && <p className="text-sm text-gray-400">{task.description}</p>}
                                </div>

                                <div className="text-right min-w-[100px]">
                                    <div className={`text-xs font-bold ${status.color} flex items-center justify-end gap-1`}>
                                        <CalendarIcon className="w-3 h-3"/> {status.text}
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditTask(task)} className="text-blue-400 hover:text-blue-300 p-1"><EditIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteTask(task)} className="text-red-400 hover:text-red-300 p-1"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewMode === 'calendar' && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <div className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700">
                        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-700 rounded text-gray-300">&lt; Prev</button>
                        <h2 className="text-lg font-bold text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-700 rounded text-gray-300">Next &gt;</button>
                    </div>
                    <div className="grid grid-cols-7 text-center bg-gray-900 text-gray-400 text-sm font-bold py-2 border-b border-gray-700">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 bg-gray-800">
                        {renderCalendar()}
                    </div>
                </div>
            )}

            <TaskFormModal 
                isOpen={isFormModalOpen} 
                onClose={() => setIsFormModalOpen(false)} 
                onSave={handleSaveTask} 
                task={selectedTask} 
            />

            <ConfirmationDialog 
                isOpen={isConfirmModalOpen} 
                onClose={() => setIsConfirmModalOpen(false)} 
                onConfirm={confirmDelete} 
                title="Delete Task" 
                message="Are you sure you want to delete this task? This action cannot be undone." 
            />
        </div>
    );
};

export default Tasks;
