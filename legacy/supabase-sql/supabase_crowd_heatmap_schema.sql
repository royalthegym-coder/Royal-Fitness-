-- ====================================================================
-- FITNESS FUTURE ("THE SINGULARITY") - LIVE CROWD HEATMAP & OCCUPANCY SQL SCHEMA
-- ====================================================================
-- Highly optimized real-time schema including PostgreSQL row constraints,
-- triggering mechanisms, and Realtime publication hooks.

-- 1. GYM OCCUPANCY TABLE
-- Tracks overall current occupancy metrics per gym tenant.
CREATE TABLE IF NOT EXISTS gym_occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id TEXT NOT NULL UNIQUE,
    current_occupancy INTEGER DEFAULT 0 CHECK (current_occupancy >= 0),
    max_capacity INTEGER DEFAULT 100 CHECK (max_capacity > 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REAL-TIME SWIPE/ATTENDANCE LOGS
-- Live register audit log for incoming/outgoing check-ins at turnstiles.
CREATE TABLE IF NOT EXISTS real_time_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id TEXT NOT NULL,
    member_id INTEGER,
    member_name TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('IN', 'OUT')) NOT NULL,
    device_id TEXT DEFAULT 'turnstile_primary',
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE SUPABASE REALTIME REPLICATION FOR THESE TABLES
-- This publishes row changes over the websocket channel in real-time.
alter publication supabase_realtime add table gym_occupancy;
alter publication supabase_realtime add table real_time_attendance_logs;

-- 4. ATOMIC TRIGGER FOR REVENUE & OCCUPANCY INTEGRITY
-- Trigger function that automatically increments or decrements occupancy 
-- upon check-in (IN) or check-out (OUT).
CREATE OR REPLACE FUNCTION update_gym_occupancy_on_swipe() 
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure the gym record exists in the occupancy scoreboard
    INSERT INTO gym_occupancy (gym_id, current_occupancy, max_capacity, updated_at)
    VALUES (NEW.gym_id, 0, 100, NOW())
    ON CONFLICT (gym_id) DO NOTHING;

    -- Adjust the metric
    IF NEW.direction = 'IN' THEN
        UPDATE gym_occupancy 
        SET current_occupancy = current_occupancy + 1,
            updated_at = NOW()
        WHERE gym_id = NEW.gym_id;
    ELSIF NEW.direction = 'OUT' THEN
        UPDATE gym_occupancy 
        SET current_occupancy = GREATEST(0, current_occupancy - 1),
            updated_at = NOW()
        WHERE gym_id = NEW.gym_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_occupancy_sync
AFTER INSERT ON real_time_attendance_logs
FOR EACH ROW
EXECUTE FUNCTION update_gym_occupancy_on_swipe();

-- 5. INITIAL SEED SELECTION
-- Seed the main tenant 'fitness_future_01'
INSERT INTO gym_occupancy (gym_id, current_occupancy, max_capacity, updated_at)
VALUES ('fitness_future_01', 42, 100, NOW())
ON CONFLICT (gym_id) DO UPDATE 
SET current_occupancy = EXCLUDED.current_occupancy, max_capacity = EXCLUDED.max_capacity, updated_at = NOW();

-- Insert historical seeds, to preview dense hours
INSERT INTO real_time_attendance_logs (gym_id, member_name, direction, logged_at) VALUES
('fitness_future_01', 'Amit Sharma', 'IN', NOW() - INTERVAL '4 hours'),
('fitness_future_01', 'Rahul Verma', 'IN', NOW() - INTERVAL '3 hours'),
('fitness_future_01', 'Priya Patel', 'IN', NOW() - INTERVAL '2 hours'),
('fitness_future_01', 'Simran Kaur', 'IN', NOW() - INTERVAL '1 hour');
