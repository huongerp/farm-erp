#!/usr/bin/env bash
#
# Migrate database Supabase → Postgres trên VPS. Xem docs/VPS_MIGRATION.md.
#
#   ./scripts/vps-dump-restore.sh check       # kiểm tra kết nối + phiên bản
#   ./scripts/vps-dump-restore.sh dump        # pg_dump từ Supabase ra backup/
#   ./scripts/vps-dump-restore.sh prepare     # docs/vps-01-prepare-target.sql
#   ./scripts/vps-dump-restore.sh restore     # pg_restore vào VPS
#   ./scripts/vps-dump-restore.sh postcheck   # docs/vps-02-postcheck.sql
#   ./scripts/vps-dump-restore.sh cleanup     # docs/vps-03-cleanup-after-restore.sql
#   ./scripts/vps-dump-restore.sh all         # check → dump → prepare → restore → postcheck
#
# Secret đọc từ .env, không nhận qua tham số dòng lệnh (tránh lộ trong `ps`
# và trong history của shell).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
BACKUP_DIR="$REPO_ROOT/backup"
SQL_DIR="$REPO_ROOT/docs"

SUPABASE_DB_URL="${SUPABASE_DB_URL:-}"
VPS_DB_URL="${VPS_DB_URL:-}"
PGRST_AUTHENTICATOR_PASSWORD="${PGRST_AUTHENTICATOR_PASSWORD:-}"

# --- tiện ích ---------------------------------------------------------

red() { printf '\033[31m%s\033[0m\n' "$*" >&2; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
info() { printf '\033[36m==> %s\033[0m\n' "$*"; }

die() {
  red "LỖI: $*"
  exit 1
}

# Ẩn mật khẩu khi in connection string ra log.
mask_url() {
  sed -E 's#://([^:/@]+):[^@]*@#://\1:***@#' <<<"$1"
}

read_env_var() {
  local key="$1" line value
  line="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" | tail -n 1 || true)"
  [[ -n "$line" ]] || return 0
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

load_env() {
  [[ -f "$ENV_FILE" ]] || die ".env không tồn tại. Copy .env.example rồi điền giá trị."
  # Đọc từng biến thay vì source cả file, tránh thực thi nội dung lạ trong .env.
  [[ -n "$SUPABASE_DB_URL" ]] || SUPABASE_DB_URL="$(read_env_var SUPABASE_DB_URL)"
  [[ -n "$VPS_DB_URL" ]] || VPS_DB_URL="$(read_env_var VPS_DB_URL)"
  [[ -n "$PGRST_AUTHENTICATOR_PASSWORD" ]] \
    || PGRST_AUTHENTICATOR_PASSWORD="$(read_env_var PGRST_AUTHENTICATOR_PASSWORD)"
}

require_url() {
  local name="$1" value="${!1:-}"
  if [[ -z "$value" ]]; then
    if [[ "$name" == "SUPABASE_DB_URL" ]]; then
      die "Thiếu SUPABASE_DB_URL trong .env — cần mật khẩu database của Supabase (Dashboard → Settings → Database). Xem hướng dẫn ngay trong .env."
    fi
    die "Thiếu $name trong .env (xem .env.example)."
  fi
  [[ "$value" == postgres*://* ]] || die "$name phải bắt đầu bằng postgresql://"
  [[ "$value" != *"<"*">"* ]] || die "$name còn placeholder chưa thay (dạng <...>)."
  # Mật khẩu chưa percent-encode: libpq cắt tại dấu @ đầu tiên nên hiểu sai host.
  local after_scheme="${value#*://}"
  if [[ "${after_scheme#*@}" == *"@"* ]]; then
    die "$name có nhiều dấu @ — mật khẩu chưa percent-encode (@ phải viết thành %40). Xem .env.example."
  fi
}

check_tools() {
  command -v pg_dump >/dev/null || die "Chưa có pg_dump. macOS: brew install libpq && brew link --force libpq"
  command -v pg_restore >/dev/null || die "Chưa có pg_restore."
  command -v psql >/dev/null || die "Chưa có psql."
}

# In server_version_num, hoặc chuỗi rỗng nếu không kết nối được.
server_version() {
  psql "$1" -Atqc "SELECT current_setting('server_version_num')" 2>/dev/null || true
}

target_is_prepared() {
  local out
  out="$(psql "$VPS_DB_URL" -Atqc "SELECT to_regprocedure('auth.jwt()') IS NOT NULL" 2>/dev/null || true)"
  [[ "$out" == "t" ]]
}

# --- check ------------------------------------------------------------

cmd_check() {
  check_tools
  load_env
  require_url VPS_DB_URL

  local client_major src_ver dst_ver
  client_major="$(pg_dump --version | grep -oE '[0-9]+' | head -n 1)"
  info "pg_dump major = $client_major"

  info "Đích: $(mask_url "$VPS_DB_URL")"
  dst_ver="$(server_version "$VPS_DB_URL")"
  [[ -n "$dst_ver" ]] || die "Không kết nối được VPS. Kiểm tra firewall port 5432 và mật khẩu đã percent-encode."
  green "  server_version_num = $dst_ver"

  if [[ -z "$SUPABASE_DB_URL" ]]; then
    yellow "  SUPABASE_DB_URL chưa có trong .env — chưa dump được (cần mật khẩu DB Supabase)."
  else
    require_url SUPABASE_DB_URL
    info "Nguồn: $(mask_url "$SUPABASE_DB_URL")"
    src_ver="$(server_version "$SUPABASE_DB_URL")"
    [[ -n "$src_ver" ]] || die "Không kết nối được Supabase. Nếu direct connection chỉ có IPv6 thì dùng Session pooler (port 5432); Transaction pooler 6543 không dùng được cho pg_dump."
    green "  server_version_num = $src_ver"

    # pg_dump cũ hơn server nguồn có thể sinh dump thiếu hoặc sai cú pháp.
    (( client_major * 10000 >= src_ver )) \
      || die "pg_dump ($client_major) cũ hơn server Supabase ($src_ver). Nâng libpq trước."
    (( dst_ver >= src_ver )) \
      || die "Server VPS ($dst_ver) cũ hơn Supabase ($src_ver). Restore sẽ lỗi ở cú pháp/kiểu dữ liệu mới."
  fi

  if target_is_prepared; then
    green "  đích đã chạy vps-01-prepare-target.sql (auth.jwt tồn tại)"
  else
    yellow "  đích CHƯA prepare — chạy: $0 prepare"
  fi

  green "Kiểm tra xong."
}

# --- dump -------------------------------------------------------------

cmd_dump() {
  check_tools
  load_env
  require_url SUPABASE_DB_URL

  mkdir -p "$BACKUP_DIR"
  local file="$BACKUP_DIR/supabase-$(date +%Y%m%d-%H%M%S).dump"

  # --schema=public   bỏ auth, storage, realtime, vault của Supabase.
  # --no-owner        mọi object thuộc role kết nối tới VPS; hàm SECURITY DEFINER
  #                   chạy dưới owner đó nên vẫn bypass RLS như hiện tại.
  # KHÔNG --no-privileges: mất hết GRANT cho anon/authenticated thì PostgREST
  #                   permission denied ở mọi bảng.
  info "Dump từ Supabase → $file"
  pg_dump "$SUPABASE_DB_URL" \
    --format=custom \
    --schema=public \
    --no-owner \
    --verbose \
    --file="$file" 2> "$file.log"

  green "Xong: $file ($(du -h "$file" | cut -f1))"
  echo "  log: $file.log"
  printf '%s\n' "$file" > "$BACKUP_DIR/.latest"
}

latest_dump() {
  if [[ -f "$BACKUP_DIR/.latest" ]]; then
    local saved
    saved="$(cat "$BACKUP_DIR/.latest")"
    if [[ -f "$saved" ]]; then
      printf '%s' "$saved"
      return
    fi
  fi
  ls -t "$BACKUP_DIR"/*.dump 2>/dev/null | head -n 1 || true
}

# Đọc schema của gin_trgm_ops ngay trong dump. pg_dump ghi tên opclass đầy đủ
# (public.gin_trgm_ops hoặc extensions.gin_trgm_ops) nên đây là nguồn chính xác
# nhất để biết phải cài pg_trgm vào schema nào trên đích.
detect_trgm_schema() {
  local file="$1" found=""
  if [[ -n "$file" && -f "$file" ]]; then
    found="$(pg_restore --schema-only -f - "$file" 2>/dev/null \
      | grep -oE '[A-Za-z0-9_]+\.gin_trgm_ops' | head -n 1 | cut -d. -f1 || true)"
  fi
  printf '%s' "${found:-public}"
}

# --- prepare ----------------------------------------------------------

cmd_prepare() {
  check_tools
  load_env
  require_url VPS_DB_URL
  [[ -n "$PGRST_AUTHENTICATOR_PASSWORD" ]] \
    || die "Thiếu PGRST_AUTHENTICATOR_PASSWORD trong .env. Sinh bằng: openssl rand -base64 32"

  local dump trgm
  dump="$(latest_dump)"
  trgm="$(detect_trgm_schema "$dump")"
  if [[ -n "$dump" ]]; then
    info "Dò từ $(basename "$dump"): pg_trgm ở schema '$trgm'"
  else
    yellow "Chưa có file dump nên không dò được schema pg_trgm — dùng mặc định '$trgm'."
    yellow "Nếu Supabase đặt pg_trgm ở 'extensions', chạy lệnh dump trước rồi prepare lại."
  fi

  info "Chạy vps-01-prepare-target.sql trên $(mask_url "$VPS_DB_URL")"
  psql "$VPS_DB_URL" \
    -v ON_ERROR_STOP=1 \
    -v trgm_schema="$trgm" \
    -v authenticator_password="$PGRST_AUTHENTICATOR_PASSWORD" \
    -f "$SQL_DIR/vps-01-prepare-target.sql"

  green "Đích đã sẵn sàng restore."
}

# --- restore ----------------------------------------------------------

# Đảm bảo pg_trgm trên đích nằm đúng schema mà dump tham chiếu. Chạy trước
# restore nên chưa có index nào phụ thuộc, DROP EXTENSION là an toàn.
ensure_trgm_schema() {
  local want="$1" have
  have="$(psql "$VPS_DB_URL" -Atqc \
    "SELECT n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace WHERE e.extname = 'pg_trgm'" \
    2>/dev/null || true)"

  [[ "$have" == "$want" ]] && return 0

  local trgm_index_count
  trgm_index_count="$(psql "$VPS_DB_URL" -Atqc \
    "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public' AND indexdef ILIKE '%gin_trgm_ops%'" \
    2>/dev/null || echo 0)"
  if [[ "${trgm_index_count:-0}" != "0" ]]; then
    die "pg_trgm đang ở schema '$have' nhưng dump cần '$want', mà đích đã có $trgm_index_count index trgm. Prepare lại từ đầu: $0 prepare"
  fi

  yellow "pg_trgm đang ở '${have:-chưa cài}' nhưng dump cần '$want' — cài lại."
  psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -q \
    -c "DROP EXTENSION IF EXISTS pg_trgm" \
    -c "CREATE EXTENSION pg_trgm WITH SCHEMA $want"
}

cmd_restore() {
  check_tools
  load_env
  require_url VPS_DB_URL

  local file="${1:-}"
  [[ -n "$file" ]] || file="$(latest_dump)"
  [[ -n "$file" && -f "$file" ]] \
    || die "Không tìm thấy file dump. Chạy lệnh dump trước, hoặc truyền đường dẫn file."

  target_is_prepared \
    || die "Đích chưa prepare. Chạy '$0 prepare' trước, nếu không restore sẽ chết khi parse RLS policy (thiếu auth.jwt)."

  ensure_trgm_schema "$(detect_trgm_schema "$file")"

  # Tuỳ phiên bản, pg_dump có thể kèm cả `CREATE SCHEMA public`. Schema đó đã
  # được bước prepare tạo sẵn (cần có trước để cài extension), nên bỏ entry này
  # khỏi TOC — bằng không --single-transaction rollback vì "schema public already exists".
  local toc="$file.toc"
  pg_restore --list "$file" \
    | grep -vE '[[:space:]]SCHEMA - public([[:space:]]|$)' > "$toc"

  info "Restore → $(mask_url "$VPS_DB_URL")"
  # --single-transaction + --exit-on-error: lỗi giữa đường không để lại DB nửa vời.
  if ! pg_restore \
      --dbname="$VPS_DB_URL" \
      --use-list="$toc" \
      --no-owner \
      --single-transaction \
      --exit-on-error \
      --verbose \
      "$file" 2> "$file.restore.log"; then
    red "Restore thất bại — DB đã rollback về trạng thái trước đó."
    red "Xem lỗi: tail -n 40 '$file.restore.log'"
    red "Các lỗi thường gặp và cách xử lý: docs/VPS_MIGRATION.md"
    exit 1
  fi

  green "Restore xong."
  echo "  log: $file.restore.log"
}

# --- sync-passwords ---------------------------------------------------

# Đồng bộ 3 cột mật khẩu từ Supabase sang VPS mà không đi qua full dump.
# Cần vì hash chỉ được copy từ auth.users lúc cut-over (chạy
# docs/supabase-migrate-auth-password-hash.sql trên Supabase), thường là SAU khi
# đã restore dữ liệu nghiệp vụ. Hash không bao giờ được in ra stdout; file CSV
# trung gian nằm trong backup/ (đã gitignore) và bị xoá ngay sau khi dùng.
cmd_sync_passwords() {
  check_tools
  load_env
  require_url SUPABASE_DB_URL
  require_url VPS_DB_URL

  local csv="$BACKUP_DIR/mat-khau-sync.csv"
  mkdir -p "$BACKUP_DIR"
  # shellcheck disable=SC2064
  trap "rm -f '$csv'" EXIT

  local con_thieu
  con_thieu="$(psql "$SUPABASE_DB_URL" -Atqc \
    "SELECT count(*) FROM public.fp_var_nhan_vien WHERE mat_khau_hash IS NULL" 2>/dev/null || true)"
  if [[ "${con_thieu:-1}" != "0" ]]; then
    die "Trên Supabase còn $con_thieu nhân viên chưa có mat_khau_hash. Chạy docs/supabase-migrate-auth-password-hash.sql trên Supabase trước."
  fi

  info "Xuất 3 cột mật khẩu từ Supabase"
  psql "$SUPABASE_DB_URL" -q -c "\copy (SELECT id, mat_khau_hash, phai_doi_mat_khau, mat_khau_cap_nhat_luc FROM public.fp_var_nhan_vien ORDER BY id) TO '$csv' WITH (FORMAT csv)"

  info "Ghi sang VPS"
  psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -q --single-transaction <<SQL
CREATE TEMP TABLE tmp_mat_khau (
  id BIGINT, mat_khau_hash TEXT, phai_doi_mat_khau BOOLEAN, mat_khau_cap_nhat_luc TIMESTAMPTZ
);
\copy tmp_mat_khau FROM '$csv' WITH (FORMAT csv)
UPDATE public.fp_var_nhan_vien nv
SET mat_khau_hash         = t.mat_khau_hash,
    phai_doi_mat_khau     = t.phai_doi_mat_khau,
    mat_khau_cap_nhat_luc = t.mat_khau_cap_nhat_luc
FROM tmp_mat_khau t
WHERE t.id = nv.id;
SQL

  # Đối chiếu bằng digest để không phải in hash ra.
  local q="SELECT count(mat_khau_hash) || ' hash, md5=' || md5(string_agg(id || ':' || coalesce(mat_khau_hash, ''), ',' ORDER BY id)) FROM public.fp_var_nhan_vien"
  local src dst
  src="$(psql "$SUPABASE_DB_URL" -Atqc "$q")"
  dst="$(psql "$VPS_DB_URL" -Atqc "$q")"
  echo "  Supabase: $src"
  echo "  VPS     : $dst"
  [[ "$src" == "$dst" ]] || die "Digest hai bên khác nhau — đồng bộ chưa đủ."
  green "Mật khẩu đã đồng bộ, digest hai bên trùng khớp."
}

# --- postcheck / cleanup ----------------------------------------------

cmd_postcheck() {
  check_tools
  load_env
  require_url VPS_DB_URL
  info "Postcheck trên $(mask_url "$VPS_DB_URL")"
  psql "$VPS_DB_URL" -f "$SQL_DIR/vps-02-postcheck.sql"
  yellow "Đối chiếu mục 1–4 với kết quả docs/vps-00-discovery.sql chạy trên Supabase."
}

cmd_cleanup() {
  check_tools
  load_env
  require_url VPS_DB_URL
  yellow "Bước này bỏ dual-write sang auth.users — chỉ chạy khi đã quyết định dùng bản VPS."
  psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_DIR/vps-03-cleanup-after-restore.sql"
}

# --- main -------------------------------------------------------------

case "${1:-}" in
  check)          cmd_check ;;
  dump)           cmd_dump ;;
  prepare)        cmd_prepare ;;
  restore)        shift; cmd_restore "${1:-}" ;;
  postcheck)      cmd_postcheck ;;
  sync-passwords) cmd_sync_passwords ;;
  cleanup)        cmd_cleanup ;;
  all)            cmd_check; cmd_dump; cmd_prepare; cmd_restore; cmd_postcheck ;;
  *)
    cat <<'USAGE'
Cách dùng: ./scripts/vps-dump-restore.sh <lệnh>

  check            Kiểm tra pg_dump, kết nối hai đầu, phiên bản, đích đã prepare chưa
  dump             pg_dump schema public từ Supabase ra backup/
  prepare          Chạy docs/vps-01-prepare-target.sql (tự dò schema pg_trgm từ dump)
  restore          pg_restore vào VPS (mặc định lấy dump mới nhất)
  postcheck        Chạy docs/vps-02-postcheck.sql
  sync-passwords   Đồng bộ 3 cột mật khẩu Supabase → VPS (không cần dump lại)
  cleanup          Chạy docs/vps-03-cleanup-after-restore.sql (sau khi đã cắt sang VPS)
  all              check → dump → prepare → restore → postcheck

Cần trong .env: SUPABASE_DB_URL, VPS_DB_URL, PGRST_AUTHENTICATOR_PASSWORD.
Mật khẩu trong connection string phải percent-encode (@ → %40).
USAGE
    exit 1
    ;;
esac
