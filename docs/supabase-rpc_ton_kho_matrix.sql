-- =====================================================================
-- RPC: rpc_ton_kho_matrix(p_kho_ids bigint[] DEFAULT NULL)
-- Mục đích: Trả về toàn bộ ma trận tồn (kho × hàng) trong **một** response JSON,
-- thay cho nhiều request PostgREST phân trang (range). Có thể lọc theo danh sách kho
-- để giảm egress khi user chỉ được xem một số chi nhánh.
--
-- - p_kho_ids IS NULL  → tất cả dòng trong view fp_mh_ton_kho
-- - p_kho_ids = '{}'   → không có dòng (trả [] — dùng khi không có kho được phép)
-- - p_kho_ids = {1,2}  → chỉ các cặp có kho_id thuộc mảng
--
-- Chạy trên Supabase SQL Editor (hoặc migration). Cần view fp_mh_ton_kho đã tồn tại.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rpc_ton_kho_matrix(p_kho_ids bigint[] DEFAULT NULL)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'kho_id', t.kho_id,
        'id_hang_hoa', t.id_hang_hoa,
        'so_luong', t.so_luong
      )
      ORDER BY t.kho_id, t.id_hang_hoa
    ),
    '[]'::jsonb
  )
  FROM fp_mh_ton_kho t
  WHERE p_kho_ids IS NULL
     OR (cardinality(p_kho_ids) > 0 AND t.kho_id = ANY(p_kho_ids));
$$;

COMMENT ON FUNCTION public.rpc_ton_kho_matrix(bigint[]) IS
  'Ma trận tồn kho (JSON array). NULL = tất cả kho; mảng rỗng = không có dòng.';

GRANT EXECUTE ON FUNCTION public.rpc_ton_kho_matrix(bigint[]) TO anon, authenticated;
