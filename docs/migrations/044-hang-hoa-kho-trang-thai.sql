-- 044: Trạng thái hoạt động cho hàng hoá nhóm kho — Sơ chế (fp_farm_*) và Phân thuốc (fp_pt_*).
-- 'Ngừng hoạt động' → app ẩn mã khỏi ô chọn hàng ở Phiếu kho / Đề xuất mua hàng / Giám sát chất lượng
-- và khi Kiểm kê "Tạo danh sách" (trừ hàng còn tồn). Phiếu cũ đã chứa mã vẫn giữ nguyên.
-- Cùng giá trị text với Kho vận (fp_mh_danh_sach_hang_hoa.trang_thai). Không đổi RLS / GRANT;
-- KHÔNG chặn ở DB vì sửa phiếu cũ có dòng hàng đã ngừng vẫn phải lưu được.

ALTER TABLE public.fp_farm_danh_sach_hang_hoa
  ADD COLUMN IF NOT EXISTS trang_thai text NOT NULL DEFAULT 'Đang hoạt động'
  CONSTRAINT fp_farm_danh_sach_hang_hoa_trang_thai_check
  CHECK (trang_thai IN ('Đang hoạt động', 'Ngừng hoạt động'));

COMMENT ON COLUMN public.fp_farm_danh_sach_hang_hoa.trang_thai IS
  'Đang hoạt động / Ngừng hoạt động — ngừng thì app ẩn khỏi ô chọn hàng ở phiếu mới';

ALTER TABLE public.fp_pt_danh_sach_hang_hoa
  ADD COLUMN IF NOT EXISTS trang_thai text NOT NULL DEFAULT 'Đang hoạt động'
  CONSTRAINT fp_pt_danh_sach_hang_hoa_trang_thai_check
  CHECK (trang_thai IN ('Đang hoạt động', 'Ngừng hoạt động'));

COMMENT ON COLUMN public.fp_pt_danh_sach_hang_hoa.trang_thai IS
  'Đang hoạt động / Ngừng hoạt động — ngừng thì app ẩn khỏi ô chọn hàng ở phiếu mới';

NOTIFY pgrst, 'reload schema';
