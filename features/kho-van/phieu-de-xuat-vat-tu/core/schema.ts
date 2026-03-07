import { z } from 'zod';
import i18n from '../../../../lib/i18n';

/** Schema cho một dòng chi tiết (dùng khi gửi API). */
export const phieuDeXuatVatTuChiTietItemSchema = z.object({
  id_hang_hoa: z.string().min(1, i18n.t('phieuDeXuatVatTu.validation.itemRequired')),
  so_luong: z.coerce.number().min(0.0001, i18n.t('phieuDeXuatVatTu.validation.quantityMin')),
  thong_so: z.string().optional(),
  ghi_chu: z.string().optional(),
});

/** Form cho phép dòng trống (id_hang_hoa rỗng, so_luong 0); filter khi submit. */
export const phieuDeXuatVatTuChiTietFormItemSchema = z.object({
  id_hang_hoa: z.string(),
  so_luong: z.coerce.number(),
  thong_so: z.string().optional(),
  ghi_chu: z.string().optional(),
});

export const phieuDeXuatVatTuSchema = z
  .object({
    so_phieu: z
      .string()
      .min(1, i18n.t('phieuDeXuatVatTu.validation.codeRequired'))
      .max(50, i18n.t('phieuDeXuatVatTu.validation.codeMax')),
    ngay: z.string().min(1, i18n.t('phieuDeXuatVatTu.validation.dateRequired')),
    ngay_can: z.string().min(1, i18n.t('phieuDeXuatVatTu.validation.requiredDateRequired')),
    id_noi_de_xuat: z.string().min(1, i18n.t('phieuDeXuatVatTu.validation.placeRequired')),
    id_nguoi_de_xuat: z.string().min(1, i18n.t('phieuDeXuatVatTu.validation.requesterRequired')),
    id_nguoi_duyet: z.string().optional().nullable(),
    ghi_chu: z.string().optional(),
    trang_thai: z.coerce.number().refine((val) => val === 0 || val === 1 || val === 2, {
      message: i18n.t('phieuDeXuatVatTu.validation.statusInvalid'),
    }),
    chi_tiet: z.array(phieuDeXuatVatTuChiTietFormItemSchema).default([]),
  })
  .refine(
    (data) => {
      const hasItem = (data.chi_tiet ?? []).some(
        (row) => row.id_hang_hoa && String(row.so_luong ?? 0) !== '0'
      );
      return hasItem;
    },
    { message: i18n.t('phieuDeXuatVatTu.validation.atLeastOneItem'), path: ['chi_tiet'] }
  );

export type PhieuDeXuatVatTuChiTietFormItem = z.infer<typeof phieuDeXuatVatTuChiTietFormItemSchema>;
export type PhieuDeXuatVatTuFormValues = z.infer<typeof phieuDeXuatVatTuSchema>;
