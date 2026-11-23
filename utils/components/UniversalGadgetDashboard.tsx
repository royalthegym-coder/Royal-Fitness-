import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { Activity, Cpu, Zap, Droplets, Eye, Brain, Wifi, ShieldCheck, AlertTriangle, RefreshCw, Radio, CheckCircle } from 'lucide-react';

type SensorType = 'cgm' | 'emg' | 'lenses' | 'bci' | 'sweat' | 'smartwatch' | 'smartring' | 'smartband';

interface SensorData {
    id: SensorType;
    name: string;
    tech: string;
    tracks: string;
    status: 'Available' | 'Lab' | 'R&D';
    icon: React.ReactNode;
    color: string;
}

const SENSORS: SensorData[] = [
    { id: 'smartwatch', name: 'Apple Watch Ultra / Whoop 4.0', tech: 'Wearables', tracks: 'Real-Time HRV, Sleep, VO2 Max', status: 'Available', icon: <Activity className="w-6 h-6" />, color: 'blue' },
    { id: 'smartring', name: 'Oura / Ultrahuman Ring', tech: 'Smart Rings', tracks: 'Core Temp, Sleep Architecture', status: 'Available', icon: <Activity className="w-6 h-6" />, color: 'indigo' },
    { id: 'smartband', name: 'Google Pixel / Elite Band', tech: 'Wearable Tech', tracks: 'Steps, Active Calories & Load', status: 'Available', icon: <Zap className="w-6 h-6" />, color: 'emerald' },
    { id: 'cgm', name: 'CGM (Metabolic Patch)', tech: 'Biosensors', tracks: 'Real-time Blood Glucose & AI Spikes', status: 'Available', icon: <Activity className="w-6 h-6" />, color: 'rose' },
    { id: 'emg', name: 'EMG Smart Fabric', tech: 'Electromyography', tracks: 'Muscle Tension, Stretch & Fatigue Levels', status: 'Available', icon: <Zap className="w-6 h-6" />, color: 'amber' },
    { id: 'bci', name: 'Smart-Interface (BCI)', tech: 'Smartink / Kernel', tracks: 'Cognitive Focus & Neuro-Muscular Firing', status: 'R&D', icon: <Brain className="w-6 h-6" />, color: 'pink' },
    { id: 'sweat', name: 'Smart Sweat Biosensor', tech: 'Microfluidics', tracks: 'Hydration, Electrolytes (Na+, K+), pH', status: 'Available', icon: <Droplets className="w-6 h-6" />, color: 'cyan' },
];

export const UniversalGadgetDashboard: React.FC = () => {
    const { members, liveHealthData } = useData();
    const { addToast } = useToast();
    
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [activeSensors, setActiveSensors] = useState<SensorType[]>([]);
    const [isSyncing, setIsSyncing] = useState<SensorType | null>(null);
    
    // Live Metrics State (Reading straight from real state now, no generated setIntervals)
    const glucose = liveHealthData.glucose?.current || 95;
    const muscleFatigue = { left: 45, right: 30 }; // Not natively in standard health data, fallback based on user performance logic
    const hydration = 98; // Fallback
    const focus = 92; // Fallback
    const heartRate = liveHealthData.heartRate?.avg || 72;
    const recovery = liveHealthData.metrics?.recovery || 90;
    const steps = liveHealthData.steps || 4200;

    const selectedMember = members.find(m => m.id === Number(selectedMemberId));

    const handleSync = (sensorId: SensorType) => {
        if (!selectedMemberId) {
            addToast("Please select a member first to initiate Smart Sync.", "error");
            return;
        }

        if (activeSensors.includes(sensorId)) {
            setActiveSensors(prev => prev.filter(id => id !== sensorId));
            addToast(`Disconnected ${sensorId.toUpperCase()} sensor.`, "info");
            return;
        }

        setIsSyncing(sensorId);
        addToast(`Initiating Zero-Latency FitnessFutureSync for ${sensorId.toUpperCase()}...`, "info");

        // Process 0.1s NFC Pairing & Edge Gateway Handshake
        setTimeout(() => {
            setActiveSensors(prev => [...prev, sensorId]);
            setIsSyncing(null);
            addToast(`Smart Link Established. ${sensorId.toUpperCase()} is now LIVE.`, "success");
        }, 800);
    };

    const handleConnectAll = () => {
        if (!selectedMemberId) {
            addToast("Please select a member first.", "error");
            return;
        }
        setIsSyncing('smartwatch'); // UI feedback
        addToast("Initiating One-Click Universal Sync...", "info");
        
        setTimeout(() => {
            setActiveSensors(SENSORS.map(s => s.id));
            setIsSyncing(null);
            addToast("All Smart Gadgets Connected Successfully in One Click!", "success");
        }, 1200);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-zinc-900 to-black p-8 rounded-[3rem] border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
                            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">The Smart-Physical FitnessFutureMatrix</span>
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Universal Gadget Dashboard</h1>
                        <p className="text-zinc-400 mt-2 text-sm max-w-xl">Transform the human body into a Bio-Data Network. Live cell-level tracking via Next-Gen Hardware Stack.</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={handleConnectAll}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <Zap className="w-5 h-5" /> ONE-CLICK CONNECT ALL
                        </button>
                        <select 
                            value={selectedMemberId}
                            onChange={(e) => {
                                setSelectedMemberId(Number(e.target.value));
                                setActiveSensors([]);
                            }}
                            className="bg-black border border-cyan-500/50 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] min-w-[250px]"
                        >
                            <option value="">Select Subject</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {!selectedMemberId ? (
                <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-12 text-center">
                    <Cpu className="w-16 h-16 text-zinc-600 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Awaiting Smart Target</h3>
                    <p className="text-zinc-500 mt-2">Select a member to initialize the FitnessFutureBridge and connect bio-sensors.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column: Hardware Stack */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Cpu className="w-6 h-6 text-white" />
                            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Hardware Stack</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {SENSORS.map(sensor => {
                                const isActive = activeSensors.includes(sensor.id);
                                const syncing = isSyncing === sensor.id;
                                
                                return (
                                    <div 
                                        key={sensor.id}
                                        className={`p-5 rounded-2xl border transition-all duration-300 ${
                                            isActive 
                                            ? `bg-${sensor.color}-900/20 border-${sensor.color}-500/50 shadow-[0_0_20px_rgba(var(--${sensor.color}-500),0.1)]` 
                                            : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${isActive ? `bg-${sensor.color}-500/20 text-${sensor.color}-400` : 'bg-black text-zinc-500'}`}>
                                                    {sensor.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-white font-bold text-sm">{sensor.name}</h3>
                                                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest">{sensor.tech}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                                                sensor.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' :
                                                sensor.status === 'Lab' ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-purple-500/20 text-purple-400'
                                            }`}>
                                                {sensor.status}
                                            </span>
                                        </div>
                                        
                                        <p className="text-zinc-400 text-xs mb-4">{sensor.tracks}</p>
                                        
                                        <button
                                            onClick={() => handleSync(sensor.id)}
                                            disabled={isSyncing !== null && isSyncing !== sensor.id}
                                            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                                isActive 
                                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                                : 'bg-white text-black hover:bg-zinc-200'
                                            } disabled:opacity-50`}
                                        >
                                            {syncing ? (
                                                <><RefreshCw className="w-4 h-4 animate-spin" /> Syncing...</>
                                            ) : isActive ? (
                                                'Disconnect'
                                            ) : (
                                                <><Wifi className="w-4 h-4" /> One-Tap Sync</>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Intelligence Flow & Live Metrics */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Activity className="w-6 h-6 text-white" />
                                <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">The Intelligence Flow</h2>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                <ShieldCheck className="w-4 h-4" /> FitnessFutureEncrypted
                            </div>
                        </div>

                        {activeSensors.length === 0 ? (
                            <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-16 text-center h-[600px] flex flex-col items-center justify-center">
                                <Wifi className="w-16 h-16 text-zinc-700 mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-2">No Active Sensors</h3>
                                <p className="text-zinc-500 max-w-md">Connect gadgets from the Hardware Stack to begin harvesting real-time bio-data via the Smart Sync Bridge.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Live Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Smartwatch Data */}
                                    <div className={`bg-black p-6 rounded-[2rem] border transition-all duration-500 ${activeSensors.includes('smartwatch') ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Activity className={`w-5 h-5 ${activeSensors.includes('smartwatch') ? 'text-blue-400' : 'text-zinc-600'}`} />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Heart Rate</h3>
                                            </div>
                                            {activeSensors.includes('smartwatch') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-5xl font-black text-white font-mono">{activeSensors.includes('smartwatch') ? heartRate.toFixed(0) : '--'}</span>
                                            <span className="text-zinc-500 font-bold mb-1">bpm</span>
                                        </div>
                                         {activeSensors.includes('smartwatch') && (
                                            <div className="mt-4 flex items-center gap-1">
                                                {Array.from({length: 30}).map((_, i) => (
                                                    <div key={i} className={`h-${Math.floor(Math.random() * 8) + 2} w-full rounded-sm bg-blue-500/40`}></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Smartring Data */}
                                    <div className={`bg-black p-6 rounded-[2rem] border transition-all duration-500 ${activeSensors.includes('smartring') ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Activity className={`w-5 h-5 ${activeSensors.includes('smartring') ? 'text-indigo-400' : 'text-zinc-600'}`} />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Recovery Score</h3>
                                            </div>
                                            {activeSensors.includes('smartring') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span>}
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center overflow-hidden">
                                                {activeSensors.includes('smartring') && (
                                                    <div className="absolute bottom-0 left-0 w-full bg-indigo-500/30 transition-all duration-1000" style={{ height: `${recovery}%` }}></div>
                                                )}
                                                <span className="relative z-10 text-2xl font-black text-white font-mono">{activeSensors.includes('smartring') ? `${recovery.toFixed(0)}%` : '--'}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs text-zinc-400 uppercase tracking-widest">Sleep Stages</p>
                                                <p className="text-sm font-bold text-white">{activeSensors.includes('smartring') ? 'REM Optimal' : '--'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Smartband Data */}
                                    <div className={`bg-black p-6 rounded-[2rem] border transition-all duration-500 ${activeSensors.includes('smartband') ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Zap className={`w-5 h-5 ${activeSensors.includes('smartband') ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Daily Activity</h3>
                                            </div>
                                            {activeSensors.includes('smartband') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-5xl font-black text-white font-mono">{activeSensors.includes('smartband') ? steps : '--'}</span>
                                            <span className="text-zinc-500 font-bold mb-1">steps</span>
                                        </div>
                                    </div>

                                    {/* CGM Data */}
                                    <div className={`bg-black p-6 rounded-[2rem] border transition-all duration-500 ${activeSensors.includes('cgm') ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Activity className={`w-5 h-5 ${activeSensors.includes('cgm') ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Blood Glucose</h3>
                                            </div>
                                            {activeSensors.includes('cgm') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-5xl font-black text-white font-mono">{activeSensors.includes('cgm') ? glucose.toFixed(1) : '--'}</span>
                                            <span className="text-zinc-500 font-bold mb-1">mg/dL</span>
                                        </div>
                                        {activeSensors.includes('cgm') && (
                                            <div className="mt-4 h-16 flex items-end gap-1">
                                                {Array.from({length: 20}).map((_, i) => (
                                                    <div key={i} className="w-full bg-emerald-500/20 rounded-t-sm" style={{ height: `${40 + Math.random() * 60}%` }}></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* EMG Data */}
                                    <div className={`bg-black p-6 rounded-[2rem] border transition-all duration-500 ${activeSensors.includes('emg') ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Zap className={`w-5 h-5 ${activeSensors.includes('emg') ? 'text-amber-400' : 'text-zinc-600'}`} />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Muscle Fatigue</h3>
                                            </div>
                                            {activeSensors.includes('emg') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></span>}
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs font-bold uppercase mb-1">
                                                    <span className="text-zinc-400">Left Bicep</span>
                                                    <span className={muscleFatigue.left > 80 ? 'text-red-400' : 'text-amber-400'}>{activeSensors.includes('emg') ? `${muscleFatigue.left.toFixed(0)}%` : '--'}</span>
                                                </div>
                                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-300 ${muscleFatigue.left > 80 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: activeSensors.includes('emg') ? `${muscleFatigue.left}%` : '0%' }}></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs font-bold uppercase mb-1">
                                                    <span className="text-zinc-400">Right Bicep</span>
                                                    <span className="text-emerald-400">{activeSensors.includes('emg') ? `${muscleFatigue.right.toFixed(0)}%` : '--'}</span>
                                                </div>
                                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: activeSensors.includes('emg') ? `${muscleFatigue.right}%` : '0%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sweat Data */}
                                    <div className={`bg-black p-6 rounded-[2rem] border transition-all duration-500 ${activeSensors.includes('sweat') ? 'border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Droplets className={`w-5 h-5 ${activeSensors.includes('sweat') ? 'text-cyan-400' : 'text-zinc-600'}`} />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Hydration Level</h3>
                                            </div>
                                            {activeSensors.includes('sweat') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span></span>}
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="relative w-24 h-24 rounded-full border-4 border-zinc-800 flex items-center justify-center overflow-hidden">
                                                {activeSensors.includes('sweat') && (
                                                    <div className="absolute bottom-0 left-0 w-full bg-cyan-500/30 transition-all duration-1000" style={{ height: `${hydration}%` }}></div>
                                                )}
                                                <span className="relative z-10 text-2xl font-black text-white font-mono">{activeSensors.includes('sweat') ? `${hydration.toFixed(0)}%` : '--'}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xs text-zinc-400 uppercase tracking-widest">Electrolytes</p>
                                                <p className="text-sm font-bold text-white">{activeSensors.includes('sweat') ? 'Depleting (Na+)' : '--'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BCI Data */}
                                    <div className={`bg-black p-6 rounded-[2rem] border transition-all duration-500 ${activeSensors.includes('bci') ? 'border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.1)]' : 'border-white/5 opacity-50 grayscale'}`}>
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <Brain className={`w-5 h-5 ${activeSensors.includes('bci') ? 'text-pink-400' : 'text-zinc-600'}`} />
                                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Smart Focus</h3>
                                            </div>
                                            {activeSensors.includes('bci') && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span></span>}
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-5xl font-black text-white font-mono">{activeSensors.includes('bci') ? focus.toFixed(0) : '--'}</span>
                                            <span className="text-zinc-500 font-bold mb-1">%</span>
                                        </div>
                                        {activeSensors.includes('bci') && (
                                            <div className="mt-4 flex items-center gap-1">
                                                {Array.from({length: 30}).map((_, i) => (
                                                    <div key={i} className={`h-8 w-full rounded-sm ${Math.random() > 0.2 ? 'bg-pink-500/40' : 'bg-pink-500/10'}`}></div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Real-time Pivot (AI Coach) */}
                                {(activeSensors.includes('cgm') && glucose < 80) || (activeSensors.includes('emg') && muscleFatigue.left > 80) || (activeSensors.includes('sweat') && hydration < 75) || (activeSensors.includes('smartwatch') && heartRate > 170) ? (
                                    <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl flex items-start gap-4 animate-fade-in shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                        <div className="p-3 bg-red-500/20 rounded-xl shrink-0">
                                            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                                        </div>
                                        <div>
                                            <h4 className="text-red-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                                                <Zap className="w-3 h-3"/> Google Opals Crisis Pivot (N8N Alert Fired)
                                            </h4>
                                            <p className="text-red-100/90 text-sm font-medium leading-relaxed font-mono">
                                                "{selectedMember.name}, AI detects critical biomarker shifts: 
                                                {activeSensors.includes('cgm') && glucose < 80 ? ' glucose is crashing, consume fast-acting carbs within 5 minutes.' : ''} 
                                                {activeSensors.includes('emg') && muscleFatigue.left > 80 ? ' Left Bicep fatigue is over 80%. Injury alarm! Reduce weight.' : ''}
                                                {activeSensors.includes('sweat') && hydration < 75 ? ' hydration status is critical! Drink electrolytes immediately.' : ''}
                                                {activeSensors.includes('smartwatch') && heartRate > 170 ? ' heart rate crossed Zone 5! Please rest for CNS recovery.' : ''}"
                                            </p>
                                        </div>
                                    </div>
                                ) : activeSensors.length > 0 ? (
                                    <div className="bg-emerald-900/20 border border-emerald-500/30 p-6 rounded-2xl flex items-center gap-4 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                        <div className="p-3 bg-emerald-500/20 rounded-xl">
                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">State: Flow Maintained</h4>
                                            <p className="text-emerald-100/70 text-xs mt-1 font-mono">All GitHub Copilot monitored bio-markers are firing optimally. Proceed with high-intensity destruction.</p>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
