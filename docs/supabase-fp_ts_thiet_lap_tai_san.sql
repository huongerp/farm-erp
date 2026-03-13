-- =============================================================================
-- Thiết lập tài sản (Asset setup) – Hành chính / Tài sản
-- Chạy trong Supabase Dashboard → SQL Editor
-- Gồm: (1) Nhóm tài sản + tham số khấu hao, (2) Trạng thái tài sản.
-- Dùng trong module Danh sách tài sản, Khấu hao, Kiểm kê, Cấp phát thu hồi.
-- Trạng thái: text 'Đang hoạt động' | 'Ngừng hoạt động'.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Nhóm tài sản (tham số khấu hao)
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.fp_ts_nhom_tai_san;

CREATE TABLE public.fp_ts_nhom_tai_san (
  id                    bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma                    text NOT NULL,
  ten                   text NOT NULL,
  thu_tu                integer NOT NULL DEFAULT 0,
  ghi_chu               text,
  phuong_phap_khau_hao  text NOT NULL DEFAULT 'duong_thang',
  ty_le_khau_hao        numeric(5,2),
  so_nam_su_dung        integer,
  trang_thai            text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao                timestamptz DEFAULT now(),
  tg_cap_nhat           timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_ts_nhom_tai_san IS 'Danh mục nhóm tài sản – Thiết lập tài sản, tham số khấu hao dùng cho Danh sách tài sản và Khấu hao';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ma IS 'Mã nhóm (VD: TBD_VAN_PHONG, TBD_CNTT)';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ten IS 'Tên hiển thị nhóm tài sản';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.thu_tu IS 'Thứ tự sắp xếp';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ghi_chu IS 'Ghi chú tùy chọn';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.phuong_phap_khau_hao IS 'Phương pháp: duong_thang (đường thẳng) | so_du_giam_dan (số dư giảm dần)';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.ty_le_khau_hao IS 'Tỷ lệ khấu hao % (VD: 20, 25). Null nếu chỉ dùng so_nam_su_dung';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.so_nam_su_dung IS 'Số năm sử dụng (thời gian khấu hao). Null nếu tính theo ty_le_khau_hao';
COMMENT ON COLUMN public.fp_ts_nhom_tai_san.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';

CREATE UNIQUE INDEX idx_fp_ts_nhom_tai_san_ma ON public.fp_ts_nhom_tai_san(ma);
CREATE INDEX idx_fp_ts_nhom_tai_san_thu_tu ON public.fp_ts_nhom_tai_san(thu_tu);
CREATE INDEX idx_fp_ts_nhom_tai_san_trang_thai ON public.fp_ts_nhom_tai_san(trang_thai);

CREATE OR REPLACE FUNCTION fp_ts_nhom_tai_san_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_nhom_tai_san_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_nhom_tai_san
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_nhom_tai_san_tg_cap_nhat();

ALTER TABLE public.fp_ts_nhom_tai_san ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_ts_nhom_tai_san" ON public.fp_ts_nhom_tai_san
  FOR DELETE TO authenticated USING (true);

-- -----------------------------------------------------------------------------
-- 2. Trạng thái tài sản
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.fp_ts_trang_thai_tai_san;

CREATE TABLE public.fp_ts_trang_thai_tai_san (
  id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma           text NOT NULL,
  ten          text NOT NULL,
  thu_tu       integer NOT NULL DEFAULT 0,
  ghi_chu      text,
  trang_thai   text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao       timestamptz DEFAULT now(),
  tg_cap_nhat  timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_ts_trang_thai_tai_san IS 'Danh mục trạng thái tài sản – Thiết lập tài sản (Mới, Đang dùng, Bảo trì, Thanh lý...)';
COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.ma IS 'Mã trạng thái (VD: MOI, DANG_SU_DUNG, BAO_TRI, THANH_LY)';
COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.ten IS 'Tên hiển thị trạng thái';
COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.thu_tu IS 'Thứ tự sắp xếp';
COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.ghi_chu IS 'Ghi chú tùy chọn';
COMMENT ON COLUMN public.fp_ts_trang_thai_tai_san.trang_thai IS 'Trạng thái hoạt động – text: Đang hoạt động | Ngừng hoạt động';

CREATE UNIQUE INDEX idx_fp_ts_trang_thai_tai_san_ma ON public.fp_ts_trang_thai_tai_san(ma);
CREATE INDEX idx_fp_ts_trang_thai_tai_san_thu_tu ON public.fp_ts_trang_thai_tai_san(thu_tu);
CREATE INDEX idx_fp_ts_trang_thai_tai_san_trang_thai ON public.fp_ts_trang_thai_tai_san(trang_thai);

CREATE OR REPLACE FUNCTION fp_ts_trang_thai_tai_san_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_trang_thai_tai_san_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_trang_thai_tai_san
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_trang_thai_tai_san_tg_cap_nhat();

ALTER TABLE public.fp_ts_trang_thai_tai_san ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_ts_trang_thai_tai_san" ON public.fp_ts_trang_thai_tai_san
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Dữ liệu mẫu (tùy chọn – xóa hoặc chỉnh nếu không cần)
-- =============================================================================

INSERT INTO public.fp_ts_nhom_tai_san (ma, ten, thu_tu, ghi_chu, phuong_phap_khau_hao, ty_le_khau_hao, so_nam_su_dung, trang_thai)
VALUES
  ('TBD_VAN_PHONG', 'Thiết bị văn phòng', 1, 'Máy tính, máy in, điều hòa...', 'duong_thang', 20, 5, 'Đang hoạt động'),
  ('TBD_CNTT', 'Thiết bị CNTT', 2, 'Server, laptop, màn hình', 'duong_thang', 25, 4, 'Đang hoạt động'),
  ('XE_CONG_TY', 'Xe công ty', 3, NULL, 'duong_thang', 16.67, 6, 'Đang hoạt động'),
  ('NHA_XUONG', 'Nhà xưởng - Cơ sở vật chất', 4, NULL, 'duong_thang', NULL, 20, 'Đang hoạt động'),
  ('MAY_MOC', 'Máy móc thiết bị sản xuất', 5, 'Dây chuyền, máy công nghiệp', 'duong_thang', 10, 10, 'Đang hoạt động'),
  ('TB_CHUYEN_DUNG', 'Thiết bị chuyên dùng', 6, NULL, 'so_du_giam_dan', 25, NULL, 'Đang hoạt động');

INSERT INTO public.fp_ts_trang_thai_tai_san (ma, ten, thu_tu, ghi_chu, trang_thai)
VALUES
  ('MOI', 'Mới', 1, 'Tài sản mới nhập', 'Đang hoạt động'),
  ('DANG_SU_DUNG', 'Đang sử dụng', 2, NULL, 'Đang hoạt động'),
  ('BAO_TRI', 'Bảo trì', 3, 'Đang bảo trì/sửa chữa', 'Đang hoạt động'),
  ('CAP_PHAT', 'Đã cấp phát', 4, NULL, 'Đang hoạt động'),
  ('THU_HOI', 'Đã thu hồi', 5, NULL, 'Đang hoạt động'),
  ('THANH_LY', 'Thanh lý', 6, 'Đã thanh lý', 'Đang hoạt động'),
  ('MAT_HONG', 'Mất / Hỏng', 7, NULL, 'Đang hoạt động');
