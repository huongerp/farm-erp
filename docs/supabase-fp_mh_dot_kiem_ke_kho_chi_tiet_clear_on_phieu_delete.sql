-- =============================================================================
-- Kiểm kê kho: đồng bộ liên kết điều chỉnh tồn khi xóa phiếu kho
-- Chạy sau docs/supabase-fp_mh_dot_kiem_ke_kho_dieu_chinh_ton.sql
--
-- Vấn đề: dòng fp_mh_dot_kiem_ke_kho_chi_tiet lưu id_phieu_kho_dieu_chinh +
--   so_luong_dieu_chinh, tg_dieu_chinh_ton. Nếu phiếu bị xóa mà FK không có
--   hoặc ON DELETE chỉ null hóa id thì UI/RPC vẫn coi là "đã điều chỉnh".
-- Giải pháp:
--   1) Dọn dữ liệu orphan (một lần).
--   2) FK ON DELETE SET NULL (idempotent: drop + add tên chuẩn).
--   3) BEFORE DELETE trên fp_mh_phieu_kho: xóa sạch cả 3 cột trên chi tiết kiểm kê
--      (chạy trước khi dòng phiếu biến mất — đủ để WHERE id_phieu_kho_dieu_chinh = OLD.id).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Dữ liệu orphan: phiếu đã không còn nhưng chi tiết vẫn trỏ tới id cũ
-- -----------------------------------------------------------------------------
UPDATE public.fp_mh_dot_kiem_ke_kho_chi_tiet ct
SET
  id_phieu_kho_dieu_chinh = NULL,
  so_luong_dieu_chinh = NULL,
  tg_dieu_chinh_ton = NULL
WHERE ct.id_phieu_kho_dieu_chinh IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.fp_mh_phieu_kho pk WHERE pk.id = ct.id_phieu_kho_dieu_chinh
  );

-- -----------------------------------------------------------------------------
-- 2) Ràng buộc FK chuẩn (tên constraint Postgres mặc định; nếu DB dùng tên khác,
--    có thể bỏ qua bước DROP hoặc đổi tên constraint cho khớp)
-- -----------------------------------------------------------------------------
ALTER TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet
  DROP CONSTRAINT IF EXISTS fp_mh_dot_kiem_ke_kho_chi_tiet_id_phieu_kho_dieu_chinh_fkey;

ALTER TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet
  ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_chi_tiet_id_phieu_kho_dieu_chinh_fkey
  FOREIGN KEY (id_phieu_kho_dieu_chinh)
  REFERENCES public.fp_mh_phieu_kho (id)
  ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 3) Trigger: xóa phiếu kho → gỡ hoàn toàn liên kết điều chỉnh trên kiểm kê kho
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

COMMENT ON FUNCTION public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh() IS
  'Trước khi xóa phiếu kho: gỡ liên kết điều chỉnh tồn kiểm kê (3 cột) khỏi chi tiết đợt kiểm kê.';

DROP TRIGGER IF EXISTS tr_fp_mh_phieu_kho_before_delete_clear_kiem_ke ON public.fp_mh_phieu_kho;

CREATE TRIGGER tr_fp_mh_phieu_kho_before_delete_clear_kiem_ke
  BEFORE DELETE ON public.fp_mh_phieu_kho
  FOR EACH ROW
  EXECUTE PROCEDURE public.fp_mh_phieu_kho_before_delete_clear_kiem_ke_dieu_chinh();
