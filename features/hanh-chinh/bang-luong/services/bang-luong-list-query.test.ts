import { describe, expect, it } from 'vitest';

import { tachKyLuong } from './bang-luong-list-query';

describe('tachKyLuong', () => {
  it('tách đúng năm và tháng', () => {
    expect(tachKyLuong('2024-03')).toEqual({ nam: 2024, thang: 3 });
    expect(tachKyLuong('2024-12')).toEqual({ nam: 2024, thang: 12 });
  });

  it('tháng ngoài 1–12 hoặc chuỗi lạ → null', () => {
    expect(tachKyLuong('2024-13')).toBeNull();
    expect(tachKyLuong('2024-00')).toBeNull();
    expect(tachKyLuong('2024')).toBeNull();
    expect(tachKyLuong('')).toBeNull();
  });
});
