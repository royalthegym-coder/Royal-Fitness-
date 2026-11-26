import { supabase } from './supabase';
import {
  ProfileRecord,
  ExerciseMasterRecord,
  MembershipPlanRecord,
  SubscriptionRecord,
  PaymentTransactionRecord,
  PTContractRecord,
  PTSessionLogRecord,
  AttendanceLogRecord,
  AIWorkoutPlanRecord,
  WorkoutSessionLogRecord,
  AINutritionPlanRecord,
  DailyMealLogRecord,
  BodyMetricsLogRecord,
  GymLeadRecord,
  AutomationLogRecord,
  LiveGymCrowdView,
  SubStatus,
  LeadStatus,
} from '../types';

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ----------------------------------------------------------------------------
// 1. PROFILES & BIOMETRIC ACCESS REPOSITORY
// ----------------------------------------------------------------------------
export const profilesRepo = {
  async getById(id: string): Promise<ProfileRecord | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as ProfileRecord | null;
  },

  async getByPhone(phone: string): Promise<ProfileRecord | null> {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const { data, error } = await supabase.from('profiles').select('*').eq('phone', cleanPhone).maybeSingle();
    if (error) throw error;
    return data as ProfileRecord | null;
  },

  async listByRole(role?: ProfileRecord['role']): Promise<ProfileRecord[]> {
    let query = supabase.from('profiles').select('*');
    if (role) query = query.eq('role', role);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ProfileRecord[];
  },

  async upsert(profile: Partial<ProfileRecord> & { id: string; full_name: string; phone: string }): Promise<ProfileRecord> {
    const now = new Date().toISOString();
    const record: ProfileRecord = {
      role: 'member',
      biometric_access_enabled: false,
      activity_level: 'moderate',
      streak_days: 0,
      xp_points: 0,
      churn_risk_score: 0.0,
      whatsapp_opt_in: true,
      created_at: now,
      updated_at: now,
      ...profile,
    };
    const { data, error } = await supabase.from('profiles').upsert([record]).select().single();
    if (error) throw error;
    return data as ProfileRecord;
  },
};

// ----------------------------------------------------------------------------
// 2. MASTER EXERCISES & AI VISION BIOMECHANICS LIBRARY
// ----------------------------------------------------------------------------
export const exercisesRepo = {
  async listAll(targetMuscle?: string): Promise<ExerciseMasterRecord[]> {
    let query = supabase.from('exercises_master').select('*');
    if (targetMuscle) query = query.eq('target_muscle', targetMuscle);
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return (data || []) as ExerciseMasterRecord[];
  },

  async getSafeForMember(injuryFlags: string[] = [], targetMuscle?: string): Promise<ExerciseMasterRecord[]> {
    const all = await this.listAll(targetMuscle);
    if (!injuryFlags.length) return all;
    const normalizedFlags = new Set(injuryFlags.map((f) => f.toLowerCase().trim()));
    return all.filter((ex) => {
      const contra = ex.contraindicated_injuries || [];
      return !contra.some((inj) => normalizedFlags.has(String(inj).toLowerCase().trim()));
    });
  },

  async upsert(exercise: Omit<ExerciseMasterRecord, 'id' | 'created_at'> & { id?: string }): Promise<ExerciseMasterRecord> {
    const payload: ExerciseMasterRecord = {
      id: exercise.id || makeId('ex'),
      created_at: new Date().toISOString(),
      ...exercise,
    };
    const { data, error } = await supabase.from('exercises_master').upsert([payload]).select().single();
    if (error) throw error;
    return data as ExerciseMasterRecord;
  },
};

// ----------------------------------------------------------------------------
// 3 & 4. MEMBERSHIP PLANS & SUBSCRIPTIONS (WITH BIOMETRIC SYNC)
// ----------------------------------------------------------------------------
export const plansRepo = {
  async listActive(): Promise<MembershipPlanRecord[]> {
    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('duration_days', { ascending: true });
    if (error) throw error;
    return (data || []) as MembershipPlanRecord[];
  },

  async upsert(plan: Omit<MembershipPlanRecord, 'id' | 'created_at'> & { id?: string }): Promise<MembershipPlanRecord> {
    const payload: MembershipPlanRecord = {
      id: plan.id || makeId('plan'),
      created_at: new Date().toISOString(),
      ...plan,
    };
    const { data, error } = await supabase.from('membership_plans').upsert([payload]).select().single();
    if (error) throw error;
    return data as MembershipPlanRecord;
  },
};

export const subscriptionsRepo = {
  async listForMember(memberId: string): Promise<SubscriptionRecord[]> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('member_id', memberId)
      .order('end_date', { ascending: false });
    if (error) throw error;
    return (data || []) as SubscriptionRecord[];
  },

  async getActiveForMember(memberId: string): Promise<SubscriptionRecord | null> {
    const todayIso = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .gte('end_date', todayIso)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as SubscriptionRecord | null;
  },

  async create(sub: Omit<SubscriptionRecord, 'id' | 'created_at'> & { id?: string }): Promise<SubscriptionRecord> {
    const payload: SubscriptionRecord = {
      id: sub.id || makeId('sub'),
      created_at: new Date().toISOString(),
      ...sub,
    };
    const { data, error } = await supabase.from('subscriptions').insert([payload]).select().single();
    if (error) throw error;
    return data as SubscriptionRecord;
  },

  async updateStatus(subscriptionId: string, status: SubStatus): Promise<SubscriptionRecord> {
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status })
      .eq('id', subscriptionId)
      .select()
      .single();
    if (error) throw error;
    return data as SubscriptionRecord;
  },
};

// ----------------------------------------------------------------------------
// 5. PAYMENT TRANSACTIONS & GST LEDGER
// ----------------------------------------------------------------------------
export const paymentsRepo = {
  calculateGstBreakdown(baseAmountInr: number, gstPercent = 18, discountInr = 0) {
    const taxable = Math.max(0, Number((baseAmountInr - discountInr).toFixed(2)));
    const totalGst = Number(((taxable * gstPercent) / 100).toFixed(2));
    const cgst_inr = Number((totalGst / 2).toFixed(2));
    const sgst_inr = Number((totalGst - cgst_inr).toFixed(2));
    const total_paid_inr = Number((taxable + cgst_inr + sgst_inr).toFixed(2));
    return { subtotal_inr: taxable, cgst_inr, sgst_inr, discount_inr: discountInr, total_paid_inr };
  },

  async recordTransaction(
    tx: Omit<PaymentTransactionRecord, 'id' | 'invoice_number' | 'paid_at'> & {
      id?: string;
      invoice_number?: string;
      paid_at?: string;
    }
  ): Promise<PaymentTransactionRecord> {
    const invoiceNumber =
      tx.invoice_number ||
      `RTG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const payload: PaymentTransactionRecord = {
      id: tx.id || makeId('pay'),
      invoice_number: invoiceNumber,
      paid_at: tx.paid_at || new Date().toISOString(),
      ...tx,
    };
    const { data, error } = await supabase.from('payment_transactions').insert([payload]).select().single();
    if (error) throw error;
    return data as PaymentTransactionRecord;
  },

  async listByMember(memberId: string): Promise<PaymentTransactionRecord[]> {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('member_id', memberId)
      .order('paid_at', { ascending: false });
    if (error) throw error;
    return (data || []) as PaymentTransactionRecord[];
  },
};

// ----------------------------------------------------------------------------
// 6. PERSONAL TRAINING CONTRACTS & OTP-VERIFIED SESSION LOGS
// ----------------------------------------------------------------------------
export const ptRepo = {
  async listContracts(filter: { memberId?: string; trainerId?: string }): Promise<PTContractRecord[]> {
    let query = supabase.from('pt_contracts').select('*');
    if (filter.memberId) query = query.eq('member_id', filter.memberId);
    if (filter.trainerId) query = query.eq('trainer_id', filter.trainerId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as PTContractRecord[];
  },

  async createContract(contract: Omit<PTContractRecord, 'id' | 'created_at'> & { id?: string }): Promise<PTContractRecord> {
    const payload: PTContractRecord = {
      id: contract.id || makeId('ptc'),
      created_at: new Date().toISOString(),
      ...contract,
    };
    const { data, error } = await supabase.from('pt_contracts').insert([payload]).select().single();
    if (error) throw error;
    return data as PTContractRecord;
  },

  async logSession(session: Omit<PTSessionLogRecord, 'id' | 'session_date'> & { id?: string }): Promise<PTSessionLogRecord> {
    const payload: PTSessionLogRecord = {
      id: session.id || makeId('pts'),
      session_date: new Date().toISOString(),
      ...session,
    };
    const { data, error } = await supabase.from('pt_session_logs').insert([payload]).select().single();
    if (error) throw error;
    return data as PTSessionLogRecord;
  },

  async verifySessionOtp(sessionId: string, otp: string): Promise<{ verified: boolean; session: PTSessionLogRecord | null }> {
    const { data: sessionRow, error: fetchErr } = await supabase
      .from('pt_session_logs')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    if (fetchErr) throw fetchErr;
    const session = sessionRow as PTSessionLogRecord | null;
    if (!session || session.member_verification_otp !== otp) {
      return { verified: false, session };
    }

    const { data: updatedSession, error: updateErr } = await supabase
      .from('pt_session_logs')
      .update({ is_verified_by_member: true })
      .eq('id', sessionId)
      .select()
      .single();
    if (updateErr) throw updateErr;

    if (session.contract_id) {
      const { data: contractRow } = await supabase
        .from('pt_contracts')
        .select('*')
        .eq('id', session.contract_id)
        .maybeSingle();
      if (contractRow) {
        const nextCompleted = Number((contractRow as PTContractRecord).completed_sessions || 0) + 1;
        await supabase
          .from('pt_contracts')
          .update({ completed_sessions: nextCompleted })
          .eq('id', session.contract_id);
      }
    }

    return { verified: true, session: updatedSession as PTSessionLogRecord };
  },
};

// ----------------------------------------------------------------------------
// 7. BIOMETRIC & QR TURNSTILE ATTENDANCE + LIVE CROWD VIEW
// ----------------------------------------------------------------------------
export const attendanceRepo = {
  async processTurnstileEntry(
    memberId: string,
    entryMethod: AttendanceLogRecord['entry_method'],
    hardwareDeviceId = 'turnstile_main'
  ): Promise<AttendanceLogRecord> {
    const activeSub = await subscriptionsRepo.getActiveForMember(memberId);
    const profile = await profilesRepo.getById(memberId);

    const accessGranted = Boolean(activeSub && (profile ? profile.biometric_access_enabled !== false : true));
    const denialReason = accessGranted
      ? null
      : !activeSub
      ? 'plan_expired'
      : 'biometric_access_disabled';

    const log: AttendanceLogRecord = {
      id: makeId('att'),
      member_id: memberId,
      check_in_time: new Date().toISOString(),
      check_out_time: null,
      entry_method: entryMethod,
      hardware_device_id: hardwareDeviceId,
      access_granted: accessGranted,
      denial_reason: denialReason,
    };

    const { data, error } = await supabase.from('attendance_logs').insert([log]).select().single();
    if (error) throw error;
    return data as AttendanceLogRecord;
  },

  async checkOut(attendanceId: string): Promise<AttendanceLogRecord> {
    const { data, error } = await supabase
      .from('attendance_logs')
      .update({ check_out_time: new Date().toISOString() })
      .eq('id', attendanceId)
      .select()
      .single();
    if (error) throw error;
    return data as AttendanceLogRecord;
  },

  async listRecent(limit = 30): Promise<AttendanceLogRecord[]> {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .order('check_in_time', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as AttendanceLogRecord[];
  },

  async getLiveGymCrowd(): Promise<LiveGymCrowdView> {
    const { data, error } = await supabase
      .from('view_live_gym_crowd')
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      return { active_members_inside: 0, snapshot_at: new Date().toISOString() };
    }
    return data as LiveGymCrowdView;
  },
};

// ----------------------------------------------------------------------------
// 8. AI WORKOUT PLANS & REAL-TIME SET LOGS
// ----------------------------------------------------------------------------
export const workoutRepo = {
  async savePlan(plan: Omit<AIWorkoutPlanRecord, 'id' | 'created_at'> & { id?: string }): Promise<AIWorkoutPlanRecord> {
    if (plan.is_current) {
      await supabase
        .from('ai_workout_plans')
        .update({ is_current: false })
        .eq('member_id', plan.member_id);
    }
    const payload: AIWorkoutPlanRecord = {
      id: plan.id || makeId('awp'),
      created_at: new Date().toISOString(),
      ...plan,
    };
    const { data, error } = await supabase.from('ai_workout_plans').insert([payload]).select().single();
    if (error) throw error;
    return data as AIWorkoutPlanRecord;
  },

  async getCurrentPlan(memberId: string): Promise<AIWorkoutPlanRecord | null> {
    const { data, error } = await supabase
      .from('ai_workout_plans')
      .select('*')
      .eq('member_id', memberId)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as AIWorkoutPlanRecord | null;
  },

  async logSet(log: Omit<WorkoutSessionLogRecord, 'id' | 'created_at'> & { id?: string }): Promise<WorkoutSessionLogRecord> {
    const payload: WorkoutSessionLogRecord = {
      id: log.id || makeId('wsl'),
      workout_date: log.workout_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      ...log,
    };
    const { data, error } = await supabase.from('workout_session_logs').insert([payload]).select().single();
    if (error) throw error;
    return data as WorkoutSessionLogRecord;
  },

  async listSetLogs(memberId: string, limit = 100): Promise<WorkoutSessionLogRecord[]> {
    const { data, error } = await supabase
      .from('workout_session_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as WorkoutSessionLogRecord[];
  },
};

// ----------------------------------------------------------------------------
// 9. AI NUTRITION PLANS & DAILY MEAL LOGS
// ----------------------------------------------------------------------------
export const nutritionRepo = {
  async savePlan(plan: Omit<AINutritionPlanRecord, 'id' | 'created_at'> & { id?: string }): Promise<AINutritionPlanRecord> {
    if (plan.is_current) {
      await supabase
        .from('ai_nutrition_plans')
        .update({ is_current: false })
        .eq('member_id', plan.member_id);
    }
    const payload: AINutritionPlanRecord = {
      id: plan.id || makeId('anp'),
      created_at: new Date().toISOString(),
      ...plan,
    };
    const { data, error } = await supabase.from('ai_nutrition_plans').insert([payload]).select().single();
    if (error) throw error;
    return data as AINutritionPlanRecord;
  },

  async getCurrentPlan(memberId: string): Promise<AINutritionPlanRecord | null> {
    const { data, error } = await supabase
      .from('ai_nutrition_plans')
      .select('*')
      .eq('member_id', memberId)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as AINutritionPlanRecord | null;
  },

  async logMeal(meal: Omit<DailyMealLogRecord, 'id' | 'logged_at'> & { id?: string }): Promise<DailyMealLogRecord> {
    const payload: DailyMealLogRecord = {
      id: meal.id || makeId('meal'),
      logged_at: new Date().toISOString(),
      ...meal,
    };
    const { data, error } = await supabase.from('daily_meal_logs').insert([payload]).select().single();
    if (error) throw error;
    return data as DailyMealLogRecord;
  },

  async listMeals(memberId: string, limit = 50): Promise<DailyMealLogRecord[]> {
    const { data, error } = await supabase
      .from('daily_meal_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('logged_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as DailyMealLogRecord[];
  },
};

// ----------------------------------------------------------------------------
// 10. SMART BCA SCALE & BODY METRICS
// ----------------------------------------------------------------------------
export const bodyMetricsRepo = {
  async log(entry: Omit<BodyMetricsLogRecord, 'id'> & { id?: string }): Promise<BodyMetricsLogRecord> {
    const payload: BodyMetricsLogRecord = {
      id: entry.id || makeId('bca'),
      recorded_date: entry.recorded_date || new Date().toISOString().split('T')[0],
      ...entry,
    };
    const { data, error } = await supabase.from('body_metrics_logs').insert([payload]).select().single();
    if (error) throw error;
    return data as BodyMetricsLogRecord;
  },

  async listHistory(memberId: string): Promise<BodyMetricsLogRecord[]> {
    const { data, error } = await supabase
      .from('body_metrics_logs')
      .select('*')
      .eq('member_id', memberId)
      .order('recorded_date', { ascending: false });
    if (error) throw error;
    return (data || []) as BodyMetricsLogRecord[];
  },
};

// ----------------------------------------------------------------------------
// 11. WALK-IN LEADS & CRM PIPELINE
// ----------------------------------------------------------------------------
export const leadsRepo = {
  async create(lead: Omit<GymLeadRecord, 'id' | 'created_at'> & { id?: string }): Promise<GymLeadRecord> {
    const payload: GymLeadRecord = {
      id: lead.id || makeId('lead'),
      created_at: new Date().toISOString(),
      ...lead,
    };
    const { data, error } = await supabase.from('gym_leads').upsert([payload]).select().single();
    if (error) throw error;
    return data as GymLeadRecord;
  },

  async updateStatus(leadId: string, status: LeadStatus, notes?: string): Promise<GymLeadRecord> {
    const patch: Partial<GymLeadRecord> = { status };
    if (notes !== undefined) patch.notes = notes;
    const { data, error } = await supabase
      .from('gym_leads')
      .update(patch)
      .eq('id', leadId)
      .select()
      .single();
    if (error) throw error;
    return data as GymLeadRecord;
  },

  async list(status?: LeadStatus): Promise<GymLeadRecord[]> {
    let query = supabase.from('gym_leads').select('*');
    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as GymLeadRecord[];
  },
};

// ----------------------------------------------------------------------------
// 12. WHATSAPP / N8N AUTOMATION AUDIT LOGS
// ----------------------------------------------------------------------------
export const automationLogsRepo = {
  async record(log: Omit<AutomationLogRecord, 'id' | 'created_at'> & { id?: string }): Promise<AutomationLogRecord> {
    const payload: AutomationLogRecord = {
      id: log.id || makeId('auto'),
      created_at: new Date().toISOString(),
      ...log,
    };
    const { data, error } = await supabase.from('automation_logs').insert([payload]).select().single();
    if (error) throw error;
    return data as AutomationLogRecord;
  },

  async listRecent(limit = 50): Promise<AutomationLogRecord[]> {
    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as AutomationLogRecord[];
  },
};
