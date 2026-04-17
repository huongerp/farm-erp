-- =====================================================================
-- RPC: rpc_get_session_bootstrap(p_email text)
-- Mục đích: Gom 4 request của page load đầu tiên (employee + chuc_vu.tt +
-- phan_quyen + company info) thành 1 request duy nhất trả về JSON.
-- Trước đây mỗi F5 bắn 3–5 request song song → sau khi dùng RPC còn 1 request.
--
-- Payload giả định (JSON):
-- {
--   "employee": { "id": 123, "ho_va_ten": "...", "email": "...",
--                 "phong_ban_id": 2, "chuc_vu_id": 4, "chi_nhanh_ids": [1],
--                 "cap_bac_id": 1, "cap_bac": 1, "trang_thai": "...",
--                 "ten_phong_ban": "...", "ten_chuc_vu": "...",
--                 "ten_chi_nhanh": "...", "hinh_anh_url": null,
--                 "so_dien_thoai": "...", "gioi_tinh": "...",
--                 "ngay_vao_lam": "..." },
--   "chuc_vu":  { "id": 4, "tt": 1 },
--   "phan_quyen": [{ "module_id": "nhan-vien", "actions": ["read","write"] }, ...],
--   "company":  { "ten_ung_dung":"...", "mo_ta":"...", "logo":"...",
--                 "ten_cong_ty":"...", "ma_so_thue":"...", "dia_chi":"...",
--                 "so_dien_thoai":"...", "email":"...", "trang_web":"..." }
-- }
--
-- LƯU Ý: RPC dùng .eq('email', lower(p_email)) — yêu cầu bạn đã chuẩn hoá
-- cột email về lowercase (xem Giai đoạn 4 trong plan).
-- =====================================================================

CREATE OR REPLACE FUNCTION public.rpc_get_session_bootstrap(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email  TEXT := LOWER(TRIM(p_email));
  v_emp    JSONB;
  v_cv     JSONB;
  v_pq     JSONB;
  v_cty    JSONB;
  v_cv_id  BIGINT;
BEGIN
  -- 1) Nhân viên (không tải cột hinh_anh base64)
  SELECT jsonb_build_object(
    'id', nv.id,
    'ho_va_ten', nv.ho_va_ten,
    'email', nv.email,
    'so_dien_thoai', nv.so_dien_thoai,
    'phong_ban_id', nv.phong_ban_id,
    'chuc_vu_id', nv.chuc_vu_id,
    'chi_nhanh_ids', nv.chi_nhanh_ids,
    'cap_bac_id', nv.cap_bac_id,
    'cap_bac', nv.cap_bac,
    'trang_thai', nv.trang_thai,
    'ten_phong_ban', nv.ten_phong_ban,
    'ten_chuc_vu', nv.ten_chuc_vu,
    'ten_chi_nhanh', nv.ten_chi_nhanh,
    'ten_cap_bac', nv.ten_cap_bac,
    'gioi_tinh', nv.gioi_tinh,
    'ngay_vao_lam', nv.ngay_vao_lam,
    -- Nếu bảng có cột hinh_anh_url thì trả, không thì để null.
    'hinh_anh_url', NULL
  ), nv.chuc_vu_id
  INTO v_emp, v_cv_id
  FROM public.fp_var_nhan_vien nv
  WHERE LOWER(nv.email) = v_email
  LIMIT 1;

  IF v_emp IS NULL THEN
    RETURN jsonb_build_object(
      'employee', NULL,
      'chuc_vu',  NULL,
      'phan_quyen', '[]'::JSONB,
      'company',  NULL
    );
  END IF;

  -- 2) Chức vụ (chỉ lấy tt)
  SELECT jsonb_build_object('id', cv.id, 'tt', cv.tt)
  INTO v_cv
  FROM public.fp_var_chuc_vu cv
  WHERE cv.id = v_cv_id
  LIMIT 1;

  -- 3) Phân quyền theo chức vụ
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object('module_id', pq.module_id, 'actions', pq.actions)
         ), '[]'::JSONB)
  INTO v_pq
  FROM public.fp_var_phan_quyen pq
  WHERE pq.chuc_vu_id = v_cv_id;

  -- 4) Thông tin công ty (bản ghi có id nhỏ nhất)
  SELECT jsonb_build_object(
    'ten_ung_dung', c.ten_ung_dung,
    'mo_ta',        c.mo_ta,
    'logo',         c.logo,
    'ten_cong_ty',  c.ten_cong_ty,
    'ma_so_thue',   c.ma_so_thue,
    'dia_chi',      c.dia_chi,
    'so_dien_thoai', c.so_dien_thoai,
    'email',        c.email,
    'trang_web',    c.trang_web
  )
  INTO v_cty
  FROM public.fp_var_tt_cong_ty c
  ORDER BY c.id ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'employee',   v_emp,
    'chuc_vu',    v_cv,
    'phan_quyen', v_pq,
    'company',    v_cty
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_get_session_bootstrap(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_session_bootstrap(TEXT) TO anon;

-- Gợi ý index phục vụ RPC:
-- CREATE INDEX IF NOT EXISTS idx_nhan_vien_email_lower ON public.fp_var_nhan_vien (LOWER(email));
-- CREATE INDEX IF NOT EXISTS idx_phan_quyen_chuc_vu_id ON public.fp_var_phan_quyen (chuc_vu_id);
