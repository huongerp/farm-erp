import { describe, expect, it } from 'vitest';
import { formatKyThangNam } from './ky-hien-thi';

describe('formatKyThangNam', () => {
  it('đệm số 0 cho tháng một chữ số và đặt tháng trước năm', () => {
    expect(formatKyThangNam(2026, 5)).toBe('05/2026');
  });
  it('giữ nguyên tháng hai chữ số', () => {
    expect(formatKyThangNam(2025, 12)).toBe('12/2025');
  });
});
