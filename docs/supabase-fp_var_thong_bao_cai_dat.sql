-- =============================================================================
-- Cài đặt thông báo của từng nhân viên
--
-- NGUYÊN TẮC: mặc định BẬT HẾT. Bảng này chỉ lưu NGOẠI LỆ — không có dòng nghĩa
-- là bật cả trong app lẫn push. Nhờ vậy không phải seed 7 module × n loại sự kiện
-- × n nhân viên dòng, và nhân viên mới vào là có thông báo ngay.
--
-- Thứ tự chạy: SAU supabase-fp_var_thong_bao.sql.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_var_thong_bao_cai_dat (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nhan_vien_id  bigint      NOT NULL REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE,
  module_id     text        NOT NULL,
  loai_su_kien  text        NOT NULL DEFAULT '*',
  trong_app     boolean     NOT NULL DEFAULT true,
  push          boolean     NOT NULL DEFAULT true,
  tg_cap_nhat   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_fp_var_thong_bao_cai_dat UNIQUE (nhan_vien_id, module_id, loai_su_kien)
);

COMMENT ON TABLE public.fp_var_thong_bao_cai_dat IS
  'Ngoại lệ cài đặt thông báo. Không có dòng = bật cả trong app lẫn push (mặc định của hệ thống).';
COMMENT ON COLUMN public.fp_var_thong_bao_cai_dat.loai_su_kien IS
  '''*'' = áp cho cả module. Dòng cụ thể theo loại sự kiện thắng dòng ''*''.';
COMMENT ON COLUMN public.fp_var_thong_bao_cai_dat.trong_app IS 'false = không vào chuông';
COMMENT ON COLUMN public.fp_var_thong_bao_cai_dat.push IS 'false = vẫn vào chuông nhưng không đẩy ra màn hình khoá';

CREATE INDEX IF NOT EXISTS idx_fp_var_thong_bao_cai_dat_nv
  ON public.fp_var_thong_bao_cai_dat (nhan_vien_id);

-- =============================================================================
-- Tuỳ chọn chung mỗi nhân viên: công tắc push tổng và giờ yên lặng
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_var_thong_bao_tuy_chon (
  nhan_vien_id      bigint      PRIMARY KEY REFERENCES public.fp_var_nhan_vien(id) ON DELETE CASCADE,
  push_bat          boolean     NOT NULL DEFAULT true,
  gio_yen_lang_bat  boolean     NOT NULL DEFAULT true,
  gio_yen_lang_tu   smallint    NOT NULL DEFAULT 21,
  gio_yen_lang_den  smallint    NOT NULL DEFAULT 6,
  tg_cap_nhat       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ck_gio_yen_lang_tu  CHECK (gio_yen_lang_tu  BETWEEN 0 AND 23),
  CONSTRAINT ck_gio_yen_lang_den CHECK (gio_yen_lang_den BETWEEN 0 AND 23)
);

COMMENT ON TABLE public.fp_var_thong_bao_tuy_chon IS
  'Tuỳ chọn thông báo chung mỗi nhân viên. Không có dòng = dùng mặc định: push bật, yên lặng 21h–6h.';
COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.push_bat IS
  'Công tắc tổng. false = tắt hẳn push mọi module, chuông trong app vẫn chạy.';
COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.gio_yen_lang_bat IS
  'Trong giờ yên lặng, sự kiện vẫn vào chuông nhưng không rung điện thoại.';
COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.gio_yen_lang_tu IS 'Giờ bắt đầu yên lặng, theo múi giờ công ty (0–23)';
COMMENT ON COLUMN public.fp_var_thong_bao_tuy_chon.gio_yen_lang_den IS 'Giờ kết thúc yên lặng (0–23). Nhỏ hơn giờ bắt đầu nghĩa là khoảng vắt qua nửa đêm.';

-- =============================================================================
-- RLS — mỗi người chỉ đọc/sửa cài đặt của chính mình
-- =============================================================================

ALTER TABLE public.fp_var_thong_bao_cai_dat  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp_var_thong_bao_tuy_chon ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cài đặt thông báo của mình" ON public.fp_var_thong_bao_cai_dat;
CREATE POLICY "Cài đặt thông báo của mình" ON public.fp_var_thong_bao_cai_dat
  FOR ALL TO authenticated
  USING (nhan_vien_id = public.nhan_vien_hien_tai_id())
  WITH CHECK (nhan_vien_id = public.nhan_vien_hien_tai_id());

DROP POLICY IF EXISTS "Tuỳ chọn thông báo của mình" ON public.fp_var_thong_bao_tuy_chon;
CREATE POLICY "Tuỳ chọn thông báo của mình" ON public.fp_var_thong_bao_tuy_chon
  FOR ALL TO authenticated
  USING (nhan_vien_id = public.nhan_vien_hien_tai_id())
  WITH CHECK (nhan_vien_id = public.nhan_vien_hien_tai_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fp_var_thong_bao_cai_dat  TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.fp_var_thong_bao_tuy_chon TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.fp_var_thong_bao_cai_dat_id_seq TO authenticated;

-- Worker chỉ cần ĐỌC để quyết định có gửi push hay không — và cần policy riêng
-- vì nó kết nối bằng role notify_service, không mang JWT của ai cả.
DROP POLICY IF EXISTS "Worker đọc cài đặt thông báo" ON public.fp_var_thong_bao_cai_dat;
CREATE POLICY "Worker đọc cài đặt thông báo" ON public.fp_var_thong_bao_cai_dat
  FOR SELECT TO notify_service USING (true);

DROP POLICY IF EXISTS "Worker đọc tuỳ chọn thông báo" ON public.fp_var_thong_bao_tuy_chon;
CREATE POLICY "Worker đọc tuỳ chọn thông báo" ON public.fp_var_thong_bao_tuy_chon
  FOR SELECT TO notify_service USING (true);

GRANT SELECT ON public.fp_var_thong_bao_cai_dat  TO notify_service;
GRANT SELECT ON public.fp_var_thong_bao_tuy_chon TO notify_service;

CREATE OR REPLACE FUNCTION public.fp_var_thong_bao_cai_dat_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_var_thong_bao_cai_dat_tg_cap_nhat ON public.fp_var_thong_bao_cai_dat;
CREATE TRIGGER tr_fp_var_thong_bao_cai_dat_tg_cap_nhat
  BEFORE UPDATE ON public.fp_var_thong_bao_cai_dat
  FOR EACH ROW EXECUTE PROCEDURE public.fp_var_thong_bao_cai_dat_tg_cap_nhat();

DROP TRIGGER IF EXISTS tr_fp_var_thong_bao_tuy_chon_tg_cap_nhat ON public.fp_var_thong_bao_tuy_chon;
CREATE TRIGGER tr_fp_var_thong_bao_tuy_chon_tg_cap_nhat
  BEFORE UPDATE ON public.fp_var_thong_bao_tuy_chon
  FOR EACH ROW EXECUTE PROCEDURE public.fp_var_thong_bao_cai_dat_tg_cap_nhat();
