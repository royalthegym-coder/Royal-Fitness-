-- Razorpay Route, part 2: send each recorded online payment to the gym's own linked account.
-- transfer_status states:
--   null        not sent yet (the gym has no linked account, or the webhook has not routed it yet)
--   routing     claimed by one webhook / retry; the Razorpay call is in flight, or its outcome is unknown
--   failed      Razorpay refused it (4xx): nothing was sent, a retry is safe
--   created | pending | processed | reversed | partially_reversed   Razorpay accepted it (as reported by its transfer API)
-- 'routing' that stays there means we do not know whether Razorpay created a transfer (timeout or 5xx after the request left).
-- Only a super admin may retry such an order, and only with force, after checking the Razorpay dashboard for that payment.

alter table public.online_orders drop constraint if exists online_orders_transfer_status_check;
alter table public.online_orders add constraint online_orders_transfer_status_check
  check (transfer_status is null or transfer_status in ('routing', 'created', 'pending', 'processed', 'failed', 'reversed', 'partially_reversed'));

-- Edge Function (service role only): the claim is the single guard against two transfers for one payment,
-- because the Razorpay transfer API has no idempotency key. Only a payment with no transfer state yet can be claimed.
create or replace function public.rz_route_claim(p_payment text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.online_orders; acc text;
begin
  if coalesce(p_payment, '') = '' then return jsonb_build_object('claimed', false, 'reason', 'not_found'); end if;
  select * into o from public.online_orders where rz_payment_id = p_payment and status = 'paid' for update;
  if not found then return jsonb_build_object('claimed', false, 'reason', 'not_found'); end if;
  select g.rz_account_id into acc from public.gyms g where g.id = o.gym_id;
  if acc is null then return jsonb_build_object('claimed', false, 'reason', 'no_account'); end if;
  if o.transfer_status is not null then return jsonb_build_object('claimed', false, 'reason', o.transfer_status); end if;
  update public.online_orders set transfer_status = 'routing', transfer_error = null, transfer_at = now() where id = o.id;
  return jsonb_build_object('claimed', true, 'order_id', o.id, 'account', acc, 'amount', o.amount);
end $$;

-- Edge Function (service role only): records what Razorpay answered. p_status null is not allowed; pass 'routing' to keep an unknown outcome.
create or replace function public.rz_route_result(p_order uuid, p_status text, p_transfer text, p_amount numeric, p_error text)
returns void language sql security definer set search_path = '' as $$
  update public.online_orders
     set transfer_status = p_status, transfer_id = p_transfer, transfer_amount = p_amount,
         transfer_error = left(p_error, 300), transfer_at = now()
   where id = p_order;
$$;

-- Super admin: allow one more transfer attempt for an order. Returns the Razorpay payment id so the Edge Function can route it now.
create or replace function public.route_retry_allow(p_order uuid, p_force boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare o public.online_orders;
begin
  if not private.is_super() then raise exception 'not allowed' using errcode = '42501'; end if;
  select * into o from public.online_orders where id = p_order for update;
  if not found then raise exception 'order not found'; end if;
  if o.status <> 'paid' or o.rz_payment_id is null then raise exception 'only a recorded online payment can be sent to a gym'; end if;
  if o.transfer_status in ('created', 'pending', 'processed', 'reversed', 'partially_reversed') then
    raise exception 'already sent to the gym account (%)', o.transfer_status;
  end if;
  if o.transfer_status = 'routing' and not coalesce(p_force, false) then
    raise exception 'the last transfer has no known result: check the Razorpay dashboard for this payment, then retry with force';
  end if;
  if not exists (select 1 from public.gyms g where g.id = o.gym_id and g.rz_account_id is not null) then
    raise exception 'this gym has no linked account yet';
  end if;
  update public.online_orders set transfer_status = null, transfer_error = null, transfer_at = null where id = o.id;
  insert into public.audit_log (actor, gym_id, action, detail)
    values ((select auth.uid()), o.gym_id, 'route_retry',
            jsonb_build_object('order', o.id, 'previous', o.transfer_status, 'force', coalesce(p_force, false)));
  return o.rz_payment_id;
end $$;

-- Super admin: the gym's counts for the Route panel. Money is split into: sent, not sent because there is no account yet, failed, unknown.
create or replace function public.route_summary(p_gym uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_super() then raise exception 'not allowed' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'account', g.rz_account_id,
      'sent', (select count(*) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status in ('created', 'pending', 'processed')),
      'sent_amount', (select coalesce(sum(o.transfer_amount), 0) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status in ('created', 'pending', 'processed')),
      'unrouted', (select count(*) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status is null and g.rz_account_id is not null),
      'no_account', (select count(*) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status is null and g.rz_account_id is null),
      'no_account_amount', (select coalesce(sum(o.amount), 0) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status is null and g.rz_account_id is null),
      'failed', (select count(*) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status = 'failed'),
      'routing', (select count(*) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status = 'routing'),
      'online_on', coalesce((select p.enabled from public.online_pay p where p.gym_id = g.id), false)
    )
    from public.gyms g where g.id = p_gym
  );
end $$;

-- Super admin: the orders that need a look (not sent, failed, or unknown), newest first, at most 50.
create or replace function public.route_list(p_gym uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_super() then raise exception 'not allowed' using errcode = '42501'; end if;
  return coalesce((
    select jsonb_agg(to_jsonb(r) order by r.paid_at desc nulls last)
    from (
      select o.id, o.amount, o.paid_at, o.transfer_status, o.transfer_error, o.transfer_at, m.name as member_name
        from public.online_orders o
        left join public.members m on m.id = o.member_id
       where o.gym_id = p_gym and o.status = 'paid'
         and (o.transfer_status is null or o.transfer_status in ('failed', 'routing'))
       order by o.paid_at desc nulls last
       limit 50
    ) r
  ), '[]'::jsonb);
end $$;

revoke all on function public.rz_route_claim(text), public.rz_route_result(uuid, text, text, numeric, text) from public, anon, authenticated;
grant execute on function public.rz_route_claim(text), public.rz_route_result(uuid, text, text, numeric, text) to service_role;
revoke all on function public.route_retry_allow(uuid, boolean), public.route_list(uuid), public.route_summary(uuid) from public, anon;
grant execute on function public.route_retry_allow(uuid, boolean), public.route_list(uuid), public.route_summary(uuid) to authenticated, service_role;
