
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './utils/components/Sidebar';
import Header from './utils/components/Header';
import { MenuIcon } from './utils/components/icons/MenuIcon';
import LoginScreen from './utils/components/LoginScreen';
import { INITIAL_MEMBERS } from './constants';
import { checkMembershipExpiryAndNotify } from './lib/whatsapp';
import { ChatIcon } from './utils/components/icons/ChatIcon';
import GeminiChat from './utils/components/GeminiChat';
import { View, Theme } from './types';
import { ToastProvider } from './utils/context/ToastProvider';
import { DataProvider, useData } from './utils/context/DataProvider'; // Import DataProvider

// Lazy load heavy components to improve initial load speed and performance
const Dashboard = React.lazy(() => import('./utils/components/Dashboard'));
const Members = React.lazy(() => import('./utils/components/Members'));
const Packages = React.lazy(() => import('./utils/components/Packages'));
const Billing = React.lazy(() => import('./utils/components/Billing'));
const Workouts = React.lazy(() => import('./utils/components/Workouts'));
const DietPlans = React.lazy(() => import('./utils/components/DietPlans'));
const Staff = React.lazy(() => import('./utils/components/Staff'));
const Expenses = React.lazy(() => import('./utils/components/Expenses'));
const Settings = React.lazy(() => import('./utils/components/Settings'));
const Leads = React.lazy(() => import('./utils/components/Leads'));
const Memberships = React.lazy(() => import('./utils/components/Memberships'));
const WhatsAppIntegration = React.lazy(() => import('./utils/components/WhatsAppIntegration'));
const AutomationDashboard = React.lazy(() => import('./utils/components/AutomationDashboard'));
const CRMSystem = React.lazy(() => import('./utils/components/CRMSystem'));
const Payment = React.lazy(() => import('./utils/components/Payment'));
const GeminiHub = React.lazy(() => import('./utils/components/GeminiHub'));
const VoiceAssistant = React.lazy(() => import('./utils/components/VoiceAssistant'));
const MemberPortal = React.lazy(() => import('./utils/components/MemberPortal'));
const AIFitnessTracker = React.lazy(() => import('./utils/components/AIFitnessTracker'));
const HealthEngine = React.lazy(() => import('./utils/components/HealthEngine'));
const GeniusMode = React.lazy(() => import('./utils/components/GeniusMode'));
const Tasks = React.lazy(() => import('./utils/components/Tasks'));
const FuturisticFeatures = React.lazy(() => import('./utils/components/FuturisticFeatures'));
const HealthIntelligence = React.lazy(() => import('./utils/components/HealthIntelligence'));
const BodySimulator = React.lazy(() => import('./utils/components/BodySimulator'));
const RoyalBotIntegrations = React.lazy(() => import('./utils/components/RoyalBotIntegrations'));
const AutoUpgrader = React.lazy(() => import('./utils/components/AutoUpgrader'));
const SelfRepair = React.lazy(() => import('./utils/components/SelfRepair'));
const NeuralSystemCore = React.lazy(() => import('./utils/components/NeuralSystemCore'));
const DebugEngine = React.lazy(() => import('./utils/components/DebugEngine'));
const PerformanceLayer = React.lazy(() => import('./utils/components/PerformanceLayer'));
const SecurityLayer = React.lazy(() => import('./utils/components/SecurityLayer'));
const ControlPanel = React.lazy(() => import('./utils/components/ControlPanel'));

interface CurrentUser {
    type: 'admin' | 'member';
    id?: number;
    name: string;
    avatar: string;
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
    </div>
);

// Inner Component to use Data Hook if needed, or just keep structure clean
const AppContent: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [isChatOpen, setChatOpen] = useState(false);

    // Get Data from Context (Example: Ensure members are loaded for login check)
    const { members } = useData();

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleLogin = (identifier: string, pass: string | null, role: 'admin' | 'member', method: 'password' | 'otp'): boolean => {
        // --- ADMIN LOGIN ---
        if (role === 'admin') {
            const authorizedAdmins = ['admin@royal.com', '9785300123', '+919785300123'];
            const isAuthorized = authorizedAdmins.includes(identifier);

            if (!isAuthorized) return false;

            if (method === 'otp' || (method === 'password' && pass === 'admin123')) {
                setCurrentUser({ type: 'admin', name: 'Super Admin', avatar: 'https://i.pravatar.cc/150?u=admin' });
                return true;
            }
        }

        // --- MEMBER LOGIN ---
        if (role === 'member') {
            // Use 'members' from Context instead of static constant
            const member = members.find(m => 
                m.email.toLowerCase() === identifier.toLowerCase() || 
                m.phone.replace(/\D/g,'').slice(-10) === identifier.replace(/\D/g,'').slice(-10)
            );

            if (!member) return false;

            if (method === 'otp') {
                 setCurrentUser({ type: 'member', id: member.id, name: member.name, avatar: member.avatar });
                 return true;
            }

            if (method === 'password') {
                const expectedPass = `${member.name.split(' ')[0].toLowerCase()}123`;
                if (pass === expectedPass) {
                    setCurrentUser({ type: 'member', id: member.id, name: member.name, avatar: member.avatar });
                    return true;
                }
            }
        }

        return false;
    };

    const handleLogout = () => {
        sessionStorage.clear();
        setChatOpen(false);
        setCurrentView('dashboard');
        setCurrentUser(null);
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard setCurrentView={setCurrentView} />;
            case 'controlPanel': return <ControlPanel />;
            case 'royalBots': return <RoyalBotIntegrations />;
            case 'healthIntelligence': return <HealthIntelligence />;
            case 'tasks': return <Tasks />;
            case 'packages': return <Packages />;
            case 'members': return <Members />;
            case 'billing': return <Billing setCurrentView={setCurrentView} />;
            case 'payment': return <Payment />;
            case 'memberships': return <Memberships />;
            case 'leads': return <Leads />;
            case 'crm': return <CRMSystem />;
            case 'workouts': return <Workouts />;
            case 'diet': return <DietPlans />;
            case 'staff': return <Staff />;
            case 'expenses': return <Expenses />;
            case 'settings': return <Settings setCurrentView={setCurrentView} />;
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
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    if (currentUser.type === 'member' && currentUser.id) {
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <MemberPortal loggedInMemberId={currentUser.id} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            </Suspense>
        );
    }

    return (
        <div className={`h-screen w-screen font-sans text-gray-800 dark:text-gray-100 ${theme}`}>
             <div className="absolute inset-0 z-0 pointer-events-none">
                <img src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2070&auto=format&fit=crop" alt="Gym background" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"></div>
            </div>

            <div className="relative z-10 flex h-full w-full">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
                <div className="flex-1 flex flex-col h-screen">
                    <Header onLogout={handleLogout} userName={currentUser.name} avatar={currentUser.avatar} theme={theme} toggleTheme={toggleTheme}>
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 dark:text-gray-400 focus:outline-none md:hidden">
                            <MenuIcon />
                        </button>
                    </Header>
                    <main className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            <Suspense fallback={<div className="h-[calc(100vh-150px)] flex items-center justify-center"><LoadingSpinner /></div>}>
                                {renderView()}
                            </Suspense>
                        </div>
                    </main>
                </div>
            </div>

            <button
                onClick={() => setChatOpen(!isChatOpen)}
                className="fixed bottom-6 right-6 bg-amber-500 text-gray-900 p-4 rounded-full shadow-lg hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 z-50 transform hover:scale-110 transition-transform"
                aria-label="Toggle AI Agent"
            >
                <ChatIcon />
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
