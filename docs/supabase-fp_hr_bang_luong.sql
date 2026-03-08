-- =============================================================================
-- Bảng fp_hr_bang_luong (Bảng lương theo nhân viên + kỳ tháng)
-- Pattern: id bigint PK, FK fp_var_nhan_vien, RLS, comment tiếng Việt
-- Chạy sau khi đã có bảng fp_var_nhan_vien
-- =============================================================================

CREATE TABLE IF NOT EXISTS fp_hr_bang_luong (
  id                        bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nhan_vien_id              bigint,
  nam                       smallint NOT NULL,
  thang                     smallint NOT NULL,
  ngay_cong                 numeric(10,2) NOT NULL DEFAULT 0,
  ngay_cong_chuan           numeric(10,2) NOT NULL DEFAULT 22,
  luong_co_ban              numeric(14,0) NOT NULL DEFAULT 0,
  luong_co_ban_tinh         numeric(14,0) NOT NULL DEFAULT 0,
  luong_kpi                 numeric(14,0) NOT NULL DEFAULT 0,
  diem_kpi                  numeric(8,2) NOT NULL DEFAULT 0,
  kpi_dat                   boolean NOT NULL DEFAULT false,
  ty_le_kpi_khong_dat       numeric(4,2) NOT NULL DEFAULT 0.7,
  luong_kpi_tinh            numeric(14,0) NOT NULL DEFAULT 0,
  luong_trach_nhiem         numeric(14,0) NOT NULL DEFAULT 0,
  luong_trach_nhiem_tinh    numeric(14,0) NOT NULL DEFAULT 0,
  phu_cap                   numeric(14,0) NOT NULL DEFAULT 0,
  phu_cap_tinh              numeric(14,0) NOT NULL DEFAULT 0,
  cong_tru_khac             numeric(14,0) NOT NULL DEFAULT 0,
  cong_tru_net              numeric(14,0) NOT NULL DEFAULT 0,
  tong_luong                numeric(14,0) NOT NULL DEFAULT 0,
  ghi_chu                   text,
  tg_tao                    timestamptz NOT NULL DEFAULT now(),
  tg_cap_nhat               timestamptz,
  CONSTRAINT uq_bang_luong_nhan_vien_ky UNIQUE (nhan_vien_id, nam, thang),
  CONSTRAINT chk_nam_thang CHECK (nam >= 2000 AND nam <= 2100 AND thang >= 1 AND thang <= 12)
);

CREATE INDEX IF NOT EXISTS idx_fp_hr_bang_luong_nhan_vien ON fp_hr_bang_luong(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_fp_hr_bang_luong_ky ON fp_hr_bang_luong(nam, thang);
CREATE INDEX IF NOT EXISTS idx_fp_hr_bang_luong_tg ON fp_hr_bang_luong(tg_cap_nhat DESC NULLS LAST);

ALTER TABLE fp_hr_bang_luong ENABLE ROW LEVEL SECURITY;

-- Authenticated: xem, thêm, sửa, xóa
CREATE POLICY "Full_Access_Authenticated_Policy"
  ON fp_hr_bang_luong FOR ALL TO authenticated USING (true) WITH CHECK (true);