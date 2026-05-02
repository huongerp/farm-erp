-- =============================================================================
-- View: v_farm_ton_kho_phan_thuoc
-- Tồn kho tức thời (kho × hàng) từ phiếu kho phân thuốc đã duyệt / chờ duyệt
-- Chạy sau: docs/supabase-fp_farm_phieu_kho_phan_thuoc.sql
-- Công thức: nhập +kho_id; xuất −kho_id; chuyển −kho_nguồn +kho_đích
-- =============================================================================

CREATE OR REPLACE VIEW v_farm_ton_kho_phan_thuoc AS
SELECT id_kho, id_hang_hoa, SUM(delta)::numeric(18, 4) AS so_luong
FROM (
  SELECT pk.kho_id AS id_kho, ct.id_hang_hoa, ct.so_luong AS delta
  FROM fp_farm_phieu_kho_phan_thuoc pk
  JOIN fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ct.id_phieu_kho = pk.id
  WHERE pk.loai = 'nhập' AND pk.trang_thai <> 'Không duyệt'

  UNION ALL

  SELECT pk.kho_id, ct.id_hang_hoa, -ct.so_luong
  FROM fp_farm_phieu_kho_phan_thuoc pk
  JOIN fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ct.id_phieu_kho = pk.id
  WHERE pk.loai = 'xuất' AND pk.trang_thai <> 'Không duyệt'

  UNION ALL

  SELECT pk.kho_id, ct.id_hang_hoa, -ct.so_luong
  FROM fp_farm_phieu_kho_phan_thuoc pk
  JOIN fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ct.id_phieu_kho = pk.id
  WHERE pk.loai = 'chuyển'
    AND pk.kho_den_id IS NOT NULL
    AND pk.trang_thai <> 'Không duyệt'

  UNION ALL

  SELECT pk.kho_den_id, ct.id_hang_hoa, ct.so_luong
  FROM fp_farm_phieu_kho_phan_thuoc pk
  JOIN fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ct.id_phieu_kho = pk.id
  WHERE pk.loai = 'chuyển'
    AND pk.kho_den_id IS NOT NULL
    AND pk.trang_thai <> 'Không duyệt'
) t
GROUP BY id_kho, id_hang_hoa
HAVING SUM(delta) <> 0;

COMMENT ON VIEW v_farm_ton_kho_phan_thuoc IS 'Tồn kho phân thuốc theo kho × hàng (tức thời)';

ALTER VIEW v_farm_ton_kho_phan_thuoc SET (security_invoker = true);

GRANT SELECT ON v_farm_ton_kho_phan_thuoc TO authenticated;
GRANT SELECT ON v_farm_ton_kho_phan_thuoc TO anon;
