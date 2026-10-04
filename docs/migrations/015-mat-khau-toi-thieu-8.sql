-- =============================================================================
-- 015-mat-khau-toi-thieu-8.sql — Mật khẩu đặt mới phải từ 8 ký tự (trước: 6)
-- Khớp PASSWORD_MIN_LENGTH ở lib/constants.ts. Chỉ áp khi ĐẶT mật khẩu: tài khoản cũ
-- 6–7 ký tự vẫn đăng nhập được. Thân hàm giữ nguyên bản đang chạy, chỉ đổi số 6 → 8.
-- CREATE OR REPLACE giữ nguyên quyền EXECUTE (authenticated).
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-015
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/015-mat-khau-toi-thieu-8.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_set_mat_khau(p_nhan_vien_id bigint, p_mat_khau text, p_phai_doi boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_hash    TEXT;
  v_toi     BIGINT := public.nhan_vien_hien_tai_id();
  v_tu_doi  BOOLEAN;
BEGIN
  IF length(coalesce(p_mat_khau, '')) < 8 THEN
    RAISE EXCEPTION 'Mật khẩu phải có tối thiểu 8 ký tự.';
  END IF;

  PERFORM 1 FROM public.fp_var_nhan_vien WHERE id = p_nhan_vien_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy nhân viên id = %.', p_nhan_vien_id;
  END IF;

  IF v_toi IS NULL THEN
    RAISE EXCEPTION 'Phiên đăng nhập không xác định được nhân viên (token thiếu claim nv và email). Hãy đăng xuất rồi đăng nhập lại.';
  END IF;

  v_tu_doi := (v_toi = p_nhan_vien_id);

  IF NOT v_tu_doi AND NOT public.co_quyen_quan_tri_mat_khau() THEN
    RAISE EXCEPTION 'Không có quyền đặt mật khẩu cho nhân viên này.';
  END IF;

  v_hash := extensions.crypt(p_mat_khau, extensions.gen_salt('bf', 10));

  UPDATE public.fp_var_nhan_vien
  SET mat_khau_hash         = v_hash,
      mat_khau_cap_nhat_luc = now(),
      phai_doi_mat_khau     = p_phai_doi
  WHERE id = p_nhan_vien_id;

  IF NOT v_tu_doi AND to_regclass('public.fp_var_phien_dang_nhap') IS NOT NULL THEN
    UPDATE public.fp_var_phien_dang_nhap
    SET thu_hoi_luc = now()
    WHERE nhan_vien_id = p_nhan_vien_id AND thu_hoi_luc IS NULL;
  END IF;
END $function$
;

COMMIT;

NOTIFY pgrst, 'reload schema';
