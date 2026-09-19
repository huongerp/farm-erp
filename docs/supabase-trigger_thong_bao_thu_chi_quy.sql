-- =============================================================================
-- Đấu module Tài chính > Thu chi quỹ vào hệ thống thông báo (outbox).
--
-- Chạy SAU: docs/supabase-fp_var_su_kien_thong_bao.sql (#1),
--           docs/supabase-rpc_thong_bao_dinh_tuyen.sql (#5),
--           docs/supabase-fp_tc_quy_thu_chi_add_trang_thai.sql
--
-- Khác 7 module đấu đợt đầu ở một điểm CỐ Ý: trigger chỉ bắt UPDATE cột
-- trang_thai. Sổ quỹ có luồng import Excel hàng trăm dòng một lần; gắn
-- AFTER INSERT OR UPDATE như các bảng kia sẽ đổ ngần ấy dòng rác vào outbox
-- chỉ để worker đọc rồi bỏ đi. Sự kiện đáng báo ở module này chỉ có xin mở /
-- duyệt mở / từ chối mở, đều là đổi trạng thái.
-- =============================================================================

DROP TRIGGER IF EXISTS tr_thong_bao_fp_tc_quy_thu_chi ON public.fp_tc_quy_thu_chi;
CREATE TRIGGER tr_thong_bao_fp_tc_quy_thu_chi
  AFTER UPDATE OF trang_thai ON public.fp_tc_quy_thu_chi
  FOR EACH ROW
  WHEN (OLD.trang_thai IS DISTINCT FROM NEW.trang_thai)
  EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('tai-chinh/thu-chi-quy', 'trang_thai');

-- -----------------------------------------------------------------------------
-- Giới hạn người nhận theo chi nhánh của phiếu quỹ.
-- Dựng lại rpc_tb_chi_nhanh_phieu với một nhánh mới; các nhánh cũ giữ nguyên
-- (quy ước: không sửa đè file SQL đã chạy trên VPS).
-- Quỹ gắn thẳng vào chi nhánh, không suy qua kho.
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

    WHEN 'fp_tc_quy_thu_chi' THEN
      -- Quỹ tiền mặt gắn thẳng vào chi nhánh (không qua kho).
      SELECT p.id_chi_nhanh::bigint INTO v_chi_nhanh
        FROM public.fp_tc_quy_thu_chi p
       WHERE p.id = p_ban_ghi_id;

    ELSE
      -- fp_hc_cong_viec, fp_hr_phieu_hanh_chinh: không gắn với kho nào.
      v_chi_nhanh := NULL;
  END CASE;

  RETURN v_chi_nhanh;
END;
$$;

COMMENT ON FUNCTION public.rpc_tb_chi_nhanh_phieu(text, bigint) IS
  'Chi nhánh của một phiếu (quỹ lấy thẳng id_chi_nhanh, còn lại suy qua kho). NULL = không giới hạn phạm vi người nhận.';

GRANT EXECUTE ON FUNCTION public.rpc_tb_chi_nhanh_phieu(text, bigint) TO notify_service;

-- =============================================================================
-- Kiểm tra sau khi chạy
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.fp_tc_quy_thu_chi'::regclass;
--   SELECT public.rpc_tb_chi_nhanh_phieu('fp_tc_quy_thu_chi', <id phiếu>);
-- =============================================================================
