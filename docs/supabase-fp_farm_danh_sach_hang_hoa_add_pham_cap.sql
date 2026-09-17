-- =============================================================================
-- ALTER fp_farm_danh_sach_hang_hoa: thêm cột pham_cap (phẩm cấp, tùy chọn)
-- Đối xứng với fp_mh_danh_sach_hang_hoa.pham_cap bên Mua hàng.
-- =============================================================================

ALTER TABLE public.fp_farm_danh_sach_hang_hoa
  ADD COLUMN IF NOT EXISTS pham_cap text;

COMMENT ON COLUMN public.fp_farm_danh_sach_hang_hoa.pham_cap IS
  'Phẩm cấp (tùy chọn). Text tự do; app gợi ý từ các giá trị đã có.';
