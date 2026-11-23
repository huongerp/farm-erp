-- =============================================================================
-- 099-bcnc-dung-danh-sach-nhan-vien.sql — Báo cáo nhân công dùng chung Danh sách nhân viên
--
-- Trước: BCNC giữ danh mục tên riêng fp_var_nhan_vien_so_che (gõ tên tự do, migration 059/098).
-- Từ nay tên lấy từ fp_var_nhan_vien (module Danh sách nhân viên). Bảng fp_var_nhan_vien_so_che
-- KHÔNG xoá mà đổi vai thành THIẾT LẬP theo (chi nhánh, nhân viên): vị trí / nhóm / chuyền mặc định.
-- Phiếu (_nv.id_nhan_vien), hệ số Ki, chốt tháng vẫn trỏ id bảng này → khoá thưởng vượt "nv:<id>"
-- giữ nguyên, không phải sửa phiếu cũ.
--
-- 1) Cột id_nv → fp_var_nhan_vien.
-- 2) Bổ sung công nhân vào Danh sách nhân viên: cùng tên (gọn khoảng trắng, không phân biệt hoa
--    thường — khớp khoaTen của app) = một người. Khớp người có sẵn → gắn + thêm chi nhánh còn thiếu;
--    chưa có → tạo mới (Nhân viên Sản xuất / Phòng Sản xuất, KHÔNG email / SĐT / mật khẩu = không
--    đăng nhập được). Đối chiếu trước bằng docs/migrations/099-xem-truoc.sql.
-- 3) Đổi họ tên ở Danh sách nhân viên → tự đổi tên ở bảng thiết lập.
-- 4) INSERT thiết lập: bắt buộc id_nv (thay luật super admin của 098 — hết gõ tên tự do).
-- 5) Thông báo theo chức vụ (074): bỏ người không có tài khoản.
--
-- Chạy (sau khi duyệt file xem trước):
--   bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/099-bcnc-dung-danh-sach-nhan-vien.sql
-- =============================================================================
BEGIN;

-- 1) Cột liên kết
ALTER TABLE public.fp_var_nhan_vien_so_che
  ADD COLUMN IF NOT EXISTS id_nv bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.fp_var_nhan_vien_so_che.id_nv IS
  'Nhân viên trong Danh sách nhân viên (fp_var_nhan_vien) — tên / trạng thái lấy từ đó (migration 099)';
COMMENT ON TABLE public.fp_var_nhan_vien_so_che IS
  'Báo cáo nhân công — thiết lập vị trí / nhóm / chuyền mặc định của nhân viên theo chi nhánh (tên lấy từ fp_var_nhan_vien)';

-- 2) Bổ sung nhân viên + gắn id_nv (chỉ dòng chưa gắn → chạy lại vô hại)
-- Tên nhập thử (Công duyệt 23/11/2026): không phiếu / Ki nào dùng → xoá, không đưa sang Danh sách nhân viên.
DELETE FROM public.fp_var_nhan_vien_so_che s
 WHERE s.id IN (116, 181, 246) AND s.ho_ten IN ('A', 'Test', 'H-Hạnh')
   AND NOT EXISTS (SELECT 1 FROM public.fp_farm_bao_cao_nhan_cong_nv n WHERE n.id_nhan_vien = s.id)
   AND NOT EXISTS (SELECT 1 FROM public.fp_farm_bcnc_he_so_loi_thang h WHERE h.id_nhan_vien = s.id)
   AND NOT EXISTS (SELECT 1 FROM public.fp_farm_bcnc_chot_thang_ct c WHERE c.id_nhan_vien = s.id);

CREATE TEMP TABLE tmp_nvsc ON COMMIT DROP AS
SELECT id, id_chi_nhanh, dang_dung, tg_tao,
       regexp_replace(btrim(ho_ten), '\s+', ' ', 'g')        AS ten_gon,
       lower(regexp_replace(btrim(ho_ten), '\s+', ' ', 'g')) AS khoa
  FROM public.fp_var_nhan_vien_so_che
 WHERE id_nv IS NULL;

-- Người có sẵn: trùng khoá thì ưu tiên người đang làm, rồi id nhỏ.
CREATE TEMP TABLE tmp_nv_chinh ON COMMIT DROP AS
SELECT DISTINCT ON (khoa) id, khoa
  FROM (SELECT id, trang_thai, lower(regexp_replace(btrim(ho_va_ten), '\s+', ' ', 'g')) AS khoa
          FROM public.fp_var_nhan_vien
         WHERE ho_va_ten IS NOT NULL AND btrim(ho_va_ten) <> '') x
 ORDER BY khoa, (trang_thai = 'Đang làm việc') DESC, id;

-- Sequence có thể tụt sau các lần import id tay → kéo lên trước khi insert.
SELECT setval('public.fp_var_nhan_vien_id_seq', (SELECT max(id) FROM public.fp_var_nhan_vien))
 WHERE (SELECT last_value FROM public.fp_var_nhan_vien_id_seq) < (SELECT max(id) FROM public.fp_var_nhan_vien);

WITH moi AS (
  INSERT INTO public.fp_var_nhan_vien
    (ho_va_ten, trang_thai, phong_ban_id, chuc_vu_id, chi_nhanh_ids, ngay_vao_lam)
  SELECT min(initcap(t.ten_gon)),
         CASE WHEN bool_or(t.dang_dung) THEN 'Đang làm việc' ELSE 'Nghỉ việc' END,
         4,   -- Phòng Sản xuất
         22,  -- Nhân viên Sản xuất
         array_agg(DISTINCT t.id_chi_nhanh::text),
         min(t.tg_tao)::date
    FROM tmp_nvsc t
   WHERE NOT EXISTS (SELECT 1 FROM tmp_nv_chinh n WHERE n.khoa = t.khoa)
   GROUP BY t.khoa
  RETURNING id, ho_va_ten
)
INSERT INTO tmp_nv_chinh (id, khoa)
SELECT id, lower(regexp_replace(btrim(ho_va_ten), '\s+', ' ', 'g')) FROM moi;

-- Người có sẵn: thêm chi nhánh NSC còn thiếu (trigger sync_display_names cập nhật ten_chi_nhanh).
UPDATE public.fp_var_nhan_vien nv
   SET chi_nhanh_ids = coalesce(nv.chi_nhanh_ids, '{}'::text[]) || x.them
  FROM (SELECT n.id, array_agg(DISTINCT t.id_chi_nhanh::text) AS them
          FROM tmp_nvsc t
          JOIN tmp_nv_chinh n USING (khoa)
          JOIN public.fp_var_nhan_vien v ON v.id = n.id
         WHERE NOT (t.id_chi_nhanh::text = ANY (coalesce(v.chi_nhanh_ids, '{}'::text[])))
         GROUP BY n.id) x
 WHERE nv.id = x.id;

UPDATE public.fp_var_nhan_vien_so_che s
   SET id_nv = n.id
  FROM tmp_nvsc t
  JOIN tmp_nv_chinh n USING (khoa)
 WHERE s.id = t.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_fp_var_nvsc_cn_nv
  ON public.fp_var_nhan_vien_so_che (id_chi_nhanh, id_nv) WHERE id_nv IS NOT NULL;

-- 3) Đổi họ tên ở Danh sách nhân viên → đổi tên ở bảng thiết lập (bỏ qua nếu trùng tên người khác
--    cùng chi nhánh — UNIQUE (id_chi_nhanh, lower(ho_ten)) — để không chặn việc sửa hồ sơ).
CREATE OR REPLACE FUNCTION public.fn_bcnc_dong_bo_ten_nv() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ten text := regexp_replace(btrim(NEW.ho_va_ten), '\s+', ' ', 'g');
BEGIN
  UPDATE public.fp_var_nhan_vien_so_che s
     SET ho_ten = v_ten
   WHERE s.id_nv = NEW.id
     AND s.ho_ten IS DISTINCT FROM v_ten
     AND NOT EXISTS (
       SELECT 1 FROM public.fp_var_nhan_vien_so_che o
        WHERE o.id_chi_nhanh = s.id_chi_nhanh AND o.id <> s.id AND lower(o.ho_ten) = lower(v_ten));
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.fn_bcnc_dong_bo_ten_nv() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_bcnc_dong_bo_ten_nv
  AFTER UPDATE OF ho_va_ten ON public.fp_var_nhan_vien
  FOR EACH ROW
  WHEN (NEW.ho_va_ten IS DISTINCT FROM OLD.ho_va_ten AND btrim(coalesce(NEW.ho_va_ten, '')) <> '')
  EXECUTE FUNCTION public.fn_bcnc_dong_bo_ten_nv();

-- 4) INSERT thiết lập: phải gắn nhân viên có thật; người tạo / sửa phiếu được thêm (thay luật 098).
DROP POLICY IF EXISTS fp_var_nvsc_insert_quyen ON public.fp_var_nhan_vien_so_che;
CREATE POLICY fp_var_nvsc_insert_quyen ON public.fp_var_nhan_vien_so_che
  FOR INSERT TO authenticated
  WITH CHECK (
    id_nv IS NOT NULL
    AND (SELECT public.fn_co_quyen_module('quan-ly-nha-so-che/bao-cao-nhan-cong',
                                          ARRAY['create', 'update', 'admin', 'all']))
  );
COMMENT ON POLICY fp_var_nvsc_insert_quyen ON public.fp_var_nhan_vien_so_che IS
  'Thêm thiết lập phải gắn id_nv (tên lấy từ Danh sách nhân viên) — migration 099, thay luật super admin của 098';

-- 5) Thông báo theo chức vụ: người không có tài khoản (không mật khẩu) không nhận.
CREATE OR REPLACE FUNCTION public.rpc_tb_nhan_vien_theo_chuc_vu(p_chuc_vu_ids bigint[])
    RETURNS TABLE(nhan_vien_id bigint)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT nv.id
    FROM public.fp_var_nhan_vien nv
   WHERE nv.chuc_vu_id = ANY (coalesce(p_chuc_vu_ids, '{}'))
     AND COALESCE(nv.trang_thai, '') <> 'Nghỉ việc'
     AND nv.mat_khau_hash IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.rpc_tb_nhan_vien_theo_chuc_vu(bigint[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_tb_nhan_vien_theo_chuc_vu(bigint[]) TO notify_service;

COMMIT;
NOTIFY pgrst, 'reload schema';
