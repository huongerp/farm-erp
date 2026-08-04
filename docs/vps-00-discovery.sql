-- =====================================================================
-- BƯỚC 0 — DISCOVERY: thu thập thông tin trước khi dump Supabase sang VPS
--
-- Chạy TOÀN BỘ file này trên Supabase SQL Editor, lưu lại kết quả.
-- Sau đó chạy MỤC 1 (version) trên Postgres của VPS để so sánh.
--
-- Kết quả dùng để:
--   - Xác nhận pg_dump trên máy bạn >= phiên bản server Supabase.
--   - Biết pg_trgm / pgcrypto đang nằm ở schema nào → điền vào
--     docs/vps-01-prepare-target.sql (biến v_trgm_schema).
--   - Có row count chính xác để đối chiếu sau restore
--     (docs/vps-02-postcheck.sql dùng đúng query này).
--
-- Xem runbook: docs/VPS_MIGRATION.md
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Phiên bản Postgres. Chạy trên CẢ Supabase và VPS.
--    Yêu cầu: server VPS >= server Supabase, và pg_dump >= server Supabase.
-- ---------------------------------------------------------------------
SELECT version();
SELECT current_setting('server_version_num') AS server_version_num;

-- ---------------------------------------------------------------------
-- 2) Extension đang bật và schema chứa nó.
--    QUAN TRỌNG: pg_dump --schema=public KHÔNG kèm CREATE EXTENSION, nên
--    phải cài lại thủ công trên VPS vào ĐÚNG schema như ở đây — nếu lệch,
--    restore sẽ lỗi 'operator class "gin_trgm_ops" does not exist'.
-- ---------------------------------------------------------------------
SELECT e.extname, n.nspname AS schema, e.extversion
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY e.extname;

-- ---------------------------------------------------------------------
-- 3) Row count CHÍNH XÁC từng bảng trong public.
--    Dùng query_to_xml để count(*) thật, không lấy n_live_tup (chỉ là
--    số liệu ước lượng của autovacuum, thường lệch).
-- ---------------------------------------------------------------------
SELECT
  table_name,
  (xpath('/row/cnt/text()', xml_count))[1]::text::bigint AS row_count
FROM (
  SELECT
    table_name,
    query_to_xml(format('SELECT count(*) AS cnt FROM public.%I', table_name), false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
) t
ORDER BY table_name;

-- ---------------------------------------------------------------------
-- 4) Tổng số object trong public — để đối chiếu số lượng sau restore.
-- ---------------------------------------------------------------------
SELECT 'tables'    AS loai, count(*) FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
UNION ALL
SELECT 'views',     count(*) FROM information_schema.views WHERE table_schema = 'public'
UNION ALL
SELECT 'functions', count(*) FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public'
UNION ALL
SELECT 'policies',  count(*) FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'indexes',   count(*) FROM pg_indexes WHERE schemaname = 'public'
UNION ALL
SELECT 'sequences', count(*) FROM information_schema.sequences WHERE sequence_schema = 'public'
UNION ALL
SELECT 'triggers',  count(*) FROM information_schema.triggers WHERE trigger_schema = 'public'
ORDER BY loai;

-- ---------------------------------------------------------------------
-- 5) Giá trị hiện tại của mọi sequence.
--    Đây là thứ dễ hỏng nhất khi migrate: sequence lệch → insert mới đụng
--    khoá chính. pg_dump có kèm setval nhưng phải xác minh lại sau restore.
-- ---------------------------------------------------------------------
SELECT schemaname, sequencename, last_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

-- ---------------------------------------------------------------------
-- 6) Các role được GRANT trong public — dùng để biết cần tạo stub role nào
--    trên VPS trước khi restore (thiếu role thì câu GRANT tương ứng lỗi).
-- ---------------------------------------------------------------------
SELECT DISTINCT grantee
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
ORDER BY grantee;

-- ---------------------------------------------------------------------
-- 7) Kiểm tra dữ liệu mật khẩu (đã thêm ở bước trước).
--    Chưa cần đầy đủ lúc này — script copy hash chạy lúc cut-over.
-- ---------------------------------------------------------------------
SELECT
  count(*)                                        AS tong_nhan_vien,
  count(mat_khau_hash)                            AS da_co_hash,
  count(*) FILTER (WHERE phai_doi_mat_khau)       AS phai_doi_mat_khau,
  count(DISTINCT left(mat_khau_hash, 7))          AS so_loai_prefix_hash
FROM public.fp_var_nhan_vien;
