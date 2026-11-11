-- =============================================================================
-- 076-checklist-bao-duong-du-bao-ksc.sql — phản hồi nhà sơ chế 10/11/2026
--
-- 1) Checklist công đoạn: hạng mục Không đạt sau khi xử lý xong hay bị bấm lại «Đạt» → mất dấu lỗi,
--    văn phòng không biết lỗi gì. Thêm cờ qlx_tung_khong_dat / gs_tung_khong_dat trên dòng phiếu:
--    trigger bật khi cột kết quả = 'khong_dat', KHÔNG BAO GIỜ tự tắt (kể cả khi rpc_cl_chuyen xoá trắng
--    kq_kiem_tra). Quy ước mới: Không đạt giữ nguyên, ghi cách xử lý ở «Tình trạng khắc phục».
--    Backfill cờ từ nhật ký thay đổi (fp_var_nhat_ky_thay_doi).
--
-- 2) Bảo dưỡng thiết bị:
--    a) Khôi phục việc «Vệ sinh béc xịt» (id 1) + 6 nhật ký bị xoá dây chuyền lúc 01:46 UTC 10/11.
--    b) FK nhật ký → việc đổi CASCADE thành RESTRICT: việc đã có nhật ký không xoá được (tắt «Đang dùng»).
--    c) «Cần sửa chữa» không lùi hạn: lan_gan_nhat = ngày làm gần nhất có kết quả KHÁC can_sua_chua.
--       Cột mới kq_gan_nhat = kết quả lần ghi mới nhất → UI gắn cờ đỏ «Cần sửa chữa».
--
-- 3) Dự báo SL đóng thùng: dòng 10 cộng thêm số buồng không sơ chế (KSC = ĐGĐV so_luong_huy) cùng ngày:
--       tong_buong_nhap_thuc_te = max(0, tồn đầu + Tổng thu ĐGĐV + KSC − tồn cuối)
--    KSC lưu kèm ở cột so_buong_ksc. Thay thân 2 hàm của 060; BACKFILL toàn bộ dự báo cũ
--    (giá trị cũ tra ở fp_var_nhat_ky_thay_doi).
--
-- Chạy lại được (IF NOT EXISTS / CREATE OR REPLACE / ON CONFLICT DO NOTHING).
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/076-checklist-bao-duong-du-bao-ksc.sql
-- =============================================================================

BEGIN;

-- 1) Checklist: cờ «từng Không đạt» ---------------------------------------------------
ALTER TABLE public.fp_farm_cl_phieu_dong
  ADD COLUMN IF NOT EXISTS qlx_tung_khong_dat boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gs_tung_khong_dat boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.fp_farm_cl_phieu_dong.qlx_tung_khong_dat IS
  'Khâu làm từng tích Không đạt (trigger bật, không tắt) — giữ dấu lỗi khi sau đó đổi sang Đạt';
COMMENT ON COLUMN public.fp_farm_cl_phieu_dong.gs_tung_khong_dat IS
  'Khâu kiểm tra lại từng tích Không đạt (trigger bật, không tắt; còn giữ sau khi Chuyển lại xoá trắng kq_kiem_tra)';

-- Trigger tính cờ = OLD.cờ OR kết quả mới (người dùng không tự tắt được cờ) nên sẽ đè backfill:
-- gỡ trigger (nếu chạy lại file), backfill, rồi mới tạo trigger.
DROP TRIGGER IF EXISTS trg_cl_dong_tung_khong_dat ON public.fp_farm_cl_phieu_dong;

-- Backfill: dòng nào từng được ghi khong_dat (nhật ký 016) hoặc đang khong_dat.
UPDATE public.fp_farm_cl_phieu_dong d
   SET qlx_tung_khong_dat = true
 WHERE NOT d.qlx_tung_khong_dat
   AND (d.kq_thuc_hien = 'khong_dat'
        OR EXISTS (SELECT 1 FROM public.fp_var_nhat_ky_thay_doi n
                    WHERE n.bang = 'fp_farm_cl_phieu_dong' AND n.ban_ghi_id = d.id::text
                      AND n.du_lieu_moi->>'kq_thuc_hien' = 'khong_dat'));
UPDATE public.fp_farm_cl_phieu_dong d
   SET gs_tung_khong_dat = true
 WHERE NOT d.gs_tung_khong_dat
   AND (d.kq_kiem_tra = 'khong_dat'
        OR EXISTS (SELECT 1 FROM public.fp_var_nhat_ky_thay_doi n
                    WHERE n.bang = 'fp_farm_cl_phieu_dong' AND n.ban_ghi_id = d.id::text
                      AND n.du_lieu_moi->>'kq_kiem_tra' = 'khong_dat'));

CREATE OR REPLACE FUNCTION public.fn_cl_dong_tung_khong_dat() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.qlx_tung_khong_dat := OLD.qlx_tung_khong_dat OR coalesce(NEW.kq_thuc_hien = 'khong_dat', false);
    NEW.gs_tung_khong_dat := OLD.gs_tung_khong_dat OR coalesce(NEW.kq_kiem_tra = 'khong_dat', false);
  ELSE
    NEW.qlx_tung_khong_dat := coalesce(NEW.kq_thuc_hien = 'khong_dat', false);
    NEW.gs_tung_khong_dat := coalesce(NEW.kq_kiem_tra = 'khong_dat', false);
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION public.fn_cl_dong_tung_khong_dat() FROM PUBLIC, anon;
CREATE TRIGGER trg_cl_dong_tung_khong_dat BEFORE INSERT OR UPDATE ON public.fp_farm_cl_phieu_dong
  FOR EACH ROW EXECUTE FUNCTION public.fn_cl_dong_tung_khong_dat();

-- 2) Bảo dưỡng ----------------------------------------------------------------------
ALTER TABLE public.fp_farm_bd_viec ADD COLUMN IF NOT EXISTS kq_gan_nhat text;
COMMENT ON COLUMN public.fp_farm_bd_viec.kq_gan_nhat IS
  'Kết quả lần ghi nhật ký mới nhất (hoan_thanh | can_theo_doi | can_sua_chua) — trigger ghi';
COMMENT ON COLUMN public.fp_farm_bd_viec.lan_gan_nhat IS
  'Ngày làm gần nhất có kết quả khác can_sua_chua (Cần sửa chữa không lùi hạn) — trigger ghi';

-- 2b) FK RESTRICT
ALTER TABLE public.fp_farm_bd_nhat_ky DROP CONSTRAINT IF EXISTS fp_farm_bd_nhat_ky_id_viec_fkey;
ALTER TABLE public.fp_farm_bd_nhat_ky
  ADD CONSTRAINT fp_farm_bd_nhat_ky_id_viec_fkey
  FOREIGN KEY (id_viec) REFERENCES public.fp_farm_bd_viec(id) ON DELETE RESTRICT;

-- 2c) Đồng bộ lan_gan_nhat + kq_gan_nhat
CREATE OR REPLACE FUNCTION public.fn_farm_bd_tinh_lai_viec(p_id_viec bigint) RETURNS void
    LANGUAGE sql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  UPDATE public.fp_farm_bd_viec v
     SET lan_gan_nhat = (SELECT max(nk.ngay_thuc_hien) FROM public.fp_farm_bd_nhat_ky nk
                          WHERE nk.id_viec = p_id_viec AND nk.ket_qua <> 'can_sua_chua'),
         kq_gan_nhat = (SELECT nk.ket_qua FROM public.fp_farm_bd_nhat_ky nk
                         WHERE nk.id_viec = p_id_viec
                         ORDER BY nk.ngay_thuc_hien DESC, nk.tg_tao DESC, nk.id DESC LIMIT 1)
   WHERE v.id = p_id_viec;
$$;
REVOKE ALL ON FUNCTION public.fn_farm_bd_tinh_lai_viec(bigint) FROM PUBLIC, anon;

CREATE OR REPLACE FUNCTION public.fn_farm_bd_dong_bo_lan_gan_nhat() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_id bigint;
BEGIN
  FOR v_id IN
    SELECT DISTINCT x FROM unnest(ARRAY[
      CASE WHEN TG_OP <> 'INSERT' THEN OLD.id_viec END,
      CASE WHEN TG_OP <> 'DELETE' THEN NEW.id_viec END]) AS x
    WHERE x IS NOT NULL
  LOOP
    PERFORM public.fn_farm_bd_tinh_lai_viec(v_id);
  END LOOP;
  RETURN NULL;
END
$$;
REVOKE ALL ON FUNCTION public.fn_farm_bd_dong_bo_lan_gan_nhat() FROM PUBLIC, anon;
DROP TRIGGER IF EXISTS trg_farm_bd_dong_bo_lan_gan_nhat ON public.fp_farm_bd_nhat_ky;
CREATE TRIGGER trg_farm_bd_dong_bo_lan_gan_nhat
  AFTER INSERT OR UPDATE OF ngay_thuc_hien, id_viec, ket_qua OR DELETE ON public.fp_farm_bd_nhat_ky
  FOR EACH ROW EXECUTE FUNCTION public.fn_farm_bd_dong_bo_lan_gan_nhat();

-- 2a) Khôi phục việc 1 + 6 nhật ký từ nhật ký thay đổi (thiết bị 1 còn tồn tại).
INSERT INTO public.fp_farm_bd_viec (id, id_thiet_bi, noi_dung, chu_ky_ngay, han_ke_tiep, lan_gan_nhat, thu_tu,
                                     ghi_chu, dang_dung, tg_tao)
SELECT (o->>'id')::bigint, (o->>'id_thiet_bi')::bigint, o->>'noi_dung', (o->>'chu_ky_ngay')::integer,
       (o->>'han_ke_tiep')::date, (o->>'lan_gan_nhat')::date, (o->>'thu_tu')::integer,
       o->>'ghi_chu', (o->>'dang_dung')::boolean, (o->>'tg_tao')::timestamptz
  FROM (SELECT n.du_lieu_cu AS o FROM public.fp_var_nhat_ky_thay_doi n
         WHERE n.bang = 'fp_farm_bd_viec' AND n.thao_tac = 'xoa' AND n.ban_ghi_id = '1'
         ORDER BY n.thoi_diem DESC LIMIT 1) s
 WHERE EXISTS (SELECT 1 FROM public.fp_farm_bd_thiet_bi t WHERE t.id = (o->>'id_thiet_bi')::bigint)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.fp_farm_bd_nhat_ky (id, id_viec, ngay_thuc_hien, ket_qua, noi_dung, hinh_anh,
                                        id_nguoi_thuc_hien, id_nguoi_tao, tg_tao)
SELECT (o->>'id')::bigint, (o->>'id_viec')::bigint, (o->>'ngay_thuc_hien')::date, o->>'ket_qua', o->>'noi_dung',
       ARRAY(SELECT jsonb_array_elements_text(coalesce(o->'hinh_anh', '[]'::jsonb))),
       (o->>'id_nguoi_thuc_hien')::bigint, (o->>'id_nguoi_tao')::bigint, (o->>'tg_tao')::timestamptz
  FROM public.fp_var_nhat_ky_thay_doi n, LATERAL (SELECT n.du_lieu_cu AS o) s
 WHERE n.bang = 'fp_farm_bd_nhat_ky' AND n.thao_tac = 'xoa'
   AND n.thoi_diem BETWEEN '2026-11-10 01:46:00+00' AND '2026-11-10 01:47:00+00'
   AND EXISTS (SELECT 1 FROM public.fp_farm_bd_viec v WHERE v.id = (o->>'id_viec')::bigint)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.fp_farm_bd_viec', 'id'),
              greatest((SELECT max(id) FROM public.fp_farm_bd_viec), 1));
SELECT setval(pg_get_serial_sequence('public.fp_farm_bd_nhat_ky', 'id'),
              greatest((SELECT max(id) FROM public.fp_farm_bd_nhat_ky), 1));

-- Tính lại mọi việc theo luật mới.
SELECT public.fn_farm_bd_tinh_lai_viec(v.id) FROM public.fp_farm_bd_viec v;

-- 3) Dự báo SL đóng thùng cộng KSC ------------------------------------------------------
ALTER TABLE public.fp_farm_du_bao_sl_dong_thung
  ADD COLUMN IF NOT EXISTS so_buong_ksc integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.so_buong_ksc IS
  'Buồng không sơ chế (ĐGĐV so_luong_huy) cùng ngày + chi nhánh — trigger ghi, không nhập tay (076)';
COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_buong_nhap_thuc_te IS
  'Dòng 10 = max(0, tồn đầu + Tổng thu ĐGĐV + KSC − tồn cuối) — trigger ghi (migration 076)';

CREATE OR REPLACE FUNCTION public.fn_dgdv_trg_du_bao_khoa_so()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thu bigint;
  v_ksc bigint;
  v_dau integer;
  v_cuoi integer;
BEGIN
  SELECT t.tong_thu, t.ksc INTO v_thu, v_ksc FROM public.fn_dgdv_tong_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  SELECT t.ton_dau, t.ton_cuoi INTO v_dau, v_cuoi FROM public.fn_du_bao_ton_ngay(NEW.ngay, NEW.id_chi_nhanh) t;
  NEW.sl_buong_ton_dau_ngay := COALESCE(v_dau, 0);
  NEW.sl_buong_ton_cuoi_ngay := COALESCE(v_cuoi, 0);
  NEW.so_buong_ksc := COALESCE(v_ksc, 0)::integer;
  NEW.tong_buong_nhap_thuc_te :=
    GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) + COALESCE(v_ksc, 0) - COALESCE(v_cuoi, 0))::integer;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_du_bao_dong_bo(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_thu bigint;
  v_ksc integer;
  v_dau integer;
  v_cuoi integer;
  v_nhap integer;
BEGIN
  IF p_ngay IS NULL OR p_id_chi_nhanh IS NULL THEN
    RETURN;
  END IF;

  SELECT t.tong_thu, COALESCE(t.ksc, 0)::integer INTO v_thu, v_ksc
    FROM public.fn_dgdv_tong_ngay(p_ngay, p_id_chi_nhanh) t;
  SELECT t.ton_dau, t.ton_cuoi INTO v_dau, v_cuoi FROM public.fn_du_bao_ton_ngay(p_ngay, p_id_chi_nhanh) t;
  v_ksc := COALESCE(v_ksc, 0);
  v_nhap := GREATEST(0, COALESCE(v_dau, 0) + COALESCE(v_thu, 0) + v_ksc - COALESCE(v_cuoi, 0))::integer;

  UPDATE public.fp_farm_du_bao_sl_dong_thung
     SET tong_buong_nhap_thuc_te = v_nhap,
         sl_buong_ton_dau_ngay = COALESCE(v_dau, 0),
         sl_buong_ton_cuoi_ngay = COALESCE(v_cuoi, 0),
         so_buong_ksc = v_ksc
   WHERE ngay = p_ngay
     AND id_chi_nhanh = p_id_chi_nhanh
     AND (tong_buong_nhap_thuc_te, sl_buong_ton_dau_ngay, sl_buong_ton_cuoi_ngay, so_buong_ksc)
         IS DISTINCT FROM (v_nhap, COALESCE(v_dau, 0), COALESCE(v_cuoi, 0), v_ksc);
END;
$$;

-- BACKFILL + kiểm tra
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_du_bao_sl_dong_thung LOOP
    PERFORM public.fn_du_bao_dong_bo(r.ngay, r.id_chi_nhanh);
  END LOOP;

  IF EXISTS (
       SELECT 1 FROM public.fp_farm_du_bao_sl_dong_thung d
       CROSS JOIN LATERAL public.fn_dgdv_tong_ngay(d.ngay, d.id_chi_nhanh) f
       CROSS JOIN LATERAL public.fn_du_bao_ton_ngay(d.ngay, d.id_chi_nhanh) t
       WHERE (d.tong_buong_nhap_thuc_te, d.so_buong_ksc)
             IS DISTINCT FROM (GREATEST(0, t.ton_dau + f.tong_thu + f.ksc - t.ton_cuoi)::integer, f.ksc::integer)) THEN
    RAISE EXCEPTION 'Dự báo SL đóng thùng lệch công thức tồn đầu + thu hoạch + KSC − tồn cuối sau backfill';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
