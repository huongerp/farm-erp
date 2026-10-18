import { describe, it, expect } from 'vitest';
import {
  parseFormattedNumber,
  formatNumberVN,
  formatSoRutGon,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatYmdToDisplay,
  formatDateVietnameseLong,
} from './utils';

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

describe('formatSoRutGon', () => {
  it('rút gọn theo vi-VN: nghìn / triệu / tỷ, tối đa 1 chữ số lẻ', () => {
    expect(formatSoRutGon(950)).toBe('950');
    expect(formatSoRutGon(850000)).toBe('850\u00a0N');
    expect(formatSoRutGon(3400000)).toBe('3,4\u00a0Tr');
    expect(formatSoRutGon(6882364.24)).toBe('6,9\u00a0Tr');
    expect(formatSoRutGon(-25000)).toBe('-25\u00a0N');
  });

  it('trả — cho null/undefined/NaN', () => {
    expect(formatSoRutGon(null)).toBe('—');
    expect(formatSoRutGon(NaN)).toBe('—');
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

describe('formatDateVietnameseLong', () => {
  it('ngày thuần YYYY-MM-DD cắt chuỗi, không lệch múi giờ', () => {
    expect(formatDateVietnameseLong('2026-01-01')).toBe('Ngày 01 tháng 01 năm 2026');
    expect(formatDateVietnameseLong('2026-10-18')).toBe('Ngày 18 tháng 10 năm 2026');
  });

  it('rỗng → chuỗi rỗng', () => {
    expect(formatDateVietnameseLong(null)).toBe('');
    expect(formatDateVietnameseLong('')).toBe('');
  });
});

describe('formatYmdToDisplay', () => {
  it('đổi YYYY-MM-DD sang DD/MM/YYYY', () => {
    expect(formatYmdToDisplay('2026-08-05')).toBe('05/08/2026');
  });

  it('trả rỗng cho giá trị rỗng', () => {
    expect(formatYmdToDisplay('')).toBe('');
    expect(formatYmdToDisplay(null)).toBe('');
    expect(formatYmdToDisplay(undefined)).toBe('');
  });

  it('giữ nguyên chuỗi không đúng dạng thay vì trả ra rác', () => {
    expect(formatYmdToDisplay('05/08/2026')).toBe('05/08/2026');
  });

  it('KHÔNG lệch ngày ở biên tháng (lý do không dùng formatDate có đổi múi giờ)', () => {
    expect(formatYmdToDisplay('2026-01-01')).toBe('01/01/2026');
    expect(formatYmdToDisplay('2026-12-31')).toBe('31/12/2026');
  });
});
