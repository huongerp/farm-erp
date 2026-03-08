-- =============================================================================
-- Bảng fp_var_phong_ban (Phòng ban) – đồng bộ với app Farm ERP
-- Chạy trong Supabase Dashboard → SQL Editor
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_var_phong_ban (
  id              bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ten_phong_ban   text NOT NULL,
  chuc_nang       text,
  tt              smallint DEFAULT 0,
  trang_thai      text DEFAULT 'Đang dùng',
  tg_tao          timestamptz DEFAULT now(),
  tg_cap_nhat     timestamptz
);

COMMENT ON TABLE fp_var_phong_ban IS 'Phòng ban – 1 cấp';
COMMENT ON COLUMN fp_var_phong_ban.trang_thai IS 'Đang dùng | Ngừng';

CREATE INDEX IF NOT EXISTS idx_fp_var_phong_ban_tt ON fp_var_phong_ban(tt);
CREATE INDEX IF NOT EXISTS idx_fp_var_phong_ban_trang_thai ON fp_var_phong_ban(trang_thai);

-- RLS: cho phép đọc (anon + authenticated), ghi (authenticated)
ALTER TABLE fp_var_phong_ban ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read fp_var_phong_ban" ON fp_var_phong_ban;
CREATE POLICY "Allow anon read fp_var_phong_ban"
  ON fp_var_phong_ban FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow authenticated read fp_var_phong_ban" ON fp_var_phong_ban;
CREATE POLICY "Allow authenticated read fp_var_phong_ban"
  ON fp_var_phong_ban FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write fp_var_phong_ban" ON fp_var_phong_ban;
CREATE POLICY "Allow authenticated write fp_var_phong_ban"
  ON fp_var_phong_ban FOR ALL TO authenticated USING (true) WITH CHECK (true);
