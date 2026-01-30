
import React, { useState, useEffect } from 'react';
import Header from '../Header';
import { INITIAL_MEMBERS, INITIAL_HEALTH_DATA, GYM_INFO, INITIAL_MEMBER_FITNESS_DATA } from '../../constants';
import TodaysWorkout from './TodaysWorkout';
import DietPlanView from './DietPlanView';
import FitnessTracker from './FitnessTracker';
import MemberHealthDashboard from './MemberHealthDashboard';
import BodySimulator from '../BodySimulator';
import SmartWatch from './SmartWatch';
import Sidebar from '../Sidebar';
import GeminiChat from '../GeminiChat';
import MemberPayments from './MemberPayments';
import AutoAttendance from './AutoAttendance';
import SmartScheduler from './SmartScheduler';
import { useData } from '../../context/DataProvider';
import { MemberView, Theme, HealthData } from '../../../types';
import { QrCodeIcon } from '../icons/QrCodeIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { FingerPrintIcon } from '../icons/FingerPrintIcon';
import { TimeQuestIcon } from '../icons/TimeQuestIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { MenuIcon } from '../icons/MenuIcon';
import { ChatIcon } from '../icons/ChatIcon';
import Card from '../common/Card';
import Modal from '../common/Modal';
import { toDataURL } from 'qrcode';

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
    
    // Digital ID State
    const [isIdCardOpen, setIsIdCardOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [qrTimer, setQrTimer] = useState(10);

    const selectedMember = INITIAL_MEMBERS.find(m => m.id === loggedInMemberId);

    // Dynamic QR Generator
    useEffect(() => {
        if (!selectedMember || !isIdCardOpen) return;
        const generate = () => {
            const token = btoa(`${selectedMember.id}-${Date.now()}`);
            toDataURL(token, { width: 256, margin: 1 }).then(setQrCode);
            setQrTimer(10);
        };
        generate();
        const interval = setInterval(() => {
            setQrTimer(t => {
                if (t <= 1) { generate(); return 10; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [selectedMember, isIdCardOpen]);

    const renderMemberView = () => {
        switch (activeView) {
            case 'dashboard': return (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-gradient-to-r from-amber-600 to-red-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-xs font-bold uppercase opacity-80 mb-1 tracking-widest">Royal Access Active</p>
                            <h2 className="text-4xl font-black italic uppercase tracking-tighter">{selectedMember?.name}</h2>
                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setIsIdCardOpen(true)} className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold uppercase flex items-center gap-2 hover:bg-amber-100 transition-all">
                                    <QrCodeIcon className="w-4 h-4" /> Digital ID
                                </button>
                                <div className="bg-black/30 border border-white/20 px-6 py-2 rounded-full text-xs font-bold uppercase">
                                    Status: {selectedMember?.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card onClick={() => setActiveView('attendance')} className="bg-gray-800 hover:border-amber-500 cursor-pointer group text-center py-6">
                            <FingerPrintIcon className="w-10 h-10 mx-auto mb-3 text-amber-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-bold uppercase">Auto Check-in</h3>
                        </Card>
                        <Card onClick={() => setActiveView('workout')} className="bg-gray-800 hover:border-blue-500 cursor-pointer group text-center py-6">
                            <SparkleIcon className="w-10 h-10 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-bold uppercase">Mission Plan</h3>
                        </Card>
                        <Card onClick={() => setActiveView('scheduler')} className="bg-gray-800 hover:border-purple-500 cursor-pointer group text-center py-6">
                            <TimeQuestIcon className="w-10 h-10 mx-auto mb-3 text-purple-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-bold uppercase">Quest Log</h3>
                        </Card>
                        <Card onClick={() => setActiveView('payments')} className="bg-gray-800 hover:border-green-500 cursor-pointer group text-center py-6">
                            <DollarSignIcon className="w-10 h-10 mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
                            <h3 className="text-sm font-bold uppercase">Treasury</h3>
                        </Card>
                    </div>
                    
                    <Card title="Live Bio-Telemetry" className="border-t-4 border-red-500 bg-gray-900">
                         <MemberHealthDashboard isConnected={true} isConnecting={false} onConnect={() => {}} healthData={healthData} setHealthData={setHealthData} />
                    </Card>
                </div>
            );
            case 'workout': return <TodaysWorkout memberId={loggedInMemberId} onWorkoutComplete={() => {}} setActiveView={setActiveView} fitnessData={INITIAL_MEMBER_FITNESS_DATA} healthData={healthData} />;
            case 'diet': return <DietPlanView memberId={loggedInMemberId} healthData={healthData} />;
            case 'health': return <MemberHealthDashboard isConnected={true} isConnecting={false} onConnect={() => {}} healthData={healthData} setHealthData={setHealthData} />;
            case 'simulator': return <BodySimulator />;
            case 'payments': return <MemberPayments memberId={loggedInMemberId} />;
            case 'attendance': return <AutoAttendance />;
            case 'scheduler': return <SmartScheduler memberName={selectedMember?.name || 'Member'} phone={selectedMember?.phone || ''} />;
            default: return null;
        }
    };

    return (
        <div className="h-screen w-screen flex bg-[#050505] text-gray-100 overflow-hidden font-sans">
            <Sidebar currentView={activeView} setCurrentView={(v) => setActiveView(v as MemberView)} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} role="member" />
            
            <div className="flex-1 flex flex-col relative">
                <Header onLogout={onLogout} userName={selectedMember?.name || ''} avatar={selectedMember?.avatar || ''} theme={theme} toggleTheme={toggleTheme}>
                    <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-gray-400"><MenuIcon /></button>
                </Header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8">
                        {renderMemberView()}
                    </div>
                </main>

                <button
                    onClick={() => setChatOpen(!isChatOpen)}
                    className="fixed bottom-8 right-8 bg-amber-500 text-black p-5 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-110 transition-transform z-50 group"
                >
                    <ChatIcon className="w-8 h-8" />
                    <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">Royal Assistant</span>
                </button>
            </div>

            <GeminiChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} context={{ role: 'member', memberId: loggedInMemberId, memberName: selectedMember?.name }} />

            <Modal isOpen={isIdCardOpen} onClose={() => setIsIdCardOpen(false)} title="Digital Bio-Identity">
                <div className="flex flex-col items-center py-6 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-amber-500 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                        {qrCode ? <img src={qrCode} alt="Access QR" className="w-64 h-64" /> : <div className="w-64 h-64 bg-gray-200 animate-pulse rounded"></div>}
                        <p className="text-center font-mono text-black font-bold mt-2 text-xs">REFRESHING IN {qrTimer}S</p>
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-white uppercase italic">{selectedMember?.name}</h3>
                        <p className="text-green-400 font-bold uppercase tracking-widest text-sm mt-1">Access Granted</p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MemberPortal;
