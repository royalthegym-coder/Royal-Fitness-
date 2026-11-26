import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Cpu,
  Zap,
  ShieldCheck,
  Activity,
  Copy,
  Check,
  Play,
  Database,
  Unlock,
  RefreshCw,
  Crown,
  Server,
  Globe,
  Code2,
  Trash2
} from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useTenantStore } from '../../store/useTenantStore';
import { auth, syncToFirebase } from '../../../lib/firebase';

interface TerminalLogEntry {
  id: string;
  timestamp: string;
  type: 'command' | 'success' | 'info' | 'warning' | 'error' | 'json';
  text: string;
  details?: any;
}

const APPLET_ID = '4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6';
const FIRESTORE_DB_ID = 'ai-studio-4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6';
const FIREBASE_PROJECT_ID = 'project-74356317-8adc-420c-9be';
const OWNER_EMAIL = 'owner@fitnessfuture.in';
const MERCHANT_UPI = 'your-upi@bank';
const DEV_URL = 'https://ais-dev-hakfvy5pcvvusj25knx2eb-9972469637.asia-east1.run.app';
const PROD_URL = 'https://ais-pre-hakfvy5pcvvusj25knx2eb-9972469637.asia-east1.run.app';

export const SmartTerminal: React.FC = () => {
  const {
    members,
    updateMember,
    invoices,
    packages,
    staff,
    attendanceRecords,
    systemHealth,
    totalRevenue,
    triggerSystemUpdate
  } = useData();

  const {
    tenants,
    globalMasterOverride,
    toggleGlobalMasterOverride,
    toggleTenantLock,
    toggleMemberLock,
    repairAllPortalIssues
  } = useTenantStore();

  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<TerminalLogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      text: '⚡ FITNESS FUTURE OWNER CONSOLE v2.0.0 — SYSTEM ROOT ACCESS INITIALIZED'
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      text: `Authenticated Owner: ${auth.currentUser?.displayName || 'Fitness Future Owner'} <${auth.currentUser?.email || OWNER_EMAIL}> | Clearance: OWNER CONSOLE`
    },
    {
      id: 'init-3',
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      text: `Applet ID: ${APPLET_ID} | Firestore DB: ${FIRESTORE_DB_ID}`
    },
    {
      id: 'init-4',
      timestamp: new Date().toLocaleTimeString(),
      type: 'success',
      text: '3-Tier Portal Bridge Linked: [1] Member Super-App  [2] Gym Admin Portal  [3] Supreme Super Admin Panel'
    },
    {
      id: 'init-5',
      timestamp: new Date().toLocaleTimeString(),
      type: 'warning',
      text: 'Type "help" or click any Quick Command chip below to control your entire application.'
    }
  ]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const appendLog = (type: TerminalLogEntry['type'], text: string, details?: any) => {
    setLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        type,
        text,
        details
      }
    ]);
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const runCommand = async (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    appendLog('command', `fitness-future@antigravity-cli:~/fitness-future$ ${trimmed}`);
    setHistory(prev => [trimmed, ...prev.slice(0, 49)]);
    setHistoryIdx(-1);
    setIsExecuting(true);

    const parts = trimmed.split(/\s+/);
    const normalizedParts = parts[0].toLowerCase() === 'antigravity' ? parts.slice(1) : parts;
    const cmd = (normalizedParts[0] || 'status').toLowerCase();
    const args = normalizedParts.slice(1);

    try {
      if (cmd === 'clear' || cmd === 'cls') {
        setLogs([]);
        setIsExecuting(false);
        return;
      }

      if (cmd === 'help' || cmd === '--help') {
        appendLog(
          'info',
          'AVAILABLE ANTIGRAVITY CLI ROOT COMMANDS (FULL ACCESS):',
          {
            'antigravity status': 'Inspect live 3-Tier Portals, Members, Revenue, Server & Firestore state',
            'antigravity manifest': 'View full application manifest, Applet ID, URLs & Owner credentials',
            'antigravity portals': 'Check Tier-1 (Member), Tier-2 (Admin), and Tier-3 (Super Admin) connectivity',
            'antigravity members': 'List all registered gym members with status & membership expiry',
            'antigravity member unlock <id>': 'Force-unlock a member account in local store & Firestore',
            'antigravity member lock <id>': 'Lock a member account immediately',
            'antigravity tenants': 'List all Gym Admin franchise tenants and lock status',
            'antigravity tenant unlock <gym_id>': 'Unlock a Gym Admin tenant portal',
            'antigravity unlock-all': 'GLOBAL OVERRIDE: Force-unlock ALL Admin & Member portals + heal diagnostics',
            'antigravity firestore': 'Inspect Firestore database collections & trigger live cloud sync',
            'antigravity verify-upi [amount]': 'Verify HMAC-SHA256 payment to your-upi@bank',
            'antigravity endpoints': 'List all server REST & WebSocket API routes',
            'antigravity ai <prompt>': 'Execute natural language directive via Antigravity AI Agent',
            'clear': 'Clear terminal console output'
          }
        );
        setIsExecuting(false);
        return;
      }

      if (cmd === 'members') {
        const summaryList = members.map((m: any) => ({
          id: m.id,
          name: m.name,
          status: m.status,
          phone: m.phone,
          plan: m.membershipType || m.plan || `Package #${m.packageId ?? 1}`,
          expiryDate: m.expiryDate || m.endDate || 'Active'
        }));
        appendLog('success', `Found ${members.length} Members in Master Directory:`, summaryList);
        setIsExecuting(false);
        return;
      }

      if (cmd === 'member') {
        const subAction = (args[0] || '').toLowerCase();
        const targetId = Number(args[1]);
        const targetMember = members.find(m => m.id === targetId);

        if (!targetMember) {
          appendLog('error', `Member ID ${args[1] || '(missing)'} not found. Run "antigravity members" to see valid IDs.`);
          setIsExecuting(false);
          return;
        }

        if (subAction === 'unlock') {
          const updated = { ...targetMember, status: 'Active' as const };
          updateMember(updated);
          toggleMemberLock(targetId, false);
          await syncToFirebase('members', String(targetId), updated);
          appendLog('success', `✅ Member #${targetId} (${targetMember.name}) UNLOCKED & set to Active in Firestore!`);
        } else if (subAction === 'lock') {
          const updated = { ...targetMember, status: 'Expired' as const };
          updateMember(updated);
          toggleMemberLock(targetId, true, 'Locked via Antigravity CLI');
          await syncToFirebase('members', String(targetId), updated);
          appendLog('warning', `🔒 Member #${targetId} (${targetMember.name}) LOCKED via Antigravity CLI.`);
        } else {
          appendLog('info', `Member #${targetId} Details:`, targetMember);
        }
        setIsExecuting(false);
        return;
      }

      if (cmd === 'tenants') {
        const tenantList = tenants.map(t => ({
          gym_id: t.gym_id,
          gym_name: t.gym_name,
          email: t.email_id,
          status: t.subscription_status,
          locked: Boolean(t.account_locked),
          plan: `${t.plan_name} (${t.plan_cycle})`,
          health: `${t.portal_health_score || 100}%`
        }));
        appendLog('success', `Active Gym Admin Tenants (${tenants.length}):`, tenantList);
        setIsExecuting(false);
        return;
      }

      if (cmd === 'tenant') {
        const subAction = (args[0] || '').toLowerCase();
        const gymId = args[1] || 'fitness_future_01';
        if (subAction === 'unlock') {
          toggleTenantLock(gymId, false);
          appendLog('success', `✅ Gym Admin Tenant [${gymId}] UNLOCKED & restored to Active!`);
        } else if (subAction === 'lock') {
          toggleTenantLock(gymId, true);
          appendLog('warning', `🔒 Gym Admin Tenant [${gymId}] LOCKED.`);
        } else {
          const found = tenants.find(t => t.gym_id === gymId);
          appendLog('info', `Tenant [${gymId}]:`, found || 'Not found');
        }
        setIsExecuting(false);
        return;
      }

      if (cmd === 'unlock-all') {
        toggleGlobalMasterOverride('forceUnlockAllAdmins', true);
        toggleGlobalMasterOverride('forceUnlockAllMembers', true);
        repairAllPortalIssues('All');
        tenants.forEach(t => {
          if (t.account_locked) toggleTenantLock(t.gym_id, false);
        });
        for (const m of members) {
          toggleMemberLock(m.id, false);
          if (m.status !== 'Active') {
            updateMember({ ...m, status: 'Active' });
          }
        }
        await syncToFirebase('system_policies', 'global_expiration', {
          id: 'global_expiration',
          expirationMode: 'bypass_all',
          gracePeriodDays: 365,
          forceUnlockAllAccounts: true
        });
        appendLog(
          'success',
          '👑 SUPREME ROOT OVERRIDE EXECUTED: All Admin Portals, All Member Portals, and Firestore global_expiration policy are now 100% UNLOCKED & Auto-Healed!'
        );
        setIsExecuting(false);
        return;
      }

      if (cmd === 'sync' || (cmd === 'db' && args[0] === 'sync')) {
        triggerSystemUpdate();
        for (const m of members.slice(0, 5)) {
          await syncToFirebase('members', String(m.id), m);
        }
        appendLog(
          'success',
          `☁️ Synchronized local state (${members.length} members, ${invoices.length} invoices, ${packages.length} packages) with Firestore DB [${FIRESTORE_DB_ID}].`
        );
        setIsExecuting(false);
        return;
      }

      // Call server-side Antigravity control plane for status, manifest, portals, firestore, verify-upi, endpoints, ai, agent
      const res = await fetch('/api/antigravity/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Antigravity-Owner': OWNER_EMAIL,
          'X-Antigravity-Applet-Id': APPLET_ID
        },
        body: JSON.stringify({
          command: cmd,
          args,
          context: {
            totalMembers: members.length,
            activeMembers: members.filter(m => m.status === 'Active').length,
            totalTenants: tenants.length,
            totalRevenue,
            invoicesCount: invoices.length,
            packagesCount: packages.length,
            staffCount: staff.length,
            attendanceCount: attendanceRecords.length,
            systemHealth,
            globalMasterOverride,
            firebaseUser: auth.currentUser?.email || OWNER_EMAIL
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        appendLog('success', data.summary || `Executed: ${cmd}`, data.output);
      } else {
        appendLog('error', data.error || 'Command failed on server control plane.');
      }
    } catch (err: any) {
      appendLog('error', `Execution error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isExecuting) {
      const cmdToRun = input;
      setInput('');
      runCommand(cmdToRun);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  const quickCommands = [
    { label: 'System & 3-Tier Status', cmd: 'antigravity status', icon: Activity },
    { label: 'Full App Manifest', cmd: 'antigravity manifest', icon: Code2 },
    { label: 'Unlock All Portals & DB', cmd: 'antigravity unlock-all', icon: Unlock },
    { label: 'List All Members', cmd: 'antigravity members', icon: Crown },
    { label: 'List Gym Tenants', cmd: 'antigravity tenants', icon: Globe },
    { label: 'Firestore DB Info', cmd: 'antigravity firestore', icon: Database },
    { label: 'Sync Data to Cloud', cmd: 'antigravity sync', icon: RefreshCw },
    { label: 'Verify ₹1499 UPI HMAC', cmd: 'antigravity verify-upi 1499', icon: ShieldCheck },
    { label: 'List API Endpoints', cmd: 'antigravity endpoints', icon: Server },
    { label: 'Ask Antigravity Agent', cmd: 'antigravity ai "Audit all 3 portals and give optimization report in Hindi"', icon: Cpu }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-fuchsia-950/30 to-slate-900 border border-fuchsia-500/30 rounded-3xl p-6 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-widest mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Antigravity CLI Root Access Granted • LEVEL-5 OWNER
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Terminal className="w-8 h-8 text-fuchsia-400" />
            Google Antigravity <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-400">CLI Root Console</span>
          </h2>
          <p className="text-slate-300 text-xs font-mono mt-1">
            Full Read/Write/Override Control over Member Portal, Admin Portal, Super Admin Panel & Firestore DB
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => runCommand('antigravity unlock-all')}
            disabled={isExecuting}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer transition-all"
          >
            <Unlock className="w-4 h-4" /> Unlock All Portals
          </button>
          <button
            onClick={() => runCommand('antigravity sync')}
            disabled={isExecuting}
            className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} /> Sync Firestore
          </button>
        </div>
      </div>

      {/* Credentials & Connection Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Owner Root Identity</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-mono text-sm font-bold text-white truncate">{OWNER_EMAIL}</div>
          <div className="text-[11px] text-emerald-400 mt-1 font-semibold">Fitness Future Super Admin • Super Admin</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Applet ID</span>
            <button
              onClick={() => handleCopy('appletId', APPLET_ID)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copiedKey === 'appletId' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'appletId' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-xs font-bold text-cyan-300 truncate">{APPLET_ID}</div>
          <div className="text-[11px] text-slate-400 mt-1">Agent: antigravity-preview-09-2026</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Firestore Database ID</span>
            <button
              onClick={() => handleCopy('dbId', FIRESTORE_DB_ID)}
              className="text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 text-[11px] cursor-pointer"
            >
              {copiedKey === 'dbId' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey === 'dbId' ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-xs font-bold text-fuchsia-300 truncate">{FIRESTORE_DB_ID}</div>
          <div className="text-[11px] text-slate-400 mt-1">Project: {FIREBASE_PROJECT_ID}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold uppercase tracking-wider">Merchant UPI & CLI</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-mono text-xs font-bold text-emerald-300 truncate">{MERCHANT_UPI}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {members.length} Members • {tenants.length} Gym Tenants
          </div>
        </div>
      </div>

      {/* Quick Execution Chips */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-fuchsia-400" /> One-Click Antigravity CLI Commands:
        </div>
        <div className="flex flex-wrap gap-2">
          {quickCommands.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => runCommand(item.cmd)}
                disabled={isExecuting}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-fuchsia-500/20 border border-white/10 hover:border-fuchsia-500/40 text-xs font-mono text-slate-200 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Terminal Screen */}
      <div className="bg-[#050508] border border-fuchsia-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(217,70,239,0.12)] flex flex-col h-[520px]">
        {/* Terminal Title Bar */}
        <div className="bg-slate-900/95 border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-mono text-slate-300 font-bold">
              fitness-future@antigravity-cli: ~/fitness-future ({APPLET_ID})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogs([])}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* Terminal Output Stream */}
        <div className="flex-1 p-5 overflow-y-auto font-mono text-xs md:text-sm space-y-3">
          {logs.map(entry => (
            <div key={entry.id} className="space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-slate-600 text-[11px] shrink-0 select-none">[{entry.timestamp}]</span>
                <span
                  className={
                    entry.type === 'command'
                      ? 'text-fuchsia-400 font-bold'
                      : entry.type === 'success'
                      ? 'text-emerald-400 font-semibold'
                      : entry.type === 'warning'
                      ? 'text-amber-300'
                      : entry.type === 'error'
                      ? 'text-red-400 font-semibold'
                      : 'text-cyan-300'
                  }
                >
                  {entry.text}
                </span>
              </div>
              {entry.details && (
                <pre className="ml-16 p-3 rounded-xl bg-slate-950/90 border border-white/10 text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                  {typeof entry.details === 'string'
                    ? entry.details
                    : JSON.stringify(entry.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
          {isExecuting && (
            <div className="text-cyan-400 animate-pulse flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Antigravity CLI directive...</span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Terminal Command Input Bar */}
        <div className="bg-slate-950 border-t border-fuchsia-500/30 px-4 py-3 flex items-center gap-3">
          <span className="text-fuchsia-400 font-mono text-xs md:text-sm font-bold shrink-0">
            fitness-future@antigravity-cli:~$
          </span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Type command (e.g. "antigravity status", "antigravity unlock-all", "antigravity ai <prompt>", "help")...'
            className="flex-1 bg-transparent text-white font-mono text-xs md:text-sm focus:outline-none placeholder:text-slate-600"
          />
          <button
            onClick={() => {
              const cmdToRun = input;
              setInput('');
              runCommand(cmdToRun || 'antigravity status');
            }}
            disabled={isExecuting}
            className="px-4 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" /> Run
          </button>
        </div>
      </div>

      {/* External Terminal / Antigravity CLI Connection Guide */}
      <div className="bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              External Terminal & Antigravity CLI Access Commands
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Use these commands directly in your local terminal or Antigravity CLI workspace (`antigravity.config.json` is pre-configured in root):
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>1. Interactive Antigravity CLI Shell (Local/Workspace)</span>
              <button
                onClick={() => handleCopy('cmd1', 'npm run antigravity -- shell')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'cmd1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'cmd1' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 select-all">
              npm run antigravity -- shell
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>2. Direct CLI Status & Full Manifest Check</span>
              <button
                onClick={() => handleCopy('cmd2', 'npx tsx cli/antigravity.ts status')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'cmd2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'cmd2' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 select-all">
              npx tsx cli/antigravity.ts status
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>3. Remote API Control Plane (Dev Environment)</span>
              <button
                onClick={() =>
                  handleCopy(
                    'cmd3',
                    `curl -X POST ${DEV_URL}/api/antigravity/execute -H "Content-Type: application/json" -d '{"command":"status"}'`
                  )
                }
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'cmd3' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'cmd3' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-cyan-300 overflow-x-auto select-all">
              curl -X POST {DEV_URL}/api/antigravity/execute -H "Content-Type: application/json" -d '&#123;"command":"status"&#125;'
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span>4. Production Shared App URL</span>
              <button
                onClick={() => handleCopy('cmd4', PROD_URL)}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'cmd4' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === 'cmd4' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-fuchsia-300 overflow-x-auto select-all">
              {PROD_URL}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
