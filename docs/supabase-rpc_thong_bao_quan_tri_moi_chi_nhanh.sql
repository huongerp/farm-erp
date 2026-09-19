-- =============================================================================
-- Người có quyền QUẢN TRỊ module (admin/all) nhận thông báo ở MỌI chi nhánh.
--
-- Chạy SAU: docs/supabase-rpc_thong_bao_dinh_tuyen.sql (#5)
--
-- LÝ DO — hai tầng đang lệch nhau:
--   Tầng app (useEmployeeBranchModuleScope) cho người có 'admin' | 'all' thấy
--   phiếu của MỌI chi nhánh (viewAll), không riêng chi nhánh mình được gán.
--   Tầng thông báo (rpc_tb_nguoi_duyet) lại chỉ miễn lọc chi nhánh cho
--   cap_bac = 1. Hệ quả thật: một quản trị viên chỉ được gán chi nhánh Văn
--   Phòng mở app thì thấy đủ phiếu kho của các nhà sơ chế, nhưng chưa từng
--   nhận được một thông báo phiếu kho nào — xem được mà không được báo.
--
-- Bản vá: giữ nguyên điều kiện VÀO danh sách, chỉ nới điều kiện GIỚI HẠN CHI
-- NHÁNH cho nhóm quản trị.
--
-- Cố ý KHÔNG nới cho 'approve': quyền duyệt là quyền xử lý phiếu trong phạm vi
-- chi nhánh của mình, và cổng app cũng chỉ mở viewAll cho admin/all. Nới cả
-- 'approve' sẽ bắn phiếu của mọi chi nhánh tới người duyệt từng kho.
--
-- CREATE OR REPLACE giữ NGUYÊN chữ ký (text, bigint) nên đây là thay thế tại
-- chỗ, không sinh overload — xem cảnh báo trong
-- docs/supabase-thong_bao_phieu_hanh_chinh.sql.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rpc_tb_nguoi_duyet(
  p_module_id    text,
  p_chi_nhanh_id bigint DEFAULT NULL
)
RETURNS TABLE (nhan_vien_id bigint, cap_bac integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.chi_nhanh_ids,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  ),
  q AS (
    SELECT nv.*,
           EXISTS (
             SELECT 1 FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['approve', 'admin', 'all']
           ) AS co_quyen_duyet,
           EXISTS (
             SELECT 1 FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['admin', 'all']
           ) AS co_quyen_quan_tri
      FROM nv
  )
  SELECT q.id, COALESCE(q.cap_bac, 99)::integer
    FROM q
   WHERE COALESCE(q.trang_thai, '') <> 'Nghỉ việc'
     -- Ai được vào danh sách: giữ nguyên như trước.
     AND (q.cap_bac = 1 OR q.co_quyen_duyet)
     -- Giới hạn chi nhánh: thêm ngoại lệ cho nhóm quản trị.
     AND (
           p_chi_nhanh_id IS NULL
        OR q.cap_bac = 1
        OR q.co_quyen_quan_tri
        OR p_chi_nhanh_id::text = ANY (COALESCE(q.chi_nhanh_ids, '{}'::text[]))
         );
$$;

COMMENT ON FUNCTION public.rpc_tb_nguoi_duyet(text, bigint) IS
  'Danh sách nhân viên được duyệt một module, giới hạn theo chi nhánh. Cấp bậc 1 và người có quyền quản trị (admin/all) luôn có mặt, không bị giới hạn chi nhánh — khớp cổng viewAll của app.';

GRANT EXECUTE ON FUNCTION public.rpc_tb_nguoi_duyet(text, bigint) TO notify_service;

-- =============================================================================
-- Kiểm tra sau khi chạy
--
-- a) Vẫn đúng MỘT chữ ký (ra 2 dòng = đã sinh overload, phải DROP bản thừa):
--      SELECT oid::regprocedure FROM pg_proc WHERE proname = 'rpc_tb_nguoi_duyet';
--
-- b) Quản trị viên chỉ có chi nhánh Văn Phòng nay đã nhận phiếu kho NSC:
--      SELECT nv.ho_va_ten, d.cap_bac, nv.chi_nhanh_ids
--        FROM public.rpc_tb_nguoi_duyet('kho-van/phieu-kho', 12) d
--        JOIN public.fp_var_nhan_vien nv ON nv.id = d.nhan_vien_id
--       ORDER BY d.cap_bac, nv.ho_va_ten;
--
-- c) Người chỉ có 'approve' vẫn bị giới hạn chi nhánh như cũ (không được nới):
--      SELECT count(*) FROM public.rpc_tb_nguoi_duyet('kho-van/phieu-kho', 12);
-- =============================================================================
