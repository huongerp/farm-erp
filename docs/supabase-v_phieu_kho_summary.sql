-- =============================================================================
-- View: v_phieu_kho_summary
-- Mục đích: Phiếu kho + aggregate chi tiết + JOIN tên kho / đối tác / nhân viên
--
-- Khuyến nghị: chạy một lần file docs/supabase-update-phieu-kho-id-don-dat-hang.sql
-- (đủ ALTER bảng + DROP + CREATE cả hai view).
--
-- Nếu chạy riêng file này: bảng fp_mh_phieu_kho phải đã có cột id_don_dat_hang
-- (lỗi 42703 nếu chưa ALTER). View cũ phải DROP trước (lỗi 42P16 nếu chỉ REPLACE).
-- =============================================================================

DROP VIEW IF EXISTS public.v_phieu_kho_summary CASCADE;

CREATE VIEW public.v_phieu_kho_summary AS
SELECT
  pk.*,
  COALESCE(agg.so_dong, 0)::int AS so_dong,
  COALESCE(agg.tong_so_luong, 0)::numeric AS tong_so_luong,
  COALESCE(agg.tong_tien, 0)::numeric AS tong_tien,
  kho_ref.ten_kho AS ref_ten_kho,
  kho_den_ref.ten_kho AS ref_ten_kho_den,
  ncc.ten_doi_tac AS ref_ten_nha_cung_cap,
  kh.ten_doi_tac AS ref_ten_khach_hang,
  nv_t.ho_va_ten AS ref_ten_nguoi_tao,
  nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
  dd.so_po AS ref_so_po_don_dat_hang
FROM public.fp_mh_phieu_kho pk
LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON kho_ref.id = pk.kho_id
LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON kho_den_ref.id = pk.kho_den_id
LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc ON ncc.id = pk.id_nha_cung_cap
LEFT JOIN public.fp_mh_danh_sach_doi_tac kh ON kh.id = pk.id_khach_hang
LEFT JOIN public.fp_var_nhan_vien nv_t ON nv_t.id = pk.nguoi_tao_id
LEFT JOIN public.fp_var_nhan_vien nv_d ON nv_d.id = pk.id_nguoi_duyet
LEFT JOIN public.fp_mh_don_dat_hang dd ON dd.id = pk.id_don_dat_hang
LEFT JOIN LATERAL (
  SELECT
    COUNT(*)::int AS so_dong,
    SUM(ct.so_luong) AS tong_so_luong,
    SUM(ct.thanh_tien) AS tong_tien
  FROM public.fp_mh_phieu_kho_chi_tiet ct
  WHERE ct.id_phieu_kho = pk.id
) agg ON true;

COMMENT ON VIEW public.v_phieu_kho_summary IS 'Phiếu kho + aggregate + JOIN tên (giảm egress app)';

ALTER VIEW public.v_phieu_kho_summary SET (security_invoker = true);

GRANT SELECT ON public.v_phieu_kho_summary TO authenticated;
GRANT SELECT ON public.v_phieu_kho_summary TO anon;
