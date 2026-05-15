-- =============================================================================
-- Migration: thêm cột trạng thái phiếu báo cáo nhân công (đang mở / đã khóa)
-- Chạy trên DB đã có bảng fp_farm_bao_cao_nhan_cong (idempotent).
-- =============================================================================

ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  ADD COLUMN IF NOT EXISTS trang_thai text NOT NULL DEFAULT 'mo';

UPDATE public.fp_farm_bao_cao_nhan_cong
SET trang_thai = 'mo'
WHERE trang_thai IS NULL OR btrim(trang_thai) = '';

ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  DROP CONSTRAINT IF EXISTS fp_farm_bcnc_trang_thai_chk;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong
  ADD CONSTRAINT fp_farm_bcnc_trang_thai_chk CHECK (trang_thai IN ('mo', 'khoa'));

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.trang_thai IS 'mo = đang mở; khoa = đã khóa';
