-- =============================================================================
-- Module Danh mục hàng hóa (Kho vận)
-- Bảng: fp_mh_danh_muc_hang_hoa (cây 2 cấp: danh_muc_cha_id = null là cấp 1)
-- Trạng thái: text, giá trị "Đang hoạt động" | "Ngừng hoạt động"
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_mh_danh_muc_hang_hoa (
  id               bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_danh_muc      text,
  ten_danh_muc     text,
  danh_muc_cha_id  bigint REFERENCES fp_mh_danh_muc_hang_hoa(id) ON DELETE SET NULL,
  thu_tu           smallint,
  mo_ta            text,
  trang_thai       text,
  tg_tao           timestamptz DEFAULT now(),
  tg_cap_nhat      timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_danh_muc_hang_hoa IS 'Danh mục hàng hóa 2 cấp – danh_muc_cha_id null = cấp 1';
COMMENT ON COLUMN fp_mh_danh_muc_hang_hoa.danh_muc_cha_id IS 'Danh mục cha (null = cấp gốc)';
COMMENT ON COLUMN fp_mh_danh_muc_hang_hoa.trang_thai IS 'Đang hoạt động | Ngừng hoạt động';

CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_muc_hang_hoa_danh_muc_cha_id ON fp_mh_danh_muc_hang_hoa(danh_muc_cha_id);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_muc_hang_hoa_thu_tu ON fp_mh_danh_muc_hang_hoa(thu_tu);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_muc_hang_hoa_trang_thai ON fp_mh_danh_muc_hang_hoa(trang_thai);
