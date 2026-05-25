-- =============================================================================
-- ALTER fp_mh_danh_sach_doi_tac: thêm thông tin ngân hàng (phục vụ VietQR)
-- Chạy trong Supabase Dashboard → SQL Editor
-- Lưu mã BIN (Napas247) thay vì tên ngân hàng để build URL VietQR.io trực tiếp.
-- =============================================================================

ALTER TABLE fp_mh_danh_sach_doi_tac
  ADD COLUMN IF NOT EXISTS ngan_hang_bin text,
  ADD COLUMN IF NOT EXISTS so_tai_khoan  text,
  ADD COLUMN IF NOT EXISTS chu_tai_khoan text;

COMMENT ON COLUMN fp_mh_danh_sach_doi_tac.ngan_hang_bin IS
  'Mã BIN ngân hàng theo chuẩn VietQR/Napas247 (vd 970422 = MB, 970436 = VCB)';
COMMENT ON COLUMN fp_mh_danh_sach_doi_tac.so_tai_khoan  IS
  'Số tài khoản nhận tiền';
COMMENT ON COLUMN fp_mh_danh_sach_doi_tac.chu_tai_khoan IS
  'Tên chủ tài khoản (nên in hoa, không dấu khi xuất QR)';
