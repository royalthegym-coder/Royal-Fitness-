
export interface AIRecommendation {
    id?: string;
    rec_id?: string;
    report_id?: string;
    type?: string;
    message?: string;
    priority?: string;
    healthScore?: number;
    bio_age?: number;
    hormonal_analysis?: string;
    clinical_protocol?: string;
    deficiencies?: string[];
    supplement_stack?: string[];
    diet_modifications?: string[];
    workout_adjust?: string[];
    prediction?: string;
    admin_approval?: boolean;
}

export interface MedicalReport {
    id: string;
    date: string;
    title: string;
    summary: string;
}

export interface BroadcastMessage {
    id: string | number;
    title?: string;
    message: string;
    date?: string;
    audience?: string;
    recipientCount?: number;
    sentAt?: string;
}

export interface GoogleReview {
    id: string;
    author: string;
    rating: number;
    content: string;
    comment?: string;
    timestamp: string;
}

export interface GoogleBusinessPost {
    id: string;
    content: string;
    timestamp: string;
}

export interface DailyRoutineLog {
    id?: string;
    log_id?: string;
    member_id?: number;
    date?: string;
    activities?: any[];
    is_done?: boolean;
    task_type?: string;
    task_name?: string;
    task_desc?: string;
    time_scheduled?: string;
    task_time?: string;
}

export interface DailySchedule {
    id: string;
    date: string;
    events: any[];
}

export interface MemberSchedules {
    [memberId: number]: DailySchedule[];
}

export interface NutritionItem {
    id: string;
    food_name: string;
    regional_name?: string;
    category: string;
    protein_per_100g: number;
    carbs_per_100g: number;
    fats_per_100g: number;
    fiber_per_100g: number;
    calories_per_100g: number;
    glycemic_index?: number;
    tags: string[];
    is_local_rajasthani: boolean;
    ayurvedic_nature?: 'Vata' | 'Pitta' | 'Kapha' | 'Tridoshic' | string;
    seasonal_availability?: string[];
}

export type View = 
    | 'dashboard' | 'members' | 'billing' | 'packages' | 'staff' 
    | 'expenses' | 'settings' | 'futureOFSAdmin' | 'healthEngine' 
    | 'aetherMed' | 'geniusMode' | 'workouts' | 'diet' | 'synthesisX' 
    | 'royalOvermind' | 'revenueOracle' | 'cityHealthMap' | 'bioScout' 
    | 'bots' | 'crm' | 'googleBusiness' | 'whatsapp' | 'socialHive' 
    | 'visualLaunch' | 'royalSingularity' | 'aetherOmni' | 'aetherReality' 
    | 'synapseIoT' | 'neuroSync' | 'autoupgrade' | 'selfrepair' 
    | 'neuralCore' | 'geminiHub' | 'autoProcurement' | 'quantumLedger' 
    | 'security' | 'debugEngine' | 'performance' | 'tasks' | 'storkTeam'
    | 'payment' | 'leads' | 'aiFitnessTracker' | 'hormonalClock' | 'metabolicTracker' | 'neuroRecovery'
    | 'socialManager' | 'medicalProfiling'
    // Member views
    | 'dailyProtocol' | 'attendance' | 'workout' | 'futureOFS' | 'neuralRep' | 'performanceLab'
    | 'health' | 'medicalHub' | 'biomarkerVault' | 'aetherCommunity' | 'wearables' | 'helpSupport'
    | 'payments' | 'globalHealthPassport' | 'scheduler' | 'nutritionAdvisor' | 'profile' | 'universalGadgets' | 'digitalBioPass' | 'metabolicSimulator'
    ;

export type Theme = 'dark' | 'light';

export interface Package {
    id: number;
    name: string;
    category: string;
    price: number;
    duration: string;
    features: string[];
    details?: string;
}

export interface EmergencyContact {
    name: string;
    phone: string;
    relation: string;
}

export interface MedicalHistory {
    conditions: string[];
    pastInjuries: string;
    medications: string;
    bloodGroup?: string;
    lifestyle: any;
}

export interface PhysicalMetrics {
    height: number;
    weight: number;
    body_fat: number;
    muscle_mass: number;
    target_weight: number;
    target_body_fat?: number; // Added
    body_type: 'Ectomorph' | 'Mesomorph' | 'Endomorph';
    activity_level: string;
    // Detailed Measurements (Inches/CM)
    chest?: number;
    waist?: number;
    hips?: number;
    shoulders?: number;
    biceps?: number;
    forearms?: number;
    thighs?: number;
    calves?: number;
    neck?: number;
}

export interface AutomationSettings {
    remind_12hrs_before: boolean;
    auto_renewal: boolean;
    ai_coaching: boolean;
    sync_id: string;
}

export interface Assessment {
    fitness_level: string;
    pushup_count: number;
    plank_time: string;
    squat_count: number;
    comments: string;
}

export interface StructuredDietPlan {
    id?: number;
    planId?: string;
    level?: string;
    goal: string;
    caloriesTarget: number;
    macrosTarget: { protein: number; carbs: number; fats: number };
    meals: { name: string; time: string; items: { food: string; portion: string }[]; totalCalories: number, macros: { protein: number; carbs: number; fats: number } }[];
    scienceNote?: string;
    scientificNote?: string;
    aiGenerated?: boolean;
}

export interface AttendanceRecord {
    id: string;
    memberId: number;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM AM/PM
    status: 'Present' | 'Absent' | 'Late';
    method: 'Manual' | 'QR' | 'Auto';
}

export interface Member {
    id: number;
    name: string;
    email: string;
    phone: string;
    aadhaar?: string;
    gender?: 'Male' | 'Female' | 'Other'; // Added
    dob?: string; // Added
    address?: string; // Added
    joinDate: string;
    packageId: number;
    trainingPackageId?: number; // Added for Personal Training
    status: 'Active' | 'Pending' | 'Expired' | 'Inactive';
    avatar: string;
    password?: string; // Added for authentication
    whatsappConsent: boolean;
    xp: number;
    level: number;
    achievements: string[];
    hrv: number;
    lbm: number;
    health_score: number;
    bio_age: number;
    assigned_tests: string[];
    medical_history: MedicalHistory;
    physical_metrics: PhysicalMetrics;
    automation_settings: AutomationSettings;
    rpeHistory: any[];
    anatomicalStatus: any;
    emergency_contact: EmergencyContact;
    initial_assessment: Assessment;
    approvedDietPlan?: StructuredDietPlan;
    approvedAiPlan?: string;
    coaching_notes?: { id: string; text: string; timestamp: string; isVoice: boolean }[];
    biologicalAge?: number;
    activeSynthesisProtocol?: string;
}

export interface InvoiceItem {
    description: string;
    amount: number;
    type?: 'Membership' | 'Training' | 'Supplement' | 'Accessory' | 'Product' | 'Fee' | 'Adjustment' | 'Medicine';
}

export interface Invoice {
    id: number;
    memberId: number;
    memberName: string;
    packageId: number;
    packageName: string;
    amount: number;
    date: string;
    status: 'Paid' | 'Pending' | 'Overdue' | 'Verification Pending' | 'Rejected';
    paymentMethod?: string; // Optional: to track what method they claimed to use
    items?: InvoiceItem[];
}

export interface Staff {
    id: number;
    name: string;
    role: string;
    phone: string;
    joinDate: string;
    salary: number;
}

export interface Expense {
    id: number;
    item: string;
    category: string;
    amount: number;
    date: string;
}

export type LeadSource = 'Facebook' | 'Instagram' | 'Website' | 'Walk-in' | 'Other';
export type LeadStage = 'New' | 'Contacted' | 'Trial' | 'Converted' | 'Lost';

export interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    source: LeadSource;
    status: LeadStage;
    inquiryDate: string;
    aiScore?: number;
}

export interface Transaction {
    id: string;
    memberName: string;
    amount: number;
    date: string;
    method: 'QR Code' | 'Cash' | 'Card' | 'Online' | 'NEFT/RTGS';
}

export interface HealthData {
    date: string;
    steps: number;
    heartRate: { avg: number; hrv: number; max: number; min: number; history: { time: string; value: number }[] };
    caloriesBurned: number;
    glucose: { current: number; trend: string; history: any[] };
    circadian: { phase: string; efficiency: number };
    sleep: { totalHours: number; deepHours: number; remHours: number };
    // Enhanced Metrics for Wearables
    metrics?: {
        strain: number;
        recovery: number;
        spO2: number;
        skinTemp: number;
        device: string;
    };
}

export interface WorkoutExercise {
    name: string;
    sets: string;
    reps: string;
    rest?: string;
    notes?: string;
    tempo?: string;
}

export interface WorkoutSection {
    name: string;
    exercises: WorkoutExercise[];
    duration?: string;
    intensity?: 'Low' | 'Medium' | 'High' | 'Extreme';
}

export interface WorkoutTemplate {
    id: number;
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance';
    category: string; // e.g., "Hypertrophy", "Strength", "Endurance"
    description: string;
    duration?: string; // e.g., "4 Weeks"
    frequency?: string; // e.g., "4 Days/Week"
    
    // Structured Sections
    preWorkout?: WorkoutSection;
    mainWorkout: WorkoutSection[]; // Array of sections (e.g., "Push Day", "Pull Day" or just "Main Routine")
    finisher?: WorkoutSection;
    
    sections?: any[];
    exercises?: any[];
    
    // Meta
    scientificNote?: string;
    aiGenerated?: boolean;
    pdfUrl?: string; // Placeholder for PDF generation
}

export interface DietMeal {
    name: string;
    time: string;
    items: { food: string; portion: string; calories: number; protein: number; carbs: number; fats: number }[];
    totalCalories: number;
    macros: { protein: number; carbs: number; fats: number };
    notes?: string;
}

export interface DietPlan {
    id: number;
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro Advance';
    goal: string; // e.g., "Fat Loss", "Muscle Gain"
    calories: number;
    macros: { protein: number; carbs: number; fats: number };
    description: string;
    duration: string;
    meals: DietMeal[];
    scientificNote?: string;
    aiGenerated?: boolean;
    pdfUrl?: string;
}

export interface WorkoutLog {
    date: string;
    exercise: string;
    sets: number;
    reps: number;
    weight: number;
}

export interface BodyMetric {
    date: string;
    weight: number;
    bodyFat: number;
}

export interface MemberFitnessData {
    [memberId: number]: {
        metrics: BodyMetric[];
        logs: WorkoutLog[];
    };
}

export interface ActivityEvent {
    id: number;
    type: 'check-in' | 'new-member' | 'payment' | 'ai-suggestion';
    message: string;
    timestamp: Date;
    memberId?: number;
    action?: { label: string; view: View };
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    priority: 'Low' | 'Medium' | 'High';
    dueDate: string;
    completed: boolean;
    dependencies?: number[]; // IDs of prerequisite tasks
    order?: number;
}

export interface MedicalTestMaster {
    test_id: string;
    test_name: string;
    category: string;
    description: string;
}

export interface SecurityLog {
    id: string;
    timestamp: string;
    action: string;
    details: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    member_id: number;
    action: string;
    details: string;
}

export interface DetailedSetLog {
    setNumber: number;
    weight: number;
    reps: number;
    rpe: number;
    completed: boolean;
}

export interface DetailedWorkoutSession {
    sessionId: string;
    memberId: number;
    date: string;
    exerciseName: string;
    sets: DetailedSetLog[];
    notes?: string; // Added user notes
}

export interface OFSLog {
    id: string;
    memberId: number;
    memberName: string;
    exercise: string;
    formScore: number;
    date: string;
}

export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    variables: string[];
    category: string;
}

export interface Campaign {
    id: string;
    name: string;
    status: 'Scheduled' | 'Running' | 'Completed';
    scheduledDate: string;
    scheduledTime: string;
    templateId?: string;
    audience: string;
}

export interface MessageLog {
    id: string;
    recipientName: string;
    recipientPhone: string;
    templateName: string;
    sentAt: string;
    status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
}

export interface InventoryItem {
    id: string;
    name: string;
    category: 'Supplement' | 'Accessory' | 'Apparel' | 'Food Supplement' | 'Medicine';
    stock: number;
    threshold: number;
    maxCapacity: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    price: number; 
}

export interface GymMachine {
    id: string;
    name: string;
    status: 'Operational' | 'Maintenance' | 'Offline';
    health: number;
    nextService: string;
}

export interface MedicalConsultation {
    id: string;
    memberId: number;
    memberName: string;
    symptoms: string;
    duration: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    historyContext: string; 
    aiDiagnosis: string | null; 
    aiPrescription: string | null; 
    status: 'Pending Analysis' | 'In Review' | 'Approved' | 'Rejected';
    timestamp: string;
    adminNotes?: string;
}

// Social Media Types (Moved to Global Types for Harmony)
export type SocialPlatform = 'Facebook' | 'Instagram' | 'YouTube' | 'WhatsApp' | 'Hive';

export interface SocialPost {
    id: string;
    platform: SocialPlatform[];
    content: string;
    imageUrl?: string;
    status: 'Scheduled' | 'Posted' | 'Failed';
    scheduledTime?: string;
    likes?: number;
    comments?: number;
    author?: string;
    avatar?: string;
    type?: string;
    time?: string;
}

export interface SocialReview {
    id: string;
    platform: SocialPlatform;
    author: string;
    rating?: number; // 1-5 for FB/Google
    content: string;
    sentiment: 'Positive' | 'Negative' | 'Neutral';
    aiReply?: string;
    isReplied: boolean;
    timestamp: string;
}