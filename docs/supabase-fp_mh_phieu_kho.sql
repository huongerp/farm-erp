-- =============================================================================
-- Phiếu kho (nhập / xuất / chuyển) – khớp với script đã chạy trên Supabase
-- Trên DB không có FK; trên app liên kết: kho_id → fp_mh_danh_sach_kho,
-- id_hang_hoa → fp_mh_danh_sach_hang_hoa, nguoi_tao_id → fp_var_nhan_vien,
-- id_nha_cung_cap / id_khach_hang → fp_mh_danh_sach_doi_tac,
-- id_don_dat_hang (phiếu nhập) → fp_mh_don_dat_hang(id) — thêm bằng docs/supabase-update-phieu-kho-id-don-dat-hang.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_mh_phieu_kho (
  id               bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  so_phieu         text NOT NULL,
  ngay             date NOT NULL,
  loai             text NOT NULL CHECK (loai IN ('nhập', 'xuất', 'chuyển')),
  kho_id           bigint NOT NULL,
  ten_kho          text,
  kho_den_id       bigint,
  ten_kho_den      text,
  id_nha_cung_cap  bigint,
  id_khach_hang    bigint,
  trang_thai       text NOT NULL,
  mo_ta            text,
  nguoi_tao_id     bigint,
  ten_nguoi_tao    text,
  tg_tao           timestamptz DEFAULT now(),
  tg_cap_nhat      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fp_mh_phieu_kho_chi_tiet (
  id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_phieu_kho   bigint NOT NULL REFERENCES fp_mh_phieu_kho(id) ON DELETE CASCADE,
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

-- Nếu bảng đã tồn tại trước khi có so_lot, chạy: ALTER TABLE fp_mh_phieu_kho_chi_tiet ADD COLUMN IF NOT EXISTS so_lot text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_so_phieu_loai ON fp_mh_phieu_kho(so_phieu, loai);
CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_ngay ON fp_mh_phieu_kho(ngay);
CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_kho_id ON fp_mh_phieu_kho(kho_id);
CREATE INDEX IF NOT EXISTS idx_fp_mh_phieu_kho_chi_tiet_id_phieu_kho ON fp_mh_phieu_kho_chi_tiet(id_phieu_kho);

CREATE OR REPLACE FUNCTION fp_mh_phieu_kho_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_fp_mh_phieu_kho_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_phieu_kho
  FOR EACH ROW EXECUTE FUNCTION fp_mh_phieu_kho_tg_cap_nhat();

CREATE OR REPLACE FUNCTION fp_mh_phieu_kho_chi_tiet_thanh_tien()
RETURNS TRIGGER AS $$
BEGIN
  NEW.thanh_tien = COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_fp_mh_phieu_kho_chi_tiet_thanh_tien
  BEFORE INSERT OR UPDATE ON fp_mh_phieu_kho_chi_tiet
  FOR EACH ROW EXECUTE FUNCTION fp_mh_phieu_kho_chi_tiet_thanh_tien();

ALTER TABLE fp_mh_phieu_kho ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_mh_phieu_kho_chi_tiet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select for authenticated" ON fp_mh_phieu_kho
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow select for authenticated details" ON fp_mh_phieu_kho_chi_tiet
FOR SELECT TO authenticated USING (true);

-- =============================================================================
-- RLS: Thêm / Sửa / Xóa (cho user đã đăng nhập)
-- =============================================================================

-- fp_mh_phieu_kho
CREATE POLICY "Allow insert for authenticated" ON fp_mh_phieu_kho
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON fp_mh_phieu_kho
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated" ON fp_mh_phieu_kho
  FOR DELETE TO authenticated USING (true);

-- fp_mh_phieu_kho_chi_tiet
CREATE POLICY "Allow insert for authenticated details" ON fp_mh_phieu_kho_chi_tiet
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated details" ON fp_mh_phieu_kho_chi_tiet
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated details" ON fp_mh_phieu_kho_chi_tiet
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- Số phiếu tự động theo loại (RPC – sequence per loại)
-- App gọi get_next_so_phieu(p_loai) với p_loai = 'nhập' | 'xuất' | 'chuyển'.
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS fp_mh_phieu_kho_so_seq_nhap START 1;
CREATE SEQUENCE IF NOT EXISTS fp_mh_phieu_kho_so_seq_xuat START 1;
CREATE SEQUENCE IF NOT EXISTS fp_mh_phieu_kho_so_seq_chuyen START 1;

CREATE OR REPLACE FUNCTION get_next_so_phieu(p_loai text)
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
    next_val := nextval('fp_mh_phieu_kho_so_seq_nhap');
    prefix := 'NK-';
  ELSIF p_loai = 'xuất' THEN
    next_val := nextval('fp_mh_phieu_kho_so_seq_xuat');
    prefix := 'XK-';
  ELSIF p_loai = 'chuyển' THEN
    next_val := nextval('fp_mh_phieu_kho_so_seq_chuyen');
    prefix := 'CK-';
  ELSE
    RAISE EXCEPTION 'Invalid loai: %', p_loai;
  END IF;
  RETURN prefix || lpad(next_val::text, 4, '0');
END;
$$;

COMMENT ON FUNCTION get_next_so_phieu(text) IS 'Trả về mã phiếu tiếp theo theo loại (NK-0001, XK-0001, CK-0001)';

GRANT USAGE ON SEQUENCE fp_mh_phieu_kho_so_seq_nhap TO authenticated;
GRANT USAGE ON SEQUENCE fp_mh_phieu_kho_so_seq_xuat TO authenticated;
GRANT USAGE ON SEQUENCE fp_mh_phieu_kho_so_seq_chuyen TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_so_phieu(text) TO authenticated;

-- Nếu đã có phiếu, đồng bộ sequence (thay N = max(số) + 1 cho từng loại):
-- ALTER SEQUENCE fp_mh_phieu_kho_so_seq_nhap RESTART WITH N;
-- ALTER SEQUENCE fp_mh_phieu_kho_so_seq_xuat RESTART WITH N;
-- ALTER SEQUENCE fp_mh_phieu_kho_so_seq_chuyen RESTART WITH N;

