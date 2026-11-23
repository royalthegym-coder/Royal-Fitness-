import React, { useMemo, useState } from 'react';
import { Users, UserMinus, MessageSquare, Briefcase, Zap, Bot, BellRing } from 'lucide-react';
import { useData } from '../../context/DataProvider';

export default function FitnessFutureCRM() {
    const { members, attendanceRecords } = useData();
    const [sending, setSending] = useState<string | null>(null);
    const [statusBanner, setStatusBanner] = useState<string | null>(null);
    const [interventionsCount, setInterventionsCount] = useState<number>(0);

    const activeMembersCount = useMemo(
        () => members.filter(m => m.status === 'Active').length,
        [members]
    );

    const churnList = useMemo(() => {
        const now = Date.now();
        return members
            .map((member) => {
                const memberAttendance = attendanceRecords
                    .filter((rec: any) => String(rec.memberId) === String(member.id))
                    .map((rec: any) => new Date(rec.date || rec.timestamp || 0).getTime())
                    .filter((ts: number) => Number.isFinite(ts) && ts > 0);
                const lastSeen = memberAttendance.length > 0 ? Math.max(...memberAttendance) : 0;
                const absentDays = lastSeen > 0 ? Math.floor((now - lastSeen) / 86_400_000) : 0;
                const risk: 'Critical' | 'High' | 'Medium' =
                    member.status === 'Expired' || absentDays >= 7
                        ? 'Critical'
                        : absentDays >= 5
                        ? 'High'
                        : 'Medium';
                return {
                    id: String(member.id),
                    name: member.name,
                    absentDays,
                    risk,
                    lastContacted: 'Not yet contacted',
                    isAtRisk: member.status === 'Expired' || absentDays >= 4,
                };
            })
            .filter(item => item.isAtRisk);
    }, [members, attendanceRecords]);

    const triggerWorkflow = (id: string, name: string) => {
        setSending(id);
        setTimeout(() => {
            setSending(null);
            setInterventionsCount(prev => prev + 1);
            setStatusBanner(`Retention WhatsApp check-in queued for ${name}.`);
            setTimeout(() => setStatusBanner(null), 5000);
        }, 600);
    };

    const triggerAll = () => {
        if (churnList.length === 0) {
            setStatusBanner('No at-risk members in the retention queue right now.');
            setTimeout(() => setStatusBanner(null), 4000);
            return;
        }
        setInterventionsCount(prev => prev + churnList.length);
        setStatusBanner(`Queued retention check-ins for ${churnList.length} member(s).`);
        setTimeout(() => setStatusBanner(null), 5000);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-24">
            {statusBanner && (
                <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 px-5 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3">
                    <span>{statusBanner}</span>
                    <button onClick={() => setStatusBanner(null)} className="text-emerald-400 hover:text-white font-black uppercase text-[10px]">Dismiss</button>
                </div>
            )}
            <div className="bg-black border border-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 flex items-center gap-3 relative z-10">
                    <Bot className="w-8 h-8 text-emerald-400" /> Fitness Future Retention CRM
                </h1>
                <p className="text-gray-400 text-sm font-mono uppercase tracking-widest relative z-10">Live Member Retention & Attendance Alerts</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-4">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                        <Users className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Active Members</p>
                        <p className="text-2xl font-black text-white">{activeMembersCount}</p>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-4">
                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500">
                        <UserMinus className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">At-Risk Churn</p>
                        <p className="text-2xl font-black text-white">{churnList.length}</p>
                    </div>
                </div>
                <div className="bg-black/40 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-4">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 text-blue-400">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Outreach Sent</p>
                        <p className="text-2xl font-black text-white">{interventionsCount}</p>
                    </div>
                </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-6 lg:p-10 backdrop-blur-md">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <h2 className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                        <Briefcase className="text-emerald-400" /> Retention Queue (Absent &gt; 3 Days)
                    </h2>
                    <button
                        onClick={triggerAll}
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                    >
                        <Zap className="w-4 h-4" /> Trigger Active Workflows
                    </button>
                </div>

                {churnList.length === 0 ? (
                    <div className="py-14 text-center border border-dashed border-white/10 rounded-2xl bg-black/30">
                        <p className="text-sm font-bold text-gray-300">No members currently flagged at churn risk.</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Add members and record attendance to automatically detect inactive or expired memberships here.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse hidden sm:table">
                            <thead>
                                <tr className="border-b border-white/10 text-[10px] text-gray-500 uppercase tracking-widest font-black">
                                    <th className="p-4 whitespace-nowrap">Member Name</th>
                                    <th className="p-4 whitespace-nowrap">Absent Days</th>
                                    <th className="p-4 whitespace-nowrap">Risk Level</th>
                                    <th className="p-4 whitespace-nowrap">Last Contact</th>
                                    <th className="p-4 text-right whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {churnList.map((lead) => (
                                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-sm text-white font-bold whitespace-nowrap">{lead.name}</td>
                                        <td className="p-4 text-sm font-mono text-gray-400 whitespace-nowrap">{lead.absentDays} Days</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded border ${
                                                lead.risk === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                                lead.risk === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                                'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                            }`}>
                                                {lead.risk}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{lead.lastContacted}</td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => triggerWorkflow(lead.id, lead.name)}
                                                disabled={sending === lead.id}
                                                className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                                            >
                                                {sending === lead.id ? 'Sending...' : 'Send WhatsApp Check-in'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="sm:hidden flex flex-col space-y-3 mt-2">
                            {churnList.map((lead) => (
                                <div key={lead.id} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-white font-bold text-sm">{lead.name}</h4>
                                            <p className="text-gray-400 text-xs mt-1 font-mono">{lead.absentDays} Days Absent</p>
                                        </div>
                                        <span className={`text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border ${
                                            lead.risk === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/30' :
                                            lead.risk === 'High' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                        }`}>
                                            {lead.risk}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => triggerWorkflow(lead.id, lead.name)}
                                        disabled={sending === lead.id}
                                        className="w-full text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded font-bold uppercase tracking-widest transition-colors disabled:opacity-50 mt-1"
                                    >
                                        {sending === lead.id ? 'Sending...' : 'Send WhatsApp Check-in'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-start gap-4">
                    <BellRing className="text-emerald-400 w-6 h-6 mt-1 flex-shrink-0" />
                    <div>
                        <h4 className="text-white font-bold mb-1">How Retention Monitoring Works</h4>
                        <p className="text-sm text-gray-400 leading-relaxed font-mono">
                            Fitness Future monitors real member attendance and membership status. When an active member misses check-ins for 4+ days or expires, they appear in this queue for 1-click outreach.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
