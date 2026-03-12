import React, { useRef, useState } from 'react';
import { useTitanVision } from '../utils/hooks/useTitanVision';
import { useGhostSensor } from '../utils/hooks/useGhostSensor';
import { voiceCoach } from '../services/titanVoiceCoach';

export const AetherZenithDashboard: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    
    // Initialize our God-Tier Hooks
    const { isReady: isVisionReady } = useTitanVision(videoRef);
    const { heartRate, stressLevel, isDetecting } = useGhostSensor(videoRef);

    const [workoutState, setWorkoutState] = useState<'idle' | 'active' | 'warning'>('idle');

    // Simulated Auto-Intensity Bot Logic
    const handleStartWorkout = () => {
        setWorkoutState('active');
        voiceCoach.speak("Welcome to Aether Zenith. Calibrating skeletal integrity shield.", 'zen_master');
    };

    // Monitor Heart Rate for Safety (Ghost Pulse Sensor Logic)
    React.useEffect(() => {
        if (workoutState === 'active' && heartRate) {
            if (heartRate > 170) {
                setWorkoutState('warning');
                voiceCoach.speak("Warning! Heart rate critically high. Stop the set immediately and rest.", 'drill_sergeant');
            } else if (heartRate > 140 && heartRate < 170) {
                // Optimal Fat Burning / Hypertrophy zone
                // voiceCoach.speak("Perfect intensity. Keep pushing.", 'motivator');
            }
        }
    }, [heartRate, workoutState]);

    return (
        <div className="min-h-screen bg-black text-white p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Aether Zenith 2.0
                        </h1>
                        <p className="text-zinc-400 text-sm mt-1 uppercase tracking-widest">Bio-Mechanical Intelligence</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-mono ${isVisionReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {isVisionReady ? 'VISION: ONLINE' : 'VISION: CALIBRATING'}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Camera Feed (Titan Vision) */}
                    <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 aspect-video shadow-2xl">
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover opacity-80"
                        />
                        <canvas 
                            ref={canvasRef} 
                            className="absolute inset-0 w-full h-full pointer-events-none"
                        />
                        
                        {/* HUD Overlay */}
                        <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
                            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                                <span className="text-xs text-zinc-400 block mb-1">CURRENT EXERCISE</span>
                                <span className="text-lg font-bold text-white">Barbell Squat</span>
                            </div>
                            
                            {workoutState === 'warning' && (
                                <div className="bg-red-500/80 backdrop-blur-md px-4 py-2 rounded-lg border border-red-400 animate-pulse">
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">OVER-EXERTION DETECTED</span>
                                </div>
                            )}
                        </div>

                        {/* Start Button Overlay */}
                        {workoutState === 'idle' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                <button 
                                    onClick={handleStartWorkout}
                                    disabled={!isVisionReady}
                                    className="px-8 py-4 bg-white text-black rounded-full font-bold tracking-wide hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isVisionReady ? 'INITIALIZE NEURAL LINK' : 'WAITING FOR CAMERA...'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Telemetry Sidebar */}
                    <div className="space-y-6">
                        {/* Ghost Pulse Sensor (rPPG) */}
                        <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                            <h3 className="text-xs text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                Ghost Vitals (rPPG)
                            </h3>
                            <div className="flex items-end gap-2">
                                <span className={`text-5xl font-mono font-light ${heartRate && heartRate > 170 ? 'text-red-400' : 'text-white'}`}>
                                    {heartRate ? heartRate : '--'}
                                </span>
                                <span className="text-zinc-500 mb-1">BPM</span>
                            </div>
                            <div className="mt-4 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${heartRate && heartRate > 170 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                    style={{ width: heartRate ? `${Math.min((heartRate / 200) * 100, 100)}%` : '0%' }}
                                ></div>
                            </div>
                            
                            <div className="mt-4 flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                                <span className="text-xs text-zinc-400 uppercase tracking-widest">Stress Level (HRV)</span>
                                <span className={`text-sm font-bold ${
                                    stressLevel === 'Critical' ? 'text-red-500' :
                                    stressLevel === 'High' ? 'text-orange-400' :
                                    stressLevel === 'Moderate' ? 'text-yellow-400' :
                                    stressLevel === 'Low' ? 'text-emerald-400' : 'text-zinc-500'
                                }`}>
                                    {stressLevel || 'CALIBRATING...'}
                                </span>
                            </div>

                            <p className="text-xs text-zinc-500 mt-3">
                                {isDetecting ? 'Analyzing facial micro-vascular changes...' : 'Waiting for stable face detection...'}
                            </p>
                        </div>

                        {/* Skeletal Integrity Shield */}
                        <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                            <h3 className="text-xs text-zinc-400 uppercase tracking-widest mb-4">Skeletal Integrity</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-300">L5-S1 Torque</span>
                                    <span className="text-sm font-mono text-emerald-400">1.2 Nm (Safe)</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-300">Knee Shear Force</span>
                                    <span className="text-sm font-mono text-emerald-400">Optimal</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-300">Spine Alignment</span>
                                    <span className="text-sm font-mono text-emerald-400">98%</span>
                                </div>
                            </div>
                        </div>

                        {/* Neural Load Optimizer */}
                        <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
                            <h3 className="text-xs text-zinc-400 uppercase tracking-widest mb-4">Neural Load Optimizer</h3>
                            <div className="bg-black/50 rounded-lg p-4 border border-white/5">
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    <span className="text-cyan-400 font-semibold">AI Suggestion:</span> Velocity dropped by 15% on rep 8. Reduce weight by 5kg for the next set to maintain optimal hypertrophy without CNS burnout.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
