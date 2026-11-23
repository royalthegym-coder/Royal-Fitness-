-- 1. Enable RLS on all tables
ALTER TABLE gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 2. "Gym Admin" Tenant Isolation Policies
-- Checks the login token's 'gym_id' via auth.jwt() for both gym_members and payments
CREATE POLICY "Admin_Tenant_Isolation" ON gym_members
FOR ALL 
TO authenticated
USING (
  (auth.jwt() ->> 'gym_id')::uuid = gym_id
)
WITH CHECK (
  (auth.jwt() ->> 'gym_id')::uuid = gym_id
);

CREATE POLICY "Admin_Payments_Tenant_Isolation" ON payments
FOR ALL
TO authenticated
USING (
  (auth.jwt() ->> 'gym_id')::uuid = gym_id
)
WITH CHECK (
  (auth.jwt() ->> 'gym_id')::uuid = gym_id
);

-- Note: No admin can view or modify members or payments outside their 'gym_id'

-- 3. Super Admin Aggregation RPC (Database Function)
-- Enforces strict super_admin JWT role check before aggregating metrics across tenants
CREATE OR REPLACE FUNCTION get_global_business_summary()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  result json;
BEGIN
  caller_role := coalesce(
    auth.jwt() ->> 'user_role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    ''
  );

  IF caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: super_admin role required to invoke get_global_business_summary()';
  END IF;

  SELECT json_build_object(
    'total_gyms', (SELECT count(*) FROM gyms_registry),
    'total_revenue', (SELECT coalesce(sum(amount), 0) FROM payments),
    'total_members', (SELECT count(*) FROM gym_members),
    'active_sessions', (SELECT count(*) FROM live_workouts WHERE status = 'active')
  ) INTO result;
  
  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_global_business_summary() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_global_business_summary() TO authenticated;

