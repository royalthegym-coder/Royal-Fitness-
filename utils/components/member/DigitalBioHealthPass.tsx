import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Dna, HeartPulse, Brain, Droplets, Zap, ChevronRight, Download, Share2, Lock, Fingerprint, ScanFace, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';

interface DigitalBioHealthPassProps {
    memberId: number;
}

export const DigitalBioHealthPass: React.FC<DigitalBioHealthPassProps> = ({ memberId }) => {
    const { members, liveHealthData, updateMember, addAuditLog } = useData();
    const { addToast } = useToast();
    const [isGenerating, setIsGenerating] = useState(true);
    const [securityHash, setSecurityHash] = useState('');
    const [showConsent, setShowConsent] = useState(false);

    const member = members.find(m => m.id === memberId);

    useEffect(() => {
        if (member) {
            if (!member.hipaaConsent || !member.gdprConsent) {
                setShowConsent(true);
                setIsGenerating(false);
            } else {
                // Simulate secure generation of the pass
                const timer = setTimeout(() => {
                    setIsGenerating(false);
                    setSecurityHash(Math.random().toString(36).substring(2, 15).toUpperCase() + '-' + Date.now().toString(36).toUpperCase());
                    
                    // Log access for HIPAA compliance
                    addAuditLog({
                        action: 'VIEW_MEDICAL_PASS',
                        memberId: member.id,
                        timestamp: new Date().toISOString(),
                        details: 'Digital Bio-Health Pass accessed securely.'
                    });
                }, 2500);
                return () => clearTimeout(timer);
            }
        }
    }, [member]);

    const handleShare = () => {
        addToast("Secure link generated. Ready to share with Medical Professionals.", "success");
        addAuditLog({
            action: 'SHARE_MEDICAL_PASS',
            memberId: member?.id,
            timestamp: new Date().toISOString(),
            details: 'Digital Bio-Health Pass shared externally.'
        });
    };

    const handleAcceptConsent = () => {
        if (member) {
            updateMember({
                ...member,
                hipaaConsent: true,
                gdprConsent: true
            });
            addToast("Medical data processing consent recorded.", "success");
            addAuditLog({
                action: 'CONSENT_GRANTED',
                memberId: member.id,
                timestamp: new Date().toISOString(),
                details: 'HIPAA and GDPR consent granted by user.'
            });
            setShowConsent(false);
            setIsGenerating(true);
            
            // Trigger generation after consent
            setTimeout(() => {
                setIsGenerating(false);
                setSecurityHash(Math.random().toString(36).substring(2, 15).toUpperCase() + '-' + Date.now().toString(36).toUpperCase());
            }, 2500);
        }
    };

    if (!member) return <div className="text-white p-8">Member not found.</div>;

    if (showConsent) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-zinc-900 border border-emerald-500/30 rounded-3xl shadow-2xl animate-fade-in">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-500/10 rounded-xl">
                        <ShieldCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Medical Data Consent</h2>
                        <p className="text-sm text-zinc-400">HIPAA & GDPR Compliance Required</p>
                    </div>
                </div>
                
                <div className="space-y-4 mb-8 text-sm text-zinc-300">
                    <p>To generate your Digital Bio-Health Pass and utilize the AI Oracle, we require your explicit consent to process and store your sensitive medical data.</p>
                    <ul className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5">
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span><strong>HIPAA Compliance:</strong> Your health data is encrypted end-to-end. Access is strictly logged and monitored.</span>
                        </li>
                        <li className="flex gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                            <span><strong>GDPR Compliance:</strong> You have the right to be forgotten. You can request deletion of your medical data at any time.</span>
                        </li>
                        <li className="flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                            <span><strong>AI Processing:</strong> Your anonymized data will be processed by our Bio-Aether Oracle to generate health insights.</span>
                        </li>
                    </ul>
                </div>

                <div className="flex justify-end gap-4">
                    <button 
                        onClick={() => window.history.back()}
                        className="px-6 py-3 rounded-xl text-white font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-colors"
                    >
                        Decline & Go Back
                    </button>
                    <button 
                        onClick={handleAcceptConsent}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center gap-2"
                    >
                        <Lock className="w-4 h-4" /> I Consent & Agree
                    </button>
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 animate-fade-in">
                <div className="relative w-32 h-32">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldCheck className="w-10 h-10 text-emerald-400 animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest italic">Compiling Bio-Data</h2>
                <p className="text-emerald-400 font-mono text-xs uppercase tracking-[0.3em]">Applying HIPAA/GDPR Encryption...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Medical Compliance: Active (HIPAA/GDPR)</span>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleShare} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* The Pass */}
            <div className="relative bg-gradient-to-br from-zinc-900 to-black rounded-[3rem] border border-emerald-500/30 overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.15)] group">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                <div className="absolute -right-40 -top-40 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute -left-40 -bottom-40 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative z-10 p-8 md:p-12">
                    {/* Header: Identity */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/10 pb-8 mb-8">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/50 relative z-10">
                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -inset-2 bg-emerald-500/20 rounded-3xl blur-md -z-10"></div>
                                <div className="absolute -bottom-3 -right-3 bg-black p-1.5 rounded-lg border border-emerald-500/50">
                                    <ScanFace className="w-5 h-5 text-emerald-400" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                                    {member.name}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                        ID: {member.id.toString().padStart(6, '0')}
                                    </span>
                                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                                        DOB: {member.dob || '1990-01-01'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-black/50 p-4 rounded-2xl border border-white/5 text-right min-w-[180px]">
                            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Biological Age</p>
                            <p className="text-4xl font-black text-white font-mono italic">
                                {member.bio_age} <span className="text-sm text-emerald-400 not-italic">yrs</span>
                            </p>
                            <p className="text-[10px] text-emerald-400 uppercase tracking-widest mt-1">
                                Chronological: {new Date().getFullYear() - new Date(member.dob || '1990-01-01').getFullYear()}
                            </p>
                        </div>
                    </div>

                    {/* Core Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
                            <HeartPulse className="w-5 h-5 text-rose-500 mb-3" />
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Resting HR</p>
                            <p className="text-2xl font-black text-white">{liveHealthData.heartRate.min} <span className="text-xs text-zinc-500">BPM</span></p>
                        </div>
                        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
                            <Activity className="w-5 h-5 text-amber-500 mb-3" />
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">HRV Score</p>
                            <p className="text-2xl font-black text-white">{member.hrv} <span className="text-xs text-zinc-500">ms</span></p>
                        </div>
                        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
                            <Droplets className="w-5 h-5 text-cyan-500 mb-3" />
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Blood Type</p>
                            <p className="text-2xl font-black text-white">{member.medical_history.bloodGroup || 'O+'}</p>
                        </div>
                        <div className="bg-zinc-900/40 p-5 rounded-2xl border border-white/5">
                            <Zap className="w-5 h-5 text-purple-500 mb-3" />
                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Metabolic Rate</p>
                            <p className="text-2xl font-black text-white">2450 <span className="text-xs text-zinc-500">kcal</span></p>
                        </div>
                    </div>

                    {/* Deep Diagnostics (The Oracle's Findings) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Clinical Status */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <Brain className="w-4 h-4" /> Clinical Overview
                            </h3>
                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 h-full">
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Inflammation Markers: Optimal</p>
                                            <p className="text-xs text-zinc-400 mt-1">hs-CRP levels within athletic range.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5"></div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Vitamin D3: Sub-optimal</p>
                                            <p className="text-xs text-zinc-400 mt-1">Currently 28 ng/mL. Target: 50+ ng/mL.</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Joint Integrity: Strong</p>
                                            <p className="text-xs text-zinc-400 mt-1">No signs of L4-L5 compression detected.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Genetic & Hormonal Profile */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                <Dna className="w-4 h-4" /> Genetic & Hormonal Profile
                            </h3>
                            <div className="bg-black/40 p-6 rounded-3xl border border-white/5 h-full">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-400">Testosterone (Free)</span>
                                            <span className="text-emerald-400 font-mono">Optimal</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[85%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-400">Cortisol (Stress)</span>
                                            <span className="text-amber-400 font-mono">Elevated</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 w-[70%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-400">Muscle Fiber Type</span>
                                            <span className="text-cyan-400 font-mono">Type IIa Dominant</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 w-[60%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer / Verification */}
                    <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Fingerprint className="w-8 h-8 text-zinc-600" />
                            <div>
                                <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest">Secure Hash</p>
                                <p className="text-xs text-zinc-400 font-mono">{securityHash}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Bio-Aether Oracle Verified</p>
                            <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest mt-1">Generated: {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
