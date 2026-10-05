-- =============================================================================
-- 019-gscl-so-phieu-theo-ngay.sql — Giám sát chất lượng: số phiếu PPP-MM-DD theo ngày
--
-- Số phiếu đổi từ GS-00012 sang "PPP-MM-DD": PPP = thứ tự phiếu (cây hàng) trong ngày,
-- MM-DD = tháng-ngày của phiếu → nhìn số cuối trong ngày là biết hôm đó kiểm bao nhiêu cây hàng.
--   vd phiếu thứ 1 ngày 04/10 → 001-10-04
-- MM-DD lặp lại mỗi năm nên số phiếu KHÔNG còn unique; duy nhất là (ngay, stt_trong_ngay).
-- Mã tem trong QR thêm năm để vẫn duy nhất: YYYY-PPP-MM-DD-SS (vd 2026-001-10-04-03).
-- Đổi ngày phiếu → cấp số mới theo ngày mới + sinh lại mã tem (tem cũ phải in lại).
-- Dữ liệu cũ được đánh số lại theo (ngay, id) — tem đã in theo mã GS-xxxxx không quét được nữa.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-019
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/019-gscl-so-phieu-theo-ngay.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_giam_sat_chat_luong ADD COLUMN stt_trong_ngay integer;

-- 1) Đánh số lại dữ liệu cũ (chạy bằng role chủ → trigger khoá phiếu đã nộp không chặn).
UPDATE public.fp_farm_giam_sat_chat_luong t
   SET stt_trong_ngay = s.rn,
       so_phieu = lpad(s.rn::text, 3, '0') || '-' || to_char(t.ngay, 'MM-DD')
  FROM (SELECT id, row_number() OVER (PARTITION BY ngay ORDER BY id) AS rn
          FROM public.fp_farm_giam_sat_chat_luong) s
 WHERE s.id = t.id;

UPDATE public.fp_farm_giam_sat_chat_luong_ct ct
   SET ma_tem = to_char(p.ngay, 'YYYY') || '-' || p.so_phieu || '-' || lpad(ct.stt_thung::text, 2, '0')
  FROM public.fp_farm_giam_sat_chat_luong p
 WHERE p.id = ct.id_phieu;

-- 2) Ràng buộc mới.
ALTER TABLE public.fp_farm_giam_sat_chat_luong
  DROP CONSTRAINT fp_farm_giam_sat_chat_luong_so_phieu_key,
  ALTER COLUMN stt_trong_ngay SET NOT NULL,
  ADD CONSTRAINT fp_farm_gscl_stt_trong_ngay_check CHECK (stt_trong_ngay BETWEEN 1 AND 999),
  ADD CONSTRAINT fp_farm_gscl_ngay_stt_key UNIQUE (ngay, stt_trong_ngay);

COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.so_phieu IS
  'PPP-MM-DD: thứ tự phiếu trong ngày + tháng-ngày (trigger cấp). Không unique — lặp lại mỗi năm';
COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.stt_trong_ngay IS 'Thứ tự phiếu trong ngày (1–999)';
COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong_ct.ma_tem IS
  'Nội dung QR trên tem: YYYY-PPP-MM-DD-SS (app thêm tiền tố GSCL:)';

-- 3) Cấp số phiếu khi tạo / đổi ngày. max+1 (không đếm) để không trùng sau khi xoá phiếu;
--    khoá theo ngày để hai người tạo cùng lúc không lấy cùng số.
CREATE OR REPLACE FUNCTION public.fn_farm_gscl_cap_so_phieu() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_stt integer;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.ngay IS NOT DISTINCT FROM OLD.ngay THEN
    RETURN NEW;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('gscl:' || NEW.ngay::text));
  SELECT COALESCE(max(stt_trong_ngay), 0) + 1 INTO v_stt
    FROM public.fp_farm_giam_sat_chat_luong
   WHERE ngay = NEW.ngay AND id IS DISTINCT FROM NEW.id;
  IF v_stt > 999 THEN
    RAISE EXCEPTION 'Ngày % đã đủ 999 phiếu giám sát — không cấp thêm số được.', to_char(NEW.ngay, 'DD/MM/YYYY')
      USING ERRCODE = 'P0001';
  END IF;
  NEW.stt_trong_ngay := v_stt;
  NEW.so_phieu := lpad(v_stt::text, 3, '0') || '-' || to_char(NEW.ngay, 'MM-DD');
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_farm_gscl_cap_so_phieu
  BEFORE INSERT OR UPDATE OF ngay ON public.fp_farm_giam_sat_chat_luong
  FOR EACH ROW EXECUTE FUNCTION public.fn_farm_gscl_cap_so_phieu();

-- Trigger tạo phiếu cũ: chỉ còn chụp bộ tiêu chí (số phiếu do trigger trên cấp).
CREATE OR REPLACE FUNCTION public.fn_farm_gscl_truoc_khi_tao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.tieu_chi IS NULL OR NEW.tieu_chi = '[]'::jsonb THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'ma', tc.ma, 'ten', tc.ten, 'loai', tc.loai, 'don_vi', tc.don_vi,
             'nguong_min', tc.nguong_min, 'nguong_max', tc.nguong_max
           ) ORDER BY tc.thu_tu, tc.id), '[]'::jsonb)
      INTO NEW.tieu_chi
      FROM public.fp_farm_gscl_tieu_chi tc
     WHERE tc.dang_dung;
  END IF;
  RETURN NEW;
END
$$;

-- 4) Thùng mẫu: sinh / cắt theo so_thung_mau + mã tem theo số phiếu mới.
--    Chạy cả khi đổi ngày (số phiếu đổi theo) — trigger UPDATE OF chỉ nhìn cột trong câu SET.
CREATE OR REPLACE FUNCTION public.fn_farm_gscl_dong_bo_thung() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_goc text := to_char(NEW.ngay, 'YYYY') || '-' || NEW.so_phieu || '-';
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.fp_farm_giam_sat_chat_luong_ct
     WHERE id_phieu = NEW.id AND stt_thung > NEW.so_thung_mau AND da_kiem
  ) THEN
    RAISE EXCEPTION 'Không giảm số thùng mẫu xuống % được: đã có thùng số lớn hơn được kiểm', NEW.so_thung_mau
      USING ERRCODE = 'P0001';
  END IF;

  DELETE FROM public.fp_farm_giam_sat_chat_luong_ct
   WHERE id_phieu = NEW.id AND stt_thung > NEW.so_thung_mau;

  UPDATE public.fp_farm_giam_sat_chat_luong_ct
     SET ma_tem = v_goc || lpad(stt_thung::text, 2, '0')
   WHERE id_phieu = NEW.id
     AND ma_tem IS DISTINCT FROM v_goc || lpad(stt_thung::text, 2, '0');

  INSERT INTO public.fp_farm_giam_sat_chat_luong_ct (id_phieu, stt_thung, ma_tem)
  SELECT NEW.id, g, v_goc || lpad(g::text, 2, '0')
    FROM generate_series(1, NEW.so_thung_mau) AS g
  ON CONFLICT (id_phieu, stt_thung) DO NOTHING;

  RETURN NULL;
END
$$;

DROP TRIGGER trg_farm_gscl_dong_bo_thung ON public.fp_farm_giam_sat_chat_luong;
CREATE TRIGGER trg_farm_gscl_dong_bo_thung
  AFTER INSERT OR UPDATE OF so_thung_mau, ngay, so_phieu ON public.fp_farm_giam_sat_chat_luong
  FOR EACH ROW EXECUTE FUNCTION public.fn_farm_gscl_dong_bo_thung();

REVOKE ALL ON FUNCTION public.fn_farm_gscl_cap_so_phieu() FROM PUBLIC, anon;

COMMIT;

NOTIFY pgrst, 'reload schema';
