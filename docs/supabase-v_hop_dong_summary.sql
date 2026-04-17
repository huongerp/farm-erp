-- =============================================================================
-- View: v_hop_dong_summary
-- Hợp đồng + JOIN NCC, người tạo + tổng đã thanh toán (SUM dòng con)
-- Chạy sau docs/supabase-fp_mh_hop_dong.sql
--
-- App dùng select('*') trên view — sau khi chạy script này, các cột tổng hợp
-- (so_dot_thanh_toan, tong_cay_da_giao, tien_con_lai, cay_con_lai, …) sẽ có
-- trong API. Nếu trước đó gặp 400 do liệt kê cột chưa tồn tại, deploy xong là hết.
-- =============================================================================

CREATE OR REPLACE VIEW v_hop_dong_summary AS
SELECT
  h.*,
  COALESCE(h.ten_nha_cung_cap, ncc.ten_doi_tac) AS ref_ten_nha_cung_cap,
  ncc.ma_doi_tac AS ref_ma_nha_cung_cap,
  nv.ho_va_ten AS ref_ten_nguoi_tao,
  COALESCE(
    (SELECT SUM(ct.so_tien) FROM fp_mh_hop_dong_ct ct WHERE ct.id_hop_dong = h.id),
    0
  )::numeric(18, 2) AS tong_da_thanh_toan,
  COALESCE(
    (SELECT COUNT(*)::integer FROM fp_mh_hop_dong_ct ct WHERE ct.id_hop_dong = h.id),
    0
  ) AS so_dot_thanh_toan,
  COALESCE(
    (SELECT SUM(ct.so_cay_thuc_nhan) FROM fp_mh_hop_dong_ct ct WHERE ct.id_hop_dong = h.id),
    0
  )::numeric(18, 2) AS tong_cay_da_giao,
  (
    COALESCE(h.thanh_tien, 0)
    - COALESCE(
        (SELECT SUM(ct.so_tien) FROM fp_mh_hop_dong_ct ct WHERE ct.id_hop_dong = h.id),
        0
      )
  )::numeric(18, 2) AS tien_con_lai,
  (
    COALESCE(h.so_luong_cay, 0)
    - COALESCE(
        (SELECT SUM(ct.so_cay_thuc_nhan) FROM fp_mh_hop_dong_ct ct WHERE ct.id_hop_dong = h.id),
        0
      )
  )::numeric(18, 2) AS cay_con_lai
FROM fp_mh_hop_dong h
LEFT JOIN fp_mh_danh_sach_doi_tac ncc ON ncc.id = h.id_nha_cung_cap AND ncc.loai_doi_tac = 'nha_cung_cap'
LEFT JOIN fp_var_nhan_vien nv ON nv.id = h.id_nguoi_tao;

COMMENT ON VIEW v_hop_dong_summary IS 'Hợp đồng + tên NCC/người tạo + tổng thanh toán';

ALTER VIEW v_hop_dong_summary SET (security_invoker = true);

GRANT SELECT ON v_hop_dong_summary TO authenticated;
GRANT SELECT ON v_hop_dong_summary TO anon;
