import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { advanceSystem } from '../core/AdvancedSystemCore';
import { useTenantStore } from '../store/useTenantStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { safeAIParse } from '../aiHandler';
import { safeSmartJsonParse } from '../neuralParser';

function getAllSourceFiles(dir: string, fileList: string[] = []): string[] {
    if (!fs.existsSync(dir)) return fileList;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
                getAllSourceFiles(fullPath, fileList);
            }
        } else if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

describe('Fitness Future OS — Deep Layer-by-Layer Verification Suite', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    it('1. Cybersecurity Layer: AES-GCM WebCrypto encryption produces valid ciphertext and IV', async () => {
        const sensitiveData = 'User_Blood_Pressure_120_80';
        const encrypted = await advanceSystem.encryptData(sensitiveData);
        expect(encrypted).not.toBeNull();
        expect(encrypted?.ciphertext).toBeDefined();
        expect(encrypted?.iv).toBeDefined();
        expect(encrypted?.iv.length).toBeGreaterThanOrEqual(12);
    });

    it('2. Machine Learning Layer: Z-Score Anomaly Detection flags biometric outliers accurately', () => {
        const historicalHeartRates = [70, 72, 71, 73, 69, 70, 72];
        const normalHeartRate = 74;
        const anomalyHeartRate = 180;

        expect(advanceSystem.detectAnomaly(normalHeartRate, historicalHeartRates)).toBe(false);
        expect(advanceSystem.detectAnomaly(anomalyHeartRate, historicalHeartRates)).toBe(true);
    });

    it('3. System Caching Layer: LRU Cache & TTL expiration work deterministically', () => {
        advanceSystem.setCache('user_session', { id: 123, role: 'Admin' }, 1);
        expect(advanceSystem.getCache('user_session')).toEqual({ id: 123, role: 'Admin' });

        vi.advanceTimersByTime(2 * 60 * 1000);
        expect(advanceSystem.getCache('user_session')).toBeNull();
    });

    it('4. AI Resilience Layer: safeAIParse and safeSmartJsonParse handle markdown-fenced and malformed JSON safely', () => {
        const fenced = '```json\n{"action":"unlock_gate","reply":"Gate unlocked."}\n```';
        const parsed = safeAIParse(fenced, { action: 'unknown', reply: 'Fallback' });
        expect(parsed).toEqual({ action: 'unlock_gate', reply: 'Gate unlocked.' });

        const corrupted = 'Some random non-JSON text {{{broken';
        const fallback = safeAIParse(corrupted, { action: 'unknown', reply: 'Safe Fallback' });
        expect(fallback).toEqual({ action: 'unknown', reply: 'Safe Fallback' });

        const dietParsed = safeSmartJsonParse('Here is the JSON:\n{"dietPlanName":"Keto Protocol","caloriesKcal":1950}\n');
        expect(dietParsed.dietPlanName).toBe('Keto Protocol');
        expect(dietParsed.caloriesKcal).toBe(1950);
    });

    it('5. Multi-Tenant Store Layer: Portal lock/unlock, subscription auto-unlock, and global overrides work smoothly', () => {
        const store = useTenantStore.getState();
        expect(store.tenants.length).toBeGreaterThanOrEqual(2);

        const targetId = store.tenants[0].gym_id;
        store.toggleTenantLock(targetId, true);
        expect(useTenantStore.getState().tenants.find(t => t.gym_id === targetId)?.account_locked).toBe(true);

        // Activating subscription automatically unlocks and sets status to Active
        store.activateTenantSubscription(targetId, 'Yearly', 'Quantum Overmind Yearly', 47990);
        const updatedTenant = useTenantStore.getState().tenants.find(t => t.gym_id === targetId);
        expect(updatedTenant?.account_locked).toBe(false);
        expect(updatedTenant?.subscription_status).toBe('Active');

        // Global master override
        store.toggleGlobalMasterOverride('forceUnlockAllAdmins', true);
        expect(useTenantStore.getState().globalMasterOverride.forceUnlockAllAdmins).toBe(true);
        store.toggleGlobalMasterOverride('forceUnlockAllAdmins', false);
        expect(useTenantStore.getState().globalMasterOverride.forceUnlockAllAdmins).toBe(false);
    });

    it('6. Currency Store Layer: Multi-currency formatting operates without NaN errors', () => {
        const currencyStore = useCurrencyStore.getState();
        const inrFormatted = currencyStore.formatCurrency(1000);
        expect(inrFormatted).toContain('₹');
        expect(currencyStore.currencySymbol).toBe('₹');
    });

    it('7. UI & Asset Integrity Layer: Zero broken empty <img /> tags and zero Hindi/Devanagari characters across all code files', () => {
        const rootDir = process.cwd();
        const files = [
            ...getAllSourceFiles(path.join(rootDir, 'utils')),
            ...getAllSourceFiles(path.join(rootDir, 'lib')),
            path.join(rootDir, 'server.ts'),
        ].filter(f => fs.existsSync(f));

        const emptyImgFiles: string[] = [];
        const hindiFiles: string[] = [];
        const devanagariRegex = /[\u0900-\u097F]/;
        const emptyImgRegex = /<img\s*\/>/;

        for (const file of files) {
            const content = fs.readFileSync(file, 'utf8');
            if (emptyImgRegex.test(content)) {
                emptyImgFiles.push(path.relative(rootDir, file));
            }
            if (devanagariRegex.test(content)) {
                hindiFiles.push(path.relative(rootDir, file));
            }
        }

        expect(emptyImgFiles).toEqual([]);
        expect(hindiFiles).toEqual([]);
    });

    it('8. Responsive Architecture Layer: Header, Sidebar, AppContent, and MemberPortal support Mobile, Tablet, and Desktop breakpoints', () => {
        const rootDir = process.cwd();
        const headerCode = fs.readFileSync(path.join(rootDir, 'utils/components/Header.tsx'), 'utf8');
        const sidebarCode = fs.readFileSync(path.join(rootDir, 'utils/components/Sidebar.tsx'), 'utf8');
        const appContentCode = fs.readFileSync(path.join(rootDir, 'utils/components/AppContent.tsx'), 'utf8');
        const memberPortalCode = fs.readFileSync(path.join(rootDir, 'utils/components/member/MemberPortal.tsx'), 'utf8');

        // Header has mobile/tablet hamburger trigger (lg:hidden) and onToggleSidebar prop
        expect(headerCode).toContain('onToggleSidebar');
        expect(headerCode).toContain('lg:hidden');

        // Sidebar acts as responsive drawer on <1024px and static sidebar on lg+
        expect(sidebarCode).toContain('lg:static');
        expect(sidebarCode).toContain('lg:translate-x-0');

        // AppContent has mobile/tablet quick-navigation bottom dock and ErrorBoundary resetKey
        expect(appContentCode).toContain('resetKey={currentView}');
        expect(appContentCode).toContain('lg:hidden');

        // MemberPortal wires onToggleSidebar to Header
        expect(memberPortalCode).toContain('onToggleSidebar');
    });
});
