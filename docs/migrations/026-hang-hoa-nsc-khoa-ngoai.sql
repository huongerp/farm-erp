-- =============================================================================
-- 026-hang-hoa-nsc-khoa-ngoai.sql — Khoá ngoại tới danh mục hàng hoá Nhà sơ chế + RPC "đang dùng ở đâu"
--
-- Cùng vấn đề với 025 (danh mục Mua hàng): phiếu kho phân thuốc, đề xuất mua hàng, đợt kiểm kê PT
-- trỏ tới fp_farm_danh_sach_hang_hoa mà không có khoá → xoá hàng đang dùng vẫn "thành công", để lại
-- dòng mồ côi (lúc viết: 4 dòng phiếu kho PT, 23 dòng kiểm kê PT). GSCL đã có khoá từ 023.
--
-- Khoá NOT VALID: không quét / không sửa dòng mồ côi cũ, nhưng từ nay chặn xoá hàng đang dùng.
-- Hệ quả: lưu lại một phiếu cũ còn dòng của hàng đã xoá sẽ báo lỗi khoá ngoại — bỏ / thay dòng đó.
--
-- RPC rpc_farm_hang_hoa_dang_dung(ids): liệt kê phiếu đang dùng từng hàng (kể cả GSCL), để màn
-- Hàng hoá phân thuốc tách "xoá được" / "đang dùng" trước khi xoá.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-026
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/026-hang-hoa-nsc-khoa-ngoai.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_farm_phieu_kho_phan_thuoc_chi_tiet
  ADD CONSTRAINT fp_farm_phieu_kho_phan_thuoc_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_farm_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.fp_farm_de_xuat_mua_hang_chi_tiet
  ADD CONSTRAINT fp_farm_de_xuat_mua_hang_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_farm_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.fp_farm_dot_kiem_ke_pt_chi_tiet
  ADD CONSTRAINT fp_farm_dot_kiem_ke_pt_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_farm_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

-- Mỗi dòng = một phiếu đang dùng một mặt hàng (so_dong = số dòng của hàng đó trong phiếu).
-- SECURITY INVOKER: đọc theo RLS của người gọi; khoá ngoại ở trên là chốt cuối.
CREATE OR REPLACE FUNCTION public.rpc_farm_hang_hoa_dang_dung(p_ids bigint[])
    RETURNS TABLE (
        id_hang_hoa bigint,
        loai text,
        id_phieu bigint,
        so_phieu text,
        ngay date,
        trang_thai text,
        so_dong integer
    )
    LANGUAGE sql STABLE
    SET search_path TO 'public'
AS $$
    SELECT ct.id_hang_hoa, 'phieu_kho_pt', p.id, p.so_phieu::text, p.ngay::date, p.trang_thai::text, count(*)::integer
    FROM fp_farm_phieu_kho_phan_thuoc_chi_tiet ct
    JOIN fp_farm_phieu_kho_phan_thuoc p ON p.id = ct.id_phieu_kho
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'de_xuat_mua_hang', p.id, p.so_phieu::text, p.ngay::date, p.trang_thai::text, count(*)::integer
    FROM fp_farm_de_xuat_mua_hang_chi_tiet ct
    JOIN fp_farm_de_xuat_mua_hang p ON p.id = ct.id_de_xuat_mua_hang
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'dot_kiem_ke_pt', p.id, p.ma_dot::text, p.ngay_bat_dau::date, p.trang_thai::text, count(*)::integer
    FROM fp_farm_dot_kiem_ke_pt_chi_tiet ct
    JOIN fp_farm_dot_kiem_ke_pt p ON p.id = ct.id_dot_kiem_ke_pt
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT g.id_hang_hoa, 'giam_sat_chat_luong', g.id, g.so_phieu::text, g.ngay::date, g.trang_thai::text, 1
    FROM fp_farm_giam_sat_chat_luong g
    WHERE g.id_hang_hoa = ANY (p_ids)
$$;

COMMENT ON FUNCTION public.rpc_farm_hang_hoa_dang_dung(bigint[]) IS
  'Danh sách phiếu (kho PT, đề xuất mua hàng, kiểm kê PT, GSCL) đang dùng các hàng hoá Nhà sơ chế — kiểm tra trước khi xoá';

REVOKE ALL ON FUNCTION public.rpc_farm_hang_hoa_dang_dung(bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_farm_hang_hoa_dang_dung(bigint[]) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
