-- =============================================================================
-- fp_var_nhan_vien: tự động điền ten_phong_ban, ten_chuc_vu, ten_chi_nhanh, ten_cap_bac
-- từ bảng phòng ban, chức vụ, chi nhánh, cấp bậc (theo id).
-- Chạy trong Supabase SQL Editor sau khi đã có bảng fp_var_nhan_vien, fp_var_phong_ban,
-- fp_var_chuc_vu, fp_var_chi_nhanh, fp_var_cap_bac.
-- =============================================================================

-- 1) Thêm các cột hiển thị (denormalized) nếu chưa có
ALTER TABLE public.fp_var_nhan_vien
  ADD COLUMN IF NOT EXISTS ten_phong_ban text,
  ADD COLUMN IF NOT EXISTS ten_chuc_vu   text,
  ADD COLUMN IF NOT EXISTS ten_chi_nhanh text,
  ADD COLUMN IF NOT EXISTS ten_cap_bac   text;

COMMENT ON COLUMN public.fp_var_nhan_vien.ten_phong_ban IS 'Tên phòng ban (sync từ fp_var_phong_ban theo phong_ban_id)';
COMMENT ON COLUMN public.fp_var_nhan_vien.ten_chuc_vu   IS 'Tên chức vụ (sync từ fp_var_chuc_vu theo chuc_vu_id)';
COMMENT ON COLUMN public.fp_var_nhan_vien.ten_chi_nhanh IS 'Tên chi nhánh (gộp từ fp_var_chi_nhanh theo chi_nhanh_ids)';
COMMENT ON COLUMN public.fp_var_nhan_vien.ten_cap_bac   IS 'Tên cấp bậc (sync từ fp_var_cap_bac theo cap_bac_id)';

-- 2) Hàm trigger: khi INSERT/UPDATE nhân viên, điền ten_phong_ban, ten_chuc_vu, ten_chi_nhanh, ten_cap_bac
CREATE OR REPLACE FUNCTION public.fp_var_nhan_vien_sync_display_names()
RETURNS TRIGGER AS $$
BEGIN
  -- ten_phong_ban từ fp_var_phong_ban
  IF NEW.phong_ban_id IS NOT NULL THEN
    SELECT ten_phong_ban INTO NEW.ten_phong_ban
    FROM public.fp_var_phong_ban
    WHERE id = NEW.phong_ban_id;
  ELSE
    NEW.ten_phong_ban := NULL;
  END IF;

  -- ten_chuc_vu từ fp_var_chuc_vu
  IF NEW.chuc_vu_id IS NOT NULL THEN
    SELECT ten_chuc_vu INTO NEW.ten_chuc_vu
    FROM public.fp_var_chuc_vu
    WHERE id = NEW.chuc_vu_id;
  ELSE
    NEW.ten_chuc_vu := NULL;
  END IF;

  -- ten_cap_bac từ fp_var_cap_bac
  IF NEW.cap_bac_id IS NOT NULL THEN
    SELECT ten_cap_bac INTO NEW.ten_cap_bac
    FROM public.fp_var_cap_bac
    WHERE id = NEW.cap_bac_id;
  ELSE
    NEW.ten_cap_bac := NULL;
  END IF;

  -- ten_chi_nhanh: gộp tên theo thứ tự chi_nhanh_ids (mảng text)
  IF NEW.chi_nhanh_ids IS NOT NULL AND array_length(NEW.chi_nhanh_ids, 1) > 0 THEN
    SELECT string_agg(c.ten_chi_nhanh, ', ' ORDER BY ord)
    INTO NEW.ten_chi_nhanh
    FROM unnest(NEW.chi_nhanh_ids) WITH ORDINALITY AS arr(cn_id, ord)
    JOIN public.fp_var_chi_nhanh c ON c.id::text = arr.cn_id;
  ELSE
    NEW.ten_chi_nhanh := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger trên fp_var_nhan_vien
DROP TRIGGER IF EXISTS tr_fp_var_nhan_vien_sync_display_names ON public.fp_var_nhan_vien;
CREATE TRIGGER tr_fp_var_nhan_vien_sync_display_names
  BEFORE INSERT OR UPDATE OF phong_ban_id, chuc_vu_id, cap_bac_id, chi_nhanh_ids
  ON public.fp_var_nhan_vien
  FOR EACH ROW
  EXECUTE PROCEDURE public.fp_var_nhan_vien_sync_display_names();

-- 3) Khi đổi tên phòng ban → cập nhật tất cả nhân viên thuộc phòng đó
CREATE OR REPLACE FUNCTION public.fp_var_phong_ban_sync_nhan_vien_ten()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ten_phong_ban IS DISTINCT FROM NEW.ten_phong_ban THEN
    UPDATE public.fp_var_nhan_vien
    SET ten_phong_ban = NEW.ten_phong_ban
    WHERE phong_ban_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_var_phong_ban_sync_nhan_vien_ten ON public.fp_var_phong_ban;
CREATE TRIGGER tr_fp_var_phong_ban_sync_nhan_vien_ten
  AFTER UPDATE OF ten_phong_ban ON public.fp_var_phong_ban
  FOR EACH ROW
  EXECUTE PROCEDURE public.fp_var_phong_ban_sync_nhan_vien_ten();

-- 4) Khi đổi tên chức vụ → cập nhật tất cả nhân viên có chức vụ đó
CREATE OR REPLACE FUNCTION public.fp_var_chuc_vu_sync_nhan_vien_ten()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ten_chuc_vu IS DISTINCT FROM NEW.ten_chuc_vu THEN
    UPDATE public.fp_var_nhan_vien
    SET ten_chuc_vu = NEW.ten_chuc_vu
    WHERE chuc_vu_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_var_chuc_vu_sync_nhan_vien_ten ON public.fp_var_chuc_vu;
CREATE TRIGGER tr_fp_var_chuc_vu_sync_nhan_vien_ten
  AFTER UPDATE OF ten_chuc_vu ON public.fp_var_chuc_vu
  FOR EACH ROW
  EXECUTE PROCEDURE public.fp_var_chuc_vu_sync_nhan_vien_ten();

-- 5) Khi đổi tên cấp bậc → cập nhật tất cả nhân viên có cấp bậc đó
CREATE OR REPLACE FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ten_cap_bac IS DISTINCT FROM NEW.ten_cap_bac THEN
    UPDATE public.fp_var_nhan_vien
    SET ten_cap_bac = NEW.ten_cap_bac
    WHERE cap_bac_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_var_cap_bac_sync_nhan_vien_ten ON public.fp_var_cap_bac;
CREATE TRIGGER tr_fp_var_cap_bac_sync_nhan_vien_ten
  AFTER UPDATE OF ten_cap_bac ON public.fp_var_cap_bac
  FOR EACH ROW
  EXECUTE PROCEDURE public.fp_var_cap_bac_sync_nhan_vien_ten();

-- 6) Khi đổi tên chi nhánh → cập nhật ten_chi_nhanh cho mọi nhân viên có chi nhánh đó trong chi_nhanh_ids
CREATE OR REPLACE FUNCTION public.fp_var_chi_nhanh_sync_nhan_vien_ten()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ten_chi_nhanh IS DISTINCT FROM NEW.ten_chi_nhanh THEN
    UPDATE public.fp_var_nhan_vien n
    SET ten_chi_nhanh = (
      SELECT string_agg(c.ten_chi_nhanh, ', ' ORDER BY ord)
      FROM unnest(COALESCE(n.chi_nhanh_ids, ARRAY[]::text[])) WITH ORDINALITY AS arr(cn_id, ord)
      JOIN public.fp_var_chi_nhanh c ON c.id::text = arr.cn_id
    )
    WHERE n.chi_nhanh_ids IS NOT NULL
      AND NEW.id::text = ANY(n.chi_nhanh_ids);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_var_chi_nhanh_sync_nhan_vien_ten ON public.fp_var_chi_nhanh;
CREATE TRIGGER tr_fp_var_chi_nhanh_sync_nhan_vien_ten
  AFTER UPDATE OF ten_chi_nhanh ON public.fp_var_chi_nhanh
  FOR EACH ROW
  EXECUTE PROCEDURE public.fp_var_chi_nhanh_sync_nhan_vien_ten();

-- 7) Backfill: cập nhật toàn bộ bản ghi hiện có (chạy một lần sau khi tạo trigger)
UPDATE public.fp_var_nhan_vien n
SET
  ten_phong_ban = (SELECT ten_phong_ban FROM public.fp_var_phong_ban WHERE id = n.phong_ban_id),
  ten_chuc_vu   = (SELECT ten_chuc_vu FROM public.fp_var_chuc_vu WHERE id = n.chuc_vu_id),
  ten_cap_bac   = (SELECT ten_cap_bac FROM public.fp_var_cap_bac WHERE id = n.cap_bac_id),
  ten_chi_nhanh = (
    SELECT string_agg(c.ten_chi_nhanh, ', ' ORDER BY ord)
    FROM unnest(COALESCE(n.chi_nhanh_ids, ARRAY[]::text[])) WITH ORDINALITY AS arr(cn_id, ord)
    JOIN public.fp_var_chi_nhanh c ON c.id::text = arr.cn_id
  );
