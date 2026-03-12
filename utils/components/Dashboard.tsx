
import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { View } from '../../types';
import { useData } from '../context/DataProvider';
import { 
    TrendingUp, Activity, Users, Wallet, Infinity, Cpu,
    ShieldCheck, Bot, UserPlus, FileText, Send, Database,
    Radio, BrainCircuit, GitMerge, Cloud, Terminal, Zap,
    ArrowUpRight, AlertTriangle, Layers, Globe, Eye,
    Bell, Siren, Search, CreditCard, ChevronRight,
    Workflow, Microscope, Calendar, Dumbbell, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- SUB-COMPONENT: METRIC CARD ---
const MetricCard: React.FC<{ 
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ReactNode;
    color: string; 
    onClick: () => void;
    index: number;
}> = ({ title, value, subtext, icon, color, onClick, index }) => (
    <motion.div 
        onClick={onClick} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.02, translateY: -5 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden bg-zinc-950 rounded-[2.5rem] border border-white/5 p-8 cursor-pointer group hover:border-white/20 transition-all duration-500 hover:shadow-2xl"
    >
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-4 rounded-2xl bg-black/40 border border-white/10 ${color} shadow-lg backdrop-blur-md group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>
        </div>
        <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2">{title}</p>
            <h3 className="text-4xl font-black text-white italic tracking-tighter mb-2">{value}</h3>
            <p className="text-xs font-mono text-gray-400">{subtext}</p>
        </div>
    </motion.div>
);

const Dashboard: React.FC<{ setCurrentView: (view: View) => void }> = ({ setCurrentView }) => {
    const { members, invoices, leads, auditLogs, systemHealth, activeMemberCount, totalRevenue, staff } = useData();
    
    // Derived Stats
    const totalMembers = members.length;
    const pendingDues = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, i) => acc + i.amount, 0);
    const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === 'Converted').length / leads.length) * 100).toFixed(1) : '0.0';

    const trainers = staff.filter(s => s.role.toLowerCase().includes('trainer') || s.role.toLowerCase().includes('coach'));

    // Mock Analytics Data
    const analyticsData = useMemo(() => {
        return [
            { name: 'Jan', revenue: 4000, members: 240 },
            { name: 'Feb', revenue: 3000, members: 139 },
            { name: 'Mar', revenue: 2000, members: 980 },
            { name: 'Apr', revenue: 2780, members: 390 },
            { name: 'May', revenue: 1890, members: 480 },
            { name: 'Jun', revenue: 2390, members: 380 },
            { name: 'Jul', revenue: 3490, members: 430 },
        ];
    }, []);

    // Mock Schedule Data
    const todaySchedule = [
        { time: '06:00 AM', class: 'HIIT Blast', trainer: trainers[0]?.name || 'John Doe', capacity: '15/20' },
        { time: '08:00 AM', class: 'Yoga Flow', trainer: trainers[1]?.name || 'Jane Smith', capacity: '12/15' },
        { time: '05:00 PM', class: 'Strength & Conditioning', trainer: trainers[0]?.name || 'John Doe', capacity: '18/20' },
        { time: '07:00 PM', class: 'Zumba', trainer: trainers[2]?.name || 'Alice Johnson', capacity: '25/30' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. MIRROR DECK HEADER */}
            <div className="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-3">
                        <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                            <Infinity className="w-3 h-3" /> Quantum OS v32.0
                        </div>
                        <div className="px-4 py-1.5 bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(217,70,239,0.3)] flex items-center gap-2">
                            <Globe className="w-3 h-3 animate-pulse" /> Diplomat Mode Active
                        </div>
                        <div className="px-4 py-1.5 bg-green-500/20 border border-green-500/50 text-green-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center gap-2">
                            <Workflow className="w-3 h-3 animate-spin-slow" /> Full Automation: ON
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase ml-auto">SYSTEM: ONLINE</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none mb-4">
                        Mirror <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Deck</span>
                    </h1>
                    <div className="space-y-1 pl-1">
                        <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] animate-pulse">
                            World's Fastest & Latest Open-Source AI-POWERED Quantum Computer OS
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. GLOBAL PULSE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <MetricCard 
                    title="Active Bio-Nodes"
                    value={activeMemberCount}
                    subtext={`Total: ${totalMembers}`}
                    icon={<Users className="w-6 h-6" />}
                    color="text-cyan-400"
                    onClick={() => setCurrentView('members')}
                    index={0}
                />
                <MetricCard 
                    title="Fiscal Flow"
                    value={`₹${(totalRevenue/1000).toFixed(1)}k`}
                    subtext={`Pending: ₹${(pendingDues/1000).toFixed(1)}k`}
                    icon={<Wallet className="w-6 h-6" />}
                    color="text-amber-400"
                    onClick={() => setCurrentView('billing')}
                    index={1}
                />
                <MetricCard 
                    title="Future Streams"
                    value={`${conversionRate}%`}
                    subtext={`${leads.length} Prospects`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="text-purple-400"
                    onClick={() => setCurrentView('leads')}
                    index={2}
                />
                <MetricCard 
                    title="System Integrity"
                    value={`${systemHealth}%`}
                    subtext="Sentinel Active"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    color="text-green-400"
                    onClick={() => setCurrentView('security')}
                    index={3}
                />
            </div>

            {/* 3. COMPREHENSIVE ADMIN SECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT COLUMN: Analytics & Schedules */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Analytics Chart */}
                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-cyan-400" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Growth Analytics</h3>
                            </div>
                            <select className="bg-black/40 border border-white/10 text-xs text-gray-400 rounded-xl px-4 py-2 outline-none">
                                <option>Last 7 Months</option>
                                <option>This Year</option>
                            </select>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff10', borderRadius: '1rem' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                    <Area type="monotone" dataKey="members" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#colorMembers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Today's Schedule */}
                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-amber-400" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Today's Schedule</h3>
                            </div>
                            <button className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider">View All</button>
                        </div>
                        <div className="space-y-4">
                            {todaySchedule.map((session, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-mono font-bold">
                                            {session.time}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{session.class}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{session.trainer}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-300">{session.capacity}</p>
                                        <p className="text-[9px] text-gray-600 uppercase tracking-widest">Booked</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: Trainers & Feed */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Active Trainers */}
                    <div className="bg-zinc-950 border border-white/5 p-8 rounded-[3.5rem] shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <Dumbbell className="w-6 h-6 text-fuchsia-400" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Active Trainers</h3>
                            </div>
                            <button onClick={() => setCurrentView('staff')} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider">Manage</button>
                        </div>
                        <div className="space-y-4">
                            {trainers.length > 0 ? trainers.map(trainer => (
                                <div key={trainer.id} className="flex items-center gap-4 p-3 bg-black/40 border border-white/5 rounded-2xl">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                                        {trainer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{trainer.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{trainer.role}</p>
                                    </div>
                                    <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                </div>
                            )) : (
                                <p className="text-xs text-gray-500 italic text-center py-4">No active trainers found.</p>
                            )}
                        </div>
                    </div>

                    {/* OMNI-CORTEX FEED (Mini) */}
                    <div className="bg-zinc-950 border border-white/5 h-[400px] p-0 overflow-hidden flex flex-col rounded-[3.5rem] shadow-2xl">
                         <div className="p-6 border-b border-white/5 bg-gray-900/50 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live System Events</span>
                             </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40">
                             {auditLogs.slice(0, 8).map((log, i) => (
                                 <motion.div 
                                     key={i} 
                                     initial={{ opacity: 0, x: -20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ duration: 0.4, delay: i * 0.05 }}
                                     className="flex gap-4 group"
                                 >
                                     <div className="flex flex-col items-center">
                                         <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                                         <div className="w-px h-full bg-white/5 my-1 group-last:hidden"></div>
                                     </div>
                                     <div>
                                         <p className="text-[9px] font-mono text-gray-600 mb-1 flex items-center gap-2">
                                             {new Date(log.timestamp).toLocaleTimeString()} 
                                         </p>
                                         <p className="text-xs text-gray-300 font-medium leading-relaxed">{log.details}</p>
                                     </div>
                                 </motion.div>
                             ))}
                             {auditLogs.length === 0 && (
                                 <div className="h-full flex flex-col items-center justify-center opacity-30">
                                     <Bot className="w-12 h-12 mb-4 text-gray-600" />
                                     <p className="text-[10px] font-black uppercase tracking-widest">Feed Silent</p>
                                 </div>
                             )}
                         </div>
                    </div>

                    {/* NEURAL SHORTCUTS */}
                    <div className="bg-zinc-950 border border-white/5 p-6 rounded-[3.5rem]">
                        <div className="space-y-3">
                            <button onClick={() => setCurrentView('members')} className="w-full p-3 bg-black/40 rounded-2xl border border-white/5 hover:border-cyan-500/50 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-cyan-900/20 rounded-xl text-cyan-400"><UserPlus className="w-4 h-4"/></div>
                                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">Initialize Member</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </button>

                            <button onClick={() => setCurrentView('billing')} className="w-full p-3 bg-black/40 rounded-2xl border border-white/5 hover:border-amber-500/50 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-900/20 rounded-xl text-amber-400"><CreditCard className="w-4 h-4"/></div>
                                    <p className="text-[11px] font-bold text-white uppercase tracking-wider">New Transaction</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
