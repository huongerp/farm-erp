-- =============================================================================
-- Sổ quỹ tiền mặt theo CHI NHÁNH (Tài chính > Thu chi quỹ)
-- Mỗi chi nhánh (farm) có đúng MỘT quỹ tiền mặt; tồn quỹ lũy kế tính động ở
-- view v_tc_quy_thu_chi_summary (không lưu cột tồn cứng — xem file view).
--
-- Liên kết: id_chi_nhanh → fp_var_chi_nhanh(id)
--           id_hang_muc  → fp_tc_hang_muc_thu_chi(id)
--           id_nguoi_tao → fp_var_nhan_vien(id)
--           (loai_chung_tu, id_chung_tu) → đa hình tới đơn đặt hàng / đề xuất
--           mua hàng farm / chi phí tài sản — CỐ Ý không đặt FK (3 bảng khác nhau).
--
-- Chạy sau: fp_var_chi_nhanh, fp_var_nhan_vien, fp_tc_hang_muc_thu_chi
-- Không DROP bảng để chạy lại an toàn trên VPS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.fp_tc_quy_thu_chi (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  so_phieu        text NOT NULL,
  ngay            date NOT NULL,

  id_chi_nhanh    bigint NOT NULL REFERENCES public.fp_var_chi_nhanh(id) ON DELETE RESTRICT,
  ten_chi_nhanh   text,

  loai            text NOT NULL,
  so_tien         numeric(18,2) NOT NULL DEFAULT 0,
  so_luong        numeric(18,4),
  don_gia         numeric(18,2),

  id_hang_muc     bigint REFERENCES public.fp_tc_hang_muc_thu_chi(id) ON DELETE RESTRICT,
  ten_hang_muc    text,

  dien_giai       text NOT NULL,
  ghi_chu         text,

  loai_chung_tu   text,
  id_chung_tu     bigint,
  so_chung_tu     text,

  id_nguoi_tao    bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ten_nguoi_tao   text,
  tg_tao          timestamptz DEFAULT now(),
  tg_cap_nhat     timestamptz DEFAULT now(),

  CONSTRAINT fp_tc_qtc_loai_check CHECK (loai IN ('thu', 'chi')),
  CONSTRAINT fp_tc_qtc_so_tien_check CHECK (so_tien >= 0),
  CONSTRAINT fp_tc_qtc_loai_chung_tu_check
    CHECK (loai_chung_tu IS NULL OR loai_chung_tu IN ('don_dat_hang', 'de_xuat_mua_hang', 'chi_phi_tai_san')),
  -- Liên kết chứng từ phải đi theo cặp (tránh dữ liệu nửa vời)
  CONSTRAINT fp_tc_qtc_chung_tu_pair_check
    CHECK ((loai_chung_tu IS NULL AND id_chung_tu IS NULL)
        OR (loai_chung_tu IS NOT NULL AND id_chung_tu IS NOT NULL))
);

COMMENT ON TABLE public.fp_tc_quy_thu_chi IS 'Sổ quỹ tiền mặt theo chi nhánh: phiếu thu / phiếu chi. Tồn quỹ lũy kế xem v_tc_quy_thu_chi_summary';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_phieu IS 'PT-0001 (thu) / PC-0001 (chi) — sinh từ sequence server, duy nhất';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_chi_nhanh IS 'Quỹ thuộc chi nhánh nào → fp_var_chi_nhanh(id). Quỹ theo CHI NHÁNH, không theo kho';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ten_chi_nhanh IS 'Snapshot tên chi nhánh lúc lập phiếu (view trả thêm ref_ten_chi_nhanh là tên hiện tại)';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.loai IS 'thu = tiền vào quỹ; chi = tiền ra khỏi quỹ';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_tien IS 'Luôn là số dương; dấu do cột loai quyết định. Cột THU/CHI của Excel được derive ở view';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_luong IS 'Cột SỐ LƯỢNG của sổ Excel — để trống được (không mặc định 0)';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.don_gia IS 'Cột ĐƠN GIÁ của sổ Excel — để trống được';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.ten_hang_muc IS 'Snapshot tên hạng mục lúc lập phiếu';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.dien_giai IS 'Cột DIỄN GIẢI MỤC ĐÍCH CHI của sổ Excel';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.loai_chung_tu IS 'Nguồn tiền: don_dat_hang | de_xuat_mua_hang | chi_phi_tai_san (NULL = phiếu quỹ độc lập)';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.id_chung_tu IS 'Id phiếu nguồn — KHÔNG có FK vì trỏ tới 3 bảng khác nhau; xóa phiếu nguồn để lại phiếu quỹ mồ côi (chấp nhận: tiền đã chi thật), UI dựa vào so_chung_tu';
COMMENT ON COLUMN public.fp_tc_quy_thu_chi.so_chung_tu IS 'Snapshot số phiếu nguồn (so_po / FDX-xxxx / CPTS-xxxx) — chính là cột SỐ ĐỀ XUẤT của sổ Excel';

-- Index chính: khớp PARTITION BY id_chi_nhanh ORDER BY ngay, id của window tính tồn quỹ
CREATE INDEX IF NOT EXISTS idx_fp_tc_qtc_so_sach ON public.fp_tc_quy_thu_chi(id_chi_nhanh, ngay, id);
CREATE INDEX IF NOT EXISTS idx_fp_tc_qtc_ngay ON public.fp_tc_quy_thu_chi(ngay DESC);
CREATE INDEX IF NOT EXISTS idx_fp_tc_qtc_hang_muc ON public.fp_tc_quy_thu_chi(id_hang_muc);
-- Partial index cho section "Thu chi liên quan" trong 3 drawer nguồn
CREATE INDEX IF NOT EXISTS idx_fp_tc_qtc_chung_tu
  ON public.fp_tc_quy_thu_chi(loai_chung_tu, id_chung_tu)
  WHERE loai_chung_tu IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_tc_qtc_so_phieu ON public.fp_tc_quy_thu_chi(so_phieu);

-- Trigger: cập nhật tg_cap_nhat khi sửa phiếu
CREATE OR REPLACE FUNCTION public.fp_tc_quy_thu_chi_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_tc_quy_thu_chi_tg_cap_nhat ON public.fp_tc_quy_thu_chi;
CREATE TRIGGER tr_fp_tc_quy_thu_chi_tg_cap_nhat
  BEFORE UPDATE ON public.fp_tc_quy_thu_chi
  FOR EACH ROW EXECUTE FUNCTION public.fp_tc_quy_thu_chi_tg_cap_nhat();

-- GRANT sequence identity
DO $tc_qtc_seq$
DECLARE
  seq text;
BEGIN
  seq := pg_get_serial_sequence('public.fp_tc_quy_thu_chi', 'id');
  IF seq IS NOT NULL THEN
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', seq);
  END IF;
END
$tc_qtc_seq$;

ALTER TABLE public.fp_tc_quy_thu_chi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fp_tc_qtc_select_auth" ON public.fp_tc_quy_thu_chi;
DROP POLICY IF EXISTS "fp_tc_qtc_insert_auth" ON public.fp_tc_quy_thu_chi;
DROP POLICY IF EXISTS "fp_tc_qtc_update_auth" ON public.fp_tc_quy_thu_chi;
DROP POLICY IF EXISTS "fp_tc_qtc_delete_auth" ON public.fp_tc_quy_thu_chi;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fp_tc_quy_thu_chi TO authenticated;

-- RLS mở cho authenticated — phạm vi theo chi nhánh thực thi ở tầng app
-- (đúng quy ước các bảng nghiệp vụ hiện có, xem CLAUDE.md mục Phân quyền).
CREATE POLICY "fp_tc_qtc_select_auth" ON public.fp_tc_quy_thu_chi
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp_tc_qtc_insert_auth" ON public.fp_tc_quy_thu_chi
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fp_tc_qtc_update_auth" ON public.fp_tc_quy_thu_chi
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "fp_tc_qtc_delete_auth" ON public.fp_tc_quy_thu_chi
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Số phiếu tự tăng trên server (app format: PT-/PC- + pad 4 số)
-- Hai dãy riêng cho phiếu thu và phiếu chi.
-- Sequence KHÔNG rollback khi transaction lỗi ⇒ số nhảy cách là bình thường,
-- đừng viết logic "tìm số trống". UNIQUE(so_phieu) là lưới an toàn cuối.
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS public.fp_tc_quy_thu_so_seq START 1;
CREATE SEQUENCE IF NOT EXISTS public.fp_tc_quy_chi_so_seq START 1;

CREATE OR REPLACE FUNCTION public.get_next_so_phieu_tc_quy_thu()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('public.fp_tc_quy_thu_so_seq');
$$;

CREATE OR REPLACE FUNCTION public.get_next_so_phieu_tc_quy_chi()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('public.fp_tc_quy_chi_so_seq');
$$;

COMMENT ON FUNCTION public.get_next_so_phieu_tc_quy_thu() IS 'Số thứ tự tiếp theo cho phiếu thu quỹ (app format: PT- + pad 4)';
COMMENT ON FUNCTION public.get_next_so_phieu_tc_quy_chi() IS 'Số thứ tự tiếp theo cho phiếu chi quỹ (app format: PC- + pad 4)';

GRANT USAGE ON SEQUENCE public.fp_tc_quy_thu_so_seq TO authenticated;
GRANT USAGE ON SEQUENCE public.fp_tc_quy_chi_so_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_so_phieu_tc_quy_thu() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_so_phieu_tc_quy_chi() TO authenticated;

-- =============================================================================
-- Cấp nhiều số phiếu một lần — dùng cho import Excel sổ quỹ cũ (hàng trăm dòng).
-- Gọi từng dòng một sẽ tốn hàng trăm request; hàm này lấy trọn lô từ cùng dãy số
-- nên phiếu import và phiếu nhập tay vẫn dùng chung một chuỗi liên tục.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_next_so_phieu_tc_quy_batch(p_loai text, p_so_luong int)
RETURNS SETOF bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
           WHEN p_loai = 'thu' THEN nextval('public.fp_tc_quy_thu_so_seq')
           ELSE nextval('public.fp_tc_quy_chi_so_seq')
         END
  FROM generate_series(1, GREATEST(COALESCE(p_so_luong, 0), 0));
$$;

COMMENT ON FUNCTION public.get_next_so_phieu_tc_quy_batch(text, int) IS 'Lấy p_so_luong số thứ tự liên tiếp cho phiếu thu/chi quỹ (luồng import)';

GRANT EXECUTE ON FUNCTION public.get_next_so_phieu_tc_quy_batch(text, int) TO authenticated;
