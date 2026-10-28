-- =============================================================================
-- 057-dgdv-phieu-theo-chuyen.sql — Đánh giá đầu vào: 1 phiếu = 1 CHUYẾN (ngày, chi nhánh, số chuyến)
--
-- Trước: 1 phiếu = 1 tuần ISO × chi nhánh (UNIQUE nam, tuan, id_chi_nhanh), lưới lô × dây × 7 ngày.
-- Sau:   1 phiếu = (ngay, id_chi_nhanh, chuyen 1, 2, 3…); một ngày nhiều chuyến; lưới lô × dây của
--        MỘT ngày (ngày của phiếu). App tự cộng theo ngày / tuần / tháng.
--
-- 1) Tuần FARM (thay ISO trong module này): tuần T2–CN; nam = năm của Chủ nhật cuối tuần; tuần 1 =
--    tuần chứa 01/01/nam. fn_dgdv_tuan_farm / fn_dgdv_ngay_dau_tuan_farm cùng công thức với
--    features/quan-ly-nha-so-che/danh-gia-dau-vao/core/tuan.ts. fp_farm_dgdv.nam / tuan nay là tuần farm
--    của `ngay`, do trigger tự tính (app không gửi nữa).
-- 2) Cột dây: nguồn là tuần thu hoạch farm (th_nam, th_tuan). 4 cột ngày cũ do trigger tự điền
--    (thu hoạch = T2–CN tuần đó, chích bắp = tuần −9 theo bảng dự thu farm; trước đây app gợi ý +10 — SAI).
-- 3) Trigger kiểm: ô lưới / đứt dây phải có ngay = phiếu.ngay. Đổi ngày phiếu → dời ngày của mọi ô /
--    đứt dây theo (cả chuyến chuyển sang ngày khác) thay vì chặn như bản tuần.
-- 4) fn_dgdv_tong_ngay cộng MỌI chuyến có phiếu.ngay = ngày. Trigger đồng bộ Báo cáo sơ chế / Dự báo
--    chạy theo ngay của phiếu (đổi ngày / chi nhánh → đồng bộ cả cũ lẫn mới). fn_dgdv_dong_bo_tuan bỏ.
--    Trigger ô (fn_dgdv_trg_dong_bo_o, 052 mục 6a) GIỮ NGUYÊN: nó đồng bộ theo ngay của dòng — luôn bằng
--    ngày phiếu (trigger kiểm), và nhờ vậy ca dời ngày phiếu vẫn đồng bộ được ngày cũ.
-- 5) CHUYỂN ĐỔI dữ liệu cũ: mỗi (phiếu tuần × ngày có ô hoặc đứt dây) → 1 phiếu mới chuyen = 1 (cùng chi
--    nhánh, ghi chú, trạng thái, người tạo, thời điểm tạo), chép TẤT CẢ dây + lô của phiếu tuần vào mỗi
--    phiếu ngày (giữ nguyên hình lưới từng ngày như bản tuần), chép đứt dây + ô của đúng ngày đó. Phiếu tuần
--    không có số nào → 1 phiếu ngày thứ Hai của tuần (giữ khung dây / lô). Xoá phiếu tuần cũ.
--    Kiểm trước / sau: Σ so_luong, Σ so_luong_loi, Σ dut_day toàn bảng và tổng từng (ngày, chi nhánh) —
--    lệch là RAISE EXCEPTION (rollback cả file).
-- 6) View (security_invoker): v_fp_farm_dgdv_tong_chuyen (1 dòng / phiếu, cho danh sách) và
--    v_fp_farm_dgdv_tong_ngay_day (cộng mọi chuyến theo ngày × chi nhánh × lô × dây).
-- 7) rpc_dgdv_import: tìm / tạo phiếu theo (ngay, id_chi_nhanh, chuyen) — `chuyen` trong mỗi dòng.
--
-- KHÔNG còn chạy được 055-dgdv-seed-mau.sql (nó chèn phiếu theo nam / tuan, không có ngày).
--
-- Chạy lại được nhiều lần (IF NOT EXISTS / CREATE OR REPLACE; chuyển đổi chỉ chạm phiếu chưa có ngày).
-- Trước khi chạy: bash scripts/db-backup.sh truoc-057
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/057-dgdv-phieu-theo-chuyen.sql
-- =============================================================================

BEGIN;

-- 1) Tuần farm --------------------------------------------------------------------
-- Thứ Hai của tuần farm (nam, tuan) = thứ Hai của tuần chứa 01/01/nam + (tuan - 1) tuần.
CREATE OR REPLACE FUNCTION public.fn_dgdv_ngay_dau_tuan_farm(p_nam integer, p_tuan integer)
    RETURNS date
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT make_date(p_nam, 1, 1)
         - (extract(isodow FROM make_date(p_nam, 1, 1))::integer - 1)
         + (p_tuan - 1) * 7;
$$;

-- (nam, tuan) farm của ngày: nam = năm của Chủ nhật cuối tuần; tuan đếm từ tuần chứa 01/01/nam.
CREATE OR REPLACE FUNCTION public.fn_dgdv_tuan_farm(p_ngay date)
    RETURNS TABLE (nam integer, tuan integer)
    LANGUAGE sql IMMUTABLE
    SET search_path TO 'public'
    AS $$
  SELECT n.nam, (x.thu2 - public.fn_dgdv_ngay_dau_tuan_farm(n.nam, 1)) / 7 + 1
  FROM (SELECT p_ngay - (extract(isodow FROM p_ngay)::integer - 1) AS thu2) x
  CROSS JOIN LATERAL (SELECT extract(year FROM x.thu2 + 6)::integer AS nam) n;
$$;

COMMENT ON FUNCTION public.fn_dgdv_ngay_dau_tuan_farm(integer, integer) IS
  'Đánh giá đầu vào: thứ Hai của tuần farm (nam, tuan) — tuần 1 = tuần T2–CN chứa 01/01/nam';
COMMENT ON FUNCTION public.fn_dgdv_tuan_farm(date) IS
  'Đánh giá đầu vào: (nam, tuan) farm của ngày — nam = năm của Chủ nhật cuối tuần';

REVOKE ALL ON FUNCTION public.fn_dgdv_ngay_dau_tuan_farm(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dgdv_ngay_dau_tuan_farm(integer, integer) TO authenticated;
REVOKE ALL ON FUNCTION public.fn_dgdv_tuan_farm(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dgdv_tuan_farm(date) TO authenticated;

-- Tự kiểm công thức với các mốc của bảng dự thu farm (khớp core/tuan.test.ts).
DO $$
DECLARE
  r record;
  v record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
      ('2025-12-29'::date, 2026, 1), ('2026-08-24'::date, 2026, 35), ('2026-10-26'::date, 2026, 44),
      ('2026-12-27'::date, 2026, 52), ('2026-12-28'::date, 2027, 1), ('2027-01-03'::date, 2027, 1),
      ('2027-01-04'::date, 2027, 2)) AS t(ngay, nam, tuan)
  LOOP
    SELECT * INTO v FROM public.fn_dgdv_tuan_farm(r.ngay);
    IF (v.nam, v.tuan) IS DISTINCT FROM (r.nam, r.tuan) THEN
      RAISE EXCEPTION 'fn_dgdv_tuan_farm(%) = %/% — kỳ vọng %/%', r.ngay, v.tuan, v.nam, r.tuan, r.nam;
    END IF;
  END LOOP;
END $$;

-- 2) Cột mới --------------------------------------------------------------------------
ALTER TABLE public.fp_farm_dgdv ADD COLUMN IF NOT EXISTS ngay date;
ALTER TABLE public.fp_farm_dgdv ADD COLUMN IF NOT EXISTS chuyen smallint DEFAULT 1 NOT NULL
  CONSTRAINT fp_farm_dgdv_chuyen_check CHECK (chuyen >= 1);
ALTER TABLE public.fp_farm_dgdv_cot ADD COLUMN IF NOT EXISTS th_nam integer;
ALTER TABLE public.fp_farm_dgdv_cot ADD COLUMN IF NOT EXISTS th_tuan integer;

COMMENT ON TABLE public.fp_farm_dgdv IS 'Đánh giá đầu vào — phiếu = 1 chuyến (ngay, id_chi_nhanh, chuyen)';
COMMENT ON COLUMN public.fp_farm_dgdv.ngay IS 'Ngày của chuyến; mọi ô / đứt dây của phiếu có đúng ngày này';
COMMENT ON COLUMN public.fp_farm_dgdv.chuyen IS 'Số chuyến trong ngày của chi nhánh (1, 2, 3…)';
COMMENT ON COLUMN public.fp_farm_dgdv.nam IS 'Năm farm của ngay (năm của Chủ nhật cuối tuần) — trigger tự tính';
COMMENT ON COLUMN public.fp_farm_dgdv.tuan IS 'Tuần farm của ngay (tuần 1 chứa 01/01) — trigger tự tính';
COMMENT ON TABLE public.fp_farm_dgdv_cot IS 'Đánh giá đầu vào — cột dây màu của phiếu chuyến';
COMMENT ON COLUMN public.fp_farm_dgdv_cot.th_nam IS 'Năm farm của tuần thu hoạch';
COMMENT ON COLUMN public.fp_farm_dgdv_cot.th_tuan IS 'Tuần farm thu hoạch (nguồn) — 4 cột ngày do trigger tự điền';
COMMENT ON COLUMN public.fp_farm_dgdv_cot.thu_hoach_tu IS 'T2 của tuần thu hoạch (th_nam, th_tuan) — trigger tự điền, chỉ đọc';
COMMENT ON COLUMN public.fp_farm_dgdv_cot.chich_bap_tu IS 'T2 của tuần chích bắp = tuần thu hoạch − 9 — trigger tự điền, chỉ đọc';

-- Khoá mới: (ngay, chi nhánh, chuyến). Phiếu cũ chưa có ngày (NULL) không vướng khoá này.
ALTER TABLE public.fp_farm_dgdv DROP CONSTRAINT IF EXISTS fp_farm_dgdv_nam_tuan_cn_key;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fp_farm_dgdv_ngay_cn_chuyen_key') THEN
    ALTER TABLE public.fp_farm_dgdv
      ADD CONSTRAINT fp_farm_dgdv_ngay_cn_chuyen_key UNIQUE (ngay, id_chi_nhanh, chuyen);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_fp_farm_dgdv_cn_ngay ON public.fp_farm_dgdv USING btree (id_chi_nhanh, ngay);

-- 3) Trigger kiểm ----------------------------------------------------------------------
-- 3a) Phiếu: nam / tuan = tuần farm của ngay (không tin giá trị gửi lên); người tạo lấy từ JWT.
--     Đổi ngày được — trigger 3d dời ngày của ô / đứt dây theo.
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_kiem_phieu()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.ngay IS NULL THEN
    RAISE EXCEPTION 'Phiếu Đánh giá đầu vào phải có ngày' USING ERRCODE = '23502';
  END IF;
  SELECT t.nam, t.tuan INTO NEW.nam, NEW.tuan FROM public.fn_dgdv_tuan_farm(NEW.ngay) t;

  IF TG_OP = 'INSERT' THEN
    NEW.id_nguoi_tao := COALESCE(public.nhan_vien_hien_tai_id(), NEW.id_nguoi_tao);
  END IF;
  RETURN NEW;
END;
$$;

-- 3b) fn_dgdv_trg_chan_doi_phieu (052) giữ nguyên: cột dây / lô vẫn không được chuyển sang phiếu khác.

-- 3c) Đứt dây / ô lưới: ngày phải = ngày phiếu; ô lưới: cột dây cùng phiếu với lô.
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_kiem_ngay()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_phieu bigint;
  v_ngay date;
BEGIN
  SELECT p.id, p.ngay INTO v_phieu, v_ngay
  FROM public.fp_farm_dgdv_lo l
  JOIN public.fp_farm_dgdv p ON p.id = l.id_phieu
  WHERE l.id = NEW.id_phieu_lo;

  IF v_phieu IS NULL THEN
    RETURN NEW; -- FK sẽ báo lỗi lô không tồn tại
  END IF;

  IF NEW.ngay IS DISTINCT FROM v_ngay THEN
    RAISE EXCEPTION 'Ngày % khác ngày của phiếu (%)',
      to_char(NEW.ngay, 'DD/MM/YYYY'), to_char(v_ngay, 'DD/MM/YYYY')
      USING ERRCODE = '23514';
  END IF;

  -- IF lồng: NEW.id_cot chỉ được đụng tới khi chạy trên _dong (_lo_ngay không có cột này).
  IF TG_TABLE_NAME = 'fp_farm_dgdv_dong' THEN
    IF NOT EXISTS (SELECT 1 FROM public.fp_farm_dgdv_cot c WHERE c.id = NEW.id_cot AND c.id_phieu = v_phieu) THEN
      RAISE EXCEPTION 'Cột dây % không thuộc phiếu của lô', NEW.id_cot USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3d) Đổi ngày phiếu → dời ngày mọi ô / đứt dây của phiếu (chạy SAU khi phiếu đã mang ngày mới nên
--     trigger 3c ở bảng con chấp nhận). SECURITY DEFINER: không để RLS bảng con làm sót dòng.
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_doi_ngay()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.fp_farm_dgdv_dong d SET ngay = NEW.ngay
    FROM public.fp_farm_dgdv_lo l
   WHERE d.id_phieu_lo = l.id AND l.id_phieu = NEW.id AND d.ngay IS DISTINCT FROM NEW.ngay;
  UPDATE public.fp_farm_dgdv_lo_ngay n SET ngay = NEW.ngay
    FROM public.fp_farm_dgdv_lo l
   WHERE n.id_phieu_lo = l.id AND l.id_phieu = NEW.id AND n.ngay IS DISTINCT FROM NEW.ngay;
  RETURN NULL;
END;
$$;

-- 3e) Cột dây: tuần thu hoạch phải có trong năm farm; tự điền 4 cột ngày (để chỗ đọc cũ không vỡ).
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_cot_tuan_thu_hoach()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dau date;
  v_kt record;
BEGIN
  IF NEW.th_nam IS NULL OR NEW.th_tuan IS NULL THEN
    RETURN NEW; -- NOT NULL sẽ báo lỗi
  END IF;
  v_dau := public.fn_dgdv_ngay_dau_tuan_farm(NEW.th_nam, NEW.th_tuan);
  SELECT * INTO v_kt FROM public.fn_dgdv_tuan_farm(v_dau);
  IF NEW.th_tuan < 1 OR (v_kt.nam, v_kt.tuan) IS DISTINCT FROM (NEW.th_nam, NEW.th_tuan) THEN
    RAISE EXCEPTION 'Năm % không có tuần thu hoạch %', NEW.th_nam, NEW.th_tuan USING ERRCODE = '22023';
  END IF;
  NEW.thu_hoach_tu := v_dau;
  NEW.thu_hoach_den := v_dau + 6;
  NEW.chich_bap_tu := v_dau - 63;
  NEW.chich_bap_den := v_dau - 57;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_dgdv_trg_kiem_phieu() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_dgdv_trg_kiem_ngay() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_dgdv_trg_doi_ngay() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_dgdv_trg_cot_tuan_thu_hoach() FROM PUBLIC, anon;

-- trg_dgdv_kiem_phieu / trg_dgdv_kiem_ngay (052) đã trỏ đúng hàm — chỉ thay thân hàm ở trên.
-- Tên trg_dgdv_doi_ngay < trg_dgdv_dong_bo_upd → chạy trước trigger đồng bộ phiếu.
CREATE OR REPLACE TRIGGER trg_dgdv_doi_ngay AFTER UPDATE OF ngay ON public.fp_farm_dgdv
  FOR EACH ROW WHEN (OLD.ngay IS DISTINCT FROM NEW.ngay)
  EXECUTE FUNCTION public.fn_dgdv_trg_doi_ngay();
CREATE OR REPLACE TRIGGER trg_dgdv_cot_tuan_th BEFORE INSERT OR UPDATE ON public.fp_farm_dgdv_cot
  FOR EACH ROW EXECUTE FUNCTION public.fn_dgdv_trg_cot_tuan_thu_hoach();

-- 4) Tổng theo (ngày, chi nhánh): cộng MỌI chuyến -------------------------------------
-- Ô / đứt dây luôn cùng ngày phiếu (trigger 3c) → chỉ lọc theo phiếu.ngay. Tính cả phiếu đã khoá.
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
           COALESCE(SUM(d.so_luong_loi), 0)::bigint AS so_luong_loi
    FROM public.fp_farm_dgdv_dong d JOIN l ON l.id = d.id_phieu_lo
  ),
  n AS (
    SELECT COALESCE(SUM(n.dut_day), 0)::bigint AS dut_day
    FROM public.fp_farm_dgdv_lo_ngay n JOIN l ON l.id = n.id_phieu_lo
  )
  SELECT d.so_luong + n.dut_day, d.so_luong_loi FROM d CROSS JOIN n;
$$;

COMMENT ON FUNCTION public.fn_dgdv_tong_ngay(date, bigint) IS
  'Đánh giá đầu vào: tong_thu = Σ số lượng + Σ đứt dây; ksc = Σ số lượng lỗi của MỌI chuyến trong ngày + chi nhánh (0 nếu không có phiếu)';

REVOKE ALL ON FUNCTION public.fn_dgdv_tong_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dgdv_tong_ngay(date, bigint) TO authenticated;

-- 5) Trigger đồng bộ theo ngày của phiếu -------------------------------------------------
-- 5a) Xoá lô / cột dây: ô con đã bị cascade → đồng bộ ngày của phiếu.
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_dong_bo_con_phieu()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_dgdv_dong_bo_ngay(p.ngay, p.id_chi_nhanh)
  FROM public.fp_farm_dgdv p
  WHERE p.id IN (SELECT DISTINCT o.id_phieu FROM old_rows o);
  RETURN NULL;
END;
$$;

-- 5b) Xoá phiếu → đồng bộ ngày + chi nhánh của phiếu (sau cascade). INSERT không đổi tổng.
--     Phiếu tuần cũ (ngay NULL) bị xoá lúc chuyển đổi → bỏ qua, mục 7 đồng bộ lại tường minh.
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_dong_bo_phieu_xoa()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_dgdv_dong_bo_ngay(x.ngay, x.id_chi_nhanh)
  FROM (SELECT DISTINCT o.ngay, o.id_chi_nhanh FROM old_rows o WHERE o.ngay IS NOT NULL) x;
  RETURN NULL;
END;
$$;

-- 5c) Đổi ngày / chi nhánh → đồng bộ (ngày, chi nhánh) cũ và mới.
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_dong_bo_phieu_sua()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF (NEW.ngay, NEW.id_chi_nhanh) IS DISTINCT FROM (OLD.ngay, OLD.id_chi_nhanh) THEN
    PERFORM public.fn_dgdv_dong_bo_ngay(OLD.ngay, OLD.id_chi_nhanh);
    PERFORM public.fn_dgdv_dong_bo_ngay(NEW.ngay, NEW.id_chi_nhanh);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_dgdv_trg_dong_bo_con_phieu() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_dgdv_trg_dong_bo_phieu_xoa() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_dgdv_trg_dong_bo_phieu_sua() FROM PUBLIC, anon;

CREATE OR REPLACE TRIGGER trg_dgdv_dong_bo_upd AFTER UPDATE OF ngay, id_chi_nhanh ON public.fp_farm_dgdv
  FOR EACH ROW EXECUTE FUNCTION public.fn_dgdv_trg_dong_bo_phieu_sua();

-- Không còn trigger nào gọi bản tuần.
DROP FUNCTION IF EXISTS public.fn_dgdv_dong_bo_tuan(integer, integer, bigint);

-- 6) Backfill tuần thu hoạch của cột dây cũ ----------------------------------------------
-- Ưu tiên chích bắp + 9 tuần; không có thì thu hoạch − 1 tuần (dữ liệu cũ gợi ý chích bắp + 10);
-- không có ngày nào → tuần của phiếu. Trigger 3e điền lại 4 cột ngày theo tuần vừa gán.
UPDATE public.fp_farm_dgdv_cot c
   SET (th_nam, th_tuan) = (
         SELECT t.nam, t.tuan FROM public.fn_dgdv_tuan_farm(
           CASE
             WHEN c.chich_bap_tu IS NOT NULL THEN c.chich_bap_tu + 63
             WHEN c.thu_hoach_tu IS NOT NULL THEN c.thu_hoach_tu - 7
             WHEN c.chich_bap_den IS NOT NULL THEN c.chich_bap_den + 63
             WHEN c.thu_hoach_den IS NOT NULL THEN c.thu_hoach_den - 7
             ELSE COALESCE(p.ngay, public.fn_dgdv_ngay_dau_tuan(p.nam, p.tuan))
           END) t)
  FROM public.fp_farm_dgdv p
 WHERE p.id = c.id_phieu
   AND (c.th_nam IS NULL OR c.th_tuan IS NULL);

-- 7) CHUYỂN ĐỔI phiếu tuần → phiếu chuyến ------------------------------------------------
-- Ảnh chụp TRƯỚC: tổng theo (ngày của ô, chi nhánh) — cách tính đúng cho cả mô hình cũ lẫn mới.
CREATE TEMP TABLE _dgdv_truoc ON COMMIT DROP AS
SELECT u.ngay, p.id_chi_nhanh,
       SUM(u.so_luong)::bigint AS so_luong, SUM(u.so_luong_loi)::bigint AS so_luong_loi, SUM(u.dut_day)::bigint AS dut_day
FROM (
  SELECT id_phieu_lo, ngay, so_luong, so_luong_loi, 0 AS dut_day FROM public.fp_farm_dgdv_dong
  UNION ALL
  SELECT id_phieu_lo, ngay, 0, 0, dut_day FROM public.fp_farm_dgdv_lo_ngay
) u
JOIN public.fp_farm_dgdv_lo l ON l.id = u.id_phieu_lo
JOIN public.fp_farm_dgdv p ON p.id = l.id_phieu
GROUP BY u.ngay, p.id_chi_nhanh;

CREATE TEMP TABLE _dgdv_tong_bang ON COMMIT DROP AS
SELECT 'truoc'::text AS luc,
       (SELECT COALESCE(SUM(so_luong), 0) FROM public.fp_farm_dgdv_dong)::bigint AS so_luong,
       (SELECT COALESCE(SUM(so_luong_loi), 0) FROM public.fp_farm_dgdv_dong)::bigint AS so_luong_loi,
       (SELECT COALESCE(SUM(dut_day), 0) FROM public.fp_farm_dgdv_lo_ngay)::bigint AS dut_day;

-- Trigger đồng bộ bắn trong lúc chép (mỗi câu INSERT ô / đứt dây) → Báo cáo sơ chế / Dự báo có thể
-- nhận số dở dang; bước 7b đồng bộ lại mọi (ngày, chi nhánh) sau cùng nên số cuối giữ nguyên.
DO $$
DECLARE
  p record;
  c record;
  l record;
  v_ngay date;
  v_moi bigint;
  v_id bigint;
  v_map_cot jsonb;
  v_map_lo jsonb;
  n_cu int := 0;
  n_moi int := 0;
BEGIN
  FOR p IN SELECT * FROM public.fp_farm_dgdv WHERE ngay IS NULL ORDER BY id LOOP
    n_cu := n_cu + 1;
    FOR v_ngay IN
      SELECT x.ngay FROM (
        SELECT d.ngay FROM public.fp_farm_dgdv_dong d
        JOIN public.fp_farm_dgdv_lo pl ON pl.id = d.id_phieu_lo WHERE pl.id_phieu = p.id
        UNION
        SELECT n.ngay FROM public.fp_farm_dgdv_lo_ngay n
        JOIN public.fp_farm_dgdv_lo pl ON pl.id = n.id_phieu_lo WHERE pl.id_phieu = p.id
      ) x
      UNION
      -- phiếu không có số nào → giữ khung ở thứ Hai của tuần ISO cũ
      SELECT public.fn_dgdv_ngay_dau_tuan(p.nam, p.tuan)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.fp_farm_dgdv_lo pl
        WHERE pl.id_phieu = p.id
          AND (EXISTS (SELECT 1 FROM public.fp_farm_dgdv_dong d WHERE d.id_phieu_lo = pl.id)
               OR EXISTS (SELECT 1 FROM public.fp_farm_dgdv_lo_ngay n WHERE n.id_phieu_lo = pl.id)))
      ORDER BY 1
    LOOP
      INSERT INTO public.fp_farm_dgdv (ngay, chuyen, id_chi_nhanh, ghi_chu, trang_thai, id_nguoi_tao, tg_tao, tg_cap_nhat)
      VALUES (v_ngay, 1, p.id_chi_nhanh, p.ghi_chu, p.trang_thai, p.id_nguoi_tao, p.tg_tao, p.tg_cap_nhat)
      RETURNING id INTO v_moi;
      n_moi := n_moi + 1;

      v_map_cot := '{}'::jsonb;
      FOR c IN SELECT * FROM public.fp_farm_dgdv_cot WHERE id_phieu = p.id ORDER BY stt, id LOOP
        INSERT INTO public.fp_farm_dgdv_cot (id_phieu, stt, th_nam, th_tuan, id_mau_1, id_mau_2, xe_doi)
        VALUES (v_moi, c.stt, c.th_nam, c.th_tuan, c.id_mau_1, c.id_mau_2, c.xe_doi)
        RETURNING id INTO v_id;
        v_map_cot := v_map_cot || jsonb_build_object(c.id::text, v_id);
      END LOOP;

      v_map_lo := '{}'::jsonb;
      FOR l IN SELECT * FROM public.fp_farm_dgdv_lo WHERE id_phieu = p.id ORDER BY stt, id LOOP
        INSERT INTO public.fp_farm_dgdv_lo (id_phieu, id_lo, id_to_truong, to_truong, ghi_chu, stt)
        VALUES (v_moi, l.id_lo, l.id_to_truong, l.to_truong, l.ghi_chu, l.stt)
        RETURNING id INTO v_id;
        v_map_lo := v_map_lo || jsonb_build_object(l.id::text, v_id);
      END LOOP;

      INSERT INTO public.fp_farm_dgdv_lo_ngay (id_phieu_lo, ngay, dut_day)
      SELECT (v_map_lo->>n.id_phieu_lo::text)::bigint, n.ngay, n.dut_day
      FROM public.fp_farm_dgdv_lo_ngay n
      JOIN public.fp_farm_dgdv_lo pl ON pl.id = n.id_phieu_lo
      WHERE pl.id_phieu = p.id AND n.ngay = v_ngay;

      INSERT INTO public.fp_farm_dgdv_dong (id_phieu_lo, id_cot, ngay, stt_dong, so_luong, danh_gia, so_luong_loi, ly_do_loi)
      SELECT (v_map_lo->>d.id_phieu_lo::text)::bigint, (v_map_cot->>d.id_cot::text)::bigint,
             d.ngay, d.stt_dong, d.so_luong, d.danh_gia, d.so_luong_loi, d.ly_do_loi
      FROM public.fp_farm_dgdv_dong d
      JOIN public.fp_farm_dgdv_lo pl ON pl.id = d.id_phieu_lo
      WHERE pl.id_phieu = p.id AND d.ngay = v_ngay;
    END LOOP;

    DELETE FROM public.fp_farm_dgdv WHERE id = p.id;
  END LOOP;

  RAISE NOTICE 'Chuyển đổi: % phiếu tuần → % phiếu chuyến', n_cu, n_moi;
END $$;

-- 7b) Đồng bộ lại mọi (ngày, chi nhánh) trước / sau chuyển đổi.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT ngay, id_chi_nhanh FROM _dgdv_truoc
    UNION
    SELECT ngay, id_chi_nhanh FROM public.fp_farm_dgdv
  LOOP
    PERFORM public.fn_dgdv_dong_bo_ngay(r.ngay, r.id_chi_nhanh);
  END LOOP;
END $$;

-- 7c) Kiểm SAU: tổng toàn bảng và tổng từng (ngày, chi nhánh) — lệch là huỷ cả migration.
DO $$
DECLARE
  t record;
  s record;
  r record;
BEGIN
  SELECT * INTO t FROM _dgdv_tong_bang WHERE luc = 'truoc';
  SELECT (SELECT COALESCE(SUM(so_luong), 0) FROM public.fp_farm_dgdv_dong)::bigint AS so_luong,
         (SELECT COALESCE(SUM(so_luong_loi), 0) FROM public.fp_farm_dgdv_dong)::bigint AS so_luong_loi,
         (SELECT COALESCE(SUM(dut_day), 0) FROM public.fp_farm_dgdv_lo_ngay)::bigint AS dut_day
    INTO s;
  IF (s.so_luong, s.so_luong_loi, s.dut_day) IS DISTINCT FROM (t.so_luong, t.so_luong_loi, t.dut_day) THEN
    RAISE EXCEPTION 'Lệch tổng toàn bảng sau chuyển đổi: trước (SL %, lỗi %, đứt %) — sau (SL %, lỗi %, đứt %)',
      t.so_luong, t.so_luong_loi, t.dut_day, s.so_luong, s.so_luong_loi, s.dut_day;
  END IF;

  FOR r IN
    SELECT k.ngay, k.id_chi_nhanh,
           COALESCE(b.so_luong + b.dut_day, 0) AS thu_truoc, COALESCE(b.so_luong_loi, 0) AS ksc_truoc,
           f.tong_thu AS thu_sau, f.ksc AS ksc_sau
    FROM (SELECT ngay, id_chi_nhanh FROM _dgdv_truoc
          UNION SELECT ngay, id_chi_nhanh FROM public.fp_farm_dgdv) k
    LEFT JOIN _dgdv_truoc b ON b.ngay = k.ngay AND b.id_chi_nhanh = k.id_chi_nhanh
    CROSS JOIN LATERAL public.fn_dgdv_tong_ngay(k.ngay, k.id_chi_nhanh) f
    WHERE (COALESCE(b.so_luong + b.dut_day, 0), COALESCE(b.so_luong_loi, 0)) IS DISTINCT FROM (f.tong_thu, f.ksc)
    LIMIT 1
  LOOP
    RAISE EXCEPTION 'Lệch tổng ngày % chi nhánh %: trước (thu %, KSC %) — sau (thu %, KSC %)',
      r.ngay, r.id_chi_nhanh, r.thu_truoc, r.ksc_truoc, r.thu_sau, r.ksc_sau;
  END LOOP;

  -- Báo cáo sơ chế / Dự báo của các (ngày, chi nhánh) có phiếu phải khớp tổng phiếu (như kiểm tra 1, 3 của 052).
  IF EXISTS (
       SELECT 1 FROM public.fp_farm_bao_cao_so_che b
       JOIN public.fp_farm_bao_cao_so_che_ct ct ON ct.id_bao_cao = b.id
         AND ct.ma_chi_tieu IN ('tong_buong_thu_hoach', 'tong_buong_khong_so_che')
       CROSS JOIN LATERAL public.fn_dgdv_tong_ngay(b.ngay, b.id_chi_nhanh) f
       WHERE (b.ngay, b.id_chi_nhanh) IN (SELECT ngay, id_chi_nhanh FROM _dgdv_truoc
                                          UNION SELECT ngay, id_chi_nhanh FROM public.fp_farm_dgdv)
         AND ct.gia_tri IS DISTINCT FROM (CASE ct.ma_chi_tieu WHEN 'tong_buong_thu_hoach' THEN f.tong_thu ELSE f.ksc END)::numeric)
     OR EXISTS (
       SELECT 1 FROM public.fp_farm_du_bao_sl_dong_thung d
       CROSS JOIN LATERAL public.fn_dgdv_tong_ngay(d.ngay, d.id_chi_nhanh) f
       WHERE (d.ngay, d.id_chi_nhanh) IN (SELECT ngay, id_chi_nhanh FROM _dgdv_truoc
                                          UNION SELECT ngay, id_chi_nhanh FROM public.fp_farm_dgdv)
         AND d.tong_buong_nhap_thuc_te IS DISTINCT FROM f.tong_thu::integer) THEN
    RAISE EXCEPTION 'Báo cáo sơ chế / Dự báo SL đóng thùng lệch tổng phiếu sau chuyển đổi';
  END IF;
END $$;

-- 8) NOT NULL sau chuyển đổi ---------------------------------------------------------------
ALTER TABLE public.fp_farm_dgdv ALTER COLUMN ngay SET NOT NULL;
ALTER TABLE public.fp_farm_dgdv_cot ALTER COLUMN th_nam SET NOT NULL;
ALTER TABLE public.fp_farm_dgdv_cot ALTER COLUMN th_tuan SET NOT NULL;

-- 9) View --------------------------------------------------------------------------------
-- security_invoker: RLS của bảng gốc (052) áp cho người đọc view. Tên người tạo ghép ở app (cache
-- nhân viên) như trước — view không JOIN fp_var_nhan_vien.
-- 9a) Một dòng / phiếu (chuyến) — danh sách: lọc / sắp xếp theo tổng ngay ở PostgREST.
CREATE OR REPLACE VIEW public.v_fp_farm_dgdv_tong_chuyen
WITH (security_invoker = true) AS
SELECT p.id,
       p.ngay,
       p.chuyen,
       p.nam,
       p.tuan,
       p.id_chi_nhanh,
       cn.ten_chi_nhanh,
       p.trang_thai,
       p.ghi_chu,
       p.id_nguoi_tao,
       p.tg_tao,
       p.tg_cap_nhat,
       COALESCE(d.so_luong, 0)::bigint AS tong_so_luong,
       COALESCE(n.dut_day, 0)::bigint AS tong_dut_day,
       (COALESCE(d.so_luong, 0) + COALESCE(n.dut_day, 0))::bigint AS tong_thu,
       COALESCE(d.so_luong_loi, 0)::bigint AS ksc
FROM public.fp_farm_dgdv p
LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = p.id_chi_nhanh
LEFT JOIN LATERAL (
  SELECT SUM(x.so_luong) AS so_luong, SUM(x.so_luong_loi) AS so_luong_loi
  FROM public.fp_farm_dgdv_lo l JOIN public.fp_farm_dgdv_dong x ON x.id_phieu_lo = l.id
  WHERE l.id_phieu = p.id
) d ON true
LEFT JOIN LATERAL (
  SELECT SUM(x.dut_day) AS dut_day
  FROM public.fp_farm_dgdv_lo l JOIN public.fp_farm_dgdv_lo_ngay x ON x.id_phieu_lo = l.id
  WHERE l.id_phieu = p.id
) n ON true;

COMMENT ON VIEW public.v_fp_farm_dgdv_tong_chuyen IS
  'Đánh giá đầu vào: 1 dòng / phiếu chuyến kèm tổng SL, đứt dây, tổng thu (= SL + đứt dây), KSC (= Σ SL lỗi)';

-- 9b) Cộng mọi chuyến theo (ngày, chi nhánh, lô, dây). Đứt dây chung view: dòng id_mau_1 NULL
--     (so_luong = Σ đứt dây của lô, so_luong_loi = 0, không có dây / tuần thu hoạch) → Σ so_luong của
--     một (ngày, chi nhánh) = tong_thu, Σ so_luong_loi = ksc, đúng fn_dgdv_tong_ngay, khỏi đọc 2 view.
--     Dây giữa các chuyến coi là một khi cùng (màu 1, màu 2, xé đôi, tuần thu hoạch). Tổ trưởng là thuộc
--     tính, không phải khoá: lấy bản đầu tiên có chữ theo chuyến → stt lô.
CREATE OR REPLACE VIEW public.v_fp_farm_dgdv_tong_ngay_day
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
         SUM(d.so_luong)::bigint AS so_luong, SUM(d.so_luong_loi)::bigint AS so_luong_loi
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
       u.id_mau_1, u.id_mau_2, u.xe_doi, u.th_nam, u.th_tuan, u.so_luong, u.so_luong_loi
FROM u
LEFT JOIN tt ON tt.ngay = u.ngay AND tt.id_chi_nhanh = u.id_chi_nhanh AND tt.id_lo = u.id_lo
LEFT JOIN public.fp_var_lo_thu_hoach dm ON dm.id = u.id_lo;

COMMENT ON VIEW public.v_fp_farm_dgdv_tong_ngay_day IS
  'Đánh giá đầu vào: cộng mọi chuyến theo ngày × chi nhánh × lô × dây (màu 1, màu 2, xé đôi, tuần thu hoạch). '
  'Dòng id_mau_1 NULL = đứt dây của lô. Σ so_luong / ngày + chi nhánh = tổng thu; Σ so_luong_loi = KSC';

REVOKE ALL ON TABLE public.v_fp_farm_dgdv_tong_chuyen FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.v_fp_farm_dgdv_tong_ngay_day FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.v_fp_farm_dgdv_tong_chuyen TO authenticated;
GRANT SELECT ON TABLE public.v_fp_farm_dgdv_tong_ngay_day TO authenticated;

-- 10) rpc_dgdv_import theo chuyến ---------------------------------------------------------
-- p_rows: như 056 + `chuyen` (thiếu / null = 1). Phiếu tìm / tạo theo (ngay, id_chi_nhanh, chuyen).
-- p_thay_the: xoá dòng + đứt dây của mọi (chi nhánh, ngày, CHUYẾN) có trong file rồi ghi lại — chuyến
--             khác cùng ngày không bị đụng. false = cộng thêm dòng mới (đứt dây cộng dồn).
-- p_id_phieu: mọi dòng phải cùng ngày + chi nhánh + chuyến của phiếu đó.
-- Cột dây khớp theo màu 1 / màu 2 / xé đôi / tuần thu hoạch (th_nam, th_tuan); trigger 3e điền ngày.
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
  'Đánh giá đầu vào: import dòng chi tiết theo chuyến (tự tạo phiếu / lô / cột dây), tất cả hoặc không. SECURITY INVOKER — RLS áp.';

REVOKE ALL ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_dgdv_import(jsonb, boolean, bigint) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- KIỂM TRA SAU KHI CHẠY (chạy tay bằng scripts/db-sql.sh -c "...")
-- =============================================================================
-- 1) Phiếu sau chuyển đổi (kỳ vọng: mỗi ngày cũ có số → 1 phiếu chuyến 1, nam/tuan là tuần farm):
--    SELECT id, ngay, chuyen, nam, tuan, id_chi_nhanh, trang_thai, tong_thu, ksc
--    FROM v_fp_farm_dgdv_tong_chuyen ORDER BY ngay, id_chi_nhanh, chuyen;
--
-- 2) Dây: tuần thu hoạch + ngày tự điền (chích bắp = thu hoạch − 63 ngày):
--    SELECT id, id_phieu, th_nam, th_tuan, chich_bap_tu, thu_hoach_tu FROM fp_farm_dgdv_cot ORDER BY id_phieu, stt;
--
-- 3) View tổng ngày × dây khớp hàm tổng (2 cặp cột phải bằng nhau):
--    SELECT v.ngay, v.id_chi_nhanh, SUM(v.so_luong) AS thu_view, f.tong_thu, SUM(v.so_luong_loi) AS ksc_view, f.ksc
--    FROM v_fp_farm_dgdv_tong_ngay_day v
--    CROSS JOIN LATERAL fn_dgdv_tong_ngay(v.ngay, v.id_chi_nhanh) f
--    GROUP BY v.ngay, v.id_chi_nhanh, f.tong_thu, f.ksc ORDER BY v.ngay;
--
-- 4) Ô / đứt dây lệch ngày phiếu (kỳ vọng 0):
--    SELECT count(*) FROM fp_farm_dgdv_dong d JOIN fp_farm_dgdv_lo l ON l.id = d.id_phieu_lo
--      JOIN fp_farm_dgdv p ON p.id = l.id_phieu WHERE d.ngay <> p.ngay;
--
-- 5) Kiểm tra 1–3 của 052 (Báo cáo sơ chế / Dự báo khớp tổng phiếu) vẫn phải ra 0 dòng.
