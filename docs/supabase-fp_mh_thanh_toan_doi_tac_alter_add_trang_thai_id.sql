-- =============================================================================
-- Bổ sung cột id_trang_thai_thanh_toan (FK) vào bảng Thanh toán đối tác
-- Giữ nguyên cột trang_thai (text) để tương thích / denormalize.
-- Chạy trong Supabase Dashboard → SQL Editor (sau khi đã có fp_mh_trang_thai_thanh_toan_doi_tac).
-- =============================================================================

-- Thêm cột FK tham chiếu bảng trạng thái thanh toán đối tác
ALTER TABLE fp_mh_thanh_toan_doi_tac
  ADD COLUMN IF NOT EXISTS id_trang_thai_thanh_toan bigint NULL;

-- Ràng buộc FK (tham chiếu fp_mh_trang_thai_thanh_toan_doi_tac.id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'fp_mh_thanh_toan_doi_tac'
      AND constraint_name = 'fk_thanh_toan_doi_tac_trang_thai'
  ) THEN
    ALTER TABLE fp_mh_thanh_toan_doi_tac
      ADD CONSTRAINT fk_thanh_toan_doi_tac_trang_thai
      FOREIGN KEY (id_trang_thai_thanh_toan)
      REFERENCES fp_mh_trang_thai_thanh_toan_doi_tac(id);
  END IF;
END $$;

COMMENT ON COLUMN fp_mh_thanh_toan_doi_tac.id_trang_thai_thanh_toan IS 'FK → fp_mh_trang_thai_thanh_toan_doi_tac.id; có thể dùng kèm cột trang_thai (text) để denormalize.';

-- Index cho tra cứu / filter theo trạng thái
CREATE INDEX IF NOT EXISTS idx_fp_mh_thanh_toan_doi_tac_id_trang_thai
  ON fp_mh_thanh_toan_doi_tac(id_trang_thai_thanh_toan);

-- (Tùy chọn) Cập nhật id_trang_thai_thanh_toan từ trang_thai hiện có – khớp theo tên (ten) trong bảng trạng thái
-- Chạy một lần sau khi thêm cột, nếu bạn muốn gán FK cho dữ liệu cũ:
/*
UPDATE fp_mh_thanh_toan_doi_tac t
SET id_trang_thai_thanh_toan = s.id
FROM fp_mh_trang_thai_thanh_toan_doi_tac s
WHERE t.trang_thai IS NOT NULL AND t.trang_thai <> ''
  AND trim(t.trang_thai) = trim(s.ten)
  AND t.id_trang_thai_thanh_toan IS NULL;
*/
