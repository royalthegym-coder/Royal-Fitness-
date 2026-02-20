
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    Dna, Lock, ShieldCheck, Zap, Activity, 
    Thermometer, TrendingUp, Cpu, BrainCircuit,
    Flame, Wind, RefreshCw, AlertTriangle, 
    CheckCircle, Binary, Fingerprint, Database, Beaker,
    Download, Upload, FileCode, Layers, Search, ChevronRight,
    Sparkles, Clock, Share2, Scan
} from 'lucide-react';
import { BotIcon } from '../icons/BotIcon';
import { useToast } from '../../hooks/useToast';
import { getComplexResponse } from '../../../lib/gemini';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';

// --- HOLOGRAPHIC HELIX ENGINE ---
const HelixVisualizer: React.FC<{ scanning: boolean }> = ({ scanning }) => {
    return (
        <div className="relative h-[500px] w-full flex items-center justify-center overflow-hidden bg-black rounded-[3.5rem] border border-indigo-500/20 shadow-2xl group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.1)_0%,_transparent_70%)]"></div>
            
            {/* DNA Strand Animation */}
            <div className={`relative w-full h-full flex flex-col items-center justify-center transition-all duration-1000 ${scanning ? 'scale-110' : 'scale-100'}`}>
                {/* Central DNA Icon with Glow */}
                <div className="relative z-10">
                    <Dna className={`w-64 h-64 text-indigo-500 opacity-80 ${scanning ? 'animate-spin-slow duration-[3s]' : 'animate-pulse'}`} />
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
                </div>
                
                {/* Floating Particles */}
                <div className="absolute inset-0 w-full h-full">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i}
                            className={`absolute w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan] ${scanning ? 'animate-[ping_2s_infinite]' : 'opacity-20'}`}
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        ></div>
                    ))}
                </div>
            </div>

            {/* Scanning Laser */}
            {scanning && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                     <div className="w-full h-1 bg-cyan-400 shadow-[0_0_30px_cyan] animate-scan opacity-80"></div>
                     <div className="absolute bottom-10 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-cyan-500/50">
                         <p className="text-cyan-400 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Sequencing Nucleotides...</p>
                     </div>
                </div>
            )}

            {!scanning && (
                <div className="absolute bottom-8 right-8 z-20">
                     <div className="flex items-center gap-2 bg-indigo-900/30 px-4 py-2 rounded-xl border border-indigo-500/30 backdrop-blur-md">
                         <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                         <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Double Helix Stable</span>
                     </div>
                </div>
            )}
        </div>
    );
};

const BiomarkerVault: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);
    
    // --- 1. SOVEREIGN ENGINE STATES ---
    const [isSequencing, setIsSequencing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [activeTraitTab, setActiveTraitTab] = useState<'Fitness' | 'Nutrition' | 'Metabolism'>('Fitness');
    const [aiStrategy, setAiStrategy] = useState<string | null>(null);
    const [isThinking, setIsThinking] = useState(false);
    
    // Mocking Epigenetic Data based on real member stats
    const healthScore = member?.health_score || 85;
    const bioAge = member?.biologicalAge || 24;
    const realAge = 28;

    const [genes, setGenes] = useState([
        { id: 'mTOR', label: 'Muscle Growth', status: healthScore > 80, desc: 'High anabolic signal detected.' },
        { id: 'SIRT1', label: 'Longevity/Repair', status: true, desc: 'Cellular repair protocol active.' },
        { id: 'BDNF', label: 'Neural Plasticity', status: healthScore > 90, desc: 'Synaptic growth phase.' },
        { id: 'PGC-1α', label: 'Mito-Genesis', status: false, desc: 'Endurance threshold low.' }
    ]);

    const traits: Record<string, any[]> = {
        Fitness: [
            { gene: 'ACTN3', genotype: 'RR (Power)', impact: 'Elite explosive power potential. Fast-twitch dominance.', status: 'Gifted' },
            { gene: 'ACE', genotype: 'ID (Hybrid)', impact: 'Balanced endurance and power output.', status: 'Normal' },
            { gene: 'COL5A1', genotype: 'TT (Flexible)', impact: 'Reduced injury risk. High tendon elasticity.', status: 'Optimal' },
        ],
        Nutrition: [
            { gene: 'CYP1A2', genotype: 'AA (Fast)', impact: 'Rapid caffeine metabolism. Pre-workout effective.', status: 'Gifted' },
            { gene: 'LCT', genotype: 'CC (Intolerant)', impact: 'Lactose sensitivity detected. Avoid dairy.', status: 'Warning' },
            { gene: 'FTO', genotype: 'AT (Risk)', impact: 'Higher satiety threshold. High protein diet required.', status: 'Action Needed' },
        ],
        Metabolism: [
            { gene: 'ADRB2', genotype: 'GG (Burn)', impact: 'High fat mobilization during cardio.', status: 'Gifted' },
            { gene: 'PPARG', genotype: 'Pro/Ala', impact: 'Efficient carb utilization post-workout.', status: 'Optimal' },
        ]
    };

    // Radar Data for Genetic Profile
    const radarData = [
        { subject: 'Power', A: 95, fullMark: 100 },
        { subject: 'Endurance', A: 60, fullMark: 100 },
        { subject: 'Recovery', A: 85, fullMark: 100 },
        { subject: 'Metabolism', A: 75, fullMark: 100 },
        { subject: 'Injury Res.', A: 90, fullMark: 100 },
    ];

    const triggerDeepScan = () => {
        setIsSequencing(true);
        setTimeout(() => {
            setIsSequencing(false);
            setGenes(prev => prev.map(g => ({ ...g, status: Math.random() > 0.3 })));
            addToast("Epigenetic Refresh Complete. Matrix Updated.", "success");
        }, 3000);
    };

    const handleImportData = () => {
        setIsImporting(true);
        setTimeout(() => {
            setIsImporting(false);
            addToast("Raw Data (23andMe) Successfully Assimilated.", "success");
        }, 2000);
    };

    const generateGeneticStrategy = async () => {
        setIsThinking(true);
        setAiStrategy(null);
        
        const prompt = `
            ACT AS GENETIC FITNESS EXPERT AI.
            Subject: ${member?.name}.
            Traits: ACTN3 (Power), CYP1A2 (Fast Caffeine), LCT (Lactose Intolerant).
            Goal: Maximize genetic potential.
            
            Create a "Genetic Action Plan" in HTML format:
            1. <h4 class="text-cyan-400 font-bold uppercase text-xs mb-2">Training Directive</h4> (Based on ACTN3)
            2. <h4 class="text-green-400 font-bold uppercase text-xs mb-2">Fuel Protocol</h4> (Based on CYP1A2/LCT)
            3. <h4 class="text-purple-400 font-bold uppercase text-xs mb-2">Longevity Hack</h4> (General advice)
            
            Keep it concise and scientific.
        `;

        try {
            const res = await getComplexResponse(prompt);
            setAiStrategy(res);
            addToast("Genetic Strategy Synthesized.", "success");
        } catch (e) {
            addToast("Neural Link Failed.", "error");
        } finally {
            setIsThinking(false);
        }
    };

    if (!member) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            {/* SOVEREIGN VAULT HEADER */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-indigo-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(79,70,229,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-indigo-600 text-white rounded-[3rem] shadow-[0_0_60px_rgba(99,102,241,0.5)] border border-indigo-400 group-hover:rotate-12 transition-transform duration-700">
                             <Fingerprint className="w-16 h-16" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="px-5 py-2 bg-indigo-500 text-black rounded-full flex items-center gap-3 shadow-lg font-black uppercase tracking-[0.2em] text-[10px]">
                                    Helix v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">DNA_SEQUENCE: LOCKED</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Biomarker <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Vault</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                         <div className="px-10 py-5 text-center border-r border-white/5">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Genetic Age</p>
                             <div className="flex items-center gap-2 justify-center">
                                 <Clock className="w-4 h-4 text-purple-400" />
                                 <p className="text-4xl font-black text-white italic">{bioAge}</p>
                             </div>
                         </div>
                         <div className="px-10 py-5 text-center">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Chronological</p>
                             <p className="text-4xl font-black text-gray-500 italic">{realAge}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. LEFT COLUMN: HELIX & RADAR */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Helix Engine */}
                    <HelixVisualizer scanning={isSequencing} />

                    {/* Genetic Radar */}
                    <Card title="Phenotype Profile" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl h-[350px]">
                        <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#333" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                                    <Radar name="Genetic Potential" dataKey="A" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.4} />
                                    <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="p-8 bg-black border border-indigo-500/20 rounded-[3rem] shadow-xl text-center">
                        <h4 className="text-white font-black uppercase text-sm mb-4 tracking-widest flex items-center justify-center gap-2">
                            <Database className="w-4 h-4 text-indigo-500"/> External Data Import
                        </h4>
                        <p className="text-[10px] text-gray-500 mb-6">Connect 23andMe / AncestryDNA raw data for deeper insights.</p>
                        <button 
                            onClick={handleImportData}
                            disabled={isImporting}
                            className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                            {isImporting ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Upload className="w-3 h-3"/>}
                            {isImporting ? 'PARSING FILE...' : 'UPLOAD RAW DATA'}
                        </button>
                    </div>
                </div>

                {/* 2. RIGHT COLUMN: EPIGENETICS & STRATEGY */}
                <div className="lg:col-span-7 space-y-8">
                    
                    {/* Epigenetic Control Panel */}
                    <Card title="Epigenetic Expression" className="bg-[#0c0c0c] border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-32 h-32 text-indigo-400"/></div>
                        
                        <div className="space-y-4 relative z-10">
                            {genes.map((gene) => (
                                <div key={gene.id} className="p-5 bg-black/60 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${gene.status ? 'bg-green-900/20 text-green-500' : 'bg-red-900/20 text-red-500'}`}>
                                            <Dna className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold uppercase text-sm tracking-tight">{gene.label} ({gene.id})</p>
                                            <p className="text-[10px] text-gray-500 mt-1 font-medium">{gene.desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${gene.status ? 'text-green-500' : 'text-red-500'}`}>
                                            {gene.status ? 'EXPRESSED' : 'SILENT'}
                                        </span>
                                        <div className={`w-3 h-3 rounded-full ${gene.status ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={triggerDeepScan}
                            disabled={isSequencing}
                            className="w-full mt-8 bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-2xl hover:bg-indigo-500 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 relative z-10"
                        >
                            {isSequencing ? <RefreshCw className="animate-spin w-4 h-4"/> : <Activity className="w-4 h-4" />}
                            {isSequencing ? 'SEQUENCING...' : 'REFRESH EXPRESSION MATRIX'}
                        </button>
                    </Card>

                    {/* Genetic Advantage Matrix */}
                    <Card title="Genetic Advantage Matrix" className="bg-[#0c0c0c] border-white/5 p-10 rounded-[3.5rem] shadow-2xl h-full flex flex-col relative overflow-hidden">
                        <div className="flex bg-black/60 p-1.5 rounded-2xl border border-white/10 mb-8 w-fit backdrop-blur-md relative z-10">
                            {(['Fitness', 'Nutrition', 'Metabolism'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTraitTab(tab)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTraitTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4 flex-1 relative z-10">
                            {traits[activeTraitTab].map((trait, i) => (
                                <div key={i} className="p-6 bg-gray-900/50 rounded-[2rem] border border-white/5 group hover:border-indigo-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="text-xl font-black text-white italic">{trait.gene}</h4>
                                                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 font-mono border border-white/10">{trait.genotype}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-bold">{trait.impact}</p>
                                        </div>
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                            trait.status === 'Gifted' ? 'bg-purple-900/20 text-purple-400 border border-purple-500/30' :
                                            trait.status === 'Warning' ? 'bg-red-900/20 text-red-400 border border-red-500/30' :
                                            trait.status === 'Optimal' ? 'bg-green-900/20 text-green-400 border border-green-500/30' :
                                            'bg-gray-800 text-gray-400 border border-gray-700'
                                        }`}>
                                            {trait.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
                            <button 
                                onClick={generateGeneticStrategy}
                                disabled={isThinking}
                                className="w-full bg-white text-black font-black py-5 rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.2)] hover:bg-indigo-400 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isThinking ? <RefreshCw className="animate-spin w-4 h-4"/> : <BotIcon className="w-4 h-4"/>}
                                {isThinking ? 'ANALYZING DNA STRANDS...' : 'GENERATE ACTION PLAN'}
                            </button>

                            {aiStrategy && (
                                <div className="mt-6 bg-indigo-900/10 border border-indigo-500/30 p-6 rounded-[2rem] animate-fade-in shadow-inner">
                                    <div className="prose prose-invert prose-sm text-indigo-200 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: aiStrategy }} />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default BiomarkerVault;
