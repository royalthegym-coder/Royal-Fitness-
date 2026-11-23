import {
  Member,
  Package,
  Invoice,
  Transaction,
  Staff,
  Expense,
  Lead,
  AttendanceRecord,
  GymOffer,
  GymReview,
  WorkoutTemplate,
  DietPlan,
} from '../../types';

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

/**
 * The old express /api/gym/* backend is gone. Composite operations (admission, renewal,
 * lead conversion, check-in) now run against Firestore inside DataProvider, which registers
 * them here so existing screens can keep calling `gymApi.*` unchanged.
 * Simple CRUD calls are no-ops: DataProvider already wrote the document to Firestore.
 */
export interface GymOps {
  snapshot: () => Record<string, any[]>;
  checkIn: (p: { member_id: number; zone?: any; method?: any }) => Promise<ApiResult>;
  renewMember: (id: number, p: Record<string, any>) => Promise<ApiResult>;
  processAdmission: (p: Record<string, any>) => Promise<ApiResult>;
  convertLead: (id: number, p: Record<string, any>) => Promise<ApiResult>;
}

let opsGetter: (() => GymOps | null) | null = null;
export function registerGymOps(getter: (() => GymOps | null) | null): void {
  opsGetter = getter;
}
function ops(): GymOps | null {
  return opsGetter ? opsGetter() : null;
}
const NOT_READY: ApiResult = { ok: false, status: 0, error: 'Data layer not ready. Please sign in again.' };
const done = async (): Promise<ApiResult> => ({ ok: true, status: 200, data: { success: true } });

/** @deprecated kept for compatibility; the Worker api client reads the Firebase ID token itself. */
export function setApiAuthToken(_token: string | null): void {}
export function getApiAuthToken(): string | null {
  return null;
}

// ============================================================================
// TYPED MAPPERS: BACKEND RELATIONAL DB (snake_case) <-> FRONTEND UI (camelCase)
// ============================================================================

export function mapDbMemberToUi(row: any): Member {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    email: String(row.email || ''),
    phone: String(row.phone || ''),
    gender: row.gender || 'Male',
    dob: row.dob || '',
    address: row.address || '',
    joinDate: row.join_date || new Date().toISOString().split('T')[0],
    expiryDate: row.expiry_date || '',
    packageId: Number(row.package_id || 1),
    assignedTrainerId: row.assigned_trainer_id ?? undefined,
    status: row.status || 'Active',
    archived: Boolean(row.archived),
    avatar: row.avatar || '',
    loginId: row.member_code || `FF-${1000 + Number(row.id)}`,
    gymId: row.gym_id,
    whatsappConsent: row.whatsapp_consent !== false,
    fitnessGoal: row.fitness_goal || 'Fitness',
    approvedAiPlan: row.approved_workout_plan || undefined,
    xp: 120,
    level: 2,
    achievements: [],
    hrv: 70,
    lbm: 54,
    health_score: 78,
    bio_age: 26,
    assigned_tests: [],
    medical_history: {
      conditions: [],
      pastInjuries: row.medical_notes || '',
      medications: '',
      lifestyle: {},
    },
    physical_metrics: {
      height: Number(row.height_cm || 170),
      weight: Number(row.weight_kg || 70),
      body_fat: 18,
      muscle_mass: 33,
      target_weight: Math.max(45, Number(row.weight_kg || 70) - 3),
      body_type: 'Mesomorph',
      activity_level: 'Moderate',
    },
    automation_settings: {
      remind_12hrs_before: true,
      auto_renewal: false,
      ai_coaching: true,
      sync_id: `SYNC-${row.id}`,
    },
    rpeHistory: [],
    anatomicalStatus: {},
    emergency_contact: row.emergency_contact || { name: '', phone: '', relation: '' },
    initial_assessment: {
      fitness_level: row.training_experience || 'Beginner',
      pushup_count: 15,
      plank_time: '45s',
      squat_count: 20,
      comments: row.medical_notes || '',
    },
    updated_at: row.updated_at,
  };
}

export function mapDbPackageToUi(row: any): Package {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    category: row.category || 'General',
    price: Number(row.price || 0),
    duration: row.duration_label || `${row.duration_months || 1} Month`,
    billingMonths: Number(row.duration_months || 1),
    monthlyBaseRate: Number(row.monthly_base_rate || 0),
    registrationFee: Number(row.registration_fee || 0),
    discountPercent: Number(row.discount_percent || 0),
    fixedDiscount: Number(row.fixed_discount || 0),
    features: Array.isArray(row.features) ? row.features : [],
    details: row.details || '',
    isPopular: Boolean(row.is_popular),
  };
}

export function mapDbInvoiceToUi(row: any): Invoice {
  return {
    id: Number(row.id),
    invoiceNumber: row.invoice_number || `INV-${row.id}`,
    memberId: Number(row.member_id),
    memberName: String(row.member_name || ''),
    packageId: Number(row.package_id || 1),
    packageName: String(row.package_name || 'Membership'),
    subtotal: Number(row.subtotal ?? row.total_amount ?? 0),
    couponCode: row.coupon_code || null,
    discountAmount: Number(row.discount_amount || 0),
    amount: Number(row.total_amount ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    balanceAmount: Number(row.balance_amount ?? 0),
    refundedAmount: Number(row.refunded_amount ?? 0),
    date: row.date || new Date().toISOString().split('T')[0],
    status: row.status || 'Pending',
    paymentMethod: row.payment_method || 'UPI',
  };
}

export function mapDbPaymentToUiTransaction(row: any): Transaction {
  const m = String(row.method || 'UPI');
  const method: Transaction['method'] =
    m === 'Cash' ? 'Cash' : m === 'Card' ? 'Card' : m === 'Bank Transfer' ? 'NEFT/RTGS' : 'QR Code';
  return {
    id: String(row.id),
    memberName: String(row.member_name || ''),
    amount: Number(row.amount || 0),
    date: row.paid_at || new Date().toISOString().split('T')[0],
    method,
  };
}

export function mapDbAttendanceToUi(row: any): AttendanceRecord {
  return {
    id: String(row.id),
    memberId: Number(row.member_id),
    memberName: String(row.member_name || ''),
    date: row.date || new Date().toISOString().split('T')[0],
    time: row.check_in_time || '',
    checkInTime: row.check_in_time || '',
    checkOutTime: row.check_out_time ?? null,
    durationMinutes: row.duration_minutes,
    zone: row.zone || 'Main Floor',
    status: row.status || 'Checked In',
    method: row.method || 'QR',
    accessGranted: row.access_granted !== false,
    denialReason: row.denial_reason ?? null,
  };
}

export function mapDbStaffToUi(row: any): Staff {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    role: row.role || 'Trainer',
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    salary: Number(row.salary || 0),
    shift: row.shift || '06:00 AM - 02:00 PM',
    specialization: row.specialization || 'General Fitness',
    status: row.status || 'Active',
    rating: Number(row.rating || 4.8),
    activeClients: Number(row.active_clients || 0),
    attendanceToday: row.attendance_today || 'Present',
    payrollStatus: row.payroll_status || 'Paid',
    joinDate: row.join_date || new Date().toISOString().split('T')[0],
  };
}

export function mapDbExpenseToUi(row: any): Expense {
  return {
    id: Number(row.id),
    item: String(row.item || ''),
    category: row.category || 'Utilities',
    vendor: row.vendor || 'Direct Vendor',
    amount: Number(row.amount || 0),
    date: row.date || new Date().toISOString().split('T')[0],
    paymentMethod: row.payment_method || 'UPI',
    paymentStatus: row.payment_status || 'Paid',
    receiptUrl: row.receipt_url || undefined,
    notes: row.notes || undefined,
  };
}

export function mapDbLeadToUi(row: any): Lead {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    source: row.source || 'Walk-in',
    status: row.status || 'New',
    inquiryDate: (row.created_at || new Date().toISOString()).split('T')[0],
    followUpDate: row.follow_up_date || new Date().toISOString().split('T')[0],
    goal: row.goal || 'Fitness',
    notes: row.notes || '',
    aiScore: 82,
  };
}

export function mapDbOfferToUi(row: any): GymOffer {
  return {
    id: String(row.id),
    title: String(row.title || ''),
    code: String(row.code || ''),
    campaignType: row.campaign_type || 'Coupon',
    discountType: row.discount_type || 'percentage',
    discountValue: Number(row.discount_value || 10),
    applicablePlan: row.applicable_plan || 'All Membership Plans',
    validFrom: row.valid_from || '',
    validUntil: row.valid_until || '',
    usageLimit: Number(row.usage_limit || 100),
    redemptions: Number(row.redemptions || 0),
    status: row.status || 'Active',
    description: row.description || '',
  };
}

export function mapDbReviewToUi(row: any): GymReview {
  return {
    id: String(row.id),
    memberName: String(row.member_name || ''),
    rating: (Number(row.rating) || 5) as 1 | 2 | 3 | 4 | 5,
    category: row.category || 'Facility',
    comment: String(row.comment || ''),
    reply: row.reply || undefined,
    repliedAt: row.replied_at || undefined,
    status: row.status || 'Pending',
    date: row.date || new Date().toISOString().split('T')[0],
  };
}

export function mapDbWorkoutToUi(row: any): WorkoutTemplate {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    category: row.category || 'Fitness',
    level: row.level || 'Beginner',
    duration: row.duration || '45 mins',
    frequency: row.frequency || '4 Days / Week',
    description: row.description || '',
    scientificNote: row.scientific_note || '',
    aiGenerated: Boolean(row.ai_generated),
    mainWorkout: Array.isArray(row.main_workout) ? row.main_workout : [],
  };
}

export function mapDbDietToUi(row: any): DietPlan {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    duration: row.duration || '30 Days',
    level: row.level || 'Beginner',
    goal: row.goal || 'Weight Loss',
    dietType: row.diet_type || 'Vegetarian',
    calories: Number(row.calories || 1800),
    macros: row.macros || { protein: 110, carbs: 180, fats: 55 },
    allergies: row.allergies || 'None',
    approvedBy: row.approved_by || undefined,
    approvedAt: row.approved_at || undefined,
    disclaimer:
      row.disclaimer ||
      'Nutritional estimates only — not a substitute for professional medical or clinical dietary advice.',
    meals: Array.isArray(row.meals) ? row.meals : [],
    description: row.description || '',
    aiGenerated: Boolean(row.ai_generated),
  };
}

export function mapDbWhatsAppLogToUi(row: any) {
  return {
    id: String(row.id),
    recipientName: String(row.recipient_name || ''),
    recipientPhone: String(row.recipient_phone || ''),
    templateName: String(row.template_name || ''),
    messagePreview: String(row.message_preview || ''),
    status: String(row.status || ''),
    errorMessage: row.error_message ?? null,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ============================================================================
// REST API CLIENT METHODS (ALL 16 MODULES + AUTH)
// ============================================================================

export const gymApi = {
  login: async (_email: string, _password: string): Promise<ApiResult> => ({ ok: false, status: 410, error: 'Use Firebase sign-in.' }),
  me: done,
  logout: done,
  bootstrap: async (_gymId?: string): Promise<ApiResult> => {
    const o = ops();
    return o ? { ok: true, status: 200, data: { success: true, data: o.snapshot() } } : NOT_READY;
  },
  dashboardSummary: async (_gymId?: string): Promise<ApiResult> => done(),
  createMember: (_p: Record<string, any>) => done(),
  updateMember: (_id: number, _p: Record<string, any>) => done(),
  archiveMember: (_id: number, _archived: boolean) => done(),
  deleteMember: (_id: number) => done(),
  renewMember: async (id: number, payload: Record<string, any>) => (ops() ? ops()!.renewMember(id, payload) : NOT_READY),
  processAdmission: async (payload: Record<string, any>) => (ops() ? ops()!.processAdmission(payload) : NOT_READY),
  createPackage: (_p: Record<string, any>) => done(),
  updatePackage: (_id: number, _p: Record<string, any>) => done(),
  deletePackage: (_id: number) => done(),
  createInvoice: (_p: Record<string, any>) => done(),
  recordPayment: (_p: Record<string, any>) => done(),
  refundInvoice: (_id: number, _reason: string) => done(),
  deleteInvoice: (_id: number) => done(),
  checkIn: async (payload: Record<string, any>) => (ops() ? ops()!.checkIn(payload as any) : NOT_READY),
  checkOut: (_recordId: string) => done(),
  deleteAttendance: (_recordId: string) => done(),
  createStaff: (_p: Record<string, any>) => done(),
  updateStaff: (_id: number, _p: Record<string, any>) => done(),
  deleteStaff: (_id: number) => done(),
  createWorkoutPlan: (_p: Record<string, any>) => done(),
  updateWorkoutPlan: (_id: number, _p: Record<string, any>) => done(),
  deleteWorkoutPlan: (_id: number) => done(),
  createDietPlan: (_p: Record<string, any>) => done(),
  updateDietPlan: (_id: number, _p: Record<string, any>) => done(),
  deleteDietPlan: (_id: number) => done(),
  createExpense: (_p: Record<string, any>) => done(),
  updateExpense: (_id: number, _p: Record<string, any>) => done(),
  deleteExpense: (_id: number) => done(),
  createLead: (_p: Record<string, any>) => done(),
  updateLead: (_id: number, _p: Record<string, any>) => done(),
  deleteLead: (_id: number) => done(),
  convertLead: async (id: number, payload: Record<string, any> = {}) => (ops() ? ops()!.convertLead(id, payload) : NOT_READY),
  createOffer: (_p: Record<string, any>) => done(),
  updateOffer: (_id: string, _p: Record<string, any>) => done(),
  deleteOffer: (_id: string) => done(),
  validateOffer: async (_code: string, _baseAmount: number, _planName?: string): Promise<ApiResult> => ({ ok: false, status: 410, error: 'Use DataProvider.validateOfferCoupon' }),
  createReview: (_p: Record<string, any>) => done(),
  updateReview: (_id: string, _p: Record<string, any>) => done(),
  deleteReview: (_id: string) => done(),
  saveGym: (_p: Record<string, any>) => done(),
  updateGymSocialLinks: (_gymId: string, _p: Record<string, any>) => done(),
  deleteGym: (_gymId: string) => done(),
};
