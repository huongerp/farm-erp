-- =============================================================================
-- Chi phí tài sản – thêm cột ma_phieu (Mã phiếu) + tự sinh CPTS-0001, CPTS-0002, ...
-- Chạy trong Supabase Dashboard → SQL Editor (bảng fp_ts_chi_phi_tai_san đã tồn tại).
-- =============================================================================

-- 1. Thêm cột (nullable tạm để backfill)
ALTER TABLE public.fp_ts_chi_phi_tai_san
  ADD COLUMN IF NOT EXISTS ma_phieu text;

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ma_phieu IS 'Mã phiếu chi phí tài sản – tự sinh CPTS-0001, CPTS-0002, ... (RPC get_next_ma_phieu_chi_phi_tai_san)';

-- 2. Bổ sung mã cho các dòng cũ (theo thứ tự id tăng dần)
DO $$
DECLARE
  r record;
  n bigint := 0;
BEGIN
  FOR r IN
    SELECT id
    FROM public.fp_ts_chi_phi_tai_san
    WHERE ma_phieu IS NULL OR trim(ma_phieu) = ''
    ORDER BY id ASC
  LOOP
    n := n + 1;
    UPDATE public.fp_ts_chi_phi_tai_san
    SET ma_phieu = 'CPTS-' || lpad(n::text, 4, '0')
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- 3. Ràng buộc NOT NULL + unique
ALTER TABLE public.fp_ts_chi_phi_tai_san
  ALTER COLUMN ma_phieu SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_ts_chi_phi_tai_san_ma_phieu
  ON public.fp_ts_chi_phi_tai_san(ma_phieu);

-- 4. Sequence + RPC sinh mã phiếu mới
CREATE SEQUENCE IF NOT EXISTS fp_ts_chi_phi_tai_san_ma_phieu_seq START 1;

CREATE OR REPLACE FUNCTION get_next_ma_phieu_chi_phi_tai_san()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('fp_ts_chi_phi_tai_san_ma_phieu_seq');
  RETURN 'CPTS-' || lpad(next_val::text, 4, '0');
END;
$$;

COMMENT ON FUNCTION get_next_ma_phieu_chi_phi_tai_san() IS 'Trả về mã phiếu chi phí tài sản tiếp theo (CPTS-0001, CPTS-0002, ...)';

GRANT USAGE ON SEQUENCE fp_ts_chi_phi_tai_san_ma_phieu_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_ma_phieu_chi_phi_tai_san() TO authenticated;

-- 5. Đồng bộ sequence sau backfill (max số trong CPTS-xxxx + 1)
DO $$
DECLARE
  max_n bigint;
BEGIN
  SELECT COALESCE(MAX(
    NULLIF(regexp_replace(ma_phieu, '^CPTS-', ''), '')::bigint
  ), 0)
  INTO max_n
  FROM public.fp_ts_chi_phi_tai_san
  WHERE ma_phieu ~ '^CPTS-[0-9]+$';

  PERFORM setval(
    'fp_ts_chi_phi_tai_san_ma_phieu_seq',
    GREATEST(max_n, 1),
    max_n > 0
  );
END;
$$;
