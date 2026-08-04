-- =====================================================================
-- BƯỚC 2 — KIỂM TRA SAU RESTORE (chạy trên fpfarm ở VPS)
--
--   psql "$VPS_DB_URL" -f docs/vps-02-postcheck.sql
--
-- Đối chiếu từng mục với kết quả docs/vps-00-discovery.sql chạy trên Supabase.
-- MỤC 1–4 phải trùng khớp tuyệt đối; lệch một dòng nào thì dừng, đừng đi tiếp.
--
-- Runbook: docs/VPS_MIGRATION.md
-- =====================================================================

\echo '=== 1) Row count từng bảng — so với discovery mục 3 ==='

-- Cùng query như discovery để so sánh trực tiếp (count(*) thật, không ước lượng).
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

\echo '=== 2) Số lượng object — so với discovery mục 4 ==='

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

\echo '=== 3) Sequence — so với discovery mục 5 ==='
-- Chỗ dễ hỏng nhất: sequence lệch thì insert mới đụng khoá chính. pg_dump có
-- kèm setval nhưng phải xác minh. Nếu lệch, xem cách sửa ở VPS_MIGRATION.md.

SELECT sequencename, last_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;

\echo '=== 3b) Sequence có last_value nhỏ hơn max(id) của bảng — PHẢI rỗng ==='
-- Bắt trực tiếp trường hợp sequence tụt hậu so với dữ liệu đã restore.

SELECT
  c.relname                        AS bang,
  a.attname                        AS cot,
  s.relname                        AS sequence,
  pg_sequence_last_value(s.oid)    AS seq_last_value,
  (xpath('/row/m/text()',
    query_to_xml(format('SELECT max(%I) AS m FROM public.%I', a.attname, c.relname), false, true, '')
  ))[1]::text::bigint              AS max_id
FROM pg_depend d
JOIN pg_class s     ON s.oid = d.objid  AND s.relkind = 'S'
JOIN pg_class c     ON c.oid = d.refobjid AND c.relkind = 'r'
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.refobjsubid
WHERE d.deptype IN ('a', 'i')
  AND c.relnamespace = 'public'::regnamespace
  AND coalesce(pg_sequence_last_value(s.oid), 0) < coalesce((xpath('/row/m/text()',
        query_to_xml(format('SELECT max(%I) AS m FROM public.%I', a.attname, c.relname), false, true, '')
      ))[1]::text::bigint, 0)
ORDER BY c.relname;

\echo '=== 4) Extension và schema chứa nó — so với discovery mục 2 ==='

SELECT e.extname, n.nspname AS schema, e.extversion
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
ORDER BY e.extname;

\echo '=== 5) Index GIN trgm còn nguyên (dấu hiệu pg_trgm đúng schema) ==='

SELECT count(*) AS so_index_trgm
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexdef ILIKE '%gin_trgm_ops%';

\echo '=== 6) Grant cho anon / authenticated — mất grant là PostgREST 401/403 hết ==='

SELECT grantee, count(*) AS so_grant
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee
ORDER BY grantee;

\echo '=== 7) Các RPC quan trọng phải tồn tại ==='
-- Không GỌI các hàm get_next_* ở đây: chúng dùng nextval nên gọi thử sẽ đốt mất
-- một số thứ tự (nextval không rollback được). Chỉ kiểm tra hàm có tồn tại.

SELECT ten_ham, to_regprocedure(ten_ham) IS NOT NULL AS ton_tai
FROM (VALUES
  ('public.rpc_get_session_bootstrap(text)'),
  ('public.rpc_set_mat_khau(bigint, text, boolean)'),
  ('public.rpc_verify_mat_khau(text, text)'),
  ('public.is_admin_current_user()'),
  ('public.get_next_so_phieu(text)'),
  ('public.get_next_so_phieu_farm_pt(text)'),
  ('public.get_next_so_po_don_dat_hang()'),
  ('public.rpc_ton_kho_matrix(bigint[])'),
  ('public.rpc_count_nhan_vien_by_chuc_vu()')
) AS v(ten_ham)
ORDER BY ten_ham;

\echo '=== 8) Hàm chỉ đọc — gọi thật để chắc thân hàm chạy được ==='

SELECT public.rpc_ton_kho_matrix(NULL::bigint[]) IS NOT NULL AS rpc_ton_kho_matrix_chay_duoc;

\echo '=== 9) RLS với JWT giả lập ==='
-- PostgREST đặt claim vào GUC request.jwt.claims; set_config mô phỏng đúng
-- cơ chế đó, nên đây là bài test thật cho RLS policy hiện tại.
-- 👉 ĐỔI email bên dưới thành một email admin thật (chuc_vu.tt = 1).

BEGIN;

SELECT set_config(
  'request.jwt.claims',
  '{"email":"admin@company.vn","role":"authenticated"}',
  true
);

SELECT auth.jwt() ->> 'email'          AS email_trong_jwt,
       public.is_admin_current_user()  AS la_admin;   -- kỳ vọng: true

-- Đọc dưới quyền `authenticated` để RLS thực sự có hiệu lực (owner bypass RLS).
SET LOCAL ROLE authenticated;

SELECT count(*) AS so_nhan_vien_doc_duoc FROM public.fp_var_nhan_vien;

SELECT jsonb_pretty(public.rpc_get_session_bootstrap('admin@company.vn'));

ROLLBACK;

\echo '=== 10) Mật khẩu hash — trạng thái trước cut-over ==='

SELECT
  count(*)                                  AS tong_nhan_vien,
  count(mat_khau_hash)                      AS da_co_hash,
  count(*) FILTER (WHERE phai_doi_mat_khau) AS phai_doi_mat_khau
FROM public.fp_var_nhan_vien;
