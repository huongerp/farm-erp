-- =============================================================================
-- DỮ LIỆU MẪU sổ quỹ để test — chép theo đúng sổ Excel tháng 7-9/2026 của farm.
-- Mọi dòng đều có ghi_chu = 'DU LIEU MAU' để xoá sạch trong một câu lệnh:
--     DELETE FROM fp_tc_quy_thu_chi WHERE ghi_chu = 'DU LIEU MAU';
--
-- Số phiếu lấy từ đúng sequence PT-/PC- nên không đụng phiếu nhập tay.
-- Chạy sau: supabase-fp_tc_quy_thu_chi.sql + supabase-fp_tc_seed_hang_muc_thu_chi.sql
-- Chạy lại nhiều lần sẽ tạo thêm bản ghi mới (xoá bằng câu DELETE ở trên rồi chạy lại).
-- =============================================================================

WITH cn AS (
  -- Hai farm đầu tiên theo mã chi nhánh; đổi mã ở đây nếu muốn nạp cho farm khác
  SELECT id, ten_chi_nhanh, ma_chi_nhanh FROM fp_var_chi_nhanh WHERE ma_chi_nhanh IN ('FP1', 'FP2')
),
hm AS (
  SELECT id, ma, ten FROM fp_tc_hang_muc_thu_chi
),
mau(ma_farm, ngay, loai, so_tien, so_luong, don_gia, ma_hang_muc, dien_giai, so_chung_tu) AS (
  VALUES
    -- ===== Farm FP1: sổ quỹ tháng 7 =====
    ('FP1', DATE '2026-07-22', 'thu', 20000000::numeric, NULL::numeric, NULL::numeric, 'TAM_UNG',   'TẠM ỨNG QUỸ THÁNG 7 LẦN 1', NULL),
    ('FP1', DATE '2026-07-25', 'chi',   280000, 1,  280000, 'VAT_TU',   '1 mũi khoan sôi 60', 'làm bồn châm phân lô DA1'),
    ('FP1', DATE '2026-07-25', 'chi',    49000, 1,   49000, 'VAT_TU',   '1 giảm 60ra 34,2 co 34,1 gai ngoài 34,50 phân ống 34', 'làm bồn châm phân lô DA1'),
    ('FP1', DATE '2026-07-25', 'chi',  1080000, NULL, NULL, 'VAT_TU',   '2 nệm 1m2, 1m, 2 mùng 1m2, 2 mềnh, 2 gối, 1 kéo, 1 dao', 'cấp cho A Văn QL, A Sơn CN nhà máy ở lại farm'),
    ('FP1', DATE '2026-07-30', 'chi',   132000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền nước lọc', 'nước uống cho ban điều hành 11 bình'),
    ('FP1', DATE '2026-07-31', 'chi',  1500000, 1, 1500000, 'VAT_TU',   '1 thùng nhớt thủy lực 18 lít', 'thay cho máy cày, có hóa đơn'),
    ('FP1', DATE '2026-07-31', 'chi',    80000, 2,   40000, 'VAT_TU',   '2 lưỡi dao cắt cỏ 40', 'thay cho máy cắt cỏ chuối, có hóa đơn'),
    ('FP1', DATE '2026-07-31', 'chi',    30000, 1,   30000, 'VAT_TU',   '1 bình sơn đỏ', 'dùng xịt làm dây căn trồng chuối'),
    -- ===== Farm FP1: sổ quỹ tháng 8 =====
    ('FP1', DATE '2026-08-02', 'chi',   820000, NULL, NULL, 'VAT_TU',   '7m xích 10 đen, 3 móc xích', 'dùng cẩu nhà bè xuống hồ, có hóa đơn'),
    ('FP1', DATE '2026-08-04', 'chi',   620000, NULL, NULL, 'VAT_TU',   '2 bình nhớt 2T, con dao', 'sử dụng cho máy phát cỏ'),
    ('FP1', DATE '2026-08-07', 'chi',   172000, 1,  172000, 'VAT_TU',   'máy bơm mini', 'dùng bơm phân trong kho'),
    ('FP1', DATE '2026-08-08', 'chi',   108000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền nước lọc', 'nước uống cho ban điều hành 9 bình'),
    ('FP1', DATE '2026-08-08', 'chi',   355000, NULL, NULL, 'VAT_TU',   '2 mũi khoan khai thủy, 5 cái liềm, 1 bộ lục giác', 'khoan khai thủy, liềm thay liềm hủy, lục giác sửa máy phát cỏ'),
    ('FP1', DATE '2026-08-10', 'chi',    70000, 1,   70000, 'VAT_TU',   '1 lốc giấy A4', 'in giấy chấm công, có hóa đơn'),
    ('FP1', DATE '2026-08-12', 'chi',   130000, 1,  130000, 'VAT_TU',   '1 cây sắt 27', 'làm cây trồng dứa, có hóa đơn'),
    ('FP1', DATE '2026-08-12', 'chi',   650000, 1,  650000, 'VAT_TU',   '1 bộ bánh xe lôi', 'dùng làm xe lôi chở vật tư ra lô'),
    ('FP1', DATE '2026-08-16', 'chi',   220000, NULL, NULL, 'VAT_TU',   'nhớt 2T', 'sử dụng cho máy phát cỏ'),
    ('FP1', DATE '2026-08-16', 'chi',    50000, 2,   25000, 'VAT_TU',   '2 bạc đạn xe rùa', 'thay bánh xe rùa'),
    ('FP1', DATE '2026-08-16', 'chi',  1500000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền xe Phương Bông', 'lấy 10 thùng giống chuối'),
    ('FP1', DATE '2026-08-17', 'chi',   480000, 1,  480000, 'VAT_TU',   '1 xe rùa', 'sử dụng cho vườn ươm, có hóa đơn'),
    ('FP1', DATE '2026-08-18', 'chi',   300000, 4,   75000, 'VAT_TU',   '4 ổ bi', 'thay cho bánh xe lôi, có hóa đơn'),
    ('FP1', DATE '2026-08-19', 'chi',   140000, 20,   7000, 'VAT_TU',   '20 cùm điện', 'bắt điện trạm bơm khu C, có hóa đơn'),
    ('FP1', DATE '2026-08-20', 'chi',   100000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền xe Phương Bông', 'lấy 1 thùng đầu nối'),
    ('FP1', DATE '2026-08-20', 'chi',    90000, 6,   15000, 'VAT_TU',   '6 đầu cos', 'lắp tủ điện trạm bơm khu C, có hóa đơn'),
    ('FP1', DATE '2026-08-24', 'chi',   350000, NULL, NULL, 'BOC_KHOAN','thanh toán tiền bốc phân khoán', 'bốc 5 tấn phân'),
    ('FP1', DATE '2026-08-25', 'chi',   240000, 2,  120000, 'VAT_TU',   '2 chai nhớt 4T', 'thay máy phát điện 10kg, máy phát cỏ 4T, có hóa đơn'),
    ('FP1', DATE '2026-08-28', 'chi',   250000, NULL, NULL, 'VAT_TU',   '6 cái liềm, 1 lưỡi bên', 'bổ sung thay liềm hư, có hóa đơn'),
    ('FP1', DATE '2026-08-29', 'chi',    70000, 2,   35000, 'VAT_TU',   '2 van 34', 'thay van nước chỗ sinh hoạt, có hóa đơn'),
    ('FP1', DATE '2026-08-29', 'chi',  1400000, NULL, NULL, 'BOC_KHOAN','thanh toán tiền bốc vôi khoán', 'bốc 20 tấn vôi'),
    ('FP1', DATE '2026-08-30', 'chi',   155000, NULL, NULL, 'VAT_TU',   '5 lăn sơn lớn, 5 lăn sơn nhỏ, 5 cọ', 'sơn trạm bơm + nhà bè, có hóa đơn'),
    ('FP1', DATE '2026-08-30', 'chi',  1520000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền sửa máy phát hàn', 'A Toàn duyệt, có hóa đơn'),
    ('FP1', DATE '2026-08-31', 'chi',   495000, NULL, NULL, 'VAT_TU',   'công tắc hành trình máy hàn ống HDPE thủy lực', 'thay cho máy hàn thủy lực'),
    -- ===== Farm FP1: sổ quỹ tháng 9 =====
    ('FP1', DATE '2026-09-01', 'chi',   160000, 8,   20000, 'VAT_TU',   '8 đầu cos 50', 'đấu bơm 20 ngựa khu C, có hóa đơn'),
    ('FP1', DATE '2026-09-06', 'chi',  2100000, NULL, NULL, 'BOC_KHOAN','thanh toán tiền bốc phân khoán', '27,1 tấn + 200k hỗ trợ bốc xa'),
    ('FP1', DATE '2026-09-08', 'chi',   100000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền thuê xe kéo cày', 'cày mắc lầy thuê xe kéo'),
    ('FP1', DATE '2026-09-09', 'chi',   100000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền xe Duy Phượng', 'lấy hàng hệ thống tưới'),
    -- ===== Farm FP2: sổ quỹ ngắn để test lọc nhiều farm =====
    ('FP2', DATE '2026-08-01', 'thu', 10000000, NULL, NULL, 'TAM_UNG',  'TẠM ỨNG QUỸ THÁNG 8', NULL),
    ('FP2', DATE '2026-08-05', 'chi',   450000, 3,  150000, 'VAT_TU',   '3 cuộn dây tưới nhỏ giọt', 'thay đoạn hỏng lô B'),
    ('FP2', DATE '2026-08-12', 'chi',   180000, NULL, NULL, 'CHI_KHAC', 'thanh toán tiền nước lọc', 'nước uống tổ chăm sóc'),
    ('FP2', DATE '2026-08-20', 'chi',   900000, NULL, NULL, 'BOC_KHOAN','thanh toán tiền bốc phân khoán', 'bốc 12 tấn phân'),
    ('FP2', DATE '2026-09-02', 'chi',   320000, 2,  160000, 'VAT_TU',   '2 béc tưới thay thế', 'thay béc hỏng khu A')
)
INSERT INTO fp_tc_quy_thu_chi (
  so_phieu, ngay, id_chi_nhanh, ten_chi_nhanh, loai, so_tien, so_luong, don_gia,
  id_hang_muc, ten_hang_muc, dien_giai, ghi_chu, so_chung_tu
)
SELECT
  CASE WHEN m.loai = 'thu'
       THEN 'PT-' || lpad(nextval('fp_tc_quy_thu_so_seq')::text, 4, '0')
       ELSE 'PC-' || lpad(nextval('fp_tc_quy_chi_so_seq')::text, 4, '0')
  END,
  m.ngay, cn.id, cn.ten_chi_nhanh, m.loai, m.so_tien, m.so_luong, m.don_gia,
  hm.id, hm.ten, m.dien_giai, 'DU LIEU MAU', m.so_chung_tu
FROM mau m
JOIN cn ON cn.ma_chi_nhanh = m.ma_farm
JOIN hm ON hm.ma = m.ma_hang_muc
ORDER BY m.ma_farm, m.ngay;
