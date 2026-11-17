-- Razorpay Route: each gym can have its own Razorpay linked account (an acc_ id).
-- Only that public id is stored here, never keys, bank details or KYC documents. The razorpay Edge Function moves a
-- recorded payment's money to the gym's linked account (payment amount minus Razorpay's fee) and stores the outcome on the order.
-- A gym without a linked account keeps its money in the platform's own account, as before.

alter table public.gyms add column if not exists rz_account_id text;
alter table public.gyms drop constraint if exists gyms_rz_account_id_check;
alter table public.gyms add constraint gyms_rz_account_id_check
  check (rz_account_id is null or rz_account_id ~ '^acc_[A-Za-z0-9]{6,40}$');

alter table public.online_orders add column if not exists transfer_status text;
alter table public.online_orders add column if not exists transfer_id text;
alter table public.online_orders add column if not exists transfer_amount numeric(12,2);
alter table public.online_orders add column if not exists transfer_error text;
alter table public.online_orders add column if not exists transfer_at timestamptz;
alter table public.online_orders drop constraint if exists online_orders_transfer_status_check;
alter table public.online_orders add constraint online_orders_transfer_status_check
  check (transfer_status is null or transfer_status in ('created', 'pending', 'processed', 'failed', 'reversed', 'partially_reversed'));

-- super admin links a gym's Razorpay linked account (an empty value unlinks it)
create or replace function public.set_route_account(p_gym uuid, p_account text)
returns void language plpgsql security definer set search_path = '' as $$
declare acc text := nullif(btrim(coalesce(p_account, '')), '');
begin
  if not private.is_super() then raise exception 'not allowed' using errcode = '42501'; end if;
  if not exists (select 1 from public.gyms where id = p_gym) then raise exception 'gym not found'; end if;
  if acc is not null and acc !~ '^acc_[A-Za-z0-9]{6,40}$' then raise exception 'account id must look like acc_XXXXXXXX'; end if;
  update public.gyms set rz_account_id = acc where id = p_gym;
  insert into public.audit_log (actor, gym_id, action, detail)
    values ((select auth.uid()), p_gym, 'set_route_account', jsonb_build_object('account', acc));
end $$;

-- super admin sees the state of a gym's transfers: linked account, paid orders not yet sent to it, and failed ones
create or replace function public.route_summary(p_gym uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_super() then raise exception 'not allowed' using errcode = '42501'; end if;
  return (
    select jsonb_build_object(
      'account', g.rz_account_id,
      'pending', (select count(*) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status is null),
      'pending_amount', (select coalesce(sum(o.amount), 0) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status is null),
      'failed', (select count(*) from public.online_orders o where o.gym_id = g.id and o.status = 'paid' and o.transfer_status = 'failed'),
      'online_on', coalesce((select p.enabled from public.online_pay p where p.gym_id = g.id), false)
    )
    from public.gyms g where g.id = p_gym
  );
end $$;

revoke all on function public.set_route_account(uuid, text), public.route_summary(uuid) from public, anon;
grant execute on function public.set_route_account(uuid, text), public.route_summary(uuid) to authenticated, service_role;
