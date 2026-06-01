-- =============================================================================
-- fp_farm_bao_cao_nhan_cong — kiểm tra / dọn ảnh trước & sau migrate Cloudinary
-- Ảnh thực tế chuyển lên Cloudinary bằng: node scripts/migrate-base64-to-cloudinary.mjs
-- =============================================================================

-- 1) Gỡ cột generated (nếu có)
ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  DROP COLUMN IF EXISTS so_anh,
  DROP COLUMN IF EXISTS anh_thumbnail_url;

-- 2) Kiểm tra trước migrate
SELECT
  count(*) AS tong_dong,
  count(*) FILTER (WHERE hinh_anh_urls::text LIKE '%data:image/%') AS dong_co_base64,
  count(*) FILTER (WHERE hinh_anh_urls::text LIKE '%https://%') AS dong_co_url,
  pg_size_pretty(sum(octet_length(hinh_anh_urls::text))::bigint) AS tong_byte_json_anh
FROM public.fp_farm_bao_cao_nhan_cong;

-- 3) (TÙY CHỌN — chỉ khi muốn XÓA HẾT ảnh, không upload Cloudinary)
-- UPDATE public.fp_farm_bao_cao_nhan_cong SET hinh_anh_urls = '[]'::jsonb;

-- 4) Sau khi chạy script Node migrate xong — kiểm tra lại (mong đợi dong_co_base64 = 0)
SELECT
  count(*) FILTER (WHERE hinh_anh_urls::text LIKE '%data:image/%') AS con_base64,
  count(*) FILTER (WHERE jsonb_array_length(hinh_anh_urls) > 0) AS dong_co_anh
FROM public.fp_farm_bao_cao_nhan_cong;

-- 5) Thu hồi dung lượng disk (chạy ngoài giờ cao điểm nếu bảng lớn)
-- VACUUM FULL public.fp_farm_bao_cao_nhan_cong;
