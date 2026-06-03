-- Thêm cột người tạo cho bảng đợt kiểm kê kho đã triển khai trước đó (idempotent).
-- Sau script: dữ liệu cũ id_nguoi_tao = id_nguoi_phu_trach; đợt mới do app ghi id_nguoi_tao = user đăng nhập (không copy phụ trách).
ALTER TABLE public.fp_mh_dot_kiem_ke_kho
  ADD COLUMN IF NOT EXISTS id_nguoi_tao bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.id_nguoi_tao IS 'Người tạo đợt → fp_var_nhan_vien(id)';

CREATE INDEX IF NOT EXISTS idx_fp_mh_dot_kiem_ke_kho_id_nguoi_tao
  ON public.fp_mh_dot_kiem_ke_kho(id_nguoi_tao);

-- Dữ liệu cũ: chưa có người tạo → gán bằng người phụ trách (đợt tạo trước khi có cột id_nguoi_tao).
UPDATE public.fp_mh_dot_kiem_ke_kho
SET id_nguoi_tao = id_nguoi_phu_trach
WHERE id_nguoi_tao IS NULL
  AND id_nguoi_phu_trach IS NOT NULL;
