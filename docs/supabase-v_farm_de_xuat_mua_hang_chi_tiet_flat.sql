-- =============================================================================
-- View: v_farm_de_xuat_mua_hang_chi_tiet_flat
-- Mục đích: Một dòng = chi tiết đề xuất + mã/tên hàng hóa farm (JOIN master HH)
--           để tab "Chi tiết" tìm kiếm theo tên/mã hàng hóa qua PostgREST (.or / .ilike).
-- Chạy sau: fp_farm_de_xuat_mua_hang_chi_tiet, fp_farm_danh_sach_hang_hoa.
-- =============================================================================

CREATE OR REPLACE VIEW v_farm_de_xuat_mua_hang_chi_tiet_flat AS
SELECT
  ct.*,
  hh.ma_hang_hoa AS ref_ma_hang_hoa,
  hh.ten_hang_hoa AS ref_ten_hang_hoa
FROM fp_farm_de_xuat_mua_hang_chi_tiet ct
LEFT JOIN fp_farm_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

COMMENT ON VIEW v_farm_de_xuat_mua_hang_chi_tiet_flat IS 'Chi tiết đề xuất mua hàng farm phẳng (JOIN mã/tên HH — phục vụ tìm kiếm)';

ALTER VIEW v_farm_de_xuat_mua_hang_chi_tiet_flat SET (security_invoker = true);

GRANT SELECT ON v_farm_de_xuat_mua_hang_chi_tiet_flat TO authenticated;
GRANT SELECT ON v_farm_de_xuat_mua_hang_chi_tiet_flat TO anon;
