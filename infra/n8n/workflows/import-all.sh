#!/bin/bash
# Import all workflows into n8n with a single command
N8N_URL="http://localhost:5678"
N8N_KEY="fitness_n8n_key_2026"

for f in *.json; do
  echo "Importing: $f"
  curl -s -X POST "$N8N_URL/api/v1/workflows" \
    -H "X-N8N-API-KEY: $N8N_KEY" \
    -H "Content-Type: application/json" \
    -d @"$f"
  echo " ✅"
done
echo "All workflows imported!"
