-- EMI reminders must not go out for an invoice that was cancelled. The reminder job now joins the invoice and skips cancelled ones.
-- Only the function body changes; the schedule (push-emi-daily, 03:50 UTC) is untouched.
create or replace function private.emi_daily_job()
returns void language plpgsql security definer set search_path = '' as $$
declare r record; t date := (now() at time zone 'Asia/Kolkata')::date; off integer; amt text;
begin
  for r in
    select pl.gym_id, pl.id as plan_id, m.profile_id, gy.name as gym, c.seq, c.due_on, c.amount
    from public.emi_plans pl
      join public.invoices iv on iv.id = pl.invoice_id
      join public.members m on m.id = pl.member_id
      join public.gyms gy on gy.id = pl.gym_id
      cross join lateral private.emi_calc(pl.invoice_id) c
    where pl.status = 'active' and not iv.cancelled and c.plan_id = pl.id and c.state <> 'paid'
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
