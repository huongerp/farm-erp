-- =============================================================================
-- 040-pt-tien-do-mua-hang-mac-dinh.sql — Nạp danh mục tiến độ mua hàng cho Phân thuốc
--
-- Bối cảnh: 029 tách bảng riêng fp_pt_tien_do_mua_hang nhưng không chép dữ liệu → bảng trống.
-- Hệ quả ở /phan-thuoc/de-xuat-mua-hang:
--   - Popup "Chuyển tiến độ" và ô Tiến độ MH trong form không có lựa chọn nào;
--   - Dòng hàng tạo mới không được gán tiến độ mặc định (form lấy tiến độ thứ tự nhỏ nhất).
--
-- Việc làm:
--   1. Chép 8 tiến độ của Sơ chế (fp_farm_tien_do_mua_hang) sang, giữ nguyên id / mã / màu / thứ tự
--      (bỏ qua mã đã có), rồi đẩy sequence lên sau id lớn nhất.
--   2. Dòng đề xuất Phân thuốc chưa có tiến độ → gán tiến độ thứ tự nhỏ nhất ("Chưa mua"),
--      đúng giá trị form sẽ gán nếu lúc tạo phiếu đã có danh mục.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-040
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/040-pt-tien-do-mua-hang-mac-dinh.sql
-- =============================================================================

BEGIN;

INSERT INTO public.fp_pt_tien_do_mua_hang (id, ma, ten, thu_tu, mau, ghi_chu, trang_thai)
SELECT f.id, f.ma, f.ten, f.thu_tu, f.mau, f.ghi_chu, f.trang_thai
FROM public.fp_farm_tien_do_mua_hang f
WHERE NOT EXISTS (SELECT 1 FROM public.fp_pt_tien_do_mua_hang p WHERE p.ma = f.ma OR p.id = f.id)
ORDER BY f.thu_tu;

SELECT setval(
  'public.fp_pt_tien_do_mua_hang_id_seq',
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM public.fp_pt_tien_do_mua_hang), 1)
);

UPDATE public.fp_pt_de_xuat_mua_hang_chi_tiet ct
SET id_tien_do_mh = td.id,
    ten_tien_do_mh = td.ten
FROM (
  SELECT id, ten
  FROM public.fp_pt_tien_do_mua_hang
  WHERE trang_thai = 'Đang hoạt động'
  ORDER BY thu_tu, id
  LIMIT 1
) td
WHERE ct.id_tien_do_mh IS NULL
  AND COALESCE(ct.ten_tien_do_mh, '') = '';

COMMIT;
