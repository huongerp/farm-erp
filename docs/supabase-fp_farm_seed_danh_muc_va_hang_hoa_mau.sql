-- =============================================================================
-- Dữ liệu mẫu: danh mục + hàng hóa phân thuốc (farm)
-- Bảng: fp_farm_danh_muc_hang_hoa (có thu_tu, không trang_thai),
--       fp_farm_danh_sach_hang_hoa (không thu_tu, không trang_thai)
-- Chạy sau: migration docs/supabase-fp_farm_alter_drop_trang_thai_va_thu_tu_hang_hoa.sql
-- Nếu app không thấy dữ liệu: chạy docs/supabase-fp_farm_hang_hoa_rls_policies.sql (RLS cho authenticated).
--          (hoặc bảng mới tạo từ DDL đã cập nhật)
-- Chạy lại an toàn: NOT EXISTS theo ma_danh_muc / ma_hang_hoa
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Cấp 1 – danh mục gốc
-- -----------------------------------------------------------------------------
INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'PHAN_BON', 'Phân bón', NULL, 1, 'Phân đạm, lân, kali, NPK và phân hữu cơ.'
WHERE NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa d WHERE d.ma_danh_muc = 'PHAN_BON' AND d.danh_muc_cha_id IS NULL);

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'THUOC_TRU_SAU', 'Thuốc trừ sâu', NULL, 2, 'Sâu hại lá, thân, quả.'
WHERE NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa d WHERE d.ma_danh_muc = 'THUOC_TRU_SAU' AND d.danh_muc_cha_id IS NULL);

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'THUOC_TRU_BENH', 'Thuốc trừ bệnh', NULL, 3, 'Đạo ôn, khô vằn, phấn trắng, thán thư…'
WHERE NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa d WHERE d.ma_danh_muc = 'THUOC_TRU_BENH' AND d.danh_muc_cha_id IS NULL);

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'THUOC_CU_CO', 'Thuốc cỏ', NULL, 4, 'Diệt cỏ lá hẹp, lá rộng, cỏ gạo.'
WHERE NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa d WHERE d.ma_danh_muc = 'THUOC_CU_CO' AND d.danh_muc_cha_id IS NULL);

-- -----------------------------------------------------------------------------
-- Cấp 2 – danh mục con
-- -----------------------------------------------------------------------------
INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'PB_DAM_UREA', 'Đạm / Ure', p.id, 1, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'PHAN_BON' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'PB_DAM_UREA');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'PB_LAN', 'Lân', p.id, 2, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'PHAN_BON' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'PB_LAN');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'PB_KALI', 'Kali', p.id, 3, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'PHAN_BON' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'PB_KALI');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'PB_NPK', 'Phân NPK', p.id, 4, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'PHAN_BON' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'PB_NPK');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'TTS_PYRE', 'Nhóm Pyrethroid', p.id, 1, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'THUOC_TRU_SAU' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'TTS_PYRE');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'TTS_CARBA', 'Carbamat / OP', p.id, 2, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'THUOC_TRU_SAU' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'TTS_CARBA');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'TTS_SINH_HOC', 'Thuốc sinh học', p.id, 3, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'THUOC_TRU_SAU' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'TTS_SINH_HOC');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'TTB_LA', 'Trừ bệnh trên lá', p.id, 1, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'THUOC_TRU_BENH' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'TTB_LA');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'TTB_RE', 'Trừ bệnh rễ / đất', p.id, 2, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'THUOC_TRU_BENH' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'TTB_RE');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'TCC_LA_HEP', 'Cỏ lá hẹp', p.id, 1, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'THUOC_CU_CO' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'TCC_LA_HEP');

INSERT INTO fp_farm_danh_muc_hang_hoa (ma_danh_muc, ten_danh_muc, danh_muc_cha_id, thu_tu, mo_ta)
SELECT 'TCC_LA_RONG', 'Cỏ lá rộng / cỏ gạo', p.id, 2, NULL
FROM fp_farm_danh_muc_hang_hoa p
WHERE p.ma_danh_muc = 'THUOC_CU_CO' AND p.danh_muc_cha_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_muc_hang_hoa c WHERE c.ma_danh_muc = 'TCC_LA_RONG');

-- -----------------------------------------------------------------------------
-- Hàng hóa mẫu (chỉ: danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
-- -----------------------------------------------------------------------------
INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'UREA-46', 'Phân Ure 46%N', 'Kg', 11800, 'Bón thúc lúa, màu.'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'PB_DAM_UREA' AND p.ma_danh_muc = 'PHAN_BON'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'UREA-46');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'SA-21', 'Phân SA (Amophos)', 'Kg', 9200, NULL
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'PB_DAM_UREA' AND p.ma_danh_muc = 'PHAN_BON'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'SA-21');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'SUPER-LAN', 'Super lân (SSP)', 'Kg', 10500, NULL
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'PB_LAN' AND p.ma_danh_muc = 'PHAN_BON'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'SUPER-LAN');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'KCL-60', 'Kali clorua KCl 60% K2O', 'Kg', 13200, NULL
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'PB_KALI' AND p.ma_danh_muc = 'PHAN_BON'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'KCL-60');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'NPK-20-20-15', 'Phân NPK 20-20-15', 'Kg', 15800, 'Bón cân đối giai đoạn đẻ nhánh.'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'PB_NPK' AND p.ma_danh_muc = 'PHAN_BON'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'NPK-20-20-15');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'PERM-5EC', 'Permethrin 5EC', 'Lít', 285000, 'Sâu ăn lá, nhện đỏ.'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TTS_PYRE' AND p.ma_danh_muc = 'THUOC_TRU_SAU'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'PERM-5EC');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'LAMBDA-25EC', 'Lambda-cyhalothrin 2.5EC', 'Lít', 320000, NULL
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TTS_PYRE' AND p.ma_danh_muc = 'THUOC_TRU_SAU'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'LAMBDA-25EC');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'CARB-85WP', 'Carbaryl 85WP', 'Kg', 195000, NULL
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TTS_CARBA' AND p.ma_danh_muc = 'THUOC_TRU_SAU'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'CARB-85WP');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'ABAMEC-18EC', 'Abamectin 1.8EC', 'Lít', 245000, 'Nhện, sâu cuốn lá nhỏ.'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TTS_SINH_HOC' AND p.ma_danh_muc = 'THUOC_TRU_SAU'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'ABAMEC-18EC');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'MANCOZEB-80WP', 'Mancozeb 80WP', 'Kg', 165000, 'Phòng trừ đạo ôn, thán thư.'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TTB_LA' AND p.ma_danh_muc = 'THUOC_TRU_BENH'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'MANCOZEB-80WP');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'METALAXYL-MZ', 'Metalaxyl-M + Mancozeb', 'Kg', 210000, NULL
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TTB_RE' AND p.ma_danh_muc = 'THUOC_TRU_BENH'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'METALAXYL-MZ');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, '2-4D-DIMETH', '2,4-D dimethylamine salt', 'Lít', 125000, 'Cỏ lá rộng trên ruộng lúa.'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TCC_LA_RONG' AND p.ma_danh_muc = 'THUOC_CU_CO'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = '2-4D-DIMETH');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'GLYPHO-41SL', 'Glyphosate 41SL', 'Lít', 98000, 'Diệt cỏ gạo, cỏ cứng.'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TCC_LA_RONG' AND p.ma_danh_muc = 'THUOC_CU_CO'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'GLYPHO-41SL');

INSERT INTO fp_farm_danh_sach_hang_hoa (danh_muc_id, danh_muc_cha_id, ma_hang_hoa, ten_hang_hoa, dvt, don_gia, mo_ta)
SELECT c.id, p.id, 'BUTACHLOR-50EC', 'Butachlor 50EC', 'Lít', 175000, 'Chọn lọc cỏ lá hẹp (mạ gốc).'
FROM fp_farm_danh_muc_hang_hoa c
JOIN fp_farm_danh_muc_hang_hoa p ON p.id = c.danh_muc_cha_id
WHERE c.ma_danh_muc = 'TCC_LA_HEP' AND p.ma_danh_muc = 'THUOC_CU_CO'
  AND NOT EXISTS (SELECT 1 FROM fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = 'BUTACHLOR-50EC');
