-- =============================================================================
-- Module Hàng hóa – Quản lý farm (tab Danh mục)
-- Bảng: fp_farm_danh_muc_hang_hoa (cây 2 cấp: danh_muc_cha_id = null là cấp 1)
-- Chạy trong Supabase Dashboard → SQL Editor
-- (Bảng cũ có trang_thai: chạy docs/supabase-fp_farm_alter_drop_trang_thai_va_thu_tu_hang_hoa.sql)
-- Sau khi tạo bảng: chạy docs/supabase-fp_farm_hang_hoa_rls_policies.sql nếu app đã đăng nhập mà vẫn không thấy dữ liệu (RLS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_farm_danh_muc_hang_hoa (
  id               bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_danh_muc      text,
  ten_danh_muc     text,
  danh_muc_cha_id  bigint REFERENCES fp_farm_danh_muc_hang_hoa(id) ON DELETE SET NULL,
  thu_tu           smallint,
  mo_ta            text,
  tg_tao           timestamptz DEFAULT now(),
  tg_cap_nhat      timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_farm_danh_muc_hang_hoa IS 'Danh mục hàng hóa farm (phân thuốc) – 2 cấp, danh_muc_cha_id null = cấp 1';
COMMENT ON COLUMN fp_farm_danh_muc_hang_hoa.danh_muc_cha_id IS 'Danh mục cha (null = cấp gốc)';

CREATE INDEX IF NOT EXISTS idx_fp_farm_danh_muc_hang_hoa_danh_muc_cha_id ON fp_farm_danh_muc_hang_hoa(danh_muc_cha_id);
CREATE INDEX IF NOT EXISTS idx_fp_farm_danh_muc_hang_hoa_thu_tu ON fp_farm_danh_muc_hang_hoa(thu_tu);
