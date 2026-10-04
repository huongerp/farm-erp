#!/usr/bin/env bash
# Sinh docs/MA_TRAN_PHAN_QUYEN.md từ bảng fp_var_phan_quyen trên VPS (chức vụ × module × quyền).
# Chạy lại mỗi khi đổi phân quyền trong app để tài liệu bàn giao khớp thực tế.
# Dùng: bash scripts/xuat-ma-tran-quyen.sh
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=docs/MA_TRAN_PHAN_QUYEN.md
SQL="
WITH nhan AS (
  SELECT pq.chuc_vu_id, pq.module_id,
         CASE WHEN pq.actions && ARRAY['admin', 'all'] THEN 'Toàn quyền (xem, thêm, sửa, xoá, duyệt)'
         ELSE (SELECT string_agg(CASE a
                   WHEN 'view' THEN 'Xem' WHEN 'create' THEN 'Thêm' WHEN 'update' THEN 'Sửa'
                   WHEN 'delete' THEN 'Xoá' WHEN 'approve' THEN 'Duyệt' ELSE a END, ', '
                   ORDER BY array_position(ARRAY['view', 'create', 'update', 'delete', 'approve'], a))
               FROM unnest(pq.actions) AS a)
         END AS quyen
  FROM fp_var_phan_quyen pq
  WHERE cardinality(pq.actions) > 0
)
SELECT coalesce(cv.tt::text, ''), cv.ten_chuc_vu,
       (SELECT count(*) FROM fp_var_nhan_vien nv WHERE nv.chuc_vu_id = cv.id),
       n.module_id, n.quyen
FROM fp_var_chuc_vu cv
LEFT JOIN nhan n ON n.chuc_vu_id = cv.id
ORDER BY cv.tt NULLS LAST, cv.ten_chuc_vu, n.module_id;
"

{
  echo "# Ma trận phân quyền"
  echo
  echo "Sinh tự động từ \`fp_var_phan_quyen\` ngày $(date +%d/%m/%Y) bằng \`bash scripts/xuat-ma-tran-quyen.sh\` — đừng sửa tay."
  echo
  echo "**Toàn quyền mọi module** (không cần cấp từng dòng): nhân viên có cấp bậc 1, hoặc chức vụ có thứ tự (tt) = 1."
  echo "\"Quản trị\" / \"Toàn quyền\" trên một module bao gồm mọi quyền của module đó. Tầng DB kiểm cùng luật này"
  echo "(\`fn_co_quyen_module\`) với các bảng: nhân viên, phân quyền, chức vụ, cấp bậc, bảng lương, tiêu chí GSCL."
  echo
  bash scripts/db-sql.sh -At -F $'\t' -c "$SQL" | awk -F'\t' '
    $2 != cv {
      cv = $2
      tt = ($1 == "1") ? " — toàn quyền (tt = 1)" : ""
      printf "\n## %s%s\n\n_%s nhân viên_\n\n", cv, tt, $3
      header = 0
    }
    $4 == "" { print "Chưa được cấp quyền module nào."; next }
    !header { print "| Module | Quyền |"; print "|---|---|"; header = 1 }
    { printf "| `%s` | %s |\n", $4, $5 }
  '
} > "$OUT"

echo "Đã ghi $OUT"
