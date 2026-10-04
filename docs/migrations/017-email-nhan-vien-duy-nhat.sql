-- =============================================================================
-- 017-email-nhan-vien-duy-nhat.sql — Mỗi email chỉ thuộc MỘT nhân viên
-- rpc_dang_nhap_google tra hồ sơ bằng `WHERE LOWER(email) = …` rồi SELECT INTO: nếu hai
-- nhân viên trùng email (khác hoa/thường) thì nó lấy một dòng bất kỳ → đăng nhập nhầm
-- hồ sơ. Index unique trên đúng biểu thức LOWER(email) chặn trùng từ gốc và cũng là
-- index cho câu tra đó. Bỏ qua dòng chưa có email để không chặn hồ sơ chưa khai email.
-- Lưu hồ sơ trùng email sẽ gặp lỗi 23505 (lib/db-errors.ts đã có thông báo tiếng Việt).
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-017
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/017-email-nhan-vien-duy-nhat.sql
-- Nếu báo "could not create unique index": dữ liệu đang có email trùng, tra bằng
--   SELECT lower(email), array_agg(id) FROM fp_var_nhan_vien GROUP BY 1 HAVING count(*) > 1;
-- =============================================================================

BEGIN;

CREATE UNIQUE INDEX uq_fp_var_nhan_vien_email_lower
  ON public.fp_var_nhan_vien (lower(email))
  WHERE email IS NOT NULL AND email <> '';

COMMIT;
