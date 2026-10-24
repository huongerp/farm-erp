-- 050: Đơn đặt hàng — nhớ trạng thái ngay trước khi "Đã nhận đủ" để nút "Hoàn tác nhận đủ" trả đúng chỗ cũ.
-- Nhân viên nhận hàng bấm "Nhận đủ" ở drawer chi tiết (Đã xác nhận / Đã gửi / Đang giao → Đã nhận đủ); bấm nhầm thì
-- hoàn tác về trạng thái trước đó. Trạng thái trước được ghi bằng trigger ở DB (không phải app) nên đường
-- "Chuyển trạng thái" của admin hay SQL tay cũng được nhớ. Không đụng view: app đọc cột này thẳng từ bảng gốc khi hoàn tác.
-- Trigger nhật ký (016) đã có trên bảng → cột mới tự vào nhật ký.

BEGIN;

ALTER TABLE public.fp_mh_don_dat_hang ADD COLUMN IF NOT EXISTS trang_thai_truoc_nhan_du text;

COMMENT ON COLUMN public.fp_mh_don_dat_hang.trang_thai_truoc_nhan_du IS
  'Trạng thái ngay trước lần chuyển sang "Đã nhận đủ" gần nhất (trigger tự ghi) — dùng cho Hoàn tác nhận đủ';

CREATE OR REPLACE FUNCTION public.fp_mh_don_dat_hang_nho_trang_thai_truoc()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.trang_thai = 'Đã nhận đủ' AND OLD.trang_thai IS DISTINCT FROM 'Đã nhận đủ' THEN
    NEW.trang_thai_truoc_nhan_du := OLD.trang_thai;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fp_mh_don_dat_hang_nho_trang_thai_truoc() FROM PUBLIC, anon;

DROP TRIGGER IF EXISTS tr_fp_mh_don_dat_hang_nho_trang_thai_truoc ON public.fp_mh_don_dat_hang;
CREATE TRIGGER tr_fp_mh_don_dat_hang_nho_trang_thai_truoc
  BEFORE UPDATE OF trang_thai ON public.fp_mh_don_dat_hang
  FOR EACH ROW EXECUTE FUNCTION public.fp_mh_don_dat_hang_nho_trang_thai_truoc();

COMMIT;
