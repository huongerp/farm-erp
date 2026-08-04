-- =====================================================================
-- BƯỚC 1 — CHUẨN BỊ DATABASE ĐÍCH (fpfarm trên VPS)
--
-- ⚠ CHẠY TRÊN VPS, KHÔNG CHẠY TRÊN SUPABASE. Script này DROP SCHEMA public.
--   Có guard ở MỤC 0 để chặn chạy nhầm, nhưng vẫn phải tự kiểm tra.
--
-- ⚠ CHẠY TRƯỚC KHI pg_restore, không phải sau. Lý do:
--   public.is_admin_current_user() là LANGUAGE sql và tham chiếu auth.jwt().
--   Postgres validate thân hàm LANGUAGE sql ngay lúc CREATE, và biểu thức
--   của RLS policy cũng bị parse lúc restore. Chưa có schema auth + hàm
--   auth.jwt() thì pg_restore chết với 'schema "auth" does not exist'.
--
-- Cách chạy (dùng script để khỏi tự truyền tham số):
--
--   ./scripts/vps-dump-restore.sh prepare
--
-- Hoặc gọi psql trực tiếp:
--
--   psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 \
--     -v authenticator_password="$PGRST_AUTHENTICATOR_PASSWORD" \
--     -v trgm_schema=public \
--     -f docs/vps-01-prepare-target.sql
--
-- Runbook đầy đủ: docs/VPS_MIGRATION.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tham số
--   authenticator_password  BẮT BUỘC — mật khẩu role `authenticator`.
--   trgm_schema             Schema cài pg_trgm, mặc định `public`.
--                           PHẢI khớp Supabase, nếu không restore sẽ lỗi
--                           'operator class "gin_trgm_ops" does not exist'.
--                           Script vps-dump-restore.sh tự dò từ file dump.
-- ---------------------------------------------------------------------
\if :{?trgm_schema}
\else
  \set trgm_schema public
\endif

-- Không dùng \quit khi thiếu tham số: \quit trả exit code 0 nên script gọi
-- sẽ tưởng là thành công. Để rỗng rồi cho khối DO ở MỤC 4 raise lỗi thật.
\if :{?authenticator_password}
\else
  \echo 'LỖI: thiếu -v authenticator_password=... (lấy PGRST_AUTHENTICATOR_PASSWORD trong .env)'
  \set authenticator_password ''
\endif

-- psql KHÔNG nội suy biến bên trong chuỗi dollar-quote, nên hai tham số trên
-- được chuyển vào GUC của session rồi các khối DO đọc lại bằng current_setting.
SELECT set_config('vps.trgm_schema', :'trgm_schema', false) AS trgm_schema;
SELECT set_config('vps.authenticator_password', :'authenticator_password', false) IS NOT NULL
       AS da_nhan_mat_khau_authenticator;

-- ---------------------------------------------------------------------
-- 0) GUARD — chặn chạy nhầm trên Supabase (database ở đó tên `postgres`).
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF current_database() <> 'fpfarm' THEN
    RAISE EXCEPTION
      'Script này chỉ chạy trên database đích `fpfarm`, đang kết nối `%`. Dừng để tránh xoá dữ liệu.',
      current_database();
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1) Reset schema public
--    Database đích đang trống nên xoá sạch để restore không đụng object cũ.
--    Nếu đã có dữ liệu thật ở đây thì DỪNG LẠI và backup trước.
-- ---------------------------------------------------------------------
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- ---------------------------------------------------------------------
-- 2) Extension
--    pg_dump --schema=public KHÔNG kèm CREATE EXTENSION, phải cài tay.
--    Schema PHẢI khớp với Supabase (xem discovery mục 2), vì dump ghi tên
--    opclass đầy đủ (public.gin_trgm_ops hoặc extensions.gin_trgm_ops).
--
--    pgcrypto BẮT BUỘC ở schema `extensions`: rpc_set_mat_khau và
--    rpc_verify_mat_khau gọi extensions.crypt / extensions.gen_salt.
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- uuid-ossp: Supabase bật sẵn ở `extensions`. Bản dump hiện tại không dùng tới
-- (không có cột nào DEFAULT uuid_generate_v4), nên cài cho khớp cấu hình nguồn
-- nhưng không để thiếu package trên image Postgres làm cả script dừng.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Không cài được uuid-ossp (%). Bỏ qua vì schema public không dùng.', SQLERRM;
END $$;

DO $$
DECLARE
  v_trgm_schema TEXT := current_setting('vps.trgm_schema');
BEGIN
  EXECUTE format('CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA %I', v_trgm_schema);
  RAISE NOTICE 'pg_trgm cài vào schema %', v_trgm_schema;
END $$;

-- ---------------------------------------------------------------------
-- 3) search_path cấp database — giống cấu hình Supabase, để tên không
--    qualify (gin_trgm_ops, crypt) vẫn resolve được.
--    Chỉ có hiệu lực ở KẾT NỐI MỚI — phải đóng session hiện tại rồi mở lại.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  EXECUTE format(
    'ALTER DATABASE %I SET search_path TO "$user", public, extensions',
    current_database()
  );
END $$;

-- ---------------------------------------------------------------------
-- 4) Role cho PostgREST
--    anon           — request chưa đăng nhập
--    authenticated  — request có JWT hợp lệ
--    authenticator  — role PostgREST dùng để kết nối, tự SET ROLE sang 2 role trên
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_authenticator_password TEXT := current_setting('vps.authenticator_password');
BEGIN
  IF length(v_authenticator_password) < 16 THEN
    RAISE EXCEPTION 'Mật khẩu authenticator quá ngắn (% ký tự). Sinh bằng: openssl rand -base64 32',
      length(v_authenticator_password);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    EXECUTE format('CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD %L', v_authenticator_password);
  ELSE
    EXECUTE format('ALTER ROLE authenticator PASSWORD %L', v_authenticator_password);
  END IF;

  GRANT anon, authenticated TO authenticator;
END $$;

-- ---------------------------------------------------------------------
-- 5) Stub role
--    Dump giữ nguyên toàn bộ GRANT của Supabase, trong đó có grant tới các
--    role riêng của Supabase. Thiếu role → từng câu GRANT đó lỗi, và với
--    pg_restore --single-transaction thì cả lần restore bị rollback.
--    Các role này NOLOGIN và không được cấp quyền gì thêm.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_role TEXT;
BEGIN
  FOREACH v_role IN ARRAY ARRAY[
    'postgres',
    'service_role',
    'supabase_admin',
    'supabase_auth_admin',
    'supabase_storage_admin',
    'supabase_read_only_user',
    'dashboard_user',
    'authenticator_supabase',
    'pgbouncer'
  ]
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = v_role) THEN
      EXECUTE format('CREATE ROLE %I NOLOGIN', v_role);
      RAISE NOTICE 'Tạo stub role %', v_role;
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 6) Schema auth + shim
--    PHẢI có trước restore (xem giải thích ở đầu file).
--    Code hiện tại chỉ dùng auth.jwt(); auth.uid() và auth.role() thêm vào
--    để phòng object nào trong dump còn tham chiếu tới.
--
--    PostgREST đặt claim vào GUC request.jwt.claims, đúng cơ chế Supabase
--    dùng, nên RLS policy hiện tại chạy y nguyên không cần sửa.
-- ---------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::jsonb
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(auth.jwt() ->> 'sub', '')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(nullif(auth.jwt() ->> 'role', ''), 'anon')
$$;

-- ---------------------------------------------------------------------
-- 7) Grant trên schema
--    Grant trong public sẽ do dump mang sang; ở đây chỉ mở USAGE để
--    PostgREST truy cập được, và cấp quyền cho auth shim.
-- ---------------------------------------------------------------------
GRANT USAGE ON SCHEMA public     TO anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated;
GRANT USAGE ON SCHEMA auth       TO anon, authenticated;

GRANT EXECUTE ON FUNCTION auth.jwt()  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid()  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 8) Xác nhận đã sẵn sàng restore
-- ---------------------------------------------------------------------
SELECT 'extensions' AS kiem_tra, e.extname || ' @ ' || n.nspname AS gia_tri
FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE e.extname IN ('pg_trgm', 'pgcrypto', 'uuid-ossp')
UNION ALL
SELECT 'roles', string_agg(rolname, ', ' ORDER BY rolname)
FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'authenticator')
UNION ALL
SELECT 'auth.jwt()', auth.jwt()::text
UNION ALL
SELECT 'so object trong public', count(*)::text
FROM pg_class WHERE relnamespace = 'public'::regnamespace;
