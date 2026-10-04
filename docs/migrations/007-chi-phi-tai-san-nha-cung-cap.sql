-- =============================================================================
-- 007-chi-phi-tai-san-nha-cung-cap.sql — phiếu bảo trì / sửa chữa liên kết nhà cung cấp.
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/007-chi-phi-tai-san-nha-cung-cap.sql
--
-- - Thêm `id_nha_cung_cap` (fp_mh_danh_sach_doi_tac.id, loai_doi_tac = 'nha_cung_cap') +
--   `ten_nha_cung_cap` lưu tắt. Không bắt buộc: phiếu tự sửa nội bộ để trống.
-- - Không FK (giống id_tai_san): xoá đối tác không làm hỏng phiếu cũ, tên vẫn còn.
-- - Phiếu đã có: để trống (không có dữ liệu nguồn để điền).
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_ts_chi_phi_tai_san
  ADD COLUMN IF NOT EXISTS id_nha_cung_cap bigint,
  ADD COLUMN IF NOT EXISTS ten_nha_cung_cap text;

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_nha_cung_cap IS
  'Nhà cung cấp / đơn vị sửa chữa (fp_mh_danh_sach_doi_tac.id, không FK) — không bắt buộc.';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_nha_cung_cap IS 'Tên nhà cung cấp (lưu tắt khi tạo/cập nhật)';

CREATE INDEX IF NOT EXISTS idx_fp_ts_chi_phi_tai_san_id_nha_cung_cap
  ON public.fp_ts_chi_phi_tai_san (id_nha_cung_cap);

COMMIT;

NOTIFY pgrst, 'reload schema';
