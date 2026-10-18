-- 046: Nhóm phiếu hành chính — trạng thái lưu chữ tiếng Việt thay vì số 0/1.
-- App (Thiết lập công lương → Nhóm phiếu) gửi 'Đang hoạt động' / 'Ngừng hoạt động' như mọi danh mục
-- khác, nhưng cột còn là smallint → thêm/sửa báo [22P02] invalid input syntax for type smallint.
-- Quy đổi dữ liệu cũ: 0 → 'Ngừng hoạt động', còn lại → 'Đang hoạt động'. Không view/RPC nào đọc
-- cột này; index idx_fp_hr_nhom_phieu_trang_thai tự build lại. Không đổi RLS / GRANT.

BEGIN;

ALTER TABLE public.fp_hr_nhom_phieu_hanh_chinh
  DROP CONSTRAINT fp_hr_nhom_phieu_hanh_chinh_trang_thai_check,
  ALTER COLUMN trang_thai DROP DEFAULT;

ALTER TABLE public.fp_hr_nhom_phieu_hanh_chinh
  ALTER COLUMN trang_thai TYPE text
    USING CASE WHEN trang_thai = 0 THEN 'Ngừng hoạt động' ELSE 'Đang hoạt động' END,
  ALTER COLUMN trang_thai SET DEFAULT 'Đang hoạt động',
  ADD CONSTRAINT fp_hr_nhom_phieu_hanh_chinh_trang_thai_check
    CHECK (trang_thai IN ('Đang hoạt động', 'Ngừng hoạt động'));

COMMENT ON COLUMN public.fp_hr_nhom_phieu_hanh_chinh.trang_thai IS 'Đang hoạt động / Ngừng hoạt động';

COMMIT;

NOTIFY pgrst, 'reload schema';
