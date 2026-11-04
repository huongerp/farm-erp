-- =============================================================================
-- 069-diem-cong-tru-quan-ly-trao-doi.sql — Trường "Quản lý trao đổi" cho Điểm cộng trừ
-- Chỉ quản trị module (admin/all) hoặc cấp bậc 1 được ghi — fn_co_quyen_module đã gồm
-- nhánh cap_bac = 1 (migration 013), khớp coTheDoiKhoa ở core/quyen-khoa.ts.
-- Người thường vẫn sửa bản ghi 'mo' như cũ, chỉ không được đổi cột này (trigger báo P0001).
-- SQL tay / service role (current_user <> 'authenticated') không bị chặn.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-069
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/069-diem-cong-tru-quan-ly-trao-doi.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_hr_diem_cong_tru
  ADD COLUMN IF NOT EXISTS quan_ly_trao_doi text;

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.quan_ly_trao_doi IS
  'Nội dung quản lý trao đổi với nhân viên — chỉ quản trị module hoặc cấp bậc 1 được ghi';

CREATE OR REPLACE FUNCTION public.fn_hr_diem_cong_tru_trao_doi() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user = 'authenticated'
     AND (
       (TG_OP = 'INSERT' AND NULLIF(btrim(NEW.quan_ly_trao_doi), '') IS NOT NULL)
       OR (TG_OP = 'UPDATE' AND NEW.quan_ly_trao_doi IS DISTINCT FROM OLD.quan_ly_trao_doi)
     )
     AND NOT public.fn_co_quyen_module('hanh-chinh/diem-cong-tru', ARRAY['admin', 'all']) THEN
    RAISE EXCEPTION 'Chỉ quản trị hoặc cấp bậc 1 mới được ghi "Quản lý trao đổi" của điểm cộng trừ.'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_hr_diem_cong_tru_trao_doi() IS
  'Chặn người thường ghi cột quan_ly_trao_doi của fp_hr_diem_cong_tru';

DROP TRIGGER IF EXISTS tr_b_trao_doi_diem_cong_tru ON public.fp_hr_diem_cong_tru;
CREATE TRIGGER tr_b_trao_doi_diem_cong_tru
  BEFORE INSERT OR UPDATE ON public.fp_hr_diem_cong_tru
  FOR EACH ROW EXECUTE FUNCTION public.fn_hr_diem_cong_tru_trao_doi();

REVOKE ALL ON FUNCTION public.fn_hr_diem_cong_tru_trao_doi() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_hr_diem_cong_tru_trao_doi() TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
