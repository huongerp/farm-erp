import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const thangNumber = z.coerce.number().min(0);
const thangSoLuong = z.coerce.number().min(0).optional();

/** Form một dòng kế hoạch chi phí (1 bảng). */
export const keHoachChiPhiSchema = z.object({
  nam: z.coerce.number().min(2000).max(2100),
  id_phong_ban: z.string().optional(),
  id_danh_muc: z.string().min(1, i18n.t('keHoachChiPhi.validation.danhMucRequired')),
  mo_ta: z.string().optional(),
  thang_1: thangNumber,
  thang_2: thangNumber,
  thang_3: thangNumber,
  thang_4: thangNumber,
  thang_5: thangNumber,
  thang_6: thangNumber,
  thang_7: thangNumber,
  thang_8: thangNumber,
  thang_9: thangNumber,
  thang_10: thangNumber,
  thang_11: thangNumber,
  thang_12: thangNumber,
  thang_1_so_luong: thangSoLuong,
  thang_2_so_luong: thangSoLuong,
  thang_3_so_luong: thangSoLuong,
  thang_4_so_luong: thangSoLuong,
  thang_5_so_luong: thangSoLuong,
  thang_6_so_luong: thangSoLuong,
  thang_7_so_luong: thangSoLuong,
  thang_8_so_luong: thangSoLuong,
  thang_9_so_luong: thangSoLuong,
  thang_10_so_luong: thangSoLuong,
  thang_11_so_luong: thangSoLuong,
  thang_12_so_luong: thangSoLuong,
  ghi_chu: z.string().optional().nullable(),
});

export type KeHoachChiPhiFormValues = z.infer<typeof keHoachChiPhiSchema>;
