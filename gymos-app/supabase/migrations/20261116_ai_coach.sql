-- AI coach: a member asks short fitness questions, the Edge Function ai-coach answers.
-- Everything the model may see is assembled HERE (coach_begin) from the caller's own rows. Chats are readable only by their owner.
-- The model is reached only from the Edge Function; keys are Supabase secrets, never stored in this database.

create table if not exists public.coach_settings (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  enabled boolean not null default false,
  daily_limit integer not null default 10 check (daily_limit between 1 and 50),
  updated_at timestamptz not null default now()
);
alter table public.coach_settings enable row level security;
drop policy if exists coach_settings_read on public.coach_settings;
create policy coach_settings_read on public.coach_settings for select to authenticated
  using (private.is_super() or private.is_admin_of(gym_id));
revoke all on public.coach_settings from anon, authenticated;
grant select on public.coach_settings to authenticated;
grant all on public.coach_settings to service_role;

create table if not exists public.coach_messages (
  id bigint generated always as identity primary key,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  kind text not null default 'ai' check (kind in ('ai', 'safety')),
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists coach_messages_profile_idx on public.coach_messages (profile_id, id desc);
create index if not exists coach_messages_gym_idx on public.coach_messages (gym_id, created_at);
alter table public.coach_messages enable row level security;
drop policy if exists coach_messages_read on public.coach_messages;
create policy coach_messages_read on public.coach_messages for select to authenticated
  using (profile_id = (select auth.uid()));
revoke all on public.coach_messages from anon, authenticated;
grant select on public.coach_messages to authenticated;
grant all on public.coach_messages to service_role;

-- one question: checks who is asking, the gym switch, the daily limits, stores the question, returns what the model may know
create or replace function public.coach_begin(p_text text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  prof record; mem record; st record; fit record; gname text;
  txt text; day0 timestamptz; used int; gym_used int; last_at timestamptz; mid bigint;
  hist jsonb; diet jsonb; workout jsonb; visits30 int; last_visit date; w1 numeric; w0 numeric;
begin
  if uid is null then raise exception 'not allowed' using errcode = '42501'; end if;
  select role, gym_id into prof from public.profiles where id = uid;
  if prof.role is distinct from 'member' or prof.gym_id is null then return jsonb_build_object('error', 'members_only'); end if;
  select * into mem from public.members where profile_id = uid and gym_id = prof.gym_id order by joined_on desc nulls last limit 1;
  if not found then return jsonb_build_object('error', 'no_member'); end if;
  if not private.gym_is_open(prof.gym_id) then return jsonb_build_object('error', 'closed'); end if;
  select * into st from public.coach_settings where gym_id = prof.gym_id;
  if not found or not st.enabled then return jsonb_build_object('error', 'disabled'); end if;
  txt := btrim(regexp_replace(coalesce(p_text, ''), '[\x01-\x08\x0b\x0c\x0e-\x1f]', '', 'g'));
  if char_length(txt) < 2 or char_length(txt) > 500 then return jsonb_build_object('error', 'bad_text'); end if;

  day0 := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  select count(*) into used from public.coach_messages where profile_id = uid and role = 'user' and created_at >= day0;
  if used >= st.daily_limit then return jsonb_build_object('error', 'limit', 'limit', st.daily_limit); end if;
  select count(*) into gym_used from public.coach_messages where gym_id = prof.gym_id and role = 'user' and created_at >= day0;
  if gym_used >= 500 then return jsonb_build_object('error', 'gym_limit'); end if;
  select max(created_at) into last_at from public.coach_messages where profile_id = uid and role = 'user';
  if last_at is not null and last_at > now() - interval '4 seconds' then return jsonb_build_object('error', 'too_fast'); end if;

  select coalesce(jsonb_agg(jsonb_build_object('role', h.role, 'content', h.content) order by h.id), '[]'::jsonb) into hist
    from (select id, role, content from public.coach_messages where profile_id = uid order by id desc limit 8) h;
  insert into public.coach_messages (gym_id, profile_id, role, content) values (prof.gym_id, uid, 'user', txt) returning id into mid;
  delete from public.coach_messages where profile_id = uid
    and id <= coalesce((select id from public.coach_messages where profile_id = uid order by id desc offset 60 limit 1), 0);

  select name into gname from public.gyms where id = prof.gym_id;
  select * into fit from public.member_fit where member_id = mem.id;
  select jsonb_build_object('kcal', summary->'kcal', 'protein', summary->'protein', 'carbs', summary->'carbs', 'fat', summary->'fat') into diet
    from public.member_plans where member_id = mem.id and kind = 'diet' and status = 'published' order by published_at desc nulls last limit 1;
  select jsonb_build_object('title', coalesce(summary->'title'->>'en', title), 'days',
      case when jsonb_typeof(content->'days') = 'array' then (select coalesce(jsonb_agg(d->'focus'->>'en'), '[]'::jsonb) from jsonb_array_elements(content->'days') d) else '[]'::jsonb end) into workout
    from public.member_plans where member_id = mem.id and kind = 'workout' and status = 'published' order by published_at desc nulls last limit 1;
  select count(*), max((in_at at time zone 'Asia/Kolkata')::date) into visits30, last_visit
    from public.visits where member_id = mem.id and in_at >= now() - interval '30 days';
  select weight_kg into w1 from public.member_progress where member_id = mem.id and weight_kg is not null order by measured_on desc, created_at desc limit 1;
  select weight_kg into w0 from public.member_progress where member_id = mem.id and weight_kg is not null order by measured_on desc, created_at desc offset 1 limit 1;

  return jsonb_build_object('ok', true, 'msg_id', mid, 'remaining', st.daily_limit - used - 1, 'limit', st.daily_limit,
    'gym_name', left(coalesce(gname, ''), 60), 'history', hist,
    'ctx', jsonb_build_object(
      'first_name', left(split_part(btrim(mem.name), ' ', 1), 30), 'gender', mem.gender,
      'membership_status', mem.status, 'membership_days_left', case when mem.end_date is null then null else (mem.end_date - (now() at time zone 'Asia/Kolkata')::date) end,
      'age', fit.age, 'height_cm', fit.height_cm, 'weight_kg', coalesce(w1, fit.weight_kg), 'previous_weight_kg', w0, 'target_weight_kg', fit.target_weight_kg,
      'goal', coalesce(fit.goal, mem.goal), 'diet_pref', fit.diet_pref, 'activity', fit.activity, 'experience', fit.experience,
      'days_per_week', fit.days_per_week, 'session_min', fit.session_min, 'equipment', left(fit.equipment, 80),
      'injuries', left(fit.injuries, 160), 'conditions', left(fit.conditions, 160), 'allergies', left(fit.allergies, 160),
      'diet_plan', diet, 'workout_plan', workout, 'visits_last_30_days', visits30, 'last_visit', last_visit));
end $$;

-- the Edge Function stores the answer (members have no insert right on the table)
-- members can read and clear their own chat
create or replace function public.coach_clear()
returns integer language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if (select auth.uid()) is null then raise exception 'not allowed' using errcode = '42501'; end if;
  delete from public.coach_messages where profile_id = (select auth.uid());
  get diagnostics n = row_count; return n;
end $$;

create or replace function public.coach_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); g uuid; st record; used int;
begin
  if uid is null then raise exception 'not allowed' using errcode = '42501'; end if;
  g := private.my_gym();
  if g is null then return jsonb_build_object('enabled', false); end if;
  select * into st from public.coach_settings where gym_id = g;
  if not found or not st.enabled then return jsonb_build_object('enabled', false); end if;
  select count(*) into used from public.coach_messages
    where profile_id = uid and role = 'user' and created_at >= date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  return jsonb_build_object('enabled', true, 'limit', st.daily_limit, 'used', used, 'remaining', greatest(st.daily_limit - used, 0));
end $$;

-- super admin: any setting. Gym owner: may only switch it OFF for their own gym.
create or replace function public.set_coach(p_gym uuid, p_enabled boolean, p_limit integer default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.gyms where id = p_gym) then raise exception 'gym not found'; end if;
  if private.is_super() then
    if p_limit is not null and (p_limit < 1 or p_limit > 50) then raise exception 'limit must be 1 to 50'; end if;
    insert into public.coach_settings (gym_id, enabled, daily_limit, updated_at) values (p_gym, coalesce(p_enabled, false), coalesce(p_limit, 10), now())
      on conflict (gym_id) do update set enabled = excluded.enabled, daily_limit = coalesce(p_limit, public.coach_settings.daily_limit), updated_at = now();
  elsif private.is_admin_of(p_gym) and p_enabled is not true then
    update public.coach_settings set enabled = false, updated_at = now() where gym_id = p_gym;
  else raise exception 'not allowed' using errcode = '42501'; end if;
  insert into public.audit_log (actor, gym_id, action, detail) values ((select auth.uid()), p_gym, 'set_coach', jsonb_build_object('enabled', coalesce(p_enabled, false), 'limit', p_limit));
end $$;

-- counts only; the owner never sees what a member asked
create or replace function public.coach_stats(p_gym uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare g uuid := coalesce(p_gym, private.my_gym()); st record; day0 timestamptz;
begin
  if g is null or not (private.is_super() or private.is_admin_of(g)) then raise exception 'not allowed' using errcode = '42501'; end if;
  day0 := date_trunc('day', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  select * into st from public.coach_settings where gym_id = g;
  return jsonb_build_object('enabled', coalesce(st.enabled, false), 'limit', coalesce(st.daily_limit, 10),
    'members_with_login', (select count(*) from public.profiles where gym_id = g and role = 'member'),
    'questions_today', (select count(*) from public.coach_messages where gym_id = g and role = 'user' and created_at >= day0),
    'questions_7d', (select count(*) from public.coach_messages where gym_id = g and role = 'user' and created_at >= now() - interval '7 days'),
    'members_7d', (select count(distinct profile_id) from public.coach_messages where gym_id = g and role = 'user' and created_at >= now() - interval '7 days'));
end $$;

revoke all on function public.coach_begin(text), public.coach_clear(), public.coach_status(), public.set_coach(uuid, boolean, integer), public.coach_stats(uuid) from public, anon;
grant execute on function public.coach_begin(text), public.coach_clear(), public.coach_status(), public.set_coach(uuid, boolean, integer), public.coach_stats(uuid) to authenticated, service_role;
