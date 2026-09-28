/**
 * Import danh sách kho: dòng Excel → `KhoFormValues`, validate bằng `khoSchema` của form.
 * Thuần, không React / không db → test trực tiếp.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY, type ImportErrorRow } from '../../../../lib/import-types';
import {
  buildRefLookup,
  normalizeCode,
  normalizeText,
  parseImportInt,
  pickImportOption,
  schemaIssueMessages,
} from '../../../../lib/import-common';
import { TRANG_THAI_HOAT_DONG } from '../../../../lib/constants';
import { khoSchema, type KhoFormValues } from '../core/schema';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`kho.import.${k}`, o ?? {});

export const KHO_TRANG_THAI_OPTIONS = [
  { value: TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG, labels: ['Hoạt động', 'Đang dùng', '1'] },
  { value: TRANG_THAI_HOAT_DONG.NGUNG_HOAT_DONG, labels: ['Ngừng', 'Ngừng dùng', '0'] },
];

export interface ChiNhanhRefLite {
  id: string;
  ma: string;
  ten: string;
}

export interface KhoImportPlan {
  toCreate: { row: number; values: Record<string, unknown>; data: KhoFormValues }[];
  errors: ImportErrorRow[];
}

export function planKhoImport(rows: Record<string, unknown>[], chiNhanh: ChiNhanhRefLite[]): KhoImportPlan {
  const findChiNhanh = buildRefLookup(chiNhanh, (c) => c.ma, (c) => c.ten);
  const toCreate: KhoImportPlan['toCreate'] = [];
  const errors: ImportErrorRow[] = [];
  const seenMa = new Map<string, number>();

  rows.forEach((raw, idx) => {
    const row = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const { [IMPORT_ROW_KEY]: _ignored, ...values } = raw;
    const errs: string[] = [];
    const reported = new Set<string>();

    const ma = normalizeCode(raw.ma_kho);
    const seenAt = seenMa.get(ma);
    if (ma && seenAt != null) errs.push(tr('errDuplicateInFile', { row: seenAt }));
    else if (ma) seenMa.set(ma, row);

    const cnRaw = normalizeText(raw.chi_nhanh);
    let idChiNhanh = '';
    if (cnRaw) {
      const hit = findChiNhanh(cnRaw);
      reported.add('id_chi_nhanh');
      if (hit === null) errs.push(tr('errChiNhanhAmbiguous', { value: cnRaw }));
      else if (!hit) errs.push(tr('errChiNhanhNotFound', { value: cnRaw }));
      else idChiNhanh = hit.id;
    }

    const ttRaw = normalizeText(raw.trang_thai);
    const trangThai = ttRaw ? pickImportOption(ttRaw, KHO_TRANG_THAI_OPTIONS) : TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG;
    if (!trangThai) {
      errs.push(tr('errTrangThai', { value: ttRaw }));
      reported.add('trang_thai');
    }

    const thuTu = parseImportInt(raw.thu_tu);
    if (!thuTu.ok) {
      errs.push(tr('errThuTu', { value: String(raw.thu_tu ?? '') }));
      reported.add('thu_tu');
    }

    const data = {
      ma_kho: ma,
      ten_kho: normalizeText(raw.ten_kho),
      dia_chi: normalizeText(raw.dia_chi) || undefined,
      mo_ta: normalizeText(raw.mo_ta) || undefined,
      id_chi_nhanh: idChiNhanh,
      trang_thai: trangThai ?? TRANG_THAI_HOAT_DONG.DANG_HOAT_DONG,
      thu_tu: (thuTu.ok ? thuTu.value : null) ?? 1,
    };
    const parsed = khoSchema.safeParse(data);
    if (!parsed.success) errs.push(...schemaIssueMessages(parsed.error.issues, reported));

    if (errs.length > 0 || !parsed.success) {
      errors.push({ row, msg: errs.join('; '), values });
      return;
    }
    toCreate.push({ row, values, data: parsed.data });
  });

  return { toCreate, errors };
}
