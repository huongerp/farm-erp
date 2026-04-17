-- =====================================================================
-- RPC: rpc_count_nhan_vien_by_chuc_vu
-- Mục đích: Thay cho truy vấn `fetchAllRows('fp_var_nhan_vien', 'chuc_vu_id')`
-- trong getRoles() — trước đây tải hàng nghìn dòng chỉ để đếm theo chức vụ.
-- Sau khi dùng RPC, chỉ trả về vài chục dòng {chuc_vu_id, so_nhan_vien}.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rpc_count_nhan_vien_by_chuc_vu()
RETURNS TABLE (
  chuc_vu_id BIGINT,
  so_nhan_vien BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    chuc_vu_id::BIGINT,
    COUNT(*)::BIGINT AS so_nhan_vien
  FROM public.fp_var_nhan_vien
  WHERE chuc_vu_id IS NOT NULL
  GROUP BY chuc_vu_id;
$$;

-- Cấp quyền gọi cho anon + authenticated (tuỳ chính sách bảo mật của bạn)
GRANT EXECUTE ON FUNCTION public.rpc_count_nhan_vien_by_chuc_vu() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_count_nhan_vien_by_chuc_vu() TO anon;

-- Gợi ý index (nếu chưa có) — giúp GROUP BY chạy rất nhanh:
-- CREATE INDEX IF NOT EXISTS idx_nhan_vien_chuc_vu_id ON public.fp_var_nhan_vien(chuc_vu_id);
