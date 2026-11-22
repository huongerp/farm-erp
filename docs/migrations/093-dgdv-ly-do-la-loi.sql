-- =============================================================================
-- 093-dgdv-ly-do-la-loi.sql — Đánh giá đầu vào: cờ «Lỗi» cho lý do nhóm Đánh giá
--
-- Mỗi lý do chọn nhanh của ô «Đánh giá» (loai = danh_gia) nay có thêm cờ la_loi:
-- lý do đó là lỗi hay không (vd «Chuột phá» = lỗi, «Căng trái» = không).
-- Nhóm «Lý do huỷ (KSC)» (loai = loi) không dùng cờ này — app luôn ghi false.
-- Không đổi báo cáo / tổng hợp. Ghi qua PostgREST, RLS có sẵn của bảng đã phủ cột mới.
--
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/093-dgdv-ly-do-la-loi.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_var_dgdv_ly_do ADD COLUMN IF NOT EXISTS la_loi boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.fp_var_dgdv_ly_do.la_loi IS
  'Lý do đánh giá này là lỗi; chỉ dùng cho loai = danh_gia (nhóm Lý do huỷ KSC luôn false)';

COMMIT;

NOTIFY pgrst, 'reload schema';
