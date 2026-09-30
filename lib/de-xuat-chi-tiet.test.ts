import { describe, it, expect } from 'vitest';
import { dongDeXuatDoDang } from './de-xuat-chi-tiet';

describe('dongDeXuatDoDang', () => {
  it('dòng đủ hàng + số lượng > 0 và dòng trống hoàn toàn đều hợp lệ', () => {
    expect(
      dongDeXuatDoDang([
        { id_hang_hoa: 'h1', so_luong: 2 },
        { id_hang_hoa: '', so_luong: 0 },
        { id_hang_hoa: 'h2', so_luong: '0.5' },
      ])
    ).toEqual([]);
  });

  it('có hàng mà số lượng ≤ 0 là dở dang', () => {
    expect(dongDeXuatDoDang([{ id_hang_hoa: 'h1', so_luong: 0 }, { id_hang_hoa: 'h2', so_luong: -1 }])).toEqual([0, 1]);
  });

  it('có số lượng mà chưa chọn hàng là dở dang', () => {
    expect(dongDeXuatDoDang([{ id_hang_hoa: 'h1', so_luong: 1 }, { id_hang_hoa: '  ', so_luong: 3 }])).toEqual([1]);
  });
});
