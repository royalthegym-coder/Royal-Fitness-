import React, { useState, useMemo } from 'react';
import {
  Crown, ShieldCheck, Lock, Unlock, Users, Building2, Zap, RefreshCw,
  CheckCircle2, AlertTriangle, Search, Eye, EyeOff, CreditCard, Calendar,
  Sliders, Wrench, Sparkles, LayoutGrid, ArrowUpRight, UserCheck, ShieldAlert,
  Smartphone, Activity, Globe, Bot, Heart, DollarSign, Wifi, Share2, Terminal
} from 'lucide-react';
import { useTenantStore } from '../../store/useTenantStore';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';

interface SuperAdminMasterGovernanceProps {
  setCurrentView: (view: string) => void;
}

const ALL_PORTAL_BOARDS = [
  {
    category: '👑 Fitness Future AI & Master Command',
    color: 'amber',
    items: [
      { id: 'fitnessFutureCommandHub', label: 'Fitness Future Command Hub', portal: 'All Portals', desc: 'Autonomous operations & voice command hub' },
      { id: 'superAdmin', label: 'Super Admin Master Console', portal: 'Super Admin', desc: 'Multi-tenant governance & telemetry' },
      { id: 'dashboard', label: 'Admin Command Dashboard', portal: 'Admin Portal', desc: 'Gym operations, revenue & live KPIs' },
      { id: 'memberPortal', label: 'Live Member Portal Hub', portal: 'Member Portal', desc: 'Full athlete app & AI workout experience' },
      { id: 'automationHub', label: 'n8n & ₹1 Alpha Edge Console', portal: 'Super Admin', desc: 'Workflow webhooks & live payment testing' },
      { id: 'bioscienceHub', label: 'Bioscience & AlphaFold 3D', portal: 'All Portals', desc: '3D molecular viewer & protein intelligence' },
    ],
  },
  {
    category: '🏢 Operations, Staff & Attendance',
    color: 'indigo',
    items: [
      { id: 'staff', label: 'Staff & Coach Directory', portal: 'Admin Portal', desc: 'Manage trainers, roles & payroll' },
      { id: 'adminScheduler', label: 'Staff Shift Planner', portal: 'Admin Portal', desc: 'Trainer shifts & floor roster' },
      { id: 'adminAttendance', label: 'Attendance Desk', portal: 'Admin Portal', desc: 'Real-time check-ins & biometric logs' },
      { id: 'qrScanner', label: 'Camera QR Scanner', portal: 'Admin Portal', desc: 'Scan member holographic QR passes' },
      { id: 'tasks', label: 'Admin Task Board', portal: 'Admin Portal', desc: 'Daily operational tasks & checklists' },
      { id: 'storkTeam', label: 'Stork Team Collaboration', portal: 'Admin Portal', desc: 'Internal staff chat & shift handoff' },
      { id: 'trainerClientLogger', label: 'Trainer Client Logger', portal: 'Admin Portal', desc: 'Log PT sessions & client RPE' },
    ],
  },
  {
    category: '👥 Member & Lead CRM Suite',
    color: 'cyan',
    items: [
      { id: 'members', label: 'Master Member Database', portal: 'Admin Portal', desc: 'Full member profiles, status & biometrics' },
      { id: 'leads', label: 'Leads & Funnel Manager', portal: 'Admin Portal', desc: 'Track walk-ins, trials & conversions' },
      { id: 'fitnessFutureCRM', label: 'Advanced AI CRM', portal: 'Admin Portal', desc: 'Automated retention & churn scoring' },
      { id: 'crm', label: 'Member Engagement CRM', portal: 'Admin Portal', desc: 'Follow-ups, lifecycle & broadcasts' },
      { id: 'memberRegistrationForm', label: 'Basic Member Admission', portal: 'Admin Portal', desc: 'Fast-track front-desk admission' },
      { id: 'scientificAdmissionForm', label: 'Scientific Bio-Admission', portal: 'Admin Portal', desc: 'Body composition & clinical intake' },
      { id: 'quantumAdmissionForm', label: 'Quantum Biometric Admission', portal: 'Admin Portal', desc: 'WebAuthn + AI goal calibration' },
    ],
  },
  {
    category: '🏋️ Fitness, Workout & Form AI',
    color: 'purple',
    items: [
      { id: 'workouts', label: 'Master Workout Planner', portal: 'Admin Portal', desc: 'Build & assign hypertrophy/strength splits' },
      { id: 'classManager', label: 'Group Class Scheduler', portal: 'Admin Portal', desc: 'HIIT, Yoga, Zumba & Spin capacity' },
      { id: 'classBooking', label: 'Interactive Class Booking', portal: 'Member Portal', desc: 'Member slot reservation board' },
      { id: 'fitnessFutureTraining', label: 'Quantum Training Core', portal: 'Both Portals', desc: 'Periodized overload & velocity tracking' },
      { id: 'fitnessFutureProgress', label: 'Body Metrics & Set Logger', portal: 'Both Portals', desc: 'Track 1RM, body fat & circumferences' },
      { id: 'workoutAnalytics', label: 'Workout Analytics Board', portal: 'Both Portals', desc: 'Volume, intensity & muscle recovery charts' },
      { id: 'aiHiitCoach', label: 'Dynamic AI HIIT Coach', portal: 'Both Portals', desc: 'Interval timer & heart-rate zone pacing' },
      { id: 'realTimeFormAnalyzer', label: 'AI CCTV Posture & Form Lab', portal: 'Both Portals', desc: 'Computer-vision skeletal joint tracking' },
    ],
  },
  {
    category: '🥗 Diet, Kitchen & Medical Station',
    color: 'emerald',
    items: [
      { id: 'diet', label: 'Master Diet Matrix', portal: 'Both Portals', desc: 'Macro-calibrated meal & supplement plans' },
      { id: 'nutritionTracker', label: 'Nutrition Macro Logger', portal: 'Both Portals', desc: 'Daily calorie, protein, carb & fat log' },
      { id: 'healthEngine', label: 'Health Engine Core', portal: 'Admin Portal', desc: 'Metabolic & cardiovascular scoring' },
      { id: 'healthMetrics', label: 'Vital Biometrics Lab', portal: 'Both Portals', desc: 'HRV, SpO2, glucose & hormonal clock' },
      { id: 'sleepTracker', label: 'Sleep & Circadian Analytics', portal: 'Both Portals', desc: 'Deep/REM sleep & recovery readiness' },
      { id: 'medicalProfiling', label: 'Clinical Health Profile Lab', portal: 'Both Portals', desc: 'Blood reports, injuries & contraindications' },
      { id: 'injuryOracle', label: 'Gym Injury Risk Oracle', portal: 'Both Portals', desc: 'Predictive joint & tendon load warning' },
      { id: 'aiBioAnalyst', label: 'AI Bio-Analyst Consultation', portal: 'Admin Portal', desc: 'AI clinical review & protocol generator' },
      { id: 'aiHealthCoach', label: 'AI Longevity Health Coach', portal: 'Both Portals', desc: '24/7 personalized wellness guidance' },
      { id: 'aetherMed', label: 'CloudMed Tele-Health', portal: 'Both Portals', desc: 'Remote sports medicine & lab diagnostics' },
      { id: 'advancedDNA', label: 'Genomic DNA Profiler', portal: 'Both Portals', desc: 'ACTN3 & metabolic gene optimization' },
      { id: 'digitalBioPass', label: 'Digital Bio-Health Pass', portal: 'Both Portals', desc: 'Verified health & immunity passport' },
    ],
  },
  {
    category: '💳 Billing, POS, Packages & FinTech',
    color: 'green',
    items: [
      { id: 'billing', label: 'Master Billing Gateway', portal: 'Admin Portal', desc: 'Invoices, UPI QR, receipts & dues' },
      { id: 'paymentDashboard', label: 'Payment Analytics Board', portal: 'Admin Portal', desc: 'Collections, overdue alerts & trends' },
      { id: 'packages', label: 'Membership Packages Manager', portal: 'Both Portals', desc: 'Monthly, Quarterly & Yearly gym plans' },
      { id: 'emiPlans', label: 'Member EMI Installments', portal: 'Both Portals', desc: 'Split-payment schedules & auto-reminders' },
      { id: 'fitnessPay', label: 'FuturePay Member Wallet', portal: 'Both Portals', desc: 'Cashless gym wallet & instant top-up' },
      { id: 'fitnessFuturePOS', label: 'Gym POS Terminal', portal: 'Admin Portal', desc: 'Shake bar, supplements & merchandise POS' },
      { id: 'fitnessFutureLedger', label: 'Full Financial Ledger', portal: 'Admin Portal', desc: 'Double-entry P&L and audit trail' },
      { id: 'inventoryPortal', label: 'Store & Stock Management', portal: 'Admin Portal', desc: 'Inventory levels, SKUs & reorder alerts' },
      { id: 'marketplace', label: 'Pro Shop Supplement Store', portal: 'Both Portals', desc: 'Member e-commerce supplement store' },
      { id: 'autoProcurement', label: 'AI Auto-Procurement', portal: 'Admin Portal', desc: 'Automated vendor restock orders' },
      { id: 'expenses', label: 'Operating Expenses Tracker', portal: 'Admin Portal', desc: 'Rent, electricity, equipment & salaries' },
      { id: 'revenueOracle', label: 'AI Revenue Oracle', portal: 'Admin Portal', desc: 'MRR forecasting & LTV optimization' },
      { id: 'predictiveAnalytics', label: 'Growth & Churn Predictions', portal: 'Admin Portal', desc: 'Cohort retention & expansion modeling' },
      { id: 'razorpaySubscriptions', label: 'Razorpay Auto-Pay Gateway', portal: 'Both Portals', desc: 'Recurring mandate & webhook billing' },
      { id: 'appSubscription', label: 'Cloud SaaS Subscriptions', portal: 'Super Admin', desc: 'Tenant licensing & B2B plan matrix' },
    ],
  },
  {
    category: '🤖 Autonomous AI Agents & DevOps',
    color: 'fuchsia',
    items: [
      { id: 'futureOvermind', label: 'Primary Nexus Overmind', portal: 'Admin Portal', desc: 'Central autonomous gym orchestration' },
      { id: 'agenticBots', label: 'Swarm Task Managers', portal: 'Admin Portal', desc: 'Multi-agent lead, billing & diet bots' },
      { id: 'aiAgentHub', label: 'AI Agent & Bot Hub', portal: 'Admin Portal', desc: 'Configure custom gym AI workers' },
      { id: 'googleAgents', label: 'Google Autonomous AI Agents', portal: 'Admin Portal', desc: 'Gemini-powered operational agents' },
      { id: 'sentinelIntakeBot', label: 'Sentinel Reception Bot', portal: 'Admin Portal', desc: 'Automated visitor & trial onboarding' },
      { id: 'geniusEngine', label: 'BrainCore Cognitive Synapse', portal: 'Both Portals', desc: 'Deep neural workout & recovery synthesis' },
      { id: 'geniusMode', label: 'Creative Overdrive Studio', portal: 'Admin Portal', desc: 'Generate campaigns, challenges & copy' },
      { id: 'synthesisX', label: 'Synthesis X Protocol', portal: 'Both Portals', desc: 'Elite bio-optimization protocol engine' },
      { id: 'futureOFSAdmin', label: 'Optimal Form Score (OFS) Hub', portal: 'Admin Portal', desc: 'Facility-wide biomechanics leaderboard' },
      { id: 'launchCommandCenter', label: 'Server Deploy & CI/CD Pipeline', portal: 'Super Admin', desc: 'SSH test, build compare & 30d trend chart' },
      { id: 'brandedApp', label: 'Brand App & Pipeline Monitor', portal: 'Admin Portal', desc: 'Custom white-label app & build metrics' },
    ],
  },
  {
    category: '📡 IoT, 3D Digital Twin & Security',
    color: 'rose',
    items: [
      { id: 'biometricTurnstile', label: 'Biometric Gate Turnstile', portal: 'Both Portals', desc: 'FaceID / QR turnstile access control' },
      { id: 'synapseIoT', label: 'Synapse IoT Equipment Hub', portal: 'Admin Portal', desc: 'Connected treadmills, HVAC & lighting' },
      { id: 'universalGadgets', label: 'Universal Connected Gadgets', portal: 'Both Portals', desc: 'Smart scales, heart straps & beacons' },
      { id: 'wearableSync', label: 'Wearable Device Telemetry', portal: 'Both Portals', desc: 'Apple Watch, Whoop, Oura & Garmin sync' },
      { id: 'digitalTwin', label: '3D Facility Digital Twin', portal: 'Both Portals', desc: 'Spatial 3D floor & equipment telemetry' },
      { id: 'liveCrowdHeatmap', label: 'Live Crowd Heatmap', portal: 'Admin Portal', desc: 'Zone occupancy & peak hour density' },
      { id: 'liveCrowdRadar', label: 'Live Crowd Radar', portal: 'Both Portals', desc: 'Real-time floor radar for athletes' },
      { id: 'whatsapp', label: 'WhatsApp Business Cloud API', portal: 'Admin Portal', desc: 'Automated receipts, reminders & campaigns' },
      { id: 'googleBusiness', label: 'Google Business Profile Hub', portal: 'Admin Portal', desc: 'Reviews, local SEO & post scheduler' },
      { id: 'socialManager', label: 'Ghost Social Media Manager', portal: 'Admin Portal', desc: 'Instagram, Facebook & YouTube automation' },
      { id: 'socialHive', label: 'Aether Community Hive', portal: 'Both Portals', desc: 'Member challenges, feed & leaderboards' },
      { id: 'security', label: 'Zero-Trust Security Layer', portal: 'Admin Portal', desc: 'Encryption, role policies & session guard' },
      { id: 'biometricLogs', label: 'Biometric Audit Logs', portal: 'Admin Portal', desc: 'WebAuthn & turnstile verification history' },
      { id: 'quantumVault', label: 'Quantum Security Keys Vault', portal: 'Admin Portal', desc: 'API keys, webhooks & encrypted secrets' },
    ],
  },
];

export const SuperAdminMasterGovernance: React.FC<SuperAdminMasterGovernanceProps> = ({ setCurrentView }) => {
  const {
    tenants,
    portalDiagnostics,
    memberGovernance,
    globalMasterOverride,
    toggleTenantLock,
    toggleTenantAutoUnlock,
    activateTenantSubscription,
    updateTenantPermissions,
    repairTenantPortal,
    toggleMemberLock,
    toggleMemberAutoUnlock,
    activateMemberSubscriptionUnlock,
    repairDiagnosticIssue,
    repairAllPortalIssues,
    toggleGlobalMasterOverride,
  } = useTenantStore();

  const { members, updateMember, addAuditLog } = useData();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'admins' | 'members' | 'diagnostics' | 'boards'>('admins');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'locked'>('all');
  const [boardSearch, setBoardSearch] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  const togglePasswordReveal = (key: string) => {
    setRevealedPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered Admins
  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const isLocked = Boolean(t.account_locked) && !globalMasterOverride.forceUnlockAllAdmins;
      if (adminFilter === 'unlocked' && isLocked) return false;
      if (adminFilter === 'locked' && !isLocked) return false;
      if (!adminSearch.trim()) return true;
      const q = adminSearch.toLowerCase();
      return (
        t.gym_name.toLowerCase().includes(q) ||
        (t.admin_name || '').toLowerCase().includes(q) ||
        t.email_id.toLowerCase().includes(q) ||
        t.phone_number.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q)
      );
    });
  }, [tenants, adminSearch, adminFilter, globalMasterOverride.forceUnlockAllAdmins]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const gov = memberGovernance[m.id];
      const isLocked =
        !globalMasterOverride.forceUnlockAllMembers &&
        (gov?.locked || m.status === 'Expired' || m.status === 'Inactive');
      if (memberFilter === 'active' && isLocked) return false;
      if (memberFilter === 'locked' && !isLocked) return false;
      if (!memberSearch.trim()) return true;
      const q = memberSearch.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.loginId || '').toLowerCase().includes(q) ||
        String(m.id).includes(q)
      );
    });
  }, [members, memberGovernance, memberSearch, memberFilter, globalMasterOverride.forceUnlockAllMembers]);

  // Filtered Boards
  const filteredBoardCategories = useMemo(() => {
    if (!boardSearch.trim()) return ALL_PORTAL_BOARDS;
    const q = boardSearch.toLowerCase();
    return ALL_PORTAL_BOARDS.map(cat => ({
      ...cat,
      items: cat.items.filter(
        item =>
          item.label.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.portal.toLowerCase().includes(q)
      ),
    })).filter(cat => cat.items.length > 0);
  }, [boardSearch]);

  const handleAdminPackageActivation = (gymId: string, gymName: string, cycle: 'Monthly' | 'Yearly') => {
    const planName = cycle === 'Yearly' ? 'Quantum Overmind Yearly' : 'Elite AI Cortex Monthly';
    const amount = cycle === 'Yearly' ? 47990 : 4999;
    activateTenantSubscription(gymId, cycle, planName, amount);
    addAuditLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      member_id: 0,
      action: 'SUPER_ADMIN_PACKAGE_UNLOCK',
      details: `Super Admin activated ${cycle} Package (${planName}) for ${gymName}. Admin Panel Auto-Unlocked.`,
    });
    addToast(`${gymName}: ${cycle} Package Activated & Admin Portal Auto-Unlocked!`, 'success');
  };

  const handleMemberLockToggle = (member: any) => {
    const gov = memberGovernance[member.id];
    const currentlyLocked = gov?.locked || member.status === 'Expired' || member.status === 'Inactive';
    const nextLockState = !currentlyLocked;

    toggleMemberLock(
      member.id,
      nextLockState,
      nextLockState ? 'Locked manually by Super Admin' : undefined
    );
    updateMember({
      ...member,
      status: nextLockState ? 'Expired' : 'Active',
    });
    addToast(
      nextLockState
        ? `Member "${member.name}" account locked.`
        : `Member "${member.name}" account unlocked & activated!`,
      nextLockState ? 'warning' : 'success'
    );
  };

  const handleMemberPackageAutoUnlock = (member: any, cycle: 'Monthly' | 'Yearly') => {
    const pkgName = cycle === 'Yearly' ? 'Fitness Future Annual Athlete Pass' : 'Pro Monthly Fitness Pass';
    const amount = cycle === 'Yearly' ? 24000 : 2500;
    activateMemberSubscriptionUnlock(member.id, cycle, pkgName, amount);
    updateMember({
      ...member,
      status: 'Active',
    });
    addAuditLog({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      member_id: member.id,
      action: 'MEMBER_AUTO_UNLOCK',
      details: `Super Admin activated ${cycle} plan (${pkgName}) for ${member.name}. Account Auto-Unlocked.`,
    });
    addToast(`${member.name}: ${cycle} Package Activated & Member Portal Auto-Unlocked!`, 'success');
  };

  const handleUnlockAllMembers = () => {
    members.forEach(m => {
      toggleMemberLock(m.id, false);
      if (m.status !== 'Active') {
        updateMember({ ...m, status: 'Active' });
      }
    });
    addToast(`All ${members.length} Member Accounts Unlocked & Activated!`, 'success');
  };

  const unlockedAdminsCount = tenants.filter(
    t => !t.account_locked || globalMasterOverride.forceUnlockAllAdmins
  ).length;

  const unlockedMembersCount = members.filter(m => {
    const gov = memberGovernance[m.id];
    return (
      globalMasterOverride.forceUnlockAllMembers ||
      (!gov?.locked && m.status !== 'Expired' && m.status !== 'Inactive')
    );
  }).length;

  const healthyDiagnosticsCount = portalDiagnostics.filter(d => d.status !== 'Detected').length;

  return (
    <div className="space-y-8">
      {/* SOVEREIGN MASTER CONTROL BANNER */}
      <div className="bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border-2 border-amber-500/40 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.12)] relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                EXCLUSIVE OWNER SUPER ADMIN VAULT
              </span>
              <span className="px-3 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                FULL CONTROL: ADMIN PORTAL + MEMBER PORTAL
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white italic uppercase tracking-tight">
              Master Account Unlocker, Package Engine & Portal Repair Hub
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-3xl">
              Complete centralized governance over every Admin and Member account. Unlock accounts manually or configure automatic unlocking upon Monthly/Yearly subscription activation, and repair any issue across the Admin or Member Portal in real time.
            </p>
          </div>

          {/* Direct Portal Jump Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setCurrentView('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              Open Admin Portal
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('memberPortal')}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Inspect Member Portal
            </button>
            <button
              type="button"
              onClick={() => {
                repairAllPortalIssues('All');
                addToast('All Admin & Member Portal modules synchronized and repaired to 100% health!', 'success');
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              1-Click Fix Both Portals
            </button>
          </div>
        </div>

        {/* Global Master Override Bar */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Admin Accounts Active</p>
              <p className="text-xl font-black text-white mt-0.5">
                {unlockedAdminsCount} / {tenants.length} <span className="text-xs text-emerald-400 font-bold">Unlocked</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                toggleGlobalMasterOverride('forceUnlockAllAdmins');
                addToast(
                  !globalMasterOverride.forceUnlockAllAdmins
                    ? 'Master Override: All Admin Portals Force-Unlocked!'
                    : 'Master Override disabled: Standard Monthly/Yearly package lock rules active.',
                  'info'
                );
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                globalMasterOverride.forceUnlockAllAdmins
                  ? 'bg-emerald-500 text-black border-emerald-400'
                  : 'bg-zinc-900 text-gray-300 border-white/10 hover:border-amber-500/40'
              }`}
            >
              {globalMasterOverride.forceUnlockAllAdmins ? 'Force Unlocked ON' : 'Force Unlock All'}
            </button>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Member Accounts Active</p>
              <p className="text-xl font-black text-white mt-0.5">
                {unlockedMembersCount} / {members.length} <span className="text-xs text-cyan-400 font-bold">Unlocked</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                toggleGlobalMasterOverride('forceUnlockAllMembers');
                addToast(
                  !globalMasterOverride.forceUnlockAllMembers
                    ? 'Master Override: All Member Portals Force-Unlocked!'
                    : 'Standard Member subscription lock rules restored.',
                  'info'
                );
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                globalMasterOverride.forceUnlockAllMembers
                  ? 'bg-cyan-500 text-black border-cyan-400'
                  : 'bg-zinc-900 text-gray-300 border-white/10 hover:border-cyan-500/40'
              }`}
            >
              {globalMasterOverride.forceUnlockAllMembers ? 'Force Unlocked ON' : 'Force Unlock All'}
            </button>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Dual-Portal Diagnostics</p>
              <p className="text-xl font-black text-white mt-0.5">
                {healthyDiagnosticsCount} / {portalDiagnostics.length} <span className="text-xs text-amber-400 font-bold">Healthy</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                toggleGlobalMasterOverride('autoHealPortals');
                addToast('24/7 Autonomous Portal Self-Healing toggled.', 'success');
              }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                globalMasterOverride.autoHealPortals
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-900 text-gray-400 border-white/10'
              }`}
            >
              {globalMasterOverride.autoHealPortals ? 'Auto-Heal ACTIVE' : 'Auto-Heal OFF'}
            </button>
          </div>

          <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400">Integrated Super App</p>
              <p className="text-xl font-black text-white mt-0.5">
                110+ <span className="text-xs text-fuchsia-400 font-bold">Boards & Tools</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('boards')}
              className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-300 border border-fuchsia-500/40 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              Browse All
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex flex-wrap gap-2 pt-6 mt-6 border-t border-white/10">
          {[
            {
              id: 'admins',
              label: `1. All Admins & Package Unlocker (${tenants.length})`,
              icon: <Building2 className="w-4 h-4" />,
            },
            {
              id: 'members',
              label: `2. All Members Vault & Account Unlocker (${members.length})`,
              icon: <Users className="w-4 h-4" />,
            },
            {
              id: 'diagnostics',
              label: `3. Admin & Member Portal Live Fixer (${portalDiagnostics.length})`,
              icon: <Wrench className="w-4 h-4" />,
            },
            {
              id: 'boards',
              label: '4. All Categorized Portals, Boards & Tools (110+)',
              icon: <LayoutGrid className="w-4 h-4" />,
            },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                  : 'bg-zinc-900/90 text-gray-300 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: ALL ADMINS & GYM SUBSCRIPTION AUTO-UNLOCK ENGINE */}
      {activeTab === 'admins' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
                Admin Account Governance & Monthly/Yearly Package Gate
              </span>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight mt-1">
                All Admin Accounts, Credentials & Auto-Unlock Subscription Control
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Admin Panels require an active Monthly or Yearly package to operate. Assign a package below to automatically unlock any Admin Portal, or manually Lock/Unlock with one click.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  placeholder="Search Admin, Gym, Email, Phone..."
                  className="bg-black border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex bg-black p-1 rounded-xl border border-white/10">
                {(['all', 'unlocked', 'locked'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setAdminFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      adminFilter === f ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {filteredTenants.map(tenant => {
              const isLocked = Boolean(tenant.account_locked) && !globalMasterOverride.forceUnlockAllAdmins;
              const passKey = `admin_${tenant.gym_id}`;
              const isPassShown = revealedPasswords[passKey];

              return (
                <div
                  key={tenant.gym_id}
                  className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                    isLocked
                      ? 'bg-red-950/10 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
                      : 'bg-black/80 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
                  }`}
                >
                  {/* Top Status Bar */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-white uppercase tracking-tight">
                            {tenant.gym_name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">
                            {tenant.plan_cycle || 'Monthly'}
                          </span>
                        </div>
                        <p className="text-xs text-cyan-400 font-bold mt-0.5">
                          {tenant.admin_name || 'Primary Gym Administrator'}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
                          isLocked
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {isLocked ? 'PANEL LOCKED' : 'ACTIVE & UNLOCKED'}
                      </span>
                    </div>

                    {/* Stored Admin Credentials & Details */}
                    <div className="bg-zinc-950/90 border border-white/10 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">Admin Login ID:</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {tenant.admin_login_id || `ADMIN-${tenant.gym_id.toUpperCase().slice(0, 6)}`}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">Stored Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-gray-200">
                            {isPassShown ? 'FitnessFuture#2026' : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(passKey)}
                            className="text-gray-400 hover:text-white cursor-pointer"
                            title="Show/Hide Stored Password"
                          >
                            {isPassShown ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">Email:</span>
                        <span className="font-mono text-gray-300 truncate max-w-[180px]">{tenant.email_id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">Phone / WhatsApp:</span>
                        <span className="font-mono text-gray-300">{tenant.phone_number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">UPI Merchant ID:</span>
                        <span className="font-mono text-emerald-400">{tenant.upi_id}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">Active Package:</span>
                        <span className="font-bold text-white">
                          {tenant.plan_name || 'Elite AI Cortex'} (₹{(tenant.plan_amount || 4999).toLocaleString()})
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-[10px] uppercase font-bold">Valid Until:</span>
                        <span className="font-mono text-cyan-400">
                          {tenant.subscription_expiry_date || '2026-12-31'}
                        </span>
                      </div>
                    </div>

                    {/* Active Issues Alert if any */}
                    {tenant.active_issues && tenant.active_issues.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-amber-300 text-[11px]">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>{tenant.active_issues[0]}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            repairTenantPortal(tenant.gym_id);
                            addToast(`Repaired all issues and unlocked ${tenant.gym_name}!`, 'success');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[10px] font-black uppercase shrink-0 cursor-pointer"
                        >
                          Fix Now
                        </button>
                      </div>
                    )}

                    {/* Manual Lock/Unlock + Auto-Unlock Controls */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          toggleTenantLock(tenant.gym_id);
                          addToast(
                            isLocked
                              ? `Admin Panel for ${tenant.gym_name} manually UNLOCKED by Super Admin!`
                              : `Admin Panel for ${tenant.gym_name} LOCKED by Super Admin.`,
                            isLocked ? 'success' : 'warning'
                          );
                        }}
                        className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          isLocked
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                            : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30'
                        }`}
                      >
                        {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {isLocked ? 'Unlock Admin Now' : 'Lock Admin Panel'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleTenantAutoUnlock(tenant.gym_id);
                          addToast(
                            `Auto-Unlock on Package Payment ${!tenant.auto_unlock_enabled ? 'ENABLED' : 'DISABLED'} for ${tenant.gym_name}`,
                            'info'
                          );
                        }}
                        className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          tenant.auto_unlock_enabled !== false
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                            : 'bg-zinc-900 text-gray-500 border-white/10'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Auto-Unlock: {tenant.auto_unlock_enabled !== false ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Monthly / Yearly Package Assignment & Instant Auto-Unlock */}
                  <div className="pt-4 border-t border-white/10 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Assign Package & Auto-Unlock Admin Portal:
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleAdminPackageActivation(tenant.gym_id, tenant.gym_name, 'Monthly')}
                        className="py-2.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 hover:text-black text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center"
                      >
                        <span>Activate Monthly</span>
                        <span className="text-[9px] opacity-80 font-mono">₹4,999 / 30 Days</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdminPackageActivation(tenant.gym_id, tenant.gym_name, 'Yearly')}
                        className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex flex-col items-center"
                      >
                        <span>Activate Yearly</span>
                        <span className="text-[9px] opacity-80 font-mono">₹47,990 / 365 Days</span>
                      </button>
                    </div>

                    {/* Module Level Permissions */}
                    <div className="pt-2">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-2">
                        Portal Module Controls (Click to Toggle):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ['adminPortal', 'Admin Hub'],
                            ['memberPortal', 'Member App'],
                            ['aiAgents', 'AI Agents'],
                            ['billingPOS', 'Billing/POS'],
                            ['biometrics', 'Biometrics'],
                            ['iotHardware', 'IoT/3D'],
                          ] as const
                        ).map(([permKey, label]) => {
                          const enabled = tenant.module_permissions?.[permKey] ?? true;
                          return (
                            <button
                              key={permKey}
                              type="button"
                              onClick={() => {
                                updateTenantPermissions(tenant.gym_id, { [permKey]: !enabled });
                                addToast(`${tenant.gym_name}: ${label} ${!enabled ? 'Enabled' : 'Disabled'}`, 'info');
                              }}
                              className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border transition-all cursor-pointer ${
                                enabled
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-red-500/15 text-red-400 border-red-500/30 line-through'
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ALL MEMBERS DIRECTORY, CREDENTIALS & ACCOUNT UNLOCKER */}
      {activeTab === 'members' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
                Complete Member Database & Account Lock/Auto-Unlock Control
              </span>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight mt-1">
                All Stored Member Profiles, Login Credentials & Instant Plan Unlocker
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Every member’s complete profile, credentials, health metrics, and account lock state are stored here. Unlock any member manually or activate their Monthly/Yearly package for automatic unlock.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search member name, phone, ID..."
                  className="bg-black border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex bg-black p-1 rounded-xl border border-white/10">
                {(['all', 'active', 'locked'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMemberFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      memberFilter === f ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleUnlockAllMembers}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <Unlock className="w-3.5 h-3.5" />
                Unlock All Members
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredMembers.map(member => {
              const gov = memberGovernance[member.id];
              const isLocked =
                !globalMasterOverride.forceUnlockAllMembers &&
                (gov?.locked || member.status === 'Expired' || member.status === 'Inactive');
              const autoUnlock = gov?.autoUnlockOnPackage ?? true;
              const passKey = `member_${member.id}`;
              const isPassShown = revealedPasswords[passKey];

              return (
                <div
                  key={member.id}
                  className={`rounded-3xl p-5 border transition-all flex flex-col justify-between space-y-4 ${
                    isLocked
                      ? 'bg-red-950/10 border-red-500/40'
                      : 'bg-black/80 border-white/10 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
                          alt={member.name}
                          className="w-12 h-12 rounded-2xl object-cover border border-white/15"
                        />
                        <div>
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">
                            {member.name}
                          </h4>
                          <p className="text-[10px] font-mono text-cyan-400">
                            ID: #{member.id} • Login: {member.loginId || `FF-M${100 + member.id}`}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                          isLocked
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {isLocked ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                    </div>

                    <div className="bg-zinc-950 border border-white/5 rounded-2xl p-3.5 space-y-1.5 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px] font-bold">Phone / WhatsApp:</span>
                        <span className="font-mono text-gray-200">{member.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px] font-bold">Email:</span>
                        <span className="font-mono text-gray-300 truncate max-w-[170px]">{member.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 uppercase text-[9px] font-bold">Stored Password:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-amber-300">
                            {isPassShown ? member.password || `Athlete@${member.id}2026` : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordReveal(passKey)}
                            className="text-gray-400 hover:text-white cursor-pointer"
                          >
                            {isPassShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px] font-bold">Health / Bio Age:</span>
                        <span className="text-emerald-400 font-bold">
                          Score {member.health_score || 90}% • Bio Age {member.bio_age || 24}y
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 uppercase text-[9px] font-bold">Package & Expiry:</span>
                        <span className="font-mono text-cyan-300">
                          {gov?.packageCycle || 'Monthly'} • {gov?.expiryDate || '2026-12-31'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleMemberLockToggle(member)}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          isLocked
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25'
                        }`}
                      >
                        {isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {isLocked ? 'Unlock Member' : 'Lock Account'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toggleMemberAutoUnlock(member.id);
                          addToast(`Member Auto-Unlock on Renewal toggled for ${member.name}`, 'info');
                        }}
                        className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                          autoUnlock
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : 'bg-zinc-900 text-gray-500 border-white/10'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        Auto-Unlock: {autoUnlock ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleMemberPackageAutoUnlock(member, 'Monthly')}
                        className="py-2 px-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 hover:text-black text-indigo-300 border border-indigo-500/30 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        + Monthly (₹2,500) Unlock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemberPackageAutoUnlock(member, 'Yearly')}
                        className="py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        + Yearly (₹24,000) Unlock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DUAL-PORTAL DIAGNOSTIC & LIVE ISSUE REPAIR CONSOLE */}
      {activeTab === 'diagnostics' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                Super Admin Cross-Portal Diagnostic & Self-Healing Console
              </span>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight mt-1">
                Admin Portal & Member Portal Live Health & Issue Fixer
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                If any discrepancy, lock state, or sync issue occurs in either the Admin Portal or Member Portal, inspect and repair it immediately from here.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  repairAllPortalIssues('Admin Portal');
                  addToast('Admin Portal repaired and all modules verified!', 'success');
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500 hover:text-black text-indigo-300 border border-indigo-500/40 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Repair Admin Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  repairAllPortalIssues('Member Portal');
                  addToast('Member Portal repaired and all athlete modules synced!', 'success');
                }}
                className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 hover:text-black text-cyan-300 border border-cyan-500/40 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Repair Member Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  repairAllPortalIssues('All');
                  addToast('All Admin & Member Portal Diagnostics Repaired to 100%!', 'success');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.3)]"
              >
                Repair All Portals Now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {portalDiagnostics.map(diag => {
              const isDetected = diag.status === 'Detected';
              return (
                <div
                  key={diag.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
                    isDetected
                      ? 'bg-amber-950/15 border-amber-500/40'
                      : 'bg-black/80 border-emerald-500/30'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
                        {diag.portal} • {diag.category}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          isDetected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-white uppercase tracking-tight">
                      {diag.issueTitle}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{diag.description}</p>
                    <p className="text-[10px] font-mono text-gray-500">
                      Target Module: <span className="text-gray-300">{diag.module}</span> • Checked: {diag.lastChecked}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-emerald-400">
                      {isDetected ? 'Action Recommended' : '✓ Verified Optimal'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        repairDiagnosticIssue(diag.id);
                        addToast(`${diag.portal}: "${diag.issueTitle}" auto-repaired!`, 'success');
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                        isDetected
                          ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      {diag.fixActionLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ALL 110+ CATEGORIZED PORTALS, BOARDS & SMART TOOLS */}
      {activeTab === 'boards' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-400">
                Complete Super App Feature & Board Matrix
              </span>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight mt-1">
                Every Feature, Board & Tool Across Super Admin, Admin & Member Portals
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                All historical and newly upgraded features are preserved, categorized, and directly accessible below. Click any card to launch that module immediately.
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={boardSearch}
                onChange={e => setBoardSearch(e.target.value)}
                placeholder="Search any board, AI tool or portal..."
                className="w-full bg-black border border-white/15 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-fuchsia-500"
              />
            </div>
          </div>

          <div className="space-y-8">
            {filteredBoardCategories.map(cat => (
              <div key={cat.category} className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    {cat.category}
                  </h4>
                  <span className="text-[10px] font-mono text-gray-500 uppercase">
                    {cat.items.length} Modules
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {cat.items.map(board => (
                    <button
                      key={board.id}
                      type="button"
                      onClick={() => setCurrentView(board.id)}
                      className="text-left p-4 rounded-2xl bg-black/80 hover:bg-zinc-900 border border-white/10 hover:border-cyan-500/50 transition-all group flex flex-col justify-between gap-3 cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-white/5 text-cyan-400">
                            {board.portal}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                        <p className="text-xs font-black text-white uppercase tracking-wide group-hover:text-cyan-300 transition-colors">
                          {board.label}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{board.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminMasterGovernance;
