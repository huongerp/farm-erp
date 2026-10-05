import type { DangKyNhanHangCt } from './types';

export interface NhomHangHoa {
  id_hang_hoa: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string;
  so_luong: number;
  so_dong: number;
}

/** Gộp dòng (mỗi dòng 1 cây hàng) theo thành phẩm của phiếu QC. */
export function gopTheoHangHoa(rows: DangKyNhanHangCt[]): NhomHangHoa[] {
  const map = new Map<string, NhomHangHoa>();
  for (const r of rows) {
    const id = r.id_hang_hoa ?? '';
    const cur = map.get(id);
    if (cur) {
      cur.so_luong += r.so_luong;
      cur.so_dong += 1;
    } else {
      map.set(id, {
        id_hang_hoa: id,
        ma_hang_hoa: r.ma_hang_hoa ?? '',
        ten_hang_hoa: r.ten_hang_hoa ?? '',
        dvt: r.dvt ?? '',
        so_luong: r.so_luong,
        so_dong: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.ma_hang_hoa.localeCompare(b.ma_hang_hoa));
}
