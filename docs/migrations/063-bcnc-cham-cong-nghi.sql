-- =============================================================================
-- 063-bcnc-cham-cong-nghi.sql — Báo cáo nhân công: chấm «Nghỉ» (nghỉ cả ngày)
--
-- Người nghỉ cả ngày vẫn giữ tên trong chuyền (không phải xoá dòng) với mã NGHI: 0 công, 0 giờ,
-- không vào CN ngày / CN nửa / tăng ca. Không đổi cấu trúc bảng.
--
-- PHẢI chạy TRƯỚC khi deploy frontend (lưu NGHI sẽ bị CHECK cũ chặn).
--
-- Chạy: bash scripts/db-backup.sh truoc-063
--       bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/063-bcnc-cham-cong-nghi.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_nv
  DROP CONSTRAINT IF EXISTS fp_farm_bcnc_nv_cham_cong_chk;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_nv
  ADD CONSTRAINT fp_farm_bcnc_nv_cham_cong_chk
  CHECK (cham_cong = ANY (ARRAY['CA_NGAY', 'NUA_NGAY', 'SANG', 'CHIEU', 'NGHI']));

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_nv.cham_cong IS
  'CA_NGAY = cả ngày (sáng + chiều), SANG = buổi sáng, CHIEU = buổi chiều, NGHI = nghỉ cả ngày (0 công), NUA_NGAY = nửa ngày (phiếu cũ, không rõ buổi)';

COMMIT;
