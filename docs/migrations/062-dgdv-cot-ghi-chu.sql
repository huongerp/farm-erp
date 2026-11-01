-- =============================================================================
-- 062-dgdv-cot-ghi-chu.sql — Đánh giá đầu vào: ghi chú riêng cho từng cột dây
--
-- Drawer «Thêm / Sửa dây» có ô Ghi chú. Cột mới nullable → RPC import (056/058) và insert cũ
-- vẫn chạy nguyên. Bảng đã có RLS / GRANT / trigger nhật ký → không cần thêm.
--
-- PHẢI chạy TRƯỚC khi deploy frontend (frontend select `ghi_chu` sẽ lỗi nếu cột chưa có).
--
-- Chạy: bash scripts/db-backup.sh truoc-062
--       bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/062-dgdv-cot-ghi-chu.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_farm_dgdv_cot ADD COLUMN IF NOT EXISTS ghi_chu text;
COMMENT ON COLUMN public.fp_farm_dgdv_cot.ghi_chu IS 'Ghi chú riêng của cột dây (tuỳ chọn)';

COMMIT;

NOTIFY pgrst, 'reload schema';
