
import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import { INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA, INITIAL_HEALTH_DATA, GYM_INFO } from '../../constants';
import TodaysWorkout from './member/TodaysWorkout';
import DietPlanView from './member/DietPlanView';
import FitnessTracker from './member/FitnessTracker';
import { MemberFitnessData, WorkoutLog, HealthData, Transaction, Theme, View, MemberView } from '../../types';
import MemberHealthDashboard from './member/MemberHealthDashboard';
import FuturisticFeatures from './FuturisticFeatures';
import BodySimulator from './BodySimulator';
import GamificationDashboard from './member/GamificationDashboard';
import SmartWatch from './member/SmartWatch';
import Sidebar from './Sidebar';
import { MenuIcon } from './icons/MenuIcon';
import GeminiChat from './GeminiChat';
import { ChatIcon } from './icons/ChatIcon';
import MemberPayments from './member/MemberPayments';
import { useData } from '../context/DataProvider';
import AutoAttendance from './member/AutoAttendance';
import SmartScheduler from './member/SmartScheduler';
import { FingerPrintIcon } from './icons/FingerPrintIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { BotIcon } from './icons/BotIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import Card from './common/Card';
import { QrCodeIcon } from './icons/QrCodeIcon';
import { toDataURL } from 'qrcode';
import Modal from './common/Modal';
import { TimeQuestIcon } from './icons/TimeQuestIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { AutoUpdateIcon } from './icons/AutoUpdateIcon';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

interface MemberPortalProps {
    onLogout: () => void;
    loggedInMemberId: number;
    theme: Theme;
    toggleTheme: () => void;
}

const MemberPortal: React.FC<MemberPortalProps> = ({ onLogout, loggedInMemberId, theme, toggleTheme }) => {
    const [activeView, setActiveView] = useState<MemberView>('dashboard');
    const { invoices, updateInvoiceStatus, addTransaction } = useData();
    const [healthData, setHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);
    
    // Digital ID State (Dynamic QR)
    const [isIdCardOpen, setIsIdCardOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [qrTimer, setQrTimer] = useState(5); // Regenerate every 5 seconds for security

    // Payment Alert State
    const [showDuePopup, setShowDuePopup] = useState(false);
    const [totalDueAmount, setTotalDueAmount] = useState(0);
    const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
    const [paymentQr, setPaymentQr] = useState('');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    const selectedMember = INITIAL_MEMBERS.find(m => m.id === loggedInMemberId);

    // Initial Load Check for Dues
    useEffect(() => {
        const pending = invoices.filter(
            inv => inv.memberId === loggedInMemberId && (inv.status === 'Pending' || inv.status === 'Overdue')
        );
        const total = pending.reduce((sum, inv) => sum + inv.amount, 0);
        
        if (total > 0) {
            setPendingInvoices(pending);
            setTotalDueAmount(total);
            setShowDuePopup(true);
            
            // Generate Payment QR immediately
            const upiUri = `upi://pay?pa=${GYM_INFO.upiIds.gpay1}&pn=${encodeURIComponent(GYM_INFO.name)}&am=${total.toFixed(2)}&cu=INR&tn=GymFees`;
            toDataURL(upiUri, { width: 300, margin: 2 }).then(url => setPaymentQr(url));
        } else {
            setShowDuePopup(false);
        }
    }, [invoices, loggedInMemberId]); // Dependency on invoices ensures auto-close on payment

    // DYNAMIC QR LOGIC (TOTP Sim)
    useEffect(() => {
        if (!selectedMember || !isIdCardOpen) return;

        const generateDynamicQR = () => {
            const timestamp = Date.now();
            const token = btoa(`${selectedMember.id}-${timestamp}-SECURE`); // Simple hash simulation
            const payload = JSON.stringify({
                uid: selectedMember.id,
                nm: selectedMember.name,
                sts: selectedMember.status,
                t: timestamp,
                hash: token
            });
            
            toDataURL(payload, { width: 256, margin: 2, color: { dark: '#000000', light: '#ffffff' } })
                .then(url => setQrCode(url));
            setQrTimer(5);
        };

        generateDynamicQR(); // Initial generation

        const interval = setInterval(() => {
            setQrTimer(prev => {
                if (prev <= 1) {
                    generateDynamicQR();
                    return 5;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [selectedMember, isIdCardOpen]);

    const handleQuickPay = () => {
        setIsProcessingPayment(true);
        // Simulate Processing
        setTimeout(() => {
            // Update all pending invoices to Paid
            pendingInvoices.forEach(inv => {
                updateInvoiceStatus(inv.id, 'Paid');
            });
            // Log Transaction
            addTransaction({
                id: `TXN-AUTO-${Date.now()}`,
                memberName: selectedMember?.name || 'Member',
                amount: totalDueAmount,
                date: new Date().toISOString().split('T')[0],
                method: 'QR Code'
            });

            setIsProcessingPayment(false);
            setPaymentSuccess(true);
            
            // Close after success animation
            setTimeout(() => {
                setPaymentSuccess(false);
                setShowDuePopup(false);
            }, 3000);
        }, 2000);
    };

    const renderMemberView = () => {
        switch (activeView) {
            case 'dashboard': return (
                <div className="space-y-6 animate-fade-in">
                    {/* Welcome Banner */}
                    <div className="bg-gradient-to-r from-amber-600 to-red-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold uppercase opacity-80 mb-1 flex items-center">
                                <SparkleIcon className="w-3 h-3 mr-1 text-yellow-300" /> Member Access
                            </p>
                            <h2 className="text-3xl font-black italic uppercase tracking-tight">{selectedMember?.name.split(' ')[0]}</h2>
                            
                            <div className="flex flex-wrap gap-3 mt-4">
                                <button 
                                    onClick={() => setIsIdCardOpen(true)}
                                    className="bg-black/30 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center hover:bg-black/50 transition-all"
                                >
                                    <QrCodeIcon className="w-4 h-4 mr-2" /> Digital ID
                                </button>
                                <div className={`backdrop-blur-sm border px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${selectedMember?.status === 'Active' ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                                    {selectedMember?.status}
                                </div>
                            </div>
                        </div>
                        <SparkleIcon className="absolute top-4 right-4 w-32 h-32 text-white opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700" />
                    </div>

                    {/* Neural Status Bar */}
                    <div className="flex items-center justify-between bg-gray-800/50 p-2 rounded-xl border border-gray-700/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 px-2">
                             <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </div>
                            <span className="text-[10px] font-mono text-cyan-400">NEURAL CORE: ONLINE</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 px-2">
                            <span className="flex items-center gap-1"><BrainCircuitIcon className="w-3 h-3"/> AI V5.0</span>
                            <span className="flex items-center gap-1"><AutoUpdateIcon className="w-3 h-3"/> SYNCED</span>
                        </div>
                    </div>

                    {/* Persistent Due Alert if Popup Closed but not Paid */}
                    {totalDueAmount > 0 && !showDuePopup && (
                        <div 
                            onClick={() => setShowDuePopup(true)}
                            className="bg-red-600/90 backdrop-blur-md text-white p-4 rounded-xl shadow-lg flex justify-between items-center cursor-pointer animate-pulse border border-red-400"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full"><DollarSignIcon /></div>
                                <div>
                                    <h4 className="font-bold text-lg">Payment Overdue</h4>
                                    <p className="text-xs text-red-200">Total Outstanding: ₹{totalDueAmount.toLocaleString()}</p>
                                </div>
                            </div>
                            <button className="bg-white text-red-600 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider">Pay Now</button>
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card onClick={() => setActiveView('attendance')} className="bg-gray-800 hover:bg-gray-750 cursor-pointer border border-gray-700 hover:border-amber-500 transition-all group">
                             <div className="flex flex-col items-center text-center py-2">
                                <div className="p-3 bg-amber-500/10 rounded-full mb-3 text-amber-500 group-hover:scale-110 transition-transform">
                                    <FingerPrintIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase">Auto Check-in</h3>
                                <p className="text-[10px] text-gray-500 mt-1">GPS / WiFi</p>
                             </div>
                        </Card>
                        <Card onClick={() => setActiveView('scheduler')} className="bg-gray-800 hover:bg-gray-700 cursor-pointer border border-gray-700 hover:border-cyan-500 transition-all group">
                             <div className="flex flex-col items-center text-center py-2">
                                <div className="p-3 bg-cyan-500/10 rounded-full mb-3 text-cyan-500 group-hover:scale-110 transition-transform">
                                    <TimeQuestIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase">Smart Time</h3>
                                <p className="text-[10px] text-gray-500 mt-1">AI Alerts</p>
                             </div>
                        </Card>
                        <Card onClick={() => setActiveView('workout')} className="bg-gray-800 hover:bg-gray-750 cursor-pointer border border-gray-700 hover:border-blue-500 transition-all group">
                             <div className="flex flex-col items-center text-center py-2">
                                <div className="p-3 bg-blue-500/10 rounded-full mb-3 text-blue-500 group-hover:scale-110 transition-transform">
                                    <SparkleIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase">Today's Plan</h3>
                                <p className="text-[10px] text-gray-500 mt-1">AI Generated</p>
                             </div>
                        </Card>
                        <Card onClick={() => setActiveView('payments')} className="bg-gray-800 hover:bg-gray-750 cursor-pointer border border-gray-700 hover:border-green-500 transition-all group">
                             <div className="flex flex-col items-center text-center py-2">
                                <div className="p-3 bg-green-500/10 rounded-full mb-3 text-green-500 group-hover:scale-110 transition-transform">
                                    <DollarSignIcon className="w-8 h-8" />
                                </div>
                                <h3 className="text-sm font-bold text-white uppercase">Pay Dues</h3>
                                <p className="text-[10px] text-gray-500 mt-1">Instant UPI</p>
                             </div>
                        </Card>
                    </div>
                    
                    <Card title="Live Health Metrics" className="border-t-4 border-red-500 bg-gray-900/50">
                         <MemberHealthDashboard isConnected={true} isConnecting={false} onConnect={() => {}} healthData={healthData} setHealthData={setHealthData} />
                    </Card>
                </div>
            );
            case 'workout': return <TodaysWorkout memberId={loggedInMemberId} onWorkoutComplete={() => {}} setActiveView={setActiveView} fitnessData={INITIAL_MEMBER_FITNESS_DATA} healthData={healthData} />;
            case 'diet': return <DietPlanView memberId={loggedInMemberId} healthData={healthData} />;
            case 'tracker': return <FitnessTracker memberId={loggedInMemberId} fitnessData={INITIAL_MEMBER_FITNESS_DATA} setFitnessData={() => {}} />;
            case 'health': return <MemberHealthDashboard isConnected={true} isConnecting={false} onConnect={() => {}} healthData={healthData} setHealthData={setHealthData} />;
            case 'ai_tools': return <FuturisticFeatures />;
            case 'simulator': return <BodySimulator />;
            case 'achievements': return <GamificationDashboard memberId={loggedInMemberId} />;
            case 'smartwatch': return <SmartWatch />;
            case 'payments': return <MemberPayments memberId={loggedInMemberId} />;
            case 'attendance': return <AutoAttendance />;
            case 'scheduler': return <SmartScheduler memberName={selectedMember?.name || 'Member'} phone={selectedMember?.phone || ''} />;
            default: return null;
        }
    };

    return (
        <div className="h-screen w-screen flex bg-[#0f172a] text-gray-100 overflow-hidden font-sans selection:bg-amber-500/30">
            <Sidebar currentView={activeView} setCurrentView={(v) => setActiveView(v as MemberView)} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} role="member" />
            
            <div className="flex-1 flex flex-col relative">
                <Header onLogout={onLogout} userName={selectedMember?.name || ''} avatar={selectedMember?.avatar || ''} theme={theme} toggleTheme={toggleTheme}>
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-400">
                        <MenuIcon />
                    </button>
                    <span className="ml-4 text-xs font-black text-amber-500 uppercase tracking-[0.3em] hidden sm:block">Member Portal</span>
                </Header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 custom-scrollbar">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {renderMemberView()}
                    </div>
                </main>

                {/* Mobile Bottom Navigation - App Like Feel */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/5 pb-safe pt-2 px-6 flex justify-between items-center z-40 h-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
                    <button onClick={() => setActiveView('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'dashboard' ? 'text-amber-500' : 'text-gray-500'}`}>
                        <div className={`p-1 rounded-lg ${activeView === 'dashboard' ? 'bg-amber-500/20' : ''}`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        </div>
                        <span className="text-[10px] font-bold">Home</span>
                    </button>
                    
                    <button onClick={() => setActiveView('workout')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'workout' ? 'text-amber-500' : 'text-gray-500'}`}>
                        <div className={`p-1 rounded-lg ${activeView === 'workout' ? 'bg-amber-500/20' : ''}`}>
                            <SparkleIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold">Train</span>
                    </button>

                    <div className="relative -top-6">
                        <button onClick={() => setIsIdCardOpen(true)} className="bg-amber-500 text-black p-4 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] border-4 border-gray-900 transform hover:scale-105 transition-all">
                            <QrCodeIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <button onClick={() => setActiveView('scheduler')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'scheduler' ? 'text-amber-500' : 'text-gray-500'}`}>
                        <div className={`p-1 rounded-lg ${activeView === 'scheduler' ? 'bg-amber-500/20' : ''}`}>
                            <TimeQuestIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold">Time</span>
                    </button>

                    <button onClick={() => setActiveView('payments')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'payments' ? 'text-amber-500' : 'text-gray-500'}`}>
                        <div className={`p-1 rounded-lg ${activeView === 'payments' ? 'bg-amber-500/20' : ''}`}>
                            <DollarSignIcon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-bold">Pay</span>
                    </button>
                </div>
            </div>

            {/* AI Chat Button (Desktop) */}
            <button
                onClick={() => setChatOpen(!isChatOpen)}
                className="hidden md:flex fixed bottom-8 right-8 bg-amber-500 text-gray-900 p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-110 transition-transform z-50 group items-center gap-2 font-black text-xs uppercase tracking-widest"
            >
                <ChatIcon className="w-6 h-6" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap">Royal Assistant</span>
            </button>
            <GeminiChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} context={{ role: 'member', memberId: loggedInMemberId, memberName: selectedMember?.name }} />

            {/* Digital ID Modal (Updated with Dynamic QR) */}
            <Modal isOpen={isIdCardOpen} onClose={() => setIsIdCardOpen(false)} title="Dynamic Bio-Access ID">
                <div className="flex flex-col items-center space-y-6 py-4">
                    <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-amber-500 relative overflow-hidden">
                        {/* Dynamic Scan Line Animation */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-amber-500 animate-[pulse_2s_infinite]"></div>
                        
                        {qrCode ? (
                            <img src={qrCode} alt="Access QR" className="w-64 h-64 mix-blend-multiply" />
                        ) : (
                            <div className="w-64 h-64 bg-gray-200 animate-pulse rounded flex items-center justify-center text-xs text-gray-500 font-mono">ENCRYPTING...</div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                             <p className="text-center font-mono text-black font-bold tracking-widest text-lg">{selectedMember?.id.toString().padStart(6, '0')}</p>
                             <div className="flex items-center text-xs font-bold text-red-600 animate-pulse">
                                 <AutoUpdateIcon className="w-3 h-3 mr-1"/>
                                 Refreshes in {qrTimer}s
                             </div>
                        </div>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-white uppercase italic">{selectedMember?.name}</h3>
                        <p className="text-green-400 font-bold uppercase tracking-widest text-sm bg-green-900/30 px-3 py-1 rounded-full inline-block mt-2">Access Granted</p>
                    </div>
                    <p className="text-gray-500 text-xs text-center max-w-xs">
                        This dynamic QR code expires every 5 seconds for security. Show at scanner or reception.
                    </p>
                </div>
            </Modal>
            
            {/* Payment Due Alert Modal */}
            <Modal isOpen={showDuePopup && !paymentSuccess} onClose={() => setShowDuePopup(false)} title="CRITICAL ALERT">
                <div className="text-center space-y-6 py-4">
                    <div className="bg-red-500/10 border-2 border-red-500 rounded-2xl p-6 relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                         <div className="flex flex-col items-center">
                             <div className="bg-red-500 rounded-full p-4 mb-4 shadow-lg shadow-red-500/50">
                                 <DollarSignIcon className="w-8 h-8 text-white" />
                             </div>
                             <h2 className="text-2xl font-black text-white uppercase italic">Membership Due</h2>
                             <p className="text-red-400 font-bold mt-1 text-sm tracking-widest">Immediate Action Required</p>
                             <div className="my-6">
                                 <p className="text-gray-400 text-xs uppercase mb-1">Total Outstanding</p>
                                 <p className="text-5xl font-black text-white tracking-tighter">₹{totalDueAmount.toLocaleString()}</p>
                             </div>
                         </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-xl inline-block shadow-2xl border-4 border-amber-500">
                        <img src={paymentQr} alt="Payment QR" className="w-48 h-48 mx-auto" />
                        <p className="text-black text-[10px] font-bold mt-2 uppercase tracking-widest">Scan with GPay / PhonePe / Paytm</p>
                    </div>

                    <div>
                        <button 
                            onClick={handleQuickPay}
                            disabled={isProcessingPayment}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center uppercase tracking-widest"
                        >
                            {isProcessingPayment ? <AutoUpdateIcon className="animate-spin w-5 h-5 mr-2" /> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                            {isProcessingPayment ? 'Processing...' : 'I Have Paid'}
                        </button>
                        <button 
                            onClick={() => setShowDuePopup(false)}
                            className="mt-4 text-xs text-gray-500 hover:text-white underline"
                        >
                            Remind Me Later
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Payment Success Overlay */}
            {paymentSuccess && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="text-center p-10">
                        <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_100px_rgba(34,197,94,0.6)] animate-bounce">
                            <CheckCircleIcon className="w-20 h-20 text-white" />
                        </div>
                        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">Payment Success!</h1>
                        <p className="text-xl text-gray-300 font-medium">Thank you for renewing your membership.</p>
                        <p className="text-green-500 font-bold mt-2 tracking-widest text-sm uppercase">Access Restored Immediately</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberPortal;
