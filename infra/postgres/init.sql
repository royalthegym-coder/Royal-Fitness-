-- Dedicated database for n8n
CREATE DATABASE n8n_db;

-- Fitness Future tables
\c fitness_future;

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ── MEMBERS ──────────────────────────────────────────────────────
CREATE TABLE members (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  phone            VARCHAR(15)  UNIQUE NOT NULL,
  email            VARCHAR(100),
  dob              DATE,
  gender           VARCHAR(10),
  address          TEXT,
  photo_url        VARCHAR(255),
  emergency_contact VARCHAR(15),
  is_active        BOOLEAN DEFAULT true,
  joined_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── HEALTH PROFILES ──────────────────────────────────────────────
CREATE TABLE health_profiles (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id        UUID REFERENCES members(id) ON DELETE CASCADE,
  height           DECIMAL(5,2),
  weight           DECIMAL(5,2),
  body_fat         DECIMAL(5,2),
  bmi              DECIMAL(5,2),
  blood_type       VARCHAR(5),
  medical_history  TEXT,
  injuries         TEXT,
  allergies        TEXT,
  primary_goal     VARCHAR(50),
  target_weight    DECIMAL(5,2),
  activity_level   VARCHAR(20),
  diet_preference  VARCHAR(30),
  sleep_hours      DECIMAL(3,1),
  stress_level     INTEGER,
  recorded_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── MEMBERSHIPS ──────────────────────────────────────────────────
CREATE TABLE memberships (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id        UUID REFERENCES members(id) ON DELETE CASCADE,
  plan_type        VARCHAR(20) NOT NULL,  -- BASIC/STANDARD/PREMIUM
  duration_months  INTEGER NOT NULL,
  includes_cardio  BOOLEAN DEFAULT false,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  total_fee        DECIMAL(10,2),
  discount         DECIMAL(10,2) DEFAULT 0,
  status           VARCHAR(20) DEFAULT 'PENDING_PAYMENT',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── PT SUBSCRIPTIONS ─────────────────────────────────────────────
CREATE TABLE pt_subscriptions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id        UUID REFERENCES members(id) ON DELETE CASCADE,
  tier             VARCHAR(10) NOT NULL,  -- SILVER/GOLD/DIAMOND
  sessions_total   INTEGER,
  sessions_used    INTEGER DEFAULT 0,
  trainer_name     VARCHAR(100),
  fee              DECIMAL(10,2),
  start_date       DATE,
  end_date         DATE,
  status           VARCHAR(20) DEFAULT 'ACTIVE'
);

-- ── PAYMENTS ─────────────────────────────────────────────────────
CREATE TABLE payments (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id        UUID REFERENCES members(id),
  membership_id    UUID REFERENCES memberships(id),
  amount           DECIMAL(10,2) NOT NULL,
  method           VARCHAR(20),  -- UPI/CASH/CARD
  status           VARCHAR(20) DEFAULT 'PENDING',
  transaction_id   VARCHAR(100),
  due_date         DATE,
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── ATTENDANCE ───────────────────────────────────────────────────
CREATE TABLE attendance_logs (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id        UUID REFERENCES members(id),
  check_in         TIMESTAMPTZ DEFAULT NOW(),
  check_out        TIMESTAMPTZ,
  duration_mins    INTEGER,
  type             VARCHAR(20) DEFAULT 'GYM'  -- GYM/CARDIO/PT
);

-- ── DIET PLANS ───────────────────────────────────────────────────
CREATE TABLE diet_plans (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id        UUID REFERENCES members(id),
  plan_json        JSONB NOT NULL,
  target_calories  INTEGER,
  is_active        BOOLEAN DEFAULT true,
  generated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── WORKOUT PROGRAMS ─────────────────────────────────────────────
CREATE TABLE workout_programs (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id        UUID REFERENCES members(id),
  program_json     JSONB NOT NULL,
  weeks            INTEGER DEFAULT 4,
  is_active        BOOLEAN DEFAULT true,
  generated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVENTS LOG ───────────────────────────────────────────────────
CREATE TABLE events_log (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type       VARCHAR(50) NOT NULL,
  member_id        UUID,
  payload          JSONB,
  processed        BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ──────────────────────────────────────────────────────
CREATE INDEX idx_members_phone      ON members(phone);
CREATE INDEX idx_memberships_member ON memberships(member_id);
CREATE INDEX idx_payments_member    ON payments(member_id);
CREATE INDEX idx_payments_status    ON payments(status);
CREATE INDEX idx_attendance_member  ON attendance_logs(member_id);
CREATE INDEX idx_attendance_checkin ON attendance_logs(check_in);
CREATE INDEX idx_diet_member        ON diet_plans(member_id);
CREATE INDEX idx_workout_member     ON workout_programs(member_id);
CREATE INDEX idx_events_type        ON events_log(event_type);
CREATE INDEX idx_events_processed   ON events_log(processed);

-- ── VIEWS ────────────────────────────────────────────────────────
CREATE VIEW member_dashboard AS
SELECT
  m.id, m.name, m.phone,
  ms.plan_type, ms.end_date,
  ms.end_date - CURRENT_DATE AS days_remaining,
  h.weight, h.bmi, h.primary_goal,
  (SELECT COUNT(*) FROM attendance_logs a
   WHERE a.member_id = m.id
   AND a.check_in >= NOW() - INTERVAL '30 days') AS attendance_30d,
  p.amount AS pending_amount,
  p.due_date
FROM members m
LEFT JOIN memberships ms ON ms.member_id = m.id AND ms.status = 'ACTIVE'
LEFT JOIN health_profiles h ON h.member_id = m.id
LEFT JOIN payments p ON p.member_id = m.id AND p.status = 'PENDING';

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fitness_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fitness_user;
