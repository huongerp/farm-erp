-- Thêm cột chi_nhanh_ids (mảng) để 1 nhân viên thuộc nhiều chi nhánh.
-- Chạy trên Supabase SQL Editor. Sau khi chạy, app dùng chi_nhanh_ids; chi_nhanh_id giữ để tương thích ngược (có thể xóa sau).

-- 1) Thêm cột mảng (text[] hoặc uuid[] tùy kiểu id bảng fp_var_chi_nhanh)
ALTER TABLE fp_var_nhan_vien
  ADD COLUMN IF NOT EXISTS chi_nhanh_ids text[] DEFAULT '{}';

-- 2) Backfill: copy chi_nhanh_id sang chi_nhanh_ids (1 phần tử)
UPDATE fp_var_nhan_vien
SET chi_nhanh_ids = ARRAY[chi_nhanh_id::text]
WHERE chi_nhanh_id IS NOT NULL
  AND (chi_nhanh_ids IS NULL OR cardinality(chi_nhanh_ids) = 0);

-- 3) (Tùy chọn) Comment để ghi chú
COMMENT ON COLUMN fp_var_nhan_vien.chi_nhanh_ids IS 'Danh sách id chi nhánh (nhiều chi nhánh cho 1 nhân viên).';
