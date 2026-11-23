import React, { useMemo, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Clock,
  Star,
  X,
  Shield,
  CheckCircle2,
  Wallet,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import { Staff } from '../../../types';

const ROLES = ['All', 'Trainer', 'Receptionist', 'Manager', 'Dietitian', 'Administrator'] as const;

const ROLE_ACCESS_SCOPE: Record<string, string> = {
  Administrator: 'Full System & Billing Control',
  Manager: 'Operations, Staff, Billing & Reports',
  Trainer: 'Members, Workouts & Attendance',
  Dietitian: 'Nutrition Plans & Health Metrics',
  Receptionist: 'Admissions, Check-In & Leads',
};

export const StaffManager: React.FC = () => {
  const { staff, members, addStaff, updateStaff, deleteStaff } = useData();
  const { addToast } = useToast();

  const [roleFilter, setRoleFilter] = useState<(typeof ROLES)[number]>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);

  const [form, setForm] = useState({
    name: '',
    role: 'Trainer',
    phone: '',
    email: '',
    salary: 28000,
    shift: '06:00 AM - 02:00 PM',
    specialization: '',
    status: 'Active' as 'Active' | 'On Leave' | 'Inactive',
    attendanceToday: 'Present' as 'Present' | 'Absent' | 'On Leave',
    payrollStatus: 'Pending' as 'Paid' | 'Pending',
    activeClients: 0,
  });

  const filtered = useMemo(() => {
    if (roleFilter === 'All') return staff;
    return staff.filter((s) => s.role.toLowerCase() === roleFilter.toLowerCase());
  }, [staff, roleFilter]);

  const payrollStats = useMemo(() => {
    const total = staff.reduce((sum, s) => sum + (s.salary || 0), 0);
    const paid = staff
      .filter((s) => s.payrollStatus === 'Paid')
      .reduce((sum, s) => sum + (s.salary || 0), 0);
    const presentToday = staff.filter((s) => (s.attendanceToday || 'Present') === 'Present').length;
    return { total, paid, pending: Math.max(0, total - paid), presentToday };
  }, [staff]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      role: 'Trainer',
      phone: '',
      email: '',
      salary: 28000,
      shift: '06:00 AM - 02:00 PM',
      specialization: '',
      status: 'Active',
      attendanceToday: 'Present',
      payrollStatus: 'Pending',
      activeClients: 0,
    });
    setIsModalOpen(true);
  };

  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({
      name: s.name,
      role: s.role,
      phone: s.phone,
      email: s.email || '',
      salary: s.salary,
      shift: s.shift || '06:00 AM - 02:00 PM',
      specialization: s.specialization || '',
      status: s.status || 'Active',
      attendanceToday: s.attendanceToday || 'Present',
      payrollStatus: s.payrollStatus || 'Pending',
      activeClients: s.activeClients || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      addToast('Staff name and phone number are required.', 'error');
      return;
    }

    const payload: Staff = {
      id: editing ? editing.id : Math.max(0, ...staff.map((s) => s.id)) + 1,
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim(),
      email: form.email.trim(),
      joinDate: editing?.joinDate || new Date().toISOString().split('T')[0],
      salary: Number(form.salary) || 0,
      shift: form.shift,
      specialization: form.specialization.trim() || `${form.role} Specialist`,
      status: form.status,
      attendanceToday: form.attendanceToday,
      payrollStatus: form.payrollStatus,
      rating: editing?.rating || 4.8,
      activeClients: Number(form.activeClients) || 0,
    };

    if (editing) {
      updateStaff(payload);
      addToast(`Updated ${payload.name}'s profile.`, 'success');
    } else {
      addStaff(payload);
      addToast(`Added ${payload.name} (${payload.role}).`, 'success');
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff Management &amp; Payroll</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Role-based access profiles, daily staff attendance, trainer-member assignments, and payroll tracking
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Role & Payroll Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Total Team</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">{staff.length}</div>
          <div className="text-xs text-emerald-400 mt-1 tabular-nums">
            {payrollStats.presentToday} present today
          </div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Trainers &amp; Coaches</div>
          <div className="text-2xl font-bold text-white mt-1 tabular-nums">
            {staff.filter((s) => s.role === 'Trainer' || s.role === 'Dietitian').length}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Client training &amp; diet</div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Monthly Payroll</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">
            ₹{payrollStats.total.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-zinc-500 mt-1 tabular-nums">
            ₹{payrollStats.paid.toLocaleString('en-IN')} disbursed
          </div>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-4">
          <div className="text-xs text-zinc-400">Pending Payroll</div>
          <div className="text-2xl font-bold text-rose-400 mt-1 tabular-nums">
            ₹{payrollStats.pending.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-zinc-500 mt-1">Current cycle due</div>
        </div>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setRoleFilter(role)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              roleFilter === role
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'bg-[#111318] text-zinc-300 border border-white/10 hover:bg-zinc-800'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Staff Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const assignedMembers = members.filter((m) => !m.archived && m.assignedTrainerId === s.id).length;
          const clientCount = assignedMembers > 0 ? assignedMembers : s.activeClients || 0;
          const attendanceToday = s.attendanceToday || 'Present';
          const payrollStatus = s.payrollStatus || 'Pending';

          return (
            <div key={s.id} className="bg-[#111318] border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold text-amber-400">
                      {s.name
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-amber-400">{s.role}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                            s.status === 'On Leave'
                              ? 'bg-amber-500/15 text-amber-300'
                              : s.status === 'Inactive'
                              ? 'bg-zinc-700/50 text-zinc-400'
                              : 'bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {s.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                      title="Edit staff"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteStaff(s.id);
                        addToast(`Removed ${s.name} from staff.`, 'info');
                      }}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                      title="Remove staff"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* RBAC Scope Badge */}
                <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-zinc-900/80 border border-white/5 text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">{ROLE_ACCESS_SCOPE[s.role] || 'Standard Staff Access'}</span>
                </div>

                <p className="text-xs text-zinc-400 mt-2.5">{s.specialization || 'General Gym Operations'}</p>

                <div className="mt-3 space-y-1.5 text-xs text-zinc-300">
                  <div className="flex items-center gap-2 tabular-nums">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    {s.phone}
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      {s.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {s.shift || 'Standard Shift'}
                  </div>
                </div>
              </div>

              {/* Quick Attendance & Payroll Controls */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-400">Today&apos;s Attendance</span>
                  <select
                    aria-label={`Attendance for ${s.name}`}
                    value={attendanceToday}
                    onChange={(e) => {
                      const val = e.target.value as 'Present' | 'Absent' | 'On Leave';
                      updateStaff({ ...s, attendanceToday: val });
                      addToast(`${s.name} marked ${val} today.`, 'success');
                    }}
                    className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer bg-zinc-900 ${
                      attendanceToday === 'Present'
                        ? 'border-emerald-500/40 text-emerald-300'
                        : attendanceToday === 'On Leave'
                        ? 'border-amber-500/40 text-amber-300'
                        : 'border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500">Salary: </span>
                    <span className="font-semibold text-white tabular-nums">
                      ₹{s.salary.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = payrollStatus === 'Paid' ? 'Pending' : 'Paid';
                      updateStaff({ ...s, payrollStatus: next });
                      addToast(`${s.name} payroll marked ${next}.`, 'success');
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                      payrollStatus === 'Paid'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {payrollStatus === 'Paid' ? <CheckCircle2 className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                    Payroll: {payrollStatus}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-400 tabular-nums">
                  <span>{clientCount} assigned members</span>
                  <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {(s.rating || 4.8).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#14171F] border border-white/15 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="text-base font-semibold text-white">
                {editing ? 'Edit Staff Profile' : 'Add Staff Profile'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs text-zinc-400 mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Trainer">Trainer</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Manager">Manager</option>
                    <option value="Dietitian">Dietitian</option>
                    <option value="Administrator">Administrator</option>
                  </select>
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
                  <label className="block text-xs text-zinc-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white tabular-nums focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Shift Timing</label>
                  <input
                    type="text"
                    value={form.shift}
                    onChange={(e) => setForm({ ...form, shift: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                    placeholder="e.g. Strength & Hypertrophy, Front-Desk Operations"
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Payroll Status</label>
                  <select
                    value={form.payrollStatus}
                    onChange={(e) => setForm({ ...form, payrollStatus: e.target.value as 'Paid' | 'Pending' })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </select>
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
                  {editing ? 'Save Profile' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
