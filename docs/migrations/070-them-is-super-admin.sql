-- =============================================================================
-- 070-them-is-super-admin.sql — Cờ Super admin cho nhân viên
--
-- fp_var_nhan_vien.is_super_admin = true → đối xử Y HỆT cap_bac = 1: toàn quyền mọi module,
-- xem toàn phạm vi. Hai tầng khớp nhau:
--   - App: laNhanVienToanQuyen() ở features/he-thong/phan-quyen/core/cap-bac-toan-quyen.ts.
--   - DB : mọi hàm đang coi cap_bac = 1 là toàn quyền thêm nhánh `OR nv.is_super_admin`.
--     Các hàm *_la_cap_cao() (018, 036, 041…) và mọi policy dùng fn_co_quyen_module tự hưởng theo.
--
-- Chỉ super admin mới bật/tắt được cột này (trigger chặn request từ app — role authenticated).
-- SQL tay / hàm DEFINER (current_user <> 'authenticated') đi qua → phần gán cuối file chạy được.
--
-- Hàm sửa (CREATE OR REPLACE, giữ nguyên ACL cũ):
--   co_quyen_quan_tri_mat_khau, fn_co_quyen_module, rpc_tb_nguoi_duyet,
--   rpc_tb_nguoi_duyet_phong_ban, rpc_tb_quan_tri_module, rpc_sheets_nguoi_tao,
--   rpc_get_session_bootstrap (trả thêm is_super_admin cho phiên app).
-- Hàm mới: fn_la_super_admin(), fn_nhan_vien_chan_doi_super_admin() (trigger).
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/070-them-is-super-admin.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) Cột mới
-- -----------------------------------------------------------------------------
ALTER TABLE public.fp_var_nhan_vien
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.fp_var_nhan_vien.is_super_admin IS
  'Super admin — toàn quyền mọi module như cap_bac = 1. Chỉ super admin khác mới đổi được (trigger trg_zz_nhan_vien_chan_doi_super_admin).';

-- Bảng dùng quyền theo CỘT cho authenticated (baseline) → cột mới phải cấp tường minh,
-- không thì mọi select có is_super_admin của app báo 42501.
GRANT SELECT (is_super_admin), INSERT (is_super_admin), UPDATE (is_super_admin)
  ON public.fp_var_nhan_vien TO authenticated;

-- -----------------------------------------------------------------------------
-- 2) Hàm nhận diện super admin của người đang đăng nhập (theo JWT)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_la_super_admin()
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE((
    SELECT nv.is_super_admin
      FROM public.fp_var_nhan_vien nv
     WHERE nv.id = public.nhan_vien_hien_tai_id()
  ), false);
$$;

COMMENT ON FUNCTION public.fn_la_super_admin() IS
  'true khi nhân viên đang đăng nhập (JWT) có is_super_admin = true';

REVOKE ALL ON FUNCTION public.fn_la_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_la_super_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- 3) Chặn người không phải super admin bật/tắt cờ
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_nhan_vien_chan_doi_super_admin()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF (
       (TG_OP = 'INSERT' AND NEW.is_super_admin)
       OR (TG_OP = 'UPDATE' AND NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin)
     )
     AND NOT public.fn_la_super_admin() THEN
    RAISE EXCEPTION 'Chỉ super admin mới được bật/tắt quyền Super admin của nhân viên'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_nhan_vien_chan_doi_super_admin() IS
  'Chặn request từ app (role authenticated) đổi fp_var_nhan_vien.is_super_admin khi người gọi không phải super admin';

REVOKE ALL ON FUNCTION public.fn_nhan_vien_chan_doi_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_nhan_vien_chan_doi_super_admin() TO authenticated;

DROP TRIGGER IF EXISTS trg_zz_nhan_vien_chan_doi_super_admin ON public.fp_var_nhan_vien;
CREATE TRIGGER trg_zz_nhan_vien_chan_doi_super_admin
  BEFORE INSERT OR UPDATE ON public.fp_var_nhan_vien
  FOR EACH ROW EXECUTE FUNCTION public.fn_nhan_vien_chan_doi_super_admin();

-- -----------------------------------------------------------------------------
-- 4) Các hàm "cấp cao" — thêm nhánh is_super_admin, giữ nguyên phần còn lại
-- -----------------------------------------------------------------------------

-- 4a) Gốc: migration 013. Mọi policy/hàm dùng fn_co_quyen_module tự hưởng nhánh mới.
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
        OR nv.is_super_admin
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
  'true khi nhân viên hiện tại là cấp cao (cap_bac = 1 / super admin / chức vụ tt = 1) hoặc có một trong p_actions trên module p_module_id';

-- 4b) Gốc: baseline.
CREATE OR REPLACE FUNCTION public.co_quyen_quan_tri_mat_khau() RETURNS boolean
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
        OR nv.is_super_admin
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
  'TRUE nếu người đang đăng nhập được đặt mật khẩu cho người khác: cap_bac = 1, super admin, hoặc admin/all trên module he-thong/nhan-vien, hoặc chuc_vu.tt = 1.';

-- 4c) Gốc: baseline. Super admin luôn có mặt, không bị giới hạn chi nhánh — như cấp bậc 1.
CREATE OR REPLACE FUNCTION public.rpc_tb_nguoi_duyet(p_module_id text, p_chi_nhanh_id bigint DEFAULT NULL::bigint) RETURNS TABLE(nhan_vien_id bigint, cap_bac integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.chi_nhanh_ids,
           e.is_super_admin,
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
     AND (q.cap_bac = 1 OR q.is_super_admin OR q.co_quyen_duyet)
     -- Giới hạn chi nhánh: thêm ngoại lệ cho nhóm quản trị.
     AND (
           p_chi_nhanh_id IS NULL
        OR q.cap_bac = 1
        OR q.is_super_admin
        OR q.co_quyen_quan_tri
        OR p_chi_nhanh_id::text = ANY (COALESCE(q.chi_nhanh_ids, '{}'::text[]))
         );
$$;

COMMENT ON FUNCTION public.rpc_tb_nguoi_duyet(p_module_id text, p_chi_nhanh_id bigint) IS
  'Danh sách nhân viên được duyệt một module, giới hạn theo chi nhánh. Cấp bậc 1, super admin và người có quyền quản trị (admin/all) luôn có mặt, không bị giới hạn chi nhánh — khớp cổng viewAll của app.';

-- 4d) Gốc: baseline.
CREATE OR REPLACE FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(p_module_id text, p_nguoi_tao_id bigint) RETURNS TABLE(nhan_vien_id bigint, cap_bac integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  -- Cấp bậc đọc qua fp_var_cap_bac như rpc_tb_nguoi_duyet: ưu tiên cột
  -- denormalized fp_var_nhan_vien.cap_bac, lui về cap_bac_id khi cột đó trống.
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.phong_ban_id,
           e.is_super_admin,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  ),
  pb AS (
    SELECT nv.phong_ban_id FROM nv WHERE nv.id = p_nguoi_tao_id
  )
  SELECT nv.id, COALESCE(nv.cap_bac, 99)::integer
    FROM nv
   WHERE COALESCE(nv.trang_thai, '') <> 'Nghỉ việc'
     AND (
           nv.cap_bac = 1
        OR nv.is_super_admin
        OR EXISTS (
             SELECT 1
               FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['admin', 'all']
           )
        OR (
             nv.cap_bac IN (2, 3)
         AND nv.phong_ban_id IS NOT NULL
         AND nv.phong_ban_id = (SELECT phong_ban_id FROM pb)
           )
         );
$$;

COMMENT ON FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(p_module_id text, p_nguoi_tao_id bigint) IS
  'Người duyệt phiếu hành chính: quản lý phòng ban của NGƯỜI TẠO (cấp bậc 2-3) + quản trị module (admin/all) + cấp bậc 1 / super admin. Hàm RIÊNG, không thay rpc_tb_nguoi_duyet.';

-- 4e) Gốc: migration 035.
CREATE OR REPLACE FUNCTION public.rpc_tb_quan_tri_module(p_module_id text)
    RETURNS TABLE(nhan_vien_id bigint, cap_bac integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.is_super_admin,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  )
  SELECT nv.id, COALESCE(nv.cap_bac, 99)::integer
    FROM nv
   WHERE COALESCE(nv.trang_thai, '') <> 'Nghỉ việc'
     AND (
           nv.cap_bac = 1
        OR nv.is_super_admin
        OR EXISTS (
             SELECT 1 FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['admin', 'all']
           )
         );
$$;

-- 4f) Gốc: migration 012. toan_pham_vi khớp quy ước "cấp cao" của app.
CREATE OR REPLACE FUNCTION public.rpc_sheets_nguoi_tao(p_nhan_vien_id bigint, p_module_id text)
    RETURNS TABLE(email text, con_lam boolean, toan_pham_vi boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nv.email,
         COALESCE(nv.trang_thai, '') <> 'Nghỉ việc',
         COALESCE(nv.cap_bac = 1, false) OR nv.is_super_admin OR EXISTS (
           SELECT 1
             FROM public.fp_var_phan_quyen pq
            WHERE pq.chuc_vu_id = nv.chuc_vu_id
              AND pq.module_id = p_module_id
              AND pq.actions && ARRAY['admin', 'all']::text[]
         )
    FROM public.fp_var_nhan_vien nv
   WHERE nv.id = p_nhan_vien_id;
$$;

-- -----------------------------------------------------------------------------
-- 5) Phiên app: rpc_get_session_bootstrap trả thêm is_super_admin (gốc: baseline)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_session_bootstrap(p_email text) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
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
    'is_super_admin', nv.is_super_admin,
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

-- -----------------------------------------------------------------------------
-- 6) Gán super admin ban đầu: "Hương" và "Lê Minh Công".
--    Khớp họ tên đầy đủ (bỏ khoảng trắng thừa, không phân biệt hoa thường, chuẩn NFC);
--    tên một chữ ("Hương") khớp thêm theo TÊN (chữ cuối của họ tên).
--    Chỉ gán khi khớp ĐÚNG 1 người; 0 hoặc >1 → bỏ qua tên đó và in NOTICE danh sách ứng viên.
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_ten     text;
  v_chuan   text;
  v_ids     bigint[];
  v_ung_vien text;
BEGIN
  FOREACH v_ten IN ARRAY ARRAY['Hương', 'Lê Minh Công'] LOOP
    v_chuan := lower(normalize(v_ten, NFC));

    SELECT array_agg(nv.id ORDER BY nv.id)
      INTO v_ids
      FROM public.fp_var_nhan_vien nv
     WHERE lower(normalize(regexp_replace(btrim(nv.ho_va_ten), '\s+', ' ', 'g'), NFC)) = v_chuan
        OR (
             position(' ' IN v_chuan) = 0
         AND lower(normalize(substring(btrim(nv.ho_va_ten) FROM '(\S+)$'), NFC)) = v_chuan
           );

    IF coalesce(array_length(v_ids, 1), 0) = 1 THEN
      UPDATE public.fp_var_nhan_vien SET is_super_admin = true WHERE id = v_ids[1];
      RAISE NOTICE 'Super admin: "%" → id %', v_ten, v_ids[1];
    ELSE
      SELECT string_agg(format('id=%s "%s" (%s)', nv.id, nv.ho_va_ten, coalesce(nv.trang_thai, '?')), '; ' ORDER BY nv.id)
        INTO v_ung_vien
        FROM public.fp_var_nhan_vien nv
       WHERE nv.id = ANY (coalesce(v_ids, '{}'))
          OR normalize(nv.ho_va_ten, NFC) ILIKE '%' || normalize(v_ten, NFC) || '%';
      RAISE NOTICE 'BỎ QUA "%" — khớp % người. Ứng viên: %',
        v_ten, coalesce(array_length(v_ids, 1), 0), coalesce(v_ung_vien, '(không có)');
    END IF;
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
