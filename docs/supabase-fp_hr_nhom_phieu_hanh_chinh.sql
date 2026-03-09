-- =============================================================================
-- Bảng fp_hr_nhom_phieu_hanh_chinh (Nhóm phiếu hành chính) – Thiết lập công lương
-- id: int8 (bigint identity), loai_phieu: tiếng Việt (Đi muộn / về sớm, Công tác, ...)
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_hr_nhom_phieu_hanh_chinh (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  loai_phieu      text NOT NULL,
  so_luong_thang  integer NOT NULL DEFAULT 0 CHECK (so_luong_thang >= 0 AND so_luong_thang <= 999),
  ghi_chu         text,
  trang_thai      smallint NOT NULL DEFAULT 1 CHECK (trang_thai IN (0, 1)),
  tg_tao          timestamptz NOT NULL DEFAULT now(),
  tg_cap_nhat     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE fp_hr_nhom_phieu_hanh_chinh IS 'Nhóm phiếu hành chính – loại phiếu (tiếng Việt) và định mức số lượng/tháng';
COMMENT ON COLUMN fp_hr_nhom_phieu_hanh_chinh.loai_phieu IS 'Tên loại phiếu tiếng Việt: Đi muộn / về sớm, Công tác, Quên chấm công, Tăng ca, Xin nghỉ không lương, Xin nghỉ phép';
COMMENT ON COLUMN fp_hr_nhom_phieu_hanh_chinh.so_luong_thang IS 'Định mức số phiếu được dùng trong tháng';
COMMENT ON COLUMN fp_hr_nhom_phieu_hanh_chinh.trang_thai IS '0=ẩn, 1=đang dùng';

CREATE INDEX IF NOT EXISTS idx_fp_hr_nhom_phieu_loai ON fp_hr_nhom_phieu_hanh_chinh(loai_phieu);
CREATE INDEX IF NOT EXISTS idx_fp_hr_nhom_phieu_trang_thai ON fp_hr_nhom_phieu_hanh_chinh(trang_thai);

ALTER TABLE fp_hr_nhom_phieu_hanh_chinh ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated đọc fp_hr_nhom_phieu_hanh_chinh"
  ON fp_hr_nhom_phieu_hanh_chinh FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated thêm/sửa/xóa fp_hr_nhom_phieu_hanh_chinh"
  ON fp_hr_nhom_phieu_hanh_chinh FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Anon đọc fp_hr_nhom_phieu_hanh_chinh"
  ON fp_hr_nhom_phieu_hanh_chinh FOR SELECT TO anon USING (true);
CREATE POLICY "Anon thêm/sửa/xóa fp_hr_nhom_phieu_hanh_chinh"
  ON fp_hr_nhom_phieu_hanh_chinh FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================================================
-- Dữ liệu mẫu (loại phiếu tiếng Việt)
-- =============================================================================
INSERT INTO fp_hr_nhom_phieu_hanh_chinh (loai_phieu, so_luong_thang, ghi_chu, trang_thai, tg_tao, tg_cap_nhat)
SELECT 'Đi muộn / về sớm', 3, 'Áp dụng cho toàn công ty', 1, '2025-01-05 08:00:00+00', '2025-01-15 09:30:00+00'
WHERE NOT EXISTS (SELECT 1 FROM fp_hr_nhom_phieu_hanh_chinh LIMIT 1);

INSERT INTO fp_hr_nhom_phieu_hanh_chinh (loai_phieu, so_luong_thang, ghi_chu, trang_thai, tg_tao, tg_cap_nhat)
SELECT 'Công tác', 6, 'Giới hạn theo cấp bậc', 1, '2025-01-06 08:00:00+00', '2025-01-20 10:20:00+00'
WHERE (SELECT COUNT(*) FROM fp_hr_nhom_phieu_hanh_chinh) < 2;

INSERT INTO fp_hr_nhom_phieu_hanh_chinh (loai_phieu, so_luong_thang, ghi_chu, trang_thai, tg_tao, tg_cap_nhat)
SELECT 'Quên chấm công', 2, 'Dùng cho trường hợp quên chấm công', 1, '2025-01-07 08:00:00+00', '2025-01-22 15:45:00+00'
WHERE (SELECT COUNT(*) FROM fp_hr_nhom_phieu_hanh_chinh) < 3;

INSERT INTO fp_hr_nhom_phieu_hanh_chinh (loai_phieu, so_luong_thang, ghi_chu, trang_thai, tg_tao, tg_cap_nhat)
SELECT 'Tăng ca', 10, 'Không giới hạn theo bộ phận', 1, '2025-01-08 08:00:00+00', '2025-01-25 11:00:00+00'
WHERE (SELECT COUNT(*) FROM fp_hr_nhom_phieu_hanh_chinh) < 4;

INSERT INTO fp_hr_nhom_phieu_hanh_chinh (loai_phieu, so_luong_thang, ghi_chu, trang_thai, tg_tao, tg_cap_nhat)
SELECT 'Xin nghỉ không lương', 2, 'Không lương', 1, '2025-01-09 08:00:00+00', '2025-01-30 14:00:00+00'
WHERE (SELECT COUNT(*) FROM fp_hr_nhom_phieu_hanh_chinh) < 5;

INSERT INTO fp_hr_nhom_phieu_hanh_chinh (loai_phieu, so_luong_thang, ghi_chu, trang_thai, tg_tao, tg_cap_nhat)
SELECT 'Xin nghỉ phép', 12, 'Nghỉ phép năm', 1, '2025-01-10 08:00:00+00', '2025-02-01 09:10:00+00'
WHERE (SELECT COUNT(*) FROM fp_hr_nhom_phieu_hanh_chinh) < 6;
