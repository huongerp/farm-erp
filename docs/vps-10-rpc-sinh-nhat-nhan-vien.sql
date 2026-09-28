-- =============================================================================
-- vps-10: RPC sinh nhật nhân viên — cho panel lịch của đồng hồ trên header
--
-- RLS của fp_var_nhan_vien chỉ cho nhân viên thường SELECT dòng của chính mình
-- (docs/supabase-rls-fp_var_nhan_vien.sql), nên panel "Sinh nhật tuần này" không
-- đọc thẳng bảng được. RPC này SECURITY DEFINER nhưng tối giản cột:
--   - chỉ nhân viên 'Đang làm việc' có ngày sinh;
--   - chỉ trả NGÀY + THÁNG, không trả năm sinh (không lộ tuổi);
--   - toàn công ty, mọi user đăng nhập đều gọi được.
-- Lọc "trong tuần / trong tháng đang xem" làm ở client
-- (features/he-thong/nhan-vien/utils/sinh-nhat.ts) — danh sách chỉ vài chục dòng.
--
-- Chạy trên VPS, database `fpfarm`, bằng role sở hữu schema public.
-- =============================================================================

DO $$
BEGIN
  IF current_database() <> 'fpfarm' THEN
    RAISE EXCEPTION 'Chỉ chạy trên database `fpfarm` ở VPS, đang kết nối `%`.', current_database();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rpc_sinh_nhat_nhan_vien()
RETURNS TABLE (
  id BIGINT,
  ho_va_ten TEXT,
  hinh_anh TEXT,
  ngay INT,
  thang INT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.id,
         nv.ho_va_ten,
         nv.hinh_anh,
         EXTRACT(DAY FROM nv.ngay_sinh)::INT,
         EXTRACT(MONTH FROM nv.ngay_sinh)::INT
    FROM public.fp_var_nhan_vien nv
   WHERE nv.ngay_sinh IS NOT NULL
     AND nv.trang_thai = 'Đang làm việc'
   ORDER BY 5, 4, nv.ho_va_ten;
$$;

COMMENT ON FUNCTION public.rpc_sinh_nhat_nhan_vien() IS
  'Ngày/tháng sinh (không năm) của nhân viên đang làm việc — panel lịch trên header.';

REVOKE ALL ON FUNCTION public.rpc_sinh_nhat_nhan_vien() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_sinh_nhat_nhan_vien() TO authenticated;

-- PostgREST nạp lại schema cache để thấy RPC mới.
NOTIFY pgrst, 'reload schema';
