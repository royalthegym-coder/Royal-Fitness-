
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { INITIAL_HEALTH_DATA } from '../../constants';
import { GoogleIcon } from './icons/GoogleIcon';
import { SamsungHealthIcon } from './icons/SamsungHealthIcon';
import { SmartWatchIcon } from './icons/SmartWatchIcon'; 
import { AppleHealthIcon } from './icons/AppleHealthIcon';
import { HealthData } from '../../types';
import { CaloriesIcon, HeartRateIcon, SleepIcon, StepsIcon } from './icons/HealthIcons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import CustomTooltip from './common/CustomTooltip';
import { WatchOSIcon } from './icons/WatchOSIcon'; 

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

const HealthConnect: React.FC = () => {
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'scanning' | 'connected'>('disconnected');
    const [sourceType, setSourceType] = useState<'google_fit' | 'samsung_health' | 'apple_health' | 'smartwatch' | null>(null);
    const [healthData, setHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [aiSummary, setAiSummary] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    
    // Device specific state
    const [deviceName, setDeviceName] = useState('');
    const [batteryLevel, setBatteryLevel] = useState(100);

    // Advanced Realistic Data Simulation
    useEffect(() => {
        if (connectionStatus !== 'connected') return;

        // Smooth fluctuation using Math.sin for realistic heart rate variability
        let tick = 0;

        const interval = setInterval(() => {
            tick += 0.2; // Time increment
            setHealthData(prev => {
                // Realistic Heart Rate Algorithm
                const noise = Math.random() * 4 - 2; 
                const activityWave = Math.sin(tick) * 15; 
                const newHeartRate = Math.floor(75 + Math.abs(activityWave) + noise); 
                
                // Steps increment
                const stepIncrement = newHeartRate > 85 ? Math.floor(Math.random() * 3 + 1) : (Math.random() > 0.7 ? 1 : 0);
                const newSteps = prev.steps + stepIncrement;
                
                // Calories burn
                const calorieIncrement = (newHeartRate / 2000) * 5;
                const newCalories = prev.caloriesBurned + calorieIncrement;
                
                // Update history
                const newHistoryPoint = { 
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                    value: newHeartRate 
                };
                const newHistory = [...prev.heartRate.history.slice(-19), newHistoryPoint];

                return {
                    ...prev,
                    steps: newSteps,
                    caloriesBurned: parseFloat(newCalories.toFixed(2)),
                    heartRate: {
                        ...prev.heartRate,
                        avg: newHeartRate,
                        history: newHistory
                    }
                };
            });

            // Drain battery slowly
            if (Math.random() > 0.95) {
                setBatteryLevel(prev => Math.max(0, prev - 1));
            }

        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, [connectionStatus]);

    const handleConnect = (type: 'google_fit' | 'samsung_health' | 'apple_health' | 'smartwatch') => {
        setSourceType(type);
        setConnectionStatus('scanning');
        
        // Simulate scanning/pairing delay
        setTimeout(() => {
            setConnectionStatus('connected');
            if (type === 'smartwatch') {
                setDeviceName('Galaxy Watch 6 Classic');
            } else if (type === 'samsung_health') {
                setDeviceName('Samsung Health (Galaxy S24)');
            } else if (type === 'apple_health') {
                setDeviceName('Apple Health (iPhone 15 Pro)');
            } else {
                setDeviceName('Google Fit (Pixel 8)');
            }
        }, 3000);
    };

    const handleDisconnect = () => {
        setConnectionStatus('disconnected');
        setSourceType(null);
        setHealthData(INITIAL_HEALTH_DATA);
    };

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
        const prompt = `
            Analyze the following LIVE health data for a gym member. 
            Source: ${sourceType === 'apple_health' ? 'Apple HealthKit' : sourceType}.
            
            - Current Steps: ${healthData.steps}
            - Current Heart Rate: ${healthData.heartRate.avg} bpm
            - Calories Burned Today: ${healthData.caloriesBurned} kcal
            - Total Sleep: ${healthData.sleep.totalHours} hours

            Provide 3 short, punchy bullet points on their current activity level and suggestions based on the specific data source accuracy.
        `;
        const summary = await getComplexResponse(prompt);
        setAiSummary(summary);
        setIsGeneratingSummary(false);
    };

    if (connectionStatus === 'disconnected') {
        return (
            <div>
                <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400 mb-6">Health Connect</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="hover:border-red-500 transition-colors cursor-pointer border-2 border-transparent">
                        <div className="text-center py-10 px-4">
                            <AppleHealthIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Apple Health</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Sync Activity Rings, Sleep, and Heart data from iOS.</p>
                            <button
                                onClick={() => handleConnect('apple_health')}
                                className="bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition-colors shadow-md"
                            >
                                Connect
                            </button>
                        </div>
                    </Card>

                    <Card className="hover:border-blue-500 transition-colors cursor-pointer border-2 border-transparent">
                        <div className="text-center py-10 px-4">
                            <SamsungHealthIcon className="w-16 h-16 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Samsung Health</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Deep integration for Galaxy devices. Syncs sleep & stress.</p>
                            <button
                                onClick={() => handleConnect('samsung_health')}
                                className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors shadow-md"
                            >
                                Connect
                            </button>
                        </div>
                    </Card>

                    <Card className="hover:border-yellow-500 transition-colors cursor-pointer border-2 border-transparent">
                        <div className="text-center py-10 px-4">
                            <GoogleIcon className="w-16 h-16 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Google Fit</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Standard Android sync for steps and basic activity.</p>
                            <button
                                onClick={() => handleConnect('google_fit')}
                                className="bg-white text-gray-800 font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition-colors shadow-md"
                            >
                                Connect
                            </button>
                        </div>
                    </Card>

                    <Card className="hover:border-amber-500 transition-colors cursor-pointer border-2 border-transparent relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-amber-500 text-xs font-bold text-gray-900 px-2 py-1 rounded-bl-lg">DIRECT</div>
                        <div className="text-center py-10 px-4">
                            <WatchOSIcon className="w-16 h-16 mx-auto mb-4 text-gray-700 dark:text-gray-200" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Direct Device</h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Connect Watch, Band or Ring via Bluetooth Low Energy.</p>
                            <button
                                onClick={() => handleConnect('smartwatch')}
                                className="bg-amber-500 text-gray-900 font-bold py-2 px-6 rounded-full hover:bg-amber-400 transition-colors shadow-md"
                            >
                                Pair BLE
                            </button>
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
                        <div className="w-20 h-20 bg-amber-500/20 rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-20 h-20 bg-amber-500/40 rounded-full animate-pulse absolute inset-0 delay-75"></div>
                        {sourceType === 'apple_health' ? (
                            <AppleHealthIcon className="w-16 h-16 text-red-500 relative z-10" />
                        ) : sourceType === 'samsung_health' ? (
                            <SamsungHealthIcon className="w-16 h-16 relative z-10" />
                        ) : sourceType === 'google_fit' ? (
                            <GoogleIcon className="w-16 h-16 relative z-10" />
                        ) : (
                            <SmartWatchIcon />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold mt-8 animate-pulse">Establishing Handshake...</h2>
                    <p className="text-gray-400 mt-2">Authenticating via {sourceType === 'apple_health' ? 'HealthKit' : sourceType === 'samsung_health' ? 'Samsung Cloud' : 'Secure API'}</p>
                </div>
            </Card>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400">Health Dashboard</h1>
                    <span className="ml-3 px-2 py-1 text-xs font-bold text-white bg-red-600 rounded animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.7)]">LIVE STREAM</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center px-3 py-1 bg-gray-800 rounded-full border border-gray-700">
                        {sourceType === 'apple_health' ? <AppleHealthIcon className="w-4 h-4 mr-2 text-red-500" /> : sourceType === 'samsung_health' ? <SamsungHealthIcon className="w-4 h-4 mr-2" /> : sourceType === 'google_fit' ? <GoogleIcon className="w-4 h-4 mr-2" /> : <WatchOSIcon className="w-4 h-4 mr-2 text-amber-400" />}
                        <span className="text-sm font-medium text-gray-300">{deviceName}</span>
                        {(sourceType === 'smartwatch' || sourceType === 'samsung_health' || sourceType === 'apple_health') && (
                            <span className={`ml-3 text-xs font-bold ${batteryLevel < 20 ? 'text-red-400' : 'text-green-400'}`}>
                                {batteryLevel}% 🔋
                            </span>
                        )}
                    </div>
                    <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300 underline">Disconnect</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard 
                    title="Live Steps" 
                    value={healthData.steps.toLocaleString()} 
                    unit="steps" 
                    icon={<StepsIcon />} 
                    isLive 
                    subtext={sourceType === 'apple_health' ? "Core Motion" : sourceType === 'samsung_health' ? "Galaxy Sensor" : "Standard Pedometer"}
                />
                <MetricCard 
                    title="Heart Rate" 
                    value={healthData.heartRate.avg.toString()} 
                    unit="bpm" 
                    icon={<HeartRateIcon />} 
                    isLive 
                    subtext="Real-time Optical Sensor"
                />
                <MetricCard 
                    title="Active Calories" 
                    value={Math.floor(healthData.caloriesBurned).toLocaleString()} 
                    unit="kcal" 
                    icon={<CaloriesIcon />} 
                    isLive 
                    subtext="Metabolic Calculation"
                />
                <MetricCard 
                    title="Last Night's Sleep" 
                    value={healthData.sleep.totalHours.toString()} 
                    unit="hours" 
                    icon={<SleepIcon />} 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <Card title="Live Biometric Stream">
                        <div className="h-[300px] w-full min-w-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={healthData.heartRate.history}>
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
                            <div className="absolute top-2 right-2 text-xs text-red-500 font-bold animate-pulse">
                                ● LIVE UPDATE (1Hz)
                            </div>
                        </div>
                    </Card>
                </div>
                <div>
                     <Card title="Device Vitals">
                         <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400">Connection Quality</p>
                                <div className="flex items-center mt-1">
                                    <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 w-[95%]"></div>
                                    </div>
                                    <span className="ml-2 text-xs font-bold text-green-500">Excellent</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                <span className="text-sm text-gray-300">SpO2 (Blood Oxygen)</span>
                                <span className="font-bold text-white">98%</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-700">
                                <span className="text-sm text-gray-300">Stress Level</span>
                                <span className="font-bold text-green-400">Low (24/100)</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-300">VO2 Max (Est.)</span>
                                <span className="font-bold text-amber-400">42 mL/kg/min</span>
                            </div>
                         </div>
                    </Card>
                </div>
            </div>
            
            <div className="mt-6">
                <Card title="AI Health Coach">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:from-amber-400 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg"
                    >
                        <SparkleIcon className="w-5 h-5 mr-2" />
                        {isGeneratingSummary ? 'Processing Biometrics...' : 'Generate Live Insights'}
                    </button>
                    {aiSummary && (
                        <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg animate-fade-in">
                            <div className="prose dark:prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br />') }} />
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default HealthConnect;
