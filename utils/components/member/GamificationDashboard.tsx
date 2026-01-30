
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
import { AppleHealthIcon } from '../icons/AppleHealthIcon';
import { SamsungHealthIcon } from '../icons/SamsungHealthIcon';

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
    const [activeTab, setActiveTab] = useState<'me' | 'leaderboard' | 'squad'>('me');
    const [xp, setXp] = useState(1250);
    const [badges, setBadges] = useState<Badge[]>(INITIAL_BADGES);
    const [challenges, setChallenges] = useState<Challenge[]>([
        { id: 'c1', title: 'Warmup Warrior', description: 'Complete a 10-min warmup.', xpReward: 50, difficulty: 'Easy', isCompleted: false },
    ]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Enhanced Cross-Platform Leaderboard Data
    const leaderboardData = [
        { rank: 1, name: 'Vikram Mehta', xp: 2450, avatar: 'https://picsum.photos/seed/vikram/200', tier: 'Diamond', device: 'Apple' },
        { rank: 2, name: 'Priya Patel', xp: 2100, avatar: 'https://picsum.photos/seed/priya/200', tier: 'Platinum', device: 'Samsung' },
        { rank: 3, name: 'You', xp: 1250, avatar: 'https://picsum.photos/seed/aarav/200', isMe: true, tier: 'Gold', device: 'Apple' }, 
        { rank: 4, name: 'Anika Singh', xp: 980, avatar: 'https://picsum.photos/seed/anika/200', tier: 'Silver', device: 'Samsung' },
        { rank: 5, name: 'Rohan Kumar', xp: 450, avatar: 'https://picsum.photos/seed/rohan/200', tier: 'Bronze', device: 'Garmin' },
    ];

    // Derived State
    const level = Math.floor(xp / 1000) + 1;
    const nextLevelXp = level * 1000;
    const progressPercent = ((xp % 1000) / 1000) * 100;

    const memberData = useMemo(() => {
        return INITIAL_MEMBER_FITNESS_DATA[memberId] || { logs: [], metrics: [] };
    }, [memberId]);

    const handleGenerateChallenge = async () => {
        setIsGenerating(true);
        try {
            const newChallenge = await generateGamifiedChallenge(memberData.logs);
            if (newChallenge && newChallenge.title) {
                setChallenges(prev => [...prev, newChallenge]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Level Banner */}
            <div className="flex justify-between items-center mb-6 bg-gradient-to-r from-amber-600 to-orange-600 p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                <div className="text-white relative z-10">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">Level {level}</h2>
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">Rank: Gold Tier</p>
                </div>
                <div className="text-right relative z-10">
                    <p className="text-4xl font-black text-white drop-shadow-md">{xp}</p>
                    <p className="text-xs text-amber-200 font-bold uppercase tracking-widest">Total XP</p>
                </div>
            </div>

            {/* Level Progress */}
            <Card className="bg-gray-800 border-gray-700">
                <div className="flex justify-between text-xs text-gray-400 mb-2 font-bold uppercase">
                    <span>Current Level {level}</span>
                    <span>Next Level {level + 1}</span>
                </div>
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                    <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-1000" 
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
                <div className="text-right mt-1 text-[10px] text-gray-500">
                    {nextLevelXp - xp} XP to level up
                </div>
            </Card>

            <div className="flex space-x-2 bg-gray-800 p-1 rounded-xl w-full overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('me')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap ${activeTab === 'me' ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <AwardIcon className="w-5 h-5 mr-2" /> My Stats
                </button>
                <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <TrophyIcon className="w-5 h-5 mr-2" /> Global Rank
                </button>
                <button 
                    onClick={() => setActiveTab('squad')}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center whitespace-nowrap ${activeTab === 'squad' ? 'bg-amber-500 text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <UserGroupIcon className="w-5 h-5 mr-2" /> Squad War
                </button>
            </div>

            {/* TAB: ME */}
            {activeTab === 'me' && (
                <div className="space-y-6">
                    {/* Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {badges.map(badge => (
                            <div key={badge.id} className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${badge.isEarned ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-amber-500/50 shadow-lg' : 'bg-gray-900 border-gray-800 opacity-60 grayscale'}`}>
                                <div className="text-4xl mb-3 filter drop-shadow-md">{badge.icon}</div>
                                <h4 className="font-bold text-white text-xs uppercase mb-1">{badge.name}</h4>
                                <p className="text-[10px] text-gray-400 leading-tight">{badge.description}</p>
                                {badge.isEarned && (
                                    <span className="mt-3 text-[10px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-500/30 flex items-center">
                                        <CheckCircleIcon className="w-3 h-3 mr-1" /> Earned
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* AI Challenges */}
                    <Card title="Daily Challenges" className="bg-gray-800/50 border-gray-700">
                        <div className="space-y-3">
                            {challenges.map(challenge => (
                                <div key={challenge.id} className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex justify-between items-center">
                                    <div>
                                        <h5 className="font-bold text-white text-sm">{challenge.title}</h5>
                                        <p className="text-xs text-gray-400">{challenge.description}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded mt-1 inline-block ${challenge.difficulty === 'Hard' ? 'bg-red-900/50 text-red-400' : 'bg-blue-900/50 text-blue-400'}`}>
                                            {challenge.difficulty}
                                        </span>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-amber-400 font-black text-lg">+{challenge.xpReward}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">XP</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={handleGenerateChallenge}
                            disabled={isGenerating}
                            className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            <SparkleIcon className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                            {isGenerating ? 'AI Generating...' : 'Generate New Challenge'}
                        </button>
                    </Card>
                </div>
            )}

            {/* TAB: LEADERBOARD (CROSS-PLATFORM) */}
            {activeTab === 'leaderboard' && (
                <div className="space-y-6">
                    <Card className="p-0 overflow-hidden bg-gray-800 border-gray-700">
                        <div className="bg-gray-900 p-3 border-b border-gray-700 text-center">
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Cross-Platform Rankings</p>
                        </div>
                        {leaderboardData.map((user, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-4 border-b border-gray-700 last:border-0 ${user.isMe ? 'bg-amber-900/20' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 flex items-center justify-center font-black rounded-full ${idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black shadow-lg' : 'bg-gray-700 text-gray-400'}`}>
                                        {user.rank}
                                    </div>
                                    <div className="relative">
                                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-gray-600 object-cover" />
                                        <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-0.5 border border-gray-600">
                                            {user.device === 'Apple' ? <AppleHealthIcon className="w-3 h-3 text-white" /> : user.device === 'Samsung' ? <SamsungHealthIcon className="w-3 h-3 text-blue-400" /> : <div className="w-3 h-3 bg-gray-500 rounded-full"></div>}
                                        </div>
                                    </div>
                                    <div>
                                        <p className={`font-bold ${user.isMe ? 'text-amber-400' : 'text-white'}`}>{user.name} {user.isMe && '(You)'}</p>
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{user.tier} League</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-mono font-bold text-white">{user.xp}</p>
                                    <p className="text-[10px] text-gray-500">XP</p>
                                </div>
                            </div>
                        ))}
                    </Card>
                </div>
            )}

            {/* TAB: SQUAD WARS */}
            {activeTab === 'squad' && (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30">
                        <div className="text-center py-6">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">OS WARS: Week 12</h2>
                            <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
                                Connect your device to contribute to your faction's total step count.
                            </p>
                            
                            <div className="flex justify-between items-end px-4 gap-4">
                                {/* Team Apple */}
                                <div className="flex-1 flex flex-col items-center">
                                    <AppleHealthIcon className="w-12 h-12 text-white mb-2" />
                                    <h3 className="text-lg font-bold text-white">Team iOS</h3>
                                    <p className="text-2xl font-black text-white mt-2">1.2M</p>
                                    <p className="text-xs text-gray-500 uppercase">Steps</p>
                                    <div className="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-white w-[60%]"></div>
                                    </div>
                                </div>

                                <div className="text-amber-500 font-black text-xl italic">VS</div>

                                {/* Team Android */}
                                <div className="flex-1 flex flex-col items-center">
                                    <SamsungHealthIcon className="w-12 h-12 text-blue-400 mb-2" />
                                    <h3 className="text-lg font-bold text-blue-400">Team Droid</h3>
                                    <p className="text-2xl font-black text-white mt-2">1.1M</p>
                                    <p className="text-xs text-gray-500 uppercase">Steps</p>
                                    <div className="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                                        <div className="h-full bg-blue-500 w-[55%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                    
                    <div className="text-center">
                        <button className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-lg transition-colors border border-gray-600">
                            Join a Faction
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamificationDashboard;
