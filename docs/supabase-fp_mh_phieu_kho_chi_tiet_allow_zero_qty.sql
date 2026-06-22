-- Cho phép lưu dòng chi tiết phiếu kho với so_luong = 0 (ghi nhận mã hàng, không nhập kho).
-- Chạy trên Supabase sau khi đã có bảng fp_mh_phieu_kho_chi_tiet.

ALTER TABLE fp_mh_phieu_kho_chi_tiet
  DROP CONSTRAINT IF EXISTS fp_mh_phieu_kho_chi_tiet_so_luong_check;

ALTER TABLE fp_mh_phieu_kho_chi_tiet
  ADD CONSTRAINT fp_mh_phieu_kho_chi_tiet_so_luong_check
  CHECK (so_luong >= 0);
