#!/usr/bin/env bash
# Runs the AI approval gate SQL tests on a throw-away local Postgres (no Supabase needed).
#   PGHOST=/tmp/pgtest PGPORT=5544 PGUSER=postgres bash supabase/tests/run_ai_gate.sh
# It creates and drops a database called "t". stub.sql fakes the Supabase roles, auth.uid() and the private helpers;
# stub_ai.sql fakes the live tables the gate touches (same columns and constraints as the live schema).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
P="psql -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "drop database if exists t" -c "create database t" >/dev/null
$P -d t -f "$HERE/stub.sql" >/dev/null
$P -d t -f "$HERE/stub_ai.sql" >/dev/null
$P -d t -f "$HERE/../migrations/20261126_ai_gate.sql" >/dev/null 2>&1
$P -d t -f "$HERE/ai_gate.test.sql"
