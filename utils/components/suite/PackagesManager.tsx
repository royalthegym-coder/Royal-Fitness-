import React, { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Check, Calculator, Percent, X, Power } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { Package } from '../../../types';

export const PackagesManager: React.FC = () => {
  const { packages, members, addPackage, updatePackage, deletePackage } = useData();
  const { addToast } = useToast();

  // Interactive Annual Discount Calculator State
  const [baseMonthlyFee, setBaseMonthlyFee] = useState(1500);
  const [annualDiscountPct, setAnnualDiscountPct] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: 'General',
    billingMonths: 12,
    monthlyBaseRate: 1500,
    registrationFee: 500,
    discountPercent: 20,
    fixedDiscount: 0,
    isActive: true,
    featuresText: 'Full Gym Access\nCardio & Strength Zone\nMonthly Body Metrics Check',
    details: '',
  });

  const calculatedPrice = useMemo(() => {
    const gross = form.monthlyBaseRate * form.billingMonths;
    const pctDiscount = Math.round((gross * form.discountPercent) / 100);
    const totalDiscount = pctDiscount + (Number(form.fixedDiscount) || 0);
    const planNet = Math.max(0, gross - totalDiscount);
    const regFee = Math.max(0, Number(form.registrationFee) || 0);
    return {
      gross,
      pctDiscount,
      fixedDiscount: Number(form.fixedDiscount) || 0,
      totalDiscount,
      planNet,
      regFee,
      totalFirstPayment: planNet + regFee,
    };
  }, [form.monthlyBaseRate, form.billingMonths, form.discountPercent, form.fixedDiscount, form.registrationFee]);

  const annualCalc = useMemo(() => {
    const fullYear = baseMonthlyFee * 12;
    const savings = Math.round((fullYear * annualDiscountPct) / 100);
    const finalAnnual = fullYear - savings;
    const effectiveMonthly = Math.round(finalAnnual / 12);
    const quarterlyPrice = Math.round(baseMonthlyFee * 3 * (1 - Math.min(10, annualDiscountPct / 2) / 100));
    const halfYearlyPrice = Math.round(baseMonthlyFee * 6 * (1 - Math.min(15, annualDiscountPct * 0.75) / 100));
    return { fullYear, savings, finalAnnual, effectiveMonthly, quarterlyPrice, halfYearlyPrice };
  }, [baseMonthlyFee, annualDiscountPct]);

  const openAddModal = (presetMonths = 12, presetDiscount = annualDiscountPct) => {
    setEditingPkg(null);
    setForm({
      name: presetMonths === 12 ? `Annual Membership (${presetDiscount}% Off)` : '',
      category: presetMonths === 12 ? 'Annual' : 'General',
      billingMonths: presetMonths,
      monthlyBaseRate: baseMonthlyFee,
      registrationFee: presetMonths === 12 ? 0 : 500,
      discountPercent: presetDiscount,
      fixedDiscount: 0,
      isActive: true,
      featuresText: 'Full Gym Floor Access\nCardio & Strength Zone\nAI Workout & Diet Guidance',
      details: presetMonths === 12 ? `Annual discount of ${presetDiscount}% applied automatically.` : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: Package) => {
    setEditingPkg(pkg);
    const months =
      pkg.billingMonths ||
      (pkg.duration.includes('12') ? 12 : pkg.duration.includes('6') ? 6 : pkg.duration.includes('3') ? 3 : 1);
    const base = pkg.monthlyBaseRate || Math.round(pkg.price / months);
    setForm({
      name: pkg.name,
      category: pkg.category,
      billingMonths: months,
      monthlyBaseRate: base,
      registrationFee: pkg.registrationFee ?? 0,
      discountPercent: pkg.discountPercent || 0,
      fixedDiscount: pkg.fixedDiscount || 0,
      isActive: pkg.isActive !== false,
      featuresText: (pkg.features || []).join('\n'),
      details: pkg.details || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      addToast('Package name is required.', 'error');
      return;
    }
    const duration = form.billingMonths === 1 ? '1 Month' : `${form.billingMonths} Months`;
    const features = form.featuresText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Package = {
      id: editingPkg ? editingPkg.id : Math.max(0, ...packages.map((p) => p.id)) + 1,
      name: form.name.trim(),
      category: form.category,
      price: calculatedPrice.planNet,
      duration,
      billingMonths: form.billingMonths,
      monthlyBaseRate: form.monthlyBaseRate,
      registrationFee: calculatedPrice.regFee,
      discountPercent: form.discountPercent,
      fixedDiscount: calculatedPrice.fixedDiscount,
      isActive: form.isActive,
      features,
      details:
        form.details.trim() ||
        (calculatedPrice.totalDiscount > 0
          ? `Save ₹${calculatedPrice.totalDiscount.toLocaleString('en-IN')} on this plan`
          : 'Standard fee structure'),
      isPopular: form.billingMonths === 12,
    };

    if (editingPkg) {
      updatePackage(payload);
      addToast(`Updated package "${payload.name}".`, 'success');
    } else {
      addPackage(payload);
      addToast(`Created package "${payload.name}".`, 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Packages &amp; Discounts</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Configure monthly, quarterly, half-yearly, annual, or custom plans with registration fees and % / fixed discounts
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal(1, 0)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Package
        </button>
      </div>

      {/* Annual Discount Logic Calculator */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Annual Discount Pricing Calculator</h2>
              <p className="text-xs text-zinc-400">Adjust base monthly fee and annual discount percentage to preview savings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAddModal(12, annualDiscountPct)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-amber-400 text-xs font-semibold cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5" />
            Create Annual Plan ({annualDiscountPct}% Off)
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Base Monthly Fee (₹)</label>
              <input
                type="number"
                min={500}
                step={100}
                value={baseMonthlyFee}
                onChange={(e) => setBaseMonthlyFee(Math.max(0, Number(e.target.value)))}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Annual Discount</span>
                <span className="text-amber-400 font-semibold tabular-nums">{annualDiscountPct}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={40}
                step={1}
                value={annualDiscountPct}
                onChange={(e) => setAnnualDiscountPct(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-zinc-400">Quarterly (3 Months)</div>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              ₹{annualCalc.quarterlyPrice.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Auto-tiered 3M discount</div>
          </div>

          <div className="bg-zinc-900/80 border border-white/10 rounded-lg p-4">
            <div className="text-xs text-zinc-400">Half-Yearly (6 Months)</div>
            <div className="text-xl font-bold text-white mt-1 tabular-nums">
              ₹{annualCalc.halfYearlyPrice.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-zinc-500 mt-1">Auto-tiered 6M discount</div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-semibold">Annual (12 Months)</span>
              <span className="text-emerald-400 font-semibold tabular-nums">
                Save ₹{annualCalc.savings.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1 tabular-nums">
              ₹{annualCalc.finalAnnual.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-zinc-300 mt-1 tabular-nums">
              Effective ₹{annualCalc.effectiveMonthly.toLocaleString('en-IN')}/mo (MRP ₹
              {annualCalc.fullYear.toLocaleString('en-IN')})
            </div>
          </div>
        </div>
      </div>

      {/* Packages Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const enrolledCount = members.filter((m) => !m.archived && m.packageId === pkg.id).length;
          const months = pkg.billingMonths || 1;
          const gross = (pkg.monthlyBaseRate || Math.round(pkg.price / months)) * months;
          const savings = Math.max(0, gross - pkg.price);
          const isActive = pkg.isActive !== false;

          return (
            <div
              key={pkg.id}
              className={`bg-[#111318] border rounded-xl p-5 flex flex-col justify-between ${
                !isActive ? 'opacity-60 border-white/5' : pkg.isPopular ? 'border-amber-500/40' : 'border-white/10'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-400">{pkg.category}</span>
                      {!isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                          Paused
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">{pkg.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        updatePackage({ ...pkg, isActive: !isActive });
                        addToast(`${pkg.name} ${!isActive ? 'activated' : 'paused'}.`, 'info');
                      }}
                      className={`p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 cursor-pointer ${
                        isActive ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                      title={isActive ? 'Pause package' : 'Activate package'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(pkg)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                      title="Edit package"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deletePackage(pkg.id);
                        addToast(`Deleted package "${pkg.name}".`, 'info');
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                      title="Delete package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-white tabular-nums">
                    ₹{pkg.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-zinc-400">/ {pkg.duration}</span>
                  {pkg.discountPercent && pkg.discountPercent > 0 ? (
                    <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 tabular-nums">
                      {pkg.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {pkg.registrationFee && pkg.registrationFee > 0 ? (
                    <span className="text-zinc-400 tabular-nums">
                      + ₹{pkg.registrationFee.toLocaleString('en-IN')} registration fee
                    </span>
                  ) : (
                    <span className="text-emerald-400">Zero registration fee</span>
                  )}
                  {pkg.fixedDiscount && pkg.fixedDiscount > 0 ? (
                    <span className="text-amber-400 tabular-nums">
                      Includes ₹{pkg.fixedDiscount.toLocaleString('en-IN')} flat off
                    </span>
                  ) : null}
                </div>

                {savings > 0 && (
                  <p className="text-xs text-emerald-400 mt-1 tabular-nums">
                    Saves ₹{savings.toLocaleString('en-IN')} compared to monthly billing
                  </p>
                )}

                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {(pkg.features || []).map((feat, idx) => (
                    <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                <span>Active subscribers</span>
                <span className="font-semibold text-white tabular-nums">{enrolledCount} members</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">
                {editingPkg ? 'Edit Package' : 'Create Membership Package'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Package Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Annual">Annual</option>
                    <option value="Personal Training">Personal Training</option>
                    <option value="Couple/Family">Couple / Family</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={form.billingMonths}
                    onChange={(e) => {
                      const months = Math.max(1, Number(e.target.value));
                      setForm({ ...form, billingMonths: months });
                    }}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Base Monthly Rate (₹)</label>
                  <input
                    type="number"
                    min={100}
                    value={form.monthlyBaseRate}
                    onChange={(e) => setForm({ ...form, monthlyBaseRate: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Registration Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.registrationFee}
                    onChange={(e) => setForm({ ...form, registrationFee: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Percentage Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Fixed Discount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.fixedDiscount}
                    onChange={(e) => setForm({ ...form, fixedDiscount: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900 border border-white/10 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    Plan Fee (Gross ₹{calculatedPrice.gross.toLocaleString('en-IN')} − ₹
                    {calculatedPrice.totalDiscount.toLocaleString('en-IN')})
                  </span>
                  <span className="text-lg font-bold text-amber-400 tabular-nums">
                    ₹{calculatedPrice.planNet.toLocaleString('en-IN')}
                  </span>
                </div>
                {calculatedPrice.regFee > 0 && (
                  <div className="flex items-center justify-between text-zinc-400 tabular-nums">
                    <span>Total at Admission (incl. ₹{calculatedPrice.regFee.toLocaleString('en-IN')} reg. fee)</span>
                    <span className="text-emerald-400 font-semibold">
                      ₹{calculatedPrice.totalFirstPayment.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Features (one per line)</label>
                <textarea
                  rows={3}
                  value={form.featuresText}
                  onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer"
                >
                  {editingPkg ? 'Save Package' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackagesManager;
