-- =============================================================================
-- Danh sách tài sản (Asset list) – Hành chính / Tài sản
-- Chạy trong Supabase Dashboard → SQL Editor
-- Bảng chính danh mục tài sản. Không dùng FK; trạng thái = id_trang_thai + ten_trang_thai.
-- =============================================================================

DROP TABLE IF EXISTS public.fp_ts_tai_san;

CREATE TABLE public.fp_ts_tai_san (
  id                          bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_tai_san                  text NOT NULL,
  ten_tai_san                 text NOT NULL,
  id_nhom                     bigint NOT NULL,
  ten_nhom                    text,
  id_noi_luu                  bigint NOT NULL,
  ten_noi_luu                 text,
  id_chi_nhanh                bigint,
  ten_chi_nhanh               text,
  id_trang_thai               bigint NOT NULL,
  ten_trang_thai              text,
  id_nhan_vien                bigint,
  ten_nhan_vien               text,
  thuong_hieu                 text,
  model                       text,
  serial                      text,
  xuat_xu                     text,
  ma_barcode                  text,
  ten_nha_cung_cap            text,
  id_nguoi_tao                bigint,
  ten_nguoi_tao               text,
  ngay_nhap                   date NOT NULL,
  nguyen_gia                  numeric(18,2),
  ngay_bat_dau_trich_khau_hao date,
  gia_tri_con_lai             numeric(18,2),
  khau_hao_luy_ke             numeric(18,2) DEFAULT 0,
  hinh_anh                    text,
  ghi_chu                     text,
  tg_tao                      timestamptz DEFAULT now(),
  tg_cap_nhat                 timestamptz DEFAULT now()
);

COMMENT ON TABLE public.fp_ts_tai_san IS 'Danh sách tài sản – Hành chính. Liên kết nhóm, nơi lưu, trạng thái tài sản; dùng cho Cấp phát thu hồi, Khấu hao, Kiểm kê.';
COMMENT ON COLUMN public.fp_ts_tai_san.ma_tai_san IS 'Mã tài sản (VD: TS-VP-001)';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_tai_san IS 'Tên tài sản';
COMMENT ON COLUMN public.fp_ts_tai_san.id_nhom IS 'ID nhóm tài sản; tham chiếu fp_ts_nhom_tai_san(id)';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_nhom IS 'Tên nhóm tài sản (lưu tắt khi tạo/cập nhật)';
COMMENT ON COLUMN public.fp_ts_tai_san.id_noi_luu IS 'ID nơi lưu (nơi quản lý); tham chiếu fp_hc_noi_quan_ly(id)';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_noi_luu IS 'Tên nơi lưu (lưu tắt khi tạo/cập nhật)';
COMMENT ON COLUMN public.fp_ts_tai_san.id_chi_nhanh IS 'ID chi nhánh (từ nơi lưu hoặc cấu hình)';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_chi_nhanh IS 'Tên chi nhánh (lưu tắt)';
COMMENT ON COLUMN public.fp_ts_tai_san.id_trang_thai IS 'ID trạng thái tài sản (Mới, Đang dùng, Bảo trì...); tham chiếu fp_ts_trang_thai_tai_san(id)';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_trang_thai IS 'Tên trạng thái tài sản (lưu tắt khi tạo/cập nhật)';
COMMENT ON COLUMN public.fp_ts_tai_san.id_nhan_vien IS 'Nhân viên đang giữ (cấp phát); null nếu đang ở kho/nơi lưu';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_nhan_vien IS 'Tên nhân viên đang giữ (lưu tắt)';
COMMENT ON COLUMN public.fp_ts_tai_san.thuong_hieu IS 'Thương hiệu';
COMMENT ON COLUMN public.fp_ts_tai_san.model IS 'Model';
COMMENT ON COLUMN public.fp_ts_tai_san.serial IS 'Số serial';
COMMENT ON COLUMN public.fp_ts_tai_san.xuat_xu IS 'Xuất xứ';
COMMENT ON COLUMN public.fp_ts_tai_san.ma_barcode IS 'Mã Barcode';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_nha_cung_cap IS 'Tên nhà cung cấp';
COMMENT ON COLUMN public.fp_ts_tai_san.id_nguoi_tao IS 'Người tạo bản ghi → fp_var_nhan_vien(id)';
COMMENT ON COLUMN public.fp_ts_tai_san.ten_nguoi_tao IS 'Tên người tạo (lưu tắt khi tạo)';
COMMENT ON COLUMN public.fp_ts_tai_san.ngay_nhap IS 'Ngày nhập tài sản';
COMMENT ON COLUMN public.fp_ts_tai_san.nguyen_gia IS 'Nguyên giá';
COMMENT ON COLUMN public.fp_ts_tai_san.ngay_bat_dau_trich_khau_hao IS 'Ngày bắt đầu trích khấu hao; null = dùng ngay_nhap';
COMMENT ON COLUMN public.fp_ts_tai_san.gia_tri_con_lai IS 'Giá trị còn lại (cập nhật khi chốt kỳ khấu hao)';
COMMENT ON COLUMN public.fp_ts_tai_san.khau_hao_luy_ke IS 'Khấu hao lũy kế (cập nhật khi chốt kỳ khấu hao)';
COMMENT ON COLUMN public.fp_ts_tai_san.hinh_anh IS 'URL ảnh tài sản';
COMMENT ON COLUMN public.fp_ts_tai_san.ghi_chu IS 'Ghi chú';

CREATE UNIQUE INDEX idx_fp_ts_tai_san_ma ON public.fp_ts_tai_san(ma_tai_san);
CREATE INDEX idx_fp_ts_tai_san_id_nhom ON public.fp_ts_tai_san(id_nhom);
CREATE INDEX idx_fp_ts_tai_san_id_noi_luu ON public.fp_ts_tai_san(id_noi_luu);
CREATE INDEX idx_fp_ts_tai_san_id_chi_nhanh ON public.fp_ts_tai_san(id_chi_nhanh) WHERE id_chi_nhanh IS NOT NULL;
CREATE INDEX idx_fp_ts_tai_san_id_trang_thai ON public.fp_ts_tai_san(id_trang_thai);
CREATE INDEX idx_fp_ts_tai_san_id_nhan_vien ON public.fp_ts_tai_san(id_nhan_vien) WHERE id_nhan_vien IS NOT NULL;
CREATE INDEX idx_fp_ts_tai_san_id_nguoi_tao ON public.fp_ts_tai_san(id_nguoi_tao);
CREATE INDEX idx_fp_ts_tai_san_ngay_nhap ON public.fp_ts_tai_san(ngay_nhap);
CREATE INDEX idx_fp_ts_tai_san_ma_barcode ON public.fp_ts_tai_san(ma_barcode) WHERE ma_barcode IS NOT NULL AND ma_barcode <> '';

CREATE OR REPLACE FUNCTION fp_ts_tai_san_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_ts_tai_san_tg_cap_nhat
  BEFORE UPDATE ON public.fp_ts_tai_san
  FOR EACH ROW EXECUTE PROCEDURE fp_ts_tai_san_tg_cap_nhat();

ALTER TABLE public.fp_ts_tai_san ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select fp_ts_tai_san" ON public.fp_ts_tai_san
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert fp_ts_tai_san" ON public.fp_ts_tai_san
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update fp_ts_tai_san" ON public.fp_ts_tai_san
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete fp_ts_tai_san" ON public.fp_ts_tai_san
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Dữ liệu mẫu (tùy chọn – đổi id_nhom, id_noi_luu, id_trang_thai, id_nguoi_tao cho đúng)
-- =============================================================================

-- INSERT INTO public.fp_ts_tai_san (
--   ma_tai_san, ten_tai_san, id_nhom, ten_nhom, id_noi_luu, ten_noi_luu, id_chi_nhanh, ten_chi_nhanh,
--   id_trang_thai, ten_trang_thai,
--   thuong_hieu, model, serial, xuat_xu, ma_barcode, ten_nha_cung_cap,
--   id_nguoi_tao, ten_nguoi_tao,
--   ngay_nhap, nguyen_gia, ngay_bat_dau_trich_khau_hao, gia_tri_con_lai, khau_hao_luy_ke,
--   ghi_chu
-- )
-- VALUES
--   ('TS-VP-001', 'Laptop Dell XPS 15', 2, 'Thiết bị CNTT', 1, 'Văn phòng HCM', 1, 'Chi nhánh HCM', 4, 'Đã cấp phát', 'Dell', 'XPS 15 9520', 'DLXPS152024001', 'Trung Quốc', '8936123456001', 'Công ty TNHH Tin học ABC', 1, 'Nguyễn Văn A', '2024-06-01', 28000000, '2024-06-01', 23800000, 4200000, 'Cấp phát cho quản lý'),
--   ('TS-VP-002', 'Màn hình LG 27"', 2, 'Thiết bị CNTT', 1, 'Văn phòng HCM', 1, 'Chi nhánh HCM', 4, 'Đã cấp phát', 'LG', '27UP850-W', 'LG27UP20240002', 'Hàn Quốc', '8936123456002', 'FPT Trading', 1, 'Nguyễn Văn A', '2024-05-15', 5500000, '2024-05-15', 4675000, 825000, NULL);
