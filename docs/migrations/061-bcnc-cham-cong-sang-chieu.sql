-- =============================================================================
-- 061-bcnc-cham-cong-sang-chieu.sql — Báo cáo nhân công: chấm công Sáng / Chiều
--
-- Tờ chấm công giấy chấm theo cột S / C. Mã cham_cong mở rộng từ CA_NGAY | NUA_NGAY thành
-- CA_NGAY | NUA_NGAY | SANG | CHIEU (Sáng + Chiều = CA_NGAY). NUA_NGAY giữ cho phiếu cũ
-- (không biết buổi nào). Không đổi cấu trúc bảng: _ct_sub / KPI / thống kê giữ nguyên
-- (SANG, CHIEU, NUA_NGAY đều vào nhóm công nửa).
--
-- PHẢI chạy TRƯỚC khi deploy frontend (lưu SANG/CHIEU sẽ bị CHECK cũ chặn).
--
-- Chạy: bash scripts/db-backup.sh truoc-061
--       bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/061-bcnc-cham-cong-sang-chieu.sql
-- =============================================================================
BEGIN;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_nv
  DROP CONSTRAINT IF EXISTS fp_farm_bcnc_nv_cham_cong_chk;

ALTER TABLE public.fp_farm_bao_cao_nhan_cong_nv
  ADD CONSTRAINT fp_farm_bcnc_nv_cham_cong_chk
  CHECK (cham_cong = ANY (ARRAY['CA_NGAY', 'NUA_NGAY', 'SANG', 'CHIEU']));

COMMENT ON COLUMN public.fp_farm_bao_cao_nhan_cong_nv.cham_cong IS
  'CA_NGAY = cả ngày (sáng + chiều), SANG = buổi sáng, CHIEU = buổi chiều, NUA_NGAY = nửa ngày (phiếu cũ, không rõ buổi)';

COMMIT;
