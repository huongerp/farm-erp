-- =============================================================================
-- RPC hỗ trợ worker services/notify định tuyến người nhận
--
-- PHÂN VAI: SQL trả lời câu hỏi TRA CỨU ("ai có quyền duyệt module này ở chi
-- nhánh này", "phiếu này thuộc chi nhánh nào"). Còn câu hỏi LOGIC ("sự kiện này
-- gửi cho nhóm nào, nội dung ra sao, có rung push không") nằm trong TypeScript
-- để test bằng vitest.
--
-- Thứ tự chạy: SAU supabase-fp_var_push_subscription.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Ai được duyệt module này?
--
--    Khớp đúng cổng quyền phía app:
--      - cap_bac = 1 → toàn quyền, bỏ qua cả phân quyền lẫn giới hạn chi nhánh
--        (useCapBacToanQuyen)
--      - chức vụ có 'approve' | 'admin' | 'all' trên module
--        Gộp cả ba vì không phải module nào cũng dùng 'approve': phiếu hành chính
--        xét quyền duyệt bằng admin/all (usePhieuHanhChinhViewScope), còn phiếu
--        kho / đề xuất / đơn đặt hàng dùng 'approve' (MODULES_WITH_APPROVE).
--
--    p_chi_nhanh_id NULL = không giới hạn phạm vi (bảng không suy ra được chi nhánh).
-- -----------------------------------------------------------------------------
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
  -- Cấp bậc đọc qua fp_var_cap_bac: cột denormalized fp_var_nhan_vien.cap_bac
  -- hiện đang NULL cho toàn bộ nhân sự, chỉ cap_bac_id là đáng tin. Vẫn ưu tiên
  -- cột denormalized khi nó có giá trị để khớp với cách app đọc.
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.chi_nhanh_ids,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  )
  SELECT nv.id, COALESCE(nv.cap_bac, 99)::integer
    FROM nv
   WHERE COALESCE(nv.trang_thai, '') <> 'Nghỉ việc'
     AND (
           nv.cap_bac = 1
        OR EXISTS (
             SELECT 1
               FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['approve', 'admin', 'all']
           )
         )
     AND (
           p_chi_nhanh_id IS NULL
        OR nv.cap_bac = 1
        OR p_chi_nhanh_id::text = ANY (COALESCE(nv.chi_nhanh_ids, '{}'::text[]))
         );
$$;

COMMENT ON FUNCTION public.rpc_tb_nguoi_duyet(text, bigint) IS
  'Danh sách nhân viên được duyệt một module, giới hạn theo chi nhánh. Cấp bậc 1 luôn có mặt và không bị giới hạn chi nhánh.';

-- -----------------------------------------------------------------------------
-- 2) Phiếu này thuộc chi nhánh nào?
--
--    Không bảng nghiệp vụ nào lưu thẳng chi nhánh — phải suy qua kho
--    (fp_mh_danh_sach_kho.chi_nhanh_id), đúng cách view
--    v_farm_de_xuat_mua_hang_summary đang làm.
--    Trả NULL nghĩa là "không giới hạn phạm vi" (công việc, phiếu hành chính).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_tb_chi_nhanh_phieu(
  p_bang       text,
  p_ban_ghi_id bigint
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_chi_nhanh bigint;
BEGIN
  CASE p_bang
    WHEN 'fp_mh_phieu_kho' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_phieu_kho p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.kho_id
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_farm_phieu_kho_phan_thuoc' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_farm_phieu_kho_phan_thuoc p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.kho_id
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_mh_phieu_de_xuat_vat_tu' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_phieu_de_xuat_vat_tu p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_noi_de_xuat
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_farm_de_xuat_mua_hang' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_farm_de_xuat_mua_hang p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_noi_de_xuat
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_mh_don_dat_hang' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_don_dat_hang p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_kho_nhan
       WHERE p.id = p_ban_ghi_id;

    ELSE
      -- fp_hc_cong_viec, fp_hr_phieu_hanh_chinh: không gắn với kho nào.
      v_chi_nhanh := NULL;
  END CASE;

  RETURN v_chi_nhanh;
END;
$$;

COMMENT ON FUNCTION public.rpc_tb_chi_nhanh_phieu(text, bigint) IS
  'Chi nhánh của một phiếu, suy qua kho. NULL = bảng không gắn chi nhánh, không giới hạn phạm vi người nhận.';

-- -----------------------------------------------------------------------------
-- 3) Tên hiển thị của nhân viên — worker cần để viết "Nguyễn Văn A đã duyệt…"
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_tb_ten_nhan_vien(p_ids bigint[])
RETURNS TABLE (id bigint, ho_va_ten text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nv.id, COALESCE(NULLIF(btrim(nv.ho_va_ten), ''), nv.email, 'NV' || nv.id::text)
    FROM public.fp_var_nhan_vien nv
   WHERE nv.id = ANY (p_ids);
$$;

COMMENT ON FUNCTION public.rpc_tb_ten_nhan_vien(bigint[]) IS
  'Tên hiển thị của nhân viên cho nội dung thông báo, lui về email rồi mã NV khi thiếu họ tên.';

GRANT EXECUTE ON FUNCTION public.rpc_tb_nguoi_duyet(text, bigint)     TO notify_service;
GRANT EXECUTE ON FUNCTION public.rpc_tb_chi_nhanh_phieu(text, bigint) TO notify_service;
GRANT EXECUTE ON FUNCTION public.rpc_tb_ten_nhan_vien(bigint[])       TO notify_service;
