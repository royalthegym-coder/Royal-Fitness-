-- ============================================================================
-- FITNESS FUTURE OS — CANONICAL 12-MODULE SUPABASE SCHEMA
-- PostgreSQL Extensions, Strict Enums, Core Tables, Triggers, Views & RLS
-- ============================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS FOR STRICT TYPE SAFETY (Idempotent creation for re-runnable migrations)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('member', 'trainer', 'owner', 'receptionist');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE sub_status AS ENUM ('active', 'expired', 'frozen', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('new', 'trial_scheduled', 'trial_done', 'converted', 'lost');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 1. USERS & BIOMETRIC PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(120),
    role user_role DEFAULT 'member',
    gender gender_type,
    dob DATE,
    avatar_url TEXT,
    biometric_id VARCHAR(50) UNIQUE,
    biometric_access_enabled BOOLEAN DEFAULT FALSE,
    assigned_trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    height_cm NUMERIC(5,2),
    current_weight_kg NUMERIC(5,2),
    target_weight_kg NUMERIC(5,2),
    activity_level VARCHAR(30) DEFAULT 'moderate',
    fitness_goal VARCHAR(50), -- 'fat_loss', 'hypertrophy', 'strength', 'recomposition'
    diet_preference VARCHAR(30), -- 'pure_veg', 'eggetarian', 'non_veg', 'jain', 'vegan'
    allergies TEXT[],
    injury_flags TEXT[], -- e.g., ARRAY['lumbar_disc', 'rotator_cuff']
    streak_days INT DEFAULT 0,
    xp_points INT DEFAULT 0,
    churn_risk_score NUMERIC(3,2) DEFAULT 0.00,
    whatsapp_opt_in BOOLEAN DEFAULT TRUE,
    fcm_push_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MASTER EXERCISE & AI VISION BIOMECHANICS LIBRARY
CREATE TABLE IF NOT EXISTS exercises_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    target_muscle VARCHAR(50) NOT NULL,
    secondary_muscles TEXT[],
    equipment_type VARCHAR(50), -- 'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'
    video_3d_url TEXT NOT NULL,
    contraindicated_injuries TEXT[], -- AI avoids this exercise if member has these injuries
    ai_vision_supported BOOLEAN DEFAULT FALSE,
    mediapipe_config JSONB, -- Joint landmarks & target angles for form check
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEMBERSHIP PLANS
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    duration_days INT NOT NULL,
    base_price_inr NUMERIC(10,2) NOT NULL,
    gst_percent NUMERIC(4,2) DEFAULT 18.00,
    max_freeze_days INT DEFAULT 0,
    includes_ai_coach BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEMBER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    freeze_days_used INT DEFAULT 0,
    status sub_status DEFAULT 'active',
    auto_renew_enabled BOOLEAN DEFAULT FALSE,
    upi_mandate_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENT TRANSACTIONS & GST LEDGER
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES subscriptions(id),
    invoice_number VARCHAR(40) UNIQUE NOT NULL,
    subtotal_inr NUMERIC(10,2) NOT NULL,
    cgst_inr NUMERIC(10,2) DEFAULT 0.00,
    sgst_inr NUMERIC(10,2) DEFAULT 0.00,
    discount_inr NUMERIC(10,2) DEFAULT 0.00,
    total_paid_inr NUMERIC(10,2) NOT NULL,
    payment_mode VARCHAR(30) NOT NULL, -- 'upi_qr', 'razorpay', 'cash', 'card'
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'captured',
    invoice_pdf_url TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PERSONAL TRAINING (PT) PACKAGES & SESSION LOGS
CREATE TABLE IF NOT EXISTS pt_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_sessions INT NOT NULL,
    completed_sessions INT DEFAULT 0,
    price_paid_inr NUMERIC(10,2) NOT NULL,
    trainer_commission_pct NUMERIC(4,2) DEFAULT 40.00,
    valid_until DATE NOT NULL,
    status sub_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pt_session_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES pt_contracts(id) ON DELETE CASCADE,
    member_id UUID REFERENCES profiles(id),
    trainer_id UUID REFERENCES profiles(id),
    session_date TIMESTAMPTZ DEFAULT NOW(),
    member_verification_otp VARCHAR(6),
    is_verified_by_member BOOLEAN DEFAULT FALSE,
    trainer_notes TEXT
);

-- 7. BIOMETRIC & QR TURNSTILE ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    entry_method VARCHAR(20) NOT NULL, -- 'biometric', 'dynamic_qr', 'face_id', 'manual'
    hardware_device_id VARCHAR(50),
    access_granted BOOLEAN DEFAULT TRUE,
    denial_reason VARCHAR(100) -- e.g., 'plan_expired', 'unpaid_dues'
);

-- 8. AI WORKOUT PLANS & REAL-TIME SET LOGS
CREATE TABLE IF NOT EXISTS ai_workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    ai_model_used VARCHAR(50) NOT NULL,
    generation_prompt_hash TEXT,
    weekly_schedule JSONB NOT NULL,
    trainer_reviewed BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_session_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises_master(id),
    workout_date DATE DEFAULT CURRENT_DATE,
    set_number INT NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    reps_completed INT NOT NULL,
    rpe_score INT CHECK (rpe_score BETWEEN 1 AND 10),
    ai_posture_score NUMERIC(5,2), -- 0 to 100 from MediaPipe camera
    form_faults_detected TEXT[], -- e.g., ARRAY['knee_valgus', 'rounded_back']
    duration_seconds INT,
    synced_from_offline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AI NUTRITION PLANS & VISION MEAL SCANNER LOGS
CREATE TABLE IF NOT EXISTS ai_nutrition_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    daily_calories INT NOT NULL,
    protein_g INT NOT NULL,
    carbs_g INT NOT NULL,
    fats_g INT NOT NULL,
    water_liters NUMERIC(3,1) DEFAULT 3.5,
    meal_plan_json JSONB NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    meal_type VARCHAR(25) NOT NULL, -- 'breakfast', 'lunch', 'pre_workout', 'post_workout', 'dinner'
    detected_items JSONB NOT NULL,
    total_calories INT NOT NULL,
    protein_g NUMERIC(5,2) NOT NULL,
    carbs_g NUMERIC(5,2) NOT NULL,
    fats_g NUMERIC(5,2) NOT NULL,
    meal_photo_url TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SMART BCA SCALE & BODY METRICS
CREATE TABLE IF NOT EXISTS body_metrics_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recorded_date DATE DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5,2) NOT NULL,
    body_fat_pct NUMERIC(4,2),
    muscle_mass_kg NUMERIC(5,2),
    visceral_fat INT,
    bmr_kcal INT,
    body_water_pct NUMERIC(4,2),
    chest_cm NUMERIC(5,2),
    waist_cm NUMERIC(5,2),
    bicep_cm NUMERIC(5,2),
    front_photo_url TEXT,
    side_photo_url TEXT,
    back_photo_url TEXT
);

-- 11. WALK-IN LEADS & CRM PIPELINE
CREATE TABLE IF NOT EXISTS gym_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    source VARCHAR(40) DEFAULT 'walk_in', -- 'walk_in', 'instagram', 'google_maps', 'referral'
    interested_goal VARCHAR(50),
    trial_date DATE,
    status lead_status DEFAULT 'new',
    assigned_staff_id UUID REFERENCES profiles(id),
    next_followup_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. WHATSAPP / N8N AUTOMATION AUDIT LOGS
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_phone VARCHAR(20) NOT NULL,
    member_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    workflow_type VARCHAR(50) NOT NULL, -- 'fee_expiry_reminder', 'diet_workout_delivery', 'lead_welcome_followup', 'ai_auto_reply'
    whatsapp_template_name VARCHAR(100),
    delivery_status VARCHAR(30) DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'read', 'failed'
    payload JSONB DEFAULT '{}'::JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUTOMATED BIOMETRIC ACCESS SYNC TRIGGER
-- Syncs profiles.biometric_access_enabled whenever a subscription changes
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_sync_biometric_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_active_sub BOOLEAN;
BEGIN
    IF NEW.member_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM subscriptions s
        WHERE s.member_id = NEW.member_id
          AND s.status = 'active'
          AND s.end_date >= CURRENT_DATE
    ) INTO has_active_sub;

    UPDATE profiles
    SET biometric_access_enabled = has_active_sub,
        updated_at = NOW()
    WHERE id = NEW.member_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_biometric_sync ON subscriptions;
CREATE TRIGGER trg_subscription_biometric_sync
AFTER INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION fn_sync_biometric_access();

-- ============================================================================
-- LIVE GYM CROWD REAL-TIME VIEW
-- Counts distinct members who checked in within the last 2 hours, checked-in
-- successfully (access_granted = TRUE), and have not yet checked out.
-- ============================================================================
CREATE OR REPLACE VIEW view_live_gym_crowd AS
SELECT
    COUNT(DISTINCT member_id)::INT AS active_members_inside,
    NOW() AS snapshot_at
FROM attendance_logs
WHERE check_in_time >= NOW() - INTERVAL '2 hours'
  AND check_out_time IS NULL
  AND access_granted = TRUE;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_trainer ON profiles(assigned_trainer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_status ON subscriptions(member_id, status, end_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_member ON payment_transactions(member_id, paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_contracts_member_trainer ON pt_contracts(member_id, trainer_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_checkin ON attendance_logs(member_id, check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_workout_session_logs_member_date ON workout_session_logs(member_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_meal_logs_member ON daily_meal_logs(member_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_metrics_member_date ON body_metrics_logs(member_id, recorded_date DESC);
CREATE INDEX IF NOT EXISTS idx_gym_leads_status_followup ON gym_leads(status, next_followup_at);
CREATE INDEX IF NOT EXISTS idx_automation_logs_member ON automation_logs(member_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) HELPER & POLICIES
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION fn_is_gym_staff()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
          AND role IN ('owner', 'receptionist', 'trainer')
    );
$$;

-- Enable RLS on all 15 tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pt_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_metrics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "Members view own profile" ON profiles;
CREATE POLICY "Members view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id OR fn_is_gym_staff());

DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id OR fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Users update own safe profile" ON profiles;
CREATE POLICY "Users update own safe profile" ON profiles
    FOR UPDATE USING (auth.uid() = id OR fn_get_my_role() IN ('owner', 'receptionist'))
    WITH CHECK (auth.uid() = id OR fn_get_my_role() IN ('owner', 'receptionist'));

-- 2. MASTER CATALOGS (Exercises & Active Membership Plans)
DROP POLICY IF EXISTS "Public read exercises_master" ON exercises_master;
CREATE POLICY "Public read exercises_master" ON exercises_master
    FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Staff manage exercises_master" ON exercises_master;
CREATE POLICY "Staff manage exercises_master" ON exercises_master
    FOR ALL USING (fn_get_my_role() IN ('owner', 'trainer'))
    WITH CHECK (fn_get_my_role() IN ('owner', 'trainer'));

DROP POLICY IF EXISTS "Public read active membership_plans" ON membership_plans;
CREATE POLICY "Public read active membership_plans" ON membership_plans
    FOR SELECT USING (is_active = TRUE OR fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Owner manage membership_plans" ON membership_plans;
CREATE POLICY "Owner manage membership_plans" ON membership_plans
    FOR ALL USING (fn_get_my_role() = 'owner')
    WITH CHECK (fn_get_my_role() = 'owner');

-- 3. SUBSCRIPTIONS & PAYMENTS
DROP POLICY IF EXISTS "Members view own subscriptions" ON subscriptions;
CREATE POLICY "Members view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = member_id OR fn_is_gym_staff());

DROP POLICY IF EXISTS "Staff manage subscriptions" ON subscriptions;
CREATE POLICY "Staff manage subscriptions" ON subscriptions
    FOR ALL USING (fn_get_my_role() IN ('owner', 'receptionist'))
    WITH CHECK (fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Members view own payments" ON payment_transactions;
CREATE POLICY "Members view own payments" ON payment_transactions
    FOR SELECT USING (auth.uid() = member_id OR fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Staff manage payments" ON payment_transactions;
CREATE POLICY "Staff manage payments" ON payment_transactions
    FOR ALL USING (fn_get_my_role() IN ('owner', 'receptionist'))
    WITH CHECK (fn_get_my_role() IN ('owner', 'receptionist'));

-- 4. PERSONAL TRAINING CONTRACTS & SESSIONS
DROP POLICY IF EXISTS "Members and trainers view pt_contracts" ON pt_contracts;
CREATE POLICY "Members and trainers view pt_contracts" ON pt_contracts
    FOR SELECT USING (auth.uid() = member_id OR auth.uid() = trainer_id OR fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Staff manage pt_contracts" ON pt_contracts;
CREATE POLICY "Staff manage pt_contracts" ON pt_contracts
    FOR ALL USING (fn_get_my_role() IN ('owner', 'receptionist'))
    WITH CHECK (fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Members and trainers view pt_session_logs" ON pt_session_logs;
CREATE POLICY "Members and trainers view pt_session_logs" ON pt_session_logs
    FOR SELECT USING (auth.uid() = member_id OR auth.uid() = trainer_id OR fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Trainers log pt_session_logs" ON pt_session_logs;
CREATE POLICY "Trainers log pt_session_logs" ON pt_session_logs
    FOR INSERT WITH CHECK (auth.uid() = trainer_id OR fn_get_my_role() IN ('owner', 'receptionist'));

DROP POLICY IF EXISTS "Members verify pt_session_logs" ON pt_session_logs;
CREATE POLICY "Members verify pt_session_logs" ON pt_session_logs
    FOR UPDATE USING (auth.uid() = member_id OR auth.uid() = trainer_id OR fn_get_my_role() = 'owner');

-- 5. ATTENDANCE LOGS
DROP POLICY IF EXISTS "Members view own attendance_logs" ON attendance_logs;
CREATE POLICY "Members view own attendance_logs" ON attendance_logs
    FOR SELECT USING (auth.uid() = member_id OR fn_is_gym_staff());

DROP POLICY IF EXISTS "Staff manage attendance_logs" ON attendance_logs;
CREATE POLICY "Staff manage attendance_logs" ON attendance_logs
    FOR ALL USING (fn_is_gym_staff())
    WITH CHECK (fn_is_gym_staff());

-- 6. AI WORKOUT PLANS & SESSION LOGS
DROP POLICY IF EXISTS "Members view own ai_workout_plans" ON ai_workout_plans;
CREATE POLICY "Members view own ai_workout_plans" ON ai_workout_plans
    FOR SELECT USING (auth.uid() = member_id OR fn_is_gym_staff());

DROP POLICY IF EXISTS "Staff manage ai_workout_plans" ON ai_workout_plans;
CREATE POLICY "Staff manage ai_workout_plans" ON ai_workout_plans
    FOR ALL USING (auth.uid() = member_id OR fn_is_gym_staff())
    WITH CHECK (auth.uid() = member_id OR fn_is_gym_staff());

DROP POLICY IF EXISTS "Members manage own workout_session_logs" ON workout_session_logs;
CREATE POLICY "Members manage own workout_session_logs" ON workout_session_logs
    FOR ALL USING (auth.uid() = member_id OR fn_is_gym_staff())
    WITH CHECK (auth.uid() = member_id OR fn_is_gym_staff());

-- 7. NUTRITION PLANS, MEAL LOGS & BODY METRICS
DROP POLICY IF EXISTS "Members manage own ai_nutrition_plans" ON ai_nutrition_plans;
CREATE POLICY "Members manage own ai_nutrition_plans" ON ai_nutrition_plans
    FOR ALL USING (auth.uid() = member_id OR fn_is_gym_staff())
    WITH CHECK (auth.uid() = member_id OR fn_is_gym_staff());

DROP POLICY IF EXISTS "Members manage own daily_meal_logs" ON daily_meal_logs;
CREATE POLICY "Members manage own daily_meal_logs" ON daily_meal_logs
    FOR ALL USING (auth.uid() = member_id OR fn_is_gym_staff())
    WITH CHECK (auth.uid() = member_id OR fn_is_gym_staff());

DROP POLICY IF EXISTS "Members manage own body_metrics_logs" ON body_metrics_logs;
CREATE POLICY "Members manage own body_metrics_logs" ON body_metrics_logs
    FOR ALL USING (auth.uid() = member_id OR fn_is_gym_staff())
    WITH CHECK (auth.uid() = member_id OR fn_is_gym_staff());

-- 8. CRM LEADS & AUTOMATION LOGS (Staff & Owner Only)
DROP POLICY IF EXISTS "Staff manage gym_leads" ON gym_leads;
CREATE POLICY "Staff manage gym_leads" ON gym_leads
    FOR ALL USING (fn_is_gym_staff())
    WITH CHECK (fn_is_gym_staff());

DROP POLICY IF EXISTS "Staff view automation_logs" ON automation_logs;
CREATE POLICY "Staff view automation_logs" ON automation_logs
    FOR SELECT USING (fn_is_gym_staff() OR auth.uid() = member_id);

DROP POLICY IF EXISTS "Staff insert automation_logs" ON automation_logs;
CREATE POLICY "Staff insert automation_logs" ON automation_logs
    FOR INSERT WITH CHECK (fn_is_gym_staff());
