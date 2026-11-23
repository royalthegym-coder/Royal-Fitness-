-- Gym registration profile (21 Nov 2026): owner email, Google location, logo and the owner's digital signature.
-- Owner name, mobile and UPI already live on public.gyms. They are saved together with the new fields so one save is one change.
--   * gyms.maps_url      : a Google Maps link. Public inside the gym (members may want directions), so it lives on gyms like review_url.
--   * gym_profile        : owner_email, logo, signature. One row per gym. No direct table access except an owner read;
--                          writes go through gym_set_profile only (security definer, owner of that gym, gym must be open, audit logged).
--   * images are stored as data URLs (png / jpeg / webp only, never svg) and are re-encoded in the browser before upload.
--   * gym_branding()     : the logo and signature for the caller's own gym, for receipts. The owner email is never returned there.

alter table public.gyms add column if not exists maps_url text;
alter table public.gyms drop constraint if exists gyms_maps_url_check;
alter table public.gyms add constraint gyms_maps_url_check check (
  maps_url is null or (length(maps_url) <= 500 and maps_url ~ '^https://(www\.google\.com/maps|google\.com/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/maps|g\.page)([/?][^[:space:]]*)?$')
);

create table if not exists public.gym_profile (
  gym_id uuid primary key references public.gyms(id) on delete cascade,
  owner_email text check (owner_email is null or (length(owner_email) <= 120 and owner_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')),
  logo text check (logo is null or (length(logo) <= 200000 and logo ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$')),
  signature text check (signature is null or (length(signature) <= 150000 and signature ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$')),
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.gym_profile enable row level security;
drop policy if exists gym_profile_read on public.gym_profile;
create policy gym_profile_read on public.gym_profile for select to authenticated using (private.is_admin_of(gym_id));
revoke all on public.gym_profile from anon, authenticated;
grant select on public.gym_profile to authenticated;
grant all on public.gym_profile to service_role;

-- owner: save the registration profile. Every key is optional; a missing key leaves that value alone.
-- owner, email and phone cannot be blanked. upi, maps_url, logo and signature can be cleared with null or ''.
create or replace function public.gym_set_profile(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  g uuid := private.my_gym();
  v_owner text; v_email text; v_phone text; v_upi text; v_maps text; v_logo text; v_sig text;
  has_logo boolean := false; has_sig boolean := false;
  img_re constant text := '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$';
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'bad request' using errcode = '22023'; end if;

  if p ? 'owner' then
    v_owner := btrim(coalesce(p ->> 'owner', ''));
    if length(v_owner) < 2 or length(v_owner) > 80 then raise exception 'bad owner name' using errcode = '23514'; end if;
  end if;
  if p ? 'email' then
    v_email := lower(btrim(coalesce(p ->> 'email', '')));
    if length(v_email) > 120 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'bad email' using errcode = '23514'; end if;
  end if;
  if p ? 'phone' then
    v_phone := private.indian_mobile(p ->> 'phone');
    if v_phone is null then raise exception 'bad phone' using errcode = '23514'; end if;
  end if;
  if p ? 'upi' then
    v_upi := nullif(btrim(coalesce(p ->> 'upi', '')), '');
    if v_upi is not null and v_upi !~ '^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$' then raise exception 'bad upi' using errcode = '23514'; end if;
  end if;
  if p ? 'maps_url' then
    v_maps := nullif(btrim(coalesce(p ->> 'maps_url', '')), '');
    if v_maps is not null and not (length(v_maps) <= 500 and v_maps ~ '^https://(www\.google\.com/maps|google\.com/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl/maps|g\.page)([/?][^[:space:]]*)?$') then
      raise exception 'bad map link' using errcode = '23514';
    end if;
  end if;
  if p ? 'logo' then
    if jsonb_typeof(p -> 'logo') not in ('string', 'null') then raise exception 'bad image' using errcode = '23514'; end if;
    v_logo := nullif(p ->> 'logo', '');
    if v_logo is not null then
      if length(v_logo) > 200000 then raise exception 'image too large' using errcode = '23514'; end if;
      if v_logo !~ img_re then raise exception 'bad image' using errcode = '23514'; end if;
    end if;
    has_logo := true;
  end if;
  if p ? 'signature' then
    if jsonb_typeof(p -> 'signature') not in ('string', 'null') then raise exception 'bad image' using errcode = '23514'; end if;
    v_sig := nullif(p ->> 'signature', '');
    if v_sig is not null then
      if length(v_sig) > 150000 then raise exception 'image too large' using errcode = '23514'; end if;
      if v_sig !~ img_re then raise exception 'bad image' using errcode = '23514'; end if;
    end if;
    has_sig := true;
  end if;

  update public.gyms set
    owner_name = case when p ? 'owner' then v_owner else owner_name end,
    phone = case when p ? 'phone' then v_phone else phone end,
    upi_id = case when p ? 'upi' then v_upi else upi_id end,
    maps_url = case when p ? 'maps_url' then v_maps else maps_url end
   where id = g;
  if not found then raise exception 'gym not found'; end if;

  insert into public.gym_profile (gym_id) values (g) on conflict (gym_id) do nothing;
  update public.gym_profile set
    owner_email = case when p ? 'email' then v_email else owner_email end,
    logo = case when has_logo then v_logo else logo end,
    signature = case when has_sig then v_sig else signature end,
    updated_at = now(), updated_by = (select auth.uid())
   where gym_id = g;

  -- the log records which fields changed, never the values or the images
  insert into public.audit_log (actor, gym_id, action, detail)
  values ((select auth.uid()), g, 'update_gym_profile',
          jsonb_build_object('fields', (select coalesce(jsonb_agg(k order by k), '[]'::jsonb) from jsonb_object_keys(p) k where k in ('owner', 'email', 'phone', 'upi', 'maps_url', 'logo', 'signature'))));
end
$$;

-- owner: the stored email and both images, to fill the form
create or replace function public.gym_get_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym(); r record;
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  select owner_email, logo, signature, updated_at into r from public.gym_profile where gym_id = g;
  return jsonb_build_object('email', r.owner_email, 'logo', r.logo, 'signature', r.signature, 'updated_at', r.updated_at);
end
$$;

-- anyone signed in to this gym (owner, trainer, member): only what a receipt needs
create or replace function public.gym_branding()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym(); r record;
begin
  if (select auth.uid()) is null or g is null then return jsonb_build_object('logo', null, 'signature', null); end if;
  select logo, signature into r from public.gym_profile where gym_id = g;
  return jsonb_build_object('logo', r.logo, 'signature', r.signature);
end
$$;

revoke all on function public.gym_set_profile(jsonb), public.gym_get_profile(), public.gym_branding() from public, anon;
grant execute on function public.gym_set_profile(jsonb), public.gym_get_profile(), public.gym_branding() to authenticated, service_role;
