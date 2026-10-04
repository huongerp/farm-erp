import { describe, it, expect } from 'vitest';
import { dinhDangKhiGo } from './number-input-format';

const TIEN = { maxFractionDigits: 0, allowNegative: false };
const SO_LUONG = { maxFractionDigits: 2, allowNegative: false };
const AM = { maxFractionDigits: 0, allowNegative: true };

/** Gõ lần lượt từng ký tự ở cuối ô. */
function goLanLuot(chuoi: string, opts = TIEN): string {
  let text = '';
  for (const c of chuoi) {
    const raw = text + c;
    text = dinhDangKhiGo(raw, raw.length, opts).text;
  }
  return text;
}

describe('dinhDangKhiGo', () => {
  it('nhóm hàng nghìn khi gõ nối tiếp', () => {
    expect(goLanLuot('1250000')).toBe('1.250.000');
    expect(goLanLuot('999')).toBe('999');
    expect(goLanLuot('1000')).toBe('1.000');
  });

  it('con trỏ ở cuối sau khi gõ thêm chữ số', () => {
    expect(dinhDangKhiGo('1.2500', 6, TIEN)).toEqual({ text: '12.500', caret: 6 });
  });

  it('xoá một chữ số ở giữa giữ con trỏ đúng chỗ', () => {
    // "1.250.000", xoá số "2" (con trỏ đứng sau "1.") → "1.50.000"
    expect(dinhDangKhiGo('1.50.000', 2, TIEN)).toEqual({ text: '150.000', caret: 1 });
  });

  it('chèn chữ số ở giữa', () => {
    // "12.500" chèn "9" sau "1" → "192.500", con trỏ sau "9"
    expect(dinhDangKhiGo('192.500', 2, TIEN)).toEqual({ text: '192.500', caret: 2 });
    expect(dinhDangKhiGo('192.500', 2, TIEN).text.slice(0, 2)).toBe('19');
  });

  it('dán chuỗi đã có dấu chấm hoặc ký tự lạ', () => {
    expect(dinhDangKhiGo('1.250.000', 9, TIEN).text).toBe('1.250.000');
    expect(dinhDangKhiGo('1 250 000 đ', 11, TIEN).text).toBe('1.250.000');
  });

  it('bỏ số 0 thừa ở đầu', () => {
    expect(dinhDangKhiGo('0005', 4, TIEN)).toEqual({ text: '5', caret: 1 });
    expect(dinhDangKhiGo('0', 1, TIEN).text).toBe('0');
  });

  it('thập phân dùng dấu phẩy, giữ phẩy cuối đang gõ, cắt quá số chữ số', () => {
    expect(goLanLuot('1234,', SO_LUONG)).toBe('1.234,');
    expect(goLanLuot('1234,567', SO_LUONG)).toBe('1.234,56');
    expect(dinhDangKhiGo(',5', 2, SO_LUONG)).toEqual({ text: '0,5', caret: 3 });
  });

  it('ô tiền (không thập phân) bỏ dấu phẩy', () => {
    expect(dinhDangKhiGo('12,5', 4, TIEN).text).toBe('125');
  });

  it('số âm chỉ khi cho phép, dấu trừ phải đứng đầu', () => {
    expect(goLanLuot('-150000', AM)).toBe('-150.000');
    expect(goLanLuot('-150000', TIEN)).toBe('150.000');
    expect(dinhDangKhiGo('15-0', 4, AM).text).toBe('150');
  });

  it('ô rỗng', () => {
    expect(dinhDangKhiGo('', 0, TIEN)).toEqual({ text: '', caret: 0 });
  });
});
