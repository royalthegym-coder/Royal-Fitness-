import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowDownUp,
  Download,
  Copy,
  Check,
  FileText,
  FileDown,
  ChevronDown,
  ChevronUp,
  Terminal,
  User,
  Users,
  Filter,
  Sparkles,
  Zap,
  Info,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { db, syncToFirebase, subscribeToCollection, auth } from '../../../lib/firebase';
import { useToast } from '../../hooks/useToast';
import { downloadForceUnlockLogsCsv } from '../../exportForceUnlockLogs';
import { generateAuditReportPdf } from '../../exportAuditReportPdf';

export interface ForceUnlockLogEntry {
  id: string;
  action: 'FORCE_UNLOCK' | string;
  adminUid: string;
  adminEmail: string;
  adminName: string;
  targetUserUid: string;
  targetUserName: string;
  targetType: 'member' | 'admin' | 'trainer' | string;
  targetEmail?: string;
  targetPhone?: string;
  timestamp: string; // ISO 8601 UTC timestamp
  timestampMs?: number;
  durationMs?: number;
  status: 'SUCCESS' | 'FAILED';
  details: string;
  previousSubscriptionStatus?: string;
  newSubscriptionStatus: string;
  error?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

// Live production audit trail starts empty until real force-unlock actions occur in Firestore
const SEED_FORCE_UNLOCK_LOGS: ForceUnlockLogEntry[] = [];

export const ForceUnlockAuditLogsTab: React.FC<{
  setCurrentView?: (view: string) => void;
}> = ({ setCurrentView }) => {
  const { addToast } = useToast();

  const [rawLogs, setRawLogs] = useState<ForceUnlockLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchField, setSearchField] = useState<'all' | 'adminUid' | 'targetUid' | 'actionDescription'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'member' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SUCCESS' | 'FAILED'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedLogPayload, setSelectedLogPayload] = useState<ForceUnlockLogEntry | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Subscribe to 'force_unlock_logs' collection from Firestore in real-time
  useEffect(() => {
    let isMounted = true;

    // 1. Listen to 'force_unlock_logs'
    const unsubPrimary = subscribeToCollection('force_unlock_logs', (docs) => {
      if (!isMounted) return;
      if (docs && docs.length > 0) {
        setRawLogs((prev) => {
          const map = new Map<string, ForceUnlockLogEntry>();
          // Preserve seed logs
          SEED_FORCE_UNLOCK_LOGS.forEach((s) => map.set(s.id, s));
          // Merge prior
          prev.forEach((p) => map.set(p.id, p));
          // Merge fresh Firestore docs
          docs.forEach((d: any) => {
            const entry: ForceUnlockLogEntry = {
              id: d.id || `log_${Math.random().toString(36).substring(2, 8)}`,
              action: d.action || 'FORCE_UNLOCK',
              adminUid: d.adminUid || d.adminUserId || auth.currentUser?.uid || 'owner_primary',
              adminEmail: d.adminEmail || auth.currentUser?.email || 'owner@fitnessfuture.in',
              adminName: d.adminName || 'Owner Console',
              targetUserUid: d.targetUserUid || d.targetId || 'unknown_target',
              targetUserName: d.targetUserName || d.targetName || 'User',
              targetType: d.targetType || (String(d.targetUserUid || '').startsWith('admin_') ? 'admin' : 'member'),
              targetEmail: d.targetEmail,
              targetPhone: d.targetPhone,
              timestamp: d.timestamp || new Date().toISOString(),
              timestampMs: d.timestampMs || (d.timestamp ? new Date(d.timestamp).getTime() : Date.now()),
              durationMs: d.durationMs || 120,
              status: (d.status === 'FAILED' ? 'FAILED' : 'SUCCESS'),
              details: d.details || 'Force unlock executed by Super Admin in Firestore.',
              previousSubscriptionStatus: d.previousSubscriptionStatus || d.previousState?.subscription_status || 'LOCKED',
              newSubscriptionStatus: d.newSubscriptionStatus || d.newState?.subscription_status || 'ACTIVE',
              error: d.error,
              metadata: d.metadata,
            };
            map.set(entry.id, entry);
          });
          return Array.from(map.values());
        });
      }
      setLoading(false);
    });

    // 2. Also listen to mirror 'force_unlock_audit_logs' collection for complete consistency
    const unsubMirror = subscribeToCollection('force_unlock_audit_logs', (docs) => {
      if (!isMounted) return;
      if (docs && docs.length > 0) {
        setRawLogs((prev) => {
          const map = new Map<string, ForceUnlockLogEntry>();
          prev.forEach((p) => map.set(p.id, p));
          docs.forEach((d: any) => {
            if (!map.has(d.id)) {
              map.set(d.id, {
                id: d.id,
                action: d.action || 'FORCE_UNLOCK',
                adminUid: d.adminUid || auth.currentUser?.uid || 'owner_primary',
                adminEmail: d.adminEmail || auth.currentUser?.email || 'owner@fitnessfuture.in',
                adminName: d.adminName || 'Owner Console',
                targetUserUid: d.targetUserUid || 'unknown_target',
                targetUserName: d.targetUserName || 'User',
                targetType: d.targetType || 'member',
                targetEmail: d.targetEmail,
                targetPhone: d.targetPhone,
                timestamp: d.timestamp || new Date().toISOString(),
                timestampMs: d.timestampMs || Date.now(),
                durationMs: d.durationMs || 100,
                status: d.status || 'SUCCESS',
                details: d.details || 'Force unlock audit entry',
                previousSubscriptionStatus: d.previousSubscriptionStatus || 'LOCKED',
                newSubscriptionStatus: d.newSubscriptionStatus || 'ACTIVE',
                error: d.error,
                metadata: d.metadata,
              });
            }
          });
          return Array.from(map.values());
        });
      }
    });

    // Initial check: if no docs arrived after 400ms, populate seed logs
    const timer = setTimeout(() => {
      if (isMounted) {
        setRawLogs((current) => (current.length === 0 ? SEED_FORCE_UNLOCK_LOGS : current));
        setLoading(false);
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (typeof unsubPrimary === 'function') unsubPrimary();
      if (typeof unsubMirror === 'function') unsubMirror();
    };
  }, []);

  // Helper function to visually highlight matching search terms in the table
  const highlightMatch = (text: string | undefined | null, query: string): React.ReactNode => {
    if (!text) return '';
    if (!query || query.trim() === '') return text;
    const q = query.trim();
    const escaped = q.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-cyan-500/30 text-cyan-200 px-0.5 rounded border border-cyan-500/40 font-semibold"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Filtered and Chronologically Sorted logs
  const chronologicalLogs = useMemo(() => {
    let list = [...rawLogs];

    // Filter by search query (Admin UID, Target User UID, or specific Action Description)
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter((log) => {
        const matchAdminUid = log.adminUid.toLowerCase().includes(term);
        const matchAdminName = (log.adminName || '').toLowerCase().includes(term);
        const matchAdminEmail = (log.adminEmail || '').toLowerCase().includes(term);
        const matchTargetUid = log.targetUserUid.toLowerCase().includes(term);
        const matchTargetName = (log.targetUserName || '').toLowerCase().includes(term);
        const matchTargetEmail = (log.targetEmail || '').toLowerCase().includes(term);
        const matchAction = (log.action || '').toLowerCase().includes(term);
        const matchDetails = (log.details || '').toLowerCase().includes(term);
        const matchReason = (log.metadata?.reason || '').toLowerCase().includes(term);

        if (searchField === 'adminUid') {
          return matchAdminUid || matchAdminName || matchAdminEmail;
        }
        if (searchField === 'targetUid') {
          return matchTargetUid || matchTargetName || matchTargetEmail;
        }
        if (searchField === 'actionDescription') {
          return matchAction || matchDetails || matchReason;
        }

        // 'all': matches Admin UID, target User UID, or specific action description
        return (
          matchAdminUid ||
          matchAdminName ||
          matchAdminEmail ||
          matchTargetUid ||
          matchTargetName ||
          matchTargetEmail ||
          matchAction ||
          matchDetails ||
          matchReason
        );
      });
    }

    // Filter by role
    if (roleFilter !== 'all') {
      list = list.filter((log) => log.targetType.toLowerCase() === roleFilter.toLowerCase());
    }

    // Filter by status
    if (statusFilter !== 'all') {
      list = list.filter((log) => log.status === statusFilter);
    }

    // Chronological sort
    list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [rawLogs, searchTerm, searchField, roleFilter, statusFilter, sortOrder]);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    addToast(`Copied ${text} to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(chronologicalLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `force_unlock_audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast(`Exported ${chronologicalLogs.length} audit logs as JSON!`, 'success');
  };

  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  /**
   * Downloads 'force_unlock_logs' Firestore data into CSV format for archival purposes.
   */
  const handleExportCsv = async () => {
    setIsExportingCsv(true);
    try {
      const res = await downloadForceUnlockLogsCsv(chronologicalLogs);
      addToast(
        `Archived ${res.count} records from 'force_unlock_logs' into "${res.filename}"!`,
        'success'
      );
    } catch (err: any) {
      console.error('Export CSV error:', err);
      addToast('Failed to export force_unlock_logs to CSV.', 'error');
    } finally {
      setIsExportingCsv(false);
    }
  };

  /**
   * Generates a professional, formatted PDF summary report of filtered logs for compliance documentation using jsPDF.
   */
  const handleGeneratePdfReport = async () => {
    if (chronologicalLogs.length === 0) {
      addToast('No audit logs available matching current filter to export as PDF.', 'info');
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const operatorEmail = auth.currentUser?.email || 'owner@fitnessfuture.in';
      const operatorName = auth.currentUser?.displayName || 'Fitness Future Owner';
      const res = await generateAuditReportPdf(chronologicalLogs, {
        searchTerm,
        searchField,
        roleFilter,
        statusFilter,
        generatedBy: `${operatorName} <${operatorEmail}>`,
        gymName: 'Fitness Future Central HQ'
      });
      addToast(`Generated compliance PDF report for ${res.count} filtered audit logs ("${res.filename}")!`, 'success');
    } catch (err: any) {
      console.error('Failed to generate PDF audit report:', err);
      addToast('Failed to generate compliance PDF report.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Helper to record a verified Force Unlock test audit entry into Firestore
  const handleSimulateLog = async () => {
    setIsSimulating(true);
    try {
      const now = new Date();
      const mockId = `unlock_audit_${Date.now()}`;
      const mockAdminUid = auth.currentUser?.uid || 'owner_primary';
      const mockAdminEmail = auth.currentUser?.email || 'owner@fitnessfuture.in';
      const mockTargetUid = `member_${Math.floor(100 + Math.random() * 900)}`;

      const newRecord: ForceUnlockLogEntry = {
        id: mockId,
        action: 'FORCE_UNLOCK',
        adminUid: mockAdminUid,
        adminEmail: mockAdminEmail,
        adminName: 'Fitness Future Super Admin (Super Admin)',
        targetUserUid: mockTargetUid,
        targetUserName: `Member #${mockTargetUid.replace('member_', '')}`,
        targetType: 'member',
        timestamp: now.toISOString(),
        timestampMs: now.getTime(),
        durationMs: Math.floor(80 + Math.random() * 120),
        status: 'SUCCESS',
        details: `Simulated Force Unlock: subscription_status set to 'ACTIVE' in Firestore 'force_unlock_logs' collection.`,
        previousSubscriptionStatus: 'LOCKED',
        newSubscriptionStatus: 'ACTIVE',
        metadata: { source: 'Live Audit Log Simulator' },
      };

      await syncToFirebase('force_unlock_logs', mockId, newRecord);
      await syncToFirebase('force_unlock_audit_logs', mockId, newRecord);

      setRawLogs((prev) => [newRecord, ...prev]);
      addToast(`New Force Unlock log recorded in Firestore 'force_unlock_logs'!`, 'success');
    } catch (err: any) {
      console.error('Simulation error:', err);
      addToast('Failed to write simulation log to Firestore.', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return isoString;
      return date.toLocaleString('en-IN', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return `${Math.max(1, diffSecs)}s ago`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Audit Metrics */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5">
                <History className="w-3 h-3" /> Firestore Audit Trail
              </span>
              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[9px] font-mono tracking-widest rounded-md">
                collection: force_unlock_logs
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
              Force Unlock Audit Logs
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Chronological immutable ledger capturing every <strong>Force Unlock</strong> action performed by administrators in Firestore. Records admin UID, target user UID, timestamp, and previous/new subscription status.
            </p>
          </div>

          {/* Quick Metrics & Actions Deck */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider block">Total Logs</span>
              <span className="text-xl font-mono font-black text-cyan-300">{chronologicalLogs.length}</span>
            </div>

            <button
              onClick={handleSimulateLog}
              disabled={isSimulating}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50"
              title="Test log entry into Firestore"
            >
              <Zap className={`w-4 h-4 text-amber-400 ${isSimulating ? 'animate-bounce' : ''}`} />
              <span>{isSimulating ? 'Logging...' : 'Log Test Unlock'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExportingCsv}
              className="px-4 py-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              title="Download force_unlock_logs from Firestore as CSV for archival"
            >
              <Download className={`w-4 h-4 text-emerald-400 ${isExportingCsv ? 'animate-bounce' : ''}`} />
              <span>{isExportingCsv ? 'Archiving CSV...' : 'Download Logs (CSV)'}</span>
            </button>

            <button
              onClick={handleGeneratePdfReport}
              disabled={isGeneratingPdf}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/70 hover:to-blue-900/70 border border-cyan-500/50 text-cyan-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/40 disabled:opacity-50"
              title="Generate a formatted PDF summary report of filtered logs for compliance documentation using jsPDF"
            >
              <FileDown className={`w-4 h-4 text-cyan-400 ${isGeneratingPdf ? 'animate-spin' : ''}`} />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'PDF Report'}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                A4
              </span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              title="Download JSON Logs"
            >
              <FileText className="w-4 h-4 text-zinc-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Search, Filter & Sort Toolbar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Main Search Bar */}
          <div className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  searchField === 'adminUid'
                    ? 'Filter by Admin UID (e.g. usr_super_fitness_future)...'
                    : searchField === 'targetUid'
                    ? 'Filter by target User UID (e.g. member_104, admin_sikar)...'
                    : searchField === 'actionDescription'
                    ? 'Filter by action description (e.g. Force Unlock, +30 days, cash settlement)...'
                    : 'Search logs by Admin UID, target User UID, or specific action description...'
                }
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-2xl pl-10 pr-28 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
              />
              <div className="absolute right-2.5 flex items-center gap-1.5">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-400 hidden sm:inline-block">
                  {chronologicalLogs.length} found
                </span>
              </div>
            </div>
          </div>

          {/* Search Scope Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl">
            <button
              onClick={() => setSearchField('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                searchField === 'all'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Fields
            </button>
            <button
              onClick={() => setSearchField('adminUid')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                searchField === 'adminUid'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Admin UID
            </button>
            <button
              onClick={() => setSearchField('targetUid')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                searchField === 'targetUid'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Target User UID
            </button>
            <button
              onClick={() => setSearchField('actionDescription')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                searchField === 'actionDescription'
                  ? 'bg-purple-500 text-black shadow-md shadow-purple-500/20'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Action Description
            </button>
          </div>

          {/* Role, Status & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5 justify-end">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400 text-[11px]">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">All Roles</option>
                <option value="member" className="bg-zinc-900">Members</option>
                <option value="admin" className="bg-zinc-900">Franchise Admins</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl text-xs">
              <span className="text-zinc-400 text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">All Statuses</option>
                <option value="SUCCESS" className="bg-zinc-900">Success</option>
                <option value="FAILED" className="bg-zinc-900">Failed</option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-cyan-300 font-semibold transition-colors cursor-pointer"
              title="Toggle chronological order"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
            </button>
          </div>
        </div>

        {/* Quick Suggestion Search Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900 text-[11px]">
          <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" /> Filter presets:
          </span>
          <button
            onClick={() => {
              setSearchField('adminUid');
              setSearchTerm('usr_super_fitness_future');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-amber-500/10 hover:border-amber-500/40 border border-zinc-800 text-zinc-300 hover:text-amber-300 font-mono text-[10px] transition-colors cursor-pointer"
          >
            Admin UID: usr_super_fitness_future
          </button>
          <button
            onClick={() => {
              setSearchField('targetUid');
              setSearchTerm('member_104');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-cyan-500/10 hover:border-cyan-500/40 border border-zinc-800 text-zinc-300 hover:text-cyan-300 font-mono text-[10px] transition-colors cursor-pointer"
          >
            Target UID: member_104
          </button>
          <button
            onClick={() => {
              setSearchField('targetUid');
              setSearchTerm('admin_central_sikar');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-purple-500/10 hover:border-purple-500/40 border border-zinc-800 text-zinc-300 hover:text-purple-300 font-mono text-[10px] transition-colors cursor-pointer"
          >
            Target UID: admin_central_sikar
          </button>
          <button
            onClick={() => {
              setSearchField('actionDescription');
              setSearchTerm('Force Unlock');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 border border-zinc-800 text-zinc-300 hover:text-emerald-300 font-mono text-[10px] transition-colors cursor-pointer"
          >
            Action: "Force Unlock"
          </button>
          <button
            onClick={() => {
              setSearchField('actionDescription');
              setSearchTerm('cash settlement');
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-emerald-500/10 hover:border-emerald-500/40 border border-zinc-800 text-zinc-300 hover:text-emerald-300 font-mono text-[10px] transition-colors cursor-pointer"
          >
            Action Description: "cash settlement"
          </button>
          {(searchTerm || searchField !== 'all' || roleFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSearchField('all');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="ml-auto text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3 h-3" /> Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Chronological Data Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <th className="py-4 px-4">Timestamp (UTC / Local)</th>
                <th className="py-4 px-4">Admin UID & Operator</th>
                <th className="py-4 px-4">Target User UID & Subject</th>
                <th className="py-4 px-4">Action & Status</th>
                <th className="py-4 px-4">State Transition</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-4">Details / Reason</th>
                <th className="py-4 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-xs text-zinc-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                    <p className="text-sm font-semibold">Querying 'force_unlock_logs' collection from Firestore...</p>
                  </td>
                </tr>
              ) : chronologicalLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    <Info className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-zinc-300">
                      {searchTerm
                        ? `No audit logs found matching "${searchTerm}" in ${
                            searchField === 'adminUid'
                              ? 'Admin UID'
                              : searchField === 'targetUid'
                              ? 'Target User UID'
                              : searchField === 'actionDescription'
                              ? 'Action Description'
                              : 'all fields'
                          }.`
                        : 'No force unlock logs found matching your filters.'}
                    </p>
                    {searchTerm ? (
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSearchField('all');
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                          Clear Search
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-600 mt-1">
                        Execute a Force Unlock or click 'Log Test Unlock' to populate real-time records.
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                chronologicalLogs.map((log) => {
                  const isAdminTarget = log.targetType === 'admin';
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-900/50 transition-colors group"
                    >
                      {/* 1. Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-mono text-zinc-200 text-[11px] font-bold">
                            {formatTimestamp(log.timestamp)}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 inline" />
                            {getRelativeTime(log.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* 2. Admin UID */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-amber-300 truncate max-w-[150px]">
                              {highlightMatch(log.adminUid, searchTerm)}
                            </span>
                            <button
                              onClick={() => handleCopy(log.adminUid, `admin_${log.id}`)}
                              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                              title="Copy Admin UID"
                            >
                              {copiedField === `admin_${log.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-normal truncate max-w-[160px]">
                            {highlightMatch(log.adminName || log.adminEmail, searchTerm)}
                          </div>
                        </div>
                      </td>

                      {/* 3. Target User UID */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-cyan-300 truncate max-w-[150px]">
                              {highlightMatch(log.targetUserUid, searchTerm)}
                            </span>
                            <button
                              onClick={() => handleCopy(log.targetUserUid, `target_${log.id}`)}
                              className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
                              title="Copy Target User UID"
                            >
                              {copiedField === `target_${log.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-white truncate max-w-[140px]">
                              {highlightMatch(log.targetUserName, searchTerm)}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                                isAdminTarget
                                  ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                                  : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {log.targetType}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. Action & Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                            <Unlock className="w-3 h-3" />
                            {highlightMatch(log.action, searchTerm)}
                          </span>
                          <div>
                            {log.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400">
                                <AlertTriangle className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 5. State Transition */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold">
                          <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                            {log.previousSubscriptionStatus || 'LOCKED'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-zinc-500" />
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                            {log.newSubscriptionStatus || 'ACTIVE'}
                          </span>
                        </div>
                      </td>

                      {/* 6. Duration */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {log.durationMs ? `${log.durationMs}ms` : '—'}
                      </td>

                      {/* 7. Details */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[11px] text-zinc-300 truncate" title={log.details}>
                          {highlightMatch(log.details, searchTerm)}
                        </p>
                        {log.metadata?.reason && (
                          <span className="text-[10px] text-zinc-500 italic block truncate">
                            Reason: {highlightMatch(log.metadata.reason, searchTerm)}
                          </span>
                        )}
                      </td>

                      {/* 8. Inspect JSON */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLogPayload(log)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-bold flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                        >
                          <Terminal className="w-3 h-3 text-cyan-400" />
                          <span>Inspect</span>
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

      {/* 4. JSON Log Inspector Modal */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-white space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-sm uppercase tracking-wider text-white">
                  Firestore Log Payload: <span className="font-mono text-cyan-300">{selectedLogPayload.id}</span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogPayload(null)}
                className="w-7 h-7 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Admin UID</span>
                <span className="font-mono text-amber-300 font-bold">{selectedLogPayload.adminUid}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Target User UID</span>
                <span className="font-mono text-cyan-300 font-bold">{selectedLogPayload.targetUserUid}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Timestamp (UTC)</span>
                <span className="font-mono text-zinc-200">{selectedLogPayload.timestamp}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Subscription Transition</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {selectedLogPayload.previousSubscriptionStatus || 'LOCKED'} ➔ {selectedLogPayload.newSubscriptionStatus}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-black p-4 rounded-2xl border border-zinc-800 text-[11px] font-mono text-cyan-300">
              <pre className="whitespace-pre-wrap">{JSON.stringify(selectedLogPayload, null, 2)}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopy(JSON.stringify(selectedLogPayload, null, 2), 'payload_json')}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedField === 'payload_json' ? 'Copied JSON!' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={() => setSelectedLogPayload(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForceUnlockAuditLogsTab;
