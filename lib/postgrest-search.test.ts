import { describe, expect, it } from 'vitest';

import { buildPostgrestSearchOr, dieuKienKyTheoNgay, khoangNgay, parseNgayNhap } from './postgrest-search';

const SPEC = { text: ['so_phieu', 'ghi_chu'], numeric: ['id'], dates: ['ngay'] };

describe('buildPostgrestSearchOr', () => {
  it('từ khoá rỗng không sinh điều kiện nào', () => {
    expect(buildPostgrestSearchOr('', SPEC)).toEqual([]);
    expect(buildPostgrestSearchOr('   ', SPEC)).toEqual([]);
    expect(buildPostgrestSearchOr(null, SPEC)).toEqual([]);
  });

  it('cột chữ dùng ilike, mẫu được bọc ngoặc kép', () => {
    const parts = buildPostgrestSearchOr('abc', SPEC);
    expect(parts).toContain('so_phieu.ilike."%abc%"');
    expect(parts).toContain('ghi_chu.ilike."%abc%"');
  });

  it('escape % và _ để không thành ký tự đại diện', () => {
    const parts = buildPostgrestSearchOr('50%_x', { text: ['ghi_chu'] });
    expect(parts[0]).toBe('ghi_chu.ilike."%50\\%\\_x%"');
  });

  it('chỉ thêm cột số khi từ khoá là số nguyên', () => {
    expect(buildPostgrestSearchOr('42', SPEC)).toContain('id.eq.42');
    expect(buildPostgrestSearchOr('4.2', SPEC).some((p) => p.startsWith('id.'))).toBe(false);
    expect(buildPostgrestSearchOr('abc', SPEC).some((p) => p.startsWith('id.'))).toBe(false);
  });

  it('cột ngày khớp khi gõ dd/mm/yyyy hoặc ISO', () => {
    const mong = 'and(ngay.gte.2024-03-15,ngay.lte.2024-03-15)';
    expect(buildPostgrestSearchOr('15/03/2024', SPEC)).toContain(mong);
    expect(buildPostgrestSearchOr('2024-03-15', SPEC)).toContain(mong);
  });

  it('điều kiện ngày phải bọc and(...) — để rời thì "≥ X HOẶC ≤ X" khớp mọi dòng', () => {
    const parts = buildPostgrestSearchOr('15/03/2024', SPEC);
    expect(parts.some((p) => p === 'ngay.gte.2024-03-15')).toBe(false);
    expect(parts.some((p) => p === 'ngay.lte.2024-03-15')).toBe(false);
  });

  it('từ khoá chứa dấu phẩy vẫn an toàn (bọc ngoặc kép)', () => {
    expect(buildPostgrestSearchOr('1,4', { text: ['ghi_chu'] })[0]).toBe('ghi_chu.ilike."%1,4%"');
  });
});

describe('parseNgayNhap', () => {
  it('nhận dd/mm/yyyy, dd-mm-yyyy và ISO', () => {
    expect(parseNgayNhap('5/3/2024')).toBe('2024-03-05');
    expect(parseNgayNhap('05-03-2024')).toBe('2024-03-05');
    expect(parseNgayNhap('2024-3-5')).toBe('2024-03-05');
  });

  it('chuỗi không phải ngày trả null', () => {
    expect(parseNgayNhap('abc')).toBeNull();
    expect(parseNgayNhap('15/03')).toBeNull();
  });
});

describe('khoangNgay', () => {
  it('năm → trọn năm', () => {
    expect(khoangNgay('2024')).toEqual({ from: '2024-01-01', to: '2024-12-31' });
  });
  it('tháng → đúng ngày cuối tháng', () => {
    expect(khoangNgay('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' }); // năm nhuận
    expect(khoangNgay('2023-02')).toEqual({ from: '2023-02-01', to: '2023-02-28' });
    expect(khoangNgay('2024-04')).toEqual({ from: '2024-04-01', to: '2024-04-30' });
    expect(khoangNgay('2024-12')).toEqual({ from: '2024-12-01', to: '2024-12-31' });
  });
  it('tháng ngoài 1–12 và chuỗi lạ → null (không cuộn sang năm sau)', () => {
    expect(khoangNgay('2024-13')).toBeNull();
    expect(khoangNgay('2024-00')).toBeNull();
    expect(khoangNgay('abcd')).toBeNull();
  });
});
describe('dieuKienKyTheoNgay', () => {
  it('không chọn kỳ nào thì không sinh điều kiện', () => {
    expect(dieuKienKyTheoNgay([], [])).toEqual([]);
  });
  it('gộp cả năm lẫn tháng, mỗi mốc một nhánh and(...)', () => {
    expect(dieuKienKyTheoNgay(['2024'], ['2025-03'])).toEqual([
      'and(ngay.gte.2024-01-01,ngay.lte.2024-12-31)',
      'and(ngay.gte.2025-03-01,ngay.lte.2025-03-31)',
    ]);
  });
});
