#!/usr/bin/env bash
# Chuyển ảnh base64 / Cloudinary cũ trong DB về kho ảnh trên VPS (services/media).
# Dùng: bash scripts/chuyen-anh-ve-vps.sh          # chạy thử, chỉ đếm
#       bash scripts/chuyen-anh-ve-vps.sh --chay   # ghi thật (sao lưu DB trước!)
# Chi tiết: services/media/scripts/chuyen-anh-ve-vps.ts
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
source .env
set +a
: "${VPS_DB_URL:?Thiếu VPS_DB_URL trong .env}"
: "${PGRST_JWT_SECRET:?Thiếu PGRST_JWT_SECRET trong .env}"

CONG="${VPS_DB_TUNNEL_LOCAL_PORT:-5432}"
if ! lsof -nP -iTCP:"$CONG" -sTCP:LISTEN >/dev/null 2>&1; then
  : "${VPS_DB_INTERNAL_HOST:?Thiếu VPS_DB_INTERNAL_HOST trong .env}"
  echo "Mở SSH tunnel 5fedu → $VPS_DB_INTERNAL_HOST:5432 (cổng $CONG)..." >&2
  ssh -o BatchMode=yes -f -N -L "$CONG:$VPS_DB_INTERNAL_HOST:5432" 5fedu
  sleep 1
fi

cd services/media
[ -d node_modules ] || npm ci --no-audit --no-fund
exec node --experimental-strip-types scripts/chuyen-anh-ve-vps.ts "$@"
