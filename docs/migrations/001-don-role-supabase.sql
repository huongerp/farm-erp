-- =============================================================================
-- 001-don-role-supabase.sql — xoá các role "giả" còn sót từ lúc restore dump Supabase
-- Chạy: 2026-09-30 trên cluster Postgres của VPS, bằng superuser, qua psql:
--   psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -f docs/migrations/001-don-role-supabase.sql
--
-- Lý do: lúc chuyển từ Supabase, 9 role NOLOGIN được tạo chỉ để các câu GRANT trong
-- dump không lỗi. Trong số đó `service_role` có BYPASSRLS và `authenticator` (role
-- PostgREST dùng) là thành viên của nó → ai có JWT secret ký token `role: service_role`
-- là đọc/ghi được mọi bảng đã GRANT cho role này mà bỏ qua RLS. App không dùng role này:
-- auth-service chỉ ký `role: authenticated`, không policy / hàm nào nhắc `service_role`.
--
-- GIỮ LẠI (đang dùng thật): anon, authenticated, authenticator, auth_service, notify_service.
--
-- Role là của cả cluster. Ngoài fpfarm, chỉ database `nostimevie` còn GRANT cho
-- `service_role` (không policy / hàm nào dùng, không ai đăng nhập được thành role đó).
-- =============================================================================

-- 1) fpfarm: cắt membership + gỡ mọi GRANT / default privilege của các role giả
\connect fpfarm
BEGIN;
REVOKE service_role FROM authenticator;
DROP OWNED BY
  service_role, supabase_admin, supabase_auth_admin, supabase_storage_admin,
  supabase_read_only_user, dashboard_user, authenticator_supabase, pgbouncer, postgres;
COMMIT;

-- 2) nostimevie: chỉ gỡ GRANT cấp cho service_role (không đụng dữ liệu hay role khác)
\connect nostimevie
DROP OWNED BY service_role;

-- 3) Xoá role (cấp cluster). Lỗi "cannot be dropped because some objects depend on it"
--    nghĩa là còn database khác dính role đó → soi pg_shdepend rồi DROP OWNED ở database đó.
\connect fpfarm
BEGIN;
DROP ROLE service_role;
DROP ROLE supabase_admin;
DROP ROLE supabase_auth_admin;
DROP ROLE supabase_storage_admin;
DROP ROLE supabase_read_only_user;
DROP ROLE dashboard_user;
DROP ROLE authenticator_supabase;
DROP ROLE pgbouncer;
DROP ROLE postgres;
COMMIT;
