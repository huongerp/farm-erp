-- =============================================================================
-- Điểm cộng trừ (Bonus/Deduction points records) – Hành chính / Điểm cộng trừ
-- Chạy trong Supabase Dashboard → SQL Editor
-- Bản ghi ghi nhận điểm cộng/trừ theo nhân viên, kỳ (năm-tháng), hạng mục (thiết lập tại fp_hr_thiet_lap_diem_cong_tru).
-- Liên kết: id_nhan_vien → fp_var_nhan_vien(id); id_hang_muc → fp_hr_thiet_lap_diem_cong_tru(id).
-- =============================================================================

DROP TABLE IF EXISTS public.fp_hr_diem_cong_tru;

CREATE TABLE public.fp_hr_diem_cong_tru (
  id            bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_nhan_vien  bigint NOT NULL,
  nam           integer NOT NULL,
  thang         integer NOT NULL,
  loai          text NOT NULL,
  id_hang_muc   bigint NOT NULL,
  ten_hang_muc  text,
  diem          integer NOT NULL DEFAULT 0,
  mo_ta         text,
  ghi_chu       text,
  id_nguoi_tao  bigint,
  tg_tao        timestamptz DEFAULT now(),
  tg_cap_nhat   timestamptz DEFAULT now(),
  CONSTRAINT chk_fp_hr_diem_cong_tru_loai CHECK (loai IN ('cong', 'tru')),
  CONSTRAINT chk_fp_hr_diem_cong_tru_nam CHECK (nam >= 2000 AND nam <= 2100),
  CONSTRAINT chk_fp_hr_diem_cong_tru_thang CHECK (thang >= 1 AND thang <= 12),
  CONSTRAINT chk_fp_hr_diem_cong_tru_diem CHECK (diem >= 0),
  CONSTRAINT fk_fp_hr_diem_cong_tru_hang_muc
    FOREIGN KEY (id_hang_muc) REFERENCES public.fp_hr_thiet_lap_diem_cong_tru(id) ON DELETE RESTRICT
);

COMMENT ON TABLE public.fp_hr_diem_cong_tru IS 'Bản ghi điểm cộng/trừ theo nhân viên, kỳ (năm-tháng), hạng mục – Module Điểm cộng trừ';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.id_nhan_vien IS 'Nhân viên được ghi nhận → fp_var_nhan_vien(id)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.nam IS 'Năm áp dụng (2000–2100)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.thang IS 'Tháng áp dụng (1–12)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.loai IS 'Loại: cong (cộng điểm) | tru (trừ điểm)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.id_hang_muc IS 'Hạng mục điểm cộng/trừ → fp_hr_thiet_lap_diem_cong_tru(id)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.ten_hang_muc IS 'Tên hạng mục (lưu tắt khi tạo/cập nhật)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.diem IS 'Số điểm (>= 0)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.mo_ta IS 'Mô tả ngắn (tùy chọn)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.ghi_chu IS 'Ghi chú (tùy chọn)';
COMMENT ON COLUMN public.fp_hr_diem_cong_tru.id_nguoi_tao IS 'Người tạo bản ghi → fp_var_nhan_vien(id)';

CREATE INDEX idx_fp_hr_diem_cong_tru_id_nhan_vien ON public.fp_hr_diem_cong_tru(id_nhan_vien);
CREATE INDEX idx_fp_hr_diem_cong_tru_nam_thang ON public.fp_hr_diem_cong_tru(nam, thang);
CREATE INDEX idx_fp_hr_diem_cong_tru_id_hang_muc ON public.fp_hr_diem_cong_tru(id_hang_muc);
CREATE INDEX idx_fp_hr_diem_cong_tru_id_nguoi_tao ON public.fp_hr_diem_cong_tru(id_nguoi_tao);
CREATE INDEX idx_fp_hr_diem_cong_tru_loai ON public.fp_hr_diem_cong_tru(loai);

-- Trigger: cập nhật tg_cap_nhat khi UPDATE
CREATE OR REPLACE FUNCTION fp_hr_diem_cong_tru_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_hr_diem_cong_tru_tg_cap_nhat
  BEFORE UPDATE ON public.fp_hr_diem_cong_tru
  FOR EACH ROW EXECUTE PROCEDURE fp_hr_diem_cong_tru_tg_cap_nhat();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.fp_hr_diem_cong_tru ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_hr_diem_cong_tru" ON public.fp_hr_diem_cong_tru
  FOR DELETE TO authenticated USING (true);
