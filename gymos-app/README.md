# GymOS · Royal The Gym

Dependency-free web app (plain JS, no npm) on Supabase (Auth + Postgres with row level security).

- `src/*.js` → `bash build.sh` → `public/app.js` (also copies `index.html`). `public/` is what gets deployed.
- Only the **public publishable key** is in the code. Every permission is enforced by the database (RLS), not by the UI.
- Roles: `super_admin`, `gym_admin`, `trainer`, `member`. Expired subscription → the database blocks writes (read-only).
- Payments are sealed server-side in an HMAC-SHA256 chain; "Verify" on the Secure ledger page re-checks it.

## Deploy (Render Free static site)
Connect the repo, use `render.yaml` (rootDir `gymos-app`, publish `public`). No environment variables are needed.

## First login
1. Supabase Dashboard → Authentication → Users → add your email + password. Keep public sign-ups off.
2. Make that user `super_admin` once in the SQL editor (the app cannot do it for you); then create gyms and assign roles in the app.

## Tests
`NODE_PATH=$(npm root -g) node tests/e2e.cjs` — Playwright against a mocked Supabase (no real data touched).

## Not included (be honest)
No automatic WhatsApp sending (wa.me links open WhatsApp with a ready message), no real UPI payment verification (staff record payments), no passkeys, no offline sync.
