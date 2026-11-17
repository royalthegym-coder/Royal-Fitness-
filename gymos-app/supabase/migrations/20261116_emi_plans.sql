-- EMI plans: a fixed schedule of installments with fixed due dates for a fee the member already owes.
-- Money stays where it always was: invoices and payments. Installments only say how much is expected by when.
-- A payment (cash, UPI, or online through Razorpay) counts toward the earliest installment that is not yet covered.

-- 1. push reminders can carry a new kind
alter table public.push_outbox drop constraint if exists push_outbox_kind_check;
alter table public.push_outbox add constraint push_outbox_kind_check check (kind = any (array['receipt', 'expiry', 'announce', 'test', 'emi']));

-- 2. tables
create table if not exists public.emi_plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  total numeric(12,2) not null check (total > 0),
  paid_at_start numeric(12,2) not null default 0 check (paid_at_start >= 0),
  installment_count integer not null check (installment_count between 2 and 12),
  start_on date not null,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_by uuid,
  created_at timestamptz not null default now()
);
create unique index if not exists emi_plans_one_active on public.emi_plans (invoice_id) where status = 'active';
create index if not exists emi_plans_member_idx on public.emi_plans (member_id, status);

create table if not exists public.emi_installments (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.emi_plans(id) on delete cascade,
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  seq integer not null check (seq >= 1),
  due_on date not null,
  amount numeric(12,2) not null check (amount > 0),
  unique (plan_id, seq)
);

alter table public.emi_plans enable row level security;
alter table public.emi_installments enable row level security;
drop policy if exists emi_plans_read on public.emi_plans;
create policy emi_plans_read on public.emi_plans for select to authenticated
  using (private.is_admin_of(gym_id) or private.owns_member(member_id));
drop policy if exists emi_installments_read on public.emi_installments;
create policy emi_installments_read on public.emi_installments for select to authenticated
  using (private.is_admin_of(gym_id) or private.owns_member(member_id));
revoke all on public.emi_plans, public.emi_installments from anon, authenticated;
grant select on public.emi_plans, public.emi_installments to authenticated;
grant all on public.emi_plans, public.emi_installments to service_role;

-- 3. the one place that works out each installment's state (no access check: callers must check first)
create or replace function private.emi_calc(p_invoice uuid)
returns table (plan_id uuid, seq integer, due_on date, amount numeric, cum_amount numeric, paid_since numeric, state text)
language sql stable security definer set search_path = '' as $$
  with pl as (
    select e.id, e.paid_at_start from public.emi_plans e where e.invoice_id = p_invoice and e.status = 'active'
  ),
  paid as (
    select coalesce(sum(y.amount), 0) as amt from public.payments y where y.invoice_id = p_invoice
  ),
  inst as (
    select i.plan_id, i.seq, i.due_on, i.amount,
      sum(i.amount) over (partition by i.plan_id order by i.seq) as cum
    from public.emi_installments i join pl on pl.id = i.plan_id
  ),
  today as (select (now() at time zone 'Asia/Kolkata')::date as d)
  select inst.plan_id, inst.seq, inst.due_on, inst.amount, inst.cum,
    round(greatest(paid.amt - pl.paid_at_start, 0), 2),
    case
      when round(greatest(paid.amt - pl.paid_at_start, 0), 2) + 0.005 >= inst.cum then 'paid'
      when inst.due_on < today.d then 'overdue'
      when inst.due_on = today.d then 'due_today'
      else 'upcoming'
    end
  from inst cross join pl cross join paid cross join today
  order by inst.seq;
$$;
revoke all on function private.emi_calc(uuid) from public, anon, authenticated;

-- 4. what the member or the owner may see
create or replace function public.emi_schedule(p_invoice uuid)
returns table (plan_id uuid, seq integer, due_on date, amount numeric, cum_amount numeric, paid_since numeric, state text)
language plpgsql stable security definer set search_path = '' as $$
declare inv public.invoices;
begin
  select * into inv from public.invoices where id = p_invoice;
  if not found or not (private.is_admin_of(inv.gym_id) or private.owns_member(inv.member_id)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return query select c.plan_id, c.seq, c.due_on, c.amount, c.cum_amount, c.paid_since, c.state from private.emi_calc(p_invoice) c;
end $$;

-- 5. owner creates a plan on an open invoice: equal installments, the last one takes the rounding difference
create or replace function public.emi_create_plan(p_invoice uuid, p_count integer, p_start date)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); inv public.invoices; paid numeric; due numeric; pid uuid;
  base numeric; rem numeric; amt numeric; i integer; today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if uid is null then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into inv from public.invoices where id = p_invoice;
  if not found or not private.is_admin_of(inv.gym_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(inv.gym_id) then raise exception 'gym is locked'; end if;
  if inv.cancelled then raise exception 'invoice is cancelled'; end if;
  if p_count is null or p_count < 2 or p_count > 12 then raise exception 'installments must be 2 to 12'; end if;
  if p_start is null or p_start < today or p_start > today + 62 then raise exception 'first due date must be within the next 2 months'; end if;
  perform pg_advisory_xact_lock(hashtextextended('emi:' || inv.id::text, 0));
  if exists (select 1 from public.emi_plans where invoice_id = inv.id and status = 'active') then
    raise exception 'this invoice already has an active plan';
  end if;
  select coalesce(sum(y.amount), 0) into paid from public.payments y where y.invoice_id = inv.id;
  due := round(inv.total - paid, 2);
  if due < 1 then raise exception 'nothing is due on this invoice'; end if;
  insert into public.emi_plans (gym_id, invoice_id, member_id, total, paid_at_start, installment_count, start_on, created_by)
    values (inv.gym_id, inv.id, inv.member_id, due, paid, p_count, p_start, uid) returning id into pid;
  base := trunc(due / p_count, 2);
  rem := due;
  for i in 1..p_count loop
    if i < p_count then amt := base; else amt := round(rem, 2); end if;
    insert into public.emi_installments (plan_id, gym_id, member_id, seq, due_on, amount)
      values (pid, inv.gym_id, inv.member_id, i, (p_start + make_interval(months => i - 1))::date, amt);
    rem := rem - amt;
  end loop;
  insert into public.audit_log (actor, gym_id, action, detail)
    values (uid, inv.gym_id, 'emi_create', jsonb_build_object('invoice', inv.id, 'count', p_count, 'total', due));
  return pid;
end $$;

-- 6. owner cancels a plan; the invoice and its payments are untouched
create or replace function public.emi_cancel_plan(p_plan uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); pl public.emi_plans;
begin
  if uid is null then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into pl from public.emi_plans where id = p_plan;
  if not found or not private.is_admin_of(pl.gym_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(pl.gym_id) then raise exception 'gym is locked'; end if;
  if pl.status <> 'active' then raise exception 'this plan is not active'; end if;
  update public.emi_plans set status = 'cancelled' where id = pl.id;
  insert into public.audit_log (actor, gym_id, action, detail) values (uid, pl.gym_id, 'emi_cancel', jsonb_build_object('plan', pl.id));
end $$;

-- 7. online payment for the next installment only (the same online-order path as the full balance)
create or replace function public.rz_begin_part(p_invoice uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid()); inv public.invoices; m public.members; paid numeric; due numeric; part numeric; amt numeric; o public.online_orders; en boolean;
begin
  if uid is null then raise exception 'sign_in' using errcode = '28000'; end if;
  select * into inv from public.invoices where id = p_invoice;
  if not found or not (private.owns_member(inv.member_id) or private.is_admin_of(inv.gym_id)) then return jsonb_build_object('error', 'not_found'); end if;
  if not private.gym_is_open(inv.gym_id) then return jsonb_build_object('error', 'gym_closed'); end if;
  select enabled into en from public.online_pay where gym_id = inv.gym_id;
  if not coalesce(en, false) then return jsonb_build_object('error', 'not_enabled'); end if;
  if inv.cancelled then return jsonb_build_object('error', 'cancelled'); end if;
  perform pg_advisory_xact_lock(hashtextextended('rz:' || inv.id::text, 0));
  select coalesce(sum(y.amount), 0) into paid from public.payments y where y.invoice_id = inv.id;
  due := round(inv.total - paid, 2);
  if due < 1 then return jsonb_build_object('error', 'nothing_due'); end if;
  select round(c.cum_amount - c.paid_since, 2) into part from private.emi_calc(inv.id) c where c.state <> 'paid' order by c.seq limit 1;
  amt := least(due, coalesce(part, due));
  if amt < 1 then return jsonb_build_object('error', 'nothing_due'); end if;
  select * into o from public.online_orders where invoice_id = inv.id and status = 'created' and rz_link_id is not null
    and amount = amt and created_at > now() - interval '30 minutes' order by created_at desc limit 1;
  if found then return jsonb_build_object('reuse', true, 'url', o.short_url, 'order_id', o.id, 'amount', o.amount); end if;
  select * into m from public.members where id = inv.member_id;
  insert into public.online_orders (gym_id, invoice_id, member_id, amount) values (inv.gym_id, inv.id, inv.member_id, amt) returning * into o;
  return jsonb_build_object('order_id', o.id, 'amount', o.amount, 'invoice_no', inv.no, 'member_name', m.name, 'gym_id', inv.gym_id, 'part', amt < due);
end $$;

-- 8. daily reminders: 2 days before, on the day, and the day after (once each per installment)
create or replace function private.emi_daily_job()
returns void language plpgsql security definer set search_path = '' as $$
declare r record; t date := (now() at time zone 'Asia/Kolkata')::date; off integer; amt text;
begin
  for r in
    select pl.gym_id, pl.id as plan_id, m.profile_id, gy.name as gym, c.seq, c.due_on, c.amount
    from public.emi_plans pl
      join public.members m on m.id = pl.member_id
      join public.gyms gy on gy.id = pl.gym_id
      cross join lateral private.emi_calc(pl.invoice_id) c
    where pl.status = 'active' and c.plan_id = pl.id and c.state <> 'paid'
      and m.profile_id is not null and private.gym_is_open(pl.gym_id)
      and (c.due_on - t) in (2, 0, -1)
  loop
    off := r.due_on - t;
    amt := '₹' || trim(to_char(r.amount, 'FM999999990.00'));
    perform private.push_enqueue(r.gym_id, r.profile_id, 'emi', 'emi:' || r.plan_id || ':' || r.seq || ':' || off, r.gym,
      case off
        when 2 then 'किस्त ' || amt || ' 2 दिन बाद (' || to_char(r.due_on, 'DD Mon') || ') देय है।'
        when 0 then 'आज किस्त ' || amt || ' देय है। जिम में या ऐप से जमा कीजिए।'
        else 'किस्त ' || amt || ' की तारीख़ निकल चुकी है। जल्दी जमा कीजिए।'
      end,
      '/#pay');
  end loop;
  perform private.push_kick();
end $$;

select cron.schedule('push-emi-daily', '50 3 * * *', 'select private.emi_daily_job()');

-- 9. grants: owners and members call these through the app, nobody else
revoke all on function public.emi_schedule(uuid), public.emi_create_plan(uuid, integer, date), public.emi_cancel_plan(uuid), public.rz_begin_part(uuid) from public, anon;
grant execute on function public.emi_schedule(uuid), public.emi_create_plan(uuid, integer, date), public.emi_cancel_plan(uuid), public.rz_begin_part(uuid) to authenticated, service_role;
