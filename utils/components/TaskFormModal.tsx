
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Task } from '../../types';
import { Target, Clock, AlertTriangle, Save, X, Trash2, Link as LinkIcon, Check } from 'lucide-react';
import ConfirmationDialog from './common/ConfirmationDialog';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'completed'> & { id?: number, dependencies?: number[] }) => void;
    onDelete?: () => void;
    task: Task | null;
    allTasks: Task[];
}

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, onDelete, task, allTasks }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [dueDate, setDueDate] = useState('');
    const [dependencies, setDependencies] = useState<number[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setDueDate(task.dueDate);
            setDependencies(task.dependencies || []);
        } else {
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setDueDate(getLocalToday());
            setDependencies([]);
        }
    }, [task, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !dueDate) return;
        onSave({ id: task?.id, title, description, priority, dueDate, dependencies });
    };

    const toggleDependency = (id: number) => {
        setDependencies(prev => 
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    const availableTasks = allTasks.filter(t => t.id !== task?.id);

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        if (onDelete) onDelete();
        setShowDeleteConfirm(false);
    };

    const inputClass = "w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-amber-500 transition-all appearance-none shadow-inner placeholder-gray-700";
    const labelClass = "text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-2 block";

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Calibrate Task Node' : 'Initialize Task Node'}>
                <form onSubmit={handleSubmit} className="space-y-8 py-4">
                    <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Target className="w-32 h-32 text-amber-500"/></div>
                        
                        <div className="relative z-10 space-y-6">
                            <div>
                                <label className={labelClass}>Node Identifier (Title)</label>
                                <input
                                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                    className={`${inputClass} text-lg`}
                                    placeholder="TASK_IDENTITY_V1"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Task Parameters (Optional)</label>
                                <textarea
                                    rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                                    className={`${inputClass} resize-none text-sm font-medium`}
                                    placeholder="DESCRIBE_OBJECTIVE..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-white/5">
                            <label className={labelClass}>Priority Level</label>
                            <div className="relative">
                                <select
                                    value={priority} onChange={(e) => setPriority(e.target.value as any)}
                                    className={inputClass}
                                >
                                    <option value="Low">Low (Nominal)</option>
                                    <option value="Medium">Medium (Active)</option>
                                    <option value="High">High (Critical)</option>
                                </select>
                                <AlertTriangle className={`absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none ${priority === 'High' ? 'text-red-500 animate-pulse' : priority === 'Medium' ? 'text-amber-500' : 'text-cyan-500'}`} />
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-white/5">
                            <label className={labelClass}>Temporal Due Date</label>
                            <div className="relative">
                                <input
                                    type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                    className={inputClass}
                                    required
                                />
                                <Clock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 p-6 rounded-[2rem] border border-white/5">
                        <label className={labelClass}>Task Dependencies (Prerequisites)</label>
                        <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {availableTasks.length === 0 ? (
                                <p className="text-[10px] text-gray-600 italic uppercase p-4 text-center border border-dashed border-white/5 rounded-xl">No other tasks available</p>
                            ) : (
                                availableTasks.map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => toggleDependency(t.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            dependencies.includes(t.id)
                                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-500'
                                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <LinkIcon className={`w-3.5 h-3.5 ${dependencies.includes(t.id) ? 'text-amber-500' : 'text-gray-600'}`} />
                                            <span className="text-[10px] font-bold uppercase truncate max-w-[180px]">{t.title}</span>
                                        </div>
                                        {dependencies.includes(t.id) && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-white/10">
                        <button type="button" onClick={onClose} className="flex-1 py-5 text-xs font-black uppercase text-gray-500 hover:text-white transition-colors italic bg-white/5 rounded-2xl hover:bg-white/10">[ Abort ]</button>
                        
                        {task && onDelete && (
                            <button 
                                type="button" 
                                onClick={handleDeleteClick}
                                className="bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-500/30 font-black py-5 px-6 rounded-2xl transition-all shadow-lg active:scale-95"
                                title="Delete Node"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}

                        <button type="submit" className="flex-[2] bg-amber-500 text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-3">
                            <Save className="w-5 h-5" /> Execute Node Save
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmationDialog 
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleConfirmDelete}
                title="Confirm Deletion"
                message="Are you sure you want to delete this task? This action cannot be undone."
            />
        </>
    );
};

export default TaskFormModal;
