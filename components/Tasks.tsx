import React, { useState, useMemo } from 'react';
import { INITIAL_TASKS } from '../constants';
import { Task } from '../types';
import Card from './common/Card';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import TaskFormModal from './TaskFormModal';
import ConfirmationDialog from './common/ConfirmationDialog';
import { TrashIcon } from './icons/TrashIcon';
import { EditIcon } from './icons/EditIcon';

type SortOption = 'priority' | 'dueDate';
type FilterPriority = 'All' | 'Low' | 'Medium' | 'High';

const priorityMap: Record<Task['priority'], number> = { High: 3, Medium: 2, Low: 1 };

const PriorityBadge: React.FC<{ priority: Task['priority'] }> = ({ priority }) => {
    const colors = {
        Low: 'bg-green-700 text-green-200',
        Medium: 'bg-yellow-700 text-yellow-200',
        High: 'bg-red-700 text-red-200',
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[priority]}`}>{priority}</span>;
};


const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
    const [sortOption, setSortOption] = useState<SortOption>('priority');
    const [filterPriority, setFilterPriority] = useState<FilterPriority>('All');
    
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
                return priorityMap[b.priority] - priorityMap[a.priority] || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            if (sortOption === 'dueDate') {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() || priorityMap[b.priority] - priorityMap[a.priority];
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

    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <ClipboardListIcon />
                    <span className="ml-3">My Tasks</span>
                </h1>
                <button onClick={handleAddTask} className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400">
                    Add Task
                </button>
            </div>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    {/* Filter Controls */}
                    <div className="flex items-center space-x-2 bg-gray-700 p-1 rounded-lg">
                        {(['All', 'Low', 'Medium', 'High'] as FilterPriority[]).map(p => (
                            <button key={p} onClick={() => setFilterPriority(p)} className={`px-3 py-1 text-sm rounded-md ${filterPriority === p ? 'bg-amber-500 text-gray-900 font-semibold' : 'text-gray-300'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    {/* Sort Controls */}
                    <div>
                        <label htmlFor="sort" className="text-sm text-gray-400 mr-2">Sort by:</label>
                        <select id="sort" value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="bg-gray-700 p-2 rounded-lg border border-gray-600">
                            <option value="priority">Priority</option>
                            <option value="dueDate">Due Date</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredAndSortedTasks.map(task => {
                        const isOverdue = task.dueDate < today && !task.completed;
                        return (
                             <div key={task.id} className={`p-4 rounded-lg flex items-center gap-4 ${task.completed ? 'bg-gray-800/50 opacity-60' : 'bg-gray-700/50'}`}>
                                <input type="checkbox" checked={task.completed} onChange={() => handleToggleComplete(task.id)} className="w-5 h-5 rounded text-amber-500 bg-gray-600 border-gray-500 focus:ring-amber-500" />
                                <div className="flex-grow">
                                    <p className={`font-semibold ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                                    {task.description && <p className={`text-sm ${task.completed ? 'line-through text-gray-600' : 'text-gray-400'}`}>{task.description}</p>}
                                </div>
                                <div className="flex items-center gap-4">
                                     <div className="hidden sm:block">
                                        <PriorityBadge priority={task.priority} />
                                    </div>
                                    <div className={`text-sm font-semibold hidden md:block ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>{new Date(task.dueDate).toLocaleDateString('en-CA')}</div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditTask(task)} className="p-2 text-gray-400 hover:text-white"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDeleteTask(task)} className="p-2 text-gray-400 hover:text-red-400"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    {filteredAndSortedTasks.length === 0 && (
                        <p className="text-center text-gray-500 py-8">No tasks match your criteria.</p>
                    )}
                </div>
            </Card>
            
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
                message={`Are you sure you want to delete the task "${taskToDelete?.title}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default Tasks;
