import { z } from 'zod';
import i18n from '../../../../lib/i18n';

export const donDatHangChiTietItemSchema = z.object({
  id_hang_hoa: z.string().min(1, i18n.t('donDatHang.validation.itemRequired')),
  so_luong: z.coerce.number().min(0.0001, i18n.t('donDatHang.validation.quantityMin')),
  don_gia: z.coerce.number().min(0).optional(),
  ghi_chu: z.string().optional(),
});

export const donDatHangChiTietFormItemSchema = z.object({
  id_hang_hoa: z.string(),
  so_luong: z.coerce.number(),
  don_gia: z.coerce.number().optional(),
  ghi_chu: z.string().optional(),
});

export const donDatHangSchema = z
  .object({
    so_po: z
      .string()
      .min(1, i18n.t('donDatHang.validation.codeRequired'))
      .max(50, i18n.t('donDatHang.validation.codeMax')),
    ngay_dat: z.string().min(1, i18n.t('donDatHang.validation.orderDateRequired')),
    ngay_giao_dk: z.string().min(1, i18n.t('donDatHang.validation.deliveryDateRequired')),
    id_nha_cung_cap: z.string().min(1, i18n.t('donDatHang.validation.supplierRequired')),
    id_kho_nhan: z.string().optional().nullable(),
    id_phieu_de_xuat_vat_tu: z.string().optional().nullable(),
    id_nguoi_dat: z.string().min(1, i18n.t('donDatHang.validation.buyerRequired')),
    id_nguoi_duyet: z.string().optional().nullable(),
    dieu_khoan_thanh_toan: z.string().optional(),
    ghi_chu: z.string().optional(),
    trang_thai: z.coerce.number().refine((val) => val >= 0 && val <= 7, {
      message: i18n.t('donDatHang.validation.statusInvalid'),
    }),
    chi_tiet: z.array(donDatHangChiTietFormItemSchema).default([]),
  })
  .refine(
    (data) => {
      const hasItem = (data.chi_tiet ?? []).some(
        (row) => row.id_hang_hoa && String(row.so_luong ?? 0) !== '0'
      );
      return hasItem;
    },
    { message: i18n.t('donDatHang.validation.atLeastOneItem'), path: ['chi_tiet'] }
  );

export type DonDatHangChiTietFormItem = z.infer<typeof donDatHangChiTietFormItemSchema>;
export type DonDatHangFormValues = z.infer<typeof donDatHangSchema>;
