-- =============================================================================
-- Dự báo SL đóng thùng: bỏ unique (chi nhánh, ngày) — cho phép nhiều phiếu / ngày / farm
-- Chạy trên DB đã tạo index uq_fp_farm_dbdt_chi_nhanh_ngay từ bản SQL cũ.
-- Idempotent.
-- =============================================================================

DROP INDEX IF EXISTS public.uq_fp_farm_dbdt_chi_nhanh_ngay;

CREATE INDEX IF NOT EXISTS idx_fp_farm_dbdt_chi_nhanh_ngay ON public.fp_farm_du_bao_sl_dong_thung(id_chi_nhanh, ngay DESC);
