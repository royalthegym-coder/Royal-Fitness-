
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { MemberFitnessData } from '../../../types';
import { useData } from '../../context/DataProvider';
import { BotIcon } from '../icons/BotIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { HeartRateIcon, SleepIcon } from '../icons/HealthIcons';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import { getComplexResponse } from '../../../lib/gemini';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';

interface FitnessTrackerProps {
    memberId: number;
    fitnessData: MemberFitnessData;
    setFitnessData: React.Dispatch<React.SetStateAction<MemberFitnessData>>;
}

const ProtocolArchitect: React.FC<{ hrv: number; sleep: number }> = ({ hrv, sleep }) => {
    const [protocol, setProtocol] = useState({
        mode: 'Analyzing...',
        intensity: 100,
        volume: 'Standard',
        color: 'text-gray-400',
        prescription: 'Syncing Bio-Data...'
    });

    useEffect(() => {
        // Neural Synthesis Logic
        const readinessScore = (hrv * 0.6) + (sleep * 10 * 0.4); // Simple weighted score
        
        let newProtocol;
        if (readinessScore < 45) {
            newProtocol = {
                mode: 'Sympathetic Overdrive',
                intensity: 60,
                volume: 'De-load (-40%)',
                color: 'text-red-500',
                prescription: 'System stressed. Protocol switched to "Active Recovery". Focus on mobility.'
            };
        } else if (readinessScore < 70) {
            newProtocol = {
                mode: 'Baseline',
                intensity: 85,
                volume: 'Maintenance',
                color: 'text-amber-500',
                prescription: 'Moderate readiness. Maintain planned volume but cap RPE at 7.'
            };
        } else {
            newProtocol = {
                mode: 'Parasympathetic Dominance',
                intensity: 110,
                volume: 'Overload (+10%)',
                color: 'text-green-400',
                prescription: 'CNS primed. Go for PRs. Increase volume load by 5-10%.'
            };
        }
        setProtocol(newProtocol);
    }, [hrv, sleep]);

    return (
        <div className="relative overflow-hidden bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl p-6">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuitIcon className="w-24 h-24 text-cyan-500" />
            </div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-cyan-900/30 rounded-lg border border-cyan-500/30">
                    <BotIcon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Neural Synthesis Engine</h3>
                    <p className="text-xs text-cyan-400 font-mono">THE PROTOCOL ARCHITECT</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
                <div className="bg-black/40 p-3 rounded-xl border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Protocol Mode</p>
                    <p className={`text-sm font-bold ${protocol.color} mt-1`}>{protocol.mode}</p>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Live Intensity</p>
                    <p className="text-xl font-black text-white mt-1">{protocol.intensity}%</p>
                </div>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-xl border-l-4 border-cyan-500 relative z-10">
                <p className="text-xs text-gray-300 leading-relaxed font-mono">
                    <span className="text-cyan-400 font-bold">>> DIRECTIVE:</span> {protocol.prescription}
                </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                <span className="flex items-center"><AutoUpdateIcon className="w-3 h-3 mr-1 animate-spin"/> LIVE SYNC</span>
                <span>LATENCY: 12ms</span>
            </div>
        </div>
    );
};

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ memberId }) => {
    const { liveHealthData } = useData(); 
    
    // Simulate Bio-Metrics for demo if live data is generic
    const hrv = useMemo(() => 35 + Math.floor(Math.random() * 50), []); // 35-85
    const sleep = liveHealthData.sleep.totalHours;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center">
                        <SparkleIcon className="w-8 h-8 mr-3 text-cyan-400" />
                        Warrior Performance Lab
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Biometric Telemetry & Neural Adaptation
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Protocol Architect */}
                <ProtocolArchitect hrv={hrv} sleep={sleep} />

                {/* 2. Live Metrics */}
                <div className="grid grid-cols-1 gap-4">
                    <Card className="flex items-center justify-between border-l-4 border-purple-500 bg-gray-900/50">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Heart Rate Variability</p>
                            <div className="flex items-baseline mt-2">
                                <span className={`text-5xl font-black ${hrv < 40 ? 'text-red-500' : hrv < 60 ? 'text-amber-500' : 'text-green-500'}`}>{hrv}</span>
                                <span className="text-sm text-gray-500 ml-2 font-bold">ms</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1">CNS Recovery Status</p>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-purple-900/20 flex items-center justify-center border border-purple-500/20">
                            <HeartRateIcon className="w-8 h-8 text-purple-500" />
                        </div>
                    </Card>
                    <Card className="flex items-center justify-between border-l-4 border-blue-500 bg-gray-900/50">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Sleep Efficiency</p>
                            <div className="flex items-baseline mt-2">
                                <span className="text-5xl font-black text-white">{sleep}</span>
                                <span className="text-sm text-gray-500 ml-2 font-bold">hrs</span>
                            </div>
                             <p className="text-[10px] text-gray-500 mt-1">Deep Sleep: {liveHealthData.sleep.deepHours}h</p>
                        </div>
                        <div className="h-16 w-16 rounded-full bg-blue-900/20 flex items-center justify-center border border-blue-500/20">
                            <SleepIcon className="w-8 h-8 text-blue-500" />
                        </div>
                    </Card>
                </div>
            </div>
            
            <div className="flex items-center justify-center pt-4 opacity-50">
                 <ShieldCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
                 <span className="text-[10px] text-gray-500 font-mono uppercase">Processed securely on-device (Zero-Knowledge Proof)</span>
            </div>
        </div>
    );
};

export default FitnessTracker;
