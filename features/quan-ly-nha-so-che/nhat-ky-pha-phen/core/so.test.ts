import { describe, expect, it } from 'vitest';
import { epSo, parseSo, soSangChuoi } from './so';

describe('parseSo', () => {
  it('ô trống / chữ → null, không phải 0', () => {
    expect(parseSo('')).toBeNull();
    expect(parseSo('  ')).toBeNull();
    expect(parseSo('abc')).toBeNull();
    expect(parseSo(null)).toBeNull();
  });
  it('nhận dấu phẩy và dấu chấm', () => {
    expect(parseSo('20,8')).toBe(20.8);
    expect(parseSo('20.8')).toBe(20.8);
    expect(parseSo('0')).toBe(0);
  });
});

describe('epSo / soSangChuoi', () => {
  it('numeric dạng string → number, null giữ null', () => {
    expect(epSo('20.800')).toBe(20.8);
    expect(epSo(null)).toBeNull();
  });
  it('làm tròn 3 số lẻ khi đưa vào ô nhập', () => {
    expect(soSangChuoi(10.8160000001)).toBe('10.816');
    expect(soSangChuoi(null)).toBe('');
  });
});
