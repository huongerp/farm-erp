-- =============================================================================
-- 072-gscl-dong-bo-loi-qc-bcsc.sql — Quản lý nhà sơ chế > Giám sát chất lượng
-- Đưa «Đánh giá lỗi QC (%)» của Báo cáo sơ chế về số TỰ ĐỘNG lấy từ Giám sát chất lượng.
--
-- Nguồn → đích (cùng ngày + chi nhánh):
--   fp_farm_giam_sat_chat_luong      (phiếu, bỏ trang_thai = 'huy')
--   fp_farm_giam_sat_chat_luong_ct   (thùng c.da_kiem = true, c.tong_nhanh > 0)
--   → fp_farm_bao_cao_so_che_ct.ma_chi_tieu = 'danh_gia_loi_qc_pct'
--     = round(100 × Σ số lỗi / Σ tổng nhánh, 2); không có thùng nào thoả → 0.
--   Số lỗi một thùng = Σ (ket_qua -> ma) của các tiêu chí loai = 'dem_loi' trong
--   jsonb `tieu_chi` của phiếu (ô không phải số → 0). Cùng ý với
--   features/quan-ly-nha-so-che/giam-sat-chat-luong/core/ti-le.ts (tiLeLoi),
--   nhưng cộng dồn toàn bộ thùng đã kiểm của ngày.
--
-- Ô đích bị trigger BEFORE ghi đè mỗi lần INSERT/UPDATE → nhập tay không có tác dụng;
-- không có phiếu = 0. Đồng bộ ghi cả báo cáo đích đã khoá (khoá trạng thái nằm ở tầng app).
-- Thiếu dòng chỉ tiêu thì tự tạo (đvt '%', thu_tu 6 — đúng như app đang ghi ở
-- ctRowsFromForm của Báo cáo sơ chế).
--
-- !!! Cuối file có BACKFILL ghi đè TOÀN BỘ dữ liệu cũ của ô đích (về 0 khi chưa có
--     phiếu GSCL), kể cả báo cáo đã khoá. Giá trị cũ vẫn tra / khôi phục được ở
--     fp_var_nhat_ky_thay_doi (trigger nhật ký 016 ghi cột cũ / mới) và bản backup.
--
-- Chạy lại được nhiều lần (CREATE OR REPLACE / DROP TRIGGER IF EXISTS trước CREATE TRIGGER).
-- Trước khi chạy: bash scripts/db-backup.sh truoc-072
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/072-gscl-dong-bo-loi-qc-bcsc.sql
-- =============================================================================

BEGIN;

-- 1) Tỉ lệ lỗi QC (%) của một ngày + chi nhánh --------------------------------
-- Chỉ tính phiếu chưa huỷ; thùng đã kiểm và có tổng nhánh hợp lệ. Ô kết quả không
-- phải JSON number (trống / true / chuỗi) → 0 lỗi, đúng như app coi ô trống = 0.
CREATE OR REPLACE FUNCTION public.fn_gscl_ti_le_loi_ngay(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS numeric
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH thung AS (
    SELECT c.ket_qua, c.tong_nhanh, p.tieu_chi
      FROM public.fp_farm_giam_sat_chat_luong p
      JOIN public.fp_farm_giam_sat_chat_luong_ct c ON c.id_phieu = p.id
     WHERE p.ngay = p_ngay
       AND p.id_chi_nhanh = p_id_chi_nhanh
       AND p.trang_thai <> 'huy'
       AND c.da_kiem
       AND c.tong_nhanh > 0
  ),
  tong AS (
    SELECT COALESCE(SUM(x.tong_nhanh), 0)::numeric AS tong_nhanh,
           COALESCE(SUM(x.loi), 0)::numeric AS tong_loi
      FROM (
        SELECT t.tong_nhanh,
               (SELECT COALESCE(SUM(
                         CASE WHEN jsonb_typeof(t.ket_qua -> (e ->> 'ma')) = 'number'
                              THEN (t.ket_qua -> (e ->> 'ma'))::numeric
                              ELSE 0 END), 0)
                  FROM jsonb_array_elements(
                         CASE WHEN jsonb_typeof(t.tieu_chi) = 'array' THEN t.tieu_chi ELSE '[]'::jsonb END) e
                 WHERE e ->> 'loai' = 'dem_loi') AS loi
          FROM thung t
      ) x
  )
  SELECT CASE WHEN tong_nhanh > 0 THEN round(100 * tong_loi / tong_nhanh, 2) ELSE 0 END
    FROM tong;
$$;

COMMENT ON FUNCTION public.fn_gscl_ti_le_loi_ngay(date, bigint) IS
  'Giám sát chất lượng: % nải lỗi QC của ngày + chi nhánh = round(100 × Σ lỗi / Σ tổng nhánh, 2) của các thùng đã kiểm (phiếu chưa huỷ); không có thùng → 0';

REVOKE ALL ON FUNCTION public.fn_gscl_ti_le_loi_ngay(date, bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_gscl_ti_le_loi_ngay(date, bigint) TO authenticated;

-- 2) Đồng bộ sang Báo cáo sơ chế -----------------------------------------------
-- Với mọi báo cáo cùng (ngày, chi nhánh): cập nhật dòng chỉ tiêu, thiếu thì tạo
-- (thu_tu 6 khớp SO_LIEU_BUONG_ROW_DEFS ở app). Hàm chỉ ghi vào bảng ct nên không
-- quay vòng trigger nguồn.
CREATE OR REPLACE FUNCTION public.fn_gscl_dong_bo_bcsc(p_ngay date, p_id_chi_nhanh bigint)
    RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ti_le numeric;
BEGIN
  IF p_ngay IS NULL OR p_id_chi_nhanh IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.fp_farm_bao_cao_so_che
     WHERE ngay = p_ngay AND id_chi_nhanh = p_id_chi_nhanh) THEN
    RETURN;
  END IF;

  v_ti_le := public.fn_gscl_ti_le_loi_ngay(p_ngay, p_id_chi_nhanh);

  UPDATE public.fp_farm_bao_cao_so_che_ct ct
     SET gia_tri = v_ti_le
    FROM public.fp_farm_bao_cao_so_che b
   WHERE b.id = ct.id_bao_cao
     AND b.ngay = p_ngay
     AND b.id_chi_nhanh = p_id_chi_nhanh
     AND ct.ma_chi_tieu = 'danh_gia_loi_qc_pct'
     AND ct.gia_tri IS DISTINCT FROM v_ti_le;

  INSERT INTO public.fp_farm_bao_cao_so_che_ct (id_bao_cao, ma_chi_tieu, gia_tri, don_vi_tinh, thu_tu)
  SELECT b.id, 'danh_gia_loi_qc_pct', v_ti_le, '%', 6
    FROM public.fp_farm_bao_cao_so_che b
   WHERE b.ngay = p_ngay
     AND b.id_chi_nhanh = p_id_chi_nhanh
     AND NOT EXISTS (
       SELECT 1 FROM public.fp_farm_bao_cao_so_che_ct ct
        WHERE ct.id_bao_cao = b.id AND ct.ma_chi_tieu = 'danh_gia_loi_qc_pct');
END;
$$;

-- Hàm nội bộ (chỉ trigger gọi, chạy với quyền chủ hàm) → không cấp cho ai.
REVOKE ALL ON FUNCTION public.fn_gscl_dong_bo_bcsc(date, bigint) FROM PUBLIC, anon, authenticated;

-- 3) Khoá số ở fp_farm_bao_cao_so_che_ct ---------------------------------------
-- Mọi giá trị app gửi lên cho 'danh_gia_loi_qc_pct' bị bỏ. App lưu bằng cách xoá hết
-- dòng chỉ tiêu rồi chèn lại (ctRowsFromForm), và trigger 5) có thể đã tạo sẵn dòng này
-- → INSERT trùng (id_bao_cao, ma_chi_tieu) được đổi thành cập nhật ghi chú / ĐVT / thứ tự
-- lên dòng sẵn có rồi bỏ qua bản ghi chèn (RETURN NULL), thay vì lỗi UNIQUE.
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_bcsc_ct_khoa_so()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ngay date;
  v_cn bigint;
  v_ti_le numeric := 0;
BEGIN
  IF NEW.ma_chi_tieu <> 'danh_gia_loi_qc_pct' THEN
    RETURN NEW;
  END IF;

  SELECT b.ngay, b.id_chi_nhanh INTO v_ngay, v_cn
    FROM public.fp_farm_bao_cao_so_che b
   WHERE b.id = NEW.id_bao_cao;
  IF v_ngay IS NOT NULL THEN
    v_ti_le := public.fn_gscl_ti_le_loi_ngay(v_ngay, v_cn);
  END IF;
  NEW.gia_tri := v_ti_le;

  IF TG_OP = 'INSERT' AND EXISTS (
       SELECT 1 FROM public.fp_farm_bao_cao_so_che_ct ct
        WHERE ct.id_bao_cao = NEW.id_bao_cao AND ct.ma_chi_tieu = NEW.ma_chi_tieu) THEN
    UPDATE public.fp_farm_bao_cao_so_che_ct ct
       SET don_vi_tinh = NEW.don_vi_tinh,
           ghi_chu = NEW.ghi_chu,
           thu_tu = NEW.thu_tu,
           gia_tri = NEW.gia_tri
     WHERE ct.id_bao_cao = NEW.id_bao_cao AND ct.ma_chi_tieu = NEW.ma_chi_tieu;
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 4) Báo cáo sơ chế mới / đổi ngày, chi nhánh → tạo hoặc tính lại dòng chỉ tiêu.
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_bcsc_dong_bo()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_gscl_dong_bo_bcsc(NEW.ngay, NEW.id_chi_nhanh);
  RETURN NULL;
END;
$$;

-- 5) Dòng chỉ tiêu bị xoá lẻ (app xoá hết rồi chèn lại khi sửa phiếu) → tạo lại ngay.
--    Xoá cả phiếu (cascade) thì phiếu cha đã mất → bỏ qua.
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_bcsc_ct_tao_lai()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_gscl_dong_bo_bcsc(b.ngay, b.id_chi_nhanh)
  FROM public.fp_farm_bao_cao_so_che b
  WHERE b.id IN (
    SELECT DISTINCT o.id_bao_cao FROM old_rows o
     WHERE o.ma_chi_tieu = 'danh_gia_loi_qc_pct');
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_gscl_trg_bcsc_ct_khoa_so() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_gscl_trg_bcsc_dong_bo() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_gscl_trg_bcsc_ct_tao_lai() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_gscl_khoa_so ON public.fp_farm_bao_cao_so_che_ct;
CREATE TRIGGER trg_gscl_khoa_so BEFORE INSERT OR UPDATE ON public.fp_farm_bao_cao_so_che_ct
  FOR EACH ROW EXECUTE FUNCTION public.fn_gscl_trg_bcsc_ct_khoa_so();

DROP TRIGGER IF EXISTS trg_gscl_bcsc_tao_lai ON public.fp_farm_bao_cao_so_che_ct;
CREATE TRIGGER trg_gscl_bcsc_tao_lai AFTER DELETE ON public.fp_farm_bao_cao_so_che_ct
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_gscl_trg_bcsc_ct_tao_lai();

DROP TRIGGER IF EXISTS trg_gscl_bcsc_dong_bo ON public.fp_farm_bao_cao_so_che;
CREATE TRIGGER trg_gscl_bcsc_dong_bo AFTER INSERT OR UPDATE OF ngay, id_chi_nhanh ON public.fp_farm_bao_cao_so_che
  FOR EACH ROW EXECUTE FUNCTION public.fn_gscl_trg_bcsc_dong_bo();

-- 6) Trigger nguồn: thay đổi trên phiếu Giám sát chất lượng → đồng bộ --------
-- Mức câu lệnh + bảng chuyển tiếp (transition table): lưu cả lưới một lần chỉ đồng bộ
-- mỗi cặp (ngày, chi nhánh) một lần. Postgres không cho một trigger có transition table
-- bắt nhiều sự kiện → mỗi bảng 3 trigger (INSERT / UPDATE / DELETE) dùng chung một hàm.
-- Ca cascade (xoá phiếu): trigger bảng con chạy lúc phiếu cha đã mất, JOIN rỗng → bỏ qua;
-- trigger DELETE của phiếu cha (sau cascade) đồng bộ cặp cũ về 0.

-- 6a) Thùng mẫu: INSERT / UPDATE / DELETE → đồng bộ theo (ngày, chi nhánh) của phiếu cha.
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_dong_bo_thung()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.fn_gscl_dong_bo_bcsc(x.ngay, x.id_chi_nhanh)
    FROM (SELECT DISTINCT p.ngay, p.id_chi_nhanh
            FROM new_rows r
            JOIN public.fp_farm_giam_sat_chat_luong p ON p.id = r.id_phieu) x;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.fn_gscl_dong_bo_bcsc(x.ngay, x.id_chi_nhanh)
    FROM (SELECT p.ngay, p.id_chi_nhanh
            FROM new_rows r
            JOIN public.fp_farm_giam_sat_chat_luong p ON p.id = r.id_phieu
          UNION
          SELECT p.ngay, p.id_chi_nhanh
            FROM old_rows r
            JOIN public.fp_farm_giam_sat_chat_luong p ON p.id = r.id_phieu) x;
  ELSE
    PERFORM public.fn_gscl_dong_bo_bcsc(x.ngay, x.id_chi_nhanh)
    FROM (SELECT DISTINCT p.ngay, p.id_chi_nhanh
            FROM old_rows r
            JOIN public.fp_farm_giam_sat_chat_luong p ON p.id = r.id_phieu) x;
  END IF;
  RETURN NULL;
END;
$$;

-- 6b) Phiếu: đổi ngày / chi nhánh / trạng thái / bộ tiêu chí → đồng bộ cặp cũ và cặp mới
--     (cặp giống nhau thì gọi 1 lần).
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_phieu_sua()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF (NEW.ngay, NEW.id_chi_nhanh) IS NOT DISTINCT FROM (OLD.ngay, OLD.id_chi_nhanh) THEN
    PERFORM public.fn_gscl_dong_bo_bcsc(NEW.ngay, NEW.id_chi_nhanh);
  ELSE
    PERFORM public.fn_gscl_dong_bo_bcsc(OLD.ngay, OLD.id_chi_nhanh);
    PERFORM public.fn_gscl_dong_bo_bcsc(NEW.ngay, NEW.id_chi_nhanh);
  END IF;
  RETURN NULL;
END;
$$;

-- 6c) Phiếu: xoá → đồng bộ cặp cũ (AFTER DELETE, các thùng đã cascade).
CREATE OR REPLACE FUNCTION public.fn_gscl_trg_phieu_xoa()
    RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.fn_gscl_dong_bo_bcsc(OLD.ngay, OLD.id_chi_nhanh);
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_gscl_trg_dong_bo_thung() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_gscl_trg_phieu_sua() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_gscl_trg_phieu_xoa() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_gscl_dong_bo_ins ON public.fp_farm_giam_sat_chat_luong_ct;
CREATE TRIGGER trg_gscl_dong_bo_ins AFTER INSERT ON public.fp_farm_giam_sat_chat_luong_ct
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_gscl_trg_dong_bo_thung();

DROP TRIGGER IF EXISTS trg_gscl_dong_bo_upd ON public.fp_farm_giam_sat_chat_luong_ct;
CREATE TRIGGER trg_gscl_dong_bo_upd AFTER UPDATE ON public.fp_farm_giam_sat_chat_luong_ct
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_gscl_trg_dong_bo_thung();

DROP TRIGGER IF EXISTS trg_gscl_dong_bo_del ON public.fp_farm_giam_sat_chat_luong_ct;
CREATE TRIGGER trg_gscl_dong_bo_del AFTER DELETE ON public.fp_farm_giam_sat_chat_luong_ct
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.fn_gscl_trg_dong_bo_thung();

DROP TRIGGER IF EXISTS trg_gscl_phieu_sua ON public.fp_farm_giam_sat_chat_luong;
CREATE TRIGGER trg_gscl_phieu_sua AFTER UPDATE OF ngay, id_chi_nhanh, trang_thai, tieu_chi
  ON public.fp_farm_giam_sat_chat_luong
  FOR EACH ROW EXECUTE FUNCTION public.fn_gscl_trg_phieu_sua();

DROP TRIGGER IF EXISTS trg_gscl_phieu_xoa ON public.fp_farm_giam_sat_chat_luong;
CREATE TRIGGER trg_gscl_phieu_xoa AFTER DELETE ON public.fp_farm_giam_sat_chat_luong
  FOR EACH ROW EXECUTE FUNCTION public.fn_gscl_trg_phieu_xoa();

-- 7) BACKFILL: ghi đè TOÀN BỘ dữ liệu cũ của ô đích theo Giám sát chất lượng ---
-- (0 khi chưa có thùng nào đã kiểm) — mọi báo cáo, kể cả đã khoá.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT ngay, id_chi_nhanh FROM public.fp_farm_bao_cao_so_che LOOP
    PERFORM public.fn_gscl_dong_bo_bcsc(r.ngay, r.id_chi_nhanh);
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- KIỂM TRA SAU KHI CHẠY (chạy tay bằng scripts/db-sql.sh -c "...")
-- =============================================================================
-- 1) Báo cáo sơ chế lệch tỉ lệ lỗi QC (kỳ vọng 0 dòng):
--    SELECT b.id, b.ngay, b.id_chi_nhanh, ct.gia_tri, fn_gscl_ti_le_loi_ngay(b.ngay, b.id_chi_nhanh) AS tinh_lai
--    FROM fp_farm_bao_cao_so_che b
--    JOIN fp_farm_bao_cao_so_che_ct ct ON ct.id_bao_cao = b.id
--      AND ct.ma_chi_tieu = 'danh_gia_loi_qc_pct'
--    WHERE ct.gia_tri <> fn_gscl_ti_le_loi_ngay(b.ngay, b.id_chi_nhanh);
--
-- 2) Báo cáo sơ chế thiếu dòng chỉ tiêu (kỳ vọng 0):
--    SELECT count(*) FROM fp_farm_bao_cao_so_che b
--    WHERE (SELECT count(*) FROM fp_farm_bao_cao_so_che_ct ct WHERE ct.id_bao_cao = b.id
--           AND ct.ma_chi_tieu = 'danh_gia_loi_qc_pct') <> 1;
--
-- 3) Tỉ lệ tự cộng tay theo thùng, đối chiếu với hàm (2 cột phải bằng nhau):
--    SELECT x.ngay, x.id_chi_nhanh, round(100 * x.loi / x.nhanh, 2) AS tinh_tay,
--           fn_gscl_ti_le_loi_ngay(x.ngay, x.id_chi_nhanh) AS tu_ham
--    FROM (
--      SELECT p.ngay, p.id_chi_nhanh,
--             SUM((SELECT COALESCE(SUM((c.ket_qua ->> (e ->> 'ma'))::numeric), 0)
--                    FROM jsonb_array_elements(p.tieu_chi) e
--                   WHERE e ->> 'loai' = 'dem_loi'
--                     AND jsonb_typeof(c.ket_qua -> (e ->> 'ma')) = 'number')) AS loi,
--             SUM(c.tong_nhanh)::numeric AS nhanh
--        FROM fp_farm_giam_sat_chat_luong p
--        JOIN fp_farm_giam_sat_chat_luong_ct c ON c.id_phieu = p.id
--       WHERE p.trang_thai <> 'huy' AND c.da_kiem AND c.tong_nhanh > 0
--       GROUP BY p.ngay, p.id_chi_nhanh
--    ) x
--    ORDER BY x.ngay DESC LIMIT 20;
--
-- 4) Thử khoá số (trong transaction rồi ROLLBACK): gõ tay phải bị trigger trả về số thật.
--    BEGIN;
--    UPDATE fp_farm_bao_cao_so_che_ct SET gia_tri = 99.99
--     WHERE id = (SELECT ct.id FROM fp_farm_bao_cao_so_che_ct ct
--                 JOIN fp_farm_bao_cao_so_che b ON b.id = ct.id_bao_cao
--                 WHERE ct.ma_chi_tieu = 'danh_gia_loi_qc_pct' LIMIT 1)
--     RETURNING id_bao_cao, ma_chi_tieu, gia_tri;
--    ROLLBACK;
--
-- 5) Giá trị cũ bị backfill ghi đè (để đối chiếu / khôi phục nếu cần):
--    SELECT bang, ban_ghi_id, du_lieu_cu, du_lieu_moi, thoi_diem FROM fp_var_nhat_ky_thay_doi
--    WHERE bang = 'fp_farm_bao_cao_so_che_ct'
--    ORDER BY thoi_diem DESC LIMIT 50;
-- =============================================================================
