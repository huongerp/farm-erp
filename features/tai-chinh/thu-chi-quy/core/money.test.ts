import { describe, it, expect } from 'vitest';
import { coerceSoTien, tinhSoTien } from './money';

describe('coerceSoTien', () => {
  it('parse số kiểu Việt Nam (nghìn bằng dấu chấm)', () => {
    expect(coerceSoTien('1.200.000')).toBe(1200000);
    expect(coerceSoTien('21.885.000')).toBe(21885000);
    expect(coerceSoTien('1.234,5')).toBe(1234.5);
  });

  it('parse số kiểu Anh/Mỹ (nghìn bằng dấu phẩy)', () => {
    expect(coerceSoTien('1,200,000')).toBe(1200000);
    expect(coerceSoTien('1,234.5')).toBe(1234.5);
  });

  it('parse thập phân kiểu VN và số thường', () => {
    expect(coerceSoTien('1,5')).toBe(1.5);
    expect(coerceSoTien('280000')).toBe(280000);
    expect(coerceSoTien(49000)).toBe(49000);
  });

  it('bỏ ký hiệu tiền tệ và khoảng trắng', () => {
    expect(coerceSoTien(' 1.500.000 ₫ ')).toBe(1500000);
    expect(coerceSoTien('132.000đ')).toBe(132000);
  });

  it('rỗng / không parse được → null', () => {
    expect(coerceSoTien('')).toBeNull();
    expect(coerceSoTien('   ')).toBeNull();
    expect(coerceSoTien(null)).toBeNull();
    expect(coerceSoTien(undefined)).toBeNull();
    expect(coerceSoTien('abc')).toBeNull();
    expect(coerceSoTien(Number.NaN)).toBeNull();
  });
});

describe('tinhSoTien', () => {
  it('ưu tiên số tiền nhập tay', () => {
    expect(tinhSoTien(250000, 5, 10000)).toBe(250000);
  });

  it('bỏ trống số tiền thì lấy số lượng × đơn giá', () => {
    expect(tinhSoTien(null, 5, 50000)).toBe(250000);
    expect(tinhSoTien(0, 2, 40000)).toBe(80000);
  });

  it('thiếu dữ liệu → 0', () => {
    expect(tinhSoTien(null, null, null)).toBe(0);
    expect(tinhSoTien(null, 5, null)).toBe(0);
    expect(tinhSoTien(0, null, 1000)).toBe(0);
  });
});
