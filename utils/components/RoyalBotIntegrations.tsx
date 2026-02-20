
import React, { useState } from 'react';
import Card from './common/Card';
import { Bot, Power, Activity, Zap, MessageSquare, Shield, Coins } from 'lucide-react';
import { useToast } from '../hooks/useToast';

const INITIAL_BOTS = [
    { id: '1', name: 'Retention Guard', type: 'CRM', status: 'Active', efficiency: 94, tasks: 'Monitoring 142 members', icon: <Shield className="w-6 h-6 text-blue-400"/> },
    { id: '2', name: 'Revenue Oracle', type: 'Finance', status: 'Active', efficiency: 98, tasks: 'Predicting Q4 growth', icon: <Coins className="w-6 h-6 text-emerald-400"/> },
    { id: '3', name: 'Social Hive Mind', type: 'Marketing', status: 'Idle', efficiency: 88, tasks: 'Waiting for content', icon: <MessageSquare className="w-6 h-6 text-pink-400"/> },
    { id: '4', name: 'Bio-Scout', type: 'Health', status: 'Active', efficiency: 99, tasks: 'Analyzing wearable streams', icon: <Activity className="w-6 h-6 text-red-400"/> },
];

const RoyalBotIntegrations: React.FC = () => {
    const { addToast } = useToast();
    const [bots, setBots] = useState(INITIAL_BOTS);

    const toggleBot = (id: string) => {
        setBots(prev => prev.map(b => {
            if (b.id === id) {
                const newStatus = b.status === 'Active' ? 'Offline' : 'Active';
                addToast(`${b.name} is now ${newStatus}`, newStatus === 'Active' ? 'success' : 'error');
                return { ...b, status: newStatus };
            }
            return b;
        }));
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="p-10 rounded-[3.5rem] bg-[#050505] border border-indigo-500/20 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            <Bot className="w-12 h-12 text-indigo-500" />
                            Neural <span className="text-indigo-400">Agent Swarm</span>
                        </h1>
                        <p className="text-gray-500 text-xs font-mono mt-2 tracking-widest uppercase">Autonomous Protocol Management</p>
                    </div>
                    <div className="bg-indigo-900/20 px-6 py-2 rounded-full border border-indigo-500/30 flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-indigo-300 font-bold text-xs uppercase">System Healthy</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bots.map(bot => (
                    <Card key={bot.id} className={`transition-all duration-300 ${bot.status === 'Active' ? 'bg-gray-900 border-indigo-500/30' : 'bg-gray-950 border-white/5 opacity-70'}`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-black rounded-2xl border border-white/5 shadow-lg">
                                    {bot.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{bot.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest">{bot.type} Unit</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => toggleBot(bot.id)}
                                className={`p-3 rounded-full transition-all ${bot.status === 'Active' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/40' : 'bg-red-500/20 text-red-400 hover:bg-red-500/40'}`}
                            >
                                <Power className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold uppercase">Status</span>
                                <span className={`text-xs font-black uppercase ${bot.status === 'Active' ? 'text-green-400' : 'text-red-500'}`}>{bot.status}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-bold uppercase">Current Task</span>
                                <span className="text-xs text-white truncate max-w-[150px]">{bot.tasks}</span>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase mb-1">
                                    <span>Neural Efficiency</span>
                                    <span>{bot.efficiency}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${bot.efficiency}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default RoyalBotIntegrations;
