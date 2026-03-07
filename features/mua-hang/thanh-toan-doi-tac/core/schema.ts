import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const thanhToanDoiTacSchema = z.object({
  so_phieu: z
    .string()
    .min(1, i18n.t('thanhToanDoiTac.validation.soPhieuRequired'))
    .max(50, i18n.t('thanhToanDoiTac.validation.soPhieuMax')),
  hang_muc_thanh_toan: z
    .string()
    .min(1, i18n.t('thanhToanDoiTac.validation.hangMucRequired'))
    .max(255, i18n.t('thanhToanDoiTac.validation.hangMucMax')),
  ngay: z.string().min(1, i18n.t('thanhToanDoiTac.validation.ngayRequired')),
  id_don_vi: z.string().optional().nullable(),
  id_doi_tac: z.string().min(1, i18n.t('thanhToanDoiTac.validation.doiTacRequired')),
  id_trang_thai_thanh_toan: z.string().min(1, i18n.t('thanhToanDoiTac.validation.trangThaiRequired')),
  so_tien: z.coerce.number().min(0, i18n.t('thanhToanDoiTac.validation.soTienMin')),
  ngay_xu_ly: z.string().optional().nullable(),
  ghi_chu: z.string().optional().nullable(),
  id_nguoi_tao: z.string().min(1, i18n.t('thanhToanDoiTac.validation.nguoiTaoRequired')),
});

export type ThanhToanDoiTacFormValues = z.infer<typeof thanhToanDoiTacSchema>;
