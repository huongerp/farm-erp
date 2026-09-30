#!/usr/bin/env bash
# Chạy psql vào Postgres trên VPS bằng VPS_DB_URL trong .env (không in bí mật).
# Dùng: bash scripts/db-sql.sh -f docs/migrations/NNN-*.sql
#       bash scripts/db-sql.sh -At -c "select ..."
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
source .env
set +a
: "${VPS_DB_URL:?Thiếu VPS_DB_URL trong .env}"
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"
exec psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 "$@"
