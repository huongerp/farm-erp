-- =============================================================================
-- 025-hang-hoa-mh-khoa-ngoai.sql — Khoá ngoại tới danh mục hàng hoá Mua hàng + RPC "đang dùng ở đâu"
--
-- Trước đây chỉ GSCL có khoá ngoại tới fp_mh_danh_sach_hang_hoa (và từ 023 đã chuyển sang danh mục
-- Nhà sơ chế). Phiếu kho, đơn đặt hàng, đề xuất vật tư, kiểm kê, định mức không có khoá → xoá hàng
-- hoá đang dùng vẫn "thành công" và để lại dòng mồ côi (06/10/2026: 172 hàng bị xoá → ~17.100 dòng
-- phiếu kho mồ côi).
--
-- Khoá thêm ở dạng NOT VALID: KHÔNG quét / KHÔNG sửa các dòng mồ côi cũ (giữ nguyên theo quyết định),
-- nhưng từ nay chặn xoá hàng đang dùng và chặn ghi id hàng không tồn tại.
-- Hệ quả: lưu lại một phiếu cũ còn dòng của hàng đã xoá sẽ báo lỗi khoá ngoại — bỏ / thay dòng đó.
--
-- RPC rpc_hang_hoa_dang_dung(ids): liệt kê phiếu đang dùng từng hàng, để màn Danh sách hàng hoá
-- tách "xoá được" / "đang dùng" trước khi xoá.
--
-- Trước khi chạy: bash scripts/db-backup.sh truoc-025
-- Chạy: bash scripts/db-sql.sh -v ON_ERROR_STOP=1 -f docs/migrations/025-hang-hoa-mh-khoa-ngoai.sql
-- =============================================================================

BEGIN;

ALTER TABLE public.fp_mh_phieu_kho_chi_tiet
  ADD CONSTRAINT fp_mh_phieu_kho_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_mh_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.fp_mh_don_dat_hang_chi_tiet
  ADD CONSTRAINT fp_mh_don_dat_hang_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_mh_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet
  ADD CONSTRAINT fp_mh_phieu_de_xuat_vat_tu_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_mh_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.fp_mh_dot_kiem_ke_kho_chi_tiet
  ADD CONSTRAINT fp_mh_dot_kiem_ke_kho_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_mh_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

ALTER TABLE public.fp_mh_phieu_kiem_ke_chi_tiet
  ADD CONSTRAINT fp_mh_phieu_kiem_ke_chi_tiet_id_hang_hoa_fkey
    FOREIGN KEY (id_hang_hoa) REFERENCES public.fp_mh_danh_sach_hang_hoa(id) ON DELETE RESTRICT NOT VALID;

-- Định mức tồn là cấu hình của chính mặt hàng, không phải chứng từ → xoá hàng thì xoá theo.
ALTER TABLE public.fp_mh_dinh_muc_ton_kho
  ADD CONSTRAINT fp_mh_dinh_muc_ton_kho_hang_hoa_id_fkey
    FOREIGN KEY (hang_hoa_id) REFERENCES public.fp_mh_danh_sach_hang_hoa(id) ON DELETE CASCADE NOT VALID;

-- Mỗi dòng = một phiếu đang dùng một mặt hàng (so_dong = số dòng chi tiết của hàng đó trong phiếu).
-- SECURITY INVOKER: đọc theo RLS của người gọi; khoá ngoại ở trên là chốt cuối.
CREATE OR REPLACE FUNCTION public.rpc_hang_hoa_dang_dung(p_ids bigint[])
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
    SELECT ct.id_hang_hoa, 'phieu_kho', p.id, p.so_phieu::text, p.ngay::date, p.trang_thai::text, count(*)::integer
    FROM fp_mh_phieu_kho_chi_tiet ct
    JOIN fp_mh_phieu_kho p ON p.id = ct.id_phieu_kho
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'don_dat_hang', p.id, p.so_po::text, p.ngay_dat::date, p.trang_thai::text, count(*)::integer
    FROM fp_mh_don_dat_hang_chi_tiet ct
    JOIN fp_mh_don_dat_hang p ON p.id = ct.id_don_dat_hang
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'de_xuat_vat_tu', p.id, p.so_phieu::text, p.ngay::date, p.trang_thai::text, count(*)::integer
    FROM fp_mh_phieu_de_xuat_vat_tu_chi_tiet ct
    JOIN fp_mh_phieu_de_xuat_vat_tu p ON p.id = ct.id_phieu_de_xuat_vat_tu
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'dot_kiem_ke', p.id, p.ma_dot::text, p.ngay_bat_dau::date, p.trang_thai::text, count(*)::integer
    FROM fp_mh_dot_kiem_ke_kho_chi_tiet ct
    JOIN fp_mh_dot_kiem_ke_kho p ON p.id = ct.id_dot_kiem_ke_kho
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
    UNION ALL
    SELECT ct.id_hang_hoa, 'phieu_kiem_ke', p.id, p.so_phieu::text, p.ngay::date, p.trang_thai::text, count(*)::integer
    FROM fp_mh_phieu_kiem_ke_chi_tiet ct
    JOIN fp_mh_phieu_kiem_ke p ON p.id = ct.id_phieu_kiem_ke
    WHERE ct.id_hang_hoa = ANY (p_ids)
    GROUP BY ct.id_hang_hoa, p.id
$$;

COMMENT ON FUNCTION public.rpc_hang_hoa_dang_dung(bigint[]) IS
  'Danh sách phiếu (kho, ĐĐH, đề xuất vật tư, kiểm kê) đang dùng các hàng hoá Mua hàng — kiểm tra trước khi xoá';

REVOKE ALL ON FUNCTION public.rpc_hang_hoa_dang_dung(bigint[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_hang_hoa_dang_dung(bigint[]) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
