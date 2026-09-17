-- =============================================================================
-- Index hỗ trợ tìm kiếm Đề xuất mua hàng farm (ILIKE %chuỗi%)
-- Chạy sau fp_farm_de_xuat_mua_hang. Cần extension pg_trgm.
--
-- Lưu ý: view v_farm_de_xuat_mua_hang_summary không index trực tiếp được;
-- index đặt trên bảng nguồn (phiếu, chi tiết, hàng hóa) giúp JOIN/LATERAL trong view.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Bảng phiếu
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_so_phieu_trgm
  ON public.fp_farm_de_xuat_mua_hang USING gin (so_phieu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_ghi_chu_trgm
  ON public.fp_farm_de_xuat_mua_hang USING gin (ghi_chu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_trang_thai_trgm
  ON public.fp_farm_de_xuat_mua_hang USING gin (trang_thai gin_trgm_ops);

-- Chi tiết: thông số, ghi chú, trao đổi, tiến độ + text kéo từ phiếu
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_thong_so_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (thong_so gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_ghi_chu_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ghi_chu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_trao_doi_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (trao_doi gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_ten_tien_do_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_tien_do_mh gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_so_phieu_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (so_phieu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_ten_noi_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_noi_de_xuat gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_ten_nguoi_dx_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_nguoi_de_xuat gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mh_ct_ten_nguoi_duyet_trgm
  ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_nguoi_duyet gin_trgm_ops);

-- Danh mục hàng hóa farm (JOIN trong view summary & view flat)
CREATE INDEX IF NOT EXISTS idx_fp_farm_danh_sach_hang_hoa_ten_trgm
  ON public.fp_farm_danh_sach_hang_hoa USING gin (ten_hang_hoa gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_farm_danh_sach_hang_hoa_ma_trgm
  ON public.fp_farm_danh_sach_hang_hoa USING gin (ma_hang_hoa gin_trgm_ops);
