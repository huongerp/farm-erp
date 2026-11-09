-- =============================================================================
-- 074-tb-nhan-vien-theo-chuc-vu.sql — notify-service: người nhận "khâu kiểm tra lại" của
-- phiếu checklist công đoạn (migration 073) = nhân viên đang làm có chức vụ trong
-- fp_farm_cl_phieu.chuc_vu_kiem_tra_ids. Gọi từ services/notify/src/db.ts (layNhanVienTheoChucVu).
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/074-tb-nhan-vien-theo-chuc-vu.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_tb_nhan_vien_theo_chuc_vu(p_chuc_vu_ids bigint[])
    RETURNS TABLE(nhan_vien_id bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nv.id
    FROM public.fp_var_nhan_vien nv
   WHERE nv.chuc_vu_id = ANY (coalesce(p_chuc_vu_ids, '{}'))
     AND COALESCE(nv.trang_thai, '') <> 'Nghỉ việc';
$$;

COMMENT ON FUNCTION public.rpc_tb_nhan_vien_theo_chuc_vu(bigint[]) IS
  'Nhân viên đang làm thuộc các chức vụ — người nhận thông báo khâu kiểm tra lại của checklist công đoạn.';

REVOKE ALL ON FUNCTION public.rpc_tb_nhan_vien_theo_chuc_vu(bigint[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_tb_nhan_vien_theo_chuc_vu(bigint[]) TO notify_service;

COMMIT;
