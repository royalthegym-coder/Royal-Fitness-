import React, { useState, useMemo, useEffect } from 'react';
import {
    Calendar, Clock, Users, Plus, Trash2, Edit, CheckCircle2,
    Search, Filter, MapPin, Dumbbell, Flame, Sparkles, UserCheck,
    XCircle, BookmarkCheck, ShieldCheck
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';
import { syncToFirebase, deleteFromFirebase } from '../../lib/firebase';
import Modal from './common/Modal';

export interface SharedGymClass {
    id: string;
    title: string;
    type: 'Yoga' | 'Spinning' | 'HIIT' | 'CrossFit' | 'Zumba' | 'MMA' | 'Strength';
    time: string;
    instructor: string;
    totalSeats: number;
    bookedSeats: number;
    color: string;
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    description: string;
    room?: string;
}

const DAYS_OF_WEEK: SharedGymClass['day'][] = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const INITIAL_SHARED_CLASSES: SharedGymClass[] = [];

const colorForCategory = (type: SharedGymClass['type']): string => {
    switch (type) {
        case 'HIIT': return 'red';
        case 'Yoga': return 'cyan';
        case 'CrossFit':
        case 'MMA':
        case 'Strength': return 'amber';
        case 'Zumba':
        case 'Spinning': return 'fuchsia';
        default: return 'cyan';
    }
};

export const AdminClassManager: React.FC = () => {
    const { addToast } = useToast();
    const { members, staff } = useData();

    const [classes, setClasses] = useState<SharedGymClass[]>(() => {
        try {
            const stored = localStorage.getItem('future_classes_db');
            return stored ? JSON.parse(stored) : INITIAL_SHARED_CLASSES;
        } catch {
            return INITIAL_SHARED_CLASSES;
        }
    });

    const [myBookings, setMyBookings] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem('my_gym_bookings');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Save helpers
    const saveClasses = (updated: SharedGymClass[]) => {
        setClasses(updated);
        localStorage.setItem('future_classes_db', JSON.stringify(updated));
    };

    const saveBookings = (updated: string[]) => {
        setMyBookings(updated);
        localStorage.setItem('my_gym_bookings', JSON.stringify(updated));
    };

    // Filters & Mode
    const [selectedDay, setSelectedDay] = useState<'All' | SharedGymClass['day']>('All');
    const [selectedType, setSelectedType] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [bookingMemberId, setBookingMemberId] = useState<number>(members[0]?.id || 1);

    // Create / Edit Class Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<SharedGymClass | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formType, setFormType] = useState<SharedGymClass['type']>('HIIT');
    const [formDay, setFormDay] = useState<SharedGymClass['day']>('Monday');
    const [formTime, setFormTime] = useState('06:00 AM - 07:00 AM');
    const [formInstructor, setFormInstructor] = useState('');
    const [formTotalSeats, setFormTotalSeats] = useState(20);
    const [formRoom, setFormRoom] = useState('Main Turf Zone');
    const [formDesc, setFormDesc] = useState('');

    const handleOpenCreateModal = (cls?: SharedGymClass) => {
        if (cls) {
            setEditingClass(cls);
            setFormTitle(cls.title);
            setFormType(cls.type);
            setFormDay(cls.day);
            setFormTime(cls.time);
            setFormInstructor(cls.instructor);
            setFormTotalSeats(cls.totalSeats);
            setFormRoom(cls.room || 'Main Studio');
            setFormDesc(cls.description);
        } else {
            setEditingClass(null);
            setFormTitle('');
            setFormType('HIIT');
            setFormDay('Monday');
            setFormTime('06:00 AM - 07:00 AM');
            setFormInstructor(staff[0]?.name || '');
            setFormTotalSeats(20);
            setFormRoom('Main Turf Zone');
            setFormDesc('Structured coach-led group session with progressive intervals.');
        }
        setIsModalOpen(true);
    };

    const handleSaveClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim()) {
            addToast('Please enter a class title.', 'error');
            return;
        }

        if (editingClass) {
            const updatedItem: SharedGymClass = {
                ...editingClass,
                title: formTitle.trim(),
                type: formType,
                day: formDay,
                time: formTime.trim(),
                instructor: formInstructor.trim(),
                totalSeats: Math.max(1, Number(formTotalSeats)),
                color: colorForCategory(formType),
                room: formRoom.trim(),
                description: formDesc.trim()
            };
            const updatedList = classes.map(c => (c.id === editingClass.id ? updatedItem : c));
            saveClasses(updatedList);
            syncToFirebase('classes', updatedItem.id, updatedItem).catch(() => {});
            addToast(`Updated class "${updatedItem.title}"!`, 'success');
        } else {
            const newItem: SharedGymClass = {
                id: `cls-${Date.now()}`,
                title: formTitle.trim(),
                type: formType,
                day: formDay,
                time: formTime.trim(),
                instructor: formInstructor.trim(),
                totalSeats: Math.max(1, Number(formTotalSeats)),
                bookedSeats: 0,
                color: colorForCategory(formType),
                room: formRoom.trim(),
                description: formDesc.trim() || `${formType} session led by ${formInstructor.trim()}.`
            };
            const updatedList = [newItem, ...classes];
            saveClasses(updatedList);
            syncToFirebase('classes', newItem.id, newItem).catch(() => {});
            addToast(`Scheduled new class "${newItem.title}" (${newItem.day} • ${newItem.time})!`, 'success');
        }
        setIsModalOpen(false);
    };

    const handleDeleteClass = (id: string, title: string) => {
        saveClasses(classes.filter(c => c.id !== id));
        deleteFromFirebase('classes', id).catch(() => {});
        addToast(`Removed class "${title}" from schedule.`, 'info');
    };

    const handleToggleSpotBooking = (cls: SharedGymClass) => {
        const isBooked = myBookings.includes(cls.id);
        const selectedMember = members.find(m => m.id === Number(bookingMemberId));
        const memberLabel = selectedMember ? selectedMember.name : 'Member';

        if (isBooked) {
            saveBookings(myBookings.filter(id => id !== cls.id));
            const updated = classes.map(c =>
                c.id === cls.id ? { ...c, bookedSeats: Math.max(0, c.bookedSeats - 1) } : c
            );
            saveClasses(updated);
            addToast(`Cancelled spot reservation for ${cls.title}.`, 'info');
        } else {
            if (cls.bookedSeats >= cls.totalSeats) {
                addToast('Class has reached maximum seat capacity!', 'error');
                return;
            }
            saveBookings([...myBookings, cls.id]);
            const updated = classes.map(c =>
                c.id === cls.id ? { ...c, bookedSeats: c.bookedSeats + 1 } : c
            );
            saveClasses(updated);
            addToast(`Spot booked for ${memberLabel} in "${cls.title}" (${cls.day}, ${cls.time})!`, 'success');
        }
    };

    const filteredClasses = useMemo(() => {
        return classes.filter(cls => {
            const matchesDay = selectedDay === 'All' || cls.day === selectedDay;
            const matchesType = selectedType === 'All' || cls.type === selectedType;
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !q ||
                cls.title.toLowerCase().includes(q) ||
                cls.instructor.toLowerCase().includes(q) ||
                cls.type.toLowerCase().includes(q);
            return matchesDay && matchesType && matchesSearch;
        });
    }, [classes, selectedDay, selectedType, searchQuery]);

    const stats = useMemo(() => {
        const totalClasses = classes.length;
        const totalCapacity = classes.reduce((s, c) => s + c.totalSeats, 0);
        const totalBooked = classes.reduce((s, c) => s + c.bookedSeats, 0);
        const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;
        return { totalClasses, totalCapacity, totalBooked, occupancyRate };
    }, [classes]);

    return (
        <div className="space-y-8 pb-20 animate-fade-in">
            {/* Hero Header */}
            <div className="bg-gradient-to-r from-gray-900 via-[#0a0a0a] to-black border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-3">
                            <Calendar className="w-3.5 h-3.5" /> Class Scheduler & Member Spot Booking
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                            Class <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Scheduler & Booking</span>
                        </h1>
                        <p className="text-xs md:text-sm text-gray-400 max-w-2xl mt-2">
                            Trainers can create classes, set schedules, and configure seat capacities. Members can browse available classes and book their spot in real time.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full xl:w-auto">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                            <p className="text-[9px] text-gray-400 uppercase font-bold">Scheduled Classes</p>
                            <p className="text-2xl font-black text-white mt-1">{stats.totalClasses}</p>
                        </div>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl">
                            <p className="text-[9px] text-cyan-400 uppercase font-bold">Booked Spots</p>
                            <p className="text-2xl font-black text-white mt-1">{stats.totalBooked} / {stats.totalCapacity}</p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl">
                            <p className="text-[9px] text-emerald-400 uppercase font-bold">Occupancy Rate</p>
                            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.occupancyRate}%</p>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                            <p className="text-[9px] text-amber-400 uppercase font-bold">My Reservations</p>
                            <p className="text-2xl font-black text-amber-400 mt-1">{myBookings.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter & Trainer Action Bar */}
            <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search classes or trainers..."
                            className="w-full bg-black border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none focus:border-cyan-500"
                        />
                    </div>

                    <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        className="bg-black border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold outline-none focus:border-cyan-500"
                    >
                        <option value="All">All Categories</option>
                        <option value="HIIT">HIIT</option>
                        <option value="Yoga">Yoga</option>
                        <option value="Strength">Strength</option>
                        <option value="CrossFit">CrossFit</option>
                        <option value="Spinning">Spinning</option>
                        <option value="Zumba">Zumba</option>
                        <option value="MMA">MMA</option>
                    </select>

                    <div className="flex items-center gap-2 bg-black border border-white/10 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase">Booking For:</span>
                        <select
                            value={bookingMemberId}
                            onChange={e => setBookingMemberId(Number(e.target.value))}
                            className="bg-transparent text-xs text-white font-bold outline-none"
                        >
                            {members.map(m => (
                                <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={() => handleOpenCreateModal()}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Trainer: Create & Schedule Class
                </button>
            </div>

            {/* Day of Week Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['All', ...DAYS_OF_WEEK] as const).map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                            selectedDay === day
                                ? 'bg-cyan-500 text-black shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                        }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Class Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map(cls => {
                    const isBooked = myBookings.includes(cls.id);
                    const seatsLeft = Math.max(0, cls.totalSeats - cls.bookedSeats);
                    const isFull = seatsLeft === 0;
                    const fillPercent = Math.min(100, Math.round((cls.bookedSeats / cls.totalSeats) * 100));

                    return (
                        <div
                            key={cls.id}
                            className={`bg-[#0a0a0a] border rounded-3xl p-6 flex flex-col justify-between space-y-5 transition-all shadow-xl ${
                                isBooked ? 'border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.12)]' : 'border-white/10 hover:border-cyan-500/40'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-[10px] font-black uppercase">
                                            {cls.type}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10 text-[10px] font-bold uppercase">
                                            {cls.day}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleOpenCreateModal(cls)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                            title="Edit Class"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClass(cls.id, cls.title)}
                                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                                            title="Delete Class"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{cls.title}</h3>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{cls.description}</p>

                                <div className="mt-4 space-y-2 text-xs text-gray-300 bg-black/50 p-3.5 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-gray-400">
                                            <Clock className="w-3.5 h-3.5 text-amber-400" /> Schedule
                                        </span>
                                        <span className="font-mono font-bold text-white">{cls.time}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-gray-400">
                                            <Users className="w-3.5 h-3.5 text-cyan-400" /> Trainer
                                        </span>
                                        <span className="font-bold text-white">{cls.instructor}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-1.5 text-gray-400">
                                            <MapPin className="w-3.5 h-3.5 text-purple-400" /> Studio
                                        </span>
                                        <span className="text-gray-300">{cls.room || 'Main Studio'}</span>
                                    </div>
                                </div>

                                {/* Seat Capacity Bar */}
                                <div className="mt-4">
                                    <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                                        <span className={isFull ? 'text-rose-400' : 'text-emerald-400'}>
                                            {isFull ? 'Class Full (0 Spots Left)' : `${seatsLeft} Spots Available`}
                                        </span>
                                        <span className="font-mono text-gray-400">
                                            {cls.bookedSeats} / {cls.totalSeats} Booked ({fillPercent}%)
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                fillPercent >= 100
                                                    ? 'bg-rose-500'
                                                    : fillPercent >= 75
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                            }`}
                                            style={{ width: `${fillPercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Member Spot Booking Action */}
                            <button
                                onClick={() => handleToggleSpotBooking(cls)}
                                disabled={!isBooked && isFull}
                                className={`w-full py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                    isBooked
                                        ? 'bg-emerald-500/20 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-400 border border-emerald-500/40'
                                        : isFull
                                        ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg'
                                }`}
                            >
                                {isBooked ? (
                                    <>
                                        <BookmarkCheck className="w-4 h-4" /> Spot Confirmed (Click to Cancel)
                                    </>
                                ) : isFull ? (
                                    'Class Full'
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" /> Book My Spot Now
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Create / Edit Class Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingClass ? 'Edit Scheduled Class' : 'Schedule New Gym Class'}
            >
                <form onSubmit={handleSaveClass} className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Class Title *</label>
                        <input
                            type="text"
                            required
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            placeholder="e.g. Morning HIIT Metabolic Burn"
                            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                            <select
                                value={formType}
                                onChange={e => setFormType(e.target.value as SharedGymClass['type'])}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-cyan-500"
                            >
                                <option value="HIIT">HIIT</option>
                                <option value="Yoga">Yoga</option>
                                <option value="Strength">Strength</option>
                                <option value="CrossFit">CrossFit</option>
                                <option value="Spinning">Spinning</option>
                                <option value="Zumba">Zumba</option>
                                <option value="MMA">MMA</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Day of Week</label>
                            <select
                                value={formDay}
                                onChange={e => setFormDay(e.target.value as SharedGymClass['day'])}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-cyan-500"
                            >
                                {DAYS_OF_WEEK.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Time & Duration</label>
                            <input
                                type="text"
                                required
                                value={formTime}
                                onChange={e => setFormTime(e.target.value)}
                                placeholder="06:00 AM - 07:00 AM"
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-mono outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Max Capacity (Seats)</label>
                            <input
                                type="number"
                                min={1}
                                max={200}
                                required
                                value={formTotalSeats}
                                onChange={e => setFormTotalSeats(Number(e.target.value))}
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-amber-400 font-mono text-sm font-bold outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Trainer / Instructor</label>
                            <input
                                type="text"
                                required
                                value={formInstructor}
                                onChange={e => setFormInstructor(e.target.value)}
                                placeholder="Enter trainer name"
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Room / Studio</label>
                            <input
                                type="text"
                                value={formRoom}
                                onChange={e => setFormRoom(e.target.value)}
                                placeholder="e.g. Main Turf Zone"
                                className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Class Description</label>
                        <textarea
                            value={formDesc}
                            onChange={e => setFormDesc(e.target.value)}
                            className="w-full p-3 bg-black border border-white/10 rounded-xl text-white text-xs outline-none focus:border-cyan-500 h-20 resize-none"
                            placeholder="What members should expect in this class..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black uppercase tracking-widest text-xs shadow-lg transition-all cursor-pointer"
                    >
                        {editingClass ? 'Save Class Changes' : 'Publish Class to Schedule'}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminClassManager;
