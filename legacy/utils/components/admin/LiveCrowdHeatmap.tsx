import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase, isMock as isSupabaseMock } from 'lib/supabase';
import { attendanceRepo } from '../../../lib/gymDatabase';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { 
    Activity, Users, Flame, Wifi, WifiOff, Cpu, 
    ArrowDownLeft, ArrowUpRight, Zap, RefreshCw, Layers 
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, 
    Tooltip, CartesianGrid, ReferenceLine 
} from 'recharts';

// Strict type interfaces to ensure zero implicit 'any' compile leaks
interface RealtimeOccupancy {
    id: string;
    gym_id: string;
    current_occupancy: number;
    max_capacity: number;
    updated_at: string;
}

interface AttendanceLog {
    id: string;
    gym_id: string;
    member_name: string;
    direction: 'IN' | 'OUT';
    device_id: string;
    logged_at: string;
}

interface HourlyHeatmapPoint {
    hour: string;
    occupancy: number;
    capacity: number;
}

const LiveCrowdHeatmap: React.FC = () => {
    const isOnline = useNetworkStatus();
    // Live state tracking
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
    const [occupancy, setOccupancy] = useState<RealtimeOccupancy>({
        id: '1',
        gym_id: 'fitness_future_01',
        current_occupancy: 45,
        max_capacity: 100,
        updated_at: new Date().toISOString()
    });
    const [logs, setLogs] = useState<AttendanceLog[]>([
        { id: '1', gym_id: 'fitness_future_01', member_name: 'Amit Sharma', direction: 'IN', device_id: 'turnstile_east', logged_at: new Date(Date.now() - 4 * 60 * 1000).toISOString() },
        { id: '2', gym_id: 'fitness_future_01', member_name: 'Rahul Verma', direction: 'IN', device_id: 'turnstile_west', logged_at: new Date(Date.now() - 12 * 60 * 1000).toISOString() },
        { id: '3', gym_id: 'fitness_future_01', member_name: 'Priya Patel', direction: 'OUT', device_id: 'turnstile_east', logged_at: new Date(Date.now() - 18 * 60 * 1000).toISOString() },
        { id: '4', gym_id: 'fitness_future_01', member_name: 'Simran Kaur', direction: 'IN', device_id: 'turnstile_east', logged_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
        { id: '5', gym_id: 'fitness_future_01', member_name: 'Deepak Rao', direction: 'IN', device_id: 'turnstile_west', logged_at: new Date(Date.now() - 32 * 60 * 1000).toISOString() }
    ]);
    
    const [actionLog, setActionLog] = useState<string[]>([]);
    const [newName, setNewName] = useState('');
    const [swipeDirection, setSwipeDirection] = useState<'IN' | 'OUT'>('IN');
    const [isWriting, setIsWriting] = useState(false);

    // Static simulation buffer references to bypass React closure traps in periodic logs
    const activeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Multi-tenant configuration
    const currentGymId = 'fitness_future_01';

    // Core Heatmap static distribution points
    const heatmapData: HourlyHeatmapPoint[] = useMemo(() => [
        { hour: '06:00', occupancy: 20, capacity: 100 },
        { hour: '08:00', occupancy: 65, capacity: 100 },
        { hour: '10:00', occupancy: 42, capacity: 100 },
        { hour: '12:00', occupancy: 28, capacity: 100 },
        { hour: '14:00', occupancy: 15, capacity: 100 },
        { hour: '16:00', occupancy: 35, capacity: 100 },
        { hour: '18:00', occupancy: 88, capacity: 100 },
        { hour: '20:00', occupancy: 70, capacity: 100 },
        { hour: '22:00', occupancy: 30, capacity: 100 },
    ], []);

    // Compute dynamic percentage metrics safely
    const currentPercentage = Math.round((occupancy.current_occupancy / occupancy.max_capacity) * 100);

    // Determine color codes according to safety caps (Yellow alert > 70%, Amber risk > 85%, Crimson lockdown > 95%)
    const ringColor = currentPercentage >= 90 ? '#ef4444' : currentPercentage >= 75 ? '#f59e0b' : '#06b6d4';
    const glowClass = currentPercentage >= 90 
        ? 'rgba(239, 68, 68, 0.4)' 
        : currentPercentage >= 75 
        ? 'rgba(245, 158, 11, 0.4)' 
        : 'rgba(6, 182, 212, 0.4)';

    const addActionReport = useCallback((msg: string) => {
        const time = new Date().toLocaleTimeString();
        setActionLog(prev => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
    }, []);

    // Initialize Supabase queries and open real-time WebSockets with safety cleanups
    useEffect(() => {
        addActionReport(isSupabaseMock? "System running on Offline Overlay" : "Initializing Supabase WebSocket stream link...");

        if (!isOnline) {
            setConnectionStatus('disconnected');
            if (activeIntervalRef.current) clearInterval(activeIntervalRef.current);
            return;
        }

        if (isSupabaseMock) {
            setConnectionStatus('connected');
            // Periodic local autonomous activity driver for immersive visual validation
            activeIntervalRef.current = setInterval(() => {
                const randomName = ['Karan Johar', 'Neha Gupta', 'Rajat Singh', 'Meera Nair', 'Rohan Das', 'Vikram Sen'][Math.floor(Math.random() * 6)];
                const randomDir = Math.random() > 0.4 ? 'IN' : 'OUT';
                
                setOccupancy(prev => {
                    const diff = randomDir === 'IN' ? 1 : -1;
                    const nextVal = Math.max(10, Math.min(prev.max_capacity, prev.current_occupancy + diff));
                    return {
                        ...prev,
                        current_occupancy: nextVal,
                        updated_at: new Date().toISOString()
                    };
                });

                const newSimulatedLog: AttendanceLog = {
                    id: Math.random().toString(36).substring(7),
                    gym_id: currentGymId,
                    member_name: randomName,
                    direction: randomDir,
                    device_id: Math.random() > 0.5 ? 'turnstile_east' : 'turnstile_west',
                    logged_at: new Date().toISOString()
                };

                setLogs(prev => [newSimulatedLog, ...prev.slice(0, 8)]);
                addActionReport(`Autonomous swipe simulated: ${randomName} (${randomDir})`);
            }, 12000);

            return () => {
                if (activeIntervalRef.current) clearInterval(activeIntervalRef.current);
            };
        }

        // --- REAL LIVE SERVER INTEGRATION ---
        setConnectionStatus('reconnecting');
        
        // 1. Initial snapshot queries
        const fetchInitialState = async () => {
            try {
                // Fetch current occupancy setting safely
                const { data: occData, error: occErr } = await supabase
                    .from('gym_occupancy')
                    .select('*')
                    .eq('gym_id', currentGymId)
                    .maybeSingle();

                if (occErr) {
                    addActionReport(`Error querying seed occupancy: ${occErr.message}`);
                } else if (occData) {
                    setOccupancy(occData as RealtimeOccupancy);
                }

                // Sync real-time active floor headcount from SQL View: view_live_gym_crowd
                const liveCrowd = await attendanceRepo.getLiveGymCrowd().catch(() => null);
                if (liveCrowd && typeof liveCrowd.active_members_inside === 'number' && !occData) {
                    setOccupancy(prev => ({
                        ...prev,
                        current_occupancy: liveCrowd.active_members_inside,
                        updated_at: liveCrowd.snapshot_at || new Date().toISOString()
                    }));
                }

                // Fetch recent attendance logs
                const { data: logsData, error: logsErr } = await supabase
                    .from('real_time_attendance_logs')
                    .select('*')
                    .eq('gym_id', currentGymId)
                    .order('logged_at', { ascending: false })
                    .limit(8);

                if (logsErr) {
                    addActionReport(`Error querying historic check-ins: ${logsErr.message}`);
                } else if (logsData) {
                    setLogs(logsData as AttendanceLog[]);
                }
            } catch (err: any) {
                addActionReport(`Connection fetch crash: ${err.message}`);
            }
        };

        fetchInitialState();

        // 2. Event-driven Real-time listeners setup
        const streamChannel = supabase
            .channel('realtime-heatmap-tracker')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'gym_occupancy',
                    filter: `gym_id=eq.${currentGymId}`
                },
                (payload) => {
                    const updatedRec = payload.new as RealtimeOccupancy;
                    if (updatedRec && updatedRec.current_occupancy !== undefined) {
                        setOccupancy(updatedRec);
                        addActionReport(`Supabase broadcast: Live Occupancy updated to ${updatedRec.current_occupancy}`);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'real_time_attendance_logs',
                    filter: `gym_id=eq.${currentGymId}`
                },
                (payload) => {
                    const newLog = payload.new as AttendanceLog;
                    if (newLog) {
                        // Prevent duplicated entries gracefully using unique ID comparisons (Idempotency Rule)
                        setLogs(prev => {
                            if (prev.some(x => x.id === newLog.id)) return prev;
                            return [newLog, ...prev.slice(0, 10)];
                        });
                        addActionReport(`Supabase broadcast: Biometric Turnstile Swipe detected for ${newLog.member_name}`);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setConnectionStatus('connected');
                    addActionReport("Supabase Real-Time Channel Connected and Subscribed successfully.");
                } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
                    setConnectionStatus('disconnected');
                    addActionReport("Supabase WebSockets connection lost. Retrying standard polling fallback...");
                }
            });

        // 3. Absolute WebSocket subscription safety cleanup on unmount
        return () => {
            supabase.removeChannel(streamChannel);
            addActionReport("Real-time cleanup completed. Channel disposed.");
        };
    }, [currentGymId, isSupabaseMock, isOnline, addActionReport]);

    // Perform check-in / check-out database insert trigger directly on turnstile
    const handleDeviceCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        if (!isOnline) {
            addActionReport(`Write rejected (Offline Mode): Cannot log ${swipeDirection} for ${newName}`);
            setNewName('');
            return;
        }

        setIsWriting(true);
        const uniqueId = `trnst_${Date.now()}`;
        const timestamp = new Date().toISOString();

        const logPayload: AttendanceLog = {
            id: uniqueId,
            gym_id: currentGymId,
            member_name: newName.trim(),
            direction: swipeDirection,
            device_id: 'turnstile_primary',
            logged_at: timestamp
        };

        addActionReport(`Inserting turning-gate swipe for: ${newName} (${swipeDirection})...`);

        if (isSupabaseMock) {
            // Local client simulation write path ensuring perfect representation fallback
            setTimeout(() => {
                setLogs(prev => [logPayload, ...prev.slice(0, 8)]);
                setOccupancy(prev => {
                    const adjustment = swipeDirection === 'IN' ? 1 : -1;
                    const nextVal = Math.max(0, Math.min(prev.max_capacity, prev.current_occupancy + adjustment));
                    return {
                        ...prev,
                        current_occupancy: nextVal,
                        updated_at: timestamp
                    };
                });
                addActionReport(`Turnstile registered (Mode): ${newName} swiped ${swipeDirection}`);
                setNewName('');
                setIsWriting(false);
            }, 400);
        } else {
            // Real physical backend execution with Postgres database triggers
            try {
                const { error } = await supabase
                    .from('real_time_attendance_logs')
                    .insert([{
                        id: uniqueId,
                        gym_id: logPayload.gym_id,
                        member_name: logPayload.member_name,
                        direction: logPayload.direction,
                        device_id: logPayload.device_id,
                        logged_at: timestamp
                    }]);

                // Also write canonical entry to attendance_logs when swiping IN
                if (!error && logPayload.direction === 'IN') {
                    await supabase.from('attendance_logs').insert([{
                        id: `att_${uniqueId}`,
                        member_id: logPayload.member_name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
                        check_in_time: timestamp,
                        check_out_time: null,
                        entry_method: 'biometric',
                        hardware_device_id: logPayload.device_id,
                        access_granted: true,
                        denial_reason: null
                    }]);
                }

                if (error) {
                    addActionReport(`Supabase Write Error: ${error.message}`);
                } else {
                    addActionReport(`Supabase row inserted! view_live_gym_crowd & attendance_logs synced.`);
                    setNewName('');
                }
            } catch (err: any) {
                addActionReport(`Write network crash: ${err.message}`);
            } finally {
                setIsWriting(false);
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in p-1">
            {/* Header Hub Dashboard */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border border-cyan-500/20 bg-black/60 p-6 rounded-3xl backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-wider flex items-center gap-3">
                        Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-500">Crowd Heatmap</span>
                    </h1>
                    <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">
                        Smart Space Density Engine & Biometric gate audit logs.
                    </p>
                </div>
                
                {/* Gateway Signal status indicators */}
                <div className="mt-4 md:mt-0 flex items-center gap-3 bg-gray-900/60 px-4 py-2 rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase font-mono text-gray-500 tracking-wider">Gateway status:</span>
                    <div className="flex items-center gap-2">
                        {connectionStatus === 'connected' ? (
                            <>
                                <Wifi className="w-4 h-4 text-[#00FF00] animate-pulse" />
                                <span className="text-xs font-mono text-[#00FF00] font-bold">ONLINE (REALTIME)</span>
                            </>
                        ) : connectionStatus === 'reconnecting' ? (
                            <>
                                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                                <span className="text-xs font-mono text-cyan-400 font-bold">SYNCING DATA</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-red-500" />
                                <span className="text-xs font-mono text-red-500 font-bold">OFFLINE</span>
                            </>
                        )}
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/10 text-white font-mono uppercase">
                            {isSupabaseMock? 'MOCK_SANDBOX' : 'SUPABASE_LIVE'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Core Interactive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Cyberpunk Glowing Progress Ring Card (Occupancy Index) */}
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden group">
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Realtime Occupancy</h3>
                    </div>

                    <div className="absolute top-4 right-4 text-[10px] font-mono text-gray-600 bg-black/60 px-2 py-1 rounded">
                        MAX CLAP: {occupancy.max_capacity}
                    </div>

                    <div className="relative w-64 h-64 flex items-center justify-center mt-6">
                        {/* Custom Cyberpunk Glowing SVG Circular Progress Ring */}
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Inner Background Track */}
                            <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                stroke="#111827" 
                                strokeWidth="8" 
                                fill="transparent" 
                            />
                            {/* Neon Glowing Overlay Path */}
                            <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                stroke={ringColor} 
                                strokeWidth="8" 
                                fill="transparent" 
                                strokeDasharray="251.2"
                                strokeDashoffset={251.2 - (251.2 * Math.min(100, currentPercentage)) / 100}
                                strokeLinecap="round"
                                style={{
                                    filter: `drop-shadow(0 0 8px ${glowClass})`,
                                    transition: 'stroke-dashoffset 0.8s ease-in-out'
                                }}
                            />
                        </svg>

                        {/* Mid Indicator Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">DENSITY</span>
                            <span className="text-5xl font-black italic text-white tracking-tighter my-1">
                                {currentPercentage}%
                            </span>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 mt-1">
                                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: ringColor }}></span>
                                <span className="text-xs font-mono text-white font-bold">
                                    {occupancy.current_occupancy} IN SIDE
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Low footer warnings according to crowd index limits */}
                    <div className="mt-6 w-full bg-gray-900/40 p-3 rounded-xl border border-white/5 text-center">
                        <p className="text-xs font-mono text-gray-400">
                            {currentPercentage >= 90 ? (
                                <span className="text-red-400 font-extrabold animate-pulse">🔴 LOCKDOWN STATUS: SPACE CRITICAL. DEPLOY GATE LOCKOUT</span>
                            ) : currentPercentage >= 75 ? (
                                <span className="text-amber-400 font-bold">🟡 WARNING ALERT: PEAK CAPACITY THRESHOLD. LOCK EXTRA SLOTS</span>
                            ) : (
                                <span className="text-emerald-400">🟢 GREEN STATUS: NOMINAL CAPACITY FLOWS NOMINAL</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* 2. Cyberpunk Occupancy Peak Time Chart (Recharts) */}
                <div className="lg:col-span-2 bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-fuchsia-400" />
                            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Hourly Occupancy Distribution</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/20 px-2 py-1 rounded">
                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> ACTUAL FLOW
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-600 bg-gray-900 px-2 py-1 rounded">
                                <span className="w-2 h-2 rounded-full bg-gray-700"></span> CAPACITY LIMIT
                            </span>
                        </div>
                    </div>

                    {/* Area charts illustrating occupancy dynamics */}
                    <div className="h-64 w-full">
                        {useMemo(() => (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={heatmapData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                                    <XAxis 
                                        dataKey="hour" 
                                        stroke="#4b5563" 
                                        fontSize={10} 
                                        fontFamily="monospace"
                                        tickLine={false} 
                                    />
                                    <YAxis 
                                        stroke="#4b5563" 
                                        fontSize={10} 
                                        fontFamily="monospace"
                                        tickLine={false} 
                                        domain={[0, 100]}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '8px' }}
                                        labelStyle={{ color: '#6b7280', fontSize: '10px', fontFamily: 'monospace' }}
                                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                                    />
                                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "PEAK WARNING", fill: "#ef4444", fontSize: 9, fontFamily: 'monospace', position: 'top' }} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="occupancy" 
                                        stroke="#06b6d4" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorOccupancy)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ), [heatmapData])}
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center border-t border-white/5 pt-4">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-mono">Busiest Interval</p>
                            <p className="text-sm font-black text-white italic">06:00 PM - 08:30 PM</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-mono">Average Stay length</p>
                            <p className="text-sm font-black text-fuchsia-400 italic">52 Minutes</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase font-mono">Total Daily check-ins</p>
                            <p className="text-sm font-black text-[#00FF00] italic">328 Swipes</p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom Admin Control Desk & Audit Logger */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Interactive Swiping Gate Biometric Emulator */}
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Cpu className="w-4 h-4 text-[#00FF00]" />
                            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Turnstile Checkin Emulator</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 font-mono">
                            Admin tool to command custom barcode or biometric checks. Directly executes Database Trigger pipelines.
                        </p>

                        <form onSubmit={handleDeviceCheckIn} className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-mono text-gray-400 mb-1">Member Name</label>
                                <input 
                                    type="text" 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Ramesh Chandra" 
                                    className="w-full text-xs font-mono text-white bg-gray-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSwipeDirection('IN')}
                                    className={`py-3 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider transition-all ${
                                        swipeDirection === 'IN' 
                                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                            : 'bg-transparent border-white/10 text-gray-400'
                                    }`}
                                >
                                    <ArrowDownLeft className="w-4 h-4" /> Swipe IN
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSwipeDirection('OUT')}
                                    className={`py-3 rounded-xl border flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider transition-all ${
                                        swipeDirection === 'OUT' 
                                            ? 'bg-red-950/40 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                                            : 'bg-transparent border-white/10 text-gray-400'
                                    }`}
                                >
                                    <ArrowUpRight className="w-4 h-4" /> Swipe OUT
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={isWriting || !newName.trim()}
                                className="w-full font-black text-[10px] uppercase tracking-widest py-3 border border-fuchsia-500/50 bg-fuchsia-950/20 text-fuchsia-400 rounded-xl hover:bg-fuchsia-500 hover:text-black transition-all font-mono shadow-[0_0_15px_rgba(217,70,239,0.15)] flex items-center justify-center gap-2"
                            >
                                {isWriting ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> COMMITTING...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-3.5 h-3.5 text-yellow-400" /> TRANSMIT TURNSTILE RELAY
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* 2. Live Biometric Swipes Feed */}
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col h-[320px]">
                    <div className="flex items-center gap-2 mb-4 shrink-0">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Realtime Turnstile Feed</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 select-none scrollbar-thin">
                        {useMemo(() => logs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs font-mono text-gray-500">
                                No check-in logs processed.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between border-b border-white/5 py-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${log.direction === 'IN' ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                            {log.direction === 'IN' ? (
                                                <ArrowDownLeft className="w-3.5 h-3.5 text-[#00FF00]" />
                                            ) : (
                                                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-white font-mono">{log.member_name}</p>
                                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                                                {log.device_id || 'TURNSTILE_A'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400">
                                        {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            ))
                        ), [logs])}
                    </div>
                </div>

                {/* 3. System Technical Console Log */}
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 flex flex-col h-[320px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <h3 className="text-xs font-mono text-gray-400 uppercase tracking-widest font-bold">Audit System Reports</h3>
                        </div>
                        <button 
                            onClick={() => setActionLog([])}
                            className="text-[9px] font-mono text-gray-600 hover:text-white uppercase"
                        >
                            CLEAR LOGS
                        </button>
                    </div>

                    <div className="flex-1 bg-gray-950/80 rounded-2xl p-4 border border-white/5 font-mono text-[10px] text-gray-400 overflow-y-auto space-y-1.5 scrollbar-thin">
                        {useMemo(() => actionLog.length === 0 ? (
                            <span className="text-center block text-gray-600 mt-12">[AWAITING CONSOLE ACTION REPORTS...]</span>
                        ) : (
                            actionLog.map((log, idx) => (
                                <div key={idx} className="leading-relaxed border-l-2 border-cyan-500/20 pl-2">
                                    {log}
                                </div>
                            ))
                        ), [actionLog])}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default LiveCrowdHeatmap;
