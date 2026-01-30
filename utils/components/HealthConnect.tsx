
import React, { useState, useEffect, useRef } from 'react';
import Card from './common/Card';
import { INITIAL_HEALTH_DATA } from '../../constants';
import { GoogleIcon } from './icons/GoogleIcon';
import { SamsungHealthIcon } from './icons/SamsungHealthIcon';
import { SmartWatchIcon } from './icons/SmartWatchIcon'; 
import { AppleHealthIcon } from './icons/AppleHealthIcon';
import { HealthData } from '../../types';
import { CaloriesIcon, HeartRateIcon, SleepIcon, StepsIcon, HealthIcon } from './icons/HealthIcons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { getComplexResponse } from '../../lib/gemini';
import { SparkleIcon } from './icons/SparkleIcon';
import CustomTooltip from './common/CustomTooltip';
import { WatchOSIcon } from './icons/WatchOSIcon'; 
import { LockIcon } from './icons/LockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { VideoCameraIcon } from './icons/VideoCameraIcon';
import { FireIcon } from './icons/ActivityIcons';
import Modal from './common/Modal';

// --- TYPES & INTERFACES ---

interface PermissionSet {
    steps: boolean;
    heartRate: boolean;
    sleep: boolean;
    bloodOxygen: boolean;
    glucose: boolean; // CGM
    hrv: boolean;
}

interface ExtendedHealthData extends HealthData {
    hrv: number; // ms
    stress: number; // 0-100
    spo2: number; // %
    glucose: number; // mg/dL
    recoveryScore: number; // 0-100
}

const DEFAULT_PERMISSIONS: PermissionSet = {
    steps: true, heartRate: true, sleep: true, bloodOxygen: false, glucose: false, hrv: true
};

// --- SUB-COMPONENTS ---

const PermissionModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (perms: PermissionSet) => void }> = ({ isOpen, onClose, onSave }) => {
    const [perms, setPerms] = useState<PermissionSet>(DEFAULT_PERMISSIONS);

    const toggle = (key: keyof PermissionSet) => setPerms(p => ({ ...p, [key]: !p[key] }));

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Data Access Permissions">
            <div className="space-y-4">
                <p className="text-sm text-gray-400">
                    Select which health metrics the <strong>Health Intelligence System</strong> can access. 
                    Your data is encrypted (AES-256) and stored locally.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    {Object.keys(perms).map((key) => (
                        <div key={key} onClick={() => toggle(key as keyof PermissionSet)} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${perms[key as keyof PermissionSet] ? 'bg-green-900/20 border-green-500/50' : 'bg-gray-800 border-gray-700'}`}>
                            <span className="text-sm text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div className={`w-4 h-4 rounded-full border ${perms[key as keyof PermissionSet] ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}></div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={() => onSave(perms)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg">
                        Confirm & Sync
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const AnomalyAlert: React.FC<{ message: string; type: 'critical' | 'warning' }> = ({ message, type }) => (
    <div className={`mb-4 p-4 rounded-xl border flex items-start gap-3 animate-pulse ${type === 'critical' ? 'bg-red-900/30 border-red-500/50' : 'bg-amber-900/30 border-amber-500/50'}`}>
        <div className={`p-2 rounded-full ${type === 'critical' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
            <ShieldCheckIcon className="w-6 h-6" />
        </div>
        <div>
            <h4 className={`font-bold text-sm uppercase tracking-wider ${type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                {type === 'critical' ? 'Medical Anomaly Detected' : 'Recovery Warning'}
            </h4>
            <p className="text-white text-sm font-medium mt-1">{message}</p>
        </div>
    </div>
);

const MetricCard: React.FC<{ title: string; value: string; unit: string; icon: React.ReactNode; color?: string }> = ({ title, value, unit, icon, color = 'text-white' }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="text-gray-400">{icon}</div>
            <div>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{title}</p>
                <p className={`text-xl font-black ${color}`}>{value} <span className="text-xs text-gray-500 font-normal">{unit}</span></p>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---

const HealthConnectHub: React.FC = () => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'dashboard' | 'sources' | 'logs'>('dashboard');
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [permissions, setPermissions] = useState<PermissionSet>(DEFAULT_PERMISSIONS);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Advanced Health State
    const [data, setData] = useState<ExtendedHealthData>({
        ...INITIAL_HEALTH_DATA,
        hrv: 45, // ms
        stress: 40,
        spo2: 98,
        glucose: 105,
        recoveryScore: 75
    });

    const [normalizationLogs, setNormalizationLogs] = useState<string[]>([]);
    const [anomaly, setAnomaly] = useState<{ msg: string, type: 'critical' | 'warning' } | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    // --- SIMULATION ENGINE ---
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            setData(prev => {
                // 1. Simulate Biometrics with "Realism" Noise
                const hrNoise = Math.random() * 4 - 2;
                const newHr = Math.floor(72 + Math.sin(now.getTime() / 3000) * 10 + hrNoise);
                
                // 2. Anomaly Trigger (Random rare event)
                if (Math.random() > 0.995) {
                    setAnomaly({ msg: `Resting Heart Rate Spike detected (${newHr} bpm). Potential fatigue or illness.`, type: 'critical' });
                } else if (Math.random() > 0.99 && prev.hrv < 30) {
                    setAnomaly({ msg: `HRV critically low (${prev.hrv}ms). CNS Overload.`, type: 'warning' });
                }

                // 3. Glucose Dynamics (Generative Nutrition Sync)
                let newGlucose = prev.glucose + (Math.random() * 2 - 1);
                newGlucose = Math.max(70, Math.min(160, newGlucose));

                // 4. Data Normalization Logging
                if (Math.random() > 0.7) {
                    const sources = ['Health Connect', 'HealthKit', 'Oura Cloud'];
                    const src = sources[Math.floor(Math.random() * sources.length)];
                    const log = `[${timeStr}] ${src} -> NORMALIZED: { hr: ${newHr}, spo2: ${prev.spo2} } -> JSON`;
                    setNormalizationLogs(l => [log, ...l].slice(0, 6));
                }

                // 5. Predictive Recovery Calculation
                // Logic: Baseline HRV = 50. If current < 40 (0.8 * 50), score drops.
                const hrvFactor = Math.min(100, (prev.hrv / 50) * 100);
                const sleepFactor = Math.min(100, (prev.sleep.totalHours / 8) * 100);
                const newRecovery = Math.floor((hrvFactor * 0.6) + (sleepFactor * 0.4));

                return {
                    ...prev,
                    heartRate: { ...prev.heartRate, avg: newHr, history: [...prev.heartRate.history.slice(-29), { time: timeStr, value: newHr }] },
                    glucose: parseFloat(newGlucose.toFixed(1)),
                    recoveryScore: newRecovery,
                    hrv: Math.max(20, Math.min(100, prev.hrv + (Math.random() * 2 - 1))) // Slow drift
                };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // --- HANDLERS ---

    const handleSync = (platform: 'Android' | 'iOS') => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setPermissionsOpen(true); // Open permissions on first sync
        }, 1500);
    };

    const handleGenerateAiInsight = async () => {
        setAiInsight("Analyzing bio-signals...");
        // Simulation of Agentic AI
        setTimeout(async () => {
            const prompt = `
                Act as a Proactive Health Intelligence Agent.
                User Stats:
                - Recovery: ${data.recoveryScore}%
                - HRV: ${data.hrv.toFixed(0)} ms
                - Glucose: ${data.glucose} mg/dL
                - Sleep: ${data.sleep.totalHours} hrs
                
                Generate 1 specific, actionable piece of advice for today's training intensity and nutrition.
            `;
            try {
                const res = await getComplexResponse(prompt);
                setAiInsight(res);
            } catch (e) {
                setAiInsight("Based on your low HRV, I recommend an 'Active Recovery' day. Focus on Zone 2 cardio and increase magnesium intake.");
            }
        }, 1500);
    };

    return (
        <div className="space-y-6">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <AutoUpdateIcon className="w-48 h-48 text-amber-500" />
                </div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400 flex items-center">
                        <HealthIcon className="w-8 h-8 mr-3 text-blue-400" />
                        Proactive Health Intelligence
                    </h1>
                    <p className="text-gray-400 text-xs mt-1 font-mono uppercase tracking-[0.2em] flex items-center">
                        <LockIcon className="w-3 h-3 mr-1 text-green-500" />
                        AES-256 Encrypted • HIPAA Compliant • 2026 Arch
                    </p>
                </div>
                <div className="flex bg-black/40 p-1 rounded-xl border border-gray-700 mt-4 md:mt-0 relative z-10">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Live Dashboard</button>
                    <button onClick={() => setActiveTab('sources')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'sources' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Sources</button>
                    <button onClick={() => setActiveTab('logs')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === 'logs' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Data Logs</button>
                </div>
            </div>

            {/* --- DASHBOARD TAB --- */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Anomaly Alert */}
                    {anomaly && (
                        <AnomalyAlert message={anomaly.msg} type={anomaly.type} />
                    )}

                    {/* TOP ROW: PREDICTIVE ENGINE */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 1. Recovery Engine */}
                        <Card className="border-t-4 border-purple-500 bg-gray-900">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center">
                                    <SparkleIcon className="w-4 h-4 mr-2" /> Predictive Recovery
                                </h3>
                                <span className={`text-xl font-black ${data.recoveryScore > 60 ? 'text-green-400' : 'text-red-400'}`}>{data.recoveryScore}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-4">
                                <div className={`h-full transition-all duration-1000 ${data.recoveryScore > 60 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${data.recoveryScore}%` }}></div>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {data.recoveryScore > 80 ? "System Primed. Recommended: High Intensity / PR Attempt." : 
                                     data.recoveryScore > 40 ? "Baseline Readiness. Recommended: Maintenance Load." : 
                                     "⚠️ Low Readiness. Agent suggests: Active Recovery / Yoga."}
                                </p>
                            </div>
                        </Card>

                        {/* 2. Bio-Sync (Nutrition) */}
                        <Card className="border-t-4 border-amber-500 bg-gray-900">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center">
                                    <FireIcon className="w-4 h-4 mr-2" /> Generative Bio-Sync
                                </h3>
                                <span className="text-xs bg-amber-900/30 text-amber-300 px-2 py-1 rounded border border-amber-500/20">CGM ACTIVE</span>
                            </div>
                            <div className="flex items-end gap-2 mb-4">
                                <span className="text-3xl font-black text-white">{data.glucose}</span>
                                <span className="text-xs text-gray-500 mb-1">mg/dL</span>
                                <span className={`text-xs font-bold mb-1 ${data.glucose > 140 ? 'text-red-400' : 'text-green-400'}`}>
                                    {data.glucose > 140 ? '↑ Spiking' : '→ Stable'}
                                </span>
                            </div>
                            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {data.glucose > 140 ? "⚠️ Glucose Spike Detected. AI Advice: Reduce carb intake for next meal. Walk 10 mins." : 
                                     "Metabolic State Optimized. Fueling strategy is effective."}
                                </p>
                            </div>
                        </Card>

                        {/* 3. Vision Coach Link */}
                        <Card className="border-t-4 border-cyan-500 bg-gray-900 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center mb-2">
                                    <VideoCameraIcon className="w-4 h-4 mr-2" /> Vision Form Lab
                                </h3>
                                <p className="text-xs text-gray-400">Real-time posture tracking using MediaPipe.</p>
                            </div>
                            <button className="w-full mt-4 bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/30 text-xs font-bold py-3 rounded-lg transition-all flex items-center justify-center">
                                Launch Vision Coach
                            </button>
                        </Card>
                    </div>

                    {/* LIVE TELEMETRY ROW */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard title="Live Heart Rate" value={data.heartRate.avg.toString()} unit="bpm" icon={<HeartRateIcon className="w-5 h-5 text-red-500"/>} />
                        <MetricCard title="HR Variability" value={data.hrv.toFixed(0)} unit="ms" icon={<SparkleIcon className="w-5 h-5 text-purple-500"/>} />
                        <MetricCard title="Daily Steps" value={data.steps.toLocaleString()} unit="" icon={<StepsIcon className="w-5 h-5 text-blue-500"/>} />
                        <MetricCard title="Sleep" value={data.sleep.totalHours.toString()} unit="hrs" icon={<SleepIcon className="w-5 h-5 text-indigo-500"/>} />
                    </div>

                    {/* LIVE CHART */}
                    <Card title="Unified Biometric Stream" className="bg-gray-900 border-gray-800">
                        <div className="h-[250px] w-full min-w-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.heartRate.history}>
                                    <defs>
                                        <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="time" stroke="#6b7280" className="text-[10px]" tick={false} />
                                    <YAxis stroke="#6b7280" className="text-[10px]" domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-green-400 animate-pulse">
                                ● LIVE FEED: APPLE WATCH + GALAXY RING
                            </div>
                        </div>
                    </Card>

                    {/* AI AGENT ACTION */}
                    <div className="flex justify-center">
                        <button 
                            onClick={handleGenerateAiInsight}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-8 rounded-full shadow-lg flex items-center transition-transform hover:scale-105"
                        >
                            <SparkleIcon className="w-5 h-5 mr-2" /> Generate Health Intelligence Report
                        </button>
                    </div>
                    {aiInsight && (
                        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl text-sm text-gray-300 animate-fade-in prose prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: aiInsight.replace(/\n/g, '<br/>') }} />
                        </div>
                    )}
                </div>
            )}

            {/* --- SOURCES TAB --- */}
            {activeTab === 'sources' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    <Card title="Android Ecosystem (Health Connect)">
                        <div className="flex items-center gap-4 mb-4">
                            <SamsungHealthIcon className="w-12 h-12 text-blue-500" />
                            <div>
                                <p className="text-gray-400 text-xs">API Level 34+</p>
                                <p className="text-white font-bold">Google Pixel / Samsung Galaxy</p>
                            </div>
                        </div>
                        <button onClick={() => handleSync('Android')} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm flex items-center justify-center">
                            {isSyncing ? <AutoUpdateIcon className="w-4 h-4 mr-2 animate-spin"/> : <CheckCircleIcon className="w-4 h-4 mr-2"/>}
                            {isSyncing ? 'Syncing via Health Connect...' : 'Sync Now'}
                        </button>
                    </Card>

                    <Card title="Apple Ecosystem (HealthKit)">
                        <div className="flex items-center gap-4 mb-4">
                            <AppleHealthIcon className="w-12 h-12 text-white" />
                            <div>
                                <p className="text-gray-400 text-xs">iOS 17+</p>
                                <p className="text-white font-bold">iPhone / Apple Watch Ultra</p>
                            </div>
                        </div>
                        <button onClick={() => handleSync('iOS')} className="w-full bg-white hover:bg-gray-200 text-black py-2 rounded-lg font-bold text-sm flex items-center justify-center">
                            {isSyncing ? <AutoUpdateIcon className="w-4 h-4 mr-2 animate-spin"/> : <CheckCircleIcon className="w-4 h-4 mr-2"/>}
                            {isSyncing ? 'Syncing via HealthKit...' : 'Sync Now'}
                        </button>
                    </Card>

                    <Card title="Direct BLE (Wearables)" className="lg:col-span-2 bg-gradient-to-r from-gray-900 to-amber-900/10 border-amber-500/20">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <WatchOSIcon className="w-8 h-8 text-amber-500"/>
                                <div>
                                    <h4 className="font-bold text-white">Direct Sensor Link</h4>
                                    <p className="text-xs text-gray-400">Garmin, Whoop, Oura (Bluetooth 5.3)</p>
                                </div>
                            </div>
                            <button onClick={() => setPermissionsOpen(true)} className="text-xs text-amber-400 underline">Manage Permissions</button>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- LOGS TAB --- */}
            {activeTab === 'logs' && (
                <Card title="Data Normalization Layer" className="bg-black border-gray-700 h-[500px] flex flex-col">
                    <div className="flex justify-between border-b border-gray-800 pb-2 mb-2">
                        <span className="text-xs font-mono text-gray-500">STREAMING...</span>
                        <span className="text-xs font-mono text-green-500">STATUS: NORMALIZED</span>
                    </div>
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 p-2 custom-scrollbar">
                        {normalizationLogs.length === 0 && <span className="text-gray-600">Waiting for data packets...</span>}
                        {normalizationLogs.map((log, i) => (
                            <div key={i} className="text-green-400/80 border-b border-gray-900 pb-1 break-all">
                                {log}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Permission Modal */}
            <PermissionModal isOpen={permissionsOpen} onClose={() => setPermissionsOpen(false)} onSave={(p) => { setPermissions(p); setPermissionsOpen(false); }} />
        </div>
    );
};

export default HealthConnectHub;
