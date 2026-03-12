import React, { useState, useEffect } from 'react';
import { Activity, Cpu, Droplets, Eye, Zap, Wifi, Bluetooth, Link, ShieldCheck, AlertTriangle, RefreshCw, BrainCircuit } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface Sensor {
    id: string;
    name: string;
    type: string;
    description: string;
    status: 'Disconnected' | 'Scanning' | 'Connected';
    icon: React.ReactNode;
    metrics: { label: string; value: string | number; unit: string; color: string }[];
}

export const UniversalGadgetDashboard: React.FC = () => {
    const { addToast } = useToast();
    
    const [sensors, setSensors] = useState<Sensor[]>([
        {
            id: 'cgm_01',
            name: 'CGM Metabolic Patch',
            type: 'Biosensor',
            description: 'Real-time blood glucose & metabolic response.',
            status: 'Disconnected',
            icon: <Activity className="w-6 h-6 text-rose-500" />,
            metrics: [
                { label: 'Glucose', value: '--', unit: 'mg/dL', color: 'text-rose-400' },
                { label: 'Trend', value: '--', unit: '', color: 'text-zinc-400' }
            ]
        },
        {
            id: 'emg_01',
            name: 'EMG Smart Fabric',
            type: 'Electromyography',
            description: 'Muscle tension and fatigue tracking.',
            status: 'Disconnected',
            icon: <Zap className="w-6 h-6 text-amber-500" />,
            metrics: [
                { label: 'L-Bicep Firing', value: '--', unit: '%', color: 'text-amber-400' },
                { label: 'Fatigue Index', value: '--', unit: '', color: 'text-zinc-400' }
            ]
        },
        {
            id: 'bci_01',
            name: 'Neural-Interface (BCI)',
            type: 'Brain-Computer Interface',
            description: 'Focus and neuro-muscular firing rate.',
            status: 'Disconnected',
            icon: <BrainCircuit className="w-6 h-6 text-purple-500" />,
            metrics: [
                { label: 'CNS Focus', value: '--', unit: '%', color: 'text-purple-400' },
                { label: 'State', value: '--', unit: '', color: 'text-zinc-400' }
            ]
        },
        {
            id: 'sweat_01',
            name: 'Sweat Microfluidics',
            type: 'Dermal Patch',
            description: 'Hydration and electrolyte loss.',
            status: 'Disconnected',
            icon: <Droplets className="w-6 h-6 text-cyan-500" />,
            metrics: [
                { label: 'Hydration', value: '--', unit: '%', color: 'text-cyan-400' },
                { label: 'Sodium Loss', value: '--', unit: 'mg/h', color: 'text-zinc-400' }
            ]
        },
        {
            id: 'lens_01',
            name: 'Smart Contact Lenses',
            type: 'Tear-based Sensing',
            description: 'Lactate and Cortisol (Stress) levels.',
            status: 'Disconnected',
            icon: <Eye className="w-6 h-6 text-emerald-500" />,
            metrics: [
                { label: 'Cortisol', value: '--', unit: 'nmol/L', color: 'text-emerald-400' },
                { label: 'Lactate', value: '--', unit: 'mM', color: 'text-zinc-400' }
            ]
        }
    ]);

    const [aiAlert, setAiAlert] = useState<{ message: string; type: 'info' | 'warning' | 'critical' } | null>(null);

    // Simulate Live Data
    useEffect(() => {
        const interval = setInterval(() => {
            setSensors(prev => prev.map(sensor => {
                if (sensor.status === 'Connected') {
                    let newMetrics = [...sensor.metrics];
                    
                    if (sensor.id === 'cgm_01') {
                        const glucose = Math.floor(Math.random() * (120 - 80) + 80);
                        newMetrics[0].value = glucose;
                        newMetrics[1].value = glucose < 90 ? 'Dropping' : 'Stable';
                        
                        if (glucose < 85) {
                            setAiAlert({ message: "Glucose dropping. Stop workout in 5 mins and consume 100ml fast-carbs.", type: 'warning' });
                        }
                    } else if (sensor.id === 'emg_01') {
                        const firing = Math.floor(Math.random() * (98 - 70) + 70);
                        newMetrics[0].value = firing;
                        newMetrics[1].value = firing < 75 ? 'High' : 'Optimal';
                    } else if (sensor.id === 'bci_01') {
                        newMetrics[0].value = Math.floor(Math.random() * (100 - 85) + 85);
                        newMetrics[1].value = 'Flow State';
                    } else if (sensor.id === 'sweat_01') {
                        newMetrics[0].value = Math.floor(Math.random() * (100 - 92) + 92);
                        newMetrics[1].value = Math.floor(Math.random() * (500 - 300) + 300);
                    } else if (sensor.id === 'lens_01') {
                        newMetrics[0].value = (Math.random() * (15 - 8) + 8).toFixed(1);
                        newMetrics[1].value = (Math.random() * (2.5 - 1.0) + 1.0).toFixed(2);
                    }
                    
                    return { ...sensor, metrics: newMetrics };
                }
                return sensor;
            }));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleConnect = (id: string) => {
        // Set to scanning
        setSensors(prev => prev.map(s => s.id === id ? { ...s, status: 'Scanning' } : s));
        addToast(`Initiating Quantum Link for ${id}...`, 'info');

        // Simulate 1.5s connection time
        setTimeout(() => {
            setSensors(prev => prev.map(s => s.id === id ? { ...s, status: 'Connected' } : s));
            addToast(`Neural Sync Successful. Data stream active.`, 'success');
            
            // Clear AI alert if it's the first connection to show a welcome message
            setAiAlert({ message: "Bio-Data Network Established. Monitoring cellular telemetry.", type: 'info' });
        }, 1500);
    };

    const handleDisconnect = (id: string) => {
        setSensors(prev => prev.map(s => {
            if (s.id === id) {
                return { 
                    ...s, 
                    status: 'Disconnected',
                    metrics: s.metrics.map(m => ({ ...m, value: '--' }))
                };
            }
            return s;
        }));
        addToast(`Sensor disconnected.`, 'info');
    };

    const connectedCount = sensors.filter(s => s.status === 'Connected').length;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-zinc-900 to-black p-8 md:p-12 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Cpu className="w-3 h-3" /> Neural Sync Bridge
                            </div>
                            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Quantum Encrypted
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Bio-Sensor <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Network</span>
                        </h1>
                        <p className="text-zinc-400 mt-4 max-w-xl text-sm leading-relaxed">
                            Transform your body into a data stream. Connect next-gen sensors via Zero-Latency Edge Gateway for real-time cellular telemetry.
                        </p>
                    </div>
                    
                    <div className="bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-3xl text-center min-w-[200px]">
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Active Links</p>
                        <div className="text-5xl font-black text-white font-mono italic">
                            {connectedCount}<span className="text-2xl text-zinc-600">/{sensors.length}</span>
                        </div>
                        <div className="mt-3 flex justify-center gap-1">
                            {sensors.map((s, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full ${s.status === 'Connected' ? 'bg-cyan-500 shadow-[0_0_10px_#06b6d4]' : 'bg-zinc-800'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Real-time Pivot Alert */}
            {aiAlert && (
                <div className={`p-6 rounded-2xl border flex items-start gap-4 animate-slide-up ${
                    aiAlert.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    aiAlert.type === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                }`}>
                    <div className="mt-1">
                        {aiAlert.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> : <BrainCircuit className="w-6 h-6" />}
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest mb-1">Bio-Aether Oracle Pivot</h4>
                        <p className="text-sm font-medium">{aiAlert.message}</p>
                    </div>
                </div>
            )}

            {/* Sensors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensors.map((sensor) => (
                    <div key={sensor.id} className={`bg-[#0a0a0a] rounded-[2rem] border transition-all duration-500 overflow-hidden group ${
                        sensor.status === 'Connected' ? 'border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.05)]' : 
                        sensor.status === 'Scanning' ? 'border-amber-500/30' : 'border-white/5 hover:border-white/10'
                    }`}>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl ${sensor.status === 'Connected' ? 'bg-cyan-500/10' : 'bg-white/5'}`}>
                                    {sensor.icon}
                                </div>
                                <div className="flex items-center gap-2">
                                    {sensor.status === 'Connected' && <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]"></span>}
                                    {sensor.status === 'Scanning' && <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />}
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                        sensor.status === 'Connected' ? 'text-cyan-400' :
                                        sensor.status === 'Scanning' ? 'text-amber-400' : 'text-zinc-600'
                                    }`}>
                                        {sensor.status}
                                    </span>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-white mb-1">{sensor.name}</h3>
                            <p className="text-xs text-zinc-500 mb-6 h-8">{sensor.description}</p>

                            {/* Metrics Display */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {sensor.metrics.map((metric, idx) => (
                                    <div key={idx} className="bg-black/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{metric.label}</p>
                                        <p className={`text-xl font-mono font-bold ${sensor.status === 'Connected' ? metric.color : 'text-zinc-700'}`}>
                                            {metric.value} <span className="text-[10px] text-zinc-600">{metric.unit}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            {sensor.status === 'Disconnected' ? (
                                <button 
                                    onClick={() => handleConnect(sensor.id)}
                                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                >
                                    <Wifi className="w-4 h-4" /> One-Tap Link
                                </button>
                            ) : sensor.status === 'Scanning' ? (
                                <button disabled className="w-full py-3 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                    <Bluetooth className="w-4 h-4 animate-pulse" /> Pairing...
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleDisconnect(sensor.id)}
                                    className="w-full py-3 bg-cyan-500/10 hover:bg-red-500/10 text-cyan-500 hover:text-red-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group/btn"
                                >
                                    <Link className="w-4 h-4 group-hover/btn:hidden" /> 
                                    <span className="group-hover/btn:hidden">Active</span>
                                    <span className="hidden group-hover/btn:block">Disconnect</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
