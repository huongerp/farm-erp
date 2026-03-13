-- =============================================================================
-- Nơi quản lý (Management location) – Hành chính
-- Chạy trong Supabase Dashboard → SQL Editor
-- Danh mục nơi quản lý: phòng ban, chi nhánh, kho, vị trí… Dùng cho tài sản, công việc, v.v.
-- =============================================================================

DROP TABLE IF EXISTS public.fp_hc_noi_quan_ly;

CREATE TABLE public.fp_hc_noi_quan_ly (
  id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_chi_nhanh   bigint NOT NULL,
  ten_chi_nhanh  text,
  ma             text NOT NULL,
  ten            text NOT NULL,
  thu_tu          integer NOT NULL DEFAULT 1,
  ghi_chu        text,
  trang_thai     text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao         timestamptz DEFAULT now(),
  tg_cap_nhat    timestamptz DEFAULT now(),
  CONSTRAINT fk_fp_hc_noi_quan_ly_chi_nhanh
    FOREIGN KEY (id_chi_nhanh) REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT
);

COMMENT ON TABLE public.fp_hc_noi_quan_ly IS 'Danh mục nơi quản lý – Hành chính, theo chi nhánh. ten_chi_nhanh đồng bộ từ fp_var_chi_nhanh.';
COMMENT ON COLUMN public.fp_hc_noi_quan_ly.id_chi_nhanh IS 'FK → fp_var_chi_nhanh(id)';
COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ten_chi_nhanh IS 'Tên chi nhánh (lấy từ fp_var_chi_nhanh, trigger sync)';
COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ma IS 'Mã nơi quản lý (VD: PB_KT, KHO_A)';
COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ten IS 'Tên hiển thị nơi quản lý';
COMMENT ON COLUMN public.fp_hc_noi_quan_ly.thu_tu IS 'Thứ tự sắp xếp, default 1';
COMMENT ON COLUMN public.fp_hc_noi_quan_ly.ghi_chu IS 'Ghi chú tùy chọn';
COMMENT ON COLUMN public.fp_hc_noi_quan_ly.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';

CREATE INDEX idx_fp_hc_noi_quan_ly_id_chi_nhanh ON public.fp_hc_noi_quan_ly(id_chi_nhanh);
CREATE UNIQUE INDEX idx_fp_hc_noi_quan_ly_ma_chi_nhanh ON public.fp_hc_noi_quan_ly(ma, id_chi_nhanh);
CREATE INDEX idx_fp_hc_noi_quan_ly_thu_tu ON public.fp_hc_noi_quan_ly(thu_tu);
CREATE INDEX idx_fp_hc_noi_quan_ly_trang_thai ON public.fp_hc_noi_quan_ly(trang_thai);

-- Trigger: đồng bộ ten_chi_nhanh từ fp_var_chi_nhanh khi INSERT/UPDATE id_chi_nhanh
CREATE OR REPLACE FUNCTION fp_hc_noi_quan_ly_sync_ten_chi_nhanh()
RETURNS TRIGGER AS $$
BEGIN
  SELECT ten_chi_nhanh INTO NEW.ten_chi_nhanh
  FROM public.fp_var_chi_nhanh
  WHERE id = NEW.id_chi_nhanh;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_hc_noi_quan_ly_sync_ten_chi_nhanh
  BEFORE INSERT OR UPDATE OF id_chi_nhanh ON public.fp_hc_noi_quan_ly
  FOR EACH ROW EXECUTE PROCEDURE fp_hc_noi_quan_ly_sync_ten_chi_nhanh();

CREATE OR REPLACE FUNCTION fp_hc_noi_quan_ly_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_hc_noi_quan_ly_tg_cap_nhat
  BEFORE UPDATE ON public.fp_hc_noi_quan_ly
  FOR EACH ROW EXECUTE PROCEDURE fp_hc_noi_quan_ly_tg_cap_nhat();

ALTER TABLE public.fp_hc_noi_quan_ly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_hc_noi_quan_ly" ON public.fp_hc_noi_quan_ly
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Dữ liệu mẫu (tùy chọn – chạy sau khi đã có fp_var_chi_nhanh; đổi id_chi_nhanh cho đúng)
-- ten_chi_nhanh tự điền bằng trigger từ chi nhánh.
-- =============================================================================

-- INSERT INTO public.fp_hc_noi_quan_ly (id_chi_nhanh, ma, ten, thu_tu, ghi_chu, trang_thai)
-- VALUES
--   (1, 'VP_GD', 'Văn phòng Giám đốc', 1, NULL, 'Đang hoạt động'),
--   (1, 'PB_KT', 'Phòng Kế toán', 1, NULL, 'Đang hoạt động'),
--   (1, 'PB_NS', 'Phòng Nhân sự', 1, NULL, 'Đang hoạt động'),
--   (2, 'VP_GD', 'Văn phòng Giám đốc', 1, NULL, 'Đang hoạt động'),
--   (2, 'KHO_TS', 'Kho tài sản', 1, 'Nơi lưu trữ tài sản', 'Đang hoạt động');
