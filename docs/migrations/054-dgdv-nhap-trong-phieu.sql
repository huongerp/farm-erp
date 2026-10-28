-- =============================================================================
-- 054-dgdv-nhap-trong-phieu.sql — Đánh giá đầu vào: lô / tổ trưởng / lý do nhập ngay trong phiếu
--
-- 1) Tổ trưởng gõ tay (tổ trưởng không có tài khoản nhân viên): thêm cột text `to_truong` ở danh mục
--    lô và lô của phiếu, backfill từ họ tên nhân viên theo id_to_truong cũ. Cột id_to_truong giữ lại
--    (dữ liệu cũ), app thôi ghi.
-- 2) Người lập phiếu (create / update) được THÊM lô thu hoạch và lý do — gõ lô mới trong form phiếu,
--    gõ lý do mới ở lưới tự vào danh sách chọn nhanh. Sửa / xoá danh mục vẫn chỉ admin module.
--
-- Chạy lại được nhiều lần.
-- Trước khi chạy: bash scripts/db-backup.sh truoc-054
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/054-dgdv-nhap-trong-phieu.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_var_lo_thu_hoach ADD COLUMN IF NOT EXISTS to_truong text;
ALTER TABLE public.fp_farm_dgdv_lo ADD COLUMN IF NOT EXISTS to_truong text;

COMMENT ON COLUMN public.fp_var_lo_thu_hoach.to_truong IS 'Tổ trưởng mặc định (gõ tay, chép vào phiếu khi thêm lô)';
COMMENT ON COLUMN public.fp_farm_dgdv_lo.to_truong IS 'Tổ trưởng của lô trong phiếu (gõ tay); dòng tổ trưởng gom theo tên này';
COMMENT ON COLUMN public.fp_var_lo_thu_hoach.id_to_truong IS 'CŨ — thay bằng to_truong (054), app không ghi nữa';
COMMENT ON COLUMN public.fp_farm_dgdv_lo.id_to_truong IS 'CŨ — thay bằng to_truong (054), app không ghi nữa';

UPDATE public.fp_var_lo_thu_hoach l
   SET to_truong = nv.ho_va_ten
  FROM public.fp_var_nhan_vien nv
 WHERE nv.id = l.id_to_truong AND l.to_truong IS NULL;

UPDATE public.fp_farm_dgdv_lo l
   SET to_truong = nv.ho_va_ten
  FROM public.fp_var_nhan_vien nv
 WHERE nv.id = l.id_to_truong AND l.to_truong IS NULL;

DROP POLICY IF EXISTS fp_var_lth_insert_quyen ON public.fp_var_lo_thu_hoach;
CREATE POLICY fp_var_lth_insert_quyen ON public.fp_var_lo_thu_hoach FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.fn_co_quyen_module('quan-ly-nha-so-che/danh-gia-dau-vao',
                                               ARRAY['create', 'update', 'admin', 'all'])));

DROP POLICY IF EXISTS fp_var_dgdv_ly_do_insert_quyen ON public.fp_var_dgdv_ly_do;
CREATE POLICY fp_var_dgdv_ly_do_insert_quyen ON public.fp_var_dgdv_ly_do FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.fn_co_quyen_module('quan-ly-nha-so-che/danh-gia-dau-vao',
                                               ARRAY['create', 'update', 'admin', 'all'])));

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Kiểm tra:
--   SELECT id, ten_lo, id_to_truong, to_truong FROM fp_var_lo_thu_hoach;
--   SELECT id, id_lo, id_to_truong, to_truong FROM fp_farm_dgdv_lo;
--   SELECT tablename, policyname, with_check FROM pg_policies
--    WHERE tablename IN ('fp_var_lo_thu_hoach', 'fp_var_dgdv_ly_do') AND cmd = 'INSERT';
