-- =============================================================================
-- Điền cột fp_var_nhan_vien.cap_bac (số cấp bậc) và giữ nó tự đồng bộ
--
-- VẤN ĐỀ: cột `cap_bac` (smallint) là bản denormalize của
-- `fp_var_cap_bac.cap_bac`, nhưng KHÔNG ai điền:
--   - trigger fp_var_nhan_vien_sync_display_names chỉ đồng bộ 4 cột TÊN
--     (ten_phong_ban, ten_chuc_vu, ten_cap_bac, ten_chi_nhanh) — bỏ sót cap_bac;
--   - trigger fp_var_cap_bac_sync_nhan_vien_ten chỉ lan lại ten_cap_bac;
--   - nhan-vien-service.ts phía app chỉ ghi cap_bac_id.
-- Hệ quả: cả 46 nhân viên đều có cap_bac = NULL, nên nhánh "cấp bậc 1 = toàn
-- quyền" của app (features/he-thong/phan-quyen/core/cap-bac-toan-quyen.ts,
-- dùng trong use-module-permission.ts và use-employee-branch-module-scope.ts)
-- CHƯA BAO GIỜ chạy — kể cả Tổng Giám Đốc cũng phải tick quyền từng module.
--
-- Nguồn cấp bậc là bảng fp_var_cap_bac (Giám đốc 1, Trưởng bộ phận 2, Quản lý 3,
-- Nhóm trưởng 4, Nhân viên 5), tra qua fp_var_nhan_vien.cap_bac_id.
-- KHÔNG dùng fp_var_chuc_vu.tt: `tt` là thứ tự hiển thị chạy 1..14, cùng một
-- chức vụ "Quản lý điều hành" đang có tt = 3, 5 và 14.
--
-- Chạy lại nhiều lần được (idempotent).
-- =============================================================================

BEGIN;

-- 1) Backfill cho dữ liệu hiện có.
UPDATE public.fp_var_nhan_vien nv
SET cap_bac = cb.cap_bac
FROM public.fp_var_cap_bac cb
WHERE cb.id = nv.cap_bac_id
  AND nv.cap_bac IS DISTINCT FROM cb.cap_bac;

-- Nhân viên không gán cấp bậc thì cap_bac phải NULL (không giữ giá trị cũ).
UPDATE public.fp_var_nhan_vien
SET cap_bac = NULL
WHERE cap_bac_id IS NULL
  AND cap_bac IS NOT NULL;

-- 2) Trigger trên nhân viên: thêm cap_bac vào đúng khối đọc fp_var_cap_bac.
--    Giữ nguyên 4 khối tên hiện có.
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

  -- ten_cap_bac + cap_bac (SỐ cấp bậc) từ fp_var_cap_bac
  IF NEW.cap_bac_id IS NOT NULL THEN
    SELECT ten_cap_bac, cap_bac INTO NEW.ten_cap_bac, NEW.cap_bac
    FROM public.fp_var_cap_bac
    WHERE id = NEW.cap_bac_id;
  ELSE
    NEW.ten_cap_bac := NULL;
    NEW.cap_bac := NULL;
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

-- 3) Trigger trên bảng cấp bậc: lan cả SỐ cấp bậc, không chỉ tên.
--    Sửa "Quản lý" từ 3 thành 4 mà không lan thì nhân viên vẫn giữ số cũ.
CREATE OR REPLACE FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.ten_cap_bac IS DISTINCT FROM NEW.ten_cap_bac
     OR OLD.cap_bac IS DISTINCT FROM NEW.cap_bac THEN
    UPDATE public.fp_var_nhan_vien
    SET ten_cap_bac = NEW.ten_cap_bac,
        cap_bac = NEW.cap_bac
    WHERE cap_bac_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cũ chỉ lắng nghe UPDATE OF ten_cap_bac thì sẽ không bắn khi chỉ sửa
-- số cap_bac — dựng lại cho nghe cả hai cột.
DROP TRIGGER IF EXISTS tr_fp_var_cap_bac_sync_nhan_vien_ten ON public.fp_var_cap_bac;
CREATE TRIGGER tr_fp_var_cap_bac_sync_nhan_vien_ten
  AFTER UPDATE OF ten_cap_bac, cap_bac ON public.fp_var_cap_bac
  FOR EACH ROW EXECUTE FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten();

COMMENT ON COLUMN public.fp_var_nhan_vien.cap_bac IS
  'SỐ cấp bậc, denormalize từ fp_var_cap_bac.cap_bac qua cap_bac_id (trigger tự đồng bộ). App dùng cap_bac = 1 làm điều kiện toàn quyền.';

COMMIT;

-- Lưu ý sau khi chạy: user.cap_bac là snapshot lưu trong localStorage lúc đăng
-- nhập (zustand persist, key 'auth-storage') → người đang đăng nhập phải ĐĂNG
-- XUẤT/ĐĂNG NHẬP LẠI mới nhận cấp bậc mới.
