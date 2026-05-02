-- =============================================================================
-- View: v_farm_phieu_kho_phan_thuoc_chi_tiet_flat
-- Chi tiết dòng + header + mã hàng farm
-- Chạy sau: fp_farm_phieu_kho_phan_thuoc, fp_farm_danh_sach_hang_hoa
-- =============================================================================

CREATE OR REPLACE VIEW v_farm_phieu_kho_phan_thuoc_chi_tiet_flat AS
SELECT
  ct.id AS chi_tiet_id,
  ct.id_phieu_kho,
  ct.id_hang_hoa,
  ct.ten_hang_hoa,
  ct.don_vi_tinh,
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
FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
JOIN fp_farm_phieu_kho_phan_thuoc pk ON pk.id = ct.id_phieu_kho
LEFT JOIN fp_farm_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa;

COMMENT ON VIEW v_farm_phieu_kho_phan_thuoc_chi_tiet_flat IS 'Chi tiết phiếu kho phân thuốc phẳng';

ALTER VIEW v_farm_phieu_kho_phan_thuoc_chi_tiet_flat SET (security_invoker = true);

GRANT SELECT ON v_farm_phieu_kho_phan_thuoc_chi_tiet_flat TO authenticated;
GRANT SELECT ON v_farm_phieu_kho_phan_thuoc_chi_tiet_flat TO anon;
