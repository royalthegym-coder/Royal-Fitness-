do $$ declare r text; begin foreach r in array array['anon','authenticated','service_role'] loop if not exists (select 1 from pg_roles where rolname = r) then execute format('create role %I nologin', r); end if; end loop; end $$;
create schema private; create schema auth;
create table public.gyms (id uuid primary key default gen_random_uuid(), name text);
create table public.audit_log (id bigserial primary key, at timestamptz default now(), actor uuid, gym_id uuid, action text, detail jsonb);
create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid $$;
create table public.profiles (id uuid primary key, gym_id uuid, role text);
create function private.my_gym() returns uuid language sql stable security definer set search_path='' as $$ select gym_id from public.profiles where id = auth.uid() $$;
create function private.my_role() returns text language sql stable security definer set search_path='' as $$ select role from public.profiles where id = auth.uid() $$;
create function private.is_super() returns boolean language sql stable security definer set search_path='' as $$ select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false) $$;
create function private.is_admin_of(g uuid) returns boolean language sql stable security definer set search_path='' as $$ select coalesce((select role = 'gym_admin' and gym_id = g from public.profiles where id = auth.uid()), false) $$;
create function private.gym_is_open(g uuid) returns boolean language sql stable as $$ select true $$;
CREATE OR REPLACE FUNCTION private.indian_mobile(p text)
 RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path TO ''
AS $function$
declare
  d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if length(d) = 12 and left(d, 2) = '91' then d := substr(d, 3); end if;
  if length(d) = 11 and left(d, 1) = '0' then d := substr(d, 2); end if;
  if d ~ '^[6-9][0-9]{9}$' then return d; end if;
  return null;
end
$function$;
grant usage on schema private, auth to authenticated, anon, service_role;
