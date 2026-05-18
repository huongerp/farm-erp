-- Farm: Báo cáo sơ chế — bỏ cột derived `so_kg`, `ty_le_pct` trên fp_farm_bao_cao_so_che_pham_cap
-- Chạy SAU khi deploy app chỉ đọc/ghi: ten_pham_cap, so_tham_chieu (kg/thùng), so_thung, so_thung_quy_doi.
--
-- Thứ tự khuyến nghị:
-- 1. Deploy app mới (không SELECT/INSERT so_kg, ty_le_pct).
-- 2. Chạy script này trên Supabase.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
  ) THEN
    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: chưa có bảng — bỏ qua.';
    RETURN;
  END IF;

  -- Dữ liệu cũ: cột “Số” lưu tổng kg trong so_kg, chưa có kg/thùng → backfill so_tham_chieu
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
      AND column_name = 'so_kg'
  ) THEN
    UPDATE public.fp_farm_bao_cao_so_che_pham_cap pc
    SET so_tham_chieu = pc.so_kg / NULLIF(pc.so_thung, 0)
    WHERE COALESCE(pc.so_tham_chieu, 0) = 0
      AND pc.so_thung > 0
      AND COALESCE(pc.so_kg, 0) > 0;

    ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap
      DROP CONSTRAINT IF EXISTS fp_farm_bcsc_pc_ty_le_chk;

    ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap
      DROP COLUMN IF EXISTS so_kg;

    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: đã DROP so_kg.';
  ELSE
    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: không còn cột so_kg — bỏ qua backfill/drop so_kg.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_farm_bao_cao_so_che_pham_cap'
      AND column_name = 'ty_le_pct'
  ) THEN
    ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap
      DROP COLUMN IF EXISTS ty_le_pct;

    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: đã DROP ty_le_pct.';
  ELSE
    RAISE NOTICE 'fp_farm_bao_cao_so_che_pham_cap: không còn cột ty_le_pct.';
  END IF;

  COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.so_tham_chieu IS
    'Kg mỗi thùng (số kg/thùng). Tổng kg = so_thung × so_tham_chieu — tính trên app.';
END $$;
