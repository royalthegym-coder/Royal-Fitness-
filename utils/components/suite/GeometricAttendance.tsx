import React, { useMemo, useState } from 'react';
import {
  LogIn,
  LogOut,
  Search,
  Users,
  Clock,
  CheckCircle2,
  Trash2,
  QrCode,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { useToast } from '../../hooks/useToast';
import { gymApi } from '../../services/gymApiClient';
import { AttendanceRecord, Member } from '../../../types';

const ZONES: Array<NonNullable<AttendanceRecord['zone']>> = [
  'Main Floor',
  'Strength',
  'Cardio',
  'CrossFit',
];

export const GeometricAttendance: React.FC = () => {
  const {
    members,
    attendanceRecords,
    checkInMember,
    recordDeniedAttendance,
    checkOutMember,
    deleteAttendance,
    refreshFromServer,
  } = useData();
  const { currentGym } = useGym();
  const { addToast } = useToast();

  const today = new Date().toISOString().split('T')[0];
  const gymId = currentGym?.gymId || 'default_gym';

  const [selectedMemberId, setSelectedMemberId] = useState<number>(members[0]?.id || 0);
  const [selectedZone, setSelectedZone] = useState<NonNullable<AttendanceRecord['zone']>>('Main Floor');
  const [selectedMethod, setSelectedMethod] = useState<AttendanceRecord['method']>('QR');
  const [qrInput, setQrInput] = useState('');
  const [dateFilter, setDateFilter] = useState<string>(today);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);

  const currentlyCheckedIn = useMemo(
    () => attendanceRecords.filter((a) => a.date === today && a.status === 'Checked In'),
    [attendanceRecords, today]
  );

  const todayGranted = useMemo(
    () => attendanceRecords.filter((a) => a.date === today && a.status !== 'Denied').length,
    [attendanceRecords, today]
  );

  const todayDenied = useMemo(
    () => attendanceRecords.filter((a) => a.date === today && a.status === 'Denied').length,
    [attendanceRecords, today]
  );

  const avgDuration = useMemo(() => {
    const completed = attendanceRecords.filter((a) => typeof a.durationMinutes === 'number' && a.durationMinutes > 0);
    if (completed.length === 0) return 0;
    return Math.round(completed.reduce((s, r) => s + (r.durationMinutes || 0), 0) / completed.length);
  }, [attendanceRecords]);

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendanceRecords.filter((rec) => {
      if (dateFilter && rec.date !== dateFilter) return false;
      if (!q) return true;
      const mName = (rec.memberName || members.find((m) => m.id === rec.memberId)?.name || '').toLowerCase();
      return (
        mName.includes(q) ||
        String(rec.memberId).includes(q) ||
        (rec.zone || '').toLowerCase().includes(q) ||
        (rec.denialReason || '').toLowerCase().includes(q)
      );
    });
  }, [attendanceRecords, dateFilter, search, members]);

  const selectedMemberObj = useMemo(
    () => members.find((m) => m.id === Number(selectedMemberId)),
    [members, selectedMemberId]
  );

  const activeQrCodePayload = selectedMemberObj
    ? `GYM-QR:${gymId}:${selectedMemberObj.id}`
    : '';

  const verifyAndCheckIn = async (member: Member, method: AttendanceRecord['method']) => {
    if (busy) return;

    // 1. Fast client-side duplicate check
    const alreadyIn = currentlyCheckedIn.find((r) => r.memberId === member.id);
    if (alreadyIn) {
      addToast(`Duplicate check-in prevented: ${member.name} is already on the floor since ${alreadyIn.checkInTime || alreadyIn.time}.`, 'info');
      return;
    }

    setBusy(true);
    const res = await gymApi.checkIn({
      member_id: member.id,
      zone: selectedZone,
      method,
    });
    setBusy(false);

    if (res.status === 409) {
      addToast(res.error || `Duplicate check-in prevented for ${member.name}.`, 'info');
      await refreshFromServer();
      return;
    }

    if (res.status === 403 || (res.data && res.data.granted === false)) {
      const reason = res.data?.reason || res.error || 'Membership validity check failed.';
      addToast(`ACCESS DENIED — ${member.name}: ${reason}`, 'error');
      await refreshFromServer();
      return;
    }

    if (res.ok && res.data?.granted) {
      addToast(`Access Granted: ${member.name} checked in (${selectedZone} · ${method}).`, 'success');
      await refreshFromServer();
      return;
    }

    // Network offline fallback
    if (res.status === 0) {
      const isExpiredByDate = Boolean(member.expiryDate && member.expiryDate < today);
      if (member.archived || member.status === 'Expired' || member.status === 'Inactive' || isExpiredByDate) {
        const reason = member.archived
          ? 'Member account is archived'
          : isExpiredByDate || member.status === 'Expired'
          ? `Membership expired (${member.expiryDate || 'Expired status'}) — renewal required`
          : `Account status is ${member.status}`;
        recordDeniedAttendance(member, reason, method, selectedZone);
        addToast(`ACCESS DENIED — ${member.name}: ${reason}`, 'error');
        return;
      }
      checkInMember(member, method, selectedZone);
      addToast(`Access Granted (offline): ${member.name} checked in.`, 'success');
      return;
    }

    addToast(res.error || 'Unable to process check-in.', 'error');
  };

  const handleCheckIn = () => {
    if (!selectedMemberObj) {
      addToast('Please select a member to check in.', 'error');
      return;
    }
    void verifyAndCheckIn(selectedMemberObj, selectedMethod);
  };

  const handleQrScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = qrInput.trim();
    if (!raw) return;

    let member: Member | undefined;
    if (raw.startsWith('GYM-QR:')) {
      const id = Number(raw.split(':')[2]);
      member = members.find((m) => m.id === id);
    } else if (/^FF-\d+$/i.test(raw)) {
      member = members.find((m) => (m.loginId || '').toUpperCase() === raw.toUpperCase());
    } else {
      const numId = Number(raw.replace(/\D/g, ''));
      member = members.find((m) => m.id === numId || m.phone.includes(raw));
    }

    if (!member) {
      addToast(`QR / Member ID "${raw}" did not match any registered member.`, 'error');
      return;
    }
    void verifyAndCheckIn(member, 'QR');
    setQrInput('');
  };

  const handleCheckOut = (rec: AttendanceRecord) => {
    checkOutMember(rec.id);
    addToast(`${rec.memberName || `Member #${rec.memberId}`} checked out.`, 'success');
  };

  const resolveMemberName = (rec: AttendanceRecord) =>
    rec.memberName || members.find((m) => m.id === rec.memberId)?.name || `Member #${rec.memberId}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Geometric & QR Attendance System</h1>
        <p className="text-sm text-zinc-400 mt-0.5">
          QR member pass verification, automatic membership validity checks, duplicate check-in prevention, and secure access logs
        </p>
      </div>

      {/* Live KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>On Floor Now</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold text-emerald-400 mt-2 tabular-nums">
            {currentlyCheckedIn.length}
          </div>
          <p className="text-xs text-zinc-500 mt-1">Active verified check-ins</p>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Today&apos;s Granted Visits</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2 tabular-nums">{todayGranted}</div>
          <p className="text-xs text-zinc-500 mt-1">Date: {today}</p>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Access Denials Today</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-400 mt-2 tabular-nums">{todayDenied}</div>
          <p className="text-xs text-zinc-500 mt-1">Expired / inactive blocked</p>
        </div>
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Avg Session Duration</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-bold text-white mt-2 tabular-nums">{avgDuration} min</div>
          <p className="text-xs text-zinc-500 mt-1">Completed visits</p>
        </div>
      </div>

      {/* QR Scanner & Quick Check-In Station */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-[#111318] border border-white/10 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Front Desk & QR Check-In Verification</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Member</label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (#{m.id} · {m.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Training Zone</label>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as any)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Verification Mode</label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as any)}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
              >
                <option value="QR">Member QR Pass</option>
                <option value="Geometric">Geometric ID</option>
                <option value="Biometric">Biometric API</option>
                <option value="Manual">Front Desk Manual</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleCheckIn}
              className="w-full py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Verify & Check In
            </button>
          </div>

          <form onSubmit={handleQrScanSubmit} className="pt-3 border-t border-white/10 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <QrCode className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Scan or paste QR payload (e.g. GYM-QR:default_gym:101) or Member ID..."
                className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold cursor-pointer shrink-0"
            >
              Verify QR Code
            </button>
          </form>
        </div>

        {/* Selected Member Unique QR Pass Card */}
        <div className="bg-[#111318] border border-white/10 rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-400" />
              Member Digital Pass
            </span>
            {selectedMemberObj && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  selectedMemberObj.status === 'Active'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {selectedMemberObj.status}
              </span>
            )}
          </div>
          {selectedMemberObj ? (
            <div className="p-3 rounded-lg bg-zinc-900 border border-white/10 space-y-1.5">
              <div className="text-sm font-bold text-white">{selectedMemberObj.name}</div>
              <div className="text-[11px] text-zinc-400 tabular-nums">
                ID: {selectedMemberObj.loginId || `FF-${1000 + selectedMemberObj.id}`} · Expiry:{' '}
                {selectedMemberObj.expiryDate || 'Active Term'}
              </div>
              <div className="mt-2 px-2.5 py-1.5 rounded bg-black/50 border border-white/10 text-[11px] font-mono text-amber-300 break-all">
                {activeQrCodePayload}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Select a member to view their unique QR pass token.</p>
          )}
          <button
            type="button"
            disabled={!activeQrCodePayload}
            onClick={() => setQrInput(activeQrCodePayload)}
            className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer disabled:opacity-50"
          >
            Load Member QR Into Scanner
          </button>
        </div>
      </div>

      {/* Active On-Floor Check-Out Cards */}
      {currentlyCheckedIn.length > 0 && (
        <div className="bg-[#111318] border border-emerald-500/25 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">
            Currently On Gym Floor ({currentlyCheckedIn.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {currentlyCheckedIn.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{resolveMemberName(rec)}</div>
                  <div className="text-xs text-zinc-400 mt-0.5 tabular-nums">
                    In at {rec.checkInTime || rec.time} · {rec.zone || 'Main Floor'} ({rec.method})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckOut(rec)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Check Out
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance & Access Log Table */}
      <div className="bg-[#111318] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search member, zone, or access status..."
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 cursor-pointer"
              >
                Show All Dates
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-zinc-900/60 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check-In / Out</th>
                <th className="py-3 px-4">Zone / Method</th>
                <th className="py-3 px-4">Access Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-zinc-400">
                    No attendance logs found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-medium text-white">{resolveMemberName(rec)}</td>
                    <td className="py-3 px-4 text-xs text-zinc-400 tabular-nums">{rec.date}</td>
                    <td className="py-3 px-4 text-xs text-zinc-200 tabular-nums">
                      {rec.checkInTime || rec.time} → {rec.checkOutTime || (rec.status === 'Denied' ? 'Blocked' : 'Active')}
                      {rec.durationMinutes ? ` (${rec.durationMinutes}m)` : ''}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-400">
                      {rec.zone || 'Main Floor'} · {rec.method}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
                          rec.status === 'Denied'
                            ? 'bg-rose-500/15 text-rose-300'
                            : rec.status === 'Checked In'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {rec.status === 'Denied' ? (
                          <ShieldAlert className="w-3 h-3" />
                        ) : (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        {rec.status}
                      </span>
                      {rec.denialReason && (
                        <div className="text-[11px] text-rose-300/90 mt-0.5">{rec.denialReason}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {rec.status === 'Checked In' && (
                          <button
                            type="button"
                            onClick={() => handleCheckOut(rec)}
                            className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 text-xs font-semibold cursor-pointer"
                          >
                            Check Out
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            deleteAttendance(rec.id);
                            addToast('Attendance log removed.', 'info');
                          }}
                          className="p-1.5 rounded bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                          title="Delete entry"
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
    </div>
  );
};

export default GeometricAttendance;
