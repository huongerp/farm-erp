-- =============================================================================
-- 041-dknh-khoa-huy-hoan-tac-cap-cao.sql — Đăng ký nhận hàng: huỷ / khôi phục / hoàn tác chỉ cấp cao
--
--   cho_vao ──check in──▶ da_vao ──check out──▶ da_ra      (ai có quyền sửa module)
--   cho_vao ──huỷ──▶ huy ──khôi phục──▶ cho_vao            (chỉ cấp cao)
--   da_vao ──hoàn tác check in──▶ cho_vao                   (chỉ cấp cao)
--   da_ra ──hoàn tác check out──▶ da_vao                    (chỉ cấp cao)
--
-- Cấp cao = cấp bậc 1 / chức vụ tt = 1 / admin|all trên module (fn_co_quyen_module).
-- Khớp features/quan-ly-nha-so-che/dang-ky-nhan-hang/core/trang-thai.ts ở app.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-041
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/041-dknh-khoa-huy-hoan-tac-cap-cao.sql
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_dknh_la_cap_cao() RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT public.fn_co_quyen_module('quan-ly-nha-so-che/dang-ky-nhan-hang', ARRAY['admin', 'all']);
$$;

REVOKE ALL ON FUNCTION public.fn_dknh_la_cap_cao() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_dknh_la_cap_cao() TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_dknh_khoa_chuyen_trang_thai() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Migration, SQL tay, hàm SECURITY DEFINER: không chặn.
  IF current_user <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  IF NEW.trang_thai IS NOT DISTINCT FROM OLD.trang_thai THEN
    RETURN NEW;
  END IF;

  -- Người thường chỉ check in / check out.
  IF (OLD.trang_thai = 'cho_vao' AND NEW.trang_thai = 'da_vao')
     OR (OLD.trang_thai = 'da_vao' AND NEW.trang_thai = 'da_ra') THEN
    RETURN NEW;
  END IF;

  IF public.fn_dknh_la_cap_cao() THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Huỷ, khôi phục và hoàn tác phiếu đăng ký nhận hàng chỉ dành cho quản trị hoặc cấp bậc 1.'
    USING ERRCODE = 'P0001';
END
$$;

REVOKE ALL ON FUNCTION public.fn_dknh_khoa_chuyen_trang_thai() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_dknh_khoa_chuyen_trang_thai ON public.fp_farm_dang_ky_nhan_hang;
CREATE TRIGGER trg_dknh_khoa_chuyen_trang_thai
  BEFORE UPDATE ON public.fp_farm_dang_ky_nhan_hang
  FOR EACH ROW EXECUTE FUNCTION public.fn_dknh_khoa_chuyen_trang_thai();

COMMIT;
