# Removed or hidden in v2 (Phase 1)

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

- `legacy/server.ts` and `utils/components/NeuralLaunchAlphaConsole.tsx` contain a made-up demo HMAC string
  (`fitness_future_webhook_secure_secret_2026`). It is a placeholder, not a real key, and it is not in the built app.
- Old docs (`README.md`, `MASTER_HANDOVER_DOCUMENT.md`, `INVESTOR_PROPOSAL.md`, `infrastructure_specs.md`) describe the old stack.
