import { describe, it, expect } from 'vitest';
import { applyDelta, buildTonMap, findVuotTon, phieuDelta, tonKey } from './ton-kho-check';

const ton = () =>
  buildTonMap([
    { id_kho: '1', id_hang_hoa: '10', so_luong: 5 },
    { id_kho: '2', id_hang_hoa: '10', so_luong: 1 },
  ]);

const xuat = (sl: number, kho = '1') => phieuDelta({ loai: 'xuất', kho_id: kho, lines: [{ id_hang_hoa: '10', so_luong: sl }] });

describe('phieuDelta', () => {
  it('chuyển: trừ kho nguồn, cộng kho đích; "Không duyệt" không tính', () => {
    const d = phieuDelta({ loai: 'chuyển', kho_id: '1', kho_den_id: '2', lines: [{ id_hang_hoa: '10', so_luong: 3 }] });
    expect(d.get(tonKey('1', '10'))).toBe(-3);
    expect(d.get(tonKey('2', '10'))).toBe(3);
    expect(phieuDelta({ loai: 'xuất', kho_id: '1', trang_thai: 'Không duyệt', lines: [{ id_hang_hoa: '10', so_luong: 3 }] }).size).toBe(0);
  });

  it('gộp nhiều dòng cùng hàng', () => {
    const d = phieuDelta({ loai: 'xuất', kho_id: '1', lines: [{ id_hang_hoa: '10', so_luong: 2 }, { id_hang_hoa: '10', so_luong: 4 }] });
    expect(d.get(tonKey('1', '10'))).toBe(-6);
  });
});

describe('findVuotTon', () => {
  it('xuất trong tồn thì không báo, vượt tồn thì báo', () => {
    expect(findVuotTon(ton(), xuat(5))).toEqual([]);
    expect(findVuotTon(ton(), xuat(5.5))).toEqual([{ id_kho: '1', id_hang_hoa: '10', ton: 5, can: 5.5 }]);
    expect(findVuotTon(ton(), xuat(1, '9'))).toHaveLength(1);
  });

  it('sửa phiếu xuất: phần của phiếu cũ đã nằm trong tồn nên được cộng lại', () => {
    // Tồn 5 là sau khi phiếu cũ đã xuất 4 → thực có 9.
    expect(findVuotTon(ton(), xuat(9), xuat(4))).toEqual([]);
    expect(findVuotTon(ton(), xuat(10), xuat(4))).toHaveLength(1);
  });

  it('sửa phiếu nhập xuống dưới số đã xuất thì báo', () => {
    const nhap = (sl: number) => phieuDelta({ loai: 'nhập', kho_id: '2', lines: [{ id_hang_hoa: '10', so_luong: sl }] });
    // Kho 2 tồn 1 sau khi phiếu nhập cũ +10 → đã xuất 9; sửa nhập còn 8 thì âm.
    expect(findVuotTon(ton(), nhap(8), nhap(10))).toHaveLength(1);
    expect(findVuotTon(ton(), nhap(9), nhap(10))).toEqual([]);
  });

  it('không báo khi phiếu không làm tồn giảm (tồn đã âm sẵn)', () => {
    const am = buildTonMap([{ id_kho: '1', id_hang_hoa: '10', so_luong: -2 }]);
    expect(findVuotTon(am, xuat(3), xuat(3))).toEqual([]);
  });

  it('import nhiều phiếu: phiếu sau thấy phần phiếu trước đã lấy', () => {
    const t = ton();
    expect(findVuotTon(t, xuat(3))).toEqual([]);
    applyDelta(t, xuat(3));
    expect(findVuotTon(t, xuat(3))).toHaveLength(1);
  });
});
