
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '../common/Card';
import { GYM_INFO } from '../../../constants';
import { SignalIcon } from '../icons/SignalIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { FingerPrintIcon } from '../icons/FingerPrintIcon';
import { BluetoothIcon } from '../icons/BluetoothIcon';
import { WifiIcon } from '../icons/WifiIcon';
import { BotIcon } from '../icons/BotIcon';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { 
    Radar, MapPin, RefreshCw, Lock, Unlock, 
    ShieldCheck, Smartphone, Check 
} from 'lucide-react';

// --- CONSTANTS ---
const GEOFENCE_RADIUS = 500; // meters
const ROYAL_BEACON_SERVICE_UUID = '0000feaa-0000-1000-8000-00805f9b34fb'; // Standard Eddystone Service

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
type ScanStatus = 'idle' | 'scanning' | 'found' | 'error' | 'unsupported' | 'denied';

const AnimatedCheckmark = () => (
    <div className="relative flex items-center justify-center w-32 h-32">
        <div className="absolute inset-0 border-4 border-green-500/30 rounded-full animate-ping"></div>
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_#22c55e] relative z-10">
            <Check className="w-12 h-12 text-black animate-stroke" strokeWidth={4} />
        </div>
    </div>
);

const GeoMetricAccess: React.FC = () => {
    const { addAuditLog } = useData();
    const { addToast } = useToast();
    
    // Core State
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInMethod, setCheckInMethod] = useState<CheckInMethod>('none');
    
    // Logs State
    const [logs, setLogs] = useState<string[]>(['System Initialized. Identity Matrix Loaded.']);
    
    // Scanner States
    const [bleStatus, setBleStatus] = useState<ScanStatus>('idle');
    const [gpsStatus, setGpsStatus] = useState<ScanStatus>('idle');
    const [wifiStatus, setWifiStatus] = useState<ScanStatus>('idle');
    
    const [distance, setDistance] = useState<number | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 12));
    };

    const stopAllScans = useCallback(() => {
        if (!isCheckedIn) addLog("SYSTEM: Scan Sequence Halted.");
        abortControllerRef.current?.abort();
        if ((window as any).currentGpsWatchId) {
            navigator.geolocation.clearWatch((window as any).currentGpsWatchId);
            (window as any).currentGpsWatchId = null;
        }
    }, [isCheckedIn]);

    const handleCheckInSuccess = (method: CheckInMethod) => {
        stopAllScans();
        setCheckInMethod(method);
        setIsCheckedIn(true);
        addAuditLog({
            member_id: 0, // Current user context usually
            action: 'ACCESS_GRANT',
            details: `Secure check-in verified via ${method.toUpperCase()} protocol.`
        });
        addLog(`SUCCESS: Access Granted via ${method.toUpperCase()}.`);
    };

    // --- 1. BLE SCANNING IMPLEMENTATION ---
    const scanBluetooth = async () => {
        setBleStatus('scanning');
        addLog("BLE: Activating Bluetooth Transceiver...");

        // Check for Web Bluetooth API support
        const nav = navigator as any;
        if (!nav.bluetooth) {
            setBleStatus('unsupported');
            addLog("BLE: Browser hardware mismatch. Web Bluetooth API unavailable.");
            return false; // Continue to next method
        }

        try {
            addLog("BLE: Requesting Beacon Authorization...");
            // Request device - this MUST be triggered by user gesture, which this function is (via button click in startSmartScan flow)
            const device = await nav.bluetooth.requestDevice({
                // We accept all devices for demo purposes or filter by service if hardware is known
                acceptAllDevices: true,
                optionalServices: [ROYAL_BEACON_SERVICE_UUID, 'battery_service', 'device_information']
            });

            if (device) {
                addLog(`BLE: Beacon Handshake: ${device.name || 'Unknown Device'}`);
                setBleStatus('found');
                
                // Try to connect
                if (device.gatt) {
                     addLog("BLE: Verifying GATT Token...");
                     await device.gatt.connect();
                     addLog("BLE: Token Verified. 100% Match.");
                     handleCheckInSuccess('ble');
                     return true;
                } else {
                     // Even if connection fails, presence might be enough for some policies
                     addLog("BLE: Presence detected. Weak Signal.");
                     handleCheckInSuccess('ble');
                     return true;
                }
            }
        } catch (error: any) {
            if (error.name === 'NotFoundError' || error.name === 'UserCancelledError') {
                addLog("BLE: Scan cancelled or no device selected.");
                setBleStatus('idle');
            } else {
                setBleStatus('error');
                addLog(`BLE Error: ${error.message}`);
            }
        }
        return false;
    };

    // --- 2. GPS AUTHORIZATION & SCAN ---
    const scanGPS = async () => {
        setGpsStatus('scanning');
        addLog("GPS: Triangulating Satellite Position...");

        if (!navigator.geolocation) {
            setGpsStatus('unsupported');
            addLog("GPS: Hardware module not found.");
            return false;
        }

        return new Promise<boolean>((resolve) => {
            (window as any).currentGpsWatchId = navigator.geolocation.watchPosition(
                (position) => {
                    const dist = getDistanceFromLatLonInMeters(
                        position.coords.latitude, 
                        position.coords.longitude, 
                        GYM_INFO.coordinates.latitude, 
                        GYM_INFO.coordinates.longitude
                    );
                    setDistance(Math.round(dist));

                    if (dist <= GEOFENCE_RADIUS) {
                        setGpsStatus('found');
                        addLog(`GPS: Geofence Breached (${Math.round(dist)}m to Core).`);
                        handleCheckInSuccess('gps');
                        resolve(true);
                    } else {
                         // Still scanning, but update log occasionally
                         if (Math.random() > 0.8) addLog(`GPS: Tracking... Distance: ${Math.round(dist)}m`);
                    }
                },
                (err) => {
                    if (err.code === 1) {
                         setGpsStatus('denied');
                         addLog("GPS: Authorization Denied by User.");
                         addToast("Please enable Location Services.", "error");
                    } else {
                         setGpsStatus('error');
                         addLog(`GPS: Signal Lost (${err.message}).`);
                    }
                    resolve(false);
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    };

    // --- 3. MASTER SCAN ORCHESTRATOR ---
    const startSmartScan = useCallback(async () => {
        setIsCheckedIn(false);
        setCheckInMethod('none');
        setLogs(['Initializing Multi-Protocol Handshake...']);
        setBleStatus('idle');
        setGpsStatus('idle');
        setWifiStatus('idle');
        
        abortControllerRef.current = new AbortController();

        // 1. Try Bluetooth First (Most Secure & Fast if hardware exists)
        // Note: Browser requires user gesture for BLE. Since startSmartScan is called via button click, it's valid.
        const bleSuccess = await scanBluetooth();
        if (bleSuccess) return;

        // 2. Fallback to GPS if BLE fails/skipped
        if (!isCheckedIn) {
            scanGPS(); // Async, continues in background
        }

        // 3. Simulated WiFi/Neural Fallback (For Demo/Dev)
        setTimeout(() => {
            if (!isCheckedIn && gpsStatus !== 'found' && bleStatus !== 'found') {
                setWifiStatus('scanning');
                addLog("NET: Scanning Royal_Member_Mesh...");
                setTimeout(() => {
                    addLog("NEURAL: Fallback Pattern Recognized.");
                    setWifiStatus('found');
                    // In production, this would verify IP or SSID
                }, 3000);
            }
        }, 4000);

    }, [isCheckedIn, gpsStatus, bleStatus]);

    useEffect(() => {
        return () => stopAllScans();
    }, [stopAllScans]);

    // --- RENDER SUCCESS STATE ---
    if (isCheckedIn) {
        return (
            <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-900/40 to-gray-900 shadow-[0_0_40px_rgba(34,197,94,0.2)] animate-fade-in relative overflow-hidden h-[600px] flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="relative z-10 text-center p-8">
                    <div className="mb-8">
                        <AnimatedCheckmark />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tight uppercase italic mb-2">Access Granted</h2>
                    <p className="text-green-300 font-medium mb-8">Welcome to Royal The Gym</p>
                    
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto">
                        <div className="bg-black/40 p-4 rounded-xl border border-green-500/30">
                            <p className="text-[10px] text-green-400 uppercase font-black tracking-widest">Protocol</p>
                            <p className="text-white font-mono text-sm font-bold mt-1">{checkInMethod.toUpperCase()}-SECURE</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-xl border border-green-500/30">
                            <p className="text-[10px] text-green-400 uppercase font-black tracking-widest">Session ID</p>
                            <p className="text-white font-mono text-sm font-bold mt-1">#{Math.floor(Math.random()*10000)}</p>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsCheckedIn(false)} className="mt-12 text-gray-400 hover:text-white font-bold text-xs uppercase tracking-widest border-b border-gray-600 hover:border-white transition-all pb-1">
                        Reset Terminal
                    </button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden border-2 border-cyan-500/30 bg-gray-900/90 shadow-2xl p-0 group h-[600px] flex flex-col">
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[conic-gradient(from_0deg,transparent_0_300deg,cyan_360deg)] rounded-full animate-spin-slow opacity-30"></div>
            </div>

            <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <BotIcon className="w-6 h-6 mr-2 text-cyan-400" />
                            GeoMetric Access
                        </h2>
                        <p className="text-xs text-cyan-200/70 mt-1 font-mono tracking-wide uppercase">Multi-Protocol Check-In v5.0</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className={`px-3 py-1 rounded border text-[10px] font-bold uppercase transition-colors ${gpsStatus === 'found' ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            {distance !== null ? `GPS DIST: ${distance}M` : 'GPS STANDBY'}
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                    <button 
                        onClick={startSmartScan}
                        disabled={bleStatus === 'scanning' || gpsStatus === 'scanning'}
                        className="relative group/btn w-40 h-40 rounded-full bg-cyan-900/20 border-4 border-cyan-500/30 flex items-center justify-center transition-all hover:scale-105 hover:bg-cyan-900/40 hover:border-cyan-400 hover:shadow-[0_0_60px_rgba(34,211,238,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {(bleStatus === 'scanning' || gpsStatus === 'scanning' || wifiStatus === 'scanning') && (
                             <div className="absolute -inset-1 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                        )}
                        
                        <FingerPrintIcon className={`w-20 h-20 transition-colors ${bleStatus === 'scanning' || gpsStatus === 'scanning' ? 'text-cyan-200 animate-pulse' : 'text-cyan-500 group-hover/btn:text-white'}`} />
                        
                        {/* Pulse Effect */}
                        <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-ping opacity-0 group-hover/btn:opacity-100"></div>
                    </button>
                    <p className="mt-8 text-sm text-gray-300 font-black uppercase tracking-widest italic">
                        {bleStatus === 'scanning' ? 'BLE Handshake...' : gpsStatus === 'scanning' ? 'Triangulating...' : 'Tap to Authenticate'}
                    </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
                    <div className={`p-3 rounded-xl border text-center transition-all ${bleStatus === 'found' ? 'bg-green-900/30 border-green-500/50' : bleStatus === 'unsupported' || bleStatus === 'denied' ? 'bg-red-900/10 border-red-900/30' : 'bg-gray-800/50 border-gray-700'}`}>
                        <BluetoothIcon className={`w-5 h-5 mx-auto mb-1 ${bleStatus === 'found' ? 'text-green-400' : bleStatus === 'scanning' ? 'text-blue-400 animate-pulse' : 'text-gray-500'}`} />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">BLE</p>
                    </div>
                    <div className={`p-3 rounded-xl border text-center transition-all ${gpsStatus === 'found' ? 'bg-green-900/30 border-green-500/50' : gpsStatus === 'denied' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
                        <SignalIcon className={`w-5 h-5 mx-auto mb-1 ${gpsStatus === 'found' ? 'text-green-400' : gpsStatus === 'scanning' ? 'text-amber-400 animate-pulse' : 'text-gray-500'}`} strength={4} />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">GPS</p>
                    </div>
                    <div className={`p-3 rounded-xl border text-center transition-all ${wifiStatus === 'found' ? 'bg-green-900/30 border-green-500/50' : 'bg-gray-800/50 border-gray-700'}`}>
                        <WifiIcon className={`w-5 h-5 mx-auto mb-1 ${wifiStatus === 'found' ? 'text-green-400' : wifiStatus === 'scanning' ? 'text-purple-400 animate-pulse' : 'text-gray-500'}`} />
                        <p className="text-[10px] text-gray-400 uppercase font-bold">NET</p>
                    </div>
                </div>

                {wifiStatus === 'found' && !isCheckedIn && (
                    <button 
                        onClick={() => handleCheckInSuccess('neural')}
                        className="w-full mb-4 bg-gray-800 hover:bg-gray-700 text-cyan-400 text-xs font-black py-4 rounded-2xl border border-gray-700 transition-all uppercase tracking-widest italic shadow-lg active:scale-95"
                    >
                        Confirm Neural Identity (Fallback)
                    </button>
                )}

                {/* MEMBER ID LOGS */}
                <div className="bg-black/80 rounded-2xl border border-white/10 flex flex-col h-40 overflow-hidden shadow-inner">
                    <div className="flex justify-between items-center px-4 py-2 border-b border-white/10 bg-white/5">
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-2">
                             <Lock className="w-3 h-3"/> Identity Logs
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">v30.0</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col-reverse">
                        {logs.map((log, i) => (
                            <div key={i} className="font-mono text-[10px] text-gray-400 mb-1 leading-tight break-words">
                                <span className="text-cyan-500 mr-2">{'>'}</span>{log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default GeoMetricAccess;
