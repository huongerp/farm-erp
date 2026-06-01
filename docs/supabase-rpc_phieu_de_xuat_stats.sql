-- =============================================================================
-- RPC: rpc_phieu_de_xuat_stats — tab Thống kê phiếu đề xuất (giảm egress)
-- Chạy trên Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_phieu_de_xuat_stats(
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_trang_thai text[] DEFAULT NULL,
  p_id_noi_de_xuat bigint[] DEFAULT NULL,
  p_id_nguoi_de_xuat bigint[] DEFAULT NULL,
  p_id_nguoi_duyet bigint[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $fn$
WITH base AS (
  SELECT p.*
  FROM public.fp_mh_phieu_de_xuat_vat_tu p
  WHERE
    (p_date_from IS NULL OR p.ngay::date >= p_date_from)
    AND (p_date_to IS NULL OR p.ngay::date <= p_date_to)
    AND (p_trang_thai IS NULL OR cardinality(p_trang_thai) = 0 OR p.trang_thai = ANY (p_trang_thai))
    AND (p_id_noi_de_xuat IS NULL OR cardinality(p_id_noi_de_xuat) = 0 OR p.id_noi_de_xuat = ANY (p_id_noi_de_xuat))
    AND (p_id_nguoi_de_xuat IS NULL OR cardinality(p_id_nguoi_de_xuat) = 0 OR p.id_nguoi_de_xuat = ANY (p_id_nguoi_de_xuat))
    AND (
      p_id_nguoi_duyet IS NULL OR cardinality(p_id_nguoi_duyet) = 0
      OR (p.id_nguoi_duyet IS NOT NULL AND p.id_nguoi_duyet = ANY (p_id_nguoi_duyet))
    )
),
fullset AS (
  SELECT * FROM public.fp_mh_phieu_de_xuat_vat_tu
),
chip_status AS (
  SELECT
    CASE p.trang_thai
      WHEN 'Chờ duyệt' THEN 'Pending'
      WHEN 'Đã duyệt' THEN 'Approved'
      WHEN 'Không duyệt' THEN 'Rejected'
      ELSE 'Pending'
    END AS status_key,
    count(*)::int AS cnt
  FROM fullset p
  GROUP BY 1
),
chip_noi AS (
  SELECT p.id_noi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_de_xuat AS (
  SELECT p.id_nguoi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_duyet AS (
  SELECT p.id_nguoi_duyet::text AS id, count(*)::int AS cnt
  FROM fullset p
  WHERE p.id_nguoi_duyet IS NOT NULL
  GROUP BY 1
)
SELECT jsonb_build_object(
  'summary', (
    SELECT jsonb_build_object(
      'total', count(*)::int,
      'pending', coalesce(sum(CASE WHEN trang_thai = 'Chờ duyệt' THEN 1 ELSE 0 END), 0)::int,
      'approved', coalesce(sum(CASE WHEN trang_thai = 'Đã duyệt' THEN 1 ELSE 0 END), 0)::int,
      'rejected', coalesce(sum(CASE WHEN trang_thai = 'Không duyệt' THEN 1 ELSE 0 END), 0)::int
    ) FROM base
  ),
  'byTrangThai', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', status_key, 'count', cnt))
    FROM (
      SELECT
        CASE trang_thai
          WHEN 'Chờ duyệt' THEN 'Pending'
          WHEN 'Đã duyệt' THEN 'Approved'
          WHEN 'Không duyệt' THEN 'Rejected'
          ELSE 'Pending'
        END AS status_key,
        count(*)::int AS cnt
      FROM base
      GROUP BY 1
    ) s
  ), '[]'::jsonb),
  'byNoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(k.ten_kho, b.id_noi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = b.id_noi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDuyet', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_duyet::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_duyet
      WHERE b.id_nguoi_duyet IS NOT NULL
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byMonth', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', label, 'value', cnt) ORDER BY ym)
    FROM (
      SELECT to_char(b.ngay::date, 'YYYY-MM') AS ym,
             to_char(b.ngay::date, 'MM') || '/' || to_char(b.ngay::date, 'YYYY') AS label,
             count(*)::int AS cnt
      FROM base b
      WHERE b.ngay IS NOT NULL
      GROUP BY 1, 2
    ) m
  ), '[]'::jsonb),
  'chipByStatusKey', coalesce((SELECT jsonb_object_agg(status_key, cnt) FROM chip_status), '{}'::jsonb),
  'chipByNoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_noi), '{}'::jsonb),
  'chipByNguoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_de_xuat), '{}'::jsonb),
  'chipByNguoiDuyetId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_duyet), '{}'::jsonb)
);
$fn$;

COMMENT ON FUNCTION public.rpc_phieu_de_xuat_stats IS 'Thống kê phiếu đề xuất vật tư — tab Thống kê';

GRANT EXECUTE ON FUNCTION public.rpc_phieu_de_xuat_stats(date, date, text[], bigint[], bigint[], bigint[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_phieu_de_xuat_stats(date, date, text[], bigint[], bigint[], bigint[]) TO anon;
