-- =============================================================================
-- ALTER fp_farm_phieu_kho_phan_thuoc_chi_tiet: thêm cột pham_cap
-- Prerequisite: fp_farm_danh_sach_hang_hoa.pham_cap
--   (docs/supabase-fp_farm_danh_sach_hang_hoa_add_pham_cap.sql)
-- Sau đó chạy: docs/supabase-v_farm_phieu_kho_phan_thuoc_chi_tiet_flat_add_pham_cap.sql
-- =============================================================================

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet
  ADD COLUMN IF NOT EXISTS pham_cap text;

COMMENT ON COLUMN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet.pham_cap IS
  'Phẩm cấp trên dòng phiếu (snapshot, tùy chọn). Tự điền từ fp_farm_danh_sach_hang_hoa, có thể sửa trên phiếu.';
