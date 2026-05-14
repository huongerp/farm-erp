-- =============================================================================
-- Phiếu kho (nhập): liên kết tùy chọn tới đơn đặt hàng (fp_mh_don_dat_hang)
--
-- Chạy TOÀN BỘ file này trên Supabase SQL Editor (một lần), theo đúng thứ tự.
--
-- Lỗi thường gặp nếu làm sai thứ tự:
--   42P16 "cannot change name of view column ..." → do CREATE OR REPLACE VIEW
--        khi bảng fp_mh_phieu_kho đã có thêm cột (pk.* đổi ordinal). Cần DROP VIEW rồi CREATE.
--   42703 "column pk.id_don_dat_hang does not exist" → đã chạy CREATE VIEW khi bảng chưa có cột.
--        Phải chạy mục (1) ALTER bảng trước mục (2) DROP/CREATE view.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- (1) Bảng: thêm cột + index (chạy TRƯỚC view)
-- -----------------------------------------------------------------------------
ALTER TABLE public.fp_mh_phieu_kho
  ADD COLUMN IF NOT EXISTS id_don_dat_hang bigint NULL
  REFERENCES public.fp_mh_don_dat_hang(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_id_don_dat_hang
  ON public.fp_mh_phieu_kho (id_don_dat_hang)
  WHERE id_don_dat_hang IS NOT NULL;

COMMENT ON COLUMN public.fp_mh_phieu_kho.id_don_dat_hang IS
  'Đơn đặt hàng nguồn (tùy chọn), có ý nghĩa khi loai = nhập → fp_mh_don_dat_hang(id)';

-- -----------------------------------------------------------------------------
-- (2) Gỡ view cũ rồi tạo lại (tránh 42P16; CASCADE nếu có object phụ thuộc)
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_phieu_kho_chi_tiet_flat CASCADE;
DROP VIEW IF EXISTS public.v_phieu_kho_summary CASCADE;

-- -----------------------------------------------------------------------------
-- (3) v_phieu_kho_summary
-- -----------------------------------------------------------------------------
CREATE VIEW public.v_phieu_kho_summary AS
SELECT
  pk.*,
  COALESCE(agg.so_dong, 0)::int AS so_dong,
  COALESCE(agg.tong_so_luong, 0)::numeric AS tong_so_luong,
  COALESCE(agg.tong_tien, 0)::numeric AS tong_tien,
  kho_ref.ten_kho AS ref_ten_kho,
  kho_den_ref.ten_kho AS ref_ten_kho_den,
  ncc.ten_doi_tac AS ref_ten_nha_cung_cap,
  kh.ten_doi_tac AS ref_ten_khach_hang,
  nv_t.ho_va_ten AS ref_ten_nguoi_tao,
  nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
  dd.so_po AS ref_so_po_don_dat_hang
FROM public.fp_mh_phieu_kho pk
LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON kho_ref.id = pk.kho_id
LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON kho_den_ref.id = pk.kho_den_id
LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc ON ncc.id = pk.id_nha_cung_cap
LEFT JOIN public.fp_mh_danh_sach_doi_tac kh ON kh.id = pk.id_khach_hang
LEFT JOIN public.fp_var_nhan_vien nv_t ON nv_t.id = pk.nguoi_tao_id
LEFT JOIN public.fp_var_nhan_vien nv_d ON nv_d.id = pk.id_nguoi_duyet
LEFT JOIN public.fp_mh_don_dat_hang dd ON dd.id = pk.id_don_dat_hang
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS so_dong,
    SUM(ct.so_luong) AS tong_so_luong,
    SUM(ct.thanh_tien) AS tong_tien
  FROM public.fp_mh_phieu_kho_chi_tiet ct
  WHERE ct.id_phieu_kho = pk.id
) agg ON true;

COMMENT ON VIEW public.v_phieu_kho_summary IS 'Phiếu kho + aggregate + JOIN tên (giảm egress app)';

ALTER VIEW public.v_phieu_kho_summary SET (security_invoker = true);

GRANT SELECT ON public.v_phieu_kho_summary TO authenticated;
GRANT SELECT ON public.v_phieu_kho_summary TO anon;

-- -----------------------------------------------------------------------------
-- (4) v_phieu_kho_chi_tiet_flat
-- -----------------------------------------------------------------------------
CREATE VIEW public.v_phieu_kho_chi_tiet_flat AS
SELECT
  ct.id AS chi_tiet_id,
  ct.id_phieu_kho,
  ct.id_hang_hoa,
  ct.ten_hang_hoa,
  ct.don_vi_tinh,
  ct.so_luong,
  ct.don_gia,
  ct.thanh_tien,
  ct.so_lot,
  ct.ghi_chu,
  ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
  ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
  ct.tg_tao AS chi_tiet_tg_tao,
  ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
  pk.id AS phieu_id,
  pk.so_phieu,
  pk.ngay,
  pk.loai,
  pk.kho_id,
  pk.ten_kho,
  pk.kho_den_id,
  pk.ten_kho_den,
  pk.id_nha_cung_cap,
  pk.id_khach_hang,
  pk.trang_thai,
  pk.mo_ta,
  pk.trao_doi,
  pk.nguoi_tao_id AS phieu_nguoi_tao_id,
  pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
  pk.id_nguoi_duyet,
  pk.tg_tao AS phieu_tg_tao,
  pk.tg_cap_nhat AS phieu_tg_cap_nhat,
  pk.id_don_dat_hang,
  hh.ma_hang_hoa AS ma_hang,
  dd.so_po AS so_po_don_dat_hang
FROM public.fp_mh_phieu_kho_chi_tiet ct
JOIN public.fp_mh_phieu_kho pk ON pk.id = ct.id_phieu_kho
LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa
LEFT JOIN public.fp_mh_don_dat_hang dd ON dd.id = pk.id_don_dat_hang;

COMMENT ON VIEW public.v_phieu_kho_chi_tiet_flat IS 'Chi tiết phiếu kho phẳng (JOIN header + mã HH + đơn đặt hàng)';

ALTER VIEW public.v_phieu_kho_chi_tiet_flat SET (security_invoker = true);

GRANT SELECT ON public.v_phieu_kho_chi_tiet_flat TO authenticated;
GRANT SELECT ON public.v_phieu_kho_chi_tiet_flat TO anon;
