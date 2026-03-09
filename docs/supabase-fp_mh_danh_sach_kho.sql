-- =============================================================================
-- Module Danh sách kho (Kho vận)
-- Bảng: fp_mh_danh_sach_kho
-- Liên kết chi nhánh: chi_nhanh_id → fp_var_chi_nhanh(id). Trạng thái: text.
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_mh_danh_sach_kho (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  chi_nhanh_id  bigint,
  ma_kho        text,
  ten_kho       text,
  dia_chi       text,
  mo_ta         text,
  thu_tu        smallint,
  trang_thai    text,
  tg_tao        timestamptz DEFAULT now(),
  tg_cap_nhat   timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_danh_sach_kho IS 'Danh sách kho – mỗi kho thuộc một chi nhánh (chi_nhanh_id)';
COMMENT ON COLUMN fp_mh_danh_sach_kho.chi_nhanh_id IS 'Tham chiếu fp_var_chi_nhanh(id), mỗi chi nhánh có thể có nhiều kho';
COMMENT ON COLUMN fp_mh_danh_sach_kho.trang_thai IS 'Đang hoạt động | Ngừng hoạt động';

CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_kho_chi_nhanh_id ON fp_mh_danh_sach_kho(chi_nhanh_id);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_kho_thu_tu ON fp_mh_danh_sach_kho(thu_tu);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_kho_trang_thai ON fp_mh_danh_sach_kho(trang_thai);

-- RLS (tùy chọn – bật nếu dùng auth)
-- ALTER TABLE fp_mh_danh_sach_kho ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read/write for authenticated" ON fp_mh_danh_sach_kho FOR ALL USING (true);
