#!/usr/bin/env bash
# Sao lưu kho ảnh trên VPS (volume media-data của service media) về backup/media-<thời điểm>.tgz.
# backup/ đã gitignore — chứa ảnh thật, không commit / gửi đi.
# Dùng: bash scripts/media-backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
VOLUME="${MEDIA_VOLUME:-postgressdatabase-fpfarm-bxb6pm_media-data}"
mkdir -p backup
DICH="backup/media-$(date +%Y%m%d-%H%M%S).tgz"
ssh -o BatchMode=yes 5fedu "docker run --rm -v ${VOLUME}:/d:ro alpine tar czf - -C /d ." > "$DICH"
echo "Đã sao lưu kho ảnh: $DICH ($(du -h "$DICH" | cut -f1))"
