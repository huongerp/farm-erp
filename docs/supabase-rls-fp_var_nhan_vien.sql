-- =====================================================================
-- RLS policy cho fp_var_nhan_vien
--
-- Mục tiêu:
--   - Một user đăng nhập (authenticated) chỉ SELECT được dòng nhân viên tương
--     ứng với email của chính họ (hồ sơ cá nhân + session bootstrap).
--   - User có chức vụ admin (tt = 1) được SELECT/INSERT/UPDATE/DELETE toàn bảng.
--   - Cho phép SELECT toàn bảng qua view `v_nhan_vien_ref` (đọc id/ho_va_ten/email
--     để map tên trong phiếu kho, báo cáo…) vì view này đã tối giản cột.
--
-- Lưu ý:
--   - Policy này giả định dữ liệu email đã được chuẩn hoá lowercase
--     (xem docs/supabase-normalize-nhan-vien-email.sql).
--   - RPC `rpc_get_session_bootstrap` đang dùng SECURITY DEFINER nên không bị
--     policy SELECT chặn khi bootstrap phiên.
--   - RPC `rpc_count_nhan_vien_by_chuc_vu` cũng SECURITY DEFINER.
-- =====================================================================

-- 1) Bật RLS (idempotent)
ALTER TABLE public.fp_var_nhan_vien ENABLE ROW LEVEL SECURITY;

-- 2) Hàm tiện ích: xác định user hiện tại có phải admin không
-- (dựa vào chuc_vu.tt = 1). Được dùng trong nhiều policy để tránh trùng lặp.
CREATE OR REPLACE FUNCTION public.is_admin_current_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fp_var_nhan_vien nv
    JOIN public.fp_var_chuc_vu cv ON cv.id = nv.chuc_vu_id
    WHERE LOWER(nv.email) = LOWER(auth.jwt() ->> 'email')
      AND cv.tt = 1
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_current_user() TO authenticated;

-- 3) Policy SELECT: user xem được dòng của chính mình, admin xem tất cả.
DROP POLICY IF EXISTS nhan_vien_select_self_or_admin ON public.fp_var_nhan_vien;
CREATE POLICY nhan_vien_select_self_or_admin
  ON public.fp_var_nhan_vien
  FOR SELECT
  TO authenticated
  USING (
    LOWER(email) = LOWER(auth.jwt() ->> 'email')
    OR public.is_admin_current_user()
  );

-- 4) Policy INSERT/UPDATE/DELETE: chỉ admin.
DROP POLICY IF EXISTS nhan_vien_insert_admin ON public.fp_var_nhan_vien;
CREATE POLICY nhan_vien_insert_admin
  ON public.fp_var_nhan_vien
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_current_user());

DROP POLICY IF EXISTS nhan_vien_update_admin ON public.fp_var_nhan_vien;
CREATE POLICY nhan_vien_update_admin
  ON public.fp_var_nhan_vien
  FOR UPDATE
  TO authenticated
  USING (public.is_admin_current_user())
  WITH CHECK (public.is_admin_current_user());

DROP POLICY IF EXISTS nhan_vien_delete_admin ON public.fp_var_nhan_vien;
CREATE POLICY nhan_vien_delete_admin
  ON public.fp_var_nhan_vien
  FOR DELETE
  TO authenticated
  USING (public.is_admin_current_user());

-- 5) VIEW `v_nhan_vien_ref` kế thừa RLS từ bảng gốc (PostgreSQL mặc định).
-- Muốn toàn bộ user xem được (map tên trong phiếu kho), định nghĩa lại view
-- với SECURITY DEFINER/bypass RLS bằng cách dùng hàm wrapper:
CREATE OR REPLACE FUNCTION public.fn_nhan_vien_ref()
RETURNS TABLE (
  id BIGINT,
  ho_va_ten TEXT,
  email TEXT,
  trang_thai TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id::BIGINT, ho_va_ten, email, trang_thai::TEXT
  FROM public.fp_var_nhan_vien;
$$;

GRANT EXECUTE ON FUNCTION public.fn_nhan_vien_ref() TO authenticated;

-- (Tuỳ chọn) Thay thế view bằng wrapper của hàm — đảm bảo mọi authenticated user
-- đọc được ref list mà không cần mở RLS SELECT toàn bảng:
-- DROP VIEW IF EXISTS public.v_nhan_vien_ref;
-- CREATE VIEW public.v_nhan_vien_ref AS
-- SELECT * FROM public.fn_nhan_vien_ref();
-- GRANT SELECT ON public.v_nhan_vien_ref TO authenticated;

-- =====================================================================
-- KIỂM THỬ (chạy thử sau khi deploy):
--   SET role anon;          -- mô phỏng chưa đăng nhập
--   SELECT count(*) FROM public.fp_var_nhan_vien; -- phải lỗi / 0 dòng
--   RESET role;
-- =====================================================================
