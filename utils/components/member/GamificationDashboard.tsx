
import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { Badge, Challenge, MemberFitnessData } from '../../../types';
import { INITIAL_MEMBER_FITNESS_DATA, INITIAL_MEMBERS } from '../../../constants';
import { generateGamifiedChallenge } from '../../../lib/gemini';
import { TrophyIcon } from '../icons/TrophyIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AwardIcon } from '../icons/AwardIcon';
import { UserGroupIcon } from '../icons/UserGroupIcon';

interface GamificationDashboardProps {
    memberId: number;
}

// Initial Mock Badges
const INITIAL_BADGES: Badge[] = [
    { id: '1', name: 'Early Bird', description: 'Log a workout before 7 AM.', icon: '🌅', category: 'Consistency', isEarned: true, earnedDate: '2024-07-10' },
    { id: '2', name: 'Consistency King', description: 'Log 3 workouts in a week.', icon: '👑', category: 'Consistency', isEarned: true, earnedDate: '2024-07-25' },
    { id: '3', name: 'Heavy Lifter', description: 'Bench press bodyweight.', icon: '🏋️', category: 'Strength', isEarned: false },
    { id: '4', name: 'Cardio Bunny', description: 'Burn 500 calories in one session.', icon: '🐰', category: 'Cardio', isEarned: false },
    { id: '5', name: 'Century Club', description: 'Log 100 total workouts.', icon: '💯', category: 'Milestone', isEarned: false },
    { id: '6', name: 'Streak Master', description: '10 day login streak.', icon: '🔥', category: 'Consistency', isEarned: true, earnedDate: '2024-08-01' },
];

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({ memberId }) => {
    // State
    const [activeTab, setActiveTab] = useState<'me' | 'leaderboard'>('me');
    const [xp, setXp] = useState(1250);
    const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
    const [challenges, setChallenges] = useState<Challenge[]>([
        { id: 'c1', title: 'Warmup Warrior', description: 'Complete a 10-min warmup.', xpReward: 50, difficulty: 'Easy', isCompleted: false },
    ]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Leaderboard Mock Data
    const leaderboardData = [
        { rank: 1, name: 'Vikram Mehta', xp: 2450, avatar: 'https://picsum.photos/seed/vikram/200' },
        { rank: 2, name: 'Priya Patel', xp: 2100, avatar: 'https://picsum.photos/seed/priya/200' },
        { rank: 3, name: 'You', xp: 1250, avatar: 'https://picsum.photos/seed/aarav/200', isMe: true }, // Dynamic based on props usually
        { rank: 4, name: 'Anika Singh', xp: 980, avatar: 'https://picsum.photos/seed/anika/200' },
        { rank: 5, name: 'Rohan Kumar', xp: 450, avatar: 'https://picsum.photos/seed/rohan/200' },
    ];

    // Derived State
    const level = Math.floor(xp / 1000) + 1;
    const nextLevelXp = level * 1000;
    const progressPercent = ((xp % 1000) / 1000) * 100;

    const memberData = useMemo(() => {
        return INITIAL_MEMBER_FITNESS_DATA[memberId] || { logs: [], metrics: [] };
    }, [memberId]);

    // Handlers
    const handleGenerateChallenge = async () => {
        setIsGenerating(true);
        try {
            const newChallenge = await generateGamifiedChallenge(memberData.logs);
            setChallenges(prev => [newChallenge, ...prev]);
        } catch (error) {
            console.error("Failed to generate challenge", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCompleteChallenge = (id: string, reward: number) => {
        setChallenges(prev => prev.map(c => c.id === id ? { ...c, isCompleted: true } : c));
        setXp(prev => prev + reward);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <AwardIcon className="w-8 h-8 mr-3" />
                    Achievements & Rewards
                </h1>
                
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('me')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'me' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Stats
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'leaderboard' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
                    >
                        Leaderboard
                    </button>
                </div>
            </div>

            {/* Level Progress Section (Always Visible) */}
            <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-amber-500/50 relative overflow-hidden mb-6">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrophyIcon className="w-32 h-32" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-shrink-0 relative">
                        <div className="w-24 h-24 rounded-full border-4 border-amber-500 flex items-center justify-center bg-gray-900 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                            <span className="text-4xl font-black text-white">{level}</span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                            LEVEL
                        </div>
                    </div>
                    <div className="flex-grow w-full">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-gray-300 font-semibold">Experience Points</span>
                            <span className="text-amber-400 font-mono font-bold">{xp} / {nextLevelXp} XP</span>
                        </div>
                        <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                            <div 
                                className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-1000 ease-out relative" 
                                style={{ width: `${progressPercent}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-right">
                            {nextLevelXp - xp} XP to Level {level + 1}
                        </p>
                    </div>
                </div>
            </Card>

            {activeTab === 'me' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* AI Challenges Section */}
                    <Card title="Daily Micro-Challenges">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-gray-400 text-sm">Boost your XP with AI-generated daily quests.</p>
                            <button 
                                onClick={handleGenerateChallenge} 
                                disabled={isGenerating}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center transition-colors disabled:opacity-50"
                            >
                                <SparkleIcon className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                                {isGenerating ? 'Designing Quest...' : 'New Quest'}
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {challenges.length === 0 && <p className="text-center text-gray-500 py-4">No active challenges. Generate one!</p>}
                            {challenges.map(challenge => (
                                <div 
                                    key={challenge.id} 
                                    className={`p-4 rounded-xl border transition-all duration-500 ${
                                        challenge.isCompleted 
                                        ? 'bg-green-900/20 border-green-500/50 opacity-75' 
                                        : 'bg-gray-700/50 border-gray-600 hover:border-amber-500/50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold ${challenge.isCompleted ? 'text-green-400 line-through' : 'text-white'}`}>
                                                    {challenge.title}
                                                </h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded ${
                                                    challenge.difficulty === 'Easy' ? 'bg-green-500/20 text-green-300' :
                                                    challenge.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    'bg-red-500/20 text-red-300'
                                                }`}>
                                                    {challenge.difficulty}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1">{challenge.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-amber-400 font-bold text-sm block">+{challenge.xpReward} XP</span>
                                            {!challenge.isCompleted && (
                                                <button 
                                                    onClick={() => handleCompleteChallenge(challenge.id, challenge.xpReward)}
                                                    className="mt-2 text-xs bg-green-600 hover:bg-green-500 text-white py-1 px-3 rounded transition-colors"
                                                >
                                                    Claim
                                                </button>
                                            )}
                                            {challenge.isCompleted && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-2 ml-auto" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Badges Grid */}
                    <Card title="Badge Collection">
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {badges.map(badge => (
                                <div 
                                    key={badge.id} 
                                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                                        badge.isEarned 
                                        ? 'bg-gray-800 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                                        : 'bg-gray-800/50 border-gray-700 opacity-50 grayscale'
                                    }`}
                                    title={badge.description}
                                >
                                    <div className="text-4xl mb-2 filter drop-shadow-md">{badge.icon}</div>
                                    <span className={`text-xs font-bold text-center leading-tight ${badge.isEarned ? 'text-white' : 'text-gray-500'}`}>
                                        {badge.name}
                                    </span>
                                    {badge.isEarned && (
                                        <span className="text-[10px] text-amber-500/70 mt-1">{new Date(badge.earnedDate!).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'leaderboard' && (
                <div className="max-w-3xl mx-auto">
                    <Card title="Gym Leaderboard (Top 5)">
                        <div className="space-y-4">
                            {leaderboardData.map((user, index) => (
                                <div key={index} className={`flex items-center p-4 rounded-xl border ${user.isMe ? 'bg-amber-900/20 border-amber-500/50' : 'bg-gray-800 border-gray-700'}`}>
                                    <div className="flex-shrink-0 w-8 text-center font-bold text-lg text-gray-400 mr-4">
                                        {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                                    </div>
                                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover mr-4 border-2 border-gray-600" />
                                    <div className="flex-grow">
                                        <h4 className={`font-bold text-lg ${user.isMe ? 'text-amber-400' : 'text-white'}`}>
                                            {user.name} {user.isMe && '(You)'}
                                        </h4>
                                        <p className="text-xs text-gray-500">Member</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-white">{user.xp}</p>
                                        <p className="text-xs text-amber-500 font-bold">XP</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-center text-gray-500 text-sm">
                            <p>Leaderboard resets every month. Top 3 get a free protein shake!</p>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GamificationDashboard;
