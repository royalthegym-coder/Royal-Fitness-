import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Users, Clock, Target, Dumbbell, MessageCircle, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataProvider';

const GymBuddyFinder: React.FC<{ currentUser?: any }> = ({ currentUser }) => {
    const { members } = useData();
    const [matchedBuddies, setMatchedBuddies] = useState<number[]>([]);

    // Simple matching algorithm based on goals and level
    const potentialBuddies = useMemo(() => {
        if (!currentUser) return [];
        
        return members.filter(m => 
            m.id !== currentUser.id && 
            m.status === 'Active' &&
            ((m as any).goal === (currentUser as any).goal || m.level === currentUser.level)
        ).map(m => {
            let matchScore = 50;
            if ((m as any).goal === (currentUser as any).goal) matchScore += 30;
            if (m.level === currentUser.level) matchScore += 20;
            return { ...m, matchScore };
        }).sort((a, b) => b.matchScore - a.matchScore);
    }, [members, currentUser]);

    const handleConnect = (id: number) => {
        setMatchedBuddies(prev => [...prev, id]);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Gym <span className="text-pink-500">Buddy</span>
                    </h2>
                    <p className="text-pink-500/60 font-mono text-xs uppercase tracking-[0.2em] mt-1">AI Matchmaking</p>
                </div>
                <Users className="w-8 h-8 text-pink-500" />
            </div>

            <div className="bg-black/40 border border-pink-500/20 rounded-2xl p-6 mb-8">
                <p className="text-gray-400 text-sm">
                    Find workout partners who share your goals and schedule. Training together increases consistency by 65%.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {potentialBuddies.map((buddy) => (
                    <motion.div 
                        key={buddy.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden relative group"
                    >
                        <div className="absolute top-4 right-4 bg-black/80 px-3 py-1 rounded-full border border-pink-500/30 z-10">
                            <span className="text-pink-400 text-xs font-bold">{buddy.matchScore}% Match</span>
                        </div>
                        
                        <div className="h-48 bg-gray-800 relative">
                            {buddy.avatar ? (
                                <img src={buddy.avatar || "https://i.pravatar.cc/150?u=" + buddy.id} alt={buddy.name} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                    <Dumbbell className="w-16 h-16 text-gray-700" />
                                </div>
                            )}
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-gray-900 to-transparent"></div>
                        </div>

                        <div className="p-6 relative -mt-10">
                            <h3 className="text-xl font-bold text-white mb-1">{buddy.name}</h3>
                            <p className="text-gray-400 text-xs mb-4">Level {buddy.level} • {buddy.gender || 'Member'}</p>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-sm">
                                    <Target className="w-4 h-4 text-pink-400" />
                                    <span className="text-gray-300">{(buddy as any).goal || 'General Fitness'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Clock className="w-4 h-4 text-blue-400" />
                                    <span className="text-gray-300">Usually trains at 6:00 PM</span>
                                </div>
                            </div>

                            {matchedBuddies.includes(buddy.id) ? (
                                <button className="w-full bg-green-500/20 text-green-400 border border-green-500/50 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
                                    <CheckCircle className="w-4 h-4" /> Request Sent
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleConnect(buddy.id)}
                                    className="w-full bg-pink-600 hover:bg-pink-500 text-white py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                                >
                                    <MessageCircle className="w-4 h-4" /> Connect
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}

                {potentialBuddies.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-black/20 rounded-2xl border border-white/5">
                        <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No perfect matches found yet. Keep training!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GymBuddyFinder;
