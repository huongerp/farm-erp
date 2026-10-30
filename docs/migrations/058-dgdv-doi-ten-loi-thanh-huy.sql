-- =============================================================================
-- 058-dgdv-doi-ten-loi-thanh-huy.sql — Đánh giá đầu vào: đổi «lỗi» → «huỷ» ở tên cột
--
-- fp_farm_dgdv_dong: so_luong_loi → so_luong_huy, ly_do_loi → ly_do_huy (đổi tên, KHÔNG đụng dữ liệu).
-- Đi kèm:
--  - constraint fp_farm_dgdv_dong_so_luong_loi_check → ..._so_luong_huy_check;
--  - v_fp_farm_dgdv_tong_ngay_day: cột ra so_luong_loi → so_luong_huy (DROP + CREATE vì CREATE OR
--    REPLACE VIEW không đổi tên cột được; không view nào phụ thuộc view này);
--  - v_fp_farm_dgdv_tong_chuyen tự theo tên cột mới (Postgres lưu theo số cột), cột ra vẫn là `ksc`;
--  - fn_dgdv_tong_ngay (SQL) + rpc_dgdv_import (plpgsql) lưu thân hàm dạng chữ → viết lại với tên mới.
--    p_rows của rpc_dgdv_import đổi khoá JSON: so_luong_huy, ly_do_huy.
-- GIỮ NGUYÊN: fp_var_dgdv_ly_do.loai = 'loi' (giá trị phân loại, không phải tên cột); cột ra `ksc`.
--
-- Frontend cũ gửi / đọc so_luong_loi sẽ hỏng ngay khi chạy file này → chạy cùng lúc deploy bản app mới.
-- Trước khi chạy: bash scripts/db-backup.sh truoc-058
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/058-dgdv-doi-ten-loi-thanh-huy.sql
-- =============================================================================

BEGIN;

-- 1) Đổi tên cột + constraint ----------------------------------------------------------
ALTER TABLE public.fp_farm_dgdv_dong RENAME COLUMN so_luong_loi TO so_luong_huy;
ALTER TABLE public.fp_farm_dgdv_dong RENAME COLUMN ly_do_loi TO ly_do_huy;
ALTER TABLE public.fp_farm_dgdv_dong
  RENAME CONSTRAINT fp_farm_dgdv_dong_so_luong_loi_check TO fp_farm_dgdv_dong_so_luong_huy_check;

COMMENT ON COLUMN public.fp_farm_dgdv_dong.so_luong_huy IS 'Số buồng huỷ = không sơ chế (KSC)';
COMMENT ON COLUMN public.fp_farm_dgdv_dong.ly_do_huy IS 'Lý do huỷ (gợi ý chọn nhanh: fp_var_dgdv_ly_do loai = loi)';

-- 2) Tổng theo (ngày, chi nhánh) — như 057 mục 4, tên cột mới --------------------------
CREATE OR REPLACE FUNCTION public.fn_dgdv_tong_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS TABLE (tong_thu bigint, ksc bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH l AS (
    SELECT l.id
    FROM public.fp_farm_dgdv_lo l
    JOIN public.fp_farm_dgdv p ON p.id = l.id_phieu
    WHERE p.ngay = p_ngay AND p.id_chi_nhanh = p_id_chi_nhanh
  ),
  d AS (
    SELECT COALESCE(SUM(d.so_luong), 0)::bigint AS so_luong,
           COALESCE(SUM(d.so_luong_huy), 0)::bigint AS so_luong_huy
    FROM public.fp_farm_dgdv_dong d JOIN l ON l.id = d.id_phieu_lo
  ),
  n AS (
    SELECT COALESCE(SUM(n.dut_day), 0)::bigint AS dut_day
    FROM public.fp_farm_dgdv_lo_ngay n JOIN l ON l.id = n.id_phieu_lo
  )
  SELECT d.so_luong + n.dut_day, d.so_luong_huy FROM d CROSS JOIN n;
$$;

COMMENT ON FUNCTION public.fn_dgdv_tong_ngay(date, bigint) IS
  'Đánh giá đầu vào: tong_thu = Σ số lượng + Σ đứt dây; ksc = Σ số lượng huỷ của MỌI chuyến trong ngày + chi nhánh (0 nếu không có phiếu)';

REVOKE ALL ON FUNCTION public.fn_dgdv_tong_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dgdv_tong_ngay(date, bigint) TO authenticated;

-- 3) View cộng theo ngày × lô × dây — như 057 mục 9b, cột ra so_luong_huy -----------------
DROP VIEW public.v_fp_farm_dgdv_tong_ngay_day;
CREATE VIEW public.v_fp_farm_dgdv_tong_ngay_day
WITH (security_invoker = true) AS
WITH lo AS (
  SELECT l.id, l.id_lo, l.to_truong, l.stt, p.ngay, p.id_chi_nhanh, p.nam, p.tuan, p.chuyen
  FROM public.fp_farm_dgdv_lo l
  JOIN public.fp_farm_dgdv p ON p.id = l.id_phieu
),
tt AS (
  SELECT lo.ngay, lo.id_chi_nhanh, lo.id_lo,
         (array_agg(lo.to_truong ORDER BY lo.chuyen, lo.stt) FILTER (WHERE btrim(lo.to_truong) <> ''))[1] AS to_truong
  FROM lo
  GROUP BY lo.ngay, lo.id_chi_nhanh, lo.id_lo
),
u AS (
  SELECT lo.ngay, lo.id_chi_nhanh, lo.nam, lo.tuan, lo.id_lo,
         c.id_mau_1, c.id_mau_2, c.xe_doi, c.th_nam, c.th_tuan,
         SUM(d.so_luong)::bigint AS so_luong, SUM(d.so_luong_huy)::bigint AS so_luong_huy
  FROM lo
  JOIN public.fp_farm_dgdv_dong d ON d.id_phieu_lo = lo.id
  JOIN public.fp_farm_dgdv_cot c ON c.id = d.id_cot
  GROUP BY lo.ngay, lo.id_chi_nhanh, lo.nam, lo.tuan, lo.id_lo, c.id_mau_1, c.id_mau_2, c.xe_doi, c.th_nam, c.th_tuan
  UNION ALL
  SELECT lo.ngay, lo.id_chi_nhanh, lo.nam, lo.tuan, lo.id_lo,
         NULL::bigint, NULL::bigint, false, NULL::integer, NULL::integer,
         SUM(n.dut_day)::bigint, 0::bigint
  FROM lo
  JOIN public.fp_farm_dgdv_lo_ngay n ON n.id_phieu_lo = lo.id
  GROUP BY lo.ngay, lo.id_chi_nhanh, lo.nam, lo.tuan, lo.id_lo
  HAVING SUM(n.dut_day) <> 0
)
SELECT u.ngay, u.id_chi_nhanh, u.nam, u.tuan, u.id_lo, dm.ten_lo, tt.to_truong,
       u.id_mau_1, u.id_mau_2, u.xe_doi, u.th_nam, u.th_tuan, u.so_luong, u.so_luong_huy
FROM u
LEFT JOIN tt ON tt.ngay = u.ngay AND tt.id_chi_nhanh = u.id_chi_nhanh AND tt.id_lo = u.id_lo
LEFT JOIN public.fp_var_lo_thu_hoach dm ON dm.id = u.id_lo;

COMMENT ON VIEW public.v_fp_farm_dgdv_tong_ngay_day IS
  'Đánh giá đầu vào: cộng mọi chuyến theo ngày × chi nhánh × lô × dây (màu 1, màu 2, xé đôi, tuần thu hoạch). '
  'Dòng id_mau_1 NULL = đứt dây của lô. Σ so_luong / ngày + chi nhánh = tổng thu; Σ so_luong_huy = KSC';

REVOKE ALL ON TABLE public.v_fp_farm_dgdv_tong_ngay_day FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.v_fp_farm_dgdv_tong_ngay_day TO authenticated;

-- 4) rpc_dgdv_import — như 057 mục 10, khoá JSON / cột mới ---------------------------------
CREATE OR REPLACE FUNCTION public.rpc_dgdv_import(p_rows jsonb, p_thay_the boolean DEFAULT false, p_id_phieu bigint DEFAULT NULL)
    RETURNS jsonb
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path TO 'public'
    AS $$
DECLARE
  r jsonb;
  v_row int;
  v_ngay date;
  v_cn bigint;
  v_chuyen int;
  v_phieu bigint;
  v_tt text;
  v_lo_dm bigint;
  v_lo bigint;
  v_cot bigint;
  v_th_nam int;
  v_th_tuan int;
  v_mau1 bigint;
  v_mau2 bigint;
  v_xe boolean;
  v_stt int;
  v_ten_lo text;
  v_to_truong text;
  v_errors jsonb := '[]'::jsonb;
  v_p record;
  n_phieu int := 0;
  n_lo int := 0;
  n_cot int := 0;
  n_dong int := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'Dữ liệu import không hợp lệ' USING ERRCODE = '22023';
  END IF;

  IF p_id_phieu IS NOT NULL THEN
    SELECT id, ngay, chuyen, id_chi_nhanh, trang_thai INTO v_p FROM fp_farm_dgdv WHERE id = p_id_phieu;
    IF v_p.id IS NULL THEN
      RAISE EXCEPTION 'Không tìm thấy phiếu %', p_id_phieu USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- 1) Kiểm trước, chưa ghi gì -----------------------------------------------------
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_row := (r->>'row')::int;
    v_ngay := (r->>'ngay')::date;
    v_cn := (r->>'id_chi_nhanh')::bigint;
    v_chuyen := coalesce((r->>'chuyen')::int, 1);

    IF v_chuyen < 1 THEN
      v_errors := v_errors || jsonb_build_object('row', v_row, 'msg', format('Chuyến %s không hợp lệ (≥ 1)', v_chuyen));
      CONTINUE;
    END IF;

    -- IF lồng: plpgsql không đảm bảo AND dừng sớm, v_p chưa gán khi không có p_id_phieu.
    IF p_id_phieu IS NOT NULL THEN
      IF (v_ngay, v_cn, v_chuyen) IS DISTINCT FROM (v_p.ngay, v_p.id_chi_nhanh, v_p.chuyen::int) THEN
        v_errors := v_errors || jsonb_build_object('row', v_row,
          'msg', format('Dòng không thuộc phiếu chuyến %s ngày %s', v_p.chuyen, to_char(v_p.ngay, 'DD/MM/YYYY')));
        CONTINUE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM fp_farm_dgdv WHERE ngay = v_ngay AND id_chi_nhanh = v_cn AND chuyen = v_chuyen AND trang_thai = 'khoa') THEN
      v_errors := v_errors || jsonb_build_object('row', v_row,
        'msg', format('Phiếu chuyến %s ngày %s của chi nhánh đã khoá — mở khoá trước khi import', v_chuyen, to_char(v_ngay, 'DD/MM/YYYY')));
    END IF;
  END LOOP;

  IF jsonb_array_length(v_errors) > 0 THEN
    RETURN jsonb_build_object('errors', v_errors, 'so_dong', 0, 'so_phieu_moi', 0, 'so_lo_moi', 0, 'so_day_moi', 0);
  END IF;

  -- 2) Thay thế: xoá số của các (chi nhánh, ngày, chuyến) có trong file -------------
  IF p_thay_the THEN
    DELETE FROM fp_farm_dgdv_dong d
     USING fp_farm_dgdv_lo l, fp_farm_dgdv p,
           (SELECT DISTINCT (x->>'ngay')::date AS ngay, (x->>'id_chi_nhanh')::bigint AS cn,
                   coalesce((x->>'chuyen')::int, 1) AS chuyen
            FROM jsonb_array_elements(p_rows) x) f
     WHERE d.id_phieu_lo = l.id AND l.id_phieu = p.id
       AND p.ngay = f.ngay AND p.id_chi_nhanh = f.cn AND p.chuyen = f.chuyen;
    DELETE FROM fp_farm_dgdv_lo_ngay n
     USING fp_farm_dgdv_lo l, fp_farm_dgdv p,
           (SELECT DISTINCT (x->>'ngay')::date AS ngay, (x->>'id_chi_nhanh')::bigint AS cn,
                   coalesce((x->>'chuyen')::int, 1) AS chuyen
            FROM jsonb_array_elements(p_rows) x) f
     WHERE n.id_phieu_lo = l.id AND l.id_phieu = p.id
       AND p.ngay = f.ngay AND p.id_chi_nhanh = f.cn AND p.chuyen = f.chuyen;
  END IF;

  -- 3) Ghi từng dòng --------------------------------------------------------------
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) ORDER BY (value->>'row')::int LOOP
    v_ngay := (r->>'ngay')::date;
    v_cn := (r->>'id_chi_nhanh')::bigint;
    v_chuyen := coalesce((r->>'chuyen')::int, 1);
    v_ten_lo := btrim(regexp_replace(r->>'ten_lo', '\s+', ' ', 'g'));
    v_to_truong := NULLIF(btrim(regexp_replace(coalesce(r->>'to_truong', ''), '\s+', ' ', 'g')), '');

    -- Phiếu chuyến (nam / tuan do trigger tính từ ngày)
    SELECT id INTO v_phieu FROM fp_farm_dgdv WHERE ngay = v_ngay AND id_chi_nhanh = v_cn AND chuyen = v_chuyen;
    IF v_phieu IS NULL THEN
      INSERT INTO fp_farm_dgdv (ngay, chuyen, id_chi_nhanh, trang_thai) VALUES (v_ngay, v_chuyen, v_cn, 'mo') RETURNING id INTO v_phieu;
      n_phieu := n_phieu + 1;
    END IF;

    -- Lô trong danh mục của chi nhánh
    SELECT id INTO v_lo_dm FROM fp_var_lo_thu_hoach
     WHERE id_chi_nhanh = v_cn AND lower(btrim(ten_lo)) = lower(v_ten_lo)
     ORDER BY id LIMIT 1;
    IF v_lo_dm IS NULL THEN
      INSERT INTO fp_var_lo_thu_hoach (ten_lo, id_chi_nhanh, to_truong) VALUES (v_ten_lo, v_cn, v_to_truong) RETURNING id INTO v_lo_dm;
      n_lo := n_lo + 1;
    END IF;

    -- Lô của phiếu
    SELECT id, to_truong INTO v_lo, v_tt FROM fp_farm_dgdv_lo WHERE id_phieu = v_phieu AND id_lo = v_lo_dm;
    IF v_lo IS NULL THEN
      INSERT INTO fp_farm_dgdv_lo (id_phieu, id_lo, to_truong, stt)
      VALUES (v_phieu, v_lo_dm,
              coalesce(v_to_truong, (SELECT to_truong FROM fp_var_lo_thu_hoach WHERE id = v_lo_dm)),
              coalesce((SELECT max(stt) FROM fp_farm_dgdv_lo WHERE id_phieu = v_phieu), 0) + 1)
      RETURNING id INTO v_lo;
    ELSIF v_tt IS NULL AND v_to_truong IS NOT NULL THEN
      UPDATE fp_farm_dgdv_lo SET to_truong = v_to_truong WHERE id = v_lo;
    END IF;

    v_mau1 := (r->>'id_mau_1')::bigint;
    IF v_mau1 IS NULL THEN
      -- Đứt dây: cộng dồn vào số của lô (ngày = ngày phiếu)
      INSERT INTO fp_farm_dgdv_lo_ngay (id_phieu_lo, ngay, dut_day) VALUES (v_lo, v_ngay, (r->>'so_luong')::int)
      ON CONFLICT (id_phieu_lo, ngay) DO UPDATE SET dut_day = fp_farm_dgdv_lo_ngay.dut_day + EXCLUDED.dut_day;
    ELSE
      v_mau2 := (r->>'id_mau_2')::bigint;
      v_xe := coalesce((r->>'xe_doi')::boolean, false);
      v_th_nam := (r->>'th_nam')::int;
      v_th_tuan := (r->>'th_tuan')::int;

      SELECT id INTO v_cot FROM fp_farm_dgdv_cot
       WHERE id_phieu = v_phieu AND id_mau_1 = v_mau1 AND id_mau_2 IS NOT DISTINCT FROM v_mau2 AND xe_doi = v_xe
         AND th_nam = v_th_nam AND th_tuan = v_th_tuan
       ORDER BY stt, id LIMIT 1;
      IF v_cot IS NULL THEN
        INSERT INTO fp_farm_dgdv_cot (id_phieu, stt, th_nam, th_tuan, id_mau_1, id_mau_2, xe_doi)
        VALUES (v_phieu, coalesce((SELECT max(stt) FROM fp_farm_dgdv_cot WHERE id_phieu = v_phieu), 0) + 1,
                v_th_nam, v_th_tuan, v_mau1, v_mau2, v_xe)
        RETURNING id INTO v_cot;
        n_cot := n_cot + 1;
      END IF;

      SELECT coalesce(max(stt_dong), 0) + 1 INTO v_stt FROM fp_farm_dgdv_dong
       WHERE id_phieu_lo = v_lo AND id_cot = v_cot AND ngay = v_ngay;
      INSERT INTO fp_farm_dgdv_dong (id_phieu_lo, id_cot, ngay, stt_dong, so_luong, danh_gia, so_luong_huy, ly_do_huy)
      VALUES (v_lo, v_cot, v_ngay, v_stt, (r->>'so_luong')::int, NULLIF(btrim(r->>'danh_gia'), ''),
              coalesce((r->>'so_luong_huy')::int, 0), NULLIF(btrim(r->>'ly_do_huy'), ''));

      -- Lý do mới → danh mục chọn nhanh
      IF NULLIF(btrim(r->>'danh_gia'), '') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM fp_var_dgdv_ly_do WHERE loai = 'danh_gia' AND lower(ten) = lower(btrim(r->>'danh_gia'))) THEN
        INSERT INTO fp_var_dgdv_ly_do (ten, loai) VALUES (btrim(r->>'danh_gia'), 'danh_gia') ON CONFLICT DO NOTHING;
      END IF;
      IF NULLIF(btrim(r->>'ly_do_huy'), '') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM fp_var_dgdv_ly_do WHERE loai = 'loi' AND lower(ten) = lower(btrim(r->>'ly_do_huy'))) THEN
        INSERT INTO fp_var_dgdv_ly_do (ten, loai) VALUES (btrim(r->>'ly_do_huy'), 'loi') ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    n_dong := n_dong + 1;
  END LOOP;

  RETURN jsonb_build_object('errors', '[]'::jsonb, 'so_dong', n_dong, 'so_phieu_moi', n_phieu, 'so_lo_moi', n_lo, 'so_day_moi', n_cot);
END;
$$;

COMMENT ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) IS
  'Đánh giá đầu vào: import dòng chi tiết theo chuyến (tự tạo phiếu / lô / cột dây), tất cả hoặc không. SECURITY INVOKER — RLS áp.';

REVOKE ALL ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- KIỂM TRA SAU KHI CHẠY (chạy tay bằng scripts/db-sql.sh -c "...")
-- 1) Không còn hàm nào nhắc tên cũ (kỳ vọng 0):
--    SELECT count(*) FROM pg_proc WHERE prosrc ~ 'so_luong_loi|ly_do_loi';
-- 2) Σ khớp giữa bảng và view (kỳ vọng 2 số bằng nhau):
--    SELECT (SELECT sum(so_luong_huy) FROM fp_farm_dgdv_dong), (SELECT sum(so_luong_huy) FROM v_fp_farm_dgdv_tong_ngay_day);
