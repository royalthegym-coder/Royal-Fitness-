import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Trash2,
  Smartphone,
  Banknote,
  CreditCard,
  Landmark,
  X,
  Tag,
  RotateCcw,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { requestGymAI } from '../../aiGymClient';
import ReceiptTemplate from '../common/ReceiptTemplate';
import { Invoice } from '../../../types';

const METHOD_OPTIONS = ['UPI', 'Cash', 'Card', 'Bank Transfer'] as const;
type PaymentMode = (typeof METHOD_OPTIONS)[number];

export const SmartBilling: React.FC = () => {
  const {
    members,
    packages,
    invoices,
    offers,
    addInvoice,
    recordInvoicePayment,
    refundInvoice,
    deleteInvoice,
    updateOffer,
    validateOfferCoupon,
  } = useData();
  const { addToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Pending' | 'Overdue' | 'Refunded'>('All');
  const [methodFilter, setMethodFilter] = useState<'All' | PaymentMode>('All');
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [selectedPayMethod, setSelectedPayMethod] = useState<PaymentMode>('UPI');
  const [payAmountInput, setPayAmountInput] = useState<number>(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [confirmRefundId, setConfirmRefundId] = useState<number | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; offerId: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [aiAuditText, setAiAuditText] = useState<string | null>(null);
  const [aiAuditLoading, setAiAuditLoading] = useState(false);

  const [form, setForm] = useState({
    memberId: members[0]?.id || 0,
    packageId: packages[0]?.id || 0,
    customDiscount: 0,
    paymentMethod: 'UPI' as PaymentMode,
    paymentType: 'Full' as 'Full' | 'Partial' | 'Pending',
    partialAmount: 0,
  });

  const getPaid = (inv: Invoice) =>
    inv.paidAmount !== undefined ? inv.paidAmount : inv.status === 'Paid' ? inv.amount : 0;
  const getBalance = (inv: Invoice) =>
    inv.balanceAmount !== undefined
      ? inv.balanceAmount
      : inv.status === 'Paid' || inv.status === 'Refunded' || inv.status === 'Cancelled'
      ? 0
      : Math.max(0, inv.amount - getPaid(inv));

  const stats = useMemo(() => {
    const activeInvs = invoices.filter((i) => i.status !== 'Refunded' && i.status !== 'Cancelled');
    const totalCollected = activeInvs.reduce((s, i) => s + getPaid(i), 0);
    const upiTotal = activeInvs
      .filter((i) => (i.paymentMethod || 'UPI').toUpperCase().includes('UPI') || (i.paymentMethod || '').includes('QR'))
      .reduce((s, i) => s + getPaid(i), 0);
    const cashTotal = activeInvs
      .filter((i) => (i.paymentMethod || '').toLowerCase() === 'cash')
      .reduce((s, i) => s + getPaid(i), 0);
    const cardTotal = activeInvs
      .filter((i) => (i.paymentMethod || '').toLowerCase() === 'card')
      .reduce((s, i) => s + getPaid(i), 0);
    const bankTotal = activeInvs
      .filter((i) => (i.paymentMethod || '').toLowerCase().includes('bank'))
      .reduce((s, i) => s + getPaid(i), 0);
    const pendingTotal = activeInvs.reduce((s, i) => s + getBalance(i), 0);
    const refundedTotal = invoices.reduce((s, i) => s + (i.refundedAmount || 0), 0);
    const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;
    const partialCount = invoices.filter((i) => i.status === 'Partial').length;
    return { totalCollected, upiTotal, cashTotal, cardTotal, bankTotal, pendingTotal, refundedTotal, overdueCount, partialCount };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
        if (methodFilter !== 'All') {
          const pm = (inv.paymentMethod || 'UPI').toLowerCase();
          if (methodFilter === 'UPI' && !pm.includes('upi') && !pm.includes('qr')) return false;
          if (methodFilter === 'Cash' && pm !== 'cash') return false;
          if (methodFilter === 'Card' && pm !== 'card') return false;
          if (methodFilter === 'Bank Transfer' && !pm.includes('bank')) return false;
        }
        if (!q) return true;
        return (
          inv.memberName.toLowerCase().includes(q) ||
          inv.packageName.toLowerCase().includes(q) ||
          (inv.invoiceNumber || '').toLowerCase().includes(q) ||
          String(inv.id).includes(q)
        );
      })
      .sort((a, b) => b.id - a.id);
  }, [invoices, statusFilter, methodFilter, search]);

  const selectedPkg = packages.find((p) => p.id === Number(form.packageId));
  const totalDiscount = (appliedCoupon?.discountAmount || 0) + Number(form.customDiscount || 0);
  const computedAmount = Math.max(0, (selectedPkg?.price || 0) - totalDiscount);

  const handleApplyCoupon = () => {
    setCouponError(null);
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      return;
    }
    const res = validateOfferCoupon(couponCode, selectedPkg?.price || 0, selectedPkg?.name);
    if (!res.valid || !res.offer) {
      setAppliedCoupon(null);
      setCouponError(res.reason || 'Invalid coupon.');
      return;
    }
    setAppliedCoupon({
      code: res.offer.code,
      discountAmount: res.discountAmount,
      offerId: res.offer.id,
    });
    addToast(`Applied ${res.offer.code}: ₹${res.discountAmount.toLocaleString('en-IN')} off.`, 'success');
  };

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingPayment) return;
    const member = members.find((m) => m.id === Number(form.memberId));
    const pkg = packages.find((p) => p.id === Number(form.packageId));
    if (!member || !pkg) {
      addToast('Please select a member and a package.', 'error');
      return;
    }

    const paidNow =
      form.paymentType === 'Full'
        ? computedAmount
        : form.paymentType === 'Partial'
        ? Math.min(computedAmount, Math.max(1, Number(form.partialAmount) || 0))
        : 0;
    const balance = Math.max(0, computedAmount - paidNow);
    const invStatus: Invoice['status'] =
      paidNow >= computedAmount ? 'Paid' : paidNow > 0 ? 'Partial' : 'Pending';

    setIsProcessingPayment(true);
    const nextId = Math.max(5000, ...invoices.map((i) => i.id)) + 1;
    const newInv: Invoice = {
      id: nextId,
      invoiceNumber: `INV-${new Date().getFullYear()}-${nextId}`,
      memberId: member.id,
      memberName: member.name,
      packageId: pkg.id,
      packageName: pkg.name,
      subtotal: pkg.price,
      couponCode: appliedCoupon?.code || null,
      discountAmount: totalDiscount,
      amount: computedAmount,
      paidAmount: paidNow,
      balanceAmount: balance,
      refundedAmount: 0,
      date: new Date().toISOString().split('T')[0],
      status: invStatus,
      paymentMethod: form.paymentMethod,
      items: [
        { description: `${pkg.name} (${pkg.duration})`, amount: pkg.price, type: 'Membership' },
        ...(appliedCoupon
          ? [{ description: `Promo Code ${appliedCoupon.code}`, amount: -appliedCoupon.discountAmount, type: 'Adjustment' as const }]
          : []),
        ...(form.customDiscount > 0
          ? [{ description: 'Additional Discount', amount: -form.customDiscount, type: 'Adjustment' as const }]
          : []),
      ],
    };

    addInvoice(newInv);
    if (appliedCoupon) {
      const targetOffer = offers.find((o) => o.id === appliedCoupon.offerId);
      if (targetOffer) {
        updateOffer({ ...targetOffer, redemptions: (targetOffer.redemptions || 0) + 1 });
      }
    }

    addToast(`Invoice ${newInv.invoiceNumber} created (Paid ₹${paidNow.toLocaleString('en-IN')}, Balance ₹${balance.toLocaleString('en-IN')}).`, 'success');
    setIsCreateOpen(false);
    setAppliedCoupon(null);
    setCouponCode('');
    setIsProcessingPayment(false);
    if (paidNow > 0) {
      setReceiptInvoice(newInv);
    }
  };

  const confirmRecordPayment = () => {
    if (!payModalInvoice || isProcessingPayment) return;
    setIsProcessingPayment(true);
    const res = recordInvoicePayment(payModalInvoice.id, payAmountInput, selectedPayMethod);
    setIsProcessingPayment(false);

    if (!res.success) {
      addToast(res.error || 'Could not process payment.', 'error');
      return;
    }

    const updatedPaid = getPaid(payModalInvoice) + payAmountInput;
    const updatedBalance = Math.max(0, payModalInvoice.amount - updatedPaid);
    addToast(
      `Recorded ₹${payAmountInput.toLocaleString('en-IN')} via ${selectedPayMethod}. Remaining balance: ₹${updatedBalance.toLocaleString('en-IN')}.`,
      'success'
    );
    const updatedInv: Invoice = {
      ...payModalInvoice,
      paidAmount: updatedPaid,
      balanceAmount: updatedBalance,
      status: updatedBalance <= 0 ? 'Paid' : 'Partial',
      paymentMethod: selectedPayMethod,
    };
    setPayModalInvoice(null);
    setReceiptInvoice(updatedInv);
  };

  const handleRunBillingAudit = async () => {
    setAiAuditLoading(true);
    const res = await requestGymAI('billing_audit', {
      collected: stats.totalCollected,
      outstanding: stats.pendingTotal,
      overdueCount: stats.overdueCount,
      partialCount: stats.partialCount,
      refunded: stats.refundedTotal,
    });
    setAiAuditLoading(false);
    if (res.success && res.text) {
      setAiAuditText(res.text);
    } else {
      addToast(res.error || 'AI billing summary unavailable.', 'error');
    }
  };

  const getMemberPhone = (memberId: number) =>
    members.find((m) => m.id === memberId)?.phone || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Smart Billing</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Unique invoices, coupon discounts, full & partial payments, refunds, and printable PDF receipts
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunBillingAudit}
            disabled={aiAuditLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-amber-400 text-xs font-semibold cursor-pointer disabled:opacity-60"
          >
            {aiAuditLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            AI Collection Audit
          </button>
          <button
            type="button"
            onClick={() => {
              setAppliedCoupon(null);
              setCouponCode('');
              setCouponError(null);
              setForm({
                memberId: members[0]?.id || 0,
                packageId: packages[0]?.id || 0,
                customDiscount: 0,
                paymentMethod: 'UPI',
                paymentType: 'Full',
                partialAmount: Math.round((packages[0]?.price || 1000) / 2),
              });
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Generate Invoice
          </button>
        </div>
      </div>

      {aiAuditText && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-100 whitespace-pre-line">
          <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI Collection & Receivables Summary
          </div>
          {aiAuditText}
        </div>
      )}

      {/* Payment Mode Breakdown Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>UPI</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 tabular-nums">
            ₹{stats.upiTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Card</span>
            <CreditCard className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 tabular-nums">
            ₹{stats.cardTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Cash</span>
            <Banknote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 tabular-nums">
            ₹{stats.cashTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Bank Transfer</span>
            <Landmark className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2 tabular-nums">
            ₹{stats.bankTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-[#111318] border border-rose-500/25 rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Outstanding Balance</span>
            <span className="text-rose-400 font-semibold">Due</span>
          </div>
          <div className="text-xl font-bold text-rose-400 mt-2 tabular-nums">
            ₹{stats.pendingTotal.toLocaleString('en-IN')}
          </div>
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
            placeholder="Search invoice #, member, or plan..."
            className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(['All', 'Paid', 'Partial', 'Pending', 'Overdue', 'Refunded'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                statusFilter === st
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'bg-zinc-900 text-zinc-300 border border-white/10 hover:bg-zinc-800'
              }`}
            >
              {st}
            </button>
          ))}
          <select
            aria-label="Filter by payment method"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
          >
            <option value="All">All Modes</option>
            {METHOD_OPTIONS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice</th>
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Package</th>
                <th className="py-3.5 px-4">Mode</th>
                <th className="py-3.5 px-4">Total / Paid / Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400">
                    No invoices match this filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const paid = getPaid(inv);
                  const due = getBalance(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-200 tabular-nums">
                          {inv.invoiceNumber || `#${inv.id}`}
                        </div>
                        <div className="text-[11px] text-zinc-500 tabular-nums">{inv.date}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">{inv.memberName}</td>
                      <td className="py-3.5 px-4 text-xs text-zinc-300">
                        <div>{inv.packageName}</div>
                        {inv.couponCode && (
                          <span className="text-[10px] text-emerald-400">
                            Coupon: {inv.couponCode} (-₹{inv.discountAmount || 0})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-300">{inv.paymentMethod || 'UPI'}</td>
                      <td className="py-3.5 px-4 text-xs tabular-nums">
                        <div className="font-semibold text-white">₹{inv.amount.toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-zinc-400">
                          Paid ₹{paid.toLocaleString('en-IN')}
                          {due > 0 && <span className="text-rose-400"> · Due ₹{due.toLocaleString('en-IN')}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : inv.status === 'Partial'
                              ? 'bg-sky-500/15 text-sky-300'
                              : inv.status === 'Refunded' || inv.status === 'Cancelled'
                              ? 'bg-zinc-700/60 text-zinc-300'
                              : inv.status === 'Overdue'
                              ? 'bg-rose-500/15 text-rose-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {due > 0 && inv.status !== 'Refunded' && inv.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayModalInvoice(inv);
                                setPayAmountInput(due);
                                setSelectedPayMethod(((METHOD_OPTIONS as readonly string[]).includes(inv.paymentMethod || '')
                                  ? inv.paymentMethod
                                  : 'UPI') as PaymentMode);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Collect
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setReceiptInvoice(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                            title="View & Print Official Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Receipt
                          </button>
                          {inv.status !== 'Refunded' && inv.status !== 'Cancelled' && (
                            confirmRefundId === inv.id ? (
                              <button
                                type="button"
                                onClick={() => {
                                  refundInvoice(inv.id, 'Admin refund / cancellation');
                                  setConfirmRefundId(null);
                                  addToast(`Invoice #${inv.id} refunded/cancelled with audit log.`, 'info');
                                }}
                                className="px-2 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmRefundId(inv.id)}
                                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-300 cursor-pointer"
                                title="Refund or cancel invoice"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              deleteInvoice(inv.id);
                              addToast(`Invoice #${inv.id} removed.`, 'info');
                            }}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                            title="Delete invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Invoice Modal with Coupon & Partial Payment */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">Generate Smart Invoice</h2>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerateInvoice} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Select Member</label>
                <select
                  value={form.memberId}
                  onChange={(e) => setForm({ ...form, memberId: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Select Package</label>
                <select
                  value={form.packageId}
                  onChange={(e) => {
                    setForm({ ...form, packageId: Number(e.target.value) });
                    setAppliedCoupon(null);
                  }}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupon Validation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Coupon Code</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FIT20"
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 cursor-pointer"
                      title="Validate & Apply Coupon"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {couponError && <p className="text-[11px] text-rose-400 mt-1">{couponError}</p>}
                  {appliedCoupon && (
                    <p className="text-[11px] text-emerald-400 mt-1">
                      {appliedCoupon.code}: -₹{appliedCoupon.discountAmount}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Extra Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.customDiscount}
                    onChange={(e) => setForm({ ...form, customDiscount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Collection Type</label>
                  <select
                    value={form.paymentType}
                    onChange={(e) => setForm({ ...form, paymentType: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Full">Full Payment Now</option>
                    <option value="Partial">Partial Payment</option>
                    <option value="Pending">Pay Later (Pending)</option>
                  </select>
                </div>
                {form.paymentType === 'Partial' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Initial Paid (₹)</label>
                    <input
                      type="number"
                      min={1}
                      max={computedAmount}
                      value={form.partialAmount}
                      onChange={(e) => setForm({ ...form, partialAmount: Number(e.target.value) })}
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {METHOD_OPTIONS.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setForm({ ...form, paymentMethod: mode })}
                      className={`py-2 rounded-lg text-[11px] font-semibold border cursor-pointer ${
                        form.paymentMethod === mode
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-zinc-900 border-white/10 text-zinc-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Net Invoice Total</span>
                <span className="text-xl font-bold text-amber-400 tabular-nums">
                  ₹{computedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-sm font-semibold cursor-pointer"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partial / Full Payment Collection Modal */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">
              Collect Payment — {payModalInvoice.invoiceNumber || `#${payModalInvoice.id}`}
            </h3>
            <p className="text-xs text-zinc-400">
              Member: <span className="text-white font-semibold">{payModalInvoice.memberName}</span> · Outstanding Balance:{' '}
              <span className="text-rose-400 font-semibold tabular-nums">
                ₹{getBalance(payModalInvoice).toLocaleString('en-IN')}
              </span>
            </p>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Amount Received Now (₹)</label>
              <input
                type="number"
                min={1}
                max={getBalance(payModalInvoice)}
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {METHOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedPayMethod(m)}
                  className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer ${
                    selectedPayMethod === m
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-900 border-white/10 text-zinc-400'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayModalInvoice(null)}
                className="px-3.5 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={confirmRecordPayment}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                Confirm Payment & Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptInvoice && (
        <ReceiptTemplate
          invoiceId={receiptInvoice.invoiceNumber || String(receiptInvoice.id)}
          memberName={receiptInvoice.memberName}
          memberId={receiptInvoice.memberId}
          memberPhone={getMemberPhone(receiptInvoice.memberId)}
          amount={getPaid(receiptInvoice) > 0 ? getPaid(receiptInvoice) : receiptInvoice.amount}
          date={receiptInvoice.date}
          method={receiptInvoice.paymentMethod || 'UPI'}
          items={
            receiptInvoice.items || [
              { description: receiptInvoice.packageName, amount: receiptInvoice.amount, type: 'Membership' },
            ]
          }
          onClose={() => setReceiptInvoice(null)}
        />
      )}
    </div>
  );
};

export default SmartBilling;
