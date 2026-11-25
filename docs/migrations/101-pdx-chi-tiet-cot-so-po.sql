-- =============================================================================
-- 101-pdx-chi-tiet-cot-so-po.sql — tab Chi tiết phiếu đề xuất vật tư: thêm cột «Phiếu PO»
--
-- Với mỗi dòng vật tư, hiện số PO (đơn đặt hàng) đã lên cho vật tư đó để người mua hàng biết
-- vật tư nào đã lên PO. Luật (giống getDaDatTheoPhieuDeXuatDb bên đơn đặt hàng):
-- dòng đề xuất (phiếu, hàng hoá) đã lên PO = có fp_mh_don_dat_hang cùng id_phieu_de_xuat_vat_tu,
-- trang_thai <> 'Hủy', và đơn có dòng chi tiết cùng id_hang_hoa. Một dòng có thể nằm ở nhiều PO
-- → nối các số PO bằng ", ".
--
-- Chỉ CREATE OR REPLACE VIEW (giữ nguyên thứ tự/tên mọi cột cũ, thêm so_po_da_len ở CUỐI).
-- Không GRANT mới: quyền của view giữ nguyên, view chạy security_invoker nên RLS
-- của fp_mh_don_dat_hang vẫn áp dụng cho người xem.
-- =============================================================================

BEGIN;

CREATE OR REPLACE VIEW public.v_phieu_de_xuat_vat_tu_chi_tiet_flat
WITH (security_invoker='true') AS
 SELECT ct.id,
    ct.id_phieu_de_xuat_vat_tu,
    ct.id_hang_hoa,
    ct.so_luong,
    ct.don_vi_tinh,
    ct.thong_so,
    ct.ghi_chu,
    ct.so_phieu,
    ct.ngay,
    ct.ngay_can,
    ct.ten_noi_de_xuat,
    ct.ten_nguoi_de_xuat,
    ct.ten_nguoi_duyet,
    ct.trang_thai_phieu,
    ct.id_tien_do_mh,
    ct.ten_tien_do_mh,
    ct.trao_doi,
    hh.ma_hang_hoa AS ref_ma_hang_hoa,
    hh.ten_hang_hoa AS ref_ten_hang_hoa,
    (SELECT string_agg(DISTINCT d.so_po, ', ' ORDER BY d.so_po)
       FROM public.fp_mh_don_dat_hang d
       JOIN public.fp_mh_don_dat_hang_chi_tiet dct ON dct.id_don_dat_hang = d.id
      WHERE d.id_phieu_de_xuat_vat_tu = ct.id_phieu_de_xuat_vat_tu
        AND dct.id_hang_hoa = ct.id_hang_hoa
        AND d.trang_thai <> 'Hủy') AS so_po_da_len
   FROM (public.fp_mh_phieu_de_xuat_vat_tu_chi_tiet ct
     LEFT JOIN public.fp_mh_danh_sach_hang_hoa hh ON ((hh.id = ct.id_hang_hoa)));

COMMENT ON VIEW public.v_phieu_de_xuat_vat_tu_chi_tiet_flat IS 'Chi tiết đề xuất vật tư phẳng (JOIN mã/tên HH — phục vụ tìm kiếm) + số PO đã lên';

COMMIT;
