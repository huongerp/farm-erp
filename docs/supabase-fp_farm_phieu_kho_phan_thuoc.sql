-- =============================================================================
-- Phiếu kho phân thuốc (Quản lý farm) — nhập / xuất / chuyển
-- kho_id → fp_mh_danh_sach_kho (dùng chung với Mua hàng)
-- id_hang_hoa chi tiết → fp_farm_danh_sach_hang_hoa
-- Chạy sau: fp_mh_danh_sach_kho, fp_farm_danh_sach_hang_hoa
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_farm_phieu_kho_phan_thuoc (
  id               bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  so_phieu         text NOT NULL,
  ngay             date NOT NULL,
  loai             text NOT NULL CHECK (loai IN ('nhập', 'xuất', 'chuyển')),
  kho_id           bigint NOT NULL,
  ten_kho          text,
  kho_den_id       bigint,
  ten_kho_den      text,
  trang_thai       text NOT NULL DEFAULT 'Chờ duyệt',
  mo_ta            text,
  trao_doi         text,
  id_nguoi_duyet   bigint,
  nguoi_tao_id     bigint,
  ten_nguoi_tao    text,
  tg_tao           timestamptz DEFAULT now(),
  tg_cap_nhat      timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_farm_phieu_kho_pt_so_phieu_loai
  ON fp_farm_phieu_kho_phan_thuoc(so_phieu, loai);
CREATE INDEX IF NOT EXISTS idx_fp_farm_phieu_kho_pt_ngay ON fp_farm_phieu_kho_phan_thuoc(ngay);
CREATE INDEX IF NOT EXISTS idx_fp_farm_phieu_kho_pt_kho_id ON fp_farm_phieu_kho_phan_thuoc(kho_id);
CREATE INDEX IF NOT EXISTS idx_fp_farm_phieu_kho_pt_loai ON fp_farm_phieu_kho_phan_thuoc(loai);

CREATE TABLE IF NOT EXISTS fp_farm_phieu_kho_phan_thuoc_chi_tiet (
  id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_phieu_kho   bigint NOT NULL REFERENCES fp_farm_phieu_kho_phan_thuoc(id) ON DELETE CASCADE,
  id_hang_hoa    bigint NOT NULL,
  ten_hang_hoa   text,
  don_vi_tinh    text,
  so_luong       numeric(18,4) NOT NULL CHECK (so_luong > 0),
  don_gia        numeric(18,4) DEFAULT 0,
  thanh_tien     numeric(18,4) DEFAULT 0,
  so_lot         text,
  ghi_chu        text,
  nguoi_tao_id   bigint,
  ten_nguoi_tao  text,
  tg_tao         timestamptz DEFAULT now(),
  tg_cap_nhat    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fp_farm_phieu_kho_pt_ct_id_phieu
  ON fp_farm_phieu_kho_phan_thuoc_chi_tiet(id_phieu_kho);

COMMENT ON TABLE fp_farm_phieu_kho_phan_thuoc IS 'Phiếu kho phân thuốc farm (nhập/xuất/chuyển)';
COMMENT ON TABLE fp_farm_phieu_kho_phan_thuoc_chi_tiet IS 'Chi tiết phiếu kho phân thuốc';

CREATE OR REPLACE FUNCTION fp_farm_phieu_kho_pt_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_farm_phieu_kho_pt_tg_cap_nhat ON fp_farm_phieu_kho_phan_thuoc;
CREATE TRIGGER tr_fp_farm_phieu_kho_pt_tg_cap_nhat
  BEFORE UPDATE ON fp_farm_phieu_kho_phan_thuoc
  FOR EACH ROW EXECUTE FUNCTION fp_farm_phieu_kho_pt_tg_cap_nhat();

CREATE OR REPLACE FUNCTION fp_farm_phieu_kho_pt_ct_thanh_tien()
RETURNS TRIGGER AS $$
BEGIN
  NEW.thanh_tien = COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_fp_farm_phieu_kho_pt_ct_thanh_tien ON fp_farm_phieu_kho_phan_thuoc_chi_tiet;
CREATE TRIGGER tr_fp_farm_phieu_kho_pt_ct_thanh_tien
  BEFORE INSERT OR UPDATE ON fp_farm_phieu_kho_phan_thuoc_chi_tiet
  FOR EACH ROW EXECUTE FUNCTION fp_farm_phieu_kho_pt_ct_thanh_tien();

-- RLS
ALTER TABLE fp_farm_phieu_kho_phan_thuoc ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_farm_phieu_kho_phan_thuoc_chi_tiet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_select ON fp_farm_phieu_kho_phan_thuoc;
DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_insert ON fp_farm_phieu_kho_phan_thuoc;
DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_update ON fp_farm_phieu_kho_phan_thuoc;
DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_delete ON fp_farm_phieu_kho_phan_thuoc;
DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_ct_select ON fp_farm_phieu_kho_phan_thuoc_chi_tiet;
DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_ct_insert ON fp_farm_phieu_kho_phan_thuoc_chi_tiet;
DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_ct_update ON fp_farm_phieu_kho_phan_thuoc_chi_tiet;
DROP POLICY IF EXISTS fp_farm_phieu_kho_pt_ct_delete ON fp_farm_phieu_kho_phan_thuoc_chi_tiet;

CREATE POLICY fp_farm_phieu_kho_pt_select ON fp_farm_phieu_kho_phan_thuoc
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_farm_phieu_kho_pt_insert ON fp_farm_phieu_kho_phan_thuoc
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fp_farm_phieu_kho_pt_update ON fp_farm_phieu_kho_phan_thuoc
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fp_farm_phieu_kho_pt_delete ON fp_farm_phieu_kho_phan_thuoc
  FOR DELETE TO authenticated USING (true);

CREATE POLICY fp_farm_phieu_kho_pt_ct_select ON fp_farm_phieu_kho_phan_thuoc_chi_tiet
  FOR SELECT TO authenticated USING (true);
CREATE POLICY fp_farm_phieu_kho_pt_ct_insert ON fp_farm_phieu_kho_phan_thuoc_chi_tiet
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fp_farm_phieu_kho_pt_ct_update ON fp_farm_phieu_kho_phan_thuoc_chi_tiet
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY fp_farm_phieu_kho_pt_ct_delete ON fp_farm_phieu_kho_phan_thuoc_chi_tiet
  FOR DELETE TO authenticated USING (true);

-- Số phiếu tự động (prefix khác phiếu kho mua hàng: FNK-, FXK-, FCK-)
CREATE SEQUENCE IF NOT EXISTS fp_farm_phieu_kho_pt_so_seq_nhap START 1;
CREATE SEQUENCE IF NOT EXISTS fp_farm_phieu_kho_pt_so_seq_xuat START 1;
CREATE SEQUENCE IF NOT EXISTS fp_farm_phieu_kho_pt_so_seq_chuyen START 1;

CREATE OR REPLACE FUNCTION get_next_so_phieu_farm_pt(p_loai text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
  prefix text;
BEGIN
  IF p_loai = 'nhập' THEN
    next_val := nextval('fp_farm_phieu_kho_pt_so_seq_nhap');
    prefix := 'FNK-';
  ELSIF p_loai = 'xuất' THEN
    next_val := nextval('fp_farm_phieu_kho_pt_so_seq_xuat');
    prefix := 'FXK-';
  ELSIF p_loai = 'chuyển' THEN
    next_val := nextval('fp_farm_phieu_kho_pt_so_seq_chuyen');
    prefix := 'FCK-';
  ELSE
    RAISE EXCEPTION 'Invalid loai: %', p_loai;
  END IF;
  RETURN prefix || lpad(next_val::text, 4, '0');
END;
$$;

COMMENT ON FUNCTION get_next_so_phieu_farm_pt(text) IS 'Mã phiếu kho phân thuốc tiếp theo (FNK-, FXK-, FCK-)';

GRANT USAGE ON SEQUENCE fp_farm_phieu_kho_pt_so_seq_nhap TO authenticated;
GRANT USAGE ON SEQUENCE fp_farm_phieu_kho_pt_so_seq_xuat TO authenticated;
GRANT USAGE ON SEQUENCE fp_farm_phieu_kho_pt_so_seq_chuyen TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_so_phieu_farm_pt(text) TO authenticated;
