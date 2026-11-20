-- =============================================================================
-- 088-phieu-kho-gia-tri-theo-pham-cap.sql — Tab «Theo phẩm cấp» (Sơ chế + Phân thuốc).
--
-- Vì sao: hạng mục trên dòng phiếu gần như không ai nhập (1.205/1.206 dòng «Chưa phân hạng mục»).
-- Tổng hợp theo PHẨM CẤP CỐ ĐỊNH của danh mục hàng hoá (fp_farm_/fp_pt_danh_sach_hang_hoa.pham_cap):
-- gán một lần ở danh mục là mọi phiếu (kể cả phiếu cũ) tự vào nhóm. Không dùng snapshot ct.pham_cap.
--
-- Thay đổi so với 082: thêm khoá JSON `theoPhamCap` [{pham_cap, tien_xuat, tien_chuyen, so_dong}];
-- giữ nguyên `theoHangMuc` và các khoá khác (frontend cũ vẫn chạy).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/088-phieu-kho-gia-tri-theo-pham-cap.sql
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Sơ chế — bảng fp_farm_*
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_farm_pt_gia_tri_xuat_chuyen(
  p_tu date,
  p_den date,
  p_kho_ids bigint[] DEFAULT NULL,
  p_trang_thai text[] DEFAULT ARRAY['Đã duyệt']
)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  WITH
  mov AS MATERIALIZED (
    SELECT pk.id AS phieu_id, pk.ngay, pk.loai, pk.kho_id, pk.kho_den_id,
           pk.ten_kho, pk.ten_kho_den,
           ct.id AS ct_id, ct.id_hang_hoa, coalesce(ct.so_luong, 0) AS so_luong,
           coalesce(ct.don_gia, 0) AS don_gia, NULLIF(btrim(ct.hang_muc), '') AS hang_muc
      FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
      JOIN public.fp_farm_phieu_kho_phan_thuoc pk ON pk.id = ct.id_phieu_kho
     WHERE pk.loai IN ('xuất', 'chuyển')
       AND (p_tu IS NULL OR pk.ngay >= p_tu)
       AND (p_den IS NULL OR pk.ngay <= p_den)
       AND (p_trang_thai IS NULL OR pk.trang_thai = ANY (p_trang_thai))
       AND (p_kho_ids IS NULL OR pk.kho_id = ANY (p_kho_ids)
            OR (pk.loai = 'chuyển' AND pk.kho_den_id = ANY (p_kho_ids)))
  ),
  nhap_cand AS MATERIALIZED (
    SELECT ct.id_hang_hoa, ct.don_gia, pk.ngay, ct.id AS ct_id
      FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
      JOIN public.fp_farm_phieu_kho_phan_thuoc pk ON pk.id = ct.id_phieu_kho
     WHERE pk.loai = 'nhập'
       AND ct.don_gia > 0
       AND coalesce(pk.trang_thai, '') <> 'Không duyệt'
       AND ct.id_hang_hoa IN (SELECT DISTINCT m.id_hang_hoa FROM mov m)
  ),
  mh_gia AS MATERIALIZED (
    SELECT DISTINCT ON (lower(btrim(ma_hang_hoa))) lower(btrim(ma_hang_hoa)) AS ma, don_gia
      FROM public.fp_mh_danh_sach_hang_hoa
     WHERE don_gia > 0 AND NULLIF(btrim(ma_hang_hoa), '') IS NOT NULL
     ORDER BY lower(btrim(ma_hang_hoa)), tg_cap_nhat DESC NULLS LAST, id DESC
  ),
  priced AS MATERIALIZED (
    SELECT m.*, hh.ma_hang_hoa, hh.ten_hang_hoa,
           NULLIF(btrim(hh.pham_cap), '') AS pham_cap_dm,
           CASE
             WHEN m.don_gia > 0 THEN m.don_gia
             WHEN gn.gia IS NOT NULL THEN gn.gia
             WHEN hh.don_gia > 0 THEN hh.don_gia
             WHEN mh.don_gia IS NOT NULL THEN mh.don_gia
           END AS gia
      FROM mov m
      LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON hh.id = m.id_hang_hoa
      LEFT JOIN LATERAL (
        SELECT n.don_gia AS gia FROM nhap_cand n
         WHERE n.id_hang_hoa = m.id_hang_hoa AND n.ngay <= m.ngay
         ORDER BY n.ngay DESC, n.ct_id DESC
         LIMIT 1
      ) gn ON true
      LEFT JOIN mh_gia mh ON mh.ma = lower(btrim(hh.ma_hang_hoa))
  ),
  r AS (
    SELECT p.*, CASE WHEN p.gia IS NOT NULL THEN round(p.so_luong * p.gia, 0) ELSE 0 END AS tien
      FROM priced p
  ),
  kho_ten AS (
    SELECT u.id_kho, max(u.ten) AS ten
      FROM (SELECT kho_id AS id_kho, ten_kho AS ten FROM r
            UNION ALL
            SELECT kho_den_id, ten_kho_den FROM r WHERE loai = 'chuyển' AND kho_den_id IS NOT NULL) u
     GROUP BY u.id_kho
  ),
  ten AS (
    SELECT kt.id_kho, coalesce(k.ten_kho, kt.ten, kt.id_kho::text) AS ten_kho
      FROM kho_ten kt
      LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = kt.id_kho
  ),
  theo_kho AS (
    SELECT t.id_kho, t.ten_kho,
           coalesce((SELECT sum(r.tien) FROM r WHERE r.loai = 'xuất' AND r.kho_id = t.id_kho), 0) AS tien_xuat,
           coalesce((SELECT sum(r.tien) FROM r WHERE r.loai = 'chuyển' AND r.kho_id = t.id_kho), 0) AS tien_chuyen_di,
           coalesce((SELECT sum(r.tien) FROM r WHERE r.loai = 'chuyển' AND r.kho_den_id = t.id_kho), 0) AS tien_nhan_ve
      FROM ten t
     WHERE p_kho_ids IS NULL OR t.id_kho = ANY (p_kho_ids)
  )
  SELECT jsonb_build_object(
    'tong', (SELECT jsonb_build_object(
               'tien_xuat', coalesce(sum(tien) FILTER (WHERE loai = 'xuất'), 0),
               'tien_chuyen', coalesce(sum(tien) FILTER (WHERE loai = 'chuyển'), 0),
               'so_dong', count(*),
               'so_dong_chua_gia', count(*) FILTER (WHERE gia IS NULL))
             FROM r),
    'theoHangMuc', coalesce((
      SELECT jsonb_agg(jsonb_build_object('hang_muc', x.hang_muc, 'tien_xuat', x.tien_xuat,
                                          'tien_chuyen', x.tien_chuyen, 'so_dong', x.so_dong))
        FROM (SELECT hang_muc,
                     coalesce(sum(tien) FILTER (WHERE loai = 'xuất'), 0) AS tien_xuat,
                     coalesce(sum(tien) FILTER (WHERE loai = 'chuyển'), 0) AS tien_chuyen,
                     count(*) AS so_dong
                FROM r GROUP BY hang_muc) x), '[]'::jsonb),
    'theoPhamCap', coalesce((
      SELECT jsonb_agg(jsonb_build_object('pham_cap', x.pham_cap_dm, 'tien_xuat', x.tien_xuat,
                                          'tien_chuyen', x.tien_chuyen, 'so_dong', x.so_dong))
        FROM (SELECT pham_cap_dm,
                     coalesce(sum(tien) FILTER (WHERE loai = 'xuất'), 0) AS tien_xuat,
                     coalesce(sum(tien) FILTER (WHERE loai = 'chuyển'), 0) AS tien_chuyen,
                     count(*) AS so_dong
                FROM r GROUP BY pham_cap_dm) x), '[]'::jsonb),
    'luanChuyen', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id_kho_di', x.kho_id::text, 'ten_kho_di', td.ten_kho,
                                          'id_kho_den', x.kho_den_id::text, 'ten_kho_den', tn.ten_kho,
                                          'so_dong', x.so_dong, 'tien', x.tien)
                       ORDER BY x.tien DESC, x.so_dong DESC)
        FROM (SELECT kho_id, kho_den_id, count(*) AS so_dong, sum(tien) AS tien
                FROM r WHERE loai = 'chuyển' AND kho_den_id IS NOT NULL
               GROUP BY kho_id, kho_den_id) x
        LEFT JOIN ten td ON td.id_kho = x.kho_id
        LEFT JOIN ten tn ON tn.id_kho = x.kho_den_id), '[]'::jsonb),
    'theoKho', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id_kho', t.id_kho::text, 'ten_kho', t.ten_kho,
                                          'tien_xuat', t.tien_xuat, 'tien_chuyen_di', t.tien_chuyen_di,
                                          'tien_nhan_ve', t.tien_nhan_ve)
                       ORDER BY (t.tien_xuat + t.tien_chuyen_di + t.tien_nhan_ve) DESC, t.ten_kho)
        FROM theo_kho t), '[]'::jsonb),
    'chuaCoGia', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id_hang_hoa', x.id_hang_hoa::text, 'ma_hang', x.ma_hang,
                                          'ten_hang', x.ten_hang, 'so_dong', x.so_dong)
                       ORDER BY x.so_dong DESC, x.ten_hang)
        FROM (SELECT id_hang_hoa, coalesce(max(ma_hang_hoa), '—') AS ma_hang,
                     coalesce(max(ten_hang_hoa), '—') AS ten_hang, count(*) AS so_dong
                FROM r WHERE gia IS NULL
               GROUP BY id_hang_hoa
               ORDER BY count(*) DESC
               LIMIT 50) x), '[]'::jsonb)
  );
$$;

-- ---------------------------------------------------------------------------
-- Phân thuốc — bảng fp_pt_* (cùng logic, khác bảng)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_pt_gia_tri_xuat_chuyen(
  p_tu date,
  p_den date,
  p_kho_ids bigint[] DEFAULT NULL,
  p_trang_thai text[] DEFAULT ARRAY['Đã duyệt']
)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  WITH
  mov AS MATERIALIZED (
    SELECT pk.id AS phieu_id, pk.ngay, pk.loai, pk.kho_id, pk.kho_den_id,
           pk.ten_kho, pk.ten_kho_den,
           ct.id AS ct_id, ct.id_hang_hoa, coalesce(ct.so_luong, 0) AS so_luong,
           coalesce(ct.don_gia, 0) AS don_gia, NULLIF(btrim(ct.hang_muc), '') AS hang_muc
      FROM public.fp_pt_phieu_kho_chi_tiet ct
      JOIN public.fp_pt_phieu_kho pk ON pk.id = ct.id_phieu_kho
     WHERE pk.loai IN ('xuất', 'chuyển')
       AND (p_tu IS NULL OR pk.ngay >= p_tu)
       AND (p_den IS NULL OR pk.ngay <= p_den)
       AND (p_trang_thai IS NULL OR pk.trang_thai = ANY (p_trang_thai))
       AND (p_kho_ids IS NULL OR pk.kho_id = ANY (p_kho_ids)
            OR (pk.loai = 'chuyển' AND pk.kho_den_id = ANY (p_kho_ids)))
  ),
  nhap_cand AS MATERIALIZED (
    SELECT ct.id_hang_hoa, ct.don_gia, pk.ngay, ct.id AS ct_id
      FROM public.fp_pt_phieu_kho_chi_tiet ct
      JOIN public.fp_pt_phieu_kho pk ON pk.id = ct.id_phieu_kho
     WHERE pk.loai = 'nhập'
       AND ct.don_gia > 0
       AND coalesce(pk.trang_thai, '') <> 'Không duyệt'
       AND ct.id_hang_hoa IN (SELECT DISTINCT m.id_hang_hoa FROM mov m)
  ),
  mh_gia AS MATERIALIZED (
    SELECT DISTINCT ON (lower(btrim(ma_hang_hoa))) lower(btrim(ma_hang_hoa)) AS ma, don_gia
      FROM public.fp_mh_danh_sach_hang_hoa
     WHERE don_gia > 0 AND NULLIF(btrim(ma_hang_hoa), '') IS NOT NULL
     ORDER BY lower(btrim(ma_hang_hoa)), tg_cap_nhat DESC NULLS LAST, id DESC
  ),
  priced AS MATERIALIZED (
    SELECT m.*, hh.ma_hang_hoa, hh.ten_hang_hoa,
           NULLIF(btrim(hh.pham_cap), '') AS pham_cap_dm,
           CASE
             WHEN m.don_gia > 0 THEN m.don_gia
             WHEN gn.gia IS NOT NULL THEN gn.gia
             WHEN hh.don_gia > 0 THEN hh.don_gia
             WHEN mh.don_gia IS NOT NULL THEN mh.don_gia
           END AS gia
      FROM mov m
      LEFT JOIN public.fp_pt_danh_sach_hang_hoa hh ON hh.id = m.id_hang_hoa
      LEFT JOIN LATERAL (
        SELECT n.don_gia AS gia FROM nhap_cand n
         WHERE n.id_hang_hoa = m.id_hang_hoa AND n.ngay <= m.ngay
         ORDER BY n.ngay DESC, n.ct_id DESC
         LIMIT 1
      ) gn ON true
      LEFT JOIN mh_gia mh ON mh.ma = lower(btrim(hh.ma_hang_hoa))
  ),
  r AS (
    SELECT p.*, CASE WHEN p.gia IS NOT NULL THEN round(p.so_luong * p.gia, 0) ELSE 0 END AS tien
      FROM priced p
  ),
  kho_ten AS (
    SELECT u.id_kho, max(u.ten) AS ten
      FROM (SELECT kho_id AS id_kho, ten_kho AS ten FROM r
            UNION ALL
            SELECT kho_den_id, ten_kho_den FROM r WHERE loai = 'chuyển' AND kho_den_id IS NOT NULL) u
     GROUP BY u.id_kho
  ),
  ten AS (
    SELECT kt.id_kho, coalesce(k.ten_kho, kt.ten, kt.id_kho::text) AS ten_kho
      FROM kho_ten kt
      LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = kt.id_kho
  ),
  theo_kho AS (
    SELECT t.id_kho, t.ten_kho,
           coalesce((SELECT sum(r.tien) FROM r WHERE r.loai = 'xuất' AND r.kho_id = t.id_kho), 0) AS tien_xuat,
           coalesce((SELECT sum(r.tien) FROM r WHERE r.loai = 'chuyển' AND r.kho_id = t.id_kho), 0) AS tien_chuyen_di,
           coalesce((SELECT sum(r.tien) FROM r WHERE r.loai = 'chuyển' AND r.kho_den_id = t.id_kho), 0) AS tien_nhan_ve
      FROM ten t
     WHERE p_kho_ids IS NULL OR t.id_kho = ANY (p_kho_ids)
  )
  SELECT jsonb_build_object(
    'tong', (SELECT jsonb_build_object(
               'tien_xuat', coalesce(sum(tien) FILTER (WHERE loai = 'xuất'), 0),
               'tien_chuyen', coalesce(sum(tien) FILTER (WHERE loai = 'chuyển'), 0),
               'so_dong', count(*),
               'so_dong_chua_gia', count(*) FILTER (WHERE gia IS NULL))
             FROM r),
    'theoHangMuc', coalesce((
      SELECT jsonb_agg(jsonb_build_object('hang_muc', x.hang_muc, 'tien_xuat', x.tien_xuat,
                                          'tien_chuyen', x.tien_chuyen, 'so_dong', x.so_dong))
        FROM (SELECT hang_muc,
                     coalesce(sum(tien) FILTER (WHERE loai = 'xuất'), 0) AS tien_xuat,
                     coalesce(sum(tien) FILTER (WHERE loai = 'chuyển'), 0) AS tien_chuyen,
                     count(*) AS so_dong
                FROM r GROUP BY hang_muc) x), '[]'::jsonb),
    'theoPhamCap', coalesce((
      SELECT jsonb_agg(jsonb_build_object('pham_cap', x.pham_cap_dm, 'tien_xuat', x.tien_xuat,
                                          'tien_chuyen', x.tien_chuyen, 'so_dong', x.so_dong))
        FROM (SELECT pham_cap_dm,
                     coalesce(sum(tien) FILTER (WHERE loai = 'xuất'), 0) AS tien_xuat,
                     coalesce(sum(tien) FILTER (WHERE loai = 'chuyển'), 0) AS tien_chuyen,
                     count(*) AS so_dong
                FROM r GROUP BY pham_cap_dm) x), '[]'::jsonb),
    'luanChuyen', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id_kho_di', x.kho_id::text, 'ten_kho_di', td.ten_kho,
                                          'id_kho_den', x.kho_den_id::text, 'ten_kho_den', tn.ten_kho,
                                          'so_dong', x.so_dong, 'tien', x.tien)
                       ORDER BY x.tien DESC, x.so_dong DESC)
        FROM (SELECT kho_id, kho_den_id, count(*) AS so_dong, sum(tien) AS tien
                FROM r WHERE loai = 'chuyển' AND kho_den_id IS NOT NULL
               GROUP BY kho_id, kho_den_id) x
        LEFT JOIN ten td ON td.id_kho = x.kho_id
        LEFT JOIN ten tn ON tn.id_kho = x.kho_den_id), '[]'::jsonb),
    'theoKho', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id_kho', t.id_kho::text, 'ten_kho', t.ten_kho,
                                          'tien_xuat', t.tien_xuat, 'tien_chuyen_di', t.tien_chuyen_di,
                                          'tien_nhan_ve', t.tien_nhan_ve)
                       ORDER BY (t.tien_xuat + t.tien_chuyen_di + t.tien_nhan_ve) DESC, t.ten_kho)
        FROM theo_kho t), '[]'::jsonb),
    'chuaCoGia', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id_hang_hoa', x.id_hang_hoa::text, 'ma_hang', x.ma_hang,
                                          'ten_hang', x.ten_hang, 'so_dong', x.so_dong)
                       ORDER BY x.so_dong DESC, x.ten_hang)
        FROM (SELECT id_hang_hoa, coalesce(max(ma_hang_hoa), '—') AS ma_hang,
                     coalesce(max(ten_hang_hoa), '—') AS ten_hang, count(*) AS so_dong
                FROM r WHERE gia IS NULL
               GROUP BY id_hang_hoa
               ORDER BY count(*) DESC
               LIMIT 50) x), '[]'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.rpc_farm_pt_gia_tri_xuat_chuyen(date, date, bigint[], text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_pt_gia_tri_xuat_chuyen(date, date, bigint[], text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_farm_pt_gia_tri_xuat_chuyen(date, date, bigint[], text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_pt_gia_tri_xuat_chuyen(date, date, bigint[], text[]) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
