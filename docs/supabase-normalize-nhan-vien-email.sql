-- =====================================================================
-- Migration: Chuẩn hoá cột `email` về lowercase + tạo index
-- Mục đích: Cho phép `.eq('email', lower(x))` dùng B-tree index
-- (trước đây code gọi `.ilike('email', ...)` không dùng được index).
-- =====================================================================

-- 1) Normalize dữ liệu hiện có về lowercase (an toàn, idempotent).
UPDATE public.fp_var_nhan_vien
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL
  AND email <> LOWER(TRIM(email));

-- 2) (Khuyến nghị) Ràng buộc duy nhất để tránh 2 nhân viên cùng email.
--    Nếu dữ liệu cũ đang có duplicate, phải merge trước khi bật constraint này.
-- ALTER TABLE public.fp_var_nhan_vien
--   ADD CONSTRAINT fp_var_nhan_vien_email_unique UNIQUE (email);

-- 3) Index phục vụ `.eq('email', x)` — nhanh hơn `.ilike` nhiều lần.
CREATE INDEX IF NOT EXISTS idx_nhan_vien_email
  ON public.fp_var_nhan_vien (email);

-- 4) (Phòng xa) Nếu vẫn muốn chấp nhận email ghi hoa/thường lẫn lộn (không migrate),
--    có thể tạo thêm index biểu thức:
-- CREATE INDEX IF NOT EXISTS idx_nhan_vien_email_lower
--   ON public.fp_var_nhan_vien ((LOWER(email)));
