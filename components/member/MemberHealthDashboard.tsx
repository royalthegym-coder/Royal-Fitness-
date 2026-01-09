
import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { INITIAL_HEALTH_DATA } from '../../constants';
import { GoogleIcon } from '../icons/GoogleIcon';
import { HealthData } from '../../types';
import { CaloriesIcon, HeartRateIcon, SleepIcon, StepsIcon } from '../icons/HealthIcons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import CustomTooltip from '../common/CustomTooltip';
import { SmartWatchIcon } from '../icons/SmartWatchIcon';
import { WatchOSIcon } from '../icons/WatchOSIcon'; // Importing for visual variety

interface MemberHealthDashboardProps {
    isConnected: boolean;
    isConnecting: boolean;
    onConnect: () => void;
}

const MetricCard: React.FC<{ title: string; value: string; unit: string; icon: React.ReactNode, isLive?: boolean }> = ({ title, value, unit, icon, isLive }) => (
    <Card className="flex items-center relative overflow-hidden">
        {isLive && <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_red]"></div>}
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold">{value} <span className="text-base font-normal text-gray-500 dark:text-gray-400">{unit}</span></p>
        </div>
    </Card>
);

const MemberHealthDashboard: React.FC<MemberHealthDashboardProps> = ({ isConnected, isConnecting, onConnect }) => {
    const [healthData, setHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    
    // Bluetooth State
    const [bluetoothDevice, setBluetoothDevice] = useState<any>(null);
    const [connectedModelName, setConnectedModelName] = useState<string>('Unknown Device'); // New state for Model Name
    const [isRealConnection, setIsRealConnection] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [localConnecting, setLocalConnecting] = useState(false);

    // Helper to start simulation
    const startSimulation = (mockName: string = "Simulated Device") => {
        setTimeout(() => {
            setIsRealConnection(false);
            setConnectedModelName(mockName);
            setLocalConnecting(false);
            onConnect(); // Notify parent
        }, 1000);
    };

    // Bluetooth Handler
    const connectBluetooth = async () => {
        setConnectionError(null);
        setLocalConnecting(true);

        try {
            // 1. Check for Secure Context
            if (!window.isSecureContext) {
                console.warn("Web Bluetooth requires a secure context (HTTPS).");
                setConnectionError("HTTPS required. Switching to Simulation...");
                startSimulation("Simulated Bio-Tracker");
                return;
            }

            // 2. Check Browser Support
            const nav = navigator as any;
            if (!nav.bluetooth) {
                console.warn("Web Bluetooth not supported.");
                setConnectionError("Browser not supported. Switching to Simulation...");
                startSimulation("Simulated Bio-Tracker");
                return;
            }

            // 3. Request Device
            // Added 'device_information' to optionalServices to read Model Number
            // Filter by 'heart_rate' service to find health gadgets
            const device = await nav.bluetooth.requestDevice({
                filters: [{ services: ['heart_rate'] }],
                optionalServices: ['battery_service', 'device_information']
            });

            // 4. Connect to GATT Server
            const server = await device.gatt.connect();
            
            // 5. Try to Read Model Name (Device Information Service)
            // UUID 0x180A is Device Information, 0x2A24 is Model Number String
            let modelName = device.name || "Generic Health Gadget";
            try {
                const infoService = await server.getPrimaryService('device_information');
                const modelChar = await infoService.getCharacteristic('model_number_string'); 
                const value = await modelChar.readValue();
                const decoder = new TextDecoder('utf-8');
                const decodedModel = decoder.decode(value);
                if (decodedModel) modelName = decodedModel;
            } catch (err) {
                console.log("Could not read specific model number, using device name.", err);
                // Fallback to advertised name if Model Number characteristic isn't readable
            }

            // 6. Connect to Heart Rate Service
            const service = await server.getPrimaryService('heart_rate');
            const characteristic = await service.getCharacteristic('heart_rate_measurement');

            await characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', handleHeartRateChanged);
            
            // Success
            setBluetoothDevice(device);
            setConnectedModelName(modelName); // Set the actual model name
            setIsRealConnection(true);
            setLocalConnecting(false);
            onConnect(); 
            
            device.addEventListener('gattserverdisconnected', onDisconnected);

        } catch (error: any) {
            // GRACEFUL HANDLING: User cancelled the picker
            // 'NotFoundError' is the standard error when user clicks Cancel in the chooser
            if (error.name === 'NotFoundError' || error.message.includes('User cancelled') || error.message.includes('chooser')) {
                console.log("Bluetooth device selection cancelled by user.");
                setConnectionError(null); 
                setLocalConnecting(false);
                return; 
            }
            
            console.error("Bluetooth connection failed:", error);

            if (error.name === 'SecurityError' || error.message.includes('permissions policy')) {
                 setConnectionError("Bluetooth blocked by browser policy. Starting Simulation...");
                 startSimulation("Simulated Bio-Tracker");
            } else {
                 setConnectionError("Connection failed. Starting Simulation...");
                 startSimulation("Simulated Bio-Tracker");
            }
        }
    };

    const onDisconnected = () => {
        console.log('Bluetooth Device disconnected');
        setBluetoothDevice(null);
        setIsRealConnection(false);
        setConnectedModelName('Unknown Device');
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
        
        updateHealthData(heartRate, true);
    };

    const updateHealthData = (hr: number, isReal: boolean) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setHealthData(prev => {
            const stepIncrement = isReal ? (hr > 90 ? 2 : 0) : (hr > 85 ? Math.floor(Math.random() * 3 + 1) : (Math.random() > 0.7 ? 1 : 0));
            const newSteps = prev.steps + stepIncrement;
            
            const calorieIncrement = (hr / 2000) * 5; 
            const newCalories = prev.caloriesBurned + calorieIncrement;

            const newHistoryPoint = { time: timeStr, value: hr };
            const newHistory = [...prev.heartRate.history.slice(-19), newHistoryPoint];

            return {
                ...prev,
                steps: newSteps,
                caloriesBurned: parseFloat(newCalories.toFixed(2)),
                heartRate: {
                    ...prev.heartRate,
                    avg: hr,
                    history: newHistory
                }
            };
        });
    };

    // Realistic Data Simulation (Fallback)
    useEffect(() => {
        if (!isConnected || isRealConnection) return;

        let tick = 0;
        const interval = setInterval(() => {
            tick += 0.2;
            const noise = Math.random() * 4 - 2; 
            const activityWave = Math.sin(tick) * 15; 
            const newHeartRate = Math.floor(75 + Math.abs(activityWave) + noise); 
            updateHealthData(newHeartRate, false);
        }, 2000);

        return () => clearInterval(interval);
    }, [isConnected, isRealConnection]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (bluetoothDevice && bluetoothDevice.gatt && bluetoothDevice.gatt.connected) {
                bluetoothDevice.gatt.disconnect();
            }
        };
    }, [bluetoothDevice]);

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
        const prompt = `
            Analyze the following daily health data for a gym member. 
            - Steps: ${healthData.steps}
            - Heart Rate: ${healthData.heartRate.avg} bpm
            - Calories: ${healthData.caloriesBurned} kcal
            
            Give 2 motivational tips based on this live activity.
        `;
        const summary = await getComplexResponse(prompt);
        setAiSummary(summary);
        setIsGeneratingSummary(false);
    };

    const handleGoogleFitConnect = () => {
        setLocalConnecting(true);
        startSimulation("Google Fit Cloud");
    };

    if (!isConnected) {
        return (
            <Card>
                <div className="text-center py-12">
                    <h2 className="text-2xl font-semibold mb-2">Connect Health Data</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">Sync your Smartwatch, Ring, or Band to track real-time workouts.</p>
                    {connectionError && <p className="text-amber-500 mb-4 animate-pulse font-medium">{connectionError}</p>}
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={handleGoogleFitConnect}
                            disabled={isConnecting || localConnecting}
                            className="bg-white text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center disabled:bg-gray-400"
                        >
                            <GoogleIcon className="w-6 h-6 mr-3" />
                            {isConnecting || localConnecting ? 'Syncing...' : 'Google Fit'}
                        </button>
                         <button
                            onClick={connectBluetooth}
                            disabled={isConnecting || localConnecting}
                            className="bg-amber-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-400 transition-colors flex items-center justify-center disabled:bg-gray-400"
                        >
                            <SmartWatchIcon />
                            <span className="ml-2">{isConnecting || localConnecting ? 'Connecting...' : 'Connect Gadget'}</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-6 max-w-lg mx-auto">
                        <strong>Universal Connectivity:</strong> Supports Apple Watch, Galaxy Watch, Fitbit, Smart Rings (Oura/Ultrahuman) & BLE Bands.<br/>
                        Simply ensure Bluetooth is ON and your device is ready to pair.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-500 dark:text-amber-400">Live Health Dashboard</h2>
                    <div className="flex items-center mt-1 space-x-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${isRealConnection ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                        <p className="text-sm font-mono text-gray-500 dark:text-gray-300">
                            Connected to: <span className="font-bold text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-600">{connectedModelName}</span>
                        </p>
                    </div>
                </div>
                
                <div className={`flex items-center text-sm px-3 py-1 rounded-full border ${isRealConnection ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-green-500 border-green-500/30 bg-green-500/10'}`}>
                    <WatchOSIcon className="w-4 h-4 mr-2" />
                    <span>{isRealConnection ? 'Bluetooth Stream Active' : 'Simulation Mode Active'}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Steps" value={healthData.steps.toLocaleString()} unit="steps" icon={<StepsIcon />} isLive />
                <MetricCard title="Avg. Heart Rate" value={healthData.heartRate.avg.toString()} unit="bpm" icon={<HeartRateIcon />} isLive />
                <MetricCard title="Calories Burned" value={Math.floor(healthData.caloriesBurned).toLocaleString()} unit="kcal" icon={<CaloriesIcon />} isLive />
                <MetricCard title="Total Sleep" value={healthData.sleep.totalHours.toString()} unit="hours" icon={<SleepIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card title="Live Heart Rate Stream">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={healthData.heartRate.history}>
                                <XAxis dataKey="time" stroke="currentColor" className="text-xs" tick={false} />
                                <YAxis stroke="currentColor" className="text-xs" domain={['dataMin - 10', 'dataMax + 10']} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={false} name="Heart Rate" unit=" bpm" isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
                <div>
                     <Card title="Sleep Analysis">
                         <div className="space-y-4">
                            <div>
                                <p className="font-bold text-3xl">{healthData.sleep.totalHours}h</p>
                                <p className="text-gray-500 dark:text-gray-400">Total Sleep</p>
                            </div>
                            <div className="flex justify-between text-sm pt-4 border-t border-gray-200 dark:border-gray-700">
                                <span>Deep Sleep</span>
                                <span className="font-semibold">{healthData.sleep.deepHours}h</span>
                            </div>
                             <div className="flex justify-between text-sm">
                                <span>REM Sleep</span>
                                <span className="font-semibold">{healthData.sleep.remHours}h</span>
                            </div>
                         </div>
                    </Card>
                </div>
            </div>
            
            <div className="mt-6">
                <Card title="AI Coach">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                        className="w-full bg-amber-500 text-gray-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 flex items-center justify-center"
                    >
                        <SparkleIcon className="w-5 h-5 mr-2" />
                        {isGeneratingSummary ? 'Analyzing...' : 'Get Live Feedback'}
                    </button>
                    {aiSummary && (
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <div className="prose dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default MemberHealthDashboard;
