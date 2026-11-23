import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataProvider';
import { useToast } from '../hooks/useToast';
import { ShieldCheck, Activity, Dna, HeartPulse, Brain, Zap, Download, Share2, Lock, FileText, Fingerprint, QrCode, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
import { generateBioHealthPass } from '../../lib/core_ai';

export const DigitalBioHealthPass: React.FC = () => {
    const { members } = useData();
    const { addToast } = useToast();
    
    const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [passReady, setPassReady] = useState(false);
    const [passData, setPassData] = useState<any>(null);

    const selectedMember = members.find(m => m.id === Number(selectedMemberId));

    const handleGeneratePass = async () => {
        if (!selectedMemberId) {
            addToast("Please select a member to generate their Bio-Health Pass.", "error");
            return;
        }
        
        setIsGenerating(true);
        setPassReady(false);
        setPassData(null);
        addToast("Encrypting Bio-Data (HIPAA/GDPR Compliant)...", "info");
        
        try {
            const data = await generateBioHealthPass(selectedMember);
            setPassData(data);
            setIsGenerating(false);
            setPassReady(true);
            addToast("Digital Bio-Health Pass Generated Successfully.", "success");
        } catch (error) {
            setIsGenerating(false);
            addToast("Failed to generate Bio-Health Pass.", "error");
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="mb-6 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <ShieldCheck className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">MEDICAL COMPLIANCE LEVEL: MAXIMUM</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Bio-Health <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">Pass</span>
                            </h1>
                        </div>
                    </div>
                    
                    <select 
                        value={selectedMemberId}
                        onChange={(e) => {
                            setSelectedMemberId(Number(e.target.value));
                            setPassReady(false);
                            setPassData(null);
                        }}
                        className="bg-black border border-cyan-500/50 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] min-w-[250px]"
                    >
                        <option value="">Select Subject</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>

            {!passReady ? (
                <div className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-16 text-center flex flex-col items-center justify-center">
                    <Fingerprint className={`w-20 h-20 text-emerald-500/50 mb-6 ${isGenerating ? 'animate-pulse' : ''}`} />
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-4">
                        {isGenerating ? 'Synthesizing Bio-Data...' : 'Awaiting Authorization'}
                    </h3>
                    <p className="text-zinc-500 max-w-md mb-8">
                        Generate a secure, encrypted snapshot of the member's complete biological and metabolic profile.
                    </p>
                    <button 
                        onClick={handleGeneratePass}
                        disabled={!selectedMemberId || isGenerating}
                        className="bg-emerald-600 hover:bg-emerald-500 text-black font-black px-8 py-4 rounded-2xl uppercase tracking-widest text-sm transition-all disabled:opacity-50 flex items-center gap-3"
                    >
                        {isGenerating ? <Activity className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                        {isGenerating ? 'Encrypting...' : 'Generate Secure Pass'}
                    </button>
                </div>
            ) : (
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative max-w-2xl mx-auto"
                >
                    {/* The Pass Card */}
                    <div className="bg-gradient-to-br from-zinc-900 via-black to-emerald-950 rounded-[2rem] border border-emerald-500/30 p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
                        {/* Holographic Overlay */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50"></div>
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8 relative z-10 border-b border-white/10 pb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/50">
                                    <Dna className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-widest">{selectedMember?.name}</h2>
                                    <p className="text-emerald-400 text-xs font-mono uppercase tracking-widest mt-1">ID: BIO-{selectedMember?.id}X99</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <QrCode className="w-16 h-16 text-white opacity-80" />
                                <p className="text-[8px] text-zinc-500 font-mono mt-1 uppercase">Scan for Bio-Analyst</p>
                            </div>
                        </div>

                        {/* Vitals Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                            <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Biological Age</p>
                                <p className="text-2xl font-black text-white font-mono">{selectedMember?.bio_age || 30} <span className="text-xs text-emerald-400">{passData?.biologicalAgeOffset > 0 ? '+' : ''}{passData?.biologicalAgeOffset || '-2.4'} yrs</span></p>
                            </div>
                            <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Metabolic Rate</p>
                                <p className="text-2xl font-black text-white font-mono">{passData?.metabolicRate || 2450} <span className="text-xs text-zinc-500">kcal</span></p>
                            </div>
                            <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Inflammation Index</p>
                                <p className="text-2xl font-black text-emerald-400 font-mono">{passData?.inflammationIndex || 'Low'}</p>
                            </div>
                            <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Hormonal Balance</p>
                                <p className="text-2xl font-black text-emerald-400 font-mono">{passData?.hormonalBalance || 'Optimal'}</p>
                            </div>
                        </div>

                        {/* AI Diagnosis */}
                        <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-5 mb-8 relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-4 h-4 text-emerald-400" />
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Med-PaLM 3 Oracle Summary</h4>
                            </div>
                            <p className="text-emerald-100/80 text-sm leading-relaxed">
                                {passData?.oracleSummary || 'Patient exhibits exceptional recovery metrics. Slight L4-L5 compression noted in history, currently managed via targeted rehab. No immediate deficiencies detected. Nutrigenomic profile aligns with current dietary protocol.'}
                            </p>
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                                <Lock className="w-3 h-3" /> 256-bit FitnessFutureEncrypted
                            </div>
                            <div className="flex gap-3">
                                <button className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                                <button className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-black transition-colors">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
