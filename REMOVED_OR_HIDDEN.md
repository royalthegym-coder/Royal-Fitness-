# Removed or hidden in v2 (Phase 1 + Phase 2)

Simple list of what was taken out of the live app, or is still in the code but can no longer be reached.
Nothing here is deleted from git history. The old app (`app/`) is untouched.

## 1. Fake "AI" / simulated modules — hidden (unreachable)

- About **104 source files** use `Math.random()` to make up numbers (fake "AI", fake sensors, fake charts):
  Quantum, Overmind, Exosuit, Metaverse, HormonalClock, Neural*, Swarm, Self-Repair, Launch consoles, and many more.
- The v2 app starts from `lib/index.tsx` and only loads the new portals
  (Super Admin / Admin / Trainer / Member). **None of these fake modules are imported**, so they are
  **not in the built app** (`dist/`).
- Only 8 reachable files use `Math.random()`, and only for random IDs (gym id suffix, audit-log id, toast id etc.), not fake data.
- The files are still in `utils/components/` for reference. **Phase 2:** delete them for good.

## 2. Face-scan / biometric login — removed

- Old login showed a fake "face scan" progress bar, then a WebAuthn fallback, and kept a "device id" in localStorage.
- v2 login = **Firebase Auth only**: Email/Password and Google. The super admin must also use a **TOTP authenticator app**.
- No passwords are checked in the browser. No login session is kept in localStorage.
- Old files (`utils/biometrics.ts`, face-scan components) are not imported anywhere in v2.

## 3. GymRegistrationForm / GymRegistrationFlow — hidden

- Public "register your gym" form that wrote straight to the database is not reachable.
- In v2 only the super admin (royalthegym@gmail.com) creates gyms, from the Super Admin portal, and invites each gym owner.

## 4. server.ts (Express server) — moved to `legacy/server.ts`

- Not used any more. It held WhatsApp/Razorpay tokens on a Node server that cost money to host.
- Replaced by the **Cloudflare Worker** in `cloudflare-backend/` (free tier). All secrets live only there.
- `npm run dev` is now just `vite`. `npm start` is `vite preview`.
- Old code that still calls `/api/...` (e.g. `lib/whatsapp.ts` template sends) will simply fail safely; it is not used by the v2 portals.
  **Phase 2:** move any needed sends to Worker routes.

## 5. offlineSync queue (IndexedDB) — not used

- `utils/offlineSync.ts` (IndexedDB action queue + Supabase sync) is only imported by old screens.
- v2 uses Firestore's own offline cache (`persistentLocalCache`) instead. Not in the built app.

## 6. Supabase — not used

- Several conflicting Supabase schema files (`supabase*.sql`, `supabase/`) and `lib/supabase.ts` remain in the repo but
  **Supabase code is not in the built app**. v2 data lives only in **Firestore** (Spark free plan).
- **Phase 2:** delete Supabase files and the `@supabase/supabase-js` dependency.

## 7. Browser-stored API tokens — removed

- Settings no longer asks for or saves the WhatsApp token, phone number ID, or custom AI token. It shows
  **"Configured on server"** from the Worker route `GET /integrations/status`.
- Old tokens left in a browser's localStorage are deleted when Settings opens.
- BrandedApp (old screen): GitHub token, SSH private keys, Apple/Google store keys are kept in memory only and never saved to localStorage.
  Hard-coded sample service-account JSON and fake SSH private keys were removed.
- The token fragment `EAAGm0PX4ZCpsBA...` was removed from `NeuralLaunchAlphaConsole.tsx`.

## 8. Extra super-admin emails — removed

- `fitnessfuture@gmail.com`, `yoursfitnessfuture@gmail.com`, `FitnessFuture@gmail.com` removed everywhere they gave admin power
  (draft rules, docs, workflow, biometric demo).
- **Super admin = `royalthegym@gmail.com` only** (in `lib/config.ts`, `firestore.rules`, and the Worker `SUPER_ADMIN_EMAIL`).

## Known leftovers (not secrets, cleanup in Phase 2)

- ~~Demo HMAC string in `legacy/server.ts` / `NeuralLaunchAlphaConsole.tsx`~~ — **removed in Phase 2** (see 10).
- Old docs (`README.md`, `MASTER_HANDOVER_DOCUMENT.md`, `INVESTOR_PROPOSAL.md`, `infrastructure_specs.md`) describe the old stack.

---

# Phase 2 changes

## 9. Fake / unreachable modules — moved to `legacy/` (not deleted from history)

- Took the list of files the built app actually loads (Vite/Rollup module graph from `lib/index.tsx`) plus their
  type-only imports. **Every other file under `utils/`, `lib/`, `src/` (459 files) was moved to `legacy/` with the same path**,
  e.g. `utils/components/QuantumX.tsx` → `legacy/utils/components/QuantumX.tsx`.
  - 109 of them used `Math.random()` to invent numbers (fake AI, sensors, charts). None was imported by live code.
  - The rest (old screens, Supabase client, services, tests, sample images) were also unreachable.
- `legacy/` is not type-checked (`tsconfig.json` only includes `utils`, `lib`, `src`) and not in the build. Some legacy files
  import deleted files (see 10) — they are reference only, not runnable.
- `utils/components/suite/CleanMemberPortal.tsx` → `legacy/` (replaced by the new Member app; its BMI used a made-up 170 cm default height).
- `vitest.config.ts` and its tests → `legacy/` (they only tested legacy code).
- Sample service-account JSON in `legacy/.../BrandedApp.tsx` no longer contains a private-key-looking string.
- Supabase: `supabase*.sql` and `supabase/` → `legacy/supabase-sql/`; `@supabase/supabase-js` removed from `package.json`.
- Live code still uses `Math.random()` only for random ID suffixes (audit-log id, WhatsApp-log id, toast id). The gym id suffix now uses `crypto.getRandomValues`.
- `useNetworkStatus` no longer shows a made-up "latency" number.

## 10. Client-side "encryption" with a hard-coded key — deleted

- **Deleted:** `lib/security.ts`, `utils/encryption.ts`, `lib/encryption.ts`, `utils/lib/crypto.ts`, `utils/security/crypto.ts`.
  They AES-"encrypted" data in the browser with keys written in the source (`fitness-fitness-secure-key-2026`, a fixed salt, etc.)
  and signed fake JWTs — anyone could read the key from the website, so it protected nothing. None was used by live code.
- Real protection now = Firebase Auth + Firestore rules (server-side) + secrets only in the Cloudflare Worker.
- Webhook HMAC placeholder `fitness_future_webhook_secure_secret_2026` removed:
  `legacy/server.ts` now uses `WEBHOOK_HMAC_SECRET` / `N8N_WEBHOOK_SECRET` or a random per-process value (fails closed);
  `legacy/utils/components/NeuralLaunchAlphaConsole.tsx` only uses a secret the operator types in.
- `GymConfig.secretKey` ("tenant encryption key") is no longer created anywhere.

## 11. Renamed / replaced screens

- Admin landing page: the old "AI Auto Operator Dashboard" is now **AI insights** (still in the menu); the new **Dashboard**
  shows only real numbers (active members, expiring in 7 days, today's check-ins, month revenue, pending dues) with empty states.
- Menu names made plain: "Scientific Admission" → New admission, "Geometric Attendance" → Attendance,
  "AI Smart Billing" → Billing & renewals, "AI Staff" → Staff, "Smart Workouts/Diet Plans" → Workout/Diet templates, etc.
- "Gym Profile" header button opened a screen that no longer existed; it now opens Gym settings.
- Super Admin, Trainer and Member portals were rebuilt (mobile bottom navigation, dark/light/system theme).

## 12. Where data lives now (hybrid storage)

| Data | Stored in |
|---|---|
| Membership, packages, assigned plans (`plans`), payments, invoices, attendance, dues, leads, invites, trainer sessions | **Firestore** (gym needs it) |
| Member personal data — AI chat history, progress logs, progress photos, food diary | Member's **own Google Drive** hidden app folder if they turn it on (Google sign-in only); otherwise Firestore `aiChats`, `progressLogs`, `foodLogs`. Photos: Drive only. |
| What a Drive member shares with the trainer (optional) | Firestore `progressSummaries`: latest weight + date, start weight, target, goal %, entry count |
| Trainer's own AI chat about a member | Firestore `aiChats` |
