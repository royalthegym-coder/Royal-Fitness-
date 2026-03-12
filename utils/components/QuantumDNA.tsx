import React, { useState, useEffect } from 'react';
import { Dna, Activity, Zap, Database, CheckCircle2, AlertTriangle, Fingerprint, Network, Microscope, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'motion/react';

export const QuantumDNA: React.FC<{ memberId?: number }> = ({ memberId }) => {
    const { addToast } = useToast();
    const [isSequencing, setIsSequencing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultsReady, setResultsReady] = useState(false);

    const handleSequence = () => {
        setIsSequencing(true);
        setProgress(0);
        setResultsReady(false);
        addToast("Quantum DNA Sequencing Initiated...", "info");

        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    setIsSequencing(false);
                    setResultsReady(true);
                    addToast("Genomic Mapping Complete. Insights Unlocked.", "success");
                    return 100;
                }
                return p + Math.floor(Math.random() * 15) + 5;
            });
        }, 500);
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="bg-black border border-emerald-500/20 rounded-[2.5rem] p-8 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-emerald-900/30 border border-emerald-500/50 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Dna className="w-10 h-10 text-emerald-400 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                    <Microscope className="w-3 h-3" /> Genomic Engine
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                                Quantum <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">DNA Sequencing</span>
                            </h1>
                        </div>
                    </div>
                    
                    {!resultsReady && !isSequencing && (
                        <button 
                            onClick={handleSequence}
                            className="bg-emerald-600 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:bg-emerald-500 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Zap className="w-4 h-4"/> Sequence Genome
                        </button>
                    )}
                </div>
            </div>

            {/* Sequencing Progress */}
            <AnimatePresence>
                {isSequencing && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-black border border-white/10 rounded-[2rem] p-8 overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <div className="relative z-10 text-center space-y-6">
                            <Dna className="w-16 h-16 text-emerald-500 mx-auto animate-spin" style={{ animationDuration: '3s' }} />
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-widest">Mapping 3.2 Billion Base Pairs</h3>
                                <p className="text-xs text-emerald-400 font-mono mt-2">Quantum Superposition Engine Active</p>
                            </div>
                            
                            <div className="max-w-xl mx-auto">
                                <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                                    <span>Processing</span>
                                    <span className="text-emerald-400">{progress}%</span>
                                </div>
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                    <div className="h-full bg-emerald-500 transition-all duration-300 relative" style={{ width: `${progress}%` }}>
                                        <div className="absolute inset-0 bg-white/30 w-full animate-[scan_1s_linear_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
                {resultsReady && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1"
                    >
                        {/* Traits & Risks */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-black border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Activity className="w-5 h-5" /></div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Genetic Fitness Profile</h3>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Muscle Fiber Type</p>
                                        <p className="text-lg font-bold text-white">Type IIa Dominant</p>
                                        <p className="text-xs text-cyan-400 mt-1">High potential for explosive power.</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">VO2 Max Potential</p>
                                        <p className="text-lg font-bold text-white">Elite (Top 5%)</p>
                                        <p className="text-xs text-cyan-400 mt-1">Exceptional endurance capacity.</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Recovery Rate</p>
                                        <p className="text-lg font-bold text-white">Slow</p>
                                        <p className="text-xs text-amber-400 mt-1">Requires 48h between heavy sessions.</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Injury Risk (Tendons)</p>
                                        <p className="text-lg font-bold text-white">Elevated</p>
                                        <p className="text-xs text-red-400 mt-1">COL1A1 gene variant detected.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Database className="w-5 h-5" /></div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Nutrigenomics</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-bold text-white">Caffeine Metabolism</p>
                                            <p className="text-xs text-zinc-400">CYP1A2 Gene</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase rounded-full border border-green-500/30">Fast Metabolizer</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-bold text-white">Carbohydrate Sensitivity</p>
                                            <p className="text-xs text-zinc-400">AMY1 Gene</p>
                                        </div>
                                        <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase rounded-full border border-amber-500/30">Moderate</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <div>
                                            <p className="text-sm font-bold text-white">Lactose Tolerance</p>
                                            <p className="text-xs text-zinc-400">MCM6 Gene</p>
                                        </div>
                                        <span className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-full border border-red-500/30">Intolerant</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Recommendations */}
                        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-[2rem] p-6 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck className="w-32 h-32 text-emerald-500" /></div>
                            <div className="relative z-10 flex-1">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Layers className="w-5 h-5" /></div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">AI Protocol Adjustments</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="p-4 bg-black/40 rounded-xl border border-emerald-500/20">
                                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">Training Override</p>
                                        <p className="text-sm text-zinc-300 leading-relaxed">
                                            Shifted focus to heavy, low-rep compound movements to maximize Type IIa fiber activation. Added mandatory 48h rest between heavy leg days.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-emerald-500/20">
                                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">Dietary Override</p>
                                        <p className="text-sm text-zinc-300 leading-relaxed">
                                            Removed all whey protein and dairy due to MCM6 variant. Substituted with plant-based isolates. Increased pre-workout caffeine dosage to 400mg.
                                        </p>
                                    </div>
                                    <div className="p-4 bg-black/40 rounded-xl border border-emerald-500/20">
                                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">Injury Prevention</p>
                                        <p className="text-sm text-zinc-300 leading-relaxed">
                                            Added daily Vitamin C and Collagen supplementation to counteract COL1A1 tendon risk.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <button className="w-full mt-6 py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Sync to Neural Plan
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};