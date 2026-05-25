-- =============================================================================
-- ALTER fp_mh_hop_dong: thêm cột hinh_anh_urls (ảnh đính kèm hợp đồng)
-- Chạy trong Supabase Dashboard → SQL Editor.
-- Lưu danh sách URL ảnh (text[]) – ảnh được upload lên Cloudinary từ frontend.
-- =============================================================================

ALTER TABLE fp_mh_hop_dong
  ADD COLUMN IF NOT EXISTS hinh_anh_urls text[] NOT NULL DEFAULT ARRAY[]::text[];

COMMENT ON COLUMN fp_mh_hop_dong.hinh_anh_urls IS
  'Danh sách URL ảnh đính kèm hợp đồng (lưu trên Cloudinary). Tối đa 20 ảnh, <= 5MB/ảnh khi upload.';
