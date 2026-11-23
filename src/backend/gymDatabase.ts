import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ============================================================================
// RELATIONAL DATABASE SCHEMA — 8 CORE TABLES + 9 NORMALIZED AUXILIARY TABLES
// ============================================================================

export interface GymRecord {
  gym_id: string;
  name: string;
  owner_name: string;
  email: string;
  mobile: string;
  upi_id: string;
  address: string;
  google_maps_url: string;
  logo_url: string;
  signature_url: string;
  registration_status: 'Verified' | 'Pending' | 'Active';
  whatsapp_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRecord {
  id: string;
  gym_id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'trainer' | 'receptionist' | 'dietitian';
  password_hash: string;
  password_salt: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface MemberRecord {
  id: number;
  gym_id: string;
  member_code: string;
  name: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: string;
  address?: string;
  avatar?: string;
  join_date: string;
  expiry_date: string;
  package_id: number;
  assigned_trainer_id?: number | null;
  status: 'Active' | 'Pending' | 'Expired' | 'Inactive';
  archived: boolean;
  fitness_goal: string;
  training_experience: 'Beginner' | 'Intermediate' | 'Advanced';
  height_cm: number;
  weight_kg: number;
  bmi: number;
  whatsapp_consent: boolean;
  digital_consent: boolean;
  emergency_contact: { name: string; phone: string; relation: string };
  medical_notes?: string;
  approved_workout_plan?: string;
  approved_diet_plan?: string;
  created_at: string;
  updated_at: string;
}

export interface MembershipPackageRecord {
  id: number;
  gym_id: string;
  name: string;
  category: string;
  duration_months: number;
  duration_label: string;
  monthly_base_rate: number;
  registration_fee: number;
  discount_percent: number;
  fixed_discount: number;
  price: number;
  features: string[];
  details?: string;
  is_popular?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MembershipRecord {
  id: string;
  gym_id: string;
  member_id: number;
  package_id: number;
  start_date: string;
  end_date: string;
  status: 'Active' | 'Pending' | 'Expired' | 'Cancelled';
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRecord {
  id: number;
  gym_id: string;
  invoice_number: string;
  member_id: number;
  member_name: string;
  membership_id?: string | null;
  package_id: number;
  package_name: string;
  subtotal: number;
  registration_fee: number;
  coupon_code?: string | null;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  refunded_amount: number;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue' | 'Refunded' | 'Cancelled';
  payment_method: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  date: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  gym_id: string;
  invoice_id: number;
  member_id: number;
  member_name: string;
  amount: number;
  method: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  status: 'Completed' | 'Refunded';
  idempotency_key: string;
  reference_no?: string;
  notes?: string;
  paid_at: string;
  created_at: string;
}

export interface AttendanceDbRecord {
  id: string;
  gym_id: string;
  member_id: number;
  member_name: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes?: number;
  zone: 'Main Floor' | 'Strength' | 'Cardio' | 'CrossFit';
  method: 'QR' | 'Geometric' | 'Manual' | 'Biometric';
  access_granted: boolean;
  denial_reason?: string | null;
  status: 'Checked In' | 'Checked Out' | 'Denied';
  created_at: string;
}

export interface ExpenseRecord {
  id: number;
  gym_id: string;
  item: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  payment_method: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
  payment_status: 'Paid' | 'Pending';
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadRecord {
  id: number;
  gym_id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  interested_package_id?: number | null;
  goal: string;
  follow_up_date: string;
  status: 'New' | 'Contacted' | 'Trial' | 'Converted' | 'Lost';
  notes: string;
  converted_member_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface StaffRecord {
  id: number;
  gym_id: string;
  name: string;
  role: 'Trainer' | 'Manager' | 'Dietitian' | 'Receptionist' | 'Administrator';
  phone: string;
  email: string;
  salary: number;
  shift: string;
  specialization: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  rating: number;
  active_clients: number;
  attendance_today: 'Present' | 'Absent' | 'On Leave';
  payroll_status: 'Paid' | 'Pending';
  join_date: string;
  created_at: string;
  updated_at: string;
}

export interface OfferRecord {
  id: string;
  gym_id: string;
  title: string;
  code: string;
  campaign_type: 'Coupon' | 'Festival' | 'Referral' | 'Limited Period';
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  applicable_plan: string;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  redemptions: number;
  status: 'Active' | 'Scheduled' | 'Expired';
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewRecord {
  id: string;
  gym_id: string;
  member_id?: number | null;
  member_name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  category: 'Facility' | 'Trainers' | 'Equipment' | 'Cleanliness' | 'Value';
  comment: string;
  reply?: string;
  replied_at?: string;
  status: 'Pending' | 'Replied';
  published_to_google: boolean;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutPlanRecord {
  id: number;
  gym_id: string;
  name: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  frequency: string;
  assigned_trainer_id?: number | null;
  description: string;
  scientific_note?: string;
  ai_generated: boolean;
  main_workout: any[];
  created_at: string;
  updated_at: string;
}

export interface DietPlanRecord {
  id: number;
  gym_id: string;
  name: string;
  level: string;
  goal: string;
  diet_type: 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian' | 'Vegan';
  calories: number;
  macros: { protein: number; carbs: number; fats: number };
  allergies?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  disclaimer: string;
  meals: any[];
  description: string;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppLogRecord {
  id: string;
  gym_id: string;
  recipient_name: string;
  recipient_phone: string;
  template_name: string;
  message_preview: string;
  status: 'Sent' | 'Failed - API Not Connected' | 'Failed - No Consent' | 'Failed - Gateway Error';
  error_message?: string | null;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  gym_id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface GymDatabaseState {
  schema_version: number;
  seeded_at: string | null;
  // 8 Core Tables
  gyms: GymRecord[];
  users: UserRecord[];
  members: MemberRecord[];
  membership_packages: MembershipPackageRecord[];
  memberships: MembershipRecord[];
  payments: PaymentRecord[];
  attendance: AttendanceDbRecord[];
  expenses: ExpenseRecord[];
  // 9 Normalized Auxiliary Tables
  invoices: InvoiceRecord[];
  leads: LeadRecord[];
  staff: StaffRecord[];
  offers: OfferRecord[];
  reviews: ReviewRecord[];
  workout_plans: WorkoutPlanRecord[];
  diet_plans: DietPlanRecord[];
  whatsapp_logs: WhatsAppLogRecord[];
  audit_logs: AuditLogRecord[];
}

export const DEFAULT_GYM_ID = 'default_gym';

export function normalizeMobile(phone: string): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  const { hash } = hashPassword(password, storedSalt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function computeExpiryDate(startDate: string, durationMonths: number): string {
  const base = startDate ? new Date(`${startDate}T00:00:00Z`) : new Date();
  if (Number.isNaN(base.getTime())) {
    const fallback = new Date();
    fallback.setMonth(fallback.getMonth() + Math.max(1, durationMonths));
    return fallback.toISOString().split('T')[0];
  }
  base.setUTCMonth(base.getUTCMonth() + Math.max(1, durationMonths));
  return base.toISOString().split('T')[0];
}

export function sanitizeString(val: unknown, maxLen = 400): string {
  return String(val ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function createEmptyState(): GymDatabaseState {
  return {
    schema_version: 2,
    seeded_at: null,
    gyms: [],
    users: [],
    members: [],
    membership_packages: [],
    memberships: [],
    payments: [],
    attendance: [],
    expenses: [],
    invoices: [],
    leads: [],
    staff: [],
    offers: [],
    reviews: [],
    workout_plans: [],
    diet_plans: [],
    whatsapp_logs: [],
    audit_logs: [],
  };
}

export class GymRelationalDatabase {
  private filePath: string;
  private state: GymDatabaseState;

  constructor(customFilePath?: string) {
    this.filePath = customFilePath || path.resolve(process.cwd(), 'data', 'gym-management-db.json');
    this.state = this.loadFromDisk();
    this.seedIfEmpty();
    this.ensureAuxiliarySeeds();
  }

  private loadFromDisk(): GymDatabaseState {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.gyms)) {
          return { ...createEmptyState(), ...parsed };
        }
      }
    } catch {
      // Corrupt file fallback — preserve backup if possible
      try {
        if (fs.existsSync(this.filePath)) {
          fs.copyFileSync(this.filePath, `${this.filePath}.corrupt.${Date.now()}`);
        }
      } catch {
        // ignore
      }
    }
    return createEmptyState();
  }

  private persistToDisk(nextState: GymDatabaseState): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpPath = `${this.filePath}.tmp.${process.pid}.${Date.now()}`;
    fs.writeFileSync(tmpPath, JSON.stringify(nextState, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  }

  /**
   * Validates primary keys, foreign keys, and tenant/uniqueness constraints.
   * Throws an error to roll back any violating transaction.
   */
  private validateIntegrity(db: GymDatabaseState): void {
    const gymIds = new Set(db.gyms.map((g) => g.gym_id));
    if (gymIds.size !== db.gyms.length) {
      throw new Error('Integrity violation: duplicate gym_id in gyms table.');
    }

    const packageMap = new Map<number, MembershipPackageRecord>();
    for (const pkg of db.membership_packages) {
      if (!gymIds.has(pkg.gym_id)) {
        throw new Error(`Foreign key violation: package ${pkg.id} references unknown gym_id ${pkg.gym_id}.`);
      }
      if (packageMap.has(pkg.id)) {
        throw new Error(`Primary key violation: duplicate package id ${pkg.id}.`);
      }
      packageMap.set(pkg.id, pkg);
    }

    const memberIds = new Set<number>();
    const mobilePerGym = new Set<string>();
    for (const m of db.members) {
      if (!gymIds.has(m.gym_id)) {
        throw new Error(`Foreign key violation: member ${m.id} references unknown gym_id ${m.gym_id}.`);
      }
      if (memberIds.has(m.id)) {
        throw new Error(`Primary key violation: duplicate member id ${m.id}.`);
      }
      memberIds.add(m.id);

      const normPhone = normalizeMobile(m.phone);
      if (normPhone && !m.archived) {
        const key = `${m.gym_id}::${normPhone}`;
        if (mobilePerGym.has(key)) {
          throw new Error(`Duplicate mobile number detected: ${m.phone} is already registered to an active member.`);
        }
        mobilePerGym.add(key);
      }
    }

    for (const ms of db.memberships) {
      if (!gymIds.has(ms.gym_id) || !memberIds.has(ms.member_id)) {
        throw new Error(`Foreign key violation: membership ${ms.id} references invalid gym or member.`);
      }
    }

    const invoiceIds = new Set<number>();
    const invoiceNumbers = new Set<string>();
    for (const inv of db.invoices) {
      if (!gymIds.has(inv.gym_id) || !memberIds.has(inv.member_id)) {
        throw new Error(`Foreign key violation: invoice ${inv.id} references invalid gym or member.`);
      }
      if (invoiceIds.has(inv.id) || invoiceNumbers.has(inv.invoice_number)) {
        throw new Error(`Unique constraint violation: duplicate invoice id or invoice_number ${inv.invoice_number}.`);
      }
      invoiceIds.add(inv.id);
      invoiceNumbers.add(inv.invoice_number);
    }

    const idempotencyKeys = new Set<string>();
    for (const pay of db.payments) {
      if (!gymIds.has(pay.gym_id) || !invoiceIds.has(pay.invoice_id) || !memberIds.has(pay.member_id)) {
        throw new Error(`Foreign key violation: payment ${pay.id} references invalid gym/invoice/member.`);
      }
      if (idempotencyKeys.has(pay.idempotency_key)) {
        throw new Error(`Duplicate payment prevented: idempotency key ${pay.idempotency_key} already processed.`);
      }
      idempotencyKeys.add(pay.idempotency_key);
    }

    const offerCodePerGym = new Set<string>();
    for (const off of db.offers) {
      if (!gymIds.has(off.gym_id)) {
        throw new Error(`Foreign key violation: offer ${off.id} references unknown gym_id.`);
      }
      const key = `${off.gym_id}::${off.code.toUpperCase()}`;
      if (offerCodePerGym.has(key)) {
        throw new Error(`Unique constraint violation: promo code ${off.code} already exists.`);
      }
      offerCodePerGym.add(key);
    }
  }

  /**
   * Executes a multi-table mutation atomically with automatic rollback on failure.
   */
  public runTransaction<T>(mutator: (draft: GymDatabaseState) => T): T {
    const draft: GymDatabaseState = JSON.parse(JSON.stringify(this.state));
    const result = mutator(draft);
    this.validateIntegrity(draft);
    this.persistToDisk(draft);
    this.state = draft;
    return result;
  }

  /**
   * Read-only deep snapshot of database state (with sensitive password fields stripped for API responses).
   */
  public getSnapshot(gymId?: string): Omit<GymDatabaseState, 'users'> & {
    users: Array<Omit<UserRecord, 'password_hash' | 'password_salt'>>;
  } {
    const filterByGym = <T extends { gym_id: string }>(arr: T[]) =>
      gymId ? arr.filter((row) => row.gym_id === gymId) : [...arr];

    return {
      schema_version: this.state.schema_version,
      seeded_at: this.state.seeded_at,
      gyms: gymId ? this.state.gyms.filter((g) => g.gym_id === gymId) : [...this.state.gyms],
      users: filterByGym(this.state.users).map(({ password_hash: _h, password_salt: _s, ...safe }) => safe),
      members: filterByGym(this.state.members),
      membership_packages: filterByGym(this.state.membership_packages),
      memberships: filterByGym(this.state.memberships),
      payments: filterByGym(this.state.payments),
      attendance: filterByGym(this.state.attendance),
      expenses: filterByGym(this.state.expenses),
      invoices: filterByGym(this.state.invoices),
      leads: filterByGym(this.state.leads),
      staff: filterByGym(this.state.staff),
      offers: filterByGym(this.state.offers),
      reviews: filterByGym(this.state.reviews),
      workout_plans: filterByGym(this.state.workout_plans),
      diet_plans: filterByGym(this.state.diet_plans),
      whatsapp_logs: filterByGym(this.state.whatsapp_logs),
      audit_logs: filterByGym(this.state.audit_logs),
    };
  }

  public getRawUsers(gymId?: string): UserRecord[] {
    return gymId ? this.state.users.filter((u) => u.gym_id === gymId) : [...this.state.users];
  }

  /**
   * Authenticates a user email + password against salted scrypt hashes.
   * Returns sanitized user record (without hash/salt) or null.
   */
  public authenticateUser(
    email: string,
    password: string
  ): Omit<UserRecord, 'password_hash' | 'password_salt'> | null {
    const cleanEmail = sanitizeString(email, 160).toLowerCase();
    if (!cleanEmail || !password) return null;
    const found = this.state.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.status === 'Active'
    );
    if (!found) return null;
    if (!verifyPassword(password, found.password_hash, found.password_salt)) {
      return null;
    }
    const { password_hash: _h, password_salt: _s, ...safeUser } = found;
    return safeUser;
  }

  /**
   * Idempotent migration ensuring workout_plans and diet_plans have initial seeded data
   * on existing databases without duplicating any records.
   */
  public ensureAuxiliarySeeds(): void {
    const needsWorkouts = this.state.workout_plans.length === 0 && this.state.gyms.length > 0;
    const needsDiets = this.state.diet_plans.length === 0 && this.state.gyms.length > 0;
    if (!needsWorkouts && !needsDiets) return;

    const nowIso = new Date().toISOString();
    const targetGymId = this.state.gyms[0]?.gym_id || DEFAULT_GYM_ID;
    const leadTrainerId = this.state.staff.find((s) => s.gym_id === targetGymId && s.role === 'Trainer')?.id ?? null;

    this.runTransaction((db) => {
      if (db.workout_plans.length === 0) {
        db.workout_plans.push(
          {
            id: 1,
            gym_id: targetGymId,
            name: 'Hypertrophy Upper/Lower Split',
            category: 'Muscle Gain',
            level: 'Intermediate',
            duration: '60 mins',
            frequency: '4 Days / Week',
            assigned_trainer_id: leadTrainerId,
            description: 'Progressive overload compound-first split designed for lean muscle hypertrophy and strength progression.',
            scientific_note: 'Targets 12-16 weekly working sets per primary muscle group with 75-85% 1RM intensity.',
            ai_generated: false,
            main_workout: [
              {
                name: 'Day 1 — Upper Body Push/Pull',
                duration: '60 mins',
                intensity: 'High',
                exercises: [
                  { name: 'Barbell Bench Press', sets: '4', reps: '8-10', rest: '90s', notes: 'Controlled 2s eccentric' },
                  { name: 'Weighted Pull-Ups / Lat Pulldown', sets: '4', reps: '8-12', rest: '90s', notes: 'Full scapular depression' },
                  { name: 'Overhead Dumbbell Press', sets: '3', reps: '10', rest: '75s', notes: 'Brace core throughout' },
                  { name: 'Seated Cable Row', sets: '3', reps: '12', rest: '60s', notes: 'Pause 1s at contraction' },
                ],
              },
              {
                name: 'Day 2 — Lower Body Strength',
                duration: '60 mins',
                intensity: 'High',
                exercises: [
                  { name: 'Barbell Back Squat', sets: '4', reps: '6-8', rest: '120s', notes: 'Below parallel depth' },
                  { name: 'Romanian Deadlift', sets: '4', reps: '8-10', rest: '90s', notes: 'Neutral spine hinge' },
                  { name: 'Walking Lunges', sets: '3', reps: '12/leg', rest: '60s', notes: 'Controlled knee tracking' },
                  { name: 'Standing Calf Raises', sets: '4', reps: '15', rest: '45s', notes: 'Full stretch at bottom' },
                ],
              },
            ],
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 2,
            gym_id: targetGymId,
            name: 'Fat Loss Metabolic Circuit',
            category: 'Weight Loss',
            level: 'Beginner',
            duration: '45 mins',
            frequency: '5 Days / Week',
            assigned_trainer_id: leadTrainerId,
            description: 'Joint-friendly metabolic resistance and zone-2 cardio conditioning for sustainable fat loss.',
            scientific_note: 'Combines multi-joint resistance circuits with low-impact aerobic intervals to preserve lean mass.',
            ai_generated: false,
            main_workout: [
              {
                name: 'Day 1 — Full Body Metabolic Circuit',
                duration: '45 mins',
                intensity: 'Medium',
                exercises: [
                  { name: 'Goblet Squats', sets: '3', reps: '15', rest: '45s', notes: 'Keep chest upright' },
                  { name: 'Incline Push-Ups', sets: '3', reps: '12-15', rest: '45s', notes: 'Full range of motion' },
                  { name: 'Dumbbell Bent-Over Row', sets: '3', reps: '15', rest: '45s', notes: 'Squeeze shoulder blades' },
                  { name: 'Incline Treadmill Brisk Walk', sets: '1', reps: '20 mins', rest: '0s', notes: 'Zone 2 heart rate (65-70%)' },
                ],
              },
            ],
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 3,
            gym_id: targetGymId,
            name: 'Athletic Functional Conditioning',
            category: 'Fitness',
            level: 'Advanced',
            duration: '55 mins',
            frequency: '5 Days / Week',
            assigned_trainer_id: leadTrainerId,
            description: 'High-output strength, mobility, and core stability programming for overall athleticism.',
            scientific_note: 'Balances posterior chain power, rotational core strength, and anaerobic capacity.',
            ai_generated: false,
            main_workout: [
              {
                name: 'Day 1 — Power & Core Conditioning',
                duration: '55 mins',
                intensity: 'High',
                exercises: [
                  { name: 'Kettlebell Swings', sets: '4', reps: '15', rest: '60s', notes: 'Explosive hip snap' },
                  { name: 'Trap Bar Deadlift', sets: '4', reps: '6', rest: '120s', notes: 'Drive through midfoot' },
                  { name: 'Hanging Leg Raises', sets: '3', reps: '12', rest: '45s', notes: 'Zero momentum swing' },
                  { name: 'Rowing Ergometer Intervals', sets: '5', reps: '250m', rest: '60s', notes: 'Consistent split pace' },
                ],
              },
            ],
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      if (db.diet_plans.length === 0) {
        db.diet_plans.push(
          {
            id: 1,
            gym_id: targetGymId,
            name: 'Indian Veg Fat Loss 1650 kcal',
            level: 'Beginner',
            goal: 'Weight Loss',
            diet_type: 'Vegetarian',
            calories: 1650,
            macros: { protein: 112, carbs: 175, fats: 48 },
            allergies: 'None',
            approved_by: 'Dr. Meera Nair',
            approved_at: nowIso.split('T')[0],
            disclaimer: 'Nutritional estimates only — not a substitute for professional medical or clinical dietary advice.',
            description: 'High-protein vegetarian Indian meal plan using paneer, dal, curd, oats, and seasonal sabzi.',
            ai_generated: false,
            meals: [
              {
                name: 'Breakfast',
                time: '08:00 AM',
                totalCalories: 390,
                macros: { protein: 24, carbs: 46, fats: 11 },
                items: [
                  { food: 'Moong Dal Chilla (2 medium) + Low-fat Curd', portion: '2 pcs + 150g', calories: 390, protein: 24, carbs: 46, fats: 11 },
                ],
              },
              {
                name: 'Lunch',
                time: '01:30 PM',
                totalCalories: 520,
                macros: { protein: 34, carbs: 58, fats: 15 },
                items: [
                  { food: 'Grilled Paneer Bhurji + 2 Multigrain Roti + Cucumber Salad', portion: '120g paneer + 2 rotis', calories: 520, protein: 34, carbs: 58, fats: 15 },
                ],
              },
              {
                name: 'Post-Workout',
                time: '06:00 PM',
                totalCalories: 260,
                macros: { protein: 28, carbs: 26, fats: 4 },
                items: [
                  { food: 'Whey Protein Isolate + 1 Banana', portion: '1 scoop + 1 medium', calories: 260, protein: 28, carbs: 26, fats: 4 },
                ],
              },
              {
                name: 'Dinner',
                time: '08:30 PM',
                totalCalories: 480,
                macros: { protein: 26, carbs: 45, fats: 18 },
                items: [
                  { food: 'Tofu / Soya Chunk Stir-Fry + Yellow Dal + Steamed Rice', portion: '100g + 1 bowl', calories: 480, protein: 26, carbs: 45, fats: 18 },
                ],
              },
            ],
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 2,
            gym_id: targetGymId,
            name: 'Lean Muscle Gain 2600 kcal',
            level: 'Intermediate',
            goal: 'Muscle Gain',
            diet_type: 'Non-Vegetarian',
            calories: 2600,
            macros: { protein: 175, carbs: 310, fats: 68 },
            allergies: 'None',
            approved_by: 'Dr. Meera Nair',
            approved_at: nowIso.split('T')[0],
            disclaimer: 'Nutritional estimates only — not a substitute for professional medical or clinical dietary advice.',
            description: 'High-protein Indian athletic meal template supporting hypertrophy and recovery.',
            ai_generated: false,
            meals: [
              {
                name: 'Breakfast',
                time: '08:00 AM',
                totalCalories: 620,
                macros: { protein: 42, carbs: 70, fats: 18 },
                items: [
                  { food: '4 Egg Whites + 2 Whole Eggs Omelette + Masala Oats', portion: '6 eggs + 60g oats', calories: 620, protein: 42, carbs: 70, fats: 18 },
                ],
              },
              {
                name: 'Lunch',
                time: '01:30 PM',
                totalCalories: 780,
                macros: { protein: 56, carbs: 92, fats: 18 },
                items: [
                  { food: 'Tandoori Chicken Breast + Jeera Rice + Dal Tadka + Salad', portion: '200g chicken + 1.5 cup rice', calories: 780, protein: 56, carbs: 92, fats: 18 },
                ],
              },
              {
                name: 'Post-Workout',
                time: '06:00 PM',
                totalCalories: 460,
                macros: { protein: 35, carbs: 58, fats: 10 },
                items: [
                  { food: 'Whey Protein Shake + Peanut Butter Toast + Banana', portion: '1 scoop + 2 slices', calories: 460, protein: 35, carbs: 58, fats: 10 },
                ],
              },
              {
                name: 'Dinner',
                time: '08:45 PM',
                totalCalories: 740,
                macros: { protein: 42, carbs: 90, fats: 22 },
                items: [
                  { food: 'Grilled Fish / Chicken Curry + 3 Phulkas + Curd', portion: '180g + 3 rotis', calories: 740, protein: 42, carbs: 90, fats: 22 },
                ],
              },
            ],
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }
    });
  }

  /**
   * Real-time aggregated KPIs for AI Dashboard & AI Reports computed strictly from DB records.
   */
  public getDashboardSummary(gymId = DEFAULT_GYM_ID) {
    const snap = this.getSnapshot(gymId);
    const today = new Date().toISOString().split('T')[0];
    const activeMembers = snap.members.filter((m) => !m.archived && m.status === 'Active').length;
    const expiredMembers = snap.members.filter(
      (m) => !m.archived && (m.status === 'Expired' || (m.expiry_date && m.expiry_date < today))
    ).length;
    const pendingMembers = snap.members.filter((m) => !m.archived && m.status === 'Pending').length;
    const todayAdmissions = snap.members.filter((m) => m.join_date === today).length;
    const totalRevenue = snap.invoices
      .filter((i) => i.status === 'Paid' || i.status === 'Partial')
      .reduce((acc, i) => acc + (i.paid_amount || 0), 0);
    const todayCollections = snap.payments
      .filter((p) => p.status === 'Completed' && p.paid_at === today)
      .reduce((acc, p) => acc + p.amount, 0);
    const pendingPayments = snap.invoices
      .filter((i) => i.status === 'Pending' || i.status === 'Partial' || i.status === 'Overdue')
      .reduce((acc, i) => acc + (i.balance_amount || 0), 0);
    const totalExpenses = snap.expenses.reduce((acc, e) => acc + e.amount, 0);
    const todayAttendance = snap.attendance.filter((a) => a.date === today && a.access_granted).length;
    const openLeads = snap.leads.filter((l) => l.status !== 'Converted' && l.status !== 'Lost').length;
    const convertedLeads = snap.leads.filter((l) => l.status === 'Converted').length;
    const leadConversionRate =
      snap.leads.length > 0 ? Math.round((convertedLeads / snap.leads.length) * 100) : 0;
    const pendingReviews = snap.reviews.filter((r) => r.status === 'Pending').length;

    return {
      gym_id: gymId,
      generated_at: new Date().toISOString(),
      totalMembers: snap.members.filter((m) => !m.archived).length,
      activeMembers,
      expiredMembers,
      pendingMembers,
      todayAdmissions,
      totalRevenue,
      todayCollections,
      pendingPayments,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      todayAttendance,
      openLeads,
      convertedLeads,
      leadConversionRate,
      pendingReviews,
      staffCount: snap.staff.length,
    };
  }

  /**
   * WORKFLOW E: Expiry Alert -> Membership Renewal -> Invoice -> Payment (Atomic)
   */
  public renewMembership(input: {
    gym_id?: string;
    member_id: number;
    package_id?: number;
    payment_method?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    payment_amount?: number;
    coupon_code?: string;
    idempotency_key?: string;
    actor?: string;
  }) {
    const gymId = input.gym_id || DEFAULT_GYM_ID;
    return this.runTransaction((db) => {
      const member = db.members.find((m) => m.id === Number(input.member_id) && m.gym_id === gymId);
      if (!member) throw new Error('Member not found for renewal.');

      const pkgId = Number(input.package_id || member.package_id);
      const pkg = db.membership_packages.find((p) => p.id === pkgId && p.gym_id === gymId);
      if (!pkg) throw new Error('Selected renewal package does not exist.');

      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];
      const baseStart = member.expiry_date && member.expiry_date > today ? member.expiry_date : today;
      const newExpiry = computeExpiryDate(baseStart, pkg.duration_months || 1);

      let discountAmount = 0;
      let appliedCoupon: string | null = null;
      if (input.coupon_code && input.coupon_code.trim()) {
        const v = this.validateCoupon({
          gym_id: gymId,
          code: input.coupon_code,
          baseAmount: pkg.price,
          planName: pkg.name,
        });
        if (!v.valid) throw new Error(v.reason || 'Invalid coupon.');
        discountAmount = v.discountAmount;
        appliedCoupon = v.offer!.code;
        const draftOffer = db.offers.find((o) => o.id === v.offer!.id);
        if (draftOffer) {
          draftOffer.redemptions += 1;
          draftOffer.updated_at = nowIso;
        }
      }

      const totalAmount = Math.max(0, pkg.price - discountAmount);
      const paidAmount =
        input.payment_amount !== undefined
          ? Math.min(totalAmount, Math.max(0, Number(input.payment_amount)))
          : totalAmount;
      const balanceAmount = Math.max(0, totalAmount - paidAmount);
      const invStatus: InvoiceRecord['status'] =
        paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';

      member.package_id = pkg.id;
      member.expiry_date = newExpiry;
      member.status = paidAmount > 0 ? 'Active' : member.status;
      member.archived = false;
      member.updated_at = nowIso;

      const membership: MembershipRecord = {
        id: `MS-REN-${member.id}-${Date.now().toString().slice(-4)}`,
        gym_id: gymId,
        member_id: member.id,
        package_id: pkg.id,
        start_date: baseStart,
        end_date: newExpiry,
        status: paidAmount > 0 ? 'Active' : 'Pending',
        auto_renew: false,
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.memberships.unshift(membership);

      const nextInvId = Math.max(1000, ...db.invoices.map((i) => i.id)) + 1;
      const invoice: InvoiceRecord = {
        id: nextInvId,
        gym_id: gymId,
        invoice_number: `INV-${new Date().getFullYear()}-${nextInvId}`,
        member_id: member.id,
        member_name: member.name,
        membership_id: membership.id,
        package_id: pkg.id,
        package_name: `${pkg.name} (Renewal)`,
        subtotal: pkg.price,
        registration_fee: 0,
        coupon_code: appliedCoupon,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        refunded_amount: 0,
        status: invStatus,
        payment_method: input.payment_method || 'UPI',
        date: today,
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.invoices.unshift(invoice);

      let payment: PaymentRecord | null = null;
      if (paidAmount > 0) {
        payment = {
          id: `PAY-${nextInvId}-${Date.now().toString().slice(-4)}`,
          gym_id: gymId,
          invoice_id: nextInvId,
          member_id: member.id,
          member_name: member.name,
          amount: paidAmount,
          method: invoice.payment_method,
          status: 'Completed',
          idempotency_key: input.idempotency_key || `REN-${nextInvId}-${Date.now()}`,
          reference_no: `REN-${nextInvId}`,
          paid_at: today,
          created_at: nowIso,
        };
        db.payments.unshift(payment);
      }

      db.audit_logs.unshift({
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gym_id: gymId,
        actor: input.actor || 'admin',
        action: 'MEMBERSHIP_RENEWED',
        entity_type: 'member',
        entity_id: String(member.id),
        details: `Renewed ${member.name} on ${pkg.name} until ${newExpiry}. Paid ₹${paidAmount}/₹${totalAmount}.`,
        created_at: nowIso,
      });

      return { member, membership, invoice, payment };
    });
  }

  /**
   * Creates an on-disk backup copy of the relational database for disaster recovery.
   */
  public createBackup(actor = 'owner'): { backupFile: string; createdAt: string } {
    const dir = path.join(path.dirname(this.filePath), 'backups');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const createdAt = new Date().toISOString();
    const safeStamp = createdAt.replace(/[:.]/g, '-');
    const backupName = `gym-db-backup-${safeStamp}.json`;
    const backupPath = path.join(dir, backupName);
    fs.writeFileSync(backupPath, JSON.stringify(this.state, null, 2), 'utf-8');

    this.runTransaction((db) => {
      db.audit_logs.unshift({
        id: `AUD-BKP-${Date.now()}`,
        gym_id: DEFAULT_GYM_ID,
        actor,
        action: 'DATABASE_BACKUP_CREATED',
        entity_type: 'database',
        entity_id: backupName,
        details: `Created database backup snapshot ${backupName}.`,
        created_at: createdAt,
      });
    });

    return { backupFile: backupName, createdAt };
  }

  /**
   * Idempotent seed — guarantees all 8 core tables + auxiliary tables have clean initial records
   * without ever duplicating rows on restart.
   */
  public seedIfEmpty(): void {
    if (this.state.gyms.length > 0 && this.state.members.length > 0) {
      return;
    }

    const nowIso = new Date().toISOString();
    const today = nowIso.split('T')[0];

    this.runTransaction((db) => {
      if (db.gyms.length === 0) {
        db.gyms.push({
          gym_id: DEFAULT_GYM_ID,
          name: 'Fitness Future',
          owner_name: 'Vikram Singh',
          email: 'owner@fitnessfuture.in',
          mobile: '9829011223',
          upi_id: 'fitnessfuture@upi',
          address: 'C-Scheme, Jaipur, Rajasthan 302001',
          google_maps_url: 'https://maps.google.com/?q=C-Scheme+Jaipur',
          logo_url: '',
          signature_url: '',
          registration_status: 'Verified',
          whatsapp_url: '',
          instagram_url: '',
          facebook_url: '',
          youtube_url: '',
          created_at: nowIso,
          updated_at: nowIso,
        });
      }

      if (db.users.length === 0) {
        const ownerCred = hashPassword('Owner@FitnessFuture#2025');
        const managerCred = hashPassword('Manager@FitnessFuture#2025');
        const trainerCred = hashPassword('Trainer@FitnessFuture#2025');
        db.users.push(
          {
            id: 'USR-OWNER-01',
            gym_id: DEFAULT_GYM_ID,
            name: 'Vikram Singh',
            email: 'owner@fitnessfuture.in',
            role: 'owner',
            password_hash: ownerCred.hash,
            password_salt: ownerCred.salt,
            status: 'Active',
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 'USR-MGR-02',
            gym_id: DEFAULT_GYM_ID,
            name: 'Ananya Sharma',
            email: 'manager@fitnessfuture.in',
            role: 'manager',
            password_hash: managerCred.hash,
            password_salt: managerCred.salt,
            status: 'Active',
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 'USR-TRN-03',
            gym_id: DEFAULT_GYM_ID,
            name: 'Kabir Malhotra',
            email: 'trainer@fitnessfuture.in',
            role: 'trainer',
            password_hash: trainerCred.hash,
            password_salt: trainerCred.salt,
            status: 'Active',
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      if (db.membership_packages.length === 0) {
        db.membership_packages.push(
          {
            id: 1,
            gym_id: DEFAULT_GYM_ID,
            name: 'Monthly Fitness',
            category: 'General',
            duration_months: 1,
            duration_label: '1 Month',
            monthly_base_rate: 1500,
            registration_fee: 500,
            discount_percent: 0,
            fixed_discount: 0,
            price: 1500,
            features: ['Full Gym Floor Access', 'Cardio & Strength Zone', 'Locker Room'],
            details: 'Flexible month-to-month access.',
            is_popular: false,
            is_active: true,
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 2,
            gym_id: DEFAULT_GYM_ID,
            name: 'Quarterly Transformation',
            category: 'General',
            duration_months: 3,
            duration_label: '3 Months',
            monthly_base_rate: 1500,
            registration_fee: 500,
            discount_percent: 10,
            fixed_discount: 0,
            price: 4050,
            features: ['Full Gym Access', 'BMI & Body Assessment', '1 Personal Training Orientation'],
            details: 'Save 10% compared to monthly billing.',
            is_popular: false,
            is_active: true,
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 3,
            gym_id: DEFAULT_GYM_ID,
            name: 'Half-Yearly Pro',
            category: 'General',
            duration_months: 6,
            duration_label: '6 Months',
            monthly_base_rate: 1500,
            registration_fee: 500,
            discount_percent: 15,
            fixed_discount: 0,
            price: 7650,
            features: ['All Equipment & CrossFit Zone', 'AI Smart Workout Plan', 'Monthly Diet Check-in'],
            details: 'Save 15% with 6-month commitment.',
            is_popular: false,
            is_active: true,
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 4,
            gym_id: DEFAULT_GYM_ID,
            name: 'Annual Value Pass',
            category: 'Annual',
            duration_months: 12,
            duration_label: '12 Months',
            monthly_base_rate: 1500,
            registration_fee: 0,
            discount_percent: 20,
            fixed_discount: 0,
            price: 14400,
            features: ['20% Annual Discount Applied', 'Zero Registration Fee', 'Priority Trainer Support', 'Free AI Workout & Diet Plans'],
            details: 'Best value — save ₹3,600/year.',
            is_popular: true,
            is_active: true,
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      if (db.staff.length === 0) {
        db.staff.push(
          {
            id: 1,
            gym_id: DEFAULT_GYM_ID,
            name: 'Kabir Malhotra',
            role: 'Trainer',
            phone: '9829044110',
            email: 'kabir@fitnessfuture.in',
            salary: 35000,
            shift: '06:00 AM - 02:00 PM',
            specialization: 'Strength & Hypertrophy',
            status: 'Active',
            rating: 4.9,
            active_clients: 18,
            attendance_today: 'Present',
            payroll_status: 'Paid',
            join_date: daysAgo(320),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 2,
            gym_id: DEFAULT_GYM_ID,
            name: 'Ananya Sharma',
            role: 'Manager',
            phone: '9829044111',
            email: 'ananya@fitnessfuture.in',
            salary: 42000,
            shift: '08:00 AM - 05:00 PM',
            specialization: 'Operations & Retention',
            status: 'Active',
            rating: 4.8,
            active_clients: 0,
            attendance_today: 'Present',
            payroll_status: 'Paid',
            join_date: daysAgo(410),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 3,
            gym_id: DEFAULT_GYM_ID,
            name: 'Dr. Meera Nair',
            role: 'Dietitian',
            phone: '9829044112',
            email: 'meera@fitnessfuture.in',
            salary: 38000,
            shift: '10:00 AM - 06:00 PM',
            specialization: 'Clinical Sports Nutrition',
            status: 'Active',
            rating: 4.9,
            active_clients: 24,
            attendance_today: 'Present',
            payroll_status: 'Paid',
            join_date: daysAgo(210),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 4,
            gym_id: DEFAULT_GYM_ID,
            name: 'Rohit Chauhan',
            role: 'Receptionist',
            phone: '9829044113',
            email: 'rohit@fitnessfuture.in',
            salary: 22000,
            shift: '02:00 PM - 10:00 PM',
            specialization: 'Front Desk & Member Onboarding',
            status: 'Active',
            rating: 4.7,
            active_clients: 0,
            attendance_today: 'Present',
            payroll_status: 'Pending',
            join_date: daysAgo(150),
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      if (db.members.length === 0) {
        const seedMembers: Array<Omit<MemberRecord, 'bmi' | 'created_at' | 'updated_at'>> = [
          {
            id: 101,
            gym_id: DEFAULT_GYM_ID,
            member_code: 'FF-1101',
            name: 'Aarav Sharma',
            email: 'aarav.sharma@example.com',
            phone: '9876543210',
            gender: 'Male',
            dob: '1995-05-14',
            address: 'Malviya Nagar, Jaipur',
            join_date: daysAgo(60),
            expiry_date: daysFromNow(305),
            package_id: 4,
            assigned_trainer_id: 1,
            status: 'Active',
            archived: false,
            fitness_goal: 'Muscle Gain',
            training_experience: 'Intermediate',
            height_cm: 176,
            weight_kg: 74,
            whatsapp_consent: true,
            digital_consent: true,
            emergency_contact: { name: 'Rakesh Sharma', phone: '9876543200', relation: 'Father' },
            medical_notes: 'No chronic conditions.',
            approved_workout_plan: 'Hypertrophy Upper/Lower Split',
            approved_diet_plan: 'Lean Muscle Gain 2600 kcal',
          },
          {
            id: 102,
            gym_id: DEFAULT_GYM_ID,
            member_code: 'FF-1102',
            name: 'Priya Verma',
            email: 'priya.verma@example.com',
            phone: '9876543211',
            gender: 'Female',
            dob: '1997-08-22',
            address: 'Vaishali Nagar, Jaipur',
            join_date: daysAgo(45),
            expiry_date: daysFromNow(135),
            package_id: 3,
            assigned_trainer_id: 1,
            status: 'Active',
            archived: false,
            fitness_goal: 'Weight Loss',
            training_experience: 'Beginner',
            height_cm: 162,
            weight_kg: 66,
            whatsapp_consent: true,
            digital_consent: true,
            emergency_contact: { name: 'Sunita Verma', phone: '9876543201', relation: 'Mother' },
            medical_notes: 'Mild knee sensitivity on deep plyometrics.',
            approved_workout_plan: 'Fat Loss Metabolic Circuit',
            approved_diet_plan: 'Indian Veg Fat Loss 1650 kcal',
          },
          {
            id: 103,
            gym_id: DEFAULT_GYM_ID,
            member_code: 'FF-1103',
            name: 'Rohan Mehta',
            email: 'rohan.mehta@example.com',
            phone: '9876543212',
            gender: 'Male',
            dob: '1992-02-11',
            address: 'Mansarovar, Jaipur',
            join_date: daysAgo(105),
            expiry_date: daysAgo(15),
            package_id: 2,
            assigned_trainer_id: 1,
            status: 'Expired',
            archived: false,
            fitness_goal: 'Fitness',
            training_experience: 'Intermediate',
            height_cm: 180,
            weight_kg: 82,
            whatsapp_consent: true,
            digital_consent: true,
            emergency_contact: { name: 'Neha Mehta', phone: '9876543202', relation: 'Spouse' },
            medical_notes: 'Cleared for full training.',
          },
          {
            id: 104,
            gym_id: DEFAULT_GYM_ID,
            member_code: 'FF-1104',
            name: 'Sneha Gupta',
            email: 'sneha.gupta@example.com',
            phone: '9876543213',
            gender: 'Female',
            dob: '1998-11-04',
            address: 'Raja Park, Jaipur',
            join_date: daysAgo(12),
            expiry_date: daysFromNow(18),
            package_id: 1,
            assigned_trainer_id: 1,
            status: 'Active',
            archived: false,
            fitness_goal: 'Fitness',
            training_experience: 'Beginner',
            height_cm: 165,
            weight_kg: 59,
            whatsapp_consent: false,
            digital_consent: true,
            emergency_contact: { name: 'Deepak Gupta', phone: '9876543203', relation: 'Brother' },
            medical_notes: 'None',
          },
          {
            id: 105,
            gym_id: DEFAULT_GYM_ID,
            member_code: 'FF-1105',
            name: 'Devansh Rathore',
            email: 'devansh.rathore@example.com',
            phone: '9876543214',
            gender: 'Male',
            dob: '1994-03-29',
            address: 'C-Scheme, Jaipur',
            join_date: daysAgo(5),
            expiry_date: daysFromNow(85),
            package_id: 2,
            assigned_trainer_id: 1,
            status: 'Pending',
            archived: false,
            fitness_goal: 'Muscle Gain',
            training_experience: 'Advanced',
            height_cm: 178,
            weight_kg: 79,
            whatsapp_consent: true,
            digital_consent: true,
            emergency_contact: { name: 'Karan Rathore', phone: '9876543204', relation: 'Brother' },
            medical_notes: 'None',
          },
        ];

        for (const m of seedMembers) {
          const hm = m.height_cm / 100;
          const bmi = Number((m.weight_kg / (hm * hm)).toFixed(1));
          db.members.push({ ...m, bmi, created_at: nowIso, updated_at: nowIso });
          db.memberships.push({
            id: `MS-${m.id}-01`,
            gym_id: DEFAULT_GYM_ID,
            member_id: m.id,
            package_id: m.package_id,
            start_date: m.join_date,
            end_date: m.expiry_date,
            status: m.status === 'Expired' ? 'Expired' : m.status === 'Pending' ? 'Pending' : 'Active',
            auto_renew: m.package_id === 4,
            created_at: nowIso,
            updated_at: nowIso,
          });
        }
      }

      if (db.invoices.length === 0) {
        db.invoices.push(
          {
            id: 1001,
            gym_id: DEFAULT_GYM_ID,
            invoice_number: 'INV-2026-1001',
            member_id: 101,
            member_name: 'Aarav Sharma',
            membership_id: 'MS-101-01',
            package_id: 4,
            package_name: 'Annual Value Pass',
            subtotal: 14400,
            registration_fee: 0,
            coupon_code: null,
            discount_amount: 0,
            total_amount: 14400,
            paid_amount: 14400,
            balance_amount: 0,
            refunded_amount: 0,
            status: 'Paid',
            payment_method: 'UPI',
            date: daysAgo(60),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 1002,
            gym_id: DEFAULT_GYM_ID,
            invoice_number: 'INV-2026-1002',
            member_id: 102,
            member_name: 'Priya Verma',
            membership_id: 'MS-102-01',
            package_id: 3,
            package_name: 'Half-Yearly Pro',
            subtotal: 7650,
            registration_fee: 500,
            coupon_code: 'FIT20',
            discount_amount: 500,
            total_amount: 7650,
            paid_amount: 7650,
            balance_amount: 0,
            refunded_amount: 0,
            status: 'Paid',
            payment_method: 'Card',
            date: daysAgo(45),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 1003,
            gym_id: DEFAULT_GYM_ID,
            invoice_number: 'INV-2026-1003',
            member_id: 104,
            member_name: 'Sneha Gupta',
            membership_id: 'MS-104-01',
            package_id: 1,
            package_name: 'Monthly Fitness',
            subtotal: 1500,
            registration_fee: 500,
            coupon_code: null,
            discount_amount: 0,
            total_amount: 2000,
            paid_amount: 2000,
            balance_amount: 0,
            refunded_amount: 0,
            status: 'Paid',
            payment_method: 'Cash',
            date: daysAgo(12),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 1004,
            gym_id: DEFAULT_GYM_ID,
            invoice_number: 'INV-2026-1004',
            member_id: 105,
            member_name: 'Devansh Rathore',
            membership_id: 'MS-105-01',
            package_id: 2,
            package_name: 'Quarterly Transformation',
            subtotal: 4050,
            registration_fee: 500,
            coupon_code: null,
            discount_amount: 0,
            total_amount: 4550,
            paid_amount: 2000,
            balance_amount: 2550,
            refunded_amount: 0,
            status: 'Partial',
            payment_method: 'UPI',
            date: daysAgo(5),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 1005,
            gym_id: DEFAULT_GYM_ID,
            invoice_number: 'INV-2026-1005',
            member_id: 103,
            member_name: 'Rohan Mehta',
            membership_id: 'MS-103-01',
            package_id: 2,
            package_name: 'Quarterly Transformation',
            subtotal: 4050,
            registration_fee: 0,
            coupon_code: null,
            discount_amount: 0,
            total_amount: 4050,
            paid_amount: 0,
            balance_amount: 4050,
            refunded_amount: 0,
            status: 'Overdue',
            payment_method: 'UPI',
            date: daysAgo(15),
            created_at: nowIso,
            updated_at: nowIso,
          }
        );

        db.payments.push(
          {
            id: 'PAY-1001-1',
            gym_id: DEFAULT_GYM_ID,
            invoice_id: 1001,
            member_id: 101,
            member_name: 'Aarav Sharma',
            amount: 14400,
            method: 'UPI',
            status: 'Completed',
            idempotency_key: 'SEED-PAY-1001',
            reference_no: 'UPI99281726',
            paid_at: daysAgo(60),
            created_at: nowIso,
          },
          {
            id: 'PAY-1002-1',
            gym_id: DEFAULT_GYM_ID,
            invoice_id: 1002,
            member_id: 102,
            member_name: 'Priya Verma',
            amount: 7650,
            method: 'Card',
            status: 'Completed',
            idempotency_key: 'SEED-PAY-1002',
            reference_no: 'POS881920',
            paid_at: daysAgo(45),
            created_at: nowIso,
          },
          {
            id: 'PAY-1003-1',
            gym_id: DEFAULT_GYM_ID,
            invoice_id: 1003,
            member_id: 104,
            member_name: 'Sneha Gupta',
            amount: 2000,
            method: 'Cash',
            status: 'Completed',
            idempotency_key: 'SEED-PAY-1003',
            reference_no: 'CASH-1003',
            paid_at: daysAgo(12),
            created_at: nowIso,
          },
          {
            id: 'PAY-1004-1',
            gym_id: DEFAULT_GYM_ID,
            invoice_id: 1004,
            member_id: 105,
            member_name: 'Devansh Rathore',
            amount: 2000,
            method: 'UPI',
            status: 'Completed',
            idempotency_key: 'SEED-PAY-1004-PART1',
            reference_no: 'UPI442190',
            paid_at: daysAgo(5),
            created_at: nowIso,
          }
        );
      }

      if (db.attendance.length === 0) {
        db.attendance.push(
          {
            id: 'ATT-SEED-01',
            gym_id: DEFAULT_GYM_ID,
            member_id: 101,
            member_name: 'Aarav Sharma',
            date: today,
            check_in_time: '06:45 AM',
            check_out_time: '08:05 AM',
            duration_minutes: 80,
            zone: 'Strength',
            method: 'QR',
            access_granted: true,
            denial_reason: null,
            status: 'Checked Out',
            created_at: nowIso,
          },
          {
            id: 'ATT-SEED-02',
            gym_id: DEFAULT_GYM_ID,
            member_id: 102,
            member_name: 'Priya Verma',
            date: today,
            check_in_time: '07:30 AM',
            check_out_time: null,
            zone: 'Cardio',
            method: 'QR',
            access_granted: true,
            denial_reason: null,
            status: 'Checked In',
            created_at: nowIso,
          }
        );
      }

      if (db.expenses.length === 0) {
        db.expenses.push(
          {
            id: 1,
            gym_id: DEFAULT_GYM_ID,
            item: 'Gym Floor Commercial Rent',
            category: 'Rent',
            vendor: 'C-Scheme Commercial Properties',
            amount: 35000,
            date: daysAgo(10),
            payment_method: 'Bank Transfer',
            payment_status: 'Paid',
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 2,
            gym_id: DEFAULT_GYM_ID,
            item: 'Electricity & HVAC Power Bill',
            category: 'Utilities',
            vendor: 'JVVNL Power',
            amount: 8400,
            date: daysAgo(7),
            payment_method: 'UPI',
            payment_status: 'Paid',
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 3,
            gym_id: DEFAULT_GYM_ID,
            item: 'Treadmill Belt & Cable Maintenance',
            category: 'Maintenance',
            vendor: 'ProFit Service Engineers',
            amount: 4200,
            date: daysAgo(3),
            payment_method: 'UPI',
            payment_status: 'Paid',
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      if (db.leads.length === 0) {
        db.leads.push(
          {
            id: 1,
            gym_id: DEFAULT_GYM_ID,
            name: 'Karan Joshi',
            phone: '9829100201',
            email: 'karan.joshi@example.com',
            source: 'Instagram',
            interested_package_id: 4,
            goal: 'Muscle Gain',
            follow_up_date: today,
            status: 'Trial',
            notes: 'Completed evening trial workout, interested in Annual Value Pass.',
            converted_member_id: null,
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 2,
            gym_id: DEFAULT_GYM_ID,
            name: 'Nidhi Agarwal',
            phone: '9829100202',
            email: 'nidhi.agarwal@example.com',
            source: 'Walk-in',
            interested_package_id: 2,
            goal: 'Weight Loss',
            follow_up_date: daysFromNow(1),
            status: 'Contacted',
            notes: 'Looking for morning trainer batch with Indian veg diet plan.',
            converted_member_id: null,
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 3,
            gym_id: DEFAULT_GYM_ID,
            name: 'Siddharth Jain',
            phone: '9829100203',
            email: 'sid.jain@example.com',
            source: 'Referral',
            interested_package_id: 3,
            goal: 'Fitness',
            follow_up_date: today,
            status: 'New',
            notes: 'Referred by Aarav Sharma.',
            converted_member_id: null,
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      if (db.offers.length === 0) {
        db.offers.push(
          {
            id: 'OFF-101',
            gym_id: DEFAULT_GYM_ID,
            title: 'Annual Transformation Offer',
            code: 'FIT20',
            campaign_type: 'Coupon',
            discount_type: 'percentage',
            discount_value: 20,
            applicable_plan: 'All Membership Plans',
            valid_from: daysAgo(15),
            valid_until: daysFromNow(60),
            usage_limit: 50,
            redemptions: 4,
            status: 'Active',
            description: 'Save 20% on membership plans and unlock a free body composition check.',
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 'OFF-102',
            gym_id: DEFAULT_GYM_ID,
            title: 'Referral Flat Savings',
            code: 'FRIEND500',
            campaign_type: 'Referral',
            discount_type: 'flat',
            discount_value: 500,
            applicable_plan: 'All Membership Plans',
            valid_from: daysAgo(10),
            valid_until: daysFromNow(90),
            usage_limit: 100,
            redemptions: 2,
            status: 'Active',
            description: 'Flat ₹500 off for member referrals on quarterly, half-yearly, or annual plans.',
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      if (db.reviews.length === 0) {
        db.reviews.push(
          {
            id: 'REV-101',
            gym_id: DEFAULT_GYM_ID,
            member_id: 101,
            member_name: 'Aarav Sharma',
            rating: 5,
            category: 'Equipment',
            comment: 'Clean facility, well-maintained Olympic racks, and very helpful trainers.',
            reply: 'Thank you Aarav! Proud to support your strength journey every day.',
            replied_at: daysAgo(4),
            status: 'Replied',
            published_to_google: false,
            date: daysAgo(5),
            created_at: nowIso,
            updated_at: nowIso,
          },
          {
            id: 'REV-102',
            gym_id: DEFAULT_GYM_ID,
            member_id: 102,
            member_name: 'Priya Verma',
            rating: 4,
            category: 'Trainers',
            comment: 'Great coaching and structured diet plan. Would love one more rowing machine during peak evening hours.',
            status: 'Pending',
            published_to_google: false,
            date: daysAgo(2),
            created_at: nowIso,
            updated_at: nowIso,
          }
        );
      }

      db.audit_logs.push({
        id: `AUD-INIT-${Date.now()}`,
        gym_id: DEFAULT_GYM_ID,
        actor: 'system',
        action: 'DB_SEEDED',
        entity_type: 'database',
        entity_id: DEFAULT_GYM_ID,
        details: 'Initialized 8 core relational tables + normalized auxiliary tables idempotently.',
        created_at: nowIso,
      });

      db.seeded_at = nowIso;
    });
  }

  // ============================================================================
  // TRANSACTIONAL DOMAIN WORKFLOWS (WORKFLOWS A – K)
  // ============================================================================

  /**
   * Validates coupon code against expiry, usage limits, status, and plan match.
   */
  public validateCoupon(params: {
    gym_id?: string;
    code: string;
    baseAmount: number;
    planName?: string;
  }): {
    valid: boolean;
    reason?: string;
    offer?: OfferRecord;
    discountAmount: number;
    finalAmount: number;
  } {
    const gymId = params.gym_id || DEFAULT_GYM_ID;
    const cleanCode = sanitizeString(params.code, 40).toUpperCase();
    const baseAmount = Math.max(0, Number(params.baseAmount) || 0);
    if (!cleanCode) {
      return { valid: false, reason: 'Coupon code is required.', discountAmount: 0, finalAmount: baseAmount };
    }
    const offer = this.state.offers.find(
      (o) => o.gym_id === gymId && o.code.toUpperCase() === cleanCode
    );
    if (!offer) {
      return { valid: false, reason: `Coupon "${cleanCode}" not found.`, discountAmount: 0, finalAmount: baseAmount };
    }
    if (offer.status !== 'Active') {
      return { valid: false, reason: `Coupon "${cleanCode}" is currently ${offer.status}.`, discountAmount: 0, finalAmount: baseAmount };
    }
    const today = new Date().toISOString().split('T')[0];
    if (offer.valid_from && today < offer.valid_from) {
      return { valid: false, reason: `Coupon "${cleanCode}" is valid starting ${offer.valid_from}.`, discountAmount: 0, finalAmount: baseAmount };
    }
    if (offer.valid_until && today > offer.valid_until) {
      return { valid: false, reason: `Coupon "${cleanCode}" expired on ${offer.valid_until}.`, discountAmount: 0, finalAmount: baseAmount };
    }
    if (offer.usage_limit > 0 && offer.redemptions >= offer.usage_limit) {
      return { valid: false, reason: `Coupon "${cleanCode}" has reached its usage limit (${offer.usage_limit}).`, discountAmount: 0, finalAmount: baseAmount };
    }
    if (
      params.planName &&
      offer.applicable_plan &&
      offer.applicable_plan !== 'All Membership Plans' &&
      offer.applicable_plan.toLowerCase() !== params.planName.toLowerCase()
    ) {
      return {
        valid: false,
        reason: `Coupon "${cleanCode}" only applies to "${offer.applicable_plan}".`,
        discountAmount: 0,
        finalAmount: baseAmount,
      };
    }

    const discountAmount =
      offer.discount_type === 'percentage'
        ? Math.round((baseAmount * Math.min(100, offer.discount_value)) / 100)
        : Math.min(baseAmount, Math.round(offer.discount_value));

    return {
      valid: true,
      offer,
      discountAmount,
      finalAmount: Math.max(0, baseAmount - discountAmount),
    };
  }

  /**
   * WORKFLOW A: Admission -> Member -> Membership -> Invoice -> Payment -> Audit Log (Atomic)
   */
  public processAdmission(input: {
    gym_id?: string;
    name: string;
    phone: string;
    email?: string;
    gender?: 'Male' | 'Female' | 'Other';
    dob?: string;
    address?: string;
    package_id: number;
    fitness_goal?: string;
    training_experience?: 'Beginner' | 'Intermediate' | 'Advanced';
    height_cm?: number;
    weight_kg?: number;
    whatsapp_consent?: boolean;
    digital_consent: boolean;
    emergency_contact?: { name: string; phone: string; relation: string };
    medical_notes?: string;
    payment_method?: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    payment_amount?: number;
    coupon_code?: string;
    admission_fee?: number;
    lead_id?: number;
    idempotency_key?: string;
  }) {
    const gymId = input.gym_id || DEFAULT_GYM_ID;
    const cleanName = sanitizeString(input.name, 120);
    const normPhone = normalizeMobile(input.phone);

    if (!cleanName) throw new Error('Member full name is required.');
    if (normPhone.length < 10) throw new Error('Valid 10-digit mobile number is required.');
    if (!input.digital_consent) throw new Error('Digital consent is required before completing admission.');

    return this.runTransaction((db) => {
      const pkg = db.membership_packages.find((p) => p.id === Number(input.package_id) && p.gym_id === gymId);
      if (!pkg) throw new Error('Selected membership package does not exist.');

      const duplicate = db.members.find(
        (m) => m.gym_id === gymId && !m.archived && normalizeMobile(m.phone) === normPhone
      );
      if (duplicate) {
        throw new Error(`Duplicate mobile number: ${normPhone} is already registered to ${duplicate.name} (ID #${duplicate.id}).`);
      }

      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];
      const nextMemberId = Math.max(100, ...db.members.map((m) => m.id)) + 1;
      const height = Math.max(100, Math.min(250, Number(input.height_cm) || 170));
      const weight = Math.max(25, Math.min(250, Number(input.weight_kg) || 70));
      const bmi = Number((weight / ((height / 100) * (height / 100))).toFixed(1));
      const expiryDate = computeExpiryDate(today, pkg.duration_months || 1);

      const registrationFee =
        input.admission_fee !== undefined ? Math.max(0, Number(input.admission_fee)) : pkg.registration_fee || 0;
      let discountAmount = 0;
      let appliedCoupon: string | null = null;

      if (input.coupon_code && input.coupon_code.trim()) {
        const couponRes = this.validateCoupon({
          gym_id: gymId,
          code: input.coupon_code,
          baseAmount: pkg.price,
          planName: pkg.name,
        });
        if (!couponRes.valid) {
          throw new Error(couponRes.reason || 'Invalid coupon code.');
        }
        discountAmount = couponRes.discountAmount;
        appliedCoupon = couponRes.offer!.code;
        const draftOffer = db.offers.find((o) => o.id === couponRes.offer!.id);
        if (draftOffer) {
          draftOffer.redemptions += 1;
          draftOffer.updated_at = nowIso;
        }
      }

      const totalAmount = Math.max(0, pkg.price + registrationFee - discountAmount);
      const paidAmount =
        input.payment_amount !== undefined
          ? Math.min(totalAmount, Math.max(0, Number(input.payment_amount)))
          : totalAmount;
      const balanceAmount = Math.max(0, totalAmount - paidAmount);
      const invStatus: InvoiceRecord['status'] =
        paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';
      const memberStatus: MemberRecord['status'] = paidAmount > 0 ? 'Active' : 'Pending';

      const newMember: MemberRecord = {
        id: nextMemberId,
        gym_id: gymId,
        member_code: `FF-${1000 + nextMemberId}`,
        name: cleanName,
        email: sanitizeString(input.email, 160) || `member${nextMemberId}@fitnessfuture.in`,
        phone: normPhone,
        gender: input.gender || 'Male',
        dob: input.dob || '',
        address: sanitizeString(input.address, 250),
        join_date: today,
        expiry_date: expiryDate,
        package_id: pkg.id,
        assigned_trainer_id: db.staff.find((s) => s.gym_id === gymId && s.role === 'Trainer')?.id ?? null,
        status: memberStatus,
        archived: false,
        fitness_goal: sanitizeString(input.fitness_goal, 60) || 'Fitness',
        training_experience: input.training_experience || 'Beginner',
        height_cm: height,
        weight_kg: weight,
        bmi,
        whatsapp_consent: input.whatsapp_consent !== false,
        digital_consent: true,
        emergency_contact: {
          name: sanitizeString(input.emergency_contact?.name, 100),
          phone: normalizeMobile(input.emergency_contact?.phone || ''),
          relation: sanitizeString(input.emergency_contact?.relation, 50),
        },
        medical_notes: sanitizeString(input.medical_notes, 500),
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.members.unshift(newMember);

      const membership: MembershipRecord = {
        id: `MS-${nextMemberId}-${Date.now().toString().slice(-4)}`,
        gym_id: gymId,
        member_id: nextMemberId,
        package_id: pkg.id,
        start_date: today,
        end_date: expiryDate,
        status: memberStatus === 'Active' ? 'Active' : 'Pending',
        auto_renew: false,
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.memberships.unshift(membership);

      const nextInvId = Math.max(1000, ...db.invoices.map((i) => i.id)) + 1;
      const invoice: InvoiceRecord = {
        id: nextInvId,
        gym_id: gymId,
        invoice_number: `INV-${new Date().getFullYear()}-${nextInvId}`,
        member_id: nextMemberId,
        member_name: cleanName,
        membership_id: membership.id,
        package_id: pkg.id,
        package_name: pkg.name,
        subtotal: pkg.price,
        registration_fee: registrationFee,
        coupon_code: appliedCoupon,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        refunded_amount: 0,
        status: invStatus,
        payment_method: input.payment_method || 'UPI',
        date: today,
        created_at: nowIso,
        updated_at: nowIso,
      };
      db.invoices.unshift(invoice);

      let payment: PaymentRecord | null = null;
      if (paidAmount > 0) {
        payment = {
          id: `PAY-${nextInvId}-${Date.now().toString().slice(-4)}`,
          gym_id: gymId,
          invoice_id: nextInvId,
          member_id: nextMemberId,
          member_name: cleanName,
          amount: paidAmount,
          method: input.payment_method || 'UPI',
          status: 'Completed',
          idempotency_key: input.idempotency_key || `ADM-${nextInvId}-${Date.now()}`,
          reference_no: `${(input.payment_method || 'UPI').toUpperCase()}-${nextInvId}`,
          paid_at: today,
          created_at: nowIso,
        };
        db.payments.unshift(payment);
      }

      if (input.lead_id) {
        const lead = db.leads.find((l) => l.id === Number(input.lead_id) && l.gym_id === gymId);
        if (lead) {
          lead.status = 'Converted';
          lead.converted_member_id = nextMemberId;
          lead.updated_at = nowIso;
        }
      }

      db.audit_logs.unshift({
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gym_id: gymId,
        actor: 'admin',
        action: 'ADMISSION_COMPLETED',
        entity_type: 'member',
        entity_id: String(nextMemberId),
        details: `Admitted ${cleanName} (${pkg.name}), Invoice ${invoice.invoice_number} (₹${paidAmount}/₹${totalAmount} paid).`,
        created_at: nowIso,
      });

      return { member: newMember, membership, invoice, payment };
    });
  }

  /**
   * WORKFLOW C & I: Record full or partial payment with idempotency duplicate-payment prevention.
   */
  public recordPayment(input: {
    gym_id?: string;
    invoice_id: number;
    amount: number;
    method: 'UPI' | 'Cash' | 'Card' | 'Bank Transfer';
    idempotency_key: string;
    reference_no?: string;
    notes?: string;
  }) {
    const gymId = input.gym_id || DEFAULT_GYM_ID;
    const payAmount = Number(input.amount);
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    if (!input.idempotency_key || !input.idempotency_key.trim()) {
      throw new Error('Idempotency key is required to prevent duplicate payment processing.');
    }

    return this.runTransaction((db) => {
      const existingPayment = db.payments.find((p) => p.idempotency_key === input.idempotency_key);
      if (existingPayment) {
        throw new Error('Duplicate payment blocked: this transaction has already been processed.');
      }

      const invoice = db.invoices.find((i) => i.id === Number(input.invoice_id) && i.gym_id === gymId);
      if (!invoice) throw new Error(`Invoice #${input.invoice_id} not found.`);
      if (invoice.status === 'Paid' || invoice.balance_amount <= 0) {
        throw new Error(`Invoice ${invoice.invoice_number} is already fully paid.`);
      }
      if (invoice.status === 'Cancelled' || invoice.status === 'Refunded') {
        throw new Error(`Cannot record payment on a ${invoice.status.toLowerCase()} invoice.`);
      }
      if (payAmount > invoice.balance_amount) {
        throw new Error(`Payment ₹${payAmount} exceeds remaining balance ₹${invoice.balance_amount}.`);
      }

      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];

      invoice.paid_amount = Number((invoice.paid_amount + payAmount).toFixed(2));
      invoice.balance_amount = Math.max(0, Number((invoice.total_amount - invoice.paid_amount).toFixed(2)));
      invoice.payment_method = input.method;
      invoice.status = invoice.balance_amount <= 0 ? 'Paid' : 'Partial';
      invoice.updated_at = nowIso;

      const payment: PaymentRecord = {
        id: `PAY-${invoice.id}-${Date.now().toString().slice(-4)}`,
        gym_id: gymId,
        invoice_id: invoice.id,
        member_id: invoice.member_id,
        member_name: invoice.member_name,
        amount: payAmount,
        method: input.method,
        status: 'Completed',
        idempotency_key: input.idempotency_key,
        reference_no: sanitizeString(input.reference_no, 80) || `${input.method.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        notes: sanitizeString(input.notes, 200),
        paid_at: today,
        created_at: nowIso,
      };
      db.payments.unshift(payment);

      // Activate member & membership when payment clears or starts
      const member = db.members.find((m) => m.id === invoice.member_id && m.gym_id === gymId);
      if (member && member.status !== 'Active') {
        member.status = 'Active';
        const pkg = db.membership_packages.find((p) => p.id === invoice.package_id);
        if (member.expiry_date < today && pkg) {
          member.expiry_date = computeExpiryDate(today, pkg.duration_months || 1);
        }
        member.updated_at = nowIso;
      }
      if (invoice.membership_id) {
        const ms = db.memberships.find((m) => m.id === invoice.membership_id);
        if (ms) {
          ms.status = 'Active';
          ms.updated_at = nowIso;
        }
      }

      db.audit_logs.unshift({
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gym_id: gymId,
        actor: 'admin',
        action: 'PAYMENT_RECORDED',
        entity_type: 'invoice',
        entity_id: String(invoice.id),
        details: `Recorded ₹${payAmount} via ${input.method} on ${invoice.invoice_number}. Remaining balance: ₹${invoice.balance_amount}.`,
        created_at: nowIso,
      });

      return { invoice, payment };
    });
  }

  /**
   * Refund / cancel an invoice with full audit trail.
   */
  public refundInvoice(input: {
    gym_id?: string;
    invoice_id: number;
    reason?: string;
  }) {
    const gymId = input.gym_id || DEFAULT_GYM_ID;
    return this.runTransaction((db) => {
      const invoice = db.invoices.find((i) => i.id === Number(input.invoice_id) && i.gym_id === gymId);
      if (!invoice) throw new Error(`Invoice #${input.invoice_id} not found.`);
      if (invoice.status === 'Refunded' || invoice.status === 'Cancelled') {
        throw new Error(`Invoice ${invoice.invoice_number} is already ${invoice.status.toLowerCase()}.`);
      }

      const nowIso = new Date().toISOString();
      const refundedAmt = invoice.paid_amount;
      invoice.refunded_amount = refundedAmt;
      invoice.paid_amount = 0;
      invoice.balance_amount = 0;
      invoice.status = refundedAmt > 0 ? 'Refunded' : 'Cancelled';
      invoice.updated_at = nowIso;

      for (const p of db.payments) {
        if (p.invoice_id === invoice.id && p.status === 'Completed') {
          p.status = 'Refunded';
        }
      }

      db.audit_logs.unshift({
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gym_id: gymId,
        actor: 'admin',
        action: refundedAmt > 0 ? 'INVOICE_REFUNDED' : 'INVOICE_CANCELLED',
        entity_type: 'invoice',
        entity_id: String(invoice.id),
        details: `${invoice.invoice_number} marked ${invoice.status} (₹${refundedAmt}). Reason: ${sanitizeString(input.reason, 200) || 'Admin action'}.`,
        created_at: nowIso,
      });

      return invoice;
    });
  }

  /**
   * WORKFLOW D: QR / Geometric Attendance Check-In with strict membership validity verification
   * & duplicate check-in prevention. Logs both granted & denied access securely.
   */
  public checkInMember(input: {
    gym_id?: string;
    member_id?: number;
    qr_payload?: string;
    zone?: AttendanceDbRecord['zone'];
    method?: AttendanceDbRecord['method'];
  }) {
    const gymId = input.gym_id || DEFAULT_GYM_ID;
    let resolvedMemberId = input.member_id ? Number(input.member_id) : 0;

    if (!resolvedMemberId && input.qr_payload) {
      // Expected format: GYM-QR:<gymId>:<memberId> or numeric ID / FF-xxxx code
      const raw = input.qr_payload.trim();
      if (raw.startsWith('GYM-QR:')) {
        const parts = raw.split(':');
        resolvedMemberId = Number(parts[2] || 0);
      } else if (/^FF-\d+$/i.test(raw)) {
        const foundByCode = this.state.members.find(
          (m) => m.gym_id === gymId && m.member_code.toUpperCase() === raw.toUpperCase()
        );
        if (foundByCode) resolvedMemberId = foundByCode.id;
      } else {
        resolvedMemberId = Number(raw.replace(/\D/g, ''));
      }
    }

    return this.runTransaction((db) => {
      const member = db.members.find((m) => m.id === resolvedMemberId && m.gym_id === gymId);
      if (!member) {
        throw new Error('Member not found for check-in. Verify Member ID or QR code.');
      }

      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];
      const timeLabel = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      // Prevent duplicate active check-in
      const activeSession = db.attendance.find(
        (a) =>
          a.gym_id === gymId &&
          a.member_id === member.id &&
          a.date === today &&
          a.status === 'Checked In' &&
          a.access_granted
      );
      if (activeSession) {
        throw new Error(`${member.name} is already checked in today since ${activeSession.check_in_time}.`);
      }

      // Membership validity check
      const isExpiredByDate = Boolean(member.expiry_date && member.expiry_date < today);
      const isDenied = member.archived || member.status === 'Expired' || member.status === 'Inactive' || isExpiredByDate;

      if (isDenied) {
        const reason = member.archived
          ? 'Member account is archived'
          : isExpiredByDate || member.status === 'Expired'
          ? `Membership expired on ${member.expiry_date || 'record'} — renewal required`
          : `Membership status is ${member.status}`;

        const deniedRecord: AttendanceDbRecord = {
          id: `ATT-DENY-${Date.now().toString().slice(-6)}`,
          gym_id: gymId,
          member_id: member.id,
          member_name: member.name,
          date: today,
          check_in_time: timeLabel,
          check_out_time: null,
          zone: input.zone || 'Main Floor',
          method: input.method || 'QR',
          access_granted: false,
          denial_reason: reason,
          status: 'Denied',
          created_at: nowIso,
        };
        db.attendance.unshift(deniedRecord);
        db.audit_logs.unshift({
          id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          gym_id: gymId,
          actor: 'access_gate',
          action: 'ACCESS_DENIED',
          entity_type: 'attendance',
          entity_id: deniedRecord.id,
          details: `Check-in denied for ${member.name}: ${reason}`,
          created_at: nowIso,
        });
        return { granted: false, reason, record: deniedRecord };
      }

      const grantedRecord: AttendanceDbRecord = {
        id: `ATT-${Date.now().toString().slice(-6)}`,
        gym_id: gymId,
        member_id: member.id,
        member_name: member.name,
        date: today,
        check_in_time: timeLabel,
        check_out_time: null,
        zone: input.zone || 'Main Floor',
        method: input.method || 'QR',
        access_granted: true,
        denial_reason: null,
        status: 'Checked In',
        created_at: nowIso,
      };
      db.attendance.unshift(grantedRecord);
      db.audit_logs.unshift({
        id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gym_id: gymId,
        actor: 'access_gate',
        action: 'CHECK_IN_GRANTED',
        entity_type: 'attendance',
        entity_id: grantedRecord.id,
        details: `${member.name} checked in (${grantedRecord.method}, ${grantedRecord.zone}).`,
        created_at: nowIso,
      });

      return { granted: true, record: grantedRecord };
    });
  }

  public checkOutMember(recordId: string, gymId = DEFAULT_GYM_ID) {
    return this.runTransaction((db) => {
      const rec = db.attendance.find((a) => a.id === recordId && a.gym_id === gymId);
      if (!rec) throw new Error('Attendance record not found.');
      if (rec.status !== 'Checked In') throw new Error('Member is not currently checked in.');
      const outTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      rec.check_out_time = outTime;
      rec.status = 'Checked Out';
      rec.duration_minutes = Math.max(
        1,
        Math.round((Date.now() - new Date(rec.created_at).getTime()) / 60000)
      );
      return rec;
    });
  }

  public logWhatsAppAttempt(entry: Omit<WhatsAppLogRecord, 'id' | 'created_at'>) {
    return this.runTransaction((db) => {
      const nowIso = new Date().toISOString();
      const rec: WhatsAppLogRecord = {
        ...entry,
        id: `WA-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)}`,
        created_at: nowIso,
      };
      db.whatsapp_logs.unshift(rec);
      db.whatsapp_logs = db.whatsapp_logs.slice(0, 200);
      return rec;
    });
  }
}

export const gymDb = new GymRelationalDatabase();
