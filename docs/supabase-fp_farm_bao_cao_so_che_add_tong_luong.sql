-- ==========================================================
-- Farm: Báo cáo sơ chế — thêm cột Tổng lương nhập tay
-- Chạy sau: docs/supabase-fp_farm_bao_cao_so_che.sql
-- Idempotent: dùng ADD COLUMN IF NOT EXISTS
-- ==========================================================

ALTER TABLE public.fp_farm_bao_cao_so_che
  ADD COLUMN IF NOT EXISTS tong_luong numeric(18, 4) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che.tong_luong
  IS 'Tổng lương nhập tay cho section Năng suất và lương';
