import { describe, it, expect } from 'vitest';
import { formatMaDotKiemKePT } from './ma-dot';

describe('formatMaDotKiemKePT', () => {
  it('đệm 4 chữ số theo năm truyền vào', () => {
    expect(formatMaDotKiemKePT(7, 2026)).toBe('KKPT-2026-0007');
    expect(formatMaDotKiemKePT(123, 2026)).toBe('KKPT-2026-0123');
  });

  it('số vượt 4 chữ số không bị cắt', () => {
    expect(formatMaDotKiemKePT(12345, 2026)).toBe('KKPT-2026-12345');
  });

  it('mặc định lấy năm hiện tại', () => {
    expect(formatMaDotKiemKePT(1)).toBe(`KKPT-${new Date().getFullYear()}-0001`);
  });
});
