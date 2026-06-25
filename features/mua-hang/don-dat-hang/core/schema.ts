import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_DON_DAT_HANG } from './constants';

function getDonDatHangChiTietItemSchema() {
  return z.object({
    id_hang_hoa: z.string().min(1, i18n.t('donDatHang.validation.itemRequired')),
    phan_loai: z.string().optional().nullable(),
    muc_dich_su_dung: z.string().optional().nullable(),
    so_luong: z.coerce.number().min(0.0001, i18n.t('donDatHang.validation.quantityMin')),
    don_gia: z.coerce.number().min(0).optional(),
    ghi_chu: z.string().optional(),
  });
}

function getDonDatHangChiTietFormItemSchema() {
  return z.object({
    id_hang_hoa: z.string(),
    phan_loai: z.string().optional().nullable(),
    muc_dich_su_dung: z.string().optional().nullable(),
    so_luong: z.coerce.number(),
    don_gia: z.coerce.number().optional(),
    ghi_chu: z.string().optional(),
  });
}

/** Factory — gọi khi validate để i18n.t() luôn dùng locale đã sẵn sàng. */
export function getDonDatHangSchema() {
  const chiTietFormItemSchema = getDonDatHangChiTietFormItemSchema();

  return z
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
      trang_thai: z.enum(TRANG_THAI_DON_DAT_HANG, {
        message: i18n.t('donDatHang.validation.statusInvalid'),
      }),
      chi_tiet: z.array(chiTietFormItemSchema).default([]),
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
}

/** @deprecated Dùng getDonDatHangSchema() — giữ để tương thích type inference. */
export const donDatHangSchema = getDonDatHangSchema();

export const donDatHangChiTietItemSchema = getDonDatHangChiTietItemSchema();
export const donDatHangChiTietFormItemSchema = getDonDatHangChiTietFormItemSchema();

export type DonDatHangChiTietFormItem = z.infer<ReturnType<typeof getDonDatHangChiTietFormItemSchema>>;
export type DonDatHangFormValues = z.infer<ReturnType<typeof getDonDatHangSchema>>;
