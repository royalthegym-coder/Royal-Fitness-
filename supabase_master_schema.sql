-- ==============================================================================
-- THE SINGULARITY: NEURAL OS - SUPABASE MASTER SCHEMA
-- VERSION: 1.0.0 (V.50 APEX LIVE)
-- TENANT ARCHITECTURE: Multi-Tenant SaaS via 'gym_id'
-- ==============================================================================

-- 1. GYMS (TENANTS)
CREATE TABLE IF NOT EXISTS gyms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    owner_id UUID NOT NULL, -- References auth.users
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMBERS
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE, -- If they log in
    first_name TEXT NOT NULL,
    last_name TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    date_of_birth DATE,
    gender TEXT,
    status TEXT DEFAULT 'active',
    qr_code_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STAFF
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration_days INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STAFF_LOGS (ATTENDANCE)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present'
);

-- 6. INVOICES / PAYMENT HISTORY
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    amount DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed
    gateway_transaction_id TEXT UNIQUE, -- Razorpay ID
    payment_method TEXT,
    idempotency_key TEXT UNIQUE, -- Neural Guard against dual-charges
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BIOMETRIC LOGS
CREATE TABLE IF NOT EXISTS biometrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    visceral_fat DECIMAL(5,2),
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MEDICAL REPORTS (GLOBAL HEALTH PASSPORT)
CREATE TABLE IF NOT EXISTS medical_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- e.g., blood_test, injury_scan
    report_url TEXT, -- Cloud storage link
    metadata JSONB DEFAULT '{}', -- Extracted AI metrics
    doctor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. WORKOUT_LOGS (NEURAL TRAINING)
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    workout_name TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]', -- Array of sets, reps, weight
    calories_burned INT,
    duration_minutes INT,
    ai_score INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DIET_PLANS (NUTRITION ADVISOR)
CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    total_calories INT NOT NULL,
    protein_g INT,
    carbs_g INT,
    fats_g INT,
    meals JSONB NOT NULL DEFAULT '[]',
    valid_from DATE NOT NULL,
    valid_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. LEADS (CRM)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    source TEXT,
    interest_level TEXT DEFAULT 'warm',
    status TEXT DEFAULT 'new', -- new, contacted, converted, lost
    follow_up_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT_LOGS (SYSTEM SECURITY)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID, -- auth.users
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);


-- ==============================================================================
-- NEURAL ROW LEVEL SECURITY (RLS) & ISOLATION PROTOCOLS
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Multi-Tenant Isolation Policies (Gym owners only see their own gym's data)

-- 1. GYMS (Owners can only see/edit their own gym)
CREATE POLICY "Gyms Isolation" ON gyms 
FOR ALL USING (auth.uid() = owner_id);

-- Helper function to get current user's gym_ids
CREATE OR REPLACE FUNCTION user_gym_ids() RETURNS SETOF uuid AS $$
    SELECT id FROM gyms WHERE owner_id = auth.uid()
    UNION
    SELECT gym_id FROM staff WHERE auth_user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. APPLY UNIVERSAL TENANT ISOLATION (Using gym_id)
-- Members
CREATE POLICY "Members Gym Isolation" ON members FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Staff
CREATE POLICY "Staff Gym Isolation" ON staff FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Subscription Plans
CREATE POLICY "Plans Gym Isolation" ON subscription_plans FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Attendance
CREATE POLICY "Attendance Gym Isolation" ON attendance FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Invoices
CREATE POLICY "Invoices Gym Isolation" ON invoices FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Biometrics
CREATE POLICY "Biometrics Gym Isolation" ON biometrics FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Medical Reports
CREATE POLICY "Medical Gym Isolation" ON medical_reports FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Workouts
CREATE POLICY "Workouts Gym Isolation" ON workout_logs FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Diet Plans
CREATE POLICY "Diet Gym Isolation" ON diet_plans FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Leads
CREATE POLICY "Leads Gym Isolation" ON leads FOR ALL USING (gym_id IN (SELECT user_gym_ids()));
-- Audit Logs
CREATE POLICY "Audit Gym Isolation" ON audit_logs FOR ALL USING (gym_id IN (SELECT user_gym_ids()));

-- ==============================================================================
-- INDEXING FOR NEURAL SPEED (100x Optimization)
-- ==============================================================================
CREATE INDEX idx_members_gym_id ON members(gym_id);
CREATE INDEX idx_invoices_gym_id_status ON invoices(gym_id, status);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, check_in);
CREATE INDEX idx_medical_reports_member ON medical_reports(member_id);
CREATE INDEX idx_invoices_gateway_id ON invoices(gateway_transaction_id);

-- DONE. DATABASE PROTOCOL READY.
