-- =============================================================================
-- Tối ưu tìm kiếm: PostgREST `.or(...ilike.%...%)` trên nhiều cột
-- =============================================================================
-- Chạy trên Supabase SQL Editor (hoặc migration) sau khi rà đúng tên bảng/view
-- thực tế. Điều chỉnh schema (public) và tên object theo DB của bạn.
--
-- 1) pg_trgm: hỗ trợ index cho predicate dạng `col ILIKE '%từ khóa%'`.
-- 2) GIN (gin_trgm_ops): mỗi cột tham gia search một index (hoặc gist_trgm_ops).
-- 3) Composite B-tree: cột lọc thường dùng (loai, ngay, id_chi_nhanh, trang_thai…)
--    — giúp planner giảm tập hàng trước khi áp predicate nặng.
--
-- Kiểm tra sau khi tạo index (trên staging, với dữ liệu đại diện):
--   EXPLAIN (ANALYZE, BUFFERS)
--   SELECT ... FROM ... WHERE ... OR (col1 ILIKE '%x%' OR col2 ILIKE '%x%');
--
-- View có LATERAL aggregate (vd. public.v_phieu_kho_summary trong
-- docs/supabase-v_phieu_kho_summary.sql): planner vẫn phải tính aggregate
-- cho các dòng khớp filter; đo thời gian thực tế. Nếu vẫn nặng, cân nhắc
-- cột tổng hợp trên bảng gốc hoặc materialized view theo khối lượng dữ liệu.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- Nhân viên: fp_var_nhan_vien — ho_va_ten, email, so_dien_thoai
-- (khớp features/he-thong/nhan-vien/services/nhan-vien-service.ts)
-- ---------------------------------------------------------------------------
-- CREATE INDEX IF NOT EXISTS idx_fp_var_nhan_vien_ho_va_ten_trgm
--   ON public.fp_var_nhan_vien USING gin (ho_va_ten gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_fp_var_nhan_vien_email_trgm
--   ON public.fp_var_nhan_vien USING gin (email gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_fp_var_nhan_vien_so_dien_thoai_trgm
--   ON public.fp_var_nhan_vien USING gin (so_dien_thoai gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Phiếu kho (bảng gốc): fp_mh_phieu_kho — so_phieu, mo_ta, ten_kho, ten_kho_den
-- Chi tiết (flat / view tùy triển khai): ten_hang_hoa, ghi_chu, …
-- (khớp features/kho-van/phieu-kho/services/phieu-kho-supabase.service.ts)
-- ---------------------------------------------------------------------------
-- CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_so_phieu_trgm
--   ON public.fp_mh_phieu_kho USING gin (so_phieu gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_mo_ta_trgm
--   ON public.fp_mh_phieu_kho USING gin (mo_ta gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_ten_kho_trgm
--   ON public.fp_mh_phieu_kho USING gin (ten_kho gin_trgm_ops);
-- CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_ten_kho_den_trgm
--   ON public.fp_mh_phieu_kho USING gin (ten_kho_den gin_trgm_ops);

-- Ví dụ composite (điều chỉnh cột filter thực tế của list):
-- CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_loai_ngay
--   ON public.fp_mh_phieu_kho (loai, ngay DESC);

-- ---------------------------------------------------------------------------
-- Đơn đặt hàng: fp_mh_don_dat_hang hoặc view v_don_dat_hang_summary
-- — so_po, ghi_chu, ten_nha_cung_cap, ten_kho_nhan
-- (khớp features/mua-hang/don-dat-hang/services/don-dat-hang-supabase.service.ts)
-- ---------------------------------------------------------------------------
-- Nếu query đi vào VIEW: tạo index trên bảng nguồn các cột tương ứng, hoặc
-- index trên materialized view nếu dùng MV.

-- ---------------------------------------------------------------------------
-- Phiếu đề xuất VT: các cột trong `.or(...ilike...)`
-- (khớp features/kho-van/phieu-de-xuat-vat-tu/services/phieu-de-xuat-vat-tu-supabase.service.ts)
-- ---------------------------------------------------------------------------
-- Áp GIN gin_trgm_ops cho từng cột text tham gia OR ilike.
