
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

// Lazy load heavy components
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

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [isChatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (currentUser?.type === 'admin') {
            checkMembershipExpiryAndNotify().then(count => {
                if (count > 0) {
                    console.log(`[System] Automatically sent payment reminders to ${count} members.`);
                }
            });
        }
    }, [currentUser]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const handleLogin = (identifier: string, pass: string, role: 'admin' | 'member'): boolean => {
        if (role === 'admin') {
            const isValidAdmin = (identifier === 'admin@royal.com' || identifier === '9785300123' || identifier === '+919785300123');
            if (isValidAdmin && pass === 'admin123') {
                setCurrentUser({ type: 'admin', name: 'Admin', avatar: 'https://i.pravatar.cc/150?u=admin' });
                return true;
            }
        }
        if (role === 'member') {
            const member = INITIAL_MEMBERS.find(m => m.email === identifier || m.phone === identifier);
            if (member && pass === `${member.name.split(' ')[0].toLowerCase()}123`) {
                setCurrentUser({ type: 'member', id: member.id, name: member.name, avatar: member.avatar });
                return true;
            }
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentView('dashboard');
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
        <div 
            className={`flex h-screen text-gray-800 dark:text-gray-100 ${theme}`}
            style={{
                // Global 3D/Textured Background
                backgroundImage: theme === 'dark' 
                    ? `linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(17, 24, 39, 0.85)), url('https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=2069&auto=format&fit=crop')` 
                    : `linear-gradient(to bottom, rgba(243, 244, 246, 0.9), rgba(229, 231, 235, 0.8)), url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1975&auto=format&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden relative backdrop-blur-[2px]">
                <Header onLogout={handleLogout} userName={currentUser.name} avatar={currentUser.avatar} theme={theme} toggleTheme={toggleTheme}>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 dark:text-gray-400 focus:outline-none md:hidden">
                        <MenuIcon />
                    </button>
                </Header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
                    <Suspense fallback={<LoadingSpinner />}>
                        {renderView()}
                    </Suspense>
                </main>
            </div>
            <button
                onClick={() => setChatOpen(!isChatOpen)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 border-2 border-white/20"
                aria-label="Toggle AI Agent"
            >
                <ChatIcon />
            </button>
            <GeminiChat 
                isOpen={isChatOpen} 
                onClose={() => setChatOpen(false)} 
                context={{ 
                    role: currentUser.type, 
                    memberId: currentUser.id, 
                    memberName: currentUser.name 
                }} 
            />
        </div>
    );
};

export default App;
