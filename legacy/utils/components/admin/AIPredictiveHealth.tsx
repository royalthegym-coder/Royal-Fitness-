import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, AlertCircle, ShieldAlert, Heart, Stethoscope, RefreshCw, Zap, UserCheck, Pill } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { generatePredictiveHealthRisk } from '../../../lib/core_ai';
import { useToast } from '../../hooks/useToast';

export const AIPredictiveHealth: React.FC = () => {
    const { addToast } = useToast();
    const { members } = useData();
    const [activeMemberId, setActiveMemberId] = useState<number>(members.length > 0 ? members[0].id : 0);
    const member = members.find(m => m.id === activeMemberId);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [riskData, setRiskData] = useState<any | null>(null);

    const handleRunAnalysis = async () => {
        if (!member) return;
        setIsAnalyzing(true);
        try {
            const result = await generatePredictiveHealthRisk(member);
            setRiskData(JSON.parse(result));
            addToast(`Predictive analysis for ${member.name} complete.`, 'success');
        } catch (error) {
            console.error(error);
            addToast('Clinical uplink failed.', 'error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
            <div className="bg-[#020202] p-10 rounded-[3.5rem] border border-emerald-500/20 relative overflow-hidden group shadow-[0_0_80px_rgba(16,185,129,0.1)]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/30 text-emerald-400">
                            <Activity className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mb-2 border border-emerald-500/30">
                                AI ANALYST BIO-ORACLE
                            </div>
                            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Predictive <span className="text-emerald-400">Health</span> Oracle</h2>
                            <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mt-1">90-Day Smart Risk Assessment Detected by AI</p>
                        </div>
                    </div>
                    {member && (
                        <button 
                            onClick={handleRunAnalysis}
                            disabled={isAnalyzing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-black px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isAnalyzing ? <RefreshCw className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5 fill-current" />}
                            Run Health Analysis
                        </button>
                    )}
                </div>
            </div>

            {!member ? (
                 <div className="text-center p-20 border border-white/5 bg-zinc-950/20 rounded-[3rem]">
                    <UserCheck className="w-16 h-16 mx-auto mb-4 text-zinc-800" />
                    <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">Select a member to activate biometric prediction</p>
                 </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Member Summary Card */}
                    <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-emerald-500/30 mb-6 p-1">
                            <img src={member.avatar || "https://i.pravatar.cc/150?u=" + member.id} alt={member.name} className="w-12 h-12 rounded-full object-cover border border-white/10" />
                        </div>
                        <h3 className="text-2xl font-black text-white italic">{member.name}</h3>
                        <p className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest mb-4">AI Performance Tracking Active</p>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] text-zinc-500 uppercase mb-1">Health Score</p>
                                <p className="text-lg font-black text-white">{member.health_score || 85}%</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-[9px] text-zinc-500 uppercase mb-1">Bio-Age</p>
                                <p className="text-lg font-black text-white">{member.bio_age || 28}</p>
                            </div>
                        </div>
                    </div>

                    {/* Results Container */}
                    <div className="min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {!riskData && !isAnalyzing && (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-10 text-center"
                                >
                                    <ShieldAlert className="w-12 h-12 text-zinc-800 mb-4" />
                                    <p className="text-zinc-600 font-mono text-xs leading-relaxed">
                                        Clinical reasoning core initializing.<br/>Waiting for manual uplink...
                                    </p>
                                </motion.div>
                            )}

                            {isAnalyzing && (
                                <motion.div 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center bg-emerald-950/5 border border-emerald-500/20 rounded-[2.5rem] p-10"
                                >
                                    <div className="w-16 h-1 bg-emerald-500/20 absolute top-0 -translate-y-full animate-scan rounded-full focus:shadow-[0_0_20px_#10b981]"></div>
                                    <Heart className="w-16 h-16 text-emerald-500 animate-pulse mb-6" />
                                    <p className="text-emerald-400 font-black text-sm uppercase tracking-[0.3em] animate-pulse">Scanning Bio-Log Integrity...</p>
                                </motion.div>
                            )}

                            {riskData && !isAnalyzing && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-6"
                                >
                                    {/* Risk Level Header */}
                                    <div className={`p-8 rounded-[2.5rem] border ${riskData.risk_level === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4">90-Day Risk Prediction</span>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black border uppercase ${riskData.risk_level === 'High' ? 'bg-red-500 text-white border-red-400' : 'bg-emerald-500 text-black border-emerald-400'}`}>
                                                {riskData.risk_level} Risk
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed italic">
                                            "Our AI models have detected {riskData.potential_issues?.length || 0} potential biomechanical anomalies in the upcoming training cycle."
                                        </p>
                                    </div>

                                    {/* Issues & Actions */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-zinc-950 p-6 rounded-[2rem] border border-white/5">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Stethoscope className="w-4 h-4 text-emerald-400" /> Potential Anomalies
                                            </h4>
                                            <ul className="space-y-2">
                                                {(riskData.potential_issues || []).map((issue: string, i: number) => (
                                                    <li key={i} className="text-xs text-white font-medium p-3 bg-white/5 rounded-xl border border-white/5">
                                                        {issue}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="bg-zinc-950 p-6 rounded-[2rem] border border-white/5">
                                            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Pill className="w-4 h-4 text-emerald-400" /> Preventative Supplements
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(riskData.recommended_supplements || []).map((supp: string, i: number) => (
                                                    <span key={i} className="px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                        {supp}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};
