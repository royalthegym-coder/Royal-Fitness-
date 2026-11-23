import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Shield,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Phone,
  Calendar,
  Building2,
  History,
  Database,
  Download,
  FileDown
} from 'lucide-react';
import { auth, db, syncToFirebase, subscribeToCollection } from '../../lib/firebase';
import { useToast } from '../hooks/useToast';
import { useData } from '../context/DataProvider';
import { useTenantStore } from '../store/useTenantStore';
import { recordAdminActivity } from './admin/AdminActivityLog';
import { forceUnlockLoggingMiddleware } from '../middleware/forceUnlockLoggingMiddleware';
import { ForceUnlockAuditLogsTab } from './admin/ForceUnlockAuditLogsTab';
import { AdminStatsWidget } from './admin/AdminStatsWidget';
import { AdminRoleManagement } from './admin/AdminRoleManagement';
import { downloadForceUnlockLogsCsv, fetchForceUnlockLogs } from '../exportForceUnlockLogs';
import { generateAuditReportPdf } from '../exportAuditReportPdf';

export interface FirestoreUserRecord {
  uid: string;
  fullName: string;
  phone: string;
  role: string;
  subscriptionStatus: string;
  creationDate: string;
  email?: string;
  gymName?: string;
  accountLocked?: boolean;
}

export const SuperAdminDashboard: React.FC<{
  setCurrentView?: (view: string) => void;
}> = ({ setCurrentView }) => {
  const { addToast } = useToast();
  const { members, updateMember } = useData();
  const { tenants, updateTenantStatus, toggleAdminLock, toggleMemberLock } = useTenantStore();

  const [firestoreUsers, setFirestoreUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'audit_logs' | 'roles'>('users');
  const [isExportingLogs, setIsExportingLogs] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  /**
   * Downloads current 'force_unlock_logs' Firestore data into CSV format for archival purposes.
   */
  const handleDownloadLogsCsv = async () => {
    setIsExportingLogs(true);
    try {
      const res = await downloadForceUnlockLogsCsv();
      addToast(`Archived ${res.count} records from 'force_unlock_logs' into "${res.filename}"!`, 'success');
    } catch (err: any) {
      console.error('[SuperAdminDashboard] Export CSV error:', err);
      addToast('Failed to export force_unlock_logs to CSV.', 'error');
    } finally {
      setIsExportingLogs(false);
    }
  };

  /**
   * Generates a professional, formatted summary PDF report of force_unlock_logs for compliance documentation using jsPDF.
   */
  const handleDownloadPdfReport = async () => {
    setIsExportingPdf(true);
    try {
      const records = await fetchForceUnlockLogs();
      const operatorEmail = auth.currentUser?.email || 'owner@fitnessfuture.in';
      const operatorName = auth.currentUser?.displayName || 'Fitness Future Owner';
      const res = await generateAuditReportPdf(records, {
        generatedBy: `${operatorName} <${operatorEmail}>`,
        gymName: 'Fitness Future Central HQ',
      });
      addToast(`Generated compliance PDF report for ${res.count} audit logs ("${res.filename}")!`, 'success');
    } catch (err: any) {
      console.error('[SuperAdminDashboard] Export PDF error:', err);
      addToast('Failed to generate compliance PDF report.', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Retrieve all users from Firestore in real-time
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToCollection('users', (docs) => {
      if (!isMounted) return;
      if (docs && docs.length > 0) {
        setFirestoreUsers(docs);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Compute unified list of users from Firestore + local state
  const usersList = useMemo<FirestoreUserRecord[]>(() => {
    const map = new globalThis.Map<string, FirestoreUserRecord>();

    // 1. Root Super Admin
    map.set('super_admin_root', {
      uid: auth.currentUser?.uid || 'super_admin_root',
      fullName: auth.currentUser?.displayName || 'Fitness Future Owner',
      phone: '+91 98XXXXXXXX',
      role: 'super_admin',
      subscriptionStatus: 'ACTIVE',
      creationDate: '2024-01-01',
      email: auth.currentUser?.email || 'owner@fitnessfuture.in',
      gymName: 'Fitness Future Central HQ',
      accountLocked: false,
    });

    // 2. Tenants (Franchise Admins)
    tenants.forEach(t => {
      const uid = `admin_${t.gym_id || (t as any).id}`;
      map.set(uid, {
        uid,
        fullName: t.admin_name || t.gym_name || 'Gym Admin',
        phone: t.phone_number || '+91 98290 00000',
        role: 'admin',
        subscriptionStatus: (t.subscription_status === 'Active' ? 'ACTIVE' : t.subscription_status === 'Trial' ? 'TRIAL' : 'LOCKED'),
        creationDate: (t.created_at || '2025-01-15').split('T')[0],
        email: t.email_id,
        gymName: t.gym_name,
        accountLocked: Boolean(t.account_locked),
      });
    });

    // 3. Gym Members
    members.forEach(m => {
      const uid = `member_${m.id}`;
      map.set(uid, {
        uid,
        fullName: m.name,
        phone: m.phone || '+91 98290 12345',
        role: 'member',
        subscriptionStatus: ((m as any).accountLocked ? 'LOCKED' : m.status === 'Active' ? 'ACTIVE' : m.status === 'Expired' ? 'EXPIRED' : 'PENDING'),
        creationDate: (m.joinDate || '2025-01-01').split('T')[0],
        email: m.email,
        accountLocked: Boolean((m as any).accountLocked),
      });
    });

    // 4. Merge direct Firestore `users` documents
    firestoreUsers.forEach(u => {
      const uid = String(u.uid || u.id || '');
      if (!uid) return;
      const existing = map.get(uid);
      const rawStatus = String(
        u.subscription_status ||
        u.subscriptionStatus ||
        (u.account_locked || u.accountLocked ? 'LOCKED' : u.status === 'Active' ? 'ACTIVE' : existing?.subscriptionStatus || 'ACTIVE')
      ).toUpperCase();

      map.set(uid, {
        uid,
        fullName: u.fullName || u.name || existing?.fullName || 'User',
        phone: u.phone || u.phoneNumber || existing?.phone || '+91 98XXXXXXXX',
        role: u.role || existing?.role || 'member',
        subscriptionStatus: rawStatus,
        creationDate: (u.createdAt || u.creationDate || existing?.creationDate || '2025-01-01').split('T')[0],
        email: u.email || existing?.email || '',
        gymName: u.gymName || existing?.gymName,
        accountLocked: Boolean(u.account_locked || u.accountLocked),
      });
    });

    return Array.from(map.values());
  }, [firestoreUsers, members, tenants]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return usersList;
    return usersList.filter(
      u =>
        u.fullName.toLowerCase().includes(term) ||
        u.phone.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term) ||
        u.subscriptionStatus.toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
    );
  }, [usersList, searchTerm]);

  /**
   * 'Force Unlock' button handler:
   * Wrapped with logging middleware to record every Force Unlock action performed by admins,
   * capturing admin UID, target user UID, and timestamp.
   */
  const handleForceUnlock = async (user: FirestoreUserRecord) => {
    setBusyUid(user.uid);
    try {
      const currentAuthUser = auth.currentUser;
      const adminUid = currentAuthUser?.uid || 'owner_primary';
      const adminEmail = currentAuthUser?.email || 'owner@fitnessfuture.in';

      await forceUnlockLoggingMiddleware<boolean>(
        {
          targetUserUid: user.uid,
          targetUserName: user.fullName,
          targetType: user.role === 'admin' ? 'admin' : 'member',
          targetEmail: user.email,
          targetPhone: user.phone,
          adminUid,
          adminEmail,
          previousSubscriptionStatus: user.subscriptionStatus,
          reason: `Force Unlock executed from SuperAdminDashboard user directory`,
        },
        async () => {
          const nowIso = new Date().toISOString();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 30);
          const futureDateStr = futureDate.toISOString().split('T')[0];

          const payload = {
            subscription_status: 'ACTIVE',
            status: 'Active',
            account_locked: false,
            accountLocked: false,
            forceUnlocked: true,
            forceUnlockedAt: nowIso,
            subscription_expiry_date: futureDateStr,
            subscription_expires_at: futureDateStr,
            expiryDate: futureDateStr,
            lastUnlockedBy: adminEmail,
            lastUnlockedByAdminUid: adminUid,
            updatedAt: nowIso,
          };

          // 1. Update Firestore 'users' collection
          await syncToFirebase('users', user.uid, {
            uid: user.uid,
            name: user.fullName,
            phone: user.phone,
            role: user.role,
            ...payload,
          });

          // 2. If member, update 'members' collection and local state
          if (user.role === 'member' || user.uid.startsWith('member_')) {
            const memId = Number(user.uid.replace('member_', ''));
            if (!isNaN(memId)) {
              toggleMemberLock(memId, false);
              const localMem = members.find(m => m.id === memId);
              if (localMem) {
                updateMember({
                  ...localMem,
                  status: 'Active',
                  expiryDate: futureDateStr,
                  accountLocked: false,
                } as any);
              }
              await syncToFirebase('members', String(memId), {
                id: memId,
                ...payload,
              });
            }
          }

          // 3. If admin, update 'tenants' collection and local state
          if (user.role === 'admin' || user.uid.startsWith('admin_')) {
            const tenantId = user.uid.replace('admin_', '');
            toggleAdminLock(tenantId, false);
            updateTenantStatus(tenantId, 'Active');
            await syncToFirebase('tenants', tenantId, {
              gym_id: tenantId,
              id: tenantId,
              ...payload,
            });
          }

          // 4. Update local view state immediately
          setFirestoreUsers(prev => [
            ...prev.filter(d => (d.uid || d.id) !== user.uid),
            { ...user, ...payload },
          ]);

          return true;
        }
      );

      addToast(
        `User "${user.fullName}" [UID: ${user.uid}] force-unlocked by Admin [${adminUid.substring(0, 10)}...]! subscription_status set to ACTIVE.`,
        'success'
      );
    } catch (err: any) {
      console.error('[SuperAdminDashboard] Force unlock error:', err);
      addToast(`Failed to update account status in Firestore: ${err.message || err}`, 'error');
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <div className="p-6 space-y-8 pb-12 bg-black min-h-screen text-gray-100">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-purple-950/40 text-purple-400 border border-purple-500/30 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5">
              <Crown className="w-3 h-3 text-amber-400" /> Super Admin Portal
            </span>
            <span className="px-3 py-1 bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono tracking-widest rounded-md">
              FIRESTORE REAL-TIME
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 uppercase tracking-tight">
            Super Admin Dashboard
          </h1>
          <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mt-1">
            Global Firestore user accounts, subscription state management, and force-unlock gatekeeper
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
          <button
            onClick={handleDownloadLogsCsv}
            disabled={isExportingLogs}
            className="px-5 py-3.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 text-xs font-black uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2 justify-center cursor-pointer disabled:opacity-50"
            title="Download current force_unlock_logs from Firestore into CSV format for archival"
          >
            <Download className={`w-4 h-4 text-emerald-400 ${isExportingLogs ? 'animate-bounce' : ''}`} />
            <span>{isExportingLogs ? 'Archiving CSV...' : 'Download Logs (CSV)'}</span>
          </button>

          <button
            onClick={handleDownloadPdfReport}
            disabled={isExportingPdf}
            className="px-5 py-3.5 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/70 hover:to-blue-900/70 border border-cyan-500/50 text-cyan-200 text-xs font-black uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-lg shadow-cyan-950/30 flex items-center gap-2 justify-center cursor-pointer disabled:opacity-50"
            title="Generate a professional PDF summary report of force_unlock_logs for compliance documentation using jsPDF"
          >
            <FileDown className={`w-4 h-4 text-cyan-400 ${isExportingPdf ? 'animate-spin' : ''}`} />
            <span>{isExportingPdf ? 'Generating PDF...' : 'PDF Report'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/90 border border-zinc-800 p-2.5 rounded-3xl shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>All Users & Force Unlock</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'audit_logs'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
                : 'bg-zinc-900 text-amber-300 hover:text-amber-200 border border-amber-500/30'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Audit Logs</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold text-amber-200 border border-amber-400/30">
              force_unlock_logs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'roles'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/40'
                : 'bg-zinc-900 text-purple-300 hover:text-white border border-purple-500/30'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Admin Roles</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold text-purple-200 border border-purple-400/30">
              RBAC
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px] font-mono text-zinc-400 hidden sm:flex items-center gap-2 px-3">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Firestore: force_unlock_logs</span>
          </div>

          <button
            onClick={handleDownloadLogsCsv}
            disabled={isExportingLogs}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV Archive"
          >
            <Download className={`w-3.5 h-3.5 text-emerald-400 ${isExportingLogs ? 'animate-bounce' : ''}`} />
            <span>{isExportingLogs ? 'Archiving...' : 'Download CSV'}</span>
          </button>

          <button
            onClick={handleDownloadPdfReport}
            disabled={isExportingPdf}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Generate PDF Compliance Report"
          >
            <FileDown className={`w-3.5 h-3.5 text-cyan-400 ${isExportingPdf ? 'animate-spin' : ''}`} />
            <span>{isExportingPdf ? 'PDF...' : 'PDF Report'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'audit_logs' ? (
        <ForceUnlockAuditLogsTab setCurrentView={setCurrentView} />
      ) : activeTab === 'roles' ? (
        <AdminRoleManagement setCurrentView={setCurrentView} />
      ) : (
        <>
          {/* Admin Stats Widget: Recharts Line Chart */}
          <AdminStatsWidget onOpenAuditLogs={() => setActiveTab('audit_logs')} />

          {/* Firestore Users Directory Table Section */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 lg:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white italic tracking-tight uppercase">
                  All Users Directory (Firestore)
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  REAL-TIME SYNC
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Displays all platform users retrieved directly from Firestore. Use the Force Unlock button to restore access and set subscription_status to ACTIVE.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, role..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* The Table displaying columns: Full Name, Phone, Role, Subscription Status, Creation Date, Action with 'Force Unlock' button */}
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-black/70">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="py-4 px-5">Full Name</th>
                <th className="py-4 px-5">Phone</th>
                <th className="py-4 px-5">Role</th>
                <th className="py-4 px-5">Subscription Status</th>
                <th className="py-4 px-5">Creation Date</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredUsers.map((user) => {
                const isBusy = busyUid === user.uid;
                const isUnlocked = user.subscriptionStatus === 'ACTIVE';

                return (
                  <tr key={user.uid} className="hover:bg-white/[0.02] transition-colors">
                    {/* 1. Full Name */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border bg-cyan-500/20 border-cyan-500/40 text-cyan-300">
                          {user.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{user.fullName}</div>
                          {user.email && (
                            <div className="text-[11px] text-gray-400 font-mono">{user.email}</div>
                          )}
                          <div className="text-[10px] text-gray-500 font-mono">UID: {user.uid}</div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Phone */}
                    <td className="py-4 px-5 font-mono text-xs text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{user.phone}</span>
                      </div>
                    </td>

                    {/* 3. Role */}
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-purple-500/20 text-purple-300 border-purple-500/40">
                        {user.role === 'super_admin' && <Crown className="w-3 h-3 text-amber-400" />}
                        {user.role}
                      </span>
                    </td>

                    {/* 4. Subscription Status */}
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          isUnlocked
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : user.subscriptionStatus === 'LOCKED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isUnlocked ? (
                          <>
                            <Unlock className="w-3 h-3" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" /> {user.subscriptionStatus}
                          </>
                        )}
                      </span>
                    </td>

                    {/* 5. Creation Date */}
                    <td className="py-4 px-5 font-mono text-xs text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{user.creationDate}</span>
                      </div>
                    </td>

                    {/* 6. Action Column with 'Force Unlock' Button */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleForceUnlock(user)}
                        disabled={isBusy}
                        className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black text-[11px] font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] flex items-center gap-1.5 ml-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Force-Unlock this account in Firestore and set subscription_status to ACTIVE"
                      >
                        <Zap className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                        <span>{isBusy ? 'Unlocking...' : 'Force Unlock'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
export { SuperAdminFirestoreUsersPanel } from './admin/SuperAdminFirestoreUsersPanel';
export { SubscriptionOverview } from './admin/SubscriptionOverview';
export { AdminActivityLog } from './admin/AdminActivityLog';
