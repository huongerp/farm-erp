import { describe, expect, it } from 'vitest';
import { nhanTiLeKsc } from './export-danh-sach';

describe('nhanTiLeKsc', () => {
  it('KSC / Tổng thu, 1 chữ số thập phân; tổng thu 0 → «–»', () => {
    expect(nhanTiLeKsc(12, 96)).toBe('12,5%');
    expect(nhanTiLeKsc(1, 3)).toBe('33,3%');
    expect(nhanTiLeKsc(0, 50)).toBe('0,0%');
    expect(nhanTiLeKsc(0, 0)).toBe('–');
  });
});
