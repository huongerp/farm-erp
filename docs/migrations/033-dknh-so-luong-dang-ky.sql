-- =============================================================================
-- 033-dknh-so-luong-dang-ky.sql — Đăng ký nhận hàng: số lượng khai lúc đăng ký xe
-- Nhập tay ngay dưới "Loại hàng hoá" trên form. Khác "SL xuất" (tong_so_luong) là tổng số thùng
-- của các cây hàng quét lên xe (fp_farm_dang_ky_nhan_hang_ct). GRANT/RLS/nhật ký đã có trên bảng.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-033
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/033-dknh-so-luong-dang-ky.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_dang_ky_nhan_hang
  ADD COLUMN so_luong_dang_ky numeric(14,2),
  ADD CONSTRAINT fp_farm_dknh_so_luong_dang_ky_check CHECK (so_luong_dang_ky IS NULL OR so_luong_dang_ky >= 0);

COMMENT ON COLUMN public.fp_farm_dang_ky_nhan_hang.so_luong_dang_ky IS
  'Số lượng khai lúc đăng ký xe (nhập tay, tuỳ chọn) — khác tổng SL xuất từ cây hàng quét';

COMMIT;

NOTIFY pgrst, 'reload schema';
