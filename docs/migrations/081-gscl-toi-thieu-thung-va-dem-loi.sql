-- =============================================================================
-- 081-gscl-toi-thieu-thung-va-dem-loi.sql — Quản lý nhà sơ chế > Giám sát chất lượng
--
-- (1) TỐI THIỂU THÙNG KIỂM / NGÀY / FARM mới tính «Đánh giá lỗi QC (%)» của Báo cáo sơ chế.
--     Cộng mọi thùng đã kiểm (da_kiem, tong_nhanh > 0, phiếu chưa huỷ) của farm trong ngày;
--     dưới `so_thung_toi_thieu_ngay` (mặc định 50) → % KHÔNG tính: ô QC ở
--     fp_farm_bao_cao_so_che_ct lưu gia_tri = NULL, app hiện «Chưa đạt kiểm tra (x/50 thùng)».
--     Chỉ áp từ `ngay_ap_dung_toi_thieu` (mặc định 2026-11-17) — ngày trước đó tính như 072.
--     Hai số nằm ở fp_farm_gscl_cai_dat (popup Cài đặt GSCL); đổi số → đồng bộ lại Báo cáo
--     sơ chế từ ngày áp dụng (cũ/mới, lấy ngày nhỏ hơn).
--     gia_tri của fp_farm_bao_cao_so_che_ct bỏ NOT NULL, nhưng CHECK chỉ cho ô QC được NULL.
--
-- (2) ĐẾM LỖI SẴN TRÊN PHIẾU để danh sách lọc «Có lỗi / Không lỗi» và sắp xếp theo % lỗi
--     ở server: so_loi (Σ ô số tiêu chí `dem_loi` của thùng đã kiểm), tong_nhanh_kiem
--     (Σ tong_nhanh của thùng đã kiểm, tong_nhanh > 0), ti_le_loi = round(100 × so_loi /
--     tong_nhanh_kiem, 2) (NULL khi chưa có thùng nào). Cột thường (không GENERATED: trigger
--     fn_farm_gscl_khoa_phieu so to_jsonb(NEW) với OLD khi xuất phiếu), do trigger giữ:
--       - thùng INSERT/UPDATE/DELETE → cập nhật phiếu cha (SECURITY DEFINER nên không vướng
--         khoá phiếu đã nộp/đã xuất — khoá chỉ chặn current_user = authenticated);
--       - phiếu đổi tieu_chi → tính lại ngay trong NEW.
--     Mỗi lần lưu thùng có lỗi thay đổi → phiếu cha được UPDATE (tg_cap_nhat bump, nhật ký 016
--     ghi một dòng) — chấp nhận, phiếu đổi thật.
--
-- Chạy lại được nhiều lần (IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/081-gscl-toi-thieu-thung-va-dem-loi.sql
-- =============================================================================

BEGIN;

-- 1) Số lỗi một thùng (dùng chung) -----------------------------------------------
-- Σ ô kết quả kiểu JSON number của các tiêu chí loai = 'dem_loi' trong bộ tiêu chí phiếu.
-- Ô trống / true / chuỗi → 0 (đúng như app: core/ti-le.ts tiLeLoi).
CREATE OR REPLACE FUNCTION public.fn_gscl_so_loi_thung(p_ket_qua jsonb, p_tieu_chi jsonb)
    RETURNS numeric
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT COALESCE(SUM(
           CASE WHEN jsonb_typeof(p_ket_qua -> (e ->> 'ma')) = 'number'
                THEN (p_ket_qua -> (e ->> 'ma'))::numeric
                ELSE 0 END), 0)
    FROM jsonb_array_elements(
           CASE WHEN jsonb_typeof(p_tieu_chi) = 'array' THEN p_tieu_chi ELSE '[]'::jsonb END) e
   WHERE e ->> 'loai' = 'dem_loi';
$$;

REVOKE ALL ON FUNCTION public.fn_gscl_so_loi_thung(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_gscl_so_loi_thung(jsonb, jsonb) TO authenticated;

-- 2) Cài đặt: tối thiểu thùng / ngày + ngày áp dụng -----------------------------
ALTER TABLE public.fp_farm_gscl_cai_dat
  ADD COLUMN IF NOT EXISTS so_thung_toi_thieu_ngay integer DEFAULT 50 NOT NULL,
  ADD COLUMN IF NOT EXISTS ngay_ap_dung_toi_thieu date DEFAULT DATE '2026-11-17' NOT NULL;

ALTER TABLE public.fp_farm_gscl_cai_dat
  DROP CONSTRAINT IF EXISTS fp_farm_gscl_cai_dat_toi_thieu_check;
ALTER TABLE public.fp_farm_gscl_cai_dat
  ADD CONSTRAINT fp_farm_gscl_cai_dat_toi_thieu_check CHECK (so_thung_toi_thieu_ngay BETWEEN 1 AND 1000);

COMMENT ON COLUMN public.fp_farm_gscl_cai_dat.so_thung_toi_thieu_ngay IS
  'Số thùng đã kiểm tối thiểu của một farm trong ngày mới tính % lỗi QC (dưới mức này = chưa đạt kiểm tra)';
COMMENT ON COLUMN public.fp_farm_gscl_cai_dat.ngay_ap_dung_toi_thieu IS
  'Áp dụng số thùng tối thiểu từ ngày này; ngày trước đó vẫn tính % như cũ';

-- 3) Tình hình QC một ngày + chi nhánh ----------------------------------------
-- {so_thung, toi_thieu, ap_dung, ti_le}: ti_le NULL khi ap_dung và so_thung < toi_thieu,
-- hoặc khi chưa có thùng nào (so_thung = 0 và không áp dụng → 0 như 072).
CREATE OR REPLACE FUNCTION public.fn_gscl_qc_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH cd AS (
    SELECT COALESCE((SELECT so_thung_toi_thieu_ngay FROM public.fp_farm_gscl_cai_dat WHERE id = 1), 50) AS toi_thieu,
           COALESCE((SELECT ngay_ap_dung_toi_thieu FROM public.fp_farm_gscl_cai_dat WHERE id = 1), DATE '2026-11-17') AS tu_ngay
  ),
  tong AS (
    SELECT count(*)::integer AS so_thung,
           COALESCE(SUM(c.tong_nhanh), 0)::numeric AS tong_nhanh,
           COALESCE(SUM(public.fn_gscl_so_loi_thung(c.ket_qua, p.tieu_chi)), 0)::numeric AS tong_loi
      FROM public.fp_farm_giam_sat_chat_luong p
      JOIN public.fp_farm_giam_sat_chat_luong_ct c ON c.id_phieu = p.id
     WHERE p.ngay = p_ngay
       AND p.id_chi_nhanh = p_id_chi_nhanh
       AND p.trang_thai <> 'huy'
       AND c.da_kiem
       AND c.tong_nhanh > 0
  )
  SELECT jsonb_build_object(
           'so_thung', t.so_thung,
           'toi_thieu', cd.toi_thieu,
           'ap_dung', p_ngay >= cd.tu_ngay,
           'ti_le', CASE
                      WHEN p_ngay >= cd.tu_ngay AND t.so_thung < cd.toi_thieu THEN NULL
                      WHEN t.tong_nhanh > 0 THEN round(100 * t.tong_loi / t.tong_nhanh, 2)
                      ELSE 0
                    END)
    FROM tong t CROSS JOIN cd;
$$;

COMMENT ON FUNCTION public.fn_gscl_qc_ngay(date, bigint) IS
  'Giám sát chất lượng: {so_thung, toi_thieu, ap_dung, ti_le} của ngày + chi nhánh; ti_le NULL = chưa đạt kiểm tra (thiếu thùng)';

REVOKE ALL ON FUNCTION public.fn_gscl_qc_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_gscl_qc_ngay(date, bigint) TO authenticated;

-- 4) % lỗi QC ngày (giữ chữ ký 072 — các trigger đồng bộ BCSC dùng hàm này) -------
CREATE OR REPLACE FUNCTION public.fn_gscl_ti_le_loi_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT (public.fn_gscl_qc_ngay(p_ngay, p_id_chi_nhanh) ->> 'ti_le')::numeric;
$$;

COMMENT ON FUNCTION public.fn_gscl_ti_le_loi_ngay(date, bigint) IS
  'Giám sát chất lượng: % nải lỗi QC của ngày + chi nhánh (xem fn_gscl_qc_ngay); NULL = chưa đủ số thùng tối thiểu';

-- 5) Ô QC của Báo cáo sơ chế được NULL (= chưa đạt kiểm tra), ô khác vẫn bắt buộc ----
ALTER TABLE public.fp_farm_bao_cao_so_che_ct ALTER COLUMN gia_tri DROP NOT NULL;
ALTER TABLE public.fp_farm_bao_cao_so_che_ct
  DROP CONSTRAINT IF EXISTS fp_farm_bao_cao_so_che_ct_gia_tri_null_check;
ALTER TABLE public.fp_farm_bao_cao_so_che_ct
  ADD CONSTRAINT fp_farm_bao_cao_so_che_ct_gia_tri_null_check
  CHECK (gia_tri IS NOT NULL OR ma_chi_tieu = 'danh_gia_loi_qc_pct');

-- 6) Bộ đếm lỗi trên phiếu ------------------------------------------------------
ALTER TABLE public.fp_farm_giam_sat_chat_luong
  ADD COLUMN IF NOT EXISTS so_loi integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS tong_nhanh_kiem integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS ti_le_loi numeric(6,2);

COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.so_loi IS
  'Tổng số nải lỗi (tiêu chí dem_loi) của các thùng đã kiểm — trigger giữ, không ghi tay';
COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.tong_nhanh_kiem IS
  'Tổng số nhánh/nải của các thùng đã kiểm (tong_nhanh > 0) — trigger giữ';
COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.ti_le_loi IS
  '% lỗi = round(100 × so_loi / tong_nhanh_kiem, 2); NULL khi chưa có thùng — trigger giữ';

CREATE INDEX IF NOT EXISTS idx_fp_farm_gscl_so_loi ON public.fp_farm_giam_sat_chat_luong (so_loi);

-- Tính bộ đếm cho một nhóm phiếu và ghi nếu lệch.
CREATE OR REPLACE FUNCTION public.fn_gscl_cap_nhat_dem_loi(p_ids bigint[])
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.fp_farm_giam_sat_chat_luong p
     SET so_loi = x.so_loi,
         tong_nhanh_kiem = x.tong_nhanh,
         ti_le_loi = CASE WHEN x.tong_nhanh > 0 THEN round(100.0 * x.so_loi / x.tong_nhanh, 2) END
    FROM (
      SELECT g.id,
             COALESCE(SUM(public.fn_gscl_so_loi_thung(c.ket_qua, g.tieu_chi)), 0)::integer AS so_loi,
             COALESCE(SUM(c.tong_nhanh), 0)::integer AS tong_nhanh
        FROM public.fp_farm_giam_sat_chat_luong g
        LEFT JOIN public.fp_farm_giam_sat_chat_luong_ct c
          ON c.id_phieu = g.id AND c.da_kiem AND c.tong_nhanh > 0
       WHERE g.id = ANY (p_ids)
       GROUP BY g.id
    ) x
   WHERE p.id = x.id
     AND (p.so_loi, p.tong_nhanh_kiem) IS DISTINCT FROM (x.so_loi, x.tong_nhanh);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_gscl_cap_nhat_dem_loi(bigint[]) FROM PUBLIC, anon, authenticated;

-- 6a) Thùng đổi → phiếu cha (mức câu lệnh; cascade xoá phiếu thì phiếu đã mất, UPDATE rỗng).
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_dem_loi_thung()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ids bigint[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT array_agg(DISTINCT id_phieu) INTO v_ids FROM new_rows;
  ELSIF TG_OP = 'UPDATE' THEN
    SELECT array_agg(DISTINCT id_phieu) INTO v_ids
      FROM (SELECT id_phieu FROM new_rows UNION SELECT id_phieu FROM old_rows) u;
  ELSE
    SELECT array_agg(DISTINCT id_phieu) INTO v_ids FROM old_rows;
  END IF;
  IF v_ids IS NOT NULL THEN
    PERFORM public.fn_gscl_cap_nhat_dem_loi(v_ids);
  END IF;
  RETURN NULL;
END;
$$;

-- 6b) Phiếu đổi bộ tiêu chí → tính lại ngay trong NEW (không UPDATE vòng).
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_dem_loi_phieu()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_loi integer;
  v_nhanh integer;
BEGIN
  IF NEW.tieu_chi IS NOT DISTINCT FROM OLD.tieu_chi THEN
    RETURN NEW;
  END IF;
  SELECT COALESCE(SUM(public.fn_gscl_so_loi_thung(c.ket_qua, NEW.tieu_chi)), 0)::integer,
         COALESCE(SUM(c.tong_nhanh), 0)::integer
    INTO v_loi, v_nhanh
    FROM public.fp_farm_giam_sat_chat_luong_ct c
   WHERE c.id_phieu = NEW.id AND c.da_kiem AND c.tong_nhanh > 0;
  NEW.so_loi := v_loi;
  NEW.tong_nhanh_kiem := v_nhanh;
  NEW.ti_le_loi := CASE WHEN v_nhanh > 0 THEN round(100.0 * v_loi / v_nhanh, 2) END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_gscl_trg_dem_loi_thung() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_gscl_trg_dem_loi_phieu() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_gscl_dem_loi_ins ON public.fp_farm_giam_sat_chat_luong_ct;
CREATE TRIGGER trg_gscl_dem_loi_ins AFTER INSERT ON public.fp_farm_giam_sat_chat_luong_ct
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_gscl_trg_dem_loi_thung();

DROP TRIGGER IF EXISTS trg_gscl_dem_loi_upd ON public.fp_farm_giam_sat_chat_luong_ct;
CREATE TRIGGER trg_gscl_dem_loi_upd AFTER UPDATE ON public.fp_farm_giam_sat_chat_luong_ct
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_gscl_trg_dem_loi_thung();

DROP TRIGGER IF EXISTS trg_gscl_dem_loi_del ON public.fp_farm_giam_sat_chat_luong_ct;
CREATE TRIGGER trg_gscl_dem_loi_del AFTER DELETE ON public.fp_farm_giam_sat_chat_luong_ct
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_gscl_trg_dem_loi_thung();

DROP TRIGGER IF EXISTS trg_gscl_dem_loi_phieu ON public.fp_farm_giam_sat_chat_luong;
CREATE TRIGGER trg_gscl_dem_loi_phieu BEFORE UPDATE OF tieu_chi ON public.fp_farm_giam_sat_chat_luong
  FOR EACH ROW EXECUTE FUNCTION public.fn_gscl_trg_dem_loi_phieu();

-- 7) Đổi cài đặt tối thiểu → đồng bộ lại Báo cáo sơ chế từ ngày áp dụng ---------
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_cai_dat_toi_thieu()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
BEGIN
  IF (NEW.so_thung_toi_thieu_ngay, NEW.ngay_ap_dung_toi_thieu)
     IS NOT DISTINCT FROM (OLD.so_thung_toi_thieu_ngay, OLD.ngay_ap_dung_toi_thieu) THEN
    RETURN NULL;
  END IF;
  FOR r IN
    SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_bao_cao_so_che
     WHERE ngay >= LEAST(OLD.ngay_ap_dung_toi_thieu, NEW.ngay_ap_dung_toi_thieu)
  LOOP
    PERFORM public.fn_gscl_dong_bo_bcsc(r.ngay, r.id_chi_nhanh);
  END LOOP;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_gscl_trg_cai_dat_toi_thieu() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_gscl_cai_dat_toi_thieu ON public.fp_farm_gscl_cai_dat;
CREATE TRIGGER trg_gscl_cai_dat_toi_thieu
  AFTER UPDATE OF so_thung_toi_thieu_ngay, ngay_ap_dung_toi_thieu ON public.fp_farm_gscl_cai_dat
  FOR EACH ROW EXECUTE FUNCTION public.fn_gscl_trg_cai_dat_toi_thieu();

-- 8) BACKFILL ------------------------------------------------------------------
-- 8a) Bộ đếm lỗi cho mọi phiếu — tắt tạm trigger tg_cap_nhat để không đổi «cập nhật lúc»
--     của mọi phiếu cũ (chạy bằng chủ bảng nên khoá phiếu đã nộp không chặn).
ALTER TABLE public.fp_farm_giam_sat_chat_luong DISABLE TRIGGER trg_update_tg_cap_nhat;
SELECT public.fn_gscl_cap_nhat_dem_loi(array_agg(id)) FROM public.fp_farm_giam_sat_chat_luong;
ALTER TABLE public.fp_farm_giam_sat_chat_luong ENABLE TRIGGER trg_update_tg_cap_nhat;

-- 8b) Báo cáo sơ chế từ ngày áp dụng (ngày cũ không đổi vì hàm tính như trước).
DO $$
DECLARE
  r record;
  v_tu date;
BEGIN
  SELECT ngay_ap_dung_toi_thieu INTO v_tu FROM public.fp_farm_gscl_cai_dat WHERE id = 1;
  FOR r IN SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_bao_cao_so_che
            WHERE ngay >= COALESCE(v_tu, DATE '2026-11-17') LOOP
    PERFORM public.fn_gscl_dong_bo_bcsc(r.ngay, r.id_chi_nhanh);
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- KIỂM TRA SAU KHI CHẠY (scripts/db-sql.sh -c "...")
-- =============================================================================
-- 1) Tình hình QC theo ngày × farm 7 ngày gần nhất (ngày ≥ mốc mà so_thung < 50 → ti_le null):
--    SELECT p.ngay, p.id_chi_nhanh, fn_gscl_qc_ngay(p.ngay, p.id_chi_nhanh)
--      FROM fp_farm_giam_sat_chat_luong p WHERE p.ngay >= current_date - 7
--     GROUP BY 1, 2 ORDER BY 1 DESC, 2;
--
-- 2) Báo cáo sơ chế lệch hàm (kỳ vọng 0 dòng):
--    SELECT b.id, b.ngay, ct.gia_tri, fn_gscl_ti_le_loi_ngay(b.ngay, b.id_chi_nhanh)
--      FROM fp_farm_bao_cao_so_che b
--      JOIN fp_farm_bao_cao_so_che_ct ct ON ct.id_bao_cao = b.id AND ct.ma_chi_tieu = 'danh_gia_loi_qc_pct'
--     WHERE ct.gia_tri IS DISTINCT FROM fn_gscl_ti_le_loi_ngay(b.ngay, b.id_chi_nhanh);
--
-- 3) Bộ đếm lỗi lệch tính tay (kỳ vọng 0 dòng):
--    SELECT p.id, p.so_loi, x.loi FROM fp_farm_giam_sat_chat_luong p
--      JOIN LATERAL (SELECT COALESCE(SUM(fn_gscl_so_loi_thung(c.ket_qua, p.tieu_chi)), 0)::int AS loi
--                      FROM fp_farm_giam_sat_chat_luong_ct c
--                     WHERE c.id_phieu = p.id AND c.da_kiem AND c.tong_nhanh > 0) x ON true
--     WHERE p.so_loi <> x.loi;
-- =============================================================================
