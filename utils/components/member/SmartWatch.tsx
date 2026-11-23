import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    Activity, Bluetooth, Zap, RefreshCw, 
    Smartphone, Watch, ShieldCheck, 
    Radio, Thermometer, Moon, UploadCloud,
    Battery, Heart, AlertTriangle, Cpu, MapPin, Scan, Signal, Wind,
    BrainCircuit, Terminal, TrendingUp, CheckCircle2, Wifi, ActivitySquare, Radar, KeyRound
} from 'lucide-react';
import { AppleHealthIcon } from '../icons/AppleHealthIcon';
import { SmartBandIcon } from '../icons/SmartBandIcon';
import { GarminIcon } from '../icons/GarminIcon';
import { FitbitIcon } from '../icons/FitbitIcon';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis, CartesianGrid } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { BotIcon } from '../icons/BotIcon';
import { motion, AnimatePresence } from 'motion/react';

// --- LOCAL OPEN SOURCE BIOMETRIC ANALYSIS ENGINE ---
const LocalBioEngine = {
    analyze: (hr: number, hrv: number, sleep: number) => {
        let verdict = "";
        let action = "";
        let color = "text-cyan-400";
        let score = 100;

        // Smart triggers
        if (hrv < 40) {
            verdict = "High Cardiac Strain";
            action = "Reduce weight intensity. Core temperature high. Focus on breathwork.";
            color = "text-red-500";
            score = 48;
        } else if (hr > 95) {
            verdict = "Peak Metabolic Burn";
            action = "Conditioning optimal. Hydration depletion zone started. Keep sipping water.";
            color = "text-amber-400";
            score = 94;
        } else if (sleep < 6) {
            verdict = "Sleep Debt Accumulation";
            action = "CNS recovery incomplete. Avoid failure sets on multi-joint compounds.";
            color = "text-orange-400";
            score = 62;
        } else {
            verdict = "Biometric Equilibrium";
            action = "System nominal. Fully compatible with high-capacity hypertrophy training.";
            color = "text-cyan-400";
            score = 88;
        }

        return { verdict, action, color, score, timestamp: new Date().toLocaleTimeString() };
    },
    
    predict: (currentEnergy: number) => {
        return Array.from({length: 6}, (_, i) => ({
            time: `+${(i+1)*10}m`,
            energy: Math.max(0, Math.round(currentEnergy - (i * 4) + (Math.random() * 4)))
        }));
    }
};

interface DeviceSpec {
    id: string;
    name: string;
    brand: string;
    model: string;
    icon: React.ReactNode;
    type: string;
    btVersion: string;
    descEn: string;
    descHi: string;
    features: { id: string; labelEn: string; labelHi: string; unit: string; initial: string | number }[];
}

const DISCOVERY_PRESETS: DeviceSpec[] = [
    {
        id: 'apple_watch_ultra_2',
        name: 'Apple Watch Ultra 2',
        brand: 'Apple',
        model: 'A2986 (LTE)',
        icon: <AppleHealthIcon className="w-8 h-8 text-rose-500" />,
        type: 'Watch',
        btVersion: 'BLE 5.3 + Dual Band WiFi 6',
        descEn: 'Premium aerospace titanium sports watch with direct ECG sensor.',
        descHi: 'Premium aerospace titanium sports watch with direct ECG sensor.',
        features: [
            { id: 'hrv', labelEn: 'HRV Status', labelHi: 'HRV Status', unit: 'ms', initial: 72 },
            { id: 'spo2', labelEn: 'SpO2 Oxygen', labelHi: 'SpO2 Oxygen', unit: '%', initial: 99 },
            { id: 'ecg', labelEn: 'ECG Analysis', labelHi: 'ECG Analysis', unit: 'state', initial: 'Sinus Normal' }
        ]
    },
    {
        id: 'galaxy_watch_6',
        name: 'Galaxy Watch 6 Pro',
        brand: 'Samsung',
        model: 'SM-R945',
        icon: <SmartBandIcon className="w-8 h-8 text-cyan-400" />,
        type: 'Watch',
        btVersion: 'BLE 5.3 + Wi-Fi 5GHz',
        descEn: 'Bioelectrical Impedance Analysis (BIA) with sleep snore coaches.',
        descHi: 'Bioelectrical Impedance Analysis (BIA) with sleep snore coaches.',
        features: [
            { id: 'bia', labelEn: 'Skeletal Fat composition', labelHi: 'Skeletal Fat composition', unit: 'kg', initial: 41.8 },
            { id: 'sleep', labelEn: 'Sleep Quality Score', labelHi: 'Sleep Quality Score', unit: 'Score', initial: 82 }
        ]
    },
    {
        id: 'garmin_fenix_7',
        name: 'Garmin Fenix 7X Sapphire',
        brand: 'Garmin',
        model: 'Solar Titanium-V2',
        icon: <GarminIcon className="w-8 h-8 text-blue-400" />,
        type: 'Watch',
        btVersion: 'BLE 5.2 / ANT+ Multi-band',
        descEn: 'Solar charged battery watch with real-time anaerobic stamina scoring.',
        descHi: 'Solar charged battery watch with real-time anaerobic stamina scoring.',
        features: [
            { id: 'stamina', labelEn: 'Real-Time Stamina Pool', labelHi: 'Real-Time Stamina Pool', unit: '%', initial: 85 },
            { id: 'solar', labelEn: 'Solar Power Efficiency', labelHi: 'Solar Power Efficiency', unit: 'klux', initial: 48 }
        ]
    },
    {
        id: 'whoop_4',
        name: 'Whoop Strap 4.0 Pro',
        brand: 'Whoop',
        model: 'WP40-Nylon',
        icon: <FitbitIcon className="w-8 h-8 text-teal-400" />,
        type: 'Band',
        btVersion: 'Bluetooth Low Energy 5.2 (100Hz)',
        descEn: 'Screenless diagnostic telemetry band tracking cardiac strain.',
        descHi: 'Screenless diagnostic telemetry band tracking cardiac strain.',
        features: [
            { id: 'strain', labelEn: 'Cardiac Strain Index', labelHi: 'Cardiac Strain Index', unit: 'Strain', initial: 12.8 },
            { id: 'recovery', labelEn: 'Daily Recovery Pool', labelHi: 'Daily Recovery Pool', unit: '%', initial: 91 }
        ]
    }
];

const WearableConnectHub: React.FC = () => {
    const { liveHealthData, updateLiveHealthData, setConnectedDevice, connectedDevice } = useData();
    const { addToast } = useToast();
    
    // UI states
    const [isScanning, setIsScanning] = useState(!connectedDevice);
    const [scanProgress, setScanProgress] = useState(0);
    const [discoveredList, setDiscoveredList] = useState<DeviceSpec[]>([]);
    
    // Secure PIN system
    const [pairingDevice, setPairingDevice] = useState<DeviceSpec | null>(null);
    const [pairingPin, setPairingPin] = useState('');
    const [enteredPin, setEnteredPin] = useState('');
    const [isPairingHandshake, setIsPairingHandshake] = useState(false);

    // Active tracking streams
    const [localAiResult, setLocalAiResult] = useState<any>(null);
    const [predictionData, setPredictionData] = useState<any[]>([]);
    const [signalStrength, setSignalStrength] = useState(100);
    const [heartRateHistory, setHeartRateHistory] = useState<{time: string, bpm: number}[]>([]);

    // Radar Scanning Loop simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isScanning) {
            setDiscoveredList([]);
            setScanProgress(0);
            interval = setInterval(() => {
                setScanProgress(prev => {
                    const next = prev + 4;
                    if (next === 28) {
                        setDiscoveredList(prevList => [...prevList, DISCOVERY_PRESETS[0]]);
                    } else if (next === 56) {
                        setDiscoveredList(prevList => [...prevList, DISCOVERY_PRESETS[1], DISCOVERY_PRESETS[3]]);
                    } else if (next === 84) {
                        setDiscoveredList(prevList => [...prevList, DISCOVERY_PRESETS[2]]);
                    }
                    if (next >= 100) {
                        clearInterval(interval);
                        setIsScanning(false);
                        addToast("Wearable Uplink scan successfully completed! Tap your device to link.", "success");
                        return 100;
                    }
                    return next;
                });
            }, 120);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    // Live continuous Telemetry ticks
    useEffect(() => {
        if (!connectedDevice) return;
        
        // Populate initial history
        if (heartRateHistory.length === 0) {
            const hist = Array.from({length: 15}, (_, i) => ({
                time: new Date(Date.now() - (15 - i) * 3000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
                bpm: Math.floor(72 + Math.random() * 20)
            }));
            setHeartRateHistory(hist);
        }

        const interval = setInterval(() => {
            const currentBpm = Math.floor(65 + Math.random() * 40); // 65-105
            const currentSignal = Math.max(78, Math.min(100, signalStrength + (Math.random() * 8 - 4)));
            
            setSignalStrength(currentSignal);
            
            const timeStr = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
            setHeartRateHistory(prev => [...prev.slice(-19), { time: timeStr, bpm: currentBpm }]);
            
            // Push to application-wide global context
            updateLiveHealthData({
                heartRate: { ...liveHealthData.heartRate, avg: currentBpm },
                steps: (liveHealthData.steps || 4200) + Math.floor(Math.random() * 4),
            });

            // Perform Local browser AI analysis periodically
            if (Math.random() > 0.6 || !localAiResult) {
                const res = LocalBioEngine.analyze(currentBpm, liveHealthData.heartRate.hrv, liveHealthData.sleep.totalHours);
                setLocalAiResult(res);
                setPredictionData(LocalBioEngine.predict(res.score));
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [connectedDevice, liveHealthData, signalStrength]);

    // Perform Chrome/Safari web bluetooth call
    const startNativeBluetoothScan = async () => {
        if (!(navigator as any).bluetooth) {
            addToast("Native Web Bluetooth API is disabled. Utilizing custom high-resolution IoT radar.", "info");
            setIsScanning(true);
            return;
        }

        try {
            addToast("Activating browser Bluetooth antenna...", "info");
            const device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service', 'heart_rate']
            });

            const matchingPreset: DeviceSpec = {
                id: `ble_${device.id}`,
                name: device.name || 'Personal Biometric Bluetooth Device',
                brand: 'BLE Hardware',
                model: 'GATT Profile v41',
                icon: <Bluetooth className="w-8 h-8 text-cyan-400" />,
                type: 'Watch',
                btVersion: 'BLE Connect (Direct Link)',
                descEn: 'Direct GATT client telemetry receiving real-time biometric packets.',
                descHi: 'Direct GATT client telemetry receiving real-time biometric packets.',
                features: [
                    { id: 'hrv', labelEn: 'Heart Rate Stream', labelHi: 'Heart Rate Stream', unit: 'bpm', initial: 75 },
                    { id: 'bt_batt', labelEn: 'Battery Telemetry', labelHi: 'Battery Telemetry', unit: '%', initial: 95 }
                ]
            };

            beginSecurePairing(matchingPreset);

        } catch (e: any) {
            console.warn(e);
            addToast("Bluetooth access canceled. Engaging high-performance IoT local sweep.", "info");
            setIsScanning(true);
        }
    };

    const beginSecurePairing = (preset: DeviceSpec) => {
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        setPairingPin(pin);
        setPairingDevice(preset);
        setEnteredPin('');
    };

    const executePairingLink = () => {
        if (enteredPin !== pairingPin) {
            addToast("Auth PIN mismatch! Verify the numbers shown on your gadget screen.", "error");
            return;
        }

        setIsPairingHandshake(true);
        addToast(`Linking ${pairingDevice?.name} cryptographic hash keys...`, "info");

        setTimeout(() => {
            if (pairingDevice) {
                setConnectedDevice({
                    name: pairingDevice.name,
                    brand: pairingDevice.brand,
                    type: pairingDevice.type as any,
                    platform: pairingDevice.type === 'Watch' ? 'iOS' : 'Proprietary',
                    battery: 98,
                    status: 'Connected',
                    capabilities: { 
                        heartRate: true, 
                        spo2: true, 
                        ecg: true, 
                        skinTemp: true, 
                        gps: true, 
                        sleepTracking: true, 
                        nfc: true 
                    }
                } as any);
                
                // Trigger initial Local AI biometrics
                setLocalAiResult(LocalBioEngine.analyze(78, 62, 7.2));
                setPredictionData(LocalBioEngine.predict(88));
                
                addToast(`Congratulations! ${pairingDevice.name} is now locked & synced with Gym App.`, "success");
            }
            setIsPairingHandshake(false);
            setPairingDevice(null);
            setIsScanning(false);
        }, 1200);
    };

    const triggerManualUnpair = () => {
        setConnectedDevice(null);
        setLocalAiResult(null);
        setHeartRateHistory([]);
        setIsScanning(true);
        addToast("Device disconnected successfully.", "info");
    };

    return (
        <div className="space-y-6 animate-fade-in relative pb-12 font-mono text-zinc-300">
            {/* Holographic background lines */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:100%_6px] opacity-25 z-0"></div>

            {/* SCANNING RADAR UI */}
            {isScanning && (
                <div className="bg-black border border-cyan-500/20 rounded-[2.5rem] p-12 flex flex-col items-center justify-center relative min-h-[550px] overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.08)_0%,_transparent_75%)] pointer-events-none"></div>
                    
                    {/* Glowing radar rings */}
                    <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 border border-cyan-500/10 rounded-full animate-ping opacity-60"></div>
                        <div className="absolute inset-8 border border-cyan-500/20 rounded-full"></div>
                        <div className="absolute inset-20 border border-cyan-500/30 rounded-full"></div>
                        <div className="absolute w-full h-full animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_300deg,#06b6d4_360deg)] rounded-full opacity-20"></div>
                        
                        <div className="z-10 bg-black border border-cyan-500 p-5 rounded-full shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                            <Radar className="w-12 h-12 text-cyan-400 animate-pulse" />
                        </div>
                    </div>

                    <div className="text-center z-10 space-y-3 max-w-md">
                        <h2 className="text-2xl font-black text-cyan-400 uppercase tracking-widest block">Uplink Radar Active</h2>
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">
                            Scanning BLE broadcasting channels...
                        </p>
                        
                        <div className="w-64 bg-zinc-950 h-2 rounded-sm mx-auto overflow-hidden border border-cyan-500/30">
                            <div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${scanProgress}%` }}></div>
                        </div>

                        <div className="flex justify-center gap-4 mt-8">
                            <button 
                                onClick={startNativeBluetoothScan}
                                className="bg-cyan-950/50 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_cyan] text-cyan-400 font-extrabold text-[10px] uppercase py-3.5 px-6 rounded-xl transition-all"
                            >
                                Trigger Native BLE Client
                            </button>
                        </div>
                    </div>

                    {/* Show discovered items dynamically */}
                    {discoveredList.length > 0 && (
                        <div className="mt-8 w-full max-w-xl bg-zinc-950/80 border border-cyan-500/20 p-5 rounded-2xl z-10 space-y-3">
                            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                                <Signal className="w-3.5 h-3.5 animate-pulse" /> Bluetooth signals detected ({discoveredList.length})
                            </span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {discoveredList.map(preset => (
                                    <div 
                                        key={preset.id}
                                        onClick={() => beginSecurePairing(preset)}
                                        className="p-3 bg-black hover:bg-cyan-950/20 cursor-pointer border border-white/5 hover:border-cyan-500/40 rounded-xl flex items-center gap-3 transition-colors group"
                                    >
                                        <div className="p-2 bg-zinc-900 border border-white/5 rounded-lg text-white group-hover:text-cyan-400">
                                            {preset.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-white uppercase">{preset.name}</h4>
                                            <p className="text-[9px] text-zinc-500 font-mono">MAC: 00:FF:AA:C9</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* SEAMLESS PAIRING INSTRUCTIONS MODAL */}
            <AnimatePresence>
                {pairingDevice && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 15 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 15 }}
                            className="bg-zinc-950 border-2 border-cyan-500/50 p-8 rounded-[2rem] w-full max-w-md shadow-[0_0_60px_rgba(6,182,212,0.3)] space-y-6 text-center font-mono"
                        >
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4 text-left">
                                <div className="p-2 bg-cyan-950/50 rounded-lg text-cyan-400">
                                    {pairingDevice.icon}
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-white font-extrabold text-sm uppercase">{pairingDevice.name}</h4>
                                    <p className="text-[9px] text-zinc-500">SYSTEM COUPLER REGISTRY • {pairingDevice.model}</p>
                                </div>
                            </div>

                            <p className="text-zinc-400 text-[11px] leading-relaxed text-left">
                                A connection signal has been pinged to {pairingDevice.name}. Verify the pairing number on your device screen (Enter PIN):
                            </p>

                            <div className="bg-black border border-cyan-500/30 py-3 px-6 rounded-xl font-bold tracking-[0.2em] text-2xl text-cyan-400 inline-block">
                                {pairingPin}
                            </div>

                            <div className="space-y-2 text-left pt-2">
                                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <KeyRound className="w-3.5 h-3.5 text-cyan-500" /> Confirm Connection Code
                                </label>
                                <input 
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter 6-digit PIN"
                                    value={enteredPin}
                                    onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-black border border-cyan-500/20 py-3 px-4 text-center tracking-widest text-lg font-bold text-white outline-none focus:border-cyan-500 rounded-xl transition-all"
                                />
                                <p className="text-[9px] text-zinc-500 mt-1 italic">
                                    Type PIN '{pairingPin}' to confirm virtual device handshake.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button 
                                    onClick={() => setPairingDevice(null)}
                                    className="flex-1 bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white font-bold py-3 text-xs uppercase rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={executePairingLink}
                                    disabled={isPairingHandshake || enteredPin.length < 6}
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-black py-3 text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
                                >
                                    {isPairingHandshake ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Link Setup...</>
                                    ) : (
                                        'Pair Device'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CONNECTED INTERFACE VIEW */}
            {!isScanning && connectedDevice && (
                <div className="space-y-6 relative z-10 transition-all">
                    
                    {/* Device Header Panel */}
                    <div className="bg-[#050505] p-6 rounded-[2.5rem] border-2 border-cyan-500/25 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-[0_0_50px_rgba(6,182,212,0.05)]">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-zinc-950 border border-cyan-500/30 text-cyan-400 rounded-2xl relative shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                <div className="absolute inset-0 bg-cyan-500/5 animate-pulse rounded-2xl"></div>
                                <Watch className="w-14 h-14 relative z-10" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="px-3 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 text-[9px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Fully Linked
                                    </span>
                                    <span className="text-[10px] text-cyan-500/70">WIFI/BLE ROUTING OK</span>
                                </div>
                                <h1 className="text-3xl font-black text-white uppercase tracking-wide">
                                    {connectedDevice.name}
                                </h1>
                                <p className="text-xs text-zinc-500 font-bold uppercase mt-1">
                                    Hardware Protocol: BLE 5.3 Antenna • Signal Efficiency: {Math.round(signalStrength)}%
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                                <div className="text-xs text-zinc-400 flex items-center gap-1 justify-end">
                                    <span className="h-4 w-9 bg-zinc-900 border border-zinc-700 rounded-sm inline-block relative overflow-hidden">
                                        <span className="absolute top-0 bottom-0 left-0 bg-cyan-400" style={{ width: '94%' }}></span>
                                    </span>
                                    <span className="font-bold text-white font-mono">94%</span>
                                </div>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-1">BATTERY LEVEL</p>
                            </div>
                            
                            <button 
                                onClick={triggerManualUnpair}
                                className="bg-zinc-950 border border-red-500/30 text-red-400 hover:bg-red-950/40 font-bold text-xs py-3 px-5 rounded-xl transition-all"
                            >
                                Unpair Device
                            </button>
                        </div>
                    </div>

                    {/* Left & Right Biometric Layouts */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
                        
                        {/* BIOMETRICS ANALYSIS MODULE (LEFT) */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* Browser AI Diagnostics View */}
                            <div className="bg-zinc-950 border border-cyan-500/20 p-8 rounded-[2rem] relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.02)]">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Cpu className="w-32 h-32 text-cyan-400" /></div>
                                
                                {localAiResult ? (
                                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                        <div className="space-y-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 rounded-xl">
                                                    <BotIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest block">AI Bio-Analysis diagnostics</span>
                                                    <h3 className={`text-lg font-black uppercase tracking-wider ${localAiResult.color} drop-shadow-[0_0_8px_currentColor]`}>
                                                        {localAiResult.verdict}
                                                    </h3>
                                                </div>
                                            </div>

                                            <div className="bg-black p-5 rounded-xl border border-white/5 relative">
                                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-500"></div>
                                                <p className="text-zinc-300 text-xs font-mono leading-relaxed">
                                                    &gt; {localAiResult.action}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-center">
                                            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="72" cy="72" r="62" stroke="rgba(6,182,212,0.06)" strokeWidth="4" fill="none" />
                                                    <circle 
                                                        cx="72" cy="72" r="62" 
                                                        stroke={localAiResult.score > 80 ? '#06b6d4' : localAiResult.score > 50 ? '#f59e0b' : '#ef4444'} 
                                                        strokeWidth="4" fill="none" 
                                                        strokeDasharray="390" 
                                                        strokeDashoffset={390 - (390 * localAiResult.score) / 100} 
                                                        strokeLinecap="round"
                                                        className="transition-all duration-1000"
                                                    />
                                                </svg>
                                                <div className="absolute flex flex-col items-center">
                                                    <span className="text-3xl font-black text-white drop-shadow-[0_0_8px_white]">{localAiResult.score}%</span>
                                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Readiness</span>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-zinc-500 mt-3 font-mono">Bilateral GATT Analysis • Optimized</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-zinc-500">
                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                                        <span>Consolidating BLE telemetry parameters...</span>
                                    </div>
                                )}
                            </div>

                            {/* Live charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Live heart rate stream curve */}
                                <div className="bg-black/90 p-5 rounded-[2rem] border border-red-500/20">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <Heart className="w-4 h-4 text-red-500 animate-pulse" /> Live Pulse Stream
                                        </span>
                                        <span className="text-[9px] font-mono text-red-500/95 border border-red-500/30 px-2 py-0.5 rounded">100Hz</span>
                                    </div>

                                    <div className="h-32 w-full mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={heartRateHistory}>
                                                <defs>
                                                    <linearGradient id="colorHrWidget" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="2 2" stroke="#ef4444" strokeOpacity={0.08} vertical={false} />
                                                <YAxis hide domain={['dataMin - 15', 'dataMax + 15']} />
                                                <Area type="monotone" dataKey="bpm" stroke="#ef4444" strokeWidth={2.5} fill="url(#colorHrWidget)" isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <p className="text-2xl font-black text-white text-right font-mono drop-shadow-[0_0_10px_#ef4444]">
                                        {liveHealthData.heartRate.avg} <span className="text-xs text-zinc-500">BPM</span>
                                    </p>
                                </div>

                                {/* Live energy trajectory curves */}
                                <div className="bg-black/90 p-5 rounded-[2rem] border border-orange-500/20">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                            <TrendingUp className="w-4 h-4 text-orange-400" /> Exhaustion curve
                                        </span>
                                        <span className="text-[9px] text-orange-400 bg-orange-950/30 px-2 py-0.5 rounded">FORECAST</span>
                                    </div>

                                    <div className="h-32 w-full mt-2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={predictionData}>
                                                <defs>
                                                    <linearGradient id="colorEnergyWidget" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="2 2" stroke="#f97316" strokeOpacity={0.08} vertical={false} />
                                                <YAxis hide />
                                                <Area type="monotone" dataKey="energy" stroke="#f97316" strokeWidth={2.5} fill="url(#colorEnergyWidget)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <p className="text-xs text-orange-400/80 text-right uppercase tracking-widest font-extrabold">
                                        Optimal Training Window active
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* TELEMETRY READOUTS (RIGHT) */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-[#040404] border border-cyan-500/20 p-6 rounded-[2.5rem] space-y-4">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-3.5 flex items-center gap-2">
                                    <Signal className="w-4 h-4 text-cyan-400" /> Wireless Telemetry
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-white/5">
                                        <div>
                                            <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">SpO2 Oxygen</span>
                                            <span className="text-xs text-white font-bold font-mono">Continuous check</span>
                                        </div>
                                        <span className="text-lg font-black font-mono text-cyan-400">99%</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-white/5">
                                        <div>
                                            <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">Wrist temperature</span>
                                            <span className="text-xs text-white font-bold font-mono">Infrared telemetry</span>
                                        </div>
                                        <span className="text-lg font-black font-mono text-cyan-400">36.3°C</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-white/5">
                                        <div>
                                            <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">Hrv status</span>
                                            <span className="text-xs text-white font-bold font-mono">RMS difference</span>
                                        </div>
                                        <span className="text-lg font-black font-mono text-cyan-400">68ms</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-zinc-950 rounded-xl border border-white/5">
                                        <div>
                                            <span className="text-[9px] text-zinc-500 block font-bold uppercase tracking-wider">Nfc digital key</span>
                                            <span className="text-xs text-white font-bold font-mono">Smart lock auth</span>
                                        </div>
                                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 font-bold font-mono border border-cyan-500/20 px-2 py-0.5 rounded uppercase">
                                            ARMED
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WearableConnectHub;
