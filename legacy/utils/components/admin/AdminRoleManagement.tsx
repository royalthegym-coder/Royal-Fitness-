import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Eye,
  Lock,
  Unlock,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Edit,
  Save,
  X,
  FileText,
  UserPlus,
  Building2,
  Phone,
  Mail,
  Calendar,
  Key,
  Database,
  ExternalLink,
  ChevronDown,
  Info,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { auth, db, isVerifiedOwnerEmail, syncToFirebase, subscribeToCollection } from '../../../lib/firebase';
import { useToast } from '../../hooks/useToast';
import { useTenantStore } from '../../store/useTenantStore';
import { recordAdminActivity } from './AdminActivityLog';

export type AdminPermissionLevel = 'ReadOnly' | 'Auditor' | 'Admin' | 'SuperAdmin';

export interface AdminAccountRecord {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  gymName: string;
  gymId?: string;
  role: 'super_admin' | 'admin';
  permissionLevel: AdminPermissionLevel;
  subscriptionStatus: 'ACTIVE' | 'LOCKED' | 'TRIAL';
  accountLocked: boolean;
  creationDate: string;
  lastLogin?: string;
  lastRoleUpdatedBy?: string;
  lastRoleUpdatedAt?: string;
  permissions: {
    canForceUnlock: boolean;
    canExportLogs: boolean;
    canManageRoles: boolean;
    canManageSubscriptions: boolean;
    canManageTenants: boolean;
    canViewAudits: boolean;
    canModifyPolicies: boolean;
  };
  notes?: string;
  isRootSuperAdmin?: boolean;
}

// Default capabilities mapping per level
export const PERMISSION_LEVEL_CAPABILITIES: Record<AdminPermissionLevel, AdminAccountRecord['permissions']> = {
  SuperAdmin: {
    canForceUnlock: true,
    canExportLogs: true,
    canManageRoles: true,
    canManageSubscriptions: true,
    canManageTenants: true,
    canViewAudits: true,
    canModifyPolicies: true,
  },
  Admin: {
    canForceUnlock: true,
    canExportLogs: true,
    canManageRoles: false,
    canManageSubscriptions: true,
    canManageTenants: false,
    canViewAudits: true,
    canModifyPolicies: false,
  },
  Auditor: {
    canForceUnlock: false,
    canExportLogs: true,
    canManageRoles: false,
    canManageSubscriptions: false,
    canManageTenants: false,
    canViewAudits: true,
    canModifyPolicies: false,
  },
  ReadOnly: {
    canForceUnlock: false,
    canExportLogs: false,
    canManageRoles: false,
    canManageSubscriptions: false,
    canManageTenants: false,
    canViewAudits: false,
    canModifyPolicies: false,
  },
};

// Production RBAC registry loads real verified admin accounts from Firestore and active tenants
const SEED_ADMIN_ACCOUNTS: AdminAccountRecord[] = [];

export const AdminRoleManagement: React.FC<{
  setCurrentView?: (view: string) => void;
}> = ({ setCurrentView }) => {
  const { addToast } = useToast();
  const { tenants, updateTenantStatus } = useTenantStore();

  const [firestoreUsers, setFirestoreUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'all' | AdminPermissionLevel>('all');
  const [editingAdmin, setEditingAdmin] = useState<AdminAccountRecord | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [showNewAdminModal, setShowNewAdminModal] = useState<boolean>(false);

  // New Admin Form State
  const [newAdminName, setNewAdminName] = useState<string>('');
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [newAdminPhone, setNewAdminPhone] = useState<string>('');
  const [newAdminGym, setNewAdminGym] = useState<string>('Fitness Future Jaipur Hub');
  const [newAdminLevel, setNewAdminLevel] = useState<AdminPermissionLevel>('Admin');
  const [newAdminNotes, setNewAdminNotes] = useState<string>('');

  // 1. Subscribe in real time to Firestore 'users' collection
  useEffect(() => {
    let isMounted = true;
    const unsub = subscribeToCollection('users', (docs) => {
      if (!isMounted) return;
      if (docs && docs.length > 0) {
        setFirestoreUsers(docs);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // 2. Unify Admin Accounts from Firestore 'users', 'tenants', and seed base
  const adminAccounts = useMemo<AdminAccountRecord[]>(() => {
    const map = new Map<string, AdminAccountRecord>();

    // 1. Live verified owner session (if authenticated)
    SEED_ADMIN_ACCOUNTS.forEach((a) => map.set(a.uid, a));
    const activeOwner = auth.currentUser;
    if (activeOwner && isVerifiedOwnerEmail(activeOwner.email)) {
      map.set(activeOwner.uid, {
        uid: activeOwner.uid,
        fullName: activeOwner.displayName || 'Fitness Future Owner',
        email: activeOwner.email || 'owner@fitnessfuture.in',
        phone: activeOwner.phoneNumber || '+91 98XXXXXXXX',
        gymName: 'Fitness Future Central HQ',
        gymId: 'gym_central_01',
        role: 'super_admin',
        permissionLevel: 'SuperAdmin',
        subscriptionStatus: 'ACTIVE',
        accountLocked: false,
        creationDate: '2024-01-01',
        lastLogin: new Date().toISOString(),
        isRootSuperAdmin: true,
        permissions: PERMISSION_LEVEL_CAPABILITIES.SuperAdmin,
        notes: 'Verified Owner Console Account',
      });
    }

    // 2. Franchise Tenants from tenant store
    tenants.forEach((t) => {
      const uid = `admin_${t.gym_id || (t as any).id}`;
      const existing = map.get(uid);
      const permLevel: AdminPermissionLevel =
        (t as any).permission_level ||
        (t as any).permissionLevel ||
        existing?.permissionLevel ||
        'Admin';

      map.set(uid, {
        uid,
        fullName: t.admin_name || t.gym_name || 'Gym Admin',
        email: t.email_id || `${t.gym_id || 'franchise'}@fitnessfuture.os`,
        phone: t.phone_number || '+91 98290 00000',
        gymName: t.gym_name || 'Fitness Future Franchise',
        gymId: t.gym_id,
        role: 'admin',
        permissionLevel: permLevel,
        subscriptionStatus: t.subscription_status === 'Active' ? 'ACTIVE' : 'LOCKED',
        accountLocked: Boolean(t.account_locked),
        creationDate: (t.created_at || '2025-01-15').split('T')[0],
        permissions: PERMISSION_LEVEL_CAPABILITIES[permLevel] || PERMISSION_LEVEL_CAPABILITIES.Admin,
        notes: existing?.notes || `Tenant Admin for ${t.gym_name}`,
      });
    });

    // 3. Direct Firestore 'users' records where role is 'admin' or 'super_admin'
    firestoreUsers.forEach((u) => {
      const uid = String(u.uid || u.id || '');
      if (!uid) return;

      const rawRole = String(u.role || '').toLowerCase();
      const isAdminRole =
        rawRole === 'admin' ||
        rawRole === 'super_admin' ||
        uid.startsWith('admin_') ||
        uid.startsWith('usr_super_') ||
        isVerifiedOwnerEmail(u.email);

      if (!isAdminRole) return;

      const existing = map.get(uid);
      const isRoot =
        uid === 'usr_super_fitness_future' ||
        isVerifiedOwnerEmail(u.email) ||
        existing?.isRootSuperAdmin;

      let permLevel: AdminPermissionLevel =
        u.permissionLevel ||
        u.permission_level ||
        (isRoot ? 'SuperAdmin' : rawRole === 'super_admin' ? 'SuperAdmin' : existing?.permissionLevel || 'Admin');

      // Valid enum check
      if (!['ReadOnly', 'Auditor', 'Admin', 'SuperAdmin'].includes(permLevel)) {
        permLevel = isRoot ? 'SuperAdmin' : 'Admin';
      }

      map.set(uid, {
        uid,
        fullName: u.fullName || u.name || existing?.fullName || 'Gym Admin',
        email: u.email || existing?.email || '',
        phone: u.phone || u.phoneNumber || existing?.phone || '',
        gymName: u.gymName || existing?.gymName || 'Fitness Future Central',
        gymId: u.gymId || existing?.gymId,
        role: permLevel === 'SuperAdmin' ? 'super_admin' : 'admin',
        permissionLevel: permLevel,
        subscriptionStatus: String(u.subscriptionStatus || u.subscription_status || 'ACTIVE').toUpperCase() as any,
        accountLocked: Boolean(u.accountLocked || u.account_locked),
        creationDate: (u.createdAt || u.creationDate || existing?.creationDate || '2025-01-01').split('T')[0],
        lastRoleUpdatedBy: u.lastRoleUpdatedBy || existing?.lastRoleUpdatedBy,
        lastRoleUpdatedAt: u.lastRoleUpdatedAt || existing?.lastRoleUpdatedAt,
        isRootSuperAdmin: isRoot,
        permissions: u.permissions || PERMISSION_LEVEL_CAPABILITIES[permLevel],
        notes: u.notes || existing?.notes,
      });
    });

    return Array.from(map.values());
  }, [firestoreUsers, tenants]);

  // Filtered accounts based on search query and permission level
  const filteredAdmins = useMemo(() => {
    let list = [...adminAccounts];
    const term = searchTerm.toLowerCase().trim();

    if (term) {
      list = list.filter(
        (a) =>
          a.fullName.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term) ||
          a.phone.toLowerCase().includes(term) ||
          a.uid.toLowerCase().includes(term) ||
          a.gymName.toLowerCase().includes(term) ||
          a.permissionLevel.toLowerCase().includes(term)
      );
    }

    if (levelFilter !== 'all') {
      list = list.filter((a) => a.permissionLevel === levelFilter);
    }

    // Sort: SuperAdmins first, then Admins, Auditors, ReadOnly
    const rank: Record<AdminPermissionLevel, number> = {
      SuperAdmin: 1,
      Admin: 2,
      Auditor: 3,
      ReadOnly: 4,
    };
    return list.sort((a, b) => rank[a.permissionLevel] - rank[b.permissionLevel]);
  }, [adminAccounts, searchTerm, levelFilter]);

  // Metric counts
  const stats = useMemo(() => {
    const counts = {
      total: adminAccounts.length,
      SuperAdmin: 0,
      Admin: 0,
      Auditor: 0,
      ReadOnly: 0,
    };
    adminAccounts.forEach((a) => {
      counts[a.permissionLevel] = (counts[a.permissionLevel] || 0) + 1;
    });
    return counts;
  }, [adminAccounts]);

  /**
   * Persists an updated Permission Level for an Admin account to Cloud Firestore.
   */
  const handleAssignPermissionLevel = async (
    targetAccount: AdminAccountRecord,
    newLevel: AdminPermissionLevel,
    customPermissions?: AdminAccountRecord['permissions'],
    notes?: string
  ) => {
    // Prevent demoting the root platform Super Admin
    if (targetAccount.isRootSuperAdmin && newLevel !== 'SuperAdmin') {
      addToast('Security Block: Root Super Admin permissions cannot be demoted.', 'error');
      return;
    }

    setIsUpdating(true);
    const superAdminUid = auth.currentUser?.uid || 'owner_primary';
    const superAdminEmail = auth.currentUser?.email || 'owner@fitnessfuture.in';
    const nowIso = new Date().toISOString();
    const finalPermissions = customPermissions || PERMISSION_LEVEL_CAPABILITIES[newLevel];

    try {
      const payload = {
        uid: targetAccount.uid,
        name: targetAccount.fullName,
        fullName: targetAccount.fullName,
        email: targetAccount.email,
        phone: targetAccount.phone,
        role: newLevel === 'SuperAdmin' ? 'super_admin' : 'admin',
        permissionLevel: newLevel,
        permissions: finalPermissions,
        lastRoleUpdatedBy: superAdminUid,
        lastRoleUpdatedAt: nowIso,
        notes: notes || targetAccount.notes || `Assigned ${newLevel} permission level`,
        updatedAt: nowIso,
      };

      // 1. Update Firestore 'users' collection
      await syncToFirebase('users', targetAccount.uid, payload);

      // 2. If account is associated with a tenant, update 'tenants' collection
      if (targetAccount.gymId || targetAccount.uid.startsWith('admin_')) {
        const tenantId = targetAccount.gymId || targetAccount.uid.replace('admin_', '');
        await syncToFirebase('tenants', tenantId, {
          permission_level: newLevel,
          updated_at: nowIso,
        });
      }

      // 3. Log administrative action into Firestore 'admin_activity_logs'
      await recordAdminActivity({
        actionType: 'POLICY_UPDATE',
        category: 'GOVERNANCE',
        targetId: targetAccount.uid,
        targetName: targetAccount.fullName,
        targetRole: 'admin',
        gymName: targetAccount.gymName,
        details: `Super Admin assigned Permission Level: "${newLevel}" to admin account "${targetAccount.fullName}" [UID: ${targetAccount.uid}]`,
        previousState: {
          permissionLevel: targetAccount.permissionLevel,
          role: targetAccount.role,
        },
        newState: {
          permissionLevel: newLevel,
          role: payload.role,
          permissions: finalPermissions,
        },
      });

      // 4. Update local state immediately
      setFirestoreUsers((prev) => {
        const filtered = prev.filter((u) => (u.uid || u.id) !== targetAccount.uid);
        return [...filtered, { ...targetAccount, ...payload }];
      });

      addToast(
        `Permission level successfully updated to "${newLevel}" for "${targetAccount.fullName}"!`,
        'success'
      );
      setEditingAdmin(null);
    } catch (err: any) {
      console.error('[AdminRoleManagement] Error assigning permission level:', err);
      addToast(`Failed to update admin permissions in Firestore: ${err.message || err}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Provisions a brand new Admin account into Firestore with the chosen permission level.
   */
  const handleCreateNewAdmin = async () => {
    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      addToast('Please enter both admin name and valid email address.', 'error');
      return;
    }

    setIsUpdating(true);
    const nowIso = new Date().toISOString();
    const newUid = `admin_${newAdminName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36).substring(2, 6)}`;
    const superAdminUid = auth.currentUser?.uid || 'usr_super_fitness_future';

    try {
      const payload = {
        uid: newUid,
        name: newAdminName.trim(),
        fullName: newAdminName.trim(),
        email: newAdminEmail.trim().toLowerCase(),
        phone: newAdminPhone.trim() || '+91 98290 00000',
        gymName: newAdminGym,
        role: newAdminLevel === 'SuperAdmin' ? 'super_admin' : 'admin',
        permissionLevel: newAdminLevel,
        permissions: PERMISSION_LEVEL_CAPABILITIES[newAdminLevel],
        status: 'Active',
        subscriptionStatus: 'ACTIVE',
        subscription_status: 'Active',
        accountLocked: false,
        createdAt: nowIso,
        creationDate: nowIso.split('T')[0],
        lastRoleUpdatedBy: superAdminUid,
        lastRoleUpdatedAt: nowIso,
        notes: newAdminNotes || `Provisioned as ${newAdminLevel}`,
      };

      // Write to Firestore 'users' collection
      await syncToFirebase('users', newUid, payload);

      // Log to admin activity logs
      await recordAdminActivity({
        actionType: 'POLICY_UPDATE',
        category: 'GOVERNANCE',
        targetId: newUid,
        targetName: newAdminName,
        targetRole: 'admin',
        gymName: newAdminGym,
        details: `Super Admin provisioned new Admin account with Permission Level "${newAdminLevel}"`,
        newState: payload,
      });

      setFirestoreUsers((prev) => [...prev, payload]);
      addToast(`New Admin account "${newAdminName}" provisioned in Firestore as ${newAdminLevel}!`, 'success');

      // Reset form
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPhone('');
      setNewAdminNotes('');
      setShowNewAdminModal(false);
    } catch (err: any) {
      console.error('[AdminRoleManagement] Error provisioning new admin:', err);
      addToast(`Failed to provision admin account: ${err.message || err}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper badge renderers
  const getLevelBadge = (level: AdminPermissionLevel) => {
    switch (level) {
      case 'SuperAdmin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm shadow-amber-500/10">
            <Crown className="w-3.5 h-3.5 text-amber-400" /> SuperAdmin
          </span>
        );
      case 'Admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Admin
          </span>
        );
      case 'Auditor':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <Eye className="w-3.5 h-3.5 text-purple-400" /> Auditor
          </span>
        );
      case 'ReadOnly':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-sky-400" /> ReadOnly
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-white pb-16">
      {/* 1. Header Banner */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 lg:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-purple-950/50 text-purple-400 border border-purple-500/30 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Super Admin Access Governance
              </span>
              <span className="px-3 py-1 bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono tracking-widest rounded-md">
                FIRESTORE RBAC
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 uppercase tracking-tight">
              Admin Role Management
            </h1>
            <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mt-1 max-w-2xl">
              Assign specific permission levels (<code className="text-sky-300 font-mono">ReadOnly</code>, <code className="text-purple-300 font-mono">Auditor</code>, <code className="text-emerald-300 font-mono">Admin</code>, and <code className="text-amber-300 font-mono">SuperAdmin</code>) to Admin accounts stored in Firestore
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setShowMatrixModal(true)}
              className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-bold uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
              title="Inspect permissions capability matrix"
            >
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Permission Matrix</span>
            </button>

            <button
              onClick={() => setShowNewAdminModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:from-cyan-300 hover:via-indigo-400 hover:to-purple-500 text-black text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision New Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="uppercase font-mono text-[10px] tracking-wider">Total Admins</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-2">{stats.total}</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1">Firestore accounts</div>
        </div>

        <div className="bg-zinc-950 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span className="uppercase font-mono text-[10px] tracking-wider">SuperAdmin</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-300 mt-2">{stats.SuperAdmin}</div>
          <div className="text-[10px] text-amber-400/70 font-mono mt-1">Root / Full control</div>
        </div>

        <div className="bg-zinc-950 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span className="uppercase font-mono text-[10px] tracking-wider">Standard Admin</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-2">{stats.Admin}</div>
          <div className="text-[10px] text-emerald-400/70 font-mono mt-1">Franchise ops</div>
        </div>

        <div className="bg-zinc-950 border border-purple-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400 text-xs">
            <span className="uppercase font-mono text-[10px] tracking-wider">Auditor</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-300 mt-2">{stats.Auditor}</div>
          <div className="text-[10px] text-purple-400/70 font-mono mt-1">Logs & Compliance</div>
        </div>

        <div className="bg-zinc-950 border border-sky-500/20 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-sky-400 text-xs">
            <span className="uppercase font-mono text-[10px] tracking-wider">ReadOnly</span>
            <Lock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black font-mono text-sky-300 mt-2">{stats.ReadOnly}</div>
          <div className="text-[10px] text-sky-400/70 font-mono mt-1">Observer analyst</div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Admin Name, Email, Phone, UID, or Gym Branch..."
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Level Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl">
            {(['all', 'SuperAdmin', 'Admin', 'Auditor', 'ReadOnly'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  levelFilter === lvl
                    ? lvl === 'SuperAdmin'
                      ? 'bg-amber-500 text-black shadow-md'
                      : lvl === 'Admin'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : lvl === 'Auditor'
                      ? 'bg-purple-500 text-white shadow-md'
                      : lvl === 'ReadOnly'
                      ? 'bg-sky-500 text-black shadow-md'
                      : 'bg-cyan-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lvl === 'all' ? 'All Roles' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Admin Accounts Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <th className="py-4 px-5">Admin Profile & Contact</th>
                <th className="py-4 px-4">Gym Franchise Lease</th>
                <th className="py-4 px-4">Permission Level</th>
                <th className="py-4 px-4">Granted Capabilities</th>
                <th className="py-4 px-4">Status & Last Audit</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold">Retrieving Admin Accounts from Firestore...</p>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <ShieldAlert className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-zinc-300">No Admin accounts found matching your filter.</p>
                    <p className="text-xs text-zinc-600 mt-1">Try clearing your search term or click "Provision New Admin" above.</p>
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  return (
                    <tr
                      key={admin.uid}
                      className="hover:bg-zinc-900/40 transition-colors group"
                    >
                      {/* 1. Profile */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                            admin.permissionLevel === 'SuperAdmin'
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                              : admin.permissionLevel === 'Admin'
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : admin.permissionLevel === 'Auditor'
                              ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                              : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                          }`}>
                            {admin.isRootSuperAdmin ? (
                              <Crown className="w-5 h-5 text-amber-400" />
                            ) : (
                              admin.fullName.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">
                                {admin.fullName}
                              </span>
                              {admin.isRootSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-bold uppercase">
                                  Root Owner
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="w-3 h-3 text-zinc-500" /> {admin.email}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              UID: {admin.uid}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Gym Franchise */}
                      <td className="py-4 px-4">
                        <div className="space-y-0.5">
                          <div className="text-zinc-200 font-semibold flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{admin.gymName}</span>
                          </div>
                          {admin.gymId && (
                            <span className="text-[10px] font-mono text-zinc-500 block">
                              ID: {admin.gymId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Permission Level */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <div>{getLevelBadge(admin.permissionLevel)}</div>

                          {/* Quick Change Dropdown */}
                          {!admin.isRootSuperAdmin ? (
                            <div className="relative">
                              <select
                                value={admin.permissionLevel}
                                onChange={(e) =>
                                  handleAssignPermissionLevel(admin, e.target.value as AdminPermissionLevel)
                                }
                                disabled={isUpdating}
                                className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-[10px] rounded-lg px-2 py-1 font-bold focus:outline-none focus:border-cyan-500 cursor-pointer w-full max-w-[130px]"
                              >
                                <option value="SuperAdmin">SuperAdmin</option>
                                <option value="Admin">Admin</option>
                                <option value="Auditor">Auditor</option>
                                <option value="ReadOnly">ReadOnly</option>
                              </select>
                            </div>
                          ) : (
                            <span className="text-[9px] font-mono text-zinc-500 italic block">
                              Locked (Root Admin)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Granted Capabilities */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {admin.permissions.canForceUnlock && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                              ✓ Force Unlock
                            </span>
                          )}
                          {admin.permissions.canExportLogs && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                              ✓ Export Logs
                            </span>
                          )}
                          {admin.permissions.canManageRoles && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                              ✓ Manage Roles
                            </span>
                          )}
                          {admin.permissions.canViewAudits && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                              ✓ View Audits
                            </span>
                          )}
                          {admin.permissionLevel === 'ReadOnly' && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-500/30">
                              View Only
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Status & Last Update */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              admin.accountLocked
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {admin.accountLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                            {admin.accountLocked ? 'LOCKED' : 'ACTIVE'}
                          </span>
                          {admin.lastRoleUpdatedAt && (
                            <div className="text-[10px] text-zinc-500 font-mono">
                              Updated: {admin.lastRoleUpdatedAt.split('T')[0]}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 6. Action Button */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setEditingAdmin(admin)}
                          disabled={admin.isRootSuperAdmin}
                          className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                          title={admin.isRootSuperAdmin ? 'Root Super Admin cannot be edited' : 'Configure granular permissions and notes'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Configure</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. MODAL: EDIT PERMISSION LEVEL & GRANULAR SCOPES */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    Assign Permission Level
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Target: <strong className="text-white">{editingAdmin.fullName}</strong> ({editingAdmin.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAdmin(null)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
              {/* Permission Level Selector Cards */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Select Permission Tier
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['ReadOnly', 'Auditor', 'Admin', 'SuperAdmin'] as const).map((lvl) => {
                    const isSelected = editingAdmin.permissionLevel === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() =>
                          setEditingAdmin({
                            ...editingAdmin,
                            permissionLevel: lvl,
                            permissions: PERMISSION_LEVEL_CAPABILITIES[lvl],
                          })
                        }
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? lvl === 'SuperAdmin'
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                              : lvl === 'Admin'
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                              : lvl === 'Auditor'
                              ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-2 ring-purple-500/30'
                              : 'bg-sky-500/15 border-sky-500 text-sky-300 ring-2 ring-sky-500/30'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs uppercase">{lvl}</span>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-tight">
                          {lvl === 'SuperAdmin'
                            ? 'Root power: manage roles, force unlock, policy overrides'
                            : lvl === 'Admin'
                            ? 'Operational gym admin: members, attendance, packages'
                            : lvl === 'Auditor'
                            ? 'Compliance officer: view and export audit trails & logs'
                            : 'Analyst: view dashboards & public member directories'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Capabilities Toggles */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  Capability Matrix for {editingAdmin.permissionLevel}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canForceUnlock}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canForceUnlock: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>Force Unlock Accounts</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canExportLogs}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canExportLogs: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>Export Audit Logs (CSV)</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canManageRoles}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canManageRoles: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>Manage Admin Roles</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canManageSubscriptions}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canManageSubscriptions: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>Manage Subscriptions</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canViewAudits}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canViewAudits: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>View Audit Trails</span>
                  </label>

                  <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canModifyPolicies}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canModifyPolicies: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-cyan-500"
                    />
                    <span>Modify System Policies</span>
                  </label>
                </div>
              </div>

              {/* Audit Notes */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Assignment Justification / Notes
                </label>
                <input
                  type="text"
                  value={editingAdmin.notes || ''}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, notes: e.target.value })}
                  placeholder="e.g., Assigned Auditor clearance for quarterly audit compliance..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleAssignPermissionLevel(
                    editingAdmin,
                    editingAdmin.permissionLevel,
                    editingAdmin.permissions,
                    editingAdmin.notes
                  )
                }
                disabled={isUpdating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isUpdating ? 'Saving...' : 'Save to Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: PROVISION NEW ADMIN ACCOUNT */}
      {showNewAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Provision New Admin Account
                </h3>
              </div>
              <button
                onClick={() => setShowNewAdminModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g., Rajesh Sharma"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="rajesh.admin@fitnessfuture.os"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
                  placeholder="+91 98290 11223"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Assigned Facility / Gym Branch
                </label>
                <input
                  type="text"
                  value={newAdminGym}
                  onChange={(e) => setNewAdminGym(e.target.value)}
                  placeholder="e.g. Fitness Future Jaipur Hub"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Initial Permission Level
                </label>
                <select
                  value={newAdminLevel}
                  onChange={(e) => setNewAdminLevel(e.target.value as AdminPermissionLevel)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-bold"
                >
                  <option value="Admin">Admin (Standard franchise operations)</option>
                  <option value="Auditor">Auditor (Compliance & Audit logs export)</option>
                  <option value="ReadOnly">ReadOnly (Observer analyst)</option>
                  <option value="SuperAdmin">SuperAdmin (Full ecosystem access)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Internal Notes
                </label>
                <input
                  type="text"
                  value={newAdminNotes}
                  onChange={(e) => setNewAdminNotes(e.target.value)}
                  placeholder="e.g. Regional manager for North Hub"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowNewAdminModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewAdmin}
                disabled={isUpdating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isUpdating ? 'Creating...' : 'Provision in Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: PERMISSION MATRIX REFERENCE */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Admin Permission Level Matrix
                </h3>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Capability / Operation</th>
                    <th className="py-2.5 px-3 text-center text-sky-400">ReadOnly</th>
                    <th className="py-2.5 px-3 text-center text-purple-400">Auditor</th>
                    <th className="py-2.5 px-3 text-center text-emerald-400">Admin</th>
                    <th className="py-2.5 px-3 text-center text-amber-400">SuperAdmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">View Dashboards & KPIs</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">View All Audit Trails & Geolocation</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">Export & Download CSV Logs</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">Force Unlock User Accounts</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓ (Gym branch)</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓ (Global)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">Manage Members & Subscriptions</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">Assign Admin Roles & Permissions</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">Provision & Delete Gym Leases</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold text-zinc-200">Global Expiration Policy Override</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-zinc-600">✗</td>
                    <td className="py-2.5 px-3 text-center text-emerald-400">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
