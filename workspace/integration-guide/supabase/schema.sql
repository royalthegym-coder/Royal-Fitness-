-- 1. Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    weight NUMERIC,
    height NUMERIC,
    goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Diet Plans Table
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    plan_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Realtime for Flutter
ALTER PUBLICATION supabase_realtime ADD TABLE diet_plans;

-- 4. Create Webhook to trigger Node.js Automation
CREATE OR REPLACE FUNCTION notify_nodejs_automation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'YOUR_NODEJS_WEBHOOK_URL/webhook/new-admission',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := json_build_object(
            'type', TG_OP,
            'table', TG_TABLE_NAME,
            'record', row_to_json(NEW)
        )::jsonb
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Attach Trigger to Users Table
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION notify_nodejs_automation();

-- 6. Timestamp Conflict Resolution (Race Condition Fix)
CREATE OR REPLACE FUNCTION enforce_latest_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- If the incoming updated_at is older than the existing updated_at, reject the update
    IF NEW.updated_at < OLD.updated_at THEN
        RAISE EXCEPTION 'Conflict Resolution: Rejected older update. Database has newer data.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Attach Conflict Resolution Trigger to Tables
CREATE TRIGGER before_user_update
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION enforce_latest_timestamp();

CREATE TRIGGER before_diet_plan_update
BEFORE UPDATE ON diet_plans
FOR EACH ROW
EXECUTE FUNCTION enforce_latest_timestamp();
