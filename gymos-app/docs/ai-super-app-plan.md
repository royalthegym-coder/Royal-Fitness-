# GymOS AI Super App: grounded plan

Checked on 2026-11-18 against the repo (`gymos-app`, branch `gymos-app`) and the live Supabase project `ayoeevltbubkyhixqqlg`. Anything not checked is marked **unverified**.

## 1. What exists today (verified)

- **Database (live):** 40 public tables. Relevant ones: `leads` (13 columns), `wa_log`, `wa_settings`, `audit_log`, `coach_messages`, `daily_summaries`, `push_outbox`, `online_pay`, `payment_ledger`.
- **Edge functions (live, 7):** `ai-coach` (verify_jwt on, still the old version: the lib.js change of 673576e is not deployed yet), `wa-dispatch` (live, **no source in the repo**), `push-dispatch`, `daily-summary`, `razorpay` (v3), `generate-plan`, `create-account`.
- **Leads:** a pipeline UI in `src/c10-biz.js` (stages, "follow up today", stage moves). No AI on it.
- **AI:** only two features: the member coach (`ai-coach`) and the daily summary. No agents, no tools, no write path from AI.
- **Audit:** `audit_log` exists. There is no approval queue.
- **Integrations:** Razorpay (per-gym linked accounts, Route). WhatsApp through `wa-dispatch` (the README says Meta Cloud API). Web push. No Google Business Profile. No Stripe.

## 2. Gaps and risks found

1. **Unversioned production code.** `wa-dispatch` runs live and is not in the repo. The README names it, the repo does not contain it. Fix this first: export the source and commit it with its SHA-256.
2. **Schema is not reproducible.** Live tables such as `leads` have no `create table` in `supabase/migrations`. A new environment cannot be rebuilt from the repo. Fix: capture a baseline with `supabase db dump`.
3. **Undeployed security fix.** The coach change (health text no longer sent to the model) is in the repo only. Deploy `ai-coach`.
4. **Stack mismatch.** The scope document assumes a Floot app and a VPS move. GymOS is Supabase edge functions plus a vanilla JS PWA on Render. This repo has no FastAPI, Flutter or Redis. The repo root holds a different Vite app. Confirm the target before any stack decision.
5. **Vendor claims.** The MCP 2026-07-28 spec (stateless) is real: several independent write-ups confirm it. The Google `MESSAGING_CLICKS` date (14 Oct 2026) is **unverified**. "GPT-Live" and "OpenAI HES" are **unverified** names; read the vendor docs before building on them. The image links in the scope document are not sources.
6. **Payments.** Gyms here pay through Razorpay, which is already live. Stripe would add a second payment path with little benefit for Indian gyms. Defer it unless a non-India gym needs it.
7. **WhatsApp AI replies to members.** This needs member opt-in (`wa_opt_out` exists), approved message templates, and a human handoff. An automatic AI reply to members is the highest-risk item in the plan.
8. **Prompt injection through lead text.** A lead's message can carry instructions into a model prompt. Treat all lead and member text as data, the same way `ai-coach` does.
9. **Voice agents.** Costs are per minute. Defer until usage data exists.

## 3. Decisions (defaults, unless the owner objects)

- No VPS migration now. The current stack works, and a move gives no member-facing gain.
- Razorpay stays the only payment provider.
- Every AI write goes through an approval queue. The AI never writes to a business table directly.
- The first agent is read-only.

## 4. Phases

**P0: make the base safe to build on (now)**
- [done] `wa-dispatch` source is in the repo (`supabase/functions/wa-dispatch/index.ts`), copied verbatim from the live v1. Not checked byte-for-byte: the platform's hash is a bundle hash, so there is nothing to compare against.
- [done] Mobile QA at 375px: members, check-in, leads, reminders and coach have zero sideways page scroll (e2e, 5 checks).
- [open, owner] Deploy `ai-coach` (`supabase functions deploy ai-coach`).
- [open, owner] Capture a schema baseline (`supabase db dump`) and commit it.
- [open] `create-account` shows a folder with no `index.ts`. Find its source or record that the live copy has none.
- Acceptance: every live function has source in the repo; `supabase db reset` rebuilds the database.

**Review items found while capturing `wa-dispatch` (not changed yet)**
- The cron path (`x-cron-secret`) and the admin `flush` path send queued messages without checking the gym's subscription status. A locked or suspended gym can still send templates. Decide whether that is intended.
- The admin `test` action sends a real WhatsApp message to any number the admin types. Rate limiting is not in the function. Consider a daily cap per gym.

**P1: approval and audit gate (the prerequisite for every AI write)**
- Table `ai_actions`: `id, gym_id, kind, payload jsonb, status (proposed | approved | rejected | executed | failed), proposed_by, decided_by, decided_at, executed_at, error, idempotency_key`.
- RLS: gym admins can read and decide their own gym's rows. Only the service role inserts.
- Decide through a security-definer RPC that checks `private.is_admin_of(gym)` and writes `audit_log`.
- A per-gym kill switch (`ai_enabled`) that stops the executor.
- Acceptance: a proposal cannot run without an approval; a rejected row never executes; a retry of the same key does nothing twice.

**P2: AI CRM Copilot (read-only first)**
- Lead summary, follow-up draft text, and a next-action suggestion.
- Drafts are text only. Sending stays manual through the existing wa.me flow.
- Then the first proposed write: "move lead stage" or "add note", which goes through `ai_actions`.
- Acceptance: no code path from the model to an UPDATE or INSERT on a business table.

**P3: knowledge base (defer)**
- Needs pgvector, document ingestion, strict per-gym isolation and a cost cap. Start only after P2 is in use.

**P4: automation engine (in-app first)**
- Three fixed triggers: a lead untouched for 3 days, a membership expiring, a payment due. Each produces a proposal, never a send.
- n8n only for external connectors. It holds credentials outside RLS, so treat it as privileged.

**P5: WhatsApp AI replies**
- Only after an opt-in review, Meta template approval, and a human-handoff path.

**P6: Google Business Profile**
- Start Google's app verification early. It takes weeks and needs the owner's Google account. Begin read-only (reviews).

**P7: voice agents, multi-agent, marketplace.** Defer until P1 to P4 show real use.

## 5. Owner-blocked items

- Confirm the target app and stack (see gap 4).
- Run `supabase functions deploy ai-coach`.
- Google Cloud project and OAuth verification.
- Meta business verification and WhatsApp template approval.
- Legal review of the privacy policy.

## 6. Edge cases

- A gym's data must never reach another gym's AI context. Every AI read goes through RLS as the caller, or through a server-side check on `gym_id`.
- AI cost: set a per-gym monthly cap and count tokens in `ai_actions` or a usage table.
- Model output is untrusted. Validate every proposal's payload against a schema before it is stored.
