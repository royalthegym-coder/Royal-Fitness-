import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, onSnapshot, query, setDoc, deleteDoc, where } from 'firebase/firestore';
import { GYM_INFO } from '../../constants';
import { db } from '../../lib/firebase';
import { useSessionStore } from '../../lib/session';
import { GymTenant } from '../store/useTenantStore';
import { GymSocialLinks } from '../localGymDatabase';

export type { GymSocialLinks };

export interface GymConfig {
    gymId: string;
    gymName: string;
    ownerName?: string;
    logoUrl: string;
    themeColor: string;
    upiId: string;
    address: string;
    googleLocationUrl?: string;
    secretKey: string; // Tenant-Specific Encryption Key
    phone?: string;
    email?: string;
    whatsappNumber?: string;
    googleBusinessId?: string;
    isSetupComplete?: boolean;
    signatureUrl?: string; // Uploaded Gym Owner Signature image (base64/URL)
    paymentGatewayId?: string; // Merchant Payment Gateway ID
    paymentUpiId?: string; // Merchant Custom Payment UPI ID
    socialLinks?: GymSocialLinks; // Official WhatsApp, Instagram, Facebook & YouTube URLs
}

export interface ReportedInjury {
    id: string;
    gymId: string;
    memberId: number;
    memberName: string;
    injuryDate: string;
    injuryArea: string; // e.g. "Knee", "Lower Back", "Shoulder", "Elbow", "Ankle", "Hip"
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recoveryProtocol: string; // AI generated
    reportedAt: string;
}

export const tenantToGymConfig = (t: GymTenant): GymConfig => ({
    gymId: t.gym_id,
    gymName: t.gym_name,
    ownerName: t.owner_name || t.admin_name || '',
    logoUrl: t.logo_url || '',
    signatureUrl: t.signature_url || '',
    themeColor: 'amber',
    upiId: t.upi_id || '',
    address: t.location || '',
    googleLocationUrl: t.google_location_url || '',
    phone: t.phone_number || '',
    email: t.email_id || '',
    whatsappNumber: t.whatsapp_phone_number_id || t.phone_number || '',
    socialLinks: t.social_links || {},
    secretKey: '',
    isSetupComplete: true,
});

export const updateGymInfoGlobal = (gym: GymConfig) => {
    if (!gym) return;
    GYM_INFO.name = gym.gymName || GYM_INFO.name;
    GYM_INFO.address = gym.address || GYM_INFO.address;
    GYM_INFO.contact = gym.phone || GYM_INFO.contact;
    GYM_INFO.whatsappNumber = gym.whatsappNumber || gym.phone || GYM_INFO.whatsappNumber;
    GYM_INFO.email = gym.email || GYM_INFO.email;
    (GYM_INFO as any).ownerName = gym.ownerName || '';
    (GYM_INFO as any).googleLocationUrl = gym.googleLocationUrl || '';
    (GYM_INFO as any).logoUrl = gym.logoUrl || '';
    (GYM_INFO as any).signatureUrl = gym.signatureUrl || '';

    // Manual setup: set first UPI ID, remove the secondary if any is uploaded manually
    if (gym.paymentUpiId || gym.upiId) {
        GYM_INFO.upiIds.gpay1 = gym.paymentUpiId || gym.upiId;
        GYM_INFO.upiIds.gpay2 = '';
    }

    // Inject payment ID (merchant gateway metadata)
    if (gym.paymentGatewayId) {
        (GYM_INFO as any).paymentGatewayId = gym.paymentGatewayId;
    }
};

export const DEFAULT_GYM: GymConfig = {
    gymId: '',
    gymName: 'Fitness Future',
    ownerName: '',
    logoUrl: '',
    signatureUrl: '',
    themeColor: 'amber',
    upiId: '',
    address: '',
    googleLocationUrl: '',
    email: '',
    secretKey: ''
};

interface GymContextType {
    currentGym: GymConfig;
    setCurrentGym: (gym: GymConfig) => void;
    registerGymConfig: (gym: GymConfig) => void;
    updateGymSocialLinks: (links: GymSocialLinks) => Promise<void>;
    /** Merge arbitrary non-protected fields into gyms/{activeGymId}. */
    updateGymFields: (fields: Partial<GymConfig> & Record<string, any>) => Promise<void>;
    availableGyms: GymConfig[];
    reportedInjuries: ReportedInjury[];
    reportInjury: (injury: Omit<ReportedInjury, 'id' | 'reportedAt'>) => void;
    deleteReportedInjury: (id: string) => void;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

/** Firestore gyms/{gymId} -> GymConfig. secretKey is never stored server-side. */
export function gymDocToConfig(d: any): GymConfig {
    return {
        ...DEFAULT_GYM,
        ...d,
        gymId: d.gymId,
        gymName: d.gymName || 'My Gym',
        secretKey: '',
    };
}

const PROTECTED_GYM_FIELDS = ['gymId', 'ownerEmail', 'status', 'plan', 'createdBy', 'createdAtMs', 'secretKey'];

/**
 * GymProvider — the active gym comes from Firestore gyms/{activeGymId}.
 * activeGymId = the signed-in user's own gym (admin/trainer/member) or the gym the
 * super admin chose. No localStorage / IndexedDB.
 */
export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const status = useSessionStore((s) => s.status);
    const role = useSessionStore((s) => s.role);
    const activeGymId = useSessionStore((s) => s.activeGymId);
    const setSession = useSessionStore((s) => s.set);

    const [currentGym, setCurrentGymState] = useState<GymConfig>(DEFAULT_GYM);
    const [availableGyms, setAvailableGyms] = useState<GymConfig[]>([]);
    const [reportedInjuries, setReportedInjuries] = useState<ReportedInjury[]>([]);

    // Active gym document
    useEffect(() => {
        if (status !== 'ready' || !activeGymId) {
            setCurrentGymState(DEFAULT_GYM);
            return;
        }
        return onSnapshot(
            doc(db, 'gyms', activeGymId),
            (snap) => {
                const cfg = snap.exists() ? gymDocToConfig(snap.data()) : { ...DEFAULT_GYM, gymId: activeGymId, gymName: 'Gym not found' };
                setCurrentGymState(cfg);
                updateGymInfoGlobal(cfg);
            },
            (err) => console.warn('[GymProvider] gym doc', err.message)
        );
    }, [status, activeGymId]);

    // Super admin: list every gym
    useEffect(() => {
        if (status !== 'ready' || role !== 'super_admin') {
            setAvailableGyms([]);
            return;
        }
        return onSnapshot(
            collection(db, 'gyms'),
            (snap) => setAvailableGyms(snap.docs.map((d) => gymDocToConfig(d.data()))),
            (err) => console.warn('[GymProvider] gyms list', err.message)
        );
    }, [status, role]);

    // Injury reports (staff only)
    useEffect(() => {
        if (status !== 'ready' || !activeGymId || !(role === 'admin' || role === 'super_admin' || role === 'trainer')) {
            setReportedInjuries([]);
            return;
        }
        return onSnapshot(
            query(collection(db, 'injuries'), where('gymId', '==', activeGymId)),
            (snap) => setReportedInjuries(snap.docs.map((d) => d.data() as ReportedInjury)),
            (err) => console.warn('[GymProvider] injuries', err.message)
        );
    }, [status, role, activeGymId]);

    const updateGymFields = useCallback(async (fields: Record<string, any>) => {
        if (!activeGymId) return;
        const clean: Record<string, any> = {};
        Object.entries(fields).forEach(([k, v]) => {
            if (!PROTECTED_GYM_FIELDS.includes(k) && v !== undefined) clean[k] = v;
        });
        clean.updatedAtMs = Date.now();
        await setDoc(doc(db, 'gyms', activeGymId), clean, { merge: true }).catch((e) => console.warn('[GymProvider] update', e.message));
        if (typeof fields.gymName === 'string' || typeof fields.address === 'string') {
            await setDoc(
                doc(db, 'gymDirectory', activeGymId),
                { gymId: activeGymId, ...(fields.gymName ? { gymName: String(fields.gymName).slice(0, 120) } : {}), ...(fields.address ? { city: String(fields.address).slice(0, 120) } : {}) },
                { merge: true }
            ).catch(() => undefined);
        }
    }, [activeGymId]);

    const handleSetGym = useCallback((gym: GymConfig) => {
        if (!gym?.gymId) return;
        if (role === 'super_admin') {
            setSession({ activeGymId: gym.gymId });
        }
        // Non super-admins are pinned to their own gym; selecting another gym is a no-op.
    }, [role, setSession]);

    const registerGymConfig = useCallback((gym: GymConfig) => {
        if (!gym?.gymId) return;
        if (gym.gymId === activeGymId) {
            void updateGymFields(gym as any);
        } else {
            console.warn('[GymProvider] Creating new gyms is only possible from the Super Admin portal.');
        }
    }, [activeGymId, updateGymFields]);

    const updateGymSocialLinks = useCallback(async (links: GymSocialLinks) => {
        const sanitizedLinks: GymSocialLinks = {
            whatsapp: (links.whatsapp || '').trim().slice(0, 500),
            instagram: (links.instagram || '').trim().slice(0, 500),
            facebook: (links.facebook || '').trim().slice(0, 500),
            youtube: (links.youtube || '').trim().slice(0, 500),
        };
        await updateGymFields({ socialLinks: sanitizedLinks });
    }, [updateGymFields]);

    const reportInjury = useCallback((injury: Omit<ReportedInjury, 'id' | 'reportedAt'>) => {
        if (!activeGymId) return;
        const id = `INJ-${Date.now()}`;
        void setDoc(doc(db, 'injuries', `${activeGymId}_${id}`), {
            ...injury, id, gymId: activeGymId, reportedAt: new Date().toISOString(), createdAtMs: Date.now(),
        }).catch((e) => console.warn('[GymProvider] injury', e.message));
    }, [activeGymId]);

    const deleteReportedInjury = useCallback((id: string) => {
        if (!activeGymId) return;
        void deleteDoc(doc(db, 'injuries', `${activeGymId}_${id}`)).catch(() => undefined);
    }, [activeGymId]);

    const contextValue = useMemo<GymContextType>(() => ({
        currentGym,
        setCurrentGym: handleSetGym,
        registerGymConfig,
        updateGymSocialLinks,
        updateGymFields,
        availableGyms: availableGyms.length ? availableGyms : currentGym.gymId !== DEFAULT_GYM.gymId ? [currentGym] : [],
        reportedInjuries,
        reportInjury,
        deleteReportedInjury,
    }), [currentGym, handleSetGym, registerGymConfig, updateGymSocialLinks, updateGymFields, availableGyms, reportedInjuries, reportInjury, deleteReportedInjury]);

    return <GymContext.Provider value={contextValue}>{children}</GymContext.Provider>;
};

export const useGym = () => {
    const context = useContext(GymContext);
    if (context === undefined) {
        throw new Error('useGym must be used within a GymProvider');
    }
    return context;
};
