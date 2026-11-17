# Google Play: packaging GymOS as an Android app (TWA)

GymOS ships to Android as a **Trusted Web Activity (TWA)**: a thin Android shell that opens the same PWA at `https://<APP_HOST>/` full-screen, with no browser bar, once Digital Asset Links verification passes. There is one codebase. Web fixes reach Android users without a new release. Only changes to the shell (package name, icon, signing key, Android target) need a new AAB.

Placeholders in this document: `<APP_HOST>` (the Render static site host), `<APPLICATION_ID>` (the Android package name, e.g. `in.example.gymos`; choose once, it is permanent), `<SHA256>` (the Play app-signing certificate fingerprint).

## 1. What the repo already guarantees

| Requirement | Where | Check |
|---|---|---|
| Installable manifest with stable identity | `public/manifest.webmanifest`: `id "./"`, `start_url "./?source=pwa"`, `scope "./"`, `display standalone` | open the manifest URL, confirm the fields |
| 192 and 512 icons, plus maskable icons | `public/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png` | sizes verified (192×192, 512×512, apple-touch 180×180) |
| Offline shell, never a stale app | `sw.src.js` → `public/sw.js` (built by `build.sh`) | navigation: network first, saved shell second, `offline.html` last; only the app entry is saved as the shell |
| Privacy policy URL | `public/privacy.html` (draft, bilingual) | it must be published and reachable without login |
| Digital Asset Links file | `public/.well-known/assetlinks.json` (**placeholders until step 3**) | served as JSON at `https://<APP_HOST>/.well-known/assetlinks.json` |
| In-app data deletion | Profile → Delete my data; owner: Settings → Data deletion requests | migration `20261117_deletion_requests.sql` |

## 2. Accounts and prerequisites (operator)

1. Create a Google Play Console developer account. Complete identity verification. Pay the one-time registration fee; the amount is shown in the Console at signup.
2. Install JDK 17 and the Android SDK, or let the Bubblewrap tool install them (`bubblewrap doctor` reports what is missing).
3. Keep the upload key and the account recovery details somewhere safe. Losing the upload key is recoverable through Play only if the account has the recovery path set up.

## 3. Build the TWA

Bubblewrap (Google's open-source TWA tool) reads the live manifest:

```sh
npm i -g @bubblewrap/cli
bubblewrap init --manifest=https://<APP_HOST>/manifest.webmanifest
#   answer the prompts: applicationId = <APPLICATION_ID>, name = GymOS, launcher name = Royal Gym
bubblewrap doctor
bubblewrap build            # produces app-release-bundle.aab (upload this) and app-release-signed.apk (testing)
```

Notes:
- Bubblewrap asks for a signing key on first build. Store that **upload key** outside the repo. Never commit keystores or passwords.
- Use the same `<APPLICATION_ID>` for every later build. A new package name is a new app.
- Icons and the name come from the manifest. Change them in the manifest, then rebuild the AAB.

## 4. Digital Asset Links (this is what removes the browser bar)

1. In Play Console: **Test and release → Setup → App integrity → App signing**. Copy the **SHA-256 certificate fingerprint** of the app signing key (not the upload key) for the Play-distributed app.
2. Edit `public/.well-known/assetlinks.json`: set `package_name` to `<APPLICATION_ID>` and `sha256_cert_fingerprints` to `["<SHA256>"]`. Keep the JSON valid.
3. Commit and deploy (`git push`; then trigger a Render deploy if auto-deploy did not fire).
4. Verify:
   - `curl -sI https://<APP_HOST>/.well-known/assetlinks.json` returns `200` and a JSON content type.
   - The Digital Asset Links tester (developers.google.com/digital-asset-links/tools/generator) reports the relation as verified for the package.
   - On a phone, open the installed app: no browser bar means verification passed. If the bar shows, the package name or fingerprint does not match exactly.

If Render does not serve the `.well-known` folder, add a static route or redirect for `/.well-known/assetlinks.json` in the Render service settings and re-verify.

## 5. Data safety form (Play Console)

Answer from what the app actually does. Map each row to the real data in the schema. Re-check this table when a new field is added.

| Play category | Data in GymOS | Collected | Shared | Optional | Notes |
|---|---|---|---|---|---|
| Personal info: name, phone, email | members, staff, owners | yes | no | no | Member phone and name are needed for membership |
| Personal info: date of birth, gender | members | yes | no | yes | fields left empty are allowed |
| Photos | member photo (optional upload) | yes | no | yes | stored in a private bucket |
| Health and fitness: fitness info | height, weight, goal, activity, workouts, meals, sleep, water | yes | confirm | yes | entered by the member |
| Health info: injuries, conditions, allergies | `member_fit` | yes | **confirm** | yes | sent to the AI coach context (see below) |
| Financial info: purchase history | invoices, payments, online orders | yes | yes (Razorpay) | no | payment is processed by Razorpay |
| Messages | AI coach chat | yes | **confirm** | yes | sent to the AI gateway to answer |
| App activity / Device IDs | push subscription | yes | no | yes | browser push endpoint |

Decisions to take before submitting (they change the answers above):
- **AI coach and health fields.** The coach context can include injuries, conditions and allergies (each cut to about 160 characters) and is sent through the Vercel AI Gateway to the model. Whether that is "shared" under Play's definitions depends on whether the provider processes data only on GymOS's behalf. Read Play's Data safety guidance and decide. Until the owner decides whether health fields go to the AI gateway at all, leave the coach off for members with health fields.
- **Data deletion.** Play requires a way to request account and data deletion. In-app: Profile → Delete my data. Web: `privacy.html`, section 7. Confirm the current Play wording and add a web request channel if Play asks for one.
- **Encryption in transit:** yes (HTTPS only).

## 6. Store listing and policy items

- Privacy policy URL: `https://<APP_HOST>/privacy.html`. The page is a draft: fill every `[bracket]` item and have a lawyer review it before submitting.
- Target audience: declare adults (18+). Members can be younger; the policy requires guardian consent for under-18 data, and declaring the audience as adult avoids the children's-app rules. Confirm the current wording in Play Console.
- Content rating: complete the questionnaire. The app has no user-generated public content and no gambling.
- Payments: gym fees pay for a physical service. Confirm in Play's payments policy that Razorpay for gym fees does not need Play Billing. Do not sell digital content in the app without reviewing this.
- New personal developer accounts may have to run a closed test with a minimum number of testers for a set period before production access. Check the current requirement in the Console before planning the release date.
- Target API level: Play sets a minimum target API level that changes each year. Use the level the Console shows on the release page; `bubblewrap build` uses a recent default.

## 7. Release steps

1. Internal or closed testing track first. Install from the Play link on two Android phones (one older, one current).
2. Check on a device: install, open, shows no browser bar (assetlinks verified), the offline page works with airplane mode, push notification opens the right page, camera scan works for check-in, the privacy page opens from the menu.
3. Upload the AAB. Add release notes in Hindi and English.
4. Roll out in stages (for example 20%, then 100%). Watch crash and ANR reports for 48 hours.

## 8. Operator checklist (only a person can do these)

- [ ] Play Console account and identity verification
- [ ] Choose `<APPLICATION_ID>` (permanent) and record it
- [ ] Keep the upload key and the recovery details safe, outside the repo
- [ ] Put the app-signing SHA-256 into `public/.well-known/assetlinks.json`, deploy, verify the file
- [ ] Fill every `[bracket]` item in `privacy.html`; have a lawyer review it
- [ ] Decide whether health fields go to the AI gateway; set the Data safety answers to match
- [ ] Complete the Data safety form, content rating, target audience and store listing
- [ ] Run the closed test; then release in stages

## 9. Repo facts to keep true

- Changing the start URL, the scope or the manifest `id` can break the TWA. Keep them stable.
- The package name and the signing key must not change between releases of the same app.
- Each deploy changes the web content the app shows; the AAB does not need rebuilding for web-only changes.
