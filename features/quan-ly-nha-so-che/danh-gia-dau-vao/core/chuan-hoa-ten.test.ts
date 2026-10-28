import { describe, expect, it } from 'vitest';
import { gonTen, khoaTen, laTenMoi, tenKhongTrung } from './chuan-hoa-ten';

describe('chuan-hoa-ten', () => {
  it('khoaTen bỏ khoảng trắng thừa, không phân biệt hoa thường', () => {
    expect(khoaTen('  Võ thị  Cưng ')).toBe(khoaTen('Võ Thị Cưng'));
    expect(khoaTen(null)).toBe('');
  });

  it('gonTen: rỗng → null', () => {
    expect(gonTen('  A1   -1 ')).toBe('A1 -1');
    expect(gonTen('   ')).toBeNull();
  });

  it('laTenMoi: chỉ tên chưa có (so không phân biệt hoa thường), rỗng không tính', () => {
    expect(laTenMoi('chín XANH', ['Chín xanh', 'Rệp sáp'])).toBe(false);
    expect(laTenMoi('Thối cuống', ['Chín xanh'])).toBe(true);
    expect(laTenMoi('  ', [])).toBe(false);
  });

  it('tenKhongTrung gộp cách viết khác nhau, giữ bản đầu', () => {
    expect(tenKhongTrung(['Bé', 'an', null, ' AN ', 'bé'])).toEqual(['an', 'Bé']);
  });
});
