-- 048: Đơn đặt hàng — thêm cột Điều khoản thanh toán.
-- Form/phiếu in đã có ô "Điều khoản thanh toán" nhưng bảng fp_mh_don_dat_hang chưa có cột nên giá trị
-- bị bỏ rơi khi lưu. Thêm cột, rồi:
--   * v_don_dat_hang_summary: thêm cột vào CUỐI (giữ nguyên cột + thứ tự của migration 047) để OR REPLACE
--     hợp lệ và không đụng view phụ thuộc (v_don_dat_hang_chi_tiet_flat, v_xuat_don_dat_hang).
--   * v_xuat_don_dat_hang (migration 012): thay NULL::text bằng giá trị thật (cùng kiểu, cùng vị trí).
-- security_invoker giữ nguyên → RLS bảng nền vẫn áp. GRANT giữ nguyên (OR REPLACE). Trigger nhật ký đã có.

BEGIN;

ALTER TABLE public.fp_mh_don_dat_hang ADD COLUMN IF NOT EXISTS dieu_khoan_thanh_toan text;

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
    ct.tong_tien,
    d.dieu_khoan_thanh_toan
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

CREATE OR REPLACE VIEW public.v_xuat_don_dat_hang WITH (security_invoker='true') AS
SELECT s.id,
       s.so_po,
       s.ngay_dat,
       s.ngay_giao_dk,
       s.trang_thai,
       s.ref_ten_nha_cung_cap AS ten_nha_cung_cap,
       s.ref_ma_nha_cung_cap AS ma_nha_cung_cap,
       s.id_nha_cung_cap,
       s.ref_ten_kho_nhan AS ten_kho_nhan,
       s.id_kho_nhan,
       s.so_phieu_de_xuat_ref AS so_phieu_de_xuat,
       s.id_phieu_de_xuat_vat_tu,
       s.ref_ten_nguoi_dat AS ten_nguoi_dat,
       s.ref_ma_nguoi_dat AS ma_nguoi_dat,
       s.id_nguoi_dat,
       s.ref_ten_nguoi_duyet AS ten_nguoi_duyet,
       s.ref_ma_nguoi_duyet AS ma_nguoi_duyet,
       s.id_nguoi_duyet,
       s.dieu_khoan_thanh_toan,
       s.ghi_chu,
       s.tg_cap_nhat,
       s.tg_tao
  FROM public.v_don_dat_hang_summary s;

COMMIT;

NOTIFY pgrst, 'reload schema';
