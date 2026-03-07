-- =============================================================================
-- RLS (Row Level Security) cho bảng fp_var_nhan_vien
-- Chạy trong Supabase Dashboard → SQL Editor nếu sau khi đăng nhập đúng vẫn báo
-- "Không tìm thấy hồ sơ nhân viên tương ứng với email này."
-- Nguyên nhân thường là: bảng bật RLS nhưng chưa có policy cho phép SELECT.
-- =============================================================================

-- Bật RLS (nếu chưa bật)
ALTER TABLE fp_var_nhan_vien ENABLE ROW LEVEL SECURITY;

-- Policy: cho phép user đã đăng nhập (authenticated) được SELECT toàn bộ bảng
-- (để app có thể tìm nhân viên theo email sau khi login)
CREATE POLICY "Cho phép authenticated đọc fp_var_nhan_vien"
  ON fp_var_nhan_vien
  FOR SELECT
  TO authenticated
  USING (true);

-- (Tùy chọn) Nếu muốn giới hạn: chỉ cho đọc dòng có email trùng với user đang đăng nhập:
-- CREATE POLICY "User đọc đúng hồ sơ theo email"
--   ON fp_var_nhan_vien
--   FOR SELECT
--   TO authenticated
--   USING (email = (auth.jwt() ->> 'email'));
