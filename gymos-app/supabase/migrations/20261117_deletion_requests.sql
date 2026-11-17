-- Member data-deletion requests (erasure).
-- A member asks from their profile; the gym owner erases the personal, fitness and health data, or rejects with a reason.
-- Financial records (invoices, payments, online orders, ledger, plan history, referral and EMI records) are kept because tax law requires it.
-- The member row is anonymised rather than deleted, so those records keep a valid member id.
-- Only RPCs touch this table: no grants to anon or authenticated, RLS on with no policies.

create table if not exists public.deletion_requests (
  id           uuid primary key default gen_random_uuid(),
  gym_id       uuid not null references public.gyms(id) on delete cascade,
  member_id    uuid not null references public.members(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,
  status       text not null default 'pending' check (status in ('pending', 'done', 'rejected')),
  requested_at timestamptz not null default now(),
  handled_at   timestamptz,
  handled_by   uuid references public.profiles(id) on delete set null,
  note         text check (note is null or char_length(note) <= 300),
  constraint deletion_handled_consistent check ((status = 'pending') = (handled_at is null))
);

-- one open request per member at a time; a rejected one can be re-filed
create unique index if not exists deletion_one_pending on public.deletion_requests (member_id) where status = 'pending';
create index if not exists deletion_requests_gym_status_idx on public.deletion_requests (gym_id, status);
create index if not exists deletion_requests_requested_by_idx on public.deletion_requests (requested_by);
create index if not exists deletion_requests_handled_by_idx on public.deletion_requests (handled_by);

alter table public.deletion_requests enable row level security;
revoke all on public.deletion_requests from anon, authenticated;

-- ---------- member side ----------

-- The signed-in member asks for their own data to be erased. Idempotent while a request is pending.
create or replace function public.member_request_deletion()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  m_id  uuid;
  m_gym uuid;
  req_id uuid;
  req_at timestamptz;
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = '42501';
  end if;
  select x.id, x.gym_id into m_id, m_gym from public.members x where x.profile_id = (select auth.uid()) limit 1;
  if m_id is null then
    raise exception 'no_member' using errcode = 'P0002';
  end if;

  select q.id, q.requested_at into req_id, req_at
    from public.deletion_requests q where q.member_id = m_id and q.status = 'pending';
  if req_id is not null then
    return jsonb_build_object('status', 'pending', 'requested_at', req_at, 'already', true);
  end if;

  insert into public.deletion_requests (gym_id, member_id, requested_by)
    values (m_gym, m_id, (select auth.uid()))
    returning id, requested_at into req_id, req_at;

  insert into public.audit_log (actor, gym_id, action, detail)
    values ((select auth.uid()), m_gym, 'deletion_request', jsonb_build_object('request_id', req_id));

  return jsonb_build_object('status', 'pending', 'requested_at', req_at, 'already', false);
end;
$$;

-- The member's latest request and its outcome, for the profile page.
create or replace function public.member_deletion_status()
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  m_id uuid;
  rec  record;
begin
  select x.id into m_id from public.members x where x.profile_id = (select auth.uid()) limit 1;
  if m_id is null then
    return jsonb_build_object('status', null, 'no_member', true);
  end if;
  select q.status, q.requested_at, q.handled_at, q.note into rec
    from public.deletion_requests q where q.member_id = m_id order by q.requested_at desc limit 1;
  if not found then
    return jsonb_build_object('status', null);
  end if;
  return jsonb_build_object('status', rec.status, 'requested_at', rec.requested_at, 'handled_at', rec.handled_at, 'note', rec.note);
end;
$$;

-- ---------- owner side (gym admin of that gym, or super admin) ----------

-- Requests for one gym, pending first, newest first. Up to 100.
create or replace function public.deletion_list(p_gym uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  result jsonb;
begin
  if not ((select private.is_super()) or private.is_admin_of(p_gym)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select coalesce(jsonb_agg(to_jsonb(x) order by x.pending_first, x.requested_at desc), '[]'::jsonb) into result
  from (
    select q.id, q.status, q.requested_at, q.handled_at, q.note,
           m.id as member_id, m.name as member_name, m.phone as member_phone, m.photo_path,
           case when q.status = 'pending' then 0 else 1 end as pending_first
      from public.deletion_requests q
      join public.members m on m.id = q.member_id
     where q.gym_id = p_gym
     order by pending_first, q.requested_at desc
     limit 100
  ) x;
  return result;
end;
$$;

-- Erase a pending request's data. The caller removes the member's photo from storage BEFORE calling this,
-- so a storage failure leaves the record untouched and retryable.
create or replace function public.deletion_complete(p_request uuid, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rq public.deletion_requests%rowtype;
  mb public.members%rowtype;
begin
  select * into rq from public.deletion_requests where id = p_request for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not ((select private.is_super()) or private.is_admin_of(rq.gym_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if rq.status <> 'pending' then
    raise exception 'not_pending' using errcode = '22023';
  end if;
  if not private.gym_is_open(rq.gym_id) then
    raise exception 'gym_locked' using errcode = '42501';
  end if;

  select * into mb from public.members where id = rq.member_id for update;

  -- fitness, health and activity data
  delete from public.member_fit      where member_id = mb.id;
  delete from public.member_progress where member_id = mb.id;
  delete from public.member_meals    where member_id = mb.id;
  delete from public.member_sleep    where member_id = mb.id;
  delete from public.member_water    where member_id = mb.id;
  delete from public.member_workouts where member_id = mb.id;
  delete from public.class_bookings  where member_id = mb.id;
  delete from public.visits          where member_id = mb.id and gym_id = mb.gym_id;

  -- messages sent to the member, and open prospect rows that became this member
  delete from public.wa_log          where member_id = mb.id;
  delete from public.leads           where converted_member_id = mb.id;

  -- the member's sign-in: its coach history and push subscriptions go, and the login is detached from the gym
  if mb.profile_id is not null then
    delete from public.coach_messages where profile_id = mb.profile_id;
    delete from public.push_outbox    where profile_id = mb.profile_id;
    delete from public.push_subs      where profile_id = mb.profile_id;
    update public.profiles
       set gym_id = null, full_name = null, phone = null, email = null
     where id = mb.profile_id and role = 'member';
  end if;

  -- anonymise the member row; financial rows keep pointing at it
  update public.members
     set name = 'Deleted member', phone = null, gender = null, dob = null, goal = null, notes = null,
         photo_path = null, trainer_id = null, trainer_name = null, referred_by = null, reminded_on = null,
         profile_id = null, wa_opt_out = true, leaderboard_opt_in = false, status = 'Cancelled'
   where id = mb.id;

  update public.deletion_requests
     set status = 'done', handled_at = now(), handled_by = (select auth.uid()),
         note = left(nullif(btrim(coalesce(p_note, '')), ''), 300)
   where id = rq.id;

  insert into public.audit_log (actor, gym_id, action, detail)
    values ((select auth.uid()), rq.gym_id, 'deletion_complete', jsonb_build_object('request_id', rq.id, 'member_id', mb.id));

  return jsonb_build_object('ok', true, 'member_id', mb.id);
end;
$$;

-- Reject a pending request. A reason is required, and the member sees it.
create or replace function public.deletion_reject(p_request uuid, p_note text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rq public.deletion_requests%rowtype;
  reason text := btrim(coalesce(p_note, ''));
begin
  if char_length(reason) < 3 or char_length(reason) > 300 then
    raise exception 'note_required' using errcode = '22023';
  end if;
  select * into rq from public.deletion_requests where id = p_request for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if not ((select private.is_super()) or private.is_admin_of(rq.gym_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if rq.status <> 'pending' then
    raise exception 'not_pending' using errcode = '22023';
  end if;

  update public.deletion_requests
     set status = 'rejected', handled_at = now(), handled_by = (select auth.uid()), note = reason
   where id = rq.id;

  insert into public.audit_log (actor, gym_id, action, detail)
    values ((select auth.uid()), rq.gym_id, 'deletion_reject', jsonb_build_object('request_id', rq.id));

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------- grants: functions only ----------
revoke execute on function public.member_request_deletion()           from public, anon;
revoke execute on function public.member_deletion_status()            from public, anon;
revoke execute on function public.deletion_list(uuid)                 from public, anon;
revoke execute on function public.deletion_complete(uuid, text)       from public, anon;
revoke execute on function public.deletion_reject(uuid, text)         from public, anon;

grant execute on function public.member_request_deletion()           to authenticated, service_role;
grant execute on function public.member_deletion_status()            to authenticated, service_role;
grant execute on function public.deletion_list(uuid)                 to authenticated, service_role;
grant execute on function public.deletion_complete(uuid, text)       to authenticated, service_role;
grant execute on function public.deletion_reject(uuid, text)         to authenticated, service_role;
