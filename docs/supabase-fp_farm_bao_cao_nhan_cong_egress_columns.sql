-- =============================================================================
-- Báo cáo nhân công — GỠ cột generated thumbnail (nếu đã chạy bản cũ)
-- Chạy trên Supabase SQL Editor
-- =============================================================================

ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  DROP COLUMN IF EXISTS so_anh,
  DROP COLUMN IF EXISTS anh_thumbnail_url;
