-- =============================================================================
-- 037-kiem-ke-so-theo-ngay.sql — Kiểm kê: SL sổ và phiếu điều chỉnh theo NGÀY BẮT ĐẦU của đợt
--
-- Trước đây SL sổ là tồn HIỆN TẠI lúc bấm "Tạo danh sách" / "Thêm dòng", còn phiếu điều chỉnh
-- tồn ghi ngày = ngay_ket_thuc → đợt kiểm kê lùi ngày (vd đếm 03/10, tạo phiếu 11/10) lấy sai sổ.
-- Nay: SL sổ = tồn cuối ngày ngay_bat_dau (app tính, xem kiem-ke-pt-db.service.ts /
-- kiem-ke-kho-db.service.ts), và phiếu điều chỉnh ghi cùng ngày đó → xem Tồn kho ngày bắt đầu
-- ra đúng số thực tế đã đếm.
--
-- 1. Sáu RPC điều chỉnh (Sơ chế / Phân thuốc / Kho vận × một dòng / toàn đợt): thân hàm giữ
--    nguyên bản đang chạy trên VPS, chỉ đổi d.ngay_ket_thuc → d.ngay_bat_dau.
-- 2. rpc_mh_ton_kho_den_ngay: tồn kho vận (kho × hàng) cuối ngày p_den — cùng luật view
--    fp_mh_ton_kho. Sơ chế / Phân thuốc dùng lại rpc_*_ton_kho_*_theo_ky(NULL, p_den) (027, 029).
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-037
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/037-kiem-ke-so-theo-ngay.sql
-- =============================================================================

BEGIN;

-- 1.1. farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    d.ngay_bat_dau::date
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
$function$
;

-- 1.2. farm_kiem_ke_pt_apply_dieu_chinh_dot -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT d.trang_thai, d.ma_dot, d.ngay_bat_dau::date
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
$function$
;

-- 1.3. pt_kiem_ke_apply_dieu_chinh_chi_tiet -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pt_kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    d.ngay_bat_dau::date
  INTO
    v_id_kho,
    v_id_hh,
    v_so_so,
    v_so_tt,
    v_id_phieu_old,
    v_dot_tt,
    v_ma_dot,
    v_ngay
  FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
  JOIN public.fp_pt_dot_kiem_ke d ON d.id = ct.id_dot_kiem_ke_pt
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
    FROM public.fp_pt_danh_sach_hang_hoa h WHERE h.id = v_id_hh;

  IF p_nguoi_tao_id IS NOT NULL THEN
    SELECT n.ho_va_ten INTO v_ten_nv FROM public.fp_var_nhan_vien n WHERE n.id = p_nguoi_tao_id;
  END IF;

  v_so_phieu := get_next_so_phieu_pt_phieu_kho(v_loai);

  INSERT INTO public.fp_pt_phieu_kho (
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

  INSERT INTO public.fp_pt_phieu_kho_chi_tiet (
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

  UPDATE public.fp_pt_dot_kiem_ke_chi_tiet
  SET
    id_phieu_kho_dieu_chinh = v_id_phieu,
    so_luong_dieu_chinh = abs(v_delta),
    tg_dieu_chinh_ton = now()
  WHERE id = p_id_chi_tiet;

  RETURN v_id_phieu;
END;
$function$
;

-- 1.4. pt_kiem_ke_apply_dieu_chinh_dot -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pt_kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT d.trang_thai, d.ma_dot, d.ngay_bat_dau::date
  INTO v_dot_tt, v_ma_dot, v_ngay
  FROM public.fp_pt_dot_kiem_ke d
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
  FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
  WHERE ct.id_dot_kiem_ke_pt = p_id_dot
    AND ct.id_phieu_kho_dieu_chinh IS NULL
    AND ct.so_luong_thuc_te IS NOT NULL
    AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  FOR UPDATE OF ct;

  FOR rec_grp IN
    SELECT DISTINCT
      ct.id_kho,
      CASE WHEN (ct.so_luong_thuc_te - ct.so_luong_so) > 0 THEN 'nhập'::text ELSE 'xuất'::text END AS loai
    FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
    WHERE ct.id_dot_kiem_ke_pt = p_id_dot
      AND ct.id_phieu_kho_dieu_chinh IS NULL
      AND ct.so_luong_thuc_te IS NOT NULL
      AND (ct.so_luong_thuc_te - ct.so_luong_so) <> 0
  LOOP
    SELECT k.ten_kho INTO v_ten_kho FROM public.fp_mh_danh_sach_kho k WHERE k.id = rec_grp.id_kho;

    v_so_phieu := get_next_so_phieu_pt_phieu_kho(rec_grp.loai);

    INSERT INTO public.fp_pt_phieu_kho (
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
      FROM public.fp_pt_dot_kiem_ke_chi_tiet ct
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
        FROM public.fp_pt_danh_sach_hang_hoa h WHERE h.id = line_rec.id_hang_hoa;

      INSERT INTO public.fp_pt_phieu_kho_chi_tiet (
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

      UPDATE public.fp_pt_dot_kiem_ke_chi_tiet
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
$function$
;

-- 1.5. kiem_ke_apply_dieu_chinh_chi_tiet -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kiem_ke_apply_dieu_chinh_chi_tiet(p_id_chi_tiet bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    d.ngay_bat_dau::date
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
$function$
;

-- 1.6. kiem_ke_apply_dieu_chinh_dot -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.kiem_ke_apply_dieu_chinh_dot(p_id_dot bigint, p_nguoi_tao_id bigint DEFAULT NULL::bigint)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  SELECT d.trang_thai, d.ma_dot, d.ngay_bat_dau::date
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
$function$
;

REVOKE ALL ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(bigint, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(bigint, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_chi_tiet(bigint, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_dot(bigint, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kiem_ke_apply_dieu_chinh_chi_tiet(bigint, bigint) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.kiem_ke_apply_dieu_chinh_dot(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_chi_tiet(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pt_kiem_ke_apply_dieu_chinh_dot(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kiem_ke_apply_dieu_chinh_chi_tiet(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kiem_ke_apply_dieu_chinh_dot(bigint, bigint) TO authenticated;

-- 2. Tồn kho vận cuối ngày ----------------------------------------------------
-- Luật biến động = view fp_mh_ton_kho: bỏ phiếu 'Không duyệt'; nhập +kho_id, xuất −kho_id,
-- chuyển (có kho_den_id) −kho_id +kho_den_id; thêm điều kiện ngay <= p_den.
-- p_kho_ids NULL = mọi kho. SECURITY INVOKER: RLS của phiếu kho vẫn áp như view.
CREATE OR REPLACE FUNCTION public.rpc_mh_ton_kho_den_ngay(
    p_den date,
    p_kho_ids bigint[] DEFAULT NULL
)
    RETURNS TABLE (id_kho bigint, id_hang_hoa bigint, so_luong numeric)
    LANGUAGE sql STABLE
    SET search_path TO 'public'
AS $$
    WITH phieu AS (
        SELECT pk.id, pk.loai, pk.kho_id, pk.kho_den_id
        FROM fp_mh_phieu_kho pk
        WHERE pk.trang_thai <> 'Không duyệt'
          AND pk.ngay <= p_den
          AND (pk.loai <> 'chuyển' OR pk.kho_den_id IS NOT NULL)
    ),
    mv AS (
        SELECT p.kho_id AS id_kho, ct.id_hang_hoa,
               CASE WHEN p.loai = 'nhập' THEN ct.so_luong ELSE -ct.so_luong END AS delta
        FROM phieu p
        JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
        UNION ALL
        SELECT p.kho_den_id, ct.id_hang_hoa, ct.so_luong
        FROM phieu p
        JOIN fp_mh_phieu_kho_chi_tiet ct ON ct.id_phieu_kho = p.id
        WHERE p.loai = 'chuyển'
    )
    SELECT mv.id_kho, mv.id_hang_hoa, sum(mv.delta)::numeric(18,4)
    FROM mv
    WHERE p_kho_ids IS NULL OR mv.id_kho = ANY (p_kho_ids)
    GROUP BY mv.id_kho, mv.id_hang_hoa
$$;

COMMENT ON FUNCTION public.rpc_mh_ton_kho_den_ngay(date, bigint[]) IS
  'Tồn kho vận (kho × hàng) cuối ngày p_den, cùng luật view fp_mh_ton_kho — SL sổ của đợt kiểm kê kho';

REVOKE ALL ON FUNCTION public.rpc_mh_ton_kho_den_ngay(date, bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_mh_ton_kho_den_ngay(date, bigint[]) TO authenticated;

-- 3. Ghi chú cột ----------------------------------------------------------------
COMMENT ON COLUMN public.fp_farm_dot_kiem_ke_pt_chi_tiet.so_luong_so IS
  'Số lượng sổ — tồn cuối ngày ngay_bat_dau của đợt (người tạo đợt / cấp cao sửa tay được)';
COMMENT ON COLUMN public.fp_pt_dot_kiem_ke_chi_tiet.so_luong_so IS
  'Số lượng sổ — tồn cuối ngày ngay_bat_dau của đợt (người tạo đợt / cấp cao sửa tay được)';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_so IS
  'Số lượng sổ — tồn cuối ngày ngay_bat_dau của đợt (người tạo đợt / cấp cao sửa tay được)';

COMMIT;

NOTIFY pgrst, 'reload schema';
