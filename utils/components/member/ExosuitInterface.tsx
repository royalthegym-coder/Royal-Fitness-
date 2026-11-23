import React, { useState, useEffect } from 'react';
import { Activity, Battery, Triangle, ChevronUp, Lock, Unlock, Cpu, Zap, Radio, ShieldAlert } from 'lucide-react';
import Card from '../common/Card';

export const ExosuitInterface: React.FC = () => {
    const [suitStatus, setSuitStatus] = useState<'DISCONNECTED' | 'SYNCING' | 'ONLINE'>('DISCONNECTED');
    const [powerLevel, setPowerLevel] = useState(0);
    const [motorOutput, setMotorOutput] = useState([0, 0, 0, 0]); // Arms & Legs
    const [isLocked, setIsLocked] = useState(true);

    const engageSuit = () => {
        setSuitStatus('SYNCING');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setPowerLevel(progress);
            if(progress >= 100) {
                clearInterval(interval);
                setSuitStatus('ONLINE');
                setIsLocked(false);
            }
        }, 300);
    };

    useEffect(() => {
        if(suitStatus === 'ONLINE') {
            const interval = setInterval(() => {
                setMotorOutput([
                    Math.floor(Math.random() * 30 + 70), // L-Arm
                    Math.floor(Math.random() * 30 + 70), // R-Arm
                    Math.floor(Math.random() * 20 + 80), // L-Leg
                    Math.floor(Math.random() * 20 + 80)  // R-Leg
                ]);
            }, 500);
            return () => clearInterval(interval);
        } else {
            setMotorOutput([0,0,0,0]);
        }
    }, [suitStatus]);

    return (
        <div className="font-mono text-cyan-400 p-6 max-w-6xl mx-auto space-y-8 animate-fade-in relative selection:bg-cyan-500/30">
            {/* GRID BACKGROUND */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between bg-[#030303] border border-cyan-500/40 rounded-[3rem] p-8 shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden">
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
                <div className="flex items-center gap-6 relative">
                    <div className="p-5 bg-black border-2 border-cyan-500 text-cyan-400 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                        <Triangle className="w-12 h-12 rotate-180 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter">Titan-X <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Exosuit</span></h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] font-black mt-2 text-cyan-500 flex items-center gap-2">
                            <Cpu className="w-4 h-4"/> Bionic Force Multiplier API
                        </p>
                    </div>
                </div>
                
                <div className="mt-6 md:mt-0 flex gap-4">
                    {suitStatus === 'DISCONNECTED' && (    
                        <button onClick={engageSuit} className="flex items-center gap-3 bg-cyan-600 hover:bg-cyan-500 text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                            <Radio className="w-4 h-4" /> Link Suit
                        </button>
                    )}
                    {suitStatus === 'SYNCING' && (
                        <div className="text-cyan-400 font-bold text-xs uppercase animate-pulse flex items-center gap-3 bg-cyan-900/40 px-8 py-4 rounded-xl border border-cyan-500/50">
                            <Activity className="w-4 h-4 animate-spin"/> Syncing {powerLevel}%
                        </div>
                    )}
                    {suitStatus === 'ONLINE' && (
                        <button onClick={() => {setSuitStatus('DISCONNECTED'); setIsLocked(true); setPowerLevel(0);}} className="flex items-center gap-3 bg-red-600/20 text-red-500 border border-red-500 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-black transition-all">
                            Emergency Release
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                {/* 3D RENDERING PANEL (FAKE) */}
                <div className="lg:col-span-5 bg-black border border-cyan-500/20 rounded-[3rem] p-8 flex flex-col items-center justify-center min-h-[500px] relative">
                    <div className="absolute top-6 left-6 flex items-center gap-2">
                        {isLocked ? <Lock className="w-5 h-5 text-red-500" /> : <Unlock className="w-5 h-5 text-cyan-400" />}
                        <span className="text-[10px] font-mono tracking-widest uppercase text-gray-500">Joint Servos: {isLocked ? 'LOCKED' : 'FREE'}</span>
                    </div>
                    
                    <div className="relative w-full max-w-[200px] mx-auto aspect-[1/2]">
                        {/* Engine skeleton graphic */}
                        <div className={`absolute inset-0 border-2 rounded-[4rem] transition-colors duration-1000 ${suitStatus === 'ONLINE' ? 'border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.5)]' : 'border-gray-800'}`}></div>
                        
                        {/* Arms & Legs placeholders */}
                        <div className={`absolute top-[20%] -left-8 w-6 h-32 rounded-full border-2 transition-colors duration-100 ${suitStatus === 'ONLINE' ? 'border-cyan-400 bg-cyan-900/40' : 'border-gray-800'}`}></div>
                        <div className={`absolute top-[20%] -right-8 w-6 h-32 rounded-full border-2 transition-colors duration-100 ${suitStatus === 'ONLINE' ? 'border-cyan-400 bg-cyan-900/40' : 'border-gray-800'}`}></div>
                        
                        <div className={`absolute bottom-4 left-6 w-8 h-40 rounded-full border-2 transition-colors duration-100 ${suitStatus === 'ONLINE' ? 'border-cyan-400 bg-cyan-900/40' : 'border-gray-800'}`}></div>
                        <div className={`absolute bottom-4 right-6 w-8 h-40 rounded-full border-2 transition-colors duration-100 ${suitStatus === 'ONLINE' ? 'border-cyan-400 bg-cyan-900/40' : 'border-gray-800'}`}></div>
                        
                        {/* Glowing core */}
                        <div className={`absolute top-[30%] left-1/2 -translate-x-1/2 w-12 h-12 rounded-full ${suitStatus === 'ONLINE' ? 'bg-cyan-400 animate-pulse shadow-[0_0_40px_rgba(6,182,212,0.8)]' : 'bg-gray-800'}`}></div>
                    </div>
    
                    <div className="mt-8 px-6 py-2 bg-gray-900 border border-white/5 rounded-full text-[10px] uppercase tracking-widest font-bold text-gray-400">
                        Diagnostics: {suitStatus === 'ONLINE' ? <span className="text-cyan-400">NOMINAL</span> : <span className="text-gray-600">OFFLINE</span>}
                    </div>
                </div>

                {/* TELEMETRY & CONTROLS */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-black border border-white/10 rounded-3xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Power Core</h3>
                                <Battery className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="text-5xl font-black text-white">{powerLevel}<span className="text-xl text-gray-500">%</span></div>
                            <div className="w-full h-1 bg-gray-900 mt-4 overflow-hidden rounded-full">
                                <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${powerLevel}%`}}></div>
                            </div>
                        </div>

                        <div className="bg-black border border-white/10 rounded-3xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Assist Load</h3>
                                <ChevronUp className="w-5 h-5 text-fuchsia-500" />
                            </div>
                            <div className="text-5xl font-black text-white">+{suitStatus === 'ONLINE' ? '150' : '0'}<span className="text-xl text-gray-500">kg</span></div>
                            <div className="text-[9px] uppercase tracking-widest text-fuchsia-400 mt-4">Max Force Multiplier Base</div>
                        </div>
                    </div>

                    {/* Motor Outputs */}
                    <div className="bg-black border border-white/10 rounded-3xl p-6">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Actuator Outputs</h3>
                        <div className="space-y-4">
                            {[
                                { name: "Left Arm Servo", output: motorOutput[0] },
                                { name: "Right Arm Servo", output: motorOutput[1] },
                                { name: "Left Leg Piston", output: motorOutput[2] },
                                { name: "Right Leg Piston", output: motorOutput[3] }
                            ].map((servo, i) => (
                                <div key={i} className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-300">
                                    <span className="w-32">{servo.name}</span>
                                    <div className="flex-1 mx-6 h-2 bg-gray-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-cyan-500 transition-all duration-100" style={{ width: `${servo.output}%` }}></div>
                                    </div>
                                    <span className="w-12 text-right">{servo.output}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-cyan-900/10 border border-cyan-500/20 rounded-3xl p-6 flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 text-cyan-500 shrink-0" />
                        <div className="space-y-2">
                            <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Titan-X Safety Protocol</p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Smart feedback is active. Disengage suit immediately if feeling dizziness, neural-link feedback loops, or mechanical fatigue. Exosuit strictly reserved for FitnessFutureTier members and elite powerlifting scenarios.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExosuitInterface;
