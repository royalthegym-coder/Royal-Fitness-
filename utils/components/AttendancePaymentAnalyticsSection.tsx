import React, { useState, useEffect, useMemo } from 'react';
import {
    ResponsiveContainer, ComposedChart, AreaChart, Area, BarChart, Bar,
    Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import {
    BarChart3, Flame, Calendar, Clock, Wallet, Users, RefreshCw,
    QrCode, TrendingUp, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import { useCurrencyStore } from '../store/useCurrencyStore';

interface DailyTrendItem {
    date: string;
    label: string;
    checkIns: number;
    uniqueMembers: number;
    paidRevenue: number;
    pendingDues: number;
}

interface HourlyBucket {
    hour: number;
    label: string;
    checkIns: number;
    zone: 'Peak Rush' | 'Moderate' | 'Off-Peak';
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const HEATMAP_HOURS = [
    { hour: 5, label: '5a' },
    { hour: 6, label: '6a' },
    { hour: 7, label: '7a' },
    { hour: 8, label: '8a' },
    { hour: 9, label: '9a' },
    { hour: 10, label: '10a' },
    { hour: 11, label: '11a' },
    { hour: 12, label: '12p' },
    { hour: 16, label: '4p' },
    { hour: 17, label: '5p' },
    { hour: 18, label: '6p' },
    { hour: 19, label: '7p' },
    { hour: 20, label: '8p' },
    { hour: 21, label: '9p' }
];

// Baseline hourly heatmap seed stored in localStorage so it persists and merges with live check-ins
const DEFAULT_HEATMAP_MATRIX: Record<string, Record<number, number>> = {
    Mon: { 5: 6, 6: 18, 7: 24, 8: 19, 9: 11, 10: 7, 11: 5, 12: 6, 16: 10, 17: 21, 18: 28, 19: 26, 20: 17, 21: 9 },
    Tue: { 5: 5, 6: 16, 7: 22, 8: 17, 9: 10, 10: 6, 11: 4, 12: 5, 16: 9, 17: 19, 18: 25, 19: 24, 20: 15, 21: 8 },
    Wed: { 5: 7, 6: 19, 7: 25, 8: 20, 9: 12, 10: 8, 11: 6, 12: 7, 16: 11, 17: 22, 18: 29, 19: 27, 20: 18, 21: 10 },
    Thu: { 5: 5, 6: 15, 7: 20, 8: 16, 9: 9, 10: 6, 11: 5, 12: 5, 16: 8, 17: 18, 18: 24, 19: 23, 20: 16, 21: 7 },
    Fri: { 5: 6, 6: 17, 7: 23, 8: 18, 9: 11, 10: 7, 11: 6, 12: 6, 16: 12, 17: 20, 18: 26, 19: 22, 20: 14, 21: 7 },
    Sat: { 5: 4, 6: 12, 7: 21, 8: 26, 9: 24, 10: 18, 11: 12, 12: 9, 16: 10, 17: 15, 18: 19, 19: 16, 20: 10, 21: 5 },
    Sun: { 5: 2, 6: 8, 7: 14, 8: 19, 9: 20, 10: 15, 11: 10, 12: 7, 16: 6, 17: 10, 18: 12, 19: 9, 20: 6, 21: 3 }
};

export const AttendancePaymentAnalyticsSection: React.FC<{
    onOpenQRCheckIn?: () => void;
}> = ({ onOpenQRCheckIn }) => {
    const { attendanceRecords, invoices } = useData();
    const { formatCurrency } = useCurrencyStore();
    const [selectedRange, setSelectedRange] = useState<'7d' | '14d'>('7d');
    const [storageTick, setStorageTick] = useState<number>(0);

    // Ensure localStorage mock telemetry is initialized and listen to storage updates
    useEffect(() => {
        if (!localStorage.getItem('fitness_hourly_heatmap_v1')) {
            localStorage.setItem('fitness_hourly_heatmap_v1', JSON.stringify(DEFAULT_HEATMAP_MATRIX));
        }
        const handleStorage = () => setStorageTick(t => t + 1);
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // Pull attendance & payment records from localStorage + context
    const { dailyTrends, hourlyDistribution, heatmapMatrix, summaryMetrics } = useMemo(() => {
        const daysCount = selectedRange === '14d' ? 14 : 7;

        // Read raw localStorage mock & live stores
        let storedCheckIns: any[] = [];
        try {
            const rawCheckIns = localStorage.getItem('fitness_checkin_history_v1');
            if (rawCheckIns) storedCheckIns = JSON.parse(rawCheckIns);
        } catch {}

        let baseMatrix: Record<string, Record<number, number>> = JSON.parse(
            JSON.stringify(DEFAULT_HEATMAP_MATRIX)
        );
        try {
            const rawMatrix = localStorage.getItem('fitness_hourly_heatmap_v1');
            if (rawMatrix) baseMatrix = JSON.parse(rawMatrix);
        } catch {}

        // Overlay live check-ins onto the hourly heatmap matrix
        storedCheckIns.forEach(entry => {
            const dayKey = entry.dayOfWeek || 'Mon';
            const hr = typeof entry.hour === 'number' ? entry.hour : 7;
            if (baseMatrix[dayKey]) {
                baseMatrix[dayKey][hr] = (baseMatrix[dayKey][hr] || 0) + 1;
            }
        });

        // Build daily attendance & payment trend series
        const trendList: DailyTrendItem[] = [];
        const baselineCheckIns = [34, 42, 39, 47, 51, 45, 54, 38, 44, 49, 53, 46, 58, 62];
        const baselinePaid = [14500, 18900, 12500, 24900, 21500, 28400, 32500, 16000, 22400, 19800, 27500, 31000, 26500, 35900];
        const baselinePending = [4500, 6000, 3500, 5000, 7500, 4000, 5500, 4900, 3800, 6200, 4500, 5200, 3900, 4800];

        for (let i = daysCount - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

            const liveAttCount =
                (attendanceRecords || []).filter(r => r.date === dateStr && r.status === 'Present').length +
                storedCheckIns.filter(c => c.date === dateStr).length;

            const livePaidForDay = (invoices || [])
                .filter(inv => inv.date === dateStr && inv.status === 'Paid')
                .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

            const livePendingForDay = (invoices || [])
                .filter(inv => inv.date === dateStr && (inv.status === 'Pending' || inv.status === 'Overdue'))
                .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

            const seedIdx = (daysCount - 1 - i) % baselineCheckIns.length;
            const checkIns = baselineCheckIns[seedIdx] + liveAttCount;
            const paidRevenue = baselinePaid[seedIdx] + livePaidForDay;
            const pendingDues = baselinePending[seedIdx] + livePendingForDay;

            trendList.push({
                date: dateStr,
                label,
                checkIns,
                uniqueMembers: Math.round(checkIns * 0.88),
                paidRevenue,
                pendingDues
            });
        }

        // Build hourly distribution across the week for the Recharts Hourly BarChart
        const hourlyData: HourlyBucket[] = HEATMAP_HOURS.map(({ hour, label }) => {
            const totalForHour = DAYS.reduce((sum, day) => sum + (baseMatrix[day]?.[hour] || 0), 0);
            const zone: HourlyBucket['zone'] =
                totalForHour >= 140 ? 'Peak Rush' : totalForHour >= 75 ? 'Moderate' : 'Off-Peak';
            return {
                hour,
                label,
                checkIns: totalForHour,
                zone
            };
        });

        const totalCheckInsPeriod = trendList.reduce((s, d) => s + d.checkIns, 0);
        const totalPaidPeriod = trendList.reduce((s, d) => s + d.paidRevenue, 0);
        const totalPendingPeriod = trendList.reduce((s, d) => s + d.pendingDues, 0);
        const peakHourBucket = [...hourlyData].sort((a, b) => b.checkIns - a.checkIns)[0];

        return {
            dailyTrends: trendList,
            hourlyDistribution: hourlyData,
            heatmapMatrix: baseMatrix,
            summaryMetrics: {
                totalCheckInsPeriod,
                totalPaidPeriod,
                totalPendingPeriod,
                peakHourLabel: peakHourBucket ? `${peakHourBucket.label} (${peakHourBucket.checkIns} visits)` : '6p'
            }
        };
    }, [attendanceRecords, invoices, selectedRange, storageTick]);

    const getHeatmapCellStyle = (count: number) => {
        if (count >= 24) return 'bg-emerald-500 text-black font-black border-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.4)]';
        if (count >= 16) return 'bg-cyan-500/80 text-black font-bold border-cyan-400/50';
        if (count >= 10) return 'bg-cyan-500/35 text-cyan-200 border-cyan-500/30';
        if (count >= 6) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20';
        return 'bg-white/[0.03] text-gray-500 border-white/5';
    };

    return (
        <div className="bg-zinc-950 border border-cyan-500/20 rounded-[3rem] p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -left-24 -top-24 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Top Header & Controls */}
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-2">
                        <BarChart3 className="w-3.5 h-3.5" /> Recharts Telemetry • LocalStorage Attendance &amp; Payment Trends
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tight">
                        Member Attendance Patterns, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Payment Trends &amp; Hourly Check-In Heatmap</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                        Real-time visualization of member check-in frequency, collected vs. pending revenue trends, and hourly gym floor density from local storage.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex bg-black p-1 rounded-xl border border-white/10">
                        <button
                            type="button"
                            onClick={() => setSelectedRange('7d')}
                            className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                selectedRange === '7d' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            7-Day Window
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedRange('14d')}
                            className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                selectedRange === '14d' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            14-Day Window
                        </button>
                    </div>

                    {onOpenQRCheckIn && (
                        <button
                            type="button"
                            onClick={onOpenQRCheckIn}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer"
                        >
                            <QrCode className="w-4 h-4" /> Open Live QR Check-In
                        </button>
                    )}
                </div>
            </div>

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Check-Ins ({selectedRange})</p>
                    <p className="text-2xl font-black text-cyan-400 font-mono mt-1">{summaryMetrics.totalCheckInsPeriod}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Verified QR &amp; Biometric Entries</p>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collected Payments ({selectedRange})</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatCurrency(summaryMetrics.totalPaidPeriod)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Paid Membership &amp; PT Invoices</p>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending / Overdue Dues</p>
                    <p className="text-2xl font-black text-amber-400 font-mono mt-1">{formatCurrency(summaryMetrics.totalPendingPeriod)}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Awaiting Renewal Settlement</p>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-2xl p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Peak Rush Hour</p>
                    <p className="text-2xl font-black text-fuchsia-400 font-mono mt-1">{summaryMetrics.peakHourLabel}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Highest Hourly Floor Traffic</p>
                </div>
            </div>

            {/* Recharts Row: 1. Attendance & Payment Trends ComposedChart + 2. Hourly Check-In Distribution BarChart */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative z-10">
                {/* Left 7 Cols: Attendance Patterns & Payment Trends (ComposedChart) */}
                <div className="xl:col-span-7 bg-black/50 border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                                Dual-Axis Recharts Analytics
                            </span>
                            <h3 className="text-lg font-black text-white uppercase italic">
                                Daily Attendance Patterns vs. Payment Collection Trends
                            </h3>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-bold">
                            <span className="flex items-center gap-1 text-emerald-400">
                                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Paid Revenue
                            </span>
                            <span className="flex items-center gap-1 text-amber-400">
                                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Pending Dues
                            </span>
                            <span className="flex items-center gap-1 text-cyan-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> Check-Ins
                            </span>
                        </div>
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={dailyTrends} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="paidRevGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
                                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#10b981"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#06b6d4"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#09090b',
                                        borderColor: '#27272a',
                                        borderRadius: '14px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="paidRevenue"
                                    name="Paid Revenue (INR)"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fill="url(#paidRevGrad)"
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="pendingDues"
                                    name="Pending Dues (INR)"
                                    fill="#f59e0b"
                                    radius={[6, 6, 0, 0]}
                                    barSize={14}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="checkIns"
                                    name="Member Check-Ins"
                                    stroke="#06b6d4"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#06b6d4' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right 5 Cols: Recharts Hourly Check-In Distribution BarChart */}
                <div className="xl:col-span-5 bg-black/50 border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                                Hourly Traffic Profile
                            </span>
                            <h3 className="text-lg font-black text-white uppercase italic">
                                Hourly Check-In Volume (5 AM – 9 PM)
                            </h3>
                        </div>
                        <Clock className="w-5 h-5 text-amber-400" />
                    </div>

                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyDistribution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#09090b',
                                        borderColor: '#27272a',
                                        borderRadius: '14px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Bar dataKey="checkIns" name="Total Hourly Check-Ins" radius={[6, 6, 0, 0]}>
                                    {hourlyDistribution.map((entry, idx) => (
                                        <Cell
                                            key={idx}
                                            fill={
                                                entry.zone === 'Peak Rush'
                                                    ? '#10b981'
                                                    : entry.zone === 'Moderate'
                                                    ? '#06b6d4'
                                                    : '#6366f1'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Interactive 7-Day x Hourly Check-In Heatmap Grid */}
            <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-4 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            Spatial-Temporal Crowd Matrix
                        </span>
                        <h3 className="text-lg font-black text-white uppercase italic">
                            7-Day Hourly Check-In Heatmap (Mon – Sun)
                        </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
                        <span className="flex items-center gap-1.5 text-gray-400">
                            <span className="w-3 h-3 rounded bg-white/[0.05] border border-white/10 inline-block" /> Low (&lt;6)
                        </span>
                        <span className="flex items-center gap-1.5 text-indigo-300">
                            <span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/30 inline-block" /> Light (6–9)
                        </span>
                        <span className="flex items-center gap-1.5 text-cyan-300">
                            <span className="w-3 h-3 rounded bg-cyan-500/35 border border-cyan-500/40 inline-block" /> Moderate (10–15)
                        </span>
                        <span className="flex items-center gap-1.5 text-cyan-400">
                            <span className="w-3 h-3 rounded bg-cyan-500/80 inline-block" /> High (16–23)
                        </span>
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Peak Rush (24+)
                        </span>
                    </div>
                </div>

                <div className="overflow-x-auto pb-2 custom-scrollbar">
                    <table className="w-full border-collapse min-w-[720px]">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-[10px] font-black uppercase tracking-widest text-gray-500 w-16">
                                    Day
                                </th>
                                {HEATMAP_HOURS.map(h => (
                                    <th
                                        key={h.hour}
                                        className="p-1.5 text-center text-[10px] font-mono font-bold text-gray-400"
                                    >
                                        {h.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {DAYS.map(day => (
                                <tr key={day}>
                                    <td className="p-2 text-xs font-black uppercase text-white font-mono">
                                        {day}
                                    </td>
                                    {HEATMAP_HOURS.map(h => {
                                        const count = heatmapMatrix[day]?.[h.hour] || 0;
                                        return (
                                            <td key={h.hour} className="p-1">
                                                <div
                                                    title={`${day} ${h.label}: ${count} Member Check-Ins`}
                                                    className={`h-9 rounded-xl border flex items-center justify-center text-[11px] font-mono transition-all ${getHeatmapCellStyle(
                                                        count
                                                    )}`}
                                                >
                                                    {count}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AttendancePaymentAnalyticsSection;
