import { describe, expect, it } from 'vitest';
import { laSoKhongHopLe, parseSo } from './so';

describe('parseSo', () => {
  it('ô trống / null → null (không phải 0)', () => {
    expect(parseSo('')).toBeNull();
    expect(parseSo('   ')).toBeNull();
    expect(parseSo(null)).toBeNull();
  });

  it('nhận dấu phẩy thập phân', () => {
    expect(parseSo('1,5')).toBe(1.5);
    expect(parseSo('200')).toBe(200);
    expect(parseSo('0')).toBe(0);
  });

  it('chuỗi không phải số → null và được coi là không hợp lệ', () => {
    expect(parseSo('abc')).toBeNull();
    expect(laSoKhongHopLe('abc')).toBe(true);
    expect(laSoKhongHopLe('')).toBe(false);
    expect(laSoKhongHopLe('2')).toBe(false);
  });
});
