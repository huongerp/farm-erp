-- =============================================================================
-- RLS (Row Level Security) cho bảng fp_var_phong_ban
-- Nếu Supabase đã có dữ liệu nhưng app không hiển thị phòng ban/chức vụ,
-- thường do bảng bật RLS nhưng chưa có policy cho phép SELECT.
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

-- Bật RLS (nếu chưa bật)
ALTER TABLE fp_var_phong_ban ENABLE ROW LEVEL SECURITY;

-- Policy: cho phép anon (chưa đăng nhập) đọc – để dropdown phòng ban vẫn có dữ liệu
DROP POLICY IF EXISTS "Allow anon read fp_var_phong_ban" ON fp_var_phong_ban;
CREATE POLICY "Allow anon read fp_var_phong_ban"
  ON fp_var_phong_ban
  FOR SELECT
  TO anon
  USING (true);

-- Policy: cho phép authenticated đọc
DROP POLICY IF EXISTS "Allow authenticated read fp_var_phong_ban" ON fp_var_phong_ban;
CREATE POLICY "Allow authenticated read fp_var_phong_ban"
  ON fp_var_phong_ban
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: cho phép authenticated thêm/sửa/xóa
DROP POLICY IF EXISTS "Allow authenticated write fp_var_phong_ban" ON fp_var_phong_ban;
CREATE POLICY "Allow authenticated write fp_var_phong_ban"
  ON fp_var_phong_ban
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
