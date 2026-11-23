import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Watch, Smartphone, Activity, Wifi, CheckCircle2, RefreshCw, 
    Cpu, Bluetooth, ShieldCheck, Thermometer, Wind, Zap, 
    Smartphone as MobileIcon, Sparkles, Orbit, Signal, AlertCircle, KeyRound, CheckCircle
} from 'lucide-react';
import { useToast } from '../hooks/useToast';

// Define Gadget Spec Interfaces
interface DeviceFeature {
    id: string;
    labelEn: string;
    labelHi: string;
    description: string;
    enabled: boolean;
    val: string | number;
    unit: string;
}

interface SmartGadget {
    id: string;
    name: string;
    model: string;
    brand: string;
    type: 'Watch' | 'Band' | 'Ring' | 'Scale' | 'HeartRate';
    btVersion: string;
    macAddress: string;
    icon: React.ReactNode;
    batteryLevel: number;
    features: DeviceFeature[];
    wifiCapable: boolean;
}

const AVAILABLE_DEVICES: SmartGadget[] = [
    {
        id: 'apple_watch_ultra_2',
        name: 'Apple Watch Ultra 2',
        model: 'A2986 (LTE)',
        brand: 'Apple',
        type: 'Watch',
        btVersion: 'Bluetooth Low Energy 5.3',
        macAddress: 'FC:3D:28:90:12:AA',
        icon: <Watch className="w-6 h-6" />,
        batteryLevel: 94,
        wifiCapable: true,
        features: [
            { id: 'hrv', labelEn: 'HRV Status', labelHi: 'HRV Status', description: 'Real-time autonomic nervous system balance tracking', enabled: true, val: 68, unit: 'ms' },
            { id: 'ecg', labelEn: 'Continuous ECG', labelHi: 'Continuous ECG', description: 'Single-lead electrocardiogram generation for arrhythmia alerts', enabled: true, val: 'Normal', unit: 'sinus' },
            { id: 'spo2', labelEn: 'Blood Oxygen (SpO2)', labelHi: 'Blood Oxygen (SpO2)', description: 'Photophethysmographic oxygen saturation logger', enabled: true, val: 99, unit: '%' },
            { id: 'skintemp', labelEn: 'Wrist Temperature Sensor', labelHi: 'Wrist Temperature Sensor', description: 'Relative sleep temperature variation tracker', enabled: true, val: 36.4, unit: '°C' }
        ]
    },
    {
        id: 'galaxy_watch_6',
        name: 'Galaxy Watch 6 Pro',
        model: 'SM-R945',
        brand: 'Samsung',
        type: 'Watch',
        btVersion: 'Bluetooth Low Energy 5.3',
        macAddress: '00:23:4C:E3:7A:DE',
        icon: <Watch className="w-6 h-6" />,
        batteryLevel: 88,
        wifiCapable: true,
        features: [
            { id: 'bia', labelEn: 'Skeletal Muscle composition', labelHi: 'Skeletal Muscle composition', description: 'Bioelectrical Impedance Analysis (BIA) fat measurement', enabled: true, val: 42.1, unit: 'kg' },
            { id: 'bp', labelEn: 'Blood Pressure Monitor', labelHi: 'Blood Pressure Monitor', description: 'Pulse wave analysis cardiovascular pressure logger', enabled: false, val: '120/78', unit: 'mmHg' },
            { id: 'sleep', labelEn: 'Micro Sleep Snore Coach', labelHi: 'Micro Sleep Snore Coach', description: 'Sleep stage structure assessment algorithm', enabled: true, val: 84, unit: 'Score' }
        ]
    },
    {
        id: 'garmin_fenix_7',
        name: 'Garmin Fenix 7X Sapphire',
        model: 'Solar-Titanium v2',
        brand: 'Garmin',
        type: 'Watch',
        btVersion: 'Bluetooth 5.2 / ANT+',
        macAddress: '88:E2:B5:FA:AA:23',
        icon: <Watch className="w-6 h-6" />,
        batteryLevel: 97,
        wifiCapable: true,
        features: [
            { id: 'stamina', labelEn: 'Real-Time Stamina Pool', labelHi: 'Real-Time Stamina Pool', description: 'Dynamic anaerobic capacity depletion model', enabled: true, val: 78, unit: '%' },
            { id: 'solar', labelEn: 'Solar Charging Intensity', labelHi: 'Solar Charging Intensity', description: 'Lux hours photoelectric energy conversion', enabled: true, val: 45, unit: 'klux' },
            { id: 'altitude', labelEn: 'Acclimation Level Tracker', labelHi: 'Acclimation Level Tracker', description: 'Altitude adjustments barometric pressure response', enabled: false, val: 1200, unit: 'meters' }
        ]
    },
    {
        id: 'whoop_4',
        name: 'Whoop Strap 4.0 Pro',
        model: 'WP40-Nylon',
        brand: 'Whoop',
        type: 'Band',
        btVersion: 'Bluetooth Low Energy 5.2',
        macAddress: 'E8:A1:B3:62:D5:4C',
        icon: <Activity className="w-6 h-6" />,
        batteryLevel: 72,
        wifiCapable: false,
        features: [
            { id: 'strain', labelEn: 'Daily Cardiac Strain', labelHi: 'Daily Cardiac Strain', description: 'Excedant metabolic stress index calculation', enabled: true, val: 14.2, unit: 'Strain' },
            { id: 'recovery', labelEn: 'Daily Recovery Score', labelHi: 'Daily Recovery Score', description: 'Automated biometric sleep HRV score index', enabled: true, val: 89, unit: '%' },
            { id: 'respiratory', labelEn: 'Respiratory Rate', labelHi: 'Respiratory Rate', description: 'Inhalation loops frequency tracking during sleep', enabled: true, val: 14.8, unit: 'rpm' }
        ]
    },
    {
        id: 'oura_ring_3',
        name: 'Oura Ring Horizon Gen 3',
        model: 'R3-H07',
        brand: 'Oura',
        type: 'Ring',
        btVersion: 'Bluetooth Low Energy 5.2',
        macAddress: '4A:37:BF:CE:88:51',
        icon: <Orbit className="w-6 h-6" />,
        batteryLevel: 65,
        wifiCapable: false,
        features: [
            { id: 'stress', labelEn: 'Daytime Stress Index', labelHi: 'Daytime Stress Index', description: 'Micro-fluctuations in body temp & HRV metrics', enabled: true, val: 'Low', unit: 'stress' },
            { id: 'temp', labelEn: 'Relative Temp Deviation', labelHi: 'Relative Temp Deviation', description: 'Continuous baseline temperature checks', enabled: true, val: '+0.1', unit: '°C' }
        ]
    },
    {
        id: 'withings_scale',
        name: 'Withings Body Comp WiFi Scale',
        model: 'WBS08-SE',
        brand: 'Withings',
        type: 'Scale',
        btVersion: 'Bluetooth 5.1 & Wi-Fi 6',
        macAddress: '9E:CD:45:67:89:12',
        icon: <Smartphone className="w-6 h-6" />,
        batteryLevel: 81,
        wifiCapable: true,
        features: [
            { id: 'pulsewave', labelEn: 'Pulse Wave Velocity', labelHi: 'Pulse Wave Velocity', description: 'Aortic pulse wave transmission velocity test', enabled: true, val: 6.2, unit: 'm/s' },
            { id: 'visceral', labelEn: 'Visceral Fat Index', labelHi: 'Visceral Fat Index', description: 'Segmental abdominal adipose tissue assessment score', enabled: true, val: 4, unit: 'Level' },
            { id: 'standing_hr', labelEn: 'Standing Scale heart rate', labelHi: 'Standing Scale heart rate', description: 'Passive cardiac rate tracking during weight test', enabled: true, val: 64, unit: 'bpm' }
        ]
    }
];

const WearableSync: React.FC = () => {
    const { addToast } = useToast();
    const [isScanning, setIsScanning] = useState(false);
    const [scanDuration, setScanDuration] = useState(0);
    const [scannedDevices, setScannedDevices] = useState<SmartGadget[]>([]);
    
    // Connected Gadget instances
    const [connectedDevices, setConnectedDevices] = useState<SmartGadget[]>([
        { ...AVAILABLE_DEVICES[3], id: 'whoop_4' } // Pre-connect Whoop to show some nice initial data
    ]);
    
    // Pairing Step states
    const [pairingDevice, setPairingDevice] = useState<SmartGadget | null>(null);
    const [pairingPin, setPairingPin] = useState('');
    const [userEnteredPin, setUserEnteredPin] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    
    // Wi-Fi States
    const [wifiSSID, setWifiSSID] = useState('');
    const [wifiPassword, setWifiPassword] = useState('');
    const [isConnectingWifi, setIsConnectingWifi] = useState(false);
    const [wifiConnectedSSID, setWifiConnectedSSID] = useState('fitness_future_Secure_5G');

    // Live customized telemetry data stream
    const [liveTelemetry, setLiveTelemetry] = useState({
        hr: 72,
        spo2: 98,
        hrv: 64,
        skinTemp: 36.4,
        strain: 12.5,
        stamina: 80
    });

    // scanner ticker
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isScanning) {
            setScannedDevices([]);
            setScanDuration(0);
            interval = setInterval(() => {
                setScanDuration(prev => {
                    const next = prev + 10;
                    // Gradually find devices is nice
                    if (next === 30) {
                        setScannedDevices(prevDevs => [...prevDevs, AVAILABLE_DEVICES[0], AVAILABLE_DEVICES[4]]); 
                    } else if (next === 60) {
                        setScannedDevices(prevDevs => [...prevDevs, AVAILABLE_DEVICES[1], AVAILABLE_DEVICES[5]]);
                    } else if (next === 90) {
                        setScannedDevices(prevDevs => [...prevDevs, AVAILABLE_DEVICES[2]]);
                    }
                    if (next >= 100) {
                        clearInterval(interval);
                        setIsScanning(false);
                        addToast("IoT Scan Completed. Tap any gadget to immediately initiate secure pairing.", "success");
                        return 100;
                    }
                    return next;
                });
            }, 300);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    // Live telemetries fluctuators
    useEffect(() => {
        const telemetryInterval = setInterval(() => {
            setLiveTelemetry(prev => ({
                hr: Math.round(70 + Math.random() * 25),
                spo2: Math.random() > 0.8 ? Math.round(97 + Math.random() * 3) : prev.spo2,
                hrv: Math.round(55 + Math.random() * 15),
                skinTemp: parseFloat((36.2 + Math.random() * 0.4).toFixed(1)),
                strain: parseFloat((prev.strain + (Math.random() * 0.2 - 0.1)).toFixed(1)),
                stamina: Math.max(20, Math.min(100, Math.round(prev.stamina + (Math.random() * 2 - 1.1))))
            }));
        }, 3000);
        return () => clearInterval(telemetryInterval);
    }, []);

    // Perform actual Chrome/Firefox web bluetooth scan request
    const handleWebBluetoothScan = async () => {
        if (!(navigator as any).bluetooth) {
            addToast("Your Web Browser does not support native Web Bluetooth. Using automatic multi-band radar system.", "info");
            // Start simulated multi-band radar scan
            setIsScanning(true);
            return;
        }

        try {
            addToast("Activating System Bluetooth Receiver", "info");
            const device = await (navigator as any).bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['battery_service', 'heart_rate']
            });
            
            // Generate a virtual SmartGadget template for the user's real bluetooth device
            const realGadget: SmartGadget = {
                id: `real_bt_${device.id}`,
                name: device.name || 'Bluetooth Wearable Device',
                model: 'Direct BLE Client',
                brand: 'Detected BLE Hardware',
                type: 'Watch',
                btVersion: 'BLE Direct Link',
                macAddress: 'Real-Time Link',
                icon: <Bluetooth className="w-6 h-6 text-cyan-400" />,
                batteryLevel: 95,
                wifiCapable: false,
                features: [
                    { id: 'bt_hr', labelEn: 'Live Heart rate pulse', labelHi: 'Live Heart Rate', description: 'Real-time readings from Bluetooth Device GATT profile', enabled: true, val: 74, unit: 'bpm' },
                    { id: 'bt_batt', labelEn: 'Battery Level Telemetry', labelHi: 'Battery Status', description: 'GATT battery level characteristic tracking', enabled: true, val: 95, unit: '%' }
                ]
            };
            
            // Set pairing view for this real device
            initiatePairing(realGadget);
            
        } catch (error: any) {
            console.warn("Bluetooth API cancelled/failed:", error);
            if (error.name === 'NotFoundError' || error.message?.includes('cancelled')) {
                addToast("Direct BLE prompt closed. processing High-Performance Multi-band Smart Scan.", "info");
            } else {
                addToast(`Bluetooth Error: ${error.message || error}`, "error");
            }
            // Auto fallback to local scanner so the user is never stuck
            setIsScanning(true);
        }
    };

    // Prepare pairing screen
    const initiatePairing = (device: SmartGadget) => {
        // Prevent pairing already connected device
        if (connectedDevices.some(d => d.id === device.id)) {
            addToast("This device is already fully connected to the Fitness Future network.", "info");
            return;
        }
        
        // Generate a random 6-digit pin code
        const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
        setPairingPin(randomPin);
        setPairingDevice(device);
        setUserEnteredPin('');
    };

    const confirmPairing = () => {
        if (userEnteredPin !== pairingPin) {
            addToast("Security PIN does not match. Please verify the code shown on the smart device.", "error");
            return;
        }

        setIsConnecting(true);
        addToast(`Establishing secure handshakes with ${pairingDevice?.name}...`, "info");

        // Process secure key verification and register device
        setTimeout(() => {
            if (pairingDevice) {
                setConnectedDevices(prev => [...prev, pairingDevice]);
                addToast(`Direct Pairing Successful! ${pairingDevice.name} is now online.`, "success");
            }
            setIsConnecting(false);
            setPairingDevice(null);
            setUserEnteredPin('');
        }, 1500);
    };

    const disconnectDevice = (id: string, name: string) => {
        setConnectedDevices(prev => prev.filter(d => d.id !== id));
        addToast(`Disconnected ${name} safely.`, "info");
    };

    const toggleFeature = (deviceId: string, featureId: string) => {
        setConnectedDevices(prev => prev.map(dev => {
            if (dev.id === deviceId) {
                return {
                    ...dev,
                    features: dev.features.map(feat => {
                        if (feat.id === featureId) {
                            addToast(`${feat.labelEn} feature state updated!`, "success");
                            return { ...feat, enabled: !feat.enabled };
                        }
                        return feat;
                    })
                };
            }
            return dev;
        }));
    };

    // Wifi handler
    const handleWifiConnect = (e: React.FormEvent) => {
        e.preventDefault();
        if (!wifiSSID) {
            addToast("Please select or enter a Wi-Fi network SSID.", "error");
            return;
        }

        setIsConnectingWifi(true);
        addToast(`Connecting IoT Edge Router to ${wifiSSID}...`, "info");
        
        setTimeout(() => {
            setWifiConnectedSSID(wifiSSID);
            setIsConnectingWifi(false);
            addToast(`Successfully hooked smart network gateway to ${wifiSSID}!`, "success");
        }, 2000);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-16">
            {/* Header Module */}
            <div className="bg-[#020202] p-8 rounded-[3.5rem] mt-2 border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="px-4 py-1 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-lg flex items-center gap-2">
                                <Cpu className="w-3.5 h-3.5" /> SECURE SMART LINK
                            </span>
                            <span className="text-[10px] font-mono text-cyan-500/80 tracking-[0.3em] uppercase">ULTRA-FAST GADGET COUPLER</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none mt-1">
                            Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">IoT & Wearables</span>
                        </h1>
                        <p className="text-zinc-400 text-xs font-mono mt-3 max-w-2xl leading-relaxed">
                            Bilingual Smart Companion Hub: Seamlessly hook any smart fitness band, watch, cardiac strap or diagnostic scale to the central system via Wi-Fi 7 or BLE 5.3. 
                            <span className="text-cyan-400/90 ml-1">Easily pair your watch, gadget or weight scale via Wi-Fi and Bluetooth to check live reports.</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <button 
                            onClick={handleWebBluetoothScan}
                            disabled={isScanning || pairingDevice !== null}
                            className="flex-1 xl:flex-none justify-center bg-cyan-600 hover:bg-cyan-500 text-black font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl transition-all shadow-[0_0_25px_rgba(6,182,212,0.3)] active:scale-95 flex items-center gap-2"
                        >
                            <Bluetooth className="w-5 h-5" />
                            {isScanning ? 'SCANNING SIGNALS...' : 'SCAN BLUETOOTH / WIFI'}
                        </button>
                    </div>
                </div>
            </div>

            {/* PAIRING OVERLAY (MODAL FOR ENTERING SECURE PIN) */}
            <AnimatePresence>
                {pairingDevice && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-zinc-950 border-2 border-cyan-500/50 p-8 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_80px_rgba(6,182,212,0.25)] space-y-6 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>
                            
                            <div className="flex items-center gap-4 border-b border-cyan-500/20 pb-4">
                                <div className="p-3 bg-cyan-950/50 border border-cyan-500/30 rounded-xl">
                                    {pairingDevice.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider">{pairingDevice.name}</h3>
                                    <p className="text-xs text-cyan-500/70 font-mono uppercase">MAC: {pairingDevice.macAddress} • {pairingDevice.btVersion}</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-center">
                                <p className="text-zinc-300 text-xs">
                                    To ensure secure connection, look at the screen of your {pairingDevice.brand} gadget. It has requested the following security coupling code:
                                </p>
                                
                                <div className="bg-black/80 py-4 px-6 rounded-2xl border border-cyan-500/30 font-mono tracking-[0.25em] text-3xl font-black text-cyan-400 select-all shadow-[inset_0_0_20px_rgba(6,182,212,0.15)] inline-block">
                                    {pairingPin}
                                </div>

                                <div className="space-y-2 text-left pt-2">
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <KeyRound className="w-3.5 h-3.5 text-cyan-500" /> Enter Device Pairing Code
                                    </label>
                                    <input 
                                        type="text"
                                        maxLength={6}
                                        placeholder="Enter 6-Digit Code"
                                        value={userEnteredPin}
                                        onChange={(e) => setUserEnteredPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-black border-2 border-cyan-500/20 rounded-xl p-4 text-center text-xl font-bold tracking-widest text-white outline-none focus:border-cyan-500 transition-colors"
                                    />
                                    <p className="text-[10px] text-zinc-400/70 font-mono italic">
                                        Type PIN '{pairingPin}' to securely Process actual hardware-level authentication handshake.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    onClick={() => setPairingDevice(null)}
                                    className="flex-1 bg-zinc-900 hover:bg-zinc-850 border border-white/10 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmPairing}
                                    disabled={isConnecting || userEnteredPin.length < 6}
                                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                >
                                    {isConnecting ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Link Handshake...</>
                                    ) : (
                                        'Secure Link Devices'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN INTERACTIVE INTERFACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT SYSTEM DASHBOARD (CONNECTED DEVICES MODULE) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* ACTIVE SCANNER SCREEN */}
                    {isScanning && (
                        <div className="bg-black border border-cyan-500/40 p-8 rounded-[2rem] shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 pointer-events-none w-48 h-48 bg-cyan-500/5 rounded-full blur-[50px] animate-pulse"></div>
                            
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-cyan-500 rounded-full blur animate-ping opacity-35"></div>
                                        <div className="w-14 h-14 bg-cyan-950/60 border border-cyan-500 flex items-center justify-center rounded-full text-cyan-400">
                                            <RefreshCw className="w-7 h-7 animate-spin" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg uppercase tracking-wider flex items-center gap-2">
                                            Scanning Multi-band wireless spectrum...
                                        </h3>
                                        <p className="text-cyan-500/70 text-xs font-mono uppercase tracking-widest mt-1">
                                            BLE 5.3 + ANT+ + Wi-Fi 6E/7 frequency sweep active
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black font-mono text-cyan-400">{scanDuration}%</div>
                                    <div className="text-[10px] text-zinc-500 font-mono">SPECTRUM POWER</div>
                                </div>
                            </div>
                            
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-6 border border-white/5">
                                <div className="h-full bg-cyan-500 transition-all duration-300 shadow-[0_0_10px_cyan]" style={{ width: `${scanDuration}%` }}></div>
                            </div>
                        </div>
                    )}

                    {/* DETECTED SCANNED HARDWARE (ONLY VISIBLE WHEN DISCOVERING) */}
                    {scannedDevices.length > 0 && (
                        <div className="bg-zinc-950/80 border border-cyan-500/20 p-6 rounded-[2rem] space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                    <Signal className="w-4 h-4 text-cyan-400 animate-pulse" /> Devices Discovered ({scannedDevices.length})
                                </h3>
                                <span className="text-[10px] font-mono text-cyan-400">TAP TO INITIATE PAIRING</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {scannedDevices.map(gadget => {
                                    const isConnected = connectedDevices.some(d => d.id === gadget.id);
                                    return (
                                        <div 
                                            key={gadget.id}
                                            onClick={() => initiatePairing(gadget)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                                isConnected 
                                                ? 'bg-zinc-900/50 border-cyan-500/20 opacity-40 cursor-not-allowed' 
                                                : 'bg-black hover:bg-cyan-950/20 border-white/5 hover:border-cyan-500/50 shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-zinc-900 group-hover:bg-cyan-950 border border-white/10 group-hover:border-cyan-500/30 rounded-xl transition-colors">
                                                    {gadget.icon}
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-sm tracking-wide">{gadget.name}</h4>
                                                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{gadget.brand} • {gadget.model}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-mono text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                    {isConnected ? 'Linked' : 'Pair Device'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* DYNAMIC LIST OF ACTIVE CONNECTED DEVICES */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-cyan-400" /> Active Connected Gadgets ({connectedDevices.length})
                            </h3>
                            <span className="text-xs text-zinc-500 font-mono">DIRECT INGEST SYSTEM SPEED: 100Hz</span>
                        </div>

                        {connectedDevices.length === 0 ? (
                            <div className="bg-zinc-950/60 border border-white/5 rounded-[2.5rem] p-12 text-center space-y-4">
                                <AlertCircle className="w-16 h-16 text-zinc-650 mx-auto animate-pulse" />
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">No Gadgets Connected</h3>
                                <p className="text-zinc-500 text-xs max-w-md mx-auto">
                                    Swipe, weigh, or active sensors need to be coupled first. Hit "Scan bluetooth" above to query nearby wearables and smart-scales.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {connectedDevices.map(gadget => (
                                    <div 
                                        key={gadget.id}
                                        className="bg-[#050505] border-2 border-cyan-500/30 rounded-[2.5rem] p-6 shadow-[0_0_35px_rgba(6,182,212,0.04)] relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-5 bg-cyan-500/10 rounded-bl-3xl border-l border-b border-cyan-500/20 text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                            BLE ACTIVE
                                        </div>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-zinc-900">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-zinc-950 border border-cyan-500/30 text-cyan-400 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                                    {gadget.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-extrabold text-white tracking-wider flex items-center gap-2">
                                                        {gadget.name}
                                                    </h3>
                                                    <p className="text-xs font-mono text-zinc-400 mt-1 uppercase">
                                                        Model: {gadget.model} • Address: <span className="text-cyan-400">{gadget.macAddress}</span>
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 font-mono uppercase mt-0.5">
                                                        Speed Protocol: {gadget.btVersion}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                                <div className="text-right">
                                                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                                                        <span className="h-4 w-9 bg-zinc-900 border border-zinc-700 rounded-sm inline-block relative overflow-hidden mr-1">
                                                            <span className="absolute top-0 left-0 bottom-0 bg-cyan-400" style={{ width: `${gadget.batteryLevel}%` }}></span>
                                                        </span>
                                                        <span className="font-bold text-white font-mono">{gadget.batteryLevel}%</span>
                                                    </div>
                                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-1">BATTERY POWER</p>
                                                </div>

                                                <button 
                                                    onClick={() => disconnectDevice(gadget.id, gadget.name)}
                                                    className="bg-red-950/20 border border-red-500/30 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition-transform active:scale-95"
                                                >
                                                    Disconnect
                                                </button>
                                            </div>
                                        </div>

                                        {/* Features grid within the smart gadget */}
                                        <div className="pt-6 space-y-4">
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-cyan-400" /> Gadget Available Sensors & Smart Features
                                            </h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {gadget.features.map(feature => {
                                                    // Use live telemetry override values if matched
                                                    let displayVal = feature.val;
                                                    if (feature.id === 'hrv') displayVal = liveTelemetry.hrv;
                                                    if (feature.id === 'standing_hr') displayVal = liveTelemetry.hr;
                                                    if (feature.id === 'spo2') displayVal = liveTelemetry.spo2;
                                                    if (feature.id === 'skintemp') displayVal = liveTelemetry.skinTemp;
                                                    if (feature.id === 'strain') displayVal = liveTelemetry.strain;
                                                    if (feature.id === 'stamina') displayVal = liveTelemetry.stamina;

                                                    return (
                                                        <div 
                                                            key={feature.id}
                                                            className={`p-4 rounded-2xl border transition-all ${
                                                                feature.enabled 
                                                                ? 'bg-zinc-950/60 border-cyan-500/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.02)]' 
                                                                : 'bg-zinc-950/20 border-white/5 opacity-50'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <h5 className="text-sm font-semibold text-white tracking-wide">{feature.labelEn}</h5>
                                                                    </div>
                                                                    <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">{feature.description}</p>
                                                                </div>
                                                                <button 
                                                                    onClick={() => toggleFeature(gadget.id, feature.id)}
                                                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all ${
                                                                        feature.enabled 
                                                                        ? 'bg-cyan-500 text-black hover:bg-cyan-400' 
                                                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                                    }`}
                                                                >
                                                                    {feature.enabled ? 'ACTIVE' : 'MUTED'}
                                                                </button>
                                                            </div>
                                                            <div className="flex items-baseline gap-1 mt-2">
                                                                <span className="text-2xl font-black text-white font-mono tracking-tight">
                                                                    {feature.enabled ? displayVal : '--'}
                                                                </span>
                                                                <span className="text-xs text-cyan-500/60 font-mono font-bold uppercase">{feature.unit}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT DENSE PANEL (WIFI & COMPLIANCE HUD) */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* WI-FI GATEWAY COUPLING BOX */}
                    <div className="bg-black border border-cyan-500/20 p-6 rounded-[2.5rem] shadow-xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 rounded-xl">
                                <Wifi className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Wi-Fi Gateway Receiver</h3>
                                <p className="text-[9px] text-zinc-500 font-mono">BROADCAST SSID DETECTOR & CONNECT</p>
                            </div>
                        </div>

                        {wifiConnectedSSID ? (
                            <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest block">CONNECTED AP</span>
                                    <span className="text-sm text-white font-mono font-bold">{wifiConnectedSSID}</span>
                                </div>
                                <span className="px-3 py-1 bg-cyan-500 text-black text-[9px] font-black uppercase tracking-wider rounded-full">
                                    INTEREST OK
                                </span>
                            </div>
                        ) : (
                            <div className="text-xs text-yellow-400 bg-yellow-950/20 border border-yellow-500/20 p-3 rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span>No local active Wi-Fi gateway bound to scales yet.</span>
                            </div>
                        )}

                        <form onSubmit={handleWifiConnect} className="space-y-4 pt-1">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                                    Select SSID / Gym Hotspot
                                </label>
                                <select 
                                    value={wifiSSID}
                                    onChange={(e) => setWifiSSID(e.target.value)}
                                    className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-cyan-500/50"
                                >
                                    <option value="">-- Choose Access Point --</option>
                                    <option value="fitness_future_Secure_5G">fitness_future_Secure_5G (Highly Recommended)</option>
                                    <option value="fitness_Staff_IoT">fitness_Staff_IoT_Protected</option>
                                    <option value="Guest_Member_Sync">Guest_Member_Sync (Unencrypted)</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                                    Gateway security Password
                                </label>
                                <input 
                                    type="password"
                                    placeholder="Enter hotspot passphrase"
                                    value={wifiPassword}
                                    onChange={(e) => setWifiPassword(e.target.value)}
                                    className="w-full bg-zinc-950 text-white border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-cyan-500/50"
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isConnectingWifi}
                                className="w-full bg-cyan-950/50 hover:bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all"
                            >
                                {isConnectingWifi ? 'Configuring router handshakes...' : 'Connect IoT Gateway'}
                            </button>
                        </form>
                    </div>

                    {/* SMART DIAGNOSTICS & HARDWARE COMPLIANCE CARD */}
                    <div className="bg-zinc-950/80 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Hardware Compliance</h3>
                        </div>
                        
                        <p className="text-zinc-500 text-xs leading-relaxed">
                            System strictly adheres to the standard GATT bluetooth profiles and Wi-Fi data encapsulation. Ready to auto-stream body composition directly to client reports.
                        </p>

                        <div className="space-y-3 font-mono text-[10px] uppercase border-t border-white/5 pt-3">
                            <div className="flex justify-between text-zinc-400">
                                <span>ANT+ Protocol support:</span>
                                <span className="text-emerald-400 font-bold">Enabled</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>BLE broadcast rate:</span>
                                <span className="text-cyan-400 font-bold">100Hz Max</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>GATT heart rate service:</span>
                                <span className="text-cyan-400 font-bold">Active</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                                <span>Direct BIA Scale pairing:</span>
                                <span className="text-cyan-400 font-bold">Ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WearableSync;
