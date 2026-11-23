import React, { useMemo, useState } from 'react';
import {
  UserPlus,
  Activity,
  HeartPulse,
  CheckCircle2,
  Scale,
  Stethoscope,
  AlertTriangle,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { gymApi } from '../../services/gymApiClient';
import { View } from '../../../types';

const MEDICAL_CONDITIONS = [
  'Hypertension / High BP',
  'Diabetes',
  'Asthma',
  'Lower Back Pain',
  'Knee / Joint Pain',
  'Thyroid Condition',
];

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

interface ScientificAdmissionProps {
  setCurrentView?: (view: View) => void;
}

export const ScientificAdmission: React.FC<ScientificAdmissionProps> = ({ setCurrentView }) => {
  const {
    members,
    packages,
    leads,
    globalFees,
    validateOfferCoupon,
    refreshFromServer,
  } = useData();
  const { addToast } = useToast();

  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    offerId: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    age: 26,
    heightCm: 174,
    weightKg: 76,
    bodyFatPct: 19,
    waistCm: 84,
    restingHr: 70,
    bloodGroup: 'O+',
    fitnessGoal: 'Weight Loss' as 'Weight Loss' | 'Muscle Gain' | 'Fitness',
    trainingExperience: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    activityLevel: 'Moderate',
    conditions: [] as string[],
    pastInjuries: '',
    medications: '',
    emergencyName: '',
    emergencyPhone: '',
    packageId: packages[0]?.id || 1,
    admissionFee: globalFees?.admissionFee ?? 500,
    paymentMethod: 'UPI' as 'UPI' | 'Cash' | 'Card' | 'Bank Transfer',
    createInvoice: true,
    markPaidNow: true,
    whatsappConsent: true,
    digitalConsent: false,
  });

  const openLeads = useMemo(
    () => leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost'),
    [leads]
  );

  // Real-time duplicate mobile detection
  const duplicateMember = useMemo(() => {
    const norm = normalizePhone(form.phone);
    if (norm.length < 10) return null;
    return members.find((m) => !m.archived && normalizePhone(m.phone) === norm) || null;
  }, [form.phone, members]);

  const selectedPkg = useMemo(
    () => packages.find((p) => p.id === Number(form.packageId)) || packages[0],
    [packages, form.packageId]
  );

  const pricing = useMemo(() => {
    const planPrice = selectedPkg?.price || 0;
    const regFee = Math.max(0, Number(form.admissionFee) || 0);
    const discount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const totalPayable = Math.max(0, planPrice + regFee - discount);
    return { planPrice, regFee, discount, totalPayable };
  }, [selectedPkg, form.admissionFee, appliedCoupon]);

  const healthMetrics = useMemo(() => {
    const hM = Math.max(0.5, form.heightCm / 100);
    const bmi = Number((form.weightKg / (hM * hM)).toFixed(1));
    let category = 'Normal Weight';
    let colorClass = 'text-emerald-400';
    if (bmi < 18.5) {
      category = 'Underweight';
      colorClass = 'text-sky-400';
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Overweight';
      colorClass = 'text-amber-400';
    } else if (bmi >= 30) {
      category = 'Obese';
      colorClass = 'text-rose-400';
    }

    const idealMin = Math.round(18.5 * hM * hM);
    const idealMax = Math.round(24.9 * hM * hM);
    const bmr = Math.round(
      10 * form.weightKg + 6.25 * form.heightCm - 5 * form.age + (form.gender === 'Female' ? -161 : 5)
    );
    const multiplier =
      form.activityLevel === 'Sedentary' ? 1.2 : form.activityLevel === 'Active' ? 1.55 : 1.375;
    const tdee = Math.round(bmr * multiplier);
    const recommendedCalories =
      form.fitnessGoal === 'Weight Loss'
        ? Math.max(1200, tdee - 450)
        : form.fitnessGoal === 'Muscle Gain'
        ? tdee + 300
        : tdee;

    return { bmi, category, colorClass, idealMin, idealMax, bmr, tdee, recommendedCalories };
  }, [form.heightCm, form.weightKg, form.age, form.gender, form.activityLevel, form.fitnessGoal]);

  const handlePrefillFromLead = (leadIdStr: string) => {
    setSelectedLeadId(leadIdStr);
    const lead = openLeads.find((l) => String(l.id) === leadIdStr);
    if (!lead) return;
    setForm((prev) => ({
      ...prev,
      name: lead.name,
      phone: lead.phone,
      email: lead.email || prev.email,
      fitnessGoal: (['Weight Loss', 'Muscle Gain', 'Fitness'].includes(lead.goal || '')
        ? lead.goal
        : 'Fitness') as any,
    }));
    addToast(`Loaded lead "${lead.name}" into admission workflow.`, 'info');
  };

  const handleApplyCoupon = () => {
    setCouponError(null);
    if (!couponInput.trim()) {
      setAppliedCoupon(null);
      return;
    }
    const res = validateOfferCoupon(couponInput, selectedPkg?.price || 0, selectedPkg?.name);
    if (!res.valid || !res.offer) {
      setAppliedCoupon(null);
      setCouponError(res.reason || 'Invalid coupon code.');
      return;
    }
    setAppliedCoupon({
      code: res.offer.code,
      discountAmount: res.discountAmount,
      offerId: res.offer.id,
    });
    addToast(`Coupon ${res.offer.code} applied — saved ₹${res.discountAmount.toLocaleString('en-IN')}.`, 'success');
  };

  const toggleCondition = (cond: string) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(cond)
        ? prev.conditions.filter((c) => c !== cond)
        : [...prev.conditions, cond],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanPhone = normalizePhone(form.phone);
    if (!form.name.trim() || cleanPhone.length < 10) {
      addToast('Full name and valid 10-digit mobile number are required.', 'error');
      return;
    }
    if (duplicateMember) {
      addToast(
        `Duplicate mobile detected: ${cleanPhone} already belongs to ${duplicateMember.name} (#${duplicateMember.id}).`,
        'error'
      );
      return;
    }
    if (!form.digitalConsent) {
      addToast('Please confirm member digital consent & safety acknowledgment before submitting.', 'error');
      return;
    }

    setSubmitting(true);
    const pkg = selectedPkg;
    const medicalSummary = [
      `BMI ${healthMetrics.bmi} (${healthMetrics.category})`,
      `Target ${healthMetrics.recommendedCalories} kcal/day`,
      `Blood Group: ${form.bloodGroup}`,
      form.conditions.length > 0 ? `Conditions: ${form.conditions.join(', ')}` : '',
      form.pastInjuries.trim() ? `Injuries: ${form.pastInjuries.trim()}` : '',
      form.medications.trim() ? `Medications: ${form.medications.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    const res = await gymApi.processAdmission({
      name: form.name.trim(),
      phone: cleanPhone,
      email: form.email.trim() || undefined,
      gender: form.gender,
      package_id: pkg?.id || 1,
      fitness_goal: form.fitnessGoal,
      training_experience: form.trainingExperience,
      height_cm: form.heightCm,
      weight_kg: form.weightKg,
      whatsapp_consent: form.whatsappConsent,
      digital_consent: true,
      admission_fee: pricing.regFee,
      coupon_code: appliedCoupon?.code,
      payment_method: form.paymentMethod,
      payment_amount: form.createInvoice && form.markPaidNow ? pricing.totalPayable : 0,
      lead_id: selectedLeadId ? Number(selectedLeadId) : undefined,
      emergency_contact: {
        name: form.emergencyName.trim() || 'Family Contact',
        phone: form.emergencyPhone.trim() || cleanPhone,
        relation: 'Emergency Contact',
      },
      medical_notes: medicalSummary,
      idempotency_key: `ADM-UI-${cleanPhone}-${Date.now()}`,
    });

    if (!res.ok || !res.data?.success) {
      setSubmitting(false);
      addToast(res.error || 'Admission failed. Please verify inputs and try again.', 'error');
      return;
    }

    await refreshFromServer();
    setSubmitting(false);

    const createdMember = res.data.member;
    const createdInvoice = res.data.invoice;
    addToast(
      `Admitted ${createdMember?.name || form.name.trim()} (ID ${createdMember?.member_code || createdMember?.id}, valid until ${createdMember?.expiry_date || 'active term'}) — Invoice ${createdInvoice?.invoice_number || ''} synced.`,
      'success'
    );
    setSelectedLeadId('');
    setCouponInput('');
    setAppliedCoupon(null);
    setForm((prev) => ({
      ...prev,
      name: '',
      phone: '',
      email: '',
      conditions: [],
      pastInjuries: '',
      medications: '',
      emergencyName: '',
      emergencyPhone: '',
      digitalConsent: false,
    }));
    if (setCurrentView) {
      setCurrentView('members');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Scientific AI Admission System</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Guided onboarding with duplicate-mobile check, BMI & metabolic analysis, fee/coupon calculation, and digital consent
          </p>
        </div>
        {openLeads.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              aria-label="Prefill admission from lead"
              value={selectedLeadId}
              onChange={(e) => handlePrefillFromLead(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="">Convert from Lead (Optional)</option>
              {openLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.phone} ({l.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="xl:col-span-2 space-y-5">
          {/* 1. Member Identity & Plan */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              1. Member Identity, Experience & Membership Selection
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Verma"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Mobile Number *</label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none ${
                    duplicateMember ? 'border-rose-500' : 'border-white/10 focus:border-amber-500'
                  }`}
                />
                {duplicateMember && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Duplicate mobile: already registered to {duplicateMember.name} (#{duplicateMember.id})
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="member@email.com"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min={12}
                    max={90}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Membership Package</label>
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
                      {p.name} — ₹{p.price.toLocaleString('en-IN')} ({p.duration})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Fitness Goal</label>
                  <select
                    value={form.fitnessGoal}
                    onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Fitness">Fitness & Stamina</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Training Experience</label>
                  <select
                    value={form.trainingExperience}
                    onChange={(e) => setForm({ ...form, trainingExperience: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                  placeholder="Parent / Spouse / Guardian"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                  placeholder="Emergency mobile number"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* 2. Health & Body Metrics */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              2. Body & Health Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={240}
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={220}
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Body Fat (%)</label>
                <input
                  type="number"
                  min={5}
                  max={55}
                  value={form.bodyFatPct}
                  onChange={(e) => setForm({ ...form, bodyFatPct: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Waist (cm)</label>
                <input
                  type="number"
                  min={50}
                  max={160}
                  value={form.waistCm}
                  onChange={(e) => setForm({ ...form, waistCm: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Resting HR (bpm)</label>
                <input
                  type="number"
                  min={40}
                  max={130}
                  value={form.restingHr}
                  onChange={(e) => setForm({ ...form, restingHr: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Blood Group</label>
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 3. Medical Screening */}
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-rose-400" />
              3. Medical Screening & Injury Notes
            </h2>
            <div className="flex flex-wrap gap-2">
              {MEDICAL_CONDITIONS.map((cond) => {
                const selected = form.conditions.includes(cond);
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => toggleCondition(cond)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
                        : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Past Injuries / Surgeries</label>
                <input
                  type="text"
                  value={form.pastInjuries}
                  onChange={(e) => setForm({ ...form, pastInjuries: e.target.value })}
                  placeholder="e.g. Shoulder strain or None"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Current Medications</label>
                <input
                  type="text"
                  value={form.medications}
                  onChange={(e) => setForm({ ...form, medications: e.target.value })}
                  placeholder="List medications or None"
                  className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live BMI + Fee Calculator + Consent + Submit */}
        <div className="space-y-5">
          <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                Live BMI & Fee Breakdown
              </h2>
              <HeartPulse className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-white/10 text-center">
              <div className="text-xs text-zinc-400 uppercase tracking-wider">Body Mass Index (BMI)</div>
              <div className={`text-4xl font-bold mt-1 tabular-nums ${healthMetrics.colorClass}`}>
                {healthMetrics.bmi}
              </div>
              <div className={`text-xs font-semibold mt-1 ${healthMetrics.colorClass}`}>
                {healthMetrics.category} · Target {healthMetrics.recommendedCalories} kcal/day
              </div>
            </div>

            {/* Admission Fee + Coupon Calculator */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Admission Fee (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.admissionFee}
                    onChange={(e) => setForm({ ...form, admissionFee: Math.max(0, Number(e.target.value)) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Promo / Coupon Code</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="FIT20"
                      className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold cursor-pointer"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              {couponError && <p className="text-[11px] text-rose-400">{couponError}</p>}

              <div className="p-3 rounded-lg bg-zinc-900/90 border border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>{selectedPkg?.name || 'Membership Plan'}</span>
                  <span className="tabular-nums text-zinc-200">₹{pricing.planPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Admission Fee</span>
                  <span className="tabular-nums text-zinc-200">₹{pricing.regFee.toLocaleString('en-IN')}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Coupon ({appliedCoupon?.code})</span>
                    <span className="tabular-nums">-₹{pricing.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/10 font-bold text-white text-sm">
                  <span>Final Payable</span>
                  <span className="text-amber-400 tabular-nums">
                    ₹{pricing.totalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {form.createInvoice && (
                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value as any })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-2 text-xs text-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.markPaidNow}
                      onChange={(e) => setForm({ ...form, markPaidNow: e.target.checked })}
                      className="accent-emerald-500"
                    />
                    Paid Now
                  </label>
                </div>
              )}

              <label className="flex items-start gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.whatsappConsent}
                  onChange={(e) => setForm({ ...form, whatsappConsent: e.target.checked })}
                  className="accent-emerald-500 mt-0.5"
                />
                <span>Member consents to WhatsApp receipts & renewal reminders</span>
              </label>

              <label className="flex items-start gap-2 text-xs text-zinc-200 p-2.5 rounded-lg bg-zinc-900 border border-amber-500/25 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.digitalConsent}
                  onChange={(e) => setForm({ ...form, digitalConsent: e.target.checked })}
                  className="accent-amber-500 mt-0.5"
                />
                <span className="leading-relaxed">
                  <strong className="text-amber-400 inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Digital Consent Required:
                  </strong>{' '}
                  Member confirms health disclosures are accurate and agrees to gym safety guidelines.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || Boolean(duplicateMember) || !form.digitalConsent}
                className="w-full py-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Completing Admission...' : 'Complete Scientific Admission'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ScientificAdmission;
