-- =============================================================================
-- View: v_farm_de_xuat_mua_hang_summary
-- Mục đích: Phiếu đề xuất mua hàng farm + aggregate chi tiết + JOIN kho / nhân viên
--           để app không cần getKhoRef + getEmployeesRef mỗi trang danh sách.
-- Chạy sau: fp_farm_de_xuat_mua_hang (+ chi tiết), fp_farm_danh_sach_hang_hoa.
-- =============================================================================

CREATE OR REPLACE VIEW v_farm_de_xuat_mua_hang_summary AS
SELECT
  p.*,
  kho_ref.ten_kho AS ref_ten_noi_de_xuat,
  nv_dx.ho_va_ten AS ref_ten_nguoi_de_xuat,
  ('NV' || nv_dx.id::text) AS ref_ma_nguoi_de_xuat,
  nv_du.ho_va_ten AS ref_ten_nguoi_duyet,
  CASE WHEN p.id_nguoi_duyet IS NOT NULL THEN 'NV' || p.id_nguoi_duyet::text ELSE NULL END AS ref_ma_nguoi_duyet,
  COALESCE(agg.so_dong, 0)::int AS so_dong,
  COALESCE(agg.tong_so_luong, 0)::numeric AS tong_so_luong,
  COALESCE(agg.ref_chi_tiet_tim_kiem, '') AS ref_chi_tiet_tim_kiem,
  trim(
    both ' ' FROM concat_ws(
      ' ',
      NULLIF(btrim(COALESCE(p.ngay::text, '')), ''),
      NULLIF(btrim(COALESCE(p.ngay_can::text, '')), ''),
      NULLIF(btrim(COALESCE(p.tg_tao::text, '')), ''),
      NULLIF(btrim(COALESCE(p.tg_cap_nhat::text, '')), '')
    )
  ) AS ref_ngay_va_thoi_gian_tim_kiem
FROM fp_farm_de_xuat_mua_hang p
LEFT JOIN fp_mh_danh_sach_kho kho_ref ON kho_ref.id = p.id_noi_de_xuat
LEFT JOIN fp_var_nhan_vien nv_dx ON nv_dx.id = p.id_nguoi_de_xuat
LEFT JOIN fp_var_nhan_vien nv_du ON nv_du.id = p.id_nguoi_duyet
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS so_dong,
    SUM(ct.so_luong) AS tong_so_luong,
    NULLIF(
      string_agg(
        DISTINCT concat_ws(
          ' ',
          NULLIF(btrim(COALESCE(hh.ma_hang_hoa, '')), ''),
          NULLIF(btrim(COALESCE(hh.ten_hang_hoa, '')), ''),
          NULLIF(btrim(COALESCE(ct.thong_so, '')), ''),
          NULLIF(btrim(COALESCE(ct.ghi_chu, '')), '')
        ),
        ' '
      ),
      ''
    ) AS ref_chi_tiet_tim_kiem
  FROM fp_farm_de_xuat_mua_hang_chi_tiet ct
  LEFT JOIN fp_farm_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa
  WHERE ct.id_de_xuat_mua_hang = p.id
) agg ON true;

COMMENT ON VIEW v_farm_de_xuat_mua_hang_summary IS 'Đề xuất mua hàng farm + aggregate + JOIN tên (giảm egress app)';
COMMENT ON COLUMN v_farm_de_xuat_mua_hang_summary.ref_chi_tiet_tim_kiem IS 'Chuỗi gộp mã/tên HH + thông số/ghi chú dòng chi tiết — tìm kiếm danh sách phiếu theo hàng hóa';
COMMENT ON COLUMN v_farm_de_xuat_mua_hang_summary.ref_ngay_va_thoi_gian_tim_kiem IS 'Ngày / ngày cần / tg_tao / tg_cap_nhat dạng text — dùng tìm kiếm';

ALTER VIEW v_farm_de_xuat_mua_hang_summary SET (security_invoker = true);

GRANT SELECT ON v_farm_de_xuat_mua_hang_summary TO authenticated;
GRANT SELECT ON v_farm_de_xuat_mua_hang_summary TO anon;
