-- =============================================================================
-- 066-diem-cong-tru-khoa.sql — Trạng thái Khoá / Mở cho bản ghi Điểm cộng trừ
-- Tầng app (core/quyen-khoa.ts): chỉ quản trị module (admin/all) hoặc cấp bậc 1 được
-- khoá / mở khoá; bản ghi đang khoá thì người thường chỉ xem. Trước đây RLS UPDATE/DELETE
-- là USING (true) → gọi thẳng PostgREST vẫn sửa được. Nay hai tầng khớp nhau:
--   - trigger chặn đổi trang_thai và sửa/xoá bản ghi khoá (báo lỗi P0001 rõ ràng);
--   - RLS UPDATE/DELETE chỉ cho bản ghi khoá lọt qua với quản trị / cấp cao.
-- Bản ghi 'mo' giữ nguyên hành vi cũ (mọi tài khoản đăng nhập).
-- SQL tay / service role (current_user <> 'authenticated') không bị chặn.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-066
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/066-diem-cong-tru-khoa.sql
-- =============================================================================

BEGIN;

-- --- 1. Cột trạng thái ---------------------------------------------------------

ALTER TABLE public.fp_hr_diem_cong_tru
  ADD COLUMN IF NOT EXISTS trang_thai text NOT NULL DEFAULT 'mo';

ALTER TABLE public.fp_hr_diem_cong_tru
  DROP CONSTRAINT IF EXISTS chk_fp_hr_diem_cong_tru_trang_thai,
  ADD CONSTRAINT chk_fp_hr_diem_cong_tru_trang_thai CHECK (trang_thai = ANY (ARRAY['mo'::text, 'khoa'::text]));

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.trang_thai IS
  'Trạng thái: mo (sửa/xoá theo quyền module) | khoa (chỉ quản trị module hoặc cấp bậc 1 sửa/xoá/mở khoá)';

-- --- 2. Trigger chặn ------------------------------------------------------------
-- Tên "tr_a_" để chạy TRƯỚC trigger BEFORE khác (Postgres xếp theo tên).

CREATE OR REPLACE FUNCTION public.fn_hr_diem_cong_tru_khoa() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user = 'authenticated'
     AND NOT public.fn_co_quyen_module('hanh-chinh/diem-cong-tru', ARRAY['admin', 'all']) THEN
    IF TG_OP = 'UPDATE' AND NEW.trang_thai IS DISTINCT FROM OLD.trang_thai THEN
      RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới được khoá / mở khoá bản ghi điểm cộng trừ.'
        USING ERRCODE = 'P0001';
    END IF;
    IF OLD.trang_thai = 'khoa' THEN
      RAISE EXCEPTION 'Bản ghi điểm cộng trừ % đang khoá, chỉ quản trị hoặc cấp bậc 1 mới được sửa / xoá.', OLD.id
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_hr_diem_cong_tru_khoa() IS
  'Chặn người thường đổi trang_thai hoặc sửa/xoá bản ghi fp_hr_diem_cong_tru đang khoá';

DROP TRIGGER IF EXISTS tr_a_khoa_diem_cong_tru ON public.fp_hr_diem_cong_tru;
CREATE TRIGGER tr_a_khoa_diem_cong_tru
  BEFORE UPDATE OR DELETE ON public.fp_hr_diem_cong_tru
  FOR EACH ROW EXECUTE FUNCTION public.fn_hr_diem_cong_tru_khoa();

REVOKE ALL ON FUNCTION public.fn_hr_diem_cong_tru_khoa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_hr_diem_cong_tru_khoa() TO authenticated;

-- --- 3. RLS INSERT / UPDATE / DELETE --------------------------------------------

-- Chặn tạo thẳng bản ghi đã khoá qua PostgREST (app luôn tạo 'mo', nhưng API vẫn gọi được).
DROP POLICY IF EXISTS "Allow insert fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru;
CREATE POLICY "Allow insert fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru
  FOR INSERT TO authenticated
  WITH CHECK (
    trang_thai = 'mo'
    OR public.fn_co_quyen_module('hanh-chinh/diem-cong-tru', ARRAY['admin', 'all'])
  );

DROP POLICY IF EXISTS "Allow update fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru;
DROP POLICY IF EXISTS "Allow delete fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru;

CREATE POLICY "Allow update fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru
  FOR UPDATE TO authenticated
  USING (
    trang_thai = 'mo'
    OR public.fn_co_quyen_module('hanh-chinh/diem-cong-tru', ARRAY['admin', 'all'])
  )
  WITH CHECK (
    trang_thai = 'mo'
    OR public.fn_co_quyen_module('hanh-chinh/diem-cong-tru', ARRAY['admin', 'all'])
  );

CREATE POLICY "Allow delete fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru
  FOR DELETE TO authenticated
  USING (
    trang_thai = 'mo'
    OR public.fn_co_quyen_module('hanh-chinh/diem-cong-tru', ARRAY['admin', 'all'])
  );

COMMIT;

NOTIFY pgrst, 'reload schema';
