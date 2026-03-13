-- =============================================================================
-- Khấu hao tài sản (Asset depreciation) – Hành chính / Tài sản
-- Chạy trong Supabase Dashboard → SQL Editor
-- Bảng: (1) Kỳ khấu hao (tháng/năm), (2) Chi tiết khấu hao theo tài sản.
-- Phụ thuộc: fp_ts_tai_san, fp_ts_nhom_tai_san (Thiết lập tài sản đã chạy).
-- Khi chốt kỳ: cập nhật gia_tri_con_lai, khau_hao_luy_ke trên fp_ts_tai_san.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Kỳ khấu hao (một tháng trong một năm)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.fp_ts_chi_tiet_khau_hao;
DROP TABLE IF EXISTS public.fp_ts_ky_khau_hao;

CREATE TABLE public.fp_ts_ky_khau_hao (
  id                bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  thang             smallint NOT NULL CHECK (thang >= 1 AND thang <= 12),
  nam               smallint NOT NULL CHECK (nam >= 2000 AND nam <= 2100),
  trang_thai        text NOT NULL DEFAULT 'draft' CHECK (trang_thai IN ('draft', 'chot')),
  tong_nguyen_gia   numeric(18,2),
  tong_khau_hao_ky  numeric(18,2),
  ghi_chu           text,
  id_nguoi_tao      bigint,
  ten_nguoi_tao     text,
  tg_tao            timestamptz DEFAULT now(),
  tg_cap_nhat       timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_ts_ky_khau_hao IS 'Kỳ khấu hao tài sản – một tháng trong một năm. draft = nháp (tính toán, sửa/xóa được); chot = đã chốt (cập nhật sổ tài sản).';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.thang IS 'Tháng (1–12)';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.nam IS 'Năm (VD: 2025)';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.trang_thai IS 'draft = Nháp | chot = Đã chốt';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.tong_nguyen_gia IS 'Tổng nguyên giá các tài sản trong kỳ (tính từ chi tiết khi Tính toán)';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.tong_khau_hao_ky IS 'Tổng khấu hao kỳ (tính từ chi tiết)';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.ghi_chu IS 'Ghi chú kỳ khấu hao';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.id_nguoi_tao IS 'ID người tạo kỳ (tham chiếu nhân viên)';
COMMENT ON COLUMN public.fp_ts_ky_khau_hao.ten_nguoi_tao IS 'Tên người tạo (lưu tắt khi tạo)';

CREATE UNIQUE INDEX idx_fp_ts_ky_khau_hao_thang_nam ON public.fp_ts_ky_khau_hao(thang, nam);
CREATE INDEX idx_fp_ts_ky_khau_hao_trang_thai ON public.fp_ts_ky_khau_hao(trang_thai);
CREATE INDEX idx_fp_ts_ky_khau_hao_nam_thang ON public.fp_ts_ky_khau_hao(nam, thang);

CREATE OR REPLACE FUNCTION fp_ts_ky_khau_hao_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_ky_khau_hao_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_ky_khau_hao
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_ky_khau_hao_tg_cap_nhat();

ALTER TABLE public.fp_ts_ky_khau_hao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_ts_ky_khau_hao" ON public.fp_ts_ky_khau_hao
  FOR DELETE TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 2. Chi tiết khấu hao — một dòng = một tài sản trong kỳ
-- -----------------------------------------------------------------------------

CREATE TABLE public.fp_ts_chi_tiet_khau_hao (
  id                      bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_ky_khau_hao          bigint NOT NULL,
  id_tai_san              bigint NOT NULL,
  ma_tai_san              text,
  ten_tai_san             text,
  id_nhom                 bigint NOT NULL,
  ten_nhom                text,
  nguyen_gia              numeric(18,2) NOT NULL DEFAULT 0,
  gia_tri_con_lai_dau_ky  numeric(18,2) NOT NULL DEFAULT 0,
  khau_hao_ky             numeric(18,2) NOT NULL DEFAULT 0,
  khau_hao_luy_ke         numeric(18,2) NOT NULL DEFAULT 0,
  gia_tri_con_lai_cuoi_ky numeric(18,2) NOT NULL DEFAULT 0,
  ten_noi_luu             text,
  ten_nguoi_giu           text,
  id_nguoi_tao            bigint,
  ten_nguoi_tao           text,
  tg_tao                  timestamptz DEFAULT now(),
  tg_cap_nhat             timestamptz DEFAULT now(),
  CONSTRAINT fk_fp_ts_chi_tiet_khau_hao_ky FOREIGN KEY (id_ky_khau_hao) REFERENCES public.fp_ts_ky_khau_hao(id) ON DELETE CASCADE,
  CONSTRAINT fk_fp_ts_chi_tiet_khau_hao_tai_san FOREIGN KEY (id_tai_san) REFERENCES public.fp_ts_tai_san(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.fp_ts_chi_tiet_khau_hao IS 'Chi tiết khấu hao theo tài sản trong từng kỳ. Sinh ra khi bấm Tính toán; dùng để chốt kỳ cập nhật fp_ts_tai_san.gia_tri_con_lai, khau_hao_luy_ke.';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_ky_khau_hao IS 'FK → fp_ts_ky_khau_hao(id)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_tai_san IS 'FK → fp_ts_tai_san(id)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ma_tai_san IS 'Mã tài sản (lưu tắt khi tạo chi tiết)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_tai_san IS 'Tên tài sản (lưu tắt)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_nhom IS 'ID nhóm tài sản (từ tài sản)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_nhom IS 'Tên nhóm (lưu tắt)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.nguyen_gia IS 'Nguyên giá tài sản tại thời điểm tính';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.gia_tri_con_lai_dau_ky IS 'Giá trị còn lại đầu kỳ (trước khi trích khấu hao kỳ)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.khau_hao_ky IS 'Số tiền khấu hao trong kỳ (1 tháng)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.khau_hao_luy_ke IS 'Khấu hao lũy kế sau kỳ (đầu kỳ + khấu hao kỳ)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.gia_tri_con_lai_cuoi_ky IS 'Giá trị còn lại cuối kỳ (ghi vào fp_ts_tai_san khi chốt)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_noi_luu IS 'Tên nơi lưu (lưu tắt)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_nguoi_giu IS 'Tên nhân viên đang giữ (lưu tắt)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.id_nguoi_tao IS 'ID người tạo/tính toán (có thể = người tạo kỳ)';
COMMENT ON COLUMN public.fp_ts_chi_tiet_khau_hao.ten_nguoi_tao IS 'Tên người tạo (lưu tắt)';

CREATE UNIQUE INDEX idx_fp_ts_chi_tiet_khau_hao_ky_tai_san ON public.fp_ts_chi_tiet_khau_hao(id_ky_khau_hao, id_tai_san);
CREATE INDEX idx_fp_ts_chi_tiet_khau_hao_id_ky ON public.fp_ts_chi_tiet_khau_hao(id_ky_khau_hao);
CREATE INDEX idx_fp_ts_chi_tiet_khau_hao_id_tai_san ON public.fp_ts_chi_tiet_khau_hao(id_tai_san);
CREATE INDEX idx_fp_ts_chi_tiet_khau_hao_id_nhom ON public.fp_ts_chi_tiet_khau_hao(id_nhom);

CREATE OR REPLACE FUNCTION fp_ts_chi_tiet_khau_hao_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_chi_tiet_khau_hao_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_chi_tiet_khau_hao
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_chi_tiet_khau_hao_tg_cap_nhat();

ALTER TABLE public.fp_ts_chi_tiet_khau_hao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_ts_chi_tiet_khau_hao" ON public.fp_ts_chi_tiet_khau_hao
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Ghi chú triển khai
-- =============================================================================
-- 1. Chạy script sau khi đã có: fp_ts_tai_san, fp_ts_nhom_tai_san (supabase-fp_ts_tai_san.sql, supabase-fp_ts_thiet_lap_tai_san.sql).
-- 2. Ứng dụng: Tạo kỳ (tháng/năm) → Gọi API/action "Tính toán" để insert/refresh fp_ts_chi_tiet_khau_hao và cập nhật tong_nguyen_gia, tong_khau_hao_ky trên fp_ts_ky_khau_hao.
-- 3. Chốt kỳ: Cập nhật fp_ts_tai_san.gia_tri_con_lai = chi_tiet.gia_tri_con_lai_cuoi_ky, khau_hao_luy_ke = chi_tiet.khau_hao_luy_ke cho từng dòng chi tiết; sau đó set fp_ts_ky_khau_hao.trang_thai = 'chot'.
-- 4. Ràng buộc nghiệp vụ: Chỉ cho phép sửa/xóa kỳ khi trang_thai = 'draft'; chỉ cho phép Tính toán khi kỳ draft; chỉ cho phép Chốt khi đã có ít nhất một chi tiết.
