import type { TFunction } from 'i18next';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { isKhoColumnId, khoIdFromColumnId } from '../../../kho-van/ton-kho/store/useTonKhoStore';
import type { TonKhoPTProductAgg } from '../core/types';

function giaTriCot(r: TonKhoPTProductAgg, colId: string): string | number {
  if (isKhoColumnId(colId)) return r.by_kho[khoIdFromColumnId(colId)] ?? 0;
  switch (colId) {
    case 'ten_danh_muc':
      return r.ten_danh_muc ?? '';
    case 'dinh_muc':
      return r.dinh_muc ?? '';
    default: {
      const v = r[colId as keyof TonKhoPTProductAgg];
      return typeof v === 'number' || typeof v === 'string' ? v : '';
    }
  }
}

/** Xuất đúng các cột đang hiện trên bảng (gồm cột kho động), tên file kèm kỳ. */
export async function exportTonKhoPTByProductToExcel(
  rows: TonKhoPTProductAgg[],
  visibleColumns: ColumnConfig[],
  ky: { tu: string; den: string },
  t: TFunction
): Promise<void> {
  const XLSX = await import('xlsx');
  const sheet = rows.map((r) => {
    const out: Record<string, string | number> = {};
    for (const col of visibleColumns) out[col.label] = giaTriCot(r, col.id);
    return out;
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), t('tonKhoPhanThuoc.export.sheet'));
  const tenKy = [ky.tu || 'dau', ky.den || 'nay'].join('_');
  XLSX.writeFile(wb, `ton_kho_${tenKy}.xlsx`);
}
