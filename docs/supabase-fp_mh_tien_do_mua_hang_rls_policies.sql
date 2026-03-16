-- Chạy script này nếu đã tạo bảng fp_mh_tien_do_mua_hang nhưng app không hiển thị dữ liệu (thiếu RLS policies).
-- Chạy trong Supabase Dashboard → SQL Editor.

-- Bật RLS nếu chưa bật
ALTER TABLE fp_mh_tien_do_mua_hang ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có (để chạy lại được)
DROP POLICY IF EXISTS "Allow select tien_do_mua_hang" ON fp_mh_tien_do_mua_hang;
DROP POLICY IF EXISTS "Allow insert tien_do_mua_hang" ON fp_mh_tien_do_mua_hang;
DROP POLICY IF EXISTS "Allow update tien_do_mua_hang" ON fp_mh_tien_do_mua_hang;
DROP POLICY IF EXISTS "Allow delete tien_do_mua_hang" ON fp_mh_tien_do_mua_hang;

-- Tạo policy: cho phép user đã đăng nhập (authenticated) đọc/ghi
CREATE POLICY "Allow select tien_do_mua_hang" ON fp_mh_tien_do_mua_hang
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert tien_do_mua_hang" ON fp_mh_tien_do_mua_hang
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update tien_do_mua_hang" ON fp_mh_tien_do_mua_hang
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete tien_do_mua_hang" ON fp_mh_tien_do_mua_hang
  FOR DELETE TO authenticated USING (true);
