-- =============================================================================
-- View: v_tc_quy_so_du — số dư quỹ hiện tại của từng chi nhánh (1 dòng / chi nhánh)
-- Rẻ hơn nhiều so với đọc dòng cuối của v_tc_quy_thu_chi_summary (không chạy
-- window). Dùng cho: stat card, ô "Tồn quỹ hiện tại" trong form nhập phiếu,
-- dòng tổng ở chân bảng danh sách.
-- Chạy sau: fp_tc_quy_thu_chi, fp_var_chi_nhanh
-- =============================================================================

CREATE OR REPLACE VIEW public.v_tc_quy_so_du AS
SELECT
  p.id_chi_nhanh,
  cn.ten_chi_nhanh AS ref_ten_chi_nhanh,
  COUNT(*)::int AS so_phieu,
  COALESCE(SUM(CASE WHEN p.loai = 'thu' THEN p.so_tien ELSE 0 END), 0)::numeric AS tong_thu,
  COALESCE(SUM(CASE WHEN p.loai = 'chi' THEN p.so_tien ELSE 0 END), 0)::numeric AS tong_chi,
  COALESCE(SUM(CASE WHEN p.loai = 'thu' THEN p.so_tien ELSE -p.so_tien END), 0)::numeric AS ton_quy_hien_tai,
  MIN(p.ngay) AS ngay_dau,
  MAX(p.ngay) AS ngay_cuoi
FROM public.fp_tc_quy_thu_chi p
LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = p.id_chi_nhanh
GROUP BY p.id_chi_nhanh, cn.ten_chi_nhanh;

COMMENT ON VIEW public.v_tc_quy_so_du IS 'Số dư quỹ tiền mặt hiện tại theo chi nhánh (tổng thu - tổng chi toàn sổ)';

ALTER VIEW public.v_tc_quy_so_du SET (security_invoker = true);

GRANT SELECT ON public.v_tc_quy_so_du TO authenticated;
GRANT SELECT ON public.v_tc_quy_so_du TO anon;
