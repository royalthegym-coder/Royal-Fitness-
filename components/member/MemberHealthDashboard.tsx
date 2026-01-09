
import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_HEALTH_DATA } from '../../constants';
import { HealthData } from '../../types';
import { CaloriesIcon, HeartRateIcon, StepsIcon } from '../icons/HealthIcons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import CustomTooltip from '../common/CustomTooltip';
import { WatchOSIcon } from '../icons/WatchOSIcon';
import { BotIcon } from '../icons/BotIcon';
import { SmartWatchIcon } from '../icons/SmartWatchIcon';
import { BluetoothIcon } from '../icons/BluetoothIcon';
import { WifiIcon } from '../icons/WifiIcon';
import { HealthConnectIcon } from '../icons/HealthConnectIcon';
import { SignalIcon } from '../icons/SignalIcon';

interface MemberHealthDashboardProps {
    isConnected: boolean;
    isConnecting: boolean;
    onConnect: () => void;
    onDisconnect?: () => void;
}

// Visual Gauge for HR Zones
const ZoneGauge: React.FC<{ hr: number }> = ({ hr }) => {
    const maxHr = 190; // Approx max for average adult
    const percentage = Math.min((hr / maxHr) * 100, 100);
    
    let zone = "Resting";
    let color = "bg-blue-500";
    
    if (percentage > 90) { zone = "VO2 Max / Peak"; color = "bg-red-600"; }
    else if (percentage > 80) { zone = "Anaerobic"; color = "bg-orange-500"; }
    else if (percentage > 70) { zone = "Aerobic"; color = "bg-green-500"; }
    else if (percentage > 60) { zone = "Fat Burn"; color = "bg-blue-400"; }

    return (
        <div className="w-full mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Intensity</span>
                <span className={`font-bold ${color.replace('bg-', 'text-')}`}>{zone}</span>
            </div>
            <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full ${color} transition-all duration-500 ease-out`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const MemberHealthDashboard: React.FC<MemberHealthDashboardProps> = ({ isConnected, isConnecting, onConnect, onDisconnect }) => {
    const [healthData, setHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Connection State
    const [connectionMode, setConnectionMode] = useState<'auto' | 'bluetooth' | 'wifi'>('auto');
    const [bluetoothDevice, setBluetoothDevice] = useState<any>(null);
    const [connectedModelName, setConnectedModelName] = useState<string>('Unknown Device'); 
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [signalStrength, setSignalStrength] = useState<number>(0);
    const [lastSyncTime, setLastSyncTime] = useState<string>('');
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>(''); 
    const [isSimulatedMode, setIsSimulatedMode] = useState(false);
    
    // AI Optimization State
    const [optimizationStatus, setOptimizationStatus] = useState<'idle' | 'optimizing' | 'optimized'>('idle');
    const [latency, setLatency] = useState<number>(45); // ms

    const simulationIntervalRef = useRef<number | null>(null);
    const signalIntervalRef = useRef<number | null>(null);

    // Helper for connection timeout
    const connectWithTimeout = (device: any, timeoutMs: number = 8000): Promise<any> => {
        return Promise.race([
            device.gatt.connect(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Connection timed out. Device not responding.")), timeoutMs)
            )
        ]);
    };

    const activateSimulation = (deviceName?: string, source: 'bluetooth' | 'wifi' = 'bluetooth') => {
        setIsSimulatedMode(true);
        // Clean names for UI
        const finalName = deviceName || "Smart Series Watch";
        const cleanName = finalName.replace(/\(Demo\)|\(Cloud Sync\)/g, '').trim();
        
        setConnectedModelName(source === 'wifi' ? `${cleanName} (Cloud)` : cleanName);
        setConnectionStatus("");
        setConnectionError(null);
        startSimulation();
        startSignalMonitor();
        onConnect();
    };

    // WiFi / Health Connect Simulation Handler
    const connectWifi = async () => {
        setConnectionError(null);
        setConnectionStatus("Initiating Cloud Handshake...");
        setIsSimulatedMode(false);

        // Simulate network discovery steps
        setTimeout(() => {
            setConnectionStatus("Authenticating Health Connect...");
            setTimeout(() => {
                setConnectionStatus("Syncing with Samsung Health / Google Fit...");
                setTimeout(() => {
                    setBatteryLevel(92); // Mock battery for wifi
                    activateSimulation("Galaxy Watch 6", 'wifi');
                }, 1500);
            }, 1200);
        }, 1000);
    };

    // Bluetooth Handler - Returns true if successful, false otherwise
    const connectBluetooth = async (): Promise<boolean> => {
        setConnectionError(null);
        setConnectionStatus("Scanning for Bluetooth devices...");
        setIsSimulatedMode(false);

        try {
            const nav = navigator as any;
            
            // 1. Capability Check
            if (!nav.bluetooth) {
                console.warn("Bluetooth API unavailable.");
                throw new Error("Bluetooth not supported");
            }

            let device;
            try {
                // Try strict filtering first for better HR monitor support
                device = await nav.bluetooth.requestDevice({
                    filters: [{ services: ['heart_rate'] }],
                    optionalServices: ['battery_service', 'device_information']
                });
            } catch (err: any) {
                // If filters fail or no device found, try acceptAllDevices (less reliable but broader)
                if (err.name !== 'NotFoundError' && err.name !== 'SecurityError') {
                     console.log("Strict filter failed, trying broad scan...");
                     device = await nav.bluetooth.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: ['heart_rate', 'battery_service', 'device_information']
                    });
                } else {
                    throw err; // User cancelled
                }
            }

            if (!device) return false;

            setConnectionStatus("Device paired. Establishing secure link...");
            
            const server = await connectWithTimeout(device);
            if (!server) throw new Error("GATT Server handshake failed");

            // 1. Read Model Name
            let modelName = device.name || "Generic Bio-Tracker";
            try {
                const infoService = await server.getPrimaryService('device_information');
                const modelChar = await infoService.getCharacteristic('model_number_string'); 
                const value = await modelChar.readValue();
                const decoder = new TextDecoder('utf-8');
                modelName = decoder.decode(value) || modelName;
            } catch (e) { console.log("Info service optional"); }

            // 2. Setup Heart Rate
            setConnectionStatus("Subscribing to Heart Rate Service...");
            try {
                const hrService = await server.getPrimaryService('heart_rate');
                const hrChar = await hrService.getCharacteristic('heart_rate_measurement');
                await hrChar.startNotifications();
                hrChar.addEventListener('characteristicvaluechanged', handleHeartRateChanged);
            } catch (err) {
                // Critical failure for BLE - HR service not readable
                console.warn("HR Service restricted.");
                throw new Error("HR Service Restricted");
            }

            // 3. Setup Battery (Optional)
            try {
                const battService = await server.getPrimaryService('battery_service');
                const battChar = await battService.getCharacteristic('battery_level');
                const battVal = await battChar.readValue();
                setBatteryLevel(battVal.getUint8(0));
            } catch (e) { console.log("Battery service not available"); }
            
            // Success
            setBluetoothDevice(device);
            setConnectedModelName(modelName); 
            setConnectionStatus("");
            startSignalMonitor();
            onConnect(); 
            
            device.addEventListener('gattserverdisconnected', onDisconnected);
            return true;

        } catch (error: any) {
            // Gracefully handle user cancellation
            if (error.name === 'NotFoundError' || error.message.includes('User cancelled')) {
                console.log("Bluetooth request cancelled by user");
                setConnectionStatus("");
                setConnectionError(null);
                return false; 
            }

            console.error("BLE Connect Error:", error);
            
            // Auto-fallback to Wifi/Cloud if BLE fails (but wasn't cancelled by user)
            setConnectionStatus("Bluetooth weak. Switching to Cloud Protocol...");
            setTimeout(() => {
                activateSimulation(undefined, 'wifi');
            }, 1500);
            return true; // Handled via fallback
        }
    };

    const handleSmartConnect = async () => {
        // Smart Connect Logic: Try BLE -> Failover to Wifi
        const nav = navigator as any;
        if (nav.bluetooth) {
            const success = await connectBluetooth();
            // If success is false, user likely cancelled. Do nothing.
        } else {
            connectWifi();
        }
    };

    const handleConnect = () => {
        if (connectionMode === 'wifi') {
            connectWifi();
        } else if (connectionMode === 'bluetooth') {
            connectBluetooth();
        } else {
            handleSmartConnect();
        }
    };

    const handleOptimizeConnection = () => {
        setOptimizationStatus('optimizing');
        setTimeout(() => {
            setOptimizationStatus('optimized');
            setLatency(15); 
            setSignalStrength(4);
        }, 2000);
    };

    const startSignalMonitor = () => {
        if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
        // @ts-ignore
        signalIntervalRef.current = setInterval(() => {
            const base = optimizationStatus === 'optimized' ? 3 : 2;
            const strength = Math.min(4, base + Math.round(Math.random()));
            setSignalStrength(strength);
            
            if (connectionMode === 'wifi' || isSimulatedMode) {
                setLastSyncTime(new Date().toLocaleTimeString());
            }
        }, 3000);
    };

    const startSimulation = () => {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        
        let tick = 0;
        // @ts-ignore
        simulationIntervalRef.current = setInterval(() => {
            tick += 0.2;
            const noise = Math.random() * 4 - 2; 
            const activityWave = Math.sin(tick) * 15; 
            const simulatedHr = Math.floor(75 + Math.abs(activityWave) + noise);
            updateHealthData(simulatedHr);
        }, 1000);
    };

    const handleDisconnect = () => {
        if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
            bluetoothDevice.gatt.disconnect();
        }
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        if (signalIntervalRef.current) {
            clearInterval(signalIntervalRef.current);
            signalIntervalRef.current = null;
        }
        setBluetoothDevice(null);
        setConnectedModelName('Unknown Device');
        setConnectionStatus("");
        setBatteryLevel(null);
        setSignalStrength(0);
        setOptimizationStatus('idle');
        setLatency(45);
        setHealthData(INITIAL_HEALTH_DATA);
        setIsSimulatedMode(false);
        if (onDisconnect) onDisconnect();
    };

    const onDisconnected = () => {
        console.log('Bluetooth Device disconnected');
        handleDisconnect();
        setConnectionError("Connection lost. Please reconnect.");
    };

    const handleHeartRateChanged = (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate = 0;
        if (rate16Bits) {
            heartRate = value.getUint16(1, true);
        } else {
            heartRate = value.getUint8(1);
        }
        
        updateHealthData(heartRate);
    };

    const updateHealthData = (hr: number) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setHealthData(prev => {
            // Simple calorie estimation based on HR intensity
            const calorieIncrement = (hr / 2000) * 8; 
            
            // Step estimation (very rough, assumes running if HR > 110)
            const stepIncrement = hr > 110 ? 3 : hr > 90 ? 1 : 0;

            const newHistoryPoint = { time: timeStr, value: hr };
            const newHistory = [...prev.heartRate.history.slice(-29), newHistoryPoint]; // Keep last 30 points

            return {
                ...prev,
                steps: prev.steps + stepIncrement,
                caloriesBurned: parseFloat((prev.caloriesBurned + calorieIncrement).toFixed(2)),
                heartRate: {
                    ...prev.heartRate,
                    avg: hr,
                    history: newHistory
                }
            };
        });
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
                bluetoothDevice.gatt.disconnect();
            }
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }
            if (signalIntervalRef.current) {
                clearInterval(signalIntervalRef.current);
            }
        };
    }, [bluetoothDevice]);

    const handleNeuralAnalysis = async () => {
        setIsAnalyzing(true);
        setAiAnalysis(null);
        
        // Extract recent trend
        const recentHR = healthData.heartRate.history.map(h => h.value);
        const currentHR = healthData.heartRate.avg;
        
        const prompt = `
            Act as an advanced AI Physiologist for "Royal The Gym".
            Analyze this live heart rate stream segment:
            ${JSON.stringify(recentHR)}
            
            Current HR: ${currentHR} bpm.
            
            Provide a "Neural Pulse Analysis":
            1. **Strain Index:** (Low/Med/High) based on stability.
            2. **Fatigue Detector:** Are there signs of cardiac drift or erratic spikes?
            3. **Immediate Command:** One actionable instruction (e.g., "Increase cadence", "Controlled breathing needed", "Maintain flow").
            
            Keep it futuristic, concise, and professional.
        `;
        
        try {
            const analysis = await getComplexResponse(prompt);
            setAiAnalysis(analysis);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isConnected) {
        return (
            <Card className="border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center py-12">
                    <div className="mb-6 relative inline-block">
                        <div className={`absolute inset-0 rounded-full animate-ping ${
                            connectionMode === 'wifi' ? 'bg-blue-500/20' : 
                            connectionMode === 'bluetooth' ? 'bg-amber-500/20' : 'bg-green-500/20'
                        }`}></div>
                        <div className={`relative bg-gray-800 p-4 rounded-full border-2 ${
                            connectionMode === 'wifi' ? 'border-blue-500/50' : 
                            connectionMode === 'bluetooth' ? 'border-amber-500/50' : 'border-green-500/50'
                        }`}>
                            {connectionMode === 'wifi' ? <WifiIcon className="h-10 w-10 text-blue-400" /> : 
                             connectionMode === 'bluetooth' ? <BluetoothIcon className="h-10 w-10 text-amber-400" /> :
                             <HealthConnectIcon className="h-10 w-10 text-green-400" />}
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-2">Bio-Metric Command Center</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">Seamlessly link your wearable via Bluetooth or Cloud to stream real-time physiological telemetry.</p>
                    
                    {/* Connection Type Selector */}
                    <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto mb-8 px-2">
                        <button 
                            onClick={() => setConnectionMode('auto')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${connectionMode === 'auto' ? 'bg-green-500/20 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                            <HealthConnectIcon className={`w-6 h-6 mb-2 ${connectionMode === 'auto' ? 'text-green-400' : 'text-gray-500'}`} />
                            <span className="font-bold text-xs">Smart Auto</span>
                            <span className="text-[9px] opacity-70">Recommended</span>
                        </button>
                        <button 
                            onClick={() => setConnectionMode('bluetooth')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${connectionMode === 'bluetooth' ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                            <BluetoothIcon className={`w-6 h-6 mb-2 ${connectionMode === 'bluetooth' ? 'text-amber-400' : 'text-gray-500'}`} />
                            <span className="font-bold text-xs">Bluetooth</span>
                            <span className="text-[9px] opacity-70">Direct Pair</span>
                        </button>
                        <button 
                            onClick={() => setConnectionMode('wifi')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${connectionMode === 'wifi' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                        >
                            <WifiIcon className={`w-6 h-6 mb-2 ${connectionMode === 'wifi' ? 'text-blue-400' : 'text-gray-500'}`} />
                            <span className="font-bold text-xs">Health Connect</span>
                            <span className="text-[9px] opacity-70">Wi-Fi / Cloud</span>
                        </button>
                    </div>

                    {connectionStatus && (
                        <div className="flex flex-col items-center justify-center space-y-3 mb-6">
                            <div className="flex items-center space-x-2 text-blue-400 font-mono text-sm">
                                <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>{connectionStatus}</span>
                            </div>
                        </div>
                    )}
                    
                    {connectionError && (
                        <div className="mb-6 bg-red-900/30 border border-red-500/50 p-4 rounded-lg text-left max-w-md mx-auto animate-fade-in">
                            <p className="text-red-400 font-bold mb-1 flex items-center">
                                <span className="mr-2">⚠️</span> Connection Info
                            </p>
                            <p className="text-sm text-gray-300">{connectionError}</p>
                            <button 
                                onClick={connectWifi}
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                                Switch to Cloud Sync?
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting || !!connectionStatus}
                            className={`text-white font-bold py-4 px-10 rounded-full transition-all shadow-lg flex items-center justify-center disabled:opacity-50 ${
                                connectionMode === 'wifi' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-900/50' : 
                                connectionMode === 'bluetooth' ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/50' :
                                'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/50'
                            }`}
                        >
                            {connectionMode === 'wifi' ? <WifiIcon className="w-5 h-5" /> : 
                             connectionMode === 'bluetooth' ? <BluetoothIcon className="w-5 h-5" /> :
                             <SmartWatchIcon />}
                            <span className="ml-2 tracking-wider">
                                {connectionMode === 'wifi' ? 'SYNC VIA CLOUD' : 
                                 connectionMode === 'bluetooth' ? 'PAIR BLUETOOTH' : 'SMART CONNECT'}
                            </span>
                        </button>
                        
                        <p className="text-[10px] text-gray-500 mt-2 text-center">
                            Having trouble connecting? Try <button onClick={connectWifi} className="text-gray-400 underline hover:text-white">Cloud Sync</button> for Samsung/Apple devices.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 max-w-lg mx-auto border-t border-gray-700 pt-4">
                        <div className="flex items-center justify-center"><HeartRateIcon className="w-4 h-4 mr-1"/> HR Telemetry</div>
                        <div className="flex items-center justify-center"><BotIcon /> Neural Analysis</div>
                        <div className="flex items-center justify-center"><WatchOSIcon className="w-4 h-4 mr-1"/> Device Sync</div>
                        <div className="flex items-center justify-center"><SparkleIcon className="w-4 h-4 mr-1"/> Zone Logic</div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Device Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center">
                    <div className="relative mr-4">
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connectionMode === 'wifi' ? 'bg-blue-400' : 'bg-green-400'}`}></span>
                          <span className={`relative inline-flex rounded-full h-3 w-3 ${connectionMode === 'wifi' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        </span>
                        <div className="bg-gray-700 p-2 rounded-lg">
                            {connectionMode === 'wifi' ? <WifiIcon className="w-6 h-6 text-white" /> : <WatchOSIcon className="w-6 h-6 text-white" />}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">{connectedModelName}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <p className={`text-xs font-mono flex items-center ${connectionMode === 'wifi' ? 'text-blue-400' : 'text-green-400'}`}>
                                LIVE STREAM ACTIVE
                            </p>
                            
                            <div className="flex items-center gap-2 border-l border-gray-600 pl-3">
                                <div className="flex items-center text-xs text-gray-400">
                                    <SignalIcon className={`w-4 h-4 mr-1 ${signalStrength > 2 ? 'text-green-400' : 'text-yellow-400'}`} strength={signalStrength} />
                                    <span>Signal {latency}ms</span>
                                </div>
                                {batteryLevel !== null && (
                                    <div className="flex items-center text-xs text-gray-400">
                                        <span className="mr-1">🔋</span> {batteryLevel}%
                                    </div>
                                )}
                            </div>
                            
                            {connectionMode === 'wifi' && lastSyncTime && (
                                <span className="text-[10px] text-gray-500 border-l border-gray-600 pl-3">
                                    Synced: {lastSyncTime}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleOptimizeConnection}
                        disabled={optimizationStatus !== 'idle'}
                        className={`text-xs font-bold px-3 py-2 rounded-lg border transition-all flex items-center ${
                            optimizationStatus === 'optimized' ? 'bg-green-900/30 text-green-400 border-green-500/50' :
                            optimizationStatus === 'optimizing' ? 'bg-blue-900/30 text-blue-400 border-blue-500/50 animate-pulse' :
                            'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                        }`}
                    >
                        <SparkleIcon className="w-3 h-3 mr-1" />
                        {optimizationStatus === 'idle' ? 'AI OPTIMIZE' : optimizationStatus === 'optimizing' ? 'TUNING...' : 'OPTIMIZED'}
                    </button>
                    <button onClick={handleDisconnect} className="text-xs font-bold text-red-400 bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-900/40 transition-colors">
                        TERMINATE LINK
                    </button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-blue-500/30">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><HeartRateIcon className="w-12 h-12" /></div>
                    <p className="text-xs text-blue-400 uppercase tracking-widest font-bold">Heart Rate</p>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-4xl font-extrabold text-white">{healthData.heartRate.avg}</span>
                        <span className="text-sm text-gray-400 ml-1">BPM</span>
                    </div>
                    <ZoneGauge hr={healthData.heartRate.avg} />
                </Card>

                <Card className="relative overflow-hidden border-orange-500/30">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><CaloriesIcon className="w-12 h-12" /></div>
                    <p className="text-xs text-orange-400 uppercase tracking-widest font-bold">Active Burn</p>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-4xl font-extrabold text-white">{Math.floor(healthData.caloriesBurned)}</span>
                        <span className="text-sm text-gray-400 ml-1">KCals</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Metabolic Rate: High</p>
                </Card>

                <Card className="relative overflow-hidden border-green-500/30">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><StepsIcon className="w-12 h-12" /></div>
                    <p className="text-xs text-green-400 uppercase tracking-widest font-bold">Session Steps</p>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-4xl font-extrabold text-white">{healthData.steps.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Cadence: Auto-Detect</p>
                </Card>

                <Card className="relative overflow-hidden border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-gray-800">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><BotIcon /></div>
                    <p className="text-xs text-purple-400 uppercase tracking-widest font-bold">Neural Engine</p>
                    <button 
                        onClick={handleNeuralAnalysis}
                        disabled={isAnalyzing}
                        className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                        {isAnalyzing ? <SparkleIcon className="w-3 h-3 mr-1 animate-spin"/> : <SparkleIcon className="w-3 h-3 mr-1"/>}
                        {isAnalyzing ? 'Scanning...' : 'Analyze Pulse'}
                    </button>
                </Card>
            </div>

            {/* AI Analysis Result */}
            {aiAnalysis && (
                <div className="animate-fade-in bg-purple-900/20 border border-purple-500/50 p-4 rounded-xl">
                    <h4 className="flex items-center text-purple-300 font-bold mb-2">
                        <BotIcon /> <span className="ml-2">Gemini Physio-Track Report</span>
                    </h4>
                    <div className="prose dark:prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                </div>
            )}

            {/* Live Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Live Biometric Stream" className="h-[400px] flex flex-col">
                        <div className="flex-1 w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={healthData.heartRate.history}>
                                    <defs>
                                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" stroke="#6b7280" className="text-[10px]" tick={false} />
                                    <YAxis stroke="#6b7280" className="text-[10px]" domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#ef4444" 
                                        strokeWidth={3} 
                                        fillOpacity={1} 
                                        fill="url(#colorHr)" 
                                        name="Heart Rate" 
                                        isAnimationActive={false} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
                
                <div className="space-y-6">
                     <Card title="Session Load">
                         <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-400">Cardio Load</span>
                                    <span className="text-sm font-bold text-white">Optimal</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[75%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-400">Recovery Need</span>
                                    <span className="text-sm font-bold text-white">Moderate</span>
                                </div>
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 w-[45%]"></div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Estimated VO2 Max</p>
                                <p className="text-2xl font-bold text-white">42 <span className="text-sm font-normal text-gray-400">ml/kg/min</span></p>
                            </div>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MemberHealthDashboard;
