import React, { useEffect, useMemo, useState } from 'react';
import {
  Star,
  Sparkles,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  X,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';
import { workerFetch } from '../../../lib/apiClient';
import { GymReview } from '../../../types';

export const ReviewsManager: React.FC = () => {
  const { reviews, addReview, updateReview, deleteReview } = useData();
  const { currentGym } = useGym();
  const { addToast } = useToast();

  const [ratingFilter, setRatingFilter] = useState<'All' | 5 | 4 | 3 | 2 | 1>('All');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [gbpStatus, setGbpStatus] = useState<{ connected: boolean; note: string }>({
    connected: false,
    note: 'Awaiting Google Business Profile OAuth credentials — reviews and responses are managed internally and never auto-published externally.',
  });

  useEffect(() => {
    workerFetch('/integrations/status')
      .then((r) => (r.ok ? r.data : null))
      .then((data: any) => {
        const gbp = data?.integrations?.googleBusinessProfile;
        if (gbp) {
          setGbpStatus({
            connected: Boolean(gbp.connected),
            note: gbp.label || gbp.message || gbpStatus.note,
          });
        }
      })
      .catch(() => {});
  }, []);

  const [form, setForm] = useState({
    memberName: '',
    rating: 5 as 1 | 2 | 3 | 4 | 5,
    category: 'Facility' as GymReview['category'],
    comment: '',
  });

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';
    const pending = reviews.filter((r) => r.status === 'Pending').length;
    const distribution = [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => r.rating === stars).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return { stars, count, pct };
    });
    const categories: GymReview['category'][] = ['Facility', 'Trainers', 'Equipment', 'Cleanliness', 'Value'];
    const byCategory = categories.map((cat) => {
      const list = reviews.filter((r) => r.category === cat);
      const catAvg = list.length > 0 ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : '—';
      return { category: cat, count: list.length, avg: catAvg };
    });
    return { total, avg, pending, distribution, byCategory };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (ratingFilter === 'All') return reviews;
    return reviews.filter((r) => r.rating === ratingFilter);
  }, [reviews, ratingFilter]);

  const handleGenerateAIReply = async (rev: GymReview) => {
    setLoadingId(rev.id);
    setErrorById((prev) => ({ ...prev, [rev.id]: '' }));

    const res = await requestGymAI('review_reply', {
      gymName: currentGym?.gymName || 'Fitness Future',
      memberName: rev.memberName,
      rating: rev.rating,
      category: rev.category,
      comment: rev.comment,
    });
    setLoadingId(null);

    if (res.success && res.text) {
      setReplyDrafts((prev) => ({ ...prev, [rev.id]: res.text || '' }));
      addToast(`AI drafted a ${rev.rating}-star response. Review before saving.`, 'success');
    } else {
      setErrorById((prev) => ({ ...prev, [rev.id]: res.error || 'Could not generate AI reply.' }));
    }
  };

  const handleSaveReply = (rev: GymReview) => {
    const text = (replyDrafts[rev.id] ?? rev.reply ?? '').trim();
    if (!text) {
      addToast('Write or generate a reply before saving.', 'error');
      return;
    }
    updateReview({
      ...rev,
      reply: text,
      repliedAt: new Date().toISOString().split('T')[0],
      status: 'Replied',
      publishedToGoogle: false,
    });
    addToast(`Saved owner response to ${rev.memberName}'s feedback.`, 'success');
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.memberName.trim() || !form.comment.trim()) {
      addToast('Member name and review comment are required.', 'error');
      return;
    }
    const created: GymReview = {
      id: `REV-${Date.now().toString().slice(-4)}`,
      memberName: form.memberName.trim(),
      rating: form.rating,
      category: form.category,
      comment: form.comment.trim(),
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      publishedToGoogle: false,
    };
    addReview(created);
    addToast(`Recorded authentic member feedback from ${created.memberName}.`, 'success');
    setForm({ memberName: '', rating: 5, category: 'Facility', comment: '' });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Reviews &amp; Reputation Management</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Track authentic member feedback, category satisfaction scores, and owner-approved AI draft responses
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Record Feedback
        </button>
      </div>

      {/* Honest Google Business Profile Integration Banner */}
      <div
        className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          gbpStatus.connected
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'bg-zinc-900/80 border-white/10'
        }`}
      >
        <div className="flex items-start gap-3 text-xs">
          <Globe className={`w-4 h-4 shrink-0 mt-0.5 ${gbpStatus.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
          <div>
            <div className="font-semibold text-white flex items-center gap-2">
              <span>Google Business Profile Integration</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                  gbpStatus.connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {gbpStatus.connected ? 'Authorized' : 'Awaiting OAuth Credentials'}
              </span>
            </div>
            <p className="text-zinc-400 mt-1">{gbpStatus.note}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 shrink-0">
          <ShieldCheck className="w-4 h-4" />
          <span>Authentic reviews only · Manual approval required</span>
        </div>
      </div>

      {/* Rating Summary + Category Satisfaction Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[#111318] border border-white/10 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="text-center md:border-r md:border-white/10 md:pr-6">
            <div className="text-5xl font-bold text-white tabular-nums">{stats.avg}</div>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= Math.round(Number(stats.avg))
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-zinc-700'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-zinc-400 mt-2 tabular-nums">
              {stats.total} reviews · {stats.pending} awaiting reply
            </div>
          </div>

          <div className="md:col-span-2 space-y-2">
            {stats.distribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-zinc-300 font-medium tabular-nums">{row.stars} ★</span>
                <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="w-16 text-right text-zinc-400 tabular-nums">
                  {row.count} ({row.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-2.5">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Satisfaction by Category</h2>
          {stats.byCategory.map((c) => (
            <div key={c.category} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
              <span className="text-zinc-200 font-medium">{c.category}</span>
              <span className="text-zinc-400 tabular-nums">
                {c.avg} ★ <span className="text-zinc-600">({c.count})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Star Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', 5, 4, 3, 2, 1] as const).map((r) => (
          <button
            key={String(r)}
            type="button"
            onClick={() => setRatingFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              ratingFilter === r
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'bg-[#111318] text-zinc-300 border border-white/10 hover:bg-zinc-800'
            }`}
          >
            {r === 'All' ? 'All Ratings' : `${r} Stars`}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filtered.map((rev) => {
          const draft = replyDrafts[rev.id] ?? rev.reply ?? '';
          const isLoading = loadingId === rev.id;
          const err = errorById[rev.id];

          return (
            <div key={rev.id} className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-semibold text-white">{rev.memberName}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {rev.category}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        rev.status === 'Replied'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-zinc-500 tabular-nums">{rev.date}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    deleteReview(rev.id);
                    addToast('Review removed.', 'info');
                  }}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                  title="Delete review"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-sm text-zinc-200 leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>

              {/* Reply Area with AI Draft Response Generator */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-400">
                    Owner Response {rev.repliedAt ? `(Saved ${rev.repliedAt} · Internal Portal)` : '(Draft)'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerateAIReply(rev)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-amber-400 text-xs font-semibold disabled:opacity-60 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    {isLoading ? 'Drafting Reply...' : `AI Draft Response (${rev.rating}★)`}
                  </button>
                </div>

                {err && (
                  <div className="text-xs text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {err}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <textarea
                    rows={2}
                    value={draft}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [rev.id]: e.target.value }))
                    }
                    placeholder="Draft an AI response or write your reply before approving..."
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveReply(rev)}
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer self-end sm:self-stretch"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Approve &amp; Save
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Review Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Record Authentic Member Feedback</h2>
              <button type="button" onClick={() => setIsAddOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddReview} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Member Name *</label>
                <input
                  required
                  type="text"
                  value={form.memberName}
                  onChange={(e) => setForm({ ...form, memberName: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Star Rating</label>
                  <select
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: Number(e.target.value) as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value={5}>5 Stars — Excellent</option>
                    <option value={4}>4 Stars — Good</option>
                    <option value={3}>3 Stars — Average</option>
                    <option value={2}>2 Stars — Needs Work</option>
                    <option value={1}>1 Star — Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Facility">Facility</option>
                    <option value="Trainers">Trainers</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Cleanliness">Cleanliness</option>
                    <option value="Value">Value</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Member Feedback Comment *</label>
                <textarea
                  required
                  rows={3}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer">
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsManager;
