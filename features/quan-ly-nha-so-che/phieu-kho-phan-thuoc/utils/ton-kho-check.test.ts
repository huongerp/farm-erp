import { describe, it, expect } from 'vitest';
import { applyDelta, buildTonMap, findDuoiDinhMuc, findVuotTon, laDuoiDinhMuc, phieuDelta, tonKey, tonSauPhieu } from './ton-kho-check';

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

describe('định mức tồn', () => {
  const DM = { '10': 3 };

  it('laDuoiDinhMuc: định mức trống / 0 không báo; bằng định mức không báo', () => {
    expect(laDuoiDinhMuc(0, null)).toBe(false);
    expect(laDuoiDinhMuc(-2, 0)).toBe(false);
    expect(laDuoiDinhMuc(3, 3)).toBe(false);
    expect(laDuoiDinhMuc(2.5, 3)).toBe(true);
  });

  it('xuất làm tồn xuống dưới định mức → báo, kèm tồn sau phiếu', () => {
    expect(findDuoiDinhMuc(ton(), xuat(3), new Map(), DM)).toEqual([{ id_kho: '1', id_hang_hoa: '10', sau: 2, dinh_muc: 3 }]);
    expect(findDuoiDinhMuc(ton(), xuat(2), new Map(), DM)).toEqual([]);
  });

  it('nhập không báo dù tồn sau vẫn dưới định mức; hàng không đặt định mức không báo', () => {
    const nhap = phieuDelta({ loai: 'nhập', kho_id: '2', lines: [{ id_hang_hoa: '10', so_luong: 1 }] });
    expect(findDuoiDinhMuc(ton(), nhap, new Map(), DM)).toEqual([]);
    expect(findDuoiDinhMuc(ton(), xuat(4), new Map(), {})).toEqual([]);
  });

  it('sửa phiếu: trừ phần phiếu cũ trước khi tính', () => {
    // Tồn 5 đã gồm phiếu cũ xuất 2 → khả dụng 7; sửa thành xuất 3 → còn 4, chưa dưới định mức 3.
    const t = buildTonMap([{ id_kho: '1', id_hang_hoa: '10', so_luong: 5 }]);
    expect(tonSauPhieu(t, xuat(3), xuat(2), '1', '10')).toEqual({ truoc: 7, sau: 4 });
    expect(findDuoiDinhMuc(t, xuat(3), xuat(2), DM)).toEqual([]);
    expect(findDuoiDinhMuc(t, xuat(5), xuat(2), DM)).toEqual([{ id_kho: '1', id_hang_hoa: '10', sau: 2, dinh_muc: 3 }]);
  });

  it('chuyển kho: chỉ báo kho nguồn', () => {
    const d = phieuDelta({ loai: 'chuyển', kho_id: '1', kho_den_id: '2', lines: [{ id_hang_hoa: '10', so_luong: 4 }] });
    expect(findDuoiDinhMuc(ton(), d, new Map(), DM)).toEqual([{ id_kho: '1', id_hang_hoa: '10', sau: 1, dinh_muc: 3 }]);
  });
});
