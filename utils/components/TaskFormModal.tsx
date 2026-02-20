
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Task } from '../../types';
import { Target, Clock, AlertTriangle, Save, X, Trash2 } from 'lucide-react';
import ConfirmationDialog from './common/ConfirmationDialog';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'completed'> & { id?: number }) => void;
    onDelete?: () => void;
    task: Task | null;
}

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, onDelete, task }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [dueDate, setDueDate] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setDueDate(task.dueDate);
        } else {
            setTitle('');
            setDescription('');
            setPriority('Medium');
            setDueDate(getLocalToday());
        }
    }, [task, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !dueDate) return;
        onSave({ id: task?.id, title, description, priority, dueDate });
    };

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
