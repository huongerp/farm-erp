-- =============================================================================
-- 064-ttdt-noi-dung-chi-tiet.sql — Thanh toán đối tác: thêm «Nội dung chi tiết»
--
-- Diễn giải nhiều dòng của khoản thanh toán (VD «15 tấn phân Wasabi × 70.000 đ/tấn = 1.050.000 đ»),
-- in trên phiếu ĐNTT. Cột mới nullable → insert cũ vẫn chạy nguyên. Bảng đã có RLS / GRANT /
-- trigger nhật ký → không cần thêm.
--
-- PHẢI chạy TRƯỚC khi deploy frontend (frontend select `noi_dung_chi_tiet` sẽ lỗi nếu cột chưa có).
--
-- Chạy: bash scripts/db-backup.sh truoc-064
--       bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/064-ttdt-noi-dung-chi-tiet.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_mh_thanh_toan_doi_tac ADD COLUMN IF NOT EXISTS noi_dung_chi_tiet text;
COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.noi_dung_chi_tiet IS 'Nội dung chi tiết / diễn giải khoản thanh toán, nhiều dòng (tuỳ chọn)';

COMMIT;

NOTIFY pgrst, 'reload schema';
