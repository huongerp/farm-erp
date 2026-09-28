/**
 * Import phòng ban: dòng Excel → `DepartmentFormValues`, validate bằng `departmentSchema` của form.
 * Thuần, không React / không db → test trực tiếp.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY, type ImportErrorRow } from '../../../../lib/import-types';
import { normalizeText, parseImportInt, pickImportOption, schemaIssueMessages } from '../../../../lib/import-common';
import { TRANG_THAI } from '../../../../lib/constants';
import { departmentSchema, type DepartmentFormValues } from '../core/schema';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`department.import.${k}`, o ?? {});

export const PHONG_BAN_TRANG_THAI_OPTIONS = [
  { value: TRANG_THAI.DANG_DUNG, labels: ['Đang hoạt động', 'Hoạt động', '1'] },
  { value: TRANG_THAI.NGUNG, labels: ['Ngừng dùng', 'Ngừng hoạt động', '0'] },
];

export interface PhongBanImportPlan {
  toCreate: { row: number; values: Record<string, unknown>; data: DepartmentFormValues }[];
  errors: ImportErrorRow[];
}

export function planPhongBanImport(rows: Record<string, unknown>[]): PhongBanImportPlan {
  const toCreate: PhongBanImportPlan['toCreate'] = [];
  const errors: ImportErrorRow[] = [];

  rows.forEach((raw, idx) => {
    const row = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];
    const reported = new Set<string>();

    // Trước đây mọi chữ không chứa "Ngừng" đều thành "Đang dùng" — gõ sai là lặng lẽ sai dữ liệu.
    const ttRaw = normalizeText(raw.trang_thai);
    const trangThai = ttRaw ? pickImportOption(ttRaw, PHONG_BAN_TRANG_THAI_OPTIONS) : TRANG_THAI.DANG_DUNG;
    if (!trangThai) {
      errs.push(tr('errTrangThai', { value: ttRaw }));
      reported.add('trang_thai');
    }

    const tt = parseImportInt(raw.tt);
    if (!tt.ok) {
      errs.push(tr('errThuTu', { value: String(raw.tt ?? '') }));
      reported.add('tt');
    }

    const data = {
      ten_phong_ban: normalizeText(raw.ten_phong_ban),
      chuc_nang: normalizeText(raw.chuc_nang) || undefined,
      tt: (tt.ok ? tt.value : null) ?? 0,
      trang_thai: trangThai ?? TRANG_THAI.DANG_DUNG,
    };
    const parsed = departmentSchema.safeParse(data);
    if (!parsed.success) errs.push(...schemaIssueMessages(parsed.error.issues, reported));

    if (errs.length > 0 || !parsed.success) {
      errors.push({ row, msg: errs.join('; '), values });
      return;
    }
    toCreate.push({ row, values, data: parsed.data });
  });

  return { toCreate, errors };
}
