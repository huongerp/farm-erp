-- =============================================================================
-- Đề xuất mua hàng (Quản lý farm) — bước đứng trước Phiếu kho phân thuốc
-- Liên kết: id_noi_de_xuat → fp_mh_danh_sach_kho(id) (kho dùng chung với Mua hàng)
--           id_nguoi_de_xuat, id_nguoi_duyet → fp_var_nhan_vien(id)
--           id_hang_hoa (chi tiết) → fp_farm_danh_sach_hang_hoa(id)
--           id_tien_do_mh (chi tiết) → fp_farm_tien_do_mua_hang(id)
-- Chạy sau: fp_mh_danh_sach_kho, fp_farm_danh_sach_hang_hoa, fp_farm_tien_do_mua_hang
-- Không DROP bảng (khác bản fp_mh_phieu_de_xuat_vat_tu) để chạy lại an toàn trên VPS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_farm_de_xuat_mua_hang (
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

COMMENT ON TABLE fp_farm_de_xuat_mua_hang IS 'Đề xuất mua hàng (phân thuốc, vật tư farm)';
COMMENT ON COLUMN fp_farm_de_xuat_mua_hang.id_noi_de_xuat IS 'Nơi đề xuất → fp_mh_danh_sach_kho(id)';
COMMENT ON COLUMN fp_farm_de_xuat_mua_hang.id_nguoi_de_xuat IS 'Người đề xuất → fp_var_nhan_vien(id)';
COMMENT ON COLUMN fp_farm_de_xuat_mua_hang.id_nguoi_duyet IS 'Người duyệt → fp_var_nhan_vien(id)';
COMMENT ON COLUMN fp_farm_de_xuat_mua_hang.trang_thai IS 'Chờ duyệt / Đợi duyệt / Đã duyệt / Không duyệt';

-- Bảng con: chi tiết dòng hàng; có thêm cột kéo từ phiếu (xuất DB không cần join)
CREATE TABLE IF NOT EXISTS fp_farm_de_xuat_mua_hang_chi_tiet (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_de_xuat_mua_hang    bigint NOT NULL REFERENCES fp_farm_de_xuat_mua_hang(id) ON DELETE CASCADE,
  id_hang_hoa            bigint NOT NULL,
  so_luong               numeric(18,4) NOT NULL,
  don_vi_tinh            text,
  thong_so               text,
  ghi_chu                text,
  -- Tiến độ mua hàng (danh mục riêng của farm)
  id_tien_do_mh          bigint,
  ten_tien_do_mh         text,
  trao_doi               text,
  -- Kéo từ phiếu (để xuất DB dễ đọc, không cần join)
  so_phieu               text,
  ngay                   date,
  ngay_can               date,
  ten_noi_de_xuat        text,
  ten_nguoi_de_xuat      text,
  ten_nguoi_duyet        text,
  trang_thai_phieu       text
);

COMMENT ON TABLE fp_farm_de_xuat_mua_hang_chi_tiet IS 'Chi tiết từng dòng hàng; so_phieu, ngay, ten_noi_de_xuat... kéo từ phiếu để xuất dễ đọc';
COMMENT ON COLUMN fp_farm_de_xuat_mua_hang_chi_tiet.id_hang_hoa IS '→ fp_farm_danh_sach_hang_hoa(id)';
COMMENT ON COLUMN fp_farm_de_xuat_mua_hang_chi_tiet.id_tien_do_mh IS '→ fp_farm_tien_do_mua_hang(id)';
COMMENT ON COLUMN fp_farm_de_xuat_mua_hang_chi_tiet.trao_doi IS 'Trao đổi / log chuyển tiến độ, ghi chú duyệt';

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_so_phieu ON fp_farm_de_xuat_mua_hang(so_phieu);
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_ngay ON fp_farm_de_xuat_mua_hang(ngay);
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_ngay_can ON fp_farm_de_xuat_mua_hang(ngay_can);
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_id_noi_de_xuat ON fp_farm_de_xuat_mua_hang(id_noi_de_xuat);
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_id_nguoi_de_xuat ON fp_farm_de_xuat_mua_hang(id_nguoi_de_xuat);
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_trang_thai ON fp_farm_de_xuat_mua_hang(trang_thai);
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_ct_id_phieu ON fp_farm_de_xuat_mua_hang_chi_tiet(id_de_xuat_mua_hang);
CREATE INDEX IF NOT EXISTS idx_fp_farm_de_xuat_mua_hang_ct_id_hang_hoa ON fp_farm_de_xuat_mua_hang_chi_tiet(id_hang_hoa);

-- Trigger: cập nhật tg_cap_nhat khi sửa phiếu
CREATE OR REPLACE FUNCTION fp_farm_de_xuat_mua_hang_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_farm_de_xuat_mua_hang_tg_cap_nhat ON fp_farm_de_xuat_mua_hang;
CREATE TRIGGER tr_fp_farm_de_xuat_mua_hang_tg_cap_nhat
  BEFORE UPDATE ON fp_farm_de_xuat_mua_hang
  FOR EACH ROW EXECUTE FUNCTION fp_farm_de_xuat_mua_hang_tg_cap_nhat();

-- Trigger: thêm/đổi phiếu của dòng chi tiết → kéo so_phieu, ngay, ngay_can, trang_thai_phieu
CREATE OR REPLACE FUNCTION fp_farm_de_xuat_mua_hang_ct_sync_phieu()
RETURNS TRIGGER AS $$
DECLARE
  p record;
BEGIN
  SELECT so_phieu, ngay, ngay_can, trang_thai
    INTO p
    FROM fp_farm_de_xuat_mua_hang
   WHERE id = NEW.id_de_xuat_mua_hang;
  IF FOUND THEN
    NEW.so_phieu := p.so_phieu;
    NEW.ngay := p.ngay;
    NEW.ngay_can := p.ngay_can;
    NEW.trang_thai_phieu := p.trang_thai;
    -- ten_noi_de_xuat, ten_nguoi_de_xuat, ten_nguoi_duyet do app điền (cần join kho/nhân viên)
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_farm_de_xuat_mua_hang_ct_sync_phieu ON fp_farm_de_xuat_mua_hang_chi_tiet;
CREATE TRIGGER tr_fp_farm_de_xuat_mua_hang_ct_sync_phieu
  BEFORE INSERT OR UPDATE OF id_de_xuat_mua_hang ON fp_farm_de_xuat_mua_hang_chi_tiet
  FOR EACH ROW EXECUTE FUNCTION fp_farm_de_xuat_mua_hang_ct_sync_phieu();

-- Trigger: sửa phiếu → cập nhật cột kéo ở mọi dòng chi tiết
CREATE OR REPLACE FUNCTION fp_farm_de_xuat_mua_hang_after_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE fp_farm_de_xuat_mua_hang_chi_tiet
     SET so_phieu = NEW.so_phieu,
         ngay = NEW.ngay,
         ngay_can = NEW.ngay_can,
         trang_thai_phieu = NEW.trang_thai
   WHERE id_de_xuat_mua_hang = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_farm_de_xuat_mua_hang_after_update ON fp_farm_de_xuat_mua_hang;
CREATE TRIGGER tr_fp_farm_de_xuat_mua_hang_after_update
  AFTER UPDATE ON fp_farm_de_xuat_mua_hang
  FOR EACH ROW EXECUTE FUNCTION fp_farm_de_xuat_mua_hang_after_update();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE fp_farm_de_xuat_mua_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_farm_de_xuat_mua_hang_chi_tiet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_select ON fp_farm_de_xuat_mua_hang;
DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_insert ON fp_farm_de_xuat_mua_hang;
DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_update ON fp_farm_de_xuat_mua_hang;
DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_delete ON fp_farm_de_xuat_mua_hang;
DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_ct_select ON fp_farm_de_xuat_mua_hang_chi_tiet;
DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_ct_insert ON fp_farm_de_xuat_mua_hang_chi_tiet;
DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_ct_update ON fp_farm_de_xuat_mua_hang_chi_tiet;
DROP POLICY IF EXISTS fp_farm_de_xuat_mua_hang_ct_delete ON fp_farm_de_xuat_mua_hang_chi_tiet;

CREATE POLICY fp_farm_de_xuat_mua_hang_select ON fp_farm_de_xuat_mua_hang
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_farm_de_xuat_mua_hang_insert ON fp_farm_de_xuat_mua_hang
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fp_farm_de_xuat_mua_hang_update ON fp_farm_de_xuat_mua_hang
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fp_farm_de_xuat_mua_hang_delete ON fp_farm_de_xuat_mua_hang
  FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_farm_de_xuat_mua_hang_ct_select ON fp_farm_de_xuat_mua_hang_chi_tiet
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_farm_de_xuat_mua_hang_ct_insert ON fp_farm_de_xuat_mua_hang_chi_tiet
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fp_farm_de_xuat_mua_hang_ct_update ON fp_farm_de_xuat_mua_hang_chi_tiet
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fp_farm_de_xuat_mua_hang_ct_delete ON fp_farm_de_xuat_mua_hang_chi_tiet
  FOR DELETE TO authenticated USING (true);


-- GRANT (bắt buộc khi bảng đã ENABLE ROW LEVEL SECURITY — thiếu thì PostgREST trả HTTP 403)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fp_farm_de_xuat_mua_hang TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fp_farm_de_xuat_mua_hang_chi_tiet TO authenticated;
DO $$
DECLARE seq text;
BEGIN
  FOR seq IN
    SELECT pg_get_serial_sequence('public.fp_farm_de_xuat_mua_hang', 'id')
    UNION ALL
    SELECT pg_get_serial_sequence('public.fp_farm_de_xuat_mua_hang_chi_tiet', 'id')
  LOOP
    IF seq IS NOT NULL THEN
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO authenticated', seq);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- Số phiếu tự tăng trên server (app format: FDX- + pad 4 số)
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS fp_farm_de_xuat_mua_hang_so_seq START 1;

CREATE OR REPLACE FUNCTION get_next_so_phieu_farm_de_xuat_mua_hang()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('fp_farm_de_xuat_mua_hang_so_seq');
$$;

COMMENT ON FUNCTION get_next_so_phieu_farm_de_xuat_mua_hang() IS 'Số thứ tự tiếp theo cho số phiếu đề xuất mua hàng farm (app format: FDX- + pad)';

GRANT USAGE ON SEQUENCE fp_farm_de_xuat_mua_hang_so_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_so_phieu_farm_de_xuat_mua_hang() TO authenticated;
