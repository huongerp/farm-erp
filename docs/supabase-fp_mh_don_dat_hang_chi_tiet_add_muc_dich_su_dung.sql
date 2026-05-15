-- =============================================================================
-- Đơn đặt hàng — bảng con fp_mh_don_dat_hang_chi_tiet: thêm cột "Mục đích sử dụng"
-- Chạy trong Supabase Dashboard → SQL Editor (một lần trên project đã có bảng/view).
--
-- KHÔNG chạy docs/supabase-fp_mh_don_dat_hang.sql cho mục đích này: script đó DROP
-- bảng và sẽ xóa toàn bộ dữ liệu đơn đặt hàng.
-- =============================================================================

ALTER TABLE public.fp_mh_don_dat_hang_chi_tiet
  ADD COLUMN IF NOT EXISTS muc_dich_su_dung text;

COMMENT ON COLUMN public.fp_mh_don_dat_hang_chi_tiet.muc_dich_su_dung IS 'Mục đích sử dụng (dòng chi tiết)';

CREATE OR REPLACE VIEW public.v_don_dat_hang_chi_tiet_flat AS
SELECT
  ct.id AS chi_tiet_id,
  ct.id_don_dat_hang,
  ct.id_hang_hoa,
  ct.so_luong,
  ct.don_vi_tinh,
  ct.don_gia,
  ct.thanh_tien,
  ct.ghi_chu AS chi_tiet_ghi_chu,
  hh.ma_hang_hoa AS ma_hang,
  hh.ten_hang_hoa AS ten_hang,
  s.id,
  s.so_po,
  s.ngay_dat,
  s.ngay_giao_dk,
  s.id_nha_cung_cap,
  s.ten_nha_cung_cap,
  s.id_kho_nhan,
  s.ten_kho_nhan,
  s.id_phieu_de_xuat_vat_tu,
  s.id_nguoi_dat,
  s.id_nguoi_duyet,
  s.ghi_chu,
  s.trang_thai,
  s.tg_tao,
  s.tg_cap_nhat,
  s.so_phieu_de_xuat_ref,
  s.ref_ma_nha_cung_cap,
  s.ref_ten_nha_cung_cap,
  s.ref_ten_kho_nhan,
  s.ref_ten_nguoi_dat,
  s.ref_ma_nguoi_dat,
  s.ref_ten_nguoi_duyet,
  s.ref_ma_nguoi_duyet,
  ct.phan_loai,
  ct.muc_dich_su_dung
FROM public.fp_mh_don_dat_hang_chi_tiet ct
JOIN public.v_don_dat_hang_summary s ON s.id = ct.id_don_dat_hang
LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

COMMENT ON VIEW public.v_don_dat_hang_chi_tiet_flat IS 'Chi tiết đơn đặt hàng phẳng (JOIN summary + mã HH + phân loại + mục đích sử dụng dòng chi tiết)';

ALTER VIEW public.v_don_dat_hang_chi_tiet_flat SET (security_invoker = true);

GRANT SELECT ON public.v_don_dat_hang_chi_tiet_flat TO authenticated;
GRANT SELECT ON public.v_don_dat_hang_chi_tiet_flat TO anon;
