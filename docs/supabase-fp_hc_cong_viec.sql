-- =============================================================================
-- Công việc (Tasks) – Hành chính / Module Công việc
-- Chạy trong Supabase Dashboard → SQL Editor
-- Bảng độc lập. ID int8. Trao đổi trong trao_doi (jsonb). Báo cáo kết quả: ket_qua, link_ket_qua.
-- =============================================================================

DROP TABLE IF EXISTS public.fp_hc_cong_viec;
CREATE SEQUENCE IF NOT EXISTS fp_hc_cong_viec_id_seq;

CREATE TABLE public.fp_hc_cong_viec (
  id                bigint PRIMARY KEY DEFAULT nextval('fp_hc_cong_viec_id_seq'::regclass),
  tieu_de           text NOT NULL,
  mo_ta             text,
  id_cha            bigint,
  id_nguoi_giao     bigint NOT NULL,
  trach_nhiem       bigint,
  nguoi_ho_tro      bigint[] NOT NULL DEFAULT '{}',
  uu_tien           text NOT NULL DEFAULT 'trung_binh',
  trang_thai        text NOT NULL DEFAULT 'draft',
  tg_tao            timestamptz NOT NULL DEFAULT now(),
  tg_cap_nhat       timestamptz NOT NULL DEFAULT now(),
  trao_doi          jsonb NOT NULL DEFAULT '[]',
  ket_qua           text,
  link_ket_qua      text,
  CONSTRAINT fk_fp_hc_cong_viec_id_cha
    FOREIGN KEY (id_cha) REFERENCES public.fp_hc_cong_viec(id) ON DELETE SET NULL
);

ALTER SEQUENCE fp_hc_cong_viec_id_seq OWNED BY public.fp_hc_cong_viec.id;

COMMENT ON TABLE public.fp_hc_cong_viec IS 'Công việc – Module Công việc hành chính. Trao đổi trong trao_doi; báo cáo kết quả: ket_qua, link_ket_qua.';
COMMENT ON COLUMN public.fp_hc_cong_viec.id IS 'PK, int8';
COMMENT ON COLUMN public.fp_hc_cong_viec.tieu_de IS 'Tiêu đề công việc';
COMMENT ON COLUMN public.fp_hc_cong_viec.mo_ta IS 'Mô tả chi tiết';
COMMENT ON COLUMN public.fp_hc_cong_viec.id_cha IS 'ID công việc cha (công việc con), self-reference int8';
COMMENT ON COLUMN public.fp_hc_cong_viec.id_nguoi_giao IS 'ID người giao việc (int8)';
COMMENT ON COLUMN public.fp_hc_cong_viec.trach_nhiem IS 'ID người chịu trách nhiệm chính (int8)';
COMMENT ON COLUMN public.fp_hc_cong_viec.nguoi_ho_tro IS 'Mảng ID người hỗ trợ (bigint[])';
COMMENT ON COLUMN public.fp_hc_cong_viec.uu_tien IS 'Ưu tiên: cao | trung_binh | thap';
COMMENT ON COLUMN public.fp_hc_cong_viec.trang_thai IS 'Trạng thái: draft | dang_thuc_hien | cho_bao_cao | hoan_thanh | huy';
COMMENT ON COLUMN public.fp_hc_cong_viec.trao_doi IS 'Mảng trao đổi/bình luận. Mỗi phần tử: { "id": "...", "noi_dung": "...", "nguoi_gui_id": "...", "ten_nguoi_gui": "...", "tg_gui": "ISO8601" }';
COMMENT ON COLUMN public.fp_hc_cong_viec.ket_qua IS 'Nội dung báo cáo kết quả';
COMMENT ON COLUMN public.fp_hc_cong_viec.link_ket_qua IS 'Link đính kèm báo cáo kết quả';

CREATE INDEX idx_fp_hc_cong_viec_id_cha ON public.fp_hc_cong_viec(id_cha);
CREATE INDEX idx_fp_hc_cong_viec_id_nguoi_giao ON public.fp_hc_cong_viec(id_nguoi_giao);
CREATE INDEX idx_fp_hc_cong_viec_trach_nhiem ON public.fp_hc_cong_viec(trach_nhiem);
CREATE INDEX idx_fp_hc_cong_viec_nguoi_ho_tro ON public.fp_hc_cong_viec USING GIN (nguoi_ho_tro);
CREATE INDEX idx_fp_hc_cong_viec_trang_thai ON public.fp_hc_cong_viec(trang_thai);
CREATE INDEX idx_fp_hc_cong_viec_tg_tao ON public.fp_hc_cong_viec(tg_tao);

-- Trigger: cập nhật tg_cap_nhat khi UPDATE
CREATE OR REPLACE FUNCTION fp_hc_cong_viec_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_hc_cong_viec_tg_cap_nhat
  BEFORE UPDATE ON public.fp_hc_cong_viec
  FOR EACH ROW EXECUTE PROCEDURE fp_hc_cong_viec_tg_cap_nhat();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE public.fp_hc_cong_viec ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_hc_cong_viec" ON public.fp_hc_cong_viec
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_hc_cong_viec" ON public.fp_hc_cong_viec
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_hc_cong_viec" ON public.fp_hc_cong_viec
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_hc_cong_viec" ON public.fp_hc_cong_viec
  FOR DELETE TO authenticated USING (true);
