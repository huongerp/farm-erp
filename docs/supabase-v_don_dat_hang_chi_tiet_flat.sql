-- =============================================================================
-- View: v_don_dat_hang_chi_tiet_flat
-- Mục đích: Một dòng = một dòng fp_mh_don_dat_hang_chi_tiet + header (summary)
--           + mã/tên hàng — dùng tab "Chi tiết" và export (giống v_phieu_kho_chi_tiet_flat).
-- Chạy sau: docs/supabase-v_don_dat_hang_summary.sql, fp_mh_don_dat_hang_chi_tiet.
-- =============================================================================

CREATE OR REPLACE VIEW v_don_dat_hang_chi_tiet_flat AS
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
  s.ref_ma_nguoi_duyet
FROM fp_mh_don_dat_hang_chi_tiet ct
JOIN v_don_dat_hang_summary s ON s.id = ct.id_don_dat_hang
LEFT JOIN fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

COMMENT ON VIEW v_don_dat_hang_chi_tiet_flat IS 'Chi tiết đơn đặt hàng phẳng (JOIN summary + mã HH)';

ALTER VIEW v_don_dat_hang_chi_tiet_flat SET (security_invoker = true);

GRANT SELECT ON v_don_dat_hang_chi_tiet_flat TO authenticated;
GRANT SELECT ON v_don_dat_hang_chi_tiet_flat TO anon;
