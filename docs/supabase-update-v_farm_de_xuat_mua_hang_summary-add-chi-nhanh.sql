-- =============================================================================
-- Update view v_farm_de_xuat_mua_hang_summary: thêm ref_id_chi_nhanh_noi_de_xuat
-- Mục đích: drawer chi tiết Đề xuất mua hàng cần biết chi nhánh của nơi đề xuất
-- (kho) để prefill khi tạo phiếu thu/chi quỹ trong section "Thu chi liên quan"
-- mà không phải gọi thêm danh sách kho.
--
-- CREATE OR REPLACE VIEW chỉ hợp lệ khi THÊM CỘT Ở CUỐI, giữ nguyên tên/thứ tự
-- các cột cũ (nếu không sẽ lỗi 42P16) — nên phải chép lại toàn bộ định nghĩa gốc
-- từ docs/supabase-v_farm_de_xuat_mua_hang_summary.sql và chỉ nối thêm cột mới.
-- Chạy sau: supabase-v_farm_de_xuat_mua_hang_summary.sql
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
  ) AS ref_ngay_va_thoi_gian_tim_kiem,
  -- CỘT MỚI (phải ở cuối): chi nhánh của kho nơi đề xuất
  kho_ref.chi_nhanh_id AS ref_id_chi_nhanh_noi_de_xuat
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

COMMENT ON COLUMN v_farm_de_xuat_mua_hang_summary.ref_id_chi_nhanh_noi_de_xuat IS 'Chi nhánh của kho nơi đề xuất → prefill quỹ thu chi liên quan';

ALTER VIEW v_farm_de_xuat_mua_hang_summary SET (security_invoker = true);

GRANT SELECT ON v_farm_de_xuat_mua_hang_summary TO authenticated;
GRANT SELECT ON v_farm_de_xuat_mua_hang_summary TO anon;
