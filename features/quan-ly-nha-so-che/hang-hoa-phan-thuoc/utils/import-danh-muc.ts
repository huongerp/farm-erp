import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow, ImportMode } from '../../../../lib/import-types';
import { CODE_PATTERN, matchKey, normalizeCode, normalizeText, parseImportInt } from '../../../../lib/import-common';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`farmHangHoaPhanThuoc.danhMuc.import.${k}`, o ?? {});

export type FarmDanhMucImportRow = Record<string, unknown>;

export interface ExistingDanhMucLite {
  id: string;
  ma_danh_muc: string;
  ten_danh_muc: string;
  id_cha: string | null;
}

export interface DanhMucPayload {
  ma_danh_muc: string;
  ten_danh_muc: string;
  thu_tu: number | null;
  mo_ta: string | null;
}

export interface PlannedDanhMucRow {
  row: number;
  values: Record<string, unknown>;
  payload: DanhMucPayload;
  /** `null` = danh mục cấp 1. Ngược lại là mã cha đã chuẩn hóa (có thể là dòng cấp 1 trong cùng file). */
  parentCode: string | null;
  /** Id cha nếu cha đã có sẵn trong DB; `null` khi cha là dòng mới trong cùng file. */
  parentId: number | null;
  /** `null` = thêm mới. */
  existingId: string | null;
}

export interface DanhMucImportPlan {
  rows: PlannedDanhMucRow[];
  errors: ImportErrorRow[];
}

function excelRowOf(row: FarmDanhMucImportRow, fallbackIdx: number): number {
  const raw = row[IMPORT_ROW_KEY];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallbackIdx + 2;
}

function cleanValues(row: FarmDanhMucImportRow): Record<string, unknown> {
  const { [IMPORT_ROW_KEY]: _ignored, ...rest } = row;
  return rest;
}

/**
 * Validate + phân loại dòng danh mục. Cây chỉ 2 cấp, cha có thể nằm ngay trong file
 * (service ghi cấp 1 trước rồi mới ghi cấp 2 để lấy được id cha).
 */
export function planFarmDanhMucImport(
  rows: FarmDanhMucImportRow[],
  { existing, mode }: { existing: ExistingDanhMucLite[]; mode: ImportMode }
): DanhMucImportPlan {
  const existingByMa = new Map<string, ExistingDanhMucLite | null>();
  const existingCap1ByTen = new Map<string, ExistingDanhMucLite | null>();
  existing.forEach((d) => {
    const ma = normalizeCode(d.ma_danh_muc);
    if (ma) existingByMa.set(ma, existingByMa.has(ma) ? null : d);
    if (d.id_cha == null || d.id_cha.trim() === '') {
      const ten = matchKey(d.ten_danh_muc);
      if (ten) existingCap1ByTen.set(ten, existingCap1ByTen.has(ten) ? null : d);
    }
  });

  // Lượt 1: gom mã cấp 1 có trong chính file để dòng cấp 2 tham chiếu được.
  const fileCap1Codes = new Set<string>();
  const fileCap1ByTen = new Map<string, string | null>();
  rows.forEach((row) => {
    const ma = normalizeCode(row.ma_danh_muc);
    const cha = normalizeText(row.danh_muc_cha);
    if (!ma || cha) return;
    fileCap1Codes.add(ma);
    const ten = matchKey(row.ten_danh_muc);
    if (ten) fileCap1ByTen.set(ten, fileCap1ByTen.has(ten) ? null : ma);
  });

  const planned: PlannedDanhMucRow[] = [];
  const errors: ImportErrorRow[] = [];
  const seenCodes = new Map<string, number>();

  rows.forEach((row, idx) => {
    const excelRow = excelRowOf(row, idx);
    const values = cleanValues(row);
    const rowErrors: string[] = [];

    const ma = normalizeCode(row.ma_danh_muc);
    const ten = normalizeText(row.ten_danh_muc);
    const chaInput = normalizeText(row.danh_muc_cha);
    const moTa = normalizeText(row.mo_ta);

    if (!ma) rowErrors.push(tr('errCodeRequired'));
    else if (ma.length > 50) rowErrors.push(tr('errCodeMax'));
    else if (!CODE_PATTERN.test(ma)) rowErrors.push(tr('errCodeFormat'));

    if (!ten) rowErrors.push(tr('errNameRequired'));
    else if (ten.length > 255) rowErrors.push(tr('errNameMax'));

    const thuTu = parseImportInt(row.thu_tu);
    if (!thuTu.ok) rowErrors.push(tr('errOrderInvalid', { value: String(row.thu_tu ?? '') }));
    else if (thuTu.value !== null && thuTu.value < 1) rowErrors.push(tr('errOrderInvalid', { value: String(row.thu_tu ?? '') }));

    if (ma) {
      const seenAt = seenCodes.get(ma);
      if (seenAt != null) rowErrors.push(tr('errDuplicateInFile', { row: seenAt }));
    }

    let parentCode: string | null = null;
    let parentId: number | null = null;
    if (chaInput) {
      const chaCode = normalizeCode(chaInput);
      if (chaCode === ma) {
        rowErrors.push(tr('errParentSelf'));
      } else {
        const inDb = existingByMa.get(chaCode);
        if (inDb) {
          if (inDb.id_cha != null && inDb.id_cha.trim() !== '') rowErrors.push(tr('errParentNotLevel1', { value: chaInput }));
          else { parentCode = chaCode; parentId = Number(inDb.id); }
        } else if (fileCap1Codes.has(chaCode)) {
          parentCode = chaCode;
        } else {
          // Cho phép ghi tên danh mục cấp 1 thay vì mã.
          const byTenDb = existingCap1ByTen.get(matchKey(chaInput));
          const byTenFile = fileCap1ByTen.get(matchKey(chaInput));
          if (byTenDb === null || byTenFile === null) {
            rowErrors.push(tr('errParentAmbiguous', { value: chaInput }));
          } else if (byTenDb) {
            parentCode = normalizeCode(byTenDb.ma_danh_muc);
            parentId = Number(byTenDb.id);
          } else if (byTenFile) {
            parentCode = byTenFile;
          } else {
            rowErrors.push(tr('errParentNotFound', { value: chaInput }));
          }
        }
      }
    }

    const current = ma ? existingByMa.get(ma) : undefined;
    if (current === null) {
      rowErrors.push(tr('errRefAmbiguous', { value: ma }));
    } else if (current && mode === 'create') {
      rowErrors.push(tr('errAlreadyExists', { value: ma }));
    }

    if (rowErrors.length > 0) {
      errors.push({ row: excelRow, msg: rowErrors.join('; '), values });
      return;
    }
    seenCodes.set(ma, excelRow);

    planned.push({
      row: excelRow,
      values,
      payload: {
        ma_danh_muc: ma,
        ten_danh_muc: ten,
        thu_tu: thuTu.ok ? thuTu.value : null,
        mo_ta: moTa || null,
      },
      parentCode,
      parentId,
      existingId: current ? current.id : null,
    });
  });

  return { rows: planned, errors };
}
