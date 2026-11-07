# Supabase objects added outside the main schema

- Owner's end-of-day summary (dashboard card, Hindi): table `daily_summaries`, function `daily_facts(g, d)` (aggregate numbers only, service role only), Edge function `daily-summary` (source in `functions/daily-summary/`, tests `node tests/summary.test.mjs`), pg_cron `daily-summary-final` at 16:30 UTC (22:00 IST). The text is built by fixed rules. If the Edge function values `AI_GATEWAY_API_KEY` and `AI_GATEWAY_MODEL` are added (and optionally `AI_GATEWAY_BASE_URL`, default `https://ai-gateway.vercel.sh/v1`, any OpenAI-compatible chat endpoint), the model may only re-word it, and its answer is discarded unless every number matches the database. Member names are never sent.
- Overpayment guard: trigger `payments_no_overpay` refuses a payment that would exceed its invoice total (the form also ignores a second Enter while a save is running).

- End-of-day summary on the owner's dashboard:
  - Table `daily_summaries` (one row per gym and day; owners read, only the Edge function writes), function `daily_facts(g, d)` (aggregate numbers only, service role), pg_cron `daily-summary-final` at 16:30 UTC (22:00 IST).
  - Edge function `daily-summary` (source in `functions/daily-summary/`). The text is built by fixed rules from the database numbers. If an AI gateway is configured it may only re-word it, and the answer is thrown away if any number differs, so the rules text is the fallback. No names or phone numbers are sent to the gateway.
  - Optional Edge function values (Supabase dashboard): `AI_GATEWAY_API_KEY` and `AI_GATEWAY_MODEL` (both needed), `AI_GATEWAY_BASE_URL` (default `https://ai-gateway.vercel.sh/v1`, any OpenAI-compatible gateway works).
- Payments can no longer exceed their invoice: trigger `payments_no_overpay` (a double Enter press had saved the same ₹2000 twice; the form also ignores a second submit while saving).

- Diet + workout plans:
  - Tables `member_fit` (body details, one row per member) and `member_plans` (kind diet/workout, status draft/published/archived). Staff of the gym read and write; a member reads only their own PUBLISHED plans; only staff can publish (RLS verified with rollback tests).
  - Edge function `generate-plan` (verify_jwt = true, runs as the caller so RLS applies; source in `functions/generate-plan/`). All numbers (BMR/TDEE, calories, macros, portions, sets, reps) come from fixed rules in `engine.js` (unit tests: `node tests/plan-engine.test.mjs`). Injuries and allergies remove unsafe exercises and foods; health conditions, allergies, under-18 members mark the draft "needs review"; pregnancy or breastfeeding is refused (refer to a doctor).
  - Optional: if the Edge function value `ANTHROPIC_API_KEY` is added in the Supabase dashboard, Claude writes only a short personal note and tips. It never changes a number. Without it everything still works.

- Automatic WhatsApp (receipt after payment, expiry reminder, due reminder):
  - Tables `wa_settings` (per-gym switches, days, template names) and `wa_log` (queue and history; unique `dedupe_key`, so a message is never queued twice); column `members.wa_opt_out`.
  - Queueing: trigger `wa_payment_receipt` on `payments`; pg_cron `wa-daily-reminders` at 03:30 UTC (09:00 IST) runs `private.wa_daily_job()`; `wa-queue-retry` pokes the sender every 5 minutes while anything is queued.
  - Sending: Edge function `wa-dispatch` (verify_jwt = false, authenticates inside) sends Meta WhatsApp Cloud API template messages. pg_cron and the trigger call it with a random shared value kept in Supabase Vault and checked through `wa_cron_ok`; the in-app buttons use the signed-in admin's session.
  - The owner must add two Edge function values in the Supabase dashboard: `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`. Until then messages stay queued (anything older than 3 days is dropped). The guide and the three template texts are on the app's WhatsApp page.

- Expenses and leads:
  - Table `expenses` (owner only, fixed categories, amount > 0) feeds the Expenses & profit page (fees collected minus expenses). Table `leads` (owner and trainers read/insert/update, only the owner deletes) feeds the Leads page: stages New, Contacted, Trial, Converted, Lost; follow-up dates; "Make member" opens the member form prefilled and marks the lead Converted only after the member is saved. Both tables are gym-scoped by RLS and stop accepting writes when the gym is locked (rollback-tested).
  - Function `admin_set_gym_timings(gym, timing_text)` and column `gyms.timings`: the owner sets opening hours in Edit gym; members see them on their page.

- Edge function `create-account` (verify_jwt = true): a gym admin creates a trainer/member login for their OWN gym.
  Caller role and gym come from the database, never from the request. Deployed to project `ayoeevltbubkyhixqqlg`.
- SQL function `public.service_assign_profile(...)`: executable only by `service_role`; sets role/gym on the new profile and links the member.
- SQL function `public.admin_update_gym(...)`: super admin or that gym's admin; edits name/owner/phone/city/UPI only.
- Table `public.offers` (RLS: staff + gym members read, gym admin writes while the gym is open); columns `members.photo_path`, `members.reminded_on`.
- Private Storage bucket `member-photos` (max 512 KB, jpeg/png/webp); object path `<gym_id>/<member_id>.jpg`; policies limit access to that gym's staff and the member themself.
