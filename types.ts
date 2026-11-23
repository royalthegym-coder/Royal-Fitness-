
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
    report_id: string;
    member_id: number;
    file_url: string;
    ocr_data: any;
    status: 'Analyzed' | 'Pending';
    upload_date: string;
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
    reply?: any;
}

export interface GoogleBusinessPost {
    id: string;
    content: string;
    timestamp: string;
    state?: string;
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

export type View = string;

export type Theme = 'dark' | 'light';

export interface Package {
    id: number;
    name: string;
    category: string;
    price: number;
    duration: string;
    features: string[];
    details?: string;
    image?: string;
    billingMonths?: number;
    monthlyBaseRate?: number;
    registrationFee?: number;
    discountPercent?: number;
    fixedDiscount?: number;
    isPopular?: boolean;
    isActive?: boolean;
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
    injuries?: string[];
    blood_pressure?: string;
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
    memberName?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM AM/PM (check-in display)
    checkInTime?: string; // ISO or HH:MM AM/PM
    checkOutTime?: string | null;
    durationMinutes?: number;
    zone?: 'Main Floor' | 'Strength' | 'Cardio' | 'CrossFit';
    status: 'Present' | 'Absent' | 'Late' | 'Checked In' | 'Checked Out' | 'Denied';
    method: 'Manual' | 'QR' | 'Auto' | 'Geometric' | 'Biometric';
    accessGranted?: boolean;
    denialReason?: string | null;
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
    expiryDate?: string;
    packageId: number;
    ptPackageId?: number;
    assignedTrainerId?: number | null;
    assignedTrainerUid?: string | null; // Firebase Auth uid of the trainer (tenant-scoped)
    assignedWorkoutId?: number | null;
    assignedDietId?: number | null;
    trainerNotes?: string;
    status: 'Active' | 'Pending' | 'Expired' | 'Inactive';
    archived?: boolean;
    digitalConsent?: boolean;
    trainingExperience?: 'Beginner' | 'Intermediate' | 'Advanced';
    avatar: string;
    gymId?: string;
    gymName?: string;
    gymOwnerEmail?: string;
    loginId?: string;
    /** @deprecated Never stored. Members authenticate with Firebase Auth. Stripped before every write. */
    password?: string;
    auth_mode?: 'password' | 'biometric_only'; // Added for Military-Grade Security
    device_id?: string; // Hardware Fingerprint
    biometric_public_key?: string; // WebAuthn Public Key
    whatsappConsent: boolean;
    hipaaConsent?: boolean; // Added for Medical Compliance
    gdprConsent?: boolean; // Added for Medical Compliance
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
    biometricCredentials?: any[]; // For WebAuthn credentials
    fitnessGoal?: string;
    fitness_goals?: { id: string; type: 'weight' | 'exercise_target' | 'workout_frequency'; label: string; targetValue: number; currentValue: number; deadline: string; completed: boolean }[];
    trainingStyle?: string;
    onboardingCompleted?: boolean;
    magicToken?: string;
    aiStrategy?: string;
    updated_at?: string; // For conflict resolution
    walletBalance?: number; // Future Pay Wallet Balance
    liveHealthData?: {
        steps: number;
        heartRate: number;
        sleepHours: number;
        lastUpdated: string;
        history: { date: string; steps: number; heartRate: number; sleepHours: number }[];
    };
    // Biometric Data
    height?: number;
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
    pastWorkoutPerformance?: string;
    workoutModifications?: string;
    lastAttendanceDate?: string;
    inactivityDays?: number;
}

export interface InvoiceItem {
    description: string;
    amount: number;
    type?: 'Membership' | 'Training' | 'Supplement' | 'Accessory' | 'Product' | 'Fee' | 'Adjustment' | 'Medicine';
}

export interface Invoice {
    id: number;
    invoiceNumber?: string;
    memberId: number;
    memberName: string;
    packageId: number;
    packageName: string;
    subtotal?: number;
    registrationFee?: number;
    couponCode?: string | null;
    discountAmount?: number;
    amount: number;
    paidAmount?: number;
    balanceAmount?: number;
    refundedAmount?: number;
    date: string;
    status: 'Paid' | 'Partial' | 'Pending' | 'Overdue' | 'Verification Pending' | 'Rejected' | 'Refunded' | 'Cancelled';
    paymentMethod?: string; // Optional: to track what method they claimed to use
    items?: InvoiceItem[];
}

export interface Staff {
    id: number;
    name: string;
    role: string;
    phone: string;
    email?: string;
    joinDate: string;
    salary: number;
    photo?: string;
    shift?: string;
    specialization?: string;
    status?: 'Active' | 'On Leave' | 'Inactive';
    rating?: number;
    activeClients?: number;
    attendanceToday?: 'Present' | 'Absent' | 'On Leave';
    payrollStatus?: 'Paid' | 'Pending';
}

export interface Expense {
    id: number;
    item: string;
    category: string;
    amount: number;
    date: string;
    paymentMethod?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    paymentStatus?: 'Paid' | 'Pending';
    vendor?: string;
    receiptUrl?: string;
    notes?: string;
}

export type LeadSource = 'Facebook' | 'Instagram' | 'Website' | 'Walk-in' | 'WhatsApp' | 'Referral' | 'Other';
export type LeadStage = 'New' | 'Contacted' | 'Trial' | 'Converted' | 'Lost';

export interface Lead {
    id: number;
    name: string;
    email: string;
    phone: string;
    source: LeadSource;
    status: LeadStage;
    inquiryDate: string;
    followUpDate?: string;
    goal?: string;
    notes?: string;
    aiScore?: number;
}

export interface GymOffer {
    id: string;
    title: string;
    code: string;
    campaignType?: 'Coupon' | 'Festival' | 'Referral' | 'Limited Period';
    discountType: 'percentage' | 'flat';
    discountValue: number;
    applicablePlan: string;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    status: 'Active' | 'Scheduled' | 'Expired';
    description: string;
    redemptions: number;
    aiGenerated?: boolean;
}

export interface GymReview {
    id: string;
    memberName: string;
    memberId?: number;
    rating: 1 | 2 | 3 | 4 | 5;
    category: 'Facility' | 'Trainers' | 'Equipment' | 'Cleanliness' | 'Value';
    comment: string;
    date: string;
    reply?: string;
    repliedAt?: string;
    status: 'Pending' | 'Replied';
    publishedToGoogle?: boolean;
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
    rpe?: string;
    technique?: string;
    videoUrl?: string;
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
    priority?: 'Low' | 'Medium' | 'High';
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
    dietType?: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Vegan';
    calories: number;
    macros: { protein: number; carbs: number; fats: number };
    allergies?: string;
    approvedBy?: string | null;
    approvedAt?: string | null;
    disclaimer?: string;
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
    isRecurring?: boolean;
    recurrencePattern?: 'daily' | 'weekly' | 'monthly';
    lastGeneratedDate?: string;
    progress?: number;
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

export interface SleepLog {
    id: string;
    memberId: number;
    date: string;
    totalHours: number;
    deepHours: number;
    remHours: number;
    efficiency?: number;
    quality?: string;
    notes?: string;
}

// --- E-Commerce & Finance Interfaces ---

export interface StoreProduct {
    id: string;
    name: string;
    category: 'Supplement' | 'Gear' | 'Beverage' | 'Other';
    price: number;
    stock: number;
    image: string;
    description: string;
    initialStock?: number;
    reorder_threshold?: number;
    soldStock?: number;
    failedStock?: number;
    failedDetails?: { qty: number; reason: string; date: string }[];
}

export interface StoreOrder {
    id: string;
    memberId: number;
    items: { productId: string; name: string; price: number; qty: number }[];
    total: number;
    status: 'Pending' | 'Completed' | 'Cancelled';
    date: string;
    paymentMethod: 'Future Pay' | 'UPI' | 'Cash' | 'Card';
}

export interface WalletTransaction {
    id: string;
    memberId: number;
    amount: number;
    type: 'credit' | 'debit';
    description: string;
    date: string;
}

export interface EMIPlan {
    id: string;
    memberId: number;
    packageId?: number;
    totalAmount: number;
    remainingAmount: number;
    installments: {
        amount: number;
        dueDate: string;
        status: 'pending' | 'paid';
        paidDate?: string;
    }[];
    status: 'Active' | 'Completed' | 'Defaulted';
    createdAt: string;
}

export interface CartItem {
    id?: string;
    productId?: string;
    itemId?: string;
    name: string;
    price: number;
    qty: number;
    type?: string;
}

export interface AdminProfile {
    uid: string;
    email: string;
    role: string;
    name: string;
    lastLogin: string;
    gymName?: string;
    ownerName?: string;
    phone?: string;
    subscriptionLevel?: string;
    onboarded?: boolean;
}

export interface OSSubscription {
  tier: 'Basic' | 'Premium' | 'Elite' | 'None';
  billingCycle: 'Monthly' | 'Yearly';
  price: number;
  expiryDate: string;
}

export interface CommunityPost {
    id: string;
    memberId: number;
    memberName: string;
    memberAvatar?: string;
    content: string;
    imageUrl?: string;
    likes: number;
    comments: { memberName: string; text: string }[];
    timestamp: string;
}

export interface StoreTransaction {
    id: string;
    product_id: string;
    member_id: number;
    quantity: number;
    timestamp: string;
    total_price: number;
}

export interface PersonalTrainer {
    id: string;
    name: string;
    specialty: string[];
    experienceYears: number;
    rating: number;
    sessionPrice: number;
    avatar: string;
    bio: string;
    phone?: string;
    availableSlots: string[];
}

export interface PTSessionBooking {
    id: string;
    trainerId: string;
    trainerName: string;
    memberId: number;
    memberName: string;
    date: string;
    slot: string;
    goalFocus: string;
    status: 'Confirmed' | 'Completed' | 'Cancelled';
    paymentStatus: 'Paid' | 'Pending';
    amount: number;
    txnId: string;
    notes?: string;
}

export interface MetricLog {
    id: string;
    memberId: number;
    date: string;
    weight: number;
    bodyFat?: number;
    muscleMass?: number;
    hydration?: number;
    chest?: number;
    waist?: number;
    notes?: string;
}

export interface WorkoutExerciseLog {
    id: string;
    memberId: number;
    date: string;
    workoutType: 'strength' | 'cardio' | 'hiit';
    exerciseName: string;
    targetMuscle?: string;
    sets?: { setNum: number; weightKg: number; reps: number; rpe?: number }[];
    cardioMinutes?: number;
    cardioDistanceKm?: number;
    caloriesBurned?: number;
    notes?: string;
}

export interface InteractiveClass {
    id: string;
    title: string;
    type: 'Yoga' | 'Zumba' | 'HIIT' | 'CrossFit' | 'Spinning' | 'MMA';
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    time: string;
    durationMinutes: number;
    instructorName: string;
    instructorAvatar: string;
    location: string;
    totalCapacity: number;
    bookedSpots: number;
    intensity: 'Low' | 'Medium' | 'High' | 'Extreme';
    description: string;
}

export interface ClassBookingRecord {
    id: string;
    classId: string;
    memberId: number;
    memberName: string;
    bookedAt: string;
    classTitle: string;
    classType: string;
    day: string;
    time: string;
    location: string;
    instructorName: string;
}

// ============================================================================
// CANONICAL 12-MODULE SUPABASE POSTGRESQL SCHEMA TYPES
// ============================================================================

export type UserRole = 'member' | 'trainer' | 'owner' | 'receptionist';
export type GenderType = 'male' | 'female' | 'other';
export type SubStatus = 'active' | 'expired' | 'frozen' | 'cancelled';
export type LeadStatus = 'new' | 'trial_scheduled' | 'trial_done' | 'converted' | 'lost';

export interface ProfileRecord {
    id: string;
    full_name: string;
    phone: string;
    email?: string | null;
    role: UserRole;
    gender?: GenderType | null;
    dob?: string | null;
    avatar_url?: string | null;
    biometric_id?: string | null;
    biometric_access_enabled: boolean;
    assigned_trainer_id?: string | null;
    height_cm?: number | null;
    current_weight_kg?: number | null;
    target_weight_kg?: number | null;
    activity_level?: string | null;
    fitness_goal?: string | null;
    diet_preference?: string | null;
    allergies?: string[] | null;
    injury_flags?: string[] | null;
    streak_days: number;
    xp_points: number;
    churn_risk_score: number;
    whatsapp_opt_in: boolean;
    fcm_push_token?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface ExerciseMasterRecord {
    id: string;
    name: string;
    target_muscle: string;
    secondary_muscles?: string[] | null;
    equipment_type?: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | string | null;
    video_3d_url: string;
    contraindicated_injuries?: string[] | null;
    ai_vision_supported: boolean;
    mediapipe_config?: Record<string, any> | null;
    created_at?: string;
}

export interface MembershipPlanRecord {
    id: string;
    name: string;
    duration_days: number;
    base_price_inr: number;
    gst_percent: number;
    max_freeze_days: number;
    includes_ai_coach: boolean;
    is_active: boolean;
    created_at?: string;
}

export interface SubscriptionRecord {
    id: string;
    member_id: string;
    plan_id?: string | null;
    start_date: string;
    end_date: string;
    freeze_days_used: number;
    status: SubStatus;
    auto_renew_enabled: boolean;
    upi_mandate_id?: string | null;
    created_at?: string;
}

export interface PaymentTransactionRecord {
    id: string;
    member_id?: string | null;
    subscription_id?: string | null;
    invoice_number: string;
    subtotal_inr: number;
    cgst_inr: number;
    sgst_inr: number;
    discount_inr: number;
    total_paid_inr: number;
    payment_mode: 'upi_qr' | 'razorpay' | 'cash' | 'card' | string;
    gateway_order_id?: string | null;
    gateway_payment_id?: string | null;
    payment_status: string;
    invoice_pdf_url?: string | null;
    paid_at?: string;
}

export interface PTContractRecord {
    id: string;
    member_id: string;
    trainer_id?: string | null;
    total_sessions: number;
    completed_sessions: number;
    price_paid_inr: number;
    trainer_commission_pct: number;
    valid_until: string;
    status: SubStatus;
    created_at?: string;
}

export interface PTSessionLogRecord {
    id: string;
    contract_id: string;
    member_id?: string | null;
    trainer_id?: string | null;
    session_date?: string;
    member_verification_otp?: string | null;
    is_verified_by_member: boolean;
    trainer_notes?: string | null;
}

export interface AttendanceLogRecord {
    id: string;
    member_id: string;
    check_in_time?: string;
    check_out_time?: string | null;
    entry_method: 'biometric' | 'dynamic_qr' | 'face_id' | 'manual' | string;
    hardware_device_id?: string | null;
    access_granted: boolean;
    denial_reason?: string | null;
}

export interface AIWorkoutPlanRecord {
    id: string;
    member_id: string;
    week_start_date: string;
    ai_model_used: string;
    generation_prompt_hash?: string | null;
    weekly_schedule: Record<string, any> | any[];
    trainer_reviewed: boolean;
    is_current: boolean;
    created_at?: string;
}

export interface WorkoutSessionLogRecord {
    id: string;
    member_id: string;
    exercise_id?: string | null;
    workout_date?: string;
    set_number: number;
    weight_kg: number;
    reps_completed: number;
    rpe_score?: number | null;
    ai_posture_score?: number | null;
    form_faults_detected?: string[] | null;
    duration_seconds?: number | null;
    synced_from_offline: boolean;
    created_at?: string;
}

export interface AINutritionPlanRecord {
    id: string;
    member_id: string;
    daily_calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    water_liters: number;
    meal_plan_json: Record<string, any> | any[];
    is_current: boolean;
    created_at?: string;
}

export interface DailyMealLogRecord {
    id: string;
    member_id: string;
    meal_type: 'breakfast' | 'lunch' | 'pre_workout' | 'post_workout' | 'dinner' | string;
    detected_items: Record<string, any> | any[];
    total_calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    meal_photo_url?: string | null;
    logged_at?: string;
}

export interface BodyMetricsLogRecord {
    id: string;
    member_id: string;
    recorded_date?: string;
    weight_kg: number;
    body_fat_pct?: number | null;
    muscle_mass_kg?: number | null;
    visceral_fat?: number | null;
    bmr_kcal?: number | null;
    body_water_pct?: number | null;
    chest_cm?: number | null;
    waist_cm?: number | null;
    bicep_cm?: number | null;
    front_photo_url?: string | null;
    side_photo_url?: string | null;
    back_photo_url?: string | null;
}

export interface GymLeadRecord {
    id: string;
    full_name: string;
    phone: string;
    source: string;
    interested_goal?: string | null;
    trial_date?: string | null;
    status: LeadStatus;
    assigned_staff_id?: string | null;
    next_followup_at?: string | null;
    notes?: string | null;
    created_at?: string;
}

export interface AutomationLogRecord {
    id: string;
    target_phone: string;
    member_id?: string | null;
    workflow_type: string;
    whatsapp_template_name?: string | null;
    delivery_status: string;
    payload?: Record<string, any> | null;
    error_message?: string | null;
    created_at?: string;
}

export interface LiveGymCrowdView {
    active_members_inside: number;
    snapshot_at: string;
}

