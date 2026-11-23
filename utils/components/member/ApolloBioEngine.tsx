import React, { useState, useEffect } from 'react';
import { BrainCircuit, Activity, Zap, Cpu, ScanFace, Dna, Hexagon, Crosshair, ChevronRight, AlertTriangle } from 'lucide-react';
import Card from '../common/Card';
import { generateBodyTransformationAnalysis } from '../../../lib/core_ai';

export const ApolloBioEngine: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [insight, setInsight] = useState<string | null>(null);

    const engageApollo = async () => {
        setIsScanning(true);
        setScanProgress(0);
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setScanProgress(progress);
            if(progress >= 100) {
                clearInterval(interval);
                fetchInsight();
            }
        }, 100);
    };

    const fetchInsight = async () => {
        try {
            const stats = { weight: 80, bodyFat: 15, muscleMass: 40, definition: 70 };
            const result = await generateBodyTransformationAnalysis(stats, { weight: 85, bodyFat: 10, muscleMass: 45, definition: 90 }, "God-Tier Physique Optimization");
            setInsight(result);
        } catch (e) {
            setInsight("Apollo Core Offline. Smart link severed.");
        }
        setIsScanning(false);
    };

    return (
        <div className="font-mono text-cyan-400 p-6 max-w-6xl mx-auto space-y-8 animate-fade-in relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none z-0"></div>
            
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 shadow-[0_0_100px_rgba(6,182,212,0.1)] overflow-hidden">
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-cyan-600/20 blur-[100px] rounded-full"></div>
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-black border-2 border-cyan-500 text-cyan-400 rounded-full shadow-[0_0_50px_rgba(6,182,212,0.4)] animate-pulse">
                        <BrainCircuit className="w-12 h-12" />
                    </div>
                    <div>
                        <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter">Apollo<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">.AI</span></h1>
                        <p className="text-xs uppercase tracking-[0.4em] font-black mt-2 text-cyan-500 flex items-center gap-2">
                            <Cpu className="w-4 h-4"/> Next-Gen Bio-Kinematic Engine
                        </p>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end">
                    <div className="flex gap-2 mb-2">
                        {[1,2,3,4,5].map(i => <div key={i} className="w-2 h-8 bg-cyan-500 rounded-sm animate-pulse" style={{ animationDelay: `${i * 100}ms`}}></div>)}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Smart Sync Active</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                
                {/* Main Visualizer */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-black border border-cyan-500/30 rounded-[3rem] p-8 relative overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent"></div>
                        
                        {isScanning ? (
                            <div className="text-center w-full z-10">
                                <ScanFace className="w-24 h-24 text-cyan-400 mx-auto animate-ping mb-6" />
                                <h3 className="text-3xl font-black italic uppercase text-white mb-4 tracking-widest">Scanning Bio-Metrics</h3>
                                <div className="w-full max-w-md mx-auto h-2 bg-gray-900 rounded-full overflow-hidden border border-cyan-500/20">
                                    <div className="h-full bg-cyan-500 shadow-[0_0_20px_cyan]" style={{ width: `${scanProgress}%`}}></div>
                                </div>
                                <p className="text-xs font-mono text-cyan-500 mt-4 tracking-[0.3em]">{scanProgress}% COMPLETE</p>
                            </div>
                        ) : insight ? (
                             <div className="z-10 w-full h-full p-6 bg-cyan-950/20 border border-cyan-500/20 rounded-3xl overflow-y-auto max-h-[500px] custom-scrollbar">
                                 <h3 className="text-2xl font-black text-white italic uppercase tracking-widest mb-6 border-b border-cyan-500/20 pb-4">Apollo Insight Generated</h3>
                                 <div className="prose prose-invert prose-cyan text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: insight }} />
                                 <button onClick={() => setInsight(null)} className="mt-8 px-6 py-2 bg-cyan-500/10 border border-cyan-500 text-cyan-400 rounded-full text-xs font-black uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">Reset Sequence</button>
                             </div>
                        ) : (
                            <div className="text-center z-10">
                                <Hexagon className="w-32 h-32 text-cyan-500/30 mx-auto mb-6 animate-pulse" />
                                <button 
                                    onClick={engageApollo}
                                    className="bg-cyan-500 text-black font-black text-xl italic uppercase tracking-widest px-12 py-6 rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.5)] hover:scale-105 active:scale-95 transition-all outline outline-offset-4 outline-cyan-500/30 flex items-center justify-center gap-3 mx-auto"
                                >
                                    <Zap className="w-6 h-6"/> Engage Apollo Core
                                </button>
                                <p className="text-[10px] text-gray-500 font-black mt-6 tracking-[0.3em] uppercase">Warning: Intensive deep-learning process</p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-black border border-cyan-500/20 rounded-3xl p-6 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                           <Activity className="w-8 h-8 text-cyan-500 mb-4" />
                           <h4 className="text-xl font-black text-white italic uppercase">Nervous System</h4>
                           <p className="text-4xl font-black text-cyan-400 mt-2">Optimal</p>
                           <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-2">Recovery at 98%</p>
                        </div>
                        <div className="bg-black border border-teal-500/20 rounded-3xl p-6 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                           <Dna className="w-8 h-8 text-teal-500 mb-4" />
                           <h4 className="text-xl font-black text-white italic uppercase">Muscle Tissue</h4>
                           <p className="text-4xl font-black text-teal-400 mt-2">Anabolic</p>
                           <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-2">Protein Synthesis Peak</p>
                        </div>
                    </div>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                    <div className="bg-black border border-cyan-500/30 rounded-[2.5rem] p-8 hidden md:block">
                        <h3 className="text-lg font-black text-white uppercase tracking-widest border-b border-cyan-500/30 pb-4 mb-6 flex items-center gap-3">
                            <Crosshair className="w-5 h-5 text-cyan-400"/> Micro-Targets
                        </h3>
                        <ul className="space-y-4">
                            {[
                                { task: "Hydration Spike", status: "PENDING", color: "text-blue-500" },
                                { task: "Cortisol Flush", status: "ACTIVE", color: "text-amber-500" },
                                { task: "mTOR Activation", status: "COMPLETE", color: "text-green-500" },
                                { task: "REM Extension", status: "SCHEDULED", color: "text-purple-500" }
                            ].map((itm, i) => (
                                <li key={i} className="flex justify-between items-center bg-gray-900 rounded-xl p-4 border border-white/5">
                                    <span className="text-xs font-bold text-gray-300 uppercase">{itm.task}</span>
                                    <span className={`text-[9px] font-black ${itm.color} tracking-widest uppercase`}>{itm.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ApolloBioEngine;
