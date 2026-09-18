-- =============================================================================
-- UNIQUE mã cho module Hàng hóa – Quản lý nhà sơ chế
--   fp_farm_danh_muc_hang_hoa(ma_danh_muc)
--   fp_farm_danh_sach_hang_hoa(ma_hang_hoa)
--
-- Vì sao cần:
--   1) Chống trùng mã ở tầng DB. Trước đây chỉ có app kiểm tra trước khi insert →
--      hai người bấm lưu cùng lúc (hoặc import hàng loạt) vẫn lọt mã trùng.
--   2) Bật đường ghi nhanh cho import: có unique index thì PostgREST chạy được
--      `upsert(..., { onConflict: 'ma_hang_hoa' })` — 1 request cho cả lô 500 dòng,
--      thay vì 1 request PATCH cho mỗi dòng ghi đè.
--
-- CHƯA chạy file này app vẫn hoạt động: import tự nhận mã lỗi 42P10 và rơi về
-- đường lui (ghi từng dòng), chỉ chậm hơn. Xem lib/import-bulk.ts.
--
-- CÁCH CHẠY — một lệnh, nguyên khối:
--   psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -f docs/supabase-fp_farm_hang_hoa_unique_ma.sql
--
-- File nằm trong một transaction: nếu đang có mã trùng thì DO block bên dưới
-- RAISE EXCEPTION, toàn bộ rollback, DB không đổi gì và thông báo lỗi liệt kê
-- luôn các mã bị trùng để sửa tay. Sửa xong chạy lại file này.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- CỔNG CHẶN — có mã trùng thì dừng toàn bộ, không ghi gì.
-- So sánh trên upper(btrim(...)) vì bước chuẩn hóa ngay dưới sẽ đưa về dạng đó.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  trung text;
BEGIN
  SELECT string_agg(format('%s (id: %s)', ma, cac_id), ', ')
  INTO trung
  FROM (
    SELECT upper(btrim(ma_danh_muc)) AS ma, array_agg(id ORDER BY id) AS cac_id
    FROM public.fp_farm_danh_muc_hang_hoa
    WHERE ma_danh_muc IS NOT NULL AND btrim(ma_danh_muc) <> ''
    GROUP BY 1 HAVING count(*) > 1
  ) t;
  IF trung IS NOT NULL THEN
    RAISE EXCEPTION 'fp_farm_danh_muc_hang_hoa đang trùng ma_danh_muc: %. Sửa tay rồi chạy lại file này.', trung;
  END IF;

  SELECT string_agg(format('%s (id: %s)', ma, cac_id), ', ')
  INTO trung
  FROM (
    SELECT upper(btrim(ma_hang_hoa)) AS ma, array_agg(id ORDER BY id) AS cac_id
    FROM public.fp_farm_danh_sach_hang_hoa
    WHERE ma_hang_hoa IS NOT NULL AND btrim(ma_hang_hoa) <> ''
    GROUP BY 1 HAVING count(*) > 1
  ) t;
  IF trung IS NOT NULL THEN
    RAISE EXCEPTION 'fp_farm_danh_sach_hang_hoa đang trùng ma_hang_hoa: %. Sửa tay rồi chạy lại file này.', trung;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- CHUẨN HÓA — app luôn ghi mã dạng viết hoa, không khoảng trắng thừa;
-- dữ liệu cũ có thể còn lệch nên đưa về cùng chuẩn trước khi tạo unique index.
-- ---------------------------------------------------------------------------
UPDATE public.fp_farm_danh_muc_hang_hoa
SET ma_danh_muc = upper(btrim(ma_danh_muc))
WHERE ma_danh_muc IS NOT NULL AND ma_danh_muc <> upper(btrim(ma_danh_muc));

UPDATE public.fp_farm_danh_sach_hang_hoa
SET ma_hang_hoa = upper(btrim(ma_hang_hoa))
WHERE ma_hang_hoa IS NOT NULL AND ma_hang_hoa <> upper(btrim(ma_hang_hoa));

-- ---------------------------------------------------------------------------
-- UNIQUE INDEX — cột đang cho phép NULL; unique index của Postgres bỏ qua NULL
-- nên các dòng chưa có mã không bị chặn.
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_fp_farm_danh_muc_hang_hoa_ma
  ON public.fp_farm_danh_muc_hang_hoa (ma_danh_muc);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fp_farm_danh_sach_hang_hoa_ma
  ON public.fp_farm_danh_sach_hang_hoa (ma_hang_hoa);

-- Index thường trên cùng cột thành thừa sau khi đã có unique index.
DROP INDEX IF EXISTS idx_fp_farm_danh_sach_hang_hoa_ma_hang_hoa;

COMMIT;

-- ---------------------------------------------------------------------------
-- SOI THỦ CÔNG (không bắt buộc) — chạy riêng nếu muốn xem trước danh sách trùng:
--
--   SELECT upper(btrim(ma_hang_hoa)) AS ma, count(*) AS so_dong, array_agg(id) AS cac_id
--   FROM public.fp_farm_danh_sach_hang_hoa
--   WHERE ma_hang_hoa IS NOT NULL AND btrim(ma_hang_hoa) <> ''
--   GROUP BY 1 HAVING count(*) > 1;
-- ---------------------------------------------------------------------------
