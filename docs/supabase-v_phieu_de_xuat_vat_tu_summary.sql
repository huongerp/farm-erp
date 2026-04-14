-- =============================================================================
-- View: v_phieu_de_xuat_vat_tu_summary
-- Mục đích: Phiếu đề xuất + aggregate chi tiết + JOIN kho / nhân viên
--           để app không cần getKhoRef + getEmployeesRef mỗi trang danh sách.
-- Chạy trên Supabase SQL Editor sau khi đã có bảng phiếu + chi tiết đề xuất.
-- =============================================================================

CREATE OR REPLACE VIEW v_phieu_de_xuat_vat_tu_summary AS
SELECT
  p.*,
  kho_ref.ten_kho AS ref_ten_noi_de_xuat,
  nv_dx.ho_va_ten AS ref_ten_nguoi_de_xuat,
  ('NV' || nv_dx.id::text) AS ref_ma_nguoi_de_xuat,
  nv_du.ho_va_ten AS ref_ten_nguoi_duyet,
  CASE WHEN p.id_nguoi_duyet IS NOT NULL THEN 'NV' || p.id_nguoi_duyet::text ELSE NULL END AS ref_ma_nguoi_duyet,
  COALESCE(agg.so_dong, 0)::int AS so_dong,
  COALESCE(agg.tong_so_luong, 0)::numeric AS tong_so_luong
FROM fp_mh_phieu_de_xuat_vat_tu p
LEFT JOIN fp_mh_danh_sach_kho kho_ref ON kho_ref.id = p.id_noi_de_xuat
LEFT JOIN fp_var_nhan_vien nv_dx ON nv_dx.id = p.id_nguoi_de_xuat
LEFT JOIN fp_var_nhan_vien nv_du ON nv_du.id = p.id_nguoi_duyet
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS so_dong,
    SUM(ct.so_luong) AS tong_so_luong
  FROM fp_mh_phieu_de_xuat_vat_tu_chi_tiet ct
  WHERE ct.id_phieu_de_xuat_vat_tu = p.id
) agg ON true;

COMMENT ON VIEW v_phieu_de_xuat_vat_tu_summary IS 'Phiếu đề xuất vật tư + aggregate + JOIN tên (giảm egress app)';

ALTER VIEW v_phieu_de_xuat_vat_tu_summary SET (security_invoker = true);

GRANT SELECT ON v_phieu_de_xuat_vat_tu_summary TO authenticated;
GRANT SELECT ON v_phieu_de_xuat_vat_tu_summary TO anon;
