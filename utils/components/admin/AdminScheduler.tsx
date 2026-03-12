import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, Users, Plus, Edit2, Trash2, MapPin, UserCheck } from 'lucide-react';

interface ScheduleEvent {
    id: string;
    title: string;
    type: 'Class' | 'PT' | 'Maintenance' | 'Event';
    startTime: string;
    endTime: string;
    trainer: string;
    location: string;
    capacity: number;
    enrolled: number;
}

const MOCK_EVENTS: ScheduleEvent[] = [
    { id: '1', title: 'Morning HIIT', type: 'Class', startTime: '06:00', endTime: '07:00', trainer: 'John Doe', location: 'Main Studio', capacity: 20, enrolled: 15 },
    { id: '2', title: 'Yoga Flow', type: 'Class', startTime: '08:00', endTime: '09:00', trainer: 'Jane Smith', location: 'Zen Room', capacity: 15, enrolled: 12 },
    { id: '3', title: 'PT: Mike Johnson', type: 'PT', startTime: '10:00', endTime: '11:00', trainer: 'John Doe', location: 'Weight Floor', capacity: 1, enrolled: 1 },
    { id: '4', title: 'Equipment Maintenance', type: 'Maintenance', startTime: '13:00', endTime: '15:00', trainer: 'Tech Team', location: 'Cardio Zone', capacity: 0, enrolled: 0 },
    { id: '5', title: 'Zumba Party', type: 'Class', startTime: '18:00', endTime: '19:00', trainer: 'Alice Johnson', location: 'Main Studio', capacity: 30, enrolled: 25 },
];

const AdminScheduler: React.FC = () => {
    const [events, setEvents] = useState<ScheduleEvent[]>(MOCK_EVENTS);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [filter, setFilter] = useState<'All' | 'Class' | 'PT' | 'Maintenance'>('All');

    const filteredEvents = events.filter(e => filter === 'All' || e.type === filter).sort((a, b) => a.startTime.localeCompare(b.startTime));

    const getTypeColor = (type: string) => {
        switch(type) {
            case 'Class': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
            case 'PT': return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30';
            case 'Maintenance': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Master Schedule</h1>
                    <p className="text-gray-400 text-sm font-mono mt-1">Manage classes and facility events</p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-cyan-500 outline-none"
                    />
                    <button className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Event
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {['All', 'Class', 'PT', 'Maintenance'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                            filter === f 
                            ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                            : 'bg-zinc-900 text-gray-400 border border-white/5 hover:border-white/20'
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Schedule Grid */}
            <div className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="space-y-4">
                    {filteredEvents.length > 0 ? filteredEvents.map((event, idx) => (
                        <motion.div 
                            key={event.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-white/20 transition-all group"
                        >
                            {/* Time Block */}
                            <div className="flex flex-col items-center justify-center min-w-[100px] p-4 bg-zinc-900 rounded-2xl border border-white/5">
                                <span className="text-lg font-black text-white">{event.startTime}</span>
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{event.endTime}</span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-white">{event.title}</h3>
                                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${getTypeColor(event.type)}`}>
                                        {event.type}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" /> {event.trainer}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.location}</span>
                                    {event.type !== 'Maintenance' && (
                                        <span className="flex items-center gap-1 text-cyan-400"><Users className="w-3 h-3" /> {event.enrolled} / {event.capacity} Booked</span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-3 bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white rounded-xl transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button className="p-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-xl transition-colors border border-red-500/20">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
                            <Calendar className="w-16 h-16 text-gray-600 mb-4" />
                            <p className="text-lg font-bold text-gray-400">No events scheduled</p>
                            <p className="text-xs text-gray-500 mt-2">Try changing the date or filter</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminScheduler;
