import React, { useState, useMemo } from 'react';
import { 
    Calendar, Clock, MapPin, Users, CheckCircle2, XCircle, 
    Search, Star, Sparkles, AlertCircle, BookmarkCheck, Flame, 
    Filter, Heart, Zap, RefreshCw, Check, ArrowRight
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { InteractiveClass, ClassBookingRecord } from '../../../types';

const INITIAL_CLASSES_SCHEDULE: InteractiveClass[] = [
    // Monday
    {
        id: 'cls-1',
        title: 'Power Vinyasa Yoga Flow',
        type: 'Yoga',
        day: 'Monday',
        time: '06:00 AM - 07:00 AM',
        durationMinutes: 60,
        instructorName: 'Priya Joshi',
        instructorAvatar: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&auto=format&fit=crop&q=80',
        location: 'Studio 1 (Zen Yoga Deck)',
        totalCapacity: 25,
        bookedSpots: 18,
        intensity: 'Medium',
        description: 'Dynamic yoga flow combining deep breathwork and flexibility to strengthen the core and spinal alignment.'
    },
    {
        id: 'cls-2',
        title: 'HIIT Tabata Cardio Burnout',
        type: 'HIIT',
        day: 'Monday',
        time: '08:00 AM - 09:00 AM',
        durationMinutes: 60,
        instructorName: 'Coach Rahul Sharma',
        instructorAvatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80',
        location: 'Main Studio (HIIT Arena)',
        totalCapacity: 20,
        bookedSpots: 14,
        intensity: 'Extreme',
        description: 'Tabata intervals of 20 seconds maximum effort and 10 seconds rest. Maximizes calorie burn and post-workout metabolic rate.'
    },
    {
        id: 'cls-3',
        title: 'Zumba Fiesta Latino Beat',
        type: 'Zumba',
        day: 'Monday',
        time: '06:30 PM - 07:30 PM',
        durationMinutes: 60,
        instructorName: 'Neha Gupta',
        instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        location: 'Studio 2 (Dance Floor)',
        totalCapacity: 30,
        bookedSpots: 22,
        intensity: 'Medium',
        description: 'Fun-filled cardio dance workout set to energetic Latin beats. Full-body toning and stress relief.'
    },

    // Tuesday
    {
        id: 'cls-4',
        title: 'Ashtanga Morning Yoga Alignment',
        type: 'Yoga',
        day: 'Tuesday',
        time: '06:30 AM - 07:30 AM',
        durationMinutes: 60,
        instructorName: 'Priya Joshi',
        instructorAvatar: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&auto=format&fit=crop&q=80',
        location: 'Studio 1 (Zen Yoga Deck)',
        totalCapacity: 25,
        bookedSpots: 10,
        intensity: 'Low',
        description: 'Traditional Ashtanga yoga postures, Sun Salutations, and deep stretching to release muscular stiffness.'
    },
    {
        id: 'cls-5',
        title: 'Zumba Dance Cardio Party',
        type: 'Zumba',
        day: 'Tuesday',
        time: '06:00 PM - 07:00 PM',
        durationMinutes: 60,
        instructorName: 'Neha Gupta',
        instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        location: 'Studio 2 (Dance Floor)',
        totalCapacity: 30,
        bookedSpots: 25,
        intensity: 'Medium',
        description: 'High-energy choreography and fitness dance fusion designed to burn 600+ calories in a single session.'
    },
    {
        id: 'cls-6',
        title: 'CrossFit Beast Mode Circuit',
        type: 'CrossFit',
        day: 'Tuesday',
        time: '07:30 PM - 08:30 PM',
        durationMinutes: 60,
        instructorName: 'Karan Meena',
        instructorAvatar: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=150&auto=format&fit=crop&q=80',
        location: 'Main Floor (CrossFit Arena)',
        totalCapacity: 16,
        bookedSpots: 14,
        intensity: 'Extreme',
        description: 'Full-body functional strength and stamina circuit featuring kettlebell swings, tire flips, barbell thrusters, and rope climbs.'
    },

    // Wednesday
    {
        id: 'cls-7',
        title: 'HIIT Abs & Core Incinerator',
        type: 'HIIT',
        day: 'Wednesday',
        time: '07:00 AM - 08:00 AM',
        durationMinutes: 60,
        instructorName: 'Coach Rahul Sharma',
        instructorAvatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80',
        location: 'Main Studio (HIIT Arena)',
        totalCapacity: 20,
        bookedSpots: 19,
        intensity: 'High',
        description: 'Sculpt and fortify your core with plank variations, hanging leg raises, mountain climbers, and oblique twists.'
    },
    {
        id: 'cls-8',
        title: 'Pulse RPM Spinning Cycle',
        type: 'Spinning',
        day: 'Wednesday',
        time: '06:00 PM - 07:00 PM',
        durationMinutes: 60,
        instructorName: 'Coach Vikram Singh',
        instructorAvatar: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=150&auto=format&fit=crop&q=80',
        location: 'Cardio Deck (Spinning Theater)',
        totalCapacity: 22,
        bookedSpots: 16,
        intensity: 'High',
        description: 'Rhythm-based indoor cycling sprints and simulated hill climbs on high-resistance magnetic spin bikes.'
    },

    // Thursday
    {
        id: 'cls-9',
        title: 'Hatha Yoga & Stress Relief',
        type: 'Yoga',
        day: 'Thursday',
        time: '06:30 AM - 07:30 AM',
        durationMinutes: 60,
        instructorName: 'Priya Joshi',
        instructorAvatar: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&auto=format&fit=crop&q=80',
        location: 'Studio 1 (Zen Yoga Deck)',
        totalCapacity: 25,
        bookedSpots: 12,
        intensity: 'Low',
        description: 'Restorative session combining pranayama breathwork, mindfulness, and nervous-system calming postures.'
    },
    {
        id: 'cls-10',
        title: 'Zumba High-Glute Burn',
        type: 'Zumba',
        day: 'Thursday',
        time: '06:30 PM - 07:30 PM',
        durationMinutes: 60,
        instructorName: 'Neha Gupta',
        instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        location: 'Studio 2 (Dance Floor)',
        totalCapacity: 30,
        bookedSpots: 20,
        intensity: 'Medium',
        description: 'Upbeat aerobic session targeting quads, hamstrings, and glutes with squat-driven dance routines.'
    },

    // Friday
    {
        id: 'cls-11',
        title: 'HIIT Metabolic Hellfire',
        type: 'HIIT',
        day: 'Friday',
        time: '06:00 AM - 07:00 AM',
        durationMinutes: 60,
        instructorName: 'Coach Rahul Sharma',
        instructorAvatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&auto=format&fit=crop&q=80',
        location: 'Main Studio (HIIT Arena)',
        totalCapacity: 20,
        bookedSpots: 15,
        intensity: 'Extreme',
        description: 'Friday special full-body metabolic conditioning: burpees, shuttle sprints, plyo jump squats, and battle ropes.'
    },
    {
        id: 'cls-12',
        title: 'Yin Restorative Yoga & Sound Bath',
        type: 'Yoga',
        day: 'Friday',
        time: '07:00 PM - 08:00 PM',
        durationMinutes: 60,
        instructorName: 'Priya Joshi',
        instructorAvatar: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=150&auto=format&fit=crop&q=80',
        location: 'Studio 1 (Zen Yoga Deck)',
        totalCapacity: 25,
        bookedSpots: 17,
        intensity: 'Low',
        description: 'Release weekly training fatigue with deep 5-minute fascia holds and a calming Tibetan singing bowl sound bath.'
    },

    // Saturday
    {
        id: 'cls-13',
        title: 'Weekend Mega Zumba Carnival',
        type: 'Zumba',
        day: 'Saturday',
        time: '09:00 AM - 10:30 AM',
        durationMinutes: 90,
        instructorName: 'Neha Gupta',
        instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        location: 'Main Floor (Grand Studio)',
        totalCapacity: 40,
        bookedSpots: 35,
        intensity: 'High',
        description: '90-minute non-stop weekend dance fitness carnival featuring studio lighting, live mixes, and group cardio.'
    },
    {
        id: 'cls-14',
        title: 'Weekend Warrior CrossFit Open',
        type: 'CrossFit',
        day: 'Saturday',
        time: '05:00 PM - 06:30 PM',
        durationMinutes: 90,
        instructorName: 'Karan Meena',
        instructorAvatar: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=150&auto=format&fit=crop&q=80',
        location: 'Main Floor (CrossFit Arena)',
        totalCapacity: 20,
        bookedSpots: 18,
        intensity: 'Extreme',
        description: 'Team WOD battles and 1-RM strength challenges built to push your athletic performance limits.'
    }
];

export const InteractiveClassScheduler: React.FC<{ memberId?: number }> = ({ memberId = 1 }) => {
    const { addToast } = useToast();

    // Classes schedule state (saved in localStorage for live edits)
    const [classesList, setClassesList] = useState<InteractiveClass[]>(() => {
        const saved = localStorage.getItem('interactive_classes_schedule');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return INITIAL_CLASSES_SCHEDULE;
    });

    // Member's booked classes (saved in localStorage)
    const [bookedClasses, setBookedClasses] = useState<ClassBookingRecord[]>(() => {
        const saved = localStorage.getItem(`member_class_bookings_${memberId}`);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return [
            {
                id: 'bk-init-1',
                classId: 'cls-1',
                memberId,
                memberName: 'Member',
                bookedAt: new Date().toISOString(),
                classTitle: 'Power Vinyasa Yoga Flow',
                classType: 'Yoga',
                day: 'Monday',
                time: '06:00 AM - 07:00 AM',
                location: 'Studio 1 (Zen Yoga Deck)',
                instructorName: 'Priya Joshi'
            }
        ];
    });

    const saveClassesList = (updated: InteractiveClass[]) => {
        setClassesList(updated);
        localStorage.setItem('interactive_classes_schedule', JSON.stringify(updated));
    };

    const saveBookedClasses = (updated: ClassBookingRecord[]) => {
        setBookedClasses(updated);
        localStorage.setItem(`member_class_bookings_${memberId}`, JSON.stringify(updated));
    };

    // Filters
    const [selectedDay, setSelectedDay] = useState<string>('All');
    const [selectedType, setSelectedType] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'schedule' | 'my_bookings'>('schedule');

    const daysList = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const classTypesList = ['All', 'Yoga', 'Zumba', 'HIIT', 'CrossFit', 'Spinning'];

    // Filtered classes
    const filteredClasses = useMemo(() => {
        return classesList.filter(cls => {
            const matchesDay = selectedDay === 'All' || cls.day === selectedDay;
            const matchesType = selectedType === 'All' || cls.type.toLowerCase() === selectedType.toLowerCase();
            const matchesSearch = cls.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cls.instructorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cls.location.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDay && matchesType && matchesSearch;
        });
    }, [classesList, selectedDay, selectedType, searchQuery]);

    // 1-Click Booking Handler
    const handleOneClickBook = (cls: InteractiveClass) => {
        const alreadyBooked = bookedClasses.some(b => b.classId === cls.id);
        if (alreadyBooked) {
            addToast(`You are already enrolled in '${cls.title}'!`, 'info');
            return;
        }

        const remainingSpots = cls.totalCapacity - cls.bookedSpots;
        if (remainingSpots <= 0) {
            addToast(`Sorry, all spots for '${cls.title}' are currently full!`, 'error');
            return;
        }

        // Increment booked spots in class
        const updatedClasses = classesList.map(c => 
            c.id === cls.id ? { ...c, bookedSpots: c.bookedSpots + 1 } : c
        );
        saveClassesList(updatedClasses);

        // Add to member bookings
        const newRecord: ClassBookingRecord = {
            id: `bk-${Date.now()}`,
            classId: cls.id,
            memberId,
            memberName: 'Member',
            bookedAt: new Date().toISOString(),
            classTitle: cls.title,
            classType: cls.type,
            day: cls.day,
            time: cls.time,
            location: cls.location,
            instructorName: cls.instructorName
        };

        const updatedBookings = [newRecord, ...bookedClasses];
        saveBookedClasses(updatedBookings);

        addToast(`🎉 1-Click Booking Confirmed! Your spot in '${cls.title}' (${cls.day} ${cls.time}) is reserved.`, 'success');
    };

    // 1-Click Cancellation Handler
    const handleOneClickCancel = (classId: string) => {
        const targetBooking = bookedClasses.find(b => b.classId === classId);
        if (!targetBooking) return;

        // Restore booked spots in class
        const updatedClasses = classesList.map(c => 
            c.id === classId ? { ...c, bookedSpots: Math.max(0, c.bookedSpots - 1) } : c
        );
        saveClassesList(updatedClasses);

        // Remove from member bookings
        const updatedBookings = bookedClasses.filter(b => b.classId !== classId);
        saveBookedClasses(updatedBookings);

        addToast(`✓ Reservation for '${targetBooking.classTitle}' cancelled. Your spot has been released for other members.`, 'info');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-gray-950 via-pink-950/40 to-black p-8 rounded-[2.5rem] border border-pink-500/30 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Calendar className="w-56 h-56 text-pink-400" />
                </div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        Live Interactive Class Scheduling & 1-Click Instant Booking
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                        Interactive Class <span className="text-pink-400">Scheduling & Booking</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed font-sans">
                        Browse the weekly schedule for Yoga, Zumba, HIIT, and CrossFit classes. 
                        Check instructor profiles, studio locations, and live seat availability, and 
                        <strong> book or cancel your spot in a single click</strong> with zero forms.
                    </p>
                </div>
            </div>

            {/* View Mode Toggle Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('schedule')}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'schedule'
                                ? 'bg-pink-600 text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]'
                                : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Weekly Class Schedule ({classesList.length})
                    </button>

                    <button
                        onClick={() => setViewMode('my_bookings')}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            viewMode === 'my_bookings'
                                ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                        }`}
                    >
                        <BookmarkCheck className="w-4 h-4" />
                        My Booked Classes ({bookedClasses.length})
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search class, trainer, or studio..."
                        className="w-full bg-black/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-pink-500 outline-none"
                    />
                </div>
            </div>

            {/* Filter Ribbons (Only in schedule view) */}
            {viewMode === 'schedule' && (
                <div className="space-y-3">
                    {/* Category Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-[10px] font-mono uppercase text-gray-500 shrink-0 flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Class Category:
                        </span>
                        {classTypesList.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                                    selectedType === type
                                        ? 'bg-pink-500/20 text-pink-300 border border-pink-500/50 font-bold'
                                        : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Day Filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <span className="text-[10px] font-mono uppercase text-gray-500 shrink-0">Day:</span>
                        {daysList.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
                                    selectedDay === day
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                                        : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* VIEW 1: WEEKLY CLASSES SCHEDULE CARDS */}
            {viewMode === 'schedule' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                        <span>Showing {filteredClasses.length} Available Classes</span>
                        <span className="text-emerald-400">✓ 1-Click Instant Booking Active</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClasses.map(cls => {
                            const isBooked = bookedClasses.some(b => b.classId === cls.id);
                            const remainingSpots = cls.totalCapacity - cls.bookedSpots;
                            const isFull = remainingSpots <= 0;

                            const typeColor = 
                                cls.type === 'Yoga' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' :
                                cls.type === 'Zumba' ? 'text-pink-400 border-pink-500/30 bg-pink-950/20' :
                                cls.type === 'HIIT' ? 'text-amber-400 border-amber-500/30 bg-amber-950/20' :
                                cls.type === 'CrossFit' ? 'text-red-400 border-red-500/30 bg-red-950/20' :
                                'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';

                            return (
                                <div
                                    key={cls.id}
                                    className={`rounded-3xl p-6 border flex flex-col justify-between space-y-5 transition-all duration-300 hover:shadow-xl ${
                                        isBooked
                                            ? 'bg-gradient-to-b from-emerald-950/30 via-black to-black border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                                            : 'bg-black/60 border-white/10 hover:border-pink-500/40'
                                    }`}
                                >
                                    <div className="space-y-4">
                                        {/* Top Badges */}
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${typeColor}`}>
                                                {cls.type}
                                            </span>
                                            <span className="text-xs font-mono text-gray-300 bg-black/60 px-2.5 py-1 rounded-lg border border-white/5 font-bold">
                                                {cls.day}
                                            </span>
                                        </div>

                                        {/* Title & Desc */}
                                        <div>
                                            <h3 className="text-lg font-black text-white tracking-tight">{cls.title}</h3>
                                            <p className="text-xs text-gray-400 mt-1 leading-relaxed font-sans line-clamp-2">
                                                {cls.description}
                                            </p>
                                        </div>

                                        {/* Instructor & Location Box */}
                                        <div className="bg-black/80 border border-white/5 rounded-2xl p-3.5 space-y-2.5">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={cls.instructorAvatar}
                                                    alt={cls.instructorName}
                                                    className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                                                />
                                                <div className="min-w-0">
                                                    <span className="text-[10px] font-mono uppercase text-gray-500 block">Instructor</span>
                                                    <span className="text-xs font-bold text-white truncate block">{cls.instructorName}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                                                <div className="flex items-center gap-1.5 text-gray-300">
                                                    <Clock className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                                    <span className="truncate">{cls.time}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-300">
                                                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                                    <span className="truncate">{cls.location}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Capacity Bar */}
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs font-mono">
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <Users className="w-3.5 h-3.5" />
                                                    Total Capacity: {cls.totalCapacity} Spots
                                                </span>
                                                <span className={`font-bold ${
                                                    isFull 
                                                        ? 'text-red-400' 
                                                        : remainingSpots <= 3 
                                                        ? 'text-amber-400' 
                                                        : 'text-emerald-400'
                                                }`}>
                                                    {isFull ? 'Class Full' : `${remainingSpots} Spots Available`}
                                                </span>
                                            </div>

                                            <div className="w-full h-2 bg-black/60 border border-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${
                                                        isFull ? 'bg-red-500' : remainingSpots <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                    style={{ width: `${(cls.bookedSpots / cls.totalCapacity) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2">
                                        {isBooked ? (
                                            <div className="space-y-2">
                                                <div className="py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs font-mono text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Spot Reserved (Confirmed)
                                                </div>
                                                <button
                                                    onClick={() => handleOneClickCancel(cls.id)}
                                                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    1-Click Cancel Booking
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleOneClickBook(cls)}
                                                disabled={isFull}
                                                className={`w-full py-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                                                    isFull
                                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                                                        : 'bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:scale-102 active:scale-98'
                                                }`}
                                            >
                                                <Zap className="w-4 h-4" />
                                                Instant 1-Click Book
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* VIEW 2: MY BOOKED CLASSES LIST */}
            {viewMode === 'my_bookings' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <BookmarkCheck className="text-emerald-400" />
                            My Active Class Reservations
                        </h3>
                        <span className="text-xs font-mono text-gray-400">
                            Total: {bookedClasses.length} Classes
                        </span>
                    </div>

                    {bookedClasses.length === 0 ? (
                        <div className="bg-black/40 border border-dashed border-white/10 rounded-3xl p-12 text-center text-gray-500 space-y-3">
                            <Calendar className="w-12 h-12 mx-auto text-gray-600" />
                            <p className="text-sm">You have not booked any group classes yet.</p>
                            <button
                                onClick={() => setViewMode('schedule')}
                                className="px-5 py-2 bg-pink-600 text-white rounded-xl text-xs font-mono uppercase font-bold cursor-pointer"
                            >
                                Browse & Book Classes
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookedClasses.map(booking => (
                                <div
                                    key={booking.id}
                                    className="p-6 rounded-3xl bg-black/60 border border-emerald-500/30 hover:border-emerald-500/60 transition-all space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-pink-500/10 text-pink-300 border border-pink-500/30">
                                                    {booking.classType}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                    ✓ Confirmed
                                                </span>
                                            </div>
                                            <h4 className="text-base font-black text-white mt-1">{booking.classTitle}</h4>
                                        </div>

                                        <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                                            {booking.day}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 bg-black/80 border border-white/5 rounded-2xl p-3 text-xs font-mono">
                                        <div>
                                            <span className="text-gray-500 block text-[10px] uppercase">Time Slot</span>
                                            <span className="text-white font-bold">{booking.time}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-[10px] uppercase">Instructor</span>
                                            <span className="text-pink-300 font-bold">{booking.instructorName}</span>
                                        </div>
                                        <div className="col-span-2 border-t border-white/5 pt-2">
                                            <span className="text-gray-500 block text-[10px] uppercase">Location</span>
                                            <span className="text-gray-200">{booking.location}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-1">
                                        <button
                                            onClick={() => handleOneClickCancel(booking.classId)}
                                            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            1-Click Cancel Reservation
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
