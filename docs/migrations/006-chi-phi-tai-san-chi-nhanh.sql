-- =============================================================================
-- 006-chi-phi-tai-san-chi-nhanh.sql — phiếu bảo trì / sửa chữa lưu chi nhánh.
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/006-chi-phi-tai-san-chi-nhanh.sql
--
-- - Thêm `id_chi_nhanh` + `ten_chi_nhanh`: chi nhánh chọn trên form lúc lập phiếu (ảnh chụp,
--   giống ma_tai_san / ten_tai_san) — tài sản chuyển chi nhánh về sau thì phiếu cũ vẫn giữ.
-- - Phiếu đã có: điền theo chi nhánh HIỆN TẠI của tài sản (không còn dữ liệu cũ hơn);
--   tài sản chưa gán chi nhánh thì để trống.
--   Tắt tạm trigger tg_cap_nhat trong lúc điền để không đổi "cập nhật lúc" của mọi phiếu.
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_ts_chi_phi_tai_san
  ADD COLUMN IF NOT EXISTS id_chi_nhanh bigint,
  ADD COLUMN IF NOT EXISTS ten_chi_nhanh text;

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_chi_nhanh IS
  'Chi nhánh của phiếu (fp_var_chi_nhanh.id) — chọn khi lập phiếu, mặc định theo chi nhánh tài sản.';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.ten_chi_nhanh IS 'Tên chi nhánh (lưu tắt khi tạo/cập nhật)';

CREATE INDEX IF NOT EXISTS idx_fp_ts_chi_phi_tai_san_id_chi_nhanh
  ON public.fp_ts_chi_phi_tai_san (id_chi_nhanh);

ALTER TABLE public.fp_ts_chi_phi_tai_san DISABLE TRIGGER tr_fp_ts_chi_phi_tai_san_tg_cap_nhat;

UPDATE public.fp_ts_chi_phi_tai_san p
SET id_chi_nhanh = ts.id_chi_nhanh,
    ten_chi_nhanh = COALESCE(cn.ten_chi_nhanh, ts.ten_chi_nhanh)
FROM public.fp_ts_tai_san ts
LEFT JOIN public.fp_var_chi_nhanh cn ON cn.id = ts.id_chi_nhanh
WHERE ts.id = p.id_tai_san
  AND p.id_chi_nhanh IS NULL
  AND ts.id_chi_nhanh IS NOT NULL;

ALTER TABLE public.fp_ts_chi_phi_tai_san ENABLE TRIGGER tr_fp_ts_chi_phi_tai_san_tg_cap_nhat;

COMMIT;

NOTIFY pgrst, 'reload schema';
