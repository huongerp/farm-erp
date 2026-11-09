-- =============================================================================
-- 073-nxt-gia-tri-xuat-luan-chuyen.sql — RPC báo cáo GIÁ TRỊ (tiền) xuất/chuyển
--
-- Module `features/kho-van/bao-cao-nhap-xuat-ton`: dòng phiếu kho loại 'xuất'/'chuyển'
-- trong kỳ hầu như luôn có don_gia = 0, nên giá trị phải SUY theo thứ tự ưu tiên:
--   1) Đơn giá ngay trên dòng phiếu (ct.don_gia > 0)                → nguồn 'phieu'
--   2) Đơn giá phiếu NHẬP gần nhất trước/đúng ngày phiếu (≤ pk.ngay) → 'nhap'
--   3) Đơn giá đơn đặt hàng mới nhất                               → 'ddh'
--   4) Đơn giá danh mục hàng hoá (fp_mh_danh_sach_hang_hoa.don_gia) → 'danh_muc'
--   5) Không có → gia = NULL, tien = 0, tính vào «chưa có giá».
--
-- An toàn: security INVOKER (tự hưởng RLS), STABLE, search_path 'public'.
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/073-nxt-gia-tri-xuat-luan-chuyen.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_nxt_gia_tri(p_filters jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $func$
DECLARE
  v_date_from  date := nullif(trim(p_filters->>'dateFrom'), '')::date;
  v_date_to    date := nullif(trim(p_filters->>'dateTo'), '')::date;
  v_creator    bigint := nullif(trim(p_filters->>'allowedCreatorUserId'), '')::bigint;
  v_scope_on   boolean := (p_filters ? 'allowedBranchIds') OR v_creator IS NOT NULL;
  v_branch_ids bigint[];
  v_wh_ids     bigint[];
  v_hh_ids     bigint[];
  v_cat_ids    bigint[];
  v_result     jsonb;
BEGIN
  -- Thiếu 1 trong 2 mốc ngày → trả ngay JSON rỗng (các mảng []) + tong = 0.
  IF v_date_from IS NULL OR v_date_to IS NULL THEN
    RETURN jsonb_build_object(
      'tong', jsonb_build_object(
        'tien_xuat', 0,
        'tien_chuyen', 0,
        'so_dong_chua_gia', 0
      ),
      'theoPhamCap', '[]'::jsonb,
      'theoKho', '[]'::jsonb,
      'luanChuyen', '[]'::jsonb,
      'chuaCoGia', '[]'::jsonb
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

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_hh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'hangHoaIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_cat_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'categoryIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  WITH
  -- 1) Dòng phiếu xuất/chuyển trong kỳ, đã áp phạm vi xem (chi nhánh / người tạo).
  --    Đọc bảng trực tiếp, không qua view. CHÚ Ý ngoặc phạm vi: (A OR (B OR (C AND (...))))
  --    để không rơi vào bẫy `NOT v_scope_on OR B OR C AND (...)` (AND dính chặt hơn OR).
  mov_scoped AS (
    SELECT
      pk.id            AS phieu_id,
      pk.ngay,
      pk.loai,
      pk.kho_id,
      pk.kho_den_id,
      pk.nguoi_tao_id,
      ct.id            AS chi_tiet_id,
      ct.id_hang_hoa,
      ct.so_luong,
      ct.don_gia,
      ct.pham_cap,
      hh.danh_muc_id
    FROM public.fp_mh_phieu_kho pk
    JOIN public.fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = pk.id
    LEFT JOIN public.fp_mh_danh_sach_kho kb_from ON kb_from.id = pk.kho_id
    LEFT JOIN public.fp_mh_danh_sach_kho kb_to ON kb_to.id = pk.kho_den_id
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa
    WHERE pk.ngay BETWEEN v_date_from AND v_date_to
      AND trim(coalesce(pk.trang_thai, '')) <> 'Không duyệt'
      AND ct.so_luong > 0
      AND public._nxt_norm_loai(pk.loai) IN ('xuat', 'chuyen')
      AND (public._nxt_norm_loai(pk.loai) = 'xuat' OR pk.kho_den_id IS NOT NULL)
      AND (
        NOT v_scope_on
        OR (v_creator IS NOT NULL AND pk.nguoi_tao_id = v_creator)
        OR (
          cardinality(v_branch_ids) > 0
          AND (
            (kb_from.chi_nhanh_id IS NOT NULL AND kb_from.chi_nhanh_id = ANY (v_branch_ids))
            OR (kb_to.chi_nhanh_id IS NOT NULL AND kb_to.chi_nhanh_id = ANY (v_branch_ids))
          )
        )
      )
      AND (cardinality(v_hh_ids) = 0 OR ct.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids))
      )
  ),
  -- 2) Ứng viên giá (chỉ giữ dòng có don_gia > 0 → tập nhỏ, LATERAL nhìn nhanh).
  nhap_cand AS (
    SELECT ct2.id_hang_hoa, ct2.don_gia, pk2.ngay, ct2.id AS ct_id
    FROM public.fp_mh_phieu_kho_chi_tiet ct2
    JOIN public.fp_mh_phieu_kho pk2 ON pk2.id = ct2.id_phieu_kho
    WHERE ct2.don_gia > 0
      AND trim(coalesce(pk2.trang_thai, '')) <> 'Không duyệt'
      AND public._nxt_norm_loai(pk2.loai) = 'nhap'
  ),
  ddh_cand AS (
    SELECT id_hang_hoa, don_gia, ngay_dat, id
    FROM public.fp_mh_don_dat_hang_chi_tiet
    WHERE don_gia > 0
  ),
  dm_cand AS (
    SELECT id, don_gia
    FROM public.fp_mh_danh_sach_hang_hoa
    WHERE don_gia > 0
  ),
  -- 3) Gắn giá từng dòng theo thứ tự ưu tiên (phieu → nhap → ddh → danh_muc → NULL).
  priced AS (
    SELECT
      g.*,
      CASE WHEN g.gia IS NOT NULL THEN round(g.so_luong * g.gia, 0) ELSE 0 END AS tien,
      (g.gia IS NOT NULL) AS co_gia
    FROM (
      SELECT
        m.phieu_id,
        m.ngay,
        public._nxt_norm_loai(m.loai) AS loai_n,
        m.kho_id,
        m.kho_den_id,
        m.nguoi_tao_id,
        m.chi_tiet_id,
        m.id_hang_hoa,
        m.so_luong,
        m.don_gia,
        m.pham_cap,
        m.danh_muc_id,
        CASE
          WHEN m.don_gia > 0 THEN m.don_gia
          WHEN gia_nhap.gia IS NOT NULL THEN gia_nhap.gia
          WHEN gia_ddh.gia IS NOT NULL THEN gia_ddh.gia
          WHEN dm.don_gia IS NOT NULL THEN dm.don_gia
          ELSE NULL
        END AS gia
      FROM mov_scoped m
      LEFT JOIN LATERAL (
        SELECT n.don_gia AS gia
        FROM nhap_cand n
        WHERE n.id_hang_hoa = m.id_hang_hoa
          AND n.ngay <= m.ngay
        ORDER BY n.ngay DESC, n.ct_id DESC
        LIMIT 1
      ) gia_nhap ON true
      LEFT JOIN LATERAL (
        SELECT d.don_gia AS gia
        FROM ddh_cand d
        WHERE d.id_hang_hoa = m.id_hang_hoa
        ORDER BY d.ngay_dat DESC NULLS LAST, d.id DESC
        LIMIT 1
      ) gia_ddh ON true
      LEFT JOIN dm_cand dm ON dm.id = m.id_hang_hoa
    ) g
  ),
  -- 4) rows_scoped = priced + lọc kho (kho đi HOẶC kho đến — chuyển từ kho ngoài
  --    filter về kho trong filter vẫn được tính).
  rows_scoped AS (
    SELECT p.*
    FROM priced p
    WHERE (cardinality(v_wh_ids) = 0 OR p.kho_id = ANY (v_wh_ids) OR p.kho_den_id = ANY (v_wh_ids))
  ),
  -- Gom các nhóm báo cáo từ rows_scoped.
  theo_pc AS (
    SELECT
      nullif(trim(coalesce(p.pham_cap, '')), '') AS pham_cap,
      coalesce(sum(p.tien) FILTER (WHERE p.loai_n = 'xuat'), 0) AS tien_xuat,
      coalesce(sum(p.tien) FILTER (WHERE p.loai_n = 'chuyen'), 0) AS tien_chuyen,
      count(*) AS so_dong
    FROM rows_scoped p
    GROUP BY nullif(trim(coalesce(p.pham_cap, '')), '')
  ),
  kho_keys AS (
    SELECT u.id_kho
    FROM (
      SELECT p.kho_id AS id_kho FROM rows_scoped p
      UNION
      SELECT p.kho_den_id AS id_kho FROM rows_scoped p WHERE p.loai_n = 'chuyen'
    ) u
    -- Có lọc kho → bảng theo kho chỉ hiện kho được chọn (kho đối ứng vẫn thấy ở luanChuyen).
    WHERE cardinality(v_wh_ids) = 0 OR u.id_kho = ANY (v_wh_ids)
  ),
  theo_kho AS (
    SELECT
      kk.id_kho,
      coalesce(k.ten_kho, kk.id_kho::text) AS ten_kho,
      coalesce(cn.ten_chi_nhanh, '—') AS ten_chi_nhanh,
      coalesce(x.tien, 0) AS tien_xuat,
      coalesce(cd.tien, 0) AS tien_chuyen_di,
      coalesce(cnv.tien, 0) AS tien_nhan_ve
    FROM kho_keys kk
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = kk.id_kho
    LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = k.chi_nhanh_id
    LEFT JOIN (
      SELECT p.kho_id, sum(p.tien) AS tien
      FROM rows_scoped p
      WHERE p.loai_n = 'xuat'
      GROUP BY p.kho_id
    ) x ON x.kho_id = kk.id_kho
    LEFT JOIN (
      SELECT p.kho_id, sum(p.tien) AS tien
      FROM rows_scoped p
      WHERE p.loai_n = 'chuyen'
      GROUP BY p.kho_id
    ) cd ON cd.kho_id = kk.id_kho
    LEFT JOIN (
      SELECT p.kho_den_id, sum(p.tien) AS tien
      FROM rows_scoped p
      WHERE p.loai_n = 'chuyen'
      GROUP BY p.kho_den_id
    ) cnv ON cnv.kho_den_id = kk.id_kho
  ),
  luan_chuyen AS (
    SELECT
      p.kho_id AS id_kho_di,
      p.kho_den_id AS id_kho_den,
      sum(p.tien) AS tien,
      count(*) AS so_dong
    FROM rows_scoped p
    WHERE p.loai_n = 'chuyen'
    GROUP BY p.kho_id, p.kho_den_id
    ORDER BY tien DESC
  ),
  chua_co_gia AS (
    SELECT
      p.id_hang_hoa,
      coalesce(hh.ma_hang_hoa, '—') AS ma_hang,
      coalesce(hh.ten_hang_hoa, '—') AS ten_hang,
      count(*) AS so_dong,
      sum(p.so_luong) AS so_luong
    FROM rows_scoped p
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = p.id_hang_hoa
    WHERE p.gia IS NULL
    GROUP BY p.id_hang_hoa, hh.ma_hang_hoa, hh.ten_hang_hoa
    ORDER BY so_dong DESC
    LIMIT 100
  )
  SELECT jsonb_build_object(
    'tong', coalesce((
      SELECT jsonb_build_object(
        'tien_xuat', coalesce(sum(p.tien) FILTER (WHERE p.loai_n = 'xuat'), 0),
        'tien_chuyen', coalesce(sum(p.tien) FILTER (WHERE p.loai_n = 'chuyen'), 0),
        'so_dong_chua_gia', coalesce(count(*) FILTER (WHERE p.gia IS NULL), 0)
      )
      FROM rows_scoped p
    ), jsonb_build_object('tien_xuat', 0, 'tien_chuyen', 0, 'so_dong_chua_gia', 0)),
    'theoPhamCap', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'pham_cap', t.pham_cap,
        'tien_xuat', t.tien_xuat,
        'tien_chuyen', t.tien_chuyen,
        'so_dong', t.so_dong
      ) ORDER BY (t.tien_xuat + t.tien_chuyen) DESC)
      FROM theo_pc t
    ), '[]'::jsonb),
    'theoKho', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id_kho', t.id_kho::text,
        'ten_kho', t.ten_kho,
        'ten_chi_nhanh', t.ten_chi_nhanh,
        'tien_xuat', t.tien_xuat,
        'tien_chuyen_di', t.tien_chuyen_di,
        'tien_nhan_ve', t.tien_nhan_ve
      ) ORDER BY t.id_kho)
      FROM theo_kho t
    ), '[]'::jsonb),
    'luanChuyen', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id_kho_di', lc.id_kho_di::text,
        'ten_kho_di', coalesce(kd.ten_kho, lc.id_kho_di::text),
        'id_kho_den', lc.id_kho_den::text,
        'ten_kho_den', coalesce(kn.ten_kho, lc.id_kho_den::text),
        'tien', lc.tien,
        'so_dong', lc.so_dong
      ) ORDER BY lc.tien DESC)
      FROM luan_chuyen lc
      LEFT JOIN public.fp_mh_danh_sach_kho kd ON kd.id = lc.id_kho_di
      LEFT JOIN public.fp_mh_danh_sach_kho kn ON kn.id = lc.id_kho_den
    ), '[]'::jsonb),
    'chuaCoGia', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id_hang_hoa', c.id_hang_hoa::text,
        'ma_hang', c.ma_hang,
        'ten_hang', c.ten_hang,
        'so_dong', c.so_dong,
        'so_luong', c.so_luong
      ) ORDER BY c.so_dong DESC)
      FROM chua_co_gia c
    ), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$func$;

REVOKE ALL ON FUNCTION public.rpc_nxt_gia_tri(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_nxt_gia_tri(jsonb) TO authenticated;

COMMENT ON FUNCTION public.rpc_nxt_gia_tri(jsonb) IS
  'Báo cáo giá trị (tiền) các dòng phiếu kho xuất/chuyển trong kỳ, suy giá theo thứ tự ưu tiên: đơn giá phiếu → nhập gần nhất → đơn đặt hàng → danh mục hàng hoá; dòng không suy được giá đưa vào mảng chuaCoGia.';

COMMIT;

NOTIFY pgrst, 'reload schema';
