
import React, { useState, useEffect } from 'react';
import Card from './common/Card';
import { MembersIcon } from './icons/NavIcons';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { BotIcon } from './icons/BotIcon';
import { SparkleIcon } from './icons/SparkleIcon';
import { WhatsAppIcon } from './icons/WhatsAppIcon';
import LiveActivity from './LiveActivity';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useData } from '../context/DataProvider';
import { View } from '../../types';

interface DashboardProps {
    setCurrentView: (view: View) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; trend: string; action: () => void }> = ({ icon, title, value, trend, action }) => (
    <Card onClick={action} className="bg-gray-900 border-none hover:bg-gray-850 cursor-pointer group transition-all">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-white">{value}</h3>
                <p className="text-xs text-green-400 font-bold mt-2 flex items-center">
                    <TrendingUpIcon className="w-3 h-3 mr-1" /> {trend}
                </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                {icon}
            </div>
        </div>
    </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
    const { activeMemberCount, totalRevenue, leads } = useData();
    const [heatmap, setHeatmap] = useState<number[]>(Array(32).fill(0).map(() => Math.random() * 100));

    useEffect(() => {
        const interval = setInterval(() => {
            setHeatmap(prev => prev.map(v => Math.max(0, Math.min(100, v + (Math.random() * 20 - 10)))));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const revenueData = [
        { name: 'Jan', value: 45000 }, { name: 'Feb', value: 52000 }, { name: 'Mar', value: 48000 },
        { name: 'Apr', value: 61000 }, { name: 'May', value: 55000 }, { name: 'Jun', value: totalRevenue || 78000 }
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase italic font-display tracking-tight">
                        Admin <span className="text-amber-500">Console</span>
                    </h1>
                    <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">Royal Intelligence Hub v4.5</p>
                </div>
                <div className="bg-black/40 border border-gray-700 rounded-full px-6 py-2 flex items-center shadow-lg backdrop-blur-md">
                    <div className="relative flex h-2 w-2 mr-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Core Systems Optimized</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<MembersIcon />} title="Total Warriors" value={activeMemberCount.toString()} trend="+12% this month" action={() => setCurrentView('members')} />
                <StatCard icon={<DollarSignIcon />} title="Monthly Revenue" value={`₹${(totalRevenue/1000).toFixed(1)}k`} trend="+18.5% growth" action={() => setCurrentView('billing')} />
                <StatCard icon={<TrendingUpIcon />} title="Leads Conversion" value="64%" trend="+5% efficiency" action={() => setCurrentView('leads')} />
                <StatCard icon={<BotIcon />} title="AI Automations" value="1,420" trend="Active" action={() => setCurrentView('automation')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Financial Velocity" className="lg:col-span-2 border-none bg-gray-900">
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip contentStyle={{backgroundColor: '#111827', border: 'none', borderRadius: '12px'}} />
                                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={4} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Gym Floor Density" className="flex flex-col h-full bg-gray-900 border-none">
                    <div className="grid grid-cols-8 gap-1 bg-black p-4 rounded-xl border border-gray-800 flex-grow">
                        {heatmap.map((load, i) => (
                            <div key={i} className={`h-full w-full rounded-sm transition-all duration-1000 ${load > 80 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : load > 40 ? 'bg-amber-500' : 'bg-green-600'}`} style={{opacity: load/100 + 0.2}}></div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                        <span>Current Occupancy: 42%</span>
                        <span className="text-blue-400 cursor-pointer hover:underline">View Cameras</span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-amber-500 border-none cursor-pointer overflow-hidden relative" onClick={() => setCurrentView('payment')}>
                    <div className="relative z-10 text-gray-900">
                        <h4 className="font-black text-xl uppercase italic">Quick Pay Terminal</h4>
                        <p className="text-sm font-bold opacity-80">Manual Entry & POS</p>
                    </div>
                    <DollarSignIcon className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-10" />
                </Card>
                <Card className="bg-indigo-600 border-none cursor-pointer overflow-hidden relative" onClick={() => setCurrentView('whatsapp')}>
                    <div className="relative z-10 text-white">
                        <h4 className="font-black text-xl uppercase italic">Smart Broadcast</h4>
                        <p className="text-sm font-bold opacity-80">WhatsApp Campaign Center</p>
                    </div>
                    <WhatsAppIcon className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-10" />
                </Card>
                <Card className="bg-purple-600 border-none cursor-pointer overflow-hidden relative" onClick={() => setCurrentView('geminiHub')}>
                    <div className="relative z-10 text-white">
                        <h4 className="font-black text-xl uppercase italic">Strategic AI Hub</h4>
                        <p className="text-sm font-bold opacity-80">Reports & Insights</p>
                    </div>
                    <SparkleIcon className="absolute right-[-10px] bottom-[-10px] w-24 h-24 opacity-10" />
                </Card>
            </div>
            
            <LiveActivity setCurrentView={setCurrentView} />
        </div>
    );
};

export default Dashboard;
