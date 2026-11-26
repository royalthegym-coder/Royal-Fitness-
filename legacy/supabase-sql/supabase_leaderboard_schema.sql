-- ==============================================================================
-- THE SINGULARITY: FUTURE-OS - GAMIFIED LEADERBOARD SCHEMA
-- DESIGNATION: SUPABASE POSTGRES COMPILATION UNIT
-- MULTI-TENANCY: isolated by gym_id via Row Level Security (RLS)
-- REFERENCES: workout_logs, members, gyms
-- ==============================================================================

-- 1. Create the Gym Leaderboard Aggregates Table
CREATE TABLE IF NOT EXISTS gym_leaderboard (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gym_id UUID NOT NULL REFERENCES gyms(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    total_volume INT NOT NULL DEFAULT 0,              -- Total lbs lifted across all logs
    consistency_score INT NOT NULL DEFAULT 0,         -- Scaled metric based on active workout frequencies
    avg_ai_score DECIMAL(5, 2) DEFAULT 0.00,          -- Average form correctness score from APEX Analyzer
    weekly_frequency INT NOT NULL DEFAULT 0,         -- Workouts logged in the last rolling 7 days
    badges TEXT[] NOT NULL DEFAULT '{}'::TEXT[],      -- Array of earned digital badges (e.g., 'Titanium Lifter', 'Iron Warrior')
    current_rank INT NOT NULL DEFAULT 1,             -- Nightly computed rank within the specific Gym tenant
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_gym_member UNIQUE (gym_id, member_id)
);

-- 2. Optimize Queries via High-Performance Compound B-Tree Indexes
-- Optimizes calculations filtered by gyms and partitions ranking queries beautifully
CREATE INDEX IF NOT EXISTS idx_leaderboard_gym_member ON gym_leaderboard(gym_id, member_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankINGS ON gym_leaderboard(gym_id, current_rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_metrics ON gym_leaderboard(total_volume DESC, consistency_score DESC);

-- 3. Row Level Security (RLS) Installation
ALTER TABLE gym_leaderboard ENABLE ROW LEVEL SECURITY;

-- 4. Install Multi-Tenant Partition Security Isolation Policy
-- Strict compliance with multi-tenant tenancy constraints. Users can only query the data pointing to their gym.
DROP POLICY IF EXISTS "Leaderboard Gym Isolation" ON gym_leaderboard;
CREATE POLICY "Leaderboard Gym Isolation" ON gym_leaderboard
    FOR ALL
    USING (gym_id IN (SELECT user_gym_ids()));

-- 5. Helper Function / Quick-View to aggregate volume metrics from JSONB exercises
-- Helps the database directly run fast computations in SQL if requested
CREATE OR REPLACE FUNCTION calculate_workout_volume(exercises_json JSONB) 
RETURNS INT AS $$
DECLARE
    ex_record RECORD;
    set_record RECORD;
    total_volume INT := 0;
BEGIN
    -- Standard exercises loop
    FOR ex_record IN SELECT * FROM jsonb_array_elements(exercises_json) LOOP
        -- For each exercise, loop its recorded sets
        IF ex_record.value ? 'sets' THEN
            FOR set_record IN SELECT * FROM jsonb_array_elements(ex_record.value->'sets') LOOP
                -- Volume calculation: reps * weight
                IF (set_record.value ? 'reps') AND (set_record.value ? 'weight') THEN
                    total_volume := total_volume + (
                        COALESCE((set_record.value->>'reps')::INT, 0) * 
                        COALESCE((set_record.value->>'weight')::INT, 0)
                    );
                ELSIF (set_record.value ? 'reps') AND (set_record.value ? 'weight_lbs') THEN
                    total_volume := total_volume + (
                        COALESCE((set_record.value->>'reps')::INT, 0) * 
                        COALESCE((set_record.value->>'weight_lbs')::INT, 0)
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    RETURN total_volume;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SQL View for Live Biometric & Volume Activity Leaderboard Stats
-- This view allows real-time insights without pulling raw JSON arrays into the clients
CREATE OR REPLACE VIEW view_leaderboard_rankings AS
SELECT 
    gl.id,
    gl.gym_id,
    gl.current_rank,
    m.id AS member_id,
    concat_ws(' ', m.first_name, m.last_name) AS full_name,
    m.phone,
    gl.total_volume,
    gl.consistency_score,
    gl.avg_ai_score,
    gl.badges,
    gl.last_calculated_at
FROM gym_leaderboard gl
JOIN members m ON gl.member_id = m.id
ORDER BY gl.gym_id, gl.current_rank ASC;
