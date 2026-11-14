#!/usr/bin/env bash
# Concatenates src/*.js (alphabetical = dependency order) into public/app.js and copies index.html. No npm needed.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p public
cat src/a-lib.js src/b-ui.js src/c1-data.js src/c2-super.js src/c3-gym.js src/c4-gym2.js src/c5-extras.js src/c6-receipt.js src/c7-whatsapp.js src/c8-fitplan.js src/c9-daysum.js src/c10-biz.js src/c11-store.js src/c12-portal.js src/c13-pwa.js src/c14-payroll.js src/c15-progress.js src/c16-classes.js src/c17-qr.js src/c18-scan.js src/c19-tasks.js src/c20-birthdays.js src/c21-achievements.js src/c22-review.js src/c23-referrals.js src/c24-freeze.js src/c25-equipment.js src/c26-weekly.js src/c27-workouts.js src/c28-wellness.js src/c29-leaderboard.js src/c30-forecast.js src/c31-reorder.js src/c32-attendance.js src/c33-activity.js src/d-boot.js > public/app.js
cp index.html public/index.html
node --check public/app.js
# service worker: one cache per release (hash of the files the shell is made of)
BUILD=$( (cat public/app.js public/style.css public/index.html public/manifest.webmanifest public/offline.html) | sha1sum | cut -c1-10)
sed "s/__BUILD__/${BUILD}/" sw.src.js > public/sw.js
node --check public/sw.js
echo "built public/app.js ($(wc -c < public/app.js) bytes)"
