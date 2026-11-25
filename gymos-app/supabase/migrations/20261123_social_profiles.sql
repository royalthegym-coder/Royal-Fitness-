create table if not exists public.social_profiles (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms(id) on delete cascade,
  whatsapp text,
  instagram text,
  facebook text,
  youtube text,
  videos jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint social_whatsapp_chk check (whatsapp is null or whatsapp ~ '^https://(wa\.me/([0-9]{10,15}|message/[A-Za-z0-9]{10,20})|chat\.whatsapp\.com/[A-Za-z0-9]{10,40}|whatsapp\.com/channel/[A-Za-z0-9]{10,40})$'),
  constraint social_instagram_chk check (instagram is null or instagram ~ '^https://www\.instagram\.com/[a-z0-9._]{1,30}/$'),
  constraint social_facebook_chk check (facebook is null or facebook ~ '^https://(www\.facebook\.com/(profile\.php\?id=[0-9]{5,20}|[A-Za-z0-9._%-]{1,100}(/[A-Za-z0-9._%-]{1,100}){0,2})|fb\.me/[A-Za-z0-9._-]{1,60})$'),
  constraint social_youtube_chk check (youtube is null or youtube ~ '^https://www\.youtube\.com/(@[A-Za-z0-9._-]{3,30}|channel/UC[A-Za-z0-9_-]{22}|c/[A-Za-z0-9._%-]{1,60}|user/[A-Za-z0-9._%-]{1,60})$')
);
create unique index if not exists social_profiles_gym_uq on public.social_profiles (gym_id) where gym_id is not null;
create unique index if not exists social_profiles_platform_uq on public.social_profiles ((true)) where gym_id is null;
alter table public.social_profiles enable row level security;
revoke all on public.social_profiles from anon, authenticated;
grant all on public.social_profiles to service_role;

create or replace function private.social_videos_ok(v jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(v) = 'array' and jsonb_array_length(v) <= 6
     and not exists (select 1 from jsonb_array_elements(v) e
                      where jsonb_typeof(e) <> 'object'
                         or coalesce(e ->> 'id', '') !~ '^[A-Za-z0-9_-]{11}$'
                         or jsonb_typeof(e -> 'title') is distinct from 'string'
                         or char_length(e ->> 'title') > 80)
$$;
alter table public.social_profiles drop constraint if exists social_videos_chk;
alter table public.social_profiles add constraint social_videos_chk check (private.social_videos_ok(videos));

create or replace function private.social_clean(kind text, v text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text := btrim(regexp_replace(coalesce(v, ''), '[\x01-\x1f\x7f]', '', 'g'));
  m text[];
  d text;
begin
  if s = '' then return null; end if;
  if char_length(s) > 300 then raise exception 'bad % link', kind; end if;
  if kind not in ('whatsapp', 'instagram', 'facebook', 'youtube') then raise exception 'bad request'; end if;
  /* "instagram.com/royal" without https:// is fine */
  if s !~* '^https?://' and s ~* '^(www\.|m\.)?[a-z0-9-]+\.[a-z]{2,}/' then s := 'https://' || s; end if;

  if kind = 'whatsapp' then
    if s ~ '^\+?[0-9][0-9 ()-]{8,18}$' then
      d := regexp_replace(s, '\D', '', 'g');
      if private.indian_mobile(s) is not null then return 'https://wa.me/91' || private.indian_mobile(s); end if;
      if left(s, 1) = '+' and length(d) between 8 and 15 then return 'https://wa.me/' || d; end if;
      raise exception 'bad whatsapp link';
    end if;
    m := regexp_match(s, '^https?://(?:www\.)?wa\.me/(\+?[0-9]{10,15})/?(?:[?#].*)?$', 'i');
    if m is null then m := regexp_match(s, '^https?://(?:api\.|web\.)?whatsapp\.com/send/?\?(?:[^#]*&)?phone=(\+?[0-9]{10,15})(?:[&#].*)?$', 'i'); end if;
    if m is not null then
      d := regexp_replace(m[1], '\D', '', 'g');
      if length(d) = 10 and d ~ '^[6-9]' then d := '91' || d; end if;
      return 'https://wa.me/' || d;
    end if;
    m := regexp_match(s, '^https?://(?:www\.)?wa\.me/message/([A-Za-z0-9]{10,20})/?(?:[?#].*)?$', 'i');
    if m is not null then return 'https://wa.me/message/' || m[1]; end if;
    m := regexp_match(s, '^https?://chat\.whatsapp\.com/([A-Za-z0-9]{10,40})/?(?:[?#].*)?$', 'i');
    if m is not null then return 'https://chat.whatsapp.com/' || m[1]; end if;
    m := regexp_match(s, '^https?://(?:www\.)?whatsapp\.com/channel/([A-Za-z0-9]{10,40})/?(?:[?#].*)?$', 'i');
    if m is not null then return 'https://whatsapp.com/channel/' || m[1]; end if;
    raise exception 'bad whatsapp link';

  elsif kind = 'instagram' then
    m := regexp_match(s, '^@?([A-Za-z0-9._]{1,30})$');
    if m is null then m := regexp_match(s, '^https?://(?:www\.|m\.)?(?:instagram\.com|instagr\.am)/([A-Za-z0-9._]{1,30})/?(?:[?#].*)?$', 'i'); end if;
    if m is null or lower(m[1]) in ('p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'tv', 'direct', 'about', 'legal', 'web', 'developer')
       or m[1] ~ '^\.+$' then raise exception 'bad instagram link'; end if;
    return 'https://www.instagram.com/' || lower(m[1]) || '/';

  elsif kind = 'facebook' then
    m := regexp_match(s, '^https?://(?:www\.|m\.|web\.|mbasic\.)?facebook\.com/profile\.php\?(?:[^#]*&)?id=([0-9]{5,20})(?:[&#].*)?$', 'i');
    if m is not null then return 'https://www.facebook.com/profile.php?id=' || m[1]; end if;
    m := regexp_match(s, '^https?://fb\.me/([A-Za-z0-9._-]{1,60})/?(?:[?#].*)?$', 'i');
    if m is not null then return 'https://fb.me/' || m[1]; end if;
    m := regexp_match(s, '^https?://(?:www\.|m\.|web\.|mbasic\.)?(?:facebook\.com|fb\.com)/([A-Za-z0-9._%-]{1,100}(?:/[A-Za-z0-9._%-]{1,100}){0,2})/?(?:[?#].*)?$', 'i');
    if m is null then m := regexp_match(s, '^@?([A-Za-z0-9.]{5,50})$'); end if;
    if m is null
       or lower(split_part(m[1], '/', 1)) in ('share', 'sharer', 'sharer.php', 'dialog', 'login', 'login.php', 'l.php', 'plugins', 'tr', 'permalink.php', 'photo', 'photo.php',
                                              'watch', 'reel', 'reels', 'story.php', 'profile.php', 'events', 'marketplace', 'gaming', 'help', 'policies', 'settings', 'hashtag', 'ads')
       or m[1] ~ '(^|/)\.+(/|$)' then raise exception 'bad facebook link'; end if;
    return 'https://www.facebook.com/' || m[1];

  else
    m := regexp_match(s, '^https?://(?:www\.|m\.)?youtube\.com/(@[A-Za-z0-9._-]{3,30}|channel/UC[A-Za-z0-9_-]{22}|c/[A-Za-z0-9._%-]{1,60}|user/[A-Za-z0-9._%-]{1,60})(?:/(?:videos|featured|shorts|streams|playlists|about))?/?(?:[?#].*)?$', 'i');
    if m is null then
      m := regexp_match(s, '^@?([A-Za-z0-9._-]{3,30})$');
      if m is not null then m := array['@' || m[1]]; end if;
    end if;
    if m is null then raise exception 'bad youtube link'; end if;
    return 'https://www.youtube.com/' || m[1];
  end if;
end
$$;

create or replace function private.social_video_id(v text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text := btrim(regexp_replace(coalesce(v, ''), '[\x01-\x1f\x7f]', '', 'g'));
  m text[];
begin
  if s ~ '^[A-Za-z0-9_-]{11}$' then return s; end if;
  if char_length(s) > 300 then return null; end if;
  if s !~* '^https?://' and s ~* '^(www\.|m\.)?[a-z0-9-]+\.[a-z]{2,}/' then s := 'https://' || s; end if;
  m := regexp_match(s, '^https?://(?:www\.|m\.|music\.)?youtube\.com/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})(?:[&#].*)?$', 'i');
  if m is null then m := regexp_match(s, '^https?://youtu\.be/([A-Za-z0-9_-]{11})/?(?:[?#].*)?$', 'i'); end if;
  if m is null then m := regexp_match(s, '^https?://(?:www\.|m\.)?youtube(?:-nocookie)?\.com/(?:shorts|embed|live|v)/([A-Za-z0-9_-]{11})/?(?:[?#].*)?$', 'i'); end if;
  return m[1];
end
$$;

create or replace function private.social_videos(p jsonb)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  e jsonb; vid text; ttl text; out jsonb := '[]'::jsonb;
begin
  if p is null or jsonb_typeof(p) <> 'array' then raise exception 'bad video link'; end if;
  if jsonb_array_length(p) > 12 then raise exception 'too many videos'; end if;
  for e in select x from jsonb_array_elements(p) x loop
    if jsonb_typeof(e) = 'string' then vid := private.social_video_id(e #>> '{}'); ttl := '';
    elsif jsonb_typeof(e) = 'object' then
      vid := private.social_video_id(coalesce(e ->> 'url', e ->> 'id'));
      ttl := btrim(regexp_replace(coalesce(case when jsonb_typeof(e -> 'title') = 'string' then e ->> 'title' end, ''), '[\x01-\x1f\x7f]', '', 'g'));
    else vid := null; end if;
    if vid is null then raise exception 'bad video link'; end if;
    if not exists (select 1 from jsonb_array_elements(out) o where o ->> 'id' = vid) then
      out := out || jsonb_build_array(jsonb_build_object('id', vid, 'title', left(ttl, 80)));
    end if;
  end loop;
  if jsonb_array_length(out) > 6 then raise exception 'too many videos'; end if;
  return out;
end
$$;

create or replace function private.social_txt(j jsonb, kind text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
begin
  if j is null or jsonb_typeof(j) = 'null' then return null; end if;
  if jsonb_typeof(j) <> 'string' then raise exception 'bad % link', kind; end if;
  return j #>> '{}';
end
$$;

create or replace function private.social_apply(g uuid, p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  cur record; w text; i text; f text; y text; v jsonb;
  uid uuid := (select auth.uid());
begin
  perform pg_advisory_xact_lock(hashtextextended('social:' || coalesce(g::text, 'platform'), 0));
  select * into cur from public.social_profiles where gym_id is not distinct from g;
  w := cur.whatsapp; i := cur.instagram; f := cur.facebook; y := cur.youtube; v := coalesce(cur.videos, '[]'::jsonb);
  if p ? 'whatsapp' then w := private.social_clean('whatsapp', private.social_txt(p -> 'whatsapp', 'whatsapp')); end if;
  if p ? 'instagram' then i := private.social_clean('instagram', private.social_txt(p -> 'instagram', 'instagram')); end if;
  if p ? 'facebook' then f := private.social_clean('facebook', private.social_txt(p -> 'facebook', 'facebook')); end if;
  if p ? 'youtube' then y := private.social_clean('youtube', private.social_txt(p -> 'youtube', 'youtube')); end if;
  if p ? 'videos' then v := case when jsonb_typeof(p -> 'videos') = 'null' then '[]'::jsonb else private.social_videos(p -> 'videos') end; end if;
  if cur.id is null then
    insert into public.social_profiles (gym_id, whatsapp, instagram, facebook, youtube, videos, updated_by) values (g, w, i, f, y, v, uid);
  else
    update public.social_profiles set whatsapp = w, instagram = i, facebook = f, youtube = y, videos = v, updated_at = now(), updated_by = uid where id = cur.id;
  end if;
end
$$;

create or replace function public.social_set(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare g uuid := private.my_gym();
begin
  if (select auth.uid()) is null or g is null or not private.is_admin_of(g) then raise exception 'not allowed' using errcode = '42501'; end if;
  if not private.gym_is_open(g) then raise exception 'gym is locked' using errcode = '42501'; end if;
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'bad request'; end if;
  perform private.social_apply(g, p);
  insert into public.audit_log (actor, gym_id, action, detail)
  values ((select auth.uid()), g, 'update_social',
          jsonb_build_object('fields', (select coalesce(jsonb_agg(k order by k), '[]'::jsonb) from jsonb_object_keys(p) k where k in ('whatsapp', 'instagram', 'facebook', 'youtube', 'videos'))));
end
$$;

create or replace function public.social_set_platform(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not private.is_super() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p is null or jsonb_typeof(p) <> 'object' then raise exception 'bad request'; end if;
  perform private.social_apply(null, p);
  insert into public.audit_log (actor, gym_id, action, detail)
  values ((select auth.uid()), null, 'update_social_platform',
          jsonb_build_object('fields', (select coalesce(jsonb_agg(k order by k), '[]'::jsonb) from jsonb_object_keys(p) k where k in ('whatsapp', 'instagram', 'facebook', 'youtube', 'videos'))));
end
$$;

create or replace function public.social_view(p_gym uuid default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare g uuid; a jsonb; b jsonb;
begin
  if (select auth.uid()) is null then raise exception 'not allowed' using errcode = '42501'; end if;
  if private.is_super() then g := p_gym; else g := private.my_gym(); end if;
  if g is not null then
    select jsonb_build_object('whatsapp', s.whatsapp, 'instagram', s.instagram, 'facebook', s.facebook, 'youtube', s.youtube, 'videos', s.videos, 'updated_at', s.updated_at)
      into a from public.social_profiles s where s.gym_id = g;
  end if;
  select jsonb_build_object('whatsapp', s.whatsapp, 'instagram', s.instagram, 'facebook', s.facebook, 'youtube', s.youtube, 'videos', s.videos, 'updated_at', s.updated_at)
    into b from public.social_profiles s where s.gym_id is null;
  return jsonb_build_object('gym', a, 'platform', b);
end
$$;

revoke all on function private.social_videos_ok(jsonb), private.social_clean(text, text), private.social_video_id(text), private.social_videos(jsonb), private.social_txt(jsonb, text), private.social_apply(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.social_set(jsonb), public.social_set_platform(jsonb), public.social_view(uuid) from public, anon;
grant execute on function public.social_set(jsonb), public.social_set_platform(jsonb), public.social_view(uuid) to authenticated, service_role;
