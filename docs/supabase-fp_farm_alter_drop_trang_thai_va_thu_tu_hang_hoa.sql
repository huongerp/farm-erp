-- =============================================================================
-- Migration: bỏ cột khớp app (module Hàng hóa farm)
-- fp_farm_danh_muc_hang_hoa: DROP trang_thai (app không dùng; vẫn giữ thu_tu)
-- fp_farm_danh_sach_hang_hoa: DROP thu_tu, trang_thai (app không dùng)
-- Chạy một lần trên Supabase → SQL Editor. Nếu cột đã xóa, lệnh IF EXISTS an toàn.
-- Sau khi chạy: deploy code app đã cập nhật (select/insert không còn các cột này).
-- =============================================================================

-- --- Hàng hóa: index phụ thuộc cột sắp xóa ---
DROP INDEX IF EXISTS idx_fp_farm_danh_sach_hang_hoa_thu_tu;
DROP INDEX IF EXISTS idx_fp_farm_danh_sach_hang_hoa_trang_thai;

ALTER TABLE fp_farm_danh_sach_hang_hoa DROP COLUMN IF EXISTS thu_tu;
ALTER TABLE fp_farm_danh_sach_hang_hoa DROP COLUMN IF EXISTS trang_thai;

-- --- Danh mục: chỉ bỏ trạng thái ---
DROP INDEX IF EXISTS idx_fp_farm_danh_muc_hang_hoa_trang_thai;

ALTER TABLE fp_farm_danh_muc_hang_hoa DROP COLUMN IF EXISTS trang_thai;
