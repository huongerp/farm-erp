-- =============================================================================
-- Farm: Báo cáo nhân công — thêm ảnh đính kèm (URL Cloudinary), lưu jsonb
-- Chạy trên Supabase SQL Editor sau khi bảng fp_farm_bao_cao_nhan_cong đã tồn tại.
-- =============================================================================

ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  ADD COLUMN IF NOT EXISTS hinh_anh_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.hinh_anh_urls IS
  'Mảng URL ảnh (https), upload Cloudinary; thứ tự = thứ tự hiển thị';

-- Đảm bảo dữ liệu cũ / null an toàn
UPDATE public.fp_farm_bao_cao_nhan_cong
SET hinh_anh_urls = '[]'::jsonb
WHERE hinh_anh_urls IS NULL;
