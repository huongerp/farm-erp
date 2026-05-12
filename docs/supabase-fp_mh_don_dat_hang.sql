-- =============================================================================
-- Đơn đặt hàng (Purchase Order) – pattern giống Phiếu đề xuất vật tư
-- Chạy trong Supabase Dashboard → SQL Editor
-- Liên kết: id_nha_cung_cap → đối tác NCC; id_kho_nhan → fp_mh_danh_sach_kho(id);
--           id_phieu_de_xuat_vat_tu → fp_mh_phieu_de_xuat_vat_tu(id);
--           id_nguoi_dat, id_nguoi_duyet → fp_var_nhan_vien(id);
--           id_hang_hoa (chi tiết) → fp_mh_danh_sach_hang_hoa(id)
-- Trạng thái: text như Phiếu đề xuất vật tư – 'Nháp' | 'Chờ duyệt' | 'Đã gửi' | 'Đã xác nhận' | 'Đang giao' | 'Đã nhận đủ' | 'Đã đóng' | 'Hủy'
-- =============================================================================

-- Xóa bảng cũ (con trước vì có FK)
DROP TABLE IF EXISTS fp_mh_don_dat_hang_chi_tiet;
DROP TABLE IF EXISTS fp_mh_don_dat_hang;

-- Bảng cha: đơn đặt hàng
CREATE TABLE fp_mh_don_dat_hang (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  so_po                  text NOT NULL,
  ngay_dat               date NOT NULL,
  ngay_giao_dk           date NOT NULL,
  id_nha_cung_cap        bigint NOT NULL,
  ten_nha_cung_cap       text,
  id_kho_nhan            bigint,
  ten_kho_nhan           text,
  id_phieu_de_xuat_vat_tu bigint,
  id_nguoi_dat           bigint NOT NULL,
  id_nguoi_duyet         bigint,
  ghi_chu                text,
  trang_thai             text NOT NULL DEFAULT 'Nháp' CHECK (trang_thai IN ('Nháp', 'Chờ duyệt', 'Đã gửi', 'Đã xác nhận', 'Đang giao', 'Đã nhận đủ', 'Đã đóng', 'Hủy')),
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_don_dat_hang IS 'Đơn đặt hàng (Purchase Order)';
COMMENT ON COLUMN fp_mh_don_dat_hang.so_po IS 'Số đơn đặt hàng (PO)';
COMMENT ON COLUMN fp_mh_don_dat_hang.ngay_dat IS 'Ngày đặt hàng';
COMMENT ON COLUMN fp_mh_don_dat_hang.ngay_giao_dk IS 'Ngày giao dự kiến';
COMMENT ON COLUMN fp_mh_don_dat_hang.id_nha_cung_cap IS 'Nhà cung cấp (đối tác)';
COMMENT ON COLUMN fp_mh_don_dat_hang.ten_nha_cung_cap IS 'Tên NCC (denormalize, app điền khi tạo/sửa)';
COMMENT ON COLUMN fp_mh_don_dat_hang.id_kho_nhan IS 'Kho nhận hàng → fp_mh_danh_sach_kho(id)';
COMMENT ON COLUMN fp_mh_don_dat_hang.ten_kho_nhan IS 'Tên kho nhận (denormalize, app điền khi tạo/sửa)';
COMMENT ON COLUMN fp_mh_don_dat_hang.id_phieu_de_xuat_vat_tu IS 'Phiếu đề xuất vật tư (nếu có) → fp_mh_phieu_de_xuat_vat_tu(id)';
COMMENT ON COLUMN fp_mh_don_dat_hang.id_nguoi_dat IS 'Người đặt hàng → fp_var_nhan_vien(id)';
COMMENT ON COLUMN fp_mh_don_dat_hang.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';
COMMENT ON COLUMN fp_mh_don_dat_hang.trang_thai IS 'Text: Nháp, Chờ duyệt, Đã gửi, Đã xác nhận, Đang giao, Đã nhận đủ, Đã đóng, Hủy';

-- Bảng con: chi tiết dòng hàng; cột kéo từ phiếu để xuất DB dễ đọc
CREATE TABLE fp_mh_don_dat_hang_chi_tiet (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_don_dat_hang        bigint NOT NULL REFERENCES fp_mh_don_dat_hang(id) ON DELETE CASCADE,
  id_hang_hoa            bigint NOT NULL,
  so_luong               numeric(18,4) NOT NULL CHECK (so_luong > 0),
  don_vi_tinh            text,
  don_gia                numeric(18,4) DEFAULT 0,
  thanh_tien             numeric(18,4) DEFAULT 0,
  phan_loai              text,
  ghi_chu                text,
  -- Kéo từ đơn (để xuất DB dễ đọc)
  so_po                  text,
  ngay_dat               date,
  ngay_giao_dk           date,
  ten_nha_cung_cap       text,
  ten_kho_nhan           text,
  so_phieu_de_xuat       text,
  ten_nguoi_dat          text,
  trang_thai_phieu       text
);

COMMENT ON TABLE fp_mh_don_dat_hang_chi_tiet IS 'Chi tiết từng dòng hàng đơn đặt hàng; so_po, ngay_dat, ten_nha_cung_cap... kéo từ đơn';
COMMENT ON COLUMN fp_mh_don_dat_hang_chi_tiet.id_hang_hoa IS '→ fp_mh_danh_sach_hang_hoa(id)';

-- Indexes
CREATE UNIQUE INDEX idx_fp_mh_don_dat_hang_so_po ON fp_mh_don_dat_hang(so_po);
CREATE INDEX idx_fp_mh_don_dat_hang_ngay_dat ON fp_mh_don_dat_hang(ngay_dat);
CREATE INDEX idx_fp_mh_don_dat_hang_ngay_giao_dk ON fp_mh_don_dat_hang(ngay_giao_dk);
CREATE INDEX idx_fp_mh_don_dat_hang_id_nha_cung_cap ON fp_mh_don_dat_hang(id_nha_cung_cap);
CREATE INDEX idx_fp_mh_don_dat_hang_id_kho_nhan ON fp_mh_don_dat_hang(id_kho_nhan);
CREATE INDEX idx_fp_mh_don_dat_hang_id_phieu_de_xuat ON fp_mh_don_dat_hang(id_phieu_de_xuat_vat_tu);
CREATE INDEX idx_fp_mh_don_dat_hang_id_nguoi_dat ON fp_mh_don_dat_hang(id_nguoi_dat);
CREATE INDEX idx_fp_mh_don_dat_hang_trang_thai ON fp_mh_don_dat_hang(trang_thai);
CREATE INDEX idx_fp_mh_don_dat_hang_chi_tiet_id_don ON fp_mh_don_dat_hang_chi_tiet(id_don_dat_hang);
CREATE INDEX idx_fp_mh_don_dat_hang_chi_tiet_id_hang_hoa ON fp_mh_don_dat_hang_chi_tiet(id_hang_hoa);

-- Trigger: cập nhật tg_cap_nhat khi sửa đơn
CREATE OR REPLACE FUNCTION fp_mh_don_dat_hang_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_don_dat_hang_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_don_dat_hang
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_don_dat_hang_tg_cap_nhat();

-- Trigger: tính thanh_tien = so_luong * don_gia
CREATE OR REPLACE FUNCTION fp_mh_don_dat_hang_chi_tiet_thanh_tien()
RETURNS TRIGGER AS $$
BEGIN
  NEW.thanh_tien = COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_don_dat_hang_chi_tiet_thanh_tien
  BEFORE INSERT OR UPDATE ON fp_mh_don_dat_hang_chi_tiet
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_don_dat_hang_chi_tiet_thanh_tien();

-- Trigger: khi thêm/sửa dòng chi tiết → kéo so_po, ngay_dat, ngay_giao_dk, trang_thai (text) từ đơn
CREATE OR REPLACE FUNCTION fp_mh_don_dat_hang_chi_tiet_sync_phieu()
RETURNS TRIGGER AS $$
DECLARE
  p record;
BEGIN
  SELECT so_po, ngay_dat, ngay_giao_dk, trang_thai
    INTO p
    FROM fp_mh_don_dat_hang
   WHERE id = NEW.id_don_dat_hang;
  IF FOUND THEN
    NEW.so_po := p.so_po;
    NEW.ngay_dat := p.ngay_dat;
    NEW.ngay_giao_dk := p.ngay_giao_dk;
    NEW.trang_thai_phieu := p.trang_thai;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_don_dat_hang_chi_tiet_sync_phieu
  BEFORE INSERT OR UPDATE OF id_don_dat_hang ON fp_mh_don_dat_hang_chi_tiet
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_don_dat_hang_chi_tiet_sync_phieu();

-- Trigger: khi sửa đơn → cập nhật các cột kéo (trang_thai text) ở tất cả dòng chi tiết
CREATE OR REPLACE FUNCTION fp_mh_don_dat_hang_after_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fp_mh_don_dat_hang_chi_tiet
     SET so_po = NEW.so_po,
         ngay_dat = NEW.ngay_dat,
         ngay_giao_dk = NEW.ngay_giao_dk,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_don_dat_hang = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_don_dat_hang_after_update
  AFTER UPDATE ON fp_mh_don_dat_hang
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_don_dat_hang_after_update();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE fp_mh_don_dat_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_mh_don_dat_hang_chi_tiet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select don_dat_hang" ON fp_mh_don_dat_hang
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert don_dat_hang" ON fp_mh_don_dat_hang
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update don_dat_hang" ON fp_mh_don_dat_hang
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete don_dat_hang" ON fp_mh_don_dat_hang
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow select don_dat_hang_chi_tiet" ON fp_mh_don_dat_hang_chi_tiet
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert don_dat_hang_chi_tiet" ON fp_mh_don_dat_hang_chi_tiet
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update don_dat_hang_chi_tiet" ON fp_mh_don_dat_hang_chi_tiet
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete don_dat_hang_chi_tiet" ON fp_mh_don_dat_hang_chi_tiet
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- TÙY CHỌN: Số PO tự tăng trên server
-- App gọi RPC get_next_so_po_don_dat_hang() khi tạo đơn (format: tiền tố + pad số).
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS fp_mh_don_dat_hang_so_seq START 1;

CREATE OR REPLACE FUNCTION get_next_so_po_don_dat_hang()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  RETURN nextval('fp_mh_don_dat_hang_so_seq');
END;
$fn$;

COMMENT ON FUNCTION get_next_so_po_don_dat_hang() IS 'Trả về số thứ tự tiếp theo cho số PO đơn đặt hàng (app format: PO-YYYY- + pad số)';

GRANT USAGE ON SEQUENCE fp_mh_don_dat_hang_so_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_so_po_don_dat_hang() TO authenticated;
