import { describe, expect, it } from 'vitest';
import { cacThuoc, tongNuocLit } from './tong-hop';

describe('tong-hop', () => {
  it('tổng nước bỏ qua null, làm tròn 3 số lẻ', () => {
    expect(tongNuocLit([{ luong_nuoc_lit: 200 }, { luong_nuoc_lit: null }, { luong_nuoc_lit: 150.5 }])).toBe(350.5);
    expect(tongNuocLit([{ luong_nuoc_lit: 0.1 }, { luong_nuoc_lit: 0.2 }])).toBe(0.3);
    expect(tongNuocLit([])).toBe(0);
  });

  it('các thuốc: khác nhau, giữ thứ tự xuất hiện, bỏ trống', () => {
    expect(cacThuoc([{ ten_hang_hoa: 'A' }, { ten_hang_hoa: 'B' }, { ten_hang_hoa: 'A' }, { ten_hang_hoa: null }])).toEqual([
      'A',
      'B',
    ]);
  });
});
