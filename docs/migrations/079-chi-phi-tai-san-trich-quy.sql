-- =============================================================================
-- 079-chi-phi-tai-san-trich-quy.sql — Chi phí tài sản: thêm trạng thái «Trích quỹ»
--
-- Danh mục fp_ts_trang_thai_chi_phi_tai_san có 1=CHO_DUYET, 2=DA_DUYET, 3=KHONG_DUYET.
-- Thêm 4=TRICH_QUY (phiếu đã được trích quỹ chi trả). App map cố định id → enum ở
-- features/hanh-chinh/bao-tri-sua-chua/services/chi-phi-tai-san-db.service.ts (4 → 'trich_quy').
-- Trigger sync_ten_trang_thai tự điền ten_trang_thai khi phiếu đổi sang id 4.
--
-- Chạy lại được. Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/079-chi-phi-tai-san-trich-quy.sql
-- =============================================================================

BEGIN;

INSERT INTO public.fp_ts_trang_thai_chi_phi_tai_san (id, ma, ten, thu_tu, ghi_chu)
OVERRIDING SYSTEM VALUE
VALUES (4, 'TRICH_QUY', 'Trích quỹ', 4, 'Phiếu đã trích quỹ chi trả')
ON CONFLICT (id) DO NOTHING;

-- Cột id là IDENTITY: đẩy sequence qua id lớn nhất để lần thêm tay sau không đụng id 4.
SELECT setval(
  'public.fp_ts_trang_thai_chi_phi_tai_san_id_seq',
  (SELECT max(id) FROM public.fp_ts_trang_thai_chi_phi_tai_san)
);

COMMIT;
