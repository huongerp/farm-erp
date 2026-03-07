
import { z } from "zod";
import i18n from '../../../../lib/i18n';

export const roleSchema = z.object({
  ma_vai_tro: z.string().min(2, i18n.t('permission.validation.codeMin')).regex(/^[A-Z0-9_]+$/, i18n.t('permission.validation.codeFormat')),
  ten_vai_tro: z.string().min(3, i18n.t('permission.validation.nameMin')),
  mo_ta: z.string().max(200, i18n.t('permission.validation.descMax')).optional().nullable(),
  trang_thai: z.coerce.number(),
  // Quyền hạn sẽ được quản lý qua state riêng trong form nhưng được validate sơ bộ ở đây nếu cần
});

export type RoleFormValues = z.infer<typeof roleSchema>;
