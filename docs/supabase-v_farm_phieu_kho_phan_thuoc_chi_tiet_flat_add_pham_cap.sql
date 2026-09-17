-- =============================================================================
-- View v_farm_phieu_kho_phan_thuoc_chi_tiet_flat — thêm cột pham_cap
-- Chạy SAU docs/supabase-fp_farm_phieu_kho_phan_thuoc_chi_tiet_add_pham_cap.sql
-- pham_cap = snapshot trên dòng phiếu, rỗng thì lấy của danh mục hàng hóa.
-- =============================================================================

DROP VIEW IF EXISTS public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat CASCADE;

CREATE VIEW public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat AS
SELECT
  ct.id AS chi_tiet_id,
  ct.id_phieu_kho,
  ct.id_hang_hoa,
  ct.ten_hang_hoa,
  ct.don_vi_tinh,
  COALESCE(NULLIF(BTRIM(ct.pham_cap), ''), NULLIF(BTRIM(hh.pham_cap), '')) AS pham_cap,
  ct.so_luong,
  ct.don_gia,
  ct.thanh_tien,
  ct.so_lot,
  ct.ghi_chu,
  ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
  ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
  ct.tg_tao AS chi_tiet_tg_tao,
  ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
  pk.id AS phieu_id,
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
  pk.nguoi_tao_id AS phieu_nguoi_tao_id,
  pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
  pk.id_nguoi_duyet,
  pk.tg_tao AS phieu_tg_tao,
  pk.tg_cap_nhat AS phieu_tg_cap_nhat,
  hh.ma_hang_hoa AS ma_hang
FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
JOIN public.fp_farm_phieu_kho_phan_thuoc pk ON pk.id = ct.id_phieu_kho
LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

COMMENT ON VIEW public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat IS
  'Chi tiết phiếu kho phân thuốc phẳng (JOIN header + mã HH + phẩm cấp)';

ALTER VIEW public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat SET (security_invoker = true);

GRANT SELECT ON public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat TO authenticated;
GRANT SELECT ON public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat TO anon;
