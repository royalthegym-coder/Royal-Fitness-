
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { INITIAL_HEALTH_DATA } from '../../constants';
import { GoogleIcon } from './icons/GoogleIcon';
import { SamsungHealthIcon } from './icons/SamsungHealthIcon';
import { SmartWatchIcon } from './icons/SmartWatchIcon'; 
import { AppleHealthIcon } from './icons/AppleHealthIcon';
import { HealthData } from '../../types';
import { CaloriesIcon, HeartRateIcon, SleepIcon, StepsIcon } from './icons/HealthIcons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import CustomTooltip from './common/CustomTooltip';
import { WatchOSIcon } from './icons/WatchOSIcon'; 
import { LockIcon } from './icons/LockIcon';
import { RefreshCw, Heart, Moon, Footprints, Flame, ChevronRight, BrainCircuit } from 'lucide-react';
import { useToast } from '../hooks/useToast';

// --- SUB-COMPONENTS ---

const HeartBeat: React.FC<{ bpm: number }> = ({ bpm }) => {
    // Calculate animation duration in seconds based on BPM (60 / bpm)
    const duration = bpm > 0 ? 60 / bpm : 0;
    
    return (
        <div className="relative flex items-center justify-center w-24 h-24">
            <div 
                className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
                style={{ animation: `pulse ${duration}s infinite` }}
            ></div>
            <Heart 
                className="w-12 h-12 text-red-500 fill-current relative z-10" 
                style={{ animation: `pulse ${duration}s infinite` }}
            />
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const StepProgress: React.FC<{ current: number; goal: number }> = ({ current, goal }) => {
    const percentage = Math.min(100, Math.round((current / goal) * 100));
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-20 h-20">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="40" cy="40" r={radius} stroke="#1f2937" strokeWidth="6" fill="none" />
                <circle 
                    cx="40" cy="40" r={radius} 
                    stroke={percentage >= 100 ? '#22c55e' : '#3b82f6'} 
                    strokeWidth="6" fill="none" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute text-[10px] font-black text-white">{percentage}%</div>
        </div>
    );
};

const SleepBar: React.FC<{ deep: number, light: number, rem: number }> = ({ deep, light, rem }) => {
    const total = deep + light + rem;
    return (
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden flex mt-2">
            <div className="bg-indigo-600 h-full" style={{ width: `${(deep/total)*100}%` }} title="Deep"></div>
            <div className="bg-blue-500 h-full" style={{ width: `${(light/total)*100}%` }} title="Light"></div>
            <div className="bg-purple-400 h-full" style={{ width: `${(rem/total)*100}%` }} title="REM"></div>
        </div>
    );
};

const HealthConnect: React.FC = () => {
    const { addToast } = useToast();
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'scanning' | 'connected'>('disconnected');
    const [sourceType, setSourceType] = useState<'google_fit' | 'samsung_health' | 'apple_health' | 'smartwatch' | null>(null);
    
    // Live Data State
    const [healthData, setHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [dailyStepGoal, setDailyStepGoal] = useState(10000);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // AI Coach State
    const [aiSummary, setAiSummary] = useState<string>('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    
    // Device specific state
    const [deviceName, setDeviceName] = useState('');
    const [batteryLevel, setBatteryLevel] = useState(100);

    // --- LIVE SIMULATION ENGINE ---
    useEffect(() => {
        if (connectionStatus !== 'connected') return;

        let tick = 0;
        const interval = setInterval(() => {
            tick += 0.2;
            setHealthData(prev => {
                // Heart Rate Simulation (Sin wave for realism)
                const noise = Math.random() * 4 - 2; 
                const activityWave = Math.sin(tick) * 15; 
                const newHeartRate = Math.floor(75 + Math.abs(activityWave) + noise); 
                
                // Steps Simulation (Increment occasionally)
                const stepIncrement = newHeartRate > 90 ? Math.floor(Math.random() * 5) : 0;
                
                // Calories Simulation
                const calorieIncrement = (newHeartRate / 2000) * 0.5;

                const newHistoryPoint = { 
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
                    value: newHeartRate 
                };

                return {
                    ...prev,
                    steps: prev.steps + stepIncrement,
                    caloriesBurned: parseFloat((prev.caloriesBurned + calorieIncrement).toFixed(2)),
                    heartRate: {
                        ...prev.heartRate,
                        avg: newHeartRate,
                        history: [...prev.heartRate.history.slice(-19), newHistoryPoint]
                    }
                };
            });
            
            // Battery Drain
            if (Math.random() > 0.98) setBatteryLevel(b => Math.max(0, b - 1));

        }, 1000); 

        return () => clearInterval(interval);
    }, [connectionStatus]);

    const handleConnect = (type: 'google_fit' | 'samsung_health' | 'apple_health' | 'smartwatch') => {
        setSourceType(type);
        setConnectionStatus('scanning');
        
        setTimeout(() => {
            setConnectionStatus('connected');
            if (type === 'smartwatch') setDeviceName('Galaxy Watch 6 Classic');
            else if (type === 'samsung_health') setDeviceName('Samsung Health (Galaxy S24)');
            else if (type === 'apple_health') setDeviceName('Apple Health (iPhone 15 Pro)');
            else setDeviceName('Google Fit (Pixel 8)');
            addToast("Secure Health Uplink Established.", "success");
        }, 2000);
    };

    const handleDisconnect = () => {
        setConnectionStatus('disconnected');
        setSourceType(null);
        setHealthData(INITIAL_HEALTH_DATA);
        setAiSummary('');
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            addToast("Data Synced with Cloud.", "success");
        }, 1500);
    };

    const handleGenerateCoach = async () => {
        setIsGeneratingSummary(true);
        setAiSummary('');
        
        const prompt = `
            Act as an elite personal fitness coach AI. Analyze this user's daily stats:
            - Steps: ${healthData.steps} / ${dailyStepGoal} Goal
            - Avg HR: ${healthData.heartRate.avg} BPM
            - Sleep: ${healthData.sleep.totalHours}h (Deep: ${healthData.sleep.deepHours}h)
            - Burn: ${healthData.caloriesBurned} kcal

            Task: Provide a 3-sentence personalized motivational summary. 
            If sleep is low (<7h), suggest recovery. If steps are low, push for a walk. 
            Use emojis.
        `;

        try {
            const summary = await getComplexResponse(prompt);
            setAiSummary(summary);
        } catch (e) {
            setAiSummary("Coach is offline. Try again later.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    if (connectionStatus === 'disconnected') {
        return (
            <div className="animate-fade-in">
                <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400 mb-6">Health Connect</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="hover:border-red-500 transition-all cursor-pointer border-2 border-transparent group relative overflow-hidden bg-gray-900">
                        <div className="text-center py-10 px-4 relative z-10">
                            <AppleHealthIcon className="w-16 h-16 mx-auto mb-4 text-red-500 group-hover:scale-110 transition-transform" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Apple Health</h2>
                            <p className="text-gray-500 text-xs mb-6">Sync Activity Rings, Sleep & Heart.</p>
                            <button onClick={() => handleConnect('apple_health')} className="bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition-colors shadow-md text-xs uppercase tracking-wider">Connect</button>
                        </div>
                    </Card>
                    <Card className="hover:border-blue-500 transition-all cursor-pointer border-2 border-transparent group relative overflow-hidden bg-gray-900">
                        <div className="text-center py-10 px-4 relative z-10">
                            <SamsungHealthIcon className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Samsung Health</h2>
                            <p className="text-gray-500 text-xs mb-6">Galaxy Watch & Phone Integration.</p>
                            <button onClick={() => handleConnect('samsung_health')} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-500 transition-colors shadow-md text-xs uppercase tracking-wider">Connect</button>
                        </div>
                    </Card>
                    <Card className="hover:border-yellow-500 transition-all cursor-pointer border-2 border-transparent group relative overflow-hidden bg-gray-900">
                        <div className="text-center py-10 px-4 relative z-10">
                            <GoogleIcon className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Google Fit</h2>
                            <p className="text-gray-500 text-xs mb-6">Universal Android Health Sync.</p>
                            <button onClick={() => handleConnect('google_fit')} className="bg-white text-gray-900 font-bold py-2 px-6 rounded-full hover:bg-gray-200 transition-colors shadow-md text-xs uppercase tracking-wider">Connect</button>
                        </div>
                    </Card>
                    <Card className="hover:border-amber-500 transition-all cursor-pointer border-2 border-transparent group relative overflow-hidden bg-gray-900">
                        <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-2 py-1 rounded-bl-lg">BLE</div>
                        <div className="text-center py-10 px-4 relative z-10">
                            <WatchOSIcon className="w-16 h-16 mx-auto mb-4 text-gray-700 dark:text-gray-200 group-hover:scale-110 transition-transform" />
                            <h2 className="text-xl font-semibold mb-2 text-white">Direct Device</h2>
                            <p className="text-gray-500 text-xs mb-6">Pair Bluetooth Wearables Directly.</p>
                            <button onClick={() => handleConnect('smartwatch')} className="bg-amber-500 text-black font-bold py-2 px-6 rounded-full hover:bg-amber-400 transition-colors shadow-md text-xs uppercase tracking-wider">Pair BLE</button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (connectionStatus === 'scanning') {
        return (
            <Card className="h-[600px] flex flex-col items-center justify-center bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-black to-black"></div>
                <div className="relative z-10 text-center">
                    <div className="w-32 h-32 bg-amber-500/10 rounded-full flex items-center justify-center border-4 border-amber-500/30 animate-pulse mb-8 mx-auto">
                        <SmartWatchIcon className="w-12 h-12 text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter animate-pulse">Scanning Bio-Signal...</h2>
                    <p className="text-gray-500 font-mono text-xs mt-2 uppercase tracking-widest">Handshake Protocol Initiated</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            
            {/* 1. DEVICE HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 border border-white/10 p-6 rounded-[2.5rem]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-800 rounded-2xl border border-white/5">
                        {sourceType === 'apple_health' ? <AppleHealthIcon className="w-6 h-6 text-red-500" /> : sourceType === 'samsung_health' ? <SamsungHealthIcon className="w-6 h-6" /> : sourceType === 'google_fit' ? <GoogleIcon className="w-6 h-6" /> : <WatchOSIcon className="w-6 h-6 text-amber-400" />}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white leading-none">{deviceName}</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Connected
                            </span>
                            <span className={`text-[10px] font-mono ${batteryLevel < 20 ? 'text-red-500' : 'text-gray-400'}`}>BAT: {batteryLevel}%</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">
                     <button onClick={handleSync} className="p-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-xl border border-blue-500/30 transition-all active:scale-95">
                         <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                     </button>
                     <button onClick={handleDisconnect} className="px-6 py-3 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded-xl border border-red-500/30 text-xs font-black uppercase tracking-widest transition-all">
                         Unlink
                     </button>
                </div>
            </div>

            {/* 2. LIVE METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* HEART RATE */}
                <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Live Pulse</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white italic">{healthData.heartRate.avg}</span>
                                <span className="text-xs text-red-500 font-bold animate-pulse">BPM</span>
                            </div>
                        </div>
                        <HeartBeat bpm={healthData.heartRate.avg} />
                    </div>
                    <div className="h-16 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={healthData.heartRate.history}>
                                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* STEPS GOAL */}
                <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem] flex items-center justify-between relative overflow-hidden">
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Footprints className="w-3 h-3"/> Steps</p>
                        <span className="text-3xl font-black text-white italic">{healthData.steps.toLocaleString()}</span>
                        <p className="text-[10px] text-gray-600 mt-1">Goal: {dailyStepGoal.toLocaleString()}</p>
                    </div>
                    <StepProgress current={healthData.steps} goal={dailyStepGoal} />
                </div>

                {/* CALORIES */}
                <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Flame className="w-20 h-20 text-orange-500" /></div>
                    <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Active Burn</p>
                        <span className="text-3xl font-black text-white italic">{Math.floor(healthData.caloriesBurned)} <span className="text-sm text-orange-500 not-italic">kcal</span></span>
                    </div>
                    <div className="w-full bg-gray-800 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${Math.min(100, (healthData.caloriesBurned / 800) * 100)}%` }}></div>
                    </div>
                </div>

                {/* SLEEP TRACKING */}
                <div className="bg-[#0c0c0c] border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                         <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Moon className="w-3 h-3 text-indigo-400"/> Sleep</p>
                            <span className="text-3xl font-black text-white italic">{healthData.sleep.totalHours} <span className="text-sm text-gray-500 not-italic">hr</span></span>
                         </div>
                         <div className="text-right">
                             <p className="text-xs font-bold text-green-400">85%</p>
                             <p className="text-[8px] text-gray-600 uppercase">Quality</p>
                         </div>
                    </div>
                    <SleepBar deep={healthData.sleep.deepHours} light={healthData.sleep.totalHours - healthData.sleep.deepHours - healthData.sleep.remHours} rem={healthData.sleep.remHours} />
                    <div className="flex justify-between text-[8px] text-gray-500 mt-2 uppercase font-mono">
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div> Deep</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> Light</span>
                        <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div> REM</span>
                    </div>
                </div>
            </div>

            {/* 3. AI COACH SECTION */}
            <Card className="bg-gradient-to-r from-gray-900 to-black border-white/10 p-8 rounded-[3rem]">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-indigo-500/10 p-4 rounded-full border border-indigo-500/30">
                        <BrainCircuit className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">Personalized Neural Coach</h3>
                        {aiSummary ? (
                            <div className="bg-gray-800/50 p-4 rounded-2xl border border-white/5 text-sm text-gray-300 italic leading-relaxed animate-fade-in">
                                "{aiSummary}"
                            </div>
                        ) : (
                            <p className="text-gray-500 text-xs">Ready to analyze your daily biometrics for optimal performance suggestions.</p>
                        )}
                    </div>
                    <button 
                        onClick={handleGenerateCoach}
                        disabled={isGeneratingSummary}
                        className="bg-white text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-400 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isGeneratingSummary ? <RefreshCw className="w-4 h-4 animate-spin"/> : <SparkleIcon className="w-4 h-4"/>}
                        {isGeneratingSummary ? 'Analyzing...' : 'Generate Insights'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default HealthConnect;
