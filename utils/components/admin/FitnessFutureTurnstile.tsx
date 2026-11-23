import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScanFace, Fingerprint, Activity, ShieldCheck, CheckCircle2, Lock, Radio } from 'lucide-react';

export default function FitnessFutureTurnstile() {
    const [scanState, setScanState] = useState<'idle' | 'scanning' | 'success'>('idle');
    
    // Process periodic scans
    useEffect(() => {
        const interval = setInterval(() => {
            setScanState('scanning');
            setTimeout(() => {
                setScanState('success');
                setTimeout(() => {
                    setScanState('idle');
                }, 2000);
            }, 1000);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {/* Header */}
            <div className="bg-black border border-[#00FF00]/20 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(0,255,0,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FF00]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h1 className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-3 relative z-10">
                    <ScanFace className="w-10 h-10 text-[#00FF00]" /> BIOMETRIC & TURNSTILE
                </h1>
                <p className="text-[#00FF00]/70 text-sm font-mono uppercase tracking-widest relative z-10">Real-time attendance & access control</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Gate Control Viz */}
                <div className="bg-black/80 border border-[#00FF00]/20 rounded-[2.5rem] p-8 lg:p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[400px]">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00FF00]/10 via-black to-black pointer-events-none"></div>
                    
                    <div className="relative z-10 text-center">
                        <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                            {/* Scanning Rings */}
                            <AnimatePresence mode="popLayout">
                                {scanState === 'idle' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                                        <Fingerprint className="w-20 h-20 text-gray-600" />
                                    </motion.div>
                                )}
                                {scanState === 'scanning' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-0 border-4 border-[#00FF00]/30 rounded-[2rem] animate-ping"></div>
                                        <div className="absolute inset-4 border-4 border-[#00FF00]/50 rounded-[2rem] animate-pulse"></div>
                                        <ScanFace className="w-20 h-20 text-[#00FF00] animate-pulse" />
                                        <motion.div 
                                            animate={{ y: ['-100%', '100%'] }} 
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                            className="absolute left-0 right-0 h-1 bg-[#00FF00] shadow-[0_0_15px_#00FF00] z-20"
                                        />
                                    </motion.div>
                                )}
                                {scanState === 'success' && (
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-[#00FF00]/20 rounded-[2rem] blur-xl"></div>
                                        <ShieldCheck className="w-24 h-24 text-[#00FF00]" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Status Message */}
                        <div className="h-12 flex items-center justify-center">
                            {scanState === 'idle' && <p className="text-gray-500 font-mono tracking-widest uppercase">Waiting for input...</p>}
                            {scanState === 'scanning' && <p className="text-[#00FF00] font-mono tracking-widest uppercase animate-pulse">Scanning Biometrics...</p>}
                            {scanState === 'success' && <p className="text-[#00FF00] font-black tracking-widest uppercase text-xl italic">Access Granted - Gate Open</p>}
                        </div>
                    </div>
                </div>

                {/* Live Stream / Activity */}
                <div className="space-y-6">
                    <div className="bg-black/80 border border-[#00FF00]/20 rounded-[2.5rem] p-6">
                        <h3 className="text-white font-black uppercase text-sm mb-6 tracking-widest flex items-center gap-2">
                            <Radio className="w-4 h-4 text-[#00FF00]" /> Live Turnstile Feed
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: "Rahul Singh", time: "Just now", status: "In", plan: "Sovereign Annual" },
                                { name: "Aisha Gupta", time: "2 mins ago", status: "Out", plan: "Advanced Monthly" },
                                { name: "Vikram Mehta", time: "5 mins ago", status: "In", plan: "Titan Quarterly" },
                            ].map((evt, i) => (
                                <div key={i} className="flex justify-between items-center bg-[#00FF00]/5 p-4 rounded-2xl border border-[#00FF00]/10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${evt.status === 'In' ? 'bg-[#00FF00]' : 'bg-orange-500'}`}></div>
                                        <div>
                                            <p className="text-white font-bold">{evt.name}</p>
                                            <p className="text-gray-500 text-xs font-mono">{evt.time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[#00FF00] font-black uppercase text-xs tracking-widest">{evt.status}</p>
                                        <p className="text-gray-400 text-[10px] uppercase font-mono">{evt.plan}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/80 border border-[#00FF00]/20 rounded-[2.5rem] p-6 grid grid-cols-2 gap-4">
                        <div className="bg-[#00FF00]/10 rounded-2xl p-4 border border-[#00FF00]/20">
                            <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-1">Gate Status</p>
                            <p className="text-2xl font-black text-[#00FF00] flex items-center gap-2"><Lock className="w-5 h-5"/> SECURED</p>
                        </div>
                        <div className="bg-[#00FF00]/10 rounded-2xl p-4 border border-[#00FF00]/20">
                            <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mb-1">Total Ins Today</p>
                            <p className="text-2xl font-black text-white italic">248</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
