import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  X,
  Check,
  User,
  Eye,
  Archive,
  RotateCcw,
  Receipt,
  Calendar,
  Dumbbell,
  Salad,
  MessageCircle,
  ShieldAlert,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { gymApi } from '../../services/gymApiClient';
import { Member } from '../../../types';

const STATUS_FILTERS = ['All', 'Active', 'Pending', 'Expired', 'Inactive', 'Archived'] as const;

const statusBadge = (status: Member['status']) => {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    case 'Pending':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'Expired':
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    default:
      return 'bg-zinc-700/40 text-zinc-300 border-zinc-600/40';
  }
};

export const MembersManager: React.FC = () => {
  const {
    members,
    packages,
    invoices,
    attendanceRecords,
    staff,
    workoutTemplates,
    dietPlans,
    addMember,
    updateMember,
    archiveMember,
    deleteMember,
    refreshFromServer,
  } = useData();
  const { addToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMemberId, setViewingMemberId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [renewingMemberId, setRenewingMemberId] = useState<number | null>(null);

  const handleRenewMembership = async (member: Member) => {
    if (renewingMemberId === member.id) return;
    const pkg = packages.find((p) => p.id === member.packageId) || packages[0];
    setRenewingMemberId(member.id);
    const res = await gymApi.renewMember(member.id, {
      package_id: pkg?.id || member.packageId,
      payment_method: 'UPI',
      payment_amount: pkg?.price || 0,
      idempotency_key: `RENEW-UI-${member.id}-${Date.now()}`,
    });
    setRenewingMemberId(null);
    if (!res.ok) {
      addToast(res.error || 'Could not renew membership.', 'error');
      return;
    }
    await refreshFromServer();
    addToast(
      `Renewed ${member.name} on ${pkg?.name || 'current plan'} — valid until ${res.data?.member?.expiry_date || 'updated term'}.`,
      'success'
    );
  };

  const trainers = useMemo(
    () => staff.filter((s) => s.role.toLowerCase().includes('trainer')),
    [staff]
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    packageId: packages[0]?.id || 1,
    status: 'Active' as Member['status'],
    joinDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    fitnessGoal: 'Fitness',
    height: '172',
    weight: '72',
    avatar: '',
    assignedTrainerId: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
  });

  const viewingMember = useMemo(
    () => members.find((m) => m.id === viewingMemberId) || null,
    [members, viewingMemberId]
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter === 'Archived') {
        if (!m.archived) return false;
      } else {
        if (m.archived) return false;
        if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.loginId || '').toLowerCase().includes(q) ||
        String(m.id).includes(q)
      );
    });
  }, [members, search, statusFilter]);

  const computeExpiryFromPackage = (joinDate: string, pkgId: number) => {
    const pkg = packages.find((p) => p.id === pkgId);
    const months = pkg?.billingMonths || 1;
    const base = new Date(joinDate || Date.now());
    base.setMonth(base.getMonth() + months);
    return base.toISOString().split('T')[0];
  };

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    const defaultPkgId = packages[0]?.id || 1;
    setEditingMember(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      gender: 'Male',
      packageId: defaultPkgId,
      status: 'Active',
      joinDate: today,
      expiryDate: computeExpiryFromPackage(today, defaultPkgId),
      fitnessGoal: 'Fitness',
      height: '172',
      weight: '72',
      avatar: '',
      assignedTrainerId: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelation: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setForm({
      name: m.name,
      email: m.email,
      phone: m.phone,
      gender: m.gender || 'Male',
      packageId: m.packageId,
      status: m.status,
      joinDate: m.joinDate,
      expiryDate: m.expiryDate || computeExpiryFromPackage(m.joinDate, m.packageId),
      fitnessGoal: m.fitnessGoal || 'Fitness',
      height: String(m.height || m.physical_metrics?.height || 170),
      weight: String(m.weight || m.physical_metrics?.weight || 70),
      avatar: m.avatar || '',
      assignedTrainerId: m.assignedTrainerId ? String(m.assignedTrainerId) : '',
      emergencyName: m.emergency_contact?.name || '',
      emergencyPhone: m.emergency_contact?.phone || '',
      emergencyRelation: m.emergency_contact?.relation || '',
    });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      addToast('Please upload a profile photo under 1.5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((prev) => ({ ...prev, avatar: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('Member name and phone number are required.', 'error');
      return;
    }
    const cleanPhone = form.phone.replace(/\D/g, '').slice(-10);
    const duplicate = members.find(
      (m) => !m.archived && m.id !== editingMember?.id && m.phone.replace(/\D/g, '').slice(-10) === cleanPhone && cleanPhone.length >= 10
    );
    if (duplicate) {
      addToast(`Mobile number already registered to ${duplicate.name} (#${duplicate.id}).`, 'error');
      return;
    }

    const h = Number(form.height) || 170;
    const w = Number(form.weight) || 70;
    const expiryDate = form.expiryDate || computeExpiryFromPackage(form.joinDate, Number(form.packageId));

    if (editingMember) {
      updateMember({
        ...editingMember,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        packageId: Number(form.packageId),
        status: form.status,
        joinDate: form.joinDate,
        expiryDate,
        fitnessGoal: form.fitnessGoal,
        height: h,
        weight: w,
        avatar: form.avatar,
        assignedTrainerId: form.assignedTrainerId ? Number(form.assignedTrainerId) : undefined,
        emergency_contact: {
          name: form.emergencyName.trim(),
          phone: form.emergencyPhone.trim(),
          relation: form.emergencyRelation.trim(),
        },
        physical_metrics: {
          ...editingMember.physical_metrics,
          height: h,
          weight: w,
        },
      });
      addToast(`Updated member ${form.name.trim()}.`, 'success');
    } else {
      const nextId = Math.max(100, ...members.map((m) => m.id)) + 1;
      const created: Member = {
        id: nextId,
        name: form.name.trim(),
        email: form.email.trim() || `member${nextId}@fitnessfuture.in`,
        phone: form.phone.trim(),
        gender: form.gender,
        joinDate: form.joinDate,
        expiryDate,
        packageId: Number(form.packageId),
        status: form.status,
        avatar: form.avatar,
        loginId: `FF-${1000 + nextId}`,
        whatsappConsent: true,
        assignedTrainerId: form.assignedTrainerId ? Number(form.assignedTrainerId) : undefined,
        xp: 100,
        level: 1,
        achievements: [],
        hrv: 68,
        lbm: Math.round(w * 0.78),
        health_score: 78,
        bio_age: 26,
        assigned_tests: [],
        fitnessGoal: form.fitnessGoal,
        height: h,
        weight: w,
        medical_history: { conditions: [], pastInjuries: 'None', medications: 'None', lifestyle: {} },
        physical_metrics: {
          height: h,
          weight: w,
          body_fat: 18,
          muscle_mass: Math.round(w * 0.44),
          target_weight: w,
          body_type: 'Mesomorph',
          activity_level: 'Moderate',
        },
        automation_settings: { remind_12hrs_before: true, auto_renewal: true, ai_coaching: true, sync_id: `SYNC-${nextId}` },
        rpeHistory: [],
        anatomicalStatus: {},
        emergency_contact: {
          name: form.emergencyName.trim(),
          phone: form.emergencyPhone.trim(),
          relation: form.emergencyRelation.trim(),
        },
        initial_assessment: { fitness_level: 'Beginner', pushup_count: 15, plank_time: '45s', squat_count: 20, comments: '' },
      };
      addMember(created);
      addToast(`Added new member ${created.name} (${created.loginId}).`, 'success');
    }
    setIsModalOpen(false);
  };

  const getPackageName = (pkgId: number) =>
    packages.find((p) => p.id === pkgId)?.name || 'Standard Plan';

  const getTrainerName = (trainerId?: number) =>
    staff.find((s) => s.id === trainerId)?.name || 'Unassigned';

  const openWhatsAppReminder = (m: Member) => {
    const clean = m.phone.replace(/\D/g, '');
    const phone = clean.length === 10 ? `91${clean}` : clean;
    const text = encodeURIComponent(
      `Hi ${m.name}, friendly reminder regarding your ${getPackageName(m.packageId)} membership${
        m.expiryDate ? ` (valid till ${m.expiryDate})` : ''
      }. Reply to renew and stay on track!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Members Management</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Search, inspect full profiles, track payment &amp; attendance history, assign trainers, and archive records
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111318] border border-white/10 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, or Member ID..."
            className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((st) => {
            const count =
              st === 'Archived'
                ? members.filter((m) => m.archived).length
                : st === 'All'
                ? members.filter((m) => !m.archived).length
                : members.filter((m) => !m.archived && m.status === st).length;
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-white/10'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Package &amp; Expiry</th>
                <th className="py-3.5 px-4">Goal / Trainer</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-400">
                    No members match your current search or filter.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => {
                  const h = (m.height || m.physical_metrics?.height || 0) / 100;
                  const w = m.weight || m.physical_metrics?.weight || 0;
                  const bmi = h > 0 && w > 0 ? (w / (h * h)).toFixed(1) : '—';
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {m.avatar ? (
                            <img
                              src={m.avatar}
                              alt={m.name}
                              className="w-9 h-9 rounded-lg object-cover border border-white/15 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                              {m.name
                                .split(' ')
                                .map((p) => p[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                          <div>
                            <button
                              type="button"
                              onClick={() => setViewingMemberId(m.id)}
                              className="font-semibold text-white hover:text-amber-400 text-left cursor-pointer"
                            >
                              {m.name}
                            </button>
                            <div className="text-xs text-zinc-500 tabular-nums">
                              {m.loginId || `FF-${1000 + m.id}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-300 space-y-1">
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          {m.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          {m.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-zinc-200 font-medium">{getPackageName(m.packageId)}</div>
                        <div className="text-zinc-500 tabular-nums">
                          {m.expiryDate ? `Valid till ${m.expiryDate}` : `Joined ${m.joinDate}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="text-zinc-200">
                          {m.fitnessGoal || 'Fitness'} · <span className="text-zinc-400 tabular-nums">BMI {bmi}</span>
                        </div>
                        <div className="text-zinc-500">Trainer: {getTrainerName(m.assignedTrainerId)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          aria-label={`Status for ${m.name}`}
                          value={m.status}
                          onChange={(e) => {
                            updateMember({ ...m, status: e.target.value as Member['status'] });
                            addToast(`${m.name} marked ${e.target.value}.`, 'success');
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border bg-transparent cursor-pointer focus:outline-none ${statusBadge(
                            m.status
                          )}`}
                        >
                          <option value="Active" className="bg-zinc-900 text-white">Active</option>
                          <option value="Pending" className="bg-zinc-900 text-white">Pending</option>
                          <option value="Expired" className="bg-zinc-900 text-white">Expired</option>
                          <option value="Inactive" className="bg-zinc-900 text-white">Inactive</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingMemberId(m.id)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 cursor-pointer"
                            title="View full profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(m)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer"
                            title="Edit member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const nextArchived = !m.archived;
                              archiveMember(m.id, nextArchived);
                              addToast(
                                nextArchived ? `Archived ${m.name}.` : `Restored ${m.name} from archive.`,
                                'info'
                              );
                            }}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                            title={m.archived ? 'Restore member' : 'Archive member'}
                          >
                            {m.archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                          </button>
                          {confirmDeleteId === m.id ? (
                            <button
                              type="button"
                              onClick={() => {
                                deleteMember(m.id);
                                setConfirmDeleteId(null);
                                addToast(`Deleted ${m.name}.`, 'info');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirm
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(m.id)}
                              className="p-2 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Member Full Profile Drawer */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-black/75 flex justify-end">
          <div className="bg-[#111318] border-l border-white/15 w-full max-w-xl h-full overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                {viewingMember.avatar ? (
                  <img
                    src={viewingMember.avatar}
                    alt={viewingMember.name}
                    className="w-14 h-14 rounded-xl object-cover border border-white/15"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-lg font-bold text-amber-400">
                    {viewingMember.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-white">{viewingMember.name}</h2>
                  <div className="text-xs text-zinc-400 tabular-nums">
                    {viewingMember.loginId || `FF-${1000 + viewingMember.id}`} · {viewingMember.phone}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusBadge(viewingMember.status)}`}>
                      {viewingMember.status}
                    </span>
                    <span className="text-xs text-zinc-400">{getPackageName(viewingMember.packageId)}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMemberId(null)}
                className="p-1.5 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={renewingMemberId === viewingMember.id}
                onClick={() => void handleRenewMembership(viewingMember)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${renewingMemberId === viewingMember.id ? 'animate-spin' : ''}`} />
                {renewingMemberId === viewingMember.id ? 'Renewing...' : 'Renew Membership'}
              </button>
              <button
                type="button"
                onClick={() => openWhatsAppReminder(viewingMember)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Send Expiry / Renewal Reminder
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = viewingMember;
                  setViewingMemberId(null);
                  openEditModal(target);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            </div>

            {/* Emergency Contact & Trainer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-white/10 space-y-1">
                <div className="text-zinc-400 font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Emergency Contact
                </div>
                <div className="text-white font-medium">
                  {viewingMember.emergency_contact?.name || 'Not provided'}
                  {viewingMember.emergency_contact?.relation ? ` (${viewingMember.emergency_contact.relation})` : ''}
                </div>
                <div className="text-zinc-400 tabular-nums">
                  {viewingMember.emergency_contact?.phone || '—'}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-white/10 space-y-1">
                <div className="text-zinc-400 font-semibold">Assigned Trainer</div>
                <select
                  value={viewingMember.assignedTrainerId || ''}
                  onChange={(e) => {
                    const tid = e.target.value ? Number(e.target.value) : undefined;
                    updateMember({ ...viewingMember, assignedTrainerId: tid });
                    addToast('Assigned trainer updated.', 'success');
                  }}
                  className="w-full mt-1 bg-zinc-950 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500 outline-none"
                >
                  <option value="">Unassigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialization || t.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assigned Workout & Diet Plans */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-white/10">
                <div className="text-zinc-400 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-amber-400" />
                  Workout Program
                </div>
                {viewingMember.approvedAiPlan ? (
                  <p className="text-zinc-200 font-medium">• {viewingMember.approvedAiPlan}</p>
                ) : workoutTemplates.filter((w) => w.category === viewingMember.fitnessGoal).length > 0 ? (
                  <ul className="space-y-1 text-zinc-300">
                    {workoutTemplates
                      .filter((w) => w.category === viewingMember.fitnessGoal)
                      .slice(0, 2)
                      .map((w) => (
                        <li key={w.id} className="truncate">• {w.name} ({w.level})</li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-zinc-500">No workout plan assigned yet.</p>
                )}
              </div>
              <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-white/10">
                <div className="text-zinc-400 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Salad className="w-3.5 h-3.5 text-emerald-400" />
                  Matching Diet Plans
                </div>
                {dietPlans.filter((d) => !viewingMember.fitnessGoal || d.goal === viewingMember.fitnessGoal).length === 0 ? (
                  <p className="text-zinc-500">No matching diet plan assigned yet.</p>
                ) : (
                  <ul className="space-y-1 text-zinc-200">
                    {dietPlans
                      .filter((d) => !viewingMember.fitnessGoal || d.goal === viewingMember.fitnessGoal)
                      .slice(0, 2)
                      .map((d) => (
                        <li key={d.id} className="truncate">• {d.name} ({d.calories} kcal)</li>
                      ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold text-white flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                Payment &amp; Invoice History
              </div>
              <div className="divide-y divide-white/5 text-xs">
                {invoices.filter((i) => i.memberId === viewingMember.id).length === 0 ? (
                  <div className="p-4 text-zinc-500">No invoices recorded for this member.</div>
                ) : (
                  invoices
                    .filter((i) => i.memberId === viewingMember.id)
                    .map((inv) => (
                      <div key={inv.id} className="px-4 py-2.5 flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{inv.packageName || inv.invoiceNumber || inv.id}</div>
                          <div className="text-zinc-500 tabular-nums">
                            {inv.date} · {inv.paymentMethod || 'UPI'}
                          </div>
                        </div>
                        <div className="text-right tabular-nums">
                          <div className="text-white font-semibold">₹{inv.amount.toLocaleString('en-IN')}</div>
                          <div className="text-[11px] text-amber-400">{inv.status}</div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Attendance History */}
            <div className="bg-zinc-900/60 border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-white/10 text-xs font-semibold text-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Recent Attendance Logs
              </div>
              <div className="divide-y divide-white/5 text-xs">
                {attendanceRecords.filter((a) => a.memberId === viewingMember.id).length === 0 ? (
                  <div className="p-4 text-zinc-500">No check-ins recorded yet.</div>
                ) : (
                  attendanceRecords
                    .filter((a) => a.memberId === viewingMember.id)
                    .slice(0, 8)
                    .map((att) => (
                      <div key={att.id} className="px-4 py-2.5 flex items-center justify-between">
                        <div className="tabular-nums text-zinc-300">
                          {att.date} · In {att.checkInTime}
                          {att.checkOutTime ? ` → Out ${att.checkOutTime}` : ''}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-medium ${
                            att.status === 'Denied'
                              ? 'bg-rose-500/15 text-rose-300'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {att.status}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                {editingMember ? 'Edit Member Profile' : 'Add New Member'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Photo Upload Row */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-zinc-900/70 border border-white/10">
                {form.avatar ? (
                  <img src={form.avatar} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/15" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-xs font-medium text-white">Member Photograph</div>
                  <div className="text-[11px] text-zinc-400">Optional ID photo for front-desk verification (max 1.5 MB)</div>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Membership Plan</label>
                  <select
                    value={form.packageId}
                    onChange={(e) => {
                      const pkgId = Number(e.target.value);
                      setForm({
                        ...form,
                        packageId: pkgId,
                        expiryDate: computeExpiryFromPackage(form.joinDate, pkgId),
                      });
                    }}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{p.price.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Assigned Trainer</label>
                  <select
                    value={form.assignedTrainerId}
                    onChange={(e) => setForm({ ...form, assignedTrainerId: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="">Unassigned</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Fitness Goal</label>
                  <select
                    value={form.fitnessGoal}
                    onChange={(e) => setForm({ ...form, fitnessGoal: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Fitness">Fitness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Member['status'] })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Expired">Expired</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm({ ...form, height: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-semibold text-zinc-300 mb-2">Emergency Contact</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Contact Name"
                    value={form.emergencyName}
                    onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Emergency Phone"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Relation (e.g. Father)"
                    value={form.emergencyRelation}
                    onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
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
                  {editingMember ? 'Save Changes' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersManager;
