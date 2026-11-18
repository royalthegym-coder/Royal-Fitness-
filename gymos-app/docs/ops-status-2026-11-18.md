# Ops status: action-plan run, 18 Nov 2026

Scope: repo `gymos-app` (branch `gymos-app`) and production Supabase project `ayoeevltbubkyhixqqlg`.
Each item says how it was verified. "Not verified" means exactly that.

## 1. Done

| Item | Change | Verification |
|---|---|---|
| `ai-coach` v2 live (verify_jwt on) | Injury, condition and allergy text is no longer sent to the model. The model gets `on_record_health: true` plus rule 7. | Live `lib.js` read back and transcribed; byte-identical to the repo copy. 38 coach checks pass on the live copy. `index.ts` was redeployed unchanged; checked by reading, not by diff. |
| `wa-dispatch` v2 live (verify_jwt off) | Sends only while the gym is open (mirrors `private.gym_is_open`). Queued rows for a closed gym are marked `skipped` with "gym is closed: not sent". The admin test button is capped at 20 per gym per IST day. The source is now split into `index.ts` and `lib.js`. | Both files read back and identical to the repo. 12 gate checks pass. `index.ts` parses. |
| `create-account` source in repo | Copied verbatim from live v1 (verify_jwt on). Not redeployed; nothing changed. | Transcribed from the live fetch. Parses. Not byte-diffed. |
| Foreign-key indexes (17) | Migration `fk_indexes` applied to production. Repo file: `supabase/migrations/20261118_fk_indexes.sql`. | `apply_migration` returned success. Statements use `if not exists`. |
| Unit tests | `tests/wagate.test.mjs` added. | 23 of 23 unit suites pass. The Playwright e2e suite was not run in this pass; no frontend file changed. |

## 2. Decisions taken (change them if the owner disagrees)

- **Closed gym: skip, not hold.** A held row would be re-claimed on every run. `wa_claim_batch` orders by id, so held rows could starve other gyms. To reverse, delete the `gym is closed` line in `flush()`.
- **Test cap: 20 per gym per IST day.** This is my number. Change `TEST_DAILY_CAP` in `lib.js`.
- **`create-account` lock rule not changed.** It differs from the database rule. The database requires `lock_override = 'none'` and `status = 'active'`; `create-account` allows any status except `suspended`. The same gap exists in the client `gymLocked()` in `src/a-lib.js`. Both are latent: production has one gym, active and `force_unlock`. Align them in the next deploy of each.
- **23 unused indexes: not dropped.** The stats window is short and the app runs one gym. Re-check after 30 days.
- **49 `SECURITY DEFINER` RPCs callable by `authenticated`: kept.** Checked by query: `anon` has no execute, and every body references `auth.uid()` or a role helper. This is a keyword check, not a line-by-line audit.
- **`deletion_requests` and `push_config`: RLS on, no policies.** That means default deny for `anon` and `authenticated`. Intended: they are used through RPCs or the service role.

## 3. Blocked: owner or CLI needed

1. **Schema baseline.** Run `supabase db dump --linked > supabase/schema.sql` with the Supabase CLI and database access. Not possible from this sandbox.
   Measured drift on 18 Nov: 46 live base tables. The repo migrations create 5 of them (`coach_messages`, `coach_settings`, `deletion_requests`, `emi_installments`, `emi_plans`), so 41 tables have no create statement in the repo.
   The helpers `private.gym_is_open`, `private.is_admin_of`, `private.is_staff_of` and `private.is_super` are defined in no repo migration. A fresh environment cannot be rebuilt from the repo.
2. **Leaked-password protection.** Supabase dashboard, Authentication settings. Owner toggle.
3. **Git origin URL.** The remote still points at `royal-fitness-`, and push works through the redirect. Changing the remote was denied in this session. To change it: `git remote set-url origin https://github.com/royalthegym-coder/Royal-Fitness-.git`.
4. **Dependabot.** The API returned 403 from this sandbox, so the 151 alerts are unverified. The root `package.json` belongs to a separate Vite app in the same repo.
5. **Play Console and privacy page.** Application ID, app-signing SHA-256, and the `privacy.html` blanks (legal name, address, contacts, grievance officer, retention). Owner only.
6. **Live coach check.** As a member with an injury note on record, ask one coach question and confirm the answer stays general.
7. **n8n decision.** The option text is not in the notes, and GymOS does not call n8n today.

## 4. Advisor summary (18 Nov 2026)

- Security: 2 RLS-without-policy tables (intended). 49 `SECURITY DEFINER` RPCs (reviewed, section 2). Leaked-password protection off (owner).
- Performance: 17 unindexed foreign keys (fixed). 23 unused indexes (deferred).

## 5. Next steps, in order

1. Run the schema dump and commit the baseline. This is the single largest gap.
2. In the next deploy of `create-account` and of the client, align the lock rule to `private.gym_is_open`.
3. Re-run the advisors after 30 days and decide on the unused indexes.
