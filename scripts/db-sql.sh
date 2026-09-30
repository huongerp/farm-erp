#!/usr/bin/env bash
# Chạy psql vào Postgres trên VPS bằng VPS_DB_URL trong .env (không in bí mật).
# Tự mở SSH tunnel qua host `5fedu` nếu chưa có.
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

# VPS_DB_URL trỏ 127.0.0.1 → cần SSH tunnel. Chưa có thì tự mở qua host `5fedu`
# (~/.ssh/config, đăng nhập bằng key ~/.ssh/5fedu_ed25519).
CONG="${VPS_DB_TUNNEL_LOCAL_PORT:-5432}"
if ! lsof -nP -iTCP:"$CONG" -sTCP:LISTEN >/dev/null 2>&1; then
  : "${VPS_DB_INTERNAL_HOST:?Thiếu VPS_DB_INTERNAL_HOST trong .env}"
  echo "Mở SSH tunnel 5fedu → $VPS_DB_INTERNAL_HOST:5432 (cổng $CONG)..." >&2
  ssh -o BatchMode=yes -f -N -L "$CONG:$VPS_DB_INTERNAL_HOST:5432" 5fedu
  sleep 1
fi
exec psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 "$@"
