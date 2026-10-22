-- 049: Đơn đặt hàng — chặn phạm vi farm ở tầng DB + bỏ trạng thái "Nháp".
--
-- 1) Phạm vi farm (RLS). Trước đây SELECT/UPDATE/DELETE của fp_mh_don_dat_hang và _chi_tiet là USING (true),
--    chỉ app lọc (applyDonDatHangScope) → app lọc sai một lần là nhân viên farm này thấy hết đơn farm khác
--    (ca "Dữ liệu fp6" thấy 412/412 đơn ngày 22/10). Giờ DB áp cùng luật với app
--    (use-don-dat-hang-view-scope.ts / donDatHangTrongPhamVi):
--      * cấp bậc 1 / chức vụ tt = 1 / quyền admin|all trên module → xem hết;
--      * còn lại → đơn có kho nhận thuộc chi nhánh của mình (chi_nhanh_ids) hoặc đơn do chính mình đặt.
--    Dòng chi tiết theo đơn cha. Các view v_don_dat_hang_summary, v_don_dat_hang_chi_tiet_flat,
--    v_xuat_don_dat_hang là security_invoker nên tự theo; v_phieu_kho_summary LEFT JOIN nên không mất phiếu kho.
--    INSERT giữ nguyên; UPDATE không khai WITH CHECK → Postgres dùng luôn USING làm WITH CHECK.
--
-- 2) Bỏ "Nháp": đơn mới bắt đầu ở "Chờ duyệt". Chuyển toàn bộ đơn Nháp sang Chờ duyệt với trigger
--    thông báo TẮT trong lúc đổi hàng loạt (không bắn hàng trăm "đơn chờ duyệt" cho nhóm duyệt).
--    Trigger nhật ký + đồng bộ trạng thái xuống dòng chi tiết vẫn chạy.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Hàm phạm vi
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_don_dat_hang_xem_het()
    RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT public.fn_co_quyen_module('mua-hang/don-dat-hang', ARRAY['admin', 'all']);
$$;

COMMENT ON FUNCTION public.fn_don_dat_hang_xem_het() IS
  'true khi nhân viên hiện tại xem được mọi đơn đặt hàng (cấp cao hoặc quyền admin/all trên mua-hang/don-dat-hang)';

REVOKE ALL ON FUNCTION public.fn_don_dat_hang_xem_het() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_don_dat_hang_xem_het() TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_kho_ids_nhan_vien_hien_tai()
    RETURNS bigint[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT coalesce(array_agg(k.id), '{}'::bigint[])
  FROM public.fp_mh_danh_sach_kho k
  JOIN public.fp_var_nhan_vien nv ON nv.id = public.nhan_vien_hien_tai_id()
  WHERE k.chi_nhanh_id IS NOT NULL
    AND k.chi_nhanh_id::text = ANY (coalesce(nv.chi_nhanh_ids, '{}'::text[]));
$$;

COMMENT ON FUNCTION public.fn_kho_ids_nhan_vien_hien_tai() IS
  'id kho (fp_mh_danh_sach_kho) thuộc các chi nhánh của nhân viên hiện tại (fp_var_nhan_vien.chi_nhanh_ids)';

REVOKE ALL ON FUNCTION public.fn_kho_ids_nhan_vien_hien_tai() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_kho_ids_nhan_vien_hien_tai() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. RLS đơn đặt hàng
-- ---------------------------------------------------------------------------
-- (SELECT …) / IN (SELECT unnest(…)) để Postgres tính hàm một lần mỗi câu truy vấn, không gọi theo từng dòng.

DROP POLICY IF EXISTS "Allow select don_dat_hang" ON public.fp_mh_don_dat_hang;
DROP POLICY IF EXISTS "Allow update don_dat_hang" ON public.fp_mh_don_dat_hang;
DROP POLICY IF EXISTS "Allow delete don_dat_hang" ON public.fp_mh_don_dat_hang;

CREATE POLICY "Don dat hang trong pham vi select" ON public.fp_mh_don_dat_hang
  FOR SELECT TO authenticated
  USING (
    (SELECT public.fn_don_dat_hang_xem_het())
    OR id_nguoi_dat = (SELECT public.nhan_vien_hien_tai_id())
    OR id_kho_nhan IN (SELECT unnest(public.fn_kho_ids_nhan_vien_hien_tai()))
  );

CREATE POLICY "Don dat hang trong pham vi update" ON public.fp_mh_don_dat_hang
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.fn_don_dat_hang_xem_het())
    OR id_nguoi_dat = (SELECT public.nhan_vien_hien_tai_id())
    OR id_kho_nhan IN (SELECT unnest(public.fn_kho_ids_nhan_vien_hien_tai()))
  );

CREATE POLICY "Don dat hang trong pham vi delete" ON public.fp_mh_don_dat_hang
  FOR DELETE TO authenticated
  USING (
    (SELECT public.fn_don_dat_hang_xem_het())
    OR id_nguoi_dat = (SELECT public.nhan_vien_hien_tai_id())
    OR id_kho_nhan IN (SELECT unnest(public.fn_kho_ids_nhan_vien_hien_tai()))
  );

-- Dòng chi tiết: thấy được đơn cha (RLS bảng cha áp trong EXISTS) thì thấy dòng.
DROP POLICY IF EXISTS "Allow select don_dat_hang_chi_tiet" ON public.fp_mh_don_dat_hang_chi_tiet;
DROP POLICY IF EXISTS "Allow update don_dat_hang_chi_tiet" ON public.fp_mh_don_dat_hang_chi_tiet;
DROP POLICY IF EXISTS "Allow delete don_dat_hang_chi_tiet" ON public.fp_mh_don_dat_hang_chi_tiet;

CREATE POLICY "Chi tiet don dat hang theo don select" ON public.fp_mh_don_dat_hang_chi_tiet
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fp_mh_don_dat_hang d WHERE d.id = id_don_dat_hang));

CREATE POLICY "Chi tiet don dat hang theo don update" ON public.fp_mh_don_dat_hang_chi_tiet
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fp_mh_don_dat_hang d WHERE d.id = id_don_dat_hang));

CREATE POLICY "Chi tiet don dat hang theo don delete" ON public.fp_mh_don_dat_hang_chi_tiet
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.fp_mh_don_dat_hang d WHERE d.id = id_don_dat_hang));

-- ---------------------------------------------------------------------------
-- 3. Bỏ trạng thái "Nháp"
-- ---------------------------------------------------------------------------

ALTER TABLE public.fp_mh_don_dat_hang DISABLE TRIGGER tr_thong_bao_fp_mh_don_dat_hang;

UPDATE public.fp_mh_don_dat_hang SET trang_thai = 'Chờ duyệt' WHERE trang_thai = 'Nháp';

ALTER TABLE public.fp_mh_don_dat_hang ENABLE TRIGGER tr_thong_bao_fp_mh_don_dat_hang;

ALTER TABLE public.fp_mh_don_dat_hang ALTER COLUMN trang_thai SET DEFAULT 'Chờ duyệt';

ALTER TABLE public.fp_mh_don_dat_hang DROP CONSTRAINT IF EXISTS fp_mh_don_dat_hang_trang_thai_check;
ALTER TABLE public.fp_mh_don_dat_hang ADD CONSTRAINT fp_mh_don_dat_hang_trang_thai_check CHECK (
  trang_thai = ANY (ARRAY['Chờ duyệt', 'Đã gửi', 'Đã xác nhận', 'Đang giao', 'Đã nhận đủ', 'Đã đóng', 'Hủy'])
);

COMMIT;
