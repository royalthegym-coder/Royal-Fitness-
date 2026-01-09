
import React, { useState } from 'react';
import Header from './Header';
import { INITIAL_MEMBERS, INITIAL_MEMBER_FITNESS_DATA, GYM_INFO } from '../constants';
import TodaysWorkout from './member/TodaysWorkout';
import DietPlanView from './member/DietPlanView';
import FitnessTracker from './member/FitnessTracker';
import { DietIcon, WorkoutIcon } from './icons/NavIcons';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { MemberFitnessData, WorkoutLog } from '../types';
import { FacebookIcon, InstagramIcon, TwitterIcon } from './icons/SocialIcons';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import { Theme } from '../App';
import { HealthIcon } from './icons/HealthIcons';
import MemberHealthDashboard from './member/MemberHealthDashboard';

interface MemberPortalProps {
    onLogout: () => void;
    loggedInMemberId: number;
    theme: Theme;
    toggleTheme: () => void;
}

export type MemberView = 'workout' | 'diet' | 'tracker' | 'health';

const MemberPortal: React.FC<MemberPortalProps> = ({ onLogout, loggedInMemberId, theme, toggleTheme }) => {
    const [activeView, setActiveView] = useState<MemberView>('workout');
    const [fitnessData, setFitnessData] = useState<MemberFitnessData>(INITIAL_MEMBER_FITNESS_DATA);
    const [isHealthConnected, setIsHealthConnected] = useState(false);
    const [isConnectingHealth, setIsConnectingHealth] = useState(false);

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
        // Just set the state, the child component handles the actual connection process/delay
        setIsHealthConnected(true);
    };

    const handleHealthDisconnect = () => {
        setIsHealthConnected(false);
    };


    const renderMemberView = () => {
        if (!selectedMember) return <p className="text-center text-red-400">Error: Could not load member data.</p>;

        switch (activeView) {
            case 'workout':
                // FIX: Pass fitnessData to TodaysWorkout so it has context for AI generation
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
            default:
                return <TodaysWorkout memberId={loggedInMemberId} onWorkoutComplete={handleWorkoutComplete} setActiveView={setActiveView} fitnessData={fitnessData} />;
        }
    };
    
    if (!selectedMember) {
        // Handle case where member is not found, maybe redirect to login
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white">
                <p>Could not find member information. Please log out and try again.</p>
                <button onClick={onLogout} className="ml-4 bg-amber-500 text-gray-900 p-2 rounded">Logout</button>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            <Header onLogout={onLogout} userName={selectedMember.name} avatar={selectedMember.avatar} theme={theme} toggleTheme={toggleTheme} />
             <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-amber-500 dark:text-amber-400">Member Portal</h1>
                        <p className="text-gray-500 dark:text-gray-400">Welcome back, {selectedMember?.name}!</p>
                    </div>
                    
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                            <button onClick={() => setActiveView('workout')} className={`flex items-center shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'workout' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                                <WorkoutIcon /> <span className="ml-2">Today's Workout</span>
                            </button>
                             <button onClick={() => setActiveView('diet')} className={`flex items-center shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'diet' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                                <DietIcon /> <span className="ml-2">Diet Plan</span>
                            </button>
                             <button onClick={() => setActiveView('tracker')} className={`flex items-center shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'tracker' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                                <ChartBarIcon /> <span className="ml-2">Fitness Tracker</span>
                            </button>
                            <button onClick={() => setActiveView('health')} className={`flex items-center shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeView === 'health' ? 'border-amber-500 text-amber-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                                <HealthIcon /> <span className="ml-2">Health Connect</span>
                            </button>
                        </nav>
                    </div>

                    {renderMemberView()}

                </div>
            </main>
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-4">Follow Us on Social Media</h4>
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <a href={GYM_INFO.socials.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <InstagramIcon className="w-6 h-6 mr-2" />
                            <span>Instagram</span>
                        </a>
                        <a href={GYM_INFO.socials.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <FacebookIcon className="w-6 h-6 mr-2" />
                            <span>Facebook</span>
                        </a>
                        <a href={GYM_INFO.socials.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <TwitterIcon className="w-6 h-6 mr-2 text-gray-800 dark:text-white" />
                            <span>Twitter</span>
                        </a>
                        <a href={GYM_INFO.socials.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                            <WhatsAppIcon className="w-6 h-6 mr-2 text-green-500" />
                            <span>WhatsApp Business</span>
                        </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-6">&copy; {new Date().getFullYear()} {GYM_INFO.name}. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default MemberPortal;
