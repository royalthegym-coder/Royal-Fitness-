# Fitness Future v2 — Deploy guide (owner steps)

Cost goal: **₹0**. Firebase **Spark** (free) plan + Cloudflare Workers **free** + Gemini **free tier**.
Firebase project: `project-74356317-8adc-420c-9be`. Super admin: **royalthegym@gmail.com** (only this account).

You need: Node 20+, a Google account for Firebase, a free Cloudflare account.

```bash
npm i -g firebase-tools        # Firebase CLI
firebase login                 # sign in as royalthegym@gmail.com
```

---

## 1. Firebase Auth chalu karein (Turn on sign-in)

Firebase console → **Authentication** → **Sign-in method**:

1. Enable **Email/Password**.
2. Enable **Google** (choose a support email: royalthegym@gmail.com).
3. **Settings → Authorized domains**: make sure these are listed (add if missing):
   - `localhost`
   - `project-74356317-8adc-420c-9be.web.app`
   - `project-74356317-8adc-420c-9be.firebaseapp.com`
   - your own domain later, if you add one.

Phone OTP login is **off** (Firebase now charges for SMS). Keep `VITE_ENABLE_PHONE_AUTH=false`.

## 2. Identity Platform + TOTP (2-step code for super admin)

The super admin must use an authenticator app (Google Authenticator, Microsoft Authenticator, etc.).

1. Firebase console → **Authentication** → **Settings** → **Upgrade to Firebase Authentication with Identity Platform**.
   It is free up to **3,000 daily active users** on Spark. No card needed for this tier.
2. Turn on TOTP. Firebase console has no button for this, so run once (needs `gcloud` signed in as royalthegym@gmail.com,
   or use Google Cloud Shell from the console — it is free):

```bash
curl -X PATCH "https://identitytoolkit.googleapis.com/admin/v2/projects/project-74356317-8adc-420c-9be/config?updateMask=mfa" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "X-Goog-User-Project: project-74356317-8adc-420c-9be" \
  -H "Content-Type: application/json" \
  -d '{"mfa":{"providerConfigs":[{"state":"ENABLED","totpProviderConfig":{"adjacentIntervals":5}}]}}'
```

You should get back JSON that shows `"state": "ENABLED"` under `mfa`.

## 3. Firestore database choose karein (Pick the database)

- On the free Spark plan, the free quota is for **one** database — normally the one called **`(default)`**.
- Firebase console → **Firestore Database**. If `(default)` does not exist, click **Create database** →
  location **asia-south1 (Mumbai)** → **Production mode**.
- The app uses `(default)` unless you set `VITE_FIRESTORE_DATABASE_ID`.
  The old AI Studio database (`ai-studio-…`) is **not** used by v2. Only set `VITE_FIRESTORE_DATABASE_ID` to it if the
  console shows that database as your free one.
- If you use a named database, also add `"database": "<name>"` inside the `firestore` block of `firebase.json`.

## 4. Worker (server secrets) deploy karein — Cloudflare

All tokens live **only** here. Never in the browser, never in `.env` files, never in git.

```bash
cd cloudflare-backend
npm i
npx wrangler login                     # free Cloudflare account

# Secrets (each command asks you to paste the value):
npx wrangler secret put GEMINI_API_KEY            # from https://aistudio.google.com/apikey (free tier)
npx wrangler secret put WHATSAPP_ACCESS_TOKEN     # Meta permanent system-user token (optional)
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID  # Meta phone number ID (optional)
npx wrangler secret put RAZORPAY_KEY_ID           # optional
npx wrangler secret put RAZORPAY_KEY_SECRET       # optional
```

Then open `cloudflare-backend/wrangler.toml` and check the `[vars]` (these are **not** secrets):

- `ALLOWED_ORIGINS` = the sites allowed to call the Worker, comma separated, e.g.
  `https://project-74356317-8adc-420c-9be.web.app,https://project-74356317-8adc-420c-9be.firebaseapp.com,http://localhost:3000`
- `WHATSAPP_ALLOWED_GYMS` = gym IDs allowed to send WhatsApp from your number, comma separated
  (fill this after you create gyms in step 7; empty = nobody can send).
- `SUPER_ADMIN_EMAIL` = `royalthegym@gmail.com` (leave as is).

Deploy:

```bash
npx wrangler deploy
```

It prints a URL like `https://fitness-future-api.<your-subdomain>.workers.dev`. Copy it.
Check it works: open `<that URL>/health` → should show `{"ok":true}`.

## 5. App settings (`.env.local`)

In the app folder:

```bash
cp .env.example .env.local
```

Fill in:

- `VITE_WORKER_URL=` the Worker URL from step 4 (no `/` at the end).
- `VITE_FIREBASE_*` — optional; if empty the values in `firebase-applet-config.json` are used.
  (Firebase web config is public by design; it is safe in the browser.)
- Keep `VITE_ENABLE_PHONE_AUTH=false`, `VITE_ENABLE_DEMO_SEED=false`.

Never put a token or secret key in `.env.local` — everything starting with `VITE_` goes into the public website.

## 6. Build + deploy to Firebase Hosting

```bash
npm i
npm run build                 # creates dist/
firebase use project-74356317-8adc-420c-9be
firebase deploy --only firestore:rules,firestore:indexes,hosting
```

Indexes take a few minutes to build. The site will be at `https://project-74356317-8adc-420c-9be.web.app`.

## 7. First sign-in (Pehli baar login)

1. Open the site. Sign in with **Google** as **royalthegym@gmail.com** (or Email/Password with that email, then verify the email).
2. The app asks you to **enroll TOTP**: scan the QR code with your authenticator app and type the 6-digit code.
3. Sign out and sign in again, this time entering the 6-digit code. Now you are fully super admin.
4. In the **Super Admin** portal: **create your gyms** (e.g. Royal The Gym, Jhunjhunu) and invite each gym owner by email.
5. Put the gym IDs that may send WhatsApp into `WHATSAPP_ALLOWED_GYMS` (step 4) and run `npx wrangler deploy` again.
6. Gym owners (admins) sign in, then invite trainers and members from **Access** in the Admin portal.

## 8. Check everything (Jaanch)

- Admin → **WhatsApp** page says WhatsApp is connected (if you set the WhatsApp secrets and the gym is in `WHATSAPP_ALLOWED_GYMS`).
- Admin → **Reviews** page reads integration status from the Worker (`/integrations/status`) — it shows what is configured on the server.
- A member account cannot open the Admin portal.
- Any account other than royalthegym@gmail.com cannot open the Super Admin portal.

## Free-tier limits to remember

| Service | Free limit |
|---|---|
| Firestore (Spark) | 50k reads, 20k writes, 20k deletes per day; 1 GiB stored |
| Firebase Hosting | 10 GB storage, 360 MB/day transfer |
| Identity Platform | 3,000 daily active users |
| Cloudflare Workers | 100,000 requests per day |
| Gemini API free tier | limited requests per minute/day (the Worker caps AI at 50 per user per day) |

## Local development

```bash
npm i
npm run dev        # Vite on http://localhost:3000
```
