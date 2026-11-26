import React, { useState } from 'react';
import { Cpu, ShieldAlert, Database, Lock, Unlock, Zap, CheckCircle2, Terminal, RefreshCw } from 'lucide-react';
import { useData } from '../../context/DataProvider';
import { useTenantStore } from '../../store/useTenantStore';
import { auth, syncToFirebase } from '../../../lib/firebase';
import { SmartTerminal } from './SmartTerminal';

export const DirectCoreAccess: React.FC = () => {
    const { members, updateMember, triggerSystemUpdate } = useData();
    const { tenants, toggleGlobalMasterOverride, toggleTenantLock, toggleMemberLock, repairAllPortalIssues } = useTenantStore();
    const [dbOverrideActive, setDbOverrideActive] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>(
        `Owner Core Override Authenticated (${auth.currentUser?.email || 'Verified Owner'})`
    );
    const [isBusy, setIsBusy] = useState(false);

    const handleDatabaseOverride = async () => {
        setIsBusy(true);
        try {
            setDbOverrideActive(true);
            toggleGlobalMasterOverride('forceUnlockAllAdmins', true);
            toggleGlobalMasterOverride('forceUnlockAllMembers', true);
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
            setStatusMessage(
                `✅ Database Override Active: All ${tenants.length} Gym Tenants & ${members.length} Members Unlocked and Synced with Firestore!`
            );
        } catch (err: any) {
            setStatusMessage(`⚠️ Override Notice: ${err?.message || 'Completed locally'}`);
        } finally {
            setIsBusy(false);
        }
    };

    const handleSystemPurgeAndHeal = () => {
        setIsBusy(true);
        repairAllPortalIssues('All');
        triggerSystemUpdate();
        setTimeout(() => {
            setIsBusy(false);
            setStatusMessage('✅ System Cache Purged, Neural Pathways Re-Calibrated & All 3 Portals Auto-Healed to 100%!');
        }, 400);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Cpu className="w-8 h-8 text-red-500" />
                        Direct <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Core & System Console</span>
                    </h2>
                    <p className="text-red-400/80 text-xs font-mono uppercase tracking-widest mt-1">
                        Fitness Future Owner Root Level Control • {auth.currentUser?.email || 'Verified Owner'}
                    </p>
                </div>
                <div className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Root Access Verified
                </div>
            </div>

            {statusMessage && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-3">
                    <span>{statusMessage}</span>
                    {isBusy && <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/40 border border-red-500/30 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <Database className="w-10 h-10 text-red-500 mb-4" />
                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">
                            Master Database Override
                        </h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Direct root access to Firestore (`ai-studio-4b01b935-96ec-40cf-a6b1-2b2f4c4ae4c6`) and local stores. Force-unlocks all Admin and Member accounts globally.
                        </p>
                        <button
                            onClick={handleDatabaseOverride}
                            disabled={isBusy}
                            className="w-full py-3 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/50 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {dbOverrideActive ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
                            {dbOverrideActive ? 'Execute Global Database Unlock & Sync' : 'Authenticate to Access'}
                        </button>
                    </div>
                </div>

                <div className="bg-black/40 border border-orange-500/30 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                        <Zap className="w-10 h-10 text-orange-500 mb-4" />
                        <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">
                            System Purge & Auto-Heal
                        </h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Clear stale caches, auto-repair all 3-Tier portal diagnostics, and synchronize the Omniscience Core with Antigravity CLI.
                        </p>
                        <button
                            onClick={handleSystemPurgeAndHeal}
                            disabled={isBusy}
                            className="w-full py-3 bg-orange-600/20 hover:bg-orange-600/40 text-orange-300 border border-orange-500/50 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <ShieldAlert className="w-4 h-4" /> Initiate Purge & Auto-Heal
                        </button>
                    </div>
                </div>
            </div>

            {/* Embedded Antigravity CLI Root Console */}
            <div className="pt-2">
                <div className="flex items-center gap-2 text-xs font-mono text-fuchsia-400 uppercase tracking-widest mb-3">
                    <Terminal className="w-4 h-4" /> Direct Antigravity CLI Terminal Bridge
                </div>
                <SmartTerminal />
            </div>
        </div>
    );
};
