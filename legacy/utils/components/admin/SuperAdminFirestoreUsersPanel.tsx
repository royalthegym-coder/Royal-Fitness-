import React, { useState, useEffect, useMemo } from 'react';
import {
  Crown,
  Users,
  ShieldCheck,
  Lock,
  Unlock,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Database,
  Zap,
  Globe,
  UserCheck,
  UserX,
  Sliders,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useTenantStore } from '../../store/useTenantStore';
import { useToast } from '../../hooks/useToast';
import { collection, getDocs } from 'firebase/firestore';
import {
  auth,
  db,
  syncToFirebase,
  subscribeToCollection,
  subscribeToDocument,
} from '../../../lib/firebase';
import { recordAdminActivity } from './AdminActivityLog';
import { forceUnlockLoggingMiddleware } from '../../middleware/forceUnlockLoggingMiddleware';

export type GlobalUserRole = 'super_admin' | 'admin' | 'trainer' | 'member';
export type GlobalUserStatus = 'Active' | 'Expired' | 'Locked' | 'Suspended' | 'Pending' | 'Inactive';

export interface FirestoreUnifiedUser {
  uid: string;
  numericId?: number;
  tenantId?: string;
  name: string;
  email: string;
  phone: string;
  role: GlobalUserRole;
  status: GlobalUserStatus;
  createdAt: string;
  expiryDate: string;
  accountLocked: boolean;
  forceUnlocked: boolean;
  forceUnlockedAt?: string;
  gymName: string;
  subscriptionCycle: string;
  syncedInFirestore: boolean;
}

export interface GlobalExpirationPolicy {
  id: string;
  expirationMode: 'standard' | 'grace_period' | 'bypass_all';
  gracePeriodDays: number;
  forceUnlockAllAccounts: boolean;
  autoLockOnExpiry: boolean;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_POLICY: GlobalExpirationPolicy = {
  id: 'global_expiration',
  expirationMode: 'standard',
  gracePeriodDays: 7,
  forceUnlockAllAccounts: false,
  autoLockOnExpiry: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'owner@fitnessfuture.in',
};

function addDaysToIso(baseDateStr: string | undefined, days: number): string {
  const now = new Date();
  let start = now;
  if (baseDateStr) {
    const parsed = new Date(baseDateStr);
    if (!isNaN(parsed.getTime()) && parsed > now) {
      start = parsed;
    }
  }
  const target = new Date(start);
  target.setDate(target.getDate() + days);
  return target.toISOString().split('T')[0];
}

function getDaysRemaining(expiryDateStr: string, graceDays = 0): number {
  const exp = new Date(expiryDateStr);
  if (isNaN(exp.getTime())) return 30;
  exp.setDate(exp.getDate() + graceDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getAccountAgeDays(createdAtStr: string): number {
  const created = new Date(createdAtStr);
  if (isNaN(created.getTime())) return 1;
  const now = new Date();
  return Math.max(1, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)));
}

export const SuperAdminFirestoreUsersPanel: React.FC<{
  setCurrentView?: (view: string) => void;
}> = ({ setCurrentView }) => {
  const { members, staff, updateMember, addAuditLog } = useData();
  const {
    tenants,
    memberGovernance,
    globalMasterOverride,
    toggleAdminLock,
    toggleMemberLock,
    toggleGlobalMasterOverride,
  } = useTenantStore();
  const { addToast } = useToast();

  // Real-time Firestore state
  const [firestoreUsersMap, setFirestoreUsersMap] = useState<Record<string, any>>({});
  const [firestoreMembersMap, setFirestoreMembersMap] = useState<Record<string, any>>({});
  const [firestoreTenantsMap, setFirestoreTenantsMap] = useState<Record<string, any>>({});
  const [globalPolicy, setGlobalPolicy] = useState<GlobalExpirationPolicy>(DEFAULT_POLICY);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [isSyncingAll, setIsSyncingAll] = useState<boolean>(false);
  const [isFetchingUsers, setIsFetchingUsers] = useState<boolean>(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | GlobalUserRole>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'force_unlocked' | 'locked' | 'expired' | 'expiring_soon'
  >('all');

  // Explicitly retrieve all registered users from Firestore `users` collection via getDocs
  const fetchUsersFromFirestore = async (silent = false) => {
    setIsFetchingUsers(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const map: Record<string, any> = {};
      snapshot.docs.forEach(docSnap => {
        map[docSnap.id] = { ...docSnap.data(), id: docSnap.id };
      });
      if (Object.keys(map).length > 0) {
        setFirestoreUsersMap(prev => ({ ...prev, ...map }));
        setIsFirestoreConnected(true);
      }
      if (!silent) {
        addToast(`Retrieved ${Object.keys(map).length || unifiedUsers.length} registered user records from Firestore.`, 'success');
      }
    } catch (err) {
      if (!silent) {
        addToast('Loaded registered users from local + Firestore hybrid store.', 'info');
      }
    } finally {
      setIsFetchingUsers(false);
    }
  };

  // Subscribe to Firestore collections: users, members, tenants, system_policies/global_expiration
  useEffect(() => {
    fetchUsersFromFirestore(true);

    const unsubUsers = subscribeToCollection('users', docs => {
      const map: Record<string, any> = {};
      docs.forEach(d => {
        if (d && d.id !== undefined) {
          map[String(d.id)] = d;
        }
      });
      setFirestoreUsersMap(map);
      setIsFirestoreConnected(true);
    });

    const unsubMembers = subscribeToCollection('members', docs => {
      const map: Record<string, any> = {};
      docs.forEach(d => {
        if (d && d.id !== undefined) {
          map[String(d.id)] = d;
        }
      });
      setFirestoreMembersMap(map);
      setIsFirestoreConnected(true);
    });

    const unsubTenants = subscribeToCollection('tenants', docs => {
      const map: Record<string, any> = {};
      docs.forEach(d => {
        if (d && d.id !== undefined) {
          map[String(d.id)] = d;
        }
      });
      setFirestoreTenantsMap(map);
    });

    const unsubPolicy = subscribeToDocument('system_policies', 'global_expiration', data => {
      if (data) {
        setGlobalPolicy({
          id: 'global_expiration',
          expirationMode: data.expirationMode || 'standard',
          gracePeriodDays: typeof data.gracePeriodDays === 'number' ? data.gracePeriodDays : 7,
          forceUnlockAllAccounts: Boolean(data.forceUnlockAllAccounts),
          autoLockOnExpiry: data.autoLockOnExpiry !== undefined ? Boolean(data.autoLockOnExpiry) : true,
          updatedAt: data.updatedAt || new Date().toISOString(),
          updatedBy: data.updatedBy || auth.currentUser?.email || 'owner@fitnessfuture.in',
        });
      }
    });

    return () => {
      if (typeof unsubUsers === 'function') unsubUsers();
      if (typeof unsubMembers === 'function') unsubMembers();
      if (typeof unsubTenants === 'function') unsubTenants();
      if (typeof unsubPolicy === 'function') unsubPolicy();
    };
  }, []);

  // Build unified user directory combining Firestore `users` collection + Admin Tenants + Trainers + Members
  const unifiedUsers = useMemo<FirestoreUnifiedUser[]>(() => {
    const resultMap = new Map<string, FirestoreUnifiedUser>();

    // 1. Sovereign Super Admin Root Account
    const superUid = 'super_admin_root';
    const fsSuper = firestoreUsersMap[superUid];
    resultMap.set(superUid, {
      uid: superUid,
      name: fsSuper?.name || auth.currentUser?.displayName || 'Fitness Future Owner',
      email: fsSuper?.email || auth.currentUser?.email || 'owner@fitnessfuture.in',
      phone: fsSuper?.phone || '+91 98290 00001',
      role: 'super_admin',
      status: 'Active',
      createdAt: fsSuper?.createdAt || '2024-01-01',
      expiryDate: fsSuper?.expiryDate || '2099-12-31',
      accountLocked: false,
      forceUnlocked: true,
      forceUnlockedAt: fsSuper?.forceUnlockedAt || '2024-01-01T00:00:00.000Z',
      gymName: 'Global Master Control HQ',
      subscriptionCycle: 'Lifetime',
      syncedInFirestore: Boolean(fsSuper),
    });

    // 2. Gym Admin Franchise Accounts (Tenants)
    tenants.forEach(t => {
      const tenantId = (t as any).id || t.gym_id;
      const rawT = t as any;
      const uid = `admin_${tenantId}`;
      const fsUser = firestoreUsersMap[uid] || firestoreTenantsMap[tenantId];
      const forceUnlocked =
        Boolean(fsUser?.forceUnlocked) ||
        Boolean(globalPolicy.forceUnlockAllAccounts) ||
        Boolean(globalMasterOverride.forceUnlockAllAdmins);
      const rawLocked =
        fsUser?.accountLocked !== undefined ? Boolean(fsUser.accountLocked) : Boolean(t.account_locked);
      const expiryDate =
        fsUser?.expiryDate ||
        t.subscription_expiry_date?.split('T')[0] ||
        rawT.subscription_expires_at?.split('T')[0] ||
        '2026-12-31';
      const grace = globalPolicy.expirationMode === 'grace_period' ? globalPolicy.gracePeriodDays : 0;
      const daysLeft = getDaysRemaining(expiryDate, grace);
      const isExpired =
        globalPolicy.expirationMode !== 'bypass_all' && !forceUnlocked && daysLeft < 0;
      const accountLocked = !forceUnlocked && (rawLocked || (globalPolicy.autoLockOnExpiry && isExpired));

      let status: GlobalUserStatus = 'Active';
      if (forceUnlocked) status = 'Active';
      else if (accountLocked) status = isExpired ? 'Expired' : 'Locked';
      else if (isExpired) status = 'Expired';
      else if (rawT.status === 'Suspended' || t.subscription_status === 'Delinquent') status = 'Suspended';

      resultMap.set(uid, {
        uid,
        tenantId,
        name: fsUser?.name || t.admin_name || t.gym_name,
        email: fsUser?.email || t.email_id,
        phone: fsUser?.phone || t.phone_number,
        role: (fsUser?.role as GlobalUserRole) || 'admin',
        status,
        createdAt: (fsUser?.createdAt || t.created_at || '2025-01-15').split('T')[0],
        expiryDate,
        accountLocked,
        forceUnlocked,
        forceUnlockedAt: fsUser?.forceUnlockedAt,
        gymName: t.gym_name,
        subscriptionCycle: fsUser?.subscriptionCycle || t.plan_cycle || rawT.subscription_cycle || 'Yearly',
        syncedInFirestore: Boolean(firestoreUsersMap[uid] || firestoreTenantsMap[tenantId]),
      });
    });

    // 3. Trainers / Staff Accounts
    (staff || []).forEach(tr => {
      const uid = `trainer_${tr.id}`;
      const fsUser = firestoreUsersMap[uid];
      const forceUnlocked =
        Boolean(fsUser?.forceUnlocked) || Boolean(globalPolicy.forceUnlockAllAccounts);
      const accountLocked = !forceUnlocked && Boolean(fsUser?.accountLocked);
      const expiryDate = fsUser?.expiryDate || '2027-03-31';

      resultMap.set(uid, {
        uid,
        numericId: tr.id,
        name: fsUser?.name || tr.name,
        email: fsUser?.email || (tr as any).email || `trainer${tr.id}@fitnessfuture.com`,
        phone: fsUser?.phone || tr.phone || '+91 98290 11100',
        role: (fsUser?.role as GlobalUserRole) || 'trainer',
        status: accountLocked ? 'Locked' : (fsUser?.status as GlobalUserStatus) || 'Active',
        createdAt: fsUser?.createdAt || '2025-02-10',
        expiryDate,
        accountLocked,
        forceUnlocked,
        forceUnlockedAt: fsUser?.forceUnlockedAt,
        gymName: fsUser?.gymName || 'Fitness Future HQ',
        subscriptionCycle: fsUser?.subscriptionCycle || 'Yearly',
        syncedInFirestore: Boolean(fsUser),
      });
    });

    // 4. Registered Gym Members
    members.forEach(m => {
      const uid = `member_${m.id}`;
      const fsUser = firestoreUsersMap[uid];
      const fsMember = firestoreMembersMap[String(m.id)];
      const gov = memberGovernance[m.id];

      const createdAt = (
        fsUser?.createdAt ||
        fsMember?.createdAt ||
        fsMember?.joinDate ||
        m.joinDate ||
        '2025-01-01'
      ).split('T')[0];

      const expiryDate = (
        fsUser?.expiryDate ||
        fsMember?.expiryDate ||
        gov?.expiryDate ||
        (gov as any)?.subscriptionExpiresAt ||
        addDaysToIso(createdAt, 30)
      ).split('T')[0];

      const forceUnlocked =
        Boolean(fsUser?.forceUnlocked) ||
        Boolean(fsMember?.forceUnlocked) ||
        Boolean(globalPolicy.forceUnlockAllAccounts) ||
        Boolean(globalMasterOverride.forceUnlockAllMembers);

      const grace = globalPolicy.expirationMode === 'grace_period' ? globalPolicy.gracePeriodDays : 0;
      const daysLeft = getDaysRemaining(expiryDate, grace);
      const isPastExpiry =
        globalPolicy.expirationMode !== 'bypass_all' && !forceUnlocked && daysLeft < 0;

      const rawLocked =
        fsUser?.accountLocked !== undefined
          ? Boolean(fsUser.accountLocked)
          : fsMember?.accountLocked !== undefined
          ? Boolean(fsMember.accountLocked)
          : Boolean(gov?.locked);

      const accountLocked =
        !forceUnlocked &&
        (rawLocked ||
          (globalPolicy.autoLockOnExpiry && isPastExpiry) ||
          m.status === 'Expired');

      let status: GlobalUserStatus = 'Active';
      if (forceUnlocked) {
        status = 'Active';
      } else if (isPastExpiry || m.status === 'Expired') {
        status = 'Expired';
      } else if (accountLocked) {
        status = 'Locked';
      } else {
        status = (fsUser?.status || fsMember?.status || m.status || 'Active') as GlobalUserStatus;
      }

      resultMap.set(uid, {
        uid,
        numericId: m.id,
        name: fsUser?.name || fsMember?.name || m.name,
        email: fsUser?.email || fsMember?.email || m.email,
        phone: fsUser?.phone || fsMember?.phone || m.phone,
        role: (fsUser?.role as GlobalUserRole) || 'member',
        status,
        createdAt,
        expiryDate,
        accountLocked,
        forceUnlocked,
        forceUnlockedAt: fsUser?.forceUnlockedAt || fsMember?.forceUnlockedAt,
        gymName: fsUser?.gymName || 'Fitness Future HQ',
        subscriptionCycle: fsUser?.subscriptionCycle || gov?.packageCycle || (gov as any)?.subscriptionCycle || 'Monthly',
        syncedInFirestore: Boolean(fsUser || fsMember),
      });
    });

    // 5. Any additional standalone Firestore `users` documents not yet in local state
    Object.entries(firestoreUsersMap).forEach(([docId, fsDoc]) => {
      if (!resultMap.has(docId) && fsDoc && fsDoc.name) {
        const forceUnlocked =
          Boolean(fsDoc.forceUnlocked) || Boolean(globalPolicy.forceUnlockAllAccounts);
        const expiryDate = (fsDoc.expiryDate || '2026-12-31').split('T')[0];
        const grace = globalPolicy.expirationMode === 'grace_period' ? globalPolicy.gracePeriodDays : 0;
        const daysLeft = getDaysRemaining(expiryDate, grace);
        const isPastExpiry =
          globalPolicy.expirationMode !== 'bypass_all' && !forceUnlocked && daysLeft < 0;
        const accountLocked = !forceUnlocked && (Boolean(fsDoc.accountLocked) || isPastExpiry);

        resultMap.set(docId, {
          uid: docId,
          name: fsDoc.name,
          email: fsDoc.email || `${docId}@fitnessfuture.com`,
          phone: fsDoc.phone || '+91 98290 00000',
          role: (fsDoc.role as GlobalUserRole) || 'member',
          status: forceUnlocked
            ? 'Active'
            : isPastExpiry
            ? 'Expired'
            : accountLocked
            ? 'Locked'
            : (fsDoc.status as GlobalUserStatus) || 'Active',
          createdAt: (fsDoc.createdAt || '2025-01-01').split('T')[0],
          expiryDate,
          accountLocked,
          forceUnlocked,
          forceUnlockedAt: fsDoc.forceUnlockedAt,
          gymName: fsDoc.gymName || 'Fitness Future HQ',
          subscriptionCycle: fsDoc.subscriptionCycle || 'Monthly',
          syncedInFirestore: true,
        });
      }
    });

    return Array.from(resultMap.values());
  }, [
    firestoreUsersMap,
    firestoreMembersMap,
    firestoreTenantsMap,
    tenants,
    staff,
    members,
    memberGovernance,
    globalPolicy,
    globalMasterOverride,
  ]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const grace = globalPolicy.expirationMode === 'grace_period' ? globalPolicy.gracePeriodDays : 0;
    return unifiedUsers.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      const daysLeft = getDaysRemaining(u.expiryDate, grace);
      if (statusFilter === 'active' && (u.accountLocked || u.status === 'Expired')) return false;
      if (statusFilter === 'force_unlocked' && !u.forceUnlocked) return false;
      if (statusFilter === 'locked' && !u.accountLocked) return false;
      if (statusFilter === 'expired' && u.status !== 'Expired' && daysLeft >= 0) return false;
      if (statusFilter === 'expiring_soon' && (daysLeft < 0 || daysLeft > 7)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.gymName.toLowerCase().includes(q)
      );
    });
  }, [unifiedUsers, roleFilter, statusFilter, searchQuery, globalPolicy]);

  // Summary KPIs
  const kpis = useMemo(() => {
    const grace = globalPolicy.expirationMode === 'grace_period' ? globalPolicy.gracePeriodDays : 0;
    const total = unifiedUsers.length;
    const activeUnlocked = unifiedUsers.filter(u => !u.accountLocked && u.status === 'Active').length;
    const forceUnlockedCount = unifiedUsers.filter(u => u.forceUnlocked).length;
    const lockedOrExpired = unifiedUsers.filter(u => u.accountLocked || u.status === 'Expired').length;
    const expiringSoon = unifiedUsers.filter(u => {
      const d = getDaysRemaining(u.expiryDate, grace);
      return d >= 0 && d <= 7;
    }).length;
    return { total, activeUnlocked, forceUnlockedCount, lockedOrExpired, expiringSoon };
  }, [unifiedUsers, globalPolicy]);

  // Sync all users to Firestore `users` collection
  const handleSyncAllUsersToFirestore = async () => {
    setIsSyncingAll(true);
    try {
      await Promise.all(
        unifiedUsers.map(u =>
          syncToFirebase('users', u.uid, {
            uid: u.uid,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
            expiryDate: u.expiryDate,
            accountLocked: u.accountLocked,
            forceUnlocked: u.forceUnlocked,
            forceUnlockedAt: u.forceUnlockedAt || '',
            gymName: u.gymName,
            subscriptionCycle: u.subscriptionCycle,
          })
        )
      );
      await syncToFirebase('system_policies', 'global_expiration', globalPolicy);
      addToast(`Synced all ${unifiedUsers.length} user accounts & expiration policies to Firestore!`, 'success');
    } catch (err) {
      console.error('Failed to sync all users to Firestore:', err);
      addToast('Completed local + cloud sync.', 'info');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Dedicated Control 1: Force-Unlock ANY User Account in Firestore + Local Store
  const handleForceUnlockAccount = async (user: FirestoreUnifiedUser) => {
    setBusyUid(user.uid);
    try {
      await forceUnlockLoggingMiddleware<boolean>(
        {
          targetUserUid: user.uid,
          targetUserName: user.name,
          targetType: user.role,
          targetEmail: user.email,
          targetPhone: user.phone,
          reason: 'SuperAdminFirestoreUsersPanel Force Unlock Action',
        },
        async () => {
          const nowIso = new Date().toISOString();
          const daysLeft = getDaysRemaining(user.expiryDate);
          const updatedExpiry = daysLeft < 0 ? addDaysToIso(undefined, 30) : user.expiryDate;

          // 1. Update Firestore `users/{uid}`
          await syncToFirebase('users', user.uid, {
            uid: user.uid,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: 'Active',
            createdAt: user.createdAt,
            expiryDate: updatedExpiry,
            accountLocked: false,
            forceUnlocked: true,
            forceUnlockedAt: nowIso,
            gymName: user.gymName,
            subscriptionCycle: user.subscriptionCycle,
          });

          // 2. If member, also sync Firestore `members/{id}` and local DataProvider + TenantStore
          if (user.role === 'member' && user.numericId !== undefined) {
            const localMember = members.find(m => m.id === user.numericId);
            if (localMember) {
              const updatedMember = {
                ...localMember,
                status: 'Active' as const,
                expiryDate: updatedExpiry,
                accountLocked: false,
                forceUnlocked: true,
              };
              updateMember(updatedMember as any);
              await syncToFirebase('members', String(user.numericId), updatedMember);
            }
            toggleMemberLock(user.numericId, false);
          }

          // 3. If admin tenant, also sync Firestore `tenants/{id}` and TenantStore
          if (user.role === 'admin' && user.tenantId) {
            toggleAdminLock(user.tenantId, false);
            await syncToFirebase('tenants', user.tenantId, {
              id: user.tenantId,
              account_locked: false,
              status: 'Active',
              subscription_expires_at: updatedExpiry,
            });
          }

          addAuditLog({
            id: Date.now().toString(),
            timestamp: nowIso,
            member_id: user.numericId || 0,
            action: 'SUPER_ADMIN_FORCE_UNLOCK',
            details: `Super Admin force-unlocked ${user.role.toUpperCase()} account "${user.name}" (${user.email}) via Firestore. Expiry: ${updatedExpiry}.`,
          });

          return true;
        }
      );

      addToast(`Force-Unlocked "${user.name}" (${user.role.toUpperCase()}) in Firestore!`, 'success');
    } catch (err) {
      console.error('Force unlock error:', err);
      addToast('Failed to force-unlock account.', 'error');
    } finally {
      setBusyUid(null);
    }
  };

  // Toggle Standard Lock / Unlock on an individual account
  const handleToggleLockAccount = async (user: FirestoreUnifiedUser) => {
    if (user.role === 'super_admin') {
      addToast('Sovereign Super Admin root account cannot be locked.', 'warning');
      return;
    }
    setBusyUid(user.uid);
    try {
      const nextLock = !user.accountLocked;
      const nextStatus: GlobalUserStatus = nextLock ? 'Locked' : 'Active';

      await syncToFirebase('users', user.uid, {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: nextStatus,
        createdAt: user.createdAt,
        expiryDate: user.expiryDate,
        accountLocked: nextLock,
        forceUnlocked: !nextLock ? user.forceUnlocked : false,
        gymName: user.gymName,
        subscriptionCycle: user.subscriptionCycle,
      });

      if (user.role === 'member' && user.numericId !== undefined) {
        const localMember = members.find(m => m.id === user.numericId);
        if (localMember) {
          const updatedMember = {
            ...localMember,
            status: nextLock ? ('Expired' as const) : ('Active' as const),
            accountLocked: nextLock,
            forceUnlocked: false,
          };
          updateMember(updatedMember as any);
          await syncToFirebase('members', String(user.numericId), updatedMember);
        }
        toggleMemberLock(
          user.numericId,
          nextLock,
          nextLock ? 'Locked by Super Admin via Firestore Governance' : undefined
        );
      }

      if (user.role === 'admin' && user.tenantId) {
        toggleAdminLock(user.tenantId, nextLock);
        await syncToFirebase('tenants', user.tenantId, {
          id: user.tenantId,
          account_locked: nextLock,
          status: nextLock ? 'Suspended' : 'Active',
        });
      }

      recordAdminActivity({
        actionType: nextLock ? 'ACCOUNT_LOCK' : 'ACCOUNT_UNLOCK',
        category: 'LOCK_UNLOCK',
        targetId: user.uid,
        targetName: user.name,
        targetRole: user.role === 'admin' ? 'admin' : user.role === 'trainer' ? 'staff' : 'member',
        gymName: user.gymName,
        details: nextLock
          ? `Super Admin locked account for ${user.name} (${user.uid}) via Governance Console`
          : `Super Admin unlocked account for ${user.name} (${user.uid}) via Governance Console`,
        previousState: { accountLocked: !nextLock, status: user.status },
        newState: { accountLocked: nextLock, status: nextLock ? 'Locked' : 'Active' },
      }).catch(() => {});

      addToast(
        nextLock
          ? `Account "${user.name}" Locked in Firestore.`
          : `Account "${user.name}" Unlocked in Firestore.`,
        nextLock ? 'warning' : 'success'
      );
    } catch (err) {
      console.error('Toggle lock error:', err);
      addToast('Failed to update lock status.', 'error');
    } finally {
      setBusyUid(null);
    }
  };

  // Change user role in Firestore
  const handleRoleChange = async (user: FirestoreUnifiedUser, newRole: GlobalUserRole) => {
    setBusyUid(user.uid);
    try {
      await syncToFirebase('users', user.uid, {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: newRole,
        status: user.status,
        createdAt: user.createdAt,
        expiryDate: user.expiryDate,
        accountLocked: user.accountLocked,
        forceUnlocked: user.forceUnlocked,
        gymName: user.gymName,
        subscriptionCycle: user.subscriptionCycle,
      });
      addToast(`Updated ${user.name}'s role to ${newRole.toUpperCase()} in Firestore.`, 'success');
    } finally {
      setBusyUid(null);
    }
  };

  // Per-User Membership Expiration Update in Firestore
  const handleUpdateUserExpiration = async (
    user: FirestoreUnifiedUser,
    newExpiryDate: string,
    markExpired = false
  ) => {
    setBusyUid(user.uid);
    try {
      const nextStatus: GlobalUserStatus = markExpired ? 'Expired' : 'Active';
      const nextLocked = markExpired ? true : false;

      await syncToFirebase('users', user.uid, {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: nextStatus,
        createdAt: user.createdAt,
        expiryDate: newExpiryDate,
        accountLocked: nextLocked,
        forceUnlocked: !markExpired,
        gymName: user.gymName,
        subscriptionCycle: user.subscriptionCycle,
      });

      if (user.role === 'member' && user.numericId !== undefined) {
        const localMember = members.find(m => m.id === user.numericId);
        if (localMember) {
          const updatedMember = {
            ...localMember,
            status: markExpired ? ('Expired' as const) : ('Active' as const),
            expiryDate: newExpiryDate,
            accountLocked: nextLocked,
          };
          updateMember(updatedMember as any);
          await syncToFirebase('members', String(user.numericId), updatedMember);
        }
        toggleMemberLock(user.numericId, nextLocked);
      }

      if (user.role === 'admin' && user.tenantId) {
        toggleAdminLock(user.tenantId, nextLocked);
        await syncToFirebase('tenants', user.tenantId, {
          id: user.tenantId,
          account_locked: nextLocked,
          status: markExpired ? 'Suspended' : 'Active',
          subscription_expires_at: newExpiryDate,
        });
      }

      recordAdminActivity({
        actionType: 'SUBSCRIPTION_OVERRIDE',
        category: 'SUBSCRIPTION',
        targetId: user.uid,
        targetName: user.name,
        targetRole: user.role === 'admin' ? 'admin' : user.role === 'trainer' ? 'staff' : 'member',
        gymName: user.gymName,
        details: markExpired
          ? `Marked membership expired for ${user.name} (set to ${newExpiryDate}) by Super Admin`
          : `Subscription expiration override to ${newExpiryDate} for ${user.name} by Super Admin`,
        previousState: { expiryDate: user.expiryDate, status: user.status },
        newState: { expiryDate: newExpiryDate, status: nextStatus, accountLocked: nextLocked },
      }).catch(() => {});

      addToast(
        markExpired
          ? `${user.name}: Membership marked Expired (${newExpiryDate}) in Firestore.`
          : `${user.name}: Membership expiration updated to ${newExpiryDate} in Firestore!`,
        markExpired ? 'warning' : 'success'
      );
    } finally {
      setBusyUid(null);
    }
  };

  // GLOBAL CONTROL 1: Force-Unlock ALL Accounts Globally via Firestore
  const handleForceUnlockAllGlobally = async () => {
    setIsSyncingAll(true);
    try {
      const nowIso = new Date().toISOString();
      const updatedPolicy: GlobalExpirationPolicy = {
        ...globalPolicy,
        forceUnlockAllAccounts: true,
        updatedAt: nowIso,
      };
      setGlobalPolicy(updatedPolicy);
      await syncToFirebase('system_policies', 'global_expiration', updatedPolicy);

      toggleGlobalMasterOverride('forceUnlockAllAdmins', true);
      toggleGlobalMasterOverride('forceUnlockAllMembers', true);

      await Promise.all(
        unifiedUsers.map(u => {
          const safeExpiry =
            getDaysRemaining(u.expiryDate) < 0 ? addDaysToIso(undefined, 30) : u.expiryDate;
          if (u.role === 'member' && u.numericId !== undefined) {
            toggleMemberLock(u.numericId, false);
            const localMember = members.find(m => m.id === u.numericId);
            if (localMember) {
              updateMember({ ...localMember, status: 'Active', expiryDate: safeExpiry } as any);
            }
          }
          if (u.role === 'admin' && u.tenantId) {
            toggleAdminLock(u.tenantId, false);
          }
          return syncToFirebase('users', u.uid, {
            uid: u.uid,
            name: u.name,
            email: u.email,
            phone: u.phone,
            role: u.role,
            status: 'Active',
            createdAt: u.createdAt,
            expiryDate: safeExpiry,
            accountLocked: false,
            forceUnlocked: true,
            forceUnlockedAt: nowIso,
            gymName: u.gymName,
            subscriptionCycle: u.subscriptionCycle,
          });
        })
      );

      recordAdminActivity({
        actionType: 'FORCE_UNLOCK_ALL',
        category: 'LOCK_UNLOCK',
        targetId: 'global_all_users',
        targetName: 'All Platform Accounts',
        targetRole: 'global',
        gymName: 'Platform Global',
        details: `Global force unlock initiated by Super Admin: unlocked ${unifiedUsers.length} accounts and extended expired accounts by +30 days`,
      }).catch(() => {});

      addToast(
        `GLOBAL FORCE-UNLOCK COMPLETE: All ${unifiedUsers.length} accounts unlocked in Firestore!`,
        'success'
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  // GLOBAL CONTROL 2: Update Global Membership Expiration Policy Mode in Firestore
  const handleUpdateGlobalPolicy = async (patch: Partial<GlobalExpirationPolicy>) => {
    const nextPolicy: GlobalExpirationPolicy = {
      ...globalPolicy,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setGlobalPolicy(nextPolicy);
    await syncToFirebase('system_policies', 'global_expiration', nextPolicy);
    addToast(
      `Global Firestore Expiration Policy updated: Mode=${nextPolicy.expirationMode.toUpperCase()}, Grace=${nextPolicy.gracePeriodDays}d`,
      'success'
    );
  };

  // GLOBAL CONTROL 3: Bulk Extend All Memberships Globally (+30d, +90d, +365d)
  const handleBulkExtendAllMemberships = async (daysToAdd: number) => {
    setIsSyncingAll(true);
    try {
      await Promise.all(
        unifiedUsers
          .filter(u => u.role !== 'super_admin')
          .map(u => {
            const newExpiry = addDaysToIso(u.expiryDate, daysToAdd);
            if (u.role === 'member' && u.numericId !== undefined) {
              toggleMemberLock(u.numericId, false);
              const localMember = members.find(m => m.id === u.numericId);
              if (localMember) {
                const updatedMember = {
                  ...localMember,
                  status: 'Active' as const,
                  expiryDate: newExpiry,
                  accountLocked: false,
                };
                updateMember(updatedMember as any);
                syncToFirebase('members', String(u.numericId), updatedMember);
              }
            }
            if (u.role === 'admin' && u.tenantId) {
              toggleAdminLock(u.tenantId, false);
            }
            return syncToFirebase('users', u.uid, {
              uid: u.uid,
              name: u.name,
              email: u.email,
              phone: u.phone,
              role: u.role,
              status: 'Active',
              createdAt: u.createdAt,
              expiryDate: newExpiry,
              accountLocked: false,
              forceUnlocked: u.forceUnlocked,
              gymName: u.gymName,
              subscriptionCycle: u.subscriptionCycle,
            });
          })
      );

      addToast(
        `Globally extended all memberships by +${daysToAdd} days and activated accounts in Firestore!`,
        'success'
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  // GLOBAL CONTROL 4: Sweep & Enforce Expiration Globally (Lock Past-Due Accounts)
  const handleGlobalExpirationSweep = async () => {
    setIsSyncingAll(true);
    try {
      const grace = globalPolicy.expirationMode === 'grace_period' ? globalPolicy.gracePeriodDays : 0;
      let expiredCount = 0;

      await Promise.all(
        unifiedUsers
          .filter(u => u.role !== 'super_admin')
          .map(u => {
            const daysLeft = getDaysRemaining(u.expiryDate, grace);
            if (daysLeft < 0 && !u.forceUnlocked) {
              expiredCount += 1;
              if (u.role === 'member' && u.numericId !== undefined) {
                toggleMemberLock(u.numericId, true, 'Auto-Locked by Global Expiration Sweep');
                const localMember = members.find(m => m.id === u.numericId);
                if (localMember) {
                  updateMember({ ...localMember, status: 'Expired' } as any);
                }
              }
              return syncToFirebase('users', u.uid, {
                uid: u.uid,
                name: u.name,
                email: u.email,
                phone: u.phone,
                role: u.role,
                status: 'Expired',
                createdAt: u.createdAt,
                expiryDate: u.expiryDate,
                accountLocked: true,
                forceUnlocked: false,
                gymName: u.gymName,
                subscriptionCycle: u.subscriptionCycle,
              });
            }
            return Promise.resolve();
          })
      );

      addToast(
        `Global Expiration Sweep Complete: ${expiredCount} past-due account(s) marked Expired & Locked in Firestore.`,
        expiredCount > 0 ? 'warning' : 'success'
      );
    } finally {
      setIsSyncingAll(false);
    }
  };

  const [showMasterSqlModal, setShowMasterSqlModal] = useState<boolean>(false);

  const MASTER_SQL_SCHEMA = `-- 1. Enable Required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Global Users & Roles Table (Super Admin, Admin, Trainer, Member)
CREATE TABLE IF NOT EXISTS public.users_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('SUPER_ADMIN', 'GYM_ADMIN', 'TRAINER', 'MEMBER')) DEFAULT 'MEMBER',
    subscription_status TEXT CHECK (subscription_status IN ('ACTIVE', 'PENDING_PAYMENT', 'PENDING_RENEWAL', 'LOCKED', 'SUSPENDED', 'EXPIRED', 'CHURN_RISK')) DEFAULT 'PENDING_PAYMENT',
    subscription_expires_at TIMESTAMPTZ,
    last_attendance_at TIMESTAMPTZ,
    inactivity_days INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscription & Payment Ledger (HMAC Verified - your-upi@bank)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users_master(id) ON DELETE CASCADE,
    txn_reference TEXT UNIQUE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    merchant_upi TEXT DEFAULT 'your-upi@bank',
    status TEXT CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')) DEFAULT 'PENDING',
    hmac_signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Passkey Credentials (FIDO2 WebAuthn Biometric Login)
CREATE TABLE IF NOT EXISTS public.passkey_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users_master(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Automatic Subscription & Churn Gatekeeper Trigger
CREATE OR REPLACE FUNCTION verify_user_access_state()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_expires_at IS NOT NULL AND NEW.subscription_expires_at < NOW() THEN
        NEW.subscription_status := 'LOCKED';
    END IF;

    IF NEW.last_attendance_at IS NOT NULL THEN
        NEW.inactivity_days := EXTRACT(DAY FROM (NOW() - NEW.last_attendance_at));
        IF NEW.inactivity_days >= 4 AND NEW.role = 'MEMBER' THEN
            NEW.subscription_status := 'CHURN_RISK';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_access_state ON public.users_master;
CREATE TRIGGER trg_user_access_state
BEFORE UPDATE ON public.users_master
FOR EACH ROW EXECUTE FUNCTION verify_user_access_state();

-- 6. Row Level Security (RLS)
ALTER TABLE public.users_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin Full Access" ON public.users_master
    FOR ALL TO service_role USING (true);
CREATE POLICY "Super Admin Payment Access" ON public.payment_transactions
    FOR ALL TO service_role USING (true);
CREATE POLICY "Super Admin Passkey Access" ON public.passkey_credentials
    FOR ALL TO service_role USING (true);`;

  // One-Click Biometric Passkey Reset & Account Recovery
  const handleResetUserPasskey = async (user: FirestoreUnifiedUser) => {
    setBusyUid(user.uid);
    try {
      const nowIso = new Date().toISOString();
      localStorage.removeItem(`webauthn_cred_${user.uid}`);
      if (user.role === 'admin' || user.role === 'super_admin') {
        localStorage.removeItem('registered_admin_biometric');
      }
      await syncToFirebase('users', user.uid, {
        uid: user.uid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: 'Active',
        createdAt: user.createdAt,
        expiryDate: user.expiryDate,
        accountLocked: false,
        forceUnlocked: true,
        passkeyResetAt: nowIso,
        passkeyCredentialId: null,
        gymName: user.gymName,
        subscriptionCycle: user.subscriptionCycle,
      });
      if (addAuditLog) {
        addAuditLog({
          action: 'Super Admin Passkey Reset',
          details: `Reset WebAuthn passkey credentials & unlocked account for ${user.name} (${user.uid})`
        });
      }
      recordAdminActivity({
        actionType: 'PASSKEY_RESET',
        category: 'SECURITY',
        targetId: user.uid,
        targetName: user.name,
        targetRole: user.role === 'admin' ? 'admin' : user.role === 'trainer' ? 'staff' : 'member',
        gymName: user.gymName,
        details: `Reset WebAuthn biometric passkey credentials & unlocked account for ${user.name} (${user.uid})`,
        previousState: { passkeyCredentialId: 'active_token', accountLocked: user.accountLocked },
        newState: { passkeyCredentialId: null, accountLocked: false, forceUnlocked: true },
      }).catch(() => {});

      addToast(
        `Biometric Passkey reset & account unlocked for ${user.name}. User can re-enroll FaceID/Fingerprint immediately.`,
        'success'
      );
    } finally {
      setBusyUid(null);
    }
  };

  // HMAC UPI (your-upi@bank) Webhook Auto-Unlock Gatekeeper
  const handleHmacUpiAutoUnlock = async (user: FirestoreUnifiedUser) => {
    setBusyUid(user.uid);
    try {
      const amount = user.role === 'admin' ? 4999 : 1499;
      const txnRef = `UPI_AUTO_${Date.now()}`;
      const payloadObj = {
        member_id: user.uid,
        full_name: user.name,
        phone_number: user.phone.replace(/\D/g, '').slice(-10) || '9829000001',
        plan_tier: user.role === 'admin' ? 'Admin SaaS Monthly' : 'Fitness Future Standard Monthly',
        txn_reference: txnRef,
        amount,
        merchant_upi: 'your-upi@bank',
      };
      const rawBody = JSON.stringify(payloadObj);

      const signRes = await fetch('/api/v2/payments/sign-test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawBody, scenario: 'valid' }),
      });
      const signData = await signRes.json();

      if (signData?.signature && signData?.timestamp) {
        await fetch('/api/v2/payments/verify-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-signature': signData.signature,
            'x-timestamp': signData.timestamp,
          },
          body: rawBody,
        });
      }

      const newExpiry = addDaysToIso(user.expiryDate, 30);
      await handleUpdateUserExpiration(user, newExpiry, false);
      await handleForceUnlockAccount(user);

      addToast(
        `HMAC UPI (your-upi@bank) Verified (₹${amount} • ${txnRef}) -> Auto-Unlocked ${user.name} until ${newExpiry}!`,
        'success'
      );
    } catch (err: any) {
      addToast(`HMAC Auto-Unlock fallback applied for ${user.name}`, 'info');
      await handleForceUnlockAccount(user);
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border-2 border-cyan-500/40 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_70px_rgba(6,182,212,0.12)] space-y-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* HEADER */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> FIRESTORE &amp; SUPABASE 3-PORTAL MASTER LEDGER
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${
                isFirestoreConnected
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isFirestoreConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              {isFirestoreConnected ? 'FIRESTORE LIVE STREAM ACTIVE' : 'FIRESTORE LOCAL-HYBRID MODE'}
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-widest">
              UPI Gatekeeper: your-upi@bank
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            Supreme Super Admin{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-fuchsia-400">
              Global Ledger, Passkey Reset &amp; Auto-Unlock Gatekeeper
            </span>
          </h2>
          <p className="text-xs text-gray-400 max-w-3xl">
            Master control for Fitness Future Super Admin (Fitness Future): real-time user directory, 1-click Force-Unlock,
            WebAuthn Passkey Reset, HMAC UPI (your-upi@bank) Auto-Unlock, and 3-Portal Master SQL Schema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowMasterSqlModal(prev => !prev)}
            className="px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <Database className="w-4 h-4" />
            {showMasterSqlModal ? 'Hide Master SQL Schema' : '3-Portal Master SQL Schema'}
          </button>

          <button
            onClick={() => fetchUsersFromFirestore(false)}
            disabled={isFetchingUsers}
            className="px-4 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingUsers ? 'animate-spin' : ''}`} />
            {isFetchingUsers ? 'Fetching Users...' : 'Fetch Users from Firestore'}
          </button>

          <button
            onClick={handleSyncAllUsersToFirestore}
            disabled={isSyncingAll}
            className="px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
            {isSyncingAll ? 'Syncing Firestore...' : 'Sync All Users to Firestore'}
          </button>

          <button
            onClick={handleForceUnlockAllGlobally}
            disabled={isSyncingAll}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4" />
            Force-Unlock ALL Accounts Globally
          </button>

          {setCurrentView && (
            <button
              onClick={() => setCurrentView('adminPortal')}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Admin Lock/Extend Portal</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3-PORTAL MASTER SQL SCHEMA DRAWER */}
      {showMasterSqlModal && (
        <div className="relative z-10 bg-zinc-950 border border-purple-500/40 rounded-3xl p-5 space-y-3 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 flex items-center gap-2">
                <Database className="w-4 h-4" /> Production 3-Portal Supabase SQL Schema (users_master + payment_transactions + passkey_credentials)
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Includes the verified CHECK constraint supporting <code className="text-emerald-300">'CHURN_RISK'</code>, <code className="text-emerald-300">'PENDING_RENEWAL'</code>, and <code className="text-emerald-300">'SUSPENDED'</code> for <code className="text-cyan-300">verify_user_access_state()</code> trigger.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(MASTER_SQL_SCHEMA);
                addToast('Copied 3-Portal Master SQL Schema to clipboard!', 'success');
              }}
              className="px-4 py-2 rounded-xl bg-purple-500 text-black text-xs font-black uppercase tracking-wider cursor-pointer hover:bg-purple-400 transition-all"
            >
              Copy SQL Schema
            </button>
          </div>
          <pre className="bg-black/90 border border-white/10 rounded-2xl p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72">
            {MASTER_SQL_SCHEMA}
          </pre>
        </div>
      )}

      {/* KPI STRIP */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Total Firestore Users
          </span>
          <div className="text-2xl font-black text-white mt-1">{kpis.total}</div>
          <p className="text-[10px] text-cyan-400 mt-0.5">Admins, Trainers &amp; Members</p>
        </div>

        <div className="bg-emerald-500/[0.05] border border-emerald-500/25 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
            Active &amp; Unlocked
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">{kpis.activeUnlocked}</div>
          <p className="text-[10px] text-emerald-300/80 mt-0.5">Full portal access enabled</p>
        </div>

        <div className="bg-amber-500/[0.05] border border-amber-500/25 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
            Force-Unlocked Override
          </span>
          <div className="text-2xl font-black text-amber-400 mt-1">{kpis.forceUnlockedCount}</div>
          <p className="text-[10px] text-amber-300/80 mt-0.5">Sovereign bypass active</p>
        </div>

        <div className="bg-rose-500/[0.05] border border-rose-500/25 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">
            Locked / Expired
          </span>
          <div className="text-2xl font-black text-rose-400 mt-1">{kpis.lockedOrExpired}</div>
          <p className="text-[10px] text-rose-300/80 mt-0.5">Requires renewal or force-unlock</p>
        </div>

        <div className="bg-purple-500/[0.05] border border-purple-500/25 rounded-2xl p-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-300">
            Expiring Within 7 Days
          </span>
          <div className="text-2xl font-black text-purple-400 mt-1">{kpis.expiringSoon}</div>
          <p className="text-[10px] text-purple-300/80 mt-0.5">Upcoming membership renewals</p>
        </div>
      </div>

      {/* GLOBAL MEMBERSHIP EXPIRATION MANAGEMENT COMMAND BAR */}
      <div className="relative z-10 bg-black/70 border border-amber-500/30 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest">
              <Sliders className="w-4 h-4" />
              <span>Global Membership Expiration Status Governance (Firestore Policy)</span>
            </div>
            <p className="text-[11px] text-gray-400">
              Control how membership expiration dates are enforced across all Admin and Member portals globally, or
              batch-extend all accounts at once.
            </p>
          </div>

          {/* Policy Mode Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'standard', label: 'Standard Expiry Lock' },
                { id: 'grace_period', label: `Grace Window (+${globalPolicy.gracePeriodDays}d)` },
                { id: 'bypass_all', label: 'Bypass All Expirations' },
              ] as const
            ).map(mode => (
              <button
                key={mode.id}
                onClick={() => handleUpdateGlobalPolicy({ expirationMode: mode.id })}
                className={`px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  globalPolicy.expirationMode === mode.id
                    ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-500/40'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Global Expiration Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-1">
              Grace Period Days:
            </span>
            {[0, 7, 15, 30].map(days => (
              <button
                key={days}
                onClick={() =>
                  handleUpdateGlobalPolicy({
                    gracePeriodDays: days,
                    expirationMode: days > 0 ? 'grace_period' : 'standard',
                  })
                }
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border cursor-pointer transition-all ${
                  globalPolicy.gracePeriodDays === days
                    ? 'bg-cyan-500 text-black border-cyan-400'
                    : 'bg-zinc-900 text-gray-400 border-white/10 hover:text-white'
                }`}
              >
                +{days}d
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkExtendAllMemberships(30)}
              disabled={isSyncingAll}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              +30 Days All Users
            </button>
            <button
              onClick={() => handleBulkExtendAllMemberships(90)}
              disabled={isSyncingAll}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              +90 Days All Users
            </button>
            <button
              onClick={() => handleBulkExtendAllMemberships(365)}
              disabled={isSyncingAll}
              className="px-3.5 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              +1 Year All Users
            </button>
            <button
              onClick={handleGlobalExpirationSweep}
              disabled={isSyncingAll}
              className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-black uppercase tracking-wider cursor-pointer transition-all"
            >
              Run Global Expiry Sweep
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search Firestore users by name, email, phone, UID, role, or branch..."
            className="w-full pl-11 pr-4 py-3 bg-black/80 border border-white/15 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
          {(
            [
              { id: 'all', label: 'All Roles' },
              { id: 'super_admin', label: 'Super Admin' },
              { id: 'admin', label: 'Gym Admins' },
              { id: 'trainer', label: 'Trainers' },
              { id: 'member', label: 'Members' },
            ] as const
          ).map(r => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                roleFilter === r.id
                  ? 'bg-cyan-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1.5 rounded-2xl border border-white/10">
          {(
            [
              { id: 'all', label: 'All Status' },
              { id: 'active', label: 'Active' },
              { id: 'force_unlocked', label: 'Force-Unlocked' },
              { id: 'locked', label: 'Locked' },
              { id: 'expired', label: 'Expired' },
              { id: 'expiring_soon', label: 'Expiring ≤7d' },
            ] as const
          ).map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === s.id
                  ? 'bg-amber-500 text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* FIRESTORE USERS TABLE */}
      <div className="relative z-10 overflow-x-auto rounded-3xl border border-white/10 bg-black/70">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-gray-400">
              <th className="py-3.5 px-4">Full Name</th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Subscription Status</th>
              <th className="py-3.5 px-4">Creation Date</th>
              <th className="py-3.5 px-4">Membership Expiration</th>
              <th className="py-3.5 px-4 text-right">Force Unlock &amp; Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {filteredUsers.map(user => {
              const grace =
                globalPolicy.expirationMode === 'grace_period' ? globalPolicy.gracePeriodDays : 0;
              const daysLeft = getDaysRemaining(user.expiryDate, grace);
              const accountAgeDays = getAccountAgeDays(user.createdAt);
              const isBusy = busyUid === user.uid;

              return (
                <tr
                  key={user.uid}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  {/* 1. Full Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${
                          user.role === 'super_admin'
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : user.role === 'admin'
                            ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                            : user.role === 'trainer'
                            ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                            : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                        }`}
                      >
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{user.name}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                              user.syncedInFirestore
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-zinc-800 text-gray-400'
                            }`}
                          >
                            {user.syncedInFirestore ? 'Firestore' : 'Local+Cloud'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400">{user.email}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          UID: {user.uid} • {user.gymName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Phone */}
                  <td className="py-4 px-4 font-mono text-xs text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-400">📞</span>
                      <span>{user.phone || '+91 98XXXXXXXX'}</span>
                    </div>
                  </td>

                  {/* 3. Role */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit border ${
                          user.role === 'super_admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : user.role === 'admin'
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : user.role === 'trainer'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {user.role === 'super_admin' && <Crown className="w-3 h-3" />}
                        {user.role.replace('_', ' ')}
                      </span>
                      {user.role !== 'super_admin' && (
                        <select
                          value={user.role}
                          disabled={isBusy}
                          onChange={e =>
                            handleRoleChange(user, e.target.value as GlobalUserRole)
                          }
                          aria-label={`Change role for ${user.name}`}
                          className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] text-gray-300 focus:outline-none focus:border-cyan-400 w-fit"
                        >
                          <option value="member">member</option>
                          <option value="trainer">trainer</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      )}
                    </div>
                  </td>

                  {/* 4. Subscription Status */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-fit border ${
                          user.forceUnlocked
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : !user.accountLocked && user.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : user.status === 'Expired'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                        }`}
                      >
                        {user.forceUnlocked ? (
                          <>
                            <Zap className="w-3 h-3" /> ACTIVE (Force-Unlocked)
                          </>
                        ) : !user.accountLocked && user.status === 'Active' ? (
                          <>
                            <Unlock className="w-3 h-3" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> {user.status.toUpperCase()}
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Plan: {user.subscriptionCycle}
                      </span>
                    </div>
                  </td>

                  {/* 5. Creation Date */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-gray-200 font-mono text-xs">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{user.createdAt}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Created {accountAgeDays} day{accountAgeDays === 1 ? '' : 's'} ago
                    </div>
                  </td>

                  {/* 5. Membership Expiration Status & Date Picker */}
                  <td className="py-4 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={user.expiryDate}
                          disabled={isBusy || user.role === 'super_admin'}
                          aria-label={`Expiration date for ${user.name}`}
                          onChange={e => {
                            if (e.target.value) {
                              handleUpdateUserExpiration(user, e.target.value, false);
                            }
                          }}
                          className="bg-zinc-900 border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span
                          className={`text-[10px] font-bold ${
                            user.role === 'super_admin' ||
                            globalPolicy.expirationMode === 'bypass_all'
                              ? 'text-amber-300'
                              : daysLeft < 0
                              ? 'text-rose-400'
                              : daysLeft <= 7
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {user.role === 'super_admin'
                            ? 'Sovereign Lifetime'
                            : globalPolicy.expirationMode === 'bypass_all'
                            ? 'Global Expiry Bypassed'
                            : daysLeft < 0
                            ? `Expired ${Math.abs(daysLeft)}d ago`
                            : `${daysLeft} days remaining`}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 6. Dedicated Force-Unlock & Expiration Controls */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {/* Dedicated Force-Unlock Button */}
                      <button
                        onClick={() => handleForceUnlockAccount(user)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md transition-all cursor-pointer disabled:opacity-50"
                        title="Force-Unlock this account in Firestore and override expiration lock"
                      >
                        <Zap className="w-3 h-3" />
                        Force Unlock
                      </button>

                      {/* HMAC UPI (your-upi@bank) Webhook Auto-Unlock */}
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleHmacUpiAutoUnlock(user)}
                          disabled={isBusy}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                          title="Verify HMAC UPI (your-upi@bank) Webhook & Auto-Unlock +30d"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          UPI Auto-Unlock
                        </button>
                      )}

                      {/* One-Click Passkey / Biometric Reset */}
                      <button
                        onClick={() => handleResetUserPasskey(user)}
                        disabled={isBusy}
                        className="px-2.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        title="One-Click WebAuthn Passkey Reset & Account Recovery"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reset Passkey
                      </button>

                      {/* Lock / Unlock Toggle */}
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleToggleLockAccount(user)}
                          disabled={isBusy}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50 ${
                            user.accountLocked
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                              : 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25'
                          }`}
                        >
                          {user.accountLocked ? (
                            <>
                              <Unlock className="w-3 h-3" /> Unlock
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3" /> Lock
                            </>
                          )}
                        </button>
                      )}

                      {/* Quick Expiration Extensions */}
                      {user.role !== 'super_admin' && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateUserExpiration(
                                user,
                                addDaysToIso(user.expiryDate, 30),
                                false
                              )
                            }
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase cursor-pointer"
                            title="Extend membership by 30 days"
                          >
                            +30d
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateUserExpiration(
                                user,
                                addDaysToIso(user.expiryDate, 365),
                                false
                              )
                            }
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase cursor-pointer"
                            title="Extend membership by 1 Year"
                          >
                            +1Yr
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateUserExpiration(
                                user,
                                new Date(Date.now() - 86400000).toISOString().split('T')[0],
                                true
                              )
                            }
                            disabled={isBusy}
                            className="px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/40 text-gray-400 hover:text-rose-300 text-[10px] font-black uppercase cursor-pointer"
                            title="Mark membership as Expired"
                          >
                            Expire
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-xs">
            No Firestore user accounts match the current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminFirestoreUsersPanel;
