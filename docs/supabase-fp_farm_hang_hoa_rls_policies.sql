-- =============================================================================
-- RLS: fp_farm_danh_muc_hang_hoa, fp_farm_danh_sach_hang_hoa
-- Module Quản lý farm → Hàng hóa (app dùng Supabase client với JWT authenticated).
--
-- Nếu bảng đã bật RLS nhưng không có policy phù hợp, SELECT qua API trả [] —
-- app hiển thị "Chưa có danh mục/hàng hóa" dù Table Editor vẫn thấy dữ liệu.
-- Chạy file này trong SQL Editor sau khi tạo bảng (và sau migration/seed nếu cần).
-- =============================================================================

ALTER TABLE public.fp_farm_danh_muc_hang_hoa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp_farm_danh_sach_hang_hoa ENABLE ROW LEVEL SECURITY;

-- Danh mục
DROP POLICY IF EXISTS fp_farm_danh_muc_hang_hoa_select ON public.fp_farm_danh_muc_hang_hoa;
DROP POLICY IF EXISTS fp_farm_danh_muc_hang_hoa_insert ON public.fp_farm_danh_muc_hang_hoa;
DROP POLICY IF EXISTS fp_farm_danh_muc_hang_hoa_update ON public.fp_farm_danh_muc_hang_hoa;
DROP POLICY IF EXISTS fp_farm_danh_muc_hang_hoa_delete ON public.fp_farm_danh_muc_hang_hoa;

CREATE POLICY fp_farm_danh_muc_hang_hoa_select ON public.fp_farm_danh_muc_hang_hoa
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_farm_danh_muc_hang_hoa_insert ON public.fp_farm_danh_muc_hang_hoa
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fp_farm_danh_muc_hang_hoa_update ON public.fp_farm_danh_muc_hang_hoa
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fp_farm_danh_muc_hang_hoa_delete ON public.fp_farm_danh_muc_hang_hoa
  FOR DELETE TO authenticated USING (true);

-- Hàng hóa
DROP POLICY IF EXISTS fp_farm_danh_sach_hang_hoa_select ON public.fp_farm_danh_sach_hang_hoa;
DROP POLICY IF EXISTS fp_farm_danh_sach_hang_hoa_insert ON public.fp_farm_danh_sach_hang_hoa;
DROP POLICY IF EXISTS fp_farm_danh_sach_hang_hoa_update ON public.fp_farm_danh_sach_hang_hoa;
DROP POLICY IF EXISTS fp_farm_danh_sach_hang_hoa_delete ON public.fp_farm_danh_sach_hang_hoa;

CREATE POLICY fp_farm_danh_sach_hang_hoa_select ON public.fp_farm_danh_sach_hang_hoa
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_farm_danh_sach_hang_hoa_insert ON public.fp_farm_danh_sach_hang_hoa
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fp_farm_danh_sach_hang_hoa_update ON public.fp_farm_danh_sach_hang_hoa
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fp_farm_danh_sach_hang_hoa_delete ON public.fp_farm_danh_sach_hang_hoa
  FOR DELETE TO authenticated USING (true);
