
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-green-500';
            case 'Expired': return 'text-red-500';
            case 'Inactive': return 'text-yellow-500';
            default: return 'text-gray-500';
        }
    };

    const getStatusDotColor = (status: string) => {
        switch (status) {
            case 'Active': return 'bg-green-500';
            case 'Expired': return 'bg-red-500';
            case 'Inactive': return 'bg-yellow-500';
            default: return 'bg-gray-500';
        }
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
        <div 
            className={`flex h-screen text-gray-800 dark:text-gray-100 ${theme}`}
            style={{
                // Match the main App.tsx wallpaper style for consistency
                backgroundImage: theme === 'dark' 
                    ? `linear-gradient(to bottom right, rgba(17, 24, 39, 0.85), rgba(0, 0, 0, 0.9)), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')` 
                    : `linear-gradient(to bottom right, rgba(255, 255, 255, 0.85), rgba(243, 244, 246, 0.85)), url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1975&auto=format&fit=crop')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}
        >
            <Sidebar 
                currentView={activeView} 
                setCurrentView={(view) => setActiveView(view as MemberView)} 
                isOpen={isSidebarOpen} 
                setIsOpen={setSidebarOpen} 
                role="member"
            />
            
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header onLogout={onLogout} userName={selectedMember.name} avatar={selectedMember.avatar} theme={theme} toggleTheme={toggleTheme}>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-500 dark:text-gray-400 focus:outline-none md:hidden mr-4">
                        <MenuIcon />
                    </button>
                </Header>
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between bg-white/10 dark:bg-black/30 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                            <div>
                                <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400 drop-shadow-sm">Member Portal</h1>
                                <p className="text-gray-600 dark:text-gray-300">Welcome back, {selectedMember?.name}!</p>
                            </div>
                            <div className="mt-4 md:mt-0 px-4 py-2 bg-white/50 dark:bg-gray-800/80 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center shadow-lg">
                                <span className="mr-2 opacity-80">Membership Status:</span>
                                <span className={`font-bold flex items-center ${getStatusColor(selectedMember.status)}`}>
                                    <span className={`w-2