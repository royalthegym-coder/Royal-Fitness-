
import React, { useState } from 'react';
import Header from './Header';
import { INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA } from '../../constants';
import TodaysWorkout from './member/TodaysWorkout';
import DietPlanView from './member/DietPlanView';
import FitnessTracker from './member/FitnessTracker';
import { MemberFitnessData, WorkoutLog } from '../../types';
import { Theme } from '../../types';
import MemberHealthDashboard from './member/MemberHealthDashboard';
import FuturisticFeatures from './FuturisticFeatures';
import BodySimulator from './BodySimulator';
import GamificationDashboard from './member/GamificationDashboard';
import SmartWatch from './member/SmartWatch';
import Sidebar from './Sidebar';
import { MenuIcon } from './icons/MenuIcon';
import GeminiChat from './GeminiChat';
import { ChatIcon } from './icons/ChatIcon';

interface MemberPortalProps {
    onLogout: () => void;
    loggedInMemberId: number;
    theme: Theme;
    toggleTheme: () => void;
}

export type MemberView = 'workout' | 'diet' | 'tracker' | 'health' | 'ai_tools' | 'simulator' | 'achievements' | 'smartwatch';

const MemberPortal: React.FC<MemberPortalProps> = ({ onLogout, loggedInMemberId, theme, toggleTheme }) => {
    const [activeView, setActiveView] = useState<MemberView>('workout');
    const [fitnessData, setFitnessData] = useState<MemberFitnessData>(INITIAL_MEMBER_FITNESS_DATA);
    const [isHealthConnected, setIsHealthConnected] = useState(false);
    const [isConnectingHealth, setIsConnectingHealth] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isChatOpen, setChatOpen] = useState(false);

    const selectedMember = INITIAL_MEMBERS.find(m => m.id === loggedInMemberId);

    const handleWorkoutComplete = (log: WorkoutLog) => {
        setFitnessData(prevData => {
            const currentMemberData = prevData[loggedInMemberId] || { logs: [], metrics: [] };
            return {
                ...prevData,
                [loggedInMemberId]: {
                    ...currentMemberData,
                    logs: [...currentMemberData.logs, log],
                },
            };
        });
    };
    
    const handleHealthConnect = () => {
        setIsHealthConnected(true);
    };

    const handleHealthDisconnect = () => {
        setIsHealthConnected(false);
    };


    const renderMemberView = () => {
        if (!selectedMember) return <p className="text-center text-red-400">Error: Could not load member data.</p>;

        switch (activeView) {
            case 'workout':
                return <TodaysWorkout memberId={loggedInMemberId} onWorkoutComplete={handleWorkoutComplete} setActiveView={setActiveView} fitnessData={fitnessData} />;
            case 'diet':
                return <DietPlanView memberId={loggedInMemberId} />;
            case 'tracker':
                return <FitnessTracker memberId={loggedInMemberId} fitnessData={fitnessData} setFitnessData={setFitnessData} />;
            case 'health':
                return <MemberHealthDashboard 
                    isConnected={isHealthConnected} 
                    isConnecting={isConnectingHealth} 
                    onConnect={handleHealthConnect}
                    onDisconnect={handleHealthDisconnect}
                />;
            case 'ai_tools':
                return <FuturisticFeatures />;
            case 'simulator':
                return <BodySimulator />;
            case 'achievements':
                return <GamificationDashboard memberId={loggedInMemberId} />;
            case 'smartwatch':
                return <SmartWatch />;
            default:
                return <TodaysWorkout memberId={loggedInMemberId} onWorkoutComplete={handleWorkoutComplete} setActiveView={setActiveView} fitnessData={fitnessData} />;
        }
    };
    
    if (!selectedMember) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
                <p>Could not find member information. Please log out and try again.</p>
                <button onClick={onLogout} className="ml-4 bg-amber-500 text-gray-900 p-2 rounded">Logout</button>
            </div>
        );
    }
    
    return (
        <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 ${theme}`}>
            <Sidebar 
                currentView={activeView} 
                setCurrentView={(view) => setActiveView(view as MemberView)} 
                isOpen={isSidebarOpen} 
                setIsOpen={setSidebarOpen} 
                role="member"
            />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header onLogout={onLogout} userName={selectedMember.name} avatar={selectedMember.avatar} theme={theme} toggleTheme={toggleTheme}>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 dark:text-gray-400 focus:outline-none md:hidden mr-4">
                        <MenuIcon />
                    </button>
                </Header>
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400">Member Portal</h1>
                                <p className="text-gray-500 dark:text-gray-400">Welcome back, {selectedMember?.name}!</p>
                            </div>
                            <div className="mt-4 md:mt-0 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                                Status: <span className="font-bold text-green-500">Active</span>
                            </div>
                        </div>
                        
                        {renderMemberView()}
                    </div>
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
                    role: 'member',
                    memberId: loggedInMemberId,
                    memberName: selectedMember.name
                }}
            />
        </div>
    );
};

export default MemberPortal;
