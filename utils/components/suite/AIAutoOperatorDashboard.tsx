import React, { useMemo, useState } from 'react';
import {
  Users,
  IndianRupee,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Receipt,
  UserPlus,
  Star,
  Bell,
  CalendarCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { requestGymAI } from '../../aiGymClient';
import { View } from '../../../types';

interface DashboardProps {
  setCurrentView: (view: View) => void;
}

interface AIInsight {
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  actionLabel: string;
  targetView: string;
}

const formatINR = (val: number) => `₹${Math.round(val).toLocaleString('en-IN')}`;

const getCollected = (inv: { status: string; amount: number; paidAmount?: number }) => {
  if (inv.status === 'Refunded' || inv.status === 'Cancelled') return 0;
  if (typeof inv.paidAmount === 'number') return inv.paidAmount;
  return inv.status === 'Paid' ? inv.amount : 0;
};

const getBalance = (inv: { status: string; amount: number; paidAmount?: number; balanceAmount?: number }) => {
  if (inv.status === 'Paid' || inv.status === 'Refunded' || inv.status === 'Cancelled') return 0;
  if (typeof inv.balanceAmount === 'number') return inv.balanceAmount;
  return Math.max(0, inv.amount - getCollected(inv));
};

export const AIAutoOperatorDashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
  const { members, invoices, expenses, attendanceRecords, leads, reviews, offers } = useData();
  const { currentGym } = useGym();

  const [aiInsights, setAiInsights] = useState<AIInsight[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const visibleMembers = members.filter((m) => !m.archived);
    const activeMembers = visibleMembers.filter((m) => m.status === 'Active').length;
    const expiredMembers = visibleMembers.filter((m) => m.status === 'Expired').length;
    const pendingMembers = visibleMembers.filter((m) => m.status === 'Pending').length;
    const todaysAdmissions = visibleMembers.filter((m) => m.joinDate === today).length;
    const expiringSoonCount = visibleMembers.filter(
      (m) => m.status === 'Active' && m.expiryDate && m.expiryDate >= today && m.expiryDate <= in7Days
    ).length;

    const paidRevenue = invoices.reduce((sum, i) => sum + getCollected(i), 0);
    const todaysCollections = invoices
      .filter((i) => i.date === today)
      .reduce((sum, i) => sum + getCollected(i), 0);
    const pendingDues = invoices.reduce((sum, i) => sum + getBalance(i), 0);
    const overdueCount = invoices.filter((i) => i.status === 'Overdue' || i.status === 'Partial').length;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const todayCheckIns = attendanceRecords.filter((a) => a.date === today && a.status !== 'Denied').length;
    const todayDenied = attendanceRecords.filter((a) => a.date === today && a.status === 'Denied').length;
    const currentlyInGym = attendanceRecords.filter(
      (a) => a.date === today && a.status === 'Checked In'
    ).length;

    const openLeads = leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost').length;
    const pendingReviews = reviews.filter((r) => r.status === 'Pending').length;
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    return {
      totalMembers: visibleMembers.length,
      activeMembers,
      expiredMembers,
      pendingMembers,
      todaysAdmissions,
      expiringSoonCount,
      paidRevenue,
      todaysCollections,
      pendingDues,
      overdueCount,
      totalExpenses,
      netProfit: paidRevenue - totalExpenses,
      todayCheckIns,
      todayDenied,
      currentlyInGym,
      openLeads,
      pendingReviews,
      avgRating,
      activeOffers: offers.filter((o) => o.status === 'Active').length,
    };
  }, [members, invoices, expenses, attendanceRecords, leads, reviews, offers]);

  // Operational Alerts Banner items derived strictly from live state
  const operationalAlerts = useMemo(() => {
    const alerts: { id: string; severity: 'rose' | 'amber' | 'sky'; text: string; target: View; cta: string }[] = [];
    if (metrics.overdueCount > 0 || metrics.pendingDues > 0) {
      alerts.push({
        id: 'dues',
        severity: 'rose',
        text: `${formatINR(metrics.pendingDues)} outstanding across pending/partial/overdue invoices.`,
        target: 'billing',
        cta: 'Open Billing',
      });
    }
    if (metrics.expiredMembers > 0 || metrics.expiringSoonCount > 0) {
      alerts.push({
        id: 'expiry',
        severity: 'amber',
        text: `${metrics.expiredMembers} expired and ${metrics.expiringSoonCount} membership(s) expiring within 7 days.`,
        target: 'members',
        cta: 'Review Renewals',
      });
    }
    if (metrics.todayDenied > 0) {
      alerts.push({
        id: 'denied',
        severity: 'rose',
        text: `${metrics.todayDenied} denied gate check-in attempt(s) logged today due to invalid/expired membership.`,
        target: 'attendance',
        cta: 'Inspect Access Log',
      });
    }
    return alerts;
  }, [metrics]);

  // Build clean 6-month Revenue vs Expenses chart from actual invoices & expenses
  const monthlyFinanceChart = useMemo(() => {
    const months: { key: string; label: string; revenue: number; expenses: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      months.push({ key, label, revenue: 0, expenses: 0 });
    }

    invoices.forEach((inv) => {
      if (!inv.date) return;
      const monthKey = inv.date.slice(0, 7);
      const bucket = months.find((m) => m.key === monthKey);
      if (bucket) bucket.revenue += getCollected(inv);
    });

    expenses.forEach((exp) => {
      if (!exp.date) return;
      const monthKey = exp.date.slice(0, 7);
      const bucket = months.find((m) => m.key === monthKey);
      if (bucket) bucket.expenses += exp.amount;
    });

    return months;
  }, [invoices, expenses]);

  const memberStatusData = useMemo(() => {
    const visible = members.filter((m) => !m.archived);
    return [
      { status: 'Active', count: visible.filter((m) => m.status === 'Active').length, color: '#10b981' },
      { status: 'Pending', count: visible.filter((m) => m.status === 'Pending').length, color: '#f59e0b' },
      { status: 'Expired', count: visible.filter((m) => m.status === 'Expired').length, color: '#ef4444' },
      { status: 'Inactive', count: visible.filter((m) => m.status === 'Inactive').length, color: '#64748b' },
    ];
  }, [members]);

  // Live operational insights computed directly from real DB tables
  const liveInsights: AIInsight[] = useMemo(() => {
    const list: AIInsight[] = [];
    if (metrics.pendingDues > 0) {
      list.push({
        title: `${formatINR(metrics.pendingDues)} in Pending & Partial Billing`,
        detail: `${metrics.overdueCount} overdue or partial invoice(s) need payment follow-up via UPI or WhatsApp reminder.`,
        priority: 'high',
        actionLabel: 'Collect Dues',
        targetView: 'billing',
      });
    }
    if (metrics.openLeads > 0) {
      list.push({
        title: `${metrics.openLeads} Active Leads Waiting in Pipeline`,
        detail: 'Follow up with trial & warm leads today to convert them into annual value memberships.',
        priority: 'medium',
        actionLabel: 'Open Leads',
        targetView: 'leads',
      });
    }
    if (metrics.pendingReviews > 0) {
      list.push({
        title: `${metrics.pendingReviews} Member Review(s) Need Reply`,
        detail: `Current average rating is ${metrics.avgRating}/5. Draft responses and maintain member trust.`,
        priority: 'medium',
        actionLabel: 'Reply to Reviews',
        targetView: 'reviews',
      });
    }
    if (metrics.expiredMembers > 0 || metrics.pendingMembers > 0) {
      list.push({
        title: `${metrics.expiredMembers + metrics.pendingMembers} Memberships Require Renewal or Activation`,
        detail: 'Offer an annual renewal discount to re-activate expired members and stabilize cashflow.',
        priority: 'low',
        actionLabel: 'Manage Members',
        targetView: 'members',
      });
    }
    return list.slice(0, 4);
  }, [metrics]);

  const displayedInsights = aiInsights && aiInsights.length > 0 ? aiInsights : liveInsights;

  const handleGenerateAIInsights = async () => {
    setAiLoading(true);
    setAiError(null);
    const res = await requestGymAI<{ insights: AIInsight[] }>('dashboard_insights', {
      activeMembers: metrics.activeMembers,
      expiredMembers: metrics.expiredMembers,
      todaysAdmissions: metrics.todaysAdmissions,
      todaysCollections: metrics.todaysCollections,
      revenue: metrics.paidRevenue,
      pendingDues: metrics.pendingDues,
      expenses: metrics.totalExpenses,
      openLeads: metrics.openLeads,
      pendingReviews: metrics.pendingReviews,
    });
    setAiLoading(false);
    if (res.success && Array.isArray(res.data?.insights) && res.data.insights.length > 0) {
      setAiInsights(res.data.insights);
    } else {
      setAiError(res.error || 'Could not generate AI insights right now.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AI Auto Operator Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {currentGym?.gymName || 'Fitness Future'} — Live membership, collections, attendance, and operational insights
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setCurrentView('admission')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-100 text-sm font-medium transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            New Admission
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('billing')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Live Alerts & Notifications Strip */}
      {operationalAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {operationalAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`px-4 py-3 rounded-xl border flex items-center justify-between gap-3 ${
                alert.severity === 'rose'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2.5 text-xs">
                {alert.severity === 'rose' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <Bell className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <span>{alert.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentView(alert.target)}
                className="text-xs font-semibold whitespace-nowrap underline hover:text-white cursor-pointer"
              >
                {alert.cta}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Active Members</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tabular-nums">{metrics.activeMembers}</span>
            <span className="text-xs text-zinc-400 tabular-nums">of {metrics.totalMembers}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {metrics.pendingMembers} pending · {metrics.expiredMembers} expired
          </p>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Today&apos;s Desk</span>
            <CalendarCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tabular-nums">
              {formatINR(metrics.todaysCollections)}
            </span>
          </div>
          <p className="text-xs text-emerald-400/90 mt-2 tabular-nums">
            {metrics.todaysAdmissions} new admission(s) today
          </p>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Collected Revenue</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tabular-nums">{formatINR(metrics.paidRevenue)}</span>
          </div>
          <p className="text-xs text-amber-400/90 mt-2 tabular-nums">
            {formatINR(metrics.pendingDues)} outstanding · Net {formatINR(metrics.netProfit)}
          </p>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Today&apos;s Attendance</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tabular-nums">{metrics.todayCheckIns}</span>
            <span className="text-xs text-emerald-400 font-medium tabular-nums">
              {metrics.currentlyInGym} on floor
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 tabular-nums">
            {metrics.todayDenied > 0 ? `${metrics.todayDenied} denied gate attempt(s)` : 'QR & access desk active'}
          </p>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Rating &amp; Leads</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold text-white tabular-nums flex items-center gap-1.5">
              {metrics.avgRating}
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </span>
            <span className="text-xs text-zinc-400 tabular-nums">{metrics.openLeads} open leads</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {metrics.activeOffers} active offers running
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Revenue vs Expenses (Last 6 Months)</h2>
              <p className="text-xs text-zinc-400">Live figures aggregated from billing collections and expense ledger</p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentView('reports')}
              className="text-xs font-medium text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
            >
              Full Reports <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyFinanceChart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="label" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                  formatter={(value: any) => formatINR(Number(value || 0))}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#revGrad)" />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-white">Member Status Breakdown</h2>
            <p className="text-xs text-zinc-400">Live count by account standing</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberStatusData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="status" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                />
                <Bar dataKey="count" name="Members" radius={[6, 6, 0, 0]}>
                  {memberStatusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Auto Operator Insights Panel */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">AI Auto Operator Insights</h2>
              <p className="text-xs text-zinc-400">Actionable recommendations prioritized from your live gym metrics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateAIInsights}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-zinc-100 text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiLoading ? 'Analyzing Metrics...' : 'Refresh with AI'}
          </button>
        </div>

        {aiError && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{aiError} Showing real-time operational insights from your gym database.</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedInsights.map((item, idx) => (
            <div
              key={`${item.title}-${idx}`}
              className="p-4 rounded-lg bg-zinc-900/70 border border-white/10 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                      item.priority === 'high'
                        ? 'bg-rose-500/15 text-rose-300'
                        : item.priority === 'medium'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-sky-500/15 text-sky-300'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{item.detail}</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setCurrentView(item.targetView)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  {item.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAutoOperatorDashboard;
