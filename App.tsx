
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Packages from './components/Packages';
import Billing from './components/Billing';
import Workouts from './components/Workouts';
import DietPlans from './components/DietPlans';
import Staff from './components/Staff';
import Expenses from './components/Expenses';
import Settings from './components/Settings';
import Leads from './components/Leads';
import Memberships from './components/Memberships';
import Header from './components/Header';
import { MenuIcon } from './components/icons/MenuIcon';
import WhatsAppIntegration from './components/WhatsAppIntegration';
import Payment from './components/Payment';
import GeminiHub from './components/GeminiHub';
import VoiceAssistant from './components/VoiceAssistant';
import GeminiChat from './components/GeminiChat';
import { ChatIcon } from './components/icons/ChatIcon';
import MemberPortal from './components/MemberPortal';
import LoginScreen from './components/LoginScreen';
import { INITIAL_MEMBERS } from './constants';
import AIFitnessTracker from './components/AIFitnessTracker';
import HealthEngine from './components/HealthEngine';
import GeniusMode from './components/GeniusMode';
import Tasks from './components/Tasks';
import FuturisticFeatures from './components/FuturisticFeatures';
import HealthIntelligence from './components/HealthIntelligence';
import { checkMembershipExpiryAndNotify } from './lib/whatsapp';

export type View = 'dashboard' | 'packages' | 'members' | 'billing' | 'payment' | 'memberships' | 'leads' | 'workouts' | 'diet' | 'staff' | 'expenses' | 'settings' | 'whatsapp' | 'geminiHub' | 'voiceAssistant' | 'aiTracker' | 'healthEngine' | 'geniusMode' | 'tasks' | 'futureOps' | 'healthIntelligence';

export type Theme = 'light' | 'dark';

interface CurrentUser {
    type: 'admin' | 'member';
    id?: number;
    name: string;
    avatar: string;
}

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

    // Simulate Daily Cron Job (e.g., 5 AM check)
    useEffect(() => {
        // In a real app, this would be a backend cron job.
        // Here, we simulate it running once when the admin app loads.
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

    const handleLogin = (email: string, pass: string, role: 'admin' | 'member'): boolean => {
        if (role === 'admin' && email === 'admin@royal.com' && pass === 'admin123') {
            setCurrentUser({ type: 'admin', name: 'Admin', avatar: 'https://i.pravatar.cc/150?u=admin' });
            return true;
        }
        if (role === 'member') {
            const member = INITIAL_MEMBERS.find(m => m.email === email);
            // In a real app, you'd check a hashed password. This is just for the demo.
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
            case 'healthIntelligence': return <HealthIntelligence />;
            case 'tasks': return <Tasks />;
            case 'packages': return <Packages />;
            case 'members': return <Members />;
            case 'billing': return <Billing setCurrentView={setCurrentView} />;
            case 'payment': return <Payment />;
            case 'memberships': return <Memberships />;
            case 'leads': return <Leads />;
            case 'workouts': return <Workouts />;
            case 'diet': return <DietPlans />;
            case 'staff': return <Staff />;
            case 'expenses': return <Expenses />;
            case 'settings': return <Settings setCurrentView={setCurrentView} />;
            case 'whatsapp': return <WhatsAppIntegration />;
            case 'geminiHub': return <GeminiHub />;
            case 'voiceAssistant': return <VoiceAssistant setCurrentView={setCurrentView} />;
            case 'aiTracker': return <AIFitnessTracker />;
            case 'healthEngine': return <HealthEngine />;
            case 'geniusMode': return <GeniusMode />;
            case 'futureOps': return <FuturisticFeatures />;
            default: return <Dashboard setCurrentView={setCurrentView} />;
        }
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    if (currentUser.type === 'member' && currentUser.id) {
        return <MemberPortal loggedInMemberId={currentUser.id} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />;
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
                    {renderView()}
                </main>
            </div>
            <button
                onClick={() => setChatOpen(!isChatOpen)}
                className="fixed bottom-6 right-6 bg-amber-500 text-gray-900 p-4 rounded-full shadow-lg hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 z-50"
                aria-label="Toggle AI Assistant"
            >
                <ChatIcon />
            </button>
            <GeminiChat isOpen={isChatOpen} onClose={() => setChatOpen(false)} />
        </div>
    );
};

export default App;
