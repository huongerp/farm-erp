-- =============================================================================
-- 091-dgdv-can-mau-du-bao.sql — Cân mẫu buồng đầu vào (nhà sơ chế) → Dự báo SL đóng thùng
--
-- Nhà sơ chế cân mẫu buồng chuối ở MỖI CHUYẾN XE đầu vào. Phiếu Đánh giá đầu vào (1 phiếu =
-- 1 chuyến: ngay, id_chi_nhanh, chuyen — migration 057) thêm 3 cột:
--   gio_can_mau (tuỳ chọn), so_buong_can_mau, tong_can_nang_mau (kg).
-- Bình quân/buồng = kg ÷ buồng tính ở app (chỉ đọc), không lưu.
--
-- Tổng cả ngày + chi nhánh (cộng MỌI chuyến) chạy sang Dự báo SL đóng thùng
-- (`fp_farm_du_bao_sl_dong_thung`) dòng 1 `so_buong_can_mau` + dòng 2 `tong_can_nang_mau` —
-- KHOÁ, DB trigger ghi đè, đúng khuôn dòng 10 (Tổng thu + KSC, migration 076). Các cột bình quân /
-- khối lượng / số thùng của dự báo là GENERATED từ 2 cột này → không sửa.
--
-- MỐC ÁP DỤNG: chỉ khoá/ghi đè cho ngay >= NGAY_AP_DUNG. Ngày trước mốc giữ số nhập tay (UI vẫn cho
-- nhập). Mốc là hằng DUY NHẤT của file, nằm trong thân `fn_dgdv_can_mau_ngay` (frontend biết qua cột
-- `ap_dung` của RPC, KHÔNG chép hằng này).
--
-- Chạy lại được (IF NOT EXISTS / CREATE OR REPLACE / DROP TRIGGER IF EXISTS).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/091-dgdv-can-mau-du-bao.sql
-- =============================================================================

BEGIN;

-- 1) Cột cân mẫu trên phiếu chuyến ---------------------------------------------------
ALTER TABLE public.fp_farm_dgdv ADD COLUMN IF NOT EXISTS gio_can_mau time;
ALTER TABLE public.fp_farm_dgdv ADD COLUMN IF NOT EXISTS so_buong_can_mau integer NOT NULL DEFAULT 0;
ALTER TABLE public.fp_farm_dgdv ADD COLUMN IF NOT EXISTS tong_can_nang_mau numeric(18,4) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fp_farm_dgdv_so_buong_can_mau_check') THEN
    ALTER TABLE public.fp_farm_dgdv
      ADD CONSTRAINT fp_farm_dgdv_so_buong_can_mau_check CHECK (so_buong_can_mau >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fp_farm_dgdv_tong_can_nang_mau_check') THEN
    ALTER TABLE public.fp_farm_dgdv
      ADD CONSTRAINT fp_farm_dgdv_tong_can_nang_mau_check CHECK (tong_can_nang_mau >= 0);
  END IF;
  -- Có trọng lượng thì phải có buồng (bình quân/buồng mới tính được).
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fp_farm_dgdv_can_mau_check') THEN
    ALTER TABLE public.fp_farm_dgdv
      ADD CONSTRAINT fp_farm_dgdv_can_mau_check CHECK (so_buong_can_mau > 0 OR tong_can_nang_mau = 0);
  END IF;
END $$;

COMMENT ON COLUMN public.fp_farm_dgdv.gio_can_mau IS 'Giờ cân mẫu buồng của chuyến (tuỳ chọn)';
COMMENT ON COLUMN public.fp_farm_dgdv.so_buong_can_mau IS 'Số buồng cân mẫu của chuyến (migration 091)';
COMMENT ON COLUMN public.fp_farm_dgdv.tong_can_nang_mau IS 'Tổng trọng lượng cân mẫu của chuyến, kg (migration 091)';

-- 2) Σ cân mẫu của (ngày, chi nhánh) — cộng MỌI chuyến --------------------------------
-- Luôn trả đúng 1 dòng (không có phiếu → 0, 0). `ap_dung` = ngày đã qua mốc → dự báo khoá dòng 1–2.
CREATE OR REPLACE FUNCTION public.fn_dgdv_can_mau_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS TABLE (so_buong bigint, tong_kg numeric, ap_dung boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(SUM(p.so_buong_can_mau), 0)::bigint,
         COALESCE(SUM(p.tong_can_nang_mau), 0)::numeric,
         (p_ngay IS NOT NULL AND p_ngay >= DATE '2026-11-23')  -- NGAY_AP_DUNG: chốt khi chạy
    FROM public.fp_farm_dgdv p
   WHERE p.ngay = p_ngay
     AND p.id_chi_nhanh = p_id_chi_nhanh;
$$;

COMMENT ON FUNCTION public.fn_dgdv_can_mau_ngay(date, bigint) IS
  'Đánh giá đầu vào: Σ buồng + Σ kg cân mẫu của MỌI chuyến trong ngày + chi nhánh; ap_dung = ngày >= mốc khoá dòng 1–2 dự báo';

REVOKE ALL ON FUNCTION public.fn_dgdv_can_mau_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dgdv_can_mau_ngay(date, bigint) TO authenticated;

-- 3) Khoá dòng 1–2 khi lưu dự báo ---------------------------------------------------
-- Giữ nguyên phần dòng 10 (076); thêm ghi đè 2 cột cân mẫu khi ngày >= mốc.
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
    GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) + COALESCE(v_ksc, 0) - COALESCE(v_cuoi, 0))::integer;

  SELECT t.so_buong, t.tong_kg, t.ap_dung INTO v_buong, v_kg, v_ap
    FROM public.fn_dgdv_can_mau_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  IF COALESCE(v_ap, false) THEN
    NEW.so_buong_can_mau := COALESCE(v_buong, 0)::integer;
    NEW.tong_can_nang_mau := COALESCE(v_kg, 0);
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Đồng bộ dự báo (076) + 2 cột cân mẫu khi qua mốc --------------------------------
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
  v_nhap := GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) + v_ksc - COALESCE(v_cuoi, 0))::integer;
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

-- Hàm nội bộ (chỉ trigger gọi, chạy với quyền chủ hàm) → không cấp cho ai (như 060/076).
REVOKE ALL ON FUNCTION public.fn_du_bao_dong_bo(date, bigint) FROM PUBLIC, anon, authenticated;

-- 5) Phiếu ĐGĐV đổi cân mẫu → đồng bộ dự báo ----------------------------------------
-- 5a) Trigger sửa phiếu (057 mục 5c): thêm ca đổi cân mẫu. `CREATE OR REPLACE` được (không đổi
--     tham số / kiểu trả về), nhưng vẫn DROP trigger + hàm để chạy lại nhiều lần vẫn sạch.
DROP TRIGGER IF EXISTS trg_dgdv_dong_bo_upd ON public.fp_farm_dgdv;
DROP FUNCTION IF EXISTS public.fn_dgdv_trg_dong_bo_phieu_sua();
CREATE FUNCTION public.fn_dgdv_trg_dong_bo_phieu_sua()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF (NEW.ngay, NEW.id_chi_nhanh) IS DISTINCT FROM (OLD.ngay, OLD.id_chi_nhanh) THEN
    PERFORM public.fn_dgdv_dong_bo_ngay(OLD.ngay, OLD.id_chi_nhanh);
    PERFORM public.fn_dgdv_dong_bo_ngay(NEW.ngay, NEW.id_chi_nhanh);
  END IF;
  -- Cân mẫu đổi (cùng ngày + chi nhánh) → chỉ cần đồng bộ dự báo của cặp này.
  IF (NEW.so_buong_can_mau, NEW.tong_can_nang_mau) IS DISTINCT FROM (OLD.so_buong_can_mau, OLD.tong_can_nang_mau) THEN
    PERFORM public.fn_du_bao_dong_bo(NEW.ngay, NEW.id_chi_nhanh);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_dgdv_trg_dong_bo_phieu_sua() FROM PUBLIC, anon;

-- Trùng tên trg_dgdv_dong_bo_upd ở 052/057 → DROP + CREATE để cột theo dõi chắc chắn là bản mới.
CREATE TRIGGER trg_dgdv_dong_bo_upd
  AFTER UPDATE OF ngay, id_chi_nhanh, so_buong_can_mau, tong_can_nang_mau ON public.fp_farm_dgdv
  FOR EACH ROW EXECUTE FUNCTION public.fn_dgdv_trg_dong_bo_phieu_sua();

-- 5b) Chèn phiếu chuyến có cân mẫu → đồng bộ dự báo (comment 057 «INSERT không đổi tổng» nay
--     không còn đúng với cân mẫu; dòng 10 vẫn giữ nguyên vì INSERT không thêm ô lưới).
CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_can_mau_ins()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.so_buong_can_mau > 0 THEN
    PERFORM public.fn_du_bao_dong_bo(NEW.ngay, NEW.id_chi_nhanh);
  END IF;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_dgdv_trg_can_mau_ins() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_dgdv_can_mau_ins ON public.fp_farm_dgdv;
CREATE TRIGGER trg_dgdv_can_mau_ins
  AFTER INSERT ON public.fp_farm_dgdv
  FOR EACH ROW EXECUTE FUNCTION public.fn_dgdv_trg_can_mau_ins();

-- (Xoá phiếu đã có fn_dgdv_trg_dong_bo_phieu_xoa → fn_dgdv_dong_bo_ngay → fn_du_bao_dong_bo lo.)

-- 6) View tổng chuyến: + 3 cột cân mẫu NỐI CUỐI (Postgres chỉ cho thêm đuôi) --------------
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
       COALESCE(d.so_luong_huy, 0)::bigint AS ksc,
       p.gio_can_mau,
       p.so_buong_can_mau,
       p.tong_can_nang_mau
FROM public.fp_farm_dgdv p
LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = p.id_chi_nhanh
LEFT JOIN LATERAL (
  SELECT SUM(x.so_luong) AS so_luong, SUM(x.so_luong_huy) AS so_luong_huy
  FROM public.fp_farm_dgdv_lo l JOIN public.fp_farm_dgdv_dong x ON x.id_phieu_lo = l.id
  WHERE l.id_phieu = p.id
) d ON true
LEFT JOIN LATERAL (
  SELECT SUM(x.dut_day) AS dut_day
  FROM public.fp_farm_dgdv_lo l JOIN public.fp_farm_dgdv_lo_ngay x ON x.id_phieu_lo = l.id
  WHERE l.id_phieu = p.id
) n ON true;

COMMENT ON VIEW public.v_fp_farm_dgdv_tong_chuyen IS
  'Đánh giá đầu vào: 1 dòng / phiếu chuyến kèm tổng SL, đứt dây, tổng thu (= SL + đứt dây), KSC (= Σ SL lỗi), cân mẫu buồng (091)';

REVOKE ALL ON TABLE public.v_fp_farm_dgdv_tong_chuyen FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.v_fp_farm_dgdv_tong_chuyen TO authenticated;

-- 7) Backfill + kiểm tra ------------------------------------------------------------
-- Mốc KHÔNG chép lại ở đây: chỉ nằm trong thân `fn_dgdv_can_mau_ngay`; ngày trước mốc
-- `fn_du_bao_dong_bo` tự giữ nguyên dòng 1–2 nên backfill cả bảng là an toàn.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_du_bao_sl_dong_thung LOOP
    PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
  END LOOP;

  IF EXISTS (
       SELECT 1 FROM public.fp_farm_du_bao_sl_dong_thung d
       CROSS JOIN LATERAL public.fn_dgdv_can_mau_ngay(d.ngay, d.id_chi_nhanh) f
       WHERE f.ap_dung
         AND (d.so_buong_can_mau, d.tong_can_nang_mau) IS DISTINCT FROM (f.so_buong::integer, f.tong_kg)
     ) THEN
    RAISE EXCEPTION 'Dự báo SL đóng thùng: dòng 1–2 lệch Σ cân mẫu Đánh giá đầu vào sau backfill';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
