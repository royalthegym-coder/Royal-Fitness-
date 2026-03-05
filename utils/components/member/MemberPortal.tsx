
import React, { useState, useEffect, useMemo } from 'react';
import Header from '../Header';
import { INITIAL_MEMBERS, INITIAL_HEALTH_DATA, GYM_INFO } from '../../constants';
import TodaysWorkout from './TodaysWorkout';
import DietPlanView from './DietPlanView';
import { HealthData, Theme, View } from '../../types';
import MemberHealthDashboard from './MemberHealthDashboard';
import Sidebar from '../Sidebar';
import { MenuIcon } from '../icons/MenuIcon';
import GeminiChat from '../GeminiChat';
import { ChatIcon } from '../icons/ChatIcon';
import MemberPayments from './MemberPayments';
import MemberPackages from './MemberPackages';
import { useData } from '../../context/DataProvider';
import AutoAttendance from './AutoAttendance';
import SmartScheduler from './SmartScheduler';
import { QrCodeIcon } from '../icons/QrCodeIcon';
import { toDataURL } from 'qrcode';
import Modal from '../common/Modal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { DashboardIcon } from '../icons/NavIcons';
import Card from '../common/Card';
import MedicalHub from './MedicalHub';
import BiomarkerVault from './BiomarkerVault';
import DailyRoutineLogView from './DailyRoutineLog';
import MetabolicTracker from './MetabolicTracker'; 
import AetherCommunityHive from './AetherCommunityHive'; 
import NeuroRecovery from './NeuroRecovery'; 
import GlobalHealthPassport from './GlobalHealthPassport';
import HelpSupport from '../HelpSupport';
import SynthesisX from '../SynthesisX';
import WarriorPerformanceLab from './WarriorPerformanceLab';
import NeuralRepAnalyst from './NeuralRepAnalyst';
import WearableConnectHub from './SmartWatch';
import NutritionAdvisor from './NutritionAdvisor';
import FutureOFS from './FutureOFS';
import ProfileView from './ProfileView'; // Added
import { UniversalGadgetDashboard } from './UniversalGadgetDashboard';
import { DigitalBioHealthPass } from './DigitalBioHealthPass';
import { MetabolicDigitalTwin } from './MetabolicDigitalTwin';
import VoiceAssistant from '../VoiceAssistant';
import { useToast } from '../../hooks/useToast';
import { sendThankYouForPayment } from '../../../lib/whatsapp';
import { 
    CalendarCheck, Globe, Zap, ShieldAlert, DollarSign, Activity, 
    Network, Heart, CreditCard, ChevronRight, LifeBuoy, MessageSquare, 
    TrendingUp, ShieldCheck, Clock, Crown, Infinity, Fingerprint, 
    Smartphone, ScanFace, Lock, Wifi, Binary, Layers, Server, Radio,
    Bot, Flame, Wind, Droplets, BrainCircuit, Play, BarChart, FileText,
    Sun, Moon, Sunrise, Sunset, Sparkles, Utensils, X, Target, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import BioSyncBanner from './BioSyncBanner';

interface MemberPortalProps {
    onLogout: () => void;
    loggedInMemberId: number;
    theme: Theme;
    toggleTheme: () => void;
}

const MemberPortal: React.FC<MemberPortalProps> = ({ onLogout, loggedInMemberId, theme, toggleTheme }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const { invoices = [], updateInvoiceStatus, addTransaction, dailyRoutineLogs = [], systemHealth, auditLogs, liveHealthData, systemVersion, addAuditLog } = useData();
    const { addToast } = useToast();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);
    const [isIdCardOpen, setIsIdCardOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    
    // Holographic ID State
    const [neuralHash, setNeuralHash] = useState('');
    const [isScanning, setIsScanning] = useState(true);

    // Singularity Dashboard State
    const [singularityScore, setSingularityScore] = useState(0);

    // --- NEW PAYMENT & WELCOME STATES ---
    const [showDuePopup, setShowDuePopup] = useState(false);
    const [totalDueAmount, setTotalDueAmount] = useState(0);
    const [paymentQr, setPaymentQr] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

    const selectedMember = INITIAL_MEMBERS.find(m => m.id === loggedInMemberId);
    
    // Calculate progress for Dashboard Widget
    const dailyLogs = dailyRoutineLogs.filter(l => l.member_id === loggedInMemberId);
    const completedRoutineCount = dailyLogs.filter(l => l.is_done).length;
    const totalRoutineCount = dailyLogs.length || 1; // Avoid divide by zero
    const routineProgress = Math.round((completedRoutineCount / totalRoutineCount) * 100);

    // --- ENHANCED PAYMENT DUE CHECK ---
    useEffect(() => {
        const pending = invoices.filter(inv => inv.memberId === loggedInMemberId && (inv.status === 'Pending' || inv.status === 'Overdue'));
        const total = pending.reduce((sum, inv) => sum + inv.amount, 0);
        if (total > 0) {
            setTotalDueAmount(total);
            setShowDuePopup(true);
            const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${total.toFixed(2)}&cu=INR&tn=MemberFee_${loggedInMemberId}`;
            toDataURL(upiUri, { width: 300, margin: 2 }).then(url => setPaymentQr(url));
        } else {
            setShowDuePopup(false);
        }
    }, [invoices, loggedInMemberId]);

    useEffect(() => {
        if (selectedMember && isIdCardOpen) {
            const payload = JSON.stringify({ 
                protocol: "ROYAL_ID_V31_SINGULARITY",
                id: selectedMember.id, 
                ts: Date.now(),
                auth: "BIO_VERIFIED_SECURE"
            });
            toDataURL(payload, { width: 300, margin: 1, color: { dark: '#000000', light: '#00ffff' } }).then(url => setQrCode(url));
            
            setTimeout(() => setIsScanning(false), 3000);
        }
    }, [selectedMember, isIdCardOpen]);
    
    // --- NEW PAYMENT HANDLER ---
    const handleQuickPay = async () => {
        if (!selectedMember) return;
        setIsProcessingPayment(true);
        // Simulate payment API call
        await new Promise(r => setTimeout(r, 2500));
        
        // 1. Update data provider state
        invoices.filter(inv => inv.memberId === loggedInMemberId && inv.status !== 'Paid')
            .forEach(inv => updateInvoiceStatus(inv.id, 'Paid'));
        
        const txnId = `TXN-${Date.now()}`;
        addTransaction({ 
            id: txnId, 
            memberName: selectedMember.name, 
            amount: totalDueAmount, 
            date: new Date().toISOString().split('T')[0], 
            method: 'QR Code' 
        });

        // 2. Alert Admin via Audit Log
        addAuditLog({
            member_id: loggedInMemberId,
            action: 'PAYMENT_RECEIVED',
            details: `Member ${selectedMember.name} paid ₹${totalDueAmount} via App. Receipt generated.`
        });
        
        setIsProcessingPayment(false);
        setPaymentSuccess(true);
        addToast("Payment Verified. Core Systems Unlocked.", "success");

        // 3. Send Thank You message
        if (selectedMember.whatsappConsent) {
            sendThankYouForPayment(selectedMember);
        }

        setTimeout(() => { 
            setPaymentSuccess(false); 
            setShowDuePopup(false); 
            setTotalDueAmount(0);
            setShowWelcomeBanner(true);
        }, 2000);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setNeuralHash(Math.random().toString(36).substring(2, 15).toUpperCase());
            const hrScore = Math.max(0, 100 - Math.abs(liveHealthData.heartRate.avg - 70));
            const syncScore = Math.floor((hrScore + (selectedMember?.health_score || 80)) / 2);
            setSingularityScore(syncScore);
        }, 2000);
        return () => clearInterval(interval);
    }, [liveHealthData, selectedMember]);

    const renderMemberView = () => {
        switch (activeView) {
            case 'dashboard': return (
                <div className="space-y-8 animate-fade-in">
                    
                    {/* Welcome Banner */}
                    {showWelcomeBanner && (
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-[2.5rem] shadow-2xl flex justify-between items-center relative overflow-hidden animate-fade-in">
                            <div className="flex items-center gap-4">
                                <CheckCircleIcon className="w-10 h-10 text-white" />
                                <div>
                                    <h3 className="text-white font-black text-xl">Welcome Back, {selectedMember?.name}!</h3>
                                    <p className="text-emerald-100 text-sm">Your access is fully restored. Thank you for your payment.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowWelcomeBanner(false)} className="text-white/70 hover:text-white transition-colors p-2 rounded-full">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                    )}

                    {/* HERO IDENTITY CARD */}
                    <div className="bg-black p-10 rounded-[3.5rem] border border-cyan-500/30 relative overflow-hidden shadow-[0_0_120px_rgba(6,182,212,0.15)] group">
                        <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="px-5 py-2 bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 backdrop-blur-md">
                                        <Infinity className="w-3 h-3 animate-spin-slow" /> {systemVersion}
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">NODE: {selectedMember?.name.split(' ')[0].toUpperCase()}</span>
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                                    {selectedMember?.name}
                                </h1>
                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsIdCardOpen(true)}
                                        className="bg-white text-black font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-cyan-400 transition-all flex items-center gap-2 active:scale-95"
                                    >
                                        <QrCodeIcon className="w-4 h-4"/> Access ID
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex gap-6">
                                <div className="bg-black/60 backdrop-blur-xl p-8 rounded-[3rem] border border-cyan-500/20 shadow-2xl relative overflow-hidden group/meter min-w-[220px] text-center">
                                    <Activity className="w-8 h-8 text-cyan-400 mx-auto mb-2 animate-pulse" />
                                    <p className="text-5xl font-black text-white italic tracking-tighter">{singularityScore}%</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mt-1">Synchronization</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <BioSyncBanner />

                    {/* DASHBOARD WIDGETS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Fiscal Status Widget */}
                        <Card 
                            onClick={() => setActiveView('payments')} 
                            className={`cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 transition-all ${totalDueAmount > 0 ? 'bg-red-950/20 border-red-500/30 hover:border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.1)]' : 'bg-green-950/20 border-green-500/30 hover:border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.1)]'}`}
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${totalDueAmount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white'}`}>
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    {totalDueAmount > 0 ? 'Payment Due' : 'Account Active'}
                                </h3>
                                <p className={`text-4xl font-black mt-2 ${totalDueAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    ₹{totalDueAmount > 0 ? totalDueAmount : '0.00'}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
                                    {totalDueAmount > 0 ? 'Tap to Settle' : 'Fiscal Sync Complete'}
                                </p>
                            </div>
                        </Card>

                        {/* 2. Health Intensity Widget */}
                        <Card 
                            onClick={() => setActiveView('health')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-cyan-500/30 hover:border-cyan-500 bg-cyan-950/10 hover:bg-cyan-950/20 transition-all"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-cyan-600/20 text-cyan-400 rounded-2xl border border-cyan-500/30">
                                        <Heart className="w-6 h-6" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Bio-Intensity</h3>
                                <p className="text-4xl font-black mt-2 text-cyan-400">{selectedMember?.health_score || 85}%</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Vitals Telemetry</p>
                            </div>
                        </Card>

                        {/* 3. Mission Status Widget */}
                        <Card 
                            onClick={() => setActiveView('dailyProtocol')} 
                            className="cursor-pointer group relative overflow-hidden rounded-[2.5rem] border-2 border-amber-500/30 hover:border-amber-500 bg-amber-950/10 hover:bg-amber-950/20 transition-all"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-600/20 text-amber-400 rounded-2xl border border-amber-500/30">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-amber-400 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Daily Mission</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${routineProgress}%` }}></div>
                                    </div>
                                    <span className="text-sm font-bold text-amber-500">{routineProgress}%</span>
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">{dailyLogs.length} Objectives Loaded</p>
                            </div>
                        </Card>
                    </div>

                    <VoiceAssistant setCurrentView={setActiveView} />

                    {/* QUICK ACCESS GRID */}
                    <div className="grid grid-cols-2 gap-4">
                         <button 
                            onClick={() => setActiveView('workout')}
                            className="bg-gray-900 border border-white/5 hover:border-blue-500/50 p-6 rounded-[2.5rem] flex items-center justify-between group transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-900/20 rounded-xl text-blue-400 group-hover:bg-blue-500 group-hover:text-black transition-colors">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-white text-sm uppercase">Train Now</h4>
                                    <p className="text-[10px] text-gray-500">Live Neural Mirror</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white" />
                        </button>

                        <button 
                            onClick={() => setActiveView('medicalHub')}
                            className="bg-gray-900 border border-white/5 hover:border-teal-500/50 p-6 rounded-[2.5rem] flex items-center justify-between group transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-teal-900/20 rounded-xl text-teal-400 group-hover:bg-teal-500 group-hover:text-black transition-colors">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-white text-sm uppercase">Medical Hub</h4>
                                    <p className="text-[10px] text-gray-500">Aether Diagnostics</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white" />
                        </button>
                    </div>
                </div>
            );
            case 'workout': return <TodaysWorkout memberId={loggedInMemberId} setActiveView={setActiveView} />;
            case 'diet': return <DietPlanView memberId={loggedInMemberId} />;
            case 'nutritionAdvisor': return <NutritionAdvisor memberId={loggedInMemberId} />;
            case 'dailyProtocol': return <DailyRoutineLogView memberId={loggedInMemberId} />;
            case 'medicalHub': return <MedicalHub memberId={loggedInMemberId} />;
            case 'biomarkerVault': return <BiomarkerVault memberId={loggedInMemberId} />;
            case 'metabolicTracker': return <MetabolicTracker />; 
            case 'aetherCommunity': return <AetherCommunityHive memberId={loggedInMemberId} />; 
            case 'neuroRecovery': return <NeuroRecovery />; 
            case 'globalHealthPassport': return <GlobalHealthPassport memberId={loggedInMemberId} />;
            case 'synthesisX': return <SynthesisX memberId={loggedInMemberId} />;
            case 'payments': return <MemberPayments memberId={loggedInMemberId} />;
            case 'packages': return <MemberPackages memberId={loggedInMemberId} />;
            case 'attendance': return <AutoAttendance memberId={loggedInMemberId} />;
            case 'scheduler': return <SmartScheduler memberName={selectedMember?.name || 'M'} phone={selectedMember?.phone || ''} />;
            case 'helpSupport': return <HelpSupport setChatOpen={setChatOpen} />;
            case 'health': return <MemberHealthDashboard />;
            case 'performanceLab': return <WarriorPerformanceLab memberId={loggedInMemberId} />;
            case 'neuralRep': return <NeuralRepAnalyst />;
            case 'wearables': return <WearableConnectHub />;
            case 'futureOFS': return <FutureOFS memberId={loggedInMemberId} />;
            case 'universalGadgets': return <UniversalGadgetDashboard />;
            case 'digitalBioPass': return <DigitalBioHealthPass memberId={loggedInMemberId} />;
            case 'metabolicSimulator': return <MetabolicDigitalTwin />;
            case 'profile': return <ProfileView memberId={loggedInMemberId} />; // Added
            default: return <div className="text-center py-20 text-gray-500 uppercase font-black tracking-widest">Protocol Initializing...</div>;
        }
    };

    return (
        <div className="h-screen w-screen flex bg-[#050505] text-gray-100 overflow-hidden font-sans">
            <Sidebar currentView={activeView} setCurrentView={setActiveView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} role="member" />
            
            <div className="flex-1 flex flex-col relative">
                <Header onLogout={onLogout} userName={selectedMember?.name || ''} avatar={selectedMember?.avatar || ''} theme="dark" toggleTheme={toggleTheme}>
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-400"><MenuIcon /></button>
                </Header>
                
                <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-[#050505]">
                    <div className="max-w-7xl mx-auto">{renderMemberView()}</div>
                </main>
                
                {/* Floating Chat Button */}
                <button
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-50 bg-amber-500 text-black p-5 rounded-full shadow-[0_0_60px_rgba(245,158,11,0.5)] hover:scale-110 transition-all group active:scale-95 border-4 border-black"
                >
                    <ChatIcon className="w-8 h-8" />
                </button>

                {/* Mobile Tactical Dock */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-3xl border-t border-white/5 px-6 flex justify-between items-center h-20 z-40 pb-2">
                    <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 ${activeView === 'dashboard' ? 'text-amber-500' : 'text-gray-600'}`}><DashboardIcon className="w-6 h-6"/><span className="text-[8px] font-black uppercase">Hub</span></button>
                    <button onClick={() => setActiveView('workout')} className={`flex flex-col items-center gap-1 ${activeView === 'workout' ? 'text-amber-500' : 'text-gray-600'}`}><Zap className="w-6 h-6"/><span className="text-[8px] font-black uppercase">Train</span></button>
                    <button onClick={() => setIsIdCardOpen(true)} className="relative -top-8 bg-amber-500 text-black p-4 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] border-4 border-black active:scale-95"><QrCodeIcon className="w-6 h-6"/></button>
                    <button onClick={() => setActiveView('dailyProtocol')} className={`flex flex-col items-center gap-1 ${activeView === 'dailyProtocol' ? 'text-amber-500' : 'text-gray-600'}`}><CalendarCheck className="w-6 h-6"/><span className="text-[8px] font-black uppercase">Tasks</span></button>
                    <button onClick={() => setActiveView('payments')} className={`flex flex-col items-center gap-1 ${activeView === 'payments' ? 'text-amber-500' : 'text-gray-600'}`}><DollarSign className="w-6 h-6"/><span className="text-[8px] font-black uppercase">Pay</span></button>
                </div>
            </div>

            <GeminiChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} context={{ role: 'member', memberId: selectedMember?.id, memberName: selectedMember?.name }} />
            
            <Modal isOpen={isIdCardOpen} onClose={() => setIsIdCardOpen(false)} title="Holographic Identity Matrix">
                <div className="flex flex-col items-center py-10 text-center">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_60px_rgba(255,255,255,0.1)] border-[12px] border-gray-950 mb-6 relative group">
                        <img src={qrCode} alt="ID" className="w-64 h-64 mix-blend-multiply" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-30 transition-opacity"><Zap className="w-32 h-32 text-black" /></div>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{selectedMember?.name}</h3>
                    <p className="text-cyan-400 font-black uppercase text-xs tracking-[0.4em] mt-2 px-6 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5">R-OS v31.0 VERIFIED</p>
                </div>
            </Modal>

            <Modal isOpen={showDuePopup && !paymentSuccess} onClose={() => setShowDuePopup(false)} title="Security Lockdown: Fiscal Debt">
                <div className="text-center py-6 space-y-8">
                    <div className="p-10 bg-red-950/20 border-2 border-red-500 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert className="w-32 h-32 text-red-500" /></div>
                        <h2 className="text-6xl font-black text-white italic tracking-tighter">₹{totalDueAmount.toLocaleString()}</h2>
                        <p className="text-red-400 text-xs font-black uppercase tracking-[0.5em] mt-3">Ledger Out of Sync</p>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] inline-block shadow-[0_0_60px_rgba(255,255,255,0.1)] border-[8px] border-white ring-4 ring-red-500/20">
                        <img src={paymentQr} alt="UPI" className="w-48 h-48 mix-blend-multiply" />
                    </div>

                    <p className="text-gray-400 text-sm font-medium px-8 leading-relaxed italic">"Your biometric access to the neural training floor has been throttled."</p>
                    
                    <button onClick={handleQuickPay} disabled={isProcessingPayment} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-5 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50">
                        {isProcessingPayment ? <AutoUpdateIcon className="animate-spin mr-2"/> : <CheckCircleIcon className="mr-2" />}
                        {isProcessingPayment ? 'PROCESSING TRANSACTION...' : 'PAY & UNLOCK HUB'}
                    </button>
                </div>
            </Modal>

            {paymentSuccess && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-fade-in">
                    <div className="text-center">
                        <div className="w-40 h-40 bg-green-500 rounded-[3rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_100px_#22c55e] animate-bounce border-[8px] border-green-400">
                            <CheckCircleIcon className="w-20 h-20 text-black" />
                        </div>
                        <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-4">RESTORED</h2>
                        <p className="text-green-400 text-xl font-mono uppercase tracking-[0.6em]">Welcome back, Athlete.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberPortal;
