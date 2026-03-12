-- =============================================================================
-- Trạng thái thanh toán đối tác (Partner payment status) – Thiết lập đề xuất vật tư
-- Chạy trong Supabase Dashboard → SQL Editor
-- Trạng thái lưu text trực tiếp (Đang hoạt động / Ngừng hoạt động). Hạn chế CHECK.
-- =============================================================================

DROP TABLE IF EXISTS fp_mh_trang_thai_thanh_toan_doi_tac;

CREATE TABLE fp_mh_trang_thai_thanh_toan_doi_tac (
  id           bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma           text NOT NULL,
  ten          text NOT NULL,
  thu_tu       integer NOT NULL DEFAULT 0,
  mau          text,
  ghi_chu      text,
  trang_thai   text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao       timestamptz DEFAULT now(),
  tg_cap_nhat  timestamptz DEFAULT now()
);

COMMENT ON TABLE fp_mh_trang_thai_thanh_toan_doi_tac IS 'Danh mục trạng thái thanh toán đối tác – dùng trong module Thiết lập đề xuất vật tư';
COMMENT ON COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.ma IS 'Mã trạng thái (VD: CHO_THANH_TOAN, DA_THANH_TOAN)';
COMMENT ON COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.ten IS 'Tên hiển thị (VD: Chờ thanh toán, Đã thanh toán)';
COMMENT ON COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.thu_tu IS 'Thứ tự sắp xếp';
COMMENT ON COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.mau IS 'Mã màu hex (VD: #f59e0b)';
COMMENT ON COLUMN fp_mh_trang_thai_thanh_toan_doi_tac.trang_thai IS 'Trạng thái hoạt động – text (Đang hoạt động / Ngừng hoạt động)';

CREATE UNIQUE INDEX idx_fp_mh_ttttdt_ma ON fp_mh_trang_thai_thanh_toan_doi_tac(ma);
CREATE INDEX idx_fp_mh_ttttdt_thu_tu ON fp_mh_trang_thai_thanh_toan_doi_tac(thu_tu);
CREATE INDEX idx_fp_mh_ttttdt_trang_thai ON fp_mh_trang_thai_thanh_toan_doi_tac(trang_thai);

-- Trigger: cập nhật tg_cap_nhat khi sửa
CREATE OR REPLACE FUNCTION fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat
  BEFORE UPDATE ON fp_mh_trang_thai_thanh_toan_doi_tac
  FOR EACH ROW EXECUTE PROCEDURE fp_mh_trang_thai_thanh_toan_doi_tac_tg_cap_nhat();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE fp_mh_trang_thai_thanh_toan_doi_tac ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow select trang_thai_thanh_toan_doi_tac" ON fp_mh_trang_thai_thanh_toan_doi_tac
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert trang_thai_thanh_toan_doi_tac" ON fp_mh_trang_thai_thanh_toan_doi_tac
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update trang_thai_thanh_toan_doi_tac" ON fp_mh_trang_thai_thanh_toan_doi_tac
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete trang_thai_thanh_toan_doi_tac" ON fp_mh_trang_thai_thanh_toan_doi_tac
  FOR DELETE TO authenticated USING (true);

-- Dữ liệu mặc định (khớp seed trong app)
INSERT INTO fp_mh_trang_thai_thanh_toan_doi_tac (ma, ten, thu_tu, mau, trang_thai)
VALUES
  ('CHO_THANH_TOAN', 'Chờ thanh toán', 1, '#f59e0b', 'Đang hoạt động'),
  ('DA_THANH_TOAN', 'Đã thanh toán', 2, '#22c55e', 'Đang hoạt động'),
  ('QUA_HAN', 'Quá hạn', 3, '#ef4444', 'Đang hoạt động'),
  ('DA_HUY', 'Đã hủy', 4, '#64748b', 'Đang hoạt động');
