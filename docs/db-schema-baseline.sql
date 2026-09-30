-- =============================================================================
-- db-schema-baseline.sql — ảnh chụp schema của database `fpfarm` trên VPS
-- Chụp ngày: 2026-09-30 (pg_dump 18, --schema-only --no-owner -n public -n auth -n extensions)
--
-- Nguồn tham chiếu DUY NHẤT trong repo cho: role của app, extension, schema `auth`
-- (auth.jwt/role/uid đọc claim PostgREST), bảng, view, hàm/RPC, trigger (kể cả trigger
-- thông báo ghi outbox), RLS policy và GRANT. Thay cho docs/supabase-*.sql và docs/vps-*.sql cũ.
--
-- Không gồm: dữ liệu (seed quyền module, catalog sự kiện thông báo…), mật khẩu role.
--
-- Migration MỚI: thêm docs/migrations/NNN-<mo-ta>.sql (đánh số tiếp), không sửa file này.
-- Chụp lại khi cần:
--   pg_dump "$VPS_DB_URL" --schema-only --no-owner -n public -n auth -n extensions
--   (rồi ghép lại phần ROLE + EXTENSION ở đầu file này).
--
-- Đã gồm kết quả docs/migrations/001-don-role-supabase.sql (không còn role Supabase).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Role của app (cấp cluster). Đặt mật khẩu cho 4 role LOGIN bằng ALTER ROLE … PASSWORD.
--   anon           : PostgREST dùng khi request không có JWT
--   authenticated  : claim `role` trong JWT do auth-service ký
--   authenticator  : PostgREST đăng nhập bằng role này rồi SET ROLE anon/authenticated
--   auth_service   : services/auth — chỉ EXECUTE mấy RPC đăng nhập
--   notify_service : services/notify — chỉ chạm bảng thông báo + vài RPC tra cứu
-- ---------------------------------------------------------------------------
CREATE ROLE anon;
ALTER ROLE anon WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE auth_service;
ALTER ROLE auth_service WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticated;
ALTER ROLE authenticated WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE authenticator;
ALTER ROLE authenticator WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE notify_service;
ALTER ROLE notify_service WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS;
GRANT anon TO authenticator WITH INHERIT FALSE;
GRANT authenticated TO authenticator WITH INHERIT FALSE;

-- ---------------------------------------------------------------------------
-- Extension (pgcrypto: bcrypt mật khẩu, gen_random_bytes; pg_trgm: index tìm kiếm)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- ---------------------------------------------------------------------------
-- pg_dump
-- ---------------------------------------------------------------------------
--
-- PostgreSQL database dump
--

\restrict BZDLnDNO6k6qUo4brAUEfS1ZucAji4wI0dSnyf5jc3d6co0qiQ7d5R8r0fJ1lW5

-- Dumped from database version 18.6 (Debian 18.6-1.pgdg13+2)
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS extensions;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), ''),
    '{}'
  )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  SELECT coalesce(nullif(auth.jwt() ->> 'role', ''), 'anon')
$$;


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  SELECT nullif(auth.jwt() ->> 'sub', '')::uuid
$$;


--
-- Name: _nxt_norm_loai(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public._nxt_norm_loai(p_loai text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT CASE lower(trim(coalesce(p_loai, '')))
    WHEN 'nhập' THEN 'nhap'
    WHEN 'nhap' THEN 'nhap'
    WHEN 'xuất' THEN 'xuat'
    WHEN 'xuat' THEN 'xuat'
    WHEN 'chuyển' THEN 'chuyen'
    WHEN 'chuyen' THEN 'chuyen'
    ELSE NULL
  END;
$$;


--
-- Name: co_quyen_quan_tri_mat_khau(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.co_quyen_quan_tri_mat_khau() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fp_var_nhan_vien nv
    LEFT JOIN public.fp_var_chuc_vu cv ON cv.id = nv.chuc_vu_id
    WHERE nv.id = public.nhan_vien_hien_tai_id()
      AND (
        nv.cap_bac = 1
        OR cv.tt = 1
        OR EXISTS (
          SELECT 1
          FROM public.fp_var_phan_quyen pq
          WHERE pq.chuc_vu_id = nv.chuc_vu_id
            AND pq.module_id = 'he-thong/nhan-vien'
            AND pq.actions && ARRAY['admin', 'all']::TEXT[]
        )
      )
  );
$$;


--
-- Name: FUNCTION co_quyen_quan_tri_mat_khau(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.co_quyen_quan_tri_mat_khau() IS 'TRUE nếu người đang đăng nhập được đặt mật khẩu cho người khác: cap_bac = 1, hoặc admin/all trên module he-thong/nhan-vien, hoặc chuc_vu.tt = 1.';


--
-- Name: dang_bi_chan_dang_nhap(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dang_bi_chan_dang_nhap(p_email text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT count(*) >= 10
  FROM public.fp_var_lan_dang_nhap_sai
  WHERE email = LOWER(TRIM(coalesce(p_email, '')))
    AND luc > now() - interval '15 minutes';
$$;


--
-- Name: farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(bigint, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id_kho bigint;
  v_id_hh bigint;
  v_so_so numeric;
  v_so_tt numeric;
  v_id_phieu_old bigint;
  v_dot_tt text;
  v_ma_dot text;
  v_ngay date;
  v_delta numeric;
  v_loai text;
  v_so_phieu text;
  v_id_phieu bigint;
  v_ten_kho text;
  v_ten_hh text;
  v_dvt text;
  v_pham_cap text;
  v_ten_nv text;
BEGIN
  SELECT
    ct.id_kho,
    ct.id_hang_hoa,
    ct.so_luong_so,
    ct.so_luong_thuc_te,
    ct.id_phieu_kho_dieu_chinh,
    d.trang_thai,
    d.ma_dot,
    d.ngay_ket_thuc::date
  INTO
    v_id_kho,
    v_id_hh,
    v_so_so,
    v_so_tt,
    v_id_phieu_old,
    v_dot_tt,
    v_ma_dot,
    v_ngay
  FROM public.fp_farm_dot_kiem_ke_pt_chi_tiet ct
  JOIN public.fp_farm_dot_kiem_ke_pt d ON d.id = ct.id_dot_kiem_ke_pt
  WHERE ct.id = p_id_chi_tiet
  FOR UPDATE OF ct;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'kiem_ke_chi_tiet_not_found';
  END IF;

  IF v_dot_tt IS DISTINCT FROM 'dang_kiem_ke' THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_dang_kiem_ke';
  END IF;

  IF v_id_phieu_old IS NOT NULL THEN
    RAISE EXCEPTION 'kiem_ke_already_adjusted';
  END IF;

  IF v_so_tt IS NULL THEN
    RAISE EXCEPTION 'kiem_ke_no_thuc_te';
  END IF;

  v_delta := v_so_tt - v_so_so;
  -- Chi tiết phiếu kho farm có CHECK (so_luong > 0) nên delta = 0 phải chặn ở đây.
  IF v_delta = 0 THEN
    RAISE EXCEPTION 'kiem_ke_no_variance';
  END IF;

  IF v_delta > 0 THEN
    v_loai := 'nhập';
  ELSE
    v_loai := 'xuất';
  END IF;

  SELECT k.ten_kho INTO v_ten_kho FROM public.fp_mh_danh_sach_kho k WHERE k.id = v_id_kho;
  SELECT h.ten_hang_hoa, h.dvt, h.pham_cap
    INTO v_ten_hh, v_dvt, v_pham_cap
    FROM public.fp_farm_danh_sach_hang_hoa h WHERE h.id = v_id_hh;

  IF p_nguoi_tao_id IS NOT NULL THEN
    SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = p_nguoi_tao_id;
  END IF;

  v_so_phieu := get_next_so_phieu_farm_pt(v_loai);

  INSERT INTO public.fp_farm_phieu_kho_phan_thuoc (
    so_phieu,
    ngay,
    loai,
    kho_id,
    ten_kho,
    kho_den_id,
    ten_kho_den,
    trang_thai,
    mo_ta,
    nguoi_tao_id,
    ten_nguoi_tao
  ) VALUES (
    v_so_phieu,
    COALESCE(v_ngay, CURRENT_DATE),
    v_loai,
    v_id_kho,
    v_ten_kho,
    NULL,
    NULL,
    'Đã duyệt',
    format('Điều chỉnh tồn kiểm kê — Đợt %s', v_ma_dot),
    p_nguoi_tao_id,
    v_ten_nv
  )
  RETURNING id INTO v_id_phieu;

  INSERT INTO public.fp_farm_phieu_kho_phan_thuoc_chi_tiet (
    id_phieu_kho,
    id_hang_hoa,
    ten_hang_hoa,
    don_vi_tinh,
    pham_cap,
    so_luong,
    don_gia,
    ghi_chu,
    nguoi_tao_id,
    ten_nguoi_tao
  ) VALUES (
    v_id_phieu,
    v_id_hh,
    v_ten_hh,
    v_dvt,
    v_pham_cap,
    abs(v_delta),
    0,
    format('Điều chỉnh tồn kiểm kê — dòng chi tiết #%s', p_id_chi_tiet),
    p_nguoi_tao_id,
    v_ten_nv
  );

  UPDATE public.fp_farm_dot_kiem_ke_pt_chi_tiet
  SET
    id_phieu_kho_dieu_chinh = v_id_phieu,
    so_luong_dieu_chinh = abs(v_delta),
    tg_dieu_chinh_ton = now()
  WHERE id = p_id_chi_tiet;

  RETURN v_id_phieu;
END;
$$;


--
-- Name: FUNCTION farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint) IS 'Kiểm kê phân thuốc, một dòng lệch: thừa (TT>sổ) → nhập, thiếu (TT<sổ) → xuất; cập nhật id_phieu_kho_dieu_chinh';


--
-- Name: farm_kiem_ke_pt_apply_dieu_chinh_dot(bigint, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dot_tt text;
  v_ma_dot text;
  v_ngay date;
  v_ten_nv text;
  v_updated int := 0;
  rec_grp RECORD;
  v_so_phieu text;
  v_id_phieu bigint;
  v_ten_kho text;
  v_ten_hh text;
  v_dvt text;
  v_pham_cap text;
  line_rec RECORD;
BEGIN
  SELECT d.trang_thai, d.ma_dot, d.ngay_ket_thuc::date
  INTO v_dot_tt, v_ma_dot, v_ngay
  FROM public.fp_farm_dot_kiem_ke_pt d
  WHERE d.id = p_id_dot
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_found';
  END IF;

  IF v_dot_tt IS DISTINCT FROM 'dang_kiem_ke' THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_dang_kiem_ke';
  END IF;

  IF p_nguoi_tao_id IS NOT NULL THEN
    SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = p_nguoi_tao_id;
  END IF;

  -- Khoá trước mọi dòng sắp điều chỉnh, tránh hai người bấm cùng lúc sinh hai phiếu.
  PERFORM 1
  FROM public.fp_farm_dot_kiem_ke_pt_chi_tiet ct
  WHERE ct.id_dot_kiem_ke_pt = p_id_dot
    AND ct.id_phieu_kho_dieu_chinh IS NULL
    AND ct.so_luong_thuc_te IS NOT NULL
    AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  FOR UPDATE OF ct;

  FOR rec_grp IN
    SELECT DISTINCT
      ct.id_kho,
      CASE WHEN (ct.so_luong_thuc_te - ct.so_luong_so) > 0 THEN 'nhập'::text ELSE 'xuất'::text END AS loai
    FROM public.fp_farm_dot_kiem_ke_pt_chi_tiet ct
    WHERE ct.id_dot_kiem_ke_pt = p_id_dot
      AND ct.id_phieu_kho_dieu_chinh IS NULL
      AND ct.so_luong_thuc_te IS NOT NULL
      AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  LOOP
    SELECT k.ten_kho INTO v_ten_kho FROM public.fp_mh_danh_sach_kho k WHERE k.id = rec_grp.id_kho;

    v_so_phieu := get_next_so_phieu_farm_pt(rec_grp.loai);

    INSERT INTO public.fp_farm_phieu_kho_phan_thuoc (
      so_phieu,
      ngay,
      loai,
      kho_id,
      ten_kho,
      kho_den_id,
      ten_kho_den,
      trang_thai,
      mo_ta,
      nguoi_tao_id,
      ten_nguoi_tao
    ) VALUES (
      v_so_phieu,
      COALESCE(v_ngay, CURRENT_DATE),
      rec_grp.loai,
      rec_grp.id_kho,
      v_ten_kho,
      NULL,
      NULL,
      'Đã duyệt',
      format('Điều chỉnh tồn kiểm kê — Đợt %s (toàn đợt)', v_ma_dot),
      p_nguoi_tao_id,
      v_ten_nv
    )
    RETURNING id INTO v_id_phieu;

    FOR line_rec IN
      SELECT ct.id, ct.id_hang_hoa, abs(ct.so_luong_thuc_te - ct.so_luong_so) AS sl_dc
      FROM public.fp_farm_dot_kiem_ke_pt_chi_tiet ct
      WHERE ct.id_dot_kiem_ke_pt = p_id_dot
        AND ct.id_kho = rec_grp.id_kho
        AND ct.id_phieu_kho_dieu_chinh IS NULL
        AND ct.so_luong_thuc_te IS NOT NULL
        AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
        AND (
          (rec_grp.loai = 'nhập' AND (ct.so_luong_thuc_te - ct.so_luong_so) > 0)
          OR (rec_grp.loai = 'xuất' AND (ct.so_luong_thuc_te - ct.so_luong_so) < 0)
        )
      ORDER BY ct.id
    LOOP
      SELECT h.ten_hang_hoa, h.dvt, h.pham_cap
        INTO v_ten_hh, v_dvt, v_pham_cap
        FROM public.fp_farm_danh_sach_hang_hoa h WHERE h.id = line_rec.id_hang_hoa;

      INSERT INTO public.fp_farm_phieu_kho_phan_thuoc_chi_tiet (
        id_phieu_kho,
        id_hang_hoa,
        ten_hang_hoa,
        don_vi_tinh,
        pham_cap,
        so_luong,
        don_gia,
        ghi_chu,
        nguoi_tao_id,
        ten_nguoi_tao
      ) VALUES (
        v_id_phieu,
        line_rec.id_hang_hoa,
        v_ten_hh,
        v_dvt,
        v_pham_cap,
        line_rec.sl_dc,
        0,
        format('Điều chỉnh tồn kiểm kê — dòng chi tiết #%s', line_rec.id),
        p_nguoi_tao_id,
        v_ten_nv
      );

      UPDATE public.fp_farm_dot_kiem_ke_pt_chi_tiet
      SET
        id_phieu_kho_dieu_chinh = v_id_phieu,
        so_luong_dieu_chinh = line_rec.sl_dc,
        tg_dieu_chinh_ton = now()
      WHERE id = line_rec.id;

      v_updated := v_updated + 1;
    END LOOP;
  END LOOP;

  RETURN v_updated;
END;
$$;


--
-- Name: FUNCTION farm_kiem_ke_pt_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint) IS 'Kiểm kê phân thuốc, toàn đợt: gộp theo kho + loại — thừa nhập, thiếu xuất; trả về số dòng đã cập nhật';


--
-- Name: fn_ghi_su_kien_thong_bao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_ghi_su_kien_thong_bao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_module_id      text := TG_ARGV[0];
  v_cot_trang_thai text := NULLIF(TG_ARGV[1], '');
  v_new            jsonb := to_jsonb(NEW);
  v_old            jsonb := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END;
  v_tt_cu          text;
  v_tt_moi         text;
  v_id             bigint;
BEGIN
  IF v_cot_trang_thai IS NOT NULL THEN
    v_tt_moi := v_new ->> v_cot_trang_thai;
    v_tt_cu  := v_old ->> v_cot_trang_thai;
  END IF;

  -- UPDATE không đổi gì thật sự thì bỏ qua. So cả dòng (đã lọc cột nặng) thay vì
  -- chỉ so trạng thái, vì worker còn cần bắt ca "phiếu đã duyệt bị sửa nội dung"
  -- và "có trao đổi mới" — hai ca không đổi trạng thái.
  IF TG_OP = 'UPDATE'
     AND public.fn_loc_cot_nang(v_new) IS NOT DISTINCT FROM public.fn_loc_cot_nang(v_old) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.fp_var_su_kien_thong_bao (
    module_id, bang, ban_ghi_id, thao_tac,
    trang_thai_cu, trang_thai_moi, actor_id, payload, payload_cu
  )
  VALUES (
    v_module_id,
    TG_TABLE_NAME,
    (v_new ->> 'id')::bigint,
    TG_OP,
    v_tt_cu,
    v_tt_moi,
    public.nhan_vien_hien_tai_id(),
    public.fn_loc_cot_nang(v_new),
    public.fn_loc_cot_nang(v_old)
  )
  RETURNING id INTO v_id;

  -- Đánh thức worker. pg_notify chỉ gửi khi transaction COMMIT, nên không có ca
  -- worker đọc phải sự kiện của transaction bị rollback.
  PERFORM pg_notify('thong_bao_moi', v_id::text);

  RETURN NEW;
END;
$$;


--
-- Name: FUNCTION fn_ghi_su_kien_thong_bao(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_ghi_su_kien_thong_bao() IS 'Trigger chung ghi sự kiện vào outbox thông báo. TG_ARGV[0]=module_id, TG_ARGV[1]=tên cột trạng thái (rỗng nếu không có).';


--
-- Name: fn_loc_cot_nang(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_loc_cot_nang(p jsonb) RETURNS jsonb
    LANGUAGE sql IMMUTABLE
    AS $$
  SELECT p - ARRAY[
    'hinh_anh', 'hinh_anh_urls', 'anh', 'anh_urls', 'file_dinh_kem',
    'mat_khau_hash', 'chu_ky', 'chu_ky_url', 'logo', 'avatar_base64'
  ];
$$;


--
-- Name: FUNCTION fn_loc_cot_nang(p jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_loc_cot_nang(p jsonb) IS 'Loại các cột ảnh/đính kèm/nhạy cảm khỏi ảnh chụp dòng trước khi ghi vào outbox thông báo.';


--
-- Name: fp_farm_de_xuat_mua_hang_after_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_de_xuat_mua_hang_after_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE fp_farm_de_xuat_mua_hang_chi_tiet
     SET so_phieu = NEW.so_phieu,
         ngay = NEW.ngay,
         ngay_can = NEW.ngay_can,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_de_xuat_mua_hang = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: fp_farm_de_xuat_mua_hang_ct_sync_phieu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_de_xuat_mua_hang_ct_sync_phieu() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  p record;
BEGIN
  SELECT so_phieu, ngay, ngay_can, trang_thai
    INTO p
    FROM fp_farm_de_xuat_mua_hang
   WHERE id = NEW.id_de_xuat_mua_hang;
  IF FOUND THEN
    NEW.so_phieu := p.so_phieu;
    NEW.ngay := p.ngay;
    NEW.ngay_can := p.ngay_can;
    NEW.trang_thai_phieu := p.trang_thai;
    -- ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet do app điền (cần join kho/nhân viên)
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_farm_de_xuat_mua_hang_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_de_xuat_mua_hang_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_farm_dot_kiem_ke_pt_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_dot_kiem_ke_pt_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.fp_farm_dot_kiem_ke_pt_chi_tiet
  SET
    id_phieu_kho_dieu_chinh = NULL,
    so_luong_dieu_chinh = NULL,
    tg_dieu_chinh_ton = NULL
  WHERE id_phieu_kho_dieu_chinh = OLD.id;
  RETURN OLD;
END;
$$;


--
-- Name: fp_farm_phieu_kho_pt_ct_thanh_tien(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_phieu_kho_pt_ct_thanh_tien() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.thanh_tien = COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
  RETURN NEW;
END;
$$;


--
-- Name: fp_farm_phieu_kho_pt_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_phieu_kho_pt_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_farm_tien_do_mua_hang_set_timestamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_farm_tien_do_mua_hang_set_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.tg_tao      := COALESCE(NEW.tg_tao, now());
    NEW.tg_cap_nhat := now();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.tg_cap_nhat := now();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_hc_cong_viec_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_hc_cong_viec_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_hc_noi_quan_ly_sync_ten_chi_nhanh(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_hc_noi_quan_ly_sync_ten_chi_nhanh() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  SELECT ten_chi_nhanh INTO NEW.ten_chi_nhanh
  FROM public.fp_var_chi_nhanh
  WHERE id = NEW.id_chi_nhanh;
  RETURN NEW;
END;
$$;


--
-- Name: fp_hc_noi_quan_ly_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_hc_noi_quan_ly_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_hr_diem_cong_tru_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_hr_diem_cong_tru_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_don_dat_hang_after_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_don_dat_hang_after_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE fp_mh_don_dat_hang_chi_tiet
     SET so_po = NEW.so_po,
         ngay_dat = NEW.ngay_dat,
         ngay_giao_dk = NEW.ngay_giao_dk,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_don_dat_hang = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_don_dat_hang_chi_tiet_sync_phieu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_don_dat_hang_chi_tiet_sync_phieu() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  p record;
BEGIN
  SELECT so_po, ngay_dat, ngay_giao_dk, trang_thai
    INTO p
    FROM fp_mh_don_dat_hang
   WHERE id = NEW.id_don_dat_hang;
  IF FOUND THEN
    NEW.so_po := p.so_po;
    NEW.ngay_dat := p.ngay_dat;
    NEW.ngay_giao_dk := p.ngay_giao_dk;
    NEW.trang_thai_phieu := p.trang_thai;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_don_dat_hang_chi_tiet_thanh_tien(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_don_dat_hang_chi_tiet_thanh_tien() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.thanh_tien = COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_don_dat_hang_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_don_dat_hang_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_dot_kiem_ke_kho_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_dot_kiem_ke_kho_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_hop_dong_ct_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_hop_dong_ct_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_hop_dong_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_hop_dong_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_after_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_after_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE fp_mh_phieu_de_xuat_vat_tu_chi_tiet
     SET so_phieu = NEW.so_phieu,
         ngay = NEW.ngay,
         ngay_can = NEW.ngay_can,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_phieu_de_xuat_vat_tu = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  p record;
BEGIN
  SELECT so_phieu, ngay, ngay_can, trang_thai
    INTO p
    FROM fp_mh_phieu_de_xuat_vat_tu
   WHERE id = NEW.id_phieu_de_xuat_vat_tu;
  IF FOUND THEN
    NEW.so_phieu := p.so_phieu;
    NEW.ngay := p.ngay;
    NEW.ngay_can := p.ngay_can;
    NEW.trang_thai_phieu := p.trang_thai;
    -- ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet cần join sang bảng kho/nhân viên; để app điền hoặc trigger khác
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE public.fp_mh_dot_kiem_ke_kho_chi_tiet
  SET
    id_phieu_kho_dieu_chinh = NULL,
    so_luong_dieu_chinh = NULL,
    tg_dieu_chinh_ton = NULL
  WHERE id_phieu_kho_dieu_chinh = OLD.id;
  RETURN OLD;
END;
$$;


--
-- Name: FUNCTION fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh() IS 'Trước khi xóa phiếu kho: gỡ liên kết điều chỉnh tồn kiểm kê (3 cột) khỏi chi tiết đợt kiểm kê.';


--
-- Name: fp_mh_phieu_kho_chi_tiet_thanh_tien(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_kho_chi_tiet_thanh_tien() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.thanh_tien = COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_kho_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_kho_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_kiem_ke_after_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_kiem_ke_after_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE fp_mh_phieu_kiem_ke_chi_tiet
     SET so_phieu = NEW.so_phieu,
         ngay = NEW.ngay,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_phieu_kiem_ke = NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.so_luong_thuc_te IS NOT NULL THEN
    NEW.chenh_lech = NEW.so_luong_thuc_te - COALESCE(NEW.so_luong_so, 0);
  ELSE
    NEW.chenh_lech = NULL;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  p record;
BEGIN
  SELECT so_phieu, ngay, trang_thai
    INTO p
    FROM fp_mh_phieu_kiem_ke
   WHERE id = NEW.id_phieu_kiem_ke;
  IF FOUND THEN
    NEW.so_phieu := p.so_phieu;
    NEW.ngay := p.ngay;
    NEW.trang_thai_phieu := p.trang_thai;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_phieu_kiem_ke_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_phieu_kiem_ke_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_thanh_toan_doi_tac_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_thanh_toan_doi_tac_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_tien_do_mua_hang_set_timestamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_tien_do_mua_hang_set_timestamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.tg_tao      := COALESCE(NEW.tg_tao, now());
    NEW.tg_cap_nhat := now();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.tg_cap_nhat := now();
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_tc_hang_muc_thu_chi_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_tc_hang_muc_thu_chi_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_tc_quy_thu_chi_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_tc_quy_thu_chi_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_chi_phi_tai_san_sync_ten_trang_thai(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_chi_phi_tai_san_sync_ten_trang_thai() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  SELECT ten INTO NEW.ten_trang_thai
  FROM public.fp_ts_trang_thai_chi_phi_tai_san
  WHERE id = NEW.id_trang_thai;
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_chi_phi_tai_san_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_chi_phi_tai_san_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_chi_tiet_khau_hao_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_chi_tiet_khau_hao_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_ky_khau_hao_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_ky_khau_hao_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_loai_chi_phi_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_loai_chi_phi_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_nhom_tai_san_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_nhom_tai_san_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_phieu_cap_phat_thu_hoi_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_phieu_cpth_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_phieu_cpth_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_tai_san_sync_chi_phi_ma_ten(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_tai_san_sync_chi_phi_ma_ten() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    OLD.ma_tai_san IS DISTINCT FROM NEW.ma_tai_san
    OR OLD.ten_tai_san IS DISTINCT FROM NEW.ten_tai_san
  ) THEN
    UPDATE public.fp_ts_chi_phi_tai_san
    SET
      ma_tai_san = NEW.ma_tai_san,
      ten_tai_san = NEW.ten_tai_san
    WHERE id_tai_san = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_tai_san_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_tai_san_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_ts_trang_thai_tai_san_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_ts_trang_thai_tai_san_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_var_cap_bac_sync_nhan_vien_ten(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.ten_cap_bac IS DISTINCT FROM NEW.ten_cap_bac
     OR OLD.cap_bac IS DISTINCT FROM NEW.cap_bac THEN
    UPDATE public.fp_var_nhan_vien
    SET ten_cap_bac = NEW.ten_cap_bac,
        cap_bac = NEW.cap_bac
    WHERE cap_bac_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_var_chi_nhanh_sync_nhan_vien_ten(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_chi_nhanh_sync_nhan_vien_ten() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.ten_chi_nhanh IS DISTINCT FROM NEW.ten_chi_nhanh THEN
    UPDATE public.fp_var_nhan_vien n
    SET ten_chi_nhanh = (
      SELECT string_agg(c.ten_chi_nhanh, ', ' ORDER BY ord)
      FROM unnest(COALESCE(n.chi_nhanh_ids, ARRAY[]::text[])) WITH ORDINALITY AS arr(cn_id, ord)
      JOIN public.fp_var_chi_nhanh c ON c.id::text = arr.cn_id
    )
    WHERE n.chi_nhanh_ids IS NOT NULL
      AND NEW.id::text = ANY(n.chi_nhanh_ids);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_var_chuc_vu_sync_nhan_vien_ten(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_chuc_vu_sync_nhan_vien_ten() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.ten_chuc_vu IS DISTINCT FROM NEW.ten_chuc_vu THEN
    UPDATE public.fp_var_nhan_vien
    SET ten_chuc_vu = NEW.ten_chuc_vu
    WHERE chuc_vu_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_var_nhan_vien_sync_display_names(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_nhan_vien_sync_display_names() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- ten_phong_ban từ fp_var_phong_ban
  IF NEW.phong_ban_id IS NOT NULL THEN
    SELECT ten_phong_ban INTO NEW.ten_phong_ban
    FROM public.fp_var_phong_ban
    WHERE id = NEW.phong_ban_id;
  ELSE
    NEW.ten_phong_ban := NULL;
  END IF;

  -- ten_chuc_vu từ fp_var_chuc_vu
  IF NEW.chuc_vu_id IS NOT NULL THEN
    SELECT ten_chuc_vu INTO NEW.ten_chuc_vu
    FROM public.fp_var_chuc_vu
    WHERE id = NEW.chuc_vu_id;
  ELSE
    NEW.ten_chuc_vu := NULL;
  END IF;

  -- ten_cap_bac + cap_bac (SỐ cấp bậc) từ fp_var_cap_bac
  IF NEW.cap_bac_id IS NOT NULL THEN
    SELECT ten_cap_bac, cap_bac INTO NEW.ten_cap_bac, NEW.cap_bac
    FROM public.fp_var_cap_bac
    WHERE id = NEW.cap_bac_id;
  ELSE
    NEW.ten_cap_bac := NULL;
    NEW.cap_bac := NULL;
  END IF;

  -- ten_chi_nhanh: gộp tên theo thứ tự chi_nhanh_ids (mảng text)
  IF NEW.chi_nhanh_ids IS NOT NULL AND array_length(NEW.chi_nhanh_ids, 1) > 0 THEN
    SELECT string_agg(c.ten_chi_nhanh, ', ' ORDER BY ord)
    INTO NEW.ten_chi_nhanh
    FROM unnest(NEW.chi_nhanh_ids) WITH ORDINALITY AS arr(cn_id, ord)
    JOIN public.fp_var_chi_nhanh c ON c.id::text = arr.cn_id;
  ELSE
    NEW.ten_chi_nhanh := NULL;
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: fp_var_phan_quyen_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_phan_quyen_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_var_phong_ban_sync_nhan_vien_ten(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_phong_ban_sync_nhan_vien_ten() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF OLD.ten_phong_ban IS DISTINCT FROM NEW.ten_phong_ban THEN
    UPDATE public.fp_var_nhan_vien
    SET ten_phong_ban = NEW.ten_phong_ban
    WHERE phong_ban_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: fp_var_thong_bao_cai_dat_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_thong_bao_cai_dat_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: fp_var_thong_bao_tg_cap_nhat(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fp_var_thong_bao_tg_cap_nhat() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;


--
-- Name: get_next_ma_dot_dot_kiem_ke_kho(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_ma_dot_dot_kiem_ke_kho() RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN nextval('public.fp_mh_dot_kiem_ke_kho_ma_seq');
END;
$$;


--
-- Name: FUNCTION get_next_ma_dot_dot_kiem_ke_kho(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_ma_dot_dot_kiem_ke_kho() IS 'Trả về số thứ tự tiếp theo cho mã đợt kiểm kê (app format: KK-YYYY- + pad số)';


--
-- Name: get_next_ma_dot_farm_kiem_ke_pt(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_ma_dot_farm_kiem_ke_pt() RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN nextval('fp_farm_dot_kiem_ke_pt_ma_seq');
END;
$$;


--
-- Name: FUNCTION get_next_ma_dot_farm_kiem_ke_pt(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_ma_dot_farm_kiem_ke_pt() IS 'Số thứ tự mã đợt kiểm kê phân thuốc tiếp theo (app ghép thành KKPT-YYYY-NNNN)';


--
-- Name: get_next_ma_phieu_chi_phi_tai_san(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_ma_phieu_chi_phi_tai_san() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  next_val bigint;
BEGIN
  next_val := nextval('fp_ts_chi_phi_tai_san_ma_phieu_seq');
  RETURN 'CPTS-' || lpad(next_val::text, 4, '0');
END;
$$;


--
-- Name: FUNCTION get_next_ma_phieu_chi_phi_tai_san(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_ma_phieu_chi_phi_tai_san() IS 'Trả về mã phiếu chi phí tài sản tiếp theo (CPTS-0001, CPTS-0002, ...)';


--
-- Name: get_next_ma_phieu_cpth(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_ma_phieu_cpth(p_loai text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  next_val bigint;
  prefix text;
BEGIN
  IF p_loai = 'Cấp phát' THEN
    next_val := nextval('fp_ts_phieu_cpth_seq_cap_phat');
    prefix := 'CP-';
  ELSIF p_loai = 'Thu hồi' THEN
    next_val := nextval('fp_ts_phieu_cpth_seq_thu_hoi');
    prefix := 'TH-';
  ELSIF p_loai IN ('Luân chuyển vị trí', 'Luân chuyển người quản lý', 'Luân chuyển cả hai') THEN
    next_val := nextval('fp_ts_phieu_cpth_seq_luan_chuyen');
    prefix := 'LC-';
  ELSE
    RAISE EXCEPTION 'Invalid loai_phieu: %', p_loai;
  END IF;
  RETURN prefix || lpad(next_val::text, 4, '0');
END;
$$;


--
-- Name: FUNCTION get_next_ma_phieu_cpth(p_loai text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_ma_phieu_cpth(p_loai text) IS 'Trả về mã phiếu cấp phát/thu hồi tiếp theo (CP-0001, TH-0001, LC-0001)';


--
-- Name: get_next_so_phieu(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu(p_loai text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  next_val bigint;
  prefix text;
BEGIN
  IF p_loai = 'nhập' THEN
    next_val := nextval('fp_mh_phieu_kho_so_seq_nhap');
    prefix := 'NK-';
  ELSIF p_loai = 'xuất' THEN
    next_val := nextval('fp_mh_phieu_kho_so_seq_xuat');
    prefix := 'XK-';
  ELSIF p_loai = 'chuyển' THEN
    next_val := nextval('fp_mh_phieu_kho_so_seq_chuyen');
    prefix := 'CK-';
  ELSE
    RAISE EXCEPTION 'Invalid loai: %', p_loai;
  END IF;
  RETURN prefix || lpad(next_val::text, 4, '0');
END;
$$;


--
-- Name: FUNCTION get_next_so_phieu(p_loai text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu(p_loai text) IS 'Trả về mã phiếu tiếp theo theo loại (NK-0001, XK-0001, CK-0001)';


--
-- Name: get_next_so_phieu_farm_de_xuat_mua_hang(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_farm_de_xuat_mua_hang() RETURNS bigint
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nextval('fp_farm_de_xuat_mua_hang_so_seq');
$$;


--
-- Name: FUNCTION get_next_so_phieu_farm_de_xuat_mua_hang(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_farm_de_xuat_mua_hang() IS 'Số thứ tự tiếp theo cho số phiếu đề xuất mua hàng farm (app format: FDX- + pad)';


--
-- Name: get_next_so_phieu_farm_pt(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_farm_pt(p_loai text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  next_val bigint;
  prefix text;
BEGIN
  IF p_loai = 'nhập' THEN
    next_val := nextval('fp_farm_phieu_kho_pt_so_seq_nhap');
    prefix := 'FNK-';
  ELSIF p_loai = 'xuất' THEN
    next_val := nextval('fp_farm_phieu_kho_pt_so_seq_xuat');
    prefix := 'FXK-';
  ELSIF p_loai = 'chuyển' THEN
    next_val := nextval('fp_farm_phieu_kho_pt_so_seq_chuyen');
    prefix := 'FCK-';
  ELSE
    RAISE EXCEPTION 'Invalid loai: %', p_loai;
  END IF;
  RETURN prefix || lpad(next_val::text, 4, '0');
END;
$$;


--
-- Name: FUNCTION get_next_so_phieu_farm_pt(p_loai text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_farm_pt(p_loai text) IS 'Mã phiếu kho phân thuốc tiếp theo (FNK-, FXK-, FCK-)';


--
-- Name: get_next_so_phieu_phieu_de_xuat_vat_tu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_phieu_de_xuat_vat_tu() RETURNS bigint
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nextval('fp_mh_phieu_de_xuat_vat_tu_so_seq');
$$;


--
-- Name: FUNCTION get_next_so_phieu_phieu_de_xuat_vat_tu(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_phieu_de_xuat_vat_tu() IS 'Trả về số thứ tự tiếp theo cho số phiếu đề xuất vật tư (app format: tiền tố + pad số)';


--
-- Name: get_next_so_phieu_phieu_kiem_ke(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_phieu_kiem_ke() RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN nextval('fp_mh_phieu_kiem_ke_so_seq');
END;
$$;


--
-- Name: FUNCTION get_next_so_phieu_phieu_kiem_ke(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_phieu_kiem_ke() IS 'Trả về số thứ tự tiếp theo cho số phiếu kiểm kê (app format: KK-YYYY- + pad số)';


--
-- Name: get_next_so_phieu_tc_quy_batch(text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_tc_quy_batch(p_loai text, p_so_luong integer) RETURNS SETOF bigint
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT CASE
           WHEN p_loai = 'thu' THEN nextval('public.fp_tc_quy_thu_so_seq')
           ELSE nextval('public.fp_tc_quy_chi_so_seq')
         END
  FROM generate_series(1, GREATEST(COALESCE(p_so_luong, 0), 0));
$$;


--
-- Name: FUNCTION get_next_so_phieu_tc_quy_batch(p_loai text, p_so_luong integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_tc_quy_batch(p_loai text, p_so_luong integer) IS 'Lấy p_so_luong số thứ tự liên tiếp cho phiếu thu/chi quỹ (luồng import)';


--
-- Name: get_next_so_phieu_tc_quy_chi(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_tc_quy_chi() RETURNS bigint
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nextval('public.fp_tc_quy_chi_so_seq');
$$;


--
-- Name: FUNCTION get_next_so_phieu_tc_quy_chi(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_tc_quy_chi() IS 'Số thứ tự tiếp theo cho phiếu chi quỹ (app format: PC- + pad 4)';


--
-- Name: get_next_so_phieu_tc_quy_thu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_tc_quy_thu() RETURNS bigint
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nextval('public.fp_tc_quy_thu_so_seq');
$$;


--
-- Name: FUNCTION get_next_so_phieu_tc_quy_thu(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_tc_quy_thu() IS 'Số thứ tự tiếp theo cho phiếu thu quỹ (app format: PT- + pad 4)';


--
-- Name: get_next_so_phieu_thanh_toan_doi_tac(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_phieu_thanh_toan_doi_tac() RETURNS bigint
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nextval('fp_mh_thanh_toan_doi_tac_so_seq');
$$;


--
-- Name: FUNCTION get_next_so_phieu_thanh_toan_doi_tac(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_phieu_thanh_toan_doi_tac() IS 'Trả về số thứ tự tiếp theo cho số phiếu thanh toán đối tác (app format: tiền tố + pad)';


--
-- Name: get_next_so_po_don_dat_hang(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_next_so_po_don_dat_hang() RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN nextval('fp_mh_don_dat_hang_so_seq');
END;
$$;


--
-- Name: FUNCTION get_next_so_po_don_dat_hang(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_next_so_po_don_dat_hang() IS 'Trả về số thứ tự tiếp theo cho số PO đơn đặt hàng (app format: PO-YYYY- + pad số)';


--
-- Name: is_admin_current_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin_current_user() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fp_var_nhan_vien nv
    JOIN public.fp_var_chuc_vu cv ON cv.id = nv.chuc_vu_id
    WHERE LOWER(nv.email) = LOWER(auth.jwt() ->> 'email')
      AND cv.tt = 1
  );
$$;


--
-- Name: kiem_ke_apply_dieu_chinh_chi_tiet(bigint, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint) RETURNS bigint
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id_dot bigint;
  v_id_kho bigint;
  v_id_hh bigint;
  v_so_so numeric;
  v_so_tt numeric;
  v_id_phieu_old bigint;
  v_dot_tt text;
  v_ma_dot text;
  v_ngay date;
  v_delta numeric;
  v_loai text;
  v_so_phieu text;
  v_id_phieu bigint;
  v_ten_kho text;
  v_ten_hh text;
  v_dvt text;
  v_ten_nv text;
BEGIN
  SELECT
    ct.id_dot_kiem_ke_kho,
    ct.id_kho,
    ct.id_hang_hoa,
    ct.so_luong_so,
    ct.so_luong_thuc_te,
    ct.id_phieu_kho_dieu_chinh,
    d.trang_thai,
    d.ma_dot,
    d.ngay_ket_thuc::date
  INTO
    v_id_dot,
    v_id_kho,
    v_id_hh,
    v_so_so,
    v_so_tt,
    v_id_phieu_old,
    v_dot_tt,
    v_ma_dot,
    v_ngay
  FROM public.fp_mh_dot_kiem_ke_kho_chi_tiet ct
  JOIN public.fp_mh_dot_kiem_ke_kho d ON d.id = ct.id_dot_kiem_ke_kho
  WHERE ct.id = p_id_chi_tiet
  FOR UPDATE OF ct;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'kiem_ke_chi_tiet_not_found';
  END IF;

  IF v_dot_tt IS DISTINCT FROM 'dang_kiem_ke' THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_dang_kiem_ke';
  END IF;

  IF v_id_phieu_old IS NOT NULL THEN
    RAISE EXCEPTION 'kiem_ke_already_adjusted';
  END IF;

  IF v_so_tt IS NULL THEN
    RAISE EXCEPTION 'kiem_ke_no_thuc_te';
  END IF;

  v_delta := v_so_tt - v_so_so;
  IF v_delta = 0 THEN
    RAISE EXCEPTION 'kiem_ke_no_variance';
  END IF;

  IF v_delta > 0 THEN
    v_loai := 'nhập';
  ELSE
    v_loai := 'xuất';
  END IF;

  SELECT k.ten_kho INTO v_ten_kho FROM public.fp_mh_danh_sach_kho k WHERE k.id = v_id_kho;
  SELECT h.ten_hang_hoa, h.dvt INTO v_ten_hh, v_dvt FROM public.fp_mh_danh_sach_hang_hoa h WHERE h.id = v_id_hh;

  IF p_nguoi_tao_id IS NOT NULL THEN
    SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = p_nguoi_tao_id;
  END IF;

  v_so_phieu := get_next_so_phieu(v_loai);

  INSERT INTO public.fp_mh_phieu_kho (
    so_phieu,
    ngay,
    loai,
    kho_id,
    ten_kho,
    kho_den_id,
    ten_kho_den,
    id_nha_cung_cap,
    id_khach_hang,
    trang_thai,
    mo_ta,
    nguoi_tao_id,
    ten_nguoi_tao
  ) VALUES (
    v_so_phieu,
    COALESCE(v_ngay, CURRENT_DATE),
    v_loai,
    v_id_kho,
    v_ten_kho,
    NULL,
    NULL,
    NULL,
    NULL,
    'Đã duyệt',
    format('Điều chỉnh tồn kiểm kê — Đợt %s', v_ma_dot),
    p_nguoi_tao_id,
    v_ten_nv
  )
  RETURNING id INTO v_id_phieu;

  INSERT INTO public.fp_mh_phieu_kho_chi_tiet (
    id_phieu_kho,
    id_hang_hoa,
    ten_hang_hoa,
    don_vi_tinh,
    so_luong,
    don_gia,
    ghi_chu,
    nguoi_tao_id,
    ten_nguoi_tao
  ) VALUES (
    v_id_phieu,
    v_id_hh,
    v_ten_hh,
    v_dvt,
    abs(v_delta),
    0,
    format('Điều chỉnh tồn kiểm kê — dòng chi tiết #%s', p_id_chi_tiet),
    p_nguoi_tao_id,
    v_ten_nv
  );

  UPDATE public.fp_mh_dot_kiem_ke_kho_chi_tiet
  SET
    id_phieu_kho_dieu_chinh = v_id_phieu,
    so_luong_dieu_chinh = abs(v_delta),
    tg_dieu_chinh_ton = now()
  WHERE id = p_id_chi_tiet;

  RETURN v_id_phieu;
END;
$$;


--
-- Name: FUNCTION kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint) IS 'Một dòng lệch: thừa (TT>so) → nhập, thiếu (TT<so) → xuất; cập nhật id_phieu_kho_dieu_chinh';


--
-- Name: kiem_ke_apply_dieu_chinh_dot(bigint, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_dot_tt text;
  v_ma_dot text;
  v_ngay date;
  v_ten_nv text;
  v_updated int := 0;
  rec_grp RECORD;
  v_so_phieu text;
  v_id_phieu bigint;
  v_ten_kho text;
  v_ten_hh text;
  v_dvt text;
  line_rec RECORD;
BEGIN
  SELECT d.trang_thai, d.ma_dot, d.ngay_ket_thuc::date
  INTO v_dot_tt, v_ma_dot, v_ngay
  FROM public.fp_mh_dot_kiem_ke_kho d
  WHERE d.id = p_id_dot
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_found';
  END IF;

  IF v_dot_tt IS DISTINCT FROM 'dang_kiem_ke' THEN
    RAISE EXCEPTION 'kiem_ke_dot_not_dang_kiem_ke';
  END IF;

  IF p_nguoi_tao_id IS NOT NULL THEN
    SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = p_nguoi_tao_id;
  END IF;

  PERFORM 1
  FROM public.fp_mh_dot_kiem_ke_kho_chi_tiet ct
  WHERE ct.id_dot_kiem_ke_kho = p_id_dot
    AND ct.id_phieu_kho_dieu_chinh IS NULL
    AND ct.so_luong_thuc_te IS NOT NULL
    AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  FOR UPDATE OF ct;

  FOR rec_grp IN
    SELECT DISTINCT
      ct.id_kho,
      CASE WHEN (ct.so_luong_thuc_te - ct.so_luong_so) > 0 THEN 'nhập'::text ELSE 'xuất'::text END AS loai
    FROM public.fp_mh_dot_kiem_ke_kho_chi_tiet ct
    WHERE ct.id_dot_kiem_ke_kho = p_id_dot
      AND ct.id_phieu_kho_dieu_chinh IS NULL
      AND ct.so_luong_thuc_te IS NOT NULL
      AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  LOOP
    SELECT k.ten_kho INTO v_ten_kho FROM public.fp_mh_danh_sach_kho k WHERE k.id = rec_grp.id_kho;

    v_so_phieu := get_next_so_phieu(rec_grp.loai);

    INSERT INTO public.fp_mh_phieu_kho (
      so_phieu,
      ngay,
      loai,
      kho_id,
      ten_kho,
      kho_den_id,
      ten_kho_den,
      id_nha_cung_cap,
      id_khach_hang,
      trang_thai,
      mo_ta,
      nguoi_tao_id,
      ten_nguoi_tao
    ) VALUES (
      v_so_phieu,
      COALESCE(v_ngay, CURRENT_DATE),
      rec_grp.loai,
      rec_grp.id_kho,
      v_ten_kho,
      NULL,
      NULL,
      NULL,
      NULL,
      'Đã duyệt',
      format('Điều chỉnh tồn kiểm kê — Đợt %s (toàn đợt)', v_ma_dot),
      p_nguoi_tao_id,
      v_ten_nv
    )
    RETURNING id INTO v_id_phieu;

    FOR line_rec IN
      SELECT ct.id, ct.id_hang_hoa, abs(ct.so_luong_thuc_te - ct.so_luong_so) AS sl_dc
      FROM public.fp_mh_dot_kiem_ke_kho_chi_tiet ct
      WHERE ct.id_dot_kiem_ke_kho = p_id_dot
        AND ct.id_kho = rec_grp.id_kho
        AND ct.id_phieu_kho_dieu_chinh IS NULL
        AND ct.so_luong_thuc_te IS NOT NULL
        AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
        AND (
          (rec_grp.loai = 'nhập' AND (ct.so_luong_thuc_te - ct.so_luong_so) > 0)
          OR (rec_grp.loai = 'xuất' AND (ct.so_luong_thuc_te - ct.so_luong_so) < 0)
        )
      ORDER BY ct.id
    LOOP
      SELECT h.ten_hang_hoa, h.dvt INTO v_ten_hh, v_dvt
      FROM public.fp_mh_danh_sach_hang_hoa h WHERE h.id = line_rec.id_hang_hoa;

      INSERT INTO public.fp_mh_phieu_kho_chi_tiet (
        id_phieu_kho,
        id_hang_hoa,
        ten_hang_hoa,
        don_vi_tinh,
        so_luong,
        don_gia,
        ghi_chu,
        nguoi_tao_id,
        ten_nguoi_tao
      ) VALUES (
        v_id_phieu,
        line_rec.id_hang_hoa,
        v_ten_hh,
        v_dvt,
        line_rec.sl_dc,
        0,
        format('Điều chỉnh tồn kiểm kê — dòng chi tiết #%s', line_rec.id),
        p_nguoi_tao_id,
        v_ten_nv
      );

      UPDATE public.fp_mh_dot_kiem_ke_kho_chi_tiet
      SET
        id_phieu_kho_dieu_chinh = v_id_phieu,
        so_luong_dieu_chinh = line_rec.sl_dc,
        tg_dieu_chinh_ton = now()
      WHERE id = line_rec.id;

      v_updated := v_updated + 1;
    END LOOP;
  END LOOP;

  RETURN v_updated;
END;
$$;


--
-- Name: FUNCTION kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint) IS 'Toàn đợt: gộp theo kho + loại — thừa nhập, thiếu xuất; trả về số dòng đã cập nhật';


--
-- Name: nhan_vien_hien_tai_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.nhan_vien_hien_tai_id() RETURNS bigint
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
  SELECT COALESCE(
    (SELECT (auth.jwt() ->> 'nv')::BIGINT
      WHERE COALESCE(auth.jwt() ->> 'nv', '') ~ '^[0-9]+$'),
    (SELECT nv.id
       FROM public.fp_var_nhan_vien nv
      WHERE LOWER(TRIM(nv.email)) = LOWER(TRIM(NULLIF(auth.jwt() ->> 'email', '')))
      ORDER BY nv.id
      LIMIT 1)
  );
$_$;


--
-- Name: FUNCTION nhan_vien_hien_tai_id(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.nhan_vien_hien_tai_id() IS 'Id nhân viên của phiên hiện tại: claim `nv` trong JWT, lui về khớp email nếu token chưa có claim này.';


--
-- Name: remove_tag_from_partners(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_tag_from_partners(p_tag_id integer) RETURNS void
    LANGUAGE sql
    SET search_path TO 'public'
    AS $$
  UPDATE fp_mh_danh_sach_doi_tac
  SET tag_ids = array_remove(tag_ids, p_tag_id)
  WHERE tag_ids IS NOT NULL AND p_tag_id = ANY(tag_ids);
$$;


--
-- Name: remove_tags_from_partners(integer[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.remove_tags_from_partners(p_tag_ids integer[]) RETURNS void
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, tag_ids
    FROM fp_mh_danh_sach_doi_tac
    WHERE tag_ids IS NOT NULL AND tag_ids && p_tag_ids
  LOOP
    UPDATE fp_mh_danh_sach_doi_tac
    SET tag_ids = COALESCE(
      ARRAY(
        SELECT x
        FROM unnest(r.tag_ids) AS x
        WHERE NOT (x = ANY(p_tag_ids))
      ),
      ARRAY[]::int[]
    )
    WHERE id = r.id;
  END LOOP;
END;
$$;


--
-- Name: revoke_session(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.revoke_session(p_session_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  DELETE FROM auth.sessions
  WHERE id = p_session_id
    AND user_id = auth.uid();
END;
$$;


--
-- Name: FUNCTION revoke_session(p_session_id uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.revoke_session(p_session_id uuid) IS 'Xóa phiên auth.sessions nếu thuộc user hiện tại – dùng cho đăng xuất thiết bị từ xa';


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: rpc_count_nhan_vien_by_chuc_vu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_count_nhan_vien_by_chuc_vu() RETURNS TABLE(chuc_vu_id bigint, so_nhan_vien bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    chuc_vu_id::BIGINT,
    COUNT(*)::BIGINT AS so_nhan_vien
  FROM public.fp_var_nhan_vien
  WHERE chuc_vu_id IS NOT NULL
  GROUP BY chuc_vu_id;
$$;


--
-- Name: rpc_dang_nhap(text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_dang_nhap(p_email text, p_mat_khau text, p_user_agent text DEFAULT NULL::text, p_ip text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(coalesce(p_email, '')));
  v_xac   JSONB;
  v_nv    RECORD;
  v_phien JSONB;
BEGIN
  IF public.dang_bi_chan_dang_nhap(v_email) THEN
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'bi_chan');
  END IF;

  -- Gọi được dù auth_service không có EXECUTE trên rpc_verify_mat_khau:
  -- trong thân hàm SECURITY DEFINER, current_user là owner.
  v_xac := public.rpc_verify_mat_khau(v_email, p_mat_khau);

  IF NOT coalesce((v_xac ->> 'ok')::boolean, FALSE) THEN
    INSERT INTO public.fp_var_lan_dang_nhap_sai (email, ip)
    VALUES (v_email, left(coalesce(p_ip, ''), 100));
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'sai_thong_tin');
  END IF;

  SELECT id, email, ho_va_ten, trang_thai, phai_doi_mat_khau
  INTO v_nv
  FROM public.fp_var_nhan_vien
  WHERE id = (v_xac ->> 'id')::bigint;

  IF v_nv.id IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'sai_thong_tin');
  END IF;

  IF v_nv.trang_thai = 'Nghỉ việc' THEN
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'nghi_viec');
  END IF;

  DELETE FROM public.fp_var_lan_dang_nhap_sai WHERE email = v_email;
  -- Dọn rác cơ hội: bảng này chỉ có nghĩa trong 15 phút.
  DELETE FROM public.fp_var_lan_dang_nhap_sai WHERE luc < now() - interval '1 day';

  v_phien := public.tao_phien_dang_nhap(v_nv.id, v_nv.email, p_user_agent, p_ip);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'nhan_vien_id', v_nv.id,
    'email', v_nv.email,
    'ho_va_ten', v_nv.ho_va_ten,
    'phai_doi_mat_khau', v_nv.phai_doi_mat_khau
  ) || v_phien;
END $$;


--
-- Name: rpc_dang_nhap_google(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_dang_nhap_google(p_email text, p_user_agent text DEFAULT NULL::text, p_ip text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_email TEXT := LOWER(TRIM(coalesce(p_email, '')));
  v_nv    RECORD;
  v_phien JSONB;
BEGIN
  SELECT id, email, ho_va_ten, trang_thai, phai_doi_mat_khau
  INTO v_nv
  FROM public.fp_var_nhan_vien
  WHERE LOWER(email) = v_email;

  IF v_nv.id IS NULL THEN
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'khong_co_ho_so');
  END IF;

  IF v_nv.trang_thai = 'Nghỉ việc' THEN
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'nghi_viec');
  END IF;

  v_phien := public.tao_phien_dang_nhap(v_nv.id, v_nv.email, p_user_agent, p_ip);

  RETURN jsonb_build_object(
    'ok', TRUE,
    'nhan_vien_id', v_nv.id,
    'email', v_nv.email,
    'ho_va_ten', v_nv.ho_va_ten,
    -- Đăng nhập Google không dùng mật khẩu nên không bắt đổi.
    'phai_doi_mat_khau', FALSE
  ) || v_phien;
END $$;


--
-- Name: rpc_don_dat_hang_stats(date, date, text[], bigint[], bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_don_dat_hang_stats(p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_trang_thai text[] DEFAULT NULL::text[], p_supplier_ids bigint[] DEFAULT NULL::bigint[], p_buyer_ids bigint[] DEFAULT NULL::bigint[]) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
WITH base AS (
  SELECT
    d.*,
    coalesce(d.ten_nha_cung_cap, ncc.ten_doi_tac, d.id_nha_cung_cap::text) AS supplier_label,
    coalesce(nv_dat.ho_va_ten, d.id_nguoi_dat::text) AS buyer_label
  FROM public.fp_mh_don_dat_hang d
  LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc
    ON ncc.id = d.id_nha_cung_cap AND ncc.loai_doi_tac = 'nha_cung_cap'
  LEFT JOIN public.fp_var_nhan_vien nv_dat ON nv_dat.id = d.id_nguoi_dat
  WHERE
    (p_date_from IS NULL OR d.ngay_dat::date >= p_date_from)
    AND (p_date_to IS NULL OR d.ngay_dat::date <= p_date_to)
    AND (p_trang_thai IS NULL OR cardinality(p_trang_thai) = 0 OR d.trang_thai = ANY (p_trang_thai))
    AND (p_supplier_ids IS NULL OR cardinality(p_supplier_ids) = 0 OR d.id_nha_cung_cap = ANY (p_supplier_ids))
    AND (p_buyer_ids IS NULL OR cardinality(p_buyer_ids) = 0 OR d.id_nguoi_dat = ANY (p_buyer_ids))
),
fullset AS (
  SELECT * FROM public.fp_mh_don_dat_hang
),
chip_status AS (
  SELECT d.trang_thai AS status, count(*)::int AS cnt FROM fullset d GROUP BY 1
),
chip_supplier AS (
  SELECT d.id_nha_cung_cap::text AS id, count(*)::int AS cnt
  FROM fullset d GROUP BY 1
),
chip_buyer AS (
  SELECT d.id_nguoi_dat::text AS id, count(*)::int AS cnt FROM fullset d GROUP BY 1
)
SELECT jsonb_build_object(
  'summary', (
    SELECT jsonb_build_object(
      'total', count(*)::int,
      'draft', coalesce(sum(CASE WHEN trang_thai = 'Nháp' THEN 1 ELSE 0 END), 0)::int,
      'inProgress', coalesce(sum(CASE WHEN trang_thai IN ('Chờ duyệt','Đã gửi','Đã xác nhận','Đang giao') THEN 1 ELSE 0 END), 0)::int,
      'completed', coalesce(sum(CASE WHEN trang_thai IN ('Đã nhận đủ','Đã đóng') THEN 1 ELSE 0 END), 0)::int,
      'cancelled', coalesce(sum(CASE WHEN trang_thai = 'Hủy' THEN 1 ELSE 0 END), 0)::int
    ) FROM base
  ),
  'byTrangThai', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', trang_thai, 'count', cnt))
    FROM (SELECT trang_thai, count(*)::int AS cnt FROM base GROUP BY 1) s
  ), '[]'::jsonb),
  'bySupplier', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT d.supplier_label AS name, count(*)::int AS cnt
      FROM base d GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byBuyer', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT d.buyer_label AS name, count(*)::int AS cnt
      FROM base d GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byMonth', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', label, 'value', cnt) ORDER BY ym)
    FROM (
      SELECT to_char(d.ngay_dat::date, 'YYYY-MM') AS ym,
             to_char(d.ngay_dat::date, 'MM') || '/' || to_char(d.ngay_dat::date, 'YYYY') AS label,
             count(*)::int AS cnt
      FROM base d
      WHERE d.ngay_dat IS NOT NULL
      GROUP BY 1, 2
    ) m
  ), '[]'::jsonb),
  'chipByTrangThai', coalesce((SELECT jsonb_object_agg(status, cnt) FROM chip_status), '{}'::jsonb),
  'chipBySupplierId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_supplier), '{}'::jsonb),
  'chipByBuyerId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_buyer), '{}'::jsonb)
);
$$;


--
-- Name: FUNCTION rpc_don_dat_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_supplier_ids bigint[], p_buyer_ids bigint[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_don_dat_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_supplier_ids bigint[], p_buyer_ids bigint[]) IS 'Thống kê đơn đặt hàng (JSON) cho tab Thống kê — app: don-dat-hang ThongKeTab';


--
-- Name: rpc_don_su_kien_thong_bao_cu(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_don_su_kien_thong_bao_cu(p_so_ngay integer DEFAULT 30) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_so_dong integer;
BEGIN
  DELETE FROM public.fp_var_su_kien_thong_bao
   WHERE tg_xu_ly IS NOT NULL
     AND tg_xu_ly < now() - make_interval(days => p_so_ngay);
  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;


--
-- Name: rpc_don_thong_bao_cu(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_don_thong_bao_cu(p_so_ngay integer DEFAULT 90) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_so_dong integer;
BEGIN
  DELETE FROM public.fp_var_thong_bao
   WHERE tg_tao < now() - make_interval(days => p_so_ngay)
     AND (da_xoa = true OR da_doc = true);
  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;


--
-- Name: rpc_farm_de_xuat_mua_hang_stats(date, date, text[], bigint[], bigint[], bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_farm_de_xuat_mua_hang_stats(p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_trang_thai text[] DEFAULT NULL::text[], p_id_noi_de_xuat bigint[] DEFAULT NULL::bigint[], p_id_nguoi_de_xuat bigint[] DEFAULT NULL::bigint[], p_id_nguoi_duyet bigint[] DEFAULT NULL::bigint[]) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
WITH base AS (
  SELECT p.*
  FROM public.fp_farm_de_xuat_mua_hang p
  WHERE
    (p_date_from IS NULL OR p.ngay::date >= p_date_from)
    AND (p_date_to IS NULL OR p.ngay::date <= p_date_to)
    AND (p_trang_thai IS NULL OR cardinality(p_trang_thai) = 0 OR p.trang_thai = ANY (p_trang_thai))
    AND (p_id_noi_de_xuat IS NULL OR cardinality(p_id_noi_de_xuat) = 0 OR p.id_noi_de_xuat = ANY (p_id_noi_de_xuat))
    AND (p_id_nguoi_de_xuat IS NULL OR cardinality(p_id_nguoi_de_xuat) = 0 OR p.id_nguoi_de_xuat = ANY (p_id_nguoi_de_xuat))
    AND (
      p_id_nguoi_duyet IS NULL OR cardinality(p_id_nguoi_duyet) = 0
      OR (p.id_nguoi_duyet IS NOT NULL AND p.id_nguoi_duyet = ANY (p_id_nguoi_duyet))
    )
),
fullset AS (
  SELECT * FROM public.fp_farm_de_xuat_mua_hang
),
chip_status AS (
  SELECT
    CASE p.trang_thai
      WHEN 'Chờ duyệt' THEN 'Pending'
      WHEN 'Đợi duyệt' THEN 'Waiting'
      WHEN 'Đã duyệt' THEN 'Approved'
      WHEN 'Không duyệt' THEN 'Rejected'
      ELSE 'Pending'
    END AS status_key,
    count(*)::int AS cnt
  FROM fullset p
  GROUP BY 1
),
chip_noi AS (
  SELECT p.id_noi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_de_xuat AS (
  SELECT p.id_nguoi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_duyet AS (
  SELECT p.id_nguoi_duyet::text AS id, count(*)::int AS cnt
  FROM fullset p
  WHERE p.id_nguoi_duyet IS NOT NULL
  GROUP BY 1
)
SELECT jsonb_build_object(
  'summary', (
    SELECT jsonb_build_object(
      'total', count(*)::int,
      'pending', coalesce(sum(CASE WHEN trang_thai = 'Chờ duyệt' THEN 1 ELSE 0 END), 0)::int,
      'waiting', coalesce(sum(CASE WHEN trang_thai = 'Đợi duyệt' THEN 1 ELSE 0 END), 0)::int,
      'approved', coalesce(sum(CASE WHEN trang_thai = 'Đã duyệt' THEN 1 ELSE 0 END), 0)::int,
      'rejected', coalesce(sum(CASE WHEN trang_thai = 'Không duyệt' THEN 1 ELSE 0 END), 0)::int
    ) FROM base
  ),
  'byTrangThai', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', status_key, 'count', cnt))
    FROM (
      SELECT
        CASE trang_thai
          WHEN 'Chờ duyệt' THEN 'Pending'
          WHEN 'Đợi duyệt' THEN 'Waiting'
          WHEN 'Đã duyệt' THEN 'Approved'
          WHEN 'Không duyệt' THEN 'Rejected'
          ELSE 'Pending'
        END AS status_key,
        count(*)::int AS cnt
      FROM base
      GROUP BY 1
    ) s
  ), '[]'::jsonb),
  'byNoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(k.ten_kho, b.id_noi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = b.id_noi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDuyet', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_duyet::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_duyet
      WHERE b.id_nguoi_duyet IS NOT NULL
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byMonth', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', label, 'value', cnt) ORDER BY ym)
    FROM (
      SELECT to_char(b.ngay::date, 'YYYY-MM') AS ym,
             to_char(b.ngay::date, 'MM') || '/' || to_char(b.ngay::date, 'YYYY') AS label,
             count(*)::int AS cnt
      FROM base b
      WHERE b.ngay IS NOT NULL
      GROUP BY 1, 2
    ) m
  ), '[]'::jsonb),
  'chipByStatusKey', coalesce((SELECT jsonb_object_agg(status_key, cnt) FROM chip_status), '{}'::jsonb),
  'chipByNoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_noi), '{}'::jsonb),
  'chipByNguoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_de_xuat), '{}'::jsonb),
  'chipByNguoiDuyetId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_duyet), '{}'::jsonb)
);
$$;


--
-- Name: FUNCTION rpc_farm_de_xuat_mua_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_farm_de_xuat_mua_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]) IS 'Thống kê đề xuất mua hàng farm — tab Thống kê';


--
-- Name: rpc_fp_ts_distinct_model(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_fp_ts_distinct_model() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(model) AS trimmed
    FROM fp_ts_tai_san
    WHERE model IS NOT NULL AND trim(model) <> ''
  ) s;
$$;


--
-- Name: rpc_fp_ts_distinct_ten_nha_cung_cap(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_fp_ts_distinct_ten_nha_cung_cap() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(ten_nha_cung_cap) AS trimmed
    FROM fp_ts_tai_san
    WHERE ten_nha_cung_cap IS NOT NULL AND trim(ten_nha_cung_cap) <> ''
  ) s;
$$;


--
-- Name: rpc_fp_ts_distinct_thuong_hieu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_fp_ts_distinct_thuong_hieu() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(thuong_hieu) AS trimmed
    FROM fp_ts_tai_san
    WHERE thuong_hieu IS NOT NULL AND trim(thuong_hieu) <> ''
  ) s;
$$;


--
-- Name: rpc_fp_ts_distinct_xuat_xu(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_fp_ts_distinct_xuat_xu() RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    jsonb_agg(to_jsonb(trimmed) ORDER BY trimmed),
    '[]'::jsonb
  )
  FROM (
    SELECT DISTINCT trim(xuat_xu) AS trimmed
    FROM fp_ts_tai_san
    WHERE xuat_xu IS NOT NULL AND trim(xuat_xu) <> ''
  ) s;
$$;


--
-- Name: rpc_get_session_bootstrap(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_get_session_bootstrap(p_email text) RETURNS jsonb
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_email  TEXT := LOWER(TRIM(p_email));
  v_emp    JSONB;
  v_cv     JSONB;
  v_pq     JSONB;
  v_cty    JSONB;
  v_cv_id  BIGINT;
BEGIN
  -- 1) Nhân viên (không tải cột hinh_anh base64)
  SELECT jsonb_build_object(
    'id', nv.id,
    'ho_va_ten', nv.ho_va_ten,
    'email', nv.email,
    'so_dien_thoai', nv.so_dien_thoai,
    'phong_ban_id', nv.phong_ban_id,
    'chuc_vu_id', nv.chuc_vu_id,
    'chi_nhanh_ids', nv.chi_nhanh_ids,
    'cap_bac_id', nv.cap_bac_id,
    'cap_bac', nv.cap_bac,
    'trang_thai', nv.trang_thai,
    'ten_phong_ban', nv.ten_phong_ban,
    'ten_chuc_vu', nv.ten_chuc_vu,
    'ten_chi_nhanh', nv.ten_chi_nhanh,
    'ten_cap_bac', nv.ten_cap_bac,
    'gioi_tinh', nv.gioi_tinh,
    'ngay_vao_lam', nv.ngay_vao_lam,
    -- Nếu bảng có cột hinh_anh_url thì trả, không thì để null.
    'hinh_anh_url', NULL
  ), nv.chuc_vu_id
  INTO v_emp, v_cv_id
  FROM public.fp_var_nhan_vien nv
  WHERE LOWER(nv.email) = v_email
  LIMIT 1;

  IF v_emp IS NULL THEN
    RETURN jsonb_build_object(
      'employee', NULL,
      'chuc_vu',  NULL,
      'phan_quyen', '[]'::JSONB,
      'company',  NULL
    );
  END IF;

  -- 2) Chức vụ (chỉ lấy tt)
  SELECT jsonb_build_object('id', cv.id, 'tt', cv.tt)
  INTO v_cv
  FROM public.fp_var_chuc_vu cv
  WHERE cv.id = v_cv_id
  LIMIT 1;

  -- 3) Phân quyền theo chức vụ
  SELECT COALESCE(jsonb_agg(
           jsonb_build_object('module_id', pq.module_id, 'actions', pq.actions)
         ), '[]'::JSONB)
  INTO v_pq
  FROM public.fp_var_phan_quyen pq
  WHERE pq.chuc_vu_id = v_cv_id;

  -- 4) Thông tin công ty (bản ghi có id nhỏ nhất)
  SELECT jsonb_build_object(
    'ten_ung_dung', c.ten_ung_dung,
    'mo_ta',        c.mo_ta,
    'logo',         c.logo,
    'ten_cong_ty',  c.ten_cong_ty,
    'ma_so_thue',   c.ma_so_thue,
    'dia_chi',      c.dia_chi,
    'so_dien_thoai', c.so_dien_thoai,
    'email',        c.email,
    'trang_web',    c.trang_web
  )
  INTO v_cty
  FROM public.fp_var_tt_cong_ty c
  ORDER BY c.id ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'employee',   v_emp,
    'chuc_vu',    v_cv,
    'phan_quyen', v_pq,
    'company',    v_cty
  );
END;
$$;


--
-- Name: rpc_lam_moi_phien(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_lam_moi_phien(p_refresh_hash text, p_user_agent text DEFAULT NULL::text, p_ip text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_phien   public.fp_var_phien_dang_nhap;
  v_nv      RECORD;
  v_token   TEXT;
BEGIN
  SELECT * INTO v_phien
  FROM public.fp_var_phien_dang_nhap
  WHERE refresh_hash = coalesce(p_refresh_hash, '')
  FOR UPDATE;

  IF v_phien.id IS NULL
     OR v_phien.thu_hoi_luc IS NOT NULL
     OR v_phien.het_han_luc <= now() THEN
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'phien_khong_hop_le');
  END IF;

  SELECT id, email, trang_thai INTO v_nv
  FROM public.fp_var_nhan_vien
  WHERE id = v_phien.nhan_vien_id;

  IF v_nv.id IS NULL OR v_nv.trang_thai = 'Nghỉ việc' THEN
    UPDATE public.fp_var_phien_dang_nhap SET thu_hoi_luc = now() WHERE id = v_phien.id;
    RETURN jsonb_build_object('ok', FALSE, 'ly_do', 'nghi_viec');
  END IF;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  UPDATE public.fp_var_phien_dang_nhap
  SET refresh_hash  = encode(extensions.digest(v_token, 'sha256'), 'hex'),
      het_han_luc   = now() + interval '30 days',
      dung_lan_cuoi = now(),
      user_agent    = coalesce(left(p_user_agent, 300), user_agent),
      ip            = coalesce(left(p_ip, 100), ip)
  WHERE id = v_phien.id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'nhan_vien_id', v_nv.id,
    'email', v_nv.email,
    'refresh_token', v_token,
    'refresh_het_han', now() + interval '30 days'
  );
END $$;


--
-- Name: rpc_nxt_by_period(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_nxt_by_period(p_filters jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    SET search_path TO 'public'
    AS $_$
DECLARE
  v_date_from date := nullif(trim(p_filters->>'dateFrom'), '')::date;
  v_date_to   date := nullif(trim(p_filters->>'dateTo'), '')::date;
  v_creator   bigint := nullif(trim(p_filters->>'allowedCreatorUserId'), '')::bigint;
  v_scope_on  boolean := (p_filters ? 'allowedBranchIds') OR v_creator IS NOT NULL;
  v_branch_ids bigint[];
  v_wh_ids     bigint[];
  v_loai       text[];
  v_hh_ids     bigint[];
  v_cat_ids    bigint[];
  v_narrow     boolean;
  v_result     jsonb;
BEGIN
  IF v_date_from IS NULL OR v_date_to IS NULL THEN
    RETURN jsonb_build_object(
      'byWarehouse', '[]'::jsonb,
      'byProduct', '[]'::jsonb,
      'byCell', '[]'::jsonb
    );
  END IF;

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_branch_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'allowedBranchIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_wh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'warehouseIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  SELECT coalesce(array_agg(public._nxt_norm_loai(x)), ARRAY[]::text[])
  INTO v_loai
  FROM jsonb_array_elements_text(coalesce(p_filters->'loaiPhieu', '[]'::jsonb)) AS t(x);

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_hh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'hangHoaIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[])
  INTO v_cat_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'categoryIds', '[]'::jsonb)) AS t(x)
  WHERE trim(x) ~ '^\d+$';

  v_narrow :=
    cardinality(v_wh_ids) > 0
    OR cardinality(v_hh_ids) > 0
    OR cardinality(v_cat_ids) > 0
    OR cardinality(v_loai) > 0;

  WITH mov_scoped AS (
    SELECT m.*
    FROM public.v_mh_nxt_movement m
    WHERE m.ngay > v_date_to OR (m.ngay >= v_date_from AND m.ngay <= v_date_to)
      AND (
        NOT v_scope_on
        OR (
          (v_creator IS NOT NULL AND m.nguoi_tao_id = v_creator)
          OR (
            cardinality(v_branch_ids) > 0
            AND (
              m.chi_nhanh_kho_id = ANY (v_branch_ids)
              OR m.chi_nhanh_kho_den_id = ANY (v_branch_ids)
            )
          )
        )
      )
  ),
  mov_product AS (
    SELECT m.*
    FROM mov_scoped m
    WHERE (cardinality(v_hh_ids) = 0 OR m.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (m.danh_muc_id IS NOT NULL AND m.danh_muc_id = ANY (v_cat_ids))
      )
  ),
  /* Trong kỳ: áp thêm lọc loại phiếu */
  mov_period AS (
    SELECT m.*
    FROM mov_product m
    WHERE m.ngay >= v_date_from AND m.ngay <= v_date_to
      AND (cardinality(v_loai) = 0 OR m.loai_n = ANY (v_loai))
  ),
  period_kh AS (
    SELECT m.kho_id, m.id_hang_hoa,
      sum(CASE WHEN m.loai_n = 'nhap' THEN m.qty ELSE 0 END) AS nhap,
      sum(CASE WHEN m.loai_n = 'xuat' THEN m.qty ELSE 0 END) AS xuat
    FROM mov_period m
    WHERE m.loai_n IN ('nhap', 'xuat')
      AND (cardinality(v_wh_ids) = 0 OR m.kho_id = ANY (v_wh_ids))
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  period_chuyen_from AS (
    SELECT m.kho_id, m.id_hang_hoa, sum(m.qty) AS xuat
    FROM mov_period m
    WHERE m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
      AND (cardinality(v_wh_ids) = 0 OR m.kho_id = ANY (v_wh_ids))
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  period_chuyen_to AS (
    SELECT m.kho_den_id AS kho_id, m.id_hang_hoa, sum(m.qty) AS nhap
    FROM mov_period m
    WHERE m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
      AND (cardinality(v_wh_ids) = 0 OR m.kho_den_id = ANY (v_wh_ids))
    GROUP BY m.kho_den_id, m.id_hang_hoa
  ),
  /* Sau kỳ: không lọc loại phiếu (mirror client fallback) */
  after_kh AS (
    SELECT m.kho_id, m.id_hang_hoa,
      sum(CASE WHEN m.loai_n = 'nhap' THEN m.qty ELSE 0 END) AS nhap,
      sum(CASE WHEN m.loai_n = 'xuat' THEN m.qty ELSE 0 END) AS xuat
    FROM mov_product m
    WHERE m.ngay > v_date_to AND m.loai_n IN ('nhap', 'xuat')
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  after_chuyen_from AS (
    SELECT m.kho_id, m.id_hang_hoa, sum(m.qty) AS xuat
    FROM mov_product m
    WHERE m.ngay > v_date_to AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
    GROUP BY m.kho_id, m.id_hang_hoa
  ),
  after_chuyen_to AS (
    SELECT m.kho_den_id AS kho_id, m.id_hang_hoa, sum(m.qty) AS nhap
    FROM mov_product m
    WHERE m.ngay > v_date_to AND m.loai_n = 'chuyen' AND m.kho_den_id IS NOT NULL
    GROUP BY m.kho_den_id, m.id_hang_hoa
  ),
  ton_scoped AS (
    SELECT t.kho_id, t.id_hang_hoa, t.so_luong::numeric AS so_luong
    FROM public.fp_mh_ton_kho t
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = t.kho_id
    WHERE
      NOT v_scope_on
      OR cardinality(v_branch_ids) = 0
      OR (k.chi_nhanh_id IS NOT NULL AND k.chi_nhanh_id = ANY (v_branch_ids))
  ),
  keys AS (
    SELECT DISTINCT kho_id, id_hang_hoa FROM period_kh
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM period_chuyen_from
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM period_chuyen_to
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM after_kh
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM after_chuyen_from
    UNION SELECT DISTINCT kho_id, id_hang_hoa FROM after_chuyen_to
    UNION
    SELECT DISTINCT t.kho_id, t.id_hang_hoa
    FROM ton_scoped t
    WHERE (cardinality(v_hh_ids) = 0 OR t.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR EXISTS (
          SELECT 1 FROM public.fp_mh_danh_sach_hang_hoa hh
          WHERE hh.id = t.id_hang_hoa
            AND hh.danh_muc_id IS NOT NULL
            AND hh.danh_muc_id = ANY (v_cat_ids)
        )
      )
  ),
  kh_detail AS (
    SELECT
      k.kho_id,
      k.id_hang_hoa,
      coalesce(t.so_luong, 0)
        - coalesce(af.nhap, 0) - coalesce(afc_to.nhap, 0)
        + coalesce(af.xuat, 0) + coalesce(afc_from.xuat, 0) AS ton_cuoi,
      coalesce(p.nhap, 0) + coalesce(pc_to.nhap, 0) AS period_nhap,
      coalesce(p.xuat, 0) + coalesce(pc_from.xuat, 0) AS period_xuat
    FROM keys k
    LEFT JOIN ton_scoped t ON t.kho_id = k.kho_id AND t.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN period_kh p ON p.kho_id = k.kho_id AND p.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN period_chuyen_from pc_from ON pc_from.kho_id = k.kho_id AND pc_from.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN period_chuyen_to pc_to ON pc_to.kho_id = k.kho_id AND pc_to.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN after_kh af ON af.kho_id = k.kho_id AND af.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN after_chuyen_from afc_from ON afc_from.kho_id = k.kho_id AND afc_from.id_hang_hoa = k.id_hang_hoa
    LEFT JOIN after_chuyen_to afc_to ON afc_to.kho_id = k.kho_id AND afc_to.id_hang_hoa = k.id_hang_hoa
  ),
  cells AS (
    SELECT
      kd.kho_id,
      kd.id_hang_hoa,
      (kd.ton_cuoi - kd.period_nhap + kd.period_xuat) AS ton_dau_ky,
      kd.period_nhap AS tong_nhap,
      kd.period_xuat AS tong_xuat,
      kd.ton_cuoi AS ton_cuoi_ky
    FROM kh_detail kd
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = kd.id_hang_hoa
    WHERE (cardinality(v_wh_ids) = 0 OR kd.kho_id = ANY (v_wh_ids))
      AND (cardinality(v_hh_ids) = 0 OR kd.id_hang_hoa = ANY (v_hh_ids))
      AND (
        cardinality(v_cat_ids) = 0
        OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids))
      )
      AND (
        NOT v_narrow
        OR (kd.ton_cuoi - kd.period_nhap + kd.period_xuat) <> 0
        OR kd.ton_cuoi <> 0
        OR kd.period_nhap <> 0
        OR kd.period_xuat <> 0
      )
  ),
  by_cell AS (
    SELECT
      c.kho_id::text AS id_kho,
      c.id_hang_hoa::text AS id_hang_hoa,
      c.ton_dau_ky,
      c.tong_nhap,
      c.tong_xuat,
      c.ton_cuoi_ky
    FROM cells c
  ),
  by_wh AS (
    SELECT
      c.kho_id::text AS id_kho,
      coalesce(k.ma_kho, c.kho_id::text) AS ma_kho,
      coalesce(k.ten_kho, c.kho_id::text) AS ten_kho,
      sum(c.ton_dau_ky) AS ton_dau_ky,
      sum(c.tong_nhap) AS tong_nhap,
      sum(c.tong_xuat) AS tong_xuat,
      sum(c.ton_cuoi_ky) AS ton_cuoi_ky
    FROM cells c
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = c.kho_id
    GROUP BY c.kho_id, k.ma_kho, k.ten_kho
  ),
  by_prod AS (
    SELECT
      c.id_hang_hoa::text AS id_hang_hoa,
      coalesce(hh.ma_hang_hoa, c.id_hang_hoa::text) AS ma_hang,
      coalesce(hh.ten_hang_hoa, '—') AS ten_hang,
      dm.ten_danh_muc,
      coalesce(hh.dvt, '—') AS don_vi_tinh,
      sum(c.ton_dau_ky) AS ton_dau_ky,
      sum(c.tong_nhap) AS tong_nhap,
      sum(c.tong_xuat) AS tong_xuat,
      sum(c.ton_cuoi_ky) AS ton_cuoi_ky
    FROM cells c
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = c.id_hang_hoa
    LEFT JOIN public.fp_mh_danh_muc_hang_hoa dm ON dm.id = hh.danh_muc_id
    GROUP BY c.id_hang_hoa, hh.ma_hang_hoa, hh.ten_hang_hoa, dm.ten_danh_muc, hh.dvt
  )
  SELECT jsonb_build_object(
    'byWarehouse', coalesce((SELECT jsonb_agg(to_jsonb(bw)) FROM by_wh bw), '[]'::jsonb),
    'byProduct', coalesce((SELECT jsonb_agg(to_jsonb(bp)) FROM by_prod bp), '[]'::jsonb),
    'byCell', coalesce((SELECT jsonb_agg(to_jsonb(bc)) FROM by_cell bc), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$_$;


--
-- Name: FUNCTION rpc_nxt_by_period(p_filters jsonb); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_nxt_by_period(p_filters jsonb) IS 'NXT theo kỳ (JSON: byWarehouse, byProduct, byCell). Dùng view v_mh_nxt_movement. Tab Tra cứu theo kỳ cần byCell.';


--
-- Name: rpc_phieu_de_xuat_stats(date, date, text[], bigint[], bigint[], bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_phieu_de_xuat_stats(p_date_from date DEFAULT NULL::date, p_date_to date DEFAULT NULL::date, p_trang_thai text[] DEFAULT NULL::text[], p_id_noi_de_xuat bigint[] DEFAULT NULL::bigint[], p_id_nguoi_de_xuat bigint[] DEFAULT NULL::bigint[], p_id_nguoi_duyet bigint[] DEFAULT NULL::bigint[]) RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
WITH base AS (
  SELECT p.*
  FROM public.fp_mh_phieu_de_xuat_vat_tu p
  WHERE
    (p_date_from IS NULL OR p.ngay::date >= p_date_from)
    AND (p_date_to IS NULL OR p.ngay::date <= p_date_to)
    AND (p_trang_thai IS NULL OR cardinality(p_trang_thai) = 0 OR p.trang_thai = ANY (p_trang_thai))
    AND (p_id_noi_de_xuat IS NULL OR cardinality(p_id_noi_de_xuat) = 0 OR p.id_noi_de_xuat = ANY (p_id_noi_de_xuat))
    AND (p_id_nguoi_de_xuat IS NULL OR cardinality(p_id_nguoi_de_xuat) = 0 OR p.id_nguoi_de_xuat = ANY (p_id_nguoi_de_xuat))
    AND (
      p_id_nguoi_duyet IS NULL OR cardinality(p_id_nguoi_duyet) = 0
      OR (p.id_nguoi_duyet IS NOT NULL AND p.id_nguoi_duyet = ANY (p_id_nguoi_duyet))
    )
),
fullset AS (
  SELECT * FROM public.fp_mh_phieu_de_xuat_vat_tu
),
chip_status AS (
  SELECT
    CASE p.trang_thai
      WHEN 'Chờ duyệt' THEN 'Pending'
      WHEN 'Đợi duyệt' THEN 'Waiting'
      WHEN 'Đã duyệt' THEN 'Approved'
      WHEN 'Không duyệt' THEN 'Rejected'
      ELSE 'Pending'
    END AS status_key,
    count(*)::int AS cnt
  FROM fullset p
  GROUP BY 1
),
chip_noi AS (
  SELECT p.id_noi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_de_xuat AS (
  SELECT p.id_nguoi_de_xuat::text AS id, count(*)::int AS cnt FROM fullset p GROUP BY 1
),
chip_duyet AS (
  SELECT p.id_nguoi_duyet::text AS id, count(*)::int AS cnt
  FROM fullset p
  WHERE p.id_nguoi_duyet IS NOT NULL
  GROUP BY 1
)
SELECT jsonb_build_object(
  'summary', (
    SELECT jsonb_build_object(
      'total', count(*)::int,
      'pending', coalesce(sum(CASE WHEN trang_thai = 'Chờ duyệt' THEN 1 ELSE 0 END), 0)::int,
      'waiting', coalesce(sum(CASE WHEN trang_thai = 'Đợi duyệt' THEN 1 ELSE 0 END), 0)::int,
      'approved', coalesce(sum(CASE WHEN trang_thai = 'Đã duyệt' THEN 1 ELSE 0 END), 0)::int,
      'rejected', coalesce(sum(CASE WHEN trang_thai = 'Không duyệt' THEN 1 ELSE 0 END), 0)::int
    ) FROM base
  ),
  'byTrangThai', coalesce((
    SELECT jsonb_agg(jsonb_build_object('id', status_key, 'count', cnt))
    FROM (
      SELECT
        CASE trang_thai
          WHEN 'Chờ duyệt' THEN 'Pending'
          WHEN 'Đợi duyệt' THEN 'Waiting'
          WHEN 'Đã duyệt' THEN 'Approved'
          WHEN 'Không duyệt' THEN 'Rejected'
          ELSE 'Pending'
        END AS status_key,
        count(*)::int AS cnt
      FROM base
      GROUP BY 1
    ) s
  ), '[]'::jsonb),
  'byNoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(k.ten_kho, b.id_noi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = b.id_noi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDeXuat', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_de_xuat::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_de_xuat
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byNguoiDuyet', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', name, 'value', cnt) ORDER BY cnt DESC)
    FROM (
      SELECT coalesce(nv.ho_va_ten, b.id_nguoi_duyet::text) AS name, count(*)::int AS cnt
      FROM base b
      LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = b.id_nguoi_duyet
      WHERE b.id_nguoi_duyet IS NOT NULL
      GROUP BY 1
    ) x
  ), '[]'::jsonb),
  'byMonth', coalesce((
    SELECT jsonb_agg(jsonb_build_object('name', label, 'value', cnt) ORDER BY ym)
    FROM (
      SELECT to_char(b.ngay::date, 'YYYY-MM') AS ym,
             to_char(b.ngay::date, 'MM') || '/' || to_char(b.ngay::date, 'YYYY') AS label,
             count(*)::int AS cnt
      FROM base b
      WHERE b.ngay IS NOT NULL
      GROUP BY 1, 2
    ) m
  ), '[]'::jsonb),
  'chipByStatusKey', coalesce((SELECT jsonb_object_agg(status_key, cnt) FROM chip_status), '{}'::jsonb),
  'chipByNoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_noi), '{}'::jsonb),
  'chipByNguoiDeXuatId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_de_xuat), '{}'::jsonb),
  'chipByNguoiDuyetId', coalesce((SELECT jsonb_object_agg(id, cnt) FROM chip_duyet), '{}'::jsonb)
);
$$;


--
-- Name: FUNCTION rpc_phieu_de_xuat_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_phieu_de_xuat_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]) IS 'Thống kê phiếu đề xuất vật tư — tab Thống kê';


--
-- Name: rpc_phieu_in_period(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_phieu_in_period(p_filters jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
  v_date_from date := nullif(trim(p_filters->>'dateFrom'), '')::date;
  v_date_to date := nullif(trim(p_filters->>'dateTo'), '')::date;
  v_creator bigint := nullif(trim(p_filters->>'allowedCreatorUserId'), '')::bigint;
  v_scope_on boolean := (p_filters ? 'allowedBranchIds') OR v_creator IS NOT NULL;
  v_branch_ids bigint[];
  v_wh_ids bigint[];
  v_loai text[];
  v_trang_thai text[];
  v_hh_ids bigint[];
  v_cat_ids bigint[];
BEGIN
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_branch_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'allowedBranchIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_wh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'warehouseIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg(public._nxt_norm_loai(x)), ARRAY[]::text[]) INTO v_loai
  FROM jsonb_array_elements_text(coalesce(p_filters->'loaiPhieu', '[]'::jsonb)) t(x);
  SELECT coalesce(array_agg(x), ARRAY[]::text[]) INTO v_trang_thai
  FROM jsonb_array_elements_text(coalesce(p_filters->'trangThaiPhieu', '[]'::jsonb)) t(x);
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_hh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'hangHoaIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_cat_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'categoryIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';

  RETURN coalesce((
    WITH kho_branch AS (SELECT id AS kho_id, chi_nhanh_id FROM public.fp_mh_danh_sach_kho),
    phieu_scoped AS (
      SELECT pk.* FROM public.fp_mh_phieu_kho pk
      WHERE trim(coalesce(pk.trang_thai, '')) <> 'Không duyệt'
        AND pk.ngay::date >= v_date_from AND pk.ngay::date <= v_date_to
        AND (
          NOT v_scope_on OR (v_creator IS NOT NULL AND pk.nguoi_tao_id = v_creator)
          OR (cardinality(v_branch_ids) > 0 AND (
            EXISTS (SELECT 1 FROM kho_branch kb WHERE kb.kho_id = pk.kho_id AND kb.chi_nhanh_id = ANY (v_branch_ids))
            OR EXISTS (SELECT 1 FROM kho_branch kb WHERE kb.kho_id = pk.kho_den_id AND kb.chi_nhanh_id = ANY (v_branch_ids))
          ))
        )
    ),
    filtered AS (
      SELECT pk.* FROM phieu_scoped pk
      WHERE (cardinality(v_loai) = 0 OR public._nxt_norm_loai(pk.loai) = ANY (v_loai))
        AND (
          cardinality(v_wh_ids) = 0
          OR pk.kho_id = ANY (v_wh_ids)
          OR (public._nxt_norm_loai(pk.loai) = 'chuyen' AND pk.kho_den_id = ANY (v_wh_ids))
        )
        AND (
          cardinality(v_trang_thai) = 0
          OR pk.trang_thai = ANY (v_trang_thai)
        )
        AND (
          cardinality(v_hh_ids) = 0 AND cardinality(v_cat_ids) = 0
          OR EXISTS (
            SELECT 1 FROM public.fp_mh_phieu_kho_chi_tiet ct
            LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = ct.id_hang_hoa
            WHERE ct.id_phieu_kho = pk.id
              AND (cardinality(v_hh_ids) = 0 OR ct.id_hang_hoa = ANY (v_hh_ids))
              AND (cardinality(v_cat_ids) = 0 OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids)))
          )
        )
    )
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id::text,
        'so_phieu', so_phieu,
        'ngay', ngay::text,
        'loai', loai,
        'kho_id', kho_id::text,
        'ten_kho', ten_kho,
        'kho_den_id', CASE WHEN kho_den_id IS NULL THEN NULL ELSE kho_den_id::text END,
        'ten_kho_den', ten_kho_den,
        'id_nha_cung_cap', CASE WHEN id_nha_cung_cap IS NULL THEN NULL ELSE id_nha_cung_cap::text END,
        'id_khach_hang', CASE WHEN id_khach_hang IS NULL THEN NULL ELSE id_khach_hang::text END,
        'trang_thai', trang_thai,
        'nguoi_tao_id', CASE WHEN nguoi_tao_id IS NULL THEN NULL ELSE nguoi_tao_id::text END,
        'ten_nguoi_tao', ten_nguoi_tao
      )
      ORDER BY ngay DESC, so_phieu DESC
    )
    FROM filtered
  ), '[]'::jsonb);
END;
$_$;


--
-- Name: rpc_set_mat_khau(bigint, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_set_mat_khau(p_nhan_vien_id bigint, p_mat_khau text, p_phai_doi boolean DEFAULT false) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_hash    TEXT;
  v_toi     BIGINT := public.nhan_vien_hien_tai_id();
  v_tu_doi  BOOLEAN;
BEGIN
  IF length(coalesce(p_mat_khau, '')) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải có tối thiểu 6 ký tự.';
  END IF;

  PERFORM 1 FROM public.fp_var_nhan_vien WHERE id = p_nhan_vien_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy nhân viên id = %.', p_nhan_vien_id;
  END IF;

  IF v_toi IS NULL THEN
    RAISE EXCEPTION 'Phiên đăng nhập không xác định được nhân viên (token thiếu claim nv và email). Hãy đăng xuất rồi đăng nhập lại.';
  END IF;

  v_tu_doi := (v_toi = p_nhan_vien_id);

  IF NOT v_tu_doi AND NOT public.co_quyen_quan_tri_mat_khau() THEN
    RAISE EXCEPTION 'Không có quyền đặt mật khẩu cho nhân viên này.';
  END IF;

  v_hash := extensions.crypt(p_mat_khau, extensions.gen_salt('bf', 10));

  UPDATE public.fp_var_nhan_vien
  SET mat_khau_hash         = v_hash,
      mat_khau_cap_nhat_luc = now(),
      phai_doi_mat_khau     = p_phai_doi
  WHERE id = p_nhan_vien_id;

  IF NOT v_tu_doi AND to_regclass('public.fp_var_phien_dang_nhap') IS NOT NULL THEN
    UPDATE public.fp_var_phien_dang_nhap
    SET thu_hoi_luc = now()
    WHERE nhan_vien_id = p_nhan_vien_id AND thu_hoi_luc IS NULL;
  END IF;
END $$;


--
-- Name: rpc_sinh_nhat_nhan_vien(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_sinh_nhat_nhan_vien() RETURNS TABLE(id bigint, ho_va_ten text, hinh_anh text, ngay integer, thang integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nv.id,
         nv.ho_va_ten,
         nv.hinh_anh,
         EXTRACT(DAY FROM nv.ngay_sinh)::INT,
         EXTRACT(MONTH FROM nv.ngay_sinh)::INT
    FROM public.fp_var_nhan_vien nv
   WHERE nv.ngay_sinh IS NOT NULL
     AND nv.trang_thai = 'Đang làm việc'
   ORDER BY 5, 4, nv.ho_va_ten;
$$;


--
-- Name: FUNCTION rpc_sinh_nhat_nhan_vien(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_sinh_nhat_nhan_vien() IS 'Ngày/tháng sinh (không năm) của nhân viên đang làm việc — panel lịch trên header.';


--
-- Name: rpc_tb_chi_nhanh_phieu(text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_tb_chi_nhanh_phieu(p_bang text, p_ban_ghi_id bigint) RETURNS bigint
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_chi_nhanh bigint;
BEGIN
  CASE p_bang
    WHEN 'fp_mh_phieu_kho' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_phieu_kho p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.kho_id
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_farm_phieu_kho_phan_thuoc' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_farm_phieu_kho_phan_thuoc p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.kho_id
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_mh_phieu_de_xuat_vat_tu' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_phieu_de_xuat_vat_tu p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_noi_de_xuat
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_farm_de_xuat_mua_hang' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_farm_de_xuat_mua_hang p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_noi_de_xuat
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_mh_don_dat_hang' THEN
      SELECT k.chi_nhanh_id::bigint INTO v_chi_nhanh
        FROM public.fp_mh_don_dat_hang p
        JOIN public.fp_mh_danh_sach_kho k ON k.id = p.id_kho_nhan
       WHERE p.id = p_ban_ghi_id;

    WHEN 'fp_tc_quy_thu_chi' THEN
      -- Quỹ tiền mặt gắn thẳng vào chi nhánh (không qua kho).
      SELECT p.id_chi_nhanh::bigint INTO v_chi_nhanh
        FROM public.fp_tc_quy_thu_chi p
       WHERE p.id = p_ban_ghi_id;

    ELSE
      -- fp_hc_cong_viec, fp_hr_phieu_hanh_chinh: không gắn với kho nào.
      v_chi_nhanh := NULL;
  END CASE;

  RETURN v_chi_nhanh;
END;
$$;


--
-- Name: FUNCTION rpc_tb_chi_nhanh_phieu(p_bang text, p_ban_ghi_id bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_tb_chi_nhanh_phieu(p_bang text, p_ban_ghi_id bigint) IS 'Chi nhánh của một phiếu (quỹ lấy thẳng id_chi_nhanh, còn lại suy qua kho). NULL = không giới hạn phạm vi người nhận.';


--
-- Name: rpc_tb_nguoi_duyet(text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_tb_nguoi_duyet(p_module_id text, p_chi_nhanh_id bigint DEFAULT NULL::bigint) RETURNS TABLE(nhan_vien_id bigint, cap_bac integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.chi_nhanh_ids,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  ),
  q AS (
    SELECT nv.*,
           EXISTS (
             SELECT 1 FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['approve', 'admin', 'all']
           ) AS co_quyen_duyet,
           EXISTS (
             SELECT 1 FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['admin', 'all']
           ) AS co_quyen_quan_tri
      FROM nv
  )
  SELECT q.id, COALESCE(q.cap_bac, 99)::integer
    FROM q
   WHERE COALESCE(q.trang_thai, '') <> 'Nghỉ việc'
     -- Ai được vào danh sách: giữ nguyên như trước.
     AND (q.cap_bac = 1 OR q.co_quyen_duyet)
     -- Giới hạn chi nhánh: thêm ngoại lệ cho nhóm quản trị.
     AND (
           p_chi_nhanh_id IS NULL
        OR q.cap_bac = 1
        OR q.co_quyen_quan_tri
        OR p_chi_nhanh_id::text = ANY (COALESCE(q.chi_nhanh_ids, '{}'::text[]))
         );
$$;


--
-- Name: FUNCTION rpc_tb_nguoi_duyet(p_module_id text, p_chi_nhanh_id bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_tb_nguoi_duyet(p_module_id text, p_chi_nhanh_id bigint) IS 'Danh sách nhân viên được duyệt một module, giới hạn theo chi nhánh. Cấp bậc 1 và người có quyền quản trị (admin/all) luôn có mặt, không bị giới hạn chi nhánh — khớp cổng viewAll của app.';


--
-- Name: rpc_tb_nguoi_duyet_phong_ban(text, bigint); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(p_module_id text, p_nguoi_tao_id bigint) RETURNS TABLE(nhan_vien_id bigint, cap_bac integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  -- Cấp bậc đọc qua fp_var_cap_bac như rpc_tb_nguoi_duyet: ưu tiên cột
  -- denormalized fp_var_nhan_vien.cap_bac, lui về cap_bac_id khi cột đó trống.
  WITH nv AS (
    SELECT e.id,
           e.trang_thai,
           e.chuc_vu_id,
           e.phong_ban_id,
           COALESCE(e.cap_bac, cb.cap_bac) AS cap_bac
      FROM public.fp_var_nhan_vien e
      LEFT JOIN public.fp_var_cap_bac cb ON cb.id = e.cap_bac_id
  ),
  pb AS (
    SELECT nv.phong_ban_id FROM nv WHERE nv.id = p_nguoi_tao_id
  )
  SELECT nv.id, COALESCE(nv.cap_bac, 99)::integer
    FROM nv
   WHERE COALESCE(nv.trang_thai, '') <> 'Nghỉ việc'
     AND (
           nv.cap_bac = 1
        OR EXISTS (
             SELECT 1
               FROM public.fp_var_phan_quyen pq
              WHERE pq.chuc_vu_id = nv.chuc_vu_id
                AND pq.module_id  = p_module_id
                AND pq.actions && ARRAY['admin', 'all']
           )
        OR (
             nv.cap_bac IN (2, 3)
         AND nv.phong_ban_id IS NOT NULL
         AND nv.phong_ban_id = (SELECT phong_ban_id FROM pb)
           )
         );
$$;


--
-- Name: FUNCTION rpc_tb_nguoi_duyet_phong_ban(p_module_id text, p_nguoi_tao_id bigint); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(p_module_id text, p_nguoi_tao_id bigint) IS 'Người duyệt phiếu hành chính: quản lý phòng ban của NGƯỜI TẠO (cấp bậc 2-3) + quản trị module (admin/all) + cấp bậc 1. Hàm RIÊNG, không thay rpc_tb_nguoi_duyet.';


--
-- Name: rpc_tb_ten_loai_phieu_hanh_chinh(bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_tb_ten_loai_phieu_hanh_chinh(p_ids bigint[]) RETURNS TABLE(id bigint, loai_phieu text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT n.id, NULLIF(btrim(n.loai_phieu), '')
    FROM public.fp_hr_nhom_phieu_hanh_chinh n
   WHERE n.id = ANY (p_ids);
$$;


--
-- Name: FUNCTION rpc_tb_ten_loai_phieu_hanh_chinh(p_ids bigint[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_tb_ten_loai_phieu_hanh_chinh(p_ids bigint[]) IS 'Tên loại phiếu hành chính (fp_hr_nhom_phieu_hanh_chinh.loai_phieu) cho nội dung thông báo.';


--
-- Name: rpc_tb_ten_nhan_vien(bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_tb_ten_nhan_vien(p_ids bigint[]) RETURNS TABLE(id bigint, ho_va_ten text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nv.id, COALESCE(NULLIF(btrim(nv.ho_va_ten), ''), nv.email, 'NV' || nv.id::text)
    FROM public.fp_var_nhan_vien nv
   WHERE nv.id = ANY (p_ids);
$$;


--
-- Name: FUNCTION rpc_tb_ten_nhan_vien(p_ids bigint[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_tb_ten_nhan_vien(p_ids bigint[]) IS 'Tên hiển thị của nhân viên cho nội dung thông báo, lui về email rồi mã NV khi thiếu họ tên.';


--
-- Name: rpc_tc_quy_thu_chi_stats(date, date, bigint[], text, bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_tc_quy_thu_chi_stats(p_tu_ngay date DEFAULT NULL::date, p_den_ngay date DEFAULT NULL::date, p_chi_nhanh_ids bigint[] DEFAULT NULL::bigint[], p_loai text DEFAULT NULL::text, p_hang_muc_ids bigint[] DEFAULT NULL::bigint[]) RETURNS jsonb
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
WITH scope AS (
  -- Toàn bộ sổ trong phạm vi chi nhánh (chưa cắt theo kỳ) — dùng cho tồn đầu kỳ
  SELECT p.*
  FROM public.fp_tc_quy_thu_chi p
  WHERE (p_chi_nhanh_ids IS NULL OR p.id_chi_nhanh = ANY (p_chi_nhanh_ids))
),
base AS (
  SELECT s.*
  FROM scope s
  WHERE
    (p_tu_ngay IS NULL OR s.ngay >= p_tu_ngay)
    AND (p_den_ngay IS NULL OR s.ngay <= p_den_ngay)
    AND (p_loai IS NULL OR s.loai = p_loai)
    AND (p_hang_muc_ids IS NULL OR cardinality(p_hang_muc_ids) = 0 OR s.id_hang_muc = ANY (p_hang_muc_ids))
),
dau_ky AS (
  -- Tồn đầu kỳ: toàn bộ phát sinh TRƯỚC p_tu_ngay, không áp filter loại/hạng mục
  SELECT COALESCE(SUM(CASE WHEN s.loai = 'thu' THEN s.so_tien ELSE -s.so_tien END), 0)::numeric AS ton
  FROM scope s
  WHERE p_tu_ngay IS NOT NULL AND s.ngay < p_tu_ngay
),
tong AS (
  SELECT
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS tong_thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS tong_chi,
    COUNT(*)::int AS so_phieu
  FROM base b
),
theo_hang_muc AS (
  SELECT
    b.id_hang_muc::text AS id,
    COALESCE(hm.ten, b.ten_hang_muc, '—') AS ten,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi,
    COUNT(*)::int AS so_phieu
  FROM base b
  LEFT JOIN public.fp_tc_hang_muc_thu_chi hm ON hm.id = b.id_hang_muc
  GROUP BY 1, 2
),
theo_thang AS (
  SELECT
    to_char(date_trunc('month', b.ngay), 'YYYY-MM') AS thang,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi
  FROM base b
  GROUP BY 1
),
theo_chi_nhanh AS (
  SELECT
    b.id_chi_nhanh::text AS id,
    COALESCE(cn.ten_chi_nhanh, b.ten_chi_nhanh, '—') AS ten,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi,
    COUNT(*)::int AS so_phieu
  FROM base b
  LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = b.id_chi_nhanh
  GROUP BY 1, 2
),
theo_nguon AS (
  SELECT
    COALESCE(b.loai_chung_tu, 'khong_lien_ket') AS nguon,
    COALESCE(SUM(CASE WHEN b.loai = 'thu' THEN b.so_tien ELSE 0 END), 0)::numeric AS thu,
    COALESCE(SUM(CASE WHEN b.loai = 'chi' THEN b.so_tien ELSE 0 END), 0)::numeric AS chi,
    COUNT(*)::int AS so_phieu
  FROM base b
  GROUP BY 1
)
SELECT jsonb_build_object(
  'ton_dau_ky', (SELECT ton FROM dau_ky),
  'tong_thu', (SELECT tong_thu FROM tong),
  'tong_chi', (SELECT tong_chi FROM tong),
  'ton_cuoi_ky', (SELECT ton FROM dau_ky) + (SELECT tong_thu FROM tong) - (SELECT tong_chi FROM tong),
  'so_phieu', (SELECT so_phieu FROM tong),
  'theo_hang_muc', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.chi DESC, t.thu DESC) FROM theo_hang_muc t), '[]'::jsonb),
  'theo_thang', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.thang) FROM theo_thang t), '[]'::jsonb),
  'theo_chi_nhanh', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.ten) FROM theo_chi_nhanh t), '[]'::jsonb),
  'theo_nguon_chung_tu', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.nguon) FROM theo_nguon t), '[]'::jsonb)
);
$$;


--
-- Name: FUNCTION rpc_tc_quy_thu_chi_stats(p_tu_ngay date, p_den_ngay date, p_chi_nhanh_ids bigint[], p_loai text, p_hang_muc_ids bigint[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_tc_quy_thu_chi_stats(p_tu_ngay date, p_den_ngay date, p_chi_nhanh_ids bigint[], p_loai text, p_hang_muc_ids bigint[]) IS 'Thống kê quỹ thu chi theo kỳ + chi nhánh: tồn đầu/cuối kỳ, tổng thu chi, gộp theo hạng mục / tháng / chi nhánh / nguồn chứng từ';


--
-- Name: rpc_thong_bao_doc_tat_ca(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_thong_bao_doc_tat_ca(p_module_id text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_toi     bigint := public.nhan_vien_hien_tai_id();
  v_so_dong integer;
BEGIN
  IF v_toi IS NULL THEN
    RAISE EXCEPTION 'Không xác định được nhân viên của phiên hiện tại';
  END IF;

  UPDATE public.fp_var_thong_bao
     SET da_doc = true
   WHERE nguoi_nhan_id = v_toi
     AND da_doc = false
     AND da_xoa = false
     AND (p_module_id IS NULL OR module_id = p_module_id);

  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;


--
-- Name: FUNCTION rpc_thong_bao_doc_tat_ca(p_module_id text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_thong_bao_doc_tat_ca(p_module_id text) IS 'Đánh dấu đã đọc mọi thông báo chưa đọc của phiên hiện tại. p_module_id NULL = tất cả module.';


--
-- Name: rpc_thong_bao_xoa_tat_ca(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_thong_bao_xoa_tat_ca(p_module_id text DEFAULT NULL::text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_toi     bigint := public.nhan_vien_hien_tai_id();
  v_so_dong integer;
BEGIN
  IF v_toi IS NULL THEN
    RAISE EXCEPTION 'Không xác định được nhân viên của phiên hiện tại';
  END IF;

  UPDATE public.fp_var_thong_bao
     SET da_xoa = true
   WHERE nguoi_nhan_id = v_toi
     AND da_xoa = false
     AND (p_module_id IS NULL OR module_id = p_module_id);

  GET DIAGNOSTICS v_so_dong = ROW_COUNT;
  RETURN v_so_dong;
END;
$$;


--
-- Name: FUNCTION rpc_thong_bao_xoa_tat_ca(p_module_id text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_thong_bao_xoa_tat_ca(p_module_id text) IS 'Xoá mềm mọi thông báo của phiên hiện tại. p_module_id NULL = tất cả module. Dữ liệu vẫn còn trong bảng để đối chiếu.';


--
-- Name: rpc_thu_hoi_phien(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_thu_hoi_phien(p_refresh_hash text) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.fp_var_phien_dang_nhap
  SET thu_hoi_luc = now()
  WHERE refresh_hash = coalesce(p_refresh_hash, '')
    AND thu_hoi_luc IS NULL;
$$;


--
-- Name: rpc_ton_at_date(jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_ton_at_date(p_filters jsonb) RETURNS jsonb
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
  v_scope_on boolean := (p_filters ? 'allowedBranchIds');
  v_branch_ids bigint[];
  v_wh_ids bigint[];
  v_hh_ids bigint[];
  v_cat_ids bigint[];
BEGIN
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_branch_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'allowedBranchIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_wh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'warehouseIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_hh_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'hangHoaIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';
  SELECT coalesce(array_agg((x)::bigint), ARRAY[]::bigint[]) INTO v_cat_ids
  FROM jsonb_array_elements_text(coalesce(p_filters->'categoryIds', '[]'::jsonb)) t(x) WHERE trim(x) ~ '^\d+$';

  RETURN coalesce((
    SELECT jsonb_agg(
      jsonb_build_object(
        'id_kho', t.kho_id::text,
        'ma_kho', coalesce(k.ma_kho, t.kho_id::text),
        'ten_kho', coalesce(k.ten_kho, t.kho_id::text),
        'id_hang_hoa', t.id_hang_hoa::text,
        'ma_hang', coalesce(hh.ma_hang_hoa, t.id_hang_hoa::text),
        'ten_hang', coalesce(hh.ten_hang_hoa, '—'),
        'ten_danh_muc', dm.ten_danh_muc,
        'don_vi_tinh', coalesce(hh.dvt, '—'),
        'so_luong', t.so_luong
      )
      ORDER BY k.ten_kho, hh.ma_hang_hoa
    )
    FROM public.fp_mh_ton_kho t
    LEFT JOIN public.fp_mh_danh_sach_kho k ON k.id = t.kho_id
    LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = t.id_hang_hoa
    LEFT JOIN public.fp_mh_danh_muc_hang_hoa dm ON dm.id = hh.danh_muc_id
    WHERE t.so_luong <> 0
      AND (cardinality(v_wh_ids) = 0 OR t.kho_id = ANY (v_wh_ids))
      AND (cardinality(v_hh_ids) = 0 OR t.id_hang_hoa = ANY (v_hh_ids))
      AND (cardinality(v_cat_ids) = 0 OR (hh.danh_muc_id IS NOT NULL AND hh.danh_muc_id = ANY (v_cat_ids)))
      AND (
        NOT v_scope_on OR cardinality(v_branch_ids) = 0
        OR EXISTS (
          SELECT 1 FROM public.fp_mh_danh_sach_kho kb
          WHERE kb.id = t.kho_id AND kb.chi_nhanh_id = ANY (v_branch_ids)
        )
      )
  ), '[]'::jsonb);
END;
$_$;


--
-- Name: rpc_ton_kho_matrix(bigint[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_ton_kho_matrix(p_kho_ids bigint[] DEFAULT NULL::bigint[]) RETURNS jsonb
    LANGUAGE sql STABLE
    SET search_path TO 'public'
    AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'kho_id', t.kho_id,
        'id_hang_hoa', t.id_hang_hoa,
        'so_luong', t.so_luong
      )
      ORDER BY t.kho_id, t.id_hang_hoa
    ),
    '[]'::jsonb
  )
  FROM fp_mh_ton_kho t
  WHERE p_kho_ids IS NULL
     OR (cardinality(p_kho_ids) > 0 AND t.kho_id = ANY(p_kho_ids));
$$;


--
-- Name: FUNCTION rpc_ton_kho_matrix(p_kho_ids bigint[]); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.rpc_ton_kho_matrix(p_kho_ids bigint[]) IS 'Ma trận tồn kho (JSON array). NULL = tất cả kho; mảng rỗng = không có dòng.';


--
-- Name: rpc_verify_mat_khau(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rpc_verify_mat_khau(p_email text, p_mat_khau text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_row public.fp_var_nhan_vien;
BEGIN
  SELECT * INTO v_row
  FROM public.fp_var_nhan_vien
  WHERE email = LOWER(TRIM(coalesce(p_email, '')));

  -- Trả về cùng một kết quả cho "email không tồn tại" và "sai mật khẩu"
  -- để không tiết lộ email nào có trong hệ thống.
  IF v_row.id IS NULL
     OR v_row.mat_khau_hash IS NULL
     OR extensions.crypt(coalesce(p_mat_khau, ''), v_row.mat_khau_hash) IS DISTINCT FROM v_row.mat_khau_hash THEN
    RETURN jsonb_build_object('ok', FALSE);
  END IF;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'id', v_row.id,
    'email', v_row.email,
    'trang_thai', v_row.trang_thai,
    'phai_doi_mat_khau', v_row.phai_doi_mat_khau
  );
END $$;


--
-- Name: tao_phien_dang_nhap(bigint, text, text, text, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.tao_phien_dang_nhap(p_nhan_vien_id bigint, p_email text, p_user_agent text, p_ip text, p_so_ngay integer DEFAULT 30) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public', 'extensions'
    AS $$
DECLARE
  v_token TEXT := encode(extensions.gen_random_bytes(32), 'hex');
  v_het   TIMESTAMPTZ := now() + make_interval(days => p_so_ngay);
BEGIN
  INSERT INTO public.fp_var_phien_dang_nhap
    (nhan_vien_id, email, refresh_hash, het_han_luc, user_agent, ip)
  VALUES (
    p_nhan_vien_id,
    p_email,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    v_het,
    left(coalesce(p_user_agent, ''), 300),
    left(coalesce(p_ip, ''), 100)
  );

  RETURN jsonb_build_object('refresh_token', v_token, 'refresh_het_han', v_het);
END $$;


--
-- Name: thu_hoi_phien_khi_nghi_viec(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.thu_hoi_phien_khi_nghi_viec() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF NEW.trang_thai = 'Nghỉ việc' AND coalesce(OLD.trang_thai, '') <> 'Nghỉ việc' THEN
    UPDATE public.fp_var_phien_dang_nhap
    SET thu_hoi_luc = now()
    WHERE nhan_vien_id = NEW.id AND thu_hoi_luc IS NULL;
  END IF;
  RETURN NEW;
END $$;


--
-- Name: update_tg_cap_nhat_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_tg_cap_nhat_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.tg_cap_nhat = now();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: fp_farm_bao_cao_nhan_cong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_nhan_cong (
    id bigint NOT NULL,
    ngay date NOT NULL,
    id_chi_nhanh bigint,
    ten_chi_nhanh text,
    ghi_chu text,
    id_nguoi_tao bigint,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    trang_thai text DEFAULT 'mo'::text NOT NULL,
    hinh_anh_urls jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT fp_farm_bcnc_trang_thai_chk CHECK ((trang_thai = ANY (ARRAY['mo'::text, 'khoa'::text])))
);


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_nhan_cong IS 'Báo cáo nhân công theo ngày / chi nhánh';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong.ngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.ngay IS 'Ngày báo cáo';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong.ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.ten_chi_nhanh IS 'Denormalize tên chi nhánh để list không cần join';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.ghi_chu IS 'Ghi chú phiếu; cho phép nhiều dòng (text)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.trang_thai IS 'mo = đang mở; khoa = đã khóa';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong.hinh_anh_urls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong.hinh_anh_urls IS 'Mảng URL ảnh (https), upload Cloudinary; thứ tự = thứ tự hiển thị';


--
-- Name: fp_farm_bao_cao_nhan_cong_ct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_nhan_cong_ct (
    id bigint NOT NULL,
    id_bao_cao bigint NOT NULL,
    loai_chuyen text NOT NULL,
    sl_cong_ngay numeric(18,4) DEFAULT 0 NOT NULL,
    sl_cong_nua numeric(18,4) DEFAULT 0 NOT NULL,
    sl_tang_ca numeric(18,4) DEFAULT 0 NOT NULL,
    so_gio_tc numeric(18,4) DEFAULT 0 NOT NULL,
    ghi_chu text,
    thu_tu integer DEFAULT 0 NOT NULL,
    CONSTRAINT fp_farm_bcnc_ct_loai_chk CHECK ((loai_chuyen = ANY (ARRAY['XAN_NAI'::text, 'TIA_DANH_GIA'::text, 'CAN_TEM_DONG_THUNG'::text, 'KHO_HUT_CHAN_KHONG'::text, 'CONG_TANG_CUONG'::text, 'CONG_DINH_BIEN_KHONG_SAN_XUAT'::text])))
);


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong_ct; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_nhan_cong_ct IS 'Chi tiết nhân công theo từng chuyền';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct.loai_chuyen; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct.loai_chuyen IS 'Mã chuyền cố định (6 loại)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct.sl_cong_ngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct.sl_cong_ngay IS 'SL công ngày';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct.sl_cong_nua; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct.sl_cong_nua IS 'SL công nửa';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct.sl_tang_ca; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct.sl_tang_ca IS 'SL tăng ca';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct.so_gio_tc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct.so_gio_tc IS 'Số giờ tăng ca';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct.ghi_chu IS 'Ghi chú dòng chuyền; cho phép nhiều dòng (text)';


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_nhan_cong_ct_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_nhan_cong_ct_sub (
    id bigint NOT NULL,
    id_bcnc_ct bigint NOT NULL,
    loai_chi_tieu text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    sl_cong numeric(18,4) DEFAULT 0 NOT NULL,
    so_gio numeric(18,4) DEFAULT 0 NOT NULL,
    ghi_chu text,
    CONSTRAINT fp_farm_bcnc_ct_sub_gio_nonneg CHECK ((so_gio >= (0)::numeric)),
    CONSTRAINT fp_farm_bcnc_ct_sub_loai_chk CHECK ((loai_chi_tieu = ANY (ARRAY['CN_NGAY'::text, 'CN_NUA'::text, 'TANG_CA'::text]))),
    CONSTRAINT fp_farm_bcnc_ct_sub_sl_nonneg CHECK ((sl_cong >= (0)::numeric))
);


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong_ct_sub; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_nhan_cong_ct_sub IS 'Chi tiết nhân công theo từng ô (CN ngày, CN nửa, tăng ca) trên một dòng chuyền';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct_sub.id_bcnc_ct; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct_sub.id_bcnc_ct IS 'FK tới dòng chuyền fp_farm_bao_cao_nhan_cong_ct';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct_sub.loai_chi_tieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct_sub.loai_chi_tieu IS 'CN_NGAY | CN_NUA | TANG_CA — đồng bộ cột tổng trên bảng ct';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct_sub.sl_cong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct_sub.sl_cong IS 'Số công nhân / SL (vd. 8, 7)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_ct_sub.so_gio; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_ct_sub.so_gio IS 'Số giờ (vd. 8, 7); giờ công = SUM(sl_cong * so_gio)';


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct_sub ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_nhan_cong_ct_sub_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_bao_cao_nhan_cong_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_nhan_cong_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_nhan_cong_kpi (
    id bigint NOT NULL,
    id_bao_cao bigint NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ten_hang_muc text NOT NULL,
    don_vi_tinh text,
    muc_tieu text,
    thuc_te text,
    phan_tram numeric(18,4),
    danh_gia text,
    tien_thuong numeric(18,2) DEFAULT 0 NOT NULL,
    ghi_chu text
);


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong_kpi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_nhan_cong_kpi IS 'Đánh giá KPI / thưởng theo phiếu báo cáo nhân công';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.id_bao_cao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.id_bao_cao IS 'Phiếu báo cáo nhân công';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.thu_tu IS 'Thứ tự hiển thị (STT)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.ten_hang_muc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.ten_hang_muc IS 'Hạng mục KPI';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.don_vi_tinh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.don_vi_tinh IS 'Đơn vị tính (Thùng, %, …)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.muc_tieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.muc_tieu IS 'Mục tiêu (hiển thị / nhập dạng text nếu là khoảng, vd 4 đến 5)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.thuc_te IS 'Thực tế';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.phan_tram; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.phan_tram IS 'Phần trăm dạng số 0–100 (85 = 85%); NULL nếu không áp dụng';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.danh_gia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.danh_gia IS 'Đánh giá (Đạt, Tốt, …)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.tien_thuong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.tien_thuong IS 'Tiền thưởng (+) hoặc trừ (-)';


--
-- Name: COLUMN fp_farm_bao_cao_nhan_cong_kpi.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_kpi.ghi_chu IS 'Ghi chú / quy tắc';


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_kpi ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_nhan_cong_kpi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_bao_cao_so_che; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_so_che (
    id bigint NOT NULL,
    ngay date NOT NULL,
    id_chi_nhanh bigint NOT NULL,
    ten_chi_nhanh text,
    ghi_chu text,
    id_nguoi_tao bigint,
    trang_thai text DEFAULT 'mo'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    tong_luong numeric(18,4) DEFAULT 0 NOT NULL,
    CONSTRAINT fp_farm_bao_cao_so_che_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['mo'::text, 'khoa'::text])))
);


--
-- Name: TABLE fp_farm_bao_cao_so_che; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_so_che IS 'Báo cáo sơ chế theo ngày / chi nhánh (phần header)';


--
-- Name: COLUMN fp_farm_bao_cao_so_che.ngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che.ngay IS 'Ngày báo cáo';


--
-- Name: COLUMN fp_farm_bao_cao_so_che.ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che.ten_chi_nhanh IS 'Denormalize tên chi nhánh để list không cần join';


--
-- Name: COLUMN fp_farm_bao_cao_so_che.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che.ghi_chu IS 'Ghi chú phiếu';


--
-- Name: COLUMN fp_farm_bao_cao_so_che.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che.trang_thai IS 'mo = đang mở; khoa = đã khóa';


--
-- Name: COLUMN fp_farm_bao_cao_so_che.tong_luong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che.tong_luong IS 'Tổng lương nhập tay cho section Năng suất và lương';


--
-- Name: fp_farm_bao_cao_so_che_ct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_so_che_ct (
    id bigint NOT NULL,
    id_bao_cao bigint NOT NULL,
    ma_chi_tieu text NOT NULL,
    gia_tri numeric(18,4) DEFAULT 0 NOT NULL,
    don_vi_tinh text DEFAULT 'Buồng'::text NOT NULL,
    ghi_chu text,
    thu_tu integer DEFAULT 0 NOT NULL,
    CONSTRAINT fp_farm_bcsc_ct_ma_chi_tieu_chk CHECK ((ma_chi_tieu = ANY (ARRAY['sl_buong_ton_dau_ngay'::text, 'tong_buong_thu_hoach'::text, 'tong_buong_khong_so_che'::text, 'tong_buong_so_che'::text, 'sl_buong_ton_cuoi_ngay'::text, 'danh_gia_loi_qc_pct'::text])))
);


--
-- Name: TABLE fp_farm_bao_cao_so_che_ct; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_so_che_ct IS 'Chi tiết sơ chế: mỗi dòng một chỉ tiêu (mô hình giống fp_farm_bao_cao_nhan_cong_ct — nhiều dòng / phiếu)';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_ct.ma_chi_tieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_ct.ma_chi_tieu IS 'Mã chỉ tiêu cố định (6 loại)';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_ct.gia_tri; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_ct.gia_tri IS 'Giá trị số của chỉ tiêu';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_ct.don_vi_tinh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_ct.don_vi_tinh IS 'ĐVT theo dòng (vd. Buồng, Thùng)';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_ct.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_ct.ghi_chu IS 'Ghi chú theo dòng chỉ tiêu';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_ct.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_ct.thu_tu IS 'Thứ tự hiển thị (1..6)';


--
-- Name: fp_farm_bao_cao_so_che_ct_id_seq1; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che_ct ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_so_che_ct_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_bao_cao_so_che_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_so_che_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_bao_cao_so_che_kpi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_so_che_kpi (
    id bigint NOT NULL,
    id_bao_cao bigint NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ten_hang_muc text NOT NULL,
    don_vi_tinh text,
    muc_tieu text,
    thuc_te text,
    phan_tram numeric(18,4),
    danh_gia text,
    tien_thuong numeric(18,2) DEFAULT 0 NOT NULL,
    ghi_chu text
);


--
-- Name: TABLE fp_farm_bao_cao_so_che_kpi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_so_che_kpi IS 'Đánh giá KPI / thưởng theo phiếu báo cáo sơ chế';


--
-- Name: fp_farm_bao_cao_so_che_kpi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che_kpi ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_so_che_kpi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_bao_cao_so_che_pham_cap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_bao_cao_so_che_pham_cap (
    id bigint NOT NULL,
    id_bao_cao bigint NOT NULL,
    so_tham_chieu numeric(18,4) DEFAULT 0 NOT NULL,
    so_thung numeric(18,4) DEFAULT 0 NOT NULL,
    so_thung_quy_doi numeric(18,4) DEFAULT 0 NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ten_pham_cap text NOT NULL,
    ghi_chu text
);


--
-- Name: TABLE fp_farm_bao_cao_so_che_pham_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_bao_cao_so_che_pham_cap IS 'Phẩm cấp / loại thùng: nhiều dòng / phiếu; tên loại do người dùng nhập.';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_pham_cap.so_tham_chieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.so_tham_chieu IS 'Kg mỗi thùng (số kg/thùng). Tổng kg = so_thung × so_tham_chieu — tính trên app.';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_pham_cap.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.thu_tu IS 'Thứ tự hiển thị trong phiếu';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_pham_cap.ten_pham_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.ten_pham_cap IS 'Tên loại phẩm cấp (tự do)';


--
-- Name: COLUMN fp_farm_bao_cao_so_che_pham_cap.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_pham_cap.ghi_chu IS 'Ghi chú theo dòng phẩm cấp / loại thùng';


--
-- Name: fp_farm_bao_cao_so_che_pham_cap_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_bao_cao_so_che_pham_cap_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_danh_muc_hang_hoa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_danh_muc_hang_hoa (
    id bigint NOT NULL,
    ma_danh_muc text,
    ten_danh_muc text,
    danh_muc_cha_id bigint,
    thu_tu smallint,
    mo_ta text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_farm_danh_muc_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_danh_muc_hang_hoa IS 'Danh mục hàng hóa farm (phân thuốc) – 2 cấp, danh_muc_cha_id null = cấp 1';


--
-- Name: COLUMN fp_farm_danh_muc_hang_hoa.danh_muc_cha_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_danh_muc_hang_hoa.danh_muc_cha_id IS 'Danh mục cha (null = cấp gốc)';


--
-- Name: fp_farm_danh_muc_hang_hoa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_danh_muc_hang_hoa ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_danh_muc_hang_hoa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_danh_sach_hang_hoa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_danh_sach_hang_hoa (
    id bigint NOT NULL,
    danh_muc_id bigint,
    danh_muc_cha_id bigint,
    ma_hang_hoa text,
    ten_hang_hoa text,
    dvt text,
    don_gia numeric,
    mo_ta text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    pham_cap text
);


--
-- Name: TABLE fp_farm_danh_sach_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_danh_sach_hang_hoa IS 'Danh sách hàng hóa farm – danh_muc_id = cấp 2, danh_muc_cha_id = cấp 1';


--
-- Name: COLUMN fp_farm_danh_sach_hang_hoa.danh_muc_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_danh_sach_hang_hoa.danh_muc_id IS 'Danh mục cấp 2 (fp_farm_danh_muc_hang_hoa, có danh_muc_cha_id)';


--
-- Name: COLUMN fp_farm_danh_sach_hang_hoa.danh_muc_cha_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_danh_sach_hang_hoa.danh_muc_cha_id IS 'Danh mục cấp 1 (cha của danh_muc_id)';


--
-- Name: COLUMN fp_farm_danh_sach_hang_hoa.dvt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_danh_sach_hang_hoa.dvt IS 'Đơn vị tính: Kg, Lít, Bao, ...';


--
-- Name: COLUMN fp_farm_danh_sach_hang_hoa.pham_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_danh_sach_hang_hoa.pham_cap IS 'Phẩm cấp (tùy chọn). Text tự do; app gợi ý từ các giá trị đã có.';


--
-- Name: fp_farm_danh_sach_hang_hoa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_danh_sach_hang_hoa ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_danh_sach_hang_hoa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_de_xuat_mua_hang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_de_xuat_mua_hang (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    ngay_can date NOT NULL,
    id_noi_de_xuat bigint NOT NULL,
    id_nguoi_de_xuat bigint NOT NULL,
    id_nguoi_duyet bigint,
    ghi_chu text,
    trang_thai text DEFAULT 'Chờ duyệt'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_farm_de_xuat_mua_hang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_de_xuat_mua_hang IS 'Đề xuất mua hàng (phân thuốc, vật tư farm)';


--
-- Name: COLUMN fp_farm_de_xuat_mua_hang.id_noi_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_de_xuat_mua_hang.id_noi_de_xuat IS 'Nơi đề xuất → fp_mh_danh_sach_kho(id)';


--
-- Name: COLUMN fp_farm_de_xuat_mua_hang.id_nguoi_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_de_xuat_mua_hang.id_nguoi_de_xuat IS 'Người đề xuất → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_farm_de_xuat_mua_hang.id_nguoi_duyet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_de_xuat_mua_hang.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_farm_de_xuat_mua_hang.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_de_xuat_mua_hang.trang_thai IS 'Chờ duyệt / Đợi duyệt / Đã duyệt / Không duyệt';


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_de_xuat_mua_hang_chi_tiet (
    id bigint NOT NULL,
    id_de_xuat_mua_hang bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong numeric(18,4) NOT NULL,
    don_vi_tinh text,
    thong_so text,
    ghi_chu text,
    id_tien_do_mh bigint,
    ten_tien_do_mh text,
    trao_doi text,
    so_phieu text,
    ngay date,
    ngay_can date,
    ten_noi_de_xuat text,
    ten_nguoi_de_xuat text,
    ten_nguoi_duyet text,
    trang_thai_phieu text
);


--
-- Name: TABLE fp_farm_de_xuat_mua_hang_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_de_xuat_mua_hang_chi_tiet IS 'Chi tiết từng dòng hàng; so_phieu, ngay, ten_noi_de_xuat... kéo từ phiếu để xuất dễ đọc';


--
-- Name: COLUMN fp_farm_de_xuat_mua_hang_chi_tiet.id_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_de_xuat_mua_hang_chi_tiet.id_hang_hoa IS '→ fp_farm_danh_sach_hang_hoa(id)';


--
-- Name: COLUMN fp_farm_de_xuat_mua_hang_chi_tiet.id_tien_do_mh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_de_xuat_mua_hang_chi_tiet.id_tien_do_mh IS '→ fp_farm_tien_do_mua_hang(id)';


--
-- Name: COLUMN fp_farm_de_xuat_mua_hang_chi_tiet.trao_doi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_de_xuat_mua_hang_chi_tiet.trao_doi IS 'Trao đổi / log chuyển tiến độ, ghi chú duyệt';


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_de_xuat_mua_hang_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_de_xuat_mua_hang_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_de_xuat_mua_hang_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_de_xuat_mua_hang ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_de_xuat_mua_hang_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_de_xuat_mua_hang_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_farm_de_xuat_mua_hang_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_farm_dot_kiem_ke_pt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_dot_kiem_ke_pt (
    id bigint NOT NULL,
    ma_dot text NOT NULL,
    ten_dot text NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_ket_thuc date NOT NULL,
    trang_thai text DEFAULT 'draft'::text NOT NULL,
    id_nguoi_phu_trach bigint NOT NULL,
    id_nguoi_tao bigint,
    ghi_chu text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_farm_dot_kiem_ke_pt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_dot_kiem_ke_pt IS 'Đợt kiểm kê kho phân thuốc – mã đợt, tên, ngày, trạng thái, người phụ trách';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt.ma_dot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.ma_dot IS 'Mã đợt (unique), tự sinh qua RPC get_next_ma_dot_farm_kiem_ke_pt → KKPT-YYYY-NNNN';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.trang_thai IS 'draft | dang_kiem_ke | hoan_thanh';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt.id_nguoi_phu_trach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.id_nguoi_phu_trach IS 'Người phụ trách (bắt buộc) → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt.id_nguoi_tao IS 'Người tạo đợt → fp_var_nhan_vien(id)';


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet (
    id bigint NOT NULL,
    id_dot_kiem_ke_pt bigint NOT NULL,
    id_kho bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong_so numeric(18,4) DEFAULT 0 NOT NULL,
    so_luong_thuc_te numeric(18,4),
    ket_qua text DEFAULT 'chua_kiem'::text NOT NULL,
    ghi_chu_dong text,
    id_nguoi_kiem bigint,
    ngay_kiem timestamp with time zone,
    id_phieu_kho_dieu_chinh bigint,
    so_luong_dieu_chinh numeric(18,4),
    tg_dieu_chinh_ton timestamp with time zone,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_farm_dot_kiem_ke_pt_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet IS 'Chi tiết kiểm kê phân thuốc: mỗi dòng = (đợt, kho, hàng hóa) với SL sổ, SL thực tế, kết quả';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt_chi_tiet.id_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.id_hang_hoa IS 'Hàng hóa → fp_farm_danh_sach_hang_hoa(id)';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt_chi_tiet.so_luong_so; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.so_luong_so IS 'Số lượng sổ — snapshot v_farm_ton_kho_phan_thuoc lúc tạo danh sách';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt_chi_tiet.ket_qua; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.ket_qua IS 'chua_kiem | khop | thieu | thua';


--
-- Name: COLUMN fp_farm_dot_kiem_ke_pt_chi_tiet.id_phieu_kho_dieu_chinh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.id_phieu_kho_dieu_chinh IS 'Phiếu kho phân thuốc sinh ra khi điều chỉnh tồn về thực tế';


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_dot_kiem_ke_pt_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_dot_kiem_ke_pt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_dot_kiem_ke_pt ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_dot_kiem_ke_pt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_dot_kiem_ke_pt_kho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_dot_kiem_ke_pt_kho (
    id_dot_kiem_ke_pt bigint NOT NULL,
    id_kho bigint NOT NULL
);


--
-- Name: TABLE fp_farm_dot_kiem_ke_pt_kho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_dot_kiem_ke_pt_kho IS 'Phạm vi kho cần kiểm trong đợt; id_kho → fp_mh_danh_sach_kho(id)';


--
-- Name: fp_farm_dot_kiem_ke_pt_ma_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_farm_dot_kiem_ke_pt_ma_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_farm_du_bao_sl_dong_thung; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_du_bao_sl_dong_thung (
    id bigint NOT NULL,
    ngay date NOT NULL,
    id_chi_nhanh bigint NOT NULL,
    ten_chi_nhanh text,
    so_buong_can_mau integer DEFAULT 0 NOT NULL,
    tong_can_nang_mau numeric(18,4) DEFAULT 0 NOT NULL,
    tong_buong_nhap_ke_hoach integer DEFAULT 0 NOT NULL,
    ty_le_thu_hoi_ke_hoach numeric(18,6) DEFAULT 0 NOT NULL,
    quy_cach_dong_thung_ke_hoach numeric(18,4) DEFAULT 0 CONSTRAINT fp_farm_du_bao_sl_dong_thun_quy_cach_dong_thung_ke_hoa_not_null NOT NULL,
    tong_buong_nhap_thuc_te integer DEFAULT 0 NOT NULL,
    ty_le_thu_hoi_thuc_te numeric(18,6) DEFAULT 0 NOT NULL,
    quy_cach_dong_thung_thuc_te numeric(18,4) DEFAULT 0 CONSTRAINT fp_farm_du_bao_sl_dong_thun_quy_cach_dong_thung_thuc_t_not_null NOT NULL,
    ghi_chu text,
    id_nguoi_tao bigint,
    trang_thai text DEFAULT 'mo'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    can_nang_binh_quan_buong numeric(18,4) GENERATED ALWAYS AS (
CASE
    WHEN (so_buong_can_mau = 0) THEN NULL::numeric
    ELSE (tong_can_nang_mau / (so_buong_can_mau)::numeric)
END) STORED,
    tong_khoi_luong_ke_hoach numeric(18,4) GENERATED ALWAYS AS (
CASE
    WHEN (so_buong_can_mau = 0) THEN (0)::numeric
    ELSE ((tong_can_nang_mau / (so_buong_can_mau)::numeric) * (tong_buong_nhap_ke_hoach)::numeric)
END) STORED,
    tong_so_thung_ke_hoach integer GENERATED ALWAYS AS (
CASE
    WHEN ((so_buong_can_mau = 0) OR (quy_cach_dong_thung_ke_hoach = (0)::numeric)) THEN 0
    ELSE (round(((((tong_can_nang_mau / (so_buong_can_mau)::numeric) * (tong_buong_nhap_ke_hoach)::numeric) * ty_le_thu_hoi_ke_hoach) / quy_cach_dong_thung_ke_hoach)))::integer
END) STORED,
    tong_khoi_luong_thuc_te numeric(18,4) GENERATED ALWAYS AS (
CASE
    WHEN (so_buong_can_mau = 0) THEN (0)::numeric
    ELSE ((tong_can_nang_mau / (so_buong_can_mau)::numeric) * (tong_buong_nhap_thuc_te)::numeric)
END) STORED,
    tong_so_thung_thuc_te integer GENERATED ALWAYS AS (
CASE
    WHEN ((so_buong_can_mau = 0) OR (quy_cach_dong_thung_thuc_te = (0)::numeric)) THEN 0
    ELSE (round(((((tong_can_nang_mau / (so_buong_can_mau)::numeric) * (tong_buong_nhap_thuc_te)::numeric) * ty_le_thu_hoi_thuc_te) / quy_cach_dong_thung_thuc_te)))::integer
END) STORED,
    CONSTRAINT fp_farm_du_bao_sl_dong_thung_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['mo'::text, 'khoa'::text])))
);


--
-- Name: TABLE fp_farm_du_bao_sl_dong_thung; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_du_bao_sl_dong_thung IS 'Dự báo sản lượng đóng thùng theo ngày / chi nhánh';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.ngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.ngay IS 'Ngày phiếu';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.ten_chi_nhanh IS 'Denormalize tên chi nhánh để list không cần join';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.so_buong_can_mau; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.so_buong_can_mau IS 'Số buồng cân mẫu';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.tong_can_nang_mau; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_can_nang_mau IS 'Tổng cân nặng mẫu (kg)';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_ke_hoach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_ke_hoach IS 'Tổng buồng nhập kế hoạch';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.ty_le_thu_hoi_ke_hoach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.ty_le_thu_hoi_ke_hoach IS 'Tỷ lệ thu hồi kế hoạch (0–1, vd 0.85)';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.quy_cach_dong_thung_ke_hoach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.quy_cach_dong_thung_ke_hoach IS 'Quy cách đóng thùng kế hoạch (kg/thùng)';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_thuc_te IS 'Tổng buồng nhập thực tế';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.ty_le_thu_hoi_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.ty_le_thu_hoi_thuc_te IS 'Tỷ lệ thu hồi thực tế (0–1)';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.quy_cach_dong_thung_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.quy_cach_dong_thung_thuc_te IS 'Quy cách đóng thùng thực tế (kg/thùng)';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.ghi_chu IS 'Ghi chú phiếu';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.trang_thai IS 'mo = đang mở; khoa = đã khóa';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.can_nang_binh_quan_buong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.can_nang_binh_quan_buong IS 'Cân nặng BQ / buồng (kg). GENERATED: tong_can_nang_mau / so_buong_can_mau. NULL khi so_buong_can_mau = 0.';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.tong_khoi_luong_ke_hoach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_khoi_luong_ke_hoach IS 'Tổng KL kế hoạch (kg). GENERATED: canBQ * tong_buong_nhap_ke_hoach.';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.tong_so_thung_ke_hoach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_so_thung_ke_hoach IS 'Số thùng kế hoạch (đã ROUND). GENERATED: round(canBQ * buongKH * tyLeKH / quyCachKH).';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.tong_khoi_luong_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_khoi_luong_thuc_te IS 'Tổng KL thực tế (kg). GENERATED: canBQ * tong_buong_nhap_thuc_te.';


--
-- Name: COLUMN fp_farm_du_bao_sl_dong_thung.tong_so_thung_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_so_thung_thuc_te IS 'Số thùng thực tế (đã ROUND). GENERATED: round(canBQ * buongTT * tyleTT / quyCachTT).';


--
-- Name: fp_farm_du_bao_sl_dong_thung_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_du_bao_sl_dong_thung ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_du_bao_sl_dong_thung_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_phieu_kho_phan_thuoc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_phieu_kho_phan_thuoc (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    loai text NOT NULL,
    kho_id bigint NOT NULL,
    ten_kho text,
    kho_den_id bigint,
    ten_kho_den text,
    trang_thai text DEFAULT 'Chờ duyệt'::text NOT NULL,
    mo_ta text,
    trao_doi text,
    id_nguoi_duyet bigint,
    nguoi_tao_id bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    id_de_xuat_mua_hang bigint,
    so_phieu_de_xuat text,
    CONSTRAINT fp_farm_phieu_kho_phan_thuoc_loai_check CHECK ((loai = ANY (ARRAY['nhập'::text, 'xuất'::text, 'chuyển'::text])))
);


--
-- Name: TABLE fp_farm_phieu_kho_phan_thuoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_phieu_kho_phan_thuoc IS 'Phiếu kho phân thuốc farm (nhập/xuất/chuyển)';


--
-- Name: COLUMN fp_farm_phieu_kho_phan_thuoc.id_de_xuat_mua_hang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_phieu_kho_phan_thuoc.id_de_xuat_mua_hang IS 'Phiếu đề xuất mua hàng farm đã sinh ra phiếu kho này → fp_farm_de_xuat_mua_hang(id)';


--
-- Name: COLUMN fp_farm_phieu_kho_phan_thuoc.so_phieu_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_phieu_kho_phan_thuoc.so_phieu_de_xuat IS 'Số phiếu đề xuất (kéo sẵn, khỏi join khi xuất DB)';


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet (
    id bigint NOT NULL,
    id_phieu_kho bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    ten_hang_hoa text,
    don_vi_tinh text,
    so_luong numeric(18,4) NOT NULL,
    don_gia numeric(18,4) DEFAULT 0,
    thanh_tien numeric(18,4) DEFAULT 0,
    so_lot text,
    ghi_chu text,
    nguoi_tao_id bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    pham_cap text,
    CONSTRAINT fp_farm_phieu_kho_phan_thuoc_chi_tiet_so_luong_check CHECK ((so_luong > (0)::numeric))
);


--
-- Name: TABLE fp_farm_phieu_kho_phan_thuoc_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet IS 'Chi tiết phiếu kho phân thuốc';


--
-- Name: COLUMN fp_farm_phieu_kho_phan_thuoc_chi_tiet.pham_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet.pham_cap IS 'Phẩm cấp trên dòng phiếu (snapshot, tùy chọn). Tự điền từ fp_farm_danh_sach_hang_hoa, có thể sửa trên phiếu.';


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_phieu_kho_phan_thuoc_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_farm_phieu_kho_phan_thuoc_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_farm_phieu_kho_pt_so_seq_chuyen; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_chuyen
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_farm_phieu_kho_pt_so_seq_nhap; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_nhap
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_farm_phieu_kho_pt_so_seq_xuat; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_xuat
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_farm_thu_hoach; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_thu_hoach (
    id integer NOT NULL,
    nam integer NOT NULL,
    tuan integer NOT NULL,
    id_chi_nhanh bigint,
    ten_chi_nhanh text,
    ke_hoach_t2 numeric(10,2) DEFAULT 0,
    ke_hoach_t3 numeric(10,2) DEFAULT 0,
    ke_hoach_t4 numeric(10,2) DEFAULT 0,
    ke_hoach_t5 numeric(10,2) DEFAULT 0,
    ke_hoach_t6 numeric(10,2) DEFAULT 0,
    ke_hoach_t7 numeric(10,2) DEFAULT 0,
    ke_hoach_cn numeric(10,2) DEFAULT 0,
    thuc_te_t2 numeric(10,2) DEFAULT 0,
    thuc_te_t3 numeric(10,2) DEFAULT 0,
    thuc_te_t4 numeric(10,2) DEFAULT 0,
    thuc_te_t5 numeric(10,2) DEFAULT 0,
    thuc_te_t6 numeric(10,2) DEFAULT 0,
    thuc_te_t7 numeric(10,2) DEFAULT 0,
    thuc_te_cn numeric(10,2) DEFAULT 0,
    ghi_chu text,
    id_nguoi_tao bigint,
    tg_tao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    tg_cap_nhat timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    trao_doi text,
    du_thu_tuan numeric,
    thu_du_kien text
);


--
-- Name: fp_farm_thu_hoach_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_farm_thu_hoach_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_farm_thu_hoach_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fp_farm_thu_hoach_id_seq OWNED BY public.fp_farm_thu_hoach.id;


--
-- Name: fp_farm_tien_do_mua_hang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_farm_tien_do_mua_hang (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    mau text,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone,
    tg_cap_nhat timestamp with time zone
);


--
-- Name: fp_farm_tien_do_mua_hang_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_tien_do_mua_hang ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_farm_tien_do_mua_hang_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_hc_cong_viec; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_hc_cong_viec (
    id bigint NOT NULL,
    tieu_de text NOT NULL,
    mo_ta text,
    id_cha bigint,
    id_nguoi_giao bigint NOT NULL,
    trach_nhiem bigint,
    nguoi_ho_tro bigint[] DEFAULT '{}'::bigint[] NOT NULL,
    uu_tien text DEFAULT 'trung_binh'::text NOT NULL,
    trang_thai text DEFAULT 'draft'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    trao_doi jsonb DEFAULT '[]'::jsonb NOT NULL,
    ket_qua text,
    link_ket_qua text
);


--
-- Name: TABLE fp_hc_cong_viec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_hc_cong_viec IS 'Công việc – Module Công việc hành chính. Trao đổi trong trao_doi; báo cáo kết quả: ket_qua, link_ket_qua.';


--
-- Name: COLUMN fp_hc_cong_viec.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.id IS 'PK, int8';


--
-- Name: COLUMN fp_hc_cong_viec.tieu_de; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.tieu_de IS 'Tiêu đề công việc';


--
-- Name: COLUMN fp_hc_cong_viec.mo_ta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.mo_ta IS 'Mô tả chi tiết';


--
-- Name: COLUMN fp_hc_cong_viec.id_cha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.id_cha IS 'ID công việc cha (công việc con), self-reference int8';


--
-- Name: COLUMN fp_hc_cong_viec.id_nguoi_giao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.id_nguoi_giao IS 'ID người giao việc (int8)';


--
-- Name: COLUMN fp_hc_cong_viec.trach_nhiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.trach_nhiem IS 'ID người chịu trách nhiệm chính (int8)';


--
-- Name: COLUMN fp_hc_cong_viec.nguoi_ho_tro; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.nguoi_ho_tro IS 'Mảng ID người hỗ trợ (bigint[])';


--
-- Name: COLUMN fp_hc_cong_viec.uu_tien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.uu_tien IS 'Ưu tiên: cao | trung_binh | thap';


--
-- Name: COLUMN fp_hc_cong_viec.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.trang_thai IS 'Trạng thái: draft | dang_thuc_hien | cho_bao_cao | hoan_thanh | huy';


--
-- Name: COLUMN fp_hc_cong_viec.trao_doi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.trao_doi IS 'Mảng trao đổi/bình luận. Mỗi phần tử: { "id": "...", "noi_dung": "...", "nguoi_gui_id": "...", "ten_nguoi_gui": "...", "tg_gui": "ISO8601" }';


--
-- Name: COLUMN fp_hc_cong_viec.ket_qua; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.ket_qua IS 'Nội dung báo cáo kết quả';


--
-- Name: COLUMN fp_hc_cong_viec.link_ket_qua; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_cong_viec.link_ket_qua IS 'Link đính kèm báo cáo kết quả';


--
-- Name: fp_hc_cong_viec_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_hc_cong_viec_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_hc_cong_viec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fp_hc_cong_viec_id_seq OWNED BY public.fp_hc_cong_viec.id;


--
-- Name: fp_hc_noi_quan_ly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_hc_noi_quan_ly (
    id bigint NOT NULL,
    id_chi_nhanh bigint NOT NULL,
    ten_chi_nhanh text,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 1 NOT NULL,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_hc_noi_quan_ly; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_hc_noi_quan_ly IS 'Danh mục nơi quản lý – Hành chính, theo chi nhánh. ten_chi_nhanh đồng bộ từ fp_var_chi_nhanh.';


--
-- Name: COLUMN fp_hc_noi_quan_ly.id_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_noi_quan_ly.id_chi_nhanh IS 'FK → fp_var_chi_nhanh(id)';


--
-- Name: COLUMN fp_hc_noi_quan_ly.ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ten_chi_nhanh IS 'Tên chi nhánh (lấy từ fp_var_chi_nhanh, trigger sync)';


--
-- Name: COLUMN fp_hc_noi_quan_ly.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ma IS 'Mã nơi quản lý (VD: PB_KT, KHO_A)';


--
-- Name: COLUMN fp_hc_noi_quan_ly.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ten IS 'Tên hiển thị nơi quản lý';


--
-- Name: COLUMN fp_hc_noi_quan_ly.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_noi_quan_ly.thu_tu IS 'Thứ tự sắp xếp, default 1';


--
-- Name: COLUMN fp_hc_noi_quan_ly.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ghi_chu IS 'Ghi chú tùy chọn';


--
-- Name: COLUMN fp_hc_noi_quan_ly.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hc_noi_quan_ly.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';


--
-- Name: fp_hc_noi_quan_ly_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_hc_noi_quan_ly ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_hc_noi_quan_ly_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_hr_bang_luong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_hr_bang_luong (
    id bigint NOT NULL,
    nhan_vien_id bigint,
    nam smallint NOT NULL,
    thang smallint NOT NULL,
    ngay_cong numeric(10,2) DEFAULT 0 NOT NULL,
    ngay_cong_chuan numeric(10,2) DEFAULT 22 NOT NULL,
    luong_co_ban numeric(14,0) DEFAULT 0 NOT NULL,
    luong_co_ban_tinh numeric(14,0) DEFAULT 0 NOT NULL,
    luong_kpi numeric(14,0) DEFAULT 0 NOT NULL,
    diem_kpi numeric(8,2) DEFAULT 0 NOT NULL,
    kpi_dat boolean DEFAULT false NOT NULL,
    ty_le_kpi_khong_dat numeric(4,2) DEFAULT 0.7 NOT NULL,
    luong_kpi_tinh numeric(14,0) DEFAULT 0 NOT NULL,
    luong_trach_nhiem numeric(14,0) DEFAULT 0 NOT NULL,
    luong_trach_nhiem_tinh numeric(14,0) DEFAULT 0 NOT NULL,
    phu_cap numeric(14,0) DEFAULT 0 NOT NULL,
    phu_cap_tinh numeric(14,0) DEFAULT 0 NOT NULL,
    cong_tru_khac numeric(14,0) DEFAULT 0 NOT NULL,
    cong_tru_net numeric(14,0) DEFAULT 0 NOT NULL,
    tong_luong numeric(14,0) DEFAULT 0 NOT NULL,
    ghi_chu text,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone,
    CONSTRAINT chk_nam_thang CHECK (((nam >= 2000) AND (nam <= 2100) AND (thang >= 1) AND (thang <= 12)))
);


--
-- Name: fp_hr_bang_luong_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_bang_luong ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_hr_bang_luong_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_hr_diem_cong_tru; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_hr_diem_cong_tru (
    id bigint NOT NULL,
    id_nhan_vien bigint NOT NULL,
    nam integer NOT NULL,
    thang integer NOT NULL,
    loai text NOT NULL,
    id_hang_muc bigint NOT NULL,
    ten_hang_muc text,
    diem integer DEFAULT 0 NOT NULL,
    mo_ta text,
    ghi_chu text,
    id_nguoi_tao bigint,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    CONSTRAINT chk_fp_hr_diem_cong_tru_diem CHECK ((diem >= 0)),
    CONSTRAINT chk_fp_hr_diem_cong_tru_loai CHECK ((loai = ANY (ARRAY['cong'::text, 'tru'::text]))),
    CONSTRAINT chk_fp_hr_diem_cong_tru_nam CHECK (((nam >= 2000) AND (nam <= 2100))),
    CONSTRAINT chk_fp_hr_diem_cong_tru_thang CHECK (((thang >= 1) AND (thang <= 12)))
);


--
-- Name: TABLE fp_hr_diem_cong_tru; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_hr_diem_cong_tru IS 'Bản ghi điểm cộng/trừ theo nhân viên, kỳ (năm-tháng), hạng mục – Module Điểm cộng trừ';


--
-- Name: COLUMN fp_hr_diem_cong_tru.id_nhan_vien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.id_nhan_vien IS 'Nhân viên được ghi nhận → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.nam; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.nam IS 'Năm áp dụng (2000–2100)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.thang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.thang IS 'Tháng áp dụng (1–12)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.loai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.loai IS 'Loại: cong (cộng điểm) | tru (trừ điểm)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.id_hang_muc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.id_hang_muc IS 'Hạng mục điểm cộng/trừ → fp_hr_thiet_lap_diem_cong_tru(id)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.ten_hang_muc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.ten_hang_muc IS 'Tên hạng mục (lưu tắt khi tạo/cập nhật)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.diem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.diem IS 'Số điểm (>= 0)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.mo_ta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.mo_ta IS 'Mô tả ngắn (tùy chọn)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.ghi_chu IS 'Ghi chú (tùy chọn)';


--
-- Name: COLUMN fp_hr_diem_cong_tru.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_diem_cong_tru.id_nguoi_tao IS 'Người tạo bản ghi → fp_var_nhan_vien(id)';


--
-- Name: fp_hr_diem_cong_tru_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_diem_cong_tru ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_hr_diem_cong_tru_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_hr_nhom_phieu_hanh_chinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_hr_nhom_phieu_hanh_chinh (
    id bigint NOT NULL,
    loai_phieu text NOT NULL,
    so_luong_thang integer DEFAULT 0 NOT NULL,
    ghi_chu text,
    trang_thai smallint DEFAULT 1 NOT NULL,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fp_hr_nhom_phieu_hanh_chinh_so_luong_thang_check CHECK (((so_luong_thang >= 0) AND (so_luong_thang <= 999))),
    CONSTRAINT fp_hr_nhom_phieu_hanh_chinh_trang_thai_check CHECK ((trang_thai = ANY (ARRAY[0, 1])))
);


--
-- Name: TABLE fp_hr_nhom_phieu_hanh_chinh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_hr_nhom_phieu_hanh_chinh IS 'Nhóm phiếu hành chính – loại phiếu (tiếng Việt) và định mức số lượng/tháng';


--
-- Name: COLUMN fp_hr_nhom_phieu_hanh_chinh.loai_phieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_nhom_phieu_hanh_chinh.loai_phieu IS 'Tên loại phiếu tiếng Việt: Đi muộn / về sớm, Công tác, Quên chấm công, Tăng ca, Xin nghỉ không lương, Xin nghỉ phép';


--
-- Name: COLUMN fp_hr_nhom_phieu_hanh_chinh.so_luong_thang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_nhom_phieu_hanh_chinh.so_luong_thang IS 'Định mức số phiếu được dùng trong tháng';


--
-- Name: COLUMN fp_hr_nhom_phieu_hanh_chinh.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_nhom_phieu_hanh_chinh.trang_thai IS '0=ẩn, 1=đang dùng';


--
-- Name: fp_hr_nhom_phieu_hanh_chinh_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_nhom_phieu_hanh_chinh ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_hr_nhom_phieu_hanh_chinh_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_hr_phieu_hanh_chinh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_hr_phieu_hanh_chinh (
    id bigint NOT NULL,
    loai_phieu_id bigint,
    ngay date,
    ca text,
    ly_do text,
    trang_thai text,
    ghi_chu text,
    nguoi_tao_id bigint,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone
);


--
-- Name: fp_hr_phieu_hanh_chinh_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_phieu_hanh_chinh ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_hr_phieu_hanh_chinh_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_hr_thiet_lap_diem_cong_tru; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_hr_thiet_lap_diem_cong_tru (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    loai text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_hr_thiet_lap_diem_cong_tru; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_hr_thiet_lap_diem_cong_tru IS 'Danh mục hạng mục điểm cộng trừ – Thiết lập công lương, dùng trong module Điểm cộng trừ';


--
-- Name: COLUMN fp_hr_thiet_lap_diem_cong_tru.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.ma IS 'Mã hạng mục (VD: VUOT_KPI, DI_MUON)';


--
-- Name: COLUMN fp_hr_thiet_lap_diem_cong_tru.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.ten IS 'Tên hiển thị (VD: Hoàn thành vượt KPI, Đi muộn)';


--
-- Name: COLUMN fp_hr_thiet_lap_diem_cong_tru.loai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.loai IS 'Loại: cong (cộng điểm) | tru (trừ điểm)';


--
-- Name: COLUMN fp_hr_thiet_lap_diem_cong_tru.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.thu_tu IS 'Thứ tự sắp xếp';


--
-- Name: COLUMN fp_hr_thiet_lap_diem_cong_tru.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.ghi_chu IS 'Ghi chú tùy chọn';


--
-- Name: COLUMN fp_hr_thiet_lap_diem_cong_tru.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';


--
-- Name: fp_hr_thiet_lap_diem_cong_tru_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_thiet_lap_diem_cong_tru ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_hr_thiet_lap_diem_cong_tru_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_danh_muc_hang_hoa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_danh_muc_hang_hoa (
    id bigint NOT NULL,
    ma_danh_muc text,
    ten_danh_muc text,
    danh_muc_cha_id bigint,
    thu_tu smallint,
    mo_ta text,
    trang_thai text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: fp_mh_danh_muc_hang_hoa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_muc_hang_hoa ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_mh_danh_muc_hang_hoa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_danh_sach_doi_tac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_danh_sach_doi_tac (
    id bigint NOT NULL,
    ma_doi_tac text NOT NULL,
    ten_doi_tac text NOT NULL,
    loai_doi_tac text NOT NULL,
    id_nhom bigint,
    dia_chi text,
    dien_thoai text,
    email text,
    mo_ta text,
    tag_ids bigint[] DEFAULT '{}'::bigint[],
    trang_thai text,
    thu_tu integer DEFAULT 0,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    ngan_hang_bin text,
    so_tai_khoan text,
    chu_tai_khoan text,
    CONSTRAINT fp_mh_danh_sach_doi_tac_loai_doi_tac_check CHECK ((loai_doi_tac = ANY (ARRAY['nha_cung_cap'::text, 'khach_hang'::text])))
);


--
-- Name: TABLE fp_mh_danh_sach_doi_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_danh_sach_doi_tac IS 'Danh sách đối tác – Nhà cung cấp và Khách hàng';


--
-- Name: COLUMN fp_mh_danh_sach_doi_tac.loai_doi_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_danh_sach_doi_tac.loai_doi_tac IS 'nha_cung_cap | khach_hang';


--
-- Name: COLUMN fp_mh_danh_sach_doi_tac.tag_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_danh_sach_doi_tac.tag_ids IS 'Mảng id tham chiếu fp_mh_tag_doi_tac.id';


--
-- Name: COLUMN fp_mh_danh_sach_doi_tac.ngan_hang_bin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_danh_sach_doi_tac.ngan_hang_bin IS 'Mã BIN ngân hàng theo chuẩn VietQR/Napas247 (vd 970422 = MB, 970436 = VCB)';


--
-- Name: COLUMN fp_mh_danh_sach_doi_tac.so_tai_khoan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_danh_sach_doi_tac.so_tai_khoan IS 'Số tài khoản nhận tiền';


--
-- Name: COLUMN fp_mh_danh_sach_doi_tac.chu_tai_khoan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_danh_sach_doi_tac.chu_tai_khoan IS 'Tên chủ tài khoản (nên in hoa, không dấu khi xuất QR)';


--
-- Name: fp_mh_danh_sach_doi_tac_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_sach_doi_tac ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_danh_sach_doi_tac_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_danh_sach_hang_hoa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_danh_sach_hang_hoa (
    id bigint NOT NULL,
    danh_muc_id bigint,
    danh_muc_cha_id bigint,
    ma_hang_hoa text,
    ten_hang_hoa text,
    dvt text,
    thu_tu smallint,
    trang_thai text,
    don_gia numeric,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    mo_ta text,
    hinh_anh text,
    phan_loai text,
    pham_cap text
);


--
-- Name: COLUMN fp_mh_danh_sach_hang_hoa.pham_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_danh_sach_hang_hoa.pham_cap IS 'Phẩm cấp (tùy chọn). Text tự do; app gợi ý từ các giá trị đã có.';


--
-- Name: fp_mh_danh_sach_hang_hoa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_sach_hang_hoa ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_mh_danh_sach_hang_hoa_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_danh_sach_kho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_danh_sach_kho (
    id bigint NOT NULL,
    chi_nhanh_id bigint,
    ma_kho text,
    ten_kho text,
    dia_chi text,
    mo_ta text,
    thu_tu smallint,
    trang_thai text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: fp_mh_danh_sach_kho_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_sach_kho ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_mh_danh_sach_kho_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_dinh_muc_ton_kho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_dinh_muc_ton_kho (
    id bigint NOT NULL,
    kho_id bigint,
    hang_hoa_id bigint,
    ton_toi_thieu numeric
);


--
-- Name: fp_mh_dinh_muc_ton_kho_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_dinh_muc_ton_kho ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_mh_dinh_muc_ton_kho_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_don_dat_hang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_don_dat_hang (
    id bigint NOT NULL,
    so_po text NOT NULL,
    ngay_dat date NOT NULL,
    ngay_giao_dk date NOT NULL,
    id_nha_cung_cap bigint NOT NULL,
    ten_nha_cung_cap text,
    id_kho_nhan bigint,
    ten_kho_nhan text,
    id_phieu_de_xuat_vat_tu bigint,
    id_nguoi_dat bigint NOT NULL,
    id_nguoi_duyet bigint,
    ghi_chu text,
    trang_thai text DEFAULT 'Nháp'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    CONSTRAINT fp_mh_don_dat_hang_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['Nháp'::text, 'Chờ duyệt'::text, 'Đã gửi'::text, 'Đã xác nhận'::text, 'Đang giao'::text, 'Đã nhận đủ'::text, 'Đã đóng'::text, 'Hủy'::text])))
);


--
-- Name: TABLE fp_mh_don_dat_hang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_don_dat_hang IS 'Đơn đặt hàng (Purchase Order)';


--
-- Name: COLUMN fp_mh_don_dat_hang.so_po; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.so_po IS 'Số đơn đặt hàng (PO)';


--
-- Name: COLUMN fp_mh_don_dat_hang.ngay_dat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.ngay_dat IS 'Ngày đặt hàng';


--
-- Name: COLUMN fp_mh_don_dat_hang.ngay_giao_dk; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.ngay_giao_dk IS 'Ngày giao dự kiến';


--
-- Name: COLUMN fp_mh_don_dat_hang.id_nha_cung_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.id_nha_cung_cap IS 'Nhà cung cấp (đối tác)';


--
-- Name: COLUMN fp_mh_don_dat_hang.ten_nha_cung_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.ten_nha_cung_cap IS 'Tên NCC (denormalize, app điền khi tạo/sửa)';


--
-- Name: COLUMN fp_mh_don_dat_hang.id_kho_nhan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.id_kho_nhan IS 'Kho nhận hàng → fp_mh_danh_sach_kho(id)';


--
-- Name: COLUMN fp_mh_don_dat_hang.ten_kho_nhan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.ten_kho_nhan IS 'Tên kho nhận (denormalize, app điền khi tạo/sửa)';


--
-- Name: COLUMN fp_mh_don_dat_hang.id_phieu_de_xuat_vat_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.id_phieu_de_xuat_vat_tu IS 'Phiếu đề xuất vật tư (nếu có) → fp_mh_phieu_de_xuat_vat_tu(id)';


--
-- Name: COLUMN fp_mh_don_dat_hang.id_nguoi_dat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.id_nguoi_dat IS 'Người đặt hàng → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_mh_don_dat_hang.id_nguoi_duyet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_mh_don_dat_hang.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang.trang_thai IS 'Text: Nháp, Chờ duyệt, Đã gửi, Đã xác nhận, Đang giao, Đã nhận đủ, Đã đóng, Hủy';


--
-- Name: fp_mh_don_dat_hang_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_don_dat_hang_chi_tiet (
    id bigint NOT NULL,
    id_don_dat_hang bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong numeric(18,4) NOT NULL,
    don_vi_tinh text,
    don_gia numeric(18,4) DEFAULT 0,
    thanh_tien numeric(18,4) DEFAULT 0,
    ghi_chu text,
    so_po text,
    ngay_dat date,
    ngay_giao_dk date,
    ten_nha_cung_cap text,
    ten_kho_nhan text,
    so_phieu_de_xuat text,
    ten_nguoi_dat text,
    trang_thai_phieu text,
    phan_loai text,
    muc_dich_su_dung text,
    CONSTRAINT fp_mh_don_dat_hang_chi_tiet_so_luong_check CHECK ((so_luong > (0)::numeric))
);


--
-- Name: TABLE fp_mh_don_dat_hang_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_don_dat_hang_chi_tiet IS 'Chi tiết từng dòng hàng đơn đặt hàng; so_po, ngay_dat, ten_nha_cung_cap... kéo từ đơn';


--
-- Name: COLUMN fp_mh_don_dat_hang_chi_tiet.id_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang_chi_tiet.id_hang_hoa IS '→ fp_mh_danh_sach_hang_hoa(id)';


--
-- Name: COLUMN fp_mh_don_dat_hang_chi_tiet.muc_dich_su_dung; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_don_dat_hang_chi_tiet.muc_dich_su_dung IS 'Mục đích sử dụng (dòng chi tiết)';


--
-- Name: fp_mh_don_dat_hang_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_don_dat_hang_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_don_dat_hang_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_don_dat_hang_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_don_dat_hang ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_don_dat_hang_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_don_dat_hang_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_don_dat_hang_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_dot_kiem_ke_kho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_dot_kiem_ke_kho (
    id bigint NOT NULL,
    ma_dot text NOT NULL,
    ten_dot text NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_ket_thuc date NOT NULL,
    trang_thai text DEFAULT 'draft'::text NOT NULL,
    id_nguoi_phu_trach bigint NOT NULL,
    ghi_chu text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    id_nguoi_tao bigint
);


--
-- Name: TABLE fp_mh_dot_kiem_ke_kho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_dot_kiem_ke_kho IS 'Đợt kiểm kê kho – mã đợt, tên, ngày, trạng thái, người phụ trách';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho.ma_dot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ma_dot IS 'Mã đợt kiểm kê (unique, tự sinh qua RPC get_next_ma_dot_dot_kiem_ke_kho)';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho.ten_dot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ten_dot IS 'Tên đợt kiểm kê';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho.ngay_bat_dau; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ngay_bat_dau IS 'Ngày bắt đầu đợt';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho.ngay_ket_thuc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ngay_ket_thuc IS 'Ngày kết thúc đợt';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.trang_thai IS 'draft | dang_kiem_ke | hoan_thanh';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho.id_nguoi_phu_trach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.id_nguoi_phu_trach IS 'Người phụ trách (bắt buộc) → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.id_nguoi_tao IS 'Người tạo đợt → fp_var_nhan_vien(id)';


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet (
    id bigint NOT NULL,
    id_dot_kiem_ke_kho bigint NOT NULL,
    id_kho bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong_so numeric(18,4) DEFAULT 0 NOT NULL,
    so_luong_thuc_te numeric(18,4),
    ket_qua text DEFAULT 'chua_kiem'::text NOT NULL,
    ghi_chu_dong text,
    id_nguoi_kiem bigint,
    ngay_kiem timestamp with time zone,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    id_phieu_kho_dieu_chinh bigint,
    so_luong_dieu_chinh numeric(18,4),
    tg_dieu_chinh_ton timestamp with time zone
);


--
-- Name: TABLE fp_mh_dot_kiem_ke_kho_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet IS 'Chi tiết kiểm kê: mỗi dòng = (đợt, kho, hàng hóa) với SL sổ, SL thực tế, kết quả';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.id_kho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.id_kho IS 'Kho → fp_mh_danh_sach_kho(id)';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.id_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.id_hang_hoa IS 'Hàng hóa → fp_mh_danh_sach_hang_hoa(id)';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_so; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_so IS 'Số lượng sổ (snapshot tồn khi tạo danh sách)';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_thuc_te IS 'Số lượng đếm thực tế (người kiểm nhập)';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.ket_qua; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.ket_qua IS 'chua_kiem | khop | thieu | thua';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.id_nguoi_kiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.id_nguoi_kiem IS 'Người nhập kết quả kiểm → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.id_phieu_kho_dieu_chinh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.id_phieu_kho_dieu_chinh IS 'Phiếu kho điều chỉnh: thừa → nhập, thiếu → xuất; nhiều dòng có thể cùng phiếu nếu gộp theo kho';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_dieu_chinh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_dieu_chinh IS '|thực tế - sổ| đã post';


--
-- Name: COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.tg_dieu_chinh_ton; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.tg_dieu_chinh_ton IS 'Thời điểm post điều chỉnh';


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_dot_kiem_ke_kho_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_dot_kiem_ke_kho_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_dot_kiem_ke_kho ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_dot_kiem_ke_kho_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_dot_kiem_ke_kho_kho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_dot_kiem_ke_kho_kho (
    id_dot_kiem_ke_kho bigint NOT NULL,
    id_kho bigint NOT NULL
);


--
-- Name: TABLE fp_mh_dot_kiem_ke_kho_kho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_dot_kiem_ke_kho_kho IS 'Phạm vi kho cần kiểm trong đợt; id_kho → fp_mh_danh_sach_kho(id)';


--
-- Name: fp_mh_dot_kiem_ke_kho_ma_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_dot_kiem_ke_kho_ma_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_hop_dong; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_hop_dong (
    id bigint NOT NULL,
    ngay date,
    id_nha_cung_cap bigint NOT NULL,
    ten_nha_cung_cap text,
    ma_hop_dong text NOT NULL,
    ten_hop_dong text,
    noi_dung text,
    so_luong_cay numeric(18,4),
    don_gia numeric(18,2),
    thanh_tien numeric(18,2),
    trang_thai text DEFAULT 'Đang thực hiện'::text NOT NULL,
    ghi_chu text,
    id_nguoi_tao bigint,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    hinh_anh_urls text[] DEFAULT ARRAY[]::text[] NOT NULL
);


--
-- Name: TABLE fp_mh_hop_dong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_hop_dong IS 'Hợp đồng mua hàng (header)';


--
-- Name: COLUMN fp_mh_hop_dong.id_nha_cung_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_hop_dong.id_nha_cung_cap IS 'Nhà cung cấp → fp_mh_danh_sach_doi_tac(id)';


--
-- Name: COLUMN fp_mh_hop_dong.ten_nha_cung_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_hop_dong.ten_nha_cung_cap IS 'Tên NCC denormalize khi lưu';


--
-- Name: COLUMN fp_mh_hop_dong.noi_dung; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_hop_dong.noi_dung IS 'Nội dung hợp đồng (long text)';


--
-- Name: COLUMN fp_mh_hop_dong.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_hop_dong.trang_thai IS 'Đang thực hiện | Đã thanh lý';


--
-- Name: COLUMN fp_mh_hop_dong.hinh_anh_urls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_hop_dong.hinh_anh_urls IS 'Danh sách URL ảnh đính kèm hợp đồng (lưu trên Cloudinary). Tối đa 20 ảnh, <= 5MB/ảnh khi upload.';


--
-- Name: fp_mh_hop_dong_ct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_hop_dong_ct (
    id bigint NOT NULL,
    id_hop_dong bigint NOT NULL,
    ngay date,
    ten_dot text,
    so_tien numeric(18,2),
    so_cay_thuc_nhan numeric(18,4),
    ghi_chu text,
    id_chi_nhanh bigint,
    id_nguoi_tao bigint,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_mh_hop_dong_ct; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_hop_dong_ct IS 'Lịch sử thanh toán / đợt (Cọc HĐ, TT lần 1, …)';


--
-- Name: COLUMN fp_mh_hop_dong_ct.ten_dot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_hop_dong_ct.ten_dot IS 'Tên đợt thanh toán';


--
-- Name: COLUMN fp_mh_hop_dong_ct.id_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_hop_dong_ct.id_chi_nhanh IS 'Chi nhánh → fp_var_chi_nhanh(id)';


--
-- Name: fp_mh_hop_dong_ct_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_hop_dong_ct ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_hop_dong_ct_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_hop_dong_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_hop_dong ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_mh_hop_dong_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_nhom_doi_tac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_nhom_doi_tac (
    id bigint NOT NULL,
    ma_nhom text NOT NULL,
    ten_nhom text NOT NULL,
    thu_tu smallint DEFAULT 0,
    trang_thai text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    loai text
);


--
-- Name: TABLE fp_mh_nhom_doi_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_nhom_doi_tac IS 'Nhóm đối tác – dùng chung NCC/Khách hàng';


--
-- Name: fp_mh_nhom_doi_tac_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_nhom_doi_tac ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_nhom_doi_tac_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_phieu_de_xuat_vat_tu (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    ngay_can date NOT NULL,
    id_noi_de_xuat bigint NOT NULL,
    id_nguoi_de_xuat bigint NOT NULL,
    id_nguoi_duyet bigint,
    ghi_chu text,
    trang_thai text DEFAULT 'Chờ duyệt'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_mh_phieu_de_xuat_vat_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_phieu_de_xuat_vat_tu IS 'Phiếu đề xuất vật tư';


--
-- Name: COLUMN fp_mh_phieu_de_xuat_vat_tu.id_noi_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_de_xuat_vat_tu.id_noi_de_xuat IS 'Nơi đề xuất → fp_mh_danh_sach_kho(id)';


--
-- Name: COLUMN fp_mh_phieu_de_xuat_vat_tu.id_nguoi_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_de_xuat_vat_tu.id_nguoi_de_xuat IS 'Người đề xuất → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_mh_phieu_de_xuat_vat_tu.id_nguoi_duyet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_de_xuat_vat_tu.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet (
    id bigint NOT NULL,
    id_phieu_de_xuat_vat_tu bigint CONSTRAINT fp_mh_phieu_de_xuat_vat_tu_chi_id_phieu_de_xuat_vat_tu_not_null NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong numeric(18,4) NOT NULL,
    don_vi_tinh text,
    thong_so text,
    ghi_chu text,
    so_phieu text,
    ngay date,
    ngay_can date,
    ten_noi_de_xuat text,
    ten_nguoi_de_xuat text,
    ten_nguoi_duyet text,
    trang_thai_phieu text,
    id_tien_do_mh text,
    ten_tien_do_mh text,
    trao_doi text
);


--
-- Name: TABLE fp_mh_phieu_de_xuat_vat_tu_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet IS 'Chi tiết từng dòng hàng; so_phieu, ngay, ten_noi_de_xuat, ten_nguoi_de_xuat... kéo từ phiếu để xuất dễ đọc';


--
-- Name: COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.id_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet.id_hang_hoa IS '→ fp_mh_danh_sach_hang_hoa(id)';


--
-- Name: COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.so_phieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet.so_phieu IS 'Số phiếu (kéo từ phiếu)';


--
-- Name: COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.ten_noi_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet.ten_noi_de_xuat IS 'Tên kho (kéo từ phiếu)';


--
-- Name: COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.ten_nguoi_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet.ten_nguoi_de_xuat IS 'Người đề xuất (kéo từ phiếu)';


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_de_xuat_vat_tu ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_phieu_de_xuat_vat_tu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_phieu_de_xuat_vat_tu_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_phieu_kho; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_phieu_kho (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    loai text NOT NULL,
    kho_id bigint NOT NULL,
    ten_kho text,
    kho_den_id bigint,
    ten_kho_den text,
    id_nha_cung_cap bigint,
    id_khach_hang bigint,
    trang_thai text NOT NULL,
    mo_ta text,
    nguoi_tao_id bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    trao_doi text,
    id_nguoi_duyet bigint,
    id_don_dat_hang bigint,
    CONSTRAINT fp_mh_phieu_kho_loai_check CHECK ((loai = ANY (ARRAY['nhập'::text, 'xuất'::text, 'chuyển'::text])))
);


--
-- Name: COLUMN fp_mh_phieu_kho.id_don_dat_hang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kho.id_don_dat_hang IS 'Đơn đặt hàng nguồn (tùy chọn), có ý nghĩa khi loai = nhập → fp_mh_don_dat_hang(id)';


--
-- Name: fp_mh_phieu_kho_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_phieu_kho_chi_tiet (
    id bigint NOT NULL,
    id_phieu_kho bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    ten_hang_hoa text,
    don_vi_tinh text,
    so_luong numeric(18,4) NOT NULL,
    don_gia numeric(18,4) DEFAULT 0,
    thanh_tien numeric(18,4) DEFAULT 0,
    ghi_chu text,
    nguoi_tao_id bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    so_lot text,
    pham_cap text,
    CONSTRAINT fp_mh_phieu_kho_chi_tiet_so_luong_check CHECK ((so_luong >= (0)::numeric))
);


--
-- Name: COLUMN fp_mh_phieu_kho_chi_tiet.pham_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kho_chi_tiet.pham_cap IS 'Phẩm cấp trên dòng phiếu (snapshot, tùy chọn). Tự điền từ fp_mh_danh_sach_hang_hoa, có thể sửa trên phiếu.';


--
-- Name: fp_mh_phieu_kho_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kho_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_phieu_kho_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_phieu_kho_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kho ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_phieu_kho_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_phieu_kho_so_phieu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_phieu_kho_so_phieu (
    loai text NOT NULL,
    nam integer NOT NULL,
    so_tiep_theo integer DEFAULT 1 NOT NULL,
    CONSTRAINT fp_mh_phieu_kho_so_phieu_loai_check CHECK ((loai = ANY (ARRAY['nhập'::text, 'xuất'::text, 'chuyển'::text])))
);


--
-- Name: TABLE fp_mh_phieu_kho_so_phieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_phieu_kho_so_phieu IS 'Counter số phiếu theo loại và năm; RPC get_next_so_phieu dùng để lấy số tiếp theo.';


--
-- Name: fp_mh_phieu_kho_so_seq_chuyen; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_phieu_kho_so_seq_chuyen
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_phieu_kho_so_seq_nhap; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_phieu_kho_so_seq_nhap
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_phieu_kho_so_seq_xuat; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_phieu_kho_so_seq_xuat
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_phieu_kiem_ke; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_phieu_kiem_ke (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    id_kho bigint NOT NULL,
    ten_kho text,
    id_nguoi_thuc_hien bigint NOT NULL,
    ten_nguoi_thuc_hien text,
    id_nguoi_duyet bigint,
    ten_nguoi_duyet text,
    ghi_chu text,
    trang_thai text DEFAULT 'Nháp'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_mh_phieu_kiem_ke; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_phieu_kiem_ke IS 'Phiếu kiểm kê kho (Stocktaking)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.so_phieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.so_phieu IS 'Số phiếu kiểm kê';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.ngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.ngay IS 'Ngày kiểm kê';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.id_kho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.id_kho IS 'Kho kiểm kê → fp_mh_danh_sach_kho(id)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.ten_kho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.ten_kho IS 'Tên kho (denormalize, app điền khi tạo/sửa)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.id_nguoi_thuc_hien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.id_nguoi_thuc_hien IS 'Người thực hiện kiểm kê → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.ten_nguoi_thuc_hien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.ten_nguoi_thuc_hien IS 'Tên người thực hiện (denormalize)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.id_nguoi_duyet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.ten_nguoi_duyet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.ten_nguoi_duyet IS 'Tên người duyệt (denormalize)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke.trang_thai IS 'Text: Nháp, Đang kiểm, Hoàn thành, Đã duyệt';


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_phieu_kiem_ke_chi_tiet (
    id bigint NOT NULL,
    id_phieu_kiem_ke bigint NOT NULL,
    id_hang_hoa bigint NOT NULL,
    so_luong_so numeric(18,4) DEFAULT 0 NOT NULL,
    so_luong_thuc_te numeric(18,4),
    chenh_lech numeric(18,4),
    don_vi_tinh text,
    ghi_chu text,
    so_phieu text,
    ngay date,
    ten_kho text,
    ten_nguoi_thuc_hien text,
    ten_nguoi_duyet text,
    trang_thai_phieu text
);


--
-- Name: TABLE fp_mh_phieu_kiem_ke_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_phieu_kiem_ke_chi_tiet IS 'Chi tiết từng dòng hàng kiểm kê; so_phieu, ngay, ten_kho... kéo từ phiếu';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke_chi_tiet.id_hang_hoa; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke_chi_tiet.id_hang_hoa IS '→ fp_mh_danh_sach_hang_hoa(id)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke_chi_tiet.so_luong_so; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke_chi_tiet.so_luong_so IS 'Số lượng theo sổ sách (tồn kho theo hệ thống)';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke_chi_tiet.so_luong_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke_chi_tiet.so_luong_thuc_te IS 'Số lượng đếm thực tế khi kiểm kê';


--
-- Name: COLUMN fp_mh_phieu_kiem_ke_chi_tiet.chenh_lech; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_phieu_kiem_ke_chi_tiet.chenh_lech IS 'Chênh lệch = thực tế - sổ (app/trigger điền)';


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kiem_ke_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_phieu_kiem_ke_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_phieu_kiem_ke_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kiem_ke ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_phieu_kiem_ke_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_phieu_kiem_ke_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_phieu_kiem_ke_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_tag_doi_tac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_tag_doi_tac (
    id bigint NOT NULL,
    ten_tag text NOT NULL
);


--
-- Name: TABLE fp_mh_tag_doi_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_tag_doi_tac IS 'Tag gắn cho đối tác (NCC/Khách hàng)';


--
-- Name: fp_mh_tag_doi_tac_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_tag_doi_tac ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_tag_doi_tac_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_thanh_toan_doi_tac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_thanh_toan_doi_tac (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    hang_muc_thanh_toan text NOT NULL,
    ngay date NOT NULL,
    id_don_vi bigint,
    id_doi_tac bigint NOT NULL,
    trang_thai text DEFAULT 'Chờ xử lý'::text NOT NULL,
    so_tien numeric(18,0) DEFAULT 0 NOT NULL,
    ngay_xu_ly date,
    ghi_chu text,
    id_nguoi_tao bigint,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    id_trang_thai_thanh_toan bigint
);


--
-- Name: TABLE fp_mh_thanh_toan_doi_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_thanh_toan_doi_tac IS 'Thanh toán đối tác – số phiếu, hạng mục, đối tác, số tiền, trạng thái (text)';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.so_phieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.so_phieu IS 'Mã phiếu / số chứng từ thanh toán';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.hang_muc_thanh_toan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.hang_muc_thanh_toan IS 'Hạng mục thanh toán';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.id_don_vi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.id_don_vi IS 'Đơn vị (phòng ban) – tham chiếu bảng phòng ban';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.id_doi_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.id_doi_tac IS 'Đối tác – tham chiếu bảng đối tác';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.trang_thai IS 'Trạng thái thanh toán – ghi text trực tiếp (VD: Chờ xử lý, Đã thanh toán)';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.so_tien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.so_tien IS 'Số tiền (VNĐ)';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.ngay_xu_ly; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.ngay_xu_ly IS 'Ngày xử lý thanh toán';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.id_nguoi_tao IS 'Người tạo – tham chiếu bảng nhân viên';


--
-- Name: COLUMN fp_mh_thanh_toan_doi_tac.id_trang_thai_thanh_toan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_thanh_toan_doi_tac.id_trang_thai_thanh_toan IS 'FK → fp_mh_trang_thai_thanh_toan_doi_tac.id; có thể dùng kèm cột trang_thai (text) để denormalize.';


--
-- Name: fp_mh_thanh_toan_doi_tac_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_thanh_toan_doi_tac ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_thanh_toan_doi_tac_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_thanh_toan_doi_tac_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_mh_thanh_toan_doi_tac_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_mh_tien_do_mua_hang; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_tien_do_mua_hang (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    mau text,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone,
    tg_cap_nhat timestamp with time zone
);


--
-- Name: fp_mh_tien_do_mua_hang_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_tien_do_mua_hang ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_mh_tien_do_mua_hang_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_mh_ton_kho; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.fp_mh_ton_kho WITH (security_invoker='on') AS
 WITH movements AS (
         SELECT p.kho_id,
            ct.id_hang_hoa,
            ct.so_luong AS delta
           FROM (public.fp_mh_phieu_kho p
             JOIN public.fp_mh_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = p.id)))
          WHERE ((p.trang_thai <> 'Không duyệt'::text) AND (p.loai = 'nhập'::text))
        UNION ALL
         SELECT p.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong) AS delta
           FROM (public.fp_mh_phieu_kho p
             JOIN public.fp_mh_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = p.id)))
          WHERE ((p.trang_thai <> 'Không duyệt'::text) AND (p.loai = 'xuất'::text))
        UNION ALL
         SELECT p.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong) AS delta
           FROM (public.fp_mh_phieu_kho p
             JOIN public.fp_mh_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = p.id)))
          WHERE ((p.trang_thai <> 'Không duyệt'::text) AND (p.loai = 'chuyển'::text) AND (p.kho_den_id IS NOT NULL))
        UNION ALL
         SELECT p.kho_den_id AS kho_id,
            ct.id_hang_hoa,
            ct.so_luong AS delta
           FROM (public.fp_mh_phieu_kho p
             JOIN public.fp_mh_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = p.id)))
          WHERE ((p.trang_thai <> 'Không duyệt'::text) AND (p.loai = 'chuyển'::text) AND (p.kho_den_id IS NOT NULL))
        )
 SELECT kho_id,
    id_hang_hoa,
    (sum(delta))::numeric(18,4) AS so_luong
   FROM movements
  GROUP BY kho_id, id_hang_hoa;


--
-- Name: VIEW fp_mh_ton_kho; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.fp_mh_ton_kho IS 'Tồn kho theo (kho, hàng hóa), tính từ phiếu nhập/xuất/chuyển đã duyệt';


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_mh_trang_thai_thanh_toan_doi_tac (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    mau text,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_mh_trang_thai_thanh_toan_doi_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_mh_trang_thai_thanh_toan_doi_tac IS 'Danh mục trạng thái thanh toán đối tác – dùng trong module Thiết lập đề xuất vật tư';


--
-- Name: COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_trang_thai_thanh_toan_doi_tac.ma IS 'Mã trạng thái (VD: CHO_THANH_TOAN, DA_THANH_TOAN)';


--
-- Name: COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_trang_thai_thanh_toan_doi_tac.ten IS 'Tên hiển thị (VD: Chờ thanh toán, Đã thanh toán)';


--
-- Name: COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_trang_thai_thanh_toan_doi_tac.thu_tu IS 'Thứ tự sắp xếp';


--
-- Name: COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.mau; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_trang_thai_thanh_toan_doi_tac.mau IS 'Mã màu hex (VD: #f59e0b)';


--
-- Name: COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_mh_trang_thai_thanh_toan_doi_tac.trang_thai IS 'Trạng thái hoạt động – text (Đang hoạt động / Ngừng hoạt động)';


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_trang_thai_thanh_toan_doi_tac ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_mh_trang_thai_thanh_toan_doi_tac_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_tc_hang_muc_thu_chi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_tc_hang_muc_thu_chi (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    loai text DEFAULT 'ca_hai'::text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    CONSTRAINT fp_tc_hang_muc_loai_check CHECK ((loai = ANY (ARRAY['thu'::text, 'chi'::text, 'ca_hai'::text]))),
    CONSTRAINT fp_tc_hang_muc_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['Đang hoạt động'::text, 'Ngừng hoạt động'::text])))
);


--
-- Name: TABLE fp_tc_hang_muc_thu_chi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_tc_hang_muc_thu_chi IS 'Hạng mục thu chi quỹ (Vật tư, Chi khác, Bốc khoán, Tạm ứng...) — cấu hình được ở module Thiết lập quỹ';


--
-- Name: COLUMN fp_tc_hang_muc_thu_chi.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.ma IS 'Mã hạng mục, viết hoa không dấu (VAT_TU, CHI_KHAC...) — duy nhất, dùng khi import Excel';


--
-- Name: COLUMN fp_tc_hang_muc_thu_chi.loai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.loai IS 'thu = chỉ dùng cho phiếu thu; chi = chỉ phiếu chi; ca_hai = dùng cho cả hai';


--
-- Name: COLUMN fp_tc_hang_muc_thu_chi.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.thu_tu IS 'Thứ tự hiển thị trong combobox (nhỏ trước)';


--
-- Name: COLUMN fp_tc_hang_muc_thu_chi.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.trang_thai IS 'Ngừng hoạt động: không hiện trong combobox phiếu mới, phiếu cũ vẫn giữ nguyên';


--
-- Name: fp_tc_hang_muc_thu_chi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_tc_hang_muc_thu_chi ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_tc_hang_muc_thu_chi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_tc_quy_chi_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_tc_quy_chi_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_tc_quy_thu_chi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_tc_quy_thu_chi (
    id bigint NOT NULL,
    so_phieu text NOT NULL,
    ngay date NOT NULL,
    id_chi_nhanh bigint NOT NULL,
    ten_chi_nhanh text,
    loai text NOT NULL,
    so_tien numeric(18,2) DEFAULT 0 NOT NULL,
    so_luong numeric(18,4),
    don_gia numeric(18,2),
    id_hang_muc bigint,
    ten_hang_muc text,
    dien_giai text NOT NULL,
    ghi_chu text,
    loai_chung_tu text,
    id_chung_tu bigint,
    so_chung_tu text,
    id_nguoi_tao bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    trang_thai text DEFAULT 'mo'::text NOT NULL,
    id_nguoi_yeu_cau_mo bigint,
    ten_nguoi_yeu_cau_mo text,
    ly_do_yeu_cau_mo text,
    tg_yeu_cau_mo timestamp with time zone,
    id_nguoi_xu_ly_mo bigint,
    ten_nguoi_xu_ly_mo text,
    tg_xu_ly_mo timestamp with time zone,
    CONSTRAINT fp_tc_qtc_chung_tu_pair_check CHECK ((((loai_chung_tu IS NULL) AND (id_chung_tu IS NULL)) OR ((loai_chung_tu IS NOT NULL) AND (id_chung_tu IS NOT NULL)))),
    CONSTRAINT fp_tc_qtc_loai_check CHECK ((loai = ANY (ARRAY['thu'::text, 'chi'::text]))),
    CONSTRAINT fp_tc_qtc_loai_chung_tu_check CHECK (((loai_chung_tu IS NULL) OR (loai_chung_tu = ANY (ARRAY['don_dat_hang'::text, 'de_xuat_mua_hang'::text, 'chi_phi_tai_san'::text])))),
    CONSTRAINT fp_tc_qtc_so_tien_check CHECK ((so_tien >= (0)::numeric)),
    CONSTRAINT fp_tc_qtc_trang_thai_chk CHECK ((trang_thai = ANY (ARRAY['mo'::text, 'khoa'::text, 'cho_mo'::text])))
);


--
-- Name: TABLE fp_tc_quy_thu_chi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_tc_quy_thu_chi IS 'Sổ quỹ tiền mặt theo chi nhánh: phiếu thu / phiếu chi. Tồn quỹ lũy kế xem v_tc_quy_thu_chi_summary';


--
-- Name: COLUMN fp_tc_quy_thu_chi.so_phieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_phieu IS 'PT-0001 (thu) / PC-0001 (chi) — sinh từ sequence server, duy nhất';


--
-- Name: COLUMN fp_tc_quy_thu_chi.id_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_chi_nhanh IS 'Quỹ thuộc chi nhánh nào → fp_var_chi_nhanh(id). Quỹ theo CHI NHÁNH, không theo kho';


--
-- Name: COLUMN fp_tc_quy_thu_chi.ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ten_chi_nhanh IS 'Snapshot tên chi nhánh lúc lập phiếu (view trả thêm ref_ten_chi_nhanh là tên hiện tại)';


--
-- Name: COLUMN fp_tc_quy_thu_chi.loai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.loai IS 'thu = tiền vào quỹ; chi = tiền ra khỏi quỹ';


--
-- Name: COLUMN fp_tc_quy_thu_chi.so_tien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_tien IS 'Luôn là số dương; dấu do cột loai quyết định. Cột THU/CHI của Excel được derive ở view';


--
-- Name: COLUMN fp_tc_quy_thu_chi.so_luong; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_luong IS 'Cột SỐ LƯỢNG của sổ Excel — để trống được (không mặc định 0)';


--
-- Name: COLUMN fp_tc_quy_thu_chi.don_gia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.don_gia IS 'Cột ĐƠN GIÁ của sổ Excel — để trống được';


--
-- Name: COLUMN fp_tc_quy_thu_chi.ten_hang_muc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ten_hang_muc IS 'Snapshot tên hạng mục lúc lập phiếu';


--
-- Name: COLUMN fp_tc_quy_thu_chi.dien_giai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.dien_giai IS 'Cột DIỄN GIẢI MỤC ĐÍCH CHI của sổ Excel';


--
-- Name: COLUMN fp_tc_quy_thu_chi.loai_chung_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.loai_chung_tu IS 'Nguồn tiền: don_dat_hang | de_xuat_mua_hang | chi_phi_tai_san (NULL = phiếu quỹ độc lập)';


--
-- Name: COLUMN fp_tc_quy_thu_chi.id_chung_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_chung_tu IS 'Id phiếu nguồn — KHÔNG có FK vì trỏ tới 3 bảng khác nhau; xóa phiếu nguồn để lại phiếu quỹ mồ côi (chấp nhận: tiền đã chi thật), UI dựa vào so_chung_tu';


--
-- Name: COLUMN fp_tc_quy_thu_chi.so_chung_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_chung_tu IS 'Snapshot số phiếu nguồn (so_po / FDX-xxxx / CPTS-xxxx) — chính là cột SỐ ĐỀ XUẤT của sổ Excel';


--
-- Name: COLUMN fp_tc_quy_thu_chi.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.trang_thai IS 'mo = đang mở; khoa = đã khoá; cho_mo = đã xin mở lại, chờ cap_bac=1/quản trị duyệt';


--
-- Name: COLUMN fp_tc_quy_thu_chi.id_nguoi_yeu_cau_mo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_nguoi_yeu_cau_mo IS 'Người bấm "Xin mở khoá" (fp_var_nhan_vien.id)';


--
-- Name: COLUMN fp_tc_quy_thu_chi.ly_do_yeu_cau_mo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ly_do_yeu_cau_mo IS 'Lý do xin mở — bắt buộc nhập ở app';


--
-- Name: COLUMN fp_tc_quy_thu_chi.id_nguoi_xu_ly_mo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_nguoi_xu_ly_mo IS 'Người duyệt / từ chối yêu cầu mở khoá';


--
-- Name: fp_tc_quy_thu_chi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_tc_quy_thu_chi ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_tc_quy_thu_chi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_tc_quy_thu_so_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_tc_quy_thu_so_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_ts_chi_phi_tai_san; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_chi_phi_tai_san (
    id bigint NOT NULL,
    ngay date NOT NULL,
    id_tai_san bigint NOT NULL,
    ma_tai_san text,
    ten_tai_san text,
    id_hang_muc text NOT NULL,
    ten_hang_muc text,
    mo_ta text NOT NULL,
    so_tien numeric(18,2) DEFAULT 0 NOT NULL,
    ghi_chu text,
    id_trang_thai bigint NOT NULL,
    ten_trang_thai text,
    nguoi_duyet text,
    id_nguoi_tao bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    ma_phieu text NOT NULL
);


--
-- Name: TABLE fp_ts_chi_phi_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_chi_phi_tai_san IS 'Phiếu chi phí tài sản – Module Chi phí tài sản. Trạng thái lấy từ fp_ts_trang_thai_chi_phi_tai_san (id_trang_thai, ten_trang_thai).';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ngay; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ngay IS 'Ngày phiếu';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.id_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_tai_san IS 'ID tài sản (tham chiếu fp_ts_tai_san.id, không FK để linh hoạt)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ma_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ma_tai_san IS 'Mã tài sản (lưu tắt khi tạo/cập nhật)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ten_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_tai_san IS 'Tên tài sản (lưu tắt khi tạo/cập nhật)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.id_hang_muc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_hang_muc IS 'Hạng mục: bao_tri | sua_chua (text)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ten_hang_muc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_hang_muc IS 'Tên hạng mục (lưu tắt)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.mo_ta; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.mo_ta IS 'Mô tả nội dung chi phí';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.so_tien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.so_tien IS 'Số tiền';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ghi_chu IS 'Ghi chú';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.id_trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_trang_thai IS 'ID trạng thái phiếu – tham chiếu fp_ts_trang_thai_chi_phi_tai_san(id)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ten_trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_trang_thai IS 'Tên trạng thái phiếu (lưu tắt từ bảng thiết lập khi tạo/cập nhật)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.nguoi_duyet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.nguoi_duyet IS 'Tên người duyệt';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_nguoi_tao IS 'ID người tạo';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ten_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_nguoi_tao IS 'Tên người tạo (lưu tắt)';


--
-- Name: COLUMN fp_ts_chi_phi_tai_san.ma_phieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ma_phieu IS 'Mã phiếu chi phí tài sản – tự sinh CPTS-0001, CPTS-0002, ... (RPC get_next_ma_phieu_chi_phi_tai_san)';


--
-- Name: fp_ts_chi_phi_tai_san_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_chi_phi_tai_san ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_chi_phi_tai_san_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_chi_phi_tai_san_ma_phieu_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_ts_chi_phi_tai_san_ma_phieu_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_ts_chi_tiet_khau_hao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_chi_tiet_khau_hao (
    id bigint NOT NULL,
    id_ky_khau_hao bigint NOT NULL,
    id_tai_san bigint NOT NULL,
    ma_tai_san text,
    ten_tai_san text,
    id_nhom bigint NOT NULL,
    ten_nhom text,
    nguyen_gia numeric(18,2) DEFAULT 0 NOT NULL,
    gia_tri_con_lai_dau_ky numeric(18,2) DEFAULT 0 NOT NULL,
    khau_hao_ky numeric(18,2) DEFAULT 0 NOT NULL,
    khau_hao_luy_ke numeric(18,2) DEFAULT 0 NOT NULL,
    gia_tri_con_lai_cuoi_ky numeric(18,2) DEFAULT 0 NOT NULL,
    ten_noi_luu text,
    ten_nguoi_giu text,
    id_nguoi_tao bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_ts_chi_tiet_khau_hao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_chi_tiet_khau_hao IS 'Chi tiết khấu hao theo tài sản trong từng kỳ. Sinh ra khi bấm Tính toán; dùng để chốt kỳ cập nhật fp_ts_tai_san.gia_tri_con_lai, khau_hao_luy_ke.';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.id_ky_khau_hao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_ky_khau_hao IS 'FK → fp_ts_ky_khau_hao(id)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.id_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_tai_san IS 'FK → fp_ts_tai_san(id)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.ma_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ma_tai_san IS 'Mã tài sản (lưu tắt khi tạo chi tiết)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.ten_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_tai_san IS 'Tên tài sản (lưu tắt)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.id_nhom; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_nhom IS 'ID nhóm tài sản (từ tài sản)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.ten_nhom; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_nhom IS 'Tên nhóm (lưu tắt)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.nguyen_gia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.nguyen_gia IS 'Nguyên giá tài sản tại thời điểm tính';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.gia_tri_con_lai_dau_ky; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.gia_tri_con_lai_dau_ky IS 'Giá trị còn lại đầu kỳ (trước khi trích khấu hao kỳ)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.khau_hao_ky; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.khau_hao_ky IS 'Số tiền khấu hao trong kỳ (1 tháng)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.khau_hao_luy_ke; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.khau_hao_luy_ke IS 'Khấu hao lũy kế sau kỳ (đầu kỳ + khấu hao kỳ)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.gia_tri_con_lai_cuoi_ky; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.gia_tri_con_lai_cuoi_ky IS 'Giá trị còn lại cuối kỳ (ghi vào fp_ts_tai_san khi chốt)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.ten_noi_luu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_noi_luu IS 'Tên nơi lưu (lưu tắt)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.ten_nguoi_giu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_nguoi_giu IS 'Tên nhân viên đang giữ (lưu tắt)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_nguoi_tao IS 'ID người tạo/tính toán (có thể = người tạo kỳ)';


--
-- Name: COLUMN fp_ts_chi_tiet_khau_hao.ten_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_nguoi_tao IS 'Tên người tạo (lưu tắt)';


--
-- Name: fp_ts_chi_tiet_khau_hao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_chi_tiet_khau_hao ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_chi_tiet_khau_hao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_dot_kiem_ke_tai_san; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_dot_kiem_ke_tai_san (
    id bigint NOT NULL,
    ma_dot text NOT NULL,
    ten_dot text NOT NULL,
    ngay_bat_dau date NOT NULL,
    ngay_ket_thuc date NOT NULL,
    trang_thai text DEFAULT 'Nháp'::text NOT NULL,
    id_nguoi_phu_trach bigint NOT NULL,
    id_nhom bigint[] DEFAULT '{}'::bigint[],
    id_noi_luu bigint[] DEFAULT '{}'::bigint[],
    ghi_chu text,
    trang_thai_active text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    id_nguoi_giu bigint[]
);


--
-- Name: TABLE fp_ts_dot_kiem_ke_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_dot_kiem_ke_tai_san IS 'Đợt kiểm kê tài sản – mã đợt, tên, ngày, trạng thái, người phụ trách; phạm vi theo nhóm/nơi lưu (mảng rỗng = tất cả)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.ma_dot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ma_dot IS 'Mã đợt kiểm kê (unique)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.ten_dot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ten_dot IS 'Tên đợt kiểm kê';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.ngay_bat_dau; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ngay_bat_dau IS 'Ngày bắt đầu đợt';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.ngay_ket_thuc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ngay_ket_thuc IS 'Ngày kết thúc đợt';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.trang_thai IS 'Nháp | Đang kiểm kê | Hoàn thành';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.id_nguoi_phu_trach; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.id_nguoi_phu_trach IS 'Người phụ trách → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.id_nhom; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.id_nhom IS 'Phạm vi nhóm tài sản (mảng ID); rỗng = tất cả nhóm';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.id_noi_luu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.id_noi_luu IS 'Phạm vi nơi lưu (mảng ID); rỗng = tất cả nơi lưu';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san.trang_thai_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.trang_thai_active IS 'Đang hoạt động | Ngừng hoạt động';


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet (
    id bigint NOT NULL,
    id_dot_kiem_ke bigint NOT NULL,
    id_tai_san bigint NOT NULL,
    ma_tai_san text,
    ten_tai_san text,
    id_noi_luu_so bigint NOT NULL,
    ten_noi_luu_so text,
    id_nguoi_giu_so bigint,
    ten_nguoi_giu_so text,
    id_trang_thai_so bigint NOT NULL,
    ten_trang_thai_so text,
    id_noi_luu_thuc_te bigint,
    ten_noi_luu_thuc_te text,
    id_nguoi_giu_thuc_te bigint,
    ten_nguoi_giu_thuc_te text,
    id_trang_thai_thuc_te bigint,
    ten_trang_thai_thuc_te text,
    ket_qua text DEFAULT 'Chưa kiểm'::text NOT NULL,
    ghi_chu_dong text,
    id_nguoi_kiem bigint,
    ngay_kiem timestamp with time zone,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet IS 'Chi tiết kiểm kê tài sản: mỗi dòng = một tài sản trong đợt; sổ (snapshot) vs thực tế (người kiểm nhập), kết quả so sánh';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_tai_san IS 'Tài sản → fp_ts_tai_san(id)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.ma_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.ma_tai_san IS 'Mã tài sản (snapshot khi tạo danh sách)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.ten_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.ten_tai_san IS 'Tên tài sản (snapshot)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_noi_luu_so; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_noi_luu_so IS 'Nơi lưu theo sổ (snapshot) → fp_hc_noi_quan_ly(id)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_giu_so; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_giu_so IS 'Người giữ theo sổ (snapshot) → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_trang_thai_so; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_trang_thai_so IS 'Trạng thái theo sổ (snapshot) → fp_ts_trang_thai_tai_san(id)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_noi_luu_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_noi_luu_thuc_te IS 'Nơi lưu thực tế (người kiểm nhập)';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_giu_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_giu_thuc_te IS 'Người giữ thực tế';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_trang_thai_thuc_te; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_trang_thai_thuc_te IS 'Trạng thái thực tế';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.ket_qua; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.ket_qua IS 'Chưa kiểm | Khớp | Chênh nơi lưu | Chênh người giữ | Chênh trạng thái | Thiếu';


--
-- Name: COLUMN fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_kiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_kiem IS 'Người nhập kết quả kiểm → fp_var_nhan_vien(id)';


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_dot_kiem_ke_tai_san_chi_tiet_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_dot_kiem_ke_tai_san_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_dot_kiem_ke_tai_san ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_dot_kiem_ke_tai_san_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_ky_khau_hao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_ky_khau_hao (
    id bigint NOT NULL,
    thang smallint NOT NULL,
    nam smallint NOT NULL,
    trang_thai text DEFAULT 'draft'::text NOT NULL,
    tong_nguyen_gia numeric(18,2),
    tong_khau_hao_ky numeric(18,2),
    ghi_chu text,
    id_nguoi_tao bigint,
    ten_nguoi_tao text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    CONSTRAINT fp_ts_ky_khau_hao_nam_check CHECK (((nam >= 2000) AND (nam <= 2100))),
    CONSTRAINT fp_ts_ky_khau_hao_thang_check CHECK (((thang >= 1) AND (thang <= 12))),
    CONSTRAINT fp_ts_ky_khau_hao_trang_thai_check CHECK ((trang_thai = ANY (ARRAY['draft'::text, 'chot'::text])))
);


--
-- Name: TABLE fp_ts_ky_khau_hao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_ky_khau_hao IS 'Kỳ khấu hao tài sản – một tháng trong một năm. draft = nháp (tính toán, sửa/xóa được); chot = đã chốt (cập nhật sổ tài sản).';


--
-- Name: COLUMN fp_ts_ky_khau_hao.thang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.thang IS 'Tháng (1–12)';


--
-- Name: COLUMN fp_ts_ky_khau_hao.nam; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.nam IS 'Năm (VD: 2025)';


--
-- Name: COLUMN fp_ts_ky_khau_hao.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.trang_thai IS 'draft = Nháp | chot = Đã chốt';


--
-- Name: COLUMN fp_ts_ky_khau_hao.tong_nguyen_gia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.tong_nguyen_gia IS 'Tổng nguyên giá các tài sản trong kỳ (tính từ chi tiết khi Tính toán)';


--
-- Name: COLUMN fp_ts_ky_khau_hao.tong_khau_hao_ky; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.tong_khau_hao_ky IS 'Tổng khấu hao kỳ (tính từ chi tiết)';


--
-- Name: COLUMN fp_ts_ky_khau_hao.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.ghi_chu IS 'Ghi chú kỳ khấu hao';


--
-- Name: COLUMN fp_ts_ky_khau_hao.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.id_nguoi_tao IS 'ID người tạo kỳ (tham chiếu nhân viên)';


--
-- Name: COLUMN fp_ts_ky_khau_hao.ten_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_ky_khau_hao.ten_nguoi_tao IS 'Tên người tạo (lưu tắt khi tạo)';


--
-- Name: fp_ts_ky_khau_hao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_ky_khau_hao ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_ky_khau_hao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_loai_chi_phi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_loai_chi_phi (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_ts_loai_chi_phi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_loai_chi_phi IS 'Danh mục loại chi phí – Thiết lập tài sản (VD: Sửa chữa, Bảo trì, Nâng cấp, Thay thế linh kiện). Dùng cho phiếu bảo trì sửa chữa, theo dõi chi phí tài sản.';


--
-- Name: COLUMN fp_ts_loai_chi_phi.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_loai_chi_phi.ma IS 'Mã loại chi phí (VD: SUA_CHUA, BAO_TRI, NANG_CAP, THAY_LINH_KIEN)';


--
-- Name: COLUMN fp_ts_loai_chi_phi.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_loai_chi_phi.ten IS 'Tên hiển thị loại chi phí';


--
-- Name: COLUMN fp_ts_loai_chi_phi.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_loai_chi_phi.thu_tu IS 'Thứ tự sắp xếp';


--
-- Name: COLUMN fp_ts_loai_chi_phi.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_loai_chi_phi.ghi_chu IS 'Ghi chú tùy chọn';


--
-- Name: COLUMN fp_ts_loai_chi_phi.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_loai_chi_phi.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';


--
-- Name: fp_ts_loai_chi_phi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_loai_chi_phi ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_loai_chi_phi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_nhom_tai_san; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_nhom_tai_san (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ghi_chu text,
    phuong_phap_khau_hao text DEFAULT 'duong_thang'::text NOT NULL,
    ty_le_khau_hao numeric(5,2),
    so_nam_su_dung integer,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_ts_nhom_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_nhom_tai_san IS 'Danh mục nhóm tài sản – Thiết lập tài sản, tham số khấu hao dùng cho Danh sách tài sản và Khấu hao';


--
-- Name: COLUMN fp_ts_nhom_tai_san.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ma IS 'Mã nhóm (VD: TBD_VAN_PHONG, TBD_CNTT)';


--
-- Name: COLUMN fp_ts_nhom_tai_san.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ten IS 'Tên hiển thị nhóm tài sản';


--
-- Name: COLUMN fp_ts_nhom_tai_san.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.thu_tu IS 'Thứ tự sắp xếp';


--
-- Name: COLUMN fp_ts_nhom_tai_san.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ghi_chu IS 'Ghi chú tùy chọn';


--
-- Name: COLUMN fp_ts_nhom_tai_san.phuong_phap_khau_hao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.phuong_phap_khau_hao IS 'Phương pháp: duong_thang (đường thẳng) | so_du_giam_dan (số dư giảm dần)';


--
-- Name: COLUMN fp_ts_nhom_tai_san.ty_le_khau_hao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ty_le_khau_hao IS 'Tỷ lệ khấu hao % (VD: 20, 25). Null nếu chỉ dùng so_nam_su_dung';


--
-- Name: COLUMN fp_ts_nhom_tai_san.so_nam_su_dung; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.so_nam_su_dung IS 'Số năm sử dụng (thời gian khấu hao). Null nếu tính theo ty_le_khau_hao';


--
-- Name: COLUMN fp_ts_nhom_tai_san.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_nhom_tai_san.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';


--
-- Name: fp_ts_nhom_tai_san_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_nhom_tai_san ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_nhom_tai_san_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_phieu_cap_phat_thu_hoi (
    id bigint NOT NULL,
    ma_phieu text NOT NULL,
    loai_phieu text NOT NULL,
    id_nguoi_giu_truoc bigint,
    ten_nguoi_giu_truoc text,
    ma_nguoi_giu_truoc text,
    id_nguoi_giu_sau bigint,
    ten_nguoi_giu_sau text,
    ma_nguoi_giu_sau text,
    ngay_thuc_hien date NOT NULL,
    id_nguoi_thuc_hien bigint NOT NULL,
    ten_nguoi_thuc_hien text,
    id_nguoi_tao bigint,
    ten_nguoi_tao text,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now(),
    CONSTRAINT fp_ts_phieu_cap_phat_thu_hoi_loai_phieu_check CHECK ((loai_phieu = ANY (ARRAY['Cấp phát'::text, 'Thu hồi'::text, 'Luân chuyển vị trí'::text, 'Luân chuyển người quản lý'::text, 'Luân chuyển cả hai'::text])))
);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_phieu_cap_phat_thu_hoi_ct (
    id bigint NOT NULL,
    id_phieu bigint NOT NULL,
    id_tai_san bigint NOT NULL,
    ma_tai_san text,
    ten_tai_san text,
    id_noi_luu_truoc bigint,
    ten_noi_luu_truoc text,
    id_noi_luu_sau bigint,
    ten_noi_luu_sau text,
    ghi_chu text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_phieu_cap_phat_thu_hoi_ct ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_phieu_cap_phat_thu_hoi_ct_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_phieu_cap_phat_thu_hoi ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_phieu_cap_phat_thu_hoi_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_phieu_cpth_seq_cap_phat; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_ts_phieu_cpth_seq_cap_phat
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_ts_phieu_cpth_seq_luan_chuyen; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_ts_phieu_cpth_seq_luan_chuyen
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_ts_phieu_cpth_seq_thu_hoi; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fp_ts_phieu_cpth_seq_thu_hoi
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fp_ts_tai_san; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_tai_san (
    id bigint NOT NULL,
    ma_tai_san text NOT NULL,
    ten_tai_san text NOT NULL,
    id_nhom bigint NOT NULL,
    ten_nhom text,
    id_noi_luu bigint NOT NULL,
    ten_noi_luu text,
    id_chi_nhanh bigint,
    ten_chi_nhanh text,
    id_trang_thai bigint NOT NULL,
    ten_trang_thai text,
    id_nhan_vien bigint,
    ten_nhan_vien text,
    thuong_hieu text,
    model text,
    serial text,
    xuat_xu text,
    ma_barcode text,
    ten_nha_cung_cap text,
    id_nguoi_tao bigint,
    ten_nguoi_tao text,
    ngay_nhap date NOT NULL,
    nguyen_gia numeric(18,2),
    ngay_bat_dau_trich_khau_hao date,
    gia_tri_con_lai numeric(18,2),
    khau_hao_luy_ke numeric(18,2) DEFAULT 0,
    hinh_anh text,
    ghi_chu text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_ts_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_tai_san IS 'Danh sách tài sản – Hành chính. Liên kết nhóm, nơi lưu, trạng thái tài sản; dùng cho Cấp phát thu hồi, Khấu hao, Kiểm kê.';


--
-- Name: COLUMN fp_ts_tai_san.ma_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ma_tai_san IS 'Mã tài sản (VD: TS-VP-001)';


--
-- Name: COLUMN fp_ts_tai_san.ten_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_tai_san IS 'Tên tài sản';


--
-- Name: COLUMN fp_ts_tai_san.id_nhom; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.id_nhom IS 'ID nhóm tài sản; tham chiếu fp_ts_nhom_tai_san(id)';


--
-- Name: COLUMN fp_ts_tai_san.ten_nhom; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_nhom IS 'Tên nhóm tài sản (lưu tắt khi tạo/cập nhật)';


--
-- Name: COLUMN fp_ts_tai_san.id_noi_luu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.id_noi_luu IS 'ID nơi lưu (nơi quản lý); tham chiếu fp_hc_noi_quan_ly(id)';


--
-- Name: COLUMN fp_ts_tai_san.ten_noi_luu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_noi_luu IS 'Tên nơi lưu (lưu tắt khi tạo/cập nhật)';


--
-- Name: COLUMN fp_ts_tai_san.id_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.id_chi_nhanh IS 'ID chi nhánh (từ nơi lưu hoặc cấu hình)';


--
-- Name: COLUMN fp_ts_tai_san.ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_chi_nhanh IS 'Tên chi nhánh (lưu tắt)';


--
-- Name: COLUMN fp_ts_tai_san.id_trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.id_trang_thai IS 'ID trạng thái tài sản (Mới, Đang dùng, Bảo trì...); tham chiếu fp_ts_trang_thai_tai_san(id)';


--
-- Name: COLUMN fp_ts_tai_san.ten_trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_trang_thai IS 'Tên trạng thái tài sản (lưu tắt khi tạo/cập nhật)';


--
-- Name: COLUMN fp_ts_tai_san.id_nhan_vien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.id_nhan_vien IS 'Nhân viên đang giữ (cấp phát); null nếu đang ở kho/nơi lưu';


--
-- Name: COLUMN fp_ts_tai_san.ten_nhan_vien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_nhan_vien IS 'Tên nhân viên đang giữ (lưu tắt)';


--
-- Name: COLUMN fp_ts_tai_san.thuong_hieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.thuong_hieu IS 'Thương hiệu';


--
-- Name: COLUMN fp_ts_tai_san.model; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.model IS 'Model';


--
-- Name: COLUMN fp_ts_tai_san.serial; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.serial IS 'Số serial';


--
-- Name: COLUMN fp_ts_tai_san.xuat_xu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.xuat_xu IS 'Xuất xứ';


--
-- Name: COLUMN fp_ts_tai_san.ma_barcode; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ma_barcode IS 'Mã Barcode';


--
-- Name: COLUMN fp_ts_tai_san.ten_nha_cung_cap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_nha_cung_cap IS 'Tên nhà cung cấp';


--
-- Name: COLUMN fp_ts_tai_san.id_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.id_nguoi_tao IS 'Người tạo bản ghi → fp_var_nhan_vien(id)';


--
-- Name: COLUMN fp_ts_tai_san.ten_nguoi_tao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ten_nguoi_tao IS 'Tên người tạo (lưu tắt khi tạo)';


--
-- Name: COLUMN fp_ts_tai_san.ngay_nhap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ngay_nhap IS 'Ngày nhập tài sản';


--
-- Name: COLUMN fp_ts_tai_san.nguyen_gia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.nguyen_gia IS 'Nguyên giá';


--
-- Name: COLUMN fp_ts_tai_san.ngay_bat_dau_trich_khau_hao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ngay_bat_dau_trich_khau_hao IS 'Ngày bắt đầu trích khấu hao; null = dùng ngay_nhap';


--
-- Name: COLUMN fp_ts_tai_san.gia_tri_con_lai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.gia_tri_con_lai IS 'Giá trị còn lại (cập nhật khi chốt kỳ khấu hao)';


--
-- Name: COLUMN fp_ts_tai_san.khau_hao_luy_ke; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.khau_hao_luy_ke IS 'Khấu hao lũy kế (cập nhật khi chốt kỳ khấu hao)';


--
-- Name: COLUMN fp_ts_tai_san.hinh_anh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.hinh_anh IS 'URL ảnh tài sản';


--
-- Name: COLUMN fp_ts_tai_san.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_tai_san.ghi_chu IS 'Ghi chú';


--
-- Name: fp_ts_tai_san_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_tai_san ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_tai_san_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_trang_thai_chi_phi_tai_san (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_ts_trang_thai_chi_phi_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_trang_thai_chi_phi_tai_san IS 'Danh mục trạng thái phiếu chi phí tài sản – Thiết lập (Chờ duyệt, Đã duyệt, Không duyệt). Dùng cho bảng fp_ts_chi_phi_tai_san.id_trang_thai.';


--
-- Name: COLUMN fp_ts_trang_thai_chi_phi_tai_san.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.ma IS 'Mã trạng thái (CHO_DUYET, DA_DUYET, KHONG_DUYET)';


--
-- Name: COLUMN fp_ts_trang_thai_chi_phi_tai_san.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.ten IS 'Tên hiển thị trạng thái phiếu';


--
-- Name: COLUMN fp_ts_trang_thai_chi_phi_tai_san.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.thu_tu IS 'Thứ tự sắp xếp';


--
-- Name: COLUMN fp_ts_trang_thai_chi_phi_tai_san.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_chi_phi_tai_san.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_trang_thai_chi_phi_tai_san ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_trang_thai_chi_phi_tai_san_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_ts_trang_thai_tai_san; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_ts_trang_thai_tai_san (
    id bigint NOT NULL,
    ma text NOT NULL,
    ten text NOT NULL,
    thu_tu integer DEFAULT 0 NOT NULL,
    ghi_chu text,
    trang_thai text DEFAULT 'Đang hoạt động'::text NOT NULL,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_ts_trang_thai_tai_san; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_ts_trang_thai_tai_san IS 'Danh mục trạng thái tài sản – Thiết lập tài sản (Mới, Đang dùng, Bảo trì, Thanh lý...)';


--
-- Name: COLUMN fp_ts_trang_thai_tai_san.ma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.ma IS 'Mã trạng thái (VD: MOI, DANG_SU_DUNG, BAO_TRI, THANH_LY)';


--
-- Name: COLUMN fp_ts_trang_thai_tai_san.ten; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.ten IS 'Tên hiển thị trạng thái';


--
-- Name: COLUMN fp_ts_trang_thai_tai_san.thu_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.thu_tu IS 'Thứ tự sắp xếp';


--
-- Name: COLUMN fp_ts_trang_thai_tai_san.ghi_chu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.ghi_chu IS 'Ghi chú tùy chọn';


--
-- Name: COLUMN fp_ts_trang_thai_tai_san.trang_thai; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';


--
-- Name: fp_ts_trang_thai_tai_san_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_trang_thai_tai_san ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_ts_trang_thai_tai_san_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_cap_bac; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_cap_bac (
    id bigint NOT NULL,
    ten_cap_bac text,
    cap_bac smallint,
    mo_ta text,
    trang_thai text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: fp_var_cap_bac_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_cap_bac ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_var_cap_bac_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_chi_nhanh; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_chi_nhanh (
    id bigint NOT NULL,
    ma_chi_nhanh text,
    ten_chi_nhanh text,
    dia_chi text,
    tinh_thanh text DEFAULT 'Gia Lai'::text,
    quan_huyen text DEFAULT 'Chư Prông'::text,
    vi_do double precision,
    kinh_do double precision,
    duong_dan_map text,
    trang_thai text DEFAULT 'Đang dùng'::text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE fp_var_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_chi_nhanh IS 'Chi nhánh Farm ERP - Khu vực Gia Lai';


--
-- Name: fp_var_chi_nhanh_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_chi_nhanh ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_var_chi_nhanh_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_chuc_vu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_chuc_vu (
    id bigint NOT NULL,
    ten_chuc_vu text,
    phong_ban_id bigint,
    cap_bac_id bigint,
    mo_ta text,
    tt smallint,
    trang_thai text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: fp_var_chuc_vu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_chuc_vu ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_var_chuc_vu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_lan_dang_nhap_sai; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_lan_dang_nhap_sai (
    id bigint NOT NULL,
    email text NOT NULL,
    ip text,
    luc timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: fp_var_lan_dang_nhap_sai_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_lan_dang_nhap_sai ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_var_lan_dang_nhap_sai_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_nhan_vien; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_nhan_vien (
    id bigint NOT NULL,
    ho_va_ten text,
    hinh_anh text,
    trang_thai text,
    phong_ban_id bigint,
    ten_phong_ban text,
    chuc_vu_id bigint,
    ten_chuc_vu text,
    email text,
    so_dien_thoai text,
    gioi_tinh text,
    ngay_vao_lam date,
    ngay_sinh date,
    cmnd_cccd text,
    ngay_cap_cccd date,
    noi_cap_cccd text,
    quoc_tich text,
    dan_toc text,
    ton_giao text,
    tinh_thanh text,
    quan_huyen text,
    phuong_xa text,
    dia_chi_cu_the text,
    dia_chi_tam_tru text,
    loai_hop_dong text,
    ngay_het_han_hd date,
    noi_lam_viec text,
    email_ca_nhan text,
    nguoi_lien_he_khan_cap text,
    sdt_khan_cap text,
    quan_he_khan_cap text,
    tinh_trang_hon_nhan text,
    so_nguoi_phu_thuoc integer,
    trinh_do_hoc_van text,
    chuyen_nganh text,
    truong_hoc text,
    nam_tot_nghiep text,
    chung_chi text,
    so_tai_khoan text,
    ten_ngan_hang text,
    chi_nhanh_nh text,
    ma_so_thue_ca_nhan text,
    so_bhxh text,
    so_bhyt text,
    ngay_tham_gia_bh date,
    noi_dang_ky_kcb text,
    cap_bac_id bigint,
    ten_cap_bac text,
    cap_bac smallint,
    chi_nhanh_ids text[] DEFAULT '{}'::text[],
    ten_chi_nhanh text,
    mat_khau_hash text,
    phai_doi_mat_khau boolean DEFAULT false NOT NULL,
    mat_khau_cap_nhat_luc timestamp with time zone
);


--
-- Name: COLUMN fp_var_nhan_vien.ten_phong_ban; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.ten_phong_ban IS 'Tên phòng ban (sync từ fp_var_phong_ban theo phong_ban_id)';


--
-- Name: COLUMN fp_var_nhan_vien.ten_chuc_vu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.ten_chuc_vu IS 'Tên chức vụ (sync từ fp_var_chuc_vu theo chuc_vu_id)';


--
-- Name: COLUMN fp_var_nhan_vien.ten_cap_bac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.ten_cap_bac IS 'Tên cấp bậc (sync từ fp_var_cap_bac theo cap_bac_id)';


--
-- Name: COLUMN fp_var_nhan_vien.cap_bac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.cap_bac IS 'SỐ cấp bậc, denormalize từ fp_var_cap_bac.cap_bac qua cap_bac_id (trigger tự đồng bộ). App dùng cap_bac = 1 làm điều kiện toàn quyền.';


--
-- Name: COLUMN fp_var_nhan_vien.chi_nhanh_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.chi_nhanh_ids IS 'Danh sách id chi nhánh (nhiều chi nhánh cho 1 nhân viên).';


--
-- Name: COLUMN fp_var_nhan_vien.ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.ten_chi_nhanh IS 'Tên chi nhánh (gộp từ fp_var_chi_nhanh theo chi_nhanh_ids)';


--
-- Name: COLUMN fp_var_nhan_vien.mat_khau_hash; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.mat_khau_hash IS 'Bcrypt hash (format $2a$10$...) — tương thích auth.users.encrypted_password. Chỉ ghi qua rpc_set_mat_khau, KHÔNG select ra frontend.';


--
-- Name: COLUMN fp_var_nhan_vien.phai_doi_mat_khau; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.phai_doi_mat_khau IS 'TRUE khi mật khẩu đang là mặc định/do admin cấp — buộc user đổi ở lần đăng nhập kế tiếp.';


--
-- Name: COLUMN fp_var_nhan_vien.mat_khau_cap_nhat_luc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_nhan_vien.mat_khau_cap_nhat_luc IS 'Lần cuối mat_khau_hash được ghi.';


--
-- Name: fp_var_nhan_vien_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_nhan_vien ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_var_nhan_vien_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_phan_quyen; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_phan_quyen (
    id bigint NOT NULL,
    chuc_vu_id bigint NOT NULL,
    module_id text NOT NULL,
    actions text[] DEFAULT '{}'::text[] NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_fp_var_phan_quyen_actions CHECK ((actions <@ ARRAY['view'::text, 'create'::text, 'update'::text, 'delete'::text, 'admin'::text, 'all'::text, 'approve'::text]))
);


--
-- Name: TABLE fp_var_phan_quyen; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_phan_quyen IS 'Phân quyền theo chức vụ: mỗi dòng = 1 chức vụ + 1 module + danh sách hành động (view, create, update, delete, admin, all)';


--
-- Name: COLUMN fp_var_phan_quyen.chuc_vu_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_phan_quyen.chuc_vu_id IS 'Chức vụ được gán quyền → fp_var_chuc_vu(id)';


--
-- Name: COLUMN fp_var_phan_quyen.module_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_phan_quyen.module_id IS 'Mã module (vd: hanh-chinh/cong-viec, he-thong/phan-quyen)';


--
-- Name: COLUMN fp_var_phan_quyen.actions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_phan_quyen.actions IS 'Danh sách quyền: view, create, update, delete, admin, all, approve (approve chỉ dùng cho module có chức năng phê duyệt)';


--
-- Name: COLUMN fp_var_phan_quyen.tg_cap_nhat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_phan_quyen.tg_cap_nhat IS 'Thời điểm cập nhật lần cuối';


--
-- Name: fp_var_phan_quyen_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_phan_quyen ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_var_phan_quyen_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_phien_dang_nhap; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_phien_dang_nhap (
    id bigint NOT NULL,
    nhan_vien_id bigint NOT NULL,
    email text NOT NULL,
    refresh_hash text NOT NULL,
    het_han_luc timestamp with time zone NOT NULL,
    thu_hoi_luc timestamp with time zone,
    tao_luc timestamp with time zone DEFAULT now() NOT NULL,
    dung_lan_cuoi timestamp with time zone,
    user_agent text,
    ip text
);


--
-- Name: TABLE fp_var_phien_dang_nhap; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_phien_dang_nhap IS 'Phiên đăng nhập của auth-service. refresh_hash = SHA-256 hex của refresh token, token thô không bao giờ được lưu.';


--
-- Name: fp_var_phien_dang_nhap_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_phien_dang_nhap ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_var_phien_dang_nhap_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_phong_ban; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_phong_ban (
    id bigint NOT NULL,
    ten_phong_ban text,
    chuc_nang text,
    tt smallint,
    trang_thai text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone
);


--
-- Name: fp_var_phong_ban_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_phong_ban ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.fp_var_phong_ban_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_push_subscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_push_subscription (
    id bigint NOT NULL,
    nhan_vien_id bigint NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth_key text NOT NULL,
    user_agent text,
    ten_thiet_bi text,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_dung_cuoi timestamp with time zone,
    so_lan_loi integer DEFAULT 0 NOT NULL
);


--
-- Name: TABLE fp_var_push_subscription; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_push_subscription IS 'Đăng ký Web Push theo thiết bị. endpoint là khoá tự nhiên do trình duyệt cấp.';


--
-- Name: COLUMN fp_var_push_subscription.endpoint; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_push_subscription.endpoint IS 'URL push service do trình duyệt cấp — duy nhất toàn hệ thống';


--
-- Name: COLUMN fp_var_push_subscription.p256dh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_push_subscription.p256dh IS 'Khoá công khai của client, dùng mã hoá payload';


--
-- Name: COLUMN fp_var_push_subscription.auth_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_push_subscription.auth_key IS 'Khoá xác thực của client (trường ''auth'' trong PushSubscription)';


--
-- Name: COLUMN fp_var_push_subscription.ten_thiet_bi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_push_subscription.ten_thiet_bi IS 'Nhãn dễ đọc suy từ user agent, ví dụ ''Chrome trên Windows'' — hiện trong trang cài đặt';


--
-- Name: COLUMN fp_var_push_subscription.so_lan_loi; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_push_subscription.so_lan_loi IS 'Đếm lỗi gửi liên tiếp. Push service trả 404/410 thì worker xoá thẳng dòng này.';


--
-- Name: fp_var_push_subscription_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_push_subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_var_push_subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_su_kien_thong_bao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_su_kien_thong_bao (
    id bigint NOT NULL,
    module_id text NOT NULL,
    bang text NOT NULL,
    ban_ghi_id bigint NOT NULL,
    thao_tac text NOT NULL,
    trang_thai_cu text,
    trang_thai_moi text,
    actor_id bigint,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    payload_cu jsonb,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_xu_ly timestamp with time zone,
    so_lan_thu integer DEFAULT 0 NOT NULL,
    loi_cuoi text,
    CONSTRAINT ck_fp_var_su_kien_thao_tac CHECK ((thao_tac = ANY (ARRAY['INSERT'::text, 'UPDATE'::text])))
);


--
-- Name: TABLE fp_var_su_kien_thong_bao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_su_kien_thong_bao IS 'Outbox sự kiện thông báo. Trigger nghiệp vụ ghi vào đây; worker services/notify đọc ra, định tuyến người nhận rồi ghi fp_var_thong_bao.';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.module_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.module_id IS 'Mã module dạng ''kho-van/phieu-kho'' — khớp module_id trong fp_var_phan_quyen và PERMISSION_FUNCTIONS phía app.';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.bang; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.bang IS 'Tên bảng nghiệp vụ sinh ra sự kiện';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.ban_ghi_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.ban_ghi_id IS 'Khoá chính của bản ghi nghiệp vụ';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.thao_tac; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.thao_tac IS 'INSERT | UPDATE (không theo dõi DELETE: phiếu xoá thì thông báo cũ tự hết ý nghĩa)';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.actor_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.actor_id IS 'Nhân viên gây ra thay đổi, lấy từ JWT của phiên đang chạy. Worker dùng để KHÔNG bắn ngược lại chính người đó.';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.payload; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.payload IS 'Ảnh chụp bản ghi sau thay đổi, đã loại các cột nặng (ảnh, đính kèm)';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.payload_cu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.payload_cu IS 'Ảnh chụp trước thay đổi (NULL khi INSERT) — dùng để so mảng người hỗ trợ, trao đổi mới';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.tg_xu_ly; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.tg_xu_ly IS 'NULL = chưa xử lý. Worker quét cột này khi khởi động và mỗi 30 giây.';


--
-- Name: COLUMN fp_var_su_kien_thong_bao.so_lan_thu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_su_kien_thong_bao.so_lan_thu IS 'Số lần worker thử xử lý và thất bại — chặn vòng lặp vô hạn với sự kiện hỏng';


--
-- Name: fp_var_su_kien_thong_bao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_su_kien_thong_bao ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_var_su_kien_thong_bao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_thong_bao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_thong_bao (
    id bigint NOT NULL,
    nguoi_nhan_id bigint NOT NULL,
    module_id text NOT NULL,
    loai_su_kien text NOT NULL,
    muc text DEFAULT 'thuong'::text NOT NULL,
    tieu_de text NOT NULL,
    noi_dung text,
    link text,
    bang text,
    ban_ghi_id bigint,
    su_kien_id bigint,
    du_lieu jsonb DEFAULT '{}'::jsonb NOT NULL,
    da_doc boolean DEFAULT false NOT NULL,
    da_xoa boolean DEFAULT false NOT NULL,
    so_lan integer DEFAULT 1 NOT NULL,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_fp_var_thong_bao_muc CHECK ((muc = ANY (ARRAY['cao'::text, 'thuong'::text])))
);


--
-- Name: TABLE fp_var_thong_bao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_thong_bao IS 'Thông báo trong app của từng nhân viên. Xoá là xoá mềm (da_xoa) để giữ vết đối chiếu.';


--
-- Name: COLUMN fp_var_thong_bao.module_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao.module_id IS 'Mã module dạng ''kho-van/phieu-kho'' — dùng cho chip lọc theo module và kiểm tra quyền xem';


--
-- Name: COLUMN fp_var_thong_bao.loai_su_kien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao.loai_su_kien IS 'Mã loại sự kiện, ví dụ ''phieu.cho_duyet'', ''cong_viec.duoc_giao'' — quyết định icon và cài đặt bật/tắt';


--
-- Name: COLUMN fp_var_thong_bao.muc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao.muc IS 'cao = rung push ngay; thuong = vào chuông, push theo cài đặt';


--
-- Name: COLUMN fp_var_thong_bao.link; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao.link IS 'Đường dẫn trong app để điều hướng khi bấm vào thông báo';


--
-- Name: COLUMN fp_var_thong_bao.du_lieu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao.du_lieu IS 'Dữ liệu phụ để render (số phiếu, tên người thao tác, lý do từ chối…)';


--
-- Name: COLUMN fp_var_thong_bao.so_lan; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao.so_lan IS 'Số lần sự kiện cùng loại lặp lại trên cùng bản ghi trong cửa sổ gộp. >1 nghĩa là đã gộp, không tạo dòng mới.';


--
-- Name: fp_var_thong_bao_cai_dat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_thong_bao_cai_dat (
    id bigint NOT NULL,
    nhan_vien_id bigint NOT NULL,
    module_id text NOT NULL,
    loai_su_kien text DEFAULT '*'::text NOT NULL,
    trong_app boolean DEFAULT true NOT NULL,
    push boolean DEFAULT true NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: TABLE fp_var_thong_bao_cai_dat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_thong_bao_cai_dat IS 'Ngoại lệ cài đặt thông báo. Không có dòng = bật cả trong app lẫn push (mặc định của hệ thống).';


--
-- Name: COLUMN fp_var_thong_bao_cai_dat.loai_su_kien; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao_cai_dat.loai_su_kien IS '''*'' = áp cho cả module. Dòng cụ thể theo loại sự kiện thắng dòng ''*''.';


--
-- Name: COLUMN fp_var_thong_bao_cai_dat.trong_app; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao_cai_dat.trong_app IS 'false = không vào chuông';


--
-- Name: COLUMN fp_var_thong_bao_cai_dat.push; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao_cai_dat.push IS 'false = vẫn vào chuông nhưng không đẩy ra màn hình khoá';


--
-- Name: fp_var_thong_bao_cai_dat_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_thong_bao_cai_dat ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_var_thong_bao_cai_dat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_thong_bao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_thong_bao ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_var_thong_bao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: fp_var_thong_bao_tuy_chon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_thong_bao_tuy_chon (
    nhan_vien_id bigint NOT NULL,
    push_bat boolean DEFAULT true NOT NULL,
    gio_yen_lang_bat boolean DEFAULT true NOT NULL,
    gio_yen_lang_tu smallint DEFAULT 21 NOT NULL,
    gio_yen_lang_den smallint DEFAULT 6 NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_gio_yen_lang_den CHECK (((gio_yen_lang_den >= 0) AND (gio_yen_lang_den <= 23))),
    CONSTRAINT ck_gio_yen_lang_tu CHECK (((gio_yen_lang_tu >= 0) AND (gio_yen_lang_tu <= 23)))
);


--
-- Name: TABLE fp_var_thong_bao_tuy_chon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fp_var_thong_bao_tuy_chon IS 'Tuỳ chọn thông báo chung mỗi nhân viên. Không có dòng = dùng mặc định: push bật, yên lặng 21h–6h.';


--
-- Name: COLUMN fp_var_thong_bao_tuy_chon.push_bat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.push_bat IS 'Công tắc tổng. false = tắt hẳn push mọi module, chuông trong app vẫn chạy.';


--
-- Name: COLUMN fp_var_thong_bao_tuy_chon.gio_yen_lang_bat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.gio_yen_lang_bat IS 'Trong giờ yên lặng, sự kiện vẫn vào chuông nhưng không rung điện thoại.';


--
-- Name: COLUMN fp_var_thong_bao_tuy_chon.gio_yen_lang_tu; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.gio_yen_lang_tu IS 'Giờ bắt đầu yên lặng, theo múi giờ công ty (0–23)';


--
-- Name: COLUMN fp_var_thong_bao_tuy_chon.gio_yen_lang_den; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.gio_yen_lang_den IS 'Giờ kết thúc yên lặng (0–23). Nhỏ hơn giờ bắt đầu nghĩa là khoảng vắt qua nửa đêm.';


--
-- Name: fp_var_tt_cong_ty; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fp_var_tt_cong_ty (
    id bigint NOT NULL,
    ten_ung_dung text,
    mo_ta text,
    logo text,
    ten_cong_ty text,
    ma_so_thue text,
    dia_chi text,
    so_dien_thoai text,
    email text,
    trang_web text,
    tg_tao timestamp with time zone DEFAULT now(),
    tg_cap_nhat timestamp with time zone DEFAULT now()
);


--
-- Name: fp_var_tt_cong_ty_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_tt_cong_ty ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.fp_var_tt_cong_ty_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_don_dat_hang_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_don_dat_hang_summary WITH (security_invoker='true') AS
 SELECT d.id,
    d.so_po,
    d.ngay_dat,
    d.ngay_giao_dk,
    d.id_nha_cung_cap,
    d.ten_nha_cung_cap,
    d.id_kho_nhan,
    d.ten_kho_nhan,
    d.id_phieu_de_xuat_vat_tu,
    d.id_nguoi_dat,
    d.id_nguoi_duyet,
    d.ghi_chu,
    d.trang_thai,
    d.tg_tao,
    d.tg_cap_nhat,
    pdx.so_phieu AS so_phieu_de_xuat_ref,
    ncc.ma_doi_tac AS ref_ma_nha_cung_cap,
    COALESCE(d.ten_nha_cung_cap, ncc.ten_doi_tac) AS ref_ten_nha_cung_cap,
    COALESCE(d.ten_kho_nhan, kho_ref.ten_kho) AS ref_ten_kho_nhan,
    nv_dat.ho_va_ten AS ref_ten_nguoi_dat,
    ('NV'::text || (nv_dat.id)::text) AS ref_ma_nguoi_dat,
    nv_duyet.ho_va_ten AS ref_ten_nguoi_duyet,
        CASE
            WHEN (d.id_nguoi_duyet IS NOT NULL) THEN ('NV'::text || (d.id_nguoi_duyet)::text)
            ELSE NULL::text
        END AS ref_ma_nguoi_duyet
   FROM (((((public.fp_mh_don_dat_hang d
     LEFT JOIN public.fp_mh_phieu_de_xuat_vat_tu pdx ON ((pdx.id = d.id_phieu_de_xuat_vat_tu)))
     LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc ON (((ncc.id = d.id_nha_cung_cap) AND (ncc.loai_doi_tac = 'nha_cung_cap'::text))))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = d.id_kho_nhan)))
     LEFT JOIN public.fp_var_nhan_vien nv_dat ON ((nv_dat.id = d.id_nguoi_dat)))
     LEFT JOIN public.fp_var_nhan_vien nv_duyet ON ((nv_duyet.id = d.id_nguoi_duyet)));


--
-- Name: VIEW v_don_dat_hang_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_don_dat_hang_summary IS 'Đơn đặt hàng + so phiếu đề xuất + JOIN tên (giảm egress app)';


--
-- Name: v_don_dat_hang_chi_tiet_flat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_don_dat_hang_chi_tiet_flat WITH (security_invoker='true') AS
 SELECT ct.id AS chi_tiet_id,
    ct.id_don_dat_hang,
    ct.id_hang_hoa,
    ct.so_luong,
    ct.don_vi_tinh,
    ct.don_gia,
    ct.thanh_tien,
    ct.ghi_chu AS chi_tiet_ghi_chu,
    hh.ma_hang_hoa AS ma_hang,
    hh.ten_hang_hoa AS ten_hang,
    s.id,
    s.so_po,
    s.ngay_dat,
    s.ngay_giao_dk,
    s.id_nha_cung_cap,
    s.ten_nha_cung_cap,
    s.id_kho_nhan,
    s.ten_kho_nhan,
    s.id_phieu_de_xuat_vat_tu,
    s.id_nguoi_dat,
    s.id_nguoi_duyet,
    s.ghi_chu,
    s.trang_thai,
    s.tg_tao,
    s.tg_cap_nhat,
    s.so_phieu_de_xuat_ref,
    s.ref_ma_nha_cung_cap,
    s.ref_ten_nha_cung_cap,
    s.ref_ten_kho_nhan,
    s.ref_ten_nguoi_dat,
    s.ref_ma_nguoi_dat,
    s.ref_ten_nguoi_duyet,
    s.ref_ma_nguoi_duyet,
    ct.phan_loai,
    ct.muc_dich_su_dung
   FROM ((public.fp_mh_don_dat_hang_chi_tiet ct
     JOIN public.v_don_dat_hang_summary s ON ((s.id = ct.id_don_dat_hang)))
     LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));


--
-- Name: VIEW v_don_dat_hang_chi_tiet_flat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_don_dat_hang_chi_tiet_flat IS 'Chi tiết đơn đặt hàng phẳng (JOIN summary + mã HH + phân loại + mục đích sử dụng)';


--
-- Name: v_farm_de_xuat_mua_hang_chi_tiet_flat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_farm_de_xuat_mua_hang_chi_tiet_flat WITH (security_invoker='true') AS
 SELECT ct.id,
    ct.id_de_xuat_mua_hang,
    ct.id_hang_hoa,
    ct.so_luong,
    ct.don_vi_tinh,
    ct.thong_so,
    ct.ghi_chu,
    ct.id_tien_do_mh,
    ct.ten_tien_do_mh,
    ct.trao_doi,
    ct.so_phieu,
    ct.ngay,
    ct.ngay_can,
    ct.ten_noi_de_xuat,
    ct.ten_nguoi_de_xuat,
    ct.ten_nguoi_duyet,
    ct.trang_thai_phieu,
    hh.ma_hang_hoa AS ref_ma_hang_hoa,
    hh.ten_hang_hoa AS ref_ten_hang_hoa
   FROM (public.fp_farm_de_xuat_mua_hang_chi_tiet ct
     LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));


--
-- Name: VIEW v_farm_de_xuat_mua_hang_chi_tiet_flat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_farm_de_xuat_mua_hang_chi_tiet_flat IS 'Chi tiết đề xuất mua hàng farm phẳng (JOIN mã/tên HH — phục vụ tìm kiếm)';


--
-- Name: v_farm_de_xuat_mua_hang_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_farm_de_xuat_mua_hang_summary WITH (security_invoker='true') AS
 SELECT p.id,
    p.so_phieu,
    p.ngay,
    p.ngay_can,
    p.id_noi_de_xuat,
    p.id_nguoi_de_xuat,
    p.id_nguoi_duyet,
    p.ghi_chu,
    p.trang_thai,
    p.tg_tao,
    p.tg_cap_nhat,
    kho_ref.ten_kho AS ref_ten_noi_de_xuat,
    nv_dx.ho_va_ten AS ref_ten_nguoi_de_xuat,
    ('NV'::text || (nv_dx.id)::text) AS ref_ma_nguoi_de_xuat,
    nv_du.ho_va_ten AS ref_ten_nguoi_duyet,
        CASE
            WHEN (p.id_nguoi_duyet IS NOT NULL) THEN ('NV'::text || (p.id_nguoi_duyet)::text)
            ELSE NULL::text
        END AS ref_ma_nguoi_duyet,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.ref_chi_tiet_tim_kiem, ''::text) AS ref_chi_tiet_tim_kiem,
    TRIM(BOTH ' '::text FROM concat_ws(' '::text, NULLIF(btrim(COALESCE((p.ngay)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.ngay_can)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.tg_tao)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.tg_cap_nhat)::text, ''::text)), ''::text))) AS ref_ngay_va_thoi_gian_tim_kiem,
    kho_ref.chi_nhanh_id AS ref_id_chi_nhanh_noi_de_xuat
   FROM ((((public.fp_farm_de_xuat_mua_hang p
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = p.id_noi_de_xuat)))
     LEFT JOIN public.fp_var_nhan_vien nv_dx ON ((nv_dx.id = p.id_nguoi_de_xuat)))
     LEFT JOIN public.fp_var_nhan_vien nv_du ON ((nv_du.id = p.id_nguoi_duyet)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            NULLIF(string_agg(DISTINCT concat_ws(' '::text, NULLIF(btrim(COALESCE(hh.ma_hang_hoa, ''::text)), ''::text), NULLIF(btrim(COALESCE(hh.ten_hang_hoa, ''::text)), ''::text), NULLIF(btrim(COALESCE(ct.thong_so, ''::text)), ''::text), NULLIF(btrim(COALESCE(ct.ghi_chu, ''::text)), ''::text)), ' '::text), ''::text) AS ref_chi_tiet_tim_kiem
           FROM (public.fp_farm_de_xuat_mua_hang_chi_tiet ct
             LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)))
          WHERE (ct.id_de_xuat_mua_hang = p.id)) agg ON (true));


--
-- Name: VIEW v_farm_de_xuat_mua_hang_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_farm_de_xuat_mua_hang_summary IS 'Đề xuất mua hàng farm + aggregate + JOIN tên (giảm egress app)';


--
-- Name: COLUMN v_farm_de_xuat_mua_hang_summary.ref_chi_tiet_tim_kiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_farm_de_xuat_mua_hang_summary.ref_chi_tiet_tim_kiem IS 'Chuỗi gộp mã/tên HH + thông số/ghi chú dòng chi tiết — tìm kiếm danh sách phiếu theo hàng hóa';


--
-- Name: COLUMN v_farm_de_xuat_mua_hang_summary.ref_ngay_va_thoi_gian_tim_kiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_farm_de_xuat_mua_hang_summary.ref_ngay_va_thoi_gian_tim_kiem IS 'Ngày / ngày cần / tg_tao / tg_cap_nhat dạng text — dùng tìm kiếm';


--
-- Name: COLUMN v_farm_de_xuat_mua_hang_summary.ref_id_chi_nhanh_noi_de_xuat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_farm_de_xuat_mua_hang_summary.ref_id_chi_nhanh_noi_de_xuat IS 'Chi nhánh của kho nơi đề xuất → prefill quỹ thu chi liên quan';


--
-- Name: v_farm_phieu_kho_phan_thuoc_chi_tiet_flat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat WITH (security_invoker='true') AS
 SELECT ct.id AS chi_tiet_id,
    ct.id_phieu_kho,
    ct.id_hang_hoa,
    ct.ten_hang_hoa,
    ct.don_vi_tinh,
    COALESCE(NULLIF(btrim(ct.pham_cap), ''::text), NULLIF(btrim(hh.pham_cap), ''::text)) AS pham_cap,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien,
    ct.so_lot,
    ct.ghi_chu,
    ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
    ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
    ct.tg_tao AS chi_tiet_tg_tao,
    ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
    pk.id AS phieu_id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.nguoi_tao_id AS phieu_nguoi_tao_id,
    pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
    pk.id_nguoi_duyet,
    pk.tg_tao AS phieu_tg_tao,
    pk.tg_cap_nhat AS phieu_tg_cap_nhat,
    hh.ma_hang_hoa AS ma_hang
   FROM ((public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
     JOIN public.fp_farm_phieu_kho_phan_thuoc pk ON ((pk.id = ct.id_phieu_kho)))
     LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));


--
-- Name: VIEW v_farm_phieu_kho_phan_thuoc_chi_tiet_flat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat IS 'Chi tiết phiếu kho phân thuốc phẳng (JOIN header + mã HH + phẩm cấp)';


--
-- Name: v_farm_phieu_kho_phan_thuoc_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_farm_phieu_kho_phan_thuoc_summary WITH (security_invoker='true') AS
 SELECT pk.id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.id_nguoi_duyet,
    pk.nguoi_tao_id,
    pk.ten_nguoi_tao,
    pk.tg_tao,
    pk.tg_cap_nhat,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.tong_tien, (0)::numeric) AS tong_tien,
    kho_ref.ten_kho AS ref_ten_kho,
    kho_den_ref.ten_kho AS ref_ten_kho_den,
    nv_t.ho_va_ten AS ref_ten_nguoi_tao,
    nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
    pk.id_de_xuat_mua_hang,
    pk.so_phieu_de_xuat
   FROM (((((public.fp_farm_phieu_kho_phan_thuoc pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));


--
-- Name: VIEW v_farm_phieu_kho_phan_thuoc_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_farm_phieu_kho_phan_thuoc_summary IS 'Phiếu kho phân thuốc + aggregate + JOIN tên + liên kết đề xuất mua hàng';


--
-- Name: v_farm_ton_kho_phan_thuoc; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_farm_ton_kho_phan_thuoc WITH (security_invoker='true') AS
 SELECT id_kho,
    id_hang_hoa,
    (sum(delta))::numeric(18,4) AS so_luong
   FROM ( SELECT pk.kho_id AS id_kho,
            ct.id_hang_hoa,
            ct.so_luong AS delta
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'nhập'::text) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong)
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'xuất'::text) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_id,
            ct.id_hang_hoa,
            (- ct.so_luong)
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'chuyển'::text) AND (pk.kho_den_id IS NOT NULL) AND (pk.trang_thai <> 'Không duyệt'::text))
        UNION ALL
         SELECT pk.kho_den_id,
            ct.id_hang_hoa,
            ct.so_luong
           FROM (public.fp_farm_phieu_kho_phan_thuoc pk
             JOIN public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
          WHERE ((pk.loai = 'chuyển'::text) AND (pk.kho_den_id IS NOT NULL) AND (pk.trang_thai <> 'Không duyệt'::text))) t
  GROUP BY id_kho, id_hang_hoa
 HAVING (sum(delta) <> (0)::numeric);


--
-- Name: VIEW v_farm_ton_kho_phan_thuoc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_farm_ton_kho_phan_thuoc IS 'Tồn kho phân thuốc theo kho × hàng (tức thời)';


--
-- Name: v_hop_dong_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_hop_dong_summary WITH (security_invoker='true') AS
 SELECT h.id,
    h.ngay,
    h.id_nha_cung_cap,
    h.ten_nha_cung_cap,
    h.ma_hop_dong,
    h.ten_hop_dong,
    h.noi_dung,
    h.so_luong_cay,
    h.don_gia,
    h.thanh_tien,
    h.trang_thai,
    h.ghi_chu,
    h.id_nguoi_tao,
    h.tg_tao,
    h.tg_cap_nhat,
    COALESCE(h.ten_nha_cung_cap, ncc.ten_doi_tac) AS ref_ten_nha_cung_cap,
    ncc.ma_doi_tac AS ref_ma_nha_cung_cap,
    nv.ho_va_ten AS ref_ten_nguoi_tao,
    (COALESCE(( SELECT sum(ct.so_tien) AS sum
           FROM public.fp_mh_hop_dong_ct ct
          WHERE (ct.id_hop_dong = h.id)), (0)::numeric))::numeric(18,2) AS tong_da_thanh_toan
   FROM ((public.fp_mh_hop_dong h
     LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc ON (((ncc.id = h.id_nha_cung_cap) AND (ncc.loai_doi_tac = 'nha_cung_cap'::text))))
     LEFT JOIN public.fp_var_nhan_vien nv ON ((nv.id = h.id_nguoi_tao)));


--
-- Name: VIEW v_hop_dong_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_hop_dong_summary IS 'Hợp đồng + tên NCC/người tạo + tổng thanh toán';


--
-- Name: v_mh_nxt_movement; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_mh_nxt_movement WITH (security_invoker='true') AS
 SELECT pk.id AS phieu_id,
    pk.ngay,
    public._nxt_norm_loai(pk.loai) AS loai_n,
    pk.kho_id,
    pk.kho_den_id,
    pk.nguoi_tao_id,
    ct.id AS chi_tiet_id,
    ct.id_hang_hoa,
    (ct.so_luong)::numeric AS qty,
    hh.danh_muc_id,
    kb_from.chi_nhanh_id AS chi_nhanh_kho_id,
    kb_to.chi_nhanh_id AS chi_nhanh_kho_den_id
   FROM ((((public.fp_mh_phieu_kho pk
     JOIN public.fp_mh_phieu_kho_chi_tiet ct ON ((ct.id_phieu_kho = pk.id)))
     LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)))
     LEFT JOIN public.fp_mh_danh_sach_kho kb_from ON ((kb_from.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kb_to ON ((kb_to.id = pk.kho_den_id)))
  WHERE ((TRIM(BOTH FROM COALESCE(pk.trang_thai, ''::text)) <> 'Không duyệt'::text) AND (ct.so_luong > (0)::numeric) AND (public._nxt_norm_loai(pk.loai) IS NOT NULL));


--
-- Name: VIEW v_mh_nxt_movement; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_mh_nxt_movement IS 'Phẳng phiếu×chi tiết dùng tính NXT theo kỳ (bỏ Không duyệt). RPC rpc_nxt_by_period đọc view này.';


--
-- Name: v_nhan_vien_ref; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_nhan_vien_ref WITH (security_invoker='on') AS
 SELECT id,
    ho_va_ten,
    email,
    trang_thai
   FROM public.fp_var_nhan_vien nv;


--
-- Name: v_phieu_de_xuat_vat_tu_chi_tiet_flat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_phieu_de_xuat_vat_tu_chi_tiet_flat WITH (security_invoker='true') AS
 SELECT ct.id,
    ct.id_phieu_de_xuat_vat_tu,
    ct.id_hang_hoa,
    ct.so_luong,
    ct.don_vi_tinh,
    ct.thong_so,
    ct.ghi_chu,
    ct.so_phieu,
    ct.ngay,
    ct.ngay_can,
    ct.ten_noi_de_xuat,
    ct.ten_nguoi_de_xuat,
    ct.ten_nguoi_duyet,
    ct.trang_thai_phieu,
    ct.id_tien_do_mh,
    ct.ten_tien_do_mh,
    ct.trao_doi,
    hh.ma_hang_hoa AS ref_ma_hang_hoa,
    hh.ten_hang_hoa AS ref_ten_hang_hoa
   FROM (public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet ct
     LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));


--
-- Name: VIEW v_phieu_de_xuat_vat_tu_chi_tiet_flat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_phieu_de_xuat_vat_tu_chi_tiet_flat IS 'Chi tiết đề xuất vật tư phẳng (JOIN mã/tên HH — phục vụ tìm kiếm)';


--
-- Name: v_phieu_de_xuat_vat_tu_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_phieu_de_xuat_vat_tu_summary WITH (security_invoker='true') AS
 SELECT p.id,
    p.so_phieu,
    p.ngay,
    p.ngay_can,
    p.id_noi_de_xuat,
    p.id_nguoi_de_xuat,
    p.id_nguoi_duyet,
    p.ghi_chu,
    p.trang_thai,
    p.tg_tao,
    p.tg_cap_nhat,
    kho_ref.ten_kho AS ref_ten_noi_de_xuat,
    nv_dx.ho_va_ten AS ref_ten_nguoi_de_xuat,
    ('NV'::text || (nv_dx.id)::text) AS ref_ma_nguoi_de_xuat,
    nv_du.ho_va_ten AS ref_ten_nguoi_duyet,
        CASE
            WHEN (p.id_nguoi_duyet IS NOT NULL) THEN ('NV'::text || (p.id_nguoi_duyet)::text)
            ELSE NULL::text
        END AS ref_ma_nguoi_duyet,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.ref_chi_tiet_tim_kiem, ''::text) AS ref_chi_tiet_tim_kiem,
    TRIM(BOTH ' '::text FROM concat_ws(' '::text, NULLIF(btrim(COALESCE((p.ngay)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.ngay_can)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.tg_tao)::text, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.tg_cap_nhat)::text, ''::text)), ''::text))) AS ref_ngay_va_thoi_gian_tim_kiem
   FROM ((((public.fp_mh_phieu_de_xuat_vat_tu p
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = p.id_noi_de_xuat)))
     LEFT JOIN public.fp_var_nhan_vien nv_dx ON ((nv_dx.id = p.id_nguoi_de_xuat)))
     LEFT JOIN public.fp_var_nhan_vien nv_du ON ((nv_du.id = p.id_nguoi_duyet)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            NULLIF(string_agg(DISTINCT concat_ws(' '::text, NULLIF(btrim(COALESCE(hh.ma_hang_hoa, ''::text)), ''::text), NULLIF(btrim(COALESCE(hh.ten_hang_hoa, ''::text)), ''::text), NULLIF(btrim(COALESCE(ct.thong_so, ''::text)), ''::text), NULLIF(btrim(COALESCE(ct.ghi_chu, ''::text)), ''::text)), ' '::text), ''::text) AS ref_chi_tiet_tim_kiem
           FROM (public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet ct
             LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)))
          WHERE (ct.id_phieu_de_xuat_vat_tu = p.id)) agg ON (true));


--
-- Name: VIEW v_phieu_de_xuat_vat_tu_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_phieu_de_xuat_vat_tu_summary IS 'Phiếu đề xuất vật tư + aggregate + JOIN tên (giảm egress app)';


--
-- Name: COLUMN v_phieu_de_xuat_vat_tu_summary.ref_chi_tiet_tim_kiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_phieu_de_xuat_vat_tu_summary.ref_chi_tiet_tim_kiem IS 'Chuỗi gộp mã/tên HH + thông số/ghi chú dòng chi tiết — dùng tìm kiếm danh sách phiếu theo vật tư';


--
-- Name: COLUMN v_phieu_de_xuat_vat_tu_summary.ref_ngay_va_thoi_gian_tim_kiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_phieu_de_xuat_vat_tu_summary.ref_ngay_va_thoi_gian_tim_kiem IS 'Ngày / ngày cần / tg_tao / tg_cap_nhat dạng text — dùng tìm kiếm';


--
-- Name: v_phieu_kho_chi_tiet_flat; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_phieu_kho_chi_tiet_flat WITH (security_invoker='true') AS
 SELECT ct.id AS chi_tiet_id,
    ct.id_phieu_kho,
    ct.id_hang_hoa,
    ct.ten_hang_hoa,
    ct.don_vi_tinh,
    COALESCE(NULLIF(btrim(ct.pham_cap), ''::text), NULLIF(btrim(hh.pham_cap), ''::text)) AS pham_cap,
    ct.so_luong,
    ct.don_gia,
    ct.thanh_tien,
    ct.so_lot,
    ct.ghi_chu,
    ct.nguoi_tao_id AS chi_tiet_nguoi_tao_id,
    ct.ten_nguoi_tao AS chi_tiet_ten_nguoi_tao,
    ct.tg_tao AS chi_tiet_tg_tao,
    ct.tg_cap_nhat AS chi_tiet_tg_cap_nhat,
    pk.id AS phieu_id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.id_nha_cung_cap,
    pk.id_khach_hang,
    pk.trang_thai,
    pk.mo_ta,
    pk.trao_doi,
    pk.nguoi_tao_id AS phieu_nguoi_tao_id,
    pk.ten_nguoi_tao AS phieu_ten_nguoi_tao,
    pk.id_nguoi_duyet,
    pk.tg_tao AS phieu_tg_tao,
    pk.tg_cap_nhat AS phieu_tg_cap_nhat,
    pk.id_don_dat_hang,
    hh.ma_hang_hoa AS ma_hang,
    dd.so_po AS so_po_don_dat_hang
   FROM (((public.fp_mh_phieu_kho_chi_tiet ct
     JOIN public.fp_mh_phieu_kho pk ON ((pk.id = ct.id_phieu_kho)))
     LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)))
     LEFT JOIN public.fp_mh_don_dat_hang dd ON ((dd.id = pk.id_don_dat_hang)));


--
-- Name: VIEW v_phieu_kho_chi_tiet_flat; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_phieu_kho_chi_tiet_flat IS 'Chi tiết phiếu kho phẳng (JOIN header + mã HH + phẩm cấp + đơn đặt hàng)';


--
-- Name: v_phieu_kho_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_phieu_kho_summary WITH (security_invoker='true') AS
 SELECT pk.id,
    pk.so_phieu,
    pk.ngay,
    pk.loai,
    pk.kho_id,
    pk.ten_kho,
    pk.kho_den_id,
    pk.ten_kho_den,
    pk.id_nha_cung_cap,
    pk.id_khach_hang,
    pk.trang_thai,
    pk.mo_ta,
    pk.nguoi_tao_id,
    pk.ten_nguoi_tao,
    pk.tg_tao,
    pk.tg_cap_nhat,
    pk.trao_doi,
    pk.id_nguoi_duyet,
    pk.id_don_dat_hang,
    COALESCE(agg.so_dong, 0) AS so_dong,
    COALESCE(agg.tong_so_luong, (0)::numeric) AS tong_so_luong,
    COALESCE(agg.tong_tien, (0)::numeric) AS tong_tien,
    kho_ref.ten_kho AS ref_ten_kho,
    kho_den_ref.ten_kho AS ref_ten_kho_den,
    ncc.ten_doi_tac AS ref_ten_nha_cung_cap,
    kh.ten_doi_tac AS ref_ten_khach_hang,
    nv_t.ho_va_ten AS ref_ten_nguoi_tao,
    nv_d.ho_va_ten AS ref_ten_nguoi_duyet,
    dd.so_po AS ref_so_po_don_dat_hang
   FROM ((((((((public.fp_mh_phieu_kho pk
     LEFT JOIN public.fp_mh_danh_sach_kho kho_ref ON ((kho_ref.id = pk.kho_id)))
     LEFT JOIN public.fp_mh_danh_sach_kho kho_den_ref ON ((kho_den_ref.id = pk.kho_den_id)))
     LEFT JOIN public.fp_mh_danh_sach_doi_tac ncc ON ((ncc.id = pk.id_nha_cung_cap)))
     LEFT JOIN public.fp_mh_danh_sach_doi_tac kh ON ((kh.id = pk.id_khach_hang)))
     LEFT JOIN public.fp_var_nhan_vien nv_t ON ((nv_t.id = pk.nguoi_tao_id)))
     LEFT JOIN public.fp_var_nhan_vien nv_d ON ((nv_d.id = pk.id_nguoi_duyet)))
     LEFT JOIN public.fp_mh_don_dat_hang dd ON ((dd.id = pk.id_don_dat_hang)))
     LEFT JOIN LATERAL ( SELECT (count(*))::integer AS so_dong,
            sum(ct.so_luong) AS tong_so_luong,
            sum(ct.thanh_tien) AS tong_tien
           FROM public.fp_mh_phieu_kho_chi_tiet ct
          WHERE (ct.id_phieu_kho = pk.id)) agg ON (true));


--
-- Name: VIEW v_phieu_kho_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_phieu_kho_summary IS 'Phiếu kho + aggregate + JOIN tên (giảm egress app)';


--
-- Name: v_tc_quy_so_du; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_tc_quy_so_du WITH (security_invoker='true') AS
 SELECT p.id_chi_nhanh,
    cn.ten_chi_nhanh AS ref_ten_chi_nhanh,
    (count(*))::integer AS so_phieu,
    COALESCE(sum(
        CASE
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (0)::numeric
        END), (0)::numeric) AS tong_thu,
    COALESCE(sum(
        CASE
            WHEN (p.loai = 'chi'::text) THEN p.so_tien
            ELSE (0)::numeric
        END), (0)::numeric) AS tong_chi,
    COALESCE(sum(
        CASE
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (- p.so_tien)
        END), (0)::numeric) AS ton_quy_hien_tai,
    min(p.ngay) AS ngay_dau,
    max(p.ngay) AS ngay_cuoi
   FROM (public.fp_tc_quy_thu_chi p
     LEFT JOIN public.fp_var_chi_nhanh cn ON ((cn.id = p.id_chi_nhanh)))
  GROUP BY p.id_chi_nhanh, cn.ten_chi_nhanh;


--
-- Name: VIEW v_tc_quy_so_du; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_tc_quy_so_du IS 'Số dư quỹ tiền mặt hiện tại theo chi nhánh (tổng thu - tổng chi toàn sổ)';


--
-- Name: v_tc_quy_thu_chi_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_tc_quy_thu_chi_summary WITH (security_invoker='true') AS
 SELECT p.id,
    p.so_phieu,
    p.ngay,
    p.id_chi_nhanh,
    p.ten_chi_nhanh,
    p.loai,
    p.so_tien,
    p.so_luong,
    p.don_gia,
    p.id_hang_muc,
    p.ten_hang_muc,
    p.dien_giai,
    p.ghi_chu,
    p.loai_chung_tu,
    p.id_chung_tu,
    p.so_chung_tu,
    p.id_nguoi_tao,
    p.ten_nguoi_tao,
    p.tg_tao,
    p.tg_cap_nhat,
    p.trang_thai,
    p.id_nguoi_yeu_cau_mo,
    p.ten_nguoi_yeu_cau_mo,
    p.ly_do_yeu_cau_mo,
    p.tg_yeu_cau_mo,
    p.id_nguoi_xu_ly_mo,
    p.ten_nguoi_xu_ly_mo,
    p.tg_xu_ly_mo,
        CASE
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (0)::numeric
        END AS thu,
        CASE
            WHEN (p.loai = 'chi'::text) THEN p.so_tien
            ELSE (0)::numeric
        END AS chi,
    sum(
        CASE
            WHEN (p.loai = 'thu'::text) THEN p.so_tien
            ELSE (- p.so_tien)
        END) OVER (PARTITION BY p.id_chi_nhanh ORDER BY p.ngay, p.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS ton_quy,
    cn.ten_chi_nhanh AS ref_ten_chi_nhanh,
    cn.ma_chi_nhanh AS ref_ma_chi_nhanh,
    hm.ten AS ref_ten_hang_muc,
    hm.ma AS ref_ma_hang_muc,
    nv.ho_va_ten AS ref_ten_nguoi_tao,
    TRIM(BOTH ' '::text FROM concat_ws(' '::text, NULLIF(btrim(COALESCE(p.so_phieu, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.dien_giai, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.ghi_chu, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.so_chung_tu, ''::text)), ''::text), NULLIF(btrim(COALESCE(p.ten_hang_muc, ''::text)), ''::text), NULLIF(btrim(COALESCE((p.ngay)::text, ''::text)), ''::text))) AS ref_tim_kiem
   FROM (((public.fp_tc_quy_thu_chi p
     LEFT JOIN public.fp_var_chi_nhanh cn ON ((cn.id = p.id_chi_nhanh)))
     LEFT JOIN public.fp_tc_hang_muc_thu_chi hm ON ((hm.id = p.id_hang_muc)))
     LEFT JOIN public.fp_var_nhan_vien nv ON ((nv.id = p.id_nguoi_tao)));


--
-- Name: VIEW v_tc_quy_thu_chi_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.v_tc_quy_thu_chi_summary IS 'Sổ quỹ + thu/chi tách cột + tồn quỹ lũy kế theo chi nhánh + tên tham chiếu';


--
-- Name: COLUMN v_tc_quy_thu_chi_summary.ton_quy; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ton_quy IS 'Tồn quỹ lũy kế của CHI NHÁNH tính đến dòng này (thứ tự ngay, id) — không phụ thuộc filter/phân trang';


--
-- Name: COLUMN v_tc_quy_thu_chi_summary.ref_ten_chi_nhanh; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ref_ten_chi_nhanh IS 'Tên chi nhánh HIỆN TẠI (khác ten_chi_nhanh là snapshot lúc lập phiếu)';


--
-- Name: COLUMN v_tc_quy_thu_chi_summary.ref_tim_kiem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.v_tc_quy_thu_chi_summary.ref_tim_kiem IS 'Chuỗi gộp số phiếu / diễn giải / ghi chú / số chứng từ / hạng mục / ngày — dùng cho ilike';


--
-- Name: fp_farm_thu_hoach id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_thu_hoach ALTER COLUMN id SET DEFAULT nextval('public.fp_farm_thu_hoach_id_seq'::regclass);


--
-- Name: fp_hc_cong_viec id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hc_cong_viec ALTER COLUMN id SET DEFAULT nextval('public.fp_hc_cong_viec_id_seq'::regclass);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct fp_farm_bao_cao_nhan_cong_ct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong_ct
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_ct_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub fp_farm_bao_cao_nhan_cong_ct_sub_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong_ct_sub
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_ct_sub_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi fp_farm_bao_cao_nhan_cong_kpi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong_kpi
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_kpi_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_bao_cao_nhan_cong fp_farm_bao_cao_nhan_cong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_bao_cao_so_che_ct fp_farm_bao_cao_so_che_ct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che_ct
    ADD CONSTRAINT fp_farm_bao_cao_so_che_ct_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_bao_cao_so_che_kpi fp_farm_bao_cao_so_che_kpi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che_kpi
    ADD CONSTRAINT fp_farm_bao_cao_so_che_kpi_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_bao_cao_so_che_pham_cap fp_farm_bao_cao_so_che_pham_cap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che_pham_cap
    ADD CONSTRAINT fp_farm_bao_cao_so_che_pham_cap_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_bao_cao_so_che fp_farm_bao_cao_so_che_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che
    ADD CONSTRAINT fp_farm_bao_cao_so_che_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_danh_muc_hang_hoa fp_farm_danh_muc_hang_hoa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_danh_muc_hang_hoa
    ADD CONSTRAINT fp_farm_danh_muc_hang_hoa_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_danh_sach_hang_hoa fp_farm_danh_sach_hang_hoa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_danh_sach_hang_hoa
    ADD CONSTRAINT fp_farm_danh_sach_hang_hoa_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet fp_farm_de_xuat_mua_hang_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_de_xuat_mua_hang_chi_tiet
    ADD CONSTRAINT fp_farm_de_xuat_mua_hang_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_de_xuat_mua_hang fp_farm_de_xuat_mua_hang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_de_xuat_mua_hang
    ADD CONSTRAINT fp_farm_de_xuat_mua_hang_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kiem_ke_pt_chi_ti_id_dot_kiem_ke_pt_id_kho_id_h_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt_chi_tiet
    ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_chi_ti_id_dot_kiem_ke_pt_id_kho_id_h_key UNIQUE (id_dot_kiem_ke_pt, id_kho, id_hang_hoa);


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kiem_ke_pt_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt_chi_tiet
    ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_dot_kiem_ke_pt_kho fp_farm_dot_kiem_ke_pt_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt_kho
    ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_kho_pkey PRIMARY KEY (id_dot_kiem_ke_pt, id_kho);


--
-- Name: fp_farm_dot_kiem_ke_pt fp_farm_dot_kiem_ke_pt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt
    ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_du_bao_sl_dong_thung fp_farm_du_bao_sl_dong_thung_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_du_bao_sl_dong_thung
    ADD CONSTRAINT fp_farm_du_bao_sl_dong_thung_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet fp_farm_phieu_kho_phan_thuoc_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_phieu_kho_phan_thuoc_chi_tiet
    ADD CONSTRAINT fp_farm_phieu_kho_phan_thuoc_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_phieu_kho_phan_thuoc fp_farm_phieu_kho_phan_thuoc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_phieu_kho_phan_thuoc
    ADD CONSTRAINT fp_farm_phieu_kho_phan_thuoc_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_thu_hoach fp_farm_thu_hoach_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_thu_hoach
    ADD CONSTRAINT fp_farm_thu_hoach_pkey PRIMARY KEY (id);


--
-- Name: fp_farm_tien_do_mua_hang fp_farm_tien_do_mua_hang_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_tien_do_mua_hang
    ADD CONSTRAINT fp_farm_tien_do_mua_hang_ma_key UNIQUE (ma);


--
-- Name: fp_farm_tien_do_mua_hang fp_farm_tien_do_mua_hang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_tien_do_mua_hang
    ADD CONSTRAINT fp_farm_tien_do_mua_hang_pkey PRIMARY KEY (id);


--
-- Name: fp_hc_cong_viec fp_hc_cong_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hc_cong_viec
    ADD CONSTRAINT fp_hc_cong_viec_pkey PRIMARY KEY (id);


--
-- Name: fp_hc_noi_quan_ly fp_hc_noi_quan_ly_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hc_noi_quan_ly
    ADD CONSTRAINT fp_hc_noi_quan_ly_pkey PRIMARY KEY (id);


--
-- Name: fp_hr_bang_luong fp_hr_bang_luong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hr_bang_luong
    ADD CONSTRAINT fp_hr_bang_luong_pkey PRIMARY KEY (id);


--
-- Name: fp_hr_diem_cong_tru fp_hr_diem_cong_tru_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hr_diem_cong_tru
    ADD CONSTRAINT fp_hr_diem_cong_tru_pkey PRIMARY KEY (id);


--
-- Name: fp_hr_nhom_phieu_hanh_chinh fp_hr_nhom_phieu_hanh_chinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hr_nhom_phieu_hanh_chinh
    ADD CONSTRAINT fp_hr_nhom_phieu_hanh_chinh_pkey PRIMARY KEY (id);


--
-- Name: fp_hr_phieu_hanh_chinh fp_hr_phieu_hanh_chinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hr_phieu_hanh_chinh
    ADD CONSTRAINT fp_hr_phieu_hanh_chinh_pkey PRIMARY KEY (id);


--
-- Name: fp_hr_thiet_lap_diem_cong_tru fp_hr_thiet_lap_diem_cong_tru_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hr_thiet_lap_diem_cong_tru
    ADD CONSTRAINT fp_hr_thiet_lap_diem_cong_tru_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_danh_muc_hang_hoa fp_mh_danh_muc_hang_hoa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_danh_muc_hang_hoa
    ADD CONSTRAINT fp_mh_danh_muc_hang_hoa_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_danh_sach_doi_tac fp_mh_danh_sach_doi_tac_ma_doi_tac_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_danh_sach_doi_tac
    ADD CONSTRAINT fp_mh_danh_sach_doi_tac_ma_doi_tac_key UNIQUE (ma_doi_tac);


--
-- Name: fp_mh_danh_sach_doi_tac fp_mh_danh_sach_doi_tac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_danh_sach_doi_tac
    ADD CONSTRAINT fp_mh_danh_sach_doi_tac_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_danh_sach_hang_hoa fp_mh_danh_sach_hang_hoa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_danh_sach_hang_hoa
    ADD CONSTRAINT fp_mh_danh_sach_hang_hoa_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_danh_sach_kho fp_mh_danh_sach_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_danh_sach_kho
    ADD CONSTRAINT fp_mh_danh_sach_kho_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_dinh_muc_ton_kho fp_mh_dinh_muc_ton_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dinh_muc_ton_kho
    ADD CONSTRAINT fp_mh_dinh_muc_ton_kho_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_don_dat_hang_chi_tiet fp_mh_don_dat_hang_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_don_dat_hang_chi_tiet
    ADD CONSTRAINT fp_mh_don_dat_hang_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_don_dat_hang fp_mh_don_dat_hang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_don_dat_hang
    ADD CONSTRAINT fp_mh_don_dat_hang_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tie_id_dot_kiem_ke_kho_id_kho_id__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho_chi_tiet
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_chi_tie_id_dot_kiem_ke_kho_id_kho_id__key UNIQUE (id_dot_kiem_ke_kho, id_kho, id_hang_hoa);


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho_chi_tiet
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_dot_kiem_ke_kho_kho fp_mh_dot_kiem_ke_kho_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho_kho
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_kho_pkey PRIMARY KEY (id_dot_kiem_ke_kho, id_kho);


--
-- Name: fp_mh_dot_kiem_ke_kho fp_mh_dot_kiem_ke_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_hop_dong_ct fp_mh_hop_dong_ct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_hop_dong_ct
    ADD CONSTRAINT fp_mh_hop_dong_ct_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_hop_dong fp_mh_hop_dong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_hop_dong
    ADD CONSTRAINT fp_mh_hop_dong_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_nhom_doi_tac fp_mh_nhom_doi_tac_ma_nhom_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_nhom_doi_tac
    ADD CONSTRAINT fp_mh_nhom_doi_tac_ma_nhom_key UNIQUE (ma_nhom);


--
-- Name: fp_mh_nhom_doi_tac fp_mh_nhom_doi_tac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_nhom_doi_tac
    ADD CONSTRAINT fp_mh_nhom_doi_tac_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet fp_mh_phieu_de_xuat_vat_tu_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet
    ADD CONSTRAINT fp_mh_phieu_de_xuat_vat_tu_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu fp_mh_phieu_de_xuat_vat_tu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_de_xuat_vat_tu
    ADD CONSTRAINT fp_mh_phieu_de_xuat_vat_tu_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_phieu_kho_chi_tiet fp_mh_phieu_kho_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kho_chi_tiet
    ADD CONSTRAINT fp_mh_phieu_kho_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_phieu_kho fp_mh_phieu_kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kho
    ADD CONSTRAINT fp_mh_phieu_kho_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_phieu_kho_so_phieu fp_mh_phieu_kho_so_phieu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kho_so_phieu
    ADD CONSTRAINT fp_mh_phieu_kho_so_phieu_pkey PRIMARY KEY (loai, nam);


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet fp_mh_phieu_kiem_ke_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kiem_ke_chi_tiet
    ADD CONSTRAINT fp_mh_phieu_kiem_ke_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_phieu_kiem_ke fp_mh_phieu_kiem_ke_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kiem_ke
    ADD CONSTRAINT fp_mh_phieu_kiem_ke_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_tag_doi_tac fp_mh_tag_doi_tac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_tag_doi_tac
    ADD CONSTRAINT fp_mh_tag_doi_tac_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_thanh_toan_doi_tac fp_mh_thanh_toan_doi_tac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_thanh_toan_doi_tac
    ADD CONSTRAINT fp_mh_thanh_toan_doi_tac_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_tien_do_mua_hang fp_mh_tien_do_mua_hang_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_tien_do_mua_hang
    ADD CONSTRAINT fp_mh_tien_do_mua_hang_ma_key UNIQUE (ma);


--
-- Name: fp_mh_tien_do_mua_hang fp_mh_tien_do_mua_hang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_tien_do_mua_hang
    ADD CONSTRAINT fp_mh_tien_do_mua_hang_pkey PRIMARY KEY (id);


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac fp_mh_trang_thai_thanh_toan_doi_tac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_trang_thai_thanh_toan_doi_tac
    ADD CONSTRAINT fp_mh_trang_thai_thanh_toan_doi_tac_pkey PRIMARY KEY (id);


--
-- Name: fp_tc_hang_muc_thu_chi fp_tc_hang_muc_thu_chi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_tc_hang_muc_thu_chi
    ADD CONSTRAINT fp_tc_hang_muc_thu_chi_pkey PRIMARY KEY (id);


--
-- Name: fp_tc_quy_thu_chi fp_tc_quy_thu_chi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_tc_quy_thu_chi
    ADD CONSTRAINT fp_tc_quy_thu_chi_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_chi_phi_tai_san fp_ts_chi_phi_tai_san_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_chi_phi_tai_san
    ADD CONSTRAINT fp_ts_chi_phi_tai_san_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_chi_tiet_khau_hao fp_ts_chi_tiet_khau_hao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_chi_tiet_khau_hao
    ADD CONSTRAINT fp_ts_chi_tiet_khau_hao_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet fp_ts_dot_kiem_ke_tai_san_chi_tie_id_dot_kiem_ke_id_tai_san_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
    ADD CONSTRAINT fp_ts_dot_kiem_ke_tai_san_chi_tie_id_dot_kiem_ke_id_tai_san_key UNIQUE (id_dot_kiem_ke, id_tai_san);


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet fp_ts_dot_kiem_ke_tai_san_chi_tiet_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
    ADD CONSTRAINT fp_ts_dot_kiem_ke_tai_san_chi_tiet_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_dot_kiem_ke_tai_san fp_ts_dot_kiem_ke_tai_san_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_dot_kiem_ke_tai_san
    ADD CONSTRAINT fp_ts_dot_kiem_ke_tai_san_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_ky_khau_hao fp_ts_ky_khau_hao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_ky_khau_hao
    ADD CONSTRAINT fp_ts_ky_khau_hao_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_loai_chi_phi fp_ts_loai_chi_phi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_loai_chi_phi
    ADD CONSTRAINT fp_ts_loai_chi_phi_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_nhom_tai_san fp_ts_nhom_tai_san_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_nhom_tai_san
    ADD CONSTRAINT fp_ts_nhom_tai_san_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct fp_ts_phieu_cap_phat_thu_hoi_ct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_phieu_cap_phat_thu_hoi_ct
    ADD CONSTRAINT fp_ts_phieu_cap_phat_thu_hoi_ct_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi fp_ts_phieu_cap_phat_thu_hoi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_phieu_cap_phat_thu_hoi
    ADD CONSTRAINT fp_ts_phieu_cap_phat_thu_hoi_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_tai_san fp_ts_tai_san_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_tai_san
    ADD CONSTRAINT fp_ts_tai_san_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san fp_ts_trang_thai_chi_phi_tai_san_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_trang_thai_chi_phi_tai_san
    ADD CONSTRAINT fp_ts_trang_thai_chi_phi_tai_san_pkey PRIMARY KEY (id);


--
-- Name: fp_ts_trang_thai_tai_san fp_ts_trang_thai_tai_san_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_trang_thai_tai_san
    ADD CONSTRAINT fp_ts_trang_thai_tai_san_pkey PRIMARY KEY (id);


--
-- Name: fp_var_cap_bac fp_var_cap_bac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_cap_bac
    ADD CONSTRAINT fp_var_cap_bac_pkey PRIMARY KEY (id);


--
-- Name: fp_var_chi_nhanh fp_var_chi_nhanh_ma_chi_nhanh_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_chi_nhanh
    ADD CONSTRAINT fp_var_chi_nhanh_ma_chi_nhanh_key UNIQUE (ma_chi_nhanh);


--
-- Name: fp_var_chi_nhanh fp_var_chi_nhanh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_chi_nhanh
    ADD CONSTRAINT fp_var_chi_nhanh_pkey PRIMARY KEY (id);


--
-- Name: fp_var_chuc_vu fp_var_chuc_vu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_chuc_vu
    ADD CONSTRAINT fp_var_chuc_vu_pkey PRIMARY KEY (id);


--
-- Name: fp_var_lan_dang_nhap_sai fp_var_lan_dang_nhap_sai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_lan_dang_nhap_sai
    ADD CONSTRAINT fp_var_lan_dang_nhap_sai_pkey PRIMARY KEY (id);


--
-- Name: fp_var_nhan_vien fp_var_nhan_vien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_nhan_vien
    ADD CONSTRAINT fp_var_nhan_vien_pkey PRIMARY KEY (id);


--
-- Name: fp_var_phan_quyen fp_var_phan_quyen_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_phan_quyen
    ADD CONSTRAINT fp_var_phan_quyen_pkey PRIMARY KEY (id);


--
-- Name: fp_var_phien_dang_nhap fp_var_phien_dang_nhap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_phien_dang_nhap
    ADD CONSTRAINT fp_var_phien_dang_nhap_pkey PRIMARY KEY (id);


--
-- Name: fp_var_phien_dang_nhap fp_var_phien_dang_nhap_refresh_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_phien_dang_nhap
    ADD CONSTRAINT fp_var_phien_dang_nhap_refresh_hash_key UNIQUE (refresh_hash);


--
-- Name: fp_var_phong_ban fp_var_phong_ban_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_phong_ban
    ADD CONSTRAINT fp_var_phong_ban_pkey PRIMARY KEY (id);


--
-- Name: fp_var_push_subscription fp_var_push_subscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_push_subscription
    ADD CONSTRAINT fp_var_push_subscription_pkey PRIMARY KEY (id);


--
-- Name: fp_var_su_kien_thong_bao fp_var_su_kien_thong_bao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_su_kien_thong_bao
    ADD CONSTRAINT fp_var_su_kien_thong_bao_pkey PRIMARY KEY (id);


--
-- Name: fp_var_thong_bao_cai_dat fp_var_thong_bao_cai_dat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao_cai_dat
    ADD CONSTRAINT fp_var_thong_bao_cai_dat_pkey PRIMARY KEY (id);


--
-- Name: fp_var_thong_bao fp_var_thong_bao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao
    ADD CONSTRAINT fp_var_thong_bao_pkey PRIMARY KEY (id);


--
-- Name: fp_var_thong_bao_tuy_chon fp_var_thong_bao_tuy_chon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao_tuy_chon
    ADD CONSTRAINT fp_var_thong_bao_tuy_chon_pkey PRIMARY KEY (nhan_vien_id);


--
-- Name: fp_var_tt_cong_ty fp_var_tt_cong_ty_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_tt_cong_ty
    ADD CONSTRAINT fp_var_tt_cong_ty_pkey PRIMARY KEY (id);


--
-- Name: fp_hr_bang_luong uq_bang_luong_nhan_vien_ky; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hr_bang_luong
    ADD CONSTRAINT uq_bang_luong_nhan_vien_ky UNIQUE (nhan_vien_id, nam, thang);


--
-- Name: fp_var_phan_quyen uq_fp_var_phan_quyen_chuc_vu_module; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_phan_quyen
    ADD CONSTRAINT uq_fp_var_phan_quyen_chuc_vu_module UNIQUE (chuc_vu_id, module_id);


--
-- Name: fp_var_push_subscription uq_fp_var_push_subscription_endpoint; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_push_subscription
    ADD CONSTRAINT uq_fp_var_push_subscription_endpoint UNIQUE (endpoint);


--
-- Name: fp_var_thong_bao_cai_dat uq_fp_var_thong_bao_cai_dat; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao_cai_dat
    ADD CONSTRAINT uq_fp_var_thong_bao_cai_dat UNIQUE (nhan_vien_id, module_id, loai_su_kien);


--
-- Name: fp_var_lan_dang_nhap_sai_email_luc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fp_var_lan_dang_nhap_sai_email_luc_idx ON public.fp_var_lan_dang_nhap_sai USING btree (email, luc DESC);


--
-- Name: fp_var_phien_dang_nhap_con_hieu_luc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fp_var_phien_dang_nhap_con_hieu_luc_idx ON public.fp_var_phien_dang_nhap USING btree (het_han_luc) WHERE (thu_hoi_luc IS NULL);


--
-- Name: fp_var_phien_dang_nhap_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fp_var_phien_dang_nhap_email_idx ON public.fp_var_phien_dang_nhap USING btree (email);


--
-- Name: idx_farm_chi_nhanh_tg; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_farm_chi_nhanh_tg ON public.fp_farm_thu_hoach USING btree (id_chi_nhanh, nam, tuan);


--
-- Name: idx_fp_farm_bcnc_chi_nhanh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcnc_chi_nhanh ON public.fp_farm_bao_cao_nhan_cong USING btree (id_chi_nhanh);


--
-- Name: idx_fp_farm_bcnc_ct_bao_cao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcnc_ct_bao_cao ON public.fp_farm_bao_cao_nhan_cong_ct USING btree (id_bao_cao);


--
-- Name: idx_fp_farm_bcnc_ct_sub_ct; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcnc_ct_sub_ct ON public.fp_farm_bao_cao_nhan_cong_ct_sub USING btree (id_bcnc_ct);


--
-- Name: idx_fp_farm_bcnc_ct_sub_ct_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcnc_ct_sub_ct_loai ON public.fp_farm_bao_cao_nhan_cong_ct_sub USING btree (id_bcnc_ct, loai_chi_tieu, thu_tu);


--
-- Name: idx_fp_farm_bcnc_kpi_bao_cao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcnc_kpi_bao_cao ON public.fp_farm_bao_cao_nhan_cong_kpi USING btree (id_bao_cao);


--
-- Name: idx_fp_farm_bcnc_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcnc_ngay ON public.fp_farm_bao_cao_nhan_cong USING btree (ngay DESC);


--
-- Name: idx_fp_farm_bcsc_chi_nhanh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcsc_chi_nhanh ON public.fp_farm_bao_cao_so_che USING btree (id_chi_nhanh);


--
-- Name: idx_fp_farm_bcsc_ct_bao_cao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcsc_ct_bao_cao ON public.fp_farm_bao_cao_so_che_ct USING btree (id_bao_cao);


--
-- Name: idx_fp_farm_bcsc_kpi_bao_cao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcsc_kpi_bao_cao ON public.fp_farm_bao_cao_so_che_kpi USING btree (id_bao_cao);


--
-- Name: idx_fp_farm_bcsc_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcsc_ngay ON public.fp_farm_bao_cao_so_che USING btree (ngay DESC);


--
-- Name: idx_fp_farm_bcsc_pc_bao_cao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_bcsc_pc_bao_cao ON public.fp_farm_bao_cao_so_che_pham_cap USING btree (id_bao_cao);


--
-- Name: idx_fp_farm_danh_muc_hang_hoa_danh_muc_cha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_danh_muc_hang_hoa_danh_muc_cha_id ON public.fp_farm_danh_muc_hang_hoa USING btree (danh_muc_cha_id);


--
-- Name: idx_fp_farm_danh_muc_hang_hoa_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_danh_muc_hang_hoa_thu_tu ON public.fp_farm_danh_muc_hang_hoa USING btree (thu_tu);


--
-- Name: idx_fp_farm_danh_sach_hang_hoa_danh_muc_cha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_danh_sach_hang_hoa_danh_muc_cha_id ON public.fp_farm_danh_sach_hang_hoa USING btree (danh_muc_cha_id);


--
-- Name: idx_fp_farm_danh_sach_hang_hoa_danh_muc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_danh_sach_hang_hoa_danh_muc_id ON public.fp_farm_danh_sach_hang_hoa USING btree (danh_muc_id);


--
-- Name: idx_fp_farm_danh_sach_hang_hoa_ma_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_danh_sach_hang_hoa_ma_trgm ON public.fp_farm_danh_sach_hang_hoa USING gin (ma_hang_hoa public.gin_trgm_ops);


--
-- Name: idx_fp_farm_danh_sach_hang_hoa_ten_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_danh_sach_hang_hoa_ten_trgm ON public.fp_farm_danh_sach_hang_hoa USING gin (ten_hang_hoa public.gin_trgm_ops);


--
-- Name: idx_fp_farm_dbdt_chi_nhanh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dbdt_chi_nhanh ON public.fp_farm_du_bao_sl_dong_thung USING btree (id_chi_nhanh);


--
-- Name: idx_fp_farm_dbdt_chi_nhanh_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dbdt_chi_nhanh_ngay ON public.fp_farm_du_bao_sl_dong_thung USING btree (id_chi_nhanh, ngay DESC);


--
-- Name: idx_fp_farm_dbdt_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dbdt_ngay ON public.fp_farm_du_bao_sl_dong_thung USING btree (ngay DESC);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_ghi_chu_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_ghi_chu_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ghi_chu public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_so_phieu_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_so_phieu_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (so_phieu public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_ten_nguoi_duyet_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_ten_nguoi_duyet_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_nguoi_duyet public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_ten_nguoi_dx_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_ten_nguoi_dx_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_nguoi_de_xuat public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_ten_noi_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_ten_noi_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_noi_de_xuat public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_ten_tien_do_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_ten_tien_do_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (ten_tien_do_mh public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_thong_so_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_thong_so_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (thong_so public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mh_ct_trao_doi_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mh_ct_trao_doi_trgm ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING gin (trao_doi public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_ct_id_hang_hoa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_ct_id_hang_hoa ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING btree (id_hang_hoa);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_ct_id_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_ct_id_phieu ON public.fp_farm_de_xuat_mua_hang_chi_tiet USING btree (id_de_xuat_mua_hang);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_ghi_chu_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_ghi_chu_trgm ON public.fp_farm_de_xuat_mua_hang USING gin (ghi_chu public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_id_nguoi_de_xuat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_id_nguoi_de_xuat ON public.fp_farm_de_xuat_mua_hang USING btree (id_nguoi_de_xuat);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_id_noi_de_xuat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_id_noi_de_xuat ON public.fp_farm_de_xuat_mua_hang USING btree (id_noi_de_xuat);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_ngay ON public.fp_farm_de_xuat_mua_hang USING btree (ngay);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_ngay_can; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_ngay_can ON public.fp_farm_de_xuat_mua_hang USING btree (ngay_can);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_so_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_farm_de_xuat_mua_hang_so_phieu ON public.fp_farm_de_xuat_mua_hang USING btree (so_phieu);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_so_phieu_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_so_phieu_trgm ON public.fp_farm_de_xuat_mua_hang USING gin (so_phieu public.gin_trgm_ops);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_trang_thai ON public.fp_farm_de_xuat_mua_hang USING btree (trang_thai);


--
-- Name: idx_fp_farm_de_xuat_mua_hang_trang_thai_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_de_xuat_mua_hang_trang_thai_trgm ON public.fp_farm_de_xuat_mua_hang USING gin (trang_thai public.gin_trgm_ops);


--
-- Name: idx_fp_farm_dot_kk_pt_ct_id_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_ct_id_dot ON public.fp_farm_dot_kiem_ke_pt_chi_tiet USING btree (id_dot_kiem_ke_pt);


--
-- Name: idx_fp_farm_dot_kk_pt_ct_id_hang_hoa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_ct_id_hang_hoa ON public.fp_farm_dot_kiem_ke_pt_chi_tiet USING btree (id_hang_hoa);


--
-- Name: idx_fp_farm_dot_kk_pt_ct_id_kho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_ct_id_kho ON public.fp_farm_dot_kiem_ke_pt_chi_tiet USING btree (id_kho);


--
-- Name: idx_fp_farm_dot_kk_pt_ct_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_ct_phieu ON public.fp_farm_dot_kiem_ke_pt_chi_tiet USING btree (id_phieu_kho_dieu_chinh) WHERE (id_phieu_kho_dieu_chinh IS NOT NULL);


--
-- Name: idx_fp_farm_dot_kk_pt_kho_id_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_kho_id_dot ON public.fp_farm_dot_kiem_ke_pt_kho USING btree (id_dot_kiem_ke_pt);


--
-- Name: idx_fp_farm_dot_kk_pt_kho_id_kho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_kho_id_kho ON public.fp_farm_dot_kiem_ke_pt_kho USING btree (id_kho);


--
-- Name: idx_fp_farm_dot_kk_pt_ma_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_farm_dot_kk_pt_ma_dot ON public.fp_farm_dot_kiem_ke_pt USING btree (ma_dot);


--
-- Name: idx_fp_farm_dot_kk_pt_ngay_bat_dau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_ngay_bat_dau ON public.fp_farm_dot_kiem_ke_pt USING btree (ngay_bat_dau);


--
-- Name: idx_fp_farm_dot_kk_pt_ngay_ket_thuc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_ngay_ket_thuc ON public.fp_farm_dot_kiem_ke_pt USING btree (ngay_ket_thuc);


--
-- Name: idx_fp_farm_dot_kk_pt_nguoi_phu_trach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_nguoi_phu_trach ON public.fp_farm_dot_kiem_ke_pt USING btree (id_nguoi_phu_trach);


--
-- Name: idx_fp_farm_dot_kk_pt_nguoi_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_nguoi_tao ON public.fp_farm_dot_kiem_ke_pt USING btree (id_nguoi_tao);


--
-- Name: idx_fp_farm_dot_kk_pt_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_dot_kk_pt_trang_thai ON public.fp_farm_dot_kiem_ke_pt USING btree (trang_thai);


--
-- Name: idx_fp_farm_phieu_kho_pt_ct_id_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_phieu_kho_pt_ct_id_phieu ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet USING btree (id_phieu_kho);


--
-- Name: idx_fp_farm_phieu_kho_pt_id_de_xuat_mua_hang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_phieu_kho_pt_id_de_xuat_mua_hang ON public.fp_farm_phieu_kho_phan_thuoc USING btree (id_de_xuat_mua_hang) WHERE (id_de_xuat_mua_hang IS NOT NULL);


--
-- Name: idx_fp_farm_phieu_kho_pt_kho_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_phieu_kho_pt_kho_id ON public.fp_farm_phieu_kho_phan_thuoc USING btree (kho_id);


--
-- Name: idx_fp_farm_phieu_kho_pt_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_phieu_kho_pt_loai ON public.fp_farm_phieu_kho_phan_thuoc USING btree (loai);


--
-- Name: idx_fp_farm_phieu_kho_pt_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_farm_phieu_kho_pt_ngay ON public.fp_farm_phieu_kho_phan_thuoc USING btree (ngay);


--
-- Name: idx_fp_farm_phieu_kho_pt_so_phieu_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_farm_phieu_kho_pt_so_phieu_loai ON public.fp_farm_phieu_kho_phan_thuoc USING btree (so_phieu, loai);


--
-- Name: idx_fp_hc_cong_viec_id_cha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_cong_viec_id_cha ON public.fp_hc_cong_viec USING btree (id_cha);


--
-- Name: idx_fp_hc_cong_viec_id_nguoi_giao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_cong_viec_id_nguoi_giao ON public.fp_hc_cong_viec USING btree (id_nguoi_giao);


--
-- Name: idx_fp_hc_cong_viec_nguoi_ho_tro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_cong_viec_nguoi_ho_tro ON public.fp_hc_cong_viec USING gin (nguoi_ho_tro);


--
-- Name: idx_fp_hc_cong_viec_tg_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_cong_viec_tg_tao ON public.fp_hc_cong_viec USING btree (tg_tao);


--
-- Name: idx_fp_hc_cong_viec_trach_nhiem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_cong_viec_trach_nhiem ON public.fp_hc_cong_viec USING btree (trach_nhiem);


--
-- Name: idx_fp_hc_cong_viec_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_cong_viec_trang_thai ON public.fp_hc_cong_viec USING btree (trang_thai);


--
-- Name: idx_fp_hc_noi_quan_ly_id_chi_nhanh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_noi_quan_ly_id_chi_nhanh ON public.fp_hc_noi_quan_ly USING btree (id_chi_nhanh);


--
-- Name: idx_fp_hc_noi_quan_ly_ma_chi_nhanh; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_hc_noi_quan_ly_ma_chi_nhanh ON public.fp_hc_noi_quan_ly USING btree (ma, id_chi_nhanh);


--
-- Name: idx_fp_hc_noi_quan_ly_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_noi_quan_ly_thu_tu ON public.fp_hc_noi_quan_ly USING btree (thu_tu);


--
-- Name: idx_fp_hc_noi_quan_ly_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hc_noi_quan_ly_trang_thai ON public.fp_hc_noi_quan_ly USING btree (trang_thai);


--
-- Name: idx_fp_hr_bang_luong_ky; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_bang_luong_ky ON public.fp_hr_bang_luong USING btree (nam, thang);


--
-- Name: idx_fp_hr_bang_luong_nhan_vien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_bang_luong_nhan_vien ON public.fp_hr_bang_luong USING btree (nhan_vien_id);


--
-- Name: idx_fp_hr_bang_luong_tg; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_bang_luong_tg ON public.fp_hr_bang_luong USING btree (tg_cap_nhat DESC NULLS LAST);


--
-- Name: idx_fp_hr_diem_cong_tru_id_hang_muc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_diem_cong_tru_id_hang_muc ON public.fp_hr_diem_cong_tru USING btree (id_hang_muc);


--
-- Name: idx_fp_hr_diem_cong_tru_id_nhan_vien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_diem_cong_tru_id_nhan_vien ON public.fp_hr_diem_cong_tru USING btree (id_nhan_vien);


--
-- Name: idx_fp_hr_diem_cong_tru_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_diem_cong_tru_loai ON public.fp_hr_diem_cong_tru USING btree (loai);


--
-- Name: idx_fp_hr_diem_cong_tru_nam_thang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_diem_cong_tru_nam_thang ON public.fp_hr_diem_cong_tru USING btree (nam, thang);


--
-- Name: idx_fp_hr_nhom_phieu_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_nhom_phieu_loai ON public.fp_hr_nhom_phieu_hanh_chinh USING btree (loai_phieu);


--
-- Name: idx_fp_hr_nhom_phieu_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_nhom_phieu_trang_thai ON public.fp_hr_nhom_phieu_hanh_chinh USING btree (trang_thai);


--
-- Name: idx_fp_hr_thiet_lap_diem_cong_tru_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_loai ON public.fp_hr_thiet_lap_diem_cong_tru USING btree (loai);


--
-- Name: idx_fp_hr_thiet_lap_diem_cong_tru_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_ma ON public.fp_hr_thiet_lap_diem_cong_tru USING btree (ma);


--
-- Name: idx_fp_hr_thiet_lap_diem_cong_tru_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_thu_tu ON public.fp_hr_thiet_lap_diem_cong_tru USING btree (thu_tu);


--
-- Name: idx_fp_hr_thiet_lap_diem_cong_tru_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_trang_thai ON public.fp_hr_thiet_lap_diem_cong_tru USING btree (trang_thai);


--
-- Name: idx_fp_mh_danh_sach_doi_tac_id_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_danh_sach_doi_tac_id_nhom ON public.fp_mh_danh_sach_doi_tac USING btree (id_nhom);


--
-- Name: idx_fp_mh_danh_sach_doi_tac_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_danh_sach_doi_tac_loai ON public.fp_mh_danh_sach_doi_tac USING btree (loai_doi_tac);


--
-- Name: idx_fp_mh_danh_sach_doi_tac_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_danh_sach_doi_tac_thu_tu ON public.fp_mh_danh_sach_doi_tac USING btree (thu_tu);


--
-- Name: idx_fp_mh_danh_sach_doi_tac_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_danh_sach_doi_tac_trang_thai ON public.fp_mh_danh_sach_doi_tac USING btree (trang_thai);


--
-- Name: idx_fp_mh_don_dat_hang_chi_tiet_id_don; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_chi_tiet_id_don ON public.fp_mh_don_dat_hang_chi_tiet USING btree (id_don_dat_hang);


--
-- Name: idx_fp_mh_don_dat_hang_chi_tiet_id_hang_hoa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_chi_tiet_id_hang_hoa ON public.fp_mh_don_dat_hang_chi_tiet USING btree (id_hang_hoa);


--
-- Name: idx_fp_mh_don_dat_hang_chi_tiet_phan_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_chi_tiet_phan_loai ON public.fp_mh_don_dat_hang_chi_tiet USING btree (phan_loai) WHERE (phan_loai IS NOT NULL);


--
-- Name: idx_fp_mh_don_dat_hang_chi_tiet_phan_loai_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_chi_tiet_phan_loai_trgm ON public.fp_mh_don_dat_hang_chi_tiet USING gin (phan_loai public.gin_trgm_ops) WHERE (phan_loai IS NOT NULL);


--
-- Name: idx_fp_mh_don_dat_hang_id_kho_nhan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_id_kho_nhan ON public.fp_mh_don_dat_hang USING btree (id_kho_nhan);


--
-- Name: idx_fp_mh_don_dat_hang_id_nguoi_dat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_id_nguoi_dat ON public.fp_mh_don_dat_hang USING btree (id_nguoi_dat);


--
-- Name: idx_fp_mh_don_dat_hang_id_nha_cung_cap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_id_nha_cung_cap ON public.fp_mh_don_dat_hang USING btree (id_nha_cung_cap);


--
-- Name: idx_fp_mh_don_dat_hang_id_phieu_de_xuat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_id_phieu_de_xuat ON public.fp_mh_don_dat_hang USING btree (id_phieu_de_xuat_vat_tu);


--
-- Name: idx_fp_mh_don_dat_hang_ngay_dat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_ngay_dat ON public.fp_mh_don_dat_hang USING btree (ngay_dat);


--
-- Name: idx_fp_mh_don_dat_hang_ngay_giao_dk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_ngay_giao_dk ON public.fp_mh_don_dat_hang USING btree (ngay_giao_dk);


--
-- Name: idx_fp_mh_don_dat_hang_so_po; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_don_dat_hang_so_po ON public.fp_mh_don_dat_hang USING btree (so_po);


--
-- Name: idx_fp_mh_don_dat_hang_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_don_dat_hang_trang_thai ON public.fp_mh_don_dat_hang USING btree (trang_thai);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_dot ON public.fp_mh_dot_kiem_ke_kho_chi_tiet USING btree (id_dot_kiem_ke_kho);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_hang_hoa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_hang_hoa ON public.fp_mh_dot_kiem_ke_kho_chi_tiet USING btree (id_hang_hoa);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_kho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_kho ON public.fp_mh_dot_kiem_ke_kho_chi_tiet USING btree (id_kho);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_id_nguoi_phu_trach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_id_nguoi_phu_trach ON public.fp_mh_dot_kiem_ke_kho USING btree (id_nguoi_phu_trach);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_id_nguoi_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_id_nguoi_tao ON public.fp_mh_dot_kiem_ke_kho USING btree (id_nguoi_tao);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_kho_id_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_kho_id_dot ON public.fp_mh_dot_kiem_ke_kho_kho USING btree (id_dot_kiem_ke_kho);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_ma_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_dot_kiem_ke_kho_ma_dot ON public.fp_mh_dot_kiem_ke_kho USING btree (ma_dot);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_ngay_bat_dau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_ngay_bat_dau ON public.fp_mh_dot_kiem_ke_kho USING btree (ngay_bat_dau);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_ngay_ket_thuc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_ngay_ket_thuc ON public.fp_mh_dot_kiem_ke_kho USING btree (ngay_ket_thuc);


--
-- Name: idx_fp_mh_dot_kiem_ke_kho_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_trang_thai ON public.fp_mh_dot_kiem_ke_kho USING btree (trang_thai);


--
-- Name: idx_fp_mh_dot_kk_ct_id_phieu_dieu_chinh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_dot_kk_ct_id_phieu_dieu_chinh ON public.fp_mh_dot_kiem_ke_kho_chi_tiet USING btree (id_phieu_kho_dieu_chinh) WHERE (id_phieu_kho_dieu_chinh IS NOT NULL);


--
-- Name: idx_fp_mh_hop_dong_ct_cn; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_hop_dong_ct_cn ON public.fp_mh_hop_dong_ct USING btree (id_chi_nhanh);


--
-- Name: idx_fp_mh_hop_dong_ct_id_hd; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_hop_dong_ct_id_hd ON public.fp_mh_hop_dong_ct USING btree (id_hop_dong);


--
-- Name: idx_fp_mh_hop_dong_ct_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_hop_dong_ct_ngay ON public.fp_mh_hop_dong_ct USING btree (ngay);


--
-- Name: idx_fp_mh_hop_dong_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_hop_dong_ma ON public.fp_mh_hop_dong USING btree (ma_hop_dong);


--
-- Name: idx_fp_mh_hop_dong_ncc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_hop_dong_ncc ON public.fp_mh_hop_dong USING btree (id_nha_cung_cap);


--
-- Name: idx_fp_mh_hop_dong_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_hop_dong_ngay ON public.fp_mh_hop_dong USING btree (ngay);


--
-- Name: idx_fp_mh_hop_dong_nguoi_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_hop_dong_nguoi_tao ON public.fp_mh_hop_dong USING btree (id_nguoi_tao);


--
-- Name: idx_fp_mh_hop_dong_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_hop_dong_trang_thai ON public.fp_mh_hop_dong USING btree (trang_thai);


--
-- Name: idx_fp_mh_nhom_doi_tac_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_nhom_doi_tac_thu_tu ON public.fp_mh_nhom_doi_tac USING btree (thu_tu);


--
-- Name: idx_fp_mh_nhom_doi_tac_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_nhom_doi_tac_trang_thai ON public.fp_mh_nhom_doi_tac USING btree (trang_thai);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_hang_hoa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_hang_hoa ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING btree (id_hang_hoa);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_phieu ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet USING btree (id_phieu_de_xuat_vat_tu);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_id_nguoi_de_xuat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_id_nguoi_de_xuat ON public.fp_mh_phieu_de_xuat_vat_tu USING btree (id_nguoi_de_xuat);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_id_noi_de_xuat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_id_noi_de_xuat ON public.fp_mh_phieu_de_xuat_vat_tu USING btree (id_noi_de_xuat);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_ngay ON public.fp_mh_phieu_de_xuat_vat_tu USING btree (ngay);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_ngay_can; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_ngay_can ON public.fp_mh_phieu_de_xuat_vat_tu USING btree (ngay_can);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_so_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_so_phieu ON public.fp_mh_phieu_de_xuat_vat_tu USING btree (so_phieu);


--
-- Name: idx_fp_mh_phieu_de_xuat_vat_tu_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_trang_thai ON public.fp_mh_phieu_de_xuat_vat_tu USING btree (trang_thai);


--
-- Name: idx_fp_mh_phieu_kho_chi_tiet_hang_qty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_chi_tiet_hang_qty ON public.fp_mh_phieu_kho_chi_tiet USING btree (id_hang_hoa) WHERE (so_luong > (0)::numeric);


--
-- Name: idx_fp_mh_phieu_kho_chi_tiet_id_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_chi_tiet_id_phieu ON public.fp_mh_phieu_kho_chi_tiet USING btree (id_phieu_kho);


--
-- Name: idx_fp_mh_phieu_kho_chi_tiet_id_phieu_kho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_chi_tiet_id_phieu_kho ON public.fp_mh_phieu_kho_chi_tiet USING btree (id_phieu_kho);


--
-- Name: idx_fp_mh_phieu_kho_id_don_dat_hang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_id_don_dat_hang ON public.fp_mh_phieu_kho USING btree (id_don_dat_hang) WHERE (id_don_dat_hang IS NOT NULL);


--
-- Name: idx_fp_mh_phieu_kho_kho_den_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_kho_den_id ON public.fp_mh_phieu_kho USING btree (kho_den_id) WHERE (kho_den_id IS NOT NULL);


--
-- Name: idx_fp_mh_phieu_kho_kho_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_kho_id ON public.fp_mh_phieu_kho USING btree (kho_id);


--
-- Name: idx_fp_mh_phieu_kho_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_ngay ON public.fp_mh_phieu_kho USING btree (ngay);


--
-- Name: idx_fp_mh_phieu_kho_ngay_tinh_ton; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kho_ngay_tinh_ton ON public.fp_mh_phieu_kho USING btree (ngay) WHERE (TRIM(BOTH FROM COALESCE(trang_thai, ''::text)) <> 'Không duyệt'::text);


--
-- Name: idx_fp_mh_phieu_kho_so_phieu_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_phieu_kho_so_phieu_loai ON public.fp_mh_phieu_kho USING btree (so_phieu, loai);


--
-- Name: idx_fp_mh_phieu_kiem_ke_chi_tiet_id_hang_hoa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kiem_ke_chi_tiet_id_hang_hoa ON public.fp_mh_phieu_kiem_ke_chi_tiet USING btree (id_hang_hoa);


--
-- Name: idx_fp_mh_phieu_kiem_ke_chi_tiet_id_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kiem_ke_chi_tiet_id_phieu ON public.fp_mh_phieu_kiem_ke_chi_tiet USING btree (id_phieu_kiem_ke);


--
-- Name: idx_fp_mh_phieu_kiem_ke_id_kho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kiem_ke_id_kho ON public.fp_mh_phieu_kiem_ke USING btree (id_kho);


--
-- Name: idx_fp_mh_phieu_kiem_ke_id_nguoi_duyet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kiem_ke_id_nguoi_duyet ON public.fp_mh_phieu_kiem_ke USING btree (id_nguoi_duyet);


--
-- Name: idx_fp_mh_phieu_kiem_ke_id_nguoi_thuc_hien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kiem_ke_id_nguoi_thuc_hien ON public.fp_mh_phieu_kiem_ke USING btree (id_nguoi_thuc_hien);


--
-- Name: idx_fp_mh_phieu_kiem_ke_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kiem_ke_ngay ON public.fp_mh_phieu_kiem_ke USING btree (ngay);


--
-- Name: idx_fp_mh_phieu_kiem_ke_so_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_phieu_kiem_ke_so_phieu ON public.fp_mh_phieu_kiem_ke USING btree (so_phieu);


--
-- Name: idx_fp_mh_phieu_kiem_ke_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_phieu_kiem_ke_trang_thai ON public.fp_mh_phieu_kiem_ke USING btree (trang_thai);


--
-- Name: idx_fp_mh_thanh_toan_doi_tac_id_doi_tac; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_id_doi_tac ON public.fp_mh_thanh_toan_doi_tac USING btree (id_doi_tac);


--
-- Name: idx_fp_mh_thanh_toan_doi_tac_id_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_id_don_vi ON public.fp_mh_thanh_toan_doi_tac USING btree (id_don_vi);


--
-- Name: idx_fp_mh_thanh_toan_doi_tac_id_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_id_trang_thai ON public.fp_mh_thanh_toan_doi_tac USING btree (id_trang_thai_thanh_toan);


--
-- Name: idx_fp_mh_thanh_toan_doi_tac_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_ngay ON public.fp_mh_thanh_toan_doi_tac USING btree (ngay);


--
-- Name: idx_fp_mh_thanh_toan_doi_tac_ngay_xu_ly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_ngay_xu_ly ON public.fp_mh_thanh_toan_doi_tac USING btree (ngay_xu_ly);


--
-- Name: idx_fp_mh_thanh_toan_doi_tac_so_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_thanh_toan_doi_tac_so_phieu ON public.fp_mh_thanh_toan_doi_tac USING btree (so_phieu);


--
-- Name: idx_fp_mh_thanh_toan_doi_tac_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_trang_thai ON public.fp_mh_thanh_toan_doi_tac USING btree (trang_thai);


--
-- Name: idx_fp_mh_ttttdt_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_mh_ttttdt_ma ON public.fp_mh_trang_thai_thanh_toan_doi_tac USING btree (ma);


--
-- Name: idx_fp_mh_ttttdt_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_ttttdt_thu_tu ON public.fp_mh_trang_thai_thanh_toan_doi_tac USING btree (thu_tu);


--
-- Name: idx_fp_mh_ttttdt_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_mh_ttttdt_trang_thai ON public.fp_mh_trang_thai_thanh_toan_doi_tac USING btree (trang_thai);


--
-- Name: idx_fp_tc_hang_muc_loai_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_tc_hang_muc_loai_thu_tu ON public.fp_tc_hang_muc_thu_chi USING btree (loai, thu_tu);


--
-- Name: idx_fp_tc_hang_muc_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_tc_hang_muc_ma ON public.fp_tc_hang_muc_thu_chi USING btree (ma);


--
-- Name: idx_fp_tc_hang_muc_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_tc_hang_muc_thu_tu ON public.fp_tc_hang_muc_thu_chi USING btree (thu_tu);


--
-- Name: idx_fp_tc_qtc_chung_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_tc_qtc_chung_tu ON public.fp_tc_quy_thu_chi USING btree (loai_chung_tu, id_chung_tu) WHERE (loai_chung_tu IS NOT NULL);


--
-- Name: idx_fp_tc_qtc_hang_muc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_tc_qtc_hang_muc ON public.fp_tc_quy_thu_chi USING btree (id_hang_muc);


--
-- Name: idx_fp_tc_qtc_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_tc_qtc_ngay ON public.fp_tc_quy_thu_chi USING btree (ngay DESC);


--
-- Name: idx_fp_tc_qtc_so_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_tc_qtc_so_phieu ON public.fp_tc_quy_thu_chi USING btree (so_phieu);


--
-- Name: idx_fp_tc_qtc_so_sach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_tc_qtc_so_sach ON public.fp_tc_quy_thu_chi USING btree (id_chi_nhanh, ngay, id);


--
-- Name: idx_fp_tc_qtc_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_tc_qtc_trang_thai ON public.fp_tc_quy_thu_chi USING btree (trang_thai) WHERE (trang_thai <> 'mo'::text);


--
-- Name: idx_fp_ts_chi_phi_tai_san_id_hang_muc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_hang_muc ON public.fp_ts_chi_phi_tai_san USING btree (id_hang_muc);


--
-- Name: idx_fp_ts_chi_phi_tai_san_id_nguoi_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_nguoi_tao ON public.fp_ts_chi_phi_tai_san USING btree (id_nguoi_tao) WHERE (id_nguoi_tao IS NOT NULL);


--
-- Name: idx_fp_ts_chi_phi_tai_san_id_tai_san; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_tai_san ON public.fp_ts_chi_phi_tai_san USING btree (id_tai_san);


--
-- Name: idx_fp_ts_chi_phi_tai_san_id_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_phi_tai_san_id_trang_thai ON public.fp_ts_chi_phi_tai_san USING btree (id_trang_thai);


--
-- Name: idx_fp_ts_chi_phi_tai_san_ma_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_chi_phi_tai_san_ma_phieu ON public.fp_ts_chi_phi_tai_san USING btree (ma_phieu);


--
-- Name: idx_fp_ts_chi_phi_tai_san_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_phi_tai_san_ngay ON public.fp_ts_chi_phi_tai_san USING btree (ngay);


--
-- Name: idx_fp_ts_chi_tiet_khau_hao_id_ky; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_tiet_khau_hao_id_ky ON public.fp_ts_chi_tiet_khau_hao USING btree (id_ky_khau_hao);


--
-- Name: idx_fp_ts_chi_tiet_khau_hao_id_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_tiet_khau_hao_id_nhom ON public.fp_ts_chi_tiet_khau_hao USING btree (id_nhom);


--
-- Name: idx_fp_ts_chi_tiet_khau_hao_id_tai_san; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_chi_tiet_khau_hao_id_tai_san ON public.fp_ts_chi_tiet_khau_hao USING btree (id_tai_san);


--
-- Name: idx_fp_ts_chi_tiet_khau_hao_ky_tai_san; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_chi_tiet_khau_hao_ky_tai_san ON public.fp_ts_chi_tiet_khau_hao USING btree (id_ky_khau_hao, id_tai_san);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_ct_id_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ct_id_dot ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet USING btree (id_dot_kiem_ke);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_ct_id_tai_san; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ct_id_tai_san ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet USING btree (id_tai_san);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_ct_ket_qua; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ct_ket_qua ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet USING btree (ket_qua);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_id_nguoi_phu_trach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_id_nguoi_phu_trach ON public.fp_ts_dot_kiem_ke_tai_san USING btree (id_nguoi_phu_trach);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_ma_dot; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ma_dot ON public.fp_ts_dot_kiem_ke_tai_san USING btree (ma_dot);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_ngay_bat_dau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ngay_bat_dau ON public.fp_ts_dot_kiem_ke_tai_san USING btree (ngay_bat_dau);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_ngay_ket_thuc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ngay_ket_thuc ON public.fp_ts_dot_kiem_ke_tai_san USING btree (ngay_ket_thuc);


--
-- Name: idx_fp_ts_dot_kiem_ke_tai_san_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_trang_thai ON public.fp_ts_dot_kiem_ke_tai_san USING btree (trang_thai);


--
-- Name: idx_fp_ts_ky_khau_hao_nam_thang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_ky_khau_hao_nam_thang ON public.fp_ts_ky_khau_hao USING btree (nam, thang);


--
-- Name: idx_fp_ts_ky_khau_hao_thang_nam; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_ky_khau_hao_thang_nam ON public.fp_ts_ky_khau_hao USING btree (thang, nam);


--
-- Name: idx_fp_ts_ky_khau_hao_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_ky_khau_hao_trang_thai ON public.fp_ts_ky_khau_hao USING btree (trang_thai);


--
-- Name: idx_fp_ts_loai_chi_phi_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_loai_chi_phi_ma ON public.fp_ts_loai_chi_phi USING btree (ma);


--
-- Name: idx_fp_ts_loai_chi_phi_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_loai_chi_phi_thu_tu ON public.fp_ts_loai_chi_phi USING btree (thu_tu);


--
-- Name: idx_fp_ts_loai_chi_phi_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_loai_chi_phi_trang_thai ON public.fp_ts_loai_chi_phi USING btree (trang_thai);


--
-- Name: idx_fp_ts_nhom_tai_san_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_nhom_tai_san_ma ON public.fp_ts_nhom_tai_san USING btree (ma);


--
-- Name: idx_fp_ts_nhom_tai_san_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_nhom_tai_san_thu_tu ON public.fp_ts_nhom_tai_san USING btree (thu_tu);


--
-- Name: idx_fp_ts_nhom_tai_san_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_nhom_tai_san_trang_thai ON public.fp_ts_nhom_tai_san USING btree (trang_thai);


--
-- Name: idx_fp_ts_phieu_cpth_ct_id_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_phieu_cpth_ct_id_phieu ON public.fp_ts_phieu_cap_phat_thu_hoi_ct USING btree (id_phieu);


--
-- Name: idx_fp_ts_phieu_cpth_ct_id_tai_san; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_phieu_cpth_ct_id_tai_san ON public.fp_ts_phieu_cap_phat_thu_hoi_ct USING btree (id_tai_san);


--
-- Name: idx_fp_ts_phieu_cpth_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_phieu_cpth_loai ON public.fp_ts_phieu_cap_phat_thu_hoi USING btree (loai_phieu);


--
-- Name: idx_fp_ts_phieu_cpth_ma_phieu; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_phieu_cpth_ma_phieu ON public.fp_ts_phieu_cap_phat_thu_hoi USING btree (ma_phieu);


--
-- Name: idx_fp_ts_phieu_cpth_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_phieu_cpth_ngay ON public.fp_ts_phieu_cap_phat_thu_hoi USING btree (ngay_thuc_hien);


--
-- Name: idx_fp_ts_tai_san_id_chi_nhanh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_id_chi_nhanh ON public.fp_ts_tai_san USING btree (id_chi_nhanh) WHERE (id_chi_nhanh IS NOT NULL);


--
-- Name: idx_fp_ts_tai_san_id_nguoi_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_id_nguoi_tao ON public.fp_ts_tai_san USING btree (id_nguoi_tao);


--
-- Name: idx_fp_ts_tai_san_id_nhan_vien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_id_nhan_vien ON public.fp_ts_tai_san USING btree (id_nhan_vien) WHERE (id_nhan_vien IS NOT NULL);


--
-- Name: idx_fp_ts_tai_san_id_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_id_nhom ON public.fp_ts_tai_san USING btree (id_nhom);


--
-- Name: idx_fp_ts_tai_san_id_noi_luu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_id_noi_luu ON public.fp_ts_tai_san USING btree (id_noi_luu);


--
-- Name: idx_fp_ts_tai_san_id_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_id_trang_thai ON public.fp_ts_tai_san USING btree (id_trang_thai);


--
-- Name: idx_fp_ts_tai_san_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_tai_san_ma ON public.fp_ts_tai_san USING btree (ma_tai_san);


--
-- Name: idx_fp_ts_tai_san_ma_barcode; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_ma_barcode ON public.fp_ts_tai_san USING btree (ma_barcode) WHERE ((ma_barcode IS NOT NULL) AND (ma_barcode <> ''::text));


--
-- Name: idx_fp_ts_tai_san_ngay_nhap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_tai_san_ngay_nhap ON public.fp_ts_tai_san USING btree (ngay_nhap);


--
-- Name: idx_fp_ts_trang_thai_cpts_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_trang_thai_cpts_ma ON public.fp_ts_trang_thai_chi_phi_tai_san USING btree (ma);


--
-- Name: idx_fp_ts_trang_thai_cpts_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_trang_thai_cpts_thu_tu ON public.fp_ts_trang_thai_chi_phi_tai_san USING btree (thu_tu);


--
-- Name: idx_fp_ts_trang_thai_tai_san_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_fp_ts_trang_thai_tai_san_ma ON public.fp_ts_trang_thai_tai_san USING btree (ma);


--
-- Name: idx_fp_ts_trang_thai_tai_san_thu_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_trang_thai_tai_san_thu_tu ON public.fp_ts_trang_thai_tai_san USING btree (thu_tu);


--
-- Name: idx_fp_ts_trang_thai_tai_san_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_ts_trang_thai_tai_san_trang_thai ON public.fp_ts_trang_thai_tai_san USING btree (trang_thai);


--
-- Name: idx_fp_var_chi_nhanh_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_chi_nhanh_ma ON public.fp_var_chi_nhanh USING btree (ma_chi_nhanh);


--
-- Name: idx_fp_var_nhan_vien_ho_ten; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_nhan_vien_ho_ten ON public.fp_var_nhan_vien USING btree (ho_va_ten);


--
-- Name: idx_fp_var_nhan_vien_id_chuc_vu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_nhan_vien_id_chuc_vu ON public.fp_var_nhan_vien USING btree (chuc_vu_id);


--
-- Name: idx_fp_var_nhan_vien_id_phong_ban; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_nhan_vien_id_phong_ban ON public.fp_var_nhan_vien USING btree (phong_ban_id);


--
-- Name: idx_fp_var_nhan_vien_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_nhan_vien_trang_thai ON public.fp_var_nhan_vien USING btree (trang_thai);


--
-- Name: idx_fp_var_phan_quyen_chuc_vu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_phan_quyen_chuc_vu_id ON public.fp_var_phan_quyen USING btree (chuc_vu_id);


--
-- Name: idx_fp_var_phan_quyen_module_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_phan_quyen_module_id ON public.fp_var_phan_quyen USING btree (module_id);


--
-- Name: idx_fp_var_push_subscription_nv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_push_subscription_nv ON public.fp_var_push_subscription USING btree (nhan_vien_id);


--
-- Name: idx_fp_var_su_kien_ban_ghi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_su_kien_ban_ghi ON public.fp_var_su_kien_thong_bao USING btree (bang, ban_ghi_id, tg_tao DESC);


--
-- Name: idx_fp_var_su_kien_chua_xu_ly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_su_kien_chua_xu_ly ON public.fp_var_su_kien_thong_bao USING btree (id) WHERE (tg_xu_ly IS NULL);


--
-- Name: idx_fp_var_su_kien_tg_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_su_kien_tg_tao ON public.fp_var_su_kien_thong_bao USING btree (tg_tao);


--
-- Name: idx_fp_var_thong_bao_cai_dat_nv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_thong_bao_cai_dat_nv ON public.fp_var_thong_bao_cai_dat USING btree (nhan_vien_id);


--
-- Name: idx_fp_var_thong_bao_chua_doc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_thong_bao_chua_doc ON public.fp_var_thong_bao USING btree (nguoi_nhan_id) WHERE ((da_doc = false) AND (da_xoa = false));


--
-- Name: idx_fp_var_thong_bao_gop; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_thong_bao_gop ON public.fp_var_thong_bao USING btree (nguoi_nhan_id, bang, ban_ghi_id, loai_su_kien, tg_cap_nhat DESC);


--
-- Name: idx_fp_var_thong_bao_module; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_thong_bao_module ON public.fp_var_thong_bao USING btree (nguoi_nhan_id, module_id, tg_tao DESC) WHERE (da_xoa = false);


--
-- Name: idx_fp_var_thong_bao_nguoi_nhan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fp_var_thong_bao_nguoi_nhan ON public.fp_var_thong_bao USING btree (nguoi_nhan_id, tg_tao DESC) WHERE (da_xoa = false);


--
-- Name: idx_nhan_vien_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nhan_vien_email ON public.fp_var_nhan_vien USING btree (email);


--
-- Name: uq_fp_farm_bcnc_chi_nhanh_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fp_farm_bcnc_chi_nhanh_ngay ON public.fp_farm_bao_cao_nhan_cong USING btree (id_chi_nhanh, ngay);


--
-- Name: uq_fp_farm_bcsc_chi_nhanh_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fp_farm_bcsc_chi_nhanh_ngay ON public.fp_farm_bao_cao_so_che USING btree (id_chi_nhanh, ngay);


--
-- Name: uq_fp_farm_bcsc_ct_bao_cao_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fp_farm_bcsc_ct_bao_cao_ma ON public.fp_farm_bao_cao_so_che_ct USING btree (id_bao_cao, ma_chi_tieu);


--
-- Name: uq_fp_farm_danh_muc_hang_hoa_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fp_farm_danh_muc_hang_hoa_ma ON public.fp_farm_danh_muc_hang_hoa USING btree (ma_danh_muc);


--
-- Name: uq_fp_farm_danh_sach_hang_hoa_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fp_farm_danh_sach_hang_hoa_ma ON public.fp_farm_danh_sach_hang_hoa USING btree (ma_hang_hoa);


--
-- Name: uq_fp_mh_danh_sach_hang_hoa_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_fp_mh_danh_sach_hang_hoa_ma ON public.fp_mh_danh_sach_hang_hoa USING btree (ma_hang_hoa);


--
-- Name: fp_farm_de_xuat_mua_hang tr_fp_farm_de_xuat_mua_hang_after_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_de_xuat_mua_hang_after_update AFTER UPDATE ON public.fp_farm_de_xuat_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fp_farm_de_xuat_mua_hang_after_update();


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet tr_fp_farm_de_xuat_mua_hang_ct_sync_phieu; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_de_xuat_mua_hang_ct_sync_phieu BEFORE INSERT OR UPDATE OF id_de_xuat_mua_hang ON public.fp_farm_de_xuat_mua_hang_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_farm_de_xuat_mua_hang_ct_sync_phieu();


--
-- Name: fp_farm_de_xuat_mua_hang tr_fp_farm_de_xuat_mua_hang_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_de_xuat_mua_hang_tg_cap_nhat BEFORE UPDATE ON public.fp_farm_de_xuat_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fp_farm_de_xuat_mua_hang_tg_cap_nhat();


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet tr_fp_farm_dot_kk_pt_ct_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_dot_kk_pt_ct_tg_cap_nhat BEFORE UPDATE ON public.fp_farm_dot_kiem_ke_pt_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_farm_dot_kiem_ke_pt_tg_cap_nhat();


--
-- Name: fp_farm_dot_kiem_ke_pt tr_fp_farm_dot_kk_pt_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_dot_kk_pt_tg_cap_nhat BEFORE UPDATE ON public.fp_farm_dot_kiem_ke_pt FOR EACH ROW EXECUTE FUNCTION public.fp_farm_dot_kiem_ke_pt_tg_cap_nhat();


--
-- Name: fp_farm_phieu_kho_phan_thuoc tr_fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke BEFORE DELETE ON public.fp_farm_phieu_kho_phan_thuoc FOR EACH ROW EXECUTE FUNCTION public.fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke();


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet tr_fp_farm_phieu_kho_pt_ct_thanh_tien; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_phieu_kho_pt_ct_thanh_tien BEFORE INSERT OR UPDATE ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_farm_phieu_kho_pt_ct_thanh_tien();


--
-- Name: fp_farm_phieu_kho_phan_thuoc tr_fp_farm_phieu_kho_pt_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_phieu_kho_pt_tg_cap_nhat BEFORE UPDATE ON public.fp_farm_phieu_kho_phan_thuoc FOR EACH ROW EXECUTE FUNCTION public.fp_farm_phieu_kho_pt_tg_cap_nhat();


--
-- Name: fp_farm_tien_do_mua_hang tr_fp_farm_tien_do_mua_hang_timestamps; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_farm_tien_do_mua_hang_timestamps BEFORE INSERT OR UPDATE ON public.fp_farm_tien_do_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fp_farm_tien_do_mua_hang_set_timestamps();


--
-- Name: fp_hc_cong_viec tr_fp_hc_cong_viec_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_hc_cong_viec_tg_cap_nhat BEFORE UPDATE ON public.fp_hc_cong_viec FOR EACH ROW EXECUTE FUNCTION public.fp_hc_cong_viec_tg_cap_nhat();


--
-- Name: fp_hc_noi_quan_ly tr_fp_hc_noi_quan_ly_sync_ten_chi_nhanh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_hc_noi_quan_ly_sync_ten_chi_nhanh BEFORE INSERT OR UPDATE OF id_chi_nhanh ON public.fp_hc_noi_quan_ly FOR EACH ROW EXECUTE FUNCTION public.fp_hc_noi_quan_ly_sync_ten_chi_nhanh();


--
-- Name: fp_hc_noi_quan_ly tr_fp_hc_noi_quan_ly_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_hc_noi_quan_ly_tg_cap_nhat BEFORE UPDATE ON public.fp_hc_noi_quan_ly FOR EACH ROW EXECUTE FUNCTION public.fp_hc_noi_quan_ly_tg_cap_nhat();


--
-- Name: fp_hr_diem_cong_tru tr_fp_hr_diem_cong_tru_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_hr_diem_cong_tru_tg_cap_nhat BEFORE UPDATE ON public.fp_hr_diem_cong_tru FOR EACH ROW EXECUTE FUNCTION public.fp_hr_diem_cong_tru_tg_cap_nhat();


--
-- Name: fp_hr_thiet_lap_diem_cong_tru tr_fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat BEFORE UPDATE ON public.fp_hr_thiet_lap_diem_cong_tru FOR EACH ROW EXECUTE FUNCTION public.fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat();


--
-- Name: fp_mh_don_dat_hang tr_fp_mh_don_dat_hang_after_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_don_dat_hang_after_update AFTER UPDATE ON public.fp_mh_don_dat_hang FOR EACH ROW EXECUTE FUNCTION public.fp_mh_don_dat_hang_after_update();


--
-- Name: fp_mh_don_dat_hang_chi_tiet tr_fp_mh_don_dat_hang_chi_tiet_sync_phieu; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_don_dat_hang_chi_tiet_sync_phieu BEFORE INSERT OR UPDATE OF id_don_dat_hang ON public.fp_mh_don_dat_hang_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_mh_don_dat_hang_chi_tiet_sync_phieu();


--
-- Name: fp_mh_don_dat_hang_chi_tiet tr_fp_mh_don_dat_hang_chi_tiet_thanh_tien; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_don_dat_hang_chi_tiet_thanh_tien BEFORE INSERT OR UPDATE ON public.fp_mh_don_dat_hang_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_mh_don_dat_hang_chi_tiet_thanh_tien();


--
-- Name: fp_mh_don_dat_hang tr_fp_mh_don_dat_hang_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_don_dat_hang_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_don_dat_hang FOR EACH ROW EXECUTE FUNCTION public.fp_mh_don_dat_hang_tg_cap_nhat();


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet tr_fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat();


--
-- Name: fp_mh_dot_kiem_ke_kho tr_fp_mh_dot_kiem_ke_kho_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_dot_kiem_ke_kho_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_dot_kiem_ke_kho FOR EACH ROW EXECUTE FUNCTION public.fp_mh_dot_kiem_ke_kho_tg_cap_nhat();


--
-- Name: fp_mh_hop_dong_ct tr_fp_mh_hop_dong_ct_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_hop_dong_ct_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_hop_dong_ct FOR EACH ROW EXECUTE FUNCTION public.fp_mh_hop_dong_ct_tg_cap_nhat();


--
-- Name: fp_mh_hop_dong tr_fp_mh_hop_dong_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_hop_dong_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_hop_dong FOR EACH ROW EXECUTE FUNCTION public.fp_mh_hop_dong_tg_cap_nhat();


--
-- Name: fp_mh_phieu_de_xuat_vat_tu tr_fp_mh_phieu_de_xuat_vat_tu_after_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_de_xuat_vat_tu_after_update AFTER UPDATE ON public.fp_mh_phieu_de_xuat_vat_tu FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_after_update();


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet tr_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu BEFORE INSERT OR UPDATE OF id_phieu_de_xuat_vat_tu ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu();


--
-- Name: fp_mh_phieu_de_xuat_vat_tu tr_fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_phieu_de_xuat_vat_tu FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat();


--
-- Name: fp_mh_phieu_kho tr_fp_mh_phieu_kho_before_delete_clear_kiem_ke; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_kho_before_delete_clear_kiem_ke BEFORE DELETE ON public.fp_mh_phieu_kho FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh();


--
-- Name: fp_mh_phieu_kho_chi_tiet tr_fp_mh_phieu_kho_chi_tiet_thanh_tien; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_kho_chi_tiet_thanh_tien BEFORE INSERT OR UPDATE ON public.fp_mh_phieu_kho_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_kho_chi_tiet_thanh_tien();


--
-- Name: fp_mh_phieu_kho tr_fp_mh_phieu_kho_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_kho_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_phieu_kho FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_kho_tg_cap_nhat();


--
-- Name: fp_mh_phieu_kiem_ke tr_fp_mh_phieu_kiem_ke_after_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_after_update AFTER UPDATE ON public.fp_mh_phieu_kiem_ke FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_kiem_ke_after_update();


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet tr_fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech BEFORE INSERT OR UPDATE OF so_luong_so, so_luong_thuc_te ON public.fp_mh_phieu_kiem_ke_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech();


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet tr_fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu BEFORE INSERT OR UPDATE OF id_phieu_kiem_ke ON public.fp_mh_phieu_kiem_ke_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu();


--
-- Name: fp_mh_phieu_kiem_ke tr_fp_mh_phieu_kiem_ke_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_phieu_kiem_ke FOR EACH ROW EXECUTE FUNCTION public.fp_mh_phieu_kiem_ke_tg_cap_nhat();


--
-- Name: fp_mh_thanh_toan_doi_tac tr_fp_mh_thanh_toan_doi_tac_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_thanh_toan_doi_tac_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_thanh_toan_doi_tac FOR EACH ROW EXECUTE FUNCTION public.fp_mh_thanh_toan_doi_tac_tg_cap_nhat();


--
-- Name: fp_mh_tien_do_mua_hang tr_fp_mh_tien_do_mua_hang_timestamps; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_tien_do_mua_hang_timestamps BEFORE INSERT OR UPDATE ON public.fp_mh_tien_do_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fp_mh_tien_do_mua_hang_set_timestamps();


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac tr_fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat BEFORE UPDATE ON public.fp_mh_trang_thai_thanh_toan_doi_tac FOR EACH ROW EXECUTE FUNCTION public.fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat();


--
-- Name: fp_tc_hang_muc_thu_chi tr_fp_tc_hang_muc_thu_chi_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_tc_hang_muc_thu_chi_tg_cap_nhat BEFORE UPDATE ON public.fp_tc_hang_muc_thu_chi FOR EACH ROW EXECUTE FUNCTION public.fp_tc_hang_muc_thu_chi_tg_cap_nhat();


--
-- Name: fp_tc_quy_thu_chi tr_fp_tc_quy_thu_chi_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_tc_quy_thu_chi_tg_cap_nhat BEFORE UPDATE ON public.fp_tc_quy_thu_chi FOR EACH ROW EXECUTE FUNCTION public.fp_tc_quy_thu_chi_tg_cap_nhat();


--
-- Name: fp_ts_chi_phi_tai_san tr_fp_ts_chi_phi_tai_san_sync_ten_trang_thai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_chi_phi_tai_san_sync_ten_trang_thai BEFORE INSERT OR UPDATE OF id_trang_thai ON public.fp_ts_chi_phi_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_chi_phi_tai_san_sync_ten_trang_thai();


--
-- Name: fp_ts_chi_phi_tai_san tr_fp_ts_chi_phi_tai_san_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_chi_phi_tai_san_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_chi_phi_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_chi_phi_tai_san_tg_cap_nhat();


--
-- Name: fp_ts_chi_tiet_khau_hao tr_fp_ts_chi_tiet_khau_hao_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_chi_tiet_khau_hao_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_chi_tiet_khau_hao FOR EACH ROW EXECUTE FUNCTION public.fp_ts_chi_tiet_khau_hao_tg_cap_nhat();


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet tr_fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet FOR EACH ROW EXECUTE FUNCTION public.fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat();


--
-- Name: fp_ts_dot_kiem_ke_tai_san tr_fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_dot_kiem_ke_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat();


--
-- Name: fp_ts_ky_khau_hao tr_fp_ts_ky_khau_hao_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_ky_khau_hao_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_ky_khau_hao FOR EACH ROW EXECUTE FUNCTION public.fp_ts_ky_khau_hao_tg_cap_nhat();


--
-- Name: fp_ts_loai_chi_phi tr_fp_ts_loai_chi_phi_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_loai_chi_phi_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_loai_chi_phi FOR EACH ROW EXECUTE FUNCTION public.fp_ts_loai_chi_phi_tg_cap_nhat();


--
-- Name: fp_ts_nhom_tai_san tr_fp_ts_nhom_tai_san_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_nhom_tai_san_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_nhom_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_nhom_tai_san_tg_cap_nhat();


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct tr_fp_ts_phieu_cpth_ct_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_phieu_cpth_ct_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_phieu_cap_phat_thu_hoi_ct FOR EACH ROW EXECUTE FUNCTION public.fp_ts_phieu_cpth_tg_cap_nhat();


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi tr_fp_ts_phieu_cpth_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_phieu_cpth_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_phieu_cap_phat_thu_hoi FOR EACH ROW EXECUTE FUNCTION public.fp_ts_phieu_cpth_tg_cap_nhat();


--
-- Name: fp_ts_tai_san tr_fp_ts_tai_san_sync_chi_phi_ma_ten; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_tai_san_sync_chi_phi_ma_ten AFTER UPDATE OF ma_tai_san, ten_tai_san ON public.fp_ts_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_tai_san_sync_chi_phi_ma_ten();


--
-- Name: fp_ts_tai_san tr_fp_ts_tai_san_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_tai_san_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_tai_san_tg_cap_nhat();


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san tr_fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_trang_thai_chi_phi_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat();


--
-- Name: fp_ts_trang_thai_tai_san tr_fp_ts_trang_thai_tai_san_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_ts_trang_thai_tai_san_tg_cap_nhat BEFORE UPDATE ON public.fp_ts_trang_thai_tai_san FOR EACH ROW EXECUTE FUNCTION public.fp_ts_trang_thai_tai_san_tg_cap_nhat();


--
-- Name: fp_var_cap_bac tr_fp_var_cap_bac_sync_nhan_vien_ten; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_cap_bac_sync_nhan_vien_ten AFTER UPDATE OF ten_cap_bac, cap_bac ON public.fp_var_cap_bac FOR EACH ROW EXECUTE FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten();


--
-- Name: fp_var_chi_nhanh tr_fp_var_chi_nhanh_sync_nhan_vien_ten; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_chi_nhanh_sync_nhan_vien_ten AFTER UPDATE OF ten_chi_nhanh ON public.fp_var_chi_nhanh FOR EACH ROW EXECUTE FUNCTION public.fp_var_chi_nhanh_sync_nhan_vien_ten();


--
-- Name: fp_var_chuc_vu tr_fp_var_chuc_vu_sync_nhan_vien_ten; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_chuc_vu_sync_nhan_vien_ten AFTER UPDATE OF ten_chuc_vu ON public.fp_var_chuc_vu FOR EACH ROW EXECUTE FUNCTION public.fp_var_chuc_vu_sync_nhan_vien_ten();


--
-- Name: fp_var_nhan_vien tr_fp_var_nhan_vien_sync_display_names; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_nhan_vien_sync_display_names BEFORE INSERT OR UPDATE OF phong_ban_id, chuc_vu_id, cap_bac_id, chi_nhanh_ids ON public.fp_var_nhan_vien FOR EACH ROW EXECUTE FUNCTION public.fp_var_nhan_vien_sync_display_names();


--
-- Name: fp_var_phan_quyen tr_fp_var_phan_quyen_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_phan_quyen_tg_cap_nhat BEFORE UPDATE ON public.fp_var_phan_quyen FOR EACH ROW EXECUTE FUNCTION public.fp_var_phan_quyen_tg_cap_nhat();


--
-- Name: fp_var_phong_ban tr_fp_var_phong_ban_sync_nhan_vien_ten; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_phong_ban_sync_nhan_vien_ten AFTER UPDATE OF ten_phong_ban ON public.fp_var_phong_ban FOR EACH ROW EXECUTE FUNCTION public.fp_var_phong_ban_sync_nhan_vien_ten();


--
-- Name: fp_var_thong_bao_cai_dat tr_fp_var_thong_bao_cai_dat_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_thong_bao_cai_dat_tg_cap_nhat BEFORE UPDATE ON public.fp_var_thong_bao_cai_dat FOR EACH ROW EXECUTE FUNCTION public.fp_var_thong_bao_cai_dat_tg_cap_nhat();


--
-- Name: fp_var_thong_bao tr_fp_var_thong_bao_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_thong_bao_tg_cap_nhat BEFORE UPDATE ON public.fp_var_thong_bao FOR EACH ROW EXECUTE FUNCTION public.fp_var_thong_bao_tg_cap_nhat();


--
-- Name: fp_var_thong_bao_tuy_chon tr_fp_var_thong_bao_tuy_chon_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_fp_var_thong_bao_tuy_chon_tg_cap_nhat BEFORE UPDATE ON public.fp_var_thong_bao_tuy_chon FOR EACH ROW EXECUTE FUNCTION public.fp_var_thong_bao_cai_dat_tg_cap_nhat();


--
-- Name: fp_farm_de_xuat_mua_hang tr_thong_bao_fp_farm_de_xuat_mua_hang; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_farm_de_xuat_mua_hang AFTER INSERT OR UPDATE ON public.fp_farm_de_xuat_mua_hang FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('quan-ly-nha-so-che/de-xuat-mua-hang', 'trang_thai');


--
-- Name: fp_farm_phieu_kho_phan_thuoc tr_thong_bao_fp_farm_phieu_kho_phan_thuoc; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_farm_phieu_kho_phan_thuoc AFTER INSERT OR UPDATE ON public.fp_farm_phieu_kho_phan_thuoc FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('quan-ly-nha-so-che/phieu-kho-phan-thuoc', 'trang_thai');


--
-- Name: fp_hc_cong_viec tr_thong_bao_fp_hc_cong_viec; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_hc_cong_viec AFTER INSERT OR UPDATE ON public.fp_hc_cong_viec FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('hanh-chinh/cong-viec', 'trang_thai');


--
-- Name: fp_hr_phieu_hanh_chinh tr_thong_bao_fp_hr_phieu_hanh_chinh; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_hr_phieu_hanh_chinh AFTER INSERT OR UPDATE ON public.fp_hr_phieu_hanh_chinh FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('hanh-chinh/phieu-hanh-chinh', 'trang_thai');


--
-- Name: fp_mh_don_dat_hang tr_thong_bao_fp_mh_don_dat_hang; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_mh_don_dat_hang AFTER INSERT OR UPDATE ON public.fp_mh_don_dat_hang FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('mua-hang/don-dat-hang', 'trang_thai');


--
-- Name: fp_mh_phieu_de_xuat_vat_tu tr_thong_bao_fp_mh_phieu_de_xuat_vat_tu; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_mh_phieu_de_xuat_vat_tu AFTER INSERT OR UPDATE ON public.fp_mh_phieu_de_xuat_vat_tu FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('mua-hang/phieu-de-xuat-vat-tu', 'trang_thai');


--
-- Name: fp_mh_phieu_kho tr_thong_bao_fp_mh_phieu_kho; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_mh_phieu_kho AFTER INSERT OR UPDATE ON public.fp_mh_phieu_kho FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('kho-van/phieu-kho', 'trang_thai');


--
-- Name: fp_tc_quy_thu_chi tr_thong_bao_fp_tc_quy_thu_chi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_thong_bao_fp_tc_quy_thu_chi AFTER UPDATE OF trang_thai ON public.fp_tc_quy_thu_chi FOR EACH ROW WHEN ((old.trang_thai IS DISTINCT FROM new.trang_thai)) EXECUTE FUNCTION public.fn_ghi_su_kien_thong_bao('tai-chinh/thu-chi-quy', 'trang_thai');


--
-- Name: fp_var_nhan_vien trg_thu_hoi_phien_khi_nghi_viec; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thu_hoi_phien_khi_nghi_viec AFTER UPDATE OF trang_thai ON public.fp_var_nhan_vien FOR EACH ROW EXECUTE FUNCTION public.thu_hoi_phien_khi_nghi_viec();


--
-- Name: fp_farm_thu_hoach trg_update_tg_cap_nhat; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_tg_cap_nhat BEFORE UPDATE ON public.fp_farm_thu_hoach FOR EACH ROW EXECUTE FUNCTION public.update_tg_cap_nhat_column();


--
-- Name: fp_hc_cong_viec fk_fp_hc_cong_viec_id_cha; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hc_cong_viec
    ADD CONSTRAINT fk_fp_hc_cong_viec_id_cha FOREIGN KEY (id_cha) REFERENCES public.fp_hc_cong_viec(id) ON DELETE SET NULL;


--
-- Name: fp_hc_noi_quan_ly fk_fp_hc_noi_quan_ly_chi_nhanh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hc_noi_quan_ly
    ADD CONSTRAINT fk_fp_hc_noi_quan_ly_chi_nhanh FOREIGN KEY (id_chi_nhanh) REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT;


--
-- Name: fp_hr_diem_cong_tru fk_fp_hr_diem_cong_tru_hang_muc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_hr_diem_cong_tru
    ADD CONSTRAINT fk_fp_hr_diem_cong_tru_hang_muc FOREIGN KEY (id_hang_muc) REFERENCES public.fp_hr_thiet_lap_diem_cong_tru(id) ON DELETE RESTRICT;


--
-- Name: fp_ts_chi_phi_tai_san fk_fp_ts_chi_phi_tai_san_trang_thai; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_chi_phi_tai_san
    ADD CONSTRAINT fk_fp_ts_chi_phi_tai_san_trang_thai FOREIGN KEY (id_trang_thai) REFERENCES public.fp_ts_trang_thai_chi_phi_tai_san(id);


--
-- Name: fp_ts_chi_tiet_khau_hao fk_fp_ts_chi_tiet_khau_hao_ky; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_chi_tiet_khau_hao
    ADD CONSTRAINT fk_fp_ts_chi_tiet_khau_hao_ky FOREIGN KEY (id_ky_khau_hao) REFERENCES public.fp_ts_ky_khau_hao(id) ON DELETE CASCADE;


--
-- Name: fp_ts_chi_tiet_khau_hao fk_fp_ts_chi_tiet_khau_hao_tai_san; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_chi_tiet_khau_hao
    ADD CONSTRAINT fk_fp_ts_chi_tiet_khau_hao_tai_san FOREIGN KEY (id_tai_san) REFERENCES public.fp_ts_tai_san(id) ON DELETE CASCADE;


--
-- Name: fp_var_phan_quyen fk_fp_var_phan_quyen_chuc_vu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_phan_quyen
    ADD CONSTRAINT fk_fp_var_phan_quyen_chuc_vu FOREIGN KEY (chuc_vu_id) REFERENCES public.fp_var_chuc_vu(id) ON DELETE CASCADE;


--
-- Name: fp_mh_thanh_toan_doi_tac fk_thanh_toan_doi_tac_trang_thai; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_thanh_toan_doi_tac
    ADD CONSTRAINT fk_thanh_toan_doi_tac_trang_thai FOREIGN KEY (id_trang_thai_thanh_toan) REFERENCES public.fp_mh_trang_thai_thanh_toan_doi_tac(id);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct fp_farm_bao_cao_nhan_cong_ct_id_bao_cao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong_ct
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_ct_id_bao_cao_fkey FOREIGN KEY (id_bao_cao) REFERENCES public.fp_farm_bao_cao_nhan_cong(id) ON DELETE CASCADE;


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub fp_farm_bao_cao_nhan_cong_ct_sub_id_bcnc_ct_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong_ct_sub
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_ct_sub_id_bcnc_ct_fkey FOREIGN KEY (id_bcnc_ct) REFERENCES public.fp_farm_bao_cao_nhan_cong_ct(id) ON DELETE CASCADE;


--
-- Name: fp_farm_bao_cao_nhan_cong fp_farm_bao_cao_nhan_cong_id_chi_nhanh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_id_chi_nhanh_fkey FOREIGN KEY (id_chi_nhanh) REFERENCES public.fp_var_chi_nhanh(id) ON DELETE SET NULL;


--
-- Name: fp_farm_bao_cao_nhan_cong fp_farm_bao_cao_nhan_cong_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi fp_farm_bao_cao_nhan_cong_kpi_id_bao_cao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_nhan_cong_kpi
    ADD CONSTRAINT fp_farm_bao_cao_nhan_cong_kpi_id_bao_cao_fkey FOREIGN KEY (id_bao_cao) REFERENCES public.fp_farm_bao_cao_nhan_cong(id) ON DELETE CASCADE;


--
-- Name: fp_farm_bao_cao_so_che_ct fp_farm_bao_cao_so_che_ct_id_bao_cao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che_ct
    ADD CONSTRAINT fp_farm_bao_cao_so_che_ct_id_bao_cao_fkey FOREIGN KEY (id_bao_cao) REFERENCES public.fp_farm_bao_cao_so_che(id) ON DELETE CASCADE;


--
-- Name: fp_farm_bao_cao_so_che fp_farm_bao_cao_so_che_id_chi_nhanh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che
    ADD CONSTRAINT fp_farm_bao_cao_so_che_id_chi_nhanh_fkey FOREIGN KEY (id_chi_nhanh) REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT;


--
-- Name: fp_farm_bao_cao_so_che fp_farm_bao_cao_so_che_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che
    ADD CONSTRAINT fp_farm_bao_cao_so_che_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_farm_bao_cao_so_che_kpi fp_farm_bao_cao_so_che_kpi_id_bao_cao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che_kpi
    ADD CONSTRAINT fp_farm_bao_cao_so_che_kpi_id_bao_cao_fkey FOREIGN KEY (id_bao_cao) REFERENCES public.fp_farm_bao_cao_so_che(id) ON DELETE CASCADE;


--
-- Name: fp_farm_bao_cao_so_che_pham_cap fp_farm_bao_cao_so_che_pham_cap_id_bao_cao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_bao_cao_so_che_pham_cap
    ADD CONSTRAINT fp_farm_bao_cao_so_che_pham_cap_id_bao_cao_fkey FOREIGN KEY (id_bao_cao) REFERENCES public.fp_farm_bao_cao_so_che(id) ON DELETE CASCADE;


--
-- Name: fp_farm_danh_muc_hang_hoa fp_farm_danh_muc_hang_hoa_danh_muc_cha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_danh_muc_hang_hoa
    ADD CONSTRAINT fp_farm_danh_muc_hang_hoa_danh_muc_cha_id_fkey FOREIGN KEY (danh_muc_cha_id) REFERENCES public.fp_farm_danh_muc_hang_hoa(id) ON DELETE SET NULL;


--
-- Name: fp_farm_danh_sach_hang_hoa fp_farm_danh_sach_hang_hoa_danh_muc_cha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_danh_sach_hang_hoa
    ADD CONSTRAINT fp_farm_danh_sach_hang_hoa_danh_muc_cha_id_fkey FOREIGN KEY (danh_muc_cha_id) REFERENCES public.fp_farm_danh_muc_hang_hoa(id) ON DELETE SET NULL;


--
-- Name: fp_farm_danh_sach_hang_hoa fp_farm_danh_sach_hang_hoa_danh_muc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_danh_sach_hang_hoa
    ADD CONSTRAINT fp_farm_danh_sach_hang_hoa_danh_muc_id_fkey FOREIGN KEY (danh_muc_id) REFERENCES public.fp_farm_danh_muc_hang_hoa(id) ON DELETE SET NULL;


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet fp_farm_de_xuat_mua_hang_chi_tiet_id_de_xuat_mua_hang_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_de_xuat_mua_hang_chi_tiet
    ADD CONSTRAINT fp_farm_de_xuat_mua_hang_chi_tiet_id_de_xuat_mua_hang_fkey FOREIGN KEY (id_de_xuat_mua_hang) REFERENCES public.fp_farm_de_xuat_mua_hang(id) ON DELETE CASCADE;


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kiem_ke_pt_chi_tiet_id_dot_kiem_ke_pt_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt_chi_tiet
    ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_chi_tiet_id_dot_kiem_ke_pt_fkey FOREIGN KEY (id_dot_kiem_ke_pt) REFERENCES public.fp_farm_dot_kiem_ke_pt(id) ON DELETE CASCADE;


--
-- Name: fp_farm_dot_kiem_ke_pt fp_farm_dot_kiem_ke_pt_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt
    ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_farm_dot_kiem_ke_pt_kho fp_farm_dot_kiem_ke_pt_kho_id_dot_kiem_ke_pt_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt_kho
    ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_kho_id_dot_kiem_ke_pt_fkey FOREIGN KEY (id_dot_kiem_ke_pt) REFERENCES public.fp_farm_dot_kiem_ke_pt(id) ON DELETE CASCADE;


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kk_pt_ct_phieu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_dot_kiem_ke_pt_chi_tiet
    ADD CONSTRAINT fp_farm_dot_kk_pt_ct_phieu_fkey FOREIGN KEY (id_phieu_kho_dieu_chinh) REFERENCES public.fp_farm_phieu_kho_phan_thuoc(id) ON DELETE SET NULL;


--
-- Name: fp_farm_du_bao_sl_dong_thung fp_farm_du_bao_sl_dong_thung_id_chi_nhanh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_du_bao_sl_dong_thung
    ADD CONSTRAINT fp_farm_du_bao_sl_dong_thung_id_chi_nhanh_fkey FOREIGN KEY (id_chi_nhanh) REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT;


--
-- Name: fp_farm_du_bao_sl_dong_thung fp_farm_du_bao_sl_dong_thung_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_du_bao_sl_dong_thung
    ADD CONSTRAINT fp_farm_du_bao_sl_dong_thung_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_phieu_kho_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_farm_phieu_kho_phan_thuoc_chi_tiet
    ADD CONSTRAINT fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_phieu_kho_fkey FOREIGN KEY (id_phieu_kho) REFERENCES public.fp_farm_phieu_kho_phan_thuoc(id) ON DELETE CASCADE;


--
-- Name: fp_mh_danh_sach_doi_tac fp_mh_danh_sach_doi_tac_id_nhom_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_danh_sach_doi_tac
    ADD CONSTRAINT fp_mh_danh_sach_doi_tac_id_nhom_fkey FOREIGN KEY (id_nhom) REFERENCES public.fp_mh_nhom_doi_tac(id) ON DELETE SET NULL;


--
-- Name: fp_mh_don_dat_hang_chi_tiet fp_mh_don_dat_hang_chi_tiet_id_don_dat_hang_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_don_dat_hang_chi_tiet
    ADD CONSTRAINT fp_mh_don_dat_hang_chi_tiet_id_don_dat_hang_fkey FOREIGN KEY (id_don_dat_hang) REFERENCES public.fp_mh_don_dat_hang(id) ON DELETE CASCADE;


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tiet_id_dot_kiem_ke_kho_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho_chi_tiet
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_chi_tiet_id_dot_kiem_ke_kho_fkey FOREIGN KEY (id_dot_kiem_ke_kho) REFERENCES public.fp_mh_dot_kiem_ke_kho(id) ON DELETE CASCADE;


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tiet_id_phieu_kho_dieu_chinh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho_chi_tiet
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_chi_tiet_id_phieu_kho_dieu_chinh_fkey FOREIGN KEY (id_phieu_kho_dieu_chinh) REFERENCES public.fp_mh_phieu_kho(id) ON DELETE SET NULL;


--
-- Name: fp_mh_dot_kiem_ke_kho fp_mh_dot_kiem_ke_kho_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_mh_dot_kiem_ke_kho_kho fp_mh_dot_kiem_ke_kho_kho_id_dot_kiem_ke_kho_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_dot_kiem_ke_kho_kho
    ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_kho_id_dot_kiem_ke_kho_fkey FOREIGN KEY (id_dot_kiem_ke_kho) REFERENCES public.fp_mh_dot_kiem_ke_kho(id) ON DELETE CASCADE;


--
-- Name: fp_mh_hop_dong_ct fp_mh_hop_dong_ct_id_chi_nhanh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_hop_dong_ct
    ADD CONSTRAINT fp_mh_hop_dong_ct_id_chi_nhanh_fkey FOREIGN KEY (id_chi_nhanh) REFERENCES public.fp_var_chi_nhanh(id);


--
-- Name: fp_mh_hop_dong_ct fp_mh_hop_dong_ct_id_hop_dong_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_hop_dong_ct
    ADD CONSTRAINT fp_mh_hop_dong_ct_id_hop_dong_fkey FOREIGN KEY (id_hop_dong) REFERENCES public.fp_mh_hop_dong(id) ON DELETE CASCADE;


--
-- Name: fp_mh_hop_dong_ct fp_mh_hop_dong_ct_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_hop_dong_ct
    ADD CONSTRAINT fp_mh_hop_dong_ct_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id);


--
-- Name: fp_mh_hop_dong fp_mh_hop_dong_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_hop_dong
    ADD CONSTRAINT fp_mh_hop_dong_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id);


--
-- Name: fp_mh_hop_dong fp_mh_hop_dong_id_nha_cung_cap_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_hop_dong
    ADD CONSTRAINT fp_mh_hop_dong_id_nha_cung_cap_fkey FOREIGN KEY (id_nha_cung_cap) REFERENCES public.fp_mh_danh_sach_doi_tac(id);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet fp_mh_phieu_de_xuat_vat_tu_chi_tie_id_phieu_de_xuat_vat_tu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet
    ADD CONSTRAINT fp_mh_phieu_de_xuat_vat_tu_chi_tie_id_phieu_de_xuat_vat_tu_fkey FOREIGN KEY (id_phieu_de_xuat_vat_tu) REFERENCES public.fp_mh_phieu_de_xuat_vat_tu(id) ON DELETE CASCADE;


--
-- Name: fp_mh_phieu_kho_chi_tiet fp_mh_phieu_kho_chi_tiet_id_phieu_kho_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kho_chi_tiet
    ADD CONSTRAINT fp_mh_phieu_kho_chi_tiet_id_phieu_kho_fkey FOREIGN KEY (id_phieu_kho) REFERENCES public.fp_mh_phieu_kho(id) ON DELETE CASCADE;


--
-- Name: fp_mh_phieu_kho fp_mh_phieu_kho_id_don_dat_hang_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kho
    ADD CONSTRAINT fp_mh_phieu_kho_id_don_dat_hang_fkey FOREIGN KEY (id_don_dat_hang) REFERENCES public.fp_mh_don_dat_hang(id) ON DELETE SET NULL;


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet fp_mh_phieu_kiem_ke_chi_tiet_id_phieu_kiem_ke_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_mh_phieu_kiem_ke_chi_tiet
    ADD CONSTRAINT fp_mh_phieu_kiem_ke_chi_tiet_id_phieu_kiem_ke_fkey FOREIGN KEY (id_phieu_kiem_ke) REFERENCES public.fp_mh_phieu_kiem_ke(id) ON DELETE CASCADE;


--
-- Name: fp_tc_quy_thu_chi fp_tc_quy_thu_chi_id_chi_nhanh_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_tc_quy_thu_chi
    ADD CONSTRAINT fp_tc_quy_thu_chi_id_chi_nhanh_fkey FOREIGN KEY (id_chi_nhanh) REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT;


--
-- Name: fp_tc_quy_thu_chi fp_tc_quy_thu_chi_id_hang_muc_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_tc_quy_thu_chi
    ADD CONSTRAINT fp_tc_quy_thu_chi_id_hang_muc_fkey FOREIGN KEY (id_hang_muc) REFERENCES public.fp_tc_hang_muc_thu_chi(id) ON DELETE RESTRICT;


--
-- Name: fp_tc_quy_thu_chi fp_tc_quy_thu_chi_id_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_tc_quy_thu_chi
    ADD CONSTRAINT fp_tc_quy_thu_chi_id_nguoi_tao_fkey FOREIGN KEY (id_nguoi_tao) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_tc_quy_thu_chi fp_tc_quy_thu_chi_id_nguoi_xu_ly_mo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_tc_quy_thu_chi
    ADD CONSTRAINT fp_tc_quy_thu_chi_id_nguoi_xu_ly_mo_fkey FOREIGN KEY (id_nguoi_xu_ly_mo) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_tc_quy_thu_chi fp_tc_quy_thu_chi_id_nguoi_yeu_cau_mo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_tc_quy_thu_chi
    ADD CONSTRAINT fp_tc_quy_thu_chi_id_nguoi_yeu_cau_mo_fkey FOREIGN KEY (id_nguoi_yeu_cau_mo) REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet fp_ts_dot_kiem_ke_tai_san_chi_tiet_id_dot_kiem_ke_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
    ADD CONSTRAINT fp_ts_dot_kiem_ke_tai_san_chi_tiet_id_dot_kiem_ke_fkey FOREIGN KEY (id_dot_kiem_ke) REFERENCES public.fp_ts_dot_kiem_ke_tai_san(id) ON DELETE CASCADE;


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct fp_ts_phieu_cap_phat_thu_hoi_ct_id_phieu_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_ts_phieu_cap_phat_thu_hoi_ct
    ADD CONSTRAINT fp_ts_phieu_cap_phat_thu_hoi_ct_id_phieu_fkey FOREIGN KEY (id_phieu) REFERENCES public.fp_ts_phieu_cap_phat_thu_hoi(id) ON DELETE CASCADE;


--
-- Name: fp_var_phien_dang_nhap fp_var_phien_dang_nhap_nhan_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_phien_dang_nhap
    ADD CONSTRAINT fp_var_phien_dang_nhap_nhan_vien_id_fkey FOREIGN KEY (nhan_vien_id) REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE;


--
-- Name: fp_var_push_subscription fp_var_push_subscription_nhan_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_push_subscription
    ADD CONSTRAINT fp_var_push_subscription_nhan_vien_id_fkey FOREIGN KEY (nhan_vien_id) REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE;


--
-- Name: fp_var_thong_bao_cai_dat fp_var_thong_bao_cai_dat_nhan_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao_cai_dat
    ADD CONSTRAINT fp_var_thong_bao_cai_dat_nhan_vien_id_fkey FOREIGN KEY (nhan_vien_id) REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE;


--
-- Name: fp_var_thong_bao fp_var_thong_bao_nguoi_nhan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao
    ADD CONSTRAINT fp_var_thong_bao_nguoi_nhan_id_fkey FOREIGN KEY (nguoi_nhan_id) REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE;


--
-- Name: fp_var_thong_bao fp_var_thong_bao_su_kien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao
    ADD CONSTRAINT fp_var_thong_bao_su_kien_id_fkey FOREIGN KEY (su_kien_id) REFERENCES public.fp_var_su_kien_thong_bao(id) ON DELETE SET NULL;


--
-- Name: fp_var_thong_bao_tuy_chon fp_var_thong_bao_tuy_chon_nhan_vien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fp_var_thong_bao_tuy_chon
    ADD CONSTRAINT fp_var_thong_bao_tuy_chon_nhan_vien_id_fkey FOREIGN KEY (nhan_vien_id) REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE;


--
-- Name: fp_mh_phieu_kho_so_phieu Allow all for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all for authenticated" ON public.fp_mh_phieu_kho_so_phieu TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_don_dat_hang Allow delete don_dat_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete don_dat_hang" ON public.fp_mh_don_dat_hang FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_don_dat_hang_chi_tiet Allow delete don_dat_hang_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete don_dat_hang_chi_tiet" ON public.fp_mh_don_dat_hang_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_thu_hoach Allow delete for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated" ON public.fp_farm_thu_hoach FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kho Allow delete for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated" ON public.fp_mh_phieu_kho FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi Allow delete for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct Allow delete for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi_ct FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kho_chi_tiet Allow delete for authenticated details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete for authenticated details" ON public.fp_mh_phieu_kho_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_hc_cong_viec Allow delete fp_hc_cong_viec; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_hc_cong_viec" ON public.fp_hc_cong_viec FOR DELETE TO authenticated USING (true);


--
-- Name: fp_hc_noi_quan_ly Allow delete fp_hc_noi_quan_ly; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly FOR DELETE TO authenticated USING (true);


--
-- Name: fp_hr_diem_cong_tru Allow delete fp_hr_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru FOR DELETE TO authenticated USING (true);


--
-- Name: fp_hr_thiet_lap_diem_cong_tru Allow delete fp_hr_thiet_lap_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_chi_phi_tai_san Allow delete fp_ts_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_chi_tiet_khau_hao Allow delete fp_ts_chi_tiet_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san Allow delete fp_ts_dot_kiem_ke_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet Allow delete fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_ky_khau_hao Allow delete fp_ts_ky_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_loai_chi_phi Allow delete fp_ts_loai_chi_phi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_loai_chi_phi" ON public.fp_ts_loai_chi_phi FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_nhom_tai_san Allow delete fp_ts_nhom_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_tai_san Allow delete fp_ts_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_tai_san" ON public.fp_ts_tai_san FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san Allow delete fp_ts_trang_thai_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san FOR DELETE TO authenticated USING (true);


--
-- Name: fp_ts_trang_thai_tai_san Allow delete fp_ts_trang_thai_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san FOR DELETE TO authenticated USING (true);


--
-- Name: fp_var_phan_quyen Allow delete fp_var_phan_quyen; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete fp_var_phan_quyen" ON public.fp_var_phan_quyen FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_hop_dong Allow delete hop_dong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete hop_dong" ON public.fp_mh_hop_dong FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_hop_dong_ct Allow delete hop_dong_ct; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete hop_dong_ct" ON public.fp_mh_hop_dong_ct FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu Allow delete phieu_de_xuat_vat_tu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete phieu_de_xuat_vat_tu" ON public.fp_mh_phieu_de_xuat_vat_tu FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet Allow delete phieu_de_xuat_vat_tu_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete phieu_de_xuat_vat_tu_chi_tiet" ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kiem_ke Allow delete phieu_kiem_ke; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete phieu_kiem_ke" ON public.fp_mh_phieu_kiem_ke FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet Allow delete phieu_kiem_ke_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete phieu_kiem_ke_chi_tiet" ON public.fp_mh_phieu_kiem_ke_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_thanh_toan_doi_tac Allow delete thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete thanh_toan_doi_tac" ON public.fp_mh_thanh_toan_doi_tac FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_tien_do_mua_hang Allow delete tien_do_mua_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete tien_do_mua_hang" ON public.fp_mh_tien_do_mua_hang FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_tien_do_mua_hang Allow delete tien_do_mua_hang_farm; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete tien_do_mua_hang_farm" ON public.fp_farm_tien_do_mua_hang FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac Allow delete trang_thai_thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow delete trang_thai_thanh_toan_doi_tac" ON public.fp_mh_trang_thai_thanh_toan_doi_tac FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_don_dat_hang Allow insert don_dat_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert don_dat_hang" ON public.fp_mh_don_dat_hang FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_don_dat_hang_chi_tiet Allow insert don_dat_hang_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert don_dat_hang_chi_tiet" ON public.fp_mh_don_dat_hang_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_thu_hoach Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.fp_farm_thu_hoach FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_phieu_kho Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.fp_mh_phieu_kho FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct Allow insert for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi_ct FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_phieu_kho_chi_tiet Allow insert for authenticated details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert for authenticated details" ON public.fp_mh_phieu_kho_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_hc_cong_viec Allow insert fp_hc_cong_viec; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_hc_cong_viec" ON public.fp_hc_cong_viec FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_hc_noi_quan_ly Allow insert fp_hc_noi_quan_ly; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_hr_diem_cong_tru Allow insert fp_hr_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_hr_thiet_lap_diem_cong_tru Allow insert fp_hr_thiet_lap_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_chi_phi_tai_san Allow insert fp_ts_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_chi_tiet_khau_hao Allow insert fp_ts_chi_tiet_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san Allow insert fp_ts_dot_kiem_ke_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet Allow insert fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_ky_khau_hao Allow insert fp_ts_ky_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_loai_chi_phi Allow insert fp_ts_loai_chi_phi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_loai_chi_phi" ON public.fp_ts_loai_chi_phi FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_nhom_tai_san Allow insert fp_ts_nhom_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_tai_san Allow insert fp_ts_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_tai_san" ON public.fp_ts_tai_san FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san Allow insert fp_ts_trang_thai_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_ts_trang_thai_tai_san Allow insert fp_ts_trang_thai_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_var_phan_quyen Allow insert fp_var_phan_quyen; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert fp_var_phan_quyen" ON public.fp_var_phan_quyen FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_hop_dong Allow insert hop_dong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert hop_dong" ON public.fp_mh_hop_dong FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_hop_dong_ct Allow insert hop_dong_ct; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert hop_dong_ct" ON public.fp_mh_hop_dong_ct FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu Allow insert phieu_de_xuat_vat_tu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert phieu_de_xuat_vat_tu" ON public.fp_mh_phieu_de_xuat_vat_tu FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet Allow insert phieu_de_xuat_vat_tu_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert phieu_de_xuat_vat_tu_chi_tiet" ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_phieu_kiem_ke Allow insert phieu_kiem_ke; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert phieu_kiem_ke" ON public.fp_mh_phieu_kiem_ke FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet Allow insert phieu_kiem_ke_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert phieu_kiem_ke_chi_tiet" ON public.fp_mh_phieu_kiem_ke_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_thanh_toan_doi_tac Allow insert thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert thanh_toan_doi_tac" ON public.fp_mh_thanh_toan_doi_tac FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_tien_do_mua_hang Allow insert tien_do_mua_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert tien_do_mua_hang" ON public.fp_mh_tien_do_mua_hang FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_tien_do_mua_hang Allow insert tien_do_mua_hang_farm; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert tien_do_mua_hang_farm" ON public.fp_farm_tien_do_mua_hang FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac Allow insert trang_thai_thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow insert trang_thai_thanh_toan_doi_tac" ON public.fp_mh_trang_thai_thanh_toan_doi_tac FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_don_dat_hang Allow select don_dat_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select don_dat_hang" ON public.fp_mh_don_dat_hang FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_don_dat_hang_chi_tiet Allow select don_dat_hang_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select don_dat_hang_chi_tiet" ON public.fp_mh_don_dat_hang_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_thu_hoach Allow select for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated" ON public.fp_farm_thu_hoach FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kho Allow select for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated" ON public.fp_mh_phieu_kho FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi Allow select for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct Allow select for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi_ct FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kho_chi_tiet Allow select for authenticated details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select for authenticated details" ON public.fp_mh_phieu_kho_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_hc_cong_viec Allow select fp_hc_cong_viec; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_hc_cong_viec" ON public.fp_hc_cong_viec FOR SELECT TO authenticated USING (true);


--
-- Name: fp_hc_noi_quan_ly Allow select fp_hc_noi_quan_ly; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly FOR SELECT TO authenticated USING (true);


--
-- Name: fp_hr_diem_cong_tru Allow select fp_hr_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru FOR SELECT TO authenticated USING (true);


--
-- Name: fp_hr_thiet_lap_diem_cong_tru Allow select fp_hr_thiet_lap_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_chi_phi_tai_san Allow select fp_ts_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_chi_tiet_khau_hao Allow select fp_ts_chi_tiet_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san Allow select fp_ts_dot_kiem_ke_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet Allow select fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_ky_khau_hao Allow select fp_ts_ky_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_loai_chi_phi Allow select fp_ts_loai_chi_phi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_loai_chi_phi" ON public.fp_ts_loai_chi_phi FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_nhom_tai_san Allow select fp_ts_nhom_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_tai_san Allow select fp_ts_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_tai_san" ON public.fp_ts_tai_san FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san Allow select fp_ts_trang_thai_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san FOR SELECT TO authenticated USING (true);


--
-- Name: fp_ts_trang_thai_tai_san Allow select fp_ts_trang_thai_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_phan_quyen Allow select fp_var_phan_quyen; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select fp_var_phan_quyen" ON public.fp_var_phan_quyen FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_hop_dong Allow select hop_dong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select hop_dong" ON public.fp_mh_hop_dong FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_hop_dong_ct Allow select hop_dong_ct; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select hop_dong_ct" ON public.fp_mh_hop_dong_ct FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu Allow select phieu_de_xuat_vat_tu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select phieu_de_xuat_vat_tu" ON public.fp_mh_phieu_de_xuat_vat_tu FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet Allow select phieu_de_xuat_vat_tu_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select phieu_de_xuat_vat_tu_chi_tiet" ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kiem_ke Allow select phieu_kiem_ke; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select phieu_kiem_ke" ON public.fp_mh_phieu_kiem_ke FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet Allow select phieu_kiem_ke_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select phieu_kiem_ke_chi_tiet" ON public.fp_mh_phieu_kiem_ke_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_thanh_toan_doi_tac Allow select thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select thanh_toan_doi_tac" ON public.fp_mh_thanh_toan_doi_tac FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_tien_do_mua_hang Allow select tien_do_mua_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select tien_do_mua_hang" ON public.fp_mh_tien_do_mua_hang FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_tien_do_mua_hang Allow select tien_do_mua_hang_farm; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select tien_do_mua_hang_farm" ON public.fp_farm_tien_do_mua_hang FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac Allow select trang_thai_thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow select trang_thai_thanh_toan_doi_tac" ON public.fp_mh_trang_thai_thanh_toan_doi_tac FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_don_dat_hang Allow update don_dat_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update don_dat_hang" ON public.fp_mh_don_dat_hang FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_don_dat_hang_chi_tiet Allow update don_dat_hang_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update don_dat_hang_chi_tiet" ON public.fp_mh_don_dat_hang_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_thu_hoach Allow update for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated" ON public.fp_farm_thu_hoach FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_phieu_kho Allow update for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated" ON public.fp_mh_phieu_kho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi Allow update for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct Allow update for authenticated; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated" ON public.fp_ts_phieu_cap_phat_thu_hoi_ct FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_phieu_kho_chi_tiet Allow update for authenticated details; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update for authenticated details" ON public.fp_mh_phieu_kho_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_hc_cong_viec Allow update fp_hc_cong_viec; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_hc_cong_viec" ON public.fp_hc_cong_viec FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_hc_noi_quan_ly Allow update fp_hc_noi_quan_ly; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_hr_diem_cong_tru Allow update fp_hr_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_hr_thiet_lap_diem_cong_tru Allow update fp_hr_thiet_lap_diem_cong_tru; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_chi_phi_tai_san Allow update fp_ts_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_chi_phi_tai_san" ON public.fp_ts_chi_phi_tai_san FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_chi_tiet_khau_hao Allow update fp_ts_chi_tiet_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san Allow update fp_ts_dot_kiem_ke_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet Allow update fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_ky_khau_hao Allow update fp_ts_ky_khau_hao; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_loai_chi_phi Allow update fp_ts_loai_chi_phi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_loai_chi_phi" ON public.fp_ts_loai_chi_phi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_nhom_tai_san Allow update fp_ts_nhom_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_tai_san Allow update fp_ts_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_tai_san" ON public.fp_ts_tai_san FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_trang_thai_chi_phi_tai_san Allow update fp_ts_trang_thai_chi_phi_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_trang_thai_chi_phi_tai_san" ON public.fp_ts_trang_thai_chi_phi_tai_san FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_ts_trang_thai_tai_san Allow update fp_ts_trang_thai_tai_san; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_phan_quyen Allow update fp_var_phan_quyen; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update fp_var_phan_quyen" ON public.fp_var_phan_quyen FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_hop_dong Allow update hop_dong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update hop_dong" ON public.fp_mh_hop_dong FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_hop_dong_ct Allow update hop_dong_ct; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update hop_dong_ct" ON public.fp_mh_hop_dong_ct FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu Allow update phieu_de_xuat_vat_tu; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update phieu_de_xuat_vat_tu" ON public.fp_mh_phieu_de_xuat_vat_tu FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet Allow update phieu_de_xuat_vat_tu_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update phieu_de_xuat_vat_tu_chi_tiet" ON public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_phieu_kiem_ke Allow update phieu_kiem_ke; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update phieu_kiem_ke" ON public.fp_mh_phieu_kiem_ke FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet Allow update phieu_kiem_ke_chi_tiet; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update phieu_kiem_ke_chi_tiet" ON public.fp_mh_phieu_kiem_ke_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_thanh_toan_doi_tac Allow update thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update thanh_toan_doi_tac" ON public.fp_mh_thanh_toan_doi_tac FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_tien_do_mua_hang Allow update tien_do_mua_hang; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update tien_do_mua_hang" ON public.fp_mh_tien_do_mua_hang FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_tien_do_mua_hang Allow update tien_do_mua_hang_farm; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update tien_do_mua_hang_farm" ON public.fp_farm_tien_do_mua_hang FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac Allow update trang_thai_thanh_toan_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow update trang_thai_thanh_toan_doi_tac" ON public.fp_mh_trang_thai_thanh_toan_doi_tac FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_danh_sach_doi_tac Authenticated all fp_mh_danh_sach_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated all fp_mh_danh_sach_doi_tac" ON public.fp_mh_danh_sach_doi_tac TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_nhom_doi_tac Authenticated all fp_mh_nhom_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated all fp_mh_nhom_doi_tac" ON public.fp_mh_nhom_doi_tac TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_tag_doi_tac Authenticated all fp_mh_tag_doi_tac; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated all fp_mh_tag_doi_tac" ON public.fp_mh_tag_doi_tac TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_hr_nhom_phieu_hanh_chinh Authenticated thêm/sửa/xóa fp_hr_nhom_phieu_hanh_chinh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated thêm/sửa/xóa fp_hr_nhom_phieu_hanh_chinh" ON public.fp_hr_nhom_phieu_hanh_chinh TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_chi_nhanh Authenticated thêm/sửa/xóa fp_var_chi_nhanh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated thêm/sửa/xóa fp_var_chi_nhanh" ON public.fp_var_chi_nhanh TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_tt_cong_ty Authenticated thêm/sửa/xóa fp_var_tt_cong_ty; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated thêm/sửa/xóa fp_var_tt_cong_ty" ON public.fp_var_tt_cong_ty TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_hr_nhom_phieu_hanh_chinh Authenticated đọc fp_hr_nhom_phieu_hanh_chinh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated đọc fp_hr_nhom_phieu_hanh_chinh" ON public.fp_hr_nhom_phieu_hanh_chinh FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_chi_nhanh Authenticated đọc fp_var_chi_nhanh; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated đọc fp_var_chi_nhanh" ON public.fp_var_chi_nhanh FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_tt_cong_ty Authenticated đọc fp_var_tt_cong_ty; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated đọc fp_var_tt_cong_ty" ON public.fp_var_tt_cong_ty FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_thong_bao Chỉ sửa thông báo của mình; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chỉ sửa thông báo của mình" ON public.fp_var_thong_bao FOR UPDATE TO authenticated USING ((nguoi_nhan_id = public.nhan_vien_hien_tai_id())) WITH CHECK ((nguoi_nhan_id = public.nhan_vien_hien_tai_id()));


--
-- Name: fp_var_thong_bao Chỉ đọc thông báo của mình; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Chỉ đọc thông báo của mình" ON public.fp_var_thong_bao FOR SELECT TO authenticated USING ((nguoi_nhan_id = public.nhan_vien_hien_tai_id()));


--
-- Name: fp_var_thong_bao_cai_dat Cài đặt thông báo của mình; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cài đặt thông báo của mình" ON public.fp_var_thong_bao_cai_dat TO authenticated USING ((nhan_vien_id = public.nhan_vien_hien_tai_id())) WITH CHECK ((nhan_vien_id = public.nhan_vien_hien_tai_id()));


--
-- Name: fp_hr_bang_luong Full_Access_Authenticated_Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Full_Access_Authenticated_Policy" ON public.fp_hr_bang_luong TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_hr_phieu_hanh_chinh Full_Access_Authenticated_Policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Full_Access_Authenticated_Policy" ON public.fp_hr_phieu_hanh_chinh TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_push_subscription Gỡ thiết bị push của mình; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Gỡ thiết bị push của mình" ON public.fp_var_push_subscription FOR DELETE TO authenticated USING ((nhan_vien_id = public.nhan_vien_hien_tai_id()));


--
-- Name: fp_var_push_subscription Thiết bị push của mình; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Thiết bị push của mình" ON public.fp_var_push_subscription FOR SELECT TO authenticated USING ((nhan_vien_id = public.nhan_vien_hien_tai_id()));


--
-- Name: fp_var_thong_bao_tuy_chon Tuỳ chọn thông báo của mình; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Tuỳ chọn thông báo của mình" ON public.fp_var_thong_bao_tuy_chon TO authenticated USING ((nhan_vien_id = public.nhan_vien_hien_tai_id())) WITH CHECK ((nhan_vien_id = public.nhan_vien_hien_tai_id()));


--
-- Name: fp_var_thong_bao Worker thông báo toàn quyền; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Worker thông báo toàn quyền" ON public.fp_var_thong_bao TO notify_service USING (true) WITH CHECK (true);


--
-- Name: fp_var_su_kien_thong_bao Worker thông báo toàn quyền trên outbox; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Worker thông báo toàn quyền trên outbox" ON public.fp_var_su_kien_thong_bao TO notify_service USING (true) WITH CHECK (true);


--
-- Name: fp_var_push_subscription Worker thông báo toàn quyền trên subscription; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Worker thông báo toàn quyền trên subscription" ON public.fp_var_push_subscription TO notify_service USING (true) WITH CHECK (true);


--
-- Name: fp_var_thong_bao_cai_dat Worker đọc cài đặt thông báo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Worker đọc cài đặt thông báo" ON public.fp_var_thong_bao_cai_dat FOR SELECT TO notify_service USING (true);


--
-- Name: fp_var_thong_bao_tuy_chon Worker đọc tuỳ chọn thông báo; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Worker đọc tuỳ chọn thông báo" ON public.fp_var_thong_bao_tuy_chon FOR SELECT TO notify_service USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_nhan_cong_ct; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_ct_sub ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_nhan_cong_kpi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_kpi ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_so_che; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_so_che_ct; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che_ct ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_so_che_kpi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che_kpi ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_so_che_pham_cap; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_bao_cao_so_che_pham_cap ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_bao_cao_nhan_cong_ct fp_farm_bcnc_ct_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_delete_auth ON public.fp_farm_bao_cao_nhan_cong_ct FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct fp_farm_bcnc_ct_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_insert_auth ON public.fp_farm_bao_cao_nhan_cong_ct FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct fp_farm_bcnc_ct_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_select_auth ON public.fp_farm_bao_cao_nhan_cong_ct FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub fp_farm_bcnc_ct_sub_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_sub_delete_auth ON public.fp_farm_bao_cao_nhan_cong_ct_sub FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub fp_farm_bcnc_ct_sub_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_sub_insert_auth ON public.fp_farm_bao_cao_nhan_cong_ct_sub FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub fp_farm_bcnc_ct_sub_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_sub_select_auth ON public.fp_farm_bao_cao_nhan_cong_ct_sub FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct_sub fp_farm_bcnc_ct_sub_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_sub_update_auth ON public.fp_farm_bao_cao_nhan_cong_ct_sub FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_ct fp_farm_bcnc_ct_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_ct_update_auth ON public.fp_farm_bao_cao_nhan_cong_ct FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_nhan_cong fp_farm_bcnc_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_delete_auth ON public.fp_farm_bao_cao_nhan_cong FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong fp_farm_bcnc_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_insert_auth ON public.fp_farm_bao_cao_nhan_cong FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi fp_farm_bcnc_kpi_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_kpi_delete_auth ON public.fp_farm_bao_cao_nhan_cong_kpi FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi fp_farm_bcnc_kpi_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_kpi_insert_auth ON public.fp_farm_bao_cao_nhan_cong_kpi FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi fp_farm_bcnc_kpi_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_kpi_select_auth ON public.fp_farm_bao_cao_nhan_cong_kpi FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong_kpi fp_farm_bcnc_kpi_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_kpi_update_auth ON public.fp_farm_bao_cao_nhan_cong_kpi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_nhan_cong fp_farm_bcnc_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_select_auth ON public.fp_farm_bao_cao_nhan_cong FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_nhan_cong fp_farm_bcnc_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcnc_update_auth ON public.fp_farm_bao_cao_nhan_cong FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che_ct fp_farm_bcsc_ct_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_ct_delete_auth ON public.fp_farm_bao_cao_so_che_ct FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che_ct fp_farm_bcsc_ct_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_ct_insert_auth ON public.fp_farm_bao_cao_so_che_ct FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che_ct fp_farm_bcsc_ct_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_ct_select_auth ON public.fp_farm_bao_cao_so_che_ct FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che_ct fp_farm_bcsc_ct_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_ct_update_auth ON public.fp_farm_bao_cao_so_che_ct FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che fp_farm_bcsc_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_delete_auth ON public.fp_farm_bao_cao_so_che FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che fp_farm_bcsc_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_insert_auth ON public.fp_farm_bao_cao_so_che FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che_kpi fp_farm_bcsc_kpi_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_kpi_delete_auth ON public.fp_farm_bao_cao_so_che_kpi FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che_kpi fp_farm_bcsc_kpi_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_kpi_insert_auth ON public.fp_farm_bao_cao_so_che_kpi FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che_kpi fp_farm_bcsc_kpi_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_kpi_select_auth ON public.fp_farm_bao_cao_so_che_kpi FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che_kpi fp_farm_bcsc_kpi_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_kpi_update_auth ON public.fp_farm_bao_cao_so_che_kpi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che_pham_cap fp_farm_bcsc_pc_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_pc_delete_auth ON public.fp_farm_bao_cao_so_che_pham_cap FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che_pham_cap fp_farm_bcsc_pc_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_pc_insert_auth ON public.fp_farm_bao_cao_so_che_pham_cap FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che_pham_cap fp_farm_bcsc_pc_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_pc_select_auth ON public.fp_farm_bao_cao_so_che_pham_cap FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che_pham_cap fp_farm_bcsc_pc_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_pc_update_auth ON public.fp_farm_bao_cao_so_che_pham_cap FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_bao_cao_so_che fp_farm_bcsc_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_select_auth ON public.fp_farm_bao_cao_so_che FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_bao_cao_so_che fp_farm_bcsc_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_bcsc_update_auth ON public.fp_farm_bao_cao_so_che FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_danh_muc_hang_hoa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_danh_muc_hang_hoa ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_danh_muc_hang_hoa fp_farm_danh_muc_hang_hoa_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_muc_hang_hoa_delete ON public.fp_farm_danh_muc_hang_hoa FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_danh_muc_hang_hoa fp_farm_danh_muc_hang_hoa_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_muc_hang_hoa_insert ON public.fp_farm_danh_muc_hang_hoa FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_danh_muc_hang_hoa fp_farm_danh_muc_hang_hoa_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_muc_hang_hoa_select ON public.fp_farm_danh_muc_hang_hoa FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_danh_muc_hang_hoa fp_farm_danh_muc_hang_hoa_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_muc_hang_hoa_update ON public.fp_farm_danh_muc_hang_hoa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_danh_sach_hang_hoa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_danh_sach_hang_hoa ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_danh_sach_hang_hoa fp_farm_danh_sach_hang_hoa_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_sach_hang_hoa_delete ON public.fp_farm_danh_sach_hang_hoa FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_danh_sach_hang_hoa fp_farm_danh_sach_hang_hoa_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_sach_hang_hoa_insert ON public.fp_farm_danh_sach_hang_hoa FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_danh_sach_hang_hoa fp_farm_danh_sach_hang_hoa_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_sach_hang_hoa_select ON public.fp_farm_danh_sach_hang_hoa FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_danh_sach_hang_hoa fp_farm_danh_sach_hang_hoa_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_danh_sach_hang_hoa_update ON public.fp_farm_danh_sach_hang_hoa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_du_bao_sl_dong_thung fp_farm_dbdt_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dbdt_delete_auth ON public.fp_farm_du_bao_sl_dong_thung FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_du_bao_sl_dong_thung fp_farm_dbdt_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dbdt_insert_auth ON public.fp_farm_du_bao_sl_dong_thung FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_du_bao_sl_dong_thung fp_farm_dbdt_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dbdt_select_auth ON public.fp_farm_du_bao_sl_dong_thung FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_du_bao_sl_dong_thung fp_farm_dbdt_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dbdt_update_auth ON public.fp_farm_du_bao_sl_dong_thung FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_de_xuat_mua_hang; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_de_xuat_mua_hang ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_de_xuat_mua_hang_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet fp_farm_de_xuat_mua_hang_ct_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_ct_delete ON public.fp_farm_de_xuat_mua_hang_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet fp_farm_de_xuat_mua_hang_ct_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_ct_insert ON public.fp_farm_de_xuat_mua_hang_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet fp_farm_de_xuat_mua_hang_ct_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_ct_select ON public.fp_farm_de_xuat_mua_hang_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_de_xuat_mua_hang_chi_tiet fp_farm_de_xuat_mua_hang_ct_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_ct_update ON public.fp_farm_de_xuat_mua_hang_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_de_xuat_mua_hang fp_farm_de_xuat_mua_hang_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_delete ON public.fp_farm_de_xuat_mua_hang FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_de_xuat_mua_hang fp_farm_de_xuat_mua_hang_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_insert ON public.fp_farm_de_xuat_mua_hang FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_de_xuat_mua_hang fp_farm_de_xuat_mua_hang_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_select ON public.fp_farm_de_xuat_mua_hang FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_de_xuat_mua_hang fp_farm_de_xuat_mua_hang_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_de_xuat_mua_hang_update ON public.fp_farm_de_xuat_mua_hang FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_dot_kiem_ke_pt; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_dot_kiem_ke_pt ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kiem_ke_pt_chi_tiet_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_chi_tiet_delete ON public.fp_farm_dot_kiem_ke_pt_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kiem_ke_pt_chi_tiet_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_chi_tiet_insert ON public.fp_farm_dot_kiem_ke_pt_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kiem_ke_pt_chi_tiet_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_chi_tiet_select ON public.fp_farm_dot_kiem_ke_pt_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_dot_kiem_ke_pt_chi_tiet fp_farm_dot_kiem_ke_pt_chi_tiet_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_chi_tiet_update ON public.fp_farm_dot_kiem_ke_pt_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_dot_kiem_ke_pt fp_farm_dot_kiem_ke_pt_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_delete ON public.fp_farm_dot_kiem_ke_pt FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_dot_kiem_ke_pt fp_farm_dot_kiem_ke_pt_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_insert ON public.fp_farm_dot_kiem_ke_pt FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_dot_kiem_ke_pt_kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_dot_kiem_ke_pt_kho ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_dot_kiem_ke_pt_kho fp_farm_dot_kiem_ke_pt_kho_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_kho_delete ON public.fp_farm_dot_kiem_ke_pt_kho FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_dot_kiem_ke_pt_kho fp_farm_dot_kiem_ke_pt_kho_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_kho_insert ON public.fp_farm_dot_kiem_ke_pt_kho FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_dot_kiem_ke_pt_kho fp_farm_dot_kiem_ke_pt_kho_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_kho_select ON public.fp_farm_dot_kiem_ke_pt_kho FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_dot_kiem_ke_pt_kho fp_farm_dot_kiem_ke_pt_kho_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_kho_update ON public.fp_farm_dot_kiem_ke_pt_kho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_dot_kiem_ke_pt fp_farm_dot_kiem_ke_pt_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_select ON public.fp_farm_dot_kiem_ke_pt FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_dot_kiem_ke_pt fp_farm_dot_kiem_ke_pt_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_dot_kiem_ke_pt_update ON public.fp_farm_dot_kiem_ke_pt FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_du_bao_sl_dong_thung; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_du_bao_sl_dong_thung ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_phieu_kho_phan_thuoc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet fp_farm_phieu_kho_pt_ct_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_ct_delete ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet fp_farm_phieu_kho_pt_ct_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_ct_insert ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet fp_farm_phieu_kho_pt_ct_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_ct_select ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_phieu_kho_phan_thuoc_chi_tiet fp_farm_phieu_kho_pt_ct_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_ct_update ON public.fp_farm_phieu_kho_phan_thuoc_chi_tiet FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_phieu_kho_phan_thuoc fp_farm_phieu_kho_pt_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_delete ON public.fp_farm_phieu_kho_phan_thuoc FOR DELETE TO authenticated USING (true);


--
-- Name: fp_farm_phieu_kho_phan_thuoc fp_farm_phieu_kho_pt_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_insert ON public.fp_farm_phieu_kho_phan_thuoc FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_farm_phieu_kho_phan_thuoc fp_farm_phieu_kho_pt_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_select ON public.fp_farm_phieu_kho_phan_thuoc FOR SELECT TO authenticated USING (true);


--
-- Name: fp_farm_phieu_kho_phan_thuoc fp_farm_phieu_kho_pt_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_farm_phieu_kho_pt_update ON public.fp_farm_phieu_kho_phan_thuoc FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_farm_thu_hoach; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_thu_hoach ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_farm_tien_do_mua_hang; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_farm_tien_do_mua_hang ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_hc_cong_viec; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_hc_cong_viec ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_hc_noi_quan_ly; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_hc_noi_quan_ly ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_hr_bang_luong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_bang_luong ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_hr_diem_cong_tru; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_diem_cong_tru ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_hr_nhom_phieu_hanh_chinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_nhom_phieu_hanh_chinh ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_hr_phieu_hanh_chinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_phieu_hanh_chinh ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_hr_thiet_lap_diem_cong_tru; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_hr_thiet_lap_diem_cong_tru ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_danh_muc_hang_hoa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_muc_hang_hoa ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_danh_muc_hang_hoa fp_mh_danh_muc_hang_hoa_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_muc_hang_hoa_delete_policy ON public.fp_mh_danh_muc_hang_hoa FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_danh_muc_hang_hoa fp_mh_danh_muc_hang_hoa_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_muc_hang_hoa_insert_policy ON public.fp_mh_danh_muc_hang_hoa FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_danh_muc_hang_hoa fp_mh_danh_muc_hang_hoa_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_muc_hang_hoa_select_policy ON public.fp_mh_danh_muc_hang_hoa FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_danh_muc_hang_hoa fp_mh_danh_muc_hang_hoa_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_muc_hang_hoa_update_policy ON public.fp_mh_danh_muc_hang_hoa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_danh_sach_doi_tac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_sach_doi_tac ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_danh_sach_hang_hoa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_sach_hang_hoa ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_danh_sach_hang_hoa fp_mh_danh_sach_hang_hoa_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_hang_hoa_delete_policy ON public.fp_mh_danh_sach_hang_hoa FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_danh_sach_hang_hoa fp_mh_danh_sach_hang_hoa_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_hang_hoa_insert_policy ON public.fp_mh_danh_sach_hang_hoa FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_danh_sach_hang_hoa fp_mh_danh_sach_hang_hoa_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_hang_hoa_select_policy ON public.fp_mh_danh_sach_hang_hoa FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_danh_sach_hang_hoa fp_mh_danh_sach_hang_hoa_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_hang_hoa_update_policy ON public.fp_mh_danh_sach_hang_hoa FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_danh_sach_kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_danh_sach_kho ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_danh_sach_kho fp_mh_danh_sach_kho_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_kho_delete_policy ON public.fp_mh_danh_sach_kho FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_danh_sach_kho fp_mh_danh_sach_kho_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_kho_insert_policy ON public.fp_mh_danh_sach_kho FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_danh_sach_kho fp_mh_danh_sach_kho_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_kho_select_policy ON public.fp_mh_danh_sach_kho FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_danh_sach_kho fp_mh_danh_sach_kho_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_danh_sach_kho_update_policy ON public.fp_mh_danh_sach_kho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_dinh_muc_ton_kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_dinh_muc_ton_kho ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_dinh_muc_ton_kho fp_mh_dinh_muc_ton_kho_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dinh_muc_ton_kho_delete_policy ON public.fp_mh_dinh_muc_ton_kho FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_dinh_muc_ton_kho fp_mh_dinh_muc_ton_kho_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dinh_muc_ton_kho_insert_policy ON public.fp_mh_dinh_muc_ton_kho FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_dinh_muc_ton_kho fp_mh_dinh_muc_ton_kho_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dinh_muc_ton_kho_select_policy ON public.fp_mh_dinh_muc_ton_kho FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_dinh_muc_ton_kho fp_mh_dinh_muc_ton_kho_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dinh_muc_ton_kho_update_policy ON public.fp_mh_dinh_muc_ton_kho FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_mh_don_dat_hang; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_don_dat_hang ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_don_dat_hang_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_don_dat_hang_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_dot_kiem_ke_kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_dot_kiem_ke_kho ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tiet_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_chi_tiet_delete ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tiet_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_chi_tiet_insert ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tiet_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_chi_tiet_select ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho_chi_tiet fp_mh_dot_kiem_ke_kho_chi_tiet_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_chi_tiet_update ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR UPDATE TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho fp_mh_dot_kiem_ke_kho_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_delete ON public.fp_mh_dot_kiem_ke_kho FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho fp_mh_dot_kiem_ke_kho_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_insert ON public.fp_mh_dot_kiem_ke_kho FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_dot_kiem_ke_kho_kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_dot_kiem_ke_kho_kho ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_dot_kiem_ke_kho_kho fp_mh_dot_kiem_ke_kho_kho_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_kho_delete ON public.fp_mh_dot_kiem_ke_kho_kho FOR DELETE TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho_kho fp_mh_dot_kiem_ke_kho_kho_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_kho_insert ON public.fp_mh_dot_kiem_ke_kho_kho FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_mh_dot_kiem_ke_kho_kho fp_mh_dot_kiem_ke_kho_kho_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_kho_select ON public.fp_mh_dot_kiem_ke_kho_kho FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho_kho fp_mh_dot_kiem_ke_kho_kho_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_kho_update ON public.fp_mh_dot_kiem_ke_kho_kho FOR UPDATE TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho fp_mh_dot_kiem_ke_kho_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_select ON public.fp_mh_dot_kiem_ke_kho FOR SELECT TO authenticated USING (true);


--
-- Name: fp_mh_dot_kiem_ke_kho fp_mh_dot_kiem_ke_kho_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_mh_dot_kiem_ke_kho_update ON public.fp_mh_dot_kiem_ke_kho FOR UPDATE TO authenticated USING (true);


--
-- Name: fp_mh_hop_dong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_hop_dong ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_hop_dong_ct; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_hop_dong_ct ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_nhom_doi_tac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_nhom_doi_tac ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_phieu_de_xuat_vat_tu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_de_xuat_vat_tu ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_phieu_de_xuat_vat_tu_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_phieu_kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kho ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_phieu_kho_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kho_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_phieu_kho_so_phieu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kho_so_phieu ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_phieu_kiem_ke; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kiem_ke ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_phieu_kiem_ke_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_phieu_kiem_ke_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_tag_doi_tac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_tag_doi_tac ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_thanh_toan_doi_tac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_thanh_toan_doi_tac ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_tien_do_mua_hang; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_tien_do_mua_hang ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_mh_trang_thai_thanh_toan_doi_tac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_mh_trang_thai_thanh_toan_doi_tac ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_tc_hang_muc_thu_chi fp_tc_hang_muc_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_hang_muc_delete_auth ON public.fp_tc_hang_muc_thu_chi FOR DELETE TO authenticated USING (true);


--
-- Name: fp_tc_hang_muc_thu_chi fp_tc_hang_muc_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_hang_muc_insert_auth ON public.fp_tc_hang_muc_thu_chi FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_tc_hang_muc_thu_chi fp_tc_hang_muc_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_hang_muc_select_auth ON public.fp_tc_hang_muc_thu_chi FOR SELECT TO authenticated USING (true);


--
-- Name: fp_tc_hang_muc_thu_chi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_tc_hang_muc_thu_chi ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_tc_hang_muc_thu_chi fp_tc_hang_muc_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_hang_muc_update_auth ON public.fp_tc_hang_muc_thu_chi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_tc_quy_thu_chi fp_tc_qtc_delete_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_qtc_delete_auth ON public.fp_tc_quy_thu_chi FOR DELETE TO authenticated USING (true);


--
-- Name: fp_tc_quy_thu_chi fp_tc_qtc_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_qtc_insert_auth ON public.fp_tc_quy_thu_chi FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_tc_quy_thu_chi fp_tc_qtc_select_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_qtc_select_auth ON public.fp_tc_quy_thu_chi FOR SELECT TO authenticated USING (true);


--
-- Name: fp_tc_quy_thu_chi fp_tc_qtc_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_tc_qtc_update_auth ON public.fp_tc_quy_thu_chi FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_tc_quy_thu_chi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_tc_quy_thu_chi ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_chi_phi_tai_san; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_chi_phi_tai_san ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_chi_tiet_khau_hao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_chi_tiet_khau_hao ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_dot_kiem_ke_tai_san; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_dot_kiem_ke_tai_san ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_ky_khau_hao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_ky_khau_hao ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_loai_chi_phi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_loai_chi_phi ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_nhom_tai_san; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_nhom_tai_san ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_phieu_cap_phat_thu_hoi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_phieu_cap_phat_thu_hoi ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_phieu_cap_phat_thu_hoi_ct; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_phieu_cap_phat_thu_hoi_ct ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_tai_san; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_tai_san ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_trang_thai_chi_phi_tai_san; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_trang_thai_chi_phi_tai_san ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_ts_trang_thai_tai_san; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_ts_trang_thai_tai_san ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_cap_bac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_cap_bac ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_cap_bac fp_var_cap_bac_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_cap_bac_delete_policy ON public.fp_var_cap_bac FOR DELETE TO authenticated USING (true);


--
-- Name: fp_var_cap_bac fp_var_cap_bac_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_cap_bac_insert_policy ON public.fp_var_cap_bac FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_var_cap_bac fp_var_cap_bac_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_cap_bac_select_policy ON public.fp_var_cap_bac FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_cap_bac fp_var_cap_bac_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_cap_bac_update_policy ON public.fp_var_cap_bac FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_chi_nhanh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_chi_nhanh ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_chuc_vu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_chuc_vu ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_chuc_vu fp_var_chuc_vu_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_chuc_vu_delete_policy ON public.fp_var_chuc_vu FOR DELETE TO authenticated USING (true);


--
-- Name: fp_var_chuc_vu fp_var_chuc_vu_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_chuc_vu_insert_policy ON public.fp_var_chuc_vu FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_var_chuc_vu fp_var_chuc_vu_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_chuc_vu_select_policy ON public.fp_var_chuc_vu FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_chuc_vu fp_var_chuc_vu_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_chuc_vu_update_policy ON public.fp_var_chuc_vu FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_lan_dang_nhap_sai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_lan_dang_nhap_sai ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_nhan_vien; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_nhan_vien ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_nhan_vien fp_var_nhan_vien_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_nhan_vien_delete_policy ON public.fp_var_nhan_vien FOR DELETE TO authenticated USING (true);


--
-- Name: fp_var_nhan_vien fp_var_nhan_vien_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_nhan_vien_insert_policy ON public.fp_var_nhan_vien FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_var_nhan_vien fp_var_nhan_vien_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_nhan_vien_select_policy ON public.fp_var_nhan_vien FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_nhan_vien fp_var_nhan_vien_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_nhan_vien_update_policy ON public.fp_var_nhan_vien FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_phan_quyen; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_phan_quyen ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_phien_dang_nhap; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_phien_dang_nhap ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_phong_ban; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_phong_ban ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_phong_ban fp_var_phong_ban_delete_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_phong_ban_delete_policy ON public.fp_var_phong_ban FOR DELETE TO authenticated USING (true);


--
-- Name: fp_var_phong_ban fp_var_phong_ban_insert_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_phong_ban_insert_policy ON public.fp_var_phong_ban FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: fp_var_phong_ban fp_var_phong_ban_select_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_phong_ban_select_policy ON public.fp_var_phong_ban FOR SELECT TO authenticated USING (true);


--
-- Name: fp_var_phong_ban fp_var_phong_ban_update_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fp_var_phong_ban_update_policy ON public.fp_var_phong_ban FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: fp_var_push_subscription; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_push_subscription ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_su_kien_thong_bao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_su_kien_thong_bao ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_thong_bao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_thong_bao ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_thong_bao_cai_dat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_thong_bao_cai_dat ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_thong_bao_tuy_chon; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_thong_bao_tuy_chon ENABLE ROW LEVEL SECURITY;

--
-- Name: fp_var_tt_cong_ty; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.fp_var_tt_cong_ty ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO auth_service;
GRANT USAGE ON SCHEMA public TO notify_service;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.jwt() TO anon;
GRANT ALL ON FUNCTION auth.jwt() TO authenticated;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.role() TO anon;
GRANT ALL ON FUNCTION auth.role() TO authenticated;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: -
--

GRANT ALL ON FUNCTION auth.uid() TO anon;
GRANT ALL ON FUNCTION auth.uid() TO authenticated;


--
-- Name: FUNCTION _nxt_norm_loai(p_loai text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public._nxt_norm_loai(p_loai text) TO anon;
GRANT ALL ON FUNCTION public._nxt_norm_loai(p_loai text) TO authenticated;


--
-- Name: FUNCTION co_quyen_quan_tri_mat_khau(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.co_quyen_quan_tri_mat_khau() FROM PUBLIC;
GRANT ALL ON FUNCTION public.co_quyen_quan_tri_mat_khau() TO authenticated;


--
-- Name: FUNCTION dang_bi_chan_dang_nhap(p_email text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.dang_bi_chan_dang_nhap(p_email text) FROM PUBLIC;


--
-- Name: FUNCTION farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint) TO authenticated;


--
-- Name: FUNCTION farm_kiem_ke_pt_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint) TO authenticated;


--
-- Name: FUNCTION fp_farm_phieu_kho_pt_ct_thanh_tien(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_farm_phieu_kho_pt_ct_thanh_tien() TO anon;
GRANT ALL ON FUNCTION public.fp_farm_phieu_kho_pt_ct_thanh_tien() TO authenticated;


--
-- Name: FUNCTION fp_farm_phieu_kho_pt_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_farm_phieu_kho_pt_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_farm_phieu_kho_pt_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_hc_cong_viec_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_hc_cong_viec_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_hc_cong_viec_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_hc_noi_quan_ly_sync_ten_chi_nhanh(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_hc_noi_quan_ly_sync_ten_chi_nhanh() TO anon;
GRANT ALL ON FUNCTION public.fp_hc_noi_quan_ly_sync_ten_chi_nhanh() TO authenticated;


--
-- Name: FUNCTION fp_hc_noi_quan_ly_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_hc_noi_quan_ly_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_hc_noi_quan_ly_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_hr_diem_cong_tru_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_hr_diem_cong_tru_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_hr_diem_cong_tru_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_don_dat_hang_after_update(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_after_update() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_after_update() TO authenticated;


--
-- Name: FUNCTION fp_mh_don_dat_hang_chi_tiet_sync_phieu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_chi_tiet_sync_phieu() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_chi_tiet_sync_phieu() TO authenticated;


--
-- Name: FUNCTION fp_mh_don_dat_hang_chi_tiet_thanh_tien(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_chi_tiet_thanh_tien() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_chi_tiet_thanh_tien() TO authenticated;


--
-- Name: FUNCTION fp_mh_don_dat_hang_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_don_dat_hang_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_dot_kiem_ke_kho_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_dot_kiem_ke_kho_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_dot_kiem_ke_kho_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_hop_dong_ct_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_hop_dong_ct_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_hop_dong_ct_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_hop_dong_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_hop_dong_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_hop_dong_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_de_xuat_vat_tu_after_update(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_after_update() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_after_update() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_kho_chi_tiet_thanh_tien(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_kho_chi_tiet_thanh_tien() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_kho_chi_tiet_thanh_tien() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_kho_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_kho_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_kho_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_kiem_ke_after_update(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_after_update() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_after_update() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu() TO authenticated;


--
-- Name: FUNCTION fp_mh_phieu_kiem_ke_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_phieu_kiem_ke_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_thanh_toan_doi_tac_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_thanh_toan_doi_tac_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_thanh_toan_doi_tac_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_mh_tien_do_mua_hang_set_timestamps(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_tien_do_mua_hang_set_timestamps() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_tien_do_mua_hang_set_timestamps() TO authenticated;


--
-- Name: FUNCTION fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_chi_phi_tai_san_sync_ten_trang_thai(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_chi_phi_tai_san_sync_ten_trang_thai() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_chi_phi_tai_san_sync_ten_trang_thai() TO authenticated;


--
-- Name: FUNCTION fp_ts_chi_phi_tai_san_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_chi_phi_tai_san_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_chi_phi_tai_san_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_chi_tiet_khau_hao_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_chi_tiet_khau_hao_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_chi_tiet_khau_hao_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_ky_khau_hao_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_ky_khau_hao_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_ky_khau_hao_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_loai_chi_phi_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_loai_chi_phi_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_loai_chi_phi_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_nhom_tai_san_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_nhom_tai_san_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_nhom_tai_san_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_phieu_cap_phat_thu_hoi_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_phieu_cap_phat_thu_hoi_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_phieu_cap_phat_thu_hoi_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_phieu_cpth_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_phieu_cpth_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_phieu_cpth_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_tai_san_sync_chi_phi_ma_ten(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_tai_san_sync_chi_phi_ma_ten() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_tai_san_sync_chi_phi_ma_ten() TO authenticated;


--
-- Name: FUNCTION fp_ts_tai_san_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_tai_san_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_tai_san_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_trang_thai_chi_phi_tai_san_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_ts_trang_thai_tai_san_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_ts_trang_thai_tai_san_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_ts_trang_thai_tai_san_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_var_cap_bac_sync_nhan_vien_ten(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten() TO anon;
GRANT ALL ON FUNCTION public.fp_var_cap_bac_sync_nhan_vien_ten() TO authenticated;


--
-- Name: FUNCTION fp_var_chi_nhanh_sync_nhan_vien_ten(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_var_chi_nhanh_sync_nhan_vien_ten() TO anon;
GRANT ALL ON FUNCTION public.fp_var_chi_nhanh_sync_nhan_vien_ten() TO authenticated;


--
-- Name: FUNCTION fp_var_chuc_vu_sync_nhan_vien_ten(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_var_chuc_vu_sync_nhan_vien_ten() TO anon;
GRANT ALL ON FUNCTION public.fp_var_chuc_vu_sync_nhan_vien_ten() TO authenticated;


--
-- Name: FUNCTION fp_var_nhan_vien_sync_display_names(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_var_nhan_vien_sync_display_names() TO anon;
GRANT ALL ON FUNCTION public.fp_var_nhan_vien_sync_display_names() TO authenticated;


--
-- Name: FUNCTION fp_var_phan_quyen_tg_cap_nhat(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_var_phan_quyen_tg_cap_nhat() TO anon;
GRANT ALL ON FUNCTION public.fp_var_phan_quyen_tg_cap_nhat() TO authenticated;


--
-- Name: FUNCTION fp_var_phong_ban_sync_nhan_vien_ten(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.fp_var_phong_ban_sync_nhan_vien_ten() TO anon;
GRANT ALL ON FUNCTION public.fp_var_phong_ban_sync_nhan_vien_ten() TO authenticated;


--
-- Name: FUNCTION get_next_ma_dot_dot_kiem_ke_kho(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_ma_dot_dot_kiem_ke_kho() TO anon;
GRANT ALL ON FUNCTION public.get_next_ma_dot_dot_kiem_ke_kho() TO authenticated;


--
-- Name: FUNCTION get_next_ma_dot_farm_kiem_ke_pt(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_ma_dot_farm_kiem_ke_pt() TO authenticated;


--
-- Name: FUNCTION get_next_ma_phieu_chi_phi_tai_san(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_ma_phieu_chi_phi_tai_san() TO anon;
GRANT ALL ON FUNCTION public.get_next_ma_phieu_chi_phi_tai_san() TO authenticated;


--
-- Name: FUNCTION get_next_ma_phieu_cpth(p_loai text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_ma_phieu_cpth(p_loai text) TO anon;
GRANT ALL ON FUNCTION public.get_next_ma_phieu_cpth(p_loai text) TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu(p_loai text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu(p_loai text) TO anon;
GRANT ALL ON FUNCTION public.get_next_so_phieu(p_loai text) TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_farm_de_xuat_mua_hang(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_farm_de_xuat_mua_hang() TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_farm_pt(p_loai text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_farm_pt(p_loai text) TO anon;
GRANT ALL ON FUNCTION public.get_next_so_phieu_farm_pt(p_loai text) TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_phieu_de_xuat_vat_tu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_phieu_de_xuat_vat_tu() TO anon;
GRANT ALL ON FUNCTION public.get_next_so_phieu_phieu_de_xuat_vat_tu() TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_phieu_kiem_ke(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_phieu_kiem_ke() TO anon;
GRANT ALL ON FUNCTION public.get_next_so_phieu_phieu_kiem_ke() TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_tc_quy_batch(p_loai text, p_so_luong integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_tc_quy_batch(p_loai text, p_so_luong integer) TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_tc_quy_chi(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_tc_quy_chi() TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_tc_quy_thu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_tc_quy_thu() TO authenticated;


--
-- Name: FUNCTION get_next_so_phieu_thanh_toan_doi_tac(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_phieu_thanh_toan_doi_tac() TO anon;
GRANT ALL ON FUNCTION public.get_next_so_phieu_thanh_toan_doi_tac() TO authenticated;


--
-- Name: FUNCTION get_next_so_po_don_dat_hang(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.get_next_so_po_don_dat_hang() TO anon;
GRANT ALL ON FUNCTION public.get_next_so_po_don_dat_hang() TO authenticated;


--
-- Name: FUNCTION is_admin_current_user(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.is_admin_current_user() TO anon;
GRANT ALL ON FUNCTION public.is_admin_current_user() TO authenticated;


--
-- Name: FUNCTION kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint) TO anon;
GRANT ALL ON FUNCTION public.kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint) TO authenticated;


--
-- Name: FUNCTION kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint) TO anon;
GRANT ALL ON FUNCTION public.kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint) TO authenticated;


--
-- Name: FUNCTION nhan_vien_hien_tai_id(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.nhan_vien_hien_tai_id() FROM PUBLIC;
GRANT ALL ON FUNCTION public.nhan_vien_hien_tai_id() TO authenticated;


--
-- Name: FUNCTION remove_tag_from_partners(p_tag_id integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.remove_tag_from_partners(p_tag_id integer) TO anon;
GRANT ALL ON FUNCTION public.remove_tag_from_partners(p_tag_id integer) TO authenticated;


--
-- Name: FUNCTION remove_tags_from_partners(p_tag_ids integer[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.remove_tags_from_partners(p_tag_ids integer[]) TO anon;
GRANT ALL ON FUNCTION public.remove_tags_from_partners(p_tag_ids integer[]) TO authenticated;


--
-- Name: FUNCTION revoke_session(p_session_id uuid); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.revoke_session(p_session_id uuid) TO anon;
GRANT ALL ON FUNCTION public.revoke_session(p_session_id uuid) TO authenticated;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;


--
-- Name: FUNCTION rpc_count_nhan_vien_by_chuc_vu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_count_nhan_vien_by_chuc_vu() TO anon;
GRANT ALL ON FUNCTION public.rpc_count_nhan_vien_by_chuc_vu() TO authenticated;


--
-- Name: FUNCTION rpc_dang_nhap(p_email text, p_mat_khau text, p_user_agent text, p_ip text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rpc_dang_nhap(p_email text, p_mat_khau text, p_user_agent text, p_ip text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.rpc_dang_nhap(p_email text, p_mat_khau text, p_user_agent text, p_ip text) TO auth_service;


--
-- Name: FUNCTION rpc_dang_nhap_google(p_email text, p_user_agent text, p_ip text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rpc_dang_nhap_google(p_email text, p_user_agent text, p_ip text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.rpc_dang_nhap_google(p_email text, p_user_agent text, p_ip text) TO auth_service;


--
-- Name: FUNCTION rpc_don_dat_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_supplier_ids bigint[], p_buyer_ids bigint[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_don_dat_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_supplier_ids bigint[], p_buyer_ids bigint[]) TO anon;
GRANT ALL ON FUNCTION public.rpc_don_dat_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_supplier_ids bigint[], p_buyer_ids bigint[]) TO authenticated;


--
-- Name: FUNCTION rpc_don_su_kien_thong_bao_cu(p_so_ngay integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_don_su_kien_thong_bao_cu(p_so_ngay integer) TO notify_service;


--
-- Name: FUNCTION rpc_don_thong_bao_cu(p_so_ngay integer); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_don_thong_bao_cu(p_so_ngay integer) TO notify_service;


--
-- Name: FUNCTION rpc_farm_de_xuat_mua_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_farm_de_xuat_mua_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_farm_de_xuat_mua_hang_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]) TO anon;


--
-- Name: FUNCTION rpc_fp_ts_distinct_model(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_model() TO anon;
GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_model() TO authenticated;


--
-- Name: FUNCTION rpc_fp_ts_distinct_ten_nha_cung_cap(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_ten_nha_cung_cap() TO anon;
GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_ten_nha_cung_cap() TO authenticated;


--
-- Name: FUNCTION rpc_fp_ts_distinct_thuong_hieu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_thuong_hieu() TO anon;
GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_thuong_hieu() TO authenticated;


--
-- Name: FUNCTION rpc_fp_ts_distinct_xuat_xu(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_xuat_xu() TO anon;
GRANT ALL ON FUNCTION public.rpc_fp_ts_distinct_xuat_xu() TO authenticated;


--
-- Name: FUNCTION rpc_get_session_bootstrap(p_email text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_get_session_bootstrap(p_email text) TO anon;
GRANT ALL ON FUNCTION public.rpc_get_session_bootstrap(p_email text) TO authenticated;


--
-- Name: FUNCTION rpc_lam_moi_phien(p_refresh_hash text, p_user_agent text, p_ip text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rpc_lam_moi_phien(p_refresh_hash text, p_user_agent text, p_ip text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.rpc_lam_moi_phien(p_refresh_hash text, p_user_agent text, p_ip text) TO auth_service;


--
-- Name: FUNCTION rpc_nxt_by_period(p_filters jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_nxt_by_period(p_filters jsonb) TO anon;
GRANT ALL ON FUNCTION public.rpc_nxt_by_period(p_filters jsonb) TO authenticated;


--
-- Name: FUNCTION rpc_phieu_de_xuat_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_phieu_de_xuat_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]) TO anon;
GRANT ALL ON FUNCTION public.rpc_phieu_de_xuat_stats(p_date_from date, p_date_to date, p_trang_thai text[], p_id_noi_de_xuat bigint[], p_id_nguoi_de_xuat bigint[], p_id_nguoi_duyet bigint[]) TO authenticated;


--
-- Name: FUNCTION rpc_phieu_in_period(p_filters jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_phieu_in_period(p_filters jsonb) TO anon;
GRANT ALL ON FUNCTION public.rpc_phieu_in_period(p_filters jsonb) TO authenticated;


--
-- Name: FUNCTION rpc_set_mat_khau(p_nhan_vien_id bigint, p_mat_khau text, p_phai_doi boolean); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rpc_set_mat_khau(p_nhan_vien_id bigint, p_mat_khau text, p_phai_doi boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION public.rpc_set_mat_khau(p_nhan_vien_id bigint, p_mat_khau text, p_phai_doi boolean) TO authenticated;


--
-- Name: FUNCTION rpc_sinh_nhat_nhan_vien(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rpc_sinh_nhat_nhan_vien() FROM PUBLIC;
GRANT ALL ON FUNCTION public.rpc_sinh_nhat_nhan_vien() TO authenticated;


--
-- Name: FUNCTION rpc_tb_chi_nhanh_phieu(p_bang text, p_ban_ghi_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_tb_chi_nhanh_phieu(p_bang text, p_ban_ghi_id bigint) TO notify_service;


--
-- Name: FUNCTION rpc_tb_nguoi_duyet(p_module_id text, p_chi_nhanh_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_tb_nguoi_duyet(p_module_id text, p_chi_nhanh_id bigint) TO notify_service;


--
-- Name: FUNCTION rpc_tb_nguoi_duyet_phong_ban(p_module_id text, p_nguoi_tao_id bigint); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_tb_nguoi_duyet_phong_ban(p_module_id text, p_nguoi_tao_id bigint) TO notify_service;


--
-- Name: FUNCTION rpc_tb_ten_loai_phieu_hanh_chinh(p_ids bigint[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_tb_ten_loai_phieu_hanh_chinh(p_ids bigint[]) TO notify_service;


--
-- Name: FUNCTION rpc_tb_ten_nhan_vien(p_ids bigint[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_tb_ten_nhan_vien(p_ids bigint[]) TO notify_service;


--
-- Name: FUNCTION rpc_tc_quy_thu_chi_stats(p_tu_ngay date, p_den_ngay date, p_chi_nhanh_ids bigint[], p_loai text, p_hang_muc_ids bigint[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_tc_quy_thu_chi_stats(p_tu_ngay date, p_den_ngay date, p_chi_nhanh_ids bigint[], p_loai text, p_hang_muc_ids bigint[]) TO authenticated;


--
-- Name: FUNCTION rpc_thong_bao_doc_tat_ca(p_module_id text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_thong_bao_doc_tat_ca(p_module_id text) TO authenticated;


--
-- Name: FUNCTION rpc_thong_bao_xoa_tat_ca(p_module_id text); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_thong_bao_xoa_tat_ca(p_module_id text) TO authenticated;


--
-- Name: FUNCTION rpc_thu_hoi_phien(p_refresh_hash text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rpc_thu_hoi_phien(p_refresh_hash text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.rpc_thu_hoi_phien(p_refresh_hash text) TO auth_service;


--
-- Name: FUNCTION rpc_ton_at_date(p_filters jsonb); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_ton_at_date(p_filters jsonb) TO anon;
GRANT ALL ON FUNCTION public.rpc_ton_at_date(p_filters jsonb) TO authenticated;


--
-- Name: FUNCTION rpc_ton_kho_matrix(p_kho_ids bigint[]); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rpc_ton_kho_matrix(p_kho_ids bigint[]) TO anon;
GRANT ALL ON FUNCTION public.rpc_ton_kho_matrix(p_kho_ids bigint[]) TO authenticated;


--
-- Name: FUNCTION rpc_verify_mat_khau(p_email text, p_mat_khau text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.rpc_verify_mat_khau(p_email text, p_mat_khau text) FROM PUBLIC;


--
-- Name: FUNCTION tao_phien_dang_nhap(p_nhan_vien_id bigint, p_email text, p_user_agent text, p_ip text, p_so_ngay integer); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.tao_phien_dang_nhap(p_nhan_vien_id bigint, p_email text, p_user_agent text, p_ip text, p_so_ngay integer) FROM PUBLIC;


--
-- Name: FUNCTION update_tg_cap_nhat_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_tg_cap_nhat_column() TO anon;
GRANT ALL ON FUNCTION public.update_tg_cap_nhat_column() TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong_ct; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong_ct TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong_ct TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_nhan_cong_ct_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_ct_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_ct_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong_ct_sub; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong_ct_sub TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong_ct_sub TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_nhan_cong_ct_sub_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_ct_sub_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_ct_sub_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_nhan_cong_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_nhan_cong_kpi; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong_kpi TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_nhan_cong_kpi TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_nhan_cong_kpi_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_kpi_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_nhan_cong_kpi_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_so_che; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_so_che_ct; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che_ct TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che_ct TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_so_che_ct_id_seq1; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_ct_id_seq1 TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_ct_id_seq1 TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_so_che_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_so_che_kpi; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che_kpi TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che_kpi TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_so_che_kpi_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_kpi_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_kpi_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_bao_cao_so_che_pham_cap; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che_pham_cap TO anon;
GRANT ALL ON TABLE public.fp_farm_bao_cao_so_che_pham_cap TO authenticated;


--
-- Name: SEQUENCE fp_farm_bao_cao_so_che_pham_cap_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_pham_cap_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_bao_cao_so_che_pham_cap_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_danh_muc_hang_hoa; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_danh_muc_hang_hoa TO anon;
GRANT ALL ON TABLE public.fp_farm_danh_muc_hang_hoa TO authenticated;


--
-- Name: SEQUENCE fp_farm_danh_muc_hang_hoa_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_danh_muc_hang_hoa_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_danh_muc_hang_hoa_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_danh_sach_hang_hoa; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_danh_sach_hang_hoa TO anon;
GRANT ALL ON TABLE public.fp_farm_danh_sach_hang_hoa TO authenticated;


--
-- Name: SEQUENCE fp_farm_danh_sach_hang_hoa_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_danh_sach_hang_hoa_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_danh_sach_hang_hoa_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_de_xuat_mua_hang; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_farm_de_xuat_mua_hang TO authenticated;


--
-- Name: TABLE fp_farm_de_xuat_mua_hang_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_farm_de_xuat_mua_hang_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_farm_de_xuat_mua_hang_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_farm_de_xuat_mua_hang_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_farm_de_xuat_mua_hang_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_farm_de_xuat_mua_hang_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_farm_de_xuat_mua_hang_so_seq; Type: ACL; Schema: public; Owner: -
--

GRANT USAGE ON SEQUENCE public.fp_farm_de_xuat_mua_hang_so_seq TO authenticated;


--
-- Name: TABLE fp_farm_dot_kiem_ke_pt; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_farm_dot_kiem_ke_pt TO authenticated;


--
-- Name: TABLE fp_farm_dot_kiem_ke_pt_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_farm_dot_kiem_ke_pt_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_farm_dot_kiem_ke_pt_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_farm_dot_kiem_ke_pt_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_farm_dot_kiem_ke_pt_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_dot_kiem_ke_pt_kho; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_farm_dot_kiem_ke_pt_kho TO authenticated;


--
-- Name: SEQUENCE fp_farm_dot_kiem_ke_pt_ma_seq; Type: ACL; Schema: public; Owner: -
--

GRANT USAGE ON SEQUENCE public.fp_farm_dot_kiem_ke_pt_ma_seq TO authenticated;


--
-- Name: TABLE fp_farm_du_bao_sl_dong_thung; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_du_bao_sl_dong_thung TO anon;
GRANT ALL ON TABLE public.fp_farm_du_bao_sl_dong_thung TO authenticated;


--
-- Name: SEQUENCE fp_farm_du_bao_sl_dong_thung_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_du_bao_sl_dong_thung_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_du_bao_sl_dong_thung_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_phieu_kho_phan_thuoc; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_phieu_kho_phan_thuoc TO anon;
GRANT ALL ON TABLE public.fp_farm_phieu_kho_phan_thuoc TO authenticated;


--
-- Name: TABLE fp_farm_phieu_kho_phan_thuoc_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet TO anon;
GRANT ALL ON TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_farm_phieu_kho_phan_thuoc_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_phan_thuoc_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_phan_thuoc_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_farm_phieu_kho_pt_so_seq_chuyen; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_chuyen TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_chuyen TO authenticated;


--
-- Name: SEQUENCE fp_farm_phieu_kho_pt_so_seq_nhap; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_nhap TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_nhap TO authenticated;


--
-- Name: SEQUENCE fp_farm_phieu_kho_pt_so_seq_xuat; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_xuat TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_phieu_kho_pt_so_seq_xuat TO authenticated;


--
-- Name: TABLE fp_farm_thu_hoach; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_farm_thu_hoach TO anon;
GRANT ALL ON TABLE public.fp_farm_thu_hoach TO authenticated;


--
-- Name: SEQUENCE fp_farm_thu_hoach_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_farm_thu_hoach_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_farm_thu_hoach_id_seq TO authenticated;


--
-- Name: TABLE fp_farm_tien_do_mua_hang; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_farm_tien_do_mua_hang TO authenticated;


--
-- Name: SEQUENCE fp_farm_tien_do_mua_hang_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_farm_tien_do_mua_hang_id_seq TO authenticated;


--
-- Name: TABLE fp_hc_cong_viec; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_hc_cong_viec TO anon;
GRANT ALL ON TABLE public.fp_hc_cong_viec TO authenticated;


--
-- Name: SEQUENCE fp_hc_cong_viec_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_hc_cong_viec_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_hc_cong_viec_id_seq TO authenticated;


--
-- Name: TABLE fp_hc_noi_quan_ly; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_hc_noi_quan_ly TO anon;
GRANT ALL ON TABLE public.fp_hc_noi_quan_ly TO authenticated;


--
-- Name: SEQUENCE fp_hc_noi_quan_ly_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_hc_noi_quan_ly_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_hc_noi_quan_ly_id_seq TO authenticated;


--
-- Name: TABLE fp_hr_bang_luong; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_hr_bang_luong TO anon;
GRANT ALL ON TABLE public.fp_hr_bang_luong TO authenticated;


--
-- Name: SEQUENCE fp_hr_bang_luong_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_hr_bang_luong_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_hr_bang_luong_id_seq TO authenticated;


--
-- Name: TABLE fp_hr_diem_cong_tru; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_hr_diem_cong_tru TO anon;
GRANT ALL ON TABLE public.fp_hr_diem_cong_tru TO authenticated;


--
-- Name: SEQUENCE fp_hr_diem_cong_tru_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_hr_diem_cong_tru_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_hr_diem_cong_tru_id_seq TO authenticated;


--
-- Name: TABLE fp_hr_nhom_phieu_hanh_chinh; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_hr_nhom_phieu_hanh_chinh TO authenticated;


--
-- Name: SEQUENCE fp_hr_nhom_phieu_hanh_chinh_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_hr_nhom_phieu_hanh_chinh_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_hr_nhom_phieu_hanh_chinh_id_seq TO authenticated;


--
-- Name: TABLE fp_hr_phieu_hanh_chinh; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_hr_phieu_hanh_chinh TO anon;
GRANT ALL ON TABLE public.fp_hr_phieu_hanh_chinh TO authenticated;


--
-- Name: SEQUENCE fp_hr_phieu_hanh_chinh_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_hr_phieu_hanh_chinh_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_hr_phieu_hanh_chinh_id_seq TO authenticated;


--
-- Name: TABLE fp_hr_thiet_lap_diem_cong_tru; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_hr_thiet_lap_diem_cong_tru TO anon;
GRANT ALL ON TABLE public.fp_hr_thiet_lap_diem_cong_tru TO authenticated;


--
-- Name: SEQUENCE fp_hr_thiet_lap_diem_cong_tru_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_hr_thiet_lap_diem_cong_tru_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_hr_thiet_lap_diem_cong_tru_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_danh_muc_hang_hoa; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_danh_muc_hang_hoa TO anon;
GRANT ALL ON TABLE public.fp_mh_danh_muc_hang_hoa TO authenticated;


--
-- Name: SEQUENCE fp_mh_danh_muc_hang_hoa_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_danh_muc_hang_hoa_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_danh_muc_hang_hoa_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_danh_sach_doi_tac; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_danh_sach_doi_tac TO anon;
GRANT ALL ON TABLE public.fp_mh_danh_sach_doi_tac TO authenticated;


--
-- Name: SEQUENCE fp_mh_danh_sach_doi_tac_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_danh_sach_doi_tac_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_danh_sach_doi_tac_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_danh_sach_hang_hoa; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_danh_sach_hang_hoa TO anon;
GRANT ALL ON TABLE public.fp_mh_danh_sach_hang_hoa TO authenticated;


--
-- Name: SEQUENCE fp_mh_danh_sach_hang_hoa_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_danh_sach_hang_hoa_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_danh_sach_hang_hoa_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_danh_sach_kho; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_danh_sach_kho TO anon;
GRANT ALL ON TABLE public.fp_mh_danh_sach_kho TO authenticated;


--
-- Name: SEQUENCE fp_mh_danh_sach_kho_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_danh_sach_kho_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_danh_sach_kho_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_dinh_muc_ton_kho; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_dinh_muc_ton_kho TO anon;
GRANT ALL ON TABLE public.fp_mh_dinh_muc_ton_kho TO authenticated;


--
-- Name: SEQUENCE fp_mh_dinh_muc_ton_kho_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_dinh_muc_ton_kho_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_dinh_muc_ton_kho_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_don_dat_hang; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_don_dat_hang TO anon;
GRANT ALL ON TABLE public.fp_mh_don_dat_hang TO authenticated;


--
-- Name: TABLE fp_mh_don_dat_hang_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_don_dat_hang_chi_tiet TO anon;
GRANT ALL ON TABLE public.fp_mh_don_dat_hang_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_mh_don_dat_hang_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_don_dat_hang_chi_tiet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_don_dat_hang_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_don_dat_hang_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_don_dat_hang_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_don_dat_hang_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_don_dat_hang_so_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_don_dat_hang_so_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_don_dat_hang_so_seq TO authenticated;


--
-- Name: TABLE fp_mh_dot_kiem_ke_kho; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_dot_kiem_ke_kho TO anon;
GRANT ALL ON TABLE public.fp_mh_dot_kiem_ke_kho TO authenticated;


--
-- Name: TABLE fp_mh_dot_kiem_ke_kho_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet TO anon;
GRANT ALL ON TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_mh_dot_kiem_ke_kho_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_dot_kiem_ke_kho_chi_tiet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_dot_kiem_ke_kho_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_dot_kiem_ke_kho_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_dot_kiem_ke_kho_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_dot_kiem_ke_kho_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_dot_kiem_ke_kho_kho; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_dot_kiem_ke_kho_kho TO anon;
GRANT ALL ON TABLE public.fp_mh_dot_kiem_ke_kho_kho TO authenticated;


--
-- Name: SEQUENCE fp_mh_dot_kiem_ke_kho_ma_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_dot_kiem_ke_kho_ma_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_dot_kiem_ke_kho_ma_seq TO authenticated;


--
-- Name: TABLE fp_mh_hop_dong; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_hop_dong TO anon;
GRANT ALL ON TABLE public.fp_mh_hop_dong TO authenticated;


--
-- Name: TABLE fp_mh_hop_dong_ct; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_hop_dong_ct TO anon;
GRANT ALL ON TABLE public.fp_mh_hop_dong_ct TO authenticated;


--
-- Name: SEQUENCE fp_mh_hop_dong_ct_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_hop_dong_ct_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_hop_dong_ct_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_hop_dong_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_hop_dong_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_hop_dong_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_nhom_doi_tac; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_nhom_doi_tac TO anon;
GRANT ALL ON TABLE public.fp_mh_nhom_doi_tac TO authenticated;


--
-- Name: SEQUENCE fp_mh_nhom_doi_tac_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_nhom_doi_tac_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_nhom_doi_tac_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_phieu_de_xuat_vat_tu; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_phieu_de_xuat_vat_tu TO anon;
GRANT ALL ON TABLE public.fp_mh_phieu_de_xuat_vat_tu TO authenticated;


--
-- Name: TABLE fp_mh_phieu_de_xuat_vat_tu_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet TO anon;
GRANT ALL ON TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_de_xuat_vat_tu_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_de_xuat_vat_tu_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_de_xuat_vat_tu_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_de_xuat_vat_tu_so_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_de_xuat_vat_tu_so_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_de_xuat_vat_tu_so_seq TO authenticated;


--
-- Name: TABLE fp_mh_phieu_kho; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_phieu_kho TO anon;
GRANT ALL ON TABLE public.fp_mh_phieu_kho TO authenticated;


--
-- Name: TABLE fp_mh_phieu_kho_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_phieu_kho_chi_tiet TO anon;
GRANT ALL ON TABLE public.fp_mh_phieu_kho_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kho_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_chi_tiet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kho_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_phieu_kho_so_phieu; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_phieu_kho_so_phieu TO anon;
GRANT ALL ON TABLE public.fp_mh_phieu_kho_so_phieu TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kho_so_seq_chuyen; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_so_seq_chuyen TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_so_seq_chuyen TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kho_so_seq_nhap; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_so_seq_nhap TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_so_seq_nhap TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kho_so_seq_xuat; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_so_seq_xuat TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kho_so_seq_xuat TO authenticated;


--
-- Name: TABLE fp_mh_phieu_kiem_ke; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_phieu_kiem_ke TO anon;
GRANT ALL ON TABLE public.fp_mh_phieu_kiem_ke TO authenticated;


--
-- Name: TABLE fp_mh_phieu_kiem_ke_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_phieu_kiem_ke_chi_tiet TO anon;
GRANT ALL ON TABLE public.fp_mh_phieu_kiem_ke_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kiem_ke_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kiem_ke_chi_tiet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kiem_ke_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kiem_ke_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kiem_ke_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kiem_ke_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_phieu_kiem_ke_so_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_phieu_kiem_ke_so_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_phieu_kiem_ke_so_seq TO authenticated;


--
-- Name: TABLE fp_mh_tag_doi_tac; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_tag_doi_tac TO anon;
GRANT ALL ON TABLE public.fp_mh_tag_doi_tac TO authenticated;


--
-- Name: SEQUENCE fp_mh_tag_doi_tac_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_tag_doi_tac_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_tag_doi_tac_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_thanh_toan_doi_tac; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_thanh_toan_doi_tac TO anon;
GRANT ALL ON TABLE public.fp_mh_thanh_toan_doi_tac TO authenticated;


--
-- Name: SEQUENCE fp_mh_thanh_toan_doi_tac_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_thanh_toan_doi_tac_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_thanh_toan_doi_tac_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_mh_thanh_toan_doi_tac_so_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_thanh_toan_doi_tac_so_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_thanh_toan_doi_tac_so_seq TO authenticated;


--
-- Name: TABLE fp_mh_tien_do_mua_hang; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_tien_do_mua_hang TO anon;
GRANT ALL ON TABLE public.fp_mh_tien_do_mua_hang TO authenticated;


--
-- Name: SEQUENCE fp_mh_tien_do_mua_hang_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_tien_do_mua_hang_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_tien_do_mua_hang_id_seq TO authenticated;


--
-- Name: TABLE fp_mh_ton_kho; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_ton_kho TO anon;
GRANT ALL ON TABLE public.fp_mh_ton_kho TO authenticated;


--
-- Name: TABLE fp_mh_trang_thai_thanh_toan_doi_tac; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_mh_trang_thai_thanh_toan_doi_tac TO anon;
GRANT ALL ON TABLE public.fp_mh_trang_thai_thanh_toan_doi_tac TO authenticated;


--
-- Name: SEQUENCE fp_mh_trang_thai_thanh_toan_doi_tac_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_mh_trang_thai_thanh_toan_doi_tac_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_mh_trang_thai_thanh_toan_doi_tac_id_seq TO authenticated;


--
-- Name: TABLE fp_tc_hang_muc_thu_chi; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_tc_hang_muc_thu_chi TO authenticated;


--
-- Name: SEQUENCE fp_tc_hang_muc_thu_chi_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_tc_hang_muc_thu_chi_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_tc_quy_chi_so_seq; Type: ACL; Schema: public; Owner: -
--

GRANT USAGE ON SEQUENCE public.fp_tc_quy_chi_so_seq TO authenticated;


--
-- Name: TABLE fp_tc_quy_thu_chi; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_tc_quy_thu_chi TO authenticated;


--
-- Name: SEQUENCE fp_tc_quy_thu_chi_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_tc_quy_thu_chi_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_tc_quy_thu_so_seq; Type: ACL; Schema: public; Owner: -
--

GRANT USAGE ON SEQUENCE public.fp_tc_quy_thu_so_seq TO authenticated;


--
-- Name: TABLE fp_ts_chi_phi_tai_san; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_chi_phi_tai_san TO anon;
GRANT ALL ON TABLE public.fp_ts_chi_phi_tai_san TO authenticated;


--
-- Name: SEQUENCE fp_ts_chi_phi_tai_san_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_chi_phi_tai_san_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_chi_phi_tai_san_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_ts_chi_phi_tai_san_ma_phieu_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_chi_phi_tai_san_ma_phieu_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_chi_phi_tai_san_ma_phieu_seq TO authenticated;


--
-- Name: TABLE fp_ts_chi_tiet_khau_hao; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_chi_tiet_khau_hao TO anon;
GRANT ALL ON TABLE public.fp_ts_chi_tiet_khau_hao TO authenticated;


--
-- Name: SEQUENCE fp_ts_chi_tiet_khau_hao_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_chi_tiet_khau_hao_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_chi_tiet_khau_hao_id_seq TO authenticated;


--
-- Name: TABLE fp_ts_dot_kiem_ke_tai_san; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_dot_kiem_ke_tai_san TO anon;
GRANT ALL ON TABLE public.fp_ts_dot_kiem_ke_tai_san TO authenticated;


--
-- Name: TABLE fp_ts_dot_kiem_ke_tai_san_chi_tiet; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet TO anon;
GRANT ALL ON TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet TO authenticated;


--
-- Name: SEQUENCE fp_ts_dot_kiem_ke_tai_san_chi_tiet_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_ts_dot_kiem_ke_tai_san_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_dot_kiem_ke_tai_san_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_dot_kiem_ke_tai_san_id_seq TO authenticated;


--
-- Name: TABLE fp_ts_ky_khau_hao; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_ky_khau_hao TO anon;
GRANT ALL ON TABLE public.fp_ts_ky_khau_hao TO authenticated;


--
-- Name: SEQUENCE fp_ts_ky_khau_hao_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_ky_khau_hao_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_ky_khau_hao_id_seq TO authenticated;


--
-- Name: TABLE fp_ts_loai_chi_phi; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_loai_chi_phi TO anon;
GRANT ALL ON TABLE public.fp_ts_loai_chi_phi TO authenticated;


--
-- Name: SEQUENCE fp_ts_loai_chi_phi_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_loai_chi_phi_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_loai_chi_phi_id_seq TO authenticated;


--
-- Name: TABLE fp_ts_nhom_tai_san; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_nhom_tai_san TO anon;
GRANT ALL ON TABLE public.fp_ts_nhom_tai_san TO authenticated;


--
-- Name: SEQUENCE fp_ts_nhom_tai_san_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_nhom_tai_san_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_nhom_tai_san_id_seq TO authenticated;


--
-- Name: TABLE fp_ts_phieu_cap_phat_thu_hoi; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_phieu_cap_phat_thu_hoi TO anon;
GRANT ALL ON TABLE public.fp_ts_phieu_cap_phat_thu_hoi TO authenticated;


--
-- Name: TABLE fp_ts_phieu_cap_phat_thu_hoi_ct; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_phieu_cap_phat_thu_hoi_ct TO anon;
GRANT ALL ON TABLE public.fp_ts_phieu_cap_phat_thu_hoi_ct TO authenticated;


--
-- Name: SEQUENCE fp_ts_phieu_cap_phat_thu_hoi_ct_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_phieu_cap_phat_thu_hoi_ct_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_phieu_cap_phat_thu_hoi_ct_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_ts_phieu_cap_phat_thu_hoi_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_phieu_cap_phat_thu_hoi_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_phieu_cap_phat_thu_hoi_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_ts_phieu_cpth_seq_cap_phat; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_phieu_cpth_seq_cap_phat TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_phieu_cpth_seq_cap_phat TO authenticated;


--
-- Name: SEQUENCE fp_ts_phieu_cpth_seq_luan_chuyen; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_phieu_cpth_seq_luan_chuyen TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_phieu_cpth_seq_luan_chuyen TO authenticated;


--
-- Name: SEQUENCE fp_ts_phieu_cpth_seq_thu_hoi; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_phieu_cpth_seq_thu_hoi TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_phieu_cpth_seq_thu_hoi TO authenticated;


--
-- Name: TABLE fp_ts_tai_san; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_tai_san TO anon;
GRANT ALL ON TABLE public.fp_ts_tai_san TO authenticated;


--
-- Name: SEQUENCE fp_ts_tai_san_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_tai_san_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_tai_san_id_seq TO authenticated;


--
-- Name: TABLE fp_ts_trang_thai_chi_phi_tai_san; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_trang_thai_chi_phi_tai_san TO anon;
GRANT ALL ON TABLE public.fp_ts_trang_thai_chi_phi_tai_san TO authenticated;


--
-- Name: SEQUENCE fp_ts_trang_thai_chi_phi_tai_san_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_trang_thai_chi_phi_tai_san_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_trang_thai_chi_phi_tai_san_id_seq TO authenticated;


--
-- Name: TABLE fp_ts_trang_thai_tai_san; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_ts_trang_thai_tai_san TO anon;
GRANT ALL ON TABLE public.fp_ts_trang_thai_tai_san TO authenticated;


--
-- Name: SEQUENCE fp_ts_trang_thai_tai_san_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_ts_trang_thai_tai_san_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_ts_trang_thai_tai_san_id_seq TO authenticated;


--
-- Name: TABLE fp_var_cap_bac; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_var_cap_bac TO anon;
GRANT ALL ON TABLE public.fp_var_cap_bac TO authenticated;


--
-- Name: SEQUENCE fp_var_cap_bac_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_var_cap_bac_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_var_cap_bac_id_seq TO authenticated;


--
-- Name: TABLE fp_var_chi_nhanh; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_var_chi_nhanh TO anon;
GRANT ALL ON TABLE public.fp_var_chi_nhanh TO authenticated;


--
-- Name: SEQUENCE fp_var_chi_nhanh_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_var_chi_nhanh_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_var_chi_nhanh_id_seq TO authenticated;


--
-- Name: TABLE fp_var_chuc_vu; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_var_chuc_vu TO anon;
GRANT ALL ON TABLE public.fp_var_chuc_vu TO authenticated;


--
-- Name: SEQUENCE fp_var_chuc_vu_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_var_chuc_vu_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_var_chuc_vu_id_seq TO authenticated;


--
-- Name: TABLE fp_var_nhan_vien; Type: ACL; Schema: public; Owner: -
--

GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.fp_var_nhan_vien TO anon;
GRANT REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(id),INSERT(id),UPDATE(id) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ho_va_ten; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ho_va_ten),INSERT(ho_va_ten),UPDATE(ho_va_ten) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.hinh_anh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(hinh_anh),INSERT(hinh_anh),UPDATE(hinh_anh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.trang_thai; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(trang_thai),INSERT(trang_thai),UPDATE(trang_thai) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.phong_ban_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(phong_ban_id),INSERT(phong_ban_id),UPDATE(phong_ban_id) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ten_phong_ban; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ten_phong_ban),INSERT(ten_phong_ban),UPDATE(ten_phong_ban) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.chuc_vu_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(chuc_vu_id),INSERT(chuc_vu_id),UPDATE(chuc_vu_id) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ten_chuc_vu; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ten_chuc_vu),INSERT(ten_chuc_vu),UPDATE(ten_chuc_vu) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.email; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(email),INSERT(email),UPDATE(email) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.so_dien_thoai; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(so_dien_thoai),INSERT(so_dien_thoai),UPDATE(so_dien_thoai) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.gioi_tinh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(gioi_tinh),INSERT(gioi_tinh),UPDATE(gioi_tinh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ngay_vao_lam; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ngay_vao_lam),INSERT(ngay_vao_lam),UPDATE(ngay_vao_lam) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ngay_sinh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ngay_sinh),INSERT(ngay_sinh),UPDATE(ngay_sinh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.cmnd_cccd; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(cmnd_cccd),INSERT(cmnd_cccd),UPDATE(cmnd_cccd) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ngay_cap_cccd; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ngay_cap_cccd),INSERT(ngay_cap_cccd),UPDATE(ngay_cap_cccd) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.noi_cap_cccd; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(noi_cap_cccd),INSERT(noi_cap_cccd),UPDATE(noi_cap_cccd) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.quoc_tich; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(quoc_tich),INSERT(quoc_tich),UPDATE(quoc_tich) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.dan_toc; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(dan_toc),INSERT(dan_toc),UPDATE(dan_toc) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ton_giao; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ton_giao),INSERT(ton_giao),UPDATE(ton_giao) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.tinh_thanh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(tinh_thanh),INSERT(tinh_thanh),UPDATE(tinh_thanh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.quan_huyen; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(quan_huyen),INSERT(quan_huyen),UPDATE(quan_huyen) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.phuong_xa; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(phuong_xa),INSERT(phuong_xa),UPDATE(phuong_xa) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.dia_chi_cu_the; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(dia_chi_cu_the),INSERT(dia_chi_cu_the),UPDATE(dia_chi_cu_the) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.dia_chi_tam_tru; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(dia_chi_tam_tru),INSERT(dia_chi_tam_tru),UPDATE(dia_chi_tam_tru) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.loai_hop_dong; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(loai_hop_dong),INSERT(loai_hop_dong),UPDATE(loai_hop_dong) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ngay_het_han_hd; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ngay_het_han_hd),INSERT(ngay_het_han_hd),UPDATE(ngay_het_han_hd) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.noi_lam_viec; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(noi_lam_viec),INSERT(noi_lam_viec),UPDATE(noi_lam_viec) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.email_ca_nhan; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(email_ca_nhan),INSERT(email_ca_nhan),UPDATE(email_ca_nhan) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.nguoi_lien_he_khan_cap; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(nguoi_lien_he_khan_cap),INSERT(nguoi_lien_he_khan_cap),UPDATE(nguoi_lien_he_khan_cap) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.sdt_khan_cap; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(sdt_khan_cap),INSERT(sdt_khan_cap),UPDATE(sdt_khan_cap) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.quan_he_khan_cap; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(quan_he_khan_cap),INSERT(quan_he_khan_cap),UPDATE(quan_he_khan_cap) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.tinh_trang_hon_nhan; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(tinh_trang_hon_nhan),INSERT(tinh_trang_hon_nhan),UPDATE(tinh_trang_hon_nhan) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.so_nguoi_phu_thuoc; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(so_nguoi_phu_thuoc),INSERT(so_nguoi_phu_thuoc),UPDATE(so_nguoi_phu_thuoc) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.trinh_do_hoc_van; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(trinh_do_hoc_van),INSERT(trinh_do_hoc_van),UPDATE(trinh_do_hoc_van) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.chuyen_nganh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(chuyen_nganh),INSERT(chuyen_nganh),UPDATE(chuyen_nganh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.truong_hoc; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(truong_hoc),INSERT(truong_hoc),UPDATE(truong_hoc) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.nam_tot_nghiep; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(nam_tot_nghiep),INSERT(nam_tot_nghiep),UPDATE(nam_tot_nghiep) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.chung_chi; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(chung_chi),INSERT(chung_chi),UPDATE(chung_chi) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.so_tai_khoan; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(so_tai_khoan),INSERT(so_tai_khoan),UPDATE(so_tai_khoan) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ten_ngan_hang; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ten_ngan_hang),INSERT(ten_ngan_hang),UPDATE(ten_ngan_hang) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.chi_nhanh_nh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(chi_nhanh_nh),INSERT(chi_nhanh_nh),UPDATE(chi_nhanh_nh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ma_so_thue_ca_nhan; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ma_so_thue_ca_nhan),INSERT(ma_so_thue_ca_nhan),UPDATE(ma_so_thue_ca_nhan) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.so_bhxh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(so_bhxh),INSERT(so_bhxh),UPDATE(so_bhxh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.so_bhyt; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(so_bhyt),INSERT(so_bhyt),UPDATE(so_bhyt) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ngay_tham_gia_bh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ngay_tham_gia_bh),INSERT(ngay_tham_gia_bh),UPDATE(ngay_tham_gia_bh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.noi_dang_ky_kcb; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(noi_dang_ky_kcb),INSERT(noi_dang_ky_kcb),UPDATE(noi_dang_ky_kcb) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.cap_bac_id; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(cap_bac_id),INSERT(cap_bac_id),UPDATE(cap_bac_id) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ten_cap_bac; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ten_cap_bac),INSERT(ten_cap_bac),UPDATE(ten_cap_bac) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.cap_bac; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(cap_bac),INSERT(cap_bac),UPDATE(cap_bac) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.chi_nhanh_ids; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(chi_nhanh_ids),INSERT(chi_nhanh_ids),UPDATE(chi_nhanh_ids) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.ten_chi_nhanh; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(ten_chi_nhanh),INSERT(ten_chi_nhanh),UPDATE(ten_chi_nhanh) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.phai_doi_mat_khau; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(phai_doi_mat_khau) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: COLUMN fp_var_nhan_vien.mat_khau_cap_nhat_luc; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT(mat_khau_cap_nhat_luc) ON TABLE public.fp_var_nhan_vien TO authenticated;


--
-- Name: SEQUENCE fp_var_nhan_vien_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_var_nhan_vien_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_var_nhan_vien_id_seq TO authenticated;


--
-- Name: TABLE fp_var_phan_quyen; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_var_phan_quyen TO anon;
GRANT ALL ON TABLE public.fp_var_phan_quyen TO authenticated;


--
-- Name: SEQUENCE fp_var_phan_quyen_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_var_phan_quyen_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_var_phan_quyen_id_seq TO authenticated;


--
-- Name: TABLE fp_var_phong_ban; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_var_phong_ban TO anon;
GRANT ALL ON TABLE public.fp_var_phong_ban TO authenticated;


--
-- Name: SEQUENCE fp_var_phong_ban_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_var_phong_ban_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_var_phong_ban_id_seq TO authenticated;


--
-- Name: TABLE fp_var_push_subscription; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,DELETE ON TABLE public.fp_var_push_subscription TO authenticated;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_var_push_subscription TO notify_service;


--
-- Name: SEQUENCE fp_var_push_subscription_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_var_push_subscription_id_seq TO notify_service;


--
-- Name: TABLE fp_var_su_kien_thong_bao; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,UPDATE ON TABLE public.fp_var_su_kien_thong_bao TO notify_service;


--
-- Name: TABLE fp_var_thong_bao; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.fp_var_thong_bao TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE public.fp_var_thong_bao TO notify_service;


--
-- Name: COLUMN fp_var_thong_bao.da_doc; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(da_doc) ON TABLE public.fp_var_thong_bao TO authenticated;


--
-- Name: COLUMN fp_var_thong_bao.da_xoa; Type: ACL; Schema: public; Owner: -
--

GRANT UPDATE(da_xoa) ON TABLE public.fp_var_thong_bao TO authenticated;


--
-- Name: TABLE fp_var_thong_bao_cai_dat; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.fp_var_thong_bao_cai_dat TO authenticated;
GRANT SELECT ON TABLE public.fp_var_thong_bao_cai_dat TO notify_service;


--
-- Name: SEQUENCE fp_var_thong_bao_cai_dat_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_var_thong_bao_cai_dat_id_seq TO authenticated;


--
-- Name: SEQUENCE fp_var_thong_bao_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,USAGE ON SEQUENCE public.fp_var_thong_bao_id_seq TO notify_service;


--
-- Name: TABLE fp_var_thong_bao_tuy_chon; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.fp_var_thong_bao_tuy_chon TO authenticated;
GRANT SELECT ON TABLE public.fp_var_thong_bao_tuy_chon TO notify_service;


--
-- Name: TABLE fp_var_tt_cong_ty; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.fp_var_tt_cong_ty TO anon;
GRANT ALL ON TABLE public.fp_var_tt_cong_ty TO authenticated;


--
-- Name: SEQUENCE fp_var_tt_cong_ty_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.fp_var_tt_cong_ty_id_seq TO anon;
GRANT ALL ON SEQUENCE public.fp_var_tt_cong_ty_id_seq TO authenticated;


--
-- Name: TABLE v_don_dat_hang_summary; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_don_dat_hang_summary TO anon;
GRANT ALL ON TABLE public.v_don_dat_hang_summary TO authenticated;


--
-- Name: TABLE v_don_dat_hang_chi_tiet_flat; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_don_dat_hang_chi_tiet_flat TO anon;
GRANT ALL ON TABLE public.v_don_dat_hang_chi_tiet_flat TO authenticated;


--
-- Name: TABLE v_farm_de_xuat_mua_hang_chi_tiet_flat; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.v_farm_de_xuat_mua_hang_chi_tiet_flat TO authenticated;
GRANT SELECT ON TABLE public.v_farm_de_xuat_mua_hang_chi_tiet_flat TO anon;


--
-- Name: TABLE v_farm_de_xuat_mua_hang_summary; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.v_farm_de_xuat_mua_hang_summary TO authenticated;
GRANT SELECT ON TABLE public.v_farm_de_xuat_mua_hang_summary TO anon;


--
-- Name: TABLE v_farm_phieu_kho_phan_thuoc_chi_tiet_flat; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat TO authenticated;
GRANT SELECT ON TABLE public.v_farm_phieu_kho_phan_thuoc_chi_tiet_flat TO anon;


--
-- Name: TABLE v_farm_phieu_kho_phan_thuoc_summary; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_farm_phieu_kho_phan_thuoc_summary TO anon;
GRANT ALL ON TABLE public.v_farm_phieu_kho_phan_thuoc_summary TO authenticated;


--
-- Name: TABLE v_farm_ton_kho_phan_thuoc; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_farm_ton_kho_phan_thuoc TO anon;
GRANT ALL ON TABLE public.v_farm_ton_kho_phan_thuoc TO authenticated;


--
-- Name: TABLE v_hop_dong_summary; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_hop_dong_summary TO anon;
GRANT ALL ON TABLE public.v_hop_dong_summary TO authenticated;


--
-- Name: TABLE v_mh_nxt_movement; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.v_mh_nxt_movement TO authenticated;
GRANT SELECT ON TABLE public.v_mh_nxt_movement TO anon;


--
-- Name: TABLE v_nhan_vien_ref; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_nhan_vien_ref TO anon;
GRANT ALL ON TABLE public.v_nhan_vien_ref TO authenticated;


--
-- Name: TABLE v_phieu_de_xuat_vat_tu_chi_tiet_flat; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_phieu_de_xuat_vat_tu_chi_tiet_flat TO anon;
GRANT ALL ON TABLE public.v_phieu_de_xuat_vat_tu_chi_tiet_flat TO authenticated;


--
-- Name: TABLE v_phieu_de_xuat_vat_tu_summary; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_phieu_de_xuat_vat_tu_summary TO anon;
GRANT ALL ON TABLE public.v_phieu_de_xuat_vat_tu_summary TO authenticated;


--
-- Name: TABLE v_phieu_kho_chi_tiet_flat; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_phieu_kho_chi_tiet_flat TO anon;
GRANT ALL ON TABLE public.v_phieu_kho_chi_tiet_flat TO authenticated;


--
-- Name: TABLE v_phieu_kho_summary; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.v_phieu_kho_summary TO anon;
GRANT ALL ON TABLE public.v_phieu_kho_summary TO authenticated;


--
-- Name: TABLE v_tc_quy_so_du; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.v_tc_quy_so_du TO authenticated;
GRANT SELECT ON TABLE public.v_tc_quy_so_du TO anon;


--
-- Name: TABLE v_tc_quy_thu_chi_summary; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT ON TABLE public.v_tc_quy_thu_chi_summary TO authenticated;
GRANT SELECT ON TABLE public.v_tc_quy_thu_chi_summary TO anon;


--
-- PostgreSQL database dump complete
--

\unrestrict BZDLnDNO6k6qUo4brAUEfS1ZucAji4wI0dSnyf5jc3d6co0qiQ7d5R8r0fJ1lW5

