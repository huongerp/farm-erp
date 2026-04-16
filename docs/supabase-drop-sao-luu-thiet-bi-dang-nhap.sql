-- Xóa bảng / RPC liên quan module "Sao lưu & khôi phục" và "Thiết bị đăng nhập" (đã gỡ khỏi app).
-- Chạy trong Supabase SQL Editor (hoặc psql) trên project của bạn.
-- Sao lưu DB trước khi chạy nếu cần giữ dữ liệu lịch sử.

-- Bảng lịch sử sao lưu (ứng dụng dùng tên fp_var_backup)
DROP TABLE IF EXISTS public.fp_var_backup CASCADE;

-- Bảng phiên đăng nhập / thiết bị (ứng dụng dùng tên fp_var_login_devices)
DROP TABLE IF EXISTS public.fp_var_login_devices CASCADE;

-- RPC revoke_session: app gọi khi "đăng xuất thiết bị từ xa".
-- Chỉ xóa nếu hàm này được tạo riêng cho tính năng đó và không dùng ở đâu khác.
-- Kiểm tra chữ ký thực tế: SELECT proname, pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'revoke_session';
-- Ví dụ nếu tham số là uuid:
-- DROP FUNCTION IF EXISTS public.revoke_session(uuid);
