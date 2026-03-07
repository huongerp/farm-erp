-- =============================================================================
-- Bảng fp_var_backup – Lịch sử sao lưu / khôi phục (đồng bộ với app Sao lưu & Khôi phục)
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_var_backup (
  id              text PRIMARY KEY,
  ten_file        text NOT NULL,
  collections     text[] NOT NULL DEFAULT '{}',
  format          text NOT NULL DEFAULT 'json',
  dung_luong      text,
  tg_tao          timestamptz NOT NULL DEFAULT now(),
  nguoi_thuc_hien text,
  loai            text NOT NULL CHECK (loai IN ('export', 'import', 'restore')),
  trang_thai      smallint NOT NULL DEFAULT 1 CHECK (trang_thai IN (0, 1, 2)),
  ghi_chu         text
);

COMMENT ON TABLE fp_var_backup IS 'Lịch sử thao tác sao lưu (export) và khôi phục (restore)';
COMMENT ON COLUMN fp_var_backup.id IS 'Mã bản ghi do app sinh, ví dụ EXP-1234567890, RST-1234567890';
COMMENT ON COLUMN fp_var_backup.ten_file IS 'Tên file backup (export/restore)';
COMMENT ON COLUMN fp_var_backup.collections IS 'Danh sách bộ dữ liệu: phong_ban, chuc_vu, nhan_vien, ...';
COMMENT ON COLUMN fp_var_backup.format IS 'Định dạng file: json, csv, xlsx';
COMMENT ON COLUMN fp_var_backup.loai IS 'export | import | restore';
COMMENT ON COLUMN fp_var_backup.trang_thai IS '0=thất bại, 1=thành công, 2=đang xử lý';

CREATE INDEX IF NOT EXISTS idx_fp_var_backup_tg_tao ON fp_var_backup(tg_tao DESC);
CREATE INDEX IF NOT EXISTS idx_fp_var_backup_loai ON fp_var_backup(loai);

ALTER TABLE fp_var_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated đọc fp_var_backup"
  ON fp_var_backup FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated thêm fp_var_backup"
  ON fp_var_backup FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated xóa fp_var_backup"
  ON fp_var_backup FOR DELETE TO authenticated USING (true);
