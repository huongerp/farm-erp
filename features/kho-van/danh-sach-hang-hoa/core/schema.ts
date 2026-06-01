import { z } from 'zod';
import i18n from '../../../../lib/i18n';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';

export const hangHoaSchema = z.object({
  ma_hang_hoa: z
    .string()
    .min(1, i18n.t('hangHoa.validation.codeRequired'))
    .max(50, i18n.t('hangHoa.validation.codeMax'))
    .regex(/^[A-Z0-9_-]+$/, i18n.t('hangHoa.validation.codeFormat')),
  ten_hang_hoa: z
    .string()
    .min(1, i18n.t('hangHoa.validation.nameRequired'))
    .max(255, i18n.t('hangHoa.validation.nameMax')),
  /** Chỉ chọn danh mục cấp 2; danh_muc_cha_id sẽ được set tự động từ danh mục cấp 2. */
  id_danh_muc_cap2: z.preprocess((v) => (v == null ? '' : v), z.string().min(1, i18n.t('hangHoa.validation.categoryRequired'))),
  dvt: z.preprocess((v) => (v == null ? '' : v), z.string().min(1, i18n.t('hangHoa.validation.unitRequired'))),
  don_gia: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number({ message: i18n.t('hangHoa.validation.priceRequired') }).min(0, i18n.t('hangHoa.validation.priceMin')),
  ),
  trang_thai: z.enum([TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG]),
  thu_tu: z.coerce.number().min(1, i18n.t('hangHoa.validation.thuTuMin')),
  /** Mô tả hàng hóa. */
  mo_ta: z.string().optional().nullable(),
  /** URL hình ảnh (Cloudinary). */
  hinh_anh: z.string().optional().nullable(),
});

export type HangHoaFormValues = z.infer<typeof hangHoaSchema>;

/** Schema form Thêm/Sửa định mức tồn kho (tab Định mức tồn). */
export const dinhMucTonSchema = z.object({
  kho_id: z.string().min(1, i18n.t('hangHoa.dinhMuc.validation.khoRequired')),
  hang_hoa_id: z.string().min(1, i18n.t('hangHoa.dinhMuc.validation.hangHoaRequired')),
  ton_toi_thieu: z.coerce.number().min(0, i18n.t('hangHoa.dinhMuc.validation.tonToiThieuMin')),
});

export type DinhMucTonFormValues = z.infer<typeof dinhMucTonSchema>;
