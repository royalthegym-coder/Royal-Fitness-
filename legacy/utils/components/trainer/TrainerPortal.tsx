import React, { useState, useEffect, useMemo } from 'react';
import { 
    Dumbbell, QrCode, ClipboardList, AlertTriangle, ShieldCheck, 
    User, Search, CheckCircle2, Clock, Activity, Zap, RefreshCw, 
    Heart, ChevronRight, Sparkles, Utensils, Wifi, WifiOff, 
    ArrowUpRight, Play, Camera, Flame, Check, AlertCircle, Phone, Lock
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import GymMembershipQRScanner from '../GymMembershipQRScanner';
import { enqueueOfflineAction, getPendingActions, flushOfflineSyncQueue } from '../../offlineSync';

interface TrainerPortalProps {
    trainerName?: string;
    onLogout: () => void;
    onSwitchPortal?: (portal: 'admin' | 'member' | 'trainer') => void;
}

export const TrainerPortal: React.FC<TrainerPortalProps> = ({ 
    trainerName = 'Coach Rahul (Head Trainer)', 
    onLogout,
    onSwitchPortal
}) => {
    const { members, updateMember } = useData();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'attendance' | 'workouts' | 'injuries'>('attendance');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
    const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
    
    // Offline status & queue
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    // Workout & Diet Assignment state
    const [selectedProtocol, setSelectedProtocol] = useState<'hypertrophy' | 'strength' | 'fatloss' | 'rehab'>('hypertrophy');
    const [selectedDiet, setSelectedDiet] = useState<'high_protein' | 'deficit' | 'desi_digestive'>('high_protein');
    const [trainerNotes, setTrainerNotes] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    // Track online/offline status and pending queue
    useEffect(() => {
        const updateQueue = async () => {
            const pending = await getPendingActions();
            setPendingCount(pending.length);
        };

        const handleOnline = () => {
            setIsOnline(true);
            addToast('Internet reconnected! Syncing data...', 'success');
            handleFlushSync();
        };
        const handleOffline = () => {
            setIsOnline(false);
            addToast('Offline mode active: All check-ins will be securely saved in local IndexedDB.', 'info');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('fitness_future_offline_synced', updateQueue);
        updateQueue();

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('fitness_future_offline_synced', updateQueue);
        };
    }, []);

    const handleFlushSync = async () => {
        setIsSyncing(true);
        try {
            const res = await flushOfflineSyncQueue();
            const pending = await getPendingActions();
            setPendingCount(pending.length);
            if (res.synced > 0) {
                addToast(`${res.synced} offline records successfully synced to Supabase!`, 'success');
            }
        } finally {
            setIsSyncing(false);
        }
    };

    // Filter members for attendance / tracking
    const filteredMembers = useMemo(() => {
        return members.filter(m => 
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.phone && m.phone.includes(searchQuery)) ||
            (m.loginId && m.loginId.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [members, searchQuery]);

    const selectedMember = useMemo(() => {
        return members.find(m => m.id === selectedMemberId) || filteredMembers[0] || members[0];
    }, [members, selectedMemberId, filteredMembers]);

    // Fast 1-Tap Attendance Check-In (Offline Queue + Supabase)
    const handleTapCheckIn = async (member: any) => {
        const checkInTime = new Date().toISOString();

        // 1. Queue offline or online sync
        await enqueueOfflineAction({
            type: 'attendance_checkin',
            payload: {
                memberId: member.id,
                code: member.phone || String(member.id),
                checkInTime
            }
        });

        // 2. Update local state immediately (Optimistic UI)
        if (updateMember) {
            updateMember({
                ...member,
                status: 'Active',
                lastAttendanceDate: checkInTime,
                inactivityDays: 0
            });
        }

        const pending = await getPendingActions();
        setPendingCount(pending.length);

        addToast(
            `Attendance logged for ${member.name}! ${!isOnline ? '(Saved in Offline Queue)' : '(Database Synced)'}`,
            'success'
        );
    };

    // 1-Click Dynamic Workout & Diet Assignment
    const handleAssignProtocol = async () => {
        if (!selectedMember) return;
        setIsAssigning(true);

        const protocolNames = {
            hypertrophy: 'Hypertrophy 4-Day Progressive Overload (Chest/Back/Legs/Arms)',
            strength: 'Pure 5x5 Compound Power Matrix (Squat/Bench/Deadlift)',
            fatloss: '20-Min High Metabolic HIIT & Sattu Hydration Protocol',
            rehab: 'Joint Decompression & Rotator Cuff Mobility Suite'
        };

        const dietNames = {
            high_protein: 'High Casein & Whey Synthesis Matrix (Paneer, Sprouts, Eggs, Dahi)',
            deficit: 'Sub-2000 Kcal Fat Shred with Green Moong & Roasted Chana',
            desi_digestive: 'Ayurvedic Gut Stabilizer (Bajra Atta, Jeera Chaas & Sendha Namak)'
        };

        const workoutPlanText = protocolNames[selectedProtocol];
        const dietPlanText = dietNames[selectedDiet];

        // Queue action for offline resilience
        await enqueueOfflineAction({
            type: 'workout_log',
            payload: {
                memberId: selectedMember.id,
                memberName: selectedMember.name,
                workoutPlan: workoutPlanText,
                dietPlan: dietPlanText,
                trainerNotes,
                assignedBy: trainerName,
                assignedAt: new Date().toISOString()
            }
        });

        // Update local member object
        if (updateMember) {
            updateMember({
                ...selectedMember,
                approvedAiPlan: workoutPlanText,
                coaching_notes: [
                    ...(selectedMember.coaching_notes || []),
                    {
                        id: `note_${Date.now()}`,
                        text: `[${trainerName}]: Assigned ${workoutPlanText}. Diet: ${dietPlanText}. Notes: ${trainerNotes || 'Follow with high intensity.'}`,
                        timestamp: new Date().toISOString(),
                        isVoice: false
                    }
                ]
            });
        }

        setTimeout(() => {
            setIsAssigning(false);
            setTrainerNotes('');
            addToast(`New workout and diet plan successfully assigned to ${selectedMember.name}!`, 'success');
        }, 400);
    };

    // Injury & Health Radar List
    const injuryFlaggedMembers = useMemo(() => {
        return members.filter(m => {
            const history = m.medical_history;
            const injuries = history?.injuries || [];
            const bp = history?.blood_pressure;
            const heartRate = m.hrv && m.hrv < 40;
            return injuries.length > 0 || bp === 'High' || heartRate || m.status === 'Pending';
        });
    }, [members]);

    return (
        <div className="min-h-screen bg-[#040608] text-white flex flex-col font-sans selection:bg-emerald-500/30">
            {/* Top Navigation Bar */}
            <header className="bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] text-black">
                        <Dumbbell className="w-5 h-5 font-black" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-sm md:text-base font-black uppercase tracking-tight text-white flex items-center gap-2">
                                <span>Trainer & Staff Portal</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    FLOOR OPS
                                </span>
                            </h1>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono">
                            {trainerName} &bull; Fitness Future Floor Command
                        </p>
                    </div>
                </div>

                {/* Right Actions: Offline Sync Status & Controls */}
                <div className="flex items-center gap-2 md:gap-3 font-mono">
                    {/* Sync Indicator */}
                    <button
                        type="button"
                        onClick={handleFlushSync}
                        disabled={isSyncing || !isOnline}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all cursor-pointer ${
                            !isOnline
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : pendingCount > 0
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                        title="Click to manually flush offline queue to Supabase"
                    >
                        {!isOnline ? (
                            <>
                                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                <span className="text-[11px] font-bold">Offline ({pendingCount} queued)</span>
                            </>
                        ) : isSyncing ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                                <span className="text-[11px] font-bold">Syncing...</span>
                            </>
                        ) : pendingCount > 0 ? (
                            <>
                                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-[11px] font-bold">Sync {pendingCount} Pending</span>
                            </>
                        ) : (
                            <>
                                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[11px] font-bold">Live Synced</span>
                            </>
                        )}
                    </button>

                    {/* Camera Scanner Trigger */}
                    <button
                        type="button"
                        onClick={() => setIsScannerModalOpen(true)}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                        <Camera className="w-4 h-4" />
                        <span className="hidden sm:inline">Camera QR Scan</span>
                    </button>

                    {/* Switch to Admin if permitted */}
                    {onSwitchPortal && (
                        <button
                            type="button"
                            onClick={() => onSwitchPortal('admin')}
                            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs border border-white/10"
                        >
                            <span>Admin View</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={onLogout}
                        className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Sub-Navigation Tabs */}
            <div className="bg-[#080c10] border-b border-white/10 px-4 md:px-8 py-2.5 flex gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
                {[
                    { id: 'attendance', label: '1. Quick Attendance Scanner', icon: <QrCode className="w-4 h-4 text-emerald-400" /> },
                    { id: 'workouts', label: '2. Dynamic Workouts & Diet', icon: <ClipboardList className="w-4 h-4 text-cyan-400" /> },
                    { id: 'injuries', label: `3. Client Health & Injury Alerts (${injuryFlaggedMembers.length})`, icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2.5 px-4 py-2 rounded-xl whitespace-nowrap font-bold uppercase transition-all cursor-pointer ${
                            activeTab === tab.id
                                ? 'bg-white/10 text-white border border-white/20 shadow-lg'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Portal Content Area */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                {/* TAB 1: QUICK ATTENDANCE SCANNER */}
                {activeTab === 'attendance' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left: Quick Tap Checklist */}
                            <div className="lg:col-span-7 bg-[#070a0e] border border-white/10 rounded-3xl p-5 md:p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            <span>Gym Floor 1-Tap Attendance Desk</span>
                                        </h3>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">
                                            Record instant attendance from the trainer or reception desk (Offline Supported)
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search member or phone..."
                                            className="bg-black/60 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                    {filteredMembers.map(member => {
                                        const isPresentToday = member.lastAttendanceDate && 
                                            new Date(member.lastAttendanceDate).toDateString() === new Date().toDateString();
                                        const isChurnRisk = member.status === 'Pending' || (member.inactivityDays && member.inactivityDays >= 4);

                                        return (
                                            <div
                                                key={member.id}
                                                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                                    isPresentToday
                                                        ? 'bg-emerald-950/20 border-emerald-500/40'
                                                        : isChurnRisk
                                                        ? 'bg-rose-950/20 border-rose-500/30'
                                                        : 'bg-black/40 border-white/5 hover:border-white/15'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-800 border border-white/10 flex items-center justify-center font-black text-white shrink-0">
                                                        {member.avatar ? (
                                                            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-xl" />
                                                        ) : (
                                                            member.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-white">{member.name}</span>
                                                            {isChurnRisk && (
                                                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                                                    4+ Days Absent
                                                                </span>
                                                            )}
                                                            {isPresentToday && (
                                                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                                                    <Check className="w-2.5 h-2.5" /> Present
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] font-mono text-gray-400 flex items-center gap-2 mt-0.5">
                                                            <span>+91 {member.phone}</span>
                                                            <span>&bull;</span>
                                                            <span className="text-gray-300">{member.packageId ? 'Gold Plan' : 'Standard'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleTapCheckIn(member)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                                                            isPresentToday
                                                                ? 'bg-white/10 text-emerald-400 hover:bg-white/20'
                                                                : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                                        }`}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        <span>{isPresentToday ? 'Re-Check' : 'Mark Present'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right: Embedded QR Scanner Card */}
                            <div className="lg:col-span-5 bg-[#070a0e] border border-white/10 rounded-3xl p-5 md:p-6 space-y-4 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                                            <Camera className="w-5 h-5 text-cyan-400" />
                                            <span>Live Camera QR Scanner Station</span>
                                        </h3>
                                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30">
                                            MediaDevices
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed font-sans">
                                        Scan the member&apos;s mobile pass or digital ID card QR code using the trainer mobile or tablet front/rear camera to log check-in/out entries in seconds.
                                    </p>
                                </div>

                                <div className="p-6 bg-black/60 border border-dashed border-emerald-500/40 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 my-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                                        <QrCode className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white uppercase font-mono">Launch Camera Scanner</div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Hotkey: Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-emerald-300">Q</kbd> on keyboard
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsScannerModalOpen(true)}
                                        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-95 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] cursor-pointer"
                                    >
                                        Open Full Camera Scanner
                                    </button>
                                </div>

                                <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[11px] font-mono text-gray-400 space-y-1">
                                    <div className="text-emerald-400 font-bold">⚡ Zero-Latency Floor Advantage:</div>
                                    <div>1. Attendance syncs directly to the database upon scan.</div>
                                    <div>2. Inactivity Days immediately reset to 0.</div>
                                    <div>3. Churn Risk alert is automatically cleared.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: DYNAMIC WORKOUT & DIET ASSIGNMENT */}
                {activeTab === 'workouts' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Member Selector */}
                            <div className="lg:col-span-4 bg-[#070a0e] border border-white/10 rounded-3xl p-5 space-y-4">
                                <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2 font-mono">
                                    <User className="w-4 h-4 text-cyan-400" />
                                    <span>Select Client</span>
                                </h3>

                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                    {members.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => setSelectedMemberId(m.id)}
                                            className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                                                selectedMember?.id === m.id
                                                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                                                    : 'bg-black/40 border-white/5 hover:border-white/15'
                                            }`}
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center font-bold text-cyan-300 shrink-0">
                                                {m.name.charAt(0)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="text-xs font-bold text-white truncate">{m.name}</div>
                                                <div className="text-[10px] font-mono text-gray-400">+91 {m.phone}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Plan Allotment Form */}
                            <div className="lg:col-span-8 bg-[#070a0e] border border-white/10 rounded-3xl p-6 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                                    <div>
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                                            DYNAMIC WORKOUT & NUTRITION ALLOTMENT
                                        </span>
                                        <h3 className="text-xl font-black text-white mt-0.5">
                                            Customized Fitness Plan for {selectedMember?.name}
                                        </h3>
                                    </div>
                                    <div className="text-xs font-mono px-3 py-1 bg-white/5 rounded-full border border-white/10 text-gray-300">
                                        Client ID: #{selectedMember?.id}
                                    </div>
                                </div>

                                {/* Step 1: Select Workout Protocol */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono block">
                                        1. Select Workout Protocol
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            { id: 'hypertrophy', title: 'Hypertrophy 4-Day Split', desc: '8-12 reps progressive overload for lean muscle mass growth' },
                                            { id: 'strength', title: 'Pure 5x5 Compound Power', desc: 'Heavy Squat, Bench, and Deadlift compound strength training' },
                                            { id: 'fatloss', title: 'High Metabolic 20-Min HIIT', desc: 'Rapid fat loss and cardiovascular endurance conditioning' },
                                            { id: 'rehab', title: 'Joint Rehab & Mobility Suite', desc: 'Rotator cuff, shoulder, and lower back pain rehabilitation' }
                                        ].map(proto => (
                                            <div
                                                key={proto.id}
                                                onClick={() => setSelectedProtocol(proto.id as any)}
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                                                    selectedProtocol === proto.id
                                                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                                        : 'bg-black/40 border-white/5 hover:border-white/15'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-black text-white">{proto.title}</span>
                                                    {selectedProtocol === proto.id && <Check className="w-4 h-4 text-emerald-400" />}
                                                </div>
                                                <p className="text-[11px] text-gray-400 leading-relaxed font-sans">{proto.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 2: Select Diet Strategy */}
                                <div className="space-y-3">
                                    <label className="text-xs font-black uppercase tracking-wider text-cyan-400 font-mono block">
                                        2. Assign Nutrition & Diet Strategy
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { id: 'high_protein', title: 'High Protein Muscle Plan', desc: 'Paneer, Sprouts, Greek Yogurt, Whey Protein' },
                                            { id: 'deficit', title: 'Caloric Deficit Shred Plan', desc: 'Sattu, Green Moong, Fresh Greens & Oats' },
                                            { id: 'desi_digestive', title: 'Ayurvedic Gut Stabilizer', desc: 'Millet Flatbread, Cumin Buttermilk, Rock Salt' }
                                        ].map(diet => (
                                            <div
                                                key={diet.id}
                                                onClick={() => setSelectedDiet(diet.id as any)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                                                    selectedDiet === diet.id
                                                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                                                        : 'bg-black/40 border-white/5 hover:border-white/15'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-black text-white">{diet.title}</span>
                                                    {selectedDiet === diet.id && <Check className="w-4 h-4 text-cyan-400" />}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-sans">{diet.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Step 3: Trainer Coaching Notes */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono block">
                                        Trainer Direct Cues & Special Instructions:
                                    </label>
                                    <textarea
                                        value={trainerNotes}
                                        onChange={e => setTrainerNotes(e.target.value)}
                                        placeholder="e.g. Perform 10 mins shoulder warm-up, verify form before heavy compound lifts..."
                                        rows={2}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-500 font-sans"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAssignProtocol}
                                    disabled={isAssigning}
                                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500 hover:opacity-95 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] cursor-pointer flex items-center justify-center gap-2"
                                >
                                    {isAssigning ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Saving Plan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 fill-current" />
                                            <span>Assign Plan & Sync to Member App</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: CLIENT HEALTH & INJURY MONITORING */}
                {activeTab === 'injuries' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-[#070a0e] border border-white/10 rounded-3xl p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                                <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                                        CRITICAL INJURY & HEALTH SURVEILLANCE
                                    </span>
                                    <h3 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                                        <span>Client Injury & Special Attention Alerts ({injuryFlaggedMembers.length})</span>
                                    </h3>
                                    <p className="text-xs text-gray-400 font-sans mt-0.5">
                                        To prevent any gym floor accidents, trainers are immediately alerted about members requiring special biomechanical precautions.
                                    </p>
                                </div>
                                <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 font-mono text-xs flex items-center gap-2">
                                    <Activity className="w-4 h-4 animate-pulse" />
                                    <span>Real-time Safety Matrix</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {injuryFlaggedMembers.map(member => {
                                    const history = member.medical_history;
                                    const injuries = history?.injuries || ['Lumbar / Lower Back Tightness'];

                                    return (
                                        <div
                                            key={member.id}
                                            className="p-5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-3 relative overflow-hidden"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="text-sm font-black text-white">{member.name}</h4>
                                                    <div className="text-[10px] font-mono text-gray-400">+91 {member.phone}</div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/40">
                                                    CAUTION
                                                </span>
                                            </div>

                                            <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1">
                                                <div className="text-[10px] font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Injury / Medical History:
                                                </div>
                                                <p className="text-xs text-amber-200 font-sans">
                                                    {injuries.join(', ')}
                                                </p>
                                            </div>

                                            <div className="text-[11px] font-mono text-gray-400 space-y-0.5">
                                                <div>Blood Pressure: <span className="text-white">{history?.blood_pressure || 'Normal'}</span></div>
                                                <div>Trainer Cue: <span className="text-emerald-400">Keep neutral spine during deadlifts</span></div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedMemberId(member.id);
                                                    setActiveTab('workouts');
                                                    setSelectedProtocol('rehab');
                                                }}
                                                className="w-full py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                                            >
                                                <span>Assign Rehab Plan</span>
                                                <ArrowUpRight className="w-3 h-3 text-amber-400" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Quick QR Scanner Modal */}
            <GymMembershipQRScanner
                isOpen={isScannerModalOpen}
                onClose={() => setIsScannerModalOpen(false)}
                mode="modal"
            />
        </div>
    );
};

export default TrainerPortal;
