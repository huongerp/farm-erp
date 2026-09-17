import { describe, it, expect } from 'vitest';
import { laCapBacToanQuyen } from './cap-bac-toan-quyen';

describe('laCapBacToanQuyen', () => {
  it('cấp bậc 1 (số hoặc chuỗi) → toàn quyền', () => {
    expect(laCapBacToanQuyen(1)).toBe(true);
    expect(laCapBacToanQuyen('1')).toBe(true);
    expect(laCapBacToanQuyen(' 1 ')).toBe(true);
  });

  it('cấp bậc khác 1 → không toàn quyền', () => {
    expect(laCapBacToanQuyen(0)).toBe(false);
    expect(laCapBacToanQuyen(2)).toBe(false);
    expect(laCapBacToanQuyen(10)).toBe(false);
  });

  it('thiếu dữ liệu hoặc không phải số → không toàn quyền', () => {
    expect(laCapBacToanQuyen(null)).toBe(false);
    expect(laCapBacToanQuyen(undefined)).toBe(false);
    expect(laCapBacToanQuyen('')).toBe(false);
    expect(laCapBacToanQuyen('   ')).toBe(false);
    expect(laCapBacToanQuyen('abc')).toBe(false);
    expect(laCapBacToanQuyen(NaN)).toBe(false);
  });
});
