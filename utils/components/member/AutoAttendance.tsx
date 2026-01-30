
import React, { useEffect, useState, useCallback } from 'react';
import Card from '../common/Card';
import { GYM_INFO } from '../../../constants';
import { SignalIcon } from '../icons/SignalIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { FingerPrintIcon } from '../icons/FingerPrintIcon';
import { BotIcon } from '../icons/BotIcon';
import { WifiIcon } from '../icons/WifiIcon';

// Threshold: 20 meters for Bio-Metric Arrival Alert
const GPS_RADIUS_LIMIT = 0.020; 
const TARGET_WIFI_NAME = "Royal_The_Gym_WiFi";

const AutoAttendance: React.FC = () => {
    const [status, setStatus] = useState<string>('Initializing Security Protocols...');
    const [gpsDistance, setGpsDistance] = useState<number | null>(null);
    const [isWiFiVerified, setIsWiFiVerified] = useState(false);
    const [attendanceMarked, setAttendanceMarked] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(true);
    
    // AI Bot State
    const [botMessage, setBotMessage] = useState<string | null>(null);

    const getDistanceFromLatLonInKm = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }, []);

    const verifyNetwork = useCallback(() => {
        setTimeout(() => setIsWiFiVerified(true), 1000);
        return true;
    }, []);

    const markAttendance = async () => {
        setStatus('Verifying Unique Identity...');
        
        await new Promise(r => setTimeout(r, 1500));
        
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('royal_last_checkin_date', today);
        
        setAttendanceMarked(true);
        setIsScanning(false);
        setStatus('Access Granted');
        
        // --- AI WELCOME SIMULATION ---
        const msgs = [
            "Welcome to the Lab, Beast! Today's Focus: Chest & Triceps.",
            "Identity Confirmed. The Iron Paradise awaits you.",
            "Biometrics Synced. Let's break some PRs today!",
            "Welcome back. Neural systems online. Have a great session."
        ];
        const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
        setBotMessage(randomMsg);
        
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        
        // Voice Welcome
        if ('speechSynthesis' in window) {
             const utterance = new SpeechSynthesisUtterance(randomMsg);
             utterance.rate = 1.1;
             window.speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        if (attendanceMarked) return;
        verifyNetwork();

        if (!navigator.geolocation) {
             setError("GPS Hardware not found.");
             // Fallback to manual override UI
             return;
        }

        const watcher = navigator.geolocation.watchPosition(
            (position) => {
                const dist = getDistanceFromLatLonInKm(
                    GYM_INFO.coordinates.latitude, GYM_INFO.coordinates.longitude,
                    position.coords.latitude, position.coords.longitude
                );
                setGpsDistance(dist);

                // Simulate proximity for demo purposes if user is far but testing
                // In production, enforce strict `dist <= GPS_RADIUS_LIMIT`
                const inGpsRange = dist <= GPS_RADIUS_LIMIT; 

                if (inGpsRange) {
                    setStatus('Bio-Metric Zone Entered.');
                    markAttendance();
                    navigator.geolocation.clearWatch(watcher);
                } else {
                    const m = (dist * 1000).toFixed(0);
                    setStatus(`Approaching Perimeter. ${m}m from HQ.`);
                }
            },
            (err) => setError('GPS Signal Lost. Please enable location.'),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watcher);
    }, [attendanceMarked, getDistanceFromLatLonInKm, verifyNetwork]);

    // --- RENDER: WELCOME WARRIOR BOARD (Success State) ---
    if (attendanceMarked) {
        return (
            <Card className="relative overflow-hidden border-2 border-amber-500 bg-gray-900 shadow-2xl p-0 animate-fade-in">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-amber-500/10 to-transparent"></div>
                </div>

                <div className="relative z-10 p-8 flex flex-col items-center justify-center text-center h-[400px]">
                    <div className="w-32 h-32 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-amber-500 shadow-[0_0_60px_rgba(245,158,11,0.5)] animate-bounce-slow">
                        <BotIcon className="w-16 h-16 text-amber-400" />
                    </div>
                    
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg mb-2">
                        Welcome <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-200">Warrior</span>
                    </h2>
                    
                    {botMessage && (
                        <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-xl border border-cyan-500/30 mt-4 mb-4 max-w-sm">
                            <p className="text-cyan-400 font-mono text-xs mb-1 uppercase tracking-widest flex items-center justify-center">
                                <SignalIcon className="w-3 h-3 mr-2 animate-pulse"/> Incoming Transmission
                            </p>
                            <p className="text-white font-medium text-sm italic">"{botMessage}"</p>
                        </div>
                    )}
                    
                    <div className="flex gap-4 mt-2">
                        <div className="bg-black/50 backdrop-blur-md border border-amber-500/30 px-4 py-2 rounded-lg">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Streak</p>
                            <p className="text-xl font-black text-white">5 DAYS 🔥</p>
                        </div>
                        <div className="bg-black/50 backdrop-blur-md border border-amber-500/30 px-4 py-2 rounded-lg">
                            <p className="text-[10px] text-gray-400 uppercase font-bold">Mission</p>
                            <p className="text-xl font-black text-white">LEG DAY</p>
                        </div>
                    </div>

                    <p className="mt-8 text-xs font-mono text-amber-500/70 tracking-widest">
                        BIOMETRIC ENTRY LOGGED: {new Date().toLocaleTimeString()}
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden border-2 border-cyan-500/30 bg-gray-900 shadow-2xl p-0 group min-h-[400px]">
            {/* Visual Radar Scanner */}
            {isScanning && (
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[conic-gradient(from_0deg,transparent_0_300deg,cyan_360deg)] rounded-full animate-spin-slow"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyan-500/20 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-cyan-500/40 rounded-full"></div>
                </div>
            )}

            <div className="relative z-10 p-8 text-center h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="text-left">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                            <SignalIcon className="w-5 h-5 text-cyan-400" />
                            Perimeter Scan
                        </h2>
                        <p className="text-[10px] text-cyan-500/70 font-mono tracking-[0.2em] mt-1">GEOFENCE ACTIVE</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center flex-grow">
                    <div className="relative w-40 h-40 mb-8">
                        <div className="absolute inset-0 bg-cyan-500/5 rounded-full animate-ping"></div>
                        <div className="absolute inset-4 border-2 border-dashed border-cyan-500/40 rounded-full animate-spin-slow"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <FingerPrintIcon className="w-16 h-16 text-cyan-500 animate-pulse" />
                        </div>
                    </div>
                    
                    {error ? (
                        <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-400 text-xs font-bold mb-4 animate-bounce">
                            {error}
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <p className="text-xl font-black text-white uppercase tracking-tight leading-none">{status}</p>
                        <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-300">
                             <span>DISTANCE:</span>
                             <span className="font-bold text-white">{gpsDistance ? (gpsDistance * 1000).toFixed(0) : '---'}m</span>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden mt-4">
                    <div 
                        className="h-full bg-cyan-500 transition-all duration-700" 
                        style={{ width: `${gpsDistance ? Math.max(5, 100 - (gpsDistance * 500)) : 5}%` }}
                    ></div>
                </div>
                
                {/* Manual Override for Testing when GPS unavailable */}
                {!attendanceMarked && (
                     <button onClick={markAttendance} className="mt-4 text-[10px] text-gray-600 hover:text-white underline">
                        Simulator Override: Force Check-In
                    </button>
                )}
            </div>
        </Card>
    );
};

export default AutoAttendance;
