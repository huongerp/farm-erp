-- =============================================================================
-- View: v_phieu_kho_summary
-- Mục đích: Phiếu kho + aggregate chi tiết + JOIN tên kho / đối tác / nhân viên
--           để app không cần gọi getKhoRef + getDoiTacRef + getEmployeesRef mỗi trang.
-- Chạy trên Supabase SQL Editor sau khi đã có bảng phiếu kho, kho, đối tác, nhân viên.
--
-- Lưu ý Postgres: CREATE OR REPLACE VIEW không được đổi *tên* cột ở cùng vị trí ordinal
-- (view cũ thường là pk.* rồi so_dong, tong_so_luong, tong_tien). Cột ref_* phải đặt
-- sau các cột aggregate đó để REPLACE tương thích; nếu vẫn lỗi schema, dùng:
--   DROP VIEW IF EXISTS public.v_phieu_kho_summary CASCADE;
-- rồi chạy lại CREATE (xem view phụ thuộc).
-- =============================================================================

CREATE OR REPLACE VIEW v_phieu_kho_summary AS
SELECT
  pk.*,
  COALESCE(agg.so_dong, 0)::int AS so_dong,
  COALESCE(agg.tong_so_luong, 0)::numeric AS tong_so_luong,
  COALESCE(agg.tong_tien, 0)::numeric AS tong_tien,
  kho_ref.ten_kho AS ref_ten_kho,
  kho_den_ref.ten_kho AS ref_ten_kho_den,
  ncc.ten_doi_tac AS ref_ten_nha_cung_cap,
  kh.ten_doi_tac AS ref_ten_khach_hang,
  nv_t.ho_va_ten AS ref_ten_nguoi_tao,
  nv_d.ho_va_ten AS ref_ten_nguoi_duyet
FROM fp_mh_phieu_kho pk
LEFT JOIN fp_mh_danh_sach_kho kho_ref ON kho_ref.id = pk.kho_id
LEFT JOIN fp_mh_danh_sach_kho kho_den_ref ON kho_den_ref.id = pk.kho_den_id
LEFT JOIN fp_mh_danh_sach_doi_tac ncc ON ncc.id = pk.id_nha_cung_cap
LEFT JOIN fp_mh_danh_sach_doi_tac kh ON kh.id = pk.id_khach_hang
LEFT JOIN fp_var_nhan_vien nv_t ON nv_t.id = pk.nguoi_tao_id
LEFT JOIN fp_var_nhan_vien nv_d ON nv_d.id = pk.id_nguoi_duyet
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS so_dong,
    SUM(ct.so_luong) AS tong_so_luong,
    SUM(ct.thanh_tien) AS tong_tien
  FROM fp_mh_phieu_kho_chi_tiet ct
  WHERE ct.id_phieu_kho = pk.id
) agg ON true;

COMMENT ON VIEW v_phieu_kho_summary IS 'Phiếu kho + aggregate + JOIN tên (giảm egress app)';

ALTER VIEW v_phieu_kho_summary SET (security_invoker = true);

GRANT SELECT ON v_phieu_kho_summary TO authenticated;
GRANT SELECT ON v_phieu_kho_summary TO anon;
