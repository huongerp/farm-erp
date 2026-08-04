#!/usr/bin/env bash
# =====================================================================
# Smoke test PostgREST sau khi deploy — chạy TRƯỚC khi sửa frontend.
#
#   ./scripts/postgrest-smoke.sh                      # đọc PGRST_BASE_URL từ .env
#   ./scripts/postgrest-smoke.sh https://erp.abc.vn/api
#
# Tự ký JWT bằng PGRST_JWT_SECRET trong .env rồi kiểm từng nhóm cú pháp mà app
# thực sự dùng (eq, in, or, contains, order, range + count=exact, single, RPC…).
#
# Mục đích: phát hiện sai khác giữa PostgREST tự host và bản Supabase đang chạy
# TRƯỚC khi đổi 345 chỗ gọi sang endpoint mới. Nếu có test đỏ vì lệch phiên bản,
# hạ image về postgrest/postgrest:v12.2 rồi chạy lại.
#
# Kế hoạch: docs/VPS_POSTGREST_PLAN.md
# =====================================================================
set -uo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

BASE_URL="${1:-${PGRST_BASE_URL:-}}"
if [[ -z "$BASE_URL" ]]; then
  echo "Thiếu base URL. Truyền tham số hoặc đặt PGRST_BASE_URL trong .env." >&2
  echo "Ví dụ: ./scripts/postgrest-smoke.sh https://erp.abc.vn/api" >&2
  exit 1
fi
BASE_URL="${BASE_URL%/}"

if [[ -z "${PGRST_JWT_SECRET:-}" ]]; then
  echo "Thiếu PGRST_JWT_SECRET trong .env." >&2
  exit 1
fi

# Email dùng để ký JWT: phải là một nhân viên đang làm việc, và nên là admin
# (chuc_vu.tt = 1) để test được cả nhánh is_admin_current_user().
SMOKE_EMAIL="${SMOKE_EMAIL:-}"
if [[ -z "$SMOKE_EMAIL" ]]; then
  if [[ -n "${VPS_DB_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
    SMOKE_EMAIL=$(psql "$VPS_DB_URL" -Atqc "
      SELECT nv.email FROM public.fp_var_nhan_vien nv
      JOIN public.fp_var_chuc_vu cv ON cv.id = nv.chuc_vu_id
      WHERE nv.trang_thai = 'Đang làm việc' AND cv.tt = 1 AND nv.email IS NOT NULL
      ORDER BY nv.id LIMIT 1" 2>/dev/null)
  fi
fi
if [[ -z "$SMOKE_EMAIL" ]]; then
  echo "Không xác định được email để ký JWT. Đặt SMOKE_EMAIL=... rồi chạy lại." >&2
  exit 1
fi

# ---------------------------------------------------------------------
# Ký JWT HS256. PostgREST coi secret là chuỗi UTF-8 thô — giống cách
# auth-service dùng TextEncoder().encode(secret), nên hai bên khớp nhau.
# ---------------------------------------------------------------------
b64url() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }

sign_jwt() {
  local claims="$1"
  local header payload signing_input sig
  header=$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | b64url)
  payload=$(printf '%s' "$claims" | b64url)
  signing_input="${header}.${payload}"
  sig=$(printf '%s' "$signing_input" \
        | openssl dgst -sha256 -hmac "$PGRST_JWT_SECRET" -binary | b64url)
  printf '%s.%s' "$signing_input" "$sig"
}

NOW=$(date +%s)
EXP=$((NOW + 900))
TOKEN=$(sign_jwt "{\"role\":\"authenticated\",\"email\":\"$SMOKE_EMAIL\",\"iat\":$NOW,\"exp\":$EXP}")
TOKEN_HET_HAN=$(sign_jwt "{\"role\":\"authenticated\",\"email\":\"$SMOKE_EMAIL\",\"iat\":$((NOW - 7200)),\"exp\":$((NOW - 3600))}")

echo "PostgREST : $BASE_URL"
echo "Ký JWT cho: $SMOKE_EMAIL"
echo

SO_PASS=0
SO_FAIL=0

# req <method> <path> [data] [extra curl args...] → in "STATUS<TAB>BODY"
req() {
  local method="$1" path="$2" data="${3:-}"; shift 3 || shift 2
  local args=(-sS -X "$method" -o /tmp/pgrst-body -w '%{http_code}'
              -H "Authorization: Bearer $TOKEN")
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' -d "$data")
  local code
  code=$(curl "${args[@]}" "$@" "$BASE_URL$path" 2>/dev/null)
  printf '%s\t%s' "$code" "$(cat /tmp/pgrst-body)"
}

# kiem <tên> <điều kiện đúng/sai> <thực tế để in khi fail>
kiem() {
  local ten="$1" dat="$2" thuc_te="${3:-}"
  if [[ "$dat" == "true" ]]; then
    printf '  PASS  %s\n' "$ten"; SO_PASS=$((SO_PASS + 1))
  else
    printf '  FAIL  %s\n' "$ten"
    [[ -n "$thuc_te" ]] && printf '        → %s\n' "${thuc_te:0:300}"
    SO_FAIL=$((SO_FAIL + 1))
  fi
}

la_json_array() { [[ "$1" == \[* ]] && echo true || echo false; }

# ---------------------------------------------------------------------
echo "1) Không token / token sai thì không đọc được gì"
# ---------------------------------------------------------------------
r=$(curl -sS -o /tmp/pgrst-body -w '%{http_code}' "$BASE_URL/fp_var_chi_nhanh?limit=1" 2>/dev/null)
body=$(cat /tmp/pgrst-body)
# anon còn grant bảng nhưng đã hết policy → PostgREST trả 200 với mảng RỖNG.
kiem "anon đọc fp_var_chi_nhanh trả rỗng" \
     "$([[ "$body" == '[]' ]] && echo true || echo false)" "$r $body"

r=$(curl -sS -o /tmp/pgrst-body -w '%{http_code}' "$BASE_URL/fp_hr_nhom_phieu_hanh_chinh?limit=1" 2>/dev/null)
body=$(cat /tmp/pgrst-body)
kiem "anon KHÔNG đọc được fp_hr_nhom_phieu_hanh_chinh (lỗ hổng cũ đã đóng)" \
     "$([[ "$body" != '['*'{'* ]] && echo true || echo false)" "$r $body"

r=$(curl -sS -o /tmp/pgrst-body -w '%{http_code}' \
      -H "Authorization: Bearer $TOKEN_HET_HAN" "$BASE_URL/fp_var_chi_nhanh?limit=1" 2>/dev/null)
kiem "token hết hạn bị từ chối (401)" "$([[ "$r" == 401 ]] && echo true || echo false)" "$r"

r=$(curl -sS -o /tmp/pgrst-body -w '%{http_code}' \
      -H "Authorization: Bearer $TOKEN.giabo" "$BASE_URL/fp_var_chi_nhanh?limit=1" 2>/dev/null)
kiem "token sai chữ ký bị từ chối (401)" "$([[ "$r" == 401 ]] && echo true || echo false)" "$r"

# ---------------------------------------------------------------------
echo
echo "2) Cú pháp query mà app đang dùng"
# ---------------------------------------------------------------------
IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_chi_nhanh?select=id,ten_chi_nhanh&limit=2")"
kiem "select danh sách cột" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=id,ho_va_ten&trang_thai=eq.%C4%90ang%20l%C3%A0m%20vi%E1%BB%87c&limit=2")"
kiem "eq" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=id&id=in.(1,2,3)")"
kiem "in" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=id,ho_va_ten&or=(id.eq.1,id.eq.2)")"
kiem "or" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=id,ho_va_ten&ho_va_ten=ilike.*a*&limit=2")"
kiem "ilike" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=id&id=not.is.null&limit=2")"
kiem "not.is" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=id&order=id.desc&limit=3")"
kiem "order + limit" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

# range + count=exact: cơ chế fetchTablePage/fetchAllRows trong lib/supabase.ts
hdr=$(curl -sS -D - -o /tmp/pgrst-body \
        -H "Authorization: Bearer $TOKEN" \
        -H 'Range-Unit: items' -H 'Range: 0-1' -H 'Prefer: count=exact' \
        "$BASE_URL/fp_var_nhan_vien?select=id" 2>/dev/null)
kiem "range + count=exact trả Content-Range có tổng số" \
     "$(grep -qi '^content-range: 0-1/[0-9]' <<<"$hdr" && echo true || echo false)" \
     "$(grep -i '^content-range' <<<"$hdr")"

# single(): supabase-js đổi Accept header, không đổi query
IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=id&limit=1" "" -H 'Accept: application/vnd.pgrst.object+json')"
kiem "single() qua Accept: pgrst.object" \
     "$([[ "$code" == 200 && "$body" == \{* ]] && echo true || echo false)" "$code $body"

# contains trên cột mảng — app dùng cho chi_nhanh_ids
IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_phan_quyen?select=*&limit=1")"
kiem "đọc được bảng phân quyền" "$([[ "$code" == 200 ]] && la_json_array "$body")" "$code $body"

# ---------------------------------------------------------------------
echo
echo "3) RPC"
# ---------------------------------------------------------------------
IFS=$'\t' read -r code body <<<"$(req POST "/rpc/rpc_get_session_bootstrap" "{\"p_email\":\"$SMOKE_EMAIL\"}")"
kiem "rpc_get_session_bootstrap trả hồ sơ" \
     "$([[ "$code" == 200 && "$body" == *employee* ]] && echo true || echo false)" "$code $body"

IFS=$'\t' read -r code body <<<"$(req POST "/rpc/rpc_ton_kho_matrix" '{}')"
kiem "rpc_ton_kho_matrix chạy được" \
     "$([[ "$code" == 200 ]] && echo true || echo false)" "$code $body"

# ---------------------------------------------------------------------
echo
echo "4) Bí mật không lọt ra REST"
# ---------------------------------------------------------------------
IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=mat_khau_hash&limit=1")"
kiem "không select được mat_khau_hash" "$([[ "$code" != 200 ]] && echo true || echo false)" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_nhan_vien?select=*&limit=1")"
kiem "select=* không chứa mat_khau_hash" \
     "$([[ "$body" != *mat_khau_hash* ]] && echo true || echo false)" "$code ${body:0:120}"

IFS=$'\t' read -r code body <<<"$(req GET "/fp_var_phien_dang_nhap?select=*&limit=1")"
kiem "không đọc được bảng phiên đăng nhập" \
     "$([[ "$body" != '['*'{'* ]] && echo true || echo false)" "$code $body"

IFS=$'\t' read -r code body <<<"$(req POST "/rpc/rpc_dang_nhap" '{"p_email":"x@y.z","p_mat_khau":"x"}')"
kiem "không gọi được rpc_dang_nhap qua REST" \
     "$([[ "$code" != 200 ]] && echo true || echo false)" "$code $body"

IFS=$'\t' read -r code body <<<"$(req POST "/rpc/rpc_dang_nhap_google" '{"p_email":"x@y.z"}')"
kiem "không gọi được rpc_dang_nhap_google qua REST" \
     "$([[ "$code" != 200 ]] && echo true || echo false)" "$code $body"

IFS=$'\t' read -r code body <<<"$(req GET "/")"
kiem "OpenAPI đã tắt (không phơi schema)" \
     "$([[ "$code" != 200 ]] && echo true || echo false)" "$code ${body:0:120}"

# ---------------------------------------------------------------------
echo
printf 'Kết quả: %d pass, %d fail\n' "$SO_PASS" "$SO_FAIL"
rm -f /tmp/pgrst-body
[[ "$SO_FAIL" -eq 0 ]] || exit 1
