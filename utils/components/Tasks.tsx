
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../../types';
import Card from './common/Card';
import { 
    Plus, Trash2, Edit3, 
    Calendar, CheckCircle2, Clock, 
    Zap, Database, ShieldAlert, Search, Check,
    BrainCircuit, Sparkles, RefreshCw, Cpu, Filter,
    Link as LinkIcon, Lock, ArrowUp, ArrowDown,
    AlertTriangle, TrendingUp, Coffee, LayoutTemplate
} from 'lucide-react';
import TaskFormModal from './TaskFormModal';
import ConfirmationDialog from './common/ConfirmationDialog';
import { useToast } from '../hooks/useToast';
import { getComplexResponse } from '../../lib/core_ai';
import { BotIcon } from './icons/BotIcon';

const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
        case 'High': return { color: 'text-red-500', border: 'border-red-500/50', bg: 'bg-red-500/10', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]', icon: <AlertTriangle className="w-3 h-3" /> };
        case 'Medium': return { color: 'text-amber-500', border: 'border-amber-500/50', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]', icon: <TrendingUp className="w-3 h-3" /> };
        case 'Low': return { color: 'text-cyan-500', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]', icon: <Coffee className="w-3 h-3" /> };
        default: return { color: 'text-gray-500', border: 'border-gray-500/30', bg: 'bg-gray-500/10', glow: '', icon: <Clock className="w-3 h-3" /> };
    }
};

const TASK_TEMPLATES = [
    {
        name: 'Organize Gym Schedule',
        items: [
            { title: 'Check Equipment Availability', description: 'Verify all machines are functional.', priority: 'High', type: 'sub' },
            { title: 'Create Member Workout Plans', description: 'Generate weekly plans for active members.', priority: 'Medium', type: 'sub' },
            { title: 'Finalize Weekly Schedule', description: 'Publish the roster and class timings.', priority: 'High', type: 'main' }
        ]
    }
];

const Tasks: React.FC = () => {
    const { addToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, title: 'Calibrate Biometric Sensors', description: 'Perform full system calibration and check sensor alignment.', priority: 'High', dueDate: new Date().toISOString().split('T')[0], completed: false, order: 0 },
        { id: 2, title: 'Restock Whey Isolate', description: 'Inventory level critical (Low).', priority: 'Medium', dueDate: '2024-08-10', completed: false, order: 1 }
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'All' | 'Active' | 'Completed'>('All');
    const [priorityFilter, setPriorityFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
    const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('priority');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
    const [recurringEditPrompt, setRecurringEditPrompt] = useState<{taskData: any, originalTask: Task} | null>(null);
    const [recurringDeletePrompt, setRecurringDeletePrompt] = useState<Task | null>(null);
    const [showTemplates, setShowTemplates] = useState(false);

    // AI State
    const [aiInput, setAiInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isAutoPrioritizing, setIsAutoPrioritizing] = useState(false);

    const handleAutoPrioritize = async () => {
        if (tasks.length === 0) return;
        setIsAutoPrioritizing(true);
        addToast("Smart Core: Analyzing Task Priorities...", "info");

        const prompt = `
            ACT AS GYM OPS AI.
            Analyze the following list of tasks and suggest a new priority (Low, Medium, High) for each based on their title, description, and due date.
            Today's Date: ${new Date().toISOString().split('T')[0]}
            
            Tasks:
            ${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, description: t.description, dueDate: t.dueDate, currentPriority: t.priority })))}
            
            Return JSON only in this format:
            [
                { "id": number, "priority": "Low" | "Medium" | "High" }
            ]
        `;

        try {
            const res = await getComplexResponse(prompt);
            const cleanJson = res.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);
            
            if (Array.isArray(data)) {
                setTasks(prev => prev.map(t => {
                    const updated = data.find((d: any) => d.id === t.id);
                    return updated ? { ...t, priority: updated.priority } : t;
                }));
                addToast("Task Priorities Auto-Adjusted.", "success");
            }
        } catch (e) {
            addToast("Auto-Prioritization Failed.", "error");
        } finally {
            setIsAutoPrioritizing(false);
        }
    };

    // Auto-generate recurring tasks
    useEffect(() => {
        setTasks(prev => {
            const today = new Date().toISOString().split('T')[0];
            const newTasks: Task[] = [];
            let hasChanges = false;

            prev.forEach(task => {
                if (task.isRecurring && task.recurrencePattern) {
                    // Find all instances of this recurring task
                    const instances = prev.filter(t => t.title === task.title && t.isRecurring);
                    const latestInstance = instances.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0];
                    
                    if (latestInstance && latestInstance.dueDate < today) {
                        let currentDate = new Date(latestInstance.dueDate);
                        let nextDueDateString = latestInstance.dueDate;

                        while (nextDueDateString < today) {
                            if (task.recurrencePattern === 'daily') {
                                currentDate.setDate(currentDate.getDate() + 1);
                            } else if (task.recurrencePattern === 'weekly') {
                                currentDate.setDate(currentDate.getDate() + 7);
                            } else if (task.recurrencePattern === 'monthly') {
                                currentDate.setMonth(currentDate.getMonth() + 1);
                            } else {
                                break; // Safety break
                            }
                            
                            nextDueDateString = currentDate.toISOString().split('T')[0];
                            
                            // Check if the next instance already exists
                            const exists = prev.some(t => 
                                t.title === task.title && 
                                t.dueDate === nextDueDateString && 
                                t.isRecurring
                            ) || newTasks.some(t => 
                                t.title === task.title && 
                                t.dueDate === nextDueDateString && 
                                t.isRecurring
                            );
                            
                            if (!exists && nextDueDateString <= today) {
                                newTasks.push({
                                    ...task,
                                    id: Date.now() + Math.random(),
                                    dueDate: nextDueDateString,
                                    completed: false
                                });
                                hasChanges = true;
                            }
                        }
                    }
                }
            });

            if (hasChanges) {
                return [...prev, ...newTasks];
            }
            return prev;
        });
    }, []);

    const handleApplyTemplate = (template: typeof TASK_TEMPLATES[0]) => {
        const today = new Date().toISOString().split('T')[0];
        const baseId = Date.now();
        const newTasks: Task[] = [];
        const subTaskIds: number[] = [];

        // 1. Create Sub Tasks
        template.items.filter(i => i.type === 'sub').forEach((item, index) => {
            const id = baseId + index;
            subTaskIds.push(id);
            newTasks.push({
                id,
                title: item.title,
                description: item.description,
                priority: item.priority as any,
                dueDate: today,
                completed: false,
                order: 0
            });
        });

        // 2. Create Main Task with dependencies
        template.items.filter(i => i.type === 'main').forEach((item, index) => {
            newTasks.push({
                id: baseId + 100 + index,
                title: item.title,
                description: item.description,
                priority: item.priority as any,
                dueDate: today,
                completed: false,
                dependencies: subTaskIds,
                order: 0
            });
        });

        setTasks(prev => [...newTasks, ...prev]);
        addToast(`Template Applied: ${template.name}`, "success");
        setShowTemplates(false);
    };

    const cyclePriority = (taskId: number, currentPriority: Task['priority']) => {
        const priorities: Task['priority'][] = ['Low', 'Medium', 'High'];
        const currentIndex = priorities.indexOf(currentPriority);
        const nextPriority = priorities[(currentIndex + 1) % priorities.length];
        
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: nextPriority } : t));
        addToast(`Priority Updated: ${nextPriority}`, "info");
    };

    const moveTask = (taskId: number, direction: 'up' | 'down') => {
        const sortedTasks = [...filteredTasks];
        const index = sortedTasks.findIndex(t => t.id === taskId);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= sortedTasks.length) return;

        const targetTask = sortedTasks[targetIndex];
        
        // Swap priorities if different
        if (targetTask.priority !== sortedTasks[index].priority) {
            const tempPriority = sortedTasks[index].priority;
            setTasks(prev => prev.map(t => {
                if (t.id === taskId) return { ...t, priority: targetTask.priority };
                if (t.id === targetTask.id) return { ...t, priority: tempPriority };
                return t;
            }));
        } else {
            // Swap order if same priority
            const tempOrder = sortedTasks[index].order ?? 0;
            const targetOrder = targetTask.order ?? 0;
            setTasks(prev => prev.map(t => {
                if (t.id === taskId) return { ...t, order: targetOrder };
                if (t.id === targetTask.id) return { ...t, order: tempOrder };
                return t;
            }));
        }
    };

    const filteredTasks = useMemo(() => {
        let result = tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filter === 'All' ? true : filter === 'Completed' ? t.completed : !t.completed;
            const matchesPriority = priorityFilter === 'All' ? true : t.priority === priorityFilter;
            return matchesSearch && matchesStatus && matchesPriority;
        });

        return result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'dueDate') {
                comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            } else if (sortBy === 'priority') {
                const priorityWeight = { 'High': 1, 'Medium': 2, 'Low': 3 };
                comparison = priorityWeight[a.priority] - priorityWeight[b.priority];
                // Secondary sort by order
                if (comparison === 0) {
                    comparison = (a.order ?? 0) - (b.order ?? 0);
                }
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [tasks, searchTerm, filter, priorityFilter, sortBy, sortOrder]);

    const efficiencyScore = useMemo(() => {
        if (tasks.length === 0) return 100;
        const completed = tasks.filter(t => t.completed).length;
        return Math.round((completed / tasks.length) * 100);
    }, [tasks]);

    const handleToggle = (id: number) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (task.completed) {
            // Instantly un-complete without confirmation
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: false } : t));
        } else {
            // Check dependencies
            const unmetDependencies = (task.dependencies || []).filter(depId => {
                const depTask = tasks.find(t => t.id === depId);
                return depTask && !depTask.completed;
            });

            if (unmetDependencies.length > 0) {
                const depTitles = unmetDependencies.map(depId => {
                    const depTask = tasks.find(t => t.id === depId);
                    return depTask?.title || 'Unknown Task';
                }).join(', ');
                addToast(`Dependency Block: Complete prerequisites first: ${depTitles}`, "error");
                return;
            }

            // Show confirmation before completing
            setTaskToComplete(task);
        }
    };
    
    const confirmComplete = () => {
        if (taskToComplete) {
            setTasks(prev => {
                const newTasks = [...prev];
                const taskIndex = newTasks.findIndex(t => t.id === taskToComplete.id);
                if (taskIndex !== -1) {
                    newTasks[taskIndex] = { ...newTasks[taskIndex], completed: true };
                    
                    // Handle recurring task
                    if (taskToComplete.isRecurring && taskToComplete.recurrencePattern) {
                        const currentDueDate = new Date(taskToComplete.dueDate);
                        const nextDueDate = new Date(currentDueDate);
                        
                        if (taskToComplete.recurrencePattern === 'daily') {
                            nextDueDate.setDate(nextDueDate.getDate() + 1);
                        } else if (taskToComplete.recurrencePattern === 'weekly') {
                            nextDueDate.setDate(nextDueDate.getDate() + 7);
                        } else if (taskToComplete.recurrencePattern === 'monthly') {
                            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                        } else {
                            return newTasks; // Safety return
                        }
                        
                        const nextDueDateString = nextDueDate.toISOString().split('T')[0];
                        
                        // Check if the next instance already exists to prevent duplicates
                        const exists = prev.some(t => 
                            t.title === taskToComplete.title && 
                            t.dueDate === nextDueDateString && 
                            t.isRecurring
                        );
                        
                        if (!exists) {
                            newTasks.push({
                                ...taskToComplete,
                                id: Date.now(),
                                dueDate: nextDueDateString,
                                completed: false
                            });
                            setTimeout(() => addToast(`Recurring instance created for ${nextDueDateString}`, "info"), 500);
                        }
                    }
                }
                return newTasks;
            });
            addToast("Smart Task Node: RESOLVED.", "success");
        }
        setTaskToComplete(null);
    };

    const handleSave = (taskData: any) => {
        if (selectedTask) {
            if (selectedTask.isRecurring) {
                setRecurringEditPrompt({ taskData, originalTask: selectedTask });
                return;
            }
            setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...taskData } : t));
            addToast("Task Vector Recalibrated.", "info");
        } else {
            const newTask: Task = {
                id: Date.now(),
                completed: false,
                ...taskData
            };
            setTasks(prev => [newTask, ...prev]);
            addToast("New Task Node Initialized.", "success");
        }
        setIsFormOpen(false);
        setSelectedTask(null);
    };

    const confirmRecurringEdit = (updateAllFuture: boolean) => {
        if (!recurringEditPrompt) return;
        const { taskData, originalTask } = recurringEditPrompt;
        
        setTasks(prev => {
            if (updateAllFuture) {
                // Filter out all future uncompleted instances of this recurring task
                const filtered = prev.filter(t => {
                    if (t.id === originalTask.id) return true;
                    const isFutureInstance = t.isRecurring && t.title === originalTask.title && new Date(t.dueDate) > new Date(originalTask.dueDate) && !t.completed;
                    return !isFutureInstance;
                });
                
                // Update the original task
                return filtered.map(t => t.id === originalTask.id ? { ...t, ...taskData } : t);
            } else {
                // Update only this instance
                return prev.map(t => t.id === originalTask.id ? { ...t, ...taskData } : t);
            }
        });
        
        addToast("Task Vector Recalibrated.", "info");
        setRecurringEditPrompt(null);
        setIsFormOpen(false);
        setSelectedTask(null);
    };

    const confirmDelete = () => {
        if (taskToDelete) {
            if (taskToDelete.isRecurring) {
                setRecurringDeletePrompt(taskToDelete);
                setTaskToDelete(null);
                return;
            }
            setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
            addToast("Node Wiped from Kernel.", "error");
        }
        setTaskToDelete(null);
    };

    const confirmRecurringDelete = (deleteAllFuture: boolean) => {
        if (!recurringDeletePrompt) return;
        
        setTasks(prev => {
            if (deleteAllFuture) {
                return prev.filter(t => {
                    if (t.id === recurringDeletePrompt.id) return false;
                    const isFutureInstance = t.isRecurring && t.title === recurringDeletePrompt.title && new Date(t.dueDate) > new Date(recurringDeletePrompt.dueDate) && !t.completed;
                    return !isFutureInstance;
                });
            } else {
                return prev.filter(t => t.id !== recurringDeletePrompt.id);
            }
        });
        
        addToast("Node Wiped from Kernel.", "error");
        setRecurringDeletePrompt(null);
    };

    const handleAiInject = async () => {
        if (!aiInput.trim()) return;
        setIsThinking(true);
        addToast("Smart Core: Parsing Directive...", "info");

        const prompt = `
            ACT AS GYM OPS AI.
            Parse this command into a structured task: "${aiInput}"
            Get Today's Date: ${new Date().toISOString().split('T')[0]}
            
            Return JSON only:
            {
                "title": "Short concise title",
                "description": "Details extracted",
                "priority": "Low" | "Medium" | "High" (Infer urgency),
                "dueDate": "YYYY-MM-DD" (Infer date relative to today),
                "isRecurring": boolean (true if the command implies a repeating task like "every day", "weekly"),
                "recurrencePattern": "daily" | "weekly" | "monthly" (only if isRecurring is true)
            }
        `;

        try {
            const res = await getComplexResponse(prompt);
            const cleanJson = res.replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);
            
            handleSave(data);
            setAiInput('');
        } catch (e) {
            addToast("Smart Parse Failed. Use Manual Entry.", "error");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            {/* Fitness Future-HUD HEADER */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-cyan-500/30 relative overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                            <Zap className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Sovereign Ops Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">STATUS: KERNEL_SYNCED</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Task <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Nodes</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={handleAutoPrioritize}
                            disabled={isAutoPrioritizing || tasks.length === 0}
                            className="relative overflow-hidden bg-indigo-900/50 border border-indigo-500/30 text-indigo-400 font-bold px-6 py-5 rounded-[2.5rem] text-[12px] uppercase tracking-widest hover:bg-indigo-800 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                            {isAutoPrioritizing ? <BotIcon className="w-5 h-5 animate-spin relative z-10" /> : <BrainCircuit className="w-5 h-5 relative z-10" />}
                            <span className="relative z-10">{isAutoPrioritizing ? 'Analyzing...' : 'Auto-Prioritize'}</span>
                        </button>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="relative overflow-hidden bg-gray-900 border border-white/10 text-white font-bold px-6 py-5 rounded-[2.5rem] text-[12px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl active:scale-95 flex items-center gap-3 group"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                                <LayoutTemplate className="w-5 h-5 relative z-10" /> 
                                <span className="relative z-10">Templates</span>
                            </button>
                            
                            {showTemplates && (
                                <div className="absolute top-full mt-4 right-0 w-72 bg-black border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                                    <div className="p-4 border-b border-white/5">
                                        <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Quick Templates</h4>
                                    </div>
                                    <div className="p-2">
                                        {TASK_TEMPLATES.map((template, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleApplyTemplate(template)}
                                                className="w-full text-left p-3 hover:bg-gray-900 rounded-xl group transition-colors"
                                            >
                                                <div className="text-xs font-bold text-white group-hover:text-amber-500 transition-colors mb-1">{template.name}</div>
                                                <div className="text-[10px] text-gray-600 italic">{template.items.length} tasks included</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={() => { setSelectedTask(null); setIsFormOpen(true); }}
                            className="bg-white text-black font-black px-12 py-5 rounded-[2.5rem] text-[12px] uppercase tracking-widest hover:bg-amber-500 transition-all shadow-2xl active:scale-95 flex items-center gap-4 group"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform relative z-10" /> 
                            <span className="relative z-10">Initialize Task</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. TASK LIST DECK */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Control Bar */}
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-950/60 p-4 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
                        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-start">
                            <div className="flex bg-black rounded-2xl p-1.5 border border-white/5">
                                {['All', 'Active', 'Completed'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f as any)}
                                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-amber-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="relative group/filter">
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value as any)}
                                    className="appearance-none bg-black border border-white/5 rounded-2xl pl-5 pr-10 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none focus:border-amber-500 focus:text-white hover:text-gray-300 transition-all cursor-pointer h-full"
                                >
                                    <option value="All">Priority: All</option>
                                    <option value="High">Priority: High</option>
                                    <option value="Medium">Priority: Mid</option>
                                    <option value="Low">Priority: Low</option>
                                </select>
                                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600 group-hover/filter:text-amber-500 transition-colors pointer-events-none" />
                            </div>

                            {/* Sorting Controls */}
                            <div className="flex items-center gap-2 bg-black rounded-2xl p-1.5 border border-white/5 h-full">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority')}
                                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-gray-500 focus:outline-none focus:text-white hover:text-gray-300 transition-all cursor-pointer px-3 py-2 appearance-none"
                                >
                                    <option value="dueDate">Sort: Date</option>
                                    <option value="priority">Sort: Priority</option>
                                </select>
                                <div className="w-px h-4 bg-gray-800"></div>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="p-2 rounded-xl hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                                    title={sortOrder === 'asc' ? "Ascending" : "Descending"}
                                >
                                    {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                </button>
                            </div>
                        </div>

                        <div className="relative w-full md:w-64 group">
                             <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                             <div className="relative bg-black rounded-2xl flex items-center">
                                 <Search className="absolute left-4 w-4 h-4 text-gray-500" />
                                 <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Scan Task Vectors..."
                                    className="w-full bg-transparent border-none py-3 pl-12 pr-4 text-xs text-white focus:ring-0 font-mono italic"
                                 />
                             </div>
                        </div>
                    </div>

                    {/* Nodes Grid */}
                    <div className="space-y-4">
                        {filteredTasks.length === 0 ? (
                            <div className="py-32 text-center opacity-20 bg-gray-900/40 rounded-[3.5rem] border-4 border-dashed border-white/10">
                                <Database className="w-20 h-20 mx-auto mb-6" />
                                <p className="text-xl font-black uppercase tracking-[0.5em] italic">No Active Vectors</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {filteredTasks.map(task => {
                                    const config = getPriorityConfig(task.priority);
                                    const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
                                    
                                    const unmetDependencies = (task.dependencies || []).filter(depId => {
                                        const depTask = tasks.find(t => t.id === depId);
                                        return depTask && !depTask.completed;
                                    });
                                    const hasUnmetDeps = unmetDependencies.length > 0;
                                    
                                    return (
                                        <motion.div 
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ 
                                                opacity: task.completed ? 0.5 : 1, 
                                                y: 0, 
                                                scale: task.completed ? 0.95 : 1,
                                                filter: task.completed ? 'blur(1px)' : 'blur(0px)'
                                            }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            whileHover={task.completed ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : {}}
                                            transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                                            className={`group p-6 rounded-[2.5rem] border-2 relative overflow-hidden flex flex-col md:flex-row items-center justify-between ${
                                                task.completed 
                                                ? 'bg-gray-900/20 border-white/5' 
                                                : isOverdue 
                                                ? 'bg-red-950/10 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' 
                                                : hasUnmetDeps
                                                ? 'bg-gray-900/40 border-amber-500/20'
                                                : 'bg-[#0a0a0a] border-white/5 hover:border-amber-500/30'
                                            }`}
                                        >
                                            {/* Priority Glow Line */}
                                            <div className={`absolute top-0 left-0 h-full w-1.5 ${config.color.replace('text-', 'bg-')} ${task.completed ? 'opacity-20' : 'opacity-100 shadow-[0_0_15px_current]'}`}></div>

                                            <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                                                {/* Smart Checkbox */}
                                                <button 
                                                    onClick={() => handleToggle(task.id)}
                                                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 group/btn relative overflow-hidden ${
                                                        task.completed 
                                                        ? 'bg-green-500 border-green-400 shadow-[0_0_30px_#22c55e]' 
                                                        : hasUnmetDeps
                                                        ? 'bg-gray-800 border-white/5 cursor-not-allowed'
                                                        : 'bg-gray-900 border-white/10 hover:border-amber-500/50'
                                                    }`}
                                                >
                                                    {task.completed ? (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                        >
                                                            <Check className="w-6 h-6 text-black animate-stroke" strokeWidth={4} />
                                                        </motion.div>
                                                    ) : hasUnmetDeps ? (
                                                        <Lock className="w-5 h-5 text-gray-600" />
                                                    ) : (
                                                        <div className="w-3 h-3 rounded-full bg-white/10 group-hover/btn:bg-amber-500 group-hover/btn:scale-150 transition-all"></div>
                                                    )}
                                                </button>

                                                <div>
                                                    <div className="flex items-center gap-4 mb-1">
                                                        <h3 className={`text-xl font-black italic uppercase tracking-tight transition-all ${task.completed ? 'text-gray-500 line-through decoration-2 decoration-amber-500' : 'text-white'}`}>
                                                            {task.title}
                                                        </h3>
                                                        <button 
                                                            onClick={() => cyclePriority(task.id, task.priority)}
                                                            className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${config.bg} ${config.color} ${config.border} hover:opacity-80 transition-opacity`}
                                                            title="Click to cycle priority"
                                                        >
                                                            {config.icon}
                                                            {task.priority}
                                                        </button>
                                                        
                                                        {/* Reorder Controls (Only visible when sorting by priority) */}
                                                        {sortBy === 'priority' && (
                                                            <div className="flex items-center gap-1 ml-2">
                                                                <button 
                                                                    onClick={() => moveTask(task.id, 'up')}
                                                                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                                                    title="Move Up (Increases Priority)"
                                                                >
                                                                    <ArrowUp className="w-3 h-3" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => moveTask(task.id, 'down')}
                                                                    className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                                                                    title="Move Down (Decreases Priority)"
                                                                >
                                                                    <ArrowDown className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {hasUnmetDeps && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-500 text-[8px] font-black uppercase tracking-widest">
                                                                <LinkIcon className="w-2.5 h-2.5" />
                                                                Locked
                                                            </div>
                                                        )}
                                                        {task.isRecurring && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-blue-500 text-[8px] font-black uppercase tracking-widest" title={`Recurring: ${task.recurrencePattern}`}>
                                                                <RefreshCw className="w-2.5 h-2.5" />
                                                                {task.recurrencePattern}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-gray-500">
                                                         <div className={`flex items-center gap-2 text-[10px] font-mono ${isOverdue ? 'text-red-500 font-bold animate-pulse' : ''}`}>
                                                             <Clock className="w-3.5 h-3.5" />
                                                             {isOverdue ? 'CRITICAL_EXPIRE: ' : 'DUE_DATE: '} {new Date(task.dueDate).toLocaleDateString()}
                                                         </div>
                                                         {task.description && <p className="text-[10px] uppercase tracking-widest italic opacity-70 truncate max-w-xs">{task.description}</p>}
                                                    </div>
                                                    
                                                    {/* Progress Bar */}
                                                    <div className="mt-3 w-full max-w-md">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Progress</span>
                                                            <span className="text-[8px] font-black font-mono text-amber-500">{task.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-white/5">
                                                            <div 
                                                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500 ease-out"
                                                                style={{ width: `${task.progress || 0}%` }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {hasUnmetDeps && (
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {unmetDependencies.map(depId => {
                                                                const depTask = tasks.find(t => t.id === depId);
                                                                return (
                                                                    <span key={depId} className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter bg-black/40 px-2 py-0.5 rounded border border-white/5">
                                                                        Prereq: {depTask?.title || 'Unknown'}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 relative z-10 mt-4 md:mt-0">
                                                <button 
                                                    onClick={() => { setSelectedTask(task); setIsFormOpen(true); }}
                                                    className="p-4 bg-gray-900 border border-white/10 text-cyan-400 rounded-2xl hover:bg-cyan-500 hover:text-black transition-all shadow-xl"
                                                >
                                                    <Edit3 className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => setTaskToDelete(task)}
                                                    className="p-4 bg-gray-900 border border-white/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-xl"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                {/* 2. STATS & AI INJECTOR */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Efficiency Gauge */}
                    <Card title="System Efficiency" className="bg-gray-950 border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-32 h-32 text-amber-500" /></div>
                        <div className="text-center relative z-10">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-6">Completion Velocity</p>
                            <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                    <circle cx="112" cy="112" r="90" stroke="#111" strokeWidth="16" fill="none" />
                                    <circle 
                                        cx="112" cy="112" r="90" 
                                        stroke="#f59e0b" 
                                        strokeWidth="16" 
                                        fill="none" 
                                        strokeDasharray="565" 
                                        strokeDashoffset={565 - (565 * efficiencyScore / 100)} 
                                        strokeLinecap="round"
                                        className="transition-all duration-[2000ms] shadow-[0_0_20px_#f59e0b]"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-7xl font-black text-white italic tracking-tighter">
                                        {efficiencyScore}%
                                    </span>
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-1">Efficiency</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 space-y-4">
                             <div className="flex justify-between items-center p-5 bg-black/40 rounded-3xl border border-white/5">
                                 <span className="text-[10px] font-black text-gray-500 uppercase">Active Vectors</span>
                                 <span className="text-2xl font-black text-white italic">{tasks.filter(t => !t.completed).length}</span>
                             </div>
                             <div className="flex justify-between items-center p-5 bg-black/40 rounded-3xl border border-white/5">
                                 <span className="text-[10px] font-black text-gray-500 uppercase">Smart Cleared</span>
                                 <span className="text-2xl font-black text-green-400 italic">{tasks.filter(t => t.completed).length}</span>
                             </div>
                        </div>
                    </Card>

                    {/* Smart Injector */}
                    <div className="p-8 bg-gradient-to-br from-indigo-900/20 to-black border border-indigo-500/30 rounded-[3rem] shadow-xl relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform"><BrainCircuit className="w-24 h-24 text-indigo-400" /></div>
                         <div className="relative z-10">
                             <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                 <BotIcon className="w-5 h-5 text-indigo-400"/> Smart Task Injector
                             </h4>
                             <div className="space-y-3">
                                 <textarea 
                                    value={aiInput}
                                    onChange={(e) => setAiInput(e.target.value)}
                                    placeholder='Type command: "Remind me to service treadmills next monday priority high"...'
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-white focus:border-indigo-500 outline-none resize-none h-24 font-mono shadow-inner"
                                 />
                                 <button 
                                    onClick={handleAiInject}
                                    disabled={isThinking || !aiInput}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                                 >
                                     {isThinking ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                     {isThinking ? 'PARSING...' : 'INJECT TO KERNEL'}
                                 </button>
                             </div>
                         </div>
                    </div>

                    <div className="p-8 bg-red-900/10 border border-red-500/20 rounded-[3rem] shadow-xl flex items-start gap-6">
                        <ShieldAlert className="w-10 h-10 text-red-500 shrink-0 animate-pulse" />
                        <div>
                             <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Operational Guard</p>
                             <p className="text-gray-400 text-xs italic leading-relaxed">
                                 "System Fitness Future automatically flags overdue nodes with High Priority Alerts. Keep the kernel clean."
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {isFormOpen && (
                <TaskFormModal 
                    isOpen={isFormOpen} 
                    onClose={() => setIsFormOpen(false)} 
                    onSave={handleSave} 
                    task={selectedTask}
                    allTasks={tasks}
                    onDelete={selectedTask ? () => {
                        setIsFormOpen(false);
                        setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
                        addToast("Node Wiped from Kernel.", "error");
                    } : undefined}
                />
            )}

            {taskToComplete && (
                <ConfirmationDialog 
                    isOpen={!!taskToComplete}
                    onClose={() => setTaskToComplete(null)}
                    onConfirm={confirmComplete}
                    title="Confirm Task Resolution?"
                    message={`This will mark the task "[${taskToComplete.title.toUpperCase()}]" as complete. This action is final.`}
                />
            )}

            {taskToDelete && (
                <ConfirmationDialog 
                    isOpen={!!taskToDelete}
                    onClose={() => setTaskToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Terminate Task Node?"
                    message={`This will permanently wipe [${taskToDelete.title.toUpperCase()}] from the sovereign kernel. Continue?`}
                />
            )}

            {recurringEditPrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0a0a0a] border-2 border-amber-500/30 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                        <div className="flex items-center gap-4 mb-6 text-amber-500">
                            <RefreshCw className="w-8 h-8" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Recurring Task Edit</h2>
                        </div>
                        <p className="text-gray-400 mb-8 text-sm uppercase tracking-widest leading-relaxed">
                            You are editing a recurring task. Do you want to apply these changes to all future uncompleted instances, or just this one?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => confirmRecurringEdit(true)}
                                className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-colors"
                            >
                                Update All Future Instances
                            </button>
                            <button 
                                onClick={() => confirmRecurringEdit(false)}
                                className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-gray-800 transition-colors"
                            >
                                Update Only This Instance
                            </button>
                            <button 
                                onClick={() => setRecurringEditPrompt(null)}
                                className="w-full py-4 bg-transparent text-gray-500 font-black uppercase tracking-widest rounded-xl hover:text-white transition-colors mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {recurringDeletePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0a0a0a] border-2 border-red-500/30 rounded-3xl p-6 w-full max-w-md shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        <div className="flex items-center gap-4 mb-6 text-red-500">
                            <Trash2 className="w-8 h-8" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Delete Recurring Task</h2>
                        </div>
                        <p className="text-gray-400 mb-8 text-sm uppercase tracking-widest leading-relaxed">
                            You are deleting a recurring task. Do you want to delete all future uncompleted instances as well?
                        </p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => confirmRecurringDelete(true)}
                                className="w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors"
                            >
                                Delete All Future Instances
                            </button>
                            <button 
                                onClick={() => confirmRecurringDelete(false)}
                                className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-gray-800 transition-colors"
                            >
                                Delete Only This Instance
                            </button>
                            <button 
                                onClick={() => setRecurringDeletePrompt(null)}
                                className="w-full py-4 bg-transparent text-gray-500 font-black uppercase tracking-widest rounded-xl hover:text-white transition-colors mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
