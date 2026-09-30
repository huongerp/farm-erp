import { describe, expect, it } from 'vitest';
import { chiNhanhGanNhatCuaToi, goiYGiaTri } from './goi-y';

describe('gợi ý khi thêm phiếu', () => {
  it('chi nhánh phiếu gần nhất của chính mình', () => {
    const rows = [
      { id_nguoi_tao: '1', id_chi_nhanh: '10', tg_tao: '2026-09-01T00:00:00Z' },
      { id_nguoi_tao: '1', id_chi_nhanh: '12', tg_tao: '2026-09-30T00:00:00Z' },
      { id_nguoi_tao: '2', id_chi_nhanh: '99', tg_tao: '2026-10-01T00:00:00Z' },
    ];
    expect(chiNhanhGanNhatCuaToi(rows, '1')).toBe('12');
    expect(chiNhanhGanNhatCuaToi(rows, '3')).toBeNull();
    expect(chiNhanhGanNhatCuaToi(rows, null)).toBeNull();
  });

  it('giá trị hay dùng lên trước, bỏ trống', () => {
    expect(goiYGiaTri(['TQ', ' VN ', 'TQ', null, '', 'TQ', 'VN', 'KR'])).toEqual(['TQ', 'VN', 'KR']);
  });
});
