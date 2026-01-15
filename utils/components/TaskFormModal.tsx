
import React, { useState, useEffect } from 'react';
import Modal from './common/Modal';
import { Task } from '../../types';

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id' | 'completed'> & { id?: number }) => void;
    task: Task | null;
}

const getLocalToday = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
};

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSave, task }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [dueDate, setDueDate] = useState('');

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
        if (!title.trim() || !dueDate) {
            alert('Title and Due Date are required.');
            return;
        }
        onSave({ id: task?.id, title, description, priority, dueDate });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? 'Edit Task' : 'Add New Task'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Title</label>
                    <input
                        type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300">Description (Optional)</label>
                    <textarea
                        rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Priority</label>
                        <select
                            value={priority} onChange={(e) => setPriority(e.target.value as any)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                        >
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Due Date</label>
                        <input
                            type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md p-2"
                            required
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 mr-2">Cancel</button>
                    <button type="submit" className="bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400">Save Task</button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskFormModal;
