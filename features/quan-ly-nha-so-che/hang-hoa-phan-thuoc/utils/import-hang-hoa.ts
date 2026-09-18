import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow, ImportMode } from '../../../../lib/import-types';
import { CODE_PATTERN, matchKey, normalizeCode, normalizeText, parseImportNumber } from '../../../../lib/import-common';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`farmHangHoaPhanThuoc.hangHoa.import.${k}`, o ?? {});

/** Cột dùng để nhận diện dòng đã có trong hệ thống. */
export type HangHoaRefColumn = 'ma_hang_hoa' | 'ten_hang_hoa';

/** Một dòng thô từ ImportDialog (mọi giá trị đều là `unknown` vì đến từ ô Excel). */
export type FarmHangHoaImportRow = Record<string, unknown>;

export interface DanhMucRefLite {
  id: string;
  ma_danh_muc: string;
  ten_danh_muc: string;
  id_cha: string | null;
}

export interface ExistingHangHoaLite {
  id: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
}

/** Payload ghi xuống `fp_farm_danh_sach_hang_hoa` — cố tình không chứa `id` và `tg_tao`. */
export interface FarmHangHoaPayload {
  danh_muc_id: number | null;
  danh_muc_cha_id: number | null;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string | null;
  pham_cap: string | null;
  don_gia: number | null;
  mo_ta: string | null;
}

export interface PlannedInsert {
  row: number;
  values: Record<string, unknown>;
  payload: FarmHangHoaPayload;
}

export interface PlannedUpdate extends PlannedInsert {
  id: string;
}

export interface HangHoaImportPlan {
  toInsert: PlannedInsert[];
  toUpdate: PlannedUpdate[];
  errors: ImportErrorRow[];
}

export interface PlanInput {
  danhMuc: DanhMucRefLite[];
  existing: ExistingHangHoaLite[];
  mode: ImportMode;
  refColumn: HangHoaRefColumn;
}

interface DanhMucHit {
  danh_muc_id: number;
  danh_muc_cha_id: number | null;
}

/** Chỉ danh mục cấp 2 mới gắn được hàng hóa (đúng ràng buộc của form). */
function buildDanhMucIndex(danhMuc: DanhMucRefLite[]) {
  const byMa = new Map<string, DanhMucHit>();
  const byTen = new Map<string, DanhMucHit | null>();
  danhMuc
    .filter((d) => d.id_cha != null && d.id_cha.trim() !== '')
    .forEach((d) => {
      const hit: DanhMucHit = {
        danh_muc_id: Number(d.id),
        danh_muc_cha_id: d.id_cha ? Number(d.id_cha) : null,
      };
      const ma = normalizeCode(d.ma_danh_muc);
      if (ma && !byMa.has(ma)) byMa.set(ma, hit);
      const ten = matchKey(d.ten_danh_muc);
      if (!ten) return;
      // Tên danh mục trùng nhau → không dám đoán, đánh dấu nhập nhằng.
      byTen.set(ten, byTen.has(ten) ? null : hit);
    });
  return { byMa, byTen };
}

/** Bảng tra dòng đã có theo cột tham chiếu; giá trị `null` = khóa trùng nhau, không xác định được. */
function buildExistingIndex(existing: ExistingHangHoaLite[], refColumn: HangHoaRefColumn) {
  const index = new Map<string, string | null>();
  existing.forEach((e) => {
    const key = refColumn === 'ma_hang_hoa' ? normalizeCode(e.ma_hang_hoa) : matchKey(e.ten_hang_hoa);
    if (!key) return;
    index.set(key, index.has(key) ? null : e.id);
  });
  return index;
}

function excelRowOf(row: FarmHangHoaImportRow, fallbackIdx: number): number {
  const raw = row[IMPORT_ROW_KEY];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallbackIdx + 2;
}

/** Bỏ khóa nội bộ trước khi trả về `values` (file báo lỗi không nên có cột `__row`). */
function cleanValues(row: FarmHangHoaImportRow): Record<string, unknown> {
  const { [IMPORT_ROW_KEY]: _ignored, ...rest } = row;
  return rest;
}

/**
 * Validate + phân loại toàn bộ dòng import trước khi chạm DB.
 * Một request ghi cho cả lô, nên mọi lỗi phải bắt hết ở đây.
 */
export function planFarmHangHoaImport(
  rows: FarmHangHoaImportRow[],
  { danhMuc, existing, mode, refColumn }: PlanInput
): HangHoaImportPlan {
  const dmIndex = buildDanhMucIndex(danhMuc);
  const existingIndex = buildExistingIndex(existing, refColumn);
  const existingById = new Map(existing.map((e) => [e.id, e]));

  const toInsert: PlannedInsert[] = [];
  const toUpdate: PlannedUpdate[] = [];
  const errors: ImportErrorRow[] = [];
  const seenKeys = new Map<string, number>();

  rows.forEach((row, idx) => {
    const excelRow = excelRowOf(row, idx);
    const values = cleanValues(row);
    const rowErrors: string[] = [];

    const ma = normalizeCode(row.ma_hang_hoa);
    const ten = normalizeText(row.ten_hang_hoa);
    const danhMucInput = normalizeText(row.danh_muc);
    const dvt = normalizeText(row.dvt);
    const phamCap = normalizeText(row.pham_cap);
    const moTa = normalizeText(row.mo_ta);

    if (!ma) rowErrors.push(tr('errCodeRequired'));
    else if (ma.length > 50) rowErrors.push(tr('errCodeMax'));
    else if (!CODE_PATTERN.test(ma)) rowErrors.push(tr('errCodeFormat'));

    if (!ten) rowErrors.push(tr('errNameRequired'));
    else if (ten.length > 255) rowErrors.push(tr('errNameMax'));

    if (!dvt) rowErrors.push(tr('errUnitRequired'));

    let dmHit: DanhMucHit | null = null;
    if (!danhMucInput) {
      rowErrors.push(tr('errCategoryRequired'));
    } else {
      const byMa = dmIndex.byMa.get(normalizeCode(danhMucInput));
      if (byMa) {
        dmHit = byMa;
      } else {
        const byTen = dmIndex.byTen.get(matchKey(danhMucInput));
        if (byTen === null) rowErrors.push(tr('errCategoryAmbiguous', { value: danhMucInput }));
        else if (byTen) dmHit = byTen;
        else rowErrors.push(tr('errCategoryNotFound', { value: danhMucInput }));
      }
    }

    const donGia = parseImportNumber(row.don_gia);
    if (!donGia.ok) rowErrors.push(tr('errPriceInvalid', { value: String(row.don_gia ?? '') }));

    const refValue = refColumn === 'ma_hang_hoa' ? ma : matchKey(ten);
    if (refValue) {
      const seenAt = seenKeys.get(refValue);
      if (seenAt != null) rowErrors.push(tr('errDuplicateInFile', { row: seenAt }));
    }

    if (rowErrors.length > 0) {
      errors.push({ row: excelRow, msg: rowErrors.join('; '), values });
      return;
    }
    if (refValue) seenKeys.set(refValue, excelRow);

    const payload: FarmHangHoaPayload = {
      danh_muc_id: dmHit!.danh_muc_id,
      danh_muc_cha_id: dmHit!.danh_muc_cha_id,
      ma_hang_hoa: ma,
      ten_hang_hoa: ten,
      dvt: dvt || null,
      pham_cap: phamCap || null,
      don_gia: donGia.ok ? donGia.value : null,
      mo_ta: moTa || null,
    };

    const existingId = existingIndex.get(refValue);

    if (existingId === undefined) {
      // Dòng mới: khi đối chiếu theo tên vẫn phải chắc mã chưa bị ai dùng.
      if (refColumn === 'ten_hang_hoa' && existing.some((e) => normalizeCode(e.ma_hang_hoa) === ma)) {
        errors.push({ row: excelRow, msg: tr('errCodeTaken', { value: ma }), values });
        return;
      }
      toInsert.push({ row: excelRow, values, payload });
      return;
    }

    if (existingId === null) {
      errors.push({ row: excelRow, msg: tr('errRefAmbiguous', { value: refColumn === 'ma_hang_hoa' ? ma : ten }), values });
      return;
    }

    if (mode === 'create') {
      errors.push({ row: excelRow, msg: tr('errAlreadyExists', { value: refColumn === 'ma_hang_hoa' ? ma : ten }), values });
      return;
    }

    // Ghi đè theo tên: mã mới không được đụng mã của một bản ghi khác.
    if (refColumn === 'ten_hang_hoa') {
      const clash = existing.find((e) => normalizeCode(e.ma_hang_hoa) === ma && e.id !== existingId);
      if (clash) {
        errors.push({ row: excelRow, msg: tr('errCodeTaken', { value: ma }), values });
        return;
      }
    }

    const current = existingById.get(existingId);
    toUpdate.push({ row: excelRow, values, id: existingId, payload: { ...payload, ma_hang_hoa: ma || normalizeCode(current?.ma_hang_hoa) } });
  });

  return { toInsert, toUpdate, errors };
}
