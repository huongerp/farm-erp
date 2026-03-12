-- =============================================================================
-- Phiếu đề xuất vật tư (Material Request)
-- Chạy trong Supabase Dashboard → SQL Editor
-- Xóa bảng cũ (và policy) rồi tạo lại. Bảng con có thêm cột kéo từ phiếu để xuất DB dễ đọc.
-- Liên kết: id_noi_de_xuat → fp_mh_danh_sach_kho(id); id_nguoi_de_xuat, id_nguoi_duyet → fp_var_nhan_vien(id);
--           id_hang_hoa (chi tiết) → fp_mh_danh_sach_hang_hoa(id)
-- =============================================================================

-- Xóa bảng cũ (con trước vì có FK; xóa bảng sẽ xóa luôn policy gắn với bảng)
DROP TABLE IF EXISTS fp_mh_phieu_de_xuat_vat_tu_chi_tiet;
DROP TABLE IF EXISTS fp_mh_phieu_de_xuat_vat_tu;

-- Bảng cha: phiếu đề xuất vật tư
CREATE TABLE fp_mh_phieu_de_xuat_vat_tu (
  id                  bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  so_phieu            text NOT NULL,
  ngay                date NOT NULL,
  ngay_can            date NOT NULL,
  id_noi_de_xuat      bigint NOT NULL,
  id_nguoi_de_xuat    bigint NOT NULL,
  id_nguoi_duyet      bigint,
  ghi_chu             text,
  trang_thai          text NOT NULL DEFAULT 'Chờ duyệt',
  tg_tao              timestamptz DEFAULT now(),
  tg_cap_nhat         timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_phieu_de_xuat_vat_tu IS 'Phiếu đề xuất vật tư';
COMMENT ON COLUMN fp_mh_phieu_de_xuat_vat_tu.id_noi_de_xuat IS 'Nơi đề xuất → fp_mh_danh_sach_kho(id)';
COMMENT ON COLUMN fp_mh_phieu_de_xuat_vat_tu.id_nguoi_de_xuat IS 'Người đề xuất → fp_var_nhan_vien(id)';
COMMENT ON COLUMN fp_mh_phieu_de_xuat_vat_tu.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';

-- Bảng con: chi tiết dòng hàng; có thêm cột kéo từ phiếu để xuất DB không cần join
CREATE TABLE fp_mh_phieu_de_xuat_vat_tu_chi_tiet (
  id                        bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_phieu_de_xuat_vat_tu   bigint NOT NULL REFERENCES fp_mh_phieu_de_xuat_vat_tu(id) ON DELETE CASCADE,
  id_hang_hoa               bigint NOT NULL,
  so_luong                  numeric(18,4) NOT NULL,
  don_vi_tinh               text,
  thong_so                  text,
  ghi_chu                   text,
  -- Kéo từ phiếu (để xuất DB dễ đọc, không cần join)
  so_phieu                  text,
  ngay                      date,
  ngay_can                  date,
  ten_noi_de_xuat           text,
  ten_nguoi_de_xuat         text,
  ten_nguoi_duyet           text,
  trang_thai_phieu          text
);

COMMENT ON TABLE fp_mh_phieu_de_xuat_vat_tu_chi_tiet IS 'Chi tiết từng dòng hàng; so_phieu, ngay, ten_noi_de_xuat, ten_nguoi_de_xuat... kéo từ phiếu để xuất dễ đọc';
COMMENT ON COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.id_hang_hoa IS '→ fp_mh_danh_sach_hang_hoa(id)';
COMMENT ON COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.so_phieu IS 'Số phiếu (kéo từ phiếu)';
COMMENT ON COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.ten_noi_de_xuat IS 'Tên kho (kéo từ phiếu)';
COMMENT ON COLUMN fp_mh_phieu_de_xuat_vat_tu_chi_tiet.ten_nguoi_de_xuat IS 'Người đề xuất (kéo từ phiếu)';

-- Indexes
CREATE UNIQUE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_so_phieu ON fp_mh_phieu_de_xuat_vat_tu(so_phieu);
CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_ngay ON fp_mh_phieu_de_xuat_vat_tu(ngay);
CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_ngay_can ON fp_mh_phieu_de_xuat_vat_tu(ngay_can);
CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_id_noi_de_xuat ON fp_mh_phieu_de_xuat_vat_tu(id_noi_de_xuat);
CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_id_nguoi_de_xuat ON fp_mh_phieu_de_xuat_vat_tu(id_nguoi_de_xuat);
CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_trang_thai ON fp_mh_phieu_de_xuat_vat_tu(trang_thai);
CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_phieu ON fp_mh_phieu_de_xuat_vat_tu_chi_tiet(id_phieu_de_xuat_vat_tu);
CREATE INDEX idx_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_hang_hoa ON fp_mh_phieu_de_xuat_vat_tu_chi_tiet(id_hang_hoa);

-- Trigger: cập nhật tg_cap_nhat khi sửa phiếu
CREATE OR REPLACE FUNCTION fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_phieu_de_xuat_vat_tu
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_phieu_de_xuat_vat_tu_tg_cap_nhat();

-- Trigger: khi thêm/sửa dòng chi tiết → kéo thông tin từ phiếu vào các cột so_phieu, ngay, ten_noi_de_xuat, ...
CREATE OR REPLACE FUNCTION fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu()
RETURNS TRIGGER AS $$
DECLARE
  p record;
BEGIN
  SELECT so_phieu, ngay, ngay_can, trang_thai
    INTO p
    FROM fp_mh_phieu_de_xuat_vat_tu
   WHERE id = NEW.id_phieu_de_xuat_vat_tu;
  IF FOUND THEN
    NEW.so_phieu := p.so_phieu;
    NEW.ngay := p.ngay;
    NEW.ngay_can := p.ngay_can;
    NEW.trang_thai_phieu := p.trang_thai;
    -- ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet cần join sang bảng kho/nhân viên; để app điền hoặc trigger khác
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu
  BEFORE INSERT OR UPDATE OF id_phieu_de_xuat_vat_tu ON fp_mh_phieu_de_xuat_vat_tu_chi_tiet
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_phieu_de_xuat_vat_tu_chi_tiet_sync_phieu();

-- Trigger: khi sửa phiếu → cập nhật các cột kéo ở tất cả dòng chi tiết
CREATE OR REPLACE FUNCTION fp_mh_phieu_de_xuat_vat_tu_after_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fp_mh_phieu_de_xuat_vat_tu_chi_tiet
     SET so_phieu = NEW.so_phieu,
         ngay = NEW.ngay,
         ngay_can = NEW.ngay_can,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_phieu_de_xuat_vat_tu = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_phieu_de_xuat_vat_tu_after_update
  AFTER UPDATE ON fp_mh_phieu_de_xuat_vat_tu
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_phieu_de_xuat_vat_tu_after_update();

-- =============================================================================
-- RLS (bật nếu dùng Supabase Auth)
-- =============================================================================

ALTER TABLE fp_mh_phieu_de_xuat_vat_tu ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_mh_phieu_de_xuat_vat_tu_chi_tiet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select phieu_de_xuat_vat_tu" ON fp_mh_phieu_de_xuat_vat_tu
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert phieu_de_xuat_vat_tu" ON fp_mh_phieu_de_xuat_vat_tu
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update phieu_de_xuat_vat_tu" ON fp_mh_phieu_de_xuat_vat_tu
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete phieu_de_xuat_vat_tu" ON fp_mh_phieu_de_xuat_vat_tu
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow select phieu_de_xuat_vat_tu_chi_tiet" ON fp_mh_phieu_de_xuat_vat_tu_chi_tiet
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert phieu_de_xuat_vat_tu_chi_tiet" ON fp_mh_phieu_de_xuat_vat_tu_chi_tiet
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update phieu_de_xuat_vat_tu_chi_tiet" ON fp_mh_phieu_de_xuat_vat_tu_chi_tiet
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete phieu_de_xuat_vat_tu_chi_tiet" ON fp_mh_phieu_de_xuat_vat_tu_chi_tiet
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- TÙY CHỌN: Số phiếu tự tăng trên server (tránh trùng khi nhiều user)
-- Chạy block này nếu bạn muốn số phiếu được sinh và tăng trên Supabase thay vì localStorage.
-- App sẽ cần gọi RPC get_next_so_phieu_phieu_de_xuat_vat_tu() khi tạo phiếu (số trả về = phần số, app thêm tiền tố + pad).
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS fp_mh_phieu_de_xuat_vat_tu_so_seq START 1;

CREATE OR REPLACE FUNCTION get_next_so_phieu_phieu_de_xuat_vat_tu()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('fp_mh_phieu_de_xuat_vat_tu_so_seq');
$$;

COMMENT ON FUNCTION get_next_so_phieu_phieu_de_xuat_vat_tu() IS 'Trả về số thứ tự tiếp theo cho số phiếu đề xuất vật tư (app format: tiền tố + pad số)';

-- Grant cho role authenticated gọi RPC
GRANT USAGE ON SEQUENCE fp_mh_phieu_de_xuat_vat_tu_so_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_so_phieu_phieu_de_xuat_vat_tu() TO authenticated;
