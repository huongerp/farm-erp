-- =============================================================================
-- 013-gscl-quyen-tieu-chi.sql — Chặn ghi danh mục tiêu chí Giám sát chất lượng ở tầng DB
-- Tầng app chỉ cho "cấp cao" sửa tiêu chí (useGiamSatChatLuongCapCao: cấp bậc 1 hoặc
-- quyền admin/all trên module). Trước đây RLS cho mọi tài khoản đăng nhập INSERT/UPDATE/
-- DELETE → gọi thẳng PostgREST vẫn đổi được ngưỡng. Nay hai tầng khớp nhau.
-- Đọc (SELECT) vẫn mở cho mọi tài khoản đăng nhập: phiếu nào cũng cần bộ tiêu chí.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-013
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/013-gscl-quyen-tieu-chi.sql
-- =============================================================================

BEGIN;

-- Hàm dùng chung: người đang đăng nhập có một trong các quyền `p_actions` trên module,
-- hoặc là cấp cao toàn hệ thống (cấp bậc 1 / chức vụ tt = 1) — cùng quy ước với
-- co_quyen_quan_tri_mat_khau() và hook use-cap-bac-toan-quyen ở app.
CREATE OR REPLACE FUNCTION public.fn_co_quyen_module(p_module_id text, p_actions text[])
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fp_var_nhan_vien nv
    LEFT JOIN public.fp_var_chuc_vu cv ON cv.id = nv.chuc_vu_id
    WHERE nv.id = public.nhan_vien_hien_tai_id()
      AND (
        nv.cap_bac = 1
        OR cv.tt = 1
        OR EXISTS (
          SELECT 1
          FROM public.fp_var_phan_quyen pq
          WHERE pq.chuc_vu_id = nv.chuc_vu_id
            AND pq.module_id = p_module_id
            AND pq.actions && p_actions
        )
      )
  );
$$;

COMMENT ON FUNCTION public.fn_co_quyen_module(text, text[]) IS
  'true khi nhân viên hiện tại là cấp cao (cap_bac = 1 / chức vụ tt = 1) hoặc có một trong p_actions trên module p_module_id';

REVOKE ALL ON FUNCTION public.fn_co_quyen_module(text, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_co_quyen_module(text, text[]) TO authenticated;

DROP POLICY IF EXISTS fp_farm_gscl_tc_insert_auth ON public.fp_farm_gscl_tieu_chi;
DROP POLICY IF EXISTS fp_farm_gscl_tc_update_auth ON public.fp_farm_gscl_tieu_chi;
DROP POLICY IF EXISTS fp_farm_gscl_tc_delete_auth ON public.fp_farm_gscl_tieu_chi;

CREATE POLICY fp_farm_gscl_tc_insert_cap_cao ON public.fp_farm_gscl_tieu_chi
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_co_quyen_module('quan-ly-nha-so-che/giam-sat-chat-luong', ARRAY['admin', 'all']));
CREATE POLICY fp_farm_gscl_tc_update_cap_cao ON public.fp_farm_gscl_tieu_chi
  FOR UPDATE TO authenticated
  USING (public.fn_co_quyen_module('quan-ly-nha-so-che/giam-sat-chat-luong', ARRAY['admin', 'all']))
  WITH CHECK (public.fn_co_quyen_module('quan-ly-nha-so-che/giam-sat-chat-luong', ARRAY['admin', 'all']));
CREATE POLICY fp_farm_gscl_tc_delete_cap_cao ON public.fp_farm_gscl_tieu_chi
  FOR DELETE TO authenticated
  USING (public.fn_co_quyen_module('quan-ly-nha-so-che/giam-sat-chat-luong', ARRAY['admin', 'all']));

COMMIT;

NOTIFY pgrst, 'reload schema';
