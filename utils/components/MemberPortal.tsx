
import React, { useState, useEffect } from 'react';
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
import { useData } from '../../context/DataProvider';
import AutoAttendance from './AutoAttendance';
import SmartScheduler from './SmartScheduler';
import { QrCodeIcon } from '../icons/QrCodeIcon';
import { toDataURL } from 'qrcode';
import Modal from '../common/Modal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AutoUpdateIcon } from '../icons/AutoUpdateIcon';
import { BrainCircuitIcon } from '../icons/BrainCircuitIcon';
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
import { CalendarCheck, Globe, Zap, ShieldAlert, DollarSign, Activity, Network, Heart, CreditCard, ChevronRight, LifeBuoy, MessageSquare, TrendingUp, ShieldCheck } from 'lucide-react';
import VoiceAssistant from '../VoiceAssistant';
import { useToast } from '../../hooks/useToast';

interface MemberPortalProps {
    onLogout: () => void;
    loggedInMemberId: number;
    theme: Theme;
    toggleTheme: () => void;
}

const MemberPortal: React.FC<MemberPortalProps> = ({ onLogout, loggedInMemberId, theme, toggleTheme }) => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const { invoices = [], updateInvoiceStatus, addTransaction, dailyRoutineLogs = [] } = useData();
    const { addToast } = useToast();
    const [healthData, setHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);
    const [isIdCardOpen, setIsIdCardOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');

    const [showDuePopup, setShowDuePopup] = useState(false);
    const [totalDueAmount, setTotalDueAmount] = useState(0);
    const [paymentQr, setPaymentQr] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const selectedMember = INITIAL_MEMBERS.find(m => m.id === loggedInMemberId);
    const pendingRoutineCount = dailyRoutineLogs.filter(l => l.member_id === loggedInMemberId && !l.is_done).length;

    useEffect(() => {
        const pending = invoices.filter(inv => inv.memberId === loggedInMemberId && (inv.status === 'Pending' || inv.status === 'Overdue'));
        const total = pending.reduce((sum, inv) => sum + inv.amount, 0);
        if (total > 0) {
            setTotalDueAmount(total);
            setShowDuePopup(true);
            const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${total.toFixed(2)}&cu=INR&tn=MemberFee_${loggedInMemberId}`;
            toDataURL(upiUri, { width: 300, margin: 2 }).then(url => setPaymentQr(url));
        }
    }, [invoices, loggedInMemberId]);

    useEffect(() => {
        if (selectedMember && isIdCardOpen) {
            const payload = JSON.stringify({ id: selectedMember.id, ts: Date.now() });
            toDataURL(payload, { width: 256, margin: 2, color: { dark: '#000000', light: '#ffffff' } }).then(url => setQrCode(url));
        }
    }, [selectedMember, isIdCardOpen]);

    const handleQuickPay = () => {
        setIsProcessingPayment(true);
        setTimeout(() => {
            invoices.filter(inv => inv.memberId === loggedInMemberId && inv.status !== 'Paid')
                .forEach(inv => updateInvoiceStatus(inv.id, 'Paid'));
            addTransaction({ id: `TXN-${Date.now()}`, memberName: selectedMember?.name || 'M', amount: totalDueAmount, date: new Date().toISOString().split('T')[0], method: 'QR Code' });
            setIsProcessingPayment(false);
            setPaymentSuccess(true);
            addToast("Payment Verified. Core Systems Unlocked.", "success");
            setTimeout(() => { setPaymentSuccess(false); setShowDuePopup(false); }, 2000);
        }, 2000);
    };

    const renderMemberView = () => {
        switch (activeView) {
            case 'dashboard': return (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-amber-600 to-red-900 p-10 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-2">Authenticated Royal Athlete</p>
                            <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-6">{selectedMember?.name}</h2>
                            <div className="flex gap-3">
                                <button onClick={() => setIsIdCardOpen(true)} className="bg-white/10 hover:bg-white/20 border border-white/20 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center transition-all backdrop-blur-md shadow-xl active:scale-95">
                                    <QrCodeIcon className="w-5 h-5 mr-2" /> Digital ID
                                </button>
                                <span className="bg-black/40 border border-white/10 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center">Level {selectedMember?.level || 42}</span>
                            </div>
                        </div>
                        <BrainCircuitIcon className="absolute -top-20 -right-20 w-[400px] h-[400px] text-white opacity-5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card onClick={() => setActiveView('payments')} className={`cursor-pointer transition-all border-2 relative overflow-hidden group rounded-[2.5rem] ${totalDueAmount > 0 ? 'bg-red-950/20 border-red-500/30 hover:border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.1)]' : 'bg-green-950/20 border-green-500/30 hover:border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.1)]'}`}>
                            <div className="p-8 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className={`p-5 rounded-3xl ${totalDueAmount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-green-600 text-white'}`}>
                                        <DollarSign className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">Credits (फीस)</h3>
                                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2">{totalDueAmount > 0 ? 'Action Required' : 'Synchronized'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Fiscal Status</p>
                                    <p className={`text-4xl font-black italic ${totalDueAmount > 0 ? 'text-red-500' : 'text-green-500'}`}>₹{totalDueAmount > 0 ? totalDueAmount : '0'}</p>
                                </div>
                            </div>
                        </Card>
                        <Card onClick={() => setActiveView('health')} className="cursor-pointer transition-all border-2 border-cyan-500/30 hover:border-cyan-500 bg-cyan-950/20 relative overflow-hidden group rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.1)]">
                            <div className="p-8 flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="p-5 bg-cyan-600 text-white rounded-3xl group-hover:rotate-12 transition-transform shadow-xl">
                                        <Activity className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">Health Score</h3>
                                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-2">v23.0_Refined_Scan</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-gray-500 font-black uppercase mb-1">Bio Intensity</p>
                                    <p className="text-4xl font-black text-cyan-400 italic">{selectedMember?.health_score || 92}%</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <VoiceAssistant setCurrentView={setActiveView} />

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card onClick={() => setActiveView('dailyProtocol')} className="bg-gray-800/40 hover:bg-gray-800 cursor-pointer border-white/5 hover:border-amber-500/50 transition-all group text-center py-10 relative rounded-[2.5rem] shadow-xl">
                            {pendingRoutineCount > 0 && <span className="absolute top-4 right-4 bg-red-600 text-white w-8 h-8 rounded-full text-xs flex items-center justify-center font-black animate-bounce shadow-lg shadow-red-900/50">!</span>}
                            <CalendarCheck className="w-14 h-14 mx-auto mb-4 text-amber-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Today's Mission</h3>
                        </Card>
                        <Card onClick={() => setActiveView('performanceLab')} className="bg-gray-800/40 hover:bg-gray-800 cursor-pointer border-white/5 hover:border-cyan-500/50 transition-all group text-center py-10 rounded-[2.5rem] shadow-xl">
                            <TrendingUp className="w-14 h-14 mx-auto mb-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Evolution Lab</h3>
                        </Card>
                        <Card onClick={() => setActiveView('medicalHub')} className="bg-gray-800/40 hover:bg-gray-800 cursor-pointer border-white/5 hover:border-teal-500/50 transition-all group text-center py-10 rounded-[2.5rem] shadow-xl">
                            <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-teal-400 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Medical Hub</h3>
                        </Card>
                        <Card onClick={() => setActiveView('workout')} className="bg-gray-800/40 hover:bg-gray-800 cursor-pointer border-white/5 hover:border-blue-500/50 transition-all group text-center py-10 rounded-[2.5rem] shadow-xl">
                            <Zap className="w-14 h-14 mx-auto mb-4 text-blue-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-xs font-black uppercase tracking-widest">Training</h3>
                        </Card>
                    </div>
                </div>
            );
            case 'workout': return <TodaysWorkout memberId={loggedInMemberId} setActiveView={setActiveView} />;
            case 'diet': return <DietPlanView memberId={loggedInMemberId} />;
            case 'dailyProtocol': return <DailyRoutineLogView memberId={loggedInMemberId} />;
            case 'medicalHub': return <MedicalHub memberId={loggedInMemberId} />;
            case 'biomarkerVault': return <BiomarkerVault memberId={loggedInMemberId} />;
            case 'metabolicTracker': return <MetabolicTracker />; 
            case 'aetherCommunity': return <AetherCommunityHive memberId={loggedInMemberId} />; 
            case 'neuroRecovery': return <NeuroRecovery />; 
            case 'globalHealthPassport': return <GlobalHealthPassport memberId={loggedInMemberId} />;
            case 'synthesisX': return <SynthesisX memberId={loggedInMemberId} />;
            case 'payments': return <MemberPayments memberId={loggedInMemberId} />;
            case 'attendance': return <AutoAttendance memberId={loggedInMemberId} />;
            case 'scheduler': return <SmartScheduler memberName={selectedMember?.name || 'M'} phone={selectedMember?.phone || ''} />;
            case 'helpSupport': return <HelpSupport setChatOpen={setChatOpen} />;
            case 'health': return <MemberHealthDashboard />;
            case 'performanceLab': return <WarriorPerformanceLab memberId={loggedInMemberId} />;
            case 'neuralRep': return <NeuralRepAnalyst />;
            case 'wearables': return <WearableConnectHub />;
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
                <main className="flex-1 overflow-y-auto p-4 sm:p-10 pb-24 custom-scrollbar bg-[#050505]">
                    <div className="max-w-5xl mx-auto">{renderMemberView()}</div>
                </main>
                <button
                    onClick={() => setChatOpen(true)}
                    className="fixed bottom-24 right-8 z-50 bg-amber-500 text-black p-6 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.5)] hover:scale-110 transition-all group active:scale-95 border-4 border-black"
                >
                    <ChatIcon className="w-8 h-8" />
                </button>
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-3xl border-t border-white/5 px-8 flex justify-between items-center h-24 z-40">
                    <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1.5 ${activeView === 'dashboard' ? 'text-amber-500' : 'text-gray-600'}`}><DashboardIcon /><span className="text-[9px] font-black uppercase tracking-widest">Hub</span></button>
                    <button onClick={() => setActiveView('workout')} className={`flex flex-col items-center gap-1.5 ${activeView === 'workout' ? 'text-amber-500' : 'text-gray-600'}`}><Zap className="w-6 h-6" /><span className="text-[9px] font-black uppercase tracking-widest">Train</span></button>
                    <button onClick={() => setIsIdCardOpen(true)} className="relative -top-10 bg-amber-500 text-black p-6 rounded-full shadow-[0_0_50px_rgba(245,158,11,0.6)] border-[6px] border-black active:scale-95 transition-transform"><QrCodeIcon /></button>
                    <button onClick={() => setActiveView('dailyProtocol')} className={`flex flex-col items-center gap-1.5 ${activeView === 'dailyProtocol' ? 'text-amber-500' : 'text-gray-600'}`}><CalendarCheck className="w-6 h-6" /><span className="text-[9px] font-black uppercase tracking-widest">Mission</span></button>
                    <button onClick={() => setActiveView('payments')} className={`flex flex-col items-center gap-1.5 ${activeView === 'payments' ? 'text-amber-500' : 'text-gray-600'}`}><DollarSign className="w-6 h-6" /><span className="text-[9px] font-black uppercase tracking-widest">Pay</span></button>
                </div>
            </div>
            <GeminiChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} context={{ role: 'member', memberId: selectedMember?.id, memberName: selectedMember?.name }} />
            <Modal isOpen={isIdCardOpen} onClose={() => setIsIdCardOpen(false)} title="Holographic Identity Matrix">
                <div className="flex flex-col items-center py-10 text-center">
                    <div className="bg-white p-8 rounded-[3rem] shadow-[0_0_60px_rgba(255,255,255,0.1)] border-[16px] border-gray-950 mb-8 relative">
                        <img src={qrCode} alt="ID" className="w-64 h-64 mix-blend-multiply" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20"><Zap className="w-32 h-32 text-black" /></div>
                    </div>
                    <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{selectedMember?.name}</h3>
                    <p className="text-cyan-400 font-black uppercase text-xs tracking-[0.4em] mt-3 px-8 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/5">R-OS v23.0 AUTHENTICATED</p>
                </div>
            </Modal>
            <Modal isOpen={showDuePopup && !paymentSuccess} onClose={() => setShowDuePopup(false)} title="Security Lockdown: Fiscal Debt">
                <div className="text-center py-6 space-y-8">
                    <div className="p-12 bg-red-950/20 border-2 border-red-500 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert className="w-32 h-32 text-red-500" /></div>
                        <h2 className="text-7xl font-black text-white italic tracking-tighter">₹{totalDueAmount.toLocaleString()}</h2>
                        <p className="text-red-400 text-xs font-black uppercase tracking-[0.5em] mt-3">Ledger Out of Sync</p>
                    </div>
                    <div className="bg-white p-8 rounded-[3rem] inline-block shadow-[0_0_80px_rgba(255,255,255,0.1)] border-[12px] border-white ring-4 ring-red-500/20">
                        <img src={paymentQr} alt="UPI" className="w-56 h-56 mix-blend-multiply" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium px-8 leading-relaxed italic">"Your biometric access to the neural training floor has been throttled."</p>
                    <button onClick={handleQuickPay} disabled={isProcessingPayment} className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-6 rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm active:scale-95 disabled:opacity-50">
                        {isProcessingPayment ? <AutoUpdateIcon className="animate-spin mr-2"/> : <CheckCircleIcon className="mr-2" />}
                        {isProcessingPayment ? 'PROCESSING TRANSACTION...' : 'PAY & UNLOCK HUB'}
                    </button>
                </div>
            </Modal>
            {paymentSuccess && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/98 backdrop-blur-3xl animate-fade-in">
                    <div className="text-center">
                        <div className="w-48 h-48 bg-green-500 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-[0_0_120px_#22c55e] animate-bounce border-[12px] border-green-400">
                            <CheckCircleIcon className="w-24 h-24 text-black" />
                        </div>
                        <h2 className="text-7xl font-black text-white uppercase italic tracking-tighter mb-4">RESTORED</h2>
                        <p className="text-green-400 text-2xl font-mono uppercase tracking-[0.6em]">Welcome back, Athlete.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberPortal;
