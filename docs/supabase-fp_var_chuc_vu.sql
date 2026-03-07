-- =============================================================================
-- Bảng fp_var_chuc_vu (Chức vụ) – đồng bộ với app Farm ERP
-- Liên kết: fp_var_phong_ban (phòng ban), fp_var_cap_bac (cấp bậc)
-- Chạy trong Supabase Dashboard → SQL Editor (sau khi đã có fp_var_phong_ban, fp_var_cap_bac)
-- =============================================================================

-- Tạo bảng (chỉ chạy nếu chưa có bảng)
CREATE TABLE IF NOT EXISTS fp_var_chuc_vu (
  id               bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ten_chuc_vu       text,
  phong_ban_id      bigint REFERENCES fp_var_phong_ban(id) ON DELETE SET NULL,
  cap_bac_id        bigint REFERENCES fp_var_cap_bac(id) ON DELETE SET NULL,
  mo_ta             text,
  tt                smallint DEFAULT 0,
  trang_thai        text DEFAULT '1',
  tg_tao            timestamptz DEFAULT now(),
  tg_cap_nhat       timestamptz DEFAULT now()
);

-- Ghi chú kiểu dữ liệu:
-- id: bigint (PK, identity)
-- ten_chuc_vu: text
-- phong_ban_id: bigint (FK → fp_var_phong_ban.id), nullable
-- cap_bac_id: bigint (FK → fp_var_cap_bac.id), nullable
-- mo_ta: text, nullable
-- tt: smallint (thứ tự sắp xếp), default 0
-- trang_thai: text ('1' = đang dùng, '0' = ngừng), default '1'
-- tg_tao, tg_cap_nhat: timestamptz

-- Index cho truy vấn theo phòng ban / cấp bậc
CREATE INDEX IF NOT EXISTS idx_fp_var_chuc_vu_phong_ban_id ON fp_var_chuc_vu(phong_ban_id);
CREATE INDEX IF NOT EXISTS idx_fp_var_chuc_vu_cap_bac_id   ON fp_var_chuc_vu(cap_bac_id);
CREATE INDEX IF NOT EXISTS idx_fp_var_chuc_vu_tt           ON fp_var_chuc_vu(tt);
CREATE INDEX IF NOT EXISTS idx_fp_var_chuc_vu_trang_thai   ON fp_var_chuc_vu(trang_thai);

-- RLS (Row Level Security)
ALTER TABLE fp_var_chuc_vu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated đọc fp_var_chuc_vu"
  ON fp_var_chuc_vu
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated thêm/sửa/xóa fp_var_chuc_vu"
  ON fp_var_chuc_vu
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
