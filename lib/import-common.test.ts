import { describe, it, expect } from 'vitest';
import {
  normalizeCode,
  normalizeText,
  matchKey,
  parseImportNumber,
  parseImportInt,
  normalizeHeader,
  buildAutoMapping,
} from './import-common';

describe('normalizeCode', () => {
  it('trim + viết hoa như service create/update', () => {
    expect(normalizeCode('  sp-001 ')).toBe('SP-001');
    expect(normalizeCode(null)).toBe('');
    expect(normalizeCode(123)).toBe('123');
  });
});

describe('normalizeText / matchKey', () => {
  it('gộp khoảng trắng thừa, giữ nguyên dấu', () => {
    expect(normalizeText('  Phân   bón  NPK ')).toBe('Phân bón NPK');
    expect(normalizeText('\u00a0Kg\u00a0')).toBe('Kg');
  });

  it('matchKey bỏ qua hoa thường', () => {
    expect(matchKey(' Phân Bón  NPK ')).toBe('phân bón npk');
  });
});

describe('parseImportNumber', () => {
  it('nhận số nguyên thủy', () => {
    expect(parseImportNumber(50000)).toEqual({ ok: true, value: 50000 });
    expect(parseImportNumber(0)).toEqual({ ok: true, value: 0 });
  });

  it('ô trống → null, không phải 0', () => {
    expect(parseImportNumber('')).toEqual({ ok: true, value: null });
    expect(parseImportNumber('   ')).toEqual({ ok: true, value: null });
    expect(parseImportNumber(null)).toEqual({ ok: true, value: null });
    expect(parseImportNumber(undefined)).toEqual({ ok: true, value: null });
  });

  it('định dạng nghìn kiểu Việt Nam', () => {
    expect(parseImportNumber('50.000')).toEqual({ ok: true, value: 50000 });
    expect(parseImportNumber('1.234.567')).toEqual({ ok: true, value: 1234567 });
    expect(parseImportNumber('1.234,5')).toEqual({ ok: true, value: 1234.5 });
  });

  it('định dạng nghìn kiểu Anh Mỹ', () => {
    expect(parseImportNumber('50,000')).toEqual({ ok: true, value: 50000 });
    expect(parseImportNumber('1,234,567.89')).toEqual({ ok: true, value: 1234567.89 });
  });

  it('thập phân bằng dấu phẩy', () => {
    expect(parseImportNumber('1,5')).toEqual({ ok: true, value: 1.5 });
  });

  it('bỏ khoảng trắng phân nhóm', () => {
    expect(parseImportNumber(' 1 234 ')).toEqual({ ok: true, value: 1234 });
  });

  it('chuỗi rác và số âm → lỗi, KHÔNG âm thầm về 0', () => {
    expect(parseImportNumber('abc')).toEqual({ ok: false });
    expect(parseImportNumber('50.000đ')).toEqual({ ok: false });
    expect(parseImportNumber('-5')).toEqual({ ok: false });
    expect(parseImportNumber(-5)).toEqual({ ok: false });
    expect(parseImportNumber(Number.NaN)).toEqual({ ok: false });
  });
});

describe('parseImportInt', () => {
  it('chỉ nhận số nguyên', () => {
    expect(parseImportInt('3')).toEqual({ ok: true, value: 3 });
    expect(parseImportInt('')).toEqual({ ok: true, value: null });
    expect(parseImportInt('2,5')).toEqual({ ok: false });
    expect(parseImportInt('x')).toEqual({ ok: false });
  });
});

describe('normalizeHeader', () => {
  it('bỏ dấu, xử lý đ/Đ, gộp khoảng trắng', () => {
    expect(normalizeHeader('  Mã   Hàng Hóa ')).toBe('ma hang hoa');
    expect(normalizeHeader('ĐƠN GIÁ')).toBe('don gia');
  });
});

describe('buildAutoMapping', () => {
  const columns = [
    { key: 'ma_hang_hoa', label: 'Mã hàng' },
    { key: 'ten_hang_hoa', label: 'Tên hàng' },
    { key: 'don_gia', label: 'Đơn giá' },
  ];

  it('khớp dù file viết khác dấu / khác hoa thường', () => {
    expect(buildAutoMapping(columns, ['MA HANG', 'ten hang', 'don gia'])).toEqual({
      ma_hang_hoa: 'MA HANG',
      ten_hang_hoa: 'ten hang',
      don_gia: 'don gia',
    });
  });

  it('ưu tiên khớp chính xác trước khớp gần đúng', () => {
    // "Mã hàng hóa" chứa "Mã hàng" nên nếu không ưu tiên exact sẽ bị chiếm mất.
    const map = buildAutoMapping(columns, ['Mã hàng hóa', 'Mã hàng', 'Tên hàng', 'Đơn giá']);
    expect(map.ma_hang_hoa).toBe('Mã hàng');
  });

  it('một cột file không bị gán cho hai cột hệ thống', () => {
    const map = buildAutoMapping(columns, ['Hàng']);
    const used = Object.values(map);
    expect(new Set(used).size).toBe(used.length);
  });

  it('cột không khớp gì thì bỏ trống để người dùng tự chọn', () => {
    const map = buildAutoMapping(columns, ['Cột lạ', 'Đơn giá']);
    expect(map.don_gia).toBe('Đơn giá');
    expect(map.ma_hang_hoa).toBeUndefined();
  });

  it('cột "Lỗi" của file báo lỗi không khớp vào cột nào → import lại được ngay', () => {
    const map = buildAutoMapping(columns, ['Mã hàng', 'Tên hàng', 'Đơn giá', 'Lỗi']);
    expect(Object.values(map)).not.toContain('Lỗi');
  });
});
