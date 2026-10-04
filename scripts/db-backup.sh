#!/usr/bin/env bash
# Sao lưu toàn bộ Postgres trên VPS về backup/ (định dạng custom của pg_dump, nén sẵn).
# Chạy TRƯỚC mỗi migration — repo không có DB thử, migration chạy thẳng lên dữ liệu thật.
# Dùng: bash scripts/db-backup.sh [nhan]      → backup/<thời-gian>-<nhan>.dump
# Khôi phục (cẩn thận, ghi đè): pg_restore --clean --if-exists -d "$VPS_DB_URL" backup/<file>.dump
# backup/ đã nằm trong .gitignore — file dump chứa dữ liệu thật, KHÔNG commit, không gửi đi.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
source .env
set +a
: "${VPS_DB_URL:?Thiếu VPS_DB_URL trong .env}"
export PGCONNECT_TIMEOUT="${PGCONNECT_TIMEOUT:-10}"

CONG="${VPS_DB_TUNNEL_LOCAL_PORT:-5432}"
if ! lsof -nP -iTCP:"$CONG" -sTCP:LISTEN >/dev/null 2>&1; then
  : "${VPS_DB_INTERNAL_HOST:?Thiếu VPS_DB_INTERNAL_HOST trong .env}"
  echo "Mở SSH tunnel 5fedu → $VPS_DB_INTERNAL_HOST:5432 (cổng $CONG)..." >&2
  ssh -o BatchMode=yes -f -N -L "$CONG:$VPS_DB_INTERNAL_HOST:5432" 5fedu
  sleep 1
fi

NHAN="${1:-thu-cong}"
NHAN="$(printf '%s' "$NHAN" | tr -c 'A-Za-z0-9_-' '-')"
mkdir -p backup
FILE="backup/$(date +%Y%m%d-%H%M%S)-$NHAN.dump"
pg_dump "$VPS_DB_URL" --format=custom --no-owner --no-privileges --file="$FILE"
echo "Đã sao lưu: $FILE ($(du -h "$FILE" | cut -f1))"
