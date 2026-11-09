-- =============================================================================
-- 071-gscl-tra-cuu-tem-cong-khai.sql — Giám sát chất lượng: tra cứu công khai tem QR
--
-- Trang quét QR trên tem thùng mẫu GSCL mở KHÔNG cần đăng nhập, nên CỐ Ý cấp quyền
-- cho role anon. Đổi lại, hàm CHỈ trả 3 trường không nhạy cảm:
--   ten_hang_hoa, ma_hang_hoa, ma_cay_hang
-- KHÔNG trả kết luận QC, người tạo, id phiếu hay bất kỳ dữ liệu nội bộ nào khác.
-- Chỉ tra đúng định dạng mã tem YYYY-PPP-MM-DD-SS; mã khác / không có → NULL.
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/071-gscl-tra-cuu-tem-cong-khai.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_gscl_tra_cuu_tem(p_ma_tem text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
           'ten_hang_hoa', hh.ten_hang_hoa,
           'ma_hang_hoa', hh.ma_hang_hoa,
           'ma_cay_hang', p.ma_cay_hang
         )
    FROM public.fp_farm_giam_sat_chat_luong_ct ct
    JOIN public.fp_farm_giam_sat_chat_luong p ON p.id = ct.id_phieu
    LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON hh.id = p.id_hang_hoa
   WHERE p_ma_tem ~ '^\d{4}-\d{3}-\d{2}-\d{2}-\d{2,3}$'
     AND ct.ma_tem = p_ma_tem
   LIMIT 1;
$$;

-- Trang quét QR mở không đăng nhập: cấp anon đúng 1 hàm tra cứu 3 trường công khai.
REVOKE ALL ON FUNCTION public.rpc_gscl_tra_cuu_tem(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_gscl_tra_cuu_tem(text) TO anon, authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
