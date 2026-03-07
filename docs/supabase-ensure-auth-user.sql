-- ============================================================
-- PostgreSQL Function: ensure_auth_user  (v2 — sửa lỗi GoTrue)
-- ============================================================
-- Mục đích: Tự động tạo tài khoản Supabase Auth khi admin
--           thêm/sửa nhân viên với email mới.
-- Mật khẩu mặc định: 123456
-- Gọi từ app qua: supabase.rpc('ensure_auth_user', { p_email: '...' })
-- ============================================================
-- HƯỚNG DẪN:
--   Bước 1: Nếu đã chạy bản cũ, XÓA user lỗi trong Authentication → Users
--   Bước 2: Copy toàn bộ SQL này → Supabase Dashboard → SQL Editor → Run
--   Bước 3: Quay lại app, thêm/sửa nhân viên → tài khoản Auth sẽ tự tạo
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Xóa function cũ (nếu có) để tạo lại
DROP FUNCTION IF EXISTS public.ensure_auth_user(TEXT);

CREATE OR REPLACE FUNCTION public.ensure_auth_user(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user_id     UUID;
  v_email       TEXT := LOWER(TRIM(p_email));
  v_password    TEXT := '123456';
  v_encrypted   TEXT;
BEGIN
  -- Chỉ cho phép user đã đăng nhập gọi
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Kiểm tra email rỗng
  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object('created', false);
  END IF;

  -- Kiểm tra user Auth đã tồn tại chưa
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    RETURN jsonb_build_object('created', false);
  END IF;

  -- Chuẩn bị
  v_user_id   := gen_random_uuid();
  v_encrypted := crypt(v_password, gen_salt('bf'));

  -- ============================================================
  -- Insert vào auth.users — tương thích GoTrue (Supabase 2024+)
  -- ============================================================
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at,
    is_anonymous
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',  -- instance_id
    'authenticated',                          -- aud
    'authenticated',                          -- role
    v_email,                                  -- email
    v_encrypted,                              -- encrypted_password
    NOW(),                                    -- email_confirmed_at
    NULL,                                     -- invited_at
    '',                                       -- confirmation_token
    NULL,                                     -- confirmation_sent_at
    '',                                       -- recovery_token
    NULL,                                     -- recovery_sent_at
    '',                                       -- email_change_token_new
    '',                                       -- email_change
    NULL,                                     -- email_change_sent_at
    NULL,                                     -- last_sign_in_at
    jsonb_build_object(
      'provider', 'email',
      'providers', ARRAY['email']
    ),                                        -- raw_app_meta_data
    '{}'::jsonb,                              -- raw_user_meta_data
    FALSE,                                    -- is_super_admin
    NOW(),                                    -- created_at
    NOW(),                                    -- updated_at
    NULL,                                     -- phone
    NULL,                                     -- phone_confirmed_at
    '',                                       -- phone_change
    '',                                       -- phone_change_token
    NULL,                                     -- phone_change_sent_at
    '',                                       -- email_change_token_current
    0,                                        -- email_change_confirm_status
    NULL,                                     -- banned_until
    '',                                       -- reauthentication_token
    NULL,                                     -- reauthentication_sent_at
    FALSE,                                    -- is_sso_user
    NULL,                                     -- deleted_at
    FALSE                                     -- is_anonymous
  );

  -- ============================================================
  -- Insert vào auth.identities — bắt buộc để GoTrue login được
  -- ============================================================
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    'email',
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    NOW(),
    NOW(),
    NOW()
  );

  RETURN jsonb_build_object('created', true);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('created', false);
END;
$$;

-- Quyền: chỉ user đã đăng nhập mới gọi được
GRANT EXECUTE ON FUNCTION public.ensure_auth_user(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_auth_user(TEXT) FROM anon;
