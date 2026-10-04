-- =============================================================================
-- 014-chan-anon-va-nang-quyen.sql — Vá 3 lỗ hổng phân quyền ở tầng DB
--
-- 1) Role `anon` (gọi PostgREST KHÔNG cần đăng nhập) đang EXECUTE được 38 hàm
--    SECURITY DEFINER — vd rpc_get_session_bootstrap(email) trả SĐT/chức vụ/quyền của
--    bất kỳ ai, kiem_ke_apply_dieu_chinh_dot ghi điều chỉnh tồn kho. Cũng còn GRANT ALL
--    trên mọi bảng (chưa đọc được dòng nào vì không có policy cho anon, nhưng bỏ luôn).
--    → Thu hồi khỏi PUBLIC + anon; role nào đang gọi được (authenticated, các service)
--      thì cấp lại TƯỜNG MINH nên hành vi khi đã đăng nhập không đổi.
--
-- 2) Nhân viên thường tự nâng quyền: policy UPDATE fp_var_nhan_vien là USING(true) và
--    được UPDATE cột cap_bac → PATCH cap_bac=1 của chính mình → co_quyen_quan_tri_mat_khau()
--    = true → đặt lại mật khẩu bất kỳ ai. Bảng fp_var_phan_quyen / fp_var_chuc_vu (cột tt)
--    / fp_var_cap_bac cũng ai đăng nhập cũng ghi được → tự cấp quyền.
--    → Ghi nhân viên theo quyền module he-thong/nhan-vien (khớp canCreate/canUpdate/canDelete
--      của use-module-permission.ts); tự sửa dòng của mình vẫn được (Profile đổi ảnh) nhưng
--      đổi cột quyền (cấp bậc, chức vụ, trạng thái, email, phòng ban, chi nhánh) của CHÍNH
--      MÌNH cần admin/all. Ghi phân quyền / chức vụ / cấp bậc theo quyền module tương ứng.
--
-- 3) Bảng lương fp_hr_bang_luong: policy ALL USING(true) → ai cũng đọc/sửa lương mọi người.
--    → Khớp use-bang-luong-view-scope.ts: xem dòng của mình; xem tất cả + ghi chỉ khi
--      admin/all trên hanh-chinh/bang-luong hoặc cấp cao.
--
-- fn_co_quyen_module (migration 013) tự coi cấp bậc 1 / chức vụ tt = 1 là toàn quyền.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-014
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/014-chan-anon-va-nang-quyen.sql
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1) anon
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r      record;
  v_role text;
BEGIN
  FOR r IN
    SELECT p.oid, p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    -- Cấp lại tường minh cho role đang gọi được (kể cả nhờ PUBLIC) TRƯỚC khi bỏ PUBLIC.
    FOREACH v_role IN ARRAY ARRAY['authenticated', 'auth_service', 'notify_service', 'sheets_service'] LOOP
      IF has_function_privilege(v_role, r.oid, 'EXECUTE') THEN
        EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO %I', r.sig, v_role);
      END IF;
    END LOOP;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
  END LOOP;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- -----------------------------------------------------------------------------
-- 2a) Trigger đồng bộ tên sang fp_var_nhan_vien chạy với quyền người gọi → sau khi siết
--     UPDATE nhân viên, người chỉ có quyền sửa phòng ban/chức vụ… sẽ bị RLS lọc mất
--     (tên không đồng bộ, không báo lỗi). Chuyển sang DEFINER.
-- -----------------------------------------------------------------------------
ALTER FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten()    SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.fp_var_chi_nhanh_sync_nhan_vien_ten()  SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.fp_var_chuc_vu_sync_nhan_vien_ten()    SECURITY DEFINER SET search_path TO 'public';
ALTER FUNCTION public.fp_var_phong_ban_sync_nhan_vien_ten()  SECURITY DEFINER SET search_path TO 'public';
REVOKE ALL ON FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten()   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_var_chi_nhanh_sync_nhan_vien_ten() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_var_chuc_vu_sync_nhan_vien_ten()   FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fp_var_phong_ban_sync_nhan_vien_ten() FROM PUBLIC, anon;

-- -----------------------------------------------------------------------------
-- 2b) fp_var_nhan_vien
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS fp_var_nhan_vien_insert_policy ON public.fp_var_nhan_vien;
DROP POLICY IF EXISTS fp_var_nhan_vien_update_policy ON public.fp_var_nhan_vien;
DROP POLICY IF EXISTS fp_var_nhan_vien_delete_policy ON public.fp_var_nhan_vien;

CREATE POLICY fp_var_nhan_vien_insert_quyen ON public.fp_var_nhan_vien
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_co_quyen_module('he-thong/nhan-vien', ARRAY['create', 'admin', 'all']));

-- Dòng của chính mình (Profile đổi ảnh) hoặc có quyền sửa nhân viên.
CREATE POLICY fp_var_nhan_vien_update_quyen ON public.fp_var_nhan_vien
  FOR UPDATE TO authenticated
  USING (
    id = public.nhan_vien_hien_tai_id()
    OR public.fn_co_quyen_module('he-thong/nhan-vien', ARRAY['update', 'admin', 'all'])
  )
  WITH CHECK (
    id = public.nhan_vien_hien_tai_id()
    OR public.fn_co_quyen_module('he-thong/nhan-vien', ARRAY['update', 'admin', 'all'])
  );

CREATE POLICY fp_var_nhan_vien_delete_quyen ON public.fp_var_nhan_vien
  FOR DELETE TO authenticated
  USING (public.fn_co_quyen_module('he-thong/nhan-vien', ARRAY['delete', 'admin', 'all']));

-- Cột quyết định quyền: RLS không chặn được theo cột, nên chặn bằng trigger.
-- Chỉ áp cho request từ app (role authenticated); hàm DEFINER (rpc_set_mat_khau, trigger
-- đồng bộ tên) chạy dưới owner nên đi qua.
CREATE OR REPLACE FUNCTION public.fn_nhan_vien_chan_doi_cot_quyen()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
  AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF (NEW.cap_bac, NEW.cap_bac_id, NEW.chuc_vu_id, NEW.trang_thai,
      LOWER(TRIM(NEW.email)), COALESCE(NEW.chi_nhanh_ids, '{}'), NEW.phong_ban_id)
     IS NOT DISTINCT FROM
     (OLD.cap_bac, OLD.cap_bac_id, OLD.chuc_vu_id, OLD.trang_thai,
      LOWER(TRIM(OLD.email)), COALESCE(OLD.chi_nhanh_ids, '{}'), OLD.phong_ban_id) THEN
    RETURN NEW;
  END IF;

  IF NEW.id = public.nhan_vien_hien_tai_id() THEN
    IF NOT public.fn_co_quyen_module('he-thong/nhan-vien', ARRAY['admin', 'all']) THEN
      RAISE EXCEPTION 'Không được tự đổi cấp bậc, chức vụ, trạng thái, email, phòng ban hoặc chi nhánh của chính mình'
        USING ERRCODE = '42501';
    END IF;
  ELSIF NOT public.fn_co_quyen_module('he-thong/nhan-vien', ARRAY['update', 'admin', 'all']) THEN
    RAISE EXCEPTION 'Không có quyền đổi cấp bậc, chức vụ, trạng thái của nhân viên'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_nhan_vien_chan_doi_cot_quyen() FROM PUBLIC, anon;

-- Tên "trg_zz_…" để chạy SAU tr_fp_var_nhan_vien_sync_display_names (trigger cùng loại
-- chạy theo thứ tự tên) — so trên giá trị cuối cùng, kể cả cap_bac do trigger kia tính lại.
DROP TRIGGER IF EXISTS trg_zz_nhan_vien_chan_doi_cot_quyen ON public.fp_var_nhan_vien;
CREATE TRIGGER trg_zz_nhan_vien_chan_doi_cot_quyen
  BEFORE UPDATE ON public.fp_var_nhan_vien
  FOR EACH ROW EXECUTE FUNCTION public.fn_nhan_vien_chan_doi_cot_quyen();

-- -----------------------------------------------------------------------------
-- 2c) Phân quyền / chức vụ / cấp bậc — đọc vẫn mở (menu, form khắp nơi cần), ghi theo module.
--     Module Phân quyền tự tạo/sửa chức vụ (phan-quyen-service.ts) nên chức vụ nhận cả hai.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow insert fp_var_phan_quyen" ON public.fp_var_phan_quyen;
DROP POLICY IF EXISTS "Allow update fp_var_phan_quyen" ON public.fp_var_phan_quyen;
DROP POLICY IF EXISTS "Allow delete fp_var_phan_quyen" ON public.fp_var_phan_quyen;

CREATE POLICY fp_var_phan_quyen_ghi_quyen ON public.fp_var_phan_quyen
  FOR ALL TO authenticated
  USING (public.fn_co_quyen_module('he-thong/phan-quyen', ARRAY['create', 'update', 'delete', 'admin', 'all']))
  WITH CHECK (public.fn_co_quyen_module('he-thong/phan-quyen', ARRAY['create', 'update', 'delete', 'admin', 'all']));
-- Policy ALL ở trên cũng cho SELECT, nhưng SELECT đã mở sẵn qua "Allow select …" (OR).

DROP POLICY IF EXISTS fp_var_chuc_vu_insert_policy ON public.fp_var_chuc_vu;
DROP POLICY IF EXISTS fp_var_chuc_vu_update_policy ON public.fp_var_chuc_vu;
DROP POLICY IF EXISTS fp_var_chuc_vu_delete_policy ON public.fp_var_chuc_vu;

CREATE POLICY fp_var_chuc_vu_ghi_quyen ON public.fp_var_chuc_vu
  FOR ALL TO authenticated
  USING (
    public.fn_co_quyen_module('he-thong/chuc-vu', ARRAY['create', 'update', 'delete', 'admin', 'all'])
    OR public.fn_co_quyen_module('he-thong/phan-quyen', ARRAY['create', 'update', 'delete', 'admin', 'all'])
  )
  WITH CHECK (
    public.fn_co_quyen_module('he-thong/chuc-vu', ARRAY['create', 'update', 'delete', 'admin', 'all'])
    OR public.fn_co_quyen_module('he-thong/phan-quyen', ARRAY['create', 'update', 'delete', 'admin', 'all'])
  );

DROP POLICY IF EXISTS fp_var_cap_bac_insert_policy ON public.fp_var_cap_bac;
DROP POLICY IF EXISTS fp_var_cap_bac_update_policy ON public.fp_var_cap_bac;
DROP POLICY IF EXISTS fp_var_cap_bac_delete_policy ON public.fp_var_cap_bac;

CREATE POLICY fp_var_cap_bac_ghi_quyen ON public.fp_var_cap_bac
  FOR ALL TO authenticated
  USING (public.fn_co_quyen_module('he-thong/cap-bac', ARRAY['create', 'update', 'delete', 'admin', 'all']))
  WITH CHECK (public.fn_co_quyen_module('he-thong/cap-bac', ARRAY['create', 'update', 'delete', 'admin', 'all']));

-- -----------------------------------------------------------------------------
-- 3) Bảng lương
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Full_Access_Authenticated_Policy" ON public.fp_hr_bang_luong;

CREATE POLICY fp_hr_bang_luong_xem ON public.fp_hr_bang_luong
  FOR SELECT TO authenticated
  USING (
    nhan_vien_id = public.nhan_vien_hien_tai_id()
    OR public.fn_co_quyen_module('hanh-chinh/bang-luong', ARRAY['admin', 'all'])
  );

CREATE POLICY fp_hr_bang_luong_ghi ON public.fp_hr_bang_luong
  FOR ALL TO authenticated
  USING (public.fn_co_quyen_module('hanh-chinh/bang-luong', ARRAY['admin', 'all']))
  WITH CHECK (public.fn_co_quyen_module('hanh-chinh/bang-luong', ARRAY['admin', 'all']));

COMMIT;

NOTIFY pgrst, 'reload schema';
