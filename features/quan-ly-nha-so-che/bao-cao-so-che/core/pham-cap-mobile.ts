import type { FarmBaoCaoSoChePhamCapRow } from './pham-cap';
import { lookupPhieuNhapSoLuong } from './pham-cap';
import type { PhamCapRowDerived } from './pham-cap-derived';

/** Mã ô số liệu phẩm cấp trên thẻ mobile — khớp với cột bảng desktop. */
export type PhamCapMobileFieldKey = 'soKg' | 'phieuNhap' | 'soThung' | 'tongKg' | 'tyLe' | 'quyDoi';

export interface PhamCapMobileField {
  key: PhamCapMobileFieldKey;
  /** `null` = đang tải (hiện "…"). */
  value: number | null;
  /** Hiển thị kèm "%". */
  pct?: boolean;
  /** Số thùng lệch SL phiếu nhập → tô màu cảnh báo (như bảng desktop). */
  warn?: boolean;
}

export interface PhamCapMobileCard {
  title: string;
  fields: PhamCapMobileField[];
  ghiChu: string;
}

/** Một thẻ / phẩm cấp. Ô "SL phiếu nhập" chỉ có khi có dữ liệu đối chiếu (hoặc đang tải). */
export function buildPhamCapMobileCards(
  rows: FarmBaoCaoSoChePhamCapRow[],
  derived: Pick<PhamCapRowDerived, 'tong_kg' | 'ty_le_pct'>[],
  phieuNhapByPhamCap: Record<string, number> | undefined,
  phieuNhapRefLoading: boolean
): PhamCapMobileCard[] {
  return rows.map((r, idx) => {
    const d = derived[idx];
    const slPhieuNhap = lookupPhieuNhapSoLuong(phieuNhapByPhamCap, r.ten_pham_cap);
    const soThung = Number(r.so_thung) || 0;
    const warn = slPhieuNhap !== undefined && soThung > 0 && slPhieuNhap > 0 && soThung !== slPhieuNhap;
    const fields: PhamCapMobileField[] = [
      { key: 'soKg', value: r.so_tham_chieu ?? 0 },
    ];
    if (phieuNhapRefLoading) fields.push({ key: 'phieuNhap', value: null });
    else if (slPhieuNhap !== undefined) fields.push({ key: 'phieuNhap', value: slPhieuNhap });
    fields.push(
      { key: 'soThung', value: r.so_thung ?? 0, warn },
      { key: 'tongKg', value: d?.tong_kg ?? 0 },
      { key: 'tyLe', value: d?.ty_le_pct ?? 0, pct: true },
      { key: 'quyDoi', value: r.so_thung_quy_doi ?? 0 }
    );
    return { title: r.ten_pham_cap?.trim() || '—', fields, ghiChu: r.ghi_chu?.trim() ?? '' };
  });
}

/** Thẻ tổng cộng: không có "Số kg" (kg/thùng) như dòng tổng của bảng desktop. */
export function buildPhamCapMobileTotalFields(
  totals: { so_thung: number; tong_kg: number; ty_le_pct: number; so_thung_quy_doi: number },
  phieuNhapRefTotal: number,
  phieuNhapRefLoading: boolean
): PhamCapMobileField[] {
  return [
    { key: 'phieuNhap', value: phieuNhapRefLoading ? null : phieuNhapRefTotal },
    { key: 'soThung', value: totals.so_thung },
    { key: 'tongKg', value: totals.tong_kg },
    { key: 'tyLe', value: totals.ty_le_pct, pct: true },
    { key: 'quyDoi', value: totals.so_thung_quy_doi },
  ];
}
