-- =============================================================================
-- 084-bcnc-so-nhom.sql — Báo cáo nhân công: số nhóm của từng người (chia chuyền chạy năng suất)
--
-- Quản lý chia một chuyền thành Nhóm 1, Nhóm 2… để so năng suất; nhóm đổi theo ngày nên lưu trên
-- từng dòng người của phiếu (_nv). Danh mục nhân viên giữ nhóm mặc định, chép vào phiếu khi chọn tên;
-- sửa nhóm trên phiếu KHÔNG ghi đè danh mục. NULL = chưa chia nhóm.
-- Ghi qua PostgREST, RLS có sẵn của hai bảng đã phủ cột mới.
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/084-bcnc-so-nhom.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_nv ADD COLUMN IF NOT EXISTS so_nhom smallint;
ALTER TABLE public.fp_farm_bao_cao_nhan_cong_nv DROP CONSTRAINT IF EXISTS fp_farm_bcnc_nv_so_nhom_chk;
ALTER TABLE public.fp_farm_bao_cao_nhan_cong_nv
  ADD CONSTRAINT fp_farm_bcnc_nv_so_nhom_chk CHECK (so_nhom IS NULL OR so_nhom BETWEEN 1 AND 9);
COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_nv.so_nhom IS 'Số nhóm trong chuyền ngày hôm đó (1–9) để so năng suất; NULL = chưa chia nhóm';

ALTER TABLE public.fp_var_nhan_vien_so_che ADD COLUMN IF NOT EXISTS so_nhom smallint;
ALTER TABLE public.fp_var_nhan_vien_so_che DROP CONSTRAINT IF EXISTS fp_var_nvsc_so_nhom_chk;
ALTER TABLE public.fp_var_nhan_vien_so_che
  ADD CONSTRAINT fp_var_nvsc_so_nhom_chk CHECK (so_nhom IS NULL OR so_nhom BETWEEN 1 AND 9);
COMMENT ON COLUMN public.fp_var_nhan_vien_so_che.so_nhom IS 'Nhóm mặc định (1–9) — chép vào phiếu khi chọn tên; NULL = chưa chia nhóm';

COMMIT;

NOTIFY pgrst, 'reload schema';
