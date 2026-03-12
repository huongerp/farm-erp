-- =============================================================================
-- Thiết lập điểm cộng trừ (Add/Deduct points setup) – Hành chính / Thiết lập công lương
-- Chạy trong Supabase Dashboard → SQL Editor
-- Danh mục hạng mục điểm cộng/trừ: mã, tên, loại (cong | tru), thứ tự, ghi chú, trạng thái.
-- Dùng trong module Điểm cộng trừ và Bảng lương.
-- Trạng thái: text 'Đang hoạt động' | 'Ngừng hoạt động'.
-- =============================================================================

DROP TABLE IF EXISTS public.fp_hr_thiet_lap_diem_cong_tru;

CREATE TABLE public.fp_hr_thiet_lap_diem_cong_tru (
  id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma           text NOT NULL,
  ten          text NOT NULL,
  loai         text NOT NULL,
  thu_tu       integer NOT NULL DEFAULT 0,
  ghi_chu      text,
  trang_thai   text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao       timestamptz DEFAULT now(),
  tg_cap_nhat  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_hr_thiet_lap_diem_cong_tru IS 'Danh mục hạng mục điểm cộng trừ – Thiết lập công lương, dùng trong module Điểm cộng trừ';
COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.ma IS 'Mã hạng mục (VD: VUOT_KPI, DI_MUON)';
COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.ten IS 'Tên hiển thị (VD: Hoàn thành vượt KPI, Đi muộn)';
COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.loai IS 'Loại: cong (cộng điểm) | tru (trừ điểm)';
COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.thu_tu IS 'Thứ tự sắp xếp';
COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.ghi_chu IS 'Ghi chú tùy chọn';
COMMENT ON COLUMN public.fp_hr_thiet_lap_diem_cong_tru.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';

CREATE UNIQUE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_ma ON public.fp_hr_thiet_lap_diem_cong_tru(ma);
CREATE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_loai ON public.fp_hr_thiet_lap_diem_cong_tru(loai);
CREATE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_thu_tu ON public.fp_hr_thiet_lap_diem_cong_tru(thu_tu);
CREATE INDEX idx_fp_hr_thiet_lap_diem_cong_tru_trang_thai ON public.fp_hr_thiet_lap_diem_cong_tru(trang_thai);

-- Trigger: cập nhật tg_cap_nhat khi UPDATE
CREATE OR REPLACE FUNCTION fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat
  BEFORE UPDATE ON public.fp_hr_thiet_lap_diem_cong_tru
  FOR EACH ROW EXECUTE PROCEDURE fp_hr_thiet_lap_diem_cong_tru_tg_cap_nhat();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.fp_hr_thiet_lap_diem_cong_tru ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_hr_thiet_lap_diem_cong_tru" ON public.fp_hr_thiet_lap_diem_cong_tru
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Dữ liệu mẫu (tùy chọn – xóa hoặc chỉnh nếu không cần)
-- =============================================================================

INSERT INTO public.fp_hr_thiet_lap_diem_cong_tru (ma, ten, loai, thu_tu, ghi_chu, trang_thai)
VALUES
  ('VUOT_KPI', 'Hoàn thành vượt KPI', 'cong', 1, 'Đạt trên 100% chỉ tiêu', 'Đang hoạt động'),
  ('SANG_KIEN', 'Sáng kiến cải tiến', 'cong', 2, 'Đề xuất được áp dụng', 'Đang hoạt động'),
  ('CHUYEN_CAN', 'Chuyên cần (không đi trễ/về sớm)', 'cong', 3, NULL, 'Đang hoạt động'),
  ('DI_MUON', 'Đi muộn', 'tru', 10, NULL, 'Đang hoạt động'),
  ('VE_SOM', 'Về sớm', 'tru', 11, NULL, 'Đang hoạt động'),
  ('VI_PHAM_NOI_QUY', 'Vi phạm nội quy', 'tru', 12, NULL, 'Đang hoạt động');
