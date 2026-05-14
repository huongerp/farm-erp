-- =============================================================================
-- View: v_phieu_kho_chi_tiet_flat
-- Mục đích: JOIN chi tiết + header + mã hàng (+ đơn đặt hàng nếu có)
--
-- Khuyến nghị: chạy docs/supabase-update-phieu-kho-id-don-dat-hang.sql một lần.
--
-- Nếu chạy riêng file này: fp_mh_phieu_kho phải đã có cột id_don_dat_hang (ALTER trước).
-- =============================================================================

DROP VIEW IF EXISTS public.v_phieu_kho_chi_tiet_flat CASCADE;

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
