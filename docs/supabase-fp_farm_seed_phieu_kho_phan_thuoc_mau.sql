-- =============================================================================
-- Dữ liệu mẫu: phiếu kho phân thuốc (nhập / xuất / chuyển) + chi tiết
-- Chạy sau:
--   - docs/supabase-fp_farm_phieu_kho_phan_thuoc.sql
--   - docs/supabase-fp_farm_seed_danh_muc_va_hang_hoa_mau.sql (hoặc đã có hàng trong fp_farm_danh_sach_hang_hoa)
--   - Ít nhất 1 dòng fp_mh_danh_sach_kho
-- Phiếu mẫu dùng mã FNK-SEED-*, FXK-SEED-*, FCK-SEED-* để không đụng FNK-0001… từ get_next_so_phieu_farm_pt
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Phiếu NHẬP (Chờ duyệt) + 2 dòng chi tiết
-- -----------------------------------------------------------------------------
INSERT INTO fp_farm_phieu_kho_phan_thuoc (
  so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den,
  trang_thai, mo_ta, ten_nguoi_tao
)
SELECT
  'FNK-SEED-001',
  (CURRENT_DATE - INTERVAL '3 days')::date,
  'nhập',
  k.id,
  COALESCE(k.ten_kho, k.ma_kho, 'Kho'),
  NULL,
  NULL,
  'Chờ duyệt',
  'Seed demo: nhập phân thuốc về kho.',
  'SQL seed'
FROM fp_mh_danh_sach_kho k
WHERE NOT EXISTS (
  SELECT 1 FROM fp_farm_phieu_kho_phan_thuoc p
  WHERE p.so_phieu = 'FNK-SEED-001' AND p.loai = 'nhập'
)
ORDER BY k.id
LIMIT 1;

INSERT INTO fp_farm_phieu_kho_phan_thuoc_chi_tiet (
  id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, so_lot, ghi_chu
)
SELECT p.id, h.id, h.ten_hang_hoa, h.dvt, 500::numeric, h.don_gia, 'LOT-2025-A', NULL
FROM fp_farm_phieu_kho_phan_thuoc p
CROSS JOIN fp_farm_danh_sach_hang_hoa h
WHERE p.so_phieu = 'FNK-SEED-001' AND p.loai = 'nhập' AND h.ma_hang_hoa = 'UREA-46'
  AND NOT EXISTS (
    SELECT 1 FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
    WHERE ct.id_phieu_kho = p.id AND ct.id_hang_hoa = h.id
  );

INSERT INTO fp_farm_phieu_kho_phan_thuoc_chi_tiet (
  id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, so_lot, ghi_chu
)
SELECT p.id, h.id, h.ten_hang_hoa, h.dvt, 20::numeric, h.don_gia, 'LOT-PERM-01', 'Góc kho A1'
FROM fp_farm_phieu_kho_phan_thuoc p
CROSS JOIN fp_farm_danh_sach_hang_hoa h
WHERE p.so_phieu = 'FNK-SEED-001' AND p.loai = 'nhập' AND h.ma_hang_hoa = 'PERM-5EC'
  AND NOT EXISTS (
    SELECT 1 FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
    WHERE ct.id_phieu_kho = p.id AND ct.id_hang_hoa = h.id
  );

-- -----------------------------------------------------------------------------
-- Phiếu XUẤT (Đã duyệt) + 1 dòng chi tiết
-- -----------------------------------------------------------------------------
INSERT INTO fp_farm_phieu_kho_phan_thuoc (
  so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den,
  trang_thai, mo_ta, ten_nguoi_tao
)
SELECT
  'FXK-SEED-001',
  (CURRENT_DATE - INTERVAL '1 day')::date,
  'xuất',
  k.id,
  COALESCE(k.ten_kho, k.ma_kho, 'Kho'),
  NULL,
  NULL,
  'Đã duyệt',
  'Seed demo: xuất dùng thử nghiệm ruộng.',
  'SQL seed'
FROM fp_mh_danh_sach_kho k
WHERE NOT EXISTS (
  SELECT 1 FROM fp_farm_phieu_kho_phan_thuoc p
  WHERE p.so_phieu = 'FXK-SEED-001' AND p.loai = 'xuất'
)
ORDER BY k.id
LIMIT 1;

INSERT INTO fp_farm_phieu_kho_phan_thuoc_chi_tiet (
  id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, so_lot, ghi_chu
)
SELECT p.id, h.id, h.ten_hang_hoa, h.dvt, 2.5::numeric, h.don_gia, NULL, NULL
FROM fp_farm_phieu_kho_phan_thuoc p
CROSS JOIN fp_farm_danh_sach_hang_hoa h
WHERE p.so_phieu = 'FXK-SEED-001' AND p.loai = 'xuất' AND h.ma_hang_hoa = 'LAMBDA-25EC'
  AND NOT EXISTS (
    SELECT 1 FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
    WHERE ct.id_phieu_kho = p.id AND ct.id_hang_hoa = h.id
  );

-- -----------------------------------------------------------------------------
-- Phiếu CHUYỂN (Chờ duyệt) — chỉ khi có ít nhất 2 kho khác id
-- -----------------------------------------------------------------------------
INSERT INTO fp_farm_phieu_kho_phan_thuoc (
  so_phieu, ngay, loai, kho_id, ten_kho, kho_den_id, ten_kho_den,
  trang_thai, mo_ta, ten_nguoi_tao
)
SELECT
  'FCK-SEED-001',
  CURRENT_DATE,
  'chuyển',
  k1.id,
  COALESCE(k1.ten_kho, k1.ma_kho, 'Kho nguồn'),
  k2.id,
  COALESCE(k2.ten_kho, k2.ma_kho, 'Kho đích'),
  'Chờ duyệt',
  'Seed demo: chuyển nội bộ giữa hai kho.',
  'SQL seed'
FROM fp_mh_danh_sach_kho k1
JOIN fp_mh_danh_sach_kho k2 ON k2.id <> k1.id
WHERE k1.id = (SELECT id FROM fp_mh_danh_sach_kho ORDER BY id LIMIT 1)
  AND k2.id = (
    SELECT k.id FROM fp_mh_danh_sach_kho k
    WHERE k.id <> (SELECT id FROM fp_mh_danh_sach_kho ORDER BY id LIMIT 1)
    ORDER BY k.id
    LIMIT 1
  )
  AND NOT EXISTS (
    SELECT 1 FROM fp_farm_phieu_kho_phan_thuoc p
    WHERE p.so_phieu = 'FCK-SEED-001' AND p.loai = 'chuyển'
  );

INSERT INTO fp_farm_phieu_kho_phan_thuoc_chi_tiet (
  id_phieu_kho, id_hang_hoa, ten_hang_hoa, don_vi_tinh, so_luong, don_gia, so_lot, ghi_chu
)
SELECT p.id, h.id, h.ten_hang_hoa, h.dvt, 100::numeric, h.don_gia, NULL, NULL
FROM fp_farm_phieu_kho_phan_thuoc p
CROSS JOIN fp_farm_danh_sach_hang_hoa h
WHERE p.so_phieu = 'FCK-SEED-001' AND p.loai = 'chuyển' AND h.ma_hang_hoa = 'NPK-20-20-15'
  AND NOT EXISTS (
    SELECT 1 FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
    WHERE ct.id_phieu_kho = p.id AND ct.id_hang_hoa = h.id
  );
