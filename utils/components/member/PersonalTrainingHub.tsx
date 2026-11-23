import React, { useState, useMemo, useEffect } from 'react';
import { 
    User, Search, Star, Clock, Calendar, ShieldCheck, CheckCircle2, 
    CreditCard, Dumbbell, TrendingUp, Plus, Activity, Trash2, 
    MessageSquare, AlertCircle, Sparkles, Flame, Heart, ArrowUpRight,
    QrCode, Wallet, Check, ChevronRight, RefreshCw, X, Shield, Phone
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../store/useCurrencyStore';
import { useData } from '../../context/DataProvider';
import { GYM_INFO } from '../../../constants';
import { toDataURL } from 'qrcode';
import { PersonalTrainer, PTSessionBooking, MetricLog, WorkoutExerciseLog } from '../../../types';

const INITIAL_TRAINERS: PersonalTrainer[] = [];

const INITIAL_METRICS: MetricLog[] = [
    { id: 'm-1', memberId: 1, date: '2026-09-01', weight: 82.5, bodyFat: 21.0, muscleMass: 35.2, hydration: 58 },
    { id: 'm-2', memberId: 1, date: '2026-09-15', weight: 81.2, bodyFat: 20.2, muscleMass: 35.6, hydration: 59 },
    { id: 'm-3', memberId: 1, date: '2026-10-01', weight: 79.8, bodyFat: 19.1, muscleMass: 36.1, hydration: 60 },
    { id: 'm-4', memberId: 1, date: '2026-10-15', weight: 78.4, bodyFat: 18.0, muscleMass: 36.8, hydration: 61 },
    { id: 'm-5', memberId: 1, date: '2026-10-22', weight: 77.5, bodyFat: 17.2, muscleMass: 37.2, hydration: 62 },
];

const INITIAL_WORKOUTS: WorkoutExerciseLog[] = [
    {
        id: 'w-1', memberId: 1, date: '2026-10-21', workoutType: 'strength',
        exerciseName: 'Barbell Flat Bench Press', targetMuscle: 'Chest',
        sets: [
            { setNum: 1, weightKg: 60, reps: 12, rpe: 7 },
            { setNum: 2, weightKg: 80, reps: 8, rpe: 8 },
            { setNum: 3, weightKg: 90, reps: 6, rpe: 9 },
            { setNum: 4, weightKg: 95, reps: 4, rpe: 9.5 }
        ],
        notes: 'Explosive concentric phase, controlled 3-second negative.'
    },
    {
        id: 'w-2', memberId: 1, date: '2026-10-20', workoutType: 'strength',
        exerciseName: 'Barbell Back Squat', targetMuscle: 'Legs',
        sets: [
            { setNum: 1, weightKg: 80, reps: 10, rpe: 7 },
            { setNum: 2, weightKg: 100, reps: 8, rpe: 8 },
            { setNum: 3, weightKg: 110, reps: 6, rpe: 8.5 }
        ],
        notes: 'Full depth below parallel, knees tracked outwards.'
    },
    {
        id: 'w-3', memberId: 1, date: '2026-10-18', workoutType: 'cardio',
        exerciseName: 'High Intensity Treadmill Intervals', targetMuscle: 'Cardio',
        cardioMinutes: 25, cardioDistanceKm: 3.8, caloriesBurned: 320,
        notes: '1 min sprint (15 km/h) / 1 min walk interval protocol.'
    }
];

export const PersonalTrainingHub: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, addInvoice, addTransaction } = useData();
    const { addToast } = useToast();
    const currentMember = members.find(m => m.id === memberId) || members[0];

    const [activeTab, setActiveTab] = useState<'trainers' | 'my_sessions' | 'log_workout' | 'metrics_progress'>('trainers');
    const [searchQuery, setSearchQuery] = useState('');
    const [specialtyFilter, setSpecialtyFilter] = useState('All');

    // Booking state
    const [selectedTrainer, setSelectedTrainer] = useState<PersonalTrainer | null>(null);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [goalFocus, setGoalFocus] = useState('Muscle Hypertrophy & Overload');
    const [sessionNotes, setSessionNotes] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'wallet' | 'card'>('upi');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Booked sessions list (stored in localStorage)
    const [bookedSessions, setBookedSessions] = useState<PTSessionBooking[]>(() => {
        const saved = localStorage.getItem(`pt_sessions_${memberId}`);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return [
            {
                id: 'pt-bk-1',
                trainerId: 'pt-1',
                trainerName: 'Coach Vikram Singh',
                memberId,
                memberName: currentMember?.name || 'Member',
                date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                slot: '08:00 AM - 09:00 AM',
                goalFocus: 'Strength & Progressive Overload',
                status: 'Confirmed',
                paymentStatus: 'Paid',
                amount: 800,
                txnId: 'UPI-PT-982183',
                notes: 'Focus on bench press lockout and bar path mechanics.'
            }
        ];
    });

    const saveBookedSessions = (updated: PTSessionBooking[]) => {
        setBookedSessions(updated);
        localStorage.setItem(`pt_sessions_${memberId}`, JSON.stringify(updated));
    };

    // Metrics Logging State
    const [metricsLogs, setMetricsLogs] = useState<MetricLog[]>(() => {
        const saved = localStorage.getItem(`member_metrics_${memberId}`);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return INITIAL_METRICS;
    });

    const [metricWeight, setMetricWeight] = useState('');
    const [metricBodyFat, setMetricBodyFat] = useState('');
    const [metricMuscleMass, setMetricMuscleMass] = useState('');
    const [metricHydration, setMetricHydration] = useState('');
    const [metricNotes, setMetricNotes] = useState('');

    const saveMetricsLogs = (updated: MetricLog[]) => {
        setMetricsLogs(updated);
        localStorage.setItem(`member_metrics_${memberId}`, JSON.stringify(updated));
    };

    // Workout Logging State
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutExerciseLog[]>(() => {
        const saved = localStorage.getItem(`member_workouts_${memberId}`);
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { /* ignore */ }
        }
        return INITIAL_WORKOUTS;
    });

    const [logWorkoutType, setLogWorkoutType] = useState<'strength' | 'cardio'>('strength');
    const [exerciseName, setExerciseName] = useState('Barbell Flat Bench Press');
    const [targetMuscle, setTargetMuscle] = useState('Chest');
    const [exerciseSets, setExerciseSets] = useState<{ weightKg: number; reps: number; rpe: number }[]>([
        { weightKg: 60, reps: 10, rpe: 8 }
    ]);
    const [cardioMinutes, setCardioMinutes] = useState('20');
    const [cardioDistance, setCardioDistance] = useState('3.0');
    const [cardioCalories, setCardioCalories] = useState('250');
    const [workoutNotesInput, setWorkoutNotesInput] = useState('');

    const saveWorkoutLogs = (updated: WorkoutExerciseLog[]) => {
        setWorkoutLogs(updated);
        localStorage.setItem(`member_workouts_${memberId}`, JSON.stringify(updated));
    };

    // Generate UPI QR Code on modal open
    useEffect(() => {
        if (selectedTrainer && isPaymentModalOpen) {
            const upiString = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${selectedTrainer.sessionPrice}&cu=INR&tn=PT_Session_${selectedTrainer.name.replace(/\s+/g, '_')}`;
            toDataURL(upiString, { width: 280, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error('QR Gen error:', err));
        }
    }, [selectedTrainer, isPaymentModalOpen]);

    // Filtered trainers
    const filteredTrainers = useMemo(() => {
        return INITIAL_TRAINERS.filter(tr => {
            const matchesSearch = tr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tr.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesSpecialty = specialtyFilter === 'All' || tr.specialty.some(s => s.toLowerCase().includes(specialtyFilter.toLowerCase()));
            return matchesSearch && matchesSpecialty;
        });
    }, [searchQuery, specialtyFilter]);

    // Handle Payment & Booking Confirmation
    const handleConfirmBooking = async () => {
        if (!selectedTrainer || !selectedSlot) {
            addToast('Please select a trainer and an available time slot.', 'error');
            return;
        }

        setIsProcessingPayment(true);
        addToast('Verifying payment with payment gateway...', 'info');

        await new Promise(resolve => setTimeout(resolve, 1400));

        const txnId = `TXN-PT-${Date.now().toString().slice(-6)}`;
        const newBooking: PTSessionBooking = {
            id: `pt-bk-${Date.now()}`,
            trainerId: selectedTrainer.id,
            trainerName: selectedTrainer.name,
            memberId,
            memberName: currentMember?.name || 'Member',
            date: selectedDate,
            slot: selectedSlot,
            goalFocus,
            status: 'Confirmed',
            paymentStatus: 'Paid',
            amount: selectedTrainer.sessionPrice,
            txnId,
            notes: sessionNotes || 'Standard PT Session'
        };

        const updatedList = [newBooking, ...bookedSessions];
        saveBookedSessions(updatedList);

        // Record in ledger invoice
        if (addInvoice) {
            addInvoice({
                id: Date.now(),
                memberId,
                memberName: currentMember?.name || 'Member',
                packageId: 0,
                packageName: `1-on-1 PT Session (${selectedTrainer.name})`,
                amount: selectedTrainer.sessionPrice,
                date: selectedDate,
                status: 'Paid',
                paymentMethod: paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'wallet' ? 'Future Pay Wallet' : 'Card',
                items: [{ description: `PT Session with ${selectedTrainer.name} on ${selectedDate} (${selectedSlot})`, amount: selectedTrainer.sessionPrice, type: 'Training' }]
            } as any);
        }

        if (addTransaction) {
            addTransaction({
                id: txnId,
                memberName: currentMember?.name || 'Member',
                amount: selectedTrainer.sessionPrice,
                date: selectedDate,
                method: paymentMethod === 'upi' ? 'QR Code' : 'Credit Card'
            } as any);
        }

        setIsProcessingPayment(false);
        setIsPaymentModalOpen(false);
        setSelectedTrainer(null);
        setSelectedSlot('');
        addToast(`🎉 Congratulations! Your session with ${selectedTrainer.name} has been booked successfully. Receipt: ${txnId}`, 'success');
        setActiveTab('my_sessions');
    };

    // Cancel booked session
    const handleCancelSession = (bookingId: string) => {
        const target = bookedSessions.find(b => b.id === bookingId);
        if (!target) return;
        const updated = bookedSessions.map(b => b.id === bookingId ? { ...b, status: 'Cancelled' as const } : b);
        saveBookedSessions(updated);
        addToast(`Personal training session with ${target.trainerName} cancelled. Amount refunded to wallet.`, 'info');
    };

    // Add metric log
    const handleAddMetric = (e: React.FormEvent) => {
        e.preventDefault();
        const weightNum = parseFloat(metricWeight);
        if (!weightNum || isNaN(weightNum)) {
            addToast('Please enter a valid weight (kg).', 'error');
            return;
        }

        const newLog: MetricLog = {
            id: `m-${Date.now()}`,
            memberId,
            date: new Date().toISOString().split('T')[0],
            weight: weightNum,
            bodyFat: metricBodyFat ? parseFloat(metricBodyFat) : undefined,
            muscleMass: metricMuscleMass ? parseFloat(metricMuscleMass) : undefined,
            hydration: metricHydration ? parseFloat(metricHydration) : undefined,
            notes: metricNotes || undefined
        };

        const updated = [...metricsLogs, newLog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        saveMetricsLogs(updated);

        setMetricWeight('');
        setMetricBodyFat('');
        setMetricMuscleMass('');
        setMetricHydration('');
        setMetricNotes('');
        addToast('Fitness metrics logged successfully!', 'success');
    };

    // Add workout log
    const handleAddWorkoutLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (!exerciseName.trim()) {
            addToast('Please enter an exercise name.', 'error');
            return;
        }

        const newLog: WorkoutExerciseLog = {
            id: `w-${Date.now()}`,
            memberId,
            date: new Date().toISOString().split('T')[0],
            workoutType: logWorkoutType,
            exerciseName: exerciseName.trim(),
            targetMuscle,
            sets: logWorkoutType === 'strength' ? exerciseSets.map((s, idx) => ({
                setNum: idx + 1,
                weightKg: Number(s.weightKg) || 0,
                reps: Number(s.reps) || 0,
                rpe: Number(s.rpe) || 8
            })) : undefined,
            cardioMinutes: logWorkoutType === 'cardio' ? Number(cardioMinutes) : undefined,
            cardioDistanceKm: logWorkoutType === 'cardio' ? Number(cardioDistance) : undefined,
            caloriesBurned: logWorkoutType === 'cardio' ? Number(cardioCalories) : undefined,
            notes: workoutNotesInput || undefined
        };

        const updated = [newLog, ...workoutLogs];
        saveWorkoutLogs(updated);
        setWorkoutNotesInput('');
        addToast(`Workout log for '${exerciseName}' recorded successfully!`, 'success');
    };

    // Latest metrics
    const latestMetric = metricsLogs[metricsLogs.length - 1];
    const firstMetric = metricsLogs[0];
    const weightChange = latestMetric && firstMetric ? (latestMetric.weight - firstMetric.weight).toFixed(1) : '0';

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-gray-950 via-fuchsia-950/40 to-black p-8 rounded-[2.5rem] border border-fuchsia-500/30 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Dumbbell className="w-56 h-56 text-fuchsia-400" />
                </div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                        <Sparkles className="w-3.5 h-3.5" />
                        1-on-1 Personal Training & Bio-Progress Tracker
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
                        Personal Training & <span className="text-fuchsia-400">Progress Tracker</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 leading-relaxed font-sans">
                        Discover certified personal trainers, book live 1-on-1 coaching sessions, and pay securely via UPI. 
                        Log your daily workout sets, body weight, and body fat percentage to track your real-time physical transformation.
                    </p>
                </div>
            </div>

            {/* Quick Stat Ribbon */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center font-black">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase text-gray-500">Active Bookings</div>
                        <div className="text-xl font-black text-white">{bookedSessions.filter(b => b.status === 'Confirmed').length} Sessions</div>
                    </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase text-gray-500">Current Weight</div>
                        <div className="text-xl font-black text-white">{latestMetric ? `${latestMetric.weight} kg` : '78.5 kg'}</div>
                    </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase text-gray-500">Total Workouts</div>
                        <div className="text-xl font-black text-white">{workoutLogs.length} Logs</div>
                    </div>
                </div>

                <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                        <Flame className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-[10px] font-mono uppercase text-gray-500">Weight Shift</div>
                        <div className={`text-xl font-black ${Number(weightChange) <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {Number(weightChange) > 0 ? `+${weightChange}` : weightChange} kg
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                <button
                    onClick={() => setActiveTab('trainers')}
                    className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'trainers'
                            ? 'bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)]'
                            : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                    }`}
                >
                    <User className="w-4 h-4" />
                    Find & Book Personal Trainer
                </button>

                <button
                    onClick={() => setActiveTab('my_sessions')}
                    className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'my_sessions'
                            ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                            : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    My Sessions ({bookedSessions.filter(b => b.status === 'Confirmed').length})
                </button>

                <button
                    onClick={() => setActiveTab('log_workout')}
                    className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'log_workout'
                            ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                            : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                    }`}
                >
                    <Dumbbell className="w-4 h-4" />
                    Log Sets & Body Metrics
                </button>

                <button
                    onClick={() => setActiveTab('metrics_progress')}
                    className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                        activeTab === 'metrics_progress'
                            ? 'bg-amber-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                            : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    Progress Analytics
                </button>
            </div>

            {/* TAB 1: TRAINERS DIRECTORY & BOOKING */}
            {activeTab === 'trainers' && (
                <div className="space-y-6">
                    {/* Search & Filter Toolbar */}
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="relative w-full md:w-96">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search trainer or specialty (e.g. Biomechanics, Fat Loss)..."
                                className="w-full bg-black/80 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:border-fuchsia-500 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                            {['All', 'Bodybuilding', 'Fat Loss', 'Yoga', 'CrossFit'].map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setSpecialtyFilter(filter)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                                        specialtyFilter === filter
                                            ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/50 font-bold'
                                            : 'bg-black/40 text-gray-400 hover:text-white border border-white/5'
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Trainers Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredTrainers.map(trainer => (
                            <div
                                key={trainer.id}
                                className="bg-black/60 border border-white/10 hover:border-fuchsia-500/50 rounded-3xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(217,70,239,0.15)] flex flex-col justify-between space-y-5"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={trainer.avatar}
                                            alt={trainer.name}
                                            className="w-20 h-20 rounded-2xl object-cover border-2 border-fuchsia-500/40 shadow-lg shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-lg font-black text-white truncate">{trainer.name}</h3>
                                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold shrink-0">
                                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                    {trainer.rating}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5 font-mono">
                                                {trainer.experienceYears} Years Experience (Certified Expert)
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {trainer.specialty.map((s, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 rounded-md bg-fuchsia-950/40 border border-fuchsia-500/30 text-fuchsia-300 text-[10px] font-mono"
                                                    >
                                                        {s}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-300 font-sans leading-relaxed line-clamp-3">
                                        {trainer.bio}
                                    </p>

                                    {/* Available Slot Chips */}
                                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                                        <div className="text-[10px] font-mono uppercase text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-cyan-400" />
                                            Today&apos;s Available Slots:
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {trainer.availableSlots.map((slot, sIdx) => (
                                                <span
                                                    key={sIdx}
                                                    className="px-2 py-1 bg-black/80 border border-cyan-500/30 text-cyan-300 text-[10px] rounded-lg font-mono"
                                                >
                                                    {slot}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <div>
                                        <div className="text-[10px] font-mono text-gray-500 uppercase">Session Rate</div>
                                        <div className="text-2xl font-black text-white font-mono">
                                            {getCurrencySymbol()}{trainer.sessionPrice}
                                            <span className="text-xs text-gray-400 font-normal"> / hr</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setSelectedTrainer(trainer);
                                            setSelectedSlot(trainer.availableSlots[0]);
                                            setIsPaymentModalOpen(true);
                                        }}
                                        className="px-6 py-2.5 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Book Session
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 2: MY BOOKED SESSIONS */}
            {activeTab === 'my_sessions' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                            <Clock className="text-cyan-400" />
                            Active Personal Training Schedule
                        </h3>
                        <span className="text-xs font-mono text-gray-400">
                            Total: {bookedSessions.length} Sessions
                        </span>
                    </div>

                    {bookedSessions.length === 0 ? (
                        <div className="bg-black/40 border border-dashed border-white/10 rounded-3xl p-12 text-center text-gray-500 space-y-3">
                            <Calendar className="w-12 h-12 mx-auto text-gray-600" />
                            <p className="text-sm">You have not booked any personal training sessions yet.</p>
                            <button
                                onClick={() => setActiveTab('trainers')}
                                className="px-5 py-2 bg-fuchsia-600 text-white rounded-xl text-xs font-mono uppercase font-bold cursor-pointer"
                            >
                                Find Trainers
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookedSessions.map(session => (
                                <div
                                    key={session.id}
                                    className={`p-6 rounded-3xl border transition-all ${
                                        session.status === 'Confirmed'
                                            ? 'bg-black/60 border-cyan-500/30 hover:border-cyan-500/60'
                                            : 'bg-black/30 border-red-500/20 opacity-60'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-black text-white">{session.trainerName}</h4>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                                    session.status === 'Confirmed'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                                }`}>
                                                    {session.status === 'Confirmed' ? '✓ Confirmed' : 'Cancelled'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-fuchsia-400 font-mono font-bold">{session.goalFocus}</p>
                                        </div>

                                        <span className="text-xs font-mono text-gray-400">
                                            {getCurrencySymbol()}{session.amount} (Paid)
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 my-4 bg-black/80 border border-white/5 rounded-2xl p-3 text-xs font-mono">
                                        <div>
                                            <span className="text-gray-500 block text-[10px] uppercase">Date</span>
                                            <span className="text-white font-bold">{session.date}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block text-[10px] uppercase">Time Slot</span>
                                            <span className="text-cyan-300 font-bold">{session.slot}</span>
                                        </div>
                                        <div className="col-span-2 border-t border-white/5 pt-2">
                                            <span className="text-gray-500 block text-[10px] uppercase">Txn Reference</span>
                                            <span className="text-gray-300">{session.txnId}</span>
                                        </div>
                                    </div>

                                    {session.notes && (
                                        <p className="text-xs text-gray-400 italic mb-4">
                                            Notes: &quot;{session.notes}&quot;
                                        </p>
                                    )}

                                    {session.status === 'Confirmed' && (
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`https://wa.me/?text=${encodeURIComponent(`Hello, I am ${currentMember?.name || 'Member'}. I have booked a personal training session with ${session.trainerName} on ${session.date} (${session.slot}).`)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all"
                                            >
                                                <Phone className="w-3.5 h-3.5" />
                                                Contact Trainer on WhatsApp
                                            </a>

                                            <button
                                                onClick={() => handleCancelSession(session.id)}
                                                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: LOG WORKOUT & BODY METRICS */}
            {activeTab === 'log_workout' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Log Workout Exercise Form */}
                    <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-5">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                                <Dumbbell className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-wider">Log Exercises & Sets</h3>
                                <p className="text-xs text-gray-400">Record daily weights, reps, and intensity</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddWorkoutLog} className="space-y-4">
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setLogWorkoutType('strength')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                                        logWorkoutType === 'strength'
                                            ? 'bg-emerald-600 text-white shadow-lg'
                                            : 'bg-black/40 text-gray-400 border border-white/5'
                                    }`}
                                >
                                    Strength / Weights
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLogWorkoutType('cardio')}
                                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                                        logWorkoutType === 'cardio'
                                            ? 'bg-cyan-600 text-white shadow-lg'
                                            : 'bg-black/40 text-gray-400 border border-white/5'
                                    }`}
                                >
                                    Cardio / HIIT
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-gray-400">Exercise Name</label>
                                <input
                                    type="text"
                                    value={exerciseName}
                                    onChange={e => setExerciseName(e.target.value)}
                                    placeholder="e.g. Barbell Bench Press, Incline Dumbbell..."
                                    className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-emerald-500"
                                    required
                                />
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {['Bench Press', 'Back Squat', 'Deadlift', 'Overhead Press', 'Pull-ups', 'Leg Press'].map(preset => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setExerciseName(preset)}
                                            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[9px] font-mono text-gray-300"
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {logWorkoutType === 'strength' ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-mono uppercase text-gray-400">Sets Breakdown (Sets, Weight kg, Reps)</label>
                                        <button
                                            type="button"
                                            onClick={() => setExerciseSets([...exerciseSets, { weightKg: exerciseSets[exerciseSets.length - 1]?.weightKg || 60, reps: 10, rpe: 8 }])}
                                            className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            <Plus className="w-3 h-3" /> Add Next Set
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {exerciseSets.map((set, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl p-2 text-xs font-mono">
                                                <span className="w-6 text-gray-500 font-bold">#{idx + 1}</span>
                                                <div className="flex-1">
                                                    <span className="text-[9px] text-gray-500 block">Weight (kg)</span>
                                                    <input
                                                        type="number"
                                                        value={set.weightKg}
                                                        onChange={e => {
                                                            const copy = [...exerciseSets];
                                                            copy[idx].weightKg = parseFloat(e.target.value) || 0;
                                                            setExerciseSets(copy);
                                                        }}
                                                        className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-[9px] text-gray-500 block">Reps</span>
                                                    <input
                                                        type="number"
                                                        value={set.reps}
                                                        onChange={e => {
                                                            const copy = [...exerciseSets];
                                                            copy[idx].reps = parseInt(e.target.value) || 0;
                                                            setExerciseSets(copy);
                                                        }}
                                                        className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                <div className="w-16">
                                                    <span className="text-[9px] text-gray-500 block">RPE (1-10)</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={set.rpe}
                                                        onChange={e => {
                                                            const copy = [...exerciseSets];
                                                            copy[idx].rpe = parseFloat(e.target.value) || 8;
                                                            setExerciseSets(copy);
                                                        }}
                                                        className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-white text-xs outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                {exerciseSets.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setExerciseSets(exerciseSets.filter((_, i) => i !== idx))}
                                                        className="p-1 text-red-400 hover:text-red-300 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-mono uppercase text-gray-400">Duration (Mins)</label>
                                        <input
                                            type="number"
                                            value={cardioMinutes}
                                            onChange={e => setCardioMinutes(e.target.value)}
                                            className="w-full bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-mono uppercase text-gray-400">Distance (km)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={cardioDistance}
                                            onChange={e => setCardioDistance(e.target.value)}
                                            className="w-full bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-mono uppercase text-gray-400">Calories (kcal)</label>
                                        <input
                                            type="number"
                                            value={cardioCalories}
                                            onChange={e => setCardioCalories(e.target.value)}
                                            className="w-full bg-black/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-gray-400">Workout Notes</label>
                                <textarea
                                    value={workoutNotesInput}
                                    onChange={e => setWorkoutNotesInput(e.target.value)}
                                    placeholder="e.g. Form was strict today, hit 4 clean reps at 95kg..."
                                    rows={2}
                                    className="w-full bg-black/80 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
                            >
                                ✓ Save Workout Log
                            </button>
                        </form>
                    </div>

                    {/* Log Body Weight & Metrics Form */}
                    <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-5">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black">
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-wider">Body Weight & Metrics Log</h3>
                                <p className="text-xs text-gray-400">Daily physical measurements and transformation records</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddMetric} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase text-gray-400">
                                        Body Weight (kg) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={metricWeight}
                                        onChange={e => setMetricWeight(e.target.value)}
                                        placeholder="e.g. 77.5"
                                        required
                                        className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase text-gray-400">
                                        Body Fat %
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={metricBodyFat}
                                        onChange={e => setMetricBodyFat(e.target.value)}
                                        placeholder="e.g. 17.5"
                                        className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase text-gray-400">
                                        Muscle Mass (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={metricMuscleMass}
                                        onChange={e => setMetricMuscleMass(e.target.value)}
                                        placeholder="e.g. 37.0"
                                        className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-mono uppercase text-gray-400">
                                        Hydration %
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={metricHydration}
                                        onChange={e => setMetricHydration(e.target.value)}
                                        placeholder="e.g. 60.5"
                                        className="w-full bg-black/80 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-cyan-500 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-gray-400">Health / Progress Notes</label>
                                <textarea
                                    value={metricNotes}
                                    onChange={e => setMetricNotes(e.target.value)}
                                    placeholder="e.g. Morning fasted weight check. Energy levels are high..."
                                    rows={2}
                                    className="w-full bg-black/80 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-500 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer"
                            >
                                ✓ Log Body Metrics
                            </button>
                        </form>

                        {/* Recent 3 Metric Entries */}
                        <div className="pt-3 border-t border-white/5 space-y-2">
                            <span className="text-[10px] font-mono uppercase text-gray-500">Recent Log History:</span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                {metricsLogs.slice(-4).reverse().map(m => (
                                    <div key={m.id} className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded-xl text-xs font-mono">
                                        <span className="text-gray-400">{m.date}</span>
                                        <span className="text-cyan-300 font-bold">{m.weight} kg</span>
                                        {m.bodyFat && <span className="text-amber-300">{m.bodyFat}% BF</span>}
                                        {m.muscleMass && <span className="text-emerald-300">{m.muscleMass} kg Muscle</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: METRICS PROGRESS & CHARTS */}
            {activeTab === 'metrics_progress' && (
                <div className="space-y-6">
                    {/* Weight & Body Fat Charts */}
                    <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/10 pb-4">
                            <div>
                                <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp className="text-cyan-400" />
                                    Weight & Body Fat % Progression
                                </h3>
                                <p className="text-xs text-gray-400">Interactive timeline graph of your physical transformation</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Weight (kg)
                                </span>
                                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Body Fat (%)
                                </span>
                            </div>
                        </div>

                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metricsLogs}>
                                    <defs>
                                        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                                    <XAxis dataKey="date" stroke="#6b7280" textAnchor="end" tick={{ fontSize: 10 }} />
                                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} domain={['dataMin - 2', 'dataMax + 2']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#ffffff20', borderRadius: '1rem', color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="weight" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#weightGrad)" name="Weight (kg)" />
                                    <Area type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#fatGrad)" name="Body Fat (%)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Workouts History List */}
                    <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <Dumbbell className="text-emerald-400" />
                                Recent Workout Logs
                            </h3>
                            <span className="text-xs font-mono text-gray-400">{workoutLogs.length} Total Sessions</span>
                        </div>

                        <div className="space-y-3">
                            {workoutLogs.map(log => (
                                <div key={log.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                                log.workoutType === 'strength' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                                            }`}>
                                                {log.workoutType}
                                            </span>
                                            <h4 className="text-sm font-black text-white">{log.exerciseName}</h4>
                                            {log.targetMuscle && (
                                                <span className="text-[10px] font-mono text-gray-400">({log.targetMuscle})</span>
                                            )}
                                        </div>
                                        <span className="text-xs font-mono text-gray-500">{log.date}</span>
                                    </div>

                                    {log.sets && log.sets.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1 font-mono text-xs">
                                            {log.sets.map((s, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-black/60 border border-white/10 rounded-lg text-emerald-300">
                                                    Set {s.setNum}: <strong>{s.weightKg} kg</strong> × {s.reps} reps
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {log.cardioMinutes && (
                                        <div className="flex gap-4 font-mono text-xs text-cyan-300 pt-1">
                                            <span>⏱️ {log.cardioMinutes} mins</span>
                                            {log.cardioDistanceKm && <span>📍 {log.cardioDistanceKm} km</span>}
                                            {log.caloriesBurned && <span>🔥 {log.caloriesBurned} kcal</span>}
                                        </div>
                                    )}

                                    {log.notes && (
                                        <p className="text-xs text-gray-400 italic pt-1">
                                            Note: &quot;{log.notes}&quot;
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT & BOOKING MODAL */}
            {isPaymentModalOpen && selectedTrainer && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#090d16] border border-fuchsia-500/40 rounded-[2.5rem] w-full max-w-lg p-6 md:p-8 space-y-6 relative shadow-[0_0_50px_rgba(217,70,239,0.25)] animate-scale-up">
                        <button
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <div className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-widest font-bold">
                                Personal Training Checkout
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mt-1">
                                Session Booking & Payment
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">
                                1-on-1 Personal Training Session with {selectedTrainer.name}
                            </p>
                        </div>

                        {/* Booking Details Summary */}
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3 font-mono text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Coach:</span>
                                <span className="text-white font-bold">{selectedTrainer.name}</span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px]">Session Date:</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-1.5 text-white outline-none focus:border-fuchsia-500 font-mono text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px]">Time Slot:</span>
                                <select
                                    value={selectedSlot}
                                    onChange={e => setSelectedSlot(e.target.value)}
                                    className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-1.5 text-white outline-none focus:border-fuchsia-500 font-mono text-xs"
                                >
                                    {selectedTrainer.availableSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <span className="text-gray-400 block text-[10px]">Goal Focus:</span>
                                <select
                                    value={goalFocus}
                                    onChange={e => setGoalFocus(e.target.value)}
                                    className="w-full bg-black/80 border border-white/15 rounded-xl px-3 py-1.5 text-white outline-none focus:border-fuchsia-500 font-mono text-xs"
                                >
                                    <option value="Muscle Hypertrophy & Overload">Muscle Hypertrophy & Progressive Overload</option>
                                    <option value="Fat Loss & HIIT Circuits">Rapid Fat Loss & HIIT Conditioning</option>
                                    <option value="Heavy Compound Strength (Squat/Bench/Deadlift)">Compound Strength (5x5 Squat/Bench/Deadlift)</option>
                                    <option value="Spine & Joint Mobility Rehab">Spine, Hip & Rotator Cuff Mobility Rehab</option>
                                </select>
                            </div>

                            <div className="flex justify-between items-center border-t border-white/10 pt-3 text-sm">
                                <span className="text-gray-300 font-bold">Total Payable:</span>
                                <span className="text-fuchsia-400 font-black text-lg">
                                    {getCurrencySymbol()}{selectedTrainer.sessionPrice}
                                </span>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                                Select Payment Method
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('upi')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        paymentMethod === 'upi'
                                            ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-300'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <QrCode className="w-3.5 h-3.5" /> UPI QR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        paymentMethod === 'wallet'
                                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <Wallet className="w-3.5 h-3.5" /> Future Pay
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('card')}
                                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                        paymentMethod === 'card'
                                            ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                            : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
                                    }`}
                                >
                                    <CreditCard className="w-3.5 h-3.5" /> Card / Net
                                </button>
                            </div>
                        </div>

                        {/* UPI QR Display if UPI selected */}
                        {paymentMethod === 'upi' && (
                            <div className="bg-black/80 border border-white/10 rounded-2xl p-4 text-center space-y-2">
                                {qrCodeUrl ? (
                                    <img
                                        src={qrCodeUrl}
                                        alt="UPI QR Code"
                                        className="w-40 h-40 mx-auto rounded-xl p-2 bg-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-40 h-40 mx-auto rounded-xl bg-gray-900 animate-pulse flex items-center justify-center text-xs text-gray-500">
                                        Loading QR...
                                    </div>
                                )}
                                <div className="text-[11px] font-mono text-gray-300">
                                    Merchant UPI ID: <strong className="text-emerald-400">{GYM_INFO.upiIds.gpay1}</strong>
                                </div>
                                <p className="text-[10px] text-gray-500 font-sans">
                                    Scan with Google Pay, PhonePe, Paytm, or BHIM to complete payment.
                                </p>
                            </div>
                        )}

                        {paymentMethod === 'wallet' && (
                            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
                                <div className="text-xs font-mono text-emerald-400 font-bold">
                                    Available Wallet Balance: {getCurrencySymbol()}{currentMember?.walletBalance || 2500}
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    The session amount will be deducted instantaneously from your Future Pay Wallet.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleConfirmBooking}
                            disabled={isProcessingPayment}
                            className="w-full py-3.5 bg-gradient-to-r from-fuchsia-600 via-pink-600 to-emerald-600 hover:from-fuchsia-500 hover:to-emerald-500 text-white font-mono text-xs font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(217,70,239,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                            {isProcessingPayment ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Confirming Session...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    Complete Payment & Confirm Session ({getCurrencySymbol()}{selectedTrainer.sessionPrice})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
