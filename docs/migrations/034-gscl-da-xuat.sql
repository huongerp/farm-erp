-- =============================================================================
-- 034-gscl-da-xuat.sql — Giám sát chất lượng: trạng thái "Đã xuất"
--
-- Luồng: dang_kiem ──đủ thùng──▶ hoan_thanh ──nộp──▶ da_nop ──xuất──▶ da_xuat
--                                    ◀──mở phiếu (cấp cao)──┘ ◀──huỷ xuất (cấp cao)──┘
-- - Chỉ xuất được phiếu đã nộp; ai có quyền sửa module (qua RLS) đều xuất được.
-- - Đã xuất khoá như đã nộp: chỉ cấp cao sửa, xoá, chấm lại thùng hoặc huỷ xuất (về da_nop).
-- - Rời da_xuat chỉ về da_nop (muốn mở phiếu thì huỷ xuất trước).
-- Khớp core/trang-thai.ts ở app. Thay thế 2 hàm trigger của migration 018.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-034
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/034-gscl-da-xuat.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_giam_sat_chat_luong
  DROP CONSTRAINT fp_farm_gscl_trang_thai_check,
  ADD CONSTRAINT fp_farm_gscl_trang_thai_check
    CHECK (trang_thai = ANY (ARRAY['dang_kiem'::text, 'hoan_thanh'::text, 'da_nop'::text, 'da_xuat'::text, 'huy'::text])),
  ADD COLUMN tg_xuat timestamp with time zone,
  ADD COLUMN id_nguoi_xuat bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.trang_thai IS
  'dang_kiem | hoan_thanh (đủ thùng, chờ nộp) | da_nop (khoá — chỉ cấp cao sửa/mở) | da_xuat (khoá — chỉ cấp cao huỷ xuất) | huy';
COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.tg_xuat IS 'Thời điểm xuất; NULL khi chưa xuất / đã huỷ xuất';

CREATE OR REPLACE FUNCTION public.fn_farm_gscl_khoa_phieu() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  c_cot_xuat CONSTANT text[] := ARRAY['trang_thai', 'tg_xuat', 'id_nguoi_xuat', 'tg_cap_nhat'];
BEGIN
  IF current_user <> 'authenticated' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Xuất phiếu đã nộp: người thường được phép, miễn chỉ đổi trạng thái + người/thời điểm xuất.
  IF TG_OP = 'UPDATE' AND OLD.trang_thai = 'da_nop' AND NEW.trang_thai = 'da_xuat'
     AND (to_jsonb(NEW) - c_cot_xuat) = (to_jsonb(OLD) - c_cot_xuat) THEN
    RETURN NEW;
  END IF;

  IF OLD.trang_thai IN ('da_nop', 'da_xuat') AND NOT public.fn_farm_gscl_la_cap_cao() THEN
    RAISE EXCEPTION 'Phiếu % đã nộp / đã xuất — chỉ quản trị hoặc cấp bậc 1 mới sửa, xoá hoặc mở lại.', OLD.so_phieu
      USING ERRCODE = 'P0001';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.trang_thai = 'da_nop' AND OLD.trang_thai NOT IN ('hoan_thanh', 'da_nop', 'da_xuat') THEN
      RAISE EXCEPTION 'Chỉ nộp được phiếu đã kiểm đủ thùng mẫu.' USING ERRCODE = 'P0001';
    END IF;
    IF NEW.trang_thai = 'da_xuat' AND OLD.trang_thai NOT IN ('da_nop', 'da_xuat') THEN
      RAISE EXCEPTION 'Chỉ xuất được phiếu đã nộp.' USING ERRCODE = 'P0001';
    END IF;
    IF OLD.trang_thai = 'da_xuat' AND NEW.trang_thai NOT IN ('da_xuat', 'da_nop') THEN
      RAISE EXCEPTION 'Phiếu đã xuất chỉ huỷ xuất về "Đã nộp".' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

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

  IF v_tt IN ('da_nop', 'da_xuat') AND NOT public.fn_farm_gscl_la_cap_cao() THEN
    RAISE EXCEPTION 'Phiếu đã nộp / đã xuất — chỉ quản trị hoặc cấp bậc 1 mới chấm lại thùng.' USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END
$$;

COMMIT;

NOTIFY pgrst, 'reload schema';
