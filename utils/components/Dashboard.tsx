
import React, { useMemo } from 'react';
import { View } from '../../types';
import { useData } from '../context/DataProvider';
import { 
    TrendingUp, Activity, Users, Wallet, Infinity, Cpu,
    ShieldCheck, Bot, UserPlus, FileText, Send, Database,
    Radio, BrainCircuit, GitMerge, Cloud, Terminal, Zap,
    ArrowUpRight, AlertTriangle, Layers, Globe, Eye,
    Bell, Siren, Search, CreditCard, ChevronRight,
    Workflow, Microscope
} from 'lucide-react';

// --- SUB-COMPONENT: METRIC CARD ---
const MetricCard: React.FC<{ 
    title: string;
    value: string | number;
    subtext: string;
    icon: React.ReactNode;
    color: string; 
    onClick: () => void;
}> = ({ title, value, subtext, icon, color, onClick }) => (
    <div 
        onClick={onClick} 
        className="relative overflow-hidden bg-zinc-950 rounded-[2.5rem] border border-white/5 p-8 cursor-pointer group hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
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
    </div>
);

const Dashboard: React.FC<{ setCurrentView: (view: View) => void }> = ({ setCurrentView }) => {
    const { members, invoices, leads, auditLogs, systemHealth, activeMemberCount, totalRevenue } = useData();
    
    // Derived Stats
    const totalMembers = members.length;
    const pendingDues = invoices.filter(i => i.status === 'Pending' || i.status === 'Overdue').reduce((acc, i) => acc + i.amount, 0);
    const conversionRate = leads.length > 0 ? ((leads.filter(l => l.status === 'Converted').length / leads.length) * 100).toFixed(1) : '0.0';

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            
            {/* 1. MIRROR DECK HEADER */}
            <div className="bg-black p-10 rounded-[3.5rem] border border-cyan-500/20 relative overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -right-40 -top-40 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-4 py-1.5 bg-cyan-500 text-black rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2">
                            <Infinity className="w-3 h-3" /> Apex-Continuum v31.0
                        </div>
                        <span className="text-[10px] font-mono text-gray-500 tracking-[0.4em] uppercase">SYSTEM: ONLINE</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Mirror <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Deck</span>
                    </h1>
                    <p className="text-gray-500 text-xs font-mono mt-3 uppercase tracking-widest pl-1">
                        Command Center // <span className="text-cyan-400">{new Date().toLocaleDateString()}</span>
                    </p>
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
                />
                <MetricCard 
                    title="Fiscal Flow"
                    value={`₹${(totalRevenue/1000).toFixed(1)}k`}
                    subtext={`Pending: ₹${(pendingDues/1000).toFixed(1)}k`}
                    icon={<Wallet className="w-6 h-6" />}
                    color="text-amber-400"
                    onClick={() => setCurrentView('billing')}
                />
                <MetricCard 
                    title="Future Streams"
                    value={`${conversionRate}%`}
                    subtext={`${leads.length} Prospects`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="text-purple-400"
                    onClick={() => setCurrentView('leads')}
                />
                <MetricCard 
                    title="System Integrity"
                    value={`${systemHealth}%`}
                    subtext="Sentinel Active"
                    icon={<ShieldCheck className="w-6 h-6" />}
                    color="text-green-400"
                    onClick={() => setCurrentView('security')}
                />
            </div>

            {/* 3. OMNI-CORTEX FEED & ACTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* OMNI-CORTEX FEED */}
                <div className="lg:col-span-8">
                    <div className="bg-zinc-950 border-white/5 h-[500px] p-0 overflow-hidden flex flex-col rounded-[3.5rem] shadow-2xl">
                         <div className="p-8 border-b border-white/5 bg-gray-900/50 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                 <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live System Events</span>
                             </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/40">
                             {auditLogs.slice(0, 10).map((log, i) => (
                                 <div key={i} className="flex gap-4 group animate-slide-up">
                                     <div className="flex flex-col items-center">
                                         <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                                         <div className="w-px h-full bg-white/5 my-1 group-last:hidden"></div>
                                     </div>
                                     <div>
                                         <p className="text-[9px] font-mono text-gray-600 mb-1 flex items-center gap-2">
                                             {new Date(log.timestamp).toLocaleTimeString()} 
                                             <span className="text-cyan-900 bg-cyan-500/10 px-2 rounded border border-cyan-500/20">{log.action}</span>
                                         </p>
                                         <p className="text-xs text-gray-300 font-medium leading-relaxed">{log.details}</p>
                                     </div>
                                 </div>
                             ))}
                             {auditLogs.length === 0 && (
                                 <div className="h-full flex flex-col items-center justify-center opacity-30">
                                     <Bot className="w-16 h-16 mb-4 text-gray-600" />
                                     <p className="text-xs font-black uppercase tracking-widest">Feed Silent</p>
                                 </div>
                             )}
                         </div>
                    </div>
                </div>

                {/* NEURAL SHORTCUTS (Right Side) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-zinc-950 border-white/5 p-8 rounded-[3.5rem]">
                        <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-6">Neural Shortcuts</h3>
                        <div className="space-y-4">
                            <button onClick={() => setCurrentView('members')} className="w-full p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-cyan-500/50 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-cyan-900/20 rounded-xl text-cyan-400"><UserPlus className="w-5 h-5"/></div>
                                    <p className="text-xs font-bold text-white">Initialize Member</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </button>

                            <button onClick={() => setCurrentView('billing')} className="w-full p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-amber-500/50 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-900/20 rounded-xl text-amber-400"><CreditCard className="w-5 h-5"/></div>
                                    <p className="text-xs font-bold text-white">New Transaction</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </button>

                            <button onClick={() => setCurrentView('healthEngine')} className="w-full p-4 bg-black/40 rounded-2xl border border-white/5 hover:border-green-500/50 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-green-900/20 rounded-xl text-green-400"><Microscope className="w-5 h-5"/></div>
                                    <p className="text-xs font-bold text-white">Run Bio-Scan</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                            </button>
                            
                            <button onClick={() => setCurrentView('whatsapp')} className="w-full p-4 bg-red-900/10 rounded-2xl border border-red-500/20 hover:bg-red-900/20 flex items-center justify-between group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/20 rounded-xl text-red-500 animate-pulse"><Siren className="w-5 h-5"/></div>
                                    <p className="text-xs font-bold text-white">Emergency Alert</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-gradient-to-r from-indigo-900/20 to-black border border-indigo-500/30 rounded-[2.5rem] flex items-center gap-4 shadow-xl">
                        <div className="p-3 bg-indigo-500/20 rounded-full border border-indigo-500/50">
                            <Bot className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">AI Sentinel</p>
                            <p className="text-xs text-gray-400 italic">"Network Traffic optimal. No anomalies detected in Sector 7."</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
