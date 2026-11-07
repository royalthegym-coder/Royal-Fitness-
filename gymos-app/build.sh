#!/usr/bin/env bash
# Concatenates src/*.js (alphabetical = dependency order) into public/app.js and copies index.html. No npm needed.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p public
cat src/a-lib.js src/b-ui.js src/c1-data.js src/c2-super.js src/c3-gym.js src/c4-gym2.js src/c5-extras.js src/c6-receipt.js src/c7-whatsapp.js src/c8-fitplan.js src/c9-daysum.js src/c10-biz.js src/c11-store.js src/d-boot.js > public/app.js
cp index.html public/index.html
node --check public/app.js
echo "built public/app.js ($(wc -c < public/app.js) bytes)"
