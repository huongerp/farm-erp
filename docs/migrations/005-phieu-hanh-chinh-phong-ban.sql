-- =============================================================================
-- 005-phieu-hanh-chinh-phong-ban.sql — phiếu hành chính lưu phòng ban của người gửi.
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/005-phieu-hanh-chinh-phong-ban.sql
--
-- - Thêm `phong_ban_id`: phòng ban của người gửi TẠI LÚC TẠO phiếu (ảnh chụp, không
--   đổi theo khi nhân viên chuyển phòng sau này). Tên phòng ban app tra từ
--   fp_var_phong_ban theo id, giống cách tra tên loại phiếu / người gửi.
-- - Trigger BEFORE INSERT tự điền từ fp_var_nhan_vien.phong_ban_id khi người ghi
--   không gửi — frontend, phiếu hệ thống (createAdminFormSystem) và SQL tay đều được.
--   Chỉ INSERT: để UPDATE (duyệt / sửa) không tự đổi cột này.
-- - Phiếu đã có: điền theo phòng ban HIỆN TẠI của người gửi (không còn dữ liệu cũ hơn).
--   Tắt tạm trigger thông báo trong lúc điền: không thì mỗi phiếu đã duyệt sinh một
--   sự kiện "đã sửa phiếu sau khi phiếu được duyệt" gửi tới người duyệt.
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_hr_phieu_hanh_chinh
  ADD COLUMN IF NOT EXISTS phong_ban_id bigint;

COMMENT ON COLUMN public.fp_hr_phieu_hanh_chinh.phong_ban_id IS
  'Phòng ban của người gửi lúc tạo phiếu (trigger tr_phieu_hc_dien_phong_ban tự điền).';

-- SECURITY DEFINER: fp_var_nhan_vien cấp quyền theo cột, không phụ thuộc quyền người ghi.
CREATE OR REPLACE FUNCTION public.fn_phieu_hc_dien_phong_ban() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.phong_ban_id IS NULL AND NEW.nguoi_tao_id IS NOT NULL THEN
    SELECT nv.phong_ban_id INTO NEW.phong_ban_id
    FROM public.fp_var_nhan_vien nv
    WHERE nv.id = NEW.nguoi_tao_id;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_phieu_hc_dien_phong_ban() IS
  'Điền phong_ban_id của phiếu hành chính từ phòng ban hiện tại của người gửi khi tạo phiếu.';

DROP TRIGGER IF EXISTS tr_phieu_hc_dien_phong_ban ON public.fp_hr_phieu_hanh_chinh;
CREATE TRIGGER tr_phieu_hc_dien_phong_ban
  BEFORE INSERT ON public.fp_hr_phieu_hanh_chinh
  FOR EACH ROW EXECUTE FUNCTION public.fn_phieu_hc_dien_phong_ban();

ALTER TABLE public.fp_hr_phieu_hanh_chinh DISABLE TRIGGER tr_thong_bao_fp_hr_phieu_hanh_chinh;

UPDATE public.fp_hr_phieu_hanh_chinh p
SET phong_ban_id = nv.phong_ban_id
FROM public.fp_var_nhan_vien nv
WHERE nv.id = p.nguoi_tao_id
  AND p.phong_ban_id IS NULL
  AND nv.phong_ban_id IS NOT NULL;

ALTER TABLE public.fp_hr_phieu_hanh_chinh ENABLE TRIGGER tr_thong_bao_fp_hr_phieu_hanh_chinh;

COMMIT;

NOTIFY pgrst, 'reload schema';
