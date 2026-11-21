-- AI operator, first version (19 Nov 2026).
-- A daily rules engine that finds who the owner should call today and lists it for approval:
--   1. leads that are due for a follow-up or have been idle for N days,
--   2. members whose plan ends in the next 3 days, or ended in the last 7 days,
--   3. invoices past their due date that still have a balance (EMI invoices are left to the EMI flow).
-- It only writes proposals into operator_actions. It never sends a message and never changes a lead,
-- member or invoice. The owner opens WhatsApp or calls by hand, then marks the row Done or Skipped.
-- No model is called: every rule is plain SQL, so it costs nothing and cannot be talked into anything by lead text.

create table if not exists public.operator_settings (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  enabled boolean not null default false,
  lead_followups boolean not null default true,
  expiry_nudges boolean not null default true,
  dues_nudges boolean not null default true,
  lead_stale_days integer not null default 3 check (lead_stale_days between 1 and 14),
  updated_at timestamptz not null default now()
);
alter table public.operator_settings enable row level security;
drop policy if exists operator_settings_read on public.operator_settings;
create policy operator_settings_read on public.operator_settings for select to authenticated
  using (private.is_super() or private.is_admin_of(gym_id));
revoke all on public.operator_settings from anon, authenticated;
grant select on public.operator_settings to authenticated;
grant all on public.operator_settings to service_role;

create table if not exists public.operator_actions (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  kind text not null check (kind in ('lead_followup', 'expiry_nudge', 'dues_nudge')),
  subject_id uuid not null,                                   -- lead id, member id or invoice id; no FK, a removed subject simply stops showing
  member_id uuid references public.members(id) on delete cascade,
  detail jsonb not null default '{}'::jsonb,                  -- numbers and dates only, never free text
  status text not null default 'proposed' check (status in ('proposed', 'done', 'skipped', 'expired')),
  created_at timestamptz not null default now(),
  decided_by uuid,
  decided_at timestamptz
);
-- one open proposal per subject: a repeated scan cannot pile up duplicates, even when two run at once
create unique index if not exists operator_actions_open_uq on public.operator_actions (gym_id, kind, subject_id) where status = 'proposed';
create index if not exists operator_actions_gym_idx on public.operator_actions (gym_id, status, created_at desc);
create index if not exists operator_actions_member_idx on public.operator_actions (member_id) where member_id is not null;
alter table public.operator_actions enable row level security;
drop policy if exists operator_actions_read on public.operator_actions;
create policy operator_actions_read on public.operator_actions for select to authenticated
  using (private.is_super() or private.is_admin_of(gym_id));
revoke all on public.operator_actions from anon, authenticated;
grant select on public.operator_actions to authenticated;
grant all on public.operator_actions to service_role;

-- the rules. Returns how many new proposals were added. Does nothing for a gym that has the operator off or is locked.
create or replace function private.operator_scan_gym(g uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  s record;
  n integer := 0;
  k integer;
  today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  select * into s from public.operator_settings where gym_id = g;
  if not found or not s.enabled or not private.gym_is_open(g) then return 0; end if;

  -- a proposal nobody looked at for 14 days is stale: close it so the list stays short
  update public.operator_actions set status = 'expired', decided_at = now()
   where gym_id = g and status = 'proposed' and created_at < now() - interval '14 days';

  if s.lead_followups then
    insert into public.operator_actions (gym_id, kind, subject_id, detail)
    select l.gym_id, 'lead_followup', l.id,
           jsonb_build_object('stage', l.stage, 'follow_up_on', l.follow_up_on,
                              'idle_days', greatest(0, today - (l.updated_at at time zone 'Asia/Kolkata')::date))
      from public.leads l
     where l.gym_id = g
       and l.stage in ('New', 'Contacted', 'Trial')
       and l.converted_member_id is null
       and private.indian_mobile(l.phone) is not null
       and ((l.follow_up_on is not null and l.follow_up_on <= today)
            or (l.follow_up_on is null and l.updated_at < now() - make_interval(days => s.lead_stale_days)))
       and not exists (select 1 from public.operator_actions a
                        where a.gym_id = g and a.kind = 'lead_followup' and a.subject_id = l.id
                          and a.status in ('done', 'skipped')
                          and a.decided_at > now() - make_interval(days => s.lead_stale_days))
     order by l.follow_up_on nulls last, l.updated_at
     limit 50
    on conflict (gym_id, kind, subject_id) where status = 'proposed' do nothing;
    get diagnostics k = row_count; n := n + k;
  end if;

  if s.expiry_nudges then
    insert into public.operator_actions (gym_id, kind, subject_id, member_id, detail)
    select m.gym_id, 'expiry_nudge', m.id, m.id,
           jsonb_build_object('end_date', m.end_date, 'days_left', m.end_date - today)
      from public.members m
     where m.gym_id = g
       and m.status not in ('Cancelled', 'Frozen')
       and not coalesce(m.wa_opt_out, false)
       and m.end_date between today - 7 and today + 3
       and private.indian_mobile(m.phone) is not null
       -- one proposal per member and end date, whatever happened to it: after a renewal the end date moves on
       and not exists (select 1 from public.operator_actions a
                        where a.gym_id = g and a.kind = 'expiry_nudge' and a.subject_id = m.id
                          and a.detail ->> 'end_date' = m.end_date::text)
     order by m.end_date
     limit 50
    on conflict (gym_id, kind, subject_id) where status = 'proposed' do nothing;
    get diagnostics k = row_count; n := n + k;
  end if;

  if s.dues_nudges then
    insert into public.operator_actions (gym_id, kind, subject_id, member_id, detail)
    select v.gym_id, 'dues_nudge', v.id, v.member_id,
           jsonb_build_object('invoice_no', v.no, 'due', v.due, 'amount', round(v.bal, 2), 'days_late', today - v.due)
      from (select i.*, i.total - coalesce((select sum(p.amount) from public.payments p where p.invoice_id = i.id), 0) as bal
              from public.invoices i
             where i.gym_id = g and not i.cancelled and i.due is not null and i.due < today) v
      join public.members m on m.id = v.member_id and m.gym_id = g
     where v.bal > 0.005
       and m.status <> 'Cancelled'
       and not coalesce(m.wa_opt_out, false)
       and private.indian_mobile(m.phone) is not null
       and not exists (select 1 from public.emi_plans e where e.invoice_id = v.id and e.status = 'active')
       -- the same invoice is raised again at most once a week
       and not exists (select 1 from public.operator_actions a
                        where a.gym_id = g and a.kind = 'dues_nudge' and a.subject_id = v.id
                          and a.status in ('proposed', 'done', 'skipped')
                          and coalesce(a.decided_at, a.created_at) > now() - interval '7 days')
     order by v.due
     limit 50
    on conflict (gym_id, kind, subject_id) where status = 'proposed' do nothing;
    get diagnostics k = row_count; n := n + k;
  end if;

  return n;
end
$$;

-- owner: change the switches (the master switch starts OFF)
create or replace function public.operator_set_settings(p_enabled boolean, p_leads boolean, p_expiry boolean, p_dues boolean, p_stale integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym();
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  if p_stale is null or p_stale < 1 or p_stale > 14 then raise exception 'stale days must be 1 to 14'; end if;
  insert into public.operator_settings (gym_id, enabled, lead_followups, expiry_nudges, dues_nudges, lead_stale_days, updated_at)
  values (g, coalesce(p_enabled, false), coalesce(p_leads, true), coalesce(p_expiry, true), coalesce(p_dues, true), p_stale, now())
  on conflict (gym_id) do update
    set enabled = excluded.enabled, lead_followups = excluded.lead_followups, expiry_nudges = excluded.expiry_nudges,
        dues_nudges = excluded.dues_nudges, lead_stale_days = excluded.lead_stale_days, updated_at = now();
  insert into public.audit_log (actor, gym_id, action, detail)
  values ((select auth.uid()), g, 'operator_settings',
          jsonb_build_object('enabled', coalesce(p_enabled, false), 'leads', coalesce(p_leads, true), 'expiry', coalesce(p_expiry, true), 'dues', coalesce(p_dues, true), 'stale_days', p_stale));
end
$$;

-- owner: "scan now". The daily job does the same for every gym that has the operator on.
create or replace function public.operator_scan()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym();
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  if not exists (select 1 from public.operator_settings where gym_id = g and enabled) then raise exception 'operator is off'; end if;
  return private.operator_scan_gym(g);
end
$$;

-- owner: mark a proposal Done (they called or messaged) or Skipped
create or replace function public.operator_decide(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym(); a record;
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  if p_status not in ('done', 'skipped') then raise exception 'status must be done or skipped'; end if;
  update public.operator_actions set status = p_status, decided_by = (select auth.uid()), decided_at = now()
   where id = p_id and gym_id = g and status = 'proposed'
  returning kind, subject_id into a;
  if not found then raise exception 'action not found or already decided'; end if;
  insert into public.audit_log (actor, gym_id, action, detail)
  values ((select auth.uid()), g, 'operator_decide', jsonb_build_object('id', p_id, 'kind', a.kind, 'status', p_status));
end
$$;

create or replace function private.operator_daily_job()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare r record;
begin
  for r in select gym_id from public.operator_settings where enabled loop
    begin
      perform private.operator_scan_gym(r.gym_id);
    exception when others then
      raise warning 'operator scan failed for gym %: %', r.gym_id, sqlerrm;   -- one gym's problem must not stop the others
    end;
  end loop;
end
$$;

revoke all on function private.operator_scan_gym(uuid), private.operator_daily_job() from public, anon, authenticated;
grant execute on function private.operator_scan_gym(uuid), private.operator_daily_job() to service_role;
revoke all on function public.operator_set_settings(boolean, boolean, boolean, boolean, integer), public.operator_scan(), public.operator_decide(uuid, text) from public, anon;
grant execute on function public.operator_set_settings(boolean, boolean, boolean, boolean, integer), public.operator_scan(), public.operator_decide(uuid, text) to authenticated, service_role;

-- 08:50 IST, ten minutes before the 09:00 WhatsApp reminders
select cron.schedule('operator-daily', '20 3 * * *', 'select private.operator_daily_job()');
