import { describe, it, expect } from 'vitest';
import { sumSoLuongByPhamCap } from './sum-so-luong-by-pham-cap';

describe('sumSoLuongByPhamCap — tổng số lượng theo phẩm cấp trên bản in phiếu kho', () => {
  it('gom đúng tổng theo từng phẩm cấp', () => {
    const out = sumSoLuongByPhamCap([
      { pham_cap: 'XK', so_luong: 285 },
      { pham_cap: 'NĐ', so_luong: 92 },
      { pham_cap: 'XK', so_luong: 150 },
      { pham_cap: 'NĐ', so_luong: 26 },
    ]);
    expect(out).toEqual([
      { phamCap: 'NĐ', soLuong: 118 },
      { phamCap: 'XK', soLuong: 435 },
    ]);
  });

  it('phẩm cấp trống / null / khoảng trắng gom chung vào nhãn "—" và xếp cuối', () => {
    const out = sumSoLuongByPhamCap([
      { pham_cap: null, so_luong: 3 },
      { pham_cap: 'XK', so_luong: 10 },
      { pham_cap: '   ', so_luong: 2 },
      { pham_cap: undefined, so_luong: 1 },
    ]);
    expect(out).toEqual([
      { phamCap: 'XK', soLuong: 10 },
      { phamCap: '—', soLuong: 6 },
    ]);
  });

  it('cắt khoảng trắng thừa để không tách nhóm', () => {
    const out = sumSoLuongByPhamCap([
      { pham_cap: ' XK', so_luong: 1 },
      { pham_cap: 'XK ', so_luong: 2 },
    ]);
    expect(out).toEqual([{ phamCap: 'XK', soLuong: 3 }]);
  });

  it('sắp xếp theo tiếng Việt', () => {
    const out = sumSoLuongByPhamCap([
      { pham_cap: 'Ổn định', so_luong: 1 },
      { pham_cap: 'Đạt', so_luong: 1 },
      { pham_cap: 'An toàn', so_luong: 1 },
    ]);
    expect(out.map((r) => r.phamCap)).toEqual(['An toàn', 'Đạt', 'Ổn định']);
  });

  it('số lượng null / không phải số tính là 0', () => {
    const out = sumSoLuongByPhamCap([
      { pham_cap: 'XK', so_luong: null },
      { pham_cap: 'XK', so_luong: Number.NaN },
      { pham_cap: 'XK', so_luong: 5 },
    ]);
    expect(out).toEqual([{ phamCap: 'XK', soLuong: 5 }]);
  });

  it('danh sách rỗng → mảng rỗng (bản in không hiện dòng tổng nào)', () => {
    expect(sumSoLuongByPhamCap([])).toEqual([]);
  });
});
