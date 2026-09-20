-- =============================================================================
-- Sửa lỗi: PostgREST báo
--   [42703] column v_farm_phieu_kho_phan_thuoc_summary.id_de_xuat_mua_hang does not exist
--
-- Nguyên nhân: view cũ khai bằng `pk.*` nên danh sách cột bị "đóng băng" lúc
-- CREATE. Hai cột id_de_xuat_mua_hang / so_phieu_de_xuat được thêm vào bảng SAU
-- đó (docs/supabase-fp_farm_phieu_kho_phan_thuoc_add_de_xuat_link.sql) nên
-- không xuất hiện trong view.
--
-- Cách sửa: liệt kê cột TƯỜNG MINH, giữ nguyên thứ tự cũ và nối 2 cột mới vào
-- cuối → CREATE OR REPLACE chạy được, không cần DROP (giữ nguyên GRANT).
-- File này thay thế docs/supabase-v_farm_phieu_kho_phan_thuoc_summary.sql
-- làm định nghĩa chuẩn của view.
--
-- Chạy sau: supabase-v_farm_phieu_kho_phan_thuoc_summary.sql,
--           supabase-fp_farm_phieu_kho_phan_thuoc_add_de_xuat_link.sql
-- =============================================================================

CREATE OR REPLACE VIEW v_farm_phieu_kho_phan_thuoc_summary AS
SELECT
  pk.id,
  pk.so_phieu,
  pk.ngay,
  pk.loai,
  pk.kho_id,
  pk.ten_kho,
  pk.kho_den_id,
  pk.ten_kho_den,
  pk.trang_thai,
  pk.mo_ta,
  pk.trao_doi,
  pk.id_nguoi_duyet,
  pk.nguoi_tao_id,
  pk.ten_nguoi_tao,
  pk.tg_tao,
  pk.tg_cap_nhat,
  COALESCE(agg.so_dong, 0)::int AS so_dong,
  COALESCE(agg.tong_so_luong, 0)::numeric AS tong_so_luong,
  COALESCE(agg.tong_tien, 0)::numeric AS tong_tien,
  kho_ref.ten_kho AS ref_ten_kho,
  kho_den_ref.ten_kho AS ref_ten_kho_den,
  nv_t.ho_va_ten AS ref_ten_nguoi_tao,
  nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
  -- 2 cột mới, BẮT BUỘC nối vào cuối để CREATE OR REPLACE không đổi thứ tự cột cũ
  pk.id_de_xuat_mua_hang,
  pk.so_phieu_de_xuat
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

COMMENT ON VIEW v_farm_phieu_kho_phan_thuoc_summary IS 'Phiếu kho phân thuốc + aggregate + JOIN tên + liên kết đề xuất mua hàng';

ALTER VIEW v_farm_phieu_kho_phan_thuoc_summary SET (security_invoker = true);

GRANT SELECT ON v_farm_phieu_kho_phan_thuoc_summary TO authenticated;
GRANT SELECT ON v_farm_phieu_kho_phan_thuoc_summary TO anon;

-- Nạp lại schema cache của PostgREST
NOTIFY pgrst, 'reload schema';
