
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { MenuIcon } from './icons/MenuIcon';
import LoginScreen from './LoginScreen';
import LandingPage from './LandingPage'; 
import { INITIAL_MEMBERS } from '../../constants';
import { checkMembershipExpiryAndNotify } from '../../lib/whatsapp';
import { ChatIcon } from './icons/ChatIcon';
import GeminiChat from './GeminiChat';
import { View, Theme } from '../../types';
import { ToastProvider } from '../context/ToastProvider';
import { DataProvider, useData } from '../context/DataProvider';
import AdminGeoGuard from './admin/AdminGeoGuard';

// Lazy load heavy components
const Dashboard = React.lazy(() => import('./Dashboard'));
const Members = React.lazy(() => import('./Members'));
const Packages = React.lazy(() => import('./Packages'));
const Billing = React.lazy(() => import('./Billing'));
const Workouts = React.lazy(() => import('./Workouts'));
const DietPlans = React.lazy(() => import('./DietPlans'));
const Staff = React.lazy(() => import('./Staff'));
const Expenses = React.lazy(() => import('./Expenses'));
const Settings = React.lazy(() => import('./Settings'));
const Leads = React.lazy(() => import('./Leads'));
const Memberships = React.lazy(() => import('./Memberships'));
const WhatsAppIntegration = React.lazy(() => import('./WhatsAppIntegration'));
const AutomationDashboard = React.lazy(() => import('./AutomationDashboard'));
const CRMSystem = React.lazy(() => import('./CRMSystem'));
const Payment = React.lazy(() => import('./Payment'));
const GeminiHub = React.lazy(() => import('./GeminiHub'));
const VoiceAssistant = React.lazy(() => import('./VoiceAssistant'));
const MemberPortal = React.lazy(() => import('./MemberPortal'));
const AIFitnessTracker = React.lazy(() => import('./AIFitnessTracker'));
const HealthEngine = React.lazy(() => import('./HealthEngine'));
const GeniusMode = React.lazy(() => import('./GeniusMode'));
const Tasks = React.lazy(() => import('./Tasks'));
const FuturisticFeatures = React.lazy(() => import('./FuturisticFeatures'));
const HealthIntelligence = React.lazy(() => import('./HealthIntelligence'));
const BodySimulator = React.lazy(() => import('./BodySimulator'));
const RoyalBotIntegrations = React.lazy(() => import('./RoyalBotIntegrations'));
const AutoUpgrader = React.lazy(() => import('./AutoUpgrader')); 
const SelfRepair = React.lazy(() => import('./SelfRepair')); 
const NeuralSystemCore = React.lazy(() => import('./NeuralSystemCore'));
const DebugEngine = React.lazy(() => import('./DebugEngine'));
const PerformanceLayer = React.lazy(() => import('./PerformanceLayer'));
const SecurityLayer = React.lazy(() => import('./SecurityLayer'));
const ControlPanel = React.lazy(() => import('./ControlPanel'));
const StorkCollaboration = React.lazy(() => import('./StorkCollaboration'));

interface CurrentUser {
    type: 'admin' | 'member';
    id?: number;
    name: string;
    avatar: string;
    token?: string; 
    loginMethod?: 'password' | 'otp' | 'biometric';
}

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#050505] text-amber-500">
        <div className="relative w-24 h-24">
             <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-amber-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
        <div className="mt-4 font-mono text-xs tracking-widest uppercase animate-pulse">Loading Core System...</div>
    </div>
);

const AppContent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
        try {
            const savedUser = localStorage.getItem('royal_user'); 
            if (savedUser) return JSON.parse(savedUser);
            return null;
        } catch { return null; }
    });
    
    const [showLanding, setShowLanding] = useState(!currentUser);
    const [isAtLogin, setIsAtLogin] = useState(false);
    
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [isChatOpen, setChatOpen] = useState(false);

    const { members } = useData();

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('royal_user', JSON.stringify(currentUser));
            setShowLanding(false); 
        }
    }, [currentUser]);

    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    const toggleTheme = () => {
        setTheme('dark'); 
    };

    const handleLogin = async (identifier: string, pass: string | null, role: 'admin' | 'member', method: 'password' | 'otp' | 'biometric'): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 500));

        let user: CurrentUser | null = null;

        if (role === 'admin') {
            const authorizedAdmins = ['admin@royal.com', '9785300123', '+919785300123', 'admin'];
            if (authorizedAdmins.includes(identifier)) {
                if (method === 'otp' || (method === 'password' && (pass === 'admin123' || pass === ''))) {
                    user = { 
                        type: 'admin', 
                        name: 'Super Admin', 
                        avatar: 'https://i.pravatar.cc/150?u=admin',
                        token: 'admin-jwt-token-' + Date.now(),
                        loginMethod: method
                    };
                }
            }
        }

        if (role === 'member') {
            const member = members.find(m => 
                m.email.toLowerCase() === identifier.toLowerCase() || 
                m.phone.replace(/\D/g,'').slice(-10) === identifier.replace(/\D/g,'').slice(-10)
            );

            if (member) {
                if (method === 'biometric' || method === 'otp' || (method === 'password' && pass === `${member.name.split(' ')[0].toLowerCase()}123`)) {
                     user = { 
                         type: 'member', 
                         id: member.id, 
                         name: member.name, 
                         avatar: member.avatar,
                         token: 'member-jwt-token-' + Date.now(),
                         loginMethod: method
                     };
                }
            }
        }

        if (user) {
            localStorage.setItem('token', user.token || '');
            localStorage.setItem('userRole', user.type);
            
            setCurrentUser(user);
            setShowLanding(false);
            
            if (user.type === 'admin') {
                setCurrentView('dashboard');
            }
            return true;
        }

        return false;
    };

    const handleLogout = () => {
        sessionStorage.clear();
        localStorage.removeItem('token');     
        localStorage.removeItem('userRole');  
        localStorage.removeItem('royal_user'); 
        
        setChatOpen(false);
        setIsAtLogin(false);
        setShowLanding(true); 
        setCurrentView('dashboard');
        setCurrentUser(null);
    };

    const renderView = () => {
        const view = (() => {
            switch (currentView) {
                case 'dashboard': return <Dashboard setCurrentView={setCurrentView} />;
                case 'controlPanel': return <ControlPanel />;
                case 'royalBots': return <RoyalBotIntegrations />;
                case 'healthIntelligence': return <HealthIntelligence />;
                case 'tasks': return <Tasks />;
                case 'packages': return <Packages />;
                case 'members': return <Members />;
                case 'stork': return <StorkCollaboration />;
                case 'billing': return <Billing setCurrentView={setCurrentView} />;
                case 'payment': return <Payment />;
                case 'memberships': return <Memberships />;
                case 'leads': return <Leads />;
                case 'crm': return <CRMSystem />;
                case 'workouts': return <Workouts />;
                case 'diet': return <DietPlans />;
                case 'staff': return <Staff />;
                case 'expenses': return <Expenses />;
                case 'settings': return <Settings setCurrentView={setCurrentView} theme={theme} toggleTheme={toggleTheme} currentUser={currentUser} />;
                case 'whatsapp': return <WhatsAppIntegration />;
                case 'automation': return <AutomationDashboard />;
                case 'geminiHub': return <GeminiHub />;
                case 'voiceAssistant': return <VoiceAssistant setCurrentView={setCurrentView} />;
                case 'aiTracker': return <AIFitnessTracker />;
                case 'healthEngine': return <HealthEngine />;
                case 'geniusMode': return <GeniusMode />;
                case 'futureOps': return <FuturisticFeatures />;
                case 'simulator': return <BodySimulator />;
                case 'autoUpgrader': return <AutoUpgrader />;
                case 'selfRepair': return <SelfRepair />;
                case 'neuralCore': return <NeuralSystemCore />;
                case 'debugEngine': return <DebugEngine />;
                case 'performance': return <PerformanceLayer />;
                case 'security': return <SecurityLayer />;
                default: return <Dashboard setCurrentView={setCurrentView} />;
            }
        })();

        const geoProtectedViews = ['dashboard', 'controlPanel', 'billing', 'payment', 'staff', 'expenses', 'neuralCore'];
        if (currentUser?.type === 'admin' && geoProtectedViews.includes(currentView)) {
            return <AdminGeoGuard>{view}</AdminGeoGuard>;
        }
        return view;
    };

    if (!currentUser) {
        if (showLanding && !isAtLogin) {
            return (
                <Suspense fallback={<LoadingSpinner />}>
                    <LandingPage onEnter={() => setIsAtLogin(true)} />
                </Suspense>
            );
        }
        return (
            <React.Suspense fallback={<LoadingSpinner />}>
                <LoginScreen onLogin={handleLogin} onBack={() => { setIsAtLogin(false); setShowLanding(true); }} /> 
            </React.Suspense>
        ); 
    }

    if (currentUser.type === 'member' && currentUser.id) {
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <MemberPortal loggedInMemberId={currentUser.id} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            </Suspense>
        );
    }

    return (
        <div className={`h-screen w-screen font-sans text-gray-100 bg-[#050505] overflow-hidden`}>
             <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-900/5 blur-[100px] rounded-full mix-blend-screen"></div>
            </div>

            <div className="relative z-10 flex h-full w-full">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
                <div className="flex-1 flex flex-col h-screen">
                    <Header onLogout={handleLogout} userName={currentUser.name} avatar={currentUser.avatar} theme={theme} toggleTheme={toggleTheme}>
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-400 focus:outline-none md:hidden">
                            <MenuIcon />
                        </button>
                    </Header>
                    <main className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 backdrop-blur-sm">
                        <div className="p-4 sm:p-6">
                            <Suspense fallback={<div className="h-[calc(100vh-150px)] flex items-center justify-center"><LoadingSpinner /></div>}>
                                {renderView()}
                            </Suspense>
                        </div>
                    </main>
                </div>
            </div>

            <button
                onClick={() => setChatOpen(!isChatOpen)}
                className="fixed bottom-6 right-6 bg-amber-500 text-gray-900 p-4 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:bg-amber-400 focus:outline-none z-50 transform hover:scale-110 transition-all group"
                aria-label="Toggle AI Agent"
            >
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20"></div>
                <ChatIcon />
                <span className="absolute right-full mr-4 bg-gray-900 text-white text-xs px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold">
                    Gemini Agent
                </span>
            </button>
            
            <GeminiChat 
                isOpen={isChatOpen} 
                onClose={() => setChatOpen(false)} 
                onNavigate={(view) => setCurrentView(view as View)}
                context={{ 
                    role: currentUser.type, 
                    memberId: currentUser.id, 
                    memberName: currentUser.name 
                }} 
            />
        </div>
    );
};

const App: React.FC = () => (
    <ToastProvider>
        <DataProvider>
            <AppContent />
        </DataProvider>
    </ToastProvider>
);

export default App;
