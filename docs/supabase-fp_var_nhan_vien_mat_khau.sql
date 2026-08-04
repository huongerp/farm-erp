-- =====================================================================
-- fp_var_nhan_vien: cột mật khẩu hash (bcrypt) + RPC đặt/xác thực mật khẩu
--
-- Mục đích: chuẩn bị bỏ Supabase Auth để chuyển sang Postgres self-host
-- trên VPS. Mật khẩu được hash bằng pgcrypto `crypt(pw, gen_salt('bf', 10))`
-- → sinh ra format `$2a$10$...`, TRÙNG với bcrypt cost 10 mà Supabase GoTrue
-- đang dùng ở `auth.users.encrypted_password`. Nhờ vậy:
--   - Copy được hash sẵn có từ auth.users sang cột mới (xem
--     docs/supabase-migrate-auth-password-hash.sql) → user giữ nguyên mật khẩu.
--   - Service auth trên VPS (Node bcrypt / Go) verify được cùng một hash.
--
-- Hash luôn được sinh SERVER-SIDE trong RPC, không hash ở browser. Trong giai
-- đoạn chuyển tiếp, rpc_set_mat_khau ghi song song sang auth.users để đăng nhập
-- qua Supabase Auth vẫn dùng được mật khẩu mới.
--
-- Chạy trên Supabase SQL Editor. Idempotent — chạy lại nhiều lần vô hại.
--
-- Nếu chưa từng chạy docs/supabase-rls-fp_var_nhan_vien.sql, file này vẫn tự
-- tạo hàm is_admin_current_user() (khối 0 bên dưới). Chạy đầy đủ file RLS sau
-- vẫn an toàn (CREATE OR REPLACE).
-- =====================================================================

-- 0) Đảm bảo có hàm phân quyền admin (tương thích file RLS nếu chưa chạy).
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

-- 1) pgcrypto (Supabase đặt extension ở schema `extensions`).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2) Các cột mật khẩu.
ALTER TABLE public.fp_var_nhan_vien
  ADD COLUMN IF NOT EXISTS mat_khau_hash TEXT,
  ADD COLUMN IF NOT EXISTS phai_doi_mat_khau BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mat_khau_cap_nhat_luc TIMESTAMPTZ;

COMMENT ON COLUMN public.fp_var_nhan_vien.mat_khau_hash IS
  'Bcrypt hash (format $2a$10$...) — tương thích auth.users.encrypted_password. Chỉ ghi qua rpc_set_mat_khau, KHÔNG select ra frontend.';
COMMENT ON COLUMN public.fp_var_nhan_vien.phai_doi_mat_khau IS
  'TRUE khi mật khẩu đang là mặc định/do admin cấp — buộc user đổi ở lần đăng nhập kế tiếp.';
COMMENT ON COLUMN public.fp_var_nhan_vien.mat_khau_cap_nhat_luc IS
  'Lần cuối mat_khau_hash được ghi.';

-- 3) Chặn mat_khau_hash lọt ra PostgREST bằng column-level privilege.
--
-- App hiện tại luôn select bằng column list tường minh (EMPLOYEE_AUTH_SELECT,
-- EMPLOYEE_DETAIL_SELECT… trong nhan-vien-service.ts) nên không tự rò rỉ, nhưng
-- đây là lớp phòng thủ thứ hai: kể cả ai đó gọi thẳng `?select=*` qua REST thì
-- Postgres cũng từ chối.
--
-- - SELECT: cấp mọi cột TRỪ mat_khau_hash (frontend vẫn cần đọc
--   phai_doi_mat_khau để bật luồng bắt đổi mật khẩu).
-- - INSERT/UPDATE: cấp mọi cột TRỪ cả 3 cột mật khẩu — chúng chỉ được ghi qua
--   rpc_set_mat_khau (SECURITY DEFINER nên bỏ qua các grant này).
--
-- QUAN TRỌNG: mỗi lần thêm cột mới vào fp_var_nhan_vien phải chạy lại block này,
-- nếu không cột mới sẽ không đọc/ghi được qua REST.
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

-- 4) RPC đặt mật khẩu — nguồn ghi DUY NHẤT cho mat_khau_hash.
--
-- Quyền: admin (chuc_vu.tt = 1) đặt cho bất kỳ ai; user thường chỉ đặt cho
-- chính mình (so email với JWT).
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
  v_email      TEXT;
  v_hash       TEXT;
  v_jwt_email  TEXT := LOWER(NULLIF(auth.jwt() ->> 'email', ''));
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

  -- GHI SONG SONG sang Supabase Auth (giai đoạn chuyển tiếp).
  --
  -- Cần thiết vì client SDK chỉ đổi được mật khẩu của CHÍNH user đang đăng nhập
  -- (supabase.auth.updateUser); admin đặt mật khẩu cho người khác thì không có
  -- đường nào ngoài việc ghi thẳng auth.users từ hàm SECURITY DEFINER như đây.
  --
  -- Hash bcrypt $2a$10$ do pgcrypto sinh ra được GoTrue verify bình thường.
  -- XOÁ BLOCK NÀY sau khi cắt sang Postgres/VPS (lúc đó không còn schema auth).
  IF v_email IS NOT NULL AND to_regclass('auth.users') IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = v_hash,
        updated_at         = now()
    WHERE LOWER(email) = v_email;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.rpc_set_mat_khau(BIGINT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_set_mat_khau(BIGINT, TEXT, BOOLEAN) TO authenticated;

-- 5) RPC xác thực mật khẩu — MẢNH GHÉP CHO SERVICE AUTH TRÊN VPS.
--
-- CỐ Ý KHÔNG GRANT cho anon/authenticated: nếu mở cho anon thì đây thành
-- endpoint đăng nhập public và bị brute-force. Khi dựng auth service trên VPS,
-- tạo một role riêng (vd `auth_service`) và GRANT EXECUTE cho role đó thôi.
CREATE OR REPLACE FUNCTION public.rpc_verify_mat_khau(
  p_email    TEXT,
  p_mat_khau TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_row public.fp_var_nhan_vien;
BEGIN
  SELECT * INTO v_row
  FROM public.fp_var_nhan_vien
  WHERE email = LOWER(TRIM(coalesce(p_email, '')));

  -- Trả về cùng một kết quả cho "email không tồn tại" và "sai mật khẩu"
  -- để không tiết lộ email nào có trong hệ thống.
  IF v_row.id IS NULL
     OR v_row.mat_khau_hash IS NULL
     OR extensions.crypt(coalesce(p_mat_khau, ''), v_row.mat_khau_hash) IS DISTINCT FROM v_row.mat_khau_hash THEN
    RETURN jsonb_build_object('ok', FALSE);
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'id', v_row.id,
    'email', v_row.email,
    'trang_thai', v_row.trang_thai,
    'phai_doi_mat_khau', v_row.phai_doi_mat_khau
  );
END $$;

REVOKE ALL ON FUNCTION public.rpc_verify_mat_khau(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- =====================================================================
-- KIỂM THỬ (chạy sau khi deploy):
--
--   -- (a) authenticated KHÔNG đọc được cột hash. Quyền cột được kiểm tra TRƯỚC
--   --     RLS nên câu đầu lỗi ngay; câu sau chạy được (trả 0 dòng vì RLS chặn).
--   SET role authenticated;
--   SELECT mat_khau_hash FROM public.fp_var_nhan_vien LIMIT 1;      -- permission denied
--   SELECT phai_doi_mat_khau FROM public.fp_var_nhan_vien LIMIT 1;  -- OK, 0 dòng
--   RESET role;
--
--   -- (b) Đặt mật khẩu rồi verify. RPC đọc email từ JWT nên trong SQL Editor
--   --     phải giả lập claims, nếu không sẽ báo 'Không có quyền'.
--   --     Dùng email của một nhân viên có chức vụ admin (chuc_vu.tt = 1).
--   SELECT set_config('request.jwt.claims', '{"email":"admin@company.vn"}', TRUE);
--   SELECT public.rpc_set_mat_khau(<id>, 'test123', TRUE);
--   SELECT extensions.crypt('test123', mat_khau_hash) = mat_khau_hash
--   FROM public.fp_var_nhan_vien WHERE id = <id>;   -- phải: true
--
--   -- (c) Định dạng hash phải là bcrypt cost 10:
--   SELECT left(mat_khau_hash, 7) FROM public.fp_var_nhan_vien WHERE id = <id>; -- $2a$10$
--
--   -- (d) Hash mới cũng đã đồng bộ sang Supabase Auth:
--   SELECT mat_khau_hash = (
--     SELECT encrypted_password FROM auth.users u
--     WHERE LOWER(u.email) = LOWER(nv.email)
--   ) FROM public.fp_var_nhan_vien nv WHERE nv.id = <id>;  -- phải: true
-- =====================================================================
