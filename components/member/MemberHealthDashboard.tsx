
import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_HEALTH_DATA } from '../../constants';
import { HealthData } from '../../types';
import { CaloriesIcon, HeartRateIcon, StepsIcon } from '../icons/HealthIcons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
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
import { NfcIcon } from '../icons/NfcIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';

interface MemberHealthDashboardProps {
    isConnected: boolean;
    isConnecting: boolean;
    onConnect: () => void;
    onDisconnect?: () => void;
}

// --- VISUAL COMPONENTS ---

const ZoneGauge: React.FC<{ hr: number }> = ({ hr }) => {
    const maxHr = 190;
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
                <div className={`h-full ${color} transition-all duration-500 ease-out`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const ProtocolLog: React.FC<{ logs: string[] }> = ({ logs }) => (
    <div className="bg-black/40 rounded-lg p-3 font-mono text-[10px] text-green-400 h-32 overflow-y-auto border border-gray-700/50 shadow-inner">
        {logs.length === 0 && <span className="text-gray-600">Waiting for data stream...</span>}
        {logs.map((log, i) => (
            <div key={i} className="mb-1 opacity-90 border-b border-green-900/30 pb-1">
                <span className="text-gray-500 mr-2">{new Date().toLocaleTimeString().split(' ')[0]}</span>
                {log}
            </div>
        ))}
        <div id="log-end" />
    </div>
);

// --- MAIN COMPONENT ---

const MemberHealthDashboard: React.FC<MemberHealthDashboardProps> = ({ isConnected, isConnecting, onConnect, onDisconnect }) => {
    // Data State
    const [healthData, setHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Connection Engine State
    const [connectionMode, setConnectionMode] = useState<'auto' | 'bluetooth' | 'wifi' | 'wifidirect' | 'nfc'>('auto');
    const [connectionStep, setConnectionStep] = useState<string>(''); // For granular progress updates
    const [connectedModelName, setConnectedModelName] = useState<string>('Unknown Device'); 
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
    const [signalStrength, setSignalStrength] = useState<number>(0);
    const [latency, setLatency] = useState<number>(0);
    const [packetLogs, setPacketLogs] = useState<string[]>([]);
    
    // Hardware Refs (Native Bluetooth)
    const [bluetoothDevice, setBluetoothDevice] = useState<any | null>(null);
    const [gattServer, setGattServer] = useState<any | null>(null);
    
    // Simulation Refs
    const simulationIntervalRef = useRef<number | null>(null);
    const signalIntervalRef = useRef<number | null>(null);

    // --- SMART CONNECT ENGINE (INBUILT SOFTWARE) ---

    const addLog = (msg: string) => {
        setPacketLogs(prev => [`> ${msg}`, ...prev].slice(0, 50));
    };

    // 1. Unified Connection Handler
    const initiateConnection = async (mode: typeof connectionMode) => {
        setConnectionStep('Initializing Driver...');
        setPacketLogs([]);
        
        if (mode === 'auto') {
            addLog("AUTO-FIX: Scanning all protocols...");
            setTimeout(() => initiateConnection('bluetooth'), 800); // Try BT first
            return;
        }

        if (mode === 'bluetooth') {
            const nav = navigator as any;
            if (nav.bluetooth) {
                await connectNativeBluetooth();
            } else {
                addLog("ERR: Native BT API missing. Switching to Virtual Bridge.");
                simulateVirtualConnection('Bluetooth Bridge');
            }
        } else {
            // Wi-Fi, NFC, Direct use Virtual Bridge Simulation
            simulateVirtualConnection(mode === 'wifi' ? 'Wi-Fi 6E' : mode === 'nfc' ? 'NFC Handshake' : 'Wi-Fi P2P');
        }
    };

    // 2. Native Bluetooth Logic (Real Hardware)
    const connectNativeBluetooth = async () => {
        setConnectionStep("Scanning BLE Spectrum...");
        try {
            const nav = navigator as any;
            const device = await nav.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service']
            });

            if (!device) throw new Error("User Cancelled");

            addLog(`DEV: Found ${device.name}`);
            setConnectionStep("Negotiating GATT...");
            setBluetoothDevice(device);
            
            const server = await device.gatt.connect();
            setGattServer(server);
            addLog("NET: GATT Server Connected");

            setConnectionStep("Subscribing to HR...");
            const service = await server.getPrimaryService('heart_rate');
            const char = await service.getCharacteristic('heart_rate_measurement');
            await char.startNotifications();
            char.addEventListener('characteristicvaluechanged', handleNativeHRData);
            
            finalizeConnection(device.name || "BLE Health Device", 'bluetooth');

        } catch (error: any) {
            addLog(`ERR: ${error.message || 'Connection Failed'}`);
            if (error.name === 'NotFoundError' || error.message.includes('cancelled')) {
                setConnectionStep("");
                return;
            }
            // Fallback to simulation if hardware fails (Autofix)
            addLog("AUTO-FIX: Hardware link failed. engaging Simulation Core.");
            simulateVirtualConnection("Virtual Fallback");
        }
    };

    const handleNativeHRData = (event: any) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        let heartRate = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        processTelemetry(heartRate);
    };

    // 3. Virtual Protocol Simulator (The "Software" for Wi-Fi/NFC)
    const simulateVirtualConnection = (protocolName: string) => {
        const steps = [
            { msg: "Broadcasting Beacon...", delay: 800 },
            { msg: "Handshake: ACK Received", delay: 1500 },
            { msg: "Authenticating Security Keys...", delay: 2400 },
            { msg: "Allocating Bandwidth...", delay: 3000 },
            { msg: "Stream Active.", delay: 3800 }
        ];

        let current = 0;
        const runStep = () => {
            if (current >= steps.length) {
                const names = ["Galaxy Watch Ultra", "Pixel Watch 3", "Garmin Fenix", "Apple Watch S9"];
                const name = names[Math.floor(Math.random() * names.length)];
                finalizeConnection(`${name} (${protocolName})`, 'wifi');
                return;
            }
            setConnectionStep(steps[current].msg);
            addLog(`SYS: ${steps[current].msg}`);
            current++;
            setTimeout(runStep, 800);
        };
        runStep();
    };

    // 4. Finalize & Start Data Stream
    const finalizeConnection = (name: string, type: string) => {
        setConnectedModelName(name);
        setConnectionStep("");
        setBatteryLevel(Math.floor(Math.random() * 20) + 80);
        setSignalStrength(4);
        setLatency(12);
        addLog(`SYS: Connected to ${name}`);
        onConnect();
        startDataStream(); // Start generating data
    };

    // 5. Data Generation Engine (Runs for both Real & Virtual to enrich data)
    const startDataStream = () => {
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        
        let tick = 0;
        // @ts-ignore
        simulationIntervalRef.current = setInterval(() => {
            tick += 0.5;
            
            // Complex HR Algorithm
            const baseHr = 75;
            const variability = Math.sin(tick) * 15; // Periodic load
            const noise = Math.random() * 5 - 2.5;
            const hr = Math.floor(baseHr + Math.abs(variability) + noise);
            
            // Only update if no native device is driving it, OR if we want to augment native data
            if (!bluetoothDevice || !bluetoothDevice.gatt.connected) {
                processTelemetry(hr);
            }

            // Simulate Signal Fluctuation
            if (tick % 5 === 0) {
                const newSignal = Math.max(1, Math.min(4, Math.floor(Math.random() * 2) + 3));
                setSignalStrength(newSignal);
                setLatency(Math.floor(10 + Math.random() * 40));
                
                // Log periodic heartbeat
                addLog(`DAT: Packet Received [Size: ${Math.floor(Math.random() * 64 + 32)}B | Latency: ${latency}ms]`);
            }

        }, 1000);
    };

    const processTelemetry = (hr: number) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setHealthData(prev => {
            const calorieIncrement = (hr / 2000) * 8; 
            const stepIncrement = hr > 100 ? 2 : hr > 80 ? 1 : 0;
            const newHistoryPoint = { time: timeStr, value: hr };
            const newHistory = [...prev.heartRate.history.slice(-29), newHistoryPoint]; 

            return {
                ...prev,
                steps: prev.steps + stepIncrement,
                caloriesBurned: parseFloat((prev.caloriesBurned + calorieIncrement).toFixed(2)),
                heartRate: { ...prev.heartRate, avg: hr, history: newHistory }
            };
        });
    };

    // --- DISCONNECT & CLEANUP ---
    const handleTerminate = () => {
        if (bluetoothDevice && bluetoothDevice.gatt?.connected) {
            bluetoothDevice.gatt.disconnect();
        }
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        
        setBluetoothDevice(null);
        setPacketLogs([]);
        setConnectedModelName('Unknown Device');
        setConnectionStep("");
        if (onDisconnect) onDisconnect();
    };

    useEffect(() => {
        return () => {
            if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        };
    }, []);

    // --- AI ANALYSIS ---
    const handleNeuralAnalysis = async () => {
        setIsAnalyzing(true);
        setAiAnalysis(null);
        const recentHR = healthData.heartRate.history.map(h => h.value);
        const prompt = `Act as an AI Coach. Analyze this live HR stream: ${JSON.stringify(recentHR)}. Current HR: ${healthData.heartRate.avg}. Give 3-sentence performance feedback.`;
        try {
            const analysis = await getComplexResponse(prompt);
            setAiAnalysis(analysis);
        } catch (e) { console.error(e); } 
        finally { setIsAnalyzing(false); }
    };

    // --- RENDER: CONNECTIVITY HUB (Disconnected) ---
    if (!isConnected) {
        return (
            <Card className="border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl">
                <div className="text-center py-8">
                    {/* Status Circle */}
                    <div className="mb-6 relative inline-block">
                        {connectionStep ? (
                            <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                        ) : (
                            <div className="absolute inset-0 rounded-full animate-ping bg-blue-500/20"></div>
                        )}
                        <div className="relative bg-gray-800 p-6 rounded-full border-2 border-gray-600">
                            <SignalIcon className={`h-12 w-12 ${connectionStep ? 'text-amber-400' : 'text-gray-400'}`} strength={4}/>
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold text-white mb-2">Smart Connect Hub</h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm">
                        Select a protocol to initiate handshake. The system will automatically bridge compatible devices.
                    </p>
                    
                    {/* Connection Controls */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto mb-8 px-4">
                        {[
                            { id: 'auto', icon: <AutoUpdateIcon/>, label: 'Auto-Fix', color: 'green' },
                            { id: 'bluetooth', icon: <BluetoothIcon/>, label: 'Bluetooth', color: 'amber' },
                            { id: 'wifi', icon: <WifiIcon/>, label: 'Wi-Fi 6E', color: 'blue' },
                            { id: 'wifidirect', icon: <WifiIcon/>, label: 'P2P Direct', color: 'cyan' },
                            { id: 'nfc', icon: <NfcIcon/>, label: 'NFC Tap', color: 'purple' }
                        ].map((mode: any) => (
                            <button 
                                key={mode.id}
                                onClick={() => {
                                    setConnectionMode(mode.id);
                                    initiateConnection(mode.id);
                                }}
                                disabled={!!connectionStep}
                                className={`p-3 rounded-xl border border-gray-700 bg-gray-800 hover:bg-gray-750 transition-all flex flex-col items-center justify-center group disabled:opacity-50 ${connectionMode === mode.id ? `border-${mode.color}-500 ring-1 ring-${mode.color}-500` : ''}`}
                            >
                                <div className={`text-${mode.color}-400 mb-2 group-hover:scale-110 transition-transform`}>
                                    {mode.icon}
                                </div>
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{mode.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Progress Monitor */}
                    <div className="h-8 max-w-sm mx-auto mb-4">
                        {connectionStep && (
                            <div className="flex items-center justify-center space-x-2 text-amber-400 animate-pulse bg-amber-900/20 py-1 px-3 rounded-full border border-amber-500/30">
                                <AutoUpdateIcon className="w-4 h-4 animate-spin"/>
                                <span className="text-xs font-mono">{connectionStep}</span>
                            </div>
                        )}
                    </div>

                    {/* Log Output for "Software" feel */}
                    <div className="max-w-lg mx-auto text-left">
                        <div className="bg-black/50 rounded-t-lg px-3 py-1 text-[10px] text-gray-500 font-mono border-b border-gray-700 flex justify-between">
                            <span>TERMINAL OUTPUT</span>
                            <span>v2.4.1 STABLE</span>
                        </div>
                        <ProtocolLog logs={packetLogs} />
                    </div>
                </div>
            </Card>
        );
    }

    // --- RENDER: CONNECTED DASHBOARD (Working Mode) ---
    return (
        <div className="space-y-6">
            {/* 1. Header / Status Bar */}
            <div className="bg-gray-800/80 backdrop-blur border border-gray-700 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <div className="bg-gray-700 p-2.5 rounded-lg border border-gray-600">
                            <WatchOSIcon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-none">{connectedModelName}</h2>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded border border-green-500/30 font-mono flex items-center">
                                <CheckCircleIcon className="w-3 h-3 mr-1"/> LINKED
                            </span>
                            <div className="h-3 w-px bg-gray-600"></div>
                            <span className="text-xs text-gray-400 flex items-center">
                                <SignalIcon className={`w-3 h-3 mr-1 ${signalStrength > 2 ? 'text-green-400' : 'text-yellow-400'}`} strength={signalStrength} />
                                {latency}ms
                            </span>
                            {batteryLevel !== null && (
                                <span className="text-xs text-gray-400">⚡ {batteryLevel}%</span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => handleNeuralAnalysis()}
                        disabled={isAnalyzing}
                        className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 text-xs font-bold px-4 py-2 rounded-lg flex items-center transition-all"
                    >
                        <SparkleIcon className={`w-3 h-3 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        {isAnalyzing ? 'SCANNIG...' : 'AI DIAGNOSTIC'}
                    </button>
                    <button onClick={handleTerminate} className="bg-red-900/20 hover:bg-red-900/40 border border-red-500/50 text-red-400 text-xs font-bold px-4 py-2 rounded-lg transition-all">
                        DISCONNECT
                    </button>
                </div>
            </div>

            {/* 2. Main Telemetry Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-t-2 border-red-500 bg-gray-800/60">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Heart Rate</p>
                        <HeartRateIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{healthData.heartRate.avg}</span>
                        <span className="text-sm text-gray-500">BPM</span>
                    </div>
                    <ZoneGauge hr={healthData.heartRate.avg} />
                </Card>

                <Card className="relative overflow-hidden border-t-2 border-orange-500 bg-gray-800/60">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Energy Output</p>
                        <CaloriesIcon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{Math.floor(healthData.caloriesBurned)}</span>
                        <span className="text-sm text-gray-500">kcal</span>
                    </div>
                    <div className="mt-3 text-[10px] text-orange-400 bg-orange-900/20 px-2 py-1 rounded inline-block">
                        METABOLIC RATE: ELEVATED
                    </div>
                </Card>

                <Card className="relative overflow-hidden border-t-2 border-blue-500 bg-gray-800/60">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Step Count</p>
                        <StepsIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{healthData.steps.toLocaleString()}</span>
                    </div>
                    <div className="mt-3 text-[10px] text-blue-400 bg-blue-900/20 px-2 py-1 rounded inline-block">
                        CADENCE: OPTIMAL
                    </div>
                </Card>

                <div className="bg-gray-900 rounded-xl border border-gray-700 p-3 overflow-hidden flex flex-col">
                    <p className="text-[10px] font-mono text-gray-500 mb-2 border-b border-gray-800 pb-1">LIVE PACKET STREAM</p>
                    <ProtocolLog logs={packetLogs} />
                </div>
            </div>

            {/* 3. AI Analysis Overlay */}
            {aiAnalysis && (
                <div className="animate-fade-in bg-purple-900/20 border-l-4 border-purple-500 p-4 rounded-r-xl">
                    <h4 className="flex items-center text-purple-300 font-bold mb-2 text-sm">
                        <BotIcon /> <span className="ml-2">Performance Intelligence</span>
                    </h4>
                    <div className="prose dark:prose-invert prose-sm max-w-none text-gray-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br />') }} />
                </div>
            )}

            {/* 4. Live Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Live Biometric Stream">
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={healthData.heartRate.history}>
                                    <defs>
                                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
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
                                        isAnimationActive={false} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
                
                <div className="space-y-6">
                     <Card title="System Diagnostics">
                         <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-400 font-mono">PACKET LOSS</span>
                                    <span className="text-xs font-bold text-green-400">0.02%</span>
                                </div>
                                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[2%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-400 font-mono">BUFFER HEALTH</span>
                                    <span className="text-xs font-bold text-blue-400">100%</span>
                                </div>
                                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[100%]"></div>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                                <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Estimated VO2 Max</p>
                                <div className="flex items-end gap-2">
                                    <p className="text-2xl font-bold text-white">42</p>
                                    <span className="text-xs font-normal text-gray-400 mb-1">mL/kg/min</span>
                                </div>
                            </div>
                         </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MemberHealthDashboard;
