-- FITNESS FUTURE (SINGULARITY v3.1) - SUPABASE SCHEMA
-- High-Performance PostgreSQL Schema for SaaS Multi-Tenant Architecture

-- 1. GYMS (TENANTS)
CREATE TABLE IF NOT EXISTS gyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id TEXT UNIQUE NOT NULL, -- e.g., 'fitness_future_01'
    name TEXT NOT NULL,
    owner_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    subscription_level TEXT DEFAULT 'basic',
    upi_id_1 TEXT,
    upi_id_2 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MEMBERS
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    aadhaar TEXT,
    gender TEXT,
    dob DATE,
    address TEXT,
    join_date DATE DEFAULT CURRENT_DATE,
    package_id INTEGER,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Active', 'Pending', 'Expired', 'Inactive')),
    avatar TEXT,
    whatsapp_consent BOOLEAN DEFAULT TRUE,
    hipaa_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent BOOLEAN DEFAULT FALSE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    health_score INTEGER DEFAULT 50,
    bio_age FLOAT DEFAULT 0,
    medical_history JSONB DEFAULT '{}',
    physical_metrics JSONB DEFAULT '{}',
    automation_settings JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    initial_assessment JSONB DEFAULT '{}',
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PACKAGES
CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration TEXT,
    features TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INVOICES
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT,
    package_name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Overdue', 'Verification Pending', 'Rejected')),
    items JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    member_name TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    method TEXT CHECK (method IN ('QR Code', 'Cash', 'Card', 'Online', 'NEFT/RTGS')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT
);

-- 6. ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Late')),
    method TEXT DEFAULT 'Manual'
);

-- 7. MEDICAL REPORTS
CREATE TABLE IF NOT EXISTS medical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id TEXT UNIQUE NOT NULL,
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    file_url TEXT,
    ocr_data JSONB,
    status TEXT DEFAULT 'Pending',
    upload_date TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rec_id TEXT UNIQUE,
    report_id TEXT REFERENCES medical_reports(report_id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    type TEXT,
    message TEXT,
    priority TEXT,
    health_score INTEGER,
    supplement_stack JSONB,
    diet_modifications TEXT[],
    workout_adjust TEXT[],
    admin_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    threshold INTEGER DEFAULT 10,
    price DECIMAL(10, 2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_id TEXT REFERENCES gyms(gym_id) ON DELETE CASCADE,
    member_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    device TEXT,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE RLS (Row Level Security)
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- EXAMPLE POLICY (Only allow authenticated admins to see their gym's data)
-- CREATE POLICY admin_gym_access ON members
-- FOR ALL USING (auth.uid() IN (SELECT user_id FROM staff WHERE gym_id = members.gym_id));
