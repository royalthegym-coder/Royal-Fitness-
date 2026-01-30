
import React, { useState, useEffect, useRef } from 'react';
import Card from '../common/Card';
import { HealthData } from '../../../types';
import { CaloriesIcon, HeartRateIcon, StepsIcon } from '../icons/HealthIcons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line, BarChart, Bar } from 'recharts';
import { getComplexResponse } from '../../../lib/gemini';
import { SparkleIcon } from '../icons/SparkleIcon';
import CustomTooltip from '../common/CustomTooltip';
import { WatchOSIcon } from '../icons/WatchOSIcon';
import { BotIcon } from '../icons/BotIcon';
import { BluetoothIcon } from '../icons/BluetoothIcon';
import { WifiIcon } from '../icons/WifiIcon';
import { SignalIcon } from '../icons/SignalIcon';
import { NfcIcon } from '../icons/NfcIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { AppleHealthIcon } from '../icons/AppleHealthIcon';
import { SamsungHealthIcon } from '../icons/SamsungHealthIcon';

interface MemberHealthDashboardProps {
    isConnected: boolean;
    isConnecting: boolean;
    onConnect: () => void;
    onDisconnect?: () => void;
    healthData: HealthData;
    setHealthData: React.Dispatch<React.SetStateAction<HealthData>>;
}

const AnomalyAlert: React.FC<{ message: string; onAnalyze: () => void }> = ({ message, onAnalyze }) => (
    <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 flex items-start justify-between animate-pulse">
        <div className="flex items-start gap-3">
            <div className="p-2 bg-red-500/20 rounded-full text-red-500 mt-1">
                <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
                <h4 className="text-red-400 font-bold text-sm uppercase tracking-wider">Health Anomaly Detected</h4>
                <p className="text-white text-sm font-medium mt-1">{message}</p>
            </div>
        </div>
        <button 
            onClick={onAnalyze}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg flex items-center transition-all"
        >
            <SparkleIcon className="w-4 h-4 mr-2" /> AI Diagnose
        </button>
    </div>
);

const StrainGauge: React.FC<{ strain: number; recovery: number }> = ({ strain, recovery }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-xl border border-gray-700">
        <div className="relative h-24 w-24">
             <svg viewBox="0 0 36 36" className="w-full h-full">
                <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-blue-500" strokeDasharray={`${(strain/21)*100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-400 font-bold">STRAIN</span>
                <span className="text-xl font-black text-white">{strain.toFixed(1)}</span>
            </div>
        </div>
        <div className="w-full mt-3">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>RECOVERY</span>
                <span className={recovery > 66 ? 'text-green-400' : 'text-amber-400'}>{recovery}%</span>
            </div>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${recovery > 66 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${recovery}%` }}></div>
            </div>
        </div>
    </div>
);

const MemberHealthDashboard: React.FC<MemberHealthDashboardProps> = ({ isConnected, isConnecting, onConnect, onDisconnect, healthData, setHealthData }) => {
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [anomaly, setAnomaly] = useState<string | null>(null);
    
    // Virtual Device State for "Unified Dashboard"
    const [primarySource, setPrimarySource] = useState<'Apple' | 'Samsung'>('Apple');
    
    // Simulate extended metrics if not present in basic HealthData type (casting for demo)
    const extendedData = {
        strain: 14.5,
        recovery: 68,
        sleepStages: { deep: 95, rem: 110, light: 240, awake: 15 },
        ...healthData
    };

    const simulationIntervalRef = useRef<number | null>(null);

    // --- ANOMALY DETECTION ENGINE ---
    useEffect(() => {
        if (!isConnected) return;
        const checkAnomaly = setInterval(() => {
            const hr = healthData.heartRate.avg;
            if (hr > 110 && Math.random() > 0.85) { 
                setAnomaly(`Resting Heart Rate Spike (${hr} bpm) detected while sedentary.`);
            } else {
                setAnomaly(null);
            }
        }, 5000);
        return () => clearInterval(checkAnomaly);
    }, [healthData, isConnected]);

    // --- DATA STREAM SIMULATION ---
    useEffect(() => {
        if (!isConnected) return;
        
        simulationIntervalRef.current = window.setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            setHealthData(prev => {
                const noise = Math.random() * 5 - 2.5;
                const baseHr = 75;
                const variability = Math.sin(now.getTime() / 1000) * 15; 
                const hr = Math.floor(baseHr + Math.abs(variability) + noise);
                
                const newHistoryPoint = { time: timeStr, value: hr };
                const newHistory = [...prev.heartRate.history.slice(-29), newHistoryPoint]; 

                return {
                    ...prev,
                    steps: prev.steps + (hr > 90 ? 2 : 0),
                    caloriesBurned: parseFloat((prev.caloriesBurned + (hr / 2000) * 8).toFixed(2)),
                    heartRate: { ...prev.heartRate, avg: hr, history: newHistory }
                };
            });
        }, 1000);

        return () => {
            if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        };
    }, [isConnected]);

    const handleAnalyzeAnomaly = async () => {
        if (!anomaly) return;
        setIsAnalyzing(true);
        const prompt = `
            Act as a Medical AI Assistant.
            ALERT: ${anomaly}
            Context: User is currently at the gym.
            Vital Signs: HR ${healthData.heartRate.avg} bpm.
            Suggest an immediate action (e.g. "Sit down", "Hydrate").
        `;
        try {
            const advice = await getComplexResponse(prompt);
            setAiAnalysis(advice);
        } catch (e) {
            setAiAnalysis("Network error. Please consult a trainer immediately.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Unified Dashboard Header */}
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        <div className="bg-gray-800 p-2.5 rounded-lg border border-gray-700">
                             {primarySource === 'Apple' ? <AppleHealthIcon className="w-6 h-6 text-white"/> : <SamsungHealthIcon className="w-6 h-6 text-blue-400"/>}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-none">Super App Connectivity</h2>
                        <p className="text-[10px] text-gray-500 mt-1">Synced with Android, iOS, & Wearables</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-black/40 rounded border border-gray-700 text-center">
                        <p className="text-[9px] text-gray-500 uppercase">Integrity</p>
                        <p className="text-xs font-bold text-green-400">100%</p>
                    </div>
                </div>
            </div>

            {/* Anomaly Alert Section */}
            {anomaly && (
                <AnomalyAlert message={anomaly} onAnalyze={handleAnalyzeAnomaly} />
            )}

            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="relative overflow-hidden border-t-2 border-red-500 bg-gray-800/60">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pulse</p>
                        <HeartRateIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{healthData.heartRate.avg}</span>
                        <span className="text-sm text-gray-500">BPM</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">Source: Android Health</p>
                </Card>

                <Card className="relative overflow-hidden border-t-2 border-orange-500 bg-gray-800/60">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Burn</p>
                        <CaloriesIcon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">{Math.floor(healthData.caloriesBurned)}</span>
                        <span className="text-sm text-gray-500">kcal</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">Active Energy</p>
                </Card>

                {/* Strain Gauge (Wearable) */}
                <div className="lg:col-span-1">
                    <StrainGauge strain={extendedData.strain} recovery={extendedData.recovery} />
                </div>

                {/* Sleep Architecture (iOS) */}
                <Card className="relative overflow-hidden border-t-2 border-indigo-500 bg-gray-800/60 p-0">
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Sleep Arch</p>
                            <AppleHealthIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="h-16 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[extendedData.sleepStages]} layout="vertical" stackOffset="expand">
                                    <XAxis type="number" hide />
                                    <YAxis type="category" hide />
                                    <Tooltip content={<CustomTooltip />} cursor={false}/>
                                    <Bar dataKey="deep" stackId="a" fill="#312e81" />
                                    <Bar dataKey="rem" stackId="a" fill="#4338ca" />
                                    <Bar dataKey="light" stackId="a" fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Deep</span>
                            <span>REM</span>
                            <span>Light</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Live Chart */}
            <div className="grid grid-cols-1 gap-6">
                <Card title="Live Biometric Pulse (Samsung Health)">
                    <div className="h-[250px] w-full min-w-0 relative">
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
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MemberHealthDashboard;
