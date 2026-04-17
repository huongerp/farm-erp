-- =====================================================================
-- RPC: distinct text cho combobox fp_ts_tai_san (thay vì SELECT cả cột rồi distinct ở client).
-- Mỗi hàm trả jsonb mảng chuỗi đã sort theo locale vi (trong SQL dùng COLLATE nếu cần).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rpc_fp_ts_distinct_thuong_hieu()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(thuong_hieu) AS trimmed
    FROM fp_ts_tai_san
    WHERE thuong_hieu IS NOT NULL AND trim(thuong_hieu) <> ''
  ) s;
$$;

CREATE OR REPLACE FUNCTION public.rpc_fp_ts_distinct_model()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(model) AS trimmed
    FROM fp_ts_tai_san
    WHERE model IS NOT NULL AND trim(model) <> ''
  ) s;
$$;

CREATE OR REPLACE FUNCTION public.rpc_fp_ts_distinct_xuat_xu()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(xuat_xu) AS trimmed
    FROM fp_ts_tai_san
    WHERE xuat_xu IS NOT NULL AND trim(xuat_xu) <> ''
  ) s;
$$;

CREATE OR REPLACE FUNCTION public.rpc_fp_ts_distinct_ten_nha_cung_cap()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(ten_nha_cung_cap) AS trimmed
    FROM fp_ts_tai_san
    WHERE ten_nha_cung_cap IS NOT NULL AND trim(ten_nha_cung_cap) <> ''
  ) s;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_fp_ts_distinct_thuong_hieu() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_fp_ts_distinct_model() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_fp_ts_distinct_xuat_xu() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_fp_ts_distinct_ten_nha_cung_cap() TO anon, authenticated;
