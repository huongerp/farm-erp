-- 021: Định mức tồn cho hàng hoá phân thuốc (một số cho mỗi hàng, áp chung mọi kho).
-- Tồn của một kho dưới định mức → app báo đỏ ở phiếu kho / tồn kho, KHÔNG chặn lưu.
-- Chỉ thêm cột nullable — không đổi RLS / GRANT.

ALTER TABLE public.fp_farm_danh_sach_hang_hoa
  ADD COLUMN IF NOT EXISTS dinh_muc numeric(18,4)
  CHECK (dinh_muc IS NULL OR dinh_muc >= 0);

COMMENT ON COLUMN public.fp_farm_danh_sach_hang_hoa.dinh_muc IS
  'Tồn tối thiểu mỗi kho — dưới mức này app báo đỏ, không chặn';

NOTIFY pgrst, 'reload schema';
