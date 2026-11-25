-- =============================================================================
-- 102-bcsc-het-ton-am-du-bao-thu-tu-bcsc.sql — tiếp migration 101 (Công chốt 25/11/2026)
--
-- A) «Có dữ liệu ĐGĐV» = phiếu ĐGĐV của ngày + chi nhánh có ÍT NHẤT 1 LÔ (101 chỉ xét có phiếu → phiếu rỗng,
--    vd NSCFP2 01/11, vẫn khoá thu hoạch = 0). Thay thân fn_dgdv_co_phieu_ngay; trigger khoá số và hàm đồng bộ
--    của 101 dùng lại hàm này nên tự theo.
--
-- B) Dự báo SL đóng thùng — dòng 10 = max(0, tồn đầu + thu − KSC − tồn cuối): ngày chưa có dữ liệu ĐGĐV lấy
--    thu / KSC từ Báo cáo sơ chế cùng ngày (số nhập tay theo 101) thay vì 0.
--    - fn_du_bao_thu_ksc_ngay: nguồn thu / KSC dùng chung cho trigger + RPC form.
--    - Thay thân fn_dgdv_trg_du_bao_khoa_so, fn_du_bao_dong_bo (thân 100, chỉ đổi nguồn thu / KSC).
--    - fn_du_bao_trg_bcsc_ct_ton (060): theo dõi thêm 2 chỉ tiêu thu hoạch / KSC của Báo cáo sơ chế.
--
-- C) Sửa dữ liệu cho hết tồn âm ở Báo cáo sơ chế — lần lượt phiếu âm SỚM NHẤT (mỗi lần sửa, chuỗi tồn đầu
--    của 100 tự nối lại phía sau rồi tìm phiếu âm kế):
--    - Ngày CHƯA có dữ liệu ĐGĐV (trước khi dùng app): tăng Thu hoạch thêm đúng phần âm
--      (thu = sơ chế + KSC − tồn đầu) → tồn cuối 0. Số thu hoạch suy ra, không phải số đếm.
--    - Ngày CÓ ĐGĐV (thu / KSC khoá): giảm Sơ chế đúng phần âm — các phiếu nhập sơ chế = thu hoạch, quên trừ
--      KSC (NSCFP6 29/10, 04/11, 05/11; NSCFP1 29/10; NSCFP3 08/11).
--    Giá trị cũ tra / khôi phục ở fp_var_nhat_ky_thay_doi (trigger nhật ký 016).
--
-- Chạy lại được (CREATE OR REPLACE; C chỉ đụng phiếu còn âm).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/102-bcsc-het-ton-am-du-bao-thu-tu-bcsc.sql
-- =============================================================================
BEGIN;

-- A) Có dữ liệu ĐGĐV = có lô ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_dgdv_co_phieu_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.fp_farm_dgdv p
      JOIN public.fp_farm_dgdv_lo l ON l.id_phieu = p.id
     WHERE p.ngay = p_ngay AND p.id_chi_nhanh = p_id_chi_nhanh);
$$;
COMMENT ON FUNCTION public.fn_dgdv_co_phieu_ngay(date, bigint) IS
  'Đánh giá đầu vào: ngày + chi nhánh có dữ liệu (phiếu có ít nhất 1 lô) chưa. false → Báo cáo sơ chế nhập tay '
  'thu hoạch / KSC, Dự báo lấy thu / KSC theo Báo cáo sơ chế (migration 101, 102)';

-- B1) Nguồn thu / KSC cho Dự báo -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_du_bao_thu_ksc_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS TABLE (tong_thu bigint, ksc bigint, tu_dgdv boolean)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF public.fn_dgdv_co_phieu_ngay(p_ngay, p_id_chi_nhanh) THEN
    RETURN QUERY SELECT t.tong_thu, t.ksc, true FROM public.fn_dgdv_tong_ngay(p_ngay, p_id_chi_nhanh) t;
  ELSE
    RETURN QUERY
      SELECT COALESCE(MAX(ct.gia_tri) FILTER (WHERE ct.ma_chi_tieu = 'tong_buong_thu_hoach'), 0)::bigint,
             COALESCE(MAX(ct.gia_tri) FILTER (WHERE ct.ma_chi_tieu = 'tong_buong_khong_so_che'), 0)::bigint,
             false
        FROM public.fp_farm_bao_cao_so_che b
        JOIN public.fp_farm_bao_cao_so_che_ct ct ON ct.id_bao_cao = b.id
       WHERE b.ngay = p_ngay AND b.id_chi_nhanh = p_id_chi_nhanh
         AND ct.ma_chi_tieu IN ('tong_buong_thu_hoach', 'tong_buong_khong_so_che');
  END IF;
END;
$$;
COMMENT ON FUNCTION public.fn_du_bao_thu_ksc_ngay(date, bigint) IS
  'Dự báo SL đóng thùng: thu / KSC của ngày — theo ĐGĐV nếu có dữ liệu, không thì theo Báo cáo sơ chế (migration 102)';

REVOKE ALL ON FUNCTION public.fn_du_bao_thu_ksc_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_du_bao_thu_ksc_ngay(date, bigint) TO authenticated;

-- B2) Trigger khoá số khi lưu dự báo (thân 100, đổi nguồn thu / KSC) ------------------------
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_du_bao_khoa_so()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thu bigint;
  v_ksc bigint;
  v_dau integer;
  v_cuoi integer;
  v_buong bigint;
  v_kg numeric;
  v_ap boolean;
BEGIN
  SELECT t.tong_thu, t.ksc INTO v_thu, v_ksc FROM public.fn_du_bao_thu_ksc_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  SELECT t.ton_dau, t.ton_cuoi INTO v_dau, v_cuoi FROM public.fn_du_bao_ton_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  NEW.sl_buong_ton_dau_ngay := COALESCE(v_dau, 0);
  NEW.sl_buong_ton_cuoi_ngay := COALESCE(v_cuoi, 0);
  NEW.so_buong_ksc := COALESCE(v_ksc, 0)::integer;
  NEW.tong_buong_nhap_thuc_te :=
    GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) - COALESCE(v_ksc, 0) - COALESCE(v_cuoi, 0))::integer;

  SELECT t.so_buong, t.tong_kg, t.ap_dung INTO v_buong, v_kg, v_ap
    FROM public.fn_dgdv_can_mau_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  IF COALESCE(v_ap, false) THEN
    NEW.so_buong_can_mau := COALESCE(v_buong, 0)::integer;
    NEW.tong_can_nang_mau := COALESCE(v_kg, 0);
  END IF;
  RETURN NEW;
END;
$$;

-- B3) Đồng bộ dự báo (thân 100, đổi nguồn thu / KSC) ---------------------------------------
CREATE OR REPLACE FUNCTION public.fn_du_bao_dong_bo(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thu bigint;
  v_ksc integer;
  v_dau integer;
  v_cuoi integer;
  v_nhap integer;
  v_buong bigint;
  v_kg numeric;
  v_ap boolean;
BEGIN
  IF p_ngay IS NULL OR p_id_chi_nhanh IS NULL THEN
    RETURN;
  END IF;

  SELECT t.tong_thu, COALESCE(t.ksc, 0)::integer INTO v_thu, v_ksc
    FROM public.fn_du_bao_thu_ksc_ngay(p_ngay, p_id_chi_nhanh) t;
  SELECT t.ton_dau, t.ton_cuoi INTO v_dau, v_cuoi FROM public.fn_du_bao_ton_ngay(p_ngay, p_id_chi_nhanh) t;
  SELECT t.so_buong, t.tong_kg, t.ap_dung INTO v_buong, v_kg, v_ap
    FROM public.fn_dgdv_can_mau_ngay(p_ngay, p_id_chi_nhanh) t;
  v_ksc := COALESCE(v_ksc, 0);
  v_nhap := GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) - v_ksc - COALESCE(v_cuoi, 0))::integer;
  v_ap := COALESCE(v_ap, false);

  -- Ngày trước mốc: KHÔNG ghi 0 đè số dòng 1–2 nhập tay (giữ giá trị hiện có của dòng).
  UPDATE public.fp_farm_du_bao_sl_dong_thung
     SET tong_buong_nhap_thuc_te = v_nhap,
         sl_buong_ton_dau_ngay = COALESCE(v_dau, 0),
         sl_buong_ton_cuoi_ngay = COALESCE(v_cuoi, 0),
         so_buong_ksc = v_ksc,
         so_buong_can_mau = CASE WHEN v_ap THEN COALESCE(v_buong, 0)::integer ELSE so_buong_can_mau END,
         tong_can_nang_mau = CASE WHEN v_ap THEN COALESCE(v_kg, 0) ELSE tong_can_nang_mau END
   WHERE ngay = p_ngay
     AND id_chi_nhanh = p_id_chi_nhanh
     AND ((tong_buong_nhap_thuc_te, sl_buong_ton_dau_ngay, sl_buong_ton_cuoi_ngay, so_buong_ksc)
          IS DISTINCT FROM (v_nhap, COALESCE(v_dau, 0), COALESCE(v_cuoi, 0), v_ksc)
          OR (v_ap AND (so_buong_can_mau, tong_can_nang_mau) IS DISTINCT FROM (COALESCE(v_buong, 0)::integer, COALESCE(v_kg, 0))));
END;
$$;

REVOKE ALL ON FUNCTION public.fn_du_bao_dong_bo(date, bigint) FROM PUBLIC, anon, authenticated;

-- B4) Báo cáo sơ chế đổi thu hoạch / KSC (nhập tay) cũng đồng bộ dự báo -----------------------
CREATE OR REPLACE FUNCTION public.fn_du_bao_trg_bcsc_ct_ton()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
BEGIN
  -- Mỗi sự kiện chỉ có transition table của nó (INSERT không có old_rows) → tách nhánh theo TG_OP.
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    FOR r IN
      SELECT DISTINCT b.ngay, b.id_chi_nhanh
      FROM new_rows x JOIN public.fp_farm_bao_cao_so_che b ON b.id = x.id_bao_cao
      WHERE x.ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'sl_buong_ton_cuoi_ngay',
                              'tong_buong_thu_hoach', 'tong_buong_khong_so_che')
    LOOP
      PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
    END LOOP;
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    FOR r IN
      SELECT DISTINCT b.ngay, b.id_chi_nhanh
      FROM old_rows x JOIN public.fp_farm_bao_cao_so_che b ON b.id = x.id_bao_cao
      WHERE x.ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'sl_buong_ton_cuoi_ngay',
                              'tong_buong_thu_hoach', 'tong_buong_khong_so_che')
    LOOP
      PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_du_bao_trg_bcsc_ct_ton() FROM PUBLIC, anon, authenticated;

-- C) Sửa dữ liệu tồn âm -----------------------------------------------------------------------
DO $$
DECLARE
  r record;
  v_thieu numeric;
  v_vong integer := 0;
  v_cuoi_moi numeric;
BEGIN
  LOOP
    SELECT b.id, b.ngay, b.id_chi_nhanh, ct.gia_tri AS cuoi INTO r
      FROM public.fp_farm_bao_cao_so_che b
      JOIN public.fp_farm_bao_cao_so_che_ct ct
        ON ct.id_bao_cao = b.id AND ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
     WHERE ct.gia_tri < 0
     ORDER BY b.ngay, b.id_chi_nhanh
     LIMIT 1;
    EXIT WHEN NOT FOUND;

    v_vong := v_vong + 1;
    IF v_vong > 500 THEN
      RAISE EXCEPTION 'Sửa tồn âm quá 500 vòng — dừng để soát';
    END IF;

    v_thieu := -r.cuoi;
    IF public.fn_dgdv_co_phieu_ngay(r.ngay, r.id_chi_nhanh) THEN
      UPDATE public.fp_farm_bao_cao_so_che_ct
         SET gia_tri = gia_tri - v_thieu
       WHERE id_bao_cao = r.id AND ma_chi_tieu = 'tong_buong_so_che';
    ELSE
      UPDATE public.fp_farm_bao_cao_so_che_ct
         SET gia_tri = gia_tri + v_thieu
       WHERE id_bao_cao = r.id AND ma_chi_tieu = 'tong_buong_thu_hoach';
    END IF;

    SELECT ct.gia_tri INTO v_cuoi_moi
      FROM public.fp_farm_bao_cao_so_che_ct ct
     WHERE ct.id_bao_cao = r.id AND ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay';
    IF v_cuoi_moi IS DISTINCT FROM 0 THEN
      RAISE EXCEPTION 'Phiếu % (%) sau khi sửa tồn cuối = %, không phải 0', r.id, r.ngay, v_cuoi_moi;
    END IF;
    RAISE NOTICE 'Phiếu % ngày % chi nhánh %: bù % buồng', r.id, r.ngay, r.id_chi_nhanh, v_thieu;
  END LOOP;

  IF EXISTS (SELECT 1 FROM public.fp_farm_bao_cao_so_che_ct
              WHERE ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'sl_buong_ton_cuoi_ngay', 'tong_buong_so_che') AND gia_tri < 0) THEN
    RAISE EXCEPTION 'Còn phiếu Báo cáo sơ chế có tồn / sơ chế âm sau khi sửa';
  END IF;
END $$;

-- Đồng bộ lại MỌI dự báo theo nguồn thu / KSC mới ------------------------------------------------
SELECT public.fn_du_bao_dong_bo(x.ngay, x.id_chi_nhanh)
  FROM (SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_du_bao_sl_dong_thung) x;

COMMIT;
