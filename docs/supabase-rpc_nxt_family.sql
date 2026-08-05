-- =============================================================================
-- RPC gia đình báo cáo NXT — giảm egress (thay client fallback ~22k dòng)
-- Chạy trên Supabase SQL Editor. Mirror logic bao-cao-nxt-service.ts
--
-- CẬP NHẬT: rpc_nxt_by_period (cần `byCell` cho tab Tra cứu theo kỳ) đã chuyển sang
--   docs/supabase-v_mh_nxt_movement.sql  ← chạy file đó thay cho hàm bên dưới.
-- File này vẫn giữ rpc_phieu_in_period / rpc_ton_at_date.
-- =============================================================================

CREATE OR REPLACE FUNCTION public._nxt_norm_loai(p_loai text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(trim(coalesce(p_loai, '')))
    WHEN 'nhập' THEN 'nhap'
    WHEN 'nhap' THEN 'nhap'
    WHEN 'xuất' THEN 'xuat'
    WHEN 'xuat' THEN 'xuat'
    WHEN 'chuyển' THEN 'chuyen'
    WHEN 'chuyen' THEN 'chuyen'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_nxt_by_period(p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  v_date_from date := nullif(trim(p_filters->>'dateFrom'), '')::date;
  v_date_to date := nullif(trim(p_filters->>'dateTo'), '')::date;
  v_creator bigint := nullif(trim(p_filters->>'allowedCreatorUserId'), '')::bigint;
  v_scope_on boolean := (p_filters ? 'allowedBranchIds') OR v_creator IS NOT NULL;
  v_branch_ids bigint[];
  v_wh_ids bigint[];
  v_loai text[];
  v_hh_ids bigint[];
  v_cat_ids bigint[];
  v_result jsonb;
BEGIN
  IF v_date_from IS NULL OR v_date_to IS NULL THEN
    RETURN jsonb_build_object('byWarehouse', '[]'::jsonb, 'byProduct', '[]'::jsonb);
  END IF;

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_branch_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'allowedBranchIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_wh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'warehouseIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  SELECT coalesce(array_agg(public._nxt_norm_loai(x)), ARRAY[]::text[])
  INTO v_loai
  FROM jsonb_array_elements_text(coalesce(p_filters->'loaiPhieu', '[]'::jsonb)) AS t(x);

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_hh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'hangHoaIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_cat_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'categoryIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  WITH kho_branch AS (
    SELECT id AS kho_id, chi_nhanh_id FROM public.fp_mh_danh_sach_kho
  ),
  phieu_scoped AS (
    SELECT pk.*
    FROM public.fp_mh_phieu_kho pk
    WHERE trim(coalesce(pk.trang_thai, '')) <> 'Không duyệt'
      AND (
        NOT v_scope_on
        OR (
          (v_creator IS NOT NULL AND pk.nguoi_tao_id = v_creator)
          OR (
            cardinality(v_branch_ids) > 0
            AND (
              EXISTS (SELECT 1 FROM kho_branch kb WHERE kb.kho_id = pk.kho_id AND kb.chi_nhanh_id = ANY (v_branch_ids))
              OR EXISTS (SELECT 1 FROM kho_branch kb WHERE kb.kho_id = pk.kho_den_id AND kb.chi_nhanh_id = ANY (v_branch_ids))
            )
          )
        )
      )
  ),
  movements AS (
    SELECT
      pk.id AS phieu_id,
      pk.ngay::date AS ngay,
      public._nxt_norm_loai(pk.loai) AS loai_n,
      pk.kho_id,
      pk.kho_den_id,
      ct.id_hang_hoa,
      ct.so_luong::numeric AS qty,
      (pk.ngay::date >= v_date_from AND pk.ngay::date <= v_date_to) AS in_period,
      (pk.ngay::date > v_date_to) AS after_period
    FROM phieu_scoped pk
    JOIN public.fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = pk.id
    WHERE ct.so_luong > 0
      AND (pk.ngay::date > v_date_to OR (pk.ngay::date >= v_date_from AND pk.ngay::date <= v_date_to))
  ),
  mov_product_scoped AS (
    SELECT m.*
    FROM movements m
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = m.id_hang_hoa
    WHERE
      (cardinality(v_hh_ids) = 0 OR m.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids))
      )
  ),
  mov_filtered AS (
    SELECT m.*
    FROM mov_product_scoped m
    WHERE (cardinality(v_loai) = 0 OR m.loai_n = ANY (v_loai))
  ),
  period_kh AS (
    SELECT
      m.kho_id,
      m.id_hang_hoa,
      sum(CASE WHEN m.loai_n = 'nhap' THEN m.qty ELSE 0 END) AS nhap,
      sum(CASE WHEN m.loai_n = 'xuat' THEN m.qty ELSE 0 END) AS xuat
    FROM mov_filtered m
    WHERE m.in_period
      AND m.loai_n IN ('nhap', 'xuat')
      AND (cardinality(v_wh_ids) = 0 OR m.kho_id = ANY (v_wh_ids))
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  period_chuyen_from AS (
    SELECT m.kho_id, m.id_hang_hoa, sum(m.qty) AS xuat
    FROM mov_filtered m
    WHERE m.in_period AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
      AND (cardinality(v_wh_ids) = 0 OR m.kho_id = ANY (v_wh_ids))
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  period_chuyen_to AS (
    SELECT m.kho_den_id AS kho_id, m.id_hang_hoa, sum(m.qty) AS nhap
    FROM mov_filtered m
    WHERE m.in_period AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
      AND (cardinality(v_wh_ids) = 0 OR m.kho_den_id = ANY (v_wh_ids))
    GROUP BY m.kho_den_id, m.id_hang_hoa
  ),
  after_kh AS (
    SELECT m.kho_id, m.id_hang_hoa,
      sum(CASE WHEN m.loai_n = 'nhap' THEN m.qty ELSE 0 END) AS nhap,
      sum(CASE WHEN m.loai_n = 'xuat' THEN m.qty ELSE 0 END) AS xuat
    FROM mov_product_scoped m
    WHERE m.after_period AND m.loai_n IN ('nhap', 'xuat')
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  after_chuyen_from AS (
    SELECT m.kho_id, m.id_hang_hoa, sum(m.qty) AS xuat
    FROM mov_product_scoped m
    WHERE m.after_period AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  after_chuyen_to AS (
    SELECT m.kho_den_id AS kho_id, m.id_hang_hoa, sum(m.qty) AS nhap
    FROM mov_product_scoped m
    WHERE m.after_period AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
    GROUP BY m.kho_den_id, m.id_hang_hoa
  ),
  ton_scoped AS (
    SELECT t.kho_id, t.id_hang_hoa, t.so_luong::numeric AS so_luong
    FROM public.fp_mh_ton_kho t
    WHERE
      NOT v_scope_on
      OR cardinality(v_branch_ids) = 0
      OR EXISTS (
        SELECT 1 FROM kho_branch kb
        WHERE kb.kho_id = t.kho_id AND kb.chi_nhanh_id = ANY (v_branch_ids)
      )
  ),
  keys AS (
    SELECT DISTINCT kho_id, id_hang_hoa FROM period_kh
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM period_chuyen_from
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM period_chuyen_to
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM after_kh
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM after_chuyen_from
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM after_chuyen_to
    UNION
    SELECT DISTINCT t.kho_id, t.id_hang_hoa
    FROM ton_scoped t
    WHERE t.so_luong <> 0
      AND (cardinality(v_hh_ids) = 0 OR t.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR EXISTS (
          SELECT 1 FROM public.fp_mh_danh_sach_hang_hoa hh
          WHERE hh.id = t.id_hang_hoa
            AND hh.danh_muc_id IS NOT NULL
            AND hh.danh_muc_id = ANY (v_cat_ids)
        )
      )
  ),
  kh_detail AS (
    SELECT
      k.kho_id,
      k.id_hang_hoa,
      coalesce(t.so_luong, 0)
        - coalesce(af.nhap, 0) - coalesce(afc_to.nhap, 0)
        + coalesce(af.xuat, 0) + coalesce(afc_from.xuat, 0) AS ton_cuoi,
      coalesce(p.nhap, 0) + coalesce(pc_to.nhap, 0) AS period_nhap,
      coalesce(p.xuat, 0) + coalesce(pc_from.xuat, 0) AS period_xuat
    FROM keys k
    LEFT JOIN ton_scoped t ON t.kho_id = k.kho_id AND t.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN period_kh p ON p.kho_id = k.kho_id AND p.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN period_chuyen_from pc_from ON pc_from.kho_id = k.kho_id AND pc_from.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN period_chuyen_to pc_to ON pc_to.kho_id = k.kho_id AND pc_to.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN after_kh af ON af.kho_id = k.kho_id AND af.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN after_chuyen_from afc_from ON afc_from.kho_id = k.kho_id AND afc_from.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN after_chuyen_to afc_to ON afc_to.kho_id = k.kho_id AND afc_to.id_hang_hoa = k.id_hang_hoa
  ),
  by_wh AS (
    SELECT
      kd.kho_id::text AS id_kho,
      coalesce(k.ma_kho, kd.kho_id::text) AS ma_kho,
      coalesce(k.ten_kho, kd.kho_id::text) AS ten_kho,
      sum(kd.ton_cuoi - kd.period_nhap + kd.period_xuat) AS ton_dau_ky,
      sum(kd.period_nhap) AS tong_nhap,
      sum(kd.period_xuat) AS tong_xuat,
      sum(kd.ton_cuoi) AS ton_cuoi_ky
    FROM kh_detail kd
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = kd.id_hang_hoa
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = kd.kho_id
    WHERE (cardinality(v_wh_ids) = 0 OR kd.kho_id = ANY (v_wh_ids))
      AND (cardinality(v_hh_ids) = 0 OR kd.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids))
      )
    GROUP BY kd.kho_id, k.ma_kho, k.ten_kho
  ),
  by_prod AS (
    SELECT
      kd.id_hang_hoa::text AS id_hang_hoa,
      coalesce(hh.ma_hang_hoa, kd.id_hang_hoa::text) AS ma_hang,
      coalesce(hh.ten_hang_hoa, '—') AS ten_hang,
      coalesce(dm.ten_danh_muc, NULL) AS ten_danh_muc,
      coalesce(hh.dvt, '—') AS don_vi_tinh,
      sum(kd.ton_cuoi - kd.period_nhap + kd.period_xuat) AS ton_dau_ky,
      sum(kd.period_nhap) AS tong_nhap,
      sum(kd.period_xuat) AS tong_xuat,
      sum(kd.ton_cuoi) AS ton_cuoi_ky
    FROM kh_detail kd
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = kd.id_hang_hoa
    LEFT JOIN public.fp_mh_danh_muc_hang_hoa dm ON dm.id = hh.danh_muc_id
  WHERE
      (cardinality(v_wh_ids) = 0 OR kd.kho_id = ANY (v_wh_ids))
      AND (cardinality(v_hh_ids) = 0 OR kd.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids))
      )
    GROUP BY kd.id_hang_hoa, hh.ma_hang_hoa, hh.ten_hang_hoa, dm.ten_danh_muc, hh.dvt
  )
  SELECT jsonb_build_object(
    'byWarehouse', coalesce((SELECT jsonb_agg(to_jsonb(bw)) FROM by_wh bw), '[]'::jsonb),
    'byProduct', coalesce((SELECT jsonb_agg(to_jsonb(bp)) FROM by_prod bp), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$fn$;

-- Phiếu trong kỳ (header only, không chi tiết)
CREATE OR REPLACE FUNCTION public.rpc_phieu_in_period(p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  v_date_from date := nullif(trim(p_filters->>'dateFrom'), '')::date;
  v_date_to date := nullif(trim(p_filters->>'dateTo'), '')::date;
  v_creator bigint := nullif(trim(p_filters->>'allowedCreatorUserId'), '')::bigint;
  v_scope_on boolean := (p_filters ? 'allowedBranchIds') OR v_creator IS NOT NULL;
  v_branch_ids bigint[];
  v_wh_ids bigint[];
  v_loai text[];
  v_trang_thai text[];
  v_hh_ids bigint[];
  v_cat_ids bigint[];
BEGIN
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_branch_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'allowedBranchIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_wh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'warehouseIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg(public._nxt_norm_loai(x)), ARRAY[]::text[]) INTO v_loai
  FROM jsonb_array_elements_text(coalesce(p_filters->'loaiPhieu', '[]'::jsonb)) t(x);
  SELECT coalesce(array_agg(x), ARRAY[]::text[]) INTO v_trang_thai
  FROM jsonb_array_elements_text(coalesce(p_filters->'trangThaiPhieu', '[]'::jsonb)) t(x);
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_hh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'hangHoaIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_cat_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'categoryIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';

  RETURN coalesce((
    WITH kho_branch AS (SELECT id AS kho_id, chi_nhanh_id FROM public.fp_mh_danh_sach_kho),
    phieu_scoped AS (
      SELECT pk.* FROM public.fp_mh_phieu_kho pk
      WHERE trim(coalesce(pk.trang_thai, '')) <> 'Không duyệt'
        AND pk.ngay::date >= v_date_from AND pk.ngay::date <= v_date_to
        AND (
          NOT v_scope_on OR (v_creator IS NOT NULL AND pk.nguoi_tao_id = v_creator)
          OR (cardinality(v_branch_ids) > 0 AND (
            EXISTS (SELECT 1 FROM kho_branch kb WHERE kb.kho_id = pk.kho_id AND kb.chi_nhanh_id = ANY (v_branch_ids))
            OR EXISTS (SELECT 1 FROM kho_branch kb WHERE kb.kho_id = pk.kho_den_id AND kb.chi_nhanh_id = ANY (v_branch_ids))
          ))
        )
    ),
    filtered AS (
      SELECT pk.* FROM phieu_scoped pk
      WHERE (cardinality(v_loai) = 0 OR public._nxt_norm_loai(pk.loai) = ANY (v_loai))
        AND (
          cardinality(v_wh_ids) = 0
          OR pk.kho_id = ANY (v_wh_ids)
          OR (public._nxt_norm_loai(pk.loai) = 'chuyen' AND pk.kho_den_id = ANY (v_wh_ids))
        )
        AND (
          cardinality(v_trang_thai) = 0
          OR pk.trang_thai = ANY (v_trang_thai)
        )
        AND (
          cardinality(v_hh_ids) = 0 AND cardinality(v_cat_ids) = 0
          OR EXISTS (
            SELECT 1 FROM public.fp_mh_phieu_kho_chi_tiet ct
            LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa
            WHERE ct.id_phieu_kho = pk.id
              AND (cardinality(v_hh_ids) = 0 OR ct.id_hang_hoa = ANY (v_hh_ids))
              AND (cardinality(v_cat_ids) = 0 OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids)))
          )
        )
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id::text,
        'so_phieu', so_phieu,
        'ngay', ngay::text,
        'loai', loai,
        'kho_id', kho_id::text,
        'ten_kho', ten_kho,
        'kho_den_id', CASE WHEN kho_den_id IS NULL THEN NULL ELSE kho_den_id::text END,
        'ten_kho_den', ten_kho_den,
        'id_nha_cung_cap', CASE WHEN id_nha_cung_cap IS NULL THEN NULL ELSE id_nha_cung_cap::text END,
        'id_khach_hang', CASE WHEN id_khach_hang IS NULL THEN NULL ELSE id_khach_hang::text END,
        'trang_thai', trang_thai,
        'nguoi_tao_id', CASE WHEN nguoi_tao_id IS NULL THEN NULL ELSE nguoi_tao_id::text END,
        'ten_nguoi_tao', ten_nguoi_tao
      )
      ORDER BY ngay DESC, so_phieu DESC
    )
    FROM filtered
  ), '[]'::jsonb);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.rpc_ton_at_date(p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  v_scope_on boolean := (p_filters ? 'allowedBranchIds');
  v_branch_ids bigint[];
  v_wh_ids bigint[];
  v_hh_ids bigint[];
  v_cat_ids bigint[];
BEGIN
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_branch_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'allowedBranchIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_wh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'warehouseIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_hh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'hangHoaIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_cat_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'categoryIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';

  RETURN coalesce((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id_kho', t.kho_id::text,
        'ma_kho', coalesce(k.ma_kho, t.kho_id::text),
        'ten_kho', coalesce(k.ten_kho, t.kho_id::text),
        'id_hang_hoa', t.id_hang_hoa::text,
        'ma_hang', coalesce(hh.ma_hang_hoa, t.id_hang_hoa::text),
        'ten_hang', coalesce(hh.ten_hang_hoa, '—'),
        'ten_danh_muc', dm.ten_danh_muc,
        'don_vi_tinh', coalesce(hh.dvt, '—'),
        'so_luong', t.so_luong
      )
      ORDER BY k.ten_kho, hh.ma_hang_hoa
    )
    FROM public.fp_mh_ton_kho t
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = t.kho_id
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = t.id_hang_hoa
    LEFT JOIN public.fp_mh_danh_muc_hang_hoa dm ON dm.id = hh.danh_muc_id
    WHERE t.so_luong <> 0
      AND (cardinality(v_wh_ids) = 0 OR t.kho_id = ANY (v_wh_ids))
      AND (cardinality(v_hh_ids) = 0 OR t.id_hang_hoa = ANY (v_hh_ids))
      AND (cardinality(v_cat_ids) = 0 OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids)))
      AND (
        NOT v_scope_on OR cardinality(v_branch_ids) = 0
        OR EXISTS (
          SELECT 1 FROM public.fp_mh_danh_sach_kho kb
          WHERE kb.id = t.kho_id AND kb.chi_nhanh_id = ANY (v_branch_ids)
        )
      )
  ), '[]'::jsonb);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.rpc_nxt_by_period(jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_phieu_in_period(jsonb) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_ton_at_date(jsonb) TO authenticated, anon;
