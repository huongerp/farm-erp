-- =============================================================================
-- Index hỗ trợ tìm kiếm Phiếu đề xuất vật tư (ILIKE %chuỗi%)
-- Chạy trên Supabase SQL Editor sau khi đã bật extension pg_trgm.
--
-- Lưu ý:
-- - ILIKE có wildcard đầu chuỗi thường không dùng được btree; gin_trgm giúp
--   truy vấn chứa/tương tự chuỗi nhanh hơn trên bảng lớn.
-- - View v_phieu_de_xuat_vat_tu_summary không index trực tiếp được; index
--   đặt trên bảng nguồn (phiếu, chi tiết, hàng hóa) giúp JOIN/LATERAL trong view.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Bảng phiếu (số phiếu, ghi chú, trạng thái)
CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_so_phieu_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu USING gin (so_phieu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_ghi_chu_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu USING gin (ghi_chu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_trang_thai_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu USING gin (trang_thai gin_trgm_ops);

-- Chi tiết: thông số, ghi chú, text kéo từ phiếu
CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_thong_so_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING gin (thong_so gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_ghi_chu_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING gin (ghi_chu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_so_phieu_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING gin (so_phieu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_ten_noi_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING gin (ten_noi_de_xuat gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_ten_nguoi_dx_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING gin (ten_nguoi_de_xuat gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_ten_nguoi_duyet_trgm
  ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING gin (ten_nguoi_duyet gin_trgm_ops);

-- Danh mục hàng hóa (tên/mã — JOIN trong view summary & view flat)
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_hang_hoa_ten_trgm
  ON public.fp_mh_danh_sach_hang_hoa USING gin (ten_hang_hoa gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_hang_hoa_ma_trgm
  ON public.fp_mh_danh_sach_hang_hoa USING gin (ma_hang_hoa gin_trgm_ops);

-- Nhân viên / kho (JOIN trong view summary — nếu chưa có index tương tự)
CREATE INDEX IF NOT EXISTS idx_fp_var_nhan_vien_ho_va_ten_trgm
  ON public.fp_var_nhan_vien USING gin (ho_va_ten gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_kho_ten_kho_trgm
  ON public.fp_mh_danh_sach_kho USING gin (ten_kho gin_trgm_ops);
