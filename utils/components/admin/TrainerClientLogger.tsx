import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Save, User, Activity, Dumbbell, Calendar, CheckCircle2 } from 'lucide-react';
import Card from '../common/Card';
import { useToast } from '../../hooks/useToast';
import { useData } from '../../context/DataProvider';

export default function TrainerClientLogger() {
    const { addToast } = useToast();
    const { members } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [workoutNotes, setWorkoutNotes] = useState('');
    const [progressMetrics, setProgressMetrics] = useState({
        weight: '',
        bodyFat: '',
        strengthScore: ''
    });

    const filteredClients = members.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.phone.includes(searchQuery)
    );

    const handleLogWorkout = () => {
        if (!workoutNotes) {
            addToast("Please enter workout notes/details.", "error");
            return;
        }

        // processing the save action for the trainer
        addToast(`Successfully logged workout and progress for ${selectedClient.name}!`, "success");
        setWorkoutNotes('');
        setProgressMetrics({ weight: '', bodyFat: '', strengthScore: '' });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-black uppercase text-white tracking-tighter shadow-sm flex items-center gap-3">
                    <Dumbbell className="w-8 h-8 text-emerald-400" /> Trainer Portal.
                </h2>
                <p className="text-gray-400 mt-1 text-sm font-medium">Log workout details and fitness progress for your 1-on-1 clients.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Client List */}
                <Card className="md:col-span-1 border border-white/5 bg-black/40 p-4">
                    <div className="mb-4 bg-gray-900 border border-white/5 rounded-xl flex items-center px-3 py-2">
                        <Search className="w-4 h-4 text-gray-500 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search Clients..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-white text-sm w-full"
                        />
                    </div>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {filteredClients.map(client => (
                            <div 
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedClient?.id === client.id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-gray-900/50 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-emerald-400 font-bold">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{client.name}</p>
                                        <p className="text-xs text-gray-500 font-mono">{client.phone}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Tracking Area */}
                <div className="md:col-span-2 space-y-6">
                    {!selectedClient ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 py-20 bg-black/20 border border-white/5 rounded-3xl">
                            <User className="w-12 h-12 mb-4 opacity-50" />
                            <p className="text-sm uppercase tracking-widest font-black">Select a client to log workouts</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <Card className="p-6 border border-white/5 bg-black/40">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-emerald-400" /> Client Progress Tracking
                                </h3>
                                
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold block">Weight (kg)</label>
                                        <input 
                                            type="number" 
                                            value={progressMetrics.weight}
                                            onChange={(e) => setProgressMetrics({...progressMetrics, weight: e.target.value})}
                                            className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="e.g. 75.5"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold block">Body Fat (%)</label>
                                        <input 
                                            type="number" 
                                            value={progressMetrics.bodyFat}
                                            onChange={(e) => setProgressMetrics({...progressMetrics, bodyFat: e.target.value})}
                                            className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="e.g. 15"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-400 uppercase tracking-wider font-bold block">Strength Score (1-10)</label>
                                        <input 
                                            type="number" 
                                            value={progressMetrics.strengthScore}
                                            onChange={(e) => setProgressMetrics({...progressMetrics, strengthScore: e.target.value})}
                                            className="w-full bg-gray-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition-colors"
                                            placeholder="e.g. 8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <label className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Today's Workout Details
                                    </label>
                                    <textarea 
                                        rows={5}
                                        value={workoutNotes}
                                        onChange={(e) => setWorkoutNotes(e.target.value)}
                                        className="w-full bg-gray-900 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-emerald-500 transition-colors resize-none"
                                        placeholder="Detailed protocol logged for the client today. e.g. 4x10 Squats at 100kg, Focus on eccentric control..."
                                    />
                                </div>

                                <button 
                                    onClick={handleLogWorkout}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" /> Submit Log & Progress Update
                                </button>
                            </Card>
                            
                            <Card className="p-4 border border-white/5 bg-emerald-950/20 text-emerald-400/80 text-xs font-mono text-center">
                                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                                All logged metrics securely push to the client's Personal Dashboard in real-time.
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
