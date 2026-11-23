import React, { useMemo, useState } from 'react';
import {
  Tag,
  Plus,
  Sparkles,
  Trash2,
  Copy,
  RefreshCw,
  AlertCircle,
  X,
  BarChart3,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';
import { GymOffer } from '../../../types';

const CAMPAIGN_TYPES: Array<NonNullable<GymOffer['campaignType']>> = [
  'Coupon',
  'Festival',
  'Referral',
  'Limited Period',
];

export const OffersManager: React.FC = () => {
  const { offers, packages, addOffer, updateOffer, deleteOffer } = useData();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    title: '',
    code: '',
    campaignType: 'Coupon' as NonNullable<GymOffer['campaignType']>,
    discountType: 'percentage' as 'percentage' | 'flat',
    discountValue: 20,
    usageLimit: 50,
    applicablePlan: packages[0]?.name || 'All Membership Plans',
    validFrom: today,
    validUntil: nextMonth,
    status: 'Active' as GymOffer['status'],
    description: '',
  });

  const campaignStats = useMemo(() => {
    const active = offers.filter((o) => o.status === 'Active').length;
    const totalRedemptions = offers.reduce((s, o) => s + (o.redemptions || 0), 0);
    const totalCapacity = offers.reduce((s, o) => s + (o.usageLimit || 100), 0);
    const utilization = totalCapacity > 0 ? Math.round((totalRedemptions / totalCapacity) * 100) : 0;
    const topOffer = [...offers].sort((a, b) => (b.redemptions || 0) - (a.redemptions || 0))[0];
    return { active, totalRedemptions, utilization, topOffer };
  }, [offers]);

  const handleGenerateDescription = async () => {
    if (!form.title.trim()) {
      addToast('Enter an offer title first so AI can write its description.', 'error');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    const discountText =
      form.discountType === 'percentage'
        ? `${form.discountValue}% OFF`
        : `₹${form.discountValue} FLAT OFF`;

    const res = await requestGymAI('offer_description', {
      title: form.title,
      campaignType: form.campaignType,
      discountText,
      applicablePlan: form.applicablePlan,
      code: form.code || 'FIT20',
    });
    setAiLoading(false);

    if (res.success && res.text) {
      setForm((prev) => ({ ...prev, description: res.text || '' }));
      addToast('AI offer description generated.', 'success');
    } else {
      setAiError(res.error || 'Could not generate offer description.');
    }
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.code.trim()) {
      addToast('Offer title and promo code are required.', 'error');
      return;
    }
    const cleanCode = form.code.trim().toUpperCase();
    if (offers.some((o) => o.code.toUpperCase() === cleanCode)) {
      addToast(`Promo code ${cleanCode} already exists. Use a unique code.`, 'error');
      return;
    }
    const created: GymOffer = {
      id: `OFF-${Date.now().toString().slice(-4)}`,
      title: form.title.trim(),
      code: cleanCode,
      campaignType: form.campaignType,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 10,
      usageLimit: Math.max(1, Number(form.usageLimit) || 50),
      applicablePlan: form.applicablePlan,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      status: form.status,
      description:
        form.description.trim() ||
        `Save ${form.discountType === 'percentage' ? `${form.discountValue}%` : `₹${form.discountValue}`} on ${form.applicablePlan}.`,
      redemptions: 0,
      aiGenerated: Boolean(form.description.trim()),
    };
    addOffer(created);
    addToast(`Created ${created.campaignType} campaign "${created.title}" (${created.code}).`, 'success');
    setForm({
      title: '',
      code: '',
      campaignType: 'Coupon',
      discountType: 'percentage',
      discountValue: 20,
      usageLimit: 50,
      applicablePlan: packages[0]?.name || 'All Membership Plans',
      validFrom: today,
      validUntil: nextMonth,
      status: 'Active',
      description: '',
    });
    setIsModalOpen(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    addToast(`Promo code ${code} copied.`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Offers &amp; Promotions</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Launch festival, referral, coupon, and limited-period campaigns with usage limits and billing redemption tracking
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAiError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Campaign Performance Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Active Campaigns</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{campaignStats.active}</div>
          <div className="text-xs text-zinc-500 mt-0.5">of {offers.length} total</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Total Redemptions</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{campaignStats.totalRedemptions}</div>
          <div className="text-xs text-zinc-500 mt-0.5">Applied at billing &amp; admission</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Quota Utilization</span>
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{campaignStats.utilization}%</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Top Performing Code</div>
          <div className="text-lg font-bold text-white mt-1 truncate">
            {campaignStats.topOffer ? campaignStats.topOffer.code : '—'}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">
            {campaignStats.topOffer ? `${campaignStats.topOffer.redemptions} redemptions` : 'No redemptions yet'}
          </div>
        </div>
      </div>

      {/* Offers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.map((offer) => {
          const limit = offer.usageLimit || 100;
          const pct = Math.min(100, Math.round(((offer.redemptions || 0) / limit) * 100));
          return (
            <div
              key={offer.id}
              className="bg-[#111318] border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-xs font-bold tabular-nums">
                        <Tag className="w-3 h-3" />
                        {offer.discountType === 'percentage'
                          ? `${offer.discountValue}% OFF`
                          : `₹${offer.discountValue} OFF`}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {offer.campaignType || 'Coupon'}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          offer.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : offer.status === 'Scheduled'
                            ? 'bg-sky-500/15 text-sky-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {offer.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-2">{offer.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">Applicable: {offer.applicablePlan}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      deleteOffer(offer.id);
                      addToast(`Deleted offer "${offer.title}".`, 'info');
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                    title="Delete offer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-sm text-zinc-300 mt-3 leading-relaxed">{offer.description}</p>

                {/* Redemption Quota Bar */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 tabular-nums">
                    <span>Usage: {offer.redemptions} / {limit}</span>
                    <span>{pct}% claimed</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-zinc-900 border border-white/10 text-xs font-bold tracking-wider text-amber-400">
                    {offer.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(offer.code)}
                    className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                    title="Copy promo code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 tabular-nums">
                  <span>Valid until {offer.validUntil}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateOffer({
                        ...offer,
                        status: offer.status === 'Active' ? 'Expired' : 'Active',
                      })
                    }
                    className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    {offer.status === 'Active' ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Offer Modal with AI Auto-Description Generator */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Create Promotional Campaign</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOffer} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Offer Title *</label>
                  <input
                    required
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Diwali Transformation Pass"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Promo Code *</label>
                  <input
                    required
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DIWALI25"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white uppercase focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Campaign Type</label>
                  <select
                    value={form.campaignType}
                    onChange={(e) => setForm({ ...form, campaignType: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {CAMPAIGN_TYPES.map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Applicable Plan</label>
                  <select
                    value={form.applicablePlan}
                    onChange={(e) => setForm({ ...form, applicablePlan: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="All Membership Plans">All Membership Plans</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Usage Limit (Max Redemptions)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">
                    Discount Value ({form.discountType === 'percentage' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-zinc-400">Offer Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-60 cursor-pointer"
                  >
                    {aiLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {aiLoading ? 'Generating...' : 'AI Auto-Description'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Click 'AI Auto-Description' or write your own promotional copy..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
                {aiError && (
                  <p className="text-xs text-rose-300 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {aiError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer">
                  Publish Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersManager;
