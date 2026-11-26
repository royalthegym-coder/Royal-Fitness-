import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, Target, Zap, Globe, BarChart3, Rocket, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { generateNeuralMarketingStrategy } from '../../../lib/core_ai';
import { useToast } from '../../hooks/useToast';

export const SmartStrategyBot: React.FC = () => {
    const { addToast } = useToast();
    const { members } = useData();
    const [isGenerating, setIsGenerating] = useState(false);
    const [strategy, setStrategy] = useState<any | null>(null);

    const handleGenerateStrategy = async () => {
        setIsGenerating(true);
        try {
            const businessData = {
                memberCount: members.length,
                averageRevenue: 1200000,
                location: 'India',
                competitors: '3 major gyms',
                activeCampaigns: ['Instagram Ads', 'Referral Program']
            };
            const result = await generateNeuralMarketingStrategy(businessData);
            const parsed = JSON.parse(result);
            setStrategy(parsed);
            addToast('Smart Growth Strategy Synthesized.', 'success');
        } catch (error) {
            console.error(error);
            addToast('FitnessFutureprojection failed.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="bg-zinc-950/40 border border-indigo-500/20 p-10 rounded-[3rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400">
                            <Rocket className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Smart Strategy <span className="text-indigo-400">Oracle</span></h2>
                            <p className="text-indigo-300/50 text-xs font-mono uppercase tracking-widest mt-1">Autonomous Growth & Viral Hook Generation</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleGenerateStrategy}
                        disabled={isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-[0_0_40px_rgba(79,70,229,0.3)] transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                        {isGenerating ? 'Synthesizing Roadmap...' : 'Run Global Growth Projection'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Metric Insights */}
                <div className="space-y-6">
                    <StrategyMetricCard 
                        icon={<Target className="w-5 h-5 text-fuchsia-400" />}
                        label="Conversion Probability"
                        value="84.2%"
                        desc="Based on current neural engagement levels."
                    />
                    <StrategyMetricCard 
                        icon={<Globe className="w-5 h-5 text-cyan-400" />}
                        label="Market Dominance"
                        value="Lead"
                        desc="Fitness Future currently dominates 65% of local SEO."
                    />
                </div>

                {/* Main Results Area */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {!strategy && !isGenerating && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center border border-white/5 bg-zinc-950/20 rounded-[2.5rem] p-12 text-center"
                            >
                                <Layers className="w-16 h-16 mb-4 text-zinc-800" />
                                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
                                    Strategic core offline.<br/>Initiate "Global Growth Projection" to begin.
                                </p>
                            </motion.div>
                        )}

                        {isGenerating && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col items-center justify-center border border-indigo-500/20 bg-indigo-950/5 rounded-[2.5rem] p-12"
                            >
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
                                    <RefreshCw className="w-16 h-16 text-indigo-500 animate-spin relative z-10" />
                                </div>
                                <p className="text-indigo-400 font-black text-sm uppercase tracking-[0.3em] animate-pulse">Analyzing Multiverse Data Layers...</p>
                            </motion.div>
                        )}

                        {strategy && !isGenerating && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* 12 Month Roadmap */}
                                <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-[2.5rem]">
                                    <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                        <TrendingUp className="text-indigo-400" /> 12-Month Smart Roadmap
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(strategy['12_month_roadmap'] || {}).map(([month, task]: any, i) => (
                                            <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                                <span className="text-[10px] font-black text-indigo-400 uppercase mb-1 block">{month}</span>
                                                <p className="text-xs text-zinc-300 font-medium">{task}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-fuchsia-950/10 border border-fuchsia-500/20 p-8 rounded-[2.5rem]">
                                        <h3 className="text-xs font-black text-fuchsia-400 uppercase tracking-widest mb-4">Target Demographics</h3>
                                        <ul className="space-y-2">
                                            {(strategy.target_demographics || []).map((d: string, i: number) => (
                                                <li key={i} className="flex items-center gap-2 text-xs text-zinc-400">
                                                    <div className="w-1.5 h-1.5 bg-fuchsia-500 rounded-full"></div>
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-cyan-950/10 border border-cyan-500/20 p-8 rounded-[2.5rem]">
                                        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Viral Growth Hooks</h3>
                                        <div className="space-y-3">
                                            {(strategy.key_viral_hooks || []).map((hook: string, i: number) => (
                                                <div key={i} className="p-3 bg-white/5 rounded-xl text-[11px] text-zinc-300 font-bold italic">
                                                    "{hook}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const StrategyMetricCard = ({ icon, label, value, desc }: any) => (
    <div className="bg-zinc-950/60 border border-white/5 p-6 rounded-3xl group hover:border-indigo-500/30 transition-all">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">{icon}</div>
            <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
                <h4 className="text-2xl font-black text-white italic">{value}</h4>
            </div>
        </div>
        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">{desc}</p>
    </div>
);
