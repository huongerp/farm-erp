-- ==========================================================
-- fp_farm_du_bao_sl_dong_thung — thêm cột KPI tự tính (GENERATED ALWAYS STORED)
-- Chạy sau: docs/supabase-fp_farm_du_bao_sl_dong_thung.sql
-- Idempotent: dùng ADD COLUMN IF NOT EXISTS
-- ==========================================================
-- Lý do chọn GENERATED thay vì app-layer:
--   Tất cả 5 cột đều tính hoàn toàn từ các cột trong cùng bảng (same-table).
--   Dùng GENERATED ALWAYS ... STORED giúp SQL report / filter trực tiếp
--   mà không cần app tính lại; DB tự cập nhật khi row thay đổi.
-- Giới hạn PostgreSQL: cột GENERATED không được tham chiếu cột GENERATED khác
--   → phải inline công thức can_nang_binh_quan_buong trong các cột kế tiếp.
-- ==========================================================

-- 1. Cân nặng bình quân buồng (kg/buồng)
ALTER TABLE public.fp_farm_du_bao_sl_dong_thung
  ADD COLUMN IF NOT EXISTS can_nang_binh_quan_buong numeric(18,4)
    GENERATED ALWAYS AS (
      CASE WHEN so_buong_can_mau = 0 THEN NULL
           ELSE tong_can_nang_mau / so_buong_can_mau::numeric
      END
    ) STORED;

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.can_nang_binh_quan_buong
  IS 'Cân nặng BQ / buồng (kg). GENERATED: tong_can_nang_mau / so_buong_can_mau. NULL khi so_buong_can_mau = 0.';

-- 2. Tổng khối lượng kế hoạch (kg)
ALTER TABLE public.fp_farm_du_bao_sl_dong_thung
  ADD COLUMN IF NOT EXISTS tong_khoi_luong_ke_hoach numeric(18,4)
    GENERATED ALWAYS AS (
      CASE WHEN so_buong_can_mau = 0 THEN 0
           ELSE (tong_can_nang_mau / so_buong_can_mau::numeric) * tong_buong_nhap_ke_hoach
      END
    ) STORED;

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_khoi_luong_ke_hoach
  IS 'Tổng KL kế hoạch (kg). GENERATED: canBQ * tong_buong_nhap_ke_hoach.';

-- 3. Tổng số thùng kế hoạch (đã làm tròn)
ALTER TABLE public.fp_farm_du_bao_sl_dong_thung
  ADD COLUMN IF NOT EXISTS tong_so_thung_ke_hoach integer
    GENERATED ALWAYS AS (
      CASE
        WHEN so_buong_can_mau = 0 OR quy_cach_dong_thung_ke_hoach = 0 THEN 0
        ELSE ROUND(
               (tong_can_nang_mau / so_buong_can_mau::numeric)
               * tong_buong_nhap_ke_hoach
               * ty_le_thu_hoi_ke_hoach
               / quy_cach_dong_thung_ke_hoach
             )::integer
      END
    ) STORED;

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_so_thung_ke_hoach
  IS 'Số thùng kế hoạch (đã ROUND). GENERATED: round(canBQ * buongKH * tyLeKH / quyCachKH).';

-- 4. Tổng khối lượng thực tế (kg)
ALTER TABLE public.fp_farm_du_bao_sl_dong_thung
  ADD COLUMN IF NOT EXISTS tong_khoi_luong_thuc_te numeric(18,4)
    GENERATED ALWAYS AS (
      CASE WHEN so_buong_can_mau = 0 THEN 0
           ELSE (tong_can_nang_mau / so_buong_can_mau::numeric) * tong_buong_nhap_thuc_te
      END
    ) STORED;

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_khoi_luong_thuc_te
  IS 'Tổng KL thực tế (kg). GENERATED: canBQ * tong_buong_nhap_thuc_te.';

-- 5. Tổng số thùng thực tế (đã làm tròn)
ALTER TABLE public.fp_farm_du_bao_sl_dong_thung
  ADD COLUMN IF NOT EXISTS tong_so_thung_thuc_te integer
    GENERATED ALWAYS AS (
      CASE
        WHEN so_buong_can_mau = 0 OR quy_cach_dong_thung_thuc_te = 0 THEN 0
        ELSE ROUND(
               (tong_can_nang_mau / so_buong_can_mau::numeric)
               * tong_buong_nhap_thuc_te
               * ty_le_thu_hoi_thuc_te
               / quy_cach_dong_thung_thuc_te
             )::integer
      END
    ) STORED;

COMMENT ON COLUMN public.fp_farm_du_bao_sl_dong_thung.tong_so_thung_thuc_te
  IS 'Số thùng thực tế (đã ROUND). GENERATED: round(canBQ * buongTT * tyleTT / quyCachTT).';
