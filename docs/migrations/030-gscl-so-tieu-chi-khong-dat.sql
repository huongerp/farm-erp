-- =============================================================================
-- 030-gscl-so-tieu-chi-khong-dat.sql — Giám sát chất lượng: quy tắc kết luận theo số tiêu chí
-- Trước đây chỉ cần 1 tiêu chí vượt ngưỡng là cây hàng KHÔNG ĐẠT. Nay đặt ở popup Cài đặt:
-- cây hàng KHÔNG ĐẠT khi số tiêu chí không đạt >= so_tieu_chi_khong_dat (mặc định 3).
-- App đọc giá trị này khi tính kết luận (core/ket-luan.ts → ketLuanPhieu).
-- Bảng một dòng (id = 1). Đọc: mọi tài khoản đăng nhập; sửa: cấp cao (cùng quyền sửa tiêu chí, 013).
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-030
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/030-gscl-so-tieu-chi-khong-dat.sql
-- =============================================================================

BEGIN;

CREATE TABLE public.fp_farm_gscl_cai_dat (
    id smallint DEFAULT 1 PRIMARY KEY,
    so_tieu_chi_khong_dat integer DEFAULT 3 NOT NULL,
    tg_tao timestamp with time zone DEFAULT now() NOT NULL,
    tg_cap_nhat timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT fp_farm_gscl_cai_dat_mot_dong CHECK (id = 1),
    CONSTRAINT fp_farm_gscl_cai_dat_so_tc_check CHECK (so_tieu_chi_khong_dat BETWEEN 1 AND 100)
);

COMMENT ON TABLE public.fp_farm_gscl_cai_dat IS 'Giám sát chất lượng: cài đặt chung (một dòng id = 1)';
COMMENT ON COLUMN public.fp_farm_gscl_cai_dat.so_tieu_chi_khong_dat IS
  'Cây hàng KHÔNG ĐẠT khi có từ chừng này tiêu chí không đạt trở lên';

INSERT INTO public.fp_farm_gscl_cai_dat (id, so_tieu_chi_khong_dat) VALUES (1, 3)
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER trg_update_tg_cap_nhat BEFORE UPDATE ON public.fp_farm_gscl_cai_dat
  FOR EACH ROW EXECUTE FUNCTION public.update_tg_cap_nhat_column();

CREATE TRIGGER trg_nhat_ky_thay_doi AFTER INSERT OR UPDATE OR DELETE ON public.fp_farm_gscl_cai_dat
  FOR EACH ROW EXECUTE FUNCTION public.fn_ghi_nhat_ky_thay_doi();

ALTER TABLE public.fp_farm_gscl_cai_dat ENABLE ROW LEVEL SECURITY;

CREATE POLICY fp_farm_gscl_cai_dat_select_auth ON public.fp_farm_gscl_cai_dat
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_farm_gscl_cai_dat_update_cap_cao ON public.fp_farm_gscl_cai_dat
  FOR UPDATE TO authenticated
  USING (public.fn_co_quyen_module('quan-ly-nha-so-che/giam-sat-chat-luong', ARRAY['admin', 'all']))
  WITH CHECK (public.fn_co_quyen_module('quan-ly-nha-so-che/giam-sat-chat-luong', ARRAY['admin', 'all']));

GRANT SELECT, UPDATE ON TABLE public.fp_farm_gscl_cai_dat TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
