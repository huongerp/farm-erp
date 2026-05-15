-- =============================================================================
-- Seed dữ liệu mẫu: fp_farm_bao_cao_nhan_cong + fp_farm_bao_cao_nhan_cong_ct
-- Chạy sau docs/supabase-fp_farm_bao_cao_nhan_cong.sql
-- Một lần chèn: chỉ khi bảng cha đang trống; chi tiết gắn đúng phiếu vừa tạo (CTE RETURNING).
-- =============================================================================

WITH ins AS (
  INSERT INTO public.fp_farm_bao_cao_nhan_cong (
    ngay,
    id_chi_nhanh,
    ten_chi_nhanh,
    ghi_chu,
    id_nguoi_tao
  )
  SELECT
    (CURRENT_DATE - INTERVAL '1 day')::date,
    (SELECT id FROM public.fp_var_chi_nhanh ORDER BY id LIMIT 1),
    (SELECT ten_chi_nhanh FROM public.fp_var_chi_nhanh ORDER BY id LIMIT 1),
    'Seed: ghi chú phiếu nhiều dòng.' || chr(10) || 'Dòng 2 — kiểm tra hiển thị.',
    (SELECT id FROM public.fp_var_nhan_vien ORDER BY id LIMIT 1)
  WHERE (SELECT COUNT(*)::int FROM public.fp_farm_bao_cao_nhan_cong) = 0
  RETURNING id
)
INSERT INTO public.fp_farm_bao_cao_nhan_cong_ct (
  id_bao_cao,
  loai_chuyen,
  sl_cong_ngay,
  sl_cong_nua,
  sl_tang_ca,
  so_gio_tc,
  ghi_chu,
  thu_tu
)
SELECT
  ins.id,
  v.loai_chuyen,
  v.sl_cong_ngay,
  v.sl_cong_nua,
  v.sl_tang_ca,
  v.so_gio_tc,
  v.ghi_chu,
  v.thu_tu
FROM ins
CROSS JOIN (
  VALUES
    ('XAN_NAI', 10::numeric, 2::numeric, 0::numeric, 0::numeric, 'Ghi chú chuyền I.1' || chr(10) || 'Dòng phụ.', 1),
    ('TIA_DANH_GIA', 6::numeric, 1::numeric, 0::numeric, 0::numeric, 'I.2', 2),
    ('CAN_TEM_DONG_THUNG', 8::numeric, 0::numeric, 1::numeric, 1.5::numeric, 'I.3 — tăng ca nhẹ', 3),
    ('KHO_HUT_CHAN_KHONG', 4::numeric, 0::numeric, 0::numeric, 0::numeric, 'II', 4),
    ('CONG_TANG_CUONG', 2::numeric, 0::numeric, 2::numeric, 3::numeric, 'III' || chr(10) || 'Hai dòng.', 5),
    ('CONG_DINH_BIEN_KHONG_SAN_XUAT', 0::numeric, 0::numeric, 0::numeric, 0::numeric, 'IV — định biên không SX', 6)
) AS v(loai_chuyen, sl_cong_ngay, sl_cong_nua, sl_tang_ca, so_gio_tc, ghi_chu, thu_tu);
