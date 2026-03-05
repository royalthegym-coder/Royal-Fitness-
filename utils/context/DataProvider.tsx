
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
    Member, Package, Invoice, Staff, Expense, Lead, 
    Transaction, HealthData, WorkoutTemplate, 
    DailyRoutineLog, AIRecommendation, MedicalReport,
    SocialPost, SocialReview, MedicalConsultation,
    InventoryItem, GymMachine, DetailedWorkoutSession, OFSLog,
    AttendanceRecord
} from '../../types';
import { 
    INITIAL_MEMBERS, INITIAL_PACKAGES, INITIAL_INVOICES, 
    INITIAL_TRANSACTIONS, INITIAL_STAFF, INITIAL_EXPENSES, 
    INITIAL_LEADS, INITIAL_HEALTH_DATA, INITIAL_WORKOUT_TEMPLATES,
    INITIAL_INVENTORY
} from '../../constants';
import { sendWhatsAppWelcomeMessage, sendPaymentRequest, sendPaymentReceipt } from '../../lib/whatsapp';
import { syncData } from '../../lib/supabase';

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
    deleteMember: (id: number) => void;
    
    packages: Package[];
    addPackage: (p: Package) => void;
    updatePackage: (p: Package) => void;
    deletePackage: (id: number) => void;
    
    invoices: Invoice[];
    addInvoice: (i: Invoice) => void;
    updateInvoiceStatus: (id: number, status: 'Paid' | 'Pending' | 'Overdue' | 'Verification Pending' | 'Rejected') => void;
    
    transactions: Transaction[];
    addTransaction: (t: Transaction) => void;
    
    staff: Staff[];
    expenses: Expense[];
    
    leads: Lead[];
    setLeads: (leads: Lead[]) => void;
    addLead: (l: Lead) => void;
    updateLead: (l: Lead) => void;
    deleteLead: (id: number) => void;
    
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
    updateInventory: (item: InventoryItem) => void;
    
    orders: any[];
    addOrder: (order: any) => void;
    machines: GymMachine[];
    updateMachine: (machine: GymMachine) => void;
    
    aiProvider: string;
    
    ofsLogs: OFSLog[];
    
    activeMemberCount: number;
    totalRevenue: number;

    // Automation State
    automationEvents: string[];

    attendanceRecords: AttendanceRecord[];
    markAttendance: (record: AttendanceRecord) => void;
    deleteAttendance: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Inventory is now imported from constants.ts

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- STATE INITIALIZATION ---
    // Helper to load from storage or fallback to initial
    const loadState = <T,>(key: string, fallback: T): T => {
        if (typeof window === 'undefined') return fallback;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    };

    // --- ONE-TIME SYSTEM RESET ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasReset = localStorage.getItem('has_reset_v32_final');
            if (!hasReset) {
                console.log("Performing full system reset for final launch...");
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('royal_')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
                localStorage.setItem('has_reset_v32_final', 'true');
                window.location.reload();
            }
        }
    }, []);

    const [members, setMembers] = useState<Member[]>(() => loadState('royal_members', INITIAL_MEMBERS));
    const [packages, setPackages] = useState<Package[]>(() => loadState('royal_packages', INITIAL_PACKAGES));
    const [invoices, setInvoices] = useState<Invoice[]>(() => loadState('royal_invoices', INITIAL_INVOICES));
    const [transactions, setTransactions] = useState<Transaction[]>(() => loadState('royal_transactions', INITIAL_TRANSACTIONS));
    const [staff, setStaff] = useState<Staff[]>(() => loadState('royal_staff', INITIAL_STAFF));
    const [expenses, setExpenses] = useState<Expense[]>(() => loadState('royal_expenses', INITIAL_EXPENSES));
    const [leads, setLeads] = useState<Lead[]>(() => loadState('royal_leads', INITIAL_LEADS));
    const [inventory, setInventory] = useState<InventoryItem[]>(() => loadState('royal_inventory', INITIAL_INVENTORY));
    const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>(() => loadState('royal_workout_templates', INITIAL_WORKOUT_TEMPLATES));
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => loadState('royal_attendance', []));
    
    // Non-persisted or less critical states
    const [dailyRoutineLogs, setDailyRoutineLogs] = useState<DailyRoutineLog[]>([]);
    const [detailedWorkoutLogs, setDetailedWorkoutLogs] = useState<DetailedWorkoutSession[]>([]);
    const [memberWearableLogs, setMemberWearableLogs] = useState<Record<number, any[]>>({});
    const [liveHealthData, setLiveHealthData] = useState<HealthData>(INITIAL_HEALTH_DATA);
    const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
    const [socialReviews, setSocialReviews] = useState<SocialReview[]>([]);
    const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
    const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
    const [medicalConsultations, setMedicalConsultations] = useState<MedicalConsultation[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [machines, setMachines] = useState<GymMachine[]>([]);
    const [ofsLogs, setOfsLogs] = useState<OFSLog[]>([]);
    const [automationEvents, setAutomationEvents] = useState<string[]>([]);
    
    // --- SYSTEM CORE STATES ---
    const [systemHealth, setSystemHealth] = useState(100);
    const [isSyncing, setIsSyncing] = useState(false);
    const [evolutionLevel, setEvolutionLevel] = useState(1.0);
    const [systemVersion, setSystemVersion] = useState("v1.0 STABLE ORIGIN");

    const [aiProvider, setAiProvider] = useState(localStorage.getItem('royal_ai_provider') || 'HUGGINGFACE');

    // --- PERSISTENCE EFFECTS ---
    useEffect(() => { localStorage.setItem('royal_members', JSON.stringify(members)); }, [members]);
    useEffect(() => { localStorage.setItem('royal_packages', JSON.stringify(packages)); }, [packages]);
    useEffect(() => { localStorage.setItem('royal_invoices', JSON.stringify(invoices)); }, [invoices]);
    useEffect(() => { localStorage.setItem('royal_transactions', JSON.stringify(transactions)); }, [transactions]);
    useEffect(() => { localStorage.setItem('royal_staff', JSON.stringify(staff)); }, [staff]);
    useEffect(() => { localStorage.setItem('royal_expenses', JSON.stringify(expenses)); }, [expenses]);
    useEffect(() => { localStorage.setItem('royal_leads', JSON.stringify(leads)); }, [leads]);
    useEffect(() => { localStorage.setItem('royal_inventory', JSON.stringify(inventory)); }, [inventory]);
    useEffect(() => { localStorage.setItem('royal_workout_templates', JSON.stringify(workoutTemplates)); }, [workoutTemplates]);
    useEffect(() => { localStorage.setItem('royal_attendance', JSON.stringify(attendanceRecords)); }, [attendanceRecords]);

    useEffect(() => {
        const handleStorage = () => setAiProvider(localStorage.getItem('royal_ai_provider') || 'HUGGINGFACE');
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // --- AUTOMATION & LOGGING HELPERS ---
    const logEvent = (msg: string) => {
        setAutomationEvents(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const addAuditLog = (log: any) => setAuditLogs(prev => [{...log, timestamp: new Date().toISOString()}, ...prev].slice(0, 100));

    // --- ATTENDANCE ACTIONS ---
    const markAttendance = (record: AttendanceRecord) => {
        setAttendanceRecords(prev => {
            const existing = prev.find(r => r.memberId === record.memberId && r.date === record.date);
            if (existing) {
                return prev.map(r => r.id === existing.id ? record : r);
            }
            return [record, ...prev];
        });
        logEvent(`Attendance marked for Member ID ${record.memberId} (${record.status}).`);
    };

    const deleteAttendance = (id: string) => {
        setAttendanceRecords(prev => prev.filter(r => r.id !== id));
    };

    // --- ACTIONS WITH AUTOMATION ---

    const addMember = (m: Member) => {
        setMembers(prev => [...prev, m]);
        logEvent(`New Member ${m.name} Added (Admin).`);
        // Supabase के साथ स्थानीय संग्रहण (LocalStorage) का उपयोग
        syncData('members', m);
    };

    const signupMember = async (data: any): Promise<boolean> => {
        return new Promise((resolve) => {
            const newId = Math.max(0, ...members.map(m => m.id)) + 1;
            const newMember: Member = {
                id: newId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                joinDate: new Date().toISOString().split('T')[0],
                packageId: 3, // Default basic
                status: 'Pending', // KEY: Pending Approval
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
                automation_settings: { remind_12hrs_before: true, auto_renewal: false, ai_coaching: true, sync_id: '' },
                rpeHistory: [],
                anatomicalStatus: {},
                emergency_contact: { name: '', phone: '', relation: '' },
                initial_assessment: { fitness_level: 'Beginner', pushup_count: 0, plank_time: '0s', squat_count: 0, comments: '' }
            };
            
            setMembers(prev => [...prev, newMember]);
            logEvent(`New Signup: ${newMember.name}. Status: PENDING APPROVAL.`);
            
            // Supabase के साथ स्थानीय संग्रहण (LocalStorage) का उपयोग
            syncData('members', newMember);
            
            // Send Audit Log
            addAuditLog({
                member_id: newId,
                action: 'SIGNUP_REQUEST',
                details: `New user ${newMember.name} requested access. Awaiting Admin Approval.`
            });
            
            resolve(true);
        });
    };

    const updateMember = (m: Member) => {
        setMembers(prev => prev.map(mem => mem.id === m.id ? m : mem));
        // Supabase के साथ स्थानीय संग्रहण (LocalStorage) का उपयोग
        syncData('members', m);
    };
    const deleteMember = (id: number) => {
        // 1. Get Member Name for Transaction Deletion
        const member = members.find(m => m.id === id);
        const memberName = member ? member.name : null;

        // 2. Delete Member
        setMembers(prev => prev.filter(m => m.id !== id));

        // 3. Cascade Delete Invoices
        setInvoices(prev => prev.filter(i => i.memberId !== id));

        // 4. Cascade Delete Transactions (by Name)
        if (memberName) {
            setTransactions(prev => prev.filter(t => t.memberName !== memberName));
        }

        // 5. Cascade Delete Routine Logs
        setDailyRoutineLogs(prev => prev.filter(l => l.member_id !== id));

        // 6. Cascade Delete Detailed Workout Logs
        setDetailedWorkoutLogs(prev => prev.filter(l => l.memberId !== id));

        // 7. Cascade Delete Wearable Logs
        setMemberWearableLogs(prev => {
            const newState = { ...prev };
            delete newState[id];
            return newState;
        });

        // 8. Cascade Delete Medical Reports & Recommendations
        // First find reports to be deleted to link to recommendations
        const memberReportIds = medicalReports.filter(r => r.member_id === id).map(r => r.report_id);
        
        setMedicalReports(prev => prev.filter(r => r.member_id !== id));
        setAiRecommendations(prev => prev.filter(rec => !memberReportIds.includes(rec.report_id)));

        // 9. Cascade Delete Medical Consultations
        setMedicalConsultations(prev => prev.filter(c => c.memberId !== id));

        // 10. Cascade Delete Attendance Records
        setAttendanceRecords(prev => prev.filter(r => r.memberId !== id));

        // 11. Cascade Delete Audit Logs
        setAuditLogs(prev => prev.filter(l => l.member_id !== id));

        // 12. Cascade Delete OFS Logs
        setOfsLogs(prev => prev.filter(l => l.memberId !== id));

        // 13. Cascade Delete Leads (if converted)
        if (member) {
            setLeads(prev => prev.filter(l => l.email !== member.email && l.phone !== member.phone));
        }

        logEvent(`Member ID ${id} (${memberName}) and all associated data permanently deleted.`);
    };

    const addPackage = (p: Package) => setPackages(prev => [...prev, p]);
    const updatePackage = (p: Package) => setPackages(prev => prev.map(pkg => pkg.id === p.id ? p : pkg));
    const deletePackage = (id: number) => setPackages(prev => prev.filter(p => p.id !== id));

    const addInvoice = (i: Invoice) => {
        setInvoices(prev => [i, ...prev]);
        if (i.status === 'Pending') {
            const member = members.find(m => m.id === i.memberId);
            if (member && member.whatsappConsent) {
                logEvent(`Invoice Generated for ${member.name}. Sending Payment Link.`);
                sendPaymentRequest(member, i.amount, i.packageName).then(() => logEvent(`WhatsApp: Payment Link Sent.`));
            }
        }
    };

    const updateInvoiceStatus = (id: number, status: 'Paid' | 'Pending' | 'Overdue' | 'Verification Pending' | 'Rejected') => {
        setInvoices(prev => {
            const updatedInvoices = prev.map(inv => inv.id === id ? { ...inv, status } : inv);
            
            // Razorpay Integration Logic: If paid, activate member
            if (status === 'Paid') {
                const invoice = prev.find(inv => inv.id === id);
                if (invoice) {
                    setMembers(membersPrev => membersPrev.map(m => 
                        m.id === invoice.memberId ? { ...m, status: 'Active' } : m
                    ));
                }
            }
            return updatedInvoices;
        });
        logEvent(`Invoice #${id} status updated to ${status}. Syncing Ledger.`);
    };

    const addTransaction = (t: Transaction) => {
        setTransactions(prev => [t, ...prev]);
        logEvent(`Payment Received: ₹${t.amount}. Triggering Post-Purchase Flow.`);
        const memberName = t.memberName; 
        const member = members.find(m => m.name === memberName);
        
        if (member && member.whatsappConsent) {
            sendPaymentReceipt(member.name, member.phone, t.amount, t.id, t.method).then(() => {
                logEvent(`WhatsApp: Receipt for ₹${t.amount} sent via ${t.method}.`);
            });
        }
        addAuditLog({ member_id: 0, action: 'GOOGLE_SYNC', details: 'Conversion Value Event Sent to Google Ads/Business' });
    };

    const addLead = (l: Lead) => {
        setLeads(prev => [...prev, l]);
        logEvent(`New Lead via ${l.source}. Auto-Assigning Sales Bot.`);
    };
    
    const updateLead = (l: Lead) => setLeads(prev => prev.map(lead => lead.id === l.id ? l : lead));
    const deleteLead = (id: number) => setLeads(prev => prev.filter(l => l.id !== id));

    const addRoutineLog = (log: DailyRoutineLog) => setDailyRoutineLogs(prev => [log, ...prev]);
    const updateRoutineLog = (log: DailyRoutineLog) => setDailyRoutineLogs(prev => prev.map(l => l.log_id === log.log_id ? log : l));

    const addDetailedWorkoutLog = (log: DetailedWorkoutSession) => setDetailedWorkoutLogs(prev => [...prev, log]);

    const syncWearableData = (id: number, data: any) => {
        setMemberWearableLogs(prev => ({
            ...prev,
            [id]: [...(prev[id] || []), data]
        }));
    };

    const updateLiveHealthData = (data: any) => setLiveHealthData(prev => ({ ...prev, ...data }));

    const addSocialPost = (post: SocialPost) => {
        setSocialPosts(prev => [post, ...prev]);
        logEvent(`Social: Post Scheduled for ${post.platform.join(', ')}. Syncing to Google Business.`);
    };
    
    const updateSocialReview = (review: SocialReview) => setSocialReviews(prev => prev.map(r => r.id === review.id ? review : r));

    const addMedicalReport = (report: MedicalReport) => setMedicalReports(prev => [report, ...prev]);
    const addAiRecommendation = (rec: AIRecommendation) => setAiRecommendations(prev => [rec, ...prev]);
    
    const approveRecommendation = (id: string) => {
        const rec = aiRecommendations.find(r => r.rec_id === id);
        if (rec) {
            setAiRecommendations(prev => prev.map(r => r.rec_id === id ? { ...r, admin_approval: true } : r));
        }
    };

    const addMedicalConsultation = (c: MedicalConsultation) => setMedicalConsultations(prev => [c, ...prev]);
    const updateMedicalConsultation = (c: MedicalConsultation) => setMedicalConsultations(prev => prev.map(con => con.id === c.id ? c : con));

    const updateInventory = (item: InventoryItem) => setInventory(prev => prev.map(i => i.id === item.id ? item : i));
    const addOrder = (order: any) => setOrders(prev => [order, ...prev]);
    const updateMachine = (machine: GymMachine) => setMachines(prev => prev.map(m => m.id === machine.id ? machine : m));

    // Derived
    const activeMemberCount = members.filter(m => m.status === 'Active').length;
    const totalRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);

    const triggerSystemUpdate = (targetVersion?: string) => {
        setIsSyncing(true);
        setTimeout(() => {
            if (targetVersion) {
                setSystemVersion(`${targetVersion} SINGULARITY`);
            } else {
                setSystemVersion(prev => {
                    const currentVer = parseFloat(prev.replace('v', '').split(' ')[0]);
                    return `v${(currentVer + 0.1).toFixed(1)} SINGULARITY`;
                });
            }
            setEvolutionLevel(prev => prev + 0.1);
            setIsSyncing(false);
        }, 3000);
    };

    const addWorkoutTemplate = (t: WorkoutTemplate) => {
        setWorkoutTemplates(prev => [t, ...prev]);
        logEvent(`New Workout Template Created: ${t.name}`);
    };

    const updateWorkoutTemplate = (t: WorkoutTemplate) => {
        setWorkoutTemplates(prev => prev.map(temp => temp.id === t.id ? t : temp));
        logEvent(`Workout Template Updated: ${t.name}`);
    };

    const value = {
        members, addMember, signupMember, updateMember, deleteMember,
        packages, addPackage, updatePackage, deletePackage,
        invoices, addInvoice, updateInvoiceStatus,
        transactions, addTransaction,
        staff, expenses,
        leads, setLeads, addLead, updateLead, deleteLead,
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
        systemHealth, isSyncing, evolutionLevel, systemVersion, triggerSystemUpdate,
        inventory, updateInventory,
        orders, addOrder,
        machines, updateMachine,
        aiProvider,
        ofsLogs,
        activeMemberCount, totalRevenue,
        automationEvents,
        workoutTemplates, addWorkoutTemplate, updateWorkoutTemplate,
        attendanceRecords, markAttendance, deleteAttendance
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
