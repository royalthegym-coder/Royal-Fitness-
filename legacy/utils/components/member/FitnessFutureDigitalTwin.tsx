import React, { useState, useEffect } from 'react';
import { User, Scan, Activity, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function FitnessFutureDigitalTwin() {
    const [morphing, setMorphing] = useState(false);
    const [stage, setStage] = useState(0);

    const toggleMorph = () => {
        if (morphing) return;
        setMorphing(true);
        let s = 0;
        const interval = setInterval(() => {
            s++;
            setStage(s);
            if (s >= 3) {
                clearInterval(interval);
                setTimeout(() => {
                    setMorphing(false);
                    setStage(0);
                }, 3000);
            }
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            <div className="bg-black border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl"></div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-3 relative z-10">
                    <Layers className="w-8 h-8 text-cyan-400" /> Digital Twin Evolution
                </h1>
                <p className="text-gray-400 text-sm font-mono uppercase tracking-widest relative z-10">3D Body Morphing Module</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 lg:col-span-2 bg-black/40 border border-white/5 rounded-[2.5rem] p-6 lg:p-10 backdrop-blur-md relative flex flex-col items-center justify-center min-h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black pointer-events-none"></div>
                    
                    <div className="relative w-64 h-64 flex items-center justify-center z-10">
                        {/* 3D Avatar Area */}
                        {!morphing && stage === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 border-2 border-dashed border-gray-700 rounded-full flex items-center justify-center">
                                <User className="w-32 h-32 text-gray-500" />
                                <span className="absolute bottom-4 bg-gray-800 text-gray-300 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold">Current State: 85kg | 22% BF</span>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {morphing && (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }} 
                                    animate={{ scale: 1, opacity: 1 }} 
                                    exit={{ scale: 1.2, opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full animate-ping"></div>
                                    <div className="absolute inset-4 border-4 border-cyan-400/50 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                                    <User className="w-32 h-32 text-cyan-400 animate-pulse relative z-10" />
                                    
                                    <div className="absolute bottom-4 bg-cyan-900/80 text-cyan-200 text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-bold border border-cyan-500/50 backdrop-blur-sm z-20">
                                        {stage === 1 && "Recalculating Mass..."}
                                        {stage === 2 && "Rendering Muscle Splatting..."}
                                        {stage >= 3 && "Projection Complete: 78kg | 14% BF"}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Scanner Beam */}
                        {morphing && (
                            <motion.div 
                                animate={{ y: ['-100%', '100%'] }} 
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] z-20"
                            />
                        )}
                    </div>
                </div>

                <div className="col-span-1 space-y-6">
                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md">
                        <h3 className="text-white font-black uppercase text-sm mb-4 tracking-widest flex items-center gap-2">
                            <Scan className="w-4 h-4 text-cyan-400" /> Simulation Controls
                        </h3>
                        <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                            Preview your body transformation based on your current nutrition and workout adherence. Our 3D splatting engine generates a highly accurate future visualization.
                        </p>
                        <button 
                            onClick={toggleMorph}
                            disabled={morphing}
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex justify-center items-center gap-2"
                        >
                            {morphing ? <><RefreshCw className="w-4 h-4 animate-spin" /> Rendering...</> : 'Process 3-Month Goal'}
                        </button>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 backdrop-blur-md">
                        <h3 className="text-white font-black uppercase text-sm mb-4 tracking-widest">Metrics Shift</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-mono uppercase tracking-widest mb-1 text-gray-500">
                                    <span>Weight</span>
                                    <span className="text-white">85kg <ArrowRight className="inline w-3 h-3 text-cyan-400" /> 78kg</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: '40%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs font-mono uppercase tracking-widest mb-1 text-gray-500">
                                    <span>Body Fat</span>
                                    <span className="text-white">22% <ArrowRight className="inline w-3 h-3 text-cyan-400" /> 14%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
