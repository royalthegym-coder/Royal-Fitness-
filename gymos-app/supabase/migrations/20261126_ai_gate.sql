-- AI copilot approval gate (26 Nov 2026).
-- The owner presses "Suggest follow-ups"; the Edge Function ai-copilot reads a small, fixed snapshot from ai_begin(), asks the model to
-- pick people and draft short messages, and hands the result to ai_propose(). Nothing the model writes reaches a member or a lead
-- until the owner approves it here:
--   * the model never writes to members, leads, invoices, payments or gym_tasks. It only fills ai_actions with proposals;
--   * a proposal is checked again in SQL (kind, lengths, gym ownership, phone, opt-out, no links, daily and open-proposal caps);
--   * a task proposal becomes a gym_tasks row only when the owner approves it;
--   * a message proposal never sends anything: approving it returns the text and the number so the owner's own WhatsApp opens.
-- Master switches: the super admin allows AI for a gym (billing gate, default off), the owner then turns it on (default off).

create table if not exists public.ai_settings (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  enabled boolean not null default false,        -- the owner's switch
  allowed boolean not null default false,        -- the super admin's switch; the model costs money, so a gym starts without it
  daily_limit integer not null default 40 check (daily_limit between 1 and 500),
  updated_at timestamptz not null default now()
);
alter table public.ai_settings enable row level security;
drop policy if exists ai_settings_read on public.ai_settings;
create policy ai_settings_read on public.ai_settings for select to authenticated
  using (private.is_super() or private.is_admin_of(gym_id));
revoke all on public.ai_settings from anon, authenticated;
grant select on public.ai_settings to authenticated;
grant all on public.ai_settings to service_role;

-- one counter row per gym and day (IST); read through ai_status only
create table if not exists public.ai_usage (
  gym_id uuid not null references public.gyms(id) on delete cascade,
  day date not null,
  n integer not null default 0 check (n >= 0),
  primary key (gym_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
grant all on public.ai_usage to service_role;

create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  kind text not null check (kind in ('message', 'task')),
  status text not null default 'proposed' check (status in ('proposed', 'approved', 'rejected', 'expired')),
  member_id uuid references public.members(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null default '' check (char_length(body) <= 1000),
  reason text not null default '' check (char_length(reason) <= 300),
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  due_on date,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 80),
  created_by uuid,
  created_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz,
  final_body text check (final_body is null or char_length(final_body) <= 1000),
  -- a message goes to exactly one person and has text; a task is short and may point at at most one person
  constraint ai_actions_message_chk check (kind <> 'message' or (char_length(btrim(body)) between 1 and 1000 and (member_id is null) <> (lead_id is null))),
  constraint ai_actions_task_chk check (kind <> 'task' or (char_length(body) <= 500 and (member_id is null or lead_id is null)))
);
-- one open proposal per subject: two runs at once, or a retry, cannot pile up duplicates
create unique index if not exists ai_actions_open_uq on public.ai_actions (gym_id, dedupe_key) where status = 'proposed';
create index if not exists ai_actions_gym_idx on public.ai_actions (gym_id, status, created_at desc);
create index if not exists ai_actions_member_idx on public.ai_actions (member_id) where member_id is not null;
create index if not exists ai_actions_lead_idx on public.ai_actions (lead_id) where lead_id is not null;
alter table public.ai_actions enable row level security;
drop policy if exists ai_actions_read on public.ai_actions;
create policy ai_actions_read on public.ai_actions for select to authenticated
  using (private.is_super() or private.is_admin_of(gym_id));
revoke all on public.ai_actions from anon, authenticated;
grant select on public.ai_actions to authenticated;
grant all on public.ai_actions to service_role;

-- text that came from a model or from a form: no control characters, no hidden direction marks, bounded length
create or replace function private.ai_txt(t text, n integer, keep_nl boolean default false)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(left(
    regexp_replace(
      regexp_replace(coalesce(t, ''), case when keep_nl then '[\x01-\x09\x0b-\x1f\x7f]' else '[\x01-\x1f\x7f]' end, ' ', 'g'),
      '[' || chr(8206) || chr(8207) || chr(8234) || '-' || chr(8238) || chr(8294) || '-' || chr(8297) || chr(65279) || ']', '', 'g'),   -- direction marks and the BOM
    n))
$$;

-- owner: switch AI on or off for the own gym. It only works once the super admin has allowed it.
create or replace function public.ai_set_settings(p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym();
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  insert into public.ai_settings (gym_id, enabled, updated_at) values (g, coalesce(p_enabled, false), now())
  on conflict (gym_id) do update set enabled = excluded.enabled, updated_at = now();
  insert into public.audit_log (actor, gym_id, action, detail)
  values ((select auth.uid()), g, 'ai_settings', jsonb_build_object('enabled', coalesce(p_enabled, false)));
end
$$;

-- super admin: allow or stop AI for a gym, and set its daily cap
create or replace function public.ai_super_set(p_gym uuid, p_allowed boolean, p_limit integer default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.is_super() then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.gyms where id = p_gym) then raise exception 'gym not found'; end if;
  if p_limit is not null and (p_limit < 1 or p_limit > 500) then raise exception 'limit must be 1 to 500'; end if;
  insert into public.ai_settings (gym_id, allowed, daily_limit, updated_at)
  values (p_gym, coalesce(p_allowed, false), coalesce(p_limit, 40), now())
  on conflict (gym_id) do update
    set allowed = excluded.allowed, daily_limit = coalesce(p_limit, public.ai_settings.daily_limit), updated_at = now();
  insert into public.audit_log (actor, gym_id, action, detail)
  values ((select auth.uid()), p_gym, 'ai_super_set', jsonb_build_object('allowed', coalesce(p_allowed, false), 'limit', p_limit));
end
$$;

-- switches, today's use and the number of open proposals. The owner sees the own gym; the super admin names one.
create or replace function public.ai_status(p_gym uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  g uuid := coalesce(p_gym, private.my_gym());
  st record;
  used integer;
begin
  if (select auth.uid()) is null or g is null or not (private.is_super() or private.is_admin_of(g)) then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into st from public.ai_settings where gym_id = g;
  select n into used from public.ai_usage where gym_id = g and day = (now() at time zone 'Asia/Kolkata')::date;
  return jsonb_build_object(
    'enabled', coalesce(st.enabled, false), 'allowed', coalesce(st.allowed, false), 'limit', coalesce(st.daily_limit, 40),
    'used', coalesce(used, 0),
    'open', (select count(*) from public.ai_actions where gym_id = g and status = 'proposed'));
end
$$;

-- one run: checks who asks and the switches, takes one unit of today's cap atomically, and returns the snapshot the model may see.
-- The snapshot has first names, ids, counts and dates only: no phone numbers, no notes, no free text from leads.
create or replace function public.ai_begin()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  g uuid := private.my_gym();
  st record;
  today date := (now() at time zone 'Asia/Kolkata')::date;
  used integer;
  open_n integer;
  slots integer;
  gname text;
  c_exp jsonb; c_due jsonb; c_idle jsonb; c_lead jsonb; head jsonb;
begin
  if uid is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then return jsonb_build_object('error', 'closed'); end if;
  select * into st from public.ai_settings where gym_id = g;
  if not found or not st.allowed then return jsonb_build_object('error', 'not_allowed'); end if;
  if not st.enabled then return jsonb_build_object('error', 'disabled'); end if;

  update public.ai_actions set status = 'expired', decided_at = now()
   where gym_id = g and status = 'proposed' and created_at < now() - interval '7 days';
  select count(*) into open_n from public.ai_actions where gym_id = g and status = 'proposed';
  slots := greatest(0, 30 - open_n);
  if slots = 0 then return jsonb_build_object('error', 'full', 'open', open_n); end if;

  insert into public.ai_usage (gym_id, day, n) values (g, today, 1)
  on conflict (gym_id, day) do update set n = public.ai_usage.n + 1 where public.ai_usage.n < st.daily_limit
  returning n into used;
  if used is null then return jsonb_build_object('error', 'limit', 'limit', st.daily_limit); end if;

  select left(name, 60) into gname from public.gyms where id = g;

  -- plan ends in the next 5 days or ended in the last 7
  select coalesce(jsonb_agg(to_jsonb(x) order by x.days_left), '[]'::jsonb) into c_exp from (
    select m.id as member_id, private.ai_txt(split_part(btrim(m.name), ' ', 1), 20) as first_name, (m.end_date - today) as days_left
      from public.members m
     where m.gym_id = g and m.status not in ('Cancelled', 'Frozen') and not coalesce(m.wa_opt_out, false)
       and m.end_date between today - 7 and today + 5 and private.indian_mobile(m.phone) is not null
       and not exists (select 1 from public.ai_actions a where a.gym_id = g and a.kind = 'message' and a.member_id = m.id
                        and (a.status = 'proposed' or a.decided_at > now() - interval '3 days'))
     order by m.end_date limit 15) x;

  -- an unpaid balance past its due date (EMI invoices stay with the EMI flow); one row per member, the oldest invoice
  select coalesce(jsonb_agg(to_jsonb(y) order by y.days_late desc), '[]'::jsonb) into c_due from (
    select * from (
      select distinct on (m.id) m.id as member_id, private.ai_txt(split_part(btrim(m.name), ' ', 1), 20) as first_name,
             round(v.bal, 0) as amount, (today - v.due) as days_late
        from (select i.*, i.total - coalesce((select sum(p.amount) from public.payments p where p.invoice_id = i.id), 0) as bal
                from public.invoices i where i.gym_id = g and not i.cancelled and i.due is not null and i.due < today) v
        join public.members m on m.id = v.member_id and m.gym_id = g
       where v.bal > 0.005 and m.status <> 'Cancelled' and not coalesce(m.wa_opt_out, false) and private.indian_mobile(m.phone) is not null
         and not exists (select 1 from public.emi_plans e where e.invoice_id = v.id and e.status = 'active')
         and not exists (select 1 from public.ai_actions a where a.gym_id = g and a.kind = 'message' and a.member_id = m.id
                          and (a.status = 'proposed' or a.decided_at > now() - interval '3 days'))
       order by m.id, v.due) d
     order by d.days_late desc limit 10) y;

  -- running plan but no visit for 10 days (members who joined in the last 14 days are left alone)
  select coalesce(jsonb_agg(to_jsonb(z) order by z.days_away desc nulls first), '[]'::jsonb) into c_idle from (
    select m.id as member_id, private.ai_txt(split_part(btrim(m.name), ' ', 1), 20) as first_name,
           (today - (select max((vi.in_at at time zone 'Asia/Kolkata')::date) from public.visits vi where vi.member_id = m.id)) as days_away
      from public.members m
     where m.gym_id = g and m.status not in ('Cancelled', 'Frozen') and not coalesce(m.wa_opt_out, false)
       and m.end_date >= today and m.joined_on <= today - 14 and private.indian_mobile(m.phone) is not null
       and not exists (select 1 from public.visits vi where vi.member_id = m.id and vi.in_at >= now() - interval '10 days')
       and not exists (select 1 from public.ai_actions a where a.gym_id = g and a.kind = 'message' and a.member_id = m.id
                        and (a.status = 'proposed' or a.decided_at > now() - interval '3 days'))
     order by days_away desc nulls first limit 10) z;

  -- open leads that are due, or idle for 3 days. Name, stage, source and dates only: the note and interest text are never shared.
  select coalesce(jsonb_agg(to_jsonb(w) order by w.follow_up_on nulls last), '[]'::jsonb) into c_lead from (
    select l.id as lead_id, private.ai_txt(split_part(btrim(l.name), ' ', 1), 20) as first_name, l.stage, l.source, l.follow_up_on,
           greatest(0, today - (l.updated_at at time zone 'Asia/Kolkata')::date) as idle_days
      from public.leads l
     where l.gym_id = g and l.stage in ('New', 'Contacted', 'Trial') and l.converted_member_id is null and private.indian_mobile(l.phone) is not null
       and ((l.follow_up_on is not null and l.follow_up_on <= today) or (l.follow_up_on is null and l.updated_at < now() - interval '3 days'))
       and not exists (select 1 from public.ai_actions a where a.gym_id = g and a.kind = 'message' and a.lead_id = l.id
                        and (a.status = 'proposed' or a.decided_at > now() - interval '3 days'))
     order by l.follow_up_on nulls last, l.updated_at limit 10) w;

  head := jsonb_build_object(
    'active_members', (select count(*) from public.members where gym_id = g and status not in ('Cancelled', 'Frozen') and end_date >= today),
    'expiring_7d', (select count(*) from public.members where gym_id = g and status not in ('Cancelled', 'Frozen') and end_date between today and today + 7),
    'open_leads', (select count(*) from public.leads where gym_id = g and stage in ('New', 'Contacted', 'Trial') and converted_member_id is null));

  -- nothing to suggest: give today's unit back, no model call is needed
  if jsonb_array_length(c_exp) + jsonb_array_length(c_due) + jsonb_array_length(c_idle) + jsonb_array_length(c_lead) = 0 then
    update public.ai_usage set n = greatest(n - 1, 0) where gym_id = g and day = today;
    return jsonb_build_object('ok', true, 'empty', true, 'gym_id', g, 'headline', head);
  end if;

  return jsonb_build_object('ok', true, 'empty', false, 'gym_id', g, 'gym_name', coalesce(gname, ''), 'today', today,
    'remaining', st.daily_limit - used, 'limit', st.daily_limit, 'open_slots', slots, 'headline', head,
    'candidates', jsonb_build_object('expiring', c_exp, 'dues', c_due, 'inactive', c_idle, 'leads', c_lead));
end
$$;

-- the Edge Function gives a unit back when the model could not answer (service role only)
create or replace function public.ai_refund(p_gym uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ai_usage set n = greatest(n - 1, 0) where gym_id = p_gym and day = (now() at time zone 'Asia/Kolkata')::date;
end
$$;

-- store what the model proposed. Every item is checked again here; bad items are skipped, never stored.
-- p = {"items": [{kind, member_id | lead_id, title, body, reason, priority, due_on}, ...]}, at most 10 per call, at most 30 open per gym.
create or replace function public.ai_propose(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  g uuid := private.my_gym();
  today date := (now() at time zone 'Asia/Kolkata')::date;
  it jsonb;
  k text; mid uuid; lid uuid; ttl text; bdy text; rsn text; pri text; due date; dk text;
  m record; l record;
  n_add integer := 0; n_skip integer := 0; open_n integer; rc integer;
begin
  if uid is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  if not exists (select 1 from public.ai_settings where gym_id = g and enabled and allowed) then raise exception 'AI is off'; end if;
  if p is null or jsonb_typeof(p) <> 'object' or jsonb_typeof(p -> 'items') is distinct from 'array' then raise exception 'items required'; end if;
  if jsonb_array_length(p -> 'items') > 10 then raise exception 'at most 10 items'; end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_propose:' || g::text, 0));
  select count(*) into open_n from public.ai_actions where gym_id = g and status = 'proposed';

  for it in select e from jsonb_array_elements(p -> 'items') e loop
    begin
      if open_n >= 30 or jsonb_typeof(it) <> 'object' then n_skip := n_skip + 1; continue; end if;
      k := it ->> 'kind';
      if k is null or k not in ('message', 'task') then n_skip := n_skip + 1; continue; end if;
      ttl := private.ai_txt(it ->> 'title', 120);
      bdy := private.ai_txt(it ->> 'body', case k when 'message' then 1000 else 500 end, true);
      rsn := private.ai_txt(it ->> 'reason', 300);
      pri := coalesce(nullif(it ->> 'priority', ''), 'Medium');
      if char_length(ttl) < 1 or pri not in ('Low', 'Medium', 'High') then n_skip := n_skip + 1; continue; end if;
      due := nullif(it ->> 'due_on', '')::date;
      if due is not null and (due < today or due > today + 60) then due := null; end if;
      mid := nullif(it ->> 'member_id', '')::uuid;
      lid := nullif(it ->> 'lead_id', '')::uuid;
      if mid is not null and lid is not null then n_skip := n_skip + 1; continue; end if;

      if k = 'message' then
        -- exactly one recipient, real text, and no links (a link in a model-written message is how data leaves or a scam gets in)
        if (mid is null) = (lid is null) or char_length(bdy) < 1 or bdy ~* '(https?:|www\.|\w\.(com|in|co|me|ly|xyz|net|org)\M)' then n_skip := n_skip + 1; continue; end if;
      end if;

      if mid is not null then
        select * into m from public.members where id = mid and gym_id = g;
        if not found then n_skip := n_skip + 1; continue; end if;
        if k = 'message' and (coalesce(m.wa_opt_out, false) or m.status = 'Cancelled' or private.indian_mobile(m.phone) is null) then n_skip := n_skip + 1; continue; end if;
      end if;
      if lid is not null then
        select * into l from public.leads where id = lid and gym_id = g;
        if not found then n_skip := n_skip + 1; continue; end if;
        if k = 'message' and (l.stage in ('Converted', 'Lost') or l.converted_member_id is not null or private.indian_mobile(l.phone) is null) then n_skip := n_skip + 1; continue; end if;
      end if;

      -- the same person is not proposed twice, and not again for 3 days after the owner decided
      if (mid is not null or lid is not null) and exists (
           select 1 from public.ai_actions a
            where a.gym_id = g and a.kind = k and a.member_id is not distinct from mid and a.lead_id is not distinct from lid
              and (a.status = 'proposed' or a.decided_at > now() - interval '3 days')) then
        n_skip := n_skip + 1; continue;
      end if;

      dk := left(k || ':' || coalesce(mid::text, lid::text, left(md5(lower(ttl)), 16)), 80);
      insert into public.ai_actions (gym_id, kind, member_id, lead_id, title, body, reason, priority, due_on, dedupe_key, created_by)
      values (g, k, mid, lid, ttl, bdy, rsn, pri, due, dk, uid)
      on conflict (gym_id, dedupe_key) where status = 'proposed' do nothing;
      get diagnostics rc = row_count;
      if rc = 1 then n_add := n_add + 1; open_n := open_n + 1; else n_skip := n_skip + 1; end if;
    exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow or check_violation or string_data_right_truncation then
      n_skip := n_skip + 1;     -- a malformed id or date skips that one item only
    end;
  end loop;

  insert into public.audit_log (actor, gym_id, action, detail)
  values (uid, g, 'ai_propose', jsonb_build_object('added', n_add, 'skipped', n_skip));
  return jsonb_build_object('added', n_add, 'skipped', n_skip, 'open', open_n);
end
$$;

-- the owner's list: open proposals, or the decided ones ('history'). The recipient's name comes from the member or lead row; the phone number never does.
create or replace function public.ai_inbox(p_which text default 'proposed')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym(); r jsonb;
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_which not in ('proposed', 'history') then raise exception 'which must be proposed or history'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'kind', a.kind, 'status', a.status, 'title', a.title, 'body', a.body, 'final_body', a.final_body, 'reason', a.reason,
           'priority', a.priority, 'due_on', a.due_on, 'created_at', a.created_at, 'decided_at', a.decided_at,
           'member_id', a.member_id, 'lead_id', a.lead_id, 'name', coalesce(m.name, l.name)) order by a.created_at desc), '[]'::jsonb)
    into r
    from (select * from public.ai_actions
           where gym_id = g and case when p_which = 'proposed' then status = 'proposed' else status <> 'proposed' end
           order by created_at desc limit 50) a
    left join public.members m on m.id = a.member_id and m.gym_id = g
    left join public.leads l on l.id = a.lead_id and l.gym_id = g;
  return r;
end
$$;

-- the owner decides. Approving a task adds it to the task list. Approving a message returns the text (the owner may edit it)
-- and the number, so the owner's own WhatsApp opens; nothing is sent from here.
create or replace function public.ai_decide(p_id uuid, p_decision text, p_body text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  g uuid := private.my_gym();
  a record; m record; l record;
  txt text; ph text; nm text; tid uuid;
begin
  if uid is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  if p_decision is null or p_decision not in ('approve', 'reject') then raise exception 'decision must be approve or reject'; end if;

  select * into a from public.ai_actions where id = p_id and gym_id = g for update;
  if not found then raise exception 'action not found'; end if;
  if a.status <> 'proposed' then raise exception 'action already decided'; end if;

  if p_decision = 'reject' then
    update public.ai_actions set status = 'rejected', decided_by = uid, decided_at = now() where id = a.id;
    insert into public.audit_log (actor, gym_id, action, detail)
    values (uid, g, 'ai_decide', jsonb_build_object('id', a.id, 'kind', a.kind, 'decision', 'reject'));
    return jsonb_build_object('ok', true, 'status', 'rejected', 'kind', a.kind);
  end if;

  if a.kind = 'task' then
    insert into public.gym_tasks (gym_id, title, note, priority, due_on, created_by)
    values (g, btrim(a.title), nullif(btrim(a.body), ''), a.priority, a.due_on, uid)
    returning id into tid;
    update public.ai_actions set status = 'approved', decided_by = uid, decided_at = now() where id = a.id;
    insert into public.audit_log (actor, gym_id, action, detail)
    values (uid, g, 'ai_decide', jsonb_build_object('id', a.id, 'kind', 'task', 'decision', 'approve', 'task_id', tid));
    return jsonb_build_object('ok', true, 'status', 'approved', 'kind', 'task', 'task_id', tid);
  end if;

  txt := private.ai_txt(coalesce(p_body, a.body), 1000, true);
  if char_length(txt) < 1 then raise exception 'message is empty'; end if;
  if a.member_id is not null then
    select * into m from public.members where id = a.member_id and gym_id = g;
    if not found then raise exception 'member not found'; end if;
    if coalesce(m.wa_opt_out, false) then raise exception 'member has opted out of WhatsApp'; end if;
    ph := private.indian_mobile(m.phone); nm := m.name;
  else
    select * into l from public.leads where id = a.lead_id and gym_id = g;
    if not found then raise exception 'lead not found'; end if;
    ph := private.indian_mobile(l.phone); nm := l.name;
  end if;
  if ph is null then raise exception 'phone number is not valid'; end if;

  update public.ai_actions set status = 'approved', final_body = txt, decided_by = uid, decided_at = now() where id = a.id;
  insert into public.audit_log (actor, gym_id, action, detail)
  values (uid, g, 'ai_decide', jsonb_build_object('id', a.id, 'kind', 'message', 'decision', 'approve', 'edited', txt is distinct from a.body));
  return jsonb_build_object('ok', true, 'status', 'approved', 'kind', 'message', 'text', txt, 'phone', '91' || ph, 'name', nm,
                            'member_id', a.member_id, 'lead_id', a.lead_id);
end
$$;

-- housekeeping: proposals nobody decided for 7 days expire, decided rows go after 90 days, counters after 60
create or replace function private.ai_daily_job()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.ai_actions set status = 'expired', decided_at = now() where status = 'proposed' and created_at < now() - interval '7 days';
  delete from public.ai_actions where status <> 'proposed' and coalesce(decided_at, created_at) < now() - interval '90 days';
  delete from public.ai_usage where day < (now() at time zone 'Asia/Kolkata')::date - 60;
end
$$;

revoke all on function private.ai_txt(text, integer, boolean), private.ai_daily_job() from public, anon, authenticated;
grant execute on function private.ai_txt(text, integer, boolean), private.ai_daily_job() to service_role;
revoke all on function public.ai_set_settings(boolean), public.ai_super_set(uuid, boolean, integer), public.ai_status(uuid), public.ai_begin(),
  public.ai_propose(jsonb), public.ai_inbox(text), public.ai_decide(uuid, text, text) from public, anon;
grant execute on function public.ai_set_settings(boolean), public.ai_super_set(uuid, boolean, integer), public.ai_status(uuid), public.ai_begin(),
  public.ai_propose(jsonb), public.ai_inbox(text), public.ai_decide(uuid, text, text) to authenticated, service_role;
revoke all on function public.ai_refund(uuid) from public, anon, authenticated;
grant execute on function public.ai_refund(uuid) to service_role;

-- 09:10 IST. Skipped where pg_cron is not installed (a scratch database); the live project has it.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    perform cron.schedule('ai-daily', '40 3 * * *', 'select private.ai_daily_job()');
  end if;
end
$$;
