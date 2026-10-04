import { describe, it, expect } from 'vitest';
import { taoMatKhauTam } from './mat-khau-tam';
import { PASSWORD_MIN_LENGTH } from './constants';

describe('taoMatKhauTam', () => {
  it('đủ độ dài tối thiểu mà RPC rpc_set_mat_khau chấp nhận', () => {
    expect(taoMatKhauTam().length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
    expect(taoMatKhauTam(12)).toHaveLength(12);
  });

  it('không chứa ký tự dễ đọc nhầm', () => {
    const s = Array.from({ length: 200 }, () => taoMatKhauTam()).join('');
    expect(s).not.toMatch(/[0O1lIo]/);
    expect(s).toMatch(/^[A-Za-z2-9]+$/);
  });

  it('mỗi lần sinh khác nhau', () => {
    const tap = new Set(Array.from({ length: 100 }, () => taoMatKhauTam()));
    expect(tap.size).toBe(100);
  });
});
