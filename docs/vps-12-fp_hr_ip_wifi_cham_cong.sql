-- =============================================================================
-- IP wifi chấm công theo chi nhánh — Hành chính / Thiết lập công lương / tab IP wifi
-- Chạy trên VPS: psql "$VPS_DB_URL" -f docs/vps-12-fp_hr_ip_wifi_cham_cong.sql
--
-- Trước file này module dùng dữ liệu giả trong bộ nhớ trình duyệt (tải lại trang là mất).
-- Chạy lại được: CREATE ... IF NOT EXISTS, policy DROP rồi tạo lại.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_hr_ip_wifi_cham_cong (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_chi_nhanh  bigint NOT NULL REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT,
  ten_chi_nhanh text,
  ip_wifi       text NOT NULL,
  ghi_chu       text,
  trang_thai    text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao        timestamptz NOT NULL DEFAULT now(),
  tg_cap_nhat   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_fp_hr_ip_wifi_trang_thai CHECK (trang_thai IN ('Đang hoạt động', 'Ngừng hoạt động')),
  -- Cùng một IP không khai hai lần cho một chi nhánh (import và form đều dựa vào ràng buộc này).
  CONSTRAINT uq_fp_hr_ip_wifi_chi_nhanh_ip UNIQUE (id_chi_nhanh, ip_wifi)
);

COMMENT ON TABLE public.fp_hr_ip_wifi_cham_cong IS 'IP wifi hợp lệ để chấm công theo chi nhánh';
COMMENT ON COLUMN public.fp_hr_ip_wifi_cham_cong.ten_chi_nhanh IS 'Snapshot tên chi nhánh lúc lưu';
COMMENT ON COLUMN public.fp_hr_ip_wifi_cham_cong.ip_wifi IS 'IPv4 công khai của wifi (đã trim)';

CREATE INDEX IF NOT EXISTS idx_fp_hr_ip_wifi_id_chi_nhanh ON public.fp_hr_ip_wifi_cham_cong(id_chi_nhanh);

CREATE OR REPLACE FUNCTION public.fp_hr_ip_wifi_cham_cong_tg_cap_nhat()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_fp_hr_ip_wifi_cham_cong_tg_cap_nhat ON public.fp_hr_ip_wifi_cham_cong;
CREATE TRIGGER tr_fp_hr_ip_wifi_cham_cong_tg_cap_nhat
  BEFORE UPDATE ON public.fp_hr_ip_wifi_cham_cong
  FOR EACH ROW EXECUTE FUNCTION public.fp_hr_ip_wifi_cham_cong_tg_cap_nhat();

-- -----------------------------------------------------------------------------
-- RLS + GRANT — cùng mức với các bảng thiết lập khác của module (fp_hr_thiet_lap_diem_cong_tru).
-- Cổng ai được thêm/sửa/xoá nằm ở tầng app (ModulePermissionGuard).
-- -----------------------------------------------------------------------------
ALTER TABLE public.fp_hr_ip_wifi_cham_cong ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fp_hr_ip_wifi_select ON public.fp_hr_ip_wifi_cham_cong;
DROP POLICY IF EXISTS fp_hr_ip_wifi_insert ON public.fp_hr_ip_wifi_cham_cong;
DROP POLICY IF EXISTS fp_hr_ip_wifi_update ON public.fp_hr_ip_wifi_cham_cong;
DROP POLICY IF EXISTS fp_hr_ip_wifi_delete ON public.fp_hr_ip_wifi_cham_cong;

CREATE POLICY fp_hr_ip_wifi_select ON public.fp_hr_ip_wifi_cham_cong
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_hr_ip_wifi_insert ON public.fp_hr_ip_wifi_cham_cong
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fp_hr_ip_wifi_update ON public.fp_hr_ip_wifi_cham_cong
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fp_hr_ip_wifi_delete ON public.fp_hr_ip_wifi_cham_cong
  FOR DELETE TO authenticated USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fp_hr_ip_wifi_cham_cong TO authenticated;

NOTIFY pgrst, 'reload schema';
