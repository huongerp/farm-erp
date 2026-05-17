-- =============================================================================
-- (Tùy chọn) Chuyển KPI / thưởng từ báo cáo nhân công sang báo cáo sơ chế
-- Khớp cặp (ngày, chi nhánh) giữa fp_farm_bao_cao_nhan_cong và fp_farm_bao_cao_so_che.
-- Chạy sau: supabase-fp_farm_bao_cao_so_che_kpi.sql
-- =============================================================================

INSERT INTO public.fp_farm_bao_cao_so_che_kpi (
  id_bao_cao,
  thu_tu,
  ten_hang_muc,
  don_vi_tinh,
  muc_tieu,
  thuc_te,
  phan_tram,
  danh_gia,
  tien_thuong,
  ghi_chu
)
SELECT
  sc.id,
  k.thu_tu,
  k.ten_hang_muc,
  k.don_vi_tinh,
  k.muc_tieu,
  k.thuc_te,
  k.phan_tram,
  k.danh_gia,
  k.tien_thuong,
  k.ghi_chu
FROM public.fp_farm_bao_cao_nhan_cong_kpi k
JOIN public.fp_farm_bao_cao_nhan_cong nc ON nc.id = k.id_bao_cao
JOIN public.fp_farm_bao_cao_so_che sc
  ON sc.ngay = nc.ngay AND sc.id_chi_nhanh = nc.id_chi_nhanh
WHERE NOT EXISTS (
  SELECT 1 FROM public.fp_farm_bao_cao_so_che_kpi x WHERE x.id_bao_cao = sc.id
);
