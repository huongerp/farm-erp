-- =============================================================================
-- View: v_farm_phieu_kho_phan_thuoc_summary
-- Phiếu kho phân thuốc + aggregate + JOIN tên kho / nhân viên
-- Chạy sau: docs/supabase-fp_farm_phieu_kho_phan_thuoc.sql, fp_mh_danh_sach_kho, fp_var_nhan_vien
-- =============================================================================

CREATE OR REPLACE VIEW v_farm_phieu_kho_phan_thuoc_summary AS
SELECT
  pk.*,
  COALESCE(agg.so_dong, 0)::int AS so_dong,
  COALESCE(agg.tong_so_luong, 0)::numeric AS tong_so_luong,
  COALESCE(agg.tong_tien, 0)::numeric AS tong_tien,
  kho_ref.ten_kho AS ref_ten_kho,
  kho_den_ref.ten_kho AS ref_ten_kho_den,
  nv_t.ho_va_ten AS ref_ten_nguoi_tao,
  nv_d.ho_va_ten AS ref_ten_nguoi_duyet
FROM fp_farm_phieu_kho_phan_thuoc pk
LEFT JOIN fp_mh_danh_sach_kho kho_ref ON kho_ref.id = pk.kho_id
LEFT JOIN fp_mh_danh_sach_kho kho_den_ref ON kho_den_ref.id = pk.kho_den_id
LEFT JOIN fp_var_nhan_vien nv_t ON nv_t.id = pk.nguoi_tao_id
LEFT JOIN fp_var_nhan_vien nv_d ON nv_d.id = pk.id_nguoi_duyet
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS so_dong,
    SUM(ct.so_luong) AS tong_so_luong,
    SUM(ct.thanh_tien) AS tong_tien
  FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
  WHERE ct.id_phieu_kho = pk.id
) agg ON true;

COMMENT ON VIEW v_farm_phieu_kho_phan_thuoc_summary IS 'Phiếu kho phân thuốc + aggregate + JOIN tên';

ALTER VIEW v_farm_phieu_kho_phan_thuoc_summary SET (security_invoker = true);

GRANT SELECT ON v_farm_phieu_kho_phan_thuoc_summary TO authenticated;
GRANT SELECT ON v_farm_phieu_kho_phan_thuoc_summary TO anon;
