-- Admissions, renewals and public enquiries (18 Nov 2026).
-- 1. Admitting a member and renewing one each run as a single transaction:
--    no member without its first invoice, no invoice without its payment.
-- 2. Only the gym owner (or platform super admin) can set a plan or membership dates.
--    Trainers keep editing the other member fields.
-- 3. Anonymous visitors can add a lead only through submit_enquiry, which validates the
--    input, honours a honeypot and consent, caps the rate per gym and de-duplicates by phone.

create or replace function private.indian_mobile(p text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  d text := regexp_replace(coalesce(p, ''), '\D', '', 'g');
begin
  if length(d) = 12 and left(d, 2) = '91' then d := substr(d, 3); end if;
  if length(d) = 11 and left(d, 1) = '0' then d := substr(d, 2); end if;
  if d ~ '^[6-9][0-9]{9}$' then return d; end if;
  return null;
end
$$;

create or replace function private.members_membership_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or private.is_admin_of(new.gym_id) or private.is_super() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.plan_id is not null or new.start_date is not null or new.end_date is not null then
      raise exception 'only the gym owner can set a plan or membership dates' using errcode = '42501';
    end if;
  elsif (new.plan_id, new.start_date, new.end_date) is distinct from (old.plan_id, old.start_date, old.end_date) then
    raise exception 'only the gym owner can change a plan or membership dates' using errcode = '42501';
  end if;
  return new;
end
$$;

drop trigger if exists members_membership_guard on public.members;
create trigger members_membership_guard
  before insert or update on public.members
  for each row execute function private.members_membership_guard();

create or replace function public.admit_member(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gym uuid; v_name text; v_phone text; v_dup text; v_dob date; v_notes text;
  v_plan_id uuid; v_plan_name text; v_plan_price numeric; v_plan_months int; v_plan_gst numeric;
  v_start date := null; v_end date := null;
  v_member uuid; v_invoice uuid;
  v_sub numeric; v_disc numeric; v_base numeric; v_gst numeric; v_items jsonb;
begin
  select pr.gym_id into v_gym from public.profiles pr where pr.id = auth.uid();
  if v_gym is null then raise exception 'not signed in to a gym' using errcode = '42501'; end if;
  if not private.is_admin_of(v_gym) then raise exception 'only the gym owner can add members' using errcode = '42501'; end if;
  if not private.gym_is_open(v_gym) then raise exception 'gym is locked' using errcode = '42501'; end if;

  v_name := btrim(coalesce(p->>'name', ''));
  if char_length(v_name) < 2 or char_length(v_name) > 60 then raise exception 'name must be 2 to 60 characters'; end if;

  v_phone := private.indian_mobile(p->>'phone');
  if v_phone is null then raise exception 'enter a valid 10-digit mobile number (starts with 6 to 9)'; end if;
  select m.name into v_dup from public.members m where m.gym_id = v_gym and private.indian_mobile(m.phone) = v_phone limit 1;
  if v_dup is not null then raise exception 'phone already registered to %', v_dup; end if;

  v_dob := nullif(p->>'dob', '')::date;
  if v_dob is not null and (v_dob > (now() at time zone 'Asia/Kolkata')::date or v_dob < date '1900-01-01') then
    raise exception 'date of birth is not valid';
  end if;

  if nullif(p->>'plan_id', '') is not null then
    select pl.id, pl.name, pl.price, pl.months, coalesce(pl.gst_pct, 0)
      into v_plan_id, v_plan_name, v_plan_price, v_plan_months, v_plan_gst
      from public.plans pl
     where pl.id = (p->>'plan_id')::uuid and pl.gym_id = v_gym and pl.status = 'Active';
    if v_plan_id is null then raise exception 'that plan is not active for this gym'; end if;
    v_start := coalesce(nullif(p->>'start_date', '')::date, (now() at time zone 'Asia/Kolkata')::date);
    v_end := (v_start + make_interval(months => v_plan_months))::date - 1;
  end if;

  v_notes := nullif(btrim(coalesce(p->>'notes', '')), '');
  insert into public.members (gym_id, name, phone, gender, dob, goal, notes, plan_id, start_date, end_date,
                              referred_by, trainer_id, wa_opt_out)
  values (v_gym, v_name, v_phone, nullif(p->>'gender', ''), v_dob, nullif(p->>'goal', ''), v_notes,
          v_plan_id, v_start, v_end,
          nullif(p->>'referred_by', '')::uuid, nullif(p->>'trainer_id', '')::uuid,
          coalesce((p->>'wa_opt_out')::boolean, false))
  returning id into v_member;

  if coalesce((p->>'bill')::boolean, false) and v_plan_id is not null then
    v_sub := v_plan_price;
    v_disc := least(greatest(coalesce(nullif(p->>'discount', '')::numeric, 0), 0), v_sub);
    v_base := v_sub - v_disc;
    v_gst := round(v_base * v_plan_gst / 100, 2);
    v_items := jsonb_build_array(jsonb_build_object('label', v_plan_name || ' membership', 'amount', v_sub));
    if v_disc > 0 then
      v_items := v_items || jsonb_build_array(jsonb_build_object('label', 'Offer: ' || coalesce(nullif(p->>'offer_name', ''), 'discount'), 'amount', 0));
    end if;
    insert into public.invoices (gym_id, member_id, items, subtotal, discount, gst_pct, gst_amt, total, due)
    values (v_gym, v_member, v_items, v_sub, v_disc, v_plan_gst, v_gst, v_base + v_gst,
            (now() at time zone 'Asia/Kolkata')::date + 7)
    returning id into v_invoice;
  end if;

  return jsonb_build_object('member_id', v_member, 'invoice_id', v_invoice);
end
$$;

create or replace function public.renew_member(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gym uuid; v_mem uuid; v_status text;
  v_plan_id uuid; v_plan_name text; v_plan_price numeric; v_plan_months int; v_plan_gst numeric;
  v_start date; v_end date;
  v_sub numeric; v_disc numeric; v_base numeric; v_gst numeric; v_total numeric; v_pay numeric;
  v_items jsonb; v_invoice public.invoices%rowtype; v_pay_row public.payments%rowtype; v_payment jsonb := null;
begin
  select pr.gym_id into v_gym from public.profiles pr where pr.id = auth.uid();
  if v_gym is null then raise exception 'not signed in to a gym' using errcode = '42501'; end if;
  if not private.is_admin_of(v_gym) then raise exception 'only the gym owner can renew memberships' using errcode = '42501'; end if;
  if not private.gym_is_open(v_gym) then raise exception 'gym is locked' using errcode = '42501'; end if;

  select m.id, m.status into v_mem, v_status from public.members m
   where m.id = (p->>'member_id')::uuid and m.gym_id = v_gym;
  if v_mem is null then raise exception 'member not found in this gym'; end if;
  if v_status = 'Frozen' then raise exception 'unfreeze the member before renewing'; end if;

  v_start := nullif(p->>'start', '')::date;
  if v_start is null then raise exception 'start date is required'; end if;

  select pl.id, pl.name, pl.price, pl.months, coalesce(pl.gst_pct, 0)
    into v_plan_id, v_plan_name, v_plan_price, v_plan_months, v_plan_gst
    from public.plans pl
   where pl.id = (p->>'plan_id')::uuid and pl.gym_id = v_gym and pl.status = 'Active';
  if v_plan_id is null then raise exception 'that plan is not active for this gym'; end if;
  v_end := (v_start + make_interval(months => v_plan_months))::date - 1;

  v_sub := v_plan_price;
  v_disc := least(greatest(coalesce(nullif(p->>'discount', '')::numeric, 0), 0), v_sub);
  v_base := v_sub - v_disc;
  v_gst := round(v_base * v_plan_gst / 100, 2);
  v_total := v_base + v_gst;

  v_pay := coalesce(nullif(p->>'pay', '')::numeric, 0);
  if v_pay < 0 then raise exception 'paid amount cannot be negative'; end if;
  if v_pay > v_total then raise exception 'paid amount is more than the total %', v_total; end if;

  v_items := jsonb_build_array(jsonb_build_object('label', v_plan_name || ' membership', 'amount', v_sub));
  if v_disc > 0 then
    v_items := v_items || jsonb_build_array(jsonb_build_object('label', 'Offer: ' || coalesce(nullif(p->>'offer_name', ''), 'discount'), 'amount', 0));
  end if;

  insert into public.invoices (gym_id, member_id, items, subtotal, discount, gst_pct, gst_amt, total, due)
  values (v_gym, v_mem, v_items, v_sub, v_disc, v_plan_gst, v_gst, v_total, (now() at time zone 'Asia/Kolkata')::date + 7)
  returning * into v_invoice;

  update public.members
     set plan_id = v_plan_id, start_date = v_start, end_date = v_end, status = 'Active'
   where id = v_mem;

  if v_pay > 0 then
    insert into public.payments (gym_id, invoice_id, member_id, amount, method)
    values (v_gym, v_invoice.id, v_mem, v_pay, coalesce(nullif(p->>'method', ''), 'Cash'))
    returning * into v_pay_row;
    v_payment := to_jsonb(v_pay_row);
  end if;

  return jsonb_build_object('invoice', to_jsonb(v_invoice), 'payment', v_payment);
end
$$;

create index if not exists leads_gym_phone_idx on public.leads (gym_id, phone);

create or replace function public.enquiry_gym(p_gym uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select g.name from public.gyms g where g.id = p_gym and private.gym_is_open(p_gym);
$$;

create or replace function public.submit_enquiry(p_gym uuid, p_name text, p_phone text, p_interest text,
                                                 p_note text, p_consent boolean, p_hp text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text; v_phone text; v_interest text; v_note text; v_recent int; v_dup boolean;
begin
  -- honeypot: a bot filled the hidden field. Report success and store nothing.
  if coalesce(p_hp, '') <> '' then return jsonb_build_object('ok', true); end if;
  if not private.gym_is_open(p_gym) then raise exception 'enquiries_closed'; end if;
  if p_consent is not true then raise exception 'consent_required'; end if;

  v_name := btrim(coalesce(p_name, ''));
  if char_length(v_name) < 2 or char_length(v_name) > 80 then raise exception 'name_invalid'; end if;
  v_phone := private.indian_mobile(p_phone);
  if v_phone is null then raise exception 'phone_invalid'; end if;

  v_interest := nullif(btrim(coalesce(p_interest, '')), '');
  v_note := nullif(btrim(coalesce(p_note, '')), '');
  if char_length(coalesce(v_interest, '')) > 200 or char_length(coalesce(v_note, '')) > 500 then
    raise exception 'text_too_long';
  end if;

  select count(*) into v_recent from public.leads l
   where l.gym_id = p_gym and l.source = 'Website' and l.created_at > now() - interval '1 hour';
  if v_recent >= 30 then raise exception 'too_many_enquiries'; end if;

  select exists (select 1 from public.leads l
                  where l.gym_id = p_gym and private.indian_mobile(l.phone) = v_phone
                    and l.created_at > now() - interval '30 days') into v_dup;
  if v_dup then return jsonb_build_object('ok', true, 'duplicate', true); end if;

  insert into public.leads (gym_id, name, phone, source, stage, interest, note)
  values (p_gym, v_name, v_phone, 'Website', 'New', v_interest, v_note);
  return jsonb_build_object('ok', true);
end
$$;

revoke all on function public.admit_member(jsonb) from public, anon;
grant execute on function public.admit_member(jsonb) to authenticated;
revoke all on function public.renew_member(jsonb) from public, anon;
grant execute on function public.renew_member(jsonb) to authenticated;
revoke all on function public.enquiry_gym(uuid) from public;
grant execute on function public.enquiry_gym(uuid) to anon, authenticated;
revoke all on function public.submit_enquiry(uuid, text, text, text, text, boolean, text) from public;
grant execute on function public.submit_enquiry(uuid, text, text, text, text, boolean, text) to anon, authenticated;
