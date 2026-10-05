-- =============================================================================
-- 020-dknh-xuat-theo-cay-hang-qc.sql — Đăng ký nhận hàng: hàng xuất theo cây hàng QC
--
-- Trước đây mỗi dòng hàng xuất = 1 thùng quét QR mã HÀNG HOÁ (danh mục hàng hoá).
-- Nay xếp xe bằng cách quét tem QC (Giám sát chất lượng): quét 1 tem bất kỳ của cây hàng
-- = ghi CẢ cây hàng (so_thung_cay thùng) lên xe. Bỏ liên kết trực tiếp với danh mục hàng hoá —
-- thành phẩm lấy qua phiếu QC.
-- Điều kiện (phiếu QC đã nộp, cảnh báo không đạt / trùng xe) kiểm ở app:
-- dang-ky-nhan-hang/core/quet-cay-hang.ts.
-- Lúc chạy bảng _ct có 0 dòng → đổi cấu trúc không mất dữ liệu.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-020
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/020-dknh-xuat-theo-cay-hang-qc.sql
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.fp_farm_dang_ky_nhan_hang_ct) THEN
    RAISE EXCEPTION 'fp_farm_dang_ky_nhan_hang_ct đang có dữ liệu — cần chuyển dữ liệu trước khi đổi cấu trúc';
  END IF;
END
$$;

DROP VIEW public.v_farm_dang_ky_nhan_hang_tong_hh;

ALTER TABLE public.fp_farm_dang_ky_nhan_hang_ct
  DROP COLUMN id_hang_hoa,
  DROP COLUMN ma_hang_hoa,
  ADD COLUMN id_phieu_gscl bigint NOT NULL
    REFERENCES public.fp_farm_giam_sat_chat_luong(id) ON DELETE RESTRICT,
  ADD COLUMN ma_tem_quet text,
  ADD CONSTRAINT fp_farm_dknh_ct_phieu_gscl_key UNIQUE (id_phieu, id_phieu_gscl);

COMMENT ON TABLE public.fp_farm_dang_ky_nhan_hang_ct IS
  'Cây hàng xếp lên xe — mỗi dòng 1 cây hàng (phiếu giám sát chất lượng), quét tem QC hoặc chọn tay';
COMMENT ON COLUMN public.fp_farm_dang_ky_nhan_hang_ct.id_phieu_gscl IS 'Phiếu giám sát chất lượng (cây hàng)';
COMMENT ON COLUMN public.fp_farm_dang_ky_nhan_hang_ct.ma_tem_quet IS 'Mã tem QC đã quét; NULL khi chọn tay';
COMMENT ON COLUMN public.fp_farm_dang_ky_nhan_hang_ct.so_luong IS 'Số thùng của cây hàng lúc ghi (chụp lại so_thung_cay)';

CREATE INDEX idx_fp_farm_dknh_ct_phieu_gscl ON public.fp_farm_dang_ky_nhan_hang_ct USING btree (id_phieu_gscl);

-- Giữ đúng các cột cũ để thống kê / mẫu in / XLSX dùng tiếp; thành phẩm lấy qua phiếu QC.
-- so_dong = số cây hàng, tong_so_luong = tổng thùng.
CREATE VIEW public.v_farm_dang_ky_nhan_hang_tong_hh WITH (security_invoker='true') AS
SELECT ct.id_phieu,
       g.id_hang_hoa,
       hh.ma_hang_hoa,
       hh.ten_hang_hoa,
       hh.dvt,
       count(*)::integer AS so_dong,
       sum(ct.so_luong) AS tong_so_luong
FROM public.fp_farm_dang_ky_nhan_hang_ct ct
JOIN public.fp_farm_giam_sat_chat_luong g ON g.id = ct.id_phieu_gscl
LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON hh.id = g.id_hang_hoa
GROUP BY ct.id_phieu, g.id_hang_hoa, hh.ma_hang_hoa, hh.ten_hang_hoa, hh.dvt;

REVOKE ALL ON TABLE public.v_farm_dang_ky_nhan_hang_tong_hh FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.v_farm_dang_ky_nhan_hang_tong_hh TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
