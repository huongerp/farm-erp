-- =============================================================================
-- DỮ LIỆU DEMO để thử module Kiểm kê kho phân thuốc — 3 đợt ở 3 trạng thái.
--
-- Đây KHÔNG phải migration nghiệp vụ. Mọi bản ghi đều mang dấu nhận biết để gỡ
-- sạch được (xem khối XOÁ ở cuối file):
--   - đợt kiểm kê: ma_dot bắt đầu bằng 'KKPT-DEMO-'
--   - hàng hóa:    ma_hang_hoa bắt đầu bằng 'DEMO-PT-'
--
-- Chạy SAU docs/supabase-fp_farm_dot_kiem_ke_pt.sql. Chạy lại nhiều lần được.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Hai mặt hàng phân thuốc demo (kho farm hiện chỉ có 1 mặt hàng — quá ít để
--    thấy bảng chi tiết và các trạng thái khớp/thiếu/thừa).
-- ---------------------------------------------------------------------------
INSERT INTO public.fp_farm_danh_sach_hang_hoa (ma_hang_hoa, ten_hang_hoa, dvt, danh_muc_id)
SELECT v.ma, v.ten, v.dvt, 20   -- danh mục CCDD
FROM (VALUES
  ('DEMO-PT-01', 'Phân NPK 16-16-8 (demo)', 'Bao'),
  ('DEMO-PT-02', 'Thuốc trừ nấm Antracol (demo)', 'Chai')
) AS v(ma, ten, dvt)
WHERE NOT EXISTS (
  SELECT 1 FROM public.fp_farm_danh_sach_hang_hoa h WHERE h.ma_hang_hoa = v.ma
);

-- ---------------------------------------------------------------------------
-- 2) Ba đợt kiểm kê
--    DEMO-1 Nháp            — chưa có dòng nào, để thử nút "Tạo danh sách kiểm kê"
--    DEMO-2 Đang kiểm kê    — có đủ khớp / thiếu / thừa / chưa kiểm, thử điều chỉnh tồn
--    DEMO-3 Hoàn thành      — chốt sổ, không sửa được nữa
--    Ngày đặt trong tháng hiện tại để chip kỳ "Tháng này" lọc ra được.
-- ---------------------------------------------------------------------------
INSERT INTO public.fp_farm_dot_kiem_ke_pt
  (ma_dot, ten_dot, ngay_bat_dau, ngay_ket_thuc, trang_thai, id_nguoi_phu_trach, id_nguoi_tao, ghi_chu)
VALUES
  ('KKPT-DEMO-0001', 'Kiểm kê phân thuốc Farm fp1 (demo)',
   date_trunc('month', CURRENT_DATE)::date, CURRENT_DATE,
   'draft', 1, 1, 'Dữ liệu demo — đợt Nháp, chưa tạo danh sách.'),
  ('KKPT-DEMO-0002', 'Kiểm kê phân thuốc Nhà sơ chế fp1 + fp2A (demo)',
   date_trunc('month', CURRENT_DATE)::date, CURRENT_DATE + 5,
   'dang_kiem_ke', 1, 1, 'Dữ liệu demo — đang kiểm kê, có dòng lệch để thử điều chỉnh tồn.'),
  ('KKPT-DEMO-0003', 'Kiểm kê phân thuốc Kho trung tâm VP (demo)',
   (date_trunc('month', CURRENT_DATE) - INTERVAL '1 month')::date,
   (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date,
   'hoan_thanh', 2, 1, 'Dữ liệu demo — đã hoàn thành, chỉ xem.')
ON CONFLICT (ma_dot) DO UPDATE
SET ten_dot = EXCLUDED.ten_dot,
    ngay_bat_dau = EXCLUDED.ngay_bat_dau,
    ngay_ket_thuc = EXCLUDED.ngay_ket_thuc,
    trang_thai = EXCLUDED.trang_thai,
    ghi_chu = EXCLUDED.ghi_chu;

-- Phạm vi kho của từng đợt
INSERT INTO public.fp_farm_dot_kiem_ke_pt_kho (id_dot_kiem_ke_pt, id_kho)
SELECT d.id, v.id_kho
FROM public.fp_farm_dot_kiem_ke_pt d
JOIN (VALUES
  ('KKPT-DEMO-0001', 2),   -- Farm fp1
  ('KKPT-DEMO-0002', 8),   -- NSC fp1
  ('KKPT-DEMO-0002', 9),   -- NSC fp2A
  ('KKPT-DEMO-0003', 1)    -- Kho trung tâm VP
) AS v(ma_dot, id_kho) ON v.ma_dot = d.ma_dot
ON CONFLICT (id_dot_kiem_ke_pt, id_kho) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3) Chi tiết cho đợt DEMO-2 (đang kiểm kê) — mỗi kết quả một dòng
--    NSC fp1 : khớp, thiếu, thừa
--    NSC fp2A: chưa kiểm (để thử nhập kết quả)
-- ---------------------------------------------------------------------------
INSERT INTO public.fp_farm_dot_kiem_ke_pt_chi_tiet
  (id_dot_kiem_ke_pt, id_kho, id_hang_hoa, so_luong_so, so_luong_thuc_te, ket_qua, ghi_chu_dong, id_nguoi_kiem, ngay_kiem)
SELECT d.id, v.id_kho, h.id, v.so_so, v.so_tt, v.ket_qua, v.ghi_chu,
       CASE WHEN v.so_tt IS NULL THEN NULL ELSE 1 END,
       CASE WHEN v.so_tt IS NULL THEN NULL ELSE now() END
FROM public.fp_farm_dot_kiem_ke_pt d
JOIN (VALUES
  (8, 'DEMO-PT-01', 120.0, 120.0, 'khop',      'Đếm khớp sổ.'),
  (8, 'DEMO-PT-02',  80.0,  73.5, 'thieu',     'Hụt 6,5 chai — nghi thất thoát.'),
  (8, 'NL-06',       45.0,  52.0, 'thua',      'Dư 7 thùng so với sổ.'),
  (9, 'DEMO-PT-01',  60.0,  NULL, 'chua_kiem', NULL),
  (9, 'DEMO-PT-02',  35.0,  NULL, 'chua_kiem', NULL)
) AS v(id_kho, ma_hang, so_so, so_tt, ket_qua, ghi_chu) ON TRUE
JOIN public.fp_farm_danh_sach_hang_hoa h ON h.ma_hang_hoa = v.ma_hang
WHERE d.ma_dot = 'KKPT-DEMO-0002'
ON CONFLICT (id_dot_kiem_ke_pt, id_kho, id_hang_hoa) DO UPDATE
SET so_luong_so = EXCLUDED.so_luong_so,
    so_luong_thuc_te = EXCLUDED.so_luong_thuc_te,
    ket_qua = EXCLUDED.ket_qua,
    ghi_chu_dong = EXCLUDED.ghi_chu_dong;

-- ---------------------------------------------------------------------------
-- 4) Chi tiết cho đợt DEMO-3 (hoàn thành) — đã kiểm hết, đều khớp
-- ---------------------------------------------------------------------------
INSERT INTO public.fp_farm_dot_kiem_ke_pt_chi_tiet
  (id_dot_kiem_ke_pt, id_kho, id_hang_hoa, so_luong_so, so_luong_thuc_te, ket_qua, id_nguoi_kiem, ngay_kiem)
SELECT d.id, 1, h.id, v.so_so, v.so_so, 'khop', 2, d.ngay_ket_thuc::timestamptz
FROM public.fp_farm_dot_kiem_ke_pt d
JOIN (VALUES
  ('DEMO-PT-01', 200.0),
  ('DEMO-PT-02', 150.0)
) AS v(ma_hang, so_so) ON TRUE
JOIN public.fp_farm_danh_sach_hang_hoa h ON h.ma_hang_hoa = v.ma_hang
WHERE d.ma_dot = 'KKPT-DEMO-0003'
ON CONFLICT (id_dot_kiem_ke_pt, id_kho, id_hang_hoa) DO UPDATE
SET so_luong_so = EXCLUDED.so_luong_so,
    so_luong_thuc_te = EXCLUDED.so_luong_thuc_te,
    ket_qua = EXCLUDED.ket_qua;

COMMIT;

-- =============================================================================
-- GỠ DEMO (chạy khi không cần nữa) — chi tiết và bảng kho tự xoá theo CASCADE.
-- Phiếu kho sinh ra khi bấm "Điều chỉnh tồn" KHÔNG nằm trong đây, phải xoá tay
-- ở module Phiếu kho phân thuốc (mô tả có chuỗi 'Điều chỉnh tồn kiểm kê').
-- -----------------------------------------------------------------------------
-- DELETE FROM public.fp_farm_dot_kiem_ke_pt WHERE ma_dot LIKE 'KKPT-DEMO-%';
-- DELETE FROM public.fp_farm_danh_sach_hang_hoa WHERE ma_hang_hoa LIKE 'DEMO-PT-%';
-- =============================================================================
