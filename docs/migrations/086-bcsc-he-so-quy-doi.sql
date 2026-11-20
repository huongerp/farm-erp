-- =============================================================================
-- 086-bcsc-he-so-quy-doi.sql — Báo cáo sơ chế: hệ số quy đổi cho từng dòng phẩm cấp / loại thùng
--
-- Tổng quy đổi (so_thung_quy_doi) trước đây nhập tay. Nay mỗi dòng có hệ số; app tính
-- so_thung_quy_doi = so_thung × he_so_quy_doi và vẫn lưu kết quả vào so_thung_quy_doi (KPI,
-- thống kê, in/xuất đọc cột này như cũ). NULL = phiếu cũ nhập tay, giữ nguyên số đã lưu.
-- Danh sách hệ số để chọn trên form lấy từ các giá trị đã lưu ở cột này (không có bảng danh mục).
-- Ghi qua PostgREST, RLS có sẵn của bảng đã phủ cột mới.
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/086-bcsc-he-so-quy-doi.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap ADD COLUMN IF NOT EXISTS he_so_quy_doi numeric(8,4);
ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap DROP CONSTRAINT IF EXISTS fp_farm_bcsc_pc_he_so_quy_doi_chk;
ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap
  ADD CONSTRAINT fp_farm_bcsc_pc_he_so_quy_doi_chk CHECK (he_so_quy_doi IS NULL OR he_so_quy_doi >= 0);
COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.he_so_quy_doi IS
  'Hệ số quy đổi thùng; so_thung_quy_doi = so_thung × hệ số (tính trên app). NULL = phiếu cũ nhập tay tổng quy đổi';

COMMIT;

NOTIFY pgrst, 'reload schema';
