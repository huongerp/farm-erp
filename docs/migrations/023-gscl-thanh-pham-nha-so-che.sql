-- =============================================================================
-- 023-gscl-thanh-pham-nha-so-che.sql — Giám sát chất lượng: thành phẩm lấy từ danh mục Nhà sơ chế
--
-- Trước đây fp_farm_giam_sat_chat_luong.id_hang_hoa trỏ sang danh mục Mua hàng
-- (fp_mh_danh_sach_hang_hoa) → form chọn ra vật tư/thiết bị thay vì thành phẩm.
-- Nay trỏ sang danh mục Nhà sơ chế (fp_farm_danh_sach_hang_hoa, nhóm "Thành phẩm").
-- Phiếu cũ đổi id theo mã hàng (ma_hang_hoa); mã không có bên Nhà sơ chế → NULL.
-- View tổng hàng của Đăng ký nhận hàng (migration 020) đổi join theo.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-023
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/023-gscl-thanh-pham-nha-so-che.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_giam_sat_chat_luong
  DROP CONSTRAINT fp_farm_giam_sat_chat_luong_id_hang_hoa_fkey;

UPDATE public.fp_farm_giam_sat_chat_luong g
SET id_hang_hoa = (
  SELECT f.id
  FROM public.fp_mh_danh_sach_hang_hoa m
  JOIN public.fp_farm_danh_sach_hang_hoa f ON f.ma_hang_hoa = m.ma_hang_hoa
  WHERE m.id = g.id_hang_hoa
  LIMIT 1
)
WHERE g.id_hang_hoa IS NOT NULL;

ALTER TABLE public.fp_farm_giam_sat_chat_luong
  ADD CONSTRAINT fp_farm_giam_sat_chat_luong_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_farm_danh_sach_hang_hoa(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.fp_farm_giam_sat_chat_luong.id_hang_hoa IS
  'Thành phẩm — danh mục hàng hoá Nhà sơ chế (fp_farm_danh_sach_hang_hoa)';

DROP VIEW public.v_farm_dang_ky_nhan_hang_tong_hh;

-- Giữ nguyên cột như 020; chỉ đổi bảng hàng hoá sang danh mục Nhà sơ chế.
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
LEFT JOIN public.fp_farm_danh_sach_hang_hoa hh ON hh.id = g.id_hang_hoa
GROUP BY ct.id_phieu, g.id_hang_hoa, hh.ma_hang_hoa, hh.ten_hang_hoa, hh.dvt;

REVOKE ALL ON TABLE public.v_farm_dang_ky_nhan_hang_tong_hh FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.v_farm_dang_ky_nhan_hang_tong_hh TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
