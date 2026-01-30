
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { INITIAL_HEALTH_DATA } from '../../constants';
import { GoogleIcon } from '../icons/GoogleIcon';
import { SamsungHealthIcon } from '../icons/SamsungHealthIcon';
import { SmartWatchIcon } from '../icons/SmartWatchIcon'; 
import { AppleHealthIcon } from '../icons/AppleHealthIcon';
import { HealthData } from '../../../types';
import { CaloriesIcon, HeartRateIcon, SleepIcon, StepsIcon } from '../icons/HealthIcons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getComplexResponse } from '../../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import CustomTooltip from '../common/CustomTooltip';
import { WatchOSIcon } from '../icons/WatchOSIcon'; 
import { useData } from '../../context/DataProvider';
import { LockIcon } from '../icons/LockIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';

const MetricCard: React.FC<{ title: string; value: string; unit: string; icon: React.ReactNode; isLive?: boolean; subtext?: string }> = ({ title, value, unit, icon, isLive, subtext }) => (
    <Card className={`flex items-center relative overflow-hidden ${isLive ? 'border-green-500/30' : ''}`}>
        {isLive && <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>}
        <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value} <span className="text-base font-normal text-gray-500 dark:text-gray-400">{unit}</span></p>
            {subtext && <p className="text-xs text-green-500 font-mono mt-1">{subtext}</p>}
        </div>
    </Card>
);

const HealthConnectHub: React.FC = () => {
    // --- CONNECTED TO GLOBAL CONTEXT ---
    const { connectedDevice, setConnectedDevice, liveHealthData, updateLiveHealthData } = useData();
    
    // Local State
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'scanning' | 'connected'>('disconnected');
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [packetLog, setPacketLog] = useState<string[]>([]);
    const [encryptionStatus, setEncryptionStatus] = useState(false);

    // Sync local state with context if already connected
    useEffect(() => {
        if (connectedDevice?.status === 'Connected') {
            setConnectionStatus('connected');
            setEncryptionStatus(true);
        }
    }, [connectedDevice]);

    // --- REALISTIC DATA SIMULATION ENGINE ---
    useEffect(() => {
        if (connectionStatus !== 'connected') return;

        let tick = 0;
        const interval = setInterval(() => {
            tick += 0.2; // Time increment
            
            // 1. Bio-Metric Algorithm (Sine Wave for Organic HR)
            const noise = Math.random() * 4 - 2; 
            const activityWave = Math.sin(tick) * 15; 
            const newHeartRate = Math.floor(75 + Math.abs(activityWave) + noise); 
            
            // 2. Step Cadence
            const stepIncrement = newHeartRate > 85 ? Math.floor(Math.random() * 3 + 1) : (Math.random() > 0.7 ? 1 : 0);
            const newSteps = liveHealthData.steps + stepIncrement;
            
            // 3. Metabolic Burn
            const calorieIncrement = (newHeartRate / 2000) * 5;
            const newCalories = liveHealthData.caloriesBurned + calorieIncrement;
            
            // 4. Update History Vector
            const newHistoryPoint = { 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                value: newHeartRate 
            };
            const newHistory = [...liveHealthData.heartRate.history.slice(-19), newHistoryPoint];

            // 5. Commit to Global Context
            updateLiveHealthData({
                steps: newSteps,
                caloriesBurned: parseFloat(newCalories.toFixed(2)),
                heartRate: {
                    ...liveHealthData.heartRate,
                    avg: newHeartRate,
                    history: newHistory
                }
            });

            // 6. Packet Stream Logging (Data Normalization Visualization)
            if (Math.random() > 0.6) {
                const latency = Math.floor(Math.random() * 50 + 10);
                const size = Math.floor(Math.random() * 128 + 32);
                const source = connectedDevice?.platform || 'Sensor';
                setPacketLog(prev => [`[NORMALIZE] ${source} >> JSON | HR=${newHeartRate} | ${size}B | AES-256`, ...prev].slice(0, 8));
            }

            // 7. Battery Drain Simulation
            if (connectedDevice && Math.random() > 0.99) {
                 setConnectedDevice({
                     ...connectedDevice,
                     battery: Math.max(0, connectedDevice.battery - 1),
                     lastSync: 'Just now'
                 });
            }

        }, 2000); 

        return () => clearInterval(interval);
    }, [connectionStatus, liveHealthData, connectedDevice]);

    const handleConnect = (type: 'google_fit' | 'samsung_health' | 'apple_health' | 'smartwatch') => {
        setConnectionStatus('scanning');
        
        // Protocol Handshake Simulation
        let platform: any = 'Proprietary';
        let deviceName = 'Generic Device';

        if (type === 'smartwatch') { deviceName = 'Galaxy Watch 6 Classic'; platform = 'Proprietary'; }
        else if (type === 'samsung_health') { deviceName = 'Samsung Health (Galaxy S24)'; platform = 'Samsung Health'; }
        else if (type === 'apple_health') { deviceName = 'Apple Health (iPhone 15 Pro)'; platform = 'Apple Health'; }
        else { deviceName = 'Google Fit (Pixel 8)'; platform = 'Google Fit'; }

        setTimeout(() => {
            setConnectedDevice({
                id: Date.now().toString(),
                name: deviceName,
                type: 'Watch',
                platform: platform,
                battery: 85,
                status: 'Connected',
                lastSync: 'Just now'
            });
            setConnectionStatus('connected');
            setEncryptionStatus(true);
        }, 2500);
    };

    const handleDisconnect = () => {
        setConnectionStatus('disconnected');
        setConnectedDevice(null);
        setEncryptionStatus(false);
    };

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
        const prompt = `
            Act as a Proactive Health Intelligence System.
            Analyze this live fitness stream for a user at "Royal The Gym".
            Device: ${connectedDevice?.name} (${connectedDevice?.platform}).
            
            Metrics:
            - Steps: ${liveHealthData.steps}
            - HR: ${liveHealthData.heartRate.avg} bpm
            - Burn: ${liveHealthData.caloriesBurned} kcal
            
            Identify if they are in "Fat Burn" or "Cardio" zone. Give 2 tactical recovery tips.
            Format as HTML.
        `;
        try {
            const summary = await getComplexResponse(prompt);
            setAiSummary(summary);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    if (connectionStatus === 'disconnected') {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400">Wearable Connect Hub</h1>
                    <span className="text-[10px] font-bold bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-600">v3.0 (2026 Ready)</span>
                </div>
                
                <p className="text-gray-400 mb-6 max-w-2xl text-sm">
                    Unified connectivity protocol. Sync data from Health Connect (Android), HealthKit (iOS), or direct BLE devices. 
                    <span className="block mt-2 text-green-400 font-bold flex items-center"><LockIcon className="w-3 h-3 mr-1"/> HIPAA Compliant / AES-256 Encrypted</span>
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="hover:border-red-500 transition-colors cursor-pointer border-2 border-transparent group bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center py-8 px-4">
                            <div className="group-hover:scale-110 transition-transform duration-300">
                                <AppleHealthIcon className="w-16 h-16 mx-auto mb-4 text-white" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-white">Apple Health</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-xs">iOS HealthKit Bridge</p>
                            <button onClick={() => handleConnect('apple_health')} className="bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition-colors shadow-md text-xs uppercase tracking-wider">Sync iOS</button>
                        </div>
                    </Card>

                    <Card className="hover:border-blue-500 transition-colors cursor-pointer border-2 border-transparent group bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center py-8 px-4">
                            <div className="group-hover:scale-110 transition-transform duration-300">
                                <SamsungHealthIcon className="w-16 h-16 mx-auto mb-4" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-white">Samsung Health</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-xs">Health SDK (Android)</p>
                            <button onClick={() => handleConnect('samsung_health')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors shadow-md text-xs uppercase tracking-wider">Sync Android</button>
                        </div>
                    </Card>

                    <Card className="hover:border-yellow-500 transition-colors cursor-pointer border-2 border-transparent group bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="text-center py-8 px-4">
                            <div className="group-hover:scale-110 transition-transform duration-300">
                                <GoogleIcon className="w-16 h-16 mx-auto mb-4" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-white">Google Fit / HC</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-xs">Health Connect API</p>
                            <button onClick={() => handleConnect('google_fit')} className="bg-white text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition-colors shadow-md text-xs uppercase tracking-wider">Sync Google</button>
                        </div>
                    </Card>

                    <Card className="hover:border-amber-500 transition-colors cursor-pointer border-2 border-transparent relative overflow-hidden group bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="absolute top-0 right-0 bg-amber-500 text-xs font-bold text-gray-900 px-2 py-1 rounded-bl-lg">BLE</div>
                        <div className="text-center py-8 px-4">
                            <div className="group-hover:scale-110 transition-transform duration-300">
                                <WatchOSIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2 text-white">Direct Scan</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-xs">Bluetooth Smart / ANT+</p>
                            <button onClick={() => handleConnect('smartwatch')} className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-full hover:bg-amber-400 transition-colors shadow-md text-xs uppercase tracking-wider">Scan Device</button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (connectionStatus === 'scanning') {
        return (
            <Card>
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                        <div className="w-24 h-24 bg-amber-500/10 rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-24 h-24 bg-amber-500/20 rounded-full animate-pulse absolute inset-0 delay-75"></div>
                        <div className="relative z-10 p-6 bg-gray-900 rounded-full border border-amber-500/50">
                             <SmartWatchIcon />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold mt-8 animate-pulse text-amber-500">Handshake in Progress...</h2>
                    <p className="text-gray-400 mt-2 font-mono text-sm">Negotiating security keys via Health Connect...</p>
                </div>
            </Card>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6 bg-gray-900 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center">
                    <h1 className="text-2xl font-bold text-amber-500 dark:text-amber-400">Live Telemetry</h1>
                    <span className="ml-3 px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.7)]">STREAMING</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center px-3 py-1 bg-green-900/20 rounded-full border border-green-500/30">
                         <LockIcon className="w-3 h-3 text-green-500 mr-2"/>
                         <span className="text-[10px] text-green-400 font-bold">AES-256 ENCRYPTED</span>
                    </div>
                    <div className="hidden md:flex items-center px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                        {connectedDevice?.platform === 'Apple Health' ? <AppleHealthIcon className="w-4 h-4 mr-2 text-white" /> : connectedDevice?.platform === 'Samsung Health' ? <SamsungHealthIcon className="w-4 h-4 mr-2" /> : connectedDevice?.platform === 'Google Fit' ? <GoogleIcon className="w-4 h-4 mr-2" /> : <WatchOSIcon className="w-4 h-4 mr-2 text-amber-400" />}
                        <span className="text-sm font-medium text-gray-300">{connectedDevice?.name}</span>
                        <span className={`ml-3 text-xs font-bold ${connectedDevice && connectedDevice.battery < 20 ? 'text-red-400' : 'text-green-400'}`}>
                            {connectedDevice?.battery}% 🔋
                        </span>
                    </div>
                    <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300 underline">Unlink</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Live Cadence" 
                    value={liveHealthData.steps.toLocaleString()} 
                    unit="steps" 
                    icon={<StepsIcon />} 
                    isLive 
                    subtext={connectedDevice?.platform === 'Apple Health' ? "Core Motion API" : "Pedometer Sensor"}
                />
                <MetricCard 
                    title="Heart Rate" 
                    value={liveHealthData.heartRate.avg.toString()} 
                    unit="bpm" 
                    icon={<HeartRateIcon />} 
                    isLive 
                    subtext="Optical Sensor (1Hz)"
                />
                <MetricCard 
                    title="Metabolic Burn" 
                    value={Math.floor(liveHealthData.caloriesBurned).toLocaleString()} 
                    unit="kcal" 
                    icon={<CaloriesIcon />} 
                    isLive 
                    subtext="Active Energy"
                />
                <MetricCard 
                    title="Sleep Score" 
                    value={liveHealthData.sleep.totalHours.toString()} 
                    unit="hours" 
                    icon={<SleepIcon />} 
                    subtext={`Deep: ${liveHealthData.sleep.deepHours}h`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <Card title="Live Biometric Stream">
                        <div className="h-[300px] w-full min-w-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={liveHealthData.heartRate.history}>
                                    <XAxis dataKey="time" stroke="currentColor" className="text-xs" tick={false} />
                                    <YAxis stroke="currentColor" className="text-xs" domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#ef4444" 
                                        strokeWidth={3} 
                                        dot={false} 
                                        name="Heart Rate" 
                                        unit=" bpm" 
                                        isAnimationActive={false} 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            <div className="absolute top-2 right-2 text-xs text-red-500 font-bold animate-pulse font-mono">
                                ● REAL-TIME
                            </div>
                        </div>
                    </Card>
                </div>
                <div>
                     <Card title="Data Normalization Node" className="bg-black border-gray-700 h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-green-500 p-2 space-y-1 custom-scrollbar">
                             {packetLog.map((log, i) => (
                                 <div key={i} className="border-b border-gray-800 pb-0.5">{log}</div>
                             ))}
                             {packetLog.length === 0 && <span className="opacity-50">Waiting for data packets...</span>}
                        </div>
                        <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                            <span>PROTOCOL: HEALTH_CONNECT_V1</span>
                            <span>STATUS: SYNCED</span>
                        </div>
                    </Card>
                </div>
            </div>
            
            <div className="mt-6">
                <Card className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-500/30">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-xl font-bold text-indigo-400 flex items-center">
                            <SparkleIcon className="w-5 h-5 mr-2" /> AI Health SRE
                         </h3>
                         <button
                            onClick={handleGenerateSummary}
                            disabled={isGeneratingSummary}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 shadow-lg"
                        >
                            {isGeneratingSummary ? 'Analyzing Patterns...' : 'Run Deep Analysis'}
                        </button>
                    </div>
                    
                    {aiSummary ? (
                        <div className="p-4 bg-gray-800/80 border border-indigo-500/20 rounded-lg animate-fade-in">
                            <div className="prose dark:prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Gemini Intelligence is monitoring your stream for anomalies (Arrhythmia, Stress Spikes, Recovery needs). Click analyze for a report.
                        </p>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default HealthConnectHub;
