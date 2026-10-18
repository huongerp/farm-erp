-- 047: Đơn đặt hàng — view danh sách thêm Số dòng hàng + Tổng tiền.
-- Bảng Danh sách PO cần hiện tổng tiền / số mặt hàng mà không tải chi tiết từng đơn về browser.
-- Chỉ THÊM 2 cột vào CUỐI v_don_dat_hang_summary (giữ nguyên cột + thứ tự cũ) nên view phụ thuộc
-- v_don_dat_hang_chi_tiet_flat và v_xuat_don_dat_hang (migration 012) không đổi.
-- security_invoker giữ nguyên → RLS của fp_mh_don_dat_hang_chi_tiet vẫn áp. GRANT giữ nguyên (OR REPLACE).

BEGIN;

CREATE OR REPLACE VIEW public.v_don_dat_hang_summary WITH (security_invoker='true') AS
 SELECT d.id,
    d.so_po,
    d.ngay_dat,
    d.ngay_giao_dk,
    d.id_nha_cung_cap,
    d.ten_nha_cung_cap,
    d.id_kho_nhan,
    d.ten_kho_nhan,
    d.id_phieu_de_xuat_vat_tu,
    d.id_nguoi_dat,
    d.id_nguoi_duyet,
    d.ghi_chu,
    d.trang_thai,
    d.tg_tao,
    d.tg_cap_nhat,
    pdx.so_phieu AS so_phieu_de_xuat_ref,
    ncc.ma_doi_tac AS ref_ma_nha_cung_cap,
    COALESCE(d.ten_nha_cung_cap, ncc.ten_doi_tac) AS ref_ten_nha_cung_cap,
    COALESCE(d.ten_kho_nhan, kho_ref.ten_kho) AS ref_ten_kho_nhan,
    nv_dat.ho_va_ten AS ref_ten_nguoi_dat,
    'NV'::text || nv_dat.id::text AS ref_ma_nguoi_dat,
    nv_duyet.ho_va_ten AS ref_ten_nguoi_duyet,
        CASE
            WHEN d.id_nguoi_duyet IS NOT NULL THEN 'NV'::text || d.id_nguoi_duyet::text
            ELSE NULL::text
        END AS ref_ma_nguoi_duyet,
    ct.so_dong_hang,
    ct.tong_tien
   FROM fp_mh_don_dat_hang d
     LEFT JOIN fp_mh_phieu_de_xuat_vat_tu pdx ON pdx.id = d.id_phieu_de_xuat_vat_tu
     LEFT JOIN fp_mh_danh_sach_doi_tac ncc ON ncc.id = d.id_nha_cung_cap AND ncc.loai_doi_tac = 'nha_cung_cap'::text
     LEFT JOIN fp_mh_danh_sach_kho kho_ref ON kho_ref.id = d.id_kho_nhan
     LEFT JOIN fp_var_nhan_vien nv_dat ON nv_dat.id = d.id_nguoi_dat
     LEFT JOIN fp_var_nhan_vien nv_duyet ON nv_duyet.id = d.id_nguoi_duyet
     LEFT JOIN LATERAL (
       SELECT count(*)::integer AS so_dong_hang,
              COALESCE(sum(c.thanh_tien), 0)::numeric AS tong_tien
         FROM fp_mh_don_dat_hang_chi_tiet c
        WHERE c.id_don_dat_hang = d.id
     ) ct ON true;

COMMENT ON VIEW public.v_don_dat_hang_summary IS 'Đơn đặt hàng + so phiếu đề xuất + JOIN tên + số dòng hàng / tổng tiền (giảm egress app)';

COMMIT;

NOTIFY pgrst, 'reload schema';
