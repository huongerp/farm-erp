-- =============================================================================
-- 031-gscl-anh-thung.sql — Giám sát chất lượng: ảnh chụp từng thùng mẫu
-- Mỗi thùng lưu mảng URL ảnh (Cloudinary, app nén trước khi up). Chụp trong form chấm thùng
-- hoặc bấm nút máy ảnh ở chi tiết phiếu. Khoá theo trigger trg_farm_gscl_khoa_thung (018):
-- phiếu đã nộp thì chỉ cấp cao sửa ảnh. Nhật ký thay đổi đã gắn sẵn trên bảng.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-031
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/031-gscl-anh-thung.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_giam_sat_chat_luong_ct
  ADD COLUMN hinh_anh_urls text[] DEFAULT ARRAY[]::text[] NOT NULL;

COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong_ct.hinh_anh_urls IS
  'Mảng URL ảnh thùng mẫu (Cloudinary), thứ tự = thứ tự hiển thị';

COMMIT;

NOTIFY pgrst, 'reload schema';
