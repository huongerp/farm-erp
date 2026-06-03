-- =============================================================================
-- Đợt kiểm kê kho (Stocktaking batch) – module Kiểm kê kho gốc
-- Chạy trong Supabase Dashboard → SQL Editor
-- Một đợt có: mã đợt, tên, ngày bắt đầu/kết thúc, trạng thái (draft | dang_kiem_ke | hoan_thanh),
--             người phụ trách, phạm vi nhiều kho. Chi tiết: từng (kho, hàng hóa) với SL sổ, SL thực tế, kết quả (khop|thieu|thua|chua_kiem).
-- Liên kết: id_nguoi_phu_trach → fp_var_nhan_vien(id);
--           id_kho (bảng phạm vi) → fp_mh_danh_sach_kho(id);
--           id_kho, id_hang_hoa (chi tiết) → fp_mh_danh_sach_kho(id), fp_mh_danh_sach_hang_hoa(id);
--           id_nguoi_kiem → fp_var_nhan_vien(id)
-- Trạng thái đợt: draft, dang_kiem_ke, hoan_thanh (text, không dùng CHECK theo yêu cầu).
-- Kết quả chi tiết: chua_kiem, khop, thieu, thua (text).
-- =============================================================================

-- Xóa bảng cũ (con + bảng trung gian trước vì có FK)
DROP TABLE IF EXISTS public.fp_mh_dot_kiem_ke_kho_chi_tiet;
DROP TABLE IF EXISTS public.fp_mh_dot_kiem_ke_kho_kho;
DROP TABLE IF EXISTS public.fp_mh_dot_kiem_ke_kho;

-- Bảng cha: đợt kiểm kê kho (schema public để Supabase nhận)
CREATE TABLE public.fp_mh_dot_kiem_ke_kho (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_dot                 text NOT NULL,
  ten_dot                text NOT NULL,
  ngay_bat_dau           date NOT NULL,
  ngay_ket_thuc          date NOT NULL,
  trang_thai             text NOT NULL DEFAULT 'draft',
  id_nguoi_phu_trach     bigint NOT NULL,
  id_nguoi_tao           bigint REFERENCES public.fp_var_nhan_vien(id) ON DELETE SET NULL,
  ghi_chu                text,
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_mh_dot_kiem_ke_kho IS 'Đợt kiểm kê kho – mã đợt, tên, ngày, trạng thái, người phụ trách';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ma_dot IS 'Mã đợt kiểm kê (unique, tự sinh qua RPC get_next_ma_dot_dot_kiem_ke_kho)';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ten_dot IS 'Tên đợt kiểm kê';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ngay_bat_dau IS 'Ngày bắt đầu đợt';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.ngay_ket_thuc IS 'Ngày kết thúc đợt';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.trang_thai IS 'draft | dang_kiem_ke | hoan_thanh';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.id_nguoi_phu_trach IS 'Người phụ trách (bắt buộc) → fp_var_nhan_vien(id)';
COMMENT ON COLUMN public.fp_mh_dot_kiem_ke_kho.id_nguoi_tao IS 'Người tạo đợt → fp_var_nhan_vien(id)';

-- Bảng trung gian: phạm vi kho của đợt (một đợt nhiều kho)
CREATE TABLE public.fp_mh_dot_kiem_ke_kho_kho (
  id_dot_kiem_ke_kho     bigint NOT NULL REFERENCES public.fp_mh_dot_kiem_ke_kho(id) ON DELETE CASCADE,
  id_kho                 bigint NOT NULL,
  PRIMARY KEY (id_dot_kiem_ke_kho, id_kho)
);

COMMENT ON TABLE fp_mh_dot_kiem_ke_kho_kho IS 'Phạm vi kho cần kiểm trong đợt; id_kho → fp_mh_danh_sach_kho(id)';

-- Bảng chi tiết: từng dòng = (đợt, kho, hàng hóa) với SL sổ, SL thực tế, kết quả
CREATE TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_dot_kiem_ke_kho     bigint NOT NULL REFERENCES public.fp_mh_dot_kiem_ke_kho(id) ON DELETE CASCADE,
  id_kho                 bigint NOT NULL,
  id_hang_hoa            bigint NOT NULL,
  so_luong_so            numeric(18,4) NOT NULL DEFAULT 0,
  so_luong_thuc_te       numeric(18,4),
  ket_qua                text NOT NULL DEFAULT 'chua_kiem',
  ghi_chu_dong           text,
  id_nguoi_kiem          bigint,
  ngay_kiem             timestamptz,
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now(),
  UNIQUE (id_dot_kiem_ke_kho, id_kho, id_hang_hoa)
);

COMMENT ON TABLE fp_mh_dot_kiem_ke_kho_chi_tiet IS 'Chi tiết kiểm kê: mỗi dòng = (đợt, kho, hàng hóa) với SL sổ, SL thực tế, kết quả';
COMMENT ON COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.id_kho IS 'Kho → fp_mh_danh_sach_kho(id)';
COMMENT ON COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.id_hang_hoa IS 'Hàng hóa → fp_mh_danh_sach_hang_hoa(id)';
COMMENT ON COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_so IS 'Số lượng sổ (snapshot tồn khi tạo danh sách)';
COMMENT ON COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.so_luong_thuc_te IS 'Số lượng đếm thực tế (người kiểm nhập)';
COMMENT ON COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.ket_qua IS 'chua_kiem | khop | thieu | thua';
COMMENT ON COLUMN fp_mh_dot_kiem_ke_kho_chi_tiet.id_nguoi_kiem IS 'Người nhập kết quả kiểm → fp_var_nhan_vien(id)';

-- Indexes
CREATE UNIQUE INDEX idx_fp_mh_dot_kiem_ke_kho_ma_dot ON fp_mh_dot_kiem_ke_kho(ma_dot);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_ngay_bat_dau ON fp_mh_dot_kiem_ke_kho(ngay_bat_dau);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_ngay_ket_thuc ON fp_mh_dot_kiem_ke_kho(ngay_ket_thuc);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_trang_thai ON fp_mh_dot_kiem_ke_kho(trang_thai);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_id_nguoi_phu_trach ON fp_mh_dot_kiem_ke_kho(id_nguoi_phu_trach);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_id_nguoi_tao ON fp_mh_dot_kiem_ke_kho(id_nguoi_tao);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_kho_id_dot ON fp_mh_dot_kiem_ke_kho_kho(id_dot_kiem_ke_kho);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_dot ON fp_mh_dot_kiem_ke_kho_chi_tiet(id_dot_kiem_ke_kho);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_kho ON fp_mh_dot_kiem_ke_kho_chi_tiet(id_kho);
CREATE INDEX idx_fp_mh_dot_kiem_ke_kho_chi_tiet_id_hang_hoa ON fp_mh_dot_kiem_ke_kho_chi_tiet(id_hang_hoa);

-- Trigger: cập nhật tg_cap_nhat khi sửa đợt
CREATE OR REPLACE FUNCTION fp_mh_dot_kiem_ke_kho_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_mh_dot_kiem_ke_kho_tg_cap_nhat ON fp_mh_dot_kiem_ke_kho;
CREATE TRIGGER tr_fp_mh_dot_kiem_ke_kho_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_dot_kiem_ke_kho
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_dot_kiem_ke_kho_tg_cap_nhat();

-- Trigger: tg_cap_nhat cho chi tiết
CREATE OR REPLACE FUNCTION fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat ON fp_mh_dot_kiem_ke_kho_chi_tiet;
CREATE TRIGGER tr_fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_dot_kiem_ke_kho_chi_tiet
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_dot_kiem_ke_kho_chi_tiet_tg_cap_nhat();

-- RLS
ALTER TABLE public.fp_mh_dot_kiem_ke_kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp_mh_dot_kiem_ke_kho_kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fp_mh_dot_kiem_ke_kho_select" ON public.fp_mh_dot_kiem_ke_kho FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_insert" ON public.fp_mh_dot_kiem_ke_kho FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_update" ON public.fp_mh_dot_kiem_ke_kho FOR UPDATE TO authenticated USING (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_delete" ON public.fp_mh_dot_kiem_ke_kho FOR DELETE TO authenticated USING (true);

CREATE POLICY "fp_mh_dot_kiem_ke_kho_kho_select" ON public.fp_mh_dot_kiem_ke_kho_kho FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_kho_insert" ON public.fp_mh_dot_kiem_ke_kho_kho FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_kho_update" ON public.fp_mh_dot_kiem_ke_kho_kho FOR UPDATE TO authenticated USING (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_kho_delete" ON public.fp_mh_dot_kiem_ke_kho_kho FOR DELETE TO authenticated USING (true);

CREATE POLICY "fp_mh_dot_kiem_ke_kho_chi_tiet_select" ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_chi_tiet_insert" ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_chi_tiet_update" ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR UPDATE TO authenticated USING (true);
CREATE POLICY "fp_mh_dot_kiem_ke_kho_chi_tiet_delete" ON public.fp_mh_dot_kiem_ke_kho_chi_tiet FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Mã đợt tự tăng (giống đề xuất vật tư)
-- App gọi RPC get_next_ma_dot_dot_kiem_ke_kho() khi tạo đợt, format: KK-YYYY-NNNN
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS public.fp_mh_dot_kiem_ke_kho_ma_seq START 1;

CREATE OR REPLACE FUNCTION public.get_next_ma_dot_dot_kiem_ke_kho()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  RETURN nextval('public.fp_mh_dot_kiem_ke_kho_ma_seq');
END;
$fn$;

COMMENT ON FUNCTION public.get_next_ma_dot_dot_kiem_ke_kho() IS 'Trả về số thứ tự tiếp theo cho mã đợt kiểm kê (app format: KK-YYYY- + pad số)';

GRANT USAGE ON SEQUENCE public.fp_mh_dot_kiem_ke_kho_ma_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_next_ma_dot_dot_kiem_ke_kho() TO authenticated;
