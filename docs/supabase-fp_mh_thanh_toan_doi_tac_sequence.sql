-- =============================================================================
-- Số phiếu thanh toán đối tác – RPC Supabase (sequence)
-- Chạy sau khi đã có bảng fp_mh_thanh_toan_doi_tac.
-- App gọi get_next_so_phieu_thanh_toan_doi_tac() lúc Lưu, format: tiền_tố + pad(số).
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS fp_mh_thanh_toan_doi_tac_so_seq START 1;

CREATE OR REPLACE FUNCTION get_next_so_phieu_thanh_toan_doi_tac()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nextval('fp_mh_thanh_toan_doi_tac_so_seq');
$$;

COMMENT ON FUNCTION get_next_so_phieu_thanh_toan_doi_tac() IS 'Trả về số thứ tự tiếp theo cho số phiếu thanh toán đối tác (app format: tiền tố + pad)';

GRANT USAGE ON SEQUENCE fp_mh_thanh_toan_doi_tac_so_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_so_phieu_thanh_toan_doi_tac() TO authenticated;

-- Nếu bảng đã có phiếu, đồng bộ sequence (thay N = max(số trong so_phieu) + 1):
-- ALTER SEQUENCE fp_mh_thanh_toan_doi_tac_so_seq RESTART WITH N;
