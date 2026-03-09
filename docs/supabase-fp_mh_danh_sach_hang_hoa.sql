-- =============================================================================
-- Module Danh sách hàng hóa (Kho vận)
-- Bảng: fp_mh_danh_sach_hang_hoa
-- Liên kết: danh_muc_id (cấp 2), danh_muc_cha_id (cấp 1) → fp_mh_danh_muc_hang_hoa(id).
-- Trạng thái: text ("Đang hoạt động" | "Ngừng hoạt động"). Thu tự: min 1, tăng dần khi tạo mới.
-- Chạy trong Supabase Dashboard → SQL Editor (chạy sau fp_mh_danh_muc_hang_hoa)
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_mh_danh_sach_hang_hoa (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  danh_muc_id     bigint REFERENCES fp_mh_danh_muc_hang_hoa(id) ON DELETE SET NULL,
  danh_muc_cha_id bigint REFERENCES fp_mh_danh_muc_hang_hoa(id) ON DELETE SET NULL,
  ma_hang_hoa     text,
  ten_hang_hoa    text,
  dvt             text,
  thu_tu          smallint,
  trang_thai      text,
  don_gia         numeric,
  tg_tao          timestamptz DEFAULT now(),
  tg_cap_nhat     timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_danh_sach_hang_hoa IS 'Danh sách hàng hóa – danh_muc_id = danh mục cấp 2, danh_muc_cha_id = danh mục cấp 1';
COMMENT ON COLUMN fp_mh_danh_sach_hang_hoa.danh_muc_id IS 'Tham chiếu danh mục cấp 2 (fp_mh_danh_muc_hang_hoa, có danh_muc_cha_id)';
COMMENT ON COLUMN fp_mh_danh_sach_hang_hoa.danh_muc_cha_id IS 'Tham chiếu danh mục cấp 1 (cha của danh_muc_id)';
COMMENT ON COLUMN fp_mh_danh_sach_hang_hoa.dvt IS 'Đơn vị tính: Cái, Kg, Thùng, ...';
COMMENT ON COLUMN fp_mh_danh_sach_hang_hoa.trang_thai IS 'Đang hoạt động | Ngừng hoạt động';

CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_hang_hoa_danh_muc_id ON fp_mh_danh_sach_hang_hoa(danh_muc_id);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_hang_hoa_danh_muc_cha_id ON fp_mh_danh_sach_hang_hoa(danh_muc_cha_id);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_hang_hoa_ma_hang_hoa ON fp_mh_danh_sach_hang_hoa(ma_hang_hoa);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_hang_hoa_thu_tu ON fp_mh_danh_sach_hang_hoa(thu_tu);
CREATE INDEX IF NOT EXISTS idx_fp_mh_danh_sach_hang_hoa_trang_thai ON fp_mh_danh_sach_hang_hoa(trang_thai);
