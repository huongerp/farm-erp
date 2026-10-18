import { describe, expect, it } from 'vitest';
import { cotCoDuLieu, tongTheoDvt, tongTheoPhamCap } from './tong-so-luong';

describe('tongTheoDvt', () => {
  it('không cộng lẫn đơn vị, gom Kg/kg làm một', () => {
    expect(
      tongTheoDvt([
        { don_vi_tinh: 'Bao', so_luong: 11 },
        { don_vi_tinh: 'Kg', so_luong: 100 },
        { don_vi_tinh: 'Bao', so_luong: 3 },
        { don_vi_tinh: 'kg ', so_luong: 8 },
      ])
    ).toEqual([
      { phamCap: null, dvt: 'Bao', soLuong: 14 },
      { phamCap: null, dvt: 'Kg', soLuong: 108 },
    ]);
  });

  it('ĐVT trống thành nhóm riêng, số lượng null tính 0', () => {
    expect(tongTheoDvt([{ so_luong: 2 }, { don_vi_tinh: '', so_luong: null }])).toEqual([
      { phamCap: null, dvt: null, soLuong: 2 },
    ]);
  });
});

describe('tongTheoPhamCap', () => {
  it('không có phẩm cấp nào → rỗng (không in "Tổng SL — —")', () => {
    expect(tongTheoPhamCap([{ so_luong: 1 }, { pham_cap: ' ', so_luong: 2 }])).toEqual([]);
  });

  it('chỉ một phẩm cấp → rỗng (trùng dòng tổng chung)', () => {
    expect(tongTheoPhamCap([{ pham_cap: 'XK', so_luong: 1 }, { pham_cap: 'XK', so_luong: 2 }])).toEqual([]);
  });

  it('≥ 2 nhóm: tách theo ĐVT, nhóm chưa phân cấp xếp cuối', () => {
    expect(
      tongTheoPhamCap([
        { pham_cap: null, don_vi_tinh: 'Cái', so_luong: 5 },
        { pham_cap: 'XK', don_vi_tinh: 'Cái', so_luong: 7 },
        { pham_cap: 'Loại 1', don_vi_tinh: 'Kg', so_luong: 2 },
        { pham_cap: 'XK', don_vi_tinh: 'Kg', so_luong: 1 },
        { pham_cap: 'XK', don_vi_tinh: 'Cái', so_luong: 3 },
      ])
    ).toEqual([
      { phamCap: 'Loại 1', dvt: 'Kg', soLuong: 2 },
      { phamCap: 'XK', dvt: 'Cái', soLuong: 10 },
      { phamCap: 'XK', dvt: 'Kg', soLuong: 1 },
      { phamCap: null, dvt: 'Cái', soLuong: 5 },
    ]);
  });
});

describe('cotCoDuLieu', () => {
  it('toàn trống / khoảng trắng → false; có một ô → true', () => {
    expect(cotCoDuLieu([{ a: null }, { a: ' ' }, { a: undefined }], (r) => r.a)).toBe(false);
    expect(cotCoDuLieu([{ a: null }, { a: 0 }], (r) => r.a)).toBe(true);
  });
});
