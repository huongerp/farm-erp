-- =============================================================================
-- Kiểm kê kho phân thuốc: điều chỉnh sổ (tồn hệ thống) về khớp SL thực tế
-- Quy tắc (delta = thực tế − sổ trên dòng kiểm kê):
--   Thừa  (delta > 0): phiếu NHẬP (FNK-…) — tăng tồn sổ cho khớp thực tế
--   Thiếu (delta < 0): phiếu XUẤT (FXK-…) — giảm tồn sổ cho khớp thực tế
-- Phiếu sinh ra ở trạng thái 'Đã duyệt' nên có hiệu lực ngay trên
-- v_farm_ton_kho_phan_thuoc (view tính mọi phiếu trang_thai <> 'Không duyệt').
--
-- Chạy sau: docs/supabase-fp_farm_dot_kiem_ke_pt.sql
--           docs/supabase-fp_farm_phieu_kho_phan_thuoc.sql  (cần get_next_so_phieu_farm_pt)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Điều chỉnh MỘT dòng chi tiết → 1 phiếu kho (1 dòng chi tiết phiếu)
-- p_nguoi_tao_id: fp_var_nhan_vien.id (nullable)
-- Trả về: id phiếu kho vừa tạo
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(
  p_id_chi_tiet bigint,
  p_nguoi_tao_id bigint DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(bigint, bigint) IS
  'Kiểm kê phân thuốc, một dòng lệch: thừa (TT>sổ) → nhập, thiếu (TT<sổ) → xuất; cập nhật id_phieu_kho_dieu_chinh';

-- -----------------------------------------------------------------------------
-- Điều chỉnh TOÀN ĐỢT: gộp theo (kho, loại phiếu), tối đa 2 phiếu/kho (NK + XK)
-- Trả về: số dòng chi tiết đã cập nhật
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(
  p_id_dot bigint,
  p_nguoi_tao_id bigint DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(bigint, bigint) IS
  'Kiểm kê phân thuốc, toàn đợt: gộp theo kho + loại — thừa nhập, thiếu xuất; trả về số dòng đã cập nhật';

-- -----------------------------------------------------------------------------
-- Xoá phiếu điều chỉnh → dòng chi tiết quay lại trạng thái "chưa điều chỉnh".
-- FK đã ON DELETE SET NULL, nhưng hai cột kia phải tự dọn, nếu không dòng sẽ hiện
-- "đã điều chỉnh" mà không có phiếu nào đứng sau.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

DROP TRIGGER IF EXISTS tr_fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke
  ON public.fp_farm_phieu_kho_phan_thuoc;
CREATE TRIGGER tr_fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke
  BEFORE DELETE ON public.fp_farm_phieu_kho_phan_thuoc
  FOR EACH ROW EXECUTE FUNCTION public.fp_farm_phieu_kho_pt_before_delete_clear_kiem_ke();

GRANT EXECUTE ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_chi_tiet(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.farm_kiem_ke_pt_apply_dieu_chinh_dot(bigint, bigint) TO authenticated;
