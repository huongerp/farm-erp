-- =============================================================================
-- 002-phieu-hanh-chinh-tu-den-ngay.sql — phiếu hành chính nhập theo khoảng
-- "từ ngày (buổi) → đến ngày (buổi)" thay cho "1 ngày + ca".
-- Chạy: psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -f docs/migrations/002-phieu-hanh-chinh-tu-den-ngay.sql
--
-- - `ngay` GIỮ NGUYÊN, nghĩa là "từ ngày" (sort, tìm kiếm, payload thông báo dùng tiếp).
-- - Thêm `den_ngay`, `tu_buoi`, `den_buoi` ('Sáng' | 'Chiều'): bắt đầu nghỉ TỪ buổi
--   nào của từ ngày, nghỉ HẾT buổi nào của đến ngày. Chiều 01 → sáng 03 = 2 ngày.
-- - `ca` chỉ còn ý nghĩa cho phiếu trong 1 ngày (Sáng / Chiều / Cả ngày); phiếu nhiều
--   ngày để null.
-- - Số ngày KHÔNG lưu: app tính lại từ 4 trường (features/hanh-chinh/phieu-hanh-chinh/
--   core/khoang-nghi.ts, trừ Chủ nhật với loại nghỉ / công tác).
-- - Trigger BEFORE tự suy 3 cột mới từ `ngay` + `ca` khi người ghi không gửi chúng
--   (frontend bản cũ còn đang chạy lúc deploy, hoặc SQL tay) để NOT NULL không chặn ghi.
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_hr_phieu_hanh_chinh
  ADD COLUMN IF NOT EXISTS den_ngay date,
  ADD COLUMN IF NOT EXISTS tu_buoi text,
  ADD COLUMN IF NOT EXISTS den_buoi text;

-- Điền dữ liệu cũ: phiếu 1 ngày, buổi suy từ ca.
UPDATE public.fp_hr_phieu_hanh_chinh
SET den_ngay = ngay,
    tu_buoi  = CASE WHEN ca = 'Chiều' THEN 'Chiều' ELSE 'Sáng' END,
    den_buoi = CASE WHEN ca = 'Sáng'  THEN 'Sáng'  ELSE 'Chiều' END
WHERE den_ngay IS NULL OR tu_buoi IS NULL OR den_buoi IS NULL;

CREATE OR REPLACE FUNCTION public.fn_phieu_hc_dien_khoang() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Người ghi không đụng tới khoảng nhưng đổi ngày / ca (client cũ, SQL tay) → suy lại.
  IF TG_OP = 'UPDATE'
     AND NEW.den_ngay IS NOT DISTINCT FROM OLD.den_ngay
     AND NEW.tu_buoi  IS NOT DISTINCT FROM OLD.tu_buoi
     AND NEW.den_buoi IS NOT DISTINCT FROM OLD.den_buoi
     AND (NEW.ngay IS DISTINCT FROM OLD.ngay OR NEW.ca IS DISTINCT FROM OLD.ca)
     AND NEW.ca IS NOT NULL THEN
    NEW.den_ngay := NEW.ngay;
    NEW.tu_buoi  := NULL;
    NEW.den_buoi := NULL;
  END IF;

  IF NEW.den_ngay IS NULL THEN NEW.den_ngay := NEW.ngay; END IF;
  IF NEW.tu_buoi  IS NULL THEN NEW.tu_buoi  := CASE WHEN NEW.ca = 'Chiều' THEN 'Chiều' ELSE 'Sáng' END; END IF;
  IF NEW.den_buoi IS NULL THEN NEW.den_buoi := CASE WHEN NEW.ca = 'Sáng'  THEN 'Sáng'  ELSE 'Chiều' END; END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_phieu_hc_dien_khoang() IS
  'Suy den_ngay / tu_buoi / den_buoi từ ngay + ca khi người ghi không gửi (client cũ, SQL tay).';

DROP TRIGGER IF EXISTS tr_phieu_hc_dien_khoang ON public.fp_hr_phieu_hanh_chinh;
CREATE TRIGGER tr_phieu_hc_dien_khoang
  BEFORE INSERT OR UPDATE ON public.fp_hr_phieu_hanh_chinh
  FOR EACH ROW EXECUTE FUNCTION public.fn_phieu_hc_dien_khoang();

ALTER TABLE public.fp_hr_phieu_hanh_chinh
  ALTER COLUMN den_ngay SET NOT NULL,
  ALTER COLUMN tu_buoi  SET NOT NULL,
  ALTER COLUMN den_buoi SET NOT NULL;

ALTER TABLE public.fp_hr_phieu_hanh_chinh
  DROP CONSTRAINT IF EXISTS fp_hr_phieu_hanh_chinh_buoi_check,
  DROP CONSTRAINT IF EXISTS fp_hr_phieu_hanh_chinh_khoang_check;

ALTER TABLE public.fp_hr_phieu_hanh_chinh
  ADD CONSTRAINT fp_hr_phieu_hanh_chinh_buoi_check
    CHECK (tu_buoi IN ('Sáng', 'Chiều') AND den_buoi IN ('Sáng', 'Chiều')),
  ADD CONSTRAINT fp_hr_phieu_hanh_chinh_khoang_check
    CHECK (den_ngay > ngay OR (den_ngay = ngay AND NOT (tu_buoi = 'Chiều' AND den_buoi = 'Sáng')));

CREATE INDEX IF NOT EXISTS fp_hr_phieu_hanh_chinh_nguoi_khoang_idx
  ON public.fp_hr_phieu_hanh_chinh (nguoi_tao_id, ngay, den_ngay);

COMMIT;

NOTIFY pgrst, 'reload schema';
