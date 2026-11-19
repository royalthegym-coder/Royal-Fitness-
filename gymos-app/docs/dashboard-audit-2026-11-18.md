# Dashboard audit and fix plan (18 Nov 2026)

Scope: every owner, trainer and member screen in `src/`, checked by two read-only audits and then verified against the code and the live database (project `ayoeevltbubkyhixqqlg`). Each item below says whether it is fixed, blocked, or open.

## 1. Problem breakdown

Several screens write money or membership data with separate client-side writes. A failure partway leaves a member without an invoice, or an invoice without its payment. Validation is weaker than it looks (phone numbers, duplicates, archived plans). Some edits silently change data: an offer or product switches on or off, an archived plan is cleared, live stock is overwritten. The leads screen has no way for a prospect to reach the gym, so no leads ever arrive (live `leads` table: 0 rows across all gyms).

## 2. Key variables

- Role: owner (`gym_admin`), trainer, member, platform admin (`super_admin`). Each role has different RLS and different UI.
- Gym lock state: `private.gym_is_open(gym)` in the database is the authority. The client mirror is `gymLocked()` and `CTX.locked`.
- Atomicity: a write that must succeed with its dependent write needs one database transaction (RPC), not a chain of client calls.
- Read caps: the client reads at most 5000 rows per table (`src/c1-data.js`). Totals over a larger set are silently partial.
- Phone format: Indian mobile, 10 digits starting 6 to 9. `+91`, `91` and a leading `0` are accepted and normalised.

## 3. Status

### 3a. Fixed in this change (client only, no database change)

| Area | Problem | Fix | File |
|---|---|---|---|
| Phone | 10+ digit check accepted junk; WhatsApp link broke on a leading 0 | `indMobile()` normalises and validates; `readForm` stores the clean number; `waLink` uses it | `src/a-lib.js`, `src/b-ui.js` |
| Admission form | Name had no length check | 2 to 60 characters | `src/c3-gym.js` memberForm |
| Admission form | Same phone could be added twice | Duplicate check on the phone field, with the existing member named | `src/c3-gym.js` |
| Admission form | Editing a member on an archived plan cleared the plan (silent) | Archived plan stays selectable; plan and dates are written only when they change | `src/c3-gym.js` |
| Admission form | Trainers saw plan and start-date fields | Owner-only fields | `src/c3-gym.js` |
| Admission form | First-invoice failure was silent | Explicit message telling the owner to renew to bill | `src/c3-gym.js` |
| Admission form, renewal | Writes while the gym is locked | Blocked with a message | `src/c3-gym.js` |
| Renewal | Renewing a frozen member | Refused; unfreeze first | `src/c3-gym.js` renewForm |
| Dashboard | Trainers' dashboard read owner-only invoices and payments | Owner-only reads, empty for trainers | `src/c3-gym.js` vDashboard |
| Member actions | Progress, workouts, habits and diet buttons enabled while locked | Disabled while locked | `src/c3-gym.js` memberModal |
| Offers | Editing an Off offer switched it on (boolean vs "1"/"0") | Status converted before the form opens | `src/c5-extras.js` offerForm |
| Offers | Editing an offer whose plan is archived made it apply to all plans | Archived plan stays selectable | `src/c5-extras.js` offerForm |
| Reminders | A failed "mark as sent" was silent, so staff re-sent | Error toast | `src/c5-extras.js` markReminded |
| Online payments | Summary and "needs attention" list ran on the latest 60 orders only; older ones dropped out of totals | Summary reads up to 5000 orders; the list always shows every "needs attention" order | `src/c34-onlinepay.js` |
| Online payments | Razorpay opened in the same tab too (`noopener` makes `window.open` return null) | Opens a new tab, falls back to same-tab only when popups are blocked | `src/c34-onlinepay.js` |
| Store | Editing a product overwrote stock with the cached count, undoing sales made since the form opened | If the stock field is untouched, the live count is saved | `src/c11-store.js` productForm |
| Store | Editing an Off product put it back on sale (same boolean bug) | Status converted before the form opens | `src/c11-store.js` |
| Expenses | "Salary" was offered as an expense category, but payroll already adds salary to profit, so it counted twice | Removed from the expense form (existing rows are untouched) | `src/c10-biz.js` |
| Leads | Phone check was only "10 digits"; no duplicate check | Indian mobile check; a duplicate open lead is blocked with its name | `src/c10-biz.js` leadForm |
| Leads | Edit sent every field, so a stale screen could move a lead back to an older stage | Only changed fields are sent | `src/c10-biz.js` leadForm |
| Leads | Locked gym: search redraw dropped the lock banner; saving was not blocked | Banner kept; saving blocked with a message | `src/c10-biz.js` |
| Equipment | "Serviced today" set the condition to Working, hiding "Out of order" | Only the service date is recorded | `src/c25-equipment.js` |
| Invoices | GST above 40% accepted (the plan form caps it) | Capped at 40% | `src/c4-gym2.js` |

### 3b. Blocked: waiting for owner approval (migration not applied)

Migration file: `supabase/migrations/20261118_admissions_enquiries.sql` (untracked, not committed). It was denied by the auto-mode safety check when applying to production, so the database is unchanged. The client code above does not depend on it.

What it adds, and why each part matters:

1. `private.members_membership_guard` trigger: only the owner (or a platform admin) can set a member's plan or dates. Today a trainer can change them with a direct update, because the existing trainer guard only covers trainer assignment. The UI hides the fields, but only the trigger enforces it.
2. `public.admit_member(jsonb)`: adds the member and the first invoice in one transaction. Today these are two client writes; a failure in between leaves a member with no invoice. Also re-checks the phone, the name, the lock, the plan and the discount on the server.
3. `public.renew_member(jsonb)`: invoice, membership update and payment in one transaction. Today this is three writes: a failure after the invoice leaves dues with no membership update, and a failure after that loses the payment. Also refuses a payment above the total and a frozen member.
4. `public.enquiry_gym` and `public.submit_enquiry`: the public enquiry channel. Anonymous visitors can add a lead only through `submit_enquiry`. It checks the lock, requires consent, rejects bots through a honeypot, caps 30 enquiries per gym per hour, and de-duplicates by phone for 30 days. Nothing else is writable by anonymous visitors.
5. `leads_gym_phone_idx`: index for the phone lookups above.

Once approved, the UI pieces follow (no RPC calls until then): the `?enquire=<gym id>` public form, a share link with QR on the Leads screen (`src/c17-qr.js` already renders QR codes), a "New enquiries" tile, and the memberForm and renewForm switch to the RPCs.

### 3c. Open, not changed in this pass

| Priority | Item | Where | Note |
|---|---|---|---|
| P0 | Member list, invoices, payments, leads, sales and payroll are read with fixed caps (5000 / 2000). Totals beyond the cap are silently partial | `src/c1-data.js`, `src/c10-biz.js:14`, `src/c11-store.js:8`, `src/c14-payroll.js:9` | Move totals into SQL. Check the project's PostgREST max-rows setting first (not verifiable from the repo) |
| P0 | Store sales, tasks, classes, staff, equipment and progress are not disabled while locked, and the database may not enforce the lock on each | `src/c11-store.js:28,33`, `src/c19-tasks.js:18`, `src/c16-classes.js:29`, `src/c14-payroll.js:31`, `src/c25-equipment.js:19` | Verify each RPC against `gym_is_open` in the database, then disable the buttons |
| P0 | Books CSV "NET" uses sale totals as income, so profit is overstated by the cost of goods sold | `src/c10-biz.js:36,41` | Use total minus cost for store rows, or rename the column |
| P1 | Announcements are counted per recipient and capped at 200 rows, so totals undercount | `src/c35-push.js:95` | Group by announcement in SQL |
| P1 | Attendance monthly summary drops anyone who has left, while payroll still counts their salary | `src/c32-attendance.js:20,28` | Summary over all staff with rows that month |
| P1 | Offline check-in queue halts for good on a check-out whose check-in was lost (zero rows updated) | `src/c18-scan.js:82-92` | Treat a zero-row update as dropped and continue the queue |
| P1 | Settings save runs four RPCs with no rollback | `src/c4-gym2.js:181-182` | One RPC for all fields |
| P1 | Cancelling a renewal invoice keeps the new membership dates | `src/c4-gym2.js:62-63` | Restore the previous plan and dates, or block cancelling a renewal |
| P1 | Members with no end date count as Active and can check in | `src/c1-data.js:30`, `src/c18-scan.js:152` | Show "No plan" and block check-in |
| P2 | Receipts show the current membership period, not the period paid for | `src/c6-receipt.js:39` | Store the period on the invoice |
| P2 | Offline roster has no age limit; a member renewed since the snapshot is refused | `src/c18-scan.js:58-62` | Show the snapshot time; warn when old |
| P2 | Ledger verdict stays "Verified" after new payments | `src/c4-gym2.js:111-113` | Clear the verdict on bust |
| P2 | Peak-hours total counts 00:00 to 04:59 visits that are not drawn | `src/c4-gym2.js:148,151` | Draw them or exclude them |
| P2 | Access modal puts the member's password into a WhatsApp link | `src/c4-gym2.js:206,210` | Owner decision: keep or remove |
| P2 | Import matches archived plans, but the form lists only active ones | `src/c4-gym2.js:225,234` | Include archived plans in the note |
| P2 | Stale lock state after a platform action until reload | `src/d-boot.js:26-35` | Reload context on retry and on focus |
| P2 | Member CSV exports Dues as 0 for trainers | `src/c4-gym2.js:267-268` | Hide the button for trainers |
| P2 | Super-admin audit log shows raw codes for newer actions | `src/c2-super.js:81` | Use the shared `AUDIT_TXT` map |
| P2 | Payment redirect and online orders: "Received this month" undercounts without the cap fix | Fixed above | Verify on live data |
| P3 | Frozen member's check-in button says "Renew first" | `src/c3-gym.js` vMembers | Say "Unfreeze first" |
| P3 | Workout form pre-fills weight from another exercise | `src/c27-workouts.js:31,37` | Pre-fill only the same exercise |
| P3 | Month-end plan length convention to confirm (Jan 31 start ends Feb 27) | `src/a-lib.js:23` | Confirm with the owner |
| P3 | Mid-month joiners get the full salary (no pro-rating) | `src/c14-payroll.js:20` | Confirm the policy |
| P3 | Editing a class time does not notify booked members | `src/c16-classes.js:57,70` | Notify on time change |
| P3 | Reorder list includes products with zero warning level and zero stock | `src/c31-reorder.js:9` | Filter those out |

### 3d. Not verifiable from the repo

- The base database schema is not in the repo (see `docs/ops-status-2026-11-18.md`), so RLS and triggers were checked on the live database only.
- `freeze_member`, `unfreeze_member`, `admin_grant_referral_reward`, `save_product` (verified: always writes `p_stock`) and `record_sale` live bodies are not all in the repo.
- Whether the PostgREST max-rows setting is 1000 on this project.

## 4. Verification

- `bash build.sh`: built, `node --check` passes.
- Unit suites: 24 of 24 pass (`node tests/*.mjs`).
- Browser suite (`tests/e2e.cjs`): see the run result recorded in the commit message.
- Live database checks (read-only): `leads` 0 rows; RLS policies and grants on `leads`; the `payments` triggers (`payments_no_overpay`, `payments_append_only`); the `members_trainer_guard` body (trainer reassignment only); `save_product` body.

## 5. Action plan

1. Owner: approve applying `supabase/migrations/20261118_admissions_enquiries.sql` to production (or apply it from the Supabase dashboard/CLI). The file has not been changed since it was written.
2. After approval: commit the migration; switch `memberForm` new-member save to `admit_member` and `renewForm` to `renew_member`; add the `?enquire=` page, the Leads share link with QR, and the "New enquiries" tile; add unit tests for `indMobile` and the enquiry validation rules; rerun the unit and browser suites.
3. Deploy: build, commit with attribution, push, trigger the Render deploy, confirm `live`.
4. Then the P0 open items in section 3c: SQL totals for capped reads, lock verification per RPC, the Books NET fix.
5. Owner decisions: the WhatsApp password link (3c), the month-end convention, the salary pro-rating policy.

## 6. Edge cases and risks

- Public enquiry: the gym UUID is in the link. Anyone holding the link can submit enquiries. The per-gym hourly cap (30) and the phone dedupe limit abuse, but a determined spammer can still fill that cap. Consider a per-gym kill switch if it happens.
- Trainer trigger: once applied, any trainer code path that sets plan or dates will fail with a clear message. Confirm no trainer-only RPC relies on that (the referral reward and freeze RPCs run as the owner).
- Duplicate check uses the last 10 digits. Two genuinely different people sharing one family phone number will be blocked; the owner can open the existing member and add the second person as a separate record only by using a different number.
- A member with a legacy non-Indian number cannot be saved through the form any more. Enter the local number, or confirm with the owner before changing the rule.
- Renewal and admission still use multiple client writes until the migration is applied. Until then, a network failure mid-way can still leave a partial state. The owner-facing message now says so.
