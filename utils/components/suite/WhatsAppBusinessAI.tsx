import React, { useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';
import { workerFetch } from '../../../lib/apiClient';

interface TemplateItem {
  id: string;
  name: string;
  category: string;
  body: string;
  approved: boolean;
}

const DEFAULT_TEMPLATES: TemplateItem[] = [
  {
    id: 'admission_confirmation',
    name: 'Admission Confirmation',
    category: 'Onboarding',
    approved: true,
    body: 'Hi {name}, welcome to {gym}! Your admission is confirmed. Show your Member QR Pass at the front desk for check-in.',
  },
  {
    id: 'payment_receipt',
    name: 'Payment Receipt Confirmation',
    category: 'Billing',
    approved: true,
    body: 'Hello {name}, thank you for your payment at {gym}. Your official receipt has been generated and your membership standing is updated.',
  },
  {
    id: 'expiry_reminder',
    name: 'Membership Expiry & Renewal Reminder',
    category: 'Retention',
    approved: true,
    body: 'Hello {name}, a reminder from {gym} that your membership renewal or balance is due soon. Renew on an annual plan to unlock maximum savings!',
  },
  {
    id: 'promo_campaign',
    name: 'Promotional Campaign',
    category: 'Marketing',
    approved: true,
    body: 'Hi {name}! Limited-period offer at {gym}: Use code FIT20 to save 20% on membership plans this week. Reply YES for details.',
  },
  {
    id: 'lead_followup',
    name: 'Automated Lead Follow-Up',
    category: 'Sales',
    approved: true,
    body: 'Hi {name}, thanks for visiting {gym}! Your complimentary fitness assessment and trial slot are ready. Reply to confirm your preferred timing.',
  },
];

export const WhatsAppBusinessAI: React.FC = () => {
  const { members, invoices, leads, whatsappLogs, addWhatsAppLog } = useData();
  const { currentGym } = useGym();
  const { addToast } = useToast();

  const gymName = currentGym?.gymName || 'Fitness Future';
  const [templates, setTemplates] = useState<TemplateItem[]>(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('admission_confirmation');
  const [messageText, setMessageText] = useState<string>(DEFAULT_TEMPLATES[0].body);
  const [audience, setAudience] = useState<'active' | 'pending_dues' | 'expired' | 'leads'>('active');
  const [respectConsentOnly, setRespectConsentOnly] = useState(true);

  const [aiPurpose, setAiPurpose] = useState('Annual membership renewal with 20% discount');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    configured: boolean;
    provider: string;
    message: string;
  }>({
    checked: false,
    configured: false,
    provider: 'Meta WhatsApp Business Cloud API v22.0',
    message: 'Checking WhatsApp Business Cloud API connection...',
  });

  const [sending, setSending] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const [automations, setAutomations] = useState({
    autoPaymentReceipt: true,
    threeDayExpiryReminder: true,
    welcomeKitMessage: true,
    attendanceNotification: false,
    missedWorkoutNudge: false,
  });

  useEffect(() => {
    let active = true;
    workerFetch('/whatsapp/status')
      .then((res) => res.data || {})
      .then((data: any) => {
        if (!active) return;
        setApiStatus({
          checked: true,
          configured: Boolean(data?.configured),
          provider: data?.provider || 'Meta WhatsApp Business Cloud API v22.0',
          message:
            data?.message ||
            'WhatsApp Business Cloud API credentials are not configured on the server.',
        });
      })
      .catch(() => {
        if (!active) return;
        setApiStatus({
          checked: true,
          configured: false,
          provider: 'Meta WhatsApp Business Cloud API v22.0',
          message: 'Unable to verify WhatsApp Business API connection. Automated sending is disabled.',
        });
      });
    return () => {
      active = false;
    };
  }, []);

  const recipients = useMemo(() => {
    const filterConsent = <T extends { whatsappConsent: boolean }>(list: T[]) =>
      respectConsentOnly ? list.filter((item) => item.whatsappConsent) : list;

    if (audience === 'active') {
      return filterConsent(
        members
          .filter((m) => m.status === 'Active' && !m.archived)
          .map((m) => ({ name: m.name, phone: m.phone, whatsappConsent: m.whatsappConsent !== false }))
      );
    }
    if (audience === 'expired') {
      return filterConsent(
        members
          .filter((m) => (m.status === 'Expired' || m.status === 'Inactive') && !m.archived)
          .map((m) => ({ name: m.name, phone: m.phone, whatsappConsent: m.whatsappConsent !== false }))
      );
    }
    if (audience === 'pending_dues') {
      const dueIds = new Set(
        invoices
          .filter((i) => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Partial')
          .map((i) => i.memberId)
      );
      return filterConsent(
        members
          .filter((m) => dueIds.has(m.id))
          .map((m) => ({ name: m.name, phone: m.phone, whatsappConsent: m.whatsappConsent !== false }))
      );
    }
    return leads
      .filter((l) => l.status !== 'Converted' && l.status !== 'Lost')
      .map((l) => ({ name: l.name, phone: l.phone, whatsappConsent: true }));
  }, [audience, members, invoices, leads, respectConsentOnly]);

  const formatForRecipient = (recipientName: string) =>
    messageText.replace(/\{name\}/gi, recipientName).replace(/\{gym\}/gi, gymName);

  const handleSelectTemplate = (tpl: TemplateItem) => {
    setSelectedTemplateId(tpl.id);
    setMessageText(tpl.body);
  };

  const handleSaveTemplateEdit = () => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === selectedTemplateId ? { ...t, body: messageText } : t))
    );
    addToast('Approved message template updated.', 'success');
  };

  const handleGenerateAIMessage = async () => {
    setAiLoading(true);
    setAiError(null);
    const res = await requestGymAI('whatsapp_message', {
      gymName,
      purpose: aiPurpose,
      details: `Target audience: ${audience}`,
    });
    setAiLoading(false);
    if (res.success && res.text) {
      setMessageText(res.text);
      addToast('AI drafted a customer-ready WhatsApp message.', 'success');
    } else {
      setAiError(res.error || 'AI message writer unavailable.');
    }
  };

  // Strict honest API dispatch — NEVER simulates delivery when API is not connected
  const handleBulkSend = async () => {
    if (recipients.length === 0) {
      addToast('No eligible opted-in recipients in the selected segment.', 'error');
      return;
    }

    setSending(true);
    setDispatchError(null);
    const tplName = templates.find((t) => t.id === selectedTemplateId)?.name || selectedTemplateId;

    try {
      const res = await workerFetch('/whatsapp/bulk', {
        body: {
          recipients,
          templateName: tplName,
          messageText: messageText.replace(/\{gym\}/gi, gymName),
          gymId: currentGym?.gymId,
        },
        timeoutMs: 60000,
      });

      const data: any = res.data || {};

      if (!res.ok || !data?.configured) {
        const errMessage =
          data?.error ||
          'WhatsApp Business Cloud API is not connected. Message was NOT sent.';
        setDispatchError(errMessage);
        recipients.slice(0, 10).forEach((r) => {
          addWhatsAppLog({
            recipientName: r.name,
            recipientPhone: r.phone,
            templateName: tplName,
            messagePreview: formatForRecipient(r.name).slice(0, 140),
            status: 'Failed - API Not Connected',
            errorMessage: errMessage,
          });
        });
        addToast('WhatsApp API not connected — delivery blocked (no fake simulation).', 'error');
      } else {
        (data.logs || []).forEach((log: any) => {
          addWhatsAppLog({
            recipientName: log.recipient_name,
            recipientPhone: log.recipient_phone,
            templateName: log.template_name,
            messagePreview: log.message_preview,
            status: log.status,
            errorMessage: log.error_message,
          });
        });
        addToast(
          `WhatsApp API dispatched ${data.sentCount} message(s)${data.failedCount ? `, ${data.failedCount} failed` : ''}.`,
          data.sentCount > 0 ? 'success' : 'error'
        );
      }
    } catch (err: any) {
      const msg = err?.message || 'Network error contacting WhatsApp server proxy.';
      setDispatchError(msg);
      addToast(msg, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WhatsApp Business AI</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Approved templates, opt-in consent enforcement, AI message drafting, and real Meta Cloud API dispatch
          </p>
        </div>
      </div>

      {/* Honest API Connection Status Banner */}
      <div
        className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          apiStatus.configured
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {apiStatus.configured ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-sm font-semibold">
              {apiStatus.configured
                ? 'WhatsApp Business Cloud API Connected'
                : 'WhatsApp Business API Not Connected — Automated Delivery Paused'}
            </div>
            <p className="text-xs opacity-90 mt-0.5">{apiStatus.message}</p>
            {!apiStatus.configured && (
              <p className="text-[11px] opacity-80 mt-1">
                Messages will never be faked or marked delivered without a live API response. You can still open manual direct WhatsApp chats below.
              </p>
            )}
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded shrink-0 self-start ${
            apiStatus.configured ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}
        >
          {apiStatus.configured ? 'Live API' : 'Awaiting Credentials'}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns: Templates + AI Composer + Bulk Sender */}
        <div className="xl:col-span-2 space-y-5">
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Approved Message Templates</h2>
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={respectConsentOnly}
                  onChange={(e) => setRespectConsentOnly(e.target.checked)}
                  className="accent-emerald-500"
                />
                Opt-in consent only
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                    selectedTemplateId === tpl.id
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{tpl.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300">
                      {tpl.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* AI Message Writer */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI Customer Support & Campaign Writer
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiPurpose}
                  onChange={(e) => setAiPurpose(e.target.value)}
                  placeholder="Describe message purpose (e.g. renewal reminder, lead follow-up)..."
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleGenerateAIMessage}
                  disabled={aiLoading}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-amber-400 text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
                  {aiLoading ? 'Drafting...' : 'Draft with AI'}
                </button>
              </div>
              {aiError && (
                <div className="text-xs text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {aiError}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-zinc-400">
                  Message Content (use {'{name}'} and {'{gym}'} placeholders)
                </label>
                <button
                  type="button"
                  onClick={handleSaveTemplateEdit}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  Save to Template
                </button>
              </div>
              <textarea
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:border-emerald-500 outline-none"
              />
            </div>

            {dispatchError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{dispatchError}</span>
              </div>
            )}

            {/* Audience & Bulk Dispatch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'active', label: 'Active Members' },
                    { id: 'pending_dues', label: 'Pending/Partial Dues' },
                    { id: 'expired', label: 'Expired Members' },
                    { id: 'leads', label: 'Open Leads' },
                  ] as const
                ).map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setAudience(seg.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                      audience === seg.id
                        ? 'bg-emerald-500 text-zinc-950 font-semibold'
                        : 'bg-zinc-900 text-zinc-300 border border-white/10'
                    }`}
                  >
                    {seg.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleBulkSend}
                disabled={sending}
                className={`px-4 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60 ${
                  apiStatus.configured
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
                    : 'bg-zinc-800 hover:bg-zinc-700 border border-amber-500/40 text-amber-300'
                }`}
              >
                <Send className="w-4 h-4" />
                {sending
                  ? 'Sending via API...'
                  : apiStatus.configured
                  ? `Send via WhatsApp API (${recipients.length})`
                  : `Attempt API Send (${recipients.length})`}
              </button>
            </div>
          </div>

          {/* Direct Recipients Preview */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1">
              Eligible Recipients ({recipients.length}) — Manual WhatsApp Chat Links
            </h2>
            <p className="text-xs text-zinc-400 mb-3">
              Opens your official WhatsApp app directly for 1-to-1 messaging without requiring Cloud API credentials.
            </p>
            {recipients.length === 0 ? (
              <p className="text-xs text-zinc-400">No opted-in contacts match this audience segment.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {recipients.map((r, i) => {
                  const digits = r.phone.replace(/\D/g, '');
                  const waPhone = digits.length === 10 ? `91${digits}` : digits;
                  const waHref = `https://wa.me/${waPhone}?text=${encodeURIComponent(
                    formatForRecipient(r.name)
                  )}`;
                  return (
                    <div
                      key={`${r.phone}-${i}`}
                      className="p-3 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{r.name}</div>
                        <div className="text-[11px] text-zinc-400 tabular-nums">
                          {r.phone} · {r.whatsappConsent ? 'Opted In' : 'No Consent'}
                        </div>
                      </div>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-medium inline-flex items-center gap-1 shrink-0"
                      >
                        Chat <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Automation Triggers + Real Delivery Audit Log */}
        <div className="space-y-5">
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3.5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Workflow Trigger Settings
            </h2>
            {!apiStatus.configured && (
              <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-2">
                Triggers are saved and will activate automatically once WhatsApp Business API credentials are configured.
              </p>
            )}
            {(
              [
                { key: 'autoPaymentReceipt', title: 'Payment Receipt Alerts', desc: 'Dispatch receipt summary when payment is settled' },
                { key: 'threeDayExpiryReminder', title: '3-Day Expiry Reminders', desc: 'Notify opted-in members before membership ends' },
                { key: 'welcomeKitMessage', title: 'Admission Confirmation', desc: 'Send onboarding message after admission completes' },
                { key: 'attendanceNotification', title: 'Attendance Notifications', desc: 'Confirm check-in or renewal alert on access scan' },
                { key: 'missedWorkoutNudge', title: '7-Day Inactivity Follow-Up', desc: 'Re-engage active members with missed workouts' },
              ] as const
            ).map((rule) => {
              const enabled = automations[rule.key];
              return (
                <div
                  key={rule.key}
                  className="p-3 rounded-lg bg-zinc-900/70 border border-white/10 flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-semibold text-white">{rule.title}</div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{rule.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAutomations((prev) => ({ ...prev, [rule.key]: !prev[rule.key] }));
                      addToast(`${rule.title} ${enabled ? 'paused' : 'enabled'}.`, 'info');
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer shrink-0 ${
                      enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {enabled ? 'Enabled' : 'Off'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white">Delivery Audit Log ({whatsappLogs.length})</h2>
            {whatsappLogs.length === 0 ? (
              <p className="text-xs text-zinc-500">No WhatsApp API attempts recorded yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {whatsappLogs.map((item) => {
                  const ok = item.status === 'Sent';
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-zinc-900 border border-white/5 space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-zinc-100 font-medium truncate">{item.recipientName}</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                            ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                          }`}
                        >
                          {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 tabular-nums">
                        {item.recipientPhone} · {item.templateName}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppBusinessAI;
