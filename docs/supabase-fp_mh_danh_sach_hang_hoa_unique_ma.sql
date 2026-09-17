-- =============================================================================
-- UNIQUE mã hàng hóa cho module Danh sách hàng hóa (Kho vận)
--   fp_mh_danh_sach_hang_hoa(ma_hang_hoa)
--
-- Cùng lý do với docs/supabase-fp_farm_hang_hoa_unique_ma.sql: chống trùng mã ở
-- tầng DB và bật đường upsert theo lô cho import (1 request/500 dòng).
-- Chưa chạy thì import vẫn chạy được, chỉ rơi về ghi từng dòng.
--
-- CÁCH CHẠY — một lệnh, nguyên khối:
--   psql "$VPS_DB_URL" -v ON_ERROR_STOP=1 -f docs/supabase-fp_mh_danh_sach_hang_hoa_unique_ma.sql
--
-- Đang có mã trùng thì DO block RAISE EXCEPTION, cả transaction rollback,
-- DB không đổi gì và thông báo lỗi liệt kê luôn các mã bị trùng.
-- =============================================================================

BEGIN;

-- CỔNG CHẶN — có mã trùng thì dừng toàn bộ, không ghi gì.
DO $$
DECLARE
  trung text;
BEGIN
  SELECT string_agg(format('%s (id: %s)', ma, cac_id), ', ')
  INTO trung
  FROM (
    SELECT upper(btrim(ma_hang_hoa)) AS ma, array_agg(id ORDER BY id) AS cac_id
    FROM public.fp_mh_danh_sach_hang_hoa
    WHERE ma_hang_hoa IS NOT NULL AND btrim(ma_hang_hoa) <> ''
    GROUP BY 1 HAVING count(*) > 1
  ) t;
  IF trung IS NOT NULL THEN
    RAISE EXCEPTION 'fp_mh_danh_sach_hang_hoa đang trùng ma_hang_hoa: %. Sửa tay rồi chạy lại file này.', trung;
  END IF;
END $$;

-- CHUẨN HÓA về đúng dạng app đang ghi.
UPDATE public.fp_mh_danh_sach_hang_hoa
SET ma_hang_hoa = upper(btrim(ma_hang_hoa))
WHERE ma_hang_hoa IS NOT NULL AND ma_hang_hoa <> upper(btrim(ma_hang_hoa));

-- UNIQUE INDEX (bỏ qua các dòng ma_hang_hoa NULL).
CREATE UNIQUE INDEX IF NOT EXISTS uq_fp_mh_danh_sach_hang_hoa_ma
  ON public.fp_mh_danh_sach_hang_hoa (ma_hang_hoa);

DROP INDEX IF EXISTS idx_fp_mh_danh_sach_hang_hoa_ma_hang_hoa;

COMMIT;
