import React, { useState, useEffect } from 'react';
import { Dna, Activity, Zap, Database, CheckCircle2, AlertTriangle, Fingerprint, Network, Microscope, ShieldCheck, RefreshCw, Layers, Cpu } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../context/DataProvider';
import { generateDNAProfile } from '../../lib/core_ai';

export const FitnessFutureDNA: React.FC<{ memberId?: number }> = ({ memberId }) => {
    const { addToast } = useToast();
    const { members } = useData();
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>(memberId || '');
    const [isSequencing, setIsSequencing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultsReady, setResultsReady] = useState(false);
    const [dnaData, setDnaData] = useState<any>(null);

    const selectedMember = members.find(m => m.id === Number(selectedMemberId));

    const handleSequence = async () => {
        if (!selectedMemberId) {
            addToast("Please select a member first.", "error");
            return;
        }

        setIsSequencing(true);
        setProgress(0);
        setResultsReady(false);
        setDnaData(null);
        addToast("FitnessFutureDNA Sequencing Initiated...", "info");

        // Start progress animation
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 95) return 95; // Hold at 95% until API returns
                return p + Math.floor(Math.random() * 15) + 5;
            });
        }, 500);

        try {
            const data = await generateDNAProfile(selectedMember);
            clearInterval(interval);
            setProgress(100);
            setDnaData(data);
            
            setTimeout(() => {
                setIsSequencing(false);
                setResultsReady(true);
                addToast("Genomic Mapping Complete. Insights Unlocked.", "success");
            }, 500);

        } catch (error) {
            clearInterval(interval);
            setIsSequencing(false);
            addToast("Sequencing failed. Please try again.", "error");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            {/* Header */}
            <div className="mb-6 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <Dna className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">GENOMIC ENGINE</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Fitness Future<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">DNA</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <select 
                            value={selectedMemberId}
                            onChange={(e) => {
                                setSelectedMemberId(Number(e.target.value));
                                setResultsReady(false);
                                setDnaData(null);
                            }}
                            className="bg-black border border-cyan-500/50 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] min-w-[200px]"
                        >
                            <option value="">Select Member</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>

                        {!resultsReady && !isSequencing && (
                            <button 
                                onClick={handleSequence}
                                disabled={!selectedMemberId}
                                className="bg-cyan-600 text-black font-black px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:bg-cyan-500 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                <Zap className="w-4 h-4"/> Sequence Genome
                            </button>
                        )}
                    </div>
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
                                <p className="text-xs text-emerald-400 font-mono mt-2">FitnessFutureSuperposition Engine Active</p>
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
                {resultsReady && dnaData && (
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
                                        <p className="text-lg font-bold text-white">{dnaData.fitnessProfile?.muscleFiberType?.value || 'Type IIa Dominant'}</p>
                                        <p className="text-xs text-cyan-400 mt-1">{dnaData.fitnessProfile?.muscleFiberType?.description || 'High potential for explosive power.'}</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">VO2 Max Potential</p>
                                        <p className="text-lg font-bold text-white">{dnaData.fitnessProfile?.vo2MaxPotential?.value || 'Elite (Top 5%)'}</p>
                                        <p className="text-xs text-cyan-400 mt-1">{dnaData.fitnessProfile?.vo2MaxPotential?.description || 'Exceptional endurance capacity.'}</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Recovery Rate</p>
                                        <p className="text-lg font-bold text-white">{dnaData.fitnessProfile?.recoveryRate?.value || 'Slow'}</p>
                                        <p className="text-xs text-amber-400 mt-1">{dnaData.fitnessProfile?.recoveryRate?.description || 'Requires 48h between heavy sessions.'}</p>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Injury Risk (Tendons)</p>
                                        <p className="text-lg font-bold text-white">{dnaData.fitnessProfile?.injuryRisk?.value || 'Elevated'}</p>
                                        <p className="text-xs text-red-400 mt-1">{dnaData.fitnessProfile?.injuryRisk?.description || 'COL1A1 gene variant detected.'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Database className="w-5 h-5" /></div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest">Nutrigenomics</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    {dnaData.nutrigenomics?.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                            <div>
                                                <p className="text-sm font-bold text-white">{item.trait}</p>
                                                <p className="text-xs text-zinc-400">{item.gene} Gene</p>
                                            </div>
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border ${
                                                item.color === 'green' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                item.color === 'amber' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                                'bg-red-500/20 text-red-400 border-red-500/30'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    ))}
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
                                    {dnaData.aiAdjustments?.map((adj: any, idx: number) => (
                                        <div key={idx} className="p-4 bg-black/40 rounded-xl border border-emerald-500/20">
                                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2">{adj.category}</p>
                                            <p className="text-sm text-zinc-300 leading-relaxed">
                                                {adj.recommendation}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <button className="w-full mt-6 py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Sync to Smart Plan
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};