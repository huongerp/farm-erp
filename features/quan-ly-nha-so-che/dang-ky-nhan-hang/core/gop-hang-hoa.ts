import type { DangKyNhanHangCt } from './types';

export interface NhomHangHoa {
  id_hang_hoa: string;
  ma_hang_hoa: string;
  ten_hang_hoa: string;
  dvt: string;
  so_luong: number;
  so_dong: number;
  /** Dòng mới nhất của mã này — dùng cho nút "−1". */
  dongMoiNhat: DangKyNhanHangCt;
}

/** Gộp dòng (mỗi thùng 1 dòng) theo mã hàng — `rows` đã sắp mới nhất trước. */
export function gopTheoHangHoa(rows: DangKyNhanHangCt[]): NhomHangHoa[] {
  const map = new Map<string, NhomHangHoa>();
  for (const r of rows) {
    const cur = map.get(r.id_hang_hoa);
    if (cur) {
      cur.so_luong += r.so_luong;
      cur.so_dong += 1;
    } else {
      map.set(r.id_hang_hoa, {
        id_hang_hoa: r.id_hang_hoa,
        ma_hang_hoa: r.ma_hang_hoa ?? '',
        ten_hang_hoa: r.ten_hang_hoa ?? '',
        dvt: r.dvt ?? '',
        so_luong: r.so_luong,
        so_dong: 1,
        dongMoiNhat: r,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.ma_hang_hoa.localeCompare(b.ma_hang_hoa));
}
