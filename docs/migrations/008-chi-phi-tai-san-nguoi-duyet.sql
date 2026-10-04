-- =============================================================================
-- 008-chi-phi-tai-san-nguoi-duyet.sql — phiếu bảo trì / sửa chữa ghi người duyệt + điền chi nhánh còn trống.
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/008-chi-phi-tai-san-nguoi-duyet.sql
--
-- 1. Người duyệt: thêm `id_nguoi_duyet` + `tg_duyet`. App ghi khi phiếu chuyển sang Đã duyệt /
--    Không duyệt (cột `nguoi_duyet` giữ họ tên lưu tắt), xoá khi quay về Chờ duyệt.
--    Phiếu cũ không có lịch sử duyệt → để trống.
-- 2. Hai xe dùng chung TS02-XBT01 (id 13) và TS02-XT02 (id 14) trỏ nơi lưu id=1 đã bị xoá nên
--    không có chi nhánh → gán Farm fp2 (theo yêu cầu 04/10/2026), rồi điền chi nhánh cho các
--    phiếu còn trống theo tài sản (tắt tạm trigger tg_cap_nhat như 006).
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_ts_chi_phi_tai_san
  ADD COLUMN IF NOT EXISTS id_nguoi_duyet bigint,
  ADD COLUMN IF NOT EXISTS tg_duyet timestamp with time zone;

COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.id_nguoi_duyet IS
  'Nhân viên duyệt / từ chối phiếu (fp_var_nhan_vien.id); họ tên lưu tắt ở nguoi_duyet.';
COMMENT ON COLUMN public.fp_ts_chi_phi_tai_san.tg_duyet IS 'Thời điểm duyệt / từ chối phiếu';

UPDATE public.fp_ts_tai_san ts
SET id_chi_nhanh = cn.id, ten_chi_nhanh = cn.ten_chi_nhanh
FROM public.fp_var_chi_nhanh cn
WHERE cn.ma_chi_nhanh = 'FP2'
  AND ts.id IN (13, 14)
  AND ts.id_chi_nhanh IS NULL;

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
