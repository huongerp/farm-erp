-- =============================================================================
-- Thanh toán đối tác (Partner Payment)
-- Chạy trong Supabase Dashboard → SQL Editor
-- Trạng thái lưu text trực tiếp, không dùng CHECK/ENUM. Hạn chế ràng buộc CHECK.
-- Liên kết: id_doi_tac → bảng đối tác; id_don_vi → phòng ban; id_nguoi_tao → nhân viên
-- =============================================================================

DROP TABLE IF EXISTS fp_mh_thanh_toan_doi_tac;

CREATE TABLE fp_mh_thanh_toan_doi_tac (
  id                     bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  so_phieu               text NOT NULL,
  hang_muc_thanh_toan    text NOT NULL,
  ngay                   date NOT NULL,
  id_don_vi              bigint,
  id_doi_tac             bigint NOT NULL,
  trang_thai             text NOT NULL DEFAULT 'Chờ xử lý',
  so_tien                numeric(18, 0) NOT NULL DEFAULT 0,
  ngay_xu_ly             date,
  ghi_chu                text,
  id_nguoi_tao           bigint,
  tg_tao                 timestamptz DEFAULT now(),
  tg_cap_nhat            timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_thanh_toan_doi_tac IS 'Thanh toán đối tác – số phiếu, hạng mục, đối tác, số tiền, trạng thái (text)';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.so_phieu IS 'Mã phiếu / số chứng từ thanh toán';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.hang_muc_thanh_toan IS 'Hạng mục thanh toán';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.id_don_vi IS 'Đơn vị (phòng ban) – tham chiếu bảng phòng ban';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.id_doi_tac IS 'Đối tác – tham chiếu bảng đối tác';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.trang_thai IS 'Trạng thái thanh toán – ghi text trực tiếp (VD: Chờ xử lý, Đã thanh toán)';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.so_tien IS 'Số tiền (VNĐ)';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.ngay_xu_ly IS 'Ngày xử lý thanh toán';
COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.id_nguoi_tao IS 'Người tạo – tham chiếu bảng nhân viên';

CREATE UNIQUE INDEX idx_fp_mh_thanh_toan_doi_tac_so_phieu ON fp_mh_thanh_toan_doi_tac(so_phieu);
CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_ngay ON fp_mh_thanh_toan_doi_tac(ngay);
CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_id_doi_tac ON fp_mh_thanh_toan_doi_tac(id_doi_tac);
CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_id_don_vi ON fp_mh_thanh_toan_doi_tac(id_don_vi);
CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_trang_thai ON fp_mh_thanh_toan_doi_tac(trang_thai);
CREATE INDEX idx_fp_mh_thanh_toan_doi_tac_ngay_xu_ly ON fp_mh_thanh_toan_doi_tac(ngay_xu_ly);

-- Trigger: cập nhật tg_cap_nhat khi sửa
CREATE OR REPLACE FUNCTION fp_mh_thanh_toan_doi_tac_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_thanh_toan_doi_tac_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_thanh_toan_doi_tac
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_thanh_toan_doi_tac_tg_cap_nhat();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE fp_mh_thanh_toan_doi_tac ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select thanh_toan_doi_tac" ON fp_mh_thanh_toan_doi_tac
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert thanh_toan_doi_tac" ON fp_mh_thanh_toan_doi_tac
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update thanh_toan_doi_tac" ON fp_mh_thanh_toan_doi_tac
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete thanh_toan_doi_tac" ON fp_mh_thanh_toan_doi_tac
  FOR DELETE TO authenticated USING (true);
