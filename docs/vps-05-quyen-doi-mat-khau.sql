-- =============================================================================
-- vps-05: Quyền đặt/đổi mật khẩu — sửa lỗi
--   [P0001] Không có quyền đặt mật khẩu cho nhân viên này. — rpc_set_mat_khau
--
-- BẢN CŨ (vps-04, mục 10) nhận diện người gọi CHỈ bằng email trong JWT:
--     IF NOT public.is_admin_current_user()
--        AND (v_jwt_email IS NULL OR v_email IS DISTINCT FROM v_jwt_email)
-- nên hỏng ở hai chỗ:
--   1) Nhân viên TỰ đổi mật khẩu vẫn bị chặn nếu email trong hồ sơ lệch email
--      trong token (khoảng trắng thừa, đổi email hồ sơ, token cũ ký trước khi
--      auth-service thêm claim `email`).
--   2) Quyền quản trị bị bó vào đúng `fp_var_chuc_vu.tt = 1`, trong khi phía app
--      cổng quyền là `cap_bac = 1` HOẶC quyền admin/all trên module nhân viên →
--      UI cho bấm nút "Đổi MK" còn DB thì từ chối.
--
-- BẢN NÀY:
--   - Nhận diện người gọi bằng claim `nv` (id nhân viên, auth-service đã ký từ
--     services/auth/src/index.ts) và chỉ dùng email làm đường lui.
--   - Tự đổi mật khẩu của chính mình: LUÔN được.
--   - Đặt mật khẩu cho người khác: cap_bac = 1, HOẶC quyền admin/all trên module
--     'he-thong/nhan-vien', HOẶC chuc_vu.tt = 1 (giữ tương thích bản cũ).
--
-- Chạy trên VPS, database `fpfarm`, bằng role sở hữu schema public.
-- =============================================================================

DO $$
BEGIN
  IF current_database() <> 'fpfarm' THEN
    RAISE EXCEPTION 'Chỉ chạy trên database `fpfarm` ở VPS, đang kết nối `%`.', current_database();
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1) Nhân viên của phiên hiện tại
--
--    Ưu tiên claim `nv` vì nó là khoá chính, không đổi theo email hồ sơ.
--    Claim có thể là số hoặc chuỗi tuỳ cách ký nên phải lọc bằng regex —
--    ép kiểu thẳng sẽ ném 22P02 và làm hỏng cả policy lẫn RPC.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.nhan_vien_hien_tai_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT (auth.jwt() ->> 'nv')::BIGINT
      WHERE COALESCE(auth.jwt() ->> 'nv', '') ~ '^[0-9]+$'),
    (SELECT nv.id
       FROM public.fp_var_nhan_vien nv
      WHERE LOWER(TRIM(nv.email)) = LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')))
      ORDER BY nv.id
      LIMIT 1)
  );
$$;

COMMENT ON FUNCTION public.nhan_vien_hien_tai_id() IS
  'Id nhân viên của phiên hiện tại: claim `nv` trong JWT, lui về khớp email nếu token chưa có claim này.';

-- ---------------------------------------------------------------------
-- 2) Ai được đặt mật khẩu cho NGƯỜI KHÁC
--
--    Ba lối vào, khớp đúng cổng quyền phía app:
--      - cap_bac = 1 (cấp bậc cao nhất)
--      - quyền admin/all trên module 'he-thong/nhan-vien'
--      - chuc_vu.tt = 1 (tiêu chí của is_admin_current_user bản cũ)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.co_quyen_quan_tri_mat_khau()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
            AND pq.module_id = 'he-thong/nhan-vien'
            AND pq.actions && ARRAY['admin', 'all']::TEXT[]
        )
      )
  );
$$;

COMMENT ON FUNCTION public.co_quyen_quan_tri_mat_khau() IS
  'TRUE nếu người đang đăng nhập được đặt mật khẩu cho người khác: cap_bac = 1, hoặc admin/all trên module he-thong/nhan-vien, hoặc chuc_vu.tt = 1.';

-- ---------------------------------------------------------------------
-- 3) rpc_set_mat_khau — bản mới
--
--    Vẫn thu hồi phiên khi đặt mật khẩu cho NGƯỜI KHÁC (đổi mật khẩu mà phiên
--    cũ còn sống thì việc đổi vô nghĩa); người tự đổi KHÔNG bị thu hồi để luồng
--    bắt đổi mật khẩu lần đầu (phai_doi_mat_khau) không đá họ ra ngay sau đó.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_set_mat_khau(
  p_nhan_vien_id BIGINT,
  p_mat_khau     TEXT,
  p_phai_doi     BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash    TEXT;
  v_toi     BIGINT := public.nhan_vien_hien_tai_id();
  v_tu_doi  BOOLEAN;
BEGIN
  IF length(coalesce(p_mat_khau, '')) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải có tối thiểu 6 ký tự.';
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
END $$;

REVOKE ALL ON FUNCTION public.nhan_vien_hien_tai_id()        FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.co_quyen_quan_tri_mat_khau()   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_set_mat_khau(BIGINT, TEXT, BOOLEAN) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.nhan_vien_hien_tai_id()      TO authenticated;
GRANT EXECUTE ON FUNCTION public.co_quyen_quan_tri_mat_khau() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_set_mat_khau(BIGINT, TEXT, BOOLEAN) TO authenticated;

-- ---------------------------------------------------------------------
-- 4) Chẩn đoán — chạy KHI ĐANG MANG JWT của người bị lỗi (qua PostgREST)
--    hoặc mô phỏng bằng cách nạp claims thủ công trong psql:
--
--      SET LOCAL request.jwt.claims =
--        '{"role":"authenticated","email":"ngoc.tuyen140797@gmail.com","nv":123}';
--
--      SELECT auth.jwt() ->> 'email'              AS email_trong_token,
--             auth.jwt() ->> 'nv'                 AS nv_trong_token,
--             public.nhan_vien_hien_tai_id()      AS toi_la_nhan_vien_id,
--             public.co_quyen_quan_tri_mat_khau() AS duoc_dat_cho_nguoi_khac;
--
--    Nếu toi_la_nhan_vien_id NULL → token không mang claim nv lẫn email:
--    deploy lại auth-service rồi đăng xuất/đăng nhập lại để lấy token mới.
--
--    Soi email hồ sơ có lệch không (khoảng trắng, hoa/thường):
--      SELECT id, ho_va_ten, '[' || email || ']' AS email_tho, cap_bac, chuc_vu_id
--      FROM public.fp_var_nhan_vien
--      WHERE LOWER(TRIM(email)) = 'ngoc.tuyen140797@gmail.com';
-- ---------------------------------------------------------------------
