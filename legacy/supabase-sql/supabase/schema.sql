-- =========================================================================
-- FITNESS FUTURE — AUTONOMOUS AI GYM & ENTERPRISE SCHEMA
-- Synchronized with supabase/migrations/20261112_canonical_gym_os_schema.sql
-- =========================================================================

-- 1. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Strict Enums
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

-- 3. USERS & BIOMETRIC PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
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
    assigned_trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    height_cm NUMERIC(5,2),
    current_weight_kg NUMERIC(5,2),
    target_weight_kg NUMERIC(5,2),
    activity_level VARCHAR(30) DEFAULT 'moderate',
    fitness_goal VARCHAR(50),
    diet_preference VARCHAR(30),
    allergies TEXT[],
    injury_flags TEXT[],
    streak_days INT DEFAULT 0,
    xp_points INT DEFAULT 0,
    churn_risk_score NUMERIC(3,2) DEFAULT 0.00,
    whatsapp_opt_in BOOLEAN DEFAULT TRUE,
    fcm_push_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MASTER EXERCISE & AI VISION BIOMECHANICS LIBRARY
CREATE TABLE IF NOT EXISTS public.exercises_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    target_muscle VARCHAR(50) NOT NULL,
    secondary_muscles TEXT[],
    equipment_type VARCHAR(50),
    video_3d_url TEXT NOT NULL,
    contraindicated_injuries TEXT[],
    ai_vision_supported BOOLEAN DEFAULT FALSE,
    mediapipe_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MEMBERSHIP PLANS & SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.membership_plans (
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

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    freeze_days_used INT DEFAULT 0,
    status sub_status DEFAULT 'active',
    auto_renew_enabled BOOLEAN DEFAULT FALSE,
    upi_mandate_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYMENT TRANSACTIONS & GST LEDGER
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subscription_id UUID REFERENCES public.subscriptions(id),
    invoice_number VARCHAR(40) UNIQUE NOT NULL,
    subtotal_inr NUMERIC(10,2) NOT NULL,
    cgst_inr NUMERIC(10,2) DEFAULT 0.00,
    sgst_inr NUMERIC(10,2) DEFAULT 0.00,
    discount_inr NUMERIC(10,2) DEFAULT 0.00,
    total_paid_inr NUMERIC(10,2) NOT NULL,
    payment_mode VARCHAR(30) NOT NULL,
    gateway_order_id VARCHAR(100),
    gateway_payment_id VARCHAR(100) UNIQUE,
    payment_status VARCHAR(20) DEFAULT 'captured',
    invoice_pdf_url TEXT,
    paid_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PERSONAL TRAINING PACKAGES & SESSION LOGS
CREATE TABLE IF NOT EXISTS public.pt_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_sessions INT NOT NULL,
    completed_sessions INT DEFAULT 0,
    price_paid_inr NUMERIC(10,2) NOT NULL,
    trainer_commission_pct NUMERIC(4,2) DEFAULT 40.00,
    valid_until DATE NOT NULL,
    status sub_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pt_session_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID REFERENCES public.pt_contracts(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.profiles(id),
    trainer_id UUID REFERENCES public.profiles(id),
    session_date TIMESTAMPTZ DEFAULT NOW(),
    member_verification_otp VARCHAR(6),
    is_verified_by_member BOOLEAN DEFAULT FALSE,
    trainer_notes TEXT
);

-- 8. BIOMETRIC & QR TURNSTILE ATTENDANCE
CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    entry_method VARCHAR(20) NOT NULL,
    hardware_device_id VARCHAR(50),
    access_granted BOOLEAN DEFAULT TRUE,
    denial_reason VARCHAR(100)
);

-- 9. AI WORKOUT PLANS & REAL-TIME SET LOGS
CREATE TABLE IF NOT EXISTS public.ai_workout_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    ai_model_used VARCHAR(50) NOT NULL,
    generation_prompt_hash TEXT,
    weekly_schedule JSONB NOT NULL,
    trainer_reviewed BOOLEAN DEFAULT FALSE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workout_session_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES public.exercises_master(id),
    workout_date DATE DEFAULT CURRENT_DATE,
    set_number INT NOT NULL,
    weight_kg NUMERIC(5,2) NOT NULL,
    reps_completed INT NOT NULL,
    rpe_score INT CHECK (rpe_score BETWEEN 1 AND 10),
    ai_posture_score NUMERIC(5,2),
    form_faults_detected TEXT[],
    duration_seconds INT,
    synced_from_offline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AI NUTRITION PLANS & VISION MEAL SCANNER LOGS
CREATE TABLE IF NOT EXISTS public.ai_nutrition_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    daily_calories INT NOT NULL,
    protein_g INT NOT NULL,
    carbs_g INT NOT NULL,
    fats_g INT NOT NULL,
    water_liters NUMERIC(3,1) DEFAULT 3.5,
    meal_plan_json JSONB NOT NULL,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_meal_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    meal_type VARCHAR(25) NOT NULL,
    detected_items JSONB NOT NULL,
    total_calories INT NOT NULL,
    protein_g NUMERIC(5,2) NOT NULL,
    carbs_g NUMERIC(5,2) NOT NULL,
    fats_g NUMERIC(5,2) NOT NULL,
    meal_photo_url TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. SMART BCA SCALE & BODY METRICS
CREATE TABLE IF NOT EXISTS public.body_metrics_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- 12. WALK-IN LEADS, AUTOMATION AUDIT LOGS, PASSKEYS & AI CACHE
CREATE TABLE IF NOT EXISTS public.gym_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    source VARCHAR(40) DEFAULT 'walk_in',
    interested_goal VARCHAR(50),
    trial_date DATE,
    status lead_status DEFAULT 'new',
    assigned_staff_id UUID REFERENCES public.profiles(id),
    next_followup_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_phone VARCHAR(20) NOT NULL,
    member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    workflow_type VARCHAR(50) NOT NULL,
    whatsapp_template_name VARCHAR(100),
    delivery_status VARCHAR(30) DEFAULT 'queued',
    payload JSONB DEFAULT '{}'::JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.passkey_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.zero_cost_ai_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_query TEXT NOT NULL,
    query_embedding vector(768),
    cached_response TEXT NOT NULL,
    hit_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Biometric Sync Trigger & Live Crowd View
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
        FROM public.subscriptions s
        WHERE s.member_id = NEW.member_id
          AND s.status = 'active'
          AND s.end_date >= CURRENT_DATE
    ) INTO has_active_sub;

    UPDATE public.profiles
    SET biometric_access_enabled = has_active_sub,
        updated_at = NOW()
    WHERE id = NEW.member_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_biometric_sync ON public.subscriptions;
CREATE TRIGGER trg_subscription_biometric_sync
AFTER INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION fn_sync_biometric_access();

CREATE OR REPLACE VIEW public.view_live_gym_crowd AS
SELECT
    COUNT(DISTINCT member_id)::INT AS active_members_inside,
    NOW() AS snapshot_at
FROM public.attendance_logs
WHERE check_in_time >= NOW() - INTERVAL '2 hours'
  AND check_out_time IS NULL
  AND access_granted = TRUE;

-- 14. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pt_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zero_cost_ai_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view own profile" ON public.profiles;
CREATE POLICY "Members view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
