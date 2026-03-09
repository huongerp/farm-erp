-- =============================================================================
-- Migration: fp_var_phong_ban – chuyển cột trang_thai từ 0/1 sang text
-- Giá trị: 'Đang dùng' | 'Ngừng' (khớp lib/constants TRANG_THAI)
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

-- Bước 1: Đổi kiểu cột sang TEXT và chuyển dữ liệu cũ 0/1 sang text
-- (Nếu cột đang là integer/smallint)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'fp_var_phong_ban' AND column_name = 'trang_thai'
  ) THEN
    ALTER TABLE fp_var_phong_ban
    ALTER COLUMN trang_thai TYPE text
    USING (
      CASE
        WHEN trang_thai::text IN ('1', 't', 'true') THEN 'Đang dùng'
        WHEN trang_thai::text IN ('0', 'f', 'false') THEN 'Ngừng'
        WHEN trang_thai::text IN ('Đang dùng', 'Ngừng') THEN trang_thai::text
        ELSE 'Đang dùng'
      END
    );
    -- Default cho bản ghi mới (khi insert không truyền trang_thai)
    ALTER TABLE fp_var_phong_ban
    ALTER COLUMN trang_thai SET DEFAULT 'Đang dùng';
  END IF;
END $$;

-- Ghi chú sau migration:
-- trang_thai: text, giá trị 'Đang dùng' | 'Ngừng', default 'Đang dùng'
