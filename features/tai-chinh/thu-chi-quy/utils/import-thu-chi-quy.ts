/**
 * Chuyển các dòng Excel sổ quỹ cũ → payload ghi vào fp_tc_quy_thu_chi.
 * Thuần, không React / không db → test trực tiếp.
 *
 * Cột file gốc: NGÀY | DIỄN GIẢI | SỐ LƯỢNG | ĐƠN GIÁ | HẠNG MỤC | THU | CHI |
 * TỒN QUỸ | SỐ ĐỀ XUẤT | GHI CHÚ.
 * - Cột TỒN QUỸ CỐ Ý bỏ qua — hệ thống tự tính lũy kế ở view.
 * - SỐ LƯỢNG / ĐƠN GIÁ không còn là trường nhập liệu, nên được gộp vào GHI CHÚ
 *   để dữ liệu sổ cũ không mất.
 */
import i18n from '../../../../lib/i18n';
import { IMPORT_ROW_KEY } from '../../../../lib/import-types';
import type { ImportErrorRow } from '../../../../lib/import-types';
import { matchKey, normalizeCode, normalizeText, parseImportNumber } from '../../../../lib/import-common';
import type { LoaiThuChi } from '../core/types';

const tr = (k: string, o?: Record<string, unknown>) => i18n.t(`thuChiQuy.import.${k}`, o ?? {});

export interface HangMucRefLite {
  id: string;
  ma: string;
  ten: string;
  loai: 'thu' | 'chi' | 'ca_hai';
}

export interface ThuChiQuyImportPayload {
  ngay: string;
  id_chi_nhanh: number;
  ten_chi_nhanh: string | null;
  loai: LoaiThuChi;
  so_tien: number;
  id_hang_muc: number | null;
  ten_hang_muc: string | null;
  dien_giai: string;
  ghi_chu: string | null;
  so_chung_tu: string | null;
}

export interface ThuChiQuyImportPlan {
  toInsert: { row: number; payload: ThuChiQuyImportPayload }[];
  errors: ImportErrorRow[];
}

export interface ImportPlanInput {
  hangMuc: HangMucRefLite[];
  idChiNhanh: string;
  tenChiNhanh?: string | null;
}

/** Ô ngày Excel: chuỗi dd/mm/yyyy, yyyy-mm-dd, hoặc serial number của Excel. */
export function parseImportDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return toIso(raw.getFullYear(), raw.getMonth() + 1, raw.getDate());
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Excel serial: ngày 1 = 1900-01-01, trừ lỗi năm nhuận 1900 của Excel.
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return toIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  const s = String(raw).trim();
  if (s === '') return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const vn = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (vn) {
    const day = Number(vn[1]);
    const month = Number(vn[2]);
    let year = Number(vn[3]);
    if (year < 100) year += 2000;
    return toIso(year, month, day);
  }

  return null;
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Ghép số lượng / đơn giá của sổ cũ vào ghi chú (không còn cột riêng trên UI). */
export function gopGhiChu(
  ghiChu: string,
  soLuong: number | null,
  donGia: number | null
): string | null {
  const phan: string[] = [];
  if (soLuong != null) phan.push(`SL ${soLuong}`);
  if (donGia != null) phan.push(`ĐG ${donGia.toLocaleString('vi-VN')}`);
  const themVao = phan.join(' × ');
  const goc = ghiChu.trim();
  if (!themVao) return goc || null;
  return goc ? `${goc} (${themVao})` : themVao;
}

function buildHangMucIndex(list: HangMucRefLite[]) {
  const byMa = new Map<string, HangMucRefLite>();
  const byTen = new Map<string, HangMucRefLite>();
  for (const hm of list) {
    const ma = normalizeCode(hm.ma);
    if (ma && !byMa.has(ma)) byMa.set(ma, hm);
    const ten = matchKey(hm.ten);
    if (ten && !byTen.has(ten)) byTen.set(ten, hm);
  }
  return { byMa, byTen };
}

/**
 * Lập kế hoạch import: mỗi dòng Excel → payload, dòng hỏng → lỗi kèm số dòng thật
 * (ImportDialog gắn sẵn ở `IMPORT_ROW_KEY`), KHÔNG âm thầm bỏ qua.
 */
export function buildThuChiQuyImportPlan(
  rows: Record<string, unknown>[],
  input: ImportPlanInput
): ThuChiQuyImportPlan {
  const { byMa, byTen } = buildHangMucIndex(input.hangMuc);
  const idChiNhanh = Number(input.idChiNhanh);
  const toInsert: ThuChiQuyImportPlan['toInsert'] = [];
  const errors: ImportErrorRow[] = [];

  rows.forEach((raw, idx) => {
    const rowNo = Number(raw[IMPORT_ROW_KEY] ?? idx + 2);
    const fail = (msg: string) => errors.push({ row: rowNo, msg, values: raw });

    if (!Number.isFinite(idChiNhanh) || Number.isNaN(idChiNhanh)) {
      fail(tr('errChiNhanh'));
      return;
    }

    const ngay = parseImportDate(raw.ngay);
    if (!ngay) {
      fail(tr('errNgay'));
      return;
    }

    const dienGiai = normalizeText(raw.dien_giai);
    if (!dienGiai) {
      fail(tr('errDienGiai'));
      return;
    }

    const thu = parseImportNumber(raw.thu);
    const chi = parseImportNumber(raw.chi);
    if (!thu.ok || !chi.ok) {
      fail(tr('errSoTien'));
      return;
    }
    const thuVal = thu.value ?? 0;
    const chiVal = chi.value ?? 0;
    if (thuVal > 0 && chiVal > 0) {
      fail(tr('errThuVaChi'));
      return;
    }
    if (thuVal <= 0 && chiVal <= 0) {
      fail(tr('errSoTienZero'));
      return;
    }
    const loai: LoaiThuChi = thuVal > 0 ? 'thu' : 'chi';
    const soTien = thuVal > 0 ? thuVal : chiVal;

    const soLuong = parseImportNumber(raw.so_luong);
    const donGia = parseImportNumber(raw.don_gia);
    if (!soLuong.ok || !donGia.ok) {
      fail(tr('errSoLuongDonGia'));
      return;
    }

    const hangMucRaw = normalizeText(raw.hang_muc);
    let hangMuc: HangMucRefLite | undefined;
    if (hangMucRaw) {
      hangMuc = byMa.get(normalizeCode(hangMucRaw)) ?? byTen.get(matchKey(hangMucRaw));
      if (!hangMuc) {
        fail(tr('errHangMuc', { ten: hangMucRaw }));
        return;
      }
      if (hangMuc.loai !== 'ca_hai' && hangMuc.loai !== loai) {
        fail(tr('errHangMucLoai', { ten: hangMuc.ten }));
        return;
      }
    }

    toInsert.push({
      row: rowNo,
      payload: {
        ngay,
        id_chi_nhanh: idChiNhanh,
        ten_chi_nhanh: input.tenChiNhanh ?? null,
        loai,
        so_tien: soTien,
        id_hang_muc: hangMuc ? Number(hangMuc.id) : null,
        ten_hang_muc: hangMuc?.ten ?? null,
        dien_giai: dienGiai,
        ghi_chu: gopGhiChu(normalizeText(raw.ghi_chu), soLuong.value, donGia.value),
        so_chung_tu: normalizeText(raw.so_chung_tu) || null,
      },
    });
  });

  return { toInsert, errors };
}
