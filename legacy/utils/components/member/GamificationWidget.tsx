import React from 'react';
import { Trophy, Star, Target, Zap, Medal } from 'lucide-react';
import { motion } from 'motion/react';

export const GamificationWidget: React.FC = () => {
    return (
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">FitnessFutureAchievements</h3>
                        <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Level 42 • Consistency King</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-amber-500">8,450</p>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">FitnessFutureTokens</p>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 font-bold">Current Streak</span>
                        <span className="text-amber-400 font-bold">14 Days</span>
                    </div>
                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: '70%' }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        ></motion.div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                    <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
                        <Medal className="w-6 h-6 text-yellow-400 mb-2" />
                        <span className="text-[9px] text-gray-400 font-bold uppercase text-center">Iron Lifter</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors">
                        <Zap className="w-6 h-6 text-blue-400 mb-2" />
                        <span className="text-[9px] text-gray-400 font-bold uppercase text-center">Speed Demon</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors opacity-50 grayscale">
                        <Star className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase text-center">Locked</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
