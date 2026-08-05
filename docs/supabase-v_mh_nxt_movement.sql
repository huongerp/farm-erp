-- =============================================================================
-- View + RPC tăng tốc tab "Tra cứu theo kỳ" (Tồn kho) / Báo cáo NXT theo kỳ
--
-- Vấn đề: app gọi rpc_nxt_by_period; nếu RPC chưa có hoặc thiếu `byCell` thì
-- fallback client tải toàn bộ phiếu + chi tiết (~chậm / egress lớn).
--
-- Chạy trên Supabase SQL Editor (hoặc psql / PostgREST DB). Idempotent.
-- Phụ thuộc: fp_mh_phieu_kho, fp_mh_phieu_kho_chi_tiet, fp_mh_danh_sach_kho,
--            fp_mh_danh_sach_hang_hoa, fp_mh_danh_muc_hang_hoa, view fp_mh_ton_kho
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) Helper chuẩn hoá loại phiếu
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 1) Index hỗ trợ lọc theo ngày / trạng thái / hàng (an toàn nếu đã có)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_ngay
  ON public.fp_mh_phieu_kho (ngay);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_ngay_tinh_ton
  ON public.fp_mh_phieu_kho (ngay)
  WHERE trim(coalesce(trang_thai, '')) <> 'Không duyệt';

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_kho_id
  ON public.fp_mh_phieu_kho (kho_id);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_kho_den_id
  ON public.fp_mh_phieu_kho (kho_den_id)
  WHERE kho_den_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_chi_tiet_id_phieu
  ON public.fp_mh_phieu_kho_chi_tiet (id_phieu_kho);

CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_chi_tiet_hang_qty
  ON public.fp_mh_phieu_kho_chi_tiet (id_hang_hoa)
  WHERE so_luong > 0;

-- ---------------------------------------------------------------------------
-- 2) View phẳng: mỗi dòng = 1 chi tiết phiếu tính tồn
--    (loại bỏ "Không duyệt", qty > 0, có loai chuẩn + chi nhánh kho)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_mh_nxt_movement CASCADE;

CREATE VIEW public.v_mh_nxt_movement
WITH (security_invoker = true)
AS
SELECT
  pk.id AS phieu_id,
  pk.ngay::date AS ngay,
  public._nxt_norm_loai(pk.loai) AS loai_n,
  pk.kho_id,
  pk.kho_den_id,
  pk.nguoi_tao_id,
  ct.id AS chi_tiet_id,
  ct.id_hang_hoa,
  ct.so_luong::numeric AS qty,
  hh.danh_muc_id,
  kb_from.chi_nhanh_id AS chi_nhanh_kho_id,
  kb_to.chi_nhanh_id AS chi_nhanh_kho_den_id
FROM public.fp_mh_phieu_kho pk
JOIN public.fp_mh_phieu_kho_chi_tiet ct
  ON ct.id_phieu_kho = pk.id
LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh
  ON hh.id = ct.id_hang_hoa
LEFT JOIN public.fp_mh_danh_sach_kho kb_from
  ON kb_from.id = pk.kho_id
LEFT JOIN public.fp_mh_danh_sach_kho kb_to
  ON kb_to.id = pk.kho_den_id
WHERE trim(coalesce(pk.trang_thai, '')) <> 'Không duyệt'
  AND ct.so_luong > 0
  AND public._nxt_norm_loai(pk.loai) IS NOT NULL;

COMMENT ON VIEW public.v_mh_nxt_movement IS
  'Phẳng phiếu×chi tiết dùng tính NXT theo kỳ (bỏ Không duyệt). RPC rpc_nxt_by_period đọc view này.';

GRANT SELECT ON public.v_mh_nxt_movement TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 3) RPC rpc_nxt_by_period — dùng view, trả byWarehouse + byProduct + byCell
--    byCell bắt buộc: tab Tra cứu theo kỳ (Tồn kho) pivot cột theo kho.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_nxt_by_period(p_filters jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $fn$
DECLARE
  v_date_from date := nullif(trim(p_filters->>'dateFrom'), '')::date;
  v_date_to   date := nullif(trim(p_filters->>'dateTo'), '')::date;
  v_creator   bigint := nullif(trim(p_filters->>'allowedCreatorUserId'), '')::bigint;
  v_scope_on  boolean := (p_filters ? 'allowedBranchIds') OR v_creator IS NOT NULL;
  v_branch_ids bigint[];
  v_wh_ids     bigint[];
  v_loai       text[];
  v_hh_ids     bigint[];
  v_cat_ids    bigint[];
  v_narrow     boolean;
  v_result     jsonb;
BEGIN
  IF v_date_from IS NULL OR v_date_to IS NULL THEN
    RETURN jsonb_build_object(
      'byWarehouse', '[]'::jsonb,
      'byProduct', '[]'::jsonb,
      'byCell', '[]'::jsonb
    );
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

  v_narrow :=
    cardinality(v_wh_ids) > 0
    OR cardinality(v_hh_ids) > 0
    OR cardinality(v_cat_ids) > 0
    OR cardinality(v_loai) > 0;

  WITH mov_scoped AS (
    SELECT m.*
    FROM public.v_mh_nxt_movement m
    WHERE m.ngay > v_date_to OR (m.ngay >= v_date_from AND m.ngay <= v_date_to)
      AND (
        NOT v_scope_on
        OR (
          (v_creator IS NOT NULL AND m.nguoi_tao_id = v_creator)
          OR (
            cardinality(v_branch_ids) > 0
            AND (
              m.chi_nhanh_kho_id = ANY (v_branch_ids)
              OR m.chi_nhanh_kho_den_id = ANY (v_branch_ids)
            )
          )
        )
      )
  ),
  mov_product AS (
    SELECT m.*
    FROM mov_scoped m
    WHERE (cardinality(v_hh_ids) = 0 OR m.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (m.danh_muc_id IS NOT NULL AND m.danh_muc_id = ANY (v_cat_ids))
      )
  ),
  /* Trong kỳ: áp thêm lọc loại phiếu */
  mov_period AS (
    SELECT m.*
    FROM mov_product m
    WHERE m.ngay >= v_date_from AND m.ngay <= v_date_to
      AND (cardinality(v_loai) = 0 OR m.loai_n = ANY (v_loai))
  ),
  period_kh AS (
    SELECT m.kho_id, m.id_hang_hoa,
      sum(CASE WHEN m.loai_n = 'nhap' THEN m.qty ELSE 0 END) AS nhap,
      sum(CASE WHEN m.loai_n = 'xuat' THEN m.qty ELSE 0 END) AS xuat
    FROM mov_period m
    WHERE m.loai_n IN ('nhap', 'xuat')
      AND (cardinality(v_wh_ids) = 0 OR m.kho_id = ANY (v_wh_ids))
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  period_chuyen_from AS (
    SELECT m.kho_id, m.id_hang_hoa, sum(m.qty) AS xuat
    FROM mov_period m
    WHERE m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
      AND (cardinality(v_wh_ids) = 0 OR m.kho_id = ANY (v_wh_ids))
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  period_chuyen_to AS (
    SELECT m.kho_den_id AS kho_id, m.id_hang_hoa, sum(m.qty) AS nhap
    FROM mov_period m
    WHERE m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
      AND (cardinality(v_wh_ids) = 0 OR m.kho_den_id = ANY (v_wh_ids))
    GROUP BY m.kho_den_id, m.id_hang_hoa
  ),
  /* Sau kỳ: không lọc loại phiếu (mirror client fallback) */
  after_kh AS (
    SELECT m.kho_id, m.id_hang_hoa,
      sum(CASE WHEN m.loai_n = 'nhap' THEN m.qty ELSE 0 END) AS nhap,
      sum(CASE WHEN m.loai_n = 'xuat' THEN m.qty ELSE 0 END) AS xuat
    FROM mov_product m
    WHERE m.ngay > v_date_to AND m.loai_n IN ('nhap', 'xuat')
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  after_chuyen_from AS (
    SELECT m.kho_id, m.id_hang_hoa, sum(m.qty) AS xuat
    FROM mov_product m
    WHERE m.ngay > v_date_to AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  after_chuyen_to AS (
    SELECT m.kho_den_id AS kho_id, m.id_hang_hoa, sum(m.qty) AS nhap
    FROM mov_product m
    WHERE m.ngay > v_date_to AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
    GROUP BY m.kho_den_id, m.id_hang_hoa
  ),
  ton_scoped AS (
    SELECT t.kho_id, t.id_hang_hoa, t.so_luong::numeric AS so_luong
    FROM public.fp_mh_ton_kho t
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = t.kho_id
    WHERE
      NOT v_scope_on
      OR cardinality(v_branch_ids) = 0
      OR (k.chi_nhanh_id IS NOT NULL AND k.chi_nhanh_id = ANY (v_branch_ids))
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
    WHERE (cardinality(v_hh_ids) = 0 OR t.id_hang_hoa = ANY (v_hh_ids))
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
  cells AS (
    SELECT
      kd.kho_id,
      kd.id_hang_hoa,
      (kd.ton_cuoi - kd.period_nhap + kd.period_xuat) AS ton_dau_ky,
      kd.period_nhap AS tong_nhap,
      kd.period_xuat AS tong_xuat,
      kd.ton_cuoi AS ton_cuoi_ky
    FROM kh_detail kd
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = kd.id_hang_hoa
    WHERE (cardinality(v_wh_ids) = 0 OR kd.kho_id = ANY (v_wh_ids))
      AND (cardinality(v_hh_ids) = 0 OR kd.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids))
      )
      AND (
        NOT v_narrow
        OR (kd.ton_cuoi - kd.period_nhap + kd.period_xuat) <> 0
        OR kd.ton_cuoi <> 0
        OR kd.period_nhap <> 0
        OR kd.period_xuat <> 0
      )
  ),
  by_cell AS (
    SELECT
      c.kho_id::text AS id_kho,
      c.id_hang_hoa::text AS id_hang_hoa,
      c.ton_dau_ky,
      c.tong_nhap,
      c.tong_xuat,
      c.ton_cuoi_ky
    FROM cells c
  ),
  by_wh AS (
    SELECT
      c.kho_id::text AS id_kho,
      coalesce(k.ma_kho, c.kho_id::text) AS ma_kho,
      coalesce(k.ten_kho, c.kho_id::text) AS ten_kho,
      sum(c.ton_dau_ky) AS ton_dau_ky,
      sum(c.tong_nhap) AS tong_nhap,
      sum(c.tong_xuat) AS tong_xuat,
      sum(c.ton_cuoi_ky) AS ton_cuoi_ky
    FROM cells c
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = c.kho_id
    GROUP BY c.kho_id, k.ma_kho, k.ten_kho
  ),
  by_prod AS (
    SELECT
      c.id_hang_hoa::text AS id_hang_hoa,
      coalesce(hh.ma_hang_hoa, c.id_hang_hoa::text) AS ma_hang,
      coalesce(hh.ten_hang_hoa, '—') AS ten_hang,
      dm.ten_danh_muc,
      coalesce(hh.dvt, '—') AS don_vi_tinh,
      sum(c.ton_dau_ky) AS ton_dau_ky,
      sum(c.tong_nhap) AS tong_nhap,
      sum(c.tong_xuat) AS tong_xuat,
      sum(c.ton_cuoi_ky) AS ton_cuoi_ky
    FROM cells c
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = c.id_hang_hoa
    LEFT JOIN public.fp_mh_danh_muc_hang_hoa dm ON dm.id = hh.danh_muc_id
    GROUP BY c.id_hang_hoa, hh.ma_hang_hoa, hh.ten_hang_hoa, dm.ten_danh_muc, hh.dvt
  )
  SELECT jsonb_build_object(
    'byWarehouse', coalesce((SELECT jsonb_agg(to_jsonb(bw)) FROM by_wh bw), '[]'::jsonb),
    'byProduct', coalesce((SELECT jsonb_agg(to_jsonb(bp)) FROM by_prod bp), '[]'::jsonb),
    'byCell', coalesce((SELECT jsonb_agg(to_jsonb(bc)) FROM by_cell bc), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$fn$;

COMMENT ON FUNCTION public.rpc_nxt_by_period(jsonb) IS
  'NXT theo kỳ (JSON: byWarehouse, byProduct, byCell). Dùng view v_mh_nxt_movement. Tab Tra cứu theo kỳ cần byCell.';

GRANT EXECUTE ON FUNCTION public.rpc_nxt_by_period(jsonb) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- 4) Smoke test (tuỳ chọn — bỏ comment để chạy)
-- ---------------------------------------------------------------------------
-- SELECT public.rpc_nxt_by_period(jsonb_build_object(
--   'dateFrom', to_char(date_trunc('month', current_date), 'YYYY-MM-DD'),
--   'dateTo', to_char(current_date, 'YYYY-MM-DD'),
--   'warehouseIds', '[]'::jsonb,
--   'loaiPhieu', '[]'::jsonb,
--   'hangHoaIds', '[]'::jsonb,
--   'categoryIds', '[]'::jsonb
-- )) -> 'byCell';
