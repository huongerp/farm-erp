-- =============================================================================
-- 064-bcsc-kpi-3-cot-thuong.sql — Báo cáo sơ chế: 3 cột thưởng trong bảng KPI / thưởng
--
-- Thêm Thưởng QL, Thưởng nhóm tỉa, Thưởng nhóm CP — nhập tay, độc lập với `tien_thuong`.
-- Cột mới NOT NULL DEFAULT 0 → dòng cũ tự có 0, insert cũ vẫn chạy. Bảng đã có RLS / GRANT.
--
-- PHẢI chạy TRƯỚC khi deploy frontend (frontend select 3 cột này sẽ lỗi nếu cột chưa có).
--
-- Chạy: bash scripts/db-backup.sh truoc-064
--       bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/064-bcsc-kpi-3-cot-thuong.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_farm_bao_cao_so_che_kpi
  ADD COLUMN IF NOT EXISTS thuong_ql       numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thuong_nhom_tia numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thuong_nhom_cp  numeric(18,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_kpi.thuong_ql IS 'Thưởng quản lý (VNĐ, nhập tay)';
COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_kpi.thuong_nhom_tia IS 'Thưởng nhóm tỉa (VNĐ, nhập tay)';
COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_kpi.thuong_nhom_cp IS 'Thưởng nhóm CP (VNĐ, nhập tay)';

COMMIT;

NOTIFY pgrst, 'reload schema';
