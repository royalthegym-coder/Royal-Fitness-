import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { 
    Stethoscope, FileText, Check, X, Clock, Zap, 
    AlertTriangle, Network, Globe, Activity, 
    BrainCircuit, Dna, Scan, ChevronRight, CheckCircle, RefreshCw
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { BotIcon } from '../icons/BotIcon';

const AetherMedDashboard: React.FC = () => {
    const { medicalConsultations, medicalReports, updateMedicalConsultation, members, updateMember } = useData();
    const { addToast } = useToast();
    
    // UI State
    const [selectedConsultId, setSelectedConsultId] = useState<string | null>(null);
    const [deployingId, setDeployingId] = useState<string | null>(null);

    // Filter Logic
    const pendingConsults = useMemo(() => medicalConsultations.filter(c => c.status === 'Pending Analysis'), [medicalConsultations]);
    const selectedConsult = useMemo(() => medicalConsultations.find(c => c.id === selectedConsultId), [selectedConsultId, medicalConsultations]);
    const activeMember = useMemo(() => members.find(m => m.id === selectedConsult?.memberId), [selectedConsult, members]);

    // Mock Live Telemetry for the selected patient
    const telemetryData = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => ({
            time: i,
            val: 60 + Math.random() * 40 // Simulated HR/Stress
        }));
    }, [selectedConsultId]);

    const handleApprove = (consult: any) => {
        if (!consult.aiDiagnosis) return;
        setDeployingId(consult.id);

        setTimeout(() => {
            // 1. Update Consult Status
            updateMedicalConsultation({ ...consult, status: 'Approved' });
            
            // 2. Automate: Update Member's Active Protocol if valid prescription exists
            if (consult.aiPrescription) {
                const member = members.find(m => m.id === consult.memberId);
                if (member) {
                    updateMember({
                        ...member,
                        approvedAiPlan: `MEDICAL OVERRIDE: ${consult.aiPrescription}`
                    });
                }
            }
            
            addToast("Protocol Deployed to Member Neural Link.", "success");
            setDeployingId(null);
            if (selectedConsultId === consult.id) setSelectedConsultId(null);
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* HEADER */}
            <div className="p-10 rounded-[3.5rem] bg-[#020308] border border-cyan-500/20 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-6 bg-cyan-600 text-black rounded-[2.5rem] shadow-[0_0_60px_rgba(6,182,212,0.4)] group-hover:rotate-12 transition-transform duration-700">
                             <Stethoscope className="w-16 h-16 animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                                    <Network className="w-3 h-3" /> Neural Diagnostics
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYSTEM: ONLINE</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Aether <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Med AI</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT: INCOMING STREAM */}
                <div className="lg:col-span-4 space-y-6">
                    <Card title="Triage Queue" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] h-[700px] flex flex-col shadow-2xl">
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                            {pendingConsults.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                    <CheckCircle className="w-16 h-16 mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">All Clear</p>
                                </div>
                            )}
                            
                            {pendingConsults.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => setSelectedConsultId(c.id)}
                                    className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${
                                        selectedConsultId === c.id 
                                        ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]' 
                                        : 'bg-black/40 border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <h4 className="font-bold text-white text-lg">{c.memberName}</h4>
                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${
                                            c.severity === 'Critical' ? 'bg-red-900/50 text-red-500 border-red-500/30 animate-pulse' : 
                                            c.severity === 'High' ? 'bg-orange-900/20 text-orange-400 border-orange-500/30' :
                                            'bg-gray-800 text-gray-400 border-gray-700'
                                        }`}>
                                            {c.severity}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 italic line-clamp-2 mb-3">"{c.symptoms}"</p>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                        <span className="text-[9px] text-gray-600 font-mono">{new Date(c.timestamp).toLocaleTimeString()}</span>
                                        <ChevronRight className={`w-4 h-4 ${selectedConsultId === c.id ? 'text-cyan-400' : 'text-gray-600'}`} />
                                    </div>
                                    {selectedConsultId === c.id && <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RIGHT: COMMAND CENTER */}
                <div className="lg:col-span-8">
                    {selectedConsult ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Patient Bio-Telemetry */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-black border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
                                     <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                                     <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-1 relative z-10">Live Heart Rate</p>
                                     <div className="h-20 w-full relative z-10">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={telemetryData}>
                                                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                                <Area type="monotone" dataKey="val" stroke="#06b6d4" strokeWidth={2} fill="rgba(6,182,212,0.1)" isAnimationActive={false} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                     </div>
                                     <div className="flex justify-between items-end relative z-10">
                                         <p className="text-3xl font-black text-white italic">72 <span className="text-xs text-gray-500 not-italic">BPM</span></p>
                                         <Activity className="w-5 h-5 text-cyan-500 animate-pulse" />
                                     </div>
                                </Card>

                                <Card className="bg-gray-900 border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Biological Age</p>
                                    <div className="flex items-center gap-3">
                                        <Dna className="w-8 h-8 text-purple-400" />
                                        <p className="text-3xl font-black text-white italic">{activeMember?.bio_age || 25} <span className="text-xs text-gray-500 not-italic">YRS</span></p>
                                    </div>
                                </Card>

                                <Card className="bg-gray-900 border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-between">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Recovery Index</p>
                                    <div className="flex items-center gap-3">
                                        <Zap className="w-8 h-8 text-amber-400" />
                                        <p className="text-3xl font-black text-white italic">{activeMember?.health_score || 85}%</p>
                                    </div>
                                </Card>
                            </div>

                            {/* AI Council Analysis */}
                            <Card className="bg-[#080808] border-white/10 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5"><BrainCircuit className="w-64 h-64 text-cyan-400" /></div>
                                
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                                        <BotIcon className="w-8 h-8 text-cyan-400"/> Neural Diagnosis
                                    </h3>

                                    {selectedConsult.aiDiagnosis ? (
                                        <div className="space-y-6">
                                            {(() => {
                                                try {
                                                    const analysis = JSON.parse(selectedConsult.aiDiagnosis);
                                                    return (
                                                        <div className="grid grid-cols-1 gap-4">
                                                            {/* Primary Diagnosis */}
                                                            <div className="bg-cyan-900/10 border border-cyan-500/20 p-6 rounded-3xl">
                                                                <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-2">Primary Verdict</p>
                                                                <p className="text-xl font-bold text-white leading-relaxed">{analysis.diagnosis}</p>
                                                            </div>
                                                            
                                                            {/* Council Breakdown */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                {analysis.deepseek_logic && (
                                                                    <div className="bg-purple-900/10 border border-purple-500/20 p-5 rounded-3xl">
                                                                        <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                            <Scan className="w-3 h-3"/> DeepSeek Logic
                                                                        </p>
                                                                        <p className="text-xs text-gray-300 italic">"{analysis.deepseek_logic}"</p>
                                                                    </div>
                                                                )}
                                                                {analysis.grok_insight && (
                                                                    <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-3xl">
                                                                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                            <Globe className="w-3 h-3"/> Grok Insight
                                                                        </p>
                                                                        <p className="text-xs text-gray-300 italic">"{analysis.grok_insight}"</p>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Treatment Plan */}
                                                            <div className="bg-gray-900 border border-white/5 p-6 rounded-3xl">
                                                                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-3">Prescribed Protocol</p>
                                                                <div className="prose prose-invert prose-sm text-gray-300 leading-relaxed">
                                                                    {selectedConsult.aiPrescription || analysis.treatment}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                } catch (e) {
                                                    return <p className="text-red-400 text-sm">Data corruption detected in neural packet.</p>;
                                                }
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-gray-500 uppercase tracking-widest text-xs">Analysis Pending...</div>
                                    )}
                                </div>
                            </Card>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <button 
                                    className="flex-1 py-5 rounded-[2.5rem] bg-gray-900 text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all border border-white/5"
                                    onClick={() => setSelectedConsultId(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleApprove(selectedConsult)}
                                    disabled={!!deployingId}
                                    className="flex-[2] py-5 rounded-[2.5rem] bg-green-600 text-black font-black uppercase tracking-widest text-xs hover:bg-green-500 transition-all shadow-[0_0_40px_rgba(34,197,94,0.4)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {deployingId === selectedConsult.id ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Zap className="w-5 h-5 fill-current"/>}
                                    {deployingId === selectedConsult.id ? 'INJECTING PROTOCOL...' : 'DEPLOY TO MEMBER'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[700px] flex flex-col items-center justify-center bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-white/5 text-center">
                            <div className="w-32 h-32 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center mb-6 animate-pulse">
                                <Activity className="w-12 h-12 text-gray-700" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-700 uppercase italic tracking-widest">System Idle</h3>
                            <p className="text-gray-600 text-xs font-mono uppercase tracking-[0.3em] mt-2">Select a Neural Stream to Begin</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AetherMedDashboard;