
import React, { useState, useEffect } from 'react';
import Card from '../common/Card';
import { TrophyIcon } from '../icons/TrophyIcon';
import { SparkleIcon } from '../icons/SparkleIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { AwardIcon } from '../icons/AwardIcon';
import { BotIcon } from '../icons/BotIcon';

const RpgAdventure: React.FC<{ steps: number }> = ({ steps }) => {
    const progress = Math.min(100, (steps / 10000) * 100);
    return (
        <div className="relative h-64 bg-black border border-amber-500/20 rounded-3xl overflow-hidden p-6">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-amber-400 italic">Active Quest: Iron Peak</h3>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mt-1">Difficulty: Hardcore</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">Level 42</p>
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Sovereign Knight</p>
                    </div>
                </div>

                <div className="w-full">
                    <div className="flex justify-between text-[10px] font-mono text-gray-500 mb-2">
                        <span>STARTING VILLAGE</span>
                        <span>IRON CASTLE</span>
                    </div>
                    <div className="h-6 w-full bg-gray-900 rounded-full border border-gray-800 p-1 relative overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-500 rounded-full transition-all duration-1000 shadow-[0_0_20px_#f59e0b]" style={{ width: `${progress}%` }}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000" style={{ left: `${progress}%`, marginLeft: '-12px' }}>
                             <span className="text-2xl">🏃</span>
                        </div>
                    </div>
                    <p className="text-center text-[10px] text-amber-500 font-black mt-3 uppercase tracking-[0.4em] animate-pulse">
                        {10000 - steps} steps to reach Castle • +500 XP Reward
                    </p>
                </div>
            </div>
        </div>
    );
};

const GamificationDashboard: React.FC<{ memberId: number }> = () => {
    const [xp, setXp] = useState(1250);
    const [steps, setSteps] = useState(6540);

    useEffect(() => {
        const interval = setInterval(() => setSteps(prev => prev + Math.floor(Math.random() * 5)), 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-amber-400 flex items-center">
                    <AwardIcon className="w-8 h-8 mr-3" />
                    Sovereign Adventures
                </h1>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-2xl font-black text-white">{xp} XP</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">Total Energy</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-black font-black text-xl">42</div>
                </div>
            </div>

            <RpgAdventure steps={steps} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="Neural Challenges">
                    <div className="space-y-3">
                        {[
                            { name: 'Fasted Finisher', desc: 'Workout while glucose < 90 mg/dL', xp: 200, status: 'Active' },
                            { name: 'Circadian Peak', desc: 'Train during 100% efficiency phase', xp: 150, status: 'Locked' },
                            { name: 'HRV Recovery King', desc: 'Full workout with > 60 HRV', xp: 300, status: 'Active' }
                        ].map((q, i) => (
                            <div key={i} className="p-4 bg-gray-900 rounded-2xl border border-gray-800 flex justify-between items-center group hover:border-amber-500/50 transition-all cursor-pointer">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{q.name}</h4>
                                    <p className="text-xs text-gray-500">{q.desc}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-amber-500 font-bold text-xs">+{q.xp} XP</p>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${q.status === 'Active' ? 'text-green-400' : 'text-gray-600'}`}>{q.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Achievement Matrix">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { icon: '🔥', label: '10 Day Streak' },
                            { icon: '🦍', label: 'Massive Load' },
                            { icon: '🥗', label: 'Clean Streak' },
                            { icon: '⚡', label: 'Hyper-Fast' },
                            { icon: '🏆', label: 'Season 1 Hero' },
                            { icon: '💎', label: 'Diamond Body' }
                        ].map((a, i) => (
                            <div key={i} className="flex flex-col items-center p-3 bg-gray-800 rounded-2xl border border-white/5 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help">
                                <span className="text-3xl mb-1">{a.icon}</span>
                                <span className="text-[8px] font-bold text-gray-500 text-center uppercase tracking-tighter">{a.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-3">
                        <BotIcon className="w-5 h-5 text-amber-500" />
                        <p className="text-[10px] text-gray-400 italic">"Based on your recent VO2 Max spikes, you are 12% away from 'Wind Sprinter' badge."</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default GamificationDashboard;
