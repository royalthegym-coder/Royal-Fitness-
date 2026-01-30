
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

const getPriorityBorderClass = (priority: Task['priority']) => {
    switch (priority) {
        case 'High': return 'border-l-red-500';
        case 'Medium': return 'border-l-amber-500';
        case 'Low': return 'border-l-green-500';
        default: return 'border-l-gray-500';
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
    const [editingDateTaskId, setEditingDateTaskId] = useState<number | null>(null);

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

    const handleQuickDateUpdate = (taskId: number, newDate: string) => {
        if (newDate) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, dueDate: newDate } : t));
        }
        setEditingDateTaskId(null);
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

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="border-r border-b border-gray-700 min-h-[100px]"></div>);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = new Date(year, month, day).toISOString().split('T')[0];
            const daysTasks = tasks.filter(t => t.dueDate === dateString);
            
            days.push(
                <div key={day} className="p-2 border-r border-b border-gray-700 min-h-[100px] hover:bg-gray-800/30 transition-colors">
                    <div className={`font-semibold text-sm mb-1 ${dateString === today ? 'text-amber-500' : 'text-gray-400'}`}>{day}</div>
                    <div className="space-y-1">
                        {daysTasks.map(task => (
                            <div 
                                key={task.id}
                                onClick={() => handleEditTask(task)}
                                className={`text-[10px] px-1.5 py-1 rounded cursor-pointer truncate flex items-center gap-1.5 transition-all ${task.completed ? 'bg-gray-800 text-gray-500 line-through' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} title={`${task.priority} Priority`}></div>
                                <span className="truncate">{task.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return days;
    }, [currentDate, tasks, today]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                        <ClipboardListIcon />
                        <span className="ml-3">Task Management</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Track staff duties, reminders, and gym maintenance.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-gray-800 rounded-lg p-1 flex border border-gray-700">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${viewMode === 'list' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            List
                        </button>
                        <button 
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${viewMode === 'calendar' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Calendar
                        </button>
                    </div>
                    <button 
                        onClick={handleAddTask}
                        className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors shadow-lg flex items-center"
                    >
                        <span className="text-lg mr-1 leading-none">+</span> Add Task
                    </button>
                </div>
            </div>

            {/* List View Controls & Content */}
            {viewMode === 'list' && (
                <>
                    {/* Improved Filter & Sort Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700 backdrop-blur-sm shadow-sm">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Priority Filter</span>
                            <div className="relative w-full sm:w-auto">
                                <select 
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
                                    className="w-full sm:w-40 bg-gray-900 text-white pl-3 pr-8 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:border-amber-500 appearance-none cursor-pointer hover:border-gray-500 transition-colors font-medium"
                                >
                                    <option value="All">All Tasks</option>
                                    <option value="High">High Priority</option>
                                    <option value="Medium">Medium Priority</option>
                                    <option value="Low">Low Priority</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Sort Order</span>
                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700 w-full sm:w-auto">
                                <button 
                                    onClick={() => setSortOption('priority')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${sortOption === 'priority' ? 'bg-amber-500 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Priority
                                </button>
                                <button 
                                    onClick={() => setSortOption('dueDate')}
                                    className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all ${sortOption === 'dueDate' ? 'bg-amber-500 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Due Date
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {filteredAndSortedTasks.length === 0 && (
                            <div className="text-center py-16 text-gray-500 bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-800">
                                <p className="font-medium">No tasks found matching your filters.</p>
                                <p className="text-xs mt-1">Try changing the priority filter or add a new task.</p>
                            </div>
                        )}
                        {filteredAndSortedTasks.map(task => {
                            const { text: dueText, color: dueColor } = getDueDateStatus(task.dueDate, task.completed);
                            
                            return (
                                <div 
                                    key={task.id} 
                                    className={`bg-gray-800/80 rounded-xl p-4 border-y border-r border-gray-700 hover:border-gray-500 transition-all duration-200 border-l-4 ${getPriorityBorderClass(task.priority)} shadow-sm group`}
                                >
                                    <div className="flex items-start gap-4">
                                        <button 
                                            onClick={() => handleToggleComplete(task.id)}
                                            className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                task.completed 
                                                ? 'bg-green-500 border-green-500 text-gray-900' 
                                                : 'border-gray-500 hover:border-amber-500 text-transparent'
                                            }`}
                                        >
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </button>
                                        
                                        <div className="flex-grow cursor-pointer" onClick={() => handleEditTask(task)}>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} title={`${task.priority} Priority`}></div>
                                                    <h3 className={`font-bold text-lg ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                                                        {task.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center ${getPriorityBadgeStyles(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                    {editingDateTaskId === task.id ? (
                                                        <input 
                                                            type="date"
                                                            defaultValue={task.dueDate}
                                                            className="bg-gray-700 text-white text-xs border border-amber-500 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onBlur={(e) => handleQuickDateUpdate(task.id, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleQuickDateUpdate(task.id, (e.currentTarget as HTMLInputElement).value);
                                                                if (e.key === 'Escape') setEditingDateTaskId(null);
                                                            }}
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span 
                                                            className={`text-xs ${dueColor} font-medium flex items-center cursor-pointer hover:bg-gray-700/50 px-1.5 py-0.5 rounded transition-colors group/date`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!task.completed) setEditingDateTaskId(task.id);
                                                            }}
                                                            title={task.completed ? "Task completed" : "Click to change due date"}
                                                        >
                                                            <CalendarIcon className="w-3 h-3 mr-1" />
                                                            {dueText}
                                                            {!task.completed && <EditIcon className="w-3 h-3 ml-1.5 opacity-0 group-hover/date:opacity-100 text-gray-500 transition-opacity" />}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {task.description && (
                                                <p className={`text-sm ${task.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditTask(task)} 
                                                className="p-1.5 text-gray-400 hover:text-blue-400 bg-gray-700/50 hover:bg-gray-700 rounded"
                                                title="Edit"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTask(task)} 
                                                className="p-1.5 text-gray-400 hover:text-red-400 bg-gray-700/50 hover:bg-gray-700 rounded"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Calendar View Content */}
            {viewMode === 'calendar' && (
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-gray-700 bg-gray-800 text-gray-300">
                            &lt; Prev
                        </button>
                        <h2 className="text-xl font-bold text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-gray-700 bg-gray-800 text-gray-300">
                            Next &gt;
                        </button>
                    </div>
                    <div className="grid grid-cols-7 text-center font-bold text-gray-500 mb-2 text-sm uppercase tracking-wide">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 border-t border-l border-gray-700 bg-gray-800 rounded-lg overflow-hidden">
                        {calendarGrid}
                    </div>
                </Card>
            )}

            {/* Modals */}
            {isFormModalOpen && (
                <TaskFormModal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    onSave={handleSaveTask}
                    task={selectedTask}
                />
            )}

            <ConfirmationDialog
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default Tasks;
