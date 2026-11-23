import React, { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Search,
  Wallet,
  X,
  Upload,
  FileCheck,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { Expense } from '../../../types';

const CATEGORIES = [
  'Rent',
  'Electricity',
  'Salaries',
  'Equipment',
  'Maintenance',
  'Marketing',
  'Utilities',
  'Supplies',
] as const;

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#eab308'];

export const ExpensesManager: React.FC = () => {
  const { expenses, invoices, addExpense, updateExpense, deleteExpense } = useData();
  const { addToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    item: '',
    category: 'Electricity',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI' as 'UPI' | 'Cash' | 'Card' | 'Bank Transfer',
    paymentStatus: 'Paid' as 'Paid' | 'Pending',
    vendor: '',
    receiptUrl: '',
    receiptName: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses
      .filter((e) => {
        if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
        const st = e.paymentStatus || 'Paid';
        if (statusFilter !== 'All' && st !== statusFilter) return false;
        if (!q) return true;
        return (
          e.item.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.vendor || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, categoryFilter, statusFilter, search]);

  const financeSummary = useMemo(() => {
    const totalSpend = expenses.reduce((s, e) => s + e.amount, 0);
    const pendingSpend = expenses
      .filter((e) => e.paymentStatus === 'Pending')
      .reduce((s, e) => s + e.amount, 0);
    const collectedRevenue = invoices.reduce((s, inv) => {
      if (inv.status === 'Refunded' || inv.status === 'Cancelled') return s;
      if (typeof inv.paidAmount === 'number') return s + inv.paidAmount;
      return inv.status === 'Paid' ? s + inv.amount : s;
    }, 0);
    const netSurplus = collectedRevenue - totalSpend;
    return { totalSpend, pendingSpend, collectedRevenue, netSurplus };
  }, [expenses, invoices]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const topCategory = categoryBreakdown[0];

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      addToast('Receipt file must be under 1.5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({
          ...prev,
          receiptUrl: reader.result as string,
          receiptName: file.name,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.item.trim() || !amount || amount <= 0) {
      addToast('Expense description and valid amount are required.', 'error');
      return;
    }
    const created: Expense = {
      id: Math.max(0, ...expenses.map((ex) => ex.id)) + 1,
      item: form.item.trim(),
      category: form.category,
      amount,
      date: form.date,
      paymentMethod: form.paymentMethod,
      paymentStatus: form.paymentStatus,
      vendor: form.vendor.trim() || 'Direct Vendor',
      receiptUrl: form.receiptUrl || undefined,
    };
    addExpense(created);
    addToast(`Recorded ₹${amount.toLocaleString('en-IN')} expense under ${created.category}.`, 'success');
    setForm({
      item: '',
      category: 'Electricity',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      paymentStatus: 'Paid',
      vendor: '',
      receiptUrl: '',
      receiptName: '',
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Expenses Management</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Track daily operating costs, vendors, receipt attachments, payment status, and revenue vs expense P&amp;L
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Expense
        </button>
      </div>

      {/* Revenue vs Expense P&L KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Recorded Expenses</span>
            <Wallet className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2 tabular-nums">
            ₹{financeSummary.totalSpend.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-zinc-500 mt-1 tabular-nums">
            ₹{financeSummary.pendingSpend.toLocaleString('en-IN')} unpaid/pending
          </p>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Collected Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 tabular-nums">
            ₹{financeSummary.collectedRevenue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-zinc-500 mt-1">From settled &amp; partial invoices</p>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="text-xs text-zinc-400">Revenue vs Expense Net</div>
          <div
            className={`text-2xl font-bold mt-2 tabular-nums ${
              financeSummary.netSurplus >= 0 ? 'text-white' : 'text-rose-400'
            }`}
          >
            {financeSummary.netSurplus >= 0 ? '+' : '-'}₹
            {Math.abs(financeSummary.netSurplus).toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {financeSummary.netSurplus >= 0 ? 'Operating surplus' : 'Operating deficit'}
          </p>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="text-xs text-zinc-400">Highest Cost Category</div>
          <div className="text-2xl font-bold text-amber-400 mt-2">
            {topCategory ? topCategory.name : '—'}
          </div>
          <p className="text-xs text-zinc-500 mt-1 tabular-nums">
            {topCategory ? `₹${topCategory.value.toLocaleString('en-IN')}` : 'No data'}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Spend Share by Category</h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {categoryBreakdown.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                  formatter={(v: any) => `₹${Number(v || 0).toLocaleString('en-IN')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Category Spend Comparison</h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8 }}
                  formatter={(v: any) => `₹${Number(v || 0).toLocaleString('en-IN')}`}
                />
                <Bar dataKey="value" name="Amount" radius={[6, 6, 0, 0]}>
                  {categoryBreakdown.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expense Ledger */}
      <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expense or vendor..."
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter expenses by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              aria-label="Filter expenses by payment status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200"
            >
              <option value="All">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Receipt</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filtered.map((exp) => {
                const payStatus = exp.paymentStatus || 'Paid';
                return (
                  <tr key={exp.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-medium text-white">
                      <div>{exp.item}</div>
                      <div className="text-[11px] text-zinc-500">{exp.paymentMethod || 'UPI'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-200">{exp.category}</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400">{exp.vendor || '—'}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          const next = payStatus === 'Paid' ? 'Pending' : 'Paid';
                          updateExpense({ ...exp, paymentStatus: next });
                          addToast(`Marked "${exp.item}" as ${next}.`, 'success');
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                          payStatus === 'Paid'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {payStatus === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {payStatus}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      {exp.receiptUrl ? (
                        <a
                          href={exp.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          Attached
                        </a>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400 tabular-nums">{exp.date}</td>
                    <td className="py-3 px-4 text-right font-semibold text-rose-400 tabular-nums">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          deleteExpense(exp.id);
                          addToast(`Removed expense "${exp.item}".`, 'info');
                        }}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Log New Expense</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Description *</label>
                <input
                  required
                  type="text"
                  value={form.item}
                  onChange={(e) => setForm({ ...form, item: e.target.value })}
                  placeholder="e.g. Monthly Electricity Bill"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Amount (₹) *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Payment Status</label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as 'Paid' | 'Pending' })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Payment Mode</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    value={form.vendor}
                    onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                    placeholder="Vendor name"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Receipt / Bill Upload (Optional)</label>
                <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-dashed border-white/15 text-xs text-zinc-300 cursor-pointer hover:border-amber-500/50">
                  <span className="truncate flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    {form.receiptName || 'Attach invoice/receipt image or PDF (max 1.5 MB)'}
                  </span>
                  <input type="file" accept="image/*,.pdf" onChange={handleReceiptUpload} className="hidden" />
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesManager;
