\set QUIET on
\pset footer off
BEGIN;

SELECT id AS nv_id, email AS nv_email
FROM public.fp_var_nhan_vien
WHERE trang_thai = 'Đang làm việc' AND email IS NOT NULL
ORDER BY id LIMIT 1
\gset

SELECT set_config('request.jwt.claims', json_build_object('email', :'nv_email', 'role', 'authenticated')::text, TRUE);
SELECT public.rpc_set_mat_khau(:nv_id, 'kiem-thu-123456', FALSE);

-- (1) Đăng nhập đúng
SELECT public.rpc_dang_nhap(:'nv_email', 'kiem-thu-123456', 'psql', '127.0.0.1') AS r \gset
SELECT '1. dang nhap dung' AS buoc,
       (:'r'::jsonb ->> 'ok') AS ok,
       (length(:'r'::jsonb ->> 'refresh_token') = 64) AS refresh_dai_64,
       (:'r'::jsonb ->> 'phai_doi_mat_khau') AS phai_doi;

SELECT encode(extensions.digest(:'r'::jsonb ->> 'refresh_token', 'sha256'), 'hex') AS h1 \gset

-- (2) Rotation
SELECT public.rpc_lam_moi_phien(:'h1', 'psql', '127.0.0.1') AS r2 \gset
SELECT '2. lam moi phien' AS buoc,
       (:'r2'::jsonb ->> 'ok') AS ok,
       ((:'r2'::jsonb ->> 'refresh_token') <> (:'r'::jsonb ->> 'refresh_token')) AS token_da_doi;

-- (3) Dùng lại token cũ sau khi rotate
SELECT '3. dung lai token cu' AS buoc,
       (public.rpc_lam_moi_phien(:'h1') ->> 'ok') AS ok_phai_false,
       (public.rpc_lam_moi_phien(:'h1') ->> 'ly_do') AS ly_do;

-- (4) Đăng xuất rồi refresh
SELECT encode(extensions.digest(:'r2'::jsonb ->> 'refresh_token', 'sha256'), 'hex') AS h2 \gset
SELECT public.rpc_thu_hoi_phien(:'h2');
SELECT '4. refresh sau dang xuat' AS buoc,
       (public.rpc_lam_moi_phien(:'h2') ->> 'ok') AS ok_phai_false;

-- (5) Sai mật khẩu 10 lần rồi đăng nhập đúng
SELECT count(*) FILTER (WHERE (public.rpc_dang_nhap(:'nv_email', 'sai-be-bet') ->> 'ly_do') = 'sai_thong_tin') AS lan_sai
FROM generate_series(1, 10);
SELECT '5. bi chan sau 10 lan sai' AS buoc,
       (public.rpc_dang_nhap(:'nv_email', 'kiem-thu-123456') ->> 'ly_do') AS ly_do_phai_bi_chan;

-- (6) Nghỉ việc thì phiên bị thu hồi
DELETE FROM public.fp_var_lan_dang_nhap_sai WHERE email = LOWER(:'nv_email');
SELECT public.rpc_dang_nhap(:'nv_email', 'kiem-thu-123456', 'psql', '127.0.0.1') AS r3 \gset
UPDATE public.fp_var_nhan_vien SET trang_thai = 'Nghỉ việc' WHERE id = :nv_id;
SELECT '6. nghi viec thu hoi phien' AS buoc,
       (count(*) = 0) AS khong_con_phien_song
FROM public.fp_var_phien_dang_nhap
WHERE nhan_vien_id = :nv_id AND thu_hoi_luc IS NULL;

-- (7) Nghỉ việc thì không đăng nhập được
SELECT '7. nghi viec khong dang nhap duoc' AS buoc,
       (public.rpc_dang_nhap(:'nv_email', 'kiem-thu-123456') ->> 'ly_do') AS ly_do_phai_nghi_viec;

-- (8) Email không tồn tại trả cùng lý do với sai mật khẩu (không tiết lộ email)
SELECT '8. email khong ton tai' AS buoc,
       (public.rpc_dang_nhap('khong-ton-tai-abc@example.com', 'gi-cung-duoc') ->> 'ly_do') AS ly_do_phai_sai_thong_tin;

-- (9) Google: email có hồ sơ (đang là Nghỉ việc do bước 6) và email lạ
SELECT '9. google email la' AS buoc,
       (public.rpc_dang_nhap_google('khong-ton-tai-abc@example.com') ->> 'ly_do') AS ly_do_phai_khong_co_ho_so;

ROLLBACK;

-- Sau ROLLBACK: không được để lại dữ liệu nào.
SELECT 'con phien nao sot lai (phai 0)' AS buoc, count(*)::text AS gia_tri
FROM public.fp_var_phien_dang_nhap
UNION ALL
SELECT 'con lan dang nhap sai nao (phai 0)', count(*)::text
FROM public.fp_var_lan_dang_nhap_sai;
