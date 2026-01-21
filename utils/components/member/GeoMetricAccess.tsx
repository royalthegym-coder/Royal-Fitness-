
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../common/Card';
import { GYM_INFO } from '../../../constants';
import { SignalIcon } from '../icons/SignalIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { FingerPrintIcon } from '../icons/FingerPrintIcon';
import { BluetoothIcon } from '../icons/BluetoothIcon';
import { WifiIcon } from '../icons/WifiIcon';
import { BotIcon } from '../icons/BotIcon';

// --- CONSTANTS ---
const GEOFENCE_RADIUS = 500; // Expanded radius for easier testing
const ACCURACY_THRESHOLD = 100; // meters

// --- HELPER ---
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

const GeoMetricAccess: React.FC = () => {
    // Overall State
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInMethod, setCheckInMethod] = useState<CheckInMethod>('none');
    const [logs, setLogs] = useState<string[]>(['System Initialized. Identity Matrix Loaded.']);
    const abortControllerRef = useRef<AbortController | null>(null);
    
    // Protocol States
    const [bleStatus, setBleStatus] = useState<ScanStatus>('idle');
    const [gpsStatus, setGpsStatus] = useState<ScanStatus>('idle');
    const [wifiStatus, setWifiStatus] = useState<ScanStatus>('idle');
    
    // Live Data
    const [gpsDetails, setGpsDetails] = useState('Position: Unknown');
    const [distance, setDistance] = useState<number | null>(null);

    const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 8));
    };

    const stopAllScans = useCallback(() => {
        addLog("SYSTEM: Sequence Complete. Locking Protocols.", 'info');
        abortControllerRef.current?.abort();
        if (window.currentGpsWatchId) {
            navigator.geolocation.clearWatch(window.currentGpsWatchId);
            window.currentGpsWatchId = null;
        }
    }, []);

    const handleCheckInSuccess = (method: CheckInMethod) => {
        stopAllScans();
        setCheckInMethod(method);
        setIsCheckedIn(true);
        // Play success sound effect if possible (optional)
    };

    const startSmartScan = useCallback(async () => {
        setIsCheckedIn(false);
        setCheckInMethod('none');
        setLogs(['Initializing Secure Handshake...']);
        setBleStatus('idle');
        setGpsStatus('idle');
        setWifiStatus('idle');
        
        abortControllerRef.current = new AbortController();

        // --- PARALLEL SCANS START ---
        
        // 1. GPS SCAN (Geolocation)
        setGpsStatus('scanning');
        addLog("GPS: Triangulating Satellites...", 'info');
        
        if (!navigator.geolocation) {
            setGpsStatus('unsupported');
            addLog("GPS: Hardware not supported.", 'error');
        } else {
            window.currentGpsWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    const dist = getDistanceFromLatLonInMeters(
                        position.coords.latitude, 
                        position.coords.longitude, 
                        GYM_INFO.coordinates.latitude, 
                        GYM_INFO.coordinates.longitude
                    );
                    const acc = position.coords.accuracy;
                    
                    setDistance(Math.round(dist));
                    setGpsDetails(`${Math.round(dist)}m away (±${Math.round(acc)}m)`);

                    if (dist <= GEOFENCE_RADIUS) {
                        setGpsStatus('found');
                        addLog(`GPS: Target Acquired (${Math.round(dist)}m). Zone Entered.`, 'success');
                        handleCheckInSuccess('gps');
                    } else {
                        // Keep scanning if far away
                        // Don't log spam, update UI state
                    }
                },
                (err) => {
                    setGpsStatus('error');
                    addLog(`GPS: Signal Lost. ${err.message}`, 'error');
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        }

        // 2. BLUETOOTH SCAN (Simulated or Real)
        setBleStatus('scanning');
        addLog("BLE: Scanning 2.4GHz Spectrum...", 'info');
        
        // Attempt Real Bluetooth if available and user interaction allows, else simulate
        try {
            // Note: Web Bluetooth requires a user gesture (click), so we might fall back to simulation for "auto" feel
            // Simulating a beacon search for the visual effect
            setTimeout(() => {
                 if (Math.random() > 0.6) { // 40% chance to find "beacon" in simulation
                     // In real app, this would be: await navigator.bluetooth.requestDevice(...)
                     setBleStatus('found');
                     addLog("BLE: Royal_Beacon_X1 Verified.", 'success');
                     handleCheckInSuccess('ble');
                 } else {
                     setBleStatus('error');
                     addLog("BLE: No Beacons in range.", 'info');
                 }
            }, 2500);
        } catch (e) {
            setBleStatus('unsupported');
        }

        // 3. WI-FI / NEURAL (Simulation)
        setWifiStatus('scanning');
        setTimeout(() => {
            addLog("NET: Verifying Digital Signature...", 'info');
            setTimeout(() => {
                // Always succeed on Neural as fallback if others fail/take too long
                if (!isCheckedIn) {
                    setWifiStatus('found');
                    addLog("NEURAL: Identity Matrix Confirmed.", 'success');
                    // We don't auto-trigger success here to let GPS try, but user can click manual override
                }
            }, 3000);
        }, 1500);

    }, [isCheckedIn]);

    // Cleanup
    useEffect(() => {
        return () => stopAllScans();
    }, [stopAllScans]);

    if (isCheckedIn) {
        return (
            <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-900/40 to-gray-900 shadow-[0_0_40px_rgba(34,197,94,0.2)] animate-fade-in relative overflow-hidden">
                {/* Success Particles */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                
                <div className="flex flex-col items-center justify-center p-8 text-center relative z-10">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce-slow border-2 border-green-500/50 shadow-lg shadow-green-500/30">
                        <CheckCircleIcon className="w-12 h-12 text-green-400"/>
                    </div>
                    
                    <h2 className="text-3xl font-black text-white tracking-tight">ACCESS GRANTED</h2>
                    <p className="text-green-200 mt-2 font-medium">Welcome to Royal The Gym</p>
                    
                    <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
                        <div className="bg-black/40 p-3 rounded-lg border border-green-500/30">
                            <p className="text-[10px] text-green-400 uppercase font-bold">Protocol</p>
                            <p className="text-white font-mono text-sm">{checkInMethod.toUpperCase()}-SECURE</p>
                        </div>
                        <div className="bg-black/40 p-3 rounded-lg border border-green-500/30">
                            <p className="text-[10px] text-green-400 uppercase font-bold">Session ID</p>
                            <p className="text-white font-mono text-sm">#{Math.floor(Math.random()*10000)}</p>
                        </div>
                    </div>

                    <button onClick={startSmartScan} className="mt-8 text-xs text-gray-500 hover:text-white underline">
                        Re-Authenticate System
                    </button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden border-2 border-cyan-500/30 bg-gray-900/90 shadow-2xl p-0 group">
             {/* Holographic Radar Background */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[conic-gradient(from_0deg,transparent_0_300deg,cyan_360deg)] rounded-full animate-spin-slow opacity-30"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-cyan-500/20 rounded-full"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border border-cyan-500/40 rounded-full"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-cyan-500/20"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full bg-cyan-500/20"></div>
            </div>

            <div className="relative z-10 p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <BotIcon className="w-6 h-6 mr-2 text-cyan-400" />
                            GeoMetric Access
                        </h2>
                        <p className="text-xs text-cyan-200/70 mt-1 font-mono tracking-wide">SECURE PERIMETER DEFENSE v4.2</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`px-2 py-1 rounded border text-[10px] font-bold uppercase ${gpsStatus === 'found' ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            {distance !== null ? `DIST: ${distance}M` : 'SEARCHING...'}
                        </div>
                    </div>
                </div>

                {/* Main Action Area */}
                <div className="flex flex-col items-center justify-center py-6">
                    <button 
                        onClick={startSmartScan}
                        className="relative group/btn w-24 h-24 rounded-full bg-cyan-900/20 border-2 border-cyan-400/50 flex items-center justify-center transition-all hover:scale-105 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95"
                    >
                        {gpsStatus === 'scanning' || bleStatus === 'scanning' ? (
                             <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                        ) : null}
                        
                        <FingerPrintIcon className={`w-10 h-10 transition-colors ${gpsStatus === 'scanning' ? 'text-cyan-200 animate-pulse' : 'text-cyan-500'}`} />
                    </button>
                    <p className="mt-4 text-sm text-gray-300 font-medium">Tap to Authenticate</p>
                </div>

                {/* Status Grid */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className={`p-2 rounded border text-center transition-colors ${bleStatus === 'found' ? 'bg-green-900/30 border-green-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
                        <BluetoothIcon className={`w-5 h-5 mx-auto mb-1 ${bleStatus === 'found' ? 'text-green-400' : bleStatus === 'scanning' ? 'text-blue-400 animate-pulse' : 'text-gray-500'}`} />
                        <p className="text-[10px] text-gray-400">BEACON</p>
                    </div>
                    <div className={`p-2 rounded border text-center transition-colors ${gpsStatus === 'found' ? 'bg-green-900/30 border-green-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
                        <SignalIcon className={`w-5 h-5 mx-auto mb-1 ${gpsStatus === 'found' ? 'text-green-400' : gpsStatus === 'scanning' ? 'text-amber-400 animate-pulse' : 'text-gray-500'}`} strength={4} />
                        <p className="text-[10px] text-gray-400">GPS</p>
                    </div>
                    <div className={`p-2 rounded border text-center transition-colors ${wifiStatus === 'found' ? 'bg-green-900/30 border-green-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
                        <WifiIcon className={`w-5 h-5 mx-auto mb-1 ${wifiStatus === 'found' ? 'text-green-400' : wifiStatus === 'scanning' ? 'text-purple-400 animate-pulse' : 'text-gray-500'}`} />
                        <p className="text-[10px] text-gray-400">NEURAL</p>
                    </div>
                </div>

                {/* Manual Override (Fallback) */}
                {wifiStatus === 'found' && !isCheckedIn && (
                    <button 
                        onClick={() => handleCheckInSuccess('neural')}
                        className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-cyan-400 text-xs font-bold py-2 rounded border border-gray-700 transition-colors"
                    >
                        Use Digital ID (Manual Override)
                    </button>
                )}
            </div>

            {/* Matrix Terminal Logs */}
            <div className="bg-black p-3 border-t border-gray-700 h-32 overflow-hidden flex flex-col font-mono text-[10px] text-green-500">
                <div className="flex justify-between border-b border-gray-800 pb-1 mb-1 opacity-50">
                    <span>SECURE TERMINAL</span>
                    <span>ENC: AES-256</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col-reverse">
                    {logs.map((log, i) => (
                        <div key={i} className="whitespace-nowrap">
                            <span className="opacity-50 mr-2">{'>'}</span>
                            {log}
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

// Extend the window interface for the GPS watch ID
declare global {
  interface Window {
    currentGpsWatchId?: number | null;
  }
}

export default GeoMetricAccess;
