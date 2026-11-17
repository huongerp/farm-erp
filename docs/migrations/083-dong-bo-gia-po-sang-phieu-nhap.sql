-- 083: Đồng bộ đơn giá đơn đặt hàng (PO) sang phiếu nhập kho theo đơn CHƯA DUYỆT.
-- Phiếu nhập tạo từ PO chỉ chép giá lúc tạo; PO được cập nhật giá sau đó thì phiếu nhập vẫn 0 đồng
-- (ca NK-3105 / PO-2026-00964). Luật:
--   * Dòng PO có giá > 0 được thêm/sửa giá → mọi dòng cùng hàng hoá của phiếu nhập (loai = 'nhập')
--     gắn với đơn đó, đang 'Chờ duyệt' / 'Đợi duyệt', lấy giá PO.
--   * Giá PO = 0 không bao giờ đè giá phiếu. Phiếu đã duyệt / không duyệt giữ nguyên.
--   * PO lưu theo kiểu xoá-rồi-chèn lại dòng → bắt cả INSERT.
-- thanh_tien của dòng phiếu tự tính lại nhờ trigger tr_fp_mh_phieu_kho_chi_tiet_thanh_tien;
-- nhật ký thay đổi ghi người sửa thật từ JWT. Hàm chạy quyền người gọi (RLS phiếu kho chi tiết vẫn áp).

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_dong_bo_gia_po_sang_phieu_nhap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE fp_mh_phieu_kho_chi_tiet ct
     SET don_gia = NEW.don_gia
    FROM fp_mh_phieu_kho p
   WHERE p.id = ct.id_phieu_kho
     AND p.id_don_dat_hang = NEW.id_don_dat_hang
     AND p.loai = 'nhập'
     AND p.trang_thai IN ('Chờ duyệt', 'Đợi duyệt')
     AND ct.id_hang_hoa = NEW.id_hang_hoa
     AND ct.don_gia IS DISTINCT FROM NEW.don_gia;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_dong_bo_gia_po_sang_phieu_nhap() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS trg_dong_bo_gia_po_sang_phieu_nhap ON public.fp_mh_don_dat_hang_chi_tiet;
CREATE TRIGGER trg_dong_bo_gia_po_sang_phieu_nhap
  AFTER INSERT OR UPDATE OF don_gia ON public.fp_mh_don_dat_hang_chi_tiet
  FOR EACH ROW
  WHEN (NEW.don_gia > 0)
  EXECUTE FUNCTION public.fn_dong_bo_gia_po_sang_phieu_nhap();

-- Backfill một lần: phiếu nhập theo đơn chưa duyệt còn dòng giá 0 mà PO cùng hàng đã có giá.
UPDATE fp_mh_phieu_kho_chi_tiet ct
   SET don_gia = po.don_gia
  FROM fp_mh_phieu_kho p
  JOIN fp_mh_don_dat_hang_chi_tiet po ON po.id_don_dat_hang = p.id_don_dat_hang
 WHERE p.id = ct.id_phieu_kho
   AND p.loai = 'nhập'
   AND p.trang_thai IN ('Chờ duyệt', 'Đợi duyệt')
   AND po.id_hang_hoa = ct.id_hang_hoa
   AND po.don_gia > 0
   AND COALESCE(ct.don_gia, 0) = 0;

COMMIT;
