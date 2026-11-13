-- =============================================================================
-- 077-bao-duong-theo-farm.sql — Bảo dưỡng thiết bị tách theo farm (chi nhánh)
--
-- Trước đây danh sách thiết bị bảo dưỡng (fp_farm_bd_thiet_bi) dùng chung một bộ cho cả công ty.
-- Mỗi farm có máy móc riêng → thêm id_chi_nhanh vào thiết bị (việc/nhật ký đi theo thiết bị qua FK).
--
--  1) fp_farm_bd_thiet_bi.id_chi_nhanh NOT NULL: dữ liệu hiện có gán hết cho chi nhánh 10 (NSC fp1).
--  2) RPC rpc_bd_sao_chep_thiet_bi(p_tu, p_den): sao chép thiết bị đang dùng + việc đang dùng từ farm này
--     sang farm khác (bỏ qua thiết bị trùng tên ở farm đích; KHÔNG chép lịch sử: lan_gan_nhat, han_ke_tiep,
--     kq_gan_nhat, nhật ký). SECURITY INVOKER → RLS insert vẫn áp quyền «create» của module bảo dưỡng.
--  3) fn_cl_phieu_sau_khi_tao: mẫu checklist liên kết hạng mục ↔ thiết bị qua id_thiet_bi (của farm 10).
--     Khi phiếu thuộc farm khác, tra thiết bị CÙNG TÊN ở farm của phiếu (ưu tiên chính thiết bị đã liên kết
--     nếu cùng farm) để lấy mã TS / số lượng / tần suất bảo dưỡng. Không khớp → NULL.
--
-- RLS giữ nguyên (theo module, không theo chi nhánh): phạm vi farm lọc ở app.
-- Trigger nhật ký thay đổi trên bảng thiết bị đã có từ trước, không thêm.
--
-- Chạy lại được (IF NOT EXISTS / CREATE OR REPLACE).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/077-bao-duong-theo-farm.sql
-- =============================================================================

BEGIN;

-- 1) Cột chi nhánh cho thiết bị ----------------------------------------------------------
ALTER TABLE public.fp_farm_bd_thiet_bi
  ADD COLUMN IF NOT EXISTS id_chi_nhanh bigint REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT;

UPDATE public.fp_farm_bd_thiet_bi SET id_chi_nhanh = 10 WHERE id_chi_nhanh IS NULL;  -- 10 = NSC fp1

ALTER TABLE public.fp_farm_bd_thiet_bi ALTER COLUMN id_chi_nhanh SET NOT NULL;

COMMENT ON COLUMN public.fp_farm_bd_thiet_bi.id_chi_nhanh IS 'Farm (chi nhánh) sở hữu thiết bị; việc bảo dưỡng + nhật ký đi theo thiết bị';

CREATE INDEX IF NOT EXISTS idx_fp_farm_bd_thiet_bi_chi_nhanh
  ON public.fp_farm_bd_thiet_bi (id_chi_nhanh, thu_tu);

-- 2) Sao chép thiết bị + việc sang farm khác ------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_bd_sao_chep_thiet_bi(p_tu bigint, p_den bigint) RETURNS integer
    LANGUAGE plpgsql SECURITY INVOKER
    SET search_path TO 'public'
    AS $$
DECLARE
  r record;
  v_moi bigint;
  v_dem integer := 0;
BEGIN
  IF p_tu IS NULL OR p_den IS NULL THEN
    RAISE EXCEPTION 'Thiếu farm nguồn hoặc farm đích';
  END IF;
  IF p_tu = p_den THEN
    RAISE EXCEPTION 'Farm nguồn và farm đích phải khác nhau';
  END IF;

  FOR r IN
    SELECT t.id, t.ten, t.so_luong, t.khu_vuc, t.ghi_chu, t.thu_tu
      FROM public.fp_farm_bd_thiet_bi t
     WHERE t.id_chi_nhanh = p_tu AND t.dang_dung
     ORDER BY t.thu_tu, t.id
  LOOP
    -- Farm đích đã có thiết bị cùng tên → bỏ qua (chạy lại không nhân đôi).
    IF EXISTS (
      SELECT 1 FROM public.fp_farm_bd_thiet_bi d
       WHERE d.id_chi_nhanh = p_den AND lower(trim(d.ten)) = lower(trim(r.ten))
    ) THEN
      CONTINUE;
    END IF;

    INSERT INTO public.fp_farm_bd_thiet_bi (ten, so_luong, khu_vuc, ghi_chu, thu_tu, dang_dung, id_chi_nhanh)
    VALUES (r.ten, r.so_luong, r.khu_vuc, r.ghi_chu, r.thu_tu, true, p_den)
    RETURNING id INTO v_moi;

    INSERT INTO public.fp_farm_bd_viec (id_thiet_bi, noi_dung, chu_ky_ngay, ghi_chu, thu_tu, dang_dung)
    SELECT v_moi, v.noi_dung, v.chu_ky_ngay, v.ghi_chu, v.thu_tu, true
      FROM public.fp_farm_bd_viec v
     WHERE v.id_thiet_bi = r.id AND v.dang_dung
     ORDER BY v.thu_tu, v.id;

    v_dem := v_dem + 1;
  END LOOP;

  RETURN v_dem;
END
$$;
COMMENT ON FUNCTION public.rpc_bd_sao_chep_thiet_bi(bigint, bigint) IS
  'Sao chép thiết bị + việc bảo dưỡng đang dùng từ farm p_tu sang p_den (bỏ qua trùng tên, không chép lịch sử). Trả số thiết bị đã tạo';
REVOKE ALL ON FUNCTION public.rpc_bd_sao_chep_thiet_bi(bigint, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_bd_sao_chep_thiet_bi(bigint, bigint) TO authenticated;

-- 3) Phiếu checklist: tra thiết bị theo farm của phiếu --------------------------------------
-- Bản gốc: 073. Chỉ thay LEFT JOIN thiết bị (trước: tb.id = hm.id_thiet_bi).
CREATE OR REPLACE FUNCTION public.fn_cl_phieu_sau_khi_tao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.fp_farm_cl_phieu_dong
    (id_phieu, id_hang_muc, ten_muc, thu_tu_muc, stt, doi_tuong, tieu_chuan, phuong_phap,
     quan_trong, ma_ts, so_luong, tan_suat_bao_duong)
  SELECT NEW.id, hm.id, mm.ten, coalesce(mm.thu_tu, 0),
         row_number() OVER (ORDER BY coalesce(mm.thu_tu, 0), mm.id NULLS FIRST, hm.thu_tu, hm.id)::int,
         hm.doi_tuong, hm.tieu_chuan, hm.phuong_phap, hm.quan_trong,
         tb.ma_ts, tb.so_luong,
         (SELECT string_agg(v.noi_dung || coalesce(' (' || v.chu_ky_ngay || ' ngày)', ''), '; ' ORDER BY v.thu_tu, v.id)
            FROM public.fp_farm_bd_viec v WHERE v.id_thiet_bi = tb.id AND v.dang_dung)
    FROM public.fp_farm_cl_mau_hang_muc hm
    LEFT JOIN public.fp_farm_cl_mau_muc mm ON mm.id = hm.id_muc
    LEFT JOIN LATERAL (
      SELECT t2.* FROM public.fp_farm_bd_thiet_bi t0
        JOIN public.fp_farm_bd_thiet_bi t2 ON lower(trim(t2.ten)) = lower(trim(t0.ten))
       WHERE t0.id = hm.id_thiet_bi
         -- Phiếu không ghi farm → giữ đúng thiết bị đã liên kết (như bản 073).
         AND (t2.id_chi_nhanh = NEW.id_chi_nhanh OR (NEW.id_chi_nhanh IS NULL AND t2.id = t0.id))
         -- Thiết bị ngừng dùng chỉ lấy khi chính là thiết bị đã liên kết (như bản 073).
         AND (t2.dang_dung OR t2.id = t0.id)
       ORDER BY (t2.id = t0.id) DESC, t2.thu_tu, t2.id
       LIMIT 1
    ) tb ON true
   WHERE hm.id_mau = NEW.id_mau AND hm.dang_dung;

  INSERT INTO public.fp_farm_cl_phieu_lich_su (id_phieu, hanh_dong, den_trang_thai, id_nguoi, ten_nguoi)
  SELECT NEW.id, 'tao', NEW.trang_thai, nv.id, nv.ho_va_ten
    FROM (SELECT public.nhan_vien_hien_tai_id() AS id) x
    LEFT JOIN public.fp_var_nhan_vien nv ON nv.id = x.id;
  RETURN NULL;
END
$$;
REVOKE ALL ON FUNCTION public.fn_cl_phieu_sau_khi_tao() FROM PUBLIC, anon;

COMMIT;

NOTIFY pgrst, 'reload schema';
