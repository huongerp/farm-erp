-- =============================================================================
-- View: v_phieu_de_xuat_vat_tu_chi_tiet_flat
-- Mục đích: Một dòng = chi tiết phiếu + mã/tên hàng hóa (JOIN master HH)
--           để tab "Chi tiết" tìm kiếm theo tên/mã sản phẩm qua PostgREST (.or / .ilike).
-- Chạy sau: fp_mh_phieu_de_xuat_vat_tu_chi_tiet, fp_mh_danh_sach_hang_hoa.
-- =============================================================================

CREATE OR REPLACE VIEW v_phieu_de_xuat_vat_tu_chi_tiet_flat AS
SELECT
  ct.*,
  hh.ma_hang_hoa AS ref_ma_hang_hoa,
  hh.ten_hang_hoa AS ref_ten_hang_hoa
FROM fp_mh_phieu_de_xuat_vat_tu_chi_tiet ct
LEFT JOIN fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

COMMENT ON VIEW v_phieu_de_xuat_vat_tu_chi_tiet_flat IS 'Chi tiết đề xuất vật tư phẳng (JOIN mã/tên HH — phục vụ tìm kiếm)';

ALTER VIEW v_phieu_de_xuat_vat_tu_chi_tiet_flat SET (security_invoker = true);

GRANT SELECT ON v_phieu_de_xuat_vat_tu_chi_tiet_flat TO authenticated;
GRANT SELECT ON v_phieu_de_xuat_vat_tu_chi_tiet_flat TO anon;
