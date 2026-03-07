import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const hangMucEnum = z.enum(['bao_tri', 'sua_chua']);

const trangThaiEnum = z.union([z.literal(0), z.literal(1)]);

export const phieuBaoTriSuaChuaSchema = z.object({
  hang_muc: hangMucEnum,
  id_tai_san: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.assetRequired') }),
  ngay_yeu_cau: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.ngayYeuCauRequired') }),
  ngay_hen: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.ngayHenRequired') }),
  ngay_bat_dau: z.string().optional().nullable(),
  ngay_hoan_thanh: z.string().optional().nullable(),
  mo_ta: z.string().min(1, { message: i18n.t('baoTriSuaChua.validation.moTaRequired') }),
  ghi_chu: z.string().optional().nullable(),
  id_nguoi_phu_trach: z.string().optional().nullable(),
  trang_thai: trangThaiEnum.optional(),
});

export type PhieuBaoTriSuaChuaFormValues = z.infer<typeof phieuBaoTriSuaChuaSchema>;
