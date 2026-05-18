-- Farm: Báo cáo sơ chế — thêm chỉ tiêu danh_gia_loi_qc_pct (mục 10, section số liệu)
-- Chạy một lần trên DB đã có fp_farm_bao_cao_so_che_ct với CHECK 5 mã cũ.

DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'fp_farm_bao_cao_so_che_ct'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%ma_chi_tieu%'
  LIMIT 1;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.fp_farm_bao_cao_so_che_ct DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.fp_farm_bao_cao_so_che_ct
    ADD CONSTRAINT fp_farm_bcsc_ct_ma_chi_tieu_chk CHECK (
      ma_chi_tieu IN (
        'sl_buong_ton_dau_ngay',
        'tong_buong_thu_hoach',
        'tong_buong_khong_so_che',
        'tong_buong_so_che',
        'sl_buong_ton_cuoi_ngay',
        'danh_gia_loi_qc_pct'
      )
    );

  RAISE NOTICE 'fp_farm_bao_cao_so_che_ct: CHECK ma_chi_tieu đã thêm danh_gia_loi_qc_pct.';
END $$;

-- Phiếu cũ: thêm dòng mặc định 0% nếu chưa có
INSERT INTO public.fp_farm_bao_cao_so_che_ct (id_bao_cao, ma_chi_tieu, gia_tri, don_vi_tinh, ghi_chu, thu_tu)
SELECT sc.id, 'danh_gia_loi_qc_pct', 0, '%', NULL, 6
FROM public.fp_farm_bao_cao_so_che sc
WHERE NOT EXISTS (
  SELECT 1 FROM public.fp_farm_bao_cao_so_che_ct ct
  WHERE ct.id_bao_cao = sc.id AND ct.ma_chi_tieu = 'danh_gia_loi_qc_pct'
);

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_ct.thu_tu IS 'Thứ tự hiển thị (1..6)';
