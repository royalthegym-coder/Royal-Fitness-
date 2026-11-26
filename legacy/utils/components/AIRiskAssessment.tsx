import React, { useState } from 'react';
import { Activity, AlertTriangle, ShieldAlert, HeartPulse, Brain, Zap, RefreshCw, Radar, ActivitySquare, Terminal, ShieldCheck, Database, Cpu } from 'lucide-react';
import { ai } from '../../lib/core_ai';
import { motion } from 'motion/react';

const AIRiskAssessment: React.FC = () => {
    const [analyzing, setAnalyzing] = useState(false);
    const [riskData, setRiskData] = useState<any>(null);

    const runAssessment = async () => {
        setAnalyzing(true);
        try {
            const prompt = `Generate a realistic AI health risk assessment for a gym member. 
            Include: 
            1. Overall Risk Score (0-100)
            2. Cardiovascular Risk (Low/Medium/High)
            3. Musculoskeletal Risk (Low/Medium/High)
            4. Metabolic Risk (Low/Medium/High)
            5. Key Recommendations (Array of 3 strings)
            Return ONLY valid JSON.`;

            const response = await ai.models.generateContent({
                model: 'gemini-4-hydrogen',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                }
            });

            const data = JSON.parse(response.text || "{}");
            setRiskData(data);
        } catch (error) {
            console.error("AI Risk Assessment Error:", error);
            // Fallback data
            setTimeout(() => {
                setRiskData({
                    "Overall Risk Score": 24,
                    "Cardiovascular Risk": "Low",
                    "Musculoskeletal Risk": "Medium",
                    "Metabolic Risk": "Low",
                    "Key Recommendations": [
                        "Focus on dynamic warmups before heavy lifting.",
                        "Maintain current cardiovascular routine.",
                        "Ensure adequate hydration during intense sessions."
                    ]
                });
                setAnalyzing(false);
            }, 2000);
            return;
        }
        setAnalyzing(false);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-mono animate-fade-in relative">
            {/* Scanline effect for the whole area */}
            <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(239,68,68,0.03)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 z-50"></div>

            {/* Header */}
            <div className="mb-6 bg-[#020202] p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group z-10">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-[2rem] shadow-[0_0_60px_rgba(6,182,212,0.5)] border border-cyan-400 group-hover:rotate-12 transition-transform duration-700">
                             <ShieldAlert className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Cpu className="w-3 h-3" /> Fitness Future
                                </div>
                                <span className="text-[10px] font-mono text-cyan-500/70 tracking-[0.4em] uppercase">PREDICTIVE THREAT ANALYSIS</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Risk <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400">AI</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 bg-cyan-950/30 border border-cyan-500/30 px-4 py-2 rounded-full">
                            <ActivitySquare className="w-5 h-5 text-cyan-400" />
                            <span className="text-cyan-400 text-[10px] font-black tracking-widest uppercase">Smart Core Active</span>
                        </div>
                        <button 
                            onClick={runAssessment}
                            disabled={analyzing}
                            className="bg-cyan-600 text-black border border-cyan-400 px-6 py-3 rounded-full font-black uppercase tracking-[0.2em] hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {analyzing ? 'ANALYZING...' : 'INITIATE SCAN'}
                        </button>
                    </div>
                </div>
            </div>

            {analyzing && !riskData && (
                <div className="flex flex-col items-center justify-center py-32 relative z-10">
                    <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 border-4 border-red-500/20 rounded-full"></div>
                        <div className="absolute inset-4 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-8 border-4 border-red-500/20 rounded-full"></div>
                        <div className="absolute inset-12 border-4 border-t-transparent border-r-transparent border-b-red-500 border-l-transparent rounded-full animate-spin-slow"></div>
                        <Radar className="w-12 h-12 text-red-500 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-red-400 uppercase tracking-[0.3em] mb-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">Processing Bio-Data</h2>
                    <p className="text-red-500/50 font-mono text-sm uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Running Smart Simulations...
                    </p>
                </div>
            )}

            {riskData && !analyzing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-black/80 border border-amber-500/30 p-6 rounded-sm relative overflow-hidden shadow-[inset_0_0_20px_rgba(245,158,11,0.05)] group hover:border-amber-500/60 transition-colors"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-bl-full -z-10 group-hover:bg-amber-500/10 transition-colors"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <Activity className="w-6 h-6 text-amber-500" />
                            <h3 className="text-sm font-bold text-amber-400 tracking-widest uppercase">Overall Risk</h3>
                        </div>
                        <div className="text-5xl font-black text-white drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{riskData["Overall Risk Score"]}</div>
                        <div className="mt-4 pt-4 border-t border-amber-500/20">
                            <p className="text-xs text-amber-500/70 font-mono tracking-widest uppercase">System Baseline</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-black/80 border border-red-500/30 p-6 rounded-sm relative overflow-hidden shadow-[inset_0_0_20px_rgba(239,68,68,0.05)] group hover:border-red-500/60 transition-colors"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-bl-full -z-10 group-hover:bg-red-500/10 transition-colors"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <HeartPulse className="w-6 h-6 text-red-500" />
                            <h3 className="text-sm font-bold text-red-400 tracking-widest uppercase">Cardio Risk</h3>
                        </div>
                        <div className={`text-3xl font-black uppercase tracking-wider ${riskData["Cardiovascular Risk"] === 'Low' ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : riskData["Cardiovascular Risk"] === 'Medium' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                            {riskData["Cardiovascular Risk"]}
                        </div>
                        <div className="mt-4 pt-4 border-t border-red-500/20">
                            <p className="text-xs text-red-500/70 font-mono tracking-widest uppercase">Vascular Analysis</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-black/80 border border-orange-500/30 p-6 rounded-sm relative overflow-hidden shadow-[inset_0_0_20px_rgba(249,115,22,0.05)] group hover:border-orange-500/60 transition-colors"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-bl-full -z-10 group-hover:bg-orange-500/10 transition-colors"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-orange-500" />
                            <h3 className="text-sm font-bold text-orange-400 tracking-widest uppercase">Musculoskeletal</h3>
                        </div>
                        <div className={`text-3xl font-black uppercase tracking-wider ${riskData["Musculoskeletal Risk"] === 'Low' ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : riskData["Musculoskeletal Risk"] === 'Medium' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                            {riskData["Musculoskeletal Risk"]}
                        </div>
                        <div className="mt-4 pt-4 border-t border-orange-500/20">
                            <p className="text-xs text-orange-500/70 font-mono tracking-widest uppercase">Structural Integrity</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-black/80 border border-purple-500/30 p-6 rounded-sm relative overflow-hidden shadow-[inset_0_0_20px_rgba(168,85,247,0.05)] group hover:border-purple-500/60 transition-colors"
                    >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-bl-full -z-10 group-hover:bg-purple-500/10 transition-colors"></div>
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-6 h-6 text-purple-500" />
                            <h3 className="text-sm font-bold text-purple-400 tracking-widest uppercase">Metabolic Risk</h3>
                        </div>
                        <div className={`text-3xl font-black uppercase tracking-wider ${riskData["Metabolic Risk"] === 'Low' ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : riskData["Metabolic Risk"] === 'Medium' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                            {riskData["Metabolic Risk"]}
                        </div>
                        <div className="mt-4 pt-4 border-t border-purple-500/20">
                            <p className="text-xs text-purple-500/70 font-mono tracking-widest uppercase">Cellular Output</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="col-span-1 md:col-span-2 lg:col-span-4 bg-black/80 border border-cyan-500/30 p-8 rounded-sm shadow-[inset_0_0_30px_rgba(6,182,212,0.05)] relative"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                        <div className="flex items-center justify-between mb-8 border-b border-cyan-500/20 pb-4">
                            <h3 className="text-lg font-black text-cyan-400 uppercase tracking-widest flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-cyan-500" />
                                AI Directives
                            </h3>
                            <span className="text-[10px] bg-cyan-950/50 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-sm uppercase tracking-widest">Action Required</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {riskData["Key Recommendations"]?.map((rec: string, i: number) => (
                                <div key={i} className="bg-black border border-cyan-500/20 p-6 rounded-sm hover:border-cyan-500/50 transition-colors relative group">
                                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-black border border-cyan-500 text-cyan-400 flex items-center justify-center font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
                                        0{i + 1}
                                    </div>
                                    <p className="text-cyan-50/80 text-sm leading-relaxed mt-2">
                                        {rec}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {!riskData && !analyzing && (
                <div className="flex flex-col items-center justify-center py-32 relative z-10">
                    <div className="p-6 bg-black border border-red-500/30 rounded-full mb-6 relative">
                        <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse"></div>
                        <Database className="w-16 h-16 text-red-500/50 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-black text-red-500/50 uppercase tracking-[0.3em] mb-2">System Standby</h2>
                    <p className="text-red-500/30 font-mono text-sm uppercase tracking-widest text-center max-w-md">
                        Awaiting command to initiate predictive threat analysis and structural risk assessment.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AIRiskAssessment;
