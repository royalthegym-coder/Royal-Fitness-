import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { useMemo, useState } from 'react';
import {
    Network, MessageCircle, MapPin, CreditCard, TrendingUp,
    ShieldCheck, Activity, RefreshCw, Globe
} from 'lucide-react';
import { useData } from '../context/DataProvider';

export const NexusMasterDashboard: React.FC = () => {
    const { members, leads, invoices, automationEvents } = useData();
    const [isSyncing, setIsSyncing] = useState(false);

    const paidTotal = useMemo(
        () => invoices.filter(i => i.status === 'Paid').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0),
        [invoices]
    );

    const atRiskMembers = useMemo(
        () => members.filter(m => m.status === 'Expired' || m.status === 'Inactive'),
        [members]
    );

    const stats = {
        activeLeads: leads.length,
        whatsappInteractions: automationEvents.length,
        activeMembers: members.filter(m => m.status === 'Active').length,
        autoPaymentsProcessed: paidTotal,
        churnRisk: atRiskMembers.length,
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 900);
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
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Fitness Future Nexus</h1>
                        <p className="text-indigo-200/70 mt-2 text-sm max-w-xl">
                            Unified live operational telemetry synced directly with your Fitness Future members, leads, invoices, and automation logs.
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
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <MessageCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Live</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stats.whatsappInteractions}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Automation Events</p>
                    </div>
                </div>

                <div className="bg-black border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <MapPin className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">CRM</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stats.activeLeads}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Tracked Leads</p>
                    </div>
                </div>

                <div className="bg-black border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <CreditCard className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">Verified</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{getCurrencySymbol()}{stats.autoPaymentsProcessed.toLocaleString()}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Collected Invoices</p>
                    </div>
                </div>

                <div className="bg-black border border-white/10 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <Activity className="w-5 h-5 text-red-400" />
                            </div>
                            <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">Monitor</span>
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">{stats.churnRisk}</h3>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Inactive / Expired</p>
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

                        {automationEvents.length === 0 ? (
                            <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-black/40">
                                <Globe className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                                <p className="text-sm font-bold text-zinc-300">No automation activity recorded yet.</p>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Real member admissions, invoices, and webhook triggers will appear here automatically.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {automationEvents.slice(0, 6).map((evt: any, idx: number) => (
                                    <div key={evt.id || idx} className="bg-black/50 border border-white/5 p-4 rounded-xl flex gap-4 items-start">
                                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0 mt-1">
                                            <Globe className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-white">{evt.type || 'Automation Event'}</span>
                                                <span className="text-[10px] text-zinc-500 font-mono">{evt.timestamp || 'Just now'}</span>
                                            </div>
                                            <p className="text-sm text-zinc-400">{evt.description || evt.message || 'Synchronized successfully.'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Retention & Capacity Controls */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-b from-red-950/30 to-black border border-red-500/20 rounded-[2rem] p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-red-400" />
                            Retention Monitor
                        </h3>
                        <p className="text-xs text-red-200/70 mb-4">
                            {atRiskMembers.length === 0
                                ? 'All registered members are currently active.'
                                : `${atRiskMembers.length} member(s) currently require renewal follow-up.`}
                        </p>

                        <div className="space-y-3">
                            {atRiskMembers.slice(0, 5).map((member) => (
                                <div key={member.id} className="bg-black/50 border border-red-500/10 p-3 rounded-xl flex justify-between items-center">
                                    <span className="text-sm text-white">{member.name}</span>
                                    <span className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full uppercase font-bold tracking-widest">
                                        {member.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-amber-950/30 to-black border border-amber-500/20 rounded-[2rem] p-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-400" />
                            Active Club Capacity
                        </h3>
                        <p className="text-xs text-amber-200/70 mb-4">Live count synced from Fitness Future member directory.</p>

                        <div className="bg-black/50 border border-amber-500/10 p-4 rounded-xl text-center">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Active Memberships</span>
                            <span className="text-lg font-black text-amber-400">{stats.activeMembers} Active</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
