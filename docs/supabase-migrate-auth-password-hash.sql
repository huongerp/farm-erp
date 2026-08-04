-- =====================================================================
-- Migrate mật khẩu: auth.users.encrypted_password → fp_var_nhan_vien.mat_khau_hash
--
-- Mục đích: khi bỏ Supabase Auth để chuyển sang Postgres trên VPS, nhân viên
-- GIỮ NGUYÊN mật khẩu đang dùng. Làm được vì cả hai bên đều là bcrypt cost 10
-- (`$2a$10$...`): GoTrue hash bằng bcrypt, pgcrypto `gen_salt('bf', 10)` cũng vậy.
--
-- Mật khẩu dạng chữ (plaintext) KHÔNG thể lấy lại — bcrypt là hàm một chiều.
-- Ta copy nguyên hash, không cần biết mật khẩu là gì.
--
-- ⚠ THỜI ĐIỂM CHẠY: đúng lúc cut-over sang VPS, KHÔNG chạy sớm.
-- Chạy sớm thì hash sẽ lỗi thời vì user vẫn đổi mật khẩu trong lúc bạn dựng VPS.
--
-- YÊU CẦU: chạy docs/supabase-fp_var_nhan_vien_mat_khau.sql trước (tạo cột + RPC).
-- Chạy trên Supabase SQL Editor (role postgres — cần quyền đọc schema auth).
--
-- ⚠ KHÔNG chạy file này ngay sau khi thêm cột. Chỉ chạy lúc cut-over sang VPS.
-- =====================================================================

-- 0) Chặn nếu chưa chạy file tạo cột — tránh lỗi 42703 confusing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fp_var_nhan_vien'
      AND column_name = 'mat_khau_hash'
  ) THEN
    RAISE EXCEPTION
      'Chưa có cột fp_var_nhan_vien.mat_khau_hash. Chạy docs/supabase-fp_var_nhan_vien_mat_khau.sql trước. File migrate này chỉ chạy lúc cut-over sang VPS, không chạy ngay.';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- BƯỚC 1 — KIỂM TRA TRƯỚC KHI CHẠY (chỉ đọc, chạy riêng từng câu)
-- ---------------------------------------------------------------------

-- 1a) Thuật toán hash đang dùng: kỳ vọng 100% là '$2a$' (bcrypt).
--     Nếu thấy prefix khác ('$2b$', '$argon2', …) thì service auth trên VPS
--     phải dùng thư viện verify tương ứng.
SELECT
  left(encrypted_password, 4)                      AS hash_prefix,
  left(encrypted_password, 7)                      AS hash_prefix_cost,
  count(*)                                         AS so_dong
FROM auth.users
WHERE encrypted_password IS NOT NULL AND encrypted_password <> ''
GROUP BY 1, 2
ORDER BY so_dong DESC;

-- 1b) Tài khoản KHÔNG có mật khẩu (đăng nhập bằng Google) — nhóm này sẽ phải
--     nhận mật khẩu mặc định ở bước 3.
SELECT id, email, last_sign_in_at
FROM auth.users
WHERE encrypted_password IS NULL OR encrypted_password = ''
ORDER BY email;

-- 1c) Email lệch giữa hai bảng — nhóm này copy hash không khớp được.
--     Xử lý bằng docs/supabase-normalize-nhan-vien-email.sql rồi chạy lại.
SELECT nv.id, nv.email AS email_nhan_vien, nv.trang_thai
FROM public.fp_var_nhan_vien nv
WHERE nv.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE LOWER(u.email) = LOWER(nv.email)
  )
ORDER BY nv.email;

-- 1d) Nhân viên chưa có email → không thể đăng nhập, cần bổ sung email trước.
SELECT id, ho_va_ten, trang_thai
FROM public.fp_var_nhan_vien
WHERE email IS NULL OR btrim(email) = ''
ORDER BY ho_va_ten;

-- ---------------------------------------------------------------------
-- BƯỚC 2 — COPY HASH
-- ---------------------------------------------------------------------

-- Chỉ copy khi hash trong auth.users MỚI HƠN hash đang có ở cột mới.
-- Lý do: từ khi bật ghi song song, admin có thể đã đặt mật khẩu qua
-- rpc_set_mat_khau; không được để hash cũ của auth.users ghi đè lên nó.
UPDATE public.fp_var_nhan_vien nv
SET mat_khau_hash         = u.encrypted_password,
    mat_khau_cap_nhat_luc = now()
FROM auth.users u
WHERE LOWER(u.email) = LOWER(nv.email)
  AND u.encrypted_password LIKE '$2%'        -- chỉ nhận bcrypt hợp lệ
  AND (
    nv.mat_khau_hash IS NULL
    OR nv.mat_khau_cap_nhat_luc IS NULL
    OR u.updated_at > nv.mat_khau_cap_nhat_luc
  );

-- ---------------------------------------------------------------------
-- BƯỚC 3 — CẤP MẬT KHẨU MẶC ĐỊNH CHO PHẦN CÒN LẠI
-- ---------------------------------------------------------------------

-- Xem trước danh sách sẽ bị cấp mặc định (để thông báo cho nhân viên):
SELECT id, ho_va_ten, email, trang_thai
FROM public.fp_var_nhan_vien
WHERE mat_khau_hash IS NULL
ORDER BY ho_va_ten;

-- Cấp mật khẩu mặc định `123456` + bật cờ buộc đổi ở lần đăng nhập kế tiếp.
-- gen_salt() sinh salt riêng cho từng dòng nên mỗi người một hash khác nhau.
UPDATE public.fp_var_nhan_vien
SET mat_khau_hash         = extensions.crypt('123456', extensions.gen_salt('bf', 10)),
    phai_doi_mat_khau     = TRUE,
    mat_khau_cap_nhat_luc = now()
WHERE mat_khau_hash IS NULL;

-- ---------------------------------------------------------------------
-- BƯỚC 4 — KIỂM TRA SAU KHI CHẠY
-- ---------------------------------------------------------------------

-- 4a) Phải trả về 0 dòng: mọi nhân viên đều có hash.
SELECT count(*) AS con_thieu_hash
FROM public.fp_var_nhan_vien
WHERE mat_khau_hash IS NULL;

-- 4b) Toàn bộ hash phải là bcrypt.
SELECT left(mat_khau_hash, 7) AS prefix, count(*) AS so_dong
FROM public.fp_var_nhan_vien
GROUP BY 1
ORDER BY so_dong DESC;

-- 4c) Đối chiếu: hash ở cột mới phải TRÙNG hash trong auth.users với những
--     dòng vừa copy (chưa từng đặt lại qua RPC).
SELECT count(*) AS so_dong_khop
FROM public.fp_var_nhan_vien nv
JOIN auth.users u ON LOWER(u.email) = LOWER(nv.email)
WHERE nv.mat_khau_hash = u.encrypted_password;

-- 4d) Số người phải đổi mật khẩu khi đăng nhập lần đầu trên hệ thống mới.
SELECT count(*) AS phai_doi_mat_khau
FROM public.fp_var_nhan_vien
WHERE phai_doi_mat_khau;

-- ---------------------------------------------------------------------
-- BƯỚC 5 — SAU KHI CẮT SANG VPS
-- ---------------------------------------------------------------------
-- Trên Postgres của VPS không còn schema `auth`, nên:
--   - Xoá block "GHI SONG SONG sang Supabase Auth" trong rpc_set_mat_khau.
--   - Xoá function ensure_auth_user và file lib/ensure-auth-user.ts.
--   - GRANT EXECUTE ON FUNCTION public.rpc_verify_mat_khau(TEXT, TEXT)
--     cho role riêng của auth service (KHÔNG grant cho anon).
-- =====================================================================
