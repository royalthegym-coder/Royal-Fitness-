
import React, { useState, useMemo } from 'react';
import Card from './common/Card';
import { useData } from '../context/DataProvider';
import { generateClinicalFitnessProtocol } from '../../lib/gemini';
import { 
    Microscope, Shield, Upload, RefreshCw, Send, FileText, 
    User, Edit3, Heart, Zap, Activity, CheckCircle, 
    Dna, Fingerprint, Database, Sparkles, ShieldAlert,
    ChevronRight, ArrowUpRight, Beaker, Scan, AlertTriangle, Cpu,
    Thermometer, BrainCircuit, Droplets, Bone, Pill, Cross, Infinity
} from 'lucide-react';
import { BotIcon } from './icons/BotIcon';
import { useToast } from '../hooks/useToast';
import { MedicalReport, AIRecommendation, Member } from '../../types';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const HealthEngine: React.FC = () => {
    const { 
        members, addMedicalReport, 
        addAiRecommendation, approveRecommendation, updateMember, liveHealthData
    } = useData();
    const { addToast } = useToast();
    
    const [selectedId, setSelectedId] = useState<number | null>(members[0]?.id || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [activeStage, setActiveStage] = useState<'hub' | 'lab' | 'approval'>('hub');
    const [aiDraft, setAiDraft] = useState<AIRecommendation | null>(null);
    const [activeOrgan, setActiveOrgan] = useState<'General' | 'Heart' | 'Metabolism' | 'Recovery'>('General');

    const member = members.find(m => m.id === selectedId);

    // --- MOCK DATA GENERATORS (Apex Features) ---
    
    // 1. Predictive Chrono-Health (Future Projection)
    const predictionData = useMemo(() => {
        const currentBioAge = aiDraft?.bio_age || member?.bio_age || 30;
        return [
            { month: 'Now', age: currentBioAge },
            { month: 'M+1', age: currentBioAge - 0.5 },
            { month: 'M+2', age: currentBioAge - 1.2 },
            { month: 'M+3', age: currentBioAge - 2.0 },
            { month: 'M+6', age: currentBioAge - 3.5 }, // Target
        ];
    }, [aiDraft, member]);

    // 2. Biomarker Radar
    const biomarkerData = useMemo(() => [
        { subject: 'Testosterone', A: aiDraft ? 120 : (member?.health_score || 80) + 10, fullMark: 150 },
        { subject: 'Cortisol', A: aiDraft ? 80 : (member?.health_score || 80) - 20, fullMark: 150 },
        { subject: 'Vitamin D3', A: aiDraft ? 110 : (member?.health_score || 80) - 10, fullMark: 150 },
        { subject: 'Iron', A: aiDraft ? 95 : (member?.health_score || 80), fullMark: 150 },
        { subject: 'Thyroid (T3)', A: aiDraft ? 100 : (member?.health_score || 80) + 5, fullMark: 150 },
    ], [aiDraft, member]);

    // --- HOLOGRAPHIC BIO-TWIN VISUALIZER ---
    const HolographicTwin: React.FC = () => {
        return (
            <div className="relative h-full min-h-[500px] flex items-center justify-center group">
                {/* Scanning Laser */}
                <div className="absolute top-0 w-full h-1 bg-cyan-500 shadow-[0_0_20px_cyan] animate-scan opacity-50 z-20"></div>
                
                {/* Body SVG */}
                <svg viewBox="0 0 200 450" className="h-[450px] w-auto drop-shadow-[0_0_40px_rgba(6,182,212,0.3)] z-10 transition-all duration-700">
                     <defs>
                         <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8"/>
                             <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1"/>
                         </linearGradient>
                         <filter id="glow">
                             <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                             <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                         </filter>
                     </defs>
                     
                     {/* Base Body Outline */}
                     <path d="M100,20 Q130,20 130,50 Q130,80 100,80 Q70,80 70,50 Q70,20 100,20" fill="none" stroke="#06b6d4" strokeWidth="2" filter="url(#glow)" /> 
                     <path d="M70,80 L40,110 L40,200 L50,300 L60,400" fill="none" stroke="#06b6d4" strokeWidth="2" />
                     <path d="M130,80 L160,110 L160,200 L150,300 L140,400" fill="none" stroke="#06b6d4" strokeWidth="2" />
                     <path d="M100,80 L100,200" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" />
                     
                     {/* Interactive Organs (Clickable Zones) */}
                     <circle 
                        cx="110" cy="110" r="10" 
                        fill={activeOrgan === 'Heart' ? '#ef4444' : 'transparent'} 
                        stroke="#ef4444" strokeWidth="2" 
                        className="cursor-pointer hover:fill-red-500/50 transition-all"
                        onClick={() => setActiveOrgan('Heart')}
                     />
                     <circle 
                        cx="100" cy="160" r="12" 
                        fill={activeOrgan === 'Metabolism' ? '#f59e0b' : 'transparent'} 
                        stroke="#f59e0b" strokeWidth="2" 
                        className="cursor-pointer hover:fill-amber-500/50 transition-all"
                        onClick={() => setActiveOrgan('Metabolism')}
                     />
                </svg>

                {/* Info HUD Overlay */}
                <div className="absolute top-10 left-4 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 w-48 shadow-xl">
                    <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-1">Target System</p>
                    <p className="text-xl font-black text-white italic">{activeOrgan}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                        {activeOrgan === 'Heart' ? `Live HR: ${liveHealthData.heartRate.avg} BPM` : activeOrgan === 'Metabolism' ? 'Insulin Sensitivity: High' : 'System Nominal'}
                    </p>
                </div>
            </div>
        );
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !member) return;
        
        setIsAnalyzing(true);
        setScanProgress(0);
        addToast("Bio-Scanner: Decompiling Clinical Matrix...", "info");

        // Scan Simulation
        const scanInterval = setInterval(() => {
            setScanProgress(prev => Math.min(95, prev + 5));
        }, 200);
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(',')[1];
            try {
                // Pass Member Context
                const memberContext = {
                    id: member.id,
                    name: member.name,
                    bio_age: member.bio_age || 30,
                    weight: member.physical_metrics.weight,
                    target_weight: member.physical_metrics.target_weight,
                    medical_history: member.medical_history
                };

                const resultJson = await generateClinicalFitnessProtocol(base64, memberContext);
                const parsed = JSON.parse(resultJson.replace(/```json/g, '').replace(/```/g, '').trim());
                
                const reportId = `REP_${Date.now()}`;
                
                const newRec: AIRecommendation = {
                    rec_id: `REC_${Date.now()}`,
                    report_id: reportId,
                    healthScore: parsed.health_score || 85,
                    bio_age: parsed.bio_age || 25,
                    hormonal_analysis: parsed.hormonal_analysis,
                    clinical_protocol: parsed.clinical_protocol,
                    deficiencies: parsed.deficiencies_found || [],
                    supplement_stack: parsed.supplement_stack || [],
                    diet_modifications: parsed.diet_modifications || [],
                    workout_adjust: parsed.workout_adjust || 'Focus on isometric control.',
                    prediction: parsed.prediction || 'Neural drift stabilizing.',
                    admin_approval: false
                };

                clearInterval(scanInterval);
                setScanProgress(100);
                
                setTimeout(() => {
                    setAiDraft(newRec);
                    setActiveStage('approval');
                    addToast("Molecular Analysis Complete.", "success");
                    setIsAnalyzing(false);
                }, 500);

            } catch (err) {
                clearInterval(scanInterval);
                addToast("Handshake Failed. High Intensity Signal Blocked.", "error");
                setIsAnalyzing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleApprove = () => {
        if (!aiDraft) return;
        approveRecommendation(aiDraft.rec_id);
        
        if (member) {
            updateMember({
                ...member,
                health_score: aiDraft.healthScore,
                biologicalAge: aiDraft.bio_age,
                approvedAiPlan: aiDraft.workout_adjust,
                // Add reference to recommendation in member if needed for persistence
            });
        }

        addToast("Protocol Approved. Pushed to Member Mobile Hub.", "success");
        setActiveStage('hub');
        setAiDraft(null);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-[#020308] p-12 rounded-[4rem] border border-cyan-500/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-cyan-500 text-black rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.4)] group-hover:rotate-12 transition-transform duration-700">
                            <Microscope className="w-16 h-16" />
                        </div>
                        <div>
                             <div className="flex items-center gap-3 mb-2">
                                <div className="px-5 py-2 bg-cyan-500 text-black rounded-full flex items-center gap-3 shadow-lg font-black uppercase tracking-[0.2em] text-[10px]">
                                    <Infinity className="w-3 h-3 animate-spin-slow" /> Bio-Scanner v31.0
                                </div>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Bio <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Scanner</span>
                            </h1>
                            <p className="text-gray-500 text-[11px] font-mono tracking-[0.8em] mt-4 uppercase italic font-bold">
                                Molecular Diagnostic Command v31.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: MEMBER LIST & UPLOAD */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="Locate Neural Subject" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] shadow-2xl">
                        <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {members.map(m => (
                                <button 
                                    key={m.id}
                                    onClick={() => { setSelectedId(m.id); setActiveStage('hub'); }}
                                    className={`w-full p-5 rounded-[2rem] border flex items-center gap-5 transition-all ${selectedId === m.id ? 'bg-cyan-500/10 border-cyan-500 shadow-xl' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                                >
                                    <img src={m.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt="avatar"/>
                                    <div className="text-left flex-1">
                                        <p className="font-bold text-white uppercase italic text-sm">{m.name}</p>
                                        <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">ID: #{m.id} // UPLINK</p>
                                    </div>
                                    {selectedId === m.id && <Zap className="w-4 h-4 text-cyan-400 fill-current animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {member && activeStage === 'hub' && (
                        <Card title="Initiate Laboratory Scan" className="bg-black/60 border-cyan-500/20 p-10 rounded-[3rem] text-center relative overflow-hidden group shadow-2xl">
                             {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center backdrop-blur-md px-10">
                                    <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                                        <div className="h-full bg-cyan-500 transition-all duration-100" style={{ width: `${scanProgress}%` }}></div>
                                    </div>
                                    <p className="text-cyan-400 font-black text-xs uppercase tracking-widest animate-pulse">Harvesting Biomarkers... {scanProgress}%</p>
                                </div>
                             )}
                             <input type="file" id="admin-bio-up" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
                             <label htmlFor="admin-bio-up" className="cursor-pointer block group">
                                <div className="w-24 h-24 bg-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10 group-hover:bg-cyan-500 group-hover:text-black transition-all shadow-2xl group-hover:rotate-12">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <h4 className="text-2xl font-black text-white uppercase italic tracking-widest">Process Report</h4>
                                <p className="text-gray-500 text-[10px] mt-2 font-mono uppercase">AI-OCR // 5-Point Analysis Active</p>
                             </label>
                        </Card>
                    )}
                </div>

                {/* RIGHT: ANALYSIS & TWIN */}
                <div className="lg:col-span-8">
                    {activeStage === 'hub' && member && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                            {/* Holographic Twin */}
                            <Card className="bg-black border-cyan-500/30 rounded-[3.5rem] relative overflow-hidden flex items-center justify-center shadow-2xl min-h-[500px]">
                                <HolographicTwin />
                            </Card>

                            {/* Live Vitals & Prediction */}
                            <div className="space-y-6 flex flex-col">
                                <Card title="Live Vitals" className="bg-gray-950 border-white/10 p-6 rounded-[3rem] flex-1">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <span className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Pulse</span>
                                            <span className="text-xl font-bold text-white">{liveHealthData.heartRate.avg} <span className="text-xs text-gray-500">BPM</span></span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <span className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2"><Thermometer className="w-4 h-4 text-amber-500" /> Core Temp</span>
                                            <span className="text-xl font-bold text-white">36.6 <span className="text-xs text-gray-500">°C</span></span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                                            <span className="text-[10px] text-gray-500 font-black uppercase flex items-center gap-2"><Droplets className="w-4 h-4 text-cyan-500" /> Hydration</span>
                                            <span className="text-xl font-bold text-white">92 <span className="text-xs text-gray-500">%</span></span>
                                        </div>
                                    </div>
                                </Card>

                                <Card title="Chrono-Health Projection" className="bg-black border-white/10 p-6 rounded-[3rem] flex-1">
                                    <div className="h-40 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={predictionData}>
                                                <defs>
                                                    <linearGradient id="colorAge" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                <XAxis dataKey="month" stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                                                <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                                <Area type="monotone" dataKey="age" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorAge)" name="Bio Age" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-[9px] text-purple-400 text-center mt-2 font-mono uppercase">Estimated Bio-Age Reversal</p>
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeStage === 'approval' && aiDraft && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-scale-in h-full">
                            {/* Biomarker Radar */}
                            <Card title="Biomarker Matrix" className="bg-black/80 border-white/10 p-8 rounded-[3rem]">
                                 <div className="h-[300px] w-full">
                                     <ResponsiveContainer width="100%" height="100%">
                                         <RadarChart cx="50%" cy="50%" outerRadius="70%" data={biomarkerData}>
                                             <PolarGrid stroke="#333" />
                                             <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
                                             <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} />
                                             <Radar name="Levels" dataKey="A" stroke="#22c55e" strokeWidth={3} fill="#22c55e" fillOpacity={0.4} />
                                             <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '15px' }} />
                                         </RadarChart>
                                     </ResponsiveContainer>
                                 </div>
                            </Card>
                            
                            {/* Neural Prescription */}
                            <Card title="Neural Protocol Draft" className="bg-gray-900 border-white/10 p-10 rounded-[3.5rem] flex flex-col h-full shadow-2xl">
                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-10 pr-2">
                                    
                                    {/* Hormonal Analysis Block */}
                                    {aiDraft.hormonal_analysis && (
                                        <div className="p-6 bg-blue-900/10 border-l-4 border-blue-500 rounded-r-3xl">
                                            <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mb-3 flex items-center gap-3">
                                                <Activity className="w-4 h-4" /> Hormonal Status
                                            </h4>
                                            <div className="prose prose-invert prose-sm text-blue-100 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: aiDraft.hormonal_analysis }} />
                                        </div>
                                    )}

                                    {/* Chemical Synthesis */}
                                    <div>
                                        <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
                                            <Beaker className="w-4 h-4" /> Chemical Synthesis
                                        </h4>
                                        <div className="space-y-4">
                                            {aiDraft.supplement_stack.map((s, i) => (
                                                <div key={i} className="p-5 bg-black/60 rounded-3xl border border-white/5 group hover:border-amber-500/30 transition-all flex justify-between items-center">
                                                    <div>
                                                        <p className="text-white font-black uppercase text-lg italic leading-none">{s.name}</p>
                                                        <p className="text-[10px] text-gray-500 mt-2 font-medium">{s.reason}</p>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-900/10 px-3 py-1 rounded-lg border border-amber-500/20">{s.dosage}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Clinical Protocol */}
                                    {aiDraft.clinical_protocol && (
                                        <div className="p-6 bg-red-900/10 border-l-4 border-red-500 rounded-r-3xl">
                                            <h4 className="text-[11px] font-black text-red-500 uppercase tracking-[0.4em] mb-3 flex items-center gap-3">
                                                <Cross className="w-4 h-4" /> Medical Directive
                                            </h4>
                                            <div className="prose prose-invert prose-sm text-red-100 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: aiDraft.clinical_protocol }} />
                                        </div>
                                    )}

                                    {/* Kinetic Strategy */}
                                    <div className="p-6 bg-indigo-900/10 border-l-4 border-indigo-500 rounded-r-3xl">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Kinetic Strategy</h4>
                                        <p className="text-sm text-gray-300 italic font-medium leading-relaxed">"{aiDraft.workout_adjust}"</p>
                                    </div>
                                </div>

                                <div className="pt-10 mt-10 border-t border-white/10 flex gap-6">
                                    <button 
                                        onClick={() => setActiveStage('hub')}
                                        className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors italic"
                                    >
                                        [ Abort ]
                                    </button>
                                    <button 
                                        onClick={handleApprove}
                                        className="flex-[2] bg-white text-black font-black py-5 rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-all uppercase tracking-widest text-xs italic flex items-center justify-center gap-3 active:scale-95 hover:bg-green-500 hover:text-white"
                                    >
                                        <CheckCircle className="w-5 h-5" /> Deploy Protocol
                                    </button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HealthEngine;
