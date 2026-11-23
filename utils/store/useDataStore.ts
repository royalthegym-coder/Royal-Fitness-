import { createStore } from 'zustand/vanilla';
import { useSyncExternalStore, useCallback } from 'react';
import { 
    Member, Package, Invoice, Staff, Expense, Lead, AdminProfile,
    Transaction, HealthData, WorkoutTemplate, 
    DailyRoutineLog, AIRecommendation, MedicalReport,
    SocialPost, SocialReview, MedicalConsultation, CommunityPost,
    InventoryItem, GymMachine, DetailedWorkoutSession, OFSLog,
    AttendanceRecord, SleepLog, StoreProduct, StoreOrder, WalletTransaction, EMIPlan
} from '../../types';
import { 
    INITIAL_MEMBERS, INITIAL_PACKAGES, INITIAL_INVOICES, 
    INITIAL_TRANSACTIONS, INITIAL_STAFF, INITIAL_EXPENSES, 
    INITIAL_LEADS, INITIAL_HEALTH_DATA, INITIAL_WORKOUT_TEMPLATES,
    INITIAL_INVENTORY, INITIAL_STORE_PRODUCTS
} from '../../constants';

export type SetStateAction<T> = T | ((prev: T) => T);

export interface DataState {
    members: Member[];
    packages: Package[];
    invoices: Invoice[];
    transactions: Transaction[];
    staff: Staff[];
    expenses: Expense[];
    leads: Lead[];
    inventory: InventoryItem[];
    workoutTemplates: WorkoutTemplate[];
    attendanceRecords: AttendanceRecord[];
    sleepLogs: SleepLog[];
    dailyRoutineLogs: DailyRoutineLog[];
    detailedWorkoutLogs: DetailedWorkoutSession[];
    storeProducts: StoreProduct[];
    storeOrders: StoreOrder[];
    walletTransactions: WalletTransaction[];
    emiPlans: EMIPlan[];
    communityPosts: CommunityPost[];
    memberWearableLogs: Record<number, any[]>;
    liveHealthData: HealthData;
    connectedDevice: any | null;
    adminProfile: AdminProfile;
    auditLogs: any[];
    socialPosts: SocialPost[];
    socialReviews: SocialReview[];
    medicalReports: MedicalReport[];
    aiRecommendations: AIRecommendation[];
    medicalConsultations: MedicalConsultation[];
    orders: any[];
    machines: GymMachine[];
    ofsLogs: OFSLog[];
    automationEvents: string[];
    isDeveloperMode: boolean;
    systemHealth: number;
    isSyncing: boolean;
    evolutionLevel: number;
    systemVersion: string;
    aiProvider: string;
}

export interface DataActions {
    setMembers: (val: SetStateAction<Member[]>) => void;
    setWorkoutTemplates: (val: SetStateAction<WorkoutTemplate[]>) => void;
    setAttendanceRecords: (val: SetStateAction<AttendanceRecord[]>) => void;
    setSleepLogs: (val: SetStateAction<SleepLog[]>) => void;
    setDailyRoutineLogs: (val: SetStateAction<DailyRoutineLog[]>) => void;
    setDetailedWorkoutLogs: (val: SetStateAction<DetailedWorkoutSession[]>) => void;
    setStoreProducts: (val: SetStateAction<StoreProduct[]>) => void;
    setStoreOrders: (val: SetStateAction<StoreOrder[]>) => void;
    setWalletTransactions: (val: SetStateAction<WalletTransaction[]>) => void;
    setEmiPlans: (val: SetStateAction<EMIPlan[]>) => void;
    setCommunityPosts: (val: SetStateAction<CommunityPost[]>) => void;
    addMember: (m: Member) => void;
    updateMember: (m: Member) => void;
    deleteMember: (id: number) => void;
    
    setPackages: (val: SetStateAction<Package[]>) => void;
    addPackage: (p: Package) => void;
    updatePackage: (p: Package) => void;
    deletePackage: (id: number) => void;
    
    setInvoices: (val: SetStateAction<Invoice[]>) => void;
    addInvoice: (i: Invoice) => void;
    updateInvoiceStatus: (id: number, status: 'Paid' | 'Pending' | 'Overdue' | 'Verification Pending' | 'Rejected', overrideAmount?: number) => void;
    
    setTransactions: (val: SetStateAction<Transaction[]>) => void;
    addTransaction: (t: Transaction) => void;
    
    setStaff: (val: SetStateAction<Staff[]>) => void;
    setExpenses: (val: SetStateAction<Expense[]>) => void;
    
    setLeads: (val: SetStateAction<Lead[]>) => void;
    addLead: (l: Lead) => void;
    updateLead: (l: Lead) => void;
    deleteLead: (id: number) => void;
    
    setInventory: (val: SetStateAction<InventoryItem[]>) => void;
    updateInventory: (item: InventoryItem) => void;
    
    setDeveloperMode: (enabled: boolean) => void;
    
    // Derived values

    signupMember: (data: any) => Promise<boolean>;
    addRoutineLog: (log: DailyRoutineLog) => void;
    updateRoutineLog: (log: DailyRoutineLog) => void;
    addDetailedWorkoutLog: (log: DetailedWorkoutSession) => void;
    syncWearableData: (id: number, data: any) => void;
    updateLiveHealthData: (data: any) => void;
    setConnectedDevice: (device: any) => void;
    addAuditLog: (log: any) => void;
    addSocialPost: (post: SocialPost) => void;
    updateSocialReview: (review: SocialReview) => void;
    addMedicalReport: (report: MedicalReport) => void;
    addAiRecommendation: (rec: AIRecommendation) => void;
    approveRecommendation: (id: string) => void;
    addMedicalConsultation: (consult: MedicalConsultation) => void;
    updateMedicalConsultation: (consult: MedicalConsultation) => void;
    triggerSystemUpdate: () => void;
    addOrder: (order: any) => void;
    updateMachine: (machine: GymMachine) => void;
    markAttendance: (record: AttendanceRecord) => void;
    deleteAttendance: (id: string) => void;
    addSleepLog: (log: SleepLog) => void;
    addStoreProduct: (product: StoreProduct) => void;
    updateStoreProduct: (product: StoreProduct) => void;
    deleteStoreProduct: (id: string) => void;
    addStoreOrder: (order: StoreOrder) => void;
    updateStoreOrderStatus: (id: string, status: StoreOrder['status']) => void;
    addWalletTransaction: (transaction: WalletTransaction) => void;
    addEMIPlan: (plan: EMIPlan) => void;
    updateEMIPlan: (plan: EMIPlan) => void;
    addCommunityPost: (post: CommunityPost) => void;
    likeCommunityPost: (postId: string) => void;
    commentCommunityPost: (postId: string, comment: { memberName: string; text: string }) => void;
    addWorkoutTemplate: (t: WorkoutTemplate) => void;
    updateWorkoutTemplate: (t: WorkoutTemplate) => void;
    updateAdminProfile: (profile: Partial<AdminProfile>) => void;
    activeMemberCount: () => number;
    totalRevenue: () => number;
    setAiProvider: (provider: string) => void;
}

export type DataStore = DataState & DataActions;

export const dataStore = createStore<DataStore>((set, get) => ({
    // Initial State
    members: INITIAL_MEMBERS,
    packages: INITIAL_PACKAGES,
    invoices: INITIAL_INVOICES,
    transactions: INITIAL_TRANSACTIONS,
    staff: INITIAL_STAFF,
    expenses: INITIAL_EXPENSES,
    leads: INITIAL_LEADS,
    inventory: INITIAL_INVENTORY,
    workoutTemplates: INITIAL_WORKOUT_TEMPLATES,
    attendanceRecords: [],
    sleepLogs: [],
    dailyRoutineLogs: [],
    detailedWorkoutLogs: [],
    storeProducts: INITIAL_STORE_PRODUCTS,
    storeOrders: [],
    walletTransactions: [],
    emiPlans: [],
    communityPosts: [],
    memberWearableLogs: {},
    liveHealthData: INITIAL_HEALTH_DATA,
    connectedDevice: null,
    adminProfile: {
        uid: '',
        role: '',
        name: '',
        lastLogin: '',
        gymName: '',
        ownerName: '',
        email: '',
        phone: '',
        subscriptionLevel: 'none',
        onboarded: false
    },
    auditLogs: [],
    socialPosts: [],
    socialReviews: [],
    medicalReports: [],
    aiRecommendations: [],
    medicalConsultations: [],
    orders: [],
    machines: [],
    ofsLogs: [],
    automationEvents: [],
    isDeveloperMode: false,
    systemHealth: 100,
    isSyncing: false,
    evolutionLevel: 1.0,
    systemVersion: "v1.0 STABLE ORIGIN",
    aiProvider: 'CORE_AI',
    
    setAiProvider: (provider: string) => set({ aiProvider: provider }),

    setWorkoutTemplates: (val) => set(s => ({ workoutTemplates: typeof val === 'function' ? (val as Function)(s.workoutTemplates) : val })),
    setAttendanceRecords: (val) => set(s => ({ attendanceRecords: typeof val === 'function' ? (val as Function)(s.attendanceRecords) : val })),
    setSleepLogs: (val) => set(s => ({ sleepLogs: typeof val === 'function' ? (val as Function)(s.sleepLogs) : val })),
    setDailyRoutineLogs: (val) => set(s => ({ dailyRoutineLogs: typeof val === 'function' ? (val as Function)(s.dailyRoutineLogs) : val })),
    setDetailedWorkoutLogs: (val) => set(s => ({ detailedWorkoutLogs: typeof val === 'function' ? (val as Function)(s.detailedWorkoutLogs) : val })),
    setStoreProducts: (val) => set(s => ({ storeProducts: typeof val === 'function' ? (val as Function)(s.storeProducts) : val })),
    setStoreOrders: (val) => set(s => ({ storeOrders: typeof val === 'function' ? (val as Function)(s.storeOrders) : val })),
    setWalletTransactions: (val) => set(s => ({ walletTransactions: typeof val === 'function' ? (val as Function)(s.walletTransactions) : val })),
    setEmiPlans: (val) => set(s => ({ emiPlans: typeof val === 'function' ? (val as Function)(s.emiPlans) : val })),
    setCommunityPosts: (val) => set(s => ({ communityPosts: typeof val === 'function' ? (val as Function)(s.communityPosts) : val })),
    
    // Actions
    setMembers: (val) => set(s => ({ members: typeof val === 'function' ? (val as Function)(s.members) : val })),
    addMember: (m) => set((state) => ({ members: [...state.members, m] })),
    updateMember: (m) => set((state) => ({ members: state.members.map(x => x.id === m.id ? m : x) })),
    deleteMember: (id) => set((state) => ({ members: state.members.filter(x => x.id !== id) })),

    setPackages: (val) => set(s => ({ packages: typeof val === 'function' ? (val as Function)(s.packages) : val })),
    addPackage: (p) => set((state) => ({ packages: [...state.packages, p] })),
    updatePackage: (p) => set((state) => ({ packages: state.packages.map(x => x.id === p.id ? p : x) })),
    deletePackage: (id) => set((state) => ({ packages: state.packages.filter(x => x.id !== id) })),

    setInvoices: (val) => set(s => ({ invoices: typeof val === 'function' ? (val as Function)(s.invoices) : val })),
    addInvoice: (i) => set((state) => ({ invoices: [...state.invoices, i] })),
    updateInvoiceStatus: (id, status, overrideAmount) => set((state) => ({
        invoices: state.invoices.map(inv => {
            if (inv.id === id) {
                return { 
                    ...inv, 
                    status, 
                    amount: overrideAmount !== undefined ? overrideAmount : inv.amount 
                };
            }
            return inv;
        })
    })),

    setTransactions: (val) => set(s => ({ transactions: typeof val === 'function' ? (val as Function)(s.transactions) : val })),
    addTransaction: (t) => set((state) => ({ transactions: [...state.transactions, t] })),

    setStaff: (val) => set(s => ({ staff: typeof val === 'function' ? (val as Function)(s.staff) : val })),
    setExpenses: (val) => set(s => ({ expenses: typeof val === 'function' ? (val as Function)(s.expenses) : val })),

    setLeads: (val) => set(s => ({ leads: typeof val === 'function' ? (val as Function)(s.leads) : val })),
    addLead: (l) => set((state) => ({ leads: [...state.leads, l] })),
    updateLead: (l) => set((state) => ({ leads: state.leads.map(x => x.id === l.id ? l : x) })),
    deleteLead: (id) => set((state) => ({ leads: state.leads.filter(x => x.id !== id) })),

    setInventory: (val) => set(s => ({ inventory: typeof val === 'function' ? (val as Function)(s.inventory) : val })),
    updateInventory: (item) => set((state) => ({ inventory: state.inventory.map(x => x.id === item.id ? item : x) })),

    setDeveloperMode: (enabled) => set({ isDeveloperMode: enabled }),
    updateAdminProfile: (profile) => set(s => ({ adminProfile: { ...s.adminProfile, ...profile } })),

    signupMember: async (data: any) => {
        const currentMembers = get().members;
        const newId = Math.max(0, ...currentMembers.map(m => m.id)) + 1;
        const newMember: Member = {
            id: newId,
            name: data.name || 'New Member',
            email: data.email || '',
            phone: data.phone || '',
            joinDate: new Date().toISOString().split('T')[0],
            packageId: 3,
            status: 'Pending',
            avatar: `https://i.pravatar.cc/150?u=${newId}`,
            whatsappConsent: true,
            xp: 0,
            level: 1,
            achievements: [],
            hrv: 70,
            lbm: 0,
            health_score: 50,
            bio_age: 0,
            assigned_tests: [],
            medical_history: { conditions: [], pastInjuries: '', medications: '', lifestyle: {} },
            physical_metrics: { height: 0, weight: 0, body_fat: 0, muscle_mass: 0, target_weight: 0, body_type: 'Mesomorph', activity_level: 'Moderate' },
            height: 0,
            weight: 0,
            bodyFat: 0,
            muscleMass: 0,
            automation_settings: { remind_12hrs_before: true, auto_renewal: false, ai_coaching: true, sync_id: '' },
            rpeHistory: [],
            anatomicalStatus: {},
            emergency_contact: { name: '', phone: '', relation: '' },
            initial_assessment: { fitness_level: 'Beginner', pushup_count: 0, plank_time: '0s', squat_count: 0, comments: '' }
        };
        set(s => ({ members: [...s.members, newMember] }));
        return true;
    },
    addRoutineLog: (log) => set(s => ({ dailyRoutineLogs: [log, ...s.dailyRoutineLogs] })),
    updateRoutineLog: (log) => set(s => ({ dailyRoutineLogs: s.dailyRoutineLogs.map(l => l.log_id === log.log_id ? log : l) })),
    addDetailedWorkoutLog: (log) => set(s => ({ detailedWorkoutLogs: [...s.detailedWorkoutLogs, log] })),
    syncWearableData: (id, data) => set(s => ({ memberWearableLogs: { ...s.memberWearableLogs, [id]: [...(s.memberWearableLogs[id] || []), data] } })),
    updateLiveHealthData: (data) => set(s => ({ liveHealthData: { ...s.liveHealthData, ...data } })),
    setConnectedDevice: (device) => set({ connectedDevice: device }),
    addAuditLog: (log) => set(s => ({ auditLogs: [{...log, timestamp: new Date().toISOString()}, ...s.auditLogs].slice(0, 100) })),
    addSocialPost: (post) => set(s => ({ socialPosts: [post, ...s.socialPosts] })),
    updateSocialReview: (review) => set(s => ({ socialReviews: s.socialReviews.map(r => r.id === review.id ? review : r) })),
    addMedicalReport: (report) => set(s => ({ medicalReports: [report, ...s.medicalReports] })),
    addAiRecommendation: (rec) => set(s => ({ aiRecommendations: [rec, ...s.aiRecommendations] })),
    approveRecommendation: (id) => set(s => ({ aiRecommendations: s.aiRecommendations.map(r => r.rec_id === id ? { ...r, admin_approval: true } : r) })),
    addMedicalConsultation: (consult) => set(s => ({ medicalConsultations: [consult, ...s.medicalConsultations] })),
    updateMedicalConsultation: (consult) => set(s => ({ medicalConsultations: s.medicalConsultations.map(c => c.id === consult.id ? consult : c) })),
    triggerSystemUpdate: () => set(s => ({ evolutionLevel: s.evolutionLevel + 0.1 })),
    addOrder: (order) => set(s => ({ orders: [order, ...s.orders] })),
    updateMachine: (machine) => set(s => ({ machines: s.machines.map(m => m.id === machine.id ? machine : m) })),
    markAttendance: (record) => set(s => {
        const existing = s.attendanceRecords.find(r => r.memberId === record.memberId && r.date === record.date);
        if (existing) return { attendanceRecords: s.attendanceRecords.map(r => r.id === existing.id ? record : r) };
        return { attendanceRecords: [record, ...s.attendanceRecords] };
    }),
    deleteAttendance: (id) => set(s => ({ attendanceRecords: s.attendanceRecords.filter(r => r.id !== id) })),
    addSleepLog: (log) => set(s => ({ sleepLogs: [log, ...s.sleepLogs] })),
    addStoreProduct: (product) => set(s => ({ storeProducts: [product, ...s.storeProducts] })),
    updateStoreProduct: (product) => set(s => ({ storeProducts: s.storeProducts.map(p => p.id === product.id ? product : p) })),
    deleteStoreProduct: (id) => set(s => ({ storeProducts: s.storeProducts.filter(p => p.id !== id) })),
    addStoreOrder: (order) => set(s => ({ storeOrders: [order, ...s.storeOrders] })),
    updateStoreOrderStatus: (id, status) => set(s => ({ storeOrders: s.storeOrders.map(o => o.id === id ? { ...o, status } : o) })),
    addWalletTransaction: (transaction) => set(s => {
        const newTrans = [transaction, ...s.walletTransactions];
        const newMembers = s.members.map(m => {
            if (m.id === transaction.memberId) {
                const bal = m.walletBalance || 0;
                return { ...m, walletBalance: transaction.type === 'credit' ? bal + transaction.amount : bal - transaction.amount };
            }
            return m;
        });
        return { walletTransactions: newTrans, members: newMembers };
    }),
    addEMIPlan: (plan) => set(s => ({ emiPlans: [plan, ...s.emiPlans] })),
    updateEMIPlan: (plan) => set(s => ({ emiPlans: s.emiPlans.map(p => p.id === plan.id ? plan : p) })),
    addCommunityPost: (post) => set(s => ({ communityPosts: [post, ...s.communityPosts] })),
    likeCommunityPost: (postId) => set(s => ({ communityPosts: s.communityPosts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p) })),
    commentCommunityPost: (postId, comment) => set(s => ({ communityPosts: s.communityPosts.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p) })),
    addWorkoutTemplate: (t) => set(s => ({ workoutTemplates: [t, ...s.workoutTemplates] })),
    updateWorkoutTemplate: (t) => set(s => ({ workoutTemplates: s.workoutTemplates.map(tmp => tmp.id === t.id ? t : tmp) })),
    activeMemberCount: () => get().members.filter(m => m.status === 'Active').length,
    totalRevenue: () => get().transactions.reduce((sum, t) => sum + t.amount, 0),
}));

export const useDataStore = Object.assign(
  function useDataStoreHook<U = DataStore>(selector?: (state: DataStore) => U): U {
    const sel = selector || ((s: DataStore) => s as unknown as U);
    return useSyncExternalStore(
      dataStore.subscribe,
      useCallback(() => sel(dataStore.getState()), [sel]),
      useCallback(() => sel(dataStore.getInitialState()), [sel])
    );
  },
  dataStore
);

