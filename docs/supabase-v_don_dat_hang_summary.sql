-- =============================================================================
-- View: v_don_dat_hang_summary
-- Mục đích: Đơn đặt hàng + so phiếu đề xuất + JOIN NCC / kho / người đặt / duyệt
--           để app không cần getKhoRef + getDoiTacRef + getEmployeesRef cho danh sách.
-- Chạy trên Supabase SQL Editor sau khi đã có fp_mh_don_dat_hang, fp_mh_phieu_de_xuat_vat_tu.
-- =============================================================================

CREATE OR REPLACE VIEW v_don_dat_hang_summary AS
SELECT
  d.*,
  pdx.so_phieu AS so_phieu_de_xuat_ref,
  ncc.ma_doi_tac AS ref_ma_nha_cung_cap,
  COALESCE(d.ten_nha_cung_cap, ncc.ten_doi_tac) AS ref_ten_nha_cung_cap,
  COALESCE(d.ten_kho_nhan, kho_ref.ten_kho) AS ref_ten_kho_nhan,
  nv_dat.ho_va_ten AS ref_ten_nguoi_dat,
  ('NV' || nv_dat.id::text) AS ref_ma_nguoi_dat,
  nv_duyet.ho_va_ten AS ref_ten_nguoi_duyet,
  CASE WHEN d.id_nguoi_duyet IS NOT NULL THEN 'NV' || d.id_nguoi_duyet::text ELSE NULL END AS ref_ma_nguoi_duyet
FROM fp_mh_don_dat_hang d
LEFT JOIN fp_mh_phieu_de_xuat_vat_tu pdx ON pdx.id = d.id_phieu_de_xuat_vat_tu
LEFT JOIN fp_mh_danh_sach_doi_tac ncc ON ncc.id = d.id_nha_cung_cap AND ncc.loai_doi_tac = 'nha_cung_cap'
LEFT JOIN fp_mh_danh_sach_kho kho_ref ON kho_ref.id = d.id_kho_nhan
LEFT JOIN fp_var_nhan_vien nv_dat ON nv_dat.id = d.id_nguoi_dat
LEFT JOIN fp_var_nhan_vien nv_duyet ON nv_duyet.id = d.id_nguoi_duyet;

COMMENT ON VIEW v_don_dat_hang_summary IS 'Đơn đặt hàng + so phiếu đề xuất + JOIN tên (giảm egress app)';

ALTER VIEW v_don_dat_hang_summary SET (security_invoker = true);

GRANT SELECT ON v_don_dat_hang_summary TO authenticated;
GRANT SELECT ON v_don_dat_hang_summary TO anon;
