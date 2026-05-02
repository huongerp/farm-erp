import { z } from 'zod';
import i18n from '../../../../lib/i18n';

const dm = (k: string) => i18n.t(`farmHangHoaPhanThuoc.danhMuc.${k}`);
const hh = (k: string) => i18n.t(`farmHangHoaPhanThuoc.hangHoa.${k}`);

export const farmDanhMucSchema = z.object({
  ma_danh_muc: z
    .string()
    .min(1, dm('validation.codeRequired'))
    .max(50, dm('validation.codeMax'))
    .regex(/^[A-Z0-9_-]+$/, dm('validation.codeFormat')),
  ten_danh_muc: z.string().min(1, dm('validation.nameRequired')).max(255, dm('validation.nameMax')),
  id_cha: z.string().optional().nullable(),
  thu_tu: z.coerce.number().min(1, dm('validation.thuTuMin')),
  mo_ta: z.string().optional(),
});

export type FarmDanhMucFormValues = z.infer<typeof farmDanhMucSchema>;

export const farmHangHoaSchema = z.object({
  ma_hang_hoa: z
    .string()
    .min(1, hh('validation.codeRequired'))
    .max(50, hh('validation.codeMax'))
    .regex(/^[A-Z0-9_-]+$/, hh('validation.codeFormat')),
  ten_hang_hoa: z.string().min(1, hh('validation.nameRequired')).max(255, hh('validation.nameMax')),
  id_danh_muc_cap2: z.preprocess((v) => (v == null ? '' : v), z.string().min(1, hh('validation.categoryRequired'))),
  dvt: z.preprocess((v) => (v == null ? '' : v), z.string().min(1, hh('validation.unitRequired'))),
  don_gia: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number({ invalid_type_error: hh('validation.priceMin') }).min(0, hh('validation.priceMin')).optional(),
  ),
  mo_ta: z.string().optional().nullable(),
});

export type FarmHangHoaFormValues = z.infer<typeof farmHangHoaSchema>;
