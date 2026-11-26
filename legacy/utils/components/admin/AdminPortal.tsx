import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Lock, Unlock, CreditCard, Calendar, CheckCircle2, AlertTriangle,
  Search, RefreshCw, ShieldCheck, ArrowUpRight, DollarSign, Clock,
  Database, Sparkles, Filter, UserCheck, UserX, FileCheck2, Send, Plus
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useTenantStore } from '../../store/useTenantStore';
import { useToast } from '../../hooks/useToast';
import { getCurrencySymbol } from '../../store/useCurrencyStore';
import { syncToFirebase, subscribeToCollection } from '../../../lib/firebase';
import { Member, Invoice, View } from '../../../types';

interface AdminPortalProps {
  setCurrentView?: (view: View) => void;
}

interface FirestoreMemberOverlay {
  id: number | string;
  accountLocked?: boolean;
  expiryDate?: string;
  paymentConfirmed?: boolean;
  lastPaymentReference?: string;
  lastPaymentDate?: string;
  extendedMonths?: number;
  status?: 'Active' | 'Pending' | 'Expired' | 'Inactive';
}

const EXTENSION_OPTIONS = [
  { label: '+1 Month (Monthly)', months: 1, days: 30, cycle: 'Monthly' as const, discountLabel: 'Standard' },
  { label: '+3 Months (Quarterly)', months: 3, days: 90, cycle: 'Monthly' as const, discountLabel: '5% Off' },
  { label: '+6 Months (Half-Yearly)', months: 6, days: 180, cycle: 'Yearly' as const, discountLabel: '10% Off' },
  { label: '+12 Months (Yearly)', months: 12, days: 365, cycle: 'Yearly' as const, discountLabel: 'Save 20%' },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({ setCurrentView }) => {
  const {
    members,
    updateMember,
    packages,
    invoices,
    addInvoice,
    updateInvoiceStatus,
    addTransaction,
    addAuditLog,
  } = useData();

  const {
    memberGovernance,
    globalMasterOverride,
    toggleMemberLock,
    activateMemberSubscriptionUnlock,
  } = useTenantStore();

  const { addToast } = useToast();
  const currency = getCurrencySymbol();

  // Real-time Firestore state overlays
  const [firestoreMembersMap, setFirestoreMembersMap] = useState<Record<number, FirestoreMemberOverlay>>({});
  const [firestoreInvoices, setFirestoreInvoices] = useState<Invoice[]>([]);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState<boolean>(false);
  const [lastFirestoreSync, setLastFirestoreSync] = useState<string>(new Date().toLocaleTimeString());

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked' | 'pending_payment'>('all');

  // Payment Confirmation & Extension Modal State
  const [selectedMemberForExtension, setSelectedMemberForExtension] = useState<Member | null>(null);
  const [selectedExtensionMonths, setSelectedExtensionMonths] = useState<number>(1);
  const [selectedPackageId, setSelectedPackageId] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'UPI / QR' | 'Razorpay' | 'Card' | 'Cash' | 'NEFT/RTGS'>('UPI / QR');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [paymentConfirmedChecked, setPaymentConfirmedChecked] = useState<boolean>(true);
  const [isSubmittingExtension, setIsSubmittingExtension] = useState<boolean>(false);

  // Subscribe to Firestore `members` and `invoices` collections in real time
  useEffect(() => {
    const unsubMembers = subscribeToCollection('members', (docs) => {
      const nextMap: Record<number, FirestoreMemberOverlay> = {};
      docs.forEach((d: any) => {
        const numericId = Number(d.id);
        if (!Number.isNaN(numericId)) {
          nextMap[numericId] = {
            id: numericId,
            accountLocked: d.accountLocked,
            expiryDate: d.expiryDate,
            paymentConfirmed: d.paymentConfirmed,
            lastPaymentReference: d.lastPaymentReference,
            lastPaymentDate: d.lastPaymentDate,
            extendedMonths: d.extendedMonths,
            status: d.status,
          };
        }
      });
      setFirestoreMembersMap(nextMap);
      setIsFirestoreConnected(true);
      setLastFirestoreSync(new Date().toLocaleTimeString());
    });

    const unsubInvoices = subscribeToCollection('invoices', (docs) => {
      if (Array.isArray(docs) && docs.length > 0) {
        setFirestoreInvoices(
          docs.map((inv: any) => ({
            ...inv,
            id: Number(inv.id) || Date.now(),
            memberId: Number(inv.memberId),
            amount: Number(inv.amount) || 0,
          }))
        );
      }
      setLastFirestoreSync(new Date().toLocaleTimeString());
    });

    return () => {
      if (typeof unsubMembers === 'function') unsubMembers();
      if (typeof unsubInvoices === 'function') unsubInvoices();
    };
  }, []);

  // Merge local & Firestore invoices
  const mergedInvoices = useMemo(() => {
    const map = new Map<number, Invoice>();
    invoices.forEach(inv => map.set(inv.id, inv));
    firestoreInvoices.forEach(inv => map.set(inv.id, inv));
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices, firestoreInvoices]);

  // Helper to compute default expiry date from joinDate + package duration
  const getMemberComputedDetails = (member: Member) => {
    const fsOverlay = firestoreMembersMap[member.id];
    const gov = memberGovernance[member.id];
    const pkg = packages.find(p => p.id === member.packageId) || packages[0];

    // Determine lock status
    const isLocked =
      !globalMasterOverride.forceUnlockAllMembers &&
      (fsOverlay?.accountLocked ??
        gov?.locked ??
        (member.status === 'Expired' || member.status === 'Inactive'));

    // Determine expiry date
    let expiryDateStr = fsOverlay?.expiryDate || gov?.expiryDate;
    if (!expiryDateStr) {
      const baseDate = member.joinDate ? new Date(member.joinDate) : new Date();
      const computed = new Date(baseDate);
      if (pkg?.duration?.toLowerCase().includes('year')) {
        computed.setFullYear(computed.getFullYear() + 1);
      } else if (pkg?.duration?.toLowerCase().includes('quarter') || pkg?.duration?.includes('3')) {
        computed.setMonth(computed.getMonth() + 3);
      } else {
        computed.setMonth(computed.getMonth() + 1);
      }
      expiryDateStr = computed.toISOString().split('T')[0];
    }

    const daysRemaining = Math.ceil(
      (new Date(expiryDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // Check member invoices for pending payment verification
    const memberInvoices = mergedInvoices.filter(i => i.memberId === member.id);
    const pendingInvoice = memberInvoices.find(
      i => i.status === 'Verification Pending' || i.status === 'Pending' || i.status === 'Overdue'
    );
    const latestPaidInvoice = memberInvoices.find(i => i.status === 'Paid');

    return {
      pkg,
      isLocked,
      expiryDateStr,
      daysRemaining,
      pendingInvoice,
      latestPaidInvoice,
      paymentConfirmed: fsOverlay?.paymentConfirmed ?? Boolean(latestPaidInvoice),
      lastPaymentReference: fsOverlay?.lastPaymentReference || `UTR-${member.id}99281`,
    };
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const { isLocked, pendingInvoice } = getMemberComputedDetails(member);
      if (statusFilter === 'unlocked' && isLocked) return false;
      if (statusFilter === 'locked' && !isLocked) return false;
      if (statusFilter === 'pending_payment' && !pendingInvoice) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.phone.toLowerCase().includes(q) ||
        (member.loginId || '').toLowerCase().includes(q) ||
        String(member.id).includes(q)
      );
    });
  }, [members, firestoreMembersMap, memberGovernance, mergedInvoices, searchQuery, statusFilter, globalMasterOverride.forceUnlockAllMembers]);

  // Toggle Member Lock/Unlock and persist to Firestore
  const handleToggleAccountLock = async (member: Member) => {
    const { isLocked, expiryDateStr } = getMemberComputedDetails(member);
    const nextLocked = !isLocked;
    const nextStatus: Member['status'] = nextLocked ? 'Expired' : 'Active';

    // 1. Update local DataProvider & TenantStore
    toggleMemberLock(
      member.id,
      nextLocked,
      nextLocked ? 'Locked via AdminPortal' : undefined
    );
    const updatedMember: Member = {
      ...member,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };
    updateMember(updatedMember);

    // 2. Update local Firestore overlay immediately for snappy UI
    setFirestoreMembersMap(prev => ({
      ...prev,
      [member.id]: {
        ...(prev[member.id] || { id: member.id }),
        accountLocked: nextLocked,
        expiryDate: expiryDateStr,
        status: nextStatus,
      },
    }));

    // 3. Persist to Firestore `members/{memberId}`
    await syncToFirebase('members', String(member.id), {
      ...updatedMember,
      accountLocked: nextLocked,
      expiryDate: expiryDateStr,
      updatedAt: new Date().toISOString(),
    });

    addAuditLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      member_id: member.id,
      action: nextLocked ? 'ADMIN_MEMBER_LOCKED' : 'ADMIN_MEMBER_UNLOCKED',
      details: `Admin ${nextLocked ? 'LOCKED' : 'UNLOCKED'} account for ${member.name} (#${member.id}) via Firestore.`,
    });

    addToast(
      nextLocked
        ? `${member.name}'s account has been LOCKED in Firestore.`
        : `${member.name}'s account is now UNLOCKED & ACTIVE in Firestore!`,
      nextLocked ? 'warning' : 'success'
    );
  };

  // Open Modal to Confirm Payment & Extend Membership
  const openExtensionModal = (member: Member) => {
    const { pkg, pendingInvoice } = getMemberComputedDetails(member);
    setSelectedMemberForExtension(member);
    setSelectedPackageId(pkg?.id || packages[0]?.id || 1);
    setSelectedExtensionMonths(1);
    setPaymentMethod('UPI / QR');
    setPaymentReference(
      pendingInvoice
        ? `INV-${pendingInvoice.id}-VERIFIED`
        : `UTR-${Math.floor(100000000 + Math.random() * 900000000)}`
    );
    setPaymentConfirmedChecked(true);
  };

  // Execute Firestore Payment Confirmation & Membership Extension
  const handleConfirmPaymentAndExtend = async (
    targetMember?: Member,
    quickMonths?: number
  ) => {
    const member = targetMember || selectedMemberForExtension;
    if (!member) return;

    const monthsToExtend = quickMonths || selectedExtensionMonths;
    const { expiryDateStr, pendingInvoice } = getMemberComputedDetails(member);
    const chosenPackage =
      packages.find(p => p.id === (targetMember ? member.packageId : selectedPackageId)) ||
      packages[0];

    const basePrice = chosenPackage?.price || 2500;
    const multiplier =
      monthsToExtend === 12
        ? 12 * 0.8
        : monthsToExtend === 6
        ? 6 * 0.9
        : monthsToExtend === 3
        ? 3 * 0.95
        : 1;
    const confirmedAmount = pendingInvoice?.amount || Math.round(basePrice * multiplier);

    setIsSubmittingExtension(true);

    try {
      // Calculate new expiry date safely in UTC days (never loses active remaining days)
      const now = new Date();
      const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const parsedExp = /^\d{4}-\d{2}-\d{2}$/.test(expiryDateStr)
        ? Date.UTC(...(expiryDateStr.split('-').map((v, i) => (i === 1 ? Number(v) - 1 : Number(v))) as [number, number, number]))
        : todayUtc;
      const baseUtc = parsedExp > todayUtc ? parsedExp : todayUtc;
      const daysToAdd = monthsToExtend === 12 ? 365 : monthsToExtend * 30;
      const newExpiryStr = new Date(baseUtc + daysToAdd * 86_400_000).toISOString().split('T')[0];

      const cycle: 'Monthly' | 'Yearly' = monthsToExtend >= 6 ? 'Yearly' : 'Monthly';
      const refCode =
        paymentReference.trim() || `UTR-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const nowIso = new Date().toISOString();

      // 1. If member had a pending invoice, mark it Paid in local context & Firestore
      if (pendingInvoice) {
        updateInvoiceStatus(pendingInvoice.id, 'Paid', confirmedAmount);
        await syncToFirebase('invoices', String(pendingInvoice.id), {
          ...pendingInvoice,
          status: 'Paid',
          amount: confirmedAmount,
          paymentMethod,
          paymentReference: refCode,
          confirmedAt: nowIso,
        });
      } else {
        // Create a new Paid invoice record in local state & Firestore
        const newInvoice: Invoice = {
          id: Date.now(),
          memberId: member.id,
          memberName: member.name,
          packageId: chosenPackage?.id || 1,
          packageName: `${chosenPackage?.name || 'Elite Fitness Plan'} (+${monthsToExtend}M)`,
          amount: confirmedAmount,
          date: nowIso.split('T')[0],
          status: 'Paid',
          paymentMethod,
        };
        addInvoice(newInvoice);
        await syncToFirebase('invoices', String(newInvoice.id), {
          ...newInvoice,
          paymentReference: refCode,
          confirmedAt: nowIso,
        });
      }

      // 2. Record confirmed payment document in Firestore `payments` collection
      const paymentDocId = `PAY-${member.id}-${Date.now()}`;
      await syncToFirebase('payments', paymentDocId, {
        id: paymentDocId,
        memberId: member.id,
        memberName: member.name,
        amount: confirmedAmount,
        monthsExtended: monthsToExtend,
        newExpiryDate: newExpiryStr,
        method: paymentMethod,
        reference: refCode,
        confirmedByAdmin: true,
        timestamp: nowIso,
      });

      // 3. Add transaction to ledger
      addTransaction({
        id: paymentDocId,
        memberName: member.name,
        amount: confirmedAmount,
        date: nowIso.split('T')[0],
        method: paymentMethod === 'UPI / QR' ? 'QR Code' : paymentMethod === 'Card' ? 'Card' : 'Online',
      });

      // 4. Auto-Unlock & Extend Member in TenantStore, DataProvider & Firestore
      activateMemberSubscriptionUnlock(
        member.id,
        cycle,
        chosenPackage?.name || 'Elite Fitness Plan',
        confirmedAmount,
        newExpiryStr
      );

      const updatedMember: Member = {
        ...member,
        packageId: chosenPackage?.id || member.packageId,
        status: 'Active',
        updated_at: nowIso,
      };
      updateMember(updatedMember);

      setFirestoreMembersMap(prev => ({
        ...prev,
        [member.id]: {
          id: member.id,
          accountLocked: false,
          expiryDate: newExpiryStr,
          paymentConfirmed: true,
          lastPaymentReference: refCode,
          lastPaymentDate: nowIso.split('T')[0],
          extendedMonths: monthsToExtend,
          status: 'Active',
        },
      }));

      await syncToFirebase('members', String(member.id), {
        ...updatedMember,
        accountLocked: false,
        expiryDate: newExpiryStr,
        paymentConfirmed: true,
        lastPaymentReference: refCode,
        lastPaymentDate: nowIso.split('T')[0],
        extendedMonths: monthsToExtend,
        updatedAt: nowIso,
      });

      addAuditLog({
        id: Date.now().toString(),
        timestamp: nowIso,
        member_id: member.id,
        action: 'FIRESTORE_PAYMENT_CONFIRMED_EXTENDED',
        details: `Confirmed Firestore payment (${currency}${confirmedAmount.toLocaleString()}, Ref: ${refCode}) for ${member.name}. Extended by +${monthsToExtend} month(s) until ${newExpiryStr} & Auto-Unlocked.`,
      });

      setLastFirestoreSync(new Date().toLocaleTimeString());
      setSelectedMemberForExtension(null);
      addToast(
        `Payment Confirmed via Firestore! ${member.name}'s membership extended to ${newExpiryStr} & Account Unlocked.`,
        'success'
      );
    } finally {
      setIsSubmittingExtension(false);
    }
  };

  // Sync all members to Firestore
  const handleSyncAllToFirestore = async () => {
    setIsSyncingFirestore(true);
    try {
      await Promise.all(
        members.map(m => {
          const { isLocked, expiryDateStr } = getMemberComputedDetails(m);
          return syncToFirebase('members', String(m.id), {
            ...m,
            accountLocked: isLocked,
            expiryDate: expiryDateStr,
            updatedAt: new Date().toISOString(),
          });
        })
      );
      setLastFirestoreSync(new Date().toLocaleTimeString());
      addToast(`All ${members.length} registered members synchronized with Firestore!`, 'success');
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  // Summary KPIs
  const totalMembersCount = members.length;
  const unlockedMembersCount = members.filter(m => !getMemberComputedDetails(m).isLocked).length;
  const lockedMembersCount = totalMembersCount - unlockedMembersCount;
  const pendingConfirmationsCount = members.filter(m => Boolean(getMemberComputedDetails(m).pendingInvoice)).length;

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border border-cyan-500/30 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.12)]">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                FIRESTORE REAL-TIME ADMIN PORTAL
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-widest">
                {isFirestoreConnected ? `● FIRESTORE ONLINE • SYNCED ${lastFirestoreSync}` : '● LOCAL FALLBACK'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white italic uppercase tracking-tight">
              Registered Members Governance & Payment Extension Hub
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-3xl">
              Manage all registered gym athletes, toggle account access (<span className="text-emerald-400 font-bold">Lock / Unlock</span>), and extend memberships with instant auto-unlock upon <span className="text-cyan-400 font-bold">Firestore payment confirmation</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSyncAllToFirestore}
              disabled={isSyncingFirestore}
              className="px-4 py-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
              <span>{isSyncingFirestore ? 'Syncing Firestore...' : 'Sync All to Firestore'}</span>
            </button>

            {setCurrentView && (
              <button
                type="button"
                onClick={() => setCurrentView('memberRegistrationForm')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Member</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI STRIP */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/10">
          <div className="bg-black/70 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Total Registered Members</p>
              <p className="text-2xl font-black text-white mt-1">{totalMembersCount}</p>
              <p className="text-[10px] text-cyan-400 font-mono mt-0.5">Firestore `members` collection</p>
            </div>
            <Users className="w-8 h-8 text-cyan-400 opacity-60" />
          </div>

          <div className="bg-black/70 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Unlocked & Active</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">{unlockedMembersCount}</p>
              <p className="text-[10px] text-emerald-500/80 font-mono mt-0.5">Full Turnstile & App Access</p>
            </div>
            <UserCheck className="w-8 h-8 text-emerald-400 opacity-60" />
          </div>

          <div className="bg-black/70 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Locked / Expired</p>
              <p className="text-2xl font-black text-red-400 mt-1">{lockedMembersCount}</p>
              <p className="text-[10px] text-red-400/80 font-mono mt-0.5">Awaiting Renewal or Unlock</p>
            </div>
            <UserX className="w-8 h-8 text-red-400 opacity-60" />
          </div>

          <div className="bg-black/70 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Payment Confirmations</p>
              <p className="text-2xl font-black text-amber-400 mt-1">{pendingConfirmationsCount}</p>
              <p className="text-[10px] text-amber-400/80 font-mono mt-0.5">Pending Firestore Verification</p>
            </div>
            <FileCheck2 className="w-8 h-8 text-amber-400 opacity-60" />
          </div>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="bg-zinc-950 border border-white/10 rounded-3xl p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search registered members by name, phone, email, or member ID..."
            className="w-full bg-black border border-white/15 rounded-2xl pl-11 pr-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['all', `All Members (${totalMembersCount})`],
              ['unlocked', `Unlocked (${unlockedMembersCount})`],
              ['locked', `Locked (${lockedMembersCount})`],
              ['pending_payment', `Pending Payment (${pendingConfirmationsCount})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                statusFilter === key
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                  : 'bg-black text-gray-400 border-white/10 hover:text-white hover:border-white/25'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* REGISTERED MEMBERS TABLE / CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMembers.map(member => {
          const {
            pkg,
            isLocked,
            expiryDateStr,
            daysRemaining,
            pendingInvoice,
            paymentConfirmed,
            lastPaymentReference,
          } = getMemberComputedDetails(member);

          return (
            <div
              key={member.id}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                isLocked
                  ? 'bg-red-950/10 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.08)]'
                  : 'bg-zinc-950/90 border-white/10 hover:border-cyan-500/40 shadow-xl'
              }`}
            >
              {/* Top Member Header */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                      alt={member.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/15"
                    />
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight">
                        {member.name}
                      </h3>
                      <p className="text-[10px] font-mono text-cyan-400 mt-0.5">
                        ID: #{member.id} • {member.loginId || `FF-M${100 + member.id}`}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{member.phone}</p>
                    </div>
                  </div>

                  {/* Lock / Unlock Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 shrink-0 ${
                      isLocked
                        ? 'bg-red-500/20 text-red-400 border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {isLocked ? 'LOCKED' : 'UNLOCKED'}
                  </span>
                </div>

                {/* Membership & Firestore Payment Details */}
                <div className="bg-black/70 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Current Package:</span>
                    <span className="font-bold text-white">
                      {pkg?.name || 'Elite Fitness Plan'} ({currency}{(pkg?.price || 2500).toLocaleString()})
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Join Date:</span>
                    <span className="font-mono text-gray-300">{member.joinDate}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Membership Expiry:</span>
                    <span
                      className={`font-mono font-bold ${
                        daysRemaining <= 0
                          ? 'text-red-400'
                          : daysRemaining <= 7
                          ? 'text-amber-400'
                          : 'text-cyan-400'
                      }`}
                    >
                      {expiryDateStr} ({daysRemaining > 0 ? `${daysRemaining}d left` : 'Expired'})
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-white/5">
                    <span className="text-gray-500 text-[10px] uppercase font-bold">Firestore Payment:</span>
                    {pendingInvoice ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                        {pendingInvoice.status} ({currency}{pendingInvoice.amount.toLocaleString()})
                      </span>
                    ) : paymentConfirmed ? (
                      <span className="text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified ({lastPaymentReference})
                      </span>
                    ) : (
                      <span className="text-gray-400 font-mono text-[10px]">Standard Active</span>
                    )}
                  </div>
                </div>

                {/* Pending Payment Quick Banner */}
                {pendingInvoice && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Payment Confirmation Pending
                      </p>
                      <p className="text-[11px] text-gray-300">
                        Invoice #{pendingInvoice.id} • {currency}{pendingInvoice.amount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfirmPaymentAndExtend(member, 1)}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    >
                      Confirm & +1M
                    </button>
                  </div>
                )}
              </div>

              {/* Action Controls: Toggle Lock/Unlock + Extend Membership via Firestore */}
              <div className="space-y-2.5 pt-3 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAccountLock(member)}
                    className={`py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      isLocked
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30'
                    }`}
                  >
                    {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {isLocked ? 'Unlock Account' : 'Lock Account'}
                  </button>

                  <button
                    type="button"
                    onClick={() => openExtensionModal(member)}
                    className="py-3 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 hover:text-black text-cyan-300 border border-cyan-500/40 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Extend & Confirm
                  </button>
                </div>

                {/* Quick 1-Click Firestore Payment Extension Pills */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmPaymentAndExtend(member, 1)}
                    className="py-2 px-2.5 rounded-xl bg-zinc-900 hover:bg-indigo-500/20 text-gray-300 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/40 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    ✓ Confirm Pay & +1M
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirmPaymentAndExtend(member, 12)}
                    className="py-2 px-2.5 rounded-xl bg-zinc-900 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-white/5 hover:border-amber-500/40 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                  >
                    ✓ Confirm Pay & +1Yr
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FIRESTORE PAYMENT CONFIRMATION & MEMBERSHIP EXTENSION MODAL */}
      {selectedMemberForExtension && (
        <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-zinc-950 border-2 border-cyan-500/40 rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-[0_0_80px_rgba(6,182,212,0.2)] animate-fade-in">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/15 text-cyan-400 text-[9px] font-black uppercase tracking-widest">
                  Firestore Payment Verification & Extension
                </span>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight mt-1">
                  Extend Membership: {selectedMemberForExtension.name}
                </h3>
                <p className="text-xs text-gray-400">
                  Member ID #{selectedMemberForExtension.id} • {selectedMemberForExtension.phone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMemberForExtension(null)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 text-gray-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                ESC
              </button>
            </div>

            <div className="space-y-4">
              {/* Select Package Tier */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  1. Select Membership Package Tier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {packages.slice(0, 3).map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedPackageId === pkg.id
                          ? 'bg-cyan-500/15 border-cyan-400 text-white'
                          : 'bg-black border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <p className="text-xs font-black uppercase truncate">{pkg.name}</p>
                      <p className="text-sm font-mono font-bold text-cyan-400 mt-1">
                        {currency}{pkg.price.toLocaleString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Extension Duration */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
                  2. Select Extension Duration
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {EXTENSION_OPTIONS.map(opt => (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => setSelectedExtensionMonths(opt.months)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedExtensionMonths === opt.months
                          ? 'bg-emerald-500/15 border-emerald-400 text-white'
                          : 'bg-black border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-black uppercase">{opt.label}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">+{opt.days} Days Access</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black uppercase">
                        {opt.discountLabel}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Channel & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    3. Payment Channel
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-black border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="UPI / QR">UPI / QR Code</option>
                    <option value="Razorpay">Razorpay Gateway</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Front Desk Cash</option>
                    <option value="NEFT/RTGS">NEFT / Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">
                    4. Firestore Transaction / UTR Ref
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="UTR / Payment Reference ID"
                    className="w-full bg-black border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Payment Confirmation Checkbox */}
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentConfirmedChecked}
                  onChange={e => setPaymentConfirmedChecked(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="text-xs font-bold text-emerald-300">
                  Confirm payment is received & verified in Firestore (Automatically unlocks member account)
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedMemberForExtension(null)}
                className="px-5 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-gray-300 text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!paymentConfirmedChecked || isSubmittingExtension}
                onClick={() => handleConfirmPaymentAndExtend()}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(16,185,129,0.35)] transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmittingExtension
                    ? 'Writing to Firestore...'
                    : `Confirm Payment & Extend (+${selectedExtensionMonths}M) + Unlock`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
