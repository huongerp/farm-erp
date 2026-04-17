-- =====================================================================
-- VIEW: v_nhan_vien_ref
-- Mục đích: Giảm cột/payload khi các trang chỉ cần id/ho_va_ten/email/trang_thai
-- (dropdown map tên trong phiếu kho, báo cáo, form lọc…). Thay cho việc
-- select trực tiếp `fp_var_nhan_vien` — giúp dễ áp RLS và tập trung column list.
--
-- LƯU Ý: Giữ toàn bộ nhân viên (kể cả `Nghỉ việc`) vì nhiều phiếu cũ vẫn cần
-- map id → tên sau khi nhân viên nghỉ. Nếu muốn lọc chỉ "Đang làm việc",
-- tạo view phụ `v_nhan_vien_ref_active` (gợi ý bên dưới).
--
-- BẢO MẬT (Supabase Linter cảnh báo "SECURITY DEFINER view"):
-- Mặc định PostgreSQL 15+ tạo view với `security_invoker = off`, khiến query
-- bên trong view chạy bằng quyền của OWNER (hành vi giống SECURITY DEFINER) —
-- bỏ qua RLS của user đang gọi. Ta bật `security_invoker = on` để view
-- luôn tôn trọng RLS/quyền của user hiện tại (đúng best-practice Supabase).
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nhan_vien_ref
WITH (security_invoker = on) AS
SELECT
  nv.id,
  nv.ho_va_ten,
  nv.email,
  nv.trang_thai
FROM public.fp_var_nhan_vien nv;

-- Đảm bảo áp dụng ngay cả khi view đã tồn tại từ lần chạy trước
-- (CREATE OR REPLACE VIEW không tự thay đổi storage params trên một số phiên bản):
ALTER VIEW public.v_nhan_vien_ref SET (security_invoker = on);

GRANT SELECT ON public.v_nhan_vien_ref TO authenticated;
GRANT SELECT ON public.v_nhan_vien_ref TO anon;

-- (Tuỳ chọn) View chỉ chứa NV đang làm việc cho các dropdown "chọn người thực hiện":
-- CREATE OR REPLACE VIEW public.v_nhan_vien_ref_active
-- WITH (security_invoker = on) AS
-- SELECT id, ho_va_ten, email
-- FROM public.fp_var_nhan_vien
-- WHERE trang_thai = 'Đang làm việc';
-- ALTER VIEW public.v_nhan_vien_ref_active SET (security_invoker = on);
-- GRANT SELECT ON public.v_nhan_vien_ref_active TO authenticated;
