-- =============================================================================
-- Phiếu cấp phát / thu hồi / luân chuyển tài sản – cấu trúc Master-Detail
-- Bảng cha (header): thông tin chung (loại, người giữ, ngày, người thực hiện)
-- Bảng con (chi tiết): mỗi dòng = 1 tài sản
-- Trên DB không có FK cứng tới fp_ts_tai_san, fp_hc_noi_quan_ly, fp_var_nhan_vien;
-- app liên kết qua id + snapshot tên.
-- =============================================================================

-- Xóa bảng cũ (cấu trúc flat, 1 dòng = 1 tài sản)
DROP TABLE IF EXISTS fp_ts_phieu_cap_phat_thu_hoi CASCADE;

-- =============================================================================
-- 1. Bảng cha (header)
-- =============================================================================

CREATE TABLE fp_ts_phieu_cap_phat_thu_hoi (
  id                    bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ma_phieu              text NOT NULL,
  loai_phieu            text NOT NULL CHECK (loai_phieu IN (
    'Cấp phát', 'Thu hồi',
    'Luân chuyển vị trí', 'Luân chuyển người quản lý', 'Luân chuyển cả hai'
  )),
  id_nguoi_giu_truoc    bigint,
  ten_nguoi_giu_truoc   text,
  ma_nguoi_giu_truoc    text,
  id_nguoi_giu_sau      bigint,
  ten_nguoi_giu_sau     text,
  ma_nguoi_giu_sau      text,
  ngay_thuc_hien        date NOT NULL,
  id_nguoi_thuc_hien    bigint NOT NULL,
  ten_nguoi_thuc_hien   text,
  id_nguoi_tao          bigint,
  ten_nguoi_tao         text,
  ghi_chu               text,
  trang_thai            text NOT NULL DEFAULT 'Đang hoạt động',
  tg_tao                timestamptz DEFAULT now(),
  tg_cap_nhat           timestamptz DEFAULT now()
);

-- =============================================================================
-- 2. Bảng con (chi tiết) – mỗi dòng = 1 tài sản
-- =============================================================================

CREATE TABLE fp_ts_phieu_cap_phat_thu_hoi_ct (
  id                    bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_phieu              bigint NOT NULL REFERENCES fp_ts_phieu_cap_phat_thu_hoi(id) ON DELETE CASCADE,
  id_tai_san            bigint NOT NULL,
  ma_tai_san            text,
  ten_tai_san           text,
  id_noi_luu_truoc      bigint,
  ten_noi_luu_truoc     text,
  id_noi_luu_sau        bigint,
  ten_noi_luu_sau       text,
  ghi_chu               text,
  tg_tao                timestamptz DEFAULT now(),
  tg_cap_nhat           timestamptz DEFAULT now()
);

-- =============================================================================
-- 3. Indexes
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_fp_ts_phieu_cpth_ma_phieu
  ON fp_ts_phieu_cap_phat_thu_hoi(ma_phieu);

CREATE INDEX IF NOT EXISTS idx_fp_ts_phieu_cpth_ngay
  ON fp_ts_phieu_cap_phat_thu_hoi(ngay_thuc_hien);

CREATE INDEX IF NOT EXISTS idx_fp_ts_phieu_cpth_loai
  ON fp_ts_phieu_cap_phat_thu_hoi(loai_phieu);

CREATE INDEX IF NOT EXISTS idx_fp_ts_phieu_cpth_ct_id_phieu
  ON fp_ts_phieu_cap_phat_thu_hoi_ct(id_phieu);

CREATE INDEX IF NOT EXISTS idx_fp_ts_phieu_cpth_ct_id_tai_san
  ON fp_ts_phieu_cap_phat_thu_hoi_ct(id_tai_san);

-- =============================================================================
-- 4. Trigger tự cập nhật tg_cap_nhat
-- =============================================================================

CREATE OR REPLACE FUNCTION fp_ts_phieu_cpth_tg_cap_nhat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tg_cap_nhat = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_fp_ts_phieu_cpth_tg_cap_nhat
  BEFORE UPDATE ON fp_ts_phieu_cap_phat_thu_hoi
  FOR EACH ROW EXECUTE FUNCTION fp_ts_phieu_cpth_tg_cap_nhat();

CREATE OR REPLACE TRIGGER tr_fp_ts_phieu_cpth_ct_tg_cap_nhat
  BEFORE UPDATE ON fp_ts_phieu_cap_phat_thu_hoi_ct
  FOR EACH ROW EXECUTE FUNCTION fp_ts_phieu_cpth_tg_cap_nhat();

-- =============================================================================
-- 5. RLS
-- =============================================================================

ALTER TABLE fp_ts_phieu_cap_phat_thu_hoi ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_ts_phieu_cap_phat_thu_hoi_ct ENABLE ROW LEVEL SECURITY;

-- Header
CREATE POLICY "Allow select for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi
  FOR DELETE TO authenticated USING (true);

-- Chi tiết
CREATE POLICY "Allow select for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi_ct
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi_ct
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi_ct
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated" ON fp_ts_phieu_cap_phat_thu_hoi_ct
  FOR DELETE TO authenticated USING (true);

-- =============================================================================
-- 6. Sequence + RPC đánh số phiếu tự tăng dần
-- App gọi get_next_ma_phieu_cpth(p_loai) với p_loai = 'Cấp phát' | 'Thu hồi' | ...
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS fp_ts_phieu_cpth_seq_cap_phat START 1;
CREATE SEQUENCE IF NOT EXISTS fp_ts_phieu_cpth_seq_thu_hoi START 1;
CREATE SEQUENCE IF NOT EXISTS fp_ts_phieu_cpth_seq_luan_chuyen START 1;

CREATE OR REPLACE FUNCTION get_next_ma_phieu_cpth(p_loai text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val bigint;
  prefix text;
BEGIN
  IF p_loai = 'Cấp phát' THEN
    next_val := nextval('fp_ts_phieu_cpth_seq_cap_phat');
    prefix := 'CP-';
  ELSIF p_loai = 'Thu hồi' THEN
    next_val := nextval('fp_ts_phieu_cpth_seq_thu_hoi');
    prefix := 'TH-';
  ELSIF p_loai IN ('Luân chuyển vị trí', 'Luân chuyển người quản lý', 'Luân chuyển cả hai') THEN
    next_val := nextval('fp_ts_phieu_cpth_seq_luan_chuyen');
    prefix := 'LC-';
  ELSE
    RAISE EXCEPTION 'Invalid loai_phieu: %', p_loai;
  END IF;
  RETURN prefix || lpad(next_val::text, 4, '0');
END;
$$;

COMMENT ON FUNCTION get_next_ma_phieu_cpth(text) IS 'Trả về mã phiếu cấp phát/thu hồi tiếp theo (CP-0001, TH-0001, LC-0001)';

GRANT USAGE ON SEQUENCE fp_ts_phieu_cpth_seq_cap_phat TO authenticated;
GRANT USAGE ON SEQUENCE fp_ts_phieu_cpth_seq_thu_hoi TO authenticated;
GRANT USAGE ON SEQUENCE fp_ts_phieu_cpth_seq_luan_chuyen TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_ma_phieu_cpth(text) TO authenticated;

-- Nếu đã có phiếu, đồng bộ sequence (thay N = max(số) + 1 cho từng loại):
-- ALTER SEQUENCE fp_ts_phieu_cpth_seq_cap_phat RESTART WITH N;
-- ALTER SEQUENCE fp_ts_phieu_cpth_seq_thu_hoi RESTART WITH N;
-- ALTER SEQUENCE fp_ts_phieu_cpth_seq_luan_chuyen RESTART WITH N;
