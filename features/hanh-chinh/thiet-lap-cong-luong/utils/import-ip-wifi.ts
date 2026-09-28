/**
 * Import IP wifi chấm công: dòng Excel → `PayrollWifiIpFormValues`, validate bằng
 * `payrollWifiIpSchema` của form. Thuần → test trực tiếp.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY, type ImportErrorRow } from '../../../../lib/import-types';
import { buildRefLookup, normalizeText, pickImportOption, schemaIssueMessages } from '../../../../lib/import-common';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { payrollWifiIpSchema, type PayrollWifiIpFormValues } from '../core/schema';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`payrollIp.import.${k}`, o ?? {});

export const IP_TRANG_THAI_OPTIONS = [
  { value: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, labels: ['Hoạt động', 'Active', '1'] },
  { value: TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG, labels: ['Ngừng', 'Inactive', '0'] },
];

export interface IpWifiImportPlan {
  toCreate: { row: number; values: Record<string, unknown>; data: PayrollWifiIpFormValues }[];
  errors: ImportErrorRow[];
}

export function planIpWifiImport(
  rows: Record<string, unknown>[],
  chiNhanh: { id: string; ma: string; ten: string }[]
): IpWifiImportPlan {
  const findChiNhanh = buildRefLookup(chiNhanh, (c) => c.ma, (c) => c.ten);
  const toCreate: IpWifiImportPlan['toCreate'] = [];
  const errors: ImportErrorRow[] = [];
  const seen = new Map<string, number>();

  rows.forEach((raw, idx) => {
    const row = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];
    const reported = new Set<string>();

    const cnRaw = normalizeText(raw.chi_nhanh);
    let idChiNhanh = '';
    if (cnRaw) {
      reported.add('id_chi_nhanh');
      const hit = findChiNhanh(cnRaw);
      if (hit === null) errs.push(tr('errChiNhanhAmbiguous', { value: cnRaw }));
      else if (!hit) errs.push(tr('errChiNhanhNotFound', { value: cnRaw }));
      else idChiNhanh = hit.id;
    }

    const ttRaw = normalizeText(raw.trang_thai);
    const trangThai = ttRaw ? pickImportOption(ttRaw, IP_TRANG_THAI_OPTIONS) : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    if (!trangThai) {
      errs.push(tr('errTrangThai', { value: ttRaw }));
      reported.add('trang_thai');
    }

    const ip = normalizeText(raw.ip_wifi).replace(/\s/g, '');
    const key = `${idChiNhanh}|${ip}`;
    if (idChiNhanh && ip) {
      const seenAt = seen.get(key);
      if (seenAt != null) errs.push(tr('errDuplicateInFile', { row: seenAt }));
      else seen.set(key, row);
    }

    const data = {
      id_chi_nhanh: idChiNhanh,
      ip_wifi: ip,
      ghi_chu: normalizeText(raw.ghi_chu) || undefined,
      trang_thai: trangThai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
    };
    const parsed = payrollWifiIpSchema.safeParse(data);
    if (!parsed.success) errs.push(...schemaIssueMessages(parsed.error.issues, reported));

    if (errs.length > 0 || !parsed.success) {
      errors.push({ row, msg: errs.join('; '), values });
      return;
    }
    toCreate.push({ row, values, data: parsed.data });
  });

  return { toCreate, errors };
}
