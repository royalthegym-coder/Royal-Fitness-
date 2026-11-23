import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Trash2,
  Phone,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';
import { gymApi } from '../../services/gymApiClient';
import { Lead, LeadSource, LeadStage } from '../../../types';

const STAGES: Array<'All' | LeadStage> = ['All', 'New', 'Contacted', 'Trial', 'Converted', 'Lost'];
const SOURCES: LeadSource[] = ['Walk-in', 'Instagram', 'WhatsApp', 'Referral', 'Website', 'Facebook', 'Other'];

export const LeadsManager: React.FC = () => {
  const { leads, members, packages, addLead, updateLead, deleteLead, refreshFromServer } = useData();
  const { addToast } = useToast();

  const [stageFilter, setStageFilter] = useState<'All' | LeadStage>('All');
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [convertingLeadId, setConvertingLeadId] = useState<number | null>(null);

  const [pitchLead, setPitchLead] = useState<Lead | null>(null);
  const [pitchText, setPitchText] = useState('');
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'Walk-in' as LeadSource,
    goal: 'Weight Loss',
    interestedPackageId: String(packages[0]?.id || ''),
    followUpDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const pipelineMetrics = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter((l) => l.status === 'Converted').length;
    const active = leads.filter((l) => l.status === 'New' || l.status === 'Contacted' || l.status === 'Trial').length;
    const trialCount = leads.filter((l) => l.status === 'Trial').length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    return { total, converted, active, trialCount, conversionRate };
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (stageFilter !== 'All' && l.status !== stageFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.source.toLowerCase().includes(q) ||
        (l.goal || '').toLowerCase().includes(q) ||
        (l.notes || '').toLowerCase().includes(q)
      );
    });
  }, [leads, stageFilter, search]);

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('Lead name and mobile number are required.', 'error');
      return;
    }
    const pkg = packages.find((p) => String(p.id) === form.interestedPackageId);
    const noteWithPkg = [
      pkg ? `Interested Plan: ${pkg.name}` : '',
      form.notes.trim(),
    ]
      .filter(Boolean)
      .join(' · ');

    const created: Lead = {
      id: Math.max(0, ...leads.map((l) => l.id)) + 1,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || '',
      source: form.source,
      status: 'New',
      inquiryDate: new Date().toISOString().split('T')[0],
      followUpDate: form.followUpDate,
      goal: form.goal,
      notes: noteWithPkg,
      aiScore: 80,
    };
    addLead(created);
    addToast(`Captured new lead: ${created.name}.`, 'success');
    setForm({
      name: '',
      phone: '',
      email: '',
      source: 'Walk-in',
      goal: 'Weight Loss',
      interestedPackageId: String(packages[0]?.id || ''),
      followUpDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsAddOpen(false);
  };

  const handleConvertToMember = async (lead: Lead) => {
    if (convertingLeadId === lead.id) return;
    const cleanPhone = lead.phone.replace(/\D/g, '').slice(-10);
    const existingMember = members.find(
      (m) => !m.archived && cleanPhone.length >= 10 && m.phone.replace(/\D/g, '').slice(-10) === cleanPhone
    );
    if (existingMember) {
      updateLead({ ...lead, status: 'Converted' });
      addToast(
        `Mobile already linked to member ${existingMember.name} (#${existingMember.id}). Lead marked Converted without duplicate.`,
        'info'
      );
      return;
    }

    const matchedPkg =
      packages.find((p) => (lead.notes || '').toLowerCase().includes(p.name.toLowerCase())) || packages[0];

    setConvertingLeadId(lead.id);
    const res = await gymApi.convertLead(lead.id, {
      package_id: matchedPkg?.id || 1,
      payment_method: 'UPI',
      payment_amount: 0,
    });
    setConvertingLeadId(null);

    if (!res.ok) {
      addToast(res.error || `Could not convert lead ${lead.name}.`, 'error');
      return;
    }

    await refreshFromServer();
    const code = res.data?.member?.member_code || `FF-${1000 + (res.data?.member?.id || 0)}`;
    addToast(`${lead.name} converted to Active Member (${code}) and invoice generated!`, 'success');
  };

  const handleGeneratePitch = async (lead: Lead) => {
    setPitchLead(lead);
    setPitchText('');
    setPitchError(null);
    setPitchLoading(true);
    const res = await requestGymAI('lead_pitch', {
      name: lead.name,
      goal: lead.goal || 'Fitness',
      source: lead.source,
      status: lead.status,
    });
    setPitchLoading(false);
    if (res.success && res.text) {
      setPitchText(res.text);
    } else {
      setPitchError(res.error || 'Could not generate AI follow-up script.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Leads Management</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Capture inquiries, track interested packages &amp; pipeline conversion rates, and convert qualified leads
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Pipeline Conversion KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Total Pipeline Leads</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{pipelineMetrics.total}</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Active Follow-Ups</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{pipelineMetrics.active}</div>
          <div className="text-xs text-zinc-500 mt-0.5 tabular-nums">{pipelineMetrics.trialCount} in trial stage</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Converted to Members</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{pipelineMetrics.converted}</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Conversion Rate</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{pipelineMetrics.conversionRate}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads by name, phone, source, or package..."
            className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((st) => {
            const count = st === 'All' ? leads.length : leads.filter((l) => l.status === st).length;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStageFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                  stageFilter === st
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-900 text-zinc-300 border border-white/10 hover:bg-zinc-800'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Lead</th>
                <th className="py-3.5 px-4">Source &amp; Goal</th>
                <th className="py-3.5 px-4">Follow-Up</th>
                <th className="py-3.5 px-4">Stage</th>
                <th className="py-3.5 px-4">Interested Plan / Notes</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-400">
                    No leads match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{lead.name}</div>
                      <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5 tabular-nums">
                        <Phone className="w-3 h-3" /> {lead.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 font-medium">{lead.source}</span>
                      <div className="text-zinc-400 mt-1">{lead.goal || 'Fitness'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-300 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        {lead.followUpDate || lead.inquiryDate}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Stage for ${lead.name}`}
                        value={lead.status}
                        onChange={(e) => {
                          updateLead({ ...lead, status: e.target.value as LeadStage });
                          addToast(`${lead.name} moved to ${e.target.value}.`, 'info');
                        }}
                        className="bg-zinc-900 border border-white/10 rounded-md px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Trial">Trial</option>
                        <option value="Converted">Converted</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-xs truncate">
                      {lead.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleGeneratePitch(lead)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                          title="Generate AI Follow-Up Pitch"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          AI Pitch
                        </button>
                        {lead.status !== 'Converted' && (
                          <button
                            type="button"
                            onClick={() => handleConvertToMember(lead)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Convert
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            deleteLead(lead.id);
                            addToast(`Removed lead ${lead.name}.`, 'info');
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                          title="Delete lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Capture New Lead</h2>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLead} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Phone *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Lead Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Fitness Goal</label>
                  <select
                    value={form.goal}
                    onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Fitness">Fitness</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Interested Membership Package</label>
                  <select
                    value={form.interestedPackageId}
                    onChange={(e) => setForm({ ...form, interestedPackageId: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.duration})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Preferred timing, trial notes..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer">
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Follow-Up Pitch Modal */}
      {pitchLead && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Follow-Up Script — {pitchLead.name}
              </h3>
              <button type="button" onClick={() => setPitchLead(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pitchLoading ? (
              <div className="py-6 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                Writing personalized follow-up...
              </div>
            ) : pitchError ? (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {pitchError}
              </div>
            ) : (
              <textarea
                rows={4}
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-amber-500 outline-none"
              />
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPitchLead(null)} className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-xs cursor-pointer">
                Close
              </button>
              {pitchText && (
                <a
                  href={`https://wa.me/${
                    pitchLead.phone.replace(/\D/g, '').length === 10
                      ? `91${pitchLead.phone.replace(/\D/g, '')}`
                      : pitchLead.phone.replace(/\D/g, '')
                  }?text=${encodeURIComponent(pitchText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold"
                >
                  Send via WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsManager;
