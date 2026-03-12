import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
    Network, MessageCircle, MapPin, CreditCard, TrendingUp, 
    Users, Zap, ShieldCheck, Activity, Bot, Smartphone, 
    Globe, ArrowUpRight, BarChart3, RefreshCw
} from 'lucide-react';
import { useData } from '../context/DataProvider';

export const NexusMasterDashboard: React.FC = () => {
    const { members } = useData();
    const [isSyncing, setIsSyncing] = useState(false);

    // Simulated Live Data
    const stats = {
        activeLeads: 24,
        whatsappInteractions: 156,
        googleMapViews: 842,
        autoPaymentsProcessed: 12,
        churnRisk: 3
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-950 via-black to-fuchsia-950 p-8 rounded-[2rem] border border-indigo-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Network className="w-5 h-5 text-fuchsia-400" />
                            <span className="text-xs font-mono text-fuchsia-400 uppercase tracking-widest">Global Automation Hub</span>
                        </div>
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">The Royal Nexus</h1>
                        <p className="text-indigo-200/70 mt-2 text-sm max-w-xl">
                            Zero-Manual Entry System. Google, WhatsApp, Telegram, and Payments fully synchronized by AI.
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 backdrop-blur-md"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-fuchsia-400' : ''}`} />
                        {isSyncing ? 'Syncing Nodes...' : 'Force Sync All'}
                    </button>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <MessageCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                <ArrowUpRight className="w-3 h-3" /> +12%
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stats.whatsappInteractions}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">WhatsApp AI Chats</p>
                    </div>
                </div>

                <div className="bg-black border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <MapPin className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="flex items-center gap-1 text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
                                <ArrowUpRight className="w-3 h-3" /> +45%
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stats.googleMapViews}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Google Maps Views</p>
                    </div>
                </div>

                <div className="bg-black border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <CreditCard className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                                Auto-Billed
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">₹45,000</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Auto Payments Today</p>
                    </div>
                </div>

                <div className="bg-black border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <Activity className="w-5 h-5 text-red-400" />
                            </div>
                            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                                AI Alert
                            </span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stats.churnRisk}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Members at Churn Risk</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Live Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-5 h-5 text-fuchsia-400" />
                                Live Nexus Activity
                            </h2>
                            <span className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                System Online
                            </span>
                        </div>

                        <div className="space-y-4">
                            {/* Activity Item 1 */}
                            <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex gap-4 items-start">
                                <div className="p-2 bg-blue-500/10 rounded-lg shrink-0 mt-1">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-white">New Google Maps Lead</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">Just now</span>
                                    </div>
                                    <p className="text-sm text-zinc-400">User searched "Gym in Jhunjhunu". AI sent 1-Day Free Trial link via WhatsApp.</p>
                                </div>
                            </div>

                            {/* Activity Item 2 */}
                            <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex gap-4 items-start">
                                <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0 mt-1">
                                    <CreditCard className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-white">Auto-Payment Processed</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">2 mins ago</span>
                                    </div>
                                    <p className="text-sm text-zinc-400">₹3,000 received from Rahul via GPay. Invoice generated and sent to WhatsApp.</p>
                                </div>
                            </div>

                            {/* Activity Item 3 */}
                            <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex gap-4 items-start">
                                <div className="p-2 bg-indigo-500/10 rounded-lg shrink-0 mt-1">
                                    <Bot className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-white">Telegram Community Bot</span>
                                        <span className="text-[10px] text-zinc-500 font-mono">15 mins ago</span>
                                    </div>
                                    <p className="text-sm text-zinc-400">AI initiated "Weekly Fitness Quiz" in the VIP Telegram group. 45 members participating.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Predictions & Controls */}
                <div className="space-y-6">
                    {/* Churn Prediction Engine */}
                    <div className="bg-gradient-to-b from-red-950/30 to-black border border-red-500/20 rounded-[2rem] p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-red-400" />
                            Churn Predictor AI
                        </h3>
                        <p className="text-xs text-red-200/70 mb-4">AI has identified 3 members who haven't visited in 7 days and ignored WhatsApp messages.</p>
                        
                        <div className="space-y-3">
                            <div className="bg-black/50 border border-red-500/10 p-3 rounded-xl flex justify-between items-center">
                                <span className="text-sm text-white">Amit Kumar</span>
                                <button className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full uppercase font-bold tracking-widest hover:bg-red-500/30 transition-colors">
                                    Send Offer
                                </button>
                            </div>
                            <div className="bg-black/50 border border-red-500/10 p-3 rounded-xl flex justify-between items-center">
                                <span className="text-sm text-white">Priya Singh</span>
                                <button className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full uppercase font-bold tracking-widest hover:bg-red-500/30 transition-colors">
                                    Send Offer
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Pricing Engine */}
                    <div className="bg-gradient-to-b from-amber-950/30 to-black border border-amber-500/20 rounded-[2rem] p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                            Dynamic Pricing Engine
                        </h3>
                        <p className="text-xs text-amber-200/70 mb-4">Current demand is high. AI suggests disabling standard discounts for the next 48 hours.</p>
                        
                        <div className="bg-black/50 border border-amber-500/10 p-4 rounded-xl text-center">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Current AI Pricing Strategy</span>
                            <span className="text-lg font-black text-amber-400">Premium Mode Active</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
