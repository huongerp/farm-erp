-- =============================================================================
-- Phiếu kiểm kê (Stocktaking / Inventory Count) – pattern giống Đề xuất vật tư & Đơn đặt hàng
-- Chạy trong Supabase Dashboard → SQL Editor
-- Bảng cha: phiếu kiểm kê (số phiếu, ngày, kho, người thực hiện, người duyệt, trạng thái).
-- Bảng con: chi tiết từng mặt hàng (số lượng sổ, số lượng thực tế, chênh lệch); có cột kéo từ phiếu để xuất DB dễ đọc.
-- Liên kết: id_kho → fp_mh_danh_sach_kho(id); id_nguoi_thuc_hien, id_nguoi_duyet → fp_var_nhan_vien(id);
--           id_hang_hoa (chi tiết) → fp_mh_danh_sach_hang_hoa(id)
-- Trạng thái: text – 'Nháp' | 'Đang kiểm' | 'Hoàn thành' | 'Đã duyệt'
-- =============================================================================

-- Xóa bảng cũ (con trước vì có FK)
DROP TABLE IF EXISTS fp_mh_phieu_kiem_ke_chi_tiet;
DROP TABLE IF EXISTS fp_mh_phieu_kiem_ke;

-- Bảng cha: phiếu kiểm kê
CREATE TABLE fp_mh_phieu_kiem_ke (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  so_phieu               text NOT NULL,
  ngay                   date NOT NULL,
  id_kho                 bigint NOT NULL,
  ten_kho                text,
  id_nguoi_thuc_hien    bigint NOT NULL,
  ten_nguoi_thuc_hien   text,
  id_nguoi_duyet        bigint,
  ten_nguoi_duyet       text,
  ghi_chu                text,
  trang_thai             text NOT NULL DEFAULT 'Nháp',
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_phieu_kiem_ke IS 'Phiếu kiểm kê kho (Stocktaking)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.so_phieu IS 'Số phiếu kiểm kê';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.ngay IS 'Ngày kiểm kê';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.id_kho IS 'Kho kiểm kê → fp_mh_danh_sach_kho(id)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.ten_kho IS 'Tên kho (denormalize, app điền khi tạo/sửa)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.id_nguoi_thuc_hien IS 'Người thực hiện kiểm kê → fp_var_nhan_vien(id)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.ten_nguoi_thuc_hien IS 'Tên người thực hiện (denormalize)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.ten_nguoi_duyet IS 'Tên người duyệt (denormalize)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke.trang_thai IS 'Text: Nháp, Đang kiểm, Hoàn thành, Đã duyệt';

-- Bảng con: chi tiết từng dòng hàng (số lượng sổ, thực tế, chênh lệch); cột kéo từ phiếu để xuất DB dễ đọc
CREATE TABLE fp_mh_phieu_kiem_ke_chi_tiet (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_phieu_kiem_ke       bigint NOT NULL REFERENCES fp_mh_phieu_kiem_ke(id) ON DELETE CASCADE,
  id_hang_hoa            bigint NOT NULL,
  so_luong_so            numeric(18,4) NOT NULL DEFAULT 0,
  so_luong_thuc_te      numeric(18,4),
  chenh_lech            numeric(18,4),
  don_vi_tinh           text,
  ghi_chu                text,
  -- Kéo từ phiếu (để xuất DB dễ đọc)
  so_phieu               text,
  ngay                   date,
  ten_kho                text,
  ten_nguoi_thuc_hien   text,
  ten_nguoi_duyet       text,
  trang_thai_phieu      text
);

COMMENT ON TABLE fp_mh_phieu_kiem_ke_chi_tiet IS 'Chi tiết từng dòng hàng kiểm kê; so_phieu, ngay, ten_kho... kéo từ phiếu';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke_chi_tiet.id_hang_hoa IS '→ fp_mh_danh_sach_hang_hoa(id)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke_chi_tiet.so_luong_so IS 'Số lượng theo sổ sách (tồn kho theo hệ thống)';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke_chi_tiet.so_luong_thuc_te IS 'Số lượng đếm thực tế khi kiểm kê';
COMMENT ON COLUMN fp_mh_phieu_kiem_ke_chi_tiet.chenh_lech IS 'Chênh lệch = thực tế - sổ (app/trigger điền)';

-- Indexes
CREATE UNIQUE INDEX idx_fp_mh_phieu_kiem_ke_so_phieu ON fp_mh_phieu_kiem_ke(so_phieu);
CREATE INDEX idx_fp_mh_phieu_kiem_ke_ngay ON fp_mh_phieu_kiem_ke(ngay);
CREATE INDEX idx_fp_mh_phieu_kiem_ke_id_kho ON fp_mh_phieu_kiem_ke(id_kho);
CREATE INDEX idx_fp_mh_phieu_kiem_ke_id_nguoi_thuc_hien ON fp_mh_phieu_kiem_ke(id_nguoi_thuc_hien);
CREATE INDEX idx_fp_mh_phieu_kiem_ke_id_nguoi_duyet ON fp_mh_phieu_kiem_ke(id_nguoi_duyet);
CREATE INDEX idx_fp_mh_phieu_kiem_ke_trang_thai ON fp_mh_phieu_kiem_ke(trang_thai);
CREATE INDEX idx_fp_mh_phieu_kiem_ke_chi_tiet_id_phieu ON fp_mh_phieu_kiem_ke_chi_tiet(id_phieu_kiem_ke);
CREATE INDEX idx_fp_mh_phieu_kiem_ke_chi_tiet_id_hang_hoa ON fp_mh_phieu_kiem_ke_chi_tiet(id_hang_hoa);

-- Trigger: cập nhật tg_cap_nhat khi sửa phiếu
CREATE OR REPLACE FUNCTION fp_mh_phieu_kiem_ke_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_phieu_kiem_ke
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_phieu_kiem_ke_tg_cap_nhat();

-- Trigger: tính chenh_lech = so_luong_thuc_te - so_luong_so khi insert/update chi tiết
CREATE OR REPLACE FUNCTION fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.so_luong_thuc_te IS NOT NULL THEN
    NEW.chenh_lech = NEW.so_luong_thuc_te - COALESCE(NEW.so_luong_so, 0);
  ELSE
    NEW.chenh_lech = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech
  BEFORE INSERT OR UPDATE OF so_luong_so, so_luong_thuc_te ON fp_mh_phieu_kiem_ke_chi_tiet
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_phieu_kiem_ke_chi_tiet_chenh_lech();

-- Trigger: khi thêm/sửa dòng chi tiết → kéo so_phieu, ngay, trang_thai từ phiếu
CREATE OR REPLACE FUNCTION fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu()
RETURNS TRIGGER AS $$
DECLARE
  p record;
BEGIN
  SELECT so_phieu, ngay, trang_thai
    INTO p
    FROM fp_mh_phieu_kiem_ke
   WHERE id = NEW.id_phieu_kiem_ke;
  IF FOUND THEN
    NEW.so_phieu := p.so_phieu;
    NEW.ngay := p.ngay;
    NEW.trang_thai_phieu := p.trang_thai;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu
  BEFORE INSERT OR UPDATE OF id_phieu_kiem_ke ON fp_mh_phieu_kiem_ke_chi_tiet
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_phieu_kiem_ke_chi_tiet_sync_phieu();

-- Trigger: khi sửa phiếu → cập nhật các cột kéo (so_phieu, ngay, trang_thai) ở tất cả dòng chi tiết
-- Cột ten_kho, ten_nguoi_thuc_hien, ten_nguoi_duyet app điền khi tạo/sửa hoặc join khi đọc
CREATE OR REPLACE FUNCTION fp_mh_phieu_kiem_ke_after_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fp_mh_phieu_kiem_ke_chi_tiet
     SET so_phieu = NEW.so_phieu,
         ngay = NEW.ngay,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_phieu_kiem_ke = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_phieu_kiem_ke_after_update
  AFTER UPDATE ON fp_mh_phieu_kiem_ke
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_phieu_kiem_ke_after_update();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE fp_mh_phieu_kiem_ke ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_mh_phieu_kiem_ke_chi_tiet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select phieu_kiem_ke" ON fp_mh_phieu_kiem_ke
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert phieu_kiem_ke" ON fp_mh_phieu_kiem_ke
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update phieu_kiem_ke" ON fp_mh_phieu_kiem_ke
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete phieu_kiem_ke" ON fp_mh_phieu_kiem_ke
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow select phieu_kiem_ke_chi_tiet" ON fp_mh_phieu_kiem_ke_chi_tiet
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert phieu_kiem_ke_chi_tiet" ON fp_mh_phieu_kiem_ke_chi_tiet
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update phieu_kiem_ke_chi_tiet" ON fp_mh_phieu_kiem_ke_chi_tiet
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete phieu_kiem_ke_chi_tiet" ON fp_mh_phieu_kiem_ke_chi_tiet
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- TÙY CHỌN: Số phiếu tự tăng trên server
-- App gọi RPC get_next_so_phieu_phieu_kiem_ke() khi tạo phiếu (format: tiền tố + pad số).
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS fp_mh_phieu_kiem_ke_so_seq START 1;

CREATE OR REPLACE FUNCTION get_next_so_phieu_phieu_kiem_ke()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  RETURN nextval('fp_mh_phieu_kiem_ke_so_seq');
END;
$fn$;

COMMENT ON FUNCTION get_next_so_phieu_phieu_kiem_ke() IS 'Trả về số thứ tự tiếp theo cho số phiếu kiểm kê (app format: KK-YYYY- + pad số)';

GRANT USAGE ON SEQUENCE fp_mh_phieu_kiem_ke_so_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_so_phieu_phieu_kiem_ke() TO authenticated;
