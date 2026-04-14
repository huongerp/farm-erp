-- =============================================================================
-- RPC: rpc_don_dat_hang_stats
-- Thống kê đơn đặt hàng (server-side, giảm egress tab Thống kê).
-- Chạy trên Supabase SQL Editor. SECURITY INVOKER = RLS của bảng gốc.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_don_dat_hang_stats(
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_trang_thai text[] DEFAULT NULL,
  p_supplier_ids bigint[] DEFAULT NULL,
  p_buyer_ids bigint[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $fn$
WITH base AS (
  SELECT
    d.*,
    coalesce(d.ten_nha_cung_cap, ncc.ten_doi_tac, d.id_nha_cung_cap::text) AS supplier_label,
    coalesce(nv_dat.ho_va_ten, d.id_nguoi_dat::text) AS buyer_label
  FROM public.fp_mh_don_dat_hang d
  LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc
    ON ncc.id = d.id_nha_cung_cap AND ncc.loai_doi_tac = 'nha_cung_cap'
  LEFT JOIN public.fp_var_nhan_vien nv_dat ON nv_dat.id = d.id_nguoi_dat
  WHERE
    (p_date_from IS NULL OR d.ngay_dat::date >= p_date_from)
    AND (p_date_to IS NULL OR d.ngay_dat::date <= p_date_to)
    AND (p_trang_thai IS NULL OR cardinality(p_trang_thai) = 0 OR d.trang_thai = ANY (p_trang_thai))
    AND (p_supplier_ids IS NULL OR cardinality(p_supplier_ids) = 0 OR d.id_nha_cung_cap = ANY (p_supplier_ids))
    AND (p_buyer_ids IS NULL OR cardinality(p_buyer_ids) = 0 OR d.id_nguoi_dat = ANY (p_buyer_ids))
),
fullset AS (
  SELECT * FROM public.fp_mh_don_dat_hang
),
chip_status AS (
  SELECT d.trang_thai AS status, count(*)::int AS cnt FROM fullset d GROUP BY 1
),
chip_supplier AS (
  SELECT d.id_nha_cung_cap::text AS id, count(*)::int AS cnt
  FROM fullset d GROUP BY 1
),
chip_buyer AS (
  SELECT d.id_nguoi_dat::text AS id, count(*)::int AS cnt FROM fullset d GROUP BY 1
)
SELECT jsonb_build_object(
  'summary', (
    SELECT jsonb_build_object(
      'total', count(*)::int,
      'draft', coalesce(sum(CASE WHEN trang_thai = 'Nháp' THEN 1 ELSE 0 END), 0)::int,
      'inProgress', coalesce(sum(CASE WHEN trang_thai IN ('Chờ duyệt','Đã gửi','Đã xác nhận','Đang giao') THEN 1 ELSE 0 END), 0)::int,
      'completed', coalesce(sum(CASE WHEN trang_thai IN ('Đã nhận đủ','Đã đóng') THEN 1 ELSE 0 END), 0)::int,
      'cancelled', coalesce(sum(CASE WHEN trang_thai = 'Hủy' THEN 1 ELSE 0 END), 0)::int
    ) FROM base
  ),
  'byTrangThai', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', trang_thai, 'count', cnt))
    FROM (SELECT trang_thai, count(*)::int AS cnt FROM base GROUP BY 1) s
  ), '[]'::jsonb),
  'bySupplier', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT d.supplier_label AS name, count(*)::int AS cnt
      FROM base d GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byBuyer', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT d.buyer_label AS name, count(*)::int AS cnt
      FROM base d GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byMonth', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', label, 'value', cnt) ORDER BY ym)
    FROM (
      SELECT to_char(d.ngay_dat::date, 'YYYY-MM') AS ym,
             to_char(d.ngay_dat::date, 'MM') || '/' || to_char(d.ngay_dat::date, 'YYYY') AS label,
             count(*)::int AS cnt
      FROM base d
      WHERE d.ngay_dat IS NOT NULL
      GROUP BY 1, 2
    ) m
  ), '[]'::jsonb),
  'chipByTrangThai', coalesce((SELECT jsonb_object_agg(status, cnt) FROM chip_status), '{}'::jsonb),
  'chipBySupplierId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_supplier), '{}'::jsonb),
  'chipByBuyerId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_buyer), '{}'::jsonb)
);
$fn$;

COMMENT ON FUNCTION public.rpc_don_dat_hang_stats IS 'Thống kê đơn đặt hàng (JSON) cho tab Thống kê — app: don-dat-hang ThongKeTab';

GRANT EXECUTE ON FUNCTION public.rpc_don_dat_hang_stats(date, date, text[], bigint[], bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_don_dat_hang_stats(date, date, text[], bigint[], bigint[]) TO anon;
