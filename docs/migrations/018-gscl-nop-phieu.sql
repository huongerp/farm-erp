-- =============================================================================
-- 018-gscl-nop-phieu.sql — Giám sát chất lượng: Nộp phiếu / Mở phiếu
--
-- Luồng: dang_kiem ──đủ thùng──▶ hoan_thanh ──nộp──▶ da_nop ──mở phiếu (cấp cao)──▶ hoan_thanh
-- - Chỉ nộp được khi đã kiểm đủ thùng (hoan_thanh).
-- - Đã nộp: chỉ cấp cao (cấp bậc 1 / chức vụ tt = 1 / admin|all trên module — xem
--   fn_co_quyen_module, mig 013) mới sửa, xoá, chấm lại thùng hoặc mở lại phiếu.
-- Khoá ở tầng DB để gọi thẳng PostgREST cũng không qua được; khớp core/trang-thai.ts ở app.
-- Chỉ kiểm khi current_user = 'authenticated' (request qua PostgREST) — chạy SQL tay /
-- service nội bộ không bị chặn.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-018
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/018-gscl-nop-phieu.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_giam_sat_chat_luong
  DROP CONSTRAINT fp_farm_gscl_trang_thai_check,
  ADD CONSTRAINT fp_farm_gscl_trang_thai_check
    CHECK (trang_thai = ANY (ARRAY['dang_kiem'::text, 'hoan_thanh'::text, 'da_nop'::text, 'huy'::text])),
  ADD COLUMN tg_nop timestamp with time zone,
  ADD COLUMN id_nguoi_nop bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.trang_thai IS
  'dang_kiem | hoan_thanh (đủ thùng, chờ nộp) | da_nop (khoá — chỉ cấp cao sửa/mở) | huy';
COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.tg_nop IS 'Thời điểm nộp phiếu; NULL khi chưa nộp / đã mở lại';

CREATE OR REPLACE FUNCTION public.fn_farm_gscl_la_cap_cao() RETURNS boolean
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT public.fn_co_quyen_module('quan-ly-nha-so-che/giam-sat-chat-luong', ARRAY['admin', 'all']);
$$;

-- Phiếu: khoá khi đã nộp; chỉ chuyển sang da_nop từ hoan_thanh.
CREATE OR REPLACE FUNCTION public.fn_farm_gscl_khoa_phieu() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF OLD.trang_thai = 'da_nop' AND NOT public.fn_farm_gscl_la_cap_cao() THEN
    RAISE EXCEPTION 'Phiếu % đã nộp — chỉ quản trị hoặc cấp bậc 1 mới sửa, xoá hoặc mở lại.', OLD.so_phieu
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.trang_thai = 'da_nop' AND OLD.trang_thai NOT IN ('hoan_thanh', 'da_nop') THEN
    RAISE EXCEPTION 'Chỉ nộp được phiếu đã kiểm đủ thùng mẫu.' USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

CREATE TRIGGER trg_farm_gscl_khoa_phieu
  BEFORE UPDATE OR DELETE ON public.fp_farm_giam_sat_chat_luong
  FOR EACH ROW EXECUTE FUNCTION public.fn_farm_gscl_khoa_phieu();

-- Thùng mẫu: phiếu cha đã nộp thì không chấm / sửa / xoá thùng (trừ cấp cao).
-- Xoá dây chuyền khi xoá phiếu: lúc đó phiếu cha không còn → không chặn.
CREATE OR REPLACE FUNCTION public.fn_farm_gscl_khoa_thung() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tt text;
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT trang_thai INTO v_tt
    FROM public.fp_farm_giam_sat_chat_luong
   WHERE id = COALESCE(NEW.id_phieu, OLD.id_phieu);

  IF v_tt = 'da_nop' AND NOT public.fn_farm_gscl_la_cap_cao() THEN
    RAISE EXCEPTION 'Phiếu đã nộp — chỉ quản trị hoặc cấp bậc 1 mới chấm lại thùng.' USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

CREATE TRIGGER trg_farm_gscl_khoa_thung
  BEFORE INSERT OR UPDATE OR DELETE ON public.fp_farm_giam_sat_chat_luong_ct
  FOR EACH ROW EXECUTE FUNCTION public.fn_farm_gscl_khoa_thung();

REVOKE ALL ON FUNCTION public.fn_farm_gscl_la_cap_cao() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_farm_gscl_la_cap_cao() TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
