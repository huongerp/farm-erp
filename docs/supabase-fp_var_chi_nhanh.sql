-- =============================================================================
-- Bảng fp_var_chi_nhanh (Chi nhánh) – đồng bộ với app Farm ERP
-- Không có cột thời gian làm việc (gio_vao_sang, gio_ra_sang, ...)
-- trang_thai: text ('Đang dùng' | 'Ngừng')
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_var_chi_nhanh (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_chi_nhanh    text,
  ten_chi_nhanh   text,
  dia_chi         text,
  tinh_thanh      text,
  quan_huyen      text,
  vi_do           double precision,
  kinh_do         double precision,
  duong_dan_map   text,
  trang_thai      text DEFAULT 'Đang dùng',
  tg_tao          timestamptz DEFAULT now(),
  tg_cap_nhat     timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_var_chi_nhanh IS 'Chi nhánh – không lưu giờ làm việc';
COMMENT ON COLUMN fp_var_chi_nhanh.trang_thai IS 'Đang dùng | Ngừng';

CREATE INDEX IF NOT EXISTS idx_fp_var_chi_nhanh_trang_thai ON fp_var_chi_nhanh(trang_thai);
CREATE INDEX IF NOT EXISTS idx_fp_var_chi_nhanh_ten ON fp_var_chi_nhanh(ten_chi_nhanh);

ALTER TABLE fp_var_chi_nhanh ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated đọc fp_var_chi_nhanh"
  ON fp_var_chi_nhanh FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated thêm/sửa/xóa fp_var_chi_nhanh"
  ON fp_var_chi_nhanh FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- Dữ liệu mẫu (từ mock MOCK_BRANCHES, không có cột giờ)
-- =============================================================================
INSERT INTO fp_var_chi_nhanh (
  ma_chi_nhanh,
  ten_chi_nhanh,
  dia_chi,
  tinh_thanh,
  quan_huyen,
  vi_do,
  kinh_do,
  duong_dan_map,
  trang_thai
)
SELECT 'CN-HCM', 'Chi nhánh TP. Hồ Chí Minh', 'Số 12 Nguyễn Huệ, Quận 1', 'TP. Hồ Chí Minh', 'Quận 1', 10.773256, 106.704321, 'https://maps.app.goo.gl/1d4QJwqJgTQw5nUj7', 'Đang dùng'
WHERE NOT EXISTS (SELECT 1 FROM fp_var_chi_nhanh LIMIT 1);

INSERT INTO fp_var_chi_nhanh (
  ma_chi_nhanh,
  ten_chi_nhanh,
  dia_chi,
  tinh_thanh,
  quan_huyen,
  vi_do,
  kinh_do,
  duong_dan_map,
  trang_thai
)
SELECT 'CN-HN', 'Chi nhánh Hà Nội', 'Số 88 Trần Duy Hưng, Cầu Giấy', 'Hà Nội', 'Cầu Giấy', 21.016897, 105.798233, 'https://maps.app.goo.gl/2G6X7Gm9mXJqf8Qm8', 'Đang dùng'
WHERE (SELECT COUNT(*) FROM fp_var_chi_nhanh) < 2;

INSERT INTO fp_var_chi_nhanh (
  ma_chi_nhanh,
  ten_chi_nhanh,
  dia_chi,
  tinh_thanh,
  quan_huyen,
  vi_do,
  kinh_do,
  duong_dan_map,
  trang_thai
)
SELECT 'CN-DN', 'Chi nhánh Đà Nẵng', 'Số 22 Bạch Đằng, Hải Châu', 'Đà Nẵng', 'Hải Châu', 16.06778, 108.22083, 'https://maps.app.goo.gl/9vZWm1vUz4vw1q5a6', 'Ngừng'
WHERE (SELECT COUNT(*) FROM fp_var_chi_nhanh) < 3;
