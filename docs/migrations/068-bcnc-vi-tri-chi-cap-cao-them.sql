-- =============================================================================
-- 068-bcnc-vi-tri-chi-cap-cao-them.sql — Báo cáo nhân công: chỉ cấp cao mới THÊM vị trí
--
-- Migration 067 cho mọi người có quyền Thêm/Sửa phiếu tự thêm vị trí mới vào danh mục
-- dùng chung fp_var_vi_tri_so_che (gõ tên mới trong form là tự insert) → danh mục lại
-- phình ra đủ kiểu viết. Từ nay chỉ cấp cao mới insert được:
--   - cap_bac = 1 (hoặc chức vụ tt = 1), hoặc
--   - quyền `admin` / `all` trên module quan-ly-nha-so-che/bao-cao-nhan-cong.
-- Dùng lại fn_co_quyen_module (migration 013) — hàm đã gồm nhánh cap_bac = 1 / tt = 1.
-- Người khác chỉ CHỌN vị trí có sẵn; app khớp luật ở core/permissions.ts → coQuyenThemViTri.
--
-- SELECT / UPDATE / DELETE giữ nguyên như 067 (chỉ siết INSERT).
-- Idempotent: chạy lại nhiều lần vẫn ra cùng một policy.
--
-- Chạy TRƯỚC frontend mới:
--   bash scripts/db-backup.sh truoc-068
--   bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/068-bcnc-vi-tri-chi-cap-cao-them.sql
-- =============================================================================
BEGIN;

DROP POLICY IF EXISTS fp_var_vtsc_insert_quyen ON public.fp_var_vi_tri_so_che;

CREATE POLICY fp_var_vtsc_insert_quyen ON public.fp_var_vi_tri_so_che
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.fn_co_quyen_module(
    'quan-ly-nha-so-che/bao-cao-nhan-cong',
    ARRAY['admin', 'all']
  )));

COMMENT ON POLICY fp_var_vtsc_insert_quyen ON public.fp_var_vi_tri_so_che IS
  'Chỉ cấp cao (cap_bac = 1 / chức vụ tt = 1) hoặc admin/all trên module báo cáo nhân công mới thêm vị trí mới (migration 068)';

COMMIT;
NOTIFY pgrst, 'reload schema';
