import React, { useState, useMemo, useEffect } from 'react';
import {
  Bot,
  Settings,
  LayoutDashboard,
  Package,
  Users,
  Receipt,
  CreditCard,
  Target,
  Dumbbell,
  Utensils,
  UserCog,
  TrendingDown,
  BarChart3,
  ScanFace,
  Layers,
  FileText,
  MessageSquare,
  Globe,
  Play,
  Pause,
  Edit3,
  Send,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Languages,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../context/DataProvider';
import {
  useAutomationStore,
  bi,
  AutomationChannel,
  AutomationOverrideLog,
} from '../store/useAutomationStore';
import { useToast } from '../hooks/useToast';
import { View } from '../../types';
import FeatureImage from './common/FeatureImage';
import { MODULE_MEDIA_BY_NUM } from '../data/featureMedia';

interface FullAutomationHubProps {
  setCurrentView?: (view: View) => void;
  currentUser?: any;
}

type HubTab =
  | 'suite'
  | 'auto_operator'
  | 'ai_settings'
  | 'finance_ai'
  | 'reports'
  | 'override_logs';

interface OperatorAction {
  id: string;
  category: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  detail: string;
  suggestedMessage: string;
}

const FullAutomationHub: React.FC<FullAutomationHubProps> = ({
  setCurrentView,
  currentUser,
}) => {
  const {
    members,
    packages,
    invoices,
    leads,
    staff,
    expenses,
    attendanceRecords,
  } = useData();
  const { addToast } = useToast();

  const {
    language,
    toggleLanguage,
    settings,
    logs,
    pausedChannels,
    updateSettings,
    toggleChannelPause,
    addLog,
    pauseLog,
    overrideLogMessage,
    hydrateFromCloud,
  } = useAutomationStore();

  const [activeTab, setActiveTab] = useState<HubTab>('suite');
  const [operatorLoading, setOperatorLoading] = useState(false);
  const [operatorSummary, setOperatorSummary] = useState<string>('');
  const [operatorActions, setOperatorActions] = useState<OperatorAction[]>([]);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  // Finance AI state (#06 Smart Billing + #12 Smart Expenses)
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingInsights, setBillingInsights] = useState<any>(null);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesAudit, setExpensesAudit] = useState<any>(null);

  // Manual Override editor state
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [overrideDraft, setOverrideDraft] = useState<string>('');
  const [logChannelFilter, setLogChannelFilter] = useState<'ALL' | AutomationChannel>('ALL');

  useEffect(() => {
    void hydrateFromCloud();
  }, [hydrateFromCloud]);

  const todayIso = new Date().toISOString().slice(0, 10);

  const metrics = useMemo(() => {
    const activeMembers = members.filter((m) => m.status === 'Active').length;
    const paidRevenue = invoices
      .filter((i) => i.status === 'Paid')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const pendingInvoices = invoices.filter(
      (i) => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Verification Pending'
    );
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const todayPresent = attendanceRecords.filter(
      (r) => r.date === todayIso && r.status === 'Present'
    ).length;
    const openLeads = leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost').length;
    const netProfit = paidRevenue - totalExpenses;
    const marginPercent = paidRevenue > 0 ? Math.round((netProfit / paidRevenue) * 100) : 0;

    return {
      totalMembers: members.length,
      activeMembers,
      paidRevenue,
      pendingAmount,
      pendingCount: pendingInvoices.length,
      totalExpenses,
      netProfit,
      marginPercent,
      todayPresent,
      openLeads,
      totalPackages: packages.length,
      totalStaff: staff.length,
    };
  }, [members, invoices, expenses, attendanceRecords, leads, packages, staff, todayIso]);

  const navigateTo = (view: View) => {
    if (setCurrentView) {
      setCurrentView(view);
    }
  };

  // All 18 requested modules mapped directly to live workspaces or built-in tabs
  const all18Modules = useMemo(
    () => [
      {
        num: '01',
        en: 'Auto Operations Hub',
        hi: 'ऑटो ऑपरेशंस हब',
        metric: settings.autoOperatorEnabled ? 'AUTO ON' : 'MANUAL',
        icon: Layers,
        onOpen: () => setActiveTab('auto_operator'),
      },
      {
        num: '02',
        en: 'Smart App Settings',
        hi: 'स्मार्ट ऐप सेटिंग्स',
        metric: `${settings.replyLanguage.toUpperCase()} · ${settings.gstRatePercent}% GST`,
        icon: Settings,
        onOpen: () => setActiveTab('ai_settings'),
      },
      {
        num: '03',
        en: 'Full Automation Dashboard',
        hi: 'फुल ऑटोमेशन डैशबोर्ड',
        metric: `${logs.length} ${bi(language, 'Events', 'इवेंट्स')}`,
        icon: LayoutDashboard,
        onOpen: () => navigateTo('dashboard'),
      },
      {
        num: '04',
        en: 'Packages',
        hi: 'पैकेज प्रबंधन',
        metric: `${metrics.totalPackages} ${bi(language, 'Plans', 'प्लान्स')}`,
        icon: Package,
        onOpen: () => navigateTo('packages'),
      },
      {
        num: '05',
        en: 'Members',
        hi: 'मेंबर्स डेटाबेस',
        metric: `${metrics.totalMembers} ${bi(language, 'Total', 'कुल')}`,
        icon: Users,
        onOpen: () => navigateTo('members'),
      },
      {
        num: '06',
        en: 'Smart Billing & GST',
        hi: 'स्मार्ट बिलिंग व GST',
        metric: `₹${metrics.paidRevenue.toLocaleString('en-IN')}`,
        icon: Receipt,
        onOpen: () => navigateTo('billing'),
      },
      {
        num: '07',
        en: 'Memberships',
        hi: 'मेंबरशिप नियंत्रण',
        metric: `${metrics.activeMembers} ${bi(language, 'Active', 'सक्रिय')}`,
        icon: CreditCard,
        onOpen: () => navigateTo('adminPortal'),
      },
      {
        num: '08',
        en: 'Automated Leads Pipeline',
        hi: 'ऑटोमेटेड लीड्स पाइपलाइन',
        metric: `${metrics.openLeads} ${bi(language, 'Open', 'ओपन')}`,
        icon: Target,
        onOpen: () => navigateTo('leads'),
      },
      {
        num: '09',
        en: 'Pro Workout Engine',
        hi: 'प्रो वर्कआउट इंजन',
        metric: bi(language, 'Overload + Form', 'ओवरलोड + फॉर्म'),
        icon: Dumbbell,
        onOpen: () => navigateTo('workouts'),
      },
      {
        num: '10',
        en: 'Regional Smart Diet Plans',
        hi: 'स्मार्ट भारतीय डाइट प्लान्स',
        metric: bi(language, 'Regional Indian', 'भारतीय क्षेत्रीय'),
        icon: Utensils,
        onOpen: () => navigateTo('diet'),
      },
      {
        num: '11',
        en: 'Staff & Shift Management',
        hi: 'स्टाफ व शिफ्ट मैनेजमेंट',
        metric: `${metrics.totalStaff} ${bi(language, 'Staff', 'स्टाफ')}`,
        icon: UserCog,
        onOpen: () => navigateTo('staff'),
      },
      {
        num: '12',
        en: 'Smart Expense Auditor',
        hi: 'स्मार्ट खर्च प्रबंधन',
        metric: `₹${metrics.totalExpenses.toLocaleString('en-IN')}`,
        icon: TrendingDown,
        onOpen: () => navigateTo('expenses'),
      },
      {
        num: '13',
        en: 'Executive Performance Reports',
        hi: 'एग्जीक्यूटिव परफॉर्मेंस रिपोर्ट्स',
        metric: `${metrics.marginPercent}% ${bi(language, 'Margin', 'मार्जिन')}`,
        icon: BarChart3,
        onOpen: () => setActiveTab('reports'),
      },
      {
        num: '14',
        en: 'Hybrid Geometric Attendance',
        hi: 'हाइब्रिड ज्योमेट्रिक अटेंडेंस',
        metric: `${metrics.todayPresent} ${bi(language, 'Present', 'उपस्थित')}`,
        icon: ScanFace,
        onOpen: () => navigateTo('adminAttendance'),
      },
      {
        num: '15',
        en: 'Complete Club Management',
        hi: 'संपूर्ण क्लब मैनेजमेंट',
        metric: currentUser?.type === 'super_admin' ? 'OWNER MASTER' : 'ADMIN PORTAL',
        icon: Layers,
        onOpen: () =>
          navigateTo(currentUser?.type === 'super_admin' ? 'threeTierEngine' : 'adminPortal'),
      },
      {
        num: '16',
        en: 'Scientific Admission Form',
        hi: 'साइंटिफिक एडमिशन फॉर्म',
        metric: bi(language, 'Bio + OCR Intake', 'बायो + OCR'),
        icon: FileText,
        onOpen: () => navigateTo('scientificAdmissionForm'),
      },
      {
        num: '17',
        en: 'WhatsApp Business Automation',
        hi: 'व्हाट्सएप बिजनेस ऑटोमेशन',
        metric: pausedChannels.WHATSAPP
          ? 'PAUSED'
          : settings.whatsappAutoSend
            ? 'LIVE AUTO'
            : 'MANUAL',
        icon: MessageSquare,
        onOpen: () => navigateTo('whatsapp'),
      },
      {
        num: '18',
        en: 'Google Business Full Automation',
        hi: 'गूगल बिजनेस फुल ऑटोमेशन',
        metric: pausedChannels.GOOGLE_BUSINESS
          ? 'PAUSED'
          : settings.googleBusinessAutoReply
            ? 'LIVE AUTO'
            : 'MANUAL',
        icon: Globe,
        onOpen: () => navigateTo('googleBusiness'),
      },
    ],
    [metrics, settings, pausedChannels, logs.length, language, currentUser?.type]
  );

  // Module #01: Execute live server-side AI Auto Operator sweep
  const runAutoOperatorSweep = async () => {
    setOperatorLoading(true);
    try {
      const overdueMembers = invoices
        .filter((i) => i.status === 'Overdue' || i.status === 'Pending')
        .map((i) => ({ memberName: i.memberName, amount: i.amount, status: i.status }));
      const hotLeads = leads
        .filter((l) => l.status === 'New' || l.status === 'Contacted')
        .map((l) => ({ name: l.name, phone: l.phone, status: l.status, aiScore: l.aiScore }));
      const inactiveMembers = members
        .filter((m) => m.status !== 'Active')
        .map((m) => ({ name: m.name, phone: m.phone, status: m.status }));

      const res = await fetch('/api/ai/auto-operator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          tone: settings.replyTone,
          metrics,
          overdueMembers,
          hotLeads,
          inactiveMembers,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Auto Operator sweep failed');
      }
      setOperatorSummary(data.result?.executiveSummary || '');
      setOperatorActions(Array.isArray(data.result?.priorityActions) ? data.result.priorityActions : []);
      await addLog({
        channel: 'AUTO_OPERATOR',
        target: 'Club Operations Sweep',
        summary: `Operations Sweep analyzed ${metrics.totalMembers} members, ${metrics.pendingCount} due invoices, ${metrics.openLeads} leads`,
        messageBody: data.result?.executiveSummary || 'Operational sweep completed.',
        status: 'AUTO_SENT',
        providerStatus: 'Fitness Future Engine',
      });
      addToast(
        bi(language, 'Auto Operations sweep complete.', 'ऑटो ऑपरेशंस विश्लेषण पूरा हुआ।'),
        'success'
      );
    } catch (err: any) {
      addToast(err?.message || 'Operations sweep error', 'error');
    } finally {
      setOperatorLoading(false);
    }
  };

  // Dispatch an Operator recommended message via WhatsApp Live Webhook
  const handleDispatchOperatorAction = async (action: OperatorAction) => {
    setExecutingActionId(action.id);
    try {
      const targetPhone =
        leads.find((l) => l.status === 'New')?.phone ||
        members[0]?.phone ||
        '9800000000';
      const targetName =
        leads.find((l) => l.status === 'New')?.name ||
        members[0]?.name ||
        'Club Member';

      const resp = await fetch('/api/ai/whatsapp/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          recipientName: targetName,
          intent: action.category.toLowerCase(),
          customBody: action.suggestedMessage,
          autoSend: settings.whatsappAutoSend,
          paused: pausedChannels.WHATSAPP,
          language: settings.replyLanguage,
          tone: settings.replyTone,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        throw new Error(data.error || 'Dispatch failed');
      }

      await addLog({
        channel: 'WHATSAPP',
        target: `${targetName} (${data.recipient})`,
        summary: `Operator Action · ${action.title}`,
        messageBody: data.messageBody,
        status: data.deliveryStatus,
        providerStatus: data.providerStatus,
      });

      addToast(
        bi(
          language,
          `Action logged (${data.deliveryStatus}) in Manual Override Audit Log.`,
          `एक्शन सफलतापूर्वक मैनुअल ओवरराइड लॉग में दर्ज हुआ (${data.deliveryStatus})।`
        ),
        'success'
      );
    } catch (err: any) {
      addToast(err?.message || 'Failed to dispatch action', 'error');
    } finally {
      setExecutingActionId(null);
    }
  };

  const runSmartBillingAnalysis = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/ai/smart-billing-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          totalRevenue: metrics.paidRevenue,
          pendingAmount: metrics.pendingAmount,
          overdueCount: metrics.pendingCount,
          gstRate: settings.gstRatePercent,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Smart billing analysis failed');
      setBillingInsights(data.insights);
      await addLog({
        channel: 'SMART_BILLING',
        target: 'GST & Billing Ledger',
        summary: data.insights?.headline || 'Billing audit completed',
        messageBody: data.insights?.reminderTemplate || '',
        status: 'AUTO_SENT',
        providerStatus: 'Fitness Future Billing Engine',
      });
      addToast(bi(language, 'Smart Billing audit complete.', 'स्मार्ट बिलिंग विश्लेषण पूरा हुआ।'), 'success');
    } catch (err: any) {
      addToast(err?.message || 'Billing analysis failed', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  const runSmartExpensesAudit = async () => {
    setExpensesLoading(true);
    try {
      const res = await fetch('/api/ai/smart-expenses-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          expenses,
          totalRevenue: metrics.paidRevenue,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Expenses audit failed');
      setExpensesAudit(data.audit);
      addToast(bi(language, 'Smart Expenses audit complete.', 'स्मार्ट खर्च ऑडिट पूरा हुआ।'), 'success');
    } catch (err: any) {
      addToast(err?.message || 'Expenses audit failed', 'error');
    } finally {
      setExpensesLoading(false);
    }
  };

  // Module #13: Export Full CSV Report
  const handleExportCsvReport = () => {
    const rows = [
      ['Metric', 'Value', 'Date'],
      ['Total Members', String(metrics.totalMembers), todayIso],
      ['Active Members', String(metrics.activeMembers), todayIso],
      ['Paid Revenue (INR)', String(metrics.paidRevenue), todayIso],
      ['Pending/Overdue Billing (INR)', String(metrics.pendingAmount), todayIso],
      ['Total Expenses (INR)', String(metrics.totalExpenses), todayIso],
      ['Net Profit (INR)', String(metrics.netProfit), todayIso],
      ['Net Margin (%)', `${metrics.marginPercent}%`, todayIso],
      ['Attendance Present Today', String(metrics.todayPresent), todayIso],
      ['Open Leads', String(metrics.openLeads), todayIso],
      ['Automation Audit Events', String(logs.length), todayIso],
    ];
    const csvContent = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fitness-future-report-${todayIso}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    addToast(bi(language, 'Operations CSV Report exported.', 'ऑपरेशंस CSV रिपोर्ट डाउनलोड हो गई।'), 'success');
  };

  const handleSaveOverrideAndResend = async (log: AutomationOverrideLog) => {
    const body = overrideDraft.trim();
    if (!body) return;

    if (log.channel === 'WHATSAPP') {
      await fetch('/api/ai/whatsapp/auto-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: log.target.replace(/\D/g, ''),
          recipientName: log.target,
          customBody: body,
          autoSend: true,
          paused: false,
        }),
      }).catch(() => {});
    } else if (log.channel === 'GOOGLE_BUSINESS') {
      await fetch('/api/ai/google-business/auto-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'review',
          author: log.target,
          customReply: body,
          autoSend: true,
          paused: false,
        }),
      }).catch(() => {});
    }

    await overrideLogMessage(log.id, body, currentUser?.name || 'Admin Staff', 'OVERRIDDEN');
    setEditingLogId(null);
    setOverrideDraft('');
    addToast(
      bi(language, 'Manual override saved & dispatched.', 'मैनुअल ओवरराइड सेव व डिस्पैच किया गया।'),
      'success'
    );
  };

  const filteredLogs = useMemo(() => {
    if (logChannelFilter === 'ALL') return logs;
    return logs.filter((l) => l.channel === logChannelFilter);
  }, [logs, logChannelFilter]);

  return (
    <div
      className="space-y-6 pb-20 text-[#F8FAFC]"
      style={{
        fontFamily:
          "'Plus Jakarta Sans', 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* COMMAND HEADER */}
      <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-amber-400">
            {bi(
              language,
              'Fitness Future · 18-Module Full Automation Suite',
              'फिटनेस फ्यूचर · 18-मॉड्यूल फुल ऑटोमेशन सूट'
            )}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1"
            style={{ fontFamily: "'Barlow Condensed', 'Noto Sans Devanagari', sans-serif" }}
          >
            {bi(
              language,
              'Full Automation Command Center',
              'फुल ऑटोमेशन कमांड सेंटर'
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {bi(
              language,
              'Unified control over all 18 club operations, live webhooks, billing audits, and manual override governance.',
              'सभी 18 क्लब ऑपरेशंस, लाइव वेबहुक, स्मार्ट बिलिंग और मैनुअल ओवरराइड नियंत्रण एक ही स्क्रीन पर।'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[#09090B] border border-white/[0.12] text-xs font-semibold text-slate-200 hover:border-amber-400/60 transition-colors cursor-pointer"
          >
            <Languages className="w-4 h-4 text-amber-400" />
            <span>{language === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('auto_operator');
              void runAutoOperatorSweep();
            }}
            disabled={operatorLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            {operatorLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{bi(language, 'Run Auto Operations', 'ऑटो ऑपरेशंस चलाएँ')}</span>
          </button>
        </div>
      </div>

      {/* KEY LIVE METRICS STRIP (TABULAR-NUMS) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: bi(language, 'Active Members', 'सक्रिय मेंबर्स'),
            val: `${metrics.activeMembers} / ${metrics.totalMembers}`,
            accent: 'text-white',
          },
          {
            label: bi(language, 'Collected Revenue', 'कुल राजस्व'),
            val: `₹${metrics.paidRevenue.toLocaleString('en-IN')}`,
            accent: 'text-emerald-400',
          },
          {
            label: bi(language, 'Pending / Overdue', 'बकाया बिलिंग'),
            val: `₹${metrics.pendingAmount.toLocaleString('en-IN')}`,
            accent: metrics.pendingAmount > 0 ? 'text-amber-400' : 'text-slate-300',
          },
          {
            label: bi(language, 'Net Profit Margin', 'नेट प्रॉफिट मार्जिन'),
            val: `${metrics.marginPercent}%`,
            accent: metrics.marginPercent >= 0 ? 'text-emerald-400' : 'text-red-400',
          },
          {
            label: bi(language, 'Present Today · Open Leads', 'आज उपस्थित · लीड्स'),
            val: `${metrics.todayPresent} · ${metrics.openLeads}`,
            accent: 'text-white',
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[#111114] border border-white/[0.08] rounded-xl p-4"
          >
            <p className="text-xs text-slate-400 truncate">{kpi.label}</p>
            <p className={`text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1.5 ${kpi.accent}`}>
              {kpi.val}
            </p>
          </div>
        ))}
      </div>

      {/* SECTION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
        {(
          [
            { id: 'suite', en: 'All 18 Modules', hi: 'सभी 18 मॉड्यूल' },
            { id: 'auto_operator', en: '#01 Auto Operations', hi: '#01 ऑटो ऑपरेशंस' },
            { id: 'ai_settings', en: '#02 Smart Settings', hi: '#02 स्मार्ट सेटिंग्स' },
            { id: 'finance_ai', en: '#06 & #12 Billing + Expenses', hi: '#06 व #12 बिलिंग + खर्च' },
            { id: 'reports', en: '#13 Executive Reports', hi: '#13 एग्जीक्यूटिव रिपोर्ट्स' },
            {
              id: 'override_logs',
              en: `Override Audit Log (${logs.length})`,
              hi: `ओवरराइड लॉग (${logs.length})`,
            },
          ] as { id: HubTab; en: string; hi: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'bg-[#111114] text-slate-300 border border-white/[0.08] hover:text-white'
            }`}
          >
            {bi(language, tab.en, tab.hi)}
          </button>
        ))}
      </div>

      {/* TAB 1: ALL 18 MODULES DIRECTORY */}
      {activeTab === 'suite' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {all18Modules.map((mod) => {
            const Icon = mod.icon;
            const media = MODULE_MEDIA_BY_NUM[mod.num];
            return (
              <button
                key={mod.num}
                type="button"
                onClick={mod.onOpen}
                className="text-left bg-[#111114] hover:bg-[#16161B] border border-white/[0.08] hover:border-amber-500/45 rounded-xl overflow-hidden transition-colors flex flex-col justify-between cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                {media && (
                  <FeatureImage
                    src={media.image}
                    alt={media.alt}
                    aspectClassName="aspect-[16/10]"
                    className="group-hover:scale-[1.04]"
                    fallbackTitle={bi(language, mod.en, mod.hi)}
                  >
                    <div className="absolute left-3.5 bottom-3 flex items-center gap-2 text-[11px] font-mono text-amber-300 tabular-nums">
                      <span>MODULE #{mod.num}</span>
                    </div>
                  </FeatureImage>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#09090B] border border-white/[0.08] flex items-center justify-center text-amber-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                          {bi(language, mod.en, mod.hi)}
                        </h3>
                        {media && (
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {bi(language, media.captionEn, media.captionHi)}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 transition-colors" />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs font-mono tabular-nums">
                    <span className="text-slate-400 truncate pr-2">{mod.metric}</span>
                    <span className="text-amber-400 font-semibold shrink-0">
                      {bi(language, 'Open', 'खोलें')}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 2: #01 AI AUTO OPERATOR */}
      {activeTab === 'auto_operator' && (
        <div className="space-y-5">
          <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">
                {bi(language, 'Automated Operations Sweep', 'ऑटोमेटेड ऑपरेशंस स्वीप')}
              </h2>
              <p className="text-sm text-slate-400">
                {bi(
                  language,
                  'Audits overdue invoices, inactive churn-risk members, and new leads and prepares ready-to-dispatch WhatsApp actions.',
                  'बकाया बिल, अनुपस्थित मेंबर्स और नई लीड्स का विश्लेषण कर तुरंत व्हाट्सएप एक्शन प्लान तैयार करता है।'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={runAutoOperatorSweep}
              disabled={operatorLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0"
            >
              {operatorLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>
                {operatorLoading
                  ? bi(language, 'Analyzing Records...', 'विश्लेषण जारी है...')
                  : bi(language, 'Run Operations Sweep', 'अभी स्वीप चलाएँ')}
              </span>
            </button>
          </div>

          {operatorSummary && (
            <div className="bg-[#111114] border border-amber-500/30 rounded-xl p-5">
              <p className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">
                {bi(language, 'Executive Summary', 'एग्जीक्यूटिव सारांश')}
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">{operatorSummary}</p>
            </div>
          )}

          {operatorActions.length === 0 ? (
            <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-10 text-center space-y-3">
              <Layers className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">
                {bi(
                  language,
                  'No active sweep results yet. Run Auto Operations to evaluate your live club records.',
                  'अभी कोई स्वीप परिणाम नहीं है। लाइव डेटा का विश्लेषण करने के लिए ऑटो ऑपरेशंस चलाएँ।'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {operatorActions.map((act) => (
                <div
                  key={act.id}
                  className="bg-[#111114] border border-white/[0.08] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span
                        className={`font-bold ${
                          act.severity === 'HIGH'
                            ? 'text-red-400'
                            : act.severity === 'MEDIUM'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                        }`}
                      >
                        {act.severity}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{act.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-white">{act.title}</h3>
                    <p className="text-sm text-slate-300">{act.detail}</p>
                    <p className="text-xs font-mono text-slate-400 bg-[#09090B] border border-white/[0.06] rounded-md p-3">
                      {act.suggestedMessage}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={executingActionId === act.id}
                      onClick={() => handleDispatchOperatorAction(act)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{bi(language, 'Dispatch WhatsApp', 'व्हाट्सएप भेजें')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOperatorActions((prev) => prev.filter((item) => item.id !== act.id))
                      }
                      className="px-3.5 py-2.5 rounded-md bg-[#09090B] border border-white/[0.1] text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                    >
                      {bi(language, 'Dismiss', 'हटाएँ')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: #02 SMART AI SETTINGS (PERSISTED TO FIRESTORE) */}
      {activeTab === 'ai_settings' && (
        <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                {bi(language, 'Smart Settings & Automation Governance', 'स्मार्ट सेटिंग्स व ऑटोमेशन नियंत्रण')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {bi(
                  language,
                  'All rules synchronize to Cloud Firestore and immediately govern WhatsApp & Google Business webhooks.',
                  'सभी नियम क्लाउड फायरस्टोर में सेव होते हैं और व्हाट्सएप व गूगल बिजनेस वेबहुक को तुरंत नियंत्रित करते हैं।'
                )}
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Cloud Synced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(
              [
                {
                  key: 'autoOperatorEnabled',
                  en: 'Auto Operations Scheduled Sweeps',
                  hi: 'ऑटो ऑपरेशंस स्वीप सक्रिय करें',
                },
                {
                  key: 'autoBillingEnabled',
                  en: 'Smart Billing & Pre-Expiry Reminders',
                  hi: 'स्मार्ट बिलिंग व एक्सपायरी रिमाइंडर',
                },
                {
                  key: 'leadAutoFollowUp',
                  en: 'Automated Lead Welcome & Scoring',
                  hi: 'ऑटोमेटेड लीड वेलकम व स्कोरिंग',
                },
                {
                  key: 'whatsappAutoSend',
                  en: 'WhatsApp Live Webhook Auto-Send',
                  hi: 'व्हाट्सएप लाइव वेबहुक ऑटो-सेंड',
                },
                {
                  key: 'googleBusinessAutoReply',
                  en: 'Google Business Review & Q&A Auto-Reply',
                  hi: 'गूगल बिजनेस रिव्यू व Q&A ऑटो-रिप्लाई',
                },
              ] as const
            ).map((toggle) => {
              const checked = Boolean(settings[toggle.key]);
              return (
                <div
                  key={toggle.key}
                  className="flex items-center justify-between p-4 rounded-lg bg-[#09090B] border border-white/[0.08]"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {bi(language, toggle.en, toggle.hi)}
                    </p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {checked ? 'ACTIVE · AUTO_SEND' : 'MANUAL HOLD'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void updateSettings({ [toggle.key]: !checked })}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      checked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {checked ? 'ON' : 'OFF'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/[0.08]">
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                {bi(language, 'Auto-Reply Language', 'ऑटो-रिप्लाई भाषा')}
              </label>
              <select
                value={settings.replyLanguage}
                onChange={(e) =>
                  void updateSettings({ replyLanguage: e.target.value as 'en' | 'hi' | 'bilingual' })
                }
                className="w-full bg-[#09090B] border border-white/[0.12] rounded-md px-3 py-2.5 text-sm text-white"
              >
                <option value="bilingual">Bilingual (EN + हिंदी)</option>
                <option value="en">English Only</option>
                <option value="hi">Hindi Only (हिंदी)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                {bi(language, 'Brand Voice Tone', 'ब्रांड टोन')}
              </label>
              <select
                value={settings.replyTone}
                onChange={(e) =>
                  void updateSettings({
                    replyTone: e.target.value as
                      | 'Executive Luxury'
                      | 'Friendly Bilingual'
                      | 'Strict Clinical',
                  })
                }
                className="w-full bg-[#09090B] border border-white/[0.12] rounded-md px-3 py-2.5 text-sm text-white"
              >
                <option value="Executive Luxury">Executive Luxury</option>
                <option value="Friendly Bilingual">Friendly Bilingual</option>
                <option value="Strict Clinical">Strict Clinical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                {bi(language, 'Churn Alert Threshold (Days)', 'चर्न अलर्ट (दिन)')}
              </label>
              <input
                type="number"
                min={2}
                max={30}
                value={settings.churnRecoveryDays}
                onChange={(e) =>
                  void updateSettings({ churnRecoveryDays: Math.max(2, Number(e.target.value) || 4) })
                }
                className="w-full bg-[#09090B] border border-white/[0.12] rounded-md px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                {bi(language, 'GST Rate (%)', 'GST दर (%)')}
              </label>
              <input
                type="number"
                min={0}
                max={28}
                value={settings.gstRatePercent}
                onChange={(e) =>
                  void updateSettings({ gstRatePercent: Math.max(0, Number(e.target.value) || 0) })
                }
                className="w-full bg-[#09090B] border border-white/[0.12] rounded-md px-3 py-2.5 text-sm text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: #06 SMART BILLING AI & #12 SMART EXPENSES AI */}
      {activeTab === 'finance_ai' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* #06 Smart Billing */}
          <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-amber-400">MODULE #06</p>
                <h2 className="text-lg font-bold text-white">
                  {bi(language, 'Smart Billing & GST Controller', 'स्मार्ट बिलिंग व GST नियंत्रक')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('billing')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {bi(language, 'Open Full Billing →', 'फुल बिलिंग खोलें →')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div className="bg-[#09090B] border border-white/[0.06] rounded-lg p-3.5">
                <p className="text-xs text-slate-400">Collected</p>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">
                  ₹{metrics.paidRevenue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-[#09090B] border border-white/[0.06] rounded-lg p-3.5">
                <p className="text-xs text-slate-400">Pending ({metrics.pendingCount})</p>
                <p className="text-lg font-bold text-amber-400 tabular-nums">
                  ₹{metrics.pendingAmount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={runSmartBillingAnalysis}
              disabled={billingLoading}
              className="w-full py-3 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              {billingLoading
                ? bi(language, 'Generating GST & Recovery Playbook...', 'विश्लेषण जारी है...')
                : bi(language, 'Run Smart Billing Audit', 'स्मार्ट बिलिंग ऑडिट चलाएँ')}
            </button>

            {billingInsights && (
              <div className="space-y-3 pt-2 border-t border-white/[0.08] text-sm">
                <p className="font-semibold text-white">{billingInsights.headline}</p>
                <p className="text-xs font-mono text-amber-400">
                  Est. GST Liability: ₹
                  {Number(billingInsights.estimatedGstLiability || 0).toLocaleString('en-IN')}
                </p>
                <ul className="space-y-1.5 text-slate-300 text-xs">
                  {(billingInsights.recoveryPlaybook || []).map((step: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* #12 Smart Expenses */}
          <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono text-amber-400">MODULE #12</p>
                <h2 className="text-lg font-bold text-white">
                  {bi(language, 'Smart Expense Auditor', 'स्मार्ट खर्च ऑडिटर')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('expenses')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {bi(language, 'Open Expense Ledger →', 'खर्च लेजर खोलें →')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm font-mono">
              <div className="bg-[#09090B] border border-white/[0.06] rounded-lg p-3.5">
                <p className="text-xs text-slate-400">Operating Expenses</p>
                <p className="text-lg font-bold text-red-400 tabular-nums">
                  ₹{metrics.totalExpenses.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-[#09090B] border border-white/[0.06] rounded-lg p-3.5">
                <p className="text-xs text-slate-400">Net Profit</p>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">
                  ₹{metrics.netProfit.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={runSmartExpensesAudit}
              disabled={expensesLoading}
              className="w-full py-3 rounded-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              {expensesLoading
                ? bi(language, 'Auditing Expense Ratios...', 'खर्च ऑडिट जारी है...')
                : bi(language, 'Run Expense Optimization Audit', 'खर्च ऑडिट चलाएँ')}
            </button>

            {expensesAudit && (
              <div className="space-y-3 pt-2 border-t border-white/[0.08] text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Margin Status</span>
                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {expensesAudit.marginHealth}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{expensesAudit.summary}</p>
                <ul className="space-y-1.5 text-slate-300 text-xs">
                  {(expensesAudit.savingsRecommendations || []).map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: #13 EXECUTIVE AUTOMATION REPORTS */}
      {activeTab === 'reports' && (
        <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
            <div>
              <p className="text-xs font-mono text-amber-400">MODULE #13</p>
              <h2 className="text-xl font-bold text-white">
                {bi(language, 'Executive Operations Report', 'एग्जीक्यूटिव ऑपरेशंस रिपोर्ट')}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleExportCsvReport}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{bi(language, 'Export CSV Report', 'CSV रिपोर्ट डाउनलोड करें')}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-xs font-mono uppercase text-slate-400">
                  <th className="py-3 pr-4">{bi(language, 'Operational Pillar', 'ऑपरेशनल स्तंभ')}</th>
                  <th className="py-3 px-4">{bi(language, 'Live Value', 'लाइव मान')}</th>
                  <th className="py-3 pl-4 text-right">{bi(language, 'Status', 'स्थिति')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
                <tr>
                  <td className="py-3.5 pr-4 font-sans text-slate-200">Active / Total Members</td>
                  <td className="py-3.5 px-4 text-white">
                    {metrics.activeMembers} / {metrics.totalMembers}
                  </td>
                  <td className="py-3.5 pl-4 text-right text-emerald-400">SYNCED</td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-sans text-slate-200">Paid Revenue vs Operating Expenses</td>
                  <td className="py-3.5 px-4 text-white">
                    ₹{metrics.paidRevenue.toLocaleString('en-IN')} / ₹
                    {metrics.totalExpenses.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 pl-4 text-right text-emerald-400">
                    {metrics.marginPercent}% MARGIN
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-sans text-slate-200">Pending & Overdue Receivables</td>
                  <td className="py-3.5 px-4 text-amber-400">
                    ₹{metrics.pendingAmount.toLocaleString('en-IN')} ({metrics.pendingCount})
                  </td>
                  <td className="py-3.5 pl-4 text-right text-amber-400">
                    {metrics.pendingCount > 0 ? 'ACTIONABLE' : 'CLEAR'}
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-sans text-slate-200">Geometric Attendance Today</td>
                  <td className="py-3.5 px-4 text-white">{metrics.todayPresent}</td>
                  <td className="py-3.5 pl-4 text-right text-emerald-400">LIVE DESK</td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-sans text-slate-200">Open Leads Pipeline</td>
                  <td className="py-3.5 px-4 text-white">{metrics.openLeads}</td>
                  <td className="py-3.5 pl-4 text-right text-amber-400">FOLLOW-UP READY</td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-sans text-slate-200">Dispatched Webhook Automation Logs</td>
                  <td className="py-3.5 px-4 text-white">{logs.length}</td>
                  <td className="py-3.5 pl-4 text-right text-emerald-400">AUDITED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: LIVE WEBHOOK MANUAL OVERRIDE AUDIT LOG (#17 & #18) */}
      {activeTab === 'override_logs' && (
        <div className="space-y-5">
          {/* Per-channel emergency pause controls */}
          <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['ALL', 'WHATSAPP', 'GOOGLE_BUSINESS', 'AUTO_OPERATOR', 'ATTENDANCE'] as const).map(
                (ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setLogChannelFilter(ch)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono cursor-pointer ${
                      logChannelFilter === ch
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-[#09090B] text-slate-400 border border-white/[0.08] hover:text-white'
                    }`}
                  >
                    {ch}
                  </button>
                )
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['WHATSAPP', 'GOOGLE_BUSINESS'] as AutomationChannel[]).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => toggleChannelPause(ch)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer border ${
                    pausedChannels[ch]
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {pausedChannels[ch] ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>
                    {ch}: {pausedChannels[ch] ? 'PAUSED' : 'LIVE'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-[#111114] border border-white/[0.08] rounded-xl p-10 text-center space-y-2">
              <p className="text-sm text-slate-300">
                {bi(
                  language,
                  'No automation dispatch events logged yet. Run Auto Operations, WhatsApp Automation, or Google Business Reply to inspect live audit records.',
                  'अभी कोई ऑटोमेशन लॉग दर्ज नहीं है। लॉग देखने के लिए ऑटो ऑपरेशंस, व्हाट्सएप या गूगल बिजनेस ऑटोमेशन चलाएँ।'
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#111114] border border-white/[0.08] rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                      <span className="text-amber-400 font-bold">{log.channel}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-white">{log.target}</span>
                      <span className="text-slate-500">·</span>
                      <span
                        className={`font-bold ${
                          log.status === 'AUTO_SENT'
                            ? 'text-emerald-400'
                            : log.status === 'OVERRIDDEN'
                              ? 'text-amber-400'
                              : log.status === 'PAUSED'
                                ? 'text-slate-300'
                                : 'text-red-400'
                        }`}
                      >
                        {log.status}
                      </span>
                      {log.providerStatus && (
                        <>
                          <span className="text-slate-500">·</span>
                          <span className="text-slate-400">{log.providerStatus}</span>
                        </>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">{log.summary}</p>

                  {editingLogId === log.id ? (
                    <div className="space-y-3">
                      <textarea
                        rows={3}
                        value={overrideDraft}
                        onChange={(e) => setOverrideDraft(e.target.value)}
                        className="w-full rounded-md bg-[#09090B] border border-amber-500/40 p-3 text-sm text-white focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void handleSaveOverrideAndResend(log)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{bi(language, 'Save Override & Resend', 'ओवरराइड सेव कर पुनः भेजें')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLogId(null);
                            setOverrideDraft('');
                          }}
                          className="px-3.5 py-2 rounded-md bg-[#09090B] border border-white/[0.1] text-slate-400 text-xs cursor-pointer"
                        >
                          {bi(language, 'Cancel', 'रद्द करें')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-200 bg-[#09090B] border border-white/[0.06] rounded-md p-3 whitespace-pre-wrap">
                        {log.messageBody}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingLogId(log.id);
                            setOverrideDraft(log.messageBody);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#09090B] border border-white/[0.12] hover:border-amber-400/50 text-xs font-semibold text-slate-200 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{bi(language, 'Edit & Override', 'एडिट व ओवरराइड')}</span>
                        </button>
                        {log.status !== 'PAUSED' && (
                          <button
                            type="button"
                            onClick={() => void pauseLog(log.id, currentUser?.name || 'Admin Staff')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#09090B] border border-white/[0.12] hover:border-red-400/50 text-xs font-semibold text-slate-300 cursor-pointer"
                          >
                            <Pause className="w-3.5 h-3.5 text-red-400" />
                            <span>{bi(language, 'Mark Paused', 'पॉज़ करें')}</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FullAutomationHub;
