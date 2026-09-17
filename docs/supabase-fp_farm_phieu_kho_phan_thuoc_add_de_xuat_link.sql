-- =============================================================================
-- Phiếu kho phân thuốc: liên kết về đề xuất mua hàng farm đã sinh ra phiếu
-- Dùng cho nút "Tạo phiếu kho" ở drawer chi tiết Đề xuất mua hàng
-- (badge "Đã tạo phiếu kho <số phiếu>" + chặn tạo trùng).
-- Chạy sau: fp_farm_phieu_kho_phan_thuoc, fp_farm_de_xuat_mua_hang
-- =============================================================================

ALTER TABLE fp_farm_phieu_kho_phan_thuoc
  ADD COLUMN IF NOT EXISTS id_de_xuat_mua_hang bigint,
  ADD COLUMN IF NOT EXISTS so_phieu_de_xuat    text;

COMMENT ON COLUMN fp_farm_phieu_kho_phan_thuoc.id_de_xuat_mua_hang IS 'Phiếu đề xuất mua hàng farm đã sinh ra phiếu kho này → fp_farm_de_xuat_mua_hang(id)';
COMMENT ON COLUMN fp_farm_phieu_kho_phan_thuoc.so_phieu_de_xuat IS 'Số phiếu đề xuất (kéo sẵn, khỏi join khi xuất DB)';

CREATE INDEX IF NOT EXISTS idx_fp_farm_phieu_kho_pt_id_de_xuat_mua_hang
  ON fp_farm_phieu_kho_phan_thuoc(id_de_xuat_mua_hang)
  WHERE id_de_xuat_mua_hang IS NOT NULL;

-- View summary dùng p.* nên tự có 2 cột mới; chạy lại để chắc chắn cột xuất hiện qua PostgREST.
-- docs/supabase-v_farm_phieu_kho_phan_thuoc_summary.sql
