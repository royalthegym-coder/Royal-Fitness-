# Supabase objects added outside the main schema

- Edge function `create-account` (verify_jwt = true): a gym admin creates a trainer/member login for their OWN gym.
  Caller role and gym come from the database, never from the request. Deployed to project `ayoeevltbubkyhixqqlg`.
- SQL function `public.service_assign_profile(...)`: executable only by `service_role`; sets role/gym on the new profile and links the member.
- SQL function `public.admin_update_gym(...)`: super admin or that gym's admin; edits name/owner/phone/city/UPI only.
- Table `public.offers` (RLS: staff + gym members read, gym admin writes while the gym is open); columns `members.photo_path`, `members.reminded_on`.
- Private Storage bucket `member-photos` (max 512 KB, jpeg/png/webp); object path `<gym_id>/<member_id>.jpg`; policies limit access to that gym's staff and the member themself.
