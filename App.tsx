
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './utils/components/Sidebar';
import Header from './utils/components/Header';
import { MenuIcon } from './utils/components/icons/MenuIcon';
import LoginScreen from './utils/components/LoginScreen';
import { ChatIcon } from './utils/components/icons/ChatIcon';
import GeminiChat from './utils/components/GeminiChat';
import { View, Theme } from './types';
import { ToastProvider } from './utils/context/ToastProvider';
import { DataProvider, useData } from './utils/context/DataProvider';
import AdminGeoGuard from './utils/components/admin/AdminGeoGuard';
import SecurityShield from './utils/components/SecurityShield';
import ErrorBoundary from './utils/components/common/ErrorBoundary';
import { Crown, Sparkles, WifiOff, Zap, ShieldCheck, RefreshCw, Cpu, Activity, Infinity, Orbit } from 'lucide-react';
import MemberPortal from './utils/components/member/MemberPortal';

// --- ADMIN MODULES (Lazy Loaded with Prefetch Logic) ---
const Dashboard = React.lazy(() => import('./utils/components/Dashboard'));
const Members = React.lazy(() => import('./utils/components/Members'));
const Billing = React.lazy(() => import('./utils/components/Billing'));
const Packages = React.lazy(() => import('./utils/components/Packages'));
const RevenueOracle = React.lazy(() => import('./utils/components/admin/RevenueOracle')); 
const SecurityLayer = React.lazy(() => import('./utils/components/SecurityLayer'));
const Settings = React.lazy(() => import('./utils/components/Settings'));
const HealthEngine = React.lazy(() => import('./utils/components/HealthEngine'));
const GeminiHub = React.lazy(() => import('./utils/components/GeminiHub'));
const NeuralSystemCore = React.lazy(() => import('./utils/components/NeuralSystemCore'));
const StorkCollaboration = React.lazy(() => import('./utils/components/StorkCollaboration'));
const RoyalBotIntegrations = React.lazy(() => import('./utils/components/RoyalBotIntegrations'));
const AutoProcurement = React.lazy(() => import('./utils/components/admin/AutoProcurement'));
const CityHealthMap = React.lazy(() => import('./utils/components/admin/CityHealthMap'));
const VisualLaunch = React.lazy(() => import('./utils/components/VisualLaunch'));
const FutureOFSAdmin = React.lazy(() => import('./utils/components/admin/FutureOFSAdmin'));
const GeniusMode = React.lazy(() => import('./utils/components/GeniusMode'));
const RoyalOvermind = React.lazy(() => import('./utils/components/RoyalOvermind'));
const BioScoutBot = React.lazy(() => import('./utils/components/BioScoutBot'));
const Staff = React.lazy(() => import('./utils/components/Staff'));
const Expenses = React.lazy(() => import('./utils/components/Expenses'));
const Workouts = React.lazy(() => import('./utils/components/Workouts'));
const DietPlans = React.lazy(() => import('./utils/components/DietPlans'));
const Leads = React.lazy(() => import('./utils/components/Leads')); 
const AutomationDashboard = React.lazy(() => import('./utils/components/AutomationDashboard')); 
const SocialMediaManager = React.lazy(() => import('./utils/components/admin/SocialMediaManager')); 
const GoogleBusiness = React.lazy(() => import('./utils/components/GoogleBusiness'));
const WhatsAppIntegration = React.lazy(() => import('./utils/components/WhatsAppIntegration'));
const SocialHiveHub = React.lazy(() => import('./utils/components/SocialHiveHub'));
const RoyalSingularity = React.lazy(() => import('./utils/components/RoyalSingularity'));
const AetherOmni = React.lazy(() => import('./utils/components/AetherOmni'));
const AetherRealityHub = React.lazy(() => import('./utils/components/AetherRealityHub'));
const SynapseIoTHub = React.lazy(() => import('./utils/components/SynapseIoTHub'));
const NeuroSyncHub = React.lazy(() => import('./utils/components/NeuroSyncHub'));
const AutoUpgrader = React.lazy(() => import('./utils/components/AutoUpgrader'));
const SelfRepair = React.lazy(() => import('./utils/components/SelfRepair'));
const QuantumLedgerHub = React.lazy(() => import('./utils/components/QuantumLedgerHub'));
const DebugEngine = React.lazy(() => import('./utils/components/DebugEngine'));
const PerformanceLayer = React.lazy(() => import('./utils/components/PerformanceLayer'));
const SynthesisX = React.lazy(() => import('./utils/components/SynthesisX'));
const Tasks = React.lazy(() => import('./utils/components/Tasks'));
const AetherMedDashboard = React.lazy(() => import('./utils/components/admin/AetherMedDashboard'));
const StorkTeam = React.lazy(() => import('./utils/components/StorkCollaboration'));
const Payment = React.lazy(() => import('./utils/components/Payment'));
const AIFitnessTracker = React.lazy(() => import('./utils/components/AIFitnessTracker'));
const HormonalClock = React.lazy(() => import('./utils/components/member/HormonalClock'));
const MetabolicTracker = React.lazy(() => import('./utils/components/member/MetabolicTracker'));
const NeuroRecovery = React.lazy(() => import('./utils/components/member/NeuroRecovery'));

const NeuralBoot = ({ onComplete }: { onComplete: () => void }) => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState('Initializing Apex-Continuum v31.0 (The Singularity)...');

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(onComplete, 200); 
                    return 100;
                }
                
                if (prev > 10) setPhase('Establishing Immutable Ledger...');
                if (prev > 30) setPhase('Entangling Data Nodes...');
                if (prev > 60) setPhase('Activating Self-Evolution Engine...');
                if (prev > 90) setPhase('Sovereign Clearance Granted.');

                const inc = Math.random() * 20 + 10; 
                return Math.min(100, prev + inc);
            });
        }, 30);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="h-screen w-screen bg-[#000000] flex flex-col items-center justify-center relative overflow-hidden z-[9999]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-black to-black animate-pulse"></div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-indigo-500/10 rounded-full animate-spin-slow"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-cyan-500/10 rounded-full animate-spin-reverse-slow"></div>

            <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-10 relative group">
                    <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-[100px] opacity-60 animate-pulse"></div>
                    <Orbit className="w-32 h-32 text-white relative z-10 drop-shadow-[0_0_60px_rgba(99,102,241,0.8)] animate-spin-slow" />
                </div>
                <h1 className="text-7xl font-black text-white italic uppercase tracking-[0.2em] mb-2 leading-none">
                    Apex <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-500">Continuum</span>
                </h1>
                <p className="text-xs font-mono text-indigo-500/60 uppercase tracking-[1em] mb-12">The Singularity Update v31.0</p>
                
                <div className="w-96 h-1 bg-gray-900 rounded-full overflow-hidden relative border border-white/10">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-white to-cyan-500 transition-all duration-100 shadow-[0_0_20px_white]" style={{ width: `${progress}%` }}></div>
                </div>
                
                <div className="mt-6 flex items-center gap-4">
                    <Activity className="w-4 h-4 text-indigo-500 animate-pulse" />
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                        {phase}
                    </p>
                </div>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isBooting, setIsBooting] = useState(true);
    const [isChatOpen, setChatOpen] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    
    // Forced Dark Mode for Royal theme consistency
    const theme = 'dark';

    const { members, systemHealth, isSyncing, evolutionLevel } = useData();

    useEffect(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('royal_theme', 'dark');
    }, []);

    const handleLogin = async (identifier: string, pass: string | null, role: 'admin' | 'member', method: string) => {
        await new Promise(r => setTimeout(r, 400));
        
        if (role === 'admin') {
            if (identifier === 'admin@royal.com' || identifier === '9785300123') {
                setCurrentUser({ type: 'admin', name: 'Super Admin', avatar: 'https://i.ibb.co/6800735/Royal-The-Gym.png' });
                setCurrentView('dashboard');
                return true;
            }
        } else {
            const member = members.find(m => m.email === identifier || m.phone.slice(-10) === identifier.slice(-10));
            if (member) {
                setCurrentUser({ type: 'member', id: member.id, name: member.name, avatar: member.avatar });
                setCurrentView('dashboard');
                return true;
            }
        }
        return false;
    };

    if (isBooting) return <NeuralBoot onComplete={() => setIsBooting(false)} />;
    if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

    const renderAdminView = () => {
        const ViewComponent = (() => {
            switch (currentView) {
                case 'dashboard': return Dashboard;
                case 'members': return Members;
                case 'billing': return Billing;
                case 'packages': return Packages;
                case 'staff': return Staff;
                case 'expenses': return Expenses;
                case 'settings': return Settings;
                case 'healthEngine': return HealthEngine;
                case 'aetherMed': return AetherMedDashboard;
                case 'geniusMode': return GeniusMode;
                case 'futureOFSAdmin': return FutureOFSAdmin;
                case 'bioScout': return BioScoutBot;
                case 'synthesisX': return SynthesisX;
                case 'hormonalClock': return HormonalClock;
                case 'metabolicTracker': return MetabolicTracker;
                case 'neuroRecovery': return NeuroRecovery;
                case 'workouts': return Workouts;
                case 'diet': return DietPlans;
                case 'aiFitnessTracker': return AIFitnessTracker;
                case 'leads': return Leads;
                case 'socialManager': return SocialMediaManager;
                case 'googleBusiness': return GoogleBusiness;
                case 'whatsapp': return WhatsAppIntegration;
                case 'socialHive': return SocialHiveHub;
                case 'visualLaunch': return VisualLaunch;
                case 'cityHealthMap': return CityHealthMap;
                case 'royalOvermind': return RoyalOvermind;
                case 'revenueOracle': return RevenueOracle;
                case 'royalSingularity': return RoyalSingularity;
                case 'aetherOmni': return AetherOmni;
                case 'aetherReality': return AetherRealityHub;
                case 'synapseIoT': return SynapseIoTHub;
                case 'neuroSync': return NeuroSyncHub;
                case 'autoupgrade': return AutoUpgrader;
                case 'selfrepair': return SelfRepair;
                case 'neuralCore': return NeuralSystemCore;
                case 'geminiHub': return GeminiHub;
                case 'autoProcurement': return AutoProcurement;
                case 'quantumLedger': return QuantumLedgerHub;
                case 'security': return SecurityLayer;
                case 'debugEngine': return DebugEngine;
                case 'performance': return PerformanceLayer;
                case 'tasks': return Tasks;
                case 'storkTeam': return StorkTeam;
                case 'payment': return Payment;
                default: return Dashboard;
            }
        })();

        return (
            <Suspense fallback={
                <div className="h-full w-full flex flex-col items-center justify-center text-indigo-500 opacity-80">
                    <RefreshCw className="animate-spin w-12 h-12 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Entangling Module...</p>
                </div>
            }>
                <ViewComponent setCurrentView={setCurrentView} currentUser={currentUser} theme={theme} />
            </Suspense>
        );
    };
    
    if (currentUser.type === 'member') {
        return (
            <Suspense fallback={<div className="h-screen w-screen bg-black"></div>}>
                <MemberPortal loggedInMemberId={currentUser.id} onLogout={() => setCurrentUser(null)} theme={theme} toggleTheme={() => {}} />
            </Suspense>
        );
    }

    return (
        <div className={`h-screen w-screen flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-300 bg-black text-gray-100`}>
            <SecurityShield />
            <Header onLogout={() => setCurrentUser(null)} userName={currentUser.name} avatar={currentUser.avatar} theme={theme} toggleTheme={() => {}}>
                <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-white dark:bg-gray-900 rounded-full border border-gray-200 dark:border-white/5 shadow-inner group cursor-help" title="System Status">
                    {systemHealth === 100 ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <Activity className="w-4 h-4 text-amber-500 animate-pulse" />}
                    <span className="text-[9px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {isSyncing ? 'EVOLVING...' : `APEX v31.0 (The Singularity)`}
                    </span>
                </div>
            </Header>
            <div className="flex-1 flex overflow-hidden">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} role={currentUser.type} />
                
                <main className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 custom-scrollbar relative bg-black`}>
                    <ErrorBoundary>
                        <AdminGeoGuard>{renderAdminView()}</AdminGeoGuard>
                    </ErrorBoundary>
                </main>
            </div>

            <button 
                onClick={() => setChatOpen(true)}
                className="fixed bottom-8 right-8 md:bottom-10 md:right-10 bg-indigo-600 p-5 rounded-full shadow-[0_0_60px_rgba(79,70,229,0.6)] z-50 hover:scale-110 transition-all border-4 border-white dark:border-black group active:scale-95"
            >
                <ChatIcon className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
            </button>
            
            <GeminiChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} context={{ role: currentUser.type, memberId: currentUser.id, memberName: currentUser.name }} />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ToastProvider>
            <DataProvider>
                <ErrorBoundary>
                    <AppContent />
                </ErrorBoundary>
            </DataProvider>
        </ToastProvider>
    );
};

export default App;