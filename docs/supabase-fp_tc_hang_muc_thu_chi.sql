-- =============================================================================
-- Hạng mục thu chi quỹ (Tài chính > Thiết lập quỹ)
-- Danh mục dùng chung toàn công ty — KHÔNG gắn chi nhánh. Nếu sau này cần riêng
-- theo farm thì thêm cột id_chi_nhanh nullable (NULL = dùng chung), không phá dữ liệu cũ.
-- Chạy trước: fp_tc_quy_thu_chi (bảng sổ quỹ tham chiếu bảng này).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_tc_hang_muc_thu_chi (
  id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma           text NOT NULL,
  ten          text NOT NULL,
  loai         text NOT NULL DEFAULT 'ca_hai',
  thu_tu       integer NOT NULL DEFAULT 0,
  ghi_chu      text,
  trang_thai   text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao       timestamptz DEFAULT now(),
  tg_cap_nhat  timestamptz DEFAULT now(),
  CONSTRAINT fp_tc_hang_muc_loai_check CHECK (loai IN ('thu', 'chi', 'ca_hai')),
  CONSTRAINT fp_tc_hang_muc_trang_thai_check CHECK (trang_thai IN ('Đang hoạt động', 'Ngừng hoạt động'))
);

COMMENT ON TABLE public.fp_tc_hang_muc_thu_chi IS 'Hạng mục thu chi quỹ (Vật tư, Chi khác, Bốc khoán, Tạm ứng...) — cấu hình được ở module Thiết lập quỹ';
COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.ma IS 'Mã hạng mục, viết hoa không dấu (VAT_TU, CHI_KHAC...) — duy nhất, dùng khi import Excel';
COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.loai IS 'thu = chỉ dùng cho phiếu thu; chi = chỉ phiếu chi; ca_hai = dùng cho cả hai';
COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.thu_tu IS 'Thứ tự hiển thị trong combobox (nhỏ trước)';
COMMENT ON COLUMN public.fp_tc_hang_muc_thu_chi.trang_thai IS 'Ngừng hoạt động: không hiện trong combobox phiếu mới, phiếu cũ vẫn giữ nguyên';

CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_tc_hang_muc_ma ON public.fp_tc_hang_muc_thu_chi(ma);
CREATE INDEX IF NOT EXISTS idx_fp_tc_hang_muc_thu_tu ON public.fp_tc_hang_muc_thu_chi(thu_tu);
CREATE INDEX IF NOT EXISTS idx_fp_tc_hang_muc_loai_thu_tu ON public.fp_tc_hang_muc_thu_chi(loai, thu_tu);

-- Trigger: cập nhật tg_cap_nhat khi sửa
CREATE OR REPLACE FUNCTION public.fp_tc_hang_muc_thu_chi_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_tc_hang_muc_thu_chi_tg_cap_nhat ON public.fp_tc_hang_muc_thu_chi;
CREATE TRIGGER tr_fp_tc_hang_muc_thu_chi_tg_cap_nhat
  BEFORE UPDATE ON public.fp_tc_hang_muc_thu_chi
  FOR EACH ROW EXECUTE FUNCTION public.fp_tc_hang_muc_thu_chi_tg_cap_nhat();

-- GRANT sequence identity (thiếu thì INSERT qua PostgREST trả 403)
DO $tc_hm_seq$
DECLARE
  seq text;
BEGIN
  seq := pg_get_serial_sequence('public.fp_tc_hang_muc_thu_chi', 'id');
  IF seq IS NOT NULL THEN
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', seq);
  END IF;
END
$tc_hm_seq$;

ALTER TABLE public.fp_tc_hang_muc_thu_chi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fp_tc_hang_muc_select_auth" ON public.fp_tc_hang_muc_thu_chi;
DROP POLICY IF EXISTS "fp_tc_hang_muc_insert_auth" ON public.fp_tc_hang_muc_thu_chi;
DROP POLICY IF EXISTS "fp_tc_hang_muc_update_auth" ON public.fp_tc_hang_muc_thu_chi;
DROP POLICY IF EXISTS "fp_tc_hang_muc_delete_auth" ON public.fp_tc_hang_muc_thu_chi;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fp_tc_hang_muc_thu_chi TO authenticated;

CREATE POLICY "fp_tc_hang_muc_select_auth" ON public.fp_tc_hang_muc_thu_chi
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp_tc_hang_muc_insert_auth" ON public.fp_tc_hang_muc_thu_chi
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fp_tc_hang_muc_update_auth" ON public.fp_tc_hang_muc_thu_chi
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fp_tc_hang_muc_delete_auth" ON public.fp_tc_hang_muc_thu_chi
  FOR DELETE TO authenticated USING (true);
