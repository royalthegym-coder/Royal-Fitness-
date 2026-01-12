
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

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>('dark');
    const [isChatOpen, setChatOpen] = useState(false);
    
    // API Key State
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isCheckingKey, setIsCheckingKey] = useState(true);

    useEffect(() => {
        const checkKey = async () => {
            // Use type assertion to avoid conflicts with global types
            const aistudio = (window as any).aistudio;
            if (aistudio && aistudio.hasSelectedApiKey) {
                const has = await aistudio.hasSelectedApiKey();
                setHasApiKey(has);
            } else {
                // In standard environments without the wrapper, assume env vars are set manually or check process.env
                // Since we can't check process.env directly for value in frontend build securely without it being defined,
                // we default to true to let the app load, and errors will be caught by the API calls if missing.
                setHasApiKey(true);
            }
            setIsCheckingKey(false);
        };
        checkKey();
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Simulate Daily Cron Job (e.g., 5 AM check)
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

    const handleConnectKey = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
            try {
                await aistudio.openSelectKey();
                setHasApiKey(true); // Optimistic update
            } catch (error) {
                console.error("Key selection failed", error);
                setHasApiKey(false);
            }
        }
    };

    if (isCheckingKey) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (!hasApiKey) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                </div>
                
                <div className="z-10 bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-lg w-full">
                    <h1 className="text-4xl font-extrabold text-amber-500 mb-2">Royal The Gym</h1>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-8">AI Management Suite</p>
                    
                    <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                        To enable the AI Intelligence features (Gemini Models, Vision, Voice), you need to connect your Google API Key.
                    </p>
                    
                    <button
                        onClick={handleConnectKey}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl shadow-xl transition-all hover:scale-105 flex items-center justify-center text-lg mb-6"
                    >
                        <span className="mr-3 text-xl">🔑</span> Connect API Key
                    </button>
                    
                    <div className="text-sm text-gray-500 pt-6 border-t border-gray-700">
                        <p>Don't have a key?</p>
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:underline font-medium inline-flex items-center mt-1"
                        >
                            Generate one at Google AI Studio &rarr;
                        </a>
                        <p className="mt-2 text-xs text-gray-600">Please select a key from a paid GCP project for full feature access.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

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

    if (currentUser.type === 'member' && currentUser.id) {
        return (
            <Suspense fallback={<LoadingSpinner />}>
                <MemberPortal loggedInMemberId={currentUser.id} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            </Suspense>
        );
    }

    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 ${theme}`}>
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onLogout={handleLogout} userName={currentUser.name} avatar={currentUser.avatar} theme={theme} toggleTheme={toggleTheme}>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 dark:text-gray-400 focus:outline-none md:hidden">
                        <MenuIcon />
                    </button>
                </Header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                        {renderView()}
                    </Suspense>
                </main>
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
