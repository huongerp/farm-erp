-- =============================================================================
-- 010-gscl-nguong-mac-dinh.sql — Ngưỡng mặc định cho 9 tiêu chí số của Giám sát chất lượng
-- Giá trị khởi điểm (chưa phải chuẩn QC chính thức) — sửa tiếp trong app: Cài đặt → Tiêu chí.
--   do_luong : khoảng cho phép của TRUNG BÌNH các thùng mẫu
--   dem_loi  : TỔNG số trái lỗi tối đa cho 10 thùng mẫu (khác 10 thùng thì app quy đổi tỉ lệ)
-- Chỉ ghi khi tiêu chí còn trống ngưỡng — không đè giá trị đã chỉnh trong app.
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/010-gscl-nguong-mac-dinh.sql
-- =============================================================================

BEGIN;

UPDATE public.fp_farm_gscl_tieu_chi AS tc
   SET nguong_min = v.nguong_min, nguong_max = v.nguong_max
  FROM (VALUES
    ('so_trai_tren_nhanh', 4::numeric,   8::numeric),
    ('so_kg_tren_nhanh',   1::numeric,   2::numeric),
    ('can_dap_dong_goi',   NULL::numeric, 5::numeric),
    ('tray_tuoi_nang',     NULL::numeric, 3::numeric),
    ('tray_tuoi_tb',       NULL::numeric, 10::numeric),
    ('tray_kho_nang',      NULL::numeric, 5::numeric),
    ('tray_kho_tb',        NULL::numeric, 15::numeric),
    ('chin_chin_xanh',     NULL::numeric, 0::numeric),
    ('rep_sap',            NULL::numeric, 0::numeric)
  ) AS v(ma, nguong_min, nguong_max)
 WHERE tc.ma = v.ma
   AND tc.nguong_min IS NULL
   AND tc.nguong_max IS NULL;

COMMIT;
