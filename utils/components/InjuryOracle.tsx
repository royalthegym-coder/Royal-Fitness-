import React, { useState, useEffect, useRef } from 'react';
import { Activity, AlertTriangle, ShieldAlert, Zap, Crosshair, Volume2, VolumeX } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const InjuryOracle: React.FC = () => {
    const [data, setData] = useState<any[]>([]);
    const [isSquatting, setIsSquatting] = useState(false);
    const [isDeadlifting, setIsDeadlifting] = useState(false);
    const [aclStress, setAclStress] = useState(0);
    const [l5s1Stress, setL5s1Stress] = useState(0);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const lastSpokenRef = useRef<number>(0);

    const speakWarning = (message: string) => {
        if (!voiceEnabled) return;
        const now = Date.now();
        // Prevent spamming the voice (cooldown 5 seconds)
        if (now - lastSpokenRef.current > 5000) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 1.1;
            utterance.pitch = 0.9;
            utterance.volume = 1;
            window.speechSynthesis.speak(utterance);
            lastSpokenRef.current = now;
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric' });
            
            // Squat Logic (ACL)
            const squatForce = isSquatting ? 800 : 200;
            const squatForceRand = squatForce + Math.random() * 300;
            const squatTorque = (squatForceRand * 0.4) + Math.random() * 50;
            const squatStress = (squatTorque / 100) * 15;
            
            // Deadlift Logic (L5-S1)
            const deadliftForce = isDeadlifting ? 1200 : 150;
            const deadliftForceRand = deadliftForce + Math.random() * 400;
            const deadliftTorque = (deadliftForceRand * 0.6) + Math.random() * 80;
            const deadliftStress = (deadliftTorque / 150) * 12; // Simulated L5-S1 Strain %

            setAclStress(squatStress);
            setL5s1Stress(deadliftStress);

            if (squatStress > 60) {
                speakWarning("Warning! ACL strain exceeds safe limits. Stop squatting immediately to prevent ligament tear.");
            }
            
            if (deadliftStress > 45) { // Threshold for L5-S1
                speakWarning("Stop! L5 S1 Vertebrae pressure increased dangerously. Drop the weight immediately to prevent spinal injury.");
            }

            setData(prev => {
                const newData = [...prev, { 
                    time, 
                    force: Math.round(isDeadlifting ? deadliftForceRand : squatForceRand), 
                    torque: Math.round(isDeadlifting ? deadliftTorque : squatTorque), 
                    aclStress: Math.round(squatStress),
                    l5s1Stress: Math.round(deadliftStress)
                }];
                if (newData.length > 20) newData.shift();
                return newData;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isSquatting, isDeadlifting, voiceEnabled]);

    return (
        <div className="h-full flex flex-col animate-fade-in space-y-6">
            <div className="flex items-center justify-between bg-black/40 p-6 rounded-[2rem] border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)] backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <Activity className="w-8 h-8 text-red-400 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                            Skeletal Integrity <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500">Shield</span>
                        </h1>
                        <p className="text-xs font-mono text-red-400/70 uppercase tracking-[0.3em]">Real-Time Inverse Kinematics</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`p-3 rounded-full border transition-colors ${voiceEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-gray-800 border-gray-600 text-gray-500'}`}
                    >
                        {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    <div className="flex items-center gap-3 px-4 py-2 bg-red-900/20 rounded-full border border-red-500/30">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-[10px] font-black text-red-300 uppercase tracking-widest">Live Joint Tracking</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Visualizer */}
                <div className="lg:col-span-1 bg-black/40 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden flex flex-col items-center justify-center group">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute top-6 left-6 flex items-center gap-2 text-xs font-mono text-cyan-400">
                        <Crosshair className="w-4 h-4 animate-spin-slow" /> TARGET: {isDeadlifting ? 'L5-S1 SPINE' : 'KNEE JOINT'}
                    </div>
                    
                    {/* Simulated Skeleton/Joint */}
                    <div className="relative w-48 h-64 mt-8">
                        {isDeadlifting ? (
                            // Spine Visualization
                            <>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-40 bg-gray-700 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
                                <div className={`absolute top-32 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full -ml-5 -mt-5 transition-colors duration-300 shadow-[0_0_30px_currentColor] ${l5s1Stress > 45 ? 'bg-red-500 text-red-500' : l5s1Stress > 25 ? 'bg-amber-500 text-amber-500' : 'bg-cyan-500 text-cyan-500'}`}></div>
                                {isDeadlifting && (
                                    <>
                                        <div className="absolute top-32 left-1/2 w-1 h-20 bg-red-500 origin-bottom -translate-x-1/2 -translate-y-full animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                                        <div className="absolute top-32 left-1/2 text-[10px] font-mono text-red-400 -ml-16 -mt-12">F = {data[data.length-1]?.force}N</div>
                                    </>
                                )}
                            </>
                        ) : (
                            // Knee Visualization
                            <>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-32 bg-gray-700 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"></div>
                                <div className={`absolute top-28 left-1/2 -translate-x-1/2 w-4 h-32 bg-gray-700 rounded-full origin-top transition-transform duration-500 ${isSquatting ? 'rotate-45' : 'rotate-0'}`}></div>
                                <div className={`absolute top-28 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full -ml-4 -mt-4 transition-colors duration-300 shadow-[0_0_30px_currentColor] ${aclStress > 60 ? 'bg-red-500 text-red-500' : aclStress > 30 ? 'bg-amber-500 text-amber-500' : 'bg-cyan-500 text-cyan-500'}`}></div>
                                {isSquatting && (
                                    <>
                                        <div className="absolute top-28 left-1/2 w-1 h-16 bg-red-500 origin-bottom -translate-x-1/2 -translate-y-full animate-pulse shadow-[0_0_10px_#ef4444]"></div>
                                        <div className="absolute top-28 left-1/2 text-[10px] font-mono text-red-400 -ml-16 -mt-8">F = {data[data.length-1]?.force}N</div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <div className="mt-8 flex gap-4 w-full">
                        <button 
                            onMouseDown={() => { setIsSquatting(true); setIsDeadlifting(false); }}
                            onMouseUp={() => setIsSquatting(false)}
                            onMouseLeave={() => setIsSquatting(false)}
                            onTouchStart={() => { setIsSquatting(true); setIsDeadlifting(false); }}
                            onTouchEnd={() => setIsSquatting(false)}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all text-center"
                        >
                            Simulate Squat
                        </button>
                        <button 
                            onMouseDown={() => { setIsDeadlifting(true); setIsSquatting(false); }}
                            onMouseUp={() => setIsDeadlifting(false)}
                            onMouseLeave={() => setIsDeadlifting(false)}
                            onTouchStart={() => { setIsDeadlifting(true); setIsSquatting(false); }}
                            onTouchEnd={() => setIsDeadlifting(false)}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all text-center"
                        >
                            Simulate Deadlift
                        </button>
                    </div>
                </div>

                {/* Data & Alerts */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-black/40 border border-white/5 p-6 rounded-3xl">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">Current Force (F)</p>
                            <p className="text-4xl font-black text-white italic">{data[data.length-1]?.force || 0} <span className="text-sm text-gray-500">N</span></p>
                        </div>
                        <div className={`border p-6 rounded-3xl transition-colors ${aclStress > 60 ? 'bg-red-900/20 border-red-500/50' : 'bg-black/40 border-white/5'}`}>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">ACL Strain (Knee)</p>
                            <p className={`text-4xl font-black italic ${aclStress > 60 ? 'text-red-400' : 'text-cyan-400'}`}>{data[data.length-1]?.aclStress || 0}%</p>
                        </div>
                        <div className={`border p-6 rounded-3xl transition-colors ${l5s1Stress > 45 ? 'bg-red-900/20 border-red-500/50' : 'bg-black/40 border-white/5'}`}>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-2">L5-S1 Pressure (Spine)</p>
                            <p className={`text-4xl font-black italic ${l5s1Stress > 45 ? 'text-red-400' : 'text-emerald-400'}`}>{data[data.length-1]?.l5s1Stress || 0}%</p>
                        </div>
                    </div>

                    {aclStress > 60 && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-4 animate-pulse">
                            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="text-red-400 font-black uppercase text-sm tracking-widest">Critical Knee Torque Detected</h4>
                                <p className="text-red-300/70 text-xs mt-1">ACL strain exceeds safe limits. Stop workout immediately to prevent ligament tear. Correct knee valgus.</p>
                            </div>
                        </div>
                    )}

                    {l5s1Stress > 45 && (
                        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-start gap-4 animate-pulse">
                            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
                            <div>
                                <h4 className="text-red-400 font-black uppercase text-sm tracking-widest">Spinal Integrity Compromised</h4>
                                <p className="text-red-300/70 text-xs mt-1">L5-S1 Vertebrae pressure increased dangerously. Drop the weight immediately to prevent spinal injury.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 bg-black/40 border border-white/5 rounded-[2.5rem] p-6 min-h-[250px]">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Real-time Kinematic Telemetry
                        </h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="time" stroke="#ffffff30" fontSize={10} tickMargin={10} />
                                <YAxis stroke="#ffffff30" fontSize={10} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="aclStress" stroke="#06b6d4" strokeWidth={2} dot={false} name="ACL Strain (%)" />
                                <Line type="monotone" dataKey="l5s1Stress" stroke="#10b981" strokeWidth={2} dot={false} name="L5-S1 Pressure (%)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InjuryOracle;
