-- =============================================================================
-- Kiểm kê tài sản (Asset inventory) – Hành chính / Tài sản
-- Chạy trong Supabase Dashboard → SQL Editor
-- Kết nối với: fp_ts_tai_san, fp_ts_nhom_tai_san, fp_ts_trang_thai_tai_san,
--              fp_hc_noi_quan_ly, fp_var_nhan_vien.
-- Gồm: (1) Đợt kiểm kê tài sản, (2) Chi tiết kiểm kê từng tài sản (sổ vs thực tế).
-- Trạng thái đợt (tiếng Việt): Nháp | Đang kiểm kê | Hoàn thành.
-- Trạng thái hoạt động (bảng cha): Đang hoạt động | Ngừng hoạt động.
-- Kết quả chi tiết (tiếng Việt): Chưa kiểm | Khớp | Chênh nơi lưu | Chênh người giữ | Chênh trạng thái | Thiếu.
-- =============================================================================

-- Xóa bảng con trước (có FK tới bảng đợt)
DROP TABLE IF EXISTS public.fp_ts_dot_kiem_ke_tai_san_chi_tiet;
DROP TABLE IF EXISTS public.fp_ts_dot_kiem_ke_tai_san;

-- -----------------------------------------------------------------------------
-- 1. Đợt kiểm kê tài sản
-- -----------------------------------------------------------------------------

CREATE TABLE public.fp_ts_dot_kiem_ke_tai_san (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_dot                 text NOT NULL,
  ten_dot                text NOT NULL,
  ngay_bat_dau           date NOT NULL,
  ngay_ket_thuc          date NOT NULL,
  trang_thai             text NOT NULL DEFAULT 'Nháp',
  id_nguoi_phu_trach     bigint NOT NULL,
  id_nhom                bigint[] DEFAULT '{}',
  id_noi_luu             bigint[] DEFAULT '{}',
  ghi_chu                text,
  trang_thai_active      text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_ts_dot_kiem_ke_tai_san IS 'Đợt kiểm kê tài sản – mã đợt, tên, ngày, trạng thái, người phụ trách; phạm vi theo nhóm/nơi lưu (mảng rỗng = tất cả)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ma_dot IS 'Mã đợt kiểm kê (unique)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ten_dot IS 'Tên đợt kiểm kê';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ngay_bat_dau IS 'Ngày bắt đầu đợt';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.ngay_ket_thuc IS 'Ngày kết thúc đợt';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.trang_thai IS 'Nháp | Đang kiểm kê | Hoàn thành';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.id_nguoi_phu_trach IS 'Người phụ trách → fp_var_nhan_vien(id)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.id_nhom IS 'Phạm vi nhóm tài sản (mảng ID); rỗng = tất cả nhóm';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.id_noi_luu IS 'Phạm vi nơi lưu (mảng ID); rỗng = tất cả nơi lưu';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san.trang_thai_active IS 'Đang hoạt động | Ngừng hoạt động';

CREATE UNIQUE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ma_dot ON public.fp_ts_dot_kiem_ke_tai_san(ma_dot);
CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ngay_bat_dau ON public.fp_ts_dot_kiem_ke_tai_san(ngay_bat_dau);
CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ngay_ket_thuc ON public.fp_ts_dot_kiem_ke_tai_san(ngay_ket_thuc);
CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_trang_thai ON public.fp_ts_dot_kiem_ke_tai_san(trang_thai);
CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_id_nguoi_phu_trach ON public.fp_ts_dot_kiem_ke_tai_san(id_nguoi_phu_trach);

CREATE OR REPLACE FUNCTION fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_dot_kiem_ke_tai_san
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_dot_kiem_ke_tai_san_tg_cap_nhat();

ALTER TABLE public.fp_ts_dot_kiem_ke_tai_san ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_ts_dot_kiem_ke_tai_san" ON public.fp_ts_dot_kiem_ke_tai_san
  FOR DELETE TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 2. Chi tiết kiểm kê – một dòng = một tài sản trong đợt (sổ vs thực tế)
-- -----------------------------------------------------------------------------

CREATE TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_dot_kiem_ke         bigint NOT NULL REFERENCES public.fp_ts_dot_kiem_ke_tai_san(id) ON DELETE CASCADE,
  id_tai_san             bigint NOT NULL,
  ma_tai_san             text,
  ten_tai_san            text,
  id_noi_luu_so          bigint NOT NULL,
  ten_noi_luu_so         text,
  id_nguoi_giu_so        bigint,
  ten_nguoi_giu_so       text,
  id_trang_thai_so       bigint NOT NULL,
  ten_trang_thai_so      text,
  id_noi_luu_thuc_te     bigint,
  ten_noi_luu_thuc_te    text,
  id_nguoi_giu_thuc_te   bigint,
  ten_nguoi_giu_thuc_te text,
  id_trang_thai_thuc_te  bigint,
  ten_trang_thai_thuc_te text,
  ket_qua                text NOT NULL DEFAULT 'Chưa kiểm',
  ghi_chu_dong           text,
  id_nguoi_kiem          bigint,
  ngay_kiem              timestamptz,
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now(),
  UNIQUE (id_dot_kiem_ke, id_tai_san)
);

COMMENT ON TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet IS 'Chi tiết kiểm kê tài sản: mỗi dòng = một tài sản trong đợt; sổ (snapshot) vs thực tế (người kiểm nhập), kết quả so sánh';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_tai_san IS 'Tài sản → fp_ts_tai_san(id)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.ma_tai_san IS 'Mã tài sản (snapshot khi tạo danh sách)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.ten_tai_san IS 'Tên tài sản (snapshot)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_noi_luu_so IS 'Nơi lưu theo sổ (snapshot) → fp_hc_noi_quan_ly(id)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_giu_so IS 'Người giữ theo sổ (snapshot) → fp_var_nhan_vien(id)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_trang_thai_so IS 'Trạng thái theo sổ (snapshot) → fp_ts_trang_thai_tai_san(id)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_noi_luu_thuc_te IS 'Nơi lưu thực tế (người kiểm nhập)';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_giu_thuc_te IS 'Người giữ thực tế';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_trang_thai_thuc_te IS 'Trạng thái thực tế';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.ket_qua IS 'Chưa kiểm | Khớp | Chênh nơi lưu | Chênh người giữ | Chênh trạng thái | Thiếu';
COMMENT ON COLUMN public.fp_ts_dot_kiem_ke_tai_san_chi_tiet.id_nguoi_kiem IS 'Người nhập kết quả kiểm → fp_var_nhan_vien(id)';

CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ct_id_dot ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet(id_dot_kiem_ke);
CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ct_id_tai_san ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet(id_tai_san);
CREATE INDEX idx_fp_ts_dot_kiem_ke_tai_san_ct_ket_qua ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet(ket_qua);

CREATE OR REPLACE FUNCTION fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_dot_kiem_ke_tai_san_chi_tiet_tg_cap_nhat();

ALTER TABLE public.fp_ts_dot_kiem_ke_tai_san_chi_tiet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_ts_dot_kiem_ke_tai_san_chi_tiet" ON public.fp_ts_dot_kiem_ke_tai_san_chi_tiet
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- (Tùy chọn) Hàm sinh mã đợt tiếp theo – dùng từ app khi tạo đợt mới
-- Format gợi ý: KK-YYYY-NNN (VD: KK-2025-001). App có thể gọi RPC hoặc tự sinh.
-- =============================================================================

-- CREATE OR REPLACE FUNCTION get_next_ma_dot_dot_kiem_ke_tai_san()
-- RETURNS text AS $$
--   SELECT 'KK-' || to_char(now(), 'YYYY') || '-' || lpad((COALESCE(MAX(CAST(SUBSTRING(ma_dot FROM 10) AS integer)), 0) + 1)::text, 3, '0')
--   FROM public.fp_ts_dot_kiem_ke_tai_san
--   WHERE ma_dot LIKE 'KK-' || to_char(now(), 'YYYY') || '-%';
-- $$ LANGUAGE sql STABLE;
