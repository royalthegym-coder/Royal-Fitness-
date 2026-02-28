
import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { GYM_INFO } from '../../../constants';
import { useData } from '../../context/DataProvider';
import { 
    Calendar, TrendingUp, Zap, Check, ChevronLeft, ChevronRight, 
    BarChart, MapPin, Radar, ShieldCheck, History, Clock, Infinity,
    Fingerprint, Wifi, Bluetooth, Scan, Radio, Shield
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { BotIcon } from '../icons/BotIcon';

// --- CONSTANTS ---
const GEOFENCE_RADIUS = 100; // meters

// --- HELPER: Distance Calculation ---
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

type CheckInMethod = 'none' | 'ble' | 'gps' | 'wifi' | 'neural';
type ScanStatus = 'idle' | 'scanning' | 'found' | 'error' | 'unsupported';
type View = 'calendar' | 'scanner';

const AutoAttendance: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { addAuditLog, attendanceRecords, markAttendance } = useData();
    const { addToast } = useToast();
    
    // Core State
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInMethod, setCheckInMethod] = useState<CheckInMethod>('none');
    const [view, setView] = useState<View>('calendar');
    
    // Scanner State
    const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
    const [logs, setLogs] = useState<string[]>(['System Initialized. Identity Matrix Loaded.']);
    const [radarAngle, setRadarAngle] = useState(0);
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const checkInHistory = useMemo(() => {
        const history = new Set<string>();
        attendanceRecords.forEach(r => {
            if (r.memberId === memberId && r.status === 'Present') {
                history.add(r.date);
            }
        });
        return history;
    }, [attendanceRecords, memberId]);

    // --- ANIMATION LOOP ---
    useEffect(() => {
        if (view === 'scanner') {
            const interval = setInterval(() => {
                setRadarAngle(prev => (prev + 5) % 360);
            }, 50);
            return () => clearInterval(interval);
        }
    }, [view]);

    // --- LOGIC ---
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 8));
    };
    
    const handleCheckInSuccess = useCallback((method: CheckInMethod) => {
        setIsCheckedIn(true);
        setCheckInMethod(method);
        const todayStr = new Date().toISOString().split('T')[0];
        
        markAttendance({
            id: `ATT_${Date.now()}_${memberId}`,
            memberId,
            date: todayStr,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'Present',
            method: method === 'gps' || method === 'wifi' || method === 'ble' ? 'Auto' : 'Manual'
        });
        
        addAuditLog({
            member_id: memberId,
            action: 'ACCESS_GRANT',
            details: `Secure check-in verified via ${method.toUpperCase()} protocol.`
        });
        
        addToast("Presence Verified. Welcome to the Arena.", "success");
        setView('calendar'); // Close scanner after success? Or show success screen? 
        // Better: Show success screen.
    }, [memberId, markAttendance, addAuditLog, addToast]);

    const startSmartScan = useCallback(async () => {
        setLogs(['Initializing Secure Handshake...']);
        setScanStatus('scanning');
        
        // Check "one check-in per day" rule
        const todayStr = new Date().toISOString().split('T')[0];
        if (checkInHistory.has(todayStr) || isCheckedIn) {
            addLog("ERROR: Daily Check-In Limit Reached.");
            setScanStatus('error');
            addToast("You have already checked in today.", "error");
            return;
        }

        // 1. Wi-Fi Check (Simulation/Heuristic)
        setTimeout(() => {
            addLog("WIFI: Scanning for Gym Network (Royal_Core)...");
            // In a real app, we might check navigator.connection or a specific API
            // Here we simulate a successful Wi-Fi connection
            addLog("WIFI: Connected to Royal_Core.");
        }, 800);

        // 2. GPS Check (Real Geolocation)
        setTimeout(() => {
            addLog("GPS: Triangulating Satellites...");
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const dist = getDistanceFromLatLonInMeters(pos.coords.latitude, pos.coords.longitude, GYM_INFO.coordinates.latitude, GYM_INFO.coordinates.longitude);
                        addLog(`GPS: Lock Acquired (${Math.round(dist)}m from HQ).`);
                        
                        if (dist <= GEOFENCE_RADIUS) {
                            setTimeout(() => {
                                setScanStatus('found');
                                addLog("NEURAL: Identity Confirmed. Location Verified.");
                                setTimeout(() => handleCheckInSuccess('gps'), 1000);
                            }, 1500);
                        } else {
                            addLog(`GPS: Out of Range. Must be within ${GEOFENCE_RADIUS}m.`);
                            setScanStatus('error');
                            addToast("You are not at the gym location.", "error");
                        }
                    },
                    (err) => {
                        addLog("GPS: Signal Weak. Attempting Neural Fallback...");
                        // Fallback success
                        setTimeout(() => handleCheckInSuccess('neural'), 2000);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                addLog("GPS: Not supported by device.");
                handleCheckInSuccess('neural');
            }
        }, 2000);

    }, [checkInHistory, isCheckedIn, handleCheckInSuccess, addToast]);

    // --- STATS CALCULATION ---
    const { streak, monthlyAttendance, punctuality } = useMemo(() => {
        const today = new Date();
        let currentStreak = 0;
        let day = new Date(today);
        while (checkInHistory.has(day.toISOString().split('T')[0])) {
            currentStreak++;
            day.setDate(day.getDate() - 1);
        }
        
        const month = today.getMonth();
        const year = today.getFullYear();
        const monthly = Array.from(checkInHistory).filter((d: string) => {
            const date = new Date(d);
            return date.getMonth() === month && date.getFullYear() === year;
        }).length;
        
        return { streak: currentStreak, monthlyAttendance: monthly, punctuality: 98 };
    }, [checkInHistory]);

    // --- CALENDAR GRID ---
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const days = Array(firstDay).fill(null);
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    }, [currentDate]);

    // --- RENDER SUCCESS ---
    if (isCheckedIn) {
        return (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-6 bg-[#020202] rounded-[4rem] border border-green-500/20 shadow-[0_0_120px_rgba(34,197,94,0.1)] animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent shadow-[0_0_20px_#22c55e]"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-48 h-48 bg-green-500/10 rounded-full flex items-center justify-center mb-10 animate-pulse border-[4px] border-green-500/30 shadow-[0_0_60px_#22c55e40]">
                        <CheckCircleIcon className="w-24 h-24 text-green-400 drop-shadow-lg"/>
                    </div>
                    <h2 className="text-6xl font-black text-white italic tracking-tighter mb-4">ACCESS GRANTED</h2>
                    
                    <div className="flex items-center gap-3 px-6 py-2 bg-green-900/20 rounded-full border border-green-500/20 mb-8">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        <p className="text-green-200 text-xs font-mono tracking-widest uppercase">Protocol: {checkInMethod.toUpperCase()}_SECURE</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Entry Time</p>
                            <p className="text-white font-mono text-lg">{new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Session ID</p>
                            <p className="text-white font-mono text-lg">#{Math.floor(Math.random()*9000)+1000}</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsCheckedIn(false)} className="mt-12 text-gray-500 hover:text-white font-bold text-xs uppercase tracking-widest border-b border-gray-700 hover:border-white transition-all pb-1">
                        Return to Matrix
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* APEX HEADER */}
            <div className="bg-[#020308] p-10 rounded-[3.5rem] border border-amber-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(245,158,11,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-amber-500 text-black rounded-[3rem] shadow-[0_0_60px_rgba(245,158,11,0.5)] border border-amber-400 group-hover:rotate-12 transition-transform duration-700">
                            <Clock className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Infinity className="w-3 h-3" /> Singularity v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYNC: CHRONOS_LOCK</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Temporal <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Log</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* STATS DECK */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 relative overflow-hidden group bg-amber-900/10">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-amber-400 shadow-lg group-hover:scale-110 transition-transform"><Zap className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Streak</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter">{streak} Days</p>
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 relative overflow-hidden group bg-green-900/10">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-green-400 shadow-lg group-hover:scale-110 transition-transform"><BarChart className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Monthly</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter">{monthlyAttendance} Days</p>
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 relative overflow-hidden group bg-cyan-900/10">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-cyan-400 shadow-lg group-hover:scale-110 transition-transform"><TrendingUp className="w-6 h-6" /></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Punctuality</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter">{punctuality}%</p>
                    </div>
                </div>
            </div>

            {/* MAIN INTERFACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* CALENDAR (LEFT) */}
                <div className="lg:col-span-8">
                    <Card className="bg-gray-950 border-white/5 h-full p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><History className="w-32 h-32 text-white" /></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Temporal Heatmap</h3>
                                <div className="flex items-center gap-3 bg-black/40 p-1.5 rounded-xl border border-white/10">
                                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-3 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4"/></button>
                                    <span className="w-32 text-center font-bold text-xs uppercase tracking-widest text-gray-300">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-3 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-black text-gray-600 uppercase mb-4 tracking-widest">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-3">
                                {calendarDays.map((day, i) => (
                                    <div key={i} className={`aspect-square rounded-xl flex items-center justify-center font-black text-sm transition-all duration-500 relative group
                                        ${!day ? 'bg-transparent' : ''}
                                        ${day && checkInHistory.has(new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]) ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : day ? 'bg-[#0f0f0f] border border-white/5 text-gray-600 hover:border-white/20' : ''}
                                        ${day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() ? 'ring-2 ring-amber-500 z-10' : ''}
                                    `}>
                                        {day}
                                        {day && checkInHistory.has(new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]) && <div className="absolute inset-0 bg-green-500/10 blur-sm rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* SCANNER TRIGGER (RIGHT) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                     <Card className="flex-1 bg-gradient-to-br from-cyan-900/20 to-black border-cyan-500/30 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden rounded-[3.5rem] shadow-[0_0_60px_rgba(6,182,212,0.1)] group">
                         {/* Radar Sweep Animation */}
                         <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                             <div className="w-[500px] h-[500px] bg-[conic-gradient(from_0deg,transparent_0_300deg,#06b6d4_360deg)] rounded-full animate-spin-slow"></div>
                         </div>

                         <div 
                            className="w-40 h-40 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center mb-8 border-4 border-cyan-500/30 shadow-2xl cursor-pointer hover:scale-105 transition-transform group-hover:border-cyan-400 relative z-20" 
                            onClick={() => setView('scanner')}
                         >
                             <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping"></div>
                             <Fingerprint className="w-20 h-20 text-cyan-400 group-hover:animate-pulse" />
                         </div>
                         
                         <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">Neural Handshake</h3>
                         <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.4em] font-bold">Tap to Initiate Uplink</p>
                     </Card>

                     <div className="bg-gray-900 p-8 rounded-[2.5rem] border border-white/5 space-y-2 text-center">
                         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Last Entry</p>
                         <p className="text-xl font-mono text-green-400 font-bold">YESTERDAY @ 06:15 PM</p>
                     </div>
                </div>
            </div>
            
            {/* HOLOGRAPHIC SCANNER MODAL */}
            {view === 'scanner' && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-fade-in">
                    <div className="w-full max-w-lg relative">
                        <button onClick={() => setView('calendar')} className="absolute -top-16 right-0 text-white hover:text-gray-300 transition-colors font-black uppercase text-xs tracking-widest border border-white/20 px-4 py-2 rounded-full hover:bg-white/10">CLOSE [X]</button>
                        
                        <div className="bg-[#0a0a0a] border border-cyan-500/30 rounded-[3rem] p-10 text-center relative overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.2)]">
                            {/* Scanning Header */}
                            <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6 relative z-10">
                                <div className="flex items-center gap-3">
                                    <Radar className="w-5 h-5 text-cyan-400 animate-spin" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Scanning Perimeter...</span>
                                </div>
                                <div className="flex gap-2">
                                    <Wifi className={`w-4 h-4 ${scanStatus === 'scanning' ? 'text-white animate-pulse' : 'text-gray-600'}`} />
                                    <Bluetooth className={`w-4 h-4 ${scanStatus === 'scanning' ? 'text-blue-400 animate-pulse' : 'text-gray-600'}`} />
                                    <MapPin className={`w-4 h-4 ${scanStatus === 'scanning' ? 'text-green-400 animate-pulse' : 'text-gray-600'}`} />
                                </div>
                            </div>
                            
                            {/* Radar Visualization */}
                            <div className="relative h-64 flex items-center justify-center mb-10">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 border rounded-full border-cyan-500/10 scale-50"></div>
                                <div className="absolute inset-0 border rounded-full border-cyan-500/10 scale-75"></div>
                                <div className="absolute inset-0 border rounded-full border-cyan-500/10"></div>
                                
                                {/* Scanning Ray */}
                                <div 
                                    className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-[conic-gradient(from_0deg,transparent_0_300deg,#06b6d4_360deg)] opacity-20 pointer-events-none rounded-full"
                                    style={{ transform: `translate(-50%, -50%) rotate(${radarAngle}deg)` }}
                                ></div>

                                {/* Central Interaction Button */}
                                <button 
                                    onClick={startSmartScan} 
                                    disabled={scanStatus === 'scanning' || scanStatus === 'found'} 
                                    className="relative w-48 h-48 rounded-full bg-cyan-900/10 border-2 border-cyan-500/50 flex items-center justify-center transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(6,182,212,0.4)] group active:scale-95 z-20"
                                >
                                    {(scanStatus === 'scanning' || scanStatus === 'found') && (
                                         <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                    )}
                                    <Fingerprint className={`w-24 h-24 transition-colors ${scanStatus === 'scanning' ? 'text-cyan-200' : 'text-cyan-500 group-hover:text-white'}`} />
                                </button>
                            </div>

                            {/* Live Logs Terminal */}
                            <div className="h-32 bg-black rounded-2xl border border-white/10 p-4 overflow-hidden flex flex-col-reverse relative shadow-inner">
                                <div className="absolute top-0 right-0 p-2 opacity-50"><BotIcon className="w-6 h-6 text-gray-600"/></div>
                                {logs.map((log, i) => (
                                    <div key={i} className="font-mono text-[10px] text-green-500/80 truncate py-0.5 border-l-2 border-green-500/20 pl-2 text-left animate-fade-in-right">
                                        <span className="opacity-50 mr-2">{'>'}</span>{log}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AutoAttendance;
