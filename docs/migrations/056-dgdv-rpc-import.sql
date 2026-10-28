-- =============================================================================
-- 056-dgdv-rpc-import.sql — Đánh giá đầu vào: Import Excel dòng chi tiết trong MỘT transaction
--
-- rpc_dgdv_import(p_rows jsonb, p_thay_the boolean, p_id_phieu bigint)
--   p_rows: mảng dòng đã được app parse + kiểm sơ bộ (utils/import-dong.ts):
--     { row, ngay 'YYYY-MM-DD', id_chi_nhanh, ten_lo, to_truong, id_mau_1 (null = đứt dây), id_mau_2,
--       xe_doi, th_nam, th_tuan (tuần thu hoạch của dây), so_luong, danh_gia, so_luong_loi, ly_do_loi }
--   p_thay_the: true = xoá dòng + đứt dây của mọi (chi nhánh, ngày) có trong file rồi ghi lại;
--               false = cộng thêm dòng mới (đứt dây cộng dồn).
--   p_id_phieu: import trong một phiếu → mọi dòng phải thuộc tuần + chi nhánh của phiếu đó.
-- Tự tạo: phiếu tuần (theo tuần ISO của ngày), lô (danh mục + lô của phiếu, tra tên không phân biệt
-- hoa thường), cột dây (theo màu 1 / màu 2 / xé đôi / tuần thu hoạch; chích bắp = thu hoạch − 10 tuần),
-- lý do mới vào danh mục chọn nhanh.
-- Tất cả hoặc không: có dòng lỗi (phiếu đã khoá, ngày ngoài phiếu) → trả danh sách lỗi, KHÔNG ghi gì.
-- SECURITY INVOKER: RLS của 052/054 vẫn áp (cần quyền tạo / sửa phiếu Đánh giá đầu vào).
-- Trigger đồng bộ của 052 vẫn chạy → Báo cáo sơ chế / Dự báo cập nhật theo số mới.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-056
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/056-dgdv-rpc-import.sql
-- =============================================================================

BEGIN;

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
  v_nam int;
  v_tuan int;
  v_phieu bigint;
  v_tt text;
  v_lo_dm bigint;
  v_lo bigint;
  v_cot bigint;
  v_dau_th date;
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
    SELECT id, nam, tuan, id_chi_nhanh, trang_thai INTO v_p FROM fp_farm_dgdv WHERE id = p_id_phieu;
    IF v_p.id IS NULL THEN
      RAISE EXCEPTION 'Không tìm thấy phiếu %', p_id_phieu USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- 1) Kiểm trước, chưa ghi gì -----------------------------------------------------
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    v_row := (r->>'row')::int;
    v_ngay := (r->>'ngay')::date;
    v_cn := (r->>'id_chi_nhanh')::bigint;
    v_nam := extract(isoyear FROM v_ngay)::int;
    v_tuan := extract(week FROM v_ngay)::int;

    -- IF lồng: plpgsql không đảm bảo AND dừng sớm, v_p chưa gán khi không có p_id_phieu.
    IF p_id_phieu IS NOT NULL THEN
      IF (v_nam, v_tuan, v_cn) IS DISTINCT FROM (v_p.nam, v_p.tuan, v_p.id_chi_nhanh) THEN
        v_errors := v_errors || jsonb_build_object('row', v_row,
          'msg', format('Ngày %s không thuộc tuần %s/%s của phiếu', to_char(v_ngay, 'DD/MM/YYYY'), v_p.tuan, v_p.nam));
        CONTINUE;
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM fp_farm_dgdv WHERE nam = v_nam AND tuan = v_tuan AND id_chi_nhanh = v_cn AND trang_thai = 'khoa') THEN
      v_errors := v_errors || jsonb_build_object('row', v_row,
        'msg', format('Phiếu tuần %s/%s của chi nhánh đã khoá — mở khoá trước khi import', v_tuan, v_nam));
    END IF;
  END LOOP;

  IF jsonb_array_length(v_errors) > 0 THEN
    RETURN jsonb_build_object('errors', v_errors, 'so_dong', 0, 'so_phieu_moi', 0, 'so_lo_moi', 0, 'so_day_moi', 0);
  END IF;

  -- 2) Thay thế: xoá số của các (chi nhánh, ngày) có trong file ---------------------
  IF p_thay_the THEN
    DELETE FROM fp_farm_dgdv_dong d
     USING fp_farm_dgdv_lo l, fp_farm_dgdv p,
           (SELECT DISTINCT (x->>'ngay')::date AS ngay, (x->>'id_chi_nhanh')::bigint AS cn FROM jsonb_array_elements(p_rows) x) f
     WHERE d.id_phieu_lo = l.id AND l.id_phieu = p.id AND p.id_chi_nhanh = f.cn AND d.ngay = f.ngay;
    DELETE FROM fp_farm_dgdv_lo_ngay n
     USING fp_farm_dgdv_lo l, fp_farm_dgdv p,
           (SELECT DISTINCT (x->>'ngay')::date AS ngay, (x->>'id_chi_nhanh')::bigint AS cn FROM jsonb_array_elements(p_rows) x) f
     WHERE n.id_phieu_lo = l.id AND l.id_phieu = p.id AND p.id_chi_nhanh = f.cn AND n.ngay = f.ngay;
  END IF;

  -- 3) Ghi từng dòng --------------------------------------------------------------
  FOR r IN SELECT * FROM jsonb_array_elements(p_rows) ORDER BY (value->>'row')::int LOOP
    v_ngay := (r->>'ngay')::date;
    v_cn := (r->>'id_chi_nhanh')::bigint;
    v_nam := extract(isoyear FROM v_ngay)::int;
    v_tuan := extract(week FROM v_ngay)::int;
    v_ten_lo := btrim(regexp_replace(r->>'ten_lo', '\s+', ' ', 'g'));
    v_to_truong := NULLIF(btrim(regexp_replace(coalesce(r->>'to_truong', ''), '\s+', ' ', 'g')), '');

    -- Phiếu tuần
    SELECT id INTO v_phieu FROM fp_farm_dgdv WHERE nam = v_nam AND tuan = v_tuan AND id_chi_nhanh = v_cn;
    IF v_phieu IS NULL THEN
      INSERT INTO fp_farm_dgdv (nam, tuan, id_chi_nhanh, trang_thai) VALUES (v_nam, v_tuan, v_cn, 'mo') RETURNING id INTO v_phieu;
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
      -- Đứt dây: cộng dồn vào số của lô × ngày
      INSERT INTO fp_farm_dgdv_lo_ngay (id_phieu_lo, ngay, dut_day) VALUES (v_lo, v_ngay, (r->>'so_luong')::int)
      ON CONFLICT (id_phieu_lo, ngay) DO UPDATE SET dut_day = fp_farm_dgdv_lo_ngay.dut_day + EXCLUDED.dut_day;
    ELSE
      v_mau2 := (r->>'id_mau_2')::bigint;
      v_xe := coalesce((r->>'xe_doi')::boolean, false);
      v_dau_th := fn_dgdv_ngay_dau_tuan((r->>'th_nam')::int, (r->>'th_tuan')::int);

      SELECT id INTO v_cot FROM fp_farm_dgdv_cot
       WHERE id_phieu = v_phieu AND id_mau_1 = v_mau1 AND id_mau_2 IS NOT DISTINCT FROM v_mau2 AND xe_doi = v_xe
         AND thu_hoach_tu BETWEEN v_dau_th AND v_dau_th + 6
       ORDER BY stt, id LIMIT 1;
      IF v_cot IS NULL THEN
        INSERT INTO fp_farm_dgdv_cot (id_phieu, stt, chich_bap_tu, chich_bap_den, thu_hoach_tu, thu_hoach_den, id_mau_1, id_mau_2, xe_doi)
        VALUES (v_phieu, coalesce((SELECT max(stt) FROM fp_farm_dgdv_cot WHERE id_phieu = v_phieu), 0) + 1,
                v_dau_th - 70, v_dau_th - 64, v_dau_th, v_dau_th + 6, v_mau1, v_mau2, v_xe)
        RETURNING id INTO v_cot;
        n_cot := n_cot + 1;
      END IF;

      SELECT coalesce(max(stt_dong), 0) + 1 INTO v_stt FROM fp_farm_dgdv_dong
       WHERE id_phieu_lo = v_lo AND id_cot = v_cot AND ngay = v_ngay;
      INSERT INTO fp_farm_dgdv_dong (id_phieu_lo, id_cot, ngay, stt_dong, so_luong, danh_gia, so_luong_loi, ly_do_loi)
      VALUES (v_lo, v_cot, v_ngay, v_stt, (r->>'so_luong')::int, NULLIF(btrim(r->>'danh_gia'), ''),
              coalesce((r->>'so_luong_loi')::int, 0), NULLIF(btrim(r->>'ly_do_loi'), ''));

      -- Lý do mới → danh mục chọn nhanh
      IF NULLIF(btrim(r->>'danh_gia'), '') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM fp_var_dgdv_ly_do WHERE loai = 'danh_gia' AND lower(ten) = lower(btrim(r->>'danh_gia'))) THEN
        INSERT INTO fp_var_dgdv_ly_do (ten, loai) VALUES (btrim(r->>'danh_gia'), 'danh_gia') ON CONFLICT DO NOTHING;
      END IF;
      IF NULLIF(btrim(r->>'ly_do_loi'), '') IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM fp_var_dgdv_ly_do WHERE loai = 'loi' AND lower(ten) = lower(btrim(r->>'ly_do_loi'))) THEN
        INSERT INTO fp_var_dgdv_ly_do (ten, loai) VALUES (btrim(r->>'ly_do_loi'), 'loi') ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    n_dong := n_dong + 1;
  END LOOP;

  RETURN jsonb_build_object('errors', '[]'::jsonb, 'so_dong', n_dong, 'so_phieu_moi', n_phieu, 'so_lo_moi', n_lo, 'so_day_moi', n_cot);
END;
$$;

COMMENT ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) IS
  'Đánh giá đầu vào: import dòng chi tiết (tự tạo phiếu / lô / cột dây), tất cả hoặc không. SECURITY INVOKER — RLS áp.';

REVOKE ALL ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
