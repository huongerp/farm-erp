-- =============================================================================
-- XÓA toàn bộ dữ liệu trong cột hinh_anh_urls (fp_farm_bao_cao_nhan_cong)
-- CẢNH BÁO: Không khôi phục được — ảnh base64/URL trong DB sẽ mất hết.
-- Chạy trên Supabase SQL Editor
-- =============================================================================

-- Kiểm tra trước khi xóa
SELECT
  count(*) AS tong_dong,
  count(*) FILTER (WHERE jsonb_array_length(hinh_anh_urls) > 0) AS dong_co_anh,
  pg_size_pretty(sum(octet_length(hinh_anh_urls::text))::bigint) AS tong_byte_json_anh
FROM public.fp_farm_bao_cao_nhan_cong;

-- Xóa hết (mảng rỗng)
UPDATE public.fp_farm_bao_cao_nhan_cong
SET hinh_anh_urls = '[]'::jsonb;

-- Xác nhận sau xóa
SELECT
  count(*) FILTER (WHERE jsonb_array_length(hinh_anh_urls) > 0) AS con_anh,
  pg_size_pretty(sum(octet_length(hinh_anh_urls::text))::bigint) AS tong_byte_con_lai
FROM public.fp_farm_bao_cao_nhan_cong;

-- (Tùy chọn) Thu hồi dung lượng disk sau khi xóa base64 lớn
-- VACUUM FULL public.fp_farm_bao_cao_nhan_cong;
