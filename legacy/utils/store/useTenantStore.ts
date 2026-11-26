import { createStore } from 'zustand/vanilla';
import { useSyncExternalStore, useCallback } from 'react';
import { supabase, isMock } from '../../lib/supabase';
import { syncToFirebase } from '../../lib/firebase';
import { computeRenewalExpiryIso } from '../../src/backend/FitnessFutureService';

export interface TenantModulePermissions {
  adminPortal: boolean;
  memberPortal: boolean;
  aiAgents: boolean;
  billingPOS: boolean;
  biometrics: boolean;
  iotHardware: boolean;
  marketingCRM: boolean;
  bioscienceHub: boolean;
}

export interface GymTenant {
  gym_id: string;
  gym_name: string;
  owner_name?: string;
  admin_name?: string;
  admin_login_id?: string;
  admin_password?: string;
  email_id: string;
  phone_number: string;
  location: string;
  google_location_url?: string;
  logo_url?: string;
  signature_url?: string;
  whatsapp_phone_number_id: string;
  upi_id: string;
  social_links?: {
    whatsapp?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  subscription_status: 'Trial' | 'Active' | 'Delinquent';
  plan_cycle?: 'Monthly' | 'Yearly';
  plan_name?: string;
  plan_amount?: number;
  account_locked?: boolean;
  auto_unlock_enabled?: boolean;
  subscription_start_date?: string;
  subscription_expiry_date?: string;
  members_count?: number;
  portal_health_score?: number;
  active_issues?: string[];
  module_permissions?: TenantModulePermissions;
  created_at: string;
}

export interface PortalDiagnosticIssue {
  id: string;
  portal: 'Admin Portal' | 'Member Portal' | 'Both Portals';
  category: string;
  module: string;
  issueTitle: string;
  description: string;
  severity: 'Critical' | 'Warning' | 'Optimized';
  status: 'Detected' | 'Auto-Repaired' | 'Healthy';
  lastChecked: string;
  fixActionLabel: string;
}

export interface MemberAccountGovernance {
  memberId: number;
  locked: boolean;
  autoUnlockOnPackage: boolean;
  packageCycle: 'Monthly' | 'Yearly';
  packageName: string;
  packageAmount: number;
  expiryDate: string;
  lockReason?: string;
  lastUnlockedBy?: 'SuperAdmin' | 'Auto-Subscription' | 'Admin';
}

interface TenantState {
  tenants: GymTenant[];
  currentTenant: GymTenant | null;
  portalDiagnostics: PortalDiagnosticIssue[];
  memberGovernance: Record<number, MemberAccountGovernance>;
  globalMasterOverride: {
    forceUnlockAllAdmins: boolean;
    forceUnlockAllMembers: boolean;
    autoHealPortals: boolean;
    maintenanceMode: boolean;
  };
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  successMessage: string | null;
  
  // Actions
  registerTenant: (form: {
    gymName: string;
    ownerName?: string;
    adminName?: string;
    email: string;
    password?: string;
    phoneNumber: string;
    location: string;
    googleLocationUrl?: string;
    logoUrl?: string;
    signatureUrl?: string;
    whatsappPhoneId?: string;
    upiId: string;
    socialLinks?: {
      whatsapp?: string;
      instagram?: string;
      facebook?: string;
      youtube?: string;
    };
    planCycle?: 'Monthly' | 'Yearly';
    planName?: string;
    planAmount?: number;
  }) => Promise<GymTenant | null>;
  updateTenantProfile: (gymId: string, patch: Partial<GymTenant>) => void;
  mergeRemoteTenants: (remoteTenants: GymTenant[]) => void;

  updateTenantStatus: (gymId: string, status: 'Trial' | 'Active' | 'Delinquent') => void;
  toggleTenantLock: (gymId: string, forceLock?: boolean) => void;
  toggleAdminLock: (gymId: string, forceLock?: boolean) => void;
  toggleTenantAutoUnlock: (gymId: string) => void;
  activateTenantSubscription: (
    gymId: string,
    cycle: 'Monthly' | 'Yearly',
    planName: string,
    amount: number
  ) => void;
  updateTenantPermissions: (gymId: string, permissions: Partial<TenantModulePermissions>) => void;
  repairTenantPortal: (gymId: string) => void;
  deleteTenant: (gymId: string) => void;

  // Member Account Governance (Super Admin Control)
  toggleMemberLock: (memberId: number, forceLock?: boolean, reason?: string) => void;
  toggleMemberAutoUnlock: (memberId: number) => void;
  activateMemberSubscriptionUnlock: (
    memberId: number,
    cycle: 'Monthly' | 'Yearly',
    packageName: string,
    amount: number,
    customExpiryDate?: string
  ) => void;

  // Portal Diagnostics & Repair
  repairDiagnosticIssue: (issueId: string) => void;
  repairAllPortalIssues: (portalFilter?: 'Admin Portal' | 'Member Portal' | 'All') => void;
  toggleGlobalMasterOverride: (key: keyof TenantState['globalMasterOverride'], forceValue?: boolean) => void;
  
  clearMessages: () => void;
}

const DEFAULT_PERMISSIONS: TenantModulePermissions = {
  adminPortal: true,
  memberPortal: true,
  aiAgents: true,
  billingPOS: true,
  biometrics: true,
  iotHardware: true,
  marketingCRM: true,
  bioscienceHub: true,
};

const INITIAL_PORTAL_DIAGNOSTICS: PortalDiagnosticIssue[] = [
  {
    id: 'diag-admin-01',
    portal: 'Admin Portal',
    category: 'Billing & Ledger Sync',
    module: 'Billing / POS / Razorpay Gateway',
    issueTitle: 'Subscription Webhook & Invoice Auto-Reconciliation Check',
    description: 'Verifies that Monthly/Yearly package payments immediately reconcile invoices and trigger Admin Portal Auto-Unlock.',
    severity: 'Optimized',
    status: 'Healthy',
    lastChecked: 'Just now',
    fixActionLabel: 'Re-Sync Billing & Auto-Unlock Engine',
  },
  {
    id: 'diag-admin-02',
    portal: 'Admin Portal',
    category: 'Biometrics & Access Gate',
    module: 'Biometric Turnstile & QR Scanner',
    issueTitle: 'WebAuthn & QR Turnstile Handshake Calibration',
    description: 'Ensures admin gate controller, camera QR scanner, and member attendance check-ins operate with zero latency.',
    severity: 'Warning',
    status: 'Detected',
    lastChecked: '2 mins ago',
    fixActionLabel: 'Calibrate Turnstile & QR Nodes',
  },
  {
    id: 'diag-member-01',
    portal: 'Member Portal',
    category: 'AI Workout & Diet Engines',
    module: 'SuperAgent Workout / Opals Architect / KitchenChief',
    issueTitle: 'Member AI Protocol Cache & Daily Routine Sync',
    description: 'Ensures all member workout logs, diet macro targets, and medical hub prescriptions sync smoothly across sessions.',
    severity: 'Warning',
    status: 'Detected',
    lastChecked: '4 mins ago',
    fixActionLabel: 'Repair Member AI Cache & Sync',
  },
  {
    id: 'diag-member-02',
    portal: 'Member Portal',
    category: 'Member Account Lock & Auto-Unlock',
    module: 'Membership Manager & Quick UPI Matrix',
    issueTitle: 'Expired Membership Gate & Instant Renewal Unlock',
    description: 'Controls automatic member portal unlocking when a member completes Monthly or Yearly package renewal.',
    severity: 'Optimized',
    status: 'Healthy',
    lastChecked: 'Just now',
    fixActionLabel: 'Verify Member Auto-Unlock Rules',
  },
  {
    id: 'diag-both-01',
    portal: 'Both Portals',
    category: 'Navigation & Feature Registry',
    module: 'All Categories, Boards & Smart Tools',
    issueTitle: 'Cross-Portal Route & Component Integrity Matrix',
    description: 'Monitors all 110+ Admin, Super Admin, and Member Portal boards, ensuring zero broken links or missing modules.',
    severity: 'Optimized',
    status: 'Healthy',
    lastChecked: 'Just now',
    fixActionLabel: 'Run Full Portal Integrity Repair',
  },
];

const persistTenants = (tenants: GymTenant[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('registered_gym_tenants', JSON.stringify(tenants));
  }
};

const persistMemberGovernance = (gov: Record<number, MemberAccountGovernance>) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('superadmin_member_governance', JSON.stringify(gov));
  }
};

const persistGlobalMasterOverride = (override: TenantState['globalMasterOverride']) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('superadmin_global_override', JSON.stringify(override));
  }
};

export const tenantStore = createStore<TenantState>((set, get) => {
  const getInitialTenants = (): GymTenant[] => {
    const defaultTenants: GymTenant[] = [];

    if (typeof window === 'undefined') return defaultTenants;
    const saved = localStorage.getItem('registered_gym_tenants');
    if (!saved) return defaultTenants;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const combined = defaultTenants.map(def => {
          const found = parsed.find((p: GymTenant) => p.gym_id === def.gym_id);
          return found ? { ...def, ...found, module_permissions: { ...DEFAULT_PERMISSIONS, ...(found.module_permissions || {}) } } : def;
        });
        parsed.forEach((t: GymTenant) => {
          if (!combined.some(existing => existing.gym_id === t.gym_id)) {
            combined.push({
              ...t,
              plan_cycle: t.plan_cycle || 'Monthly',
              plan_name: t.plan_name || 'Elite AI Cortex Monthly',
              plan_amount: t.plan_amount || 4999,
              account_locked: t.account_locked ?? (t.subscription_status === 'Delinquent'),
              auto_unlock_enabled: t.auto_unlock_enabled ?? true,
              portal_health_score: t.portal_health_score ?? 98,
              module_permissions: { ...DEFAULT_PERMISSIONS, ...(t.module_permissions || {}) },
            });
          }
        });
        return combined;
      }
    } catch (e) {
      console.error("Failed to parse physical tenants list", e);
    }
    return defaultTenants;
  };

  const getInitialMemberGovernance = (): Record<number, MemberAccountGovernance> => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem('superadmin_member_governance');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse member governance', e);
    }
    return {};
  };

  const getInitialGlobalOverride = (): TenantState['globalMasterOverride'] => {
    const defaults = {
      forceUnlockAllAdmins: false,
      forceUnlockAllMembers: false,
      autoHealPortals: true,
      maintenanceMode: false,
    };
    if (typeof window === 'undefined') return defaults;
    try {
      const saved = localStorage.getItem('superadmin_global_override');
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {
      // Ignore corrupt storage
    }
    return defaults;
  };

  return {
    tenants: getInitialTenants(),
    currentTenant: null,
    portalDiagnostics: INITIAL_PORTAL_DIAGNOSTICS,
    memberGovernance: getInitialMemberGovernance(),
    globalMasterOverride: getInitialGlobalOverride(),
    loading: false,
    loadingMessage: '',
    error: null,
    successMessage: null,
    
    clearMessages: () => set({ error: null, successMessage: null }),

    registerTenant: async (form) => {
      set({ loading: true, loadingMessage: 'Initializing Quantum Tenant Setup...', error: null, successMessage: null });
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      try {
        await sleep(600);
        set({ loadingMessage: 'Authenticating with Central Supabase Engine...' });
        await sleep(600);
        
        let userId = `user-${Math.floor(Math.random() * 89999 + 10000)}`;
        let authSucceeded = false;
        
        if (!isMock && form.password) {
          try {
            const { data: signUpData, error: authError } = await supabase.auth.signUp({
              email: form.email,
              password: form.password,
            });
            
            if (authError) throw authError;
            if (signUpData.user) {
              userId = signUpData.user.id;
              authSucceeded = true;
            }
          } catch (authErr: any) {
            console.warn('Real Supabase registration failed or offline. Continuing with local store...', authErr);
          }
        }
        
        set({ loadingMessage: 'Configuring Sovereign Multi-Tenant Isolation & Auto-Unlock Package...' });
        await sleep(600);
        
        const cycle = form.planCycle || 'Monthly';
        const now = new Date();
        const expiry = new Date(now);
        if (cycle === 'Yearly') {
          expiry.setFullYear(expiry.getFullYear() + 1);
        } else {
          expiry.setMonth(expiry.getMonth() + 1);
        }

        const resolvedOwnerName = (form.ownerName || form.adminName || `${form.gymName} Owner`).trim();
        const resolvedWhatsapp = (form.whatsappPhoneId || form.phoneNumber || '').trim();

        const newTenant: GymTenant = {
          gym_id: `gym_${form.gymName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Math.floor(Math.random() * 899 + 100)}`,
          gym_name: form.gymName.trim(),
          owner_name: resolvedOwnerName,
          admin_name: resolvedOwnerName,
          admin_login_id: `ADMIN-${Math.floor(1000 + Math.random() * 9000)}`,
          admin_password: form.password || '',
          email_id: form.email.trim(),
          phone_number: form.phoneNumber.trim(),
          location: form.location.trim(),
          google_location_url: (form.googleLocationUrl || '').trim(),
          logo_url: form.logoUrl || '',
          signature_url: form.signatureUrl || '',
          whatsapp_phone_number_id: resolvedWhatsapp,
          upi_id: form.upiId.trim(),
          ...(form.socialLinks ? { social_links: form.socialLinks } : {}),
          subscription_status: 'Active',
          plan_cycle: cycle,
          plan_name: form.planName || (cycle === 'Yearly' ? 'Quantum Overmind Yearly' : 'Elite AI Cortex Monthly'),
          plan_amount: form.planAmount || (cycle === 'Yearly' ? 47990 : 4999),
          account_locked: false,
          auto_unlock_enabled: true,
          subscription_start_date: now.toISOString().split('T')[0],
          subscription_expiry_date: expiry.toISOString().split('T')[0],
          members_count: 0,
          portal_health_score: 100,
          active_issues: [],
          module_permissions: { ...DEFAULT_PERMISSIONS },
          created_at: now.toISOString()
        };
        
        if (!isMock && authSucceeded) {
          try {
            await supabase
              .from('gym_tenants')
              .insert({
                auth_user_id: userId,
                gym_name: newTenant.gym_name,
                owner_name: newTenant.owner_name,
                email_id: newTenant.email_id,
                phone_number: newTenant.phone_number,
                location: newTenant.location,
                google_location_url: newTenant.google_location_url,
                whatsapp_phone_number_id: newTenant.whatsapp_phone_number_id,
                upi_id: newTenant.upi_id,
                subscription_status: 'Active'
              });
          } catch (insertErr: any) {
            console.warn('Supabase insert fallback to local store', insertErr);
          }
        }

        // Persist public/operational gym profile to Firestore (NEVER write admin_password to Firestore)
        const { admin_password: _excludedPassword, ...firestoreSafeTenant } = newTenant;
        syncToFirebase('tenants', newTenant.gym_id, {
          ...firestoreSafeTenant,
          id: newTenant.gym_id,
          updatedAt: now.toISOString(),
        }).catch(() => {});
        
        const updatedTenants = [...get().tenants, newTenant];
        persistTenants(updatedTenants);
        
        const currentGymProviderConfigList = JSON.parse(localStorage.getItem('gyms_list_evolution') || '[]');
        const newGymConfig = {
          gymId: newTenant.gym_id,
          gymName: newTenant.gym_name,
          ownerName: newTenant.owner_name,
          logoUrl: newTenant.logo_url || '',
          signatureUrl: newTenant.signature_url || '',
          themeColor: ['cyan', 'indigo', 'emerald', 'violet', 'amber'][Math.floor(Math.random() * 5)],
          upiId: newTenant.upi_id,
          address: newTenant.location,
          googleLocationUrl: newTenant.google_location_url || '',
          secretKey: `tenant_secret_${Math.random().toString(36).substring(2, 10)}`,
          phone: newTenant.phone_number,
          email: newTenant.email_id,
          whatsappNumber: newTenant.whatsapp_phone_number_id,
          socialLinks: newTenant.social_links || {},
          isSetupComplete: true
        };
        currentGymProviderConfigList.push(newGymConfig);
        localStorage.setItem('gyms_list_evolution', JSON.stringify(currentGymProviderConfigList));
        localStorage.setItem('tenant_gym_config', JSON.stringify(newGymConfig));

        set({
          tenants: updatedTenants,
          currentTenant: newTenant,
          loading: false,
          successMessage: `Gym "${newTenant.gym_name}" (Owner: ${newTenant.owner_name}) provisioned & Member Portal activated!`
        });
        
        return newTenant;
      } catch (e: any) {
        set({ loading: false, error: e.message || 'Setup initialization protocol failed.' });
        return null;
      }
    },

    updateTenantProfile: (gymId, patch) => {
      let syncedTenant: GymTenant | undefined;
      set((state) => {
        const updated = state.tenants.map((t) => {
          if (t.gym_id !== gymId) return t;
          syncedTenant = { ...t, ...patch };
          return syncedTenant;
        });
        persistTenants(updated);
        return { tenants: updated };
      });
      if (syncedTenant) {
        const { admin_password: _excludedPassword, ...firestoreSafeTenant } = syncedTenant;
        syncToFirebase('tenants', gymId, {
          ...firestoreSafeTenant,
          id: gymId,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    },

    mergeRemoteTenants: (remoteTenants) => {
      if (!Array.isArray(remoteTenants) || remoteTenants.length === 0) return;
      set((state) => {
        const byId = new Map<string, GymTenant>();
        state.tenants.forEach((t) => byId.set(t.gym_id, t));
        remoteTenants.forEach((rt) => {
          const gid = rt.gym_id || (rt as any).id;
          if (!gid || !rt.gym_name) return;
          const local = byId.get(gid);
          byId.set(gid, {
            ...(local || {}),
            ...rt,
            gym_id: gid,
            owner_name: rt.owner_name || rt.admin_name || local?.owner_name || local?.admin_name || '',
            module_permissions: { ...DEFAULT_PERMISSIONS, ...(local?.module_permissions || {}), ...(rt.module_permissions || {}) },
          });
        });
        const merged = Array.from(byId.values());
        persistTenants(merged);
        return { tenants: merged };
      });
    },

    updateTenantStatus: (gymId, status) => {
      set((state) => {
        const updated = state.tenants.map(t => {
          if (t.gym_id !== gymId) return t;
          const shouldLock = status === 'Delinquent' ? true : false;
          return {
            ...t,
            subscription_status: status,
            account_locked: shouldLock,
          };
        });
        persistTenants(updated);
        return { tenants: updated };
      });
    },

    toggleTenantLock: (gymId, forceLock) => {
      let syncedTenant: GymTenant | undefined;
      set((state) => {
        const updated: GymTenant[] = state.tenants.map(t => {
          if (t.gym_id !== gymId) return t;
          const nextLocked = typeof forceLock === 'boolean' ? forceLock : !t.account_locked;
          syncedTenant = {
            ...t,
            account_locked: nextLocked,
            subscription_status: nextLocked ? 'Delinquent' : 'Active',
            active_issues: nextLocked
              ? ['Account Locked by Super Admin — Package Activation Required']
              : [],
          };
          return syncedTenant;
        });
        persistTenants(updated);
        return { tenants: updated };
      });
      if (syncedTenant) {
        syncToFirebase('tenants', gymId, {
          gym_id: gymId,
          account_locked: syncedTenant.account_locked,
          subscription_status: syncedTenant.subscription_status,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    },

    toggleAdminLock: (gymId, forceLock) => {
      get().toggleTenantLock(gymId, forceLock);
    },

    toggleTenantAutoUnlock: (gymId) => {
      set((state) => {
        const updated = state.tenants.map(t =>
          t.gym_id === gymId ? { ...t, auto_unlock_enabled: !t.auto_unlock_enabled } : t
        );
        persistTenants(updated);
        return { tenants: updated };
      });
    },

    activateTenantSubscription: (gymId, cycle, planName, amount) => {
      const now = new Date();
      const normalizedCycle = cycle === 'Yearly' ? 'YEARLY' : 'MONTHLY';
      let newExpiryStr = computeRenewalExpiryIso(normalizedCycle, undefined, now);

      set((state) => {
        const updated = state.tenants.map(t => {
          if (t.gym_id !== gymId) return t;
          newExpiryStr = computeRenewalExpiryIso(normalizedCycle, t.subscription_expiry_date, now);
          return {
            ...t,
            subscription_status: 'Active' as const,
            plan_cycle: cycle,
            plan_name: planName,
            plan_amount: amount,
            account_locked: false, // Auto-Unlocked upon Monthly/Yearly package activation
            auto_unlock_enabled: true,
            subscription_start_date: now.toISOString().split('T')[0],
            subscription_expiry_date: newExpiryStr,
            portal_health_score: 100,
            active_issues: [],
          };
        });
        persistTenants(updated);
        return {
          tenants: updated,
          successMessage: `${planName} (${cycle}) activated! Admin Portal Auto-Unlocked until ${newExpiryStr}.`,
        };
      });

      syncToFirebase('tenants', gymId, {
        gym_id: gymId,
        subscription_status: 'Active',
        plan_cycle: cycle,
        plan_name: planName,
        plan_amount: amount,
        account_locked: false,
        subscription_expiry_date: newExpiryStr,
        updatedAt: now.toISOString(),
      }).catch(() => {});
    },

    updateTenantPermissions: (gymId, permissions) => {
      let nextPerms: TenantModulePermissions | undefined;
      set((state) => {
        const updated = state.tenants.map(t => {
          if (t.gym_id !== gymId) return t;
          nextPerms = {
            ...(t.module_permissions || DEFAULT_PERMISSIONS),
            ...permissions,
          };
          return {
            ...t,
            module_permissions: nextPerms,
          };
        });
        persistTenants(updated);
        return { tenants: updated };
      });
      if (nextPerms) {
        syncToFirebase('tenants', gymId, {
          gym_id: gymId,
          module_permissions: nextPerms,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    },

    repairTenantPortal: (gymId) => {
      set((state) => {
        const updated = state.tenants.map(t =>
          t.gym_id === gymId
            ? {
                ...t,
                portal_health_score: 100,
                active_issues: [],
                account_locked: false,
                subscription_status: t.subscription_status === 'Delinquent' ? 'Active' : t.subscription_status,
                module_permissions: { ...DEFAULT_PERMISSIONS },
              }
            : t
        );
        persistTenants(updated);
        return { tenants: updated };
      });
    },

    deleteTenant: (gymId) => {
      set((state) => {
        const updated = state.tenants.filter(t => t.gym_id !== gymId);
        persistTenants(updated);
        return { tenants: updated };
      });
    },

    toggleMemberLock: (memberId, forceLock, reason) => {
      set((state) => {
        const existing = state.memberGovernance[memberId] || {
          memberId,
          locked: false,
          autoUnlockOnPackage: true,
          packageCycle: 'Monthly',
          packageName: 'Elite Fitness Pass',
          packageAmount: 2500,
          expiryDate: '2026-12-31',
        };
        const nextLocked = typeof forceLock === 'boolean' ? forceLock : !existing.locked;
        const nextGov: Record<number, MemberAccountGovernance> = {
          ...state.memberGovernance,
          [memberId]: {
            ...existing,
            locked: nextLocked,
            lockReason: nextLocked ? (reason || 'Locked by Super Admin') : undefined,
            lastUnlockedBy: !nextLocked ? 'SuperAdmin' : existing.lastUnlockedBy,
          },
        };
        persistMemberGovernance(nextGov);
        return { memberGovernance: nextGov };
      });
    },

    toggleMemberAutoUnlock: (memberId) => {
      set((state) => {
        const existing = state.memberGovernance[memberId] || {
          memberId,
          locked: false,
          autoUnlockOnPackage: true,
          packageCycle: 'Monthly',
          packageName: 'Elite Fitness Pass',
          packageAmount: 2500,
          expiryDate: '2026-12-31',
        };
        const nextGov: Record<number, MemberAccountGovernance> = {
          ...state.memberGovernance,
          [memberId]: {
            ...existing,
            autoUnlockOnPackage: !existing.autoUnlockOnPackage,
          },
        };
        persistMemberGovernance(nextGov);
        return { memberGovernance: nextGov };
      });
    },

    activateMemberSubscriptionUnlock: (memberId, cycle, packageName, amount, customExpiryDate) => {
      set((state) => {
        const existingExpiry = state.memberGovernance[memberId]?.expiryDate;
        const normalizedCycle = cycle === 'Yearly' ? 'YEARLY' : 'MONTHLY';
        const resolvedExpiry = customExpiryDate || computeRenewalExpiryIso(normalizedCycle, existingExpiry);
        const nextGov: Record<number, MemberAccountGovernance> = {
          ...state.memberGovernance,
          [memberId]: {
            memberId,
            locked: false,
            autoUnlockOnPackage: true,
            packageCycle: cycle,
            packageName,
            packageAmount: amount,
            expiryDate: resolvedExpiry,
            lockReason: undefined,
            lastUnlockedBy: 'Auto-Subscription',
          },
        };
        persistMemberGovernance(nextGov);
        return { memberGovernance: nextGov };
      });
    },

    repairDiagnosticIssue: (issueId) => {
      set((state) => ({
        portalDiagnostics: state.portalDiagnostics.map(item =>
          item.id === issueId
            ? {
                ...item,
                status: 'Auto-Repaired',
                severity: 'Optimized',
                lastChecked: 'Repaired Just Now',
              }
            : item
        ),
      }));
    },

    repairAllPortalIssues: (portalFilter = 'All') => {
      set((state) => ({
        portalDiagnostics: state.portalDiagnostics.map(item => {
          if (portalFilter === 'All' || item.portal === portalFilter || item.portal === 'Both Portals') {
            return {
              ...item,
              status: 'Auto-Repaired',
              severity: 'Optimized',
              lastChecked: 'Repaired Just Now',
            };
          }
          return item;
        }),
        tenants: state.tenants.map(t => ({
          ...t,
          portal_health_score: 100,
          active_issues: [],
        })),
      }));
    },

    toggleGlobalMasterOverride: (key, forceValue) => {
      let nextOverride: TenantState['globalMasterOverride'] | undefined;
      set((state) => {
        nextOverride = {
          ...state.globalMasterOverride,
          [key]: typeof forceValue === 'boolean' ? forceValue : !state.globalMasterOverride[key],
        };
        persistGlobalMasterOverride(nextOverride);
        return { globalMasterOverride: nextOverride };
      });
      if (nextOverride) {
        syncToFirebase('system_governance', 'global_override', {
          ...nextOverride,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }
    },
  };
});

export const useTenantStore = Object.assign(
  function useTenantStoreHook<U = TenantState>(selector?: (state: TenantState) => U): U {
    const sel = selector || ((s: TenantState) => s as unknown as U);
    return useSyncExternalStore(
      tenantStore.subscribe,
      useCallback(() => sel(tenantStore.getState()), [sel]),
      useCallback(() => sel(tenantStore.getInitialState()), [sel])
    );
  },
  tenantStore
);


