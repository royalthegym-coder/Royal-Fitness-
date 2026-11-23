import React, { useMemo, useState } from 'react';
import {
  Download,
  FileText,
  TrendingUp,
  Users,
  PieChart as PieIcon,
  Sparkles,
  RefreshCw,
  Calendar,
  Activity,
  AlertTriangle,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'];

type Timeframe = 'daily' | 'weekly' | 'monthly';

interface AIReportSummary {
  headline: string;
  executiveSummary: string;
  keyFindings: string[];
  recommendedActions: string[];
}

const getCollectedAmount = (inv: { status: string; amount: number; paidAmount?: number }) => {
  if (inv.status === 'Refunded' || inv.status === 'Cancelled') return 0;
  if (typeof inv.paidAmount === 'number') return inv.paidAmount;
  return inv.status === 'Paid' ? inv.amount : 0;
};

const getOutstandingAmount = (inv: {
  status: string;
  amount: number;
  paidAmount?: number;
  balanceAmount?: number;
}) => {
  if (inv.status === 'Paid' || inv.status === 'Refunded' || inv.status === 'Cancelled') return 0;
  if (typeof inv.balanceAmount === 'number') return inv.balanceAmount;
  return Math.max(0, inv.amount - getCollectedAmount(inv));
};

export const AIReports: React.FC = () => {
  const { members, packages, invoices, expenses, leads, attendanceRecords, staff } = useData();
  const { currentGym } = useGym();
  const { addToast } = useToast();

  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [aiSummary, setAiSummary] = useState<AIReportSummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const summary = useMemo(() => {
    const activeMembers = members.filter((m) => !m.archived && m.status === 'Active').length;
    const expiredMembers = members.filter((m) => !m.archived && m.status === 'Expired').length;
    const revenue = invoices.reduce((s, i) => s + getCollectedAmount(i), 0);
    const outstanding = invoices.reduce((s, i) => s + getOutstandingAmount(i), 0);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const netProfit = revenue - totalExp;
    const profitMargin = revenue > 0 ? Math.round((netProfit / revenue) * 100) : 0;
    const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
    const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;
    const grantedAttendance = attendanceRecords.filter((a) => a.status !== 'Denied').length;

    return {
      activeMembers,
      expiredMembers,
      revenue,
      outstanding,
      totalExp,
      netProfit,
      profitMargin,
      convertedLeads,
      conversionRate,
      grantedAttendance,
    };
  }, [members, invoices, expenses, leads, attendanceRecords]);

  // Dynamic timeframe trend (Daily: 7 days, Weekly: 8 weeks, Monthly: 6 months)
  const financeTrend = useMemo(() => {
    const now = new Date();
    if (timeframe === 'daily') {
      const buckets: { key: string; label: string; revenue: number; expenses: number; profit: number; checkIns: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().split('T')[0];
        buckets.push({
          key,
          label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          revenue: 0,
          expenses: 0,
          profit: 0,
          checkIns: 0,
        });
      }
      invoices.forEach((inv) => {
        const b = buckets.find((x) => x.key === inv.date);
        if (b) b.revenue += getCollectedAmount(inv);
      });
      expenses.forEach((exp) => {
        const b = buckets.find((x) => x.key === exp.date);
        if (b) b.expenses += exp.amount;
      });
      attendanceRecords.forEach((att) => {
        if (att.status === 'Denied') return;
        const b = buckets.find((x) => x.key === att.date);
        if (b) b.checkIns += 1;
      });
      buckets.forEach((b) => {
        b.profit = b.revenue - b.expenses;
      });
      return buckets;
    }

    if (timeframe === 'weekly') {
      const buckets: { start: Date; end: Date; label: string; revenue: number; expenses: number; profit: number; checkIns: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const end = new Date(now);
        end.setDate(now.getDate() - i * 7);
        end.setHours(23, 59, 59, 999);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        buckets.push({
          start,
          end,
          label: `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          revenue: 0,
          expenses: 0,
          profit: 0,
          checkIns: 0,
        });
      }
      invoices.forEach((inv) => {
        if (!inv.date) return;
        const dt = new Date(inv.date);
        const b = buckets.find((x) => dt >= x.start && dt <= x.end);
        if (b) b.revenue += getCollectedAmount(inv);
      });
      expenses.forEach((exp) => {
        if (!exp.date) return;
        const dt = new Date(exp.date);
        const b = buckets.find((x) => dt >= x.start && dt <= x.end);
        if (b) b.expenses += exp.amount;
      });
      attendanceRecords.forEach((att) => {
        if (att.status === 'Denied' || !att.date) return;
        const dt = new Date(att.date);
        const b = buckets.find((x) => dt >= x.start && dt <= x.end);
        if (b) b.checkIns += 1;
      });
      buckets.forEach((b) => {
        b.profit = b.revenue - b.expenses;
      });
      return buckets;
    }

    // Monthly (6 months)
    const months: { key: string; label: string; revenue: number; expenses: number; profit: number; checkIns: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: 0,
        expenses: 0,
        profit: 0,
        checkIns: 0,
      });
    }
    invoices.forEach((inv) => {
      if (!inv.date) return;
      const b = months.find((m) => m.key === inv.date.slice(0, 7));
      if (b) b.revenue += getCollectedAmount(inv);
    });
    expenses.forEach((exp) => {
      if (!exp.date) return;
      const b = months.find((m) => m.key === exp.date.slice(0, 7));
      if (b) b.expenses += exp.amount;
    });
    attendanceRecords.forEach((att) => {
      if (att.status === 'Denied' || !att.date) return;
      const b = months.find((m) => m.key === att.date.slice(0, 7));
      if (b) b.checkIns += 1;
    });
    months.forEach((m) => {
      m.profit = m.revenue - m.expenses;
    });
    return months;
  }, [timeframe, invoices, expenses, attendanceRecords]);

  const memberDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    members
      .filter((m) => !m.archived)
      .forEach((m) => {
        const pkgName = packages.find((p) => p.id === m.packageId)?.name || 'Other';
        counts[pkgName] = (counts[pkgName] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [members, packages]);

  const expenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const outstandingInvoices = useMemo(
    () =>
      invoices
        .map((inv) => ({ ...inv, balance: getOutstandingAmount(inv) }))
        .filter((inv) => inv.balance > 0)
        .sort((a, b) => b.balance - a.balance),
    [invoices]
  );

  const staffPerformance = useMemo(
    () =>
      staff.map((s) => {
        const assignedCount = members.filter((m) => !m.archived && m.assignedTrainerId === s.id).length;
        return {
          ...s,
          liveClients: assignedCount > 0 ? assignedCount : s.activeClients || 0,
        };
      }),
    [staff, members]
  );

  const handleGenerateAISummary = async () => {
    setAiLoading(true);
    const res = await requestGymAI<AIReportSummary>('report_summary', {
      gymName: currentGym?.gymName || 'Fitness Future',
      timeframe,
      totalMembers: members.filter((m) => !m.archived).length,
      activeMembers: summary.activeMembers,
      expiredMembers: summary.expiredMembers,
      collectedRevenue: summary.revenue,
      outstandingBalances: summary.outstanding,
      totalExpenses: summary.totalExp,
      netProfit: summary.netProfit,
      profitMarginPercent: summary.profitMargin,
      leadsTotal: leads.length,
      leadsConverted: summary.convertedLeads,
      conversionRatePercent: summary.conversionRate,
      attendanceCheckIns: summary.grantedAttendance,
      staffCount: staff.length,
    });
    setAiLoading(false);
    if (res.success && res.data?.executiveSummary) {
      setAiSummary(res.data);
      addToast('AI Executive Summary generated from live database records.', 'success');
    } else {
      addToast(res.error || 'Could not generate AI summary right now.', 'error');
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Period', 'Collected Revenue (INR)', 'Expenses (INR)', 'Net Profit (INR)', 'Attendance Check-Ins'],
      ...financeTrend.map((r) => [
        `"${r.label}"`,
        String(r.revenue),
        String(r.expenses),
        String(r.profit),
        String(r.checkIns),
      ]),
      [],
      ['Outstanding Invoices', 'Member', 'Status', 'Total (INR)', 'Balance Due (INR)'],
      ...outstandingInvoices.map((inv) => [
        inv.invoiceNumber || inv.id,
        `"${inv.memberName}"`,
        inv.status,
        String(inv.amount),
        String(inv.balance),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-report-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Excel-compatible CSV report downloaded.', 'success');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const gymTitle = currentGym?.gymName || 'Fitness Future Gym';
    const reportDate = new Date().toISOString().split('T')[0];

    doc.setFontSize(16);
    doc.text(`${gymTitle} — Operations & Financial Report`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Timeframe: ${timeframe.toUpperCase()} | Generated: ${reportDate}`, 14, 25);

    autoTable(doc, {
      startY: 32,
      head: [['KPI Metric', 'Live Database Value']],
      body: [
        ['Active / Expired Members', `${summary.activeMembers} Active / ${summary.expiredMembers} Expired`],
        ['Collected Revenue', `INR ${summary.revenue.toLocaleString('en-IN')}`],
        ['Outstanding Dues', `INR ${summary.outstanding.toLocaleString('en-IN')}`],
        ['Operating Expenses', `INR ${summary.totalExp.toLocaleString('en-IN')}`],
        ['Net Profit / Margin', `INR ${summary.netProfit.toLocaleString('en-IN')} (${summary.profitMargin}%)`],
        ['Lead Conversion Rate', `${summary.conversionRate}% (${summary.convertedLeads}/${leads.length})`],
        ['Recorded Check-Ins', String(summary.grantedAttendance)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42] },
    });

    const afterSummaryY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 110;
    autoTable(doc, {
      startY: afterSummaryY,
      head: [['Period', 'Revenue (INR)', 'Expenses (INR)', 'Net Profit (INR)', 'Check-Ins']],
      body: financeTrend.map((r) => [
        r.label,
        r.revenue.toLocaleString('en-IN'),
        r.expenses.toLocaleString('en-IN'),
        r.profit.toLocaleString('en-IN'),
        String(r.checkIns),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [24, 24, 27] },
    });

    if (outstandingInvoices.length > 0) {
      const afterTrendY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 190;
      autoTable(doc, {
        startY: afterTrendY,
        head: [['Invoice', 'Member', 'Status', 'Total', 'Balance Due']],
        body: outstandingInvoices.slice(0, 12).map((inv) => [
          inv.invoiceNumber || inv.id,
          inv.memberName,
          inv.status,
          `INR ${inv.amount.toLocaleString('en-IN')}`,
          `INR ${inv.balance.toLocaleString('en-IN')}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [190, 18, 60] },
      });
    }

    doc.save(`gym-report-${timeframe}-${reportDate}.pdf`);
    addToast('PDF report exported successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Reports & Analytics</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Daily, weekly, and monthly financial P&amp;L, attendance trends, outstanding renewals, and staff performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex bg-[#111318] border border-white/10 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleGenerateAISummary}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer disabled:opacity-60"
          >
            {aiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiLoading ? 'Analyzing DB...' : 'AI Executive Summary'}
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-100 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Excel CSV
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* AI Generated Summary Banner (Grounded in Live DB) */}
      {aiSummary && (
        <div className="bg-[#111318] border border-amber-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>{aiSummary.headline || 'AI Executive Report Summary'}</span>
            </div>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider">Grounded in Live Database</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">{aiSummary.executiveSummary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase mb-1.5">Key Findings</div>
              <ul className="space-y-1 text-xs text-zinc-300 list-disc pl-4">
                {(aiSummary.keyFindings || []).map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-zinc-400 uppercase mb-1.5">Recommended Actions</div>
              <ul className="space-y-1 text-xs text-emerald-300 list-disc pl-4">
                {(aiSummary.recommendedActions || []).map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Financial & Operational KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Collected Revenue</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5 tabular-nums">
            ₹{summary.revenue.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-zinc-500 mt-1 tabular-nums">
            ₹{summary.outstanding.toLocaleString('en-IN')} pending
          </div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Operating Expenses</div>
          <div className="text-2xl font-bold text-rose-400 mt-1.5 tabular-nums">
            ₹{summary.totalExp.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-zinc-500 mt-1 tabular-nums">{expenses.length} ledger entries</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Net Profit</div>
          <div className={`text-2xl font-bold mt-1.5 tabular-nums ${summary.netProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
            ₹{summary.netProfit.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-zinc-500 mt-1 tabular-nums">Margin: {summary.profitMargin}%</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Admission Conversion</div>
          <div className="text-2xl font-bold text-amber-400 mt-1.5 tabular-nums">{summary.conversionRate}%</div>
          <div className="text-xs text-zinc-500 mt-1 tabular-nums">
            {summary.convertedLeads} of {leads.length} leads
          </div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Verified Check-Ins</div>
          <div className="text-2xl font-bold text-sky-400 mt-1.5 tabular-nums">{summary.grantedAttendance}</div>
          <div className="text-xs text-zinc-500 mt-1 tabular-nums">
            {summary.activeMembers} active · {summary.expiredMembers} expired
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses + Attendance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Revenue vs Expenses ({timeframe === 'daily' ? 'Last 7 Days' : timeframe === 'weekly' ? 'Last 8 Weeks' : 'Last 6 Months'})
            </h2>
            <Calendar className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financeTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                  formatter={(v: any) => `₹${Number(v || 0).toLocaleString('en-IN')}`}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.18} strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="#ef4444" fillOpacity={0.14} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-sky-400" />
            Attendance Trends
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financeTrend} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                />
                <Bar dataKey="checkIns" name="Check-Ins" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Member Distribution & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-sky-400" />
            Member Distribution by Package
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {memberDistribution.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {memberDistribution.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded bg-zinc-900">
                <span className="flex items-center gap-2 text-zinc-300 truncate">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-white tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-rose-400" />
            Expense Breakdown by Category
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseCategories} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" stroke="#71717a" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="category" stroke="#a1a1aa" fontSize={11} width={85} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                  formatter={(v: any) => `₹${Number(v || 0).toLocaleString('en-IN')}`}
                />
                <Bar dataKey="amount" name="Spend" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Outstanding Payments & Staff Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Outstanding Payments ({outstandingInvoices.length})
            </h2>
            <span className="text-xs font-semibold text-rose-400 tabular-nums">
              ₹{summary.outstanding.toLocaleString('en-IN')} due
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-900/60 text-zinc-400 border-b border-white/10">
                  <th className="py-2.5 px-4">Invoice</th>
                  <th className="py-2.5 px-4">Member</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {outstandingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-zinc-500">
                      All invoices are fully settled.
                    </td>
                  </tr>
                ) : (
                  outstandingInvoices.slice(0, 8).map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 font-mono text-zinc-300">{inv.invoiceNumber || inv.id}</td>
                      <td className="py-2.5 px-4 text-white font-medium">{inv.memberName}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-medium">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-rose-400 tabular-nums">
                        ₹{inv.balance.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Staff Performance &amp; Payroll
            </h2>
            <span className="text-xs text-zinc-400 tabular-nums">{staff.length} team members</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-zinc-900/60 text-zinc-400 border-b border-white/10">
                  <th className="py-2.5 px-4">Staff</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Clients</th>
                  <th className="py-2.5 px-4">Rating</th>
                  <th className="py-2.5 px-4 text-right">Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffPerformance.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 text-white font-medium">{s.name}</td>
                    <td className="py-2.5 px-4 text-amber-400">{s.role}</td>
                    <td className="py-2.5 px-4 text-zinc-300 tabular-nums">{s.liveClients}</td>
                    <td className="py-2.5 px-4 text-emerald-400 font-semibold tabular-nums">
                      {(s.rating || 4.8).toFixed(1)} ★
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-200 tabular-nums">
                      ₹{s.salary.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReports;
