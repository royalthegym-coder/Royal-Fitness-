
import React, { useState, useMemo, useEffect } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    Activity, Heart, BrainCircuit, Droplets, AlertTriangle, 
    RefreshCw, Scale, Flame, Fingerprint, Save, CheckCircle, Target, ArrowUpRight,
    Bot, Zap, Link, FileText, Pill, TrendingDown, Stethoscope, Microscope,
    ScanFace, Watch, Dna, Layers
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Modal from '../common/Modal';
import { useToast } from '../../hooks/useToast';
import { getComplexResponse } from '../../../lib/gemini';
import { SmartWatchIcon } from '../icons/SmartWatchIcon';

// --- INTEGRATED MODULES ---
import BodySimulator from '../BodySimulator';
import WearableConnectHub from './SmartWatch';
import BiomarkerVault from './BiomarkerVault'; // Assuming this exists or using placeholder
import MedicalHub from './MedicalHub';

const MemberHealthDashboard: React.FC = () => {
    const { liveHealthData, updateLiveHealthData, members, updateMember, connectedDevice } = useData();
    const { addToast } = useToast();
    
    // --- UI STATE ---
    const [activeTab, setActiveTab] = useState<'telemetry' | 'digital_twin' | 'wearable' | 'medical'>('telemetry');
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [bioForm, setBioForm] = useState({ weight: 0, hrv: 0, height: 0 });
    const [liveGraphData, setLiveGraphData] = useState<{time: number, hr: number, stress: number}[]>([]);
    
    // --- AI COACH ---
    const [coachVerdict, setCoachVerdict] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [readinessScore, setReadinessScore] = useState(85);

    // Current Member Context
    const currentUser = members[0]; 

    // --- 1. LIVE BIOLOGICAL SIMULATION ENGINE ---
    useEffect(() => {
        if (!currentUser) return;

        setBioForm({
            weight: currentUser.physical_metrics.weight || 70,
            height: currentUser.physical_metrics.height || 170,
            hrv: liveHealthData.heartRate.hrv || 65
        });
        
        // Calculate Readiness (0-100)
        const hrvFactor = Math.min(100, (liveHealthData.heartRate.hrv / 80) * 100);
        const sleepFactor = Math.min(100, (liveHealthData.sleep.totalHours / 8) * 100);
        setReadinessScore(Math.round((hrvFactor * 0.6) + (sleepFactor * 0.4)));

        // Live ECG Stream
        const interval = setInterval(() => {
            const now = Date.now();
            const baseHR = liveHealthData.heartRate.avg;
            const fluctuation = Math.sin(now / 1000) * 5 + (Math.random() * 4 - 2);
            const currentHR = Math.floor(baseHR + fluctuation);
            const stress = Math.max(0, 100 - liveHealthData.heartRate.hrv + (Math.random() * 5));

            setLiveGraphData(prev => {
                const newData = [...prev, { time: now, hr: currentHR, stress }];
                return newData.slice(-50); // Keep last 50 points
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentUser, liveHealthData]);

    // --- 2. METRICS CALCULATION ---
    const metrics = useMemo(() => {
        if (!currentUser) return null;
        const h = (currentUser.physical_metrics.height || 170) / 100;
        const w = currentUser.physical_metrics.weight || 70;
        const bmi = (w / (h * h)).toFixed(1);
        const age = currentUser.bio_age || 25;
        const bmr = (10 * w) + (6.25 * (h * 100)) - (5 * age) + 5;
        return { bmi, bmr: Math.round(bmr) };
    }, [currentUser]);

    // --- 3. AI HANDLERS ---
    const handleConsultCoach = async () => {
        setIsAnalyzing(true);
        setCoachVerdict(null);

        const prompt = `
            ACT AS 'ROYAL BIO-ARCHITECT'. 
            User: ${currentUser?.name}.
            Data: Readiness ${readinessScore}%, HRV ${liveHealthData.heartRate.hrv}ms, Sleep ${liveHealthData.sleep.totalHours}h.
            
            Output a "Tactical Brief" (HTML):
            1. System Status (1 sentence)
            2. Recommended Protocol (e.g. "High Intensity" or "Active Recovery")
            3. One Bio-Hack tip.
        `;

        try {
            const result = await getComplexResponse(prompt);
            setCoachVerdict(result);
        } catch (e) {
            setCoachVerdict("Neural Link Unstable. Rest recommended.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveBio = () => {
        if (!currentUser) return;
        updateMember({
            ...currentUser,
            physical_metrics: { ...currentUser.physical_metrics, weight: bioForm.weight, height: bioForm.height }
        });
        updateLiveHealthData({ heartRate: { ...liveHealthData.heartRate, hrv: bioForm.hrv } });
        addToast("Bio-Matrix Updated.", "success");
        setIsInputModalOpen(false);
    };

    if (!currentUser || !metrics) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            
            {/* 1. BIO-METRIC COMMAND HEADER */}
            <div className="bg-[#020308] p-10 rounded-[4rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-8 bg-cyan-600 text-black rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] group-hover:rotate-12 transition-transform duration-700">
                            <Activity className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                    Bio-Metric v31.0
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">LINK: SECURE</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Health <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Core</span>
                            </h1>
                        </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="flex bg-gray-900/80 p-2 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                         <div className="px-10 py-5 text-center border-r border-white/5">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Readiness</p>
                             <div className="flex items-center gap-2 justify-center">
                                 <Zap className={`w-4 h-4 ${readinessScore > 80 ? 'text-green-500' : 'text-amber-500'}`} />
                                 <p className={`text-4xl font-black italic ${readinessScore > 80 ? 'text-green-400' : 'text-amber-400'}`}>{readinessScore}%</p>
                             </div>
                         </div>
                         <div className="px-10 py-5 text-center">
                             <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Device</p>
                             <p className="text-xl font-bold text-white flex items-center gap-2 justify-center">
                                 {connectedDevice ? <CheckCircle className="w-4 h-4 text-cyan-400"/> : <AlertTriangle className="w-4 h-4 text-gray-600"/>}
                                 {connectedDevice ? 'SYNCED' : 'OFFLINE'}
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. NAVIGATION DECK */}
            <div className="flex bg-black/60 p-2 rounded-[2.5rem] border border-white/10 w-fit mx-auto backdrop-blur-xl shadow-xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'telemetry', label: 'Live Telemetry', icon: <Activity className="w-4 h-4"/> },
                    { id: 'digital_twin', label: 'Digital Twin', icon: <ScanFace className="w-4 h-4"/> },
                    { id: 'wearable', label: 'Wearable Uplink', icon: <Watch className="w-4 h-4"/> },
                    { id: 'medical', label: 'Med-Vault', icon: <Dna className="w-4 h-4"/> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${
                            activeTab === tab.id 
                            ? 'bg-cyan-600 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* 3. MAIN CONTENT AREA */}
            <div className="min-h-[600px] relative">
                
                {/* TAB: TELEMETRY (Overview) */}
                {activeTab === 'telemetry' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
                        {/* LEFT: Live Graph */}
                        <div className="lg:col-span-8 space-y-6">
                            <Card className="bg-[#0a0a0a] border-white/5 p-8 rounded-[3.5rem] h-[500px] flex flex-col relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity className="w-64 h-64 text-cyan-500" /></div>
                                <div className="flex justify-between items-center mb-8 relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Hemodynamic Stream</h3>
                                        <p className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest mt-1 animate-pulse">● Live Transmission</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-5xl font-black text-white italic tracking-tighter">{liveHealthData.heartRate.avg}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">BPM</p>
                                    </div>
                                </div>
                                <div className="flex-1 w-full relative z-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={liveGraphData}>
                                            <defs>
                                                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                            <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }} />
                                            <Area type="monotone" dataKey="hr" stroke="#06b6d4" strokeWidth={3} fill="url(#colorHr)" isAnimationActive={true} />
                                            <Area type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={1} fill="transparent" strokeDasharray="4 4" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-900 p-6 rounded-[2rem] border border-white/5 text-center group hover:border-cyan-500/30 transition-all">
                                    <Scale className="w-6 h-6 text-gray-600 mx-auto mb-3 group-hover:text-cyan-400" />
                                    <p className="text-2xl font-black text-white italic">{currentUser.physical_metrics.weight} <span className="text-xs text-gray-500">KG</span></p>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Mass</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-[2rem] border border-white/5 text-center group hover:border-cyan-500/30 transition-all">
                                    <Activity className="w-6 h-6 text-gray-600 mx-auto mb-3 group-hover:text-cyan-400" />
                                    <p className="text-2xl font-black text-white italic">{metrics.bmi}</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">BMI</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-[2rem] border border-white/5 text-center group hover:border-cyan-500/30 transition-all">
                                    <Flame className="w-6 h-6 text-gray-600 mx-auto mb-3 group-hover:text-orange-500" />
                                    <p className="text-2xl font-black text-white italic">{metrics.bmr}</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">BMR (Kcal)</p>
                                </div>
                                <div className="bg-gray-900 p-6 rounded-[2rem] border border-white/5 text-center group hover:border-cyan-500/30 transition-all">
                                    <Fingerprint className="w-6 h-6 text-gray-600 mx-auto mb-3 group-hover:text-purple-500" />
                                    <p className="text-2xl font-black text-white italic">{currentUser.bio_age}</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Bio-Age</p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: AI Coach */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card title="Neural Architect" className="bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/30 p-8 rounded-[3rem] h-full flex flex-col relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-8 opacity-10"><BrainCircuit className="w-48 h-48 text-indigo-400" /></div>
                                <div className="relative z-10 flex-1 flex flex-col">
                                    <div className="flex justify-center mb-8">
                                        <div className="w-24 h-24 bg-indigo-500/20 rounded-full border-4 border-indigo-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)] animate-pulse">
                                            <Bot className="w-10 h-10 text-indigo-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-black/40 rounded-3xl p-6 border border-white/5 mb-6 backdrop-blur-md overflow-y-auto custom-scrollbar">
                                        {isAnalyzing ? (
                                            <div className="h-full flex flex-col items-center justify-center text-indigo-300 space-y-4">
                                                <RefreshCw className="w-8 h-8 animate-spin" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Running Bio-Audit...</p>
                                            </div>
                                        ) : coachVerdict ? (
                                            <div className="prose prose-invert prose-sm text-indigo-200 italic leading-relaxed" dangerouslySetInnerHTML={{ __html: coachVerdict }} />
                                        ) : (
                                            <p className="text-gray-500 text-xs text-center mt-10">"Initiate a scan to receive today's tactical health briefing."</p>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleConsultCoach}
                                        disabled={isAnalyzing}
                                        className="w-full bg-white text-black font-black py-5 rounded-[2rem] uppercase tracking-widest text-[10px] shadow-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        <Stethoscope className="w-4 h-4" /> Consult AI Architect
                                    </button>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {/* TAB: DIGITAL TWIN */}
                {activeTab === 'digital_twin' && (
                    <div className="animate-scale-in">
                        <BodySimulator />
                    </div>
                )}

                {/* TAB: WEARABLE */}
                {activeTab === 'wearable' && (
                    <div className="animate-scale-in">
                        <WearableConnectHub />
                    </div>
                )}

                {/* TAB: MEDICAL VAULT */}
                {activeTab === 'medical' && (
                    <div className="animate-scale-in">
                         {/* Here we combine BiomarkerVault and MedicalHub links/previews */}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <MedicalHub memberId={currentUser.id} />
                             <BiomarkerVault memberId={currentUser.id} />
                         </div>
                    </div>
                )}
            </div>

            {/* QUICK UPDATE BUTTON */}
            <div className="fixed bottom-24 left-8 z-40">
                <button onClick={() => setIsInputModalOpen(true)} className="bg-black/80 backdrop-blur-xl p-4 rounded-full border border-white/10 text-white hover:bg-cyan-900/50 hover:text-cyan-400 transition-all shadow-2xl hover:scale-110 active:scale-95">
                    <RefreshCw className="w-6 h-6" />
                </button>
            </div>

            {/* BIO-SYNC MODAL */}
            <Modal isOpen={isInputModalOpen} onClose={() => setIsInputModalOpen(false)} title="Manual Data Injection">
                <div className="space-y-8 py-4">
                    <div className="bg-gray-950 p-8 rounded-[2rem] border border-white/5 shadow-inner">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Mass (KG)</label>
                                <input type="number" value={bioForm.weight} onChange={e => setBioForm({...bioForm, weight: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-black text-lg outline-none focus:border-cyan-500 text-center" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">Height (CM)</label>
                                <input type="number" value={bioForm.height} onChange={e => setBioForm({...bioForm, height: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-black text-lg outline-none focus:border-cyan-500 text-center" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-2">HRV (ms)</label>
                                <input type="number" value={bioForm.hrv} onChange={e => setBioForm({...bioForm, hrv: Number(e.target.value)})} className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white font-black text-lg outline-none focus:border-cyan-500 text-center" />
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSaveBio} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-5 rounded-2xl uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3">
                        <Save className="w-4 h-4" /> Commit Data
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default MemberHealthDashboard;
