-- =============================================================================
-- Module Hàng hóa – Quản lý farm (tab Hàng hóa)
-- Bảng: fp_farm_danh_sach_hang_hoa
-- Liên kết: danh_muc_id (cấp 2), danh_muc_cha_id (cấp 1) → fp_farm_danh_muc_hang_hoa(id).
-- Chạy trong Supabase Dashboard → SQL Editor (chạy sau fp_farm_danh_muc_hang_hoa)
-- (Bảng cũ có thu_tu/trang_thai: chạy docs/supabase-fp_farm_alter_drop_trang_thai_va_thu_tu_hang_hoa.sql)
-- RLS: docs/supabase-fp_farm_hang_hoa_rls_policies.sql (cả hai bảng farm hàng hóa)
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_farm_danh_sach_hang_hoa (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  danh_muc_id     bigint REFERENCES fp_farm_danh_muc_hang_hoa(id) ON DELETE SET NULL,
  danh_muc_cha_id bigint REFERENCES fp_farm_danh_muc_hang_hoa(id) ON DELETE SET NULL,
  ma_hang_hoa     text,
  ten_hang_hoa    text,
  dvt             text,
  don_gia         numeric,
  mo_ta           text,
  tg_tao          timestamptz DEFAULT now(),
  tg_cap_nhat     timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_farm_danh_sach_hang_hoa IS 'Danh sách hàng hóa farm – danh_muc_id = cấp 2, danh_muc_cha_id = cấp 1';
COMMENT ON COLUMN fp_farm_danh_sach_hang_hoa.danh_muc_id IS 'Danh mục cấp 2 (fp_farm_danh_muc_hang_hoa, có danh_muc_cha_id)';
COMMENT ON COLUMN fp_farm_danh_sach_hang_hoa.danh_muc_cha_id IS 'Danh mục cấp 1 (cha của danh_muc_id)';
COMMENT ON COLUMN fp_farm_danh_sach_hang_hoa.dvt IS 'Đơn vị tính: Kg, Lít, Bao, ...';

CREATE INDEX IF NOT EXISTS idx_fp_farm_danh_sach_hang_hoa_danh_muc_id ON fp_farm_danh_sach_hang_hoa(danh_muc_id);
CREATE INDEX IF NOT EXISTS idx_fp_farm_danh_sach_hang_hoa_danh_muc_cha_id ON fp_farm_danh_sach_hang_hoa(danh_muc_cha_id);
CREATE INDEX IF NOT EXISTS idx_fp_farm_danh_sach_hang_hoa_ma_hang_hoa ON fp_farm_danh_sach_hang_hoa(ma_hang_hoa);
