/**
 * DataProvider — Firestore-backed (realtime listeners + offline persistence).
 *
 * Same context API as the old localStorage version so existing screens keep working.
 * Every document is written with `gymId` and a tenant-prefixed document id
 * (`${gymId}_${id}`), and every listener is a gymId-scoped query that matches
 * firestore.rules (admin: whole gym; trainer: assigned members; member: own records).
 * Firestore's local cache gives instant optimistic updates and offline support.
 */
import { getCurrencySymbol } from '../store/useCurrencyStore';
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import {
    collection, doc, onSnapshot, query, where, orderBy, limit as qLimit,
    setDoc, updateDoc, deleteDoc, writeBatch, QueryConstraint,
} from 'firebase/firestore';
import {
    Member, Package, Invoice, Staff, Expense, Lead,
    Transaction, HealthData, WorkoutTemplate, DietPlan,
    DailyRoutineLog, AIRecommendation, MedicalReport,
    SocialPost, SocialReview, MedicalConsultation, CommunityPost,
    InventoryItem, GymMachine, DetailedWorkoutSession, OFSLog,
    AttendanceRecord, SleepLog, StoreProduct, StoreOrder, WalletTransaction,
    EMIPlan, OSSubscription, StoreTransaction, GymOffer, GymReview
} from '../../types';
import { db } from '../../lib/firebase';
import { ENABLE_DEMO_SEED, GYM_COLLECTIONS as C } from '../../lib/config';
import { useSessionStore } from '../../lib/session';
import { useGym } from './GymProvider';
import { useDataStore } from '../store/useDataStore';
import { registerGymOps, GymOps } from '../services/gymApiClient';

const INITIAL_HEALTH_DATA: HealthData = {
    date: '', steps: 0,
    heartRate: { avg: 0, hrv: 0, max: 0, min: 0, history: [] },
    caloriesBurned: 0,
    glucose: { current: 0, trend: '', history: [] },
    circadian: { phase: '', efficiency: 0 },
    sleep: { totalHours: 0, deepHours: 0, remHours: 0 },
};

interface DeviceCapabilities {
    heartRate: boolean;
    spo2: boolean;
    ecg: boolean;
    skinTemp: boolean;
    gps: boolean;
    sleepTracking: boolean;
    nfc: boolean;
}

interface ConnectedDevice {
    name: string;
    type: 'Watch' | 'Band' | 'Ring';
    platform: 'iOS' | 'Android' | 'Proprietary';
    battery: number;
    status: 'Connected' | 'Disconnected' | 'Syncing';
    capabilities: DeviceCapabilities;
}

interface DataContextType {
    members: Member[];
    addMember: (m: Member) => void;
    signupMember: (data: any) => Promise<boolean>;
    updateMember: (m: Member) => void;
    archiveMember: (id: number, archived?: boolean) => void;
    deleteMember: (id: number) => void;

    packages: Package[];
    addPackage: (p: Package) => void;
    updatePackage: (p: Package) => void;
    deletePackage: (id: number) => void;

    invoices: Invoice[];
    addInvoice: (i: Invoice) => void;
    updateInvoiceStatus: (
        id: number,
        status: Invoice['status'],
        overrideAmount?: number,
        paymentMethod?: string
    ) => void;
    recordInvoicePayment: (
        id: number,
        amount: number,
        paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer'
    ) => { success: boolean; error?: string };
    refundInvoice: (id: number, reason?: string) => void;
    deleteInvoice: (id: number) => void;

    transactions: Transaction[];
    addTransaction: (t: Transaction) => void;

    staff: Staff[];
    setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
    addStaff: (s: Staff) => void;
    updateStaff: (s: Staff) => void;
    deleteStaff: (id: number) => void;

    expenses: Expense[];
    addExpense: (e: Expense) => void;
    updateExpense: (e: Expense) => void;
    deleteExpense: (id: number) => void;

    leads: Lead[];
    setLeads: (leads: Lead[]) => void;
    addLead: (l: Lead) => void;
    updateLead: (l: Lead) => void;
    deleteLead: (id: number) => void;

    offers: GymOffer[];
    addOffer: (o: GymOffer) => void;
    updateOffer: (o: GymOffer) => void;
    deleteOffer: (id: string) => void;
    validateOfferCoupon: (
        code: string,
        baseAmount: number,
        planName?: string
    ) => { valid: boolean; reason?: string; offer?: GymOffer; discountAmount: number; finalAmount: number };

    reviews: GymReview[];
    addReview: (r: GymReview) => void;
    updateReview: (r: GymReview) => void;
    deleteReview: (id: string) => void;

    workoutTemplates: WorkoutTemplate[];
    addWorkoutTemplate: (t: WorkoutTemplate) => void;
    updateWorkoutTemplate: (t: WorkoutTemplate) => void;
    deleteWorkoutTemplate: (id: number) => void;

    dietPlans: DietPlan[];
    addDietPlan: (d: DietPlan) => void;
    updateDietPlan: (d: DietPlan) => void;
    deleteDietPlan: (id: number) => void;

    attendanceRecords: AttendanceRecord[];
    markAttendance: (record: AttendanceRecord) => void;
    checkInMember: (member: Member, method?: AttendanceRecord['method'], zone?: AttendanceRecord['zone']) => AttendanceRecord;
    recordDeniedAttendance: (
        member: Member,
        reason: string,
        method?: AttendanceRecord['method'],
        zone?: AttendanceRecord['zone']
    ) => AttendanceRecord;
    checkOutMember: (recordId: string) => void;
    deleteAttendance: (id: string) => void;

    whatsappLogs: Array<{
        id: string;
        recipientName: string;
        recipientPhone: string;
        templateName: string;
        messagePreview: string;
        status: string;
        errorMessage?: string | null;
        createdAt: string;
    }>;
    addWhatsAppLog: (entry: {
        recipientName: string;
        recipientPhone: string;
        templateName: string;
        messagePreview: string;
        status: string;
        errorMessage?: string | null;
    }) => void;

    resetDatabaseToSeed: () => void;
    refreshFromServer: () => Promise<boolean>;
    isHydrating: boolean;

    // Compatible secondary fields used by MemberPortal & shared components
    dailyRoutineLogs: DailyRoutineLog[];
    addRoutineLog: (log: DailyRoutineLog) => void;
    updateRoutineLog: (log: DailyRoutineLog) => void;
    detailedWorkoutLogs: DetailedWorkoutSession[];
    addDetailedWorkoutLog: (log: DetailedWorkoutSession) => void;
    memberWearableLogs: Record<number, any[]>;
    syncWearableData: (id: number, data: any) => void;
    liveHealthData: HealthData;
    updateLiveHealthData: (data: any) => void;
    connectedDevice: ConnectedDevice | null;
    setConnectedDevice: (device: ConnectedDevice | null) => void;
    auditLogs: any[];
    addAuditLog: (log: any) => void;
    socialPosts: SocialPost[];
    addSocialPost: (post: SocialPost) => void;
    socialReviews: SocialReview[];
    updateSocialReview: (review: SocialReview) => void;
    medicalReports: MedicalReport[];
    addMedicalReport: (report: MedicalReport) => void;
    aiRecommendations: AIRecommendation[];
    addAiRecommendation: (rec: AIRecommendation) => void;
    approveRecommendation: (id: string) => void;
    medicalConsultations: MedicalConsultation[];
    addMedicalConsultation: (consult: MedicalConsultation) => void;
    updateMedicalConsultation: (consult: MedicalConsultation) => void;
    systemHealth: number;
    isSyncing: boolean;
    evolutionLevel: number;
    systemVersion: string;
    triggerSystemUpdate: () => void;
    inventory: InventoryItem[];
    addInventory: (item: InventoryItem) => void;
    updateInventory: (item: InventoryItem) => void;
    orders: any[];
    addOrder: (order: any) => void;
    machines: GymMachine[];
    updateMachine: (machine: GymMachine) => void;
    aiProvider: string;
    ofsLogs: OFSLog[];
    activeMemberCount: number;
    totalRevenue: number;
    automationEvents: string[];
    isDeveloperMode: boolean;
    setDeveloperMode: (enabled: boolean) => void;
    osSubscription: OSSubscription;
    setOSSubscription: (sub: OSSubscription) => void;
    sleepLogs: SleepLog[];
    addSleepLog: (log: SleepLog) => void;
    storeProducts: StoreProduct[];
    addStoreProduct: (product: StoreProduct) => void;
    updateStoreProduct: (product: StoreProduct) => void;
    deleteStoreProduct: (id: string) => void;
    storeOrders: StoreOrder[];
    addStoreOrder: (order: StoreOrder) => void;
    storeTransactions: StoreTransaction[];
    addStoreTransaction: (tx: StoreTransaction) => void;
    updateStoreOrderStatus: (id: string, status: StoreOrder['status']) => void;
    walletTransactions: WalletTransaction[];
    addWalletTransaction: (transaction: WalletTransaction) => void;
    emiPlans: EMIPlan[];
    addEMIPlan: (plan: EMIPlan) => void;
    updateEMIPlan: (plan: EMIPlan) => void;
    communityPosts: CommunityPost[];
    addCommunityPost: (post: CommunityPost) => void;
    likeCommunityPost: (postId: string) => void;
    commentCommunityPost: (postId: string, comment: { memberName: string; text: string }) => void;
    globalFees: { admissionFee: number; receiptSignature?: string };
    updateGlobalFees: (fees: { admissionFee: number; receiptSignature?: string }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function formatCurrentTime12h(): string {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function parseMinutesFromTimeLabel(label?: string | null): number | null {
    if (!label) return null;
    const match = label.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
}

export function computeExpiryDate(startDate: string, durationMonths: number): string {
    const base = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date();
    if (Number.isNaN(base.getTime())) {
        const f = new Date();
        f.setMonth(f.getMonth() + Math.max(1, durationMonths));
        return f.toISOString().split('T')[0];
    }
    base.setUTCMonth(base.getUTCMonth() + Math.max(1, durationMonths));
    return base.toISOString().split('T')[0];
}

const todayIso = () => new Date().toISOString().split('T')[0];
const normalizePhone = (p: string) => String(p || '').replace(/\D/g, '').slice(-10);
const safeIdPart = (id: unknown) => String(id ?? '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
export const tenantDocId = (gymId: string, id: unknown) => `${gymId}_${safeIdPart(id)}`;

/** Remove fields that must never reach Firestore (plaintext passwords, client-only flags). */
function sanitizeForWrite<T extends Record<string, any>>(obj: T): Record<string, any> {
    const { password, auth_mode, secretKey, ...rest } = obj as any;
    return rest;
}

const byCreatedDesc = (a: any, b: any) => (b.createdAtMs || 0) - (a.createdAtMs || 0) || (Number(b.id) || 0) - (Number(a.id) || 0);

const ATTENDANCE_WINDOW_DAYS = 90;

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentGym, updateGymFields } = useGym();
    const status = useSessionStore((s) => s.status);
    const role = useSessionStore((s) => s.role);
    const uid = useSessionStore((s) => s.user?.uid || null);
    const actorEmail = useSessionStore((s) => s.user?.email || null);
    const memberId = useSessionStore((s) => s.profile?.memberId ?? null);
    const gymId = useSessionStore((s) => s.activeGymId);

    // ---- Core Firestore-backed tables ----
    const [members, setMembers] = useState<Member[]>([]);
    const [packages, setPackages] = useState<Package[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [staff, setStaffState] = useState<Staff[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [leads, setLeadsState] = useState<Lead[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [offers, setOffers] = useState<GymOffer[]>([]);
    const [reviews, setReviews] = useState<GymReview[]>([]);
    const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([]);
    const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
    const [whatsappLogs, setWhatsappLogs] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [isHydrating, setIsHydrating] = useState<boolean>(false);

    // ---- Secondary, in-memory only (experimental modules; not persisted, never in localStorage) ----
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
    const [dailyRoutineLogs, setDailyRoutineLogs] = useState<DailyRoutineLog[]>([]);
    const [detailedWorkoutLogs, setDetailedWorkoutLogs] = useState<DetailedWorkoutSession[]>([]);
    const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
    const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
    const [storeTransactions, setStoreTransactions] = useState<StoreTransaction[]>([]);
    const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
    const [emiPlans, setEmiPlans] = useState<EMIPlan[]>([]);
    const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
    const [memberWearableLogs, setMemberWearableLogs] = useState<Record<number, any[]>>({});
    const [liveHealthData, setLiveHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(null);
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
    const [socialReviews, setSocialReviews] = useState<SocialReview[]>([]);
    const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
    const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
    const [medicalConsultations, setMedicalConsultations] = useState<MedicalConsultation[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [machines, setMachines] = useState<GymMachine[]>([]);
    const [ofsLogs] = useState<OFSLog[]>([]);
    const [automationEvents, setAutomationEvents] = useState<string[]>([]);
    const [isDeveloperMode, setIsDeveloperMode] = useState<boolean>(false);
    const [osSubscription, setOSSubscription] = useState<OSSubscription>({
        tier: 'Basic', billingCycle: 'Monthly', price: 0, expiryDate: '',
    });

    const globalFees = (currentGym as any)?.globalFees || { admissionFee: 0, receiptSignature: '' };

    // ======================= REALTIME LISTENERS =======================
    useEffect(() => {
        const clearAll = () => {
            setMembers([]); setPackages([]); setInvoices([]); setTransactions([]); setStaffState([]);
            setExpenses([]); setLeadsState([]); setAttendanceRecords([]); setOffers([]); setReviews([]);
            setWorkoutTemplates([]); setDietPlans([]); setWhatsappLogs([]); setAuditLogs([]);
        };
        if (status !== 'ready' || !gymId || !role || !uid) {
            clearAll();
            return;
        }

        const unsubs: Array<() => void> = [];
        const g = where('gymId', '==', gymId);
        const isManager = role === 'admin' || role === 'super_admin';
        let pendingFirst = 0;
        setIsHydrating(true);

        const listen = <T,>(name: string, constraints: QueryConstraint[], setter: (rows: T[]) => void, sort = true) => {
            pendingFirst += 1;
            let first = true;
            const unsub = onSnapshot(
                query(collection(db, name), ...constraints),
                (snap) => {
                    const rows = snap.docs.map((d) => d.data() as any);
                    if (sort) rows.sort(byCreatedDesc);
                    setter(rows as T[]);
                    if (first) {
                        first = false;
                        pendingFirst -= 1;
                        if (pendingFirst <= 0) setIsHydrating(false);
                    }
                },
                (err) => {
                    console.warn(`[DataProvider] listener ${name} failed:`, err.message);
                    if (first) {
                        first = false;
                        pendingFirst -= 1;
                        if (pendingFirst <= 0) setIsHydrating(false);
                    }
                }
            );
            unsubs.push(unsub);
        };

        const attendanceCutoff = new Date(Date.now() - ATTENDANCE_WINDOW_DAYS * 86400000).toISOString().split('T')[0];
        const mapPayment = (rows: any[]) =>
            setTransactions(rows.map((r) => ({ ...r, id: String(r.id) })) as Transaction[]);

        if (isManager) {
            listen<Member>(C.members, [g], setMembers);
            listen<Package>(C.packages, [g], (r) => setPackages(r.sort((a, b) => a.id - b.id)), false);
            listen<Invoice>(C.invoices, [g], setInvoices);
            listen<any>(C.payments, [g], mapPayment);
            listen<Staff>(C.staff, [g], setStaffState);
            listen<Expense>(C.expenses, [g], setExpenses);
            listen<Lead>(C.leads, [g], setLeadsState);
            listen<AttendanceRecord>(C.attendance, [g, where('date', '>=', attendanceCutoff)], setAttendanceRecords);
            listen<GymOffer>(C.offers, [g], setOffers);
            listen<GymReview>(C.reviews, [g], setReviews);
            listen<WorkoutTemplate>(C.workoutTemplates, [g], setWorkoutTemplates);
            listen<DietPlan>(C.dietPlans, [g], setDietPlans);
            listen<any>(C.whatsappLogs, [g, orderBy('createdAtMs', 'desc'), qLimit(150)], setWhatsappLogs, false);
            listen<any>(C.auditLogs, [g, orderBy('createdAtMs', 'desc'), qLimit(100)], setAuditLogs, false);
        } else if (role === 'trainer') {
            listen<Member>(C.members, [g, where('assignedTrainerUid', '==', uid)], setMembers);
            listen<Package>(C.packages, [g], setPackages);
            listen<WorkoutTemplate>(C.workoutTemplates, [g], setWorkoutTemplates);
            listen<DietPlan>(C.dietPlans, [g], setDietPlans);
        } else if (role === 'member' && memberId !== null && memberId !== undefined) {
            const mine = where('memberId', '==', memberId);
            listen<Member>(C.members, [g, where('id', '==', memberId)], setMembers);
            listen<Package>(C.packages, [g], setPackages);
            listen<Invoice>(C.invoices, [g, mine], setInvoices);
            listen<any>(C.payments, [g, mine], mapPayment);
            listen<AttendanceRecord>(C.attendance, [g, mine], setAttendanceRecords);
            listen<WorkoutTemplate>(C.workoutTemplates, [g], setWorkoutTemplates);
            listen<DietPlan>(C.dietPlans, [g], setDietPlans);
        }
        if (pendingFirst === 0) setIsHydrating(false);

        return () => {
            unsubs.forEach((u) => u());
            clearAll();
        };
    }, [status, gymId, role, uid, memberId]);

    // Mirror core tables into the zustand store used by some shared widgets.
    useEffect(() => { useDataStore.setState({ members }); }, [members]);
    useEffect(() => { useDataStore.setState({ packages }); }, [packages]);
    useEffect(() => { useDataStore.setState({ invoices }); }, [invoices]);
    useEffect(() => { useDataStore.setState({ transactions }); }, [transactions]);
    useEffect(() => { useDataStore.setState({ attendanceRecords }); }, [attendanceRecords]);

    // ======================= WRITE HELPERS =======================
    const reportError = useCallback((op: string) => (err: any) => {
        console.warn(`[DataProvider] ${op} failed:`, err?.message || err);
        setAutomationEvents((prev) => [`[${formatCurrentTime12h()}] ERROR ${op}: ${err?.code || err?.message || err}`, ...prev].slice(0, 40));
    }, []);

    /** Create/replace a tenant document. Resolves only after server ack; UI updates instantly from the local cache. */
    const put = useCallback((coll: string, id: unknown, data: Record<string, any>) => {
        if (!gymId) {
            console.warn(`[DataProvider] put(${coll}) ignored: no active gym`);
            return Promise.resolve();
        }
        const now = Date.now();
        const payload = {
            ...sanitizeForWrite(data),
            gymId,
            createdAtMs: data.createdAtMs ?? now,
            updatedAtMs: now,
        };
        return setDoc(doc(db, coll, tenantDocId(gymId, id)), payload).catch(reportError(`write ${coll}`));
    }, [gymId, reportError]);

    const patch = useCallback((coll: string, id: unknown, data: Record<string, any>) => {
        if (!gymId) return Promise.resolve();
        return updateDoc(doc(db, coll, tenantDocId(gymId, id)), { ...sanitizeForWrite(data), updatedAtMs: Date.now() })
            .catch(reportError(`update ${coll}`));
    }, [gymId, reportError]);

    const remove = useCallback((coll: string, id: unknown) => {
        if (!gymId) return Promise.resolve();
        return deleteDoc(doc(db, coll, tenantDocId(gymId, id))).catch(reportError(`delete ${coll}`));
    }, [gymId, reportError]);

    const canWriteAudit = role === 'admin' || role === 'super_admin' || role === 'trainer';
    const addAuditLog = (log: any) => {
        if (!canWriteAudit) return;
        const id = `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        void put(C.auditLogs, id, {
            id,
            action: String(log.action || 'EVENT'),
            member_id: log.member_id ?? null,
            details: String(log.details || '').slice(0, 500),
            actor: actorEmail || uid,
            actorUid: uid,
            timestamp: new Date().toISOString(),
        });
    };

    const logEvent = (msg: string) => {
        setAutomationEvents((prev) => [`[${formatCurrentTime12h()}] ${msg}`, ...prev].slice(0, 40));
    };

    const nextNumericId = (rows: Array<{ id: number }>, floor: number) =>
        Math.max(floor, Date.now() % 1000000000, ...rows.map((r) => Number(r.id) || 0)) + 1;

    // ======================= MEMBERS =======================
    const addMember = (m: Member) => {
        const bound: Member = {
            ...m,
            gymId: gymId || m.gymId,
            gymName: m.gymName || currentGym?.gymName,
            loginId: m.loginId || `FF-${1000 + Number(m.id)}`,
        };
        void put(C.members, bound.id, bound as any);
        addAuditLog({ action: 'MEMBER_CREATED', member_id: bound.id, details: `Member added: ${bound.name}` });
        logEvent(`Member added: ${bound.name}`);
    };

    const signupMember = async (data: any): Promise<boolean> => {
        const newId = nextNumericId(members, 100);
        addMember({
            id: newId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            joinDate: todayIso(),
            packageId: packages[0]?.id || 1,
            status: 'Pending',
            avatar: '',
            whatsappConsent: true,
            xp: 0, level: 1, achievements: [], hrv: 0, lbm: 0, health_score: 0, bio_age: 0,
            assigned_tests: [],
            medical_history: { conditions: [], pastInjuries: '', medications: '', lifestyle: {} },
            physical_metrics: { height: 0, weight: 0, body_fat: 0, muscle_mass: 0, target_weight: 0, body_type: 'Mesomorph', activity_level: 'Moderate' },
            automation_settings: { remind_12hrs_before: true, auto_renewal: false, ai_coaching: true, sync_id: '' },
            rpeHistory: [], anatomicalStatus: {},
            emergency_contact: { name: '', phone: '', relation: '' },
            initial_assessment: { fitness_level: 'Beginner', pushup_count: 0, plank_time: '0s', squat_count: 0, comments: '' },
        } as Member);
        return true;
    };

    const updateMember = (m: Member) => {
        if (role === 'trainer') {
            // Trainers may only change coaching fields (enforced again by firestore.rules).
            void patch(C.members, m.id, {
                assignedWorkoutId: m.assignedWorkoutId ?? null,
                assignedDietId: m.assignedDietId ?? null,
                approvedAiPlan: m.approvedAiPlan ?? null,
                trainerNotes: m.trainerNotes ?? '',
            });
            return;
        }
        void put(C.members, m.id, { ...m, updated_at: new Date().toISOString() } as any);
    };

    const archiveMember = (id: number, archived = true) => {
        void patch(C.members, id, { archived, status: archived ? 'Inactive' : 'Active', updated_at: new Date().toISOString() });
        addAuditLog({ action: archived ? 'MEMBER_ARCHIVED' : 'MEMBER_RESTORED', member_id: id, details: `Member #${id} ${archived ? 'archived' : 'restored'}.` });
    };

    const deleteMember = (id: number) => {
        void remove(C.members, id);
        addAuditLog({ action: 'MEMBER_DELETED', member_id: id, details: `Member #${id} deleted (invoices & attendance kept for accounting).` });
    };

    // ======================= PACKAGES =======================
    const addPackage = (p: Package) => { void put(C.packages, p.id, p as any); };
    const updatePackage = (p: Package) => { void put(C.packages, p.id, p as any); };
    const deletePackage = (id: number) => { void remove(C.packages, id); };

    // ======================= BILLING =======================
    const txMethodFor = (m?: string): Transaction['method'] =>
        m === 'Cash' ? 'Cash' : m === 'Card' ? 'Card' : m === 'Bank Transfer' ? 'NEFT/RTGS' : 'QR Code';

    const writePayment = (inv: Invoice, amount: number, method: string) => {
        const id = `TXN-${inv.id}-${Date.now().toString().slice(-6)}`;
        void put(C.payments, id, {
            id,
            invoiceId: inv.id,
            memberId: inv.memberId,
            memberName: inv.memberName,
            amount,
            date: todayIso(),
            method: txMethodFor(method),
        });
    };

    const addInvoice = (i: Invoice) => {
        void put(C.invoices, i.id, i as any);
        if (i.status === 'Paid') writePayment(i, i.amount, i.paymentMethod || 'UPI');
    };

    const updateInvoiceStatus = (id: number, status: Invoice['status'], overrideAmount?: number, paymentMethod?: string) => {
        const inv = invoices.find((x) => x.id === id);
        if (!inv) return;
        const nextAmount = overrideAmount !== undefined ? overrideAmount : inv.amount;
        const nextMethod = paymentMethod || inv.paymentMethod || 'UPI';
        const paidAmount = status === 'Paid' ? nextAmount : status === 'Refunded' || status === 'Cancelled' ? 0 : inv.paidAmount || 0;
        const balanceAmount = status === 'Paid' || status === 'Refunded' || status === 'Cancelled' ? 0 : Math.max(0, nextAmount - paidAmount);
        void patch(C.invoices, id, { status, amount: nextAmount, paidAmount, balanceAmount, paymentMethod: nextMethod });
        if (status === 'Paid' && inv.status !== 'Paid') {
            const delta = Math.max(0, nextAmount - (inv.paidAmount || 0));
            if (delta > 0) writePayment(inv, delta, nextMethod);
            void patch(C.members, inv.memberId, { status: 'Active' });
        }
    };

    const recordInvoicePayment = (id: number, amount: number, paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer'): { success: boolean; error?: string } => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return { success: false, error: 'Invoice not found.' };
        const currentPaid = inv.paidAmount ?? (inv.status === 'Paid' ? inv.amount : 0);
        const remaining = Math.max(0, inv.amount - currentPaid);
        if (remaining <= 0 || inv.status === 'Paid') return { success: false, error: 'Invoice is already fully paid.' };
        if (!Number.isFinite(amount) || amount <= 0) return { success: false, error: 'Payment amount must be greater than zero.' };
        if (amount > remaining) return { success: false, error: `Amount ${getCurrencySymbol()}${amount} exceeds outstanding balance ${getCurrencySymbol()}${remaining}.` };

        const nextPaid = Math.round(currentPaid + amount);
        const nextBalance = Math.max(0, Math.round(inv.amount - nextPaid));
        const nextStatus: Invoice['status'] = nextBalance <= 0 ? 'Paid' : 'Partial';
        void patch(C.invoices, id, { paidAmount: nextPaid, balanceAmount: nextBalance, status: nextStatus, paymentMethod });
        writePayment(inv, amount, paymentMethod);
        void patch(C.members, inv.memberId, { status: 'Active' });
        addAuditLog({ action: 'PAYMENT_RECORDED', member_id: inv.memberId, details: `Recorded ${amount} (${paymentMethod}) on Invoice #${inv.id}. Balance: ${nextBalance}.` });
        return { success: true };
    };

    const refundInvoice = (id: number, reason = 'Admin refund/cancellation') => {
        const target = invoices.find((i) => i.id === id);
        if (!target) return;
        const previouslyPaid = target.paidAmount ?? (target.status === 'Paid' ? target.amount : 0);
        const nextStatus: Invoice['status'] = previouslyPaid > 0 ? 'Refunded' : 'Cancelled';
        void patch(C.invoices, id, { refundedAmount: previouslyPaid, paidAmount: 0, balanceAmount: 0, status: nextStatus });
        addAuditLog({ action: previouslyPaid > 0 ? 'INVOICE_REFUNDED' : 'INVOICE_CANCELLED', member_id: target.memberId, details: `Invoice #${id} ${nextStatus.toLowerCase()} (${previouslyPaid}). Reason: ${reason}` });
    };

    const deleteInvoice = (id: number) => { void remove(C.invoices, id); };

    const addTransaction = (t: Transaction) => {
        void put(C.payments, t.id, { ...t, memberId: (t as any).memberId ?? null });
        logEvent(`Payment recorded: ${getCurrencySymbol()}${t.amount} (${t.memberName})`);
    };

    // ======================= STAFF / EXPENSES / LEADS =======================
    const addStaff = (s: Staff) => { void put(C.staff, s.id, s as any); };
    const updateStaff = (s: Staff) => { void put(C.staff, s.id, s as any); };
    const deleteStaff = (id: number) => { void remove(C.staff, id); };
    const setStaff: React.Dispatch<React.SetStateAction<Staff[]>> = (val) => {
        const next = typeof val === 'function' ? (val as (p: Staff[]) => Staff[])(staff) : val;
        next.forEach((s) => void put(C.staff, s.id, s as any));
        staff.filter((s) => !next.some((n) => n.id === s.id)).forEach((s) => void remove(C.staff, s.id));
    };

    const addExpense = (e: Expense) => { void put(C.expenses, e.id, e as any); };
    const updateExpense = (e: Expense) => { void put(C.expenses, e.id, e as any); };
    const deleteExpense = (id: number) => { void remove(C.expenses, id); };

    const addLead = (l: Lead) => { void put(C.leads, l.id, l as any); };
    const updateLead = (l: Lead) => { void put(C.leads, l.id, l as any); };
    const deleteLead = (id: number) => { void remove(C.leads, id); };
    const setLeads = (next: Lead[]) => { next.forEach((l) => void put(C.leads, l.id, l as any)); };

    // ======================= OFFERS / REVIEWS =======================
    const addOffer = (o: GymOffer) => { void put(C.offers, o.id, o as any); };
    const updateOffer = (o: GymOffer) => { void put(C.offers, o.id, o as any); };
    const deleteOffer = (id: string) => { void remove(C.offers, id); };

    const validateOfferCoupon = (code: string, baseAmount: number, planName?: string) => {
        const clean = String(code || '').trim().toUpperCase();
        const safeBase = Math.max(0, Number(baseAmount) || 0);
        if (!clean) return { valid: false, reason: 'Enter a promo code.', discountAmount: 0, finalAmount: safeBase };
        const offer = offers.find((o) => o.code.toUpperCase() === clean);
        if (!offer) return { valid: false, reason: `Promo code "${clean}" not found.`, discountAmount: 0, finalAmount: safeBase };
        if (offer.status !== 'Active') return { valid: false, reason: `Offer "${clean}" is ${offer.status}.`, discountAmount: 0, finalAmount: safeBase };
        const today = todayIso();
        if (offer.validFrom && today < offer.validFrom) return { valid: false, reason: `Valid starting ${offer.validFrom}.`, discountAmount: 0, finalAmount: safeBase };
        if (offer.validUntil && today > offer.validUntil) return { valid: false, reason: `Offer expired on ${offer.validUntil}.`, discountAmount: 0, finalAmount: safeBase };
        if (offer.usageLimit && offer.usageLimit > 0 && offer.redemptions >= offer.usageLimit) return { valid: false, reason: `Usage limit (${offer.usageLimit}) reached.`, discountAmount: 0, finalAmount: safeBase };
        if (planName && offer.applicablePlan && offer.applicablePlan !== 'All Membership Plans' && offer.applicablePlan.toLowerCase() !== planName.toLowerCase()) {
            return { valid: false, reason: `Applicable only to "${offer.applicablePlan}".`, discountAmount: 0, finalAmount: safeBase };
        }
        const discountAmount = offer.discountType === 'percentage'
            ? Math.round((safeBase * Math.min(100, offer.discountValue)) / 100)
            : Math.min(safeBase, Math.round(offer.discountValue));
        return { valid: true, offer, discountAmount, finalAmount: Math.max(0, safeBase - discountAmount) };
    };

    const addReview = (r: GymReview) => { void put(C.reviews, r.id, r as any); };
    const updateReview = (r: GymReview) => { void put(C.reviews, r.id, r as any); };
    const deleteReview = (id: string) => { void remove(C.reviews, id); };

    // ======================= WORKOUTS / DIETS =======================
    const addWorkoutTemplate = (t: WorkoutTemplate) => { void put(C.workoutTemplates, t.id, { ...t, createdBy: uid } as any); };
    const updateWorkoutTemplate = (t: WorkoutTemplate) => { void put(C.workoutTemplates, t.id, { ...t, createdBy: (t as any).createdBy || uid } as any); };
    const deleteWorkoutTemplate = (id: number) => { void remove(C.workoutTemplates, id); };
    const addDietPlan = (d: DietPlan) => { void put(C.dietPlans, d.id, { ...d, createdBy: uid } as any); };
    const updateDietPlan = (d: DietPlan) => { void put(C.dietPlans, d.id, { ...d, createdBy: (d as any).createdBy || uid } as any); };
    const deleteDietPlan = (id: number) => { void remove(C.dietPlans, id); };

    // ======================= ATTENDANCE =======================
    const markAttendance = (record: AttendanceRecord) => { void put(C.attendance, record.id, record as any); };

    const checkInMember = (member: Member, method: AttendanceRecord['method'] = 'QR', zone: AttendanceRecord['zone'] = 'Main Floor'): AttendanceRecord => {
        const nowTime = formatCurrentTime12h();
        const rec: AttendanceRecord = {
            id: `ATT-${Date.now()}`, memberId: member.id, memberName: member.name, date: todayIso(),
            time: nowTime, checkInTime: nowTime, checkOutTime: null, zone, status: 'Checked In', method,
            accessGranted: true, denialReason: null,
        };
        void put(C.attendance, rec.id, rec as any);
        addAuditLog({ action: 'CHECK_IN_GRANTED', member_id: member.id, details: `${member.name} checked in via ${method} (${zone}).` });
        return rec;
    };

    const recordDeniedAttendance = (member: Member, reason: string, method: AttendanceRecord['method'] = 'QR', zone: AttendanceRecord['zone'] = 'Main Floor'): AttendanceRecord => {
        const nowTime = formatCurrentTime12h();
        const rec: AttendanceRecord = {
            id: `ATT-DENY-${Date.now()}`, memberId: member.id, memberName: member.name, date: todayIso(),
            time: nowTime, checkInTime: nowTime, checkOutTime: null, zone, status: 'Denied', method,
            accessGranted: false, denialReason: reason,
        };
        void put(C.attendance, rec.id, rec as any);
        addAuditLog({ action: 'ACCESS_DENIED', member_id: member.id, details: `Check-in denied for ${member.name}: ${reason}` });
        return rec;
    };

    const checkOutMember = (recordId: string) => {
        const rec = attendanceRecords.find((r) => r.id === recordId);
        if (!rec) return;
        const outTime = formatCurrentTime12h();
        const inMin = parseMinutesFromTimeLabel(rec.checkInTime || rec.time);
        const outMin = parseMinutesFromTimeLabel(outTime);
        const duration = inMin !== null && outMin !== null ? Math.max(1, outMin - inMin) : 45;
        void patch(C.attendance, recordId, { checkOutTime: outTime, durationMinutes: duration, status: 'Checked Out' });
    };

    const deleteAttendance = (id: string) => { void remove(C.attendance, id); };

    const addWhatsAppLog = (entry: { recipientName: string; recipientPhone: string; templateName: string; messagePreview: string; status: string; errorMessage?: string | null }) => {
        const id = `WA-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        void put(C.whatsappLogs, id, { ...entry, id, createdAt: new Date().toISOString() });
    };

    // ======================= COMPOSITE OPERATIONS (formerly express /api/gym/*) =======================
    const opsRef = useRef<GymOps | null>(null);
    opsRef.current = {
        snapshot: () => ({ members, packages, invoices, payments: transactions, staff, expenses, leads, attendance: attendanceRecords, offers, reviews, workout_plans: workoutTemplates, diet_plans: dietPlans, whatsapp_logs: whatsappLogs, audit_logs: auditLogs }),

        checkIn: async ({ member_id, zone = 'Main Floor', method = 'QR' }) => {
            const member = members.find((m) => m.id === Number(member_id));
            if (!member) return { ok: false, status: 404, error: 'Member not found for check-in.' };
            const today = todayIso();
            const active = attendanceRecords.find((a) => a.memberId === member.id && a.date === today && a.status === 'Checked In' && a.accessGranted !== false);
            if (active) return { ok: false, status: 409, error: `${member.name} is already checked in today since ${active.checkInTime || active.time}.` };
            const expired = Boolean(member.expiryDate && member.expiryDate < today);
            if (member.archived || member.status === 'Expired' || member.status === 'Inactive' || expired) {
                const reason = member.archived ? 'Member account is archived'
                    : expired || member.status === 'Expired' ? `Membership expired on ${member.expiryDate || 'record'} — renewal required`
                    : `Membership status is ${member.status}`;
                recordDeniedAttendance(member, reason, method, zone);
                return { ok: false, status: 403, error: reason, data: { granted: false, reason } };
            }
            const record = checkInMember(member, method, zone);
            return { ok: true, status: 200, data: { granted: true, record } };
        },

        renewMember: async (id, payload) => {
            const member = members.find((m) => m.id === Number(id));
            if (!member) return { ok: false, status: 404, error: 'Member not found for renewal.' };
            const pkg = packages.find((p) => p.id === Number(payload.package_id || member.packageId));
            if (!pkg) return { ok: false, status: 400, error: 'Selected renewal package does not exist.' };
            const today = todayIso();
            const baseStart = member.expiryDate && member.expiryDate > today ? member.expiryDate : today;
            const newExpiry = computeExpiryDate(baseStart, (pkg as any).billingMonths || 1);
            const total = Math.max(0, pkg.price);
            const paid = payload.payment_amount !== undefined ? Math.min(total, Math.max(0, Number(payload.payment_amount))) : total;
            const invId = nextNumericId(invoices, 1000);
            const inv: Invoice = {
                id: invId, invoiceNumber: `INV-${new Date().getFullYear()}-${invId}`, memberId: member.id, memberName: member.name,
                packageId: pkg.id, packageName: `${pkg.name} (Renewal)`, subtotal: pkg.price, registrationFee: 0, couponCode: null,
                discountAmount: 0, amount: total, paidAmount: paid, balanceAmount: Math.max(0, total - paid), refundedAmount: 0,
                date: today, status: paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending', paymentMethod: payload.payment_method || 'UPI',
            };
            void patch(C.members, member.id, { packageId: pkg.id, expiryDate: newExpiry, status: paid > 0 ? 'Active' : member.status, archived: false });
            void put(C.invoices, inv.id, inv as any);
            if (paid > 0) writePayment(inv, paid, inv.paymentMethod || 'UPI');
            addAuditLog({ action: 'MEMBERSHIP_RENEWED', member_id: member.id, details: `Renewed ${member.name} on ${pkg.name} until ${newExpiry}.` });
            return { ok: true, status: 200, data: { success: true, member: { ...member, expiry_date: newExpiry }, invoice: inv } };
        },

        processAdmission: async (input) => {
            const pkg = packages.find((p) => p.id === Number(input.package_id));
            if (!pkg) return { ok: false, status: 400, error: 'Selected membership package does not exist.' };
            const phone = normalizePhone(input.phone);
            const name = String(input.name || '').replace(/[<>]/g, '').trim().slice(0, 120);
            if (!name) return { ok: false, status: 400, error: 'Member full name is required.' };
            if (phone.length < 10) return { ok: false, status: 400, error: 'Valid 10-digit mobile number is required.' };
            if (!input.digital_consent) return { ok: false, status: 400, error: 'Digital consent is required.' };
            const dup = members.find((m) => !m.archived && normalizePhone(m.phone) === phone);
            if (dup) return { ok: false, status: 409, error: `Duplicate mobile number: ${phone} is already registered to ${dup.name} (ID #${dup.id}).` };

            const today = todayIso();
            const expiryDate = computeExpiryDate(today, (pkg as any).billingMonths || 1);
            const regFee = input.admission_fee !== undefined ? Math.max(0, Number(input.admission_fee)) : (pkg as any).registrationFee || 0;
            let discount = 0;
            let coupon: string | null = null;
            if (input.coupon_code) {
                const v = validateOfferCoupon(input.coupon_code, pkg.price, pkg.name);
                if (!v.valid) return { ok: false, status: 400, error: v.reason || 'Invalid coupon.' };
                discount = v.discountAmount;
                coupon = v.offer!.code;
                void patch(C.offers, v.offer!.id, { redemptions: (v.offer!.redemptions || 0) + 1 });
            }
            const total = Math.max(0, pkg.price + regFee - discount);
            const paid = input.payment_amount !== undefined ? Math.min(total, Math.max(0, Number(input.payment_amount))) : total;
            const memberIdNew = nextNumericId(members, 100);
            const height = Math.max(100, Math.min(250, Number(input.height_cm) || 170));
            const weight = Math.max(25, Math.min(250, Number(input.weight_kg) || 70));
            const member: Member = {
                id: memberIdNew, name, email: String(input.email || '').slice(0, 160), phone, gender: input.gender || 'Male',
                joinDate: today, expiryDate, packageId: pkg.id, status: paid > 0 ? 'Active' : 'Pending', avatar: '',
                loginId: `FF-${1000 + memberIdNew}`, gymId: gymId || undefined, gymName: currentGym?.gymName,
                whatsappConsent: input.whatsapp_consent !== false, fitnessGoal: input.fitness_goal || 'Fitness',
                xp: 0, level: 1, achievements: [], hrv: 0, lbm: 0, health_score: 0, bio_age: 0, assigned_tests: [],
                medical_history: { conditions: [], pastInjuries: String(input.medical_notes || '').slice(0, 500), medications: '', lifestyle: {} },
                physical_metrics: { height, weight, body_fat: 0, muscle_mass: 0, target_weight: weight, body_type: 'Mesomorph', activity_level: 'Moderate' },
                automation_settings: { remind_12hrs_before: true, auto_renewal: false, ai_coaching: true, sync_id: '' },
                rpeHistory: [], anatomicalStatus: {},
                emergency_contact: input.emergency_contact || { name: '', phone: '', relation: '' },
                initial_assessment: { fitness_level: input.training_experience || 'Beginner', pushup_count: 0, plank_time: '0s', squat_count: 0, comments: String(input.medical_notes || '').slice(0, 500) },
            } as Member;
            const invId = nextNumericId(invoices, 1000);
            const inv: Invoice = {
                id: invId, invoiceNumber: `INV-${new Date().getFullYear()}-${invId}`, memberId: memberIdNew, memberName: name,
                packageId: pkg.id, packageName: pkg.name, subtotal: pkg.price, registrationFee: regFee, couponCode: coupon,
                discountAmount: discount, amount: total, paidAmount: paid, balanceAmount: Math.max(0, total - paid), refundedAmount: 0,
                date: today, status: paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Pending', paymentMethod: input.payment_method || 'UPI',
            };
            void put(C.members, member.id, member as any);
            void put(C.invoices, inv.id, inv as any);
            if (paid > 0) writePayment(inv, paid, inv.paymentMethod || 'UPI');
            if (input.lead_id) void patch(C.leads, input.lead_id, { status: 'Converted', convertedMemberId: memberIdNew });
            addAuditLog({ action: 'ADMISSION_COMPLETED', member_id: memberIdNew, details: `Admitted ${name} (${pkg.name}), Invoice ${inv.invoiceNumber} (${paid}/${total} paid).` });
            return {
                ok: true, status: 200,
                data: { success: true, member: { ...member, member_code: member.loginId, expiry_date: expiryDate }, invoice: { ...inv, invoice_number: inv.invoiceNumber } },
            };
        },

        convertLead: async (leadId, payload) => {
            const lead = leads.find((l) => l.id === Number(leadId));
            if (!lead) return { ok: false, status: 404, error: 'Lead not found.' };
            if (lead.status === 'Converted') return { ok: false, status: 409, error: 'Lead has already been converted.' };
            const res = await opsRef.current!.processAdmission({
                name: lead.name, phone: lead.phone, email: lead.email, package_id: payload.package_id,
                fitness_goal: (lead as any).goal, digital_consent: true, payment_method: payload.payment_method || 'UPI',
                payment_amount: payload.payment_amount ?? 0, lead_id: lead.id,
            });
            return res;
        },
    };

    useEffect(() => {
        registerGymOps(() => opsRef.current);
        return () => registerGymOps(null);
    }, []);

    // ======================= DEV-ONLY DEMO SEED =======================
    const resetDatabaseToSeed = () => {
        if (!ENABLE_DEMO_SEED || !gymId) {
            console.warn('Demo seed is disabled in production builds (set VITE_ENABLE_DEMO_SEED=true and run `vite dev`).');
            return;
        }
        void (async () => {
            const seed = await import('../../constants');
            const batch = writeBatch(db);
            const add = (coll: string, rows: any[]) => rows.forEach((r) => batch.set(doc(db, coll, tenantDocId(gymId, r.id)), { ...sanitizeForWrite(r), gymId, createdAtMs: Date.now() }));
            add(C.members, seed.INITIAL_MEMBERS);
            add(C.packages, seed.INITIAL_PACKAGES);
            add(C.invoices, seed.INITIAL_INVOICES);
            add(C.staff, seed.INITIAL_STAFF);
            add(C.workoutTemplates, seed.INITIAL_WORKOUT_TEMPLATES);
            add(C.dietPlans, seed.INITIAL_DIETS);
            await batch.commit().catch(reportError('demo seed'));
        })();
    };

    const refreshFromServer = useCallback(async () => true, []); // realtime listeners keep data fresh

    // ======================= SECONDARY HELPERS (in-memory) =======================
    const addRoutineLog = (log: DailyRoutineLog) => setDailyRoutineLogs((prev) => [log, ...prev]);
    const updateRoutineLog = (log: DailyRoutineLog) => setDailyRoutineLogs((prev) => prev.map((l) => (l.log_id === log.log_id ? log : l)));
    const addDetailedWorkoutLog = (log: DetailedWorkoutSession) => setDetailedWorkoutLogs((prev) => [...prev, log]);
    const syncWearableData = (id: number, data: any) => setMemberWearableLogs((prev) => ({ ...prev, [id]: [...(prev[id] || []), data] }));
    const updateLiveHealthData = (data: any) => setLiveHealthData((prev) => ({ ...prev, ...data }));
    const addSocialPost = (post: SocialPost) => setSocialPosts((prev) => [post, ...prev]);
    const updateSocialReview = (review: SocialReview) => setSocialReviews((prev) => prev.map((r) => (r.id === review.id ? review : r)));
    const addMedicalReport = (report: MedicalReport) => setMedicalReports((prev) => [report, ...prev]);
    const addAiRecommendation = (rec: AIRecommendation) => setAiRecommendations((prev) => [rec, ...prev]);
    const approveRecommendation = (id: string) => setAiRecommendations((prev) => prev.map((r) => (r.rec_id === id ? { ...r, admin_approval: true } : r)));
    const addMedicalConsultation = (c: MedicalConsultation) => setMedicalConsultations((prev) => [c, ...prev]);
    const updateMedicalConsultation = (c: MedicalConsultation) => setMedicalConsultations((prev) => prev.map((con) => (con.id === c.id ? c : con)));
    const addInventory = (item: InventoryItem) => setInventory((prev) => [...prev, item]);
    const updateInventory = (item: InventoryItem) => setInventory((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    const addOrder = (order: any) => setOrders((prev) => [order, ...prev]);
    const updateMachine = (machine: GymMachine) => setMachines((prev) => prev.map((m) => (m.id === machine.id ? machine : m)));
    const addSleepLog = (log: SleepLog) => setSleepLogs((prev) => [log, ...prev]);
    const addStoreProduct = (product: StoreProduct) => setStoreProducts((prev) => [product, ...prev]);
    const updateStoreProduct = (product: StoreProduct) => setStoreProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    const deleteStoreProduct = (id: string) => setStoreProducts((prev) => prev.filter((p) => p.id !== id));
    const addStoreOrder = (order: StoreOrder) => setStoreOrders((prev) => [order, ...prev]);
    const addStoreTransaction = (tx: StoreTransaction) => setStoreTransactions((prev) => [tx, ...prev]);
    const updateStoreOrderStatus = (id: string, s: StoreOrder['status']) => setStoreOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: s } : o)));
    const addWalletTransaction = (t: WalletTransaction) => setWalletTransactions((prev) => [t, ...prev]);
    const addEMIPlan = (plan: EMIPlan) => setEmiPlans((prev) => [plan, ...prev]);
    const updateEMIPlan = (plan: EMIPlan) => setEmiPlans((prev) => prev.map((p) => (p.id === plan.id ? plan : p)));
    const addCommunityPost = (post: CommunityPost) => setCommunityPosts((prev) => [post, ...prev]);
    const likeCommunityPost = (postId: string) => setCommunityPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p)));
    const commentCommunityPost = (postId: string, comment: { memberName: string; text: string }) =>
        setCommunityPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p)));
    const updateGlobalFees = (fees: { admissionFee: number; receiptSignature?: string }) => {
        void updateGymFields({ globalFees: fees } as any);
    };

    const activeMemberCount = members.filter((m) => m.status === 'Active' && !m.archived).length;
    const totalRevenue = invoices
        .filter((i) => i.status === 'Paid' || i.status === 'Partial')
        .reduce((acc, i) => acc + (i.paidAmount ?? (i.status === 'Paid' ? i.amount : 0)), 0);

    const value: DataContextType = {
        members, addMember, signupMember, updateMember, archiveMember, deleteMember,
        packages, addPackage, updatePackage, deletePackage,
        invoices, addInvoice, updateInvoiceStatus, recordInvoicePayment, refundInvoice, deleteInvoice,
        transactions, addTransaction,
        staff, setStaff, addStaff, updateStaff, deleteStaff,
        expenses, addExpense, updateExpense, deleteExpense,
        leads, setLeads, addLead, updateLead, deleteLead,
        offers, addOffer, updateOffer, deleteOffer, validateOfferCoupon,
        reviews, addReview, updateReview, deleteReview,
        workoutTemplates, addWorkoutTemplate, updateWorkoutTemplate, deleteWorkoutTemplate,
        dietPlans, addDietPlan, updateDietPlan, deleteDietPlan,
        attendanceRecords, markAttendance, checkInMember, recordDeniedAttendance, checkOutMember, deleteAttendance,
        whatsappLogs, addWhatsAppLog,
        resetDatabaseToSeed,
        refreshFromServer,
        isHydrating,
        dailyRoutineLogs, addRoutineLog, updateRoutineLog,
        detailedWorkoutLogs, addDetailedWorkoutLog,
        memberWearableLogs, syncWearableData,
        liveHealthData, updateLiveHealthData,
        connectedDevice, setConnectedDevice,
        auditLogs, addAuditLog,
        socialPosts, addSocialPost,
        socialReviews, updateSocialReview,
        medicalReports, addMedicalReport,
        aiRecommendations, addAiRecommendation, approveRecommendation,
        medicalConsultations, addMedicalConsultation, updateMedicalConsultation,
        systemHealth: 100, isSyncing: isHydrating, evolutionLevel: 1, systemVersion: 'v2-phase1',
        triggerSystemUpdate: () => {},
        inventory, addInventory, updateInventory,
        orders, addOrder,
        machines, updateMachine,
        aiProvider: 'GEMINI',
        ofsLogs,
        activeMemberCount, totalRevenue,
        automationEvents,
        isDeveloperMode, setDeveloperMode: setIsDeveloperMode,
        osSubscription, setOSSubscription,
        sleepLogs, addSleepLog,
        storeProducts, addStoreProduct, updateStoreProduct, deleteStoreProduct,
        storeOrders, addStoreOrder, updateStoreOrderStatus,
        storeTransactions, addStoreTransaction,
        walletTransactions, addWalletTransaction,
        emiPlans, addEMIPlan, updateEMIPlan,
        communityPosts, addCommunityPost, likeCommunityPost, commentCommunityPost,
        globalFees, updateGlobalFees,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
