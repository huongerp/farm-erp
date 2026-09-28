/**
 * Import phiếu kho từ Excel phẳng: 1 dòng = 1 dòng hàng, các dòng được gộp thành phiếu.
 * Thuần, không React / không db → test trực tiếp.
 *
 * Gộp phiếu:
 * - Có "Số phiếu" → gộp theo (loại, số phiếu); các dòng phải cùng ngày/kho/kho đến/mô tả.
 * - Trống → gộp theo (loại, ngày, kho, kho đến, mô tả); số phiếu do hệ thống cấp khi ghi.
 * Một dòng lỗi thì CẢ PHIẾU bị loại — không tạo phiếu thiếu dòng so với file.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow } from '../../../../lib/import-types';
import {
  matchKey,
  normalizeCode,
  normalizeHeader,
  normalizeText,
  parseImportDate,
  parseImportNumber,
} from '../../../../lib/import-common';
import type { LoaiPhieuKhoPT } from '../core/types';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`phieuKhoPhanThuoc.import.${k}`, o ?? {});

export type PhieuKhoPTImportRow = Record<string, unknown>;

export interface KhoRefLite {
  id: string;
  ma_kho: string;
  ten_kho: string;
}

export interface HangHoaRefLite {
  id: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string | null;
  pham_cap?: string | null;
  don_gia: number | null;
}

export interface ExistingSoPhieu {
  so_phieu: string;
  loai: string;
}

export interface PlannedLine {
  row: number;
  id_hang_hoa: number;
  ten_hang_hoa: string | null;
  don_vi_tinh: string | null;
  pham_cap: string | null;
  so_luong: number;
  don_gia: number;
  so_lot: string | null;
  ghi_chu: string | null;
}

export interface PlannedPhieu {
  /** `null` → service xin số mới từ `get_next_so_phieu_farm_pt`. */
  so_phieu: string | null;
  ngay: string;
  loai: LoaiPhieuKhoPT;
  kho_id: number;
  ten_kho: string | null;
  kho_den_id: number | null;
  ten_kho_den: string | null;
  mo_ta: string | null;
  lines: PlannedLine[];
  /** Dữ liệu gốc từng dòng — lỗi khi ghi DB vẫn xuất được file báo lỗi import lại. */
  sourceRows: { row: number; values: Record<string, unknown> }[];
}

export interface PhieuKhoPTImportPlan {
  phieus: PlannedPhieu[];
  errors: ImportErrorRow[];
}

export interface PlanInput {
  khoList: KhoRefLite[];
  hangHoaList: HangHoaRefLite[];
  existingSoPhieu: ExistingSoPhieu[];
}

export const MAX_SO_PHIEU_LENGTH = 50;

/** Nhận "Nhập", "nhap", "Nhập kho", "Luân chuyển"… — so khớp sau khi bỏ dấu. */
export function parseLoaiPhieu(raw: unknown): LoaiPhieuKhoPT | null {
  const s = normalizeHeader(String(raw ?? ''));
  if (!s) return null;
  if (s === 'nhap' || s === 'nhap kho') return 'nhập';
  if (s === 'xuat' || s === 'xuat kho') return 'xuất';
  if (s === 'chuyen' || s === 'chuyen kho' || s === 'luan chuyen') return 'chuyển';
  return null;
}

/** Tra theo mã trước, hết mới theo tên; tên trùng nhau → `ambiguous` (không đoán). */
function buildLookup<T>(items: T[], ma: (x: T) => string, ten: (x: T) => string) {
  const byMa = new Map<string, T>();
  const byTen = new Map<string, T | null>();
  items.forEach((x) => {
    const m = normalizeCode(ma(x));
    if (m && !byMa.has(m)) byMa.set(m, x);
    const n = matchKey(ten(x));
    if (n) byTen.set(n, byTen.has(n) ? null : x);
  });
  return (input: string): { hit: T } | { ambiguous: true } | null => {
    const m = byMa.get(normalizeCode(input));
    if (m) return { hit: m };
    const n = byTen.get(matchKey(input));
    if (n === null) return { ambiguous: true };
    return n ? { hit: n } : null;
  };
}

function excelRowOf(row: PhieuKhoPTImportRow, fallbackIdx: number): number {
  const n = Number(row[IMPORT_ROW_KEY]);
  return Number.isFinite(n) && n > 0 ? n : fallbackIdx + 2;
}

function cleanValues(row: PhieuKhoPTImportRow): Record<string, unknown> {
  const { [IMPORT_ROW_KEY]: _ignored, ...rest } = row;
  return rest;
}

interface ParsedRow {
  row: number;
  values: Record<string, unknown>;
  errors: string[];
  groupKey: string;
  /** Chữ ký thông tin phiếu — các dòng cùng số phiếu phải trùng nhau. */
  headerSig: string;
  header: Omit<PlannedPhieu, 'lines' | 'sourceRows'> | null;
  line: PlannedLine | null;
}

export function planPhieuKhoPTImport(
  rows: PhieuKhoPTImportRow[],
  { khoList, hangHoaList, existingSoPhieu }: PlanInput
): PhieuKhoPTImportPlan {
  const findKho = buildLookup(khoList, (k) => k.ma_kho, (k) => k.ten_kho);
  const findHang = buildLookup(hangHoaList, (h) => h.ma_hang_hoa, (h) => h.ten_hang_hoa);
  const existingKeys = new Set(existingSoPhieu.map((e) => `${e.loai}|${e.so_phieu.trim()}`));

  const parsed: ParsedRow[] = rows.map((row, idx) => {
    const excelRow = excelRowOf(row, idx);
    const errors: string[] = [];

    const soPhieu = normalizeText(row.so_phieu);
    if (soPhieu.length > MAX_SO_PHIEU_LENGTH) errors.push(tr('errSoPhieuMax', { max: MAX_SO_PHIEU_LENGTH }));

    const loaiRaw = normalizeText(row.loai);
    const loai = parseLoaiPhieu(loaiRaw);
    if (!loai) errors.push(tr('errLoaiInvalid', { value: loaiRaw }));

    const ngayRaw = row.ngay;
    const ngay = parseImportDate(ngayRaw);
    if (!ngay) errors.push(tr('errNgayInvalid', { value: String(ngayRaw ?? '') }));

    const khoInput = normalizeText(row.kho);
    let kho: KhoRefLite | null = null;
    const khoHit = khoInput ? findKho(khoInput) : null;
    if (!khoInput || !khoHit) errors.push(tr('errKhoNotFound', { value: khoInput }));
    else if ('ambiguous' in khoHit) errors.push(tr('errKhoAmbiguous', { value: khoInput }));
    else kho = khoHit.hit;

    // Kho đến chỉ có nghĩa với phiếu chuyển; loại khác bỏ qua như form.
    let khoDen: KhoRefLite | null = null;
    const khoDenInput = normalizeText(row.kho_den);
    if (loai === 'chuyển') {
      const hit = khoDenInput ? findKho(khoDenInput) : null;
      if (!khoDenInput) errors.push(tr('errKhoDenRequired'));
      else if (!hit) errors.push(tr('errKhoNotFound', { value: khoDenInput }));
      else if ('ambiguous' in hit) errors.push(tr('errKhoAmbiguous', { value: khoDenInput }));
      else if (kho && hit.hit.id === kho.id) errors.push(tr('errSameKho'));
      else khoDen = hit.hit;
    }

    const moTa = normalizeText(row.mo_ta);

    const hangInput = normalizeText(row.ma_hang);
    let hang: HangHoaRefLite | null = null;
    const hangHit = hangInput ? findHang(hangInput) : null;
    if (!hangInput || !hangHit) errors.push(tr('errHangNotFound', { value: hangInput }));
    else if ('ambiguous' in hangHit) errors.push(tr('errHangAmbiguous', { value: hangInput }));
    else hang = hangHit.hit;

    const soLuong = parseImportNumber(row.so_luong);
    if (!soLuong.ok || soLuong.value === null || soLuong.value <= 0) {
      errors.push(tr('errSoLuongInvalid', { value: String(row.so_luong ?? '') }));
    }

    const donGia = parseImportNumber(row.don_gia);
    if (!donGia.ok) errors.push(tr('errDonGiaInvalid', { value: String(row.don_gia ?? '') }));

    // Khoá gộp dựng từ giá trị đã chuẩn hoá khi có, không thì từ chữ thô — dòng lỗi vẫn
    // rơi vào đúng phiếu của nó để cả phiếu bị loại cùng nhau.
    const loaiKey = loai ?? matchKey(loaiRaw);
    const khoKey = kho?.id ?? `?${matchKey(khoInput)}`;
    const khoDenKey = loai === 'chuyển' ? (khoDen?.id ?? `?${matchKey(khoDenInput)}`) : '';
    const ngayKey = ngay ?? `?${String(ngayRaw ?? '')}`;
    const headerSig = [ngayKey, khoKey, khoDenKey, moTa].join('|');
    const groupKey = soPhieu ? `S|${loaiKey}|${soPhieu}` : `A|${loaiKey}|${headerSig}`;

    const ok = errors.length === 0;
    return {
      row: excelRow,
      values: cleanValues(row),
      errors,
      groupKey,
      headerSig,
      header: ok
        ? {
            so_phieu: soPhieu || null,
            ngay: ngay!,
            loai: loai!,
            kho_id: Number(kho!.id),
            ten_kho: kho!.ten_kho || null,
            kho_den_id: khoDen ? Number(khoDen.id) : null,
            ten_kho_den: khoDen?.ten_kho || null,
            mo_ta: moTa || null,
          }
        : null,
      line: ok
        ? {
            row: excelRow,
            id_hang_hoa: Number(hang!.id),
            ten_hang_hoa: hang!.ten_hang_hoa || null,
            don_vi_tinh: hang!.dvt || null,
            // Để trống → lấy theo danh mục hàng hoá, giống form lập phiếu.
            pham_cap: normalizeText(row.pham_cap) || hang!.pham_cap || null,
            so_luong: soLuong.ok ? soLuong.value! : 0,
            don_gia: (donGia.ok ? donGia.value : null) ?? hang!.don_gia ?? 0,
            so_lot: normalizeText(row.so_lot) || null,
            ghi_chu: normalizeText(row.ghi_chu) || null,
          }
        : null,
    };
  });

  const groups = new Map<string, ParsedRow[]>();
  parsed.forEach((p) => {
    const list = groups.get(p.groupKey);
    if (list) list.push(p);
    else groups.set(p.groupKey, [p]);
  });

  const phieus: PlannedPhieu[] = [];
  const errors: ImportErrorRow[] = [];

  groups.forEach((list) => {
    const first = list[0];
    list.slice(1).forEach((p) => {
      if (p.headerSig !== first.headerSig) p.errors.push(tr('errHeaderMismatch', { row: first.row }));
    });

    const soPhieu = normalizeText(first.values.so_phieu);
    const loai = first.header?.loai;
    if (soPhieu && loai && existingKeys.has(`${loai}|${soPhieu}`)) {
      first.errors.push(tr('errSoPhieuExists', { value: soPhieu }));
    }

    const badRows = list.filter((p) => p.errors.length > 0).map((p) => p.row);
    if (badRows.length > 0) {
      list.forEach((p) => {
        errors.push({
          row: p.row,
          msg: p.errors.length > 0 ? p.errors.join('; ') : tr('errPhieuSkipped', { rows: badRows.join(', ') }),
          values: p.values,
        });
      });
      return;
    }

    phieus.push({
      ...first.header!,
      lines: list.map((p) => p.line!),
      sourceRows: list.map((p) => ({ row: p.row, values: p.values })),
    });
  });

  errors.sort((a, b) => a.row - b.row);
  return { phieus, errors };
}
