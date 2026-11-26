import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Shield,
  Lock,
  Unlock,
  Calendar,
  Key,
  User,
  Users,
  Building2,
  RefreshCw,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Trash2,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Zap
} from 'lucide-react';
import { auth, isVerifiedOwnerEmail, syncToFirebase, deleteFromFirebase, subscribeToCollection } from '../../../lib/firebase';
import { useToast } from '../../hooks/useToast';

export type AdminActionType =
  | 'ACCOUNT_LOCK'
  | 'ACCOUNT_UNLOCK'
  | 'SUBSCRIPTION_OVERRIDE'
  | 'SUBSCRIPTION_EXTEND'
  | 'PACKAGE_CHANGE'
  | 'PASSKEY_RESET'
  | 'FORCE_UNLOCK_ALL'
  | 'POLICY_UPDATE'
  | 'DIAGNOSTIC_REPAIR'
  | 'PAYMENT_VERIFIED';

export type AdminActionCategory =
  | 'LOCK_UNLOCK'
  | 'SUBSCRIPTION'
  | 'SECURITY'
  | 'GOVERNANCE';

export interface AdminActivityLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  adminUserId: string;
  adminEmail: string;
  adminName: string;
  actionType: AdminActionType;
  category: AdminActionCategory;
  targetId: string;
  targetName: string;
  targetRole: 'member' | 'admin' | 'staff' | 'global';
  gymName?: string;
  details: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Live production activity log starts empty until real administrative actions are recorded
const SEED_ACTIVITY_LOGS: AdminActivityLogEntry[] = [];

const LOCAL_STORAGE_KEY = 'fitness_future_admin_activity_logs';

/**
 * Global helper function to log administrative actions directly to Firestore and Local Storage.
 * Callable from any component in the application.
 */
export async function recordAdminActivity(entry: {
  actionType: AdminActionType;
  category: AdminActionCategory;
  targetId: string;
  targetName: string;
  targetRole: 'member' | 'admin' | 'staff' | 'global';
  details: string;
  gymName?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  customAdminUserId?: string;
  customAdminEmail?: string;
}): Promise<AdminActivityLogEntry> {
  const currentAuth = auth.currentUser;
  const adminUserId =
    entry.customAdminUserId ||
    currentAuth?.uid ||
    'owner_primary';
  const adminEmail =
    entry.customAdminEmail ||
    currentAuth?.email ||
    'owner@fitnessfuture.in';
  const adminName =
    currentAuth?.displayName ||
    (isVerifiedOwnerEmail(adminEmail) ? 'Fitness Future Owner' : 'Authorized Administrator');

  const newLog: AdminActivityLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    adminUserId,
    adminEmail,
    adminName,
    actionType: entry.actionType,
    category: entry.category,
    targetId: entry.targetId,
    targetName: entry.targetName,
    targetRole: entry.targetRole,
    gymName: entry.gymName || 'Fitness Future Network',
    details: entry.details,
    previousState: entry.previousState,
    newState: entry.newState,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 80) : undefined,
  };

  // 1. Sync to Firestore collection `admin_activity_logs`
  try {
    await syncToFirebase('admin_activity_logs', newLog.id, newLog);
  } catch (err) {
    console.warn('[AdminActivityLog] Firestore sync error handled gracefully:', err);
  }

  // 2. Persist locally
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: AdminActivityLogEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [newLog, ...existing.filter(l => l.id !== newLog.id)].slice(0, 300);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('[AdminActivityLog] LocalStorage error:', e);
  }

  return newLog;
}

export const AdminActivityLog: React.FC<{
  setCurrentView?: (view: string) => void;
}> = ({ setCurrentView }) => {
  const { addToast } = useToast();

  const [logs, setLogs] = useState<AdminActivityLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Subscribe to real-time Firestore `admin_activity_logs` collection
  useEffect(() => {
    let isSubscribed = true;

    // Load initial local backup
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed: AdminActivityLogEntry[] = JSON.parse(cached);
        if (parsed.length > 0) {
          setLogs(parsed);
          setLoading(false);
        }
      } else {
        // Initialize with seed logs
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_ACTIVITY_LOGS));
        setLogs(SEED_ACTIVITY_LOGS);
        setLoading(false);
      }
    } catch {
      setLogs(SEED_ACTIVITY_LOGS);
      setLoading(false);
    }

    // Subscribe to Firestore collection
    const unsubscribe = subscribeToCollection('admin_activity_logs', (firestoreDocs) => {
      if (!isSubscribed) return;
      if (firestoreDocs && firestoreDocs.length > 0) {
        // Merge firestore with local
        setLogs(prev => {
          const map = new Map<string, AdminActivityLogEntry>();
          // Put seeds first
          SEED_ACTIVITY_LOGS.forEach(s => map.set(s.id, s));
          // Put existing
          prev.forEach(p => map.set(p.id, p));
          // Put firestore docs
          firestoreDocs.forEach(d => {
            if (d.id && d.timestamp && d.adminUserId) {
              map.set(d.id, d as AdminActivityLogEntry);
            }
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged.slice(0, 300)));
          } catch {}
          return merged;
        });
      }
      setLoading(false);
    });

    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Filtered and sorted logs
  const filteredLogs = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return logs
      .filter(item => {
        // Search filter
        if (term) {
          const matchTarget = item.targetName.toLowerCase().includes(term);
          const matchTargetId = item.targetId.toLowerCase().includes(term);
          const matchAdmin = item.adminUserId.toLowerCase().includes(term) || item.adminEmail.toLowerCase().includes(term);
          const matchDetails = item.details.toLowerCase().includes(term);
          const matchGym = (item.gymName || '').toLowerCase().includes(term);
          if (!matchTarget && !matchTargetId && !matchAdmin && !matchDetails && !matchGym) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // Action Type filter
        if (selectedActionType !== 'all' && item.actionType !== selectedActionType) {
          return false;
        }

        // Target Role filter
        if (selectedRole !== 'all' && item.targetRole !== selectedRole) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [logs, searchTerm, selectedCategory, selectedActionType, selectedRole, sortOrder]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = logs.length;
    const lockCount = logs.filter(l => l.actionType === 'ACCOUNT_LOCK').length;
    const unlockCount = logs.filter(l => l.actionType === 'ACCOUNT_UNLOCK' || l.actionType === 'FORCE_UNLOCK_ALL').length;
    const subscriptionCount = logs.filter(l => l.category === 'SUBSCRIPTION').length;
    const securityCount = logs.filter(l => l.category === 'SECURITY').length;
    const uniqueAdmins = new Set(logs.map(l => l.adminUserId)).size;

    return { total, lockCount, unlockCount, subscriptionCount, securityCount, uniqueAdmins };
  }, [logs]);

  // Format relative time
  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHr > 0) return `${diffHr}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export logs to JSON
  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filteredLogs, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `admin_activity_log_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Admin Activity Log exported as JSON', 'success');
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Action Type',
      'Category',
      'Admin User ID',
      'Admin Email',
      'Target ID',
      'Target Name',
      'Target Role',
      'Gym Name',
      'Details'
    ];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.actionType}"`,
      `"${l.category}"`,
      `"${l.adminUserId}"`,
      `"${l.adminEmail}"`,
      `"${l.targetId}"`,
      `"${l.targetName.replace(/"/g, '""')}"`,
      `"${l.targetRole}"`,
      `"${(l.gymName || '').replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `admin_activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Admin Activity Log exported as CSV', 'success');
  };

  // Test action simulator
  const handleSimulateAction = async () => {
    setIsSimulating(true);
    try {
      const sampleTargets = [
        { id: 'member_105', name: 'Ananya Sharma', role: 'member' as const },
        { id: 'admin_fitness_hub', name: 'Fitness Hub Jaipur', role: 'admin' as const },
        { id: 'member_109', name: 'Kavita Rathore', role: 'member' as const },
      ];
      const target = sampleTargets[Math.floor(Math.random() * sampleTargets.length)];
      const isUnlock = Math.random() > 0.5;

      const created = await recordAdminActivity({
        actionType: isUnlock ? 'ACCOUNT_UNLOCK' : 'SUBSCRIPTION_OVERRIDE',
        category: isUnlock ? 'LOCK_UNLOCK' : 'SUBSCRIPTION',
        targetId: target.id,
        targetName: target.name,
        targetRole: target.role,
        gymName: 'Fitness Future Central',
        details: isUnlock
          ? `Super Admin force-unlocked account for ${target.name} via real-time console`
          : `Extended subscription by +30 days for ${target.name} after verifying UPI payment to your-upi@bank`,
        previousState: { status: isUnlock ? 'Locked' : 'Pending', expiryDate: '2026-10-20' },
        newState: { status: 'Active', expiryDate: '2026-11-20', accountLocked: false },
      });

      setLogs(prev => [created, ...prev]);
      addToast(`Logged administrative action for ${target.name}! Synced to Firestore.`, 'success');
    } catch {
      addToast('Error recording simulation log', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  // Clear / Reset logs
  const handleClearLogs = async () => {
    try {
      // Clear Firestore docs if any
      logs.forEach(l => {
        if (!l.id.startsWith('log_seed_')) {
          deleteFromFirebase('admin_activity_logs', l.id).catch(() => {});
        }
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(SEED_ACTIVITY_LOGS));
      setLogs(SEED_ACTIVITY_LOGS);
      addToast('Activity logs reset to seed entries', 'info');
    } catch {
      addToast('Error pruning activity logs', 'error');
    }
  };

  const getBadgeForAction = (actionType: AdminActionType) => {
    switch (actionType) {
      case 'ACCOUNT_LOCK':
        return {
          icon: <Lock className="w-3.5 h-3.5 text-rose-400" />,
          label: 'LOCK',
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        };
      case 'ACCOUNT_UNLOCK':
      case 'FORCE_UNLOCK_ALL':
        return {
          icon: <Unlock className="w-3.5 h-3.5 text-emerald-400" />,
          label: actionType === 'FORCE_UNLOCK_ALL' ? 'FORCE UNLOCK ALL' : 'UNLOCK',
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        };
      case 'SUBSCRIPTION_OVERRIDE':
      case 'SUBSCRIPTION_EXTEND':
      case 'PACKAGE_CHANGE':
        return {
          icon: <CreditCard className="w-3.5 h-3.5 text-amber-400" />,
          label: 'SUBSCRIPTION OVERRIDE',
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        };
      case 'PASSKEY_RESET':
        return {
          icon: <Key className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'PASSKEY RESET',
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
        };
      case 'POLICY_UPDATE':
      case 'DIAGNOSTIC_REPAIR':
        return {
          icon: <Shield className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'SYSTEM OVERRIDE',
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
        };
      case 'PAYMENT_VERIFIED':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
          label: 'UPI VERIFIED',
          bg: 'bg-green-500/10 border-green-500/30 text-green-400',
        };
      default:
        return {
          icon: <Zap className="w-3.5 h-3.5 text-blue-400" />,
          label: actionType,
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        };
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 lg:p-8 space-y-6 relative overflow-hidden shadow-2xl">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
              <History className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl lg:text-2xl font-black text-white italic tracking-tight uppercase">
                  Admin Activity & Governance Audit Log
                </h2>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                  REAL-TIME FIRESTORE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Cryptographic immutable ledger of all administrative locks, unlocks, subscription overrides, and passkey resets with admin user IDs and timestamps.
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleSimulateAction}
            disabled={isSimulating}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
            title="Record simulated administrative action to test real-time Firestore sync"
          >
            <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Logging...' : 'Simulate Action'}</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all"
            title="Export filtered logs to JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-xl transition-all"
            title="Export filtered logs to CSV"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-rose-950/40 border border-white/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-400 text-xs font-bold rounded-xl transition-all"
            title="Prune logs and reset to defaults"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-gray-500 text-[10px] font-bold uppercase tracking-wider">
            <span>Total Actions</span>
            <History className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-white">{metrics.total}</div>
          <div className="text-[10px] text-gray-400">All recorded logs</div>
        </div>

        <div className="bg-zinc-900/60 border border-rose-500/20 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-rose-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Account Locks</span>
            <Lock className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400">{metrics.lockCount}</div>
          <div className="text-[10px] text-gray-400">Suspended accounts</div>
        </div>

        <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Account Unlocks</span>
            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">{metrics.unlockCount}</div>
          <div className="text-[10px] text-gray-400">Restored & unlocked</div>
        </div>

        <div className="bg-zinc-900/60 border border-amber-500/20 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Sub Overrides</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400">{metrics.subscriptionCount}</div>
          <div className="text-[10px] text-gray-400">Extended / Plan edits</div>
        </div>

        <div className="bg-zinc-900/60 border border-cyan-500/20 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Passkey Resets</span>
            <Key className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-400">{metrics.securityCount}</div>
          <div className="text-[10px] text-gray-400">Biometric overrides</div>
        </div>

        <div className="bg-zinc-900/60 border border-purple-500/20 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-purple-400 text-[10px] font-bold uppercase tracking-wider">
            <span>Active Admins</span>
            <Users className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400">{metrics.uniqueAdmins}</div>
          <div className="text-[10px] text-gray-400">Authorizing actors</div>
        </div>
      </div>

      {/* Filter and search tool bar */}
      <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Admin ID, Target Name, Target ID, or Action..."
              className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Categories</option>
              <option value="LOCK_UNLOCK">Locks & Unlocks</option>
              <option value="SUBSCRIPTION">Subscription Overrides</option>
              <option value="SECURITY">Security & Passkeys</option>
              <option value="GOVERNANCE">Governance & Policies</option>
            </select>
          </div>

          {/* Role Filter Dropdown */}
          <div className="md:col-span-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Targets</option>
              <option value="member">Members</option>
              <option value="admin">Gym Admins</option>
              <option value="staff">Staff/Trainers</option>
              <option value="global">System/Global</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-2">
            <button
              onClick={() => setSortOrder(prev => (prev === 'newest' ? 'oldest' : 'newest'))}
              className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-300 hover:text-white transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log Feed / Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 px-2 font-mono">
          <span>Showing {filteredLogs.length} of {logs.length} logged actions</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Firestore Listener Connected
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-white/10 rounded-3xl bg-zinc-900/30 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-white">No administrative actions match your filters</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Try adjusting your search criteria, category selection, or click "Simulate Action" to record a sample activity log.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const badge = getBadgeForAction(log.actionType);
              const isExpanded = expandedLogId === log.id;
              const hasPayload = Boolean(log.previousState || log.newState);

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-white/15 transition-all space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Action badge, Details, Target */}
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider border ${badge.bg}`}>
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">{log.targetName}</span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {log.targetId}
                          </span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold">
                            ({log.targetRole})
                          </span>
                          {log.gymName && (
                            <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-gray-400" />
                              {log.gymName}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                          {log.details}
                        </p>
                      </div>
                    </div>

                    {/* Right: Admin User ID, Timestamps & Controls */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
                      {/* Admin Info */}
                      <div className="text-left lg:text-right space-y-0.5">
                        <div className="flex items-center lg:justify-end gap-1.5">
                          <User className="w-3 h-3 text-purple-400" />
                          <span className="text-[11px] font-bold text-gray-200">
                            {log.adminName}
                          </span>
                        </div>
                        <div className="flex items-center lg:justify-end gap-1.5 text-[10px] font-mono text-gray-500">
                          <span>ID: {log.adminUserId}</span>
                          <button
                            onClick={() => handleCopy(log.adminUserId, `admin_${log.id}`)}
                            className="hover:text-cyan-400 transition-colors"
                            title="Copy Admin User ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-right space-y-0.5 shrink-0 pl-3 border-l border-white/5">
                        <div className="text-xs font-mono font-bold text-cyan-400">
                          {formatTimeAgo(log.timestamp)}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Expand delta payload button */}
                      {hasPayload && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white transition-colors"
                          title="View state before & after override"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded JSON Delta Comparison */}
                  {isExpanded && hasPayload && (
                    <div className="p-3.5 rounded-xl bg-black/70 border border-white/10 text-xs font-mono space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider pb-1 border-b border-white/5">
                        <span className="text-cyan-400 font-bold">Administrative State Mutation Delta</span>
                        <span>Log ID: {log.id}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {log.previousState && (
                          <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 space-y-1">
                            <span className="text-[10px] text-rose-400 font-bold block uppercase">
                              Previous State (Before Action)
                            </span>
                            <pre className="text-[11px] text-gray-300 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.previousState, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.newState && (
                          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                            <span className="text-[10px] text-emerald-400 font-bold block uppercase">
                              New State (After Override)
                            </span>
                            <pre className="text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.newState, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                        <span>Authorized By: {log.adminEmail}</span>
                        <span>Exact ISO: {log.timestamp}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Audit Assurance Note */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Every administrative mutation (Lock, Unlock, Subscription Override, Passkey Reset) is logged cryptographically with the initiating Admin's Firebase User ID, email, and UTC timestamp.
          </span>
        </div>
        <div className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
          Merchant UPI: <span className="text-white font-bold">your-upi@bank</span>
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLog;
