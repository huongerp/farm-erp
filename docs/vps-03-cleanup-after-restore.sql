-- =====================================================================
-- BƯỚC 3 — DỌN DẸP SAU RESTORE (chỉ chạy trên fpfarm ở VPS)
--
--   psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -f docs/vps-03-cleanup-after-restore.sql
--
-- ⚠ TUYỆT ĐỐI KHÔNG chạy trên Supabase: file này bỏ phần ghi song song sang
--   auth.users, chạy nhầm bên Supabase sẽ làm admin không đổi được mật khẩu
--   cho người khác nữa. Có guard ở MỤC 0.
--
-- ⚠ Chạy SAU khi docs/vps-02-postcheck.sql đã sạch, và chỉ khi đã quyết định
--   dùng bản VPS. Trong lúc còn chạy song song hai hệ, giữ nguyên dual-write.
--
-- Runbook: docs/VPS_MIGRATION.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) GUARD
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF current_database() <> 'fpfarm' THEN
    RAISE EXCEPTION 'Chỉ chạy trên database `fpfarm` ở VPS, đang kết nối `%`.', current_database();
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1) rpc_set_mat_khau — bản không ghi song song sang auth.users
--    Giống bản ở docs/supabase-fp_var_nhan_vien_mat_khau.sql, chỉ khác là
--    đã bỏ block UPDATE auth.users ở cuối (không còn Supabase Auth).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_set_mat_khau(
  p_nhan_vien_id BIGINT,
  p_mat_khau     TEXT,
  p_phai_doi     BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email     TEXT;
  v_hash      TEXT;
  v_jwt_email TEXT := LOWER(NULLIF(auth.jwt() ->> 'email', ''));
BEGIN
  IF length(coalesce(p_mat_khau, '')) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải có tối thiểu 6 ký tự.';
  END IF;

  SELECT LOWER(email) INTO v_email
  FROM public.fp_var_nhan_vien
  WHERE id = p_nhan_vien_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy nhân viên id = %.', p_nhan_vien_id;
  END IF;

  IF NOT public.is_admin_current_user()
     AND (v_jwt_email IS NULL OR v_email IS DISTINCT FROM v_jwt_email) THEN
    RAISE EXCEPTION 'Không có quyền đặt mật khẩu cho nhân viên này.';
  END IF;

  v_hash := extensions.crypt(p_mat_khau, extensions.gen_salt('bf', 10));

  UPDATE public.fp_var_nhan_vien
  SET mat_khau_hash         = v_hash,
      mat_khau_cap_nhat_luc = now(),
      phai_doi_mat_khau     = p_phai_doi
  WHERE id = p_nhan_vien_id;
END $$;

REVOKE ALL ON FUNCTION public.rpc_set_mat_khau(BIGINT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_set_mat_khau(BIGINT, TEXT, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------
-- 2) Bỏ hàm chỉ có nghĩa với Supabase Auth
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.ensure_auth_user(TEXT);

-- ---------------------------------------------------------------------
-- 3) Cho auth service verify mật khẩu
--    rpc_verify_mat_khau cố ý KHÔNG grant cho anon/authenticated: mở cho anon
--    là biến nó thành endpoint đăng nhập public, bị brute-force ngay.
--    `authenticator` là role PostgREST kết nối bằng và chưa SET ROLE, nên chỉ
--    auth service (đi qua kết nối đó, trước khi đổi role) gọi được.
-- ---------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.rpc_verify_mat_khau(TEXT, TEXT) TO authenticator;

-- ---------------------------------------------------------------------
-- 4) Đảm bảo quyền cột trên fp_var_nhan_vien vẫn đúng sau restore
--    Chạy lại vì đây là quyền theo cột: thêm cột mới (hoặc restore từ bản dump
--    cũ hơn) là cột đó không đọc/ghi được qua REST.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_cols_read  TEXT;
  v_cols_write TEXT;
BEGIN
  SELECT
    string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
      FILTER (WHERE column_name <> 'mat_khau_hash'),
    string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
      FILTER (WHERE column_name NOT IN ('mat_khau_hash', 'phai_doi_mat_khau', 'mat_khau_cap_nhat_luc'))
  INTO v_cols_read, v_cols_write
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'fp_var_nhan_vien';

  REVOKE SELECT, INSERT, UPDATE ON public.fp_var_nhan_vien FROM anon, authenticated;

  EXECUTE format('GRANT SELECT (%s) ON public.fp_var_nhan_vien TO authenticated', v_cols_read);
  EXECUTE format('GRANT INSERT (%s) ON public.fp_var_nhan_vien TO authenticated', v_cols_write);
  EXECUTE format('GRANT UPDATE (%s) ON public.fp_var_nhan_vien TO authenticated', v_cols_write);
END $$;

-- ---------------------------------------------------------------------
-- 5) Xác nhận
-- ---------------------------------------------------------------------
SELECT 'rpc_set_mat_khau con ghi auth.users' AS kiem_tra,
       (prosrc ILIKE '%auth.users%')::text   AS gia_tri   -- kỳ vọng: false
FROM pg_proc WHERE oid = 'public.rpc_set_mat_khau(bigint,text,boolean)'::regprocedure
UNION ALL
SELECT 'ensure_auth_user con ton tai',
       (to_regprocedure('public.ensure_auth_user(text)') IS NOT NULL)::text  -- kỳ vọng: false
UNION ALL
SELECT 'authenticator goi duoc rpc_verify_mat_khau',
       has_function_privilege('authenticator', 'public.rpc_verify_mat_khau(text,text)', 'EXECUTE')::text
UNION ALL
SELECT 'anon goi duoc rpc_verify_mat_khau (phai la false)',
       has_function_privilege('anon', 'public.rpc_verify_mat_khau(text,text)', 'EXECUTE')::text
UNION ALL
SELECT 'authenticated doc duoc mat_khau_hash (phai la false)',
       has_column_privilege('authenticated', 'public.fp_var_nhan_vien', 'mat_khau_hash', 'SELECT')::text;

-- =====================================================================
-- CÒN LẠI Ở TẦNG HẠ TẦNG, KHÔNG PHẢI SQL:
--
--   1. Đóng port 5432 public trên VPS (hoặc chỉ allow IP của bạn qua firewall).
--      Đang mở 5432 ra Internet là rủi ro thật. PostgREST và auth service dùng
--      hostname nội bộ (VPS_DB_URL_INTERNAL) nên không cần port public.
--   2. Đổi mật khẩu DB — chuỗi kết nối cũ đã bị chia sẻ ngoài .env.
--      ALTER ROLE "5fedu" PASSWORD '<mật khẩu mới>';
--      rồi cập nhật .env (percent-encode) và biến môi trường trên Dokploy.
--   3. Xoá file lib/ensure-auth-user.ts và các chỗ gọi ensureAuthUser().
-- =====================================================================
