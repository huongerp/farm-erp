-- =============================================================================
-- 100-bcsc-ton-dau-noi-chuoi-du-bao-tru-ksc.sql — phản hồi nhà sơ chế 24/11/2026
--
-- A) Dự báo SL đóng thùng — dòng 10 «Tổng số buồng nhập (thực tế)»: buồng không sơ chế (KSC) không
--    làm nên phải TRỪ, không cộng (migration 076 cộng nhầm):
--       tong_buong_nhap_thuc_te = max(0, tồn đầu + Tổng thu ĐGĐV − KSC − tồn cuối)
--    Thay thân 2 hàm của 091 (giữ nguyên phần cân mẫu), đồng bộ lại MỌI dự báo.
--
-- B) Báo cáo sơ chế — mục 6 «Số buồng tồn đầu ngày» = mục 10 (tồn cuối) của phiếu LIỀN TRƯỚC cùng chi
--    nhánh (bỏ qua ngày trống), chỉ từ MỐC 02/11/2026 (fn_bcsc_ton_dau_moc — trước đó chưa có ĐGĐV,
--    thu hoạch = 0, tồn cuối âm). Phiếu đầu tiên của chi nhánh từ mốc giữ tồn đầu nhập tay (điểm neo).
--    - fn_bcsc_ton_dau_ngay(ngày, chi nhánh): RPC cho form (ô khoá) + dùng trong trigger.
--    - trg_bcsc_ton_dau_khoa (BEFORE, mỗi dòng ct): ghi đè gia_tri dòng tồn đầu.
--    - fn_bcsc_noi_ton_tu: nối chuỗi về phía sau (vòng lặp theo ngày, cờ giao dịch app.bcsc_noi_ton
--      chặn đệ quy) → mỗi phiếu sau tính lại tồn đầu → trg_bcsc_ton_cuoi_* (096) tính lại tồn cuối →
--      trg_du_bao_ton_* (060) đồng bộ Dự báo.
--    - trg_bcsc_xu_noi_ton_* : lan truyền khi tồn cuối đổi / xoá phiếu / đổi ngày–chi nhánh. Tên «xu»
--      để chạy SAU trg_bcsc_ton_cuoi_* (trigger cùng loại chạy theo thứ tự chữ cái).
--      ct DELETE KHÔNG lan: lưu phiếu = xoá ct rồi chèn lại (2 request), lần chèn sẽ lan.
--    Backfill: tính lại mọi phiếu từ mốc (kể cả phiếu đã khoá) — Công chốt 24/11/2026.
--    Giá trị cũ tra ở fp_var_nhat_ky_thay_doi.
--
-- Chạy lại được (CREATE OR REPLACE / DROP TRIGGER IF EXISTS / backfill idempotent).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/100-bcsc-ton-dau-noi-chuoi-du-bao-tru-ksc.sql
-- =============================================================================
BEGIN;

-- A1) Trigger khoá số khi lưu dự báo (thân 091, dòng 10 đổi + KSC → − KSC) ------------------
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
  SELECT t.tong_thu, t.ksc INTO v_thu, v_ksc FROM public.fn_dgdv_tong_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
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

-- A2) Đồng bộ dự báo (thân 091, dòng 10 đổi + KSC → − KSC) ----------------------------------
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
    FROM public.fn_dgdv_tong_ngay(p_ngay, p_id_chi_nhanh) t;
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

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_thuc_te IS
  'Dòng 10 = max(0, tồn đầu + Tổng thu ĐGĐV − KSC − tồn cuối) — DB trigger ghi (migration 100)';

-- B0) Mốc áp dụng — hằng DUY NHẤT của chuỗi tồn. Trước mốc chưa có Đánh giá đầu vào (thu hoạch = 0)
--     → tồn cuối các ngày đó âm, không nối được. Phiếu đầu tiên của chi nhánh từ mốc trở đi giữ tồn
--     đầu nhập tay (điểm neo); phiếu trước mốc không bị đụng tới.
CREATE OR REPLACE FUNCTION public.fn_bcsc_ton_dau_moc()
    RETURNS date
    LANGUAGE sql IMMUTABLE
    AS $$ SELECT DATE '2026-11-02' $$;

REVOKE ALL ON FUNCTION public.fn_bcsc_ton_dau_moc() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_bcsc_ton_dau_moc() TO authenticated;

-- B1) Tồn đầu theo phiếu liền trước -------------------------------------------------------
-- Phiếu gần nhất trước ngày (và từ mốc trở đi), cùng chi nhánh, ĐÃ CÓ dòng tồn cuối (bỏ qua phiếu
-- đang ở khe xoá-ct-rồi-chèn khi lưu). Không có → co_phieu_truoc = false, ô tồn đầu nhập tay.
CREATE OR REPLACE FUNCTION public.fn_bcsc_ton_dau_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS TABLE (co_phieu_truoc boolean, ton_dau numeric, ngay_truoc date)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH truoc AS (
    SELECT b.ngay, ct.gia_tri
      FROM public.fp_farm_bao_cao_so_che b
      JOIN public.fp_farm_bao_cao_so_che_ct ct
        ON ct.id_bao_cao = b.id AND ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
     WHERE b.id_chi_nhanh = p_id_chi_nhanh
       AND b.ngay < p_ngay
       AND b.ngay >= public.fn_bcsc_ton_dau_moc()
     ORDER BY b.ngay DESC
     LIMIT 1
  )
  SELECT (t.ngay IS NOT NULL), COALESCE(t.gia_tri, 0), t.ngay
    FROM (SELECT 1) one
    LEFT JOIN truoc t ON true;
$$;
COMMENT ON FUNCTION public.fn_bcsc_ton_dau_ngay(date, bigint) IS
  'Báo cáo sơ chế: tồn đầu ngày = tồn cuối của phiếu liền trước cùng chi nhánh (migration 100); '
  'co_phieu_truoc = false → phiếu đầu tiên, tồn đầu nhập tay';

REVOKE ALL ON FUNCTION public.fn_bcsc_ton_dau_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_bcsc_ton_dau_ngay(date, bigint) TO authenticated;

-- B2) Khoá ô tồn đầu: ghi đè khi có phiếu trước ---------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_bcsc_trg_ton_dau_khoa()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ngay date;
  v_cn bigint;
  v_co boolean;
  v_dau numeric;
BEGIN
  IF NEW.ma_chi_tieu <> 'sl_buong_ton_dau_ngay' THEN
    RETURN NEW;
  END IF;

  SELECT b.ngay, b.id_chi_nhanh INTO v_ngay, v_cn FROM public.fp_farm_bao_cao_so_che b WHERE b.id = NEW.id_bao_cao;
  IF v_ngay IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT t.co_phieu_truoc, t.ton_dau INTO v_co, v_dau FROM public.fn_bcsc_ton_dau_ngay(v_ngay, v_cn) t;
  IF COALESCE(v_co, false) THEN
    NEW.gia_tri := v_dau;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_bcsc_trg_ton_dau_khoa() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bcsc_ton_dau_khoa ON public.fp_farm_bao_cao_so_che_ct;
CREATE TRIGGER trg_bcsc_ton_dau_khoa
  BEFORE INSERT OR UPDATE ON public.fp_farm_bao_cao_so_che_ct
  FOR EACH ROW EXECUTE FUNCTION public.fn_bcsc_trg_ton_dau_khoa();

-- B3) Nối chuỗi về phía sau ---------------------------------------------------------------
-- Các phiếu ngay > p_tu_ngay của chi nhánh, theo thứ tự ngày: ghi tồn đầu = tồn cuối phiếu trước.
-- Mỗi UPDATE bắn trg_bcsc_ton_cuoi_upd (tính lại tồn cuối) TRƯỚC khi sang phiếu kế → phiếu kế đọc
-- được tồn cuối mới. Cờ app.bcsc_noi_ton chặn trg_bcsc_xu_noi_ton_* gọi lồng → độ sâu cố định.
-- p_het = false: dừng ở phiếu đầu tiên không đổi (phía sau chỉ phụ thuộc tồn cuối phiếu đó).
-- p_het = true: đi hết (xoá phiếu / đổi ngày–chi nhánh / backfill).
CREATE OR REPLACE FUNCTION public.fn_bcsc_noi_ton_tu(p_id_chi_nhanh bigint, p_tu_ngay date, p_het boolean DEFAULT false)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
  v_co boolean;
  v_dau numeric;
  v_doi integer;
  v_co_cu text;
BEGIN
  IF p_id_chi_nhanh IS NULL OR p_tu_ngay IS NULL THEN
    RETURN;
  END IF;

  v_co_cu := COALESCE(current_setting('app.bcsc_noi_ton', true), '');
  PERFORM set_config('app.bcsc_noi_ton', 'on', true);

  FOR r IN
    SELECT b.id, b.ngay
      FROM public.fp_farm_bao_cao_so_che b
     WHERE b.id_chi_nhanh = p_id_chi_nhanh
       AND b.ngay > p_tu_ngay
     ORDER BY b.ngay
  LOOP
    SELECT t.co_phieu_truoc, t.ton_dau INTO v_co, v_dau FROM public.fn_bcsc_ton_dau_ngay(r.ngay, p_id_chi_nhanh) t;
    v_doi := 0;
    IF COALESCE(v_co, false) THEN
      UPDATE public.fp_farm_bao_cao_so_che_ct ct
         SET gia_tri = v_dau
       WHERE ct.id_bao_cao = r.id
         AND ct.ma_chi_tieu = 'sl_buong_ton_dau_ngay'
         AND ct.gia_tri IS DISTINCT FROM v_dau;
      GET DIAGNOSTICS v_doi = ROW_COUNT;
    END IF;
    EXIT WHEN v_doi = 0 AND NOT p_het;
  END LOOP;

  PERFORM set_config('app.bcsc_noi_ton', v_co_cu, true);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_bcsc_noi_ton_tu(bigint, date, boolean) FROM PUBLIC, anon, authenticated;

-- B4) Lan truyền ---------------------------------------------------------------------------
-- 4a) ct INSERT / UPDATE: dòng tồn cuối xuất hiện → nối từ ngày của phiếu đó.
CREATE OR REPLACE FUNCTION public.fn_bcsc_trg_xu_noi_ton_ct()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
BEGIN
  IF current_setting('app.bcsc_noi_ton', true) = 'on' THEN
    RETURN NULL;
  END IF;

  FOR r IN
    SELECT b.id_chi_nhanh, MIN(b.ngay) AS ngay
      FROM new_rows x
      JOIN public.fp_farm_bao_cao_so_che b ON b.id = x.id_bao_cao
     WHERE x.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'
     GROUP BY b.id_chi_nhanh
  LOOP
    PERFORM public.fn_bcsc_noi_ton_tu(r.id_chi_nhanh, r.ngay, false);
  END LOOP;
  RETURN NULL;
END;
$$;

-- 4b) Xoá phiếu: phiếu sau nhận phiếu trước nữa làm «phiếu liền trước» → đi hết từ ngày bị xoá.
CREATE OR REPLACE FUNCTION public.fn_bcsc_trg_xu_noi_ton_xoa()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
BEGIN
  IF current_setting('app.bcsc_noi_ton', true) = 'on' THEN
    RETURN NULL;
  END IF;

  FOR r IN SELECT x.id_chi_nhanh, MIN(x.ngay) AS ngay FROM old_rows x GROUP BY x.id_chi_nhanh LOOP
    PERFORM public.fn_bcsc_noi_ton_tu(r.id_chi_nhanh, r.ngay, true);
  END LOOP;
  RETURN NULL;
END;
$$;

-- 4c) Đổi ngày / chi nhánh của phiếu: nối lại chuỗi cũ (từ ngày cũ) và chuỗi mới (gồm cả phiếu này).
CREATE OR REPLACE FUNCTION public.fn_bcsc_trg_xu_noi_ton_doi()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_setting('app.bcsc_noi_ton', true) = 'on' THEN
    RETURN NULL;
  END IF;
  IF (NEW.ngay, NEW.id_chi_nhanh) IS NOT DISTINCT FROM (OLD.ngay, OLD.id_chi_nhanh) THEN
    RETURN NULL;
  END IF;

  PERFORM public.fn_bcsc_noi_ton_tu(OLD.id_chi_nhanh, OLD.ngay, true);
  PERFORM public.fn_bcsc_noi_ton_tu(NEW.id_chi_nhanh, NEW.ngay - 1, true);
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_bcsc_trg_xu_noi_ton_ct() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_bcsc_trg_xu_noi_ton_xoa() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_bcsc_trg_xu_noi_ton_doi() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_bcsc_xu_noi_ton_ins ON public.fp_farm_bao_cao_so_che_ct;
CREATE TRIGGER trg_bcsc_xu_noi_ton_ins
  AFTER INSERT ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bcsc_trg_xu_noi_ton_ct();

DROP TRIGGER IF EXISTS trg_bcsc_xu_noi_ton_upd ON public.fp_farm_bao_cao_so_che_ct;
CREATE TRIGGER trg_bcsc_xu_noi_ton_upd
  AFTER UPDATE ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bcsc_trg_xu_noi_ton_ct();

DROP TRIGGER IF EXISTS trg_bcsc_xu_noi_ton_xoa ON public.fp_farm_bao_cao_so_che;
CREATE TRIGGER trg_bcsc_xu_noi_ton_xoa
  AFTER DELETE ON public.fp_farm_bao_cao_so_che
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_bcsc_trg_xu_noi_ton_xoa();

DROP TRIGGER IF EXISTS trg_bcsc_xu_noi_ton_doi ON public.fp_farm_bao_cao_so_che;
CREATE TRIGGER trg_bcsc_xu_noi_ton_doi
  AFTER UPDATE OF ngay, id_chi_nhanh ON public.fp_farm_bao_cao_so_che
  FOR EACH ROW EXECUTE FUNCTION public.fn_bcsc_trg_xu_noi_ton_doi();

-- B5) Backfill: mỗi chi nhánh nối từ phiếu đầu tiên kể từ mốc (phiếu đó giữ tồn đầu nhập tay) ----
SELECT public.fn_bcsc_noi_ton_tu(x.id_chi_nhanh, x.ngay_dau, true)
  FROM (SELECT id_chi_nhanh, MIN(ngay) AS ngay_dau
          FROM public.fp_farm_bao_cao_so_che
         WHERE ngay >= public.fn_bcsc_ton_dau_moc()
         GROUP BY id_chi_nhanh) x;

-- A3) Đồng bộ lại MỌI dự báo theo công thức mới ---------------------------------------------
SELECT public.fn_du_bao_dong_bo(x.ngay, x.id_chi_nhanh)
  FROM (SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_du_bao_sl_dong_thung) x;

-- Kiểm tra sau backfill ----------------------------------------------------------------------
DO $$
DECLARE
  v_lech integer;
BEGIN
  SELECT count(*) INTO v_lech
    FROM public.fp_farm_bao_cao_so_che b
    JOIN public.fp_farm_bao_cao_so_che_ct ct ON ct.id_bao_cao = b.id AND ct.ma_chi_tieu = 'sl_buong_ton_dau_ngay'
    CROSS JOIN LATERAL public.fn_bcsc_ton_dau_ngay(b.ngay, b.id_chi_nhanh) t
   WHERE t.co_phieu_truoc AND ct.gia_tri IS DISTINCT FROM t.ton_dau;
  IF v_lech > 0 THEN
    RAISE EXCEPTION '% phiếu Báo cáo sơ chế còn lệch tồn đầu ≠ tồn cuối phiếu trước sau backfill', v_lech;
  END IF;

  SELECT count(*) INTO v_lech
    FROM public.fp_farm_du_bao_sl_dong_thung d
    CROSS JOIN LATERAL public.fn_dgdv_tong_ngay(d.ngay, d.id_chi_nhanh) g
    CROSS JOIN LATERAL public.fn_du_bao_ton_ngay(d.ngay, d.id_chi_nhanh) t
   WHERE d.tong_buong_nhap_thuc_te IS DISTINCT FROM
         GREATEST(0, COALESCE(t.ton_dau, 0) + COALESCE(g.tong_thu, 0) - COALESCE(g.ksc, 0) - COALESCE(t.ton_cuoi, 0))::integer;
  IF v_lech > 0 THEN
    RAISE EXCEPTION '% dự báo còn lệch dòng 10 = tồn đầu + thu − KSC − tồn cuối sau backfill', v_lech;
  END IF;
END $$;

COMMIT;
