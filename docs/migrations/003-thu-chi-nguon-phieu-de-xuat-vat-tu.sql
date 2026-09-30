-- Thu chi quỹ: thêm nguồn chứng từ "Mua hàng / Phiếu đề xuất vật tư" (fp_mh_phieu_de_xuat_vat_tu).
-- Khớp ThuChiNguon / NGUON_CHUNG_TU trong features/tai-chinh/thu-chi-quy/core.

BEGIN;

ALTER TABLE public.fp_tc_quy_thu_chi
  DROP CONSTRAINT IF EXISTS fp_tc_qtc_loai_chung_tu_check;

ALTER TABLE public.fp_tc_quy_thu_chi
  ADD CONSTRAINT fp_tc_qtc_loai_chung_tu_check CHECK (
    loai_chung_tu IS NULL
    OR loai_chung_tu = ANY (ARRAY['don_dat_hang', 'phieu_de_xuat_vat_tu', 'de_xuat_mua_hang', 'chi_phi_tai_san'])
  );

COMMENT ON COLUMN public.fp_tc_quy_thu_chi.loai_chung_tu IS
  'Nguồn tiền: don_dat_hang | phieu_de_xuat_vat_tu | de_xuat_mua_hang | chi_phi_tai_san (NULL = phiếu quỹ độc lập)';

COMMIT;
