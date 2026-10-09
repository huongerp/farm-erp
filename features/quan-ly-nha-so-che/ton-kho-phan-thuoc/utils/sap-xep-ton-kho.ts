import type { SortState } from '../../../../store/createGenericStore';
import type { TonKhoPTProductAgg } from '../core/types';
import { isKhoColumnId, khoIdFromColumnId } from '../../../kho-van/ton-kho/store/useTonKhoStore';

const COT_CHU = new Set(['ma_hang', 'ten_hang', 'ten_danh_muc', 'don_vi_tinh']);

/** Sắp xếp danh sách tồn theo cột đang chọn (cột chữ theo tiếng Việt, cột số / cột kho theo giá trị). */
export function sapXepTonKhoPT(list: TonKhoPTProductAgg[], sort: SortState): TonKhoPTProductAgg[] {
  const { column, direction } = sort;
  if (!column || !direction) return list;
  const dau = direction === 'asc' ? 1 : -1;

  if (COT_CHU.has(column)) {
    const key = column as 'ma_hang' | 'ten_hang' | 'ten_danh_muc' | 'don_vi_tinh';
    return [...list].sort((a, b) => dau * (a[key] ?? '').localeCompare(b[key] ?? '', 'vi'));
  }
  const giaTri = (r: TonKhoPTProductAgg): number => {
    if (isKhoColumnId(column)) return r.by_kho[khoIdFromColumnId(column)] ?? 0;
    const v = r[column as keyof TonKhoPTProductAgg];
    return typeof v === 'number' ? v : 0;
  };
  return [...list].sort((a, b) => dau * (giaTri(a) - giaTri(b)));
}
