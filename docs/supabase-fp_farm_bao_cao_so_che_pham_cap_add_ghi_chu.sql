-- ==========================================================
-- Farm: Báo cáo sơ chế — thêm ghi chú theo dòng phẩm cấp
-- Chạy sau: docs/supabase-fp_farm_bao_cao_so_che_add_pham_cap.sql
-- Idempotent: dùng ADD COLUMN IF NOT EXISTS
-- ==========================================================

ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap
  ADD COLUMN IF NOT EXISTS ghi_chu text;

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.ghi_chu
  IS 'Ghi chú theo dòng phẩm cấp / loại thùng';
