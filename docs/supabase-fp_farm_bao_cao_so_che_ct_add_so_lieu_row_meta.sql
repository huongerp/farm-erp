-- =============================================================================
-- Farm: Báo cáo sơ chế — bảng con `_ct`: thêm JSON meta theo từng chỉ tiêu số liệu
-- (ghi chú + ĐVT dòng). Chạy sau `supabase-fp_farm_bao_cao_so_che.sql`.
--
-- Chỉ dùng cho DB đang ở kiểu 1 dòng/phiếu + cột flat. Nếu đã migrate sang
-- `supabase-fp_farm_bao_cao_so_che_ct_migrate_one_row_to_multi_row.sql` (nhiều dòng,
-- không còn jsonb) thì KHÔNG chạy file này.
-- =============================================================================

ALTER TABLE public.fp_farm_bao_cao_so_che_ct
  ADD COLUMN IF NOT EXISTS so_lieu_row_meta jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.fp_farm_bao_cao_so_che_ct.so_lieu_row_meta IS
  'Theo từng khóa chỉ tiêu (sl_buong_ton_dau_ngay, tong_buong_thu_hoach, …): { "ghi_chu": "...", "don_vi_tinh_phu": "..." }';
