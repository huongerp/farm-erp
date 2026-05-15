-- =============================================================================
-- Farm: Báo cáo sơ chế — đổi fp_farm_bao_cao_so_che_pham_cap từ ma cố định → ten_pham_cap
-- Chạy khi bảng đã tạo theo bản cũ (cột ma_pham_cap + CHECK + unique ma).
-- Idempotent: nếu đã có ten_pham_cap và không còn ma_pham_cap thì bỏ qua.
-- =============================================================================

DO $mig_pc_ten$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
  ) THEN
    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: chưa có bảng — chạy add_pham_cap trước.';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
      AND column_name = 'ten_pham_cap'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
      AND column_name = 'ma_pham_cap'
  ) THEN
    UPDATE public.fp_farm_bao_cao_so_che_pham_cap
    SET ten_pham_cap = CASE ma_pham_cap::text
      WHEN 'nhai' THEN 'Nải'
      WHEN 'cp' THEN 'CP'
      WHEN 'cl' THEN 'CL'
      WHEN 'noi_dia' THEN 'Nội địa'
      WHEN 'noi_dia_8kg' THEN 'Nội địa 8kg'
      WHEN '18kg' THEN '18KG'
      ELSE coalesce(nullif(btrim(ten_pham_cap), ''), ma_pham_cap::text)
    END;
    UPDATE public.fp_farm_bao_cao_so_che_pham_cap SET ten_pham_cap = '(chưa đặt tên)'
    WHERE ten_pham_cap IS NULL OR btrim(ten_pham_cap) = '';
    ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap ALTER COLUMN ten_pham_cap SET NOT NULL;
    ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap DROP CONSTRAINT IF EXISTS fp_farm_bcsc_pc_ma_chk;
    DROP INDEX IF EXISTS public.uq_fp_farm_bcsc_pc_bao_cao_ma;
    ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap DROP COLUMN ma_pham_cap;
    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: hoàn tất migrate (còn cả ma và ten).';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
      AND column_name = 'ten_pham_cap'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
      AND column_name = 'ma_pham_cap'
  ) THEN
    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: đã dùng ten_pham_cap — bỏ qua.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
      AND column_name = 'ma_pham_cap'
  ) THEN
    RAISE EXCEPTION 'fp_farm_bao_cao_so_che_pham_cap: thiếu ma_pham_cap — trạng thái bảng không khớp script migrate.';
  END IF;

  ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap ADD COLUMN IF NOT EXISTS ten_pham_cap text;

  UPDATE public.fp_farm_bao_cao_so_che_pham_cap SET ten_pham_cap = CASE ma_pham_cap::text
    WHEN 'nhai' THEN 'Nải'
    WHEN 'cp' THEN 'CP'
    WHEN 'cl' THEN 'CL'
    WHEN 'noi_dia' THEN 'Nội địa'
    WHEN 'noi_dia_8kg' THEN 'Nội địa 8kg'
    WHEN '18kg' THEN '18KG'
    ELSE ma_pham_cap::text
  END
  WHERE ten_pham_cap IS NULL OR btrim(ten_pham_cap) = '';

  UPDATE public.fp_farm_bao_cao_so_che_pham_cap
  SET ten_pham_cap = '(chưa đặt tên)'
  WHERE ten_pham_cap IS NULL OR btrim(ten_pham_cap) = '';

  ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap ALTER COLUMN ten_pham_cap SET NOT NULL;

  ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap DROP CONSTRAINT IF EXISTS fp_farm_bcsc_pc_ma_chk;

  DROP INDEX IF EXISTS public.uq_fp_farm_bcsc_pc_bao_cao_ma;

  ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap DROP COLUMN ma_pham_cap;

  COMMENT ON TABLE public.fp_farm_bao_cao_so_che_pham_cap IS
    'Phẩm cấp / loại thùng: nhiều dòng / phiếu; tên loại do người dùng nhập.';
  COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.ten_pham_cap IS 'Tên loại phẩm cấp (tự do)';

  RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: migrate ma → ten xong.';
END
$mig_pc_ten$;
