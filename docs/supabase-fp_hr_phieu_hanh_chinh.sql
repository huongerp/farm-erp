-- =============================================================================
-- Bảng fp_hr_phieu_hanh_chinh (Phiếu hành chính)
-- Cấu trúc: id (PK bigint), loai_phieu_id (FK nhóm phiếu), nguoi_tao_id (FK nhân viên)
-- 1 cấp duyệt (trạng thái: Chờ duyệt, Đã duyệt, Từ chối, Đã hủy)
-- Chạy sau khi đã có bảng fp_hr_nhom_phieu_hanh_chinh và fp_var_nhan_vien
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_hr_phieu_hanh_chinh (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  loai_phieu_id   bigint REFERENCES fp_hr_nhom_phieu_hanh_chinh(id) ON DELETE SET NULL,
  ngay            date,
  ca              text,
  ly_do           text,
  trang_thai      text,
  ghi_chu         text,
  nguoi_tao_id    bigint REFERENCES fp_var_nhan_vien(id) ON DELETE SET NULL,
  tg_tao          timestamptz DEFAULT now(),
  tg_cap_nhat     timestamptz,
  CONSTRAINT chk_trang_thai CHECK (trang_thai IS NULL OR trang_thai IN (
    'Chờ duyệt', 'Đã duyệt', 'Từ chối', 'Đã hủy'
  )),
  CONSTRAINT chk_ca CHECK (ca IS NULL OR ca IN ('Sáng', 'Chiều', 'Cả ngày'))
);

COMMENT ON TABLE fp_hr_phieu_hanh_chinh IS 'Phiếu hành chính – đề xuất nghỉ, đi muộn, tăng ca...; 1 cấp duyệt quản lý';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.loai_phieu_id IS 'FK → fp_hr_nhom_phieu_hanh_chinh.id';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.ngay IS 'Ngày áp dụng';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.ca IS 'Ca: Sáng, Chiều, Cả ngày';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.ly_do IS 'Lý do';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.trang_thai IS 'Chờ duyệt | Đã duyệt | Từ chối | Đã hủy';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.ghi_chu IS 'Ghi chú';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.nguoi_tao_id IS 'FK → fp_var_nhan_vien.id (người tạo phiếu)';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.tg_tao IS 'Thời gian tạo';
COMMENT ON COLUMN fp_hr_phieu_hanh_chinh.tg_cap_nhat IS 'Thời gian cập nhật';

CREATE INDEX IF NOT EXISTS idx_fp_hr_phieu_ngay ON fp_hr_phieu_hanh_chinh(ngay DESC);
CREATE INDEX IF NOT EXISTS idx_fp_hr_phieu_nguoi_tao ON fp_hr_phieu_hanh_chinh(nguoi_tao_id);
CREATE INDEX IF NOT EXISTS idx_fp_hr_phieu_trang_thai ON fp_hr_phieu_hanh_chinh(trang_thai);
CREATE INDEX IF NOT EXISTS idx_fp_hr_phieu_loai ON fp_hr_phieu_hanh_chinh(loai_phieu_id);

ALTER TABLE fp_hr_phieu_hanh_chinh ENABLE ROW LEVEL SECURITY;

-- Policy chuẩn: Full access cho authenticated (đọc, thêm, sửa, xóa)
CREATE POLICY "Full_Access_Authenticated_Policy"
  ON fp_hr_phieu_hanh_chinh FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon đọc fp_hr_phieu_hanh_chinh"
  ON fp_hr_phieu_hanh_chinh FOR SELECT TO anon USING (true);
CREATE POLICY "Anon thêm/sửa/xóa fp_hr_phieu_hanh_chinh"
  ON fp_hr_phieu_hanh_chinh FOR ALL TO anon USING (true) WITH CHECK (true);

-- =============================================================================
-- Dữ liệu mẫu (cần có bản ghi trong fp_hr_nhom_phieu_hanh_chinh và fp_var_nhan_vien)
-- Dùng id = 1 cho nhóm phiếu và nhân viên; nếu khác thì sửa lại trong INSERT
-- =============================================================================
INSERT INTO fp_hr_phieu_hanh_chinh (
  loai_phieu_id, ngay, ca, ly_do, trang_thai, ghi_chu, nguoi_tao_id, tg_tao, tg_cap_nhat
)
SELECT 1, '2025-02-02'::date, 'Sáng', 'Kẹt xe do mưa lớn', 'Chờ duyệt', NULL, 1, now(), NULL
WHERE EXISTS (SELECT 1 FROM fp_hr_nhom_phieu_hanh_chinh WHERE id = 1)
  AND EXISTS (SELECT 1 FROM fp_var_nhan_vien WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM fp_hr_phieu_hanh_chinh LIMIT 1);

INSERT INTO fp_hr_phieu_hanh_chinh (
  loai_phieu_id, ngay, ca, ly_do, trang_thai, ghi_chu, nguoi_tao_id, tg_tao, tg_cap_nhat
)
SELECT 2, '2025-02-05'::date, 'Cả ngày', 'Đi công tác khách hàng Bình Dương', 'Chờ duyệt', NULL, 1, now(), NULL
WHERE EXISTS (SELECT 1 FROM fp_hr_nhom_phieu_hanh_chinh WHERE id = 2)
  AND EXISTS (SELECT 1 FROM fp_var_nhan_vien WHERE id = 1)
  AND (SELECT COUNT(*) FROM fp_hr_phieu_hanh_chinh) < 2;

INSERT INTO fp_hr_phieu_hanh_chinh (
  loai_phieu_id, ngay, ca, ly_do, trang_thai, ghi_chu, nguoi_tao_id, tg_tao, tg_cap_nhat
)
SELECT 1, '2025-01-29'::date, 'Chiều', 'Quên chấm công do thiết bị lỗi', 'Đã duyệt', NULL, 1, now() - interval '2 days', now()
WHERE EXISTS (SELECT 1 FROM fp_hr_nhom_phieu_hanh_chinh WHERE id = 1)
  AND EXISTS (SELECT 1 FROM fp_var_nhan_vien WHERE id = 1)
  AND (SELECT COUNT(*) FROM fp_hr_phieu_hanh_chinh) < 3;

INSERT INTO fp_hr_phieu_hanh_chinh (
  loai_phieu_id, ngay, ca, ly_do, trang_thai, ghi_chu, nguoi_tao_id, tg_tao, tg_cap_nhat
)
SELECT 4, '2025-01-19'::date, 'Chiều', 'Tăng ca hoàn thành báo cáo', 'Từ chối', 'Không đủ điều kiện', 1, now() - interval '5 days', now()
WHERE EXISTS (SELECT 1 FROM fp_hr_nhom_phieu_hanh_chinh WHERE id = 4)
  AND EXISTS (SELECT 1 FROM fp_var_nhan_vien WHERE id = 1)
  AND (SELECT COUNT(*) FROM fp_hr_phieu_hanh_chinh) < 4;
