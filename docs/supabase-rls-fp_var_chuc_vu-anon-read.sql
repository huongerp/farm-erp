-- =============================================================================
-- Thêm policy cho phép anon đọc fp_var_chuc_vu (để dropdown chức vụ có dữ liệu
-- khi chưa đăng nhập hoặc khi RLS đang chặn). Chạy sau khi đã có bảng và RLS cơ bản.
-- Supabase Dashboard → SQL Editor
-- =============================================================================

-- Cho phép anon SELECT (bảng có thể đã có policy cho authenticated)
DROP POLICY IF EXISTS "Allow anon read fp_var_chuc_vu" ON fp_var_chuc_vu;
CREATE POLICY "Allow anon read fp_var_chuc_vu"
  ON fp_var_chuc_vu
  FOR SELECT
  TO anon
  USING (true);
