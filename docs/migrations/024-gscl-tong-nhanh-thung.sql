-- =============================================================================
-- 024-gscl-tong-nhanh-thung.sql — Giám sát chất lượng: tổng số nhánh/nải của từng thùng mẫu
--
-- Người kiểm nhập thêm tổng số nhánh/nải trong thùng để in tỉ lệ lỗi (%) cạnh số lỗi
-- thực tế của từng thùng (giống biên bản kiểm tra thùng thành phẩm).
-- Kết luận ĐẠT / KHÔNG ĐẠT vẫn xét theo tổng số lỗi so với ngưỡng như cũ — cột này chỉ để
-- tính tỉ lệ hiển thị. Thùng đã kiểm trước đây để NULL (tỉ lệ hiện "—").
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-024
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/024-gscl-tong-nhanh-thung.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_giam_sat_chat_luong_ct
  ADD COLUMN tong_nhanh integer,
  ADD CONSTRAINT fp_farm_gscl_ct_tong_nhanh_check CHECK (tong_nhanh IS NULL OR tong_nhanh > 0);

COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong_ct.tong_nhanh IS
  'Tổng số nhánh/nải trong thùng — mẫu số tính tỉ lệ lỗi (%) từng thùng';

COMMIT;

NOTIFY pgrst, 'reload schema';
