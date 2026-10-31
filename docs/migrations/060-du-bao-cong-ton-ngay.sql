-- =============================================================================
-- 060-du-bao-cong-ton-ngay.sql — Dự báo SL đóng thùng: dòng 10 cộng buồng tồn
--
-- Trước (052, trigger 5e): fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_thuc_te = Tổng thu ĐGĐV của ngày
-- → bỏ sót buồng tồn từ hôm trước, số thùng dự kiến (thực tế) thiếu (fp1 29/10: 506 thay vì 561).
--
-- Sau: dòng 10 ngày D = [6] Tồn đầu ngày + [7] Thu hoạch − [10] Tồn cuối ngày của Báo cáo sơ chế CÙNG ngày D,
-- cùng chi nhánh (số buồng thực đưa vào sơ chế).
--   [7]       = fn_dgdv_tong_ngay(D).tong_thu (cùng nguồn đang khoá chỉ tiêu 'tong_buong_thu_hoach')
--   [6], [10] = fp_farm_bao_cao_so_che_ct 'sl_buong_ton_dau_ngay' / 'sl_buong_ton_cuoi_ngay' (nhập tay ở BCSC)
--   Chưa có BCSC ngày D → [6] = [10] = 0. Kết quả âm → 0.
-- Hai số tồn lưu kèm ở 2 cột mới để xem / xuất hiện được «Tồn đầu + Thu hoạch − Tồn cuối».
-- Các cột GENERATED (tong_khoi_luong_thuc_te, tong_so_thung_thuc_te) tự tính lại theo số mới.
--
-- Đồng bộ: trigger 5e (thay thân) tính lại mỗi lần INSERT/UPDATE dự báo; đổi ĐGĐV → fn_dgdv_dong_bo_ngay
-- (thay thân); đổi 2 chỉ tiêu tồn / đổi ngày, chi nhánh / xoá BCSC → trigger mới ở mục 4.
--
-- !!! Cuối file BACKFILL tính lại TOÀN BỘ dự báo cũ, kể cả phiếu đã khoá. Giá trị cũ tra / khôi phục ở
--     fp_var_nhat_ky_thay_doi (trigger nhật ký 016) và bản backup.
--
-- Chạy lại được nhiều lần (IF NOT EXISTS / CREATE OR REPLACE).
-- Trước khi chạy: bash scripts/db-backup.sh truoc-060   (lần chạy 31/10/2026 đã sao lưu tên «truoc-059» — file từng đánh số 059)
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/060-du-bao-cong-ton-ngay.sql
-- =============================================================================

BEGIN;

-- 1) Cột lưu 2 số tồn ---------------------------------------------------------------
ALTER TABLE public.fp_farm_du_bao_sl_dong_thung
  ADD COLUMN IF NOT EXISTS sl_buong_ton_dau_ngay integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sl_buong_ton_cuoi_ngay integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.sl_buong_ton_dau_ngay IS
  'Tồn đầu ngày theo Báo cáo sơ chế cùng ngày + chi nhánh (trigger ghi, không nhập tay)';
COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.sl_buong_ton_cuoi_ngay IS
  'Tồn cuối ngày theo Báo cáo sơ chế cùng ngày + chi nhánh (trigger ghi, không nhập tay)';
COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_thuc_te IS
  'Dòng 10 = max(0, tồn đầu + Tổng thu ĐGĐV − tồn cuối) — trigger ghi (migration 060)';

-- 2) Hàm tồn theo (ngày, chi nhánh) ------------------------------------------------
-- Aggregate không có dòng vẫn trả 1 dòng → chưa có BCSC = (0, 0).
CREATE OR REPLACE FUNCTION public.fn_du_bao_ton_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS TABLE (ton_dau integer, ton_cuoi integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(MAX(ct.gia_tri) FILTER (WHERE ct.ma_chi_tieu = 'sl_buong_ton_dau_ngay'), 0)::integer,
         COALESCE(MAX(ct.gia_tri) FILTER (WHERE ct.ma_chi_tieu = 'sl_buong_ton_cuoi_ngay'), 0)::integer
  FROM public.fp_farm_bao_cao_so_che b
  JOIN public.fp_farm_bao_cao_so_che_ct ct ON ct.id_bao_cao = b.id
  WHERE b.ngay = p_ngay AND b.id_chi_nhanh = p_id_chi_nhanh
    AND ct.ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'sl_buong_ton_cuoi_ngay');
$$;

COMMENT ON FUNCTION public.fn_du_bao_ton_ngay(date, bigint) IS
  'Dự báo SL đóng thùng: tồn đầu / tồn cuối ngày theo Báo cáo sơ chế cùng ngày + chi nhánh (0 nếu chưa có)';

REVOKE ALL ON FUNCTION public.fn_du_bao_ton_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_du_bao_ton_ngay(date, bigint) TO authenticated;

-- 3) Khoá số + đồng bộ dự báo -------------------------------------------------------
-- 3a) Thay thân trigger 5e (052): ghi 2 cột tồn + dòng 10 theo công thức mới.
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_du_bao_khoa_so()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thu bigint;
  v_dau integer;
  v_cuoi integer;
BEGIN
  SELECT t.tong_thu INTO v_thu FROM public.fn_dgdv_tong_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  SELECT t.ton_dau, t.ton_cuoi INTO v_dau, v_cuoi FROM public.fn_du_bao_ton_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  NEW.sl_buong_ton_dau_ngay := COALESCE(v_dau, 0);
  NEW.sl_buong_ton_cuoi_ngay := COALESCE(v_cuoi, 0);
  NEW.tong_buong_nhap_thuc_te := GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) - COALESCE(v_cuoi, 0))::integer;
  RETURN NEW;
END;
$$;

-- 3b) Chạm dự báo lệch số của (ngày, chi nhánh) để trigger 3a tính lại; chỉ chạm dòng lệch để nhật ký không phình.
CREATE OR REPLACE FUNCTION public.fn_du_bao_dong_bo(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thu bigint;
  v_dau integer;
  v_cuoi integer;
  v_nhap integer;
BEGIN
  IF p_ngay IS NULL OR p_id_chi_nhanh IS NULL THEN
    RETURN;
  END IF;

  SELECT t.tong_thu INTO v_thu FROM public.fn_dgdv_tong_ngay(p_ngay, p_id_chi_nhanh) t;
  SELECT t.ton_dau, t.ton_cuoi INTO v_dau, v_cuoi FROM public.fn_du_bao_ton_ngay(p_ngay, p_id_chi_nhanh) t;
  v_nhap := GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) - COALESCE(v_cuoi, 0))::integer;

  UPDATE public.fp_farm_du_bao_sl_dong_thung
     SET tong_buong_nhap_thuc_te = v_nhap,
         sl_buong_ton_dau_ngay = COALESCE(v_dau, 0),
         sl_buong_ton_cuoi_ngay = COALESCE(v_cuoi, 0)
   WHERE ngay = p_ngay
     AND id_chi_nhanh = p_id_chi_nhanh
     AND (tong_buong_nhap_thuc_te, sl_buong_ton_dau_ngay, sl_buong_ton_cuoi_ngay)
         IS DISTINCT FROM (v_nhap, COALESCE(v_dau, 0), COALESCE(v_cuoi, 0));
END;
$$;

-- 3c) Thay thân 5b (052): ĐGĐV đổi → BCSC + dự báo theo công thức mới.
CREATE OR REPLACE FUNCTION public.fn_dgdv_dong_bo_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_ngay IS NULL OR p_id_chi_nhanh IS NULL THEN
    RETURN;
  END IF;

  PERFORM public.fn_dgdv_dong_bo_bcsc(p_ngay, p_id_chi_nhanh);
  PERFORM public.fn_du_bao_dong_bo(p_ngay, p_id_chi_nhanh);
END;
$$;

-- 4) Trigger nguồn: Báo cáo sơ chế đổi → đồng bộ dự báo -----------------------------
-- 4a) Dòng chỉ tiêu tồn đổi (mức câu lệnh — app xoá hết rồi chèn lại cả phiếu). Xoá cả phiếu (cascade):
--     lúc này dòng cha đã mất, JOIN rỗng → trigger 4c của bảng cha lo.
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
      WHERE x.ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'sl_buong_ton_cuoi_ngay')
    LOOP
      PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
    END LOOP;
  END IF;
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    FOR r IN
      SELECT DISTINCT b.ngay, b.id_chi_nhanh
      FROM old_rows x JOIN public.fp_farm_bao_cao_so_che b ON b.id = x.id_bao_cao
      WHERE x.ma_chi_tieu IN ('sl_buong_ton_dau_ngay', 'sl_buong_ton_cuoi_ngay')
    LOOP
      PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$;

-- 4b) Phiếu BCSC đổi ngày / chi nhánh → cả cặp cũ và mới.
CREATE OR REPLACE FUNCTION public.fn_du_bao_trg_bcsc_doi()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF (NEW.ngay, NEW.id_chi_nhanh) IS DISTINCT FROM (OLD.ngay, OLD.id_chi_nhanh) THEN
    PERFORM public.fn_du_bao_dong_bo(OLD.ngay, OLD.id_chi_nhanh);
    PERFORM public.fn_du_bao_dong_bo(NEW.ngay, NEW.id_chi_nhanh);
  END IF;
  RETURN NULL;
END;
$$;

-- 4c) Phiếu BCSC bị xoá (chạy sau cascade dòng chỉ tiêu) → tồn về 0.
CREATE OR REPLACE FUNCTION public.fn_du_bao_trg_bcsc_xoa()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT ngay, id_chi_nhanh FROM old_rows LOOP
    PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
  END LOOP;
  RETURN NULL;
END;
$$;

-- Hàm nội bộ (chỉ trigger gọi, chạy với quyền chủ hàm) → không cấp cho ai.
REVOKE ALL ON FUNCTION public.fn_du_bao_dong_bo(date, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_du_bao_trg_bcsc_ct_ton() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_du_bao_trg_bcsc_doi() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_du_bao_trg_bcsc_xoa() FROM PUBLIC, anon, authenticated;

-- Transition table không đi chung nhiều sự kiện → 3 trigger dùng chung một hàm (như 052 mục 6).
CREATE OR REPLACE TRIGGER trg_du_bao_ton_ins AFTER INSERT ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_du_bao_trg_bcsc_ct_ton();
CREATE OR REPLACE TRIGGER trg_du_bao_ton_upd AFTER UPDATE ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_du_bao_trg_bcsc_ct_ton();
CREATE OR REPLACE TRIGGER trg_du_bao_ton_del AFTER DELETE ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_du_bao_trg_bcsc_ct_ton();

CREATE OR REPLACE TRIGGER trg_du_bao_ton_doi AFTER UPDATE OF ngay, id_chi_nhanh ON public.fp_farm_bao_cao_so_che
  FOR EACH ROW EXECUTE FUNCTION public.fn_du_bao_trg_bcsc_doi();
CREATE OR REPLACE TRIGGER trg_du_bao_ton_xoa AFTER DELETE ON public.fp_farm_bao_cao_so_che
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_du_bao_trg_bcsc_xoa();

-- 5) BACKFILL toàn bộ dự báo + kiểm tra ---------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_du_bao_sl_dong_thung LOOP
    PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
  END LOOP;

  IF EXISTS (
       SELECT 1 FROM public.fp_farm_du_bao_sl_dong_thung d
       CROSS JOIN LATERAL public.fn_dgdv_tong_ngay(d.ngay, d.id_chi_nhanh) f
       CROSS JOIN LATERAL public.fn_du_bao_ton_ngay(d.ngay, d.id_chi_nhanh) t
       WHERE (d.tong_buong_nhap_thuc_te, d.sl_buong_ton_dau_ngay, d.sl_buong_ton_cuoi_ngay)
             IS DISTINCT FROM (GREATEST(0, t.ton_dau + f.tong_thu - t.ton_cuoi)::integer, t.ton_dau, t.ton_cuoi)) THEN
    RAISE EXCEPTION 'Dự báo SL đóng thùng lệch công thức tồn đầu + thu hoạch − tồn cuối sau backfill';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- KIỂM TRA SAU KHI CHẠY (chạy tay bằng scripts/db-sql.sh -c "...")
-- =============================================================================
-- 1) Đối chiếu dự báo với BCSC cùng ngày (cột nhap = ton_dau + thu − ton_cuoi):
--    SELECT d.ngay, d.ten_chi_nhanh, d.sl_buong_ton_dau_ngay, f.tong_thu, d.sl_buong_ton_cuoi_ngay,
--           d.tong_buong_nhap_thuc_te AS nhap, d.tong_so_thung_thuc_te
--    FROM fp_farm_du_bao_sl_dong_thung d
--    CROSS JOIN LATERAL fn_dgdv_tong_ngay(d.ngay, d.id_chi_nhanh) f
--    ORDER BY d.ngay DESC, d.id_chi_nhanh LIMIT 20;
--
-- 2) Thử đồng bộ khi sửa tồn BCSC (trong transaction rồi ROLLBACK):
--    BEGIN;
--    UPDATE fp_farm_bao_cao_so_che_ct ct SET gia_tri = gia_tri + 10
--      FROM fp_farm_bao_cao_so_che b
--     WHERE b.id = ct.id_bao_cao AND ct.ma_chi_tieu = 'sl_buong_ton_dau_ngay'
--       AND b.id = (SELECT max(id) FROM fp_farm_bao_cao_so_che);
--    SELECT d.ngay, d.sl_buong_ton_dau_ngay, d.tong_buong_nhap_thuc_te FROM fp_farm_du_bao_sl_dong_thung d
--      JOIN fp_farm_bao_cao_so_che b ON b.ngay = d.ngay AND b.id_chi_nhanh = d.id_chi_nhanh
--     WHERE b.id = (SELECT max(id) FROM fp_farm_bao_cao_so_che);
--    ROLLBACK;
