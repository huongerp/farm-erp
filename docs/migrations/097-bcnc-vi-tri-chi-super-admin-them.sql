-- =============================================================================
-- 097-bcnc-vi-tri-chi-super-admin-them.sql — Báo cáo nhân công: chỉ super admin mới THÊM vị trí
--
-- Thay luật của migration 068: từ nay quyền `admin` / `all` trên module và cap_bac = 1
-- KHÔNG còn được thêm vị trí mới vào danh mục dùng chung fp_var_vi_tri_so_che.
-- Chỉ tài khoản super admin (fp_var_nhan_vien.is_super_admin = true) mới insert được,
-- qua hàm fn_la_super_admin() có từ migration 070.
-- Người khác chỉ CHỌN vị trí có sẵn; app khớp luật ở core/permissions.ts → coQuyenThemViTri.
--
-- SELECT / UPDATE / DELETE giữ nguyên (chỉ siết THÊM luật INSERT).
-- Idempotent: chạy lại nhiều lần vẫn ra cùng một policy.
--
-- Chạy TRƯỚC frontend mới:
--   bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/097-bcnc-vi-tri-chi-super-admin-them.sql
-- =============================================================================
BEGIN;

DROP POLICY IF EXISTS fp_var_vtsc_insert_quyen ON public.fp_var_vi_tri_so_che;

CREATE POLICY fp_var_vtsc_insert_quyen ON public.fp_var_vi_tri_so_che
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.fn_la_super_admin()));

COMMENT ON POLICY fp_var_vtsc_insert_quyen ON public.fp_var_vi_tri_so_che IS
  'Chỉ tài khoản super admin (is_super_admin) mới thêm vị trí mới (migration 097)';

COMMIT;
NOTIFY pgrst, 'reload schema';
