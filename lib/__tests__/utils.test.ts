import { describe, it, expect } from 'vitest';
import {
  parseFormattedNumber,
  formatNumberVN,
  formatCurrency,
  formatDate,
  formatDateShort,
} from '../utils';

describe('parseFormattedNumber', () => {
  it('parse số vi-VN có phân tách hàng nghìn và phẩy thập phân', () => {
    expect(parseFormattedNumber('1.234,56', 'vi')).toBe(1234.56);
    expect(parseFormattedNumber('1.234', 'vi')).toBe(1234);
  });

  it('parse số en-US có phân tách hàng nghìn và chấm thập phân', () => {
    expect(parseFormattedNumber('1,234.56', 'en')).toBe(1234.56);
  });

  it('trả 0 cho chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
    expect(parseFormattedNumber('')).toBe(0);
    expect(parseFormattedNumber('   ')).toBe(0);
  });

  it('trả 0 cho input không phải số hợp lệ — silent fallback, không báo lỗi', () => {
    // Đây là hành vi hiện tại (xem báo cáo rà soát): input rác bị nuốt
    // thành 0 mà không có tín hiệu nào cho người dùng biết đã sai.
    expect(parseFormattedNumber('abc')).toBe(0);
    expect(parseFormattedNumber('--')).toBe(0);
  });

  it('trả 0 khi input không phải string (null/undefined qua any)', () => {
    expect(parseFormattedNumber(null as unknown as string)).toBe(0);
    expect(parseFormattedNumber(undefined as unknown as string)).toBe(0);
  });
});

describe('formatNumberVN', () => {
  it('trả — cho null/undefined/NaN', () => {
    expect(formatNumberVN(null)).toBe('—');
    expect(formatNumberVN(undefined)).toBe('—');
    expect(formatNumberVN(NaN)).toBe('—');
  });

  it('định dạng số theo vi-VN (phân tách hàng nghìn bằng dấu chấm)', () => {
    expect(formatNumberVN(1234)).toBe('1.234');
    expect(formatNumberVN(0)).toBe('0');
  });

  it('tôn trọng maxFractionDigits/minFractionDigits', () => {
    expect(formatNumberVN(1234.5678, { maxFractionDigits: 2 })).toBe('1.234,57');
    expect(formatNumberVN(1, { minFractionDigits: 2 })).toBe('1,00');
  });
});

describe('formatCurrency', () => {
  it('định dạng số thành tiền VND', () => {
    const out = formatCurrency(1000000);
    // Intl.NumberFormat vi-VN currency VND: "1.000.000 ₫" (khoảng trắng có thể là NBSP)
    expect(out.replace(/\u00A0/g, ' ')).toContain('1.000.000');
    expect(out).toContain('₫');
  });
});

describe('formatDate / formatDateShort', () => {
  it('trả rỗng cho null/undefined', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDateShort(null)).toBe('');
  });

  it('định dạng theo giờ Asia/Ho_Chi_Minh (UTC+7), không lệch ngày', () => {
    // 2024-06-15T10:00:00Z = 2024-06-15 17:00 giờ VN — cùng ngày, tránh lệch múi giờ ở biên ngày.
    expect(formatDate('2024-06-15T10:00:00Z')).toBe('15/06/2024');
    expect(formatDateShort('2024-06-15T10:00:00Z')).toBe('15/06');
  });
});
