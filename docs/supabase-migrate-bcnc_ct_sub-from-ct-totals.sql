-- =============================================================================
-- (Tùy chọn) Tạo 1 dòng sub / chỉ tiêu từ tổng hiện có trên fp_farm_bao_cao_nhan_cong_ct
-- Chạy sau: docs/supabase-fp_farm_bao_cao_nhan_cong_ct_sub.sql
-- Chỉ insert khi dòng ct chưa có sub nào.
-- =============================================================================

INSERT INTO public.fp_farm_bao_cao_nhan_cong_ct_sub (id_bcnc_ct, loai_chi_tieu, thu_tu, sl_cong, so_gio, ghi_chu)
SELECT ct.id, 'CN_NGAY', 1, ct.sl_cong_ngay, 0, NULL
FROM public.fp_farm_bao_cao_nhan_cong_ct ct
WHERE ct.sl_cong_ngay > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.fp_farm_bao_cao_nhan_cong_ct_sub s
    WHERE s.id_bcnc_ct = ct.id AND s.loai_chi_tieu = 'CN_NGAY'
  );

INSERT INTO public.fp_farm_bao_cao_nhan_cong_ct_sub (id_bcnc_ct, loai_chi_tieu, thu_tu, sl_cong, so_gio, ghi_chu)
SELECT ct.id, 'CN_NUA', 1, ct.sl_cong_nua, 0, NULL
FROM public.fp_farm_bao_cao_nhan_cong_ct ct
WHERE ct.sl_cong_nua > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.fp_farm_bao_cao_nhan_cong_ct_sub s
    WHERE s.id_bcnc_ct = ct.id AND s.loai_chi_tieu = 'CN_NUA'
  );

INSERT INTO public.fp_farm_bao_cao_nhan_cong_ct_sub (id_bcnc_ct, loai_chi_tieu, thu_tu, sl_cong, so_gio, ghi_chu)
SELECT ct.id, 'TANG_CA', 1, ct.sl_tang_ca, ct.so_gio_tc, NULL
FROM public.fp_farm_bao_cao_nhan_cong_ct ct
WHERE (ct.sl_tang_ca > 0 OR ct.so_gio_tc > 0)
  AND NOT EXISTS (
    SELECT 1 FROM public.fp_farm_bao_cao_nhan_cong_ct_sub s
    WHERE s.id_bcnc_ct = ct.id AND s.loai_chi_tieu = 'TANG_CA'
  );
