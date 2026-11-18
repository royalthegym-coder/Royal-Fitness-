-- Covering indexes for the foreign keys flagged by the Supabase performance advisor on 2026-11-18 (unindexed_foreign_keys).
-- Row-level security filters on gym_id for almost every table, so the gym_id indexes matter most as the number of gyms grows.
-- Idempotent: "if not exists" makes a re-run harmless.

create index if not exists class_bookings_gym_id_idx on public.class_bookings (gym_id);
create index if not exists emi_installments_gym_id_idx on public.emi_installments (gym_id);
create index if not exists emi_installments_member_id_idx on public.emi_installments (member_id);
create index if not exists emi_plans_gym_id_idx on public.emi_plans (gym_id);
create index if not exists expenses_created_by_idx on public.expenses (created_by);
create index if not exists gym_tasks_assigned_to_idx on public.gym_tasks (assigned_to);
create index if not exists leads_created_by_idx on public.leads (created_by);
create index if not exists member_freezes_gym_id_idx on public.member_freezes (gym_id);
create index if not exists member_meals_gym_id_idx on public.member_meals (gym_id);
create index if not exists member_sleep_gym_id_idx on public.member_sleep (gym_id);
create index if not exists member_water_gym_id_idx on public.member_water (gym_id);
create index if not exists member_workouts_gym_id_idx on public.member_workouts (gym_id);
create index if not exists online_orders_invoice_id_gym_id_idx on public.online_orders (invoice_id, gym_id);
create index if not exists online_orders_member_id_gym_id_idx on public.online_orders (member_id, gym_id);
create index if not exists push_outbox_profile_id_idx on public.push_outbox (profile_id);
create index if not exists referral_rewards_gym_id_idx on public.referral_rewards (gym_id);
create index if not exists trainer_commission_trainer_id_idx on public.trainer_commission (trainer_id);
