
import React, { useRef, useState, useEffect, useMemo } from 'react';
import Card from '../common/Card';
import { useData } from '../../context/DataProvider';
import { 
    Globe, ShieldCheck, QrCode, FileText, 
    Download, AlertTriangle, Activity, Phone, 
    Fingerprint, Lock, CheckCircle, Zap,
    Heart, Info, Share2, RefreshCw, Smartphone,
    Wifi, History, Plane, Syringe, Radio,
    ChevronRight, Scan, Dna, Stethoscope
} from 'lucide-react';
import { toDataURL } from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '../../hooks/useToast';
import BrandLogo from '../common/BrandLogo';

const GlobalHealthPassport: React.FC<{ memberId: number }> = ({ memberId }) => {
    const { members, liveHealthData, medicalConsultations, medicalReports } = useData();
    const { addToast } = useToast();
    const member = members.find(m => m.id === memberId);
    
    // Core States
    const [qrUrl, setQrUrl] = useState('');
    const [isSOSMode, setIsSOSMode] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isBeaming, setIsBeaming] = useState(false);
    const [neuralHash, setNeuralHash] = useState('');
    
    // UI States
    const [activeTab, setActiveTab] = useState<'ID' | 'History' | 'Immunity'>('ID');

    const passportRef = useRef<HTMLDivElement>(null);

    // --- INTEGRATED METADATA (v31.0 SYNC) ---
    const bloodType = member?.medical_history.bloodGroup || "O+";
    
    // Get Medical Clearance Status based on last consultation
    const medicalStatus = useMemo(() => {
        const lastConsult = medicalConsultations
            .filter(c => c.memberId === memberId)
            .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (!lastConsult) return { label: 'CLEARED', color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30' };
        
        if (lastConsult.severity === 'Critical' || lastConsult.severity === 'High') {
            return { label: 'RESTRICTED', color: 'text-red-500', bg: 'bg-red-900/20', border: 'border-red-500/30' };
        }
        return { label: 'CLEARED', color: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/30' };
    }, [medicalConsultations, memberId]);

    const bioAge = member?.biologicalAge || member?.bio_age || 25;

    // PERFORMANCE FIX: Memoize UHID
    const uhid = useMemo(() => {
        return `RYL-${memberId}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }, [memberId]);

    // --- 1. LIVE NEURAL HASH ENGINE (Optimized) ---
    useEffect(() => {
        const interval = setInterval(() => {
            const timestamp = Date.now();
            const randomHash = Math.random().toString(36).substring(2, 10).toUpperCase();
            setNeuralHash(`${timestamp.toString().slice(-6)}-${randomHash}`);
        }, 2000); 
        return () => clearInterval(interval);
    }, []);

    // --- 2. QR GENERATION ---
    useEffect(() => {
        if (member) {
            const portableData = {
                protocol: "SOVEREIGN_V31", 
                uhid: uhid,
                identity: member.name,
                emergency: member.emergency_contact,
                medical: {
                    blood: bloodType,
                    status: medicalStatus.label,
                    conditions: member.medical_history.conditions,
                },
                timestamp: Date.now()
            };
            
            toDataURL(JSON.stringify(portableData), { 
                width: 300, 
                margin: 1,
                color: { dark: '#000000', light: '#ffffff' }
            }).then(url => setQrUrl(url));
        }
    }, [member, bloodType, uhid, medicalStatus]);

    // --- 3. NFC BEAM SIMULATION ---
    const handleNFCBeam = () => {
        setIsBeaming(true);
        addToast("NFC Array: Broadcasting Identity...", "info");
        setTimeout(() => {
            setIsBeaming(false);
            addToast("Terminal Handshake Successful. Access Granted.", "success");
        }, 2000);
    };

    const handleDownloadPDF = async () => {
        if (!passportRef.current) return;
        setIsGenerating(true);
        addToast("Sovereign Protocol: Minting Secure Health Document...", "info");
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(passportRef.current, { 
                scale: 2, 
                useCORS: true,
                backgroundColor: '#0a0a0a',
                logging: false,
                allowTaint: true
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const width = pdf.internal.pageSize.getWidth();
            const height = (canvas.height * width) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, width, height);
            pdf.save(`Royal_Passport_${member?.name.replace(/\s+/g, '_')}.pdf`);
            addToast("Health Passport Synchronized & Downloaded.", "success");
        } catch (e) {
            console.error(e);
            addToast("Uplink Failed. Check memory cache.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!member) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-32">
            {/* OMNI-HUD HEADER */}
            <div className={`p-10 rounded-[4rem] border transition-all duration-700 relative overflow-hidden shadow-2xl ${isSOSMode ? 'bg-red-950 border-red-500' : 'bg-[#020308] border-cyan-500/30'}`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className={`absolute -right-40 -top-40 w-[600px] h-[600px] rounded-full blur-[150px] animate-pulse ${isSOSMode ? 'bg-red-600/20' : 'bg-cyan-600/10'}`}></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`px-5 py-2 rounded-full flex items-center gap-3 shadow-lg border ${isSOSMode ? 'bg-red-600 text-white border-red-400' : 'bg-cyan-600 text-white border-cyan-400'}`}>
                                {isSOSMode ? <AlertTriangle className="w-5 h-5 animate-bounce" /> : <Globe className="w-5 h-5" />}
                                <span className="text-xs font-black uppercase tracking-[0.2em]">{isSOSMode ? 'SOS_ALERT_ACTIVE' : 'Global Passport v31.0'}</span>
                            </div>
                            {!isSOSMode && <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">Status: Worldwide_Authenticated</span>}
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none mb-6">
                            Life <span className={`text-transparent bg-clip-text ${isSOSMode ? 'bg-gradient-to-r from-red-400 to-orange-600' : 'bg-gradient-to-r from-cyan-400 to-blue-600'}`}>Node</span>
                        </h1>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => setIsSOSMode(!isSOSMode)}
                            className={`px-12 py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${isSOSMode ? 'bg-white text-red-600' : 'bg-red-600 text-white hover:bg-red-500'}`}
                        >
                            {isSOSMode ? <RefreshCw className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
                            {isSOSMode ? 'TERMINATE SOS' : 'TRIGGER EMERGENCY SOS'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 1. THE DIGITAL PASSPORT CARD */}
                <div className="lg:col-span-7 space-y-6">
                    <div 
                        ref={passportRef}
                        className={`bg-[#0a0a0a] rounded-[3.5rem] border-2 p-10 relative overflow-hidden transition-all duration-700 shadow-[0_0_100px_rgba(0,0,0,0.8)] ${isSOSMode ? 'border-red-500 shadow-red-900/20' : 'border-cyan-500/20 shadow-cyan-900/20'}`}
                    >
                        {/* Background Hologram Effects */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10"></div>
                        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] ${isSOSMode ? 'bg-red-600/10' : 'bg-cyan-600/10'}`}></div>

                        {/* Top Identity Bar */}
                        <div className="flex justify-between items-start mb-12 border-b border-white/5 pb-8 relative z-10">
                            <div className="flex items-center gap-6">
                                <BrandLogo size="md" showText={false} />
                                <div>
                                    <h3 className="text-white font-black uppercase tracking-[0.2em] text-xl">Sovereign Federation</h3>
                                    <p className={`text-[10px] font-mono uppercase tracking-widest ${isSOSMode ? 'text-red-400' : 'text-cyan-400'}`}>Global Biometric Credential</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Passport UHID</p>
                                <p className="text-white font-mono text-sm font-bold bg-white/5 px-4 py-1.5 rounded-xl border border-white/10">{uhid}</p>
                            </div>
                        </div>

                        {/* Profile Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                            <div className="space-y-6">
                                <div className={`w-full aspect-[3/4] bg-gray-900 rounded-3xl border-2 overflow-hidden relative group transition-colors ${isSOSMode ? 'border-red-500' : 'border-cyan-500/30'}`}>
                                    <img 
                                        src={member.avatar} 
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                                        alt="Identity"
                                        crossOrigin="anonymous" // Important for PDF export
                                    />
                                    
                                    {/* Scan Line Animation */}
                                    {!isSOSMode && (
                                        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_20px_cyan] animate-scan z-20"></div>
                                    )}

                                    <div className={`absolute bottom-0 w-full py-2 text-center backdrop-blur-md ${isSOSMode ? 'bg-red-600/80' : 'bg-cyan-600/80'}`}>
                                        <p className="text-[10px] text-white font-black uppercase tracking-[0.4em]">VERIFIED</p>
                                    </div>
                                </div>
                                <div className="bg-white p-3 rounded-3xl shadow-2xl group transition-transform hover:scale-105">
                                    <img src={qrUrl} className="w-full h-auto mix-blend-multiply" alt="Access QR" />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-8">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-2">Subject Name</p>
                                            <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{member.name}</h2>
                                        </div>
                                        <div className="text-right">
                                             <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em] mb-1">Live Hash</p>
                                             <p className="text-xs font-mono text-cyan-500 animate-pulse">{neuralHash}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/5 p-5 rounded-3xl border border-white/10 group hover:border-cyan-500/30 transition-all">
                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Dna className="w-3 h-3"/> Bio-Type
                                        </p>
                                        <p className={`text-3xl font-black italic ${isSOSMode ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                            {bloodType} <span className="text-xs text-gray-500 not-italic font-medium">/ Age: {bioAge}</span>
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-5 rounded-3xl border border-white/10 group hover:border-cyan-500/30 transition-all">
                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Activity className="w-3 h-3"/> Live Vitals
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-black text-white italic">{liveHealthData.heartRate.avg}</p>
                                            <span className="text-[10px] font-bold text-red-500 animate-pulse">BPM</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Medical Status Indicator */}
                                <div className={`p-4 rounded-2xl border flex items-center justify-between ${medicalStatus.bg} ${medicalStatus.border}`}>
                                    <div className="flex items-center gap-3">
                                        <Stethoscope className={`w-5 h-5 ${medicalStatus.color}`} />
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${medicalStatus.color}`}>Medical Clearance</p>
                                            <p className="text-white font-bold text-sm">{medicalStatus.label}</p>
                                        </div>
                                    </div>
                                    {medicalStatus.label === 'CLEARED' ? <CheckCircle className="w-5 h-5 text-green-500"/> : <AlertTriangle className="w-5 h-5 text-red-500"/>}
                                </div>

                                {/* Emergency Shard */}
                                <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 flex justify-between items-center ${isSOSMode ? 'bg-red-900/20 border-red-500 animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'bg-gray-900 border-white/5'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-2xl ${isSOSMode ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${isSOSMode ? 'text-red-400' : 'text-gray-500'}`}>Emergency Uplink</p>
                                            <p className="text-white font-bold uppercase text-lg italic">{member.emergency_contact?.name || 'NODE_NOT_SET'}</p>
                                            <p className="text-white font-mono text-sm tracking-widest mt-1">{member.emergency_contact?.phone || '---'}</p>
                                        </div>
                                    </div>
                                    {isSOSMode && <Activity className="w-8 h-8 text-red-500" />}
                                </div>
                            </div>
                        </div>

                        {/* Holographic Verification Footer */}
                        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                            <div className="flex gap-6 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                                <span className="flex items-center gap-2"><Fingerprint className="w-3 h-3" /> BIO_DATA_LOCKED</span>
                                <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> AES_256_PGP</span>
                                <span className="flex items-center gap-2 text-green-500"><CheckCircle className="w-3 h-3" /> GLOBAL_COMPLIANT</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-cyan-500 animate-shimmer w-full"></div>
                                </div>
                                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">SOVEREIGN_ID_v31</span>
                            </div>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={handleDownloadPDF}
                            disabled={isGenerating}
                            className="bg-white text-black font-black py-5 rounded-3xl shadow-xl hover:bg-cyan-500 transition-all uppercase tracking-widest text-[10px] italic flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                            Export PDF
                        </button>
                        <button 
                            onClick={handleNFCBeam}
                            className={`bg-gray-900 border border-white/10 text-white font-black py-5 rounded-3xl shadow-xl transition-all uppercase tracking-widest text-[10px] italic flex items-center justify-center gap-3 active:scale-95 ${isBeaming ? 'bg-cyan-900/50 border-cyan-500' : 'hover:bg-gray-800'}`}
                        >
                            <Wifi className={`w-4 h-4 ${isBeaming ? 'animate-ping' : ''}`} /> NFC Beam
                        </button>
                    </div>
                </div>

                {/* 2. HISTORY & IMMUNITY VAULT */}
                <div className="lg:col-span-5 space-y-6">
                    
                    {/* Access Log Ledger */}
                    <Card title="Access Ledger" className="bg-gray-950 border-white/5 p-8 rounded-[3rem] h-[350px] flex flex-col shadow-2xl">
                         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                             {[
                                 { loc: 'Royal Gym Main Gate', time: 'Today, 06:45 AM', status: 'Approved' },
                                 { loc: 'Recovery Pod B', time: 'Yesterday, 07:30 PM', status: 'Approved' },
                                 { loc: 'Dietary Kiosk', time: 'Yesterday, 07:15 PM', status: 'Approved' },
                                 { loc: 'Royal Gym Main Gate', time: 'Yesterday, 06:00 PM', status: 'Approved' },
                                 { loc: 'Aether Medical Scan', time: '3 Days Ago', status: 'Verified' }
                             ].map((log, i) => (
                                 <div key={i} className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                     <div className="flex items-center gap-3">
                                         <History className="w-4 h-4 text-gray-500" />
                                         <div>
                                             <p className="text-xs font-bold text-white">{log.loc}</p>
                                             <p className="text-[9px] text-gray-500 font-mono">{log.time}</p>
                                         </div>
                                     </div>
                                     <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{log.status}</span>
                                 </div>
                             ))}
                         </div>
                    </Card>

                    {/* Bio-Shield (Immunity) */}
                    <Card title="Bio-Shield Status" className="bg-gradient-to-br from-green-950/30 to-black border-green-500/20 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck className="w-24 h-24 text-green-500"/></div>
                        <div className="relative z-10 space-y-4">
                             <div className="flex items-center gap-4">
                                 <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/30">
                                     <Syringe className="w-6 h-6 text-green-400" />
                                 </div>
                                 <div>
                                     <h4 className="text-white font-bold">Vaccination Matrix</h4>
                                     <p className="text-xs text-gray-400">Universal Coverage Verified</p>
                                 </div>
                             </div>
                             <div className="space-y-2">
                                 <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                     <span className="text-xs text-gray-300">COVID-19 (Booster)</span>
                                     <CheckCircle className="w-4 h-4 text-green-500" />
                                 </div>
                                 <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                     <span className="text-xs text-gray-300">Influenza (Annual)</span>
                                     <CheckCircle className="w-4 h-4 text-green-500" />
                                 </div>
                                 <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                     <span className="text-xs text-gray-300">Tetanus</span>
                                     <CheckCircle className="w-4 h-4 text-green-500" />
                                 </div>
                             </div>
                             <div className="pt-4 border-t border-white/5">
                                 <p className="text-[9px] font-black text-green-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                     <Plane className="w-3 h-3" /> Travel Clearance: GRANTED
                                 </p>
                             </div>
                        </div>
                    </Card>

                    {/* Quick Share */}
                    <button className="w-full p-6 bg-gray-900 border border-white/10 rounded-[2.5rem] flex items-center justify-between group hover:border-cyan-500/30 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-black rounded-xl text-cyan-400"><Radio className="w-5 h-5"/></div>
                            <div className="text-left">
                                <h4 className="font-bold text-white text-sm">Emergency Air-Drop</h4>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Share Medical ID</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalHealthPassport;
