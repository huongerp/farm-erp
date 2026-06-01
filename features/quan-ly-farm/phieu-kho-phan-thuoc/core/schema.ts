import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const TRANG_THAI_VALUES = ['Chờ duyệt', 'Đã duyệt', 'Không duyệt'] as const;

export const phieuKhoPTChiTietFormItemSchema = z.object({
  id_hang_hoa: z.string(),
  so_luong: z.coerce.number(),
  don_gia: z.coerce.number().optional(),
  so_lot: z.string().optional(),
  ghi_chu: z.string().optional(),
});

export const phieuKhoPTSchema = z
  .object({
    so_phieu: z.string().max(50, i18n.t('phieuKhoPhanThuoc.validation.codeMax')),
    ngay: z.string().min(1, i18n.t('phieuKhoPhanThuoc.validation.dateRequired')),
    loai: z.enum(['nhập', 'xuất', 'chuyển'], { message: i18n.t('phieuKhoPhanThuoc.validation.loaiInvalid') }),
    kho_id: z.string().min(1, i18n.t('phieuKhoPhanThuoc.validation.warehouseRequired')),
    kho_den_id: z.string().optional().nullable(),
    mo_ta: z.string().optional(),
    trang_thai: z.enum(TRANG_THAI_VALUES, { message: i18n.t('phieuKhoPhanThuoc.validation.statusInvalid') }),
    nguoi_tao_id: z.coerce.number().optional().nullable(),
    chi_tiet: z.array(phieuKhoPTChiTietFormItemSchema).default([]),
  })
  .superRefine((data, ctx) => {
    if (data.loai === 'chuyển') {
      const den = data.kho_den_id?.trim();
      if (!den) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t('phieuKhoPhanThuoc.validation.warehouseDestRequired'),
          path: ['kho_den_id'],
        });
      }
      if (den && data.kho_id?.trim() && den === data.kho_id.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t('phieuKhoPhanThuoc.validation.sameWarehouse'),
          path: ['kho_den_id'],
        });
      }
    }
  });

export type PhieuKhoPTChiTietFormItem = z.infer<typeof phieuKhoPTChiTietFormItemSchema>;
export type PhieuKhoPTFormValues = z.infer<typeof phieuKhoPTSchema>;
