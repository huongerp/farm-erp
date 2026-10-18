-- 045: Tab Thống kê Đơn đặt hàng lọc theo phạm vi xem (farm của người dùng).
-- Người không có quyền admin/all (và không phải cấp bậc 1) chỉ xem đơn có kho nhận thuộc farm mình
-- + đơn do chính mình đặt — giống tab Danh sách (applyDonDatHangScope ở frontend).
-- Thêm 3 tham số có DEFAULT → frontend cũ gọi 5 tham số có tên vẫn chạy.
--   p_gioi_han     = true  → chỉ tính đơn có id_kho_nhan ∈ p_kho_ids HOẶC id_nguoi_dat = p_nguoi_dat_id
--   p_gioi_han     = false → toàn bảng (như cũ)
-- Áp cho cả `base` lẫn `fullset` để số đếm trên chip lọc cũng chỉ tính trong phạm vi.
-- Chặn ở tầng app (RLS bảng vẫn USING (true)); bỏ GRANT cho anon.

DROP FUNCTION IF EXISTS public.rpc_don_dat_hang_stats(date, date, text[], bigint[], bigint[]);

CREATE FUNCTION public.rpc_don_dat_hang_stats(
  p_date_from date DEFAULT NULL::date,
  p_date_to date DEFAULT NULL::date,
  p_trang_thai text[] DEFAULT NULL::text[],
  p_supplier_ids bigint[] DEFAULT NULL::bigint[],
  p_buyer_ids bigint[] DEFAULT NULL::bigint[],
  p_gioi_han boolean DEFAULT false,
  p_kho_ids bigint[] DEFAULT NULL::bigint[],
  p_nguoi_dat_id bigint DEFAULT NULL::bigint
) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
WITH pham_vi AS (
  SELECT d.*
  FROM public.fp_mh_don_dat_hang d
  WHERE NOT coalesce(p_gioi_han, false)
     OR d.id_kho_nhan = ANY (coalesce(p_kho_ids, '{}'::bigint[]))
     OR (p_nguoi_dat_id IS NOT NULL AND d.id_nguoi_dat = p_nguoi_dat_id)
),
base AS (
  SELECT
    d.*,
    coalesce(d.ten_nha_cung_cap, ncc.ten_doi_tac, d.id_nha_cung_cap::text) AS supplier_label,
    coalesce(nv_dat.ho_va_ten, d.id_nguoi_dat::text) AS buyer_label
  FROM pham_vi d
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
  SELECT * FROM pham_vi
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
$$;

COMMENT ON FUNCTION public.rpc_don_dat_hang_stats(date, date, text[], bigint[], bigint[], boolean, bigint[], bigint) IS
  'Thống kê đơn đặt hàng (JSON) cho tab Thống kê — app: don-dat-hang ThongKeTab. p_gioi_han → chỉ đơn thuộc kho p_kho_ids hoặc do p_nguoi_dat_id đặt';

REVOKE ALL ON FUNCTION public.rpc_don_dat_hang_stats(date, date, text[], bigint[], bigint[], boolean, bigint[], bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_don_dat_hang_stats(date, date, text[], bigint[], bigint[], boolean, bigint[], bigint) TO authenticated;

NOTIFY pgrst, 'reload schema';
